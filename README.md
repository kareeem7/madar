# مدار — MADAR

تطبيق إنتاجية يومي عربي RTL: **مدير مهام + بومودورو + متتبع عادات** في مكان واحد. بدون سيرفر، بدون build step.

## التشغيل

- **مباشر**: افتح `index.html` من المتصفح (`file://`) — يعمل بالكامل.
- **كسيرفر** (لتفعيل PWA والتثبيت): أي سيرفر ثابت، مثلاً:
  ```
  npx serve .
  # أو
  python -m http.server 8080
  ```

## هيكل الملفات

```
index.html            App shell — سايدبار + توب بار + <main id="view"> + السكريبتات
manifest.webmanifest  PWA manifest
sw.js                 Service Worker (cache-first، أوفلاين كامل)
css/
  tokens.css          متغيرات التصميم (فاتح/غامق/كثافة)
  base.css            reset + الهيكل + المكوّنات (أزرار/مودال/توست/لوحة أوامر)
  views.css           تنسيقات كل شاشة
js/
  util.js             أدوات عامة + تواريخ محلية + i18n
  store.js            الـ Store المركزي + persist + migration + IndexedDB + seed
  ui.js               Toast / Modal (focus trap) / Menu / Drag بالـ Pointer Events
  tasks.js            محلل الإدخال الطبيعي + منطق المهام + Undo + التكرار
  pomodoro.js         المحرك الزمني (endsAt) + Web Audio ambience
  habits.js           منطق العادات + السلاسل + اليوميات + الملاحظات
  commands.js         Quick Add + لوحة الأوامر (Ctrl+K) + الاختصارات
  app.js              الراوتر + التنقل + المظهر + Onboarding + الإقلاع
  views/              today / tasks / board / calendar / focus / habits / stats / notes / settings
```

## المعمارية باختصار

- **Store واحد** (`S` في `store.js`) بنمط `subscribe(fn)` + `emit(scope)`. كل تغيير يمرّ من `emit` → حفظ مؤجّل 300ms على `madar:state` في localStorage → المستمعين يعيدوا رندر الشاشة النشطة فقط (مع منع الرندر أثناء الكتابة أو فتح مودال).
- **Router**: hash-based في `app.js` — جدول `ROUTES = {key: {fn, n, i}}`، و`refreshView()` تنفّذ دالة الشاشة وتظبط حالة التنقل والعنوان.
- **السكريبتات classic** بترتيب يدوي في نهاية `<body>` (تشغيل من `file://` بلا مشاكل موديولز/CORS). كل ملف يعرّف دوال عامة؛ الترتيب: util → store → ui → domain → views → commands → app.
- **البيانات**: localStorage للحالة والإعدادات، IndexedDB (`madar-db/sessions`) لسجل جلسات التركيز، نسخة احتياطية أسبوعية تلقائية `madar:backup:{date}`، ومزامنة تبويبات عبر `storage` event.

## تضيف شاشة جديدة إزاي؟

1. أنشئ `js/views/myview.js` فيه دالة `renderMyView()` ترسم في `$('#view')`.
2. سجّلها في `ROUTES` داخل `js/app.js`: `myview:{fn:renderMyView,n:()=>'اسمها',i:'bi-icon'}`.
3. ضيف كلمة مفتاحها للقاموس في `js/util.js` (I18N) ولملف `<script>` في index.html.
4. خلّيها تسمع التغييرات عبر أسماء الـ scopes المناسبة (`RERENDER`).

## تضيف حقل لمهمة إزاي؟

1. ضيفه في `newTaskObj` بـ `js/tasks.js` بقيمة افتراضية.
2. ضيف تهيئة آمنة في `migrate()` بـ `js/store.js` (عشان بيانات المستخدمين الحاليين).
3. اعرضه في `taskRow()` أو محرّر المهمة في `js/views/tasks.js`.

## المزامنة السحابية لاحقًا (Supabase — نظريًا)

- جدول `profiles(state jsonb, updated_at)` لمزامنة `S` كوحدة، وجدول `sessions(id, task_id, type, started_at, ...)` لسجل التركيز.
- الاستراتيجية: Local-first — التطبيق يكتب محليًا أولًا، ثم push مؤجّل (debounced upsert)، وعند الاتصال pull مع حل تضارب Last-Write-Wins على مستوى `updatedAt` لكل عنصر. Realtime subscription يستبدل `storage` event بين الأجهزة.

## Migration — الحفاظ على بيانات المستخدم

`migrate()` تبدأ من `emptyState()` وتدمج المحفوظ فوقه (spread لكل مستوى)، فتكمل الحقول الجديدة تلقائيًا وتحمي الحقول الواجبة (arrays/objects). ارفع `version` عند تغيير الـ schema واكتب التحويل داخل `migrate` حسب `s.version`.

## الخطوة التالية — أهم 5 تحسينات

1. مزامنة سحابية (Supabase) + تسجيل دخول اختياري.
2. تكامل Google Calendar (استيراد الاجتماعات كبلوكات في الخط الزمني).
3. Widgets للشاشة الرئيسية (حلقات اليوم + زر تركيز).
4. أصوات طبيعية متدرجة للتذكيرات حسب الأولوية.
5. تكامل AI لتقسيم المهام الكبيرة لخطوات فرعية تلقائيًا.

## ملاحظة عن React

المشروع متعمد Vanilla JS + Bootstrap فقط: React يتطلب build step (Vite/npm) ويكسر شرط «يفتح من file://» وقاعدة «ممنوع مكتبات JS خارجية». لو احتجت React لاحقًا: انقل كل دالة `render*` لكومبوننت، والـ Store لـ Zustand/Reducer بنفس أسماء الـ scopes — العقود جاهزة.
