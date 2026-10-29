const V="anube-v2";
const SHELL=["./","index.html","backend.js","config.js","manifest.webmanifest","icon-192.png","icon-512.png","icon-180.png"];
const key=u=>new Request(u.origin+u.pathname);
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){ // web propia: caché primero (abre al instante, también sin cobertura) y se actualiza en segundo plano
    const k=key(u),isPage=r.mode==="navigate"||/\/(index\.html)?$/.test(u.pathname);
    e.respondWith(caches.open(V).then(async c=>{
      const old=await c.match(k)||(r.mode==="navigate"?await c.match("index.html"):null);
      const net=fetch(new Request(k.url,{cache:"no-cache"})).then(async res=>{
        if(res.ok){const prev=old&&(old.headers.get("etag")||old.headers.get("last-modified")),now=res.headers.get("etag")||res.headers.get("last-modified");
          await c.put(k,res.clone());
          if(isPage&&old&&prev&&now&&prev!==now)self.clients.matchAll().then(cs=>cs.forEach(cl=>cl.postMessage("upd")))}
        return res}).catch(()=>old);
      if(old){e.waitUntil(net);return old}
      return net}))
  }else if(u.hostname==="www.gstatic.com"){ // SDK de Firebase: caché primero
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})))
  }});
