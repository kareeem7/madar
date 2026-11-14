'use strict';
// التقويم الشهري + الطابور الزمني — اليوم المحدد calSel
let calCursor=new Date();calCursor.setDate(1);
let calSel=todayStr();
const calMonthName=d=>isEn()?d.toLocaleDateString('en-US',{month:'long',year:'numeric'}):MONTHS[d.getMonth()]+' '+d.getFullYear();
const calDayName=s=>isEn()?parseD(s).toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})
  :DAY_NAMES[parseD(s).getDay()]+' '+parseD(s).getDate()+' '+MONTHS[parseD(s).getMonth()];
const calWd=w=>isEn()?new Date(2024,0,7+w).toLocaleDateString('en-US',{weekday:'short'}):DAY_SHORT[w];
function renderCalendar(){
  const en=isEn();
  const y=calCursor.getFullYear(),m=calCursor.getMonth();
  const first=new Date(y,m,1),startOffset=WEEK_ORDER.indexOf(first.getDay());
  const dim=new Date(y,m+1,0).getDate();
  const byDate={};visTasks().forEach(x=>{if(x.dueDate)(byDate[x.dueDate]=byDate[x.dueDate]||[]).push(x)});
  let cells='';
  for(let i=0;i<startOffset;i++)cells+='<div class="cal-cell other"></div>';
  for(let d=1;d<=dim;d++){const ds=dstr(new Date(y,m,d));const arr=byDate[ds]||[];
    cells+=`<div class="cal-cell ${ds===todayStr()?'today':''} ${ds===calSel?'sel':''}" data-d="${ds}" role="button" tabindex="0" aria-label="${d} — ${arr.length} ${en?'tasks':'مهام'}">
      <span class="cd">${d}</span>${arr.slice(0,3).map(x=>`<div class="ct" style="background:${x.status==='done'?'var(--teal-soft)':'var(--coral-soft)'};color:${x.status==='done'?'var(--teal)':'var(--coral-ink)'}">${esc(x.title.slice(0,14))}</div>`).join('')}
      ${arr.length>3?`<div class="tiny muted mt-1">+${arr.length-3}</div>`:''}</div>`}
  const selTasks=(byDate[calSel]||[]);
  const noTime=visTasks().filter(x=>x.dueDate===calSel&&!x.dueTime&&x.status!=='done');
  const hours=Array.from({length:16},(_,i)=>i+7); // 7am → 10pm
  const v=$('#view');
  v.innerHTML=`<div class="view-anim"><div class="sec-h mb-3"><h1 style="font-size:24px">${calMonthName(calCursor)}</h1>
    <div class="d-flex gap-1"><button class="icon-btn" id="calPrev" aria-label="${en?'Previous month':'الشهر السابق'}"><i class="bi bi-chevron-right"></i></button>
    <button class="btn-soft sm" id="calToday">${en?'Today':'اليوم'}</button>
    <button class="icon-btn" id="calNext" aria-label="${en?'Next month':'الشهر التالي'}"><i class="bi bi-chevron-left"></i></button></div></div>
  <div class="cal-grid mb-1">${WEEK_ORDER.map(w=>`<div class="cal-wd">${calWd(w)}</div>`).join('')}${cells}</div>
  <div class="row g-3 mt-2">
    <div class="col-12 col-lg-5"><div class="mcard flat h-100">
      <h4 class="mb-3" style="font-size:15px"><i class="bi bi-calendar-day" style="color:var(--coral)"></i> ${calSel===todayStr()?(en?'Today':'النهاردة'):calDayName(calSel)}</h4>
      ${selTasks.map(x=>taskRow(x)).join('')||`<p class="muted small">${en?'No tasks on this day.':'مفيش مهام في اليوم ده.'}</p>`}
      <button class="btn-soft w-100 mt-2" id="calAdd"><i class="bi bi-plus-lg"></i> ${en?'Task on this day':'مهمة في اليوم ده'}</button></div></div>
    <div class="col-12 col-lg-7"><div class="mcard flat">
      <h4 class="mb-1" style="font-size:15px"><i class="bi bi-layout-three-columns" style="color:var(--coral)"></i> ${en?'Time queue':'الطابور الزمني'}</h4>
      <p class="tiny muted mb-3">${en?'Drag a task onto an hour — it gets scheduled automatically.':'اسحب مهمة من القايمة على ساعة — هتتجدول تلقائيًا.'}</p>
      <div class="tq"><div class="tq-list" id="tqList">
        ${noTime.map(x=>`<div class="tq-task" data-id="${x.id}">${esc(x.title)}</div>`).join('')||`<p class="tiny muted">${en?'No untimed tasks for this day.':'مفيش مهام بدون وقت في اليوم ده.'}</p>`}
      </div><div class="tq-cols" id="tqCols">
        ${hours.map(h=>{const hm=pad2(h)+':00';const slot=visTasks().filter(x=>x.dueDate===calSel&&x.dueTime&&Math.floor(clockOf(x.dueTime)/60)===h);
          return`<div class="tq-slot" data-h="${h}"><span class="mono">${hm}</span>
          ${slot.map(x=>`<div class="slot-task">${x.status==='done'?'<i class="bi bi-check2" style="color:var(--teal)"></i>':''}${esc(x.title)}<button data-unsched="${x.id}" aria-label="${en?'Remove time':'إلغاء التوقيت'}"><i class="bi bi-x"></i></button></div>`).join('')}</div>`}).join('')}
      </div></div></div></div>
  </div></div>`;
  $('#calPrev').onclick=()=>{calCursor.setMonth(calCursor.getMonth()-1);renderCalendar()};
  $('#calNext').onclick=()=>{calCursor.setMonth(calCursor.getMonth()+1);renderCalendar()};
  $('#calToday').onclick=()=>{calCursor=new Date();calCursor.setDate(1);calSel=todayStr();renderCalendar()};
  $$('.cal-cell[data-d]',v).forEach(c=>{
    const go=()=>{calSel=c.dataset.d;renderCalendar()};
    c.onclick=go;
    c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  $('#calAdd').onclick=()=>{
    const d=calSel;
    openTaskEditor();
    setTimeout(()=>{const te=$('#teDate');if(te){te.value=d;te.dispatchEvent(new Event('change'))}},120)};
  bindTaskRows(v);
  $$('.tq-task',v).forEach(tk=>makeDrag(tk,{ghostHTML:()=>`<div class="tq-task">${esc(tk.textContent)}</div>`,
    targetSel:'.tq-slot',
    onDrop:slot=>{if(!slot)return;const task=taskById(tk.dataset.id);if(!task)return;
      task.dueDate=calSel;task.dueTime=pad2(+slot.dataset.h)+':00';task.updatedAt=new Date().toISOString();
      emit('tasks-structure');
      announce(`"${task.title}" ${task.dueTime}`);
      toast(en?`Scheduled at ${task.dueTime} — from the time queue`:`اتحطت في ${task.dueTime} — من الطابور الزمني`)},
    onTap:()=>openTaskEditor(tk.dataset.id)}));
  $$('[data-unsched]',v).forEach(b=>b.onclick=()=>updateTask(b.dataset.unsched,{dueTime:null},'tasks-structure'))}
