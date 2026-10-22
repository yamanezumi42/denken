/* 殻だけをキャッシュしてオフラインで起動できるようにする。問題データはここに入れない（IndexedDB にある）。 */
var V = "denken-a28cbf40";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
/* 取り込みはブラウザの一時保存を通さない（宅建で、古い画面と新しいプログラムが混ざった＝2026-10-07） */
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(V).then(function(c){ return c.addAll(ASSETS.map(function(u){ return new Request(u, {cache: "reload"}); })); })
    .then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return k === V ? null : caches.delete(k); })); })
    .then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(function(c){ return c.match(r, {ignoreSearch: true}); }).then(function(hit){
    if (hit) return hit;
    return fetch(r).catch(function(){
      if (r.mode === "navigate") return caches.open(V).then(function(c){ return c.match("./index.html"); });
      throw new Error("offline");
    });
  }));
});
