'use strict';
// الإضافة السريعة (N) + لوحة الأوامر (Ctrl+K) + الاختصارات العامة
function openQuickAdd(defaultDate){
  const en=isEn();
  openModal({
    title:t('quickTask'),
    body:`<input class="field" id="nqaIn" placeholder="${en?'e.g. Pay bills tomorrow 5pm #home !1 ~30m':'مثال: ادفع فاتورة الكهربا بكرة 5م #بيت !1 ~30د'}" style="font-size:15px" aria-label="task">
      <div class="tiny muted mt-2 mb-2">${en?'Arabic parser: understands اليوم/بكرة/الجمعة + #tag + !priority + ~estimate + كل يوم':'بيفهم: النهاردة، بكرة، الجمعة، 25/12، 5م، الصبح، كل يوم، كل اثنين ~ و #وسم و !أولوية و ~تقدير'}</div>
      <div id="nqaPreview" class="d-flex gap-1 flex-wrap"></div>`,
    onOpen:(md,close)=>{
      const input=$('#nqaIn',md);
      const preview=()=>{
        const parsed=parseQuickAdd(input.value);
        const bits=[];
        const today=todayStr();
        if(parsed.dueDate)bits.push(parsed.dueDate===today?t('secToday'):parsed.dueDate===addDaysStr(today,1)?(isEn()?'tmrw':'بكرة'):parsed.dueDate);
        if(parsed.dueTime)bits.push(parsed.dueTime);
        parsed.tags.forEach(tag=>bits.push('#'+tag));
        if(parsed.priority<4)bits.push('P'+parsed.priority);
        if(parsed.estimateMin)bits.push('~'+fmtMin(parsed.estimateMin));
        if(parsed.recurrence)bits.push(isEn()?'repeat':'تكرار');
        $('#nqaPreview',md).innerHTML=bits.map(bit=>`<span class="chip coral">${esc(bit)}</span>`).join('');
      };
      input.addEventListener('input',preview);
      input.addEventListener('keydown',event=>{
        if(event.key==='Enter'&&input.value.trim()){
          const parsed=parseQuickAdd(input.value);
          if(defaultDate&&!parsed.dueDate&&!parsed.recurrence)parsed.dueDate=defaultDate;
          addTask(parsed);
          close();
          announce('اتضافت مهمة جديدة');
        }
      });
      setTimeout(()=>input.focus(),60);
    }
  })}

/* ——— لوحة الأوامر (Ctrl+K) ——— */
let palSel=0;
function palItems(q){q=q.trim();const items=[];const en=isEn();
  const go=NAV_KEYS.map((k,i)=>({icon:ROUTES[k].i,label:(en?'Go to ':'روح لـ ')+ROUTES[k].n(),hint:String(i+1),run:()=>{location.hash='#/'+k}}));
  const cmds=[
   {icon:'bi-plus-lg',label:t('newTask'),hint:'N',run:()=>openQuickAdd()},
   {icon:'bi-sticky',label:en?'New note':'ملاحظة جديدة',hint:'',run:()=>{addNote({title:'',body:''});location.hash='#/notes'}},
   {icon:'bi-play-fill',label:t('startFocus'),hint:'F',run:()=>{pomoStart(firstFocusTaskId());location.hash='#/focus'}},
   {icon:'bi-moon-stars',label:t('closeDay'),hint:'',run:()=>{location.hash='#/today';openEOD()}},
   {icon:'bi-palette',label:en?'Toggle theme':'بدّل المظهر',hint:'Ctrl+Shift+D',run:cycleTheme},
   {icon:'bi-download',label:t('backup'),hint:'',run:exportJSON},
   {icon:'bi-keyboard',label:t('shortcuts'),hint:'؟',run:showShortcuts}];
  if(!q)return[...go,...cmds].slice(0,9);
  const ql=q.toLowerCase();
  items.push(...cmds.filter(c=>c.label.includes(q)));
  items.push(...go.filter(c=>c.label.includes(q)));
  visTasks().filter(x=>x.title.toLowerCase().includes(ql)||x.tags.some(tg=>tg.includes(q.replace('#','')))).slice(0,6)
    .forEach(x=>items.push({icon:x.status==='done'?'bi-check2-circle':'bi-circle',label:x.title,hint:en?'task':'مهمة',run:()=>openTaskEditor(x.id)}));
  S.notes.filter(n=>(n.title+' '+n.body).includes(q)).slice(0,3)
    .forEach(n=>items.push({icon:'bi-journal-text',label:n.title||n.body.slice(0,40),hint:en?'note':'ملاحظة',run:()=>{location.hash='#/notes'}}));
  if(!items.length)items.push({icon:'bi-plus-lg',label:en?`Create task: "${q}"`:`أنشئ مهمة: «${q}»`,hint:'',run:()=>addTask(parseQuickAdd(q))});
  return items}
function openPalette(){const pl=$('#palette');pl.hidden=false;palSel=0;
  const inp=$('#palInput');inp.value='';renderPal('');setTimeout(()=>inp.focus(),30)}
function closePalette(){$('#palette').hidden=true}
function renderPal(q){const items=palItems(q);palSel=clamp(palSel,0,items.length-1);
  $('#palList').innerHTML=items.map((it,i)=>`<li class="pal-item ${i===palSel?'sel':''}" role="option" aria-selected="${i===palSel}" data-i="${i}">
    <i class="bi ${it.icon}"></i><span>${esc(it.label)}</span>${it.hint?`<span class="hint kbd">${esc(it.hint)}</span>`:''}</li>`).join('');
  $$('#palList .pal-item').forEach(li=>li.onclick=()=>{closePalette();items[+li.dataset.i].run()});
  $('#palList')._items=items}
$('#palInput').addEventListener('input',e=>{palSel=0;renderPal(e.target.value)});
$('#palInput').addEventListener('keydown',e=>{const items=$('#palList')._items||[];
  if(e.key==='ArrowDown'){e.preventDefault();palSel=Math.min(palSel+1,items.length-1);renderPal(e.target.value)}
  if(e.key==='ArrowUp'){e.preventDefault();palSel=Math.max(palSel-1,0);renderPal(e.target.value)}
  if(e.key==='Enter'&&items[palSel]){e.preventDefault();closePalette();items[palSel].run()}
  if(e.key==='Escape')closePalette()});
$('[data-pal-close]').addEventListener('pointerdown',closePalette);

/* ——— الاختصارات العامة + شاشة المساعدة ——— */
function showShortcuts(){
  const en=isEn();
  const rows=[['Ctrl / ⌘ + K',en?'Command palette':'لوحة الأوامر'],['N',t('newTask')],['/',en?'Search':'بحث'],['F',en?'Start/stop pomodoro':'ابدأ / أوقف البومودورو'],['1 … 9',en?'Switch screens':'تبديل الشاشات'],['Space',en?'Complete selected task':'إكمال المهمة المحددة'],['E',en?'Edit selected task':'تعديل المهمة المحددة'],['Del',en?'Delete (with undo)':'حذف (مع تراجع)'],['Ctrl + ↑ ↓',en?'Move task':'تحريك المهمة'],['Ctrl + ← →',en?'Move across board columns':'نقل بين أعمدة اللوحة'],['Ctrl + Shift + D',en?'Toggle theme':'تبديل المظهر'],['Esc',en?'Close':'إغلاق'],['؟',en?'This screen':'هذه الشاشة']];
  openModal({title:t('shortcuts'),
    body:`<div class="shortcut-grid">${rows.map(([k,d])=>`<div class="sc"><span class="muted">${esc(d)}</span><span class="kbd">${esc(k)}</span></div>`).join('')}</div>`,
    actions:[{label:en?'OK':'تمام',cls:'btn-coral',fn:()=>{}}]})}
document.addEventListener('keydown',e=>{
  const typing=e.target.closest('input,textarea,select,[contenteditable]');
  if(e.key==='Escape'){
    if(!$('#palette').hidden){closePalette();return}
    if(!$('#focusOverlay').hidden){$('#focusOverlay').hidden=true;return}
    return}
  const k=e.key;
  if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='k'){e.preventDefault();
    if($('#palette').hidden)openPalette();else closePalette();return}
  if((e.ctrlKey||e.metaKey)&&e.shiftKey&&k.toLowerCase()==='d'){e.preventDefault();cycleTheme();return}
  if(typing)return;
  if(k==='n'||k==='N'){e.preventDefault();openQuickAdd(CUR==='today'?todayStr():null)}
  else if(k==='/'){e.preventDefault();openPalette()}
  else if(k==='f'||k==='F'){e.preventDefault();pomoToggle();if(CUR!=='focus')location.hash='#/focus'}
  else if(k==='?'||k==='؟'){e.preventDefault();showShortcuts()}
  else if(/^[1-9]$/.test(k)&&!e.ctrlKey&&!e.metaKey){const idx=+k-1;if(NAV_KEYS[idx])location.hash='#/'+NAV_KEYS[idx]}
  else if(k==='Delete'||k==='Backspace'){const sel=$('.task-row.sel');if(sel){e.preventDefault();deleteTask(sel.dataset.id)}}
  else if(e.ctrlKey&&(k==='ArrowUp'||k==='ArrowDown')){
    const sel=$('.task-row.sel')||document.activeElement.closest('.task-row');
    if(sel){
      e.preventDefault();
      const all=$$('.task-row').map(r=>r.dataset.id).map(taskById).filter(Boolean);
      if(reorderTask(sel.dataset.id,k==='ArrowUp'?-1:1,all)){
        announce('اتحركت المهمة');
        setTimeout(()=>{const n=$(`.task-row[data-id="${sel.dataset.id}"]`);
          if(n){n.classList.add('sel');n.focus()}},60);
      }
    }
  }
});
