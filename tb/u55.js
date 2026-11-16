/* 単元55「過渡現象のつなぎ（3つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(55, function(H){
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
  } else d.text(N + ":t", it.x, it.y, it.sym || "G", {o: o, size: 24});   // 丸の中の G は丸に入る大きさ（図の字のままだと丸からはみ出して帯にかかった）。sym＝電流計 A・電圧計 V（kit の Am・Vm。2026-11-12）
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
    else if (it.t === "cap" && !it.f) d.text(it.id, it.x, it.y, it.s, {o: o});   // 並べた図の見出し（図1・図2。kit の side(..., cap=…)。2026-11-12）
    // ↑ 2026-11-14 静電気のつなぎ：コンデンサ（figkit_cap の部品＝t:"cap"・f:"cap"。figs.js の tbFig_Cap が描く）を見出しと取り違えない（!it.f）。
    //   前は回路の中のコンデンサごとに、極板の線と同じ id の字（中身 undefined）を作っていた（凍結の runtime_u31.js には見出しが無いので単元17・18 は前から無事）
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
// ---- 55-1 瞬間と定常の電流の比 の図（※ textbook/gen/make_section.py が textbook/gen/data/u55_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U55S1K = {
  q: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s1qL","pts":[[478,360],[525.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw2","pts":[[525.5,360],[608,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw3","pts":[[710.5,280],[710.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw4","pts":[[1080.5,280],[1080.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw5","pts":[[710.5,280],[782.17,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw6","pts":[[842.17,280],[948.83,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw7","pts":[[1008.83,280],[1080.5,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw8","pts":[[710.5,440],[865.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw9","pts":[[925.5,440],[1080.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw10","pts":[[668,360],[710.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw11","pts":[[1080.5,360],[1088,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw12","pts":[[478,560],[635.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw13","pts":[[703.67,560],[894.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw14","pts":[[918.33,560],[1088,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw17","pts":[[1088,360],[1088,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1qw18","pts":[[1088,460],[1088,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[],"lab":[630,391.7,null]},{"t":"cap","k":"c","x":812.17,"y":280,"dir":"h","vis":[],"lab":[812.17,242.3,null],"fh":1,"f":"cap","F":30.5},{"t":"r","k":"r2","x":978.83,"y":280,"dir":"h","vis":[],"lab":[978.83,248.3,null]},{"t":"r","k":"r3","x":895.5,"y":440,"dir":"h","vis":[],"lab":[895.5,408.3,null]},{"t":"d","id":"u55s1qj113","x":710.5,"y":360,"vis":[]},{"t":"d","id":"u55s1qj214","x":1080.5,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[],"lab":[669.67,508.13,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[],"side":1,"lab":[906.33,605.87,null]},{"t":"d","id":"u55s1qj9","x":710.5,"y":360,"vis":[]},{"t":"d","id":"u55s1qj20","x":1080.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,312.2,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",6,[]],["R","c","n5","n6",1,[]],["R","r2","n6","n2",12,[]],["R","r3","n5","n2",12,[]],["C","sw","n1","n7",0,[1]],["E","src","n7","n2",36,[]]]},
  ql: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s1qlL","pts":[[478,360],[525.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw2","pts":[[525.5,360],[608,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw3","pts":[[710.5,280],[710.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw4","pts":[[1080.5,280],[1080.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw5","pts":[[710.5,280],[782.17,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw6","pts":[[842.17,280],[948.83,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw7","pts":[[1008.83,280],[1080.5,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw8","pts":[[710.5,440],[865.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw9","pts":[[925.5,440],[1080.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw10","pts":[[668,360],[710.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw11","pts":[[1080.5,360],[1088,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw12","pts":[[478,560],[635.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw13","pts":[[703.67,560],[894.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw14","pts":[[918.33,560],[1088,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw17","pts":[[1088,360],[1088,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1qlw18","pts":[[1088,460],[1088,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[],"lab":[630,389.66,null]},{"t":"ind","k":"l","x":812.17,"y":280,"dir":"h","vis":[],"lab":[812.17,250.34,null],"f":"ind","cd":1},{"t":"r","k":"r2","x":978.83,"y":280,"dir":"h","vis":[],"lab":[978.83,250.34,null]},{"t":"r","k":"r3","x":895.5,"y":440,"dir":"h","vis":[],"lab":[895.5,410.34,null]},{"t":"d","id":"u55s1qlj113","x":710.5,"y":360,"vis":[]},{"t":"d","id":"u55s1qlj214","x":1080.5,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[],"lab":[669.67,509.96,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[],"side":1,"lab":[906.33,604.04,null]},{"t":"d","id":"u55s1qlj9","x":710.5,"y":360,"vis":[]},{"t":"d","id":"u55s1qlj20","x":1080.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[1],"paths":[{"I":0.5,"pts":[[710.5,360],[710.5,280],[1080.5,280],[1080.5,360]]},{"I":0.5,"pts":[[710.5,360],[710.5,440],[1080.5,440],[1080.5,360]]},{"I":1,"pts":[[1080.5,360],[1088,360],[1088,560],[918.33,560]]},{"I":1,"pts":[[635.67,560],[478,560],[478,360],[710.5,360]]},{"I":1,"pts":[[894.33,560],[703.67,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",6,[]],["R","l","n5","n6",0,[]],["R","r2","n6","n2",12,[]],["R","r3","n5","n2",12,[]],["C","sw","n1","n7",0,[1]],["E","src","n7","n2",36,[]]]},
  ri: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s1riL","pts":[[478,360],[537.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw2","pts":[[537.25,360],[631.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw3","pts":[[745.75,280],[745.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw4","pts":[[1025.75,280],[1025.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw5","pts":[[745.75,280],[802.42,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw6","pts":[[802.42,280],[894.08,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw7","pts":[[954.08,280],[1025.75,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw8","pts":[[745.75,440],[855.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw9","pts":[[915.75,440],[1025.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw10","pts":[[691.5,360],[745.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw11","pts":[[1025.75,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw12","pts":[[478,560],[621.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw13","pts":[[689.33,560],[865.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw14","pts":[[889.67,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw17","pts":[[1045,360],[1045,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1riw18","pts":[[1045,460],[1045,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":661.5,"y":360,"dir":"h","vis":[],"lab":[661.5,329.5,null]},{"t":"r","k":"r2","x":924.08,"y":280,"dir":"h","vis":[],"lab":[924.08,249.5,null]},{"t":"r","k":"r3","x":885.75,"y":440,"dir":"h","vis":[],"lab":[885.75,409.5,null]},{"t":"d","id":"u55s1rij112","x":745.75,"y":360,"vis":[]},{"t":"d","id":"u55s1rij213","x":1025.75,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[],"lab":[655.33,509.21,null]},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[],"side":1,"lab":[877.67,604.79,null]},{"t":"d","id":"u55s1rij9","x":745.75,"y":360,"vis":[]},{"t":"d","id":"u55s1rij19","x":1025.75,"y":360,"vis":[]},{"t":"i","k":"i0","x0":517.25,"y0":343,"x1":557.25,"y1":343,"lab":[537.25,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[1],"paths":[{"I":0.5,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.5,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[621.33,560],[478,560],[478,360],[745.75,360]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",6,[]],["R","r2","n5","n2",12,[]],["R","r3","n5","n2",12,[]],["C","sw","n1","n6",0,[1]],["E","src","n6","n2",36,[]]]},
  rs: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s1rsL","pts":[[478,360],[534.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw2","pts":[[534.75,360],[626.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw3","pts":[[738.25,280],[738.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw4","pts":[[1028.25,280],[1028.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw5","pts":[[738.25,280],[774.92,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw6","pts":[[824.92,280],[896.58,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw7","pts":[[956.58,280],[1028.25,280]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw8","pts":[[738.25,440],[853.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw9","pts":[[913.25,440],[1028.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw10","pts":[[686.5,360],[738.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw11","pts":[[1028.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw12","pts":[[478,560],[621.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw13","pts":[[689.33,560],[865.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw14","pts":[[889.67,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw17","pts":[[1045,360],[1045,460]],"vis":[],"dash":0},{"t":"w","id":"u55s1rsw18","pts":[[1045,460],[1045,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":656.5,"y":360,"dir":"h","vis":[],"lab":[656.5,329.5,null]},{"t":"r","k":"r2","x":926.58,"y":280,"dir":"h","vis":[],"lab":[926.58,249.5,null]},{"t":"r","k":"r3","x":883.25,"y":440,"dir":"h","vis":[],"lab":[883.25,409.5,null]},{"t":"d","id":"u55s1rsj112","x":738.25,"y":360,"vis":[]},{"t":"d","id":"u55s1rsj213","x":1028.25,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[],"lab":[655.33,509.21,null]},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[],"side":1,"lab":[877.67,604.79,null]},{"t":"d","id":"u55s1rsj9","x":738.25,"y":360,"vis":[]},{"t":"d","id":"u55s1rsj20","x":1028.25,"y":360,"vis":[]},{"t":"i","k":"i","x0":514.75,"y0":343,"x1":554.75,"y1":343,"lab":[534.75,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[621.33,560],[478,560],[478,360],[738.25,360],[738.25,440],[1028.25,440],[1028.25,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",6,[]],["R","r2","n6","n2",12,[]],["R","r3","n5","n2",12,[]],["C","sw","n1","n7",0,[1]],["E","src","n7","n2",36,[]]]},
  ae: {"vars":[["s","swc",1],["a","t",0],["s","swc",1],["a","t",1],["s","swc",1],["a","t",2]],"items":[{"t":"w","id":"u55s1aeL","pts":[[478,360],[525.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew2","pts":[[525.5,360],[608,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew3","pts":[[710.5,280],[710.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew4","pts":[[1080.5,280],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew5","pts":[[710.5,280],[782.17,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew6","pts":[[842.17,280],[948.83,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew7","pts":[[1008.83,280],[1080.5,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew8","pts":[[710.5,440],[865.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew9","pts":[[925.5,440],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew10","pts":[[668,360],[710.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew11","pts":[[1080.5,360],[1088,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew12","pts":[[478,560],[635.67,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew13","pts":[[703.67,560],[894.33,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew14","pts":[[918.33,560],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew15","pts":[[478,360],[478,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew16","pts":[[478,460],[478,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew17","pts":[[1088,360],[1088,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aew18","pts":[[1088,460],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1aex1L","pts":[[478,360],[537.25,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w2","pts":[[537.25,360],[631.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w3","pts":[[745.75,280],[745.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w4","pts":[[1025.75,280],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w5","pts":[[745.75,280],[802.42,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w6","pts":[[802.42,280],[894.08,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w7","pts":[[954.08,280],[1025.75,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w8","pts":[[745.75,440],[855.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w9","pts":[[915.75,440],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w10","pts":[[691.5,360],[745.75,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w11","pts":[[1025.75,360],[1045,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w12","pts":[[478,560],[621.33,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w13","pts":[[689.33,560],[865.67,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w14","pts":[[889.67,560],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w15","pts":[[478,360],[478,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w16","pts":[[478,460],[478,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w17","pts":[[1045,360],[1045,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex1w18","pts":[[1045,460],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1aex2L","pts":[[478,360],[534.75,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w2","pts":[[534.75,360],[626.5,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w3","pts":[[738.25,280],[738.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w4","pts":[[1028.25,280],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w5","pts":[[738.25,280],[774.92,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w6","pts":[[824.92,280],[896.58,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w7","pts":[[956.58,280],[1028.25,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w8","pts":[[738.25,440],[853.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w9","pts":[[913.25,440],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w10","pts":[[686.5,360],[738.25,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w11","pts":[[1028.25,360],[1045,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w12","pts":[[478,560],[621.33,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w13","pts":[[689.33,560],[865.67,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w14","pts":[[889.67,560],[1045,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w15","pts":[[478,360],[478,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w16","pts":[[478,460],[478,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w17","pts":[[1045,360],[1045,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s1aex2w18","pts":[[1045,460],[1045,560]],"vis":[6],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[2],"lab":[630,391.74,null]},{"t":"cap","k":"c","x":812.17,"y":280,"dir":"h","vis":[2],"lab":[812.17,242.26,null],"fh":1,"f":"cap","F":30.6},{"t":"r","k":"r2","x":978.83,"y":280,"dir":"h","vis":[2],"lab":[978.83,248.26,null]},{"t":"r","k":"r3","x":895.5,"y":440,"dir":"h","vis":[2],"lab":[895.5,408.26,null]},{"t":"d","id":"u55s1aej113","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s1aej214","x":1080.5,"y":360,"vis":[2]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[2],"lab":[669.67,508.09,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[2],"side":1,"lab":[906.33,605.91,null]},{"t":"d","id":"u55s1aej9","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s1aej20","x":1080.5,"y":360,"vis":[2]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,312.16,null],"vis":[2],"ax":"h","iside":"up","io":1},{"t":"r","k":"r1","x":661.5,"y":360,"dir":"h","vis":[4],"lab":[661.5,328.26,null],"n":"r1x1"},{"t":"r","k":"r2","x":924.08,"y":280,"dir":"h","vis":[4],"lab":[924.08,248.26,null],"n":"r2x1"},{"t":"r","k":"r3","x":885.75,"y":440,"dir":"h","vis":[4],"lab":[885.75,408.26,null],"n":"r3x1"},{"t":"d","id":"u55s1aex1j112","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s1aex1j213","x":1025.75,"y":360,"vis":[4]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[4],"lab":[655.33,508.09,null],"n":"swx1"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[4],"side":1,"lab":[877.67,605.91,null],"n":"srcx1"},{"t":"d","id":"u55s1aex1j9","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s1aex1j19","x":1025.75,"y":360,"vis":[4]},{"t":"i","k":"i0","x0":517.25,"y0":343,"x1":557.25,"y1":343,"lab":[537.25,312.16,null],"vis":[4],"ax":"h","iside":"up","io":1,"n":"i0x1"},{"t":"r","k":"r1","x":656.5,"y":360,"dir":"h","vis":[6],"lab":[656.5,328.26,null],"n":"r1x2"},{"t":"r","k":"r2","x":926.58,"y":280,"dir":"h","vis":[6],"lab":[926.58,248.26,null],"n":"r2x2"},{"t":"r","k":"r3","x":883.25,"y":440,"dir":"h","vis":[6],"lab":[883.25,408.26,null],"n":"r3x2"},{"t":"d","id":"u55s1aex2j112","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s1aex2j213","x":1028.25,"y":360,"vis":[6]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[6],"lab":[655.33,508.09,null],"n":"swx2"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[6],"side":1,"lab":[877.67,605.91,null],"n":"srcx2"},{"t":"d","id":"u55s1aex2j9","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s1aex2j20","x":1028.25,"y":360,"vis":[6]},{"t":"i","k":"i","x0":514.75,"y0":343,"x1":554.75,"y1":343,"lab":[534.75,312.16,null],"vis":[6],"ax":"h","iside":"up","io":1,"n":"ix2"}],"flows":[{"c":[3,4],"paths":[{"I":0.5,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.5,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[621.33,560],[478,560],[478,360],[745.75,360]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-3,4],"paths":[]},{"c":[5,6],"paths":[{"I":1,"pts":[[621.33,560],[478,560],[478,360],[738.25,360],[738.25,440],[1028.25,440],[1028.25,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-5,6],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n5",6,[2]],["R","c","L0:n5","L0:n6",1,[2]],["R","r2","L0:n6","L0:n2",12,[2]],["R","r3","L0:n5","L0:n2",12,[2]],["C","sw","L0:n1","L0:n7",0,[1,2]],["E","src","L0:n7","L0:n2",36,[2]],["R","r1","L1:n1","L1:n5",6,[4]],["R","r2","L1:n5","L1:n2",12,[4]],["R","r3","L1:n5","L1:n2",12,[4]],["C","sw","L1:n1","L1:n6",0,[3,4]],["E","src","L1:n6","L1:n2",36,[4]],["R","r1","L2:n1","L2:n5",6,[6]],["R","r2","L2:n6","L2:n2",12,[6]],["R","r3","L2:n5","L2:n2",12,[6]],["C","sw","L2:n1","L2:n7",0,[5,6]],["E","src","L2:n7","L2:n2",36,[6]]]},
  xr: {"vars":[["s","swc",1],["a","t",0],["s","swc",1],["a","t",1],["s","swc",1],["a","t",2]],"items":[{"t":"w","id":"u55s1xrL","pts":[[478,360],[525.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw2","pts":[[525.5,360],[608,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw3","pts":[[710.5,280],[710.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw4","pts":[[1080.5,280],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw5","pts":[[710.5,280],[782.17,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw6","pts":[[842.17,280],[948.83,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw7","pts":[[1008.83,280],[1080.5,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw8","pts":[[710.5,440],[865.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw9","pts":[[925.5,440],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw10","pts":[[668,360],[710.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw11","pts":[[1080.5,360],[1088,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw12","pts":[[478,560],[635.67,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw13","pts":[[703.67,560],[894.33,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw14","pts":[[918.33,560],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw15","pts":[[478,360],[478,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw16","pts":[[478,460],[478,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw17","pts":[[1088,360],[1088,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrw18","pts":[[1088,460],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s1xrx1L","pts":[[478,360],[537.25,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w2","pts":[[537.25,360],[631.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w3","pts":[[745.75,280],[745.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w4","pts":[[1025.75,280],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w5","pts":[[745.75,280],[802.42,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w6","pts":[[802.42,280],[894.08,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w7","pts":[[954.08,280],[1025.75,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w8","pts":[[745.75,440],[855.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w9","pts":[[915.75,440],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w10","pts":[[691.5,360],[745.75,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w11","pts":[[1025.75,360],[1045,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w12","pts":[[478,560],[621.33,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w13","pts":[[689.33,560],[865.67,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w14","pts":[[889.67,560],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w15","pts":[[478,360],[478,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w16","pts":[[478,460],[478,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w17","pts":[[1045,360],[1045,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx1w18","pts":[[1045,460],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s1xrx2L","pts":[[478,360],[534.75,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w2","pts":[[534.75,360],[626.5,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w3","pts":[[738.25,280],[738.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w4","pts":[[1028.25,280],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w5","pts":[[738.25,280],[774.92,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w6","pts":[[824.92,280],[896.58,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w7","pts":[[956.58,280],[1028.25,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w8","pts":[[738.25,440],[853.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w9","pts":[[913.25,440],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w10","pts":[[686.5,360],[738.25,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w11","pts":[[1028.25,360],[1045,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w12","pts":[[478,560],[621.33,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w13","pts":[[689.33,560],[865.67,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w14","pts":[[889.67,560],[1045,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w15","pts":[[478,360],[478,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w16","pts":[[478,460],[478,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w17","pts":[[1045,360],[1045,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s1xrx2w18","pts":[[1045,460],[1045,560]],"vis":[6],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[2],"lab":[630,391.74,null]},{"t":"cap","k":"c","x":812.17,"y":280,"dir":"h","vis":[2],"lab":[812.17,242.26,null],"fh":1,"f":"cap","F":30.6},{"t":"r","k":"r2","x":978.83,"y":280,"dir":"h","vis":[2],"lab":[978.83,248.26,null]},{"t":"r","k":"r3","x":895.5,"y":440,"dir":"h","vis":[2],"lab":[895.5,408.26,null]},{"t":"d","id":"u55s1xrj113","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s1xrj214","x":1080.5,"y":360,"vis":[2]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[2],"lab":[669.67,508.09,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[2],"side":1,"lab":[906.33,605.91,null]},{"t":"d","id":"u55s1xrj9","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s1xrj20","x":1080.5,"y":360,"vis":[2]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,312.16,null],"vis":[2],"ax":"h","iside":"up","io":1},{"t":"r","k":"r1","x":661.5,"y":360,"dir":"h","vis":[4],"lab":[661.5,328.26,null],"n":"r1x1"},{"t":"r","k":"r2","x":924.08,"y":280,"dir":"h","vis":[4],"lab":[924.08,248.26,null],"n":"r2x1"},{"t":"r","k":"r3","x":885.75,"y":440,"dir":"h","vis":[4],"lab":[885.75,408.26,null],"n":"r3x1"},{"t":"d","id":"u55s1xrx1j112","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s1xrx1j213","x":1025.75,"y":360,"vis":[4]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[4],"lab":[655.33,508.09,null],"n":"swx1"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[4],"side":1,"lab":[877.67,605.91,null],"n":"srcx1"},{"t":"d","id":"u55s1xrx1j9","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s1xrx1j19","x":1025.75,"y":360,"vis":[4]},{"t":"i","k":"i0","x0":517.25,"y0":343,"x1":557.25,"y1":343,"lab":[537.25,312.16,null],"vis":[4],"ax":"h","iside":"up","io":1,"n":"i0x1"},{"t":"r","k":"r1","x":656.5,"y":360,"dir":"h","vis":[6],"lab":[656.5,328.26,null],"n":"r1x2"},{"t":"r","k":"r2","x":926.58,"y":280,"dir":"h","vis":[6],"lab":[926.58,248.26,null],"n":"r2x2"},{"t":"r","k":"r3","x":883.25,"y":440,"dir":"h","vis":[6],"lab":[883.25,408.26,null],"n":"r3x2"},{"t":"d","id":"u55s1xrx2j112","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s1xrx2j213","x":1028.25,"y":360,"vis":[6]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[6],"lab":[655.33,508.09,null],"n":"swx2"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[6],"side":1,"lab":[877.67,605.91,null],"n":"srcx2"},{"t":"d","id":"u55s1xrx2j9","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s1xrx2j20","x":1028.25,"y":360,"vis":[6]},{"t":"i","k":"i","x0":514.75,"y0":343,"x1":554.75,"y1":343,"lab":[534.75,312.16,null],"vis":[6],"ax":"h","iside":"up","io":1,"n":"ix2"}],"flows":[{"c":[3,4],"paths":[{"I":0.5,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.5,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[621.33,560],[478,560],[478,360],[745.75,360]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-3,4],"paths":[]},{"c":[5,6],"paths":[{"I":1,"pts":[[621.33,560],[478,560],[478,360],[738.25,360],[738.25,440],[1028.25,440],[1028.25,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-5,6],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n5",6,[2]],["R","c","L0:n5","L0:n6",1,[2]],["R","r2","L0:n6","L0:n2",12,[2]],["R","r3","L0:n5","L0:n2",12,[2]],["C","sw","L0:n1","L0:n7",0,[1,2]],["E","src","L0:n7","L0:n2",36,[2]],["R","r1","L1:n1","L1:n5",6,[4]],["R","r2","L1:n5","L1:n2",12,[4]],["R","r3","L1:n5","L1:n2",12,[4]],["C","sw","L1:n1","L1:n6",0,[3,4]],["E","src","L1:n6","L1:n2",36,[4]],["R","r1","L2:n1","L2:n5",6,[6]],["R","r2","L2:n6","L2:n2",12,[6]],["R","r3","L2:n5","L2:n2",12,[6]],["C","sw","L2:n1","L2:n7",0,[5,6]],["E","src","L2:n7","L2:n2",36,[6]]]}
};
function tbU55s1q(d, p, L){ tbFig_Draw(d, p, L, U55S1K.q); }
function tbU55s1ql(d, p, L){ tbFig_Draw(d, p, L, U55S1K.ql); }
function tbU55s1ri(d, p, L){ tbGen_Draw(d, p, L, U55S1K.ri); }
function tbU55s1rs(d, p, L){ tbGen_Draw(d, p, L, U55S1K.rs); }
function tbU55s1ae(d, p, L){ tbFig_Draw(d, p, L, U55S1K.ae); }
function tbU55s1xr(d, p, L){ tbFig_Draw(d, p, L, U55S1K.xr); }
// ---- 55-2 比から逆に抵抗を出す の図（※ textbook/gen/make_section.py が textbook/gen/data/u55_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U55S2K = {
  q: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s2qL","pts":[[478,360],[525.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw2","pts":[[525.5,360],[608,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw3","pts":[[710.5,280],[710.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw4","pts":[[1080.5,280],[1080.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw5","pts":[[710.5,280],[782.17,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw6","pts":[[842.17,280],[948.83,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw7","pts":[[1008.83,280],[1080.5,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw8","pts":[[710.5,440],[865.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw9","pts":[[925.5,440],[1080.5,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw10","pts":[[668,360],[710.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw11","pts":[[1080.5,360],[1088,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw12","pts":[[478,560],[635.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw13","pts":[[703.67,560],[894.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw14","pts":[[918.33,560],[1088,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw17","pts":[[1088,360],[1088,460]],"vis":[],"dash":0},{"t":"w","id":"u55s2qw18","pts":[[1088,460],[1088,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[],"lab":[630,328.3,null]},{"t":"cap","k":"c","x":812.17,"y":280,"dir":"h","vis":[],"lab":[812.17,242.3,null],"fh":1,"f":"cap","F":30.5},{"t":"r","k":"r3","x":978.83,"y":280,"dir":"h","vis":[],"lab":[978.83,248.3,null]},{"t":"r","k":"r2","x":895.5,"y":440,"dir":"h","vis":[],"lab":[895.5,408.3,null]},{"t":"d","id":"u55s2qj113","x":710.5,"y":360,"vis":[]},{"t":"d","id":"u55s2qj214","x":1080.5,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[],"lab":[669.67,508.13,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[],"side":1,"lab":[914.33,599.87,null]},{"t":"d","id":"u55s2qj9","x":710.5,"y":360,"vis":[]},{"t":"d","id":"u55s2qj20","x":1080.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,312.2,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",4,[]],["R","c","n5","n6",1,[]],["R","r3","n6","n2",6,[]],["R","r2","n5","n2",12,[]],["C","sw","n1","n7",0,[1]],["E","src","n7","n2",24,[]]]},
  ri: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s2riL","pts":[[478,360],[537.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw2","pts":[[537.25,360],[631.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw3","pts":[[745.75,280],[745.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw4","pts":[[1025.75,280],[1025.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw5","pts":[[745.75,280],[802.42,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw6","pts":[[802.42,280],[894.08,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw7","pts":[[954.08,280],[1025.75,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw8","pts":[[745.75,440],[855.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw9","pts":[[915.75,440],[1025.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw10","pts":[[691.5,360],[745.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw11","pts":[[1025.75,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw12","pts":[[478,560],[621.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw13","pts":[[689.33,560],[865.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw14","pts":[[889.67,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw17","pts":[[1045,360],[1045,460]],"vis":[],"dash":0},{"t":"w","id":"u55s2riw18","pts":[[1045,460],[1045,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":661.5,"y":360,"dir":"h","vis":[],"lab":[661.5,329.5,null]},{"t":"r","k":"r3","x":924.08,"y":280,"dir":"h","vis":[],"lab":[924.08,249.5,null]},{"t":"r","k":"r2","x":885.75,"y":440,"dir":"h","vis":[],"lab":[885.75,409.5,null]},{"t":"d","id":"u55s2rij112","x":745.75,"y":360,"vis":[]},{"t":"d","id":"u55s2rij213","x":1025.75,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[],"lab":[655.33,509.21,null]},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[],"side":1,"lab":[885.67,598.79,null]},{"t":"d","id":"u55s2rij9","x":745.75,"y":360,"vis":[]},{"t":"d","id":"u55s2rij19","x":1025.75,"y":360,"vis":[]},{"t":"i","k":"i0","x0":517.25,"y0":343,"x1":557.25,"y1":343,"lab":[537.25,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[1],"paths":[{"I":0.67,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.33,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[621.33,560],[478,560],[478,360],[745.75,360]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",4,[]],["R","r3","n5","n2",6,[]],["R","r2","n5","n2",12,[]],["C","sw","n1","n6",0,[1]],["E","src","n6","n2",24,[]]]},
  rs: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s2rsL","pts":[[478,360],[534.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw2","pts":[[534.75,360],[626.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw3","pts":[[738.25,280],[738.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw4","pts":[[1028.25,280],[1028.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw5","pts":[[738.25,280],[774.92,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw6","pts":[[824.92,280],[896.58,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw7","pts":[[956.58,280],[1028.25,280]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw8","pts":[[738.25,440],[853.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw9","pts":[[913.25,440],[1028.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw10","pts":[[686.5,360],[738.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw11","pts":[[1028.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw12","pts":[[478,560],[621.33,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw13","pts":[[689.33,560],[865.67,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw14","pts":[[889.67,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw17","pts":[[1045,360],[1045,460]],"vis":[],"dash":0},{"t":"w","id":"u55s2rsw18","pts":[[1045,460],[1045,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":656.5,"y":360,"dir":"h","vis":[],"lab":[656.5,329.5,null]},{"t":"r","k":"r3","x":926.58,"y":280,"dir":"h","vis":[],"lab":[926.58,249.5,null]},{"t":"r","k":"r2","x":883.25,"y":440,"dir":"h","vis":[],"lab":[883.25,409.5,null]},{"t":"d","id":"u55s2rsj112","x":738.25,"y":360,"vis":[]},{"t":"d","id":"u55s2rsj213","x":1028.25,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[],"lab":[655.33,509.21,null]},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[],"side":1,"lab":[885.67,598.79,null]},{"t":"d","id":"u55s2rsj9","x":738.25,"y":360,"vis":[]},{"t":"d","id":"u55s2rsj20","x":1028.25,"y":360,"vis":[]},{"t":"i","k":"i","x0":514.75,"y0":343,"x1":554.75,"y1":343,"lab":[534.75,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[621.33,560],[478,560],[478,360],[738.25,360],[738.25,440],[1028.25,440],[1028.25,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",4,[]],["R","r3","n6","n2",6,[]],["R","r2","n5","n2",12,[]],["C","sw","n1","n7",0,[1]],["E","src","n7","n2",24,[]]]},
  ae: {"vars":[["s","swc",1],["a","t",0],["s","swc",1],["a","t",1],["s","swc",1],["a","t",2]],"items":[{"t":"w","id":"u55s2aeL","pts":[[478,360],[525.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew2","pts":[[525.5,360],[608,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew3","pts":[[710.5,280],[710.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew4","pts":[[1080.5,280],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew5","pts":[[710.5,280],[782.17,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew6","pts":[[842.17,280],[948.83,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew7","pts":[[1008.83,280],[1080.5,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew8","pts":[[710.5,440],[865.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew9","pts":[[925.5,440],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew10","pts":[[668,360],[710.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew11","pts":[[1080.5,360],[1088,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew12","pts":[[478,560],[635.67,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew13","pts":[[703.67,560],[894.33,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew14","pts":[[918.33,560],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew15","pts":[[478,360],[478,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew16","pts":[[478,460],[478,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew17","pts":[[1088,360],[1088,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aew18","pts":[[1088,460],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2aex1L","pts":[[478,360],[537.25,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w2","pts":[[537.25,360],[631.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w3","pts":[[745.75,280],[745.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w4","pts":[[1025.75,280],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w5","pts":[[745.75,280],[802.42,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w6","pts":[[802.42,280],[894.08,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w7","pts":[[954.08,280],[1025.75,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w8","pts":[[745.75,440],[855.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w9","pts":[[915.75,440],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w10","pts":[[691.5,360],[745.75,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w11","pts":[[1025.75,360],[1045,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w12","pts":[[478,560],[621.33,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w13","pts":[[689.33,560],[865.67,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w14","pts":[[889.67,560],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w15","pts":[[478,360],[478,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w16","pts":[[478,460],[478,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w17","pts":[[1045,360],[1045,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex1w18","pts":[[1045,460],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2aex2L","pts":[[478,360],[534.75,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w2","pts":[[534.75,360],[626.5,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w3","pts":[[738.25,280],[738.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w4","pts":[[1028.25,280],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w5","pts":[[738.25,280],[774.92,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w6","pts":[[824.92,280],[896.58,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w7","pts":[[956.58,280],[1028.25,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w8","pts":[[738.25,440],[853.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w9","pts":[[913.25,440],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w10","pts":[[686.5,360],[738.25,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w11","pts":[[1028.25,360],[1045,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w12","pts":[[478,560],[621.33,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w13","pts":[[689.33,560],[865.67,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w14","pts":[[889.67,560],[1045,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w15","pts":[[478,360],[478,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w16","pts":[[478,460],[478,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w17","pts":[[1045,360],[1045,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s2aex2w18","pts":[[1045,460],[1045,560]],"vis":[6],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[2],"lab":[630,328.28,null]},{"t":"cap","k":"c","x":812.17,"y":280,"dir":"h","vis":[2],"lab":[812.17,242.28,null],"fh":1,"f":"cap","F":30.5},{"t":"r","k":"r3","x":978.83,"y":280,"dir":"h","vis":[2],"lab":[978.83,248.28,null]},{"t":"r","k":"r2","x":895.5,"y":440,"dir":"h","vis":[2],"lab":[895.5,408.28,null]},{"t":"d","id":"u55s2aej113","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s2aej214","x":1080.5,"y":360,"vis":[2]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[2],"lab":[669.67,508.12,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[2],"side":1,"lab":[914.33,599.88,null]},{"t":"d","id":"u55s2aej9","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s2aej20","x":1080.5,"y":360,"vis":[2]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,312.18,null],"vis":[2],"ax":"h","iside":"up","io":1},{"t":"r","k":"r1","x":661.5,"y":360,"dir":"h","vis":[4],"lab":[661.5,328.28,null],"n":"r1x1"},{"t":"r","k":"r3","x":924.08,"y":280,"dir":"h","vis":[4],"lab":[924.08,248.28,null],"n":"r3x1"},{"t":"r","k":"r2","x":885.75,"y":440,"dir":"h","vis":[4],"lab":[885.75,408.28,null],"n":"r2x1"},{"t":"d","id":"u55s2aex1j112","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s2aex1j213","x":1025.75,"y":360,"vis":[4]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[4],"lab":[655.33,508.12,null],"n":"swx1"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[4],"side":1,"lab":[885.67,599.88,null],"n":"srcx1"},{"t":"d","id":"u55s2aex1j9","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s2aex1j19","x":1025.75,"y":360,"vis":[4]},{"t":"i","k":"i0","x0":517.25,"y0":343,"x1":557.25,"y1":343,"lab":[537.25,312.18,null],"vis":[4],"ax":"h","iside":"up","io":1,"n":"i0x1"},{"t":"r","k":"r1","x":656.5,"y":360,"dir":"h","vis":[6],"lab":[656.5,328.28,null],"n":"r1x2"},{"t":"r","k":"r3","x":926.58,"y":280,"dir":"h","vis":[6],"lab":[926.58,248.28,null],"n":"r3x2"},{"t":"r","k":"r2","x":883.25,"y":440,"dir":"h","vis":[6],"lab":[883.25,408.28,null],"n":"r2x2"},{"t":"d","id":"u55s2aex2j112","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s2aex2j213","x":1028.25,"y":360,"vis":[6]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[6],"lab":[655.33,508.12,null],"n":"swx2"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[6],"side":1,"lab":[885.67,599.88,null],"n":"srcx2"},{"t":"d","id":"u55s2aex2j9","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s2aex2j20","x":1028.25,"y":360,"vis":[6]},{"t":"i","k":"i","x0":514.75,"y0":343,"x1":554.75,"y1":343,"lab":[534.75,312.18,null],"vis":[6],"ax":"h","iside":"up","io":1,"n":"ix2"}],"flows":[{"c":[3,4],"paths":[{"I":0.67,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.33,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[621.33,560],[478,560],[478,360],[745.75,360]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-3,4],"paths":[]},{"c":[5,6],"paths":[{"I":1,"pts":[[621.33,560],[478,560],[478,360],[738.25,360],[738.25,440],[1028.25,440],[1028.25,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-5,6],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n5",4,[2]],["R","c","L0:n5","L0:n6",1,[2]],["R","r3","L0:n6","L0:n2",6,[2]],["R","r2","L0:n5","L0:n2",12,[2]],["C","sw","L0:n1","L0:n7",0,[1,2]],["E","src","L0:n7","L0:n2",24,[2]],["R","r1","L1:n1","L1:n5",4,[4]],["R","r3","L1:n5","L1:n2",6,[4]],["R","r2","L1:n5","L1:n2",12,[4]],["C","sw","L1:n1","L1:n6",0,[3,4]],["E","src","L1:n6","L1:n2",24,[4]],["R","r1","L2:n1","L2:n5",4,[6]],["R","r3","L2:n6","L2:n2",6,[6]],["R","r2","L2:n5","L2:n2",12,[6]],["C","sw","L2:n1","L2:n7",0,[5,6]],["E","src","L2:n7","L2:n2",24,[6]]]},
  xr: {"vars":[["s","swc",1],["a","t",0],["s","swc",1],["a","t",1],["s","swc",1],["a","t",2]],"items":[{"t":"w","id":"u55s2xrL","pts":[[478,360],[525.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw2","pts":[[525.5,360],[608,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw3","pts":[[710.5,280],[710.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw4","pts":[[1080.5,280],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw5","pts":[[710.5,280],[782.17,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw6","pts":[[842.17,280],[948.83,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw7","pts":[[1008.83,280],[1080.5,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw8","pts":[[710.5,440],[865.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw9","pts":[[925.5,440],[1080.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw10","pts":[[668,360],[710.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw11","pts":[[1080.5,360],[1088,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw12","pts":[[478,560],[635.67,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw13","pts":[[703.67,560],[894.33,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw14","pts":[[918.33,560],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw15","pts":[[478,360],[478,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw16","pts":[[478,460],[478,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw17","pts":[[1088,360],[1088,460]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrw18","pts":[[1088,460],[1088,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s2xrx1L","pts":[[478,360],[537.25,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w2","pts":[[537.25,360],[631.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w3","pts":[[745.75,280],[745.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w4","pts":[[1025.75,280],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w5","pts":[[745.75,280],[802.42,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w6","pts":[[802.42,280],[894.08,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w7","pts":[[954.08,280],[1025.75,280]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w8","pts":[[745.75,440],[855.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w9","pts":[[915.75,440],[1025.75,440]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w10","pts":[[691.5,360],[745.75,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w11","pts":[[1025.75,360],[1045,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w12","pts":[[478,560],[621.33,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w13","pts":[[689.33,560],[865.67,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w14","pts":[[889.67,560],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w15","pts":[[478,360],[478,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w16","pts":[[478,460],[478,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w17","pts":[[1045,360],[1045,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx1w18","pts":[[1045,460],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s2xrx2L","pts":[[478,360],[534.75,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w2","pts":[[534.75,360],[626.5,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w3","pts":[[738.25,280],[738.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w4","pts":[[1028.25,280],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w5","pts":[[738.25,280],[774.92,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w6","pts":[[824.92,280],[896.58,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w7","pts":[[956.58,280],[1028.25,280]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w8","pts":[[738.25,440],[853.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w9","pts":[[913.25,440],[1028.25,440]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w10","pts":[[686.5,360],[738.25,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w11","pts":[[1028.25,360],[1045,360]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w12","pts":[[478,560],[621.33,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w13","pts":[[689.33,560],[865.67,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w14","pts":[[889.67,560],[1045,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w15","pts":[[478,360],[478,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w16","pts":[[478,460],[478,560]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w17","pts":[[1045,360],[1045,460]],"vis":[6],"dash":0},{"t":"w","id":"u55s2xrx2w18","pts":[[1045,460],[1045,560]],"vis":[6],"dash":0},{"t":"r","k":"r1","x":638,"y":360,"dir":"h","vis":[2],"lab":[630,328.28,null]},{"t":"cap","k":"c","x":812.17,"y":280,"dir":"h","vis":[2],"lab":[812.17,242.28,null],"fh":1,"f":"cap","F":30.5},{"t":"r","k":"r3","x":978.83,"y":280,"dir":"h","vis":[2],"lab":[978.83,248.28,null]},{"t":"r","k":"r2","x":895.5,"y":440,"dir":"h","vis":[2],"lab":[895.5,408.28,null]},{"t":"d","id":"u55s2xrj113","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s2xrj214","x":1080.5,"y":360,"vis":[2]},{"t":"s","k":"sw","dir":"h","x0":635.67,"y0":560,"x1":703.67,"y1":560,"v":1,"vis":[2],"lab":[669.67,508.12,null]},{"t":"e","k":"src","dir":"h","xp":894.33,"yp":560,"xm":918.33,"ym":560,"vis":[2],"side":1,"lab":[914.33,599.88,null]},{"t":"d","id":"u55s2xrj9","x":710.5,"y":360,"vis":[2]},{"t":"d","id":"u55s2xrj20","x":1080.5,"y":360,"vis":[2]},{"t":"i","k":"i","x0":505.5,"y0":343,"x1":545.5,"y1":343,"lab":[525.5,312.18,null],"vis":[2],"ax":"h","iside":"up","io":1},{"t":"r","k":"r1","x":661.5,"y":360,"dir":"h","vis":[4],"lab":[661.5,328.28,null],"n":"r1x1"},{"t":"r","k":"r3","x":924.08,"y":280,"dir":"h","vis":[4],"lab":[924.08,248.28,null],"n":"r3x1"},{"t":"r","k":"r2","x":885.75,"y":440,"dir":"h","vis":[4],"lab":[885.75,408.28,null],"n":"r2x1"},{"t":"d","id":"u55s2xrx1j112","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s2xrx1j213","x":1025.75,"y":360,"vis":[4]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[4],"lab":[655.33,508.12,null],"n":"swx1"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[4],"side":1,"lab":[885.67,599.88,null],"n":"srcx1"},{"t":"d","id":"u55s2xrx1j9","x":745.75,"y":360,"vis":[4]},{"t":"d","id":"u55s2xrx1j19","x":1025.75,"y":360,"vis":[4]},{"t":"i","k":"i0","x0":517.25,"y0":343,"x1":557.25,"y1":343,"lab":[537.25,312.18,null],"vis":[4],"ax":"h","iside":"up","io":1,"n":"i0x1"},{"t":"r","k":"r1","x":656.5,"y":360,"dir":"h","vis":[6],"lab":[656.5,328.28,null],"n":"r1x2"},{"t":"r","k":"r3","x":926.58,"y":280,"dir":"h","vis":[6],"lab":[926.58,248.28,null],"n":"r3x2"},{"t":"r","k":"r2","x":883.25,"y":440,"dir":"h","vis":[6],"lab":[883.25,408.28,null],"n":"r2x2"},{"t":"d","id":"u55s2xrx2j112","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s2xrx2j213","x":1028.25,"y":360,"vis":[6]},{"t":"s","k":"sw","dir":"h","x0":621.33,"y0":560,"x1":689.33,"y1":560,"v":1,"vis":[6],"lab":[655.33,508.12,null],"n":"swx2"},{"t":"e","k":"src","dir":"h","xp":865.67,"yp":560,"xm":889.67,"ym":560,"vis":[6],"side":1,"lab":[885.67,599.88,null],"n":"srcx2"},{"t":"d","id":"u55s2xrx2j9","x":738.25,"y":360,"vis":[6]},{"t":"d","id":"u55s2xrx2j20","x":1028.25,"y":360,"vis":[6]},{"t":"i","k":"i","x0":514.75,"y0":343,"x1":554.75,"y1":343,"lab":[534.75,312.18,null],"vis":[6],"ax":"h","iside":"up","io":1,"n":"ix2"}],"flows":[{"c":[3,4],"paths":[{"I":0.67,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.33,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[621.33,560],[478,560],[478,360],[745.75,360]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-3,4],"paths":[]},{"c":[5,6],"paths":[{"I":1,"pts":[[621.33,560],[478,560],[478,360],[738.25,360],[738.25,440],[1028.25,440],[1028.25,360],[1045,360],[1045,560],[889.67,560]]},{"I":1,"pts":[[865.67,560],[689.33,560]]}]},{"c":[-5,6],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n5",4,[2]],["R","c","L0:n5","L0:n6",1,[2]],["R","r3","L0:n6","L0:n2",6,[2]],["R","r2","L0:n5","L0:n2",12,[2]],["C","sw","L0:n1","L0:n7",0,[1,2]],["E","src","L0:n7","L0:n2",24,[2]],["R","r1","L1:n1","L1:n5",4,[4]],["R","r3","L1:n5","L1:n2",6,[4]],["R","r2","L1:n5","L1:n2",12,[4]],["C","sw","L1:n1","L1:n6",0,[3,4]],["E","src","L1:n6","L1:n2",24,[4]],["R","r1","L2:n1","L2:n5",4,[6]],["R","r3","L2:n6","L2:n2",6,[6]],["R","r2","L2:n5","L2:n2",12,[6]],["C","sw","L2:n1","L2:n7",0,[5,6]],["E","src","L2:n7","L2:n2",24,[6]]]}
};
function tbU55s2q(d, p, L){ tbFig_Draw(d, p, L, U55S2K.q); }
function tbU55s2ri(d, p, L){ tbGen_Draw(d, p, L, U55S2K.ri); }
function tbU55s2rs(d, p, L){ tbGen_Draw(d, p, L, U55S2K.rs); }
function tbU55s2ae(d, p, L){ tbFig_Draw(d, p, L, U55S2K.ae); }
function tbU55s2xr(d, p, L){ tbFig_Draw(d, p, L, U55S2K.xr); }
// ---- 55-3 定常のエネルギーの和 の図（※ textbook/gen/make_section.py が textbook/gen/data/u55_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U55S3K = {
  q: {"vars":[],"items":[{"t":"w","id":"u55s3qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u55s3qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw1","pts":[[478,360],[519.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw2","pts":[[579.75,360],[656.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw3","pts":[[758.25,280],[758.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw4","pts":[[1038.25,280],[1038.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw5","pts":[[758.25,280],[868.25,280]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw6","pts":[[928.25,280],[1038.25,280]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw7","pts":[[758.25,440],[868.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw8","pts":[[928.25,440],[1038.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw9","pts":[[716.5,360],[758.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3qw10","pts":[[1038.25,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.32,null]},{"t":"r","k":"r1","x":549.75,"y":360,"dir":"h","vis":[],"lab":[549.75,325.56,null]},{"t":"ind","k":"l","x":686.5,"y":360,"dir":"h","vis":[],"lab":[646.5,394.44,null],"f":"ind","cd":1},{"t":"r","k":"r2","x":898.25,"y":280,"dir":"h","vis":[],"lab":[898.25,245.56,null]},{"t":"v","k":"vc","x":898.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[898.25,171.68,null]},{"t":"cap","k":"c","x":898.25,"y":440,"dir":"h","vis":[],"lab":[898.25,399.56,null],"fh":1,"f":"cap","F":35.2},{"t":"d","id":"u55s3qj116","x":758.25,"y":360,"vis":[]},{"t":"d","id":"u55s3qj217","x":1038.25,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","n1",2,[]],["R","l","n1","n2",0,[]],["R","r2","n2","N",4,[]],["R","c","n2","N",1,[]]]},
  rs: {"vars":[],"items":[{"t":"w","id":"u55s3rsL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw1","pts":[[478,360],[542.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw2","pts":[[602.25,360],[686.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw3","pts":[[735.75,280],[735.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw4","pts":[[1015.75,280],[1015.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw5","pts":[[735.75,280],[845.75,280]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw6","pts":[[905.75,280],[1015.75,280]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw7","pts":[[735.75,440],[850.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw8","pts":[[900.75,440],[1015.75,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw9","pts":[[686.5,360],[735.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3rsw10","pts":[[1015.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":572.25,"y":360,"dir":"h","vis":[],"lab":[572.25,325.6,null]},{"t":"r","k":"r2","x":875.75,"y":280,"dir":"h","vis":[],"lab":[875.75,245.6,null]},{"t":"v","k":"vc","x":875.75,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[875.75,171.71,null]},{"t":"d","id":"u55s3rsj114","x":735.75,"y":360,"vis":[]},{"t":"d","id":"u55s3rsj215","x":1015.75,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[735.75,360],[735.75,280],[1015.75,280],[1015.75,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",4,[]]]},
  two: {"vars":[],"items":[{"t":"w","id":"u55s3twoL","pts":[[493,280],[493,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow2","pts":[[863,280],[863,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow3","pts":[[493,280],[648,280]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow4","pts":[[708,280],[863,280]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow5","pts":[[493,440],[564.67,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow6","pts":[[624.67,440],[731.33,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow7","pts":[[791.33,440],[863,440]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow8","pts":[[478,360],[493,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow9","pts":[[863,360],[878,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow10","pts":[[478,670],[878,670]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow11","pts":[[878,360],[1161.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow12","pts":[[878,670],[1161.5,670]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow13","pts":[[478,360],[478,503]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow14","pts":[[478,527],[478,670]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow15","pts":[[878,360],[878,407.5]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow16","pts":[[878,467.5],[878,515]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow17","pts":[[878,515],[878,562.5]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow18","pts":[[878,622.5],[878,670]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow19","pts":[[1161.5,360],[1161.5,485]],"vis":[],"dash":0},{"t":"w","id":"u55s3twow20","pts":[[1161.5,545],[1161.5,670]],"vis":[],"dash":0},{"t":"cap","k":"c1","x":678,"y":280,"dir":"h","vis":[],"lab":[678,244.34,null],"fh":1,"f":"cap","F":27},{"t":"ind","k":"l1","x":594.67,"y":440,"dir":"h","vis":[],"lab":[594.67,410.34,null],"f":"ind","cd":1},{"t":"r","k":"r1","x":761.33,"y":440,"dir":"h","vis":[],"lab":[761.33,410.34,null]},{"t":"d","id":"u55s3twoj110","x":493,"y":360,"vis":[]},{"t":"d","id":"u55s3twoj211","x":863,"y":360,"vis":[]},{"t":"e","k":"src","dir":"v","xp":478,"yp":503,"xm":478,"ym":527,"vis":[],"side":-1,"lab":[515.62,515,"start"]},{"t":"ind","k":"l2","x":878,"y":437.5,"dir":"v","vis":[],"lab":[897.62,437.5,"start"],"f":"ind","cd":1},{"t":"r","k":"r2","x":878,"y":592.5,"dir":"v","vis":[],"lab":[897.62,592.5,"start"]},{"t":"cap","k":"c2","x":1161.5,"y":515,"dir":"v","vis":[],"lab":[1187.12,515,"start"],"fh":1,"f":"cap","F":27},{"t":"d","id":"u55s3twoj5","x":493,"y":360,"vis":[]},{"t":"d","id":"u55s3twoj14","x":863,"y":360,"vis":[]},{"t":"d","id":"u55s3twoj16","x":878,"y":360,"vis":[]},{"t":"d","id":"u55s3twoj22","x":878,"y":670,"vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","c1","n1","n2",1,[]],["R","l1","n1","n7",0,[]],["R","r1","n7","n2",2,[]],["E","src","n1","n4",12,[]],["R","l2","n2","n8",0,[]],["R","r2","n8","n4",4,[]],["R","c2","n2","n4",1,[]]]},
  ae: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u55s3aeL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew1","pts":[[478,360],[519.75,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew2","pts":[[579.75,360],[656.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew3","pts":[[758.25,280],[758.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew4","pts":[[1038.25,280],[1038.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew5","pts":[[758.25,280],[868.25,280]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew6","pts":[[928.25,280],[1038.25,280]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew7","pts":[[758.25,440],[868.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew8","pts":[[928.25,440],[1038.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew9","pts":[[716.5,360],[758.25,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aew10","pts":[[1038.25,360],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3aex1L","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w1","pts":[[478,360],[542.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w2","pts":[[602.25,360],[686.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w3","pts":[[735.75,280],[735.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w4","pts":[[1015.75,280],[1015.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w5","pts":[[735.75,280],[845.75,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w6","pts":[[905.75,280],[1015.75,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w7","pts":[[735.75,440],[850.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w8","pts":[[900.75,440],[1015.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w9","pts":[[686.5,360],[735.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3aex1w10","pts":[[1015.75,360],[1045,360]],"vis":[2],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,608.32,null]},{"t":"r","k":"r1","x":549.75,"y":360,"dir":"h","vis":[1],"lab":[549.75,325.56,null]},{"t":"ind","k":"l","x":686.5,"y":360,"dir":"h","vis":[1],"lab":[646.5,394.44,null],"f":"ind","cd":1},{"t":"r","k":"r2","x":898.25,"y":280,"dir":"h","vis":[1],"lab":[898.25,245.56,null]},{"t":"v","k":"vc","x":898.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[1],"elem":"r2","lab":[898.25,171.68,null]},{"t":"cap","k":"c","x":898.25,"y":440,"dir":"h","vis":[1],"lab":[898.25,399.56,null],"fh":1,"f":"cap","F":35.2},{"t":"d","id":"u55s3aej116","x":758.25,"y":360,"vis":[1]},{"t":"d","id":"u55s3aej217","x":1038.25,"y":360,"vis":[1]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[1],"ax":"v","sd":-1,"io":1},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,608.29,null],"n":"srcx1"},{"t":"r","k":"r1","x":572.25,"y":360,"dir":"h","vis":[2],"lab":[572.25,325.6,null],"n":"r1x1"},{"t":"r","k":"r2","x":875.75,"y":280,"dir":"h","vis":[2],"lab":[875.75,245.6,null],"n":"r2x1"},{"t":"v","k":"vc","x":875.75,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[2],"elem":"r2","lab":[875.75,171.71,null],"n":"vcx1"},{"t":"d","id":"u55s3aex1j114","x":735.75,"y":360,"vis":[2]},{"t":"d","id":"u55s3aex1j215","x":1015.75,"y":360,"vis":[2]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[2],"ax":"v","sd":-1,"io":1,"n":"ix1"}],"flows":[{"c":[2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[735.75,360],[735.75,280],[1015.75,280],[1015.75,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",12,[1]],["R","r1","L0:P","L0:n1",2,[1]],["R","l","L0:n1","L0:n2",0,[1]],["R","r2","L0:n2","L0:N",4,[1]],["R","c","L0:n2","L0:N",1,[1]],["E","src","L1:P","L1:N",12,[2]],["R","r1","L1:P","L1:n1",2,[2]],["R","r2","L1:n1","L1:N",4,[2]]]},
  xr: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u55s3xrL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw1","pts":[[478,360],[519.75,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw2","pts":[[579.75,360],[656.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw3","pts":[[758.25,280],[758.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw4","pts":[[1038.25,280],[1038.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw5","pts":[[758.25,280],[868.25,280]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw6","pts":[[928.25,280],[1038.25,280]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw7","pts":[[758.25,440],[868.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw8","pts":[[928.25,440],[1038.25,440]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw9","pts":[[716.5,360],[758.25,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrw10","pts":[[1038.25,360],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u55s3xrx1L","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w1","pts":[[478,360],[542.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w2","pts":[[602.25,360],[686.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w3","pts":[[735.75,280],[735.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w4","pts":[[1015.75,280],[1015.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w5","pts":[[735.75,280],[845.75,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w6","pts":[[905.75,280],[1015.75,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w7","pts":[[735.75,440],[850.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w8","pts":[[900.75,440],[1015.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w9","pts":[[686.5,360],[735.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s3xrx1w10","pts":[[1015.75,360],[1045,360]],"vis":[2],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,608.32,null]},{"t":"r","k":"r1","x":549.75,"y":360,"dir":"h","vis":[1],"lab":[549.75,325.56,null]},{"t":"ind","k":"l","x":686.5,"y":360,"dir":"h","vis":[1],"lab":[646.5,394.44,null],"f":"ind","cd":1},{"t":"r","k":"r2","x":898.25,"y":280,"dir":"h","vis":[1],"lab":[898.25,245.56,null]},{"t":"v","k":"vc","x":898.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[1],"elem":"r2","lab":[898.25,171.68,null]},{"t":"cap","k":"c","x":898.25,"y":440,"dir":"h","vis":[1],"lab":[898.25,399.56,null],"fh":1,"f":"cap","F":35.2},{"t":"d","id":"u55s3xrj116","x":758.25,"y":360,"vis":[1]},{"t":"d","id":"u55s3xrj217","x":1038.25,"y":360,"vis":[1]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[1],"ax":"v","sd":-1,"io":1},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,608.29,null],"n":"srcx1"},{"t":"r","k":"r1","x":572.25,"y":360,"dir":"h","vis":[2],"lab":[572.25,325.6,null],"n":"r1x1"},{"t":"r","k":"r2","x":875.75,"y":280,"dir":"h","vis":[2],"lab":[875.75,245.6,null],"n":"r2x1"},{"t":"v","k":"vc","x":875.75,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[2],"elem":"r2","lab":[875.75,171.71,null],"n":"vcx1"},{"t":"d","id":"u55s3xrx1j114","x":735.75,"y":360,"vis":[2]},{"t":"d","id":"u55s3xrx1j215","x":1015.75,"y":360,"vis":[2]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[2],"ax":"v","sd":-1,"io":1,"n":"ix1"}],"flows":[{"c":[2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[735.75,360],[735.75,280],[1015.75,280],[1015.75,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",12,[1]],["R","r1","L0:P","L0:n1",2,[1]],["R","l","L0:n1","L0:n2",0,[1]],["R","r2","L0:n2","L0:N",4,[1]],["R","c","L0:n2","L0:N",1,[1]],["E","src","L1:P","L1:N",12,[2]],["R","r1","L1:P","L1:n1",2,[2]],["R","r2","L1:n1","L1:N",4,[2]]]}
};
function tbU55s3q(d, p, L){ tbFig_Draw(d, p, L, U55S3K.q); }
function tbU55s3rs(d, p, L){ tbGen_Draw(d, p, L, U55S3K.rs); }
function tbU55s3two(d, p, L){ tbFig_Draw(d, p, L, U55S3K.two); }
function tbU55s3ae(d, p, L){ tbFig_Draw(d, p, L, U55S3K.ae); }
function tbU55s3xr(d, p, L){ tbFig_Draw(d, p, L, U55S3K.xr); }
// ---- 55-4 テブナンで時定数と最後の電圧 の図（※ textbook/gen/make_section.py が textbook/gen/data/u55_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U55S4K = {
  q: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s4qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u55s4qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw1","pts":[[478,360],[524.75,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw2","pts":[[584.75,360],[652.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw3","pts":[[753.25,280],[753.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw4","pts":[[1033.25,280],[1033.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw5","pts":[[753.25,280],[863.25,280]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw6","pts":[[923.25,280],[1033.25,280]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw7","pts":[[753.25,440],[863.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw8","pts":[[923.25,440],[1033.25,440]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw9","pts":[[720.5,360],[753.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4qw10","pts":[[1033.25,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,605.21,null]},{"t":"r","k":"r1","x":554.75,"y":360,"dir":"h","vis":[],"lab":[554.75,329.03,null]},{"t":"s","k":"sw","dir":"h","x0":652.5,"y0":360,"x1":720.5,"y1":360,"v":1,"vis":[],"lab":[686.5,308.79,null]},{"t":"r","k":"r2","x":893.25,"y":280,"dir":"h","vis":[],"lab":[893.25,249.03,null]},{"t":"v","k":"vc","x":893.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[893.25,174.79,null]},{"t":"cap","k":"c","x":893.25,"y":440,"dir":"h","vis":[],"lab":[893.25,403.03,null],"fh":1,"f":"cap","F":29.3},{"t":"d","id":"u55s4qj116","x":753.25,"y":360,"vis":[]},{"t":"d","id":"u55s4qj217","x":1033.25,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","n1",6,[]],["C","sw","n1","n2",0,[1]],["R","r2","n2","N",3,[]],["R","c","n2","N",1,[]]]},
  th: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u55s4thL","pts":[[478,360],[527.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw2","pts":[[587.5,360],[658,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw3","pts":[[726,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw4","pts":[[478,560],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw5","pts":[[761.5,360],[903.25,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw6","pts":[[903.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw7","pts":[[761.5,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw8","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw9","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw10","pts":[[761.5,360],[761.5,430]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw11","pts":[[761.5,490],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw12","pts":[[1045,405],[1045,430]],"vis":[],"dash":1},{"t":"w","id":"u55s4thw13","pts":[[1045,490],[1045,515]],"vis":[],"dash":1},{"t":"w","id":"u55s4thw14","pts":[[1045,360],[1045,405]],"vis":[],"dash":0},{"t":"w","id":"u55s4thw15","pts":[[1045,515],[1045,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":557.5,"y":360,"dir":"h","vis":[],"lab":[557.5,323.32,null]},{"t":"s","k":"sw","dir":"h","x0":658,"y0":360,"x1":726,"y1":360,"v":1,"vis":[],"lab":[692,303.66,null]},{"t":"r","k":"r2","x":761.5,"y":460,"dir":"v","vis":[],"lab":[781.85,460,"start"]},{"t":"r","k":"r0","x":1045,"y":460,"dir":"v","vis":[],"lab":[1069,460,"start"],"dash":1},{"t":"dimv","k":"rab","x1":1061,"xt":1125,"xa":1115,"y1":405,"y2":515,"sd":1,"vis":[],"lab":[1125,460,"start"]},{"t":"d","id":"u55s4thj7","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u55s4thj10","x":761.5,"y":560,"vis":[]}],"flows":[{"c":[1],"paths":[]},{"c":[-1],"paths":[]}],"base":110,"von":[],"bands":"never","pts":[],"net":[["R","r1","n1","n7",6,[]],["C","sw","n7","n2",0,[1]],["R","r2","n2","n1",3,[]]]},
  ae: {"vars":[["s","swc",1],["a","t",0],["s","swc",1],["a","t",1]],"items":[{"t":"w","id":"u55s4aeL","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew1","pts":[[478,360],[524.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew2","pts":[[584.75,360],[652.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew3","pts":[[753.25,280],[753.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew4","pts":[[1033.25,280],[1033.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew5","pts":[[753.25,280],[863.25,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew6","pts":[[923.25,280],[1033.25,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew7","pts":[[753.25,440],[863.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew8","pts":[[923.25,440],[1033.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew9","pts":[[720.5,360],[753.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aew10","pts":[[1033.25,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4aex1L","pts":[[478,360],[527.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w2","pts":[[587.5,360],[658,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w3","pts":[[726,360],[761.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w4","pts":[[478,560],[761.5,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w5","pts":[[761.5,360],[903.25,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w6","pts":[[903.25,360],[1045,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w7","pts":[[761.5,560],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w8","pts":[[478,360],[478,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w9","pts":[[478,460],[478,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w10","pts":[[761.5,360],[761.5,430]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w11","pts":[[761.5,490],[761.5,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w12","pts":[[1045,405],[1045,430]],"vis":[4],"dash":1},{"t":"w","id":"u55s4aex1w13","pts":[[1045,490],[1045,515]],"vis":[4],"dash":1},{"t":"w","id":"u55s4aex1w14","pts":[[1045,360],[1045,405]],"vis":[4],"dash":0},{"t":"w","id":"u55s4aex1w15","pts":[[1045,515],[1045,560]],"vis":[4],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,610.95,null]},{"t":"r","k":"r1","x":554.75,"y":360,"dir":"h","vis":[2],"lab":[554.75,322.63,null]},{"t":"s","k":"sw","dir":"h","x0":652.5,"y0":360,"x1":720.5,"y1":360,"v":1,"vis":[2],"lab":[686.5,303.05,null]},{"t":"r","k":"r2","x":893.25,"y":280,"dir":"h","vis":[2],"lab":[893.25,317.37,null]},{"t":"v","k":"vc","x":893.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[2],"elem":"r2","lab":[893.25,169.05,null]},{"t":"cap","k":"c","x":893.25,"y":440,"dir":"h","vis":[2],"lab":[893.25,396.63,null],"fh":1,"f":"cap","F":40.3},{"t":"d","id":"u55s4aej116","x":753.25,"y":360,"vis":[2]},{"t":"d","id":"u55s4aej217","x":1033.25,"y":360,"vis":[2]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[2],"ax":"v","sd":-1,"io":1},{"t":"r","k":"r1","x":557.5,"y":360,"dir":"h","vis":[4],"lab":[557.5,322.63,null],"n":"r1x1"},{"t":"s","k":"sw","dir":"h","x0":658,"y0":360,"x1":726,"y1":360,"v":1,"vis":[4],"lab":[692,303.05,null],"n":"swx1"},{"t":"r","k":"r2","x":761.5,"y":460,"dir":"v","vis":[4],"lab":[781.92,460,"start"],"n":"r2x1"},{"t":"r","k":"r0","x":1045,"y":460,"dir":"v","vis":[4],"lab":[1069,460,"start"],"dash":1,"n":"r0x1"},{"t":"dimv","k":"rab","x1":1061,"xt":1125,"xa":1115,"y1":405,"y2":515,"sd":1,"vis":[4],"lab":[1125,460,"start"],"n":"rabx1"},{"t":"d","id":"u55s4aex1j7","x":761.5,"y":360,"vis":[4]},{"t":"d","id":"u55s4aex1j10","x":761.5,"y":560,"vis":[4]}],"flows":[{"c":[3,4],"paths":[]},{"c":[-3,4],"paths":[]}],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",12,[2]],["R","r1","L0:P","L0:n1",6,[2]],["C","sw","L0:n1","L0:n2",0,[1,2]],["R","r2","L0:n2","L0:N",3,[2]],["R","c","L0:n2","L0:N",1,[2]],["R","r1","L1:n1","L1:n7",6,[4]],["C","sw","L1:n7","L1:n2",0,[3,4]],["R","r2","L1:n2","L1:n1",3,[4]]]},
  xr: {"vars":[["s","swc",1],["a","t",0],["s","swc",1],["a","t",1]],"items":[{"t":"w","id":"u55s4xrL","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw1","pts":[[478,360],[524.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw2","pts":[[584.75,360],[652.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw3","pts":[[753.25,280],[753.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw4","pts":[[1033.25,280],[1033.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw5","pts":[[753.25,280],[863.25,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw6","pts":[[923.25,280],[1033.25,280]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw7","pts":[[753.25,440],[863.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw8","pts":[[923.25,440],[1033.25,440]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw9","pts":[[720.5,360],[753.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrw10","pts":[[1033.25,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u55s4xrx1L","pts":[[478,360],[527.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w2","pts":[[587.5,360],[658,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w3","pts":[[726,360],[761.5,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w4","pts":[[478,560],[761.5,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w5","pts":[[761.5,360],[903.25,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w6","pts":[[903.25,360],[1045,360]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w7","pts":[[761.5,560],[1045,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w8","pts":[[478,360],[478,460]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w9","pts":[[478,460],[478,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w10","pts":[[761.5,360],[761.5,430]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w11","pts":[[761.5,490],[761.5,560]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w12","pts":[[1045,405],[1045,430]],"vis":[4],"dash":1},{"t":"w","id":"u55s4xrx1w13","pts":[[1045,490],[1045,515]],"vis":[4],"dash":1},{"t":"w","id":"u55s4xrx1w14","pts":[[1045,360],[1045,405]],"vis":[4],"dash":0},{"t":"w","id":"u55s4xrx1w15","pts":[[1045,515],[1045,560]],"vis":[4],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,610.95,null]},{"t":"r","k":"r1","x":554.75,"y":360,"dir":"h","vis":[2],"lab":[554.75,322.63,null]},{"t":"s","k":"sw","dir":"h","x0":652.5,"y0":360,"x1":720.5,"y1":360,"v":1,"vis":[2],"lab":[686.5,303.05,null]},{"t":"r","k":"r2","x":893.25,"y":280,"dir":"h","vis":[2],"lab":[893.25,317.37,null]},{"t":"v","k":"vc","x":893.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[2],"elem":"r2","lab":[893.25,169.05,null]},{"t":"cap","k":"c","x":893.25,"y":440,"dir":"h","vis":[2],"lab":[893.25,396.63,null],"fh":1,"f":"cap","F":40.3},{"t":"d","id":"u55s4xrj116","x":753.25,"y":360,"vis":[2]},{"t":"d","id":"u55s4xrj217","x":1033.25,"y":360,"vis":[2]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[2],"ax":"v","sd":-1,"io":1},{"t":"r","k":"r1","x":557.5,"y":360,"dir":"h","vis":[4],"lab":[557.5,322.63,null],"n":"r1x1"},{"t":"s","k":"sw","dir":"h","x0":658,"y0":360,"x1":726,"y1":360,"v":1,"vis":[4],"lab":[692,303.05,null],"n":"swx1"},{"t":"r","k":"r2","x":761.5,"y":460,"dir":"v","vis":[4],"lab":[781.92,460,"start"],"n":"r2x1"},{"t":"r","k":"r0","x":1045,"y":460,"dir":"v","vis":[4],"lab":[1069,460,"start"],"dash":1,"n":"r0x1"},{"t":"dimv","k":"rab","x1":1061,"xt":1125,"xa":1115,"y1":405,"y2":515,"sd":1,"vis":[4],"lab":[1125,460,"start"],"n":"rabx1"},{"t":"d","id":"u55s4xrx1j7","x":761.5,"y":360,"vis":[4]},{"t":"d","id":"u55s4xrx1j10","x":761.5,"y":560,"vis":[4]}],"flows":[{"c":[3,4],"paths":[]},{"c":[-3,4],"paths":[]}],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",12,[2]],["R","r1","L0:P","L0:n1",6,[2]],["C","sw","L0:n1","L0:n2",0,[1,2]],["R","r2","L0:n2","L0:N",3,[2]],["R","c","L0:n2","L0:N",1,[2]],["R","r1","L1:n1","L1:n7",6,[4]],["C","sw","L1:n7","L1:n2",0,[3,4]],["R","r2","L1:n2","L1:n1",3,[4]]]}
};
function tbU55s4q(d, p, L){ tbFig_Draw(d, p, L, U55S4K.q); }
function tbU55s4th(d, p, L){ tbGen_Draw(d, p, L, U55S4K.th); }
function tbU55s4ae(d, p, L){ tbFig_Draw(d, p, L, U55S4K.ae); }
function tbU55s4xr(d, p, L){ tbFig_Draw(d, p, L, U55S4K.xr); }
// ---- 55-5 放電：時定数とエネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u55_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U55S5K = {
  dis: {"vars":[],"items":[{"f":"ln","id":"w1","pts":[[260,410],[260,220],[414,220]],"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[486,220],[640,220],[640,388]],"vis":[],"t":"F"},{"f":"ln","id":"w3","pts":[[640,452],[640,620],[260,620],[260,430]],"vis":[],"t":"F"},{"f":"ln","id":"c","pts":[[230,410],[290,410]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c:b","pts":[[230,430],[290,430]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"ct","k":"c","bases":[[210,420,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":120,"y":420,"anc":"end"},{"f":"lb","id":"qp","k":"q","bases":[[300,376,"start",[1,-1]]],"vbases":{"top":[[300,376,"start",[1,-1]]],"bot":[[300,464,"start",[1,1]]]},"need":"q","sel":"pp","var":{"top":{"x":300,"y":376,"anc":"start"},"bot":{"x":300,"y":464,"anc":"start"}},"dflt":"top","vis":[],"t":"F","pre":"+","x":300,"y":376,"anc":"start"},{"f":"lb","id":"qm","k":"q","bases":[[300,464,"start",[1,1]]],"vbases":{"top":[[300,464,"start",[1,1]]],"bot":[[300,376,"start",[1,-1]]]},"need":"q","sel":"pp","var":{"top":{"x":348.08,"y":500.77,"anc":"start"},"bot":{"x":348.08,"y":339.23,"anc":"start"}},"dflt":"top","vis":[],"t":"F","pre":"-","x":300,"y":464,"anc":"start"},{"f":"ar","id":"vca","x0":140,"y0":600,"x1":140,"y1":240,"w":3,"need":"vc","sel":"pp","var":{"top":{"x0":140,"y0":600,"x1":140,"y1":240},"bot":{"x0":140,"y0":240,"x1":140,"y1":600}},"dflt":"top","vis":[],"t":"F"},{"f":"lb","id":"vct","k":"vc","bases":[[124,480,"end",[-1,0]]],"need":"vc","vis":[],"t":"F","x":124,"y":488,"anc":"end"},{"f":"c","id":"swp0","cx":414,"cy":220,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":486,"cy":220,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"sw","pts":[[414,220],[480,220]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[414,220],[476.35,184]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"rr","pts":[[628,388],[652,388],[652,452],[628,452]],"w":3,"close":1,"vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[670,420,"start",[1,0]]],"need":"r","vis":[],"t":"F","x":670,"y":420,"anc":"start"},{"f":"ar","id":"ia","x0":526,"y0":220,"x1":596,"y1":220,"w":4,"need":"i","sel":"pp","var":{"top":{"x0":526,"y0":220,"x1":596,"y1":220},"bot":{"x0":596,"y0":220,"x1":526,"y1":220}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[561,188,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":561,"y":176,"anc":"middle"},{"f":"ar","id":"axx1","x0":133,"y0":1000,"x1":643,"y1":1000,"vis":[],"t":"F"},{"f":"ar","id":"ayx1","x0":133,"y0":1000,"x1":133,"y1":740,"vis":[],"t":"F"},{"f":"tx","id":"ox1","x":119,"y":1026,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"tx","id":"atx1","x":655,"y":1000,"s":"{t}","anc":"start","vis":[],"t":"F"},{"f":"lb","id":"ytx1","k":"y","bases":[[117,750,"end",[-1,-1]],[149,740,"start",[1,-1]]],"need":"y","vis":[],"t":"F","x":149,"y":740,"anc":"start","n":"yx1"},{"f":"ln","id":"cvx1","pts":[[133,1000],[144.5,975.48],[156,954.38],[167.5,936.22],[179,920.59],[190.5,907.14],[202,895.56],[213.5,885.59],[225,877.01],[236.5,869.63],[248,863.27],[259.5,857.8],[271,853.09],[282.5,849.04],[294,845.55],[305.5,842.55],[317,839.97],[328.5,837.74],[340,835.83],[351.5,834.18],[363,832.76],[374.5,831.54],[386,830.49],[397.5,829.59],[409,828.81],[420.5,828.14],[432,827.56],[443.5,827.07],[455,826.64],[466.5,826.27],[478,825.96],[489.5,825.68],[501,825.45],[512.5,825.25],[524,825.07],[535.5,824.92],[547,824.79],[558.5,824.68],[570,824.59],[581.5,824.51],[593,824.44]],"w":5,"need":"cv","sel":"cv","var":{"rise":{"pts":[[133,1000],[144.5,975.48],[156,954.38],[167.5,936.22],[179,920.59],[190.5,907.14],[202,895.56],[213.5,885.59],[225,877.01],[236.5,869.63],[248,863.27],[259.5,857.8],[271,853.09],[282.5,849.04],[294,845.55],[305.5,842.55],[317,839.97],[328.5,837.74],[340,835.83],[351.5,834.18],[363,832.76],[374.5,831.54],[386,830.49],[397.5,829.59],[409,828.81],[420.5,828.14],[432,827.56],[443.5,827.07],[455,826.64],[466.5,826.27],[478,825.96],[489.5,825.68],[501,825.45],[512.5,825.25],[524,825.07],[535.5,824.92],[547,824.79],[558.5,824.68],[570,824.59],[581.5,824.51],[593,824.44]]},"fall":{"pts":[[133,824],[144.5,848.52],[156,869.62],[167.5,887.78],[179,903.41],[190.5,916.86],[202,928.44],[213.5,938.41],[225,946.99],[236.5,954.37],[248,960.73],[259.5,966.2],[271,970.91],[282.5,974.96],[294,978.45],[305.5,981.45],[317,984.03],[328.5,986.26],[340,988.17],[351.5,989.82],[363,991.24],[374.5,992.46],[386,993.51],[397.5,994.41],[409,995.19],[420.5,995.86],[432,996.44],[443.5,996.93],[455,997.36],[466.5,997.73],[478,998.04],[489.5,998.32],[501,998.55],[512.5,998.75],[524,998.93],[535.5,999.08],[547,999.21],[558.5,999.32],[570,999.41],[581.5,999.49],[593,999.56]]},"jump":{"pts":[[133,1000],[133,824],[593,824]]},"zero":{"pts":[[133,1000],[593,1000]]},"rise2":{"pts":[[133,1000],[144.5,987.28],[156,975.48],[167.5,964.54],[179,954.38],[190.5,944.96],[202,936.22],[213.5,928.11],[225,920.59],[236.5,913.61],[248,907.14],[259.5,901.13],[271,895.56],[282.5,890.39],[294,885.59],[305.5,881.14],[317,877.01],[328.5,873.18],[340,869.63],[351.5,866.33],[363,863.27],[374.5,860.43],[386,857.8],[397.5,855.36],[409,853.09],[420.5,850.99],[432,849.04],[443.5,847.23],[455,845.55],[466.5,844],[478,842.55],[489.5,841.21],[501,839.97],[512.5,838.81],[524,837.74],[535.5,836.75],[547,835.83],[558.5,834.97],[570,834.18],[581.5,833.44],[593,832.76]]},"fall2":{"pts":[[133,824],[144.5,836.72],[156,848.52],[167.5,859.46],[179,869.62],[190.5,879.04],[202,887.78],[213.5,895.89],[225,903.41],[236.5,910.39],[248,916.86],[259.5,922.87],[271,928.44],[282.5,933.61],[294,938.41],[305.5,942.86],[317,946.99],[328.5,950.82],[340,954.37],[351.5,957.67],[363,960.73],[374.5,963.57],[386,966.2],[397.5,968.64],[409,970.91],[420.5,973.01],[432,974.96],[443.5,976.77],[455,978.45],[466.5,980],[478,981.45],[489.5,982.79],[501,984.03],[512.5,985.19],[524,986.26],[535.5,987.25],[547,988.17],[558.5,989.03],[570,989.82],[581.5,990.56],[593,991.24]]}},"dflt":"rise","vis":[],"t":"F","tt":"tt"},{"f":"ln","id":"flx1","pts":[[133,824],[593,824]],"dash":1,"w":2,"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"pts":[[133,824],[593,824]]},"fall":{"pts":[[133,1000],[593,1000]]},"jump":{"pts":[[133,824],[593,824]]},"zero":{"pts":[[133,1000],[593,1000]]},"rise2":{"pts":[[133,824],[593,824]]},"fall2":{"pts":[[133,1000],[593,1000]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"fintx1","k":"fin","bases":[[607,824,"start",[1,0]]],"vbases":{"rise":[[607,824,"start",[1,0]]],"fall":[[607,966,"start",[1,0]]],"jump":[[607,824,"start",[1,0]]],"zero":[[607,966,"start",[1,0]]],"rise2":[[607,824,"start",[1,0]]],"fall2":[[607,966,"start",[1,0]]]},"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"x":607,"y":824,"anc":"start"},"fall":{"x":607,"y":966,"anc":"start"},"jump":{"x":607,"y":824,"anc":"start"},"zero":{"x":607,"y":966,"anc":"start"},"rise2":{"x":607,"y":824,"anc":"start"},"fall2":{"x":607,"y":966,"anc":"start"}},"dflt":"rise","vis":[],"t":"F","x":607,"y":824,"anc":"start","n":"finx1"},{"f":"lb","id":"sttx1","k":"st","bases":[[119,824,"end",[-1,0]],[149,794,"start",[1,-1]]],"need":"st","vis":[],"t":"F","x":119,"y":824,"anc":"end","n":"stx1"},{"f":"ln","id":"cw2x1","pts":[[133,1000],[133,824],[593,824]],"dash":1,"w":3,"o":["tt2"],"need":"cv2","sel":"cv2","var":{"rise":{"pts":[[133,1000],[144.5,975.48],[156,954.38],[167.5,936.22],[179,920.59],[190.5,907.14],[202,895.56],[213.5,885.59],[225,877.01],[236.5,869.63],[248,863.27],[259.5,857.8],[271,853.09],[282.5,849.04],[294,845.55],[305.5,842.55],[317,839.97],[328.5,837.74],[340,835.83],[351.5,834.18],[363,832.76],[374.5,831.54],[386,830.49],[397.5,829.59],[409,828.81],[420.5,828.14],[432,827.56],[443.5,827.07],[455,826.64],[466.5,826.27],[478,825.96],[489.5,825.68],[501,825.45],[512.5,825.25],[524,825.07],[535.5,824.92],[547,824.79],[558.5,824.68],[570,824.59],[581.5,824.51],[593,824.44]]},"fall":{"pts":[[133,824],[144.5,848.52],[156,869.62],[167.5,887.78],[179,903.41],[190.5,916.86],[202,928.44],[213.5,938.41],[225,946.99],[236.5,954.37],[248,960.73],[259.5,966.2],[271,970.91],[282.5,974.96],[294,978.45],[305.5,981.45],[317,984.03],[328.5,986.26],[340,988.17],[351.5,989.82],[363,991.24],[374.5,992.46],[386,993.51],[397.5,994.41],[409,995.19],[420.5,995.86],[432,996.44],[443.5,996.93],[455,997.36],[466.5,997.73],[478,998.04],[489.5,998.32],[501,998.55],[512.5,998.75],[524,998.93],[535.5,999.08],[547,999.21],[558.5,999.32],[570,999.41],[581.5,999.49],[593,999.56]]},"jump":{"pts":[[133,1000],[133,824],[593,824]]},"zero":{"pts":[[133,1000],[593,1000]]},"rise2":{"pts":[[133,1000],[144.5,987.28],[156,975.48],[167.5,964.54],[179,954.38],[190.5,944.96],[202,936.22],[213.5,928.11],[225,920.59],[236.5,913.61],[248,907.14],[259.5,901.13],[271,895.56],[282.5,890.39],[294,885.59],[305.5,881.14],[317,877.01],[328.5,873.18],[340,869.63],[351.5,866.33],[363,863.27],[374.5,860.43],[386,857.8],[397.5,855.36],[409,853.09],[420.5,850.99],[432,849.04],[443.5,847.23],[455,845.55],[466.5,844],[478,842.55],[489.5,841.21],[501,839.97],[512.5,838.81],[524,837.74],[535.5,836.75],[547,835.83],[558.5,834.97],[570,834.18],[581.5,833.44],[593,832.76]]},"fall2":{"pts":[[133,824],[144.5,836.72],[156,848.52],[167.5,859.46],[179,869.62],[190.5,879.04],[202,887.78],[213.5,895.89],[225,903.41],[236.5,910.39],[248,916.86],[259.5,922.87],[271,928.44],[282.5,933.61],[294,938.41],[305.5,942.86],[317,946.99],[328.5,950.82],[340,954.37],[351.5,957.67],[363,960.73],[374.5,963.57],[386,966.2],[397.5,968.64],[409,970.91],[420.5,973.01],[432,974.96],[443.5,976.77],[455,978.45],[466.5,980],[478,981.45],[489.5,982.79],[501,984.03],[512.5,985.19],[524,986.26],[535.5,987.25],[547,988.17],[558.5,989.03],[570,989.82],[581.5,990.56],[593,991.24]]}},"dflt":"jump","vis":[],"t":"F"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[409,790,"middle",[0,-1]],[455,912,"middle",[0,1]]],"o":["tt2"],"need":"c2","vis":[],"t":"F","x":409,"y":790,"anc":"middle","n":"c2x1"},{"f":"ln","id":"tl0x1","pts":[[209.67,1000],[209.67,888.77]],"dash":1,"w":2,"o":["taud"],"need":"tau","vis":[],"t":"F"},{"f":"lb","id":"tautx1","k":"tau","bases":[[209.67,1030,"middle",[0,1]]],"o":["taud"],"need":"tau","vis":[],"t":"F","x":209.67,"y":1150,"anc":"middle","n":"taux1"},{"f":"ln","id":"plx1","pts":[[133,888.77],[209.67,888.77]],"dash":1,"w":2,"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"pts":[[133,888.77],[209.67,888.77]]},"fall":{"pts":[[133,935.23],[209.67,935.23]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"pcttx1","k":"pct","bases":[[119,888.77,"end",[-1,0]]],"vbases":{"rise":[[119,888.77,"end",[-1,0]]],"fall":[[119,935.23,"end",[-1,0]]]},"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"x":119,"y":888.77,"anc":"end"},"fall":{"x":119,"y":935.23,"anc":"end"}},"dflt":"rise","vis":[],"t":"F","x":119,"y":888.77,"anc":"end","n":"pctx1"},{"f":"ln","id":"tl2x1","pts":[[286.33,1000],[286.33,888.77]],"dash":1,"w":2,"o":["tt2"],"need":"tau2","vis":[],"t":"F"},{"f":"lb","id":"tau2tx1","k":"tau2","bases":[[286.33,1030,"middle",[0,1]]],"o":["tt2"],"need":"tau2","vis":[],"t":"F","x":286.33,"y":1030,"anc":"middle","n":"tau2x1"},{"f":"ar","id":"p1ax1","x0":137,"y0":1070,"x1":512.33,"y1":1070,"two":1,"w":2,"o":["phd"],"need":"ph1","vis":[],"t":"F"},{"f":"lb","id":"ph1tx1","k":"ph1","bases":[[324.67,1102,"middle",[0,1]]],"o":["phd"],"need":"ph1","vis":[],"t":"F","x":324.67,"y":1102,"anc":"middle","n":"ph1x1"},{"f":"ar","id":"p2ax1","x0":520.33,"y0":1070,"x1":633,"y1":1070,"two":1,"w":2,"o":["phd"],"need":"ph2","vis":[],"t":"F"},{"f":"lb","id":"ph2tx1","k":"ph2","bases":[[584.67,1102,"middle",[0,1]]],"o":["phd"],"need":"ph2","vis":[],"t":"F","x":584.67,"y":1102,"anc":"middle","n":"ph2x1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU55s5dis(d, p, L){ tbFig_Draw(d, p, L, U55S5K.dis); }
// ---- 55-6 合成した R と C の時定数を比べる の図（※ textbook/gen/make_section.py が textbook/gen/data/u55_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U55S6K = {
  g4: {"vars":[],"items":[{"t":"w","id":"u55s6g4L","pts":[[14,178],[14,378],[288,378]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4Rw","pts":[[308,378],[581,378],[581,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4w1","pts":[[14,178],[151.33,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4w2","pts":[[211.33,178],[383.67,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4w3","pts":[[443.67,178],[581,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1L","pts":[[679,178],[679,378],[953,378]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1Rw","pts":[[973,378],[1246,378],[1246,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w1","pts":[[729,98],[729,258]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w2","pts":[[1016,98],[1016,258]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w3","pts":[[729,98],[842.5,98]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w4","pts":[[902.5,98],[1016,98]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w5","pts":[[729,258],[842.5,258]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w6","pts":[[902.5,258],[1016,258]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w7","pts":[[679,178],[729,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w8","pts":[[1016,178],[1101,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x1w9","pts":[[1161,178],[1246,178]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2L","pts":[[14,774],[14,974],[288,974]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2Rw","pts":[[308,974],[581,974],[581,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w1","pts":[[14,774],[99,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w2","pts":[[244,694],[244,854]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w3","pts":[[531,694],[531,854]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w4","pts":[[244,694],[357.5,694]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w5","pts":[[417.5,694],[531,694]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w6","pts":[[244,854],[357.5,854]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w7","pts":[[417.5,854],[531,854]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w8","pts":[[159,774],[244,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x2w9","pts":[[531,774],[581,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3L","pts":[[679,774],[679,974],[953,974]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3Rw","pts":[[973,974],[1246,974],[1246,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3w1","pts":[[679,774],[723.4,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3w2","pts":[[783.4,774],[862.8,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3w3","pts":[[922.8,774],[1002.2,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3w4","pts":[[1062.2,774],[1141.6,774]],"vis":[],"dash":0},{"t":"w","id":"u55s6g4x3w5","pts":[[1201.6,774],[1246,774]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":288,"yp":378,"xm":308,"ym":378,"vis":[],"side":1,"loop":1},{"t":"r","k":"ra","x":181.33,"y":178,"dir":"h","vis":[],"lab":[181.33,129.07,null]},{"t":"cap","k":"ca","x":413.67,"y":178,"dir":"h","vis":[],"lab":[413.67,123.07,null],"fh":1,"f":"cap","F":60.2},{"t":"cap","id":"u55s6g4cap0","x":297.5,"y":504.21,"s":"(ア)","vis":[]},{"t":"e","k":"src","dir":"h","xp":953,"yp":378,"xm":973,"ym":378,"vis":[],"side":1,"loop":1,"n":"srcx1"},{"t":"r","k":"rb1","x":872.5,"y":98,"dir":"h","vis":[],"lab":[872.5,49.07,null],"n":"rb1x1"},{"t":"r","k":"rb2","x":872.5,"y":258,"dir":"h","vis":[],"lab":[872.5,209.07,null],"n":"rb2x1"},{"t":"d","id":"u55s6g4x1j111","x":729,"y":178,"vis":[]},{"t":"d","id":"u55s6g4x1j212","x":1016,"y":178,"vis":[]},{"t":"cap","k":"cb","x":1131,"y":178,"dir":"h","vis":[],"lab":[1131,123.07,null],"fh":1,"f":"cap","F":60.2,"n":"cbx1"},{"t":"cap","id":"u55s6g4cap1","x":962.5,"y":504.21,"s":"(イ)","vis":[]},{"t":"e","k":"src","dir":"h","xp":288,"yp":974,"xm":308,"ym":974,"vis":[],"side":1,"loop":1,"n":"srcx2"},{"t":"r","k":"rc","x":129,"y":774,"dir":"h","vis":[],"lab":[129,725.07,null],"n":"rcx2"},{"t":"cap","k":"cc1","x":387.5,"y":694,"dir":"h","vis":[],"lab":[387.5,639.07,null],"fh":1,"f":"cap","F":60.2,"n":"cc1x2"},{"t":"cap","k":"cc2","x":387.5,"y":854,"dir":"h","vis":[],"lab":[387.5,799.07,null],"fh":1,"f":"cap","F":60.2,"n":"cc2x2"},{"t":"d","id":"u55s6g4x2j113","x":244,"y":774,"vis":[]},{"t":"d","id":"u55s6g4x2j214","x":531,"y":774,"vis":[]},{"t":"cap","id":"u55s6g4cap2","x":297.5,"y":1100.21,"s":"(ウ)","vis":[]},{"t":"e","k":"src","dir":"h","xp":953,"yp":974,"xm":973,"ym":974,"vis":[],"side":1,"loop":1,"n":"srcx3"},{"t":"r","k":"rd1","x":753.4,"y":774,"dir":"h","vis":[],"lab":[753.4,725.07,null],"n":"rd1x3"},{"t":"r","k":"rd2","x":892.8,"y":774,"dir":"h","vis":[],"lab":[892.8,725.07,null],"n":"rd2x3"},{"t":"cap","k":"cd1","x":1032.2,"y":774,"dir":"h","vis":[],"lab":[1032.2,719.07,null],"fh":1,"f":"cap","F":60.2,"n":"cd1x3"},{"t":"cap","k":"cd2","x":1171.6,"y":774,"dir":"h","vis":[],"lab":[1171.6,719.07,null],"fh":1,"f":"cap","F":60.2,"n":"cd2x3"},{"t":"cap","id":"u55s6g4cap3","x":962.5,"y":1100.21,"s":"(エ)","vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","ra","L0:P","L0:n1",1,[]],["R","ca","L0:n1","L0:N",1,[]],["E","src","L1:P","L1:N",1,[]],["R","rb1","L1:P","L1:n1",1,[]],["R","rb2","L1:P","L1:n1",1,[]],["R","cb","L1:n1","L1:N",1,[]],["E","src","L2:P","L2:N",1,[]],["R","rc","L2:P","L2:n1",1,[]],["R","cc1","L2:n1","L2:N",1,[]],["R","cc2","L2:n1","L2:N",1,[]],["E","src","L3:P","L3:N",1,[]],["R","rd1","L3:P","L3:n1",1,[]],["R","rd2","L3:n1","L3:n2",1,[]],["R","cd1","L3:n2","L3:n3",1,[]],["R","cd2","L3:n3","L3:N",1,[]]]}
};
function tbU55s6g4(d, p, L){ tbFig_Draw(d, p, L, U55S6K.g4); }
var KINDS = {u55s1q: tbU55s1q, u55s1ql: tbU55s1ql, u55s1ri: tbU55s1ri, u55s1rs: tbU55s1rs, u55s1ae: tbU55s1ae, u55s1xr: tbU55s1xr, u55s2q: tbU55s2q, u55s2ri: tbU55s2ri, u55s2rs: tbU55s2rs, u55s2ae: tbU55s2ae, u55s2xr: tbU55s2xr, u55s3q: tbU55s3q, u55s3rs: tbU55s3rs, u55s3two: tbU55s3two, u55s3ae: tbU55s3ae, u55s3xr: tbU55s3xr, u55s4q: tbU55s4q, u55s4th: tbU55s4th, u55s4ae: tbU55s4ae, u55s4xr: tbU55s4xr, u55s5dis: tbU55s5dis, u55s6g4: tbU55s6g4};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u55s1ql: function(p, L){ return tbGen_Flow(p, L, U55S1K.ql); },
  u55s1ri: function(p, L){ return tbGen_Flow(p, L, U55S1K.ri); },
  u55s1rs: function(p, L){ return tbGen_Flow(p, L, U55S1K.rs); },
  u55s1ae: function(p, L){ return tbGen_Flow(p, L, U55S1K.ae); },
  u55s1xr: function(p, L){ return tbGen_Flow(p, L, U55S1K.xr); },
  u55s2ri: function(p, L){ return tbGen_Flow(p, L, U55S2K.ri); },
  u55s2rs: function(p, L){ return tbGen_Flow(p, L, U55S2K.rs); },
  u55s2ae: function(p, L){ return tbGen_Flow(p, L, U55S2K.ae); },
  u55s2xr: function(p, L){ return tbGen_Flow(p, L, U55S2K.xr); },
  u55s3rs: function(p, L){ return tbGen_Flow(p, L, U55S3K.rs); },
  u55s3ae: function(p, L){ return tbGen_Flow(p, L, U55S3K.ae); },
  u55s3xr: function(p, L){ return tbGen_Flow(p, L, U55S3K.xr); },
  // 55-4 の図は電流が流れないので載せない,
  // 55-5 の図は電流が流れないので載せない,
  // 55-6 の図は電流が流れないので載せない
};

// 55-1 瞬間と定常の電流の比 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u55_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU55s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU55s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU55s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU55s1_par(a, b){ return a * b / (a + b); }
function tbU55s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU55s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU55s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU55s1_Qratio(r){
  var gcd = tbU55s1_gcd, ratio = tbU55s1_ratio, par = tbU55s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var E = pick(r, [12,18,20,24,30,36,40,48,50,60,72,80,90,100]);
    var Ra = (R1 + R2 * R3 / (R2 + R3));
    var Rb = (R1 + R3);
    var I0 = (E / Ra);
    var I = (E / Rb);
    if (!(nice(Ra) && nice(I0) && nice(I) && I0 <= 30 && Math.abs((Rb / Ra) * 100 - Math.round((Rb / Ra) * 100)) < 1e-9)) continue;
    var ok = (I0 / I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s1_three4(ok, [{x: (I0), why: "瞬間の電流 $I_0$ で止めた（定常の電流で割っていない）", w: 0, cut: 1}, {x: (I), why: "定常の電流 $I$ を答えた（瞬間の電流を出していない）", w: 1, cut: 1}, {x: (1), why: "瞬間も定常も同じ読みにした（コンデンサの振る舞いを使っていない）", w: 2, cut: 1}, {x: (I / I0), why: "比を逆にした（$\\dfrac{I}{I_0}$ を出した）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s1ratio", text: "図のように、$" + qv(E, "V") + "$ の電源に、$R_1 = " + qv(R1, "O") + "$ と、「コンデンサと $R_2 = " + qv(R2, "O") + "$ の直列」と $R_3 = " + qv(R3, "O") + "$ の並列をつなぎます。スイッチを入れた瞬間の電流 $I_0$ は、十分に時間がたった後の電流 $I$ の何倍ですか。", fig: {kind: "u55s1q", L: tbU55s1_fig({"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["瞬間はコンデンサが素通り　$" + fmt(R1) + " + \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + fmt(Ra) + "\\,\\Omega$、$I_0 = \\dfrac{" + fmt(E) + "}{" + fmt(Ra) + "} = " + qv(I0, "A") + "$", "定常はコンデンサの道に流れない　$" + fmt(R1) + " + " + fmt(R3) + " = " + fmt(Rb) + "\\,\\Omega$、$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rb) + "} = " + qv(I, "A") + "$", "$\\dfrac{I_0}{I} = \\dfrac{" + fmt(I0) + "}{" + fmt(I) + "} = " + qv(ok, "X") + "$"], chk: {form: "u55s1ratio", p: {R1: R1, R2: R2, R3: R3, E: E}}};
  }
  throw new Error("u55s1ratio：条件に合う数字が見つからない");
}
function tbU55s1_Qnoe(r){
  var gcd = tbU55s1_gcd, ratio = tbU55s1_ratio, par = tbU55s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var Ra = (R1 + R2 * R3 / (R2 + R3));
    var Rb = (R1 + R3);
    if (!(nice(Ra) && Math.abs((Rb / Ra) * 100 - Math.round((Rb / Ra) * 100)) < 1e-9 && Math.abs((R3 * (R2 + R3) / (R2 * R3)) * 100 - Math.round((R3 * (R2 + R3) / (R2 * R3)) * 100)) < 1e-9)) continue;
    var ok = (Rb / Ra);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s1_three4(ok, [{x: (Ra), why: "瞬間の合成抵抗で止めた（電流の比にしていない）", w: 0, cut: 1}, {x: (Rb), why: "定常の合成抵抗で止めた（電流の比にしていない）", w: 1, cut: 1}, {x: (R3 * (R2 + R3) / (R2 * R3)), why: "並列の部分だけで比べた（$R_1$ を足していない）", w: 2, cut: 1}, {x: (Ra / Rb), why: "抵抗の比のままにした（電流は合成抵抗の逆比）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s1noe", text: "図のように、電源に、$R_1 = " + qv(R1, "O") + "$ と、「コンデンサと $R_2 = " + qv(R2, "O") + "$ の直列」と $R_3 = " + qv(R3, "O") + "$ の並列をつなぎます。電源の電圧は分かりません。スイッチを入れた瞬間の電流 $I_0$ は、十分に時間がたった後の電流 $I$ の何倍ですか。", fig: {kind: "u55s1q", L: tbU55s1_fig({"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["瞬間の合成抵抗　$" + fmt(R1) + " + \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + fmt(Ra) + "\\,\\Omega$", "定常の合成抵抗　$" + fmt(R1) + " + " + fmt(R3) + " = " + fmt(Rb) + "\\,\\Omega$", "同じ電源なので、電流は合成抵抗の逆比　$\\dfrac{I_0}{I} = \\dfrac{" + fmt(Rb) + "}{" + fmt(Ra) + "} = " + qv(ok, "X") + "$"], chk: {form: "u55s1noe", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u55s1noe：条件に合う数字が見つからない");
}
function tbU55s1_Qcoil(r){
  var gcd = tbU55s1_gcd, ratio = tbU55s1_ratio, par = tbU55s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var E = pick(r, [12,18,20,24,30,36,40,48,50,60,72,80,90,100]);
    var Ra = (R1 + R3);
    var Rb = (R1 + R2 * R3 / (R2 + R3));
    var I0 = (E / Ra);
    var I = (E / Rb);
    if (!(nice(Rb) && nice(I0) && nice(I) && I <= 30 && Math.abs((Rb / Ra) * 100 - Math.round((Rb / Ra) * 100)) < 1e-9)) continue;
    var ok = (I0 / I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s1_three4(ok, [{x: (I0), why: "瞬間の電流 $I_0$ で止めた（定常の電流で割っていない）", w: 0, cut: 1}, {x: (I), why: "定常の電流 $I$ を答えた（瞬間の電流を出していない）", w: 1, cut: 1}, {x: (1), why: "瞬間も定常も同じ読みにした（コイルの振る舞いを使っていない）", w: 2, cut: 1}, {x: (I / I0), why: "コンデンサと同じ読みにした（コイルは瞬間が流れず、定常が素通り）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s1coil", text: "図のように、$" + qv(E, "V") + "$ の電源に、$R_1 = " + qv(R1, "O") + "$ と、「コイルと $R_2 = " + qv(R2, "O") + "$ の直列」と $R_3 = " + qv(R3, "O") + "$ の並列をつなぎます。スイッチを入れた瞬間の電流 $I_0$ は、十分に時間がたった後の電流 $I$ の何倍ですか。", fig: {kind: "u55s1ql", L: tbU55s1_fig({"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["c", null], ["l", "{L}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["瞬間はコイルの道に流れない　$" + fmt(R1) + " + " + fmt(R3) + " = " + fmt(Ra) + "\\,\\Omega$、$I_0 = \\dfrac{" + fmt(E) + "}{" + fmt(Ra) + "} = " + qv(I0, "A") + "$", "定常はコイルが素通り　$" + fmt(R1) + " + \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + fmt(Rb) + "\\,\\Omega$、$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rb) + "} = " + qv(I, "A") + "$", "$\\dfrac{I_0}{I} = \\dfrac{" + fmt(I0) + "}{" + fmt(I) + "} = " + qv(ok, "X") + "$"], chk: {form: "u55s1coil", p: {R1: R1, R2: R2, R3: R3, E: E}}};
  }
  throw new Error("u55s1coil：条件に合う数字が見つからない");
}
// 55-2 比から逆に抵抗を出す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u55_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU55s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU55s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU55s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU55s2_par(a, b){ return a * b / (a + b); }
function tbU55s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU55s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU55s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU55s2_Qr3(r){
  var gcd = tbU55s2_gcd, ratio = tbU55s2_ratio, par = tbU55s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15,16,20,24,30,40,60]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15,16,20,24,30,40,60]);
    var k = pick(r, [2,3,4]);
    var Rs = (R1 + R2);
    var Ri = ((R1 + R2) / k);
    var Rp = ((R1 + R2) / k - R1);
    var R3 = (Rp * R2 / (R2 - Rp));
    if (!(Rp > 0 && Rp < R2 && nice(Ri) && nice(Rp) && nice(R3) && R3 <= 100 && R3 != R2)) continue;
    var ok = (R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s2_three4(ok, [{x: (Rp), why: "並列の部分の合成抵抗で止めた（$R_3$ を解いていない）", w: 0, cut: 1}, {x: (Ri), why: "瞬間の全体の合成抵抗で止めた", w: 1, cut: 1}, {x: (R2), why: "$R_3 = R_2$ とした（並列の2つを同じ値にした）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s2r3", text: "図のように、電源に $R_1 = " + qv(R1, "O") + "$ と、$R_2 = " + qv(R2, "O") + "$ と「コンデンサと $R_3$ の直列」の並列をつなぎます。スイッチを入れた瞬間の電流 $I_0$ を、十分に時間がたった後の電流 $I$ の $" + fmt(k) + "$ 倍にします。$R_3$ は何 Ω ですか。", fig: {kind: "u55s2q", L: tbU55s2_fig({"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常は $" + fmt(R1) + " + " + fmt(R2) + " = " + fmt(Rs) + "\\,\\Omega$。瞬間は $" + fmt(R1) + " + R_{23}$（$R_{23}$＝並列の部分）", "$\\dfrac{" + fmt(Rs) + "}{" + fmt(R1) + " + R_{23}} = " + fmt(k) + "$　より　$R_{23} = " + fmt(Rp) + "\\,\\Omega$", "$\\dfrac{" + fmt(R2) + " R_3}{" + fmt(R2) + " + R_3} = " + fmt(Rp) + "$　より　$R_3 = " + qv(ok, "O") + "$"], chk: {form: "u55s2r3", p: {R1: R1, R2: R2, k: k}}};
  }
  throw new Error("u55s2r3：条件に合う数字が見つからない");
}
function tbU55s2_Qsym(r){
  var gcd = tbU55s2_gcd, ratio = tbU55s2_ratio, par = tbU55s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4]);
    var m = (k - 1);
    var cm = (k == 2 ? '' : String(k - 1));
    var dm = (k == 2 ? '' : String(k - 1));
    var _c = choices(r, [{t: "$R_3 = \\dfrac{R_2 (R_2 - " + String(cm) + " R_1)}{" + String(dm) + " (R_1 + R_2)}$", v: "ok"}, {t: "$R_3 = \\dfrac{R_2 - " + String(cm) + " R_1}{" + fmt(k) + "}$", v: "rp", why: "並列の部分の合成抵抗で止めた（$R_3$ を解いていない）"}, {t: "$R_3 = \\dfrac{R_1 + R_2}{" + fmt(k) + "}$", v: "ri", why: "瞬間の全体の合成抵抗で止めた"}, {t: "$R_3 = \\dfrac{R_1 (R_1 - " + String(cm) + " R_2)}{" + String(dm) + " (R_1 + R_2)}$", v: "sw", why: "$R_1$ と $R_2$ を取り違えた"}]);
    return {form: "u55s2sym", text: "図のように、電源に $R_1$ と、$R_2$ と「コンデンサと $R_3$ の直列」の並列をつなぎます。スイッチを入れた瞬間の電流 $I_0$ を、十分に時間がたった後の電流 $I$ の $" + fmt(k) + "$ 倍にする $R_3$ を表す式はどれですか。", fig: {kind: "u55s2q", L: tbU55s2_fig({"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常は $R_1 + R_2$、瞬間は $R_1 + R_{23}$（$R_{23}$＝並列の部分）", "$\\dfrac{R_1 + R_2}{R_1 + R_{23}} = " + fmt(k) + "$　より　$R_{23} = \\dfrac{R_2 - " + String(cm) + " R_1}{" + fmt(k) + "}$", "$\\dfrac{R_2 R_3}{R_2 + R_3} = R_{23}$　を解いて　$R_3 = \\dfrac{R_2 (R_2 - " + String(cm) + " R_1)}{" + String(dm) + " (R_1 + R_2)}$"], chk: {form: "u55s2sym", p: {k: k}}};
  }
  throw new Error("u55s2sym：条件に合う数字が見つからない");
}
// 55-3 定常のエネルギーの和 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u55_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU55s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU55s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU55s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU55s3_par(a, b){ return a * b / (a + b); }
function tbU55s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU55s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU55s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU55s3_Qsum(r){
  var gcd = tbU55s3_gcd, ratio = tbU55s3_ratio, par = tbU55s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [6,12,18,20,24,30,36,40,48,50,60,72,80,90,100]);
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Lm = pick(r, [10,20,40,50,100,200,500]);
    var Cu = pick(r, [10,20,40,50,100,200,500,1000]);
    var I = (E / (R1 + R2));
    var V = (R2 * E / (R1 + R2));
    var WL = (Lm * I * I / 2000);
    var WC = (Cu * V * V / 2000000);
    var Wd = (Cu * E * E / 2000000);
    if (!(nice(I) && nice(V) && nice(WL) && nice(WC) && nice(Wd) && WL >= 0.001 && WC >= 0.001 && WL != WC && WL + WC <= 100)) continue;
    var ok = (WL + WC);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s3_three4(ok, [{x: (WL), why: "コイルのエネルギーだけ（コンデンサの分を足していない）", w: 0, cut: 1}, {x: (WC), why: "コンデンサのエネルギーだけ（コイルの分を足していない）", w: 1, cut: 1}, {x: (WL + Wd), why: "コンデンサの電圧を、分圧せず電源の電圧にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s3sum", text: "図のように、$" + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ と $" + fmt(Lm) + "\\,\\mathrm{mH}$ のコイルを直列につなぎ、その先に $R_2 = " + qv(R2, "O") + "$ と $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。定常状態で、コイルとコンデンサに蓄えられるエネルギーの和は何 J ですか。", fig: {kind: "u55s3q", L: tbU55s3_fig({"r1":"{R}_1","r2":"{R}_2","l":"{L}","c":"{C}","src":"{E}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["l", "{L}=" + fmt(Lm) + " mH"], ["c", "{C}=" + fmt(Cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常はコイルが素通り・コンデンサの道に流れない　$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$、$v_C = " + fmt(R2) + " \\times " + fmt(I) + " = " + qv(V, "V") + "$", "$W_L = \\dfrac{1}{2} \\times " + fmt(Lm) + " \\times 10^{-3} \\times " + fmt(I) + "^2 = " + qv(WL, "J") + "$、$W_C = \\dfrac{1}{2} \\times " + fmt(Cu) + " \\times 10^{-6} \\times " + fmt(V) + "^2 = " + qv(WC, "J") + "$", "$W = " + fmt(WL) + " + " + fmt(WC) + " = " + qv(ok, "J") + "$"], chk: {form: "u55s3sum", p: {E: E, R1: R1, R2: R2, Lm: Lm, Cu: Cu}}};
  }
  throw new Error("u55s3sum：条件に合う数字が見つからない");
}
function tbU55s3_Qwc(r){
  var gcd = tbU55s3_gcd, ratio = tbU55s3_ratio, par = tbU55s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [6,12,18,20,24,30,36,40,48,50,60,72,80,90,100]);
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Cu = pick(r, [10,20,40,50,100,200,500,1000]);
    var I = (E / (R1 + R2));
    var V = (R2 * E / (R1 + R2));
    var WC = (Cu * V * V / 2000000);
    var Wd = (Cu * E * E / 2000000);
    var W1 = (Cu * (E - V) * (E - V) / 2000000);
    if (!(nice(V) && nice(WC) && nice(Wd) && nice(W1) && WC >= 0.001 && V != E - V)) continue;
    var ok = (WC);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s3_three4(ok, [{x: (V), why: "コンデンサの電圧で止めた（エネルギーの式に入れていない）", w: 0, cut: 1}, {x: (Wd), why: "コンデンサの電圧を、分圧せず電源の電圧にした（定常の回路を描き直していない）", w: 1, cut: 1}, {x: (W1), why: "$R_1$ の電圧を入れた", w: 2, cut: 0}, {x: (2 * WC), why: "静電エネルギーの式の 1/2 を落とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s3wc", text: "図のように、$" + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ とコイルを直列につなぎ、その先に $R_2 = " + qv(R2, "O") + "$ と $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。定常状態でコンデンサに蓄えられるエネルギーは何 J ですか。", fig: {kind: "u55s3q", L: tbU55s3_fig({"r1":"{R}_1","r2":"{R}_2","l":"{L}","c":"{C}","src":"{E}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["c", "{C}=" + fmt(Cu) + " μF"], ["vc", "{v}_C"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常はコンデンサの道に流れない　$v_C$ は $R_2$ の電圧", "$v_C = " + fmt(E) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(V, "V") + "$", "$W_C = \\dfrac{1}{2} \\times " + fmt(Cu) + " \\times 10^{-6} \\times " + fmt(V) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u55s3wc", p: {E: E, R1: R1, R2: R2, Cu: Cu}}};
  }
  throw new Error("u55s3wc：条件に合う数字が見つからない");
}
function tbU55s3_Qwl(r){
  var gcd = tbU55s3_gcd, ratio = tbU55s3_ratio, par = tbU55s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [6,12,18,20,24,30,36,40,48,50,60,72,80,90,100]);
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Lm = pick(r, [10,20,40,50,100,200,500]);
    var I = (E / (R1 + R2));
    var WL = (Lm * I * I / 2000);
    var I1 = (E / R1);
    var W1 = (Lm * E * E / R1 / R1 / 2000);
    if (!(nice(I) && nice(WL) && nice(W1) && WL >= 0.001 && I != 1)) continue;
    var ok = (WL);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s3_three4(ok, [{x: (I), why: "電流で止めた（エネルギーの式に入れていない）", w: 0, cut: 1}, {x: (W1), why: "$R_2$ を足さずに電流を出した（定常の回路を描き直していない）", w: 1, cut: 1}, {x: (1000 * WL), why: "mH を H に直していない", w: 2, cut: 0}, {x: (2 * WL), why: "磁気エネルギーの式の 1/2 を落とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s3wl", text: "図のように、$" + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ と $" + fmt(Lm) + "\\,\\mathrm{mH}$ のコイルを直列につなぎ、その先に $R_2 = " + qv(R2, "O") + "$ と コンデンサを並列につなぎます。定常状態でコイルに蓄えられるエネルギーは何 J ですか。", fig: {kind: "u55s3q", L: tbU55s3_fig({"r1":"{R}_1","r2":"{R}_2","l":"{L}","c":"{C}","src":"{E}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["l", "{L}=" + fmt(Lm) + " mH"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常はコンデンサの道に流れないので、$R_1$ と $R_2$ の直列　$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$", "$W_L = \\dfrac{1}{2} \\times " + fmt(Lm) + " \\times 10^{-3} \\times " + fmt(I) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u55s3wl", p: {E: E, R1: R1, R2: R2, Lm: Lm}}};
  }
  throw new Error("u55s3wl：条件に合う数字が見つからない");
}
function tbU55s3_Qtwo(r){
  var gcd = tbU55s3_gcd, ratio = tbU55s3_ratio, par = tbU55s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [6,12,18,20,24,30,36,40,48,50,60,72,80,90,100]);
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var L1 = pick(r, [10,20,40,50,100,200,500]);
    var L2 = pick(r, [10,20,40,50,100,200,500]);
    var C1 = pick(r, [10,20,40,50,100,200,500,1000]);
    var C2 = pick(r, [10,20,40,50,100,200,500,1000]);
    var I = (E / (R1 + R2));
    var V1 = (R1 * E / (R1 + R2));
    var V2 = (R2 * E / (R1 + R2));
    var WL = ((L1 + L2) * I * I / 2000);
    var WC = ((C1 * V1 * V1 + C2 * V2 * V2) / 2000000);
    var Wd = ((C1 + C2) * E * E / 2000000);
    if (!(nice(I) && nice(V1) && nice(WL) && nice(WC) && nice(Wd) && WL >= 0.001 && WC >= 0.001 && WL != WC && WL + WC <= 100 && L1 != L2 && C1 != C2)) continue;
    var ok = (WL + WC);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s3_three4(ok, [{x: (WL), why: "コイルのエネルギーだけ（コンデンサの分を足していない）", w: 0, cut: 1}, {x: (WC), why: "コンデンサのエネルギーだけ（コイルの分を足していない）", w: 1, cut: 1}, {x: (WL + Wd), why: "コンデンサの電圧を、2つとも電源の電圧にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s3two", text: "図のように、$" + qv(E, "V") + "$ の電源に、$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ と「$L_1 = " + fmt(L1) + "\\,\\mathrm{mH}$・$R_1 = " + qv(R1, "O") + "$」の並列と、「$L_2 = " + fmt(L2) + "\\,\\mathrm{mH}$・$R_2 = " + qv(R2, "O") + "$」と $C_2 = " + fmt(C2) + "\\,\\mu\\mathrm{F}$ の並列をつなぎます。定常状態で、2つのコイルと2つのコンデンサに蓄えられるエネルギーの和は何 J ですか。", fig: {kind: "u55s3two", L: tbU55s3_fig({"r1":"{R}_1","r2":"{R}_2","l":"{L}","c":"{C}","src":"{E}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["l1", "{L}_1"], ["l2", "{L}_2"], ["c1", "{C}_1"], ["c2", "{C}_2"], ["l", null], ["c", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常は $I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$。$C_1$ の電圧は $R_1$ の電圧 $" + qv(V1, "V") + "$、$C_2$ の電圧は $R_2$ の電圧 $" + qv(V2, "V") + "$", "コイル $\\dfrac{1}{2} \\times (" + fmt(L1) + " + " + fmt(L2) + ") \\times 10^{-3} \\times " + fmt(I) + "^2 = " + qv(WL, "J") + "$、コンデンサ $" + qv(WC, "J") + "$", "$W = " + fmt(WL) + " + " + fmt(WC) + " = " + qv(ok, "J") + "$"], chk: {form: "u55s3two", p: {E: E, R1: R1, R2: R2, L1: L1, L2: L2, C1: C1, C2: C2}}};
  }
  throw new Error("u55s3two：条件に合う数字が見つからない");
}
// 55-4 テブナンで時定数と最後の電圧 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u55_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU55s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU55s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU55s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU55s4_par(a, b){ return a * b / (a + b); }
function tbU55s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU55s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU55s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU55s4_Qpair(r){
  var gcd = tbU55s4_gcd, ratio = tbU55s4_ratio, par = tbU55s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var Cu = pick(r, [10,20,50,100,200,250,500,1000]);
    var Rp = (R1 * R2 / (R1 + R2));
    var T = (R1 * R2 / (R1 + R2) * Cu / 1000);
    var V = (E * R2 / (R1 + R2));
    var T1 = (R1 * Cu / 1000);
    var Ts = ((R1 + R2) * Cu / 1000);
    if (!(R1 != R2 && nice(Rp) && nice(T) && nice(V) && nice(T1) && nice(Ts) && V != E)) continue;
    var _c = choices(r, [{t: "$" + fmt(T) + "\\,\\mathrm{ms}$、$" + qv(V, "V") + "$", v: "ok"}, {t: "$" + fmt(T) + "\\,\\mathrm{ms}$、$" + qv(E, "V") + "$", v: "e", why: "最後の電圧を分圧していない（$R_2$ の電圧でなく電源の電圧にした）"}, {t: "$" + fmt(T1) + "\\,\\mathrm{ms}$、$" + qv(E, "V") + "$", v: "r1", why: "コンデンサから見た合成抵抗を使わず、$R_1$ と電源の電圧で出した"}, {t: "$" + fmt(Ts) + "\\,\\mathrm{ms}$、$" + qv(V, "V") + "$", v: "s", why: "$R_1$ と $R_2$ を直列にした（電源を導線にすると並列）"}]);
    return {form: "u55s4pair", text: "図のように、$" + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ とスイッチを直列につなぎ、その先に $R_2 = " + qv(R2, "O") + "$ と $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。スイッチを入れた後の時定数と、コンデンサの最後の電圧の組はどれですか。", fig: {kind: "u55s4q", L: tbU55s4_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{v}_C","sw":""}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["c", "{C}=" + fmt(Cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源を導線にしてコンデンサから見る　$R_0 = \\dfrac{" + fmt(R1) + " \\times " + fmt(R2) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(Rp, "O") + "$", "$\\tau = " + fmt(Rp) + " \\times " + fmt(Cu) + " \\times 10^{-6}\\,\\mathrm{s} = " + fmt(T) + "\\,\\mathrm{ms}$", "最後の電圧は $R_2$ の電圧　$v_C = " + fmt(E) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(V, "V") + "$"], chk: {form: "u55s4pair", p: {E: E, R1: R1, R2: R2, Cu: Cu}}};
  }
  throw new Error("u55s4pair：条件に合う数字が見つからない");
}
function tbU55s4_Qvf(r){
  var gcd = tbU55s4_gcd, ratio = tbU55s4_ratio, par = tbU55s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var V = (E * R2 / (R1 + R2));
    var I = (E / (R1 + R2));
    var V1 = (E * R1 / (R1 + R2));
    if (!(R1 != R2 && nice(V) && nice(I) && V != E && I != V)) continue;
    var ok = (V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s4_three4(ok, [{x: (E), why: "分圧していない（十分に時間がたっても電源の電圧になると考えた）", w: 0, cut: 1}, {x: (I), why: "定常の電流で止めた（$R_2$ の電圧にしていない）", w: 1, cut: 1}, {x: (V1), why: "$R_1$ の電圧を答えた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s4vf", text: "図のように、$" + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ とスイッチを直列につなぎ、その先に $R_2 = " + qv(R2, "O") + "$ とコンデンサを並列につなぎます。スイッチを入れて十分に時間がたった後の、コンデンサの電圧は何 V ですか。", fig: {kind: "u55s4q", L: tbU55s4_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{v}_C","sw":""}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["十分に時間がたつと、コンデンサの道に流れない　$R_1$ と $R_2$ の直列", "$v_C$ は $R_2$ の電圧　$v_C = " + fmt(E) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(ok, "V") + "$"], chk: {form: "u55s4vf", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u55s4vf：条件に合う数字が見つからない");
}
function tbU55s4_Qtau(r){
  var gcd = tbU55s4_gcd, ratio = tbU55s4_ratio, par = tbU55s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var Cu = pick(r, [10,20,50,100,200,250,500,1000]);
    var T = (R1 * R2 / (R1 + R2) * Cu / 1000);
    var T1 = (R1 * Cu / 1000);
    var T2 = (R2 * Cu / 1000);
    var Ts = ((R1 + R2) * Cu / 1000);
    if (!(R1 != R2 && nice(T) && nice(T1) && nice(T2) && nice(Ts))) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s4_three4(ok, [{x: (T1), why: "$R_1$ だけで出した（$R_2$ を合成していない）", w: 0, cut: 1}, {x: (T2), why: "$R_2$ だけで出した（$R_1$ を合成していない）", w: 1, cut: 1}, {x: (Ts), why: "$R_1$ と $R_2$ を直列にした（電源を導線にすると並列）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s4tau", text: "図のように、電源に $R_1 = " + qv(R1, "O") + "$ とスイッチを直列につなぎ、その先に $R_2 = " + qv(R2, "O") + "$ と $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。スイッチを入れた後の時定数は何 ms ですか。", fig: {kind: "u55s4q", L: tbU55s4_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{v}_C","sw":""}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["c", "{C}=" + fmt(Cu) + " μF"], ["vc", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源を導線にしてコンデンサから見る　$R_0 = \\dfrac{" + fmt(R1) + " \\times " + fmt(R2) + "}{" + fmt(R1) + " + " + fmt(R2) + "}\\,\\Omega$", "$\\tau = R_0 C = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u55s4tau", p: {R1: R1, R2: R2, Cu: Cu}}};
  }
  throw new Error("u55s4tau：条件に合う数字が見つからない");
}
// 55-5 放電：時定数とエネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u55_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU55s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU55s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU55s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU55s5_par(a, b){ return a * b / (a + b); }
function tbU55s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU55s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU55s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU55s5_Qpair(r){
  var gcd = tbU55s5_gcd, ratio = tbU55s5_ratio, par = tbU55s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Vk = pick(r, [1,2,3,4,5]);
    var Cu = pick(r, [10,20,40,50,100,200,500]);
    var Rk = pick(r, [1,2,4,5,10,20]);
    var T = (Rk * Cu / 1000);
    var Wj = (Cu * Vk * Vk / 2);
    var Tm = (Rk * Cu);
    var W2 = (Cu * Vk * Vk);
    if (!(nice(T) && T >= 0.01 && T <= 10 && nice(Wj) && Wj >= 1 && Wj <= 10000)) continue;
    var _c = choices(r, [{t: "$" + fmt(T) + "\\,\\mathrm{s}$、$" + fmt(Wj) + "\\,\\mathrm{J}$", v: "ok"}, {t: "$" + fmt(T) + "\\,\\mathrm{s}$、$" + fmt(Wj) + " \\times 10^{-6}\\,\\mathrm{J}$", v: "w_k", why: "エネルギーの式で、kV を V に直していない"}, {t: "$" + fmt(Tm) + " \\times 10^{-6}\\,\\mathrm{s}$、$" + fmt(Wj) + "\\,\\mathrm{J}$", v: "t_k", why: "時定数の式で、kΩ を Ω に直していない"}, {t: "$" + fmt(T) + "\\,\\mathrm{s}$、$" + fmt(W2) + "\\,\\mathrm{J}$", v: "w_2", why: "静電エネルギーの式の 1/2 を落とした"}]);
    return {form: "u55s5pair", text: "$" + fmt(Vk) + "\\,\\mathrm{kV}$ に充電した $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを、$" + fmt(Rk) + "\\,\\mathrm{k\\Omega}$ の抵抗につないで放電させます。時定数と、十分に時間がたつまでに抵抗で消費されるエネルギーの組はどれですか。", fig: {kind: "u55s5dis", L: tbU55s5_fig({"c":"{C}","pp":"top","q":"{Q}","vc":"{v}_C","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall","tau":"τ"}, [["c", "{C}=" + fmt(Cu) + " μF"], ["vc", "{v}_C=" + fmt(Vk) + " kV"], ["r", "{R}=" + fmt(Rk) + " kΩ"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(Vk) + "\\,\\mathrm{kV} = " + fmt(Vk * 1000) + "\\,\\mathrm{V}$、$" + fmt(Rk) + "\\,\\mathrm{k\\Omega} = " + fmt(Rk * 1000) + "\\,\\Omega$", "$\\tau = RC = " + fmt(Rk * 1000) + " \\times " + fmt(Cu) + " \\times 10^{-6} = " + fmt(T) + "\\,\\mathrm{s}$", "$W = \\dfrac{1}{2} \\times " + fmt(Cu) + " \\times 10^{-6} \\times " + fmt(Vk * 1000) + "^2 = " + fmt(Wj) + "\\,\\mathrm{J}$"], chk: {form: "u55s5pair", p: {Rk: Rk, Cu: Cu, Vk: Vk}}};
  }
  throw new Error("u55s5pair：条件に合う数字が見つからない");
}
function tbU55s5_Qw(r){
  var gcd = tbU55s5_gcd, ratio = tbU55s5_ratio, par = tbU55s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Vk = pick(r, [1,2,3,4,5]);
    var Cu = pick(r, [10,20,40,50,100,200,500]);
    var Wj = (Cu * Vk * Vk / 2);
    if (!(nice(Wj) && Wj >= 1 && Wj <= 10000)) continue;
    var ok = (Wj);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s5_three4(ok, [{x: (Cu * Vk / 1000), why: "電荷 $Q = CV$ で止めた（エネルギーの式に入れていない）", w: 0, cut: 1}, {x: (Cu * Vk * Vk * 1000000 / 2), why: "μF を F に直していない", w: 1, cut: 1}, {x: (Cu * Vk * Vk / 2000000), why: "kV を V に直していない", w: 2, cut: 1}, {x: (Cu * Vk * Vk), why: "静電エネルギーの式の 1/2 を落とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s5w", text: "$" + fmt(Vk) + "\\,\\mathrm{kV}$ に充電した $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを、抵抗につないで放電させます。十分に時間がたつまでに抵抗で消費されるエネルギーは何 J ですか。", fig: {kind: "u55s5dis", L: tbU55s5_fig({"c":"{C}","pp":"top","q":"{Q}","vc":"{v}_C","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall","tau":"τ"}, [["c", "{C}=" + fmt(Cu) + " μF"], ["vc", "{v}_C=" + fmt(Vk) + " kV"], ["tau", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗で消費されるエネルギーは、初めの静電エネルギーと同じ", "$W = \\dfrac{1}{2} \\times " + fmt(Cu) + " \\times 10^{-6} \\times " + fmt(Vk * 1000) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u55s5w", p: {Cu: Cu, Vk: Vk}}};
  }
  throw new Error("u55s5w：条件に合う数字が見つからない");
}
function tbU55s5_Qvk(r){
  var gcd = tbU55s5_gcd, ratio = tbU55s5_ratio, par = tbU55s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Vk = pick(r, [2,3,4,5,6,8,10]);
    var Cu = pick(r, [10,20,40,50,100,200,500]);
    var Wj = (Cu * Vk * Vk / 2);
    if (!(nice(Wj) && Wj >= 1 && Wj <= 10000)) continue;
    var ok = (Vk);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU55s5_three4(ok, [{x: (Vk * Vk), why: "電圧の2乗で止めた（平方根をとっていない）", w: 0, cut: 1}, {x: (Vk * 1000), why: "V のまま答えた（kV に直していない）", w: 1, cut: 1}, {x: (Vk * Vk * 1000), why: "静電エネルギーの式の2乗を落とした（$W = \\dfrac{1}{2} C v_C$ とした）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u55s5vk", text: "$" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを抵抗につないで放電させたところ、十分に時間がたつまでに抵抗で消費されたエネルギーは $" + qv(Wj, "J") + "$ でした。コンデンサの初めの電圧 $v_C$ [kV] の値はいくつですか。", fig: {kind: "u55s5dis", L: tbU55s5_fig({"c":"{C}","pp":"top","q":"{Q}","vc":"{v}_C","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall","tau":"τ"}, [["c", "{C}=" + fmt(Cu) + " μF"], ["vc", "{v}_C"], ["tau", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗で消費されたエネルギー＝初めの静電エネルギー", "$v_C^2 = \\dfrac{2W}{C} = \\dfrac{2 \\times " + fmt(Wj) + "}{" + fmt(Cu) + " \\times 10^{-6}} = " + fmt(Vk * Vk) + " \\times 10^{6}$", "$v_C = " + fmt(Vk * 1000) + "\\,\\mathrm{V} = " + fmt(ok) + "\\,\\mathrm{kV}$"], chk: {form: "u55s5vk", p: {W2: Cu * Vk * Vk, Cu: Cu}}};
  }
  throw new Error("u55s5vk：条件に合う数字が見つからない");
}
// 55-6 合成した R と C の時定数を比べる の練習（※ textbook/gen/make_section.py が textbook/gen/data/u55_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU55s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU55s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU55s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU55s6_par(a, b){ return a * b / (a + b); }
function tbU55s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU55s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU55s6_Qbig(r){
  var gcd = tbU55s6_gcd, ratio = tbU55s6_ratio, par = tbU55s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Ra = pick(r, [2,4,5,10,20,40,50,100]);
    var Ca = pick(r, [10,20,40,50,100,200,500]);
    var Rb = pick(r, [2,4,5,10,20,40,50,100]);
    var Cb = pick(r, [10,20,40,50,100,200,500]);
    var Rc = pick(r, [2,4,5,10,20,40,50,100]);
    var Cc = pick(r, [10,20,40,50,100,200,500]);
    var Rd = pick(r, [2,4,5,10,20,40,50,100]);
    var Cd = pick(r, [10,20,40,50,100,200,500]);
    var tA = (Ra * Ca / 1000);
    var tB = (Rb / 2 * Cb / 1000);
    var tC = (Rc * 2 * Cc / 1000);
    var tD = (2 * Rd * Cd / 2 / 1000);
    var T = ([tA, tB, tC, tD]);
    var WHY = (['(ア) は ' + fmt(tA) + ' ms', '(イ) は ' + fmt(tB) + ' ms（抵抗の並列で半分）', '(ウ) は ' + fmt(tC) + ' ms（コンデンサの並列で2倍）', '(エ) は ' + fmt(tD) + ' ms（抵抗は2倍・コンデンサは半分）']);
    var k = (T.indexOf(max(tA, tB, tC, tD)));
    var o1 = ([0, 1, 2, 3].filter(function(j){ return j != k; })[0]);
    var o2 = ([0, 1, 2, 3].filter(function(j){ return j != k; })[1]);
    var o3 = ([0, 1, 2, 3].filter(function(j){ return j != k; })[2]);
    var N = (['(ア)', '(イ)', '(ウ)', '(エ)']);
    var K = (['a', 'b', 'c', 'd']);
    var Tk = (T[k]);
    if (!(distinct([tA, tB, tC, tD]) && nice(tA) && nice(tB) && nice(tC) && nice(tD))) continue;
    var _c = choices(r, [{t: String(N[k]), v: String(K[k])}, {t: String(N[o1]), v: String(K[o1]), why: String(WHY[o1]) + "（" + String(N[k]) + " は " + fmt(Tk) + " ms）"}, {t: String(N[o2]), v: String(K[o2]), why: String(WHY[o2]) + "（" + String(N[k]) + " は " + fmt(Tk) + " ms）"}, {t: String(N[o3]), v: String(K[o3]), why: String(WHY[o3]) + "（" + String(N[k]) + " は " + fmt(Tk) + " ms）"}]);
    return {form: "u55s6big", text: "図の (ア)〜(エ) の回路で、充電する時の時定数が最も大きいものはどれですか。", fig: {kind: "u55s6g4", L: tbU55s6_fig({"ra":"{R}","ca":"{C}","rb1":"{R}","rb2":"{R}","cb":"{C}","rc":"{R}","cc1":"{C}","cc2":"{C}","rd1":"{R}","rd2":"{R}","cd1":"{C}","cd2":"{C}"}, [["ra", fmt(Ra) + " Ω"], ["ca", fmt(Ca) + " μF"], ["rb1", fmt(Rb) + " Ω"], ["rb2", fmt(Rb) + " Ω"], ["cb", fmt(Cb) + " μF"], ["rc", fmt(Rc) + " Ω"], ["cc1", fmt(Cc) + " μF"], ["cc2", fmt(Cc) + " μF"], ["rd1", fmt(Rd) + " Ω"], ["rd2", fmt(Rd) + " Ω"], ["cd1", fmt(Cd) + " μF"], ["cd2", fmt(Cd) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗とコンデンサを、それぞれ合成してから $\\tau = RC$", "(ア) $" + fmt(tA) + "$・(イ) $" + fmt(tB) + "$・(ウ) $" + fmt(tC) + "$・(エ) $" + fmt(tD) + "\\,\\mathrm{ms}$", "最も大きいのは " + String(N[k])], chk: {form: "u55s6big", p: {Ra: Ra, Ca: Ca, Rb: Rb, Cb: Cb, Rc: Rc, Cc: Cc, Rd: Rd, Cd: Cd}}};
  }
  throw new Error("u55s6big：条件に合う数字が見つからない");
}
function tbU55s6_Qsmall(r){
  var gcd = tbU55s6_gcd, ratio = tbU55s6_ratio, par = tbU55s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Ra = pick(r, [2,4,5,10,20,40,50,100]);
    var Ca = pick(r, [10,20,40,50,100,200,500]);
    var Rb = pick(r, [2,4,5,10,20,40,50,100]);
    var Cb = pick(r, [10,20,40,50,100,200,500]);
    var Rc = pick(r, [2,4,5,10,20,40,50,100]);
    var Cc = pick(r, [10,20,40,50,100,200,500]);
    var Rd = pick(r, [2,4,5,10,20,40,50,100]);
    var Cd = pick(r, [10,20,40,50,100,200,500]);
    var tA = (Ra * Ca / 1000);
    var tB = (Rb / 2 * Cb / 1000);
    var tC = (Rc * 2 * Cc / 1000);
    var tD = (2 * Rd * Cd / 2 / 1000);
    var T = ([tA, tB, tC, tD]);
    var WHY = (['(ア) は ' + fmt(tA) + ' ms', '(イ) は ' + fmt(tB) + ' ms（抵抗の並列で半分）', '(ウ) は ' + fmt(tC) + ' ms（コンデンサの並列で2倍）', '(エ) は ' + fmt(tD) + ' ms（抵抗は2倍・コンデンサは半分）']);
    var k = (T.indexOf(min(tA, tB, tC, tD)));
    var o1 = ([0, 1, 2, 3].filter(function(j){ return j != k; })[0]);
    var o2 = ([0, 1, 2, 3].filter(function(j){ return j != k; })[1]);
    var o3 = ([0, 1, 2, 3].filter(function(j){ return j != k; })[2]);
    var N = (['(ア)', '(イ)', '(ウ)', '(エ)']);
    var K = (['a', 'b', 'c', 'd']);
    var Tk = (T[k]);
    if (!(distinct([tA, tB, tC, tD]) && nice(tA) && nice(tB) && nice(tC) && nice(tD))) continue;
    var _c = choices(r, [{t: String(N[k]), v: String(K[k])}, {t: String(N[o1]), v: String(K[o1]), why: String(WHY[o1]) + "（" + String(N[k]) + " は " + fmt(Tk) + " ms）"}, {t: String(N[o2]), v: String(K[o2]), why: String(WHY[o2]) + "（" + String(N[k]) + " は " + fmt(Tk) + " ms）"}, {t: String(N[o3]), v: String(K[o3]), why: String(WHY[o3]) + "（" + String(N[k]) + " は " + fmt(Tk) + " ms）"}]);
    return {form: "u55s6small", text: "図の (ア)〜(エ) の回路で、充電する時の時定数が最も小さいものはどれですか。", fig: {kind: "u55s6g4", L: tbU55s6_fig({"ra":"{R}","ca":"{C}","rb1":"{R}","rb2":"{R}","cb":"{C}","rc":"{R}","cc1":"{C}","cc2":"{C}","rd1":"{R}","rd2":"{R}","cd1":"{C}","cd2":"{C}"}, [["ra", fmt(Ra) + " Ω"], ["ca", fmt(Ca) + " μF"], ["rb1", fmt(Rb) + " Ω"], ["rb2", fmt(Rb) + " Ω"], ["cb", fmt(Cb) + " μF"], ["rc", fmt(Rc) + " Ω"], ["cc1", fmt(Cc) + " μF"], ["cc2", fmt(Cc) + " μF"], ["rd1", fmt(Rd) + " Ω"], ["rd2", fmt(Rd) + " Ω"], ["cd1", fmt(Cd) + " μF"], ["cd2", fmt(Cd) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗とコンデンサを、それぞれ合成してから $\\tau = RC$", "(ア) $" + fmt(tA) + "$・(イ) $" + fmt(tB) + "$・(ウ) $" + fmt(tC) + "$・(エ) $" + fmt(tD) + "\\,\\mathrm{ms}$", "最も小さいのは " + String(N[k])], chk: {form: "u55s6small", p: {Ra: Ra, Ca: Ca, Rb: Rb, Cb: Cb, Rc: Rc, Cc: Cc, Rd: Rd, Cd: Cd}}};
  }
  throw new Error("u55s6small：条件に合う数字が見つからない");
}
var GEN = {
  // 55-1 瞬間と定常の電流の比
  1: function(r){ return pick(r, [tbU55s1_Qratio, tbU55s1_Qratio, tbU55s1_Qratio, tbU55s1_Qnoe, tbU55s1_Qnoe, tbU55s1_Qcoil, tbU55s1_Qcoil])(r); },
  // 55-2 比から逆に抵抗を出す
  2: function(r){ return pick(r, [tbU55s2_Qr3, tbU55s2_Qr3, tbU55s2_Qr3, tbU55s2_Qsym, tbU55s2_Qsym])(r); },
  // 55-3 定常のエネルギーの和
  3: function(r){ return pick(r, [tbU55s3_Qsum, tbU55s3_Qsum, tbU55s3_Qsum, tbU55s3_Qwc, tbU55s3_Qwc, tbU55s3_Qwl, tbU55s3_Qwl, tbU55s3_Qtwo, tbU55s3_Qtwo])(r); },
  // 55-4 テブナンで時定数と最後の電圧
  4: function(r){ return pick(r, [tbU55s4_Qpair, tbU55s4_Qpair, tbU55s4_Qpair, tbU55s4_Qvf, tbU55s4_Qvf, tbU55s4_Qtau, tbU55s4_Qtau])(r); },
  // 55-5 放電：時定数とエネルギー
  5: function(r){ return pick(r, [tbU55s5_Qpair, tbU55s5_Qpair, tbU55s5_Qpair, tbU55s5_Qw, tbU55s5_Qw, tbU55s5_Qvk, tbU55s5_Qvk])(r); },
  // 55-6 合成した R と C の時定数を比べる
  6: function(r){ return pick(r, [tbU55s6_Qbig, tbU55s6_Qbig, tbU55s6_Qbig, tbU55s6_Qsmall, tbU55s6_Qsmall])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t55s1e","scene":"t55s1e","kind":"u55s1ae","lab":{"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}","i0":"{I}_0","i":"{I}"},"viewbox":"463 211 640 425","band":{"want":"瞬間の電流 $I_0$ と定常の電流 $I$ の比","ans":"2回、描き直して合成抵抗を出し、電流を割る"},"narr":{"start":{"co":0,"swc":1,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"①瞬間に描き直す\n②定常に描き直す\n③割る\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"スイッチを入れた瞬間、コンデンサは $0\\,\\Omega$ の〖素通り〗です。導線に描き直して、$I_0$ を出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"rd","emph":["C","I0"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたつと、コンデンサの道には〖流れません〗。その道を切って描き直し、$I$ を出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"rs","emph":["I","R2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"同じ電源なので、〖2つの電流の比は、合成抵抗の逆比〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["強調","答え"],"route":3,"emph":["I0","I"],"eq":[{"cont":false,"items":[["\\dfrac{I_0}{I}"]]}],"emphPre":["I0","I","src"],"ans":true}]}],"groups":{"I":["ia","ia:h","it0","it1","ix2a","ix2a:h","ix2t0","ix2t1"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1","swx1","swx1:p0","swx1:p1","swx1t0","swx1t1","swx2","swx2:p0","swx2:p1","swx2t0","swx2t1"],"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21"],"zhi":["u55s1aeL","u55s1aew2","u55s1aew12","u55s1aew15","u55s1aew16","u55s1aew13","u55s1aex1L","u55s1aex1w2","u55s1aex1w12","u55s1aex1w15","u55s1aex1w16","u55s1aex1w13","u55s1aex2L","u55s1aex2w2","u55s1aex2w12","u55s1aex2w15","u55s1aex2w16","u55s1aex2w13"],"zmid":["u55s1aew3","u55s1aew5","u55s1aew8","u55s1aew10","u55s1aex1w3","u55s1aex1w5","u55s1aex1w6","u55s1aex1w8","u55s1aex1w10","u55s1aex2w3","u55s1aex2w5","u55s1aex2w8","u55s1aex2w10"],"zlo":["u55s1aew4","u55s1aew7","u55s1aew9","u55s1aew11","u55s1aew14","u55s1aew17","u55s1aew18","u55s1aex1w4","u55s1aex1w7","u55s1aex1w9","u55s1aex1w11","u55s1aex1w14","u55s1aex1w17","u55s1aex1w18","u55s1aex2w4","u55s1aex2w7","u55s1aex2w9","u55s1aex2w11","u55s1aex2w14","u55s1aex2w17","u55s1aex2w18","u55s1aex2w6"],"zmid2":["u55s1aew6"],"I0":["i0x1a","i0x1a:h","i0x1t0","i0x1t1"]},"moves":{"rd":{"to":{"t":1},"dur":0.6},"rs":{"to":{"t":2},"dur":0.6}},"route":["瞬間に描き直す","定常に描き直す","割る"]}},{"id":"t55s1x","scene":"t55s1x","kind":"u55s1xr","lab":{"sw":"","r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=12 Ω","c":"{C}","src":"{E}=36 V","i0":["{I}_0","{I}_0=3 A"],"i":["{I}","{I}=2 A"]},"viewbox":"463 211 640 425","band":{"want":"瞬間の電流 $I_0$ と定常の電流 $I$ の比 $\\dfrac{I_0}{I}$","known":"$E = 36\\,\\mathrm{V},\\;\\; R_1 = 6\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega$","ans":"$1.5$"},"narr":{"start":{"co":0,"swc":1,"t":0,"i0v":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、瞬間の電流 $I_0$ と、定常の電流 $I$ の比です。","at":{"強調":1.0},"after":[],"emph":["C","I0","I"]},{"text":"①瞬間の電流\n②定常の電流\n③割る\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"スイッチを入れた瞬間、コンデンサは $0\\,\\Omega$ の素通りです。導線に描き直します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"rd","emph":["C"]},{"text":"$R_2$ と $R_3$ の並列に、$R_1$ が直列です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["6 + \\dfrac{12 \\times 12}{12 + 12} = 12\\,\\Omega"]]}],"emphPre":["R1","R2","R3"]},{"text":"オームの法則で、$I_0$ を出します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","I0"],"eq":[{"cont":false,"items":[["I_0 = \\dfrac{36}{12} = 3\\,\\mathrm{A}"]]}],"move":"i0","emphPre":["src","I0"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたつと、コンデンサの道には流れません。$R_2$ には電流が流れず、$R_1$ と $R_3$ の直列です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"rs","emph":["R1","R3","R2"],"eq":[{"cont":false,"items":[["6 + 12 = 18\\,\\Omega"]]}],"emphPre":["R1","R3","R2"]},{"text":"〖この $18\\,\\Omega$ で、もう一度オームの法則〗です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{36}{18} = 2\\,\\mathrm{A}"]]}],"move":"i","emphPre":["src","I"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"2つの電流を割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["I0","I"],"eq":[{"cont":false,"items":[["\\dfrac{I_0}{I} = \\dfrac{3}{2} = 1.5"]]}],"emphPre":["I0","I"]},{"text":"同じ電源なので、合成抵抗の逆比 $\\dfrac{18}{12}$ と同じです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["src"]}]}],"groups":{"I":["ia","ia:h","it0","it1","ix2a","ix2a:h","ix2t0","ix2t1"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1","swx1","swx1:p0","swx1:p1","swx1t0","swx1t1","swx2","swx2:p0","swx2:p1","swx2t0","swx2t1"],"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21"],"zhi":["u55s1xrL","u55s1xrw2","u55s1xrw12","u55s1xrw15","u55s1xrw16","u55s1xrw13","u55s1xrx1L","u55s1xrx1w2","u55s1xrx1w12","u55s1xrx1w15","u55s1xrx1w16","u55s1xrx1w13","u55s1xrx2L","u55s1xrx2w2","u55s1xrx2w12","u55s1xrx2w15","u55s1xrx2w16","u55s1xrx2w13"],"zmid":["u55s1xrw3","u55s1xrw5","u55s1xrw8","u55s1xrw10","u55s1xrx1w3","u55s1xrx1w5","u55s1xrx1w6","u55s1xrx1w8","u55s1xrx1w10","u55s1xrx2w3","u55s1xrx2w5","u55s1xrx2w8","u55s1xrx2w10"],"zlo":["u55s1xrw4","u55s1xrw7","u55s1xrw9","u55s1xrw11","u55s1xrw14","u55s1xrw17","u55s1xrw18","u55s1xrx1w4","u55s1xrx1w7","u55s1xrx1w9","u55s1xrx1w11","u55s1xrx1w14","u55s1xrx1w17","u55s1xrx1w18","u55s1xrx2w4","u55s1xrx2w7","u55s1xrx2w9","u55s1xrx2w11","u55s1xrx2w14","u55s1xrx2w17","u55s1xrx2w18","u55s1xrx2w6"],"zmid2":["u55s1xrw6"],"I0":["i0x1a","i0x1a:h","i0x1t0","i0x1t1"]},"moves":{"rd":{"to":{"t":1},"dur":0.6},"rs":{"to":{"t":2},"dur":0.6},"i0":{"to":{"i0v":1},"dur":0.4},"i":{"to":{"iv":1},"dur":0.4}},"route":["瞬間の電流","定常の電流","割る"]}},{"id":"t55s2e","scene":"t55s2e","kind":"u55s2ae","lab":{"sw":"","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","src":"{E}","i0":"{I}_0","i":"{I}"},"viewbox":"464 211 639 419","band":{"want":"比が決まっている時の $R_3$","ans":"2つの合成抵抗の逆比を、決まった比と等しく置いて解く"},"narr":{"start":{"co":0,"swc":1,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"①2つの合成抵抗\n②等しく置く\n③解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R3"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"瞬間はコンデンサが素通り、定常はコンデンサの道に流れません。2回、描き直して、合成抵抗を式で書きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"rd","emph":["C","R3","R2"]},{"text":"定常では $R_3$ の道に流れないので、$R_1$ と $R_2$ の直列です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"rs","emph":["R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"同じ電源なので、電流の比は合成抵抗の逆比です。〖それを、決まった比と等しく置きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I0","I"],"eq":[{"cont":false,"items":[["\\dfrac{I_0}{I}"]]}],"emphPre":["I0","I"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"並列の部分の合成抵抗が出たら、そこから $R_3$ を解きます。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["R2","R3"],"ans":true}]}],"groups":{"I":["ia","ia:h","it0","it1","ix2a","ix2a:h","ix2t0","ix2t1"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1","swx1","swx1:p0","swx1:p1","swx1t0","swx1t1","swx2","swx2:p0","swx2:p1","swx2t0","swx2t1"],"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21"],"zhi":["u55s2aeL","u55s2aew2","u55s2aew12","u55s2aew15","u55s2aew16","u55s2aew13","u55s2aex1L","u55s2aex1w2","u55s2aex1w12","u55s2aex1w15","u55s2aex1w16","u55s2aex1w13","u55s2aex2L","u55s2aex2w2","u55s2aex2w12","u55s2aex2w15","u55s2aex2w16","u55s2aex2w13"],"zmid":["u55s2aew3","u55s2aew5","u55s2aew8","u55s2aew10","u55s2aex1w3","u55s2aex1w5","u55s2aex1w6","u55s2aex1w8","u55s2aex1w10","u55s2aex2w3","u55s2aex2w5","u55s2aex2w8","u55s2aex2w10"],"zlo":["u55s2aew4","u55s2aew7","u55s2aew9","u55s2aew11","u55s2aew14","u55s2aew17","u55s2aew18","u55s2aex1w4","u55s2aex1w7","u55s2aex1w9","u55s2aex1w11","u55s2aex1w14","u55s2aex1w17","u55s2aex1w18","u55s2aex2w4","u55s2aex2w7","u55s2aex2w9","u55s2aex2w11","u55s2aex2w14","u55s2aex2w17","u55s2aex2w18","u55s2aex2w6"],"zmid2":["u55s2aew6"],"I0":["i0x1a","i0x1a:h","i0x1t0","i0x1t1"]},"moves":{"rd":{"to":{"t":1},"dur":0.6},"rs":{"to":{"t":2},"dur":0.6}},"route":["2つの合成抵抗","等しく置く","解く"]}},{"id":"t55s2x","scene":"t55s2x","kind":"u55s2xr","lab":{"sw":"","r1":"{R}_1=3 Ω","r2":"{R}_2=15 Ω","r3":["{R}_3","{R}_3=10 Ω"],"c":"{C}","src":"{E}","i0":"{I}_0","i":"{I}"},"viewbox":"464 211 639 419","band":{"want":"$\\dfrac{I_0}{I} = 2$ にする $R_3$","known":"$R_1 = 3\\,\\Omega,\\;\\; R_2 = 15\\,\\Omega,\\;\\; \\dfrac{I_0}{I} = 2$","ans":"$R_3 = 10\\,\\Omega$"},"narr":{"start":{"co":0,"swc":1,"t":0,"r3v":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、$\\dfrac{I_0}{I} = 2$ にする $R_3$ です。","at":{"強調":1.0},"after":[],"emph":["R3","I0","I"]},{"text":"①定常の合成抵抗\n②等しく置く\n③並列の部分\n④解く\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"定常では、コンデンサの道に流れません。$R_1$ と $R_2$ の直列です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"rs","emph":["R1","R2"],"eq":[{"cont":false,"items":[["3 + 15 = 18\\,\\Omega"]]}],"emphPre":["R1","R2","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"瞬間は、コンデンサが素通りです。$R_2$ と $R_3$ の並列を $R_{23}$ と書くと、合成抵抗は $3 + R_{23}$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"rd","emph":["R1","R2","R3","C"]},{"text":"同じ電源なので、電流の比は合成抵抗の逆比です。〖これを 2 と等しく置きます〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I0","I"],"eq":[{"cont":false,"items":[["\\dfrac{I_0}{I} = \\dfrac{18}{3 + R_{23}} = 2"]]}],"emphPre":["I0","I"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"解くと、並列の部分は $6\\,\\Omega$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R2","R3"],"eq":[{"cont":false,"items":[["3 + R_{23} = 9"],["R_{23} = 6\\,\\Omega"]]}],"emphPre":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$R_2$ と $R_3$ の並列が $6\\,\\Omega$ になる $R_3$ を解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":4,"emph":["R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{15 R_3}{15 + R_3} = 6"],["15 R_3 = 90 + 6 R_3"],["R_3 = 10\\,\\Omega"]]}],"move":"r3","ans":true,"emphPre":["R2","R3"]}]}],"groups":{"I":["ia","ia:h","it0","it1","ix2a","ix2a:h","ix2t0","ix2t1"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1","swx1","swx1:p0","swx1:p1","swx1t0","swx1t1","swx2","swx2:p0","swx2:p1","swx2t0","swx2t1"],"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21"],"zhi":["u55s2xrL","u55s2xrw2","u55s2xrw12","u55s2xrw15","u55s2xrw16","u55s2xrw13","u55s2xrx1L","u55s2xrx1w2","u55s2xrx1w12","u55s2xrx1w15","u55s2xrx1w16","u55s2xrx1w13","u55s2xrx2L","u55s2xrx2w2","u55s2xrx2w12","u55s2xrx2w15","u55s2xrx2w16","u55s2xrx2w13"],"zmid":["u55s2xrw3","u55s2xrw5","u55s2xrw8","u55s2xrw10","u55s2xrx1w3","u55s2xrx1w5","u55s2xrx1w6","u55s2xrx1w8","u55s2xrx1w10","u55s2xrx2w3","u55s2xrx2w5","u55s2xrx2w8","u55s2xrx2w10"],"zlo":["u55s2xrw4","u55s2xrw7","u55s2xrw9","u55s2xrw11","u55s2xrw14","u55s2xrw17","u55s2xrw18","u55s2xrx1w4","u55s2xrx1w7","u55s2xrx1w9","u55s2xrx1w11","u55s2xrx1w14","u55s2xrx1w17","u55s2xrx1w18","u55s2xrx2w4","u55s2xrx2w7","u55s2xrx2w9","u55s2xrx2w11","u55s2xrx2w14","u55s2xrx2w17","u55s2xrx2w18","u55s2xrx2w6"],"zmid2":["u55s2xrw6"],"I0":["i0x1a","i0x1a:h","i0x1t0","i0x1t1"]},"moves":{"rd":{"to":{"t":1},"dur":0.6},"rs":{"to":{"t":2},"dur":0.6},"r3":{"to":{"r3v":1},"dur":0.4}},"route":["定常の合成抵抗","等しく置く","並列の部分","解く"]}},{"id":"t55s3e","scene":"t55s3e","kind":"u55s3ae","lab":{"r1":"{R}_1","r2":"{R}_2","l":"{L}","c":"{C}","src":"{E}","i":"{I}","vc":"{v}_C"},"viewbox":"319 138 741 503","band":{"want":"定常状態でコイルとコンデンサに蓄えられるエネルギーの和","ans":"定常で描き直し、電流と電圧を出して、2つのエネルギーを足す"},"narr":{"start":{"co":0,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"①定常に描き直す\n②電流と電圧\n③2つのエネルギー\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["L","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"定常では、コイルは素通り、コンデンサの道には流れません。そのように描き直します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"rs","emph":["L","C"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"オームの法則で電流 $I$ を、分圧でコンデンサの電圧 $v_C$ を出します。〖この電流が、コイルのエネルギーにも要ります〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["I","Vc","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"コイルは電流で、コンデンサは電圧で、エネルギーを出して足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["強調","答え"],"route":3,"emph":["L","C","I","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2 + \\dfrac{1}{2} C v_C^2"]]}],"emphPre":["L","C","I","Vc"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1"],"L":["l","lt0","lt1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1"],"Vc":["vcd:e","vcd:f","vcd:a","vct0","vct1","vcx1d:e","vcx1d:f","vcx1d:a","vcx1t0","vcx1t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1","ix1a","ix1a:h","ix1t0","ix1t1"],"zhi":["u55s3aeL","u55s3aew1","u55s3aex1L","u55s3aex1w1"],"zlo":["u55s3aeRw","u55s3aew4","u55s3aew6","u55s3aew8","u55s3aew10","u55s3aex1Rw","u55s3aex1w4","u55s3aex1w6","u55s3aex1w8","u55s3aex1w10"],"zmid":["u55s3aew2","u55s3aex1w2","u55s3aex1w3","u55s3aex1w5","u55s3aex1w7","u55s3aex1w9"],"zmid2":["u55s3aew3","u55s3aew5","u55s3aew7","u55s3aew9"]},"moves":{"rs":{"to":{"t":1},"dur":0.6}},"route":["定常に描き直す","電流と電圧","2つのエネルギー"]}},{"id":"t55s3x","scene":"t55s3x","kind":"u55s3xr","lab":{"r1":"{R}_1=2 Ω","r2":"{R}_2=4 Ω","l":"{L}=10 mH","c":"{C}=500 μF","src":"{E}=12 V","i":["{I}","{I}=2 A"],"vc":["{v}_C","{v}_C=8 V"]},"viewbox":"319 138 741 503","band":{"want":"定常状態で、コイルとコンデンサに蓄えられるエネルギーの和 $W$","known":"$E = 12\\,\\mathrm{V},\\;\\; R_1 = 2\\,\\Omega,\\;\\; L = 10\\,\\mathrm{mH},\\;\\; R_2 = 4\\,\\Omega,\\;\\; C = 500\\,\\mu\\mathrm{F}$","ans":"$W = 0.036\\,\\mathrm{J}$"},"narr":{"start":{"co":0,"t":0,"iv":0,"vcv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、コイルとコンデンサに蓄えられるエネルギーの和 $W$ です。","at":{"強調":1.0},"after":[],"emph":["L","C"]},{"text":"①定常に描き直す\n②電流\n③電圧\n④2つのエネルギー\n⑤足す\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"定常では、コイルは素通り、コンデンサの道には流れません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"rs","emph":["L","C"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$R_1$ と $R_2$ の直列なので、オームの法則で電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["src","R1","R2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{12}{2 + 4} = 2\\,\\mathrm{A}"]]}],"move":"i","emphPre":["src","R1","R2","I"]},{"text":"〖この電流が、コイルのエネルギーと $R_2$ の電圧の両方に要ります〗。","at":{"強調":1.0},"after":[],"emph":["I","L","R2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"コンデンサの電圧は、並列の $R_2$ の電圧と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":3,"emph":["Vc","R2","I"],"eq":[{"cont":false,"items":[["v_C = 4 \\times 2 = 8\\,\\mathrm{V}"]]}],"move":"vc","emphPre":["Vc","R2","I"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"コイルのエネルギーです。$L$ は $0.01\\,\\mathrm{H}$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":4,"emph":["L","I"],"eq":[{"cont":false,"items":[["W_L = \\dfrac{1}{2} L I^2"],["= 5 \\times 10^{-3} \\times 2^2"],["= 0.02\\,\\mathrm{J}"]]}],"emphPre":["L","I"]},{"text":"コンデンサのエネルギーです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W_C = \\dfrac{1}{2} C v_C^2"],["= 250 \\times 10^{-6} \\times 8^2"],["= 0.016\\,\\mathrm{J}"]]}],"emphPre":["C","Vc"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"2つを足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":5,"emph":["L","C"],"eq":[{"cont":false,"items":[["W = 0.02 + 0.016"],["= 0.036\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["L","C"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1"],"L":["l","lt0","lt1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1"],"Vc":["vcd:e","vcd:f","vcd:a","vct0","vct1","vcx1d:e","vcx1d:f","vcx1d:a","vcx1t0","vcx1t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1","ix1a","ix1a:h","ix1t0","ix1t1"],"zhi":["u55s3xrL","u55s3xrw1","u55s3xrx1L","u55s3xrx1w1"],"zlo":["u55s3xrRw","u55s3xrw4","u55s3xrw6","u55s3xrw8","u55s3xrw10","u55s3xrx1Rw","u55s3xrx1w4","u55s3xrx1w6","u55s3xrx1w8","u55s3xrx1w10"],"zmid":["u55s3xrw2","u55s3xrx1w2","u55s3xrx1w3","u55s3xrx1w5","u55s3xrx1w7","u55s3xrx1w9"],"zmid2":["u55s3xrw3","u55s3xrw5","u55s3xrw7","u55s3xrw9"]},"moves":{"rs":{"to":{"t":1},"dur":0.6},"i":{"to":{"iv":1},"dur":0.4},"vc":{"to":{"vcv":1},"dur":0.4}},"route":["定常に描き直す","電流","電圧","2つのエネルギー","足す"]}},{"id":"t55s4e","scene":"t55s4e","kind":"u55s4ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{v}_C","sw":"","rab":"{R}_0"},"viewbox":"447 132 847 515","band":{"want":"時定数と、コンデンサの最後の電圧","ans":"コンデンサから見た合成抵抗で $\\tau$、最後の電圧は分圧"},"narr":{"start":{"co":0,"swc":1,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"①コンデンサから見る\n②時定数\n③最後の電圧\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"電源を導線にして、コンデンサを外した所から見た合成抵抗 $R_0$ を出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"th","emph":["Rab","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"〖この $R_0$ が、時定数の式の抵抗です〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Rab"],"eq":[{"cont":false,"items":[["\\tau = R_0 C"]]}],"emphPre":["Rab"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたつと、コンデンサの道に流れません。最後の電圧は $R_2$ の電圧です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"move":"bk","emph":["Vc","R2","R1","src","C"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1","swx1","swx1:p0","swx1:p1","swx1t0","swx1t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1"],"Vc":["vcd:e","vcd:f","vcd:a","vct0","vct1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u55s4aeL","u55s4aew1"],"zlo":["u55s4aeRw","u55s4aew4","u55s4aew6","u55s4aew8","u55s4aew10"],"zmid":["u55s4aew2","u55s4aew3","u55s4aew5","u55s4aew7","u55s4aew9"],"R0":["r0x1","r0x1t0","r0x1t1"],"Rab":["rabx1d:e","rabx1d:f","rabx1d:a","rabx1t0","rabx1t1"]},"moves":{"th":{"to":{"t":1},"dur":0.6},"bk":{"to":{"t":0},"dur":0.6}},"route":["コンデンサから見る","時定数","最後の電圧"]}},{"id":"t55s4x","scene":"t55s4x","kind":"u55s4xr","lab":{"src":"{E}=12 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","c":"{C}=500 μF","vc":["{v}_C","{v}_C=4 V"],"sw":"","rab":["{R}_0","{R}_0=2 Ω"]},"viewbox":"447 132 847 515","band":{"want":"時定数と、コンデンサの最後の電圧の組","known":"$E = 12\\,\\mathrm{V},\\;\\; R_1 = 6\\,\\Omega,\\;\\; R_2 = 3\\,\\Omega,\\;\\; C = 500\\,\\mu\\mathrm{F}$","ans":"$1\\,\\mathrm{ms}$、$4\\,\\mathrm{V}$"},"narr":{"start":{"co":0,"swc":1,"t":0,"vcv":0,"rabv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、時定数と、コンデンサの最後の電圧の組です。","at":{"強調":1.0},"after":[],"emph":["C","Vc"]},{"text":"①コンデンサから見る\n②時定数\n③最後の電圧\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"電源を導線にして、コンデンサを外した所から見ます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"th","emph":["Rab","R1","R2"]},{"text":"$R_1$ と $R_2$ の並列です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Rab","R1","R2"],"eq":[{"cont":false,"items":[["R_0 = \\dfrac{6 \\times 3}{6 + 3} = 2\\,\\Omega"]]}],"move":"r0","emphPre":["Rab","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"〖この $R_0$ を、時定数の式に入れます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Rab","C"],"eq":[{"cont":false,"items":[["\\tau = R_0 C"],["= 2 \\times 500 \\times 10^{-6}"],["= 1 \\times 10^{-3}\\,\\mathrm{s} = 1\\,\\mathrm{ms}"]]}],"emphPre":["Rab","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたつと、コンデンサの道に流れません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"bk","emph":["C","R2","R1"]},{"text":"最後の電圧は $R_2$ の電圧です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Vc","R2","R1","src","C"],"eq":[{"cont":false,"items":[["v_C = 12 \\times \\dfrac{3}{6 + 3} = 4\\,\\mathrm{V}"]]}],"move":"vc","emphPre":["Vc","R2","R1","src","C"]},{"text":"組は、$1\\,\\mathrm{ms}$ と $4\\,\\mathrm{V}$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Vc","C"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1","swx1","swx1:p0","swx1:p1","swx1t0","swx1t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1"],"Vc":["vcd:e","vcd:f","vcd:a","vct0","vct1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u55s4xrL","u55s4xrw1"],"zlo":["u55s4xrRw","u55s4xrw4","u55s4xrw6","u55s4xrw8","u55s4xrw10"],"zmid":["u55s4xrw2","u55s4xrw3","u55s4xrw5","u55s4xrw7","u55s4xrw9"],"R0":["r0x1","r0x1t0","r0x1t1"],"Rab":["rabx1d:e","rabx1d:f","rabx1d:a","rabx1t0","rabx1t1"]},"moves":{"th":{"to":{"t":1},"dur":0.6},"r0":{"to":{"rabv":1},"dur":0.4},"bk":{"to":{"t":0},"dur":0.6},"vc":{"to":{"vcv":1},"dur":0.4}},"route":["コンデンサから見る","時定数","最後の電圧"]}},{"id":"t55s5e","scene":"t55s5e","kind":"u55s5dis","lab":{"c":"{C}","pp":"top","q":"{Q}","vc":"{v}_C","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall","tau":"τ"},"viewbox":"-164 128 1087 1069","band":{"want":"放電の時定数と、抵抗で消費されるエネルギー","ans":"単位を直して、$\\tau = RC$ と $W = \\dfrac{1}{2} C v_C^2$"},"narr":{"start":{"co":1,"swc":1,"tt":1,"taud":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"①単位を直す\n②時定数\n③エネルギー\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"キロとマイクロは、直してから〖両方の式〗に入れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Vc","R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"放電の時定数も、充電と同じ $\\tau = RC$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Tau","R","C"],"eq":[{"cont":false,"items":[["\\tau = RC"]]}],"emphPre":["Tau","R","C"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電荷が全部流れ出るまで、抵抗が電流を流し続けます。〖抵抗で消費されるエネルギーは、初めの静電エネルギーと同じ〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["強調","答え"],"route":3,"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C v_C^2"]]}],"emphPre":["C","Vc","R"],"ans":true}]}],"groups":{"C":["c","c:b","ct0","ct1"],"Q":["qp0","qp1","qm0","qm1"],"Vc":["vca","vca:h","vct0","vct1"],"SW":["swp0","swp1","sw","swo"],"R":["rr","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{},"route":["単位を直す","時定数","エネルギー"]}},{"id":"t55s5x","scene":"t55s5x","kind":"u55s5dis","lab":{"c":"{C}=50 μF","pp":"top","q":"{Q}","vc":"{v}_C=2 kV","sw":"","r":"{R}=4 kΩ","i":"{i}","y":"{i}","cv":"fall","tau":["τ","τ=0.2 s"]},"viewbox":"-164 128 1087 1069","band":{"want":"時定数 $\\tau$ と、抵抗で消費されるエネルギー $W$ の組","known":"$v_C = 2\\,\\mathrm{kV},\\;\\; C = 50\\,\\mu\\mathrm{F},\\;\\; R = 4\\,\\mathrm{k\\Omega}$","ans":"$0.2\\,\\mathrm{s}$、$100\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"swc":1,"tt":1,"taud":1,"tauv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、時定数 $\\tau$ と、抵抗で消費されるエネルギー $W$ の組です。","at":{"強調":1.0},"after":[],"emph":["Tau","R"]},{"text":"①単位を直す\n②時定数\n③エネルギー\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"キロ・マイクロを、もとの単位に直します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Vc","R","C"],"eq":[{"cont":false,"items":[["2\\,\\mathrm{kV} = 2000\\,\\mathrm{V}"],["4\\,\\mathrm{k\\Omega} = 4000\\,\\Omega"],["50\\,\\mu\\mathrm{F} = 50 \\times 10^{-6}\\,\\mathrm{F}"]]}],"emphPre":["Vc","R","C"]},{"text":"〖直した値を、次の2つの式の両方に入れます〗。","at":{"強調":1.0},"after":[],"emph":["Vc","R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"放電の時定数も $\\tau = RC$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["Tau","R","C"],"eq":[{"cont":false,"items":[["\\tau = RC"],["= 4000 \\times 50 \\times 10^{-6}"],["= 0.2\\,\\mathrm{s}"]]}],"move":"tau","emphPre":["Tau","R","C"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電荷が全部流れ出るまで、抵抗が電流を流し続けます。抵抗で消費されるエネルギーは、初めの静電エネルギーと同じです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["C","Vc","R"]},{"text":"静電エネルギーの式に、直した値を入れます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C v_C^2"],["= \\dfrac{1}{2} \\times 50 \\times 10^{-6} \\times 2000^2"],["= 100\\,\\mathrm{J}"]]}],"emphPre":["C","Vc"]},{"text":"組は、$0.2\\,\\mathrm{s}$ と $100\\,\\mathrm{J}$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Tau"]}]}],"groups":{"C":["c","c:b","ct0","ct1"],"Q":["qp0","qp1","qm0","qm1"],"Vc":["vca","vca:h","vct0","vct1"],"SW":["swp0","swp1","sw","swo"],"R":["rr","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{"tau":{"to":{"tauv":1},"dur":0.4}},"route":["単位を直す","時定数","エネルギー"]}},{"id":"t55s6e","scene":"t55s6e","kind":"u55s6g4","lab":{"ra":"{R}","ca":"{C}","rb1":"{R}","rb2":"{R}","cb":"{C}","rc":"{R}","cc1":"{C}","cc2":"{C}","rd1":"{R}","rd2":"{R}","cd1":"{C}","cd2":"{C}"},"viewbox":"0 0 1260 1149","band":{"want":"時定数が最も大きい回路","ans":"R と C をそれぞれ合成してから、$\\tau = RC$ で比べる"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"①R を合成\n②C を合成\n③比べる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"抵抗は、並列で小さく、直列で大きくなります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Rall"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"コンデンサは〖逆〗で、並列で大きく、直列で小さくなります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Call"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"〖合成した $R$ と $C$ を、時定数の式に入れて〗比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["強調","答え"],"route":3,"emph":["Rall","Call"],"eq":[{"cont":false,"items":[["\\tau = RC"]]}],"emphPre":["Rall","Call"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21","cx3:L","cx3:S","ppx3","pmx3","ex30","ex31"],"Ra":["ra","rat0","rat1"],"CA":["ca","cat0","cat1","ca:b","ca:l1","ca:l2"],"zhi":["u55s6g4L","u55s6g4w1","u55s6g4x1L","u55s6g4x1w1","u55s6g4x1w3","u55s6g4x1w5","u55s6g4x1w7","u55s6g4x2L","u55s6g4x2w1","u55s6g4x3L","u55s6g4x3w1"],"zlo":["u55s6g4Rw","u55s6g4w3","u55s6g4x1Rw","u55s6g4x1w9","u55s6g4x2Rw","u55s6g4x2w3","u55s6g4x2w5","u55s6g4x2w7","u55s6g4x2w9","u55s6g4x3Rw","u55s6g4x3w5"],"zmid":["u55s6g4w2","u55s6g4x1w2","u55s6g4x1w4","u55s6g4x1w6","u55s6g4x1w8","u55s6g4x2w2","u55s6g4x2w4","u55s6g4x2w6","u55s6g4x2w8","u55s6g4x3w2"],"Rb1":["rb1x1","rb1x1t0","rb1x1t1"],"Rb2":["rb2x1","rb2x1t0","rb2x1t1"],"CB":["cbx1","cbx1t0","cbx1t1","cbx1:b","cbx1:l1","cbx1:l2"],"Rc":["rcx2","rcx2t0","rcx2t1"],"CC1":["cc1x2","cc1x2t0","cc1x2t1","cc1x2:b","cc1x2:l1","cc1x2:l2"],"CC2":["cc2x2","cc2x2t0","cc2x2t1","cc2x2:b","cc2x2:l1","cc2x2:l2"],"Rd1":["rd1x3","rd1x3t0","rd1x3t1"],"Rd2":["rd2x3","rd2x3t0","rd2x3t1"],"CD1":["cd1x3","cd1x3t0","cd1x3t1","cd1x3:b","cd1x3:l1","cd1x3:l2"],"CD2":["cd2x3","cd2x3t0","cd2x3t1","cd2x3:b","cd2x3:l1","cd2x3:l2"],"zmid2":["u55s6g4x3w3"],"zmid3":["u55s6g4x3w4"],"Rall":["ra","rat0","rat1","rb1x1","rb1x1t0","rb1x1t1","rb2x1","rb2x1t0","rb2x1t1","rcx2","rcx2t0","rcx2t1","rd1x3","rd1x3t0","rd1x3t1","rd2x3","rd2x3t0","rd2x3t1"],"Call":["ca","cat0","cat1","ca:b","ca:l1","ca:l2","cbx1","cbx1t0","cbx1t1","cbx1:b","cbx1:l1","cbx1:l2","cc1x2","cc1x2t0","cc1x2t1","cc1x2:b","cc1x2:l1","cc1x2:l2","cc2x2","cc2x2t0","cc2x2t1","cc2x2:b","cc2x2:l1","cc2x2:l2","cd1x3","cd1x3t0","cd1x3t1","cd1x3:b","cd1x3:l1","cd1x3:l2","cd2x3","cd2x3t0","cd2x3t1","cd2x3:b","cd2x3:l1","cd2x3:l2"]},"moves":{},"route":["R を合成","C を合成","比べる"]}},{"id":"t55s6x","scene":"t55s6x","kind":"u55s6g4","lab":{"ra":"{R}","ca":"{C}","rb1":"{R}","rb2":"{R}","cb":"{C}","rc":"{R}","cc1":"{C}","cc2":"{C}","rd1":"{R}","rd2":"{R}","cd1":"{C}","cd2":"{C}"},"viewbox":"0 0 1260 1149","band":{"want":"時定数が最も大きい回路","known":"抵抗はどれも $R$、コンデンサはどれも $C$","ans":"(ウ)"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、時定数が最も大きい回路です。抵抗はどれも $R$、コンデンサはどれも $C$ です。","at":{"強調":1.0},"after":[],"emph":["Rall","Call"]},{"text":"①R を合成\n②C を合成\n③時定数\n④比べる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"(イ) の抵抗は並列で半分、(エ) の抵抗は直列で2倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Rall"],"eq":[{"cont":false,"items":[["\\dfrac{R}{2}"],["2R"]]}],"emphPre":["Rall"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"(ウ) のコンデンサは並列で2倍、(エ) のコンデンサは直列で半分です。抵抗と逆です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Call"],"eq":[{"cont":false,"items":[["2C"],["\\dfrac{C}{2}"]]}],"emphPre":["Call"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"〖合成した $R$ と $C$ を、$\\tau = RC$ に入れます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Rall","Call"],"eq":[{"cont":false,"items":[["\\text{(ア)}\\;\\; RC"],["\\text{(イ)}\\;\\; \\dfrac{R}{2} \\times C = \\dfrac{RC}{2}"],["\\text{(ウ)}\\;\\; R \\times 2C = 2RC"],["\\text{(エ)}\\;\\; 2R \\times \\dfrac{C}{2} = RC"]]}],"emphPre":["Rall","Call"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"最も大きいのは、$2RC$ の (ウ) です。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":4,"emph":["Rall","Call"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21","cx3:L","cx3:S","ppx3","pmx3","ex30","ex31"],"Ra":["ra","rat0","rat1"],"CA":["ca","cat0","cat1","ca:b","ca:l1","ca:l2"],"zhi":["u55s6g4L","u55s6g4w1","u55s6g4x1L","u55s6g4x1w1","u55s6g4x1w3","u55s6g4x1w5","u55s6g4x1w7","u55s6g4x2L","u55s6g4x2w1","u55s6g4x3L","u55s6g4x3w1"],"zlo":["u55s6g4Rw","u55s6g4w3","u55s6g4x1Rw","u55s6g4x1w9","u55s6g4x2Rw","u55s6g4x2w3","u55s6g4x2w5","u55s6g4x2w7","u55s6g4x2w9","u55s6g4x3Rw","u55s6g4x3w5"],"zmid":["u55s6g4w2","u55s6g4x1w2","u55s6g4x1w4","u55s6g4x1w6","u55s6g4x1w8","u55s6g4x2w2","u55s6g4x2w4","u55s6g4x2w6","u55s6g4x2w8","u55s6g4x3w2"],"Rb1":["rb1x1","rb1x1t0","rb1x1t1"],"Rb2":["rb2x1","rb2x1t0","rb2x1t1"],"CB":["cbx1","cbx1t0","cbx1t1","cbx1:b","cbx1:l1","cbx1:l2"],"Rc":["rcx2","rcx2t0","rcx2t1"],"CC1":["cc1x2","cc1x2t0","cc1x2t1","cc1x2:b","cc1x2:l1","cc1x2:l2"],"CC2":["cc2x2","cc2x2t0","cc2x2t1","cc2x2:b","cc2x2:l1","cc2x2:l2"],"Rd1":["rd1x3","rd1x3t0","rd1x3t1"],"Rd2":["rd2x3","rd2x3t0","rd2x3t1"],"CD1":["cd1x3","cd1x3t0","cd1x3t1","cd1x3:b","cd1x3:l1","cd1x3:l2"],"CD2":["cd2x3","cd2x3t0","cd2x3t1","cd2x3:b","cd2x3:l1","cd2x3:l2"],"zmid2":["u55s6g4x3w3"],"zmid3":["u55s6g4x3w4"],"Rall":["ra","rat0","rat1","rb1x1","rb1x1t0","rb1x1t1","rb2x1","rb2x1t0","rb2x1t1","rcx2","rcx2t0","rcx2t1","rd1x3","rd1x3t0","rd1x3t1","rd2x3","rd2x3t0","rd2x3t1"],"Call":["ca","cat0","cat1","ca:b","ca:l1","ca:l2","cbx1","cbx1t0","cbx1t1","cbx1:b","cbx1:l1","cbx1:l2","cc1x2","cc1x2t0","cc1x2t1","cc1x2:b","cc1x2:l1","cc1x2:l2","cc2x2","cc2x2t0","cc2x2t1","cc2x2:b","cc2x2:l1","cc2x2:l2","cd1x3","cd1x3t0","cd1x3t1","cd1x3:b","cd1x3:l1","cd1x3:l2","cd2x3","cd2x3t0","cd2x3t1","cd2x3:b","cd2x3:l1","cd2x3:l2"]},"moves":{},"route":["R を合成","C を合成","時定数","比べる"]}}],"secs":[{"ex":{"text":"図のように、$36\\,\\mathrm{V}$ の電源に、$R_1 = 6\\,\\Omega$ と、「コンデンサと $R_2 = 12\\,\\Omega$ の直列」と $R_3 = 12\\,\\Omega$ の並列をつなぎます。コンデンサは充電されていません。スイッチを入れた瞬間の電流 $I_0$ と、十分に時間がたった後の電流 $I$ の比 $\\dfrac{I_0}{I}$ はいくらですか。","fig":{"kind":"u55s1q","L":{"sw":"","r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=12 Ω","c":"{C}","src":"{E}=36 V"},"P":{}},"ch":[{"t":"$3$","v":3,"why":"瞬間の電流 $3\\,\\mathrm{A}$ で止めた（定常の電流で割っていない）"},{"t":"$1.0$","v":1.0,"why":"瞬間も定常も同じ読みにした（コンデンサの振る舞いを使っていない）"},{"t":"$1.5$","v":1.5,"why":""},{"t":"$0.67$","v":0.67,"why":"比を逆にした（$\\dfrac{I}{I_0}$ を出した）"}],"ans":2}},{"ex":{"text":"図のように、電源に $R_1 = 3\\,\\Omega$ と、$R_2 = 15\\,\\Omega$ と「コンデンサと $R_3$ の直列」の並列をつなぎます。スイッチを入れた瞬間の電流 $I_0$ と、十分に時間がたった後の電流 $I$ の比を $\\dfrac{I_0}{I} = 2$ にします。$R_3$ は何 Ω ですか。","fig":{"kind":"u55s2q","L":{"sw":"","r1":"{R}_1=3 Ω","r2":"{R}_2=15 Ω","r3":"{R}_3","c":"{C}","src":"{E}"},"P":{}},"ch":[{"t":"$6\\,\\Omega$","v":6,"why":"並列の部分の合成抵抗で止めた（$R_3$ を解いていない）"},{"t":"$9\\,\\Omega$","v":9,"why":"瞬間の全体の合成抵抗で止めた"},{"t":"$10\\,\\Omega$","v":10,"why":""},{"t":"$15\\,\\Omega$","v":15,"why":"$R_3 = R_2$ とした"}],"ans":2}},{"ex":{"text":"図のように、$12\\,\\mathrm{V}$ の電源に $R_1 = 2\\,\\Omega$ と $10\\,\\mathrm{mH}$ のコイルを直列につなぎ、その先に $R_2 = 4\\,\\Omega$ と $500\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。定常状態で、コイルとコンデンサに蓄えられるエネルギーの和は何 J ですか。","fig":{"kind":"u55s3q","L":{"r1":"{R}_1=2 Ω","r2":"{R}_2=4 Ω","l":"{L}=10 mH","c":"{C}=500 μF","src":"{E}=12 V"},"P":{}},"ch":[{"t":"$0.02\\,\\mathrm{J}$","v":0.02,"why":"コイルのエネルギーだけ（コンデンサの分を足していない）"},{"t":"$0.016\\,\\mathrm{J}$","v":0.016,"why":"コンデンサのエネルギーだけ（コイルの分を足していない）"},{"t":"$0.056\\,\\mathrm{J}$","v":0.056,"why":"コンデンサの電圧を、分圧せず電源の $12\\,\\mathrm{V}$ にした"},{"t":"$0.036\\,\\mathrm{J}$","v":0.036,"why":""}],"ans":3}},{"ex":{"text":"図のように、$12\\,\\mathrm{V}$ の電源に $R_1 = 6\\,\\Omega$ とスイッチを直列につなぎ、その先に $R_2 = 3\\,\\Omega$ と $500\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。スイッチを入れた後の時定数と、コンデンサの最後の電圧の組はどれですか。","fig":{"kind":"u55s4q","L":{"src":"{E}=12 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","c":"{C}=500 μF","vc":"{v}_C","sw":""},"P":{}},"ch":[{"t":"$1\\,\\mathrm{ms}$、$12\\,\\mathrm{V}$","v":"1,12","why":"最後の電圧を分圧していない（$R_2$ の電圧でなく電源の電圧にした）"},{"t":"$3\\,\\mathrm{ms}$、$12\\,\\mathrm{V}$","v":"3,12","why":"コンデンサから見た合成抵抗を使わず、$R_1$ と電源の電圧で出した"},{"t":"$1\\,\\mathrm{ms}$、$4\\,\\mathrm{V}$","v":"1,4","why":""},{"t":"$4.5\\,\\mathrm{ms}$、$4\\,\\mathrm{V}$","v":"4.5,4","why":"$R_1$ と $R_2$ を直列にした（電源を導線にすると並列）"}],"ans":2}},{"ex":{"text":"$2\\,\\mathrm{kV}$ に充電した $50\\,\\mu\\mathrm{F}$ のコンデンサを、$4\\,\\mathrm{k\\Omega}$ の抵抗につないで放電させます。時定数と、十分に時間がたつまでに抵抗で消費されるエネルギーの組はどれですか。","fig":{"kind":"u55s5dis","L":{"c":"{C}=50 μF","pp":"top","q":"{Q}","vc":"{v}_C=2 kV","sw":"","r":"{R}=4 kΩ","i":"{i}","y":"{i}","cv":"fall","tau":"τ"},"P":{}},"ch":[{"t":"$0.2\\,\\mathrm{s}$、$1 \\times 10^{-4}\\,\\mathrm{J}$","v":"w_k","why":"エネルギーの式で、kV を V に直していない"},{"t":"$2 \\times 10^{-4}\\,\\mathrm{s}$、$100\\,\\mathrm{J}$","v":"t_k","why":"時定数の式で、kΩ を Ω に直していない"},{"t":"$0.2\\,\\mathrm{s}$、$100\\,\\mathrm{J}$","v":"ok","why":""},{"t":"$0.2\\,\\mathrm{s}$、$200\\,\\mathrm{J}$","v":"w_2","why":"静電エネルギーの式の $\\dfrac{1}{2}$ を落とした"}],"ans":2}},{"ex":{"text":"図の (ア)〜(エ) の回路の抵抗はどれも $R$、コンデンサはどれも $C$ です。充電する時の時定数が最も大きいものはどれですか。","fig":{"kind":"u55s6g4","L":{"ra":"{R}","ca":"{C}","rb1":"{R}","rb2":"{R}","cb":"{C}","rc":"{R}","cc1":"{C}","cc2":"{C}","rd1":"{R}","rd2":"{R}","cd1":"{C}","cd2":"{C}"},"P":{}},"ch":[{"t":"(ア)","v":"a","why":"合成せず、抵抗とコンデンサを1つずつで比べた（(ア) は $RC$）"},{"t":"(イ)","v":"b","why":"抵抗の並列を直列の式で合成した（並列は $\\dfrac{R}{2}$ で、(イ) は $\\dfrac{RC}{2}$）"},{"t":"(ウ)","v":"c","why":""},{"t":"(エ)","v":"d","why":"コンデンサを合成せず、抵抗だけ合成した（直列のコンデンサは $\\dfrac{C}{2}$ で、(エ) は $RC$）"}],"ans":2}}],"past":[]}};
});
