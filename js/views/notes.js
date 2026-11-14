'use strict';
/* ============================================================
   views/notes.js — المذكرة (التقاط سريع + تحويل لمهمة)
============================================================ */
function renderNotes(){
  const v=$('#view');
  const en=isEn();
  v.innerHTML=`<div class="view-anim"><div class="sec-h mb-3"><h1 style="font-size:24px">${t('notesTitle')}</h1></div>
  <div class="d-flex gap-2 mb-3"><input class="field" id="noteQuick" placeholder="${t('notePh')}" aria-label="${t('notePh')}">
    <button class="btn-coral" id="noteAdd" style="min-width:46px" aria-label="${en?'Save idea':'حفظ الفكرة'}"><i class="bi bi-plus-lg"></i></button></div>
  <div class="notes-grid" id="notesGrid">
   ${S.notes.map(n=>`<button class="note-card" data-id="${n.id}">
     <b>${esc(n.title||(en?'Untitled':'بدون عنوان'))}</b><p>${esc(n.body)}</p>
     <div class="n-foot">${n.tags.map(x=>`<span class="tag-pill">#${esc(x)}</span>`).join('')}
     <span class="tiny muted" style="margin-inline-start:auto">${n.updatedAt.slice(0,10)}</span></div></button>`).join('')||`<div class="empty-state" style="grid-column:1/-1"><div class="e-ic"><i class="bi bi-journal"></i></div><b>${t('emptyNotesT')}</b><p>${t('emptyNotesS')}</p></div>`}
  </div></div>`;
  const nq=$('#noteQuick');
  const add=()=>{const txt=nq.value.trim();if(!txt)return;
    const first=txt.split('\n')[0];addNote({title:first.slice(0,80),body:txt});nq.value=''};
  nq.onkeydown=e=>{if(e.key==='Enter')add()};
  $('#noteAdd').onclick=add;
  $$('.note-card',v).forEach(c=>c.onclick=()=>{
    const n=S.notes.find(x=>x.id===c.dataset.id);
    if(!n)return;
    openModal({
      title:en?'Note':'ملاحظة',
      body:`
      <input class="field mb-3" id="neTitle" value="${esc(n.title)}" placeholder="${en?'Title (optional)':'عنوان (اختياري)'}">
      <textarea class="field mb-3" id="neBody" style="min-height:180px">${esc(n.body)}</textarea>
      <input class="field" id="neTags" value="${esc(n.tags.join('، '))}" placeholder="${en?'tags, comma separated':'وسوم بفاصلة'}">`,
      actions:[
        {label:`<i class="bi bi-check2-square"></i> ${t('toTask')}`,cls:'btn-teal',fn:()=>noteToTask(n.id)},
        {label:t('delNote'),cls:'btn-danger',fn:()=>deleteNote(n.id)},
        {label:t('close'),cls:'btn-ghost',fn:()=>{}}
      ],
      onOpen:(md)=>{
        let timer;
        const save=()=>{
          clearTimeout(timer);
          timer=setTimeout(()=>{
            updateNote(n.id,{
              title:$('#neTitle',md).value.trim(),
              body:$('#neBody',md).value,
              tags:$('#neTags',md).value.split(/[,،]/).map(tag=>tag.trim()).filter(Boolean)
            });
          },350);
        };
        ['neTitle','neBody','neTags'].forEach(fieldId=>{
          $('#'+fieldId,md).oninput=save;
        });
      }
    });
  })}
