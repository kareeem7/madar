'use strict';
// العادات: المجدولة/السلسلة/يوم السماح — كله بتواريخ محلية عشان فرق التوقيت
// وتحته يوميات اليوم (مية/مزاج) + الملاحظات
function isScheduled(h,ds){const d=parseD(ds),sc=h.schedule||{type:'daily'};
  if(sc.type==='daily')return true;
  if(sc.type==='weekdays')return(sc.weekdays||[]).includes(d.getDay());
  if(sc.type==='timesPerWeek')return true;
  if(sc.type==='everyN'){const diff=Math.round((parseD(ds)-parseD(h.createdAt.slice(0,10)||ds))/86400000);return diff>=0&&diff%(sc.n||2)===0}
  return true}
const entryVal=(h,ds)=>(h.entries[ds]?.value)||0;
const habitDoneOn=(h,ds)=>entryVal(h,ds)>=(h.target||1);
const scheduledHabits=ds=>S.habits.filter(h=>isScheduled(h,ds));
function streakOf(h){ // من اليوم/أمس للخلف — تواريخ محلية
  let streak=0,ds=todayStr(),first=true;
  for(let i=0;i<370;i++){
    if(!isScheduled(h,ds)){ds=addDaysStr(ds,-1);continue}
    if(h.skips.includes(ds)){ds=addDaysStr(ds,-1);continue}
    if(habitDoneOn(h,ds)){streak++;ds=addDaysStr(ds,-1)}
    else if(first){first=false;ds=addDaysStr(ds,-1)}
    else break;
    if(first)first=false}
  h.streakCache=streak;return streak}
function bestStreakOf(h){let best=0,cur=0;const from=h.createdAt.slice(0,10)||todayStr();
  let ds=from;const ts=todayStr();
  while(cmpD(ds,ts)<=0){
    if(!isScheduled(h,ds)||h.skips.includes(ds)){ds=addDaysStr(ds,1);continue}
    if(habitDoneOn(h,ds)){cur++;best=Math.max(best,cur)}else cur=0;
    ds=addDaysStr(ds,1)}
  return Math.max(best,h.streakCache||0)}
function toggleHabit(id,ds=todayStr()){const h=S.habits.find(x=>x.id===id);if(!h)return null;
  if(!isScheduled(h,ds))return null;
  const done=habitDoneOn(h,ds);
  if(done)delete h.entries[ds];else h.entries[ds]={value:h.target||1,note:h.entries[ds]?.note||''};
  if(!done)addXp(5);
  const st=streakOf(h);
  return{done:!done,streak:st}}
function incCounter(id,delta,ds=todayStr()){const h=S.habits.find(x=>x.id===id);if(!h)return 0;
  const v=clamp(entryVal(h,ds)+delta,0,99);
  h.entries[ds]={value:v,note:h.entries[ds]?.note||''};
  if(v>0&&habitDoneOn(h,ds))addXp(5);
  streakOf(h);return v}
function skipHabit(id,ds=todayStr()){const h=S.habits.find(x=>x.id===id);if(!h)return;
  const i=h.skips.indexOf(ds);if(i>=0)h.skips.splice(i,1);else h.skips.push(ds);
  streakOf(h);emit('habits')}
function addHabit(d){const h={id:uid(),name:d.name||'عادة جديدة',icon:d.icon||'bi-star',color:d.color||'#2E7D6B',
  type:d.type||'build',target:d.target||1,unit:d.unit||'',schedule:d.schedule||{type:'daily'},
  cue:d.cue||'',reminderTime:d.reminderTime||'',createdAt:todayStr(),order:S.habits.length,entries:{},skips:[]};
  S.habits.push(h);emit('habits-structure');return h}
function deleteHabit(id){const i=S.habits.findIndex(h=>h.id===id);if(i<0)return;const h=S.habits[i];
  S.habits.splice(i,1);
  toast(isEn()?'Habit deleted':'اتحذفت العادة',{duration:7000,action:{label:isEn()?'Undo':'تراجع',fn:()=>{S.habits.splice(i,0,h);emit('habits-structure')}}});
  emit('habits-structure')}
function updateHabit(id,draft){const h=S.habits.find(x=>x.id===id);if(!h)return;Object.assign(h,draft);emit('habits-structure')}

/* ——— يوميات اليوم + الملاحظات ——— */
function dayLog(ds=todayStr()){if(!S.dayLogs[ds])S.dayLogs[ds]={water:0,mood:0,journal:'',shutdownDone:false};return S.dayLogs[ds]}
function addWater(){const l=dayLog();l.water=clamp(l.water+1,0,12);
  if(l.water===8)toast(isEn()?'8 cups of water! Your body thanks you.':'8 أكواب مية! جسمك بيشكرك.',{icon:'bi-cup-straw'});
  emit('daylog');return l.water}
function setMood(v){const l=dayLog();l.mood=l.mood===v?0:v;emit('daylog')}
function setJournal(txt){dayLog().journal=txt;emit('daylog')}
function addNote(d={}){const n={id:uid(),title:d.title||'',body:d.body||'',tags:d.tags||[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  S.notes.unshift(n);emit('notes');return n}
function updateNote(id,patch){const n=S.notes.find(x=>x.id===id);if(!n)return;Object.assign(n,patch,{updatedAt:new Date().toISOString()});emit('notes')}
function deleteNote(id){const i=S.notes.findIndex(n=>n.id===id);if(i<0)return;const n=S.notes[i];
  S.notes.splice(i,1);toast(isEn()?'Note deleted':'اتحذفت الملاحظة',{duration:7000,action:{label:isEn()?'Undo':'تراجع',fn:()=>{S.notes.splice(i,0,n);emit('notes')}}});emit('notes')}
function noteToTask(id){const n=S.notes.find(x=>x.id===id);if(!n)return;
  addTask({title:n.title||n.body.slice(0,60),notes:n.body,tags:n.tags});
  deleteNote(id);toast(isEn()?'Converted to a task in Inbox':'اتحوّلت لمهمة في الوارد',{icon:'bi-arrow-left-right'})}
