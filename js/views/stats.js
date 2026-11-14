'use strict';
// الإحصائيات: شارتس SVG مرسومة باليد + رؤى نصية + مراجعة الجمعة
function weekKey(ds){const d=parseD(ds);return addDaysStr(ds,-WEEK_ORDER.indexOf(d.getDay()))}
function lineChartSVG(data){ // آخر 30 يوم
  const W=560,H=170,PD=26;const max=Math.max(...data.map(d=>d.val),30);
  const X=i=>PD+(W-2*PD)*i/(data.length-1),Y=v=>H-PD-(H-2*PD)*v/max;
  const pts=data.map((d,i)=>[X(i),Y(d.val)]);
  const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area=path+`L${X(data.length-1)},${H-PD}L${X(0)},${H-PD}Z`;
  return`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${isEn()?'30-day focus line chart':'رسم خطي لتركيز آخر 30 يوم'}">
   <defs><linearGradient id="lgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--coral)" stop-opacity=".35"/><stop offset="1" stop-color="var(--coral)" stop-opacity="0"/></linearGradient></defs>
   ${[0,.5,1].map(f=>`<line class="grid-l" x1="${PD}" x2="${W-PD}" y1="${Y(max*f)}" y2="${Y(max*f)}"/>`).join('')}
   <path class="area" d="${area}"/><path class="ln" d="${path}"/>
   <circle class="pt" cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="4"/>
   <text class="lbl" x="${PD}" y="${H-6}">${data[0].lbl}</text>
   <text class="lbl" x="${W-PD}" y="${H-6}" text-anchor="end">${data[data.length-1].lbl}</text>
   <text class="lbl" x="${PD}" y="${Y(max)+4}">${Math.round(max)}${isEn()?'m':'د'}</text></svg>`}
function barsChartSVG(data){
  const W=560,H=170,PD=26;const max=Math.max(...data.map(d=>d.val),5);const bw=(W-2*PD)/data.length;
  return`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${isEn()?'Weekly completed tasks':'أعمدة المهام المكتملة أسبوعيًا'}">
   ${[0,.5,1].map(f=>`<line class="grid-l" x1="${PD}" x2="${W-PD}" y1="${H-PD-(H-2*PD)*f}" y2="${H-PD-(H-2*PD)*f}"/>`).join('')}
   ${data.map((d,i)=>`<rect class="bar ${i<data.length-1?'dim':''}" x="${PD+bw*i+bw*.17}" y="${H-PD-(H-2*PD)*d.val/max}" width="${bw*.66}" height="${Math.max(2,(H-2*PD)*d.val/max)}" rx="5"/>
    <text class="lbl" x="${PD+bw*i+bw/2}" y="${H-6}" text-anchor="middle">${d.lbl}</text>
    <text class="lbl" x="${PD+bw*i+bw/2}" y="${H-PD-(H-2*PD)*d.val/max-5}" text-anchor="middle" style="font-weight:700">${d.val||''}</text>`).join('')}</svg>`}
function donutSVG(items){ // [{name,val,color}]
  const tot=items.reduce((a,i)=>a+i.val,0)||1;const R=70,C=2*Math.PI*R;let acc=0;
  const segs=items.map(i=>{const off=acc/tot*C;acc+=i.val;
    return`<circle cx="90" cy="90" r="${R}" fill="none" stroke="${i.color}" stroke-width="22" stroke-dasharray="${(i.val/tot*C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 90 90)"/>`}).join('');
  return`<div class="d-flex align-items-center gap-4 flex-wrap">
   <svg width="150" height="150" viewBox="0 0 180 180" role="img" aria-label="${isEn()?'Tasks by project':'توزيع المهام على المشاريع'}">${segs}
    <text x="90" y="86" text-anchor="middle" style="font:700 26px var(--f-mono);fill:var(--ink)">${tot}</text>
    <text x="90" y="106" text-anchor="middle" style="font:12px var(--f-body);fill:var(--muted)">${isEn()?'tasks':'مهمة'}</text></svg>
   <div class="legend d-block">${items.map(i=>`<div class="mb-1"><span class="dot" style="background:${i.color}"></span>${esc(i.name)} · <b class="mono">${i.val}</b> (${Math.round(i.val/tot*100)}%)</div>`).join('')}</div></div>`}
function renderStats(){
  const en=isEn();
  const ts=todayStr();
  const focusByDay={};
  SES.filter(s=>s.type==='focus').forEach(s=>{const k=dstr(new Date(s.startedAt));focusByDay[k]=(focusByDay[k]||0)+s.actualMin});
  const d30=Array.from({length:30},(_,i)=>{const ds=addDaysStr(ts,-(29-i));
    const d=parseD(ds);
    return{lbl:i%7===0?d.getDate()+'/'+(d.getMonth()+1):'',val:focusByDay[ds]||0}});
  const weekN=Array.from({length:6},(_,i)=>{const wk=addDaysStr(weekKey(ts),-(5-i)*7);
    const n=S.tasks.filter(x=>x.status==='done'&&x.completedAt&&cmpD(dstr(new Date(x.completedAt)),wk)>=0&&cmpD(dstr(new Date(x.completedAt)),addDaysStr(wk,6))<=0).length;
    return{lbl:i===5?(en?'This week':'هذا الأسبوع'):(en?'w-'+(5-i):'قبل '+(5-i)),val:n}});
  const byProj={};visTasks().forEach(x=>{const p=projById(x.projectId);const k=p?p.name:(en?'No project':'بدون مشروع');
    byProj[k]=(byProj[k]||{val:0,color:p?p.color:'#9BA0AA'});byProj[k].val++});
  const donutItems=Object.entries(byProj).map(([name,o])=>({name,val:o.val,color:o.color}));
  const sumRange=(start,days)=>{let s=0;for(let i=0;i<days;i++)s+=focusByDay[addDaysStr(ts,-(start+i))]||0;return s};
  const thisW=sumRange(0,7),lastW=sumRange(7,7);
  const delta=lastW?Math.round((thisW-lastW)/lastW*100):(thisW>0?100:0);
  const doneThisW=weekN[5].val,doneLastW=weekN[4].val;
  const deltaT=doneLastW?Math.round((doneThisW-doneLastW)/doneLastW*100):(doneThisW>0?100:0);
  const insights=[];
  const hours={};SES.filter(s=>s.type==='focus'&&s.completed).forEach(s=>{const h=new Date(s.startedAt).getHours();hours[h]=(hours[h]||0)+s.actualMin});
  const best=Object.entries(hours).sort((a,b)=>b[1]-a[1])[0];
  if(best){
    const hh=en?(+best[0]>12?(+best[0]-12)+'pm':best[0]+'am'):(+best[0]>12?(+best[0]-12)+'م':best[0]+'ص');
    insights.push({i:'bi-sunrise',t:en?`Your best focus is around <b>${hh}</b>. Schedule hard tasks there.`:`أفضل ساعات تركيزك حوالي <b>${hh}</b>. جدول مهامك الصعبة في الوقت ده.`})}
  const todays=todayTasks();const td=todays.filter(x=>x.status==='done').length;
  if(todays.length){const pct=Math.round(td/todays.length*100);
    insights.push({i:'bi-clipboard2-check',t:en?`Today you finished <b>${pct}%</b> of your tasks (${td}/${todays.length}).${pct>=70?' Solid number — keep going.':' Priorities first.'}`:`النهاردة خلّصت <b>${pct}%</b> من مهامك (${td}/${todays.length}).${pct>=70?' نسبة تحترم — كمّل.':' ركّز على الأولويات الأول.'}`})}
  const streaks=S.habits.map(h=>({h,s:streakOf(h)})).sort((a,b)=>b.s-a.s);
  if(streaks[0]&&streaks[0].s>0)insights.push({i:'bi-fire',t:en?`"${esc(streaks[0].h.name)}" is your strongest habit — <b>${streaks[0].s}</b> days.`:`عادة «${esc(streaks[0].h.name)}» أقوى عادة عندك — سلسلة <b>${streaks[0].s}</b> يوم.`});
  const weak=streaks.filter(x=>x.h.entries[addDaysStr(ts,-1)]===undefined&&streakOf(x.h)===0&&isScheduled(x.h,ts))[0];
  if(weak)insights.push({i:'bi-lightbulb',t:en?`"${esc(weak.h.name)}" keeps slipping — try shrinking it to just 10 minutes. Size does not matter; consistency does.`:`«${esc(weak.h.name)}» بتتأجل — جرّب تصغّرها لـ 10 دقايق بس. الحجم مش مهم؛ الثبات مهم.`});
  if(d30.filter(d=>d.val>0).length>=5){const avg=Math.round(d30.reduce((a,d)=>a+d.val,0)/30);
    insights.push({i:'bi-bullseye',t:en?`30-day daily focus average: <b>${fmtMin(avg)}</b>. Target: ${fmtMin(S.settings.pomodoro.dailyTargetMinutes)}.`:`متوسط تركيزك اليومي آخر 30 يوم: <b>${fmtMin(avg)}</b>. الهدف: ${fmtMin(S.settings.pomodoro.dailyTargetMinutes)}.`})}
  if(!insights.length)insights.push({i:'bi-seedling',t:en?'Stats get stronger the more you use MADAR. Start with one focus session today.':'الإحصائيات بتقوى كل ما تستخدم مدار أكتر. ابدأ بجلسة تركيز النهاردة.'});
  const isFriday=new Date().getDay()===5;
  const v=$('#view');
  v.innerHTML=`<div class="view-anim"><div class="sec-h mb-3"><h1 style="font-size:24px">${t('stats')}</h1></div>
  <div class="stat-cards mb-3">
    <div class="stat-c"><div class="sv mono" style="color:var(--coral-ink)">${fmtMin(focusByDay[ts]||0)}</div><div class="sl">${en?"Today's focus":'تركيز النهاردة'}</div></div>
    <div class="stat-c"><div class="sv mono" style="color:var(--teal)">${fmtMin(thisW)}</div><div class="sl">${en?'Weekly focus':'تركيز الأسبوع'}</div>
      <span class="delta ${delta>=0?'up':'dn'}"><i class="bi bi-${delta>=0?'arrow-up-short':'arrow-down-short'}"></i>${Math.abs(delta)}% ${en?'vs last week':'عن اللي فات'}</span></div>
    <div class="stat-c"><div class="sv mono" style="color:var(--amber)">${doneThisW}</div><div class="sl">${en?'Tasks done this week':'مهام مكتملة الأسبوع'}</div>
      <span class="delta ${deltaT>=0?'up':'dn'}"><i class="bi bi-${deltaT>=0?'arrow-up-short':'arrow-down-short'}"></i>${Math.abs(deltaT)}%</span></div>
    <div class="stat-c"><div class="sv mono">${S.gamification.xp}</div><div class="sl">${en?`XP — level ${S.gamification.level}`:`نقاط XP — مستوى ${S.gamification.level}`}</div></div>
  </div>
  ${isFriday?`<div class="mcard flat mb-3" style="border-inline-start:4px solid var(--amber)"><b><i class="bi bi-journal-check" style="color:var(--amber)"></i> ${en?'Friday weekly review':'مراجعة الجمعة الأسبوعية'}</b>
    <p class="small muted mt-2">${en?'What are the best 3 things this week? What will be different next week?':'إيه أفضل 3 حاجات حصلت الأسبوع ده؟ وإيه اللي هيتعمل مختلف الأسبوع الجاي؟'}</p>
    <button class="btn-soft sm mt-1" id="wrBtn"><i class="bi bi-plus-lg"></i> ${en?'Create review note':'أنشئ ملاحظة مراجعة'}</button></div>`:''}
  <div class="row g-3">
    <div class="col-12 col-lg-8"><div class="chart-card"><h4><i class="bi bi-graph-up"></i> ${en?'Daily focus — last 30 days':'التركيز اليومي — آخر 30 يوم'}</h4>${lineChartSVG(d30)}</div></div>
    <div class="col-12 col-lg-4"><div class="chart-card h-100"><h4><i class="bi bi-pie-chart"></i> ${en?'Tasks by project':'المهام على المشاريع'}</h4>${donutSVG(donutItems)}</div></div>
    <div class="col-12 col-lg-6"><div class="chart-card"><h4><i class="bi bi-bar-chart"></i> ${en?'Completed tasks per week':'المهام المكتملة أسبوعيًا'}</h4>${barsChartSVG(weekN)}</div></div>
    <div class="col-12 col-lg-6"><div class="chart-card"><h4><i class="bi bi-stars"></i> ${en?'Insights for your week':'رؤى عن أسبوعك'}</h4>
      ${insights.map(x=>`<div class="insight"><i class="bi ${x.i}"></i><span>${x.t}</span></div>`).join('')}</div></div>
  </div></div>`;
  const wr=$('#wrBtn');
  if(wr)wr.onclick=()=>{addNote({title:(en?'Week review ':'مراجعة أسبوع ')+ts,
    body:en?'Best 3 things:\n- \n- \n- \n\nNext week I will do differently:\n- ':'أفضل 3 حاجات:\n- \n- \n- \n\nالأسبوع الجاي هعمل مختلف:\n- ',
    tags:[en?'review':'مراجعة']});location.hash='#/notes'}}
