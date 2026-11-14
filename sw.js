/* مدار — Service Worker: cache-first للأصول المحلية + offline */
const CACHE='madar-v1';
const ASSETS=[
  './','./index.html','./manifest.webmanifest',
  './css/tokens.css','./css/base.css','./css/views.css',
  './js/util.js','./js/store.js','./js/ui.js','./js/tasks.js','./js/pomodoro.js','./js/habits.js',
  './js/views/today.js','./js/views/tasks.js','./js/views/board.js','./js/views/calendar.js',
  './js/views/focus.js','./js/views/habits.js','./js/views/stats.js','./js/views/notes.js','./js/views/settings.js',
  './js/commands.js','./js/app.js'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return; // الـ CDN بيروح للشبكة مباشرة
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
