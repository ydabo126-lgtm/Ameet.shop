/* Service worker AMEET : fonctionnement hors ligne + notifications dans la barre du téléphone */
const CACHE="ameet-v1";
const SHELL=["./","index.html","manifest.json","logo.png","icon-192.png","icon-512.png"];

self.addEventListener("install",e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

/* Réseau d’abord (le site est toujours à jour), cache en secours si pas de connexion.
   Les appels vers d’autres sites (base Firebase, etc.) ne sont pas touchés. */
self.addEventListener("fetch",e=>{
 const r=e.request;
 if(r.method!=="GET")return;
 const u=new URL(r.url);
 if(u.origin!==location.origin)return;
 e.respondWith(
  fetch(r).then(res=>{
   if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}
   return res;
  }).catch(()=>caches.match(r).then(m=>m||caches.match("index.html")))
 );
});

/* Prêt pour de vraies notifications push (application fermée) si un serveur push est ajouté */
self.addEventListener("push",e=>{
 let d={};
 try{d=e.data?e.data.json():{}}catch(_){d={title:"AMEET",body:e.data?e.data.text():""}}
 e.waitUntil(self.registration.showNotification(d.title||"AMEET",{
  body:d.body||"",icon:"logo.png",badge:"logo.png",data:{url:d.url||"./"}
 }));
});

self.addEventListener("notificationclick",e=>{
 e.notification.close();
 const url=(e.notification.data&&e.notification.data.url)||"./#notifs";
 e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
  for(const c of list){
   if("focus" in c){c.postMessage({type:"open-notifs"});return c.focus()}
  }
  return self.clients.openWindow(url);
 }));
});
