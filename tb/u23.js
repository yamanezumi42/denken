/* 単元23「磁気回路」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(23, function(H){
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
// ---- 23-1 起磁力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u23_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U23S1K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU23s1co(d, p, L){ tbFig_Draw(d, p, L, U23S1K.co); }
// ---- 23-2 磁気抵抗 の図（※ textbook/gen/make_section.py が textbook/gen/data/u23_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U23S2K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":290,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU23s2co(d, p, L){ tbFig_Draw(d, p, L, U23S2K.co); }
// ---- 23-3 磁気回路のオームの法則 の図（※ textbook/gen/make_section.py が textbook/gen/data/u23_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U23S3K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[650,320],[1110,320],[1110,720],[650,720]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[606,442],[694,418]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[606,472],[694,448]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[606,502],[694,478]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[606,532],[694,508]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[606,562],[694,538]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[606,592],[694,568]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[606,622],[694,598]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[592,500,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":592,"y":500,"anc":"end"},{"f":"ln","id":"ld0","pts":[[606,622],[450,622]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[606,428],[450,428]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":460,"y0":428,"x1":550,"y1":428,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[505,396,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":505,"y":396,"anc":"middle"},{"f":"ln","id":"phl","pts":[[650,320],[1110,320],[1110,720],[650,720]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":862,"y0":320,"x1":898,"y1":320,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":862,"y0":320,"x1":898,"y1":320},"ccw":{"x0":898,"y0":320,"x1":862,"y1":320}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":1110,"y0":502,"x1":1110,"y1":538,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":1110,"y0":502,"x1":1110,"y1":538},"ccw":{"x0":1110,"y0":538,"x1":1110,"y1":502}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":898,"y0":720,"x1":862,"y1":720,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":898,"y0":720,"x1":862,"y1":720},"ccw":{"x0":862,"y0":720,"x1":898,"y1":720}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":650,"y0":538,"x1":650,"y1":502,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":650,"y0":538,"x1":650,"y1":502},"ccw":{"x0":650,"y0":502,"x1":650,"y1":538}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[960,248,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":960,"y":248,"anc":"middle"},{"f":"ln","id":"ll","pts":[[650,320],[1110,320],[1110,720],[650,720]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[1168,600,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":1168,"y":600,"anc":"start"},{"f":"ln","id":"sq","pts":[[754,286],[806,286],[820,354],[768,354]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[780,248,"middle",[0,-1]],[720,252,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":780,"y":248,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[880,792,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":880,"y":792,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[880,520,"middle",[0,-1]],[880,848,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":880,"y":520,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[606,430],[694,410]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[606,472],[694,452]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[606,514],[694,494]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[606,556],[694,536]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[606,598],[694,578]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[606,640],[694,620]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[606,430],[694,410]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[606,449.09],[694,429.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[606,468.18],[694,448.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[606,487.27],[694,467.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[606,506.36],[694,486.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[606,525.45],[694,505.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[606,544.55],[694,524.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[606,563.64],[694,543.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[606,582.73],[694,562.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[606,601.82],[694,581.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[606,620.91],[694,600.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[606,640],[694,620]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[606,430],[694,410]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[606,439.13],[694,419.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[606,448.26],[694,428.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[606,457.39],[694,437.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[606,466.52],[694,446.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[606,475.65],[694,455.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[606,484.78],[694,464.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[606,493.91],[694,473.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[606,503.04],[694,483.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[606,512.17],[694,492.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[606,521.3],[694,501.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[606,530.43],[694,510.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[606,539.57],[694,519.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[606,548.7],[694,528.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[606,557.83],[694,537.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[606,566.96],[694,546.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[606,576.09],[694,556.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[606,585.22],[694,565.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[606,594.35],[694,574.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[606,603.48],[694,583.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[606,612.61],[694,592.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[606,621.74],[694,601.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[606,630.87],[694,610.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[606,640],[694,620]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[450,428],[406,428]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[450,622],[406,622]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":420,"y0":616,"x1":420,"y1":434,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":420,"y0":616,"x1":420,"y1":434},"along":{"x0":420,"y0":434,"x1":420,"y1":616}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[402,525,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":402,"y":525,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[900,490,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":900,"y":490,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[900,560,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":900,"y":560,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  mc: {"vars":[],"items":[{"t":"w","id":"u23s3mcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u23s3mcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u23s3mcw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u23s3mcw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"r","k":"rm","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,329.5,null]},{"t":"i","k":"phi","x0":478,"y0":500,"x1":478,"y1":460,"lab":[493.71,480,"start"],"vis":[],"ax":"v","sd":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","rm","P","N",1,[]]]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u23s3swx1L","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u23s3swx1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u23s3swx1w1","pts":[[478,360],[731.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u23s3swx1w2","pts":[[791.5,360],[1045,360]],"vis":[2],"dash":0},{"f":"ln","id":"core","pts":[[650,320],[1110,320],[1110,720],[650,720]],"w":76,"close":1,"col":"#ced4da","vis":[1],"t":"F"},{"f":"ln","id":"cw0","pts":[[606,442],[694,418]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[606,472],[694,448]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[606,502],[694,478]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[606,532],[694,508]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[606,562],[694,538]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[606,592],[694,568]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[606,622],[694,598]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[592,500,"end",[-1,0]]],"need":"n","vis":[1],"t":"F","x":592,"y":500,"anc":"end"},{"f":"ln","id":"ld0","pts":[[606,622],[450,622]],"w":3,"vis":[1],"t":"F"},{"f":"ln","id":"ld1","pts":[[606,428],[450,428]],"w":3,"vis":[1],"t":"F"},{"f":"ar","id":"ia","x0":460,"y0":428,"x1":550,"y1":428,"w":4,"need":"i","col":"#1971c2","vis":[1],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[505,396,"middle",[0,-1]]],"need":"i","vis":[1],"t":"F","x":505,"y":396,"anc":"middle"},{"f":"ln","id":"phl","pts":[[650,320],[1110,320],[1110,720],[650,720]],"dash":1,"w":3,"close":1,"need":"phi","vis":[1],"t":"F"},{"f":"ar","id":"phh0","x0":862,"y0":320,"x1":898,"y1":320,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":862,"y0":320,"x1":898,"y1":320},"ccw":{"x0":898,"y0":320,"x1":862,"y1":320}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"ar","id":"phh1","x0":1110,"y0":502,"x1":1110,"y1":538,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":1110,"y0":502,"x1":1110,"y1":538},"ccw":{"x0":1110,"y0":538,"x1":1110,"y1":502}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"ar","id":"phh2","x0":898,"y0":720,"x1":862,"y1":720,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":898,"y0":720,"x1":862,"y1":720},"ccw":{"x0":862,"y0":720,"x1":898,"y1":720}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"ar","id":"phh3","x0":650,"y0":538,"x1":650,"y1":502,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":650,"y0":538,"x1":650,"y1":502},"ccw":{"x0":650,"y0":502,"x1":650,"y1":538}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[960,248,"middle",[0,-1]]],"need":"phi","vis":[1],"t":"F","x":960,"y":248,"anc":"middle"},{"f":"ln","id":"ll","pts":[[650,320],[1110,320],[1110,720],[650,720]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[1],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[1168,600,"start",[1,0]]],"need":"l","vis":[1],"t":"F","x":1168,"y":600,"anc":"start"},{"f":"ln","id":"sq","pts":[[754,286],[806,286],[820,354],[768,354]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[1],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[780,248,"middle",[0,-1]],[720,252,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[1],"t":"F","x":780,"y":248,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[880,792,"middle",[0,1]]],"need":"mu","vis":[1],"t":"F","x":880,"y":792,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[880,520,"middle",[0,-1]],[880,848,"middle",[0,1]]],"need":"rm","vis":[1],"t":"F","x":880,"y":520,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[606,430],[694,410]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[606,472],[694,452]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[606,514],[694,494]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[606,556],[694,536]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[606,598],[694,578]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[606,640],[694,620]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[606,430],[694,410]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[606,449.09],[694,429.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[606,468.18],[694,448.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[606,487.27],[694,467.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[606,506.36],[694,486.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[606,525.45],[694,505.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[606,544.55],[694,524.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[606,563.64],[694,543.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[606,582.73],[694,562.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[606,601.82],[694,581.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[606,620.91],[694,600.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[606,640],[694,620]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[606,430],[694,410]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[606,439.13],[694,419.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[606,448.26],[694,428.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[606,457.39],[694,437.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[606,466.52],[694,446.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[606,475.65],[694,455.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[606,484.78],[694,464.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[606,493.91],[694,473.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[606,503.04],[694,483.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[606,512.17],[694,492.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[606,521.3],[694,501.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[606,530.43],[694,510.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[606,539.57],[694,519.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[606,548.7],[694,528.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[606,557.83],[694,537.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[606,566.96],[694,546.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[606,576.09],[694,556.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[606,585.22],[694,565.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[606,594.35],[694,574.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[606,603.48],[694,583.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[606,612.61],[694,592.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[606,621.74],[694,601.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[606,630.87],[694,610.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[606,640],[694,620]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"ee1","pts":[[450,428],[406,428]],"w":2,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ln","id":"ee2","pts":[[450,622],[406,622]],"w":2,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ar","id":"ea","x0":420,"y0":616,"x1":420,"y1":434,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":420,"y0":616,"x1":420,"y1":434},"along":{"x0":420,"y0":434,"x1":420,"y1":616}},"dflt":"oppose","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[402,525,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[1],"t":"F","x":402,"y":525,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[900,490,"middle",[0,-1]]],"need":"ind","vis":[1],"t":"F","x":900,"y":490,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[900,560,"middle",[0,1]]],"need":"w","vis":[1],"t":"F","x":900,"y":560,"anc":"middle"},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,608.19,null],"n":"srcx1"},{"t":"r","k":"rm","x":761.5,"y":360,"dir":"h","vis":[2],"lab":[761.5,325.71,null],"n":"rmx1"},{"t":"i","k":"phi","x0":478,"y0":500,"x1":478,"y1":460,"lab":[494.1,480,"start"],"vis":[2],"ax":"v","sd":1,"n":"phix1"}],"flows":[{"c":[2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L1:P","L1:N",1,[2]],["R","rm","L1:P","L1:N",1,[2]]]}
};
function tbU23s3co(d, p, L){ tbFig_Draw(d, p, L, U23S3K.co); }
function tbU23s3mc(d, p, L){ tbGen_Draw(d, p, L, U23S3K.mc); }
function tbU23s3sw(d, p, L){ tbFig_Draw(d, p, L, U23S3K.sw); }
// ---- 23-4 磁気抵抗の単位 の図（※ textbook/gen/make_section.py が textbook/gen/data/u23_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U23S4K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU23s4co(d, p, L){ tbFig_Draw(d, p, L, U23S4K.co); }
// ---- 23-5 エアギャップ の図（※ textbook/gen/make_section.py が textbook/gen/data/u23_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U23S5K = {
  cg: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"gapc","pts":[[760,404],[760,436]],"w":80,"o":["gapd"],"col":"#ffffff","vis":[],"t":"F"},{"f":"lb","id":"gapt","k":"gap","bases":[[818,360,"start",[1,-1]]],"need":"gap","vis":[],"t":"F","x":818,"y":360,"anc":"start"},{"f":"ar","id":"gld","x0":838,"y0":404,"x1":838,"y1":436,"two":1,"w":2,"need":"gl","vis":[],"t":"F"},{"f":"lb","id":"glt","k":"gl","bases":[[858,440,"start",[1,0]]],"need":"gl","vis":[],"t":"F","x":858,"y":440,"anc":"start"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":290,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ms: {"vars":[],"items":[{"t":"w","id":"u23s5msL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u23s5msRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u23s5msw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u23s5msw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u23s5msw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,329.5,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[893.67,329.5,null]},{"t":"i","k":"phi","x0":478,"y0":500,"x1":478,"y1":460,"lab":[493.71,480,"start"],"vis":[],"ax":"v","sd":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u23s5swx1L","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u23s5swx1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u23s5swx1w1","pts":[[478,360],[615.33,360]],"vis":[2],"dash":0},{"t":"w","id":"u23s5swx1w2","pts":[[675.33,360],[847.67,360]],"vis":[2],"dash":0},{"t":"w","id":"u23s5swx1w3","pts":[[907.67,360],[1045,360]],"vis":[2],"dash":0},{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[1],"t":"F"},{"f":"ln","id":"gapc","pts":[[760,404],[760,436]],"w":80,"o":["gapd"],"col":"#ffffff","vis":[1],"t":"F"},{"f":"lb","id":"gapt","k":"gap","bases":[[818,360,"start",[1,-1]]],"need":"gap","vis":[1],"t":"F","x":818,"y":360,"anc":"start"},{"f":"ar","id":"gld","x0":838,"y0":404,"x1":838,"y1":436,"two":1,"w":2,"need":"gl","vis":[1],"t":"F"},{"f":"lb","id":"glt","k":"gl","bases":[[858,440,"start",[1,0]]],"need":"gl","vis":[1],"t":"F","x":858,"y":440,"anc":"start"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[1],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[1],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[1],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[1],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[1],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[1],"t":"F","x":155,"y":290,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[1],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[1],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[1],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[1],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[1],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[1],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[1],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[1],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[1],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[1],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[1],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[1],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[1],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[1],"t":"F","x":550,"y":460,"anc":"middle"},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,615.28,null],"n":"srcx1"},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[2],"lab":[645.33,317.8,null],"n":"r1x1"},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[2],"lab":[821.67,402.2,null],"n":"r2x1"},{"t":"i","k":"phi","x0":478,"y0":500,"x1":478,"y1":460,"lab":[494.92,480,"start"],"vis":[2],"ax":"v","sd":1,"n":"phix1"}],"flows":[{"c":[2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L1:P","L1:N",1,[2]],["R","r1","L1:P","L1:n1",1,[2]],["R","r2","L1:n1","L1:N",1,[2]]]}
};
function tbU23s5cg(d, p, L){ tbFig_Draw(d, p, L, U23S5K.cg); }
function tbU23s5ms(d, p, L){ tbGen_Draw(d, p, L, U23S5K.ms); }
function tbU23s5sw(d, p, L){ tbFig_Draw(d, p, L, U23S5K.sw); }
var KINDS = {u23s1co: tbU23s1co, u23s2co: tbU23s2co, u23s3co: tbU23s3co, u23s3mc: tbU23s3mc, u23s3sw: tbU23s3sw, u23s4co: tbU23s4co, u23s5cg: tbU23s5cg, u23s5ms: tbU23s5ms, u23s5sw: tbU23s5sw};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 23-1 の図は電流が流れないので載せない,
  // 23-2 の図は電流が流れないので載せない,
  u23s3mc: function(p, L){ return tbGen_Flow(p, L, U23S3K.mc); },
  u23s3sw: function(p, L){ return tbGen_Flow(p, L, U23S3K.sw); },
  // 23-4 の図は電流が流れないので載せない,
  u23s5ms: function(p, L){ return tbGen_Flow(p, L, U23S5K.ms); },
  u23s5sw: function(p, L){ return tbGen_Flow(p, L, U23S5K.sw); }
};

// 23-1 起磁力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u23_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU23s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU23s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU23s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU23s1_par(a, b){ return a * b / (a + b); }
function tbU23s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU23s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU23s1_Qni(r){
  var gcd = tbU23s1_gcd, ratio = tbU23s1_ratio, par = tbU23s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,250,300,400,500,1000]);
    var i = pick(r, [0.5,1,1.5,2,2.5,3,4,5,8,10]);
    var NI = (n * i);
    if (!(i != 1 && nice(n / i))) continue;
    var ok = (NI);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU23s1_three(ok, [{x: (n + i), why: "掛けるところを足した"}, {x: (n / i), why: "巻数を電流で割った"}, {x: (i), why: "巻数を掛けていない（それはコイルの電流）"}, {x: (n), why: "電流を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u23s1ni", text: "鉄心に巻いた巻数 " + fmt(n) + " のコイルに、$" + fmt(i) + "\\,\\mathrm{A}$ の電流を流した。起磁力は何 A か。", fig: {kind: "u23s1co", L: tbU23s1_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["n", "{N}=" + fmt(n)], ["i", "{I}=" + fmt(i) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["起磁力は巻数と電流の積 $NI$", "$NI = " + fmt(n) + " \\times " + fmt(i) + " = " + qv(ok, "A") + "$"], chk: {form: "u23s1ni", p: {n: n, i: i}}};
  }
  throw new Error("u23s1ni：条件に合う数字が見つからない");
}
function tbU23s1_Qi(r){
  var gcd = tbU23s1_gcd, ratio = tbU23s1_ratio, par = tbU23s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,250,400,500]);
    var i = pick(r, [0.5,1,1.5,2,2.5,4,5,8]);
    var NI = (n * i);
    if (!(i != 1 && NI != n && nice(n / NI) && NI - n > 0)) continue;
    var ok = (NI / n);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU23s1_three(ok, [{x: (NI * n), why: "巻数で割るところを掛けた"}, {x: (n / NI), why: "割る順が逆"}, {x: (NI), why: "巻数で割っていない"}, {x: (NI - n), why: "割るところを引いた"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u23s1i", text: "巻数 " + fmt(n) + " のコイルで、$" + fmt(NI) + "\\,\\mathrm{A}$ の起磁力をつくりたい。コイルに流す電流は何 A か。", fig: {kind: "u23s1co", L: tbU23s1_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["n", "{N}=" + fmt(n)], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["起磁力は $NI$ なので $I = \\dfrac{NI}{N}$", "$I = \\dfrac{" + fmt(NI) + "}{" + fmt(n) + "} = " + qv(ok, "A") + "$"], chk: {form: "u23s1i", p: {n: n, i: i}}};
  }
  throw new Error("u23s1i：条件に合う数字が見つからない");
}
function tbU23s1_Qn(r){
  var gcd = tbU23s1_gcd, ratio = tbU23s1_ratio, par = tbU23s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [20,50,100,200,250,400,500]);
    var i = pick(r, [2,4,5,8,10]);
    var NI = (n * i);
    var A = (NI * i);
    var B = (i / NI);
    if (!(nice(B) && B >= 0.001 && distinct([n, A, B, NI]))) continue;
    var _c = choices(r, [{t: "$" + fmt(n) + "$", v: fmt(n)}, {t: "$" + fmt(A) + "$", v: fmt(A), why: "電流で割るところを掛けた"}, {t: "$" + fmt(B) + "$", v: fmt(B), why: "割る順が逆"}, {t: "$" + fmt(NI) + "$", v: fmt(NI), why: "電流で割っていない"}]);
    return {form: "u23s1n", text: "鉄心に巻いたコイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流すと、起磁力は $" + fmt(NI) + "\\,\\mathrm{A}$ だった。コイルの巻数はいくらか。", fig: {kind: "u23s1co", L: tbU23s1_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["n", "{N}"], ["i", "{I}=" + fmt(i) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["起磁力は $NI$ なので $N = \\dfrac{NI}{I}$", "$N = \\dfrac{" + fmt(NI) + "}{" + fmt(i) + "} = " + fmt(n) + "$"], chk: {form: "u23s1n", p: {n: n, i: i}}};
  }
  throw new Error("u23s1n：条件に合う数字が見つからない");
}
function tbU23s1_Qunit(r){
  var gcd = tbU23s1_gcd, ratio = tbU23s1_ratio, par = tbU23s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "A", v: "own"}, {t: "Wb", v: "wb", why: "Wb は磁束の単位"}, {t: "T", v: "t", why: "T は磁束密度の単位"}, {t: "V", v: "v", why: "起磁力は、単位のない巻数と電流［A］の積"}]);
    return {form: "u23s1unit", text: "起磁力の単位はどれか。", fig: {kind: "u23s1co", L: tbU23s1_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["巻数は単位のない数、電流は A", "起磁力 $NI$ の単位は A"], chk: {form: "u23s1unit", p: {}}};
  }
  throw new Error("u23s1unit：条件に合う数字が見つからない");
}
function tbU23s1_Qdef(r){
  var gcd = tbU23s1_gcd, ratio = tbU23s1_ratio, par = tbU23s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁束をつくる源", v: "own"}, {t: "磁束の通りやすさ", v: "mu", why: "磁束の通りやすさを表すのは透磁率"}, {t: "1 m² あたりの磁束", v: "b", why: "1 m² あたりの磁束は磁束密度"}, {t: "コイルに流れる電流", v: "i", why: "起磁力は、電流に巻数を掛けた $NI$"}]);
    return {form: "u23s1def", text: "起磁力とは、□ である。", fig: {kind: "u23s1co", L: tbU23s1_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束をつくる源が起磁力", "コイルでは巻数と電流の積 $NI$"], chk: {form: "u23s1def", p: {}}};
  }
  throw new Error("u23s1def：条件に合う数字が見つからない");
}
// 23-2 磁気抵抗 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u23_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU23s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU23s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU23s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU23s2_par(a, b){ return a * b / (a + b); }
function tbU23s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU23s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU23s2_Qrm(r){
  var gcd = tbU23s2_gcd, ratio = tbU23s2_ratio, par = tbU23s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l = pick(r, [0.1,0.2,0.4,0.5,0.8,1]);
    var a = pick(r, [1,2,4,5]);
    var sk = pick(r, [1,2,4,5,10,20]);
    var s = (sk / 1000);
    var RM = (l * 1000 / (a * s));
    var A = (l * 1000 / a);
    var B = (l * a / (1000 * s));
    var C = (s * 1000 / (a * l));
    if (!(nice(RM) && nice(A) && nice(B) && nice(C) && B >= 0.001 && C >= 0.001 && RM <= 1000000 && distinct([RM, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(RM) + "\\,\\mathrm{H^{-1}}$", v: fmt(RM)}, {t: "$" + fmt(A) + "\\,\\mathrm{H^{-1}}$", v: fmt(A), why: "断面積で割っていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{H^{-1}}$", v: fmt(B), why: "透磁率を分子に置いた（$\\mu$ は分母）"}, {t: "$" + fmt(C) + "\\,\\mathrm{H^{-1}}$", v: fmt(C), why: "長さと断面積を逆に置いた"}]);
    return {form: "u23s2rm", text: "平均磁路長 $" + fmt(l) + "\\,\\mathrm{m}$、断面積 $" + fmt(s) + "\\,\\mathrm{m^2}$、透磁率 $" + fmt(a) + " \\times 10^{-3}\\,\\mathrm{H/m}$ の鉄心の磁気抵抗は何 $\\mathrm{H^{-1}}$ か。", fig: {kind: "u23s2co", L: tbU23s2_fig({"n":"{N}","i":null,"phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}"}, [["l", "{l}=" + fmt(l) + " m"], ["s", "{S}=" + fmt(s) + " m²"], ["mu", "{μ}=" + fmt(a) + "×10⁻³ H/m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_m = \\dfrac{l}{\\mu S}$", "$R_m = \\dfrac{" + fmt(l) + "}{" + fmt(a) + " \\times 10^{-3} \\times " + fmt(s) + "} = " + fmt(RM) + "\\,\\mathrm{H^{-1}}$"], chk: {form: "u23s2rm", p: {l: l, a: a, sk: sk}}};
  }
  throw new Error("u23s2rm：条件に合う数字が見つからない");
}
function tbU23s2_Qratio(r){
  var gcd = tbU23s2_gcd, ratio = tbU23s2_ratio, par = tbU23s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var m = pick(r, [2,3,4,5]);
    var what = (k == 1 ? '断面積' : (k == 2 ? '平均磁路長' : '比透磁率'));
    var m2 = (m * m);
    var gs = (k == 2 ? '' + m : '\\dfrac{1}{' + m + '}');
    var bs = (k == 2 ? '\\dfrac{1}{' + m + '}' : '' + m);
    var why = (k == 1 ? '断面積は分母。大きいほど磁束は通りやすい' : (k == 2 ? '長さは分子。長いほど磁束は通りにくい' : '比透磁率は分母。大きいほど磁束は通りやすい'));
    var _c = choices(r, [{t: "$" + String(gs) + "$ 倍", v: "good"}, {t: "$" + String(bs) + "$ 倍", v: "bad", why: String(why)}, {t: "$" + fmt(m2) + "$ 倍", v: "sq", why: "$R_m = \\dfrac{l}{\\mu S}$ に2乗は無い"}, {t: "$1$ 倍（変わらない）", v: "one", why: "磁気抵抗は、断面積・長さ・透磁率で決まる"}]);
    return {form: "u23s2ratio", text: "ほかは変えずに、" + String(what) + "だけを " + fmt(m) + " 倍にした。磁気抵抗は元の何倍になるか。", fig: {kind: "u23s2co", L: tbU23s2_fig({"n":"{N}","i":null,"phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}"}, [["i", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_m = \\dfrac{l}{\\mu S}$（$\\mu = \\mu_0 \\mu_r$）。" + String(why), "磁気抵抗は $" + String(gs) + "$ 倍"], chk: {form: "u23s2ratio", p: {k: k, m: m}}};
  }
  throw new Error("u23s2ratio：条件に合う数字が見つからない");
}
function tbU23s2_Qmu(r){
  var gcd = tbU23s2_gcd, ratio = tbU23s2_ratio, par = tbU23s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mu_0 \\mu_r$", v: "own"}, {t: "$\\dfrac{\\mu_0}{\\mu_r}$", v: "d", why: "比透磁率は真空中の何倍かを表すので、割らずに掛ける"}, {t: "$\\mu_0 + \\mu_r$", v: "p", why: "足すのでなく、掛ける"}, {t: "$\\dfrac{\\mu_r}{\\mu_0}$", v: "d2", why: "比透磁率は真空中の何倍かを表すので、掛ける"}]);
    return {form: "u23s2mu", text: "真空中の透磁率を $\\mu_0$、鉄心の比透磁率を $\\mu_r$ とすると、鉄心の透磁率 $\\mu$ は □ である。", fig: {kind: "u23s2co", L: tbU23s2_fig({"n":"{N}","i":null,"phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}"}, [["mu", "{μ}_r"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["比透磁率は、真空中の透磁率の何倍かを表す", "$\\mu = \\mu_0 \\mu_r$"], chk: {form: "u23s2mu", p: {}}};
  }
  throw new Error("u23s2mu：条件に合う数字が見つからない");
}
function tbU23s2_Qdef(r){
  var gcd = tbU23s2_gcd, ratio = tbU23s2_ratio, par = tbU23s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁束の通りにくさ", v: "own"}, {t: "磁束の通りやすさ", v: "mu", why: "磁束の通りやすさを表すのは透磁率"}, {t: "磁束をつくる源", v: "ni", why: "磁束をつくる源は起磁力"}, {t: "1 m² あたりの磁束", v: "b", why: "1 m² あたりの磁束は磁束密度"}]);
    return {form: "u23s2def", text: "磁気抵抗とは、□ である。", fig: {kind: "u23s2co", L: tbU23s2_fig({"n":"{N}","i":null,"phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束の通りにくさが磁気抵抗", "$R_m = \\dfrac{l}{\\mu S}$"], chk: {form: "u23s2def", p: {}}};
  }
  throw new Error("u23s2def：条件に合う数字が見つからない");
}
// 23-3 磁気回路のオームの法則 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u23_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU23s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU23s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU23s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU23s3_par(a, b){ return a * b / (a + b); }
function tbU23s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU23s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU23s3_Qphi(r){
  var gcd = tbU23s3_gcd, ratio = tbU23s3_ratio, par = tbU23s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [50,100,200,250,400,500,1000]);
    var i = pick(r, [1,2,4,5,10]);
    var R = pick(r, [100,200,400,500,1000,2000,4000,5000]);
    var P = (n * i / R);
    var A = (R / (n * i));
    var B = (n / R);
    var C = (i / R);
    if (!(nice(P) && nice(A) && nice(B) && nice(C) && A >= 0.001 && C >= 0.001 && distinct([P, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(P) + "\\,\\mathrm{Wb}$", v: fmt(P)}, {t: "$" + fmt(A) + "\\,\\mathrm{Wb}$", v: fmt(A), why: "割る順が逆（磁気抵抗を起磁力で割った）"}, {t: "$" + fmt(B) + "\\,\\mathrm{Wb}$", v: fmt(B), why: "電流を掛けていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{Wb}$", v: fmt(C), why: "巻数を掛けていない"}]);
    return {form: "u23s3phi", text: "鉄心に巻いた巻数 " + fmt(n) + " のコイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流した。鉄心の磁気抵抗が $" + fmt(R) + "\\,\\mathrm{A/Wb}$ のとき、鉄心の中の磁束は何 Wb か。", fig: {kind: "u23s3co", L: tbU23s3_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["n", "{N}=" + fmt(n)], ["i", "{I}=" + fmt(i) + " A"], ["rm", "{R}_m=" + fmt(R) + " A/Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\Phi = \\dfrac{NI}{R_m}$", "$\\Phi = \\dfrac{" + fmt(n) + " \\times " + fmt(i) + "}{" + fmt(R) + "} = " + fmt(P) + "\\,\\mathrm{Wb}$"], chk: {form: "u23s3phi", p: {n: n, i: i, R: R}}};
  }
  throw new Error("u23s3phi：条件に合う数字が見つからない");
}
function tbU23s3_Qi(r){
  var gcd = tbU23s3_gcd, ratio = tbU23s3_ratio, par = tbU23s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,500]);
    var pk = pick(r, [1,2,4,5,10,20,50]);
    var R = pick(r, [1000,2000,4000,5000,10000,20000,50000]);
    var P = (pk / 1000);
    var I = (P * R / n);
    if (!(I >= 0.1 && I <= 20 && nice(I) && nice(P * R) && nice(n / (P * R)) && P * R != n)) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU23s3_three(ok, [{x: (P * R), why: "巻数で割っていない（それは起磁力）"}, {x: (n / (P * R)), why: "割る順が逆"}, {x: (P * R * n), why: "巻数で割るところを掛けた"}, {x: (R / n), why: "磁束を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u23s3i", text: "鉄心の磁気抵抗が $" + fmt(R) + "\\,\\mathrm{A/Wb}$ で、巻数 " + fmt(n) + " のコイルを巻いてある。鉄心の中に $" + fmt(P) + "\\,\\mathrm{Wb}$ の磁束をつくるには、コイルに何 A の電流を流せばよいか。", fig: {kind: "u23s3co", L: tbU23s3_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["n", "{N}=" + fmt(n)], ["i", "{I}"], ["rm", "{R}_m=" + fmt(R) + " A/Wb"], ["phi", "{Φ}=" + fmt(P) + " Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$NI = \\Phi R_m = " + fmt(P) + " \\times " + fmt(R) + " = " + fmt(P * R) + "\\,\\mathrm{A}$", "$I = \\dfrac{" + fmt(P * R) + "}{" + fmt(n) + "} = " + qv(ok, "A") + "$"], chk: {form: "u23s3i", p: {pk: pk, R: R, n: n}}};
  }
  throw new Error("u23s3i：条件に合う数字が見つからない");
}
function tbU23s3_Qrm(r){
  var gcd = tbU23s3_gcd, ratio = tbU23s3_ratio, par = tbU23s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [50,100,200,250,500,1000]);
    var i = pick(r, [1,2,4,5,10]);
    var R = pick(r, [1000,2000,5000,10000,20000,25000,50000]);
    var P = (n * i / R);
    var A = (n * i * P);
    var B = (n * i);
    var C = (i / P);
    if (!(nice(P) && P >= 0.001 && nice(A) && A >= 0.001 && nice(C) && distinct([R, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(R) + "\\,\\mathrm{A/Wb}$", v: fmt(R)}, {t: "$" + fmt(A) + "\\,\\mathrm{A/Wb}$", v: fmt(A), why: "磁束で割るところを掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{A/Wb}$", v: fmt(B), why: "磁束で割っていない（それは起磁力）"}, {t: "$" + fmt(C) + "\\,\\mathrm{A/Wb}$", v: fmt(C), why: "巻数を掛けていない"}]);
    return {form: "u23s3rm", text: "鉄心に巻いた巻数 " + fmt(n) + " のコイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流すと、鉄心の中の磁束は $" + fmt(P) + "\\,\\mathrm{Wb}$ だった。鉄心の磁気抵抗は何 A/Wb か。", fig: {kind: "u23s3co", L: tbU23s3_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["n", "{N}=" + fmt(n)], ["i", "{I}=" + fmt(i) + " A"], ["phi", "{Φ}=" + fmt(P) + " Wb"], ["rm", "{R}_m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_m = \\dfrac{NI}{\\Phi}$", "$R_m = \\dfrac{" + fmt(n) + " \\times " + fmt(i) + "}{" + fmt(P) + "} = " + fmt(R) + "\\,\\mathrm{A/Wb}$"], chk: {form: "u23s3rm", p: {n: n, i: i, R: R}}};
  }
  throw new Error("u23s3rm：条件に合う数字が見つからない");
}
function tbU23s3_Qrole(r){
  var gcd = tbU23s3_gcd, ratio = tbU23s3_ratio, par = tbU23s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var nm = (['起磁力', '磁束', '磁気抵抗'][k - 1]);
    var el = (['起電力（電圧）', '電流', '抵抗']);
    var good = (el[k - 1]);
    var b1 = (el[k % 3]);
    var b2 = (el[(k + 1) % 3]);
    var w1 = (k == 1 ? 'それにあたるのは磁束。起磁力は単位が A でも電流ではない' : 'それにあたるのは' + ['起磁力', '磁束', '磁気抵抗'][k % 3]);
    var w2 = ('それにあたるのは' + ['起磁力', '磁束', '磁気抵抗'][(k + 1) % 3]);
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(b1), v: "b1", why: String(w1)}, {t: String(b2), v: "b2", why: String(w2)}, {t: "導電率", v: "sig", why: "導電率にあたるのは透磁率"}]);
    return {form: "u23s3role", text: "磁気回路を電気回路に置き換えると、" + String(nm) + "は何にあたるか。", fig: {kind: "u23s3co", L: tbU23s3_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"}, [["rm", "{R}_m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["起磁力＝起電力（電圧）、磁束＝電流、磁気抵抗＝抵抗", String(nm) + "は" + String(good) + "にあたる"], chk: {form: "u23s3role", p: {k: k}}};
  }
  throw new Error("u23s3role：条件に合う数字が見つからない");
}
// 23-4 磁気抵抗の単位 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u23_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU23s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU23s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU23s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU23s4_par(a, b){ return a * b / (a + b); }
function tbU23s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU23s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU23s4_Qwhich(r){
  var gcd = tbU23s4_gcd, ratio = tbU23s4_ratio, par = tbU23s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1,2,3,4]);
    var qn = (['起磁力', '磁束', '磁気抵抗', '透磁率', '磁束密度'][k]);
    var un = (['A', 'Wb', 'A/Wb', 'H/m', 'T']);
    var good = (un[k]);
    var w1 = (un[(k + 1) % 5]);
    var w2 = (un[(k + 2) % 5]);
    var w3 = (un[(k + 3) % 5]);
    var y1 = ('それは' + ['起磁力', '磁束', '磁気抵抗', '透磁率', '磁束密度'][(k + 1) % 5] + 'の単位');
    var y2 = ('それは' + ['起磁力', '磁束', '磁気抵抗', '透磁率', '磁束密度'][(k + 2) % 5] + 'の単位');
    var y3 = ('それは' + ['起磁力', '磁束', '磁気抵抗', '透磁率', '磁束密度'][(k + 3) % 5] + 'の単位');
    var how = (['巻数（単位なし）× 電流［A］', '磁束は Wb で表す', '起磁力［A］÷ 磁束［Wb］', '透磁率は H/m で表す', '磁束［Wb］÷ 面積［m²］＝ T'][k]);
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(w1), v: "w1", why: String(y1)}, {t: String(w2), v: "w2", why: String(y2)}, {t: String(w3), v: "w3", why: String(y3)}]);
    return {form: "u23s4which", text: String(qn) + "の単位はどれか。", fig: {kind: "u23s4co", L: tbU23s4_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(how), String(qn) + "の単位は " + String(good)], chk: {form: "u23s4which", p: {k: k}}};
  }
  throw new Error("u23s4which：条件に合う数字が見つからない");
}
function tbU23s4_Qsame(r){
  var gcd = tbU23s4_gcd, ratio = tbU23s4_ratio, par = tbU23s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mathrm{H^{-1}}$", v: "own"}, {t: "H", v: "h", why: "$R_m = \\dfrac{l}{\\mu S}$ から出すと、H の逆数"}, {t: "Wb/A", v: "wba", why: "それは A/Wb の逆数"}, {t: "H/m", v: "hm", why: "H/m は透磁率の単位"}]);
    return {form: "u23s4same", text: "磁気抵抗の単位 A/Wb と同じ単位はどれか。", fig: {kind: "u23s4co", L: tbU23s4_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_m = \\dfrac{l}{\\mu S}$ の単位は $\\dfrac{\\mathrm{m}}{\\mathrm{H/m} \\times \\mathrm{m^2}} = \\mathrm{H^{-1}}$", "A/Wb と $\\mathrm{H^{-1}}$ は同じ"], chk: {form: "u23s4same", p: {}}};
  }
  throw new Error("u23s4same：条件に合う数字が見つからない");
}
function tbU23s4_Qdenom(r){
  var gcd = tbU23s4_gcd, ratio = tbU23s4_ratio, par = tbU23s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mathrm{H \\cdot m}$", v: "own"}, {t: "$\\mathrm{H/m^3}$", v: "hm3", why: "H/m に m² を掛ける。割らない"}, {t: "H", v: "h", why: "H/m に m² を掛けると、m が1つ残る"}, {t: "$\\mathrm{m^2}$", v: "m2", why: "透磁率の単位 H/m も掛ける"}]);
    return {form: "u23s4denom", text: "$R_m = \\dfrac{l}{\\mu S}$ の単位を出す。分母 $\\mu S$ の単位はどれか。", fig: {kind: "u23s4co", L: tbU23s4_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m"}, [["l", "{l}"], ["s", "{S}"], ["mu", "{μ}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["透磁率は H/m、断面積は m²", "$\\mathrm{H/m} \\times \\mathrm{m^2} = \\mathrm{H \\cdot m}$"], chk: {form: "u23s4denom", p: {}}};
  }
  throw new Error("u23s4denom：条件に合う数字が見つからない");
}
function tbU23s4_Qmu(r){
  var gcd = tbU23s4_gcd, ratio = tbU23s4_ratio, par = tbU23s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "導電率 $\\sigma$［S/m］", v: "own"}, {t: "抵抗率 $\\rho$", v: "rho", why: "$\\rho$ は分子にある。分母にある $\\mu$ にあたるのは、分母にある $\\sigma$"}, {t: "電流", v: "i", why: "電流にあたるのは磁束"}, {t: "起電力（電圧）", v: "v", why: "起電力にあたるのは起磁力"}]);
    return {form: "u23s4mu", text: "磁気回路を電気回路と比べると、透磁率 $\\mu$［H/m］にあたるのはどれか。", fig: {kind: "u23s4co", L: tbU23s4_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R = \\dfrac{l}{\\sigma S}$ と $R_m = \\dfrac{l}{\\mu S}$", "透磁率 $\\mu$［H/m］は導電率 $\\sigma$［S/m］にあたる"], chk: {form: "u23s4mu", p: {}}};
  }
  throw new Error("u23s4mu：条件に合う数字が見つからない");
}
// 23-5 エアギャップ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u23_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU23s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU23s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU23s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU23s5_par(a, b){ return a * b / (a + b); }
function tbU23s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU23s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU23s5_Qphi(r){
  var gcd = tbU23s5_gcd, ratio = tbU23s5_ratio, par = tbU23s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ni = pick(r, [100,200,300,400,500,600,800,1000,1200,1500,2000]);
    var r1 = pick(r, [1000,2000,3000,4000,5000,6000,8000,10000,20000]);
    var r2 = pick(r, [5000,6000,10000,12000,15000,20000,24000,30000,40000,50000,60000,100000]);
    var P = (ni / (r1 + r2));
    var A = (ni / r1);
    var B = (ni / r2);
    var C = (ni * (r1 + r2) / (r1 * r2));
    if (!(r1 < r2 && nice(P) && P >= 0.001 && nice(A) && nice(B) && nice(C) && distinct([P, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(P) + "\\,\\mathrm{Wb}$", v: fmt(P)}, {t: "$" + fmt(A) + "\\,\\mathrm{Wb}$", v: fmt(A), why: "エアギャップの磁気抵抗を足していない"}, {t: "$" + fmt(B) + "\\,\\mathrm{Wb}$", v: fmt(B), why: "鉄心の部分の磁気抵抗を足していない"}, {t: "$" + fmt(C) + "\\,\\mathrm{Wb}$", v: fmt(C), why: "並列とみなした（和分の積）"}]);
    return {form: "u23s5phi", text: "起磁力 $" + fmt(ni) + "\\,\\mathrm{A}$ の磁気回路で、鉄心の部分の磁気抵抗が $" + fmt(r1) + "\\,\\mathrm{A/Wb}$、エアギャップの部分の磁気抵抗が $" + fmt(r2) + "\\,\\mathrm{A/Wb}$ である。鉄心の中の磁束は何 Wb か。", fig: {kind: "u23s5ms", L: tbU23s5_fig({"src":"{N}{I}","r1":"{R}_1","r2":"{R}_2","phi":"{Φ}"}, [["src", "{N}{I}=" + fmt(ni) + " A"], ["r1", "{R}_1=" + fmt(r1) + " A/Wb"], ["r2", "{R}_2=" + fmt(r2) + " A/Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["鉄心とエアギャップは直列なので、$\\Phi = \\dfrac{NI}{R_1 + R_2}$", "$\\Phi = \\dfrac{" + fmt(ni) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + fmt(P) + "\\,\\mathrm{Wb}$"], chk: {form: "u23s5phi", p: {ni: ni, r1: r1, r2: r2}}};
  }
  throw new Error("u23s5phi：条件に合う数字が見つからない");
}
function tbU23s5_Qsum(r){
  var gcd = tbU23s5_gcd, ratio = tbU23s5_ratio, par = tbU23s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var r1 = pick(r, [1000,2000,3000,4000,5000,6000,10000,20000]);
    var r2 = pick(r, [4000,6000,10000,12000,20000,30000,40000,60000]);
    var RM = (r1 + r2);
    var A = (r1 * r2 / (r1 + r2));
    var B = (r2 - r1);
    if (!(r1 < r2 && nice(A) && distinct([RM, A, B, r2]))) continue;
    var _c = choices(r, [{t: "$" + fmt(RM) + "\\,\\mathrm{A/Wb}$", v: fmt(RM)}, {t: "$" + fmt(A) + "\\,\\mathrm{A/Wb}$", v: fmt(A), why: "並列とみなした（和分の積）"}, {t: "$" + fmt(B) + "\\,\\mathrm{A/Wb}$", v: fmt(B), why: "足すところを引いた"}, {t: "$" + fmt(r2) + "\\,\\mathrm{A/Wb}$", v: fmt(r2), why: "鉄心の部分の磁気抵抗を足していない"}]);
    return {form: "u23s5sum", text: "鉄心の部分の磁気抵抗が $" + fmt(r1) + "\\,\\mathrm{A/Wb}$、エアギャップの部分の磁気抵抗が $" + fmt(r2) + "\\,\\mathrm{A/Wb}$ である。磁気回路の合わせた磁気抵抗は何 A/Wb か。", fig: {kind: "u23s5ms", L: tbU23s5_fig({"src":"{N}{I}","r1":"{R}_1","r2":"{R}_2","phi":"{Φ}"}, [["src", "{N}{I}"], ["r1", "{R}_1=" + fmt(r1) + " A/Wb"], ["r2", "{R}_2=" + fmt(r2) + " A/Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["鉄心とエアギャップは直列なので、足す", "$R_m = " + fmt(r1) + " + " + fmt(r2) + " = " + fmt(RM) + "\\,\\mathrm{A/Wb}$"], chk: {form: "u23s5sum", p: {r1: r1, r2: r2}}};
  }
  throw new Error("u23s5sum：条件に合う数字が見つからない");
}
function tbU23s5_Qratio(r){
  var gcd = tbU23s5_gcd, ratio = tbU23s5_ratio, par = tbU23s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mr = pick(r, [500,1000,2000,4000,5000]);
    var l1 = pick(r, [0.1,0.2,0.4,0.5,1]);
    var l2k = pick(r, [1,2,4,5]);
    var l2 = (l2k / 1000);
    var K = (mr * l2 / l1);
    var A = (l2 / l1);
    var B = (l1 / (mr * l2));
    if (!(nice(K) && K >= 1 && nice(A) && A >= 0.001 && nice(B) && B >= 0.001 && distinct([K, A, B, mr]))) continue;
    var _c = choices(r, [{t: "$" + fmt(K) + "$ 倍", v: fmt(K)}, {t: "$" + fmt(A) + "$ 倍", v: fmt(A), why: "比透磁率を入れていない（鉄心の透磁率は $\\mu_0 \\mu_r$）"}, {t: "$" + fmt(B) + "$ 倍", v: fmt(B), why: "逆（鉄心がエアギャップの何倍か）を求めた"}, {t: "$" + fmt(mr) + "$ 倍", v: fmt(mr), why: "長さの比を入れていない"}]);
    return {form: "u23s5ratio", text: "鉄心の平均磁路長が $" + fmt(l1) + "\\,\\mathrm{m}$、比透磁率が " + fmt(mr) + "、エアギャップの長さが $" + fmt(l2) + "\\,\\mathrm{m}$ で、断面積はどこも同じである。エアギャップの部分の磁気抵抗は、鉄心の部分の磁気抵抗の何倍か。", fig: {kind: "u23s5cg", L: tbU23s5_fig({"src":"{N}{I}","r1":"{R}_1","r2":"{R}_2","phi":"{Φ}"}, [["n", "{N}"], ["i", "{I}"], ["phi", "{Φ}"], ["phia", "cw"], ["l", "{l}_1=" + fmt(l1) + " m"], ["gap", ""], ["gl", "{l}_2=" + fmt(l2) + " m"], ["s", "{S}"], ["mu", "{μ}_r=" + fmt(mr)], ["src", null], ["r1", null], ["r2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_1 = \\dfrac{l_1}{\\mu_0 \\mu_r S}$、$R_2 = \\dfrac{l_2}{\\mu_0 S}$ なので、$\\dfrac{R_2}{R_1} = \\dfrac{\\mu_r l_2}{l_1}$", "$\\dfrac{R_2}{R_1} = \\dfrac{" + fmt(mr) + " \\times " + fmt(l2) + "}{" + fmt(l1) + "} = " + fmt(K) + "$ 倍"], chk: {form: "u23s5ratio", p: {mr: mr, l1: l1, l2k: l2k}}};
  }
  throw new Error("u23s5ratio：条件に合う数字が見つからない");
}
function tbU23s5_Qair(r){
  var gcd = tbU23s5_gcd, ratio = tbU23s5_ratio, par = tbU23s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "1", v: "own"}, {t: "0", v: "zero", why: "比透磁率は真空中の何倍か。空気は真空と同じとみなして 1"}, {t: "$\\mu_0$", v: "mu0", why: "$\\mu_0$ は真空中の透磁率。比透磁率は真空中の何倍かを表す数"}, {t: "鉄心と同じ", v: "same", why: "空気の比透磁率は 1 で、鉄心よりずっと小さい"}]);
    return {form: "u23s5air", text: "エアギャップの磁気抵抗を求めるとき、空気の比透磁率はいくらとするか。", fig: {kind: "u23s5cg", L: tbU23s5_fig({"src":"{N}{I}","r1":"{R}_1","r2":"{R}_2","phi":"{Φ}"}, [["n", "{N}"], ["i", "{I}"], ["phi", "{Φ}"], ["phia", "cw"], ["l", "{l}_1"], ["gap", ""], ["gl", "{l}_2"], ["s", "{S}"], ["mu", "{μ}_r"], ["src", null], ["r1", null], ["r2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["比透磁率は、真空中の透磁率の何倍かを表す", "空気の比透磁率は 1（透磁率は $\\mu_0$）"], chk: {form: "u23s5air", p: {}}};
  }
  throw new Error("u23s5air：条件に合う数字が見つからない");
}
function tbU23s5_Qhow(r){
  var gcd = tbU23s5_gcd, ratio = tbU23s5_ratio, par = tbU23s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "鉄心の部分とエアギャップの部分の、直列の磁気抵抗", v: "own"}, {t: "鉄心の部分とエアギャップの部分の、並列の磁気抵抗", v: "par", why: "磁束は、鉄心とエアギャップを順に通るので直列"}, {t: "鉄心の部分の磁気抵抗だけ", v: "fe", why: "エアギャップは短くても、磁気抵抗は大きい"}, {t: "エアギャップの部分の磁気抵抗だけ", v: "gap", why: "鉄心の部分の磁気抵抗も足す"}]);
    return {form: "u23s5how", text: "エアギャップのある鉄心の磁気抵抗は、□ として求める。", fig: {kind: "u23s5cg", L: tbU23s5_fig({"src":"{N}{I}","r1":"{R}_1","r2":"{R}_2","phi":"{Φ}"}, [["n", "{N}"], ["i", "{I}"], ["phi", "{Φ}"], ["phia", "cw"], ["l", "{l}_1"], ["gap", ""], ["gl", "{l}_2"], ["s", "{S}"], ["mu", "{μ}_r"], ["src", null], ["r1", null], ["r2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束は、鉄心とエアギャップを順に通る", "直列の2つの磁気抵抗として足す（$R_1 + R_2$）"], chk: {form: "u23s5how", p: {}}};
  }
  throw new Error("u23s5how：条件に合う数字が見つからない");
}
var GEN = {
  // 23-1 起磁力
  1: function(r){ return pick(r, [tbU23s1_Qni, tbU23s1_Qni, tbU23s1_Qni, tbU23s1_Qi, tbU23s1_Qi, tbU23s1_Qn, tbU23s1_Qunit, tbU23s1_Qdef])(r); },
  // 23-2 磁気抵抗
  2: function(r){ return pick(r, [tbU23s2_Qrm, tbU23s2_Qrm, tbU23s2_Qrm, tbU23s2_Qratio, tbU23s2_Qratio, tbU23s2_Qmu, tbU23s2_Qdef])(r); },
  // 23-3 磁気回路のオームの法則
  3: function(r){ return pick(r, [tbU23s3_Qphi, tbU23s3_Qphi, tbU23s3_Qphi, tbU23s3_Qi, tbU23s3_Qi, tbU23s3_Qrm, tbU23s3_Qrm, tbU23s3_Qrole, tbU23s3_Qrole])(r); },
  // 23-4 磁気抵抗の単位
  4: function(r){ return pick(r, [tbU23s4_Qwhich, tbU23s4_Qwhich, tbU23s4_Qwhich, tbU23s4_Qsame, tbU23s4_Qsame, tbU23s4_Qdenom, tbU23s4_Qdenom, tbU23s4_Qmu])(r); },
  // 23-5 エアギャップ
  5: function(r){ return pick(r, [tbU23s5_Qphi, tbU23s5_Qphi, tbU23s5_Qphi, tbU23s5_Qsum, tbU23s5_Qsum, tbU23s5_Qratio, tbU23s5_Qratio, tbU23s5_Qair, tbU23s5_Qhow])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t23s1e","scene":"t23s1e","kind":"u23s1co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw"},"viewbox":"42 115 732 517","band":{"want":"磁束をつくる源","ans":"起磁力 $NI$［A］","full":"鉄心にコイルを巻いて電流を流すと磁束が生じる。巻数が多いほど、電流が大きいほど磁束は多い。磁束をつくる源を起磁力といい、巻数と電流の積 NI。単位は A。"},"narr":{"start":{"co":1,"phid":0},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"①磁束をつくる源\n②起磁力 $NI$\n③単位\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["N","I"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"鉄心に、コイルを $N$ 回巻きつけます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["N"]},{"text":"コイルに電流 $I$ を流すと、磁束が生じます。磁束は、鉄心の中を回ります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"phi","emph":["I","Phi"]},{"text":"この磁束は、コイルに電流を流したから生じました。","at":{"強調":1.0},"after":[],"emph":["I","N","Phi"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"巻数が多いほど、また電流が大きいほど、〖磁束は多く〗なります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["N","I","Phi"]},{"text":"そこで、巻数と電流の積を、磁束をつくる源と考えます。これを〖起磁力〗といいます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","I"],"eq":[{"cont":false,"items":[["NI"]]}],"emphPre":["N","I"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"巻数 $N$ は、単位のない数と考えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["N"]},{"text":"単位のない数に電流［A］を掛けるので、〖起磁力の単位は A〗です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["N","I"],"eq":[{"cont":false,"items":[["NI\\;[\\mathrm{A}]"]]}],"ans":true,"emphPre":["N","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"phi":{"to":{"phid":1},"dur":0.8}},"route":["磁束をつくる源","起磁力 $NI$","単位"]}},{"id":"t23s1x","scene":"t23s1x","kind":"u23s1co","lab":{"n":"{N}=200","i":"{I}=4 A","phi":"{Φ}","phia":"cw"},"viewbox":"42 115 732 517","band":{"want":"起磁力","known":"$N = 200,\\;\\; I = 4\\,\\mathrm{A}$","ans":"$NI = 800\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"phid":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"求めるのは、コイルの起磁力です。","at":{"強調":1.0},"after":[],"emph":["N","I"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"起磁力は、〖巻数と電流の積〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["N","I"],"eq":[{"cont":false,"items":[["NI"]]}],"emphPre":["N","I"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"$N = 200$、$I = 4$ を入れます。単位は A です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["N","I"],"eq":[{"cont":false,"items":[["NI = 200 \\times 4 = 800\\,\\mathrm{A}"]]}],"ans":true,"emphPre":["N","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["式を書く","数を入れる"]}},{"id":"t23s2e","scene":"t23s2e","kind":"u23s2co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}"},"viewbox":"42 108 977 624","band":{"want":"磁束の通りにくさ","ans":"磁気抵抗 $R_m = \\dfrac{l}{\\mu S}$","full":"磁束の通りにくさを磁気抵抗という。単位は A/Wb または H⁻¹。R_m = l/(μS)。S は断面積、l は平均磁路長、μ = μ0 μr。電気の抵抗 R = ρl/S と同じ形。μ は大きいほど通りやすいので分母にある。"},"narr":{"start":{"co":1,"phid":1,"ld":0,"sd":0},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"①磁束の通りにくさ\n②式\n③電気の抵抗と比べる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"起磁力でつくられる磁束の大きさは、鉄心で決まります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Phi","N","I"]},{"text":"鉄心の形・断面積・長さ・比透磁率によって決まります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"s","emph":["S","Mu"]},{"text":"磁束の通りにくさを、〖磁気抵抗〗といいます。単位は A/Wb、または H の逆数の $\\mathrm{H^{-1}}$ です。","at":{"強調":1.0},"after":[],"emph":["Phi"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"磁気抵抗 $R_m$ は、次の式で表します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["L","Mu","S"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{l}{\\mu S}"]]}],"emphPre":["L","Mu","S"]},{"text":"$S$ は鉄心の断面積です。$l$ は〖平均磁路長〗で、鉄心を一周する長さです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"l","emph":["S","L"]},{"text":"$\\mu$ は透磁率です。$\\mu = \\mu_0 \\mu_r$ でした。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Mu"],"eq":[{"cont":false,"items":[["\\mu = \\mu_0 \\mu_r"]]}],"emphPre":["Mu"]}]},{"cap":null,"eqp":null,"vid":[6,34],"sents":[{"text":"電気の抵抗の式 $R = \\rho \\dfrac{l}{S}$ と同じ形です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["L","S"],"eq":[{"cont":false,"items":[["R = \\rho \\dfrac{l}{S}","R_m = \\dfrac{l}{\\mu S}"]]}],"emphPre":["L","S"]},{"text":"断面積が大きいほど磁束は通りやすく、磁気抵抗は小さくなります。長さが長いほど大きくなります。","at":{"強調":1.0},"after":[],"emph":["S","L"]},{"text":"透磁率は、磁束の通りやすさです。大きいほど、磁気抵抗は小さくなります。","at":{"強調":1.0},"after":[],"emph":["Mu"]},{"text":"$\\rho$ は分子に、$\\mu$ は〖分母にある〗ことに気をつけます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Mu"],"ans":true}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"l":{"to":{"ld":1},"dur":0.8},"s":{"to":{"sd":1},"dur":0.6}},"route":["磁束の通りにくさ","式","電気の抵抗と比べる"]}},{"id":"t23s2x","scene":"t23s2x","kind":"u23s2co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}=0.4 m","s":"{S}=0.01 m²","mu":"{μ}=2×10⁻³ H/m"},"viewbox":"42 108 977 624","band":{"want":"鉄心の磁気抵抗 $R_m$","known":"$l = 0.4\\,\\mathrm{m},\\;\\; \\mu = 2 \\times 10^{-3}\\,\\mathrm{H/m},\\;\\; S = 0.01\\,\\mathrm{m^2}$","ans":"$R_m = 20000\\,\\mathrm{H^{-1}}$"},"narr":{"start":{"co":1,"phid":1,"ld":1,"sd":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"求めるのは、鉄心の磁気抵抗 $R_m$ です。","at":{"強調":1.0},"after":[],"emph":["L","S","Mu"]},{"text":"①式を書く\n②分母を出す\n③割る\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"磁気抵抗は、長さを、〖透磁率と断面積の積〗で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["L","Mu","S"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{l}{\\mu S}"]]}],"emphPre":["L","Mu","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"分母は、透磁率と断面積の積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Mu","S"],"eq":[{"cont":false,"items":[["\\mu S = 2 \\times 10^{-3} \\times 0.01","= 2 \\times 10^{-5}"]]}],"emphPre":["Mu","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"長さ $0.4$ を、分母で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["L","Mu","S"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{0.4}{2 \\times 10^{-5}}","= 20000\\,\\mathrm{H^{-1}}"]]}],"ans":true,"emphPre":["L"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["式を書く","分母を出す","割る"]}},{"id":"t23s3e","scene":"t23s3e","kind":"u23s3sw","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","src":"{N}{I}","rm":"{R}_m"},"viewbox":"392 215 732 517","band":{"want":"磁気回路の磁束","ans":"$\\Phi = \\dfrac{NI}{R_m}$（起磁力は電圧、磁束は電流にあたる）","full":"磁気回路は電気回路に置き換えられる。起磁力 NI が電源、磁束が電流、磁気抵抗が抵抗。R_m = NI/Φ、Φ = NI/R_m、NI = ΦR_m。NI の単位は A だが、電圧にあたる。"},"narr":{"start":{"co":1,"t":0,"phid":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"①電気回路に置き換える\n②$\\Phi = \\dfrac{NI}{R_m}$\n③起磁力は電圧にあたる\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["N","I","Rm"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"鉄心の磁気回路には、磁束をつくる起磁力、流れる磁束、磁束を妨げる磁気抵抗があります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["N","I","Phi"]},{"text":"電気回路の電源・電流・抵抗と同じ関係です。電気回路に置き換えます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sw","emph":["src","Phi","Rm"]},{"text":"起磁力 $NI$ が電源、磁束 $\\Phi$ が電流、磁気抵抗 $R_m$ が抵抗にあたります。","at":{"強調":1.0},"after":[],"emph":["src","Phi","Rm"]}]},{"cap":null,"eqp":null,"vid":[1,34],"sents":[{"text":"オームの法則 $R = \\dfrac{V}{I}$ と同じ形で、磁気抵抗は、起磁力を磁束で割った物です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Rm","src","Phi"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{NI}{\\Phi}"]]}],"emphPre":["Rm","src","Phi"]},{"text":"これを、〖磁気回路のオームの法則〗といいます。ほかに2通りに表せます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Phi","src","Rm"],"eq":[{"cont":false,"items":[["\\Phi = \\dfrac{NI}{R_m}"],["NI = \\Phi R_m"]]}],"emphPre":["Phi","src","Rm"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"起磁力 $NI$ の単位は A ですが、〖電流ではありません〗。電気回路の起電力、つまり電圧にあたります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["src"]},{"text":"電流にあたるのは、〖磁束〗です。","at":{"強調":1.0},"after":[],"emph":["Phi"]},{"text":"電気の抵抗は、導電率 $\\sigma = \\dfrac{1}{\\rho}$ を使うと $\\dfrac{l}{\\sigma S}$ です。磁気抵抗とは、$\\sigma$ と $\\mu$ が入れ替わっただけです。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Rm"],"eq":[{"cont":false,"items":[["R = \\dfrac{l}{\\sigma S}","R_m = \\dfrac{l}{\\mu S}"]]}],"ans":true,"emphPre":["Rm"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1","phix1a","phix1a:h","phix1t0","phix1t1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1","rmx1","rmx1t0","rmx1t1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"],"src":["cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"PHI":["phix1a","phix1a:h","phix1t0","phix1t1"],"zhi":["u23s3swx1L","u23s3swx1w1"],"zlo":["u23s3swx1Rw","u23s3swx1w2"]},"moves":{"sw":{"to":{"t":1},"dur":0.6}},"route":["電気回路に置き換える","$\\Phi = \\dfrac{NI}{R_m}$","起磁力は電圧にあたる"]}},{"id":"t23s3x","scene":"t23s3x","kind":"u23s3sw","lab":{"n":"{N}=100","i":"{I}=5 A","phi":["{Φ}","{Φ}=0.02 Wb"],"phia":"cw","src":["{N}{I}","{N}{I}=500 A"],"rm":"{R}_m=25000 A/Wb"},"viewbox":"392 215 732 517","band":{"want":"鉄心の中の磁束 $\\Phi$","known":"$N = 100,\\;\\; I = 5\\,\\mathrm{A},\\;\\; R_m = 25000\\,\\mathrm{A/Wb}$","ans":"$\\Phi = 0.02\\,\\mathrm{Wb}$"},"narr":{"start":{"co":1,"t":0,"phid":1,"srcv":0,"phiv":0},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"求めるのは、鉄心の中の磁束 $\\Phi$ です。","at":{"強調":1.0},"after":[],"emph":["Phi"]},{"text":"①起磁力\n②オームの法則\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"まず起磁力です。巻数と電流の積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["N","I"],"eq":[{"cont":false,"items":[["NI = 100 \\times 5 = 500\\,\\mathrm{A}"]]}],"emphPre":["N","I"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"電気回路に置き換えると、電源は 500 A、抵抗は 25000 A/Wb です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"sw","emph":["src","Rm"]},{"text":"磁束は、〖起磁力を磁気抵抗で割り〗ます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["Phi","src","Rm"],"eq":[{"cont":false,"items":[["\\Phi = \\dfrac{NI}{R_m} = \\dfrac{500}{25000}","= 0.02\\,\\mathrm{Wb}"]]}],"move":"phi","ans":true,"emphPre":["Phi","src","Rm"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1","phix1a","phix1a:h","phix1t0","phix1t1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1","rmx1","rmx1t0","rmx1t1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"],"src":["cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"PHI":["phix1a","phix1a:h","phix1t0","phix1t1"],"zhi":["u23s3swx1L","u23s3swx1w1"],"zlo":["u23s3swx1Rw","u23s3swx1w2"]},"moves":{"sw":{"to":{"t":1,"srcv":1},"dur":0.6},"phi":{"to":{"phiv":1},"dur":0.4}},"route":["起磁力","オームの法則"]}},{"id":"t23s4e","scene":"t23s4e","kind":"u23s4co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m","l":"{l}","s":"{S}","mu":"{μ}"},"viewbox":"42 113 802 614","band":{"want":"磁気抵抗の単位","ans":"A/Wb と $\\mathrm{H^{-1}}$（2つは同じ）","full":"R_m = NI/Φ から A/Wb。R_m = l/(μS) から、m を H/m × m² で割って H⁻¹。どちらも磁気抵抗の単位なので同じ。透磁率 μ［H/m］は、電気回路の導電率 σ［S/m］にあたる。"},"narr":{"start":{"co":1,"phid":1,"ld":1,"sd":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"①$R_m = \\dfrac{NI}{\\Phi}$ から\n②$R_m = \\dfrac{l}{\\mu S}$ から\n③2つは同じ\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Rm","N","I","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"磁気回路のオームの法則から、磁気抵抗は起磁力を磁束で割った物です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Rm","N","I","Phi"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{NI}{\\Phi}"]]}],"emphPre":["Rm","N","I","Phi"]},{"text":"巻数は単位のない数、電流は A、磁束は Wb です。","at":{"強調":1.0},"after":[],"emph":["N","I","Phi"]},{"text":"A を Wb で割るので、〖単位は A/Wb〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Rm"],"eq":[{"cont":false,"items":[["\\dfrac{\\mathrm{A}}{\\mathrm{Wb}} = \\mathrm{A/Wb}"]]}],"emphPre":["Rm"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"磁気抵抗の式からも、単位を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Rm","L","Mu","S"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{l}{\\mu S}"]]}],"emphPre":["Rm","L","Mu","S"]},{"text":"長さは m、透磁率は H/m、断面積は m² です。","at":{"強調":1.0},"after":[],"emph":["L","Mu","S"]},{"text":"分母は、H/m に m² を掛けて H·m です。m を H·m で割ると、〖H の逆数〗が残ります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Mu","S","L"],"eq":[{"cont":false,"items":[["\\dfrac{\\mathrm{m}}{\\mathrm{H/m} \\times \\mathrm{m^2}}","= \\dfrac{\\mathrm{m}}{\\mathrm{H \\cdot m}} = \\mathrm{H^{-1}}"]]}],"emphPre":["Mu","S","L"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"どちらも磁気抵抗の単位なので、A/Wb と $\\mathrm{H^{-1}}$ は〖同じ〗です。式を覚えていれば、単位は導けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Rm"],"eq":[{"cont":false,"items":[["\\mathrm{A/Wb} = \\mathrm{H^{-1}}"]]}],"emphPre":["Rm"]},{"text":"電気回路と比べると、透磁率 $\\mu$［H/m］は、導電率 $\\sigma$［S/m］にあたります。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Mu"],"ans":true}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["$R_m = \\dfrac{NI}{\\Phi}$ から","$R_m = \\dfrac{l}{\\mu S}$ から","2つは同じ"]}},{"id":"t23s4x","scene":"t23s4x","kind":"u23s4co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m"},"viewbox":"42 113 802 614","band":{"want":"磁気抵抗の単位","ans":"A/Wb"},"narr":{"start":{"co":1,"phid":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"求めるのは、磁気抵抗の単位です。","at":{"強調":1.0},"after":[],"emph":["Rm"]},{"text":"①式を選ぶ\n②単位を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"選択肢には A と Wb があるので、オームの法則の形の式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Rm","N","I","Phi"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{NI}{\\Phi}"]]}],"emphPre":["Rm","N","I","Phi"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"起磁力 $NI$ は A、磁束は Wb です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["N","I","Phi"]},{"text":"A を Wb で割るので、〖答えは A/Wb〗です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Rm"],"eq":[{"cont":false,"items":[["\\dfrac{\\mathrm{A}}{\\mathrm{Wb}} = \\mathrm{A/Wb}"]]}],"ans":true,"emphPre":["Rm"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["式を選ぶ","単位を入れる"]}},{"id":"t23s5e","scene":"t23s5e","kind":"u23s5sw","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}_1","gap":"","gl":"{l}_2","s":"{S}","mu":"{μ}_r","src":"{N}{I}","r1":"{R}_1","r2":"{R}_2"},"viewbox":"42 106 1017 627","band":{"want":"エアギャップのある鉄心の磁束","ans":"$\\Phi = \\dfrac{NI}{R_1 + R_2}$（鉄心とエアギャップは直列）","full":"鉄心の部分とエアギャップの部分を、直列の2つの磁気抵抗とみなす。それぞれ l/(μS) で、鉄心は μ0μr、空気は比透磁率 1 なので μ0。磁束は Φ = NI/(R1 + R2)。"},"narr":{"start":{"co":1,"t":0,"phid":1,"gapd":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"①直列の磁気抵抗\n②それぞれの磁気抵抗\n③磁束を求める\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"鉄心の一部に、空気のすきまがあります。これを〖エアギャップ〗といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Gap"]},{"text":"鉄心の部分とエアギャップの部分を、直列につないだ2つの磁気抵抗とみなします。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sw","emph":["R1","R2"]},{"text":"直列なので、合わせた磁気抵抗は〖足し算〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2"],"eq":[{"cont":false,"items":[["R_m = R_1 + R_2"]]}],"emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"それぞれ $\\dfrac{l}{\\mu S}$ で求めます。断面積は同じで、長さと透磁率が違います。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"back","emph":["L","Gl","S"]},{"text":"鉄心は、比透磁率が $\\mu_r$ なので、透磁率は $\\mu_0 \\mu_r$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["L","Mu","S"],"eq":[{"cont":false,"items":[["R_1 = \\dfrac{l_1}{\\mu_0 \\mu_r S}"]]}],"emphPre":["L","Mu","S"]},{"text":"エアギャップは空気です。〖空気の比透磁率は 1〗なので、透磁率は $\\mu_0$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Gap","Gl","S"],"eq":[{"cont":false,"items":[["R_1 = \\dfrac{l_1}{\\mu_0 \\mu_r S}","R_2 = \\dfrac{l_2}{\\mu_0 S}"]]}],"emphPre":["Gap","Gl","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"磁束は、起磁力を、合わせた磁気抵抗で割ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"sw2","emph":["src","R1","R2","Phi"],"eq":[{"cont":false,"items":[["\\Phi = \\dfrac{NI}{R_1 + R_2}"]]}],"ans":true,"emphPre":["src","R1","R2","Phi"]}]}],"groups":{"Core":["core"],"Gap":["gapc","gapt0","gapt1"],"Gl":["gld","gld:h","gld:h2","glt0","glt1"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1","phix1a","phix1a:h","phix1t0","phix1t1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"],"src":["cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"R1":["r1x1","r1x1t0","r1x1t1"],"R2":["r2x1","r2x1t0","r2x1t1"],"PHI":["phix1a","phix1a:h","phix1t0","phix1t1"],"zhi":["u23s5swx1L","u23s5swx1w1"],"zlo":["u23s5swx1Rw","u23s5swx1w3"],"zmid":["u23s5swx1w2"]},"moves":{"sw":{"to":{"t":1},"dur":0.6},"back":{"to":{"t":0},"dur":0.6},"sw2":{"to":{"t":1},"dur":0.6}},"route":["直列の磁気抵抗","それぞれの磁気抵抗","磁束を求める"]}},{"id":"t23s5x","scene":"t23s5x","kind":"u23s5ms","lab":{"src":"{N}{I}=500 A","r1":"{R}_1=20000 A/Wb","r2":"{R}_2=80000 A/Wb","phi":["{Φ}","{Φ}=0.005 Wb"]},"viewbox":"464 300 595 334","band":{"want":"鉄心の中の磁束 $\\Phi$","known":"$NI = 500\\,\\mathrm{A},\\;\\; R_1 = 20000\\,\\mathrm{A/Wb},\\;\\; R_2 = 80000\\,\\mathrm{A/Wb}$","ans":"$\\Phi = 0.005\\,\\mathrm{Wb}$"},"narr":{"start":{"co":1,"phiv":0},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"求めるのは、鉄心の中の磁束 $\\Phi$ です。","at":{"強調":1.0},"after":[],"emph":["Phi"]},{"text":"①直列に足す\n②起磁力を割る\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"鉄心の部分とエアギャップの部分は、直列の磁気抵抗です。足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2"],"eq":[{"cont":false,"items":[["R_1 + R_2 = 20000 + 80000","= 100000\\,\\mathrm{A/Wb}"]]}],"emphPre":["R1","R2"]},{"text":"エアギャップは短くても、〖磁気抵抗は鉄心より大きい〗ことがあります。","at":{"強調":1.0},"after":[],"emph":["R2"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"起磁力を、合わせた磁気抵抗で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["Phi","src","R1","R2"],"eq":[{"cont":false,"items":[["\\Phi = \\dfrac{500}{100000} = 0.005\\,\\mathrm{Wb}"]]}],"move":"phi","ans":true,"emphPre":["src","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"PHI":["phia","phia:h","phit0","phit1"],"zhi":["u23s5msL","u23s5msw1"],"zlo":["u23s5msRw","u23s5msw3"],"zmid":["u23s5msw2"],"Phi":["phia","phia:h","phit0","phit1"]},"moves":{"phi":{"to":{"phiv":1},"dur":0.4}},"route":["直列に足す","起磁力を割る"]}}],"secs":[{"ex":{"text":"鉄心に巻いた巻数 200 のコイルに、$4\\,\\mathrm{A}$ の電流を流した。起磁力は何 A か。","fig":{"kind":"u23s1co","L":{"n":"{N}=200","i":"{I}=4 A","phi":"{Φ}","phia":"cw"},"P":{}},"ch":[{"t":"$204\\,\\mathrm{A}$","v":204,"why":"掛けるところを足した"},{"t":"$50\\,\\mathrm{A}$","v":50,"why":"巻数を電流で割った"},{"t":"$800\\,\\mathrm{A}$","v":800,"why":""},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"巻数を掛けていない（それはコイルの電流）"}],"ans":2}},{"ex":{"text":"平均磁路長 $0.4\\,\\mathrm{m}$、断面積 $0.01\\,\\mathrm{m^2}$、透磁率 $2 \\times 10^{-3}\\,\\mathrm{H/m}$ の鉄心の磁気抵抗は何 $\\mathrm{H^{-1}}$ か。","fig":{"kind":"u23s2co","L":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}=0.4 m","s":"{S}=0.01 m²","mu":"{μ}=2×10⁻³ H/m"},"P":{}},"ch":[{"t":"$200\\,\\mathrm{H^{-1}}$","v":"200","why":"断面積で割っていない"},{"t":"$0.08\\,\\mathrm{H^{-1}}$","v":"0.08","why":"透磁率を分子に置いた（$\\mu$ は分母）"},{"t":"$12.5\\,\\mathrm{H^{-1}}$","v":"12.5","why":"長さと断面積を逆に置いた"},{"t":"$20000\\,\\mathrm{H^{-1}}$","v":"20000","why":""}],"ans":3}},{"ex":{"text":"鉄心に巻いた巻数 100 のコイルに $5\\,\\mathrm{A}$ の電流を流した。鉄心の磁気抵抗が $25000\\,\\mathrm{A/Wb}$ のとき、鉄心の中の磁束は何 Wb か。","fig":{"kind":"u23s3co","L":{"n":"{N}=100","i":"{I}=5 A","phi":"{Φ}","phia":"cw","rm":"{R}_m=25000 A/Wb"},"P":{}},"ch":[{"t":"$0.02\\,\\mathrm{Wb}$","v":"0.02","why":""},{"t":"$50\\,\\mathrm{Wb}$","v":"50","why":"割る順が逆（磁気抵抗を起磁力で割った）"},{"t":"$0.0002\\,\\mathrm{Wb}$","v":"0.0002","why":"巻数を掛けていない"},{"t":"$0.004\\,\\mathrm{Wb}$","v":"0.004","why":"電流を掛けていない"}],"ans":0}},{"ex":{"text":"磁気抵抗の単位として正しいものはどれか。","fig":{"kind":"u23s4co","L":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","rm":"{R}_m"},"P":{}},"ch":[{"t":"Wb/A","v":"wba","why":"割る順が逆。$R_m = \\dfrac{NI}{\\Phi}$ なので A を Wb で割る"},{"t":"H/m","v":"hm","why":"H/m は透磁率の単位"},{"t":"A/Wb","v":"awb","why":""},{"t":"A","v":"a","why":"A は起磁力の単位"}],"ans":2}},{"ex":{"text":"起磁力 $500\\,\\mathrm{A}$ の磁気回路で、鉄心の部分の磁気抵抗が $20000\\,\\mathrm{A/Wb}$、エアギャップの部分の磁気抵抗が $80000\\,\\mathrm{A/Wb}$ である。鉄心の中の磁束は何 Wb か。","fig":{"kind":"u23s5cg","L":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}_1","gap":"","gl":"{l}_2","s":"{S}","mu":"{μ}_r"},"P":{}},"ch":[{"t":"$0.025\\,\\mathrm{Wb}$","v":"0.025","why":"エアギャップの磁気抵抗を足していない"},{"t":"$0.03125\\,\\mathrm{Wb}$","v":"0.03125","why":"並列とみなした（和分の積）"},{"t":"$0.00625\\,\\mathrm{Wb}$","v":"0.00625","why":"鉄心の部分の磁気抵抗を足していない"},{"t":"$0.005\\,\\mathrm{Wb}$","v":"0.005","why":""}],"ans":3}}],"past":[]}};
});
