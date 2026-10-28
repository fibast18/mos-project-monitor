/* MOS Project Monitor v1.2.0 — offline-first app shell. No private project data is fetched or uploaded. */
'use strict';
const VERSION='1.2.0';
const CACHE_PREFIX='mos-project-monitor-app-';
const CACHE_NAME=CACHE_PREFIX+VERSION;
const ROOT=self.registration.scope;
const INDEX_URL=new URL('index.html',ROOT).href;
const FILES=['index.html','apple-touch-icon.png','manifest.webmanifest','icon-192.png','icon-512.png']
  .map(path=>new URL(path,ROOT).href);

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // The worker activates only after all offline application files are saved.
    await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(ROOT))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      // Try GitHub when reachable so later releases appear; otherwise use the
      // same complete app cached during installation. Works on the first
      // Home Screen launch AFTER the web app has been installed/cached.
      const cache=await caches.open(CACHE_NAME);
      const offline=await cache.match(INDEX_URL);
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),2500);
      try{
        const response=await fetch(request,{signal:controller.signal});
        if(response.ok)return response;
        if(offline)return offline;
        return response;
      }catch(err){
        if(offline)return offline;
        return new Response('<!doctype html><title>Offline setup needed</title><p>Open MOS Project Monitor online once to save the app for offline use.</p>',{headers:{'Content-Type':'text/html;charset=UTF-8'},status:503});
      }finally{clearTimeout(timeout);}
    })());
    return;
  }
  // Local app files are served from cache, including cache-busted icon URLs.
  if(request.destination==='image'||request.destination==='manifest'||FILES.includes(url.href)){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const saved=await cache.match(request,{ignoreSearch:true});
      if(saved)return saved;
      return fetch(request);
    })());
  }
});
