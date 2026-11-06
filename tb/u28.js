/* 単元28「平均値と実効値」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(28, function(H){
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
// ---- 28-1 決まった値になる時刻 の図（※ textbook/gen/make_section.py が textbook/gen/data/u28_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U28S1K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU28s1wv(d, p, L){ tbFig_Draw(d, p, L, U28S1K.wv); }
// ---- 28-2 平均値 の図（※ textbook/gen/make_section.py が textbook/gen/data/u28_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U28S2K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU28s2wv(d, p, L){ tbFig_Draw(d, p, L, U28S2K.wv); }
// ---- 28-3 実効値 の図（※ textbook/gen/make_section.py が textbook/gen/data/u28_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U28S3K = {
  dc: {"vars":[],"items":[{"t":"z","id":"zbu28s3dc0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu28s3dc1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"L0:N"},{"t":"w","id":"u28s3dcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcx1L","pts":[[478,780],[478,980],[752,980]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcx1Rw","pts":[[772,980],[1045,980],[1045,780]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcx1w1","pts":[[478,780],[731.5,780]],"vis":[],"dash":0},{"t":"w","id":"u28s3dcx1w2","pts":[[791.5,780],[1045,780]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,605.96,null]},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,321.5,null]},{"t":"ac","k":"src","dir":"h","xp":752,"yp":980,"xm":772,"ym":980,"vis":[],"side":1,"loop":1,"lab":[770,1018.79,null],"f":"ac","n":"srcx1"},{"t":"r","k":"r","x":761.5,"y":780,"dir":"h","vis":[],"lab":[761.5,741.5,null],"n":"rx1"},{"t":"i","k":"i","x0":478,"y0":920,"x1":478,"y1":880,"lab":[494,900,"start"],"vis":[],"ax":"v","sd":1,"n":"ix1"}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:N",1,[]],["E","src","L1:P","L1:N",1,[]],["R","r","L1:P","L1:N",1,[]]]},
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  dw: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"z","id":"zbu28s3dw0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[1],"pts":[],"node":"L0:L0:P"},{"t":"z","id":"zbu28s3dw1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[1],"pts":[],"node":"L0:L0:N"},{"t":"w","id":"u28s3dwL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dwRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dww1","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dww2","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dwx1L","pts":[[478,780],[478,980],[752,980]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dwx1Rw","pts":[[772,980],[1045,980],[1045,780]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dwx1w1","pts":[[478,780],[731.5,780]],"vis":[1],"dash":0},{"t":"w","id":"u28s3dwx1w2","pts":[[791.5,780],[1045,780]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,618.4,null]},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,314.33,null]},{"t":"ac","k":"src","dir":"h","xp":752,"yp":980,"xm":772,"ym":980,"vis":[1],"side":1,"loop":1,"lab":[770,1018.79,null],"f":"ac","n":"srcx1"},{"t":"r","k":"r","x":761.5,"y":780,"dir":"h","vis":[1],"lab":[761.5,734.33,null],"n":"rx1"},{"t":"i","k":"i","x0":478,"y0":920,"x1":478,"y1":880,"lab":[494,900,"start"],"vis":[1],"ax":"v","sd":1,"n":"ix1"},{"f":"ln","id":"frmx1","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":200,"W":600,"Yc":420,"H":250,"vis":[2],"df":{}}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","L0:L0:P","L0:L0:N",1,[1]],["R","r","L0:L0:P","L0:L0:N",1,[1]],["E","src","L0:L1:P","L0:L1:N",1,[1]],["R","r","L0:L1:P","L0:L1:N",1,[1]]]}
};
function tbU28s3dc(d, p, L){ tbGen_Draw(d, p, L, U28S3K.dc); }
function tbU28s3wv(d, p, L){ tbFig_Draw(d, p, L, U28S3K.wv); }
function tbU28s3dw(d, p, L){ tbFig_Draw(d, p, L, U28S3K.dw); }
// ---- 28-4 波高率と波形率 の図（※ textbook/gen/make_section.py が textbook/gen/data/u28_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U28S4K = {
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sk: {"vars":[],"items":[{"f":"lb","id":"mt","k":"m","bases":[[420,260,"middle",[0,-1]]],"need":"m","vis":[],"t":"F","x":420,"y":260,"anc":"middle"},{"f":"lb","id":"rt","k":"r","bases":[[420,420,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":420,"y":420,"anc":"middle"},{"f":"lb","id":"at","k":"a","bases":[[420,580,"middle",[0,-1]]],"need":"a","vis":[],"t":"F","x":420,"y":580,"anc":"middle"},{"f":"ln","id":"b1","pts":[[250,340],[590,340]],"w":4,"o":["b1d"],"vis":[],"t":"F"},{"f":"ln","id":"b2","pts":[[250,500],[590,500]],"w":4,"o":["b2d"],"vis":[],"t":"F"},{"f":"ln","id":"brf1","pts":[[620,250],[636,264],[636,326],[650,340],[636,354],[636,416],[620,430]],"w":3,"o":["f1d"],"vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[666,340,"start",[1,0]]],"o":["f1d"],"need":"f1","vis":[],"t":"F","x":666,"y":340,"anc":"start"},{"f":"ln","id":"brf2","pts":[[680,410],[696,424],[696,486],[710,500],[696,514],[696,576],[680,590]],"w":3,"o":["f2d"],"vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[726,500,"start",[1,0]]],"o":["f2d"],"need":"f2","vis":[],"t":"F","x":726,"y":500,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ws: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[1],"df":{}},{"f":"lb","id":"mtx1","k":"m","bases":[[420,260,"middle",[0,-1]]],"need":"m","vis":[2],"t":"F","x":420,"y":260,"anc":"middle","n":"mx1"},{"f":"lb","id":"rtx1","k":"r","bases":[[420,420,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":420,"y":420,"anc":"middle","n":"rx1"},{"f":"lb","id":"atx1","k":"a","bases":[[420,580,"middle",[0,-1]]],"need":"a","vis":[2],"t":"F","x":420,"y":580,"anc":"middle","n":"ax1"},{"f":"ln","id":"b1x1","pts":[[250,340],[590,340]],"w":4,"o":["b1d"],"vis":[2],"t":"F"},{"f":"ln","id":"b2x1","pts":[[250,500],[590,500]],"w":4,"o":["b2d"],"vis":[2],"t":"F"},{"f":"ln","id":"brf1x1","pts":[[620,250],[636,264],[636,326],[650,340],[636,354],[636,416],[620,430]],"w":3,"o":["f1d"],"vis":[2],"t":"F"},{"f":"lb","id":"f1tx1","k":"f1","bases":[[666,340,"start",[1,0]]],"o":["f1d"],"need":"f1","vis":[2],"t":"F","x":666,"y":340,"anc":"start","n":"f1x1"},{"f":"ln","id":"brf2x1","pts":[[680,410],[696,424],[696,486],[710,500],[696,514],[696,576],[680,590]],"w":3,"o":["f2d"],"vis":[2],"t":"F"},{"f":"lb","id":"f2tx1","k":"f2","bases":[[726,500,"start",[1,0]]],"o":["f2d"],"need":"f2","vis":[2],"t":"F","x":726,"y":500,"anc":"start","n":"f2x1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU28s4wv(d, p, L){ tbFig_Draw(d, p, L, U28S4K.wv); }
function tbU28s4sk(d, p, L){ tbFig_Draw(d, p, L, U28S4K.sk); }
function tbU28s4ws(d, p, L){ tbFig_Draw(d, p, L, U28S4K.ws); }
// ---- 28-5 整流した波形 の図（※ textbook/gen/make_section.py が textbook/gen/data/u28_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U28S5K = {
  fw: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{"w1s":"abs"}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  hw: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{"w1s":"half"}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  fh: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[1],"df":{"w1s":"abs"}},{"f":"ln","id":"frmx1","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":200,"W":600,"Yc":420,"H":250,"vis":[2],"df":{"w1s":"half"}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU28s5fw(d, p, L){ tbFig_Draw(d, p, L, U28S5K.fw); }
function tbU28s5hw(d, p, L){ tbFig_Draw(d, p, L, U28S5K.hw); }
function tbU28s5fh(d, p, L){ tbFig_Draw(d, p, L, U28S5K.fh); }
var KINDS = {u28s1wv: tbU28s1wv, u28s2wv: tbU28s2wv, u28s3dc: tbU28s3dc, u28s3wv: tbU28s3wv, u28s3dw: tbU28s3dw, u28s4wv: tbU28s4wv, u28s4sk: tbU28s4sk, u28s4ws: tbU28s4ws, u28s5fw: tbU28s5fw, u28s5hw: tbU28s5hw, u28s5fh: tbU28s5fh};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 28-1 の図は電流が流れないので載せない,
  // 28-2 の図は電流が流れないので載せない,
  u28s3dc: function(p, L){ return tbGen_Flow(p, L, U28S3K.dc); },
  u28s3dw: function(p, L){ return tbGen_Flow(p, L, U28S3K.dw); },
  // 28-4 の図は電流が流れないので載せない,
  // 28-5 の図は電流が流れないので載せない
};

// 28-1 決まった値になる時刻 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u28_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU28s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU28s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU28s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU28s1_par(a, b){ return a * b / (a + b); }
function tbU28s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU28s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU28s1_Qq45(r){
  var gcd = tbU28s1_gcd, ratio = tbU28s1_ratio, par = tbU28s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,10,20,50,100]);
    var K = pick(r, [50,60,100,120,150,200,240,300,400,600]);
    var u = pick(r, [0,1]);
    var m = (4 * K);
    var m2 = (2 * K);
    var nm = (u == 0 ? 'v' : 'i');
    var un = (u == 0 ? 'V' : 'A');
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(m) + "}\\,\\mathrm{s}$", v: "1/" + fmt(m)}, {t: "$\\dfrac{3}{" + fmt(m) + "}\\,\\mathrm{s}$", v: "3/" + fmt(m), why: "135° の方。先に来るのは 45°"}, {t: "$\\dfrac{1}{" + fmt(m2) + "}\\,\\mathrm{s}$", v: "1/" + fmt(m2), why: "それは最大値になる時刻（90°）"}, {t: "$\\dfrac{\\pi}{4}\\,\\mathrm{s}$", v: "pi/4", why: "角度のまま。$" + fmt(K) + "\\pi$ で割って時刻にする"}]);
    return {form: "u28s1q45", text: "正弦波交流の" + String(u == 0 ? '電圧' : '電流') + "が $" + String(nm) + " = " + fmt(a) + "\\sqrt{2} \\sin " + fmt(K) + "\\pi t$［" + String(un) + "］で表される。$t = 0$ のあと、初めて $" + String(nm) + " = " + fmt(a) + "\\,\\mathrm{" + String(un) + "}$ になる時刻は何 s か。", fig: {kind: "u28s1wv", L: tbU28s1_fig({"ax":"{t}［s］","ay":"{i}［A］","w1":"{i}"}, [["ay", "{" + String(nm) + "}［" + String(un) + "］"], ["w1", "{" + String(nm) + "}"], ["y1", fmt(a) + "\\sqrt{2}"], ["lv1", fmt(a)], ["lv1at", 0.707], ["lv1a", 0], ["lv1b", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\sin$ が $\\dfrac{1}{\\sqrt{2}}$ になる先の角度は 45°（$\\dfrac{\\pi}{4}$）", "$" + fmt(K) + "\\pi t = \\dfrac{\\pi}{4}$ から $t = \\dfrac{1}{" + fmt(m) + "}\\,\\mathrm{s}$"], chk: {form: "u28s1q45", p: {K: K}}};
  }
  throw new Error("u28s1q45：条件に合う数字が見つからない");
}
function tbU28s1_Qq30(r){
  var gcd = tbU28s1_gcd, ratio = tbU28s1_ratio, par = tbU28s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,4,6,10,20,50,100]);
    var K = pick(r, [50,60,100,120,150,200,240,300,400,600]);
    var m = (6 * K);
    var m2 = (2 * K);
    var h = (a / 2);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(m) + "}\\,\\mathrm{s}$", v: "1/" + fmt(m)}, {t: "$\\dfrac{5}{" + fmt(m) + "}\\,\\mathrm{s}$", v: "5/" + fmt(m), why: "150° の方。先に来るのは 30°"}, {t: "$\\dfrac{1}{" + fmt(m2) + "}\\,\\mathrm{s}$", v: "1/" + fmt(m2), why: "それは最大値になる時刻（90°）"}, {t: "$\\dfrac{\\pi}{6}\\,\\mathrm{s}$", v: "pi/6", why: "角度のまま。$" + fmt(K) + "\\pi$ で割って時刻にする"}]);
    return {form: "u28s1q30", text: "正弦波交流の電圧が $v = " + fmt(a) + " \\sin " + fmt(K) + "\\pi t$［V］で表される。$t = 0$ のあと、初めて $v = " + fmt(h) + "\\,\\mathrm{V}$ になる時刻は何 s か。", fig: {kind: "u28s1wv", L: tbU28s1_fig({"ax":"{t}［s］","ay":"{i}［A］","w1":"{i}"}, [["ay", "{v}［V］"], ["w1", "{v}"], ["y1", fmt(a)], ["lv1", fmt(h)], ["lv1at", 0.5], ["lv1a", 0], ["lv1b", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\sin$ が 0.5 になる先の角度は 30°（$\\dfrac{\\pi}{6}$）", "$" + fmt(K) + "\\pi t = \\dfrac{\\pi}{6}$ から $t = \\dfrac{1}{" + fmt(m) + "}\\,\\mathrm{s}$"], chk: {form: "u28s1q30", p: {K: K}}};
  }
  throw new Error("u28s1q30：条件に合う数字が見つからない");
}
function tbU28s1_Qdeg(r){
  var gcd = tbU28s1_gcd, ratio = tbU28s1_ratio, par = tbU28s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "45° と 135°", v: "own"}, {t: "45° と 225°", v: "225", why: "225° では $\\sin$ の値は負"}, {t: "30° と 150°", v: "30", why: "それは $\\sin$ の値が 0.5 になる角度"}, {t: "60° と 120°", v: "60", why: "それは $\\sin$ の値が $\\dfrac{\\sqrt{3}}{2}$ になる角度"}]);
    return {form: "u28s1deg", text: "0° から 360° までで、$\\sin$ の値が $\\dfrac{1}{\\sqrt{2}}$ になる角度はどれか。", fig: {kind: "u28s1wv", L: tbU28s1_fig({"ax":"{t}［s］","ay":"{i}［A］","w1":"{i}"}, [["y1", "{I}_m"], ["lv1", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["正の山の上で、同じ値を2か所で通る", "45° と 135°"], chk: {form: "u28s1deg", p: {}}};
  }
  throw new Error("u28s1deg：条件に合う数字が見つからない");
}
// 28-2 平均値 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u28_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU28s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU28s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU28s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU28s2_par(a, b){ return a * b / (a + b); }
function tbU28s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU28s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU28s2_Qva(r){
  var gcd = tbU28s2_gcd, ratio = tbU28s2_ratio, par = tbU28s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [10,20,30,40,50,60,80,100,120,150,200]);
    var D = (2 * a);
    var H = (a / 2);
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(D) + "}{\\pi}\\,\\mathrm{V}$", v: fmt(D) + "/pi"}, {t: "$\\dfrac{" + fmt(a) + "}{\\pi}\\,\\mathrm{V}$", v: fmt(a) + "/pi", why: "負の半分を折り返さずに、山1つの面積を $2\\pi$ で割った"}, {t: "$" + fmt(H) + "\\pi\\,\\mathrm{V}$", v: fmt(H) + "pi", why: "割る順が逆（$\\pi$ で割る）"}, {t: "$0\\,\\mathrm{V}$", v: "0", why: "絶対値をとらずに平均すると、正と負が打ち消して 0 になる"}]);
    return {form: "u28s2va", text: "最大値 $" + fmt(a) + "\\,\\mathrm{V}$ の正弦波交流の電圧の平均値は何 V か。", fig: {kind: "u28s2wv", L: tbU28s2_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","x1":"π","x1at":0.5,"x2":"2π","x2at":1}, [["y1", fmt(a) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_a = \\dfrac{2V_m}{\\pi}$", "$V_a = \\dfrac{2 \\times " + fmt(a) + "}{\\pi} = \\dfrac{" + fmt(D) + "}{\\pi}\\,\\mathrm{V}$"], chk: {form: "u28s2va", p: {a: a}}};
  }
  throw new Error("u28s2va：条件に合う数字が見つからない");
}
function tbU28s2_Qvm(r){
  var gcd = tbU28s2_gcd, ratio = tbU28s2_ratio, par = tbU28s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [10,20,30,40,50,60,80,100,120,150,200]);
    var D = (2 * b);
    var _c = choices(r, [{t: "$" + fmt(b) + "\\,\\mathrm{V}$", v: fmt(b)}, {t: "$" + fmt(D) + "\\,\\mathrm{V}$", v: fmt(D), why: "$V_a = \\dfrac{2V_m}{\\pi}$ の 2 で割っていない"}, {t: "$\\dfrac{" + fmt(D) + "}{\\pi}\\,\\mathrm{V}$", v: fmt(D) + "/pi", why: "平均値のまま。最大値の方が大きい"}, {t: "$\\dfrac{" + fmt(b) + "}{\\pi}\\,\\mathrm{V}$", v: fmt(b) + "/pi", why: "$\\pi$ を掛けるところを、そのまま残した"}]);
    return {form: "u28s2vm", text: "正弦波交流の電圧の平均値が $\\dfrac{" + fmt(D) + "}{\\pi}\\,\\mathrm{V}$ である。最大値は何 V か。", fig: {kind: "u28s2wv", L: tbU28s2_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","x1":"π","x1at":0.5,"x2":"2π","x2at":1}, [["y1", "{V}_m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dfrac{2V_m}{\\pi} = \\dfrac{" + fmt(D) + "}{\\pi}$ なので $2V_m = " + fmt(D) + "$", "$V_m = " + fmt(b) + "\\,\\mathrm{V}$"], chk: {form: "u28s2vm", p: {b: b}}};
  }
  throw new Error("u28s2vm：条件に合う数字が見つからない");
}
function tbU28s2_Qarea(r){
  var gcd = tbU28s2_gcd, ratio = tbU28s2_ratio, par = tbU28s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$2V_m$", v: "own"}, {t: "$V_m$", v: "vm", why: "最大値が 1 なら面積は 2。面積は $2V_m$"}, {t: "$\\pi V_m$", v: "pi", why: "それは、高さ $V_m$・横 $\\pi$ の長方形の面積"}, {t: "$\\dfrac{2V_m}{\\pi}$", v: "va", why: "それは平均値（面積を $\\pi$ で割った値）"}]);
    return {form: "u28s2area", text: "正弦波交流の 0 から $\\pi$ までの山と横の軸に囲まれた面積はいくらか。", fig: {kind: "u28s2wv", L: tbU28s2_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","x1":"π","x1at":0.5,"x2":"2π","x2at":1}, [["fill", "?"], ["filla", 0], ["fillb", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["半周期の山の面積は $2V_m$（最大値 1 なら 2）", "$2V_m$"], chk: {form: "u28s2area", p: {}}};
  }
  throw new Error("u28s2area：条件に合う数字が見つからない");
}
function tbU28s2_Qdef(r){
  var gcd = tbU28s2_gcd, ratio = tbU28s2_ratio, par = tbU28s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "瞬時値の絶対値を1周期で平均した値", v: "own"}, {t: "瞬時値をそのまま1周期で平均した値", v: "raw", why: "そのまま平均すると、正と負が打ち消して 0 になる"}, {t: "最大値の半分の値", v: "half", why: "平均値は最大値の約 63.6% で、半分ではない"}, {t: "時間とともに変わる、その時その時の値", v: "inst", why: "それは瞬時値"}]);
    return {form: "u28s2def", text: "正弦波交流の平均値とは、どのような値か。", fig: {kind: "u28s2wv", L: tbU28s2_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","x1":"π","x1at":0.5,"x2":"2π","x2at":1}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["絶対値をとって（負の部分を折り返して）平らにならした高さ", "瞬時値の絶対値を1周期で平均した値"], chk: {form: "u28s2def", p: {}}};
  }
  throw new Error("u28s2def：条件に合う数字が見つからない");
}
// 28-3 実効値 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u28_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU28s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU28s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU28s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU28s3_par(a, b){ return a * b / (a + b); }
function tbU28s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU28s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU28s3_Qrms(r){
  var gcd = tbU28s3_gcd, ratio = tbU28s3_ratio, par = tbU28s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,10,12,20,50,100,200]);
    var u = pick(r, [0,1]);
    var D = (2 * a);
    var nm = (u == 0 ? 'v' : 'i');
    var un = (u == 0 ? 'V' : 'A');
    var wd = (u == 0 ? '電圧' : '電流');
    var _c = choices(r, [{t: "$" + fmt(a) + "\\,\\mathrm{" + String(un) + "}$", v: fmt(a)}, {t: "$" + fmt(D) + "\\,\\mathrm{" + String(un) + "}$", v: fmt(D), why: "$\\sqrt{2}$ で割るところを掛けた"}, {t: "$" + fmt(a) + "\\sqrt{2}\\,\\mathrm{" + String(un) + "}$", v: fmt(a) + "r2", why: "それは最大値"}, {t: "$\\dfrac{" + fmt(a) + "}{\\sqrt{2}}\\,\\mathrm{" + String(un) + "}$", v: fmt(a) + "/r2", why: "$\\sqrt{2}$ で割るのを 2 回くり返した"}]);
    return {form: "u28s3rms", text: "正弦波交流の" + String(wd) + "が $" + String(nm) + " = " + fmt(a) + "\\sqrt{2} \\sin \\omega t$［" + String(un) + "］で表される。実効値は何 " + String(un) + " か。", fig: {kind: "u28s3wv", L: tbU28s3_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["ay", "{" + String(nm) + "}［" + String(un) + "］"], ["w1", "{" + String(nm) + "}"], ["y1", fmt(a) + "\\sqrt{2} " + String(un)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["実効値は最大値の $\\dfrac{1}{\\sqrt{2}}$ 倍", "$" + String(u == 0 ? 'V' : 'I') + " = \\dfrac{" + fmt(a) + "\\sqrt{2}}{\\sqrt{2}} = " + fmt(a) + "\\,\\mathrm{" + String(un) + "}$"], chk: {form: "u28s3rms", p: {a: a}}};
  }
  throw new Error("u28s3rms：条件に合う数字が見つからない");
}
function tbU28s3_Qvm(r){
  var gcd = tbU28s3_gcd, ratio = tbU28s3_ratio, par = tbU28s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [10,20,30,50,100,200,400,600]);
    var D = (2 * a);
    var _c = choices(r, [{t: "$" + fmt(a) + "\\sqrt{2}\\,\\mathrm{V}$", v: fmt(a) + "r2"}, {t: "$\\dfrac{" + fmt(a) + "}{\\sqrt{2}}\\,\\mathrm{V}$", v: fmt(a) + "/r2", why: "最大値は実効値より大きい。$\\sqrt{2}$ を掛ける"}, {t: "$" + fmt(D) + "\\,\\mathrm{V}$", v: fmt(D), why: "掛けるのは 2 ではなく $\\sqrt{2}$"}, {t: "$" + fmt(a) + "\\,\\mathrm{V}$", v: fmt(a), why: "実効値のまま"}]);
    return {form: "u28s3vm", text: "正弦波交流の電圧の実効値が $" + fmt(a) + "\\,\\mathrm{V}$ である。最大値は何 V か。", fig: {kind: "u28s3wv", L: tbU28s3_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["y1", "{V}_m"], ["lv1", fmt(a) + " V"], ["lv1at", 0.707], ["lv1a", 0], ["lv1b", 1]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V = \\dfrac{V_m}{\\sqrt{2}}$ なので $V_m = \\sqrt{2}\\,V$", "$V_m = " + fmt(a) + "\\sqrt{2}\\,\\mathrm{V}$"], chk: {form: "u28s3vm", p: {a: a}}};
  }
  throw new Error("u28s3vm：条件に合う数字が見つからない");
}
function tbU28s3_Qoutlet(r){
  var gcd = tbU28s3_gcd, ratio = tbU28s3_ratio, par = tbU28s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "実効値", v: "own"}, {t: "最大値", v: "max", why: "最大値はその $\\sqrt{2}$ 倍で、約 141 V"}, {t: "平均値", v: "avg", why: "コンセントの値は、同じ電力の直流の大きさ（実効値）"}, {t: "瞬時値", v: "inst", why: "瞬時値は時間とともに変わり、決まった1つの値ではない"}]);
    return {form: "u28s3outlet", text: "家のコンセントの交流 100 V の「100 V」は何を表すか。", fig: {kind: "u28s3wv", L: tbU28s3_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, [["y1", "{V}_m"], ["lv1", "100 V"], ["lv1at", 0.707], ["lv1a", 0], ["lv1b", 1]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンセントの 100 V は実効値。最大値は約 141 V", "実効値"], chk: {form: "u28s3outlet", p: {}}};
  }
  throw new Error("u28s3outlet：条件に合う数字が見つからない");
}
function tbU28s3_Qdef(r){
  var gcd = tbU28s3_gcd, ratio = tbU28s3_ratio, par = tbU28s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "その交流と同じ電力になる直流の大きさ", v: "own"}, {t: "瞬時値の絶対値を1周期で平均した値", v: "avg", why: "それは平均値"}, {t: "一番大きくなったときの値", v: "max", why: "それは最大値"}, {t: "最大値を 2 で割った値", v: "half", why: "正弦波交流では、最大値を $\\sqrt{2}$ で割った値"}]);
    return {form: "u28s3def", text: "実効値とは、どのような値か。", fig: {kind: "u28s3wv", L: tbU28s3_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["同じ電力を出す直流の電圧（電流）が実効値", "その交流と同じ電力になる直流の大きさ"], chk: {form: "u28s3def", p: {}}};
  }
  throw new Error("u28s3def：条件に合う数字が見つからない");
}
// 28-4 波高率と波形率 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u28_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU28s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU28s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU28s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU28s4_par(a, b){ return a * b / (a + b); }
function tbU28s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU28s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU28s4_Qcalc(r){
  var gcd = tbU28s4_gcd, ratio = tbU28s4_ratio, par = tbU28s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [6,8,9,10,12,15,16,18,20,24,30,40,50]);
    var b = pick(r, [4,5,6,8,10,12,15,16,20,25,30]);
    var c = pick(r, [2,3,4,5,6,8,9,10,12,15,16,20]);
    var k = pick(r, [0,1]);
    var Hm = (a / b);
    var Fm = (b / c);
    var Hv = (b / a);
    var Fv = (c / b);
    var M = (a / c);
    var good = (k == 0 ? Hm : Fm);
    var w1_ = (k == 0 ? Fm : Hm);
    var w2_ = (k == 0 ? Hv : Fv);
    var nm = (k == 0 ? '波高率' : '波形率');
    if (!(a > b && b > c && nice(Hm) && nice(Fm) && nice(Hv) && nice(Fv) && nice(M) && distinct([good, w1_, w2_, M]) && Hm < 3 && Fm < 3)) continue;
    var _c = choices(r, [{t: fmt(good), v: fmt(good)}, {t: fmt(w1_), v: fmt(w1_), why: String(k == 0 ? 'それは波形率（実効値 ÷ 平均値）' : 'それは波高率（最大値 ÷ 実効値）')}, {t: fmt(w2_), v: fmt(w2_), why: "割る順が逆"}, {t: fmt(M), v: fmt(M), why: "最大値を平均値で割った"}]);
    return {form: "u28s4calc", text: "ある波形の最大値が $" + fmt(a) + "\\,\\mathrm{V}$、実効値が $" + fmt(b) + "\\,\\mathrm{V}$、平均値が $" + fmt(c) + "\\,\\mathrm{V}$ である。" + String(nm) + "はいくらか。", fig: {kind: "u28s4sk", L: tbU28s4_fig({"m":"最大値","r":"実効値","a":"平均値","f1":"波高率","f2":"波形率"}, [["m", "最大値 " + fmt(a) + " V"], ["r", "実効値 " + fmt(b) + " V"], ["a", "平均値 " + fmt(c) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(k == 0 ? '波高率＝最大値 ÷ 実効値' : '波形率＝実効値 ÷ 平均値'), "$" + String(k == 0 ? fmt(a) : fmt(b)) + " \\div " + String(k == 0 ? fmt(b) : fmt(c)) + " = " + fmt(good) + "$"], chk: {form: "u28s4calc", p: {a: a, b: b, c: c, k: k}}};
  }
  throw new Error("u28s4calc：条件に合う数字が見つからない");
}
function tbU28s4_Qsine(r){
  var gcd = tbU28s4_gcd, ratio = tbU28s4_ratio, par = tbU28s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1]);
    var nm = (k == 0 ? '波高率' : '波形率');
    var _c = choices(r, [{t: String(k == 0 ? '$\\sqrt{2}$' : '$\\dfrac{\\pi}{2\\sqrt{2}}$'), v: "ok"}, {t: String(k == 0 ? '$\\dfrac{\\pi}{2\\sqrt{2}}$' : '$\\sqrt{2}$'), v: "sw", why: String(k == 0 ? 'それは波形率' : 'それは波高率')}, {t: "$\\dfrac{1}{\\sqrt{2}}$", v: "inv", why: "割る順が逆（それは実効値 ÷ 最大値）"}, {t: "$\\dfrac{2}{\\pi}$", v: "avg", why: "それは平均値 ÷ 最大値"}]);
    return {form: "u28s4sine", text: "正弦波交流の" + String(nm) + "はいくらか。", fig: {kind: "u28s4wv", L: tbU28s4_fig({"m":"最大値","r":"実効値","a":"平均値","f1":"波高率","f2":"波形率"}, [["ax", "{ω}{t}［rad］"], ["ay", "{v}［V］"], ["w1", "{v}"], ["y1", "{V}_m"], ["lv1", "{V}"], ["lv1at", 0.707], ["lv1a", 0], ["lv1b", 1], ["lv2", "{V}_a"], ["lv2at", 0.637], ["lv2a", 0], ["lv2b", 1], ["m", null], ["r", null], ["a", null], ["f1", null], ["f2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(k == 0 ? '最大値 ÷ 実効値 ＝ $V_m \\div \\dfrac{V_m}{\\sqrt{2}}$' : '実効値 ÷ 平均値 ＝ $\\dfrac{V_m}{\\sqrt{2}} \\div \\dfrac{2V_m}{\\pi}$'), String(k == 0 ? '$\\sqrt{2}$' : '$\\dfrac{\\pi}{2\\sqrt{2}}$')], chk: {form: "u28s4sine", p: {k: k}}};
  }
  throw new Error("u28s4sine：条件に合う数字が見つからない");
}
function tbU28s4_Qdef(r){
  var gcd = tbU28s4_gcd, ratio = tbU28s4_ratio, par = tbU28s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1]);
    var nm = (k == 0 ? '波高率' : '波形率');
    var _c = choices(r, [{t: String(k == 0 ? '最大値 ÷ 実効値' : '実効値 ÷ 平均値'), v: "ok"}, {t: String(k == 0 ? '実効値 ÷ 平均値' : '最大値 ÷ 実効値'), v: "sw", why: String(k == 0 ? 'それは波形率。波高率は上の分数' : 'それは波高率。波形率は下の分数')}, {t: String(k == 0 ? '実効値 ÷ 最大値' : '平均値 ÷ 実効値'), v: "inv", why: "割る順が逆。上に並ぶ値を、下の値で割る"}, {t: "最大値 ÷ 平均値", v: "ma", why: "となりどうし（最大値と実効値・実効値と平均値）で割る"}]);
    return {form: "u28s4def", text: String(nm) + "を表す式はどれか。", fig: {kind: "u28s4sk", L: tbU28s4_fig({"m":"最大値","r":"実効値","a":"平均値","f1":"波高率","f2":"波形率"}, [["m", "最大値"], ["r", "実効値"], ["a", "平均値"], ["f1", "?"], ["f2", "?"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["上から最大値・実効値・平均値。上の分数が波高率、下が波形率", String(k == 0 ? '最大値 ÷ 実効値' : '実効値 ÷ 平均値')], chk: {form: "u28s4def", p: {k: k}}};
  }
  throw new Error("u28s4def：条件に合う数字が見つからない");
}
// 28-5 整流した波形 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u28_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU28s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU28s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU28s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU28s5_par(a, b){ return a * b / (a + b); }
function tbU28s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU28s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU28s5_Qval(r){
  var gcd = tbU28s5_gcd, ratio = tbU28s5_ratio, par = tbU28s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [10,20,30,40,50,60,80,100,120,141,200]);
    var h = pick(r, [0,1]);
    var k = pick(r, [0,1]);
    var V = (['\\dfrac{' + fmt(a) + '}{\\sqrt{2}}', '\\dfrac{' + fmt(2 * a) + '}{\\pi}', fmt(a / 2), '\\dfrac{' + fmt(a) + '}{\\pi}']);
    var RS = (['それは全波整流（正弦波）の実効値', 'それは全波整流（正弦波）の平均値', 'それは半波整流の実効値', 'それは半波整流の平均値']);
    var c = (2 * h + k);
    var nm = (h == 0 ? '全波整流' : '半波整流');
    var vk = (k == 0 ? '実効値' : '平均値');
    if (!(nice(a / 2))) continue;
    var _c = choices(r, [{t: "$" + String(V[c]) + "\\,\\mathrm{V}$", v: String(V[c])}, {t: "$" + String(V[(c + 1) % 4]) + "\\,\\mathrm{V}$", v: String(V[(c + 1) % 4]), why: String(RS[(c + 1) % 4])}, {t: "$" + String(V[(c + 2) % 4]) + "\\,\\mathrm{V}$", v: String(V[(c + 2) % 4]), why: String(RS[(c + 2) % 4])}, {t: "$" + String(V[(c + 3) % 4]) + "\\,\\mathrm{V}$", v: String(V[(c + 3) % 4]), why: String(RS[(c + 3) % 4])}]);
    return {form: "u28s5val", text: "図は、最大値 $" + fmt(a) + "\\,\\mathrm{V}$ の正弦波交流を" + String(nm) + "した波形である。" + String(vk) + "は何 V か。", fig: {kind: "u28s5hw", L: tbU28s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per":2}, [["y1", fmt(a) + " V"], ["w1s", String(h == 0 ? 'abs' : 'half')]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(['全波整流は正弦波と同じ：実効値 $\\dfrac{V_m}{\\sqrt{2}}$', '全波整流は正弦波と同じ：平均値 $\\dfrac{2V_m}{\\pi}$', '半波整流の実効値は $\\dfrac{V_m}{2}$', '半波整流の平均値は $\\dfrac{V_m}{\\pi}$'][c]), "$" + String(V[c]) + "\\,\\mathrm{V}$"], chk: {form: "u28s5val", p: {a: a, h: h, k: k}}};
  }
  throw new Error("u28s5val：条件に合う数字が見つからない");
}
function tbU28s5_Qsame(r){
  var gcd = tbU28s5_gcd, ratio = tbU28s5_ratio, par = tbU28s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "どちらも同じ", v: "own"}, {t: "どちらも半分", v: "half", why: "それに近いのは半波整流。全波は下の山が上に来ただけ"}, {t: "実効値だけ半分", v: "rms", why: "全波は下の山が上に来ただけなので、実効値も変わらない"}, {t: "どちらも 0", v: "zero", why: "0 になるのは、絶対値をとらずに平均したとき"}]);
    return {form: "u28s5same", text: "全波整流の波形の実効値と平均値は、もとの正弦波交流と比べてどうなるか。", fig: {kind: "u28s5fw", L: tbU28s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per":2}, [["y1", "{V}_m"], ["w1s", "abs"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["下の山が上に来ただけ", "どちらも同じ"], chk: {form: "u28s5same", p: {}}};
  }
  throw new Error("u28s5same：条件に合う数字が見つからない");
}
function tbU28s5_Qrate(r){
  var gcd = tbU28s5_gcd, ratio = tbU28s5_ratio, par = tbU28s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1]);
    var nm = (k == 0 ? '波高率' : '波形率');
    var _c = choices(r, [{t: String(k == 0 ? '2' : '$\\dfrac{\\pi}{2}$'), v: "ok"}, {t: String(k == 0 ? '$\\sqrt{2}$' : '$\\dfrac{\\pi}{2\\sqrt{2}}$'), v: "sine", why: "それは正弦波（全波整流）の値"}, {t: String(k == 0 ? '$\\dfrac{\\pi}{2}$' : '2'), v: "sw", why: String(k == 0 ? 'それは波形率' : 'それは波高率')}, {t: String(k == 0 ? '$\\dfrac{1}{2}$' : '$\\dfrac{2}{\\pi}$'), v: "inv", why: "割る順が逆"}]);
    return {form: "u28s5rate", text: "半波整流の波形の" + String(nm) + "はいくらか。", fig: {kind: "u28s5hw", L: tbU28s5_fig({"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per":2}, [["y1", "{V}_m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(k == 0 ? '最大値 ÷ 実効値 ＝ $V_m \\div \\dfrac{V_m}{2}$' : '実効値 ÷ 平均値 ＝ $\\dfrac{V_m}{2} \\div \\dfrac{V_m}{\\pi}$'), String(k == 0 ? '2' : '$\\dfrac{\\pi}{2}$')], chk: {form: "u28s5rate", p: {k: k}}};
  }
  throw new Error("u28s5rate：条件に合う数字が見つからない");
}
var GEN = {
  // 28-1 決まった値になる時刻
  1: function(r){ return pick(r, [tbU28s1_Qq45, tbU28s1_Qq45, tbU28s1_Qq45, tbU28s1_Qq45, tbU28s1_Qq30, tbU28s1_Qq30, tbU28s1_Qdeg, tbU28s1_Qdeg])(r); },
  // 28-2 平均値
  2: function(r){ return pick(r, [tbU28s2_Qva, tbU28s2_Qva, tbU28s2_Qva, tbU28s2_Qva, tbU28s2_Qvm, tbU28s2_Qvm, tbU28s2_Qarea, tbU28s2_Qdef])(r); },
  // 28-3 実効値
  3: function(r){ return pick(r, [tbU28s3_Qrms, tbU28s3_Qrms, tbU28s3_Qrms, tbU28s3_Qrms, tbU28s3_Qvm, tbU28s3_Qvm, tbU28s3_Qvm, tbU28s3_Qoutlet, tbU28s3_Qdef])(r); },
  // 28-4 波高率と波形率
  4: function(r){ return pick(r, [tbU28s4_Qcalc, tbU28s4_Qcalc, tbU28s4_Qcalc, tbU28s4_Qcalc, tbU28s4_Qsine, tbU28s4_Qsine, tbU28s4_Qsine, tbU28s4_Qdef, tbU28s4_Qdef])(r); },
  // 28-5 整流した波形
  5: function(r){ return pick(r, [tbU28s5_Qval, tbU28s5_Qval, tbU28s5_Qval, tbU28s5_Qval, tbU28s5_Qval, tbU28s5_Qsame, tbU28s5_Qrate, tbU28s5_Qrate])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t28s1e","scene":"t28s1e","kind":"u28s1wv","lab":{"ax":"{t}［s］","ay":"{i}［A］","w1":"{i}","y1":"5\\sqrt{2}","lv1":"5","lv1at":0.707,"lv1a":0,"lv1b":0.5,"pt":"{t}_1","ptat":0.125,"pt2":"{t}_2","pt2at":0.375,"x1":["","\\dfrac{1}{400}"],"x1at":0.125},"viewbox":"16 68 1118 694","band":{"want":"$i = 5\\sqrt{2} \\sin 100\\pi t$ が初めて 5 A になる時刻","ans":"$t = \\dfrac{1}{400}\\,\\mathrm{s}$","full":"sin が 1/√2 になればよい。sin が 1/√2 になるのは 45° と 135° で、先に来るのは 45°（π/4）。100πt = π/4 から t = 1/400 s。"},"narr":{"start":{"co":1,"lv1d":0,"ptd":0,"pt2d":0,"x1d":0,"x1v":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"①sin の値\n②先に来る角度\n③時刻\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"電流 $i = 5\\sqrt{2} \\sin 100\\pi t$ が初めて 5 A になる時刻を求めます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"lv","emph":["W1","Lv1"]},{"text":"〖$\\sin$ の値が $\\dfrac{1}{\\sqrt{2}}$〗になれば、$\\sqrt{2}$ と約分されて 5 になります。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["5\\sqrt{2} \\times \\dfrac{1}{\\sqrt{2}} = 5"]]}],"emph":["Y1","Lv1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"$\\sin$ が $\\dfrac{1}{\\sqrt{2}}$ になる角度は、〖45° と 135° の2つ〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"p","emph":["Pt","Pt2"]},{"text":"初めて 5 A になるのは、〖先に来る 45°〗です。45° は $\\dfrac{\\pi}{4}$ です。","at":{"強調":1.0},"after":[],"emph":["Pt"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"$100\\pi t$ が $\\dfrac{\\pi}{4}$ になる時刻です。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":3,"eq":[{"cont":false,"items":[["100\\pi t = \\dfrac{\\pi}{4}"]]}],"emph":["Pt"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["t = \\dfrac{1}{400}\\,\\mathrm{s}"]]}],"move":"t","ans":true,"emph":["Pt","X1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"lv":{"to":{"lv1d":1},"dur":0.5},"p":{"to":{"ptd":1,"pt2d":1,"x1d":1},"dur":0.5},"t":{"to":{"x1v":1},"dur":0.4}},"route":["sin の値","先に来る角度","時刻"]}},{"id":"t28s1x","scene":"t28s1x","kind":"u28s1wv","lab":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"20\\sqrt{2}","lv1":"20","lv1at":0.707,"lv1a":0,"lv1b":0.5,"pt":"{t}_1","ptat":0.125,"x1":["","\\dfrac{1}{800}"],"x1at":0.125},"viewbox":"16 68 1118 694","band":{"want":"初めて $v = 20\\,\\mathrm{V}$ になる時刻","known":"$v = 20\\sqrt{2} \\sin 200\\pi t$","ans":"$t = \\dfrac{1}{800}\\,\\mathrm{s}$"},"narr":{"start":{"co":1,"lv1d":1,"ptd":1,"x1v":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"求めるのは、$v = 20\\sqrt{2} \\sin 200\\pi t$ が初めて 20 V になる時刻です。","at":{"強調":1.0},"after":[],"emph":["Lv1","W1"]},{"text":"①sin の値\n②先に来る角度\n③時刻\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"〖$\\sin$ の値が $\\dfrac{1}{\\sqrt{2}}$〗になればよいです。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":1,"eq":[{"cont":false,"items":[["20\\sqrt{2} \\times \\dfrac{1}{\\sqrt{2}} = 20"]]}],"emph":["Y1","Lv1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"45° と 135° のうち、〖先に来る 45°〗、つまり $\\dfrac{\\pi}{4}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pt"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"","at":{"式":0.0,"道筋":0.0,"強調":0.0},"after":["道筋","強調"],"eq":[{"cont":false,"items":[["200\\pi t = \\dfrac{\\pi}{4}"]]}],"route":3,"emph":["Pt"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["t = \\dfrac{1}{800}\\,\\mathrm{s}"]]}],"move":"t","ans":true,"emph":["Pt","X1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"t":{"to":{"x1v":1},"dur":0.4}},"route":["sin の値","先に来る角度","時刻"]}},{"id":"t28s2e","scene":"t28s2e","kind":"u28s2wv","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","x1":"π","x1at":0.5,"x2":"2π","x2at":1,"fill":"2{V}_m","lv1":"{V}_a","lv1at":0.6366,"lv1a":0,"lv1b":0.5,"lv1box":true,"filla":0,"fillb":0.5},"viewbox":"16 68 1118 694","band":{"want":"正弦波交流の平均値","ans":"$V_a = \\dfrac{2V_m}{\\pi}$","full":"平均値は、瞬時値の絶対値を1周期で平均した値。半周期の山の面積 2V_m を横の長さ π で割って、2V_m/π（最大値の約 63.6%）。"},"narr":{"start":{"co":1,"fold":0,"filld":0,"lv1d":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"①絶対値をとる\n②山の面積\n③平らにならす\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"平均値は、〖瞬時値の絶対値を1周期で平均した値〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W1"]},{"text":"絶対値は、符号をとった値です。$-3$ の絶対値は 3 です。","at":{"強調":1.0},"after":[],"emph":["W1"]},{"text":"負の部分を〖上へ折り返し〗ます。すると、同じ形の山が2つ並びます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"fold","emph":["W1"]},{"text":"山は同じ形なので、〖半分の周期で平均しても同じ〗結果になります。","at":{"強調":1.0},"after":[],"emph":["X1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"0 から $\\pi$ までの山の面積は〖$2V_m$〗です。最大値が 1 なら面積は 2、と覚えておきます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"fill","emph":["Fill","Y1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"山を平らにならします。同じ面積で、横の長さは $\\pi$ のままの長方形にします。その高さが〖平均値 $V_a$〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"lv","emph":["Lv1","Fill"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["V_a = \\dfrac{2V_m}{\\pi}"]]}],"emph":["Lv1","Y1"]},{"text":"最大値の約 63.6% です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Lv1","Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"fold":{"to":{"fold":1},"dur":1.0},"fill":{"to":{"filld":1},"dur":0.6},"lv":{"to":{"lv1d":1},"dur":0.8}},"route":["絶対値をとる","山の面積","平らにならす"]}},{"id":"t28s2x","scene":"t28s2x","kind":"u28s2wv","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"100 V","x1":"π","x1at":0.5,"x2":"2π","x2at":1,"lv1":"{V}_a","lv1at":0.6366,"lv1a":0,"lv1b":0.5,"lv1box":true,"filla":0,"fillb":0.5,"w1s":"abs"},"viewbox":"16 68 1118 694","band":{"want":"平均値 $V_a$","known":"$V_m = 100\\,\\mathrm{V}$","ans":"$V_a = \\dfrac{200}{\\pi}\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"lv1d":1},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"求めるのは、最大値 100 V の正弦波交流の平均値です。","at":{"強調":1.0},"after":[],"emph":["Lv1"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"〖山の面積 $2V_m$ を横の長さ $\\pi$ で割り〗ます。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":1,"eq":[{"cont":false,"items":[["V_a = \\dfrac{2V_m}{\\pi}"]]}],"emph":["Lv1","Y1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"","at":{"式":0.0,"道筋":0.0,"答え":0.0,"強調":0.0},"after":["道筋","答え","強調"],"eq":[{"cont":false,"items":[["V_a = \\dfrac{2 \\times 100}{\\pi} = \\dfrac{200}{\\pi}\\,\\mathrm{V}"]]}],"route":2,"ans":true,"emph":["Lv1","Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{},"route":["式を書く","数を入れる"]}},{"id":"t28s3e","scene":"t28s3e","kind":"u28s3dw","lab":{"src":"{V}","r":"{R}","src2":"{v}","r2":"{R}","ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","lv1":"{V}","lv1at":0.707,"lv1a":0,"lv1b":1},"viewbox":"16 68 1118 924","band":{"want":"実効値とは何か","ans":"同じ電力になる直流の大きさ。$V = \\dfrac{V_m}{\\sqrt{2}}$","full":"実効値は、交流と同じ電力になる直流の大きさ。正弦波交流では V = V_m/√2（最大値の約 70.7%）、I = I_m/√2。コンセントの 100 V は実効値で、最大値は約 141 V。"},"narr":{"start":{"co":1,"t":0,"lv1d":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"①同じ電力の直流\n②最大値との関係\n③コンセントの 100 V\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"交流電源に抵抗をつなぐと、電圧が変わり続けるので、抵抗の電力も周期的に変わります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src2","R2"]},{"text":"その平均の電力と同じ電力を出す、直流の電圧を考えます。これが〖実効値〗です。効果の効の字を使います。","at":{"強調":1.0},"after":[],"emph":["src","R"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"正弦波交流の波形で見ます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"wv","emph":["Y1"]},{"text":"正弦波交流では、〖実効値は最大値の $\\dfrac{1}{\\sqrt{2}}$ 倍〗です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"lv","emph":["Lv1","Y1"],"eq":[{"cont":false,"items":[["V = \\dfrac{V_m}{\\sqrt{2}}"]]}],"emphPre":["Lv1","Y1"]},{"text":"最大値の約 70.7% です。平均値の約 63.6% より少し上です。","at":{"強調":1.0},"after":[],"emph":["Lv1"]},{"text":"直流の電力 $\\dfrac{V^2}{R}$ と、交流の電力の平均 $\\dfrac{V_m^2}{2R}$ を等しくおき、両辺のルートをとると出てきます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Lv1","Y1"],"eq":[{"cont":false,"items":[["\\dfrac{V^2}{R} = \\dfrac{V_m^2}{2R}"]]}],"emphPre":["Lv1","Y1"]},{"text":"電流も同じです。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["I = \\dfrac{I_m}{\\sqrt{2}}"]]}],"emph":["Lv1","Y1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"コンセントの 100 V は、〖最大値ではなく実効値〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Lv1"]},{"text":"最大値は、その $\\sqrt{2}$ 倍で、約 141 V です。","at":{"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["V_m = 100\\sqrt{2}\\,\\mathrm{V}"]]}],"ans":true,"emph":["Y1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"zhi":["u28s3dwL","u28s3dww1","zbu28s3dw0hi"],"zlo":["u28s3dwRw","u28s3dww2","zbu28s3dw1lo"],"src2":["cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"R2":["rx1","rx1t0","rx1t1"],"I2":["ix1a","ix1a:h","ix1t0","ix1t1"],"zhi2":["u28s3dwx1L","u28s3dwx1w1"],"zlo2":["u28s3dwx1Rw","u28s3dwx1w2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1"],"S3":["ws3x1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{"wv":{"to":{"t":1},"dur":0.6},"lv":{"to":{"lv1d":1},"dur":0.8}},"route":["同じ電力の直流","最大値との関係","コンセントの 100 V"]}},{"id":"t28s3x","scene":"t28s3x","kind":"u28s3wv","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"60\\sqrt{2} V","lv1":["{V}","60 V"],"lv1at":0.707,"lv1a":0,"lv1b":1},"viewbox":"16 68 1118 694","band":{"want":"実効値 $V$","known":"$v = 60\\sqrt{2} \\sin \\omega t$","ans":"$V = 60\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"lv1d":1,"lv1v":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"求めるのは実効値です。電圧は $v = 60\\sqrt{2} \\sin \\omega t$ です。","at":{"強調":1.0},"after":[],"emph":["Lv1"]},{"text":"①最大値を読む\n②√2 で割る\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"$\\sin$ の前の値が最大値です。$V_m = 60\\sqrt{2}\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Y1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"実効値は、〖最大値を $\\sqrt{2}$ で割った値〗です。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":2,"eq":[{"cont":false,"items":[["V = \\dfrac{V_m}{\\sqrt{2}}"]]}],"emph":["Lv1","Y1"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["V = \\dfrac{60\\sqrt{2}}{\\sqrt{2}} = 60\\,\\mathrm{V}"]]}],"move":"v","ans":true,"emph":["Lv1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"v":{"to":{"lv1v":1},"dur":0.4}},"route":["最大値を読む","√2 で割る"]}},{"id":"t28s4e","scene":"t28s4e","kind":"u28s4ws","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","lv1":"{V}","lv1at":0.707,"lv1a":0,"lv1b":1,"lv2":"{V}_a","lv2at":0.637,"lv2a":0,"lv2b":1,"m":"最大値","r":"実効値","a":"平均値","f1":"波高率","f2":"波形率"},"viewbox":"16 68 1118 694","band":{"want":"波高率と波形率","ans":"波高率＝最大値/実効値、波形率＝実効値/平均値","full":"波高率は最大値を実効値で割った値で、正弦波では √2。波形率は実効値を平均値で割った値で、正弦波では π/(2√2)。最大値・実効値・平均値を縦に並べ、上の分数が波高率、下の分数が波形率。"},"narr":{"start":{"co":1,"t":0,"b1d":0,"b2d":0,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"①波高率\n②波形率\n③覚え方\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"正弦波交流では、上から〖最大値・実効値・平均値の順〗に並びます。","at":{"強調":1.0},"after":[],"emph":["Y1","Lv1","Lv2"]},{"text":"波高率は、〖最大値を実効値で割った値〗です。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":1,"eq":[{"cont":false,"items":[["\\text{波高率} = \\dfrac{\\text{最大値}}{\\text{実効値}}"]]}],"emph":["Y1","Lv1"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\dfrac{V_m}{\\dfrac{V_m}{\\sqrt{2}}} = \\sqrt{2}"]]}],"emph":["Y1","Lv1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"波形率は、〖実効値を平均値で割った値〗です。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":2,"eq":[{"cont":false,"items":[["\\text{波形率} = \\dfrac{\\text{実効値}}{\\text{平均値}}"]]}],"emph":["Lv1","Lv2"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\dfrac{\\dfrac{V_m}{\\sqrt{2}}}{\\dfrac{2V_m}{\\pi}} = \\dfrac{\\pi}{2\\sqrt{2}}"]]}],"emph":["Lv1","Lv2","Y1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"最大値・実効値・平均値を縦に並べます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"sk","emph":["M","R","A"]},{"text":"間に横棒を入れると、上の分数が波高率です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"b1","emph":["B1","F1"]},{"text":"下の分数が波形率です。〖波高率が上〗、と覚えます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"b2","emph":["B2","F2"]},{"text":"〖とがった波形ほど〗、波高率も波形率も大きくなります。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["F1","F2"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"],"M":["mtx10","mtx11"],"R":["rtx10","rtx11"],"A":["atx10","atx11"],"B1":["b1x1"],"B2":["b2x1"],"F1":["brf1x1","f1tx10","f1tx11"],"F2":["brf2x1","f2tx10","f2tx11"]},"moves":{"sk":{"to":{"t":1},"dur":0.6},"b1":{"to":{"b1d":1,"f1d":1},"dur":0.6},"b2":{"to":{"b2d":1,"f2d":1},"dur":0.6}},"route":["波高率","波形率","覚え方"]}},{"id":"t28s4x","scene":"t28s4x","kind":"u28s4sk","lab":{"m":"最大値 10 V","r":"実効値 5 V","a":"平均値 4 V","f1":"波高率","f2":"波形率"},"viewbox":"236 231 588 378","band":{"want":"波形率","known":"最大値 10 V・実効値 5 V・平均値 4 V","ans":"1.25"},"narr":{"start":{"co":1,"b1d":1,"b2d":1,"f1d":1,"f2d":1},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"ある波形の最大値が 10 V、実効値が 5 V、平均値が 4 V です。求めるのは、波形率です。","at":{"強調":1.0},"after":[],"emph":["M","R","A"]},{"text":"①どの分数か\n②割る\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"波形率は下の分数、〖実効値を平均値で割った値〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["B2","F2","R","A"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"","at":{"式":0.0,"道筋":0.0,"答え":0.0,"強調":0.0},"after":["道筋","答え","強調"],"eq":[{"cont":false,"items":[["\\text{波形率} = \\dfrac{5}{4} = 1.25"]]}],"route":2,"ans":true,"emph":["F2","R","A"]}]}],"groups":{"M":["mt0","mt1"],"R":["rt0","rt1"],"A":["at0","at1"],"B1":["b1"],"B2":["b2"],"F1":["brf1","f1t0","f1t1"],"F2":["brf2","f2t0","f2t1"]},"moves":{},"route":["どの分数か","割る"]}},{"id":"t28s5e","scene":"t28s5e","kind":"u28s5fh","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"{V}_m","per":2,"lv1":"{V}","lv1at":0.7071,"lv1a":0,"lv1b":2},"viewbox":"16 68 1118 694","band":{"want":"全波整流と半波整流の平均値・実効値","ans":"全波は正弦波と同じ。半波は $V = \\dfrac{V_m}{2}$、$V_a = \\dfrac{V_m}{\\pi}$","full":"全波整流は下の山が上に来ただけなので、平均値も実効値も正弦波と同じ（V_m/√2・2V_m/π）。半波整流は平均値が半分の V_m/π、実効値は V_m/2。"},"narr":{"start":{"co":1,"t":0,"lv1d":0,"lv1v":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"①全波整流\n②半波整流\n③波高率と波形率\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"正弦波交流の負の山を、上へ折り返した形を〖全波整流〗の波形といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W1"]},{"text":"下にあった山が上に来ただけです。平均値も実効値も、〖正弦波と同じ〗です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"lv","emph":["Lv1","Y1"],"eq":[{"cont":false,"items":[["V = \\dfrac{V_m}{\\sqrt{2}}","V_a = \\dfrac{2V_m}{\\pi}"]]}],"emphPre":["W1","Lv1","Y1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"半分しか波が無い形を、〖半波整流〗の波形といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"hw","emph":["W1"]},{"text":"山が半分なので、〖平均値は全波の半分〗です。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["V_a = \\dfrac{V_m}{\\pi}"]]}],"emph":["W1","Y1"]},{"text":"実効値は $\\sqrt{2}$ ではなく〖2 で割り〗ます。ここは覚えてしまいます。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["V = \\dfrac{V_m}{2}"]]}],"emph":["W1","Y1","Lv1"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"波高率と波形率は、定義の式に入れて求めます。","at":{"道筋":1.0},"after":[],"route":3},{"text":"半波整流では、波高率は $V_m \\div \\dfrac{V_m}{2} = 2$、波形率は $\\dfrac{V_m}{2} \\div \\dfrac{V_m}{\\pi} = \\dfrac{\\pi}{2}$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Y1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1","waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"W1":["ww1","ww1t0","ww1t1","ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2","ww2t0","ww2t1","ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3","ww3t0","ww3t1","ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1","wx1t0","wx1t1","wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2","wx2t0","wx2t1","wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3","wx3t0","wx3t1","wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4","wx4t0","wx4t1","wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1","wy1t0","wy1t1","wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2","wy2t0","wy2t1","wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3","wy3t0","wy3t1","wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1","wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wpt","wptl","wptt0","wptt1","wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1","wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1a","ww1ax1"],"S2":["ws2","ws2x1"],"S3":["ws3","ws3x1"],"Fill":["wfl","wflt0","wflt1","wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1","wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1","wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{"lv":{"to":{"lv1d":1},"dur":0.6},"hw":{"to":{"t":1},"dur":0.6}},"route":["全波整流","半波整流","波高率と波形率"]}},{"id":"t28s5x","scene":"t28s5x","kind":"u28s5hw","lab":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"100 V","per":2,"lv1":["{V}","50 V"],"lv1at":0.5,"lv1a":0,"lv1b":2},"viewbox":"16 68 1118 694","band":{"want":"半波整流の実効値","known":"$V_m = 100\\,\\mathrm{V}$","ans":"$V = 50\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"lv1d":1,"lv1v":0},"steps":[{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"求めるのは、最大値 100 V の半波整流の波形の実効値です。","at":{"強調":1.0},"after":[],"emph":["W1","Y1"]},{"text":"①どの波形か\n②式に入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"半分しか波が無いので、〖半波整流〗です。実効値は 2 で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W1","Lv1"],"eq":[{"cont":false,"items":[["V = \\dfrac{V_m}{2}"]]}],"emphPre":["W1"]}]},{"cap":null,"eqp":null,"vid":[15],"sents":[{"text":"","at":{"式":0.0,"道筋":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["道筋","動き","答え","強調"],"eq":[{"cont":false,"items":[["V = \\dfrac{100}{2} = 50\\,\\mathrm{V}"]]}],"route":2,"move":"v","ans":true,"emph":["Lv1"]}]}],"groups":{"Ax":["wax","wax:h","way","way:h","wo","waxt0","waxt1","wayt0","wayt1"],"W1":["ww1","ww1t0","ww1t1"],"W2":["ww2","ww2t0","ww2t1"],"W3":["ww3","ww3t0","ww3t1"],"X1":["wx1","wx1t0","wx1t1"],"X2":["wx2","wx2t0","wx2t1"],"X3":["wx3","wx3t0","wx3t1"],"X4":["wx4","wx4t0","wx4t1"],"Y1":["wy1","wy1t0","wy1t1"],"Y2":["wy2","wy2t0","wy2t1"],"Y3":["wy3","wy3t0","wy3t1"],"Per1":["wpr","wpr:h","wpr:h2","wprt0","wprt1"],"Pt":["wpt","wptl","wptt0","wptt1"],"Pt2":["wpt2","wpt2l","wpt2t0","wpt2t1"],"W1a":["ww1a"],"S2":["ws2"],"S3":["ws3"],"Fill":["wfl","wflt0","wflt1"],"Lv1":["wlv1","wlb1","wlv1t0","wlv1t1"],"Lv2":["wlv2","wlb2","wlv2t0","wlv2t1"]},"moves":{"v":{"to":{"lv1v":1},"dur":0.4}},"route":["どの波形か","式に入れる"]}}],"secs":[{"ex":{"text":"正弦波交流の電圧が $v = 20\\sqrt{2} \\sin 200\\pi t$［V］で表される。$t = 0$ のあと、初めて $v = 20\\,\\mathrm{V}$ になる時刻は何 s か。","fig":{"kind":"u28s1wv","L":{"ax":"{t}［s］","ay":"{v}［V］","w1":"{v}","y1":"20\\sqrt{2}","lv1":"20","lv1at":0.707,"lv1a":0,"lv1b":0.5},"P":{}},"ch":[{"t":"$\\dfrac{3}{800}\\,\\mathrm{s}$","v":"3/800","why":"135° の方。先に来るのは 45°"},{"t":"$\\dfrac{1}{400}\\,\\mathrm{s}$","v":"1/400","why":"それは最大値になる時刻（90°）"},{"t":"$\\dfrac{1}{800}\\,\\mathrm{s}$","v":"1/800","why":""},{"t":"$\\dfrac{\\pi}{4}\\,\\mathrm{s}$","v":"pi/4","why":"角度のまま。$200\\pi$ で割って時刻にする"}],"ans":2}},{"ex":{"text":"最大値 $100\\,\\mathrm{V}$ の正弦波交流の電圧の平均値は何 V か。","fig":{"kind":"u28s2wv","L":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"100 V","x1":"π","x1at":0.5,"x2":"2π","x2at":1},"P":{}},"ch":[{"t":"$0\\,\\mathrm{V}$","v":"0","why":"絶対値をとらずに平均すると、正と負が打ち消して 0 になる"},{"t":"$\\dfrac{200}{\\pi}\\,\\mathrm{V}$","v":"200/pi","why":""},{"t":"$\\dfrac{100}{\\pi}\\,\\mathrm{V}$","v":"100/pi","why":"負の半分を折り返さずに、山1つの面積を $2\\pi$ で割った"},{"t":"$50\\pi\\,\\mathrm{V}$","v":"50pi","why":"割る順が逆"}],"ans":1}},{"ex":{"text":"正弦波交流の電圧が $v = 60\\sqrt{2} \\sin \\omega t$［V］で表される。実効値は何 V か。","fig":{"kind":"u28s3wv","L":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"60\\sqrt{2} V"},"P":{}},"ch":[{"t":"$60\\,\\mathrm{V}$","v":"60","why":""},{"t":"$120\\,\\mathrm{V}$","v":"120","why":"$\\sqrt{2}$ で割るところを掛けた"},{"t":"$60\\sqrt{2}\\,\\mathrm{V}$","v":"60r2","why":"それは最大値"},{"t":"$\\dfrac{120\\sqrt{2}}{\\pi}\\,\\mathrm{V}$","v":"va","why":"それは平均値（$\\dfrac{2V_m}{\\pi}$）"}],"ans":0}},{"ex":{"text":"ある波形の最大値が $10\\,\\mathrm{V}$、実効値が $5\\,\\mathrm{V}$、平均値が $4\\,\\mathrm{V}$ である。波形率はいくらか。","fig":{"kind":"u28s4sk","L":{"m":"最大値 10 V","r":"実効値 5 V","a":"平均値 4 V","f1":"波高率","f2":"波形率"},"P":{}},"ch":[{"t":"2","v":"2","why":"それは波高率（最大値 ÷ 実効値）"},{"t":"1.25","v":"1.25","why":""},{"t":"0.8","v":"0.8","why":"割る順が逆（平均値 ÷ 実効値）"},{"t":"2.5","v":"2.5","why":"最大値を平均値で割った"}],"ans":1}},{"ex":{"text":"図は、最大値 $100\\,\\mathrm{V}$ の正弦波交流を半波整流した波形である。実効値は何 V か。","fig":{"kind":"u28s5hw","L":{"ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}","y1":"100 V","per":2},"P":{}},"ch":[{"t":"$\\dfrac{100}{\\sqrt{2}}\\,\\mathrm{V}$","v":"100/r2","why":"それは全波整流（正弦波）の実効値"},{"t":"$\\dfrac{100}{\\pi}\\,\\mathrm{V}$","v":"100/pi","why":"それは半波整流の平均値"},{"t":"$50\\,\\mathrm{V}$","v":"50","why":""},{"t":"$\\dfrac{200}{\\pi}\\,\\mathrm{V}$","v":"200/pi","why":"それは全波整流（正弦波）の平均値"}],"ans":2}}],"past":[]}};
});
