'use strict';
// شاشة التركيز: الحلقة الكبيرة + الأمبينس + سجل جلسات اليوم
function renderFocus(){
  const en=isEn();
  const ts=todayStr(),t0=parseD(ts).getTime();
  const sesToday=SES.filter(s=>s.startedAt>=t0&&s.startedAt<t0+86400000).sort((a,b)=>b.startedAt-a.startedAt);
  const opts=visTasks().filter(x=>x.status!=='done');
  const v=$('#view');
  const C=2*Math.PI*150;
  v.innerHTML=`<div class="view-anim focus-wrap">
  <div class="seg-ctrl mb-2" id="fModes">
    <button data-m="focus" class="${P.mode==='focus'?'on':''}">${t('modeFocus')}</button>
    <button data-m="short" class="${P.mode==='short'?'on':''}">${t('modeShort')}</button>
    <button data-m="long" class="${P.mode==='long'?'on':''}">${t('modeLong')}</button></div>
  <div class="f-ringwrap">
    <svg class="f-ring ${P.mode!=='focus'?'break':''}" viewBox="0 0 320 320" id="fRing">
      <circle class="bgc" cx="160" cy="160" r="150" fill="none" stroke-width="10"/>
      <circle class="fgc" id="fArc" cx="160" cy="160" r="150" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
    <div class="f-center">
      <div class="f-state" id="fState">${t('ready')}</div>
      <div id="fTime" class="mono">${mmss(pomoTotalMin(P.mode)*60000)}</div>
      <div id="fTaskName">${P.taskId?esc(taskById(P.taskId)?.title||''):t('bindPh')}</div>
    </div></div>
  <div class="f-cycles" id="fCycles" aria-label="${en?'cycle count':'عدد الجلسات'}">${Array.from({length:S.settings.pomodoro.cyclesBeforeLong},(_,i)=>`<span class="f-dot ${i<P.cycle%S.settings.pomodoro.cyclesBeforeLong?'on':''}"></span>`).join('')}</div>
  <select class="field mb-3" id="fTaskSel" style="max-width:340px" aria-label="${t('bindPh')}">
    <option value="">${t('noTask')}</option>
    ${opts.map(x=>`<option value="${x.id}" ${P.taskId===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select>
  <div class="f-controls">
    <button class="f-btn" id="fStop" aria-label="${en?'End session':'إنهاء الجلسة'}"><i class="bi bi-stop-fill"></i></button>
    <button class="f-btn main ${P.mode!=='focus'?'break':''}" id="fMain" aria-label="${P.state==='run'?(en?'Pause':'إيقاف مؤقت'):(en?'Play':'تشغيل')}"><i class="bi ${P.state==='run'?'bi-pause-fill':'bi-play-fill'}"></i></button>
    <button class="f-btn" id="fFull" aria-label="${en?'Fullscreen':'وضع ملء الشاشة'}"><i class="bi bi-arrows-fullscreen"></i></button>
  </div>
  <div class="sec w-100" style="max-width:560px">
    <div class="mcard flat">
      <div class="sec-h"><span class="sec-t"><i class="bi bi-soundwave"></i> ${t('amb')}</span>
        <label class="d-flex align-items-center gap-2 small muted">${t('vol')} <input type="range" class="vol-r" id="ambVol" min="0" max="1" step=".1" value="${S.settings.pomodoro.ambVol}"></label></div>
      <div class="amb-chips" id="ambChips">
        ${[['none',t('ambNone'),'bi-volume-mute'],['rain',t('ambRain'),'bi-cloud-rain'],['cafe',t('ambCafe'),'bi-cup-hot'],['brown',t('ambBrown'),'bi-wind'],['white',t('ambWhite'),'bi-broadcast']].map(([k,n,ic])=>`<button class="f-chip ${S.settings.pomodoro.ambience===k?'on':''}" data-amb="${k}"><i class="bi ${ic}"></i> ${n}</button>`).join('')}</div>
      <div class="d-flex flex-wrap gap-3 mt-3 pt-3" style="border-top:1px solid var(--line)">
        <label class="d-flex align-items-center gap-2 small"><span class="switch"><input type="checkbox" id="swAutoB" ${S.settings.pomodoro.autoStartBreak?'checked':''}><span class="tr"><span class="th"></span></span></span> ${t('autoBreak')}</label>
        <label class="d-flex align-items-center gap-2 small"><span class="switch"><input type="checkbox" id="swAutoF" ${S.settings.pomodoro.autoStartFocus?'checked':''}><span class="tr"><span class="th"></span></span></span> ${t('autoFocus')}</label>
        <label class="d-flex align-items-center gap-2 small"><span class="switch"><input type="checkbox" id="swDnd" ${S.settings.pomodoro.dnd?'checked':''}><span class="tr"><span class="th"></span></span></span> ${t('dnd')}</label>
        <label class="d-flex align-items-center gap-2 small"><span class="switch"><input type="checkbox" id="swTick" ${S.settings.pomodoro.tick?'checked':''}><span class="tr"><span class="th"></span></span></span> ${t('tick')}</label>
      </div></div></div>
  <div class="sec w-100" style="max-width:560px">
    <div class="sec-h"><span class="sec-t"><i class="bi bi-clock-history"></i> ${t('sesToday')}</span><span class="tiny muted">${sesToday.length} ${t('session')}</span></div>
    <div id="sesList">${sesToday.map(s=>{const tk=s.taskId?taskById(s.taskId):null;
      return`<div class="ses-row ${s.type!=='focus'?'brk':''}"><span class="sdot"></span>
      <span class="st">${s.type==='focus'?t('modeFocus'):t('rest')}${tk?' — '+esc(tk.title):''}</span>
      ${s.completed?'<i class="bi bi-check2" style="color:var(--teal)"></i>':`<span class="tiny muted">${t('partial')}</span>`}
      <span class="mono tiny muted">${pad2(new Date(s.startedAt).getHours())}:${pad2(new Date(s.startedAt).getMinutes())}</span>
      <span class="chip mono">${fmtMin(s.actualMin)}</span></div>`}).join('')||`<p class="muted small">${t('firstSes')}</p>`}</div>
  </div></div>`;
  const up=s=>{const arc=$('#fArc');if(!arc)return;
    const total=s.total||pomoTotalMin(s.mode)*60000;
    const p=s.state==='idle'?0:1-s.remain/total;
    arc.style.strokeDashoffset=C*(1-clamp(p,0,1));
    $('#fTime').textContent=s.state==='idle'?mmss(pomoTotalMin(s.mode)*60000):mmss(s.remain);
    const st=$('#fState');st.className='f-state'+(s.mode!=='focus'?' break':'');
    st.textContent=s.state==='run'?(s.mode==='focus'?t('focusing'):t('resting')):s.state==='paused'?t('paused'):t('ready');
    const tk=s.taskId?taskById(s.taskId):null;
    if(tk)$('#fTaskName').textContent=tk.title;
    $('#fMain i').className='bi '+(s.state==='run'?'bi-pause-fill':'bi-play-fill');
    $('#fRing').classList.toggle('break',s.mode!=='focus');
    $('#fMain').classList.toggle('break',s.mode!=='focus');
    $$('#fCycles .f-dot').forEach((d,i)=>d.classList.toggle('on',i<P.cycle%S.settings.pomodoro.cyclesBeforeLong))};
  pomoSubs.add(up);CLEANUPS.push(()=>pomoSubs.delete(up));up(pomoSnap());
  $('#fMain').onclick=()=>pomoToggle($('#fTaskSel').value||null);
  $('#fStop').onclick=()=>pomoStop(true);
  $('#fFull').onclick=()=>enterFocusOverlay();
  $('#fTaskSel').onchange=e=>{P.taskId=e.target.value||null;notifyPomo()};
  $$('#fModes button').forEach(b=>b.onclick=()=>{
    if(P.state==='run')pomoStop(true);
    P.mode=b.dataset.m;P.state='idle';P.remain=pomoTotalMin(P.mode)*60000;P.totalMs=P.remain;
    renderFocus()});
  $$('#ambChips .f-chip').forEach(c=>c.onclick=()=>{
    S.settings.pomodoro.ambience=c.dataset.amb;emit('settings');
    if(P.state==='run')ambStart(c.dataset.amb);
    $$('#ambChips .f-chip').forEach(x=>x.classList.toggle('on',x===c))});
  $('#ambVol').oninput=e=>{S.settings.pomodoro.ambVol=+e.target.value;ambSetVol(+e.target.value);emit('settings')};
  $('#swAutoB').onchange=e=>{S.settings.pomodoro.autoStartBreak=e.target.checked;emit('settings')};
  $('#swAutoF').onchange=e=>{S.settings.pomodoro.autoStartFocus=e.target.checked;emit('settings')};
  $('#swDnd').onchange=e=>{S.settings.pomodoro.dnd=e.target.checked;emit('settings')};
  $('#swTick').onchange=e=>{S.settings.pomodoro.tick=e.target.checked;emit('settings')}}
function enterFocusOverlay(){
  const en=isEn();
  const ov=$('#focusOverlay');ov.hidden=false;
  const up=s=>{
    $('#foTime').textContent=s.state==='idle'?mmss(pomoTotalMin(s.mode)*60000):mmss(s.remain);
    $('#foMode').textContent=s.mode==='focus'?(en?'FOCUS':'تركيز'):(en?'BREAK':'راحة');
    const tk=s.taskId?taskById(s.taskId):null;
    $('#foTask').textContent=tk?tk.title:'';
    $('#foPause').textContent=s.state==='run'?(en?'Pause':'إيقاف مؤقت'):s.state==='paused'?(en?'Resume':'كمّل'):(en?'Start':'ابدأ')};
  pomoSubs.add(up);up(pomoSnap());
  $('#foPause').onclick=()=>pomoToggle();
  $('#foExit').onclick=()=>{pomoStop(true);ov.hidden=true;pomoSubs.delete(up)}}
$('#focusOverlay').addEventListener('keydown',e=>{if(e.key==='Escape')$('#focusOverlay').hidden=true});
