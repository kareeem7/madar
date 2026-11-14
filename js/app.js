'use strict';
// الراوتر + التنقل + الثيم + شاشة البداية — وفي الآخر الإقلاع
// ملحوظة: الراوتر قصير بقصد، ممنوع يتمدد من غير ما يفصل لملف
const ROUTES={
 today:{fn:renderToday,n:()=>t('today'),i:'bi-sun'},
 tasks:{fn:renderTasks,n:()=>t('tasks'),i:'bi-check2-square'},
 board:{fn:renderBoard,n:()=>t('board'),i:'bi-kanban'},
 calendar:{fn:renderCalendar,n:()=>t('calendar'),i:'bi-calendar3'},
 focus:{fn:renderFocus,n:()=>t('focus'),i:'bi-stopwatch'},
 habits:{fn:renderHabits,n:()=>t('habits'),i:'bi-flower1'},
 stats:{fn:renderStats,n:()=>t('stats'),i:'bi-bar-chart'},
 notes:{fn:renderNotes,n:()=>t('notes'),i:'bi-journal-text'},
 settings:{fn:renderSettings,n:()=>t('settings'),i:'bi-gear'}};
let CUR='today';
function refreshView(anim=true){
  CLEANUPS.forEach(fn=>{try{fn()}catch(e){}});CLEANUPS.length=0;
  const key=(location.hash.replace(/^#\/?/,'')||'today').split('?')[0];
  CUR=ROUTES[key]?key:'today';
  ROUTES[CUR].fn();
  window.__baseTitle='مدار — '+ROUTES[CUR].n();updateTitle(pomoSnap());
  $$('#mainNav .md-nav').forEach(a=>a.classList.toggle('active',a.dataset.r===CUR));
  $$('#bnWrap .bn-item').forEach(a=>a.classList.toggle('active',a.dataset.r===CUR));
  closeMenus()}
addEventListener('hashchange',()=>refreshView(false));
const RERENDER=new Set(['remote','tasks-structure','tasks','habits-structure','habits','notes','sessions','views','meta','user','xp','daylog']);
subscribe(scope=>{ // ممنوع رندر كامل أثناء الكتابة أو فتح مودال
  if(scope==='settings'||scope==='lang')return;
  if(!RERENDER.has(scope))return;
  const ae=document.activeElement;
  if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT')&&$('#view').contains(ae)&&['daylog','tasks','habits','notes','user','settings','xp'].includes(scope))return;
  if($('#modalRoot').children.length&&scope!=='remote')return;
  refreshView(false)});

/* ——— التنقل ——— */
const NAV_KEYS=Object.keys(ROUTES);
function buildNav(){
  $('#mainNav').innerHTML=NAV_KEYS.map((key,index)=>`<button class="md-nav" data-r="${key}" aria-label="${ROUTES[key].n()}">
    <i class="bi ${ROUTES[key].i}"></i><span>${ROUTES[key].n()}</span><span class="n-kbd">${index+1}</span></button>`).join('');
  $$('#mainNav .md-nav').forEach(button=>{
    button.onclick=()=>{location.hash='#/'+button.dataset.r}});
  const mobileRoutes=[['today','bi-sun'],['tasks','bi-check2-square'],['focus','bi-stopwatch'],['habits','bi-flower1']];
  $('#bnWrap').innerHTML=mobileRoutes.map(([key,icon])=>`<button class="bn-item" data-r="${key}"><i class="bi ${icon}"></i><span>${ROUTES[key].n()}</span></button>`).join('')+
    `<button class="bn-item" id="bnMore"><i class="bi bi-three-dots"></i><span>أكتر</span></button>`;
  $$('#bnWrap .bn-item[data-r]').forEach(button=>{
    button.onclick=()=>{location.hash='#/'+button.dataset.r}});
  $('#bnMore').onclick=()=>{
    openModal({
      title:'أكتر',
      sheet:true,
      body:`<div class="d-flex flex-column gap-1">${['board','calendar','stats','notes','settings'].map(key=>`<button class="md-nav" data-r="${key}"><i class="bi ${ROUTES[key].i}"></i><span>${ROUTES[key].n()}</span></button>`).join('')}</div>`,
      onOpen:(md,close)=>{
        $$('.md-nav',md).forEach(button=>{
          button.onclick=()=>{close();location.hash='#/'+button.dataset.r}});
      }
    })}}

/* ——— مظهر/لغة/كثافة ——— */
window.__applyTheme=()=>{const th=S.settings.theme,h=new Date().getHours();
  const dark=th==='dark'||(th==='auto'&&(matchMedia('(prefers-color-scheme: dark)').matches||h>=19||h<6));
  document.documentElement.dataset.theme=dark?'dark':'light';
  document.documentElement.dataset.density=S.settings.density;
  document.documentElement.dataset.kiosk=S.settings.kiosk?'1':'';
  const tb=$('#themeBtn i');
  if(tb)tb.className='bi '+(S.settings.theme==='auto'?'bi-circle-half':dark?'bi-moon-stars':'bi-sun')};
window.__applyLang=()=>{const en=isEn();
  document.documentElement.lang=en?'en':'ar';
  document.documentElement.dir=en?'ltr':'rtl';
  const qa=$('#qaTopBtn span');if(qa)qa.textContent=t('quickTask');
  const sr=$('#searchTrigger span:not(.kbd)');if(sr)sr.textContent=t('searchPh');
  const pi=$('#palInput');if(pi)pi.placeholder=en?'Search tasks and notes, or type a command…':'ابحث في المهام والملاحظات أو اكتب أمر…';
  const bs=$('#brandSub');if(bs)bs.textContent=en?'Your day, in one orbit':'يومك، في مدار واحد';
  const sv=$('#savedChip');if(sv)sv.innerHTML=`<i class="bi bi-check2-all"></i> ${en?'Saved':'محفوظ'}`;
  const mm=$('#miniMode');if(mm&&P.state==='idle')mm.textContent=t('modeFocus');
  const pf=$('.pal-foot');if(pf)pf.innerHTML=en
    ?'<span><kbd class="kbd">↑↓</kbd> move</span><span><kbd class="kbd">Enter</kbd> run</span><span><kbd class="kbd">Esc</kbd> close</span>'
    :'<span><kbd class="kbd">↑↓</kbd> تنقل</span><span><kbd class="kbd">Enter</kbd> تنفيذ</span><span><kbd class="kbd">Esc</kbd> خروج</span>';
  buildNav();refreshView(false)};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(S.settings.theme==='auto')__applyTheme()});
function cycleTheme(){S.settings.theme=S.settings.theme==='auto'?'light':S.settings.theme==='light'?'dark':'auto';
  __applyTheme();emit('settings');
  toast({auto:'المظهر: تلقائي',light:'المظهر: فاتح',dark:'المظهر: غامق'}[S.settings.theme],{icon:'bi-palette'})}
function updateXP(){$('#xpVal').textContent=S.gamification.xp+' XP';
  $('#xpLevel').textContent='مستوى '+S.gamification.level;
  const base=Math.pow((S.gamification.level-1),2)*60,next=Math.pow(S.gamification.level,2)*60;
  $('#xpFill').style.width=clamp((S.gamification.xp-base)/Math.max(1,next-base)*100,0,100)+'%'}

/* ——— المؤقت المصغر + التذكيرات ——— */
onPomo(s=>{
  const mt=$('#miniTimer');const show=s.state!=='idle'&&CUR!=='focus';
  mt.hidden=!show;if(!show)return;
  mt.classList.toggle('break',s.mode!=='focus');
  $('#miniMode').textContent=s.mode==='focus'?t('modeFocus'):t('rest');
  $('#miniTime').textContent=mmss(s.remain);
  const tk=s.taskId?taskById(s.taskId):null;
  $('#miniTask').textContent=tk?tk.title:'';
  $('#miniPause i').className='bi '+(s.state==='run'?'bi-pause-fill':'bi-play-fill')});
$('#miniPause').onclick=()=>pomoToggle();
$('#miniStop').onclick=()=>pomoStop(true);
$('#miniOpen').onclick=()=>{location.hash='#/focus'};
onPomo(()=>updateXP());
const NOTIFIED=new Set();
setInterval(()=>{try{ // تذكيرات خفيفة — 3 كحد أقصى يوميًا
  const N=S.settings.notifications;
  if(!N.enabled||!('Notification'in window)||Notification.permission!=='granted')return;
  if(window.__dndActive())return;
  const ts=todayStr();const mc=S.meta.notifCount;
  if(mc.day!==ts){mc.day=ts;mc.n=0}
  if(mc.n>=3)return;
  const now=new Date();const nowM=now.getHours()*60+now.getMinutes();
  for(const tk of visTasks()){
    if(!tk.dueTime||tk.dueDate!==ts||tk.status==='done')continue;
    const tm=clockOf(tk.dueTime);const key=tk.id+ts;
    if(tm-nowM<=N.reminderLeadMin&&tm-nowM>-5&&!NOTIFIED.has(key)){
      NOTIFIED.add(key);mc.n++;
      new Notification(S.settings.lang==='en'?'MADAR — task due soon':'مدار — قرب موعد مهمة',{body:tk.title});
      emit('meta');
      if(mc.n>=3)break}}
  persist()}catch(e){}},60000);

/* ============================================================
   Onboarding — 3 خطوات تبني يومك الأول
============================================================ */
function startOnboarding(){
  const ob=$('#onboard');ob.hidden=false;
  const en=isEn();
  const state={name:'',habits:[],focus:25,short:5,long:15};
  // [اسم عربي, اسم إنجليزي, أيقونة, لون]
  const presets=[['رياضة','Exercise','bi-heart-pulse','#FF5A45'],['قراءة','Reading','bi-book','#D98E1B'],['شرب ماء','Drink water','bi-cup-straw','#2E7D6B'],['نوم بدري','Early sleep','bi-moon-stars','#64748B'],['مشي','Walking','bi-person-walking','#2E7D6B'],['تعلم لغة','Learn a language','bi-translate','#8B7BD8']];
  const arrow=en?'bi-arrow-right':'bi-arrow-left';
  const maxMsg=en?'3 habits are enough for a start — add more later':'3 عادات كفاية كبداية — زوّد بعدين';
  let step=1;
  const draw=()=>{
    ob.innerHTML=`<div class="ob-card">
    <svg class="ob-logo" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="120" fill="var(--coral)"/><circle cx="256" cy="256" r="150" fill="none" stroke="#FFF3EE" stroke-width="34"/><circle cx="256" cy="106" r="40" fill="#FFF3EE"/></svg>
    <div class="ob-dots">${[1,2,3].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div>
    ${step===1?`<h2>${en?'MADAR moves with you, not on you':'مدار بيمشي معاك، مش عليك'}</h2><p class="ob-sub">${en?'Your tasks, focus and habits — all in one place.':'مهامك وتركيزك وعاداتك — كله في مكان واحد يفهم عربي ويفهمك.'}</p>
      <label class="flabel">${en?"What's your name?":'إيه اسمك؟'}</label>
      <input class="field" id="obName" placeholder="${en?'Type your name…':'اكتب اسمك…'}" value="${esc(state.name)}" style="font-size:16px">
      <div class="m-foot" style="padding:20px 0 0"><button class="btn-coral" id="obNext" style="flex:1">${en?"Let's go":'يلا نبدأ'} <i class="bi ${arrow}"></i></button></div>
      <button class="btn btn-link w-100 mt-2 small muted" id="obSkip">${en?'Skip — fill the app with realistic demo data':'تخطّى — واملّي التطبيق ببيانات تجريبية واقعية'}</button>`:''}
    ${step===2?`<h2>${en?'Pick your first habits':'اختار عادتك الأولى'}</h2><p class="ob-sub">${en?'Only 3 habits at the start. The rest sorts itself out.':'3 عادات بس في البداية. الباقي هيتظبط لوحده.'}</p>
      <div class="preset-grid" id="obPresets">${presets.map(([ar,enN,ic,c])=>{const nm=en?enN:ar;return`<button class="preset ${state.habits.some(x=>x[0]===nm)?'on':''}" data-ar="${ar}" style="--c:${c}"><i class="bi ${ic}"></i>${nm}</button>`}).join('')}</div>
      <div class="d-flex gap-2 mt-3"><input class="field" id="obCustom" placeholder="${en?'or type a different habit…':'أو اكتب عادة مختلفة…'}"><button class="btn-soft" id="obAddCustom" aria-label="${en?'Add habit':'إضافة عادة'}"><i class="bi bi-plus"></i></button></div>
      <div class="m-foot" style="padding:20px 0 0"><button class="btn-coral" id="obNext" style="flex:1" ${state.habits.length?'':'disabled'}>${en?'Continue':'كمّل'} (${state.habits.length}/3) <i class="bi ${arrow}"></i></button></div>
      <button class="btn btn-link small muted" id="obBack">${en?'Back':'رجوع'}</button>`:''}
    ${step===3?`<h2>${en?'Your focus rhythm':'إيقاع التركيز بتاعك'}</h2><p class="ob-sub">${en?'MADAR will use these in pomodoro sessions — changeable anytime.':'مدار هيشتغل بيها في جلسات البومودورو — وتقدر تغيّرها أي وقت.'}</p>
      ${[['focus',en?'Focus length':'مدة التركيز',5,60],['short',en?'Short break':'الراحة القصيرة',1,15],['long',en?'Long break':'الراحة الطويلة',5,45]].map(([k,n,mn,mx])=>`
      <div class="range-row"><b>${n}</b><input type="range" min="${mn}" max="${mx}" step="5" value="${state[k]}" data-r="${k}"><output class="mono">${state[k]}${en?'m':'د'}</output></div>`).join('')}
      <div class="m-foot" style="padding:16px 0 0"><button class="btn-coral" id="obDone" style="flex:1"><i class="bi bi-rocket-takeoff"></i> ${en?'Set up my first day':'جهّز يومي الأول'}</button></div>
      <button class="btn btn-link small muted" id="obBack">${en?'Back':'رجوع'}</button>`:''}
    </div>`;
    const nxt=$('#obNext',ob);
    if(step===1){
      const inp=$('#obName',ob);inp.focus();
      inp.oninput=()=>{state.name=inp.value.trim()};
      const go=()=>{step=2;draw()};
      nxt.onclick=go;
      inp.onkeydown=e=>{if(e.key==='Enter')go()}}
    if(step===2){
      $$('#obPresets .preset',ob).forEach(b=>b.onclick=()=>{
        const pre=presets.find(x=>x[0]===b.dataset.ar);
        const entry=[en?pre[1]:pre[0],pre[2],pre[3]];
        const i=state.habits.findIndex(x=>x[0]===entry[0]);
        if(i>=0)state.habits.splice(i,1);
        else{
          if(state.habits.length>=3){toast(maxMsg,{icon:'bi-flower1'});return}
          state.habits.push(entry)}
        draw()});
      const cu=$('#obCustom',ob);
      $('#obAddCustom',ob).onclick=()=>{
        const val=cu.value.trim();
        if(!val)return;
        if(state.habits.length>=3){toast(en?'3 habits are enough for a start':'3 عادات كفاية كبداية',{icon:'bi-flower1'});return}
        state.habits.push([val,'bi-star','#2E7D6B']);draw()};
      $('#obNext',ob).onclick=()=>{step=3;draw()}}
    if(step===3){
      $$('input[type=range]',ob).forEach(r=>r.oninput=()=>{
        state[r.dataset.r]=+r.value;
        r.nextElementSibling.textContent=r.value+(en?'m':'د')});
      $('#obDone',ob).onclick=()=>{
        const st=firstDayState(state.name,state.habits,{focus:state.focus,short:state.short,long:state.long});
        for(const k of Object.keys(S))delete S[k];
        Object.assign(S,st);
        persist();ob.hidden=true;__applyTheme();__applyLang();
        location.hash='#/today';refreshView();
        toast(en?`Welcome${state.name?' '+state.name:''}! Your first day is ready — start a focus session.`:`أهلًا${state.name?' يا '+state.name:''}! يومك الأول جاهز — ابدأ بجلسة تركيز.`,{icon:'bi-stars'})}}
    const back=$('#obBack',ob);
    if(back)back.onclick=()=>{step--;draw()};
    const skip=$('#obSkip',ob);
    if(skip)skip.onclick=()=>{
      const st=seedFull();
      for(const k of Object.keys(S))delete S[k];
      Object.assign(S,st);
      persist();ob.hidden=true;__applyTheme();__applyLang();
      location.hash='#/today';refreshView();
      toast(en?'We prepared a realistic demo day — explore at your pace':'جهّزنا لك يوم تجريبي واقعي — اتفرّج وجرب براحتك',{icon:'bi-stars'})}};
  draw()}

/* ============================================================
   الإقلاع
============================================================ */
$('#qaTopBtn').onclick=()=>openQuickAdd(CUR==='today'?todayStr():null);
$('#searchTrigger').onclick=openPalette;
$('#themeBtn').onclick=cycleTheme;
$('#avatarBtn').onclick=()=>{location.hash='#/settings'};
addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__pwadefer=e});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol)){
  navigator.serviceWorker.register('sw.js').catch(()=>{})}
function bootTop(){const d=new Date();
  $('#dateChip').textContent=isEn()
    ? d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'})
    : `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  $('#avatarBtn').textContent=(S.user.name||'M').trim()[0]||'M';updateXP()}
__applyTheme();__applyLang();bootTop(); // __applyLang بتبني القوائم وترسم الشاشة
initDB();
if(!S.user.onboarded)startOnboarding();
else{location.hash=location.hash||'#/today';refreshView()}
setInterval(()=>{if(S.settings.theme==='auto')__applyTheme()},15*60000);
