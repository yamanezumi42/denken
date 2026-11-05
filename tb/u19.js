/* 単元19「磁界と磁束」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(19, function(H){
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
// ---- 19-1 磁界と磁極 の図（※ textbook/gen/make_section.py が textbook/gen/data/u19_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U19S1K = {
  mg: {"vars":[],"items":[{"f":"ln","id":"plb","pts":[[150,280],[290,280],[290,520],[150,520]],"w":3,"close":1,"sel":"pls","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"plbt","x":220,"y":400,"s":"N","anc":"middle","size":40,"sel":"pls","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"plt","k":"pl","bases":[[220,246,"middle",[0,-1]]],"need":"pl","vis":[],"t":"F","x":220,"y":246,"anc":"middle"},{"f":"ln","id":"prb","pts":[[750,280],[890,280],[890,520],[750,520]],"w":3,"close":1,"sel":"prs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"prbt","x":820,"y":400,"s":"N","anc":"middle","size":40,"sel":"prs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"prt","k":"pr","bases":[[820,246,"middle",[0,-1]]],"need":"pr","vis":[],"t":"F","x":820,"y":246,"anc":"middle"},{"f":"lb","id":"mlt","k":"ml","bases":[[220,556,"middle",[0,1]]],"need":"ml","vis":[],"t":"F","x":220,"y":556,"anc":"middle"},{"f":"lb","id":"mrt","k":"mr","bases":[[820,556,"middle",[0,1]]],"need":"mr","vis":[],"t":"F","x":820,"y":556,"anc":"middle"},{"f":"ar","id":"h0","x0":320,"y0":320,"x1":720,"y1":320,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":320,"x1":720,"y1":320},"left":{"x0":720,"y0":320,"x1":320,"y1":320}},"dflt":"right","gr":"hd","vis":[],"t":"F"},{"f":"ar","id":"h1","x0":320,"y0":400,"x1":720,"y1":400,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":400,"x1":720,"y1":400},"left":{"x0":720,"y0":400,"x1":320,"y1":400}},"dflt":"right","gr":"hd","vis":[],"t":"F"},{"f":"ar","id":"h2","x0":320,"y0":480,"x1":720,"y1":480,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":480,"x1":720,"y1":480},"left":{"x0":720,"y0":480,"x1":320,"y1":480}},"dflt":"right","gr":"hd","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[520,288,"middle",[0,-1]]],"need":"h","vis":[],"t":"F","x":520,"y":288,"anc":"middle"},{"f":"c","id":"tpc","cx":470,"cy":440,"r":22,"fill":"w","o":["tpd"],"need":"tp","sel":"tps","var":{"":{}},"vis":[],"t":"F"},{"f":"ln","id":"tpm","pts":[[449.1,419.1],[490.9,419.1],[490.9,460.9],[449.1,460.9]],"w":3,"close":1,"o":["tpd"],"sel":"tps","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"tpmt","x":470,"y":441,"s":"N","anc":"middle","size":24,"o":["tpd"],"sel":"tps","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"tpt","k":"tp","bases":[[436,470,"end",[-1,1]],[470,496,"middle",[0,1]]],"o":["tpd"],"need":"tp","vis":[],"t":"F","x":436,"y":470,"anc":"end"},{"f":"ar","id":"fa","x0":498,"y0":440,"x1":608,"y1":440,"need":"f","sel":"fa","var":{"right":{"x0":498,"y0":440,"x1":608,"y1":440},"left":{"x0":442,"y0":440,"x1":332,"y1":440}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[553,410,"middle",[0,-1]],[553,470,"middle",[0,1]],[624,440,"start",[1,0]]],"vbases":{"right":[[553,410,"middle",[0,-1]],[553,470,"middle",[0,1]],[624,440,"start",[1,0]]],"left":[[387,410,"middle",[0,-1]],[387,470,"middle",[0,1]],[316,440,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":553,"y":410,"anc":"middle"},"left":{"x":387,"y":410,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":553,"y":410,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU19s1mg(d, p, L){ tbFig_Draw(d, p, L, U19S1K.mg); }
// ---- 19-2 磁気の力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u19_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U19S2K = {
  mg: {"vars":[],"items":[{"f":"ln","id":"plb","pts":[[150,280],[290,280],[290,520],[150,520]],"w":3,"close":1,"sel":"pls","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"plbt","x":220,"y":400,"s":"N","anc":"middle","size":40,"sel":"pls","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"plt","k":"pl","bases":[[220,246,"middle",[0,-1]]],"need":"pl","vis":[],"t":"F","x":220,"y":246,"anc":"middle"},{"f":"ln","id":"prb","pts":[[750,280],[890,280],[890,520],[750,520]],"w":3,"close":1,"sel":"prs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"prbt","x":820,"y":400,"s":"N","anc":"middle","size":40,"sel":"prs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"prt","k":"pr","bases":[[820,246,"middle",[0,-1]]],"need":"pr","vis":[],"t":"F","x":820,"y":246,"anc":"middle"},{"f":"lb","id":"mlt","k":"ml","bases":[[220,556,"middle",[0,1]]],"need":"ml","vis":[],"t":"F","x":220,"y":556,"anc":"middle"},{"f":"lb","id":"mrt","k":"mr","bases":[[820,556,"middle",[0,1]]],"need":"mr","vis":[],"t":"F","x":820,"y":556,"anc":"middle"},{"f":"ar","id":"h0","x0":320,"y0":320,"x1":720,"y1":320,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":320,"x1":720,"y1":320},"left":{"x0":720,"y0":320,"x1":320,"y1":320}},"dflt":"right","gr":"hd","vis":[],"t":"F"},{"f":"ar","id":"h1","x0":320,"y0":400,"x1":720,"y1":400,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":400,"x1":720,"y1":400},"left":{"x0":720,"y0":400,"x1":320,"y1":400}},"dflt":"right","gr":"hd","vis":[],"t":"F"},{"f":"ar","id":"h2","x0":320,"y0":480,"x1":720,"y1":480,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":480,"x1":720,"y1":480},"left":{"x0":720,"y0":480,"x1":320,"y1":480}},"dflt":"right","gr":"hd","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[520,288,"middle",[0,-1]]],"need":"h","vis":[],"t":"F","x":520,"y":288,"anc":"middle"},{"f":"c","id":"tpc","cx":470,"cy":440,"r":22,"fill":"w","o":["tpd"],"need":"tp","sel":"tps","var":{"":{}},"vis":[],"t":"F"},{"f":"ln","id":"tpm","pts":[[449.1,419.1],[490.9,419.1],[490.9,460.9],[449.1,460.9]],"w":3,"close":1,"o":["tpd"],"sel":"tps","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"tpmt","x":470,"y":441,"s":"N","anc":"middle","size":24,"o":["tpd"],"sel":"tps","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"tpt","k":"tp","bases":[[436,470,"end",[-1,1]],[470,496,"middle",[0,1]]],"o":["tpd"],"need":"tp","vis":[],"t":"F","x":470,"y":516,"anc":"middle"},{"f":"ar","id":"fa","x0":498,"y0":440,"x1":608,"y1":440,"need":"f","sel":"fa","var":{"right":{"x0":498,"y0":440,"x1":608,"y1":440},"left":{"x0":442,"y0":440,"x1":332,"y1":440}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[553,410,"middle",[0,-1]],[553,470,"middle",[0,1]],[624,440,"start",[1,0]]],"vbases":{"right":[[553,410,"middle",[0,-1]],[553,470,"middle",[0,1]],[624,440,"start",[1,0]]],"left":[[387,410,"middle",[0,-1]],[387,470,"middle",[0,1]],[316,440,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":553,"y":366,"anc":"middle"},"left":{"x":387,"y":366,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":553,"y":410,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pr: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  mp: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"plb","pts":[[150,280],[290,280],[290,520],[150,520]],"w":3,"close":1,"sel":"pls","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[1],"t":"F"},{"f":"tx","id":"plbt","x":220,"y":400,"s":"N","anc":"middle","size":40,"sel":"pls","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[1],"t":"F"},{"f":"lb","id":"plt","k":"pl","bases":[[220,246,"middle",[0,-1]]],"need":"pl","vis":[1],"t":"F","x":220,"y":246,"anc":"middle"},{"f":"ln","id":"prb","pts":[[750,280],[890,280],[890,520],[750,520]],"w":3,"close":1,"sel":"prs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[1],"t":"F"},{"f":"tx","id":"prbt","x":820,"y":400,"s":"N","anc":"middle","size":40,"sel":"prs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[1],"t":"F"},{"f":"lb","id":"prt","k":"pr","bases":[[820,246,"middle",[0,-1]]],"need":"pr","vis":[1],"t":"F","x":820,"y":246,"anc":"middle"},{"f":"lb","id":"mlt","k":"ml","bases":[[220,556,"middle",[0,1]]],"need":"ml","vis":[1],"t":"F","x":220,"y":556,"anc":"middle"},{"f":"lb","id":"mrt","k":"mr","bases":[[820,556,"middle",[0,1]]],"need":"mr","vis":[1],"t":"F","x":820,"y":556,"anc":"middle"},{"f":"ar","id":"h0","x0":320,"y0":320,"x1":720,"y1":320,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":320,"x1":720,"y1":320},"left":{"x0":720,"y0":320,"x1":320,"y1":320}},"dflt":"right","gr":"hd","vis":[1],"t":"F"},{"f":"ar","id":"h1","x0":320,"y0":400,"x1":720,"y1":400,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":400,"x1":720,"y1":400},"left":{"x0":720,"y0":400,"x1":320,"y1":400}},"dflt":"right","gr":"hd","vis":[1],"t":"F"},{"f":"ar","id":"h2","x0":320,"y0":480,"x1":720,"y1":480,"need":"h","sel":"ha","var":{"right":{"x0":320,"y0":480,"x1":720,"y1":480},"left":{"x0":720,"y0":480,"x1":320,"y1":480}},"dflt":"right","gr":"hd","vis":[1],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[520,288,"middle",[0,-1]]],"need":"h","vis":[1],"t":"F","x":520,"y":288,"anc":"middle"},{"f":"c","id":"tpc","cx":470,"cy":440,"r":22,"fill":"w","o":["tpd"],"need":"tp","sel":"tps","var":{"":{}},"vis":[1],"t":"F"},{"f":"ln","id":"tpm","pts":[[449.1,419.1],[490.9,419.1],[490.9,460.9],[449.1,460.9]],"w":3,"close":1,"o":["tpd"],"sel":"tps","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"tpmt","x":470,"y":441,"s":"N","anc":"middle","size":24,"o":["tpd"],"sel":"tps","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"tpt","k":"tp","bases":[[436,470,"end",[-1,1]],[470,496,"middle",[0,1]]],"o":["tpd"],"need":"tp","vis":[1],"t":"F","x":470,"y":516,"anc":"middle"},{"f":"ar","id":"fa","x0":498,"y0":440,"x1":608,"y1":440,"need":"f","sel":"fa","var":{"right":{"x0":498,"y0":440,"x1":608,"y1":440},"left":{"x0":442,"y0":440,"x1":332,"y1":440}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[1],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[553,410,"middle",[0,-1]],[553,470,"middle",[0,1]],[624,440,"start",[1,0]]],"vbases":{"right":[[553,410,"middle",[0,-1]],[553,470,"middle",[0,1]],[624,440,"start",[1,0]]],"left":[[387,410,"middle",[0,-1]],[387,470,"middle",[0,1]],[316,440,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":553,"y":366,"anc":"middle"},"left":{"x":387,"y":366,"anc":"middle"}},"dflt":"right","vis":[1],"t":"F","x":553,"y":410,"anc":"middle"},{"f":"c","id":"q1cx1","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[2],"t":"F"},{"f":"ln","id":"q1mx1","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[2],"t":"F"},{"f":"tx","id":"q1mtx1","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[2],"t":"F"},{"f":"lb","id":"q1tx1","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[2],"t":"F","x":300,"y":340,"anc":"middle","n":"q1x1"},{"f":"c","id":"q2cx1","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[2],"t":"F"},{"f":"ln","id":"q2mx1","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[2],"t":"F"},{"f":"tx","id":"q2mtx1","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[2],"t":"F"},{"f":"lb","id":"q2tx1","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[2],"t":"F","x":680,"y":340,"anc":"middle","n":"q2x1"},{"f":"ar","id":"f1ax1","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[2],"t":"F"},{"f":"lb","id":"f1tx1","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":364,"anc":"middle"},"out":{"x":204,"y":364,"anc":"middle"}},"dflt":"in","vis":[2],"t":"F","x":396,"y":370,"anc":"middle","n":"f1x1"},{"f":"ar","id":"f2ax1","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[2],"t":"F"},{"f":"lb","id":"f2tx1","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":364,"anc":"middle"},"out":{"x":776,"y":364,"anc":"middle"}},"dflt":"in","vis":[2],"t":"F","x":584,"y":370,"anc":"middle","n":"f2x1"},{"f":"ln","id":"re1x1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[2],"t":"F"},{"f":"ln","id":"re2x1","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[2],"t":"F"},{"f":"ar","id":"rdx1","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[2],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":490,"y":540,"anc":"middle","n":"rx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU19s2mg(d, p, L){ tbFig_Draw(d, p, L, U19S2K.mg); }
function tbU19s2pr(d, p, L){ tbFig_Draw(d, p, L, U19S2K.pr); }
function tbU19s2mp(d, p, L){ tbFig_Draw(d, p, L, U19S2K.mp); }
// ---- 19-3 透磁率 の図（※ textbook/gen/make_section.py が textbook/gen/data/u19_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U19S3K = {
  pr: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[110,230],[900,230],[900,590],[110,590]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[130,262,"start",[0,-1]],[880,262,"end",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":130,"y":262,"anc":"start"},{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","sc":["fs",0.25],"vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":422,"y":364,"anc":"middle"},"out":{"x":196,"y":340,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","sc":["fs",0.25],"vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":558,"y":436,"anc":"middle"},"out":{"x":802,"y":364,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU19s3pr(d, p, L){ tbFig_Draw(d, p, L, U19S3K.pr); }
// ---- 19-4 磁界の強さと磁力線 の図（※ textbook/gen/make_section.py が textbook/gen/data/u19_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U19S4K = {
  pe: {"vars":[],"items":[{"f":"c","id":"qc","cx":260,"cy":400,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[231.5,371.5],[288.5,371.5],[288.5,428.5],[231.5,428.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":260,"y":401,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[260,340,"middle",[0,-1]],[260,460,"middle",[0,1]],[302,360,"start",[1,-1]]],"need":"q","vis":[],"t":"F","x":260,"y":340,"anc":"middle"},{"f":"c","id":"ppd","cx":600,"cy":400,"r":7,"fill":"k","need":"p","vis":[],"t":"F","hide":["t","td"]},{"f":"lb","id":"pt","k":"p","bases":[[584,434,"end",[-1,1]],[600,440,"middle",[0,1]]],"need":"p","vis":[],"t":"F","x":541.57,"y":476.43,"anc":"end"},{"f":"c","id":"tc","cx":600,"cy":400,"r":18,"fill":"w","sk":"ts","o":["td"],"need":"t","vis":[],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[600,348,"middle",[0,-1]],[570,360,"end",[-1,-1]]],"o":["td"],"need":"t","vis":[],"t":"F","x":600,"y":348,"anc":"middle"},{"f":"ar","id":"ea","x0":618,"y0":400,"x1":738,"y1":400,"need":"e","sel":"ea","var":{"out":{"x0":618,"y0":400,"x1":738,"y1":400},"in":{"x0":582,"y0":400,"x1":462,"y1":400}},"dflt":"out","gr":"ed","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"vbases":{"out":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"in":[[522,370,"middle",[0,-1]],[522,430,"middle",[0,1]],[446,400,"end",[-1,0]]]},"o":["ed"],"need":"e","sel":"ea","var":{"out":{"x":678,"y":358,"anc":"middle"},"in":{"x":506,"y":358,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":678,"y":370,"anc":"middle"},{"f":"ar","id":"fa","x0":618,"y0":446,"x1":738,"y1":446,"need":"f","sel":"fa","var":{"out":{"x0":618,"y0":446,"x1":738,"y1":446},"in":{"x0":582,"y0":446,"x1":462,"y1":446}},"dflt":"out","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"vbases":{"out":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"in":[[522,416,"middle",[0,-1]],[522,476,"middle",[0,1]],[446,446,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"out":{"x":678,"y":416,"anc":"middle"},"in":{"x":522,"y":416,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":678,"y":416,"anc":"middle"},{"f":"ln","id":"re1","pts":[[260,436],[260,564]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[600,436],[600,564]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":260,"y0":550,"x1":600,"y1":550,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[430,590,"middle",[0,1]],[430,510,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":430,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ln: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":236,"y":162,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[],"t":"F","x":270,"y":670,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[],"t":"F","x":696.67,"y":626.67,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":695.62,"y":491.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":622.44,"y":226.97,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[],"t":"F","x":604,"y":380,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[],"t":"F","x":720,"y":190,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"c","id":"qc","cx":260,"cy":400,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[1],"t":"F"},{"f":"ln","id":"qm","pts":[[231.5,371.5],[288.5,371.5],[288.5,428.5],[231.5,428.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"qmt","x":260,"y":401,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[260,340,"middle",[0,-1]],[260,460,"middle",[0,1]],[302,360,"start",[1,-1]]],"need":"q","vis":[1],"t":"F","x":260,"y":340,"anc":"middle"},{"f":"c","id":"ppd","cx":600,"cy":400,"r":7,"fill":"k","need":"p","vis":[1],"t":"F","hide":["t","td"]},{"f":"lb","id":"pt","k":"p","bases":[[584,434,"end",[-1,1]],[600,440,"middle",[0,1]]],"need":"p","vis":[1],"t":"F","x":541.57,"y":476.43,"anc":"end"},{"f":"c","id":"tc","cx":600,"cy":400,"r":18,"fill":"w","sk":"ts","o":["td"],"need":"t","vis":[1],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[600,348,"middle",[0,-1]],[570,360,"end",[-1,-1]]],"o":["td"],"need":"t","vis":[1],"t":"F","x":600,"y":348,"anc":"middle"},{"f":"ar","id":"ea","x0":618,"y0":400,"x1":738,"y1":400,"need":"e","sel":"ea","var":{"out":{"x0":618,"y0":400,"x1":738,"y1":400},"in":{"x0":582,"y0":400,"x1":462,"y1":400}},"dflt":"out","gr":"ed","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"vbases":{"out":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"in":[[522,370,"middle",[0,-1]],[522,430,"middle",[0,1]],[446,400,"end",[-1,0]]]},"o":["ed"],"need":"e","sel":"ea","var":{"out":{"x":678,"y":358,"anc":"middle"},"in":{"x":466,"y":370,"anc":"middle"}},"dflt":"out","vis":[1],"t":"F","x":678,"y":370,"anc":"middle"},{"f":"ar","id":"fa","x0":618,"y0":446,"x1":738,"y1":446,"need":"f","sel":"fa","var":{"out":{"x0":618,"y0":446,"x1":738,"y1":446},"in":{"x0":582,"y0":446,"x1":462,"y1":446}},"dflt":"out","gr":"fd","col":"#c2255c","vis":[1],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"vbases":{"out":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"in":[[522,416,"middle",[0,-1]],[522,476,"middle",[0,1]],[446,446,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"out":{"x":678,"y":416,"anc":"middle"},"in":{"x":522,"y":416,"anc":"middle"}},"dflt":"out","vis":[1],"t":"F","x":678,"y":416,"anc":"middle"},{"f":"ln","id":"re1","pts":[[260,436],[260,564]],"w":2,"need":"r","vis":[1],"t":"F"},{"f":"ln","id":"re2","pts":[[600,436],[600,564]],"w":2,"need":"r","vis":[1],"t":"F"},{"f":"ar","id":"rd","x0":260,"y0":550,"x1":600,"y1":550,"two":1,"w":2,"need":"r","vis":[1],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[430,590,"middle",[0,1]],[430,510,"middle",[0,-1]]],"need":"r","vis":[1],"t":"F","x":430,"y":590,"anc":"middle"},{"f":"ln","id":"medfx1","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[2],"t":"F"},{"f":"lb","id":"medtx1","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[2],"t":"F","x":236,"y":162,"anc":"start","n":"medx1"},{"f":"ln","id":"surfx1","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[2],"t":"F"},{"f":"lb","id":"surftx1","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[2],"t":"F","x":270,"y":670,"anc":"end","n":"surfx1"},{"f":"ln","id":"ballx1","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[2],"t":"F"},{"f":"lb","id":"balltx1","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[2],"t":"F","x":696.67,"y":626.67,"anc":"start","n":"ballx1"},{"f":"ar","id":"ln0x1","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln1x1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln2x1","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln3x1","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln4x1","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln5x1","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln6x1","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln7x1","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"rdx1","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[2],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":695.62,"y":491.12,"anc":"start","n":"rx1"},{"f":"c","id":"ppdx1","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[2],"t":"F"},{"f":"lb","id":"ptx1","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[2],"t":"F","x":622.44,"y":226.97,"anc":"start","n":"px1"},{"f":"c","id":"qcx1","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[2],"t":"F"},{"f":"ln","id":"qmx1","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[2],"t":"F"},{"f":"tx","id":"qmtx1","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[2],"t":"F"},{"f":"lb","id":"qtx1","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[2],"t":"F","x":604,"y":380,"anc":"start","n":"qx1"},{"f":"lb","id":"ntx1","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[2],"t":"F","x":720,"y":190,"anc":"start","n":"nx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU19s4pe(d, p, L){ tbFig_Draw(d, p, L, U19S4K.pe); }
function tbU19s4ln(d, p, L){ tbFig_Draw(d, p, L, U19S4K.ln); }
function tbU19s4sw(d, p, L){ tbFig_Draw(d, p, L, U19S4K.sw); }
// ---- 19-5 磁束と磁束密度 の図（※ textbook/gen/make_section.py が textbook/gen/data/u19_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U19S5K = {
  ln: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":236,"y":162,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[],"t":"F","x":270,"y":670,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[],"t":"F","x":650,"y":580,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":619.62,"y":491.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":601.23,"y":248.18,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[],"t":"F","x":604,"y":380,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[],"t":"F","x":708.69,"y":178.69,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sh: {"vars":[],"items":[{"f":"ln","id":"sf","pts":[[260,520],[700,520],[840,400],[400,400]],"w":3,"fill":"gray","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[760,540,"start",[1,1]],[720,560,"middle",[0,1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":760,"y":540,"anc":"start"},{"f":"ar","id":"ph0","x0":370,"y0":700,"x1":370,"y1":230,"need":"phi","gr":"phid","vis":[],"t":"F"},{"f":"ar","id":"ph1","x0":450,"y0":700,"x1":450,"y1":230,"need":"phi","gr":"phid","vis":[],"t":"F"},{"f":"ar","id":"ph2","x0":530,"y0":700,"x1":530,"y1":230,"need":"phi","gr":"phid","vis":[],"t":"F"},{"f":"ar","id":"ph3","x0":610,"y0":700,"x1":610,"y1":230,"need":"phi","gr":"phid","vis":[],"t":"F"},{"f":"ar","id":"ph4","x0":690,"y0":700,"x1":690,"y1":230,"need":"phi","gr":"phid","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[530,200,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":530,"y":194,"anc":"middle"},{"f":"ln","id":"bq","pts":[[470,480],[540,480],[568,456],[498,456]],"dash":1,"w":3,"fill":"area","close":1,"o":["bd"],"need":"b","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[600,440,"start",[1,-1]],[430,500,"end",[-1,0]]],"o":["bd"],"need":"b","vis":[],"t":"F","x":704.65,"y":357.98,"anc":"start"},{"f":"lb","id":"mut","k":"mu","bases":[[180,230,"start",[-1,-1]]],"need":"mu","vis":[],"t":"F","x":137.57,"y":187.57,"anc":"start"},{"f":"lb","id":"ht","k":"h","bases":[[340,620,"end",[-1,0]],[340,300,"end",[-1,0]]],"need":"h","vis":[],"t":"F","x":340,"y":620,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[1],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[1],"t":"F","x":236,"y":162,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[1],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[1],"t":"F","x":270,"y":670,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[1],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[1],"t":"F","x":650,"y":580,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[1],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[1],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[1],"t":"F","x":619.62,"y":491.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[1],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[1],"t":"F","x":601.23,"y":248.18,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[1],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[1],"t":"F","x":609.57,"y":377.77,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[1],"t":"F","x":708.69,"y":93.83,"anc":"start"},{"f":"ln","id":"sfx1","pts":[[260,520],[700,520],[840,400],[400,400]],"w":3,"fill":"gray","close":1,"o":["sd"],"need":"s","vis":[2],"t":"F"},{"f":"lb","id":"stx1","k":"s","bases":[[760,540,"start",[1,1]],[720,560,"middle",[0,1]]],"o":["sd"],"need":"s","vis":[2],"t":"F","x":760,"y":540,"anc":"start","n":"sx1"},{"f":"ar","id":"ph0x1","x0":370,"y0":700,"x1":370,"y1":230,"need":"phi","gr":"phid","vis":[2],"t":"F"},{"f":"ar","id":"ph1x1","x0":450,"y0":700,"x1":450,"y1":230,"need":"phi","gr":"phid","vis":[2],"t":"F"},{"f":"ar","id":"ph2x1","x0":530,"y0":700,"x1":530,"y1":230,"need":"phi","gr":"phid","vis":[2],"t":"F"},{"f":"ar","id":"ph3x1","x0":610,"y0":700,"x1":610,"y1":230,"need":"phi","gr":"phid","vis":[2],"t":"F"},{"f":"ar","id":"ph4x1","x0":690,"y0":700,"x1":690,"y1":230,"need":"phi","gr":"phid","vis":[2],"t":"F"},{"f":"lb","id":"phitx1","k":"phi","bases":[[530,200,"middle",[0,-1]]],"need":"phi","vis":[2],"t":"F","x":530,"y":194,"anc":"middle","n":"phix1"},{"f":"ln","id":"bqx1","pts":[[470,480],[540,480],[568,456],[498,456]],"dash":1,"w":3,"fill":"area","close":1,"o":["bd"],"need":"b","vis":[2],"t":"F"},{"f":"lb","id":"btx1","k":"b","bases":[[600,440,"start",[1,-1]],[430,500,"end",[-1,0]]],"o":["bd"],"need":"b","vis":[2],"t":"F","x":704.65,"y":357.98,"anc":"start","n":"bx1"},{"f":"lb","id":"mutx1","k":"mu","bases":[[180,230,"start",[-1,-1]]],"need":"mu","vis":[2],"t":"F","x":137.57,"y":187.57,"anc":"start","n":"mux1"},{"f":"lb","id":"htx1","k":"h","bases":[[340,620,"end",[-1,0]],[340,300,"end",[-1,0]]],"need":"h","vis":[2],"t":"F","x":340,"y":620,"anc":"end","n":"hx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU19s5ln(d, p, L){ tbFig_Draw(d, p, L, U19S5K.ln); }
function tbU19s5sh(d, p, L){ tbFig_Draw(d, p, L, U19S5K.sh); }
function tbU19s5sw(d, p, L){ tbFig_Draw(d, p, L, U19S5K.sw); }
var KINDS = {u19s1mg: tbU19s1mg, u19s2mg: tbU19s2mg, u19s2pr: tbU19s2pr, u19s2mp: tbU19s2mp, u19s3pr: tbU19s3pr, u19s4pe: tbU19s4pe, u19s4ln: tbU19s4ln, u19s4sw: tbU19s4sw, u19s5ln: tbU19s5ln, u19s5sh: tbU19s5sh, u19s5sw: tbU19s5sw};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 19-1 の図は電流が流れないので載せない,
  // 19-2 の図は電流が流れないので載せない,
  // 19-3 の図は電流が流れないので載せない,
  // 19-4 の図は電流が流れないので載せない,
  // 19-5 の図は電流が流れないので載せない
};

// 19-1 磁界と磁極 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u19_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU19s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU19s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU19s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU19s1_par(a, b){ return a * b / (a + b); }
function tbU19s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU19s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU19s1_Qdir(r){
  var gcd = tbU19s1_gcd, ratio = tbU19s1_ratio, par = tbU19s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var a = (k == 1 ? 'N' : 'S');
    var b = (k == 1 ? 'S' : 'N');
    var ha = (k == 1 ? 'right' : 'left');
    var good = (k == 1 ? '右向き' : '左向き');
    var bad = (k == 1 ? '左向き' : '右向き');
    var why = (k == 1 ? '左向きは S 極から N 極へ向かう向き' : '右向きは S 極から N 極へ向かう向き');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "上向き", v: "up", why: "磁界は N 極から S 極へ向かう"}, {t: "向きは無い", v: "none", why: "磁界には向きがある（N 極から S 極へ）"}]);
    return {form: "u19s1dir", text: "図のように、左に " + String(a) + " 極、右に " + String(b) + " 極を向かい合わせて置いた。2つの磁極の間の磁界の向きはどれか。", fig: {kind: "u19s1mg", L: tbU19s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right"}, [["pl", String(a)], ["pls", String(a)], ["pr", String(b)], ["prs", String(b)], ["ha", String(ha)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁界は N 極から S 極へ向かう", "間の磁界は " + String(good)], chk: {form: "u19s1dir", p: {k: k}}};
  }
  throw new Error("u19s1dir：条件に合う数字が見つからない");
}
function tbU19s1_Qunith(r){
  var gcd = tbU19s1_gcd, ratio = tbU19s1_ratio, par = tbU19s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "A/m", v: "own"}, {t: "Wb", v: "wb", why: "Wb は磁極の強さの単位"}, {t: "N", v: "n", why: "N は力の単位"}, {t: "N/C", v: "nc", why: "N/C は電界の強さの単位"}]);
    return {form: "u19s1unith", text: "磁界の強さ $H$ の単位は □ である。", fig: {kind: "u19s1mg", L: tbU19s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁界の強さ $H$ の単位は A/m（アンペア毎メートル）"], chk: {form: "u19s1unith", p: {}}};
  }
  throw new Error("u19s1unith：条件に合う数字が見つからない");
}
function tbU19s1_Qunitm(r){
  var gcd = tbU19s1_gcd, ratio = tbU19s1_ratio, par = tbU19s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "Wb", v: "own"}, {t: "A/m", v: "am", why: "A/m は磁界の強さの単位"}, {t: "C", v: "c", why: "C は電荷の単位"}, {t: "N", v: "n", why: "N は力の単位"}]);
    return {form: "u19s1unitm", text: "磁極の強さ $m$ の単位は □ である。", fig: {kind: "u19s1mg", L: tbU19s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right"}, [["ml", "{m}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁極の強さ $m$ の単位は Wb（ウェーバー）"], chk: {form: "u19s1unitm", p: {}}};
  }
  throw new Error("u19s1unitm：条件に合う数字が見つからない");
}
function tbU19s1_Qsign(r){
  var gcd = tbU19s1_gcd, ratio = tbU19s1_ratio, par = tbU19s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? 'N' : 'S');
    var ot = (k == 1 ? 'S' : 'N');
    var g = (k == 1 ? '$-m$' : '$m$');
    var b = (k == 1 ? '$m$' : '$-m$');
    var why = (k == 1 ? 'S 極は N 極と反対なので、負の符号を付ける' : 'N 極は S 極と反対なので、符号を付け替える');
    var _c = choices(r, [{t: String(g), v: "g"}, {t: String(b), v: "b", why: String(why)}, {t: "$0$", v: "0", why: "S 極にも、N 極と同じ強さの磁極がある"}, {t: "$2m$", v: "2m", why: "同じ強さなので、大きさは $m$"}]);
    return {form: "u19s1sign", text: "同じ強さの N 極と S 極がある。" + String(nm) + " 極の磁極の強さを " + String(b) + "［Wb］と表すとき、" + String(ot) + " 極の磁極の強さは □［Wb］である。", fig: {kind: "u19s1mg", L: tbU19s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right"}, [["ml", "{m}"], ["mr", "-{m}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["S 極の磁極の強さは、N 極と反対の符号を付けて表す", String(ot) + " 極は " + String(g)], chk: {form: "u19s1sign", p: {k: k}}};
  }
  throw new Error("u19s1sign：条件に合う数字が見つからない");
}
function tbU19s1_Qpole(r){
  var gcd = tbU19s1_gcd, ratio = tbU19s1_ratio, par = tbU19s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁石の先端の、磁力の最も強い所", v: "own"}, {t: "磁力が働いている空間", v: "sp", why: "磁力が働いている空間は磁界"}, {t: "磁石の真ん中の、磁力の最も強い所", v: "mid", why: "磁極は磁石の先端にある"}, {t: "磁力が働かない所", v: "no", why: "磁極は、磁力の最も強い所"}]);
    return {form: "u19s1pole", text: "磁極とは、□ である。", fig: {kind: "u19s1mg", L: tbU19s1_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁石の先端の、磁力の最も強い所を磁極という"], chk: {form: "u19s1pole", p: {}}};
  }
  throw new Error("u19s1pole：条件に合う数字が見つからない");
}
// 19-2 磁気の力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u19_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU19s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU19s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU19s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU19s2_par(a, b){ return a * b / (a + b); }
function tbU19s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU19s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU19s2_Qf(r){
  var gcd = tbU19s2_gcd, ratio = tbU19s2_ratio, par = tbU19s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8]);
    var h = pick(r, [100,200,250,300,400,500,600,800,1000]);
    var F = (a * h / 1000);
    var A = (a * h);
    var B = (1000 * h / a);
    var C = (h);
    if (!(nice(F) && nice(B) && F >= 0.1 && distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + "\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "$10^{-3}$ を掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{N}$", v: fmt(B), why: "磁界の強さを磁極の強さで割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "磁極の強さを掛けていない"}]);
    return {form: "u19s2f", text: "強さ $" + fmt(h) + "\\,\\mathrm{A/m}$ の磁界の中に、強さ $" + fmt(a) + " \\times 10^{-3}\\,\\mathrm{Wb}$ の磁極を置いた。磁極に働く磁力の大きさは何 N か。", fig: {kind: "u19s2mg", L: tbU19s2_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","tp":"{m}","tps":"N","f":"{F}","fa":"right"}, [["h", "{H}=" + fmt(h) + " A/m"], ["tp", "{m}=" + fmt(a) + "×10⁻³ Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = mH$", "$F = " + fmt(a) + " \\times 10^{-3} \\times " + fmt(h) + " = " + fmt(F) + "\\,\\mathrm{N}$"], chk: {form: "u19s2f", p: {a: a, h: h}}};
  }
  throw new Error("u19s2f：条件に合う数字が見つからない");
}
function tbU19s2_Qh(r){
  var gcd = tbU19s2_gcd, ratio = tbU19s2_ratio, par = tbU19s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,4,5,8]);
    var fv = pick(r, [0.2,0.4,0.5,1,1.5,2,3,4]);
    var H = (1000 * fv / a);
    var A = (fv * a / 1000);
    var B = (fv / a);
    var C = (fv);
    if (!(nice(H) && nice(A) && nice(B) && A >= 0.001 && distinct([H, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(H) + "\\,\\mathrm{A/m}$", v: fmt(H)}, {t: "$" + fmt(A) + "\\,\\mathrm{A/m}$", v: fmt(A), why: "割るところを掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{A/m}$", v: fmt(B), why: "$10^{-3}$ を入れていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{A/m}$", v: fmt(C), why: "磁極の強さで割っていない"}]);
    return {form: "u19s2h", text: "強さ $" + fmt(a) + " \\times 10^{-3}\\,\\mathrm{Wb}$ の磁極を磁界の中に置くと、$" + fmt(fv) + "\\,\\mathrm{N}$ の磁力が働いた。磁界の強さは何 A/m か。", fig: {kind: "u19s2mg", L: tbU19s2_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","tp":"{m}","tps":"N","f":"{F}","fa":"right"}, [["h", "{H}"], ["tp", "{m}=" + fmt(a) + "×10⁻³ Wb"], ["f", "{F}=" + fmt(fv) + " N"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = mH$ を変形して $H = \\dfrac{F}{m}$", "$H = \\dfrac{" + fmt(fv) + "}{" + fmt(a) + " \\times 10^{-3}} = " + fmt(H) + "\\,\\mathrm{A/m}$"], chk: {form: "u19s2h", p: {a: a, fv: fv}}};
  }
  throw new Error("u19s2h：条件に合う数字が見つからない");
}
function tbU19s2_Qratio(r){
  var gcd = tbU19s2_gcd, ratio = tbU19s2_ratio, par = tbU19s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,5]);
    var k2 = (k * k);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(k2) + "}$ 倍", v: "1/" + fmt(k2)}, {t: "$\\dfrac{1}{" + fmt(k) + "}$ 倍", v: "1/" + fmt(k), why: "距離を2乗していない"}, {t: "$" + fmt(k2) + "$ 倍", v: fmt(k2), why: "距離は分母にあるので、力は弱まる"}, {t: "$" + fmt(k) + "$ 倍", v: fmt(k), why: "距離は分母にあり、2乗する"}]);
    return {form: "u19s2ratio", text: "真空中で、2つの点の磁極の距離を " + fmt(k) + " 倍にした。働く磁力の大きさは元の何倍になるか。", fig: {kind: "u19s2pr", L: tbU19s2_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","tp":"{m}","tps":"N","f":"{F}","fa":"right"}, [["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}$ で、力は距離の2乗に反比例する", "距離が " + fmt(k) + " 倍なので、力は $\\dfrac{1}{" + fmt(k2) + "}$ 倍"], chk: {form: "u19s2ratio", p: {k: k}}};
  }
  throw new Error("u19s2ratio：条件に合う数字が見つからない");
}
function tbU19s2_Qprod(r){
  var gcd = tbU19s2_gcd, ratio = tbU19s2_ratio, par = tbU19s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4]);
    var b = pick(r, [2,3,4]);
    var ab = (a * b);
    var s = (a + b);
    if (!(a <= b && ab != s)) continue;
    var _c = choices(r, [{t: "$" + fmt(ab) + "$ 倍", v: fmt(ab)}, {t: "$" + fmt(s) + "$ 倍", v: fmt(s), why: "磁極の強さの積に比例するので、掛ける"}, {t: "$\\dfrac{1}{" + fmt(ab) + "}$ 倍", v: "1/" + fmt(ab), why: "磁極の強さは分子にあるので、力は強まる"}, {t: "$1$ 倍（変わらない）", v: "1", why: "磁力は磁極の強さで変わる"}]);
    return {form: "u19s2prod", text: "真空中で、2つの点の磁極の距離を変えずに、$m_1$ を " + fmt(a) + " 倍、$m_2$ を " + fmt(b) + " 倍にした。働く磁力の大きさは元の何倍になるか。", fig: {kind: "u19s2pr", L: tbU19s2_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","tp":"{m}","tps":"N","f":"{F}","fa":"right"}, [["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁力は磁極の強さの積 $m_1 m_2$ に比例する", fmt(a) + " 倍と " + fmt(b) + " 倍なので、力は $" + fmt(a) + " \\times " + fmt(b) + " = " + fmt(ab) + "$ 倍"], chk: {form: "u19s2prod", p: {a: a, b: b}}};
  }
  throw new Error("u19s2prod：条件に合う数字が見つからない");
}
function tbU19s2_Qeq(r){
  var gcd = tbU19s2_gcd, ratio = tbU19s2_ratio, par = tbU19s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}$", v: "own"}, {t: "$F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r}$", v: "r1", why: "距離を2乗していない"}, {t: "$F = \\dfrac{m_1 m_2}{4 \\pi \\varepsilon_0 r^2}$", v: "eps", why: "磁気の力の式では、$\\varepsilon_0$ でなく真空中の透磁率 $\\mu_0$"}, {t: "$F = \\dfrac{m_1 + m_2}{4 \\pi \\mu_0 r^2}$", v: "sum", why: "分子は磁極の強さの和でなく積"}]);
    return {form: "u19s2eq", text: "真空中で、強さ $m_1$［Wb］と $m_2$［Wb］の点の磁極を $r$［m］離して置いた。働く磁力の大きさ $F$［N］を表す式は □ である。", fig: {kind: "u19s2pr", L: tbU19s2_fig({"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","tp":"{m}","tps":"N","f":"{F}","fa":"right"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁極の強さの積に比例し、距離の2乗に反比例する", "$F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}$"], chk: {form: "u19s2eq", p: {}}};
  }
  throw new Error("u19s2eq：条件に合う数字が見つからない");
}
// 19-3 透磁率 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u19_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU19s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU19s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU19s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU19s3_par(a, b){ return a * b / (a + b); }
function tbU19s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU19s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU19s3_Qratio(r){
  var gcd = tbU19s3_gcd, ratio = tbU19s3_ratio, par = tbU19s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mr = pick(r, [2,3,4,5,8,10,100]);
    var mr2 = (mr * mr);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(mr) + "}$ 倍", v: "1/" + fmt(mr)}, {t: "$" + fmt(mr) + "$ 倍", v: fmt(mr), why: "透磁率は分母にあるので、力は弱まる"}, {t: "$\\dfrac{1}{" + fmt(mr2) + "}$ 倍", v: "1/" + fmt(mr2), why: "比透磁率を2乗した（2乗するのは距離）"}, {t: "$1$ 倍（変わらない）", v: "1", why: "まわりの物質で力は変わる"}]);
    return {form: "u19s3ratio", text: "2つの点の磁極のまわりを、真空中から比透磁率 " + fmt(mr) + " の物質に変えた。距離が同じとき、働く磁力の大きさは元の何倍になるか。", fig: {kind: "u19s3pr", L: tbU19s3_fig({"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{μ}_r=" + fmt(mr)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["透磁率は $\\mu = \\mu_0 \\mu_r$ で、真空中の " + fmt(mr) + " 倍", "分母が " + fmt(mr) + " 倍なので、力は $\\dfrac{1}{" + fmt(mr) + "}$ 倍"], chk: {form: "u19s3ratio", p: {mr: mr}}};
  }
  throw new Error("u19s3ratio：条件に合う数字が見つからない");
}
function tbU19s3_Qval(r){
  var gcd = tbU19s3_gcd, ratio = tbU19s3_ratio, par = tbU19s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mr = pick(r, [2,3,4,5,8]);
    var k = pick(r, [0.5,1,1.5,2,3,4,5,6]);
    var F0 = (k * mr);
    var ok2 = (k);
    var A = (k * mr * mr);
    var B = (k / mr);
    var C = (k * mr);
    if (!(nice(F0) && nice(B) && distinct([ok2, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ok2) + "\\,\\mathrm{N}$", v: fmt(ok2)}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "透磁率は分母にあるので、力は弱まる"}, {t: "$" + fmt(B) + "\\,\\mathrm{N}$", v: fmt(B), why: "比透磁率を2乗した"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "まわりの物質で力は変わる"}]);
    return {form: "u19s3val", text: "真空中で 2つの点の磁極の間に $" + fmt(F0) + "\\,\\mathrm{N}$ の磁力が働いていた。距離を変えずに、まわりを比透磁率 " + fmt(mr) + " の物質にした。働く磁力の大きさは何 N になるか。", fig: {kind: "u19s3pr", L: tbU19s3_fig({"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{μ}_r=" + fmt(mr)], ["f1", "{F}"], ["f2", "{F}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["比透磁率 " + fmt(mr) + " の物質の中では、力は $\\dfrac{1}{" + fmt(mr) + "}$ 倍", "$" + fmt(F0) + " \\times \\dfrac{1}{" + fmt(mr) + "} = " + fmt(ok2) + "\\,\\mathrm{N}$"], chk: {form: "u19s3val", p: {k: k, mr: mr}}};
  }
  throw new Error("u19s3val：条件に合う数字が見つからない");
}
function tbU19s3_Qmu(r){
  var gcd = tbU19s3_gcd, ratio = tbU19s3_ratio, par = tbU19s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var mr = pick(r, [2,4,5,8,10,20,50,100]);
    var a = (4 * mr);
    var b = (4 / mr);
    var c = (4 + mr);
    if (!(nice(b) && distinct([a, b, c, 4]))) continue;
    var _c = choices(r, [{t: "$" + fmt(a) + " \\pi \\times 10^{-7}\\,\\mathrm{H/m}$", v: fmt(a)}, {t: "$" + fmt(b) + " \\pi \\times 10^{-7}\\,\\mathrm{H/m}$", v: fmt(b), why: "比透磁率は真空中の何倍かを表すので、割らずに掛ける"}, {t: "$" + fmt(c) + " \\pi \\times 10^{-7}\\,\\mathrm{H/m}$", v: fmt(c), why: "足すのでなく、掛ける"}, {t: "$4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$", v: "4", why: "それは真空中の透磁率。比透磁率を掛ける"}]);
    return {form: "u19s3mu", text: "比透磁率 " + fmt(mr) + " の物質の透磁率は何 H/m か。ただし真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とする。", fig: {kind: "u19s3pr", L: tbU19s3_fig({"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{μ}_r=" + fmt(mr)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\mu = \\mu_0 \\mu_r$", "$\\mu = 4 \\pi \\times 10^{-7} \\times " + fmt(mr) + " = " + fmt(a) + " \\pi \\times 10^{-7}\\,\\mathrm{H/m}$"], chk: {form: "u19s3mu", p: {mr: mr}}};
  }
  throw new Error("u19s3mu：条件に合う数字が見つからない");
}
function tbU19s3_Qeq(r){
  var gcd = tbU19s3_gcd, ratio = tbU19s3_ratio, par = tbU19s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mu_0 \\mu_r$", v: "own"}, {t: "$\\dfrac{\\mu_0}{\\mu_r}$", v: "div", why: "比透磁率は真空中の何倍かを表すので、掛ける"}, {t: "$\\mu_0 + \\mu_r$", v: "sum", why: "足すのでなく、掛ける"}, {t: "$\\dfrac{\\mu_r}{\\mu_0}$", v: "inv", why: "真空中の透磁率 $\\mu_0$ に、比透磁率を掛ける"}]);
    return {form: "u19s3eq", text: "比透磁率 $\\mu_r$ の物質の透磁率 $\\mu$ は □ である。ただし真空中の透磁率を $\\mu_0$ とする。", fig: {kind: "u19s3pr", L: tbU19s3_fig({"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{μ}_r"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["真空中の透磁率に、比透磁率を掛ける", "$\\mu = \\mu_0 \\mu_r$"], chk: {form: "u19s3eq", p: {}}};
  }
  throw new Error("u19s3eq：条件に合う数字が見つからない");
}
function tbU19s3_Qname(r){
  var gcd = tbU19s3_gcd, ratio = tbU19s3_ratio, par = tbU19s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "真空中の透磁率", v: "own"}, {t: "比透磁率", v: "r", why: "比透磁率は $\\mu_r$ と書く"}, {t: "真空中の誘電率", v: "eps", why: "真空中の誘電率は $\\varepsilon_0$ と書く"}, {t: "磁極の強さ", v: "m", why: "磁極の強さは $m$ と書く"}]);
    return {form: "u19s3name", text: "磁気に関するクーロンの法則の $\\mu_0$ は □ である。", fig: {kind: "u19s3pr", L: tbU19s3_fig({"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\mu_0$ は真空中の透磁率。決まった値で $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$"], chk: {form: "u19s3name", p: {}}};
  }
  throw new Error("u19s3name：条件に合う数字が見つからない");
}
// 19-4 磁界の強さと磁力線 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u19_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU19s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU19s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU19s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU19s4_par(a, b){ return a * b / (a + b); }
function tbU19s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU19s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU19s4_Qratio(r){
  var gcd = tbU19s4_gcd, ratio = tbU19s4_ratio, par = tbU19s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,5]);
    var h = pick(r, [100,200,300,400,500,600,800,900,1000,1200,1600,1800,2000,2500]);
    var ok2 = (h / (k * k));
    var A = (h / k);
    var B = (h * k * k);
    var C = (h * k);
    if (!(nice(ok2) && nice(A) && distinct([ok2, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ok2) + "\\,\\mathrm{A/m}$", v: fmt(ok2)}, {t: "$" + fmt(A) + "\\,\\mathrm{A/m}$", v: fmt(A), why: "距離を2乗していない"}, {t: "$" + fmt(B) + "\\,\\mathrm{A/m}$", v: fmt(B), why: "距離は分母にあるので、磁界は弱まる"}, {t: "$" + fmt(C) + "\\,\\mathrm{A/m}$", v: fmt(C), why: "距離は分母にあり、2乗する"}]);
    return {form: "u19s4ratio", text: "点の磁極から $r$ 離れた点の磁界の強さは $" + fmt(h) + "\\,\\mathrm{A/m}$ だった。距離を $" + fmt(k) + " r$ にした点の磁界の強さは何 A/m か。", fig: {kind: "u19s4pe", L: tbU19s4_fig({"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}","ea":"out"}, [["e", "{H}=" + fmt(h) + " A/m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{m}{4 \\pi \\mu_0 r^2}$ で、磁界の強さは距離の2乗に反比例する", "$" + fmt(h) + " \\times \\dfrac{1}{" + fmt(k) + "^2} = " + fmt(ok2) + "\\,\\mathrm{A/m}$"], chk: {form: "u19s4ratio", p: {h: h, k: k}}};
  }
  throw new Error("u19s4ratio：条件に合う数字が見つからない");
}
function tbU19s4_Qdens(r){
  var gcd = tbU19s4_gcd, ratio = tbU19s4_ratio, par = tbU19s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var nl = pick(r, [200,400,600,800,1200,1600,2000,2400,3000,3600]);
    var s = pick(r, [2,4,5,8,10,12,20]);
    var H = (nl / s);
    var A = (nl * s);
    var B = (s / nl);
    var C = (nl);
    if (!(nice(H) && nice(B) && B >= 0.001 && distinct([H, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(H) + "\\,\\mathrm{A/m}$", v: fmt(H)}, {t: "$" + fmt(A) + "\\,\\mathrm{A/m}$", v: fmt(A), why: "面積で割るところを掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{A/m}$", v: fmt(B), why: "割る順が逆"}, {t: "$" + fmt(C) + "\\,\\mathrm{A/m}$", v: fmt(C), why: "面積で割っていない（磁界の強さは 1 m² あたりの本数）"}]);
    return {form: "u19s4dens", text: "点の磁極から $" + fmt(nl) + "$ 本の磁力線が出ている。磁極を真ん中に置いた球の表面積は $" + fmt(s) + "\\,\\mathrm{m^2}$ である。球の表面での磁界の強さは何 A/m か。", fig: {kind: "u19s4ln", L: tbU19s4_fig({"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}","ea":"out"}, [["lk", "line"], ["n", fmt(nl) + " 本"], ["ball", fmt(s) + " m²"], ["p", null], ["e", null], ["ea", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁界の強さ＝磁力線の密度（1 m² あたりの本数）", "$H = \\dfrac{" + fmt(nl) + "}{" + fmt(s) + "} = " + fmt(H) + "\\,\\mathrm{A/m}$"], chk: {form: "u19s4dens", p: {nl: nl, s: s}}};
  }
  throw new Error("u19s4dens：条件に合う数字が見つからない");
}
function tbU19s4_Qlines(r){
  var gcd = tbU19s4_gcd, ratio = tbU19s4_ratio, par = tbU19s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{m}{\\mu}$ 本", v: "own"}, {t: "$m$ 本", v: "m", why: "磁力線は透磁率に影響されるので、$\\mu$ で割る"}, {t: "$\\mu m$ 本", v: "mu", why: "透磁率は掛けるのでなく、割る"}, {t: "$\\dfrac{\\mu}{m}$ 本", v: "inv", why: "割る順が逆"}]);
    return {form: "u19s4lines", text: "強さ $m$［Wb］の磁極から出る磁力線の本数は □ である。ただし、まわりの物質の透磁率を $\\mu$ とする。", fig: {kind: "u19s4ln", L: tbU19s4_fig({"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}","ea":"out"}, [["lk", "line"], ["n", ""], ["ball", ""], ["p", null], ["e", null], ["ea", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁力線は透磁率に影響される", "$m$［Wb］の磁極から $\\dfrac{m}{\\mu}$ 本"], chk: {form: "u19s4lines", p: {}}};
  }
  throw new Error("u19s4lines：条件に合う数字が見つからない");
}
function tbU19s4_Qsame(r){
  var gcd = tbU19s4_gcd, ratio = tbU19s4_ratio, par = tbU19s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁界の強さ", v: "own"}, {t: "磁極の強さ", v: "m", why: "磁極の強さは、磁力線が出てくる元の強さ"}, {t: "透磁率", v: "mu", why: "透磁率は、まわりの物質で決まる数"}, {t: "磁力", v: "f", why: "磁力は、磁極に働く力"}]);
    return {form: "u19s4same", text: "磁力線の密度（1 m² あたりの磁力線の本数）は、□ と同じである。", fig: {kind: "u19s4ln", L: tbU19s4_fig({"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}","ea":"out"}, [["lk", "line"], ["n", ""], ["ball", ""], ["p", null], ["e", null], ["ea", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁力線の密度は、その点の磁界の強さと同じ"], chk: {form: "u19s4same", p: {}}};
  }
  throw new Error("u19s4same：条件に合う数字が見つからない");
}
function tbU19s4_Qeq(r){
  var gcd = tbU19s4_gcd, ratio = tbU19s4_ratio, par = tbU19s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{m}{4 \\pi \\mu_0 r^2}$", v: "own"}, {t: "$\\dfrac{m}{4 \\pi \\mu_0 r}$", v: "r1", why: "距離を2乗していない"}, {t: "$\\dfrac{4 \\pi \\mu_0 r^2}{m}$", v: "inv", why: "分子と分母が逆"}, {t: "$\\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}$", v: "f", why: "それは2つの磁極の間に働く磁力"}]);
    return {form: "u19s4eq", text: "真空中で、強さ $m$［Wb］の点の磁極から $r$［m］離れた点の磁界の強さ $H$［A/m］は □ である。", fig: {kind: "u19s4pe", L: tbU19s4_fig({"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}","ea":"out"}, [["e", "{H}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["クーロンの法則から $m_2$ を除いた部分が磁界の強さ", "$H = \\dfrac{m}{4 \\pi \\mu_0 r^2}$"], chk: {form: "u19s4eq", p: {}}};
  }
  throw new Error("u19s4eq：条件に合う数字が見つからない");
}
// 19-5 磁束と磁束密度 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u19_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU19s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU19s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU19s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU19s5_par(a, b){ return a * b / (a + b); }
function tbU19s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU19s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU19s5_Qb(r){
  var gcd = tbU19s5_gcd, ratio = tbU19s5_ratio, par = tbU19s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var p = pick(r, [0.01,0.02,0.03,0.04,0.05,0.06,0.08,0.1,0.12,0.15,0.2]);
    var s = pick(r, [0.01,0.02,0.04,0.05,0.1,0.2,0.25]);
    var B = (p / s);
    var A = (p * s);
    var C = (s / p);
    if (!(nice(B) && nice(A) && nice(C) && A >= 0.001 && distinct([B, A, C, p]))) continue;
    var _c = choices(r, [{t: "$" + fmt(B) + "\\,\\mathrm{T}$", v: fmt(B)}, {t: "$" + fmt(A) + "\\,\\mathrm{T}$", v: fmt(A), why: "面積で割るところを掛けた"}, {t: "$" + fmt(C) + "\\,\\mathrm{T}$", v: fmt(C), why: "割る順が逆"}, {t: "$" + fmt(p) + "\\,\\mathrm{T}$", v: fmt(p), why: "面積で割っていない（磁束密度は 1 m² あたりの磁束）"}]);
    return {form: "u19s5b", text: "面積 $" + fmt(s) + "\\,\\mathrm{m^2}$ の面を、$" + fmt(p) + "\\,\\mathrm{Wb}$ の磁束が通り抜けている。面の磁束密度は何 T か。", fig: {kind: "u19s5sh", L: tbU19s5_fig({"phi":"{Φ}","s":"{S}","b":"{B}"}, [["phi", "{Φ}=" + fmt(p) + " Wb"], ["s", "{S}=" + fmt(s) + " m²"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$B = \\dfrac{\\Phi}{S}$", "$B = \\dfrac{" + fmt(p) + "}{" + fmt(s) + "} = " + fmt(B) + "\\,\\mathrm{T}$"], chk: {form: "u19s5b", p: {p: p, s: s}}};
  }
  throw new Error("u19s5b：条件に合う数字が見つからない");
}
function tbU19s5_Qphi(r){
  var gcd = tbU19s5_gcd, ratio = tbU19s5_ratio, par = tbU19s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var s = pick(r, [0.01,0.02,0.05,0.1,0.2]);
    var P = (b * s);
    var A = (b / s);
    var C = (s / b);
    if (!(nice(P) && nice(A) && nice(C) && P >= 0.001 && distinct([P, A, C, b]))) continue;
    var _c = choices(r, [{t: "$" + fmt(P) + "\\,\\mathrm{Wb}$", v: fmt(P)}, {t: "$" + fmt(A) + "\\,\\mathrm{Wb}$", v: fmt(A), why: "面積を掛けるところを割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{Wb}$", v: fmt(C), why: "面積を磁束密度で割った"}, {t: "$" + fmt(b) + "\\,\\mathrm{Wb}$", v: fmt(b), why: "面積を掛けていない"}]);
    return {form: "u19s5phi", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中に、面積 $" + fmt(s) + "\\,\\mathrm{m^2}$ の面がある。面を通り抜ける磁束は何 Wb か。", fig: {kind: "u19s5sh", L: tbU19s5_fig({"phi":"{Φ}","s":"{S}","b":"{B}"}, [["b", "{B}=" + fmt(b) + " T"], ["s", "{S}=" + fmt(s) + " m²"], ["phi", "{Φ}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\Phi = BS$", "$\\Phi = " + fmt(b) + " \\times " + fmt(s) + " = " + fmt(P) + "\\,\\mathrm{Wb}$"], chk: {form: "u19s5phi", p: {b: b, s: s}}};
  }
  throw new Error("u19s5phi：条件に合う数字が見つからない");
}
function tbU19s5_Qbmu(r){
  var gcd = tbU19s5_gcd, ratio = tbU19s5_ratio, par = tbU19s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8]);
    var h = pick(r, [100,200,250,300,400,500,600,800,1000]);
    var B = (a * h / 1000);
    var A = (a * h);
    var C = (1000 * h / a);
    if (!(nice(B) && nice(C) && B >= 0.1 && distinct([B, A, C, h]))) continue;
    var _c = choices(r, [{t: "$" + fmt(B) + "\\,\\mathrm{T}$", v: fmt(B)}, {t: "$" + fmt(A) + "\\,\\mathrm{T}$", v: fmt(A), why: "$10^{-3}$ を掛けていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{T}$", v: fmt(C), why: "磁界の強さを透磁率で割った"}, {t: "$" + fmt(h) + "\\,\\mathrm{T}$", v: fmt(h), why: "透磁率を掛けていない"}]);
    return {form: "u19s5bmu", text: "透磁率 $" + fmt(a) + " \\times 10^{-3}\\,\\mathrm{H/m}$ の物質の中の、磁界の強さが $" + fmt(h) + "\\,\\mathrm{A/m}$ の所の磁束密度は何 T か。", fig: {kind: "u19s5sh", L: tbU19s5_fig({"phi":"{Φ}","s":"{S}","b":"{B}"}, [["mu", "{μ}=" + fmt(a) + "×10⁻³ H/m"], ["h", "{H}=" + fmt(h) + " A/m"], ["phi", ""], ["s", ""], ["b", "{B}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$B = \\mu H$", "$B = " + fmt(a) + " \\times 10^{-3} \\times " + fmt(h) + " = " + fmt(B) + "\\,\\mathrm{T}$"], chk: {form: "u19s5bmu", p: {a: a, h: h}}};
  }
  throw new Error("u19s5bmu：条件に合う数字が見つからない");
}
function tbU19s5_Qunit(r){
  var gcd = tbU19s5_gcd, ratio = tbU19s5_ratio, par = tbU19s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "Wb/m²", v: "own"}, {t: "Wb·m²", v: "wbm", why: "磁束を面積で割るので、Wb/m²"}, {t: "A/m", v: "am", why: "A/m は磁界の強さの単位"}, {t: "Wb", v: "wb", why: "Wb は磁束の単位"}]);
    return {form: "u19s5unit", text: "磁束密度の単位 T（テスラ）は □ と同じである。", fig: {kind: "u19s5sh", L: tbU19s5_fig({"phi":"{Φ}","s":"{S}","b":"{B}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束密度は、磁束［Wb］を面積［m²］で割った物", "T＝Wb/m²"], chk: {form: "u19s5unit", p: {}}};
  }
  throw new Error("u19s5unit：条件に合う数字が見つからない");
}
function tbU19s5_Qflux(r){
  var gcd = tbU19s5_gcd, ratio = tbU19s5_ratio, par = tbU19s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$m$［Wb］", v: "own"}, {t: "$\\dfrac{m}{\\mu}$［Wb］", v: "mu", why: "透磁率で割るのは磁力線の本数。磁束は透磁率に影響されない"}, {t: "$\\mu m$［Wb］", v: "mum", why: "磁束は透磁率に影響されない"}, {t: "$\\dfrac{m}{4 \\pi r^2}$［Wb］", v: "d", why: "面積で割ると磁束密度"}]);
    return {form: "u19s5flux", text: "強さ $m$［Wb］の磁極から出る磁束は □ である。ただし、まわりの物質の透磁率を $\\mu$ とする。", fig: {kind: "u19s5ln", L: tbU19s5_fig({"phi":"{Φ}","s":"{S}","b":"{B}"}, [["q", "{m}"], ["qs", "N"], ["lk", "flux"], ["n", "{m}"], ["phi", null], ["s", null], ["b", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束は透磁率に影響されない", "$m$［Wb］の磁極から $m$［Wb］の磁束が出る"], chk: {form: "u19s5flux", p: {}}};
  }
  throw new Error("u19s5flux：条件に合う数字が見つからない");
}
var GEN = {
  // 19-1 磁界と磁極
  1: function(r){ return pick(r, [tbU19s1_Qdir, tbU19s1_Qdir, tbU19s1_Qdir, tbU19s1_Qunith, tbU19s1_Qunith, tbU19s1_Qunitm, tbU19s1_Qunitm, tbU19s1_Qsign, tbU19s1_Qsign, tbU19s1_Qpole])(r); },
  // 19-2 磁気の力
  2: function(r){ return pick(r, [tbU19s2_Qf, tbU19s2_Qf, tbU19s2_Qf, tbU19s2_Qh, tbU19s2_Qh, tbU19s2_Qratio, tbU19s2_Qratio, tbU19s2_Qprod, tbU19s2_Qprod, tbU19s2_Qeq])(r); },
  // 19-3 透磁率
  3: function(r){ return pick(r, [tbU19s3_Qratio, tbU19s3_Qratio, tbU19s3_Qval, tbU19s3_Qval, tbU19s3_Qval, tbU19s3_Qmu, tbU19s3_Qmu, tbU19s3_Qeq, tbU19s3_Qname])(r); },
  // 19-4 磁界の強さと磁力線
  4: function(r){ return pick(r, [tbU19s4_Qratio, tbU19s4_Qratio, tbU19s4_Qratio, tbU19s4_Qdens, tbU19s4_Qdens, tbU19s4_Qdens, tbU19s4_Qlines, tbU19s4_Qlines, tbU19s4_Qsame, tbU19s4_Qeq])(r); },
  // 19-5 磁束と磁束密度
  5: function(r){ return pick(r, [tbU19s5_Qb, tbU19s5_Qb, tbU19s5_Qb, tbU19s5_Qphi, tbU19s5_Qphi, tbU19s5_Qphi, tbU19s5_Qbmu, tbU19s5_Qbmu, tbU19s5_Qunit, tbU19s5_Qflux])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t19s1e","scene":"t19s1e","kind":"u19s1mg","lab":{"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","ml":"{m}","mr":"-{m}"},"viewbox":"136 211 768 379","band":{"want":"磁界と磁極","ans":"磁界の強さ $H$［A/m］、磁極の強さ $m$［Wb］、磁界は N から S へ","full":"磁力が働いている空間を磁界という。磁界の強さ H の単位は A/m。磁石の先端の、磁力の最も強い所が磁極。磁極の強さ m の単位は Wb。磁界は N から S へ向かう。S 極の磁極の強さは -m。"},"narr":{"start":{"co":1,"hd":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"①磁界\n②磁極\n③磁界の向き\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁石には N 極と S 極があります。磁石のまわりには、磁力が働きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Pl","Pr"]},{"text":"磁力が働いている空間を、〖磁界〗といいます。","at":{"強調":1.0},"after":[],"emph":["H"]},{"text":"磁界の強さは $H$ で表します。単位は A/m（アンペア毎メートル）です。磁界の強さが大きいほど、大きな磁力が働きます。","at":{"強調":1.0},"after":[],"emph":["H"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁石の先端の、磁力の最も強い所を〖磁極〗といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pl","Pr"]},{"text":"磁極の強さは $m$ で表します。単位は Wb（ウェーバー）です。","at":{"強調":1.0},"after":[],"emph":["Ml"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖磁界は、N 極から S 極へ向かいます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"h","emph":["H","Pl","Pr"]},{"text":"S 極は N 極と反対なので、磁極の強さに負の符号を付けて $-m$ と表します。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Mr"],"ans":true}]}],"groups":{"Pl":["plb","plbt","plt0","plt1"],"Pr":["prb","prbt","prt0","prt1"],"Ml":["mlt0","mlt1"],"Mr":["mrt0","mrt1"],"H":["h0","h0:h","h1","h1:h","h2","h2:h","ht0","ht1"],"Tp":["tpc","tpm","tpmt","tpt0","tpt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"h":{"to":{"hd":1},"dur":0.8}},"route":["磁界","磁極","磁界の向き"]}},{"id":"t19s1x","scene":"t19s1x","kind":"u19s1mg","lab":{"pl":"S","pls":"S","pr":"N","prs":"N","h":"{H}","ha":"left"},"viewbox":"136 211 768 379","band":{"want":"間の磁界の向き","ans":"左向き（N 極から S 極へ）"},"narr":{"start":{"co":1,"hd":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"求めるのは、2つの磁極の間の磁界の向きです。","at":{"強調":1.0},"after":[],"emph":["H"]},{"text":"①磁極を見る\n②磁界の向き\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"左が S 極、右が N 極です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Pl","Pr"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖磁界は N 極から S 極へ向かいます〗。右の N 極から左の S 極へ向かうので、左向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"h","emph":["H","Pr"]},{"text":"答えは、左向きです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["H","Pl","Pr"],"ans":true}]}],"groups":{"Pl":["plb","plbt","plt0","plt1"],"Pr":["prb","prbt","prt0","prt1"],"Ml":["mlt0","mlt1"],"Mr":["mrt0","mrt1"],"H":["h0","h0:h","h1","h1:h","h2","h2:h","ht0","ht1"],"Tp":["tpc","tpm","tpmt","tpt0","tpt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"h":{"to":{"hd":1},"dur":0.8}},"route":["磁極を見る","磁界の向き"]}},{"id":"t19s2e","scene":"t19s2e","kind":"u19s2mp","lab":{"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}","ha":"right","tp":"{m}","tps":"N","f":"{F}","fa":"right","q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"},"viewbox":"130 211 774 363","band":{"want":"磁極に働く磁力","ans":"$F = mH$、$F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}$","full":"磁界の中の磁極には F = mH の磁力が働く。2つの磁極の間の磁力は、磁極の強さの積に比例し、距離の2乗に反比例する。F = m1 m2 /（4π μ0 r^2）。μ0 は真空中の透磁率。"},"narr":{"start":{"co":1,"t":0,"tpd":0,"fd":0,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"①磁界の中の磁極\n②2つの磁極\n③クーロンの法則と比べる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"強さ $H$ の磁界の中に、強さ $m$ の磁極を置きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"tp","emph":["H","Tp"]},{"text":"磁極には磁力 $F$ が働きます。単位は N です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f","emph":["F"]},{"text":"磁力は、〖磁極の強さと磁界の強さを掛けた物〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F","Tp","H"],"eq":[{"cont":false,"items":[["F = mH"]]}],"emphPre":["F","Tp","H"]},{"text":"磁界が強いほど、磁極が強いほど、大きな力が働きます。","at":{"強調":1.0},"after":[],"emph":["H","Tp"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"次は、2つの点の磁極 $m_1$、$m_2$ を、$r$ 離して置いた時です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"sw","emph":["Q1","Q2","R"]},{"text":"N 極どうしなので、退け合う力が働きます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ff","emph":["F1","F2"]},{"text":"磁力は、磁極の強さの積に比例し、〖距離の2乗に反比例〗します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}"]]}],"emphPre":["F1","F2","Q1","Q2","R"]},{"text":"$\\mu_0$ は真空中の透磁率です。決まった値です。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"これは、静電気のクーロンの法則と同じ形です。$q$ が $m$ に、$\\varepsilon_0$ が $\\mu_0$ に変わっただけです。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":3,"eq":[{"cont":false,"items":[["F = \\dfrac{q_1 q_2}{4 \\pi \\varepsilon_0 r^2}"]]}],"emph":["F1","F2","Q1","Q2","R"]},{"text":"これを、〖磁気に関するクーロンの法則〗といいます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え"],"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}"]]}],"ans":true}]}],"groups":{"Pl":["plb","plbt","plt0","plt1"],"Pr":["prb","prbt","prt0","prt1"],"Ml":["mlt0","mlt1"],"Mr":["mrt0","mrt1"],"H":["h0","h0:h","h1","h1:h","h2","h2:h","ht0","ht1"],"Tp":["tpc","tpm","tpmt","tpt0","tpt1"],"F":["fa","fa:h","ft0","ft1"],"Q1":["q1cx1","q1cx1:t","q1mx1","q1mtx1","q1tx10","q1tx11"],"Q2":["q2cx1","q2cx1:t","q2mx1","q2mtx1","q2tx10","q2tx11"],"F1":["f1ax1","f1ax1:h","f1tx10","f1tx11"],"F2":["f2ax1","f2ax1:h","f2tx10","f2tx11"],"R":["re1x1","re2x1","rdx1","rdx1:h","rdx1:h2","rtx10","rtx11"]},"moves":{"tp":{"to":{"tpd":1},"dur":0.6},"f":{"to":{"fd":1},"dur":0.8},"sw":{"to":{"t":1},"dur":0.6},"ff":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["磁界の中の磁極","2つの磁極","クーロンの法則と比べる"]}},{"id":"t19s2x","scene":"t19s2x","kind":"u19s2mg","lab":{"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}=500 A/m","ha":"right","tp":"{m}=4×10⁻³ Wb","tps":"N","f":["{F}","{F}=2 N"],"fa":"right"},"viewbox":"136 211 768 339","band":{"want":"磁極に働く磁力 $F$","known":"$H = 500\\,\\mathrm{A/m},\\;\\; m = 4 \\times 10^{-3}\\,\\mathrm{Wb}$","ans":"$F = 2\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"tpd":1,"fd":0,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"求めるのは、磁極に働く磁力 $F$ です。","at":{"強調":1.0},"after":[],"emph":["F"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁界の中の磁極に働く力は、〖磁極の強さと磁界の強さを掛けた物〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"f","emph":["F","Tp","H"],"eq":[{"cont":false,"items":[["F = mH"]]}],"emphPre":["F","Tp","H"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"$m = 4 \\times 10^{-3}$、$H = 500$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["F","Tp","H"],"eq":[{"cont":false,"items":[["F = 4 \\times 10^{-3} \\times 500"],["= 2\\,\\mathrm{N}"]]}],"move":"fv","ans":true,"emphPre":["Tp","H","F"]}]}],"groups":{"Pl":["plb","plbt","plt0","plt1"],"Pr":["prb","prbt","prt0","prt1"],"Ml":["mlt0","mlt1"],"Mr":["mrt0","mrt1"],"H":["h0","h0:h","h1","h1:h","h2","h2:h","ht0","ht1"],"Tp":["tpc","tpm","tpmt","tpt0","tpt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"f":{"to":{"fd":1},"dur":0.8},"fv":{"to":{"fv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t19s3e","scene":"t19s3e","kind":"u19s3pr","lab":{"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":["{F}","{F}'"],"f1a":"out","f2":["{F}","{F}'"],"f2a":"out","med":"{μ}_r=4"},"viewbox":"96 218 818 384","band":{"want":"まわりの物質と磁力","ans":"$\\mu = \\mu_0 \\mu_r$、力は $\\dfrac{1}{\\mu_r}$ 倍","full":"磁気の力も、まわりの物質で変わる。真空中でない時は、μ0 の代わりに透磁率 μ を使う。μ = μ0 μr（μr は比透磁率）。真空中の透磁率は 4π × 10^-7 H/m。比透磁率 μr の物質の中では、力は真空中の 1/μr 倍。"},"narr":{"start":{"co":1,"f1d":1,"f2d":1,"medd":0,"fs":0,"f1v":0,"f2v":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"①透磁率\n②比透磁率\n③力の変わり方\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁気に関するクーロンの法則の $\\mu_0$ は、真空中の透磁率です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{m_1 m_2}{4 \\pi \\mu_0 r^2}"]]}],"emphPre":["F1","F2"]},{"text":"静電気と同じように、磁気の力も、まわりの物質によって変わります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"med","emph":["Med"]},{"text":"真空中でない時は、$\\mu_0$ の代わりに、〖まわりの物質の透磁率 $\\mu$〗を使います。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{m_1 m_2}{4 \\pi \\mu r^2}"]]}],"emphPre":["Med"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"透磁率は、〖真空中の透磁率 $\\mu_0$ に、比透磁率 $\\mu_r$ を掛けて〗求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Med"],"eq":[{"cont":false,"items":[["\\mu = \\mu_0 \\mu_r"]]}],"emphPre":["Med"]},{"text":"真空中の透磁率は $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ です。覚えなくても、問題文に書いてあります。","at":{"式":1.0},"after":[],"eq":[{"cont":false,"items":[["\\mu_0 = 4 \\pi \\times 10^{-7}"]]}]},{"text":"静電気の $\\varepsilon = \\varepsilon_0 \\varepsilon_r$ と同じ形です。","at":{"式":1.0},"after":[],"eq":[{"cont":false,"items":[["\\varepsilon = \\varepsilon_0 \\varepsilon_r"]]}]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"比透磁率が 4 の物質の中では、$\\mu$ は $\\mu_0$ の 4 倍です。透磁率は分母にあります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Med"],"eq":[{"cont":false,"items":[["\\mu = 4 \\mu_0"]]}],"emphPre":["Med"]},{"text":"力は真空中の $\\dfrac{1}{4}$ 倍になります。比透磁率 $\\mu_r$ の物質の中では、〖力は $\\dfrac{1}{\\mu_r}$ 倍〗です。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"fs","emph":["F1","F2","Med"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"med":{"to":{"medd":1},"dur":0.6},"fs":{"to":{"fs":1,"f1v":1,"f2v":1},"dur":0.8}},"route":["透磁率","比透磁率","力の変わり方"]}},{"id":"t19s3x","scene":"t19s3x","kind":"u19s3pr","lab":{"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":["{F}=12 N","{F}'"],"f1a":"out","f2":["{F}=12 N","{F}'"],"f2a":"out","med":"{μ}_r=4"},"viewbox":"96 218 818 384","band":{"want":"比透磁率 4 の物質の中での力 $F'$","known":"真空中で $F = 12\\,\\mathrm{N}$、$\\mu_r = 4$","ans":"$F' = 3\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"f1d":1,"f2d":1,"medd":0,"fs":0,"f1v":0,"f2v":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"求めるのは、比透磁率 4 の物質の中で働く力 $F'$ です。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]},{"text":"①透磁率の変わり方\n②力の変わり方\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"比透磁率が 4 なので、透磁率は真空中の 4 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"med","emph":["Med"],"eq":[{"cont":false,"items":[["\\mu = \\mu_0 \\mu_r = 4 \\mu_0"]]}],"emphPre":["Med"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖透磁率は分母にある〗ので、力は $\\dfrac{1}{4}$ 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"fs","emph":["F1","F2","Med"],"eq":[{"cont":false,"items":[["F' = 12 \\times \\dfrac{1}{4} = 3\\,\\mathrm{N}"]]}],"ans":true,"emphPre":["F1","F2","Med"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"med":{"to":{"medd":1},"dur":0.6},"fs":{"to":{"fs":1,"f1v":1,"f2v":1},"dur":0.8}},"route":["透磁率の変わり方","力の変わり方"]}},{"id":"t19s4e","scene":"t19s4e","kind":"u19s4sw","lab":{"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}","ea":"out","lk":"line","n":"","ball":""},"viewbox":"206 118 628 604","band":{"want":"点の磁極のまわりの磁界の強さ","ans":"$H = \\dfrac{m}{4 \\pi \\mu_0 r^2}$、磁力線は $\\dfrac{m}{\\mu}$ 本、その密度が $H$","full":"F = mH とクーロンの法則を比べ、m2 を除いた部分が磁界の強さ H = m /（4π μ0 r^2）。磁力線は m［Wb］の磁極から m/μ 本出る。磁力線の密度は磁界の強さと同じ。"},"narr":{"start":{"co":1,"t":0,"ed":0,"lnd":0,"balld":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"①2つの式を比べる\n②磁力線\n③磁力線の密度\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁極 $m_2$ に働く力は、$F = m_2 H$ でした。クーロンの法則と比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["Q","E"],"eq":[{"cont":false,"items":[["F = m_2 H","F = \\dfrac{m_1}{4 \\pi \\mu_0 r^2} \\times m_2"]]}]},{"text":"$m_2$ を除いた部分が、〖$m_1$ が $r$ 離れた点につくる磁界の強さ〗です。","at":{"強調":1.0},"after":[],"emph":["Q","Pp","R","E"]},{"text":"強さ $m$ の点の磁極から $r$ 離れた点の磁界の強さは、次の式です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"e","emph":["E","Q","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{m}{4 \\pi \\mu_0 r^2}"]]}],"emphPre":["E","Q","R"]},{"text":"これは、静電気の電界の強さと同じ関係です。","at":{},"after":[]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁力の様子を分かりやすく表した線を、磁力線といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"sw","emph":["Q"]},{"text":"強さ $m$ の磁極からは、〖$\\dfrac{m}{\\mu}$ 本の磁力線〗が出ます。透磁率に影響されます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"ln","emph":["Ln"],"eq":[{"cont":false,"items":[["\\dfrac{m}{\\mu}"]]}],"emphPre":["Ln"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"1 m² あたりの磁力線を、磁力線の密度といいます。〖これは磁界の強さと同じ〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Ln"]},{"text":"半径 $r$ の球の表面積は $4 \\pi r^2$ です。磁力線の本数を、この面積で割ります。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"ball","emph":["Ball","R","Ln"],"eq":[{"cont":false,"items":[["H = \\dfrac{m}{\\mu} \\times \\dfrac{1}{4 \\pi r^2} = \\dfrac{m}{4 \\pi \\mu r^2}"]]}],"ans":true,"emphPre":["Ball","R"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1","qcx1","qcx1:t","qmx1","qmtx1","qtx10","qtx11","ntx10","ntx11"],"Pp":["ppd","pt0","pt1","ppdx1","ptx10","ptx11"],"T":["tc","tc:t","tt0","tt1"],"E":["ea","ea:h","et0","et1"],"F":["fa","fa:h","ft0","ft1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1","rdx1","rdx1:h","rdx1:h2","rtx10","rtx11"],"Med":["medfx1","medtx10","medtx11"],"Surf":["surfx1","surftx10","surftx11"],"Ball":["ballx1","balltx10","balltx11"],"Ln":["ln0x1","ln0x1:h","ln1x1","ln1x1:h","ln2x1","ln2x1:h","ln3x1","ln3x1:h","ln4x1","ln4x1:h","ln5x1","ln5x1:h","ln6x1","ln6x1:h","ln7x1","ln7x1:h","ntx10","ntx11"]},"moves":{"e":{"to":{"ed":1},"dur":0.8},"sw":{"to":{"t":1},"dur":0.6},"ln":{"to":{"lnd":1},"dur":1.0},"ball":{"to":{"balld":1},"dur":0.8}},"route":["2つの式を比べる","磁力線","磁力線の密度"]}},{"id":"t19s4x","scene":"t19s4x","kind":"u19s4pe","lab":{"q":"{m}","qs":"N","p":"P","r":["{r}","2{r}"],"e":["{H}=400 A/m","{H}'"],"ea":"out"},"viewbox":"213 311 564 307","band":{"want":"距離を2倍にした点の磁界の強さ $H'$","known":"$H = 400\\,\\mathrm{A/m}$","ans":"$H' = 100\\,\\mathrm{A/m}$"},"narr":{"start":{"co":1,"ed":1,"rv":0,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"求めるのは、距離を2倍にした点の磁界の強さ $H'$ です。","at":{"強調":1.0},"after":[],"emph":["E"]},{"text":"①式を見る\n②変わり方\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁界の強さの式では、距離 $r$ が分母で2乗されています。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{m}{4 \\pi \\mu_0 r^2}"]]}],"emphPre":["E","R"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"距離が2倍になると、〖分母は $2^2 = 4$ 倍〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"r","emph":["R"]},{"text":"磁界の強さは $\\dfrac{1}{4}$ 倍になります。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["E","R"],"eq":[{"cont":false,"items":[["H' = 400 \\times \\dfrac{1}{4} = 100\\,\\mathrm{A/m}"]]}],"ans":true,"emphPre":["E","R"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pp":["ppd","pt0","pt1"],"T":["tc","tc:t","tt0","tt1"],"E":["ea","ea:h","et0","et1"],"F":["fa","fa:h","ft0","ft1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"r":{"to":{"rv":1,"ev":1},"dur":0.8}},"route":["式を見る","変わり方"]}},{"id":"t19s5e","scene":"t19s5e","kind":"u19s5sw","lab":{"q":"{m}","qs":"N","lk":"flux","n":"{m} Wb","phi":"{Φ}","s":"{S}","b":"{B}"},"viewbox":"123 56 888 666","band":{"want":"磁束と磁束密度","ans":"$m$［Wb］の磁極から $m$［Wb］の磁束、$B = \\dfrac{\\Phi}{S}$［T］、$B = \\mu H$","full":"磁束は磁界の様子を表す線で、N から出て S に入る。m［Wb］の磁極から m［Wb］の磁束が出る。透磁率に影響されない。1 m² あたりの磁束が磁束密度 B［T］。B = Φ/S、T = Wb/m²。B = μH。"},"narr":{"start":{"co":1,"t":0,"lnd":0,"phid":0,"sd":0,"bd":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"①磁束\n②磁束密度\n③磁界の強さとの関係\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁界の様子を表すために考えた線を、磁束といいます。N 極から出て、S 極に入ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"ln","emph":["Q","Ln"]},{"text":"強さ $m$［Wb］の磁極からは、$m$［Wb］の磁束が出ます。静電気の電束と同じです。","at":{"強調":1.0},"after":[],"emph":["Q","Ln"]},{"text":"〖磁束は、透磁率に影響されません〗。透磁率に影響されるのは、磁力線の方です。","at":{"強調":1.0},"after":[],"emph":["Ln"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁束は $\\Phi$ で表します。単位は Wb です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"sw","emph":["Phi"]},{"text":"1 m² あたりを通る磁束を、磁束密度といいます。$B$ で表し、単位は T（テスラ）です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"s","emph":["Phi","S"]},{"text":"〖磁束を面積 $S$ で割る〗と、磁束密度です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"b","emph":["B","Phi","S"],"eq":[{"cont":false,"items":[["B = \\dfrac{\\Phi}{S}"],["\\Phi = BS"]]}],"emphPre":["B","Phi","S"]},{"text":"Wb を m² で割るので、T は Wb/m² と同じです。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["B"],"eq":[{"cont":false,"items":[["\\mathrm{T} = \\mathrm{Wb/m^2}"]]}]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁極の強さ $m$ と、出る磁束 $\\Phi$ は同じと考えられます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Phi"]},{"text":"すると、磁束密度は、〖磁界の強さに透磁率を掛けた物〗になります。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["B"],"eq":[{"cont":false,"items":[["B = \\mu H"]]}],"ans":true,"emphPre":["B"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"],"S":["sfx1","stx10","stx11"],"Phi":["ph0x1","ph0x1:h","ph1x1","ph1x1:h","ph2x1","ph2x1:h","ph3x1","ph3x1:h","ph4x1","ph4x1:h","phitx10","phitx11"],"B":["bqx1","btx10","btx11"],"Mu":["mutx10","mutx11"],"H":["htx10","htx11"]},"moves":{"ln":{"to":{"lnd":1},"dur":1.0},"sw":{"to":{"t":1},"dur":0.6},"s":{"to":{"sd":1,"phid":1},"dur":0.8},"b":{"to":{"bd":1},"dur":0.6}},"route":["磁束","磁束密度","磁界の強さとの関係"]}},{"id":"t19s5x","scene":"t19s5x","kind":"u19s5sh","lab":{"phi":"{Φ}=0.02 Wb","s":"{S}=0.04 m²","b":["{B}","{B}=0.5 T"]},"viewbox":"123 150 886 562","band":{"want":"磁束密度 $B$","known":"$\\Phi = 0.02\\,\\mathrm{Wb},\\;\\; S = 0.04\\,\\mathrm{m^2}$","ans":"$B = 0.5\\,\\mathrm{T}$"},"narr":{"start":{"co":1,"sd":1,"phid":1,"bd":0,"bv":0},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"求めるのは、磁束密度 $B$ です。","at":{"強調":1.0},"after":[],"emph":["B"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁束密度は、1 m² あたりの磁束です。〖磁束を面積で割ります〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"b","emph":["B","Phi","S"],"eq":[{"cont":false,"items":[["B = \\dfrac{\\Phi}{S}"]]}],"emphPre":["B","Phi","S"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"$\\Phi = 0.02$、$S = 0.04$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["B","Phi","S"],"eq":[{"cont":false,"items":[["B = \\dfrac{0.02}{0.04}"],["= 0.5\\,\\mathrm{T}"]]}],"move":"bv","ans":true,"emphPre":["Phi","S","B"]}]}],"groups":{"S":["sf","st0","st1"],"Phi":["ph0","ph0:h","ph1","ph1:h","ph2","ph2:h","ph3","ph3:h","ph4","ph4:h","phit0","phit1"],"B":["bq","bt0","bt1"],"Mu":["mut0","mut1"],"H":["ht0","ht1"]},"moves":{"b":{"to":{"bd":1},"dur":0.6},"bv":{"to":{"bv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}}],"secs":[{"ex":{"text":"図のように、左に S 極、右に N 極を向かい合わせて置いた。2つの磁極の間の磁界の向きはどれか。","fig":{"kind":"u19s1mg","L":{"pl":"S","pls":"S","pr":"N","prs":"N","h":"{H}"},"P":{}},"ch":[{"t":"右向き","v":"right","why":"磁界は N 極から S 極へ向かう"},{"t":"左向き","v":"left","why":""},{"t":"上向き","v":"up","why":"磁界は N 極から S 極へ向かう。N 極は右、S 極は左にある"},{"t":"向きは無い","v":"none","why":"磁界には向きがある（N 極から S 極へ）"}],"ans":1}},{"ex":{"text":"強さ $500\\,\\mathrm{A/m}$ の磁界の中に、強さ $4 \\times 10^{-3}\\,\\mathrm{Wb}$ の磁極を置いた。磁極に働く磁力の大きさは何 N か。","fig":{"kind":"u19s2mg","L":{"pl":"N","pls":"N","pr":"S","prs":"S","h":"{H}=500 A/m","ha":"right","tp":"{m}=4×10⁻³ Wb","tps":"N","f":"{F}","fa":"right"},"P":{}},"ch":[{"t":"$2000\\,\\mathrm{N}$","v":"2000","why":"$10^{-3}$ を掛けていない"},{"t":"$2\\,\\mathrm{N}$","v":"2","why":""},{"t":"$125000\\,\\mathrm{N}$","v":"125000","why":"磁界の強さを磁極の強さで割った"},{"t":"$500\\,\\mathrm{N}$","v":"500","why":"磁極の強さを掛けていない"}],"ans":1}},{"ex":{"text":"真空中で 2つの点の磁極の間に $12\\,\\mathrm{N}$ の磁力が働いていた。距離を変えずに、まわりを比透磁率 4 の物質にした。働く磁力の大きさは何 N になるか。","fig":{"kind":"u19s3pr","L":{"q1":"{m}_1","q1s":"N","q2":"{m}_2","q2s":"N","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out","med":"{μ}_r=4"},"P":{}},"ch":[{"t":"$48\\,\\mathrm{N}$","v":"48","why":"透磁率は分母にあるので、力は弱まる"},{"t":"$3\\,\\mathrm{N}$","v":"3","why":""},{"t":"$0.75\\,\\mathrm{N}$","v":"0.75","why":"比透磁率を2乗した"},{"t":"$12\\,\\mathrm{N}$","v":"12","why":"まわりの物質で力は変わる"}],"ans":1}},{"ex":{"text":"点の磁極から $r$ 離れた点の磁界の強さは $400\\,\\mathrm{A/m}$ だった。距離を $2r$ にした点の磁界の強さは何 A/m か。","fig":{"kind":"u19s4pe","L":{"q":"{m}","qs":"N","p":"P","r":"{r}","e":"{H}=400 A/m","ea":"out"},"P":{}},"ch":[{"t":"$200\\,\\mathrm{A/m}$","v":"200","why":"距離を2乗していない"},{"t":"$1600\\,\\mathrm{A/m}$","v":"1600","why":"距離は分母にあるので、磁界は弱まる"},{"t":"$100\\,\\mathrm{A/m}$","v":"100","why":""},{"t":"$800\\,\\mathrm{A/m}$","v":"800","why":"距離は分母にあり、2乗する"}],"ans":2}},{"ex":{"text":"面積 $0.04\\,\\mathrm{m^2}$ の面を、$0.02\\,\\mathrm{Wb}$ の磁束が通り抜けている。面の磁束密度は何 T か。","fig":{"kind":"u19s5sh","L":{"phi":"{Φ}=0.02 Wb","s":"{S}=0.04 m²","b":"{B}"},"P":{}},"ch":[{"t":"$0.0008\\,\\mathrm{T}$","v":"0.0008","why":"面積で割るところを掛けた"},{"t":"$2\\,\\mathrm{T}$","v":"2","why":"割る順が逆"},{"t":"$0.5\\,\\mathrm{T}$","v":"0.5","why":""},{"t":"$0.02\\,\\mathrm{T}$","v":"0.02","why":"面積で割っていない"}],"ans":2}}],"past":[]}};
});
