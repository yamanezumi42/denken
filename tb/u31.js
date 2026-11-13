/* 単元31「交流の直列回路」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(31, function(H){
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
// 字の箱（id の文字のうち見えている物を合わせた箱。見えている物が無い時は全部。測れない時＝隠れた図は字の数から見積もる）
// 2026-11-07 単元28：[前, 後] の両方を合わせると、まだ出ていない長い後の名前（1/400）の分まで場所をふさぎ、点の名前の置き場所が無くなった（28-1）
function tbFig_TBox(d, ids){
  var b = null, live = ids.filter(function(id){ var e = d.els[id]; return e && d.seen[id] && e.textContent; });
  var vis = live.filter(function(id){ return parseFloat(d.els[id].style.opacity) > 0.02; });
  (vis.length ? vis : live).forEach(function(id){
    var e = d.els[id], r = null;
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
  // 2026-11-07 単元30：ずらした波（30-5・30-6 の 90° の遅れ・進み）で、軸の先の左上・左下が波でふさがった → 波の高さの外（字の高さの 1.3・2.3 倍の離れ）も候補に
  lab(1, function(){ tbFig_PlaceL(d, R, "wax" + S, L, p, "ax", o, [[xe + 40, Yc, 1, 0, 12], [xe + 40, Yc, -1, 1, 10], [xe + 40, Yc, -1, -1, 10],
                                                                [xe + 40, Yc, -1, -1, -1.3], [xe + 40, Yc, -1, 1, -1.3], [xe + 40, Yc, -1, -1, -2.3], [xe + 40, Yc, -1, 1, -2.3]]); });
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
    lab(6, function(){ tbFig_PlaceL(d, R, "wlv" + k + S, L, p, "lv" + k, oo, [[X(lb), y, 1, 0, 12], [X(lb), y, 1, -1, 4], [X(lb), y, 1, 1, 4],
                                                                          [(X(la) + X(lb)) / 2, y, 0, 1, 8], [(X(la) + X(lb)) / 2, y, 0, -1, 8], [X(la), y, -1, 0, 12]]); });   // 線の右の端に場所が無い時は線の真ん中の下・上（28-2）
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
    var at = tbFig_Num(L["x" + k + "at"], +k * 0.25), x = X(at), y = w1y(at), sd = y > Yc + 1 ? -1 : 1, ox = o * pv(p, "x" + k + "d", 1);   // xNd＝0→1 で出る（28-1）
    tbFig_Poly(d, "wx" + k + S, [[x, Yc], [x, y]], ox, null, 2, true); tbFig_RLine(R, [[x, Yc], [x, y]], 2, ox);
    lab(4, function(){ tbFig_PlaceL(d, R, "wx" + k + S, L, pX, "x" + k, ox, [[x, Yc, 0, sd, 10], [x, Yc, 0, -sd, 10], [x, Yc, -1, sd, 6], [x, Yc, 1, sd, 6],
                                                                      [x, Yc, -1, -sd, 6], [x, Yc, 1, -sd, 6], [x, Yc, 0, sd, -1.3], [x, Yc, 0, -sd, -1.3],
                                                                      [x, Yc - A, 0, -1, 10], [x, Yc + A, 0, 1, 10]]); });   // 波が込み合う時（27-5）は山の上・谷の下
  });
  // 縦の軸の目盛り（名前は縦の軸の左が先。図の枠から出る時は軸の右の、点線の外側）
  [["1", 1], ["2", -1], ["3", null]].forEach(function(a){
    var k = a[0]; if (L["y" + k] === undefined || L["y" + k] === null) return;
    var h = a[1] === null ? tbFig_Num(L.y3at, 0.5) : a[1] * tbFig_Num(L.w1a, 1), y = Yc - A * h, fpk = a[1] === -1 ? 0.75 : 0.25, sd = y > Yc ? 1 : -1;
    tbFig_Poly(d, "wy" + k + S, [[x0, y], [X(fpk), y]], o, null, 2, true); tbFig_RLine(R, [[x0, y], [X(fpk), y]], 2, o);
    lab(3, function(){ tbFig_PlaceL(d, R, "wy" + k + S, L, p, "y" + k, o, [[x0, y, -1, 0, 12], [x0, y, -1, sd, 4], [x0 + 10, y, 1, sd, 6]]); });   // 右は縦の軸の矢じりをよける（28-3）
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
// ベクトル図を図の枠に収める（2026-11-07 単元29）：矢印・向きの線が、生成器の phasor の枠（Ox-200〜Ox+S+200・Oy-330〜Oy+330）から出た
// （29-1 の 180° の向きの線・29-2 の左向きの矢印・29-5 x の 60°・120° の矢印）。→ 枠に名前の分 m を残して、矢印の先・向きの線・軸・回る向きの弧が
// 入るよう、長さの倍率 k（1 まで）と始点 O の位置を決める。動きの途中で変わらないよう、最後の形の全部（角度の [前, 後]・a2f の向きの入れ替えの両方）から
function tbFig_PhFit(L, p, ks, lmax, Ox, Oy, SC){
  var R = Math.PI / 180, pts = [[0, 0]], tips = {}, guard = 0, m = 80;
  var angs = function(k){ var v = L["a" + k + "g"], a = (Array.isArray(v) ? v : [v]).map(function(x){ return tbFig_Num(x, 0); });
    if (k === "2" && p.a2f !== undefined) a = a.concat(a.map(function(g){ return g + 180; }));
    if (k === "3" && p.a2f !== undefined) a = a.concat(a.map(function(g){ return -g; }));
    return a; };
  while (Object.keys(tips).length < ks.length && guard++ < 10) ks.forEach(function(k){
    if (tips[k]) return;
    var org = L["a" + k + "o"] || "O", sts;
    if (org === "O" || org === "") sts = [[0, 0]]; else { var ok = String(org).replace(/^a/, ""); if (!tips[ok]) return; sts = tips[ok]; }
    var len = tbFig_Num(L["a" + k + "l"], 1) / lmax * SC, ox = tbFig_Num(L["a" + k + "x"], 0) * SC, oy = tbFig_Num(L["a" + k + "y"], 0) * SC, out = [];
    sts.forEach(function(s){ angs(k).forEach(function(g){
      var q = [s[0] + len * Math.cos(g * R), s[1] - len * Math.sin(g * R)]; out.push(q); pts.push([s[0] + ox, s[1] + oy], [q[0] + ox, q[1] + oy]); }); });
    tips[k] = out;
  });
  if (L.pg1 !== undefined && L.pg1 !== null) { var ab = String(L.pg1ab || "a1,a2").split(",").map(function(s){ return s.trim().replace(/^a/, ""); });
    (tips[ab[0]] || []).forEach(function(a){ (tips[ab[1]] || []).forEach(function(b){ pts.push([a[0] + b[0], a[1] + b[1]]); }); }); }
  if (L.ref) pts.push([SC * 0.95, 0]);
  if (L.dirs) pts.push([230, 0], [-230, 0], [0, -230], [0, 230]);
  if (L.cplx) pts.push([-120, 0], [SC + 60, 0], [0, 260], [0, -290]);
  if (L.rot) pts.push([150, -150], [150, 150]);
  var xs = pts.map(function(q){ return q[0]; }), ys = pts.map(function(q){ return q[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  var fx0 = Ox - 200 + m, fx1 = Ox + SC + 200 - m, fy0 = Oy - 330 + m, fy1 = Oy + 330 - m;
  var k = Math.min(1, (fx1 - fx0) / Math.max(1, x1 - x0), (fy1 - fy0) / Math.max(1, y1 - y0)), nx = Ox, ny = Oy;
  if (nx + k * x0 < fx0) nx = fx0 - k * x0; else if (nx + k * x1 > fx1) nx = fx1 - k * x1;
  if (ny + k * y0 < fy0) ny = fy0 - k * y0; else if (ny + k * y1 > fy1) ny = fy1 - k * y1;
  return {k: k, Ox: nx, Oy: ny};
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
  // 図の枠に収める（tbFig_PhFit）：長さの倍率 KR と始点 O。枠に入る図（単元27 まで）は KR＝1・O もそのまま
  var FT = tbFig_PhFit(L, p, ks, lmax, Ox, Oy, SC), KR = FT.k; Ox = FT.Ox; Oy = FT.Oy; SC = SC * KR;
  if (L.cplx) {
    var ax0 = Ox - 120 * KR, ax1 = Ox + SC + 60 * KR, ay0 = Oy + 260 * KR, ay1 = Oy - 290 * KR;
    tbFig_Arr(d, "pax" + S, ax0, Oy, ax1, Oy, o); tbFig_Arr(d, "pay" + S, Ox, ay0, Ox, ay1, o);
    tbFig_RArr(RM, ax0, Oy, ax1, Oy, o); tbFig_RArr(RM, Ox, ay0, Ox, ay1, o);
    put(1, function(){ tbFig_PlaceL(d, RM, "paxr" + S, L, p, "axr", o, [[ax1, Oy, -1, 1, 10], [ax1, Oy, 1, 0, 12], [ax1, Oy, -1, -1, 10]]); });
    put(1, function(){ tbFig_PlaceL(d, RM, "paxi" + S, L, p, "axi", o, [[Ox, ay1, 1, 0, 14], [Ox, ay1, -1, 0, 14], [Ox, ay1, 1, 1, 8]]); });
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
    // 2026-11-07 単元31：つないだ矢印（V_R の先から V_L）の先のまわりに名前を置くと、次の矢印のわきに出て、どの矢印の名前か分からなかった
    // （31-3 x で V_R の「24」が縦の V_L の横に出た）→ 先から別の矢印が出る矢印・つないだ矢印で先が別の矢印の先と同じ物は、矢印の真ん中の両わきが先
    var mids = [[xm, ym, nx, ny, 10], [xm, ym, -nx, -ny, 10]];
    put(3, function(){
      var busy = ks.some(function(j){
        if (j === k || !tips[j]) return false;
        if (String(L["a" + j + "o"] || "").replace(/^a/, "") === k) return true;
        var mine = String(L["a" + k + "o"] || "O"); if (mine === "O" || mine === "") return false;
        return Math.abs(tips[j][0] - tips[k][0]) < 3 && Math.abs(tips[j][1] - tips[k][1]) < 3;
      });
      tbFig_PlaceL(d, RM, "pa" + k + S, L2, p, "a" + k, oo, busy ? mids.concat(cands) : cands);
    });
  });
  d.dot("po" + S, Ox, Oy, {o: o}); tbFig_RDot(RM, Ox, Oy, 5, o);
  if (L.o1 !== undefined) put(2, function(){ tbFig_PlaceL(d, RM, "po1" + S, L, p, "o1", o, [[Ox, Oy, -1, 1, 8], [Ox, Oy, -1, -1, 8], [Ox, Oy, 1, 1, 8], [Ox, Oy, -1, 0, 12]]); });
  if (L.dg1 !== undefined && L.dg1 !== null && tips["1"] && tips["2"]) { var odg = o * pv(p, "dg1d", 1); tbFig_Poly(d, "pdg1" + S, [tips["1"], tips["2"]], odg, "#e67700", 3, true); tbFig_RLine(RM, [tips["1"], tips["2"]], 3, odg); }
  if (L.dirs) [["d0", 0], ["d90", 90], ["d180", 180], ["dm90", -90]].forEach(function(a){
    var od = o * pv(p, "dirsd", 1), g = a[1] * R, x = Ox + 230 * KR * Math.cos(g), y = Oy - 230 * KR * Math.sin(g);
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
    var f = tbFig_Num(L["g" + k + "f"], 0), t = tbFig_Num(L["g" + k + "t"], 0), rr = (80 + j * 26) * KR, pts = [], q, og = o * pv(p, "g" + k + "d", 1);
    if (k === "1" && flip2) t = -t;
    for (q = 0; q <= 24; q++) { var a = (f + (t - f) * q / 24) * R; pts.push([Ox + rr * Math.cos(a), Oy - rr * Math.sin(a)]); }
    tbFig_Poly(d, "pg" + k + S, pts.slice(0, -2), og, null, 2); tbFig_RLine(RM, pts.slice(0, -2), 2, og);
    tbFig_Arr(d, "pg" + k + "a" + S, pts[22][0], pts[22][1], pts[24][0], pts[24][1], og); tbFig_RArr(RM, pts[22][0], pts[22][1], pts[24][0], pts[24][1], og);
    // 名前の候補：弧の真ん中の外側（弧から離れる順）→ 弧の内側
    var m = (f + t) / 2 * R, cm = Math.cos(m), sm = -Math.sin(m), cands = [];
    [rr, rr + 40, rr + 80].forEach(function(r2){ cands = cands.concat(tbFig_Around(Ox + r2 * cm, Oy + r2 * sm, cm, sm, 8).slice(0, 3)); });
    cands = cands.concat(tbFig_Around(Ox + rr * cm, Oy + rr * sm, -cm, -sm, 8).slice(0, 3));
    // 弧の真ん中の向きに矢印がある時（29-5 x の 60°）は、弧の上の真ん中からずらした所
    [0.3, 0.7, 0.2, 0.8].forEach(function(fr){ var a = (f + (t - f) * fr) * R, ca = Math.cos(a), sa = -Math.sin(a);
      [rr, rr + 40].forEach(function(r2){ cands = cands.concat(tbFig_Around(Ox + r2 * ca, Oy + r2 * sa, ca, sa, 8).slice(0, 3)); }); });
    put(5, function(){ tbFig_PlaceL(d, RM, "pg" + k + S, L, p, "g" + k, og, cands); });
  });
  // 回る向き
  if (L.rot) {
    var orr = o * pv(p, "rotd", 1), r0 = 150 * KR, mk = function(id, a0, a1){ var pts = [], q; for (q = 0; q <= 20; q++) { var a = (a0 + (a1 - a0) * q / 20) * R; pts.push([Ox + r0 * Math.cos(a), Oy - r0 * Math.sin(a)]); }
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
// 2026-11-07 単元30：前は名前を決まった場所（点の右上・線の右の端）に描いたので、交わる所の高さの名前が線にかかり（比例の線は右上へ上る）、
// 2つの線が同じ点を通る時は名前どうしも重なった（30-3）→ 波形と同じく、線と点を先に描いて障害物にし、名前は最後に候補の場所へ置く（tbFig_Place）。
function tbFig_Xg(d, it, L, p, o){
  if (it.df) L = Object.assign({}, it.df, L);
  var S = it.sfx || "", X0 = it.X0, W = it.W, Y0 = it.Y0, H = it.H, R = tbFig_Room(d), labs = [];
  var lab = function(pr, f){ labs.push([pr, labs.length, f]); };   // 名前は線を全部描いてから、優先の順（pr の小さい順）に置く
  var xe = X0 + W + 40, ye = Y0 - H - 30;
  tbFig_Arr(d, "xax" + S, X0, Y0, xe, Y0, o); tbFig_Arr(d, "xay" + S, X0, Y0, X0, ye, o);
  tbFig_RArr(R, X0, Y0, xe, Y0, o); tbFig_RArr(R, X0, Y0, X0, ye, o);
  lab(1, function(){ tbFig_PlaceL(d, R, "xax" + S, L, p, "ax", o, [[xe, Y0, -1, 1, 8], [xe, Y0, 1, 0, 12], [xe, Y0, -1, -1, 8]]); });
  lab(1, function(){ tbFig_PlaceL(d, R, "xay" + S, L, p, "ay", o, [[X0, ye + 10, -1, 0, 12], [X0, ye, 0, -1, 6], [X0, ye + 10, 1, 0, 14]]); });
  lab(2, function(){ tbFig_Place(d, R, ["xo" + S], function(x, y){ d.text("xo" + S, x, y, "0", {o: o}); },
                                    [[X0, Y0, -1, 1, 6], [X0, Y0, 0, 1, 8], [X0, Y0, -1, 0, 8]], o); });
  var ats = {"1": tbFig_Num(L.x1at, 0.35), "2": tbFig_Num(L.x2at, 0.7)}, cols = ["", "#c92a2a", "#1971c2"];
  var hy = function(k, f){ var sh = tbFig_Pick(L, p, "c" + k + "s") || "lin", a = tbFig_Num(L["c" + k + "a"], 0.5), x1 = ats["1"];
    if (sh === "inv") return Math.min(1.05, a * x1 / Math.max(f, 0.02)); if (sh === "flat") return a; return a * f / x1; };
  var top = {"1": 0, "2": 0};
  ["1", "2", "3"].forEach(function(k, i){
    if (L["c" + k] === undefined || L["c" + k] === null) return;
    // 反比例の線は、高さが上の端（1.05）に届く所から引く（前は 0.12 からで、上の端で横に平らな所ができた。30-3）
    var pts = [], q, dd = pv(p, "c" + k + "d", 1), sh = tbFig_Pick(L, p, "c" + k + "s") || "lin",
        f0 = sh === "inv" ? Math.max(0.12, tbFig_Num(L["c" + k + "a"], 0.5) * ats["1"] / 1.05) : 0;
    for (q = 0; q <= 60 * dd; q++) { var f = f0 + (1 - f0) * q / 60; pts.push([X0 + f * W, Y0 - Math.min(1.05, hy(k, f)) * H * 0.8]); }
    if (pts.length < 2) pts = [[X0, Y0], [X0, Y0]];
    var oc = o * (dd > 0.01 ? 1 : 0), ol = o * (dd > 0.5 ? 1 : 0);
    tbFig_Poly(d, "xc" + k + S, pts, oc, cols[i], 4); tbFig_RLine(R, pts, 4, oc);
    var e = pts[pts.length - 1];
    lab(5, function(){ tbFig_PlaceL(d, R, "xc" + k + S, L, p, "c" + k, ol, [[e[0], e[1], 1, 0, 12], [e[0], e[1], 1, -1, 6], [e[0], e[1], 1, 1, 6],
                                                                       [e[0], e[1], 0, -1, 10], [e[0], e[1], 0, 1, 10], [e[0], e[1], -1, -1, 8], [e[0], e[1], -1, 1, 8]]); });
    ["1", "2"].forEach(function(j){ top[j] = Math.max(top[j], Math.min(1.05, hy(k, ats[j]))); });
  });
  ["1", "2"].forEach(function(j){
    if (L["x" + j] === undefined || L["x" + j] === null) return;
    var x = X0 + ats[j] * W, ox = o * pv(p, "x" + j + "d", 1);
    tbFig_Poly(d, "xx" + j + S, [[x, Y0], [x, Y0 - top[j] * H * 0.8]], ox, null, 2, true); tbFig_RLine(R, [[x, Y0], [x, Y0 - top[j] * H * 0.8]], 2, ox);
    lab(3, function(){ tbFig_PlaceL(d, R, "xx" + j + S, L, p, "x" + j, ox, [[x, Y0, 0, 1, 10], [x, Y0, -1, 1, 4], [x, Y0, 1, 1, 4], [x, Y0, 0, 1, -1.3]]); });
    ["1", "2", "3"].forEach(function(k){
      if (L["c" + k] === undefined || L["c" + k] === null) return;
      // 黒丸と高さの名前は、その線が引かれてから出す（前は反比例の線を引く前から X_C の名前が出ていた。30-3）
      var y = Y0 - Math.min(1.05, hy(k, ats[j])) * H * 0.8, oh = ox * pv(p, "hd", 1) * (pv(p, "c" + k + "d", 1) > 0.5 ? 1 : 0);
      if (L["h" + k + j] === undefined) return;
      d.dot("xd" + k + j + S, x, y, {o: oh}); tbFig_RDot(R, x, y, 6, oh);
      // 交わる所の高さの名前：線から離れる側が先（比例の線＝右下・左上、反比例・変わらない線＝右上・左下）→ まわり8方向 → 遠い輪
      var sh = tbFig_Pick(L, p, "c" + k + "s") || "lin", ux = 1, uy = sh === "lin" ? 1 : -1;
      lab(6, function(){ tbFig_PlaceL(d, R, "xh" + k + j + S, L, p, "h" + k + j, oh,
                                      [[x, y, ux, uy, 8], [x, y, -ux, -uy, 8]].concat(tbFig_Around(x, y, ux, uy, [8, 22]))); });
    });
  });
  // 名前を置く（優先の順：軸 → 原点 → 横の目盛り → 線の名前 → 交わる所の高さ）
  labs.sort(function(P, Q){ return P[0] - Q[0] || P[1] - Q[1]; }).forEach(function(q){ q[2](); });
}
// ---- 31-1 インピーダンス の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S1K = {
  zt: {"vars":[],"items":[{"t":"w","id":"u31s1ztL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s1ztRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s1ztw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u31s1ztw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u31s1ztw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,599.9,null],"f":"ac"},{"t":"r","k":"r","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,310.17,null]},{"t":"ind","k":"l","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,409.83,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[331,704],[1131,704],[1131,1364],[331,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":531,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","l","L0:n1","L0:N",0,[]]]}
};
function tbU31s1zt(d, p, L){ tbFig_Draw(d, p, L, U31S1K.zt); }
// ---- 31-2 交流のオームの法則 の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S2K = {
  zt: {"vars":[],"items":[{"t":"w","id":"u31s2ztL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s2ztRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s2ztw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u31s2ztw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u31s2ztw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null],"f":"ac"},{"t":"r","k":"r","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,310.14,null]},{"t":"ind","k":"l","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,409.86,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[246.5,704],[1046.5,704],[1046.5,1364],[246.5,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":446.5,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","l","L0:n1","L0:N",0,[]]]}
};
function tbU31s2zt(d, p, L){ tbFig_Draw(d, p, L, U31S2K.zt); }
// ---- 31-3 電流を基準にした図 の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S3K = {
  vt: {"vars":[],"items":[{"t":"w","id":"u31s3vtL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s3vtRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s3vtw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u31s3vtw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u31s3vtw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null],"f":"ac"},{"t":"r","k":"r","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,307.66,null]},{"t":"v","k":"vr","x":638.67,"y":360,"dir":"h","side":1,"hi":-1,"vis":[],"elem":"r","lab":[638.67,484.37,null]},{"t":"ind","k":"l","x":884.33,"y":360,"dir":"h","vis":[],"lab":[876.33,412.34,null],"f":"ind","cd":1},{"t":"v","k":"vl","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"l","lab":[884.33,235.63,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[240,704],[1040,704],[1040,1364],[240,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":440,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src","vl","vr"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","l","L0:n1","L0:N",0,[]]]}
};
function tbU31s3vt(d, p, L){ tbFig_Draw(d, p, L, U31S3K.vt); }
// ---- 31-4 電圧を基準にした計算 の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S4K = {
  vi: {"vars":[],"items":[{"t":"w","id":"u31s4viL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s4viRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s4viw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u31s4viw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u31s4viw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,605.9,null],"f":"ac"},{"t":"r","k":"r","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,310.17,null]},{"t":"ind","k":"l","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,310.17,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[331.5,704],[1131.5,704],[1131.5,1364],[331.5,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":531.5,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","l","L0:n1","L0:N",0,[]]]}
};
function tbU31s4vi(d, p, L){ tbFig_Draw(d, p, L, U31S4K.vi); }
// ---- 31-5 RC 直列 の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S5K = {
  zt: {"vars":[],"items":[{"t":"w","id":"u31s5ztL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s5ztRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s5ztw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u31s5ztw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u31s5ztw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null],"f":"ac"},{"t":"r","k":"r","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,310.11,null]},{"t":"cap","k":"c","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,415.89,null],"fh":1,"f":"cap","F":61.9},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[246,704],[1046,704],[1046,1364],[246,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":446,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","c","L0:n1","L0:N",1,[]]]}
};
function tbU31s5zt(d, p, L){ tbFig_Draw(d, p, L, U31S5K.zt); }
// ---- 31-6 RLC 直列 の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S6K = {
  zt: {"vars":[],"items":[{"t":"w","id":"u31s6ztL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s6ztRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s6ztw1","pts":[[478,360],[557.25,360]],"vis":[],"dash":0},{"t":"w","id":"u31s6ztw2","pts":[[617.25,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u31s6ztw3","pts":[[791.5,360],[905.75,360]],"vis":[],"dash":0},{"t":"w","id":"u31s6ztw4","pts":[[965.75,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,605.9,null],"f":"ac"},{"t":"r","k":"r","x":587.25,"y":360,"dir":"h","vis":[],"lab":[587.25,309.95,null]},{"t":"ind","k":"l","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,410.05,null],"f":"ind","cd":1},{"t":"cap","k":"c","x":935.75,"y":360,"dir":"h","vis":[],"lab":[935.75,303.95,null],"fh":1,"f":"cap","F":62.2},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[339.5,704],[1139.5,704],[1139.5,1364],[339.5,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":539.5,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","l","L0:n1","L0:n2",0,[]],["R","c","L0:n2","L0:N",1,[]]]}
};
function tbU31s6zt(d, p, L){ tbFig_Draw(d, p, L, U31S6K.zt); }
// ---- 31-7 答えが2つ の図（※ textbook/gen/make_section.py が textbook/gen/data/u31_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U31S7K = {
  zt: {"vars":[],"items":[{"t":"w","id":"u31s7ztL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u31s7ztRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u31s7ztw1","pts":[[478,360],[557.25,360]],"vis":[],"dash":0},{"t":"w","id":"u31s7ztw2","pts":[[617.25,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u31s7ztw3","pts":[[791.5,360],[905.75,360]],"vis":[],"dash":0},{"t":"w","id":"u31s7ztw4","pts":[[965.75,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null],"f":"ac"},{"t":"r","k":"r","x":587.25,"y":360,"dir":"h","vis":[],"lab":[587.25,309.92,null]},{"t":"ind","k":"l","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,410.08,null],"f":"ind","cd":1},{"t":"cap","k":"c","x":935.75,"y":360,"dir":"h","vis":[],"lab":[935.75,303.92,null],"fh":1,"f":"cap","F":62.2},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ln","id":"frmx1","pts":[[264.5,704],[1064.5,704],[1064.5,1364],[264.5,1364]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":464.5,"Oy":1034,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:n1",1,[]],["R","l","L0:n1","L0:n2",0,[]],["R","c","L0:n2","L0:N",1,[]]]}
};
function tbU31s7zt(d, p, L){ tbFig_Draw(d, p, L, U31S7K.zt); }
var KINDS = {u31s1zt: tbU31s1zt, u31s2zt: tbU31s2zt, u31s3vt: tbU31s3vt, u31s4vi: tbU31s4vi, u31s5zt: tbU31s5zt, u31s6zt: tbU31s6zt, u31s7zt: tbU31s7zt};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 31-1 の図は電流が流れないので載せない,
  // 31-2 の図は電流が流れないので載せない,
  // 31-3 の図は電流が流れないので載せない,
  // 31-4 の図は電流が流れないので載せない,
  // 31-5 の図は電流が流れないので載せない,
  // 31-6 の図は電流が流れないので載せない,
  // 31-7 の図は電流が流れないので載せない
};

// 31-1 インピーダンス の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s1_par(a, b){ return a * b / (a + b); }
function tbU31s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s1_Qz(r){
  var gcd = tbU31s1_gcd, ratio = tbU31s1_ratio, par = tbU31s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var c = (Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9)) continue;
    var ok = (c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s1_three(ok, [{x: (a + b), why: "数字のまま足した。ベクトルで足す"}, {x: (Math.abs(a - b)), why: "引いた。直角三角形の斜めの辺を出す"}, {x: (a * a + b * b), why: "2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u31s1z", text: "図のように、$" + fmt(a) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコイルを直列につないだ。回路のインピーダンスの大きさは何 Ω か。", fig: {kind: "u31s1zt", L: tbU31s1_fig({}, [["src", "{V}"], ["r", "{R}=" + qf(a, "O")], ["l", "{X}_L=" + qf(b, "O")], ["i", "{I}"], ["a1", fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a2", fmt(b)], ["a2o", "a1"], ["a2l", fmt(b)], ["a2g", 90], ["a3", "{Z}"], ["a3l", fmt(c)], ["a3g", fmt(Math.atan2(b, a) * 180 / Math.PI)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{Z} = " + fmt(a) + " + j" + fmt(b) + "$", "$Z = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + qv(ok, "O") + "$"], chk: {form: "u31s1z", p: {a: a, b: b}}};
  }
  throw new Error("u31s1z：条件に合う数字が見つからない");
}
function tbU31s1_Qx(r){
  var gcd = tbU31s1_gcd, ratio = tbU31s1_ratio, par = tbU31s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var c = (Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9)) continue;
    var ok = (b);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s1_three(ok, [{x: (c - a), why: "数字のまま引いた。直角三角形の辺を三平方の定理で出す"}, {x: (c + a), why: "足した"}, {x: (c * c - a * a), why: "2 乗して引いたまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u31s1x", text: "$" + fmt(a) + "\\,\\Omega$ の抵抗とコイルを直列につないだ回路のインピーダンスの大きさは $" + fmt(c) + "\\,\\Omega$ であった。コイルの誘導性リアクタンスは何 Ω か。", fig: {kind: "u31s1zt", L: tbU31s1_fig({}, [["src", "{V}"], ["r", "{R}=" + qf(a, "O")], ["l", "{X}_L"], ["i", "{I}"], ["a1", fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a2", "{X}_L"], ["a2o", "a1"], ["a2l", fmt(b)], ["a2g", 90], ["a3", fmt(c)], ["a3l", fmt(c)], ["a3g", fmt(Math.atan2(b, a) * 180 / Math.PI)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z^2 = R^2 + X_L^2$ より $X_L = \\sqrt{Z^2 - R^2}$", "$X_L = \\sqrt{" + fmt(c) + "^2 - " + fmt(a) + "^2} = " + qv(ok, "O") + "$"], chk: {form: "u31s1x", p: {a: a, b: b}}};
  }
  throw new Error("u31s1x：条件に合う数字が見つからない");
}
function tbU31s1_Qvec(r){
  var gcd = tbU31s1_gcd, ratio = tbU31s1_ratio, par = tbU31s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var b = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var ab = (a + b);
    if (!(a != b)) continue;
    var _c = choices(r, [{t: "$\\dot{Z} = " + fmt(a) + " + j" + fmt(b) + "$", v: fmt(a) + "," + fmt(b)}, {t: "$\\dot{Z} = " + fmt(b) + " + j" + fmt(a) + "$", v: fmt(b) + "," + fmt(a), why: "抵抗は j の付かない右向き、コイルは $jX_L$"}, {t: "$\\dot{Z} = " + fmt(a) + " - j" + fmt(b) + "$", v: fmt(a) + ",-" + fmt(b), why: "コイルは $+j$（上向き）"}, {t: "$\\dot{Z} = " + fmt(ab) + "$", v: fmt(ab) + ",0", why: "数字のまま足した。コイルには j を付ける"}]);
    return {form: "u31s1vec", text: "$" + fmt(a) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコイルを直列につないだ。インピーダンスのベクトル $\\dot{Z}$［Ω］はどれか。", fig: {kind: "u31s1zt", L: tbU31s1_fig({}, [["src", "{V}"], ["r", "{R}=" + qf(a, "O")], ["l", "{X}_L=" + qf(b, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R$ は右向き、コイルは $jX_L$（上向き）。ベクトルで足す", "$\\dot{Z} = " + fmt(a) + " + j" + fmt(b) + "$"], chk: {form: "u31s1vec", p: {a: a, b: b}}};
  }
  throw new Error("u31s1vec：条件に合う数字が見つからない");
}
function tbU31s1_Qword(r){
  var gcd = tbU31s1_gcd, ratio = tbU31s1_ratio, par = tbU31s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "インピーダンス", v: "own"}, {t: "誘導性リアクタンス", v: "xl", why: "誘導性リアクタンスはコイルだけの流しにくさ"}, {t: "容量性リアクタンス", v: "xc", why: "容量性リアクタンスはコンデンサだけの流しにくさ"}, {t: "インダクタンス", v: "ind", why: "インダクタンスはコイルの値［H］"}]);
    return {form: "u31s1word", text: "回路全体の、交流の電流の流しにくさを何というか。", fig: {kind: "u31s1zt", L: tbU31s1_fig({}, [["src", "{V}"], ["r", "{R}"], ["l", "{X}_L"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["回路全体の流しにくさ＝インピーダンス $Z$［Ω］", "インピーダンス"], chk: {form: "u31s1word", p: {}}};
  }
  throw new Error("u31s1word：条件に合う数字が見つからない");
}
// 31-2 交流のオームの法則 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s2_par(a, b){ return a * b / (a + b); }
function tbU31s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s2_Qi(r){
  var gcd = tbU31s2_gcd, ratio = tbU31s2_ratio, par = tbU31s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var n = pick(r, [1,2,3,4,5,6,8,10]);
    var c = (Math.sqrt(a * a + b * b));
    var V = (n * Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9 && V <= 300)) continue;
    var ok = (V / c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s2_three(ok, [{x: (V / (a + b)), why: "数字のまま足した。ベクトルで足す"}, {x: (V / a), why: "抵抗だけで割った"}, {x: (c / V), why: "割る順が逆"}, {x: (V * c), why: "割るところを掛けた"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u31s2i", text: "図のように、$" + fmt(a) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコイルを直列につなぎ、実効値 $" + fmt(V) + "\\,\\mathrm{V}$ の交流電源につないだ。流れる電流の大きさは何 A か。", fig: {kind: "u31s2zt", L: tbU31s2_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r", "{R}=" + qf(a, "O")], ["l", "{X}_L=" + qf(b, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + fmt(c) + "\\,\\Omega$", "$I = \\dfrac{V}{Z} = \\dfrac{" + fmt(V) + "}{" + fmt(c) + "} = " + qv(ok, "A") + "$"], chk: {form: "u31s2i", p: {a: a, b: b, n: n}}};
  }
  throw new Error("u31s2i：条件に合う数字が見つからない");
}
function tbU31s2_Qv(r){
  var gcd = tbU31s2_gcd, ratio = tbU31s2_ratio, par = tbU31s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var n = pick(r, [1,2,3,4,5,6,8,10]);
    var c = (Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9 && n * c <= 400)) continue;
    var ok = (n * c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s2_three(ok, [{x: (n * (a + b)), why: "数字のまま足した。ベクトルで足す"}, {x: (n * a), why: "抵抗だけを掛けた"}, {x: (c / n), why: "掛けるところを割った"}, {x: (n * (a * a + b * b)), why: "2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u31s2v", text: "図のように、$" + fmt(a) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコイルを直列につないだ回路に、$" + fmt(n) + "\\,\\mathrm{A}$ の電流が流れている。電源電圧の大きさは何 V か。", fig: {kind: "u31s2zt", L: tbU31s2_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}"}, [["r", "{R}=" + qf(a, "O")], ["l", "{X}_L=" + qf(b, "O")], ["i", "{I}=" + qf(n, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + fmt(c) + "\\,\\Omega$", "$V = IZ = " + fmt(n) + " \\times " + fmt(c) + " = " + qv(ok, "V") + "$"], chk: {form: "u31s2v", p: {a: a, b: b, n: n}}};
  }
  throw new Error("u31s2v：条件に合う数字が見つからない");
}
function tbU31s2_Qform(r){
  var gcd = tbU31s2_gcd, ratio = tbU31s2_ratio, par = tbU31s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dot{I} = \\dfrac{\\dot{V}}{\\dot{Z}}$", v: "own"}, {t: "$\\dot{I} = \\dfrac{\\dot{V}}{R + X_L}$", v: "nj", why: "コイルには j を付けて、ベクトルで足す"}, {t: "$\\dot{I} = \\dfrac{\\dot{Z}}{\\dot{V}}$", v: "inv", why: "割る順が逆"}, {t: "$\\dot{I} = \\dot{V} \\dot{Z}$", v: "mul", why: "電圧を割る"}]);
    return {form: "u31s2form", text: "交流回路で、電流のベクトル $\\dot{I}$ を求める式はどれか。", fig: {kind: "u31s2zt", L: tbU31s2_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}"}, [["src", "{V}"], ["r", "{R}"], ["l", "{X}_L"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["ベクトルを求める時は、ベクトルの式", "$\\dot{I} = \\dfrac{\\dot{V}}{\\dot{Z}}$"], chk: {form: "u31s2form", p: {}}};
  }
  throw new Error("u31s2form：条件に合う数字が見つからない");
}
// 31-3 電流を基準にした図 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s3_par(a, b){ return a * b / (a + b); }
function tbU31s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s3_Qv(r){
  var gcd = tbU31s3_gcd, ratio = tbU31s3_ratio, par = tbU31s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40,45,60,80]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40,45,60,80]);
    var c = (Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9 && c <= 200)) continue;
    var ok = (c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s3_three(ok, [{x: (a + b), why: "数字のまま足した。向きが違うのでベクトルで足す"}, {x: (Math.abs(a - b)), why: "引いた"}, {x: (a * a + b * b), why: "2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u31s3v", text: "抵抗とコイルを直列につないだ交流回路で、抵抗の電圧を測ると $" + fmt(a) + "\\,\\mathrm{V}$、コイルの電圧を測ると $" + fmt(b) + "\\,\\mathrm{V}$ であった。電源電圧の大きさは何 V か。", fig: {kind: "u31s3vt", L: tbU31s3_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","vr":"{V}_R","vl":"{V}_L"}, [["vr", "{V}_R=" + qf(a, "V")], ["vl", "{V}_L=" + qf(b, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_R$ は右向き、$V_L$ は上向き。$\\dot{V} = " + fmt(a) + " + j" + fmt(b) + "$", "$V = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + qv(ok, "V") + "$"], chk: {form: "u31s3v", p: {a: a, b: b}}};
  }
  throw new Error("u31s3v：条件に合う数字が見つからない");
}
function tbU31s3_Qvl(r){
  var gcd = tbU31s3_gcd, ratio = tbU31s3_ratio, par = tbU31s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40,45,60,80]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40,45,60,80]);
    var c = (Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9 && c <= 200)) continue;
    var ok = (b);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s3_three(ok, [{x: (c - a), why: "数字のまま引いた。三平方の定理で出す"}, {x: (c + a), why: "足した"}, {x: (c * c - a * a), why: "2 乗して引いたまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u31s3vl", text: "抵抗とコイルを直列につないだ交流回路で、電源電圧の大きさは $" + fmt(c) + "\\,\\mathrm{V}$、抵抗の電圧は $" + fmt(a) + "\\,\\mathrm{V}$ であった。コイルの電圧は何 V か。", fig: {kind: "u31s3vt", L: tbU31s3_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","vr":"{V}_R","vl":"{V}_L"}, [["src", "{V}=" + qf(c, "V")], ["vr", "{V}_R=" + qf(a, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V^2 = V_R^2 + V_L^2$ より $V_L = \\sqrt{V^2 - V_R^2}$", "$V_L = \\sqrt{" + fmt(c) + "^2 - " + fmt(a) + "^2} = " + qv(ok, "V") + "$"], chk: {form: "u31s3vl", p: {a: a, b: b}}};
  }
  throw new Error("u31s3vl：条件に合う数字が見つからない");
}
function tbU31s3_Qvec(r){
  var gcd = tbU31s3_gcd, ratio = tbU31s3_ratio, par = tbU31s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [1,2,3,4,5,10]);
    var R = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var X = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var vr = (I * R);
    var vx = (I * X);
    var vs = (I * (R + X));
    if (!(R != X)) continue;
    var _c = choices(r, [{t: "$\\dot{V} = " + fmt(vr) + " + j" + fmt(vx) + "$", v: fmt(vr) + "," + fmt(vx)}, {t: "$\\dot{V} = " + fmt(vs) + "$", v: fmt(vs) + ",0", why: "数字のまま足した。コイルの電圧は $jIX_L$ で上向き"}, {t: "$\\dot{V} = " + fmt(vr) + " - j" + fmt(vx) + "$", v: fmt(vr) + ",-" + fmt(vx), why: "コイルは $+j$（上向き）"}, {t: "$\\dot{V} = " + fmt(vx) + " + j" + fmt(vr) + "$", v: fmt(vx) + "," + fmt(vr), why: "抵抗の電圧が j の付かない右向き、コイルの電圧が j の付く上向き"}]);
    return {form: "u31s3vec", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(X) + "\\,\\Omega$ のコイルを直列につないだ回路に、電流 $\\dot{I} = " + fmt(I) + "\\,\\mathrm{A}$（基準）が流れている。電源電圧のベクトル $\\dot{V}$［V］はどれか。", fig: {kind: "u31s3vt", L: tbU31s3_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","vr":"{V}_R","vl":"{V}_L"}, [["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(X, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{V} = IR + jIX_L = " + fmt(I) + " \\times " + fmt(R) + " + j" + fmt(I) + " \\times " + fmt(X) + "$", "$\\dot{V} = " + fmt(vr) + " + j" + fmt(vx) + "\\,\\mathrm{V}$"], chk: {form: "u31s3vec", p: {I: I, R: R, X: X}}};
  }
  throw new Error("u31s3vec：条件に合う数字が見つからない");
}
function tbU31s3_Qwhy(r){
  var gcd = tbU31s3_gcd, ratio = tbU31s3_ratio, par = tbU31s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$V_R$ は右向き、$V_L$ は上向きで、向きが違うから", v: "own"}, {t: "流れる電流が違うから", v: "i", why: "直列なので、どちらにも同じ電流が流れる"}, {t: "$V_L$ はいつも 0 だから", v: "z", why: "コイルの電圧は $IX_L$"}, {t: "抵抗の電圧は実効値ではないから", v: "e", why: "どちらも実効値。向きが違う"}]);
    return {form: "u31s3why", text: "直列回路の抵抗の電圧 $V_R$ とコイルの電圧 $V_L$ を、数字のまま足して電源電圧としてはいけないのはなぜか。", fig: {kind: "u31s3vt", L: tbU31s3_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","vr":"{V}_R","vl":"{V}_L"}, [["src", "{V}"], ["r", "{R}"], ["l", "{X}_L"], ["i", "{I}"], ["vr", "{V}_R"], ["vl", "{V}_L"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流を基準にすると、$IR$ は右向き、$jIX_L$ は上向き", "向きが違うので、ベクトルで足す"], chk: {form: "u31s3why", p: {}}};
  }
  throw new Error("u31s3why：条件に合う数字が見つからない");
}
// 31-4 電圧を基準にした計算 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s4_par(a, b){ return a * b / (a + b); }
function tbU31s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s4_Qvec(r){
  var gcd = tbU31s4_gcd, ratio = tbU31s4_ratio, par = tbU31s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [1,2,3,4,5,6,8,12]);
    var X = pick(r, [1,2,3,4,5,6,8,12]);
    var n = pick(r, [1,2,3,4,5]);
    var V = (n * (R * R + X * X));
    var p = (n * R);
    var q = (n * X);
    var pr = (n * (R * R + X * X) / R);
    var qr = (n * (R * R + X * X) / X);
    if (!(R != X && V <= 600 && nice(pr) && nice(qr))) continue;
    var _c = choices(r, [{t: "$\\dot{I} = " + fmt(p) + " - j" + fmt(q) + "$", v: fmt(p) + ",-" + fmt(q)}, {t: "$\\dot{I} = " + fmt(p) + " + j" + fmt(q) + "$", v: fmt(p) + "," + fmt(q), why: "分母と分子に $R - jX_L$ を掛けるので、虚数の成分はマイナス"}, {t: "$\\dot{I} = " + fmt(pr) + " - j" + fmt(qr) + "$", v: fmt(pr) + ",-" + fmt(qr), why: "抵抗とコイルで別々に割った。直列なので $\\dot{Z}$ で割る"}, {t: "$\\dot{I} = " + fmt(q) + " - j" + fmt(p) + "$", v: fmt(q) + ",-" + fmt(p), why: "実数と虚数を取り違えた"}]);
    return {form: "u31s4vec", text: "図のように、$" + fmt(R) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(X) + "\\,\\Omega$ のコイルを直列につなぎ、$\\dot{V} = " + fmt(V) + "\\,\\mathrm{V}$ の交流電源につないだ。電流のベクトル $\\dot{I}$［A］はどれか。", fig: {kind: "u31s4vi", L: tbU31s4_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(X, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{I} = \\dfrac{" + fmt(V) + "}{" + fmt(R) + " + j" + fmt(X) + "} = \\dfrac{" + fmt(V) + "(" + fmt(R) + " - j" + fmt(X) + ")}{" + fmt(R) + "^2 + " + fmt(X) + "^2}$", "$\\dot{I} = " + fmt(p) + " - j" + fmt(q) + "\\,\\mathrm{A}$"], chk: {form: "u31s4vec", p: {R: R, X: X, n: n}}};
  }
  throw new Error("u31s4vec：条件に合う数字が見つからない");
}
function tbU31s4_Qmag(r){
  var gcd = tbU31s4_gcd, ratio = tbU31s4_ratio, par = tbU31s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,8,12]);
    var b = pick(r, [3,4,5,6,8,12]);
    var n = pick(r, [1,2,3,4]);
    var c = (Math.sqrt(a * a + b * b));
    var V = (n * (a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9)) continue;
    var ok = (n * c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s4_three(ok, [{x: (n * (a + b)), why: "実数と虚数の成分を数字のまま足した"}, {x: (n * a), why: "実数の成分だけを答えた"}, {x: (V / (a + b)), why: "$R$ と $X_L$ を数字のまま足して割った"}, {x: (n * b), why: "虚数の成分だけを答えた"}, {x: (V / a), why: "抵抗だけで割った"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u31s4mag", text: "$" + fmt(a) + "\\,\\Omega$ の抵抗と、誘導性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコイルを直列につなぎ、$\\dot{V} = " + fmt(V) + "\\,\\mathrm{V}$ の交流電源につないだ。電流の大きさは何 A か。", fig: {kind: "u31s4vi", L: tbU31s4_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r", "{R}=" + qf(a, "O")], ["l", "{X}_L=" + qf(b, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{I} = \\dfrac{" + fmt(V) + "(" + fmt(a) + " - j" + fmt(b) + ")}{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + fmt(n * a) + " - j" + fmt(n * b) + "$", "$I = \\sqrt{" + fmt(n * a) + "^2 + " + fmt(n * b) + "^2} = " + qv(ok, "A") + "$"], chk: {form: "u31s4mag", p: {a: a, b: b, n: n}}};
  }
  throw new Error("u31s4mag：条件に合う数字が見つからない");
}
function tbU31s4_Qconj(r){
  var gcd = tbU31s4_gcd, ratio = tbU31s4_ratio, par = tbU31s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$R - jX_L$", v: "own"}, {t: "$R + jX_L$", v: "p", why: "同じ物を掛けても j は消えない。j の符号を変えた物を掛ける"}, {t: "$j$", v: "j", why: "$j$ を掛けると $jR - X_L$ になり、j が残る"}, {t: "$R$", v: "r", why: "$R$ を掛けても j は残る"}]);
    return {form: "u31s4conj", text: "$\\dot{I} = \\dfrac{V}{R + jX_L}$ の分母の j を消すには、分母と分子に何を掛けるか。", fig: {kind: "u31s4vi", L: tbU31s4_fig({"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}"}, [["src", "{V}"], ["r", "{R}"], ["l", "{X}_L"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$(R + jX_L)(R - jX_L) = R^2 + X_L^2$ で j が消える", "$R - jX_L$ を掛ける"], chk: {form: "u31s4conj", p: {}}};
  }
  throw new Error("u31s4conj：条件に合う数字が見つからない");
}
// 31-5 RC 直列 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s5_par(a, b){ return a * b / (a + b); }
function tbU31s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s5_Qz(r){
  var gcd = tbU31s5_gcd, ratio = tbU31s5_ratio, par = tbU31s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var c = (Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9)) continue;
    var ok = (c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s5_three(ok, [{x: (a + b), why: "数字のまま足した。ベクトルで足す"}, {x: (Math.abs(a - b)), why: "引いた。$-j$ は向きを表し、引き算ではない"}, {x: (a * a + b * b), why: "2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u31s5z", text: "図のように、$" + fmt(a) + "\\,\\Omega$ の抵抗と、容量性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコンデンサを直列につないだ。回路のインピーダンスの大きさは何 Ω か。", fig: {kind: "u31s5zt", L: tbU31s5_fig({"src":"{V}","r":"{R}","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(a, "O")], ["c", "{X}_C=" + qf(b, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{Z} = " + fmt(a) + " - j" + fmt(b) + "$", "$Z = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + qv(ok, "O") + "$"], chk: {form: "u31s5z", p: {a: a, b: b}}};
  }
  throw new Error("u31s5z：条件に合う数字が見つからない");
}
function tbU31s5_Qi(r){
  var gcd = tbU31s5_gcd, ratio = tbU31s5_ratio, par = tbU31s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var b = pick(r, [3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,30,40]);
    var n = pick(r, [1,2,3,4,5,6,8,10]);
    var c = (Math.sqrt(a * a + b * b));
    var V = (n * Math.sqrt(a * a + b * b));
    if (!(Math.abs(Math.sqrt(a * a + b * b) - Math.round(Math.sqrt(a * a + b * b))) < 1e-9 && V <= 300)) continue;
    var ok = (V / c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s5_three(ok, [{x: (V / (a + b)), why: "数字のまま足した。ベクトルで足す"}, {x: (V / Math.abs(a - b)), why: "引いた。$-j$ は向きを表し、引き算ではない"}, {x: (V / a), why: "抵抗だけで割った"}, {x: (c / V), why: "割る順が逆"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u31s5i", text: "図のように、$" + fmt(a) + "\\,\\Omega$ の抵抗と、容量性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコンデンサを直列につなぎ、実効値 $" + fmt(V) + "\\,\\mathrm{V}$ の交流電源につないだ。流れる電流の大きさは何 A か。", fig: {kind: "u31s5zt", L: tbU31s5_fig({"src":"{V}","r":"{R}","c":"{X}_C","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r", "{R}=" + qf(a, "O")], ["c", "{X}_C=" + qf(b, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + fmt(c) + "\\,\\Omega$", "$I = \\dfrac{V}{Z} = \\dfrac{" + fmt(V) + "}{" + fmt(c) + "} = " + qv(ok, "A") + "$"], chk: {form: "u31s5i", p: {a: a, b: b, n: n}}};
  }
  throw new Error("u31s5i：条件に合う数字が見つからない");
}
function tbU31s5_Qvec(r){
  var gcd = tbU31s5_gcd, ratio = tbU31s5_ratio, par = tbU31s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var b = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    if (!(a != b)) continue;
    var _c = choices(r, [{t: "$\\dot{Z} = " + fmt(a) + " - j" + fmt(b) + "$", v: fmt(a) + ",-" + fmt(b)}, {t: "$\\dot{Z} = " + fmt(a) + " + j" + fmt(b) + "$", v: fmt(a) + "," + fmt(b), why: "コンデンサは $-jX_C$（下向き）"}, {t: "$\\dot{Z} = " + fmt(b) + " - j" + fmt(a) + "$", v: fmt(b) + ",-" + fmt(a), why: "抵抗は j の付かない右向き"}, {t: "$\\dot{Z} = " + fmt(a - b) + "$", v: fmt(a - b) + ",0", why: "数字のまま引いた。$-j$ は向きを表す"}]);
    return {form: "u31s5vec", text: "$" + fmt(a) + "\\,\\Omega$ の抵抗と、容量性リアクタンス $" + fmt(b) + "\\,\\Omega$ のコンデンサを直列につないだ。インピーダンスのベクトル $\\dot{Z}$［Ω］はどれか。", fig: {kind: "u31s5zt", L: tbU31s5_fig({"src":"{V}","r":"{R}","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(a, "O")], ["c", "{X}_C=" + qf(b, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R$ は右向き、コンデンサは $-jX_C$（下向き）", "$\\dot{Z} = " + fmt(a) + " - j" + fmt(b) + "$"], chk: {form: "u31s5vec", p: {a: a, b: b}}};
  }
  throw new Error("u31s5vec：条件に合う数字が見つからない");
}
function tbU31s5_Qvv(r){
  var gcd = tbU31s5_gcd, ratio = tbU31s5_ratio, par = tbU31s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [1,2,3,4,5,10]);
    var R = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var X = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var vr = (I * R);
    var vx = (I * X);
    if (!(R != X)) continue;
    var _c = choices(r, [{t: "$\\dot{V} = " + fmt(vr) + " - j" + fmt(vx) + "$", v: fmt(vr) + ",-" + fmt(vx)}, {t: "$\\dot{V} = " + fmt(vr) + " + j" + fmt(vx) + "$", v: fmt(vr) + "," + fmt(vx), why: "コンデンサの電圧は $-jIX_C$（下向き）"}, {t: "$\\dot{V} = " + fmt(vx) + " - j" + fmt(vr) + "$", v: fmt(vx) + ",-" + fmt(vr), why: "抵抗の電圧が j の付かない右向き"}, {t: "$\\dot{V} = " + fmt(vr + vx) + "$", v: fmt(vr + vx) + ",0", why: "数字のまま足した。ベクトルで足す"}]);
    return {form: "u31s5vv", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗と、容量性リアクタンス $" + fmt(X) + "\\,\\Omega$ のコンデンサを直列につないだ回路に、電流 $\\dot{I} = " + fmt(I) + "\\,\\mathrm{A}$（基準）が流れている。電源電圧のベクトル $\\dot{V}$［V］はどれか。", fig: {kind: "u31s5zt", L: tbU31s5_fig({"src":"{V}","r":"{R}","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(R, "O")], ["c", "{X}_C=" + qf(X, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{V} = IR - jIX_C = " + fmt(I) + " \\times " + fmt(R) + " - j" + fmt(I) + " \\times " + fmt(X) + "$", "$\\dot{V} = " + fmt(vr) + " - j" + fmt(vx) + "\\,\\mathrm{V}$"], chk: {form: "u31s5vv", p: {I: I, R: R, X: X}}};
  }
  throw new Error("u31s5vv：条件に合う数字が見つからない");
}
// 31-6 RLC 直列 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s6_par(a, b){ return a * b / (a + b); }
function tbU31s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s6_Qz(r){
  var gcd = tbU31s6_gcd, ratio = tbU31s6_ratio, par = tbU31s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [3,4,5,6,8,9,12,15,16,20,24,30,40]);
    var XL = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var XC = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var X = (Math.abs(XL - XC));
    var c = (Math.sqrt(R * R + (XL - XC) * (XL - XC)));
    if (!(XL != XC && Math.abs(Math.sqrt(R * R + (XL - XC) * (XL - XC)) - Math.round(Math.sqrt(R * R + (XL - XC) * (XL - XC)))) < 1e-9)) continue;
    var ok = (c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s6_three(ok, [{x: (R + XL + XC), why: "全部を数字のまま足した。ベクトルで足す"}, {x: (R + X), why: "打ち消した残りと $R$ を数字のまま足した"}, {x: (Math.sqrt(R * R + (XL + XC) * (XL + XC))), why: "$X_L$ と $X_C$ を足した。向きが逆なので引く"}, {x: (R * R + X * X), why: "2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u31s6z", text: "図のように、$" + fmt(R) + "\\,\\Omega$ の抵抗、誘導性リアクタンス $" + fmt(XL) + "\\,\\Omega$ のコイル、容量性リアクタンス $" + fmt(XC) + "\\,\\Omega$ のコンデンサを直列につないだ。回路のインピーダンスの大きさは何 Ω か。", fig: {kind: "u31s6zt", L: tbU31s6_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(XL, "O")], ["c", "{X}_C=" + qf(XC, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_L$ と $X_C$ は打ち消し合い、$|X_L - X_C| = " + fmt(X) + "\\,\\Omega$", "$Z = \\sqrt{" + fmt(R) + "^2 + " + fmt(X) + "^2} = " + qv(ok, "O") + "$"], chk: {form: "u31s6z", p: {R: R, XL: XL, XC: XC}}};
  }
  throw new Error("u31s6z：条件に合う数字が見つからない");
}
function tbU31s6_Qi(r){
  var gcd = tbU31s6_gcd, ratio = tbU31s6_ratio, par = tbU31s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [3,4,5,6,8,9,12,15,16,20,24,30,40]);
    var XL = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var XC = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var n = pick(r, [1,2,3,4,5]);
    var X = (Math.abs(XL - XC));
    var c = (Math.sqrt(R * R + (XL - XC) * (XL - XC)));
    var V = (n * Math.sqrt(R * R + (XL - XC) * (XL - XC)));
    if (!(XL != XC && Math.abs(Math.sqrt(R * R + (XL - XC) * (XL - XC)) - Math.round(Math.sqrt(R * R + (XL - XC) * (XL - XC)))) < 1e-9 && V <= 300)) continue;
    var ok = (V / c);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s6_three(ok, [{x: (V / (R + XL + XC)), why: "全部を数字のまま足した"}, {x: (V / (R + X)), why: "打ち消した残りと $R$ を数字のまま足した"}, {x: (V / R), why: "抵抗だけで割った"}, {x: (c / V), why: "割る順が逆"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u31s6i", text: "図のように、$" + fmt(R) + "\\,\\Omega$ の抵抗、誘導性リアクタンス $" + fmt(XL) + "\\,\\Omega$ のコイル、容量性リアクタンス $" + fmt(XC) + "\\,\\Omega$ のコンデンサを直列につなぎ、実効値 $" + fmt(V) + "\\,\\mathrm{V}$ の交流電源につないだ。流れる電流の大きさは何 A か。", fig: {kind: "u31s6zt", L: tbU31s6_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(XL, "O")], ["c", "{X}_C=" + qf(XC, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z = \\sqrt{" + fmt(R) + "^2 + (" + fmt(XL) + " - " + fmt(XC) + ")^2} = " + fmt(c) + "\\,\\Omega$", "$I = \\dfrac{V}{Z} = \\dfrac{" + fmt(V) + "}{" + fmt(c) + "} = " + qv(ok, "A") + "$"], chk: {form: "u31s6i", p: {R: R, XL: XL, XC: XC, n: n}}};
  }
  throw new Error("u31s6i：条件に合う数字が見つからない");
}
function tbU31s6_Qvec(r){
  var gcd = tbU31s6_gcd, ratio = tbU31s6_ratio, par = tbU31s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [2,3,4,5,6,8,10,12]);
    var XL = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var XC = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var s = (XL - XC);
    var X = (Math.abs(XL - XC));
    var S = (XL + XC);
    var sg = (XL > XC ? '+' : '-');
    var og = (XL > XC ? '-' : '+');
    if (!(XL != XC && R != X)) continue;
    var _c = choices(r, [{t: "$\\dot{Z} = " + fmt(R) + " " + String(sg) + " j" + fmt(X) + "$", v: fmt(R) + "," + fmt(s)}, {t: "$\\dot{Z} = " + fmt(R) + " " + String(og) + " j" + fmt(X) + "$", v: fmt(R) + "," + fmt(-s), why: "上向きの $X_L$ から下向きの $X_C$ を引く。残る向きを確かめる"}, {t: "$\\dot{Z} = " + fmt(R) + " + j" + fmt(S) + "$", v: fmt(R) + "," + fmt(S), why: "$X_L$ と $X_C$ を足した。向きが逆なので打ち消し合う"}, {t: "$\\dot{Z} = " + fmt(X) + " " + String(sg) + " j" + fmt(R) + "$", v: fmt(X) + "," + fmt(XL > XC ? R : -R), why: "抵抗が j の付かない右向き"}]);
    return {form: "u31s6vec", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗、誘導性リアクタンス $" + fmt(XL) + "\\,\\Omega$ のコイル、容量性リアクタンス $" + fmt(XC) + "\\,\\Omega$ のコンデンサを直列につないだ。インピーダンスのベクトル $\\dot{Z}$［Ω］はどれか。", fig: {kind: "u31s6zt", L: tbU31s6_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(XL, "O")], ["c", "{X}_C=" + qf(XC, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{Z} = R + j(X_L - X_C) = " + fmt(R) + " + j(" + fmt(XL) + " - " + fmt(XC) + ")$", "$\\dot{Z} = " + fmt(R) + " " + String(sg) + " j" + fmt(X) + "$"], chk: {form: "u31s6vec", p: {R: R, XL: XL, XC: XC}}};
  }
  throw new Error("u31s6vec：条件に合う数字が見つからない");
}
function tbU31s6_Qzdir(r){
  var gcd = tbU31s6_gcd, ratio = tbU31s6_ratio, par = tbU31s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [3,4,5,6,8,10]);
    var XL = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var XC = pick(r, [2,3,4,5,6,8,9,10,12,14,15,16,18,20,24,25,30,32,36,40]);
    var okw = (XL > XC ? '右上向き' : '右下向き');
    var ngw = (XL > XC ? '右下向き' : '右上向き');
    var okv = (XL > XC ? 'up' : 'down');
    var ngv = (XL > XC ? 'down' : 'up');
    var big = (XL > XC ? '$X_L$' : '$X_C$');
    var rest = (XL > XC ? '上向き' : '下向き');
    if (!(XL != XC)) continue;
    var _c = choices(r, [{t: String(okw), v: String(okv)}, {t: String(ngw), v: String(ngv), why: String(big) + " の方が大きいので、打ち消した残りは" + String(rest)}, {t: "右向き", v: "right", why: "$X_L$ と $X_C$ が違うので、打ち消した残りがある"}, {t: "上向きか下向き（斜めにならない）", v: "v", why: "抵抗の右向きの分があるので、斜めになる"}]);
    return {form: "u31s6zdir", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗、誘導性リアクタンス $" + fmt(XL) + "\\,\\Omega$ のコイル、容量性リアクタンス $" + fmt(XC) + "\\,\\Omega$ のコンデンサを直列につないだ。インピーダンスのベクトル $\\dot{Z}$ の向きはどれか。", fig: {kind: "u31s6zt", L: tbU31s6_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(XL, "O")], ["c", "{X}_C=" + qf(XC, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(big) + " の方が大きいので、打ち消した残りは" + String(rest), "$\\dot{Z}$ は" + String(okw)], chk: {form: "u31s6zdir", p: {R: R, XL: XL, XC: XC}}};
  }
  throw new Error("u31s6zdir：条件に合う数字が見つからない");
}
// 31-7 答えが2つ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u31_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU31s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU31s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU31s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU31s7_par(a, b){ return a * b / (a + b); }
function tbU31s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU31s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU31s7_Qxc(r){
  var gcd = tbU31s7_gcd, ratio = tbU31s7_ratio, par = tbU31s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [3,4,5,6,8,9,10,12,15,16,20,24,30,40]);
    var X = pick(r, [3,4,5,6,8,9,10,12,15,16,20,24,30,40]);
    var XL = pick(r, [10,12,15,20,24,25,30,40,50,60]);
    var n = pick(r, [1,2,3,4,5]);
    var d = pick(r, [1,-1]);
    var c = (Math.sqrt(R * R + X * X));
    var V = (n * Math.sqrt(R * R + X * X));
    var ot = (d > 0 ? XL + X : XL - X);
    var w = (d > 0 ? '遅れて' : '進んで');
    if (!(Math.abs(Math.sqrt(R * R + X * X) - Math.round(Math.sqrt(R * R + X * X))) < 1e-9 && XL - X > 0 && V <= 400)) continue;
    var ok = (d > 0 ? XL - X : XL + X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU31s7_three(ok, [{x: (ot), why: String(d > 0 ? '電流が進む方の答え。遅れなら $X_L$ の方が大きい' : '電流が遅れる方の答え。進みなら $X_C$ の方が大きい')}, {x: (X), why: "$X_L - X_C$ の大きさを答えた"}, {x: (c), why: "インピーダンスの大きさを答えた"}, {x: (Math.abs(XL - (c - R))), why: "$Z$ から $R$ を数字のまま引いた。2 乗の式で出す"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u31s7xc", text: "図のように、$" + fmt(R) + "\\,\\Omega$ の抵抗、誘導性リアクタンス $" + fmt(XL) + "\\,\\Omega$ のコイル、コンデンサを直列につなぎ、実効値 $" + fmt(V) + "\\,\\mathrm{V}$ の交流電源につないだ。電流は $" + fmt(n) + "\\,\\mathrm{A}$ で、電圧より" + String(w) + "いた。コンデンサの容量性リアクタンスは何 Ω か。", fig: {kind: "u31s7zt", L: tbU31s7_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["i", "{I}=" + qf(n, "A")], ["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(XL, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z = \\dfrac{" + fmt(V) + "}{" + fmt(n) + "} = " + fmt(c) + "\\,\\Omega$、$X_L - X_C = \\pm\\sqrt{" + fmt(c) + "^2 - " + fmt(R) + "^2} = \\pm " + fmt(X) + "$", String(d > 0 ? '遅れなので $X_L > X_C$' : '進みなので $X_C > X_L$') + "。$X_C = " + qv(ok, "O") + "$"], chk: {form: "u31s7xc", p: {R: R, X: X, XL: XL, n: n, d: d}}};
  }
  throw new Error("u31s7xc：条件に合う数字が見つからない");
}
function tbU31s7_Qpm(r){
  var gcd = tbU31s7_gcd, ratio = tbU31s7_ratio, par = tbU31s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [3,4,5,6,8,9,10,12,15,16,20,24,30,40]);
    var X = pick(r, [3,4,5,6,8,9,10,12,15,16,20,24,30,40]);
    var n = pick(r, [1,2,3,4,5]);
    var c = (Math.sqrt(R * R + X * X));
    var V = (n * Math.sqrt(R * R + X * X));
    var sd = (c - R);
    if (!(Math.abs(Math.sqrt(R * R + X * X) - Math.round(Math.sqrt(R * R + X * X))) < 1e-9 && V <= 400 && c - R != X)) continue;
    var _c = choices(r, [{t: "$\\pm " + fmt(X) + "\\,\\Omega$（2つ）", v: "pm" + fmt(X)}, {t: "$" + fmt(X) + "\\,\\Omega$ だけ", v: "p" + fmt(X), why: "2 乗して出したので、マイナスもある"}, {t: "$\\pm " + fmt(sd) + "\\,\\Omega$（2つ）", v: "pm" + fmt(sd), why: "$Z$ から $R$ を数字のまま引いた。2 乗の式で出す"}, {t: "$\\pm " + fmt(c) + "\\,\\Omega$（2つ）", v: "pm" + fmt(c), why: "インピーダンスの大きさのまま"}]);
    return {form: "u31s7pm", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗とコイルとコンデンサを直列につなぎ、実効値 $" + fmt(V) + "\\,\\mathrm{V}$ の交流電源につなぐと、$" + fmt(n) + "\\,\\mathrm{A}$ の電流が流れた。$X_L - X_C$ は何 Ω か。", fig: {kind: "u31s7zt", L: tbU31s7_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["i", "{I}=" + qf(n, "A")], ["r", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Z = \\dfrac{" + fmt(V) + "}{" + fmt(n) + "} = " + fmt(c) + "\\,\\Omega$、$(X_L - X_C)^2 = " + fmt(c) + "^2 - " + fmt(R) + "^2$", "$X_L - X_C = \\pm " + fmt(X) + "\\,\\Omega$（2つ）"], chk: {form: "u31s7pm", p: {R: R, X: X, n: n}}};
  }
  throw new Error("u31s7pm：条件に合う数字が見つからない");
}
function tbU31s7_Qdir(r){
  var gcd = tbU31s7_gcd, ratio = tbU31s7_ratio, par = tbU31s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R = pick(r, [3,4,5,6,8,10]);
    var XL = pick(r, [3,4,5,6,8,9,10,12,15,16,20,24,30,40]);
    var XC = pick(r, [3,4,5,6,8,9,10,12,15,16,20,24,30,40]);
    var okw = (XL > XC ? '遅れる' : '進む');
    var ngw = (XL > XC ? '進む' : '遅れる');
    var okv = (XL > XC ? 'lag' : 'lead');
    var ngv = (XL > XC ? 'lead' : 'lag');
    var big = (XL > XC ? '$X_L$' : '$X_C$');
    var same = (XL > XC ? 'RL' : 'RC');
    if (!(XL != XC)) continue;
    var _c = choices(r, [{t: String(okw), v: String(okv)}, {t: String(ngw), v: String(ngv), why: String(big) + " の方が大きいので " + String(same) + " 直列回路と同じ形"}, {t: "同相（ずれない）", v: "same", why: "$X_L$ と $X_C$ が違うので、打ち消した残りがある"}, {t: "ちょうど 90° ずれる", v: "q", why: "抵抗があるので、90° にはならない"}]);
    return {form: "u31s7dir", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗、誘導性リアクタンス $" + fmt(XL) + "\\,\\Omega$ のコイル、容量性リアクタンス $" + fmt(XC) + "\\,\\Omega$ のコンデンサを直列につなぎ、交流電源につないだ。電流の位相は、電源電圧に比べてどうなるか。", fig: {kind: "u31s7zt", L: tbU31s7_fig({"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}"}, [["r", "{R}=" + qf(R, "O")], ["l", "{X}_L=" + qf(XL, "O")], ["c", "{X}_C=" + qf(XC, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(big) + " の方が大きいので " + String(same) + " 直列回路と同じ形", "電流は電圧より" + String(okw)], chk: {form: "u31s7dir", p: {R: R, XL: XL, XC: XC}}};
  }
  throw new Error("u31s7dir：条件に合う数字が見つからない");
}
var GEN = {
  // 31-1 インピーダンス
  1: function(r){ return pick(r, [tbU31s1_Qz, tbU31s1_Qz, tbU31s1_Qz, tbU31s1_Qx, tbU31s1_Qx, tbU31s1_Qvec, tbU31s1_Qvec, tbU31s1_Qword])(r); },
  // 31-2 交流のオームの法則
  2: function(r){ return pick(r, [tbU31s2_Qi, tbU31s2_Qi, tbU31s2_Qi, tbU31s2_Qv, tbU31s2_Qv, tbU31s2_Qv, tbU31s2_Qform])(r); },
  // 31-3 電流を基準にした図
  3: function(r){ return pick(r, [tbU31s3_Qv, tbU31s3_Qv, tbU31s3_Qv, tbU31s3_Qvl, tbU31s3_Qvl, tbU31s3_Qvec, tbU31s3_Qvec, tbU31s3_Qvec, tbU31s3_Qwhy])(r); },
  // 31-4 電圧を基準にした計算
  4: function(r){ return pick(r, [tbU31s4_Qvec, tbU31s4_Qvec, tbU31s4_Qvec, tbU31s4_Qmag, tbU31s4_Qmag, tbU31s4_Qmag, tbU31s4_Qconj])(r); },
  // 31-5 RC 直列
  5: function(r){ return pick(r, [tbU31s5_Qz, tbU31s5_Qz, tbU31s5_Qz, tbU31s5_Qi, tbU31s5_Qi, tbU31s5_Qi, tbU31s5_Qvec, tbU31s5_Qvec, tbU31s5_Qvv, tbU31s5_Qvv])(r); },
  // 31-6 RLC 直列
  6: function(r){ return pick(r, [tbU31s6_Qz, tbU31s6_Qz, tbU31s6_Qz, tbU31s6_Qi, tbU31s6_Qi, tbU31s6_Qvec, tbU31s6_Qvec, tbU31s6_Qzdir, tbU31s6_Qzdir])(r); },
  // 31-7 答えが2つ
  7: function(r){ return pick(r, [tbU31s7_Qxc, tbU31s7_Qxc, tbU31s7_Qxc, tbU31s7_Qxc, tbU31s7_Qpm, tbU31s7_Qpm, tbU31s7_Qdir, tbU31s7_Qdir])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t31s1e","scene":"t31s1e","kind":"u31s1zt","lab":{"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","a1":"{R}","a1l":15,"a1g":0,"a2":"{X}_L","a2o":"a1","a2l":8,"a2g":90,"a3":"{Z}","a3l":17,"a3g":28.07},"viewbox":"316 261 828 1115","band":{"want":"RL 直列回路のインピーダンス","ans":"$\\dot{Z} = R + jX_L$、$Z = \\sqrt{R^2 + X_L^2}$","full":"回路全体の電流の流しにくさがインピーダンス Z［Ω］。RL 直列では R（右向き）と jX_L（上向き）をベクトルで足して Ż = R + jX_L。大きさは三平方の定理で Z = √(R² + X_L²)。点の無い文字は大きさ。"},"narr":{"start":{"co":1,"a1d":0,"a2d":0,"a3d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①インピーダンス\n②ベクトルで足す\n③大きさ\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"抵抗とコイルを直列につなぎ、交流電源につなぎます。RL 直列回路です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R","L"]},{"text":"回路全体の電流の流しにくさを、〖インピーダンス〗といいます。$Z$ と書き、単位は $\\Omega$ です。回路全体の抵抗と思ってよいです。","at":{"強調":1.0},"after":[],"emph":["R","L"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"$R$ には j が無いので、〖右向き〗にかきます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"a1","emph":["R","A1"]},{"text":"コイルは $jX_L$ なので、上向きです。直列なので $R$ の先につなぎます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a2","emph":["L","A2","R","A1"]},{"text":"直列なので足しますが、数字だけでなく、〖ベクトルで足します〗。右上向きになります。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":[],"move":"a3","emph":["A3","R","L","A1","A2"],"eq":[{"cont":false,"items":[["\\dot{Z} = R + jX_L"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"$R$・$X_L$・$Z$ は直角三角形です。大きさは〖三平方の定理〗で出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":3,"emph":["A1","A2","A3","R","L"],"eq":[{"cont":false,"items":[["Z = \\sqrt{R^2 + X_L^2}"]]}]},{"text":"〖点の付いていない $Z$ は大きさ〗、点の付いた $\\dot{Z}$ はベクトルです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A3","R","L"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s1ztL","u31s1ztw1"],"zlo":["u31s1ztRw","u31s1ztw3"],"zmid":["u31s1ztw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a1":{"to":{"a1d":1},"dur":0.6},"a2":{"to":{"a2d":1},"dur":0.6},"a3":{"to":{"a3d":1},"dur":0.8}},"route":["インピーダンス","ベクトルで足す","大きさ"]}},{"id":"t31s1x","scene":"t31s1x","kind":"u31s1zt","lab":{"src":"{V}","r":"{R}=15 Ω","l":"{X}_L=8 Ω","i":"{I}","a1":"15","a1l":15,"a1g":0,"a2":"8","a2o":"a1","a2l":8,"a2g":90,"a3":["{Z}","{Z}=17 Ω"],"a3l":17,"a3g":28.07},"viewbox":"316 261 828 1115","band":{"want":"インピーダンスの大きさ $Z$","known":"$R = 15\\,\\Omega,\\;\\; X_L = 8\\,\\Omega$","ans":"$Z = 17\\,\\Omega$"},"narr":{"start":{"co":1,"a3v":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、インピーダンスの大きさ $Z$ です。","at":{"強調":1.0},"after":[],"emph":["A3"]},{"text":"①ベクトルで書く\n②三平方の定理\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"15 と 8 を足して 23 としてはいけません。〖8 は上向きの 8〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["A1","A2","A3"],"eq":[{"cont":false,"items":[["\\dot{Z} = 15 + j8"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"直角三角形なので、三平方の定理を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["A3"],"eq":[{"cont":false,"items":[["Z = \\sqrt{15^2 + 8^2}"],["= \\sqrt{289} = 17\\,\\Omega"]]}],"move":"z","ans":true,"emphPre":["A3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s1ztL","u31s1ztw1"],"zlo":["u31s1ztRw","u31s1ztw3"],"zmid":["u31s1ztw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"z":{"to":{"a3v":1},"dur":0.5}},"route":["ベクトルで書く","三平方の定理"]}},{"id":"t31s2e","scene":"t31s2e","kind":"u31s2zt","lab":{"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","a1":"{R}","a1l":12,"a1g":0,"a2":"{X}_L","a2o":"a1","a2l":9,"a2g":90,"a3":"{Z}","a3l":15,"a3g":36.87},"viewbox":"232 261 828 1115","band":{"want":"交流のオームの法則","ans":"大きさは $I = \\dfrac{V}{Z}$、ベクトルは $\\dot{I} = \\dfrac{\\dot{V}}{\\dot{Z}}$","full":"直流の I = V/R の R をインピーダンス Z にした物が交流のオームの法則。大きさを求める時は I = V/Z、ベクトルを求める時は İ = V̇/Ż。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①$Z$ を使う\n②大きさとベクトル\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["A3"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"直流では $I = \\dfrac{V}{R}$ でした。交流では、〖$R$ をインピーダンス $Z$ にします〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["src","I","A3","R","A1"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{Z}"]]}]},{"text":"オームの法則と同じ形です。電圧は $V = IZ$ で出せます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","A3","R","I","A1"],"eq":[{"cont":false,"items":[["V = IZ"]]}],"emphPre":["src","I","A3"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"大きさを求める時は、〖大きさの式〗を使います。$Z$ は三平方の定理で出した大きさです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["A3"]},{"text":"ベクトルを求める時は、〖ベクトルの式〗を使います。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["A1","A2","A3","src","I"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{\\dot{V}}{\\dot{Z}}"]]}],"emphPre":["src","I","A1","A2","A3"]},{"text":"〖今どちらを求めているのか〗、いつも意識して使います。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["I","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s2ztL","u31s2ztw1"],"zlo":["u31s2ztRw","u31s2ztw3"],"zmid":["u31s2ztw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{},"route":["$Z$ を使う","大きさとベクトル"]}},{"id":"t31s2x","scene":"t31s2x","kind":"u31s2zt","lab":{"src":["{V}","{V}=60 V"],"r":"{R}=12 Ω","l":"{X}_L=9 Ω","i":"{I}=4 A","a1":"12","a1l":12,"a1g":0,"a2":"9","a2o":"a1","a2l":9,"a2g":90,"a3":["{Z}","{Z}=15 Ω"],"a3l":15,"a3g":36.87},"viewbox":"232 261 828 1115","band":{"want":"電源電圧の大きさ $V$","known":"$I = 4\\,\\mathrm{A},\\;\\; R = 12\\,\\Omega,\\;\\; X_L = 9\\,\\Omega$","ans":"$V = 60\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"a3v":0,"srcv":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、電源電圧の大きさ $V$ です。","at":{"強調":1.0},"after":[],"emph":["src"]},{"text":"①$Z$ の大きさ\n②$V = IZ$\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","A3","src"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"大きさを求めるので、大きさの式 $V = IZ$ を使います。先に〖$Z$ の大きさ〗が要ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["A3","src","I"],"eq":[{"cont":false,"items":[["\\dot{Z} = 12 + j9"],["Z = \\sqrt{12^2 + 9^2} = 15\\,\\Omega"]]}],"move":"z","emphPre":["A1","A2","src","I","A3"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電流に掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["src","I","A3"],"eq":[{"cont":false,"items":[["V = IZ"],["= 4 \\times 15 = 60\\,\\mathrm{V}"]]}],"move":"v","ans":true,"emphPre":["I","A3","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s2ztL","u31s2ztw1"],"zlo":["u31s2ztRw","u31s2ztw3"],"zmid":["u31s2ztw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"z":{"to":{"a3v":1},"dur":0.5},"v":{"to":{"srcv":1},"dur":0.5}},"route":["$Z$ の大きさ","$V = IZ$"]}},{"id":"t31s3e","scene":"t31s3e","kind":"u31s3vt","lab":{"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","vr":"{V}_R","vl":"{V}_L","ref":true,"a1":"{I}","a1dot":true,"a1l":10,"a1g":0,"a2":"{V}_R","a2dot":true,"a2l":24,"a2g":0,"a2y":-0.04,"a4":"{V}_L","a4dot":true,"a4o":"a2","a4l":32,"a4g":90,"a4c":"red","a3":"{V}","a3dot":true,"a3l":40,"a3g":53.13,"a5":"{V}_R+{V}_L","a5l":56,"a5g":0,"a5y":-0.12,"a5k":"dash"},"viewbox":"220 183 839 1193","band":{"want":"直列回路の電圧のベクトル図","ans":"$\\dot{V} = IR + jIX_L$（ベクトルで足す）","full":"直列回路はどこも同じ電流なので、電流を基準（右向き）にする。IR は右向き、jIX_L は上向き。電源電圧は 2 つのベクトルの合成で V̇ = IR + jIX_L。"},"narr":{"start":{"co":1,"a1d":0,"a2d":0,"a4d":0,"a3d":0,"a5d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①電流を基準\n②2 つの電圧\n③ベクトルで足す\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"直列回路なので、抵抗にもコイルにも〖同じ電流 $I$〗が流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R","L"]},{"text":"そこで、〖電流を基準ベクトル〗にして、右向きにかきます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a1","emph":["A1"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"抵抗の電圧は $IR$ です。$I$ は実数なので、掛けても向きは変わりません。右向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"a2","emph":["Vr","A2","I","R"]},{"text":"コイルの電圧は $jIX_L$ です。上向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a4","emph":["Vl","A4","I","L"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電源電圧は、〖2 つの電圧のベクトルの合成〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":[],"route":3,"move":"a3","emph":["src","A3","I","R","L"],"eq":[{"cont":false,"items":[["\\dot{V} = IR + jIX_L"]]}]},{"text":"〖数字のまま足した長さにはなりません〗。向きが違うからです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a5","emph":["A5","A3","I","R","L"]},{"text":"大きさは、三平方の定理で出します。","at":{"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["V = \\sqrt{V_R^2 + V_L^2}"]]}],"ans":true,"emph":["A3","src","Vr","Vl","A5"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"Vr":["vrd:e","vrd:f","vrd:a","vrt0","vrt1"],"L":["l","lt0","lt1"],"Vl":["vld:e","vld:f","vld:a","vlt0","vlt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s3vtL","u31s3vtw1"],"zlo":["u31s3vtRw","u31s3vtw3"],"zmid":["u31s3vtw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a1":{"to":{"a1d":1},"dur":0.6},"a2":{"to":{"a2d":1},"dur":0.6},"a4":{"to":{"a4d":1},"dur":0.6},"a3":{"to":{"a3d":1},"dur":0.8},"a5":{"to":{"a5d":1},"dur":0.6}},"route":["電流を基準","2 つの電圧","ベクトルで足す"]}},{"id":"t31s3x","scene":"t31s3x","kind":"u31s3vt","lab":{"src":"{V}","r":"{R}=12 Ω","l":"{X}_L=16 Ω","i":"{I}=2 A","vr":["{V}_R","{V}_R=24 V"],"vl":["{V}_L","{V}_L=32 V"],"ref":true,"a1":"2","a1dot":true,"a1l":10,"a1g":0,"a2":["{V}_R","24"],"a2dot":true,"a2l":24,"a2g":0,"a2y":-0.04,"a4":["{V}_L","32"],"a4dot":true,"a4o":"a2","a4l":32,"a4g":90,"a4c":"red","a3":["{V}","{V}=40 V"],"a3dot":true,"a3l":40,"a3g":53.13},"viewbox":"220 183 839 1193","band":{"want":"電源電圧の大きさ $V$","known":"$I = 2\\,\\mathrm{A},\\;\\; R = 12\\,\\Omega,\\;\\; X_L = 16\\,\\Omega$","ans":"$V = 40\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"vrv":0,"vlv":0,"a2v":0,"a4v":0,"a3v":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、電源電圧の大きさ $V$ です。","at":{"強調":1.0},"after":[],"emph":["src","I","R","L"]},{"text":"①2 つの電圧\n②ベクトルで足す\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電流を基準にして、それぞれの電圧を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["Vr","A2","I","R","L"],"eq":[{"cont":false,"items":[["V_R = IR = 2 \\times 12 = 24\\,\\mathrm{V}"]]}],"move":"vr","emphPre":["I","R","L"]},{"text":"","at":{"式":0.0,"動き":0.0,"強調":0.0},"after":["動き","強調"],"eq":[{"cont":false,"items":[["V_L = IX_L = 2 \\times 16 = 32\\,\\mathrm{V}"]]}],"move":"vl","emph":["Vl","A4","I","R","L"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"24 と 32 を足して 56 としてはいけません。〖右向きの 24 と上向きの 32〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["A2","A4","src"],"eq":[{"cont":false,"items":[["\\dot{V} = 24 + j32"]]}]},{"text":"","at":{"強調":0.0,"式":0.0,"動き":0.0,"答え":0.0},"after":["動き","答え","強調"],"emph":["src","A3"],"eq":[{"cont":false,"items":[["V = \\sqrt{24^2 + 32^2}"],["= \\sqrt{1600} = 40\\,\\mathrm{V}"]]}],"move":"v","ans":true,"emphPre":["src","A3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"Vr":["vrd:e","vrd:f","vrd:a","vrt0","vrt1"],"L":["l","lt0","lt1"],"Vl":["vld:e","vld:f","vld:a","vlt0","vlt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s3vtL","u31s3vtw1"],"zlo":["u31s3vtRw","u31s3vtw3"],"zmid":["u31s3vtw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"vr":{"to":{"vrv":1,"a2v":1},"dur":0.5},"vl":{"to":{"vlv":1,"a4v":1},"dur":0.5},"v":{"to":{"a3v":1},"dur":0.5}},"route":["2 つの電圧","ベクトルで足す"]}},{"id":"t31s4e","scene":"t31s4e","kind":"u31s4vi","lab":{"src":"{V}","r":"{R}","l":"{X}_L","i":"{I}","ref":true,"a1":"{V}","a1dot":true,"a1l":75,"a1g":0,"a2":"{I}","a2dot":true,"a2l":45,"a2g":-53.13,"c1of":"a2","c1x":"\\dfrac{VR}{R^2+{X}_L^2}","c1y":"\\dfrac{V{X}_L}{R^2+{X}_L^2}"},"viewbox":"316 261 828 1115","band":{"want":"電圧を基準にした電流のベクトル","ans":"$\\dot{I} = \\dfrac{V(R - jX_L)}{R^2 + X_L^2}$（右下向き）","full":"電圧を基準（実数だけ）にして、İ = V/(R + jX_L)。分母と分子に R − jX_L を掛けて実数と虚数に分ける。実数 − j 虚数 なので右下向き。"},"narr":{"start":{"co":1,"a1d":0,"a2d":0,"c1d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①電圧を基準\n②ベクトルの式\n③分母の j を消す\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"問題によっては、〖電圧を基準ベクトル〗にします。右向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"a1","emph":["src","A1"]},{"text":"基準のベクトルは、〖j の付かない実数だけ〗です。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\dot{V} = V"]]}],"emph":["A1","src"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電流のベクトルを求めるので、ベクトルの式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["I","src","R","L"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{\\dot{V}}{\\dot{Z}}"],["= \\dfrac{V}{R + jX_L}"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"分母に j があるので、〖$R - jX_L$ を分母と分子に掛けます〗。分母は $R^2 + X_L^2$ になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":3,"emph":["I","R","L","src"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{V(R - jX_L)}{(R + jX_L)(R - jX_L)}"],["= \\dfrac{VR}{R^2 + X_L^2} - j\\dfrac{VX_L}{R^2 + X_L^2}"]]}]},{"text":"実数から $j$ の付いた数を引く形なので、電流は右下向きです。〖電圧より遅れます〗。","at":{"動き":1.0,"答え":1.0,"強調":1.0},"after":[],"move":"a2","ans":true,"emph":["A2","C1","R","L","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s4viL","u31s4viw1"],"zlo":["u31s4viRw","u31s4viw3"],"zmid":["u31s4viw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a1":{"to":{"a1d":1},"dur":0.6},"a2":{"to":{"a2d":1,"c1d":1},"dur":1.0}},"route":["電圧を基準","ベクトルの式","分母の j を消す"]}},{"id":"t31s4x","scene":"t31s4x","kind":"u31s4vi","lab":{"src":"{V}=75 V","r":"{R}=3 Ω","l":"{X}_L=4 Ω","i":"{I}","ref":true,"a1":"75","a1dot":true,"a1l":75,"a1g":0,"a2":["{I}","9-j12"],"a2dot":true,"a2l":45,"a2g":-53.13,"c1of":"a2","c1x":"9","c1y":"12"},"viewbox":"316 261 828 1115","band":{"want":"電流のベクトル $\\dot{I}$ と大きさ","known":"$\\dot{V} = 75\\,\\mathrm{V},\\;\\; R = 3\\,\\Omega,\\;\\; X_L = 4\\,\\Omega$","ans":"$\\dot{I} = 9 - j12\\,\\mathrm{A}$、大きさ $15\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"a2d":0,"c1d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、電流のベクトル $\\dot{I}$ と、その大きさです。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①ベクトルの式\n②分母の j を消す\n③大きさ\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"75 には j が付いていないので、電圧が基準です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["A1","I","src"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{\\dot{V}}{\\dot{Z}}"],["= \\dfrac{75}{3 + j4}"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"分母と分子に〖$3 - j4$〗を掛けます。分母は $3^2 + 4^2 = 25$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["A2","C1","I"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{75(3 - j4)}{25}"],["= 3(3 - j4) = 9 - j12\\,\\mathrm{A}"]]}],"move":"a2","emphPre":["I"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"大きさは、実数と虚数の成分から三平方の定理で出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["A2","I"],"eq":[{"cont":false,"items":[["I = \\sqrt{9^2 + 12^2} = 15\\,\\mathrm{A}"]]}],"ans":true,"emphPre":["C1","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s4viL","u31s4viw1"],"zlo":["u31s4viRw","u31s4viw3"],"zmid":["u31s4viw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a2":{"to":{"a2d":1,"c1d":1},"dur":1.0}},"route":["ベクトルの式","分母の j を消す","大きさ"]}},{"id":"t31s5e","scene":"t31s5e","kind":"u31s5zt","lab":{"src":"{V}","r":"{R}","c":"{X}_C","i":"{I}","a1":"{R}","a1l":20,"a1g":0,"a2":"{X}_C","a2o":"a1","a2l":15,"a2g":-90,"a3":"{Z}","a3l":25,"a3g":-36.87},"viewbox":"232 260 828 1116","band":{"want":"RC 直列回路のインピーダンス","ans":"$\\dot{Z} = R - jX_C$、$Z = \\sqrt{R^2 + X_C^2}$","full":"RL 直列の jX_L が −jX_C になるだけ。Ż = R − jX_C は右下向き。大きさは Z = √(R² + X_C²)。オームの法則もいつもどおり。"},"narr":{"start":{"co":1,"a1d":0,"a2d":0,"a3d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①$-jX_C$\n②ベクトルで足す\n③大きさ\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"抵抗とコンデンサの直列回路です。RL 直列回路と比べて、〖違うのは1か所だけ〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R","C"]},{"text":"$R$ は右向きにかきます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a1","emph":["R","A1"]},{"text":"コンデンサは $-jX_C$ です。$R$ の先から、〖下向き〗にかきます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a2","emph":["C","A2","R","A1"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"2 つをベクトルで足すと、$\\dot{Z}$ は〖右下向き〗になります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"move":"a3","emph":["A1","A2","A3","R","C"],"eq":[{"cont":false,"items":[["\\dot{Z} = R - jX_C"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"大きさは、三平方の定理で出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":3,"emph":["A3","R","C","A1","A2"],"eq":[{"cont":false,"items":[["Z = \\sqrt{R^2 + X_C^2}"]]}]},{"text":"〖オームの法則も、いつもどおり〗使えます。","at":{"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{Z}"]]}],"ans":true,"emph":["I","A3","R","C","src","A1","A2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s5ztL","u31s5ztw1"],"zlo":["u31s5ztRw","u31s5ztw3"],"zmid":["u31s5ztw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a1":{"to":{"a1d":1},"dur":0.6},"a2":{"to":{"a2d":1},"dur":0.6},"a3":{"to":{"a3d":1},"dur":0.8}},"route":["$-jX_C$","ベクトルで足す","大きさ"]}},{"id":"t31s5x","scene":"t31s5x","kind":"u31s5zt","lab":{"src":"{V}=175 V","r":"{R}=20 Ω","c":"{X}_C=15 Ω","i":["{I}","{I}=7 A"],"a1":"20","a1l":20,"a1g":0,"a2":"15","a2o":"a1","a2l":15,"a2g":-90,"a3":["{Z}","{Z}=25 Ω"],"a3l":25,"a3g":-36.87},"viewbox":"232 260 828 1116","band":{"want":"電流の大きさ $I$","known":"$V = 175\\,\\mathrm{V},\\;\\; R = 20\\,\\Omega,\\;\\; X_C = 15\\,\\Omega$","ans":"$I = 7\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"a3v":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、電流の大きさ $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①$Z$ の大きさ\n②$I = V/Z$\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","A3","I"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"大きさを求めるので、先に〖$Z$ の大きさ〗を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["A3"],"eq":[{"cont":false,"items":[["\\dot{Z} = 20 - j15"],["Z = \\sqrt{20^2 + 15^2} = 25\\,\\Omega"]]}],"move":"z","emphPre":["A1","A2","A3"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電圧を $Z$ で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","src","A3"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{Z}"],["= \\dfrac{175}{25} = 7\\,\\mathrm{A}"]]}],"move":"i","ans":true,"emphPre":["src","A3","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s5ztL","u31s5ztw1"],"zlo":["u31s5ztRw","u31s5ztw3"],"zmid":["u31s5ztw2"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"z":{"to":{"a3v":1},"dur":0.5},"i":{"to":{"iv":1},"dur":0.5}},"route":["$Z$ の大きさ","$I = V/Z$"]}},{"id":"t31s6e","scene":"t31s6e","kind":"u31s6zt","lab":{"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}","a1":"{R}","a1l":12,"a1g":0,"a2":"{X}_L","a2o":"a1","a2l":14,"a2g":90,"a4":"{X}_C","a4o":"a2","a4l":9,"a4g":-90,"a4x":0.03,"a5":"{X}_L-{X}_C","a5o":"a1","a5l":5,"a5g":90,"a5c":"red","a5x":-0.03,"a3":"{Z}","a3l":13,"a3g":22.62},"viewbox":"324 254 828 1122","band":{"want":"RLC 直列回路のインピーダンス","ans":"$\\dot{Z} = R + j(X_L - X_C)$","full":"jX_L は上向き、−jX_C は下向きで同じ直線の上にあるので打ち消し合う。大きい方から小さい方を引いて Ż = R + j(X_L − X_C)。大きさは √(R² + (X_L − X_C)²)。X_C が大きければ右下向き。"},"narr":{"start":{"co":1,"a1d":0,"a2d":0,"a4d":0,"a5d":0,"a3d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①上向きと下向き\n②打ち消す\n③大きさ\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"抵抗・コイル・コンデンサの直列回路です。$R$ は右向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"a1","emph":["R","A1"]},{"text":"$jX_L$ は上向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a2","emph":["L","A2"]},{"text":"$-jX_C$ は下向きです。〖$X_L$ の先から、下へ〗かきます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a4","emph":["C","A4","L","A2"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"上向きと下向きは同じ直線の上にあるので、〖打ち消し合います〗。大きい方から小さい方を引きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"move":"a5","emph":["A5","R","L","C","A1","A2","A4"],"eq":[{"cont":false,"items":[["\\dot{Z} = R + j(X_L - X_C)"]]}]},{"text":"$X_L$ の方が大きいので、〖上向きが残ります〗。$\\dot{Z}$ は右上向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a3","emph":["A1","A5","A3","R","L","A2"]},{"text":"$X_C$ の方が大きい時は、下向きが残り、〖右下向き〗になります。","at":{"強調":1.0},"after":[],"emph":["A4","L","C","A2"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"大きさは、三平方の定理で出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":3,"emph":["A3","R","L","C","A1","A2","A4","A5"],"eq":[{"cont":false,"items":[["Z = \\sqrt{R^2 + (X_L - X_C)^2}"]]}]},{"text":"コイルとコンデンサは、打ち消し合います。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["L","C","R","A1","A2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s6ztL","u31s6ztw1"],"zlo":["u31s6ztRw","u31s6ztw4"],"zmid":["u31s6ztw2"],"zmid2":["u31s6ztw3"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a1":{"to":{"a1d":1},"dur":0.5},"a2":{"to":{"a2d":1},"dur":0.5},"a4":{"to":{"a4d":1},"dur":0.5},"a5":{"to":{"a5d":1},"dur":0.6},"a3":{"to":{"a3d":1},"dur":0.8}},"route":["上向きと下向き","打ち消す","大きさ"]}},{"id":"t31s6x","scene":"t31s6x","kind":"u31s6zt","lab":{"src":"{V}","r":"{R}=12 Ω","l":"{X}_L=14 Ω","c":"{X}_C=9 Ω","i":"{I}","a1":"12","a1l":12,"a1g":0,"a2":"14","a2o":"a1","a2l":14,"a2g":90,"a4":"9","a4o":"a2","a4l":9,"a4g":-90,"a4x":0.03,"a5":["{X}_L-{X}_C","5"],"a5o":"a1","a5l":5,"a5g":90,"a5c":"red","a5x":-0.03,"a3":["{Z}","{Z}=13 Ω"],"a3l":13,"a3g":22.62},"viewbox":"324 254 828 1122","band":{"want":"インピーダンスの大きさ $Z$","known":"$R = 12\\,\\Omega,\\;\\; X_L = 14\\,\\Omega,\\;\\; X_C = 9\\,\\Omega$","ans":"$Z = 13\\,\\Omega$"},"narr":{"start":{"co":1,"a5d":0,"a3d":0,"a5v":0,"a3v":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、インピーダンスの大きさ $Z$ です。","at":{"強調":1.0},"after":[],"emph":["A3"]},{"text":"①打ち消す\n②三平方の定理\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"上向きの 14 と下向きの 9 は打ち消し合い、〖上向きに 5 が残ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["A5"],"eq":[{"cont":false,"items":[["\\dot{Z} = 12 + j(14 - 9)"],["= 12 + j5"]]}],"move":"a5","emphPre":["A2","A4"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"三平方の定理で大きさを出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["A3"],"eq":[{"cont":false,"items":[["Z = \\sqrt{12^2 + 5^2}"],["= \\sqrt{169} = 13\\,\\Omega"]]}],"move":"z","ans":true,"emphPre":["A1","A5"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s6ztL","u31s6ztw1"],"zlo":["u31s6ztRw","u31s6ztw4"],"zmid":["u31s6ztw2"],"zmid2":["u31s6ztw3"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"a5":{"to":{"a5d":1,"a5v":1},"dur":0.6},"z":{"to":{"a3d":1,"a3v":1},"dur":0.8}},"route":["打ち消す","三平方の定理"]}},{"id":"t31s7e","scene":"t31s7e","kind":"u31s7zt","lab":{"src":"{V}","r":"{R}","l":"{X}_L","c":"{X}_C","i":"{I}","a1":"{R}","a1l":15,"a1g":0,"a5":"+20","a5o":"a1","a5l":20,"a5g":90,"a5c":"red","a4":"-20","a4o":"a1","a4l":20,"a4g":-90,"a4k":"dash","a3":"{Z}","a3l":25,"a3g":53.13,"a6":"{Z}","a6l":25,"a6g":-53.13,"a6c":"blue","a6k":"dash"},"viewbox":"232 254 863 1122","band":{"want":"X の2つの答えから1つを選ぶ","ans":"$X = X_L - X_C = \\pm\\sqrt{Z^2 - R^2}$。遅れなら $X_L > X_C$、進みなら $X_C > X_L$","full":"Z = V/I を出し、Z² = R² + (X_L − X_C)²。X_L − X_C は ± の2つになり、どちらも大きさの条件を満たす。電流が遅れていれば X_L が大きい方（右上向き・RL と同じ形）、進んでいれば X_C が大きい方（右下向き・RC と同じ形）。"},"narr":{"start":{"co":1,"a1d":1,"a5d":0,"a4d":0,"a3d":0,"a6d":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"①2 乗の式\n②± の2つ\n③遅れか進みか\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電圧と電流から $Z = \\dfrac{V}{I}$ が出ます。$X_L - X_C$ を $X$ と置きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["src","I","L","C","R","A1"],"eq":[{"cont":false,"items":[["Z^2 = R^2 + X^2"],["X^2 = Z^2 - R^2"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"2 乗して出した $X$ は、〖プラスとマイナスの2つ〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["A1","R"],"eq":[{"cont":false,"items":[["X = \\pm\\sqrt{Z^2 - R^2}"]]}],"emphPre":["A1","R"]},{"text":"プラスなら $X_L$ の方が大きく、上向きが残ります。$\\dot{Z}$ は右上向きで、RL 直列回路と同じ形です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"up","emph":["A5","A3","R","L"]},{"text":"マイナスなら $X_C$ の方が大きく、下向きが残ります。$\\dot{Z}$ は右下向きで、RC 直列回路と同じ形です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"dn","emph":["A4","A6","L","C","A3"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"どちらも、電圧と電流の大きさの条件を満たします。〖大きさだけでは決まりません〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["A3","A6"]},{"text":"〖電流が電圧より遅れていれば $X_L$ が大きい方〗、進んでいれば $X_C$ が大きい方を選びます。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A3","A6","L","C"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s7ztL","u31s7ztw1"],"zlo":["u31s7ztRw","u31s7ztw4"],"zmid":["u31s7ztw2"],"zmid2":["u31s7ztw3"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"up":{"to":{"a5d":1,"a3d":1},"dur":0.8},"dn":{"to":{"a4d":1,"a6d":1},"dur":0.8}},"route":["2 乗の式","± の2つ","遅れか進みか"]}},{"id":"t31s7x","scene":"t31s7x","kind":"u31s7zt","lab":{"src":"{V}=100 V","r":"{R}=15 Ω","l":"{X}_L=30 Ω","c":["{X}_C","{X}_C=10 Ω"],"i":"{I}=4 A","a1":"15","a1l":15,"a1g":0,"a5":"+20","a5o":"a1","a5l":20,"a5g":90,"a5c":"red","a4":"-20","a4o":"a1","a4l":20,"a4g":-90,"a4k":"dash","a3":"{Z}","a3l":25,"a3g":53.13,"a6":"{Z}","a6l":25,"a6g":-53.13,"a6c":"blue","a6k":"dash"},"viewbox":"232 254 863 1122","band":{"want":"容量性リアクタンス $X_C$（電流は電圧より遅れている）","known":"$V = 100\\,\\mathrm{V},\\;\\; I = 4\\,\\mathrm{A},\\;\\; R = 15\\,\\Omega,\\;\\; X_L = 30\\,\\Omega$","ans":"$X_C = 10\\,\\Omega$"},"narr":{"start":{"co":1,"a5d":0,"a4d":0,"a3d":0,"a6d":0,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"求めるのは、容量性リアクタンス $X_C$ です。電流は電圧より遅れています。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"①$Z$ の大きさ\n②± の2つ\n③遅れで選ぶ\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電圧と電流が分かっているので、〖先に $Z$ を出します〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["src","I"],"eq":[{"cont":false,"items":[["Z = \\dfrac{V}{I} = \\dfrac{100}{4} = 25\\,\\Omega"]]}]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"$X = X_L - X_C$ と置きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["A5","A4","L","C"],"eq":[{"cont":false,"items":[["25^2 = 15^2 + X^2"],["X^2 = 625 - 225 = 400"],["X = \\pm 20"]]}],"move":"two","emphPre":["R","L","C"]},{"text":"$30 - X_C = 20$ なら $X_C = 10\\,\\Omega$、$30 - X_C = -20$ なら $X_C = 50\\,\\Omega$ です。","at":{"強調":1.0},"after":[],"emph":["A3","A6","L","C"]}]},{"cap":null,"eqp":null,"vid":[18],"sents":[{"text":"電流が遅れているので、〖$X_L$ の方が大きい方〗です。$\\dot{Z}$ は右上向きです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["C","L","A6","A3"],"eq":[{"cont":false,"items":[["X_C = 10\\,\\Omega"]]}],"move":"c","ans":true,"emphPre":["A3","L","A6"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u31s7ztL","u31s7ztw1"],"zlo":["u31s7ztRw","u31s7ztw4"],"zmid":["u31s7ztw2"],"zmid2":["u31s7ztw3"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Ax":["paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"S2":["ps2x1t0","ps2x1t1"],"S3":["ps3x1t0","ps3x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"two":{"to":{"a5d":1,"a4d":1,"a3d":1,"a6d":1},"dur":1.0},"c":{"to":{"cv":1},"dur":0.5}},"route":["$Z$ の大きさ","± の2つ","遅れで選ぶ"]}}],"secs":[{"ex":{"text":"図のように、$15\\,\\Omega$ の抵抗と、誘導性リアクタンス $8\\,\\Omega$ のコイルを直列につないだ。回路のインピーダンスの大きさは何 Ω か。","fig":{"kind":"u31s1zt","L":{"src":"{V}","r":"{R}=15 Ω","l":"{X}_L=8 Ω","i":"{I}","a1":"15","a1l":15,"a1g":0,"a2":"8","a2o":"a1","a2l":8,"a2g":90,"a3":"{Z}","a3l":17,"a3g":28.07},"P":{}},"ch":[{"t":"$23\\,\\Omega$","v":23,"why":"数字のまま足した。上向きの 8 なので、ベクトルで足す"},{"t":"$7\\,\\Omega$","v":7,"why":"引いた。直角三角形の斜めの辺を出す"},{"t":"$17\\,\\Omega$","v":17,"why":""},{"t":"$289\\,\\Omega$","v":289,"why":"2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}],"ans":2}},{"ex":{"text":"図のように、$12\\,\\Omega$ の抵抗と、誘導性リアクタンス $9\\,\\Omega$ のコイルを直列につないだ回路に、$4\\,\\mathrm{A}$ の電流が流れている。電源電圧の大きさは何 V か。","fig":{"kind":"u31s2zt","L":{"src":"{V}","r":"{R}=12 Ω","l":"{X}_L=9 Ω","i":"{I}=4 A","a1":"12","a1l":12,"a1g":0,"a2":"9","a2o":"a1","a2l":9,"a2g":90,"a3":"{Z}","a3l":15,"a3g":36.87},"P":{}},"ch":[{"t":"$84\\,\\mathrm{V}$","v":84,"why":"12 と 9 を数字のまま足した。ベクトルで足す"},{"t":"$60\\,\\mathrm{V}$","v":60,"why":""},{"t":"$12\\,\\mathrm{V}$","v":12,"why":"12 と 9 を引いた"},{"t":"$900\\,\\mathrm{V}$","v":900,"why":"2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}],"ans":1}},{"ex":{"text":"図のように、$12\\,\\Omega$ の抵抗と、誘導性リアクタンス $16\\,\\Omega$ のコイルを直列につないだ回路に、$2\\,\\mathrm{A}$ の電流が流れている。電源電圧の大きさは何 V か。","fig":{"kind":"u31s3vt","L":{"src":"{V}","r":"{R}=12 Ω","l":"{X}_L=16 Ω","i":"{I}=2 A","vr":"{V}_R","vl":"{V}_L","ref":true,"a1":"{I}","a1dot":true,"a1l":10,"a1g":0,"a2":"{V}_R","a2dot":true,"a2l":24,"a2g":0,"a2y":-0.04,"a4":"{V}_L","a4dot":true,"a4o":"a2","a4l":32,"a4g":90,"a4c":"red","a3":"{V}","a3dot":true,"a3l":40,"a3g":53.13},"P":{}},"ch":[{"t":"$40\\,\\mathrm{V}$","v":40,"why":""},{"t":"$56\\,\\mathrm{V}$","v":56,"why":"24 V と 32 V を数字のまま足した。ベクトルで足す"},{"t":"$8\\,\\mathrm{V}$","v":8,"why":"引いた"},{"t":"$1600\\,\\mathrm{V}$","v":1600,"why":"2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}],"ans":0}},{"ex":{"text":"図のように、$3\\,\\Omega$ の抵抗と、誘導性リアクタンス $4\\,\\Omega$ のコイルを直列につなぎ、$\\dot{V} = 75\\,\\mathrm{V}$ の交流電源につないだ。電流のベクトル $\\dot{I}$［A］はどれか。","fig":{"kind":"u31s4vi","L":{"src":"{V}=75 V","r":"{R}=3 Ω","l":"{X}_L=4 Ω","i":"{I}","ref":true,"a1":"{V}","a1dot":true,"a1l":75,"a1g":0,"a2":null,"a2dot":true,"a2l":45,"a2g":-53.13},"P":{}},"ch":[{"t":"$\\dot{I} = 9 + j12$","v":"9,12","why":"分母と分子に $3 - j4$ を掛けるので、虚数の成分はマイナス"},{"t":"$\\dot{I} = 25 - j18.75$","v":"25,-18.75","why":"抵抗とコイルで別々に割った。直列なので $\\dot{Z} = 3 + j4$ で割る"},{"t":"$\\dot{I} = 12 - j9$","v":"12,-9","why":"実数と虚数を取り違えた"},{"t":"$\\dot{I} = 9 - j12$","v":"9,-12","why":""}],"ans":3}},{"ex":{"text":"図のように、$20\\,\\Omega$ の抵抗と、容量性リアクタンス $15\\,\\Omega$ のコンデンサを直列につなぎ、実効値 $175\\,\\mathrm{V}$ の交流電源につないだ。流れる電流の大きさは何 A か。","fig":{"kind":"u31s5zt","L":{"src":"{V}=175 V","r":"{R}=20 Ω","c":"{X}_C=15 Ω","i":"{I}","a1":"20","a1l":20,"a1g":0,"a2":"15","a2o":"a1","a2l":15,"a2g":-90,"a3":"{Z}","a3l":25,"a3g":-36.87},"P":{}},"ch":[{"t":"$5\\,\\mathrm{A}$","v":5,"why":"20 と 15 を数字のまま足した。ベクトルで足す"},{"t":"$35\\,\\mathrm{A}$","v":35,"why":"20 から 15 を引いた。$-j$ は向きを表し、引き算ではない"},{"t":"$7\\,\\mathrm{A}$","v":7,"why":""},{"t":"$8.75\\,\\mathrm{A}$","v":8.75,"why":"抵抗だけで割った"}],"ans":2}},{"ex":{"text":"図のように、$12\\,\\Omega$ の抵抗、誘導性リアクタンス $14\\,\\Omega$ のコイル、容量性リアクタンス $9\\,\\Omega$ のコンデンサを直列につないだ。回路のインピーダンスの大きさは何 Ω か。","fig":{"kind":"u31s6zt","L":{"src":"{V}","r":"{R}=12 Ω","l":"{X}_L=14 Ω","c":"{X}_C=9 Ω","i":"{I}","a1":"12","a1l":12,"a1g":0,"a2":"14","a2o":"a1","a2l":14,"a2g":90,"a4":"9","a4o":"a2","a4l":9,"a4g":-90,"a4x":0.03,"a5":"{X}_L-{X}_C","a5o":"a1","a5l":5,"a5g":90,"a5c":"red","a5x":-0.03,"a3":"{Z}","a3l":13,"a3g":22.62},"P":{}},"ch":[{"t":"$35\\,\\Omega$","v":35,"why":"全部を数字のまま足した。ベクトルで足す"},{"t":"$17\\,\\Omega$","v":17,"why":"12 と 5 を数字のまま足した。三平方の定理で出す"},{"t":"$13\\,\\Omega$","v":13,"why":""},{"t":"$169\\,\\Omega$","v":169,"why":"2 乗して足したまま。$\\sqrt{\\;\\;}$ をとる"}],"ans":2}},{"ex":{"text":"図のように、$15\\,\\Omega$ の抵抗、誘導性リアクタンス $30\\,\\Omega$ のコイル、コンデンサを直列につなぎ、実効値 $100\\,\\mathrm{V}$ の交流電源につないだ。電流は $4\\,\\mathrm{A}$ で、電圧より遅れていた。コンデンサの容量性リアクタンスは何 Ω か。","fig":{"kind":"u31s7zt","L":{"src":"{V}=100 V","r":"{R}=15 Ω","l":"{X}_L=30 Ω","c":"{X}_C","i":"{I}=4 A"},"P":{}},"ch":[{"t":"$50\\,\\Omega$","v":50,"why":"電流が進む方の答え。遅れなら $X_L$ の方が大きい"},{"t":"$10\\,\\Omega$","v":10,"why":""},{"t":"$20\\,\\Omega$","v":20,"why":"$X_L - X_C$ の大きさを答えた"},{"t":"$25\\,\\Omega$","v":25,"why":"インピーダンスの大きさを答えた"}],"ans":1}}],"past":[]}};
});
