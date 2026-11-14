'use strict';
// شاشة المهام: فلاتر + تجميع + bulk + محرر بحفظ فوري
let taskFilter={q:'',chip:'all',project:null};
function renderTasks(){
  const en=isEn();
  const ts=todayStr();
  let list=visTasks();
  const F=taskFilter;
  if(F.project)list=list.filter(x=>x.projectId===F.project);
  if(F.q){const q=F.q.trim().toLowerCase();list=list.filter(x=>(x.title+' '+(x.notes||'')+' '+x.tags.join(' ')).toLowerCase().includes(q))}
  const chipFns={all:()=>true,today:x=>x.dueDate===ts||x.status==='doing',
    overdue:x=>x.dueDate&&x.dueDate<ts&&x.status!=='done',nodate:x=>!x.dueDate&&x.status!=='done',
    high:x=>x.priority<=2&&x.status!=='done',done:x=>x.status==='done',archived:x=>x.status==='archived'};
  if(F.chip==='trash')list=S.tasks.filter(x=>x.status==='trash');
  else if(chipFns[F.chip])list=list.filter(chipFns[F.chip]);
  list.sort((a,b)=>((a.status==='done')?1:0)-((b.status==='done')?1:0)||a.priority-b.priority||((a.dueDate||'9999')<(b.dueDate||'9999')?-1:1));
  const groups=[];
  if(F.chip==='all'&&!F.q){const g={overdue:[],today:[],doing:[],upcoming:[],nodate:[],done:[]};
    list.forEach(x=>{if(x.status==='done')g.done.push(x);else if(x.status==='doing')g.doing.push(x);
      else if(x.dueDate&&x.dueDate<ts)g.overdue.push(x);else if(x.dueDate===ts)g.today.push(x);
      else if(x.dueDate)g.upcoming.push(x);else g.nodate.push(x)});
    [['doing',en?'Doing':'شغال عليها'],['today',en?'Today':'النهاردة'],['overdue',en?'Overdue':'متأخرة'],['upcoming',en?'Upcoming':'قادمة'],['nodate',en?'No date':'بدون موعد'],['done',en?'Done':'مكتملة']].forEach(([k,n])=>{if(g[k].length)groups.push([n,g[k]])});
  }else if(list.length)groups.push(['',list]);
  const chips=[['all',en?'All':'الكل'],['today',en?'Today':'النهاردة'],['overdue',en?'Overdue':'متأخرة'],['high',en?'High priority':'أولوية عالية'],['nodate',en?'No date':'بدون موعد'],['done',en?'Done':'مكتملة'],['archived',en?'Archive':'الأرشيف'],['trash',en?'Trash':'السلة']];
  window.__mass=new Set();
  const v=$('#view');
  v.innerHTML=`<div class="view-anim">
  <div class="sec-h mb-3"><h1 style="font-size:24px">${t('tasksTitle')}</h1>
    <div class="d-flex gap-2">
      <button class="btn-ghost sm" id="massBtn"><i class="bi bi-check2-square"></i> ${t('select')}</button>
      <button class="btn-coral sm" id="addTaskBtn"><i class="bi bi-plus-lg"></i> ${t('newTask')}</button>
    </div></div>
  <div class="position-relative mb-3">
    <input class="field" id="taskSearch" placeholder="${t('taskSearchPh')}" value="${esc(F.q)}" aria-label="${t('taskSearchPh')}" style="padding-inline-start:38px">
    <i class="bi bi-funnel position-absolute" style="inset-inline-start:13px;top:11px;color:var(--faint)"></i></div>
  <div class="filters-bar">
    ${chips.map(([k,n])=>`<button class="f-chip ${F.chip===k?'on':''}" data-chip="${k}">${n}</button>`).join('')}
    <span style="width:1px;height:22px;background:var(--line)"></span>
    ${S.projects.map(p=>`<button class="f-chip ${F.project===p.id?'on':''}" data-proj="${p.id}"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span> ${esc(p.name)}</button>`).join('')}
    ${S.views.map((vw,i)=>`<button class="f-chip" data-view="${i}" title="${en?'saved view':'عرض محفوظ'}"><i class="bi bi-bookmark"></i> ${esc(vw.name)}</button>`).join('')}
    <button class="f-chip" id="saveView" title="${en?'Save current filter as a view':'احفظ الفلتر الحالي كعرض'}"><i class="bi bi-bookmark-plus"></i> ${en?'Save view':'احفظ العرض'}</button>
  </div>
  <div id="taskList">
   ${groups.map(([name,arr])=>`${name?`<div class="g-title">${name} <span class="chip">${arr.length}</span></div>`:''}
     ${arr.map(x=>taskRow(x,{selectable:window.__massMode})).join('')}`).join('')||`<div class="empty-state"><div class="e-ic"><i class="bi bi-inbox"></i></div><b>${en?'Nothing here':'مفيش حاجة هنا'}</b><p>${en?'Try another filter — or press N to add a task.':'جرّب فلتر تاني — أو دوس N وضيف مهمة.'}</p></div>`}
  </div>
  <div id="bulkMount"></div></div>`;
  bindTaskRows(v);
  $('#taskSearch').oninput=e=>{F.q=e.target.value;clearTimeout(F._t);
    F._t=setTimeout(()=>{renderTasks();const n=$('#taskSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},260)};
  $$('.f-chip[data-chip]',v).forEach(c=>c.onclick=()=>{F.chip=c.dataset.chip;renderTasks()});
  $$('.f-chip[data-proj]',v).forEach(c=>c.onclick=()=>{F.project=F.project===c.dataset.proj?null:c.dataset.proj;renderTasks()});
  $$('.f-chip[data-view]',v).forEach(c=>c.onclick=()=>{const vw=S.views[+c.dataset.view];F.chip=vw.chip;F.project=vw.project||null;renderTasks()});
  $('#saveView').onclick=()=>{
    openModal({
      title:en?'Save current view':'احفظ العرض الحالي',
      body:`<label class="flabel">${en?'View name':'اسم العرض'}</label><input class="field" id="vwName" placeholder="${en?'e.g. Overdue work tasks':'مثال: مهام الشغل المتأخرة'}">`,
      actions:[
        {label:t('save'),cls:'btn-coral',fn:md=>{
          const n=$('#vwName',md).value.trim();
          if(n){S.views.push({name:n,chip:F.chip,project:F.project});emit('views');renderTasks();toast(en?'View saved — find it in the filters above':'اتحفظ العرض — هتلاقيه في الفلاتر فوق')}}},
        {label:t('cancel'),fn:()=>{}}
      ]
    })};
  $('#addTaskBtn').onclick=()=>openTaskEditor();
  $('#massBtn').onclick=()=>{window.__massMode=!window.__massMode;renderTasks()};
  if(F.chip==='trash'&&list.length){
    const b=document.createElement('button');b.className='btn-danger w-100 mt-2';
    b.innerHTML=`<i class="bi bi-trash"></i> ${en?'Empty trash forever':'إفراغ السلة نهائيًا'}`;
    b.onclick=async()=>{if(await confirmDlg(en?'Empty trash':'إفراغ السلة',en?'Everything in trash will be deleted forever, no undo. Sure?':'كل المهام في السلة هتتحذف نهائي ومفيش تراجع. متأكد؟',en?'Empty forever':'افرغ نهائيًا')){S.tasks=S.tasks.filter(x=>x.status!=='trash');emit('tasks-structure');renderTasks()}};
    $('#taskList').appendChild(b)}
  if(window.__massMode)renderBulkBar(v)}
function renderBulkBar(v){
  const en=isEn();
  const mount=$('#bulkMount',v);mount.innerHTML='';
  mount.innerHTML=`<div class="bulkbar"><b id="bulkN">0 ${en?'selected':'محددة'}</b>
    <button class="btn-soft" id="bkDone"><i class="bi bi-check2"></i> ${en?'Complete':'إكمال'}</button>
    <button class="btn-soft" id="bkTomorrow"><i class="bi bi-calendar-plus"></i> ${en?'Tomorrow':'لبكرة'}</button>
    <button class="btn-soft" id="bkNoDate"><i class="bi bi-calendar-x"></i> ${en?'No date':'بدون موعد'}</button>
    <button class="btn-danger" id="bkDel"><i class="bi bi-trash"></i> ${t('del')}</button>
    <button class="btn-soft" id="bkCancel" style="margin-inline-start:auto">${t('cancel')}</button></div>`;
  $$('.mass',v).forEach(cb=>cb.onchange=()=>{cb.checked?__mass.add(cb.dataset.mid):__mass.delete(cb.dataset.mid);
    const n=$('#bulkN');if(n)n.textContent=__mass.size+(en?' selected':' محددة')});
  $('#bkDone').onclick=()=>{bulkDone([...__mass]);exitMass()};
  $('#bkTomorrow').onclick=()=>{postponeTasks([...__mass],addDaysStr(todayStr(),1));exitMass()};
  $('#bkNoDate').onclick=()=>{[...__mass].forEach(id=>updateTask(id,{dueDate:null,dueTime:null},'meta'));emit('tasks-structure');exitMass()};
  $('#bkDel').onclick=()=>{[...__mass].forEach(id=>deleteTask(id));exitMass()};
  $('#bkCancel').onclick=exitMass;
  function exitMass(){window.__massMode=false;renderTasks()}}

// محرر المهمة — مفيش زر حفظ، كل تغيير بيتحفظ على طول
function openTaskEditor(id){
  const en=isEn();
  let isNew=!id;const tk=isNew?{...newTaskObj({title:''}),id:null}:taskById(id);
  if(!tk)return;const draft=JSON.parse(JSON.stringify(tk));
  const recOpts=en?[['','no repeat'],['daily','daily'],['weekly','weekly'],['monthly','monthly'],['everyN','every N days']]
    :[['','بدون تكرار'],['daily','يومي'],['weekly','أسبوعي'],['monthly','شهري'],['everyN','كل عدّة أيام']];
  openModal({
    title:isNew?t('newTask'):t('edit'),
    wide:true,
    body:`
    <input class="field mb-3" id="teTitle" placeholder="${en?'Task title…':'عنوان المهمة…'}" value="${esc(draft.title)}" style="font-size:16px;font-weight:600" aria-label="${en?'Task title':'عنوان المهمة'}">
    <div class="row g-3">
      <div class="col-6 col-md-3"><label class="flabel">${en?'Priority':'الأولوية'}</label>
        <div class="seg-ctrl w-100" id="tePrio">${[1,2,3,4].map(p=>`<button class="${draft.priority===p?'on':''}" data-p="${p}" style="flex:1">P${p}</button>`).join('')}</div></div>
      <div class="col-6 col-md-3"><label class="flabel">${en?'Project':'المشروع'}</label>
        <select class="field" id="teProj"><option value="">${en?'No project':'بدون مشروع'}</option>${S.projects.map(p=>`<option value="${p.id}" ${draft.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="col-6 col-md-3"><label class="flabel">${en?'Date':'التاريخ'}</label><input type="date" class="field mono" id="teDate" value="${draft.dueDate||''}"></div>
      <div class="col-6 col-md-3"><label class="flabel">${en?'Time':'الوقت'}</label><input type="time" class="field mono" id="teTime" value="${draft.dueTime||''}"></div>
      <div class="col-6 col-md-3"><label class="flabel">${en?'Estimate (min)':'التقدير (دقيقة)'}</label><input type="number" min="0" step="5" class="field mono" id="teEst" value="${draft.estimateMin||''}"></div>
      <div class="col-6 col-md-3"><label class="flabel">${en?'Repeat':'التكرار'}</label>
        <select class="field" id="teRec">${recOpts.map(([val,n])=>`<option value="${val}" ${draft.recurrence?.type===val?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="col-6 col-md-3" id="teNWrap" ${draft.recurrence?.type==='everyN'?'':'hidden'}><label class="flabel">${en?'Every how many days?':'كل كام يوم؟'}</label><input type="number" min="2" class="field mono" id="teN" value="${draft.recurrence?.n||3}"></div>
      <div class="col-12"><label class="flabel">${en?'Tags (comma separated)':'وسوم (افصل بفاصلة)'}</label><input class="field" id="teTags" value="${esc((draft.tags||[]).join('، '))}" placeholder="${en?'home, work':'بيت، شغل'}"></div>
      <div class="col-12"><label class="flabel">${en?'Notes (simple Markdown)':'وصف (Markdown بسيط)'}</label><textarea class="field" id="teNotes" placeholder="**bold** or - list">${esc(draft.notes||'')}</textarea></div>
      <div class="col-12"><label class="flabel">${en?'Substeps':'خطوات فرعية'}</label>
        <div id="teSubs"></div>
        <div class="d-flex gap-2 mt-2"><input class="field" id="teSubIn" placeholder="${en?'Add a step…':'أضف خطوة…'}" style="flex:1"><button class="btn-soft" id="teSubAdd" aria-label="${en?'Add step':'إضافة خطوة'}"><i class="bi bi-plus"></i></button></div></div>
      <div class="col-12"><label class="flabel">${en?'Blocked by':'تعتمد على'}</label>
        <select class="field" id="teBlocked"><option value="">${en?'none':'لا يوجد'}</option>${visTasks().filter(x=>x.id!==id&&x.status!=='done').map(x=>`<option value="${x.id}" ${draft.blockedBy===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></div>
    </div>`,
    actions:[...(isNew?[]:[{label:`<i class="bi bi-trash"></i> ${t('del')}`,cls:'btn-danger',fn:()=>{deleteTask(id)}}]),
      {label:t('doneBtn'),cls:'btn-coral',fn:()=>{}}],
    onOpen:(mdx)=>{
      const commit=()=>{
        if(isNew&&draft.title.trim()){
          const nt=addTask({...draft,title:draft.title},true);
          id=nt.id;isNew=false;
          mdx.querySelector('.m-head h3').textContent=t('edit');
        }else if(!isNew)updateTask(id,draft);
      };
      const T=$('#teTitle',mdx);T.oninput=()=>{draft.title=T.value;debCommit()};
      let dt;function debCommit(){clearTimeout(dt);dt=setTimeout(commit,450)}
      $$('#tePrio button',mdx).forEach(b=>b.onclick=()=>{draft.priority=+b.dataset.p;
        $$('#tePrio button',mdx).forEach(x=>x.classList.toggle('on',x===b));commit()});
      $('#teProj',mdx).onchange=e=>{draft.projectId=e.target.value||null;commit()};
      $('#teDate',mdx).onchange=e=>{draft.dueDate=e.target.value||null;commit()};
      $('#teTime',mdx).onchange=e=>{draft.dueTime=e.target.value||null;commit()};
      $('#teEst',mdx).onchange=e=>{draft.estimateMin=+e.target.value||0;commit()};
      $('#teRec',mdx).onchange=e=>{
        const val=e.target.value;
        draft.recurrence=val?{type:val,...(val==='everyN'?{n:+$('#teN',mdx).value||3}:{})}:null;
        $('#teNWrap',mdx).hidden=val!=='everyN';commit()};
      $('#teN',mdx).onchange=e=>{if(draft.recurrence)draft.recurrence.n=+e.target.value||3;commit()};
      $('#teTags',mdx).onchange=e=>{draft.tags=e.target.value.split(/[,،]/).map(s=>s.trim()).filter(Boolean);commit()};
      $('#teNotes',mdx).oninput=e=>{draft.notes=e.target.value;debCommit()};
      $('#teBlocked',mdx).onchange=e=>{draft.blockedBy=e.target.value||null;commit()};
      const addSub=()=>{const inp=$('#teSubIn',mdx);const tx=inp.value.trim();if(!tx)return;
        draft.subtasks.push({id:uid(),title:tx,done:false});inp.value='';commit();renderSubs()};
      $('#teSubAdd',mdx).onclick=addSub;
      $('#teSubIn',mdx).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addSub()}};
      function renderSubs(){
        $('#teSubs',mdx).innerHTML=draft.subtasks.map(s=>`<div class="subtask ${s.done?'done':''}" data-sid="${s.id}"><button class="subcheck" aria-label="${en?'complete step':'إكمال الخطوة'}"><i class="bi bi-check-lg"></i></button><span style="flex:1">${esc(s.title)}</span><button class="icon-btn del-sub" style="width:28px;height:28px;font-size:12px" aria-label="${en?'delete step':'حذف الخطوة'}"><i class="bi bi-x"></i></button></div>`).join('');
        $$('#teSubs .subtask',mdx).forEach(st=>{
          const sid=st.dataset.sid;
          $('.subcheck',st).onclick=()=>{
            const subtask=draft.subtasks.find(x=>x.id===sid);
            subtask.done=!subtask.done;
            commit();renderSubs();
          };
          $('.del-sub',st).onclick=()=>{
            draft.subtasks=draft.subtasks.filter(x=>x.id!==sid);
            commit();renderSubs();
          };
        });
      }
      renderSubs();
    }
  })}
