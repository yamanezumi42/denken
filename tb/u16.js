/* 単元16「電束と電気力線」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(16, function(H){
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
// ---- 16-1 電束 の図（※ textbook/gen/make_section.py が textbook/gen/data/u16_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U16S1K = {
  ln: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":236,"y":162,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[],"t":"F","x":270,"y":670,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[],"t":"F","x":650,"y":580,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":619.62,"y":491.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":601.23,"y":248.18,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[],"t":"F","x":826.83,"y":333.95,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[],"t":"F","x":697.37,"y":105.15,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU16s1ln(d, p, L){ tbFig_Draw(d, p, L, U16S1K.ln); }
// ---- 16-2 電気力線 の図（※ textbook/gen/make_section.py が textbook/gen/data/u16_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U16S2K = {
  ln: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":236,"y":90,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[],"t":"F","x":270,"y":670,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[],"t":"F","x":650,"y":580,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":619.62,"y":491.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":601.23,"y":248.18,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[],"t":"F","x":827.21,"y":372.57,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[],"t":"F","x":712.93,"y":89.59,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU16s2ln(d, p, L){ tbFig_Draw(d, p, L, U16S2K.ln); }
// ---- 16-3 電束密度と電気力線の密度 の図（※ textbook/gen/make_section.py が textbook/gen/data/u16_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U16S3K = {
  ln: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":236,"y":162,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[],"t":"F","x":270,"y":670,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[],"t":"F","x":618.89,"y":628.08,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":619.62,"y":671.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":601.23,"y":248.18,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[],"t":"F","x":826.83,"y":333.95,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[],"t":"F","x":720,"y":190,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU16s3ln(d, p, L){ tbFig_Draw(d, p, L, U16S3K.ln); }
// ---- 16-4 電気力線の性質 の図（※ textbook/gen/make_section.py が textbook/gen/data/u16_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U16S4K = {
  dp: {"vars":[],"items":[{"f":"ln","id":"ln0","pts":[[326,474.15],[339,499.09],[352,522.6],[365,544.69],[378,565.35],[391,584.59],[404,602.4],[417,618.79],[430,633.75],[443,647.29],[456,659.4],[469,670.09],[482,679.35],[495,687.19],[508,693.6],[521,698.59],[534,702.15],[547,704.29],[560,705],[573,704.29],[586,702.15],[599,698.59],[612,693.6],[625,687.19],[638,679.35],[651,670.09],[664,659.4],[677,647.29],[690,633.75],[703,618.79],[716,602.4],[729,584.59],[742,565.35],[755,544.69],[768,522.6],[781,499.09],[794,474.15]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh0","x0":544,"y0":705,"x1":574,"y1":705,"o":["lnd"],"vis":[],"t":"F"},{"f":"ln","id":"ln1","pts":[[326,456.1],[339,472.73],[352,488.4],[365,503.12],[378,516.9],[391,529.72],[404,541.6],[417,552.53],[430,562.5],[443,571.53],[456,579.6],[469,586.72],[482,592.9],[495,598.12],[508,602.4],[521,605.72],[534,608.1],[547,609.53],[560,610],[573,609.52],[586,608.1],[599,605.73],[612,602.4],[625,598.12],[638,592.9],[651,586.73],[664,579.6],[677,571.52],[690,562.5],[703,552.52],[716,541.6],[729,529.73],[742,516.9],[755,503.12],[768,488.4],[781,472.72],[794,456.1]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh1","x0":544,"y0":610,"x1":574,"y1":610,"o":["lnd"],"vis":[],"t":"F"},{"f":"ln","id":"ln2","pts":[[339,446.36],[352,454.2],[365,461.56],[378,468.45],[391,474.86],[404,480.8],[417,486.26],[430,491.25],[443,495.76],[456,499.8],[469,503.36],[482,506.45],[495,509.06],[508,511.2],[521,512.86],[534,514.05],[547,514.76],[560,515],[573,514.76],[586,514.05],[599,512.86],[612,511.2],[625,509.06],[638,506.45],[651,503.36],[664,499.8],[677,495.76],[690,491.25],[703,486.26],[716,480.8],[729,474.86],[742,468.45],[755,461.56],[768,454.2],[781,446.36]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh2","x0":544,"y0":515,"x1":574,"y1":515,"o":["lnd"],"vis":[],"t":"F"},{"f":"ln","id":"ln3","pts":[[339,420],[352,420],[365,420],[378,420],[391,420],[404,420],[417,420],[430,420],[443,420],[456,420],[469,420],[482,420],[495,420],[508,420],[521,420],[534,420],[547,420],[560,420],[573,420],[586,420],[599,420],[612,420],[625,420],[638,420],[651,420],[664,420],[677,420],[690,420],[703,420],[716,420],[729,420],[742,420],[755,420],[768,420],[781,420]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh3","x0":544,"y0":420,"x1":574,"y1":420,"o":["lnd"],"vis":[],"t":"F"},{"f":"ln","id":"ln4","pts":[[339,393.64],[352,385.8],[365,378.44],[378,371.55],[391,365.14],[404,359.2],[417,353.74],[430,348.75],[443,344.24],[456,340.2],[469,336.64],[482,333.55],[495,330.94],[508,328.8],[521,327.14],[534,325.95],[547,325.24],[560,325],[573,325.24],[586,325.95],[599,327.14],[612,328.8],[625,330.94],[638,333.55],[651,336.64],[664,340.2],[677,344.24],[690,348.75],[703,353.74],[716,359.2],[729,365.14],[742,371.55],[755,378.44],[768,385.8],[781,393.64]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh4","x0":544,"y0":325,"x1":574,"y1":325,"o":["lnd"],"vis":[],"t":"F"},{"f":"ln","id":"ln5","pts":[[326,383.9],[339,367.28],[352,351.6],[365,336.88],[378,323.1],[391,310.27],[404,298.4],[417,287.48],[430,277.5],[443,268.48],[456,260.4],[469,253.28],[482,247.1],[495,241.88],[508,237.6],[521,234.27],[534,231.9],[547,230.48],[560,230],[573,230.48],[586,231.9],[599,234.27],[612,237.6],[625,241.88],[638,247.1],[651,253.28],[664,260.4],[677,268.48],[690,277.5],[703,287.48],[716,298.4],[729,310.27],[742,323.1],[755,336.88],[768,351.6],[781,367.27],[794,383.9]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh5","x0":544,"y0":230,"x1":574,"y1":230,"o":["lnd"],"vis":[],"t":"F"},{"f":"ln","id":"ln6","pts":[[326,365.85],[339,340.91],[352,317.4],[365,295.31],[378,274.65],[391,255.41],[404,237.6],[417,221.21],[430,206.25],[443,192.71],[456,180.6],[469,169.91],[482,160.65],[495,152.81],[508,146.4],[521,141.41],[534,137.85],[547,135.71],[560,135],[573,135.71],[586,137.85],[599,141.41],[612,146.4],[625,152.81],[638,160.65],[651,169.91],[664,180.6],[677,192.71],[690,206.25],[703,221.21],[716,237.6],[729,255.41],[742,274.65],[755,295.31],[768,317.4],[781,340.91],[794,365.85]],"w":3,"o":["lnd"],"vis":[],"t":"F"},{"f":"ar","id":"lh6","x0":544,"y0":135,"x1":574,"y1":135,"o":["lnd"],"vis":[],"t":"F"},{"f":"c","id":"qac","cx":300,"cy":420,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[271.5,391.5],[328.5,391.5],[328.5,448.5],[271.5,448.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":300,"y":421,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[260,420,"end",[-1,0]],[300,496,"middle",[0,1]]],"need":"qa","vis":[],"t":"F","x":300,"y":496,"anc":"middle"},{"f":"c","id":"qbc","cx":820,"cy":420,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[791.5,391.5],[848.5,391.5],[848.5,448.5],[791.5,448.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":820,"y":421,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[860,420,"start",[1,0]],[820,496,"middle",[0,1]]],"need":"qb","vis":[],"t":"F","x":860,"y":420,"anc":"start"},{"f":"c","id":"ppd","cx":456,"cy":260.4,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[438,286.4,"end",[-1,1]],[466,296.4,"start",[0,1]]],"need":"p","vis":[],"t":"F","x":466,"y":296.4,"anc":"start"},{"f":"ar","id":"ea","x0":456,"y0":260.4,"x1":576.86,"y1":189.74,"w":4,"need":"e","gr":"ed","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[585.49,154.7,"start",[1,-1]],[486.43,195.07,"end",[-1,-1]]],"need":"e","vis":[],"t":"F","x":627.92,"y":112.27,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sf: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":236,"y":162,"anc":"start"},{"f":"ln","id":"surf","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[],"t":"F"},{"f":"lb","id":"surft","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[],"t":"F","x":309.6,"y":737.88,"anc":"end"},{"f":"ln","id":"ball","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[],"t":"F"},{"f":"lb","id":"ballt","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[],"t":"F","x":650,"y":580,"anc":"start"},{"f":"ar","id":"ln0","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln2","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln3","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln4","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln5","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln6","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"ln7","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":619.62,"y":491.12,"anc":"start"},{"f":"c","id":"ppd","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":622.44,"y":226.97,"anc":"start"},{"f":"c","id":"qc","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[],"t":"F","x":685.71,"y":304.24,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[],"t":"F","x":720,"y":190,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ds: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"ln0","pts":[[326,474.15],[339,499.09],[352,522.6],[365,544.69],[378,565.35],[391,584.59],[404,602.4],[417,618.79],[430,633.75],[443,647.29],[456,659.4],[469,670.09],[482,679.35],[495,687.19],[508,693.6],[521,698.59],[534,702.15],[547,704.29],[560,705],[573,704.29],[586,702.15],[599,698.59],[612,693.6],[625,687.19],[638,679.35],[651,670.09],[664,659.4],[677,647.29],[690,633.75],[703,618.79],[716,602.4],[729,584.59],[742,565.35],[755,544.69],[768,522.6],[781,499.09],[794,474.15]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh0","x0":544,"y0":705,"x1":574,"y1":705,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ln","id":"ln1","pts":[[326,456.1],[339,472.73],[352,488.4],[365,503.12],[378,516.9],[391,529.72],[404,541.6],[417,552.53],[430,562.5],[443,571.53],[456,579.6],[469,586.72],[482,592.9],[495,598.12],[508,602.4],[521,605.72],[534,608.1],[547,609.53],[560,610],[573,609.52],[586,608.1],[599,605.73],[612,602.4],[625,598.12],[638,592.9],[651,586.73],[664,579.6],[677,571.52],[690,562.5],[703,552.52],[716,541.6],[729,529.73],[742,516.9],[755,503.12],[768,488.4],[781,472.72],[794,456.1]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh1","x0":544,"y0":610,"x1":574,"y1":610,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ln","id":"ln2","pts":[[339,446.36],[352,454.2],[365,461.56],[378,468.45],[391,474.86],[404,480.8],[417,486.26],[430,491.25],[443,495.76],[456,499.8],[469,503.36],[482,506.45],[495,509.06],[508,511.2],[521,512.86],[534,514.05],[547,514.76],[560,515],[573,514.76],[586,514.05],[599,512.86],[612,511.2],[625,509.06],[638,506.45],[651,503.36],[664,499.8],[677,495.76],[690,491.25],[703,486.26],[716,480.8],[729,474.86],[742,468.45],[755,461.56],[768,454.2],[781,446.36]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh2","x0":544,"y0":515,"x1":574,"y1":515,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ln","id":"ln3","pts":[[339,420],[352,420],[365,420],[378,420],[391,420],[404,420],[417,420],[430,420],[443,420],[456,420],[469,420],[482,420],[495,420],[508,420],[521,420],[534,420],[547,420],[560,420],[573,420],[586,420],[599,420],[612,420],[625,420],[638,420],[651,420],[664,420],[677,420],[690,420],[703,420],[716,420],[729,420],[742,420],[755,420],[768,420],[781,420]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh3","x0":544,"y0":420,"x1":574,"y1":420,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ln","id":"ln4","pts":[[339,393.64],[352,385.8],[365,378.44],[378,371.55],[391,365.14],[404,359.2],[417,353.74],[430,348.75],[443,344.24],[456,340.2],[469,336.64],[482,333.55],[495,330.94],[508,328.8],[521,327.14],[534,325.95],[547,325.24],[560,325],[573,325.24],[586,325.95],[599,327.14],[612,328.8],[625,330.94],[638,333.55],[651,336.64],[664,340.2],[677,344.24],[690,348.75],[703,353.74],[716,359.2],[729,365.14],[742,371.55],[755,378.44],[768,385.8],[781,393.64]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh4","x0":544,"y0":325,"x1":574,"y1":325,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ln","id":"ln5","pts":[[326,383.9],[339,367.28],[352,351.6],[365,336.88],[378,323.1],[391,310.27],[404,298.4],[417,287.48],[430,277.5],[443,268.48],[456,260.4],[469,253.28],[482,247.1],[495,241.88],[508,237.6],[521,234.27],[534,231.9],[547,230.48],[560,230],[573,230.48],[586,231.9],[599,234.27],[612,237.6],[625,241.88],[638,247.1],[651,253.28],[664,260.4],[677,268.48],[690,277.5],[703,287.48],[716,298.4],[729,310.27],[742,323.1],[755,336.88],[768,351.6],[781,367.27],[794,383.9]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh5","x0":544,"y0":230,"x1":574,"y1":230,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ln","id":"ln6","pts":[[326,365.85],[339,340.91],[352,317.4],[365,295.31],[378,274.65],[391,255.41],[404,237.6],[417,221.21],[430,206.25],[443,192.71],[456,180.6],[469,169.91],[482,160.65],[495,152.81],[508,146.4],[521,141.41],[534,137.85],[547,135.71],[560,135],[573,135.71],[586,137.85],[599,141.41],[612,146.4],[625,152.81],[638,160.65],[651,169.91],[664,180.6],[677,192.71],[690,206.25],[703,221.21],[716,237.6],[729,255.41],[742,274.65],[755,295.31],[768,317.4],[781,340.91],[794,365.85]],"w":3,"o":["lnd"],"vis":[1],"t":"F"},{"f":"ar","id":"lh6","x0":544,"y0":135,"x1":574,"y1":135,"o":["lnd"],"vis":[1],"t":"F"},{"f":"c","id":"qac","cx":300,"cy":420,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[1],"t":"F"},{"f":"ln","id":"qam","pts":[[271.5,391.5],[328.5,391.5],[328.5,448.5],[271.5,448.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"qamt","x":300,"y":421,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[260,420,"end",[-1,0]],[300,496,"middle",[0,1]]],"need":"qa","vis":[1],"t":"F","x":300,"y":496,"anc":"middle"},{"f":"c","id":"qbc","cx":820,"cy":420,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[1],"t":"F"},{"f":"ln","id":"qbm","pts":[[791.5,391.5],[848.5,391.5],[848.5,448.5],[791.5,448.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[1],"t":"F"},{"f":"tx","id":"qbmt","x":820,"y":421,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[1],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[860,420,"start",[1,0]],[820,496,"middle",[0,1]]],"need":"qb","vis":[1],"t":"F","x":860,"y":420,"anc":"start"},{"f":"c","id":"ppd","cx":456,"cy":260.4,"r":8,"fill":"k","need":"p","vis":[1],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[438,286.4,"end",[-1,1]],[466,296.4,"start",[0,1]]],"need":"p","vis":[1],"t":"F","x":466,"y":296.4,"anc":"start"},{"f":"ar","id":"ea","x0":456,"y0":260.4,"x1":576.86,"y1":189.74,"w":4,"need":"e","gr":"ed","col":"#c2255c","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[585.49,154.7,"start",[1,-1]],[486.43,195.07,"end",[-1,-1]]],"need":"e","vis":[1],"t":"F","x":627.92,"y":112.27,"anc":"start"},{"f":"ln","id":"medfx1","pts":[[220,130],[820,130],[820,710],[220,710]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[2],"t":"F"},{"f":"lb","id":"medtx1","k":"med","bases":[[236,162,"start",[0,-1]],[804,678,"end",[0,1]]],"o":["medd"],"need":"med","vis":[2],"t":"F","x":236,"y":162,"anc":"start","n":"medx1"},{"f":"ln","id":"surfx1","pts":[[750.72,420],[759.39,438.7],[764.9,458.56],[766.55,478.98],[763.86,499.25],[756.64,518.52],[745.03,536],[729.47,550.96],[710.66,562.84],[689.51,571.35],[667.02,576.44],[644.19,578.36],[621.92,577.62],[600.9,574.9],[581.57,571.05],[564.09,566.92],[548.3,563.31],[533.8,560.86],[520,560],[506.2,560.86],[491.7,563.31],[475.91,566.92],[458.43,571.05],[439.1,574.9],[418.08,577.62],[395.81,578.36],[372.98,576.44],[350.49,571.35],[329.34,562.84],[310.53,550.96],[294.97,536],[283.36,518.52],[276.14,499.25],[273.45,478.98],[275.1,458.56],[280.61,438.7],[289.28,420],[300.25,402.83],[312.6,387.35],[325.47,373.46],[338.12,360.89],[350.03,349.24],[360.93,338],[370.79,326.72],[379.86,315.01],[388.57,302.65],[397.45,289.6],[407.11,276.05],[418.08,262.38],[430.77,249.15],[445.4,237],[461.97,226.64],[480.25,218.7],[499.79,213.7],[520,212],[540.21,213.7],[559.75,218.7],[578.03,226.64],[594.6,237],[609.23,249.15],[621.92,262.38],[632.89,276.05],[642.55,289.6],[651.43,302.65],[660.14,315.01],[669.21,326.72],[679.07,338],[689.97,349.24],[701.88,360.89],[714.53,373.46],[727.4,387.35],[739.75,402.83],[750.72,420]],"dash":1,"w":3,"o":["surfd"],"need":"surf","vis":[2],"t":"F"},{"f":"lb","id":"surftx1","k":"surf","bases":[[270,670,"end",[-1,1]],[770,670,"start",[1,1]]],"o":["surfd"],"need":"surf","vis":[2],"t":"F","x":309.6,"y":737.88,"anc":"end","n":"surfx1"},{"f":"ln","id":"ballx1","pts":[[680,420],[679.39,433.94],[677.57,447.78],[674.55,461.41],[670.35,474.72],[665.01,487.62],[658.56,500],[651.06,511.77],[642.57,522.85],[633.14,533.14],[622.85,542.57],[611.77,551.06],[600,558.56],[587.62,565.01],[574.72,570.35],[561.41,574.55],[547.78,577.57],[533.94,579.39],[520,580],[506.06,579.39],[492.22,577.57],[478.59,574.55],[465.28,570.35],[452.38,565.01],[440,558.56],[428.23,551.06],[417.15,542.57],[406.86,533.14],[397.43,522.85],[388.94,511.77],[381.44,500],[374.99,487.62],[369.65,474.72],[365.45,461.41],[362.43,447.78],[360.61,433.94],[360,420],[360.61,406.06],[362.43,392.22],[365.45,378.59],[369.65,365.28],[374.99,352.38],[381.44,340],[388.94,328.23],[397.43,317.15],[406.86,306.86],[417.15,297.43],[428.23,288.94],[440,281.44],[452.38,274.99],[465.28,269.65],[478.59,265.45],[492.22,262.43],[506.06,260.61],[520,260],[533.94,260.61],[547.78,262.43],[561.41,265.45],[574.72,269.65],[587.62,274.99],[600,281.44],[611.77,288.94],[622.85,297.43],[633.14,306.86],[642.57,317.15],[651.06,328.23],[658.56,340],[665.01,352.38],[670.35,365.28],[674.55,378.59],[677.57,392.22],[679.39,406.06],[680,420]],"dash":1,"w":3,"o":["balld"],"need":"ball","vis":[2],"t":"F"},{"f":"lb","id":"balltx1","k":"ball","bases":[[650,580,"start",[1,1]],[390,580,"end",[-1,1]]],"o":["balld"],"need":"ball","vis":[2],"t":"F","x":650,"y":580,"anc":"start","n":"ballx1"},{"f":"ar","id":"ln0x1","x0":564,"y0":420,"x1":770,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":564,"y0":420,"x1":770,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"+|":{"x0":564,"y0":420,"x1":770,"y1":420,"w":3,"col":""},"-|flux":{"x0":770,"y0":420,"x1":564,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""},"-|":{"x0":770,"y0":420,"x1":564,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln1x1","x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"+|":{"x0":551.11,"y0":451.11,"x1":696.78,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""},"-|":{"x0":696.78,"y0":596.78,"x1":551.11,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln2x1","x0":520,"y0":464,"x1":520,"y1":670,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":464,"x1":520,"y1":670,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"+|":{"x0":520,"y0":464,"x1":520,"y1":670,"w":3,"col":""},"-|flux":{"x0":520,"y0":670,"x1":520,"y1":464,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""},"-|":{"x0":520,"y0":670,"x1":520,"y1":464,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln3x1","x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"+|":{"x0":488.89,"y0":451.11,"x1":343.22,"y1":596.78,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""},"-|":{"x0":343.22,"y0":596.78,"x1":488.89,"y1":451.11,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln4x1","x0":476,"y0":420,"x1":270,"y1":420,"sel":["qs","lk"],"var":{"+|flux":{"x0":476,"y0":420,"x1":270,"y1":420,"w":7,"col":"#868e96"},"+|line":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"+|":{"x0":476,"y0":420,"x1":270,"y1":420,"w":3,"col":""},"-|flux":{"x0":270,"y0":420,"x1":476,"y1":420,"w":7,"col":"#868e96"},"-|line":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""},"-|":{"x0":270,"y0":420,"x1":476,"y1":420,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln5x1","x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"+|":{"x0":488.89,"y0":388.89,"x1":343.22,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""},"-|":{"x0":343.22,"y0":243.22,"x1":488.89,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln6x1","x0":520,"y0":376,"x1":520,"y1":170,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":520,"y0":376,"x1":520,"y1":170,"w":7,"col":"#868e96"},"+|line":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"+|":{"x0":520,"y0":376,"x1":520,"y1":170,"w":3,"col":""},"-|flux":{"x0":520,"y0":170,"x1":520,"y1":376,"w":7,"col":"#868e96"},"-|line":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""},"-|":{"x0":520,"y0":170,"x1":520,"y1":376,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"ln7x1","x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"no":["lnf"],"sel":["qs","lk"],"var":{"+|flux":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":7,"col":"#868e96"},"+|line":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"+|":{"x0":551.11,"y0":388.89,"x1":696.78,"y1":243.22,"w":3,"col":""},"-|flux":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":7,"col":"#868e96"},"-|line":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""},"-|":{"x0":696.78,"y0":243.22,"x1":551.11,"y1":388.89,"w":3,"col":""}},"dflt":"+|line","gr":"lnd","vis":[2],"t":"F"},{"f":"ar","id":"rdx1","x0":551.41,"y0":433.01,"x1":667.82,"y1":481.23,"two":1,"w":2,"need":"r","vis":[2],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[619.62,491.12,"start",[0,1]],[609.62,427.12,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":619.62,"y":491.12,"anc":"start","n":"rx1"},{"f":"c","id":"ppdx1","cx":581.23,"cy":272.18,"r":8,"fill":"k","need":"p","vis":[2],"t":"F"},{"f":"lb","id":"ptx1","k":"p","bases":[[601.23,248.18,"start",[1,-1]],[561.23,248.18,"end",[-1,-1]]],"need":"p","vis":[2],"t":"F","x":622.44,"y":226.97,"anc":"start","n":"px1"},{"f":"c","id":"qcx1","cx":520,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[2],"t":"F"},{"f":"ln","id":"qmx1","pts":[[491.5,391.5],[548.5,391.5],[548.5,448.5],[491.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[2],"t":"F"},{"f":"tx","id":"qmtx1","x":520,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[2],"t":"F"},{"f":"lb","id":"qtx1","k":"q","bases":[[604,380,"start",[1,-0.4]],[436,460,"end",[-1,0.4]],[604,460,"start",[1,0.4]]],"need":"q","vis":[2],"t":"F","x":826.83,"y":333.95,"anc":"start","n":"qx1"},{"f":"lb","id":"ntx1","k":"n","bases":[[720,190,"start",[1,-1]],[780,300,"start",[1,0]]],"need":"n","vis":[2],"t":"F","x":708.69,"y":178.69,"anc":"start","n":"nx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU16s4dp(d, p, L){ tbFig_Draw(d, p, L, U16S4K.dp); }
function tbU16s4sf(d, p, L){ tbFig_Draw(d, p, L, U16S4K.sf); }
function tbU16s4ds(d, p, L){ tbFig_Draw(d, p, L, U16S4K.ds); }
var KINDS = {u16s1ln: tbU16s1ln, u16s2ln: tbU16s2ln, u16s3ln: tbU16s3ln, u16s4dp: tbU16s4dp, u16s4sf: tbU16s4sf, u16s4ds: tbU16s4ds};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 16-1 の図は電流が流れないので載せない,
  // 16-2 の図は電流が流れないので載せない,
  // 16-3 の図は電流が流れないので載せない,
  // 16-4 の図は電流が流れないので載せない
};

// 16-1 電束 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u16_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU16s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU16s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU16s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU16s1_par(a, b){ return a * b / (a + b); }
function tbU16s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU16s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU16s1_Qnum(r){
  var gcd = tbU16s1_gcd, ratio = tbU16s1_ratio, par = tbU16s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var er = pick(r, [2,3,4,5,10,80]);
    var A = (q * er);
    var _c = choices(r, [{t: "$" + fmt(q) + "\\,\\mathrm{C}$", v: fmt(q)}, {t: "$\\dfrac{" + fmt(q) + "}{" + fmt(er) + "}\\,\\mathrm{C}$", v: fmt(q) + "/" + fmt(er), why: "電束は誘電率に影響されない（誘電率で割るのは電気力線）"}, {t: "$" + fmt(A) + "\\,\\mathrm{C}$", v: fmt(A), why: "電束は誘電率に影響されない"}, {t: "$0\\,\\mathrm{C}$", v: "0", why: "物質の中でも、電荷からは電束が出る"}]);
    return {form: "u16s1num", text: "比誘電率 " + fmt(er) + " の物質の中に、$" + fmt(q) + "\\,\\mathrm{C}$ の正の点電荷を置いた。この電荷から出る電束は何 C か。", fig: {kind: "u16s1ln", L: tbU16s1_fig({"q":"{Q}","qs":"+","lk":"flux","n":""}, [["q", "{Q}=" + fmt(q) + " C"], ["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q$［C］の電荷からは $Q$［C］の電束が出る。誘電率に影響されない", "電束は $" + fmt(q) + "\\,\\mathrm{C}$"], chk: {form: "u16s1num", p: {q: q}}};
  }
  throw new Error("u16s1num：条件に合う数字が見つからない");
}
function tbU16s1_Qneg(r){
  var gcd = tbU16s1_gcd, ratio = tbU16s1_ratio, par = tbU16s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [2,3,4,5,6,8,10]);
    var _c = choices(r, [{t: "$" + fmt(q) + "\\,\\mathrm{C}$ の電束が入る", v: "in"}, {t: "$" + fmt(q) + "\\,\\mathrm{C}$ の電束が出る", v: "out", why: "電束が出るのは正の電荷。負の電荷には入る"}, {t: "電束は出ることも入ることもない", v: "none", why: "負の電荷にも電束は入る"}, {t: "$1\\,\\mathrm{C}$ の電束が入る", v: "one", why: "電荷と同じ量の電束が入る"}]);
    return {form: "u16s1neg", text: "真空中に、$-" + fmt(q) + "\\,\\mathrm{C}$ の点電荷を置いた。電束について正しいものはどれか。", fig: {kind: "u16s1ln", L: tbU16s1_fig({"q":"{Q}","qs":"+","lk":"flux","n":""}, [["q", "-{Q}=" + fmt(q) + " C"], ["qs", "-"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["負の電荷には電束が入る。量は電荷と同じ", "$" + fmt(q) + "\\,\\mathrm{C}$ の電束が入る"], chk: {form: "u16s1neg", p: {q: q}}};
  }
  throw new Error("u16s1neg：条件に合う数字が見つからない");
}
function tbU16s1_Qunit(r){
  var gcd = tbU16s1_gcd, ratio = tbU16s1_ratio, par = tbU16s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mathrm{C}$", v: "own"}, {t: "$\\mathrm{N}$", v: "n", why: "N は力の単位"}, {t: "$\\mathrm{V}$", v: "v", why: "V は電位・電圧の単位"}, {t: "$\\mathrm{N/C}$", v: "nc", why: "N/C は電界の強さの単位"}]);
    return {form: "u16s1unit", text: "電束の単位は □ である。", fig: {kind: "u16s1ln", L: tbU16s1_fig({"q":"{Q}","qs":"+","lk":"flux","n":""}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q$［C］の電荷から $Q$［C］の電束が出るので、単位は C"], chk: {form: "u16s1unit", p: {}}};
  }
  throw new Error("u16s1unit：条件に合う数字が見つからない");
}
function tbU16s1_Qeps(r){
  var gcd = tbU16s1_gcd, ratio = tbU16s1_ratio, par = tbU16s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "変わらない", v: "own"}, {t: "増える", v: "up", why: "電束は誘電率に影響されない"}, {t: "減る", v: "down", why: "電束は誘電率に影響されない（誘電率で減るのは電気力線）"}, {t: "0 になる", v: "zero", why: "物質の中でも、電荷からは電束が出る"}]);
    return {form: "u16s1eps", text: "電荷のまわりの物質を変えて誘電率を大きくすると、電荷から出る電束は □ 。", fig: {kind: "u16s1ln", L: tbU16s1_fig({"q":"{Q}","qs":"+","lk":"flux","n":""}, [["med", "{ε}_r"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電束は誘電率に影響されない。電荷が決まれば決まる"], chk: {form: "u16s1eps", p: {}}};
  }
  throw new Error("u16s1eps：条件に合う数字が見つからない");
}
// 16-2 電気力線 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u16_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU16s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU16s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU16s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU16s2_par(a, b){ return a * b / (a + b); }
function tbU16s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU16s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU16s2_Qexpr(r){
  var gcd = tbU16s2_gcd, ratio = tbU16s2_ratio, par = tbU16s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(q) + "}{\\varepsilon}$ 本", v: "q/e"}, {t: "$" + fmt(q) + "$ 本", v: "q", why: fmt(q) + " は電束の量（C）。電気力線は誘電率で割る"}, {t: "$" + fmt(q) + " \\varepsilon$ 本", v: "qe", why: "誘電率は掛けずに割る"}, {t: "$\\dfrac{\\varepsilon}{" + fmt(q) + "}$ 本", v: "e/q", why: "電荷を誘電率で割る（逆）"}]);
    return {form: "u16s2expr", text: "誘電率 $\\varepsilon$ の物質の中に、$" + fmt(q) + "\\,\\mathrm{C}$ の正の点電荷を置いた。この電荷から出る電気力線の本数はいくつか。", fig: {kind: "u16s2ln", L: tbU16s2_fig({"q":"{Q}","qs":"+","lk":"line","n":""}, [["q", "{Q}=" + fmt(q) + " C"], ["med", "{ε}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q$［C］の電荷からは $\\dfrac{Q}{\\varepsilon}$ 本", "$\\dfrac{" + fmt(q) + "}{\\varepsilon}$ 本"], chk: {form: "u16s2expr", p: {q: q}}};
  }
  throw new Error("u16s2expr：条件に合う数字が見つからない");
}
function tbU16s2_Qratio(r){
  var gcd = tbU16s2_gcd, ratio = tbU16s2_ratio, par = tbU16s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,8,10,80]);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(er) + "}$ 倍", v: "1/" + fmt(er)}, {t: "$" + fmt(er) + "$ 倍", v: fmt(er), why: "誘電率で割るので、本数は減る"}, {t: "$1$ 倍（変わらない）", v: "1", why: "変わらないのは電束。電気力線は誘電率に影響される"}, {t: "$\\dfrac{1}{" + fmt(er * er) + "}$ 倍", v: "1/" + fmt(er * er), why: "比誘電率を2乗した"}]);
    return {form: "u16s2ratio", text: "点電荷のまわりを、真空中から比誘電率 " + fmt(er) + " の物質に変えた。電荷から出る電気力線の本数は元の何倍になるか。", fig: {kind: "u16s2ln", L: tbU16s2_fig({"q":"{Q}","qs":"+","lk":"line","n":""}, [["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["誘電率は真空中の " + fmt(er) + " 倍。本数は $\\dfrac{Q}{\\varepsilon}$ なので", "電気力線は $\\dfrac{1}{" + fmt(er) + "}$ 倍"], chk: {form: "u16s2ratio", p: {er: er}}};
  }
  throw new Error("u16s2ratio：条件に合う数字が見つからない");
}
function tbU16s2_Qcmp(r){
  var gcd = tbU16s2_gcd, ratio = tbU16s2_ratio, par = tbU16s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? '電気力線' : '電束');
    var oth = (k == 1 ? '電束' : '電気力線');
    var good = (k == 1 ? '減る' : '変わらない');
    var bad = (k == 1 ? '変わらない' : '減る');
    var why = (k == 1 ? '変わらないのは電束。電気力線は誘電率で割る' : '減るのは電気力線。電束は誘電率に影響されない');
    var rule = (k == 1 ? '電気力線は $\\dfrac{Q}{\\varepsilon}$ 本で、誘電率に影響される' : '電束は $Q$［C］で、誘電率に影響されない');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "増える", v: "up", why: "誘電率が大きいほど、増えることはない"}, {t: "0 になる", v: "zero", why: "物質の中でも、電荷から出る"}]);
    return {form: "u16s2cmp", text: "点電荷のまわりを、誘電率の大きい物質に変えた。電荷から出る" + String(nm) + "は □ 。", fig: {kind: "u16s2ln", L: tbU16s2_fig({"q":"{Q}","qs":"+","lk":"line","n":""}, [["lk", String(k == 1 ? 'line' : 'flux')], ["med", "{ε}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), String(nm) + "は" + String(good)], chk: {form: "u16s2cmp", p: {k: k}}};
  }
  throw new Error("u16s2cmp：条件に合う数字が見つからない");
}
// 16-3 電束密度と電気力線の密度 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u16_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU16s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU16s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU16s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU16s3_par(a, b){ return a * b / (a + b); }
function tbU16s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU16s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU16s3_Qd(r){
  var gcd = tbU16s3_gcd, ratio = tbU16s3_ratio, par = tbU16s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [4,8,12,16,20,24,32,36,40,48,64,72,80,100]);
    var d = pick(r, [1,2,3,4,5]);
    var m = (q / (4 * d * d));
    var A = (q / (4 * d));
    var B = (q / (d * d));
    if (!(Number.isInteger(m) && nice(A) && nice(B) && d >= 2 && distinct([m, A, B, q]))) continue;
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(m) + "}{\\pi}\\,\\mathrm{C/m^2}$", v: fmt(m) + "/pi"}, {t: "$\\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{C/m^2}$", v: fmt(A) + "/pi", why: "半径を2乗していない"}, {t: "$\\dfrac{" + fmt(B) + "}{\\pi}\\,\\mathrm{C/m^2}$", v: fmt(B) + "/pi", why: "表面積の 4 を掛けていない"}, {t: "$" + fmt(q) + "\\,\\mathrm{C/m^2}$", v: fmt(q), why: "電束を面積で割っていない"}]);
    return {form: "u16s3d", text: "$" + fmt(q) + "\\,\\mathrm{C}$ の点電荷を真ん中に置いた、半径 $" + fmt(d) + "\\,\\mathrm{m}$ の球の表面の電束密度は何 $\\mathrm{C/m^2}$ か。", fig: {kind: "u16s3ln", L: tbU16s3_fig({"q":"{Q}","qs":"+","lk":"flux","n":"","ball":"","r":"{r}"}, [["q", "{Q}=" + fmt(q) + " C"], ["r", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["表面積 $4 \\pi r^2 = 4 \\pi \\times " + fmt(d) + "^2 = " + fmt(4 * d * d) + " \\pi\\,\\mathrm{m^2}$", "$D = \\dfrac{" + fmt(q) + "}{" + fmt(4 * d * d) + " \\pi} = \\dfrac{" + fmt(m) + "}{\\pi}\\,\\mathrm{C/m^2}$"], chk: {form: "u16s3d", p: {q: q, d: d}}};
  }
  throw new Error("u16s3d：条件に合う数字が見つからない");
}
function tbU16s3_Qrel(r){
  var gcd = tbU16s3_gcd, ratio = tbU16s3_ratio, par = tbU16s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$D = \\varepsilon E$", v: "own"}, {t: "$D = \\dfrac{E}{\\varepsilon}$", v: "div", why: "電気力線の密度に誘電率を掛けると電束密度"}, {t: "$E = \\varepsilon D$", v: "inv", why: "誘電率を掛けるのは電界の強さの方"}, {t: "$D = E$", v: "eq", why: "電束は誘電率で割らないので、$\\varepsilon$ の分だけ違う"}]);
    return {form: "u16s3rel", text: "電束密度 $D$ と電界の強さ $E$ の関係は □ である。ただし誘電率を $\\varepsilon$ とする。", fig: {kind: "u16s3ln", L: tbU16s3_fig({"q":"{Q}","qs":"+","lk":"flux","n":"","ball":"","r":"{r}"}, [["ball", "4π{r}²"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電気力線の密度＝電界の強さ $E$。これに誘電率を掛けると電束密度", "$D = \\varepsilon E$"], chk: {form: "u16s3rel", p: {}}};
  }
  throw new Error("u16s3rel：条件に合う数字が見つからない");
}
function tbU16s3_Qsame(r){
  var gcd = tbU16s3_gcd, ratio = tbU16s3_ratio, par = tbU16s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "電界の強さ", v: "own"}, {t: "電位", v: "v", why: "電位の式は $r$ が1乗で、密度の式と違う"}, {t: "電束密度", v: "d", why: "電束密度は、電気力線の密度に誘電率を掛けた物"}, {t: "電荷の量", v: "q", why: "電荷の量は、出る本数で決まる。密度は面積で割った物"}]);
    return {form: "u16s3same", text: "電気力線の密度は、その点の □ を表す。", fig: {kind: "u16s3ln", L: tbU16s3_fig({"q":"{Q}","qs":"+","lk":"flux","n":"","ball":"","r":"{r}"}, [["lk", "line"], ["ball", "4π{r}²"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電気力線の密度 $\\dfrac{Q}{4 \\pi \\varepsilon r^2}$ は、電界の強さの式と同じ", "電気力線の密度＝電界の強さ"], chk: {form: "u16s3same", p: {}}};
  }
  throw new Error("u16s3same：条件に合う数字が見つからない");
}
// 16-4 電気力線の性質 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u16_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU16s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU16s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU16s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU16s4_par(a, b){ return a * b / (a + b); }
function tbU16s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU16s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU16s4_Qcount(r){
  var gcd = tbU16s4_gcd, ratio = tbU16s4_ratio, par = tbU16s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q1 = pick(r, [1,2,3,4,5,6]);
    var q2 = pick(r, [2,3,4,5,6,8,9,10,12]);
    var n1 = pick(r, [2,4,6,8,10,12,18,20,24]);
    var n2 = (n1 * q2 / q1);
    var A = (n1 + q2 - q1);
    var B = (n1 * q1 / q2);
    if (!(q1 != q2 && Number.isInteger(n2) && Number.isInteger(B) && n2 <= 60 && A > 0 && distinct([n2, n1, A, B]))) continue;
    var _c = choices(r, [{t: fmt(n2) + " 本", v: fmt(n2)}, {t: fmt(n1) + " 本", v: fmt(n1), why: "本数は中の電荷の量に比例する"}, {t: fmt(A) + " 本", v: fmt(A), why: "電荷の差を、そのまま本数に足した"}, {t: fmt(B) + " 本", v: fmt(B), why: "比を逆にした（反比例ではなく比例）"}]);
    return {form: "u16s4count", text: "閉じた面の中に $" + fmt(q1) + "\\,\\mathrm{C}$ の電荷があり、面から外へ " + fmt(n1) + " 本の電気力線が出ていた。中の電荷を $" + fmt(q2) + "\\,\\mathrm{C}$ にすると、面から外へ出る電気力線の本数はいくつになるか。", fig: {kind: "u16s4sf", L: tbU16s4_fig({"q":"{Q}","qs":"+","lk":"line","n":"","surf":"閉じた面"}, [["q", "{Q}=" + fmt(q1) + " C"], ["n", fmt(n1) + " 本"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["閉じた面から出る本数は、中の電荷の量に比例する", "$" + fmt(n1) + " \\times \\dfrac{" + fmt(q2) + "}{" + fmt(q1) + "} = " + fmt(n2) + "$　答えは " + fmt(n2) + " 本"], chk: {form: "u16s4count", p: {q1: q1, q2: q2, n1: n1}}};
  }
  throw new Error("u16s4count：条件に合う数字が見つからない");
}
function tbU16s4_Qtrue(r){
  var gcd = tbU16s4_gcd, ratio = tbU16s4_ratio, par = tbU16s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1,2,3,4,5]);
    var j1 = pick(r, [0,1,2,3,4,5,6]);
    var j2 = pick(r, [0,1,2,3,4,5,6]);
    var j3 = pick(r, [0,1,2,3,4,5,6]);
    var T = (['正の電荷から出て、負の電荷に入る', '途中で分かれたり、ほかの電気力線と交わったりしない', 'その点の密度は、その点の電界の強さを表す', 'その点の接線の向きは、その点の電界の向きと同じ', '同じ向きの電気力線どうしは、反発し合う', '閉じた面から外へ出る本数は、面の中の電荷の量に比例する']);
    var FS = (['負の電荷から出て、正の電荷に入る', '途中で分かれることがある', 'ほかの電気力線と交わることがある', 'その点の密度は、その点の電位を表す', 'その点の接線と直角の向きが、その点の電界の向き', '同じ向きの電気力線どうしは、引き合う', '閉じた面から外へ出る本数は、面の大きさに比例する']);
    var FW = (['正の電荷から出て、負の電荷に入る', '電気力線は途中で分かれない', '電気力線はほかの電気力線と交わらない', '密度が表すのは電界の強さ', '接線の向きが電界の向き', '同じ向きの電気力線どうしは反発し合う', '比例するのは面の中の電荷の量']);
    var tk = (T[k]);
    var s1 = (FS[j1]);
    var w1 = (FW[j1]);
    var s2 = (FS[j2]);
    var w2 = (FW[j2]);
    var s3 = (FS[j3]);
    var w3 = (FW[j3]);
    if (!(j1 < j2 && j2 < j3)) continue;
    var _c = choices(r, [{t: String(tk), v: fmt(k)}, {t: String(s1), v: "f" + fmt(j1), why: String(w1)}, {t: String(s2), v: "f" + fmt(j2), why: String(w2)}, {t: String(s3), v: "f" + fmt(j3), why: String(w3)}]);
    return {form: "u16s4true", text: "電気力線の性質として、正しいものはどれか。", fig: {kind: "u16s4dp", L: tbU16s4_fig({"q":"{Q}","qs":"+","lk":"line","n":"","surf":"閉じた面"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電気力線は、" + String(tk)], chk: {form: "u16s4true", p: {k: k}}};
  }
  throw new Error("u16s4true：条件に合う数字が見つからない");
}
function tbU16s4_Qfalse(r){
  var gcd = tbU16s4_gcd, ratio = tbU16s4_ratio, par = tbU16s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var j = pick(r, [0,1,2,3,4,5,6]);
    var k1 = pick(r, [0,1,2,3,4,5]);
    var k2 = pick(r, [0,1,2,3,4,5]);
    var k3 = pick(r, [0,1,2,3,4,5]);
    var T = (['正の電荷から出て、負の電荷に入る', '途中で分かれたり、ほかの電気力線と交わったりしない', 'その点の密度は、その点の電界の強さを表す', 'その点の接線の向きは、その点の電界の向きと同じ', '同じ向きの電気力線どうしは、反発し合う', '閉じた面から外へ出る本数は、面の中の電荷の量に比例する']);
    var FS = (['負の電荷から出て、正の電荷に入る', '途中で分かれることがある', 'ほかの電気力線と交わることがある', 'その点の密度は、その点の電位を表す', 'その点の接線と直角の向きが、その点の電界の向き', '同じ向きの電気力線どうしは、引き合う', '閉じた面から外へ出る本数は、面の大きさに比例する']);
    var FW = (['正の電荷から出て、負の電荷に入る', '電気力線は途中で分かれない', '電気力線はほかの電気力線と交わらない', '密度が表すのは電界の強さ', '接線の向きが電界の向き', '同じ向きの電気力線どうしは反発し合う', '比例するのは面の中の電荷の量']);
    var fj = (FS[j]);
    var wj = (FW[j]);
    var t1 = (T[k1]);
    var t2 = (T[k2]);
    var t3 = (T[k3]);
    if (!(k1 < k2 && k2 < k3)) continue;
    var _c = choices(r, [{t: String(fj), v: "f" + fmt(j)}, {t: String(t1), v: fmt(k1), why: "正しい性質"}, {t: String(t2), v: fmt(k2), why: "正しい性質"}, {t: String(t3), v: fmt(k3), why: "正しい性質"}]);
    return {form: "u16s4false", text: "電気力線の性質として、誤っているものはどれか。", fig: {kind: "u16s4dp", L: tbU16s4_fig({"q":"{Q}","qs":"+","lk":"line","n":"","surf":"閉じた面"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["「" + String(fj) + "」は誤り。" + String(wj)], chk: {form: "u16s4false", p: {j: j}}};
  }
  throw new Error("u16s4false：条件に合う数字が見つからない");
}
function tbU16s4_Qtan(r){
  var gcd = tbU16s4_gcd, ratio = tbU16s4_ratio, par = tbU16s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "P での電気力線の接線の向き", v: "own"}, {t: "P での電気力線と直角の向き", v: "perp", why: "接線の向きが電界の向き"}, {t: "P から正の電荷へ向かう向き", v: "toq", why: "+1 C は正の電荷から退けられる。向きは接線の向き"}, {t: "決まらない", v: "unk", why: "接線の向きで決まる"}]);
    return {form: "u16s4tan", text: "電気力線の上の点 P の電界の向きは、□ である。", fig: {kind: "u16s4dp", L: tbU16s4_fig({"q":"{Q}","qs":"+","lk":"line","n":"","surf":"閉じた面"}, [["e", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["その点の接線の向きが、その点の電界の向き"], chk: {form: "u16s4tan", p: {}}};
  }
  throw new Error("u16s4tan：条件に合う数字が見つからない");
}
var GEN = {
  // 16-1 電束
  1: function(r){ return pick(r, [tbU16s1_Qnum, tbU16s1_Qnum, tbU16s1_Qnum, tbU16s1_Qneg, tbU16s1_Qneg, tbU16s1_Qunit, tbU16s1_Qeps])(r); },
  // 16-2 電気力線
  2: function(r){ return pick(r, [tbU16s2_Qexpr, tbU16s2_Qexpr, tbU16s2_Qratio, tbU16s2_Qratio, tbU16s2_Qratio, tbU16s2_Qcmp, tbU16s2_Qcmp])(r); },
  // 16-3 電束密度と電気力線の密度
  3: function(r){ return pick(r, [tbU16s3_Qd, tbU16s3_Qd, tbU16s3_Qd, tbU16s3_Qd, tbU16s3_Qrel, tbU16s3_Qrel, tbU16s3_Qsame, tbU16s3_Qsame])(r); },
  // 16-4 電気力線の性質
  4: function(r){ return pick(r, [tbU16s4_Qcount, tbU16s4_Qcount, tbU16s4_Qcount, tbU16s4_Qtrue, tbU16s4_Qtrue, tbU16s4_Qtrue, tbU16s4_Qfalse, tbU16s4_Qfalse, tbU16s4_Qfalse, tbU16s4_Qtan])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t16s1e","scene":"t16s1e","kind":"u16s1ln","lab":{"q":"{Q}","qs":"+","lk":"flux","n":"{Q} C"},"viewbox":"206 71 771 651","band":{"want":"電束","ans":"$Q$［C］の電荷から $Q$［C］の電束が出る","full":"電束は、電界の様子を表すために考えた線。+Q［C］の電荷からは Q［C］の電束が出て、-Q［C］の電荷には Q［C］の電束が入る。単位は C。電束は誘電率に影響されない。"},"narr":{"start":{"co":1,"lnd":0,"medd":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①考えた線\n②出る量\n③誘電率\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電束は、〖電界の様子を表すために考えた線〗です。本当に見えるわけではありません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"ln","emph":["Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"+$Q$［C］の電荷からは、〖$Q$［C］の電束〗が出ます。電荷と同じ量です。単位も C です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Q","Ln"]},{"text":"負の電荷には、反対に電束が入ります。入る電束も、電荷と同じ量です。","at":{"強調":1.0},"after":[],"emph":["Q","Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"まわりの物質を変えても、電束の量は変わりません。電束は、〖誘電率に影響されません〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"med","emph":["Med","Ln"]},{"text":"電荷が決まれば、電束の量も決まります。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Q","Ln"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"ln":{"to":{"lnd":1},"dur":1.0},"med":{"to":{"medd":1},"dur":0.6}},"route":["考えた線","出る量","誘電率"]}},{"id":"t16s1x","scene":"t16s1x","kind":"u16s1ln","lab":{"q":"{Q}=5 C","qs":"+","lk":"flux","n":["","電束 5 C"],"med":"水 {ε}_r=80"},"viewbox":"206 71 771 651","band":{"want":"水の中の 5 C の電荷から出る電束","known":"$Q = 5\\,\\mathrm{C}$、比誘電率 80","ans":"$5\\,\\mathrm{C}$"},"narr":{"start":{"co":1,"lnd":0,"medd":1,"nv":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、水の中に置いた 5 C の電荷から出る電束です。","at":{"強調":1.0},"after":[],"emph":["Q","Med"]},{"text":"①出る量\n②誘電率\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電荷から出る電束は、電荷と同じ量です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"ln","emph":["Q","Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電束は〖誘電率に影響されない〗ので、水の中でも同じです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Med","Ln"]},{"text":"答えは 5 C です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Ln"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"ln":{"to":{"lnd":1,"nv":1},"dur":1.0}},"route":["出る量","誘電率"]}},{"id":"t16s2e","scene":"t16s2e","kind":"u16s2ln","lab":{"q":"{Q}","qs":"+","lk":"line","n":"$\\dfrac{Q}{\\varepsilon}$ 本","med":"{ε}_r"},"viewbox":"206 42 1232 680","band":{"want":"電気力線の本数","ans":"$Q$［C］の電荷から $\\dfrac{Q}{\\varepsilon}$ 本","full":"電気力線はクーロン力の様子を分かりやすく表した線。Q［C］の電荷からは Q/ε 本出る。誘電率に影響される。"},"narr":{"start":{"co":1,"lnd":0,"medd":0,"lnf":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①電気力線\n②本数\n③電束との違い\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電気力線は、クーロン力の様子を分かりやすく表した線です。電束の1本1本が電気力線です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"ln","emph":["Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電荷 $Q$［C］から出る電気力線は、〖$\\dfrac{Q}{\\varepsilon}$ 本〗です。分母の $\\varepsilon$ は、まわりの物質の誘電率です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Q","Ln"],"eq":[{"cont":false,"items":[["\\dfrac{Q}{\\varepsilon}"]]}],"emphPre":["Q","Ln"]},{"text":"たとえば 10 C の電荷からは、$\\dfrac{10}{\\varepsilon}$ 本出ます。","at":{"強調":1.0},"after":[],"emph":["Q","Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"誘電率が大きい物質の中では、本数が減ります。電気力線は〖誘電率に影響されます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"med","emph":["Med","Ln"]},{"text":"クーロン力も物質で変わるので、それを表すために $\\varepsilon$ で割ると考えます。電束は誘電率に影響されないのと違います。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Ln","Med"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"ln":{"to":{"lnd":1},"dur":1.0},"med":{"to":{"medd":1,"lnf":1},"dur":0.8}},"route":["電気力線","本数","電束との違い"]}},{"id":"t16s2x","scene":"t16s2x","kind":"u16s2ln","lab":{"q":"{Q}=6 C","qs":"+","lk":"line","n":["","$\\dfrac{6}{\\varepsilon}$ 本"]},"viewbox":"206 42 1232 680","band":{"want":"6 C の電荷から出る電気力線の本数","known":"$Q = 6\\,\\mathrm{C}$、誘電率 $\\varepsilon$","ans":"$\\dfrac{6}{\\varepsilon}$ 本"},"narr":{"start":{"co":1,"lnd":0,"nv":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、6 C の電荷から出る電気力線の本数です。","at":{"強調":1.0},"after":[],"emph":["Q"]},{"text":"①式\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$Q$［C］の電荷からは $\\dfrac{Q}{\\varepsilon}$ 本出ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q","Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$Q = 6$ を入れて、$\\dfrac{6}{\\varepsilon}$ 本です。電束の 6 C と違い、〖誘電率で割ります〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"move":"ln","emph":["Q","Ln"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"ln":{"to":{"lnd":1,"nv":1},"dur":1.0}},"route":["式","数を入れる"]}},{"id":"t16s3e","scene":"t16s3e","kind":"u16s3ln","lab":{"q":"{Q}","qs":"+","lk":"flux","n":"{Q} C","ball":"4π{r}²","r":"{r}"},"viewbox":"206 118 787 604","band":{"want":"電束密度と電気力線の密度","ans":"$D = \\dfrac{Q}{4 \\pi r^2}$、電気力線の密度＝電界の強さ、$D = \\varepsilon E$","full":"1 m² あたりの電束が電束密度 D、1 m² あたりの電気力線が電気力線の密度。半径 r の球の表面では D = Q /（4πr²）、電気力線の密度 = Q /（4π ε r²）＝電界の強さ E。D = εE。"},"narr":{"start":{"co":1,"lnd":1,"balld":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①1 m² あたり\n②電束密度\n③電気力線の密度\n④$D = \\varepsilon E$\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"〖1 m² あたりを通る電束を電束密度〗、1 m² あたりを通る電気力線を電気力線の密度といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$Q$［C］の電荷を真ん中に置いて、半径 $r$ の球を考えます。球の表面の面積は $4 \\pi r^2$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"ball","emph":["Ball","R","Q"]},{"text":"表面を $Q$［C］の電束が通るので、面積で割ります。単位は $\\mathrm{C/m^2}$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Q","Ln","Ball"],"eq":[{"cont":false,"items":[["D = \\dfrac{Q}{4 \\pi r^2}"]]}],"emphPre":["Q","Ln","Ball"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電気力線は $\\dfrac{Q}{\\varepsilon}$ 本なので、同じように面積で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Q","Ln","Ball"],"eq":[{"cont":false,"items":[["\\dfrac{Q}{\\varepsilon} \\div 4 \\pi r^2 = \\dfrac{Q}{4 \\pi \\varepsilon r^2}"]]}],"emphPre":["Q","Ln","Ball"]},{"text":"これは電界の強さの式と同じです。〖電気力線の密度を、電界の強さ〗と決めたからです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Ln","Ball","Q"],"eq":[{"cont":false,"items":[["E = \\dfrac{Q}{4 \\pi \\varepsilon r^2}"]]}],"emphPre":["Ln","Ball","Q"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電気力線の密度 $E$ に〖誘電率 $\\varepsilon$ を掛けると、電束密度〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["Ln","Ball"],"eq":[{"cont":false,"items":[["D = \\varepsilon E"]]}],"ans":true,"emphPre":["Ln","Ball"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"ball":{"to":{"balld":1},"dur":0.8}},"route":["1 m² あたり","電束密度","電気力線の密度","$D = \\varepsilon E$"]}},{"id":"t16s3x","scene":"t16s3x","kind":"u16s3ln","lab":{"q":"{Q}=16 C","qs":"+","lk":"flux","n":"16 C","ball":["","4π×2²"],"r":"{r}=2 m"},"viewbox":"206 118 787 604","band":{"want":"半径 2 m の球の表面の電束密度 $D$","known":"$Q = 16\\,\\mathrm{C},\\;\\; r = 2\\,\\mathrm{m}$","ans":"$D = \\dfrac{1}{\\pi}\\,\\mathrm{C/m^2}$"},"narr":{"start":{"co":1,"lnd":1,"balld":1,"ballv":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、球の表面の電束密度 $D$ です。","at":{"強調":1.0},"after":[],"emph":["Ball"]},{"text":"①表面積\n②面積で割る\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ball"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"球の表面の面積は $4 \\pi r^2$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"s","emph":["Ball","R"],"eq":[{"cont":false,"items":[["4 \\pi \\times 2^2 = 16 \\pi\\,\\mathrm{m^2}"]]}],"emphPre":["Ball","R"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"〖16 C の電束が、この表面を通ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Q","Ln","Ball"],"eq":[{"cont":false,"items":[["D = \\dfrac{16}{16 \\pi} = \\dfrac{1}{\\pi}\\,\\mathrm{C/m^2}"]]}],"ans":true,"emphPre":["Q","Ln","Ball"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"s":{"to":{"ballv":1},"dur":0.5}},"route":["表面積","面積で割る"]}},{"id":"t16s4e","scene":"t16s4e","kind":"u16s4ds","lab":{"qa":"+","qas":"+","qb":"-","qbs":"-","p":"P","e":"{E}","q":"{Q}","qs":"+","lk":"line","n":"","surf":""},"viewbox":"136 76 843 698","band":{"want":"電気力線の性質","ans":"出る・入る、交わらない、密度＝電界の強さ、接線＝電界の向き、反発、本数は電荷に比例","full":"①正の電荷から出て負の電荷に入る ②分かれない・交わらない ③密度は電界の強さ ④接線の向きが電界の向き ⑤同じ向きどうしは反発 ⑥閉じた面から出る本数は中の電荷の量に比例。"},"narr":{"start":{"co":1,"t":0,"lnd":0,"ed":0,"surfd":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①出る・入る\n②交わらない\n③密度と接線\n④反発\n⑤閉じた面\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電気力線は、〖正の電荷から出て、負の電荷に入ります〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"ln","emph":["Qa","Qb","Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電気力線は、途中で分かれたり、ほかの電気力線と交わったりしません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電気力線の密度は、その点の電界の強さを表します。〖線が混んでいる所ほど、電界は強く〗なります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Ln"]},{"text":"点 P の〖接線の向きが、P の電界の向き〗です。P に +1 C を置くと、この向きに力を受けます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"e","emph":["Pp","E"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"同じ向きの電気力線どうしは、反発し合います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":4,"emph":["Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電荷を、閉じた面で囲みます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":5,"move":"sf","emph":["Surf","Q"]},{"text":"面から外へ出る電気力線の本数は、〖面の中の電荷の量に比例〗します。電荷が2倍なら、本数も2倍です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Surf","Ln","Q"],"ans":true}]}],"groups":{"Ln":["ln0","lh0","lh0:h","ln1","lh1","lh1:h","ln2","lh2","lh2:h","ln3","lh3","lh3:h","ln4","lh4","lh4:h","ln5","lh5","lh5:h","ln6","lh6","lh6:h","ln0x1","ln0x1:h","ln1x1","ln1x1:h","ln2x1","ln2x1:h","ln3x1","ln3x1:h","ln4x1","ln4x1:h","ln5x1","ln5x1:h","ln6x1","ln6x1:h","ln7x1","ln7x1:h","ntx10","ntx11"],"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Pp":["ppd","pt0","pt1","ppdx1","ptx10","ptx11"],"E":["ea","ea:h","et0","et1"],"Med":["medfx1","medtx10","medtx11"],"Surf":["surfx1","surftx10","surftx11"],"Ball":["ballx1","balltx10","balltx11"],"R":["rdx1","rdx1:h","rdx1:h2","rtx10","rtx11"],"Q":["qcx1","qcx1:t","qmx1","qmtx1","qtx10","qtx11","ntx10","ntx11"]},"moves":{"ln":{"to":{"lnd":1},"dur":1.0},"e":{"to":{"ed":1},"dur":0.6},"sf":{"to":{"t":1,"lnd":1,"surfd":1},"dur":0.8}},"route":["出る・入る","交わらない","密度と接線","反発","閉じた面"]}},{"id":"t16s4x","scene":"t16s4x","kind":"u16s4sf","lab":{"q":["{Q}=3 C","{Q}=5 C"],"qs":"+","lk":"line","n":["6 本","10 本"],"surf":"閉じた面"},"viewbox":"150 118 684 654","band":{"want":"5 C のとき閉じた面から出る本数","known":"3 C のとき 6 本","ans":"10 本"},"narr":{"start":{"co":1,"lnd":1,"surfd":1,"qv":0,"nv":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、中の電荷を 5 C にしたとき、閉じた面から出る電気力線の本数です。","at":{"強調":1.0},"after":[],"emph":["Surf","Ln"]},{"text":"①比例する\n②倍を出す\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"閉じた面から出る本数は、〖中の電荷の量に比例〗します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Surf","Q","Ln"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電荷が 3 C から 5 C になるので、$\\dfrac{5}{3}$ 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"q","emph":["Q"]},{"text":"本数も $\\dfrac{5}{3}$ 倍です。","at":{"式":1.0,"動き":1.0,"答え":1.0,"強調":1.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["6 \\times \\dfrac{5}{3} = 10"]]}],"move":"n","ans":true,"emph":["Q","Ln"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Surf":["surf","surft0","surft1"],"Ball":["ball","ballt0","ballt1"],"Ln":["ln0","ln0:h","ln1","ln1:h","ln2","ln2:h","ln3","ln3:h","ln4","ln4:h","ln5","ln5:h","ln6","ln6:h","ln7","ln7:h","nt0","nt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"Pp":["ppd","pt0","pt1"],"Q":["qc","qc:t","qm","qmt","qt0","qt1","nt0","nt1"]},"moves":{"q":{"to":{"qv":1},"dur":0.5},"n":{"to":{"nv":1},"dur":0.5}},"route":["比例する","倍を出す"]}}],"secs":[{"ex":{"text":"比誘電率 80 の水の中に、$5\\,\\mathrm{C}$ の正の点電荷を置いた。この電荷から出る電束は何 C か。","fig":{"kind":"u16s1ln","L":{"q":"{Q}=5 C","qs":"+","lk":"flux","n":"","med":"水 {ε}_r=80"},"P":{}},"ch":[{"t":"$\\dfrac{5}{80}\\,\\mathrm{C}$","v":"5/80","why":"電束は誘電率に影響されない（誘電率で割るのは電気力線）"},{"t":"$400\\,\\mathrm{C}$","v":"400","why":"電束は誘電率に影響されない"},{"t":"$5\\,\\mathrm{C}$","v":"5","why":""},{"t":"$1\\,\\mathrm{C}$","v":"1","why":"電荷1つから 1 C ではなく、電荷と同じ量が出る"}],"ans":2}},{"ex":{"text":"誘電率 $\\varepsilon$ の物質の中に、$6\\,\\mathrm{C}$ の正の点電荷を置いた。この電荷から出る電気力線の本数はいくつか。","fig":{"kind":"u16s2ln","L":{"q":"{Q}=6 C","qs":"+","lk":"line","n":"","med":"{ε}"},"P":{}},"ch":[{"t":"$6$ 本","v":"6","why":"6 は電束の量（C）。電気力線は誘電率で割る"},{"t":"$6 \\varepsilon$ 本","v":"6e","why":"誘電率は掛けずに割る"},{"t":"$\\dfrac{\\varepsilon}{6}$ 本","v":"e/6","why":"電荷を誘電率で割る（逆）"},{"t":"$\\dfrac{6}{\\varepsilon}$ 本","v":"6/e","why":""}],"ans":3}},{"ex":{"text":"$16\\,\\mathrm{C}$ の点電荷を真ん中に置いた、半径 $2\\,\\mathrm{m}$ の球の表面の電束密度は何 $\\mathrm{C/m^2}$ か。","fig":{"kind":"u16s3ln","L":{"q":"{Q}=16 C","qs":"+","lk":"flux","n":"","ball":"","r":"{r}=2 m"},"P":{}},"ch":[{"t":"$\\dfrac{2}{\\pi}\\,\\mathrm{C/m^2}$","v":"2/pi","why":"半径を2乗していない"},{"t":"$\\dfrac{4}{\\pi}\\,\\mathrm{C/m^2}$","v":"4/pi","why":"表面積の 4 を掛けていない"},{"t":"$\\dfrac{1}{\\pi}\\,\\mathrm{C/m^2}$","v":"1/pi","why":""},{"t":"$16\\,\\mathrm{C/m^2}$","v":"16","why":"電束を面積で割っていない"}],"ans":2}},{"ex":{"text":"閉じた面の中に $3\\,\\mathrm{C}$ の電荷があり、面から外へ 6 本の電気力線が出ていた。中の電荷を $5\\,\\mathrm{C}$ にすると、面から外へ出る電気力線の本数はいくつになるか。","fig":{"kind":"u16s4sf","L":{"q":"{Q}=3 C","qs":"+","lk":"line","n":"6 本","surf":"閉じた面"},"P":{}},"ch":[{"t":"6 本","v":"6","why":"本数は中の電荷の量に比例する"},{"t":"8 本","v":"8","why":"電荷の増えた 2 を、そのまま本数に足した"},{"t":"10 本","v":"10","why":""},{"t":"3.6 本","v":"3.6","why":"比を逆にした（反比例ではなく比例）"}],"ans":2}}],"past":[]}};
});
