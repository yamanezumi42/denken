/* 単元14「クーロンの法則」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(14, function(H){
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
// ---- 14-1 点電荷とクーロン力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u14_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U14S1K = {
  att: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  rep: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pr: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pr2: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[1],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[1],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[1],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[1],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[1],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[1],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[1],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[1],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[1],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[1],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[1],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[1],"t":"F","x":490,"y":540,"anc":"middle"},{"f":"c","id":"q1cx1","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[2],"t":"F"},{"f":"ln","id":"q1mx1","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[2],"t":"F"},{"f":"tx","id":"q1mtx1","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[2],"t":"F"},{"f":"lb","id":"q1tx1","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[2],"t":"F","x":300,"y":340,"anc":"middle","n":"q1x1"},{"f":"c","id":"q2cx1","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[2],"t":"F"},{"f":"ln","id":"q2mx1","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[2],"t":"F"},{"f":"tx","id":"q2mtx1","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[2],"t":"F"},{"f":"lb","id":"q2tx1","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[2],"t":"F","x":680,"y":340,"anc":"middle","n":"q2x1"},{"f":"ar","id":"f1ax1","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[2],"t":"F"},{"f":"lb","id":"f1tx1","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[2],"t":"F","x":396,"y":370,"anc":"middle","n":"f1x1"},{"f":"ar","id":"f2ax1","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[2],"t":"F"},{"f":"lb","id":"f2tx1","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[2],"t":"F","x":584,"y":370,"anc":"middle","n":"f2x1"},{"f":"ln","id":"re1x1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[2],"t":"F"},{"f":"ln","id":"re2x1","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[2],"t":"F"},{"f":"ar","id":"rdx1","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[2],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":490,"y":540,"anc":"middle","n":"rx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU14s1att(d, p, L){ tbFig_Draw(d, p, L, U14S1K.att); }
function tbU14s1rep(d, p, L){ tbFig_Draw(d, p, L, U14S1K.rep); }
function tbU14s1pr(d, p, L){ tbFig_Draw(d, p, L, U14S1K.pr); }
function tbU14s1pr2(d, p, L){ tbFig_Draw(d, p, L, U14S1K.pr2); }
// ---- 14-2 クーロンの法則 の図（※ textbook/gen/make_section.py が textbook/gen/data/u14_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U14S2K = {
  pr: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU14s2pr(d, p, L){ tbFig_Draw(d, p, L, U14S2K.pr); }
// ---- 14-3 距離の2乗に反比例 の図（※ textbook/gen/make_section.py が textbook/gen/data/u14_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U14S3K = {
  pr: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":334,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","mv":[["rx",380,0]],"sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"mv":[["rx",380,0]],"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"mv":[["rx",380,0]],"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"mv":[["rx",380,0]],"need":"q2","vis":[],"t":"F","x":680,"y":334,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":358,"anc":"middle"},"out":{"x":204,"y":358,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"mv":[["rx",380,0]],"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"mv":[["rx",380,0]],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":358,"anc":"middle"},"out":{"x":776,"y":358,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"mv":[["rx",380,0]],"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"mve":[["rx",380,0]],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"mv":[["rx",190,0]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU14s3pr(d, p, L){ tbFig_Draw(d, p, L, U14S3K.pr); }
// ---- 14-4 符号の扱い の図（※ textbook/gen/make_section.py が textbook/gen/data/u14_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U14S4K = {
  pr: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":404,"y":370,"anc":"middle"},"out":{"x":196,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":576,"y":370,"anc":"middle"},"out":{"x":784,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU14s4pr(d, p, L){ tbFig_Draw(d, p, L, U14S4K.pr); }
// ---- 14-5 電荷が3つ の図（※ textbook/gen/make_section.py が textbook/gen/data/u14_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U14S5K = {
  tri: {"vars":[],"items":[{"f":"c","id":"q0c","cx":300,"cy":540,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[271.5,511.5],[328.5,511.5],[328.5,568.5],[271.5,568.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":300,"y":541,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[344,584,"start",[1,1]],[256,496,"end",[-1,-1]]],"need":"q0","vis":[],"t":"F","x":344,"y":584,"anc":"start"},{"f":"c","id":"qac","cx":760,"cy":540,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[731.5,511.5],[788.5,511.5],[788.5,568.5],[731.5,568.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":760,"y":541,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[760,604,"middle",[0,1]],[804,540,"start",[1,0]]],"need":"qa","vis":[],"t":"F","x":760,"y":604,"anc":"middle"},{"f":"c","id":"qbc","cx":300,"cy":160,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[271.5,131.5],[328.5,131.5],[328.5,188.5],[271.5,188.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":300,"y":161,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[256,160,"end",[-1,0]],[300,100,"middle",[0,-1]]],"need":"qb","vis":[],"t":"F","x":256,"y":160,"anc":"end"},{"f":"ar","id":"rad","x0":340,"y0":540,"x1":720,"y1":540,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[530,506,"middle",[0,-1]],[530,584,"middle",[0,1]]],"need":"ra","vis":[],"t":"F","x":530,"y":506,"anc":"middle"},{"f":"ar","id":"rbd","x0":300,"y0":500,"x1":300,"y1":200,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[322,350,"start",[1,0]],[278,350,"end",[-1,0]]],"need":"rb","vis":[],"t":"F","x":322,"y":350,"anc":"start"},{"f":"ar","id":"f1a","x0":264,"y0":540,"x1":114,"y1":540,"need":"f1","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[98,540,"end",[-1,0]],[189,510,"middle",[0,-1]]],"o":["f1d"],"need":"f1","vis":[],"t":"F","x":133,"y":480,"anc":"middle"},{"f":"ar","id":"f2a","x0":300,"y0":576,"x1":300,"y1":726,"need":"f2","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[318,651,"start",[1,0]],[300,760,"middle",[0,1]]],"o":["f2d"],"need":"f2","vis":[],"t":"F","x":318,"y":651,"anc":"start"},{"f":"ln","id":"pg1","pts":[[114,540],[114,726]],"dash":1,"w":2,"o":["pgd"],"need":"f","vis":[],"t":"F"},{"f":"ln","id":"pg2","pts":[[300,726],[114,726]],"dash":1,"w":2,"o":["pgd"],"need":"f","vis":[],"t":"F"},{"f":"ar","id":"fa","x0":274.54,"y0":565.46,"x1":114,"y1":726,"w":5,"need":"f","gr":"fd","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[94,746,"end",[-1,1]],[114,762,"middle",[0,1]]],"o":["fd"],"need":"f","vis":[],"t":"F","x":114,"y":762,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ln: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[200,460,"middle",[0,1]],[242,360,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":208,"y":340,"anc":"middle"},{"f":"c","id":"q0c","cx":540,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[511.5,371.5],[568.5,371.5],[568.5,428.5],[511.5,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":540,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[540,340,"middle",[0,-1]],[540,460,"middle",[0,1]],[582,360,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":540,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[880,460,"middle",[0,1]],[922,360,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":504,"y0":386,"x1":394,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":504,"y0":386,"x1":394,"y1":386},"out":{"x0":576,"y0":386,"x1":686,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[449,356,"middle",[0,-1]],[449,416,"middle",[0,1]],[378,386,"end",[-1,0]]],"vbases":{"in":[[449,356,"middle",[0,-1]],[449,416,"middle",[0,1]],[378,386,"end",[-1,0]]],"out":[[631,356,"middle",[0,-1]],[631,416,"middle",[0,1]],[702,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":449,"y":296,"anc":"middle"},"out":{"x":707,"y":460,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":449,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":576,"y0":414,"x1":686,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":576,"y0":414,"x1":686,"y1":414},"out":{"x0":504,"y0":414,"x1":394,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[631,384,"middle",[0,-1]],[631,444,"middle",[0,1]],[702,414,"start",[1,0]]],"vbases":{"in":[[631,384,"middle",[0,-1]],[631,444,"middle",[0,1]],[702,414,"start",[1,0]]],"out":[[449,384,"middle",[0,-1]],[449,444,"middle",[0,1]],[378,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":631,"y":252,"anc":"middle"},"out":{"x":373,"y":464,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":631,"y":384,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,534]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[540,436],[540,534]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":520,"x1":540,"y1":520,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[370,560,"middle",[0,1]],[370,480,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":370,"y":560,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[540,436],[540,534]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,534]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":540,"y0":520,"x1":880,"y1":520,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[710,560,"middle",[0,1]],[710,480,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":710,"y":560,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU14s5tri(d, p, L){ tbFig_Draw(d, p, L, U14S5K.tri); }
function tbU14s5ln(d, p, L){ tbFig_Draw(d, p, L, U14S5K.ln); }
var KINDS = {u14s1att: tbU14s1att, u14s1rep: tbU14s1rep, u14s1pr: tbU14s1pr, u14s1pr2: tbU14s1pr2, u14s2pr: tbU14s2pr, u14s3pr: tbU14s3pr, u14s4pr: tbU14s4pr, u14s5tri: tbU14s5tri, u14s5ln: tbU14s5ln};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 14-1 の図は電流が流れないので載せない,
  // 14-2 の図は電流が流れないので載せない,
  // 14-3 の図は電流が流れないので載せない,
  // 14-4 の図は電流が流れないので載せない,
  // 14-5 の図は電流が流れないので載せない
};

// 14-1 点電荷とクーロン力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u14_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU14s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU14s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU14s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU14s1_par(a, b){ return a * b / (a + b); }
function tbU14s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU14s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU14s1_Qkind(r){
  var gcd = tbU14s1_gcd, ratio = tbU14s1_ratio, par = tbU14s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var s1 = (k == 3 ? '-' : '+');
    var s2 = (k == 1 ? '+' : '-');
    var nm = (k == 1 ? '2つの正電荷' : (k == 2 ? '正電荷と負電荷' : '2つの負電荷'));
    var good = (k == 2 ? '引き合う力（引力）' : '退け合う力（斥力）');
    var bad = (k == 2 ? '退け合う力（斥力）' : '引き合う力（引力）');
    var why = (k == 2 ? '退け合うのは、同じ符号どうし' : '引き合うのは、異なる符号どうし');
    var rule = (k == 2 ? '異なる符号どうしは引き合う' : '同じ符号どうしは退け合う');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "力は働かない", v: "none", why: "点電荷どうしには、必ず力が働く"}, {t: "片方の電荷にだけ働く", v: "one", why: "力は、2つの電荷の両方に働く"}]);
    return {form: "u14s1kind", text: "図のように、" + String(nm) + "を置いた。2つの電荷の間に働く力はどれか。", fig: {kind: "u14s1pr", L: tbU14s1_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-"}, [["q1s", String(s1)], ["q2s", String(s2)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), "働く力は " + String(good)], chk: {form: "u14s1kind", p: {k: k}}};
  }
  throw new Error("u14s1kind：条件に合う数字が見つからない");
}
function tbU14s1_Qdir(r){
  var gcd = tbU14s1_gcd, ratio = tbU14s1_ratio, par = tbU14s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var s1 = (k == 1 || k == 2 ? '+' : '-');
    var s2 = (k == 1 || k == 3 ? '+' : '-');
    var same = (k == 1 || k == 4 ? 1 : 0);
    var good = (same ? '右向き' : '左向き');
    var bad = (same ? '左向き' : '右向き');
    var why = (same ? '左向き（もう片方の電荷へ向かう向き）になるのは、異なる符号どうし' : '右向き（もう片方の電荷から離れる向き）になるのは、同じ符号どうし');
    var rule = (same ? '同じ符号どうしなので退け合う。$q_2$ は $q_1$ から離れる向き' : '異なる符号どうしなので引き合う。$q_2$ は $q_1$ へ向かう向き');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "上向き", v: "up", why: "力は、2つの電荷を結ぶ向きに働く"}, {t: "力は働かない", v: "none", why: "点電荷どうしには、必ず力が働く"}]);
    return {form: "u14s1dir", text: "図のように、左に $q_1$、右に $q_2$ を置いた。$q_2$ に働く力の向きはどれか。", fig: {kind: "u14s1pr", L: tbU14s1_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-"}, [["q1s", String(s1)], ["q2s", String(s2)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), "$q_2$ に働く力は " + String(good)], chk: {form: "u14s1dir", p: {k: k}}};
  }
  throw new Error("u14s1dir：条件に合う数字が見つからない");
}
function tbU14s1_Qname(r){
  var gcd = tbU14s1_gcd, ratio = tbU14s1_ratio, par = tbU14s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "クーロン力", v: "own"}, {t: "電流", v: "i", why: "電流は電荷の流れで、力ではない"}, {t: "電力", v: "p", why: "電力は電気がする仕事の割合で、力ではない"}, {t: "電圧", v: "v", why: "電圧は電位の差で、力ではない"}]);
    return {form: "u14s1name", text: "点電荷どうしに働く力を □ という。", fig: {kind: "u14s1pr", L: tbU14s1_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["点電荷どうしに働く力を、クーロン力という"], chk: {form: "u14s1name", p: {}}};
  }
  throw new Error("u14s1name：条件に合う数字が見つからない");
}
function tbU14s1_Qpt(r){
  var gcd = tbU14s1_gcd, ratio = tbU14s1_ratio, par = tbU14s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "大きさを持たない点で表した電荷", v: "own"}, {t: "正の電荷だけ", v: "pos", why: "点電荷には正電荷も負電荷もある"}, {t: "電荷を持たない点", v: "zero", why: "点電荷は電荷を持っている"}, {t: "負の電荷だけ", v: "neg", why: "点電荷には正電荷も負電荷もある"}]);
    return {form: "u14s1pt", text: "点電荷とは、□ である。", fig: {kind: "u14s1pr", L: tbU14s1_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["本当は大きさを持つ電荷を、大きさを持たない点で表した物を点電荷という"], chk: {form: "u14s1pt", p: {}}};
  }
  throw new Error("u14s1pt：条件に合う数字が見つからない");
}
// 14-2 クーロンの法則 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u14_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU14s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU14s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU14s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU14s2_par(a, b){ return a * b / (a + b); }
function tbU14s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU14s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU14s2_Qf(r){
  var gcd = tbU14s2_gcd, ratio = tbU14s2_ratio, par = tbU14s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q1 = pick(r, [1,2,3,4,5,6,8,9,10,12]);
    var q2 = pick(r, [1,2,3,4,5,6,8,9,10,12]);
    var d = pick(r, [2,3,4,5,6]);
    var F = (9 * q1 * q2 / (d * d));
    var A = (9 * q1 * q2 / d);
    var B = (q1 * q2 / (d * d));
    var C = (9 * (q1 + q2) / (d * d));
    if (!(Number.isInteger(F) && nice(A) && nice(B) && nice(C) && F >= 1 && distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(A), why: "距離を2乗していない"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(B), why: "$9$ を掛けていない"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(C), why: "電荷の積でなく和を使った"}]);
    return {form: "u14s2f", text: "真空中で、$q_1 = " + fmt(q1) + "\\,\\mathrm{C}$ と $q_2 = " + fmt(q2) + "\\,\\mathrm{C}$ の点電荷を $" + fmt(d) + "\\,\\mathrm{m}$ 離して置いた。2つの電荷の間に働く力の大きさは何 N か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u14s2pr", L: tbU14s2_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, [["q1", "{q}_1=" + fmt(q1) + " C"], ["q2", "{q}_2=" + fmt(q2) + " C"], ["r", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = 9 \\times 10^9 \\times \\dfrac{q_1 q_2}{r^2}$", "$F = 9 \\times 10^9 \\times \\dfrac{" + fmt(q1) + " \\times " + fmt(q2) + "}{" + fmt(d) + "^2} = " + fmt(F) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u14s2f", p: {q1: q1, q2: q2, d: d}}};
  }
  throw new Error("u14s2f：条件に合う数字が見つからない");
}
function tbU14s2_Qsame(r){
  var gcd = tbU14s2_gcd, ratio = tbU14s2_ratio, par = tbU14s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q1 = pick(r, [1,2,3,4,5,6,8]);
    var q2 = pick(r, [1,2,3,4,5,6,8]);
    var d = pick(r, [1,2,3]);
    var F = (9 * q1 * q2 / (d * d));
    var A = (F * q2 / q1);
    var B = (F * q1 / q2);
    var C = (2 * F);
    if (!(q1 < q2 && nice(F) && nice(A) && nice(B) && F >= 1 && distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(A), why: "電荷の大きい方に大きい力が働くと考えた"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(B), why: "電荷の小さい方に大きい力が働くと考えた"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(C), why: "2つの電荷の力を足した"}]);
    return {form: "u14s2same", text: "真空中で、$q_1 = " + fmt(q1) + "\\,\\mathrm{C}$ と $q_2 = " + fmt(q2) + "\\,\\mathrm{C}$ の点電荷を $" + fmt(d) + "\\,\\mathrm{m}$ 離して置いた。$q_1$ に働く力の大きさは $" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$ だった。$q_2$ に働く力の大きさは何 N か。", fig: {kind: "u14s2pr", L: tbU14s2_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, [["q1", "{q}_1=" + fmt(q1) + " C"], ["q2", "{q}_2=" + fmt(q2) + " C"], ["r", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["2つの電荷には、同じ大きさの力が働く", "$q_2$ に働く力も $" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u14s2same", p: {q1: q1, q2: q2, d: d}}};
  }
  throw new Error("u14s2same：条件に合う数字が見つからない");
}
function tbU14s2_Qeq(r){
  var gcd = tbU14s2_gcd, ratio = tbU14s2_ratio, par = tbU14s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$F = \\dfrac{q_1 q_2}{4 \\pi \\varepsilon_0 r^2}$", v: "own"}, {t: "$F = \\dfrac{q_1 q_2}{4 \\pi \\varepsilon_0 r}$", v: "r1", why: "距離を2乗していない"}, {t: "$F = \\dfrac{4 \\pi \\varepsilon_0 q_1 q_2}{r^2}$", v: "inv", why: "$4 \\pi \\varepsilon_0$ は分母にある"}, {t: "$F = \\dfrac{q_1 + q_2}{4 \\pi \\varepsilon_0 r^2}$", v: "sum", why: "分子は電荷の和でなく積"}]);
    return {form: "u14s2eq", text: "真空中で、$q_1$［C］と $q_2$［C］の点電荷を $r$［m］離して置いた。働く力の大きさ $F$［N］を表す式は □ である。", fig: {kind: "u14s2pr", L: tbU14s2_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["分子は電荷の積、分母は $4 \\pi \\varepsilon_0$ と距離の2乗", "$F = \\dfrac{q_1 q_2}{4 \\pi \\varepsilon_0 r^2}$"], chk: {form: "u14s2eq", p: {}}};
  }
  throw new Error("u14s2eq：条件に合う数字が見つからない");
}
function tbU14s2_Qk(r){
  var gcd = tbU14s2_gcd, ratio = tbU14s2_ratio, par = tbU14s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$9 \\times 10^9$", v: "own"}, {t: "$4 \\pi$", v: "pi", why: "$4 \\pi$ は式の中の数の一部"}, {t: "$9$", v: "9", why: "$10^9$ が抜けている"}, {t: "$10^9$", v: "e9", why: "$9$ が抜けている"}]);
    return {form: "u14s2k", text: "クーロンの法則の式で、$\\dfrac{1}{4 \\pi \\varepsilon_0}$ をまとめた値は □ である。", fig: {kind: "u14s2pr", L: tbU14s2_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\pi$ と $\\varepsilon_0$ は決まった値なので、まとめられる", "$\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$"], chk: {form: "u14s2k", p: {}}};
  }
  throw new Error("u14s2k：条件に合う数字が見つからない");
}
// 14-3 距離の2乗に反比例 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u14_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU14s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU14s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU14s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU14s3_par(a, b){ return a * b / (a + b); }
function tbU14s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU14s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU14s3_Qfar(r){
  var gcd = tbU14s3_gcd, ratio = tbU14s3_ratio, par = tbU14s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,3,4,5]);
    var n2 = (n * n);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(n2) + "}$ 倍", v: "1/" + fmt(n2)}, {t: "$\\dfrac{1}{" + fmt(n) + "}$ 倍", v: "1/" + fmt(n), why: "距離を2乗していない"}, {t: "$" + fmt(n2) + "$ 倍", v: fmt(n2), why: "力は距離の2乗に反比例する（遠いほど弱い）"}, {t: "$" + fmt(n) + "$ 倍", v: fmt(n), why: "力は距離の2乗に反比例する（遠いほど弱い）"}]);
    return {form: "u14s3far", text: "真空中に置いた2つの点電荷の距離を、" + fmt(n) + " 倍にした。働く力の大きさは元の何倍になるか。", fig: {kind: "u14s3pr", L: tbU14s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["力は距離の2乗に反比例する", "距離 " + fmt(n) + " 倍で、分母は $" + fmt(n) + "^2 = " + fmt(n2) + "$ 倍。力は $\\dfrac{1}{" + fmt(n2) + "}$ 倍"], chk: {form: "u14s3far", p: {n: n}}};
  }
  throw new Error("u14s3far：条件に合う数字が見つからない");
}
function tbU14s3_Qnear(r){
  var gcd = tbU14s3_gcd, ratio = tbU14s3_ratio, par = tbU14s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,3,4]);
    var n2 = (n * n);
    var _c = choices(r, [{t: "$" + fmt(n2) + "$ 倍", v: fmt(n2)}, {t: "$" + fmt(n) + "$ 倍", v: fmt(n), why: "距離を2乗していない"}, {t: "$\\dfrac{1}{" + fmt(n2) + "}$ 倍", v: "1/" + fmt(n2), why: "近いほど力は強い"}, {t: "$\\dfrac{1}{" + fmt(n) + "}$ 倍", v: "1/" + fmt(n), why: "近いほど力は強い"}]);
    return {form: "u14s3near", text: "真空中に置いた2つの点電荷の距離を、$\\dfrac{1}{" + fmt(n) + "}$ にした。働く力の大きさは元の何倍になるか。", fig: {kind: "u14s3pr", L: tbU14s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["力は距離の2乗に反比例する", "距離 $\\dfrac{1}{" + fmt(n) + "}$ で、分母は $\\dfrac{1}{" + fmt(n2) + "}$ 倍。力は $" + fmt(n2) + "$ 倍"], chk: {form: "u14s3near", p: {n: n}}};
  }
  throw new Error("u14s3near：条件に合う数字が見つからない");
}
function tbU14s3_Qval(r){
  var gcd = tbU14s3_gcd, ratio = tbU14s3_ratio, par = tbU14s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,3,4]);
    var k = pick(r, [1,2,3,4,5,6,8,10]);
    var F = (k * n * n);
    var ok2 = (k);
    var A = (k * n);
    var B = (k * n * n * n * n);
    var C = (k * n * n * n);
    if (!(distinct([ok2, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ok2) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(ok2)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(A), why: "距離を2乗していない"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(B), why: "反比例なのに $" + fmt(n) + "^2$ を掛けた"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(C), why: "反比例なのに $" + fmt(n) + "$ を掛けた"}]);
    return {form: "u14s3val", text: "真空中に置いた2つの点電荷の間に、$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$ の力が働いていた。距離を " + fmt(n) + " 倍にすると、働く力の大きさは何 N になるか。", fig: {kind: "u14s3pr", L: tbU14s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"}, [["f1", "{F}"], ["f1a", "out"], ["f2", "{F}"], ["f2a", "out"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["距離 " + fmt(n) + " 倍で、力は $\\dfrac{1}{" + fmt(n) + "^2} = \\dfrac{1}{" + fmt(n * n) + "}$ 倍", "$" + fmt(F) + " \\times 10^9 \\times \\dfrac{1}{" + fmt(n * n) + "} = " + fmt(ok2) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u14s3val", p: {n: n, k: k}}};
  }
  throw new Error("u14s3val：条件に合う数字が見つからない");
}
// 14-4 符号の扱い の練習（※ textbook/gen/make_section.py が textbook/gen/data/u14_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU14s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU14s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU14s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU14s4_par(a, b){ return a * b / (a + b); }
function tbU14s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU14s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU14s4_Qsg(r){
  var gcd = tbU14s4_gcd, ratio = tbU14s4_ratio, par = tbU14s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8]);
    var b = pick(r, [1,2,3,4,5,6,8]);
    var d = pick(r, [2,3,4]);
    var k = pick(r, [1,2,3,4]);
    var s1 = (k == 1 || k == 2 ? 1 : -1);
    var s2 = (k == 1 || k == 3 ? 1 : -1);
    var F = (9 * s1 * a * s2 * b / (d * d));
    var A = (9 * s1 * a * s2 * b / d);
    var kind = (F < 0 ? '引力' : '斥力');
    var other = (F < 0 ? '斥力' : '引力');
    var c1 = (s1 > 0 ? '+' : '-');
    var c2 = (s2 > 0 ? '+' : '-');
    var why = (F < 0 ? '負は引力を表す' : '正は斥力を表す');
    if (!(nice(F) && nice(A) && Number.isInteger(F) && abs(F) >= 1 && abs(F) != abs(A))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(kind), v: fmt(F) + String(kind)}, {t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(other), v: fmt(F) + String(other), why: String(why)}, {t: "$" + fmt(-F) + " \\times 10^9\\,\\mathrm{N}$・" + String(kind), v: fmt(-F) + String(kind), why: "符号ごと入れたときの符号が逆"}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$・" + String(kind), v: fmt(A) + String(kind), why: "距離を2乗していない"}]);
    return {form: "u14s4sg", text: "真空中で、$q_1 = " + String(c1) + fmt(a) + "\\,\\mathrm{C}$ と $q_2 = " + String(c2) + fmt(b) + "\\,\\mathrm{C}$ の点電荷を $" + fmt(d) + "\\,\\mathrm{m}$ 離して置いた。クーロンの法則の式に符号ごと入れたときの $F$ と、力の種類の組はどれか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u14s4pr", L: tbU14s4_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-","r":"{r}"}, [["q1", String(c1) + "{q}_1=" + fmt(a) + " C"], ["q1s", String(c1)], ["q2", String(c2) + "{q}_2=" + fmt(b) + " C"], ["q2s", String(c2)], ["r", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = 9 \\times 10^9 \\times \\dfrac{(" + String(c1) + fmt(a) + ") \\times (" + String(c2) + fmt(b) + ")}{" + fmt(d) + "^2} = " + fmt(F) + " \\times 10^9\\,\\mathrm{N}$", "$F$ が" + String(F < 0 ? '負' : '正') + "なので" + String(kind) + "　答えは $" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(kind)], chk: {form: "u14s4sg", p: {a: a, b: b, d: d, s: s1 * s2}}};
  }
  throw new Error("u14s4sg：条件に合う数字が見つからない");
}
function tbU14s4_Qkind(r){
  var gcd = tbU14s4_gcd, ratio = tbU14s4_ratio, par = tbU14s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [3,6,9,12,18,27,36,45]);
    var k = pick(r, [1,2]);
    var F = (k == 1 ? -m : m);
    var kind = (k == 1 ? '引力' : '斥力');
    var other = (k == 1 ? '斥力' : '引力');
    var why = (k == 1 ? '負は引力を表す' : '正は斥力を表す');
    var _c = choices(r, [{t: String(kind), v: String(kind)}, {t: String(other), v: String(other), why: String(why)}, {t: "力は働かない", v: "none", why: "$F$ は 0 でないので力は働く"}, {t: "向きは決まらない", v: "unk", why: "符号ごと入れれば、負か正かで決まる"}]);
    return {form: "u14s4kind", text: "2つの点電荷の電荷を、クーロンの法則の式に符号ごと入れて計算すると、$F = " + fmt(F) + " \\times 10^9\\,\\mathrm{N}$ になった。2つの電荷の間に働く力はどれか。", fig: {kind: "u14s4pr", L: tbU14s4_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-","r":"{r}"}, [["q1s", ""], ["q2s", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["符号ごと入れたとき、負なら引力、正なら斥力", "$F$ が" + String(k == 1 ? '負' : '正') + "なので " + String(kind)], chk: {form: "u14s4kind", p: {k: k}}};
  }
  throw new Error("u14s4kind：条件に合う数字が見つからない");
}
function tbU14s4_Qabs(r){
  var gcd = tbU14s4_gcd, ratio = tbU14s4_ratio, par = tbU14s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8]);
    var b = pick(r, [1,2,3,4,5,6,8]);
    var d = pick(r, [1,2,3]);
    var k = pick(r, [1,2,3,4]);
    var s1 = (k == 1 || k == 2 ? 1 : -1);
    var s2 = (k == 1 || k == 3 ? 1 : -1);
    var F = (9 * a * b / (d * d));
    var A = (9 * a * b / d);
    var c1 = (s1 > 0 ? '+' : '-');
    var c2 = (s2 > 0 ? '+' : '-');
    var dir = (s1 * s2 > 0 ? '右向き' : '左向き');
    var odir = (s1 * s2 > 0 ? '左向き' : '右向き');
    var rule = (s1 * s2 > 0 ? '同じ符号なので斥力。$q_2$ は $q_1$ から離れる右向き' : '異なる符号なので引力。$q_2$ は $q_1$ へ向かう左向き');
    var why = (s1 * s2 > 0 ? '同じ符号は斥力。$q_2$ は $q_1$ から離れる向き' : '異なる符号は引力。$q_2$ は $q_1$ へ向かう向き');
    if (!(Number.isInteger(F) && Number.isInteger(A) && F >= 1 && F != A)) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(dir), v: fmt(F) + String(dir)}, {t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(odir), v: fmt(F) + String(odir), why: String(why)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$・" + String(dir), v: fmt(A) + String(dir), why: "距離を2乗していない"}, {t: "$-" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(dir), v: "-" + fmt(F) + String(dir), why: "向きが分かっているので、絶対値で入れて大きさを出す"}]);
    return {form: "u14s4abs", text: "真空中で、左に $q_1 = " + String(c1) + fmt(a) + "\\,\\mathrm{C}$、右に $q_2 = " + String(c2) + fmt(b) + "\\,\\mathrm{C}$ の点電荷を $" + fmt(d) + "\\,\\mathrm{m}$ 離して置いた。$q_2$ に働く力の大きさと向きの組はどれか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u14s4pr", L: tbU14s4_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-","r":"{r}"}, [["q1", String(c1) + "{q}_1=" + fmt(a) + " C"], ["q1s", String(c1)], ["q2", String(c2) + "{q}_2=" + fmt(b) + " C"], ["q2s", String(c2)], ["r", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), "大きさは絶対値で入れる　$F = 9 \\times 10^9 \\times \\dfrac{" + fmt(a) + " \\times " + fmt(b) + "}{" + fmt(d) + "^2} = " + fmt(F) + " \\times 10^9\\,\\mathrm{N}$・" + String(dir)], chk: {form: "u14s4abs", p: {a: a, b: b, d: d, s: s1 * s2}}};
  }
  throw new Error("u14s4abs：条件に合う数字が見つからない");
}
// 14-5 電荷が3つ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u14_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU14s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU14s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU14s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU14s5_par(a, b){ return a * b / (a + b); }
function tbU14s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU14s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU14s5_Qres(r){
  var gcd = tbU14s5_gcd, ratio = tbU14s5_ratio, par = tbU14s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t = pick(r, [[3,4,5],[5,12,13],[8,15,17],[7,24,25]]);
    var k = pick(r, [1,2,3,4,5,6,8,9]);
    var sw = pick(r, [0,1]);
    var F1 = (sw ? t[1] * k : t[0] * k);
    var F2 = (sw ? t[0] * k : t[1] * k);
    var F = (t[2] * k);
    var A = (F1 + F2);
    var B = (abs(F1 - F2));
    var C = (F1 * F1 + F2 * F2);
    if (!(distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(A), why: "直角の2つの力を、そのまま足した"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(B), why: "直角の2つの力を、引いた"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(C), why: "2乗の和の平方根をとっていない"}]);
    return {form: "u14s5res", text: "点電荷 $q_0$ に、$q_a$ から受ける力 $F_1 = " + fmt(F1) + " \\times 10^9\\,\\mathrm{N}$ と、$q_b$ から受ける力 $F_2 = " + fmt(F2) + " \\times 10^9\\,\\mathrm{N}$ が、図のように直角に働いている。合成した力の大きさは何 N か。", fig: {kind: "u14s5tri", L: tbU14s5_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_a","qas":"+","qb":"{q}_b","qbs":"+","ra":"{r}_a","rb":"{r}_b"}, [["q0", "{q}_0"], ["f1", "{F}_1=" + fmt(F1) + "×10⁹ N"], ["f1a", "out"], ["f2", "{F}_2=" + fmt(F2) + "×10⁹ N"], ["f2a", "out"], ["f", "{F}"], ["ra", null], ["rb", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直角なので三平方の定理。$10^9$ を外して計算する", "$\\sqrt{" + fmt(F1) + "^2 + " + fmt(F2) + "^2} = " + fmt(F) + "$　答えは $" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u14s5res", p: {a: F1, b: F2}}};
  }
  throw new Error("u14s5res：条件に合う数字が見つからない");
}
function tbU14s5_Qfull(r){
  var gcd = tbU14s5_gcd, ratio = tbU14s5_ratio, par = tbU14s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q0 = pick(r, [1,2,3]);
    var qa = pick(r, [1,2,3,4,6,8,9,12,16]);
    var qb = pick(r, [1,2,3,4,6,8,9,12,16]);
    var ra = pick(r, [1,2,3]);
    var rb = pick(r, [1,2,3]);
    var F1 = (9 * q0 * qa / (ra * ra));
    var F2 = (9 * q0 * qb / (rb * rb));
    var F = (Math.sqrt(F1 * F1 + F2 * F2));
    var A = (F1 + F2);
    var B = (abs(F1 - F2));
    var C = (F1 * F1 + F2 * F2);
    if (!(Number.isInteger(F1) && Number.isInteger(F2) && Number.isInteger(F) && F1 != F2 && F <= 300 && distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(A), why: "直角の2つの力を、そのまま足した"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(B), why: "直角の2つの力を、引いた"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(C), why: "2乗の和の平方根をとっていない"}]);
    return {form: "u14s5full", text: "真空中で、正の点電荷 $q_0 = " + fmt(q0) + "\\,\\mathrm{C}$ の右 $" + fmt(ra) + "\\,\\mathrm{m}$ に $q_a = " + fmt(qa) + "\\,\\mathrm{C}$、上 $" + fmt(rb) + "\\,\\mathrm{m}$ に $q_b = " + fmt(qb) + "\\,\\mathrm{C}$ の正の点電荷を置いた。$q_0$ に働く力の大きさは何 N か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u14s5tri", L: tbU14s5_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_a","qas":"+","qb":"{q}_b","qbs":"+","ra":"{r}_a","rb":"{r}_b"}, [["q0", "{q}_0=" + fmt(q0) + " C"], ["qa", "{q}_a=" + fmt(qa) + " C"], ["qb", "{q}_b=" + fmt(qb) + " C"], ["ra", fmt(ra) + " m"], ["rb", fmt(rb) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F_1 = 9 \\times 10^9 \\times \\dfrac{" + fmt(q0) + " \\times " + fmt(qa) + "}{" + fmt(ra) + "^2} = " + fmt(F1) + " \\times 10^9\\,\\mathrm{N}$", "$F_2 = 9 \\times 10^9 \\times \\dfrac{" + fmt(q0) + " \\times " + fmt(qb) + "}{" + fmt(rb) + "^2} = " + fmt(F2) + " \\times 10^9\\,\\mathrm{N}$", "直角なので $\\sqrt{" + fmt(F1) + "^2 + " + fmt(F2) + "^2} = " + fmt(F) + "$　答えは $" + fmt(F) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u14s5full", p: {q0: q0, qa: qa, qb: qb, ra: ra, rb: rb}}};
  }
  throw new Error("u14s5full：条件に合う数字が見つからない");
}
function tbU14s5_Qzero(r){
  var gcd = tbU14s5_gcd, ratio = tbU14s5_ratio, par = tbU14s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var s0 = (k == 1 || k == 2 ? '+' : '-');
    var sab = (k == 1 || k == 3 ? '+' : '-');
    var rule = (k == 1 || k == 4 ? '同じ符号なので、どちらからも離れる向き' : '異なる符号なので、どちらへも向かう向き');
    var _c = choices(r, [{t: "力は働かない（0）", v: "zero"}, {t: "左向き", v: "l", why: "両方の電荷から同じ大きさの力を受けるので、打ち消し合う"}, {t: "右向き", v: "r", why: "両方の電荷から同じ大きさの力を受けるので、打ち消し合う"}, {t: "1つの力の2倍の大きさ", v: "two", why: "2つの力は逆向きなので、足さずに打ち消し合う"}]);
    return {form: "u14s5zero", text: "真空中で、同じ電荷の点電荷 $q_a$ と $q_b$ を置き、そのちょうど真ん中に点電荷 $q_0$ を置いた。$q_0$ に働く力はどれか。", fig: {kind: "u14s5ln", L: tbU14s5_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_a","qas":"+","qb":"{q}_b","qbs":"+","ra":"{r}_a","rb":"{r}_b"}, [["q0s", String(s0)], ["qas", String(sab)], ["qbs", String(sab)], ["ra", "{r}"], ["rb", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule) + "。電荷も距離も同じなので、2つの力は同じ大きさで逆向き", "打ち消し合って、力は働かない"], chk: {form: "u14s5zero", p: {k: k}}};
  }
  throw new Error("u14s5zero：条件に合う数字が見つからない");
}
var GEN = {
  // 14-1 点電荷とクーロン力
  1: function(r){ return pick(r, [tbU14s1_Qkind, tbU14s1_Qkind, tbU14s1_Qkind, tbU14s1_Qdir, tbU14s1_Qdir, tbU14s1_Qdir, tbU14s1_Qname, tbU14s1_Qpt])(r); },
  // 14-2 クーロンの法則
  2: function(r){ return pick(r, [tbU14s2_Qf, tbU14s2_Qf, tbU14s2_Qf, tbU14s2_Qf, tbU14s2_Qsame, tbU14s2_Qsame, tbU14s2_Qeq, tbU14s2_Qk])(r); },
  // 14-3 距離の2乗に反比例
  3: function(r){ return pick(r, [tbU14s3_Qfar, tbU14s3_Qfar, tbU14s3_Qnear, tbU14s3_Qval, tbU14s3_Qval, tbU14s3_Qval])(r); },
  // 14-4 符号の扱い
  4: function(r){ return pick(r, [tbU14s4_Qsg, tbU14s4_Qsg, tbU14s4_Qsg, tbU14s4_Qkind, tbU14s4_Qkind, tbU14s4_Qabs, tbU14s4_Qabs, tbU14s4_Qabs])(r); },
  // 14-5 電荷が3つ
  5: function(r){ return pick(r, [tbU14s5_Qres, tbU14s5_Qres, tbU14s5_Qres, tbU14s5_Qfull, tbU14s5_Qfull, tbU14s5_Qfull, tbU14s5_Qzero, tbU14s5_Qzero])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t14s1e","scene":"t14s1e","kind":"u14s1pr2","lab":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"-","f1":"{F}","f1a":"in","f2":"{F}","f2a":"in"},"viewbox":"130 307 720 219","band":{"want":"点電荷どうしに働く力の向き","ans":"異なる符号は引力・同じ符号は斥力","full":"大きさを持たない点で表した電荷を点電荷という。点電荷どうしに働く力をクーロン力という。異なる符号どうしは引き合い（引力）、同じ符号どうしは退け合う（斥力）。"},"narr":{"start":{"co":1,"t":0,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"①点電荷\n②異なる符号\n③同じ符号\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"電荷は本当は大きさを持っています。それを、大きさを持たない点で表した物を点電荷といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q1","Q2"]},{"text":"電荷には、正電荷と負電荷があります。正電荷は＋、負電荷は－で表します。","at":{"強調":1.0},"after":[],"emph":["Q1","Q2"]},{"text":"点電荷どうしには、互いに力が働きます。この力を〖クーロン力〗といいます。","at":{"強調":1.0},"after":[],"emph":["Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"＋と－のように、異なる符号どうしでは、〖互いに引き合う力〗が働きます。これを引力といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"att","emph":["Q1","Q2","F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"＋と＋のように、同じ符号どうしでは、〖互いに退け合う力〗が働きます。これを斥力といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"rep","emph":["Q1","Q2","F1","F2"]},{"text":"－と－でも、同じ符号なので斥力です。〖異なる符号は引力、同じ符号は斥力〗です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Q1","Q2"],"ans":true}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1","q1cx1","q1cx1:t","q1mx1","q1mtx1","q1tx10","q1tx11"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1","q2cx1","q2cx1:t","q2mx1","q2mtx1","q2tx10","q2tx11"],"F1":["f1a","f1a:h","f1t0","f1t1","f1ax1","f1ax1:h","f1tx10","f1tx11"],"F2":["f2a","f2a:h","f2t0","f2t1","f2ax1","f2ax1:h","f2tx10","f2tx11"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1","re1x1","re2x1","rdx1","rdx1:h","rdx1:h2","rtx10","rtx11"]},"moves":{"att":{"to":{"f1d":1,"f2d":1},"dur":0.8},"rep":{"to":{"t":1},"dur":0.6}},"route":["点電荷","異なる符号","同じ符号"]}},{"id":"t14s1x","scene":"t14s1x","kind":"u14s1pr","lab":{"q1":"{q}_1","q1s":"-","q2":"{q}_2","q2s":"-","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"},"viewbox":"130 307 720 219","band":{"want":"2つの負電荷に働く力","ans":"退け合う力（斥力）"},"narr":{"start":{"co":1,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、2つの負電荷の間に働く力です。","at":{"強調":1.0},"after":[],"emph":["Q1","Q2"]},{"text":"①符号を見る\n②力の向き\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"どちらも－なので、同じ符号どうしです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"同じ符号どうしには、〖退け合う力〗が働きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"f","emph":["F1","F2"]},{"text":"答えは、退け合う力の斥力です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Q1","Q2","F1","F2"],"ans":true}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["符号を見る","力の向き"]}},{"id":"t14s2e","scene":"t14s2e","kind":"u14s2pr","lab":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"},"viewbox":"130 307 720 266","band":{"want":"クーロン力の大きさ","ans":"$F = 9 \\times 10^9 \\times \\dfrac{q_1 q_2}{r^2}$","full":"電荷 q1・q2［C］の点電荷を r［m］離して置くと、2つの電荷には同じ大きさの力 F［N］が働く。F = q1 q2 /（4π ε0 r^2）。1 /（4π ε0）= 9 × 10^9 とまとめる。"},"narr":{"start":{"co":1,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"①記号\n②式\n③まとめた数\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"電荷の量を $q_1$、$q_2$ とします。単位はクーロン C です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q1","Q2"]},{"text":"2つの電荷の距離を $r$ とします。単位はメートル m です。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"このとき2つの電荷には、同じ大きさの力 $F$ が働きます。単位はニュートン N です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f","emph":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"力の大きさは、次の式で求めます。この式を〖クーロンの法則〗といいます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{q_1 q_2}{4 \\pi \\varepsilon_0 r^2}"]]}],"emphPre":["F1","F2","Q1","Q2","R"]},{"text":"分子は電荷の積 $q_1 q_2$、分母には〖距離の2乗〗 $r^2$ があります。","at":{"強調":1.0},"after":[],"emph":["Q1","Q2","R"]},{"text":"$\\pi$ は円周率、$\\varepsilon_0$ は真空中の誘電率です。どちらも決まった値です。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"決まった値の部分をまとめると、〖$9 \\times 10^9$〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["F1","F2"],"eq":[{"cont":false,"items":[["\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9"]]}],"emphPre":["F1","F2"]},{"text":"これを使うと、式は次のようになります。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = 9 \\times 10^9 \\times \\dfrac{q_1 q_2}{r^2}"]]}],"ans":true,"emphPre":["F1","F2","Q1","Q2","R"]}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["記号","式","まとめた数"]}},{"id":"t14s2x","scene":"t14s2x","kind":"u14s2pr","lab":{"q1":"{q}_1=4 C","q1s":"+","q2":"{q}_2=3 C","q2s":"+","r":"{r}=2 m","f1":["{F}","{F}"],"f1a":"out","f2":["{F}","{F}"],"f2a":"out"},"viewbox":"130 307 720 266","band":{"want":"クーロン力の大きさ $F$","known":"$q_1 = 4\\,\\mathrm{C},\\;\\; q_2 = 3\\,\\mathrm{C},\\;\\; r = 2\\,\\mathrm{m}$","ans":"$F = 27 \\times 10^9\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、2つの電荷に働く力の大きさ $F$ です。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"クーロンの法則の式を使います。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"f","emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = 9 \\times 10^9 \\times \\dfrac{q_1 q_2}{r^2}"]]}],"emphPre":["F1","F2","Q1","Q2","R"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$q_1 = 4$、$q_2 = 3$、$r = 2$ を入れます。分母は〖$r$ の2乗〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = 9 \\times 10^9 \\times \\dfrac{4 \\times 3}{2^2}"],["= 9 \\times 10^9 \\times 3","= 27 \\times 10^9\\,\\mathrm{N}"]]}],"ans":true,"emphPre":["Q1","Q2","R","F1","F2"]}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["式を書く","数を入れる"]}},{"id":"t14s3e","scene":"t14s3e","kind":"u14s3pr","lab":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":["{r}","2{r}"],"f1":["{F}","{F}'"],"f1a":"out","f2":["{F}","{F}'"],"f2a":"out"},"viewbox":"130 290 1100 294","band":{"want":"距離を変えたときの力","ans":"力は距離の2乗に反比例する","full":"クーロン力の式の分母に距離の2乗 r^2 があるので、力は距離の2乗に反比例する。距離が2倍なら 1/4 倍、3倍なら 1/9 倍。"},"narr":{"start":{"co":1,"f1d":1,"f2d":1,"rx":0,"rv":0,"f1v":0,"f2v":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"①分母を見る\n②2倍にする\n③決まり\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"クーロンの法則の式では、距離の2乗 $r^2$ が分母にあります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","F1","F2"],"eq":[{"cont":false,"items":[["F = 9 \\times 10^9 \\times \\dfrac{q_1 q_2}{r^2}"]]}],"emphPre":["R","F1","F2"]},{"text":"分母が大きくなるほど、力は小さくなります。〖遠いほど力は弱く〗、近いほど強くなります。","at":{"強調":1.0},"after":[],"emph":["R","F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"距離を2倍の $2r$ にしてみます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"far","emph":["R","Q2"]},{"text":"分母は $r^2$ から $(2r)^2 = 4r^2$ になり、4倍です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R"],"eq":[{"cont":false,"items":[["(2r)^2 = 4r^2"]]}],"emphPre":["R"]},{"text":"分母が4倍なので、力は〖$\\dfrac{1}{4}$ 倍〗になります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F1","F2"],"eq":[{"cont":false,"items":[["F' = \\dfrac{1}{4} F"]]}],"emphPre":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"このように、力は〖距離の2乗に反比例〗します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R","F1","F2"]},{"text":"距離が3倍なら $\\dfrac{1}{9}$ 倍、2倍なら $\\dfrac{1}{4}$ 倍です。2乗を忘れないようにします。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["R","F1","F2"],"ans":true}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"far":{"to":{"rx":1,"rv":1,"f1v":1,"f2v":1},"dur":1.0}},"route":["分母を見る","2倍にする","決まり"]}},{"id":"t14s3x","scene":"t14s3x","kind":"u14s3pr","lab":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":["{r}","3{r}"],"f1":["{F}","{F}'"],"f1a":"out","f2":["{F}","{F}'"],"f2a":"out"},"viewbox":"130 290 1100 294","band":{"want":"距離を3倍にしたときの力","ans":"$\\dfrac{1}{9}$ 倍"},"narr":{"start":{"co":1,"f1d":1,"f2d":1,"rx":0,"rv":0,"f1v":0,"f2v":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、距離を3倍にしたときの力が、元の何倍かです。","at":{"強調":1.0},"after":[],"emph":["R","F1","F2"]},{"text":"①分母の変わり方\n②力の変わり方\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"距離を $3r$ にすると、分母の $r^2$ は $(3r)^2 = 9r^2$、9倍になります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"far","emph":["R"],"eq":[{"cont":false,"items":[["(3r)^2 = 9r^2"]]}],"emphPre":["R"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"分母が9倍なので、力は〖$\\dfrac{1}{9}$ 倍〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["F1","F2"],"eq":[{"cont":false,"items":[["F' = \\dfrac{1}{9} F"]]}],"ans":true,"emphPre":["F1","F2"]}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"far":{"to":{"rx":1,"rv":1,"f1v":1,"f2v":1},"dur":1.0}},"route":["分母の変わり方","力の変わり方"]}},{"id":"t14s4e","scene":"t14s4e","kind":"u14s4pr","lab":{"q1":"+{q}_1","q1s":"+","q2":"-{q}_2","q2s":"-","r":"{r}","f1":"{F}","f1a":"in","f2":"{F}","f2a":"in"},"viewbox":"130 307 720 266","band":{"want":"電荷の符号の扱い","ans":"向きが分かれば絶対値で入れる。符号ごと入れたら、負は引力・正は斥力","full":"力の向きが分かっていれば、電荷は絶対値で式に入れ、出た値を力の大きさとする。符号ごと入れた時は、答えが負なら引力、正なら斥力を表す。"},"narr":{"start":{"co":1,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"①向きが分かる時\n②符号ごと入れる時\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"＋と－の電荷なので、引き合う力が働くと分かります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"f","emph":["Q1","Q2","F1","F2"]},{"text":"向きが分かっている時は、〖電荷を符号を付けずに式に入れます〗。出た値が力の大きさです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = 9 \\times 10^9 \\times \\dfrac{\\lvert q_1 \\rvert \\, \\lvert q_2 \\rvert}{r^2}"]]}],"emphPre":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"符号ごと入れることもできます。＋と－の積は負なので、$F$ は負になります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Q1","Q2","F1","F2"]},{"text":"〖$F$ が負の時は引力、正の時は斥力〗を表します。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]},{"text":"向きが分からない時は、符号ごと入れて、負か正かで引力か斥力かを決めます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["F1","F2"],"ans":true}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["向きが分かる時","符号ごと入れる時"]}},{"id":"t14s4x","scene":"t14s4x","kind":"u14s4pr","lab":{"q1":"+{q}_1=3 C","q1s":"+","q2":"-{q}_2=4 C","q2s":"-","r":"{r}=2 m","f1":"{F}","f1a":"in","f2":"{F}","f2a":"in"},"viewbox":"130 307 720 266","band":{"want":"$F$ と力の種類","known":"$q_1 = +3\\,\\mathrm{C},\\;\\; q_2 = -4\\,\\mathrm{C},\\;\\; r = 2\\,\\mathrm{m}$","ans":"$-27 \\times 10^9\\,\\mathrm{N}$・引力"},"narr":{"start":{"co":1,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、符号ごと入れた $F$ と、引力か斥力かです。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]},{"text":"①符号ごと入れる\n②負か正か\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$q_1 = +3$、$q_2 = -4$、$r = 2$ を、符号ごと式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q1","Q2","R","F1","F2"],"eq":[{"cont":false,"items":[["F = 9 \\times 10^9 \\times \\dfrac{q_1 q_2}{r^2}"],["= 9 \\times 10^9 \\times \\dfrac{3 \\times (-4)}{2^2}","= -27 \\times 10^9\\,\\mathrm{N}"]]}],"emphPre":["Q1","Q2","R","F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"〖$F$ が負なので、引力〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"f","emph":["F1","F2"]},{"text":"＋と－で引き合うことと合っています。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Q1","Q2","F1","F2"],"ans":true}]}],"groups":{"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["符号ごと入れる","負か正か"]}},{"id":"t14s5e","scene":"t14s5e","kind":"u14s5tri","lab":{"q0":"{q}_0","q0s":"+","qa":"{q}_a","qas":"+","qb":"{q}_b","qbs":"+","ra":"{r}_a","rb":"{r}_b","f1":"{F}_1","f1a":"out","f2":"{F}_2","f2a":"out","f":"{F}"},"viewbox":"-43 115 892 685","band":{"want":"電荷が3つあるときの力","ans":"2つの力を別々に求めて、平行四辺形で合成する","full":"力を求める電荷が、ほかの2つの電荷から受ける力を別々に求める。2つの力を平行四辺形で合成する。直角なら三平方の定理。$10^9$ は最後に付ける。"},"narr":{"start":{"co":1,"f1d":0,"f2d":0,"pgd":0,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"①分けて考える\n②合成する\n③三平方の定理\n④$10^9$ は最後\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$q_0$ に働く力を考えます。ほかの電荷は $q_a$ と $q_b$ の2つです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q0","Qa","Qb"]},{"text":"まず、〖$q_a$ だけから受ける力〗 $F_1$ を考えます。どちらも＋なので、$q_a$ から離れる向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f1","emph":["Q0","Qa","F1"]},{"text":"次に、$q_b$ だけから受ける力 $F_2$ を考えます。これも $q_b$ から離れる向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f2","emph":["Q0","Qb","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"2つの力の矢印の先から、平行な線を引きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"pg","emph":["F1","F2","Pg"]},{"text":"できた平行四辺形の〖対角線が、合成した力 $F$〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f","emph":["F","Pg"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$F_1$ と $F_2$ は直角なので、$F$ の大きさは〖三平方の定理〗で求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["F1","F2","F"],"eq":[{"cont":false,"items":[["F = \\sqrt{F_1^2 + F_2^2}"]]}],"emphPre":["F1","F2","F"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$F_1$ も $F_2$ も、数に $10^9$ を掛けた形です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":4,"emph":["F1","F2"]},{"text":"$10^9$ を外した数だけで三平方の定理を計算し、〖最後に $10^9$ を付ける〗と楽です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["F"],"ans":true}]}],"groups":{"Q0":["q0c","q0c:t","q0m","q0mt","q0t0","q0t1"],"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Ra":["rad","rad:h","rad:h2","rat0","rat1"],"Rb":["rbd","rbd:h","rbd:h2","rbt0","rbt1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"Pg":["pg1","pg2"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"f1":{"to":{"f1d":1},"dur":0.7},"f2":{"to":{"f2d":1},"dur":0.7},"pg":{"to":{"pgd":1},"dur":0.6},"f":{"to":{"fd":1},"dur":0.7}},"route":["分けて考える","合成する","三平方の定理","$10^9$ は最後"]}},{"id":"t14s5x","scene":"t14s5x","kind":"u14s5tri","lab":{"q0":"{q}_0=1 C","q0s":"+","qa":"{q}_a=4 C","qas":"+","qb":"{q}_b=12 C","qbs":"+","ra":"1 m","rb":"2 m","f1":["{F}_1","{F}_1=36×10⁹ N"],"f1a":"out","f2":["{F}_2","{F}_2=27×10⁹ N"],"f2a":"out","f":["{F}","{F}=45×10⁹ N"]},"viewbox":"-43 115 892 685","band":{"want":"$q_0$ に働く力の大きさ $F$","known":"$q_0 = 1\\,\\mathrm{C},\\;\\; q_a = 4\\,\\mathrm{C},\\;\\; q_b = 12\\,\\mathrm{C}$","ans":"$F = 45 \\times 10^9\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"f1d":0,"f2d":0,"pgd":0,"fd":0,"f1v":0,"f2v":0,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、$q_0$ に働く力の大きさ $F$ です。","at":{"強調":1.0},"after":[],"emph":["Q0","F"]},{"text":"①$F_1$\n②$F_2$\n③合成する\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q0","F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$q_a$ から受ける力 $F_1$ です。距離は 1 m です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"f1","emph":["Q0","Qa","Ra","F1"],"eq":[{"cont":false,"items":[["F_1 = 9 \\times 10^9 \\times \\dfrac{1 \\times 4}{1^2}","= 36 \\times 10^9\\,\\mathrm{N}"]]}],"emphPre":["Q0","Qa","Ra","F1"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$q_b$ から受ける力 $F_2$ です。距離は 2 m です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"f2","emph":["Q0","Qb","Rb","F2"],"eq":[{"cont":false,"items":[["F_2 = 9 \\times 10^9 \\times \\dfrac{1 \\times 12}{2^2}","= 27 \\times 10^9\\,\\mathrm{N}"]]}],"emphPre":["Q0","Qb","Rb","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$F_1$ と $F_2$ は直角です。$10^9$ を外した 36 と 27 で三平方の定理を使います。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"move":"f","emph":["F1","F2","F","Pg"],"eq":[{"cont":false,"items":[["\\sqrt{36^2 + 27^2} = \\sqrt{2025} = 45"]]}],"emphPre":["F1","F2","F","Pg"]},{"text":"最後に〖$10^9$ を付けます〗。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["F"],"eq":[{"cont":false,"items":[["F = 45 \\times 10^9\\,\\mathrm{N}"]]}],"ans":true,"emphPre":["F"]}]}],"groups":{"Q0":["q0c","q0c:t","q0m","q0mt","q0t0","q0t1"],"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Ra":["rad","rad:h","rad:h2","rat0","rat1"],"Rb":["rbd","rbd:h","rbd:h2","rbt0","rbt1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"Pg":["pg1","pg2"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"f1":{"to":{"f1d":1,"f1v":1},"dur":0.7},"f2":{"to":{"f2d":1,"f2v":1},"dur":0.7},"f":{"to":{"pgd":1,"fd":1,"fv":1},"dur":0.8}},"route":["$F_1$","$F_2$","合成する"]}}],"secs":[{"ex":{"text":"図のように、2つの負電荷を置いた。2つの電荷の間に働く力はどれか。","fig":{"kind":"u14s1pr","L":{"q1":"{q}_1","q1s":"-","q2":"{q}_2","q2s":"-"},"P":{}},"ch":[{"t":"引き合う力（引力）","v":"att","why":"引き合うのは、異なる符号どうし"},{"t":"退け合う力（斥力）","v":"rep","why":""},{"t":"力は働かない","v":"none","why":"点電荷どうしには、必ず力が働く"},{"t":"片方の電荷にだけ働く","v":"one","why":"力は、2つの電荷の両方に働く"}],"ans":1}},{"ex":{"text":"真空中で、$q_1 = 4\\,\\mathrm{C}$ と $q_2 = 3\\,\\mathrm{C}$ の点電荷を $2\\,\\mathrm{m}$ 離して置いた。2つの電荷の間に働く力の大きさは何 N か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。","fig":{"kind":"u14s2pr","L":{"q1":"{q}_1=4 C","q1s":"+","q2":"{q}_2=3 C","q2s":"+","r":"{r}=2 m"},"P":{}},"ch":[{"t":"$54 \\times 10^9\\,\\mathrm{N}$","v":"54","why":"距離を2乗していない"},{"t":"$3 \\times 10^9\\,\\mathrm{N}$","v":"3","why":"$9$ を掛けていない"},{"t":"$27 \\times 10^9\\,\\mathrm{N}$","v":"27","why":""},{"t":"$15.75 \\times 10^9\\,\\mathrm{N}$","v":"15.75","why":"電荷の積でなく和を使った"}],"ans":2}},{"ex":{"text":"真空中に置いた2つの点電荷の距離を、3倍にした。働く力の大きさは元の何倍になるか。","fig":{"kind":"u14s3pr","L":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}"},"P":{}},"ch":[{"t":"$\\dfrac{1}{3}$ 倍","v":"1/3","why":"距離を2乗していない"},{"t":"$\\dfrac{1}{9}$ 倍","v":"1/9","why":""},{"t":"$9$ 倍","v":"9","why":"力は距離の2乗に反比例する（遠いほど弱い）"},{"t":"$3$ 倍","v":"3","why":"力は距離の2乗に反比例する（遠いほど弱い）"}],"ans":1}},{"ex":{"text":"真空中で、$q_1 = +3\\,\\mathrm{C}$ と $q_2 = -4\\,\\mathrm{C}$ の点電荷を $2\\,\\mathrm{m}$ 離して置いた。クーロンの法則の式に符号ごと入れたときの $F$ と、力の種類の組はどれか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。","fig":{"kind":"u14s4pr","L":{"q1":"+{q}_1=3 C","q1s":"+","q2":"-{q}_2=4 C","q2s":"-","r":"{r}=2 m"},"P":{}},"ch":[{"t":"$-27 \\times 10^9\\,\\mathrm{N}$・引力","v":"-27a","why":""},{"t":"$-27 \\times 10^9\\,\\mathrm{N}$・斥力","v":"-27r","why":"負は引力を表す"},{"t":"$27 \\times 10^9\\,\\mathrm{N}$・引力","v":"27a","why":"符号ごと入れると、＋と－の積は負になる"},{"t":"$-54 \\times 10^9\\,\\mathrm{N}$・引力","v":"-54a","why":"距離を2乗していない"}],"ans":0}},{"ex":{"text":"真空中で、正の点電荷 $q_0 = 1\\,\\mathrm{C}$ の右 $1\\,\\mathrm{m}$ に $q_a = 4\\,\\mathrm{C}$、上 $2\\,\\mathrm{m}$ に $q_b = 12\\,\\mathrm{C}$ の正の点電荷を置いた。$q_0$ に働く力の大きさは何 N か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。","fig":{"kind":"u14s5tri","L":{"q0":"{q}_0=1 C","q0s":"+","qa":"{q}_a=4 C","qas":"+","qb":"{q}_b=12 C","qbs":"+","ra":"1 m","rb":"2 m"},"P":{}},"ch":[{"t":"$63 \\times 10^9\\,\\mathrm{N}$","v":"63","why":"直角の2つの力を、そのまま足した"},{"t":"$45 \\times 10^9\\,\\mathrm{N}$","v":"45","why":""},{"t":"$9 \\times 10^9\\,\\mathrm{N}$","v":"9","why":"直角の2つの力を、引いた"},{"t":"$2025 \\times 10^9\\,\\mathrm{N}$","v":"2025","why":"2乗の和の平方根をとっていない"}],"ans":1}}],"past":[]}};
});
