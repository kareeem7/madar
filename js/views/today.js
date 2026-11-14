'use strict';
// شاشة اليوم — أهم شاشة في التطبيق
// فيها كمان taskRow() المشترك بين شاشات كتير + قفل اليوم
function ringSVG(pct,color,size=72,sw=8){const r=(size-sw)/2,c=2*Math.PI*r;
  return`<div class="ring-wrap"><svg class="ring-svg" viewBox="0 0 ${size} ${size}">
   <circle class="bgc" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${sw}"/>
   <circle class="fgc" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c*(1-clamp(pct,0,100)/100)}"/>
  </svg><div class="ring-num mono" style="font-size:${size>80?20:16}px">${Math.round(pct)}%</div></div>`}
function animateRings(root){requestAnimationFrame(()=>requestAnimationFrame(()=>{
  $$('.fgc',root).forEach(el=>{el.style.strokeDashoffset=el.dataset.off})}))}

function taskRow(tk,{big=false,selectable=false}={}){
  const p=projById(tk.projectId);
  const done=tk.status==='done';
  const ts=todayStr(),en=isEn();
  const est=tk.estimateMin?`<span class="chip mono"><i class="bi bi-clock"></i>${fmtMin(tk.estimateMin)}</span>`:'';
  const fsec=tk.focusSeconds>=300?`<span class="chip teal mono" title="${en?'Logged focus time':'وقت تركيز فعلي'}"><i class="bi bi-bullseye"></i>${fmtMin(tk.focusSeconds/60)}</span>`:'';
  const due=tk.dueDate?(tk.dueDate<ts?`<span class="chip coral"><i class="bi bi-exclamation-circle"></i>${en?'overdue':'متأخرة'}</span>`
    :tk.dueDate===ts?`<span class="chip amber"><i class="bi bi-sun"></i>${en?'Today':'النهاردة'}${tk.dueTime?' '+tk.dueTime:''}</span>`
    :`<span class="chip"><i class="bi bi-calendar3"></i>${tk.dueDate===addDaysStr(ts,1)?(en?'tmrw':'بكرة'):en?new Date(parseD(tk.dueDate)).toLocaleDateString('en-US',{day:'numeric',month:'short'}):parseD(tk.dueDate).getDate()+' '+MONTHS[parseD(tk.dueDate).getMonth()]}${tk.dueTime?' '+tk.dueTime:''}</span>`):'';
  const prio=tk.priority<4?`<span class="prio-flag p${tk.priority}"><i class="bi bi-flag-fill"></i>P${tk.priority}</span>`:'';
  const subs=tk.subtasks?.length?`<span class="chip"><i class="bi bi-check2-square"></i>${tk.subtasks.filter(s=>s.done).length}/${tk.subtasks.length}</span>`:'';
  const rec=tk.recurrence?`<span class="chip"><i class="bi bi-arrow-repeat"></i></span>`:'';
  const tags=(tk.tags||[]).map(x=>`<span class="tag-pill">#${esc(x)}</span>`).join('');
  return`<div class="task-row ${big?'big':''} ${done?'is-done':''}" data-id="${tk.id}" tabindex="0" role="group" aria-label="${esc(tk.title)}">
   ${selectable?`<input type="checkbox" class="form-check-input row-check mass" data-mid="${tk.id}" aria-label="${en?'Bulk select':'تحديد جماعي'}">`:''}
   <button class="tcheck p${tk.priority} ${done?'done':''}" data-act="toggle" role="checkbox" aria-checked="${done}" aria-label="${done?(en?'Uncomplete':'إلغاء إكمال'):(en?'Complete':'إكمال')} ${esc(tk.title)}"><i class="bi bi-check-lg"></i></button>
   <div class="t-main"><div class="t-title">${esc(tk.title)}</div>
    ${(est||due||prio||subs||rec||tags||p||fsec)?`<div class="t-meta">${prio}${due}${p?`<span class="chip"><span class="dot" style="--c:${p.color}"></span>${esc(p.name)}</span>`:''}${tags}${est}${fsec}${subs}${rec}</div>`:''}</div>
   <div class="t-acts">
     <button class="icon-btn always" data-act="focus" title="${en?'Focus on this':'ابدأ تركيز على المهمة'}" aria-label="${en?'Focus on':'تركيز على'} ${esc(tk.title)}"><i class="bi bi-play-fill"></i></button>
     <button class="icon-btn" data-act="menu" aria-label="${en?'Task options':'خيارات المهمة'}" aria-expanded="false"><i class="bi bi-three-dots"></i></button>
   </div></div>`}
function bindTaskRows(root){
  $$('.task-row',root).forEach(row=>{
    const id=row.dataset.id;
    row.addEventListener('click',event=>{
      const actionButton=event.target.closest('[data-act]');
      if(event.target.closest('.mass'))return;
      if(!actionButton){selectRow(row);return}
      const action=actionButton.dataset.act;
      if(action==='toggle'){
        const task=taskById(id);
        if(!task)return;
        if(task.status==='done'){uncompleteTask(id);return}
        row.classList.add('completing');
        setTimeout(()=>completeTask(id),REDUCED?0:230);
      }
      if(action==='focus'){pomoStart(id,'focus');location.hash='#/focus'}
      if(action==='menu')openTaskMenu(actionButton,id);
    });
    row.addEventListener('keydown',event=>{
      if(event.key===' '&&!event.target.closest('button,input')){
        event.preventDefault();
        const task=taskById(id);
        if(task){
          if(task.status==='done')uncompleteTask(id);
          else{row.classList.add('completing');setTimeout(()=>completeTask(id),230)}
        }
      }
      if(event.key==='e'||event.key==='E'){event.preventDefault();openTaskEditor(id)}
      if(event.key==='Delete'){event.preventDefault();deleteTask(id)}
    });
  })}
function selectRow(row){$$('.task-row.sel').forEach(r=>r.classList.remove('sel'));row.classList.add('sel');row.focus()}
function openTaskMenu(btn,id){const tk=taskById(id);if(!tk)return;
  const en=isEn();
  openMenu(btn,[
   {label:en?'Start focus session':'ابدأ جلسة تركيز',icon:'bi-play-fill',fn:()=>{pomoStart(id,'focus');location.hash='#/focus'}},
   {label:t('edit'),icon:'bi-pencil',fn:()=>openTaskEditor(id)},
   {label:tk.status==='doing'?(en?'Stop working on it':'أوقف الشغل عليها'):(en?'Start working on it':'ابدأ الشغل عليها'),icon:'bi-lightning-charge',fn:()=>updateTask(id,{status:tk.status==='doing'?'todo':'doing'})},
   '-',
   {label:en?'Postpone to tomorrow':'أجّلها لبكرة',icon:'bi-calendar-plus',fn:()=>{updateTask(id,{dueDate:addDaysStr(todayStr(),1)},'tasks-structure');toast(en?'Postponed to tomorrow':'اتأجلت لبكرة')}},
   {label:en?'No date':'بدون موعد',icon:'bi-calendar-x',fn:()=>updateTask(id,{dueDate:null,dueTime:null},'tasks-structure')},
   {label:en?'Archive':'أرشفة',icon:'bi-archive',fn:()=>{updateTask(id,{status:'archived'},'tasks-structure');toast(en?'Archived':'في الأرشيف')}},
   {label:t('del'),icon:'bi-trash',danger:true,fn:()=>deleteTask(id)}])}

// السطر الذكي تحت الترحيب — تركيبته بتفرق بين عربي وإنجليزي
function smartLine(active,doneN,focusMin,target,bestStreak){
  if(isEn()){
    const left=Math.max(0,target-focusMin);
    return `You have <b>${active.length}</b> tasks${doneN?' ('+doneN+' done)':''} · <b>${focusMin>=target?'focus goal hit':fmtMin(left)+' focus left'}</b> · <b>${bestStreak}</b>-day streak.`;
  }
  return `عندك <b>${active.length||'0'}</b> ${active.length===1?'مهمة':'مهام'} ${doneN?'(خلّصت '+doneN+')':''} · <b>${focusMin>=target?'هدف التركيز اكتمل':fmtMin(Math.max(0,target-focusMin))}</b> تركيز متاحة · سلسلة <b>${bestStreak}</b> يوم.`}

function renderToday(){
  const ts=todayStr(),en=isEn();
  const list=todayTasks();
  const doneN=list.filter(x=>x.status==='done').length;
  const active=list.filter(x=>x.status!=='done');
  const t0=parseD(ts).getTime(),t1=t0+86400000;
  const focusMin=SES.filter(s=>s.type==='focus'&&s.startedAt>=t0&&s.startedAt<t1).reduce((a,s)=>a+s.actualMin,0);
  const target=S.settings.pomodoro.dailyTargetMinutes||180;
  const hs=scheduledHabits(ts),hDone=hs.filter(h=>habitDoneOn(h,ts)).length;
  const bestStreak=S.habits.reduce((m,h)=>Math.max(m,streakOf(h)),0);
  const top3=active.slice(0,3),rest=active.slice(3);
  const log=dayLog();
  const doing=S.tasks.find(x=>x.status==='doing')||active[0];
  const od=overdueTasks();
  const sat=addDaysStr(ts,((6-new Date().getDay())+7)%7||7);
  const showSuggest=od.length>0&&!S.meta.dismissedSuggest?.[ts];

  const v=$('#view');
  v.innerHTML=`
  <div class="view-anim">
  <div class="d-flex flex-wrap align-items-end gap-3 mb-1">
    <div style="flex:1;min-width:240px">
      <h1 class="greet">${greet()}${S.user.name?(en?(', '+esc(S.user.name)):(' يا '+esc(S.user.name))):''}</h1>
      <p class="smart-line">${smartLine(active,doneN,focusMin,target,bestStreak)}</p>
      <p class="date-line">${dateLineAr()}</p>
    </div>
    <div class="d-flex gap-2 align-items-center flex-wrap">
      ${bestStreak?`<span class="streak-flame"><i class="bi bi-fire"></i>${bestStreak} ${t('dayUnit')}</span>`:''}
      <button class="btn-ghost sm" id="eodBtn" style="min-height:38px"><i class="bi bi-moon"></i> ${t('closeDay')}</button>
    </div>
  </div>

  <div class="sec rings" id="ringsWrap">
    <div class="ring-box fade-item">${ringSVG(list.length?doneN/list.length*100:0,'var(--coral)')}<div class="ring-lb"><b>${t('ringTasks')}</b><span>${doneN} ${t('of')} ${list.length}</span></div></div>
    <div class="ring-box fade-item" style="animation-delay:.05s">${ringSVG(target?focusMin/target*100:0,'var(--teal)')}<div class="ring-lb"><b>${t('ringFocus')}</b><span>${fmtMin(focusMin)} ${t('of')} ${fmtMin(target)}</span></div></div>
    <div class="ring-box fade-item" style="animation-delay:.1s">${ringSVG(hs.length?hDone/hs.length*100:0,'var(--amber)')}<div class="ring-lb"><b>${t('ringHabits')}</b><span>${hDone} ${t('of')} ${hs.length}</span></div></div>
  </div>

  <div class="sec"><div class="hero fade-item">
    <div class="hero-t"><b>${t('heroTitle')}</b><span>${doing?`${t('heroFirst')}: «${esc(doing.title)}» — ${t('heroNote')}`:t('heroEmpty')}</span></div>
    <button class="hero-btn" id="startFocus"><i class="bi bi-play-fill"></i> ${t('startFocus')} <kbd class="kbd">F</kbd></button>
  </div></div>

  <div class="sec">
    <div class="sec-h"><span class="sec-t"><i class="bi bi-sunrise"></i> ${t('secToday')}</span>
      <button class="sec-a btn btn-link p-0" id="qaInline"><i class="bi bi-plus-lg"></i> ${t('quickAdd')}</button></div>
    <div id="qaRow" hidden style="margin-bottom:10px"><input class="field" id="qaInput" placeholder="${en?'e.g. Pay bills tomorrow 5pm #home !1 ~30m':'مثال: ادفع فاتورة الكهربا بكرة 5م #بيت !1 ~30د'}" aria-label="${t('quickAdd')}"></div>
    <div id="todayList">
      ${top3.map(x=>taskRow(x,{big:true})).join('')}
      <div id="restList" ${rest.length&&S.meta.collapseRest!==false?'hidden':''}>${rest.map(x=>taskRow(x)).join('')}</div>
      ${rest.length?`<button class="btn-soft w-100" id="restToggle" style="min-height:38px"><i class="bi bi-chevron-${S.meta.collapseRest===false?'up':'down'}"></i> ${S.meta.collapseRest===false?t('hideRest'):t('showRest')} (${rest.length})</button>`:''}
      ${list.filter(x=>x.status==='done').map(x=>taskRow(x)).join('')}
      ${!list.length?`<div class="empty-state"><div class="e-ic"><i class="bi bi-cup-hot"></i></div><b>${t('emptyTodayT')}</b><p>${t('emptyTodayS')}</p></div>`:''}
    </div>
  </div>

  ${doing?`<div class="sec"><div class="mcard focus-one ${P.state==='run'&&P.taskId===doing.id?'live':''}" id="focusOne">
    <div class="f-pulse"><i class="bi bi-bullseye"></i></div>
    <div style="flex:1;min-width:180px"><b>${t('focusOne')}</b>
      <div class="muted small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">«${esc(doing.title)}»</div></div>
    <b class="mono" id="foMiniTime" style="font-size:20px;color:var(--coral-ink)">${P.taskId===doing.id&&P.state!=='idle'?mmss(pomoSnap().remain):''}</b>
    <button class="btn-coral sm" id="foGo"><i class="bi bi-play-fill"></i> ${P.taskId===doing.id&&P.state!=='idle'?t('resume'):t('play')}</button>
  </div></div>`:''}

  <div class="sec">
    <div class="sec-h"><span class="sec-t"><i class="bi bi-flower1"></i> ${t('habitsToday')}</span><a class="sec-a" href="#/habits">${t('allHabits')} <i class="bi bi-arrow-${en?'right':'left'}"></i></a></div>
    <div class="habit-grid" id="habitGrid">
      ${hs.map(h=>{const done=habitDoneOn(h,ts),st=h.streakCache||streakOf(h);const isC=h.type==='counter';
        return`<button class="habit-btn ${done?'done':''}" data-hid="${h.id}" style="--c:${h.color};--c-soft:${h.color}22" aria-pressed="${done}" aria-label="${esc(h.name)}${done?(en?' — done':' — تمت'):(en?' — check it':' — علّمها')}">
        <span class="h-ic"><i class="bi ${esc(h.icon)}"></i></span>
        <span style="flex:1;min-width:0"><span class="h-name">${esc(h.name)}</span>
          <span class="h-streak">${st?`<i class="bi bi-fire" style="color:var(--amber)"></i>${st} ${t('dayUnit')}`:en?'start the streak':'ابدأ السلسلة'} ${h.cue?`· ${esc(h.cue)}`:''}</span>
          ${isC?`<span class="h-count mono">${entryVal(h,ts)}/${h.target} ${esc(h.unit||'')}</span>`:''}</span>
        <span class="h-check"><i class="bi bi-check-lg"></i></span></button>`}).join('')||`<div class="empty-state" style="grid-column:1/-1"><div class="e-ic"><i class="bi bi-flower1"></i></div><b>${en?'No habits yet':'لسّه مفيش عادات'}</b><p>${en?`Add your first from <a href="#/habits">Habits</a> — one is enough.`:'من <a href="#/habits">شاشة العادات</a> ضيف أول عادة — واحدة تكفي.'}</p></div>`}
    </div>
  </div>

  <div class="sec">
    <div class="sec-h"><span class="sec-t"><i class="bi bi-clock-history"></i> ${t('timeline')}</span><span class="tiny muted">6${en?'am':'ص'} ${en?'→':'←'} 12${en?'am':'م'}</span></div>
    <div class="timeline mcard flat" style="padding:10px 14px"><div class="tl-track" id="tlTrack"></div>
      <div class="tl-hours" style="position:relative;z-index:3"><span>6</span><span>9</span><span>12</span><span>15</span><span>18</span><span>21</span><span>24</span></div></div>
  </div>

  <div class="sec trackers">
    <div class="trk"><div class="ic" style="background:var(--teal-soft);color:var(--teal)"><i class="bi bi-cup-straw"></i></div>
      <div style="flex:1"><b class="small">${t('water')}</b><div class="wtr-cups" id="wtrCups">${Array.from({length:8},(_,i)=>`<i class="bi bi-droplet-fill ${i<log.water?'on':''}"></i>`).join('')}</div></div>
      <button class="btn-teal sm btn" id="wtrBtn" style="min-height:38px" aria-label="${en?'Add a cup of water':'أضف كوب مية'}">${t('addCup')}</button></div>
    <div class="trk"><div class="ic" style="background:var(--amber-soft);color:var(--amber)"><i class="bi bi-emoji-smile"></i></div>
      <div style="flex:1"><b class="small">${t('moodQ')}</b></div>
      <div class="mood-btns" id="moodBtns">${['bi-emoji-angry','bi-emoji-frown','bi-emoji-neutral','bi-emoji-smile','bi-emoji-laughing'].map((ic,i)=>`<button class="icon-btn ${log.mood===i+1?'on':''}" data-mood="${i+1}" aria-label="${en?'mood':'مزاج'} ${i+1}/5"><i class="bi ${ic}"></i></button>`).join('')}</div></div>
    <div class="trk"><div class="ic" style="background:var(--coral-soft);color:var(--coral-ink)"><i class="bi bi-journal-text"></i></div>
      <div style="flex:1"><b class="small">${t('journalQ')}</b>
      <input class="field mt-1" id="journalQ" style="padding:7px 12px;font-size:13px" placeholder="${t('journalPh')}" value="${esc(log.journal||'')}" aria-label="${t('journalQ')}"></div></div>
  </div>

  ${showSuggest?`<div class="sec"><div class="suggest" id="suggest">
    <i class="bi bi-stars"></i><span style="flex:1;min-width:200px;font-size:14px">${en?`You have <b>${od.length}</b> carried-over task${od.length>1?'s':''} from yesterday. Postpone to ${new Date().getDay()===6?'tomorrow':'Saturday'}?`:`عندك <b>${od.length}</b> ${od.length===1?'مهمة متراكمة':'مهام متراكمة'} من إمبارح وأبلّه. نأجّلهم ${new Date().getDay()===6?'للبكرة':'للسبت'}؟`}</span>
    <button class="btn-coral sm" id="sgYes">${t('sugYes')}</button>
    <button class="btn-ghost sm" id="sgEdit" style="background:var(--card)">${t('sugEdit')}</button>
    <button class="btn-ghost sm" id="sgNo" style="background:var(--card)">${t('sugNo')}</button></div></div>`:''}
  </div>`;
  // ربط الأحداث
  animateRings(v);
  bindTaskRows(v);
  $('#startFocus').onclick=()=>{pomoStart(doing?doing.id:null,'focus');location.hash='#/focus'};
  const qaRow=$('#qaRow'),qaIn=$('#qaInput');
  $('#qaInline').onclick=()=>{qaRow.hidden=!qaRow.hidden;if(!qaRow.hidden)qaIn.focus()};
  qaIn.onkeydown=e=>{if(e.key==='Enter'&&qaIn.value.trim()){const d=parseQuickAdd(qaIn.value);
      if(!d.dueDate&&!d.recurrence)d.dueDate=ts;addTask(d);qaIn.value='';qaRow.hidden=true}
    if(e.key==='Escape')qaRow.hidden=true};
  const rt=$('#restToggle');
  if(rt)rt.onclick=()=>{const rl=$('#restList');rl.hidden=!rl.hidden;
    S.meta.collapseRest=rl.hidden;emit('meta');
    rt.innerHTML=`<i class="bi bi-chevron-${rl.hidden?'down':'up'}"></i> ${rl.hidden?t('showRest'):t('hideRest')} (${rest.length})`};
  const fo=$('#foGo');
  if(fo)fo.onclick=()=>{if(P.taskId===doing.id&&P.state!=='idle')location.hash='#/focus';else{pomoStart(doing.id,'focus');location.hash='#/focus'}};
  $$('.habit-btn',v).forEach(b=>{b.onclick=()=>{const h=S.habits.find(x=>x.id===b.dataset.hid);if(!h)return;
    if(h.type==='counter'){const nv=incCounter(h.id,1);
      const cnt=b.querySelector('.h-count');if(cnt)cnt.textContent=`${nv}/${h.target} ${h.unit||''}`;
      if(habitDoneOn(h,todayStr())){b.classList.add('done');b.setAttribute('aria-pressed','true')}
      emit('habits');return}
    const r=toggleHabit(h.id);if(!r)return;
    b.classList.toggle('done',r.done);b.setAttribute('aria-pressed',String(r.done));
    const st=b.querySelector('.h-streak');
    if(st)st.innerHTML=r.streak?`<i class="bi bi-fire" style="color:var(--amber)"></i>${r.streak} ${t('dayUnit')}`:(en?'start the streak':'ابدأ السلسلة');
    if(r.done)toast(r.streak>1?(en?`${r.streak}-day streak — going strong!`:`سلسلة ${r.streak} يوم — ماشي حلو!`):(en?'Streak started. See? Easy.':'بداية السلسلة. شوفت؟ سهلة.'),{icon:'bi-fire'});
    emit('habits')}});
  const trk=$('#tlTrack');const start=6*60,end=24*60,span=(end-start)*60000;
  const px=m=>((m-start*60000)/span*100).toFixed(2)+'%';
  SES.filter(s=>s.startedAt>=t0&&s.startedAt<t1).forEach(s=>{
    const b=document.createElement('div');b.className='tl-block'+(s.type!=='focus'?' break':'');
    const sm=(s.startedAt-t0),em=(s.endedAt-t0)-sm;
    b.style.left=px(sm);b.style.width=Math.max(.8,em/span*100).toFixed(2)+'%';
    b.title=(s.type==='focus'?(en?'focus session':'جلسة تركيز'):t('rest'))+' '+fmtMin(s.actualMin);
    if(sm>=start*60000)trk.appendChild(b)});
  list.filter(x=>x.dueTime).forEach(tk=>{
    const b=document.createElement('div');b.className='tl-task';
    const sm=clockOf(tk.dueTime)*60000;
    b.style.left=px(sm);b.style.width=Math.max(1.5,(tk.estimateMin||30)/((end-start)/60)*100).toFixed(2)+'%';
    b.title=tk.title;trk.appendChild(b)});
  const nowM=(Date.now()-t0);
  if(nowM>=start*60000&&nowM<=end*60000){const n=document.createElement('div');n.className='tl-now';n.style.left=px(nowM);trk.appendChild(n)}
  $('#wtrBtn').onclick=()=>{const n=addWater();
    $$('#wtrCups i').forEach((c,i)=>c.classList.toggle('on',i<n))};
  $$('#moodBtns button').forEach(b=>b.onclick=()=>{setMood(+b.dataset.mood);
    $$('#moodBtns button').forEach(x=>x.classList.toggle('on',x===b&&dayLog().mood===+b.dataset.mood))});
  const jq=$('#journalQ');let jt;jq.oninput=()=>{clearTimeout(jt);jt=setTimeout(()=>setJournal(jq.value),400)};
  if(showSuggest){
    $('#sgYes').onclick=()=>{postponeTasks(od.map(x=>x.id),sat);
      toast(en?`Postponed to ${parseD(sat).toLocaleDateString('en-US',{weekday:'long'})}.`:`اتأجلوا ليوم ${DAY_NAMES[parseD(sat).getDay()]}. يومك اتفضى.`);
      const sg=$('#suggest');if(sg)sg.remove()};
    $('#sgNo').onclick=()=>{S.meta.dismissedSuggest=S.meta.dismissedSuggest||{};S.meta.dismissedSuggest[ts]=1;emit('meta');const sg=$('#suggest');if(sg)sg.remove()};
    $('#sgEdit').onclick=()=>{location.hash='#/tasks'}}
  $('#eodBtn').onclick=openEOD;
  const sub=onPomo(s=>{const el=$('#foMiniTime');const one=$('#focusOne');
    if(el&&P.taskId===doing?.id&&s.state==='run')el.textContent=mmss(s.remain);
    else if(el&&s.state==='idle')el.textContent='';
    if(one)one.classList.toggle('live',P.taskId===doing?.id&&s.state==='run')});
  CLEANUPS.push(sub)}

// مراجعة نهاية اليوم
function openEOD(){
  const en=isEn();
  const ts=todayStr(),list=todayTasks(),done=list.filter(x=>x.status==='done'),pending=list.filter(x=>x.status!=='done');
  const t0=parseD(ts).getTime();
  const ses=SES.filter(s=>s.startedAt>=t0&&s.startedAt<t0+86400000);
  const fmin=ses.filter(s=>s.type==='focus').reduce((a,s)=>a+s.actualMin,0);
  const hs=scheduledHabits(ts),hd=hs.filter(h=>habitDoneOn(h,ts)).length;
  openModal({title:t('eodTitle'),wide:true,body:`
    <div class="stat-cards mb-3">
      <div class="stat-c"><div class="sv" style="color:var(--coral-ink)">${done.length}/${list.length}</div><div class="sl">${t('eodTasks')}</div></div>
      <div class="stat-c"><div class="sv" style="color:var(--teal)">${fmtMin(fmin)}</div><div class="sl">${t('eodFocus')} (${ses.filter(s=>s.type==='focus').length} ${t('session')})</div></div>
      <div class="stat-c"><div class="sv" style="color:var(--amber)">${hd}/${hs.length}</div><div class="sl">${t('eodHabits')}</div></div>
    </div>
    ${pending.length?`<p class="small fw-bold mb-2">${t('eodPending')} ${pending.length} — ${en?'the new plan:':'الخطة الجديدة:'}</p>
    ${pending.map(x=>`<div class="task-row" style="pointer-events:none"><div class="t-main"><div class="t-title">${esc(x.title)}</div></div>
      <span class="chip amber">${t('eodWait')}</span></div>`).join('')}`:`<p class="small mb-2" style="color:var(--teal)">${t('eodClean')}</p>`}
    <label class="flabel mt-2">${t('eodNote')}</label>
    <textarea class="field" id="eodNote" placeholder="${t('eodNotePh')}">${esc(dayLog().journal||'')}</textarea>`,
    actions:[
     {label:`<i class="bi bi-moon-stars"></i> ${t('eodClose')}`,cls:'btn-coral',fn:md=>{
        setJournal($('#eodNote',md).value.trim());
        if(pending.length)postponeTasks(pending.map(x=>x.id),addDaysStr(ts,1));
        dayLog().shutdownDone=true;emit('daylog');celebrateEOD(done.length,list.length)}},
     {label:t('eodLater'),fn:()=>{}}],
    onOpen:md=>setTimeout(()=>$('#eodNote',md)?.focus(),60)})}
function celebrateEOD(dn,total){
  const en=isEn();
  const c=document.createElement('div');c.className='celebrate';c.setAttribute('role','alert');
  c.innerHTML=`<div class="text-center" style="max-width:340px">
    <div class="c-circ"><i class="bi bi-moon-stars"></i></div>
    <h2 style="font-size:24px">${t('celTitle')}</h2>
    <p class="muted mt-2" style="font-size:15px">${en?`${dn} of ${total} tasks. The rest is fine tomorrow.<br>Go rest — you earned it.`:`${dn} من ${total} مهام. اللي فضل هيتظبط بكرة إن شاء الله.<br>ريّح بقى — استاهلت.`}</p>
    <button class="btn-coral mt-3 px-4" id="celOk">${t('celBtn')}</button></div>`;
  document.body.appendChild(c);
  $('#celOk',c).onclick=()=>{c.remove();if((location.hash.replace('#/','')||'today')==='today')renderToday()};
  if(!REDUCED)setTimeout(()=>{if(document.body.contains(c)){c.remove();renderToday()}},6000)}
