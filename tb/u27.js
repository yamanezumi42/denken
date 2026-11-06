/* 単元27「正弦波交流」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(27, function(H){
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
  // 名前 a・b の場所は生成器（figkit_tr.py の _tr_obstacles）が選ぶ（it.la・it.lb）。2026-11-06 単元26：前の決まった場所は、a が開いた刃の先に重なった
  if (L.a !== undefined) { if (it.la) tbGen_Lab(d, k + ":ta", it.la[0], it.la[1], L.a, p, "a", o, it.la[2]); else d.text(k + ":ta0", it.x1, it.y1 - (h ? 26 : 24), L.a, {o: o}); }
  if (L.b !== undefined) { if (it.lb) tbGen_Lab(d, k + ":tb", it.lb[0], it.lb[1], L.b, p, "b", o, it.lb[2]); else d.text(k + ":tb0", bx + 20, by + (h ? 6 : 0), L.b, {o: o, anchor: "start"}); }
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
  var lx, ly, la;
  if (it.lab) { lx = it.lab[0]; ly = it.lab[1]; la = it.lab[2]; }
  else if (it.dir === "h") { lx = x; ly = y + 46; la = undefined; }
  else { lx = x + (it.side || 1) * 36; ly = y; la = (it.side || 1) > 0 ? "start" : "end"; }
  tbGen_Lab(d, "e" + s, lx, ly, L[it.k], p, it.k, o, la);
  // 2026-11-07 単元27：字の大きい図で、長い名前（v=100√2 sin ωt）が丸にかかった（27-6 の例題）→ 字の箱を測り、丸から離れる向きへずらす
  var b = tbFig_TBox(d, ["e" + s + "0", "e" + s + "1"]);
  if (b) {
    var m = r + 6, c = [x - m, y - m, x + m, y + m], hh = b[3] - b[1], t = [b[0], b[1] + 0.16 * hh, b[2], b[3] - 0.14 * hh];
    if (Math.min(t[2], c[2]) - Math.max(t[0], c[0]) > 0 && Math.min(t[3], c[3]) - Math.max(t[1], c[1]) > 0) {
      var cx = (b[0] + b[2]) / 2 - x, cy = (b[1] + b[3]) / 2 - y, dx = 0, dy = 0;
      if (Math.abs(cy) * (b[2] - b[0]) >= Math.abs(cx) * hh) dy = cy >= 0 ? c[3] - t[1] : c[1] - t[3];
      else dx = cx >= 0 ? c[2] - t[0] : c[0] - t[2];
      tbGen_Lab(d, "e" + s, lx + dx, ly + dy, L[it.k], p, it.k, o, la);
    }
  }
}
// ---- 名前の置き場所（交流の図：波形・ベクトル図。2026-11-07 単元27 のまとめ役）
// 前は名前を決まった場所に描いたので、目盛りの名前どうし・点の名前と波の名前・名前と線が重なり、図の枠の外にも出た（27-1・27-4〜27-6）。
// → 線と点を先に描き、名前を1つずつ候補の場所に置く。字の箱を測り（getBBox）、線・点・先に置いた名前・図の枠（viewBox）にかからない
// 最初の候補へ。どれもかかる時は、かかる数の一番少ない候補。重なりの決まりは check_tb_slides の labov と同じ（字の箱の上 16%・下 14% を削る）。
// 候補 [x, y, ux, uy, g]＝点 (x, y) から向き (ux, uy)（-1・0・1）へ、字の箱の端を g 離す（0 の向きは真ん中をそろえる。g が負の時は字の高さの -g 倍）。
function tbFig_Room(d){
  var vb = d.svg && d.svg.getAttribute("viewBox"), b = vb ? vb.split(/[\s,]+/).map(Number) : null;
  var sw = parseFloat(d.g && d.g.getAttribute("stroke-width")) || 3.2;
  return {segs: [], boxes: [], sw: sw, vb: b && b.length === 4 && b[2] > 0 ? [b[0], b[1], b[0] + b[2], b[1] + b[3]] : null};
}
// 字の箱（id の文字の全部を合わせた箱。測れない時＝隠れた図は字の数から見積もる）
function tbFig_TBox(d, ids){
  var b = null;
  ids.forEach(function(id){
    var e = d.els[id], r = null; if (!e || !d.seen[id] || !e.textContent) return;
    try { var q = e.getBBox(); if (q.width > 0 && q.height > 0) r = [q.x, q.y, q.x + q.width, q.y + q.height]; } catch (er) {}
    if (!r) {
      var fs = parseFloat(getComputedStyle(e).fontSize) || 30, w = e.textContent.length * 0.6 * fs, x = +e.getAttribute("x"), y = +e.getAttribute("y"), an = e.getAttribute("text-anchor");
      var x0 = an === "start" ? x : an === "end" ? x - w : x - w / 2; r = [x0, y - 0.6 * fs, x0 + w, y + 0.6 * fs];
    }
    b = b ? [Math.min(b[0], r[0]), Math.min(b[1], r[1]), Math.max(b[2], r[2]), Math.max(b[3], r[3])] : r;
  });
  return b;
}
function tbFig_Trim(b){ var h = b[3] - b[1]; return [b[0], b[1] + 0.16 * h, b[2], b[3] - 0.14 * h]; }
function tbFig_SegHit(g, r){
  var w = g[4], q = [r[0] - w, r[1] - w, r[2] + w, r[3] + w], x0 = g[0], y0 = g[1], dx = g[2] - x0, dy = g[3] - y0, t0 = 0, t1 = 1, i;
  var P = [[-dx, x0 - q[0]], [dx, q[2] - x0], [-dy, y0 - q[1]], [dy, q[3] - y0]];
  for (i = 0; i < 4; i++) {
    var a = P[i][0], v = P[i][1];
    if (Math.abs(a) < 1e-9) { if (v < 0) return false; continue; }
    var t = v / a; if (a < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t1 - t0 > 1e-6;
}
function tbFig_Hits(R, b){
  var t = tbFig_Trim(b), s = 0, m = [t[0] - 3, t[1] - 3, t[2] + 3, t[3] + 3];
  if (R.vb && (b[0] < R.vb[0] + 2 || b[2] > R.vb[2] - 2 || b[1] < R.vb[1] + 2 || b[3] > R.vb[3] - 2)) s += 100;
  R.boxes.forEach(function(q){ if (Math.min(m[2], q[2]) - Math.max(m[0], q[0]) > 0 && Math.min(m[3], q[3]) - Math.max(m[1], q[1]) > 0) s++; });
  R.segs.forEach(function(g){ if (tbFig_SegHit(g, m)) s++; });
  return s;
}
// 置き場所の障害物：線（折れ線・太さ w）・矢印（矢じりも）・点（半径 r）。濃さ o が 0.05 以下の物は入れない（見えない物）
function tbFig_RLine(R, pts, w, o){ if (!(o > 0.05)) return; var h = (w || R.sw) / 2, i; for (i = 1; i < pts.length; i++) R.segs.push([pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], h]); }
function tbFig_RArr(R, x0, y0, x1, y1, o, w){
  if (!(o > 0.05)) return;
  var dx = x1 - x0, dy = y1 - y0, Ln = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / Ln, uy = dy / Ln;
  var a = [x1 - ux * 13 - uy * 7, y1 - uy * 13 + ux * 7], b = [x1 - ux * 13 + uy * 7, y1 - uy * 13 - ux * 7];
  tbFig_RLine(R, [[x0, y0], [x1, y1]], w, o); tbFig_RLine(R, [a, [x1, y1], b, a], null, o);
}
function tbFig_RDot(R, x, y, r, o){ if (o > 0.05) R.boxes.push([x - r, y - r, x + r, y + r]); }
// draw(x, y)＝真ん中そろえで (x, y) に描く。ids＝描いた文字の id
function tbFig_Place(d, R, ids, draw, cands, o){
  var c0 = cands[0]; draw(c0[0], c0[1]);
  var b = tbFig_TBox(d, ids); if (!b) return;
  var bw = b[2] - b[0], bh = b[3] - b[1], best = null, bs = 1e9, i;
  for (i = 0; i < cands.length; i++) {
    var c = cands[i], g = c[4] < 0 ? -c[4] * bh : c[4];
    var nx = c[2] > 0 ? c[0] + g : c[2] < 0 ? c[0] - g - bw : c[0] - bw / 2;
    var ny = c[3] > 0 ? c[1] + g : c[3] < 0 ? c[1] - g - bh : c[1] - bh / 2;
    var nb = [nx, ny, nx + bw, ny + bh], s = tbFig_Hits(R, nb);
    if (s < bs) { bs = s; best = nb; }
    if (!s) break;
  }
  draw(c0[0] + best[0] - b[0], c0[1] + best[1] - b[1]);
  if (o > 0.05) R.boxes.push(tbFig_Trim(best));
}
// 名前 L[k]（tbFig_Lb の id＝id + "t0"・"t1"・"t2"）
function tbFig_PlaceL(d, R, id, L, p, k, o, cands){
  var v = L[k]; if (v === undefined || v === null || v === "") return;
  tbFig_Place(d, R, [id + "t0", id + "t1", id + "t2"], function(x, y){ tbFig_Lb(d, id, x, y, L, p, k, o, "middle"); }, cands, o);
}
// 点 (x, y) のまわり8方向の候補を、向き (ux, uy) に近い順に。g が配列の時は、近い離れ（g[0]）の8方向 → 次の離れ…の順
function tbFig_Around(x, y, ux, uy, g){
  var D = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]], Ln = Math.sqrt(ux * ux + uy * uy) || 1;
  var ds = D.map(function(a, i){ return [a, (a[0] * ux + a[1] * uy) / (Ln * Math.sqrt(a[0] * a[0] + a[1] * a[1])) - i * 1e-6]; })
            .sort(function(P, Q){ return Q[1] - P[1]; }), out = [];
  [].concat(g).forEach(function(gg){ ds.forEach(function(q){ out.push([x, y, q[0][0], q[0][1], gg]); }); });
  return out;
}
// 波形
function tbFig_Wave(d, it, L, p, o){
  if (it.df) L = Object.assign({}, it.df, L);
  var S = it.sfx || "", X0 = it.X0, W = it.W, Yc = it.Yc, H = it.H, A = H * 0.8, R = tbFig_Room(d), labs = [];
  var lab = function(pr, f){ labs.push([pr, labs.length, f]); };   // 名前は線を全部描いてから、優先の順（pr の小さい順）に置く
  var per = tbFig_Num(L.per, 1), left = tbFig_Num(L.left, 0), span = per + left;
  // 横の範囲＝時刻 -left〜per を X0〜X0+W に。縦の軸は時刻 0（原点）。2026-11-07 単元27：前は縦の軸を -left に置き、横の軸は X0 から引いたので、
  // left のある図（27-5）で軸が左へずれて図の左が切れ、原点が波の 0 の点とずれた
  var X = function(f){ return X0 + ((f + left) / span) * W; }, x0 = X(0), xe = X0 + W;
  // 目盛りの名前の [前, 後] は、xNv が無い時は p.xv で4つ同時に入れ替える（27-4）
  var pX = Object.assign({}, p);
  ["1", "2", "3", "4"].forEach(function(k){ if (p["x" + k + "v"] === undefined && p.xv !== undefined) pX["x" + k + "v"] = p.xv; });
  // 軸
  tbFig_Arr(d, "wax" + S, X0 - 10, Yc, xe + 40, Yc, o); tbFig_Arr(d, "way" + S, x0, Yc + H, x0, Yc - H - 20, o);
  tbFig_RArr(R, X0 - 10, Yc, xe + 40, Yc, o); tbFig_RArr(R, x0, Yc + H, x0, Yc - H - 20, o);
  lab(1, function(){ tbFig_PlaceL(d, R, "wax" + S, L, p, "ax", o, [[xe + 40, Yc, 1, 0, 12], [xe + 40, Yc, -1, 1, 10], [xe + 40, Yc, -1, -1, 10]]); });
  lab(1, function(){ tbFig_PlaceL(d, R, "way" + S, L, p, "ay", o, [[x0, Yc - H - 14, -1, 0, 12], [x0, Yc - H - 20, 0, -1, 6], [x0, Yc - H - 14, 1, 0, 14]]); });
  lab(2, function(){ tbFig_Place(d, R, ["wo" + S], function(x, y){ d.text("wo" + S, x, y, "0", {o: o}); },
                                    [[x0, Yc, -1, 1, 6], [x0, Yc, 1, 1, 6], [x0, Yc, -1, -1, 6], [x0, Yc, 1, -1, 6]], o); });
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
    var ofl = o * pv(p, "filld", 1), fe = tbFig_Poly(d, "wfl" + S, fp, ofl, null, 1); fe.style.fill = fe.classList.contains("on") ? "rgba(255,146,43,.45)" : "rgba(116,192,252,.35)";
    tbFig_RLine(R, fp, 1, ofl);
    var fm = (fa + fb) / 2, fxm = X(fm), fym = w1y(fm);
    lab(6, function(){ tbFig_PlaceL(d, R, "wfl" + S, L, p, "fill", ofl, [[fxm, Yc + (fym - Yc) * 0.4, 0, 0, 0], [fxm, Yc + (fym - Yc) * 0.6, 0, 0, 0],
                                                                         [fxm, Yc + (fym - Yc) * 0.25, 0, 0, 0], [fxm, fym, 0, fym < Yc ? -1 : 1, 10]]); });
  }
  // 高さの線（lv1box＝長方形）
  ["1", "2"].forEach(function(k){
    if (L["lv" + k] === undefined || L["lv" + k] === null) return;
    var at = tbFig_Num(L["lv" + k + "at"], 0.7071), la = tbFig_Num(L["lv" + k + "a"], 0), lb = tbFig_Num(L["lv" + k + "b"], per), y = Yc - A * at, oo = o * pv(p, "lv" + k + "d", 1);
    if (k === "1" && L.lv1box) { var be = tbFig_Poly(d, "wlb1" + S, [[X(la), Yc], [X(la), y], [X(lb), y], [X(lb), Yc]], oo, null, 1);
      be.style.fill = be.classList.contains("on") ? "rgba(255,146,43,.4)" : "rgba(255,192,120,.35)"; tbFig_RLine(R, [[X(la), Yc], [X(la), y], [X(lb), y], [X(lb), Yc]], 1, oo); }
    tbFig_Poly(d, "wlv" + k + S, [[X(la), y], [X(lb), y]], oo, "#e67700", 3, true); tbFig_RLine(R, [[X(la), y], [X(lb), y]], 3, oo);
    lab(6, function(){ tbFig_PlaceL(d, R, "wlv" + k + S, L, p, "lv" + k, oo, [[X(lb), y, 1, 0, 12], [X(lb), y, 1, -1, 4], [X(lb), y, 1, 1, 4], [X(la), y, -1, 0, 12]]); });
  });
  // 波
  ["1", "2", "3"].forEach(function(k, i){
    if (L["w" + k] === undefined || L["w" + k] === null) return;
    var ph = tbFig_Num(L["w" + k + "p"], 0) * pv(p, "w" + k + "m", 1), pts = [], q, N = 120, dd = pv(p, "w" + k + "d", 1);
    for (q = 0; q <= N * dd; q++) { var f = -left + span * q / N; pts.push([X(f), Yc - A * val(+k, f, ph)]); }
    if (pts.length < 2) pts = [[X(-left), Yc], [X(-left), Yc]];
    var ow = o * (dd > 0.01 ? 1 : 0), ol = o * (dd > 0.5 ? 1 : 0);
    tbFig_Poly(d, "ww" + k + S, pts, ow, cols[i], 4); tbFig_RLine(R, pts, 4, ow);
    // 名前の候補：見えている山（谷）の外側のまわり → 波の右の端
    var fe = -left + span * Math.min(1, dd), cands = [], f0 = (0.25 - ph / 360) - Math.ceil((0.25 - ph / 360 + left) * 2) / 2, j;
    for (j = 0; j < 8; j++) {
      var fk = f0 + j * 0.5; if (fk < -left - 1e-9 || fk > fe + 1e-9) continue;
      var yk = Yc - A * val(+k, fk, ph), up = yk <= Yc ? -1 : 1;
      cands.push([X(fk), yk, 1, up, 8], [X(fk), yk, -1, up, 8], [X(fk), yk, 0, up, 12]);
    }
    var pe = pts[pts.length - 1]; cands.push([pe[0], pe[1], 1, 0, 12], [pe[0], pe[1], 1, -1, 8], [pe[0], pe[1], 1, 1, 8]);
    lab(8, function(){ tbFig_PlaceL(d, R, "ww" + k + S, L, p, "w" + k, ol, cands); });
  });
  // 横の軸の目盛り（名前は、波の点線と反対の側が先）
  ["1", "2", "3", "4"].forEach(function(k){
    if (L["x" + k] === undefined || L["x" + k] === null) return;
    var at = tbFig_Num(L["x" + k + "at"], +k * 0.25), x = X(at), y = w1y(at), sd = y > Yc + 1 ? -1 : 1;
    tbFig_Poly(d, "wx" + k + S, [[x, Yc], [x, y]], o, null, 2, true); tbFig_RLine(R, [[x, Yc], [x, y]], 2, o);
    lab(4, function(){ tbFig_PlaceL(d, R, "wx" + k + S, L, pX, "x" + k, o, [[x, Yc, 0, sd, 10], [x, Yc, 0, -sd, 10], [x, Yc, -1, sd, 6], [x, Yc, 1, sd, 6],
                                                                      [x, Yc, -1, -sd, 6], [x, Yc, 1, -sd, 6], [x, Yc, 0, sd, -1.3], [x, Yc, 0, -sd, -1.3],
                                                                      [x, Yc - A, 0, -1, 10], [x, Yc + A, 0, 1, 10]]); });   // 波が込み合う時（27-5）は山の上・谷の下
  });
  // 縦の軸の目盛り（名前は縦の軸の左が先。図の枠から出る時は軸の右の、点線の外側）
  [["1", 1], ["2", -1], ["3", null]].forEach(function(a){
    var k = a[0]; if (L["y" + k] === undefined || L["y" + k] === null) return;
    var h = a[1] === null ? tbFig_Num(L.y3at, 0.5) : a[1] * tbFig_Num(L.w1a, 1), y = Yc - A * h, fpk = a[1] === -1 ? 0.75 : 0.25, sd = y > Yc ? 1 : -1;
    tbFig_Poly(d, "wy" + k + S, [[x0, y], [X(fpk), y]], o, null, 2, true); tbFig_RLine(R, [[x0, y], [X(fpk), y]], 2, o);
    lab(3, function(){ tbFig_PlaceL(d, R, "wy" + k + S, L, p, "y" + k, o, [[x0, y, -1, 0, 12], [x0, y, -1, sd, 4], [x0, y, 1, sd, 6]]); });
  });
  // 周期の寸法線
  if (L.per1 !== undefined && L.per1 !== null) {
    var pa = tbFig_Num(L.per1a, 0), pb = tbFig_Num(L.per1b, 1), yp = Yc - A - 50, op = o * pv(p, "per1d", 1);
    d.arrow("wpr" + S, X(pa) + 6, yp, X(pb), yp, {o: op});
    var h2 = d.el("wpr" + S + ":h2", "path", "ink head"), xa = X(pa);   // id＝wpr＋sfx＋":h2"
    h2.setAttribute("d", "M" + n(xa) + " " + yp + " L" + n(xa + 13) + " " + (yp - 7) + " L" + n(xa + 13) + " " + (yp + 7) + " Z"); d.style(h2, {o: op});
    tbFig_RArr(R, X(pb), yp, X(pa), yp, op); tbFig_RArr(R, X(pa), yp, X(pb), yp, op);
    var pm = (X(pa) + X(pb)) / 2;
    lab(5, function(){ tbFig_PlaceL(d, R, "wpr" + S, L, p, "per1", op, [[pm, yp, 0, -1, 8], [pm, yp, 0, 1, 8]]); });
  }
  // 点のまわりの名前の候補（点線の無い側が先）
  var ptc = function(x, y){ var u = y > Yc + 1 ? 1 : -1;
    return [[x, y, 1, u, 8], [x, y, -1, u, 8], [x, y, 0, u, 12], [x, y, 1, 0, 14], [x, y, -1, 0, 14], [x, y, 1, -u, 8], [x, y, -1, -u, 8]]; };
  // 2つ目の点（pt2）
  if (L.pt2 !== undefined && L.pt2 !== null) {
    var qa2 = tbFig_Num(L.pt2at, 0.375), qx = X(qa2), qy = w1y(qa2), oq = o * pv(p, "pt2d", 1);
    d.dot("wpt2" + S, qx, qy, {o: oq}); tbFig_Poly(d, "wpt2l" + S, [[qx, qy], [qx, Yc]], oq, null, 2, true);
    tbFig_RDot(R, qx, qy, 5, oq); tbFig_RLine(R, [[qx, qy], [qx, Yc]], 2, oq);
    lab(7, function(){ tbFig_PlaceL(d, R, "wpt2" + S, L, p, "pt2", oq, ptc(qx, qy)); });
  }
  // 1周期の線を太く（mark）・波のスタートの点（sN）
  if (L.w1 !== undefined && L.w1 !== null) { var mp = [], q2, om = o * pv(p, "mark", 0); for (q2 = 0; q2 <= 60; q2++) mp.push([X(q2 / 60), w1y(q2 / 60)]); tbFig_Poly(d, "ww1a" + S, mp, om, "#e67700", 7); tbFig_RLine(R, mp, 7, om); }
  ["2", "3"].forEach(function(k){
    if (L["s" + k] === undefined || L["s" + k] === null || L["w" + k] === undefined || L["w" + k] === null) return;
    var ph = tbFig_Num(L["w" + k + "p"], 0) * pv(p, "w" + k + "m", 1), f0 = -ph / 360, os = o * (pv(p, "w" + k + "d", 1) > 0.5 ? 1 : 0);
    var e = d.el("ws" + k + S, "circle", "ink term"); e.setAttribute("cx", n(X(f0))); e.setAttribute("cy", n(Yc)); e.setAttribute("r", 7); d.style(e, {o: os});
    tbFig_RDot(R, X(f0), Yc, 9, os);
  });
  // 点（ptm＝ptat から ptat2 へ動く）
  if (L.pt !== undefined && L.pt !== null) {
    var pa1 = tbFig_Num(L.ptat, 0.25), pa2 = pa1 + (tbFig_Num(L.ptat2, pa1) - pa1) * pv(p, "ptm", 0), px = X(pa2), py = w1y(pa2), opt = o * pv(p, "ptd", 1);
    d.dot("wpt" + S, px, py, {o: opt}); tbFig_Poly(d, "wptl" + S, [[px, py], [px, Yc]], opt, null, 2, true);
    tbFig_RDot(R, px, py, 5, opt); tbFig_RLine(R, [[px, py], [px, Yc]], 2, opt);
    lab(7, function(){ tbFig_PlaceL(d, R, "wpt" + S, L, p, "pt", opt, ptc(px, py)); });
  }
  // 名前を置く（優先の順：軸 → 原点 → 縦・横の目盛り → 寸法線 → 高さの線・塗り → 点 → 波）
  labs.sort(function(P, Q){ return P[0] - Q[0] || P[1] - Q[1]; }).forEach(function(q){ q[2](); });
}
// ベクトル図
function tbFig_Phasor(d, it, L, p, o){
  if (it.df) L = Object.assign({}, it.df, L);
  var S = it.sfx || "", Ox = it.Ox, Oy = it.Oy, SC = it.S, R = Math.PI / 180, tips = {}, i;
  // 名前は線を全部描いてから、優先の順に置く（波形と同じ。2026-11-07 単元27：27-6 の名前が点線・矢印に重なった）
  var RM = tbFig_Room(d), labs = [], put = function(pr, f){ labs.push([pr, labs.length, f]); };
  var ks = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].filter(function(k){ return L["a" + k] !== undefined && L["a" + k] !== null; });
  var lmax = Math.max.apply(null, ks.map(function(k){ return tbFig_Num(L["a" + k + "l"], 1); }).concat([0.0001]));
  var flip2 = pv(p, "a2f", 0) > 0.5;
  if (L.cplx) {
    tbFig_Arr(d, "pax" + S, Ox - 120, Oy, Ox + SC + 60, Oy, o); tbFig_Arr(d, "pay" + S, Ox, Oy + 260, Ox, Oy - 290, o);
    tbFig_RArr(RM, Ox - 120, Oy, Ox + SC + 60, Oy, o); tbFig_RArr(RM, Ox, Oy + 260, Ox, Oy - 290, o);
    put(1, function(){ tbFig_PlaceL(d, RM, "paxr" + S, L, p, "axr", o, [[Ox + SC + 60, Oy, -1, 1, 10], [Ox + SC + 60, Oy, 1, 0, 12], [Ox + SC + 60, Oy, -1, -1, 10]]); });
    put(1, function(){ tbFig_PlaceL(d, RM, "paxi" + S, L, p, "axi", o, [[Ox, Oy - 290, 1, 0, 14], [Ox, Oy - 290, -1, 0, 14], [Ox, Oy - 290, 1, 1, 8]]); });
  }
  if (L.ref) { tbFig_Poly(d, "pref" + S, [[Ox, Oy], [Ox + SC * 0.95, Oy]], o, "#adb5bd", 2, true); tbFig_RLine(RM, [[Ox, Oy], [Ox + SC * 0.95, Oy]], 2, o); }
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
    tbFig_Arr(d, "pa" + k + S, x0, y0, x1, y1, oo, colOf(k), 4, L["a" + k + "k"] === "dash"); tbFig_RArr(RM, x0, y0, x1, y1, oo, 4);
    var ux = Math.cos(g * R), uy = -Math.sin(g * R);
    var lab = L["a" + k];
    if (L["a" + k + "dot"]) { var dot = function(s){ return typeof s === "string" ? s.replace(/^\{(.)/, "{$1̇") : s; }; lab = Array.isArray(lab) ? lab.map(dot) : dot(lab); }
    var L2 = Object.assign({}, L); L2["a" + k] = lab;
    // 名前の候補：矢印の先のまわり（矢印の向きに近い順）→ 矢印の真ん中の両わき
    var cands = tbFig_Around(x1, y1, ux, uy, 8), xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, nx = Math.round(-uy), ny = Math.round(ux);
    cands.push([xm, ym, nx, ny, 10], [xm, ym, -nx, -ny, 10]);
    cands = cands.concat(tbFig_Around(x1, y1, ux, uy, -0.8));
    put(3, function(){ tbFig_PlaceL(d, RM, "pa" + k + S, L2, p, "a" + k, oo, cands); });
  });
  d.dot("po" + S, Ox, Oy, {o: o}); tbFig_RDot(RM, Ox, Oy, 5, o);
  if (L.o1 !== undefined) put(2, function(){ tbFig_PlaceL(d, RM, "po1" + S, L, p, "o1", o, [[Ox, Oy, -1, 1, 8], [Ox, Oy, -1, -1, 8], [Ox, Oy, 1, 1, 8], [Ox, Oy, -1, 0, 12]]); });
  if (L.dg1 !== undefined && L.dg1 !== null && tips["1"] && tips["2"]) { var odg = o * pv(p, "dg1d", 1); tbFig_Poly(d, "pdg1" + S, [tips["1"], tips["2"]], odg, "#e67700", 3, true); tbFig_RLine(RM, [tips["1"], tips["2"]], 3, odg); }
  if (L.dirs) [["d0", 0], ["d90", 90], ["d180", 180], ["dm90", -90]].forEach(function(a){
    var od = o * pv(p, "dirsd", 1), g = a[1] * R, x = Ox + 230 * Math.cos(g), y = Oy - 230 * Math.sin(g);
    tbFig_Poly(d, "p" + a[0] + S, [[Ox, Oy], [x, y]], od, "#adb5bd", 2, true); tbFig_RLine(RM, [[Ox, Oy], [x, y]], 2, od);
    put(4, function(){ tbFig_PlaceL(d, RM, "p" + a[0] + S, L, p, a[0], od, tbFig_Around(x, y, Math.cos(g), -Math.sin(g), 10)); });
  });
  var mid = function(P, Q){ return [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; }, os = o * pv(p, "sd", 1);
  if (tips["1"] && L.s1 !== undefined) { var m1 = mid([Ox, Oy], tips["1"]); put(6, function(){ tbFig_PlaceL(d, RM, "ps1" + S, L, p, "s1", os, tbFig_Around(m1[0], m1[1], 0, 1, 10)); }); }
  if (tips["1"] && tips["2"] && L.s2 !== undefined) { var e2 = [tips["1"][0] + tips["2"][0] - Ox, tips["1"][1] + tips["2"][1] - Oy], m2 = mid(tips["1"], e2);
    put(6, function(){ tbFig_PlaceL(d, RM, "ps2" + S, L, p, "s2", os, tbFig_Around(m2[0], m2[1], 1, 0, 10)); }); }
  if (tips["3"] && L.s3 !== undefined) { var m3 = mid([Ox, Oy], tips["3"]); put(6, function(){ tbFig_PlaceL(d, RM, "ps3" + S, L, p, "s3", os, tbFig_Around(m3[0], m3[1], -1, -1, 10)); }); }
  // 角の弧
  ["1", "2", "3"].forEach(function(k, j){
    if (L["g" + k] === undefined || L["g" + k] === null) return;
    var f = tbFig_Num(L["g" + k + "f"], 0), t = tbFig_Num(L["g" + k + "t"], 0), rr = 80 + j * 26, pts = [], q, og = o * pv(p, "g" + k + "d", 1);
    if (k === "1" && flip2) t = -t;
    for (q = 0; q <= 24; q++) { var a = (f + (t - f) * q / 24) * R; pts.push([Ox + rr * Math.cos(a), Oy - rr * Math.sin(a)]); }
    tbFig_Poly(d, "pg" + k + S, pts.slice(0, -2), og, null, 2); tbFig_RLine(RM, pts.slice(0, -2), 2, og);
    tbFig_Arr(d, "pg" + k + "a" + S, pts[22][0], pts[22][1], pts[24][0], pts[24][1], og); tbFig_RArr(RM, pts[22][0], pts[22][1], pts[24][0], pts[24][1], og);
    // 名前の候補：弧の真ん中の外側（弧から離れる順）→ 弧の内側
    var m = (f + t) / 2 * R, cm = Math.cos(m), sm = -Math.sin(m), cands = [];
    [rr, rr + 40, rr + 80].forEach(function(r2){ cands = cands.concat(tbFig_Around(Ox + r2 * cm, Oy + r2 * sm, cm, sm, 8).slice(0, 3)); });
    cands = cands.concat(tbFig_Around(Ox + rr * cm, Oy + rr * sm, -cm, -sm, 8).slice(0, 3));
    put(5, function(){ tbFig_PlaceL(d, RM, "pg" + k + S, L, p, "g" + k, og, cands); });
  });
  // 回る向き
  if (L.rot) {
    var orr = o * pv(p, "rotd", 1), r0 = 150, mk = function(id, a0, a1){ var pts = [], q; for (q = 0; q <= 20; q++) { var a = (a0 + (a1 - a0) * q / 20) * R; pts.push([Ox + r0 * Math.cos(a), Oy - r0 * Math.sin(a)]); }
      tbFig_Poly(d, id + S, pts.slice(0, -2), orr, "#868e96", 2, true); tbFig_Arr(d, id + "h" + S, pts[18][0], pts[18][1], pts[20][0], pts[20][1], orr, "#868e96");
      tbFig_RLine(RM, pts.slice(0, -2), 2, orr); tbFig_RArr(RM, pts[18][0], pts[18][1], pts[20][0], pts[20][1], orr); return pts[10]; };
    var pa = mk("prA", 15, 75), pb = mk("prB", -15, -75), c45 = Math.SQRT1_2;
    put(7, function(){ tbFig_PlaceL(d, RM, "pradv" + S, L, p, "adv", orr, tbFig_Around(pa[0], pa[1], c45, -c45, [8, -0.8, -1.6])); });
    put(7, function(){ tbFig_PlaceL(d, RM, "prlag" + S, L, p, "lag", orr, tbFig_Around(pb[0], pb[1], c45, c45, [8, -0.8, -1.6])); });
  }
  // 平行四辺形
  if (L.pg1 !== undefined && L.pg1 !== null) {
    var ab = String(L.pg1ab || "a1,a2").split(",").map(function(s){ return s.trim().replace(/^a/, ""); }), A1 = tips[ab[0]], A2 = tips[ab[1]];
    if (A1 && A2) { var opg = o * pv(p, "pg1d", 1), sx = A1[0] + A2[0] - Ox, sy = A1[1] + A2[1] - Oy;
      tbFig_Poly(d, "ppg1" + S, [A1, [sx, sy]], opg, null, 2, true); tbFig_Poly(d, "ppg2" + S, [A2, [sx, sy]], opg, null, 2, true);
      tbFig_RLine(RM, [A1, [sx, sy]], 2, opg); tbFig_RLine(RM, [A2, [sx, sy]], 2, opg); }
  }
  // 成分（横の長さの名前は横の点線の下が先・縦の長さの名前は縦の点線の外側が先）
  var comp = function(sf, T, st, oc){
    var sx = T[0] >= st[0] ? 1 : -1, sy = T[1] <= st[1] ? 1 : -1, xm = (st[0] + T[0]) / 2, ym = (st[1] + T[1]) / 2;
    tbFig_Poly(d, "pc" + sf + "a" + S, [T, [T[0], st[1]]], oc, null, 2, true); tbFig_Poly(d, "pc" + sf + "b" + S, [[st[0], st[1] + 4], [T[0], st[1] + 4]], oc, "#e67700", 3, true);
    tbFig_RLine(RM, [T, [T[0], st[1]]], 2, oc); tbFig_RLine(RM, [[st[0], st[1] + 4], [T[0], st[1] + 4]], 3, oc);
    put(8, function(){ tbFig_PlaceL(d, RM, "pc" + sf + "x" + S, L, p, "c" + sf + "x", oc, [[xm, st[1] + 4, 0, sy, 10], [xm, st[1], 0, -sy, 10], [xm, st[1] + 4, 0, sy, -1.3]]); });
    put(8, function(){ tbFig_PlaceL(d, RM, "pc" + sf + "y" + S, L, p, "c" + sf + "y", oc, [[T[0], ym, sx, 0, 12], [T[0], ym, -sx, 0, 12], [T[0], ym, sx, 0, -1.5]]); });
  };
  if (L.c1 !== undefined && L.c1 !== null) {
    var T = tips[String(L.c1of || "a1").replace(/^a/, "")];
    if (T) comp("1", T, [Ox, Oy], o * pv(p, "c1d", 1));
  }
  if (L.c2 !== undefined && L.c2 !== null) {
    var T2 = tips[String(L.c2of || "a2").replace(/^a/, "")], st2 = tips[String(L.a2o || "").replace(/^a/, "")] || [Ox, Oy];
    if (T2) comp("2", T2, st2, o * pv(p, "c2d", 1));
  }
  if (L.tx1 !== undefined && tips["1"]) { var t1 = tips["1"];
    tbFig_Poly(d, "ptx1" + S, [[t1[0], Oy], t1], o, null, 2, true); tbFig_RLine(RM, [[t1[0], Oy], t1], 2, o);
    put(8, function(){ tbFig_PlaceL(d, RM, "ptx1" + S, L, p, "tx1", o, [[t1[0], Oy, 0, t1[1] <= Oy ? 1 : -1, 10], [t1[0], Oy, 1, t1[1] <= Oy ? 1 : -1, 6], [t1[0], Oy, -1, t1[1] <= Oy ? 1 : -1, 6]]); }); }
  if (L.ty1 !== undefined && tips["1"]) { var t1y = tips["1"];
    tbFig_Poly(d, "pty1" + S, [[Ox, t1y[1]], t1y], o, null, 2, true); tbFig_RLine(RM, [[Ox, t1y[1]], t1y], 2, o);
    put(8, function(){ tbFig_PlaceL(d, RM, "pty1" + S, L, p, "ty1", o, [[Ox, t1y[1], t1y[0] >= Ox ? -1 : 1, 0, 12], [Ox, t1y[1], t1y[0] >= Ox ? -1 : 1, -1, 6], [Ox, t1y[1], t1y[0] >= Ox ? -1 : 1, 1, 6]]); }); }
  // 名前を置く（優先の順：軸 → 原点 → 矢印 → 向きの線 → 角 → 長さ → 回る向き → 成分・目盛り）
  labs.sort(function(P, Q){ return P[0] - Q[0] || P[1] - Q[1]; }).forEach(function(q){ q[2](); });
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
// ---- 27-1 交流と正弦波 の図（※ textbook/gen/make_section.py が textbook/gen/data/u27_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U27S1K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU27s1wv(d, p, L){ tbFig_Draw(d, p, L, U27S1K.wv); }
// ---- 27-2 周期と周波数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u27_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U27S2K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU27s2wv(d, p, L){ tbFig_Draw(d, p, L, U27S2K.wv); }
// ---- 27-3 瞬時値の式 の図（※ textbook/gen/make_section.py が textbook/gen/data/u27_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U27S3K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU27s3wv(d, p, L){ tbFig_Draw(d, p, L, U27S3K.wv); }
// ---- 27-4 時刻を入れる の図（※ textbook/gen/make_section.py が textbook/gen/data/u27_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U27S4K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU27s4wv(d, p, L){ tbFig_Draw(d, p, L, U27S4K.wv); }
// ---- 27-5 位相 の図（※ textbook/gen/make_section.py が textbook/gen/data/u27_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U27S5K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU27s5wv(d, p, L){ tbFig_Draw(d, p, L, U27S5K.wv); }
// ---- 27-6 抵抗の電流とベクトル図 の図（※ textbook/gen/make_section.py が textbook/gen/data/u27_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U27S6K = {
  cw: {"vars":[],"items":[{"t":"w","id":"u27s6cwL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u27s6cwRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u27s6cww1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u27s6cww2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,309.82,null]},{"t":"i","k":"i","x0":478,"y0":500,"x1":478,"y1":460,"lab":[494,480,"start"],"vis":[],"ax":"v","sd":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:N",1,[]]]},
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  cwp: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u27s6cwpL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u27s6cwpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u27s6cwpw1","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u27s6cwpw2","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,309.82,null]},{"t":"i","k":"i","x0":478,"y0":500,"x1":478,"y1":460,"lab":[494,480,"start"],"vis":[1],"ax":"v","sd":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[1],"df":{}},{"f":"ln","id":"frmx1","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":300,"Oy":430,"S":400,"vis":[2],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:L0:P","L0:L0:N",1,[1]],["R","r","L0:L0:P","L0:L0:N",1,[1]]]}
};
function tbU27s6cw(d, p, L){ tbFig_Draw(d, p, L, U27S6K.cw); }
function tbU27s6pv(d, p, L){ tbFig_Draw(d, p, L, U27S6K.pv); }
function tbU27s6cwp(d, p, L){ tbFig_Draw(d, p, L, U27S6K.cwp); }
var KINDS = {u27s1wv: tbU27s1wv, u27s2wv: tbU27s2wv, u27s3wv: tbU27s3wv, u27s4wv: tbU27s4wv, u27s5wv: tbU27s5wv, u27s6cw: tbU27s6cw, u27s6pv: tbU27s6pv, u27s6cwp: tbU27s6cwp};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 27-1 の図は電流が流れないので載せない,
  // 27-2 の図は電流が流れないので載せない,
  // 27-3 の図は電流が流れないので載せない,
  // 27-4 の図は電流が流れないので載せない,
  // 27-5 の図は電流が流れないので載せない,
  // 27-6 の図は電流が流れないので載せない
};

// 27-1 交流と正弦波 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u27_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU27s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU27s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU27s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU27s1_par(a, b){ return a * b / (a + b); }
function tbU27s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU27s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU27s1_Qvm(r){
  var gcd = tbU27s1_gcd, ratio = tbU27s1_ratio, par = tbU27s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [5,10,12,20,24,30,40,50,60,80,100,120,141,200]);
    var D = (2 * a);
    var H = (a / 2);
    if (!(nice(H))) continue;
    var _c = choices(r, [{t: "$" + fmt(a) + "\\,\\mathrm{V}$", v: fmt(a)}, {t: "$" + fmt(D) + "\\,\\mathrm{V}$", v: fmt(D), why: "山から谷までの幅を読んだ。最大値は山の高さ"}, {t: "$" + fmt(H) + "\\,\\mathrm{V}$", v: fmt(H), why: "最大値は、一番大きくなったときの値（山の高さそのもの）"}, {t: "$0\\,\\mathrm{V}$", v: "0", why: "0 V は電圧の向きが変わるところで、最大値ではない"}]);
    return {form: "u27s1vm", text: "図の正弦波交流の電圧の最大値は何 V か。", fig: {kind: "u27s1wv", L: tbU27s1_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}"}, [["y1", fmt(a) + " V"], ["y2", "-" + fmt(a) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["一番大きくなる値（山の高さ）が最大値", "$V_m = " + fmt(a) + "\\,\\mathrm{V}$"], chk: {form: "u27s1vm", p: {a: a}}};
  }
  throw new Error("u27s1vm：条件に合う数字が見つからない");
}
function tbU27s1_Qpos(r){
  var gcd = tbU27s1_gcd, ratio = tbU27s1_ratio, par = tbU27s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [5,10,12,20,24,30,40,50,60,80,100,120,141,200]);
    var k = pick(r, [0,1,2,3]);
    var at = ([0.25, 0.5, 0.75, 1][k]);
    var good = ([fmt(a), '0', '-' + fmt(a), '0'][k]);
    var _c = choices(r, [{t: "$" + String(good) + "\\,\\mathrm{V}$", v: String(good)}, {t: "$" + String(k == 0 ? '-' + fmt(a) : fmt(a)) + "\\,\\mathrm{V}$", v: String(k == 0 ? '-' + fmt(a) : fmt(a)), why: String(k == 0 ? '山では電圧は正の向きに一番大きい' : (k == 2 ? '谷では電圧の向きが逆なので、負の値' : '山と谷の間で 0 を通る時刻の値を読む'))}, {t: "$" + String(k == 1 || k == 3 ? '-' + fmt(a) : '0') + "\\,\\mathrm{V}$", v: String(k == 1 || k == 3 ? '-' + fmt(a) : '0'), why: String(k == 1 || k == 3 ? '点は 0 を通る時刻にある' : '0 V になるのは、電圧の向きが変わるところ')}, {t: "$" + String(fmt(2 * a)) + "\\,\\mathrm{V}$", v: String(fmt(2 * a)), why: "山から谷までの幅を読んだ"}]);
    return {form: "u27s1pos", text: "図の正弦波交流の電圧で、点の時刻の瞬時値 $v$ は何 V か。", fig: {kind: "u27s1wv", L: tbU27s1_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}"}, [["y1", fmt(a) + " V"], ["y2", "-" + fmt(a) + " V"], ["pt", "{v}"], ["ptat", fmt(at)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["点の時刻は" + String(['正の山', '0 を通るところ', '負の山（谷）', '0 を通るところ'][k]), "$v = " + String(good) + "\\,\\mathrm{V}$"], chk: {form: "u27s1pos", p: {a: a, k: k}}};
  }
  throw new Error("u27s1pos：条件に合う数字が見つからない");
}
function tbU27s1_Qword(r){
  var gcd = tbU27s1_gcd, ratio = tbU27s1_ratio, par = tbU27s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "瞬時値", v: "own"}, {t: "最大値", v: "max", why: "最大値は、一番大きくなったときの値"}, {t: "時定数", v: "tau", why: "時定数は、過渡現象で変化の速さを表す時間"}, {t: "直流の電圧", v: "dc", why: "直流は、落ち着くと値が一定"}]);
    return {form: "u27s1word", text: "時間とともに変わる、その時その時の電圧の値を何というか。", fig: {kind: "u27s1wv", L: tbU27s1_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}"}, [["y1", "{V}_m"], ["y2", "-{V}_m"], ["pt", "{v}"], ["ptat", "0.1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["その時その時の値を瞬時値といい、小文字の $v$ で書く", "瞬時値"], chk: {form: "u27s1word", p: {}}};
  }
  throw new Error("u27s1word：条件に合う数字が見つからない");
}
function tbU27s1_Qdef(r){
  var gcd = tbU27s1_gcd, ratio = tbU27s1_ratio, par = tbU27s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "大きさや向きが周期的に変化する電流", v: "own"}, {t: "大きさも向きも一定の電流", v: "dc", why: "それは直流"}, {t: "スイッチを入れた直後だけ変化し、やがて一定になる電流", v: "tr", why: "それは過渡現象の変化。くり返さない"}, {t: "向きは一定で、大きさだけが変化する電流", v: "one", why: "交流は、向きも変わる（負の値になる）"}]);
    return {form: "u27s1def", text: "交流とは、どのような電流か。", fig: {kind: "u27s1wv", L: tbU27s1_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}"}, [["y1", null], ["y2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["交流は、大きさや向きが周期的に変化し続ける", "大きさや向きが周期的に変化する電流"], chk: {form: "u27s1def", p: {}}};
  }
  throw new Error("u27s1def：条件に合う数字が見つからない");
}
// 27-2 周期と周波数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u27_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU27s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU27s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU27s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU27s2_par(a, b){ return a * b / (a + b); }
function tbU27s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU27s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU27s2_Qf(r){
  var gcd = tbU27s2_gcd, ratio = tbU27s2_ratio, par = tbU27s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [2,4,5,8,10,20,25,40,50,100,125,200,250,500]);
    var T = (1 / f);
    var D = (2 * f);
    var H = (f / 2);
    if (!(nice(T) && nice(H) && distinct([f, T, D, H]))) continue;
    var _c = choices(r, [{t: "$" + fmt(f) + "\\,\\mathrm{Hz}$", v: fmt(f)}, {t: "$" + fmt(T) + "\\,\\mathrm{Hz}$", v: fmt(T), why: "周期のまま。周波数は周期の逆数"}, {t: "$" + fmt(D) + "\\,\\mathrm{Hz}$", v: fmt(D), why: "半分の区間（0 から上がって 0 まで）を1周期とした"}, {t: "$" + fmt(H) + "\\,\\mathrm{Hz}$", v: fmt(H), why: "逆数をとったあと、2 で割った"}]);
    return {form: "u27s2f", text: "図の正弦波交流の周期は $" + fmt(T) + "\\,\\mathrm{s}$ である。周波数は何 Hz か。", fig: {kind: "u27s2wv", L: tbU27s2_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["per1", fmt(T) + " s"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["周波数は周期の逆数", "$f = \\dfrac{1}{" + fmt(T) + "} = " + fmt(f) + "\\,\\mathrm{Hz}$"], chk: {form: "u27s2f", p: {f: f}}};
  }
  throw new Error("u27s2f：条件に合う数字が見つからない");
}
function tbU27s2_Qt(r){
  var gcd = tbU27s2_gcd, ratio = tbU27s2_ratio, par = tbU27s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [2,4,5,8,10,20,25,40,50,100,125,200,250,500]);
    var T = (1 / f);
    var D = (2 / f);
    var H = (1 / (2 * f));
    if (!(nice(T) && nice(D) && nice(H) && distinct([f, T, D, H]))) continue;
    var _c = choices(r, [{t: "$" + fmt(T) + "\\,\\mathrm{s}$", v: fmt(T)}, {t: "$" + fmt(f) + "\\,\\mathrm{s}$", v: fmt(f), why: "周波数のまま。周期は周波数の逆数"}, {t: "$" + fmt(D) + "\\,\\mathrm{s}$", v: fmt(D), why: "2周期の時間を求めた"}, {t: "$" + fmt(H) + "\\,\\mathrm{s}$", v: fmt(H), why: "半分の区間（0 から上がって 0 まで）の時間を求めた"}]);
    return {form: "u27s2t", text: "周波数 $" + fmt(f) + "\\,\\mathrm{Hz}$ の正弦波交流の周期は何 s か。", fig: {kind: "u27s2wv", L: tbU27s2_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["per1", "{T}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["周期は周波数の逆数", "$T = \\dfrac{1}{" + fmt(f) + "} = " + fmt(T) + "\\,\\mathrm{s}$"], chk: {form: "u27s2t", p: {f: f}}};
  }
  throw new Error("u27s2t：条件に合う数字が見つからない");
}
function tbU27s2_Qtwo(r){
  var gcd = tbU27s2_gcd, ratio = tbU27s2_ratio, par = tbU27s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [2,4,5,8,10,20,25,40,50,100,125,200,250,500]);
    var T2 = (2 / f);
    var H = (f / 2);
    var D = (2 * f);
    var T = (1 / f);
    if (!(nice(T2) && nice(H) && nice(T) && distinct([f, T2, H, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(f) + "\\,\\mathrm{Hz}$", v: fmt(f)}, {t: "$" + fmt(H) + "\\,\\mathrm{Hz}$", v: fmt(H), why: "2周期の時間を1周期とした"}, {t: "$" + fmt(D) + "\\,\\mathrm{Hz}$", v: fmt(D), why: "2周期の時間を 2 で割ったあと、さらに 2 で割った"}, {t: "$" + fmt(T2) + "\\,\\mathrm{Hz}$", v: fmt(T2), why: "時間のまま。周波数は周期の逆数"}]);
    return {form: "u27s2two", text: "図の正弦波交流は、$" + fmt(T2) + "\\,\\mathrm{s}$ の間に同じ形を2回くり返した。周波数は何 Hz か。", fig: {kind: "u27s2wv", L: tbU27s2_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["per", 2], ["per1", fmt(T2) + " s"], ["per1b", 2]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["1周期は $" + fmt(T2) + " \\div 2 = " + fmt(T) + "\\,\\mathrm{s}$", "$f = \\dfrac{1}{" + fmt(T) + "} = " + fmt(f) + "\\,\\mathrm{Hz}$"], chk: {form: "u27s2two", p: {f: f}}};
  }
  throw new Error("u27s2two：条件に合う数字が見つからない");
}
function tbU27s2_Qcount(r){
  var gcd = tbU27s2_gcd, ratio = tbU27s2_ratio, par = tbU27s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [50,60]);
    var D = (2 * f);
    var H = (f / 2);
    var _c = choices(r, [{t: fmt(f) + " 回", v: fmt(f)}, {t: fmt(D) + " 回", v: fmt(D), why: "周波数の値が、そのまま 1 秒間にくり返す回の数"}, {t: fmt(H) + " 回", v: fmt(H), why: "山と谷の組を1回と数える。周波数の値がそのまま回の数"}, {t: "$\\dfrac{1}{" + fmt(f) + "}$ 回", v: "1/" + fmt(f), why: "それは周期（1回にかかる時間）"}]);
    return {form: "u27s2count", text: "周波数 $" + fmt(f) + "\\,\\mathrm{Hz}$ の正弦波交流は、1 秒間に同じ形を何回くり返すか。", fig: {kind: "u27s2wv", L: tbU27s2_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["per1", "{T}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["周波数は、1 秒間に同じ形を何回くり返すかを表す", fmt(f) + " 回"], chk: {form: "u27s2count", p: {f: f}}};
  }
  throw new Error("u27s2count：条件に合う数字が見つからない");
}
function tbU27s2_Qeast(r){
  var gcd = tbU27s2_gcd, ratio = tbU27s2_ratio, par = tbU27s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1]);
    var place = (['東日本', '西日本'][k]);
    var _c = choices(r, [{t: "$" + fmt(k == 0 ? 50 : 60) + "\\,\\mathrm{Hz}$", v: fmt(k == 0 ? 50 : 60)}, {t: "$" + fmt(k == 0 ? 60 : 50) + "\\,\\mathrm{Hz}$", v: fmt(k == 0 ? 60 : 50), why: String(k == 0 ? '60 Hz は西日本' : '50 Hz は東日本')}, {t: "$\\dfrac{1}{" + fmt(k == 0 ? 50 : 60) + "}\\,\\mathrm{Hz}$", v: "1/" + fmt(k == 0 ? 50 : 60), why: "それは周期の値（単位は s）"}, {t: "$0\\,\\mathrm{Hz}$", v: "0", why: "0 Hz は、くり返さない（直流）"}]);
    return {form: "u27s2east", text: String(place) + "のコンセントの交流の周波数はどれか。", fig: {kind: "u27s2wv", L: tbU27s2_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["per1", "{T}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["東日本は 50 Hz、西日本は 60 Hz", "$" + fmt(k == 0 ? 50 : 60) + "\\,\\mathrm{Hz}$"], chk: {form: "u27s2east", p: {k: k}}};
  }
  throw new Error("u27s2east：条件に合う数字が見つからない");
}
// 27-3 瞬時値の式 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u27_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU27s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU27s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU27s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU27s3_par(a, b){ return a * b / (a + b); }
function tbU27s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU27s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU27s3_Qomega(r){
  var gcd = tbU27s3_gcd, ratio = tbU27s3_ratio, par = tbU27s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    var W = (2 * f);
    var H = (f / 2);
    if (!(nice(H))) continue;
    var _c = choices(r, [{t: "$" + fmt(W) + "\\pi\\,\\mathrm{rad/s}$", v: "w" + fmt(W)}, {t: "$" + fmt(f) + "\\pi\\,\\mathrm{rad/s}$", v: "w" + fmt(f), why: "$\\omega = 2\\pi f$ の 2 を掛けていない"}, {t: "$" + fmt(W) + "\\,\\mathrm{rad/s}$", v: "n" + fmt(W), why: "$\\pi$ を掛けていない"}, {t: "$" + fmt(H) + "\\pi\\,\\mathrm{rad/s}$", v: "w" + fmt(H), why: "2 を掛けるところを 2 で割った"}]);
    return {form: "u27s3omega", text: "周波数 $" + fmt(f) + "\\,\\mathrm{Hz}$ の正弦波交流の角速度 $\\omega$ は何 rad/s か。", fig: {kind: "u27s3wv", L: tbU27s3_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}"}, [["per1", "{T}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\omega = 2\\pi f$", "$\\omega = 2\\pi \\times " + fmt(f) + " = " + fmt(W) + "\\pi\\,\\mathrm{rad/s}$"], chk: {form: "u27s3omega", p: {f: f}}};
  }
  throw new Error("u27s3omega：条件に合う数字が見つからない");
}
function tbU27s3_Qf(r){
  var gcd = tbU27s3_gcd, ratio = tbU27s3_ratio, par = tbU27s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    var W = (2 * f);
    var D = (4 * f);
    if (!(distinct([f, W, D, 100]))) continue;
    var _c = choices(r, [{t: "$" + fmt(f) + "\\,\\mathrm{Hz}$", v: fmt(f)}, {t: "$" + fmt(W) + "\\,\\mathrm{Hz}$", v: fmt(W), why: "$\\omega$ の数を、そのまま周波数とした。$\\omega = 2\\pi f$ なので 2π で割る"}, {t: "$" + fmt(D) + "\\,\\mathrm{Hz}$", v: fmt(D), why: "2 で割るところを、2 倍した"}, {t: "$100\\,\\mathrm{Hz}$", v: "100", why: "100 は最大値"}]);
    return {form: "u27s3f", text: "正弦波交流の電圧が $v = 100 \\sin " + fmt(W) + "\\pi t$［V］で表される。周波数は何 Hz か。", fig: {kind: "u27s3wv", L: tbU27s3_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}"}, [["y1", "100 V"], ["per1", "{T}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\omega = " + fmt(W) + "\\pi$ を $\\omega = 2\\pi f$ に入れる", "$f = \\dfrac{" + fmt(W) + "\\pi}{2\\pi} = " + fmt(f) + "\\,\\mathrm{Hz}$"], chk: {form: "u27s3f", p: {f: f}}};
  }
  throw new Error("u27s3f：条件に合う数字が見つからない");
}
function tbU27s3_Qmake(r){
  var gcd = tbU27s3_gcd, ratio = tbU27s3_ratio, par = tbU27s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [10,20,50,100,141,200]);
    var f = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    var W = (2 * f);
    if (!(a != f && a != W)) continue;
    var _c = choices(r, [{t: "$v = " + fmt(a) + " \\sin " + fmt(W) + "\\pi t$", v: "ok"}, {t: "$v = " + fmt(a) + " \\sin " + fmt(f) + "\\pi t$", v: "f", why: "$\\omega = 2\\pi f$ の 2 を掛けていない"}, {t: "$v = " + fmt(f) + " \\sin " + fmt(a * 2) + "\\pi t$", v: "sw", why: "最大値と周波数を取り違えた"}, {t: "$v = " + fmt(a) + " \\sin " + fmt(W) + " t$", v: "nopi", why: "$\\omega = 2\\pi f$ なので、$\\pi$ も掛ける"}]);
    return {form: "u27s3make", text: "最大値 $" + fmt(a) + "\\,\\mathrm{V}$、周波数 $" + fmt(f) + "\\,\\mathrm{Hz}$ の正弦波交流の電圧の瞬時値 $v$［V］を表す式はどれか。", fig: {kind: "u27s3wv", L: tbU27s3_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}"}, [["y1", fmt(a) + " V"], ["per1", "{T}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\omega = 2\\pi \\times " + fmt(f) + " = " + fmt(W) + "\\pi$", "$v = " + fmt(a) + " \\sin " + fmt(W) + "\\pi t$"], chk: {form: "u27s3make", p: {a: a, f: f}}};
  }
  throw new Error("u27s3make：条件に合う数字が見つからない");
}
function tbU27s3_Qt(r){
  var gcd = tbU27s3_gcd, ratio = tbU27s3_ratio, par = tbU27s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    var W = (2 * f);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(f) + "}\\,\\mathrm{s}$", v: "1/" + fmt(f)}, {t: "$\\dfrac{1}{" + fmt(W) + "}\\,\\mathrm{s}$", v: "1/" + fmt(W), why: "$\\omega$ の数の逆数をとった。先に周波数を出す"}, {t: "$" + fmt(f) + "\\,\\mathrm{s}$", v: fmt(f), why: "周波数のまま。周期は周波数の逆数"}, {t: "$\\dfrac{2}{" + fmt(f) + "}\\,\\mathrm{s}$", v: "2/" + fmt(f), why: "2周期の時間"}]);
    return {form: "u27s3t", text: "正弦波交流の電圧が $v = 100 \\sin " + fmt(W) + "\\pi t$［V］で表される。周期は何 s か。", fig: {kind: "u27s3wv", L: tbU27s3_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}"}, [["y1", "100 V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$f = \\dfrac{" + fmt(W) + "\\pi}{2\\pi} = " + fmt(f) + "\\,\\mathrm{Hz}$", "周期は周波数の逆数で $T = \\dfrac{1}{" + fmt(f) + "}\\,\\mathrm{s}$"], chk: {form: "u27s3t", p: {f: f}}};
  }
  throw new Error("u27s3t：条件に合う数字が見つからない");
}
function tbU27s3_Qword(r){
  var gcd = tbU27s3_gcd, ratio = tbU27s3_ratio, par = tbU27s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "1 秒あたりに進む角度（角速度）", v: "own"}, {t: "最大値", v: "max", why: "最大値は $V_m$"}, {t: "周期", v: "T", why: "周期は $T$。$\\omega = 2\\pi f$、$f = \\dfrac{1}{T}$ の関係がある"}, {t: "その時その時の値（瞬時値）", v: "v", why: "瞬時値は $v$"}]);
    return {form: "u27s3word", text: "$v = V_m \\sin \\omega t$ の $\\omega$ は何を表すか。", fig: {kind: "u27s3wv", L: tbU27s3_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\omega$ は角速度（1 秒あたりに進む角度）", "$\\omega = 2\\pi f$"], chk: {form: "u27s3word", p: {}}};
  }
  throw new Error("u27s3word：条件に合う数字が見つからない");
}
// 27-4 時刻を入れる の練習（※ textbook/gen/make_section.py が textbook/gen/data/u27_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU27s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU27s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU27s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU27s4_par(a, b){ return a * b / (a + b); }
function tbU27s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU27s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU27s4_Qt(r){
  var gcd = tbU27s4_gcd, ratio = tbU27s4_ratio, par = tbU27s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [10,20,50,100,200]);
    var K = pick(r, [60,120,180,240,300,360,600]);
    var c = pick(r, [0,1,2,3]);
    var m = ([2 * K, 2 * K / 3, K, 6 * K][c]);
    var ang = (['\\dfrac{\\pi}{2}', '\\dfrac{3}{2}\\pi', '\\pi', '\\dfrac{\\pi}{6}'][c]);
    var V = ([fmt(a), '-' + fmt(a), '0', fmt(a / 2)]);
    var RS = (['それは角度が $\\dfrac{\\pi}{2}$ のとき（山）', 'それは角度が $\\dfrac{3}{2}\\pi$ のとき（谷）', 'それは角度が $\\pi$ のとき（0 を通る）', 'それは角度が $\\dfrac{\\pi}{6}$ のとき']);
    var good = (V[c]);
    var w1_ = (V[(c + 1) % 4]);
    var w2_ = (V[(c + 2) % 4]);
    var w3_ = (V[(c + 3) % 4]);
    var at = ([0.25, 0.75, 0.5, 1 / 12][c]);
    if (!(a != K)) continue;
    var _c = choices(r, [{t: "$" + String(good) + "\\,\\mathrm{V}$", v: String(good)}, {t: "$" + String(w1_) + "\\,\\mathrm{V}$", v: String(w1_), why: String(RS[(c + 1) % 4])}, {t: "$" + String(w2_) + "\\,\\mathrm{V}$", v: String(w2_), why: String(RS[(c + 2) % 4])}, {t: "$" + String(w3_) + "\\,\\mathrm{V}$", v: String(w3_), why: String(RS[(c + 3) % 4])}]);
    return {form: "u27s4t", text: "正弦波交流の電圧が $v = " + fmt(a) + " \\sin " + fmt(K) + "\\pi t$［V］で表される。$t = \\dfrac{1}{" + fmt(m) + "}\\,\\mathrm{s}$ のときの瞬時値は何 V か。", fig: {kind: "u27s4wv", L: tbU27s4_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","y2":"-{V}_m"}, [["y1", fmt(a) + " V"], ["y2", "-" + fmt(a) + " V"], ["pt", "{v}"], ["ptat", fmt(at)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(K) + "\\pi \\times \\dfrac{1}{" + fmt(m) + "} = " + String(ang) + "$", "$v = " + fmt(a) + " \\sin " + String(ang) + " = " + String(good) + "\\,\\mathrm{V}$"], chk: {form: "u27s4t", p: {a: a, c: c}}};
  }
  throw new Error("u27s4t：条件に合う数字が見つからない");
}
function tbU27s4_Qdeg(r){
  var gcd = tbU27s4_gcd, ratio = tbU27s4_ratio, par = tbU27s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [0,1,2,3,4,5]);
    var R = (['\\dfrac{\\pi}{6}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{2}', '\\pi', '\\dfrac{3}{2}\\pi', '2\\pi'][c]);
    var D = ([30, 60, 90, 180, 270, 360]);
    var good = (D[c]);
    var w1_ = (D[(c + 1) % 6]);
    var w2_ = (D[(c + 3) % 6]);
    var w3_ = (D[(c + 5) % 6]);
    var _c = choices(r, [{t: "$" + fmt(good) + "^\\circ$", v: fmt(good)}, {t: "$" + fmt(w1_) + "^\\circ$", v: fmt(w1_), why: "1周期の $2\\pi$ が 360° になるように割合で直す"}, {t: "$" + fmt(w2_) + "^\\circ$", v: fmt(w2_), why: "$\\pi$ が 180° になるように直す"}, {t: "$" + fmt(w3_) + "^\\circ$", v: fmt(w3_), why: "$\\dfrac{\\pi}{2}$ が 90° になるように直す"}]);
    return {form: "u27s4deg", text: "角度 $" + String(R) + "$ は何度か。", fig: {kind: "u27s4wv", L: tbU27s4_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","y2":"-{V}_m"}, [["ax", "{ω}{t}［rad］"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$2\\pi$ が 360°、$\\pi$ が 180°", "$" + String(R) + " = " + fmt(good) + "^\\circ$"], chk: {form: "u27s4deg", p: {c: c}}};
  }
  throw new Error("u27s4deg：条件に合う数字が見つからない");
}
function tbU27s4_Qaxis(r){
  var gcd = tbU27s4_gcd, ratio = tbU27s4_ratio, par = tbU27s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$2\\pi$", v: "own"}, {t: "$\\pi$", v: "pi", why: "$\\pi$ は1周期の半分"}, {t: "$\\dfrac{\\pi}{2}$", v: "half", why: "$\\dfrac{\\pi}{2}$ は1周期の4分の1"}, {t: "周波数によって変わる", v: "f", why: "角度でとると、周波数によらず1周期は $2\\pi$"}]);
    return {form: "u27s4axis", text: "正弦波交流の横の軸を角度 $\\omega t$ でとると、1周期の長さはいくらか。", fig: {kind: "u27s4wv", L: tbU27s4_fig({"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","y2":"-{V}_m"}, [["ax", "{ω}{t}［rad］"], ["x4", "?"], ["x4at", 1]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["角度でとると、1周期は必ず $2\\pi$（360°）", "$2\\pi$"], chk: {form: "u27s4axis", p: {}}};
  }
  throw new Error("u27s4axis：条件に合う数字が見つからない");
}
// 27-5 位相 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u27_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU27s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU27s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU27s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU27s5_par(a, b){ return a * b / (a + b); }
function tbU27s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU27s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU27s5_Qsign(r){
  var gcd = tbU27s5_gcd, ratio = tbU27s5_ratio, par = tbU27s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,6]);
    var d = pick(r, [0,1]);
    var P = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][k]);
    var sg = (d == 0 ? '-' : '+');
    var og = (d == 0 ? '+' : '-');
    var dir = (d == 0 ? '右' : '左');
    var sh = (d == 0 ? -180 / k : 180 / k);
    var xat = (d == 0 ? 1 / (2 * k) : -1 / (2 * k));
    var _c = choices(r, [{t: "$v_2 = V_m \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$", v: "ok"}, {t: "$v_2 = V_m \\sin\\left(\\omega t " + String(og) + " " + String(P) + "\\right)$", v: "op", why: String(d == 0 ? '右へずらすと遅れ。スタートの点の ωt は正なので −' : '左へずらすと進み。スタートの点の ωt は負なので ＋')}, {t: "$v_2 = V_m \\sin \\omega t$", v: "no", why: "ずれを式に入れていない（それは $v_1$）"}, {t: "$v_2 = V_m \\sin\\left(\\omega t " + String(sg) + " " + fmt(k) + "\\pi\\right)$", v: "kpi", why: "ずれは $" + String(P) + "$"}]);
    return {form: "u27s5sign", text: "$v_1 = V_m \\sin \\omega t$ の波を、図のように" + String(dir) + "へ $" + String(P) + "$ ずらした波 $v_2$ を表す式はどれか。", fig: {kind: "u27s5wv", L: tbU27s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2"}, [["w2p", fmt(sh)], ["x1", String(d == 0 ? '' : '-') + String(P)], ["x1at", fmt(xat)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["スタートの点は $\\omega t = " + String(d == 0 ? '' : '-') + String(P) + "$。入れてカッコの中が 0 になる符号にする", "$v_2 = V_m \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$"], chk: {form: "u27s5sign", p: {k: k, d: d}}};
  }
  throw new Error("u27s5sign：条件に合う数字が見つからない");
}
function tbU27s5_Qdiff(r){
  var gcd = tbU27s5_gcd, ratio = tbU27s5_ratio, par = tbU27s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,6]);
    var b = pick(r, [2,3,4,6]);
    var s = pick(r, [0,1]);
    var PA = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][a]);
    var PB = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][b]);
    var g1 = (s == 0 ? '+' : '-');
    var g2 = (s == 0 ? '-' : '+');
    var D = (180 / a + 180 / b);
    var E = (abs(180 / a - 180 / b));
    var ok_w = (s == 0 ? '進んで' : '遅れて');
    var ng_w = (s == 0 ? '遅れて' : '進んで');
    if (!(a != b)) continue;
    var _c = choices(r, [{t: "$v_1$ は $v_2$ より " + fmt(D) + "° " + String(ok_w) + "いる", v: "ok"}, {t: "$v_1$ は $v_2$ より " + fmt(D) + "° " + String(ng_w) + "いる", v: "op", why: "位相が大きい（＋の側の）方が進んでいる"}, {t: "$v_1$ は $v_2$ より " + fmt(E) + "° " + String(ok_w) + "いる", v: "sub", why: "＋と－の位相の差は、2つの大きさを足した値"}, {t: "$v_1$ と $v_2$ は位相差が無い", v: "zero", why: "ずれの向きが逆なので、位相差がある"}]);
    return {form: "u27s5diff", text: "$v_1 = V_m \\sin\\left(\\omega t " + String(g1) + " " + String(PA) + "\\right)$、$v_2 = V_m \\sin\\left(\\omega t " + String(g2) + " " + String(PB) + "\\right)$ である。正しいのはどれか。", fig: {kind: "u27s5wv", L: tbU27s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2"}, [["w1p", fmt(s == 0 ? 180 / a : -180 / a)], ["w2p", fmt(s == 0 ? -180 / b : 180 / b)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["位相は $v_1$ が $" + String(g1) + String(PA) + "$、$v_2$ が $" + String(g2) + String(PB) + "$", "位相差は $" + fmt(180 / a) + "^\\circ + " + fmt(180 / b) + "^\\circ = " + fmt(D) + "^\\circ$。$v_1$ は " + String(ok_w) + "いる"], chk: {form: "u27s5diff", p: {a: a, b: b, s: s}}};
  }
  throw new Error("u27s5diff：条件に合う数字が見つからない");
}
function tbU27s5_Qphase(r){
  var gcd = tbU27s5_gcd, ratio = tbU27s5_ratio, par = tbU27s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,6]);
    var d = pick(r, [0,1]);
    var P = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][k]);
    var sg = (d == 0 ? '-' : '+');
    var og = (d == 0 ? '' : '-');
    var sg2 = (d == 0 ? '-' : '');
    var _c = choices(r, [{t: "$" + String(sg2) + String(P) + "$", v: "ok"}, {t: "$" + String(og) + String(P) + "$", v: "op", why: "符号も含めて、$\\omega t$ の後ろの値が位相"}, {t: "$\\omega t " + String(sg) + " " + String(P) + "$", v: "wt", why: "位相は $\\omega t$ の後ろの値"}, {t: "$V_m$", v: "vm", why: "$V_m$ は最大値"}]);
    return {form: "u27s5phase", text: "$v = V_m \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$ の位相はいくらか。", fig: {kind: "u27s5wv", L: tbU27s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2"}, [["w1p", fmt(d == 0 ? -180 / k : 180 / k)], ["w2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["位相は $\\omega t$ の後ろの値", "$" + String(sg2) + String(P) + "$"], chk: {form: "u27s5phase", p: {k: k, d: d}}};
  }
  throw new Error("u27s5phase：条件に合う数字が見つからない");
}
function tbU27s5_Qword(r){
  var gcd = tbU27s5_gcd, ratio = tbU27s5_ratio, par = tbU27s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var d = pick(r, [0,1]);
    var _c = choices(r, [{t: String(d == 0 ? '遅れている' : '進んでいる'), v: "ok"}, {t: String(d == 0 ? '進んでいる' : '遅れている'), v: "op", why: String(d == 0 ? '右にずれた波はスタートが遅い' : '左にずれた波はスタートが早い')}, {t: "位相差が無い", v: "zero", why: "左右にずれているので、位相差がある"}, {t: "最大値が大きい", v: "big", why: "左右にずらしても、最大値は変わらない"}]);
    return {form: "u27s5word", text: "図の $v_2$ は $v_1$ を" + String(d == 0 ? '右' : '左') + "へずらした波である。$v_2$ は $v_1$ に比べてどうなっているか。", fig: {kind: "u27s5wv", L: tbU27s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2"}, [["w2p", fmt(d == 0 ? -60 : 60)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(d == 0 ? '右にずれた波はスタートが遅い' : '左にずれた波はスタートが早い'), String(d == 0 ? '遅れている' : '進んでいる')], chk: {form: "u27s5word", p: {d: d}}};
  }
  throw new Error("u27s5word：条件に合う数字が見つからない");
}
// 27-6 抵抗の電流とベクトル図 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u27_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU27s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU27s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU27s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU27s6_par(a, b){ return a * b / (a + b); }
function tbU27s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU27s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU27s6_Qim(r){
  var gcd = tbU27s6_gcd, ratio = tbU27s6_ratio, par = tbU27s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,30,40,50,60,80,100,120,141,200]);
    var R = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(V > R && nice(V / R) && nice(R / V))) continue;
    var ok = (V / R);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU27s6_three(ok, [{x: (V * R), why: "割るところを掛けた"}, {x: (R / V), why: "割る順が逆"}, {x: (V), why: "抵抗で割っていない（電圧の最大値のまま）"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u27s6im", text: "図のように、$v = " + fmt(V) + " \\sin \\omega t$［V］の電圧を $" + fmt(R) + "\\,\\Omega$ の抵抗に加えた。流れる電流の最大値は何 A か。", fig: {kind: "u27s6cw", L: tbU27s6_fig({}, [["src", "{v}=" + fmt(V) + "\\sin{ω}{t}"], ["r", qf(R, "O")], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗では、電流は電圧に比例する", "$I_m = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "} = " + qv(ok, "A") + "$"], chk: {form: "u27s6im", p: {V: V, R: R}}};
  }
  throw new Error("u27s6im：条件に合う数字が見つからない");
}
function tbU27s6_Qisin(r){
  var gcd = tbU27s6_gcd, ratio = tbU27s6_ratio, par = tbU27s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [2,3,4,5,6,10]);
    var R = pick(r, [2,4,5,10,20,25]);
    var k = pick(r, [2,3,4,6]);
    var d = pick(r, [0,1]);
    var a = (m * R);
    var P = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][k]);
    var sg = (d == 0 ? '-' : '+');
    var og = (d == 0 ? '+' : '-');
    var aR = (m * R * R);
    if (!(m != aR)) continue;
    var _c = choices(r, [{t: "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$", v: "ok"}, {t: "$i = " + fmt(m) + "\\sqrt{2} \\sin \\omega t$", v: "zero", why: "抵抗では電流は電圧と同相。電圧の位相がそのまま残る"}, {t: "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t " + String(og) + " " + String(P) + "\\right)$", v: "op", why: "抵抗では電流は電圧と同相。符号は変わらない"}, {t: "$i = " + fmt(aR) + "\\sqrt{2} \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$", v: "mul", why: "割るところを掛けた"}]);
    return {form: "u27s6isin", text: "図のように、$v = " + fmt(a) + "\\sqrt{2} \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$［V］の電圧を $" + fmt(R) + "\\,\\Omega$ の抵抗に加えた。電流 $i$［A］を表す式はどれか。", fig: {kind: "u27s6cw", L: tbU27s6_fig({}, [["src", "{v}"], ["r", qf(R, "O")], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5], ["w1p", fmt(d == 0 ? -180 / k : 180 / k)], ["w2p", fmt(d == 0 ? -180 / k : 180 / k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["最大値は $\\dfrac{" + fmt(a) + "\\sqrt{2}}{" + fmt(R) + "} = " + fmt(m) + "\\sqrt{2}$。抵抗では電圧と同相", "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$"], chk: {form: "u27s6isin", p: {m: m, R: R, k: k, d: d}}};
  }
  throw new Error("u27s6isin：条件に合う数字が見つからない");
}
function tbU27s6_Qvec(r){
  var gcd = tbU27s6_gcd, ratio = tbU27s6_ratio, par = tbU27s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [3,4,6]);
    var d = pick(r, [0,1]);
    var P = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][k]);
    var sg = (d == 0 ? '-' : '+');
    var dg = (180 / k);
    var okw = (d == 0 ? '時計回り' : '反時計回り');
    var ngw = (d == 0 ? '反時計回り' : '時計回り');
    var _c = choices(r, [{t: "右向きから" + String(okw) + "に " + fmt(dg) + "°", v: "ok"}, {t: "右向きから" + String(ngw) + "に " + fmt(dg) + "°", v: "op", why: String(d == 0 ? '遅れは時計回り' : '進みは反時計回り')}, {t: "右向き", v: "r", why: "右向きは位相 0 の向き"}, {t: "右向きから" + String(okw) + "に " + fmt(2 * dg) + "°", v: "dbl", why: "$" + String(P) + "$ は " + fmt(dg) + "°"}]);
    return {form: "u27s6vec", text: "$v = V_m \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$ をベクトル図にかく。矢印の向きはどれか。", fig: {kind: "u27s6pv", L: tbU27s6_fig({}, [["ref", true], ["a1", "{v}"], ["a1l", 1], ["a1g", 0], ["rot", true], ["adv", "進み"], ["lag", "遅れ"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["位相は $" + String(sg) + String(P) + "$（" + String(d == 0 ? '遅れ' : '進み') + "）。" + String(d == 0 ? '遅れは時計回り' : '進みは反時計回り'), "右向きから" + String(okw) + "に " + fmt(dg) + "°"], chk: {form: "u27s6vec", p: {k: k, d: d}}};
  }
  throw new Error("u27s6vec：条件に合う数字が見つからない");
}
function tbU27s6_Qsame(r){
  var gcd = tbU27s6_gcd, ratio = tbU27s6_ratio, par = tbU27s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "位相差は 0（同相）", v: "own"}, {t: "電流が $\\dfrac{\\pi}{2}$ 進む", v: "lead", why: "抵抗の値は変わらないので、電流は電圧に比例し同じ形"}, {t: "電流が $\\dfrac{\\pi}{2}$ 遅れる", v: "lag", why: "抵抗の値は変わらないので、電流は電圧に比例し同じ形"}, {t: "電流は流れない", v: "none", why: "抵抗には、電圧に比例した電流が流れる"}]);
    return {form: "u27s6same", text: "抵抗に正弦波交流の電圧を加えたとき、電圧と電流の位相差はどうなるか。", fig: {kind: "u27s6cw", L: tbU27s6_fig({}, [["src", "{v}"], ["r", "{R}"], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流は電圧に比例し、同じ形でずれない", "位相差は 0（同相）"], chk: {form: "u27s6same", p: {}}};
  }
  throw new Error("u27s6same：条件に合う数字が見つからない");
}
function tbU27s6_Qlen(r){
  var gcd = tbU27s6_gcd, ratio = tbU27s6_ratio, par = tbU27s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "長さ＝最大値、向き＝位相", v: "own"}, {t: "長さ＝位相、向き＝最大値", v: "sw", why: "取り違えた"}, {t: "長さ＝周期、向き＝位相", v: "T", why: "長さは最大値"}, {t: "長さ＝最大値、向き＝周波数", v: "f", why: "向きは位相（右向きが 0）"}]);
    return {form: "u27s6len", text: "ベクトル図で、矢印の長さと向きは、それぞれ何を表すか。", fig: {kind: "u27s6pv", L: tbU27s6_fig({}, [["ref", true], ["a1", "{v}"], ["a1l", 1], ["a1g", 30], ["rot", true], ["adv", "進み"], ["lag", "遅れ"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印の長さで最大値、向きで位相を表す", "長さ＝最大値、向き＝位相"], chk: {form: "u27s6len", p: {}}};
  }
  throw new Error("u27s6len：条件に合う数字が見つからない");
}
var GEN = {
  // 27-1 交流と正弦波
  1: function(r){ return pick(r, [tbU27s1_Qvm, tbU27s1_Qvm, tbU27s1_Qpos, tbU27s1_Qpos, tbU27s1_Qpos, tbU27s1_Qword, tbU27s1_Qword, tbU27s1_Qdef])(r); },
  // 27-2 周期と周波数
  2: function(r){ return pick(r, [tbU27s2_Qf, tbU27s2_Qf, tbU27s2_Qf, tbU27s2_Qt, tbU27s2_Qt, tbU27s2_Qt, tbU27s2_Qtwo, tbU27s2_Qtwo, tbU27s2_Qcount, tbU27s2_Qeast])(r); },
  // 27-3 瞬時値の式
  3: function(r){ return pick(r, [tbU27s3_Qomega, tbU27s3_Qomega, tbU27s3_Qomega, tbU27s3_Qf, tbU27s3_Qf, tbU27s3_Qf, tbU27s3_Qmake, tbU27s3_Qmake, tbU27s3_Qmake, tbU27s3_Qt, tbU27s3_Qt, tbU27s3_Qword])(r); },
  // 27-4 時刻を入れる
  4: function(r){ return pick(r, [tbU27s4_Qt, tbU27s4_Qt, tbU27s4_Qt, tbU27s4_Qt, tbU27s4_Qt, tbU27s4_Qdeg, tbU27s4_Qdeg, tbU27s4_Qaxis])(r); },
  // 27-5 位相
  5: function(r){ return pick(r, [tbU27s5_Qsign, tbU27s5_Qsign, tbU27s5_Qsign, tbU27s5_Qsign, tbU27s5_Qdiff, tbU27s5_Qdiff, tbU27s5_Qdiff, tbU27s5_Qphase, tbU27s5_Qphase, tbU27s5_Qword])(r); },
  // 27-6 抵抗の電流とベクトル図
  6: function(r){ return pick(r, [tbU27s6_Qim, tbU27s6_Qim, tbU27s6_Qim, tbU27s6_Qisin, tbU27s6_Qisin, tbU27s6_Qisin, tbU27s6_Qvec, tbU27s6_Qvec, tbU27s6_Qvec, tbU27s6_Qsame, tbU27s6_Qlen])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t27s1e","scene":"t27s1e","kind":"u27s1wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","y2":"-{V}_m","pt":"{v}"},"viewbox":"16 68 1118 694","band":{"want":"交流とは何か","ans":"大きさや向きが周期的に変化する。正弦波交流は最大値 $V_m$ と瞬時値 $v$ で見る","full":"交流は、大きさや向きが周期的に変化する電流。0 → 正の最大 → 0 → 負の最大 → 0 をくり返す形を正弦波交流という。一番大きくなる値が最大値 V_m、その時その時の値が瞬時値 v。"},"narr":{"start":{"co":1,"w1d":0,"ptd":0,"ptat":0.1},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"①交流\n②正弦波交流\n③最大値と瞬時値\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"直流は、落ち着くと電流の値が一定でした。過渡現象では変化しましたが、くり返す変化ではありません。","at":{"道筋":1.0},"after":[],"route":1},{"text":"交流は、〖大きさや向きが周期的に変化する〗電流です。ずっと変化し続けます。","at":{"強調":1.0},"after":[],"emph":["W1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"交流電源の電圧を、横の軸に時間をとってかきます。時間で変わる値は、小文字の $v$ で書きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"w1","emph":["W1","Ax"]},{"text":"0 から正の向きに大きくなり、0 にもどります。次は負の向きに大きくなり、また 0 にもどります。","at":{"強調":1.0},"after":[],"emph":["W1"]},{"text":"これをくり返す交流を、〖正弦波交流〗といいます。","at":{"強調":1.0},"after":[],"emph":["W1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"一番大きくなる値を、〖最大値〗といいます。$V_m$ と書きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Y1","Y2"]},{"text":"時間とともに変わる、その時その時の値を〖瞬時値〗といいます。小文字の $v$ で書きます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"pt","emph":["Pt"]},{"text":"時間が進むと、瞬時値は変わります。負の値になることもあります。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"go","emph":["Pt","W1"],"ans":true}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"w1":{"to":{"w1d":1},"dur":1.2},"pt":{"to":{"ptd":1},"dur":0.5},"go":{"to":{"ptat":0.6},"dur":1.2}},"route":["交流","正弦波交流","最大値と瞬時値"]}},{"id":"t27s1x","scene":"t27s1x","kind":"u27s1wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"50 V","y2":"-50 V","pt":["{v}","{v}=-50 V"]},"viewbox":"16 68 1118 694","band":{"want":"瞬時値が負の向きに一番大きいときの値","known":"山の高さ $50\\,\\mathrm{V}$","ans":"$-50\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"ptd":1,"ptat":0.75,"ptv":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"求めるのは、瞬時値が負の向きに一番大きくなったときの値です。","at":{"強調":1.0},"after":[],"emph":["Pt"]},{"text":"①山と谷を読む\n②向きを付ける\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"正の山の高さが 50 V なので、最大値は 50 V です。谷の深さも同じです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Y1","Y2"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"谷では、電圧の向きが逆です。瞬時値は〖負の値〗で書きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"pt","emph":["Pt","Y2"],"eq":[{"cont":false,"items":[["v = -50\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["Pt","Y2"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"pt":{"to":{"ptv":1},"dur":0.5}},"route":["山と谷を読む","向きを付ける"]}},{"id":"t27s2e","scene":"t27s2e","kind":"u27s2wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}","per":2},"viewbox":"16 68 1118 694","band":{"want":"周期と周波数","ans":"$f = \\dfrac{1}{T}$","full":"0 から上がって 0、下がって 0 にもどるまでの1区間が周期 T［s］。周波数 f［Hz］は周期の逆数で、周波数は 1 秒間に同じ形を何回くり返すかを表す。東日本は 50 Hz、西日本は 60 Hz。"},"narr":{"start":{"co":1,"per1d":0,"mark":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"①周期\n②周波数\n③50 Hz と 60 Hz\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"正弦波交流は、同じ形をくり返します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W1"]},{"text":"0 から上がって 0、下がって 0 にもどるまでの1区間を、〖周期〗といいます。$T$ と書き、単位は秒 s です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"t","emph":["Per1","W1a"]},{"text":"山から次の山まで、のように、どこから数えても同じ長さです。","at":{"強調":1.0},"after":[],"emph":["Per1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"周波数は、〖周期の逆数〗です。$f$ と書き、単位はヘルツ Hz です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Per1"],"eq":[{"cont":false,"items":[["f = \\dfrac{1}{T}"]]}],"emphPre":["Per1"]},{"text":"周波数は、〖1 秒間に同じ形を何回くり返すか〗を表します。","at":{"強調":1.0},"after":[],"emph":["W1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"コンセントの交流は、〖東日本では 50 Hz、西日本では 60 Hz〗です。","at":{"道筋":1.0},"after":[],"route":3},{"text":"60 Hz なら、周期はその逆数です。1 秒間に 60 回くり返します。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え"],"emph":["Per1"],"eq":[{"cont":false,"items":[["T = \\dfrac{1}{60}\\,\\mathrm{s}"]]}],"ans":true}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"t":{"to":{"per1d":1,"mark":1},"dur":0.8}},"route":["周期","周波数","50 Hz と 60 Hz"]}},{"id":"t27s2x","scene":"t27s2x","kind":"u27s2wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"0.02 s"},"viewbox":"16 68 1118 694","band":{"want":"周波数 $f$","known":"$T = 0.02\\,\\mathrm{s}$","ans":"$f = 50\\,\\mathrm{Hz}$"},"narr":{"start":{"co":1,"per1d":1,"mark":1},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"求めるのは、周波数 $f$ です。","at":{},"after":[]},{"text":"①周期を読む\n②逆数をとる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"0 から上がって 0、下がって 0 にもどるまでが 0.02 s です。これが〖周期〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Per1","W1a"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"周波数は、〖周期の逆数〗です。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":2,"eq":[{"cont":false,"items":[["f = \\dfrac{1}{T}"]]}],"emph":["Per1"]},{"text":"","at":{"式":0.0,"答え":0.0,"強調":0.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["f = \\dfrac{1}{0.02} = 50\\,\\mathrm{Hz}"]]}],"ans":true,"emph":["Per1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{},"route":["周期を読む","逆数をとる"]}},{"id":"t27s3e","scene":"t27s3e","kind":"u27s3wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"{T}"},"viewbox":"16 68 1118 694","band":{"want":"瞬時値を時間の式で書く","ans":"$v = V_m \\sin \\omega t$、$\\omega = 2\\pi f$","full":"瞬時値は v = V_m sin ωt。ω は角速度［rad/s］で 1 秒あたりに進む角度。ω = 2πf なので v = V_m sin 2πft。"},"narr":{"start":{"co":1,"per1d":1},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"①瞬時値の式\n②角速度\n③周波数を入れる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"瞬時値 $v$ は、〖時間 $t$ の式〗で書けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W1","Y1"],"eq":[{"cont":false,"items":[["v = V_m \\sin \\omega t"]]}],"emphPre":["W1"]},{"text":"$V_m$ は最大値です。","at":{"強調":1.0},"after":[],"emph":["Y1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$\\omega$ はオメガと読み、角速度といいます。〖1 秒あたりに進む角度〗です。単位は rad/s です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["W1"]},{"text":"角速度と周波数には、〖とても大切な関係〗があります。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\omega = 2\\pi f"]]}],"emph":["Per1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$\\omega$ に $2\\pi f$ を入れると、〖周波数で書いた式〗になります。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":3,"eq":[{"cont":false,"items":[["v = V_m \\sin 2\\pi f t"]]}],"emph":["W1","Per1","Y1"]},{"text":"例えば 60 Hz なら、$2\\pi \\times 60 = 120\\pi$ です。","at":{"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["v = V_m \\sin 120\\pi t"]]}],"ans":true,"emph":["W1","Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{},"route":["瞬時値の式","角速度","周波数を入れる"]}},{"id":"t27s3x","scene":"t27s3x","kind":"u27s3wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":["{V}_m","100 V"],"per1":["{T}","0.02 s"]},"viewbox":"16 68 1118 694","band":{"want":"瞬時値の式","known":"$V_m = 100\\,\\mathrm{V},\\;\\; f = 50\\,\\mathrm{Hz}$","ans":"$v = 100 \\sin 100\\pi t$"},"narr":{"start":{"co":1,"per1d":1,"y1v":0,"per1v":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"求めるのは、瞬時値 $v$ の式です。","at":{"強調":1.0},"after":[],"emph":["W1"]},{"text":"①最大値を入れる\n②ω を出す\n③式を書く\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"最大値は 100 V です。〖$V_m$ のところ〗に入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"y","emph":["Y1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"周波数は 50 Hz です。周期は〖$\\dfrac{1}{50} = 0.02\\,\\mathrm{s}$〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"t","emph":["Per1"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\omega = 2\\pi f","= 2\\pi \\times 50 = 100\\pi"]]}],"emph":["Per1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"2つを式に入れます。","at":{"道筋":1.0,"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"route":3,"eq":[{"cont":false,"items":[["v = 100 \\sin 100\\pi t"]]}],"ans":true,"emph":["W1","Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"y":{"to":{"y1v":1},"dur":0.4},"t":{"to":{"per1v":1},"dur":0.4}},"route":["最大値を入れる","ω を出す","式を書く"]}},{"id":"t27s4e","scene":"t27s4e","kind":"u27s4wv","lab":{"ax":["{t}［s］","{ω}{t}［rad］"],"ay":"{v}［V］","w1":"{v}","y1":"{V}_m","y2":"-{V}_m","x1":["\\dfrac{1}{200}","\\dfrac{π}{2}"],"x2":["\\dfrac{1}{100}","π"],"x3":["\\dfrac{3}{200}","\\dfrac{3}{2}π"],"x4":["\\dfrac{1}{50}","2π"],"pt":"{v}","x1at":0.25,"x2at":0.5,"x3at":0.75,"x4at":1,"ptat":0.25,"ptat2":0.75},"viewbox":"16 68 1118 694","band":{"want":"時刻を入れて瞬時値を出す","ans":"$\\omega t$ の角度で sin の値を決める。1周期は $2\\pi$","full":"v = V_m sin ωt の t に時刻を入れると、その時刻の瞬時値が決まる。横の軸を角度 ωt でとると、1周期は必ず 2π、半分が π、その半分が π/2。"},"narr":{"start":{"co":1,"axv":0,"xv":0,"ptd":0,"ptm":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"①時刻を入れる\n②ほかの時刻\n③横の軸を角度で\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$v = V_m \\sin 100\\pi t$ の波を考えます。周波数は 50 Hz です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W1","Y1"]},{"text":"$t = \\dfrac{1}{200}\\,\\mathrm{s}$ を入れます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"pt","emph":["Pt","X1"],"eq":[{"cont":false,"items":[["100\\pi \\times \\dfrac{1}{200} = \\dfrac{\\pi}{2}"]]}],"emphPre":["Pt","X1"]},{"text":"$\\dfrac{\\pi}{2}$ は 90° で、$\\sin$ の値は 1 です。瞬時値は〖最大値〗になります。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["v = V_m \\sin \\dfrac{\\pi}{2} = V_m"]]}],"emph":["Pt","Y1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$t = \\dfrac{1}{100}\\,\\mathrm{s}$ なら $\\pi$ です。180° で、$\\sin$ の値は 0 なので、瞬時値は 0 です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["X2"]},{"text":"$t = \\dfrac{3}{200}\\,\\mathrm{s}$ なら $\\dfrac{3}{2}\\pi$ です。270° で、$\\sin$ の値は -1 です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"go","emph":["Pt","Y2","Y1"],"eq":[{"cont":false,"items":[["v = V_m \\sin \\dfrac{3}{2}\\pi = -V_m"]]}],"emphPre":["Pt","X3","Y2","Y1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"横の軸は、時間 $t$ のかわりに〖角度 $\\omega t$〗でとることもあります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"ax","emph":["Ax","X1","X2","X3","X4"]},{"text":"角度でとると、〖1周期は必ず $2\\pi$〗です。半分が $\\pi$、その半分が $\\dfrac{\\pi}{2}$ です。周波数によらず、同じ形でかけます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["X4","X2","X1"],"ans":true}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"pt":{"to":{"ptd":1},"dur":0.5},"go":{"to":{"ptm":1},"dur":1.0},"ax":{"to":{"axv":1,"xv":1},"dur":0.8}},"route":["時刻を入れる","ほかの時刻","横の軸を角度で"]}},{"id":"t27s4x","scene":"t27s4x","kind":"u27s4wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"100 V","y2":"-100 V","pt":["{v}","{v}=100 V"],"x1":"\\dfrac{1}{200}","x1at":0.25,"ptat":0.25},"viewbox":"16 68 1118 694","band":{"want":"$t = \\dfrac{1}{200}\\,\\mathrm{s}$ の瞬時値","known":"$v = 100 \\sin 100\\pi t$","ans":"$v = 100\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"ptd":1,"ptv":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"求めるのは、$t = \\dfrac{1}{200}\\,\\mathrm{s}$ の瞬時値です。","at":{"強調":1.0},"after":[],"emph":["Pt","X1"]},{"text":"①角度を出す\n②sin の値\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"〖$\\omega t$ に時刻を入れ〗ます。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":1,"eq":[{"cont":false,"items":[["100\\pi \\times \\dfrac{1}{200} = \\dfrac{\\pi}{2}"]]}],"emph":["X1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$\\dfrac{\\pi}{2}$ は 90° で、$\\sin$ の値は 1 です。〖山のところ〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pt","Y1"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["v = 100 \\sin \\dfrac{\\pi}{2} = 100\\,\\mathrm{V}"]]}],"move":"pt","ans":true,"emph":["Pt","Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"pt":{"to":{"ptv":1},"dur":0.5}},"route":["角度を出す","sin の値"]}},{"id":"t27s5e","scene":"t27s5e","kind":"u27s5wv","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2","w3":"{v}_3","w2p":-60,"w3p":60,"x1":"\\dfrac{π}{3}","x1at":0.16666666666666666,"x2":"-\\dfrac{π}{3}","x2at":-0.16666666666666666,"s2":true,"s3":true},"viewbox":"16 68 1118 694","band":{"want":"ずらした波の式と、進み・遅れ","ans":"右にずらすと $-$（遅れ）、左にずらすと $+$（進み）","full":"右に π/3 ずらすと V_m sin(ωt − π/3)、左にずらすと V_m sin(ωt + π/3)。符号は、スタートの点の ωt を入れてカッコの中が 0 になるように決める。右は遅れ、左は進み。位相は ωt の後ろの値、位相差は2つの波のずれ。"},"narr":{"start":{"co":1,"w2d":0,"w3d":0,"w2m":0,"w3m":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"①右にずらす\n②左にずらす\n③位相と位相差\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"もとの波を $v_1 = V_m \\sin \\omega t$ とします。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W1","Y1"]},{"text":"これを右へ $\\dfrac{\\pi}{3}$ ずらした波 $v_2$ を考えます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"r","emph":["W2","Y1"],"eq":[{"cont":false,"items":[["v_2 = V_m \\sin\\left(\\omega t - \\dfrac{\\pi}{3}\\right)"]]}],"emphPre":["W2"]},{"text":"符号は、〖波のスタートの点〗で決めます。上がりながら 0 を通る点です。$v_2$ では $\\omega t = \\dfrac{\\pi}{3}$ です。","at":{"強調":1.0},"after":[],"emph":["S2","X1","Y1"]},{"text":"ここを入れて、カッコの中が 0 になる符号が $-$ です。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\dfrac{\\pi}{3} - \\dfrac{\\pi}{3} = 0"]]}],"emph":["S2","X1"]},{"text":"$v_2$ は $v_1$ よりスタートが遅いので、〖$\\dfrac{\\pi}{3}$ 遅れている〗といいます。右なので進んでいる、と考えないように気をつけます。","at":{"強調":1.0},"after":[],"emph":["W2","W1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"左へ $\\dfrac{\\pi}{3}$ ずらした波 $v_3$ は、スタートの点が $-\\dfrac{\\pi}{3}$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"l","emph":["W3","Y1"],"eq":[{"cont":false,"items":[["v_3 = V_m \\sin\\left(\\omega t + \\dfrac{\\pi}{3}\\right)"]]}],"emphPre":["W3","S3","X2"]},{"text":"$v_3$ はスタートが早いので、$v_1$ より〖$\\dfrac{\\pi}{3}$ 進んでいる〗といいます。","at":{"強調":1.0},"after":[],"emph":["W3","W1","Y1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$\\omega t$ の後ろの値を〖位相〗といいます。$v_1$ は 0、$v_2$ は $-\\dfrac{\\pi}{3}$、$v_3$ は $\\dfrac{\\pi}{3}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["W1","W2","W3"]},{"text":"2つの波のずれを〖位相差〗といいます。負の数にせず、位相差 $\\dfrac{\\pi}{3}$ のように言います。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["W1","W2"],"ans":true}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"r":{"to":{"w2d":1,"w2m":1},"dur":1.0},"l":{"to":{"w3d":1,"w3m":1},"dur":1.0}},"route":["右にずらす","左にずらす","位相と位相差"]}},{"id":"t27s5x","scene":"t27s5x","kind":"u27s5wv","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2","w2p":45,"x2":"-\\dfrac{π}{4}","x2at":-0.125,"s2":true},"viewbox":"16 68 1118 694","band":{"want":"$v_2$ の式","known":"$v_1 = V_m \\sin \\omega t$ を左へ $\\dfrac{\\pi}{4}$","ans":"$v_2 = V_m \\sin\\left(\\omega t + \\dfrac{\\pi}{4}\\right)$"},"narr":{"start":{"co":1,"w2d":1,"w2m":1},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"求めるのは、$v_1$ を左へ $\\dfrac{\\pi}{4}$ ずらした $v_2$ の式です。","at":{"強調":1.0},"after":[],"emph":["W2"]},{"text":"①スタートの点\n②符号を決める\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"$v_2$ のスタートの点は、$\\omega t = -\\dfrac{\\pi}{4}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["S2","X2"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"ここを入れてカッコの中が 0 になるのは、〖$+\\dfrac{\\pi}{4}$〗です。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":2,"eq":[{"cont":false,"items":[["-\\dfrac{\\pi}{4} + \\dfrac{\\pi}{4} = 0"]]}],"emph":["S2","X2"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["v_2 = V_m \\sin\\left(\\omega t + \\dfrac{\\pi}{4}\\right)"]]}],"emph":["W2","Y1"]},{"text":"左にずれたので、$v_2$ は $v_1$ より〖$\\dfrac{\\pi}{4}$ 進んで〗います。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["W2","W1","Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{},"route":["スタートの点","符号を決める"]}},{"id":"t27s6e","scene":"t27s6e","kind":"u27s6cwp","lab":{"src":"{v}","r":"{R}","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"ref":true,"a1":"{v}","a1l":1,"a1g":0,"rot":true,"adv":"進み","lag":"遅れ","a2":"{i}","a2l":0.5,"a2g":0,"a3":"{v}_2","a3l":0.8,"a3g":-60,"g1":"60°","g1f":0,"g1t":-60},"viewbox":"86 88 1234 1298","band":{"want":"抵抗に流れる電流と、ベクトル図","ans":"抵抗では電圧と電流は同相。ベクトル図は長さ＝最大値・向き＝位相","full":"抵抗に v = V_m sin ωt を加えると i = (V_m/R) sin ωt で、電圧と同じ形（同相）。ベクトル図は、矢印の長さで最大値、向きで位相を表す。右向きが位相 0、反時計回りが進み、時計回りが遅れ。"},"narr":{"start":{"co":1,"t":0,"w2d":0,"a1d":0,"a2d":0,"a3d":0,"g1d":0,"rotd":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"①抵抗の電流\n②ベクトル図\n③同相\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"交流電源に抵抗 $R$ をつなぎ、$v = V_m \\sin \\omega t$ の電圧を加えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R","W1"]},{"text":"抵抗の値は変わらないので、〖電流は電圧に比例〗します。電圧が 0 のとき電流も 0、電圧が最大のとき電流も最大です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i","emph":["W2","I"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["i = \\dfrac{V_m}{R} \\sin \\omega t"]]}],"emph":["W2","R"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"波形は見にくいので、矢印で表します。","at":{"道筋":1.0,"動き":1.0},"after":[],"route":2,"move":"pv"},{"text":"〖長さで最大値、向きで位相〗を表します。これをベクトル図といいます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a1","emph":["A1"]},{"text":"右向きが位相 0 です。〖反時計回りが進み〗、時計回りが遅れです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"rot","emph":["Ref","Rot"]},{"text":"例えば $\\dfrac{\\pi}{3}$ 遅れの波は、時計回りに 60° 傾けてかきます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a3","emph":["A3","G1"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"抵抗の電流は、電圧と位相差がありません。位相差が 0 のことを〖同相〗といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"a2","emph":["A1","A2"]},{"text":"ベクトル図では、どちらも右向きです。電流の矢印の長さは、電流の最大値です。","at":{"強調":1.0},"after":[],"emph":["A2"]},{"text":"これからは、電圧を基準にして、電流が進むか遅れるかを比べます。抵抗では同相です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A1","A2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u27s6cwpL","u27s6cwpw1"],"zlo":["u27s6cwpRw","u27s6cwpw2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1","paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1","ps2x1t0","ps2x1t1"],"S3":["ws3x1","ps3x1t0","ps3x1t1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"i":{"to":{"w2d":1},"dur":1.0},"pv":{"to":{"t":1},"dur":0.6},"a1":{"to":{"a1d":1},"dur":0.6},"rot":{"to":{"rotd":1},"dur":0.5},"a3":{"to":{"a3d":1,"g1d":1},"dur":0.8},"a2":{"to":{"a2d":1},"dur":0.6}},"route":["抵抗の電流","ベクトル図","同相"]}},{"id":"t27s6x","scene":"t27s6x","kind":"u27s6cw","lab":{"src":"{v}=100\\sqrt{2}\\sin{ω}{t}","r":"20 Ω","i":["{i}","{i}=5\\sqrt{2}\\sin{ω}{t}"],"ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5},"viewbox":"202 260 1118 1126","band":{"want":"電流 $i$ の式","known":"$v = 100\\sqrt{2} \\sin \\omega t$、$R = 20\\,\\Omega$","ans":"$i = 5\\sqrt{2} \\sin \\omega t$"},"narr":{"start":{"co":1,"w2d":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"求めるのは、抵抗に流れる電流 $i$ の式です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①最大値\n②位相\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"電流は電圧に比例するので、最大値は〖電圧の最大値を抵抗で割った値〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W2","R"],"eq":[{"cont":false,"items":[["I_m = \\dfrac{100\\sqrt{2}}{20} = 5\\sqrt{2}\\,\\mathrm{A}"]]}],"emphPre":["W1","R"]}]},{"cap":null,"eqp":null,"vid":[14],"sents":[{"text":"抵抗では、電流は電圧と〖同相〗です。位相は電圧と同じ 0 です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["W1","W2"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["i = 5\\sqrt{2} \\sin \\omega t"]]}],"move":"i","ans":true,"emph":["I","W2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u27s6cwL","u27s6cww1"],"zlo":["u27s6cwRw","u27s6cww2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1"],"S3":["ws3x1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{"i":{"to":{"iv":1},"dur":0.5}},"route":["最大値","位相"]}}],"secs":[{"ex":{"text":"図の正弦波交流の電圧で、瞬時値が負の向きに一番大きくなったときの瞬時値は何 V か。","fig":{"kind":"u27s1wv","L":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"50 V","y2":"-50 V","pt":"{v}","ptat":0.75},"P":{}},"ch":[{"t":"$50\\,\\mathrm{V}$","v":"50","why":"谷では電圧の向きが逆なので、負の値になる"},{"t":"$-50\\,\\mathrm{V}$","v":"-50","why":""},{"t":"$0\\,\\mathrm{V}$","v":"0","why":"0 V になるのは、電圧の向きが変わるところ"},{"t":"$-100\\,\\mathrm{V}$","v":"-100","why":"山から谷までの幅を読んだ"}],"ans":1}},{"ex":{"text":"図の正弦波交流の周期は $0.02\\,\\mathrm{s}$ である。周波数は何 Hz か。","fig":{"kind":"u27s2wv","L":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per1":"0.02 s"},"P":{}},"ch":[{"t":"$0.02\\,\\mathrm{Hz}$","v":"0.02","why":"周期のまま。周波数は周期の逆数"},{"t":"$100\\,\\mathrm{Hz}$","v":"100","why":"半分の区間（0 から上がって 0 まで）を1周期とした"},{"t":"$50\\,\\mathrm{Hz}$","v":"50","why":""},{"t":"$25\\,\\mathrm{Hz}$","v":"25","why":"2周期を1周期とした"}],"ans":2}},{"ex":{"text":"最大値 $100\\,\\mathrm{V}$、周波数 $50\\,\\mathrm{Hz}$ の正弦波交流の電圧の瞬時値 $v$［V］を表す式はどれか。","fig":{"kind":"u27s3wv","L":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"100 V","per1":"0.02 s"},"P":{}},"ch":[{"t":"$v = 100 \\sin 50\\pi t$","v":"50pi","why":"$\\omega = 2\\pi f$ の 2 を掛けていない"},{"t":"$v = 50 \\sin 100\\pi t$","v":"50s","why":"最大値と周波数を取り違えた"},{"t":"$v = 100 \\sin 100\\pi t$","v":"ok","why":""},{"t":"$v = 100 \\sin 50 t$","v":"50t","why":"$\\omega = 2\\pi f$ なので、$2\\pi$ を掛ける"}],"ans":2}},{"ex":{"text":"正弦波交流の電圧が $v = 100 \\sin 100\\pi t$［V］で表される。$t = \\dfrac{1}{200}\\,\\mathrm{s}$ のときの瞬時値は何 V か。","fig":{"kind":"u27s4wv","L":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"100 V","y2":"-100 V","pt":"{v}","ptat":0.25},"P":{}},"ch":[{"t":"$100\\,\\mathrm{V}$","v":"100","why":""},{"t":"$0\\,\\mathrm{V}$","v":"0","why":"それは角度が $\\pi$ のとき（0 を通る）"},{"t":"$-100\\,\\mathrm{V}$","v":"-100","why":"それは角度が $\\dfrac{3}{2}\\pi$ のとき（谷）"},{"t":"$50\\,\\mathrm{V}$","v":"50","why":"時刻の値を、そのまま最大値の割合とした"}],"ans":0}},{"ex":{"text":"$v_1 = V_m \\sin \\omega t$ の波を、図のように左へ $\\dfrac{\\pi}{4}$ ずらした波 $v_2$ を表す式はどれか。","fig":{"kind":"u27s5wv","L":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","y1":"{V}_m","left":0.25,"w2":"{v}_2","w2p":45,"x2":"-\\dfrac{π}{4}","x2at":-0.125},"P":{}},"ch":[{"t":"$v_2 = V_m \\sin\\left(\\omega t - \\dfrac{\\pi}{4}\\right)$","v":"m","why":"右へずらしたときの式。スタートの点を入れてカッコの中が 0 になる符号にする"},{"t":"$v_2 = V_m \\sin\\left(\\omega t + \\dfrac{\\pi}{4}\\right)$","v":"ok","why":""},{"t":"$v_2 = V_m \\sin \\omega t + \\dfrac{\\pi}{4}$","v":"out","why":"ずれは $\\sin$ のカッコの中に入れる"},{"t":"$v_2 = \\dfrac{\\pi}{4} V_m \\sin \\omega t$","v":"mul","why":"ずれは最大値を変えない"}],"ans":1}},{"ex":{"text":"図のように、$v = 100\\sqrt{2} \\sin \\omega t$［V］の電圧を $20\\,\\Omega$ の抵抗に加えた。流れる電流 $i$［A］を表す式はどれか。","fig":{"kind":"u27s6cw","L":{"src":"{v}=100\\sqrt{2}\\sin{ω}{t}","r":"20 Ω","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5},"P":{}},"ch":[{"t":"$i = 2000\\sqrt{2} \\sin \\omega t$","v":"mul","why":"割るところを掛けた"},{"t":"$i = 5 \\sin \\omega t$","v":"nor","why":"最大値の $\\sqrt{2}$ も残る"},{"t":"$i = 5\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$","v":"lag","why":"抵抗では電流は電圧と同相（ずれない）"},{"t":"$i = 5\\sqrt{2} \\sin \\omega t$","v":"ok","why":""}],"ans":3}}],"past":[]}};
});
