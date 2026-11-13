/* 単元21「電磁力」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(21, function(H){
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
// ---- 21-1 電磁力の向き の図（※ textbook/gen/make_section.py が textbook/gen/data/u21_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U21S1K = {
  mo: {"vars":[],"items":[{"f":"ln","id":"plb","pts":[[120,230],[240,230],[240,610],[120,610]],"w":3,"close":1,"sel":"pls","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"plbt","x":180,"y":420,"s":"N","anc":"middle","size":40,"sel":"pls","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"plt","k":"pl","bases":[[180,196,"middle",[0,-1]]],"need":"pl","vis":[],"t":"F","x":180,"y":196,"anc":"middle"},{"f":"ln","id":"prb","pts":[[800,230],[920,230],[920,610],[800,610]],"w":3,"close":1,"sel":"prs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"prbt","x":860,"y":420,"s":"N","anc":"middle","size":40,"sel":"prs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"prt","k":"pr","bases":[[860,196,"middle",[0,-1]]],"need":"pr","vis":[],"t":"F","x":860,"y":196,"anc":"middle"},{"f":"ln","id":"mb0","pts":[[250,260],[790,260]],"w":3,"sel":"st","var":{"up":{"w":7},"down":{"w":2},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh0","x0":334,"y0":260,"x1":364,"y1":260,"sel":"mba","var":{"right":{"x0":334,"y0":260,"x1":364,"y1":260},"left":{"x0":364,"y0":260,"x1":334,"y1":260}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb1","pts":[[250,310],[790,310]],"w":3,"sel":"st","var":{"up":{"w":7},"down":{"w":2},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh1","x0":334,"y0":310,"x1":364,"y1":310,"sel":"mba","var":{"right":{"x0":334,"y0":310,"x1":364,"y1":310},"left":{"x0":364,"y0":310,"x1":334,"y1":310}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb2","pts":[[250,530],[790,530]],"w":3,"sel":"st","var":{"up":{"w":2},"down":{"w":7},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh2","x0":334,"y0":530,"x1":364,"y1":530,"sel":"mba","var":{"right":{"x0":334,"y0":530,"x1":364,"y1":530},"left":{"x0":364,"y0":530,"x1":334,"y1":530}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb3","pts":[[250,580],[790,580]],"w":3,"sel":"st","var":{"up":{"w":2},"down":{"w":7},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh3","x0":334,"y0":580,"x1":364,"y1":580,"sel":"mba","var":{"right":{"x0":334,"y0":580,"x1":364,"y1":580},"left":{"x0":364,"y0":580,"x1":334,"y1":580}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"mbt","k":"mb","bases":[[780,226,"end",[0,-1]]],"need":"mb","vis":[],"t":"F","x":780,"y":214,"anc":"end"},{"f":"ln","id":"fl","pts":[[590,420],[589.4,429.14],[587.61,438.12],[584.67,446.79],[580.62,455],[575.53,462.61],[569.5,469.5],[562.61,475.53],[555,480.62],[546.79,484.67],[538.12,487.61],[529.14,489.4],[520,490],[510.86,489.4],[501.88,487.61],[493.21,484.67],[485,480.62],[477.39,475.53],[470.5,469.5],[464.47,462.61],[459.38,455],[455.33,446.79],[452.39,438.12],[450.6,429.14],[450,420],[450.6,410.86],[452.39,401.88],[455.33,393.21],[459.38,385],[464.47,377.39],[470.5,370.5],[477.39,364.47],[485,359.38],[493.21,355.33],[501.88,352.39],[510.86,350.6],[520,350],[529.14,350.6],[538.12,352.39],[546.79,355.33],[555,359.38],[562.61,364.47],[569.5,370.5],[575.53,377.39],[580.62,385],[584.67,393.21],[587.61,401.88],[589.4,410.86],[590,420]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":575.16,"y0":376.9,"x1":563.1,"y1":364.84,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":575.16,"y0":376.9,"x1":563.1,"y1":364.84},"cw":{"x0":563.1,"y0":364.84,"x1":575.16,"y1":376.9}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":476.9,"y0":364.84,"x1":464.84,"y1":376.9,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":476.9,"y0":364.84,"x1":464.84,"y1":376.9},"cw":{"x0":464.84,"y0":376.9,"x1":476.9,"y1":364.84}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh2","x0":464.84,"y0":463.1,"x1":476.9,"y1":475.16,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":464.84,"y0":463.1,"x1":476.9,"y1":475.16},"cw":{"x0":476.9,"y0":475.16,"x1":464.84,"y1":463.1}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh3","x0":563.1,"y0":475.16,"x1":575.16,"y1":463.1,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":563.1,"y0":475.16,"x1":575.16,"y1":463.1},"cw":{"x0":575.16,"y0":463.1,"x1":563.1,"y1":475.16}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[590,480,"start",[1,1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":693.24,"y":639.81,"anc":"start"},{"f":"c","id":"cc","cx":520,"cy":420,"r":30,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[480,466,"end",[-1,1]]],"need":"c","vis":[],"t":"F","x":426.26,"y":497.11,"anc":"end"},{"f":"ar","id":"fa","x0":620,"y0":420,"x1":620,"y1":260,"w":5,"need":"f","sel":"fa","var":{"up":{"x0":620,"y0":410,"x1":620,"y1":250},"down":{"x0":620,"y0":430,"x1":620,"y1":590}},"dflt":"up","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[638,340,"start",[1,0]],[602,340,"end",[-1,0]],[620,230,"middle",[0,-1]]],"vbases":{"up":[[638,340,"start",[1,0]],[602,340,"end",[-1,0]],[620,230,"middle",[0,-1]]],"down":[[638,500,"start",[1,0]],[602,500,"end",[-1,0]],[620,610,"middle",[0,1]]]},"need":"f","sel":"fa","var":{"up":{"x":638,"y":340,"anc":"start"},"down":{"x":638,"y":500,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":638,"y":340,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU21s1mo(d, p, L){ tbFig_Draw(d, p, L, U21S1K.mo); }
// ---- 21-2 フレミングの左手の法則 の図（※ textbook/gen/make_section.py が textbook/gen/data/u21_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U21S2K = {
  fl: {"vars":[],"items":[{"f":"c","id":"o","cx":480,"cy":430,"r":7,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"handt","k":"hand","bases":[[140,160,"start",[-1,-1]]],"need":"hand","vis":[],"t":"F","x":140,"y":160,"anc":"start"},{"f":"ar","id":"fa1","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f1","sel":"f1a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210},"down":{"x0":480,"y0":440,"x1":480,"y1":650},"left":{"x0":470,"y0":430,"x1":240,"y1":430},"right":{"x0":490,"y0":430,"x1":720,"y1":430},"front":{"x0":473.8,"y0":436.2,"x1":362.2,"y1":547.8},"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"up","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"down":[[480,686,"middle",[0,1]],[504,626,"start",[1,-1]]],"left":[[210,430,"end",[-1,0]],[264,406,"start",[1,-1]]],"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"front":[[343.6,570.12,"end",[-0.62,0.62]],[386.2,523.8,"start",[1,-1]]],"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f1","sel":"f1a","var":{"up":{"x":480,"y":174,"anc":"middle"},"down":{"x":480,"y":686,"anc":"middle"},"left":{"x":252.69,"y":394.69,"anc":"start"},"right":{"x":750,"y":430,"anc":"start"},"front":{"x":323.8,"y":567.29,"anc":"end"},"back":{"x":636.2,"y":292.71,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn1t","k":"fn1","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"down":[[480,726,"middle",[0,1]],[480,646,"middle",[0,-1]]],"left":[[210,470,"end",[-1,1]],[210,390,"end",[-1,-1]]],"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"front":[[343.6,610.12,"end",[-0.62,1]],[343.6,530.12,"end",[-0.62,-1]]],"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn1","sel":"f1a","var":{"up":{"x":480,"y":122,"anc":"middle"},"down":{"x":480,"y":738,"anc":"middle"},"left":{"x":210,"y":470,"anc":"end"},"right":{"x":738.69,"y":481.31,"anc":"start"},"front":{"x":340.44,"y":615.22,"anc":"end"},"back":{"x":615.92,"y":344.29,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":214,"anc":"middle"},{"f":"c","id":"fs1front","cx":346.08,"cy":563.92,"r":16,"fill":"w","sign":"•","need":"f1","sel":"f1a","var":{"front":{}},"vis":[],"t":"F"},{"f":"c","id":"fs1back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f1","sel":"f1a","var":{"back":{}},"vis":[],"t":"F"},{"f":"ar","id":"fa2","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f2","sel":"f2a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210},"down":{"x0":480,"y0":440,"x1":480,"y1":650},"left":{"x0":470,"y0":430,"x1":240,"y1":430},"right":{"x0":490,"y0":430,"x1":720,"y1":430},"front":{"x0":473.8,"y0":436.2,"x1":362.2,"y1":547.8},"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"up","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"down":[[480,686,"middle",[0,1]],[504,626,"start",[1,-1]]],"left":[[210,430,"end",[-1,0]],[264,406,"start",[1,-1]]],"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"front":[[343.6,570.12,"end",[-0.62,0.62]],[386.2,523.8,"start",[1,-1]]],"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f2","sel":"f2a","var":{"up":{"x":504,"y":186,"anc":"start"},"down":{"x":504,"y":626,"anc":"start"},"left":{"x":306.43,"y":363.57,"anc":"start"},"right":{"x":715.72,"y":377.72,"anc":"start"},"front":{"x":289.86,"y":516.38,"anc":"end"},"back":{"x":581.04,"y":246.04,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn2t","k":"fn2","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"down":[[480,726,"middle",[0,1]],[480,646,"middle",[0,-1]]],"left":[[210,470,"end",[-1,1]],[210,390,"end",[-1,-1]]],"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"front":[[343.6,610.12,"end",[-0.62,1]],[343.6,530.12,"end",[-0.62,-1]]],"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn2","sel":"f2a","var":{"up":{"x":480,"y":74,"anc":"middle"},"down":{"x":480,"y":786,"anc":"middle"},"left":{"x":210,"y":390,"anc":"end"},"right":{"x":700.5,"y":527.98,"anc":"start"},"front":{"x":397.65,"y":667.17,"anc":"end"},"back":{"x":617.49,"y":198.78,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":214,"anc":"middle"},{"f":"c","id":"fs2front","cx":346.08,"cy":563.92,"r":16,"fill":"w","sign":"•","need":"f2","sel":"f2a","var":{"front":{}},"vis":[],"t":"F"},{"f":"c","id":"fs2back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f2","sel":"f2a","var":{"back":{}},"vis":[],"t":"F"},{"f":"ar","id":"fa3","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f3","sel":"f3a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210},"down":{"x0":480,"y0":440,"x1":480,"y1":650},"left":{"x0":470,"y0":430,"x1":240,"y1":430},"right":{"x0":490,"y0":430,"x1":720,"y1":430},"front":{"x0":473.8,"y0":436.2,"x1":362.2,"y1":547.8},"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"up","gr":"f3d","vis":[],"t":"F"},{"f":"lb","id":"f3t","k":"f3","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"down":[[480,686,"middle",[0,1]],[504,626,"start",[1,-1]]],"left":[[210,430,"end",[-1,0]],[264,406,"start",[1,-1]]],"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"front":[[343.6,570.12,"end",[-0.62,0.62]],[386.2,523.8,"start",[1,-1]]],"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f3","sel":"f3a","var":{"up":{"x":404,"y":174,"anc":"middle"},"down":{"x":556,"y":686,"anc":"middle"},"left":{"x":214.5,"y":348.02,"anc":"start"},"right":{"x":711.47,"y":331.05,"anc":"start"},"front":{"x":499.34,"y":467.23,"anc":"start"},"back":{"x":681.45,"y":261.6,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn3t","k":"fn3","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"down":[[480,726,"middle",[0,1]],[480,646,"middle",[0,-1]]],"left":[[210,470,"end",[-1,1]],[210,390,"end",[-1,-1]]],"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"front":[[343.6,610.12,"end",[-0.62,1]],[343.6,530.12,"end",[-0.62,-1]]],"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn3","sel":"f3a","var":{"up":{"x":424,"y":226,"anc":"middle"},"down":{"x":424,"y":616,"anc":"middle"},"left":{"x":197.27,"y":519.5,"anc":"end"},"right":{"x":803.74,"y":416.26,"anc":"start"},"front":{"x":334.08,"y":465.43,"anc":"end"},"back":{"x":625.92,"y":394.57,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":214,"anc":"middle"},{"f":"c","id":"fs3front","cx":346.08,"cy":563.92,"r":16,"fill":"w","sign":"•","need":"f3","sel":"f3a","var":{"front":{}},"vis":[],"t":"F"},{"f":"c","id":"fs3back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f3","sel":"f3a","var":{"back":{}},"vis":[],"t":"F"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  bl: {"vars":[],"items":[{"f":"ln","id":"mb0","pts":[[120,200],[920,200]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh0","x0":216,"y0":200,"x1":246,"y1":200,"sel":"mba","var":{"right":{"x0":216,"y0":200,"x1":246,"y1":200},"left":{"x0":248,"y0":200,"x1":218,"y1":200}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb1","pts":[[120,310],[920,310]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh1","x0":216,"y0":310,"x1":246,"y1":310,"sel":"mba","var":{"right":{"x0":216,"y0":310,"x1":246,"y1":310},"left":{"x0":248,"y0":310,"x1":218,"y1":310}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb2","pts":[[120,420],[920,420]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh2","x0":216,"y0":420,"x1":246,"y1":420,"sel":"mba","var":{"right":{"x0":216,"y0":420,"x1":246,"y1":420},"left":{"x0":248,"y0":420,"x1":218,"y1":420}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb3","pts":[[120,530],[920,530]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh3","x0":216,"y0":530,"x1":246,"y1":530,"sel":"mba","var":{"right":{"x0":216,"y0":530,"x1":246,"y1":530},"left":{"x0":248,"y0":530,"x1":218,"y1":530}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb4","pts":[[120,640],[920,640]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh4","x0":216,"y0":640,"x1":246,"y1":640,"sel":"mba","var":{"right":{"x0":216,"y0":640,"x1":246,"y1":640},"left":{"x0":248,"y0":640,"x1":218,"y1":640}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"mbt","k":"mb","bases":[[910,170,"end",[0,-1]],[930,200,"start",[1,0]]],"need":"mb","vis":[],"t":"F","x":910,"y":170,"anc":"end"},{"f":"ln","id":"cd","pts":[[520,590],[520,250]],"w":8,"sel":"ang","var":{"90":{"pts":[[520,590],[520,250]]}},"dflt":"90","col":"#e67700","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":470,"y0":590,"x1":470,"y1":250,"two":1,"w":2,"need":"l","sel":"ang","var":{"90":{"x0":470,"y0":590,"x1":470,"y1":250}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[440,420,"end",[-1,0]]],"vbases":{"90":[[440,420,"end",[-1,0]]]},"need":"l","sel":"ang","var":{"90":{"x":440,"y":380,"anc":"end"}},"dflt":"90","vis":[],"t":"F","x":440,"y":420,"anc":"end"},{"f":"ar","id":"ia","x0":520,"y0":303.5,"x1":520,"y1":383.5,"w":5,"need":"i","sel":["ang","ia"],"var":{"90|up":{"x0":520,"y0":383.5,"x1":520,"y1":303.5},"90|down":{"x0":520,"y0":303.5,"x1":520,"y1":383.5}},"dflt":"90|down","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[560,343.5,"start",[1,0]]],"vbases":{"90|up":[[560,343.5,"start",[1,0]]],"90|down":[[560,343.5,"start",[1,0]]]},"need":"i","sel":["ang","ia"],"var":{"90|up":{"x":560,"y":343.5,"anc":"start"},"90|down":{"x":560,"y":343.5,"anc":"start"}},"dflt":"90|down","vis":[],"t":"F","x":560,"y":343.5,"anc":"start"},{"f":"c","id":"fc","cx":730,"cy":365,"r":24,"fill":"w","o":["fd"],"vis":[],"t":"F","sel":["ang","fa"],"var":{"90|front":{"cx":730,"cy":365,"sign":"•"},"90|back":{"cx":730,"cy":365,"sign":"×"},"90|":{"cx":730,"cy":365},"60|front":{"cx":730,"cy":365,"sign":"•"},"60|back":{"cx":730,"cy":365,"sign":"×"},"60|":{"cx":730,"cy":365},"30|front":{"cx":730,"cy":365,"sign":"•"},"30|back":{"cx":730,"cy":365,"sign":"×"},"30|":{"cx":730,"cy":365}},"dflt":"90|"},{"f":"lb","id":"ft","k":"f","bases":[[766,365,"start",[1,0]]],"vbases":{"90":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]],"60":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]],"30":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]]},"o":["fd"],"need":"f","sel":"ang","var":{"90":{"x":766,"y":365,"anc":"start"},"60":{"x":766,"y":365,"anc":"start"},"30":{"x":766,"y":365,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":766,"y":365,"anc":"start"},{"f":"ln","id":"tha","pts":[[520,590],[520,590]],"w":3,"o":["thd"],"need":"th","sel":"ang","var":{"90":{"pts":[[520,590],[520,590]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"tht","k":"th","bases":[[644,568,"start",[1,-0.3]],[670,624,"start",[1,0.5]]],"vbases":{"90":[[644,568,"start",[1,-0.3]],[670,624,"start",[1,0.5]]]},"o":["thd"],"need":"th","sel":"ang","var":{"90":{"x":644,"y":568,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":644,"y":568,"anc":"start"},{"f":"ln","id":"cmp","pts":[[520,250],[520,590]],"dash":1,"w":3,"o":["compd"],"need":"comp","sel":"ang","var":{"90":{"pts":[[520,250],[520,590]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"compt","k":"comp","bases":[[652.22,585,"end",[-1,0]],[687.22,475,"start",[1,0]]],"o":["compd"],"need":"comp","vis":[],"t":"F","x":652.22,"y":585,"anc":"end"},{"f":"ln","id":"vl","pts":[[520,590],[520,230]],"dash":1,"w":3,"o":["vld"],"need":"vl","sel":"ang","var":{"90":{"pts":[[520,590],[520,230]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"vlt","k":"vl","bases":[[352.78,165,"end",[-1,0]]],"o":["vld"],"need":"vl","vis":[],"t":"F","x":352.78,"y":165,"anc":"end"},{"f":"ln","id":"tva","pts":[[520,590],[520,590]],"w":3,"o":["tvd"],"need":"tv","sel":"ang","var":{"90":{"pts":[[520,590],[520,590]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"tvt","k":"tv","bases":[[402.78,385,"start",[1,-1]]],"o":["tvd"],"need":"tv","vis":[],"t":"F","x":402.78,"y":385,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  mo: {"vars":[],"items":[{"f":"ln","id":"plb","pts":[[120,230],[240,230],[240,610],[120,610]],"w":3,"close":1,"sel":"pls","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"plbt","x":180,"y":420,"s":"N","anc":"middle","size":40,"sel":"pls","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"plt","k":"pl","bases":[[180,196,"middle",[0,-1]]],"need":"pl","vis":[],"t":"F","x":180,"y":196,"anc":"middle"},{"f":"ln","id":"prb","pts":[[800,230],[920,230],[920,610],[800,610]],"w":3,"close":1,"sel":"prs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"prbt","x":860,"y":420,"s":"N","anc":"middle","size":40,"sel":"prs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"prt","k":"pr","bases":[[860,196,"middle",[0,-1]]],"need":"pr","vis":[],"t":"F","x":860,"y":196,"anc":"middle"},{"f":"ln","id":"mb0","pts":[[250,260],[790,260]],"w":3,"sel":"st","var":{"up":{"w":7},"down":{"w":2},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh0","x0":334,"y0":260,"x1":364,"y1":260,"sel":"mba","var":{"right":{"x0":334,"y0":260,"x1":364,"y1":260},"left":{"x0":364,"y0":260,"x1":334,"y1":260}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb1","pts":[[250,310],[790,310]],"w":3,"sel":"st","var":{"up":{"w":7},"down":{"w":2},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh1","x0":334,"y0":310,"x1":364,"y1":310,"sel":"mba","var":{"right":{"x0":334,"y0":310,"x1":364,"y1":310},"left":{"x0":364,"y0":310,"x1":334,"y1":310}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb2","pts":[[250,530],[790,530]],"w":3,"sel":"st","var":{"up":{"w":2},"down":{"w":7},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh2","x0":334,"y0":530,"x1":364,"y1":530,"sel":"mba","var":{"right":{"x0":334,"y0":530,"x1":364,"y1":530},"left":{"x0":364,"y0":530,"x1":334,"y1":530}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb3","pts":[[250,580],[790,580]],"w":3,"sel":"st","var":{"up":{"w":2},"down":{"w":7},"":{"w":3}},"dflt":"","vis":[],"t":"F"},{"f":"ar","id":"mbh3","x0":334,"y0":580,"x1":364,"y1":580,"sel":"mba","var":{"right":{"x0":334,"y0":580,"x1":364,"y1":580},"left":{"x0":364,"y0":580,"x1":334,"y1":580}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"mbt","k":"mb","bases":[[780,226,"end",[0,-1]]],"need":"mb","vis":[],"t":"F","x":780,"y":226,"anc":"end"},{"f":"ln","id":"fl","pts":[[590,420],[589.4,429.14],[587.61,438.12],[584.67,446.79],[580.62,455],[575.53,462.61],[569.5,469.5],[562.61,475.53],[555,480.62],[546.79,484.67],[538.12,487.61],[529.14,489.4],[520,490],[510.86,489.4],[501.88,487.61],[493.21,484.67],[485,480.62],[477.39,475.53],[470.5,469.5],[464.47,462.61],[459.38,455],[455.33,446.79],[452.39,438.12],[450.6,429.14],[450,420],[450.6,410.86],[452.39,401.88],[455.33,393.21],[459.38,385],[464.47,377.39],[470.5,370.5],[477.39,364.47],[485,359.38],[493.21,355.33],[501.88,352.39],[510.86,350.6],[520,350],[529.14,350.6],[538.12,352.39],[546.79,355.33],[555,359.38],[562.61,364.47],[569.5,370.5],[575.53,377.39],[580.62,385],[584.67,393.21],[587.61,401.88],[589.4,410.86],[590,420]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":575.16,"y0":376.9,"x1":563.1,"y1":364.84,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":575.16,"y0":376.9,"x1":563.1,"y1":364.84},"cw":{"x0":563.1,"y0":364.84,"x1":575.16,"y1":376.9}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":476.9,"y0":364.84,"x1":464.84,"y1":376.9,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":476.9,"y0":364.84,"x1":464.84,"y1":376.9},"cw":{"x0":464.84,"y0":376.9,"x1":476.9,"y1":364.84}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh2","x0":464.84,"y0":463.1,"x1":476.9,"y1":475.16,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":464.84,"y0":463.1,"x1":476.9,"y1":475.16},"cw":{"x0":476.9,"y0":475.16,"x1":464.84,"y1":463.1}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh3","x0":563.1,"y0":475.16,"x1":575.16,"y1":463.1,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":563.1,"y0":475.16,"x1":575.16,"y1":463.1},"cw":{"x0":575.16,"y0":463.1,"x1":563.1,"y1":475.16}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[590,480,"start",[1,1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":590,"y":480,"anc":"start"},{"f":"c","id":"cc","cx":520,"cy":420,"r":30,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[480,466,"end",[-1,1]]],"need":"c","vis":[],"t":"F","x":426.26,"y":497.11,"anc":"end"},{"f":"ar","id":"fa","x0":620,"y0":420,"x1":620,"y1":260,"w":5,"need":"f","sel":"fa","var":{"up":{"x0":620,"y0":410,"x1":620,"y1":250},"down":{"x0":620,"y0":430,"x1":620,"y1":590}},"dflt":"up","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[638,340,"start",[1,0]],[602,340,"end",[-1,0]],[620,230,"middle",[0,-1]]],"vbases":{"up":[[638,340,"start",[1,0]],[602,340,"end",[-1,0]],[620,230,"middle",[0,-1]]],"down":[[638,500,"start",[1,0]],[602,500,"end",[-1,0]],[620,610,"middle",[0,1]]]},"need":"f","sel":"fa","var":{"up":{"x":638,"y":340,"anc":"start"},"down":{"x":638,"y":500,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":638,"y":340,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"c","id":"o","cx":480,"cy":430,"r":7,"fill":"k","vis":[1],"t":"F"},{"f":"lb","id":"handt","k":"hand","bases":[[140,160,"start",[-1,-1]]],"need":"hand","vis":[1],"t":"F","x":140,"y":160,"anc":"start"},{"f":"ar","id":"fa1","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f1","sel":"f1a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210},"down":{"x0":480,"y0":440,"x1":480,"y1":650},"left":{"x0":470,"y0":430,"x1":240,"y1":430},"right":{"x0":490,"y0":430,"x1":720,"y1":430},"front":{"x0":473.8,"y0":436.2,"x1":362.2,"y1":547.8},"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"up","gr":"f1d","vis":[1],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"down":[[480,686,"middle",[0,1]],[504,626,"start",[1,-1]]],"left":[[210,430,"end",[-1,0]],[264,406,"start",[1,-1]]],"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"front":[[343.6,570.12,"end",[-0.62,0.62]],[386.2,523.8,"start",[1,-1]]],"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f1","sel":"f1a","var":{"up":{"x":480,"y":174,"anc":"middle"},"down":{"x":480,"y":686,"anc":"middle"},"left":{"x":252.69,"y":394.69,"anc":"start"},"right":{"x":750,"y":430,"anc":"start"},"front":{"x":323.8,"y":567.29,"anc":"end"},"back":{"x":636.2,"y":292.71,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn1t","k":"fn1","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"down":[[480,726,"middle",[0,1]],[480,646,"middle",[0,-1]]],"left":[[210,470,"end",[-1,1]],[210,390,"end",[-1,-1]]],"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"front":[[343.6,610.12,"end",[-0.62,1]],[343.6,530.12,"end",[-0.62,-1]]],"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn1","sel":"f1a","var":{"up":{"x":480,"y":122,"anc":"middle"},"down":{"x":480,"y":738,"anc":"middle"},"left":{"x":210,"y":470,"anc":"end"},"right":{"x":738.69,"y":481.31,"anc":"start"},"front":{"x":340.44,"y":615.22,"anc":"end"},"back":{"x":615.92,"y":344.29,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":480,"y":214,"anc":"middle"},{"f":"c","id":"fs1front","cx":346.08,"cy":563.92,"r":16,"fill":"w","sign":"•","need":"f1","sel":"f1a","var":{"front":{}},"vis":[1],"t":"F"},{"f":"c","id":"fs1back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f1","sel":"f1a","var":{"back":{}},"vis":[1],"t":"F"},{"f":"ar","id":"fa2","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f2","sel":"f2a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210},"down":{"x0":480,"y0":440,"x1":480,"y1":650},"left":{"x0":470,"y0":430,"x1":240,"y1":430},"right":{"x0":490,"y0":430,"x1":720,"y1":430},"front":{"x0":473.8,"y0":436.2,"x1":362.2,"y1":547.8},"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"up","gr":"f2d","vis":[1],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"down":[[480,686,"middle",[0,1]],[504,626,"start",[1,-1]]],"left":[[210,430,"end",[-1,0]],[264,406,"start",[1,-1]]],"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"front":[[343.6,570.12,"end",[-0.62,0.62]],[386.2,523.8,"start",[1,-1]]],"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f2","sel":"f2a","var":{"up":{"x":504,"y":186,"anc":"start"},"down":{"x":504,"y":626,"anc":"start"},"left":{"x":306.43,"y":363.57,"anc":"start"},"right":{"x":715.72,"y":377.72,"anc":"start"},"front":{"x":285.62,"y":520.62,"anc":"end"},"back":{"x":581.04,"y":246.04,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn2t","k":"fn2","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"down":[[480,726,"middle",[0,1]],[480,646,"middle",[0,-1]]],"left":[[210,470,"end",[-1,1]],[210,390,"end",[-1,-1]]],"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"front":[[343.6,610.12,"end",[-0.62,1]],[343.6,530.12,"end",[-0.62,-1]]],"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn2","sel":"f2a","var":{"up":{"x":480,"y":74,"anc":"middle"},"down":{"x":480,"y":786,"anc":"middle"},"left":{"x":210,"y":390,"anc":"end"},"right":{"x":700.5,"y":527.98,"anc":"start"},"front":{"x":397.65,"y":667.17,"anc":"end"},"back":{"x":617.49,"y":198.78,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":480,"y":214,"anc":"middle"},{"f":"c","id":"fs2front","cx":346.08,"cy":563.92,"r":16,"fill":"w","sign":"•","need":"f2","sel":"f2a","var":{"front":{}},"vis":[1],"t":"F"},{"f":"c","id":"fs2back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f2","sel":"f2a","var":{"back":{}},"vis":[1],"t":"F"},{"f":"ar","id":"fa3","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f3","sel":"f3a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210},"down":{"x0":480,"y0":440,"x1":480,"y1":650},"left":{"x0":470,"y0":430,"x1":240,"y1":430},"right":{"x0":490,"y0":430,"x1":720,"y1":430},"front":{"x0":473.8,"y0":436.2,"x1":362.2,"y1":547.8},"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"up","gr":"f3d","vis":[1],"t":"F"},{"f":"lb","id":"f3t","k":"f3","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"down":[[480,686,"middle",[0,1]],[504,626,"start",[1,-1]]],"left":[[210,430,"end",[-1,0]],[264,406,"start",[1,-1]]],"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"front":[[343.6,570.12,"end",[-0.62,0.62]],[386.2,523.8,"start",[1,-1]]],"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f3","sel":"f3a","var":{"up":{"x":404,"y":174,"anc":"middle"},"down":{"x":556,"y":686,"anc":"middle"},"left":{"x":214.5,"y":348.02,"anc":"start"},"right":{"x":711.47,"y":331.05,"anc":"start"},"front":{"x":499.34,"y":467.23,"anc":"start"},"back":{"x":681.45,"y":261.6,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn3t","k":"fn3","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"down":[[480,726,"middle",[0,1]],[480,646,"middle",[0,-1]]],"left":[[210,470,"end",[-1,1]],[210,390,"end",[-1,-1]]],"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"front":[[343.6,610.12,"end",[-0.62,1]],[343.6,530.12,"end",[-0.62,-1]]],"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn3","sel":"f3a","var":{"up":{"x":424,"y":226,"anc":"middle"},"down":{"x":424,"y":616,"anc":"middle"},"left":{"x":173.23,"y":518.08,"anc":"end"},"right":{"x":807.98,"y":420.5,"anc":"start"},"front":{"x":325.58,"y":470.69,"anc":"end"},"back":{"x":625.92,"y":394.57,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":480,"y":214,"anc":"middle"},{"f":"c","id":"fs3front","cx":346.08,"cy":563.92,"r":16,"fill":"w","sign":"•","need":"f3","sel":"f3a","var":{"front":{}},"vis":[1],"t":"F"},{"f":"c","id":"fs3back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f3","sel":"f3a","var":{"back":{}},"vis":[1],"t":"F"},{"f":"ln","id":"plbx1","pts":[[120,230],[240,230],[240,610],[120,610]],"w":3,"close":1,"sel":"pls","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[2],"t":"F"},{"f":"tx","id":"plbtx1","x":180,"y":420,"s":"N","anc":"middle","size":40,"sel":"pls","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[2],"t":"F"},{"f":"lb","id":"pltx1","k":"pl","bases":[[180,196,"middle",[0,-1]]],"need":"pl","vis":[2],"t":"F","x":180,"y":196,"anc":"middle","n":"plx1"},{"f":"ln","id":"prbx1","pts":[[800,230],[920,230],[920,610],[800,610]],"w":3,"close":1,"sel":"prs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[2],"t":"F"},{"f":"tx","id":"prbtx1","x":860,"y":420,"s":"N","anc":"middle","size":40,"sel":"prs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[2],"t":"F"},{"f":"lb","id":"prtx1","k":"pr","bases":[[860,196,"middle",[0,-1]]],"need":"pr","vis":[2],"t":"F","x":860,"y":196,"anc":"middle","n":"prx1"},{"f":"ln","id":"mb0x1","pts":[[250,260],[790,260]],"w":3,"sel":"st","var":{"up":{"w":7},"down":{"w":2},"":{"w":3}},"dflt":"","vis":[2],"t":"F"},{"f":"ar","id":"mbh0x1","x0":334,"y0":260,"x1":364,"y1":260,"sel":"mba","var":{"right":{"x0":334,"y0":260,"x1":364,"y1":260},"left":{"x0":364,"y0":260,"x1":334,"y1":260}},"dflt":"right","vis":[2],"t":"F"},{"f":"ln","id":"mb1x1","pts":[[250,310],[790,310]],"w":3,"sel":"st","var":{"up":{"w":7},"down":{"w":2},"":{"w":3}},"dflt":"","vis":[2],"t":"F"},{"f":"ar","id":"mbh1x1","x0":334,"y0":310,"x1":364,"y1":310,"sel":"mba","var":{"right":{"x0":334,"y0":310,"x1":364,"y1":310},"left":{"x0":364,"y0":310,"x1":334,"y1":310}},"dflt":"right","vis":[2],"t":"F"},{"f":"ln","id":"mb2x1","pts":[[250,530],[790,530]],"w":3,"sel":"st","var":{"up":{"w":2},"down":{"w":7},"":{"w":3}},"dflt":"","vis":[2],"t":"F"},{"f":"ar","id":"mbh2x1","x0":334,"y0":530,"x1":364,"y1":530,"sel":"mba","var":{"right":{"x0":334,"y0":530,"x1":364,"y1":530},"left":{"x0":364,"y0":530,"x1":334,"y1":530}},"dflt":"right","vis":[2],"t":"F"},{"f":"ln","id":"mb3x1","pts":[[250,580],[790,580]],"w":3,"sel":"st","var":{"up":{"w":2},"down":{"w":7},"":{"w":3}},"dflt":"","vis":[2],"t":"F"},{"f":"ar","id":"mbh3x1","x0":334,"y0":580,"x1":364,"y1":580,"sel":"mba","var":{"right":{"x0":334,"y0":580,"x1":364,"y1":580},"left":{"x0":364,"y0":580,"x1":334,"y1":580}},"dflt":"right","vis":[2],"t":"F"},{"f":"lb","id":"mbtx1","k":"mb","bases":[[780,226,"end",[0,-1]]],"need":"mb","vis":[2],"t":"F","x":780,"y":226,"anc":"end","n":"mbx1"},{"f":"ln","id":"flx1","pts":[[590,420],[589.4,429.14],[587.61,438.12],[584.67,446.79],[580.62,455],[575.53,462.61],[569.5,469.5],[562.61,475.53],[555,480.62],[546.79,484.67],[538.12,487.61],[529.14,489.4],[520,490],[510.86,489.4],[501.88,487.61],[493.21,484.67],[485,480.62],[477.39,475.53],[470.5,469.5],[464.47,462.61],[459.38,455],[455.33,446.79],[452.39,438.12],[450.6,429.14],[450,420],[450.6,410.86],[452.39,401.88],[455.33,393.21],[459.38,385],[464.47,377.39],[470.5,370.5],[477.39,364.47],[485,359.38],[493.21,355.33],[501.88,352.39],[510.86,350.6],[520,350],[529.14,350.6],[538.12,352.39],[546.79,355.33],[555,359.38],[562.61,364.47],[569.5,370.5],[575.53,377.39],[580.62,385],[584.67,393.21],[587.61,401.88],[589.4,410.86],[590,420]],"w":3,"o":["fld"],"need":"fl","vis":[2],"t":"F"},{"f":"ar","id":"flh0x1","x0":575.16,"y0":376.9,"x1":563.1,"y1":364.84,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":575.16,"y0":376.9,"x1":563.1,"y1":364.84},"cw":{"x0":563.1,"y0":364.84,"x1":575.16,"y1":376.9}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh1x1","x0":476.9,"y0":364.84,"x1":464.84,"y1":376.9,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":476.9,"y0":364.84,"x1":464.84,"y1":376.9},"cw":{"x0":464.84,"y0":376.9,"x1":476.9,"y1":364.84}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh2x1","x0":464.84,"y0":463.1,"x1":476.9,"y1":475.16,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":464.84,"y0":463.1,"x1":476.9,"y1":475.16},"cw":{"x0":476.9,"y0":475.16,"x1":464.84,"y1":463.1}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh3x1","x0":563.1,"y0":475.16,"x1":575.16,"y1":463.1,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":563.1,"y0":475.16,"x1":575.16,"y1":463.1},"cw":{"x0":575.16,"y0":463.1,"x1":563.1,"y1":475.16}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"lb","id":"fltx1","k":"fl","bases":[[590,480,"start",[1,1]]],"o":["fld"],"need":"fl","vis":[2],"t":"F","x":590,"y":480,"anc":"start","n":"flx1"},{"f":"c","id":"ccx1","cx":520,"cy":420,"r":30,"fill":"w","vis":[2],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ctx1","k":"c","bases":[[480,466,"end",[-1,1]]],"need":"c","vis":[2],"t":"F","x":426.26,"y":497.11,"anc":"end","n":"cx1"},{"f":"ar","id":"fax1","x0":620,"y0":420,"x1":620,"y1":260,"w":5,"need":"f","sel":"fa","var":{"up":{"x0":620,"y0":410,"x1":620,"y1":250},"down":{"x0":620,"y0":430,"x1":620,"y1":590}},"dflt":"up","gr":"fd","col":"#c2255c","vis":[2],"t":"F"},{"f":"lb","id":"ftx1","k":"f","bases":[[638,340,"start",[1,0]],[602,340,"end",[-1,0]],[620,230,"middle",[0,-1]]],"vbases":{"up":[[638,340,"start",[1,0]],[602,340,"end",[-1,0]],[620,230,"middle",[0,-1]]],"down":[[638,500,"start",[1,0]],[602,500,"end",[-1,0]],[620,610,"middle",[0,1]]]},"need":"f","sel":"fa","var":{"up":{"x":638,"y":348,"anc":"start"},"down":{"x":638,"y":492,"anc":"start"}},"dflt":"up","vis":[2],"t":"F","x":638,"y":340,"anc":"start","n":"fx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU21s2fl(d, p, L){ tbFig_Draw(d, p, L, U21S2K.fl); }
function tbU21s2bl(d, p, L){ tbFig_Draw(d, p, L, U21S2K.bl); }
function tbU21s2mo(d, p, L){ tbFig_Draw(d, p, L, U21S2K.mo); }
function tbU21s2sw(d, p, L){ tbFig_Draw(d, p, L, U21S2K.sw); }
// ---- 21-3 電磁力の大きさ の図（※ textbook/gen/make_section.py が textbook/gen/data/u21_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U21S3K = {
  bl: {"vars":[],"items":[{"f":"ln","id":"mb0","pts":[[120,200],[920,200]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh0","x0":216,"y0":200,"x1":246,"y1":200,"sel":"mba","var":{"right":{"x0":216,"y0":200,"x1":246,"y1":200},"left":{"x0":248,"y0":200,"x1":218,"y1":200}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb1","pts":[[120,310],[920,310]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh1","x0":216,"y0":310,"x1":246,"y1":310,"sel":"mba","var":{"right":{"x0":216,"y0":310,"x1":246,"y1":310},"left":{"x0":248,"y0":310,"x1":218,"y1":310}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb2","pts":[[120,420],[920,420]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh2","x0":216,"y0":420,"x1":246,"y1":420,"sel":"mba","var":{"right":{"x0":216,"y0":420,"x1":246,"y1":420},"left":{"x0":248,"y0":420,"x1":218,"y1":420}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb3","pts":[[120,530],[920,530]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh3","x0":216,"y0":530,"x1":246,"y1":530,"sel":"mba","var":{"right":{"x0":216,"y0":530,"x1":246,"y1":530},"left":{"x0":248,"y0":530,"x1":218,"y1":530}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb4","pts":[[120,640],[920,640]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh4","x0":216,"y0":640,"x1":246,"y1":640,"sel":"mba","var":{"right":{"x0":216,"y0":640,"x1":246,"y1":640},"left":{"x0":248,"y0":640,"x1":218,"y1":640}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"mbt","k":"mb","bases":[[910,170,"end",[0,-1]],[930,200,"start",[1,0]]],"need":"mb","vis":[],"t":"F","x":910,"y":170,"anc":"end"},{"f":"ln","id":"cd","pts":[[520,590],[520,250]],"w":8,"sel":"ang","var":{"90":{"pts":[[520,590],[520,250]]}},"dflt":"90","col":"#e67700","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":470,"y0":590,"x1":470,"y1":250,"two":1,"w":2,"need":"l","sel":"ang","var":{"90":{"x0":470,"y0":590,"x1":470,"y1":250}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[440,420,"end",[-1,0]]],"vbases":{"90":[[440,420,"end",[-1,0]]]},"need":"l","sel":"ang","var":{"90":{"x":440,"y":380,"anc":"end"}},"dflt":"90","vis":[],"t":"F","x":440,"y":420,"anc":"end"},{"f":"ar","id":"ia","x0":520,"y0":303.5,"x1":520,"y1":383.5,"w":5,"need":"i","sel":["ang","ia"],"var":{"90|up":{"x0":520,"y0":383.5,"x1":520,"y1":303.5},"90|down":{"x0":520,"y0":303.5,"x1":520,"y1":383.5}},"dflt":"90|down","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[560,343.5,"start",[1,0]]],"vbases":{"90|up":[[560,343.5,"start",[1,0]]],"90|down":[[560,343.5,"start",[1,0]]]},"need":"i","sel":["ang","ia"],"var":{"90|up":{"x":560,"y":343.5,"anc":"start"},"90|down":{"x":560,"y":343.5,"anc":"start"}},"dflt":"90|down","vis":[],"t":"F","x":560,"y":343.5,"anc":"start"},{"f":"c","id":"fc","cx":730,"cy":365,"r":24,"fill":"w","o":["fd"],"vis":[],"t":"F","sel":["ang","fa"],"var":{"90|front":{"cx":730,"cy":365,"sign":"•"},"90|back":{"cx":730,"cy":365,"sign":"×"},"90|":{"cx":730,"cy":365},"60|front":{"cx":730,"cy":365,"sign":"•"},"60|back":{"cx":730,"cy":365,"sign":"×"},"60|":{"cx":730,"cy":365},"30|front":{"cx":730,"cy":365,"sign":"•"},"30|back":{"cx":730,"cy":365,"sign":"×"},"30|":{"cx":730,"cy":365}},"dflt":"90|"},{"f":"lb","id":"ft","k":"f","bases":[[766,365,"start",[1,0]]],"vbases":{"90":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]],"60":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]],"30":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]]},"o":["fd"],"need":"f","sel":"ang","var":{"90":{"x":766,"y":365,"anc":"start"},"60":{"x":766,"y":365,"anc":"start"},"30":{"x":766,"y":365,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":766,"y":365,"anc":"start"},{"f":"ln","id":"tha","pts":[[520,590],[520,590]],"w":3,"o":["thd"],"need":"th","sel":"ang","var":{"90":{"pts":[[520,590],[520,590]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"tht","k":"th","bases":[[644,568,"start",[1,-0.3]],[670,624,"start",[1,0.5]]],"vbases":{"90":[[644,568,"start",[1,-0.3]],[670,624,"start",[1,0.5]]]},"o":["thd"],"need":"th","sel":"ang","var":{"90":{"x":644,"y":568,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":644,"y":568,"anc":"start"},{"f":"ln","id":"cmp","pts":[[520,250],[520,590]],"dash":1,"w":3,"o":["compd"],"need":"comp","sel":"ang","var":{"90":{"pts":[[520,250],[520,590]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"compt","k":"comp","bases":[[652.22,585,"end",[-1,0]],[687.22,475,"start",[1,0]]],"o":["compd"],"need":"comp","vis":[],"t":"F","x":652.22,"y":585,"anc":"end"},{"f":"ln","id":"vl","pts":[[520,590],[520,230]],"dash":1,"w":3,"o":["vld"],"need":"vl","sel":"ang","var":{"90":{"pts":[[520,590],[520,230]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"vlt","k":"vl","bases":[[352.78,165,"end",[-1,0]]],"o":["vld"],"need":"vl","vis":[],"t":"F","x":352.78,"y":165,"anc":"end"},{"f":"ln","id":"tva","pts":[[520,590],[520,590]],"w":3,"o":["tvd"],"need":"tv","sel":"ang","var":{"90":{"pts":[[520,590],[520,590]]}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"tvt","k":"tv","bases":[[402.78,385,"start",[1,-1]]],"o":["tvd"],"need":"tv","vis":[],"t":"F","x":402.78,"y":385,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU21s3bl(d, p, L){ tbFig_Draw(d, p, L, U21S3K.bl); }
// ---- 21-4 斜めの導体 の図（※ textbook/gen/make_section.py が textbook/gen/data/u21_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U21S4K = {
  bl: {"vars":[],"items":[{"f":"ln","id":"mb0","pts":[[120,200],[920,200]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh0","x0":216,"y0":200,"x1":246,"y1":200,"sel":"mba","var":{"right":{"x0":216,"y0":200,"x1":246,"y1":200},"left":{"x0":248,"y0":200,"x1":218,"y1":200}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb1","pts":[[120,310],[920,310]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh1","x0":216,"y0":310,"x1":246,"y1":310,"sel":"mba","var":{"right":{"x0":216,"y0":310,"x1":246,"y1":310},"left":{"x0":248,"y0":310,"x1":218,"y1":310}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb2","pts":[[120,420],[920,420]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh2","x0":216,"y0":420,"x1":246,"y1":420,"sel":"mba","var":{"right":{"x0":216,"y0":420,"x1":246,"y1":420},"left":{"x0":248,"y0":420,"x1":218,"y1":420}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb3","pts":[[120,530],[920,530]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh3","x0":216,"y0":530,"x1":246,"y1":530,"sel":"mba","var":{"right":{"x0":216,"y0":530,"x1":246,"y1":530},"left":{"x0":248,"y0":530,"x1":218,"y1":530}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"mb4","pts":[[120,640],[920,640]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"mbh4","x0":216,"y0":640,"x1":246,"y1":640,"sel":"mba","var":{"right":{"x0":216,"y0":640,"x1":246,"y1":640},"left":{"x0":248,"y0":640,"x1":218,"y1":640}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"mbt","k":"mb","bases":[[910,170,"end",[0,-1]],[930,200,"start",[1,0]]],"need":"mb","vis":[],"t":"F","x":910,"y":158,"anc":"end"},{"f":"ln","id":"cd","pts":[[520,590],[520,250]],"w":8,"sel":"ang","var":{"90":{"pts":[[520,590],[520,250]]},"60":{"pts":[[435,567.22],[605,272.78]]},"30":{"pts":[[372.78,505],[667.22,335]]},"0":{"pts":[[350,420],[690,420]]}},"dflt":"90","col":"#e67700","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":470,"y0":590,"x1":470,"y1":250,"two":1,"w":2,"need":"l","sel":"ang","var":{"90":{"x0":470,"y0":590,"x1":470,"y1":250},"60":{"x0":391.7,"y0":542.22,"x1":561.7,"y1":247.78},"30":{"x0":347.78,"y0":461.7,"x1":642.22,"y1":291.7},"0":{"x0":350,"y0":370,"x1":690,"y1":370}},"dflt":"90","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[440,420,"end",[-1,0]]],"vbases":{"90":[[440,420,"end",[-1,0]]],"60":[[450.72,380,"end",[-0.87,-0.5]]],"30":[[480,350.72,"end",[-0.5,-0.87]]],"0":[[520,340,"end",[0,-1]]]},"need":"l","sel":"ang","var":{"90":{"x":320,"y":364,"anc":"end"},"60":{"x":307.83,"y":267.48,"anc":"end"},"30":{"x":480,"y":350.72,"anc":"end"},"0":{"x":520,"y":340,"anc":"end"}},"dflt":"90","vis":[],"t":"F","x":440,"y":420,"anc":"end"},{"f":"ar","id":"ia","x0":520,"y0":303.5,"x1":520,"y1":383.5,"w":5,"need":"i","sel":["ang","ia"],"var":{"90|up":{"x0":520,"y0":383.5,"x1":520,"y1":303.5},"90|down":{"x0":520,"y0":303.5,"x1":520,"y1":383.5},"60|up":{"x0":538.25,"y0":388.39,"x1":578.25,"y1":319.11},"60|down":{"x0":578.25,"y0":319.11,"x1":538.25,"y1":388.39},"30|up":{"x0":551.61,"y0":401.75,"x1":620.89,"y1":361.75},"30|down":{"x0":620.89,"y0":361.75,"x1":551.61,"y1":401.75},"0|up":{"x0":556.5,"y0":420,"x1":636.5,"y1":420},"0|down":{"x0":636.5,"y0":420,"x1":556.5,"y1":420}},"dflt":"90|down","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[560,343.5,"start",[1,0]]],"vbases":{"90|up":[[560,343.5,"start",[1,0]]],"90|down":[[560,343.5,"start",[1,0]]],"60|up":[[592.89,373.75,"start",[0.87,0.5]]],"60|down":[[592.89,373.75,"start",[0.87,0.5]]],"30|up":[[606.25,416.39,"start",[0.5,0.87]]],"30|down":[[606.25,416.39,"start",[0.5,0.87]]],"0|up":[[596.5,460,"start",[0,1]]],"0|down":[[596.5,460,"start",[0,1]]]},"need":"i","sel":["ang","ia"],"var":{"90|up":{"x":680,"y":267.5,"anc":"start"},"90|down":{"x":680,"y":267.5,"anc":"start"},"60|up":{"x":748.78,"y":463.75,"anc":"start"},"60|down":{"x":748.78,"y":463.75,"anc":"start"},"30|up":{"x":696.25,"y":572.28,"anc":"start"},"30|down":{"x":696.25,"y":572.28,"anc":"start"},"0|up":{"x":596.5,"y":684,"anc":"start"},"0|down":{"x":596.5,"y":684,"anc":"start"}},"dflt":"90|down","vis":[],"t":"F","x":560,"y":343.5,"anc":"start"},{"f":"c","id":"fc","cx":730,"cy":365,"r":24,"fill":"w","o":["fd"],"vis":[],"t":"F","sel":["ang","fa"],"var":{"90|front":{"cx":730,"cy":365,"sign":"•"},"90|back":{"cx":730,"cy":365,"sign":"×"},"90|":{"cx":730,"cy":365},"60|front":{"cx":730,"cy":365,"sign":"•"},"60|back":{"cx":730,"cy":365,"sign":"×"},"60|":{"cx":730,"cy":365},"30|front":{"cx":730,"cy":365,"sign":"•"},"30|back":{"cx":730,"cy":365,"sign":"×"},"30|":{"cx":730,"cy":365}},"dflt":"90|"},{"f":"lb","id":"ft","k":"f","bases":[[766,365,"start",[1,0]]],"vbases":{"90":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]],"60":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]],"30":[[766,365,"start",[1,0]],[730,405,"middle",[0,1]]]},"o":["fd"],"need":"f","sel":"ang","var":{"90":{"x":766,"y":365,"anc":"start"},"60":{"x":766,"y":365,"anc":"start"},"30":{"x":766,"y":365,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":766,"y":365,"anc":"start"},{"f":"ln","id":"tha","pts":[[442.78,505],[442.71,501.95],[442.51,498.9],[442.18,495.86],[441.71,492.84],[441.12,489.85],[440.39,486.88],[439.54,483.95],[438.55,481.06],[437.45,478.21],[436.22,475.42],[434.87,472.68],[433.4,470]],"w":3,"o":["thd"],"need":"th","sel":"ang","var":{"90":{"pts":[[520,590],[520,590]]},"60":{"pts":[[505,567.22],[504.73,561.12],[503.94,555.07],[502.61,549.11],[500.78,543.28],[498.44,537.64],[495.62,532.22],[492.34,527.07],[488.62,522.23],[484.5,517.73],[480,513.6],[475.15,509.88],[470,506.6]]},"30":{"pts":[[442.78,505],[442.71,501.95],[442.51,498.9],[442.18,495.86],[441.71,492.84],[441.12,489.85],[440.39,486.88],[439.54,483.95],[438.55,481.06],[437.45,478.21],[436.22,475.42],[434.87,472.68],[433.4,470]]},"0":{"pts":[[350,420],[350,420]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"tht","k":"th","bases":[[496.78,483,"start",[1,-0.3]],[522.78,539,"start",[1,0.5]]],"vbases":{"90":[[644,568,"start",[1,-0.3]],[670,624,"start",[1,0.5]]],"60":[[559,545.22,"start",[1,-0.3]],[585,601.22,"start",[1,0.5]]],"30":[[496.78,483,"start",[1,-0.3]],[522.78,539,"start",[1,0.5]]],"0":[[474,398,"start",[1,-0.3]],[500,454,"start",[1,0.5]]]},"o":["thd"],"need":"th","sel":"ang","var":{"90":{"x":777.33,"y":677.67,"anc":"start"},"60":{"x":697.7,"y":742.54,"anc":"start"},"30":{"x":496.78,"y":483,"anc":"start"},"0":{"x":474,"y":398,"anc":"start"}},"dflt":"30","vis":[],"t":"F","x":496.78,"y":483,"anc":"start"},{"f":"ln","id":"cmp","pts":[[667.22,335],[667.22,505]],"dash":1,"w":3,"o":["compd"],"need":"comp","sel":"ang","var":{"90":{"pts":[[520,250],[520,590]]},"60":{"pts":[[605,272.78],[605,567.22]]},"30":{"pts":[[667.22,335],[667.22,505]]},"0":{"pts":[[690,420],[690,420]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"compt","k":"comp","bases":[[652.22,585,"end",[-1,0]],[687.22,475,"start",[1,0]]],"o":["compd"],"need":"comp","vis":[],"t":"F","x":652.22,"y":585,"anc":"end"},{"f":"ln","id":"vl","pts":[[372.78,505],[372.78,145]],"dash":1,"w":3,"o":["vld"],"need":"vl","sel":"ang","var":{"90":{"pts":[[520,590],[520,230]]},"60":{"pts":[[435,567.22],[435,207.22]]},"30":{"pts":[[372.78,505],[372.78,145]]},"0":{"pts":[[350,420],[350,60]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"vlt","k":"vl","bases":[[352.78,165,"end",[-1,0]]],"o":["vld"],"need":"vl","vis":[],"t":"F","x":340.78,"y":157,"anc":"end"},{"f":"ln","id":"tva","pts":[[450.72,460],[446.5,453.38],[441.72,447.15],[436.42,441.36],[430.63,436.06],[424.4,431.28],[417.78,427.06],[410.81,423.43],[403.56,420.43],[396.07,418.07],[388.4,416.37],[380.62,415.34],[372.78,415]],"w":3,"o":["tvd"],"need":"tv","sel":"ang","var":{"90":{"pts":[[520,590],[520,590]]},"60":{"pts":[[480,489.28],[476.56,487.39],[473.04,485.66],[469.44,484.08],[465.78,482.65],[462.06,481.39],[458.29,480.29],[454.48,479.36],[450.63,478.59],[446.75,477.99],[442.84,477.57],[438.93,477.31],[435,477.22]]},"30":{"pts":[[450.72,460],[446.5,453.38],[441.72,447.15],[436.42,441.36],[430.63,436.06],[424.4,431.28],[417.78,427.06],[410.81,423.43],[403.56,420.43],[396.07,418.07],[388.4,416.37],[380.62,415.34],[372.78,415]]},"0":{"pts":[[440,420],[439.23,408.25],[436.93,396.71],[433.15,385.56],[427.94,375],[421.4,365.21],[413.64,356.36],[404.79,348.6],[395,342.06],[384.44,336.85],[373.29,333.07],[361.75,330.77],[350,330]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"tvt","k":"tv","bases":[[402.78,385,"start",[1,-1]]],"o":["tvd"],"need":"tv","vis":[],"t":"F","x":402.78,"y":385,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU21s4bl(d, p, L){ tbFig_Draw(d, p, L, U21S4K.bl); }
// ---- 21-5 平行な2本の導体 の図（※ textbook/gen/make_section.py が textbook/gen/data/u21_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U21S5K = {
  pa: {"vars":[],"items":[{"f":"ln","id":"w1","pts":[[360,160],[360,680]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[680,160],[680,440]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"w2b","pts":[[680,500],[680,680]],"w":6,"vis":[],"t":"F"},{"f":"ar","id":"ia1","x0":334,"y0":280,"x1":334,"y1":180,"need":"i1","sel":"ia1","var":{"up":{"x0":334,"y0":310,"x1":334,"y1":210},"down":{"x0":334,"y0":210,"x1":334,"y1":310}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[352,230,"start",[1,0]],[316,230,"end",[-1,0]],[334,150,"middle",[0,-1]]],"vbases":{"up":[[352,230,"start",[1,0]],[316,230,"end",[-1,0]],[334,150,"middle",[0,-1]]],"down":[[352,330,"start",[1,0]],[316,330,"end",[-1,0]],[334,410,"middle",[0,1]]]},"need":"i1","sel":"ia1","var":{"up":{"x":334,"y":90,"anc":"middle"},"down":{"x":316,"y":330,"anc":"end"}},"dflt":"up","vis":[],"t":"F","x":352,"y":230,"anc":"start"},{"f":"ar","id":"ia2","x0":706,"y0":280,"x1":706,"y1":180,"need":"i2","sel":"ia2","var":{"up":{"x0":706,"y0":310,"x1":706,"y1":210},"down":{"x0":706,"y0":210,"x1":706,"y1":310}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i2t","k":"i2","bases":[[724,230,"start",[1,0]],[688,230,"end",[-1,0]],[706,150,"middle",[0,-1]]],"vbases":{"up":[[724,230,"start",[1,0]],[688,230,"end",[-1,0]],[706,150,"middle",[0,-1]]],"down":[[724,330,"start",[1,0]],[688,330,"end",[-1,0]],[706,410,"middle",[0,1]]]},"need":"i2","sel":"ia2","var":{"up":{"x":706,"y":90,"anc":"middle"},"down":{"x":904,"y":330,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":724,"y":230,"anc":"start"},{"f":"c","id":"h2c","cx":680,"cy":470,"r":24,"fill":"w","o":["h2d"],"vis":[],"t":"F","sel":["h2a"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"h2t","k":"h2","bases":[[716,510,"start",[1,1]]],"o":["h2d"],"need":"h2","vis":[],"t":"F","x":758.43,"y":552.43,"anc":"start"},{"f":"ar","id":"f1a","x0":374,"y0":470,"x1":484,"y1":470,"need":"f1","sel":"f1a","var":{"in":{"x0":374,"y0":470,"x1":484,"y1":470},"out":{"x0":346,"y0":470,"x1":236,"y1":470}},"dflt":"in","gr":"f1d","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[429,440,"middle",[0,-1]],[429,500,"middle",[0,1]],[500,470,"start",[1,0]]],"vbases":{"in":[[429,440,"middle",[0,-1]],[429,500,"middle",[0,1]],[500,470,"start",[1,0]]],"out":[[291,440,"middle",[0,-1]],[291,500,"middle",[0,1]],[220,470,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":429,"y":410,"anc":"middle"},"out":{"x":291,"y":530,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":429,"y":440,"anc":"middle"},{"f":"ar","id":"f2a","x0":632,"y0":470,"x1":522,"y1":470,"need":"f2","sel":"f2a","var":{"in":{"x0":632,"y0":470,"x1":522,"y1":470},"out":{"x0":728,"y0":470,"x1":838,"y1":470}},"dflt":"in","gr":"f2d","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[577,440,"middle",[0,-1]],[577,500,"middle",[0,1]],[506,470,"end",[-1,0]]],"vbases":{"in":[[577,440,"middle",[0,-1]],[577,500,"middle",[0,1]],[506,470,"end",[-1,0]]],"out":[[783,440,"middle",[0,-1]],[783,500,"middle",[0,1]],[854,470,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":577,"y":440,"anc":"middle"},"out":{"x":920,"y":470,"anc":"start"}},"dflt":"in","vis":[],"t":"F","x":577,"y":440,"anc":"middle"},{"f":"ln","id":"re1","pts":[[360,692],[360,754]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,692],[680,754]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":360,"y0":740,"x1":680,"y1":740,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[520,780,"middle",[0,1]],[520,700,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":520,"y":810,"anc":"middle"},{"f":"ln","id":"le1","pts":[[696,160],[894,160]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ln","id":"le2","pts":[[696,680],[894,680]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":880,"y0":160,"x1":880,"y1":680,"two":1,"w":2,"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[896,420,"start",[1,0]],[864,420,"end",[-1,0]]],"need":"l","vis":[],"t":"F","x":896,"y":420,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU21s5pa(d, p, L){ tbFig_Draw(d, p, L, U21S5K.pa); }
var KINDS = {u21s1mo: tbU21s1mo, u21s2fl: tbU21s2fl, u21s2bl: tbU21s2bl, u21s2mo: tbU21s2mo, u21s2sw: tbU21s2sw, u21s3bl: tbU21s3bl, u21s4bl: tbU21s4bl, u21s5pa: tbU21s5pa};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 21-1 の図は電流が流れないので載せない,
  // 21-2 の図は電流が流れないので載せない,
  // 21-3 の図は電流が流れないので載せない,
  // 21-4 の図は電流が流れないので載せない,
  // 21-5 の図は電流が流れないので載せない
};

// 21-1 電磁力の向き の練習（※ textbook/gen/make_section.py が textbook/gen/data/u21_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU21s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU21s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU21s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU21s1_par(a, b){ return a * b / (a + b); }
function tbU21s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU21s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU21s1_Qdir(r){
  var gcd = tbU21s1_gcd, ratio = tbU21s1_ratio, par = tbU21s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var a = (k <= 2 ? 'N' : 'S');
    var b = (k <= 2 ? 'S' : 'N');
    var mba = (k <= 2 ? 'right' : 'left');
    var ca = (k % 2 == 1 ? 'front' : 'back');
    var fla = (k % 2 == 1 ? 'ccw' : 'cw');
    var cnm = (k % 2 == 1 ? '手前向き（・）' : '奥向き（×）');
    var top = (k == 2 || k == 3 ? 1 : 0);
    var st = (top ? 'up' : 'down');
    var fa = (top ? 'down' : 'up');
    var mbw = (k <= 2 ? '右向き' : '左向き');
    var flw = (k % 2 == 1 ? '反時計回り' : '時計回り');
    var good = (top ? '下向き' : '上向き');
    var bad = (top ? '上向き' : '下向き');
    var why = (top ? '上向きになるのは、下側で強め合う時' : '下向きになるのは、上側で強め合う時');
    var sn = (top ? '上側' : '下側');
    var wn = (top ? '下側' : '上側');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: String(mbw), v: "mb", why: "それは磁石の磁界の向き。力は強め合う側から弱め合う側へ"}, {t: "力は働かない", v: "none", why: "磁界の中の導体に電流を流すと、力が働く"}]);
    return {form: "u21s1dir", text: "図のように、左に " + String(a) + " 極、右に " + String(b) + " 極を置き、間の導体に" + String(cnm) + "の電流を流した。導体に働く力の向きはどれか。", fig: {kind: "u21s1mo", L: tbU21s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","mb":"","mba":"right","c":"{I}","ca":"front","fl":"","fla":null,"st":null,"f":"{F}","fa":null}, [["pl", String(a)], ["pls", String(a)], ["pr", String(b)], ["prs", String(b)], ["mba", String(mba)], ["ca", String(ca)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁石の磁界は " + String(mbw) + "、電流の磁界は " + String(flw), String(sn) + "で強め合い、" + String(wn) + "で弱め合うので、力は " + String(good)], chk: {form: "u21s1dir", p: {k: k}}};
  }
  throw new Error("u21s1dir：条件に合う数字が見つからない");
}
function tbU21s1_Qside(r){
  var gcd = tbU21s1_gcd, ratio = tbU21s1_ratio, par = tbU21s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var a = (k <= 2 ? 'N' : 'S');
    var b = (k <= 2 ? 'S' : 'N');
    var mba = (k <= 2 ? 'right' : 'left');
    var ca = (k % 2 == 1 ? 'front' : 'back');
    var fla = (k % 2 == 1 ? 'ccw' : 'cw');
    var cnm = (k % 2 == 1 ? '手前向き（・）' : '奥向き（×）');
    var top = (k == 2 || k == 3 ? 1 : 0);
    var st = (top ? 'up' : 'down');
    var fa = (top ? 'down' : 'up');
    var mbw = (k <= 2 ? '右向き' : '左向き');
    var flw = (k % 2 == 1 ? '反時計回り' : '時計回り');
    var good = (top ? '導体の上側' : '導体の下側');
    var bad = (top ? '導体の下側' : '導体の上側');
    var why = ('電流の磁界が、磁石の磁界と同じ向きになる側が強め合う');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "導体の右側", v: "r", why: "磁石の磁界は右向きか左向きなので、強め合うのは上側か下側"}, {t: "どこも同じ", v: "same", why: "電流の磁界は回るので、上と下で向きが逆になる"}]);
    return {form: "u21s1side", text: "図のように、左に " + String(a) + " 極、右に " + String(b) + " 極を置き、間の導体に" + String(cnm) + "の電流を流した。2つの磁界が強め合うのはどこか。", fig: {kind: "u21s1mo", L: tbU21s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","mb":"","mba":"right","c":"{I}","ca":"front","fl":"","fla":null,"st":null,"f":"{F}","fa":null}, [["pl", String(a)], ["pls", String(a)], ["pr", String(b)], ["prs", String(b)], ["mba", String(mba)], ["ca", String(ca)], ["fl", ""], ["fla", String(fla)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁石の磁界は " + String(mbw) + "、電流の磁界は " + String(flw), "同じ向きになるのは " + String(good)], chk: {form: "u21s1side", p: {k: k}}};
  }
  throw new Error("u21s1side：条件に合う数字が見つからない");
}
function tbU21s1_Qrule(r){
  var gcd = tbU21s1_gcd, ratio = tbU21s1_ratio, par = tbU21s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁界が強め合う側から、弱め合う側", v: "own"}, {t: "磁界が弱め合う側から、強め合う側", v: "rev", why: "押されるのは、強め合う側から弱め合う側へ"}, {t: "N 極から S 極の向き", v: "ns", why: "それは磁石の磁界の向き"}, {t: "電流と同じ向き", v: "i", why: "力は、電流と同じ向きには働かない"}]);
    return {form: "u21s1rule", text: "磁界の中の導体に電流を流すと、導体は □ へ押される。", fig: {kind: "u21s1mo", L: tbU21s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","mb":"","mba":"right","c":"{I}","ca":"front","fl":"","fla":null,"st":null,"f":"{F}","fa":null}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["導体は、磁界が強め合う側から、弱め合う側へ押される"], chk: {form: "u21s1rule", p: {}}};
  }
  throw new Error("u21s1rule：条件に合う数字が見つからない");
}
function tbU21s1_Qname(r){
  var gcd = tbU21s1_gcd, ratio = tbU21s1_ratio, par = tbU21s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "電磁力", v: "own"}, {t: "磁力", v: "m", why: "磁力は、磁極に働く力"}, {t: "クーロン力", v: "c", why: "クーロン力は、電荷どうしに働く力"}, {t: "磁界", v: "h", why: "磁界は、磁力が働いている空間"}]);
    return {form: "u21s1name", text: "磁界の中の導体に電流を流した時に、導体に働く力を □ という。", fig: {kind: "u21s1mo", L: tbU21s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","mb":"","mba":"right","c":"{I}","ca":"front","fl":"","fla":null,"st":null,"f":"{F}","fa":null}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁界の中の導体に電流を流した時に、導体に働く力を電磁力という"], chk: {form: "u21s1name", p: {}}};
  }
  throw new Error("u21s1name：条件に合う数字が見つからない");
}
// 21-2 フレミングの左手の法則 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u21_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU21s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU21s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU21s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU21s2_par(a, b){ return a * b / (a + b); }
function tbU21s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU21s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU21s2_Qfinger(r){
  var gcd = tbU21s2_gcd, ratio = tbU21s2_ratio, par = tbU21s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var fg = (k == 1 ? '中指' : (k == 2 ? '人差し指' : '親指'));
    var good = (k == 1 ? '電流の向き' : (k == 2 ? '磁界の向き' : '力の向き'));
    var b1 = (k == 1 ? '磁界の向き' : '電流の向き');
    var w1 = (k == 1 ? '磁界は人差し指' : '電流は中指');
    var b2 = (k == 3 ? '磁界の向き' : '力の向き');
    var w2 = (k == 3 ? '磁界は人差し指' : '力は親指');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(b1), v: "b1", why: String(w1)}, {t: String(b2), v: "b2", why: String(w2)}, {t: "導体の長さ", v: "len", why: "3本の指が表すのは、電流・磁界・力"}]);
    return {form: "u21s2finger", text: "フレミングの左手の法則で、" + String(fg) + "が表すのはどれか。", fig: {kind: "u21s2fl", L: tbU21s2_fig({"mb":"{B}","mba":"right","l":"","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":null}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["中指から順に、電・磁・力", String(fg) + "は " + String(good)], chk: {form: "u21s2finger", p: {k: k}}};
  }
  throw new Error("u21s2finger：条件に合う数字が見つからない");
}
function tbU21s2_Qplane(r){
  var gcd = tbU21s2_gcd, ratio = tbU21s2_ratio, par = tbU21s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var j = pick(r, [1,2]);
    var k = pick(r, [1,2]);
    var ia = (j == 1 ? 'up' : 'down');
    var inm = (j == 1 ? '上向き' : '下向き');
    var mba = (k == 1 ? 'right' : 'left');
    var bnm = (k == 1 ? '右向き' : '左向き');
    var back = (j == k ? 1 : 0);
    var good = (back ? '奥向き' : '手前向き');
    var bad = (back ? '手前向き' : '奥向き');
    var why = (back ? '手前向きにするには、電流か磁界のどちらかを逆にする' : '奥向きにするには、電流か磁界のどちらかを逆にする');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: String(bnm), v: "b", why: "それは磁界の向き。力は親指の向き"}, {t: String(inm), v: "i", why: "それは電流の向き。力は親指の向き"}]);
    return {form: "u21s2plane", text: "図のように、" + String(bnm) + "の磁界の中に導体を置き、" + String(inm) + "に電流を流した。導体に働く力の向きはどれか。", fig: {kind: "u21s2bl", L: tbU21s2_fig({"mb":"{B}","mba":"right","l":"","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":null}, [["ia", String(ia)], ["mba", String(mba)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["中指（電流）を" + String(inm) + "に、人差し指（磁界）を" + String(bnm) + "に向ける", "親指（力）は " + String(good)], chk: {form: "u21s2plane", p: {j: j, k: k}}};
  }
  throw new Error("u21s2plane：条件に合う数字が見つからない");
}
function tbU21s2_Qdir(r){
  var gcd = tbU21s2_gcd, ratio = tbU21s2_ratio, par = tbU21s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var a = (k <= 2 ? 'N' : 'S');
    var b = (k <= 2 ? 'S' : 'N');
    var mba = (k <= 2 ? 'right' : 'left');
    var ca = (k % 2 == 1 ? 'front' : 'back');
    var cnm = (k % 2 == 1 ? '手前向き（・）' : '奥向き（×）');
    var cto = (k % 2 == 1 ? '手前' : '奥');
    var bnm = (k <= 2 ? '右' : '左');
    var up = (k == 1 || k == 4 ? 1 : 0);
    var good = (up ? '上向き' : '下向き');
    var bad = (up ? '下向き' : '上向き');
    var why = (up ? '下向きになるのは、電流が逆向きの時' : '上向きになるのは、電流が逆向きの時');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: String(bnm) + "向き", v: "b", why: "それは磁界の向き。力は親指の向き"}, {t: "力は働かない", v: "none", why: "磁界の中の導体に電流を流すと、力が働く"}]);
    return {form: "u21s2dir", text: "図のように、左に " + String(a) + " 極、右に " + String(b) + " 極を置き、間の導体に" + String(cnm) + "の電流を流した。導体に働く力の向きはどれか。", fig: {kind: "u21s2mo", L: tbU21s2_fig({"mb":"{B}","mba":"right","l":"","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":null}, [["pl", String(a)], ["pls", String(a)], ["pr", String(b)], ["prs", String(b)], ["mb", ""], ["mba", String(mba)], ["c", "{I}"], ["ca", String(ca)], ["fl", null], ["fla", null], ["st", null], ["f", "{F}"], ["fa", null], ["l", null], ["ang", null], ["i", null], ["ia", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["中指（電流）を" + String(cto) + "に、人差し指（磁界）を" + String(bnm) + "に向ける", "親指（力）は " + String(good)], chk: {form: "u21s2dir", p: {k: k}}};
  }
  throw new Error("u21s2dir：条件に合う数字が見つからない");
}
function tbU21s2_Qqty(r){
  var gcd = tbU21s2_gcd, ratio = tbU21s2_ratio, par = tbU21s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var q = (k == 1 ? '電流' : (k == 2 ? '磁界' : '力'));
    var good = (k == 1 ? '中指' : (k == 2 ? '人差し指' : '親指'));
    var b1 = (k == 1 ? '人差し指' : '中指');
    var w1 = (k == 1 ? '人差し指は磁界' : '中指は電流');
    var b2 = (k == 3 ? '人差し指' : '親指');
    var w2 = (k == 3 ? '人差し指は磁界' : '親指は力');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(b1), v: "b1", why: String(w1)}, {t: String(b2), v: "b2", why: String(w2)}, {t: "右手の親指", v: "r", why: "電磁力の向きは左手で考える。右手の親指は右ねじの法則"}]);
    return {form: "u21s2qty", text: "フレミングの左手の法則で、" + String(q) + "の向きを表す指はどれか。", fig: {kind: "u21s2fl", L: tbU21s2_fig({"mb":"{B}","mba":"right","l":"","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":null}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["中指から順に、電・磁・力", String(q) + "は " + String(good)], chk: {form: "u21s2qty", p: {k: k}}};
  }
  throw new Error("u21s2qty：条件に合う数字が見つからない");
}
// 21-3 電磁力の大きさ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u21_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU21s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU21s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU21s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU21s3_par(a, b){ return a * b / (a + b); }
function tbU21s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU21s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU21s3_Qf(r){
  var gcd = tbU21s3_gcd, ratio = tbU21s3_ratio, par = tbU21s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var l = pick(r, [0.1,0.2,0.25,0.3,0.4,0.5,0.6,0.8]);
    var F0 = (b * I * l);
    var A = (b * I);
    var B = (b * I / l);
    var C = (I * l);
    if (!(nice(F0) && nice(B) && F0 >= 0.01 && distinct([F0, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F0) + "\\,\\mathrm{N}$", v: fmt(F0)}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "導体の長さを掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{N}$", v: fmt(B), why: "導体の長さで割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "磁束密度を掛けていない"}]);
    return {form: "u21s3f", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中に、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体を磁界と垂直に置き、$" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した。導体に働く電磁力の大きさは何 N か。", fig: {kind: "u21s3bl", L: tbU21s3_fig({"mb":"{B}","mba":"right","l":"{l}","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":"front"}, [["mb", "{B}=" + fmt(b) + " T"], ["i", "{I}=" + fmt(I) + " A"], ["l", "{l}=" + fmt(l) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = BIl$", "$F = " + fmt(b) + " \\times " + fmt(I) + " \\times " + fmt(l) + " = " + fmt(F0) + "\\,\\mathrm{N}$"], chk: {form: "u21s3f", p: {b: b, I: I, l: l}}};
  }
  throw new Error("u21s3f：条件に合う数字が見つからない");
}
function tbU21s3_Qi(r){
  var gcd = tbU21s3_gcd, ratio = tbU21s3_ratio, par = tbU21s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var fv = pick(r, [0.1,0.2,0.4,0.5,0.6,0.8,1,1.2,1.5,2,3]);
    var l = pick(r, [0.1,0.2,0.25,0.4,0.5]);
    if (!(nice(fv / (b * l)) && fv / (b * l) >= 0.5 && fv / (b * l) <= 20)) continue;
    var ok = (fv / (b * l));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU21s3_three(ok, [{x: (fv * b * l), why: "割るところを掛けた"}, {x: (fv / b), why: "導体の長さで割っていない"}, {x: (b * l / fv), why: "割る順が逆"}, {x: (fv / l), why: "磁束密度で割っていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u21s3i", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中に、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体を磁界と垂直に置き、電流を流すと、$" + fmt(fv) + "\\,\\mathrm{N}$ の電磁力が働いた。流した電流は何 A か。", fig: {kind: "u21s3bl", L: tbU21s3_fig({"mb":"{B}","mba":"right","l":"{l}","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":"front"}, [["mb", "{B}=" + fmt(b) + " T"], ["i", "{I}"], ["l", "{l}=" + fmt(l) + " m"], ["f", "{F}=" + fmt(fv) + " N"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = BIl$ を変形して $I = \\dfrac{F}{Bl}$", "$I = \\dfrac{" + fmt(fv) + "}{" + fmt(b) + " \\times " + fmt(l) + "} = " + qv(ok, "A") + "$"], chk: {form: "u21s3i", p: {b: b, fv: fv, l: l}}};
  }
  throw new Error("u21s3i：条件に合う数字が見つからない");
}
function tbU21s3_Qb(r){
  var gcd = tbU21s3_gcd, ratio = tbU21s3_ratio, par = tbU21s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [1,2,4,5,8,10]);
    var fv = pick(r, [0.1,0.2,0.4,0.5,0.6,0.8,1,1.2,1.5,2]);
    var l = pick(r, [0.1,0.2,0.25,0.4,0.5]);
    var B = (fv / (I * l));
    var A = (fv * I * l);
    var C = (fv / I);
    var D = (I * l / fv);
    if (!(nice(B) && nice(A) && nice(C) && nice(D) && A >= 0.001 && B >= 0.05 && B <= 5 && distinct([B, A, C, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(B) + "\\,\\mathrm{T}$", v: fmt(B)}, {t: "$" + fmt(A) + "\\,\\mathrm{T}$", v: fmt(A), why: "割るところを掛けた"}, {t: "$" + fmt(C) + "\\,\\mathrm{T}$", v: fmt(C), why: "導体の長さで割っていない"}, {t: "$" + fmt(D) + "\\,\\mathrm{T}$", v: fmt(D), why: "割る順が逆"}]);
    return {form: "u21s3b", text: "長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体を磁界と垂直に置き、$" + fmt(I) + "\\,\\mathrm{A}$ の電流を流すと、$" + fmt(fv) + "\\,\\mathrm{N}$ の電磁力が働いた。磁束密度は何 T か。", fig: {kind: "u21s3bl", L: tbU21s3_fig({"mb":"{B}","mba":"right","l":"{l}","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":"front"}, [["mb", "{B}"], ["i", "{I}=" + fmt(I) + " A"], ["l", "{l}=" + fmt(l) + " m"], ["f", "{F}=" + fmt(fv) + " N"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = BIl$ を変形して $B = \\dfrac{F}{Il}$", "$B = \\dfrac{" + fmt(fv) + "}{" + fmt(I) + " \\times " + fmt(l) + "} = " + fmt(B) + "\\,\\mathrm{T}$"], chk: {form: "u21s3b", p: {I: I, fv: fv, l: l}}};
  }
  throw new Error("u21s3b：条件に合う数字が見つからない");
}
function tbU21s3_Qeq(r){
  var gcd = tbU21s3_gcd, ratio = tbU21s3_ratio, par = tbU21s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$BIl$", v: "own"}, {t: "$\\dfrac{BI}{l}$", v: "div", why: "導体が長いほど力は大きいので、$l$ は掛ける"}, {t: "$mH$", v: "mh", why: "それは磁界の中の磁極に働く磁力"}, {t: "$\\dfrac{I}{2 \\pi r}$", v: "h", why: "それは直線の導体のまわりの磁界の強さ"}]);
    return {form: "u21s3eq", text: "磁束密度 $B$［T］の磁界の中に、長さ $l$［m］の導体を磁界と垂直に置き、電流 $I$［A］を流した。電磁力の大きさ $F$［N］は □ である。", fig: {kind: "u21s3bl", L: tbU21s3_fig({"mb":"{B}","mba":"right","l":"{l}","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":"front"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$B$・$I$・$l$ が大きいほど大きな力", "$F = BIl$"], chk: {form: "u21s3eq", p: {}}};
  }
  throw new Error("u21s3eq：条件に合う数字が見つからない");
}
// 21-4 斜めの導体 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u21_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU21s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU21s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU21s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU21s4_par(a, b){ return a * b / (a + b); }
function tbU21s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU21s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU21s4_Qf30(r){
  var gcd = tbU21s4_gcd, ratio = tbU21s4_ratio, par = tbU21s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var l = pick(r, [0.1,0.2,0.25,0.4,0.5,0.6,0.8,1]);
    var F0 = (b * I * l * 0.5);
    var A = (b * I * l);
    var B = (b * I * l * 2);
    var C = (b * I * 0.5);
    if (!(nice(F0) && nice(C) && F0 >= 0.01 && distinct([F0, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F0) + "\\,\\mathrm{N}$", v: fmt(F0)}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "$\\sin 30^\\circ$ を掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{N}$", v: fmt(B), why: "$\\sin 30^\\circ$ で割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "導体の長さを掛けていない"}]);
    return {form: "u21s4f30", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中に、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体を、磁界の向きと $30^\\circ$ の角度で置き、$" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した。導体に働く電磁力の大きさは何 N か。ただし $\\sin 30^\\circ = 0.5$ とする。", fig: {kind: "u21s4bl", L: tbU21s4_fig({"mb":"{B}","mba":"right","l":"{l}","ang":30,"i":"{I}","ia":"up","f":"{F}","fa":"back","th":"{θ}","comp":""}, [["mb", "{B}=" + fmt(b) + " T"], ["i", "{I}=" + fmt(I) + " A"], ["l", "{l}=" + fmt(l) + " m"], ["th", "30°"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = BIl \\sin \\theta$", "$F = " + fmt(b) + " \\times " + fmt(I) + " \\times " + fmt(l) + " \\times 0.5 = " + fmt(F0) + "\\,\\mathrm{N}$"], chk: {form: "u21s4f30", p: {b: b, I: I, l: l}}};
  }
  throw new Error("u21s4f30：条件に合う数字が見つからない");
}
function tbU21s4_Qang(r){
  var gcd = tbU21s4_gcd, ratio = tbU21s4_ratio, par = tbU21s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var a = (k == 1 ? 60 : 30);
    var g = (k == 1 ? 30 : 60);
    var _c = choices(r, [{t: "$" + fmt(g) + "^\\circ$", v: "good"}, {t: "$" + fmt(a) + "^\\circ$", v: "bad", why: "それは磁界に垂直な線との角度。$\\theta$ は磁界の向きとのなす角"}, {t: "$90^\\circ$", v: "90", why: "導体は斜めなので、磁界と垂直ではない"}, {t: "$0^\\circ$", v: "0", why: "導体は斜めなので、磁界と平行ではない"}]);
    return {form: "u21s4ang", text: "磁界の中に、導体を斜めに置いた。導体と、磁界に垂直な線との角度は $" + fmt(a) + "^\\circ$ である。$F = BIl \\sin \\theta$ の $\\theta$ に入れる角度はどれか。", fig: {kind: "u21s4bl", L: tbU21s4_fig({"mb":"{B}","mba":"right","l":"{l}","ang":30,"i":"{I}","ia":"up","f":"{F}","fa":"back","th":"{θ}","comp":""}, [["th", null], ["vl", "磁界に垂直な線"], ["tv", fmt(a) + "°"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\theta$ は、磁界の向きと導体の向きのなす角", "$90^\\circ - " + fmt(a) + "^\\circ = " + fmt(g) + "^\\circ$"], chk: {form: "u21s4ang", p: {k: k}}};
  }
  throw new Error("u21s4ang：条件に合う数字が見つからない");
}
function tbU21s4_Qpar(r){
  var gcd = tbU21s4_gcd, ratio = tbU21s4_ratio, par = tbU21s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var l = pick(r, [0.2,0.4,0.5,1]);
    var A = (b * I * l);
    var H = (b * I * l * 0.5);
    var C = (b * I);
    if (!(nice(A) && nice(H) && distinct([A, H, C]))) continue;
    var _c = choices(r, [{t: "$0\\,\\mathrm{N}$", v: "0"}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "平行な導体の電流には、磁界と垂直な成分が無い"}, {t: "$" + fmt(H) + "\\,\\mathrm{N}$", v: fmt(H), why: "平行な時は、磁界と垂直な成分が無い。半分にはならない"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "平行な導体には、力が働かない"}]);
    return {form: "u21s4par", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中に、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体を、磁界の向きと平行に置き、$" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した。導体に働く電磁力の大きさは何 N か。", fig: {kind: "u21s4bl", L: tbU21s4_fig({"mb":"{B}","mba":"right","l":"{l}","ang":30,"i":"{I}","ia":"up","f":"{F}","fa":"back","th":"{θ}","comp":""}, [["mb", "{B}=" + fmt(b) + " T"], ["i", "{I}=" + fmt(I) + " A"], ["l", "{l}=" + fmt(l) + " m"], ["ang", 0], ["th", null], ["f", null], ["fa", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁界と平行な電流には、磁界と垂直な成分が無い", "力は働かないので $0\\,\\mathrm{N}$"], chk: {form: "u21s4par", p: {b: b, I: I, l: l}}};
  }
  throw new Error("u21s4par：条件に合う数字が見つからない");
}
function tbU21s4_Qcomp(r){
  var gcd = tbU21s4_gcd, ratio = tbU21s4_ratio, par = tbU21s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "電流のうち、磁界と垂直な成分だけ", v: "own"}, {t: "電流のうち、磁界と平行な成分だけ", v: "par", why: "磁界と平行な成分は、電磁力に関係しない"}, {t: "電流の向きに関係なく、電流の全部", v: "all", why: "斜めの時は、磁界と垂直な成分だけが効く"}, {t: "磁束密度だけ", v: "b", why: "電流と導体の長さも関係する"}]);
    return {form: "u21s4comp", text: "斜めに置いた導体に働く電磁力に関係するのは、□ である。", fig: {kind: "u21s4bl", L: tbU21s4_fig({"mb":"{B}","mba":"right","l":"{l}","ang":30,"i":"{I}","ia":"up","f":"{F}","fa":"back","th":"{θ}","comp":""}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電磁力に関係するのは、電流のうち磁界と垂直な成分だけ", "そのため $F = BIl \\sin \\theta$"], chk: {form: "u21s4comp", p: {}}};
  }
  throw new Error("u21s4comp：条件に合う数字が見つからない");
}
// 21-5 平行な2本の導体 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u21_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU21s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU21s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU21s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU21s5_par(a, b){ return a * b / (a + b); }
function tbU21s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU21s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU21s5_Qf(r){
  var gcd = tbU21s5_gcd, ratio = tbU21s5_ratio, par = tbU21s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var i1 = pick(r, [1,2,3,4,5,6,8,10]);
    var i2 = pick(r, [1,2,3,4,5,6,8,10]);
    var l = pick(r, [0.5,2,3,4,5]);
    var d = pick(r, [0.1,0.2,0.4,0.5,2,4]);
    var c = (2 * i1 * i2 * l / d);
    var A = (2 * i1 * i2 * l / (d * d));
    var B = (2 * i1 * i2 / d);
    var C = (2 * (i1 + i2) * l / d);
    if (!(nice(c) && nice(A) && nice(B) && nice(C) && c >= 1 && c <= 10000 && distinct([c, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(c) + " \\times 10^{-7}\\,\\mathrm{N}$", v: fmt(c)}, {t: "$" + fmt(A) + " \\times 10^{-7}\\,\\mathrm{N}$", v: fmt(A), why: "距離を2乗した"}, {t: "$" + fmt(B) + " \\times 10^{-7}\\,\\mathrm{N}$", v: fmt(B), why: "導体の長さを掛けていない"}, {t: "$" + fmt(C) + " \\times 10^{-7}\\,\\mathrm{N}$", v: fmt(C), why: "電流の積でなく和を使った"}]);
    return {form: "u21s5f", text: "真空中で、$" + fmt(d) + "\\,\\mathrm{m}$ 離れた平行な2本の導体に、$" + fmt(i1) + "\\,\\mathrm{A}$ と $" + fmt(i2) + "\\,\\mathrm{A}$ の電流を同じ向きに流した。右の導体の長さ $" + fmt(l) + "\\,\\mathrm{m}$ の部分に働く電磁力の大きさは何 N か。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とする。", fig: {kind: "u21s5pa", L: tbU21s5_fig({"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","h2":"","h2a":"back","f2":"{F}","f2a":"in"}, [["i1", "{I}_1=" + fmt(i1) + " A"], ["i2", "{I}_2=" + fmt(i2) + " A"], ["r", "{r}=" + fmt(d) + " m"], ["l", "{l}=" + fmt(l) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = \\dfrac{\\mu_0 I_1 I_2 l}{2 \\pi r}$、$\\dfrac{4 \\pi \\times 10^{-7}}{2 \\pi} = 2 \\times 10^{-7}$", "$F = 2 \\times 10^{-7} \\times \\dfrac{" + fmt(i1) + " \\times " + fmt(i2) + " \\times " + fmt(l) + "}{" + fmt(d) + "} = " + fmt(c) + " \\times 10^{-7}\\,\\mathrm{N}$"], chk: {form: "u21s5f", p: {i1: i1, i2: i2, l: l, d: d}}};
  }
  throw new Error("u21s5f：条件に合う数字が見つからない");
}
function tbU21s5_Qb(r){
  var gcd = tbU21s5_gcd, ratio = tbU21s5_ratio, par = tbU21s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var i1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var d = pick(r, [0.1,0.2,0.4,0.5,2,4,5]);
    var c = (2 * i1 / d);
    var A = (2 * i1 / (d * d));
    var B = (4 * i1 / d);
    var C = (i1 / (2 * d));
    if (!(nice(c) && nice(A) && nice(C) && distinct([c, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(c) + " \\times 10^{-7}\\,\\mathrm{T}$", v: fmt(c)}, {t: "$" + fmt(A) + " \\times 10^{-7}\\,\\mathrm{T}$", v: fmt(A), why: "距離を2乗した"}, {t: "$" + fmt(B) + " \\times 10^{-7}\\,\\mathrm{T}$", v: fmt(B), why: "$2 \\pi$ で割るところを $\\pi$ で割った"}, {t: "$" + fmt(C) + " \\times 10^{-7}\\,\\mathrm{T}$", v: fmt(C), why: "$\\mu_0$ の 4 を掛けていない"}]);
    return {form: "u21s5b", text: "真空中で、$" + fmt(d) + "\\,\\mathrm{m}$ 離れた平行な2本の導体がある。左の導体に $" + fmt(i1) + "\\,\\mathrm{A}$ の電流を流した。左の導体がつくる、右の導体の所の磁束密度は何 T か。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とする。", fig: {kind: "u21s5pa", L: tbU21s5_fig({"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","h2":"","h2a":"back","f2":"{F}","f2a":"in"}, [["i1", "{I}_1=" + fmt(i1) + " A"], ["i2", ""], ["r", "{r}=" + fmt(d) + " m"], ["l", null], ["f2", null], ["f2a", null], ["h2", "{B}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{I_1}{2 \\pi r}$、$B = \\mu_0 H = \\dfrac{\\mu_0 I_1}{2 \\pi r}$", "$B = \\dfrac{4 \\pi \\times 10^{-7} \\times " + fmt(i1) + "}{2 \\pi \\times " + fmt(d) + "} = " + fmt(c) + " \\times 10^{-7}\\,\\mathrm{T}$"], chk: {form: "u21s5b", p: {i1: i1, d: d}}};
  }
  throw new Error("u21s5b：条件に合う数字が見つからない");
}
function tbU21s5_Qdir(r){
  var gcd = tbU21s5_gcd, ratio = tbU21s5_ratio, par = tbU21s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var ia2 = (k == 1 ? 'up' : 'down');
    var i2n = (k == 1 ? '上向き' : '下向き');
    var good = (k == 1 ? '左向き（左の導体へ向かう向き）' : '右向き（左の導体から離れる向き）');
    var bad = (k == 1 ? '右向き（左の導体から離れる向き）' : '左向き（左の導体へ向かう向き）');
    var why = (k == 1 ? '電流が逆向きなら右向き。ここは同じ向き' : '電流が同じ向きなら左向き。ここは逆向き');
    var to = (k == 1 ? '左' : '右');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "上向き", v: "up", why: "力は、電流（上下）と磁界（手前・奥）の両方に直角な向き"}, {t: "力は働かない", v: "none", why: "右の導体は、左の導体がつくる磁界の中にあるので、力が働く"}]);
    return {form: "u21s5dir", text: "図のように、平行な2本の導体の左に上向き、右に" + String(i2n) + "の電流を流した。右の導体に働く電磁力の向きはどれか。", fig: {kind: "u21s5pa", L: tbU21s5_fig({"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","h2":"","h2a":"back","f2":"{F}","f2a":"in"}, [["ia2", String(ia2)], ["f2a", null], ["h2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["左の導体の電流は上向きなので、右の導体の所の磁界は奥向き（右ねじの法則）", "中指（電流）を" + String(i2n) + "、人差し指（磁界）を奥に向けると、親指は" + String(to) + "。力は " + String(good)], chk: {form: "u21s5dir", p: {k: k}}};
  }
  throw new Error("u21s5dir：条件に合う数字が見つからない");
}
function tbU21s5_Qsame(r){
  var gcd = tbU21s5_gcd, ratio = tbU21s5_ratio, par = tbU21s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$F$", v: "own"}, {t: "$0$", v: "0", why: "左の導体も、右の導体がつくる磁界の中にあるので、力が働く"}, {t: "$2F$", v: "2", why: "左の導体にも同じ大きさの力が働く。2倍にはならない"}, {t: "$\\dfrac{F}{2}$", v: "h", why: "左の導体にも同じ大きさの力が働く。半分にはならない"}]);
    return {form: "u21s5same", text: "平行な2本の導体に電流を流すと、右の導体に大きさ $F$ の電磁力が働いた。左の導体に働く電磁力の大きさは □ である。", fig: {kind: "u21s5pa", L: tbU21s5_fig({"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","h2":"","h2a":"back","f2":"{F}","f2a":"in"}, [["f1", "{F}'"], ["f1a", "in"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["左の導体には、右の導体がつくる磁界から力が働く", "大きさは同じ $F$"], chk: {form: "u21s5same", p: {}}};
  }
  throw new Error("u21s5same：条件に合う数字が見つからない");
}
var GEN = {
  // 21-1 電磁力の向き
  1: function(r){ return pick(r, [tbU21s1_Qdir, tbU21s1_Qdir, tbU21s1_Qdir, tbU21s1_Qdir, tbU21s1_Qside, tbU21s1_Qside, tbU21s1_Qside, tbU21s1_Qrule, tbU21s1_Qname])(r); },
  // 21-2 フレミングの左手の法則
  2: function(r){ return pick(r, [tbU21s2_Qfinger, tbU21s2_Qfinger, tbU21s2_Qplane, tbU21s2_Qplane, tbU21s2_Qplane, tbU21s2_Qdir, tbU21s2_Qdir, tbU21s2_Qdir, tbU21s2_Qqty])(r); },
  // 21-3 電磁力の大きさ
  3: function(r){ return pick(r, [tbU21s3_Qf, tbU21s3_Qf, tbU21s3_Qf, tbU21s3_Qf, tbU21s3_Qi, tbU21s3_Qi, tbU21s3_Qb, tbU21s3_Qb, tbU21s3_Qeq])(r); },
  // 21-4 斜めの導体
  4: function(r){ return pick(r, [tbU21s4_Qf30, tbU21s4_Qf30, tbU21s4_Qf30, tbU21s4_Qf30, tbU21s4_Qang, tbU21s4_Qang, tbU21s4_Qpar, tbU21s4_Qpar, tbU21s4_Qcomp])(r); },
  // 21-5 平行な2本の導体
  5: function(r){ return pick(r, [tbU21s5_Qf, tbU21s5_Qf, tbU21s5_Qf, tbU21s5_Qf, tbU21s5_Qb, tbU21s5_Qb, tbU21s5_Qdir, tbU21s5_Qdir, tbU21s5_Qdir, tbU21s5_Qsame])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t21s1e","scene":"t21s1e","kind":"u21s1mo","lab":{"pl":"N","pls":"N","pr":"S","prs":"S","mb":"磁石の磁界","mba":"right","c":"{I}","ca":"front","fl":"電流の磁界","fla":"ccw","st":"down","f":"{F}","fa":"up"},"viewbox":"106 160 828 516","band":{"want":"電磁力の向き","ans":"磁界が強め合う側から、弱め合う側へ押される","full":"磁界の中の導体に電流を流すと、導体に力が働く（電磁力）。磁石の磁界と電流の磁界が重なり、強め合う側から弱め合う側へ、導体が押される。"},"narr":{"start":{"co":1,"fld":0,"std":0,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①電磁力\n②2つの磁界\n③力の向き\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"N 極と S 極の間には、右向きの磁界があります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Pl","Pr","Mb"]},{"text":"その磁界の中に導体を置き、手前向きに電流を流します。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"すると、導体に力が働きます。この力を〖電磁力〗といいます。","at":{"強調":1.0},"after":[],"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁界は2つあります。〖磁石のつくる磁界と、電流のつくる磁界〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Mb"]},{"text":"電流は手前向きなので、右ねじの法則で、電流の磁界は反時計回りです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"fl","emph":["Fl","C"]},{"text":"導体の下側では、2つの磁界がどちらも右向きです。強め合います。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"st","emph":["St"]},{"text":"導体の上側では、電流の磁界が左向きで、磁石の磁界と逆向きです。弱め合います。","at":{"強調":1.0},"after":[],"emph":["St"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"導体は、〖磁界が強め合う側から、弱め合う側へ〗押されます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["St"]},{"text":"下側から上側へ押されるので、力は上向きです。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"f","emph":["F"],"ans":true}]}],"groups":{"Pl":["plb","plbt","plt0","plt1"],"Pr":["prb","prbt","prt0","prt1"],"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mbt0","mbt1"],"St":["mb0","mb1","mb2","mb3"],"Fl":["fl","flh0","flh0:h","flh1","flh1:h","flh2","flh2:h","flh3","flh3:h","flt0","flt1"],"C":["cc","cc:t","ct0","ct1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"fl":{"to":{"fld":1},"dur":1.0},"st":{"to":{"std":1},"dur":0.8},"f":{"to":{"fd":1},"dur":0.8}},"route":["電磁力","2つの磁界","力の向き"]}},{"id":"t21s1x","scene":"t21s1x","kind":"u21s1mo","lab":{"pl":"N","pls":"N","pr":"S","prs":"S","mb":"","mba":"right","c":"{I}","ca":"back","fl":"","fla":"cw","st":"up","f":"{F}","fa":"down"},"viewbox":"106 160 828 516","band":{"want":"奥向きの電流が流れる導体に働く力の向き","ans":"下向き"},"narr":{"start":{"co":1,"fld":0,"std":0,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、導体に働く力の向きです。","at":{"強調":1.0},"after":[],"emph":["F"]},{"text":"①2つの磁界\n②強め合う側\n③力の向き\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁石の磁界は、N 極から S 極へ向かうので右向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Mb","Pl","Pr"]},{"text":"電流は奥向きなので、電流の磁界は時計回りです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"fl","emph":["Fl","C"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"時計回りなので、導体の上側では右向き、下側では左向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Fl"]},{"text":"上側は磁石の磁界と同じ向きで強め合い、下側は弱め合います。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"st","emph":["St"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖強め合う上側から、弱め合う下側へ〗押されます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"f","emph":["F","St"]},{"text":"答えは、下向きです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["F"],"ans":true}]}],"groups":{"Pl":["plb","plbt","plt0","plt1"],"Pr":["prb","prbt","prt0","prt1"],"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mbt0","mbt1"],"St":["mb0","mb1","mb2","mb3"],"Fl":["fl","flh0","flh0:h","flh1","flh1:h","flh2","flh2:h","flh3","flh3:h","flt0","flt1"],"C":["cc","cc:t","ct0","ct1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"fl":{"to":{"fld":1},"dur":1.0},"st":{"to":{"std":1},"dur":0.8},"f":{"to":{"fd":1},"dur":0.8}},"route":["2つの磁界","強め合う側","力の向き"]}},{"id":"t21s2e","scene":"t21s2e","kind":"u21s2sw","lab":{"hand":"左手","f1":"力","f1a":"up","fn1":"親指","f2":"磁界","f2a":"right","fn2":"人差し指","f3":"電流","f3a":"front","fn3":"中指","pl":"N","pls":"N","pr":"S","prs":"S","mb":"{B}","mba":"right","c":"{I}","ca":"front","fl":null,"fla":null,"st":null,"f":"{F}","fa":"up"},"viewbox":"20 35 914 789","band":{"want":"電磁力の向きの求め方","ans":"中指＝電流、人差し指＝磁界、親指＝力（電・磁・力）","full":"左手の中指・人差し指・親指を互いに直角に開く。中指を電流、人差し指を磁界の向きに向けると、親指が力の向き。中指から順に「電・磁・力」。"},"narr":{"start":{"co":1,"t":0,"f3d":0,"f2d":0,"f1d":0,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①左手の指\n②覚え方\n③当てはめる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"力の向きを、毎回2つの磁界から考えるのは大変です。そこで、フレミングの左手の法則を使います。","at":{"道筋":1.0},"after":[],"route":1},{"text":"左手の中指・人差し指・親指を、互いに直角に開きます。","at":{"強調":1.0},"after":[],"emph":["Hand"]},{"text":"〖中指は電流〗の向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f3","emph":["F3"]},{"text":"〖人差し指は磁界〗の向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f2","emph":["F2"]},{"text":"〖親指が力〗の向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f1","emph":["F1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"中指から順に、〖電・磁・力〗と覚えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["F3","F2","F1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"前の節と同じ図に当てはめます。電流は手前向き、磁界は N 極から S 極へ右向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"sw","emph":["C","Pl","Pr"]},{"text":"中指を手前に、人差し指を右に向けます。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"親指は上を向きます。力は上向きです。2つの磁界から考えた時と同じです。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"f","emph":["F"],"ans":true}]}],"groups":{"Hand":["handt0","handt1"],"F1":["fa1","fa1:h","f1t0","f1t1","fn1t0","fn1t1","fs1front","fs1front:t","fs1back","fs1back:t"],"F2":["fa2","fa2:h","f2t0","f2t1","fn2t0","fn2t1","fs2front","fs2front:t","fs2back","fs2back:t"],"F3":["fa3","fa3:h","f3t0","f3t1","fn3t0","fn3t1","fs3front","fs3front:t","fs3back","fs3back:t"],"Pl":["plbx1","plbtx1","pltx10","pltx11"],"Pr":["prbx1","prbtx1","prtx10","prtx11"],"Mb":["mb0x1","mbh0x1","mbh0x1:h","mb1x1","mbh1x1","mbh1x1:h","mb2x1","mbh2x1","mbh2x1:h","mb3x1","mbh3x1","mbh3x1:h","mbtx10","mbtx11"],"St":["mb0x1","mb1x1","mb2x1","mb3x1"],"Fl":["flx1","flh0x1","flh0x1:h","flh1x1","flh1x1:h","flh2x1","flh2x1:h","flh3x1","flh3x1:h","fltx10","fltx11"],"C":["ccx1","ccx1:t","ctx10","ctx11"],"F":["fax1","fax1:h","ftx10","ftx11"]},"moves":{"f3":{"to":{"f3d":1},"dur":0.6},"f2":{"to":{"f2d":1},"dur":0.6},"f1":{"to":{"f1d":1},"dur":0.6},"sw":{"to":{"t":1},"dur":0.6},"f":{"to":{"fd":1},"dur":0.8}},"route":["左手の指","覚え方","当てはめる"]}},{"id":"t21s2x","scene":"t21s2x","kind":"u21s2bl","lab":{"mb":"{B}","mba":"right","l":"","ang":90,"i":"{I}","ia":"down","f":["{F}","{F}"],"fa":null},"viewbox":"106 134 828 518","band":{"want":"下向きの電流が流れる導体に働く力の向き","known":"磁界は右向き","ans":"手前向き"},"narr":{"start":{"co":1,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、導体に働く力の向きです。電流も磁界も、紙面の中の向きです。","at":{"強調":1.0},"after":[],"emph":["I","Mb"]},{"text":"①中指と人差し指\n②親指\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"中指を電流の向きの下に、人差し指を磁界の向きの右に向けます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","Mb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"すると、〖親指は手前〗を向きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"f","emph":["F"]},{"text":"答えは、手前向きです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["F"],"ans":true}]}],"groups":{"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mb4","mbh4","mbh4:h","mbt0","mbt1"],"L":["cd","ld","ld:h","ld:h2","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"F":["fc","fc:t","ft0","ft1"],"Th":["tha","tht0","tht1"],"Comp":["cmp","compt0","compt1"],"Vl":["vl","vlt0","vlt1"],"Tv":["tva","tvt0","tvt1"]},"moves":{"f":{"to":{"fd":1},"dur":0.8}},"route":["中指と人差し指","親指"]}},{"id":"t21s3e","scene":"t21s3e","kind":"u21s3bl","lab":{"mb":"{B}","mba":"right","l":"{l}","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":"front"},"viewbox":"106 133 848 519","band":{"want":"電磁力の大きさ","ans":"$F = BIl$","full":"磁束密度 B の磁界の中に、磁界と垂直に長さ l の導体を置き、電流 I を流すと、F = BIl の電磁力が働く。B・I・l が大きいほど大きい。"},"narr":{"start":{"co":1,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①記号\n②式\n③大きくなる時\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁界の強さを、磁束密度 $B$ で表します。単位は T です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Mb"]},{"text":"〖磁界と垂直に〗、長さ $l$ の導体を置きます。単位は m です。","at":{"強調":1.0},"after":[],"emph":["L"]},{"text":"導体に電流 $I$ を流すと、電磁力 $F$ が働きます。向きはフレミングの左手の法則で、手前向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f","emph":["I","F"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"電磁力の大きさは、次の式です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["F","Mb","I","L"],"eq":[{"cont":false,"items":[["F = BIl"]]}],"emphPre":["F","Mb","I","L"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁束密度が大きいほど、電流が大きいほど、導体が長いほど、〖大きな力〗が働きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["F","Mb","I","L"],"eq":[{"cont":false,"items":[["F = BIl"]]}],"ans":true,"emphPre":["Mb","I","L"]}]}],"groups":{"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mb4","mbh4","mbh4:h","mbt0","mbt1"],"L":["cd","ld","ld:h","ld:h2","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"F":["fc","fc:t","ft0","ft1"],"Th":["tha","tht0","tht1"],"Comp":["cmp","compt0","compt1"],"Vl":["vl","vlt0","vlt1"],"Tv":["tva","tvt0","tvt1"]},"moves":{"f":{"to":{"fd":1},"dur":0.8}},"route":["記号","式","大きくなる時"]}},{"id":"t21s3x","scene":"t21s3x","kind":"u21s3bl","lab":{"mb":"{B}=0.5 T","mba":"right","l":"{l}=0.4 m","ang":90,"i":"{I}=4 A","ia":"down","f":["{F}","{F}=0.8 N"],"fa":"front"},"viewbox":"106 133 848 519","band":{"want":"電磁力の大きさ $F$","known":"$B = 0.5\\,\\mathrm{T},\\;\\; I = 4\\,\\mathrm{A},\\;\\; l = 0.4\\,\\mathrm{m}$","ans":"$F = 0.8\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"fd":1,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、導体に働く電磁力の大きさ $F$ です。","at":{"強調":1.0},"after":[],"emph":["F"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖導体は磁界と垂直〗なので、$F = BIl$ を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["F","Mb","I","L"],"eq":[{"cont":false,"items":[["F = BIl"]]}],"emphPre":["F","Mb","I","L"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$B = 0.5$、$I = 4$、$l = 0.4$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["F","Mb","I","L"],"eq":[{"cont":false,"items":[["F = 0.5 \\times 4 \\times 0.4"],["= 0.8\\,\\mathrm{N}"]]}],"move":"fv","ans":true,"emphPre":["Mb","I","L","F"]}]}],"groups":{"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mb4","mbh4","mbh4:h","mbt0","mbt1"],"L":["cd","ld","ld:h","ld:h2","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"F":["fc","fc:t","ft0","ft1"],"Th":["tha","tht0","tht1"],"Comp":["cmp","compt0","compt1"],"Vl":["vl","vlt0","vlt1"],"Tv":["tva","tvt0","tvt1"]},"moves":{"fv":{"to":{"fv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t21s4e","scene":"t21s4e","kind":"u21s4bl","lab":{"mb":"{B}","mba":"right","l":"{l}","ang":[90,30],"i":"{I}","ia":"up","f":"{F}","fa":"back","th":"{θ}","comp":"垂直な成分","vl":"磁界に垂直な線","tv":""},"viewbox":"-56 48 1022 740","band":{"want":"斜めの導体に働く電磁力","ans":"$F = BIl \\sin \\theta$（磁界と垂直な成分だけが効く）","full":"磁界の向きと導体の向きのなす角を θ とすると、F = BIl sinθ。電磁力に関係するのは、電流のうち磁界と垂直な成分だけ。磁界に垂直な線との角度を θ に入れない。"},"narr":{"start":{"co":1,"fd":1,"angv":0,"thd":0,"compd":0,"vld":0,"tvd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①斜めの導体\n②式\n③角度の取り方\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"導体が磁界に対して斜めの時を考えます。〖磁界の向きと導体の向きのなす角〗を $\\theta$ とします。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"ang","emph":["Th","L","Mb"]},{"text":"電磁力に関係するのは、電流のうち、〖磁界と垂直な成分だけ〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"comp","emph":["Comp"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"そのため、電磁力は $BIl$ に $\\sin \\theta$ を掛けた物になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["F","Mb","I","L","Th"],"eq":[{"cont":false,"items":[["F = BIl \\sin \\theta"]]}],"emphPre":["F","Th","Mb","I"]},{"text":"$\\theta = 90^\\circ$ なら $\\sin 90^\\circ = 1$ で、前の節の $F = BIl$ と同じです。","at":{"強調":1.0},"after":[],"emph":["F","Mb","I"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"式を丸暗記すると、角度の取り方で間違えます。","at":{"道筋":1.0},"after":[],"route":3},{"text":"図で、磁界に垂直な線との角度が書かれていても、〖それを $\\theta$ に入れてはいけません〗。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"vl","emph":["Vl","Tv"]},{"text":"効くのは、磁界と垂直な成分だけです。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["F","Th","Comp","Mb","I"],"eq":[{"cont":false,"items":[["F = BIl \\sin \\theta"]]}],"ans":true,"emphPre":["Comp","Mb","I"]}]}],"groups":{"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mb4","mbh4","mbh4:h","mbt0","mbt1"],"L":["cd","ld","ld:h","ld:h2","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"F":["fc","fc:t","ft0","ft1"],"Th":["tha","tht0","tht1"],"Comp":["cmp","compt0","compt1"],"Vl":["vl","vlt0","vlt1"],"Tv":["tva","tvt0","tvt1"]},"moves":{"ang":{"to":{"angv":1,"thd":1},"dur":0.8},"comp":{"to":{"compd":1},"dur":0.6},"vl":{"to":{"vld":1,"tvd":1},"dur":0.6}},"route":["斜めの導体","式","角度の取り方"]}},{"id":"t21s4x","scene":"t21s4x","kind":"u21s4bl","lab":{"mb":"{B}=0.8 T","mba":"right","l":"{l}=0.5 m","ang":30,"i":"{I}=5 A","ia":"up","f":["{F}","{F}=1 N"],"fa":"back","th":"30°","comp":""},"viewbox":"-56 48 1022 740","band":{"want":"電磁力の大きさ $F$","known":"$B = 0.8\\,\\mathrm{T},\\;\\; I = 5\\,\\mathrm{A},\\;\\; l = 0.5\\,\\mathrm{m},\\;\\; \\theta = 30^\\circ$","ans":"$F = 1\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"fd":1,"thd":1,"compd":0,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、斜めの導体に働く電磁力の大きさ $F$ です。","at":{"強調":1.0},"after":[],"emph":["F"]},{"text":"①角度を確かめる\n②式を書く\n③数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$30^\\circ$ は、〖磁界の向きと導体の向きのなす角〗です。このまま $\\theta$ に入れられます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Th","Mb","L"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁界と垂直な成分だけが効くので、$\\sin \\theta$ を掛けます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"comp","emph":["F","Mb","I","L","Th"],"eq":[{"cont":false,"items":[["F = BIl \\sin \\theta"]]}],"emphPre":["Comp"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$B = 0.8$、$I = 5$、$l = 0.5$、$\\sin 30^\\circ = 0.5$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["F","Mb","I","L","Th"],"eq":[{"cont":false,"items":[["F = 0.8 \\times 5 \\times 0.5 \\times 0.5"],["= 1\\,\\mathrm{N}"]]}],"move":"fv","ans":true,"emphPre":["Mb","I","L","Th","F"]}]}],"groups":{"Mb":["mb0","mbh0","mbh0:h","mb1","mbh1","mbh1:h","mb2","mbh2","mbh2:h","mb3","mbh3","mbh3:h","mb4","mbh4","mbh4:h","mbt0","mbt1"],"L":["cd","ld","ld:h","ld:h2","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"F":["fc","fc:t","ft0","ft1"],"Th":["tha","tht0","tht1"],"Comp":["cmp","compt0","compt1"],"Vl":["vl","vlt0","vlt1"],"Tv":["tva","tvt0","tvt1"]},"moves":{"comp":{"to":{"compd":1},"dur":0.6},"fv":{"to":{"fv":1},"dur":0.4}},"route":["角度を確かめる","式を書く","数を入れる"]}},{"id":"t21s5e","scene":"t21s5e","kind":"u21s5pa","lab":{"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","h2":["{H}","{B}"],"h2a":"back","f2":"{F}","f2a":"in","f1":"{F}","f1a":"in"},"viewbox":"-1 27 1615 846","band":{"want":"平行な2本の導体の間に働く電磁力","ans":"$F = \\dfrac{\\mu I_1 I_2 l}{2 \\pi r}$","full":"右の導体の所の、左の導体がつくる磁界は H = I1/(2πr)、B = μH。F = BI2 l に入れて F = μ I1 I2 l /(2πr)。向きは右ねじの法則とフレミングの左手の法則で出す。左の導体にも同じ大きさの力が働く。"},"narr":{"start":{"co":1,"h2d":0,"h2v":0,"f2d":0,"f1d":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①左の導体がつくる磁界\n②磁束密度\n③電磁力\n④向き\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"平行な2本の導体に、上向きの電流 $I_1$、$I_2$ を流します。距離は $r$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I1","I2","R"]},{"text":"右の導体に働く力を考えます。右の導体の所には、〖左の導体がつくる磁界〗があります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"h","emph":["H2","I1"]},{"text":"直線の導体から $r$ 離れた所なので、磁界の強さは次の式です。〖$I_2$ でなく $I_1$ を使います〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["H2","I1","R","I2"],"eq":[{"cont":false,"items":[["H = \\dfrac{I_1}{2 \\pi r}"]]}],"emphPre":["H2","I1","R","I2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"電磁力の式には、磁束密度 $B$ が要ります。$B = \\mu H$ で直します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"b","emph":["H2","I1","R"],"eq":[{"cont":false,"items":[["B = \\mu H"],["= \\dfrac{\\mu I_1}{2 \\pi r}"]]}],"emphPre":["H2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"右の導体の電流は $I_2$、長さは $l$ です。磁界と電流は垂直なので、$\\sin \\theta$ は考えません。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["F2","H2","I2","L"],"eq":[{"cont":false,"items":[["F = B I_2 l"]]}],"emphPre":["I2","L"]},{"text":"$B$ を入れてまとめます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F2","I1","I2","L","R","F1","H2"],"eq":[{"cont":false,"items":[["F = \\dfrac{\\mu I_1}{2 \\pi r} \\times I_2 l"],["= \\dfrac{\\mu I_1 I_2 l}{2 \\pi r}"]]}],"emphPre":["F2","I1","I2","L","R","F1","H2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"向きを出します。左の導体の電流は上向きなので、右ねじの法則で、右の導体の所の磁界は奥向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":4,"emph":["H2","I1"]},{"text":"右の導体の電流は上向きです。中指を上、人差し指を奥に向けると、親指は左を向きます。力は左向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f2","emph":["F2","I2"]},{"text":"左の導体にも、〖同じ大きさの力〗が働きます。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"f1","emph":["F1","F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{\\mu I_1 I_2 l}{2 \\pi r}"]]}],"ans":true,"emphPre":["F1"]}]}],"groups":{"I1":["w1","ia1","ia1:h","i1t0","i1t1"],"I2":["w2","w2b","ia2","ia2:h","i2t0","i2t1"],"H2":["h2c","h2c:t","h2t0","h2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{"h":{"to":{"h2d":1},"dur":0.6},"b":{"to":{"h2v":1},"dur":0.4},"f2":{"to":{"f2d":1},"dur":0.8},"f1":{"to":{"f1d":1},"dur":0.8}},"route":["左の導体がつくる磁界","磁束密度","電磁力","向き"]}},{"id":"t21s5x","scene":"t21s5x","kind":"u21s5pa","lab":{"i1":"{I}_1=5 A","ia1":"up","i2":"{I}_2=3 A","ia2":"up","r":"{r}=0.5 m","l":"{l}=2 m","h2":"","h2a":"back","f2":["{F}","{F}=120×10⁻⁷ N"],"f2a":"in"},"viewbox":"-1 27 1615 846","band":{"want":"右の導体に働く電磁力の大きさ $F$","known":"$I_1 = 5\\,\\mathrm{A},\\;\\; I_2 = 3\\,\\mathrm{A},\\;\\; r = 0.5\\,\\mathrm{m},\\;\\; l = 2\\,\\mathrm{m},\\;\\; \\mu_0 = 4 \\pi \\times 10^{-7}$","ans":"$F = 120 \\times 10^{-7}\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"h2d":1,"f2d":1,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、右の導体に働く電磁力の大きさ $F$ です。真空中なので $\\mu = \\mu_0$ です。","at":{"強調":1.0},"after":[],"emph":["F2"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"平行な2本の導体の式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{\\mu_0 I_1 I_2 l}{2 \\pi r}"]]}],"emphPre":["F2","I1","I2","L","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$\\mu_0 = 4 \\pi \\times 10^{-7}$ を入れると、〖$\\pi$ が消えて $2 \\times 10^{-7}$ が残ります〗。","at":{"道筋":1.0,"式":1.0},"after":[],"route":2,"eq":[{"cont":false,"items":[["\\dfrac{4 \\pi \\times 10^{-7}}{2 \\pi} = 2 \\times 10^{-7}"]]}]},{"text":"$I_1 = 5$、$I_2 = 3$、$l = 2$、$r = 0.5$ を入れます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = 2 \\times 10^{-7} \\times \\dfrac{5 \\times 3 \\times 2}{0.5}"],["= 120 \\times 10^{-7}\\,\\mathrm{N}"]]}],"move":"fv","ans":true,"emphPre":["I1","I2","L","R","F2"]}]}],"groups":{"I1":["w1","ia1","ia1:h","i1t0","i1t1"],"I2":["w2","w2b","ia2","ia2:h","i2t0","i2t1"],"H2":["h2c","h2c:t","h2t0","h2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{"fv":{"to":{"fv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}}],"secs":[{"ex":{"text":"図のように、左に N 極、右に S 極を置き、間の導体に奥向き（×）の電流を流した。導体に働く力の向きはどれか。","fig":{"kind":"u21s1mo","L":{"pl":"N","pls":"N","pr":"S","prs":"S","mb":"","mba":"right","c":"{I}","ca":"back","fl":null,"fla":null,"st":null,"f":"{F}","fa":null},"P":{}},"ch":[{"t":"上向き","v":"up","why":"上向きになるのは、下側で強め合う時（手前向きの電流）"},{"t":"下向き","v":"down","why":""},{"t":"右向き","v":"right","why":"右向きは磁石の磁界の向き。力は強め合う側から弱め合う側へ"},{"t":"力は働かない","v":"none","why":"磁界の中の導体に電流を流すと、力が働く"}],"ans":1}},{"ex":{"text":"図のように、右向きの磁界の中に導体を置き、下向きに電流を流した。導体に働く力の向きはどれか。","fig":{"kind":"u21s2bl","L":{"mb":"{B}","mba":"right","l":"","ang":90,"i":"{I}","ia":"down","f":"{F}","fa":null},"P":{}},"ch":[{"t":"手前向き","v":"front","why":""},{"t":"奥向き","v":"back","why":"奥向きになるのは、電流が上向きの時"},{"t":"右向き","v":"right","why":"右向きは磁界の向き。力は親指の向き"},{"t":"下向き","v":"down","why":"下向きは電流の向き。力は親指の向き"}],"ans":0}},{"ex":{"text":"磁束密度 $0.5\\,\\mathrm{T}$ の磁界の中に、長さ $0.4\\,\\mathrm{m}$ の導体を磁界と垂直に置き、$4\\,\\mathrm{A}$ の電流を流した。導体に働く電磁力の大きさは何 N か。","fig":{"kind":"u21s3bl","L":{"mb":"{B}=0.5 T","mba":"right","l":"{l}=0.4 m","ang":90,"i":"{I}=4 A","ia":"down","f":"{F}","fa":"front"},"P":{}},"ch":[{"t":"$2\\,\\mathrm{N}$","v":"2","why":"導体の長さを掛けていない"},{"t":"$0.8\\,\\mathrm{N}$","v":"0.8","why":""},{"t":"$5\\,\\mathrm{N}$","v":"5","why":"導体の長さで割った"},{"t":"$1.6\\,\\mathrm{N}$","v":"1.6","why":"磁束密度を掛けていない"}],"ans":1}},{"ex":{"text":"磁束密度 $0.8\\,\\mathrm{T}$ の磁界の中に、長さ $0.5\\,\\mathrm{m}$ の導体を、磁界の向きと $30^\\circ$ の角度で置き、$5\\,\\mathrm{A}$ の電流を流した。導体に働く電磁力の大きさは何 N か。ただし $\\sin 30^\\circ = 0.5$ とする。","fig":{"kind":"u21s4bl","L":{"mb":"{B}=0.8 T","mba":"right","l":"{l}=0.5 m","ang":30,"i":"{I}=5 A","ia":"up","f":"{F}","fa":"back","th":"30°","comp":""},"P":{}},"ch":[{"t":"$2\\,\\mathrm{N}$","v":"2","why":"$\\sin 30^\\circ$ を掛けていない"},{"t":"$4\\,\\mathrm{N}$","v":"4","why":"$\\sin 30^\\circ$ で割った"},{"t":"$1\\,\\mathrm{N}$","v":"1","why":""},{"t":"$0\\,\\mathrm{N}$","v":"0","why":"斜めの導体にも、磁界と垂直な成分の分だけ力が働く"}],"ans":2}},{"ex":{"text":"真空中で、$0.5\\,\\mathrm{m}$ 離れた平行な2本の導体に、$5\\,\\mathrm{A}$ と $3\\,\\mathrm{A}$ の電流を同じ向きに流した。右の導体の長さ $2\\,\\mathrm{m}$ の部分に働く電磁力の大きさは何 N か。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とする。","fig":{"kind":"u21s5pa","L":{"i1":"{I}_1=5 A","ia1":"up","i2":"{I}_2=3 A","ia2":"up","r":"{r}=0.5 m","l":"{l}=2 m","h2":"","h2a":"back","f2":"{F}","f2a":"in"},"P":{}},"ch":[{"t":"$240 \\times 10^{-7}\\,\\mathrm{N}$","v":"240","why":"距離を2乗した"},{"t":"$60 \\times 10^{-7}\\,\\mathrm{N}$","v":"60","why":"導体の長さを掛けていない"},{"t":"$120 \\times 10^{-7}\\,\\mathrm{N}$","v":"120","why":""},{"t":"$64 \\times 10^{-7}\\,\\mathrm{N}$","v":"64","why":"電流の積でなく和を使った"}],"ans":2}}],"past":[]}};
});
