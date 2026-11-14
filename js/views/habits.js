'use strict';
// شاشة العادات — شبكة الأسبوع + سلاسل + خريطة السنة
const HABIT_ICONS=['bi-heart-pulse','bi-book','bi-cup-straw','bi-moon-stars','bi-person-walking','bi-translate','bi-journal-pen','bi-flower1','bi-music-note','bi-bicycle','bi-star','bi-sun'];
function weekDays(startRef){
  const d=parseD(startRef||todayStr());
  return Array.from({length:7},(_,i)=>addDaysStr(dstr(d),-WEEK_ORDER.indexOf(d.getDay())+i))}
function heatHTML(byKey,color='#2E7D6B',weeks=53){
  const ts=todayStr();
  const start=addDaysStr(ts,-(weeks*7-1-(6-WEEK_ORDER.indexOf(parseD(ts).getDay()))));
  let html=`<div class="heat" role="img" aria-label="${isEn()?'Yearly activity map':'خريطة نشاط سنوية'}">`;
  for(let i=0;i<weeks*7;i++){const ds=addDaysStr(start,i);
    if(cmpD(ds,ts)>0){html+='<div style="opacity:0"></div>';continue}
    const v=byKey[ds]||0;const lv=v<=0?0:v===1?1:v===2?2:3;
    html+=`<div class="${lv?'l'+lv:''}" style="--c:${color};--c-soft:${color}33" title="${ds}: ${v}"></div>`}
  return html+'</div>'}
const hDayName=d=>isEn()?parseD(d).toLocaleDateString('en-US',{weekday:'short'}):DAY_SHORT[parseD(d).getDay()];
function renderHabits(){
  const en=isEn();
  const ts=todayStr(),wk=weekDays();
  S.habits.forEach(h=>streakOf(h));
  const agg={};
  for(let i=0;i<370;i++){const ds=addDaysStr(ts,-i);
    const hs=S.habits.filter(h=>isScheduled(h,ds)&&cmpD(h.createdAt.slice(0,10)||ds,ds)<=0);
    if(hs.length){const dn=hs.filter(h=>habitDoneOn(h,ds)).length;agg[ds]=dn/hs.length>=1?3:dn/hs.length>=.66?2:dn>0?1:0}}
  const v=$('#view');
  v.innerHTML=`<div class="view-anim"><div class="sec-h mb-3"><h1 style="font-size:24px">${t('habitsTitle')}</h1>
    <button class="btn-coral sm" id="hAdd"><i class="bi bi-plus-lg"></i> ${t('newHabit')}</button></div>
  <p class="muted small mb-3">${t('habitsIntro')}</p>
  <div id="hList">
  ${S.habits.map(h=>{const st=streakOf(h),best=bestStreakOf(h);const isC=h.type==='counter';
    const yds=addDaysStr(ts,-1);
    const brokeMsg=h.entries[yds]===undefined&&st===0&&(best>=2)&&isScheduled(h,yds)&&h.skips.indexOf(yds)<0&&Object.keys(h.entries).length>2?
      `<div class="insight" style="margin-top:10px"><i class="bi bi-sun"></i><span>${en?`The streak stopped — that's natural. Your best was <b>${best}</b> days. Start from 1 today?`:`السلسلة وقفت — وده طبيعي. أفضل سلسلة ليك <b>${best}</b> يوم. نبدأ من 1 النهاردة؟`}</span></div>`:'';
    return`<div class="hbit" style="--c:${h.color};--c-soft:${h.color}22">
    <div class="h-top">
      <span class="h-ic"><i class="bi ${esc(h.icon)}"></i></span>
      <div style="flex:1;min-width:0"><b>${esc(h.name)}</b>
        <div class="tiny muted">${en?(h.type==='build'?'build':h.type==='quit'?'quit':'counter'):(h.type==='build'?'بناء عادة':h.type==='quit'?'إقلاع':'عدّاد')} · ${schedLabel(h)} ${h.cue?'· «'+esc(h.cue)+'»':''}</div></div>
      <span class="streak-chip" title="${en?'current streak':'السلسلة الحالية'}"><i class="bi bi-fire"></i>${st}</span>
      <span class="chip" title="${en?'best streak':'أفضل سلسلة'}">${en?'best':'أفضل'}: ${best}</span>
      <button class="icon-btn" data-hmenu="${h.id}" aria-label="${en?'Habit options':'خيارات العادة'}"><i class="bi bi-three-dots-vertical"></i></button></div>
    <div class="hweek">${wk.map(ds=>{const d=parseD(ds);const sch=isScheduled(h,ds);const done=habitDoneOn(h,ds);const sk=h.skips.includes(ds);
      const cls=!sch?'na':sk?'skip':done?'on':cmpD(ds,ts)<0?'off':'';
      const state=en?(done?'done':sk?'allowed':'missed'):(done?'تم':sk?'مسموح':'لم تتم');
      return`<div class="hw"><span>${hDayName(ds)}</span>
        <button class="hcell ${cls} ${ds===ts?'today-c':''}" data-hc="${h.id}" data-d="${ds}" ${!sch?'disabled':''} aria-label="${esc(h.name)} ${ds}: ${state}"></button></div>`}).join('')}</div>
    <div class="d-flex align-items-center gap-3 mt-2 flex-wrap">
      ${isC?`<div class="d-flex align-items-center gap-2"><button class="btn-soft sm" data-cnt="${h.id}" data-dc="-1" aria-label="${en?'decrease':'إنقاص'}">−</button>
        <b class="mono">${entryVal(h,ts)}/${h.target} ${esc(h.unit||'')}</b>
        <button class="btn-soft sm" data-cnt="${h.id}" data-dc="1" aria-label="${en?'increase':'زيادة'}">+</button></div>`:''}
      <button class="sec-a btn btn-link p-0" data-skip="${h.id}"><i class="bi bi-pause-circle"></i> ${h.skips.includes(ts)?(en?'Remove allowed day':'إلغاء يوم السماح'):(en?'Allowed day today':'يوم سماح النهاردة')}</button>
      <button class="sec-a btn btn-link p-0" data-heat="${h.id}"><i class="bi bi-grid-3x3"></i> ${en?'Year map':'الخريطة السنوية'}</button></div>
    <div data-heatbox="${h.id}" hidden class="mt-2">${heatHTML(Object.fromEntries(Object.entries(h.entries).map(([k,v2])=>[k,v2.value>=(h.target||1)?3:v2.value>0?1:0])),h.color)}</div>
    ${brokeMsg}</div>`}).join('')||`<div class="empty-state"><div class="e-ic"><i class="bi bi-flower1"></i></div><b>${t('emptyHabitsT')}</b><p>${t('emptyHabitsS')}</p>
    <button class="btn-coral mt-3" onclick="document.getElementById('hAdd').click()">${t('addFirstHabit')}</button></div>`}
  </div>
  ${S.habits.length?`<div class="sec"><div class="mcard flat"><div class="sec-h"><span class="sec-t"><i class="bi bi-grid-3x3-gap"></i> ${en?'Year map — all habits':'خريطة السنة — كل العادات'}</span></div>
    ${heatHTML(agg,'#2E7D6B')}
    <div class="heat-lb">${en?'less':'أقل'} <span class="sq" style="background:var(--bg-2)"></span><span class="sq" style="background:#2E7D6B33"></span><span class="sq" style="background:#2E7D6B99"></span><span class="sq" style="background:#2E7D6B"></span> ${en?'more':'أكثر'}</div></div></div>`:''}
  </div>`;
  $('#hAdd').onclick=()=>openHabitEditor();
  $$('[data-hmenu]',v).forEach(b=>b.onclick=()=>openMenu(b,[
    {label:en?'Edit habit':'تعديل العادة',icon:'bi-pencil',fn:()=>openHabitEditor(b.dataset.hmenu)},
    {label:t('del'),icon:'bi-trash',danger:true,fn:()=>deleteHabit(b.dataset.hmenu)}]));
  $$('[data-hc]',v).forEach(c=>c.onclick=()=>{
    const r=toggleHabit(c.dataset.hc,c.dataset.d);if(!r)return;emit('habits');renderHabits()});
  $$('[data-cnt]',v).forEach(b=>b.onclick=()=>{incCounter(b.dataset.cnt,+b.dataset.dc);emit('habits');renderHabits()});
  $$('[data-skip]',v).forEach(b=>b.onclick=()=>{skipHabit(b.dataset.skip);renderHabits()});
  $$('[data-heat]',v).forEach(b=>b.onclick=()=>{const bx=$(`[data-heatbox="${b.dataset.heat}"]`,v);if(bx)bx.hidden=!bx.hidden})}
function schedLabel(h){const s=h.schedule;const en=isEn();
  if(s.type==='daily')return en?'daily':'يومي';
  if(s.type==='weekdays')return(s.weekdays||[]).map(w=>en?new Date(2024,0,7+w).toLocaleDateString('en-US',{weekday:'short'}):DAY_SHORT[w]).join(' · ')||(en?'custom days':'أيام مخصصة');
  if(s.type==='timesPerWeek')return en?`${s.times||3}x a week`:`${s.times||3} مرات في الأسبوع`;
  return en?`every ${s.n||2} days`:`كل ${s.n||2} يوم`}
function openHabitEditor(id){
  const en=isEn();
  const isNew=!id;const h=isNew?{name:'',icon:'bi-star',color:'#2E7D6B',type:'build',target:1,unit:'',schedule:{type:'daily'},cue:'',reminderTime:''}:S.habits.find(x=>x.id===id);
  if(!h)return;const draft=JSON.parse(JSON.stringify(h));
  openModal({
    title:isNew?t('newHabit'):(en?'Edit habit':'تعديل العادة'),
    body:`
    <div class="row g-3">
     <div class="col-12"><label class="flabel">${en?'Habit name':'اسم العادة'}</label><input class="field" id="heName" value="${esc(draft.name)}" placeholder="${en?'e.g. Walk 20 minutes':'مثال: مشي 20 دقيقة'}"></div>
     <div class="col-12"><label class="flabel">${en?'Icon':'الأيقونة'}</label><div class="d-flex gap-1 flex-wrap" id="heIcons">${HABIT_ICONS.map(ic=>`<button class="icon-btn ${draft.icon===ic?'always':''}" data-ic="${ic}" aria-label="icon"><i class="bi ${ic}"></i></button>`).join('')}</div></div>
     <div class="col-12"><label class="flabel">${en?'Color':'اللون'}</label><div class="d-flex gap-2" id="heColors">${PROJECT_COLORS.map(c=>`<button data-c="${c}" style="width:30px;height:30px;border-radius:50%;background:${c};${draft.color===c?'box-shadow:0 0 0 3px var(--card),0 0 0 5px '+c:''}" aria-label="color ${c}"></button>`).join('')}</div></div>
     <div class="col-6"><label class="flabel">${en?'Type':'النوع'}</label><div class="seg-ctrl w-100" id="heType">${[['build',en?'Build':'بناء'],['quit',en?'Quit':'إقلاع'],['counter',en?'Counter':'عدّاد']].map(([k,n])=>`<button class="${draft.type===k?'on':''}" data-t="${k}" style="flex:1">${n}</button>`).join('')}</div></div>
     <div class="col-6"><label class="flabel">${en?'Repeat':'التكرار'}</label><select class="field" id="heSched">
       ${(en?[['daily','daily'],['weekdays','specific days'],['timesPerWeek','times a week'],['everyN','every N days']]:[['daily','يومي'],['weekdays','أيام محددة'],['timesPerWeek','مرات في الأسبوع'],['everyN','كل عدّة أيام']]).map(([k,n])=>`<option value="${k}" ${draft.schedule.type===k?'selected':''}>${n}</option>`).join('')}</select></div>
     <div class="col-12" id="heWWrap" ${draft.schedule.type==='weekdays'?'':'hidden'}><div class="d-flex gap-1 flex-wrap">${[6,0,1,2,3,4,5].map(w=>`<button class="f-chip ${(draft.schedule.weekdays||[]).includes(w)?'on':''}" data-w="${w}">${en?new Date(2024,0,7+w).toLocaleDateString('en-US',{weekday:'short'}):DAY_SHORT[w]}</button>`).join('')}</div></div>
     <div class="col-6" id="heTimesWrap" ${draft.schedule.type==='timesPerWeek'?'':'hidden'}><label class="flabel">${en?'How many times?':'كام مرة؟'}</label><input type="number" min="1" max="7" class="field mono num-in" id="heTimes" value="${draft.schedule.times||3}"></div>
     <div class="col-6" id="heNWrap" ${draft.schedule.type==='everyN'?'':'hidden'}><label class="flabel">${en?'Every how many days?':'كل كام يوم؟'}</label><input type="number" min="2" class="field mono num-in" id="heN" value="${draft.schedule.n||2}"></div>
     <div class="col-6" id="heTargetWrap" ${draft.type==='counter'?'':'hidden'}><label class="flabel">${en?'Daily target':'الهدف اليومي'}</label><input type="number" min="1" class="field mono num-in" id="heTarget" value="${draft.target}"></div>
     <div class="col-6" ${draft.type==='counter'?'':'hidden'} id="heUnitWrap"><label class="flabel">${en?'Unit':'الوحدة'}</label><input class="field" id="heUnit" value="${esc(draft.unit||'')}" placeholder="${en?'cup / page':'كوب / صفحة'}"></div>
     <div class="col-7"><label class="flabel">${en?'Habit stacking — "after…"':'Habit Stacking — «بعد …»'}</label><input class="field" id="heCue" value="${esc(draft.cue||'')}" placeholder="${en?'after coffee / after dawn prayer':'بعد القهوة / بعد صلاة الفجر'}"></div>
     <div class="col-5"><label class="flabel">${en?'Reminder (optional)':'تذكير (اختياري)'}</label><input type="time" class="field mono" id="heRem" value="${draft.reminderTime||''}"></div>
    </div>`,
    actions:isNew?[{label:`<i class="bi bi-plus-lg"></i> ${en?'Add habit':'أضف العادة'}`,cls:'btn-coral',fn:md=>{
        draft.name=$('#heName',md).value.trim();
        if(!draft.name){toast(en?'Write the habit name first':'اكتب اسم العادة الأول',{icon:'bi-pencil'});return false}
        addHabit(draft);toast(en?'New habit born — congrats!':'عادة جديدة اتولدت — مبارك!')}}]
      :[{label:t('doneBtn'),cls:'btn-coral',fn:()=>{updateHabit(id,draft)}}],
    onOpen:(md)=>{
      $$('#heIcons button',md).forEach(b=>b.onclick=()=>{draft.icon=b.dataset.ic;
        $$('#heIcons button',md).forEach(x=>x.classList.toggle('always',x===b))});
      $$('#heColors button',md).forEach(b=>b.onclick=()=>{draft.color=b.dataset.c;
        $$('#heColors button',md).forEach(x=>{x.style.boxShadow=x===b?`0 0 0 3px var(--card),0 0 0 5px ${b.dataset.c}`:''})});
      $$('#heType button',md).forEach(b=>b.onclick=()=>{draft.type=b.dataset.t;
        $$('#heType button',md).forEach(x=>x.classList.toggle('on',x===b));
        $('#heTargetWrap',md).hidden=$('#heUnitWrap',md).hidden=draft.type!=='counter'});
      $('#heSched',md).onchange=e=>{draft.schedule={type:e.target.value};
        $('#heWWrap',md).hidden=e.target.value!=='weekdays';
        $('#heTimesWrap',md).hidden=e.target.value!=='timesPerWeek';
        $('#heNWrap',md).hidden=e.target.value!=='everyN'};
      $$('#heWWrap [data-w]',md).forEach(b=>b.onclick=()=>{
        draft.schedule.weekdays=draft.schedule.weekdays||[];
        const w=+b.dataset.w;const i=draft.schedule.weekdays.indexOf(w);
        if(i>=0)draft.schedule.weekdays.splice(i,1);else draft.schedule.weekdays.push(w);
        b.classList.toggle('on')});
      ['heTimes','heN','heTarget','heUnit','heCue','heRem','heName'].forEach(fid=>{
        const el=$('#'+fid,md);
        if(el)el.onchange=()=>{
          if(fid==='heTimes')draft.schedule.times=+el.value;
          if(fid==='heN')draft.schedule.n=+el.value;
          if(fid==='heTarget')draft.target=+el.value;
          if(fid==='heUnit')draft.unit=el.value;
          if(fid==='heCue')draft.cue=el.value;
          if(fid==='heRem')draft.reminderTime=el.value;
          if(fid==='heName')draft.name=el.value;
        };
      });
    }
  })}
