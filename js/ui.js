'use strict';
// واجهة: توست + مودال (مع focus trap) + قوائم منسدلة
// وفي الآخر الدراج&دروب اليدوي (Pointer Events — ماوس ولمس)
function toast(msg,{icon='bi-check2',duration=4200,action=null}={}){
  const root=$('#toasts');while(root.children.length>2)root.firstChild.remove();
  const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');
  el.innerHTML=`<i class="bi ${icon}"></i><span style="flex:1">${esc(msg)}</span>`;
  if(action){const b=document.createElement('button');b.textContent=action.label;
    b.onclick=()=>{action.fn();kill()};el.appendChild(b)}
  root.appendChild(el);
  const tm=setTimeout(kill,action?7000:duration);
  function kill(){clearTimeout(tm);el.classList.add('out');setTimeout(()=>el.remove(),240)}
  return kill}

let LAST_FOCUS=null;
function openModal({title='',body='',wide=false,sheet=false,actions=[],onOpen=null,boxClass=''}={}){
  LAST_FOCUS=document.activeElement;
  const back=document.createElement('div');back.className='m-back'+(sheet?' sheet-back':'');
  const md=document.createElement('div');md.className=`modal-md ${wide?'wide ':''}${sheet?'sheet ':''}${boxClass}`;
  md.setAttribute('role','dialog');md.setAttribute('aria-modal','true');
  md.innerHTML=`<div class="m-head"><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="إغلاق"><i class="bi bi-x-lg"></i></button></div>
    <div class="m-body"></div>${actions.length?'<div class="m-foot"></div>':''}`;
  if(typeof body==='string')$('.m-body',md).innerHTML=body;else $('.m-body',md).appendChild(body);
  const foot=$('.m-foot',md);
  actions.forEach(a=>{const b=document.createElement('button');b.className=a.cls||'btn-ghost';b.innerHTML=a.label;
    b.onclick=()=>{const r=a.fn&&a.fn(md);if(r!==false)close()};if(foot)foot.appendChild(b)});
  back.appendChild(md);$('#modalRoot').appendChild(back);document.body.style.overflow='hidden';
  $('[data-x]',md).onclick=close;
  back.addEventListener('pointerdown',e=>{if(e.target===back)close()});
  function escH(e){if(e.key==='Escape'){e.stopPropagation();close()}
    if(e.key==='Tab'){const f=$$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',md).filter(x=>!x.disabled&&x.offsetParent!==null);
      if(!f.length)return;const first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}
  document.addEventListener('keydown',escH,true);
  function close(){document.removeEventListener('keydown',escH,true);back.remove();
    document.body.style.overflow='';
    if(LAST_FOCUS&&LAST_FOCUS.focus)try{LAST_FOCUS.focus()}catch(e){}}
  if(onOpen)onOpen(md,close);
  const focusable=$('input,textarea,select,button:not([data-x])',md);
  setTimeout(()=>{try{(focusable||$('[data-x]',md)).focus()}catch(e){}},40);
  return{close,el:md}}
function confirmDlg(title,msg,okLabel='تأكيد',okCls='btn-danger'){
  return new Promise(resolve=>{
    openModal({
      title:title,
      body:`<p class="muted" style="font-size:14px">${esc(msg)}</p>`,
      actions:[
        {label:okLabel,cls:okCls,fn:()=>resolve(true)},
        {label:'إلغاء',fn:()=>resolve(false)}
      ],
      onOpen:(md,close)=>{
        const backdrop=md.closest('.m-back');
        backdrop.addEventListener('pointerdown',event=>{
          if(event.target===backdrop)resolve(false);
        });
      }
    });
  })}
function openMenu(anchor,items){ // قائمة منسدلة عائمة
  closeMenus();
  const menu=document.createElement('div');menu.className='dn-menu';menu.setAttribute('role','menu');
  items.forEach(it=>{if(it==='-'){menu.appendChild(document.createElement('hr'));return}
    const b=document.createElement('button');b.setAttribute('role','menuitem');if(it.danger)b.classList.add('dgr');
    b.innerHTML=`<i class="bi ${it.icon||'bi-dot'}"></i><span>${esc(it.label)}</span>`;
    b.onclick=()=>{closeMenus();if(it.fn)it.fn()};menu.appendChild(b)});
  document.body.appendChild(menu);
  const r=anchor.getBoundingClientRect(),mw=190;
  let left=Math.min(r.left,innerWidth-mw-12);let top=r.bottom+6;
  if(top+menu.offsetHeight>innerHeight-10)top=r.top-menu.offsetHeight-6;
  menu.style.top=Math.max(8,top)+'px';menu.style.left=Math.max(8,left)+'px';
  anchor.setAttribute('aria-expanded','true');
  setTimeout(()=>document.addEventListener('pointerdown',outH),10);
  menu._h=outH;
  function outH(e){if(!menu.contains(e.target))closeMenus()}}
function closeMenus(){$$('.dn-menu').forEach(m=>{document.removeEventListener('pointerdown',m._h);m.remove()});
  $$('[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'))}

/* ——— سحب وإفلات عام بالـ Pointer Events (ماوس + لمس) ——— */
function makeDrag(el,{ghostHTML,onMove,onDrop,targetSel,onTap}){
  el.addEventListener('pointerdown',e=>{
    if(e.button>0||e.target.closest('button,a,input'))return;
    const sx=e.clientX,sy=e.clientY;let ghost=null,started=false,docTarget=null;
    const mv=ev=>{ev.preventDefault();
      if(!started){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;started=true;
        ghost=document.createElement('div');ghost.className='drag-ghost';ghost.innerHTML=ghostHTML();document.body.appendChild(ghost);el.classList.add('dragging')}
      ghost.style.left=(ev.clientX-90)+'px';ghost.style.top=(ev.clientY-20)+'px';
      if(targetSel){ghost.style.display='none';const under=document.elementFromPoint(ev.clientX,ev.clientY);ghost.style.display='';
        const trg=under&&under.closest(targetSel);
        if(trg!==docTarget){if(docTarget)docTarget.classList.remove('dragover');docTarget=trg;if(trg)trg.classList.add('dragover');if(onMove)onMove(trg,ev)}}};
    const up=ev=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);
      el.classList.remove('dragging');if(ghost)ghost.remove();if(docTarget)docTarget.classList.remove('dragover');
      if(started){if(onDrop)onDrop(docTarget,ev)}else if(onTap)onTap(ev)};
    window.addEventListener('pointermove',mv,{passive:false});
    window.addEventListener('pointerup',up)})}
