'use strict';
// مؤقت التركيز: الوقت محسوب من endsAt (مش setInterval عشان النوم/إغلاق التاب)
// وتحته مولّد الأصوات (Web Audio — مفيش ملفات صوت خالص)
const P={state:'idle',mode:'focus',taskId:null,endsAt:0,remain:0,cycle:0,startedAt:0,totalMs:0,_t:null,_lastMin:-1};
const pomoSubs=new Set();
const onPomo=fn=>{pomoSubs.add(fn);return()=>pomoSubs.delete(fn)};
const pomoTotalMin=mode=>S.settings.pomodoro[mode==='focus'?'focus':mode==='short'?'short':'long'];
function pomoSnap(){let remain=P.remain;
  if(P.state==='run')remain=P.endsAt-Date.now();
  return{state:P.state,mode:P.mode,remain:Math.max(0,remain),total:P.totalMs,taskId:P.taskId,cycle:P.cycle}}
function notifyPomo(){const s=pomoSnap();pomoSubs.forEach(f=>{try{f(s)}catch(e){}});updateTitle(s)}

function pomoStart(taskId,mode='focus'){
  P.mode=mode;P.taskId=taskId||P.taskId;const mins=pomoTotalMin(mode);
  P.totalMs=mins*60000;P.endsAt=Date.now()+P.totalMs;P.startedAt=Date.now();P.state='run';P.remain=P.totalMs;
  localStorage.setItem('madar:draft',JSON.stringify({taskId:P.taskId,type:mode,startedAt:P.startedAt,plannedMin:mins}));
  startTick();ambStart(S.settings.pomodoro.ambience);notifyPomo();
  const tk=taskById(P.taskId);
  if(tk&&tk.status==='todo'){tk.status='doing';emit('tasks')}
  announce(mode==='focus'?`بدأت جلسة تركيز ${mins} دقيقة`:`بدأت راحة ${mins} دقيقة`)}
function pomoPause(){if(P.state!=='run')return;P.remain=P.endsAt-Date.now();P.state='paused';stopTick();ambStop();notifyPomo();announce('المؤقت متوقف مؤقتًا')}
function pomoResume(){if(P.state!=='paused')return;P.endsAt=Date.now()+P.remain;P.state='run';startTick();ambStart(S.settings.pomodoro.ambience);notifyPomo()}
function pomoToggle(taskId){
  if(P.state==='idle')pomoStart(taskId||firstFocusTaskId(),'focus');
  else if(P.state==='run')pomoPause();
  else if(P.state==='paused')pomoResume()}
function pomoStop(recordPartial=true){ // إنهاء يدوي — يسجّل الجزء الحقيقي فقط
  if(P.state==='idle')return;
  const elapsed=P.state==='run'?P.totalMs-(P.endsAt-Date.now()):P.totalMs-P.remain;
  if(recordPartial&&elapsed>=45000)recordSession(false,elapsed);
  localStorage.removeItem('madar:draft');
  P.state='idle';P.remain=0;stopTick();ambStop();notifyPomo()}
function pomoComplete(){
  recordSession(true,P.totalMs);
  localStorage.removeItem('madar:draft');
  if(S.settings.pomodoro.sound==='bell')bell();
  const en=isEn();
  if(P.mode==='focus'){addXp(20);P.cycle++;
    const long=P.cycle%S.settings.pomodoro.cyclesBeforeLong===0;
    const nx=long?'long':'short';
    toast(long?(en?'Full session done! Take a long break — drink water, stretch your back.':'جلسة كاملة! خد راحة طويلة — قوم اشرب مية وافرد ضهرك.')
      :(en?'Well done! Short break time. The work will not run away.':'أحسنت! وقت راحة قصيرة. الشغل مش هيهرب.'),{icon:'bi-cup-hot'});
    if(S.settings.pomodoro.autoStartBreak)pomoStart(P.taskId,nx);
    else{P.state='idle';P.mode=nx;P.remain=pomoTotalMin(nx)*60000;P.totalMs=P.remain;stopTick();notifyPomo()}}
  else{
    toast(en?'Break is over — back to focus?':'الراحة خلصت — نرجع للتركيز؟',{icon:'bi-bullseye'});
    if(S.settings.pomodoro.autoStartFocus)pomoStart(P.taskId,'focus');
    else{P.state='idle';P.mode='focus';P.remain=pomoTotalMin('focus')*60000;P.totalMs=P.remain;stopTick();notifyPomo()}}}
function recordSession(completed,elapsedMs){
  const actualMin=Math.max(1,Math.round(elapsedMs/60000));
  idbAdd({id:uid(),taskId:P.taskId||null,type:P.mode,startedAt:P.startedAt,endedAt:Date.now(),
    plannedMin:pomoTotalMin(P.mode),actualMin:completed?pomoTotalMin(P.mode):actualMin,completed});
  if(P.mode==='focus'&&P.taskId){const tk=taskById(P.taskId);
    if(tk){tk.focusSeconds+=(completed?P.totalMs:elapsedMs)/1000;emit('tasks')}}}
function startTick(){stopTick();
  P._t=setInterval(()=>{ // للمعاينة فقط — المرجع endsAt
    const remain=P.endsAt-Date.now();
    if(remain<=0){pomoComplete();return}
    const min=Math.ceil(remain/60000);
    if(min!==P._lastMin){P._lastMin=min;
      const modeAr=P.mode==='focus'?'تركيز':'راحة';
      const lv=$('#timerLive');if(lv)lv.textContent=`${modeAr}: باقي ${min} دقيقة`}
    if(S.settings.pomodoro.tick&&P.mode==='focus')softTick();
    notifyPomo()},250)}
function stopTick(){clearInterval(P._t);P._t=null;P._lastMin=-1}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&P.state==='run'){
  if(Date.now()>=P.endsAt)pomoComplete();else notifyPomo()}});
/* استرجاع جلسة ضاعت بسبب إغلاق الصفحة — تُسجَّل جزئية بالمدة الحقيقية */
(function recoverDraft(){try{const d=JSON.parse(localStorage.getItem('madar:draft')||'null');if(!d)return;
  const elapsed=Date.now()-d.startedAt;const clipped=Math.min(elapsed,d.plannedMin*60000);
  if(clipped>=45000){P.mode=d.type;P.taskId=d.taskId;P.startedAt=d.startedAt;
    idbAdd({id:uid(),taskId:d.taskId,type:d.type,startedAt:d.startedAt,endedAt:d.startedAt+clipped,plannedMin:d.plannedMin,actualMin:Math.round(clipped/60000),completed:elapsed>=d.plannedMin*60000});
    if(d.type==='focus'&&d.taskId){const tk=taskById(d.taskId);if(tk)tk.focusSeconds+=clipped/1000}}
  localStorage.removeItem('madar:draft')}catch(e){}})();
window.addEventListener('beforeunload',()=>{if(P.state==='run'){
  const elapsed=P.totalMs-(P.endsAt-Date.now());
  if(elapsed>=45000){try{const d=JSON.parse(localStorage.getItem('madar:draft')||'{}');
    idbAdd({id:uid(),taskId:d.taskId||null,type:d.type||'focus',startedAt:d.startedAt||Date.now()-elapsed,endedAt:Date.now(),plannedMin:d.plannedMin||25,actualMin:Math.round(elapsed/60000),completed:false})}catch(e){}}}});
function firstFocusTaskId(){const x=todayTasks().find(tk=>tk.status!=='done');return x?x.id:null}
function updateTitle(snap){const base=window.__baseTitle||'مدار';
  if(snap.state==='run')document.title=`(${mmss(snap.remain)}) ${snap.mode==='focus'?'تركيز':'راحة'} — ${base}`;
  else if(snap.state==='paused')document.title=`موقوف — ${base}`;
  else document.title=base}

/* ——— الأصوات: Web Audio بدون أي ملفات ——— */
let AC=null,ambNodes=null;
function ensureCtx(){if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}
  if(AC&&AC.state==='suspended')AC.resume();return AC}
function bell(){const ac=ensureCtx();if(!ac)return;const now=ac.currentTime;
  [880,1318.5,1760].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.value=f;o.connect(g);g.connect(ac.destination);
    g.gain.setValueAtTime(0,now+i*.06);g.gain.linearRampToValueAtTime(.18/(i+1),now+i*.06+.015);
    g.gain.exponentialRampToValueAtTime(.0001,now+i*.06+1.6);o.start(now+i*.06);o.stop(now+i*.06+1.7)})}
function softTick(){const ac=ensureCtx();if(!ac)return;const tm=ac.currentTime;
  const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=1900;
  g.gain.setValueAtTime(.008,tm);g.gain.exponentialRampToValueAtTime(.0001,tm+.04);
  o.connect(g);g.connect(ac.destination);o.start(tm);o.stop(tm+.05)}
function noiseBuffer(ac,brown){const len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),out=buf.getChannelData(0);
  let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;
    if(brown){last=(last+.02*w)/1.02;out[i]=last*3.5}else out[i]=w*.5}return buf}
function ambStop(){if(ambNodes){try{ambNodes.src.stop();ambNodes.nodes.forEach(n=>n.disconnect())}catch(e){}ambNodes=null}}
function ambStart(kind){ // rain / cafe / brown / white
  ambStop();if(!kind||kind==='none')return;const ac=ensureCtx();if(!ac)return;
  const vol=S.settings.pomodoro.ambVol??.5;
  const g=ac.createGain();g.gain.value=0;g.connect(ac.destination);
  g.gain.linearRampToValueAtTime(vol*.5,ac.currentTime+1.2);
  const nodes=[g];
  const mk=(brown,filterType,freq,q,gain)=>{const src=ac.createBufferSource();
    src.buffer=noiseBuffer(ac,brown);src.loop=true;
    const f=ac.createBiquadFilter();f.type=filterType;f.frequency.value=freq;f.Q.value=q;
    const gg=ac.createGain();gg.gain.value=gain;src.connect(f);f.connect(gg);gg.connect(g);
    src.start();nodes.push(src,f,gg);return gg};
  if(kind==='rain'){mk(false,'bandpass',1700,.4,.7);mk(false,'lowpass',500,1,.5)}
  else if(kind==='cafe'){mk(true,'lowpass',480,1,.9);const mm=mk(false,'bandpass',900,2,.12);
    const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=.13;lg.gain.value=.07;
    lfo.connect(lg);lg.connect(mm.gain);lfo.start();nodes.push(lfo,lg)}
  else if(kind==='brown')mk(true,'lowpass',900,1,1);
  else mk(false,'highpass',400,1,.8);
  ambNodes={src:nodes[1],nodes,g}}
function ambSetVol(v){if(ambNodes&&AC)ambNodes.g.gain.linearRampToValueAtTime(v*.5,AC.currentTime+.15)}
window.__dndActive=()=>S.settings.pomodoro.dnd&&(P.state==='run'||P.state==='paused');
