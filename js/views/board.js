'use strict';
// اللوحة (Kanban) — دراج يدوي + بديل كيبورد كامل
function boardCols(){
  return isEn()
    ?[['backlog','Backlog','#64748B'],['today','Today','#D98E1B'],['doing','Doing','#FF5A45'],['done','Done','#2E7D6B']]
    :[['backlog','قيد الانتظار','#64748B'],['today','النهاردة','#D98E1B'],['doing','شغال عليه','#FF5A45'],['done','خلص','#2E7D6B']]}
function colOf(x){const ts=todayStr();
  if(x.status==='done')return'done';
  if(x.status==='doing')return'doing';
  if(x.dueDate===ts)return'today';
  return'backlog'}
function moveToColumn(id,col){const tk=taskById(id);if(!tk)return;const ts=todayStr();
  if(col==='done'){tk.status='done';tk.completedAt=new Date().toISOString();
    if(tk.recurrence){const nd=recurrenceNext(tk.recurrence,tk.dueDate||ts);
      const sp=newTaskObj({title:tk.title,notes:tk.notes,projectId:tk.projectId,tags:tk.tags,priority:tk.priority,estimateMin:tk.estimateMin,recurrence:tk.recurrence,subtasks:tk.subtasks.map(s=>({...s,id:uid(),done:false}))});
      sp.dueDate=nd;S.tasks.push(sp)}addXp(10)}
  else if(col==='doing'){tk.status='doing';if(tk.dueDate&&tk.dueDate>ts)tk.dueDate=ts}
  else if(col==='today'){tk.status='todo';tk.dueDate=ts}
  else{tk.status='todo';if(tk.dueDate===ts)tk.dueDate=null}
  tk.updatedAt=new Date().toISOString();emit('tasks-structure');
  announce((isEn()?'Task moved to ':'المهمة اتنقلت لعمود ')+boardCols().find(c=>c[0]===col)[1])}
function renderBoard(){
  const en=isEn();
  const list=visTasks().filter(x=>x.status!=='archived');
  const cols=boardCols().map(([k,n,c])=>[k,n,c,list.filter(x=>colOf(x)===k).sort((a,b)=>a.order-b.order||a.priority-b.priority)]);
  const v=$('#view');
  v.innerHTML=`<div class="view-anim"><div class="sec-h mb-3"><h1 style="font-size:24px">${t('board')}</h1>
    <span class="tiny muted">${en?'Drag cards across columns — or use Ctrl + arrows':'اسحب البطاقات بين الأعمدة — أو بالكيبورد: Ctrl + الأسهم'}</span></div>
  <div class="board" id="boardEl">
    ${cols.map(([k,n,c,arr])=>`<section class="bcol" data-col="${k}" aria-label="${n}">
      <div class="bcol-h"><span class="b-ic" style="background:${c}"></span>${n}<span class="cnt">${arr.length}</span></div>
      <div class="bcards">${arr.map(x=>{const p=projById(x.projectId);
        return`<article class="bcard" data-id="${x.id}" tabindex="0" aria-label="${esc(x.title)} — ${n}">
        <div class="t-title">${esc(x.title)}</div>
        <div class="t-meta">${x.priority<4?`<span class="prio-flag p${x.priority}"><i class="bi bi-flag-fill"></i>P${x.priority}</span>`:''}
        ${p?`<span class="chip"><span class="dot" style="--c:${p.color}"></span>${esc(p.name)}</span>`:''}
        ${x.estimateMin?`<span class="chip mono">${fmtMin(x.estimateMin)}</span>`:''}</div></article>`}).join('')}
      </div></section>`).join('')}
  </div></div>`;
  const board=$('#boardEl');let line=null;
  $$('.bcard',board).forEach(card=>{
    const id=card.dataset.id;
    makeDrag(card,{
      ghostHTML:()=>`<div class="bcard">${card.innerHTML}</div>`,
      targetSel:'.bcol',
      onMove:(colEl,ev)=>{if(line){line.remove();line=null}if(!colEl)return;
        const cards=$$('.bcard:not(.dragging)',colEl);
        const after=cards.find(c=>ev.clientY<c.getBoundingClientRect().top+c.offsetHeight/2);
        line=document.createElement('div');line.className='drop-line';
        if(after)$('.bcards',colEl).insertBefore(line,after);else $('.bcards',colEl).appendChild(line)},
      onDrop:(colEl)=>{if(line){line.remove();line=null}if(!colEl)return;
        moveToColumn(id,colEl.dataset.col)},
      onTap:()=>openTaskEditor(id)});
    card.addEventListener('keydown',event=>{
      if(!event.ctrlKey)return;
      const column=card.closest('.bcol');
      const columnKey=column.dataset.col;
      const ids=$$('.bcard',column).map(item=>item.dataset.id);
      const index=ids.indexOf(id);
      if(event.key==='ArrowUp'||event.key==='ArrowDown'){
        event.preventDefault();
        const nextIndex=index+(event.key==='ArrowUp'?-1:1);
        if(nextIndex>=0&&nextIndex<ids.length){
          const sorted=visTasks().filter(x=>colOf(x)===columnKey).sort((a,b)=>a.order-b.order);
          [sorted[index],sorted[nextIndex]]=[sorted[nextIndex],sorted[index]];
          sorted.forEach((task,order)=>{task.order=order});
          emit('tasks-structure');
          announce(en?'Task moved within the column':'اتحركت المهمة داخل العمود');
          setTimeout(()=>{const moved=$(`.bcard[data-id="${id}"]`);if(moved)moved.focus()},60);
        }
      }
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();
        const order=boardCols().map(item=>item[0]);
        const direction=document.dir==='rtl'?(event.key==='ArrowLeft'?1:-1):(event.key==='ArrowRight'?1:-1);
        const nextColumn=order.indexOf(columnKey)+direction;
        if(nextColumn>=0&&nextColumn<order.length){
          moveToColumn(id,order[nextColumn]);
          setTimeout(()=>{const moved=$(`.bcard[data-id="${id}"]`);if(moved)moved.focus()},80);
        }
      }
    });
  })}
