// クリックの受付を止める仕組み（段0〜6で共通）：文字の出し切り・絵の動き・光らせがすべて終わるまで BUSY() が true。
// 数える物＝15秒未満の setTimeout（文字を1つずつ出す等）／終わりのある CSS・Web のアニメーションと遷移（待ち時間の間も含む）／
// requestAnimationFrame の動き（ずっと回り続ける物は fn.free = true で外す）。回り続ける CSS アニメーション（羽・流れる点）は数えない。
//
// 早送り（2026-11-11 アプリの中で「戻る」のため）：TIME.fast(true) の間は、15秒未満の setTimeout と回り続けない rAF を
// 本当の時計で待たずに列に積み、TIME.settle() が時刻の順に一気に流す（performance.now と rAF の時刻もその分だけ進める）。
// 流し終わったら、終わりのある CSS・Web のアニメーションを最後まで進める＝「その拍の終わりの形」になる。
(function(){
  var st = window.setTimeout, ct = window.clearTimeout, raf = window.requestAnimationFrame, caf = window.cancelAnimationFrame;
  var pnow = performance.now.bind(performance), skew = 0, fast = false, vq = [], vr = [], vid = 1e9, ids = new Set(), rafAt = 0;
  performance.now = function(){ return pnow() + skew; };
  window.setTimeout = function(f, ms){
    ms = +ms || 0;
    if (fast && ms < 15000) { var v = ++vid; vq.push({id: v, t: performance.now() + ms, f: f}); return v; }
    var id = st(function(){ ids.delete(id); if (typeof f === "function") f(); }, ms);
    if (ms < 15000) ids.add(id);
    return id;
  };
  window.clearTimeout = function(id){
    ids.delete(id);
    if (id > 1e9) { vq = vq.filter(function(q){ return q.id !== id; }); return; }
    ct(id);
  };
  window.requestAnimationFrame = function(f){
    if (!f.free) {
      rafAt = pnow();
      if (fast) { var v = ++vid; vr.push({id: v, f: f}); return v; }
    }
    return raf.call(window, function(ts){ f(ts + skew); });
  };
  window.cancelAnimationFrame = function(id){
    if (id > 1e9) { vr = vr.filter(function(r){ return r.id !== id; }); return; }
    caf.call(window, id);
  };
  function finishAll(){
    document.getAnimations().forEach(function(a){
      try {
        if (!a.effect) return;
        if (isFinite(a.effect.getComputedTiming().endTime)) a.finish();
        else { var d = a.effect.getTiming().delay || 0; if ((a.currentTime || 0) < d) a.currentTime = d; }   // 回り続ける物は待ち時間だけ飛ばす
      } catch (e) {}
    });
  }
  function settle(){
    for (var n = 0; n < 50000; n++) {
      var now = performance.now(), tq = Infinity, k = -1;
      vq.forEach(function(q, i){ if (q.t < tq) { tq = q.t; k = i; } });
      var tr = vr.length ? now + 16 : Infinity;
      if (tq === Infinity && tr === Infinity) break;
      if (tr <= tq) { skew += 16; var fs = vr; vr = []; var t = performance.now(); fs.forEach(function(r){ r.f(t); }); }
      else { var q = vq.splice(k, 1)[0]; if (q.t > now) skew += q.t - now; if (typeof q.f === "function") q.f(); }
    }
    finishAll();
  }
  window.TIME = {fast: function(on){ fast = on; }, settle: settle};
  window.BUSY = function(){
    if (BUSY.force) return false;
    if (ids.size) return true;
    if (pnow() - rafAt < 120) return true;
    return document.getAnimations().some(function(a){
      if (a.playState !== "running" || !a.effect) return false;
      return isFinite(a.effect.getComputedTiming().endTime);
    });
  };
})();

// 「文→アニメ」の進め方（段0〜6で共通）。基本の形＝文を出す時は図をぼかして中央に文、アニメの時はぼかしが解けて文は消える。
//  アプリではイ固定（文のクリックとアニメのクリックを分ける。見本ではキー M でアと切り替えていた）。
//  使い方：FLOW.run({scr: 画面, beats: [{text: 文の要素（配列可）, go: 文を出す関数}, {cls: 付けるクラス, go: アニメの関数}, ...], reset: 最初に戻す関数})
//   ・文の拍：画面に .blur、その文に .cur（中央・白いにじみは .ctr）。続く文は、ぼかしのまま文だけ替わる。
//   ・アニメの拍：.blur と .cur を外し、cls を足す（cls は積み重なる＝前のアニメの形は残る）。
//   ・最後の拍の次のクリック：通し（親あり）なら親へ "next"、単体なら最初へ。親から "advance" が来たら最初の拍へ進む。
//  アプリの中の操作（2026-11-11 本人「フリックで前の説明に戻れたり…は残したまま」）：
//   ・左へ払う＝クリックと同じ（進む）。右へ払う＝1つ前の拍へ戻る＝親へ {x2:"goto", b:前の拍}（段の最初の拍なら {x2:"prev"}＝前の段の最後の拍）。
//   ・親はそのページを ?b=拍 を付けて読み直す → ここで拍0〜b を早送りして、b の拍の終わりの形で止める（?b=L は最後の拍）。
//   ・左上の × は親へ "close"（画面のクリック＝次へ、には数えない）。
(function(){
  var css = document.createElement("style");
  css.textContent =
    ".scr{touch-action:none}" +
    ".scr .fig > svg,.scr .tag{transition:filter .5s ease-out,opacity .5s ease-out,transform 1s ease-in-out}" +
    ".scr.blur .fig > svg,.scr.blur .tag{filter:blur(3px);opacity:.45}" +
    ".scr .nt.ctr{text-align:center}" +
    ".scr .nt.ctr{text-shadow:0 0 3px #fff,0 0 6px #fff,0 0 10px #fff,0 0 16px #fff,0 0 24px #fff}" +
    ".scr .nt.cur{opacity:1}";
  document.head.appendChild(css);
  var mode = "i";
  function run(o){
    var scr = o.scr, beats = o.beats, idx = -1, gen = 0, inApp = parent !== window;
    var m = /[?&]b=(L|\d+)/.exec(location.search);
    var target = m ? (m[1] === "L" ? beats.length - 1 : Math.min(+m[1], beats.length - 1)) : null;
    var cl = scr.querySelector(".close");
    if (cl) cl.addEventListener("click", function(e){ e.stopPropagation(); if (inApp) parent.postMessage("close", "*"); });
    function apply(){
      var c = ["scr"];
      for (var i = 0; i <= idx; i++) if (beats[i].cls) c.push(beats[i].cls);
      if (idx >= 0 && beats[idx].text) c.push("blur");
      scr.className = c.join(" ");
    }
    function clearText(){ scr.querySelectorAll(".nt.cur").forEach(function(t){ t.classList.remove("cur"); }); }
    function go(){
      var b = beats[idx];
      clearText();
      if (b.text) [].concat(b.text).forEach(function(t){ t.classList.add("cur"); });
      apply();
      if (b.go) b.go();
    }
    function step(force){
      if (!force && BUSY()) return;
      if (idx === beats.length - 1) {
        if (inApp) { parent.postMessage("next", "*"); return; }
        // 単体：最初に戻して、すぐ最初の文を出す
        gen++; idx = -1; clearText(); apply(); if (o.reset) o.reset(); idx++; go(); return;
      }
      idx++; go();
    }
    function back(){
      if (!inApp || idx < 0) return;
      parent.postMessage(idx > 0 ? {x2: "goto", b: idx - 1} : {x2: "prev"}, "*");
    }
    // 拍0〜k を早送りして、k の拍の終わりの形で止める
    function jump(k){
      TIME.fast(true);
      try { for (var i = 0; i <= k; i++) { idx = i; go(); TIME.settle(); } }
      finally { TIME.fast(false); }
      TIME.settle();
    }
    var swiped = false, sx = null, sy = 0;
    scr.addEventListener("pointerdown", function(e){ swiped = false; sx = e.clientX; sy = e.clientY; });
    scr.addEventListener("pointerup", function(e){
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      swiped = true;
      if (dx < 0) step(false); else back();
    });
    scr.addEventListener("pointercancel", function(){ sx = null; });
    scr.addEventListener("click", function(){ if (swiped) { swiped = false; return; } step(false); });
    addEventListener("message", function(e){ if (e.data === "advance" && idx === -1 && target === null) step(true); });
    apply();
    FLOW.cur = function(){ return idx; };   // 今の拍（確かめの台本が見る）
    // どの段も最初は文から：読み込んだらすぐ最初の拍（文）を出す（通しでは、前の段の最後のクリックがそのままここまで進める）。?b= があればそこまで早送り
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function(){
      if (target !== null) { if (idx === -1) jump(target); }
      else if (idx === -1) step(true);
    });
    return {idx: function(){ return idx; }};
  }
  window.FLOW = {run: run, mode: function(){ return mode; }};
})();
