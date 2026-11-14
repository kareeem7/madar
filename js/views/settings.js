'use strict';
// الإعدادات + تصدير/استيراد — كل حاجة تحفظ فوري من غير زر حفظ
function download(fname,content,type='application/json'){const b=new Blob([content],{type});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
function exportJSON(){download(`madar-backup-${todayStr()}.json`,JSON.stringify({app:'madar',version:1,exportedAt:new Date().toISOString(),state:S,sessions:SES},null,1));
  toast(isEn()?'Backup downloaded':'اتنزّلت النسخة الاحتياطية',{icon:'bi-download'})}
function exportICS(){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//madar//ar'];
  visTasks().filter(x=>x.dueDate).forEach(x=>{const d=x.dueDate.replace(/-/g,'');
    lines.push('BEGIN:VEVENT',`UID:${x.id}@madar`,`DTSTART;VALUE=DATE:${d}`,`DTEND;VALUE=DATE:${d}`,`SUMMARY:${x.title.replace(/\n/g,' ')}`,'END:VEVENT')});
  lines.push('END:VCALENDAR');download(`madar-${todayStr()}.ics`,lines.join('\r\n'),'text/calendar');
  toast(isEn()?'Scheduled tasks exported as ICS':'اتصدّرت المهام المجدولة بصيغة ICS',{icon:'bi-calendar-check'})}
function renderSettings(){
  const en=isEn();
  const st=S.settings,Pm=st.pomodoro,N=st.notifications;
  const v=$('#view');
  v.innerHTML=`<div class="view-anim"><div class="sec-h mb-3"><h1 style="font-size:24px">${t('setTitle')}</h1></div>
  <div class="set-group">
    <div class="set-row"><div class="sr-t"><b>${t('stTheme')}</b><span>${t('stThemeD')}</span></div>
      <div class="seg-ctrl" id="stTheme">${[['auto',`<i class="bi bi-circle-half"></i> ${t('themeAuto')}`],['light',`<i class="bi bi-sun"></i> ${t('themeLight')}`],['dark',`<i class="bi bi-moon"></i> ${t('themeDark')}`]].map(([k,n])=>`<button class="${st.theme===k?'on':''}" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="set-row"><div class="sr-t"><b>${t('stLang')}</b><span>${t('stLangD')}</span></div>
      <div class="seg-ctrl" id="stLang">${[['ar','عربي'],['en','English']].map(([k,n])=>`<button class="${st.lang===k?'on':''}" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="set-row"><div class="sr-t"><b>${t('stDensity')}</b></div>
      <div class="seg-ctrl" id="stDensity">${[['comfort',t('densityComf')],['compact',t('densityComp')]].map(([k,n])=>`<button class="${st.density===k?'on':''}" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="set-row"><div class="sr-t"><b>${t('stKiosk')}</b><span>${t('stKioskD')}</span></div>
      <span class="switch"><input type="checkbox" id="stKiosk" ${st.kiosk?'checked':''}><span class="tr"><span class="th"></span></span></span></div>
  </div>
  <div class="set-group">
    <div class="set-row"><div class="sr-t"><b>${t('pmTimes')}</b><span>${t('pmTimesD')}</span></div>
      <div class="d-flex gap-2"><input type="number" class="field mono num-in" id="pmF" min="5" max="90" value="${Pm.focus}" aria-label="${t('modeFocus')}">
      <input type="number" class="field mono num-in" id="pmS" min="1" max="30" value="${Pm.short}" aria-label="${t('modeShort')}">
      <input type="number" class="field mono num-in" id="pmL" min="5" max="60" value="${Pm.long}" aria-label="${t('modeLong')}"></div></div>
    <div class="set-row"><div class="sr-t"><b>${t('pmCycles')}</b></div><input type="number" class="field mono num-in" id="pmC" min="2" max="8" value="${Pm.cyclesBeforeLong}"></div>
    <div class="set-row"><div class="sr-t"><b>${t('pmTarget')}</b><span>${t('pmTargetD')}</span></div><input type="number" class="field mono num-in" id="pmT" min="30" step="15" value="${Pm.dailyTargetMinutes}"></div>
    <div class="set-row"><div class="sr-t"><b>${t('pmSound')}</b></div>
      <select class="field" id="pmSound">${[['bell',t('soundBell')],['none',t('soundNone')]].map(([k,n])=>`<option value="${k}" ${Pm.sound===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="set-row"><div class="sr-t"><b>${t('autoBreak')}</b></div><span class="switch"><input type="checkbox" id="pmAB" ${Pm.autoStartBreak?'checked':''}><span class="tr"><span class="th"></span></span></span></div>
    <div class="set-row"><div class="sr-t"><b>${t('autoFocus')}</b></div><span class="switch"><input type="checkbox" id="pmAF" ${Pm.autoStartFocus?'checked':''}><span class="tr"><span class="th"></span></span></span></div>
    <div class="set-row"><div class="sr-t"><b>${t('dnd')}</b><span>${en?'Hides non-critical counters and notifications':'يخفي الإشعارات والعدّادات غير الحرجة'}</span></div><span class="switch"><input type="checkbox" id="pmDnd" ${Pm.dnd?'checked':''}><span class="tr"><span class="th"></span></span></span></div>
  </div>
  <div class="set-group">
    <div class="set-row"><div class="sr-t"><b>${t('yourName')}</b></div><input class="field" id="stName" value="${esc(S.user.name)}" style="max-width:180px"></div>
    <div class="set-row"><div class="sr-t"><b>${t('notifs')}</b><span>${t('notifsD')}</span></div>
      <span class="switch"><input type="checkbox" id="ntEn" ${N.enabled?'checked':''}><span class="tr"><span class="th"></span></span></span></div>
    <div class="set-row"><div class="sr-t"><b>${t('leadMin')}</b></div>
      <select class="field" id="ntLead">${[5,10,15,30].map(mx=>`<option value="${mx}" ${N.reminderLeadMin===mx?'selected':''}>${mx} ${t('minUnit')}</option>`).join('')}</select></div>
  </div>
  <div class="set-group">
    <div class="set-row"><div class="sr-t"><b>${t('backup')}</b><span>${t('backupD')} (${S.meta.lastBackup||(en?'not yet':'لسّه')})</span></div>
      <button class="btn-soft sm" id="expJ"><i class="bi bi-download"></i> JSON</button></div>
    <div class="set-row"><div class="sr-t"><b>${t('icsX')}</b><span>${t('icsD')}</span></div>
      <button class="btn-soft sm" id="expI"><i class="bi bi-calendar-arrow-down"></i> ICS</button></div>
    <div class="set-row"><div class="sr-t"><b>${t('importX')}</b><span>${t('importD')}</span></div>
      <button class="btn-soft sm" id="impJ"><i class="bi bi-upload"></i> ${en?'Import':'استيراد'}</button></div>
    <div class="set-row"><div class="sr-t"><b>${t('install')}</b><span>${t('installD')}</span></div>
      <button class="btn-soft sm" id="pwaBtn" ${window.__pwadefer?'':'disabled'}><i class="bi bi-phone"></i> ${t('installBtn')}</button></div>
    <div class="set-row"><div class="sr-t"><b>${t('shortcuts')}</b></div>
      <button class="btn-soft sm" id="kbdHelp"><i class="bi bi-keyboard"></i> ${t('kbdShow')}</button></div>
    <div class="set-row"><div class="sr-t"><b>${t('wipe')}</b><span>${t('wipeD')}</span></div>
      <button class="btn-danger sm" id="wipeBtn"><i class="bi bi-trash"></i> ${t('wipeBtn')}</button></div>
  </div>
  <div class="set-group"><div class="set-row"><div class="sr-t"><b>${t('achievements')}</b></div></div>
    <div class="set-row" style="gap:9px;flex-wrap:wrap">${ACH.map(a=>{const on=S.gamification.achievements.includes(a.id);
      return`<span class="chip ${on?'amber':''}" style="font-size:12.5px;padding:6px 14px"><i class="bi ${on?'bi-trophy-fill':'bi-trophy'}"></i> ${a.n}</span>`}).join('')}</div></div></div>`;
  const bind=(id,fn,ev='change')=>{const el=$('#'+id,v);if(el)el.addEventListener(ev,()=>{fn(el);emit('settings')})};
  $$('#stTheme button',v).forEach(b=>b.onclick=()=>{st.theme=b.dataset.v;__applyTheme();emit('settings');renderSettings()});
  $$('#stLang button',v).forEach(b=>b.onclick=()=>{st.lang=b.dataset.v;__applyLang();emit('settings')});
  $$('#stDensity button',v).forEach(b=>b.onclick=()=>{st.density=b.dataset.v;__applyTheme();emit('settings');renderSettings()});
  bind('stKiosk',el=>{st.kiosk=el.checked;__applyTheme()});
  bind('pmF',el=>Pm.focus=clamp(+el.value||25,5,90));bind('pmS',el=>Pm.short=clamp(+el.value||5,1,30));
  bind('pmL',el=>Pm.long=clamp(+el.value||15,5,60));bind('pmC',el=>Pm.cyclesBeforeLong=clamp(+el.value||4,2,8));
  bind('pmT',el=>Pm.dailyTargetMinutes=clamp(+el.value||180,30,720));bind('pmSound',el=>Pm.sound=el.value);
  bind('pmAB',el=>Pm.autoStartBreak=el.checked);bind('pmAF',el=>Pm.autoStartFocus=el.checked);
  bind('pmDnd',el=>Pm.dnd=el.checked);
  bind('stName',el=>{S.user.name=el.value.trim();emit('user')},'input');
  bind('ntEn',async el=>{if(el.checked&&'Notification'in window){const p=await Notification.requestPermission();
      if(p!=='granted'){el.checked=false;toast(en?'Browser denied the permission — enable it from site settings':'المتصفح رفض الإذن — تقدر تفعله من إعدادات الموقع',{icon:'bi-bell-slash'})}}
    N.enabled=el.checked});
  bind('ntLead',el=>N.reminderLeadMin=+el.value);
  $('#expJ').onclick=exportJSON;$('#expI').onclick=exportICS;
  $('#impJ').onclick=()=>$('#importFile').click();
  $('#pwaBtn').onclick=()=>{if(window.__pwadefer){__pwadefer.prompt();__pwadefer.userChoice.then(()=>{__pwadefer=null;renderSettings()})}};
  $('#kbdHelp').onclick=showShortcuts;
  $('#wipeBtn').onclick=async()=>{if(await confirmDlg(en?'Wipe all data':'مسح كل البيانات',en?'All tasks, habits and sessions will be deleted forever. Sure?':'كل المهام والعادات والجلسات هتتمسح نهائيًا. واثق؟',en?'Wipe everything':'امسح كل حاجة')){
    localStorage.removeItem('madar:state');localStorage.removeItem('madar:draft');idbClear();location.reload()}}}
$('#importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;
  try{const data=JSON.parse(await f.text());
    if(!data||!data.state)throw 0;
    const fresh=migrate(data.state);
    for(const k of Object.keys(S))delete S[k];Object.assign(S,fresh);
    if(Array.isArray(data.sessions)){SES.splice(0,SES.length,...data.sessions);idbClear();data.sessions.forEach(idbAdd)}
    persist();__applyTheme();toast(isEn()?'Backup restored — welcome back':'اترجعت النسخة بنجاح — أهلاً بيك تاني',{icon:'bi-check2-all'});emit('remote');
  }catch(err){toast(isEn()?'This file is not a valid MADAR backup':'الملف ده مش نسخة مدار صالحة',{icon:'bi-exclamation-triangle'})}
  e.target.value=''});
