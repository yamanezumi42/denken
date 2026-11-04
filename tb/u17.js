/* 単元17「コンデンサ」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(17, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, ZC = H.ZC, zband = H.zband, ztint = H.ztint, zpt = H.zpt, zones = H.zones, vOn = H.vOn, zoneTint = H.zoneTint, zSides = H.zSides, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
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
// ---- 17-1 電荷と電圧 の図（※ textbook/gen/make_section.py が textbook/gen/data/u17_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U17S1K = {
  ch: {"vars":[["s","swc",1]],"items":[{"t":"z","id":"zbu17s1ch0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[594.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu17s1ch1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[894.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu17s1ch2hi","z":"hi","lines":[[[662.67,360],[834.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u17s1chL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u17s1chRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u17s1chw1","pts":[[478,360],[594.67,360]],"vis":[],"dash":0},{"t":"w","id":"u17s1chw2","pts":[[662.67,360],[834.33,360]],"vis":[],"dash":0},{"t":"w","id":"u17s1chw3","pts":[[894.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"s","k":"sw","dir":"h","x0":594.67,"y0":360,"x1":662.67,"y1":360,"v":1,"vis":[]},{"t":"cap","k":"c","x":864.33,"y":360,"dir":"h","vis":[],"lab":[864.33,323.5,null],"fh":1,"q":"q","f":"cap","F":28.4},{"t":"v","k":"v","x":864.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c","lab":[864.33,255.21,null]}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[594.67,360]]},{"I":1,"pts":[[662.67,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src","v"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["C","sw","P","n1",0,[1]],["R","c","n1","N",1,[]]]},
  cv: {"vars":[],"items":[{"t":"z","id":"zbu17s1cv0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu17s1cv1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u17s1cvL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u17s1cvRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u17s1cvw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u17s1cvw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,324.34,null],"fh":1,"q":"q","f":"cap","F":27},{"t":"v","k":"v","x":761.5,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c","lab":[761.5,255.96,null]}],"flows":[],"base":110,"von":["src","v"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]}
};
function tbU17s1ch(d, p, L){ tbFig_Draw(d, p, L, U17S1K.ch); }
function tbU17s1cv(d, p, L){ tbFig_Draw(d, p, L, U17S1K.cv); }
// ---- 17-2 平行平板コンデンサ の図（※ textbook/gen/make_section.py が textbook/gen/data/u17_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U17S2K = {
  pl: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":314,"y":195,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":308,"y":266,"anc":"start"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":300,"y":594,"anc":"start"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU17s2pl(d, p, L){ tbFig_Draw(d, p, L, U17S2K.pl); }
// ---- 17-3 コンデンサの直列 の図（※ textbook/gen/make_section.py が textbook/gen/data/u17_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U17S3K = {
  ser: {"vars":[["m","cm","c12"]],"items":[{"t":"z","id":"zbu17s3ser0hi","z":"hi","lines":[[[478,360],[478,560],[752,560]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu17s3ser1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu17s3ser2hi","z":"hi","lines":[[[478,360],[608.67,360]]],"vis":[-1],"pts":[],"node":"P"},{"t":"z","id":"zbu17s3ser3mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu17s3ser4lo","z":"lo","lines":[[[914.33,360],[1045,360]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu17s3ser5hi","z":"hi","lines":[[[478,360],[731.5,360]]],"vis":[1],"pts":[],"node":"P"},{"t":"z","id":"zbu17s3ser6lo","z":"lo","lines":[[[791.5,360],[1045,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"w","id":"u17s3serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u17s3serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u17s3serw1","pts":[[478,360],[608.67,360]],"vis":[-1],"dash":0},{"t":"w","id":"u17s3serw2","pts":[[668.67,360],[854.33,360]],"vis":[-1],"dash":0},{"t":"w","id":"u17s3serw3","pts":[[914.33,360],[1045,360]],"vis":[-1],"dash":0},{"t":"w","id":"u17s3serw4","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u17s3serw5","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[-1],"lab":[638.67,323.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[-1],"elem":"c1"},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[-1],"lab":[884.33,323.5,null],"fh":1,"q":"q2","f":"cap","F":28.4},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[-1],"elem":"c2"},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"dim","k":"cab","x1":478,"y1":380,"x2":1045,"y2":380,"ya":408,"yt":418,"ly":428.79,"vis":[]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[-1]],["R","c2","n1","N",1,[-1]],["R","c12","P","N",1,[1]]]},
  ser3: {"vars":[],"items":[{"t":"z","id":"zbu17s3ser30hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[557.25,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu17s3ser31lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[965.75,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu17s3ser32mid","z":"mid","lines":[[[617.25,360],[731.5,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu17s3ser33mid2","z":"mid2","lines":[[[791.5,360],[905.75,360]]],"vis":[],"pts":[],"node":"n2"},{"t":"w","id":"u17s3ser3L","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u17s3ser3Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u17s3ser3w1","pts":[[478,360],[557.25,360]],"vis":[],"dash":0},{"t":"w","id":"u17s3ser3w2","pts":[[617.25,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u17s3ser3w3","pts":[[791.5,360],[905.75,360]],"vis":[],"dash":0},{"t":"w","id":"u17s3ser3w4","pts":[[965.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":587.25,"y":360,"dir":"h","vis":[],"lab":[587.25,324.34,null],"fh":1,"q":"q1","f":"cap","F":27},{"t":"cap","k":"c2","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,324.34,null],"fh":1,"q":"q2","f":"cap","F":27},{"t":"cap","k":"c3","x":935.75,"y":360,"dir":"h","vis":[],"lab":[935.75,324.34,null],"fh":1,"f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","n2",1,[]],["R","c3","n2","N",1,[]]]}
};
function tbU17s3ser(d, p, L){ tbFig_Draw(d, p, L, U17S3K.ser); }
function tbU17s3ser3(d, p, L){ tbFig_Draw(d, p, L, U17S3K.ser3); }
// ---- 17-4 直列の電圧 の図（※ textbook/gen/make_section.py が textbook/gen/data/u17_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U17S4K = {
  ser: {"vars":[],"items":[{"t":"z","id":"zbu17s4ser0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[608.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu17s4ser1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[914.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu17s4ser2mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u17s4serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u17s4serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u17s4serw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u17s4serw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u17s4serw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,323.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1","lab":[638.67,255.21,null]},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,323.5,null],"fh":1,"q":"q2","f":"cap","F":28.4},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[884.33,255.21,null]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]}
};
function tbU17s4ser(d, p, L){ tbFig_Draw(d, p, L, U17S4K.ser); }
// ---- 17-5 コンデンサの並列 の図（※ textbook/gen/make_section.py が textbook/gen/data/u17_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U17S5K = {
  par: {"vars":[["m","cm","c12"]],"items":[{"t":"z","id":"zbu17s5par0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[528,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu17s5par1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu17s5par2hi","z":"hi","lines":[[[731.5,280],[528,280],[528,440],[731.5,440]]],"vis":[-1],"pts":[],"node":"P"},{"t":"z","id":"zbu17s5par3lo","z":"lo","lines":[[[791.5,280],[995,280],[995,440],[791.5,440]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu17s5par4hi","z":"hi","lines":[[[528,360],[731.5,360]]],"vis":[1],"pts":[],"node":"P"},{"t":"z","id":"zbu17s5par5lo","z":"lo","lines":[[[791.5,360],[995,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"w","id":"u17s5parL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u17s5parRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u17s5parw1","pts":[[528,280],[528,440]],"vis":[-1],"dash":0},{"t":"w","id":"u17s5parw2","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u17s5parw3","pts":[[528,280],[731.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u17s5parw4","pts":[[791.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u17s5parw5","pts":[[528,440],[731.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u17s5parw6","pts":[[791.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u17s5parw7","pts":[[528,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u17s5parw8","pts":[[791.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u17s5parw9","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u17s5parw10","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":761.5,"y":280,"dir":"h","vis":[-1],"lab":[761.5,243.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"v","k":"v1","x":761.5,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[-1],"elem":"c1","lab":[761.5,175.21,null]},{"t":"cap","k":"c2","x":761.5,"y":440,"dir":"h","vis":[-1],"lab":[761.5,403.5,null],"fh":1,"q":"q2","f":"cap","F":28.4},{"t":"v","k":"v2","x":761.5,"y":440,"dir":"h","side":-1,"hi":-1,"vis":[-1],"elem":"c2","lab":[761.5,335.21,null]},{"t":"d","id":"u17s5parj113","x":528,"y":360,"vis":[-1]},{"t":"d","id":"u17s5parj214","x":995,"y":360,"vis":[-1]},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,329.5,null],"fh":1,"f":"cap","F":28.4}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","N",1,[-1]],["R","c2","P","N",1,[-1]],["R","c12","P","N",1,[1]]]},
  cmp: {"vars":[],"items":[{"f":"c","id":"rta","cx":490,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[],"t":"F"},{"f":"c","id":"rtb","cx":730,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rs0","pts":[[493.6,384],[550,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rs1","pts":[[586,384],[634,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rs2","pts":[[670,384],[726.4,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"r1","pts":[[550,376.8],[586,376.8],[586,391.2],[550,391.2]],"close":1,"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"r2","pts":[[634,376.8],[670,376.8],[670,391.2],[634,391.2]],"close":1,"no":["u"],"vis":[],"t":"F"},{"f":"c","id":"rpa","cx":490,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[],"t":"F"},{"f":"c","id":"rpb","cx":730,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rp0","pts":[[493.6,390],[526,390],[526,354],[592,354]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rp1","pts":[[526,390],[526,426],[592,426]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rp2","pts":[[628,354],[694,354],[694,390],[726.4,390]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"rp3","pts":[[628,426],[694,426],[694,390]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"r1p","pts":[[592,346.8],[628,346.8],[628,361.2],[592,361.2]],"close":1,"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"r2p","pts":[[592,418.8],[628,418.8],[628,433.2],[592,433.2]],"close":1,"o":["u"],"vis":[],"t":"F"},{"f":"c","id":"cta","cx":790,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[],"t":"F"},{"f":"c","id":"ctb","cx":1030,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cs0","pts":[[793.6,384],[850,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cs1","pts":[[886,384],[934,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cs2","pts":[[970,384],[1026.4,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c1l","pts":[[850,384],[862,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c2l","pts":[[958,384],[970,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cs1","pts":[[862,366],[862,402]],"w":5,"vis":[],"t":"F","no":["u"]},{"f":"ln","id":"cs1:b","pts":[[874,366],[874,402]],"w":5,"vis":[],"t":"F","no":["u"]},{"f":"ln","id":"cs2","pts":[[946,366],[946,402]],"w":5,"vis":[],"t":"F","no":["u"]},{"f":"ln","id":"cs2:b","pts":[[958,366],[958,402]],"w":5,"vis":[],"t":"F","no":["u"]},{"f":"ln","id":"cs1w","pts":[[874,384],[886,384]],"no":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cs2w","pts":[[934,384],[946,384]],"no":["u"],"vis":[],"t":"F"},{"f":"c","id":"cpa","cx":790,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[],"t":"F"},{"f":"c","id":"cpb","cx":1030,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cp0","pts":[[793.6,390],[826,390],[826,354],[892,354]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cp1","pts":[[826,390],[826,426],[892,426]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cp2","pts":[[928,354],[994,354],[994,390],[1026.4,390]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"cp3","pts":[[928,426],[994,426],[994,390]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c1pl","pts":[[892,354],[904,354]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c1pr","pts":[[916,354],[928,354]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c1p","pts":[[904,339],[904,369]],"w":5,"vis":[],"t":"F","o":["u"]},{"f":"ln","id":"c1p:b","pts":[[916,339],[916,369]],"w":5,"vis":[],"t":"F","o":["u"]},{"f":"ln","id":"c2pl","pts":[[892,426],[904,426]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c2pr","pts":[[916,426],[928,426]],"o":["u"],"vis":[],"t":"F"},{"f":"ln","id":"c2p","pts":[[904,411],[904,441]],"w":5,"vis":[],"t":"F","o":["u"]},{"f":"ln","id":"c2p:b","pts":[[916,411],[916,441]],"w":5,"vis":[],"t":"F","o":["u"]}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pe: {"vars":[["m","cm","c12"],["a","t",0],["a","t",1]],"items":[{"t":"z","id":"zbu17s5pe0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[528,360]]],"vis":[2],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu17s5pe1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]]],"vis":[2],"pts":[],"node":"L0:N"},{"t":"z","id":"zbu17s5pe2hi","z":"hi","lines":[[[731.5,280],[528,280],[528,440],[731.5,440]]],"vis":[-1,2],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu17s5pe3lo","z":"lo","lines":[[[791.5,280],[995,280],[995,440],[791.5,440]]],"vis":[-1,2],"pts":[],"node":"L0:N"},{"t":"z","id":"zbu17s5pe4hi","z":"hi","lines":[[[528,360],[731.5,360]]],"vis":[1,2],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu17s5pe5lo","z":"lo","lines":[[[791.5,360],[995,360]]],"vis":[1,2],"pts":[],"node":"L0:N"},{"t":"w","id":"u17s5peL","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u17s5peRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u17s5pew1","pts":[[528,280],[528,440]],"vis":[-1,2],"dash":0},{"t":"w","id":"u17s5pew2","pts":[[995,280],[995,440]],"vis":[-1,2],"dash":0},{"t":"w","id":"u17s5pew3","pts":[[528,280],[731.5,280]],"vis":[-1,2],"dash":0},{"t":"w","id":"u17s5pew4","pts":[[791.5,280],[995,280]],"vis":[-1,2],"dash":0},{"t":"w","id":"u17s5pew5","pts":[[528,440],[731.5,440]],"vis":[-1,2],"dash":0},{"t":"w","id":"u17s5pew6","pts":[[791.5,440],[995,440]],"vis":[-1,2],"dash":0},{"t":"w","id":"u17s5pew7","pts":[[528,360],[731.5,360]],"vis":[1,2],"dash":0},{"t":"w","id":"u17s5pew8","pts":[[791.5,360],[995,360]],"vis":[1,2],"dash":0},{"t":"w","id":"u17s5pew9","pts":[[478,360],[528,360]],"vis":[2],"dash":0},{"t":"w","id":"u17s5pew10","pts":[[995,360],[1045,360]],"vis":[2],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":761.5,"y":280,"dir":"h","vis":[-1,2],"lab":[761.5,243.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"v","k":"v1","x":761.5,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[-1,2],"elem":"c1","lab":[761.5,175.21,null]},{"t":"cap","k":"c2","x":761.5,"y":440,"dir":"h","vis":[-1,2],"lab":[761.5,403.5,null],"fh":1,"q":"q2","f":"cap","F":28.4},{"t":"v","k":"v2","x":761.5,"y":440,"dir":"h","side":-1,"hi":-1,"vis":[-1,2],"elem":"c2","lab":[761.5,335.21,null]},{"t":"d","id":"u17s5pej113","x":528,"y":360,"vis":[-1,2]},{"t":"d","id":"u17s5pej214","x":995,"y":360,"vis":[-1,2]},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1,2],"lab":[761.5,329.5,null],"fh":1,"f":"cap","F":28.4},{"f":"c","id":"rtax1","cx":490,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[3],"t":"F"},{"f":"c","id":"rtbx1","cx":730,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rs0x1","pts":[[493.6,384],[550,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rs1x1","pts":[[586,384],[634,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rs2x1","pts":[[670,384],[726.4,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"r1x1","pts":[[550,376.8],[586,376.8],[586,391.2],[550,391.2]],"close":1,"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"r2x1","pts":[[634,376.8],[670,376.8],[670,391.2],[634,391.2]],"close":1,"no":["u"],"vis":[3],"t":"F"},{"f":"c","id":"rpax1","cx":490,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[3],"t":"F"},{"f":"c","id":"rpbx1","cx":730,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rp0x1","pts":[[493.6,390],[526,390],[526,354],[592,354]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rp1x1","pts":[[526,390],[526,426],[592,426]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rp2x1","pts":[[628,354],[694,354],[694,390],[726.4,390]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"rp3x1","pts":[[628,426],[694,426],[694,390]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"r1px1","pts":[[592,346.8],[628,346.8],[628,361.2],[592,361.2]],"close":1,"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"r2px1","pts":[[592,418.8],[628,418.8],[628,433.2],[592,433.2]],"close":1,"o":["u"],"vis":[3],"t":"F"},{"f":"c","id":"ctax1","cx":790,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[3],"t":"F"},{"f":"c","id":"ctbx1","cx":1030,"cy":384,"r":6,"fill":"w","no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cs0x1","pts":[[793.6,384],[850,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cs1x1","pts":[[886,384],[934,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cs2x1","pts":[[970,384],[1026.4,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c1lx1","pts":[[850,384],[862,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c2lx1","pts":[[958,384],[970,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cs1x1","pts":[[862,366],[862,402]],"w":5,"vis":[3],"t":"F","no":["u"]},{"f":"ln","id":"cs1:bx1","pts":[[874,366],[874,402]],"w":5,"vis":[3],"t":"F","no":["u"]},{"f":"ln","id":"cs2x1","pts":[[946,366],[946,402]],"w":5,"vis":[3],"t":"F","no":["u"]},{"f":"ln","id":"cs2:bx1","pts":[[958,366],[958,402]],"w":5,"vis":[3],"t":"F","no":["u"]},{"f":"ln","id":"cs1wx1","pts":[[874,384],[886,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cs2wx1","pts":[[934,384],[946,384]],"no":["u"],"vis":[3],"t":"F"},{"f":"c","id":"cpax1","cx":790,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[3],"t":"F"},{"f":"c","id":"cpbx1","cx":1030,"cy":390,"r":6,"fill":"w","o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cp0x1","pts":[[793.6,390],[826,390],[826,354],[892,354]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cp1x1","pts":[[826,390],[826,426],[892,426]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cp2x1","pts":[[928,354],[994,354],[994,390],[1026.4,390]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"cp3x1","pts":[[928,426],[994,426],[994,390]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c1plx1","pts":[[892,354],[904,354]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c1prx1","pts":[[916,354],[928,354]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c1px1","pts":[[904,339],[904,369]],"w":5,"vis":[3],"t":"F","o":["u"]},{"f":"ln","id":"c1p:bx1","pts":[[916,339],[916,369]],"w":5,"vis":[3],"t":"F","o":["u"]},{"f":"ln","id":"c2plx1","pts":[[892,426],[904,426]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c2prx1","pts":[[916,426],[928,426]],"o":["u"],"vis":[3],"t":"F"},{"f":"ln","id":"c2px1","pts":[[904,411],[904,441]],"w":5,"vis":[3],"t":"F","o":["u"]},{"f":"ln","id":"c2p:bx1","pts":[[916,411],[916,441]],"w":5,"vis":[3],"t":"F","o":["u"]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","L0:P","L0:N",1,[2]],["R","c1","L0:P","L0:N",1,[-1,2]],["R","c2","L0:P","L0:N",1,[-1,2]],["R","c12","L0:P","L0:N",1,[1,2]]]}
};
function tbU17s5par(d, p, L){ tbFig_Draw(d, p, L, U17S5K.par); }
function tbU17s5cmp(d, p, L){ tbFig_Draw(d, p, L, U17S5K.cmp); }
function tbU17s5pe(d, p, L){ tbFig_Draw(d, p, L, U17S5K.pe); }
// ---- 17-6 誘電体の入れ方 の図（※ textbook/gen/make_section.py が textbook/gen/data/u17_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U17S6K = {
  full: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":314,"y":269,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":308,"y":266,"anc":"start"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":300,"y":594,"anc":"start"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  half: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[550,305],[800,305],[800,555],[550,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[675,430,"middle",[0,-1]],[564,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":620,"y":269,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":308,"y":266,"anc":"start"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":300,"y":594,"anc":"start"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"},{"f":"ln","id":"cut","pts":[[550,306],[550,554]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"lb","id":"cat","k":"ca","bases":[[425,600,"middle",[0,1]]],"need":"ca","vis":[],"t":"F","x":425,"y":600,"anc":"middle"},{"f":"lb","id":"cbt","k":"cb","bases":[[675,600,"middle",[0,1]]],"need":"cb","vis":[],"t":"F","x":675,"y":600,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  layer: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,365],[800,365],[800,495],[300,495]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,395,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":314,"y":185,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":274,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,365],[800,365]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"cut2","pts":[[300,495],[800,495]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"lb","id":"cat","k":"ca","bases":[[280,332.5,"end",[-1,0]]],"need":"ca","vis":[],"t":"F","x":274,"y":256.5,"anc":"end"},{"f":"lb","id":"cbt","k":"cb","bases":[[280,430,"end",[-1,0]]],"need":"cb","vis":[],"t":"F","x":140,"y":430,"anc":"end"},{"f":"ln","id":"te1","pts":[[816,365],[984,365]],"w":2,"need":"t","vis":[],"t":"F"},{"f":"ln","id":"te2","pts":[[816,495],[984,495]],"w":2,"need":"t","vis":[],"t":"F"},{"f":"ar","id":"td","x0":970,"y0":365,"x1":970,"y1":495,"two":1,"w":2,"need":"t","vis":[],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[986,430,"start",[1,0]],[954,430,"end",[-1,0]]],"need":"t","vis":[],"t":"F","x":986,"y":430,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  dz: {"vars":[["a","t",0],["a","t",1],["a","t",2]],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[1],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[1],"t":"F","x":314,"y":185,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[1],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[1],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[1],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[1],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[1],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[1],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[1],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[1],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[1],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[1],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[1],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[1],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[1],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[1],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[1],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[1],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[1],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[1],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[1],"t":"F","x":274,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[1],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[1],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[1],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[1],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[1],"t":"F","x":618,"y":471,"anc":"start"},{"f":"ln","id":"medfx1","pts":[[550,305],[800,305],[800,555],[550,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[2],"t":"F"},{"f":"lb","id":"medtx1","k":"med","bases":[[675,430,"middle",[0,-1]],[564,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[2],"t":"F","x":564,"y":185,"anc":"start","n":"medx1"},{"f":"ln","id":"ztx1","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[2],"t":"F"},{"f":"ln","id":"zbx1","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[2],"t":"F"},{"f":"ln","id":"topx1","pts":[[300,300],[800,300]],"w":8,"vis":[2],"t":"F"},{"f":"ln","id":"botx1","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[2],"t":"F"},{"f":"lb","id":"toptx1","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[2],"t":"F","x":280,"y":260,"anc":"end","n":"topx1"},{"f":"lb","id":"bottx1","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[2],"t":"F","x":280,"y":520,"anc":"end","n":"botx1"},{"f":"ln","id":"de1x1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[2],"t":"F"},{"f":"ln","id":"de2x1","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[2],"t":"F"},{"f":"ar","id":"ddx1","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[2],"t":"F"},{"f":"lb","id":"dtx1","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[2],"t":"F","x":912,"y":430,"anc":"start","n":"dx1"},{"f":"ar","id":"vax1","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[2],"t":"F"},{"f":"ln","id":"ve1x1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[2],"t":"F"},{"f":"ln","id":"ve2x1","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[2],"t":"F"},{"f":"lb","id":"vtx1","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[2],"t":"F","x":128,"y":430,"anc":"end","n":"vx1"},{"f":"ln","id":"se1x1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[2],"t":"F"},{"f":"ln","id":"se2x1","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[2],"t":"F"},{"f":"ar","id":"sdx1","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[2],"t":"F"},{"f":"lb","id":"stx1","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[2],"t":"F","x":542,"y":190,"anc":"middle","n":"sx1"},{"f":"lb","id":"captx1","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[2],"t":"F","x":274,"y":430,"anc":"end","n":"cx1"},{"f":"ar","id":"e0x1","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[2],"t":"F"},{"f":"ar","id":"e1x1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[2],"t":"F"},{"f":"ar","id":"e2x1","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[2],"t":"F"},{"f":"ar","id":"e3x1","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[2],"t":"F"},{"f":"ar","id":"e4x1","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[2],"t":"F"},{"f":"lb","id":"etx1","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[2],"t":"F","x":768,"y":430,"anc":"start","n":"ex1"},{"f":"c","id":"qcx1","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[2],"t":"F"},{"f":"lb","id":"qtx1","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[2],"t":"F","x":600,"y":364,"anc":"middle","n":"qx1"},{"f":"ar","id":"fax1","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[2],"t":"F"},{"f":"lb","id":"ftx1","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[2],"t":"F","x":618,"y":471,"anc":"start","n":"fx1"},{"f":"ln","id":"cutx1","pts":[[550,306],[550,554]],"dash":1,"w":3,"o":["cutd"],"vis":[2],"t":"F"},{"f":"lb","id":"catx1","k":"ca","bases":[[425,600,"middle",[0,1]]],"need":"ca","vis":[2],"t":"F","x":425,"y":600,"anc":"middle","n":"cax1"},{"f":"lb","id":"cbtx1","k":"cb","bases":[[675,600,"middle",[0,1]]],"need":"cb","vis":[2],"t":"F","x":675,"y":600,"anc":"middle","n":"cbx1"},{"f":"ln","id":"medfx2","pts":[[300,365],[800,365],[800,495],[300,495]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[3],"t":"F"},{"f":"lb","id":"medtx2","k":"med","bases":[[550,430,"middle",[0,-1]],[314,395,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[3],"t":"F","x":314,"y":185,"anc":"start","n":"medx2"},{"f":"ln","id":"ztx2","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[3],"t":"F"},{"f":"ln","id":"zbx2","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[3],"t":"F"},{"f":"ln","id":"topx2","pts":[[300,300],[800,300]],"w":8,"vis":[3],"t":"F"},{"f":"ln","id":"botx2","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[3],"t":"F"},{"f":"lb","id":"toptx2","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[3],"t":"F","x":280,"y":260,"anc":"end","n":"topx2"},{"f":"lb","id":"bottx2","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[3],"t":"F","x":280,"y":520,"anc":"end","n":"botx2"},{"f":"ln","id":"de1x2","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[3],"t":"F"},{"f":"ln","id":"de2x2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[3],"t":"F"},{"f":"ar","id":"ddx2","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[3],"t":"F"},{"f":"lb","id":"dtx2","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[3],"t":"F","x":912,"y":430,"anc":"start","n":"dx2"},{"f":"ar","id":"vax2","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[3],"t":"F"},{"f":"ln","id":"ve1x2","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[3],"t":"F"},{"f":"ln","id":"ve2x2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[3],"t":"F"},{"f":"lb","id":"vtx2","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[3],"t":"F","x":128,"y":430,"anc":"end","n":"vx2"},{"f":"ln","id":"se1x2","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[3],"t":"F"},{"f":"ln","id":"se2x2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[3],"t":"F"},{"f":"ar","id":"sdx2","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[3],"t":"F"},{"f":"lb","id":"stx2","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[3],"t":"F","x":550,"y":190,"anc":"middle","n":"sx2"},{"f":"lb","id":"captx2","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[3],"t":"F","x":274,"y":430,"anc":"end","n":"cx2"},{"f":"ar","id":"e0x2","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[3],"t":"F"},{"f":"ar","id":"e1x2","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[3],"t":"F"},{"f":"ar","id":"e2x2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[3],"t":"F"},{"f":"ar","id":"e3x2","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[3],"t":"F"},{"f":"ar","id":"e4x2","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[3],"t":"F"},{"f":"lb","id":"etx2","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[3],"t":"F","x":768,"y":430,"anc":"start","n":"ex2"},{"f":"c","id":"qcx2","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[3],"t":"F"},{"f":"lb","id":"qtx2","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[3],"t":"F","x":600,"y":364,"anc":"middle","n":"qx2"},{"f":"ar","id":"fax2","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[3],"t":"F"},{"f":"lb","id":"ftx2","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[3],"t":"F","x":618,"y":471,"anc":"start","n":"fx2"},{"f":"ln","id":"cut1x2","pts":[[300,365],[800,365]],"dash":1,"w":3,"o":["cutd"],"vis":[3],"t":"F"},{"f":"ln","id":"cut2x2","pts":[[300,495],[800,495]],"dash":1,"w":3,"o":["cutd"],"vis":[3],"t":"F"},{"f":"lb","id":"catx2","k":"ca","bases":[[280,332.5,"end",[-1,0]]],"need":"ca","vis":[3],"t":"F","x":274,"y":256.5,"anc":"end","n":"cax2"},{"f":"lb","id":"cbtx2","k":"cb","bases":[[280,430,"end",[-1,0]]],"need":"cb","vis":[3],"t":"F","x":140,"y":430,"anc":"end","n":"cbx2"},{"f":"ln","id":"te1x2","pts":[[816,365],[984,365]],"w":2,"need":"t","vis":[3],"t":"F"},{"f":"ln","id":"te2x2","pts":[[816,495],[984,495]],"w":2,"need":"t","vis":[3],"t":"F"},{"f":"ar","id":"tdx2","x0":970,"y0":365,"x1":970,"y1":495,"two":1,"w":2,"need":"t","vis":[3],"t":"F"},{"f":"lb","id":"ttx2","k":"t","bases":[[986,430,"start",[1,0]],[954,430,"end",[-1,0]]],"need":"t","vis":[3],"t":"F","x":986,"y":430,"anc":"start","n":"tx2"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU17s6full(d, p, L){ tbFig_Draw(d, p, L, U17S6K.full); }
function tbU17s6half(d, p, L){ tbFig_Draw(d, p, L, U17S6K.half); }
function tbU17s6layer(d, p, L){ tbFig_Draw(d, p, L, U17S6K.layer); }
function tbU17s6dz(d, p, L){ tbFig_Draw(d, p, L, U17S6K.dz); }
var KINDS = {u17s1ch: tbU17s1ch, u17s1cv: tbU17s1cv, u17s2pl: tbU17s2pl, u17s3ser: tbU17s3ser, u17s3ser3: tbU17s3ser3, u17s4ser: tbU17s4ser, u17s5par: tbU17s5par, u17s5cmp: tbU17s5cmp, u17s5pe: tbU17s5pe, u17s6full: tbU17s6full, u17s6half: tbU17s6half, u17s6layer: tbU17s6layer, u17s6dz: tbU17s6dz};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u17s1ch: function(p, L){ return tbGen_Flow(p, L, U17S1K.ch); },
  // 17-2 の図は電流が流れないので載せない,
  // 17-3 の図は電流が流れないので載せない,
  // 17-4 の図は電流が流れないので載せない,
  // 17-5 の図は電流が流れないので載せない,
  // 17-6 の図は電流が流れないので載せない
};

// 17-1 電荷と電圧 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u17_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU17s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU17s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU17s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU17s1_par(a, b){ return a * b / (a + b); }
function tbU17s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU17s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU17s1_Qq(r){
  var gcd = tbU17s1_gcd, ratio = tbU17s1_ratio, par = tbU17s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [1,2,3,4,5,6,8,10]);
    var v = pick(r, [2,3,4,5,6,10,12,20]);
    var QQ = (c * v);
    var A = (v / c);
    var B = (c / v);
    var D = (c + v);
    if (!(c != v && nice(A) && nice(B) && distinct([QQ, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(QQ) + "\\,\\mathrm{C}$", v: fmt(QQ)}, {t: "$" + fmt(A) + "\\,\\mathrm{C}$", v: fmt(A), why: "電圧を静電容量で割った"}, {t: "$" + fmt(B) + "\\,\\mathrm{C}$", v: fmt(B), why: "静電容量を電圧で割った"}, {t: "$" + fmt(D) + "\\,\\mathrm{C}$", v: fmt(D), why: "掛けるのでなく足した"}]);
    return {form: "u17s1q", text: "静電容量 $" + fmt(c) + "\\,\\mathrm{F}$ のコンデンサに $" + fmt(v) + "\\,\\mathrm{V}$ の電圧を加えた。蓄えられる電荷は何 C か。", fig: {kind: "u17s1cv", L: tbU17s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}"}, [["c", "{C}=" + fmt(c) + " F"], ["v", "{V}=" + fmt(v) + " V"], ["src", "{V}=" + fmt(v) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q = CV$", "$Q = " + fmt(c) + " \\times " + fmt(v) + " = " + fmt(QQ) + "\\,\\mathrm{C}$"], chk: {form: "u17s1q", p: {c: c, v: v}}};
  }
  throw new Error("u17s1q：条件に合う数字が見つからない");
}
function tbU17s1_Qc(r){
  var gcd = tbU17s1_gcd, ratio = tbU17s1_ratio, par = tbU17s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [1,2,3,4,5,6,8,10]);
    var v = pick(r, [2,3,4,5,6,10,12,20]);
    var QQ = (c * v);
    var A = (QQ * v);
    var B = (v / QQ);
    var D = (QQ - v);
    if (!(c != v && nice(B) && D > 0 && distinct([c, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(c) + "\\,\\mathrm{F}$", v: fmt(c)}, {t: "$" + fmt(A) + "\\,\\mathrm{F}$", v: fmt(A), why: "電荷に電圧を掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{F}$", v: fmt(B), why: "電圧を電荷で割った"}, {t: "$" + fmt(D) + "\\,\\mathrm{F}$", v: fmt(D), why: "割るのでなく引いた"}]);
    return {form: "u17s1c", text: "コンデンサに $" + fmt(v) + "\\,\\mathrm{V}$ の電圧を加えると、$" + fmt(QQ) + "\\,\\mathrm{C}$ の電荷が蓄えられた。このコンデンサの静電容量は何 F か。", fig: {kind: "u17s1cv", L: tbU17s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}"}, [["c", "{C}"], ["v", "{V}=" + fmt(v) + " V"], ["src", "{V}=" + fmt(v) + " V"], ["q", "{Q}=" + fmt(QQ) + " C"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{Q}{V}$", "$C = \\dfrac{" + fmt(QQ) + "}{" + fmt(v) + "} = " + fmt(c) + "\\,\\mathrm{F}$"], chk: {form: "u17s1c", p: {c: c, v: v}}};
  }
  throw new Error("u17s1c：条件に合う数字が見つからない");
}
function tbU17s1_Qv(r){
  var gcd = tbU17s1_gcd, ratio = tbU17s1_ratio, par = tbU17s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [1,2,3,4,5,6,8,10]);
    var m = pick(r, [2,3,4,5,6,10,12]);
    var QQ = (c * m);
    if (!(c != m && QQ != m * m)) continue;
    var ok = (QQ / c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU17s1_three(ok, [{x: (QQ * c), why: "電荷に静電容量を掛けた"}, {x: (c / QQ), why: "静電容量を電荷で割った"}, {x: (QQ - c), why: "割るのでなく引いた"}, {x: (QQ + c), why: "割るのでなく足した"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u17s1v", text: "静電容量 $" + fmt(c) + "\\,\\mathrm{F}$ のコンデンサに $" + fmt(QQ) + "\\,\\mathrm{C}$ の電荷が蓄えられている。コンデンサの電圧は何 V か。", fig: {kind: "u17s1cv", L: tbU17s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}"}, [["c", "{C}=" + fmt(c) + " F"], ["q", "{Q}=" + fmt(QQ) + " C"], ["v", "{V}"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q = CV$ より $V = \\dfrac{Q}{C}$", "$V = \\dfrac{" + fmt(QQ) + "}{" + fmt(c) + "} = " + qv(ok, "V") + "$"], chk: {form: "u17s1v", p: {QQ: QQ, c: c}}};
  }
  throw new Error("u17s1v：条件に合う数字が見つからない");
}
function tbU17s1_Qtwice(r){
  var gcd = tbU17s1_gcd, ratio = tbU17s1_ratio, par = tbU17s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,5]);
    var k2 = (k * k);
    var _c = choices(r, [{t: "$" + fmt(k) + "$ 倍", v: fmt(k)}, {t: "$\\dfrac{1}{" + fmt(k) + "}$ 倍", v: "1/" + fmt(k), why: "静電容量は決まった値なので、電荷は電圧に比例する"}, {t: "$" + fmt(k2) + "$ 倍", v: fmt(k2), why: "$Q = CV$ に2乗は無い"}, {t: "$1$ 倍（変わらない）", v: "1", why: "電圧を大きくするほど、電荷は多く蓄えられる"}]);
    return {form: "u17s1twice", text: "コンデンサに加える電圧を " + fmt(k) + " 倍にした。蓄えられる電荷は元の何倍になるか。", fig: {kind: "u17s1cv", L: tbU17s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["静電容量は決まった値なので、$Q = CV$ の $Q$ は $V$ に比例する", "電荷は " + fmt(k) + " 倍"], chk: {form: "u17s1twice", p: {k: k}}};
  }
  throw new Error("u17s1twice：条件に合う数字が見つからない");
}
function tbU17s1_Qdef(r){
  var gcd = tbU17s1_gcd, ratio = tbU17s1_ratio, par = tbU17s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "1 V の電圧を加えたときに蓄えられる電荷", v: "own"}, {t: "1 C の電荷を蓄えたときに流れる電流", v: "i", why: "静電容量は、1 V あたりに蓄えられる電荷"}, {t: "コンデンサに加えられる電圧の大きさ", v: "v", why: "電圧は静電容量と別の物。$C = \\dfrac{Q}{V}$"}, {t: "極板の間の距離", v: "d", why: "静電容量は、1 V あたりに蓄えられる電荷"}]);
    return {form: "u17s1def", text: "コンデンサの静電容量とは、□ である。", fig: {kind: "u17s1cv", L: tbU17s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{Q}{V}$", "静電容量は、1 V の電圧を加えたときに蓄えられる電荷"], chk: {form: "u17s1def", p: {}}};
  }
  throw new Error("u17s1def：条件に合う数字が見つからない");
}
// 17-2 平行平板コンデンサ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u17_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU17s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU17s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU17s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU17s2_par(a, b){ return a * b / (a + b); }
function tbU17s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU17s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU17s2_Qratio(r){
  var gcd = tbU17s2_gcd, ratio = tbU17s2_ratio, par = tbU17s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4]);
    var b = pick(r, [1,2,3,4]);
    var k = pick(r, [1,2,3]);
    var X = (a * k * b);
    var A = (a * k / b);
    var B = (b / (a * k));
    var D = (a * k + b);
    var parts = ([b > 1 ? '極板間の距離を $\\dfrac{1}{' + b + '}$ にし' : '', a > 1 ? '極板の面積を ' + a + ' 倍にし' : '', k > 1 ? '極板間を比誘電率 ' + k + ' の物質で満たし' : ''].filter(function(x){ return x; }).join('、'));
    var medl = (k == 1 ? '' : '{ε}_r=' + k);
    if (!((a > 1 || k > 1) && b > 1 && nice(A) && nice(B) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "$ 倍", v: fmt(X)}, {t: "$" + fmt(A) + "$ 倍", v: fmt(A), why: "静電容量が距離に比例すると考えた"}, {t: "$" + fmt(B) + "$ 倍", v: fmt(B), why: "面積と誘電率に比例し、距離に反比例する（逆にした）"}, {t: "$" + fmt(D) + "$ 倍", v: fmt(D), why: "掛けるのでなく足した"}]);
    return {form: "u17s2ratio", text: "真空中の平行平板コンデンサの、" + String(parts) + "た。静電容量は元の何倍になるか。", fig: {kind: "u17s2pl", L: tbU17s2_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}"}, [["d", "{d}/" + fmt(b)], ["s", fmt(a) + "{S}"], ["med", String(medl)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$：$d$ に反比例、$S$ と $\\varepsilon$ に比例", "$" + fmt(b) + " \\times " + fmt(a) + " \\times " + fmt(k) + " = " + fmt(X) + "$ 倍"], chk: {form: "u17s2ratio", p: {a: a, b: b, k: k}}};
  }
  throw new Error("u17s2ratio：条件に合う数字が見つからない");
}
function tbU17s2_Qnum(r){
  var gcd = tbU17s2_gcd, ratio = tbU17s2_ratio, par = tbU17s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,8]);
    var S = pick(r, [1,2,3,4,6]);
    var d = pick(r, [0.1,0.2,0.5,2,4]);
    var K = (er * S / d);
    var A = (er * S * d);
    var B = (er * d / S);
    var D = (S / d);
    if (!(nice(K) && nice(A) && nice(B) && distinct([K, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(K) + " \\varepsilon_0\\,\\mathrm{F}$", v: fmt(K)}, {t: "$" + fmt(A) + " \\varepsilon_0\\,\\mathrm{F}$", v: fmt(A), why: "距離で割らずに掛けた"}, {t: "$" + fmt(B) + " \\varepsilon_0\\,\\mathrm{F}$", v: fmt(B), why: "面積と距離を逆にした"}, {t: "$" + fmt(D) + " \\varepsilon_0\\,\\mathrm{F}$", v: fmt(D), why: "比誘電率を掛けていない"}]);
    return {form: "u17s2num", text: "極板の面積 $" + fmt(S) + "\\,\\mathrm{m^2}$、極板間の距離 $" + fmt(d) + "\\,\\mathrm{m}$ の平行平板コンデンサの極板間を、比誘電率 " + fmt(er) + " の物質で満たした。静電容量は何 F か。ただし真空中の誘電率を $\\varepsilon_0$ とする。", fig: {kind: "u17s2pl", L: tbU17s2_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}"}, [["s", "{S}=" + fmt(S) + " m²"], ["d", "{d}=" + fmt(d) + " m"], ["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\varepsilon = \\varepsilon_0 \\varepsilon_r = " + fmt(er) + " \\varepsilon_0$", "$C = \\dfrac{\\varepsilon S}{d} = \\dfrac{" + fmt(er) + " \\varepsilon_0 \\times " + fmt(S) + "}{" + fmt(d) + "} = " + fmt(K) + " \\varepsilon_0\\,\\mathrm{F}$"], chk: {form: "u17s2num", p: {er: er, S: S, d: d}}};
  }
  throw new Error("u17s2num：条件に合う数字が見つからない");
}
function tbU17s2_Qbig(r){
  var gcd = tbU17s2_gcd, ratio = tbU17s2_ratio, par = tbU17s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var good = (k == 1 ? '極板間の距離を短くする' : (k == 2 ? '極板の面積を大きくする' : '誘電率の大きい物質を間に入れる'));
    var _c = choices(r, [{t: String(good), v: "good"}, {t: "極板間の距離を長くする", v: "dl", why: "静電容量は距離に反比例するので、長くすると小さくなる"}, {t: "極板の面積を小さくする", v: "ss", why: "静電容量は面積に比例するので、小さくすると小さくなる"}, {t: "誘電率の小さい物質を間に入れる", v: "es", why: "静電容量は誘電率に比例するので、小さくなる"}]);
    return {form: "u17s2big", text: "平行平板コンデンサの静電容量を大きくするには、□。", fig: {kind: "u17s2pl", L: tbU17s2_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$：$d$ に反比例、$S$ と $\\varepsilon$ に比例", String(good) + "と、静電容量は大きくなる"], chk: {form: "u17s2big", p: {k: k}}};
  }
  throw new Error("u17s2big：条件に合う数字が見つからない");
}
function tbU17s2_Qeq(r){
  var gcd = tbU17s2_gcd, ratio = tbU17s2_ratio, par = tbU17s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$C = \\dfrac{\\varepsilon S}{d}$", v: "own"}, {t: "$C = \\dfrac{\\varepsilon d}{S}$", v: "ds", why: "面積に比例し、距離に反比例する"}, {t: "$C = \\varepsilon S d$", v: "mul", why: "距離は分母にある（距離に反比例）"}, {t: "$C = \\dfrac{S}{\\varepsilon d}$", v: "ed", why: "誘電率は分子にある（誘電率に比例）"}]);
    return {form: "u17s2eq", text: "極板の面積 $S$、極板間の距離 $d$、誘電率 $\\varepsilon$ の平行平板コンデンサの静電容量 $C$ は □ である。", fig: {kind: "u17s2pl", L: tbU17s2_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["静電容量は、距離に反比例し、面積と誘電率に比例する", "$C = \\dfrac{\\varepsilon S}{d}$"], chk: {form: "u17s2eq", p: {}}};
  }
  throw new Error("u17s2eq：条件に合う数字が見つからない");
}
// 17-3 コンデンサの直列 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u17_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU17s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU17s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU17s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU17s3_par(a, b){ return a * b / (a + b); }
function tbU17s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU17s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU17s3_Qc2(r){
  var gcd = tbU17s3_gcd, ratio = tbU17s3_ratio, par = tbU17s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var X = (c1 * c2 / (c1 + c2));
    var A = (c1 + c2);
    var B = (c1 * c2);
    var D = ((c1 + c2) / (c1 * c2));
    if (!(c1 < c2 && nice(X) && nice(D) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{F}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{F}$", v: fmt(A), why: "直列のコンデンサは足さない（和分の積）"}, {t: "$" + fmt(B) + "\\,\\mathrm{F}$", v: fmt(B), why: "積を和で割っていない"}, {t: "$" + fmt(D) + "\\,\\mathrm{F}$", v: fmt(D), why: "和を積で割った（逆数のまま）"}]);
    return {form: "u17s3c2", text: "静電容量 $" + fmt(c1) + "\\,\\mathrm{F}$ と $" + fmt(c2) + "\\,\\mathrm{F}$ のコンデンサを直列につないだ。合成静電容量は何 F か。", fig: {kind: "u17s3ser", L: tbU17s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{C_1 C_2}{C_1 + C_2}$", "$C = \\dfrac{" + fmt(c1) + " \\times " + fmt(c2) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + fmt(X) + "\\,\\mathrm{F}$"], chk: {form: "u17s3c2", p: {c1: c1, c2: c2}}};
  }
  throw new Error("u17s3c2：条件に合う数字が見つからない");
}
function tbU17s3_Qc3(r){
  var gcd = tbU17s3_gcd, ratio = tbU17s3_ratio, par = tbU17s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,6,12]);
    var c2 = pick(r, [2,3,4,6,12]);
    var c3 = pick(r, [2,3,4,6,12]);
    var X = (1 / (1 / c1 + 1 / c2 + 1 / c3));
    var A = (c1 + c2 + c3);
    var B = (1 / c1 + 1 / c2 + 1 / c3);
    var D = (c1 * c2 * c3 / (c1 + c2 + c3));
    var inv = (1 / c1 + 1 / c2 + 1 / c3);
    if (!(c1 <= c2 && c2 <= c3 && nice(X) && nice(B) && nice(D) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{F}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{F}$", v: fmt(A), why: "直列のコンデンサは足さない（逆数の和）"}, {t: "$" + fmt(B) + "\\,\\mathrm{F}$", v: fmt(B), why: "逆数の和のまま答えた（その逆数が答え）"}, {t: "$" + fmt(D) + "\\,\\mathrm{F}$", v: fmt(D), why: "3つの時は和分の積でなく、逆数の和で求める"}]);
    return {form: "u17s3c3", text: "静電容量 $" + fmt(c1) + "\\,\\mathrm{F}$、$" + fmt(c2) + "\\,\\mathrm{F}$、$" + fmt(c3) + "\\,\\mathrm{F}$ のコンデンサを直列につないだ。合成静電容量は何 F か。", fig: {kind: "u17s3ser3", L: tbU17s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"], ["c3", "{C}_3=" + fmt(c3) + " F"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dfrac{1}{C} = \\dfrac{1}{" + fmt(c1) + "} + \\dfrac{1}{" + fmt(c2) + "} + \\dfrac{1}{" + fmt(c3) + "} = " + fmt(inv) + "$", "$C = \\dfrac{1}{" + fmt(inv) + "} = " + fmt(X) + "\\,\\mathrm{F}$"], chk: {form: "u17s3c3", p: {c1: c1, c2: c2, c3: c3}}};
  }
  throw new Error("u17s3c3：条件に合う数字が見つからない");
}
function tbU17s3_Qq(r){
  var gcd = tbU17s3_gcd, ratio = tbU17s3_ratio, par = tbU17s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,6,12]);
    var c2 = pick(r, [2,3,4,6,12]);
    var v = pick(r, [2,3,4,5,6,10,12]);
    var X = (c1 * c2 / (c1 + c2) * v);
    var A = ((c1 + c2) * v);
    var B = (c1 * v);
    var D = (c2 * v);
    var cc = (c1 * c2 / (c1 + c2));
    if (!(c1 < c2 && nice(cc) && nice(X) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{C}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{C}$", v: fmt(A), why: "直列の合成静電容量を、足して求めた"}, {t: "$" + fmt(B) + "\\,\\mathrm{C}$", v: fmt(B), why: "$C_1$ に電源の電圧が全部かかると考えた"}, {t: "$" + fmt(D) + "\\,\\mathrm{C}$", v: fmt(D), why: "$C_2$ に電源の電圧が全部かかると考えた"}]);
    return {form: "u17s3q", text: "静電容量 $" + fmt(c1) + "\\,\\mathrm{F}$ と $" + fmt(c2) + "\\,\\mathrm{F}$ のコンデンサを直列につなぎ、$" + fmt(v) + "\\,\\mathrm{V}$ の電圧を加えた。各コンデンサに蓄えられる電荷は何 C か。", fig: {kind: "u17s3ser", L: tbU17s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"], ["src", "{V}=" + fmt(v) + " V"], ["q1", "{Q}"], ["q2", "{Q}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので、各コンデンサに同じ電荷が蓄えられる。合成静電容量で求める", "$C = \\dfrac{" + fmt(c1) + " \\times " + fmt(c2) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + fmt(cc) + "$、$Q = CV = " + fmt(cc) + " \\times " + fmt(v) + " = " + fmt(X) + "\\,\\mathrm{C}$"], chk: {form: "u17s3q", p: {c1: c1, c2: c2, v: v}}};
  }
  throw new Error("u17s3q：条件に合う数字が見つからない");
}
function tbU17s3_Qsame(r){
  var gcd = tbU17s3_gcd, ratio = tbU17s3_ratio, par = tbU17s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "どれも同じ", v: "own"}, {t: "静電容量に比例する", v: "pc", why: "直列では、どのコンデンサにも同じ電荷が蓄えられる"}, {t: "静電容量に反比例する", v: "ic", why: "直列では、静電容量によらず同じ電荷が蓄えられる"}, {t: "電源に近いほど多い", v: "near", why: "直列は、どのコンデンサも同じ電荷"}]);
    return {form: "u17s3same", text: "コンデンサを直列につないで電圧を加えた。各コンデンサに蓄えられる電荷は □。", fig: {kind: "u17s3ser", L: tbU17s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["q1", "{Q}_1"], ["q2", "{Q}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列では、各コンデンサに同じ電荷が蓄えられる"], chk: {form: "u17s3same", p: {}}};
  }
  throw new Error("u17s3same：条件に合う数字が見つからない");
}
// 17-4 直列の電圧 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u17_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU17s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU17s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU17s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU17s4_par(a, b){ return a * b / (a + b); }
function tbU17s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU17s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU17s4_Qv(r){
  var gcd = tbU17s4_gcd, ratio = tbU17s4_ratio, par = tbU17s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10]);
    var m = pick(r, [1,2,3,4,5,10]);
    var k = pick(r, [1,2]);
    var g = (gcd(c1, c2));
    var V = (m * (c1 + c2) / g);
    var Ck = (k == 1 ? c1 : c2);
    var Co = (k == 1 ? c2 : c1);
    if (!(c1 != c2 && V >= 4 && V <= 200 && 2 * Co != c1 + c2)) continue;
    var ok = (V * Co / (c1 + c2));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU17s4_three(ok, [{x: (V * Ck / (c1 + c2)), why: "静電容量の比のまま分けた（逆比で分ける）"}, {x: (V / 2), why: "等しく分かれると考えた"}, {x: (V), why: "電源の電圧がそのままかかると考えた"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u17s4v", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mathrm{F}$ のコンデンサを直列につなぎ、$" + qv(V, "V") + "$ の電圧を加えた。$C_" + fmt(k) + "$ にかかる電圧は何 V か。", fig: {kind: "u17s4ser", L: tbU17s4_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"], ["src", "{V}=" + qf(V, "V")], ["v" + fmt(k), "{V}_" + fmt(k)], ["_v", {"c1": (c1), "c2": (c2)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_1 : V_2$ は静電容量の逆比で $" + String(ratio([c2, c1])) + "$", "$V_" + fmt(k) + " = " + fmt(V) + " \\times \\dfrac{" + fmt(Co) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + qv(ok, "V") + "$"], chk: {form: "u17s4v", p: {V: V, c1: c1, c2: c2, k: k}}};
  }
  throw new Error("u17s4v：条件に合う数字が見つからない");
}
function tbU17s4_Qratio(r){
  var gcd = tbU17s4_gcd, ratio = tbU17s4_ratio, par = tbU17s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8]);
    var c2 = pick(r, [1,2,3,4,5,6,8]);
    var good = (ratio([c2, c1]));
    var bad = (ratio([c1, c2]));
    var sq = (ratio([c2 * c2, c1 * c1]));
    if (!(c1 != c2 && gcd(c1, c2) == 1)) continue;
    var _c = choices(r, [{t: "$" + String(good) + "$", v: "good"}, {t: "$" + String(bad) + "$", v: "bad", why: "静電容量の比のまま（電圧は逆比）"}, {t: "$1 : 1$", v: "same", why: "直列では、電圧は静電容量の逆比で分かれる"}, {t: "$" + String(sq) + "$", v: "sq", why: "逆比を2乗した"}]);
    return {form: "u17s4ratio", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mathrm{F}$ のコンデンサを直列につないで電圧を加えた。電圧の比 $V_1 : V_2$ はどれか。", fig: {kind: "u17s4ser", L: tbU17s4_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"], ["v1", "{V}_1"], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C_1 V_1 = C_2 V_2$ なので、電圧は静電容量の逆比", "$V_1 : V_2 = " + String(good) + "$"], chk: {form: "u17s4ratio", p: {c1: c1, c2: c2}}};
  }
  throw new Error("u17s4ratio：条件に合う数字が見つからない");
}
function tbU17s4_Qbig(r){
  var gcd = tbU17s4_gcd, ratio = tbU17s4_ratio, par = tbU17s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "静電容量の小さい方", v: "own"}, {t: "静電容量の大きい方", v: "big", why: "電圧は静電容量の逆比で分かれる"}, {t: "どちらも同じ", v: "same", why: "同じなのは電荷。電圧は逆比で分かれる"}, {t: "電源に近い方", v: "near", why: "電圧は静電容量の逆比で分かれる"}]);
    return {form: "u17s4big", text: "静電容量の違う2つのコンデンサを直列につないで電圧を加えた。大きい電圧がかかるのは □。", fig: {kind: "u17s4ser", L: tbU17s4_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["v1", "{V}_1"], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q = C_1 V_1 = C_2 V_2$：$Q$ が同じなので、$C$ が小さいほど $V$ は大きい", "静電容量の小さい方に大きい電圧がかかる"], chk: {form: "u17s4big", p: {}}};
  }
  throw new Error("u17s4big：条件に合う数字が見つからない");
}
// 17-5 コンデンサの並列 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u17_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU17s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU17s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU17s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU17s5_par(a, b){ return a * b / (a + b); }
function tbU17s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU17s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU17s5_Qc(r){
  var gcd = tbU17s5_gcd, ratio = tbU17s5_ratio, par = tbU17s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var X = (c1 + c2);
    var A = (c1 * c2 / (c1 + c2));
    var B = (c1 * c2);
    var D = (c2 - c1);
    if (!(c1 < c2 && nice(A) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{F}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{F}$", v: fmt(A), why: "和分の積は直列の式。並列は足す"}, {t: "$" + fmt(B) + "\\,\\mathrm{F}$", v: fmt(B), why: "掛けるのでなく足す"}, {t: "$" + fmt(D) + "\\,\\mathrm{F}$", v: fmt(D), why: "引くのでなく足す"}]);
    return {form: "u17s5c", text: "静電容量 $" + fmt(c1) + "\\,\\mathrm{F}$ と $" + fmt(c2) + "\\,\\mathrm{F}$ のコンデンサを並列につないだ。合成静電容量は何 F か。", fig: {kind: "u17s5par", L: tbU17s5_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = C_1 + C_2$", "$C = " + fmt(c1) + " + " + fmt(c2) + " = " + fmt(X) + "\\,\\mathrm{F}$"], chk: {form: "u17s5c", p: {c1: c1, c2: c2}}};
  }
  throw new Error("u17s5c：条件に合う数字が見つからない");
}
function tbU17s5_Qqk(r){
  var gcd = tbU17s5_gcd, ratio = tbU17s5_ratio, par = tbU17s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8]);
    var c2 = pick(r, [1,2,3,4,5,6,8]);
    var v = pick(r, [2,3,4,5,6,10,12]);
    var k = pick(r, [1,2]);
    var Ck = (k == 1 ? c1 : c2);
    var Co = (k == 1 ? c2 : c1);
    var X = (Ck * v);
    var A = (Co * v);
    var B = ((c1 + c2) * v);
    var D = (v / Ck);
    if (!(c1 != c2 && Ck != v && nice(D) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{C}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{C}$", v: fmt(A), why: "もう一方のコンデンサの静電容量を掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{C}$", v: fmt(B), why: "合成静電容量を掛けた（2つの電荷の合計）"}, {t: "$" + fmt(D) + "\\,\\mathrm{C}$", v: fmt(D), why: "掛けるのでなく、電圧を静電容量で割った"}]);
    return {form: "u17s5qk", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mathrm{F}$ のコンデンサを並列につなぎ、$" + fmt(v) + "\\,\\mathrm{V}$ の電圧を加えた。$C_" + fmt(k) + "$ に蓄えられる電荷は何 C か。", fig: {kind: "u17s5par", L: tbU17s5_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + fmt(c1) + " F"], ["c2", "{C}_2=" + fmt(c2) + " F"], ["src", "{V}=" + fmt(v) + " V"], ["v1", "{V}=" + fmt(v) + " V"], ["v2", "{V}=" + fmt(v) + " V"], ["q" + fmt(k), "{Q}_" + fmt(k)], ["_v", {"c1": (c1), "c2": (c2)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列なので、どちらにも $" + fmt(v) + "\\,\\mathrm{V}$ がかかる", "$Q_" + fmt(k) + " = C_" + fmt(k) + " V = " + fmt(Ck) + " \\times " + fmt(v) + " = " + fmt(X) + "\\,\\mathrm{C}$"], chk: {form: "u17s5qk", p: {c1: c1, c2: c2, v: v, k: k}}};
  }
  throw new Error("u17s5qk：条件に合う数字が見つからない");
}
function tbU17s5_Qinv(r){
  var gcd = tbU17s5_gcd, ratio = tbU17s5_ratio, par = tbU17s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? '並列' : '直列');
    var good = (k == 1 ? '抵抗の直列' : '抵抗の並列');
    var bad = (k == 1 ? '抵抗の並列' : '抵抗の直列');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: "抵抗とコンデンサは、直列と並列の式が逆"}, {t: "どれとも同じ形にならない", v: "none", why: "抵抗とコンデンサは、直列と並列の式が逆になっている"}, {t: "抵抗の直列と並列の両方", v: "both", why: "直列と並列の式は違う形"}]);
    return {form: "u17s5inv", text: "コンデンサの" + String(nm) + "の合成静電容量の式と、同じ形の式になるのは □ の合成抵抗である。", fig: {kind: "u17s5par", L: tbU17s5_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサの並列は足し算、直列は和分の積。抵抗とは逆", "コンデンサの" + String(nm) + "は、" + String(good) + "と同じ形"], chk: {form: "u17s5inv", p: {k: k}}};
  }
  throw new Error("u17s5inv：条件に合う数字が見つからない");
}
function tbU17s5_Qvsame(r){
  var gcd = tbU17s5_gcd, ratio = tbU17s5_ratio, par = tbU17s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "どれも同じ", v: "own"}, {t: "静電容量に比例する", v: "pc", why: "並列では、各コンデンサに同じ電圧がかかる"}, {t: "静電容量の逆比で分かれる", v: "ic", why: "逆比で分かれるのは直列の電圧"}, {t: "電源に近いほど大きい", v: "near", why: "並列では、各コンデンサに同じ電圧がかかる"}]);
    return {form: "u17s5vsame", text: "コンデンサを並列につないで電圧を加えた。各コンデンサにかかる電圧は □。", fig: {kind: "u17s5par", L: tbU17s5_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["v1", "{V}_1"], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列では、各コンデンサに同じ電圧がかかる"], chk: {form: "u17s5vsame", p: {}}};
  }
  throw new Error("u17s5vsame：条件に合う数字が見つからない");
}
// 17-6 誘電体の入れ方 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u17_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU17s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU17s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU17s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU17s6_par(a, b){ return a * b / (a + b); }
function tbU17s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU17s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU17s6_Qhalf(r){
  var gcd = tbU17s6_gcd, ratio = tbU17s6_ratio, par = tbU17s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,7,8,9]);
    var X = ((1 + er) / 2);
    var A = (er);
    var B = (1 + er);
    var D = (er / (2 * (1 + er)));
    if (!(nice(X) && nice(D) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "$ 倍", v: fmt(X)}, {t: "$" + fmt(A) + "$ 倍", v: fmt(A), why: "全部に入れた時の値。半分だけなので、並列で足す"}, {t: "$" + fmt(B) + "$ 倍", v: fmt(B), why: "それぞれの面積を半分にしていない"}, {t: "$" + fmt(D) + "$ 倍", v: fmt(D), why: "面積の方向に分けた時は、直列でなく並列"}]);
    return {form: "u17s6half", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがある。極板間の、面積の方向に半分だけ、比誘電率 " + fmt(er) + " の誘電体を入れた。静電容量は $C_0$ の何倍になるか。", fig: {kind: "u17s6half", L: tbU17s6_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}_r"}, [["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["真空の部分 $\\dfrac{C_0}{2}$、誘電体の部分 $\\dfrac{" + fmt(er) + " C_0}{2}$ の並列", "$\\dfrac{C_0}{2} + \\dfrac{" + fmt(er) + " C_0}{2} = " + fmt(X) + " C_0$、$" + fmt(X) + "$ 倍"], chk: {form: "u17s6half", p: {er: er}}};
  }
  throw new Error("u17s6half：条件に合う数字が見つからない");
}
function tbU17s6_Qlayer(r){
  var gcd = tbU17s6_gcd, ratio = tbU17s6_ratio, par = tbU17s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,7,8,9]);
    var X = (2 * er / (1 + er));
    var A = ((1 + er) / 2);
    var B = (er / (1 + er));
    var D = (er);
    if (!(nice(X) && nice(B) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "$ 倍", v: fmt(X)}, {t: "$" + fmt(A) + "$ 倍", v: fmt(A), why: "間に挟んだ時は、並列でなく直列"}, {t: "$" + fmt(B) + "$ 倍", v: fmt(B), why: "それぞれの部分の距離を半分にしていない（半分の距離で 2 倍）"}, {t: "$" + fmt(D) + "$ 倍", v: fmt(D), why: "全部に入れた時の値。間に挟んだ時は直列で求める"}]);
    return {form: "u17s6layer", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがある。極板間の真ん中に、厚さが極板間の距離の半分で、比誘電率 " + fmt(er) + " の誘電体を極板と平行に挟んだ。静電容量は $C_0$ の何倍になるか。", fig: {kind: "u17s6layer", L: tbU17s6_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}_r"}, [["med", "{ε}_r=" + fmt(er)], ["t", "{d}/2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["真空の部分（長さ $\\dfrac{d}{2}$）は $2C_0$、誘電体の部分は $2 \\times " + fmt(er) + " C_0$ の直列", "$\\dfrac{2C_0 \\times 2 \\times " + fmt(er) + " C_0}{2C_0 + 2 \\times " + fmt(er) + " C_0} = " + fmt(X) + " C_0$、$" + fmt(X) + "$ 倍"], chk: {form: "u17s6layer", p: {er: er}}};
  }
  throw new Error("u17s6layer：条件に合う数字が見つからない");
}
function tbU17s6_Qfull(r){
  var gcd = tbU17s6_gcd, ratio = tbU17s6_ratio, par = tbU17s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,4,5,8,10]);
    var A = (1 / er);
    var B = ((1 + er) / 2);
    if (!(distinct([er, A, B, 1]))) continue;
    var _c = choices(r, [{t: "$" + fmt(er) + "$ 倍", v: fmt(er)}, {t: "$" + fmt(A) + "$ 倍", v: fmt(A), why: "誘電率は分子にあるので、静電容量は大きくなる"}, {t: "$" + fmt(B) + "$ 倍", v: fmt(B), why: "半分だけ入れた時の値。全部なので比誘電率の倍"}, {t: "$1$ 倍（変わらない）", v: "1", why: "誘電体を入れると、誘電率が変わる"}]);
    return {form: "u17s6full", text: "真空中で静電容量 $C_0$ の平行平板コンデンサの極板間を、比誘電率 " + fmt(er) + " の誘電体で満たした。静電容量は $C_0$ の何倍になるか。", fig: {kind: "u17s6full", L: tbU17s6_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}_r"}, [["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\varepsilon = \\varepsilon_r \\varepsilon_0$ なので、$C = \\dfrac{\\varepsilon_r \\varepsilon_0 S}{d} = " + fmt(er) + " C_0$", "$" + fmt(er) + "$ 倍"], chk: {form: "u17s6full", p: {er: er}}};
  }
  throw new Error("u17s6full：条件に合う数字が見つからない");
}
function tbU17s6_Qwhich(r){
  var gcd = tbU17s6_gcd, ratio = tbU17s6_ratio, par = tbU17s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var how = (k == 1 ? '面積の方向に半分だけ入れた' : '極板間の途中に、極板と平行に挟んだ');
    var good = (k == 1 ? '誘電体の無い部分と有る部分の並列' : '真空の部分と誘電体の部分の直列');
    var bad = (k == 1 ? '誘電体の無い部分と有る部分の直列' : '真空の部分と誘電体の部分の並列');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: "面積の方向に分ける時は並列、間に挟んだ時は直列"}, {t: "誘電体の部分だけ", v: "only", why: "誘電体の無い部分も静電容量を持つ"}, {t: "真空の部分だけ", v: "vac", why: "誘電体の部分も静電容量を持つ"}]);
    return {form: "u17s6which", text: "平行平板コンデンサの極板間に、誘電体を" + String(how) + "。静電容量は □ として求める。", fig: {kind: "u17s6half", L: tbU17s6_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}_r"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["面積の方向に半分＝並列、間に挟む＝直列", String(good)], chk: {form: "u17s6which", p: {k: k}}};
  }
  throw new Error("u17s6which：条件に合う数字が見つからない");
}
var GEN = {
  // 17-1 電荷と電圧
  1: function(r){ return pick(r, [tbU17s1_Qq, tbU17s1_Qq, tbU17s1_Qq, tbU17s1_Qc, tbU17s1_Qc, tbU17s1_Qv, tbU17s1_Qv, tbU17s1_Qtwice, tbU17s1_Qdef])(r); },
  // 17-2 平行平板コンデンサ
  2: function(r){ return pick(r, [tbU17s2_Qratio, tbU17s2_Qratio, tbU17s2_Qratio, tbU17s2_Qnum, tbU17s2_Qnum, tbU17s2_Qnum, tbU17s2_Qbig, tbU17s2_Qeq])(r); },
  // 17-3 コンデンサの直列
  3: function(r){ return pick(r, [tbU17s3_Qc2, tbU17s3_Qc2, tbU17s3_Qc2, tbU17s3_Qc3, tbU17s3_Qc3, tbU17s3_Qq, tbU17s3_Qq, tbU17s3_Qsame])(r); },
  // 17-4 直列の電圧
  4: function(r){ return pick(r, [tbU17s4_Qv, tbU17s4_Qv, tbU17s4_Qv, tbU17s4_Qv, tbU17s4_Qratio, tbU17s4_Qratio, tbU17s4_Qbig])(r); },
  // 17-5 コンデンサの並列
  5: function(r){ return pick(r, [tbU17s5_Qc, tbU17s5_Qc, tbU17s5_Qc, tbU17s5_Qqk, tbU17s5_Qqk, tbU17s5_Qqk, tbU17s5_Qinv, tbU17s5_Qvsame])(r); },
  // 17-6 誘電体の入れ方
  6: function(r){ return pick(r, [tbU17s6_Qhalf, tbU17s6_Qhalf, tbU17s6_Qhalf, tbU17s6_Qlayer, tbU17s6_Qlayer, tbU17s6_Qlayer, tbU17s6_Qfull, tbU17s6_Qfull, tbU17s6_Qwhich])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t17s1e","scene":"t17s1e","kind":"u17s1ch","lab":{"src":"{V}","c":"{C}","q":"{Q}","v":"{V}"},"viewbox":"464 226 595 408","band":{"want":"コンデンサに蓄えられる電荷","ans":"$Q = CV$","full":"コンデンサは充電と放電ができる電子部品。電源につなぐと極板が正と負に帯電し、極板間に電位差が生じる。蓄えられる電荷は Q = CV。静電容量 C［F］は 1 V を加えたときに蓄えられる電荷で、C = Q / V。"},"narr":{"start":{"co":1,"swc":0,"chg":0,"qd":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①充電\n②式\n③静電容量\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"コンデンサは、〖電荷を蓄えたり、蓄えた電荷を放ったりできる〗電子部品です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C"]},{"text":"電源とコンデンサをつなぎ、スイッチを閉じます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sw","emph":["SW","src"]},{"text":"電源の－極から電子が流れ込み、一方の極板は負に帯電します。もう一方の極板は電子が出ていき、正に帯電します。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"q","emph":["Q"]},{"text":"極板間に〖電位差〗が生じます。これがコンデンサの電圧 $V$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"st","emph":["V","src"],"zb":true}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"蓄えられる電荷 $Q$ は、〖静電容量 $C$ に電圧 $V$ を掛けた物〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Q","C","V","src"],"eq":[{"cont":false,"items":[["Q = CV"]]}],"emphPre":["Q","C","V","src"]},{"text":"電荷の単位はクーロン C、静電容量の単位はファラッド F です。","at":{"強調":1.0},"after":[],"emph":["Q","C","src"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"静電容量は、〖1 V の電圧を加えたときに蓄えられる電荷〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["C","Q","V","src"],"eq":[{"cont":false,"items":[["C = \\dfrac{Q}{V}"]]}],"emphPre":["C","src"]},{"text":"コンデンサが決まれば、静電容量は決まった値です。電圧を大きくするほど、電荷が多く蓄えられます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["C","V","Q","src"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"zhi":["u17s1chL","u17s1chw1","zbu17s1ch0hi","u17s1chw2","zbu17s1ch2hi"],"zlo":["u17s1chRw","u17s1chw3","zbu17s1ch1lo"],"Q":["qp0","qp1","qm0","qm1"]},"moves":{"sw":{"to":{"swc":1,"chg":1},"dur":1.0},"q":{"to":{"qd":1},"dur":0.6},"st":{"to":{"co":0},"dur":0.6}},"route":["充電","式","静電容量"]}},{"id":"t17s1x","scene":"t17s1x","kind":"u17s1ch","lab":{"src":"{V}=6 V","c":"{C}=2 F","q":["{Q}","{Q}=12 C"],"v":"{V}=6 V"},"viewbox":"464 226 595 408","band":{"want":"蓄えられる電荷 $Q$","known":"$C = 2\\,\\mathrm{F},\\;\\; V = 6\\,\\mathrm{V}$","ans":"$Q = 12\\,\\mathrm{C}$"},"narr":{"start":{"co":0,"swc":1,"chg":1,"qd":1,"qv":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、コンデンサに蓄えられる電荷 $Q$ です。","at":{"強調":1.0},"after":[],"emph":["Q"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"電荷は、〖静電容量に電圧を掛けて〗求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q","C","V","src"],"eq":[{"cont":false,"items":[["Q = CV"]]}],"emphPre":["Q","C","V","src"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C = 2$、$V = 6$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"q","emph":["Q","C","V","src"],"eq":[{"cont":false,"items":[["Q = 2 \\times 6 = 12\\,\\mathrm{C}"]]}],"ans":true,"emphPre":["Q","C","V","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"zhi":["u17s1chL","u17s1chw1","zbu17s1ch0hi","u17s1chw2","zbu17s1ch2hi"],"zlo":["u17s1chRw","u17s1chw3","zbu17s1ch1lo"],"Q":["qp0","qp1","qm0","qm1"]},"moves":{"q":{"to":{"qv":1},"dur":0.5}},"route":["式を書く","数を入れる"]}},{"id":"t17s2e","scene":"t17s2e","kind":"u17s2pl","lab":{"top":"","bot":"","s":"{S}","d":["{d}","{d}/2"],"c":"{C}","med":"{ε}"},"viewbox":"134 151 914 481","band":{"want":"平行平板コンデンサの静電容量","ans":"$C = \\dfrac{\\varepsilon S}{d}$","full":"板を2枚、平行に置いた物が平行平板コンデンサ。極板の面積 S、極板間の距離 d、誘電率 ε のとき C = εS / d。静電容量は距離に反比例し、面積と誘電率に比例する。"},"narr":{"start":{"co":1,"medd":1,"dz":0,"dv":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①平行平板\n②式\n③大きくするには\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"板を2枚、平行に置いた物を平行平板コンデンサといいます。コンデンサを簡単に表した物です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Top","Bot"]},{"text":"極板の面積を $S$、極板間の距離を $d$ とします。単位は m² と m です。","at":{"強調":1.0},"after":[],"emph":["S","D"]},{"text":"極板間の物質の誘電率を $\\varepsilon$ とします。","at":{"強調":1.0},"after":[],"emph":["Med"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"静電容量は、〖誘電率と面積を掛けて、距離で割って〗求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Cap","Med","S","D"],"eq":[{"cont":false,"items":[["C = \\dfrac{\\varepsilon S}{d}"]]}],"emphPre":["Cap","Med","S","D"]},{"text":"静電容量は、〖距離 $d$ に反比例〗します。面積 $S$ と誘電率 $\\varepsilon$ には比例します。","at":{"強調":1.0},"after":[],"emph":["D","S","Med"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"静電容量を大きくしたい時は、極板間の距離を短くします。距離を半分にすると、〖静電容量は 2 倍〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"dz","emph":["D","Cap"]},{"text":"面積を大きくし、誘電率の大きい物質を入れても、静電容量は大きくなります。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["S","Med","Cap"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"dz":{"to":{"dz":1,"dv":1},"dur":0.8}},"route":["平行平板","式","大きくするには"]}},{"id":"t17s2x","scene":"t17s2x","kind":"u17s2pl","lab":{"top":"","bot":"","s":["{S}","3{S}"],"d":["{d}","{d}/2"],"c":["{C}","{C}'"],"med":"{ε}"},"viewbox":"134 151 914 481","band":{"want":"距離を半分・面積を 3 倍にした静電容量","known":"元の静電容量 $C$","ans":"$6$ 倍"},"narr":{"start":{"co":1,"medd":1,"dz":0,"dv":0,"sv":0,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、距離を半分、面積を 3 倍にした時の静電容量です。元の何倍かを求めます。","at":{"強調":1.0},"after":[],"emph":["Cap"]},{"text":"①距離の変わり方\n②面積の変わり方\n③合わせる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"静電容量は距離に反比例します。距離が半分なので、2 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"dz","emph":["D","Cap","S"],"eq":[{"cont":false,"items":[["C = \\dfrac{\\varepsilon S}{d}"]]}],"emphPre":["D","Cap","S"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"静電容量は面積に比例します。面積が 3 倍なので、3 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"s","emph":["S","Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖2 倍と 3 倍を掛けます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"c","emph":["Cap","D","S"],"eq":[{"cont":false,"items":[["C' = \\dfrac{\\varepsilon \\times 3S}{\\dfrac{d}{2}}","= 6 \\times \\dfrac{\\varepsilon S}{d} = 6C"]]}],"ans":true,"emphPre":["Cap","D","S"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"dz":{"to":{"dz":1,"dv":1},"dur":0.8},"s":{"to":{"sv":1},"dur":0.5},"c":{"to":{"cv":1},"dur":0.5}},"route":["距離の変わり方","面積の変わり方","合わせる"]}},{"id":"t17s3e","scene":"t17s3e","kind":"u17s3ser","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","q1":"{Q}","q2":"{Q}","c12":"{C}","cab":"{C}"},"viewbox":"464 294 595 340","band":{"want":"直列のコンデンサの合成静電容量","ans":"$C = \\dfrac{C_1 C_2}{C_1 + C_2}$","full":"直列につなぐと、各コンデンサに同じ電荷が蓄えられる。合成静電容量は和分の積 C = C1C2 /（C1 + C2）。3つ以上は 1/C = 1/C1 + 1/C2 + 1/C3。抵抗の並列と同じ形。"},"narr":{"start":{"co":1,"qd":0,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①同じ電荷\n②合成静電容量\n③3つ以上\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"コンデンサを直列につないで、電圧を加えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","C2","src"]},{"text":"直列では、各コンデンサに〖同じ電荷 $Q$〗が蓄えられます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"q","emph":["Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"2つのコンデンサを1つのコンデンサで表した時の静電容量を、合成静電容量といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"cm","emph":["C12"]},{"text":"直列の合成静電容量は、足してはいけません。〖和分の積〗で求めます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C12","Cab"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_1 C_2}{C_1 + C_2}"]]}],"emphPre":["C12","Cab"]},{"text":"抵抗の〖並列の合成抵抗と、同じ形〗の式です。","at":{"強調":1.0},"after":[],"emph":["C12","Cab"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"3つ以上の時は、合成静電容量の逆数が、各静電容量の逆数の和になります。","at":{"道筋":1.0,"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"route":3,"eq":[{"cont":false,"items":[["\\dfrac{1}{C} = \\dfrac{1}{C_1} + \\dfrac{1}{C_2} + \\dfrac{1}{C_3}"]]}],"ans":true,"emph":["Cab","C12"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"Cab":["cabd:e","cabd:f","cabd:a","cabt0","cabt1"],"zhi":["u17s3serL","zbu17s3ser0hi","u17s3serw1","zbu17s3ser2hi","u17s3serw4","zbu17s3ser5hi"],"zlo":["u17s3serRw","zbu17s3ser1lo","u17s3serw3","zbu17s3ser4lo","u17s3serw5","zbu17s3ser6lo"],"zmid":["u17s3serw2","zbu17s3ser3mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{"q":{"to":{"qd":1},"dur":0.6},"cm":{"to":{"cm":1},"dur":0.8}},"route":["同じ電荷","合成静電容量","3つ以上"]}},{"id":"t17s3x","scene":"t17s3x","kind":"u17s3ser","lab":{"src":"{V}","c1":"{C}_1=4 F","c2":"{C}_2=12 F","q1":"{Q}","q2":"{Q}","c12":["{C}","{C}=3 F"]},"viewbox":"464 294 595 340","band":{"want":"合成静電容量 $C$","known":"$C_1 = 4\\,\\mathrm{F},\\;\\; C_2 = 12\\,\\mathrm{F}$","ans":"$C = 3\\,\\mathrm{F}$"},"narr":{"start":{"co":1,"qd":0,"cm":0,"c12v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、直列の2つを1つにまとめた、合成静電容量 $C$ です。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なので、〖和分の積〗で求めます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"cm","emph":["C12"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_1 C_2}{C_1 + C_2}"]]}],"emphPre":["C12"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1 = 4$、$C_2 = 12$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"c","emph":["C12"],"eq":[{"cont":false,"items":[["C = \\dfrac{4 \\times 12}{4 + 12}"],["= \\dfrac{48}{16} = 3\\,\\mathrm{F}"]]}],"ans":true,"emphPre":["C12"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"Cab":["cabd:e","cabd:f","cabd:a","cabt0","cabt1"],"zhi":["u17s3serL","zbu17s3ser0hi","u17s3serw1","zbu17s3ser2hi","u17s3serw4","zbu17s3ser5hi"],"zlo":["u17s3serRw","zbu17s3ser1lo","u17s3serw3","zbu17s3ser4lo","u17s3serw5","zbu17s3ser6lo"],"zmid":["u17s3serw2","zbu17s3ser3mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8},"c":{"to":{"c12v":1},"dur":0.5}},"route":["式を書く","数を入れる"]}},{"id":"t17s4e","scene":"t17s4e","kind":"u17s4ser","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","q1":"{Q}","q2":"{Q}","v1":"{V}_1","v2":"{V}_2"},"viewbox":"464 226 595 408","band":{"want":"直列のコンデンサにかかる電圧","ans":"静電容量の逆比で分かれる","full":"直列のコンデンサには同じ電荷が蓄えられるので、C1V1 = C2V2。電圧の比は静電容量の逆比になる。V1 = V × C2 /（C1 + C2）、V2 = V × C1 /（C1 + C2）。"},"narr":{"start":{"co":1,"qd":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①同じ電荷\n②逆比\n③電圧の式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なので、2つのコンデンサには同じ電荷 $Q$ が蓄えられています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q1","Q2"]},{"text":"$Q = CV$ を、それぞれのコンデンサで書きます。どちらも同じ $Q$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C1","V1","C2","V2","src"],"eq":[{"cont":false,"items":[["Q = C_1 V_1 = C_2 V_2"]]}],"emphPre":["C1","V1","C2","V2","src"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"なので、電圧の比は〖静電容量の逆比〗になります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["V1","V2"],"zb":true},{"text":"$C_1 : C_2 = 1 : 3$ なら、$V_1 : V_2 = 3 : 1$ です。そうでないと、電荷が同じになりません。","at":{"強調":1.0},"after":[],"emph":["C1","C2","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"電源の電圧 $V$ を、逆比で分けます。$C_1$ の電圧には、〖分子に $C_2$〗が来ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["V1","src","C2","C1"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{C_2}{C_1 + C_2}"]]}],"emphPre":["V1","src","C1","C2"],"zb":true},{"text":"$C_2$ の電圧には、分子に $C_1$ が来ます。〖静電容量の小さいコンデンサほど、大きい電圧〗がかかります。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["V2","src","C1","C2"],"eq":[{"cont":false,"items":[["V_2 = V \\times \\dfrac{C_1}{C_1 + C_2}"]]}],"ans":true,"emphPre":["V2","src","C1","C2"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u17s4serL","u17s4serw1","zbu17s4ser0hi"],"zlo":["u17s4serRw","u17s4serw3","zbu17s4ser1lo"],"zmid":["u17s4serw2","zbu17s4ser2mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{},"route":["同じ電荷","逆比","電圧の式"]}},{"id":"t17s4x","scene":"t17s4x","kind":"u17s4ser","lab":{"src":"{V}=12 V","c1":"{C}_1=1 F","c2":"{C}_2=3 F","q1":"{Q}","q2":"{Q}","v1":["{V}_1","{V}_1=9 V"],"v2":"{V}_2","_v":{"c1":1,"c2":3}},"viewbox":"464 226 595 408","band":{"want":"$C_1$ にかかる電圧 $V_1$","known":"$V = 12\\,\\mathrm{V},\\;\\; C_1 = 1\\,\\mathrm{F},\\;\\; C_2 = 3\\,\\mathrm{F}$","ans":"$V_1 = 9\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"qd":1,"v1v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、$C_1$ にかかる電圧 $V_1$ です。","at":{"強調":1.0},"after":[],"emph":["V1","C1"]},{"text":"①電圧の比\n②逆比で分ける\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V1"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1 : C_2 = 1 : 3$ なので、電圧の比は〖逆比の $3 : 1$〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["V1","V2","C1","C2"],"eq":[{"cont":false,"items":[["V_1 : V_2 = 3 : 1"]]}],"emphPre":["C1","C2","V1","V2"],"zb":true}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"12 V を $3 : 1$ に分けます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"v1","emph":["V1","src","C2","C1"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{C_2}{C_1 + C_2}"],["= 12 \\times \\dfrac{3}{1 + 3} = 9\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["V1","src","C2","C1"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u17s4serL","u17s4serw1","zbu17s4ser0hi"],"zlo":["u17s4serRw","u17s4serw3","zbu17s4ser1lo"],"zmid":["u17s4serw2","zbu17s4ser2mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{"v1":{"to":{"v1v":1},"dur":0.5}},"route":["電圧の比","逆比で分ける"]}},{"id":"t17s5e","scene":"t17s5e","kind":"u17s5pe","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","v1":"{V}","v2":"{V}","q1":"{Q}_1","q2":"{Q}_2","c12":"{C}","r1":"{R}_1","r2":"{R}_2"},"viewbox":"464 146 595 488","band":{"want":"並列のコンデンサの合成静電容量","ans":"$C = C_1 + C_2$","full":"並列につなぐと、各コンデンサに同じ電圧がかかる。合成静電容量は足すだけ C = C1 + C2。電荷は Q1 = C1V、Q2 = C2V で静電容量に比例する。抵抗とは式が逆。"},"narr":{"start":{"co":1,"t":0,"u":0,"qd":0,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①同じ電圧\n②合成静電容量\n③抵抗と逆\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"コンデンサを並列につなぎます。並列では、各コンデンサに〖同じ電圧 $V$〗がかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V1","V2","src"],"zb":true},{"text":"電荷は $Q = CV$ で、$V$ が同じなので、静電容量に比例します。静電容量の大きい方が、大きな電荷を蓄えます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"q","emph":["Q1","Q2","C1","C2","src","V1","V2"],"eq":[{"cont":false,"items":[["Q_1 = C_1 V","Q_2 = C_2 V"]]}],"emphPre":["Q1","Q2","C1","C2","src","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列の合成静電容量は、〖2つの静電容量を足すだけ〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"cm","emph":["C12"],"eq":[{"cont":false,"items":[["C = C_1 + C_2"]]}],"emphPre":["C12"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"抵抗と比べます。抵抗の直列は足し算ですが、コンデンサの直列は和分の積でした。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"cmp","emph":["R1","R2","C1","C2"]},{"text":"抵抗の並列は和分の積ですが、コンデンサの並列は足し算です。〖抵抗と式が逆〗なので、注意します。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"pp","emph":["R1","R2","C1","C2"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","cs1x1","cs1:bx1","c1px1","c1p:bx1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","cs2x1","cs2:bx1","c2px1","c2p:bx1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"zhi":["u17s5peL","u17s5pew9","zbu17s5pe0hi","u17s5pew1","u17s5pew3","u17s5pew5","zbu17s5pe2hi","u17s5pew7","zbu17s5pe4hi"],"zlo":["u17s5peRw","u17s5pew10","zbu17s5pe1lo","u17s5pew2","u17s5pew4","u17s5pew6","zbu17s5pe3lo","u17s5pew8","zbu17s5pe5lo"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"R1":["r1x1","r1px1"],"R2":["r2x1","r2px1"]},"moves":{"q":{"to":{"qd":1},"dur":0.6},"cm":{"to":{"cm":1},"dur":0.8},"cmp":{"to":{"t":1},"dur":0.6},"pp":{"to":{"u":1},"dur":0.6}},"route":["同じ電圧","合成静電容量","抵抗と逆"]}},{"id":"t17s5x","scene":"t17s5x","kind":"u17s5par","lab":{"src":"{V}=10 V","c1":"{C}_1=2 F","c2":"{C}_2=6 F","v1":"{V}=10 V","v2":"{V}=10 V","c12":["{C}","{C}=8 F"]},"viewbox":"464 146 595 488","band":{"want":"合成静電容量 $C$","known":"$C_1 = 2\\,\\mathrm{F},\\;\\; C_2 = 6\\,\\mathrm{F}$","ans":"$C = 8\\,\\mathrm{F}$"},"narr":{"start":{"co":1,"qd":0,"cm":0,"c12v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、並列の2つを1つにまとめた、合成静電容量 $C$ です。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列なので、〖足すだけ〗です。和分の積ではありません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"cm","emph":["C12"],"eq":[{"cont":false,"items":[["C = C_1 + C_2"]]}],"emphPre":["C12"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1 = 2$、$C_2 = 6$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"c","emph":["C12"],"eq":[{"cont":false,"items":[["C = 2 + 6 = 8\\,\\mathrm{F}"]]}],"ans":true,"emphPre":["C12"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"zhi":["u17s5parL","u17s5parw9","zbu17s5par0hi","u17s5parw1","u17s5parw3","u17s5parw5","zbu17s5par2hi","u17s5parw7","zbu17s5par4hi"],"zlo":["u17s5parRw","u17s5parw10","zbu17s5par1lo","u17s5parw2","u17s5parw4","u17s5parw6","zbu17s5par3lo","u17s5parw8","zbu17s5par5lo"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8},"c":{"to":{"c12v":1},"dur":0.5}},"route":["式を書く","数を入れる"]}},{"id":"t17s6e","scene":"t17s6e","kind":"u17s6dz","lab":{"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}_0","med":"{ε}_r","ca":"","cb":"","t":"{d}/2"},"viewbox":"-27 141 1117 503","band":{"want":"誘電体を入れた時の静電容量","ans":"面積の方向に半分＝並列、間に挟む＝直列","full":"比誘電率 εr の誘電体を極板間に入れると、静電容量は εr 倍になる。面積の方向に半分だけ入れた時は、誘電体の無い部分と有る部分の並列。間に挟んだ時は、真空の部分と誘電体の部分の直列。"},"narr":{"start":{"co":1,"t":0,"medd":0,"cutd":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①全部に入れる\n②面積の方向に半分\n③間に挟む\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"真空中では、誘電率は $\\varepsilon_0$ です。静電容量を $C_0$ とします。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Cap","S","D"],"eq":[{"cont":false,"items":[["C_0 = \\dfrac{\\varepsilon_0 S}{d}"]]}],"emphPre":["Cap"]},{"text":"極板間に、比誘電率 $\\varepsilon_r$ の誘電体を入れます。誘電率は $\\varepsilon_r \\varepsilon_0$ になります。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"med","emph":["Med","Cap","S","D"],"eq":[{"cont":false,"items":[["C = \\dfrac{\\varepsilon_r \\varepsilon_0 S}{d} = \\varepsilon_r C_0"]]}],"emphPre":["Med","S","D"]},{"text":"比誘電率は 1 以上なので、誘電体を入れると〖静電容量は大きく〗なります。","at":{"強調":1.0},"after":[],"emph":["Med","Cap","S"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"誘電体を、面積の方向に半分だけ入れた時です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"h","emph":["Med"]},{"text":"真ん中で2つに分けます。〖誘電体の無い部分と、有る部分の並列〗になります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"cut","emph":["Cut","Ca","Cb"]},{"text":"それぞれの静電容量を求めて、並列なので足します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Ca","Cb"],"eq":[{"cont":false,"items":[["C = C_a + C_b"]]}],"emphPre":["Ca","Cb"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"誘電体を、極板間の途中に挟んだ時です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"l","emph":["Med"]},{"text":"誘電体の上と下で分けます。真空の部分と誘電体の部分が、〖直列〗になります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"cut","emph":["Cut","Ca","Cb"]},{"text":"真空の部分は、上と下の長さを足し合わせた1つとして考えられます。直列なので、和分の積で求めます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Ca","Cb"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_a C_b}{C_a + C_b}"]]}],"ans":true,"emphPre":["Ca","Cb"]}]}],"groups":{"Med":["medf","medt0","medt1","medfx1","medtx10","medtx11","medfx2","medtx20","medtx21"],"Top":["zt","top","topt0","topt1","ztx1","topx1","toptx10","toptx11","ztx2","topx2","toptx20","toptx21"],"Bot":["zb","bot","bott0","bott1","zbx1","botx1","bottx10","bottx11","zbx2","botx2","bottx20","bottx21"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1","de1x1","de2x1","ddx1","ddx1:h","ddx1:h2","dtx10","dtx11","de1x2","de2x2","ddx2","ddx2:h","ddx2:h2","dtx20","dtx21"],"V":["va","va:h","ve1","ve2","vt0","vt1","vax1","vax1:h","ve1x1","ve2x1","vtx10","vtx11","vax2","vax2:h","ve1x2","ve2x2","vtx20","vtx21"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1","se1x1","se2x1","sdx1","sdx1:h","sdx1:h2","stx10","stx11","se1x2","se2x2","sdx2","sdx2:h","sdx2:h2","stx20","stx21"],"Cap":["capt0","capt1","captx10","captx11","captx20","captx21"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1","e0x1","e0x1:h","e1x1","e1x1:h","e2x1","e2x1:h","e3x1","e3x1:h","e4x1","e4x1:h","etx10","etx11","e0x2","e0x2:h","e1x2","e1x2:h","e2x2","e2x2:h","e3x2","e3x2:h","e4x2","e4x2:h","etx20","etx21"],"Qc":["qc","qc:t","qt0","qt1","qcx1","qcx1:t","qtx10","qtx11","qcx2","qcx2:t","qtx20","qtx21"],"F":["fa","fa:h","ft0","ft1","fax1","fax1:h","ftx10","ftx11","fax2","fax2:h","ftx20","ftx21"],"Cut":["cutx1","cut1x2","cut2x2"],"Ca":["catx10","catx11","catx20","catx21"],"Cb":["cbtx10","cbtx11","cbtx20","cbtx21"],"T":["te1x2","te2x2","tdx2","tdx2:h","tdx2:h2","ttx20","ttx21"]},"moves":{"med":{"to":{"medd":1},"dur":0.6},"h":{"to":{"t":1},"dur":0.6},"l":{"to":{"t":2},"dur":0.6},"cut":{"to":{"cutd":1},"dur":0.6}},"route":["全部に入れる","面積の方向に半分","間に挟む"]}},{"id":"t17s6x","scene":"t17s6x","kind":"u17s6half","lab":{"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}_r=3","ca":["","{C}_0/2"],"cb":["","3{C}_0/2"]},"viewbox":"134 154 813 481","band":{"want":"面積の半分に誘電体を入れた静電容量","known":"真空中で $C_0$、$\\varepsilon_r = 3$","ans":"$C = 2C_0$"},"narr":{"start":{"co":1,"medd":1,"cutd":0,"cav":0,"cbv":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、面積の方向に半分だけ誘電体を入れた時の静電容量です。真空中の $C_0$ の何倍かを求めます。","at":{"強調":1.0},"after":[],"emph":["Cap"]},{"text":"①2つに分ける\n②それぞれを求める\n③足す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"真ん中で分けると、誘電体の無い部分と有る部分の並列です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"cut","emph":["Cut","Ca","Cb"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"どちらも面積は半分なので、真空の部分は $\\dfrac{C_0}{2}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ca"]},{"text":"誘電体の部分は、さらに比誘電率の 3 倍で、$\\dfrac{3C_0}{2}$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ab","emph":["Cb","Med","Ca"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖並列なので足します〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Ca","Cb","Cap"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_0}{2} + \\dfrac{3C_0}{2} = 2C_0"]]}],"ans":true,"emphPre":["Ca","Cb","Cap"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"],"Cut":["cut"],"Ca":["cat0","cat1"],"Cb":["cbt0","cbt1"]},"moves":{"cut":{"to":{"cutd":1},"dur":0.6},"ab":{"to":{"cav":1,"cbv":1},"dur":0.5}},"route":["2つに分ける","それぞれを求める","足す"]}}],"secs":[{"ex":{"text":"静電容量 $2\\,\\mathrm{F}$ のコンデンサに $6\\,\\mathrm{V}$ の電圧を加えた。蓄えられる電荷は何 C か。","fig":{"kind":"u17s1ch","L":{"src":"{V}=6 V","c":"{C}=2 F","q":"{Q}","v":"{V}=6 V"},"P":{}},"ch":[{"t":"$3\\,\\mathrm{C}$","v":"3","why":"電圧を静電容量で割った"},{"t":"$12\\,\\mathrm{C}$","v":"12","why":""},{"t":"$8\\,\\mathrm{C}$","v":"8","why":"掛けるのでなく足した"},{"t":"$\\dfrac{1}{3}\\,\\mathrm{C}$","v":"1/3","why":"静電容量を電圧で割った"}],"ans":1}},{"ex":{"text":"平行平板コンデンサの極板間の距離を半分にし、極板の面積を 3 倍にした。静電容量は元の何倍になるか。","fig":{"kind":"u17s2pl","L":{"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}"},"P":{}},"ch":[{"t":"$\\dfrac{3}{2}$ 倍","v":"3/2","why":"静電容量は距離に反比例する（距離が半分なら 2 倍）"},{"t":"$6$ 倍","v":"6","why":""},{"t":"$\\dfrac{1}{6}$ 倍","v":"1/6","why":"静電容量は面積に比例し、距離に反比例する（逆にした）"},{"t":"$\\dfrac{2}{3}$ 倍","v":"2/3","why":"面積に比例し、距離に反比例する（逆にした）"}],"ans":1}},{"ex":{"text":"静電容量 $4\\,\\mathrm{F}$ と $12\\,\\mathrm{F}$ のコンデンサを直列につないだ。合成静電容量は何 F か。","fig":{"kind":"u17s3ser","L":{"src":"{V}","c1":"{C}_1=4 F","c2":"{C}_2=12 F","q1":null,"q2":null},"P":{}},"ch":[{"t":"$16\\,\\mathrm{F}$","v":"16","why":"直列のコンデンサは足さない（和分の積）"},{"t":"$3\\,\\mathrm{F}$","v":"3","why":""},{"t":"$48\\,\\mathrm{F}$","v":"48","why":"積を和で割っていない"},{"t":"$\\dfrac{1}{3}\\,\\mathrm{F}$","v":"1/3","why":"和を積で割った（逆数のまま）"}],"ans":1}},{"ex":{"text":"静電容量 $C_1 = 1\\,\\mathrm{F}$ と $C_2 = 3\\,\\mathrm{F}$ のコンデンサを直列につなぎ、$12\\,\\mathrm{V}$ の電圧を加えた。$C_1$ にかかる電圧は何 V か。","fig":{"kind":"u17s4ser","L":{"src":"{V}=12 V","c1":"{C}_1=1 F","c2":"{C}_2=3 F","q1":"{Q}","q2":"{Q}","v1":"{V}_1","v2":"{V}_2","_v":{"c1":1,"c2":3}},"P":{}},"ch":[{"t":"$3\\,\\mathrm{V}$","v":3,"why":"静電容量の比のまま分けた（逆比で分ける）"},{"t":"$9\\,\\mathrm{V}$","v":9,"why":""},{"t":"$6\\,\\mathrm{V}$","v":6,"why":"等しく分かれると考えた"},{"t":"$12\\,\\mathrm{V}$","v":12,"why":"電源の電圧がそのままかかると考えた"}],"ans":1}},{"ex":{"text":"静電容量 $2\\,\\mathrm{F}$ と $6\\,\\mathrm{F}$ のコンデンサを並列につないだ。合成静電容量は何 F か。","fig":{"kind":"u17s5par","L":{"src":"{V}=10 V","c1":"{C}_1=2 F","c2":"{C}_2=6 F","v1":"{V}","v2":"{V}"},"P":{}},"ch":[{"t":"$1.5\\,\\mathrm{F}$","v":"1.5","why":"和分の積は直列の式。並列は足す"},{"t":"$8\\,\\mathrm{F}$","v":"8","why":""},{"t":"$12\\,\\mathrm{F}$","v":"12","why":"掛けるのでなく足す"},{"t":"$4\\,\\mathrm{F}$","v":"4","why":"引くのでなく足す"}],"ans":1}},{"ex":{"text":"真空中で静電容量 $C_0$ の平行平板コンデンサがある。極板間の、面積の方向に半分だけ、比誘電率 3 の誘電体を入れた。静電容量は $C_0$ の何倍になるか。","fig":{"kind":"u17s6half","L":{"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}","med":"{ε}_r=3"},"P":{}},"ch":[{"t":"$3$ 倍","v":"3","why":"全部に入れた時の値。半分だけなので、並列で足す"},{"t":"$2$ 倍","v":"2","why":""},{"t":"$4$ 倍","v":"4","why":"それぞれの面積を半分にしていない"},{"t":"$\\dfrac{3}{8}$ 倍","v":"3/8","why":"面積の方向に分けた時は、直列でなく並列"}],"ans":1}}],"past":[]}};
});
