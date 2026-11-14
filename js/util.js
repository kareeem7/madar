'use strict';
// اختصارات وأدوات مشتركة + التعامل مع التواريخ (محلي مش UTC)
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pad2=n=>String(n).padStart(2,'0');
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const CLEANUPS=[];

const dstr=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const todayStr=()=>dstr(new Date());
const parseD=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDaysStr=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return dstr(d)};
const cmpD=(a,b)=>a<b?-1:a>b?1:0;
const DAY_NAMES=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAY_SHORT=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
const WEEK_ORDER=[6,0,1,2,3,4,5];
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const isEn=()=>window.S?.settings?.lang!=='ar'; // الإنجليزي هو الافتراضي
function greet(){const h=new Date().getHours();
  if(isEn()){return h>=5&&h<12?'Good morning':h>=12&&h<17?'Good afternoon':h>=17&&h<23?'Good evening':'Quiet night'}
  return h>=5&&h<12?'صباح الخير':h>=12&&h<17?'طاب يومك':h>=17&&h<23?'مساء الخير':'ليلة هادئة'}
function dateLineAr(){const d=new Date();
  if(isEn())return d.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  let hij='';
  try{hij=new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long'}).format(d)}catch(e){}
  const g=`${DAY_NAMES[d.getDay()]}، ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return hij?`${g} · ${hij}هـ`:g}
const fmtMin=m=>{m=Math.round(m);
  if(isEn()){if(m<60)return m+'m';const h=Math.floor(m/60),r=m%60;return h+'h'+(r?' '+r+'m':'')}
  if(m<60)return m+' د';const h=Math.floor(m/60),r=m%60;return h+' س'+(r?' '+r+' د':'')};
const mmss=ms=>{const s=Math.max(0,Math.round(ms/1000));return pad2(Math.floor(s/60))+':'+pad2(s%60)};
const clockOf=hm=>{const[h,m]=hm.split(':').map(Number);return h*60+m};
const PROJECT_COLORS=['#FF5A45','#2E7D6B','#D98E1B','#64748B','#D4648A','#8B7BD8'];
function announce(msg){const el=$('#ariaLive');el.textContent='';setTimeout(()=>el.textContent=msg,30)}

/* قاموس الواجهة — عربي/إنجليزي */
const I18N={
ar:{
 today:'اليوم',tasks:'المهام',board:'اللوحة',calendar:'التقويم',focus:'التركيز',habits:'العادات',stats:'الإحصائيات',notes:'المذكرة',settings:'الإعدادات',
 quickTask:'مهمة سريعة',searchPh:'ابحث أو نفّذ أمر…',closeDay:'اقفل يومي',
 heroTitle:'جاهز تركّز؟',heroNote:'الجلسة هتتسجّل على المهمة نفسها.',heroEmpty:'ضيف مهمة وابدأ أول جلسة.',heroFirst:'أول حاجة في النهاردة',startFocus:'ابدأ جلسة تركيز',
 ringTasks:'مهام اليوم',ringFocus:'التركيز',ringHabits:'العادات',of:'من',dayUnit:'يوم',
 secToday:'النهاردة',quickAdd:'إضافة سريعة (N)',showRest:'أظهر باقي المهام',hideRest:'اخفِ باقي المهام',
 emptyTodayT:'مفيش حاجة مطلوبة منك دلوقتي',emptyTodayS:'استمتع بالهدوء — أو دوس N لأول مهمة.',
 focusOne:'ركّز على مهمة واحدة',resume:'كمّل',play:'شغّل',
 habitsToday:'عادات النهاردة',allHabits:'كل العادات',timeline:'خط اليوم',
 water:'مية',addCup:'+ كوب',moodQ:'مزاجك دلوقتي؟',journalQ:'إيه أهم حاجة عملتها النهاردة؟',journalPh:'سطّرها بسرعة…',
 sugYes:'نعم',sugEdit:'عدّل',sugNo:'لا',
 eodTitle:'اقفل يومك بهدوء',eodTasks:'مهام اليوم',eodFocus:'تركيز',eodHabits:'العادات',eodPending:'لسّه معلّق',eodWait:'هتستنى بكرة',eodClean:'كل حاجة اتخلّصت — يوم نضيف!',
 eodNote:'جملة تقفّل بيها اليوم',eodNotePh:'إيه اللي اتعلمته أو حسّيته النهاردة؟',eodClose:'اقفل اليوم',eodLater:'لسّه شغال',
 celTitle:'اليوم اتقفل',celBtn:'تصبح على خير',
 modeFocus:'تركيز',modeShort:'راحة قصيرة',modeLong:'راحة طويلة',ready:'جاهز',paused:'موقوف مؤقتًا',focusing:'تركّز دلوقتي',resting:'استريح',
 bindPh:'اختار مهمة تربط بيها الجلسة',noTask:'— بدون مهمة —',
 amb:'أمبينس التركيز',vol:'صوت',ambNone:'صمت',ambRain:'مطر',ambCafe:'كافيه',ambBrown:'ضوضاء بنية',ambWhite:'ضوضاء بيضاء',
 autoBreak:'بدء الراحة تلقائي',autoFocus:'بدء التركيز تلقائي',dnd:'عدم الإزعاج',tick:'نبضة خفيفة',
 sesToday:'جلسات النهاردة',session:'جلسة',partial:'جزئية',rest:'راحة',firstSes:'أول جلسة النهاردة لسّه مستنياك.',
 habitsTitle:'العادات',newHabit:'عادة جديدة',habitsIntro:'علّم على النهاردة من هنا أو من ملخص الأسبوع. لو يوم فاتك: مفيش لوم — بس بداية جديدة.',
 emptyHabitsT:'3 عادات بس في البداية',emptyHabitsS:'الباقي هيتظبط لوحده. ضيف أول عادة وابدأ.',addFirstHabit:'ضيف أول عادة',
 notesTitle:'المذكرة',notePh:'التقط فكرة بسرعة… (Enter للحفظ)',emptyNotesT:'المذكرة فاضية',emptyNotesS:'أي فكرة، أي حاجة — اكتبها فوق وهتفضل معاك.',
 tasksTitle:'المهام',newTask:'مهمة جديدة',select:'تحديد',taskSearchPh:'فلترة سريعة… ( / للبحث الشامل)',
 shortcuts:'اختصارات الكيبورد',save:'احفظ',cancel:'إلغاء',close:'إغلاق',del:'حذف',edit:'تعديل',doneBtn:'تم',delNote:'حذف',toTask:'حوّل لمهمة',
 setTitle:'الإعدادات',stTheme:'المظهر',stThemeD:'تلقائي: فاتح نهارًا وغامق بعد 7م',stLang:'اللغة',stLangD:'واجهة مدار',stDensity:'الكثافة',
 stKiosk:'وضع التركيز الكامل (Kiosk)',stKioskD:'يخفي القوائم الجانبية',
 themeAuto:'تلقائي',themeLight:'فاتح',themeDark:'غامق',densityComf:'مريحة',densityComp:'مضغوطة',
 pmTimes:'التركيز / راحة قصيرة / راحة طويلة',pmTimesD:'بالدقائق',pmCycles:'جلسات قبل الراحة الطويلة',pmTarget:'هدف التركيز اليومي',pmTargetD:'بالدقائق — بيظهر في حلقة اليوم',
 pmSound:'صوت نهاية الجلسة',soundBell:'جرس',soundNone:'بدون',
 yourName:'اسمك',notifs:'إشعارات المتصفح',notifsD:'تذكيرات المهام (بإذن صريح)',leadMin:'التذكير قبل الموعد بـ',minUnit:'دقيقة',
 backup:'تنزيل نسخة احتياطية',backupD:'JSON كامل: إعدادات + مهام + جلسات',icsX:'تصدير المهام المجدولة',icsD:'ملف ICS لأي تقويم',importX:'استيراد نسخة',importD:'بترجّع كل حاجة زي ما كانت',
 install:'تثبيت التطبيق',installD:'على الموبايل أو سطح المكتب (PWA)',installBtn:'ثبّت مدار',kbdShow:'اعرضها (؟)',wipe:'مسح كل البيانات',wipeD:'مفيش تراجع من هنا — نزّل نسخة الأول',wipeBtn:'مسح نهائي',achievements:'الإنجازات'
},
en:{
 today:'Today',tasks:'Tasks',board:'Board',calendar:'Calendar',focus:'Focus',habits:'Habits',stats:'Stats',notes:'Notes',settings:'Settings',
 quickTask:'Quick task',searchPh:'Search or run a command…',closeDay:'Close my day',
 heroTitle:'Ready to focus?',heroNote:'The session is logged on the task itself.',heroEmpty:'Add a task and start your first session.',heroFirst:"Today's first thing",startFocus:'Start focus session',
 ringTasks:"Today's tasks",ringFocus:'Focus',ringHabits:'Habits',of:'of',dayUnit:'days',
 secToday:'Today',quickAdd:'Quick add (N)',showRest:'Show the rest',hideRest:'Hide the rest',
 emptyTodayT:'Nothing asked of you right now',emptyTodayS:'Enjoy the calm — or press N for your first task.',
 focusOne:'Focus on one thing',resume:'Resume',play:'Start',
 habitsToday:"Today's habits",allHabits:'All habits',timeline:'Day timeline',
 water:'Water',addCup:'+ cup',moodQ:'How do you feel?',journalQ:"What's the best thing you did today?",journalPh:'Write it quickly…',
 sugYes:'Yes',sugEdit:'Edit',sugNo:'No',
 eodTitle:'Close your day calmly',eodTasks:"Today's tasks",eodFocus:'focus',eodHabits:'Habits',eodPending:'Still pending',eodWait:'will wait for tomorrow',eodClean:'Everything done — clean day!',
 eodNote:'One line to close the day with',eodNotePh:'What did you learn or feel today?',eodClose:'Close the day',eodLater:'Still working',
 celTitle:'Day closed',celBtn:'Good night',
 modeFocus:'Focus',modeShort:'Short break',modeLong:'Long break',ready:'Ready',paused:'Paused',focusing:'Focusing now',resting:'Rest now',
 bindPh:'Choose a task to bind',noTask:'— no task —',
 amb:'Focus ambience',vol:'Volume',ambNone:'Silent',ambRain:'Rain',ambCafe:'Café',ambBrown:'Brown noise',ambWhite:'White noise',
 autoBreak:'Auto-start breaks',autoFocus:'Auto-start focus',dnd:'Do not disturb',tick:'Soft tick',
 sesToday:"Today's sessions",session:'session',partial:'partial',rest:'break',firstSes:'Your first session today is still waiting.',
 habitsTitle:'Habits',newHabit:'New habit',habitsIntro:'Check today from here or the week summary. Missed a day? No blame — just a fresh start.',
 emptyHabitsT:'Only 3 habits at the start',emptyHabitsS:'The rest sorts itself out. Add your first habit.',addFirstHabit:'Add first habit',
 notesTitle:'Notes',notePh:'Capture an idea quickly… (Enter to save)',emptyNotesT:'Notes are empty',emptyNotesS:'Any idea, anything — write it above and it stays.',
 tasksTitle:'Tasks',newTask:'New task',select:'Select',taskSearchPh:'Quick filter… ( / for full search)',
 shortcuts:'Keyboard shortcuts',save:'Save',cancel:'Cancel',close:'Close',del:'Delete',edit:'Edit',doneBtn:'Done',delNote:'Delete',toTask:'Convert to task',
 setTitle:'Settings',stTheme:'Appearance',stThemeD:'Auto: light by day, dark after 7pm',stLang:'Language',stLangD:'MADAR interface',stDensity:'Density',
 stKiosk:'Full focus mode (Kiosk)',stKioskD:'Hides the sidebars',
 themeAuto:'Auto',themeLight:'Light',themeDark:'Dark',densityComf:'Comfort',densityComp:'Compact',
 pmTimes:'Focus / short / long break',pmTimesD:'In minutes',pmCycles:'Sessions before long break',pmTarget:'Daily focus target',pmTargetD:'Minutes — shows in the day ring',
 pmSound:'End-of-session sound',soundBell:'Bell',soundNone:'None',
 yourName:'Your name',notifs:'Browser notifications',notifsD:'Task reminders (explicit permission)',leadMin:'Remind before due by',minUnit:'min',
 backup:'Download backup',backupD:'Full JSON: settings + tasks + sessions',icsX:'Export scheduled tasks',icsD:'ICS file for any calendar',importX:'Import backup',importD:'Restores everything as it was',
 install:'Install app',installD:'On mobile or desktop (PWA)',installBtn:'Install MADAR',kbdShow:'Show (؟)',wipe:'Wipe all data',wipeD:'No undo here — download a backup first',wipeBtn:'Wipe forever',achievements:'Achievements'
}};
const t=k=>(I18N[isEn()?'en':'ar'])[k]||I18N.ar[k]||k;
