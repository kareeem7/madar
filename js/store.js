'use strict';
/* المخزن الرئيسي: الحالة + persist + مزامنة التبويبات
   تحته: IndexedDB للجلسات + الجيميفيكيشن + البيانات التجريبية */
const STORE_KEY='madar:state';
const listeners=new Set();
const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn)};
function defaultSettings(){return{
  theme:'auto',lang:'en',density:'comfort',kiosk:false,
  pomodoro:{focus:25,short:5,long:15,cyclesBeforeLong:4,autoStartBreak:true,autoStartFocus:false,sound:'bell',tick:false,ambience:'none',ambVol:.5,dnd:false,dailyTargetMinutes:180},
  notifications:{enabled:false,reminderLeadMin:10,dailyDigest:true,digestTime:'21:00'}}}
function emptyState(){return{version:1,
  user:{name:'',avatarEmoji:'',onboarded:false,tz:Intl.DateTimeFormat().resolvedOptions().timeZone||'Africa/Cairo'},
  settings:defaultSettings(),
  projects:[],lists:[{id:'inbox',name:'الوارد',emoji:'inbox',order:0}],
  tasks:[],habits:[],dayLogs:{},notes:[],
  gamification:{xp:0,level:1,achievements:[]},
  views:[],meta:{lastBackup:null,notifCount:{day:'',n:0},createdAt:todayStr(),dismissedSuggest:{}}}}
function migrate(s){ // Migration: نحافظ على بيانات المستخدم عبر الإصدارات
  if(!s||typeof s!=='object')return emptyState();
  const base=emptyState();const out={...base,...s};
  out.user={...base.user,...s.user};out.settings={...base.settings,...s.settings};
  out.settings.pomodoro={...base.settings.pomodoro,...(s.settings||{}).pomodoro};
  out.settings.notifications={...base.settings.notifications,...(s.settings||{}).notifications};
  out.gamification={...base.gamification,...s.gamification};out.meta={...base.meta,...s.meta};
  for(const k of['projects','lists','tasks','habits','notes'])if(!Array.isArray(out[k]))out[k]=[];
  for(const tk of out.tasks){tk.tags=tk.tags||[];tk.subtasks=tk.subtasks||[];if(tk.focusSeconds==null)tk.focusSeconds=0;if(!tk.status)tk.status='todo'}
  for(const h of out.habits){h.entries=h.entries||{};h.skips=h.skips||[]}
  out.version=1;return out}
function loadState(){try{const raw=localStorage.getItem(STORE_KEY);if(raw)return migrate(JSON.parse(raw))}catch(e){}return emptyState()}
const S=loadState();
window.S=S;

let saveT=null;
function persist(){clearTimeout(saveT);saveT=setTimeout(()=>{
  try{localStorage.setItem(STORE_KEY,JSON.stringify(S));
    const lb=S.meta.lastBackup;
    if(!lb||cmpD(todayStr(),addDaysStr(lb,7))>=0){ // نسخة احتياطية أسبوعية
      try{localStorage.setItem('madar:backup:'+todayStr(),JSON.stringify(S));
        S.meta.lastBackup=todayStr();localStorage.setItem(STORE_KEY,JSON.stringify(S))}catch(e){}}
    pulseSaved();
  }catch(e){S.meta.quotaWarn=true}
  if(S.meta.quotaWarn){S.meta.quotaWarn=false;showQuotaWarn()}
},300)}
function pulseSaved(){const c=$('#savedChip');if(!c)return;c.classList.add('show');clearTimeout(c._t);c._t=setTimeout(()=>c.classList.remove('show'),1400)}
function emit(scope='*'){persist();listeners.forEach(fn=>{try{fn(scope)}catch(e){}})}
function showQuotaWarn(){if($('#quotaWarn'))return;const ob=$('#onboard');if(ob&&!ob.hidden)return;
  const d=document.createElement('div');d.id='quotaWarn';d.className='storage-warn';
  d.innerHTML='<i class="bi bi-exclamation-triangle-fill"></i><span>مساحة التخزين قربت تخلص — نزّل نسخة احتياطية من الإعدادات.</span>';
  const btn=document.createElement('button');btn.className='btn-soft sm';btn.style.minHeight='30px';btn.style.marginInlineStart='auto';btn.textContent='تنزيل نسخة';
  btn.onclick=()=>{exportJSON();d.remove()};d.appendChild(btn);
  const v=$('#view');if(v)v.prepend(d)}

/* مزامنة بين التبويبات */
window.addEventListener('storage',e=>{
  if(e.key!==STORE_KEY||!e.newValue)return;
  try{const fresh=migrate(JSON.parse(e.newValue));
    for(const k of Object.keys(S))delete S[k];Object.assign(S,fresh);
    if(window.__applyTheme)__applyTheme();
    emit('remote');
  }catch(err){}
});

/* ——— IndexedDB: سجل الجلسات (مع كاش في الذاكرة) ——— */
let _db=null,SES=[];
function idbOpen(){return new Promise(res=>{
  try{const rq=indexedDB.open('madar-db',1);
    rq.onupgradeneeded=()=>{const db=rq.result;if(!db.objectStoreNames.contains('sessions'))db.createObjectStore('sessions',{keyPath:'id'})};
    rq.onsuccess=()=>res(rq.result);rq.onerror=()=>res(null);
  }catch(e){res(null)}})}
async function initDB(){_db=await idbOpen();if(!_db)return;
  try{const tx=_db.transaction('sessions','readonly');const rq=tx.objectStore('sessions').getAll();
    rq.onsuccess=()=>{SES=rq.result||[];SES.sort((a,b)=>a.startedAt-b.startedAt);emit('sessions')}}catch(e){}}
function idbAdd(ses){SES.push(ses);SES.sort((a,b)=>a.startedAt-b.startedAt);emit('sessions');
  if(!_db)return;try{const tx=_db.transaction('sessions','readwrite');tx.objectStore('sessions').put(ses)}catch(e){}}
function idbClear(){SES=[];if(!_db)return;try{const tx=_db.transaction('sessions','readwrite');tx.objectStore('sessions').clear()}catch(e){}}

/* ——— النقاط والإنجازات ——— */
const levelOf=xp=>Math.floor(Math.sqrt(xp/60))+1;
function addXp(n){S.gamification.xp+=n;const lv=levelOf(S.gamification.xp);
  if(lv>S.gamification.level){S.gamification.level=lv;toast(isEn()?`Level ${lv} reached! Nice work.`:`وصلت مستوى ${lv}! شغل نضيف.`,{icon:'bi-stars'})}
  checkAchievements();emit('xp')}
const ACH=[
 {id:'first_focus',n:'أول جلسة تركيز',test:()=>SES.some(s=>s.type==='focus')},
 {id:'streak7',n:'سلسلة 7 أيام',test:()=>S.habits.some(h=>h.streakCache>=7)},
 {id:'focus10h',n:'10 ساعات تركيز',test:()=>SES.filter(s=>s.type==='focus').reduce((a,s)=>a+s.actualMin,0)>=600},
 {id:'day_done',n:'يوم مكتمل',test:()=>{const hs=scheduledHabits(todayStr());const tt=todayTasks();
   return hs.length>0&&tt.length>0&&hs.every(h=>habitDoneOn(h,todayStr()))&&tt.every(x=>x.status==='done')}},
];
function checkAchievements(){for(const a of ACH){if(!S.gamification.achievements.includes(a.id)&&a.test()){S.gamification.achievements.push(a.id);setTimeout(()=>toast((isEn()?'New achievement: ':'إنجاز جديد: ')+a.n,{icon:'bi-trophy'}),600)}}}

/* ============================================================
   بيانات البذر — واقعية (3 مشاريع + 12 مهمة + 4 عادات + 5 ملاحظات)
============================================================ */
function seedFull(){const ts=todayStr(),yes=addDaysStr(ts,-1),tmr=addDaysStr(ts,1),after=addDaysStr(ts,2);
  const st=emptyState();
  st.user={name:'أحمد',avatarEmoji:'',onboarded:true,tz:st.user.tz};
  const en0=typeof isEn==='function'?isEn():false;
  st.projects=[
   {id:'p-work',name:en0?'Work':'شغل',color:'#2E7D6B',icon:'bi-briefcase',archived:false},
   {id:'p-self',name:en0?'Personal':'شخصي',color:'#FF5A45',icon:'bi-person',archived:false},
   {id:'p-learn',name:en0?'Learning':'تعلم',color:'#D98E1B',icon:'bi-book',archived:false}];
  let o=0;
  const en=typeof isEn==='function'?isEn():false;
  const pick=(ar,enT)=>en?enT:ar;
  const mk=(title,extra={})=>({id:uid()+o++,title,notes:'',projectId:null,listId:'inbox',tags:[],priority:4,
    dueDate:null,dueTime:null,estimateMin:0,status:'todo',completedAt:null,order:o,recurrence:null,
    subtasks:[],blockedBy:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),focusSeconds:0,...extra});
  st.tasks=[
   mk(pick('مراجعة عرض المشروع قبل الاجتماع','Review the project deck before the meeting'),{projectId:'p-work',priority:1,dueDate:ts,dueTime:'10:00',estimateMin:60,tags:[pick('اجتماعات','meetings')]}),
   mk(pick('الرد على إيميلات العملاء المعلّقة','Reply to pending client emails'),{projectId:'p-work',priority:2,dueDate:ts,estimateMin:30}),
   mk(pick('تمرين جري 30 دقيقة','30-min morning jog'),{projectId:'p-self',priority:2,dueDate:ts,dueTime:'07:00',estimateMin:30,tags:[pick('صحة','health')]}),
   mk(pick('قراءة 20 صفحة من كتاب العادات الذرية','Read 20 pages of Atomic Habits'),{projectId:'p-learn',priority:3,dueDate:ts,estimateMin:25,recurrence:{type:'daily'}}),
   mk(pick('شراء مستلزمات البيت','Buy home supplies'),{projectId:'p-self',priority:3,dueDate:ts,tags:[pick('بيت','home')],subtasks:[{id:uid(),title:pick('منظفات','Cleaner'),done:true},{id:uid(),title:pick('فواكه','Fruits'),done:false},{id:uid(),title:pick('خبز','Bread'),done:false}]}),
   mk(pick('تسليم تقرير الأسبوع','Submit the weekly report'),{projectId:'p-work',priority:2,dueDate:yes,estimateMin:45}),
   mk(pick('اتصل بالميكانيكي بخصوص العربية','Call the mechanic about the car'),{projectId:'p-self',priority:3,dueDate:yes,estimateMin:10}),
   mk(pick('إنهاء درس Grid في كورس CSS','Finish the Grid lesson in the CSS course'),{projectId:'p-learn',priority:2,dueDate:tmr,estimateMin:40,tags:[pick('كورس','course')]}),
   mk(pick('تحضير خطة محتوى الشهر الجاي',"Draft next month's content plan"),{projectId:'p-work',priority:3,dueDate:tmr,estimateMin:90}),
   mk(pick('حجز تذاكر السفر','Book flight tickets'),{projectId:'p-self',priority:4,dueDate:after}),
   mk(pick('تجربة وصفة قهوة مختصة جديدة','Try a new specialty coffee recipe'),{priority:4,tags:[pick('تجارب','try-outs')]}),
   mk(pick('ترتيب المكتبة وركن القراءة','Organize the bookshelf and reading nook'),{priority:4}),
  ];
  st.tasks[0].status='doing';
  const mkH=(name,icon,color,type,schedule,extra={})=>({id:uid(),name,icon,color,type,target:1,unit:'',schedule,cue:'',reminderTime:'',createdAt:addDaysStr(ts,-40),order:0,entries:{},skips:[],...extra});
  st.habits=[
   mkH(pick('رياضة','Exercise'),'bi-heart-pulse','#FF5A45','build',{type:'weekdays',weekdays:[0,2,4]},{cue:pick('بعد قهوة الصبح','after morning coffee')}),
   mkH(pick('قراءة','Reading'),'bi-book','#D98E1B','build',{type:'daily'},{target:1,cue:pick('قبل النوم','before sleep'),reminderTime:'21:30'}),
   mkH(pick('شرب ماء','Drink water'),'bi-cup-straw','#2E7D6B','counter',{type:'daily'},{target:8,unit:pick('كوب','cup')}),
   mkH(pick('نوم بدري','Early sleep'),'bi-moon-stars','#64748B','build',{type:'daily'},{reminderTime:'23:00'}),
  ];
  const fillH=(h,prob)=>{for(let i=1;i<=30;i++){const ds=addDaysStr(ts,-i);const d=parseD(ds);
    if(h.schedule.type==='weekdays'&&!h.schedule.weekdays.includes(d.getDay()))continue;
    const r=(Math.sin(i*7.3+h.id.length)+1)/2;
    if(h.type==='counter'){const v=r>0.3?Math.round(5+r*4):Math.round(r*4);if(v>0)h.entries[ds]={value:v,note:''}}
    else if(r<prob)h.entries[ds]={value:1,note:''}};
    if(h.id===st.habits[0].id)h.skips=[addDaysStr(ts,-6)]};
  fillH(st.habits[0],.85);fillH(st.habits[1],.6);fillH(st.habits[2],1);fillH(st.habits[3],.7);
  st.habits[1].skips=[addDaysStr(ts,-3)];
  st.notes=[
   {id:uid(),title:'أفكار لمشروع جانبي',body:'- أداة تحويل ملاحظات الميتنجز لتاسكات تلقائي\n- نشرة أسبوعية عن إنتاجية المطورين العرب',tags:['أفكار'],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
   {id:uid(),title:'كتب عايز أقراها',body:'العادات الذرية · عمل عميق · التفكير السريع والبطيء',tags:['قراءة'],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
   {id:uid(),title:'ملاحظات اجتماع الأحد',body:'العميل عايز النسخة الأولى قبل نهاية الشهر. نركّز على تدفق الدفع أولاً.',tags:['شغل'],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
   {id:uid(),title:'وصفة قهوة V60',body:'15 جرام بن · 250 مل ماء 92° · صب على 3 مراحل',tags:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
   {id:uid(),title:'',body:'فكرة: أعمل بودكاست قصير عن أدوات الشغل عن بعد؟',tags:['أفكار'],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
  ];
  st.dayLogs[yes]={water:6,mood:4,journal:'خلّصت العرض قبل معاده الحمد لله.',shutdownDone:true};
  st.dayLogs[ts]={water:3,mood:0,journal:'',shutdownDone:false};
  st.gamification.xp=140;
  return st}
/* أول يوم بعد الـ Onboarding */
function firstDayState(name,habitNames,pomo){const st=emptyState();
  const en=st.settings.lang!=='ar';
  st.user.name=name||(en?'friend':'صديقي');st.user.onboarded=true;
  st.settings.pomodoro={...st.settings.pomodoro,...pomo};
  st.projects=[{id:'p-self',name:en?'Personal':'شخصي',color:'#FF5A45',icon:'bi-person',archived:false},
    {id:'p-work',name:en?'Work':'شغل',color:'#2E7D6B',icon:'bi-briefcase',archived:false}];
  // habitNames ممكن تيجي نص أو [name,icon,color] من شاشة البداية
  let o=0;
  st.habits=habitNames.slice(0,5).map(h=>{const nm=Array.isArray(h)?h[0]:h;const ic=Array.isArray(h)?h[1]:'bi-star';const cl=Array.isArray(h)?h[2]:'#2E7D6B';
    const isWater=/ماء|water/i.test(nm);
    return{id:uid(),name:nm,icon:ic,color:cl,type:isWater?'counter':'build',target:isWater?8:1,unit:isWater?(en?'cup':'كوب'):'',schedule:{type:'daily'},cue:'',reminderTime:'',createdAt:todayStr(),order:o++,entries:{},skips:[]}});
  st.tasks=[{id:uid(),title:en?'Try your first MADAR focus session':'جرّب أول جلسة تركيز في مدار',notes:'',projectId:null,listId:'inbox',tags:[],priority:2,dueDate:todayStr(),dueTime:null,estimateMin:25,status:'todo',completedAt:null,order:0,recurrence:null,subtasks:[],blockedBy:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),focusSeconds:0}];
  st.notes=[{id:uid(),title:en?'Quick notes':'ملاحظاتي السريعة',body:en?'Write any idea here… convert it to a task when it is time.':'اكتب أي فكرة هنا… وحوّلها لمهمة لو لقت وقتها.',tags:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];
  st.dayLogs[todayStr()]={water:0,mood:0,journal:'',shutdownDone:false};
  return st}
