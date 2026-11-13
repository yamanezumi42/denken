/* 殻だけをキャッシュしてオフラインで起動できるようにする。問題データはここに入れない（IndexedDB にある）。 */
var V = "denken-269c52ee";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./tb/u01.js", "./tb/u02.js", "./tb/u03.js", "./tb/u04.js", "./tb/u05.js", "./tb/u06.js", "./tb/u07.js", "./tb/u08.js", "./tb/u09.js", "./tb/u10.js", "./tb/u11.js", "./tb/u12.js", "./tb/u13.js", "./tb/u14.js", "./tb/u15.js", "./tb/u16.js", "./tb/u17.js", "./tb/u18.js", "./tb/u19.js", "./tb/u20.js", "./tb/u21.js", "./tb/u22.js", "./tb/u23.js", "./tb/u24.js", "./tb/u25.js", "./tb/u26.js", "./tb/u27.js", "./tb/u28.js", "./tb/u29.js", "./tb/u30.js", "./tb/u31.js", "./tb/u45.js", "./tb/u46.js", "./tb/u47.js", "./katex/katex.min.css", "./katex/katex.min.js", "./katex/fonts/KaTeX_AMS-Regular.woff2", "./katex/fonts/KaTeX_Caligraphic-Bold.woff2", "./katex/fonts/KaTeX_Caligraphic-Regular.woff2", "./katex/fonts/KaTeX_Fraktur-Bold.woff2", "./katex/fonts/KaTeX_Fraktur-Regular.woff2", "./katex/fonts/KaTeX_Main-Bold.woff2", "./katex/fonts/KaTeX_Main-BoldItalic.woff2", "./katex/fonts/KaTeX_Main-Italic.woff2", "./katex/fonts/KaTeX_Main-Regular.woff2", "./katex/fonts/KaTeX_Math-BoldItalic.woff2", "./katex/fonts/KaTeX_Math-Italic.woff2", "./katex/fonts/KaTeX_SansSerif-Bold.woff2", "./katex/fonts/KaTeX_SansSerif-Italic.woff2", "./katex/fonts/KaTeX_SansSerif-Regular.woff2", "./katex/fonts/KaTeX_Script-Regular.woff2", "./katex/fonts/KaTeX_Size1-Regular.woff2", "./katex/fonts/KaTeX_Size2-Regular.woff2", "./katex/fonts/KaTeX_Size3-Regular.woff2", "./katex/fonts/KaTeX_Size4-Regular.woff2", "./katex/fonts/KaTeX_Typewriter-Regular.woff2"];
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
