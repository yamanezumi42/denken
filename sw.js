/* 殻だけをキャッシュしてオフラインで起動できるようにする。問題データはここに入れない（IndexedDB にある）。 */
var V = "denken-bb40da91";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./katex/katex.min.css", "./katex/katex.min.js", "./katex/fonts/KaTeX_AMS-Regular.woff2", "./katex/fonts/KaTeX_Caligraphic-Bold.woff2", "./katex/fonts/KaTeX_Caligraphic-Regular.woff2", "./katex/fonts/KaTeX_Fraktur-Bold.woff2", "./katex/fonts/KaTeX_Fraktur-Regular.woff2", "./katex/fonts/KaTeX_Main-Bold.woff2", "./katex/fonts/KaTeX_Main-BoldItalic.woff2", "./katex/fonts/KaTeX_Main-Italic.woff2", "./katex/fonts/KaTeX_Main-Regular.woff2", "./katex/fonts/KaTeX_Math-BoldItalic.woff2", "./katex/fonts/KaTeX_Math-Italic.woff2", "./katex/fonts/KaTeX_SansSerif-Bold.woff2", "./katex/fonts/KaTeX_SansSerif-Italic.woff2", "./katex/fonts/KaTeX_SansSerif-Regular.woff2", "./katex/fonts/KaTeX_Script-Regular.woff2", "./katex/fonts/KaTeX_Size1-Regular.woff2", "./katex/fonts/KaTeX_Size2-Regular.woff2", "./katex/fonts/KaTeX_Size3-Regular.woff2", "./katex/fonts/KaTeX_Size4-Regular.woff2", "./katex/fonts/KaTeX_Typewriter-Regular.woff2"];
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
