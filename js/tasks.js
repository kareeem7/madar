'use strict';
// منطق المهام = قارئ الكتابة السريعة + العمليات الأساسية + التكرار
// مثال الكتابة السريعة: «ادفع فاتورة الكهربا بكرة 5م #بيت !1 ~30د»
const WD_WORDS={'السبت':6,'سبت':6,'الأحد':0,'الاحد':0,'أحد':0,'الاثنين':1,'الاتنين':1,'الإثنين':1,'اثنين':1,'الثلاثاء':2,'التلات':2,'ثلاثاء':2,'الأربعاء':3,'الاربع':3,'الأربع':3,'اربع':3,'الخميس':4,'خميس':4,'الجمعة':5,'الجمعه':5,'جمعة':5,'جمعه':5};
function parseQuickAdd(input){
  let txt=' '+input.trim()+' ';
  const R={title:'',tags:[],priority:4,dueDate:null,dueTime:null,estimateMin:0,recurrence:null};
  const eat=re=>{txt=txt.replace(re,' ')};
  txt=txt.replace(/\s#([^\s#]+)/g,(m,w)=>{R.tags.push(w);return' '});
  txt=txt.replace(/\s!([1-4])/g,(m,p)=>{R.priority=+p;return' '});
  if(/\s!(عاجل|مهم)\s/.test(txt)){R.priority=1;eat(/\s!(عاجل|مهم)\s/)}
  txt=txt.replace(/\s*~\s*(\d{1,3})\s*(ساعات|ساعة|س|دقايق|دقيقة|د)\s*/g,(m,n,u)=>{R.estimateMin=+n*(u.startsWith('س')?60:1);return' '});
  let m=txt.match(/\s(يومياً|يوميا|كل يوم)\s/);if(m){R.recurrence={type:'daily'};eat(/\s(يومياً|يوميا|كل يوم)\s/)}
  m=txt.match(/\sكل\s+(\d+)\s*(أيام|يوم)\s/);if(m){R.recurrence={type:'everyN',n:+m[1]};txt=txt.replace(m[0],' ')}
  m=txt.match(/\s(كل أسبوع|أسبوعيا|أسبوعياً)\s/);if(m){R.recurrence={type:'weekly'};eat(/\s(كل أسبوع|أسبوعيا|أسبوعياً)\s/)}
  m=txt.match(/\s(كل شهر|شهريا|شهرياً)\s/);if(m){R.recurrence={type:'monthly'};eat(/\s(كل شهر|شهريا|شهرياً)\s/)}
  if(!R.recurrence){m=txt.match(/\sكل\s+(السبت|سبت|الأحد|الاحد|أحد|الاثنين|الاتنين|الإثنين|اثنين|الثلاثاء|التلات|ثلاثاء|الأربعاء|الاربع|الأربع|اربع|الخميس|خميس|الجمعة|الجمعه|جمعة|جمعه)\s/);
    if(m){R.recurrence={type:'weekly',weekdays:[WD_WORDS[m[1]]]};txt=txt.replace(m[0],' ')}}
  if(/\s(النهاردة|النهارده|اليوم|دلوقتي|الليلة)\s/.test(txt)){R.dueDate=todayStr();eat(/\s(النهاردة|النهارده|اليوم|دلوقتي|الليلة)\s/)}
  if(/\s(بعد بكرة|بعد بكره)\s/.test(txt)){R.dueDate=addDaysStr(todayStr(),2);eat(/\s(بعد بكرة|بعد بكره)\s/)}
  else if(/\s(بكرة|بكره|غداً|غدا)\s/.test(txt)){R.dueDate=addDaysStr(todayStr(),1);eat(/\s(بكرة|بكره|غداً|غدا)\s/)}
  else if(!R.recurrence){m=txt.match(/\s(السبت|سبت|الأحد|الاحد|أحد|الاثنين|الاتنين|الإثنين|اثنين|الثلاثاء|التلات|ثلاثاء|الأربعاء|الاربع|الأربع|اربع|الخميس|خميس|الجمعة|الجمعه|جمعة|جمعه)\s/);
    if(m){const wd=WD_WORDS[m[1]],cur=new Date().getDay();let diff=(wd-cur+7)%7;
      R.dueDate=addDaysStr(todayStr(),diff);txt=txt.replace(m[0],' ')}}
  if(!R.dueDate){m=txt.match(/\s(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\s/);
    if(m){const y=m[3]?(m[3].length===2?2000+ +m[3]:+m[3]):new Date().getFullYear();
      let d=new Date(y,+m[2]-1,+m[1]);if(cmpD(dstr(d),todayStr())<0&&!m[3])d=new Date(y+1,+m[2]-1,+m[1]);
      R.dueDate=dstr(d);txt=txt.replace(m[0],' ')}}
  m=txt.match(/\s(\d{1,2})(?::(\d{2}))?\s*(صباحاً|صباحا|ص|مساءً|مساء|م)\s/);
  if(m){let h=+m[1],min=m[2]?+m[2]:0;
    const isPm=(m[3]==='م'||m[3].startsWith('مساء'));if(isPm&&h<12)h+=12;if(!isPm&&h===12)h=0;
    R.dueTime=pad2(h)+':'+pad2(min);txt=txt.replace(m[0],' ')}
  else{m=txt.match(/\s(الصبح|بدري|الظهر|الضهر|العصر|المغرب|بالليل|بليل)\s/);
    if(m){const map={'الصبح':'09:00','بدري':'08:00','الظهر':'12:00','الضهر':'12:00','العصر':'15:00','المغرب':'18:00','بالليل':'21:00','بليل':'21:00'};
      R.dueTime=map[m[1]];txt=txt.replace(m[0],' ')}}
  R.title=txt.replace(/\s+/g,' ').trim();
  return R}

/* ——— استعلامات ——— */
const visTasks=()=>S.tasks.filter(x=>!['trash','archived'].includes(x.status));
function todayTasks(){const ts=todayStr();
  return visTasks().filter(x=>(x.dueDate&&x.dueDate<=ts&&x.status!=='done')||(x.status==='done'&&(x.completedAt||'').startsWith(ts)))
    .sort((a,b)=>((a.status==='done')?1:0)-((b.status==='done')?1:0)||a.priority-b.priority||((a.dueTime||'99')<(b.dueTime||'99')?-1:1))}
const overdueTasks=()=>visTasks().filter(x=>x.dueDate&&x.dueDate<todayStr()&&x.status!=='done');
const taskById=id=>S.tasks.find(x=>x.id===id);
const projById=id=>S.projects.find(p=>p.id===id);

/* ——— الأحداث الأساسية ——— */
function newTaskObj(d){return{id:uid(),title:(d.title||'').trim()||'مهمة بدون عنوان',notes:d.notes||'',projectId:d.projectId||null,listId:'inbox',
  tags:d.tags||[],priority:d.priority||4,dueDate:d.dueDate||null,dueTime:d.dueTime||null,estimateMin:d.estimateMin||0,
  status:d.status||'todo',completedAt:null,order:S.tasks.length,recurrence:d.recurrence||null,subtasks:d.subtasks||[],
  blockedBy:d.blockedBy||null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),focusSeconds:0}}
function addTask(d,silent){const tk=newTaskObj(d);S.tasks.push(tk);emit('tasks-structure');
  if(!silent)toast(isEn()?'Task added':'اتضافت المهمة',{icon:'bi-check2-circle'});return tk}
function updateTask(id,patch,scope='tasks'){const tk=taskById(id);if(!tk)return;Object.assign(tk,patch,{updatedAt:new Date().toISOString()});emit(scope)}
function recurrenceNext(rec,from){
  const f=from||todayStr();
  if(rec.type==='daily')return addDaysStr(f,1);
  if(rec.type==='everyN')return addDaysStr(f,rec.n||3);
  if(rec.type==='monthly'){const d=parseD(f);d.setMonth(d.getMonth()+1);return dstr(d)}
  if(rec.type==='weekly'){
    if(rec.weekdays&&rec.weekdays.length){const days=[...rec.weekdays].sort((a,b)=>a-b);const cur=parseD(f).getDay();
      const next=days.find(w=>w>cur);
      if(next==null)return addDaysStr(f,(7-cur)+days[0]);
      return addDaysStr(f,next-cur)}
    return addDaysStr(f,7)}
  return addDaysStr(f,1)}
function completeTask(id){const tk=taskById(id);if(!tk)return;
  tk.status='done';tk.completedAt=new Date().toISOString();tk.updatedAt=tk.completedAt;
  addXp(10);
  let spawned=null;
  if(tk.recurrence){const nd=recurrenceNext(tk.recurrence,tk.dueDate||todayStr());
    spawned=newTaskObj({title:tk.title,notes:tk.notes,projectId:tk.projectId,tags:tk.tags,priority:tk.priority,
      estimateMin:tk.estimateMin,recurrence:tk.recurrence,subtasks:tk.subtasks.map(s=>({...s,id:uid(),done:false}))});
    spawned.dueDate=nd;spawned.order=S.tasks.length;S.tasks.push(spawned)}
  toast(isEn()?'Nice, done!':'برافو! خلّصتها.',{icon:'bi-check2-circle',duration:7000,action:{label:isEn()?'Undo':'تراجع',fn:()=>{
    tk.status='todo';tk.completedAt=null;
    if(spawned)S.tasks=S.tasks.filter(x=>x.id!==spawned.id);
    S.gamification.xp=Math.max(0,S.gamification.xp-10);emit('tasks')}}});
  announce((isEn()?'Task completed: ':'اكتملت المهمة: ')+tk.title);emit('tasks')}
function uncompleteTask(id){const tk=taskById(id);if(!tk)return;tk.status='todo';tk.completedAt=null;emit('tasks')}
function deleteTask(id,hard){const i=S.tasks.findIndex(x=>x.id===id);if(i<0)return;const tk=S.tasks[i];
  if(hard){S.tasks.splice(i,1);emit('tasks-structure');return}
  const prev=tk.status;tk.status='trash';tk.trashedAt=new Date().toISOString();
  toast(isEn()?'Task deleted':'اتحذفت المهمة',{duration:7000,action:{label:isEn()?'Undo':'تراجع',fn:()=>{tk.status=prev;delete tk.trashedAt;announce(isEn()?'Deletion undone':'تم التراجع عن الحذف');emit('tasks')}}});
  announce(isEn()?'Task deleted — 7 seconds to undo':'المهمة اتحذفت — عندك 7 ثواني للتراجع');emit('tasks')}
function purgeTrash(){const cut=addDaysStr(todayStr(),-30);
  S.tasks=S.tasks.filter(x=>x.status!=='trash'||!x.trashedAt||x.trashedAt.slice(0,10)>=cut)}
function postponeTasks(ids,date){ids.forEach(id=>{const tk=taskById(id);if(tk){tk.dueDate=date;tk.updatedAt=new Date().toISOString()}});emit('tasks-structure')}
function bulkDone(ids){ids.forEach(id=>{const tk=taskById(id);if(tk&&tk.status!=='done'){tk.status='done';tk.completedAt=new Date().toISOString()}});addXp(5*ids.length);emit('tasks-structure')}
function reorderTask(id,dir,list){
  const i=list.findIndex(x=>x.id===id);if(i<0)return false;const j=i+dir;if(j<0||j>=list.length)return false;
  [list[i],list[j]]=[list[j],list[i]];list.forEach((x,k)=>{x.order=k});emit('tasks');return true}
purgeTrash(); // تنقية السلة عند الإقلاع
