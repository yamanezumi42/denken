/* 単元25「相互インダクタンスと磁気エネルギー」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(25, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, IOFF = H.IOFF, iSep = H.iSep, swapText = H.swapText, ZC = H.ZC, zband = H.zband, ztint = H.ztint, zpt = H.zpt, zones = H.zones, vOn = H.vOn, zoneTint = H.zoneTint, zSides = H.zSides, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// ---- 生成器の図の道具（textbook/gen/runtime.js の写し。名前の頭 tbGen_ だけ節ごと。手で直さない）
// K＝図の表（make_section.py が回路の形から作る）：vars＝動く数・items＝描く物・flows＝電流の通り道・von＝電圧の名前の鍵・bands＝帯の出し方
function tbGen_V(p, L, vars){
  return vars.map(function(v){
    if (v[0] === "m") return L[v[2]] !== undefined ? pv(p, v[1], 0) : 0;
    if (v[0] === "w") return Math.max(0, 1 - Math.abs(pv(p, v[1], 0) * (v[3] - 1) - v[2]));
    if (v[0] === "s") return pv(p, v[1], v[2]);
    if (v[0] === "a") return Math.max(0, 1 - Math.abs(pv(p, v[1], 0) - v[2]));
    return 1;
  });
}
function tbGen_O(V, vis){ var o = 1; (vis || []).forEach(function(a){ o *= a > 0 ? V[a - 1] : 1 - V[-a - 1]; }); return o; }
function tbGen_Lab(d, id, x, y, spec, p, k, o, anchor){
  if (spec === undefined || spec === null) return;
  var opt = anchor ? {anchor: anchor} : {};
  if (Array.isArray(spec)) swapText(d, id, x, y, spec[0], spec[1], pv(p, k + "v"), o, opt);
  else swapText(d, id, x, y, spec, null, 0, o, opt);
}
function tbGen_Cell(d, it, L, p, o){
  var N = it.n || it.k, s = N.indexOf("src") === 0 ? N.slice(3) : N, id = "c" + s, sw;
  if (it.dir === "h") {
    d.wire(id + ":L", [[it.xp, it.yp - 22], [it.xp, it.yp + 22]], {o: o});
    sw = d.wire(id + ":S", [[it.xm, it.ym - 11], [it.xm, it.ym + 11]], {o: o}); sw.style.strokeWidth = 4;
    var sg = it.xp < it.xm ? -1 : 1;
    if (L.pm) { d.text("pp" + s, it.sp ? it.sp[0] : it.xp + sg * 30, it.sp ? it.sp[1] : it.yp - 26, "+", {o: o}); d.text("pm" + s, it.sm ? it.sm[0] : it.xm - sg * 30, it.sm ? it.sm[1] : it.ym - 26, "−", {o: o}); }
    if (it.lab) tbGen_Lab(d, "e" + s, it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
    else tbGen_Lab(d, "e" + s, (it.xp + it.xm) / 2, it.yp + 42, L[it.k], p, it.k, o);
  } else {
    var sd = it.side || 1;
    d.wire(id + ":L", [[it.xp - 22, it.yp], [it.xp + 22, it.yp]], {o: o});
    sw = d.wire(id + ":S", [[it.xm - 11, it.ym], [it.xm + 11, it.ym]], {o: o}); sw.style.strokeWidth = 4;
    var sv = it.yp < it.ym ? -1 : 1;
    if (L.pm) { d.text("pp" + s, it.sp ? it.sp[0] : it.xp - sd * 36, it.sp ? it.sp[1] : it.yp + sv * 12, "+", {o: o}); d.text("pm" + s, it.sm ? it.sm[0] : it.xm - sd * 36, it.sm ? it.sm[1] : it.ym - sv * 12, "−", {o: o}); }
    if (it.lab) tbGen_Lab(d, "e" + s, it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
    else tbGen_Lab(d, "e" + s, it.xp + sd * 34, (it.yp + it.ym) / 2, L[it.k], p, it.k, o, sd > 0 ? "start" : "end");
  }
}
function tbGen_Res(d, it, L, p, o, V){
  var e;
  if (it.rot !== undefined) {
    e = d.el(it.n || it.k, "rect", "ink box");
    e.setAttribute("x", n(it.x - 30)); e.setAttribute("y", n(it.y - 12)); e.setAttribute("width", 60); e.setAttribute("height", 24);
    e.setAttribute("transform", "rotate(" + it.rot + " " + n(it.x) + " " + n(it.y) + ")"); d.style(e, {o: o});
  } else e = d.res(it.n || it.k, it.x, it.y, it.dir, {o: o});
  if (it.off) e.classList.toggle("dash", V[it.off - 1] >= 0.5);     // 外す動き：途中で点線に
  else if (it.dash) e.classList.add("dash");
  tbGen_Lab(d, (it.n || it.k) + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
}
// 電圧の矢印（低い方から高い方へ。矢じりは高い方）。横の抵抗＝上か下、縦の抵抗＝左か右
function tbGen_Vd(d, it, L, p, o){
  if (L[it.k] === undefined) return;
  var dd = pv(p, it.k + "d", 1), sd = it.side, w, N = it.n || it.k;
  if (it.dir === "h") {
    var ya = it.y + sd * 75;
    w = vdim(d, N + "d", it.x + it.hi * 72.5, it.x - it.hi * 72.5, it.y + sd * 10, it.y + sd * 85, ya, dd, {o: o});
    if (it.lab) tbGen_Lab(d, N + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o * w, it.lab[2]);
    else tbGen_Lab(d, N + "t", it.x, ya + sd * 25, L[it.k], p, it.k, o * w);
    return;
  }
  var yhi = it.y + it.hi * 72.5, ylo = it.y - it.hi * 72.5, x0 = it.x + sd * 10, x1 = it.x + sd * 85, xa = it.x + sd * 75;
  var e1 = Math.min(1, dd * 2), w2 = Math.max(0, dd * 2 - 1), xx = x0 + (x1 - x0) * e1;
  d.wire(N + "d:e", [[x0, yhi], [xx, yhi]], {o: e1 > 0 ? o : 0});
  d.wire(N + "d:f", [[x0, ylo], [xx, ylo]], {o: e1 > 0 ? o : 0});
  var Y = ylo + (yhi - ylo) * w2, sg = yhi > ylo ? 1 : -1, h = 11, s = "";
  if (w2 > 0.02) s = "M" + n(xa) + " " + n(ylo) + " V" + n(Y) + " M" + n(xa - 6) + " " + n(Y - sg * h) + " L" + n(xa) + " " + n(Y) + " L" + n(xa + 6) + " " + n(Y - sg * h);
  var a = d.el(N + "d:a", "path", "ink vdim"); a.setAttribute("d", s); d.style(a, {o: o});
  if (it.lab) tbGen_Lab(d, N + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o * w2, it.lab[2]);
  else tbGen_Lab(d, N + "t", xa + sd * 14, it.y, L[it.k], p, it.k, o * w2, sd > 0 ? "start" : "end");
}
function tbGen_I(d, it, L, p, o){
  if (L[it.k] === undefined) return;
  var oo = o * pv(p, it.k + "o", 1);
  d.arrow((it.n || it.k) + "a", it.x0, it.y0, it.x1, it.y1, {o: oo});
  tbGen_Lab(d, (it.n || it.k) + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, oo, it.lab[2]);
}
// 寸法線（合成抵抗など）。両端の補助線が伸びてから、両矢印が中から外へ
function tbGen_Dim(d, it, L, p, o, V){
  if (L[it.k] === undefined) return;
  var v = pv(p, it.k + "d", 1), e1 = Math.min(1, v * 2), w = Math.max(0, v * 2 - 1), x1 = it.x1, x2 = it.x2, c = (x1 + x2) / 2;
  var y1 = it.y1m ? it.y1 + (it.y1m[0] - it.y1) * V[it.y1m[1] - 1] : it.y1, y2 = it.y2m ? it.y2 + (it.y2m[0] - it.y2) * V[it.y2m[1] - 1] : it.y2;
  var oo = e1 > 0 ? o : 0, N = it.n || it.k;
  d.wire(N + "d:e", [[x1, y1], [x1, y1 + (it.yt - y1) * e1]], {o: oo});
  d.wire(N + "d:f", [[x2, y2], [x2, y2 + (it.yt - y2) * e1]], {o: oo});
  var Lx = c - (c - x1) * w, Rx = c + (x2 - c) * w, h = 9, ya = it.ya, s = "";
  if (w > 0.02) s = "M" + n(Lx) + " " + ya + " H" + n(Rx) + " M" + n(Lx + h) + " " + (ya - 5) + " L" + n(Lx) + " " + ya + " L" + n(Lx + h) + " " + (ya + 5) +
      " M" + n(Rx - h) + " " + (ya - 5) + " L" + n(Rx) + " " + ya + " L" + n(Rx - h) + " " + (ya + 5);
  var a = d.el(N + "d:a", "path", "ink"); a.setAttribute("d", s); d.style(a, {o: o});
  tbGen_Lab(d, N + "t", c, it.ly, L[it.k], p, it.k, o * w);
}
// 縦の寸法線（外した抵抗の外側に、a・b から見た合成抵抗 R_ab など）。両端の補助線が伸びてから、両矢印が中から外へ
function tbGen_DimV(d, it, L, p, o){
  if (L[it.k] === undefined) return;
  var v = pv(p, it.k + "d", 1), e1 = Math.min(1, v * 2), w = Math.max(0, v * 2 - 1), y1 = it.y1, y2 = it.y2, c = (y1 + y2) / 2;
  var oo = e1 > 0 ? o : 0, N = it.n || it.k, xx = it.x1 + (it.xt - it.x1) * e1;
  d.wire(N + "d:e", [[it.x1, y1], [xx, y1]], {o: oo});
  d.wire(N + "d:f", [[it.x1, y2], [xx, y2]], {o: oo});
  var T = c - (c - y1) * w, B = c + (y2 - c) * w, h = 9, xa = it.xa, s = "";
  if (w > 0.02) s = "M" + n(xa) + " " + n(T) + " V" + n(B) + " M" + n(xa - 5) + " " + n(T + h) + " L" + n(xa) + " " + n(T) + " L" + n(xa + 5) + " " + n(T + h) +
      " M" + n(xa - 5) + " " + n(B - h) + " L" + n(xa) + " " + n(B) + " L" + n(xa + 5) + " " + n(B - h);
  var a = d.el(N + "d:a", "path", "ink"); a.setAttribute("d", s); d.style(a, {o: o});
  var lb = it.lab || [xa + it.sd * 10, c, it.sd > 0 ? "start" : "end"];
  tbGen_Lab(d, N + "t", lb[0], lb[1], L[it.k], p, it.k, o * w, lb[2]);
}
// 端子（白丸と名前）。名前も図の濃さに合わせる（前は d.term で名前の濃さが 1 のままで、入れ替えの図の名前が重なって出ていた）
function tbGen_Term(d, it, o){
  var N = "tm" + (it.n || it.k), sd = it.side < 0 ? -1 : 1;
  tbGen_Circ(d, N, it.x, it.y, 6, o);
  var lb = it.lab || [it.x + sd * 16, it.y, sd < 0 ? "end" : "start"];
  d.text(N + ":t", lb[0], lb[1], it.k, {o: o, anchor: lb[2] || "middle"});
}
// 電位を見る点（名前 L["p" + 鍵] = {v: 電位}）
function tbGen_Pt(d, it, L, p, o, Z){
  var P = L["p" + it.k], N = it.n || it.k; if (!P) return;
  var oo = o * pv(p, "p" + it.k + "o", 1), vo = oo * pv(p, "p" + it.k + "vo", 1);
  d.dot("d" + N, it.x, it.y, {o: oo});
  if (it.nl) {
    d.text("n" + N, it.nl[0], it.nl[1], it.k, {o: oo, anchor: it.nl[2] || "middle"});
    if (P.v !== undefined && it.vl) tbGen_Lab(d, "p" + N + "t", it.vl[0], it.vl[1], P.v, p, "p" + it.k, vo, it.vl[2]);
  } else if (it.dir === "v") {
    d.text("n" + N, it.x - 18, it.y, it.k, {o: oo, anchor: "end"});
    if (P.v !== undefined) tbGen_Lab(d, "p" + N + "t", it.x + 18, it.y, P.v, p, "p" + it.k, vo, "start");
  } else {
    d.text("n" + N, it.x, it.y + 30, it.k, {o: oo});
    if (P.v !== undefined) tbGen_Lab(d, "p" + N + "t", it.x, it.y - 32, P.v, p, "p" + it.k, vo);
  }
  var z = Z && Z[it.node] ? Z[it.node] : it.z;
  if (z) ztint(d, zpt(N), z);
}
function tbGen_Circ(d, id, x, y, r, o){
  var e = d.el(id, "circle", "ink term"); e.setAttribute("cx", n(x)); e.setAttribute("cy", n(y)); e.setAttribute("r", r); return d.style(e, {o: o});
}
// 電流源（丸の中の矢印）・検流計（丸に G）
function tbGen_JG(d, it, L, p, o){
  var N = it.n || it.k;
  tbGen_Circ(d, N, it.x, it.y, 22, o);
  if (it.t === "j") {
    var sg = it.fwd ? 1 : -1;
    if (it.dir === "h") d.arrow(N + ":a", it.x - sg * 13, it.y, it.x + sg * 13, it.y, {o: o});
    else d.arrow(N + ":a", it.x, it.y - sg * 13, it.x, it.y + sg * 13, {o: o});
  } else d.text(N + ":t", it.x, it.y, "G", {o: o, size: 24});   // 丸の中の G は丸に入る大きさ（図の字のままだと丸からはみ出して帯にかかった）
  var sd = it.side || 1;
  if (it.lab) tbGen_Lab(d, N + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
  else if (it.dir === "h") tbGen_Lab(d, N + "t", it.x, it.y - 40, L[it.k], p, it.k, o);
  else tbGen_Lab(d, N + "t", it.x + sd * 32, it.y, L[it.k], p, it.k, o, sd > 0 ? "start" : "end");
}
// スイッチ（動く数 0＝開・1＝閉。開くと刃が 30 度上がる）
function tbGen_Sw(d, it, L, p, o, V){
  var s = V[it.v - 1], ang = -(1 - s) * Math.PI / 6, dx = it.x1 - it.x0, dy = it.y1 - it.y0, Ln = Math.sqrt(dx * dx + dy * dy), ux = dx / Ln, uy = dy / Ln;
  var ex = it.x0 + (ux * Math.cos(ang) - uy * Math.sin(ang)) * Ln, ey = it.y0 + (ux * Math.sin(ang) + uy * Math.cos(ang)) * Ln;
  var N = it.n || it.k;
  d.wire(N, [[it.x0, it.y0], [ex, ey]], {o: o});
  tbGen_Circ(d, N + ":p0", it.x0, it.y0, 5, o); tbGen_Circ(d, N + ":p1", it.x1, it.y1, 5, o);
  if (it.lab) tbGen_Lab(d, N + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
  else if (it.dir === "h") tbGen_Lab(d, N + "t", (it.x0 + it.x1) / 2, it.y0 - 50, L[it.k], p, it.k, o);
  else tbGen_Lab(d, N + "t", it.x0 + 44, (it.y0 + it.y1) / 2, L[it.k], p, it.k, o, "start");
}
// 閉回路の向き（網の中の一周の矢印）。名前があれば真ん中に
function tbGen_Loop(d, it, L, p, o){
  var r = it.r, cw = it.cw, a0 = cw ? 200 : -20, a1 = cw ? a0 + 280 : a0 - 280, R = Math.PI / 180;
  var P0 = [it.cx + r * Math.cos(a0 * R), it.cy + r * Math.sin(a0 * R)], P1 = [it.cx + r * Math.cos(a1 * R), it.cy + r * Math.sin(a1 * R)];
  var N = it.n || it.k, e = d.el(N, "path", "ink"); e.setAttribute("d", "M" + n(P0[0]) + " " + n(P0[1]) + " A" + r + " " + r + " 0 1 " + (cw ? 1 : 0) + " " + n(P1[0]) + " " + n(P1[1]));
  e.style.fill = "none"; d.style(e, {o: o});
  var tx = cw ? -Math.sin(a1 * R) : Math.sin(a1 * R), ty = cw ? Math.cos(a1 * R) : -Math.cos(a1 * R), h = d.el(N + ":h", "path", "ink head");
  h.setAttribute("d", "M" + n(P1[0] + tx * 5) + " " + n(P1[1] + ty * 5) + " L" + n(P1[0] - tx * 9 - ty * 7) + " " + n(P1[1] - ty * 9 + tx * 7) +
    " L" + n(P1[0] - tx * 9 + ty * 7) + " " + n(P1[1] - ty * 9 - tx * 7) + " Z"); d.style(h, {o: o});
  tbGen_Lab(d, N + "t", it.cx, it.cy, L[it.k], p, it.k, o);
}
// 練習で値が変わる図（L._v＝{部品の鍵: 値}）：回路を解き直して、帯の色（電位の高い順）を決め直す
function tbGen_Zones(L, K, V){
  var vv = L._v; if (!vv || !K.net) return null;
  var act = K.net.filter(function(e){ return tbGen_O(V, e[5]) >= 0.5; }), nodes = {}, nn = 0, i, j, k;
  act.forEach(function(e){ [e[2], e[3]].forEach(function(x){ if (!(x in nodes)) nodes[x] = nn++; }); });
  var srcs = act.filter(function(e){ return e[0] === "E"; }), N = nn + srcs.length, A = [], b = [];
  for (i = 0; i < N; i++) { A.push([]); for (j = 0; j < N; j++) A[i].push(i === j && i < nn ? 1e-9 : 0); b.push(0); }
  var val = function(e){ return vv[e[1]] !== undefined ? +vv[e[1]] : e[4]; };
  act.forEach(function(e){
    var a = nodes[e[2]], c = nodes[e[3]];
    if (e[0] === "R" || e[0] === "G" || e[0] === "C") { var g = e[0] === "C" ? 1e6 : 1 / val(e); A[a][a] += g; A[c][c] += g; A[a][c] -= g; A[c][a] -= g; }
    else if (e[0] === "J") { b[a] -= val(e); b[c] += val(e); }
  });
  srcs.forEach(function(e, q){ var a = nodes[e[2]], c = nodes[e[3]], r = nn + q; A[a][r] -= 1; A[r][a] += 1; A[c][r] += 1; A[r][c] -= 1; b[r] = val(e); });
  for (k = 0; k < N; k++) {
    var m = k; for (i = k + 1; i < N; i++) if (Math.abs(A[i][k]) > Math.abs(A[m][k])) m = i;
    var t = A[k]; A[k] = A[m]; A[m] = t; t = b[k]; b[k] = b[m]; b[m] = t;
    if (Math.abs(A[k][k]) < 1e-15) return null;
    for (i = 0; i < N; i++) if (i !== k) { var f = A[i][k] / A[k][k]; if (f) { for (j = k; j < N; j++) A[i][j] -= f * A[k][j]; b[i] -= f * b[k]; } }
  }
  var pot = {}, used = {}, Z = {};
  Object.keys(nodes).forEach(function(x){ pot[x] = Math.round(b[nodes[x]] / A[nodes[x]][nodes[x]] * 1e6) / 1e6; });
  K.items.forEach(function(it){ if (it.t === "z" && it.node in pot && tbGen_O(V, it.vis) > 0) used[pot[it.node]] = 1; });
  var vals = Object.keys(used).map(Number).sort(function(x, y){ return y - x; }), n2 = vals.length;
  var names = n2 <= 1 ? ["lo"] : n2 === 2 ? ["hi", "lo"] : ["hi"].concat(vals.slice(1, -1).map(function(_, q){ return ["mid", "mid2", "mid3"][q % 3]; }), ["lo"]);
  Object.keys(pot).forEach(function(x){ var q = vals.indexOf(pot[x]); if (q >= 0) Z[x] = names[q]; });
  return Z;
}
function tbGen_Draw(d, p, L, K){
  var V = tbGen_V(p, L, K.vars), on = K.bands === "always" ? 1 : K.bands === "volt" ? (vOn(L, K.von) ? 1 : 0) : 0;
  var hasV = function(k){ return L["p" + k] && L["p" + k].v !== undefined; };   // 名前だけの点（{}）は帯の決まりに数えない（2026-11-04）
  var anyPt = K.bands !== "never" && (K.pts || []).some(hasV), Z = tbGen_Zones(L, K, V);
  K.items.forEach(function(it){
    var o = tbGen_O(V, it.vis), oz;
    if (it.t === "z") {
      if (anyPt) {
        var ks = it.pts.filter(hasV); if (!ks.length) return;
        oz = Math.max.apply(null, ks.map(function(k){ return pv(p, "p" + k + "o", 1); }));
      } else { if (!on) return; oz = 1; }
      zband(d, it.id, it.lines, Z && Z[it.node] ? Z[it.node] : it.z, o * oz);
    } else if (it.t === "w") { var e = d.wire(it.id, it.pts, {o: o}); if (it.dash) e.classList.add("dash"); }
    else if (it.t === "d") d.dot(it.id, it.x, it.y, {o: o});
    else if (it.t === "r") tbGen_Res(d, it, L, p, o, V);
    else if (it.t === "e") tbGen_Cell(d, it, L, p, o);
    else if (it.t === "v") tbGen_Vd(d, it, L, p, o);
    else if (it.t === "i") tbGen_I(d, it, L, p, o);
    else if (it.t === "dim") tbGen_Dim(d, it, L, p, o, V);
    else if (it.t === "p") tbGen_Pt(d, it, L, p, o, Z);
    else if (it.t === "j" || it.t === "g") tbGen_JG(d, it, L, p, o);
    else if (it.t === "s") tbGen_Sw(d, it, L, p, o, V);
    else if (it.t === "T") tbGen_Term(d, it, o);
    else if (it.t === "dimv") tbGen_DimV(d, it, L, p, o);
    else if (it.t === "l") tbGen_Loop(d, it, L, p, o);
  });
}
// 電流の通り道：動く数の組（0.5 以上か）ごとに作った物から、今の組の物
function tbGen_Flow(p, L, K){
  var V = tbGen_V(p, L, K.vars);
  for (var i = 0; i < K.flows.length; i++) {
    var f = K.flows[i];
    if (f.c.every(function(a){ return (a > 0 ? V[a - 1] : 1 - V[-a - 1]) >= 0.5; })) return {o: pv(p, "co"), base: K.base, paths: f.paths};
  }
  return {o: 0, base: K.base, paths: []};
}
// ---- 回路でない図の型の道具（textbook/gen/figs.js。gen/figkit.py の図。名前の頭 tbFig_。tb_secunit.py がその図のある単元に1つだけ入れる）
// 部品（K.items の f）：ln 折れ線（fill＝塗り）・ar 矢印（two＝両矢印）・c 丸（sign・sk＝中の記号）・tx 決まった文字・lb 名前（L[k]）。
// 濃さ＝vis（alt の図の番号）×o（動く数の積）×no（1−動く数）×need（その名前が無いと出さない）。mv＝[[動く数, dx, dy], …] だけずれる。
// sel・var＝名前の値（L[sel]。一覧は "|" でつなぐ）で形を替える（値が無い時は dflt、それも無ければ出さない）。
// gr＝矢印が伸びる（動く数 0→1）・sc＝[動く数, 倍]（矢印の長さ）・mve＝矢印の先だけずれる・col＝線の色（強調の時は強調の色）。
var TBF_FILL = {area: ["rgba(116,192,252,.35)", "rgba(255,146,43,.45)"], pos: ["#ffc9c9", "#ffd8a8"], neg: ["#d0ebff", "#ffd8a8"],
                gray: ["rgba(173,181,189,.35)", "rgba(255,146,43,.45)"], med: ["rgba(178,242,187,.45)", "rgba(255,146,43,.35)"],
                n: ["#ffc9c9", "#ffd8a8"], s: ["#d0ebff", "#ffd8a8"], core: ["rgba(206,212,218,.55)", "rgba(255,146,43,.45)"],
                hi: ["#ffa8a8", "#ffa8a8"], lo: ["#ced4da", "#ced4da"], mid: ["#b197fc", "#b197fc"]};
function tbFig_Op(p, L, it){
  var o = 1;
  (it.o || []).forEach(function(k){ o *= pv(p, k, 1); });
  (it.no || []).forEach(function(k){ o *= 1 - pv(p, k, 0); });
  if (it.need && (L[it.need] === undefined || L[it.need] === null || L[it.need] === "")) o = 0;
  if (it.hide && L[it.hide[0]] !== undefined && L[it.hide[0]] !== null && L[it.hide[0]] !== "") o *= 1 - pv(p, it.hide[1], 1);   // その名前が出ると消える
  return o;
}
function tbFig_Sel(L, it, p){
  if (!it.sel) return it;
  // 名前の値が [前, 後] の時は p[鍵+"v"]（0.5 で替わる）
  var key = [].concat(it.sel).map(function(k){ var v = L[k]; if (Array.isArray(v)) v = v[pv(p || {}, k + "v", 0) >= 0.5 ? 1 : 0];
    return v === undefined || v === null ? "" : String(v); }).join("|"), ov = it.var[key];
  if (!ov && it.dflt !== undefined) ov = it.var[it.dflt];
  if (!ov) return null;
  return Object.assign({}, it, ov);
}
// コンデンサ（figkit_cap.py の C）：練習の vals・lab の _v は静電容量なので、抵抗 1/値 として解く
function tbFig_CapL(L, K){
  if (!L._v) return L;
  var ck = K.items.filter(function(it){ return it.f === "cap"; }).map(function(it){ return it.k; });
  if (!ck.length) return L;
  var v = Object.assign({}, L._v);
  ck.forEach(function(k){ if (v[k] !== undefined) v[k] = 1 / +v[k]; });
  return Object.assign({}, L, {_v: v});
}
function tbFig_Cap(d, it, L, p, o){
  var x = it.x, y = it.y, G = 7, P = 18, h = it.dir === "h", k = it.n || it.k, a, b;
  var A = function(s, t){ return h ? [x + s, y + t] : [x + t, y + s]; };
  if (it.rot !== undefined) { var ca = Math.cos(it.rot * Math.PI / 180), sa = Math.sin(it.rot * Math.PI / 180);   // 斜めの辺（Δ・Y）
    A = function(s, t){ return [x + s * ca - t * sa, y + s * sa + t * ca]; }; }
  d.wire(k + ":l1", [A(-30, 0), A(-G, 0)], {o: o}); d.wire(k + ":l2", [A(G, 0), A(30, 0)], {o: o});
  a = d.wire(k, [A(-G, -P), A(-G, P)], {o: o}); b = d.wire(k + ":b", [A(G, -P), A(G, P)], {o: o});
  a.style.strokeWidth = 5; b.style.strokeWidth = 5;
  tbGen_Lab(d, k + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
  var pre = function(s, c){ return Array.isArray(s) ? s.map(function(z){ return z ? c + z : z; }) : s ? c + s : s; }, F = it.F || 27;
  var sf = it.n ? it.n.slice(it.k.length) : "";      // alt・side の2つ目からの図（id の後ろに付ける）
  if (it.q && L[it.q] !== undefined && pv(p, "qd", 1) > 0) {
    var sp = it.fh ? -1 : 1;
    if (h) { tbGen_Lab(d, it.q + "p" + sf, x + sp * (G + 4), y + 18 + 0.55 * F, pre(L[it.q], "+"), p, it.q, o, sp < 0 ? "end" : "start");
             tbGen_Lab(d, it.q + "m" + sf, x - sp * (G + 4), y + 18 + 0.55 * F, pre(L[it.q], "-"), p, it.q, o, sp < 0 ? "start" : "end"); }
    else { tbGen_Lab(d, it.q + "p" + sf, x + 20, y + sp * (G + 0.6 * F), pre(L[it.q], "+"), p, it.q, o, "start");
           tbGen_Lab(d, it.q + "m" + sf, x + 20, y - sp * (G + 0.6 * F), pre(L[it.q], "-"), p, it.q, o, "start"); }
  }
  if (it.w && L[it.w] !== undefined) {
    var nq = it.q && L[it.q] !== undefined ? 1 : 0;
    if (h) tbGen_Lab(d, it.w + "t" + sf, x, y + 18 + (0.55 + 1.15 * nq) * F, L[it.w], p, it.w, o * pv(p, it.w + "d", 1));
    else tbGen_Lab(d, it.w + "t" + sf, x + 20, y + (nq ? 2 : 0) * 0.6 * F, L[it.w], p, it.w, o * pv(p, it.w + "d", 1), "start");
  }
}
// コイル（figkit_tr.py の L）：山が4つの線。opp＝電流と逆向きの短い矢印（流れを妨げる働き）
function tbFig_Ind(d, it, L, p, o){
  var x = it.x, y = it.y, h = it.dir === "h", k = it.n || it.k, pts = [], i, a;
  var A = function(s, t){ return h ? [x + s, y + t] : [x + t, y + s]; };
  pts.push(A(-30, 0));
  for (i = 0; i < 4; i++) for (a = 0; a <= 8; a++) { var th = Math.PI * a / 8; pts.push(A(-30 + i * 15 + 7.5 - 7.5 * Math.cos(th), -9 * Math.sin(th))); }
  pts.push(A(30, 0));
  d.wire(k, pts, {o: o});
  tbGen_Lab(d, k + "t", it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
  if (it.opp) { var c = it.cd || 1, q0 = A(c * 22, -34), q1 = A(-c * 22, -34); d.arrow(k + ":opp", q0[0], q0[1], q1[0], q1[1], {o: o * pv(p, "oppd", 1)}); }
}
// 切り替えスイッチ（figkit_tr.py の Sw2）：b の接点と a・b の名前
function tbFig_Sw2(d, it, L, p, o){
  var k = it.n || it.k, h = it.dir === "h", bx = h ? it.x1 : it.x1 + 40, by = h ? it.y1 + 40 : it.y1;
  var e = d.el(k + ":cb", "circle", "ink term"); e.setAttribute("cx", n(bx)); e.setAttribute("cy", n(by)); e.setAttribute("r", 5); d.style(e, {o: o});
  if (L.a !== undefined) d.text(k + ":ta0", it.x1 + (h ? 0 : 0), it.y1 - (h ? 26 : 0) + (h ? 0 : -24), L.a, {o: o});
  if (L.b !== undefined) d.text(k + ":tb0", bx + (h ? 20 : 20), by + (h ? 6 : 0), L.b, {o: o, anchor: "start"});
}
function tbFig_Draw(d, p, L, K){
  L = tbFig_TexL(tbFig_CapL(L, K));
  tbGen_Draw(d, p, L, K);
  var V = tbGen_V(p, L, K.vars);
  K.items.forEach(function(it0){
    if (it0.sw2) tbFig_Sw2(d, it0, L, p, tbGen_O(V, it0.vis));
    if (!it0.f) return;
    var o0 = tbGen_O(V, it0.vis);
    if (it0.f === "cap") { tbFig_Cap(d, it0, L, p, o0); return; }
    if (it0.f === "ind") { tbFig_Ind(d, it0, L, p, o0); return; }
    if (it0.f === "ac") { tbFig_AC(d, it0, L, p, o0); return; }
    if (it0.f === "wave") { tbFig_Wave(d, it0, L, p, o0); return; }
    if (it0.f === "phasor") { tbFig_Phasor(d, it0, L, p, o0); return; }
    if (it0.f === "xg") { tbFig_Xg(d, it0, L, p, o0); return; }
    var it = tbFig_Sel(L, it0, p), o = tbGen_O(V, it0.vis) * tbFig_Op(p, L, it0), e;
    if (!it) { it = it0; o = 0; }
    var dx = 0, dy = 0;
    (it.mv || []).forEach(function(m){ var v = pv(p, m[0], 0); dx += v * m[1]; dy += v * m[2]; });
    if (it.f === "ln") {
      var pts = it.pts.map(function(q){ return [q[0] + dx, q[1] + dy]; });
      if (it.close) pts = pts.concat([pts[0]]);
      if (it.tt) { var nn = Math.max(2, Math.ceil(pts.length * pv(p, it.tt, 1))); if (pv(p, it.tt, 1) <= 0.001) o = 0; pts = pts.slice(0, nn); }   // 線が左から引かれる
      e = d.wire(it.id, pts, {o: o});
      e.classList.toggle("dash", !!it.dash);
      e.style.strokeWidth = it.w ? it.w : "";
      var lc = it.col;
      if (it.zc) {          // 帯の色を L._v の値で（zc＝[高い方なら赤の鍵, 比べる鍵]。"" は決まった色）。_v が無ければ出さない
        if (!L._v) e.style.opacity = 0;
        else if (it.zc[0]) lc = +L._v[it.zc[0]] >= +L._v[it.zc[1]] ? "#ffa8a8" : "#b197fc";
      }
      e.style.stroke = lc && !e.classList.contains("on") ? lc : "";
      if (it.fill) { var c = TBF_FILL[it.fill] || [it.fill, it.fill]; e.style.fill = e.classList.contains("on") ? c[1] : c[0]; }
      else e.style.fill = "none";
    } else if (it.f === "ar") {
      var x0 = it.x0 + dx, y0 = it.y0 + dy, x1 = it.x1 + dx, y1 = it.y1 + dy;
      (it.mve || []).forEach(function(m){ var v = pv(p, m[0], 0); x1 += v * m[1]; y1 += v * m[2]; });
      var s = 1;
      if (it.gr) s *= pv(p, it.gr, 1);
      if (it.sc) s *= 1 + (it.sc[1] - 1) * pv(p, it.sc[0], 0);
      if (s < 0.03) o = 0;
      s = Math.max(s, 0.03);
      x1 = x0 + (x1 - x0) * s; y1 = y0 + (y1 - y0) * s;
      if (it.two) {
        var ddx = x1 - x0, ddy = y1 - y0, Ln = Math.sqrt(ddx * ddx + ddy * ddy) || 1, ux = ddx / Ln, uy = ddy / Ln;
        d.arrow(it.id, x0 + ux * 6, y0 + uy * 6, x1, y1, {o: o});
        var h2 = d.el(it.id + ":h2", "path", "ink head");
        h2.setAttribute("d", "M" + n(x0) + " " + n(y0) + " L" + n(x0 + ux * 13 - uy * 7) + " " + n(y0 + uy * 13 + ux * 7) + " L" + n(x0 + ux * 13 + uy * 7) + " " + n(y0 + uy * 13 - ux * 7) + " Z");
        d.style(h2, {o: o});
      } else d.arrow(it.id, x0, y0, x1, y1, {o: o});
      var a = d.els[it.id], h = d.els[it.id + ":h"];
      a.style.strokeWidth = it.w ? it.w : "";
      var col = it.col && !a.classList.contains("on") ? it.col : "";
      a.style.stroke = col; h.style.stroke = col; h.style.fill = col;
    } else if (it.f === "c") {
      var sg = it.sign, fl = it.fill;
      if (it.sk) { var v = L[it.sk]; sg = v === "+" ? "+" : v === "-" || v === "−" ? "−" : v ? String(v) : ""; if (v === "+") fl = "pos"; else if (v === "-" || v === "−") fl = "neg"; }
      e = d.el(it.id, "circle", fl === "k" ? "dot" : "ink term");
      e.setAttribute("cx", n(it.cx + dx)); e.setAttribute("cy", n(it.cy + dy)); e.setAttribute("r", it.r);
      d.style(e, {o: o});
      e.style.fill = fl === "n" ? "none" : TBF_FILL[fl] ? TBF_FILL[fl][e.classList.contains("on") ? 1 : 0] : "";
      if (sg) d.text(it.id + ":t", it.cx + dx, it.cy + dy + 1, sg, {o: o, size: Math.round(it.r * 1.25)});
      else if (d.els[it.id + ":t"]) d.text(it.id + ":t", it.cx + dx, it.cy + dy, "", {o: 0});
    } else if (it.f === "tx") {
      d.text(it.id, it.x + dx, it.y + dy, it.s, {o: o, anchor: it.anc, size: it.size});
    } else if (it.f === "lb") {
      var sp = L[it.k];
      if (it.pre && sp) sp = Array.isArray(sp) ? sp.map(function(z){ return z ? it.pre + z : z; }) : it.pre + sp;   // 名前の前に付ける文字（電荷の + と -）
      tbGen_Lab(d, it.id, it.x + dx, it.y + dy, sp, p, it.k, o, it.anc);
    }
  });
}
// ---- 交流の図（figkit_ac.py）：wave・phasor・xgraph・交流電源。形は L の数の鍵から描く
// 図の名前の TeX の書き方（\dfrac{a}{b}・\sqrt{2} など）を図の文字に直す（図の文字は KaTeX でない）
function tbFig_Tex(s){
  if (typeof s !== "string" || s.indexOf("\\") < 0) return s;
  var t = s, k;
  for (k = 0; k < 4; k++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2");
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, "√$1").replace(/\\sqrt/g, "√").replace(/\\(sin|cos|tan)/g, "$1 ").replace(/\\pi/g, "π")
       .replace(/\\omega/g, "ω").replace(/\\theta/g, "θ").replace(/\\varphi|\\phi/g, "φ").replace(/\\cdot/g, "·").replace(/\\times/g, "×")
       .replace(/\\[,;!]/g, " ").replace(/\\left|\\right/g, "").replace(/\\[a-zA-Z]+/g, "");
  return t.replace(/\s+/g, " ").trim();
}
function tbFig_TexL(L){
  var o = {}, k;
  for (k in L) { var v = L[k]; o[k] = Array.isArray(v) ? v.map(tbFig_Tex) : tbFig_Tex(v); }
  return o;
}
function tbFig_Num(v, d){ if (Array.isArray(v)) v = v[0]; var x = typeof v === "number" ? v : parseFloat(v); return isFinite(x) ? x : d; }
function tbFig_Pick(L, p, k){ var v = L[k]; if (!Array.isArray(v)) return v; var i = Math.round(pv(p, k + "v", 0)); return v[Math.max(0, Math.min(v.length - 1, i))]; }
function tbFig_Lb(d, id, x, y, L, p, k, o, anc){
  var v = L[k]; if (v === undefined || v === null || v === "") return;
  if (Array.isArray(v) && v.length === 3) { var i = Math.round(pv(p, k + "v", 0));
    v.forEach(function(s, j){ d.text(id + "t" + j, x, y, s, {o: o * (j === i ? 1 : 0), anchor: anc}); }); return; }
  tbGen_Lab(d, id + "t", x, y, v, p, k, o, anc);
}
function tbFig_Poly(d, id, pts, o, col, w, dash){
  var e = d.wire(id, pts, {o: o}); e.classList.toggle("dash", !!dash); e.style.strokeWidth = w || "";
  e.style.stroke = col && !e.classList.contains("on") ? col : ""; e.style.fill = "none"; return e;
}
function tbFig_Arr(d, id, x0, y0, x1, y1, o, col, w, dash){
  d.arrow(id, x0, y0, x1, y1, {o: o});
  var a = d.els[id], h = d.els[id + ":h"]; a.style.strokeWidth = w || ""; a.classList.toggle("dash", !!dash);
  var c = col && !a.classList.contains("on") ? col : ""; a.style.stroke = c; h.style.stroke = c; h.style.fill = c;
}
var TBF_COL = {black: "", red: "#c92a2a", blue: "#1971c2", gray: "#868e96", "": ""};
// 交流電源（丸の中に正弦波）
function tbFig_AC(d, it, L, p, o){
  var k = it.n || it.k, s = k.indexOf("src") === 0 ? k.slice(3) : k, x = (it.xp + it.xm) / 2, y = (it.yp + it.ym) / 2, r = 18, pts = [], i;
  var e = d.el("c" + s + ":L", "circle", "ink term"); e.setAttribute("cx", n(x)); e.setAttribute("cy", n(y)); e.setAttribute("r", r); d.style(e, {o: o});
  for (i = 0; i <= 20; i++) pts.push([x - 10 + 20 * i / 20, y - 6 * Math.sin(2 * Math.PI * i / 20)]);
  d.wire("c" + s + ":S", pts, {o: o});
  if (it.lab) tbGen_Lab(d, "e" + s, it.lab[0], it.lab[1], L[it.k], p, it.k, o, it.lab[2]);
  else if (it.dir === "h") tbGen_Lab(d, "e" + s, x, y + 46, L[it.k], p, it.k, o);
  else tbGen_Lab(d, "e" + s, x + (it.side || 1) * 36, y, L[it.k], p, it.k, o, (it.side || 1) > 0 ? "start" : "end");
}
// 波形
function tbFig_Wave(d, it, L, p, o){
  if (it.df) L = Object.assign({}, it.df, L);
  var S = it.sfx || "", X0 = it.X0, W = it.W, Yc = it.Yc, H = it.H, A = H * 0.8;
  var per = tbFig_Num(L.per, 1), left = tbFig_Num(L.left, 0), span = per + left;
  var X = function(f){ return X0 + (f / span) * W; }, x0 = X(-left), xe = X0 + W;
  // 軸
  tbFig_Arr(d, "wax" + S, X0 - 10, Yc, xe + 40, Yc, o); tbFig_Arr(d, "way" + S, x0, Yc + H, x0, Yc - H - 20, o);
  d.text("wo" + S, x0 - 14, Yc + 24, "0", {o: o, anchor: "end"});
  tbFig_Lb(d, "wax" + S, xe + 52, Yc, L, p, "ax", o, "start");
  tbFig_Lb(d, "way" + S, x0 - 14, Yc - H - 10, L, p, "ay", o, "end");
  var cols = ["", "#c92a2a", "#1971c2"], fold = pv(p, "fold", 0);
  var val = function(k, f, ph){   // 波 k の時刻 f（周期の割合）の高さ（比）
    var a = tbFig_Num(L["w" + k + "a"], 1), sh = tbFig_Pick(L, p, "w" + k + "s") || "sin", v = Math.sin(2 * Math.PI * f + ph * Math.PI / 180);
    if (sh === "abs" || (k === 1 && fold > 0.5)) v = Math.abs(v); else if (sh === "half") v = Math.max(0, v); else if (sh === "sq") v = v >= 0 ? 1 : -1;
    return a * v;
  };
  var w1y = function(f){ return Yc - A * val(1, f, tbFig_Num(L.w1p, 0) * pv(p, "w1m", 1)); };
  // 塗り（w1 と横の軸の間）
  if (L.fill !== undefined && L.fill !== null) {
    var fa = tbFig_Num(L.filla, 0), fb = tbFig_Num(L.fillb, 0.5), fp = [[X(fa), Yc]], q;
    for (q = 0; q <= 40; q++) { var ff = fa + (fb - fa) * q / 40; fp.push([X(ff), w1y(ff)]); }
    fp.push([X(fb), Yc]); fp.push([X(fa), Yc]);
    var fe = tbFig_Poly(d, "wfl" + S, fp, o * pv(p, "filld", 1), null, 1); fe.style.fill = fe.classList.contains("on") ? "rgba(255,146,43,.45)" : "rgba(116,192,252,.35)";
    tbFig_Lb(d, "wfl" + S, X((fa + fb) / 2), Yc - A * 0.3, L, p, "fill", o * pv(p, "filld", 1));
  }
  // 高さの線（lv1box＝長方形）
  ["1", "2"].forEach(function(k){
    if (L["lv" + k] === undefined || L["lv" + k] === null) return;
    var at = tbFig_Num(L["lv" + k + "at"], 0.7071), la = tbFig_Num(L["lv" + k + "a"], 0), lb = tbFig_Num(L["lv" + k + "b"], per), y = Yc - A * at, oo = o * pv(p, "lv" + k + "d", 1);
    if (k === "1" && L.lv1box) { var be = tbFig_Poly(d, "wlb1" + S, [[X(la), Yc], [X(la), y], [X(lb), y], [X(lb), Yc]], oo, null, 1);
      be.style.fill = be.classList.contains("on") ? "rgba(255,146,43,.4)" : "rgba(255,192,120,.35)"; }
    tbFig_Poly(d, "wlv" + k + S, [[X(la), y], [X(lb), y]], oo, "#e67700", 3, true);
    tbFig_Lb(d, "wlv" + k + S, X(lb) + 12, y - 2, L, p, "lv" + k, oo, "start");
  });
  // 波
  ["1", "2", "3"].forEach(function(k, i){
    if (L["w" + k] === undefined || L["w" + k] === null) return;
    var ph = tbFig_Num(L["w" + k + "p"], 0) * pv(p, "w" + k + "m", 1), pts = [], q, N = 120, dd = pv(p, "w" + k + "d", 1);
    for (q = 0; q <= N * dd; q++) { var f = -left + span * q / N; pts.push([X(f), Yc - A * val(+k, f, ph)]); }
    if (pts.length < 2) pts = [[X(-left), Yc], [X(-left), Yc]];
    tbFig_Poly(d, "ww" + k + S, pts, o * (dd > 0.01 ? 1 : 0), cols[i], 4);
    var fpk = (0.25 - ph / 360) - Math.floor(0.25 - ph / 360), xx = X(fpk + (fpk < -left ? 1 : 0)), yy = Yc - A * tbFig_Num(L["w" + k + "a"], 1);
    tbFig_Lb(d, "ww" + k + S, xx + 28 + i * 6, yy - 26 - i * 30, L, p, "w" + k, o * (dd > 0.5 ? 1 : 0), "start");
  });
  // 横の軸の目盛り
  ["1", "2", "3", "4"].forEach(function(k){
    if (L["x" + k] === undefined || L["x" + k] === null) return;
    var at = tbFig_Num(L["x" + k + "at"], +k * 0.25), x = X(at), y = w1y(at);
    tbFig_Poly(d, "wx" + k + S, [[x, Yc], [x, y]], o, null, 2, true);
    tbFig_Lb(d, "wx" + k + S, x, Yc + (y < Yc ? 34 : -34), L, p, "x" + k, o);
  });
  // 縦の軸の目盛り
  [["1", 1], ["2", -1], ["3", null]].forEach(function(a){
    var k = a[0]; if (L["y" + k] === undefined || L["y" + k] === null) return;
    var h = a[1] === null ? tbFig_Num(L.y3at, 0.5) : a[1] * tbFig_Num(L.w1a, 1), y = Yc - A * h, fpk = a[1] === -1 ? 0.75 : 0.25;
    tbFig_Poly(d, "wy" + k + S, [[x0, y], [X(fpk), y]], o, null, 2, true);
    tbFig_Lb(d, "wy" + k + S, x0 - 14, y, L, p, "y" + k, o, "end");
  });
  // 周期の寸法線
  if (L.per1 !== undefined && L.per1 !== null) {
    var pa = tbFig_Num(L.per1a, 0), pb = tbFig_Num(L.per1b, 1), yp = Yc - A - 50, op = o * pv(p, "per1d", 1);
    d.arrow("wpr" + S, X(pa) + 6, yp, X(pb), yp, {o: op});
    var h2 = d.el("wpr" + S + ":h2", "path", "ink head"), xa = X(pa);   // id＝wpr＋sfx＋":h2"
    h2.setAttribute("d", "M" + n(xa) + " " + yp + " L" + n(xa + 13) + " " + (yp - 7) + " L" + n(xa + 13) + " " + (yp + 7) + " Z"); d.style(h2, {o: op});
    tbFig_Lb(d, "wpr" + S, (X(pa) + X(pb)) / 2, yp - 30, L, p, "per1", op);
  }
  // 2つ目の点（pt2）
  if (L.pt2 !== undefined && L.pt2 !== null) {
    var qa2 = tbFig_Num(L.pt2at, 0.375), qx = X(qa2), qy = w1y(qa2), oq = o * pv(p, "pt2d", 1);
    d.dot("wpt2" + S, qx, qy, {o: oq}); tbFig_Poly(d, "wpt2l" + S, [[qx, qy], [qx, Yc]], oq, null, 2, true);
    tbFig_Lb(d, "wpt2" + S, qx + 16, qy - 28, L, p, "pt2", oq, "start");
  }
  // 1周期の線を太く（mark）・波のスタートの点（sN）
  if (L.w1 !== undefined && L.w1 !== null) { var mp = [], q2; for (q2 = 0; q2 <= 60; q2++) mp.push([X(q2 / 60), w1y(q2 / 60)]); tbFig_Poly(d, "ww1a" + S, mp, o * pv(p, "mark", 0), "#e67700", 7); }
  ["2", "3"].forEach(function(k){
    if (L["s" + k] === undefined || L["s" + k] === null || L["w" + k] === undefined) return;
    var ph = tbFig_Num(L["w" + k + "p"], 0) * pv(p, "w" + k + "m", 1), f0 = -ph / 360;
    var e = d.el("ws" + k + S, "circle", "ink term"); e.setAttribute("cx", n(X(f0))); e.setAttribute("cy", n(Yc)); e.setAttribute("r", 7); d.style(e, {o: o});
  });
  // 点
  if (L.pt !== undefined && L.pt !== null) {
    var pa2 = tbFig_Num(L.ptat, 0.25), px = X(pa2), py = w1y(pa2), opt = o * pv(p, "ptd", 1);
    d.dot("wpt" + S, px, py, {o: opt}); tbFig_Poly(d, "wptl" + S, [[px, py], [px, Yc]], opt, null, 2, true);
    tbFig_Lb(d, "wpt" + S, px + 16, py - 28, L, p, "pt", opt, "start");
  }
}
// ベクトル図
function tbFig_Phasor(d, it, L, p, o){
  if (it.df) L = Object.assign({}, it.df, L);
  var S = it.sfx || "", Ox = it.Ox, Oy = it.Oy, SC = it.S, R = Math.PI / 180, tips = {}, i;
  var ks = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].filter(function(k){ return L["a" + k] !== undefined && L["a" + k] !== null; });
  var lmax = Math.max.apply(null, ks.map(function(k){ return tbFig_Num(L["a" + k + "l"], 1); }).concat([0.0001]));
  var flip2 = pv(p, "a2f", 0) > 0.5;
  if (L.cplx) {
    tbFig_Arr(d, "pax" + S, Ox - 120, Oy, Ox + SC + 60, Oy, o); tbFig_Arr(d, "pay" + S, Ox, Oy + 260, Ox, Oy - 290, o);
    tbFig_Lb(d, "paxr" + S, Ox + SC + 60, Oy + 34, L, p, "axr", o, "end"); tbFig_Lb(d, "paxi" + S, Ox + 16, Oy - 290, L, p, "axi", o, "start");
  }
  if (L.ref) tbFig_Poly(d, "pref" + S, [[Ox, Oy], [Ox + SC * 0.95, Oy]], o, "#adb5bd", 2, true);
  var colOf = function(k){ var c = L["a" + k + "c"]; return c !== undefined ? TBF_COL[c] || c : ({"1": "", "2": "#c92a2a", "3": "#1971c2"})[k] || "#868e96"; };
  // 矢印（始点が別の矢印の先なら、その順に）
  var done = {}, guard = 0;
  while (Object.keys(done).length < ks.length && guard++ < 10) ks.forEach(function(k){
    if (done[k]) return;
    var org = L["a" + k + "o"] || "O", st;
    if (org === "O" || org === "") st = [Ox, Oy]; else { var ok = String(org).replace(/^a/, ""); if (!done[ok]) return; st = tips[ok]; }
    var len = tbFig_Num(L["a" + k + "l"], 1) / lmax * SC * pv(p, "a" + k + "d", 1), g = tbFig_Num(tbFig_Pick(L, p, "a" + k + "g"), 0);
    if (L["a" + k + "r"] === undefined) g = g * pv(p, "a" + k + "r", 1);
    if (k === "2") g += 180 * pv(p, "a2f", 0);
    if (k === "3" && flip2) g = -g;
    var ox = tbFig_Num(L["a" + k + "x"], 0) * SC, oy = tbFig_Num(L["a" + k + "y"], 0) * SC;
    var x0 = st[0] + ox, y0 = st[1] + oy, x1 = x0 + len * Math.cos(g * R), y1 = y0 - len * Math.sin(g * R);
    tips[k] = [st[0] + len * Math.cos(g * R), st[1] - len * Math.sin(g * R)]; done[k] = 1;
    var oo = o * (len > 2 ? 1 : 0);
    tbFig_Arr(d, "pa" + k + S, x0, y0, x1, y1, oo, colOf(k), 4, L["a" + k + "k"] === "dash");
    var ux = Math.cos(g * R), uy = -Math.sin(g * R), lx = x1 + ux * 22 + (Math.abs(uy) > 0.7 ? 14 : 0), ly = y1 + uy * 26;
    var anc = ux > 0.3 ? "start" : ux < -0.3 ? "end" : "start";
    var lab = L["a" + k];
    if (L["a" + k + "dot"]) { var dot = function(s){ return typeof s === "string" ? s.replace(/^\{(.)/, "{$1̇") : s; }; lab = Array.isArray(lab) ? lab.map(dot) : dot(lab); }
    var L2 = Object.assign({}, L); L2["a" + k] = lab;
    tbFig_Lb(d, "pa" + k + S, lx, ly, L2, p, "a" + k, oo, anc);
  });
  d.dot("po" + S, Ox, Oy, {o: o});
  if (L.o1 !== undefined) tbFig_Lb(d, "po1" + S, Ox - 16, Oy + 30, L, p, "o1", o, "end");
  if (L.dg1 !== undefined && L.dg1 !== null && tips["1"] && tips["2"]) tbFig_Poly(d, "pdg1" + S, [tips["1"], tips["2"]], o * pv(p, "dg1d", 1), "#e67700", 3, true);
  if (L.dirs) [["d0", 0], ["d90", 90], ["d180", 180], ["dm90", -90]].forEach(function(a){
    var od = o * pv(p, "dirsd", 1), g = a[1] * R, x = Ox + 230 * Math.cos(g), y = Oy - 230 * Math.sin(g);
    tbFig_Poly(d, "p" + a[0] + S, [[Ox, Oy], [x, y]], od, "#adb5bd", 2, true);
    tbFig_Lb(d, "p" + a[0] + S, x + 30 * Math.cos(g) + (a[1] === 90 || a[1] === -90 ? 0 : 0), y - 30 * Math.sin(g), L, p, a[0], od, a[1] === 0 ? "start" : a[1] === 180 ? "end" : "middle");
  });
  var mid = function(P, Q){ return [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; }, os = o * pv(p, "sd", 1);
  if (tips["1"] && L.s1 !== undefined) { var m1 = mid([Ox, Oy], tips["1"]); tbFig_Lb(d, "ps1" + S, m1[0], m1[1] + 34, L, p, "s1", os); }
  if (tips["1"] && tips["2"] && L.s2 !== undefined) { var e2 = [tips["1"][0] + tips["2"][0] - Ox, tips["1"][1] + tips["2"][1] - Oy], m2 = mid(tips["1"], e2); tbFig_Lb(d, "ps2" + S, m2[0] + 16, m2[1], L, p, "s2", os, "start"); }
  if (tips["3"] && L.s3 !== undefined) { var m3 = mid([Ox, Oy], tips["3"]); tbFig_Lb(d, "ps3" + S, m3[0] - 16, m3[1] - 20, L, p, "s3", os, "end"); }
  // 角の弧
  ["1", "2", "3"].forEach(function(k, j){
    if (L["g" + k] === undefined || L["g" + k] === null) return;
    var f = tbFig_Num(L["g" + k + "f"], 0), t = tbFig_Num(L["g" + k + "t"], 0), rr = 80 + j * 26, pts = [], q, og = o * pv(p, "g" + k + "d", 1);
    if (k === "1" && flip2) t = -t;
    for (q = 0; q <= 24; q++) { var a = (f + (t - f) * q / 24) * R; pts.push([Ox + rr * Math.cos(a), Oy - rr * Math.sin(a)]); }
    tbFig_Poly(d, "pg" + k + S, pts.slice(0, -2), og, null, 2);
    tbFig_Arr(d, "pg" + k + "a" + S, pts[22][0], pts[22][1], pts[24][0], pts[24][1], og);
    var m = (f + t) / 2 * R; tbFig_Lb(d, "pg" + k + S, Ox + (rr + 34) * Math.cos(m) + 10, Oy - (rr + 34) * Math.sin(m), L, p, "g" + k, og, "start");
  });
  // 回る向き
  if (L.rot) {
    var orr = o * pv(p, "rotd", 1), r0 = 150, mk = function(id, a0, a1){ var pts = [], q; for (q = 0; q <= 20; q++) { var a = (a0 + (a1 - a0) * q / 20) * R; pts.push([Ox + r0 * Math.cos(a), Oy - r0 * Math.sin(a)]); }
      tbFig_Poly(d, id + S, pts.slice(0, -2), orr, "#868e96", 2, true); tbFig_Arr(d, id + "h" + S, pts[18][0], pts[18][1], pts[20][0], pts[20][1], orr, "#868e96"); return pts[10]; };
    var pa = mk("prA", 15, 75), pb = mk("prB", -15, -75);
    tbFig_Lb(d, "pradv" + S, pa[0] + 20, pa[1] - 20, L, p, "adv", orr, "start"); tbFig_Lb(d, "prlag" + S, pb[0] + 20, pb[1] + 24, L, p, "lag", orr, "start");
  }
  // 平行四辺形
  if (L.pg1 !== undefined && L.pg1 !== null) {
    var ab = String(L.pg1ab || "a1,a2").split(",").map(function(s){ return s.trim().replace(/^a/, ""); }), A1 = tips[ab[0]], A2 = tips[ab[1]];
    if (A1 && A2) { var opg = o * pv(p, "pg1d", 1), sx = A1[0] + A2[0] - Ox, sy = A1[1] + A2[1] - Oy;
      tbFig_Poly(d, "ppg1" + S, [A1, [sx, sy]], opg, null, 2, true); tbFig_Poly(d, "ppg2" + S, [A2, [sx, sy]], opg, null, 2, true); }
  }
  // 成分
  if (L.c1 !== undefined && L.c1 !== null) {
    var T = tips[String(L.c1of || "a1").replace(/^a/, "")];
    if (T) { var oc = o * pv(p, "c1d", 1);
      tbFig_Poly(d, "pc1a" + S, [T, [T[0], Oy]], oc, null, 2, true); tbFig_Poly(d, "pc1b" + S, [[Ox, Oy + 4], [T[0], Oy + 4]], oc, "#e67700", 3, true);
      tbFig_Lb(d, "pc1x" + S, (Ox + T[0]) / 2, Oy + 36, L, p, "c1x", oc); tbFig_Lb(d, "pc1y" + S, T[0] + 16, (Oy + T[1]) / 2, L, p, "c1y", oc, "start"); }
  }
  if (L.c2 !== undefined && L.c2 !== null) {
    var T2 = tips[String(L.c2of || "a2").replace(/^a/, "")], st2 = tips[String(L.a2o || "").replace(/^a/, "")] || [Ox, Oy];
    if (T2) { var oc2 = o * pv(p, "c2d", 1);
      tbFig_Poly(d, "pc2a" + S, [T2, [T2[0], st2[1]]], oc2, null, 2, true); tbFig_Poly(d, "pc2b" + S, [st2, [T2[0], st2[1]]], oc2, "#e67700", 3, true);
      tbFig_Lb(d, "pc2x" + S, (st2[0] + T2[0]) / 2, st2[1] + 36, L, p, "c2x", oc2); tbFig_Lb(d, "pc2y" + S, T2[0] + 16, (st2[1] + T2[1]) / 2, L, p, "c2y", oc2, "start"); }
  }
  if (L.tx1 !== undefined && tips["1"]) { tbFig_Poly(d, "ptx1" + S, [[tips["1"][0], Oy], tips["1"]], o, null, 2, true); tbFig_Lb(d, "ptx1" + S, tips["1"][0], Oy + 34, L, p, "tx1", o); }
  if (L.ty1 !== undefined && tips["1"]) { tbFig_Poly(d, "pty1" + S, [[Ox, tips["1"][1]], tips["1"]], o, null, 2, true); tbFig_Lb(d, "pty1" + S, Ox - 14, tips["1"][1], L, p, "ty1", o, "end"); }
}
// 周波数とリアクタンスのグラフ
function tbFig_Xg(d, it, L, p, o){
  if (it.df) L = Object.assign({}, it.df, L);
  var S = it.sfx || "", X0 = it.X0, W = it.W, Y0 = it.Y0, H = it.H;
  tbFig_Arr(d, "xax" + S, X0, Y0, X0 + W + 40, Y0, o); tbFig_Arr(d, "xay" + S, X0, Y0, X0, Y0 - H - 30, o);
  d.text("xo" + S, X0 - 14, Y0 + 24, "0", {o: o, anchor: "end"});
  tbFig_Lb(d, "xax" + S, X0 + W + 40, Y0 + 38, L, p, "ax", o, "end"); tbFig_Lb(d, "xay" + S, X0 - 14, Y0 - H - 20, L, p, "ay", o, "end");
  var ats = {"1": tbFig_Num(L.x1at, 0.35), "2": tbFig_Num(L.x2at, 0.7)}, cols = ["", "#c92a2a", "#1971c2"];
  var hy = function(k, f){ var sh = tbFig_Pick(L, p, "c" + k + "s") || "lin", a = tbFig_Num(L["c" + k + "a"], 0.5), x1 = ats["1"];
    if (sh === "inv") return Math.min(1.05, a * x1 / Math.max(f, 0.02)); if (sh === "flat") return a; return a * f / x1; };
  var top = {"1": 0, "2": 0};
  ["1", "2", "3"].forEach(function(k, i){
    if (L["c" + k] === undefined || L["c" + k] === null) return;
    var pts = [], q, dd = pv(p, "c" + k + "d", 1), sh = tbFig_Pick(L, p, "c" + k + "s") || "lin", f0 = sh === "inv" ? 0.12 : 0;
    for (q = 0; q <= 60 * dd; q++) { var f = f0 + (1 - f0) * q / 60; pts.push([X0 + f * W, Y0 - Math.min(1.05, hy(k, f)) * H * 0.8]); }
    if (pts.length < 2) pts = [[X0, Y0], [X0, Y0]];
    tbFig_Poly(d, "xc" + k + S, pts, o * (dd > 0.01 ? 1 : 0), cols[i], 4);
    var e = pts[pts.length - 1]; tbFig_Lb(d, "xc" + k + S, e[0] + 14, e[1] - 4, L, p, "c" + k, o * (dd > 0.5 ? 1 : 0), "start");
    ["1", "2"].forEach(function(j){ top[j] = Math.max(top[j], Math.min(1.05, hy(k, ats[j]))); });
  });
  ["1", "2"].forEach(function(j){
    if (L["x" + j] === undefined || L["x" + j] === null) return;
    var x = X0 + ats[j] * W, ox = o * pv(p, "x" + j + "d", 1);
    tbFig_Poly(d, "xx" + j + S, [[x, Y0], [x, Y0 - top[j] * H * 0.8]], ox, null, 2, true);
    tbFig_Lb(d, "xx" + j + S, x, Y0 + 34, L, p, "x" + j, ox);
    ["1", "2", "3"].forEach(function(k){
      if (L["c" + k] === undefined || L["c" + k] === null) return;
      var y = Y0 - Math.min(1.05, hy(k, ats[j])) * H * 0.8, oh = ox * pv(p, "hd", 1);
      if (L["h" + k + j] !== undefined) { d.dot("xd" + k + j + S, x, y, {o: oh}); tbFig_Lb(d, "xh" + k + j + S, x + 14, y - 24, L, p, "h" + k + j, oh, "start"); }
    });
  });
}
// ---- 25-1 相互インダクタンス の図（※ textbook/gen/make_section.py が textbook/gen/data/u25_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U25S1K = {
  tc: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[340,230],[760,230],[760,610],[340,610]],"w":70,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"w1r0","pts":[[299,342],[381,318]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r1","pts":[[299,378],[381,354]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r2","pts":[[299,414],[381,390]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r3","pts":[[299,450],[381,426]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r4","pts":[[299,486],[381,462]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r5","pts":[[299,522],[381,498]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l0","pts":[[299,318],[381,342]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l1","pts":[[299,354],[381,378]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l2","pts":[[299,390],[381,414]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l3","pts":[[299,426],[381,450]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l4","pts":[[299,462],[381,486]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l5","pts":[[299,498],[381,522]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"lt1","pts":[[299,316],[130,316]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"lb1","pts":[[299,524],[130,524]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia1","x0":140,"y0":316,"x1":220,"y1":316,"w":4,"o":["i1d"],"need":"i1","sel":"i1e","var":{"top":{"x0":140,"y0":316,"x1":220,"y1":316},"bot":{"x0":140,"y0":524,"x1":220,"y1":524}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[180,286,"middle",[0,-1]]],"vbases":{"top":[[180,286,"middle",[0,-1]]],"bot":[[180,556,"middle",[0,1]]]},"o":["i1d"],"need":"i1","sel":"i1e","var":{"top":{"x":164,"y":274,"anc":"middle"},"bot":{"x":164,"y":568,"anc":"middle"}},"dflt":"top","vis":[],"t":"F","x":180,"y":286,"anc":"middle"},{"f":"ar","id":"ea1","x0":120,"y0":520,"x1":120,"y1":320,"w":3,"o":["e1d"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[104,420,"end",[-1,0]]],"o":["e1d"],"need":"e1","vis":[],"t":"F","x":104,"y":420,"anc":"end"},{"f":"lb","id":"n1t","k":"n1","bases":[[285,270,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":260.96,"y":209.19,"anc":"end"},{"f":"lb","id":"l1t","k":"l1","bases":[[285,570,"end",[-1,1]]],"need":"l1","vis":[],"t":"F","x":285,"y":570,"anc":"end"},{"f":"ln","id":"w2r0","pts":[[719,342],[801,318]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r1","pts":[[719,378],[801,354]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r2","pts":[[719,414],[801,390]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r3","pts":[[719,450],[801,426]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r4","pts":[[719,486],[801,462]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r5","pts":[[719,522],[801,498]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l0","pts":[[719,318],[801,342]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l1","pts":[[719,354],[801,378]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l2","pts":[[719,390],[801,414]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l3","pts":[[719,426],[801,450]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l4","pts":[[719,462],[801,486]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l5","pts":[[719,498],[801,522]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"lt2","pts":[[801,316],[970,316]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"lb2","pts":[[801,524],[970,524]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia2","x0":960,"y0":316,"x1":880,"y1":316,"w":4,"o":["i2d"],"need":"i2","sel":"i2e","var":{"top":{"x0":960,"y0":316,"x1":880,"y1":316},"bot":{"x0":960,"y0":524,"x1":880,"y1":524}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i2t","k":"i2","bases":[[920,286,"middle",[0,-1]]],"vbases":{"top":[[920,286,"middle",[0,-1]]],"bot":[[920,556,"middle",[0,1]]]},"o":["i2d"],"need":"i2","sel":"i2e","var":{"top":{"x":920,"y":274,"anc":"middle"},"bot":{"x":920,"y":568,"anc":"middle"}},"dflt":"top","vis":[],"t":"F","x":920,"y":286,"anc":"middle"},{"f":"ar","id":"ea2","x0":980,"y0":520,"x1":980,"y1":320,"w":3,"o":["e2d"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[996,420,"start",[1,0]]],"o":["e2d"],"need":"e2","vis":[],"t":"F","x":996,"y":420,"anc":"start"},{"f":"lb","id":"n2t","k":"n2","bases":[[815,270,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":839.04,"y":209.19,"anc":"start"},{"f":"lb","id":"l2t","k":"l2","bases":[[815,570,"start",[1,1]]],"need":"l2","vis":[],"t":"F","x":815,"y":570,"anc":"start"},{"f":"ln","id":"ph1","pts":[[354,244],[746,244],[746,596],[354,596]],"dash":1,"w":4,"close":1,"o":["phi1d"],"need":"phi1","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh10","x0":490,"y0":244,"x1":530,"y1":244,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":490,"y0":244,"x1":530,"y1":244},"ccw":{"x0":530,"y0":244,"x1":490,"y1":244}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh11","x0":746,"y0":400,"x1":746,"y1":440,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":746,"y0":400,"x1":746,"y1":440},"ccw":{"x0":746,"y0":440,"x1":746,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh12","x0":530,"y0":596,"x1":490,"y1":596,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":530,"y0":596,"x1":490,"y1":596},"ccw":{"x0":490,"y0":596,"x1":530,"y1":596}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh13","x0":354,"y0":440,"x1":354,"y1":400,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":354,"y0":440,"x1":354,"y1":400},"ccw":{"x0":354,"y0":400,"x1":354,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi1t","k":"phi1","bases":[[460,161,"middle",[0,-1]]],"o":["phi1d"],"need":"phi1","vis":[],"t":"F","x":460,"y":155,"anc":"middle"},{"f":"ln","id":"ph2","pts":[[326,216],[774,216],[774,624],[326,624]],"dash":1,"w":4,"close":1,"o":["phi2d"],"need":"phi2","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh20","x0":570,"y0":216,"x1":610,"y1":216,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":570,"y0":216,"x1":610,"y1":216},"ccw":{"x0":610,"y0":216,"x1":570,"y1":216}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh21","x0":774,"y0":400,"x1":774,"y1":440,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":774,"y0":400,"x1":774,"y1":440},"ccw":{"x0":774,"y0":440,"x1":774,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh22","x0":610,"y0":624,"x1":570,"y1":624,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":610,"y0":624,"x1":570,"y1":624},"ccw":{"x0":570,"y0":624,"x1":610,"y1":624}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh23","x0":326,"y0":440,"x1":326,"y1":400,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":326,"y0":440,"x1":326,"y1":400},"ccw":{"x0":326,"y0":400,"x1":326,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi2t","k":"phi2","bases":[[640,161,"middle",[0,-1]]],"o":["phi2d"],"need":"phi2","vis":[],"t":"F","x":640,"y":155,"anc":"middle"},{"f":"lb","id":"mt","k":"m","bases":[[550,400,"middle",[0,-1]]],"need":"m","vis":[],"t":"F","x":550,"y":400,"anc":"middle"},{"f":"lb","id":"kct","k":"kc","bases":[[550,460,"middle",[0,1]]],"need":"kc","vis":[],"t":"F","x":550,"y":460,"anc":"middle"},{"f":"ln","id":"lk0","pts":[[320.9,501.25],[310.91,499.56],[301.18,497.19],[291.78,494.15],[282.8,490.47],[274.31,486.18],[266.4,481.31],[259.12,475.91],[252.54,470.03],[246.71,463.72],[241.7,457.03],[237.54,450.01],[234.26,442.74],[231.9,435.27],[230.48,427.67],[230,420],[230.48,412.33],[231.9,404.73],[234.26,397.26],[237.54,389.99],[241.7,382.97],[246.71,376.28],[252.54,369.97],[259.12,364.09],[266.4,358.69],[274.31,353.82],[282.8,349.53],[291.78,345.85],[301.18,342.81],[310.91,340.44],[320.9,338.75]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"ln","id":"lk1","pts":[[313.95,530.79],[300.33,528.5],[287.06,525.26],[274.24,521.11],[262,516.09],[250.43,510.24],[239.63,503.6],[229.7,496.24],[220.73,488.23],[212.79,479.62],[205.96,470.49],[200.28,460.93],[195.81,451.01],[192.59,440.82],[190.65,430.46],[190,420],[190.65,409.54],[192.59,399.18],[195.81,388.99],[200.28,379.07],[205.96,369.51],[212.79,360.38],[220.73,351.77],[229.7,343.76],[239.63,336.4],[250.43,329.76],[262,323.91],[274.24,318.89],[287.06,314.74],[300.33,311.5],[313.95,309.21]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"lb","id":"lkt","k":"lk","bases":[[170,280,"end",[-1,-1]]],"o":["lkd"],"need":"lk","vis":[],"t":"F","x":170,"y":280,"anc":"end"},{"f":"lb","id":"mut","k":"mu","bases":[[550,679,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":550,"y":679,"anc":"middle"},{"f":"ln","id":"ll","pts":[[340,230],[760,230],[760,610],[340,610]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[670,545,"middle",[0,-1]]],"need":"l","vis":[],"t":"F","x":670,"y":545,"anc":"middle"},{"f":"ln","id":"sq","pts":[[524,196],[576,196],[590,264],[538,264]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,161,"middle",[0,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":550,"y":161,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU25s1tc(d, p, L){ tbFig_Draw(d, p, L, U25S1K.tc); }
// ---- 25-2 相互インダクタンスの式 の図（※ textbook/gen/make_section.py が textbook/gen/data/u25_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U25S2K = {
  tc: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[340,230],[760,230],[760,610],[340,610]],"w":70,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"w1r0","pts":[[299,342],[381,318]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r1","pts":[[299,378],[381,354]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r2","pts":[[299,414],[381,390]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r3","pts":[[299,450],[381,426]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r4","pts":[[299,486],[381,462]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r5","pts":[[299,522],[381,498]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l0","pts":[[299,318],[381,342]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l1","pts":[[299,354],[381,378]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l2","pts":[[299,390],[381,414]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l3","pts":[[299,426],[381,450]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l4","pts":[[299,462],[381,486]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l5","pts":[[299,498],[381,522]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"lt1","pts":[[299,316],[130,316]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"lb1","pts":[[299,524],[130,524]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia1","x0":140,"y0":316,"x1":220,"y1":316,"w":4,"o":["i1d"],"need":"i1","sel":"i1e","var":{"top":{"x0":140,"y0":316,"x1":220,"y1":316},"bot":{"x0":140,"y0":524,"x1":220,"y1":524}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[180,286,"middle",[0,-1]]],"vbases":{"top":[[180,286,"middle",[0,-1]]],"bot":[[180,556,"middle",[0,1]]]},"o":["i1d"],"need":"i1","sel":"i1e","var":{"top":{"x":180,"y":280,"anc":"middle"},"bot":{"x":180,"y":562,"anc":"middle"}},"dflt":"top","vis":[],"t":"F","x":180,"y":286,"anc":"middle"},{"f":"ar","id":"ea1","x0":120,"y0":520,"x1":120,"y1":320,"w":3,"o":["e1d"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[104,420,"end",[-1,0]]],"o":["e1d"],"need":"e1","vis":[],"t":"F","x":104,"y":420,"anc":"end"},{"f":"lb","id":"n1t","k":"n1","bases":[[285,270,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":299.14,"y":227.57,"anc":"end"},{"f":"lb","id":"l1t","k":"l1","bases":[[285,570,"end",[-1,1]]],"need":"l1","vis":[],"t":"F","x":285,"y":570,"anc":"end"},{"f":"ln","id":"w2r0","pts":[[719,342],[801,318]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r1","pts":[[719,378],[801,354]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r2","pts":[[719,414],[801,390]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r3","pts":[[719,450],[801,426]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r4","pts":[[719,486],[801,462]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r5","pts":[[719,522],[801,498]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l0","pts":[[719,318],[801,342]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l1","pts":[[719,354],[801,378]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l2","pts":[[719,390],[801,414]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l3","pts":[[719,426],[801,450]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l4","pts":[[719,462],[801,486]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l5","pts":[[719,498],[801,522]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"lt2","pts":[[801,316],[970,316]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"lb2","pts":[[801,524],[970,524]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia2","x0":960,"y0":316,"x1":880,"y1":316,"w":4,"o":["i2d"],"need":"i2","sel":"i2e","var":{"top":{"x0":960,"y0":316,"x1":880,"y1":316},"bot":{"x0":960,"y0":524,"x1":880,"y1":524}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i2t","k":"i2","bases":[[920,286,"middle",[0,-1]]],"vbases":{"top":[[920,286,"middle",[0,-1]]],"bot":[[920,556,"middle",[0,1]]]},"o":["i2d"],"need":"i2","sel":"i2e","var":{"top":{"x":920,"y":286,"anc":"middle"},"bot":{"x":920,"y":556,"anc":"middle"}},"dflt":"top","vis":[],"t":"F","x":920,"y":286,"anc":"middle"},{"f":"ar","id":"ea2","x0":980,"y0":520,"x1":980,"y1":320,"w":3,"o":["e2d"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[996,420,"start",[1,0]]],"o":["e2d"],"need":"e2","vis":[],"t":"F","x":996,"y":420,"anc":"start"},{"f":"lb","id":"n2t","k":"n2","bases":[[815,270,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":815,"y":270,"anc":"start"},{"f":"lb","id":"l2t","k":"l2","bases":[[815,570,"start",[1,1]]],"need":"l2","vis":[],"t":"F","x":815,"y":570,"anc":"start"},{"f":"ln","id":"ph1","pts":[[354,244],[746,244],[746,596],[354,596]],"dash":1,"w":4,"close":1,"o":["phi1d"],"need":"phi1","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh10","x0":490,"y0":244,"x1":530,"y1":244,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":490,"y0":244,"x1":530,"y1":244},"ccw":{"x0":530,"y0":244,"x1":490,"y1":244}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh11","x0":746,"y0":400,"x1":746,"y1":440,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":746,"y0":400,"x1":746,"y1":440},"ccw":{"x0":746,"y0":440,"x1":746,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh12","x0":530,"y0":596,"x1":490,"y1":596,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":530,"y0":596,"x1":490,"y1":596},"ccw":{"x0":490,"y0":596,"x1":530,"y1":596}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh13","x0":354,"y0":440,"x1":354,"y1":400,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":354,"y0":440,"x1":354,"y1":400},"ccw":{"x0":354,"y0":400,"x1":354,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi1t","k":"phi1","bases":[[460,161,"middle",[0,-1]]],"o":["phi1d"],"need":"phi1","vis":[],"t":"F","x":460,"y":161,"anc":"middle"},{"f":"ln","id":"ph2","pts":[[326,216],[774,216],[774,624],[326,624]],"dash":1,"w":4,"close":1,"o":["phi2d"],"need":"phi2","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh20","x0":570,"y0":216,"x1":610,"y1":216,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":570,"y0":216,"x1":610,"y1":216},"ccw":{"x0":610,"y0":216,"x1":570,"y1":216}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh21","x0":774,"y0":400,"x1":774,"y1":440,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":774,"y0":400,"x1":774,"y1":440},"ccw":{"x0":774,"y0":440,"x1":774,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh22","x0":610,"y0":624,"x1":570,"y1":624,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":610,"y0":624,"x1":570,"y1":624},"ccw":{"x0":570,"y0":624,"x1":610,"y1":624}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh23","x0":326,"y0":440,"x1":326,"y1":400,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":326,"y0":440,"x1":326,"y1":400},"ccw":{"x0":326,"y0":400,"x1":326,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi2t","k":"phi2","bases":[[640,161,"middle",[0,-1]]],"o":["phi2d"],"need":"phi2","vis":[],"t":"F","x":640,"y":161,"anc":"middle"},{"f":"lb","id":"mt","k":"m","bases":[[550,400,"middle",[0,-1]]],"need":"m","vis":[],"t":"F","x":550,"y":400,"anc":"middle"},{"f":"lb","id":"kct","k":"kc","bases":[[550,460,"middle",[0,1]]],"need":"kc","vis":[],"t":"F","x":550,"y":460,"anc":"middle"},{"f":"ln","id":"lk0","pts":[[320.9,501.25],[310.91,499.56],[301.18,497.19],[291.78,494.15],[282.8,490.47],[274.31,486.18],[266.4,481.31],[259.12,475.91],[252.54,470.03],[246.71,463.72],[241.7,457.03],[237.54,450.01],[234.26,442.74],[231.9,435.27],[230.48,427.67],[230,420],[230.48,412.33],[231.9,404.73],[234.26,397.26],[237.54,389.99],[241.7,382.97],[246.71,376.28],[252.54,369.97],[259.12,364.09],[266.4,358.69],[274.31,353.82],[282.8,349.53],[291.78,345.85],[301.18,342.81],[310.91,340.44],[320.9,338.75]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"ln","id":"lk1","pts":[[313.95,530.79],[300.33,528.5],[287.06,525.26],[274.24,521.11],[262,516.09],[250.43,510.24],[239.63,503.6],[229.7,496.24],[220.73,488.23],[212.79,479.62],[205.96,470.49],[200.28,460.93],[195.81,451.01],[192.59,440.82],[190.65,430.46],[190,420],[190.65,409.54],[192.59,399.18],[195.81,388.99],[200.28,379.07],[205.96,369.51],[212.79,360.38],[220.73,351.77],[229.7,343.76],[239.63,336.4],[250.43,329.76],[262,323.91],[274.24,318.89],[287.06,314.74],[300.33,311.5],[313.95,309.21]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"lb","id":"lkt","k":"lk","bases":[[170,280,"end",[-1,-1]]],"o":["lkd"],"need":"lk","vis":[],"t":"F","x":170,"y":280,"anc":"end"},{"f":"lb","id":"mut","k":"mu","bases":[[550,679,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":550,"y":679,"anc":"middle"},{"f":"ln","id":"ll","pts":[[340,230],[760,230],[760,610],[340,610]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[670,545,"middle",[0,-1]]],"need":"l","vis":[],"t":"F","x":654,"y":545,"anc":"middle"},{"f":"ln","id":"sq","pts":[[524,196],[576,196],[590,264],[538,264]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,161,"middle",[0,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":550,"y":101,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU25s2tc(d, p, L){ tbFig_Draw(d, p, L, U25S2K.tc); }
// ---- 25-3 結合係数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u25_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U25S3K = {
  tc: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[340,230],[760,230],[760,610],[340,610]],"w":70,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"w1r0","pts":[[299,342],[381,318]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r1","pts":[[299,378],[381,354]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r2","pts":[[299,414],[381,390]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r3","pts":[[299,450],[381,426]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r4","pts":[[299,486],[381,462]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r5","pts":[[299,522],[381,498]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l0","pts":[[299,318],[381,342]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l1","pts":[[299,354],[381,378]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l2","pts":[[299,390],[381,414]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l3","pts":[[299,426],[381,450]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l4","pts":[[299,462],[381,486]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l5","pts":[[299,498],[381,522]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"lt1","pts":[[299,316],[130,316]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"lb1","pts":[[299,524],[130,524]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia1","x0":140,"y0":316,"x1":220,"y1":316,"w":4,"o":["i1d"],"need":"i1","sel":"i1e","var":{"top":{"x0":140,"y0":316,"x1":220,"y1":316},"bot":{"x0":140,"y0":524,"x1":220,"y1":524}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[180,286,"middle",[0,-1]]],"vbases":{"top":[[180,286,"middle",[0,-1]]],"bot":[[180,556,"middle",[0,1]]]},"o":["i1d"],"need":"i1","sel":"i1e","var":{"top":{"x":180,"y":274,"anc":"middle"},"bot":{"x":180,"y":568,"anc":"middle"}},"dflt":"top","vis":[],"t":"F","x":180,"y":286,"anc":"middle"},{"f":"ar","id":"ea1","x0":120,"y0":520,"x1":120,"y1":320,"w":3,"o":["e1d"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[104,420,"end",[-1,0]]],"o":["e1d"],"need":"e1","vis":[],"t":"F","x":104,"y":420,"anc":"end"},{"f":"lb","id":"n1t","k":"n1","bases":[[285,270,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":285,"y":270,"anc":"end"},{"f":"lb","id":"l1t","k":"l1","bases":[[285,570,"end",[-1,1]]],"need":"l1","vis":[],"t":"F","x":260.96,"y":630.81,"anc":"end"},{"f":"ln","id":"w2r0","pts":[[719,342],[801,318]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r1","pts":[[719,378],[801,354]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r2","pts":[[719,414],[801,390]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r3","pts":[[719,450],[801,426]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r4","pts":[[719,486],[801,462]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r5","pts":[[719,522],[801,498]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l0","pts":[[719,318],[801,342]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l1","pts":[[719,354],[801,378]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l2","pts":[[719,390],[801,414]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l3","pts":[[719,426],[801,450]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l4","pts":[[719,462],[801,486]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l5","pts":[[719,498],[801,522]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"lt2","pts":[[801,316],[970,316]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"lb2","pts":[[801,524],[970,524]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia2","x0":960,"y0":316,"x1":880,"y1":316,"w":4,"o":["i2d"],"need":"i2","sel":"i2e","var":{"top":{"x0":960,"y0":316,"x1":880,"y1":316},"bot":{"x0":960,"y0":524,"x1":880,"y1":524}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i2t","k":"i2","bases":[[920,286,"middle",[0,-1]]],"vbases":{"top":[[920,286,"middle",[0,-1]]],"bot":[[920,556,"middle",[0,1]]]},"o":["i2d"],"need":"i2","sel":"i2e","var":{"top":{"x":920,"y":286,"anc":"middle"},"bot":{"x":920,"y":556,"anc":"middle"}},"dflt":"top","vis":[],"t":"F","x":920,"y":286,"anc":"middle"},{"f":"ar","id":"ea2","x0":980,"y0":520,"x1":980,"y1":320,"w":3,"o":["e2d"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[996,420,"start",[1,0]]],"o":["e2d"],"need":"e2","vis":[],"t":"F","x":996,"y":420,"anc":"start"},{"f":"lb","id":"n2t","k":"n2","bases":[[815,270,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":815,"y":270,"anc":"start"},{"f":"lb","id":"l2t","k":"l2","bases":[[815,570,"start",[1,1]]],"need":"l2","vis":[],"t":"F","x":815,"y":570,"anc":"start"},{"f":"ln","id":"ph1","pts":[[354,244],[746,244],[746,596],[354,596]],"dash":1,"w":4,"close":1,"o":["phi1d"],"need":"phi1","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh10","x0":490,"y0":244,"x1":530,"y1":244,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":490,"y0":244,"x1":530,"y1":244},"ccw":{"x0":530,"y0":244,"x1":490,"y1":244}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh11","x0":746,"y0":400,"x1":746,"y1":440,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":746,"y0":400,"x1":746,"y1":440},"ccw":{"x0":746,"y0":440,"x1":746,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh12","x0":530,"y0":596,"x1":490,"y1":596,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":530,"y0":596,"x1":490,"y1":596},"ccw":{"x0":490,"y0":596,"x1":530,"y1":596}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh13","x0":354,"y0":440,"x1":354,"y1":400,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":354,"y0":440,"x1":354,"y1":400},"ccw":{"x0":354,"y0":400,"x1":354,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi1t","k":"phi1","bases":[[460,161,"middle",[0,-1]]],"o":["phi1d"],"need":"phi1","vis":[],"t":"F","x":460,"y":155,"anc":"middle"},{"f":"ln","id":"ph2","pts":[[326,216],[774,216],[774,624],[326,624]],"dash":1,"w":4,"close":1,"o":["phi2d"],"need":"phi2","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh20","x0":570,"y0":216,"x1":610,"y1":216,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":570,"y0":216,"x1":610,"y1":216},"ccw":{"x0":610,"y0":216,"x1":570,"y1":216}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh21","x0":774,"y0":400,"x1":774,"y1":440,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":774,"y0":400,"x1":774,"y1":440},"ccw":{"x0":774,"y0":440,"x1":774,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh22","x0":610,"y0":624,"x1":570,"y1":624,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":610,"y0":624,"x1":570,"y1":624},"ccw":{"x0":570,"y0":624,"x1":610,"y1":624}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh23","x0":326,"y0":440,"x1":326,"y1":400,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":326,"y0":440,"x1":326,"y1":400},"ccw":{"x0":326,"y0":400,"x1":326,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi2t","k":"phi2","bases":[[640,161,"middle",[0,-1]]],"o":["phi2d"],"need":"phi2","vis":[],"t":"F","x":640,"y":161,"anc":"middle"},{"f":"lb","id":"mt","k":"m","bases":[[550,400,"middle",[0,-1]]],"need":"m","vis":[],"t":"F","x":550,"y":400,"anc":"middle"},{"f":"lb","id":"kct","k":"kc","bases":[[550,460,"middle",[0,1]]],"need":"kc","vis":[],"t":"F","x":550,"y":460,"anc":"middle"},{"f":"ln","id":"lk0","pts":[[320.9,501.25],[310.91,499.56],[301.18,497.19],[291.78,494.15],[282.8,490.47],[274.31,486.18],[266.4,481.31],[259.12,475.91],[252.54,470.03],[246.71,463.72],[241.7,457.03],[237.54,450.01],[234.26,442.74],[231.9,435.27],[230.48,427.67],[230,420],[230.48,412.33],[231.9,404.73],[234.26,397.26],[237.54,389.99],[241.7,382.97],[246.71,376.28],[252.54,369.97],[259.12,364.09],[266.4,358.69],[274.31,353.82],[282.8,349.53],[291.78,345.85],[301.18,342.81],[310.91,340.44],[320.9,338.75]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"ln","id":"lk1","pts":[[313.95,530.79],[300.33,528.5],[287.06,525.26],[274.24,521.11],[262,516.09],[250.43,510.24],[239.63,503.6],[229.7,496.24],[220.73,488.23],[212.79,479.62],[205.96,470.49],[200.28,460.93],[195.81,451.01],[192.59,440.82],[190.65,430.46],[190,420],[190.65,409.54],[192.59,399.18],[195.81,388.99],[200.28,379.07],[205.96,369.51],[212.79,360.38],[220.73,351.77],[229.7,343.76],[239.63,336.4],[250.43,329.76],[262,323.91],[274.24,318.89],[287.06,314.74],[300.33,311.5],[313.95,309.21]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"lb","id":"lkt","k":"lk","bases":[[170,280,"end",[-1,-1]]],"o":["lkd"],"need":"lk","vis":[],"t":"F","x":150.2,"y":271.51,"anc":"end"},{"f":"lb","id":"mut","k":"mu","bases":[[550,679,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":550,"y":679,"anc":"middle"},{"f":"ln","id":"ll","pts":[[340,230],[760,230],[760,610],[340,610]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[670,545,"middle",[0,-1]]],"need":"l","vis":[],"t":"F","x":670,"y":545,"anc":"middle"},{"f":"ln","id":"sq","pts":[[524,196],[576,196],[590,264],[538,264]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,161,"middle",[0,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":550,"y":161,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU25s3tc(d, p, L){ tbFig_Draw(d, p, L, U25S3K.tc); }
// ---- 25-4 和動と差動 の図（※ textbook/gen/make_section.py が textbook/gen/data/u25_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U25S4K = {
  tc: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[340,230],[760,230],[760,610],[340,610]],"w":70,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"w1r0","pts":[[299,342],[381,318]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r1","pts":[[299,378],[381,354]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r2","pts":[[299,414],[381,390]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r3","pts":[[299,450],[381,426]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r4","pts":[[299,486],[381,462]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r5","pts":[[299,522],[381,498]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l0","pts":[[299,318],[381,342]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l1","pts":[[299,354],[381,378]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l2","pts":[[299,390],[381,414]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l3","pts":[[299,426],[381,450]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l4","pts":[[299,462],[381,486]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l5","pts":[[299,498],[381,522]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"lb","id":"n1t","k":"n1","bases":[[285,270,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":285,"y":270,"anc":"end"},{"f":"lb","id":"l1t","k":"l1","bases":[[285,570,"end",[-1,1]]],"need":"l1","vis":[],"t":"F","x":200.15,"y":654.85,"anc":"end"},{"f":"ln","id":"w2r0","pts":[[719,342],[801,318]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r1","pts":[[719,378],[801,354]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r2","pts":[[719,414],[801,390]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r3","pts":[[719,450],[801,426]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r4","pts":[[719,486],[801,462]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r5","pts":[[719,522],[801,498]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l0","pts":[[719,318],[801,342]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l1","pts":[[719,354],[801,378]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l2","pts":[[719,390],[801,414]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l3","pts":[[719,426],[801,450]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l4","pts":[[719,462],[801,486]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l5","pts":[[719,498],[801,522]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"lb","id":"n2t","k":"n2","bases":[[815,270,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":815,"y":270,"anc":"start"},{"f":"lb","id":"l2t","k":"l2","bases":[[815,570,"start",[1,1]]],"need":"l2","vis":[],"t":"F","x":899.85,"y":654.85,"anc":"start"},{"f":"ln","id":"ph1","pts":[[354,244],[746,244],[746,596],[354,596]],"dash":1,"w":4,"close":1,"o":["phi1d"],"need":"phi1","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh10","x0":490,"y0":244,"x1":530,"y1":244,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":490,"y0":244,"x1":530,"y1":244},"ccw":{"x0":530,"y0":244,"x1":490,"y1":244}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh11","x0":746,"y0":400,"x1":746,"y1":440,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":746,"y0":400,"x1":746,"y1":440},"ccw":{"x0":746,"y0":440,"x1":746,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh12","x0":530,"y0":596,"x1":490,"y1":596,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":530,"y0":596,"x1":490,"y1":596},"ccw":{"x0":490,"y0":596,"x1":530,"y1":596}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh13","x0":354,"y0":440,"x1":354,"y1":400,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":354,"y0":440,"x1":354,"y1":400},"ccw":{"x0":354,"y0":400,"x1":354,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi1t","k":"phi1","bases":[[460,161,"middle",[0,-1]]],"o":["phi1d"],"need":"phi1","vis":[],"t":"F","x":460,"y":155,"anc":"middle"},{"f":"ln","id":"ph2","pts":[[326,216],[774,216],[774,624],[326,624]],"dash":1,"w":4,"close":1,"o":["phi2d"],"need":"phi2","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh20","x0":570,"y0":216,"x1":610,"y1":216,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":570,"y0":216,"x1":610,"y1":216},"ccw":{"x0":610,"y0":216,"x1":570,"y1":216}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh21","x0":774,"y0":400,"x1":774,"y1":440,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":774,"y0":400,"x1":774,"y1":440},"ccw":{"x0":774,"y0":440,"x1":774,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh22","x0":610,"y0":624,"x1":570,"y1":624,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":610,"y0":624,"x1":570,"y1":624},"ccw":{"x0":570,"y0":624,"x1":610,"y1":624}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh23","x0":326,"y0":440,"x1":326,"y1":400,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":326,"y0":440,"x1":326,"y1":400},"ccw":{"x0":326,"y0":400,"x1":326,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi2t","k":"phi2","bases":[[640,161,"middle",[0,-1]]],"o":["phi2d"],"need":"phi2","vis":[],"t":"F","x":640,"y":155,"anc":"middle"},{"f":"lb","id":"mt","k":"m","bases":[[550,400,"middle",[0,-1]]],"need":"m","vis":[],"t":"F","x":550,"y":400,"anc":"middle"},{"f":"lb","id":"kct","k":"kc","bases":[[550,460,"middle",[0,1]]],"need":"kc","vis":[],"t":"F","x":550,"y":460,"anc":"middle"},{"f":"ln","id":"lk0","pts":[[320.9,501.25],[310.91,499.56],[301.18,497.19],[291.78,494.15],[282.8,490.47],[274.31,486.18],[266.4,481.31],[259.12,475.91],[252.54,470.03],[246.71,463.72],[241.7,457.03],[237.54,450.01],[234.26,442.74],[231.9,435.27],[230.48,427.67],[230,420],[230.48,412.33],[231.9,404.73],[234.26,397.26],[237.54,389.99],[241.7,382.97],[246.71,376.28],[252.54,369.97],[259.12,364.09],[266.4,358.69],[274.31,353.82],[282.8,349.53],[291.78,345.85],[301.18,342.81],[310.91,340.44],[320.9,338.75]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"ln","id":"lk1","pts":[[313.95,530.79],[300.33,528.5],[287.06,525.26],[274.24,521.11],[262,516.09],[250.43,510.24],[239.63,503.6],[229.7,496.24],[220.73,488.23],[212.79,479.62],[205.96,470.49],[200.28,460.93],[195.81,451.01],[192.59,440.82],[190.65,430.46],[190,420],[190.65,409.54],[192.59,399.18],[195.81,388.99],[200.28,379.07],[205.96,369.51],[212.79,360.38],[220.73,351.77],[229.7,343.76],[239.63,336.4],[250.43,329.76],[262,323.91],[274.24,318.89],[287.06,314.74],[300.33,311.5],[313.95,309.21]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"lb","id":"lkt","k":"lk","bases":[[170,280,"end",[-1,-1]]],"o":["lkd"],"need":"lk","vis":[],"t":"F","x":170,"y":280,"anc":"end"},{"f":"lb","id":"mut","k":"mu","bases":[[550,679,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":550,"y":679,"anc":"middle"},{"f":"ln","id":"ll","pts":[[340,230],[760,230],[760,610],[340,610]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[670,545,"middle",[0,-1]]],"need":"l","vis":[],"t":"F","x":670,"y":545,"anc":"middle"},{"f":"ln","id":"sq","pts":[[524,196],[576,196],[590,264],[538,264]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,161,"middle",[0,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":550,"y":161,"anc":"middle"},{"f":"ln","id":"s1t","pts":[[299,316],[140,316]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tma","cx":134,"cy":316,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[118,316,"end",[-1,0]]],"need":"a","vis":[],"t":"F","x":118,"y":316,"anc":"end"},{"f":"ln","id":"s1b","pts":[[299,524],[220,524],[220,715],[880,715]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"s2a","pts":[[880,715],[880,524],[801,524]],"w":3,"sel":"j2","var":{"bot":{"pts":[[880,715],[880,524],[801,524]]},"top":{"pts":[[880,715],[880,316],[801,316]]}},"dflt":"bot","vis":[],"t":"F"},{"f":"ln","id":"s2b","pts":[[801,316],[960,316]],"w":3,"sel":"j2","var":{"bot":{"pts":[[801,316],[960,316]]},"top":{"pts":[[801,524],[960,524]]}},"dflt":"bot","vis":[],"t":"F"},{"f":"c","id":"tmb","cx":966,"cy":316,"r":6,"fill":"w","sel":"j2","var":{"bot":{"cx":966,"cy":316},"top":{"cx":966,"cy":524}},"dflt":"bot","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[982,316,"start",[1,0]]],"vbases":{"bot":[[982,316,"start",[1,0]]],"top":[[982,524,"start",[1,0]]]},"need":"b","sel":"j2","var":{"bot":{"x":982,"y":316,"anc":"start"},"top":{"x":982,"y":524,"anc":"start"}},"dflt":"bot","vis":[],"t":"F","x":982,"y":316,"anc":"start"},{"f":"ar","id":"ia","x0":150,"y0":316,"x1":230,"y1":316,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[190,286,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":190,"y":266,"anc":"middle"},{"f":"lb","id":"ltt","k":"lt","bases":[[550,761,"middle",[0,1]],[990,420,"start",[1,0]]],"need":"lt","vis":[],"t":"F","x":550,"y":761,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU25s4tc(d, p, L){ tbFig_Draw(d, p, L, U25S4K.tc); }
// ---- 25-5 磁気エネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u25_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U25S5K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU25s5co(d, p, L){ tbFig_Draw(d, p, L, U25S5K.co); }
var KINDS = {u25s1tc: tbU25s1tc, u25s2tc: tbU25s2tc, u25s3tc: tbU25s3tc, u25s4tc: tbU25s4tc, u25s5co: tbU25s5co};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 25-1 の図は電流が流れないので載せない,
  // 25-2 の図は電流が流れないので載せない,
  // 25-3 の図は電流が流れないので載せない,
  // 25-4 の図は電流が流れないので載せない,
  // 25-5 の図は電流が流れないので載せない
};

// 25-1 相互インダクタンス の練習（※ textbook/gen/make_section.py が textbook/gen/data/u25_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU25s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU25s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU25s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU25s1_par(a, b){ return a * b / (a + b); }
function tbU25s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU25s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU25s1_Qe2(r){
  var gcd = tbU25s1_gcd, ratio = tbU25s1_ratio, par = tbU25s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mm = pick(r, [0.05,0.1,0.2,0.4,0.5,1,2]);
    var di = pick(r, [0.5,1,2,3,4,5,10]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var A = (mm * di * t);
    var B = (mm * di);
    var C = (di / t);
    var D = (mm * t / di);
    if (!(di != t && nice(mm * di / t) && mm * di / t >= 1 && mm * di / t <= 1000 && nice(A) && nice(B) && nice(C) && nice(D))) continue;
    var ok = (mm * di / t);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU25s1_three(ok, [{x: (A), why: "時間で割るところを掛けた"}, {x: (B), why: "時間で割っていない"}, {x: (C), why: "相互インダクタンスを掛けていない"}, {x: (D), why: "割る順が逆"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u25s1e2", text: "相互インダクタンス $" + fmt(mm) + "\\,\\mathrm{H}$ の2つのコイルがある。一次側の電流が $" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(di) + "\\,\\mathrm{A}$ 変わった。二次側に生じる誘導起電力の大きさは何 V か。", fig: {kind: "u25s1tc", L: tbU25s1_fig({"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}","i1e":"top","phi1":"","phi1a":"ccw"}, [["i1", "Δ{I}_1=" + fmt(di) + " A"], ["e2", "{e}_2"], ["m", "{M}=" + fmt(mm) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["大きさなので、$e_2 = M \\dfrac{\\Delta I_1}{\\Delta t}$", "$e_2 = " + fmt(mm) + " \\times \\dfrac{" + fmt(di) + "}{" + fmt(t) + "} = " + qv(ok, "V") + "$"], chk: {form: "u25s1e2", p: {mm: mm, di: di, t: t}}};
  }
  throw new Error("u25s1e2：条件に合う数字が見つからない");
}
function tbU25s1_Qmm(r){
  var gcd = tbU25s1_gcd, ratio = tbU25s1_ratio, par = tbU25s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mm = pick(r, [0.05,0.1,0.2,0.4,0.5,1,2]);
    var di = pick(r, [1,2,4,5,10]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var E = (Math.round((mm * di / t) * 1000) / 1000);
    var A = (E * di / t);
    var B = (E * t);
    var C = (di / (E * t));
    if (!(nice(mm * di / t) && E >= 1 && E <= 1000 && nice(A) && nice(B) && nice(C) && C >= 0.001 && distinct([mm, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(mm) + "\\,\\mathrm{H}$", v: fmt(mm)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "電流の変化の割合で割るところを掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "電流の変化で割っていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "割る順が逆"}]);
    return {form: "u25s1mm", text: "2つのコイルの一次側の電流が $" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(di) + "\\,\\mathrm{A}$ 変わり、二次側に大きさ $" + fmt(E) + "\\,\\mathrm{V}$ の誘導起電力が生じた。相互インダクタンスは何 H か。", fig: {kind: "u25s1tc", L: tbU25s1_fig({"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}","i1e":"top","phi1":"","phi1a":"ccw"}, [["i1", "Δ{I}_1=" + fmt(di) + " A"], ["e2", "{e}_2=" + fmt(E) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e_2 = M \\dfrac{\\Delta I_1}{\\Delta t}$ より $M = \\dfrac{e_2 \\Delta t}{\\Delta I_1}$", "$M = \\dfrac{" + fmt(E) + " \\times " + fmt(t) + "}{" + fmt(di) + "} = " + fmt(mm) + "\\,\\mathrm{H}$"], chk: {form: "u25s1mm", p: {mm: mm, di: di, t: t}}};
  }
  throw new Error("u25s1mm：条件に合う数字が見つからない");
}
function tbU25s1_Qdi(r){
  var gcd = tbU25s1_gcd, ratio = tbU25s1_ratio, par = tbU25s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mm = pick(r, [0.1,0.2,0.4,0.5,1,2]);
    var di = pick(r, [0.5,1,2,3,4,5,10]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var E = (Math.round((mm * di / t) * 1000) / 1000);
    if (!(nice(mm * di / t) && E >= 1 && E <= 1000)) continue;
    var ok = (E * t / mm);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU25s1_three(ok, [{x: (E * mm / t), why: "式の変形をまちがえた"}, {x: (E * t), why: "相互インダクタンスで割っていない"}, {x: (E / mm), why: "時間を掛けていない"}, {x: (mm * t / E), why: "割る順が逆"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u25s1di", text: "相互インダクタンス $" + fmt(mm) + "\\,\\mathrm{H}$ の2つのコイルがある。一次側の電流を変えると、$" + fmt(t) + "\\,\\mathrm{s}$ の間、二次側に大きさ $" + fmt(E) + "\\,\\mathrm{V}$ の誘導起電力が生じた。この間に変わった一次側の電流は何 A か。", fig: {kind: "u25s1tc", L: tbU25s1_fig({"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}","i1e":"top","phi1":"","phi1a":"ccw"}, [["i1", "Δ{I}_1"], ["e2", "{e}_2=" + fmt(E) + " V"], ["m", "{M}=" + fmt(mm) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e_2 = M \\dfrac{\\Delta I_1}{\\Delta t}$ より $\\Delta I_1 = \\dfrac{e_2 \\Delta t}{M}$", "$\\Delta I_1 = \\dfrac{" + fmt(E) + " \\times " + fmt(t) + "}{" + fmt(mm) + "} = " + qv(ok, "A") + "$"], chk: {form: "u25s1di", p: {mm: mm, di: di, t: t}}};
  }
  throw new Error("u25s1di：条件に合う数字が見つからない");
}
function tbU25s1_Qsub(r){
  var gcd = tbU25s1_gcd, ratio = tbU25s1_ratio, par = tbU25s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var src = (k == 1 ? '一次側' : '二次側');
    var dst = (k == 1 ? '二次側' : '一次側');
    var good = (k == 1 ? 'e_2 = -M \\dfrac{\\Delta I_1}{\\Delta t}' : 'e_1 = -M \\dfrac{\\Delta I_2}{\\Delta t}');
    var b1 = (k == 1 ? 'e_2 = -M \\dfrac{\\Delta I_2}{\\Delta t}' : 'e_1 = -M \\dfrac{\\Delta I_1}{\\Delta t}');
    var b2 = (k == 1 ? 'e_1 = -M \\dfrac{\\Delta I_1}{\\Delta t}' : 'e_2 = -M \\dfrac{\\Delta I_2}{\\Delta t}');
    var b3 = (k == 1 ? 'e_2 = -M \\dfrac{\\Delta t}{\\Delta I_1}' : 'e_1 = -M \\dfrac{\\Delta t}{\\Delta I_2}');
    var _c = choices(r, [{t: "$" + String(good) + "$", v: "good"}, {t: "$" + String(b1) + "$", v: "b1", why: "起電力が生じる側の電流を使った。電流を変えたのは" + String(src)}, {t: "$" + String(b2) + "$", v: "b2", why: "起電力が生じるのは" + String(dst)}, {t: "$" + String(b3) + "$", v: "b3", why: "電流の変化を時間で割る"}]);
    return {form: "u25s1sub", text: "2つのコイルの" + String(src) + "の電流を変えた。" + String(dst) + "に生じる誘導起電力を表す式はどれか。", fig: {kind: "u25s1tc", L: tbU25s1_fig({"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}","i1e":"top","phi1":"","phi1a":"ccw"}, [["m", "{M}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(src) + "の電流の変化で、" + String(dst) + "に起電力が生じる", "$" + String(good) + "$"], chk: {form: "u25s1sub", p: {k: k}}};
  }
  throw new Error("u25s1sub：条件に合う数字が見つからない");
}
function tbU25s1_Qdef(r){
  var gcd = tbU25s1_gcd, ratio = tbU25s1_ratio, par = tbU25s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "相互インダクタンス", v: "own"}, {t: "自己インダクタンス", v: "self", why: "自己インダクタンスは、自分の電流の変化で自分に生じる起電力の大きさ"}, {t: "静電容量", v: "cap", why: "静電容量はコンデンサの量"}, {t: "透磁率", v: "mu", why: "透磁率は物質の磁束の通しやすさ"}]);
    return {form: "u25s1def", text: "一方のコイルの電流の変化で、もう一方のコイルに誘導起電力を生じる働きの大きさを表す量を □ という。", fig: {kind: "u25s1tc", L: tbU25s1_fig({"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}","i1e":"top","phi1":"","phi1a":"ccw"}, [["m", "{M}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["2つのコイルの間で相互に働くインダクタンス", "相互インダクタンス $M$［H］"], chk: {form: "u25s1def", p: {}}};
  }
  throw new Error("u25s1def：条件に合う数字が見つからない");
}
// 25-2 相互インダクタンスの式 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u25_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU25s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU25s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU25s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU25s2_par(a, b){ return a * b / (a + b); }
function tbU25s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU25s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU25s2_Qmm(r){
  var gcd = tbU25s2_gcd, ratio = tbU25s2_ratio, par = tbU25s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n1 = pick(r, [50,100,200,400,500]);
    var n2 = pick(r, [20,50,100,200,300,400,500,1000]);
    var pk = pick(r, [1,2,3,4,5,10,20]);
    var i = pick(r, [0.5,2,4,5,10]);
    var ph = (pk / 1000);
    var MM = (n2 * ph / i);
    var A = (n1 * ph / i);
    var B = (n2 * ph * i);
    var C = (n2 * ph);
    if (!(n1 != n2 && nice(MM) && MM >= 0.01 && MM <= 50 && nice(A) && nice(B) && nice(C) && distinct([MM, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(MM) + "\\,\\mathrm{H}$", v: fmt(MM)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "一次側の巻数を使った。巻数は起電力が生じる二次側"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "電流で割るところを掛けた"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "電流で割っていない"}]);
    return {form: "u25s2mm", text: "一次側の巻数 " + fmt(n1) + "、二次側の巻数 " + fmt(n2) + " の2つのコイルがある。一次側に $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流すと、$" + fmt(ph) + "\\,\\mathrm{Wb}$ の磁束が生じ、その全部が二次側に鎖交した。相互インダクタンスは何 H か。", fig: {kind: "u25s2tc", L: tbU25s2_fig({"w1":"r","w2":"r","n1":"{N}_1","n2":"{N}_2","i1":"{I}_1","i1e":"top","phi1":"{Φ}_1","phi1a":"ccw","m":"{M}"}, [["n1", "{N}_1=" + fmt(n1)], ["n2", "{N}_2=" + fmt(n2)], ["i1", "{I}_1=" + fmt(i) + " A"], ["phi1", "{Φ}_1=" + fmt(ph) + " Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$M = \\dfrac{N_2 \\Phi_1}{I_1}$（巻数は二次側）", "$M = \\dfrac{" + fmt(n2) + " \\times " + fmt(ph) + "}{" + fmt(i) + "} = " + fmt(MM) + "\\,\\mathrm{H}$"], chk: {form: "u25s2mm", p: {n2: n2, pk: pk, i: i}}};
  }
  throw new Error("u25s2mm：条件に合う数字が見つからない");
}
function tbU25s2_Qi(r){
  var gcd = tbU25s2_gcd, ratio = tbU25s2_ratio, par = tbU25s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n2 = pick(r, [50,100,200,400,500,1000]);
    var pk = pick(r, [1,2,4,5,10,20]);
    var MM = pick(r, [0.05,0.1,0.2,0.4,0.5,1]);
    var ph = (pk / 1000);
    if (!(nice(n2 * ph / MM) && n2 * ph / MM >= 0.1 && n2 * ph / MM <= 50)) continue;
    var ok = (n2 * ph / MM);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU25s2_three(ok, [{x: (MM * n2 / ph), why: "割る順が逆"}, {x: (n2 * ph * MM), why: "相互インダクタンスで割るところを掛けた"}, {x: (ph / MM), why: "二次側の巻数を掛けていない"}, {x: (MM * ph / n2), why: "式の変形をまちがえた"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u25s2i", text: "相互インダクタンス $" + fmt(MM) + "\\,\\mathrm{H}$ の2つのコイルがあり、二次側の巻数は " + fmt(n2) + " である。一次側に電流を流すと、$" + fmt(ph) + "\\,\\mathrm{Wb}$ の磁束が生じ、その全部が二次側に鎖交した。一次側に流した電流は何 A か。", fig: {kind: "u25s2tc", L: tbU25s2_fig({"w1":"r","w2":"r","n1":"{N}_1","n2":"{N}_2","i1":"{I}_1","i1e":"top","phi1":"{Φ}_1","phi1a":"ccw","m":"{M}"}, [["n1", null], ["n2", "{N}_2=" + fmt(n2)], ["i1", "{I}_1"], ["phi1", "{Φ}_1=" + fmt(ph) + " Wb"], ["m", "{M}=" + fmt(MM) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$M = \\dfrac{N_2 \\Phi_1}{I_1}$ より $I_1 = \\dfrac{N_2 \\Phi_1}{M}$", "$I_1 = \\dfrac{" + fmt(n2) + " \\times " + fmt(ph) + "}{" + fmt(MM) + "} = " + qv(ok, "A") + "$"], chk: {form: "u25s2i", p: {n2: n2, pk: pk, MM: MM}}};
  }
  throw new Error("u25s2i：条件に合う数字が見つからない");
}
function tbU25s2_Qmu(r){
  var gcd = tbU25s2_gcd, ratio = tbU25s2_ratio, par = tbU25s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,4,5]);
    var sk = pick(r, [1,2,4,5,10]);
    var n1 = pick(r, [50,100,200,400,500]);
    var n2 = pick(r, [20,50,100,200,300,500]);
    var lm = pick(r, [0.1,0.2,0.25,0.4,0.5,1]);
    var mu = (a / 1000);
    var s = (sk / 1000);
    var MM = (mu * s * n1 * n2 / lm);
    var A = (mu * s * n2 * n2 / lm);
    var B = (mu * s * n1 * n2 * lm);
    var C = (mu * s * (n1 + n2) / lm);
    if (!(n1 != n2 && nice(MM) && MM >= 0.01 && MM <= 50 && nice(A) && nice(B) && nice(C) && C >= 0.001 && distinct([MM, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(MM) + "\\,\\mathrm{H}$", v: fmt(MM)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "二次側の巻数を2乗した。一次側と二次側の巻数の積"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "磁路の長さで割るところを掛けた"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "巻数を足した。掛ける"}]);
    return {form: "u25s2mu", text: "透磁率 $" + fmt(a) + " \\times 10^{-3}\\,\\mathrm{H/m}$、断面積 $" + fmt(s) + "\\,\\mathrm{m^2}$、磁路の長さ $" + fmt(lm) + "\\,\\mathrm{m}$ の鉄心に、一次側のコイルを " + fmt(n1) + " 回、二次側のコイルを " + fmt(n2) + " 回巻いた。相互インダクタンスは何 H か。", fig: {kind: "u25s2tc", L: tbU25s2_fig({"w1":"r","w2":"r","n1":"{N}_1","n2":"{N}_2","i1":"{I}_1","i1e":"top","phi1":"{Φ}_1","phi1a":"ccw","m":"{M}"}, [["mu", "{μ}=" + fmt(a) + "×10⁻³ H/m"], ["n1", "{N}_1=" + fmt(n1)], ["n2", "{N}_2=" + fmt(n2)], ["s", "{S}=" + fmt(s) + " m²"], ["l", "{l}=" + fmt(lm) + " m"], ["i1", null], ["phi1", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$M = \\dfrac{\\mu S N_1 N_2}{l}$", "$M = \\dfrac{" + fmt(a) + " \\times 10^{-3} \\times " + fmt(s) + " \\times " + fmt(n1) + " \\times " + fmt(n2) + "}{" + fmt(lm) + "} = " + fmt(MM) + "\\,\\mathrm{H}$"], chk: {form: "u25s2mu", p: {a: a, sk: sk, n1: n1, n2: n2, lm: lm}}};
  }
  throw new Error("u25s2mu：条件に合う数字が見つからない");
}
function tbU25s2_Qtimes(r){
  var gcd = tbU25s2_gcd, ratio = tbU25s2_ratio, par = tbU25s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3]);
    var b = pick(r, [2,3,4]);
    var ab = (a * b);
    var s2 = (a + b);
    var b2 = (b * b);
    if (!(a != b && distinct([ab, s2, b2, b]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ab) + "$ 倍", v: fmt(ab)}, {t: "$" + fmt(s2) + "$ 倍", v: fmt(s2), why: "2つの巻数の積に比例するので、倍率を掛ける"}, {t: "$" + fmt(b2) + "$ 倍", v: fmt(b2), why: "二次側だけを2乗した。2つの巻数の積に比例する"}, {t: "$" + fmt(b) + "$ 倍", v: fmt(b), why: "一次側の巻数にも比例する"}]);
    return {form: "u25s2times", text: "鉄心はそのままで、一次側の巻数を " + fmt(a) + " 倍、二次側の巻数を " + fmt(b) + " 倍にした。相互インダクタンスは元の何倍になるか。", fig: {kind: "u25s2tc", L: tbU25s2_fig({"w1":"r","w2":"r","n1":"{N}_1","n2":"{N}_2","i1":"{I}_1","i1e":"top","phi1":"{Φ}_1","phi1a":"ccw","m":"{M}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$M = \\dfrac{\\mu S N_1 N_2}{l}$ で、巻数の積に比例", "$" + fmt(a) + " \\times " + fmt(b) + " = " + fmt(ab) + "$ 倍"], chk: {form: "u25s2times", p: {a: a, b: b}}};
  }
  throw new Error("u25s2times：条件に合う数字が見つからない");
}
function tbU25s2_Qeq(r){
  var gcd = tbU25s2_gcd, ratio = tbU25s2_ratio, par = tbU25s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var src = (k == 1 ? '一次側' : '二次側');
    var dst = (k == 1 ? '二次側' : '一次側');
    var good = (k == 1 ? '\\dfrac{N_2 \\Phi_1}{I_1}' : '\\dfrac{N_1 \\Phi_2}{I_2}');
    var b1 = (k == 1 ? '\\dfrac{N_1 \\Phi_1}{I_1}' : '\\dfrac{N_2 \\Phi_2}{I_2}');
    var b2 = (k == 1 ? '\\dfrac{N_2 I_1}{\\Phi_1}' : '\\dfrac{N_1 I_2}{\\Phi_2}');
    var b3 = (k == 1 ? '\\dfrac{N_2 \\Phi_2}{I_1}' : '\\dfrac{N_1 \\Phi_1}{I_2}');
    var _c = choices(r, [{t: "$" + String(good) + "$", v: "good"}, {t: "$" + String(b1) + "$", v: "b1", why: "巻数は、起電力が生じる" + String(dst) + "の巻数"}, {t: "$" + String(b2) + "$", v: "b2", why: "磁束と電流が逆"}, {t: "$" + String(b3) + "$", v: "b3", why: "磁束は、電流を流した" + String(src) + "がつくる"}]);
    return {form: "u25s2eq", text: "2つのコイルの" + String(src) + "に電流を流し、" + String(dst) + "を見る。相互インダクタンス $M$ を表す式はどれか。", fig: {kind: "u25s2tc", L: tbU25s2_fig({"w1":"r","w2":"r","n1":"{N}_1","n2":"{N}_2","i1":"{I}_1","i1e":"top","phi1":"{Φ}_1","phi1a":"ccw","m":"{M}"}, [["m", "{M}"], ["i1", null], ["phi1", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流と磁束は" + String(src) + "、巻数は" + String(dst), "$M = " + String(good) + "$"], chk: {form: "u25s2eq", p: {k: k}}};
  }
  throw new Error("u25s2eq：条件に合う数字が見つからない");
}
// 25-3 結合係数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u25_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU25s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU25s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU25s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU25s3_par(a, b){ return a * b / (a + b); }
function tbU25s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU25s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU25s3_Qmm(r){
  var gcd = tbU25s3_gcd, ratio = tbU25s3_ratio, par = tbU25s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var g = pick(r, [0.01,0.02,0.05,0.1,0.2]);
    var a = pick(r, [1,2,3,4,5]);
    var b = pick(r, [1,2,3,4,5,6]);
    var k = pick(r, [0.2,0.25,0.4,0.5,0.6,0.8,0.9,1]);
    var L1 = (Math.round((g * a * a) * 1000) / 1000);
    var L2 = (Math.round((g * b * b) * 1000) / 1000);
    var MM = (k * Math.sqrt(L1 * L2));
    var A = (k * L1 * L2);
    var B = (Math.sqrt(L1 * L2));
    var C = (k * (L1 + L2));
    if (!(a != b && nice(MM) && MM >= 0.01 && nice(A) && A >= 0.001 && nice(B) && nice(C) && distinct([MM, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(MM) + "\\,\\mathrm{H}$", v: fmt(MM)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "ルートを取っていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "結合係数を掛けていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "ルートの中を掛けずに足し、ルートを取っていない"}]);
    return {form: "u25s3mm", text: "自己インダクタンスが $" + fmt(L1) + "\\,\\mathrm{H}$ と $" + fmt(L2) + "\\,\\mathrm{H}$ の2つのコイルがあり、結合係数は $" + fmt(k) + "$ である。相互インダクタンスは何 H か。", fig: {kind: "u25s3tc", L: tbU25s3_fig({"w1":"r","w2":"r","l1":"{L}_1","l2":"{L}_2","m":"{M}","i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw"}, [["l1", "{L}_1=" + fmt(L1) + " H"], ["l2", "{L}_2=" + fmt(L2) + " H"], ["kc", "{k}=" + fmt(k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$M = k\\sqrt{L_1 L_2}$", "$M = " + fmt(k) + " \\times \\sqrt{" + fmt(L1) + " \\times " + fmt(L2) + "} = " + fmt(MM) + "\\,\\mathrm{H}$"], chk: {form: "u25s3mm", p: {k: k, g: g, a: a, b: b}}};
  }
  throw new Error("u25s3mm：条件に合う数字が見つからない");
}
function tbU25s3_Qk(r){
  var gcd = tbU25s3_gcd, ratio = tbU25s3_ratio, par = tbU25s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var g = pick(r, [0.01,0.02,0.05,0.1,0.2]);
    var a = pick(r, [1,2,3,4,5]);
    var b = pick(r, [1,2,3,4,5,6]);
    var k = pick(r, [0.2,0.25,0.4,0.5,0.6,0.8,0.9]);
    var L1 = (Math.round((g * a * a) * 1000) / 1000);
    var L2 = (Math.round((g * b * b) * 1000) / 1000);
    var MM = (Math.round((k * g * a * b) * 1000) / 1000);
    var A = (MM / (L1 * L2));
    var B = (g * a * b / MM);
    var C = (MM / (L1 + L2));
    if (!(a != b && nice(k * g * a * b) && MM >= 0.01 && nice(A) && nice(B) && nice(C) && distinct([k, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(k) + "$", v: fmt(k)}, {t: "$" + fmt(A) + "$", v: fmt(A), why: "ルートを取っていない"}, {t: "$" + fmt(B) + "$", v: fmt(B), why: "割る順が逆"}, {t: "$" + fmt(C) + "$", v: fmt(C), why: "ルートの中を掛けずに足し、ルートを取っていない"}]);
    return {form: "u25s3k", text: "自己インダクタンスが $" + fmt(L1) + "\\,\\mathrm{H}$ と $" + fmt(L2) + "\\,\\mathrm{H}$ の2つのコイルの相互インダクタンスは $" + fmt(MM) + "\\,\\mathrm{H}$ である。結合係数はいくらか。", fig: {kind: "u25s3tc", L: tbU25s3_fig({"w1":"r","w2":"r","l1":"{L}_1","l2":"{L}_2","m":"{M}","i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw"}, [["l1", "{L}_1=" + fmt(L1) + " H"], ["l2", "{L}_2=" + fmt(L2) + " H"], ["m", "{M}=" + fmt(MM) + " H"], ["kc", "{k}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$M = k\\sqrt{L_1 L_2}$ より $k = \\dfrac{M}{\\sqrt{L_1 L_2}}$", "$k = \\dfrac{" + fmt(MM) + "}{\\sqrt{" + fmt(L1) + " \\times " + fmt(L2) + "}} = " + fmt(k) + "$"], chk: {form: "u25s3k", p: {k: k, g: g, a: a, b: b}}};
  }
  throw new Error("u25s3k：条件に合う数字が見つからない");
}
function tbU25s3_Qleak(r){
  var gcd = tbU25s3_gcd, ratio = tbU25s3_ratio, par = tbU25s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var x = pick(r, [5,10,15,20,25,30,40]);
    var k = ((100 - x) / 100);
    var xs = (x / 100);
    var _c = choices(r, [{t: "$" + fmt(k) + "$", v: fmt(k)}, {t: "$" + fmt(xs) + "$", v: fmt(xs), why: "それは逃げた割合。結合係数は鎖交した割合"}, {t: "$1$", v: "1", why: "漏れ磁束があるので 1 より小さい"}, {t: "$" + fmt(x) + "$", v: fmt(x), why: "結合係数は割合なので 1 以下"}]);
    return {form: "u25s3leak", text: "片方のコイルで生じた磁束のうち、" + fmt(x) + " % が漏れ磁束として逃げ、残りがもう片方のコイルに鎖交した。結合係数はいくらか。", fig: {kind: "u25s3tc", L: tbU25s3_fig({"w1":"r","w2":"r","l1":"{L}_1","l2":"{L}_2","m":"{M}","i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw"}, [["lk", "漏れ磁束"], ["kc", "{k}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["結合係数は、鎖交した磁束の割合", "$k = 1 - " + fmt(xs) + " = " + fmt(k) + "$"], chk: {form: "u25s3leak", p: {x: x}}};
  }
  throw new Error("u25s3leak：条件に合う数字が見つからない");
}
function tbU25s3_Qdef(r){
  var gcd = tbU25s3_gcd, ratio = tbU25s3_ratio, par = tbU25s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "何割がもう片方のコイルに鎖交するか", v: "own"}, {t: "何割が鉄心の外へ逃げるか", v: "leak", why: "逃げる磁束は漏れ磁束。結合係数は鎖交する割合"}, {t: "2つのコイルの巻数の比", v: "turn", why: "結合係数は磁束の割合"}, {t: "2つのコイルの自己インダクタンスの和", v: "sum", why: "結合係数は磁束の割合で、1 以下の数"}]);
    return {form: "u25s3def", text: "結合係数 $k$ は、片方のコイルで生じた磁束のうち、□ を表す。", fig: {kind: "u25s3tc", L: tbU25s3_fig({"w1":"r","w2":"r","l1":"{L}_1","l2":"{L}_2","m":"{M}","i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw"}, [["kc", "{k}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全部鎖交すれば $k = 1$", "何割がもう片方のコイルに鎖交するか"], chk: {form: "u25s3def", p: {}}};
  }
  throw new Error("u25s3def：条件に合う数字が見つからない");
}
// 25-4 和動と差動 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u25_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU25s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU25s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU25s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU25s4_par(a, b){ return a * b / (a + b); }
function tbU25s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU25s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU25s4_Qsum(r){
  var gcd = tbU25s4_gcd, ratio = tbU25s4_ratio, par = tbU25s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l1 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1,2]);
    var l2 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1,2]);
    var mm = pick(r, [0.05,0.1,0.15,0.2,0.25,0.3,0.4,0.5]);
    var md = pick(r, [1,2]);
    var nm = (md == 1 ? '和動' : '差動');
    var sg = (md == 1 ? 1 : -1);
    var LT = (l1 + l2 + sg * 2 * mm);
    var A = (l1 + l2 + sg * mm);
    var B = (l1 + l2 - sg * 2 * mm);
    var C = (l1 + l2);
    if (!(mm < min(l1, l2) && nice(LT) && LT > 0 && nice(A) && nice(B) && B > 0 && distinct([LT, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(LT) + "\\,\\mathrm{H}$", v: fmt(LT)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "$M$ を1つしか入れていない。影響は2つある"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "足すと引くが逆。和動は $+2M$、差動は $-2M$"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "相互インダクタンスを入れていない"}]);
    return {form: "u25s4sum", text: "自己インダクタンス $" + fmt(l1) + "\\,\\mathrm{H}$ と $" + fmt(l2) + "\\,\\mathrm{H}$ のコイルを、" + String(nm) + "接続になるように直列につないだ。相互インダクタンスが $" + fmt(mm) + "\\,\\mathrm{H}$ の時、合成インダクタンスは何 H か。", fig: {kind: "u25s4tc", L: tbU25s4_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","phi1":null,"phi2":null}, [["l1", "{L}_1=" + fmt(l1) + " H"], ["l2", "{L}_2=" + fmt(l2) + " H"], ["m", "{M}=" + fmt(mm) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(nm) + "接続なので $L = L_1 + L_2 " + String(sg > 0 ? '+' : '-') + " 2M$", "$L = " + fmt(l1) + " + " + fmt(l2) + " " + String(sg > 0 ? '+' : '-') + " 2 \\times " + fmt(mm) + " = " + fmt(LT) + "\\,\\mathrm{H}$"], chk: {form: "u25s4sum", p: {l1: l1, l2: l2, mm: mm, md: md}}};
  }
  throw new Error("u25s4sum：条件に合う数字が見つからない");
}
function tbU25s4_Qsolve(r){
  var gcd = tbU25s4_gcd, ratio = tbU25s4_ratio, par = tbU25s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ll = pick(r, [0.2,0.3,0.4,0.5,0.6,0.8,1,1.5,2]);
    var mm = pick(r, [0.05,0.1,0.15,0.2,0.25,0.3,0.4,0.5]);
    var q = pick(r, [1,2]);
    var LP = (Math.round((2 * ll + 2 * mm) * 1000) / 1000);
    var LM = (Math.round((2 * ll - 2 * mm) * 1000) / 1000);
    var what = (q == 1 ? '相互インダクタンス $M$' : '1つのコイルの自己インダクタンス');
    var OK = (q == 1 ? mm : ll);
    var A = (q == 1 ? (LP - LM) / 2 : (LP + LM) / 2);
    var B = (q == 1 ? (LP - LM) : (LP - LM) / 4);
    var C = (q == 1 ? (LP + LM) / 4 : (LP - LM) / 2);
    if (!(mm < ll && nice(A) && nice(B) && nice(C) && A > 0 && B > 0 && C > 0 && distinct([OK, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(OK) + "\\,\\mathrm{H}$", v: fmt(OK)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "2つの式を引く（足す）と、$M$（$L$）は 4 つ分になる。2 で割ったのはまちがい"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: String(q == 1 ? '引いた値はそのまま M ではない。4 で割る' : 'それは相互インダクタンス')}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: String(q == 1 ? 'それは1つのコイルの自己インダクタンス' : '足して 4 で割る')}]);
    return {form: "u25s4solve", text: "自己インダクタンスの等しい2つのコイルを直列につないだ。和動接続の時の合成インダクタンスは $" + fmt(LP) + "\\,\\mathrm{H}$、差動接続の時は $" + fmt(LM) + "\\,\\mathrm{H}$ であった。" + String(what) + "は何 H か。", fig: {kind: "u25s4tc", L: tbU25s4_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","phi1":null,"phi2":null}, [["l1", "{L}_1"], ["l2", "{L}_2"], ["lt", "{L}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$2L + 2M = " + fmt(LP) + "$、$2L - 2M = " + fmt(LM) + "$", String(q == 1 ? '引くと $4M = ' + fmt(LP - LM) + '$' : '足すと $4L = ' + fmt(LP + LM) + '$') + "　答え $" + fmt(OK) + "\\,\\mathrm{H}$"], chk: {form: "u25s4solve", p: {ll: ll, mm: mm, q: q}}};
  }
  throw new Error("u25s4solve：条件に合う数字が見つからない");
}
function tbU25s4_Qjudge(r){
  var gcd = tbU25s4_gcd, ratio = tbU25s4_ratio, par = tbU25s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var w2s = (k <= 2 ? 'r' : 'l');
    var j2s = (k % 2 == 1 ? 'top' : 'bot');
    var md = (k == 2 || k == 3 ? 'wa' : 'sa');
    var good = (md == 'wa' ? '和動接続' : '差動接続');
    var bad = (md == 'wa' ? '差動接続' : '和動接続');
    var why = (md == 'wa' ? '2つのコイルの磁束は同じ向きに回る' : '2つのコイルの磁束は逆向きに回る');
    var _c = choices(r, [{t: String(good), v: String(md)}, {t: String(bad), v: "x", why: String(why)}, {t: "並列接続", v: "par", why: "2つのコイルは直列につないである"}, {t: "どちらでもない", v: "none", why: "右ねじの法則で磁束の向きを見ると決まる"}]);
    return {form: "u25s4judge", text: "図のように2つのコイルを直列につなぎ、端子 a から電流を流した。このつなぎ方は何か。", fig: {kind: "u25s4tc", L: tbU25s4_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","phi1":null,"phi2":null}, [["w2", String(w2s)], ["j2", String(j2s)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、それぞれのコイルの磁束の向きを見る", String(why) + "ので、" + String(good)], chk: {form: "u25s4judge", p: {k: k}}};
  }
  throw new Error("u25s4judge：条件に合う数字が見つからない");
}
function tbU25s4_Qwhy(r){
  var gcd = tbU25s4_gcd, ratio = tbU25s4_ratio, par = tbU25s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$L_1$ から $L_2$ への影響と、$L_2$ から $L_1$ への影響の2つがある", v: "own"}, {t: "相互インダクタンスは自己インダクタンスの2倍だ", v: "twice", why: "影響が2つあるから2倍"}, {t: "巻数が2倍になる", v: "turn", why: "巻数はそのまま。影響が2つある"}, {t: "電流が2倍になる", v: "cur", why: "直列なので電流は1つ。影響が2つある"}]);
    return {form: "u25s4why", text: "和動接続の合成インダクタンスが $L_1 + L_2 + 2M$ と、$M$ が2倍になるのは、□ からである。", fig: {kind: "u25s4tc", L: tbU25s4_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","phi1":null,"phi2":null}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L_1$ の磁束が $L_2$ に、$L_2$ の磁束が $L_1$ に影響する", "影響が2つあるので $2M$"], chk: {form: "u25s4why", p: {}}};
  }
  throw new Error("u25s4why：条件に合う数字が見つからない");
}
// 25-5 磁気エネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u25_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU25s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU25s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU25s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU25s5_par(a, b){ return a * b / (a + b); }
function tbU25s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU25s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU25s5_Qw(r){
  var gcd = tbU25s5_gcd, ratio = tbU25s5_ratio, par = tbU25s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ll = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2,4]);
    var i = pick(r, [0.5,1,2,3,4,5,6,10]);
    var W = (ll * i * i / 2);
    var A = (ll * i / 2);
    var B = (ll * i * i);
    var C = (ll * i / 4);
    if (!(i != 2 && nice(W) && W >= 0.01 && nice(A) && nice(C) && distinct([W, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(W) + "\\,\\mathrm{J}$", v: fmt(W)}, {t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A), why: "電流を2乗していない"}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "$\\dfrac{1}{2}$ を掛けていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{J}$", v: fmt(C), why: "2乗するところを 2 で割った"}]);
    return {form: "u25s5w", text: "自己インダクタンス $" + fmt(ll) + "\\,\\mathrm{H}$ のコイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流した。コイルに蓄えられるエネルギーは何 J か。", fig: {kind: "u25s5co", L: tbU25s5_fig({"n":"","i":"{I}","phi":"","phia":"cw","ind":"{L}","w":"{W}"}, [["ind", "{L}=" + fmt(ll) + " H"], ["i", "{I}=" + fmt(i) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} L I^2$", "$W = \\dfrac{1}{2} \\times " + fmt(ll) + " \\times " + fmt(i) + "^2 = " + fmt(W) + "\\,\\mathrm{J}$"], chk: {form: "u25s5w", p: {ll: ll, i: i}}};
  }
  throw new Error("u25s5w：条件に合う数字が見つからない");
}
function tbU25s5_Qi(r){
  var gcd = tbU25s5_gcd, ratio = tbU25s5_ratio, par = tbU25s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ll = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2,4]);
    var i = pick(r, [0.5,1,2,3,4,5,6,10]);
    var W = (ll * i * i / 2);
    if (!(nice(W) && W >= 0.01)) continue;
    var ok = (Math.sqrt(2 * W / ll));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU25s5_three(ok, [{x: (2 * W / ll), why: "ルートを取っていない"}, {x: (Math.sqrt(W / ll)), why: "2 を掛けていない"}, {x: (W / ll), why: "2 を掛けず、ルートも取っていない"}, {x: (Math.sqrt(2 * W * ll)), why: "自己インダクタンスで割るところを掛けた"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u25s5i", text: "自己インダクタンス $" + fmt(ll) + "\\,\\mathrm{H}$ のコイルに、$" + fmt(W) + "\\,\\mathrm{J}$ のエネルギーが蓄えられている。流れている電流は何 A か。", fig: {kind: "u25s5co", L: tbU25s5_fig({"n":"","i":"{I}","phi":"","phia":"cw","ind":"{L}","w":"{W}"}, [["ind", "{L}=" + fmt(ll) + " H"], ["i", "{I}"], ["w", "{W}=" + fmt(W) + " J"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} L I^2$ より $I^2 = \\dfrac{2W}{L}$", "$I^2 = \\dfrac{2 \\times " + fmt(W) + "}{" + fmt(ll) + "} = " + fmt(ok * ok) + "$ より $I = " + qv(ok, "A") + "$"], chk: {form: "u25s5i", p: {i: i}}};
  }
  throw new Error("u25s5i：条件に合う数字が見つからない");
}
function tbU25s5_Qind(r){
  var gcd = tbU25s5_gcd, ratio = tbU25s5_ratio, par = tbU25s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ll = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2,4]);
    var i = pick(r, [1,2,3,4,5,10]);
    var W = (ll * i * i / 2);
    var A = (W / (i * i));
    var B = (2 * W / i);
    var C = (2 * W * i * i);
    if (!(nice(W) && W >= 0.01 && nice(A) && nice(B) && distinct([ll, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ll) + "\\,\\mathrm{H}$", v: fmt(ll)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "2 を掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "電流を2乗していない"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "電流の2乗で割るところを掛けた"}]);
    return {form: "u25s5ind", text: "コイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流すと、$" + fmt(W) + "\\,\\mathrm{J}$ のエネルギーが蓄えられた。このコイルの自己インダクタンスは何 H か。", fig: {kind: "u25s5co", L: tbU25s5_fig({"n":"","i":"{I}","phi":"","phia":"cw","ind":"{L}","w":"{W}"}, [["ind", "{L}"], ["i", "{I}=" + fmt(i) + " A"], ["w", "{W}=" + fmt(W) + " J"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} L I^2$ より $L = \\dfrac{2W}{I^2}$", "$L = \\dfrac{2 \\times " + fmt(W) + "}{" + fmt(i) + "^2} = " + fmt(ll) + "\\,\\mathrm{H}$"], chk: {form: "u25s5ind", p: {ll: ll, i: i}}};
  }
  throw new Error("u25s5ind：条件に合う数字が見つからない");
}
function tbU25s5_Qtimes(r){
  var gcd = tbU25s5_gcd, ratio = tbU25s5_ratio, par = tbU25s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var m = pick(r, [2,3,4,5]);
    var m2 = (m * m);
    var what = (k == 1 ? '流す電流を ' + m + ' 倍にした' : '自己インダクタンスが ' + m + ' 倍のコイルにかえ、同じ電流を流した');
    var good = (k == 1 ? m * m : m);
    var bad = (k == 1 ? m : m * m);
    var why = (k == 1 ? '電流は2乗する' : '自己インダクタンスは2乗しない');
    var _c = choices(r, [{t: "$" + fmt(good) + "$ 倍", v: "good"}, {t: "$" + fmt(bad) + "$ 倍", v: "bad", why: String(why)}, {t: "$\\dfrac{1}{" + fmt(m) + "}$ 倍", v: "inv", why: "どちらも分子にある"}, {t: "$1$ 倍（変わらない）", v: "one", why: "$W = \\dfrac{1}{2} L I^2$ で変わる"}]);
    return {form: "u25s5times", text: String(what) + "。コイルに蓄えられるエネルギーは元の何倍になるか。", fig: {kind: "u25s5co", L: tbU25s5_fig({"n":"","i":"{I}","phi":"","phia":"cw","ind":"{L}","w":"{W}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} L I^2$", "エネルギーは $" + fmt(good) + "$ 倍"], chk: {form: "u25s5times", p: {k: k, m: m}}};
  }
  throw new Error("u25s5times：条件に合う数字が見つからない");
}
function tbU25s5_Qpair(r){
  var gcd = tbU25s5_gcd, ratio = tbU25s5_ratio, par = tbU25s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var who = (k == 1 ? 'コイル' : 'コンデンサ');
    var good = (k == 1 ? '\\dfrac{1}{2} L I^2' : '\\dfrac{1}{2} C V^2');
    var b1 = (k == 1 ? '\\dfrac{1}{2} C V^2' : '\\dfrac{1}{2} L I^2');
    var w1 = (k == 1 ? 'それはコンデンサの静電エネルギー' : 'それはコイルの磁気エネルギー');
    var b2 = (k == 1 ? '\\dfrac{1}{2} L^2 I' : '\\dfrac{1}{2} C^2 V');
    var b3 = (k == 1 ? 'L I^2' : 'C V^2');
    var _c = choices(r, [{t: "$" + String(good) + "$", v: "good"}, {t: "$" + String(b1) + "$", v: "b1", why: String(w1)}, {t: "$" + String(b2) + "$", v: "b2", why: "2乗するのは" + String(k == 1 ? '電流' : '電圧')}, {t: "$" + String(b3) + "$", v: "b3", why: "$\\dfrac{1}{2}$ が付く"}]);
    return {form: "u25s5pair", text: String(who) + "に蓄えられるエネルギーを表す式はどれか。", fig: {kind: "u25s5co", L: tbU25s5_fig({"n":"","i":"{I}","phi":"","phia":"cw","ind":"{L}","w":"{W}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサ $\\dfrac{1}{2} C V^2$・コイル $\\dfrac{1}{2} L I^2$", "$" + String(good) + "$"], chk: {form: "u25s5pair", p: {k: k}}};
  }
  throw new Error("u25s5pair：条件に合う数字が見つからない");
}
var GEN = {
  // 25-1 相互インダクタンス
  1: function(r){ return pick(r, [tbU25s1_Qe2, tbU25s1_Qe2, tbU25s1_Qe2, tbU25s1_Qmm, tbU25s1_Qmm, tbU25s1_Qdi, tbU25s1_Qdi, tbU25s1_Qsub, tbU25s1_Qsub, tbU25s1_Qdef])(r); },
  // 25-2 相互インダクタンスの式
  2: function(r){ return pick(r, [tbU25s2_Qmm, tbU25s2_Qmm, tbU25s2_Qmm, tbU25s2_Qi, tbU25s2_Qi, tbU25s2_Qmu, tbU25s2_Qmu, tbU25s2_Qtimes, tbU25s2_Qeq])(r); },
  // 25-3 結合係数
  3: function(r){ return pick(r, [tbU25s3_Qmm, tbU25s3_Qmm, tbU25s3_Qmm, tbU25s3_Qk, tbU25s3_Qk, tbU25s3_Qleak, tbU25s3_Qleak, tbU25s3_Qdef])(r); },
  // 25-4 和動と差動
  4: function(r){ return pick(r, [tbU25s4_Qsum, tbU25s4_Qsum, tbU25s4_Qsum, tbU25s4_Qsolve, tbU25s4_Qsolve, tbU25s4_Qjudge, tbU25s4_Qjudge, tbU25s4_Qwhy])(r); },
  // 25-5 磁気エネルギー
  5: function(r){ return pick(r, [tbU25s5_Qw, tbU25s5_Qw, tbU25s5_Qw, tbU25s5_Qi, tbU25s5_Qi, tbU25s5_Qind, tbU25s5_Qind, tbU25s5_Qtimes, tbU25s5_Qpair])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t25s1e","scene":"t25s1e","kind":"u25s1tc","lab":{"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}","i1":"Δ{I}_1","i1e":"top","phi1":"","phi1a":"ccw","e2":"{e}_2","i2":"Δ{I}_2","i2e":"top","phi2":"","phi2a":"cw","e1":"{e}_1"},"viewbox":"21 108 1193 528","band":{"want":"一方の電流の変化で、もう一方に生じる起電力","ans":"$e_2 = -M \\dfrac{\\Delta I_1}{\\Delta t}$","full":"2つのコイルの一方（一次側）の電流が変わると、その磁束がもう一方（二次側）に鎖交し、二次側に誘導起電力が生じる。e2 = -M ΔI1/Δt。M は相互インダクタンス［H］。反対に、二次側の電流の変化で一次側に e1 = -M ΔI2/Δt。"},"narr":{"start":{"co":1,"i1d":0,"phi1d":0,"e2d":0,"i2d":0,"phi2d":0,"e1d":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①2つのコイル\n②式\n③反対から見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"1つの鉄心に、コイルを2つ巻きます。左を一次側、右を二次側とします。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["N1","N2"]},{"text":"一次側のコイルに流す電流を、$\\Delta I_1$ だけ変えます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i1","emph":["I1"]},{"text":"右ねじの法則で、鉄心の中の磁束も変わります。この磁束は〖二次側のコイルにも鎖交〗します。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"phi1","emph":["Phi1","N2"]},{"text":"二次側のコイルは、この磁束の変化を妨げる向きに、誘導起電力を生じます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"e2","emph":["E2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"二次側の起電力は、相互インダクタンス $M$ を使って表します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E2","M","I1"],"eq":[{"cont":false,"items":[["e_2 = -M \\dfrac{\\Delta I_1}{\\Delta t}"]]}],"emphPre":["E2","M","I1"]},{"text":"〖添字〗に気をつけます。一次側の電流の変化で、二次側に起電力が生じます。単位は H です。","at":{"強調":1.0},"after":[],"emph":["I1","E2","M"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"反対に、二次側のコイルに流す電流を、$\\Delta I_2$ だけ変えます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"i2","emph":["I2"]},{"text":"鉄心の中の磁束も変わり、一次側のコイルにも鎖交します。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"phi2","emph":["Phi2","N1"]},{"text":"〖一次側のコイル〗に、誘導起電力が生じます。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"e1","emph":["E1","M","I2"],"eq":[{"cont":false,"items":[["e_1 = -M \\dfrac{\\Delta I_2}{\\Delta t}"]]}],"ans":true,"emphPre":["E1"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","lt1","lb1","n1t0","n1t1"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"I1":["ia1","ia1:h","i1t0","i1t1"],"E1":["ea1","ea1:h","e1t0","e1t1"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","lt2","lb2","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5"],"I2":["ia2","ia2:h","i2t0","i2t1"],"E2":["ea2","ea2:h","e2t0","e2t1"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"]},"moves":{"i1":{"to":{"i1d":1},"dur":0.6},"phi1":{"to":{"phi1d":1},"dur":0.8},"e2":{"to":{"e2d":1},"dur":0.6},"i2":{"to":{"i1d":0,"phi1d":0,"e2d":0,"i2d":1},"dur":0.6},"phi2":{"to":{"phi2d":1},"dur":0.8},"e1":{"to":{"e1d":1},"dur":0.6}},"route":["2つのコイル","式","反対から見る"]}},{"id":"t25s1x","scene":"t25s1x","kind":"u25s1tc","lab":{"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}=0.2 H","i1":"Δ{I}_1=3 A","i1e":"top","phi1":"","phi1a":"ccw","e2":["{e}_2","{e}_2=6 V"]},"viewbox":"21 108 1193 528","band":{"want":"二次側の誘導起電力の大きさ $e_2$","known":"$M = 0.2\\,\\mathrm{H},\\;\\; \\Delta I_1 = 3\\,\\mathrm{A},\\;\\; \\Delta t = 0.1\\,\\mathrm{s}$","ans":"$e_2 = 6\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"i1d":1,"phi1d":1,"e2d":1,"e2v":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、二次側に生じる誘導起電力の大きさ $e_2$ です。","at":{"強調":1.0},"after":[],"emph":["E2"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"一次側の電流の変化で生じるので、$\\Delta I_1$ を使います。大きさなので〖マイナスを外し〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E2","M","I1"],"eq":[{"cont":false,"items":[["e_2 = M \\dfrac{\\Delta I_1}{\\Delta t}"]]}],"emphPre":["E2","M","I1"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$M = 0.2$、$\\Delta I_1 = 3$、$\\Delta t = 0.1$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["E2","M","I1"],"eq":[{"cont":false,"items":[["e_2 = 0.2 \\times \\dfrac{3}{0.1}"],["= 0.2 \\times 30 = 6\\,\\mathrm{V}"]]}],"move":"e2v","ans":true,"emphPre":["M","I1"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","lt1","lb1","n1t0","n1t1"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"I1":["ia1","ia1:h","i1t0","i1t1"],"E1":["ea1","ea1:h","e1t0","e1t1"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","lt2","lb2","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5"],"I2":["ia2","ia2:h","i2t0","i2t1"],"E2":["ea2","ea2:h","e2t0","e2t1"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"]},"moves":{"e2v":{"to":{"e2v":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t25s2e","scene":"t25s2e","kind":"u25s2tc","lab":{"w1":"r","w2":"r","n1":"{N}_1","n2":"{N}_2","i1":"{I}_1","i1e":"top","phi1":"{Φ}_1","phi1a":"ccw","m":"{M}","mu":"{μ}","s":"{S}","l":"{l}"},"viewbox":"88 63 906 654","band":{"want":"相互インダクタンスを巻数・磁束・電流で表す","ans":"$M = \\dfrac{N_2 \\Phi_1}{I_1}$、$M = \\dfrac{\\mu S N_1 N_2}{l}$","full":"M = N2Φ1/I1。L = NΦ/I の L を M に変えた形で、電流と磁束は一次側、巻数は起電力が生じる二次側。Φ = BS・B = μH・H = NI/l を使うと M = μSN1N2/l。相互インダクタンスは2つの巻数の積に比例する。"},"narr":{"start":{"co":1,"i1d":1,"phi1d":1,"sd":0,"ld":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①式の形\n②添字\n③鉄心とコイルで表す\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスは $L = \\dfrac{N \\Phi}{I}$ でした。相互インダクタンスは、$L$ を $M$ に変えた形です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["M","N2","Phi1","I1"],"eq":[{"cont":false,"items":[["M = \\dfrac{N_2 \\Phi_1}{I_1}"]]}],"emphPre":["M"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"電流 $I_1$ は、一次側に流した電流です。磁束 $\\Phi_1$ は、その電流が一次側でつくった磁束です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["I1","Phi1"]},{"text":"巻数は、誘導起電力が生じる〖二次側の $N_2$〗です。ここがいちばん気をつける所です。","at":{"強調":1.0},"after":[],"emph":["N2"]},{"text":"反対に、二次側に電流を流して一次側を見る時は、〖添字が入れかわり〗ます。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["M = \\dfrac{N_1 \\Phi_2}{I_2}"]]}],"emph":["M","N1"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"鉄心の断面積を $S$、透磁率を $\\mu$ とします。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"s","emph":["S","Mu"]},{"text":"磁路の長さを $l$ とします。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"l","emph":["S","L","Mu"]},{"text":"$\\Phi_1 = BS$、$B = \\mu H$、$H = \\dfrac{N_1 I_1}{l}$ を入れて $I_1$ を約分すると、次の式になります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["M","Mu","S","N1","N2","L","I1"],"eq":[{"cont":false,"items":[["M = \\dfrac{N_2}{I_1} \\times \\dfrac{\\mu S N_1 I_1}{l}"],["= \\dfrac{\\mu S N_1 N_2}{l}"]]}],"emphPre":["M","Mu","S","N1","N2","L","I1"]},{"text":"相互インダクタンスは、一次側と二次側の〖巻数の積に比例〗します。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["M","N1","N2","I1","S"],"eq":[{"cont":false,"items":[["M = \\dfrac{\\mu S N_1 N_2}{l}"]]}],"ans":true,"emphPre":["N1","N2","M","I1","S"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","lt1","lb1","n1t0","n1t1"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"I1":["ia1","ia1:h","i1t0","i1t1"],"E1":["ea1","ea1:h","e1t0","e1t1"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","lt2","lb2","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5"],"I2":["ia2","ia2:h","i2t0","i2t1"],"E2":["ea2","ea2:h","e2t0","e2t1"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"]},"moves":{"s":{"to":{"sd":1},"dur":0.6},"l":{"to":{"ld":1},"dur":0.8}},"route":["式の形","添字","鉄心とコイルで表す"]}},{"id":"t25s2x","scene":"t25s2x","kind":"u25s2tc","lab":{"w1":"r","w2":"r","n1":"{N}_1=100","n2":"{N}_2=200","i1":"{I}_1=2 A","i1e":"top","phi1":"{Φ}_1=0.003 Wb","phi1a":"ccw","m":["{M}","{M}=0.3 H"]},"viewbox":"88 63 906 654","band":{"want":"相互インダクタンス $M$","known":"$N_1 = 100,\\;\\; N_2 = 200,\\;\\; I_1 = 2\\,\\mathrm{A},\\;\\; \\Phi_1 = 0.003\\,\\mathrm{Wb}$","ans":"$M = 0.3\\,\\mathrm{H}$"},"narr":{"start":{"co":1,"i1d":1,"phi1d":1,"mv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、相互インダクタンス $M$ です。","at":{"強調":1.0},"after":[],"emph":["M"]},{"text":"①使う巻数\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"電流と磁束は一次側の物を使います。巻数は、〖起電力が生じる二次側〗の $N_2 = 200$ を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["M","N2","Phi1","I1"],"eq":[{"cont":false,"items":[["M = \\dfrac{N_2 \\Phi_1}{I_1}"]]}],"emphPre":["N2","I1","Phi1"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$N_2 = 200$、$\\Phi_1 = 0.003$、$I_1 = 2$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["M","N2","Phi1","I1"],"eq":[{"cont":false,"items":[["M = \\dfrac{200 \\times 0.003}{2}"],["= \\dfrac{0.6}{2} = 0.3\\,\\mathrm{H}"]]}],"move":"mv","ans":true,"emphPre":["N2","Phi1","I1","M"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","lt1","lb1","n1t0","n1t1"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"I1":["ia1","ia1:h","i1t0","i1t1"],"E1":["ea1","ea1:h","e1t0","e1t1"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","lt2","lb2","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5"],"I2":["ia2","ia2:h","i2t0","i2t1"],"E2":["ea2","ea2:h","e2t0","e2t1"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"]},"moves":{"mv":{"to":{"mv":1},"dur":0.4}},"route":["使う巻数","数を入れる"]}},{"id":"t25s3e","scene":"t25s3e","kind":"u25s3tc","lab":{"w1":"r","w2":"r","l1":"{L}_1","l2":"{L}_2","m":"{M}","i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw","kc":"{k}","lk":"漏れ磁束"},"viewbox":"-89 109 1184 568","band":{"want":"相互インダクタンスと自己インダクタンスの関係","ans":"$M = k\\sqrt{L_1 L_2}$","full":"M = k√(L1 L2)。k は結合係数で、片方のコイルの磁束のうち何割がもう片方に鎖交するかを表す。全部鎖交すれば k = 1。鎖交せずに逃げる磁束が漏れ磁束で、1 割が逃げれば k = 0.9。"},"narr":{"start":{"co":1,"i1d":1,"phi1d":0,"lkd":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①式\n②結合係数\n③漏れ磁束\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"相互インダクタンスは、自己インダクタンス $L_1$・$L_2$ と、〖結合係数 $k$〗で表せます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["M","Kc","L1","L2"],"eq":[{"cont":false,"items":[["M = k\\sqrt{L_1 L_2}"]]}],"emphPre":["M","L1","L2","Kc"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"結合係数は、片方のコイルで生じた磁束のうち、〖何割がもう片方に鎖交するか〗を表します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"phi1","emph":["Kc","Phi1"]},{"text":"磁束が全部もう片方に鎖交すれば、$k = 1$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["M","L1","L2"],"eq":[{"cont":false,"items":[["M = \\sqrt{L_1 L_2}"]]}],"emphPre":["Kc"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"鎖交せずに逃げていく磁束を、〖漏れ磁束〗といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"lk","emph":["Lk"]},{"text":"磁束の 1 割が漏れ磁束として逃げれば、鎖交するのは 9 割なので、$k = 0.9$ です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Kc"],"eq":[{"cont":false,"items":[["k = 1 - 0.1 = 0.9"]]}],"ans":true,"emphPre":["Lk","Kc"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","lt1","lb1","n1t0","n1t1"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"I1":["ia1","ia1:h","i1t0","i1t1"],"E1":["ea1","ea1:h","e1t0","e1t1"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","lt2","lb2","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5"],"I2":["ia2","ia2:h","i2t0","i2t1"],"E2":["ea2","ea2:h","e2t0","e2t1"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"]},"moves":{"phi1":{"to":{"phi1d":1},"dur":0.8},"lk":{"to":{"lkd":1},"dur":0.8}},"route":["式","結合係数","漏れ磁束"]}},{"id":"t25s3x","scene":"t25s3x","kind":"u25s3tc","lab":{"w1":"r","w2":"r","l1":"{L}_1=0.8 H","l2":"{L}_2=0.2 H","m":["{M}","{M}=0.2 H"],"i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw","kc":"{k}=0.5"},"viewbox":"-89 109 1184 568","band":{"want":"相互インダクタンス $M$","known":"$L_1 = 0.8\\,\\mathrm{H},\\;\\; L_2 = 0.2\\,\\mathrm{H},\\;\\; k = 0.5$","ans":"$M = 0.2\\,\\mathrm{H}$"},"narr":{"start":{"co":1,"i1d":1,"phi1d":1,"mv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、相互インダクタンス $M$ です。","at":{"強調":1.0},"after":[],"emph":["M"]},{"text":"①式を書く\n②ルートを先に\n③結合係数を掛ける\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスと結合係数が分かっているので、この式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["M","Kc","L1","L2"],"eq":[{"cont":false,"items":[["M = k\\sqrt{L_1 L_2}"]]}],"emphPre":["M","Kc","L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"先に、〖ルートの中〗を計算します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["L1","L2"],"eq":[{"cont":false,"items":[["\\sqrt{0.8 \\times 0.2} = \\sqrt{0.16} = 0.4"]]}],"emphPre":["L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"結合係数 $0.5$ を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["M","Kc","L1","L2"],"eq":[{"cont":false,"items":[["M = 0.5 \\times 0.4 = 0.2\\,\\mathrm{H}"]]}],"move":"mv","ans":true,"emphPre":["Kc"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","lt1","lb1","n1t0","n1t1"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"I1":["ia1","ia1:h","i1t0","i1t1"],"E1":["ea1","ea1:h","e1t0","e1t1"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","lt2","lb2","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5"],"I2":["ia2","ia2:h","i2t0","i2t1"],"E2":["ea2","ea2:h","e2t0","e2t1"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"]},"moves":{"mv":{"to":{"mv":1},"dur":0.4}},"route":["式を書く","ルートを先に","結合係数を掛ける"]}},{"id":"t25s4e","scene":"t25s4e","kind":"u25s4tc","lab":{"ser":true,"w1":"r","w2":["r","l"],"j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":["{L}=L_1+L_2+2M","{L}=L_1+L_2-2M"],"phi1":"","phi1a":"ccw","phi2":"","phi2a":["ccw","cw"]},"viewbox":"-112 105 1324 706","band":{"want":"直列につないだ2つのコイルの合成インダクタンス","ans":"和動 $L_1 + L_2 + 2M$、差動 $L_1 + L_2 - 2M$","full":"2つのコイルが同じ向きに磁束を生じるつなぎ方が和動接続で L = L1 + L2 + 2M。打ち消し合う向きが差動接続で L = L1 + L2 - 2M。2M なのは、L1 から L2 と L2 から L1 の2つの影響があるから。磁束の向きは右ねじの法則で決まる。"},"narr":{"start":{"co":1,"phi1d":0,"phi2d":0,"w2v":0,"ltv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①和動接続\n②2M の理由\n③差動接続\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"2つのコイルを直列につなぎ、端子 a から電流を流します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ta","Tb","I"]},{"text":"右ねじの法則で、それぞれのコイルの磁束の向きを見ます。2つとも同じ向きに回っています。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"phi","emph":["Phi1","Phi2"]},{"text":"2つのコイルが同じ向きに磁束を生じるつなぎ方を、〖和動接続〗といいます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Lt","L1","L2","M"],"eq":[{"cont":false,"items":[["L = L_1 + L_2 + 2M"]]}],"emphPre":["Phi1","Phi2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$M$ が2倍なのは、$L_1$ の磁束が $L_2$ に与える影響と、$L_2$ の磁束が $L_1$ に与える影響の、〖2つがある〗からです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["M","L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"右のコイルの巻き方を逆にします。右のコイルの磁束は、逆向きに回ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"w2","emph":["W2","Phi2"]},{"text":"互いの磁束を打ち消し合うつなぎ方を、〖差動接続〗といいます。影響が引かれます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Lt","L1","L2","M"],"eq":[{"cont":false,"items":[["L = L_1 + L_2 - 2M"]]}],"emphPre":["Phi1","Phi2","Lt"]},{"text":"磁束の向きが同じなら和動、逆なら差動です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Lt","M","L1","L2"],"eq":[{"cont":false,"items":[["\\text{和動}\\;\\; L_1 + L_2 + 2M","\\text{差動}\\;\\; L_1 + L_2 - 2M"]]}],"ans":true,"emphPre":["Phi1","Phi2","L1","L2"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","n1t0","n1t1","s1t","s1b"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","s2a","s2b"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Ta":["tma","at0","at1"],"Tb":["tmb","bt0","bt1"],"I":["ia","ia:h","it0","it1"],"Lt":["ltt0","ltt1"]},"moves":{"phi":{"to":{"phi1d":1,"phi2d":1},"dur":0.8},"w2":{"to":{"w2v":1,"ltv":1},"dur":0.8}},"route":["和動接続","2M の理由","差動接続"]}},{"id":"t25s4x","scene":"t25s4x","kind":"u25s4tc","lab":{"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1=0.5 H","l2":"{L}_2=0.3 H","m":"{M}=0.1 H","lt":["{L}","{L}=1 H"],"phi1":"","phi1a":"ccw","phi2":"","phi2a":"ccw"},"viewbox":"-112 105 1324 706","band":{"want":"合成インダクタンス $L$","known":"$L_1 = 0.5\\,\\mathrm{H},\\;\\; L_2 = 0.3\\,\\mathrm{H},\\;\\; M = 0.1\\,\\mathrm{H}$","ans":"$L = 1\\,\\mathrm{H}$"},"narr":{"start":{"co":1,"phi1d":0,"phi2d":0,"ltv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、端子 a と b の間の、合成インダクタンス $L$ です。","at":{"強調":1.0},"after":[],"emph":["Lt"]},{"text":"①磁束の向き\n②式を選ぶ\n③数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"右ねじの法則で、2つのコイルの磁束の向きを見ます。同じ向きに回っています。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"phi","emph":["Phi1","Phi2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"向きが同じなので、〖和動接続〗です。$2M$ を足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Lt","L1","L2","M"],"eq":[{"cont":false,"items":[["L = L_1 + L_2 + 2M"]]}],"emphPre":["Lt","M"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$L_1 = 0.5$、$L_2 = 0.3$、$M = 0.1$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["Lt","L1","L2","M"],"eq":[{"cont":false,"items":[["L = 0.5 + 0.3 + 2 \\times 0.1","= 1\\,\\mathrm{H}"]]}],"move":"ltv","ans":true,"emphPre":["L1","L2","M"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","n1t0","n1t1","s1t","s1b"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","s2a","s2b"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Ta":["tma","at0","at1"],"Tb":["tmb","bt0","bt1"],"I":["ia","ia:h","it0","it1"],"Lt":["ltt0","ltt1"]},"moves":{"phi":{"to":{"phi1d":1,"phi2d":1},"dur":0.8},"ltv":{"to":{"ltv":1},"dur":0.4}},"route":["磁束の向き","式を選ぶ","数を入れる"]}},{"id":"t25s5e","scene":"t25s5e","kind":"u25s5co","lab":{"n":"","i":"{I}","phi":"","phia":"cw","ind":"{L}","w":"{W}"},"viewbox":"42 115 732 517","band":{"want":"コイルに蓄えられるエネルギー","ans":"$W = \\dfrac{1}{2} L I^2$","full":"電流を流したコイルには磁気エネルギーが蓄えられる。W = (1/2) L I²［J］。コンデンサの静電エネルギー W = (1/2) C V² と並べて覚える。"},"narr":{"start":{"co":1,"id":0,"phid":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①磁気エネルギー\n②式\n③静電エネルギーと並べる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"コイルに電流を流します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"i","emph":["I"]},{"text":"鉄心の中に磁束が生じます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"phi","emph":["I","Phi"]},{"text":"このとき、コイルにはエネルギーが蓄えられます。〖コイルの磁気エネルギー〗です。","at":{"強調":1.0},"after":[],"emph":["W","Ind"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"磁気エネルギーは、自己インダクタンスと電流の2乗で表します。単位は J です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["W","Ind","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2"]]}],"emphPre":["W","Ind","I"]},{"text":"〖電流は2乗〗です。電流を 2 倍にすると、エネルギーは 4 倍になります。","at":{"強調":1.0},"after":[],"emph":["I","W"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"コンデンサの静電エネルギーは、$\\dfrac{1}{2} C V^2$ でした。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":3,"emph":["W"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"]]}]},{"text":"$C$ が $L$ に、$V$ が $I$ に〖入れかわった形〗です。2つを並べて覚えます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["W","Ind","I"],"eq":[{"cont":false,"items":[["\\dfrac{1}{2} C V^2","\\dfrac{1}{2} L I^2"]]}],"ans":true,"emphPre":["W","Ind","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"i":{"to":{"id":1},"dur":0.6},"phi":{"to":{"phid":1},"dur":0.8}},"route":["磁気エネルギー","式","静電エネルギーと並べる"]}},{"id":"t25s5x","scene":"t25s5x","kind":"u25s5co","lab":{"n":"","i":"{I}=5 A","phi":"","phia":"cw","ind":"{L}=0.4 H","w":["{W}","{W}=5 J"]},"viewbox":"42 115 732 517","band":{"want":"コイルに蓄えられるエネルギー $W$","known":"$L = 0.4\\,\\mathrm{H},\\;\\; I = 5\\,\\mathrm{A}$","ans":"$W = 5\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"id":1,"phid":1,"wv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、コイルに蓄えられる磁気エネルギー $W$ です。","at":{"強調":1.0},"after":[],"emph":["W"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"磁気エネルギーの式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W","Ind","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2"]]}],"emphPre":["W","Ind","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$L = 0.4$、$I = 5$ を入れます。〖電流を先に2乗〗します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["W","Ind","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} \\times 0.4 \\times 5^2"],["= 0.2 \\times 25 = 5\\,\\mathrm{J}"]]}],"move":"wv","ans":true,"emphPre":["Ind","I","W"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"wv":{"to":{"wv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}}],"secs":[{"ex":{"text":"相互インダクタンス $0.2\\,\\mathrm{H}$ の2つのコイルがある。一次側の電流が $0.1\\,\\mathrm{s}$ の間に $3\\,\\mathrm{A}$ 変わった。二次側に生じる誘導起電力の大きさは何 V か。","fig":{"kind":"u25s1tc","L":{"w1":"r","w2":"r","n1":"一次側","n2":"二次側","m":"{M}=0.2 H","i1":"Δ{I}_1=3 A","i1e":"top","phi1":"","phi1a":"ccw","e2":"{e}_2"},"P":{}},"ch":[{"t":"$0.06\\,\\mathrm{V}$","v":0.06,"why":"時間で割るところを掛けた"},{"t":"$30\\,\\mathrm{V}$","v":30,"why":"相互インダクタンスを掛けていない"},{"t":"$6\\,\\mathrm{V}$","v":6,"why":""},{"t":"$0.6\\,\\mathrm{V}$","v":0.6,"why":"時間で割っていない"}],"ans":2}},{"ex":{"text":"一次側の巻数 100、二次側の巻数 200 の2つのコイルがある。一次側に $2\\,\\mathrm{A}$ の電流を流すと、$0.003\\,\\mathrm{Wb}$ の磁束が生じ、その全部が二次側に鎖交した。相互インダクタンスは何 H か。","fig":{"kind":"u25s2tc","L":{"w1":"r","w2":"r","n1":"{N}_1=100","n2":"{N}_2=200","i1":"{I}_1=2 A","i1e":"top","phi1":"{Φ}_1=0.003 Wb","phi1a":"ccw","m":"{M}"},"P":{}},"ch":[{"t":"$0.15\\,\\mathrm{H}$","v":"0.15","why":"一次側の巻数を使った。巻数は起電力が生じる二次側"},{"t":"$0.3\\,\\mathrm{H}$","v":"0.3","why":""},{"t":"$1.2\\,\\mathrm{H}$","v":"1.2","why":"電流で割るところを掛けた"},{"t":"$0.6\\,\\mathrm{H}$","v":"0.6","why":"電流で割っていない"}],"ans":1}},{"ex":{"text":"自己インダクタンスが $0.8\\,\\mathrm{H}$ と $0.2\\,\\mathrm{H}$ の2つのコイルがあり、結合係数は $0.5$ である。相互インダクタンスは何 H か。","fig":{"kind":"u25s3tc","L":{"w1":"r","w2":"r","l1":"{L}_1=0.8 H","l2":"{L}_2=0.2 H","m":"{M}","i1":"{I}_1","i1e":"top","phi1":"","phi1a":"ccw","kc":"{k}=0.5"},"P":{}},"ch":[{"t":"$0.08\\,\\mathrm{H}$","v":"0.08","why":"ルートを取っていない"},{"t":"$0.4\\,\\mathrm{H}$","v":"0.4","why":"結合係数を掛けていない"},{"t":"$0.2\\,\\mathrm{H}$","v":"0.2","why":""},{"t":"$0.5\\,\\mathrm{H}$","v":"0.5","why":"掛けるところを足した"}],"ans":2}},{"ex":{"text":"自己インダクタンス $0.5\\,\\mathrm{H}$ と $0.3\\,\\mathrm{H}$ のコイルを、和動接続になるように直列につないだ。相互インダクタンスが $0.1\\,\\mathrm{H}$ の時、合成インダクタンスは何 H か。","fig":{"kind":"u25s4tc","L":{"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1=0.5 H","l2":"{L}_2=0.3 H","m":"{M}=0.1 H","lt":"{L}"},"P":{}},"ch":[{"t":"$0.9\\,\\mathrm{H}$","v":"0.9","why":"$M$ を1つしか足していない。影響は2つある"},{"t":"$0.6\\,\\mathrm{H}$","v":"0.6","why":"それは差動接続。和動は $2M$ を足す"},{"t":"$1\\,\\mathrm{H}$","v":"1","why":""},{"t":"$0.8\\,\\mathrm{H}$","v":"0.8","why":"相互インダクタンスを足していない"}],"ans":2}},{"ex":{"text":"自己インダクタンス $0.4\\,\\mathrm{H}$ のコイルに $5\\,\\mathrm{A}$ の電流を流した。コイルに蓄えられるエネルギーは何 J か。","fig":{"kind":"u25s5co","L":{"n":"","i":"{I}=5 A","phi":"","phia":"cw","ind":"{L}=0.4 H","w":"{W}"},"P":{}},"ch":[{"t":"$1\\,\\mathrm{J}$","v":"1","why":"電流を2乗していない"},{"t":"$10\\,\\mathrm{J}$","v":"10","why":"$\\dfrac{1}{2}$ を掛けていない"},{"t":"$5\\,\\mathrm{J}$","v":"5","why":""},{"t":"$2.5\\,\\mathrm{J}$","v":"2.5","why":"2乗するところを 2 で割った"}],"ans":2}}],"past":[]}};
});
