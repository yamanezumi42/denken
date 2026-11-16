/* 単元54「過渡現象のつなぎ（2つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(54, function(H){
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
// ---- 54-1 瞬間のコンデンサと直並列 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S1K = {
  cr: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s1crL","pts":[[478,360],[523,360]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw2","pts":[[628,280],[628,440]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw3","pts":[[1038,280],[1038,440]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw4","pts":[[628,280],[699.67,280]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw5","pts":[[759.67,280],[886.33,280]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw6","pts":[[946.33,280],[1038,280]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw7","pts":[[628,440],[803,440]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw8","pts":[[863,440],[1038,440]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw9","pts":[[583,360],[628,360]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw10","pts":[[1038,360],[1048,360]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw11","pts":[[478,560],[590.5,560]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw12","pts":[[590.5,560],[724,560]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw13","pts":[[792,560],[918.5,560]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw14","pts":[[942.5,560],[1048,560]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw15","pts":[[478,360],[478,460]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw16","pts":[[478,460],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw17","pts":[[1048,360],[1048,460]],"vis":[],"dash":0},{"t":"w","id":"u54s1crw18","pts":[[1048,460],[1048,560]],"vis":[],"dash":0},{"t":"r","k":"r1","x":553,"y":360,"dir":"h","vis":[],"lab":[545,329.4,null]},{"t":"cap","k":"c","x":729.67,"y":280,"dir":"h","vis":[],"lab":[729.67,243.4,null],"fh":1,"f":"cap","F":28.6},{"t":"r","k":"r2","x":916.33,"y":280,"dir":"h","vis":[],"lab":[916.33,310.6,null]},{"t":"r","k":"r3","x":833,"y":440,"dir":"h","vis":[],"lab":[833,409.4,null]},{"t":"d","id":"u54s1crj112","x":628,"y":360,"vis":[]},{"t":"d","id":"u54s1crj213","x":1038,"y":360,"vis":[]},{"t":"s","k":"sw","dir":"h","x0":724,"y0":560,"x1":792,"y1":560,"v":1,"vis":[]},{"t":"e","k":"src","dir":"h","xp":918.5,"yp":560,"xm":942.5,"ym":560,"vis":[],"side":1,"lab":[930.5,604.88,null]},{"t":"d","id":"u54s1crj7","x":628,"y":360,"vis":[]},{"t":"d","id":"u54s1crj20","x":1038,"y":360,"vis":[]},{"t":"i","k":"i2","x0":838.83,"y0":263,"x1":878.83,"y1":263,"lab":[858.83,233.3,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i","x0":610.5,"y0":577,"x1":570.5,"y1":577,"lab":[590.5,606.7,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n5",1,[]],["R","c","n5","n6",1,[]],["R","r2","n6","n2",1,[]],["R","r3","n5","n2",1,[]],["C","sw","n1","n7",0,[1]],["E","src","n7","n2",1,[]]]}
};
function tbU54s1cr(d, p, L){ tbFig_Draw(d, p, L, U54S1K.cr); }
// ---- 54-2 瞬間のコイルと合成 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S2K = {
  lr: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s2lrL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw1","pts":[[478,360],[510.75,360]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw2","pts":[[578.75,360],[646.5,360]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw3","pts":[[753.25,280],[753.25,440]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw4","pts":[[1033.25,280],[1033.25,440]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw5","pts":[[753.25,280],[863.25,280]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw6","pts":[[923.25,280],[1033.25,280]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw7","pts":[[753.25,440],[863.25,440]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw8","pts":[[923.25,440],[1033.25,440]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw9","pts":[[706.5,360],[753.25,360]],"vis":[],"dash":0},{"t":"w","id":"u54s2lrw10","pts":[[1033.25,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"s","k":"sw","dir":"h","x0":510.75,"y0":360,"x1":578.75,"y1":360,"v":1,"vis":[]},{"t":"r","k":"r1","x":676.5,"y":360,"dir":"h","vis":[],"lab":[660.5,325.6,null]},{"t":"r","k":"r2","x":893.25,"y":280,"dir":"h","vis":[],"lab":[893.25,245.6,null]},{"t":"v","k":"v2","x":893.25,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[893.25,171.71,null]},{"t":"ind","k":"l","x":893.25,"y":440,"dir":"h","vis":[],"lab":[893.25,405.6,null],"f":"ind","cd":1},{"t":"d","id":"u54s2lrj116","x":753.25,"y":360,"vis":[]},{"t":"d","id":"u54s2lrj217","x":1033.25,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[510.75,360]]},{"I":1,"pts":[[578.75,360],[753.25,360]]},{"I":0,"pts":[[753.25,360],[753.25,280],[1033.25,280],[1033.25,360]]},{"I":1,"pts":[[753.25,360],[753.25,440],[1033.25,440],[1033.25,360]]},{"I":1,"pts":[[1033.25,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["C","sw","P","n1",0,[1]],["R","r1","n1","n2",1,[]],["R","r2","n2","N",1,[]],["R","l","n2","N",0,[]]]}
};
function tbU54s2lr(d, p, L){ tbFig_Draw(d, p, L, U54S2K.lr); }
// ---- 54-3 定常のコイル・コンデンサと並列 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S3K = {
  p3: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s3p3L","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w1","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w2","pts":[[646,240],[646,480]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w3","pts":[[1016,240],[1016,480]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w4","pts":[[646,240],[717.67,240]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w5","pts":[[777.67,240],[884.33,240]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w6","pts":[[944.33,240],[1016,240]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w7","pts":[[646,360],[717.67,360]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w8","pts":[[777.67,360],[884.33,360]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w9","pts":[[944.33,360],[1016,360]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w10","pts":[[646,480],[801,480]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w11","pts":[[861,480],[1016,480]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w12","pts":[[596,360],[646,360]],"vis":[],"dash":0},{"t":"w","id":"u54s3p3w13","pts":[[1016,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null]},{"t":"s","k":"sw","dir":"h","x0":528,"y0":360,"x1":596,"y1":360,"v":1,"vis":[]},{"t":"cap","k":"c","x":747.67,"y":240,"dir":"h","vis":[],"lab":[747.67,199.37,null],"fh":1,"f":"cap","F":35.6},{"t":"r","k":"r1","x":914.33,"y":240,"dir":"h","vis":[],"lab":[914.33,205.37,null]},{"t":"ind","k":"l","x":747.67,"y":360,"dir":"h","vis":[],"lab":[747.67,325.37,null],"f":"ind","cd":1},{"t":"r","k":"r2","x":914.33,"y":360,"dir":"h","vis":[],"lab":[914.33,325.37,null]},{"t":"r","k":"r3","x":831,"y":480,"dir":"h","vis":[],"lab":[831,445.37,null]},{"t":"d","id":"u54s3p3j120","x":646,"y":360,"vis":[]},{"t":"d","id":"u54s3p3j221","x":1016,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["C","sw","P","n1",0,[1]],["R","c","n1","n2",1,[]],["R","r1","n2","N",1,[]],["R","l","n1","n3",0,[]],["R","r2","n3","N",1,[]],["R","r3","n1","N",1,[]]]}
};
function tbU54s3p3(d, p, L){ tbFig_Draw(d, p, L, U54S3K.p3); }
// ---- 54-4 定常の電流から磁気エネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S4K = {
  rl: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s4rlL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s4rlRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s4rlw1","pts":[[478,360],[548.25,360]],"vis":[],"dash":0},{"t":"w","id":"u54s4rlw2","pts":[[616.25,360],[721.5,360]],"vis":[],"dash":0},{"t":"w","id":"u54s4rlw3","pts":[[781.5,360],[900.75,360]],"vis":[],"dash":0},{"t":"w","id":"u54s4rlw4","pts":[[960.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"s","k":"sw","dir":"h","x0":548.25,"y0":360,"x1":616.25,"y1":360,"v":1,"vis":[]},{"t":"r","k":"r","x":751.5,"y":360,"dir":"h","vis":[],"lab":[751.5,325.6,null]},{"t":"ind","k":"l","x":930.75,"y":360,"dir":"h","vis":[],"lab":[930.75,325.6,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[548.25,360]]},{"I":1,"pts":[[616.25,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["C","sw","P","n1",0,[1]],["R","r","n1","n2",1,[]],["R","l","n2","N",0,[]]]}
};
function tbU54s4rl(d, p, L){ tbFig_Draw(d, p, L, U54S4K.rl); }
// ---- 54-5 定常の電圧から静電エネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S5K = {
  rc: {"vars":[],"items":[{"t":"w","id":"u54s5rcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u54s5rcw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.6,null]},{"t":"cap","k":"c","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,480.4,null],"fh":1,"f":"cap","F":35.2},{"t":"v","k":"vc","x":851.5,"y":440,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c","lab":[851.5,331.71,null]},{"t":"d","id":"u54s5rcj114","x":708,"y":360,"vis":[]},{"t":"d","id":"u54s5rcj215","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[],"base":110,"von":["src","vc"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","c","n1","N",1,[]]]}
};
function tbU54s5rc(d, p, L){ tbFig_Draw(d, p, L, U54S5K.rc); }
// ---- 54-6 放電で抵抗が使うエネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S6K = {
  dis: {"vars":[],"items":[{"f":"ln","id":"w1","pts":[[260,410],[260,220],[414,220]],"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[486,220],[640,220],[640,388]],"vis":[],"t":"F"},{"f":"ln","id":"w3","pts":[[640,452],[640,620],[260,620],[260,430]],"vis":[],"t":"F"},{"f":"ln","id":"c","pts":[[230,410],[290,410]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c:b","pts":[[230,430],[290,430]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"ct","k":"c","bases":[[210,420,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":120,"y":420,"anc":"end"},{"f":"lb","id":"qp","k":"q","bases":[[300,376,"start",[1,-1]]],"vbases":{"top":[[300,376,"start",[1,-1]]],"bot":[[300,464,"start",[1,1]]]},"need":"q","sel":"pp","var":{"top":{"x":300,"y":376,"anc":"start"},"bot":{"x":300,"y":464,"anc":"start"}},"dflt":"top","vis":[],"t":"F","pre":"+","x":300,"y":376,"anc":"start"},{"f":"lb","id":"qm","k":"q","bases":[[300,464,"start",[1,1]]],"vbases":{"top":[[300,464,"start",[1,1]]],"bot":[[300,376,"start",[1,-1]]]},"need":"q","sel":"pp","var":{"top":{"x":300,"y":464,"anc":"start"},"bot":{"x":300,"y":376,"anc":"start"}},"dflt":"top","vis":[],"t":"F","pre":"-","x":300,"y":464,"anc":"start"},{"f":"ar","id":"vca","x0":140,"y0":600,"x1":140,"y1":240,"w":3,"need":"vc","sel":"pp","var":{"top":{"x0":140,"y0":600,"x1":140,"y1":240},"bot":{"x0":140,"y0":240,"x1":140,"y1":600}},"dflt":"top","vis":[],"t":"F"},{"f":"lb","id":"vct","k":"vc","bases":[[124,480,"end",[-1,0]]],"need":"vc","vis":[],"t":"F","x":124,"y":480,"anc":"end"},{"f":"c","id":"swp0","cx":414,"cy":220,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":486,"cy":220,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"sw","pts":[[414,220],[480,220]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[414,220],[476.35,184]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"rr","pts":[[628,388],[652,388],[652,452],[628,452]],"w":3,"close":1,"vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[670,420,"start",[1,0]]],"need":"r","vis":[],"t":"F","x":670,"y":420,"anc":"start"},{"f":"ar","id":"ia","x0":526,"y0":220,"x1":596,"y1":220,"w":4,"need":"i","sel":"pp","var":{"top":{"x0":526,"y0":220,"x1":596,"y1":220},"bot":{"x0":596,"y0":220,"x1":526,"y1":220}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[561,188,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":561,"y":176,"anc":"middle"},{"f":"ar","id":"axx1","x0":82,"y0":996,"x1":592,"y1":996,"vis":[],"t":"F"},{"f":"ar","id":"ayx1","x0":82,"y0":996,"x1":82,"y1":736,"vis":[],"t":"F"},{"f":"tx","id":"ox1","x":68,"y":1022,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"tx","id":"atx1","x":604,"y":996,"s":"{t}","anc":"start","vis":[],"t":"F"},{"f":"lb","id":"ytx1","k":"y","bases":[[66,746,"end",[-1,-1]],[98,736,"start",[1,-1]]],"need":"y","vis":[],"t":"F","x":98,"y":736,"anc":"start","n":"yx1"},{"f":"ln","id":"cvx1","pts":[[82,996],[93.5,971.48],[105,950.38],[116.5,932.22],[128,916.59],[139.5,903.14],[151,891.56],[162.5,881.59],[174,873.01],[185.5,865.63],[197,859.27],[208.5,853.8],[220,849.09],[231.5,845.04],[243,841.55],[254.5,838.55],[266,835.97],[277.5,833.74],[289,831.83],[300.5,830.18],[312,828.76],[323.5,827.54],[335,826.49],[346.5,825.59],[358,824.81],[369.5,824.14],[381,823.56],[392.5,823.07],[404,822.64],[415.5,822.27],[427,821.96],[438.5,821.68],[450,821.45],[461.5,821.25],[473,821.07],[484.5,820.92],[496,820.79],[507.5,820.68],[519,820.59],[530.5,820.51],[542,820.44]],"w":5,"need":"cv","sel":"cv","var":{"rise":{"pts":[[82,996],[93.5,971.48],[105,950.38],[116.5,932.22],[128,916.59],[139.5,903.14],[151,891.56],[162.5,881.59],[174,873.01],[185.5,865.63],[197,859.27],[208.5,853.8],[220,849.09],[231.5,845.04],[243,841.55],[254.5,838.55],[266,835.97],[277.5,833.74],[289,831.83],[300.5,830.18],[312,828.76],[323.5,827.54],[335,826.49],[346.5,825.59],[358,824.81],[369.5,824.14],[381,823.56],[392.5,823.07],[404,822.64],[415.5,822.27],[427,821.96],[438.5,821.68],[450,821.45],[461.5,821.25],[473,821.07],[484.5,820.92],[496,820.79],[507.5,820.68],[519,820.59],[530.5,820.51],[542,820.44]]},"fall":{"pts":[[82,820],[93.5,844.52],[105,865.62],[116.5,883.78],[128,899.41],[139.5,912.86],[151,924.44],[162.5,934.41],[174,942.99],[185.5,950.37],[197,956.73],[208.5,962.2],[220,966.91],[231.5,970.96],[243,974.45],[254.5,977.45],[266,980.03],[277.5,982.26],[289,984.17],[300.5,985.82],[312,987.24],[323.5,988.46],[335,989.51],[346.5,990.41],[358,991.19],[369.5,991.86],[381,992.44],[392.5,992.93],[404,993.36],[415.5,993.73],[427,994.04],[438.5,994.32],[450,994.55],[461.5,994.75],[473,994.93],[484.5,995.08],[496,995.21],[507.5,995.32],[519,995.41],[530.5,995.49],[542,995.56]]},"jump":{"pts":[[82,996],[82,820],[542,820]]},"zero":{"pts":[[82,996],[542,996]]},"rise2":{"pts":[[82,996],[93.5,983.28],[105,971.48],[116.5,960.54],[128,950.38],[139.5,940.96],[151,932.22],[162.5,924.11],[174,916.59],[185.5,909.61],[197,903.14],[208.5,897.13],[220,891.56],[231.5,886.39],[243,881.59],[254.5,877.14],[266,873.01],[277.5,869.18],[289,865.63],[300.5,862.33],[312,859.27],[323.5,856.43],[335,853.8],[346.5,851.36],[358,849.09],[369.5,846.99],[381,845.04],[392.5,843.23],[404,841.55],[415.5,840],[427,838.55],[438.5,837.21],[450,835.97],[461.5,834.81],[473,833.74],[484.5,832.75],[496,831.83],[507.5,830.97],[519,830.18],[530.5,829.44],[542,828.76]]},"fall2":{"pts":[[82,820],[93.5,832.72],[105,844.52],[116.5,855.46],[128,865.62],[139.5,875.04],[151,883.78],[162.5,891.89],[174,899.41],[185.5,906.39],[197,912.86],[208.5,918.87],[220,924.44],[231.5,929.61],[243,934.41],[254.5,938.86],[266,942.99],[277.5,946.82],[289,950.37],[300.5,953.67],[312,956.73],[323.5,959.57],[335,962.2],[346.5,964.64],[358,966.91],[369.5,969.01],[381,970.96],[392.5,972.77],[404,974.45],[415.5,976],[427,977.45],[438.5,978.79],[450,980.03],[461.5,981.19],[473,982.26],[484.5,983.25],[496,984.17],[507.5,985.03],[519,985.82],[530.5,986.56],[542,987.24]]}},"dflt":"rise","vis":[],"t":"F","tt":"tt"},{"f":"ln","id":"flx1","pts":[[82,820],[542,820]],"dash":1,"w":2,"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"pts":[[82,820],[542,820]]},"fall":{"pts":[[82,996],[542,996]]},"jump":{"pts":[[82,820],[542,820]]},"zero":{"pts":[[82,996],[542,996]]},"rise2":{"pts":[[82,820],[542,820]]},"fall2":{"pts":[[82,996],[542,996]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"fintx1","k":"fin","bases":[[556,820,"start",[1,0]]],"vbases":{"rise":[[556,820,"start",[1,0]]],"fall":[[556,962,"start",[1,0]]],"jump":[[556,820,"start",[1,0]]],"zero":[[556,962,"start",[1,0]]],"rise2":[[556,820,"start",[1,0]]],"fall2":[[556,962,"start",[1,0]]]},"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"x":556,"y":820,"anc":"start"},"fall":{"x":556,"y":962,"anc":"start"},"jump":{"x":556,"y":820,"anc":"start"},"zero":{"x":556,"y":962,"anc":"start"},"rise2":{"x":556,"y":820,"anc":"start"},"fall2":{"x":556,"y":962,"anc":"start"}},"dflt":"rise","vis":[],"t":"F","x":556,"y":820,"anc":"start","n":"finx1"},{"f":"lb","id":"sttx1","k":"st","bases":[[68,820,"end",[-1,0]],[98,790,"start",[1,-1]]],"need":"st","vis":[],"t":"F","x":68,"y":820,"anc":"end","n":"stx1"},{"f":"ln","id":"cw2x1","pts":[[82,996],[82,820],[542,820]],"dash":1,"w":3,"o":["tt2"],"need":"cv2","sel":"cv2","var":{"rise":{"pts":[[82,996],[93.5,971.48],[105,950.38],[116.5,932.22],[128,916.59],[139.5,903.14],[151,891.56],[162.5,881.59],[174,873.01],[185.5,865.63],[197,859.27],[208.5,853.8],[220,849.09],[231.5,845.04],[243,841.55],[254.5,838.55],[266,835.97],[277.5,833.74],[289,831.83],[300.5,830.18],[312,828.76],[323.5,827.54],[335,826.49],[346.5,825.59],[358,824.81],[369.5,824.14],[381,823.56],[392.5,823.07],[404,822.64],[415.5,822.27],[427,821.96],[438.5,821.68],[450,821.45],[461.5,821.25],[473,821.07],[484.5,820.92],[496,820.79],[507.5,820.68],[519,820.59],[530.5,820.51],[542,820.44]]},"fall":{"pts":[[82,820],[93.5,844.52],[105,865.62],[116.5,883.78],[128,899.41],[139.5,912.86],[151,924.44],[162.5,934.41],[174,942.99],[185.5,950.37],[197,956.73],[208.5,962.2],[220,966.91],[231.5,970.96],[243,974.45],[254.5,977.45],[266,980.03],[277.5,982.26],[289,984.17],[300.5,985.82],[312,987.24],[323.5,988.46],[335,989.51],[346.5,990.41],[358,991.19],[369.5,991.86],[381,992.44],[392.5,992.93],[404,993.36],[415.5,993.73],[427,994.04],[438.5,994.32],[450,994.55],[461.5,994.75],[473,994.93],[484.5,995.08],[496,995.21],[507.5,995.32],[519,995.41],[530.5,995.49],[542,995.56]]},"jump":{"pts":[[82,996],[82,820],[542,820]]},"zero":{"pts":[[82,996],[542,996]]},"rise2":{"pts":[[82,996],[93.5,983.28],[105,971.48],[116.5,960.54],[128,950.38],[139.5,940.96],[151,932.22],[162.5,924.11],[174,916.59],[185.5,909.61],[197,903.14],[208.5,897.13],[220,891.56],[231.5,886.39],[243,881.59],[254.5,877.14],[266,873.01],[277.5,869.18],[289,865.63],[300.5,862.33],[312,859.27],[323.5,856.43],[335,853.8],[346.5,851.36],[358,849.09],[369.5,846.99],[381,845.04],[392.5,843.23],[404,841.55],[415.5,840],[427,838.55],[438.5,837.21],[450,835.97],[461.5,834.81],[473,833.74],[484.5,832.75],[496,831.83],[507.5,830.97],[519,830.18],[530.5,829.44],[542,828.76]]},"fall2":{"pts":[[82,820],[93.5,832.72],[105,844.52],[116.5,855.46],[128,865.62],[139.5,875.04],[151,883.78],[162.5,891.89],[174,899.41],[185.5,906.39],[197,912.86],[208.5,918.87],[220,924.44],[231.5,929.61],[243,934.41],[254.5,938.86],[266,942.99],[277.5,946.82],[289,950.37],[300.5,953.67],[312,956.73],[323.5,959.57],[335,962.2],[346.5,964.64],[358,966.91],[369.5,969.01],[381,970.96],[392.5,972.77],[404,974.45],[415.5,976],[427,977.45],[438.5,978.79],[450,980.03],[461.5,981.19],[473,982.26],[484.5,983.25],[496,984.17],[507.5,985.03],[519,985.82],[530.5,986.56],[542,987.24]]}},"dflt":"jump","vis":[],"t":"F"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[358,786,"middle",[0,-1]],[404,908,"middle",[0,1]]],"o":["tt2"],"need":"c2","vis":[],"t":"F","x":358,"y":786,"anc":"middle","n":"c2x1"},{"f":"ln","id":"tl0x1","pts":[[158.67,996],[158.67,884.77]],"dash":1,"w":2,"o":["taud"],"need":"tau","vis":[],"t":"F"},{"f":"lb","id":"tautx1","k":"tau","bases":[[158.67,1026,"middle",[0,1]]],"o":["taud"],"need":"tau","vis":[],"t":"F","x":158.67,"y":1026,"anc":"middle","n":"taux1"},{"f":"ln","id":"plx1","pts":[[82,884.77],[158.67,884.77]],"dash":1,"w":2,"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"pts":[[82,884.77],[158.67,884.77]]},"fall":{"pts":[[82,931.23],[158.67,931.23]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"pcttx1","k":"pct","bases":[[68,884.77,"end",[-1,0]]],"vbases":{"rise":[[68,884.77,"end",[-1,0]]],"fall":[[68,931.23,"end",[-1,0]]]},"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"x":68,"y":884.77,"anc":"end"},"fall":{"x":68,"y":931.23,"anc":"end"}},"dflt":"rise","vis":[],"t":"F","x":68,"y":884.77,"anc":"end","n":"pctx1"},{"f":"ln","id":"tl2x1","pts":[[235.33,996],[235.33,884.77]],"dash":1,"w":2,"o":["tt2"],"need":"tau2","vis":[],"t":"F"},{"f":"lb","id":"tau2tx1","k":"tau2","bases":[[235.33,1026,"middle",[0,1]]],"o":["tt2"],"need":"tau2","vis":[],"t":"F","x":235.33,"y":1026,"anc":"middle","n":"tau2x1"},{"f":"ar","id":"p1ax1","x0":86,"y0":1066,"x1":461.33,"y1":1066,"two":1,"w":2,"o":["phd"],"need":"ph1","vis":[],"t":"F"},{"f":"lb","id":"ph1tx1","k":"ph1","bases":[[273.67,1098,"middle",[0,1]]],"o":["phd"],"need":"ph1","vis":[],"t":"F","x":273.67,"y":1098,"anc":"middle","n":"ph1x1"},{"f":"ar","id":"p2ax1","x0":469.33,"y0":1066,"x1":582,"y1":1066,"two":1,"w":2,"o":["phd"],"need":"ph2","vis":[],"t":"F"},{"f":"lb","id":"ph2tx1","k":"ph2","bases":[[533.67,1098,"middle",[0,1]]],"o":["phd"],"need":"ph2","vis":[],"t":"F","x":533.67,"y":1098,"anc":"middle","n":"ph2x1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  dc: {"vars":[],"items":[{"f":"ln","id":"w1","pts":[[260,410],[260,220],[414,220]],"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[486,220],[640,220],[640,388]],"vis":[],"t":"F"},{"f":"ln","id":"w3","pts":[[640,452],[640,620],[260,620],[260,430]],"vis":[],"t":"F"},{"f":"ln","id":"c","pts":[[230,410],[290,410]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c:b","pts":[[230,430],[290,430]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"ct","k":"c","bases":[[210,420,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":120,"y":420,"anc":"end"},{"f":"lb","id":"qp","k":"q","bases":[[300,376,"start",[1,-1]]],"vbases":{"top":[[300,376,"start",[1,-1]]],"bot":[[300,464,"start",[1,1]]]},"need":"q","sel":"pp","var":{"top":{"x":300,"y":376,"anc":"start"},"bot":{"x":300,"y":464,"anc":"start"}},"dflt":"top","vis":[],"t":"F","pre":"+","x":300,"y":376,"anc":"start"},{"f":"lb","id":"qm","k":"q","bases":[[300,464,"start",[1,1]]],"vbases":{"top":[[300,464,"start",[1,1]]],"bot":[[300,376,"start",[1,-1]]]},"need":"q","sel":"pp","var":{"top":{"x":300,"y":464,"anc":"start"},"bot":{"x":300,"y":376,"anc":"start"}},"dflt":"top","vis":[],"t":"F","pre":"-","x":300,"y":464,"anc":"start"},{"f":"ar","id":"vca","x0":140,"y0":600,"x1":140,"y1":240,"w":3,"need":"vc","sel":"pp","var":{"top":{"x0":140,"y0":600,"x1":140,"y1":240},"bot":{"x0":140,"y0":240,"x1":140,"y1":600}},"dflt":"top","vis":[],"t":"F"},{"f":"lb","id":"vct","k":"vc","bases":[[124,480,"end",[-1,0]]],"need":"vc","vis":[],"t":"F","x":124,"y":480,"anc":"end"},{"f":"c","id":"swp0","cx":414,"cy":220,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":486,"cy":220,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"sw","pts":[[414,220],[480,220]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[414,220],[476.35,184]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"rr","pts":[[628,388],[652,388],[652,452],[628,452]],"w":3,"close":1,"vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[670,420,"start",[1,0]]],"need":"r","vis":[],"t":"F","x":670,"y":420,"anc":"start"},{"f":"ar","id":"ia","x0":526,"y0":220,"x1":596,"y1":220,"w":4,"need":"i","sel":"pp","var":{"top":{"x0":526,"y0":220,"x1":596,"y1":220},"bot":{"x0":596,"y0":220,"x1":526,"y1":220}},"dflt":"top","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[561,188,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":561,"y":182,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU54s6dis(d, p, L){ tbFig_Draw(d, p, L, U54S6K.dis); }
function tbU54s6dc(d, p, L){ tbFig_Draw(d, p, L, U54S6K.dc); }
// ---- 54-7 内部抵抗を足して時定数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S7K = {
  ir: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s7irL","pts":[[478,360],[727.5,360]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw2","pts":[[795.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw3","pts":[[478,670],[1045,670]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw4","pts":[[478,360],[478,407.5]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw5","pts":[[478,467.5],[478,515]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw6","pts":[[478,515],[478,580.5]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw7","pts":[[478,604.5],[478,670]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw8","pts":[[1045,360],[1045,407.5]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw9","pts":[[1045,467.5],[1045,515]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw10","pts":[[1045,515],[1045,562.5]],"vis":[],"dash":0},{"t":"w","id":"u54s7irw11","pts":[[1045,622.5],[1045,670]],"vis":[],"dash":0},{"t":"s","k":"sw","dir":"h","x0":727.5,"y0":360,"x1":795.5,"y1":360,"v":1,"vis":[]},{"t":"r","k":"ri","x":478,"y":437.5,"dir":"v","vis":[],"lab":[497.97,437.5,"start"]},{"t":"e","k":"src","dir":"v","xp":478,"yp":580.5,"xm":478,"ym":604.5,"vis":[],"side":-1,"lab":[440.03,592.5,"end"]},{"t":"r","k":"r","x":1045,"y":437.5,"dir":"v","vis":[],"lab":[1025.03,437.5,"end"]},{"t":"cap","k":"c","x":1045,"y":592.5,"dir":"v","vis":[],"lab":[1019.03,592.5,"end"],"fh":1,"f":"cap","F":32.9}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["C","sw","n1","n2",0,[1]],["R","ri","n1","n5",1,[]],["E","src","n5","n3",1,[]],["R","r","n2","n6",1,[]],["R","c","n6","n3",1,[]]]}
};
function tbU54s7ir(d, p, L){ tbFig_Draw(d, p, L, U54S7K.ir); }
// ---- 54-8 切り換えた後の閉回路で時定数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s8.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S8K = {
  sm: {"vars":[],"items":[{"f":"ln","id":"bat","pts":[[268,430],[332,430]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"bat:m","pts":[[284,450],[316,450]],"w":7,"vis":[],"t":"F"},{"f":"lb","id":"srct","k":"src","bases":[[248,440,"end",[-1,0]],[248,490,"end",[-1,0]]],"need":"src","vis":[],"t":"F","x":248,"y":440,"anc":"end"},{"f":"ln","id":"w1","pts":[[300,430],[300,260],[360,260]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"rr1","pts":[[360,247],[460,247],[460,273],[360,273]],"w":3,"fill":"w","close":1,"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[460,260],[554,260]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"c1","cx":560,"cy":260,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"cpv","cx":630,"cy":260,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"w3","pts":[[636,260],[740,260]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"rr2","pts":[[740,247],[840,247],[840,273],[740,273]],"w":3,"fill":"w","close":1,"vis":[],"t":"F"},{"f":"ln","id":"w4","pts":[[840,260],[900,260],[900,428]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"cp","pts":[[872,428],[928,428]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"cp:b","pts":[[872,452],[928,452]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"w5","pts":[[900,452],[900,620],[300,620],[300,450]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"c2","cx":600,"cy":316,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"w6","pts":[[600,322],[600,620]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"j2","cx":600,"cy":620,"r":8,"fill":"k","vis":[],"t":"F"},{"f":"ln","id":"swb","pts":[[630,260],[568,290]],"w":4,"sel":"swto","var":{"1":{"pts":[[630,260],[566,262]]},"2":{"pts":[[630,260],[604,312]]},"0":{"pts":[[630,260],[568,290]]}},"dflt":"0","vis":[],"t":"F"},{"f":"lb","id":"swt","k":"sw","bases":[[600,216,"middle",[0,-1]]],"need":"sw","vis":[],"t":"F","x":600,"y":216,"anc":"middle"},{"f":"lb","id":"n1t","k":"n1","bases":[[546,294,"end",[-1,1]]],"need":"n1","vis":[],"t":"F","x":546,"y":294,"anc":"end"},{"f":"lb","id":"n2t","k":"n2","bases":[[622,346,"start",[1,1]]],"need":"n2","vis":[],"t":"F","x":622,"y":346,"anc":"start"},{"f":"lb","id":"r1t","k":"r1","bases":[[410,216,"middle",[0,-1]],[410,306,"middle",[0,1]]],"need":"r1","vis":[],"t":"F","x":410,"y":216,"anc":"middle"},{"f":"lb","id":"r2t","k":"r2","bases":[[790,216,"middle",[0,-1]],[790,306,"middle",[0,1]]],"need":"r2","vis":[],"t":"F","x":790,"y":216,"anc":"middle"},{"f":"lb","id":"ct","k":"c","bases":[[940,440,"start",[1,0]],[860,440,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":860,"y":440,"anc":"end"},{"f":"ar","id":"ia","x0":658,"y0":160,"x1":722,"y1":160,"w":4,"need":"i","sel":"ia","var":{"right":{"x0":658,"y0":160,"x1":722,"y1":160},"left":{"x0":722,"y0":160,"x1":658,"y1":160}},"dflt":"right","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[690,128,"middle",[0,-1]],[690,192,"middle",[0,1]]],"need":"i","vis":[],"t":"F","x":690,"y":122,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU54s8sm(d, p, L){ tbFig_Draw(d, p, L, U54S8K.sm); }
// ---- 54-9 合成した R と C で時定数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s9.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S9K = {
  pc: {"vars":[["m","rm","rp"],["m","cm","cp"]],"items":[{"t":"w","id":"u54s9pcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s9pcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9pcw1","pts":[[507,280],[507,440]],"vis":[-1],"dash":0},{"t":"w","id":"u54s9pcw2","pts":[[747,280],[747,440]],"vis":[-1],"dash":0},{"t":"w","id":"u54s9pcw3","pts":[[507,280],[597,280]],"vis":[-1],"dash":0},{"t":"w","id":"u54s9pcw4","pts":[[657,280],[747,280]],"vis":[-1],"dash":0},{"t":"w","id":"u54s9pcw5","pts":[[507,440],[597,440]],"vis":[-1],"dash":0},{"t":"w","id":"u54s9pcw6","pts":[[657,440],[747,440]],"vis":[-1],"dash":0},{"t":"w","id":"u54s9pcw7","pts":[[507,360],[597,360]],"vis":[1],"dash":0},{"t":"w","id":"u54s9pcw8","pts":[[657,360],[747,360]],"vis":[1],"dash":0},{"t":"w","id":"u54s9pcw9","pts":[[478,360],[507,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9pcw10","pts":[[776,280],[776,440]],"vis":[-2],"dash":0},{"t":"w","id":"u54s9pcw11","pts":[[1016,280],[1016,440]],"vis":[-2],"dash":0},{"t":"w","id":"u54s9pcw12","pts":[[776,280],[866,280]],"vis":[-2],"dash":0},{"t":"w","id":"u54s9pcw13","pts":[[926,280],[1016,280]],"vis":[-2],"dash":0},{"t":"w","id":"u54s9pcw14","pts":[[776,440],[866,440]],"vis":[-2],"dash":0},{"t":"w","id":"u54s9pcw15","pts":[[926,440],[1016,440]],"vis":[-2],"dash":0},{"t":"w","id":"u54s9pcw16","pts":[[776,360],[866,360]],"vis":[2],"dash":0},{"t":"w","id":"u54s9pcw17","pts":[[926,360],[1016,360]],"vis":[2],"dash":0},{"t":"w","id":"u54s9pcw18","pts":[[747,360],[776,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9pcw19","pts":[[1016,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,599.21,null]},{"t":"r","k":"r1","x":627,"y":280,"dir":"h","vis":[-1],"lab":[627,249.03,null]},{"t":"r","k":"r2","x":627,"y":440,"dir":"h","vis":[-1],"lab":[627,409.03,null]},{"t":"d","id":"u54s9pcj111","x":507,"y":360,"vis":[-1]},{"t":"d","id":"u54s9pcj212","x":747,"y":360,"vis":[-1]},{"t":"r","k":"rp","x":627,"y":360,"dir":"h","vis":[1],"lab":[627,329.03,null]},{"t":"cap","k":"c1","x":896,"y":280,"dir":"h","vis":[-2],"lab":[896,243.03,null],"fh":1,"f":"cap","F":29.3},{"t":"cap","k":"c2","x":896,"y":440,"dir":"h","vis":[-2],"lab":[896,403.03,null],"fh":1,"f":"cap","F":29.3},{"t":"d","id":"u54s9pcj125","x":776,"y":360,"vis":[-2]},{"t":"d","id":"u54s9pcj226","x":1016,"y":360,"vis":[-2]},{"t":"cap","k":"cp","x":896,"y":360,"dir":"h","vis":[2],"lab":[896,323.03,null],"fh":1,"f":"cap","F":29.3},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[-1]],["R","r2","P","n1",1,[-1]],["R","rp","P","n1",1,[1]],["R","c1","n1","N",1,[-2]],["R","c2","n1","N",1,[-2]],["R","cp","n1","N",1,[2]]]},
  sc: {"vars":[],"items":[{"t":"w","id":"u54s9scL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s9scRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9scw1","pts":[[478,360],[557.25,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9scw2","pts":[[617.25,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9scw3","pts":[[791.5,360],[905.75,360]],"vis":[],"dash":0},{"t":"w","id":"u54s9scw4","pts":[[965.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":587.25,"y":360,"dir":"h","vis":[],"lab":[587.25,330.34,null]},{"t":"cap","k":"c1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,324.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":935.75,"y":360,"dir":"h","vis":[],"lab":[935.75,324.34,null],"fh":1,"f":"cap","F":27},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","c1","n1","n2",1,[]],["R","c2","n2","N",1,[]]]}
};
function tbU54s9pc(d, p, L){ tbFig_Draw(d, p, L, U54S9K.pc); }
function tbU54s9sc(d, p, L){ tbFig_Draw(d, p, L, U54S9K.sc); }
// ---- 54-10 コンデンサから見た合成抵抗で時定数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s10.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S10K = {
  th: {"vars":[],"items":[{"f":"ln","id":"bat","pts":[[268,430],[332,430]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"bat:m","pts":[[284,450],[316,450]],"w":7,"vis":[],"t":"F"},{"f":"lb","id":"srct","k":"src","bases":[[248,440,"end",[-1,0]],[248,490,"end",[-1,0]]],"need":"src","vis":[],"t":"F","x":248,"y":440,"anc":"end"},{"f":"ln","id":"w1","pts":[[300,430],[300,260],[370,260]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"rr1","pts":[[370,247],[470,247],[470,273],[370,273]],"w":3,"fill":"w","close":1,"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[470,260],[530,260]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"sp0","cx":530,"cy":260,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"sp1","cx":600,"cy":260,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[530,260],[598.87,223.38]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swc","pts":[[530,260],[594,260]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"lb","id":"swt","k":"sw","bases":[[565,204,"middle",[0,-1]]],"need":"sw","vis":[],"t":"F","x":565,"y":192,"anc":"middle"},{"f":"ln","id":"w3","pts":[[606,260],[960,260],[960,428]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w4","pts":[[960,452],[960,620],[300,620],[300,450]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"jt","cx":660,"cy":260,"r":8,"fill":"k","vis":[],"t":"F"},{"f":"c","id":"jb","cx":660,"cy":620,"r":8,"fill":"k","vis":[],"t":"F"},{"f":"ln","id":"w5","pts":[[660,260],[660,390]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"rr2","pts":[[647,390],[673,390],[673,490],[647,490]],"w":3,"fill":"w","close":1,"vis":[],"t":"F"},{"f":"ln","id":"w6","pts":[[660,490],[660,620]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"r2t","k":"r2","bases":[[620,440,"end",[-1,0]],[700,440,"start",[1,0]]],"need":"r2","vis":[],"t":"F","x":620,"y":440,"anc":"end"},{"f":"ln","id":"dl","pts":[[780,190],[780,690]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"cp","pts":[[932,428],[988,428]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"cp:b","pts":[[932,452],[988,452]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"ct","k":"c","bases":[[1000,440,"start",[1,0]],[920,440,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":1000,"y":440,"anc":"start"},{"f":"lb","id":"r1t","k":"r1","bases":[[420,216,"middle",[0,-1]],[420,306,"middle",[0,1]]],"need":"r1","vis":[],"t":"F","x":412,"y":204,"anc":"middle"},{"f":"ar","id":"va","x0":900,"y0":500,"x1":900,"y1":380,"w":3,"need":"v","sel":"va","var":{"up":{"x0":900,"y0":500,"x1":900,"y1":380},"down":{"x0":900,"y0":380,"x1":900,"y1":500}},"dflt":"up","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[882,440,"end",[-1,0]]],"need":"v","vis":[],"t":"F","x":882,"y":440,"anc":"end"},{"f":"ar","id":"ia","x0":788,"y0":200,"x1":852,"y1":200,"w":4,"need":"i","sel":"ia","var":{"right":{"x0":788,"y0":200,"x1":852,"y1":200},"left":{"x0":852,"y0":200,"x1":788,"y1":200}},"dflt":"right","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[820,168,"middle",[0,-1]],[820,232,"middle",[0,1]]],"need":"i","vis":[],"t":"F","x":820,"y":168,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU54s10th(d, p, L){ tbFig_Draw(d, p, L, U54S10K.th); }
// ---- 54-11 文の正誤（過渡現象） の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s11.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S11K = {
  rc: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s11rcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s11rcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s11rcw1","pts":[[478,360],[548.25,360]],"vis":[],"dash":0},{"t":"w","id":"u54s11rcw2","pts":[[616.25,360],[721.5,360]],"vis":[],"dash":0},{"t":"w","id":"u54s11rcw3","pts":[[781.5,360],[900.75,360]],"vis":[],"dash":0},{"t":"w","id":"u54s11rcw4","pts":[[960.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,615.97,null]},{"t":"s","k":"sw","dir":"h","x0":548.25,"y0":360,"x1":616.25,"y1":360,"v":1,"vis":[]},{"t":"r","k":"r","x":751.5,"y":360,"dir":"h","vis":[],"lab":[751.5,317.03,null]},{"t":"cap","k":"c","x":930.75,"y":360,"dir":"h","vis":[],"lab":[930.75,311.03,null],"fh":1,"f":"cap","F":50},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ar","id":"axx1","x0":542,"y0":1020,"x1":1052,"y1":1020,"vis":[],"t":"F"},{"f":"ar","id":"ayx1","x0":542,"y0":1020,"x1":542,"y1":760,"vis":[],"t":"F"},{"f":"tx","id":"ox1","x":528,"y":1046,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"tx","id":"atx1","x":1064,"y":1020,"s":"{t}","anc":"start","vis":[],"t":"F"},{"f":"lb","id":"ytx1","k":"y","bases":[[526,770,"end",[-1,-1]],[558,760,"start",[1,-1]]],"need":"y","vis":[],"t":"F","x":558,"y":760,"anc":"start","n":"yx1"},{"f":"ln","id":"cvx1","pts":[[542,1020],[553.5,995.48],[565,974.38],[576.5,956.22],[588,940.59],[599.5,927.14],[611,915.56],[622.5,905.59],[634,897.01],[645.5,889.63],[657,883.27],[668.5,877.8],[680,873.09],[691.5,869.04],[703,865.55],[714.5,862.55],[726,859.97],[737.5,857.74],[749,855.83],[760.5,854.18],[772,852.76],[783.5,851.54],[795,850.49],[806.5,849.59],[818,848.81],[829.5,848.14],[841,847.56],[852.5,847.07],[864,846.64],[875.5,846.27],[887,845.96],[898.5,845.68],[910,845.45],[921.5,845.25],[933,845.07],[944.5,844.92],[956,844.79],[967.5,844.68],[979,844.59],[990.5,844.51],[1002,844.44]],"w":5,"need":"cv","sel":"cv","var":{"rise":{"pts":[[542,1020],[553.5,995.48],[565,974.38],[576.5,956.22],[588,940.59],[599.5,927.14],[611,915.56],[622.5,905.59],[634,897.01],[645.5,889.63],[657,883.27],[668.5,877.8],[680,873.09],[691.5,869.04],[703,865.55],[714.5,862.55],[726,859.97],[737.5,857.74],[749,855.83],[760.5,854.18],[772,852.76],[783.5,851.54],[795,850.49],[806.5,849.59],[818,848.81],[829.5,848.14],[841,847.56],[852.5,847.07],[864,846.64],[875.5,846.27],[887,845.96],[898.5,845.68],[910,845.45],[921.5,845.25],[933,845.07],[944.5,844.92],[956,844.79],[967.5,844.68],[979,844.59],[990.5,844.51],[1002,844.44]]},"fall":{"pts":[[542,844],[553.5,868.52],[565,889.62],[576.5,907.78],[588,923.41],[599.5,936.86],[611,948.44],[622.5,958.41],[634,966.99],[645.5,974.37],[657,980.73],[668.5,986.2],[680,990.91],[691.5,994.96],[703,998.45],[714.5,1001.45],[726,1004.03],[737.5,1006.26],[749,1008.17],[760.5,1009.82],[772,1011.24],[783.5,1012.46],[795,1013.51],[806.5,1014.41],[818,1015.19],[829.5,1015.86],[841,1016.44],[852.5,1016.93],[864,1017.36],[875.5,1017.73],[887,1018.04],[898.5,1018.32],[910,1018.55],[921.5,1018.75],[933,1018.93],[944.5,1019.08],[956,1019.21],[967.5,1019.32],[979,1019.41],[990.5,1019.49],[1002,1019.56]]},"jump":{"pts":[[542,1020],[542,844],[1002,844]]},"zero":{"pts":[[542,1020],[1002,1020]]},"rise2":{"pts":[[542,1020],[553.5,1007.28],[565,995.48],[576.5,984.54],[588,974.38],[599.5,964.96],[611,956.22],[622.5,948.11],[634,940.59],[645.5,933.61],[657,927.14],[668.5,921.13],[680,915.56],[691.5,910.39],[703,905.59],[714.5,901.14],[726,897.01],[737.5,893.18],[749,889.63],[760.5,886.33],[772,883.27],[783.5,880.43],[795,877.8],[806.5,875.36],[818,873.09],[829.5,870.99],[841,869.04],[852.5,867.23],[864,865.55],[875.5,864],[887,862.55],[898.5,861.21],[910,859.97],[921.5,858.81],[933,857.74],[944.5,856.75],[956,855.83],[967.5,854.97],[979,854.18],[990.5,853.44],[1002,852.76]]},"fall2":{"pts":[[542,844],[553.5,856.72],[565,868.52],[576.5,879.46],[588,889.62],[599.5,899.04],[611,907.78],[622.5,915.89],[634,923.41],[645.5,930.39],[657,936.86],[668.5,942.87],[680,948.44],[691.5,953.61],[703,958.41],[714.5,962.86],[726,966.99],[737.5,970.82],[749,974.37],[760.5,977.67],[772,980.73],[783.5,983.57],[795,986.2],[806.5,988.64],[818,990.91],[829.5,993.01],[841,994.96],[852.5,996.77],[864,998.45],[875.5,1000],[887,1001.45],[898.5,1002.79],[910,1004.03],[921.5,1005.19],[933,1006.26],[944.5,1007.25],[956,1008.17],[967.5,1009.03],[979,1009.82],[990.5,1010.56],[1002,1011.24]]}},"dflt":"rise","vis":[],"t":"F","tt":"tt"},{"f":"ln","id":"flx1","pts":[[542,844],[1002,844]],"dash":1,"w":2,"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"pts":[[542,844],[1002,844]]},"fall":{"pts":[[542,1020],[1002,1020]]},"jump":{"pts":[[542,844],[1002,844]]},"zero":{"pts":[[542,1020],[1002,1020]]},"rise2":{"pts":[[542,844],[1002,844]]},"fall2":{"pts":[[542,1020],[1002,1020]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"fintx1","k":"fin","bases":[[1016,844,"start",[1,0]]],"vbases":{"rise":[[1016,844,"start",[1,0]]],"fall":[[1016,986,"start",[1,0]]],"jump":[[1016,844,"start",[1,0]]],"zero":[[1016,986,"start",[1,0]]],"rise2":[[1016,844,"start",[1,0]]],"fall2":[[1016,986,"start",[1,0]]]},"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"x":1016,"y":844,"anc":"start"},"fall":{"x":1016,"y":978,"anc":"start"},"jump":{"x":1016,"y":844,"anc":"start"},"zero":{"x":1016,"y":978,"anc":"start"},"rise2":{"x":1016,"y":844,"anc":"start"},"fall2":{"x":1016,"y":978,"anc":"start"}},"dflt":"rise","vis":[],"t":"F","x":1016,"y":844,"anc":"start","n":"finx1"},{"f":"lb","id":"sttx1","k":"st","bases":[[528,844,"end",[-1,0]],[558,814,"start",[1,-1]]],"need":"st","vis":[],"t":"F","x":577.8,"y":805.51,"anc":"start","n":"stx1"},{"f":"ln","id":"cw2x1","pts":[[542,1020],[542,844],[1002,844]],"dash":1,"w":3,"o":["tt2"],"need":"cv2","sel":"cv2","var":{"rise":{"pts":[[542,1020],[553.5,995.48],[565,974.38],[576.5,956.22],[588,940.59],[599.5,927.14],[611,915.56],[622.5,905.59],[634,897.01],[645.5,889.63],[657,883.27],[668.5,877.8],[680,873.09],[691.5,869.04],[703,865.55],[714.5,862.55],[726,859.97],[737.5,857.74],[749,855.83],[760.5,854.18],[772,852.76],[783.5,851.54],[795,850.49],[806.5,849.59],[818,848.81],[829.5,848.14],[841,847.56],[852.5,847.07],[864,846.64],[875.5,846.27],[887,845.96],[898.5,845.68],[910,845.45],[921.5,845.25],[933,845.07],[944.5,844.92],[956,844.79],[967.5,844.68],[979,844.59],[990.5,844.51],[1002,844.44]]},"fall":{"pts":[[542,844],[553.5,868.52],[565,889.62],[576.5,907.78],[588,923.41],[599.5,936.86],[611,948.44],[622.5,958.41],[634,966.99],[645.5,974.37],[657,980.73],[668.5,986.2],[680,990.91],[691.5,994.96],[703,998.45],[714.5,1001.45],[726,1004.03],[737.5,1006.26],[749,1008.17],[760.5,1009.82],[772,1011.24],[783.5,1012.46],[795,1013.51],[806.5,1014.41],[818,1015.19],[829.5,1015.86],[841,1016.44],[852.5,1016.93],[864,1017.36],[875.5,1017.73],[887,1018.04],[898.5,1018.32],[910,1018.55],[921.5,1018.75],[933,1018.93],[944.5,1019.08],[956,1019.21],[967.5,1019.32],[979,1019.41],[990.5,1019.49],[1002,1019.56]]},"jump":{"pts":[[542,1020],[542,844],[1002,844]]},"zero":{"pts":[[542,1020],[1002,1020]]},"rise2":{"pts":[[542,1020],[553.5,1007.28],[565,995.48],[576.5,984.54],[588,974.38],[599.5,964.96],[611,956.22],[622.5,948.11],[634,940.59],[645.5,933.61],[657,927.14],[668.5,921.13],[680,915.56],[691.5,910.39],[703,905.59],[714.5,901.14],[726,897.01],[737.5,893.18],[749,889.63],[760.5,886.33],[772,883.27],[783.5,880.43],[795,877.8],[806.5,875.36],[818,873.09],[829.5,870.99],[841,869.04],[852.5,867.23],[864,865.55],[875.5,864],[887,862.55],[898.5,861.21],[910,859.97],[921.5,858.81],[933,857.74],[944.5,856.75],[956,855.83],[967.5,854.97],[979,854.18],[990.5,853.44],[1002,852.76]]},"fall2":{"pts":[[542,844],[553.5,856.72],[565,868.52],[576.5,879.46],[588,889.62],[599.5,899.04],[611,907.78],[622.5,915.89],[634,923.41],[645.5,930.39],[657,936.86],[668.5,942.87],[680,948.44],[691.5,953.61],[703,958.41],[714.5,962.86],[726,966.99],[737.5,970.82],[749,974.37],[760.5,977.67],[772,980.73],[783.5,983.57],[795,986.2],[806.5,988.64],[818,990.91],[829.5,993.01],[841,994.96],[852.5,996.77],[864,998.45],[875.5,1000],[887,1001.45],[898.5,1002.79],[910,1004.03],[921.5,1005.19],[933,1006.26],[944.5,1007.25],[956,1008.17],[967.5,1009.03],[979,1009.82],[990.5,1010.56],[1002,1011.24]]}},"dflt":"jump","vis":[],"t":"F"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[818,810,"middle",[0,-1]],[864,932,"middle",[0,1]]],"o":["tt2"],"need":"c2","vis":[],"t":"F","x":818,"y":810,"anc":"middle","n":"c2x1"},{"f":"ln","id":"tl0x1","pts":[[618.67,1020],[618.67,908.77]],"dash":1,"w":2,"o":["taud"],"need":"tau","vis":[],"t":"F"},{"f":"lb","id":"tautx1","k":"tau","bases":[[618.67,1050,"middle",[0,1]]],"o":["taud"],"need":"tau","vis":[],"t":"F","x":618.67,"y":1130,"anc":"middle","n":"taux1"},{"f":"ln","id":"plx1","pts":[[542,908.77],[618.67,908.77]],"dash":1,"w":2,"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"pts":[[542,908.77],[618.67,908.77]]},"fall":{"pts":[[542,955.23],[618.67,955.23]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"pcttx1","k":"pct","bases":[[528,908.77,"end",[-1,0]]],"vbases":{"rise":[[528,908.77,"end",[-1,0]]],"fall":[[528,955.23,"end",[-1,0]]]},"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"x":528,"y":908.77,"anc":"end"},"fall":{"x":528,"y":963.23,"anc":"end"}},"dflt":"rise","vis":[],"t":"F","x":528,"y":908.77,"anc":"end","n":"pctx1"},{"f":"ln","id":"tl2x1","pts":[[695.33,1020],[695.33,908.77]],"dash":1,"w":2,"o":["tt2"],"need":"tau2","vis":[],"t":"F"},{"f":"lb","id":"tau2tx1","k":"tau2","bases":[[695.33,1050,"middle",[0,1]]],"o":["tt2"],"need":"tau2","vis":[],"t":"F","x":695.33,"y":1050,"anc":"middle","n":"tau2x1"},{"f":"ar","id":"p1ax1","x0":546,"y0":1090,"x1":921.33,"y1":1090,"two":1,"w":2,"o":["phd"],"need":"ph1","vis":[],"t":"F"},{"f":"lb","id":"ph1tx1","k":"ph1","bases":[[733.67,1122,"middle",[0,1]]],"o":["phd"],"need":"ph1","vis":[],"t":"F","x":733.67,"y":1122,"anc":"middle","n":"ph1x1"},{"f":"ar","id":"p2ax1","x0":929.33,"y0":1090,"x1":1042,"y1":1090,"two":1,"w":2,"o":["phd"],"need":"ph2","vis":[],"t":"F"},{"f":"lb","id":"ph2tx1","k":"ph2","bases":[[993.67,1122,"middle",[0,1]]],"o":["phd"],"need":"ph2","vis":[],"t":"F","x":993.67,"y":1122,"anc":"middle","n":"ph2x1"}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["C","sw","L0:P","L0:n1",0,[1]],["R","r","L0:n1","L0:n2",1,[]],["R","c","L0:n2","L0:N",1,[]]]}
};
function tbU54s11rc(d, p, L){ tbFig_Draw(d, p, L, U54S11K.rc); }
// ---- 54-12 キロ・マイクロ・ミリを掛ける（時定数） の図（※ textbook/gen/make_section.py が textbook/gen/data/u54_s12.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U54S12K = {
  rc: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u54s12rcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u54s12rcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u54s12rcw1","pts":[[478,360],[548.25,360]],"vis":[],"dash":0},{"t":"w","id":"u54s12rcw2","pts":[[616.25,360],[721.5,360]],"vis":[],"dash":0},{"t":"w","id":"u54s12rcw3","pts":[[781.5,360],[900.75,360]],"vis":[],"dash":0},{"t":"w","id":"u54s12rcw4","pts":[[960.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,615.54,null]},{"t":"s","k":"sw","dir":"h","x0":548.25,"y0":360,"x1":616.25,"y1":360,"v":1,"vis":[]},{"t":"r","k":"r","x":751.5,"y":360,"dir":"h","vis":[],"lab":[751.5,317.51,null]},{"t":"cap","k":"c","x":930.75,"y":360,"dir":"h","vis":[],"lab":[914.75,408.49,null],"fh":1,"f":"cap","F":49.1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.05,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"f":"ar","id":"axx1","x0":491,"y0":1019,"x1":1001,"y1":1019,"vis":[],"t":"F"},{"f":"ar","id":"ayx1","x0":491,"y0":1019,"x1":491,"y1":759,"vis":[],"t":"F"},{"f":"tx","id":"ox1","x":477,"y":1045,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"tx","id":"atx1","x":1013,"y":1019,"s":"{t}","anc":"start","vis":[],"t":"F"},{"f":"lb","id":"ytx1","k":"y","bases":[[475,769,"end",[-1,-1]],[507,759,"start",[1,-1]]],"need":"y","vis":[],"t":"F","x":507,"y":759,"anc":"start","n":"yx1"},{"f":"ln","id":"cvx1","pts":[[491,1019],[502.5,994.48],[514,973.38],[525.5,955.22],[537,939.59],[548.5,926.14],[560,914.56],[571.5,904.59],[583,896.01],[594.5,888.63],[606,882.27],[617.5,876.8],[629,872.09],[640.5,868.04],[652,864.55],[663.5,861.55],[675,858.97],[686.5,856.74],[698,854.83],[709.5,853.18],[721,851.76],[732.5,850.54],[744,849.49],[755.5,848.59],[767,847.81],[778.5,847.14],[790,846.56],[801.5,846.07],[813,845.64],[824.5,845.27],[836,844.96],[847.5,844.68],[859,844.45],[870.5,844.25],[882,844.07],[893.5,843.92],[905,843.79],[916.5,843.68],[928,843.59],[939.5,843.51],[951,843.44]],"w":5,"need":"cv","sel":"cv","var":{"rise":{"pts":[[491,1019],[502.5,994.48],[514,973.38],[525.5,955.22],[537,939.59],[548.5,926.14],[560,914.56],[571.5,904.59],[583,896.01],[594.5,888.63],[606,882.27],[617.5,876.8],[629,872.09],[640.5,868.04],[652,864.55],[663.5,861.55],[675,858.97],[686.5,856.74],[698,854.83],[709.5,853.18],[721,851.76],[732.5,850.54],[744,849.49],[755.5,848.59],[767,847.81],[778.5,847.14],[790,846.56],[801.5,846.07],[813,845.64],[824.5,845.27],[836,844.96],[847.5,844.68],[859,844.45],[870.5,844.25],[882,844.07],[893.5,843.92],[905,843.79],[916.5,843.68],[928,843.59],[939.5,843.51],[951,843.44]]},"fall":{"pts":[[491,843],[502.5,867.52],[514,888.62],[525.5,906.78],[537,922.41],[548.5,935.86],[560,947.44],[571.5,957.41],[583,965.99],[594.5,973.37],[606,979.73],[617.5,985.2],[629,989.91],[640.5,993.96],[652,997.45],[663.5,1000.45],[675,1003.03],[686.5,1005.26],[698,1007.17],[709.5,1008.82],[721,1010.24],[732.5,1011.46],[744,1012.51],[755.5,1013.41],[767,1014.19],[778.5,1014.86],[790,1015.44],[801.5,1015.93],[813,1016.36],[824.5,1016.73],[836,1017.04],[847.5,1017.32],[859,1017.55],[870.5,1017.75],[882,1017.93],[893.5,1018.08],[905,1018.21],[916.5,1018.32],[928,1018.41],[939.5,1018.49],[951,1018.56]]},"jump":{"pts":[[491,1019],[491,843],[951,843]]},"zero":{"pts":[[491,1019],[951,1019]]},"rise2":{"pts":[[491,1019],[502.5,1006.28],[514,994.48],[525.5,983.54],[537,973.38],[548.5,963.96],[560,955.22],[571.5,947.11],[583,939.59],[594.5,932.61],[606,926.14],[617.5,920.13],[629,914.56],[640.5,909.39],[652,904.59],[663.5,900.14],[675,896.01],[686.5,892.18],[698,888.63],[709.5,885.33],[721,882.27],[732.5,879.43],[744,876.8],[755.5,874.36],[767,872.09],[778.5,869.99],[790,868.04],[801.5,866.23],[813,864.55],[824.5,863],[836,861.55],[847.5,860.21],[859,858.97],[870.5,857.81],[882,856.74],[893.5,855.75],[905,854.83],[916.5,853.97],[928,853.18],[939.5,852.44],[951,851.76]]},"fall2":{"pts":[[491,843],[502.5,855.72],[514,867.52],[525.5,878.46],[537,888.62],[548.5,898.04],[560,906.78],[571.5,914.89],[583,922.41],[594.5,929.39],[606,935.86],[617.5,941.87],[629,947.44],[640.5,952.61],[652,957.41],[663.5,961.86],[675,965.99],[686.5,969.82],[698,973.37],[709.5,976.67],[721,979.73],[732.5,982.57],[744,985.2],[755.5,987.64],[767,989.91],[778.5,992.01],[790,993.96],[801.5,995.77],[813,997.45],[824.5,999],[836,1000.45],[847.5,1001.79],[859,1003.03],[870.5,1004.19],[882,1005.26],[893.5,1006.25],[905,1007.17],[916.5,1008.03],[928,1008.82],[939.5,1009.56],[951,1010.24]]}},"dflt":"rise","vis":[],"t":"F","tt":"tt"},{"f":"ln","id":"flx1","pts":[[491,843],[951,843]],"dash":1,"w":2,"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"pts":[[491,843],[951,843]]},"fall":{"pts":[[491,1019],[951,1019]]},"jump":{"pts":[[491,843],[951,843]]},"zero":{"pts":[[491,1019],[951,1019]]},"rise2":{"pts":[[491,843],[951,843]]},"fall2":{"pts":[[491,1019],[951,1019]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"fintx1","k":"fin","bases":[[965,843,"start",[1,0]]],"vbases":{"rise":[[965,843,"start",[1,0]]],"fall":[[965,985,"start",[1,0]]],"jump":[[965,843,"start",[1,0]]],"zero":[[965,985,"start",[1,0]]],"rise2":[[965,843,"start",[1,0]]],"fall2":[[965,985,"start",[1,0]]]},"o":["find"],"need":"fin","sel":"cv","var":{"rise":{"x":965,"y":843,"anc":"start"},"fall":{"x":965,"y":977,"anc":"start"},"jump":{"x":965,"y":843,"anc":"start"},"zero":{"x":965,"y":977,"anc":"start"},"rise2":{"x":965,"y":843,"anc":"start"},"fall2":{"x":965,"y":977,"anc":"start"}},"dflt":"rise","vis":[],"t":"F","x":965,"y":843,"anc":"start","n":"finx1"},{"f":"lb","id":"sttx1","k":"st","bases":[[477,843,"end",[-1,0]],[507,813,"start",[1,-1]]],"need":"st","vis":[],"t":"F","x":526.8,"y":804.51,"anc":"start","n":"stx1"},{"f":"ln","id":"cw2x1","pts":[[491,1019],[491,843],[951,843]],"dash":1,"w":3,"o":["tt2"],"need":"cv2","sel":"cv2","var":{"rise":{"pts":[[491,1019],[502.5,994.48],[514,973.38],[525.5,955.22],[537,939.59],[548.5,926.14],[560,914.56],[571.5,904.59],[583,896.01],[594.5,888.63],[606,882.27],[617.5,876.8],[629,872.09],[640.5,868.04],[652,864.55],[663.5,861.55],[675,858.97],[686.5,856.74],[698,854.83],[709.5,853.18],[721,851.76],[732.5,850.54],[744,849.49],[755.5,848.59],[767,847.81],[778.5,847.14],[790,846.56],[801.5,846.07],[813,845.64],[824.5,845.27],[836,844.96],[847.5,844.68],[859,844.45],[870.5,844.25],[882,844.07],[893.5,843.92],[905,843.79],[916.5,843.68],[928,843.59],[939.5,843.51],[951,843.44]]},"fall":{"pts":[[491,843],[502.5,867.52],[514,888.62],[525.5,906.78],[537,922.41],[548.5,935.86],[560,947.44],[571.5,957.41],[583,965.99],[594.5,973.37],[606,979.73],[617.5,985.2],[629,989.91],[640.5,993.96],[652,997.45],[663.5,1000.45],[675,1003.03],[686.5,1005.26],[698,1007.17],[709.5,1008.82],[721,1010.24],[732.5,1011.46],[744,1012.51],[755.5,1013.41],[767,1014.19],[778.5,1014.86],[790,1015.44],[801.5,1015.93],[813,1016.36],[824.5,1016.73],[836,1017.04],[847.5,1017.32],[859,1017.55],[870.5,1017.75],[882,1017.93],[893.5,1018.08],[905,1018.21],[916.5,1018.32],[928,1018.41],[939.5,1018.49],[951,1018.56]]},"jump":{"pts":[[491,1019],[491,843],[951,843]]},"zero":{"pts":[[491,1019],[951,1019]]},"rise2":{"pts":[[491,1019],[502.5,1006.28],[514,994.48],[525.5,983.54],[537,973.38],[548.5,963.96],[560,955.22],[571.5,947.11],[583,939.59],[594.5,932.61],[606,926.14],[617.5,920.13],[629,914.56],[640.5,909.39],[652,904.59],[663.5,900.14],[675,896.01],[686.5,892.18],[698,888.63],[709.5,885.33],[721,882.27],[732.5,879.43],[744,876.8],[755.5,874.36],[767,872.09],[778.5,869.99],[790,868.04],[801.5,866.23],[813,864.55],[824.5,863],[836,861.55],[847.5,860.21],[859,858.97],[870.5,857.81],[882,856.74],[893.5,855.75],[905,854.83],[916.5,853.97],[928,853.18],[939.5,852.44],[951,851.76]]},"fall2":{"pts":[[491,843],[502.5,855.72],[514,867.52],[525.5,878.46],[537,888.62],[548.5,898.04],[560,906.78],[571.5,914.89],[583,922.41],[594.5,929.39],[606,935.86],[617.5,941.87],[629,947.44],[640.5,952.61],[652,957.41],[663.5,961.86],[675,965.99],[686.5,969.82],[698,973.37],[709.5,976.67],[721,979.73],[732.5,982.57],[744,985.2],[755.5,987.64],[767,989.91],[778.5,992.01],[790,993.96],[801.5,995.77],[813,997.45],[824.5,999],[836,1000.45],[847.5,1001.79],[859,1003.03],[870.5,1004.19],[882,1005.26],[893.5,1006.25],[905,1007.17],[916.5,1008.03],[928,1008.82],[939.5,1009.56],[951,1010.24]]}},"dflt":"jump","vis":[],"t":"F"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[767,809,"middle",[0,-1]],[813,931,"middle",[0,1]]],"o":["tt2"],"need":"c2","vis":[],"t":"F","x":767,"y":809,"anc":"middle","n":"c2x1"},{"f":"ln","id":"tl0x1","pts":[[567.67,1019],[567.67,907.77]],"dash":1,"w":2,"o":["taud"],"need":"tau","vis":[],"t":"F"},{"f":"lb","id":"tautx1","k":"tau","bases":[[567.67,1049,"middle",[0,1]]],"o":["taud"],"need":"tau","vis":[],"t":"F","x":567.67,"y":1129,"anc":"middle","n":"taux1"},{"f":"ln","id":"plx1","pts":[[491,907.77],[567.67,907.77]],"dash":1,"w":2,"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"pts":[[491,907.77],[567.67,907.77]]},"fall":{"pts":[[491,954.23],[567.67,954.23]]}},"dflt":"rise","vis":[],"t":"F"},{"f":"lb","id":"pcttx1","k":"pct","bases":[[477,907.77,"end",[-1,0]]],"vbases":{"rise":[[477,907.77,"end",[-1,0]]],"fall":[[477,954.23,"end",[-1,0]]]},"o":["taud"],"need":"pct","sel":"cv","var":{"rise":{"x":477,"y":907.77,"anc":"end"},"fall":{"x":477,"y":954.23,"anc":"end"}},"dflt":"rise","vis":[],"t":"F","x":477,"y":907.77,"anc":"end","n":"pctx1"},{"f":"ln","id":"tl2x1","pts":[[644.33,1019],[644.33,907.77]],"dash":1,"w":2,"o":["tt2"],"need":"tau2","vis":[],"t":"F"},{"f":"lb","id":"tau2tx1","k":"tau2","bases":[[644.33,1049,"middle",[0,1]]],"o":["tt2"],"need":"tau2","vis":[],"t":"F","x":644.33,"y":1049,"anc":"middle","n":"tau2x1"},{"f":"ar","id":"p1ax1","x0":495,"y0":1089,"x1":870.33,"y1":1089,"two":1,"w":2,"o":["phd"],"need":"ph1","vis":[],"t":"F"},{"f":"lb","id":"ph1tx1","k":"ph1","bases":[[682.67,1121,"middle",[0,1]]],"o":["phd"],"need":"ph1","vis":[],"t":"F","x":682.67,"y":1121,"anc":"middle","n":"ph1x1"},{"f":"ar","id":"p2ax1","x0":878.33,"y0":1089,"x1":991,"y1":1089,"two":1,"w":2,"o":["phd"],"need":"ph2","vis":[],"t":"F"},{"f":"lb","id":"ph2tx1","k":"ph2","bases":[[942.67,1121,"middle",[0,1]]],"o":["phd"],"need":"ph2","vis":[],"t":"F","x":942.67,"y":1121,"anc":"middle","n":"ph2x1"}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["C","sw","L0:P","L0:n1",0,[1]],["R","r","L0:n1","L0:n2",1,[]],["R","c","L0:n2","L0:N",1,[]]]}
};
function tbU54s12rc(d, p, L){ tbFig_Draw(d, p, L, U54S12K.rc); }
var KINDS = {u54s1cr: tbU54s1cr, u54s2lr: tbU54s2lr, u54s3p3: tbU54s3p3, u54s4rl: tbU54s4rl, u54s5rc: tbU54s5rc, u54s6dis: tbU54s6dis, u54s6dc: tbU54s6dc, u54s7ir: tbU54s7ir, u54s8sm: tbU54s8sm, u54s9pc: tbU54s9pc, u54s9sc: tbU54s9sc, u54s10th: tbU54s10th, u54s11rc: tbU54s11rc, u54s12rc: tbU54s12rc};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 54-1 の図は電流が流れないので載せない,
  u54s2lr: function(p, L){ return tbGen_Flow(p, L, U54S2K.lr); },
  // 54-3 の図は電流が流れないので載せない,
  u54s4rl: function(p, L){ return tbGen_Flow(p, L, U54S4K.rl); },
  // 54-5 の図は電流が流れないので載せない,
  // 54-6 の図は電流が流れないので載せない,
  // 54-7 の図は電流が流れないので載せない,
  // 54-8 の図は電流が流れないので載せない,
  // 54-9 の図は電流が流れないので載せない,
  // 54-10 の図は電流が流れないので載せない,
  // 54-11 の図は電流が流れないので載せない,
  // 54-12 の図は電流が流れないので載せない
};

// 54-1 瞬間のコンデンサと直並列 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s1_par(a, b){ return a * b / (a + b); }
function tbU54s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s1_Qjust(r){
  var gcd = tbU54s1_gcd, ratio = tbU54s1_ratio, par = tbU54s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,20]);
    var r2 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var r3 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var PR = (r2 * r3 / (r2 + r3));
    var I = (e / (r1 + r2 * r3 / (r2 + r3)));
    if (!(nice(PR) && PR == Math.round(PR) && nice(I) && I >= 0.5 && I <= 20)) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s1_three4(ok, [{x: (e / r1), why: "並列の部分を足さず、$R_1$ だけで割った", w: 0, cut: 1}, {x: (e / PR), why: "$R_1$ を足さず、並列の部分だけで割った", w: 1, cut: 1}, {x: (e / (r1 + r3)), why: "コンデンサに電流が流れないと読んだ（それは十分に時間がたった後）", w: 2, cut: 0}, {x: (e / (r1 + r2 + r3)), why: "並列の部分を直列のように足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s1just", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に「コンデンサと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」と「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」を並列につなぎます。コンデンサは充電されていません。スイッチを入れた瞬間の電流 $I$ は何 A ですか。", fig: {kind: "u54s1cr", L: tbU54s1_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["入れた瞬間のコンデンサは 0 Ω の素通り　並列の部分 $\\dfrac{" + fmt(r2) + " \\times " + fmt(r3) + "}{" + fmt(r2) + " + " + fmt(r3) + "} = " + qv(PR, "O") + "$", "$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(PR) + "} = " + qv(ok, "A") + "$"], chk: {form: "u54s1just", p: {e: e, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s1just：条件に合う数字が見つからない");
}
function tbU54s1_Qfin(r){
  var gcd = tbU54s1_gcd, ratio = tbU54s1_ratio, par = tbU54s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,20]);
    var r2 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var r3 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var PR = (r2 * r3 / (r2 + r3));
    var I = (e / (r1 + r3));
    if (!(r2 != r3 && nice(PR) && nice(I) && I >= 0.5 && nice(e / (r1 + PR)))) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s1_three4(ok, [{x: (e / r1), why: "$R_3$ を足さず、$R_1$ だけで割った", w: 0, cut: 1}, {x: (e / r3), why: "$R_1$ を足さず、$R_3$ だけで割った", w: 1, cut: 1}, {x: (e / (r1 + r2 + r3)), why: "コンデンサの道の $R_2$ も足した（その道には電流が流れない）", w: 2, cut: 1}, {x: (e / (r1 + PR)), why: "コンデンサを素通りと読んだ（それはスイッチを入れた瞬間）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s1fin", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に「コンデンサと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」と「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」を並列につなぎます。スイッチを入れて十分に時間がたった後の電流 $I$ は何 A ですか。", fig: {kind: "u54s1cr", L: tbU54s1_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["十分に時間がたつと、コンデンサに電流は流れない　電流は $R_1$ と $R_3$ だけを通る", "$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(r3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u54s1fin", p: {e: e, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s1fin：条件に合う数字が見つからない");
}
function tbU54s1_Qbun(r){
  var gcd = tbU54s1_gcd, ratio = tbU54s1_ratio, par = tbU54s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,20]);
    var r2 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var r3 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var PR = (r2 * r3 / (r2 + r3));
    var I = (e / (r1 + r2 * r3 / (r2 + r3)));
    var I2 = (I * r3 / (r2 + r3));
    var I3 = (I * r2 / (r2 + r3));
    if (!(r2 != r3 && nice(PR) && PR == Math.round(PR) && nice(I) && nice(I2) && nice(I3) && I2 >= 0.5)) continue;
    var ok = (I2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s1_three4(ok, [{x: (I), why: "全体の電流で止めた（並列の道に分けていない）", w: 0, cut: 1}, {x: (e / r2), why: "全体の電流を出さず、電源の電圧を $R_2$ で割った", w: 1, cut: 1}, {x: (I3), why: "分ける比を逆にした（$R_3$ の道の電流）", w: 2, cut: 0}, {x: (e / (r1 + r2)), why: "$R_3$ の道を無いものとした", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s1bun", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に「コンデンサと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」と「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」を並列につなぎます。コンデンサは充電されていません。スイッチを入れた瞬間に、コンデンサの道を流れる電流 $I_2$ は何 A ですか。", fig: {kind: "u54s1cr", L: tbU54s1_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["入れた瞬間のコンデンサは素通り　$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(PR) + "} = " + qv(I, "A") + "$", "$R_2$ と $R_3$ に分ける　$I_2 = " + fmt(I) + " \\times \\dfrac{" + fmt(r3) + "}{" + fmt(r2) + " + " + fmt(r3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u54s1bun", p: {e: e, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s1bun：条件に合う数字が見つからない");
}
function tbU54s1_Qinv(r){
  var gcd = tbU54s1_gcd, ratio = tbU54s1_ratio, par = tbU54s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var i = pick(r, [1,2,3,4,5,6]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,20]);
    var r2 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var r3 = pick(r, [2,3,4,6,10,12,15,20,30,60]);
    var PR = (r2 * r3 / (r2 + r3));
    var E = (i * (r1 + r2 * r3 / (r2 + r3)));
    if (!(nice(PR) && PR == Math.round(PR) && E <= 200)) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s1_three4(ok, [{x: (i * r1), why: "並列の部分を足さず、$R_1$ だけを掛けた", w: 0, cut: 1}, {x: (i * PR), why: "$R_1$ を足さず、並列の部分だけを掛けた", w: 1, cut: 1}, {x: (i * (r1 + r3)), why: "コンデンサに電流が流れないと読んだ（それは十分に時間がたった後）", w: 2, cut: 0}, {x: (i * (r1 + r2 + r3)), why: "並列の部分を直列のように足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s1inv", text: "図のように、電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に「コンデンサと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」と「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」を並列につなぎます。コンデンサは充電されていません。スイッチを入れた瞬間の電流 $I$ は $" + fmt(i) + "\\,\\mathrm{A}$ でした。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u54s1cr", L: tbU54s1_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","i":"{I}"}, [["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"], ["i", "{I}=" + fmt(i) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["入れた瞬間のコンデンサは素通り　全体の抵抗 $" + fmt(r1) + " + " + fmt(PR) + " = " + qv(r1 + PR, "O") + "$", "$E = " + fmt(i) + " \\times " + fmt(r1 + PR) + " = " + qv(ok, "V") + "$"], chk: {form: "u54s1inv", p: {i: i, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s1inv：条件に合う数字が見つからない");
}
// 54-2 瞬間のコイルと合成 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s2_par(a, b){ return a * b / (a + b); }
function tbU54s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s2_Qjust(r){
  var gcd = tbU54s2_gcd, ratio = tbU54s2_ratio, par = tbU54s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var I = (e / (r1 + r2));
    if (!(r1 != r2 && nice(I) && I >= 0.5 && nice(e / r1) && nice(e / r2))) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s2_three4(ok, [{x: (e / r2), why: "$R_1$ を足さず、$R_2$ だけで割った", w: 0, cut: 1}, {x: ((r1 + r2) / e), why: "合成抵抗を電源の電圧で割った（割る順が逆）", w: 1, cut: 0}, {x: (e / r1), why: "コイルを素通りと読んだ（それは十分に時間がたった後）", w: 2, cut: 0}, {x: (e * (r1 + r2) / (r1 * r2)), why: "$R_1$ と $R_2$ を並列とした", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s2just", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ とコイルを並列につなぎます。コイルの電流は初め $0\\,\\mathrm{A}$ です。スイッチを入れた瞬間の電流 $I$ は何 A ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s2lr", L: tbU54s2_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["入れた瞬間のコイルは、無限大の抵抗のようで電流が流れない　電流は $R_1$ と $R_2$ を通る", "$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u54s2just", p: {e: e, r1: r1, r2: r2}}};
  }
  throw new Error("u54s2just：条件に合う数字が見つからない");
}
function tbU54s2_Qfin(r){
  var gcd = tbU54s2_gcd, ratio = tbU54s2_ratio, par = tbU54s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var I = (e / r1);
    if (!(r1 != r2 && nice(I) && I >= 0.5 && nice(e / r2) && nice(e / (r1 + r2)))) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s2_three4(ok, [{x: (e / r2), why: "$R_1$ でなく $R_2$ で割った（$R_2$ には電流が流れない）", w: 0, cut: 1}, {x: (r1 / e), why: "割る順が逆", w: 1, cut: 0}, {x: (e / (r1 + r2)), why: "コイルを無限大の抵抗と読んだ（それはスイッチを入れた瞬間）", w: 2, cut: 0}, {x: (e * (r1 + r2) / (r1 * r2)), why: "$R_1$ と $R_2$ を並列とした", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s2fin", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ とコイルを並列につなぎます。スイッチを入れて十分に時間がたった後の電流 $I$ は何 A ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s2lr", L: tbU54s2_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["十分に時間がたつと、コイルは 0 Ω の素通り　$R_2$ には電流が流れない", "$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + "} = " + qv(ok, "A") + "$"], chk: {form: "u54s2fin", p: {e: e, r1: r1, r2: r2}}};
  }
  throw new Error("u54s2fin：条件に合う数字が見つからない");
}
function tbU54s2_Qv2(r){
  var gcd = tbU54s2_gcd, ratio = tbU54s2_ratio, par = tbU54s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var I = (e / (r1 + r2));
    var V2 = (e * r2 / (r1 + r2));
    var V1 = (e * r1 / (r1 + r2));
    if (!(r1 != r2 && nice(I) && nice(V2) && V2 >= 1)) continue;
    var ok = (V2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s2_three4(ok, [{x: (e), why: "電源の電圧がそのままかかるとした（$R_1$ にも電圧がかかる）", w: 0, cut: 1}, {x: (I), why: "電流を出したところで止めた（$R_2$ を掛けていない）", w: 1, cut: 1}, {x: (V1), why: "$R_1$ の電圧を出した", w: 2, cut: 0}, {x: (e * r2 / r1), why: "電流を $R_1$ だけで出した（コイルを素通りと読んだ）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s2v2", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ とコイルを並列につなぎます。コイルの電流は初め $0\\,\\mathrm{A}$ です。スイッチを入れた瞬間に、$R_2$ にかかる電圧 $V_2$ は何 V ですか。", fig: {kind: "u54s2lr", L: tbU54s2_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["入れた瞬間のコイルには電流が流れない　$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(I, "A") + "$", "$V_2 = " + fmt(r2) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u54s2v2", p: {e: e, r1: r1, r2: r2}}};
  }
  throw new Error("u54s2v2：条件に合う数字が見つからない");
}
function tbU54s2_Qbai(r){
  var gcd = tbU54s2_gcd, ratio = tbU54s2_ratio, par = tbU54s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var A = ((r1 + r2) / r1);
    if (!(r1 != r2 && nice(A) && nice(r1 / (r1 + r2)) && nice(r2 / r1))) continue;
    var ok = (A);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s2_three4(ok, [{x: (r1 / (r1 + r2)), why: "瞬間の電流を、十分に時間がたった後の電流で割った（比が逆）", w: 0, cut: 1}, {x: (r2 / r1), why: "十分に時間がたった後の電流だけ $R_2$ で読んだ", w: 1, cut: 1}, {x: ((r1 + r2) / r2), why: "十分に時間がたった後の電流を $R_2$ で出した（$R_2$ には電流が流れない）", w: 2, cut: 1}, {x: (1), why: "瞬間も十分に時間がたった後も、電流は同じとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s2bai", text: "図のように、電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ とコイルを並列につなぎます。スイッチを入れて十分に時間がたった後の電流 $I$ は、スイッチを入れた瞬間の電流の何倍ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s2lr", L: tbU54s2_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","l":"{L}","i":"{I}"}, [["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["瞬間はコイルに流れない　$\\dfrac{E}{" + fmt(r1) + " + " + fmt(r2) + "}$、十分に時間がたつとコイルは素通り　$\\dfrac{E}{" + fmt(r1) + "}$", "$\\dfrac{E}{" + fmt(r1) + "} \\div \\dfrac{E}{" + fmt(r1 + r2) + "} = " + qv(ok, "X") + "$"], chk: {form: "u54s2bai", p: {r1: r1, r2: r2}}};
  }
  throw new Error("u54s2bai：条件に合う数字が見つからない");
}
// 54-3 定常のコイル・コンデンサと並列 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s3_par(a, b){ return a * b / (a + b); }
function tbU54s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s3_Qtot(r){
  var gcd = tbU54s3_gcd, ratio = tbU54s3_ratio, par = tbU54s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r3 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var I2 = (e / r2);
    var I3 = (e / r3);
    var I = (e / r2 + e / r3);
    var I1 = (e / r1);
    if (!(r2 != r3 && r1 != r2 && r1 != r3 && nice(I2) && nice(I3) && nice(I1) && I <= 40)) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s3_three4(ok, [{x: (I3), why: "$R_3$ の道だけを出した（コイルの道の電流を足していない）", w: 0, cut: 1}, {x: (I2), why: "コイルの道だけを出した（$R_3$ の道の電流を足していない）", w: 1, cut: 1}, {x: (I + I1), why: "コンデンサの道にも電流が流れるとした（十分に時間がたつと流れない）", w: 2, cut: 0}, {x: (e / (r2 + r3)), why: "2つの道を直列のように足した", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s3tot", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に「コンデンサと $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ の直列」「コイルと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」の3つの道を並列につなぎます。スイッチを入れて十分に時間がたった後に、電源を流れる電流 $I$ は何 A ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s3p3", L: tbU54s3_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサの道は流れない・コイルは素通り　$\\dfrac{" + fmt(e) + "}{" + fmt(r2) + "} = " + qv(I2, "A") + "$、$\\dfrac{" + fmt(e) + "}{" + fmt(r3) + "} = " + qv(I3, "A") + "$", "$I = " + fmt(I2) + " + " + fmt(I3) + " = " + qv(ok, "A") + "$"], chk: {form: "u54s3tot", p: {e: e, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s3tot：条件に合う数字が見つからない");
}
function tbU54s3_Qsym(r){
  var gcd = tbU54s3_gcd, ratio = tbU54s3_ratio, par = tbU54s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{E (R_2 + R_3)}{R_2 R_3}$", v: "own"}, {t: "$\\dfrac{E}{R_3}$", v: "r3", why: "$R_3$ の道だけ（コイルの道は素通りで、$R_2$ にも電流が流れる）"}, {t: "$\\dfrac{E}{R_1} + \\dfrac{E}{R_2} + \\dfrac{E}{R_3}$", v: "all", why: "十分に時間がたつと、コンデンサの道には電流が流れない"}, {t: "$\\dfrac{E}{R_2 + R_3}$", v: "ser", why: "$R_2$ の道と $R_3$ の道は並列（直列のように足さない）"}]);
    return {form: "u54s3sym", text: "図の回路で、スイッチを入れて十分に時間がたった後に電源を流れる電流 $I$ を表す式はどれですか。電源の電圧を $E$ とし、コイルの抵抗は無いものとします。", fig: {kind: "u54s3p3", L: tbU54s3_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","l":"{L}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサの道は流れない・コイルは素通り　$I = \\dfrac{E}{R_2} + \\dfrac{E}{R_3}$", "$\\dfrac{E (R_2 + R_3)}{R_2 R_3}$"], chk: {form: "u54s3sym", p: {}}};
  }
  throw new Error("u54s3sym：条件に合う数字が見つからない");
}
function tbU54s3_Qbr(r){
  var gcd = tbU54s3_gcd, ratio = tbU54s3_ratio, par = tbU54s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,18,20,24,30,36,40,48,50,60,100]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r3 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var I2 = (e / r2);
    var I3 = (e / r3);
    var I1 = (e / r1);
    var I = (e / r2 + e / r3);
    if (!(r2 != r3 && r1 != r2 && r1 != r3 && nice(I2) && nice(I3) && nice(I1) && nice(e / (r1 + r2)))) continue;
    var ok = (I2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s3_three4(ok, [{x: (I), why: "電源の電流を出した（コイルの道だけを聞いている）", w: 0, cut: 1}, {x: (I3), why: "$R_3$ の道の電流を出した", w: 1, cut: 1}, {x: (e / (r1 + r2)), why: "コンデンサの $R_1$ も同じ道とした（コンデンサの道は別の道で、電流が流れない）", w: 2, cut: 1}, {x: (0), why: "コイルを無限大の抵抗と読んだ（それはスイッチを入れた瞬間）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s3br", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に「コンデンサと $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ の直列」「コイルと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」の3つの道を並列につなぎます。スイッチを入れて十分に時間がたった後に、コイルの道を流れる電流は何 A ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s3p3", L: tbU54s3_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["十分に時間がたつと、コイルは 0 Ω の素通り　コイルの道は $R_2$ だけ", "コイルの道の電流 $\\dfrac{" + fmt(e) + "}{" + fmt(r2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u54s3br", p: {e: e, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s3br：条件に合う数字が見つからない");
}
function tbU54s3_Qinv(r){
  var gcd = tbU54s3_gcd, ratio = tbU54s3_ratio, par = tbU54s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var i = pick(r, [1,2,3,4,5,6,8,10]);
    var r1 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r2 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var r3 = pick(r, [2,3,4,5,6,8,10,12,15,20,30]);
    var PR = (r2 * r3 / (r2 + r3));
    var E = (i * r2 * r3 / (r2 + r3));
    if (!(r2 != r3 && r1 != r2 && r1 != r3 && nice(PR) && E == Math.round(E) && E >= 2 && nice(i * r3) && nice(i * r2) && nice(i * par(par(r1, r2), r3)))) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s3_three4(ok, [{x: (i * r3), why: "$R_3$ の道だけに電流が流れるとした（コイルの道にも流れる）", w: 0, cut: 1}, {x: (i * r2), why: "コイルの道だけに電流が流れるとした（$R_3$ の道にも流れる）", w: 1, cut: 1}, {x: (i * par(par(r1, r2), r3)), why: "コンデンサの道にも電流が流れるとした（十分に時間がたつと流れない）", w: 2, cut: 0}, {x: (i * (r2 + r3)), why: "2つの道を直列のように足した", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s3inv", text: "図のように、電源に「コンデンサと $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ の直列」「コイルと $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ の直列」「$" + fmt(r3) + "\\,\\Omega$ の抵抗 $R_3$」の3つの道を並列につなぎます。スイッチを入れて十分に時間がたった後に、電源を流れる電流 $I$ は $" + fmt(i) + "\\,\\mathrm{A}$ でした。電源の電圧 $E$ は何 V ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s3p3", L: tbU54s3_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","l":"{L}","i":"{I}"}, [["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["r3", "{R}_3=" + fmt(r3) + " Ω"], ["i", "{I}=" + fmt(i) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサの道は流れない・コイルは素通り　電流が流れる道の合成抵抗 $\\dfrac{" + fmt(r2) + " \\times " + fmt(r3) + "}{" + fmt(r2) + " + " + fmt(r3) + "} = " + qv(PR, "O") + "$", "$E = " + fmt(i) + " \\times " + fmt(PR) + " = " + qv(ok, "V") + "$"], chk: {form: "u54s3inv", p: {i: i, r1: r1, r2: r2, r3: r3}}};
  }
  throw new Error("u54s3inv：条件に合う数字が見つからない");
}
// 54-4 定常の電流から磁気エネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s4_par(a, b){ return a * b / (a + b); }
function tbU54s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s4_Qw(r){
  var gcd = tbU54s4_gcd, ratio = tbU54s4_ratio, par = tbU54s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,20,24,30,40,50,60,100]);
    var rr = pick(r, [2,4,5,6,8,10,20]);
    var lm = pick(r, [10,20,40,50,100,200,400,500]);
    var I = (e / rr);
    var W = (lm * I * I / 2000);
    if (!(nice(I) && I >= 1 && nice(W) && W >= 0.01 && e != rr)) continue;
    var ok = (W);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s4_three4(ok, [{x: (lm * e * e / 2000), why: "電流を出さずに、電源の電圧を $I$ に入れた", w: 0, cut: 1}, {x: (I), why: "電流を出したところで止めた（エネルギーの式に入れていない）", w: 1, cut: 1}, {x: (lm * I / 2000), why: "電流を2乗していない", w: 2, cut: 0}, {x: (lm * I * I / 2), why: "mH を H に直していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s4w", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(rr) + "\\,\\Omega$ の抵抗と $" + fmt(lm) + "\\,\\mathrm{mH}$ のコイルを直列につなぎ、スイッチを入れて十分に時間がたちました。コイルに蓄えられるエネルギーは何 J ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s4rl", L: tbU54s4_fig({"src":"{E}","r":"{R}","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r", "{R}=" + fmt(rr) + " Ω"], ["l", "{L}=" + fmt(lm) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常状態ではコイルは 0 Ω の素通り　$I = \\dfrac{" + fmt(e) + "}{" + fmt(rr) + "} = " + qv(I, "A") + "$", "$W = \\dfrac{1}{2} \\times " + fmt(lm / 1000) + " \\times " + fmt(I) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u54s4w", p: {e: e, rr: rr, lm: lm}}};
  }
  throw new Error("u54s4w：条件に合う数字が見つからない");
}
function tbU54s4_Qbai(r){
  var gcd = tbU54s4_gcd, ratio = tbU54s4_ratio, par = tbU54s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,3,4]);
    var m = pick(r, [2,3,4,5]);
    var A = (n * n * m);
    if (!(n != m)) continue;
    var ok = (A);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s4_three4(ok, [{x: (m), why: "電圧を変えても定常の電流は変わらないとした（電流も " + fmt(n) + " 倍になる）", w: 0, cut: 1}, {x: (n * n), why: "インダクタンスを " + fmt(m) + " 倍したことを入れていない", w: 1, cut: 1}, {x: (n * m), why: "電流を2乗していない（電流が " + fmt(n) + " 倍ならエネルギーは " + fmt(n * n) + " 倍）", w: 2, cut: 0}, {x: (n * n * m / 2), why: "比を出す時に $\\dfrac{1}{2}$ を掛けた（比では消える）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s4bai", text: "図の回路で、十分に時間がたった後にコイルに蓄えられるエネルギーを $W$ とします。電源の電圧を $" + fmt(n) + "$ 倍にし、コイルのインダクタンスを $" + fmt(m) + "$ 倍にすると、十分に時間がたった後のエネルギーは $W$ の何倍ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s4rl", L: tbU54s4_fig({"src":"{E}","r":"{R}","l":"{L}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常の電流 $I = \\dfrac{E}{R}$ は、電圧と同じ " + fmt(n) + " 倍", "$W = \\dfrac{1}{2} L I^2$ は $" + fmt(m) + " \\times " + fmt(n) + "^2 = " + qv(ok, "X") + "$"], chk: {form: "u54s4bai", p: {n: n, m: m}}};
  }
  throw new Error("u54s4bai：条件に合う数字が見つからない");
}
function tbU54s4_Qinv(r){
  var gcd = tbU54s4_gcd, ratio = tbU54s4_ratio, par = tbU54s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,20,24,30,40,50,60,100]);
    var rr = pick(r, [2,4,5,6,8,10,20]);
    var lm = pick(r, [10,20,40,50,100,200,400,500]);
    var I = (e / rr);
    var W = (lm * I * I / 2000);
    if (!(nice(I) && I >= 2 && nice(W) && W >= 0.01 && e != rr)) continue;
    var ok = (lm);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s4_three4(ok, [{x: (2000 * W / (e * e)), why: "電流を出さずに、電源の電圧で割った", w: 0, cut: 1}, {x: (I), why: "電流を出したところで止めた", w: 1, cut: 1}, {x: (2000 * W / I), why: "電流の2乗で割っていない", w: 2, cut: 0}, {x: (1000 * W / (I * I)), why: "$\\dfrac{1}{2}$ を戻していない（2倍していない）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{mH}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s4inv", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(rr) + "\\,\\Omega$ の抵抗とコイルを直列につなぎ、スイッチを入れて十分に時間がたちました。コイルに蓄えられるエネルギーは $" + qv(W, "J") + "$ でした。コイルのインダクタンスは何 mH ですか。ただし、コイルの抵抗は無いものとします。", fig: {kind: "u54s4rl", L: tbU54s4_fig({"src":"{E}","r":"{R}","l":"{L}","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r", "{R}=" + fmt(rr) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常状態ではコイルは 0 Ω の素通り　$I = \\dfrac{" + fmt(e) + "}{" + fmt(rr) + "} = " + qv(I, "A") + "$", "$L = \\dfrac{2W}{I^2} = \\dfrac{2 \\times " + fmt(W) + "}{" + fmt(I) + "^2} = " + fmt(lm / 1000) + "\\,\\mathrm{H} = " + fmt(ok) + "\\,\\mathrm{mH}" + "$"], chk: {form: "u54s4inv", p: {e: e, rr: rr, lm: lm}}};
  }
  throw new Error("u54s4inv：条件に合う数字が見つからない");
}
// 54-5 定常の電圧から静電エネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s5_par(a, b){ return a * b / (a + b); }
function tbU54s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s5_threen(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s5_three4n(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s5_Qw(r){
  var gcd = tbU54s5_gcd, ratio = tbU54s5_ratio, par = tbU54s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,20,24,30,40,50,60,100]);
    var r1 = pick(r, [2,4,5,6,8,10,20,30,40]);
    var r2 = pick(r, [2,4,5,6,8,10,20,30,40]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var VC = (e * r2 / (r1 + r2));
    var V1 = (e * r1 / (r1 + r2));
    var W = (cu * VC * VC / 2000000);
    if (!(r1 != r2 && nice(VC) && VC == Math.round(VC) && nice(W) && W >= 0.001)) continue;
    var ok = (W);
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s5_three4n(ok, [{x: (0), why: "電流が流れないので電圧も 0 とした（コンデンサには $R_2$ の電圧がかかる）", w: 0, cut: 1}, {x: (cu * e * e / 2000000), why: "分圧せず、電源の電圧を入れた", w: 1, cut: 1}, {x: (VC), why: "コンデンサの電圧を出したところで止めた", w: 2, cut: 1}, {x: (cu * V1 * V1 / 2000000), why: "$R_1$ の電圧を入れた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s5w", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ と $" + fmt(cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。定常状態で、コンデンサに蓄えられるエネルギーは何 J ですか。", fig: {kind: "u54s5rc", L: tbU54s5_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{V}_C","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"], ["c", "{C}=" + fmt(cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常状態ではコンデンサに電流が流れない　$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(r2) + "}$、$V_C = " + fmt(r2) + " I = " + qv(VC, "V") + "$", "$W = \\dfrac{1}{2} \\times " + fmt(cu) + " \\times 10^{-6} \\times " + fmt(VC) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u54s5w", p: {e: e, r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s5w：条件に合う数字が見つからない");
}
function tbU54s5_Qvc(r){
  var gcd = tbU54s5_gcd, ratio = tbU54s5_ratio, par = tbU54s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,20,24,30,40,50,60,100]);
    var r1 = pick(r, [2,4,5,6,8,10,20,30,40]);
    var r2 = pick(r, [2,4,5,6,8,10,20,30,40]);
    var VC = (e * r2 / (r1 + r2));
    var V1 = (e * r1 / (r1 + r2));
    var I = (e / (r1 + r2));
    if (!(r1 != r2 && nice(VC) && nice(I) && nice(e * r2 / r1))) continue;
    var ok = (VC);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s5_three4(ok, [{x: (e), why: "分圧せず、電源の電圧とした", w: 0, cut: 1}, {x: (I), why: "電流を出したところで止めた（$R_2$ を掛けていない）", w: 1, cut: 1}, {x: (e * r2 / r1), why: "電流を $R_1$ だけで出した（$R_2$ にも電流が流れる）", w: 2, cut: 1}, {x: (V1), why: "$R_1$ の電圧を出した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s5vc", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ とコンデンサを並列につなぎます。定常状態で、コンデンサの電圧は何 V ですか。", fig: {kind: "u54s5rc", L: tbU54s5_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{V}_C","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常状態ではコンデンサに電流が流れない　$I = \\dfrac{" + fmt(e) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(I, "A") + "$", "$V_C = " + fmt(r2) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u54s5vc", p: {e: e, r1: r1, r2: r2}}};
  }
  throw new Error("u54s5vc：条件に合う数字が見つからない");
}
function tbU54s5_Qinv(r){
  var gcd = tbU54s5_gcd, ratio = tbU54s5_ratio, par = tbU54s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,20,24,30,40,50,60,100]);
    var r1 = pick(r, [2,4,5,6,8,10,20,30,40]);
    var r2 = pick(r, [2,4,5,6,8,10,20,30,40]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var VC = (e * r2 / (r1 + r2));
    var V1 = (e * r1 / (r1 + r2));
    var W = (cu * VC * VC / 2000000);
    if (!(r1 != r2 && nice(VC) && VC == Math.round(VC) && nice(W) && W >= 0.001)) continue;
    var ok = (cu);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s5_three4(ok, [{x: (2000000 * W / (e * e)), why: "分圧せず、電源の電圧で割った", w: 0, cut: 1}, {x: (VC), why: "コンデンサの電圧を出したところで止めた", w: 1, cut: 1}, {x: (cu / 2), why: "$\\dfrac{1}{2}$ を戻していない（2倍していない）", w: 2, cut: 0}, {x: (2000000 * W / (V1 * V1)), why: "$R_1$ の電圧で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s5inv", text: "図のように、$" + fmt(e) + "\\,\\mathrm{V}$ の電源に $" + fmt(r1) + "\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $" + fmt(r2) + "\\,\\Omega$ の抵抗 $R_2$ とコンデンサを並列につなぎます。定常状態で、コンデンサに蓄えられるエネルギーは $" + qv(W, "J") + "$ でした。コンデンサの静電容量は何 μF ですか。", fig: {kind: "u54s5rc", L: tbU54s5_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{V}_C","i":"{I}"}, [["src", "{E}=" + fmt(e) + " V"], ["r1", "{R}_1=" + fmt(r1) + " Ω"], ["r2", "{R}_2=" + fmt(r2) + " Ω"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["定常状態ではコンデンサに電流が流れない　$V_C = " + fmt(e) + " \\times \\dfrac{" + fmt(r2) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(VC, "V") + "$", "$C = \\dfrac{2 W}{V_C^2} = \\dfrac{2 \\times " + fmt(W) + "}{" + fmt(VC) + "^2} = " + qv(ok, "uF") + "$"], chk: {form: "u54s5inv", p: {e: e, r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s5inv：条件に合う数字が見つからない");
}
// 54-6 放電で抵抗が使うエネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s6_par(a, b){ return a * b / (a + b); }
function tbU54s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s6_threen(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s6_three4n(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s6_Qw(r){
  var gcd = tbU54s6_gcd, ratio = tbU54s6_ratio, par = tbU54s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var vk = pick(r, [1,2,3,4,5]);
    var rk = pick(r, [1,2,5,10]);
    var W = (cu * vk * vk / 2);
    if (!(nice(W) && W >= 1 && W <= 2000 && cu * rk != 1000)) continue;
    var ok = (W);
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s6_three4n(ok, [{x: (0), why: "最後は電流が 0 になるので 0 とした（初めの静電エネルギーが全部、抵抗で使われる）", w: 0, cut: 1}, {x: (vk * vk * 1000 / rk), why: "抵抗の電力 $\\dfrac{V^2}{R}$ を出した（初めの静電エネルギーを使う）", w: 1, cut: 1}, {x: (cu * vk * vk), why: "$\\dfrac{1}{2}$ を掛けていない", w: 2, cut: 0}, {x: (cu * vk / 2000), why: "電圧を2乗していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s6w", text: "図のように、$" + fmt(vk) + "\\,\\mathrm{kV}$ に充電した $" + fmt(cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを $" + fmt(rk) + "\\,\\mathrm{k}\\Omega$ の抵抗につなぎ、スイッチを入れて放電させました。十分に時間がたつまでに、抵抗で消費されるエネルギーは何 J ですか。", fig: {kind: "u54s6dc", L: tbU54s6_fig({"c":"{C}","pp":"top","vc":"{V}","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall"}, [["c", "{C}=" + fmt(cu) + " μF"], ["vc", "{V}=" + fmt(vk) + " kV"], ["r", "{R}=" + fmt(rk) + " kΩ"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流が 0 になるまでに、初めの静電エネルギーが全部、抵抗で使われる", "$W = \\dfrac{1}{2} \\times " + fmt(cu) + " \\times 10^{-6} \\times " + fmt(vk * 1000) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u54s6w", p: {cu: cu, vk: vk, rk: rk}}};
  }
  throw new Error("u54s6w：条件に合う数字が見つからない");
}
function tbU54s6_Qbai(r){
  var gcd = tbU54s6_gcd, ratio = tbU54s6_ratio, par = tbU54s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [2,3,4]);
    var n = pick(r, [2,4,5]);
    var A = (m * m);
    if (!(m != n)) continue;
    var ok = (A);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s6_three4(ok, [{x: (m * m / n), why: "抵抗を " + fmt(n) + " 倍にした分で割った（抵抗の値には関係しない）", w: 0, cut: 1}, {x: (m * m * n), why: "抵抗を " + fmt(n) + " 倍にした分を掛けた（抵抗の値には関係しない）", w: 1, cut: 1}, {x: (m), why: "電圧を2乗していない", w: 2, cut: 0}, {x: (m * n), why: "電圧を2乗せず、抵抗の " + fmt(n) + " 倍も掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s6bai", text: "図の回路で、十分に時間がたつまでに抵抗で消費されるエネルギーを $W$ とします。充電する電圧を $" + fmt(m) + "$ 倍にし、抵抗を $" + fmt(n) + "$ 倍にすると、抵抗で消費されるエネルギーは $W$ の何倍ですか。", fig: {kind: "u54s6dc", L: tbU54s6_fig({"c":"{C}","pp":"top","vc":"{V}","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗で使われるのは初めの静電エネルギー $\\dfrac{1}{2} C V^2$ で、抵抗の値には関係しない", "電圧が " + fmt(m) + " 倍なので $" + fmt(m) + "^2 = " + qv(ok, "X") + "$"], chk: {form: "u54s6bai", p: {m: m, n: n}}};
  }
  throw new Error("u54s6bai：条件に合う数字が見つからない");
}
function tbU54s6_Qinv(r){
  var gcd = tbU54s6_gcd, ratio = tbU54s6_ratio, par = tbU54s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var vk = pick(r, [1,2,3,4,5]);
    var W = (cu * vk * vk / 2);
    if (!(nice(W) && W >= 1 && W <= 2000)) continue;
    var ok = (cu);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s6_three4(ok, [{x: (2 * cu), why: "抵抗で使われるのは初めのエネルギーの半分とした（全部が抵抗で使われる）", w: 0, cut: 1}, {x: (cu * 1000000), why: "キロを直していない（$" + fmt(vk) + "\\,\\mathrm{kV} = " + fmt(vk * 1000) + "\\,\\mathrm{V}$）", w: 1, cut: 1}, {x: (cu / 2), why: "$\\dfrac{1}{2}$ を戻していない（2倍していない）", w: 2, cut: 0}, {x: (cu * vk * 1000), why: "電圧を2乗していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s6inv", text: "図のように、$" + fmt(vk) + "\\,\\mathrm{kV}$ に充電したコンデンサを抵抗につなぎ、スイッチを入れて放電させました。十分に時間がたつまでに、抵抗で消費されたエネルギーは $" + qv(W, "J") + "$ でした。コンデンサの静電容量は何 μF ですか。", fig: {kind: "u54s6dc", L: tbU54s6_fig({"c":"{C}","pp":"top","vc":"{V}","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall"}, [["vc", "{V}=" + fmt(vk) + " kV"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["抵抗で使われたエネルギーは、初めの静電エネルギーと同じ　$\\dfrac{1}{2} C V^2 = " + qv(W, "J") + "$", "$C = \\dfrac{2 \\times " + fmt(W) + "}{" + fmt(vk * 1000) + "^2} = " + fmt(cu) + " \\times 10^{-6}\\,\\mathrm{F} = " + qv(ok, "uF") + "$"], chk: {form: "u54s6inv", p: {cu: cu, vk: vk}}};
  }
  throw new Error("u54s6inv：条件に合う数字が見つからない");
}
// 54-7 内部抵抗を足して時定数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s7_par(a, b){ return a * b / (a + b); }
function tbU54s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s7_Qtau(r){
  var gcd = tbU54s7_gcd, ratio = tbU54s7_ratio, par = tbU54s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ri = pick(r, [0.5,1,2,4,5,10]);
    var rr = pick(r, [1,2,3,4,5,6,8,10,15,20,40]);
    var cu = pick(r, [10,20,40,50,100,200,500,1000]);
    var T = ((ri + rr) * cu / 1000);
    if (!(ri < rr && nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s7_three4(ok, [{x: (rr * cu / 1000), why: "内部抵抗を足していない（$R$ だけで計算した）", w: 0, cut: 1}, {x: (T * 1000), why: "μs の値を ms とした", w: 1, cut: 0}, {x: (ri * cu / 1000), why: "内部抵抗だけで計算した（$R$ を足していない）", w: 2, cut: 1}, {x: (ri * rr / (ri + rr) * cu / 1000), why: "$r$ と $R$ を並列として合成した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s7tau", text: "図のように、内部抵抗 $r = " + qv(ri, "O") + "$ の電池に、$R = " + qv(rr, "O") + "$ の抵抗と $C = " + fmt(cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につないで充電します。時定数は何 ms ですか。", fig: {kind: "u54s7ir", L: tbU54s7_fig({"src":"{E}","ri":"{r}","r":"{R}","c":"{C}"}, [["ri", "{r}=" + qf(ri, "O")], ["r", "{R}=" + qf(rr, "O")], ["c", "{C}=" + fmt(cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$r$ も直列なので、合成抵抗 $r + R = " + fmt(ri) + " + " + fmt(rr) + " = " + qv(ri + rr, "O") + "$　この値を次に使う", "$\\tau = " + fmt(ri + rr) + " \\times " + fmt(cu) + " \\times 10^{-6} = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s} = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s7tau", p: {ri: ri, rr: rr, cu: cu}}};
  }
  throw new Error("u54s7tau：条件に合う数字が見つからない");
}
function tbU54s7_Qcinv(r){
  var gcd = tbU54s7_gcd, ratio = tbU54s7_ratio, par = tbU54s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ri = pick(r, [0.5,1,2,4,5,10]);
    var rr = pick(r, [1,2,3,4,5,6,8,10,15,20,40]);
    var cu = pick(r, [10,20,40,50,100,200,500,1000]);
    var T = ((ri + rr) * cu / 1000);
    if (!(ri < rr && nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (cu);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s7_three4(ok, [{x: (T * 1000 / rr), why: "内部抵抗を足していない（$R$ だけで割った）", w: 0, cut: 1}, {x: (T / (ri + rr)), why: "ms を μs に直していない", w: 1, cut: 0}, {x: (T * 1000 / ri), why: "内部抵抗だけで割った（$R$ を足していない）", w: 2, cut: 1}, {x: (T * 1000 * (ri + rr)), why: "合成抵抗で割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s7cinv", text: "図のように、内部抵抗 $r = " + qv(ri, "O") + "$ の電池に、$R = " + qv(rr, "O") + "$ の抵抗とコンデンサを直列につないで充電します。時定数は $" + fmt(T) + "\\,\\mathrm{ms}" + "$ でした。コンデンサの静電容量は何 μF ですか。", fig: {kind: "u54s7ir", L: tbU54s7_fig({"src":"{E}","ri":"{r}","r":"{R}","c":"{C}"}, [["ri", "{r}=" + qf(ri, "O")], ["r", "{R}=" + qf(rr, "O")], ["c", "{C}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["合成抵抗 $r + R = " + qv(ri + rr, "O") + "$、$" + fmt(T) + "\\,\\mathrm{ms}" + " = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s}$　この値を次に使う", "$C = \\dfrac{\\tau}{r + R} = \\dfrac{" + fmt(T * 1000) + "}{" + fmt(ri + rr) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u54s7cinv", p: {ri: ri, rr: rr, cu: cu}}};
  }
  throw new Error("u54s7cinv：条件に合う数字が見つからない");
}
function tbU54s7_Qsec(r){
  var gcd = tbU54s7_gcd, ratio = tbU54s7_ratio, par = tbU54s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ri = pick(r, [0.1,0.2,0.5,1,2]);
    var cf = pick(r, [0.5,1,2,4,5,10]);
    var e = pick(r, [10,20,50,100]);
    var S = (ri * cf);
    if (!(nice(S) && S >= 0.1)) continue;
    var ok = (S);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s7_three4(ok, [{x: (cf / ri), why: "静電容量を内部抵抗で割った（時定数は掛ける）", w: 0, cut: 0}, {x: (e * cf), why: "抵抗の所に起電力を入れた（時定数の抵抗は内部抵抗）", w: 1, cut: 1}, {x: (e / ri * cf), why: "抵抗の所に電流 $\\dfrac{E}{r}$ を入れた（時定数の抵抗は内部抵抗）", w: 2, cut: 1}, {x: (ri / cf), why: "内部抵抗を静電容量で割った（時定数は掛ける）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{s}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s7sec", text: "静電容量 $" + fmt(cf) + "\\,\\mathrm{F}$ で、初めに電荷の無いコンデンサがあります。起電力 $" + qv(e, "V") + "$、内部抵抗 $" + qv(ri, "O") + "$ の電源をつないで充電します。時定数は何 s ですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["電源の中の内部抵抗が、コンデンサと直列の抵抗になる　この値を次に使う", "$\\tau = rC = " + fmt(ri) + " \\times " + fmt(cf) + " = " + fmt(ok) + "\\,\\mathrm{s}" + "$"], chk: {form: "u54s7sec", p: {ri: ri, cf: cf, e: e}}};
  }
  throw new Error("u54s7sec：条件に合う数字が見つからない");
}
// 54-8 切り換えた後の閉回路で時定数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s8.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s8_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s8_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s8_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s8_par(a, b){ return a * b / (a + b); }
function tbU54s8_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s8_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s8_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s8_Qtau(r){
  var gcd = tbU54s8_gcd, ratio = tbU54s8_ratio, par = tbU54s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var r1 = pick(r, [100,200,300,400,500,1000]);
    var r2 = pick(r, [10,20,25,40,50,100,200]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var T = (r2 * cu / 1000);
    if (!(r1 > r2 && nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s8_three4(ok, [{x: ((r1 + r2) * cu / 1000), why: "閉回路を読まず、$R_1$ も足した", w: 0, cut: 1}, {x: (T * 1000), why: "μs の値を ms とした", w: 1, cut: 0}, {x: (r1 * cu / 1000), why: "① の側の $R_1$ で計算した（切り換えた後の閉回路を読んでいない）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s8tau", text: "図の回路で、スイッチ S を ① に入れてコンデンサを十分に充電した後、S を ② に切り換えました。$R_1 = " + qv(r1, "O") + "$、$R_2 = " + qv(r2, "O") + "$、$C = " + fmt(cu) + "\\,\\mu\\mathrm{F}$ です。切り換えた後の時定数は何 ms ですか。", fig: {kind: "u54s8sm", L: tbU54s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":"S","n1":"①","n2":"②"}, [["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c", "{C}=" + fmt(cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["② の閉回路は $R_2$ と $C$ だけ（$E$・$R_1$ は外）　$R_2 = " + qv(r2, "O") + "$ を次に使う", "$\\tau = R_2 C = " + fmt(r2) + " \\times " + fmt(cu) + " \\times 10^{-6} = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s} = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s8tau", p: {r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s8tau：条件に合う数字が見つからない");
}
function tbU54s8_Qneed(r){
  var gcd = tbU54s8_gcd, ratio = tbU54s8_ratio, par = tbU54s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [6,10,12,20,24,50,100]);
    var r1 = pick(r, [100,200,300,400,500,1000]);
    var r2 = pick(r, [10,20,25,40,50,100,200]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var T = (r2 * cu / 1000);
    if (!(r1 > r2 && nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s8_three4(ok, [{x: (r1 * cu / 1000), why: "① の側の $R_1$ で計算した（切り換えた後の閉回路を読んでいない）", w: 0, cut: 1}, {x: ((r1 + r2) * cu / 1000), why: "閉回路を読まず、$R_1$ も足した", w: 1, cut: 1}, {x: (T * 1000), why: "μs の値を ms とした", w: 2, cut: 0}, {x: (T / 1000), why: "ms に直す時、1000 を掛けるところを割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s8need", text: "図の回路で、スイッチ S を ① に入れて十分に時間がたった後、S を ② に切り換えました。$E = " + qv(e, "V") + "$、$R_1 = " + qv(r1, "O") + "$、$R_2 = " + qv(r2, "O") + "$、$C = " + fmt(cu) + "\\,\\mu\\mathrm{F}$ です。S・$R_2$・$C$ の閉回路の時定数は何 ms ですか。", fig: {kind: "u54s8sm", L: tbU54s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":"S","n1":"①","n2":"②"}, [["src", "{E}=" + qf(e, "V")], ["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c", "{C}=" + fmt(cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["時定数に使うのは閉回路の中の $R_2$ と $C$ だけ（$E$・$R_1$ は使わない）　この2つを次に使う", "$\\tau = " + fmt(r2) + " \\times " + fmt(cu) + " \\times 10^{-6} = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s} = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s8need", p: {r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s8need：条件に合う数字が見つからない");
}
function tbU54s8_Qcinv(r){
  var gcd = tbU54s8_gcd, ratio = tbU54s8_ratio, par = tbU54s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var r1 = pick(r, [100,200,300,400,500,1000]);
    var r2 = pick(r, [10,20,25,40,50,100,200]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var T = (r2 * cu / 1000);
    if (!(r1 > r2 && nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (cu);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s8_three4(ok, [{x: (T * 1000 / (r1 + r2)), why: "閉回路を読まず、$R_1$ も足して割った", w: 0, cut: 1}, {x: (T / r2), why: "ms を μs に直していない", w: 1, cut: 0}, {x: (T * 1000 / r1), why: "① の側の $R_1$ で割った（切り換えた後の閉回路を読んでいない）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s8cinv", text: "図の回路で、スイッチ S を ① に入れてコンデンサを十分に充電した後、S を ② に切り換えました。$R_1 = " + qv(r1, "O") + "$、$R_2 = " + qv(r2, "O") + "$ で、切り換えた後の時定数は $" + fmt(T) + "\\,\\mathrm{ms}" + "$ でした。コンデンサの静電容量は何 μF ですか。", fig: {kind: "u54s8sm", L: tbU54s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":"S","n1":"①","n2":"②"}, [["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c", "{C}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["② の閉回路の抵抗は $R_2 = " + qv(r2, "O") + "$、$" + fmt(T) + "\\,\\mathrm{ms}" + " = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s}$　この2つを次に使う", "$C = \\dfrac{\\tau}{R_2} = \\dfrac{" + fmt(T * 1000) + "}{" + fmt(r2) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u54s8cinv", p: {r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s8cinv：条件に合う数字が見つからない");
}
// 54-9 合成した R と C で時定数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s9.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s9_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s9_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s9_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s9_par(a, b){ return a * b / (a + b); }
function tbU54s9_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s9_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s9_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s9_Qpp(r){
  var gcd = tbU54s9_gcd, ratio = tbU54s9_ratio, par = tbU54s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [0,1,2,3,4,5,6,7,8,9]);
    var c1 = pick(r, [10,20,40,50,100,200]);
    var c2 = pick(r, [10,20,40,50,100,200]);
    var r1 = ([4, 6, 12, 10, 20, 12, 30, 20, 40, 60][rk]);
    var r2 = ([4, 3, 4, 10, 20, 6, 6, 5, 10, 30][rk]);
    var RR = (r1 * r2 / (r1 + r2));
    var T = (RR * (c1 + c2) / 1000);
    if (!(nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s9_three4(ok, [{x: (r1 * (c1 + c2) / 1000), why: "抵抗をまとめていない（$R_1$ のまま）", w: 0, cut: 1}, {x: (RR * c1 / 1000), why: "コンデンサをまとめていない（$C_1$ のまま）", w: 1, cut: 1}, {x: (RR * c1 * c2 / (c1 + c2) / 1000), why: "コンデンサの並列を、抵抗の並列と同じ式（和分の積）でまとめた", w: 2, cut: 0}, {x: ((r1 + r2) * (c1 + c2) / 1000), why: "抵抗の並列を、直列の式（和）でまとめた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s9pp", text: "図のように、$R_1 = " + qv(r1, "O") + "$ と $R_2 = " + qv(r2, "O") + "$ の並列と、$C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ の並列を直列につないで充電します。時定数は何 ms ですか。", fig: {kind: "u54s9pc", L: tbU54s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c1":"{C}_1","c2":"{C}_2","rp":"{R}","cp":"{C}"}, [["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R = \\dfrac{" + fmt(r1) + " \\times " + fmt(r2) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(RR, "O") + "$、$C = " + fmt(c1) + " + " + fmt(c2) + " = " + fmt(c1 + c2) + "\\,\\mu\\mathrm{F}$　この2つを次に使う", "$\\tau = " + fmt(RR) + " \\times " + fmt(c1 + c2) + " \\times 10^{-6} = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s} = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s9pp", p: {r1: r1, r2: r2, c1: c1, c2: c2}}};
  }
  throw new Error("u54s9pp：条件に合う数字が見つからない");
}
function tbU54s9_Qser(r){
  var gcd = tbU54s9_gcd, ratio = tbU54s9_ratio, par = tbU54s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rr = pick(r, [10,20,40,50,100,200]);
    var c1 = pick(r, [10,20,40,50,100,200]);
    var c2 = pick(r, [10,20,40,50,100,200]);
    var CC = (c1 * c2 / (c1 + c2));
    var T = (rr * CC / 1000);
    if (!(nice(CC) && nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s9_three4(ok, [{x: (rr * c1 / 1000), why: "コンデンサをまとめていない（$C_1$ のまま）", w: 0, cut: 1}, {x: (rr * (c1 + c2) / 1000), why: "コンデンサの直列を、抵抗の直列と同じ式（和）でまとめた", w: 1, cut: 0}, {x: (rr * c2 / 1000), why: "コンデンサをまとめていない（$C_2$ のまま）", w: 2, cut: 1}, {x: (T * 1000), why: "μs で止めた（ms に直していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s9ser", text: "図のように、$R = " + qv(rr, "O") + "$ の抵抗と、$C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につないで充電します。時定数は何 ms ですか。", fig: {kind: "u54s9sc", L: tbU54s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c1":"{C}_1","c2":"{C}_2","rp":"{R}","cp":"{C}"}, [["r1", "{R}=" + qf(rr, "O")], ["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"], ["r2", null], ["rp", null], ["cp", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサの直列は和分の積　$C = \\dfrac{" + fmt(c1) + " \\times " + fmt(c2) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + qv(CC, "uF") + "$　この値を次に使う", "$\\tau = " + fmt(rr) + " \\times " + fmt(CC) + " \\times 10^{-6} = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s} = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s9ser", p: {rr: rr, c1: c1, c2: c2}}};
  }
  throw new Error("u54s9ser：条件に合う数字が見つからない");
}
function tbU54s9_Qrt(r){
  var gcd = tbU54s9_gcd, ratio = tbU54s9_ratio, par = tbU54s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,4]);
    var m = pick(r, [2,3,4]);
    if (!(n != m)) continue;
    var ok = (m / n);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s9_three4(ok, [{x: (1 / n), why: "コンデンサをまとめていない（抵抗だけまとめた）", w: 0, cut: 1}, {x: (m), why: "抵抗をまとめていない（コンデンサだけまとめた）", w: 1, cut: 1}, {x: (n * m), why: "抵抗の並列を、直列の式（和）でまとめた", w: 2, cut: 0}, {x: (1 / (n * m)), why: "コンデンサの並列を、抵抗の並列と同じ式でまとめた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s9rt", text: "回路 A は、抵抗 $R$ とコンデンサ $C$ を直列につないだ回路です。回路 B は、同じ $R$ を $" + fmt(n) + "$ 個並列にしたものと、同じ $C$ を $" + fmt(m) + "$ 個並列にしたものを直列につないだ回路です。B の時定数は、A の時定数の何倍ですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["B：抵抗は $\\dfrac{R}{" + fmt(n) + "}$、静電容量は $" + fmt(m) + "C$　この2つを次に使う", "$\\tau_B = \\dfrac{R}{" + fmt(n) + "} \\times " + fmt(m) + "C$ なので、$\\dfrac{" + fmt(m) + "}{" + fmt(n) + "} = " + qv(ok, "X") + "$"], chk: {form: "u54s9rt", p: {n: n, m: m}}};
  }
  throw new Error("u54s9rt：条件に合う数字が見つからない");
}
// 54-10 コンデンサから見た合成抵抗で時定数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s10.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s10_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s10_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s10_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s10_par(a, b){ return a * b / (a + b); }
function tbU54s10_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s10_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s10_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s10_Qtau(r){
  var gcd = tbU54s10_gcd, ratio = tbU54s10_ratio, par = tbU54s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var cu = pick(r, [10,20,40,50,100,200,500,1000]);
    var e = pick(r, [6,10,12,24,30]);
    var r1 = ([6, 12, 4, 10, 12, 30, 20, 40, 60, 20, 6, 4][rk]);
    var r2 = ([3, 4, 4, 10, 6, 6, 5, 10, 30, 20, 12, 12][rk]);
    var RR = (r1 * r2 / (r1 + r2));
    var T = (RR * cu / 1000);
    if (!(nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s10_three4(ok, [{x: (r1 * cu / 1000), why: "$R_1$ だけで計算した（$R_2$ との合成をしていない）", w: 0, cut: 1}, {x: ((r1 + r2) * cu / 1000), why: "$R_1$ と $R_2$ を直列として足した（電源を短絡すると並列）", w: 1, cut: 0}, {x: (r2 * cu / 1000), why: "$R_2$ だけで計算した（$R_1$ との合成をしていない）", w: 2, cut: 1}, {x: (T * 1000), why: "μs の値を ms とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s10tau", text: "図のように、$" + qv(e, "V") + "$ の電源に $R_1 = " + qv(r1, "O") + "$ の抵抗とスイッチを直列につなぎ、その先に $R_2 = " + qv(r2, "O") + "$ の抵抗と $C = " + fmt(cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。時定数は何 ms ですか。", fig: {kind: "u54s10th", L: tbU54s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":""}, [["src", "{E}=" + qf(e, "V")], ["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c", "{C}=" + fmt(cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源を短絡し、コンデンサから見ると並列　$R = \\dfrac{" + fmt(r1) + " \\times " + fmt(r2) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(RR, "O") + "$　この値を次に使う", "$\\tau = " + fmt(RR) + " \\times " + fmt(cu) + " \\times 10^{-6} = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s} = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s10tau", p: {r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s10tau：条件に合う数字が見つからない");
}
function tbU54s10_Qcinv(r){
  var gcd = tbU54s10_gcd, ratio = tbU54s10_ratio, par = tbU54s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var cu = pick(r, [10,20,40,50,100,200,500,1000]);
    var e = pick(r, [6,10,12,24,30]);
    var r1 = ([6, 12, 4, 10, 12, 30, 20, 40, 60, 20, 6, 4][rk]);
    var r2 = ([3, 4, 4, 10, 6, 6, 5, 10, 30, 20, 12, 12][rk]);
    var RR = (r1 * r2 / (r1 + r2));
    var T = (RR * cu / 1000);
    if (!(nice(T) && T >= 0.1 && T <= 100)) continue;
    var ok = (cu);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s10_three4(ok, [{x: (T * 1000 / r1), why: "$R_1$ だけで割った（$R_2$ との合成をしていない）", w: 0, cut: 1}, {x: (T * 1000 / (r1 + r2)), why: "$R_1$ と $R_2$ を直列として足した（電源を短絡すると並列）", w: 1, cut: 0}, {x: (T * 1000 / r2), why: "$R_2$ だけで割った（$R_1$ との合成をしていない）", w: 2, cut: 1}, {x: (T / RR), why: "ms を μs に直していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s10cinv", text: "図のように、$" + qv(e, "V") + "$ の電源に $R_1 = " + qv(r1, "O") + "$ の抵抗とスイッチを直列につなぎ、その先に $R_2 = " + qv(r2, "O") + "$ の抵抗とコンデンサを並列につなぎます。時定数は $" + fmt(T) + "\\,\\mathrm{ms}" + "$ でした。コンデンサの静電容量は何 μF ですか。", fig: {kind: "u54s10th", L: tbU54s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":""}, [["src", "{E}=" + qf(e, "V")], ["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c", "{C}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサから見た合成抵抗 $R = " + qv(RR, "O") + "$、$" + fmt(T) + "\\,\\mathrm{ms}" + " = " + fmt(T * 1000) + "\\,\\mu\\mathrm{s}$　この2つを次に使う", "$C = \\dfrac{\\tau}{R} = \\dfrac{" + fmt(T * 1000) + "}{" + fmt(RR) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u54s10cinv", p: {r1: r1, r2: r2, cu: cu}}};
  }
  throw new Error("u54s10cinv：条件に合う数字が見つからない");
}
function tbU54s10_Qrth(r){
  var gcd = tbU54s10_gcd, ratio = tbU54s10_ratio, par = tbU54s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var e = pick(r, [6,10,12,24,30]);
    var r1 = ([6, 12, 4, 10, 12, 30, 20, 40, 60, 20, 6, 4][rk]);
    var r2 = ([3, 4, 4, 10, 6, 6, 5, 10, 30, 20, 12, 12][rk]);
    if (!(r1 != r2)) continue;
    var ok = (r1 * r2 / (r1 + r2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s10_three4(ok, [{x: (r1), why: "$R_1$ だけを見た（$R_2$ との合成をしていない）", w: 0, cut: 1}, {x: (r1 + r2), why: "$R_1$ と $R_2$ を直列として足した（電源を短絡すると並列）", w: 1, cut: 0}, {x: (r2), why: "$R_2$ だけを見た（$R_1$ との合成をしていない）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s10rth", text: "図のように、$" + qv(e, "V") + "$ の電源に $R_1 = " + qv(r1, "O") + "$ の抵抗とスイッチを直列につなぎ、その先に $R_2 = " + qv(r2, "O") + "$ の抵抗とコンデンサを並列につなぎます。時定数を出す時に使う、コンデンサから見た合成抵抗は何 Ω ですか。", fig: {kind: "u54s10th", L: tbU54s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":""}, [["src", "{E}=" + qf(e, "V")], ["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源を短絡すると、コンデンサから見て $R_1$ と $R_2$ は並列", "$R = \\dfrac{" + fmt(r1) + " \\times " + fmt(r2) + "}{" + fmt(r1) + " + " + fmt(r2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u54s10rth", p: {r1: r1, r2: r2}}};
  }
  throw new Error("u54s10rth：条件に合う数字が見つからない");
}
function tbU54s10_Qsec(r){
  var gcd = tbU54s10_gcd, ratio = tbU54s10_ratio, par = tbU54s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var cf = pick(r, [0.5,1,2]);
    var e = pick(r, [6,10,12,24,30]);
    var r1 = ([6, 12, 4, 10, 12, 30, 20, 40, 60, 20, 6, 4][rk]);
    var r2 = ([3, 4, 4, 10, 6, 6, 5, 10, 30, 20, 12, 12][rk]);
    var S = (r1 * r2 / (r1 + r2) * cf);
    if (!(nice(S) && S <= 50)) continue;
    var ok = (S);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s10_three4(ok, [{x: (r1 * cf), why: "$R_1$ だけで計算した（$R_2$ との合成をしていない）", w: 0, cut: 1}, {x: ((r1 + r2) * cf), why: "$R_1$ と $R_2$ を直列として足した（電源を短絡すると並列）", w: 1, cut: 0}, {x: (r2 * cf), why: "$R_2$ だけで計算した（$R_1$ との合成をしていない）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{s}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s10sec", text: "図のように、$" + qv(e, "V") + "$ の電源に $R_1 = " + qv(r1, "O") + "$ の抵抗とスイッチを直列につなぎ、その先に $R_2 = " + qv(r2, "O") + "$ の抵抗と $C = " + fmt(cf) + "\\,\\mathrm{F}$ のコンデンサを並列につなぎます。時定数は何 s ですか。", fig: {kind: "u54s10th", L: tbU54s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":""}, [["src", "{E}=" + qf(e, "V")], ["r1", "{R}_1=" + qf(r1, "O")], ["r2", "{R}_2=" + qf(r2, "O")], ["c", "{C}=" + fmt(cf) + " F"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサから見た合成抵抗 $R = \\dfrac{" + fmt(r1) + " \\times " + fmt(r2) + "}{" + fmt(r1) + " + " + fmt(r2) + "}$　この値を次に使う", "$\\tau = RC = " + fmt(ok) + "\\,\\mathrm{s}" + "$"], chk: {form: "u54s10sec", p: {r1: r1, r2: r2, cf: cf}}};
  }
  throw new Error("u54s10sec：条件に合う数字が見つからない");
}
// 54-11 文の正誤（過渡現象） の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s11.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s11_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s11_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s11_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s11_par(a, b){ return a * b / (a + b); }
function tbU54s11_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s11_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s11_Qwrong(r){
  var gcd = tbU54s11_gcd, ratio = tbU54s11_ratio, par = tbU54s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var t1 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11,12,13]);
    var t2 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11,12,13]);
    var t3 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11,12,13]);
    var SF = (["抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、静電容量の値に関係する", "抵抗とコイルの直列回路の時定数は、インダクタンスに反比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に反比例する", "定常状態のコイルの両端の電圧は、電源の電圧に等しい", "定常状態では、コンデンサに電源の電圧を抵抗で割った電流が流れ続ける", "スイッチを入れた瞬間、コイルには電源の電圧を抵抗で割った電流が流れる", "時定数だけたつと、放電の電流は初めの値の 0.632 倍になる", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は電源の電圧から下がって 0 に近づく", "抵抗とコイルの直列回路でスイッチを入れると、コイルの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの－の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の逆数の和の逆数である", "電線の抵抗は、長さに反比例し、断面積に比例する"][f]);
    var WF = (["入れた瞬間のコンデンサは導線と同じで、電流は $\\dfrac{E}{R}$。静電容量に関係しない（26-4）", "$\\tau = \\dfrac{L}{R}$ で、インダクタンスに比例する（26-3）", "$\\tau = RC$ で、抵抗に比例する（26-5）", "定常のコイルは導線と同じで、両端の電圧は 0（26-2・26-7）", "電位差がなくなると流れない（26-4）", "入れた瞬間のコイルは電流を通さない（26-2）", "63.2% だけ減るので、残りは 0.368 倍（26-3・26-6）", "コンデンサの電圧は 0 から上がる。下がるのは抵抗の電圧（26-7）", "コイルの電圧は電源の電圧から下がって 0 に近づく（26-7）", "＋の極板から流れ出す（26-6）", "並列は和。逆数の和の逆数は直列（17-5）", "長さに比例し、断面積に反比例する（6-3）"][f]);
    var S1 = (["抵抗とコイルの直列回路の時定数は、インダクタンスに比例する", "抵抗とコイルの直列回路の時定数は、抵抗に反比例する", "抵抗とコンデンサの直列回路の時定数は、静電容量に比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に比例する", "定常状態のコイルの両端の電圧は 0 である", "定常状態では、コンデンサに電流は流れない", "スイッチを入れた瞬間、コイルに電流は流れない", "抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、電源の電圧を抵抗で割った値である", "時定数だけたつと、放電の電流は初めの値の 0.368 倍になる", "抵抗とコイルの直列回路でスイッチを入れると、抵抗の電圧は 0 から上がって電源の電圧に近づく", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの＋の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の和である", "電線の抵抗は、長さに比例し、断面積に反比例する"][t1]);
    var S2 = (["抵抗とコイルの直列回路の時定数は、インダクタンスに比例する", "抵抗とコイルの直列回路の時定数は、抵抗に反比例する", "抵抗とコンデンサの直列回路の時定数は、静電容量に比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に比例する", "定常状態のコイルの両端の電圧は 0 である", "定常状態では、コンデンサに電流は流れない", "スイッチを入れた瞬間、コイルに電流は流れない", "抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、電源の電圧を抵抗で割った値である", "時定数だけたつと、放電の電流は初めの値の 0.368 倍になる", "抵抗とコイルの直列回路でスイッチを入れると、抵抗の電圧は 0 から上がって電源の電圧に近づく", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの＋の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の和である", "電線の抵抗は、長さに比例し、断面積に反比例する"][t2]);
    var S3 = (["抵抗とコイルの直列回路の時定数は、インダクタンスに比例する", "抵抗とコイルの直列回路の時定数は、抵抗に反比例する", "抵抗とコンデンサの直列回路の時定数は、静電容量に比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に比例する", "定常状態のコイルの両端の電圧は 0 である", "定常状態では、コンデンサに電流は流れない", "スイッチを入れた瞬間、コイルに電流は流れない", "抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、電源の電圧を抵抗で割った値である", "時定数だけたつと、放電の電流は初めの値の 0.368 倍になる", "抵抗とコイルの直列回路でスイッチを入れると、抵抗の電圧は 0 から上がって電源の電圧に近づく", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの＋の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の和である", "電線の抵抗は、長さに比例し、断面積に反比例する"][t3]);
    var W1 = (["正しい文（26-3）", "正しい文（26-3）", "正しい文（26-5）", "正しい文（26-5）", "正しい文（26-2・26-7）", "正しい文（26-4）", "正しい文（26-2）", "正しい文（26-4）", "正しい文（26-3・26-6）", "正しい文（26-7）", "正しい文（26-7）", "正しい文（26-6）", "正しい文（17-5）", "正しい文（6-3）"][t1]);
    var W2 = (["正しい文（26-3）", "正しい文（26-3）", "正しい文（26-5）", "正しい文（26-5）", "正しい文（26-2・26-7）", "正しい文（26-4）", "正しい文（26-2）", "正しい文（26-4）", "正しい文（26-3・26-6）", "正しい文（26-7）", "正しい文（26-7）", "正しい文（26-6）", "正しい文（17-5）", "正しい文（6-3）"][t2]);
    var W3 = (["正しい文（26-3）", "正しい文（26-3）", "正しい文（26-5）", "正しい文（26-5）", "正しい文（26-2・26-7）", "正しい文（26-4）", "正しい文（26-2）", "正しい文（26-4）", "正しい文（26-3・26-6）", "正しい文（26-7）", "正しい文（26-7）", "正しい文（26-6）", "正しい文（17-5）", "正しい文（6-3）"][t3]);
    if (!(t1 < t2 && t2 < t3)) continue;
    var _c = choices(r, [{t: String(SF), v: "f" + fmt(f)}, {t: String(S1), v: "t" + fmt(t1), why: String(W1)}, {t: String(S2), v: "t" + fmt(t2), why: String(W2)}, {t: String(S3), v: "t" + fmt(t3), why: String(W3)}]);
    return {form: "u54s11wrong", text: "次のうち、誤っているものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["文を1つずつ、習った式・グラフと照らす", "誤り：" + String(WF)], chk: {form: "u54s11wrong", p: {f: f, t1: t1, t2: t2, t3: t3}}};
  }
  throw new Error("u54s11wrong：条件に合う数字が見つからない");
}
function tbU54s11_Qright(r){
  var gcd = tbU54s11_gcd, ratio = tbU54s11_ratio, par = tbU54s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11,12,13]);
    var f1 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var f2 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var f3 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var ST = (["抵抗とコイルの直列回路の時定数は、インダクタンスに比例する", "抵抗とコイルの直列回路の時定数は、抵抗に反比例する", "抵抗とコンデンサの直列回路の時定数は、静電容量に比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に比例する", "定常状態のコイルの両端の電圧は 0 である", "定常状態では、コンデンサに電流は流れない", "スイッチを入れた瞬間、コイルに電流は流れない", "抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、電源の電圧を抵抗で割った値である", "時定数だけたつと、放電の電流は初めの値の 0.368 倍になる", "抵抗とコイルの直列回路でスイッチを入れると、抵抗の電圧は 0 から上がって電源の電圧に近づく", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの＋の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の和である", "電線の抵抗は、長さに比例し、断面積に反比例する"][t]);
    var WT = (["正しい文（26-3）", "正しい文（26-3）", "正しい文（26-5）", "正しい文（26-5）", "正しい文（26-2・26-7）", "正しい文（26-4）", "正しい文（26-2）", "正しい文（26-4）", "正しい文（26-3・26-6）", "正しい文（26-7）", "正しい文（26-7）", "正しい文（26-6）", "正しい文（17-5）", "正しい文（6-3）"][t]);
    var F1 = (["抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、静電容量の値に関係する", "抵抗とコイルの直列回路の時定数は、インダクタンスに反比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に反比例する", "定常状態のコイルの両端の電圧は、電源の電圧に等しい", "定常状態では、コンデンサに電源の電圧を抵抗で割った電流が流れ続ける", "スイッチを入れた瞬間、コイルには電源の電圧を抵抗で割った電流が流れる", "時定数だけたつと、放電の電流は初めの値の 0.632 倍になる", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は電源の電圧から下がって 0 に近づく", "抵抗とコイルの直列回路でスイッチを入れると、コイルの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの－の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の逆数の和の逆数である", "電線の抵抗は、長さに反比例し、断面積に比例する"][f1]);
    var F2 = (["抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、静電容量の値に関係する", "抵抗とコイルの直列回路の時定数は、インダクタンスに反比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に反比例する", "定常状態のコイルの両端の電圧は、電源の電圧に等しい", "定常状態では、コンデンサに電源の電圧を抵抗で割った電流が流れ続ける", "スイッチを入れた瞬間、コイルには電源の電圧を抵抗で割った電流が流れる", "時定数だけたつと、放電の電流は初めの値の 0.632 倍になる", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は電源の電圧から下がって 0 に近づく", "抵抗とコイルの直列回路でスイッチを入れると、コイルの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの－の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の逆数の和の逆数である", "電線の抵抗は、長さに反比例し、断面積に比例する"][f2]);
    var F3 = (["抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、静電容量の値に関係する", "抵抗とコイルの直列回路の時定数は、インダクタンスに反比例する", "抵抗とコンデンサの直列回路の時定数は、抵抗に反比例する", "定常状態のコイルの両端の電圧は、電源の電圧に等しい", "定常状態では、コンデンサに電源の電圧を抵抗で割った電流が流れ続ける", "スイッチを入れた瞬間、コイルには電源の電圧を抵抗で割った電流が流れる", "時定数だけたつと、放電の電流は初めの値の 0.632 倍になる", "抵抗とコンデンサの直列回路でスイッチを入れると、コンデンサの電圧は電源の電圧から下がって 0 に近づく", "抵抗とコイルの直列回路でスイッチを入れると、コイルの電圧は 0 から上がって電源の電圧に近づく", "放電の電流は、コンデンサの－の極板から流れ出す", "並列につないだ2つのコンデンサの合成静電容量は、2つの静電容量の逆数の和の逆数である", "電線の抵抗は、長さに反比例し、断面積に比例する"][f3]);
    var X1 = (["入れた瞬間のコンデンサは導線と同じで、電流は $\\dfrac{E}{R}$。静電容量に関係しない（26-4）", "$\\tau = \\dfrac{L}{R}$ で、インダクタンスに比例する（26-3）", "$\\tau = RC$ で、抵抗に比例する（26-5）", "定常のコイルは導線と同じで、両端の電圧は 0（26-2・26-7）", "電位差がなくなると流れない（26-4）", "入れた瞬間のコイルは電流を通さない（26-2）", "63.2% だけ減るので、残りは 0.368 倍（26-3・26-6）", "コンデンサの電圧は 0 から上がる。下がるのは抵抗の電圧（26-7）", "コイルの電圧は電源の電圧から下がって 0 に近づく（26-7）", "＋の極板から流れ出す（26-6）", "並列は和。逆数の和の逆数は直列（17-5）", "長さに比例し、断面積に反比例する（6-3）"][f1]);
    var X2 = (["入れた瞬間のコンデンサは導線と同じで、電流は $\\dfrac{E}{R}$。静電容量に関係しない（26-4）", "$\\tau = \\dfrac{L}{R}$ で、インダクタンスに比例する（26-3）", "$\\tau = RC$ で、抵抗に比例する（26-5）", "定常のコイルは導線と同じで、両端の電圧は 0（26-2・26-7）", "電位差がなくなると流れない（26-4）", "入れた瞬間のコイルは電流を通さない（26-2）", "63.2% だけ減るので、残りは 0.368 倍（26-3・26-6）", "コンデンサの電圧は 0 から上がる。下がるのは抵抗の電圧（26-7）", "コイルの電圧は電源の電圧から下がって 0 に近づく（26-7）", "＋の極板から流れ出す（26-6）", "並列は和。逆数の和の逆数は直列（17-5）", "長さに比例し、断面積に反比例する（6-3）"][f2]);
    var X3 = (["入れた瞬間のコンデンサは導線と同じで、電流は $\\dfrac{E}{R}$。静電容量に関係しない（26-4）", "$\\tau = \\dfrac{L}{R}$ で、インダクタンスに比例する（26-3）", "$\\tau = RC$ で、抵抗に比例する（26-5）", "定常のコイルは導線と同じで、両端の電圧は 0（26-2・26-7）", "電位差がなくなると流れない（26-4）", "入れた瞬間のコイルは電流を通さない（26-2）", "63.2% だけ減るので、残りは 0.368 倍（26-3・26-6）", "コンデンサの電圧は 0 から上がる。下がるのは抵抗の電圧（26-7）", "コイルの電圧は電源の電圧から下がって 0 に近づく（26-7）", "＋の極板から流れ出す（26-6）", "並列は和。逆数の和の逆数は直列（17-5）", "長さに比例し、断面積に反比例する（6-3）"][f3]);
    if (!(f1 < f2 && f2 < f3)) continue;
    var _c = choices(r, [{t: String(ST), v: "t" + fmt(t)}, {t: String(F1), v: "f" + fmt(f1), why: String(X1)}, {t: String(F2), v: "f" + fmt(f2), why: String(X2)}, {t: String(F3), v: "f" + fmt(f3), why: String(X3)}]);
    return {form: "u54s11right", text: "次のうち、正しいものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["文を1つずつ、習った式・グラフと照らす", String(WT)], chk: {form: "u54s11right", p: {t: t, f1: f1, f2: f2, f3: f3}}};
  }
  throw new Error("u54s11right：条件に合う数字が見つからない");
}
function tbU54s11_Qblank(r){
  var gcd = tbU54s11_gcd, ratio = tbU54s11_ratio, par = tbU54s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1,2,3]);
    var QT = (["抵抗とコイルの直列回路でスイッチを入れました。時間がたつにつれて、次の量はどうなりますか。\n(ア) 回路の電流　(イ) 抵抗の電圧　(ウ) コイルの電圧", "抵抗とコンデンサの直列回路でスイッチを入れました。時間がたつにつれて、次の量はどうなりますか。\n(ア) 回路の電流　(イ) 抵抗の電圧　(ウ) コンデンサの電圧", "次の文の □ に入る式の組はどれですか。\n(ア) 抵抗とコイルの直列回路の時定数は □ である。\n(イ) 抵抗とコンデンサの直列回路の時定数は □ である。", "次の文の □ に入る語の組はどれですか。\n(ア) スイッチを入れた瞬間、充電されていないコンデンサは □ と同じに見る。\n(イ) 十分に時間がたつと、コイルは □ と同じに見る。"][k]);
    var C = (["(ア) 増える　(イ) 増える　(ウ) 減る", "(ア) 減る　(イ) 減る　(ウ) 増える", "(ア) $\\dfrac{L}{R}$　(イ) $RC$", "(ア) 導線　(イ) 導線"][k]);
    var W1 = (["(ア) 減る　(イ) 減る　(ウ) 増える", "(ア) 増える　(イ) 増える　(ウ) 減る", "(ア) $RL$　(イ) $RC$", "(ア) 無限大の抵抗　(イ) 導線"][k]);
    var R1 = (["コイルの回路の電流は 0 から増える。減るのはコンデンサの回路（26-1・26-7）", "それはコイルの回路。コンデンサの回路の電流は初めが最大（26-4・26-7）", "コイルの回路は $\\tau = \\dfrac{L}{R}$。抵抗は分母（26-3）", "入れた瞬間のコンデンサは 0 Ω の素通り（26-4）"][k]);
    var W2 = (["(ア) 増える　(イ) 減る　(ウ) 増える", "(ア) 減る　(イ) 増える　(ウ) 減る", "(ア) $\\dfrac{L}{R}$　(イ) $\\dfrac{R}{C}$", "(ア) 導線　(イ) 無限大の抵抗"][k]);
    var R2 = (["抵抗の電圧は電流と同じ形で増える（26-7）", "抵抗の電圧は電流と同じ形で減る（26-7）", "コンデンサの回路は $\\tau = RC$。静電容量も掛ける（26-5）", "定常のコイルは 0 Ω の素通り。無限大の抵抗は入れた瞬間のコイル（26-2）"][k]);
    var W3 = (["(ア) 増える　(イ) 増える　(ウ) 増える", "(ア) 減る　(イ) 減る　(ウ) 減る", "(ア) $RC$　(イ) $\\dfrac{L}{R}$", "(ア) 無限大の抵抗　(イ) 無限大の抵抗"][k]);
    var R3 = (["抵抗の電圧とコイルの電圧の和は電源の電圧で一定。抵抗の電圧が増えるとコイルの電圧は減る（26-7）", "抵抗の電圧とコンデンサの電圧の和は電源の電圧で一定。抵抗の電圧が減るとコンデンサの電圧は増える（26-7）", "コイルの式とコンデンサの式が逆（26-3・26-5）", "瞬間のコンデンサも定常のコイルも 0 Ω の素通り（26-2・26-4）"][k]);
    var _c = choices(r, [{t: String(C), v: "ok"}, {t: String(W1), v: "w1", why: String(R1)}, {t: String(W2), v: "w2", why: String(R2)}, {t: String(W3), v: "w3", why: String(R3)}]);
    return {form: "u54s11blank", text: String(QT), fig: null, ch: _c.ch, ans: _c.ans, ex: ["1つずつ、習った式・グラフと照らす", "答え " + String(C)], chk: {form: "u54s11blank", p: {k: k}}};
  }
  throw new Error("u54s11blank：条件に合う数字が見つからない");
}
// 54-12 キロ・マイクロ・ミリを掛ける（時定数） の練習（※ textbook/gen/make_section.py が textbook/gen/data/u54_s12.py から作った。手で直さない（データを直して作り直す）。）
function tbU54s12_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU54s12_ratio(a){ var g = a.reduce(function(x, y){ return tbU54s12_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU54s12_par(a, b){ return a * b / (a + b); }
function tbU54s12_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU54s12_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU54s12_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU54s12_Qkc(r){
  var gcd = tbU54s12_gcd, ratio = tbU54s12_ratio, par = tbU54s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [1,2,4,5,10,20]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var T = (rk * cu);
    if (!(T <= 2000)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s12_three4(ok, [{x: (rk + cu), why: "掛けるところを足した", w: 0, cut: 0}, {x: (T / 1000), why: "キロを掛けていない（" + fmt(rk) + " Ω で計算した）", w: 1, cut: 1}, {x: (T * 1000), why: "Ω × μF の μs で止めた（ms に直していない）", w: 2, cut: 1}, {x: (T * 1000000), why: "マイクロを掛けていない（" + fmt(cu) + " F で計算した）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s12kc", text: "$" + fmt(rk) + "\\,\\mathrm{k\\Omega}$ の抵抗と $" + fmt(cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につないだ回路の時定数は何 ms ですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["$\\tau = RC = " + fmt(rk) + " \\times 10^{3} \\times " + fmt(cu) + " \\times 10^{-6} = " + fmt(T / 1000) + "\\,\\mathrm{s}$　この値を ms に直す", "$\\tau = " + fmt(T / 1000) + " \\times 1000 = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s12kc", p: {rk: rk, cu: cu}}};
  }
  throw new Error("u54s12kc：条件に合う数字が見つからない");
}
function tbU54s12_Qlr(r){
  var gcd = tbU54s12_gcd, ratio = tbU54s12_ratio, par = tbU54s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var lm = pick(r, [10,20,40,50,100,200,400,500]);
    var ro = pick(r, [2,4,5,10,20,25,50,100]);
    var T = (lm / ro);
    if (!(nice(T) && nice(T / 1000) && T >= 0.1)) continue;
    var ok = (T);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s12_three4(ok, [{x: (ro / lm), why: "割る順が逆", w: 0, cut: 0}, {x: (T * 1000), why: "ミリを掛けていない（" + fmt(lm) + " H で計算した）", w: 1, cut: 1}, {x: (T / 1000), why: "s で止めた（ms に直していない）", w: 2, cut: 1}, {x: (lm * ro), why: "割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{ms}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s12lr", text: "$" + fmt(lm) + "\\,\\mathrm{mH}$ のコイルと $" + fmt(ro) + "\\,\\Omega$ の抵抗を直列につないだ回路の時定数は何 ms ですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["$\\tau = \\dfrac{L}{R} = \\dfrac{" + fmt(lm) + " \\times 10^{-3}}{" + fmt(ro) + "} = " + fmt(T / 1000) + "\\,\\mathrm{s}$　この値を ms に直す", "$\\tau = " + fmt(T / 1000) + " \\times 1000 = " + fmt(ok) + "\\,\\mathrm{ms}" + "$"], chk: {form: "u54s12lr", p: {lm: lm, ro: ro}}};
  }
  throw new Error("u54s12lr：条件に合う数字が見つからない");
}
function tbU54s12_Qls(r){
  var gcd = tbU54s12_gcd, ratio = tbU54s12_ratio, par = tbU54s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var tm = pick(r, [1,2,4,5,10,20,40,50]);
    var ro = pick(r, [2,4,5,10,20,25,50,100]);
    var LL = (tm * ro);
    if (!(LL <= 2000 && nice(LL / 1000))) continue;
    var ok = (LL);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s12_three4(ok, [{x: (tm / ro), why: "抵抗を掛けるところを割った", w: 0, cut: 0}, {x: (LL / 1000), why: "H で止めた（mH に直していない）", w: 1, cut: 1}, {x: (LL * 1000), why: "ms を s に直していない（" + fmt(tm) + " s で計算した）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{mH}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s12ls", text: "コイルと $" + fmt(ro) + "\\,\\Omega$ の抵抗を直列につないだ回路の時定数は $" + fmt(tm) + "\\,\\mathrm{ms}" + "$ でした。コイルのインダクタンスは何 mH ですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["$\\tau = \\dfrac{L}{R}$ より $L = \\tau R = " + fmt(tm) + " \\times 10^{-3} \\times " + fmt(ro) + " = " + qv(LL / 1000, "H") + "$　この値を mH に直す", "$L = " + fmt(LL / 1000) + " \\times 1000 = " + fmt(ok) + "\\,\\mathrm{mH}" + "$"], chk: {form: "u54s12ls", p: {tm: tm, ro: ro}}};
  }
  throw new Error("u54s12ls：条件に合う数字が見つからない");
}
function tbU54s12_Qsec(r){
  var gcd = tbU54s12_gcd, ratio = tbU54s12_ratio, par = tbU54s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rk = pick(r, [1,2,4,5,10,20]);
    var cu = pick(r, [10,20,40,50,100,200,500]);
    var T = (rk * cu);
    var S = (rk * cu / 1000);
    if (!(T <= 2000 && nice(S) && S >= 0.01)) continue;
    var ok = (S);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU54s12_three4(ok, [{x: (T), why: "kΩ × μF の ms の値のまま（s に直していない）", w: 0, cut: 1}, {x: ((rk + cu) / 1000), why: "掛けるところを足した", w: 1, cut: 0}, {x: (T * 1000), why: "マイクロを掛けていない（" + fmt(cu) + " F で計算した）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{s}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u54s12sec", text: "$" + fmt(rk) + "\\,\\mathrm{k\\Omega}$ の抵抗と $" + fmt(cu) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につないだ回路の時定数は何 s ですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["$\\tau = " + fmt(rk) + " \\times 10^{3} \\times " + fmt(cu) + " \\times 10^{-6} = " + fmt(T) + " \\times 10^{-3}\\,\\mathrm{s}$", "$\\tau = " + fmt(ok) + "\\,\\mathrm{s}" + "$"], chk: {form: "u54s12sec", p: {rk: rk, cu: cu}}};
  }
  throw new Error("u54s12sec：条件に合う数字が見つからない");
}
var GEN = {
  // 54-1 瞬間のコンデンサと直並列
  1: function(r){ return pick(r, [tbU54s1_Qjust, tbU54s1_Qjust, tbU54s1_Qjust, tbU54s1_Qfin, tbU54s1_Qfin, tbU54s1_Qbun, tbU54s1_Qbun, tbU54s1_Qinv, tbU54s1_Qinv])(r); },
  // 54-2 瞬間のコイルと合成
  2: function(r){ return pick(r, [tbU54s2_Qjust, tbU54s2_Qjust, tbU54s2_Qjust, tbU54s2_Qfin, tbU54s2_Qfin, tbU54s2_Qv2, tbU54s2_Qv2, tbU54s2_Qbai, tbU54s2_Qbai])(r); },
  // 54-3 定常のコイル・コンデンサと並列
  3: function(r){ return pick(r, [tbU54s3_Qtot, tbU54s3_Qtot, tbU54s3_Qtot, tbU54s3_Qsym, tbU54s3_Qsym, tbU54s3_Qbr, tbU54s3_Qbr, tbU54s3_Qinv, tbU54s3_Qinv])(r); },
  // 54-4 定常の電流から磁気エネルギー
  4: function(r){ return pick(r, [tbU54s4_Qw, tbU54s4_Qw, tbU54s4_Qw, tbU54s4_Qbai, tbU54s4_Qbai, tbU54s4_Qinv, tbU54s4_Qinv])(r); },
  // 54-5 定常の電圧から静電エネルギー
  5: function(r){ return pick(r, [tbU54s5_Qw, tbU54s5_Qw, tbU54s5_Qw, tbU54s5_Qvc, tbU54s5_Qvc, tbU54s5_Qinv, tbU54s5_Qinv])(r); },
  // 54-6 放電で抵抗が使うエネルギー
  6: function(r){ return pick(r, [tbU54s6_Qw, tbU54s6_Qw, tbU54s6_Qw, tbU54s6_Qbai, tbU54s6_Qbai, tbU54s6_Qinv, tbU54s6_Qinv])(r); },
  // 54-7 内部抵抗を足して時定数
  7: function(r){ return pick(r, [tbU54s7_Qtau, tbU54s7_Qtau, tbU54s7_Qtau, tbU54s7_Qcinv, tbU54s7_Qcinv, tbU54s7_Qsec])(r); },
  // 54-8 切り換えた後の閉回路で時定数
  8: function(r){ return pick(r, [tbU54s8_Qtau, tbU54s8_Qtau, tbU54s8_Qtau, tbU54s8_Qneed, tbU54s8_Qneed, tbU54s8_Qcinv, tbU54s8_Qcinv])(r); },
  // 54-9 合成した R と C で時定数
  9: function(r){ return pick(r, [tbU54s9_Qpp, tbU54s9_Qpp, tbU54s9_Qpp, tbU54s9_Qser, tbU54s9_Qser, tbU54s9_Qrt, tbU54s9_Qrt])(r); },
  // 54-10 コンデンサから見た合成抵抗で時定数
  10: function(r){ return pick(r, [tbU54s10_Qtau, tbU54s10_Qtau, tbU54s10_Qtau, tbU54s10_Qcinv, tbU54s10_Qcinv, tbU54s10_Qrth, tbU54s10_Qsec])(r); },
  // 54-11 文の正誤（過渡現象）
  11: function(r){ return pick(r, [tbU54s11_Qwrong, tbU54s11_Qwrong, tbU54s11_Qwrong, tbU54s11_Qright, tbU54s11_Qright, tbU54s11_Qblank, tbU54s11_Qblank])(r); },
  // 54-12 キロ・マイクロ・ミリを掛ける（時定数）
  12: function(r){ return pick(r, [tbU54s12_Qkc, tbU54s12_Qkc, tbU54s12_Qkc, tbU54s12_Qlr, tbU54s12_Qlr, tbU54s12_Qls, tbU54s12_Qls, tbU54s12_Qsec])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t54s1e","scene":"t54s1e","kind":"u54s1cr","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","i":"{I}"},"viewbox":"463 204 599 432","band":{"want":"スイッチを入れた瞬間の電流","ans":"コンデンサを素通りと読んで、直並列の合成抵抗で割る","full":"充電されていないコンデンサは、スイッチを入れた瞬間は 0 Ω の素通り。R2 と R3 の並列を R1 に足して全体の抵抗。電源の電圧を全体の抵抗で割る。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"スイッチを入れた瞬間の電流を求めます。\n①瞬間のコンデンサ\n②並列の部分\n③全体の抵抗\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"充電されていないコンデンサは、入れた瞬間は $0\\,\\Omega$ の素通りです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖素通りなので、$R_2$ と $R_3$ の並列〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{R_2 R_3}{R_2 + R_3}"]]}],"emphPre":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"並列の部分を $R_1$ に足して、全体の抵抗で電源の電圧を割ります。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["R1","R2","R3","src","I"],"ans":true}]}],"groups":{"R1":["r1","r1t0","r1t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"src":["c:L","c:S","pp","pm","e0","e1"],"zhi":["u54s1crL","u54s1crw11","u54s1crw12","u54s1crw15","u54s1crw16","u54s1crw13"],"zmid":["u54s1crw2","u54s1crw4","u54s1crw7","u54s1crw9"],"zlo":["u54s1crw3","u54s1crw6","u54s1crw8","u54s1crw10","u54s1crw14","u54s1crw17","u54s1crw18"],"zmid2":["u54s1crw5"]},"moves":{},"route":["瞬間のコンデンサ","並列の部分","全体の抵抗"]}},{"id":"t54s1x","scene":"t54s1x","kind":"u54s1cr","lab":{"src":"{E}=18 V","r1":"{R}_1=6 Ω","r2":"{R}_2=4 Ω","r3":"{R}_3=12 Ω","c":"{C}","i":["{I}","{I}=2 A"]},"viewbox":"463 204 599 432","band":{"want":"スイッチを入れた瞬間の電流 $I$","known":"$E = 18\\,\\mathrm{V},\\;\\; R_1 = 6\\,\\Omega,\\;\\; R_2 = 4\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega$","ans":"$I = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、スイッチを入れた瞬間の電流です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①瞬間のコンデンサ\n②並列の部分\n③全体の抵抗\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"充電されていないコンデンサは、入れた瞬間は $0\\,\\Omega$ の素通りです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_2$ と $R_3$ の並列の部分です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{4 \\times 12}{4 + 12} = 3\\,\\Omega"]]}],"emphPre":["R2","R3"]},{"text":"〖この $3\\,\\Omega$ を、全体の抵抗に使います〗。","at":{"強調":1.0},"after":[],"emph":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"全体の抵抗は $6 + 3 = 9\\,\\Omega$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R1","R2","R3"]},{"text":"電源の電圧を全体の抵抗で割ります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{18}{9} = 2\\,\\mathrm{A}"]]}],"move":"iv","ans":true,"emphPre":["src","I","R1","R2","R3"]}]}],"groups":{"R1":["r1","r1t0","r1t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"src":["c:L","c:S","pp","pm","e0","e1"],"zhi":["u54s1crL","u54s1crw11","u54s1crw12","u54s1crw15","u54s1crw16","u54s1crw13"],"zmid":["u54s1crw2","u54s1crw4","u54s1crw7","u54s1crw9"],"zlo":["u54s1crw3","u54s1crw6","u54s1crw8","u54s1crw10","u54s1crw14","u54s1crw17","u54s1crw18"],"zmid2":["u54s1crw5"]},"moves":{"iv":{"to":{"iv":1},"dur":0.4}},"route":["瞬間のコンデンサ","並列の部分","全体の抵抗"]}},{"id":"t54s2e","scene":"t54s2e","kind":"u54s2lr","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","l":"{L}","i":"{I}"},"viewbox":"319 138 740 503","band":{"want":"スイッチを入れた瞬間の電流","ans":"コイルを無限大の抵抗と読んで、$\\dfrac{E}{R_1 + R_2}$","full":"スイッチを入れた瞬間のコイルは、無限大の抵抗のようで電流が流れない。電流は R1 と R2 を通る。電源の電圧を R1 + R2 で割る。"},"narr":{"start":{"co":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"スイッチを入れた瞬間の電流を求めます。\n①瞬間のコイル\n②合成抵抗\n③電流\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"入れた瞬間のコイルは、無限大の抵抗のようで、電流が流れません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["L"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖コイルの道に流れないので、電流は $R_1$ と $R_2$ を通り〗ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電源の電圧を、$R_1$ と $R_2$ の和で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["src","I","R1","R2"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R_1 + R_2}"]]}],"ans":true,"emphPre":["src","I","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s2lrL","u54s2lrw1","u54s2lrw2"],"zlo":["u54s2lrRw","u54s2lrw4","u54s2lrw6","u54s2lrw8","u54s2lrw10"],"zmid":["u54s2lrw3","u54s2lrw5","u54s2lrw7","u54s2lrw9"]},"moves":{},"route":["瞬間のコイル","合成抵抗","電流"]}},{"id":"t54s2x","scene":"t54s2x","kind":"u54s2lr","lab":{"src":"{E}=30 V","r1":"{R}_1=10 Ω","r2":"{R}_2=5 Ω","l":"{L}","i":["{I}","{I}=2 A"]},"viewbox":"319 138 740 503","band":{"want":"スイッチを入れた瞬間の電流 $I$","known":"$E = 30\\,\\mathrm{V},\\;\\; R_1 = 10\\,\\Omega,\\;\\; R_2 = 5\\,\\Omega$","ans":"$I = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、スイッチを入れた瞬間の電流です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①瞬間のコイル\n②合成抵抗\n③電流\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"入れた瞬間のコイルは、無限大の抵抗のようで、電流が流れません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["L"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電流は $R_1$ と $R_2$ を通ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2"],"eq":[{"cont":false,"items":[["10 + 5 = 15\\,\\Omega"]]}],"emphPre":["R1","R2"]},{"text":"〖この $15\\,\\Omega$ で、電源の電圧を割ります〗。","at":{"強調":1.0},"after":[],"emph":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"オームの法則で求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{30}{15} = 2\\,\\mathrm{A}"]]}],"move":"iv","ans":true,"emphPre":["src","I","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s2lrL","u54s2lrw1","u54s2lrw2"],"zlo":["u54s2lrRw","u54s2lrw4","u54s2lrw6","u54s2lrw8","u54s2lrw10"],"zmid":["u54s2lrw3","u54s2lrw5","u54s2lrw7","u54s2lrw9"]},"moves":{"iv":{"to":{"iv":1},"dur":0.4}},"route":["瞬間のコイル","合成抵抗","電流"]}},{"id":"t54s3e","scene":"t54s3e","kind":"u54s3p3","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","c":"{C}","l":"{L}","i":"{I}"},"viewbox":"314 166 745 476","band":{"want":"十分に時間がたった後に電源を流れる電流","ans":"コンデンサの道は流れない・コイルは素通り　$\\dfrac{E}{R_2} + \\dfrac{E}{R_3}$","full":"十分に時間がたつと、コンデンサには電流が流れず、コイルは 0 Ω の素通り。電流はコイルと R2 の道と、R3 の道を流れる。2つの道の電流を足す。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたった後の、電源の電流を求めます。\n①コンデンサの道\n②コイルの道\n③電流を足す\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたつと、コンデンサには電流が流れません。$R_1$ の道は流れません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C","R1"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"コイルは $0\\,\\Omega$ の素通りです。その道は $R_2$ だけです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["L","R2"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖電流が流れる2つの道の電流を足し〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R2","R3","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R_2} + \\dfrac{E}{R_3}"]]}],"ans":true,"emphPre":["R2","R3","src","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R1":["r1","r1t0","r1t1"],"L":["l","lt0","lt1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s3p3L","u54s3p3w1","u54s3p3w2","u54s3p3w4","u54s3p3w7","u54s3p3w10","u54s3p3w12"],"zlo":["u54s3p3Rw","u54s3p3w3","u54s3p3w6","u54s3p3w9","u54s3p3w11","u54s3p3w13"],"zmid2":["u54s3p3w5"],"zmid":["u54s3p3w8"]},"moves":{},"route":["コンデンサの道","コイルの道","電流を足す"]}},{"id":"t54s3x","scene":"t54s3x","kind":"u54s3p3","lab":{"src":"{E}=12 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=3 Ω","c":"{C}","l":"{L}","i":["{I}","{I}=6 A"]},"viewbox":"314 166 745 476","band":{"want":"十分に時間がたった後に電源を流れる電流 $I$","known":"$E = 12\\,\\mathrm{V},\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 6\\,\\Omega,\\;\\; R_3 = 3\\,\\Omega$","ans":"$I = 6\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、十分に時間がたった後に電源を流れる電流です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①コンデンサの道\n②コイルの道\n③電流を足す\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"コンデンサには電流が流れません。$R_1$ の道は $0\\,\\mathrm{A}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C","R1"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"コイルは素通りなので、その道は $R_2$ だけです。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["L","R2","src"],"eq":[{"cont":false,"items":[["\\dfrac{12}{6} = 2\\,\\mathrm{A}"]]}],"emphPre":["L","R2"]},{"text":"$R_3$ の道です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R3","src"],"eq":[{"cont":false,"items":[["\\dfrac{12}{3} = 4\\,\\mathrm{A}"]]}],"emphPre":["R3"]},{"text":"〖この2つの電流を、次に足します〗。","at":{"強調":1.0},"after":[],"emph":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電流が流れる2つの道の電流を足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["I"],"eq":[{"cont":false,"items":[["I = 2 + 4 = 6\\,\\mathrm{A}"]]}],"move":"iv","ans":true,"emphPre":["R2","R3","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"R1":["r1","r1t0","r1t1"],"L":["l","lt0","lt1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s3p3L","u54s3p3w1","u54s3p3w2","u54s3p3w4","u54s3p3w7","u54s3p3w10","u54s3p3w12"],"zlo":["u54s3p3Rw","u54s3p3w3","u54s3p3w6","u54s3p3w9","u54s3p3w11","u54s3p3w13"],"zmid2":["u54s3p3w5"],"zmid":["u54s3p3w8"]},"moves":{"iv":{"to":{"iv":1},"dur":0.4}},"route":["コンデンサの道","コイルの道","電流を足す"]}},{"id":"t54s4e","scene":"t54s4e","kind":"u54s4rl","lab":{"src":"{E}","r":"{R}","l":"{L}","i":"{I}"},"viewbox":"319 292 740 349","band":{"want":"十分に時間がたった後に、コイルに蓄えられるエネルギー","ans":"定常の電流を出して、$W = \\dfrac{1}{2} L I^2$","full":"十分に時間がたつと定常状態で、コイルは 0 Ω の素通りになる。電流はオームの法則で E/R。その電流を、磁気エネルギーの式に入れる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたった後の、コイルのエネルギーを求めます。\n①定常の電流\n②磁気エネルギー\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["L"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたつと定常状態です。コイルは $0\\,\\Omega$ の素通りになります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["L"]},{"text":"電流は、オームの法則で決まります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R}"]]}],"emphPre":["src","R","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖この電流を、磁気エネルギーの式の $I$ に入れ〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["L","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2"]]}],"ans":true,"emphPre":["L","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s4rlL","u54s4rlw1","u54s4rlw2"],"zlo":["u54s4rlRw","u54s4rlw4"],"zmid":["u54s4rlw3"]},"moves":{},"route":["定常の電流","磁気エネルギー"]}},{"id":"t54s4x","scene":"t54s4x","kind":"u54s4rl","lab":{"src":"{E}=12 V","r":"{R}=4 Ω","l":"{L}=20 mH","i":["{I}","{I}=3 A"]},"viewbox":"319 292 740 349","band":{"want":"コイルに蓄えられるエネルギー $W$","known":"$E = 12\\,\\mathrm{V},\\;\\; R = 4\\,\\Omega,\\;\\; L = 20\\,\\mathrm{mH}$","ans":"$W = 0.09\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、コイルに蓄えられるエネルギーです。","at":{"強調":1.0},"after":[],"emph":["L"]},{"text":"①定常の電流\n②磁気エネルギー\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"十分に時間がたったので定常状態です。コイルは $0\\,\\Omega$ の素通りです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["L"]},{"text":"電流は、オームの法則で求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R}"],["I = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"iv","emphPre":["src","R","I"]},{"text":"〖この $3\\,\\mathrm{A}$ を、次の式の $I$ に使います〗。","at":{"強調":1.0},"after":[],"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$20\\,\\mathrm{mH}$ は $0.02\\,\\mathrm{H}$ です。磁気エネルギーの式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["L","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2"],["W = \\dfrac{1}{2} \\times 0.02 \\times 3^2"],["= 0.09\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["L","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R":["r","rt0","rt1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s4rlL","u54s4rlw1","u54s4rlw2"],"zlo":["u54s4rlRw","u54s4rlw4"],"zmid":["u54s4rlw3"]},"moves":{"iv":{"to":{"iv":1},"dur":0.4}},"route":["定常の電流","磁気エネルギー"]}},{"id":"t54s5e","scene":"t54s5e","kind":"u54s5rc","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","vc":"{V}_C","i":"{I}"},"viewbox":"319 212 740 429","band":{"want":"定常状態でコンデンサに蓄えられるエネルギー","ans":"コンデンサの電圧を分圧で出して、$W = \\dfrac{1}{2} C V_C^2$","full":"定常状態ではコンデンサに電流が流れない。電流は R1 と R2 を通る。コンデンサの電圧は R2 の電圧と同じ。その電圧を、静電エネルギーの式に入れる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"定常状態で、コンデンサに蓄えられるエネルギーを求めます。\n①定常の電流\n②コンデンサの電圧\n③静電エネルギー\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"定常状態では、コンデンサに電流は流れません。電流は $R_1$ と $R_2$ を通ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R_1 + R_2}"]]}],"emphPre":["C","R1","R2","src","I"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"コンデンサの電圧は、並んでいる $R_2$ の電圧と同じです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Vc","R2","I"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖この電圧を、静電エネルギーの式の $V$ に入れ〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V_C^2"]]}],"ans":true,"emphPre":["C","Vc"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"Vc":["vcd:e","vcd:f","vcd:a","vct0","vct1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s5rcL","u54s5rcw1"],"zlo":["u54s5rcRw","u54s5rcw3","u54s5rcw5","u54s5rcw7","u54s5rcw9"],"zmid":["u54s5rcw2","u54s5rcw4","u54s5rcw6","u54s5rcw8"]},"moves":{},"route":["定常の電流","コンデンサの電圧","静電エネルギー"]}},{"id":"t54s5x","scene":"t54s5x","kind":"u54s5rc","lab":{"src":"{E}=30 V","r1":"{R}_1=10 Ω","r2":"{R}_2=20 Ω","c":"{C}=100 μF","vc":["{V}_C","{V}_C=20 V"],"i":["{I}","{I}=1 A"]},"viewbox":"319 212 740 429","band":{"want":"コンデンサに蓄えられるエネルギー $W$","known":"$E = 30\\,\\mathrm{V},\\;\\; R_1 = 10\\,\\Omega,\\;\\; R_2 = 20\\,\\Omega,\\;\\; C = 100\\,\\mu\\mathrm{F}$","ans":"$W = 0.02\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"iv":0,"vcv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、コンデンサに蓄えられるエネルギーです。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"①定常の電流\n②コンデンサの電圧\n③静電エネルギー\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"定常状態なので、コンデンサに電流は流れません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C"]},{"text":"電流は $R_1$ と $R_2$ を通ります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R2","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R_1 + R_2}"],["I = \\dfrac{30}{10 + 20} = 1\\,\\mathrm{A}"]]}],"move":"iv","emphPre":["R1","R2","src","I"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"コンデンサの電圧は、$R_2$ の電圧と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["Vc","R2","I"],"eq":[{"cont":false,"items":[["V_C = R_2 I"],["V_C = 20 \\times 1 = 20\\,\\mathrm{V}"]]}],"move":"vcv","emphPre":["Vc","R2","I"]},{"text":"〖この $20\\,\\mathrm{V}$ を、次の式の $V$ に使います〗。","at":{"強調":1.0},"after":[],"emph":["Vc"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$100\\,\\mu\\mathrm{F}$ は $0.0001\\,\\mathrm{F}$ です。静電エネルギーの式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V_C^2"],["W = \\dfrac{1}{2} \\times 0.0001 \\times 20^2"],["= 0.02\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["C","Vc"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"Vc":["vcd:e","vcd:f","vcd:a","vct0","vct1"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s5rcL","u54s5rcw1"],"zlo":["u54s5rcRw","u54s5rcw3","u54s5rcw5","u54s5rcw7","u54s5rcw9"],"zmid":["u54s5rcw2","u54s5rcw4","u54s5rcw6","u54s5rcw8"]},"moves":{"iv":{"to":{"iv":1},"dur":0.4},"vcv":{"to":{"vcv":1},"dur":0.4}},"route":["定常の電流","コンデンサの電圧","静電エネルギー"]}},{"id":"t54s6e","scene":"t54s6e","kind":"u54s6dis","lab":{"c":"{C}","pp":"top","vc":"{V}","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall"},"viewbox":"-164 132 988 946","band":{"want":"放電で抵抗が使うエネルギー","ans":"初めの静電エネルギー $W = \\dfrac{1}{2} C V^2$","full":"充電したコンデンサには静電エネルギーが蓄えられている。放電して電流が 0 になるまでに、そのエネルギーが全部、抵抗で使われる。"},"narr":{"start":{"co":1,"swc":0,"tt":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"充電したコンデンサを抵抗につないで、放電させます。\n①初めの静電エネルギー\n②抵抗で使われるエネルギー\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C","R"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"コンデンサには、初めに静電エネルギーが蓄えられています。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"]]}],"emphPre":["C","Vc"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"スイッチを入れると、放電が始まります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"sw","emph":["SW","R"]},{"text":"電流は、だんだん 0 になります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"tt","emph":["G","R"]},{"text":"〖電流が 0 になるまでに、初めの静電エネルギーが全部、抵抗で使われ〗ます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["R","C"],"ans":true}]}],"groups":{"C":["c","c:b","ct0","ct1"],"Q":["qp0","qp1","qm0","qm1"],"Vc":["vca","vca:h","vct0","vct1"],"SW":["swp0","swp1","sw","swo"],"R":["rr","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{"sw":{"to":{"swc":1},"dur":0.6},"tt":{"to":{"tt":1},"dur":2.0}},"route":["初めの静電エネルギー","抵抗で使われるエネルギー"]}},{"id":"t54s6x","scene":"t54s6x","kind":"u54s6dis","lab":{"c":"{C}=200 μF","pp":"top","vc":"{V}=1 kV","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall"},"viewbox":"-164 132 988 946","band":{"want":"抵抗で使われるエネルギー","known":"$V = 1\\,\\mathrm{kV},\\;\\; C = 200\\,\\mu\\mathrm{F}$","ans":"$100\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"swc":1,"tt":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、抵抗で使われるエネルギーです。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"①初めの静電エネルギー\n②抵抗で使われるエネルギー\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$1\\,\\mathrm{kV}$ は $1000\\,\\mathrm{V}$、$200\\,\\mu\\mathrm{F}$ は $0.0002\\,\\mathrm{F}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Vc","C"]},{"text":"初めの静電エネルギーを求めます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C","Vc"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"],["W = \\dfrac{1}{2} \\times 0.0002 \\times 1000^2"],["= 100\\,\\mathrm{J}"]]}],"emphPre":["C","Vc"]},{"text":"〖この $100\\,\\mathrm{J}$ が、抵抗で使われるエネルギーになります〗。","at":{"強調":1.0},"after":[],"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"電流が 0 になるまでに、初めの静電エネルギーが全部、抵抗で使われます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"tt","emph":["R"],"eq":[{"cont":false,"items":[["W = 100\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["G","R"]}]}],"groups":{"C":["c","c:b","ct0","ct1"],"Q":["qp0","qp1","qm0","qm1"],"Vc":["vca","vca:h","vct0","vct1"],"SW":["swp0","swp1","sw","swo"],"R":["rr","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{"tt":{"to":{"tt":1},"dur":1.5}},"route":["初めの静電エネルギー","抵抗で使われるエネルギー"]}},{"id":"t54s7e","scene":"t54s7e","kind":"u54s7ir","lab":{"src":"{E}","ri":"{r}","r":"{R}","c":"{C}"},"viewbox":"401 308 693 374","band":{"want":"内部抵抗のある電池で充電する時の時定数","ans":"$\\tau = (r + R)C$","full":"電池の内部抵抗 r も R とコンデンサに直列。時定数の抵抗は合成抵抗 r + R。"},"narr":{"start":{"co":1,"swc":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"電池の中の内部抵抗 $r$ も、電流の通り道にあります。\n①内部抵抗も直列\n②合成抵抗\n③時定数\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ri","src"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"$r$ と $R$ とコンデンサは、1本の道でつながる直列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ri","R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"時定数の抵抗は、〖$r$ と $R$ を足した合成抵抗〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ri","R"],"eq":[{"cont":false,"items":[["r + R"]]}],"emphPre":["Ri","R"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"これに静電容量を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Ri","R","C"],"eq":[{"cont":false,"items":[["\\tau = (r + R)C"]]}],"ans":true,"emphPre":["Ri","R","C"]}]}],"groups":{"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"Ri":["ri","rit0","rit1"],"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"zmid":["u54s7irL","u54s7irw4","u54s7irw2","u54s7irw8"],"zlo":["u54s7irw3","u54s7irw7","u54s7irw11"],"zhi":["u54s7irw5","u54s7irw6"],"zmid2":["u54s7irw9","u54s7irw10"]},"moves":{},"route":["内部抵抗も直列","合成抵抗","時定数"]}},{"id":"t54s7x","scene":"t54s7x","kind":"u54s7ir","lab":{"src":"{E}","ri":"{r}=2 Ω","r":"{R}=3 Ω","c":"{C}=200 μF"},"viewbox":"401 308 693 374","band":{"want":"時定数 $\\tau$［ms］","known":"$r = 2\\,\\Omega,\\;\\; R = 3\\,\\Omega,\\;\\; C = 200\\,\\mu\\mathrm{F}$","ans":"$\\tau = 1\\,\\mathrm{ms}$"},"narr":{"start":{"co":1,"swc":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、充電の時定数 $\\tau$ です。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"①内部抵抗も直列\n②合成抵抗\n③時定数\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"内部抵抗 $r$ も、$R$ とコンデンサに直列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ri","R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"合成抵抗を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ri","R"],"eq":[{"cont":false,"items":[["r + R = 2 + 3 = 5\\,\\Omega"]]}],"emphPre":["Ri","R"]},{"text":"〖この $5\\,\\Omega$ を、次の時定数に使います〗。","at":{"強調":1.0},"after":[],"emph":["Ri","R"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"合成抵抗に静電容量を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Ri","R","C"],"eq":[{"cont":false,"items":[["\\tau = (r + R)C"],["\\tau = 5 \\times 200 \\times 10^{-6}"],["= 1000\\,\\mu\\mathrm{s}"]]}],"emphPre":["Ri","R","C"]},{"text":"1000 μs が 1 ms です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Ri","R","C"],"eq":[{"cont":false,"items":[["\\tau = 1000\\,\\mu\\mathrm{s} = 1\\,\\mathrm{ms}"]]}],"ans":true,"emphPre":["Ri","R","C"]}]}],"groups":{"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"Ri":["ri","rit0","rit1"],"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"zmid":["u54s7irL","u54s7irw4","u54s7irw2","u54s7irw8"],"zlo":["u54s7irw3","u54s7irw7","u54s7irw11"],"zhi":["u54s7irw5","u54s7irw6"],"zmid2":["u54s7irw9","u54s7irw10"]},"moves":{},"route":["内部抵抗も直列","合成抵抗","時定数"]}},{"id":"t54s8e","scene":"t54s8e","kind":"u54s8sm","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":"S","n1":"①","n2":"②","swto":"2","i":"{i}","ia":"left"},"viewbox":"109 86 833 557","band":{"want":"スイッチを切り換えた後の時定数","ans":"切り換えた後の閉回路の抵抗と $C$ で $\\tau = RC$","full":"切り換えた後の閉回路を読む。その中の抵抗とコンデンサで時定数が決まる。閉回路の外の電源と抵抗は使わない。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"スイッチを切り換えた後の時定数は、〖切り換えた後の閉回路〗で決まります。\n①切り換えた後の閉回路\n②その中の抵抗\n③時定数\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["SW","N2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"② に切り換えると、$R_2$ とコンデンサだけの閉回路になります。電源と ① の側の抵抗は外れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R2","C","N2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"充電したコンデンサは一時的な電源になり、$R_2$ に電流を流します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["C","R2","I"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"時定数は、〖閉回路の中の $R_2$ と $C$〗で決まります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R2","C"],"eq":[{"cont":false,"items":[["\\tau = R_2 C"]]}],"ans":true,"emphPre":["R2","C"]}]}],"groups":{"SRC":["bat","bat:m","srct0","srct1"],"R1":["rr1","r1t0","r1t1"],"SW":["c1","cpv","c2","swb","swt0","swt1"],"R2":["rr2","r2t0","r2t1"],"C":["cp","cp:b","ct0","ct1"],"N1":["n1t0","n1t1"],"N2":["n2t0","n2t1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["切り換えた後の閉回路","その中の抵抗","時定数"]}},{"id":"t54s8x","scene":"t54s8x","kind":"u54s8sm","lab":{"src":"{E}","r1":"{R}_1=200 Ω","r2":"{R}_2=50 Ω","c":"{C}=40 μF","sw":"S","n1":"①","n2":"②","swto":"2","i":"{i}","ia":"left"},"viewbox":"109 86 833 557","band":{"want":"② に切り換えた後の時定数 $\\tau$［ms］","known":"$R_1 = 200\\,\\Omega,\\;\\; R_2 = 50\\,\\Omega,\\;\\; C = 40\\,\\mu\\mathrm{F}$","ans":"$\\tau = 2\\,\\mathrm{ms}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、② に切り換えた後の時定数 $\\tau$ です。","at":{"強調":1.0},"after":[],"emph":["SW","N2"]},{"text":"①切り換えた後の閉回路\n②その中の抵抗\n③時定数\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"② に切り換えると、閉回路は $R_2$ とコンデンサだけです。〖電源と ① の側の抵抗は閉回路の外〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R2","C","N2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"閉回路の中の抵抗は、$R_2 = 50\\,\\Omega$ だけです。この値を、次の時定数に使います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"放電の時定数も $RC$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R2","C"],"eq":[{"cont":false,"items":[["\\tau = R_2 C"],["\\tau = 50 \\times 40 \\times 10^{-6}"],["= 2000\\,\\mu\\mathrm{s}"]]}],"emphPre":["R2","C"]},{"text":"1000 μs が 1 ms です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["R2","C"],"eq":[{"cont":false,"items":[["\\tau = 2000\\,\\mu\\mathrm{s} = 2\\,\\mathrm{ms}"]]}],"ans":true,"emphPre":["R2","C"]}]}],"groups":{"SRC":["bat","bat:m","srct0","srct1"],"R1":["rr1","r1t0","r1t1"],"SW":["c1","cpv","c2","swb","swt0","swt1"],"R2":["rr2","r2t0","r2t1"],"C":["cp","cp:b","ct0","ct1"],"N1":["n1t0","n1t1"],"N2":["n2t0","n2t1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["切り換えた後の閉回路","その中の抵抗","時定数"]}},{"id":"t54s9e","scene":"t54s9e","kind":"u54s9pc","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","c1":"{C}_1","c2":"{C}_2","rp":"{R}","cp":"{C}"},"viewbox":"447 213 612 419","band":{"want":"抵抗とコンデンサが2つずつある時の時定数","ans":"まとめた $R$ と $C$ で $\\tau = RC$","full":"先に抵抗をまとめ、コンデンサをまとめてから掛ける。コンデンサの並列は和（抵抗と逆）。"},"narr":{"start":{"co":1,"rm":0,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"抵抗やコンデンサが2つずつある時は、先にまとめます。\n①抵抗をまとめる\n②コンデンサをまとめる\n③時定数\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","C1","C2"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"抵抗の並列は、和分の積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R1","R2","Rp"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"]]}],"move":"rm","emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"コンデンサの並列は、〖静電容量の和〗です。抵抗と逆です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["C1","C2","Cp"],"eq":[{"cont":false,"items":[["C = C_1 + C_2"]]}],"move":"cm","emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"まとめた $R$ と $C$ を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Rp","Cp"],"eq":[{"cont":false,"items":[["\\tau = RC"]]}],"ans":true,"emphPre":["Rp","Cp"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"Rp":["rp","rpt0","rpt1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"Cp":["cp","cpt0","cpt1","cp:b","cp:l1","cp:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s9pcL","u54s9pcw9","u54s9pcw1","u54s9pcw3","u54s9pcw5","u54s9pcw7"],"zlo":["u54s9pcRw","u54s9pcw19","u54s9pcw11","u54s9pcw13","u54s9pcw15","u54s9pcw17"],"zmid":["u54s9pcw2","u54s9pcw4","u54s9pcw6","u54s9pcw8","u54s9pcw10","u54s9pcw12","u54s9pcw14","u54s9pcw16","u54s9pcw18"]},"moves":{"rm":{"to":{"rm":1},"dur":0.8},"cm":{"to":{"cm":1},"dur":0.8}},"route":["抵抗をまとめる","コンデンサをまとめる","時定数"]}},{"id":"t54s9x","scene":"t54s9x","kind":"u54s9pc","lab":{"src":"{E}","r1":"{R}_1=20 Ω","r2":"{R}_2=20 Ω","c1":"{C}_1=50 μF","c2":"{C}_2=50 μF","rp":["{R}","{R}=10 Ω"],"cp":["{C}","{C}=100 μF"]},"viewbox":"447 213 612 419","band":{"want":"時定数 $\\tau$［ms］","known":"$R_1 = R_2 = 20\\,\\Omega,\\;\\; C_1 = C_2 = 50\\,\\mu\\mathrm{F}$","ans":"$\\tau = 1\\,\\mathrm{ms}$"},"narr":{"start":{"co":1,"rm":0,"cm":0,"rpv":0,"cpv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、この回路の時定数 $\\tau$ です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","C1","C2"]},{"text":"①抵抗をまとめる\n②コンデンサをまとめる\n③時定数\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"抵抗の並列は、和分の積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R1","R2","Rp"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"],["R = \\dfrac{20 \\times 20}{20 + 20} = 10\\,\\Omega"]]}],"move":"rm","emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"コンデンサの並列は、静電容量の和です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["C1","C2","Cp"],"eq":[{"cont":false,"items":[["C = C_1 + C_2"],["C = 50 + 50 = 100\\,\\mu\\mathrm{F}"]]}],"move":"cm","emphPre":["C1","C2"]},{"text":"〖まとめた $R$ と $C$ を、次の時定数に使います〗。","at":{"強調":1.0},"after":[],"emph":["Rp","Cp"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"まとめた $R$ と $C$ を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Rp","Cp"],"eq":[{"cont":false,"items":[["\\tau = RC"],["\\tau = 10 \\times 100 \\times 10^{-6}"],["= 1000\\,\\mu\\mathrm{s}"]]}],"emphPre":["Rp","Cp"]},{"text":"1000 μs が 1 ms です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Rp","Cp"],"eq":[{"cont":false,"items":[["\\tau = 1000\\,\\mu\\mathrm{s} = 1\\,\\mathrm{ms}"]]}],"ans":true,"emphPre":["Rp","Cp"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"Rp":["rp","rpt0","rpt1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"Cp":["cp","cpt0","cpt1","cp:b","cp:l1","cp:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s9pcL","u54s9pcw9","u54s9pcw1","u54s9pcw3","u54s9pcw5","u54s9pcw7"],"zlo":["u54s9pcRw","u54s9pcw19","u54s9pcw11","u54s9pcw13","u54s9pcw15","u54s9pcw17"],"zmid":["u54s9pcw2","u54s9pcw4","u54s9pcw6","u54s9pcw8","u54s9pcw10","u54s9pcw12","u54s9pcw14","u54s9pcw16","u54s9pcw18"]},"moves":{"rm":{"to":{"rm":1,"rpv":1},"dur":0.8},"cm":{"to":{"cm":1,"cpv":1},"dur":0.8}},"route":["抵抗をまとめる","コンデンサをまとめる","時定数"]}},{"id":"t54s10e","scene":"t54s10e","kind":"u54s10th","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","c":"{C}","sw":"","dl":""},"viewbox":"-32 140 1385 562","band":{"want":"コンデンサの横に抵抗が並ぶ回路の時定数","ans":"コンデンサから見た合成抵抗で $\\tau = RC$","full":"電源を短絡し、コンデンサの所から見た合成抵抗を出す。R1 と R2 は並列に見える。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"コンデンサの横に抵抗が並ぶ時は、コンデンサから見た抵抗で時定数を出します。\n①電源を短絡\n②コンデンサから見る\n③時定数\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C","Dl"]}]},{"cap":null,"eqp":null,"vid":[10],"sents":[{"text":"a・b 間の合成抵抗と同じく、電源は短絡します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["SRC"]}]},{"cap":null,"eqp":null,"vid":[10,3],"sents":[{"text":"コンデンサの所から、左の回路を見ます。$R_1$ と $R_2$ は〖並列〗に見えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"]]}],"emphPre":["R1","R2","Dl"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"この合成抵抗に静電容量を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R1","R2","C"],"eq":[{"cont":false,"items":[["\\tau = \\dfrac{R_1 R_2}{R_1 + R_2} C"]]}],"ans":true,"emphPre":["R1","R2","C"]}]}],"groups":{"SRC":["bat","bat:m","srct0","srct1"],"R1":["rr1","r1t0","r1t1"],"SW":["sp0","sp1","swo","swc","swt0","swt1"],"R2":["rr2","r2t0","r2t1"],"Dl":["dl"],"C":["cp","cp:b","ct0","ct1"],"V":["va","va:h","vt0","vt1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["電源を短絡","コンデンサから見る","時定数"]}},{"id":"t54s10x","scene":"t54s10x","kind":"u54s10th","lab":{"src":"{E}=12 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","c":"{C}=500 μF","sw":"","dl":""},"viewbox":"-32 140 1385 562","band":{"want":"時定数 $\\tau$［ms］","known":"$R_1 = 6\\,\\Omega,\\;\\; R_2 = 3\\,\\Omega,\\;\\; C = 500\\,\\mu\\mathrm{F}$","ans":"$\\tau = 1\\,\\mathrm{ms}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、この回路の時定数 $\\tau$ です。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"①電源を短絡\n②コンデンサから見る\n③時定数\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[10],"sents":[{"text":"電源を短絡します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["SRC"]}]},{"cap":null,"eqp":null,"vid":[10,3],"sents":[{"text":"コンデンサの側から見ると、$R_1$ と $R_2$ は並列です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"],["R = \\dfrac{6 \\times 3}{6 + 3} = 2\\,\\Omega"]]}],"emphPre":["R1","R2","Dl"]},{"text":"〖この $2\\,\\Omega$ を、次の時定数に使います〗。","at":{"強調":1.0},"after":[],"emph":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"合成抵抗に静電容量を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R2","C"],"eq":[{"cont":false,"items":[["\\tau = RC"],["\\tau = 2 \\times 500 \\times 10^{-6}"],["= 1000\\,\\mu\\mathrm{s}"]]}],"emphPre":["R1","R2","C"]},{"text":"1000 μs が 1 ms です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["R1","R2","C"],"eq":[{"cont":false,"items":[["\\tau = 1000\\,\\mu\\mathrm{s} = 1\\,\\mathrm{ms}"]]}],"ans":true,"emphPre":["C"]}]}],"groups":{"SRC":["bat","bat:m","srct0","srct1"],"R1":["rr1","r1t0","r1t1"],"SW":["sp0","sp1","swo","swc","swt0","swt1"],"R2":["rr2","r2t0","r2t1"],"Dl":["dl"],"C":["cp","cp:b","ct0","ct1"],"V":["va","va:h","vt0","vt1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["電源を短絡","コンデンサから見る","時定数"]}},{"id":"t54s11e","scene":"t54s11e","kind":"u54s11rc","lab":{"src":"{E}","r":"{R}","c":"{C}","i":"{i}","y":"{i}","cv":"fall","st":"{E}/{R}","fin":"0","tau":"τ","pct":"63.2%"},"viewbox":"375 269 720 903","band":{"want":"文が正しいか、誤っているか","ans":"文を1つずつ、習った式とグラフに照らす","full":"文を1つずつ、どの節の決まりかを思い出し、習った式とグラフに照らす。比例・反比例は式の分子か分母かで見る。"},"narr":{"start":{"co":1,"swc":1,"tt":0,"find":1,"taud":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"文の正誤は、文を1つずつ、習った決まりと照らします。\n①どの決まりか\n②式とグラフに照らす\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"時定数の文なら、式と照らします。比例・反比例は〖式の分子か分母か〗で見ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","C","Tau"],"eq":[{"cont":false,"items":[["\\tau = RC"]]}],"emphPre":["R","C"]}]},{"cap":null,"eqp":null,"vid":[13,14],"sents":[{"text":"電流や電圧の変わり方の文なら、グラフと照らします。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"move":"tt","emph":["G","St"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s11rcL","u54s11rcw1","u54s11rcw2"],"zlo":["u54s11rcRw","u54s11rcw4"],"zmid":["u54s11rcw3"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{"tt":{"to":{"tt":1},"dur":2.0},"tau":{"to":{"taud":1},"dur":0.6}},"route":["どの決まりか","式とグラフに照らす"]}},{"id":"t54s11x","scene":"t54s11x","kind":"u54s11rc","lab":{"src":"{E}","r":"{R}","c":"{C}","i":"{i}","y":"{i}","cv":"fall","st":"{E}/{R}","fin":"0","tau":"τ","pct":"63.2%"},"viewbox":"375 269 720 903","band":{"want":"誤っている文","ans":"(2)（入れた直後の電流は静電容量に関係しない）"},"narr":{"start":{"co":1,"swc":1,"tt":1,"find":1,"taud":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"誤っている文を、1つ選びます。\n①文を1つずつ\n②式とグラフに照らす\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"(1) 抵抗とコイルの時定数は、インダクタンスを抵抗で割ります。インダクタンスに比例するので、正しい文です。","at":{"道筋":1.0},"after":[],"route":1},{"text":"(3) 定常状態のコイルは導線と同じです。両端の電圧は 0 なので、正しい文です。","at":{},"after":[]},{"text":"(4) 時定数だけたつと、電流は 63.2% 減り、残りは 0.368 倍です。正しい文です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"tau","emph":["Tau","Pct"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"(2) スイッチを入れた瞬間、コンデンサは導線と同じです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["C","St"]},{"text":"入れた直後の電流は、電源の電圧を抵抗で割った値です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["St","src","R"],"eq":[{"cont":false,"items":[["i = \\dfrac{E}{R}"]]}],"emphPre":["St","src","R"]},{"text":"〖静電容量 $C$ は式に無い〗ので、関係しません。(2) が誤りです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["C","St"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s11rcL","u54s11rcw1","u54s11rcw2"],"zlo":["u54s11rcRw","u54s11rcw4"],"zmid":["u54s11rcw3"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{"tau":{"to":{"taud":1},"dur":0.6}},"route":["文を1つずつ","式とグラフに照らす"]}},{"id":"t54s12e","scene":"t54s12e","kind":"u54s12rc","lab":{"src":"{E}","r":"{R} [kΩ]","c":"{C} [μF]","i":"{i}","y":"{i}","cv":"fall","st":"{E}/{R}","fin":"0","tau":"τ"},"viewbox":"412 276 647 894","band":{"want":"時定数をキロ・マイクロ・ミリで出す","ans":"頭の字を数に直して掛け、s を ms に直す","full":"キロは 10^3、ミリは 10^-3、マイクロは 10^-6。数に直して τ = RC を掛けると s。1000 倍すると ms。"},"narr":{"start":{"co":1,"swc":1,"tt":1,"find":1,"taud":1},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"時定数の計算では、単位の頭の字を数に直してから掛けます。\n①頭の字を数に直す\n②掛けて s\n③ms に直す\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Tau"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"キロは $10^{3}$、ミリは $10^{-3}$、マイクロは $10^{-6}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"Ω と F で掛けると、時定数は s で出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Tau","R","C"],"eq":[{"cont":false,"items":[["\\tau = RC"]]}],"emphPre":["Tau","R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"1 s は 1000 ms です。〖kΩ と μF の積は、そのまま ms〗になります。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["Tau","R","C"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s12rcL","u54s12rcw1","u54s12rcw2"],"zlo":["u54s12rcRw","u54s12rcw4"],"zmid":["u54s12rcw3"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{},"route":["頭の字を数に直す","掛けて s","ms に直す"]}},{"id":"t54s12x","scene":"t54s12x","kind":"u54s12rc","lab":{"src":"{E}","r":"{R}=2 kΩ","c":"{C}=50 μF","i":"{i}","y":"{i}","cv":"fall","st":"{E}/{R}","fin":"0","tau":["τ","τ=100 ms"]},"viewbox":"412 276 647 894","band":{"want":"時定数 $\\tau$［ms］","known":"$R = 2\\,\\mathrm{k\\Omega},\\;\\; C = 50\\,\\mu\\mathrm{F}$","ans":"$\\tau = 100\\,\\mathrm{ms}$"},"narr":{"start":{"co":1,"swc":1,"tt":1,"find":1,"taud":1,"tauv":0},"steps":[{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"求めるのは、時定数 $\\tau$ を ms で表した値です。","at":{"強調":1.0},"after":[],"emph":["Tau"]},{"text":"①頭の字を数に直す\n②掛けて s\n③ms に直す\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"キロとマイクロを数に直します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","C"],"eq":[{"cont":false,"items":[["R = 2 \\times 10^{3}\\,\\Omega","C = 50 \\times 10^{-6}\\,\\mathrm{F}"]]}],"emphPre":["R","C"]},{"text":"〖この2つを、次に掛けます〗。","at":{"強調":1.0},"after":[],"emph":["R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"抵抗とコンデンサの直列回路なので、$\\tau = RC$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Tau","R","C"],"eq":[{"cont":false,"items":[["\\tau = RC"],["\\tau = 2 \\times 10^{3} \\times 50 \\times 10^{-6}"],["= 100 \\times 10^{-3} = 0.1\\,\\mathrm{s}"]]}],"emphPre":["Tau","R","C"]}]},{"cap":null,"eqp":null,"vid":[13],"sents":[{"text":"1 s は 1000 ms です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["Tau","R","C"],"eq":[{"cont":false,"items":[["\\tau = 0.1 \\times 1000 = 100\\,\\mathrm{ms}"]]}],"move":"tauv","ans":true,"emphPre":["Tau"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"R":["r","rt0","rt1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u54s12rcL","u54s12rcw1","u54s12rcw2"],"zlo":["u54s12rcRw","u54s12rcw4"],"zmid":["u54s12rcw3"],"Ax":["axx1","axx1:h","ayx1","ayx1:h","ox1","atx1"],"G":["ytx10","ytx11","cvx1"],"Fin":["flx1","fintx10","fintx11"],"St":["sttx10","sttx11"],"C2":["cw2x1","c2tx10","c2tx11","tl2x1","tau2tx10","tau2tx11"],"Tau":["tl0x1","tautx10","tautx11"],"Pct":["plx1","pcttx10","pcttx11"],"Ph1":["p1ax1","p1ax1:h","p1ax1:h2","ph1tx10","ph1tx11"],"Ph2":["p2ax1","p2ax1:h","p2ax1:h2","ph2tx10","ph2tx11"]},"moves":{"tauv":{"to":{"tauv":1},"dur":0.4}},"route":["頭の字を数に直す","掛けて s","ms に直す"]}}],"secs":[{"ex":{"text":"図のように、$18\\,\\mathrm{V}$ の電源に $6\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に「コンデンサと $4\\,\\Omega$ の抵抗 $R_2$ の直列」と「$12\\,\\Omega$ の抵抗 $R_3$」を並列につなぎます。コンデンサは充電されていません。スイッチを入れた瞬間の電流 $I$ は何 A ですか。","fig":{"kind":"u54s1cr","L":{"src":"{E}=18 V","r1":"{R}_1=6 Ω","r2":"{R}_2=4 Ω","r3":"{R}_3=12 Ω","c":"{C}","i":"{I}"},"P":{}},"ch":[{"t":"$1\\,\\mathrm{A}$","v":1,"why":"コンデンサに電流が流れないと読んだ（それは十分に時間がたった後）"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$3\\,\\mathrm{A}$","v":3,"why":"並列の部分を足さず、$R_1$ だけで割った"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"$R_1$ を足さず、並列の部分 $3\\,\\Omega$ だけで割った"}],"ans":1}},{"ex":{"text":"図のように、$30\\,\\mathrm{V}$ の電源に $10\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $5\\,\\Omega$ の抵抗 $R_2$ とコイルを並列につなぎます。コイルの電流は初め $0\\,\\mathrm{A}$ です。スイッチを入れた瞬間の電流 $I$ は何 A ですか。ただし、コイルの抵抗は無いものとします。","fig":{"kind":"u54s2lr","L":{"src":"{E}=30 V","r1":"{R}_1=10 Ω","r2":"{R}_2=5 Ω","l":"{L}","i":"{I}"},"P":{}},"ch":[{"t":"$3\\,\\mathrm{A}$","v":3,"why":"コイルを素通りと読んだ（それは十分に時間がたった後）"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"$R_1$ を足さず、$R_2$ だけで割った"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$0.5\\,\\mathrm{A}$","v":0.5,"why":"合成抵抗を電源の電圧で割った（割る順が逆）"}],"ans":2}},{"ex":{"text":"図のように、$12\\,\\mathrm{V}$ の電源に「コンデンサと $4\\,\\Omega$ の抵抗 $R_1$ の直列」「コイルと $6\\,\\Omega$ の抵抗 $R_2$ の直列」「$3\\,\\Omega$ の抵抗 $R_3$」の3つの道を並列につなぎます。スイッチを入れて十分に時間がたった後に、電源を流れる電流 $I$ は何 A ですか。ただし、コイルの抵抗は無いものとします。","fig":{"kind":"u54s3p3","L":{"src":"{E}=12 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=3 Ω","c":"{C}","l":"{L}","i":"{I}"},"P":{}},"ch":[{"t":"$9\\,\\mathrm{A}$","v":9,"why":"コンデンサの道にも電流が流れるとした（十分に時間がたつと流れない）"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"$R_3$ の道だけを出した（コイルの道の電流を足していない）"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"コイルの道だけを出した（$R_3$ の道の電流を足していない）"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":""}],"ans":3}},{"ex":{"text":"図のように、$12\\,\\mathrm{V}$ の電源に $4\\,\\Omega$ の抵抗と $20\\,\\mathrm{mH}$ のコイルを直列につなぎ、スイッチを入れて十分に時間がたちました。コイルに蓄えられるエネルギーは何 J ですか。ただし、コイルの抵抗は無いものとします。","fig":{"kind":"u54s4rl","L":{"src":"{E}=12 V","r":"{R}=4 Ω","l":"{L}=20 mH","i":"{I}"},"P":{}},"ch":[{"t":"$1.44\\,\\mathrm{J}$","v":1.44,"why":"電流を出さずに、電源の電圧を $I$ に入れた"},{"t":"$0.09\\,\\mathrm{J}$","v":0.09,"why":""},{"t":"$3\\,\\mathrm{J}$","v":3,"why":"電流 $3\\,\\mathrm{A}$ を出したところで止めた（エネルギーの式に入れていない）"},{"t":"$90\\,\\mathrm{J}$","v":90,"why":"mH を H に直していない"}],"ans":1}},{"ex":{"text":"図のように、$30\\,\\mathrm{V}$ の電源に $10\\,\\Omega$ の抵抗 $R_1$ をつなぎ、その先に $20\\,\\Omega$ の抵抗 $R_2$ と $100\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。定常状態で、コンデンサに蓄えられるエネルギーは何 J ですか。","fig":{"kind":"u54s5rc","L":{"src":"{E}=30 V","r1":"{R}_1=10 Ω","r2":"{R}_2=20 Ω","c":"{C}=100 μF","vc":"{V}_C","i":"{I}"},"P":{}},"ch":[{"t":"$0.045\\,\\mathrm{J}$","v":0.045,"why":"分圧せず、電源の電圧 $30\\,\\mathrm{V}$ を入れた"},{"t":"$0\\,\\mathrm{J}$","v":0,"why":"電流が流れないので電圧も 0 とした（コンデンサには $R_2$ の電圧がかかる）"},{"t":"$0.02\\,\\mathrm{J}$","v":0.02,"why":""},{"t":"$0.005\\,\\mathrm{J}$","v":0.005,"why":"$R_1$ の電圧 $10\\,\\mathrm{V}$ を入れた"}],"ans":2}},{"ex":{"text":"図のように、$1\\,\\mathrm{kV}$ に充電した $200\\,\\mu\\mathrm{F}$ のコンデンサを抵抗につなぎ、スイッチを入れて放電させました。十分に時間がたつまでに、抵抗で消費されるエネルギーは何 J ですか。","fig":{"kind":"u54s6dc","L":{"c":"{C}=200 μF","pp":"top","vc":"{V}=1 kV","sw":"","r":"{R}","i":"{i}","y":"{i}","cv":"fall"},"P":{}},"ch":[{"t":"$0\\,\\mathrm{J}$","v":0,"why":"最後は電流が 0 になるので 0 とした（初めの静電エネルギーが全部、抵抗で使われる）"},{"t":"$1 \\times 10^{-4}\\,\\mathrm{J}$","v":0.0001,"why":"キロを直していない（$1\\,\\mathrm{kV} = 1000\\,\\mathrm{V}$）"},{"t":"$100\\,\\mathrm{J}$","v":100,"why":""},{"t":"$200\\,\\mathrm{J}$","v":200,"why":"$\\dfrac{1}{2}$ を掛けていない"}],"ans":2}},{"ex":{"text":"図のように、内部抵抗 $r = 2\\,\\Omega$ の電池に、$R = 3\\,\\Omega$ の抵抗と $C = 200\\,\\mu\\mathrm{F}$ のコンデンサを直列につないで充電します。時定数は何 ms ですか。","fig":{"kind":"u54s7ir","L":{"src":"{E}","ri":"{r}=2 Ω","r":"{R}=3 Ω","c":"{C}=200 μF"},"P":{}},"ch":[{"t":"$0.6\\,\\mathrm{ms}$","v":0.6,"why":"内部抵抗を足していない（$R$ だけで計算した）"},{"t":"$1\\,\\mathrm{ms}$","v":1,"why":""},{"t":"$0.4\\,\\mathrm{ms}$","v":0.4,"why":"内部抵抗だけで計算した（$R$ を足していない）"},{"t":"$1000\\,\\mathrm{ms}$","v":1000,"why":"μs の値を ms とした"}],"ans":1}},{"ex":{"text":"図の回路で、スイッチ S を ① に入れてコンデンサを十分に充電した後、S を ② に切り換えました。$R_1 = 200\\,\\Omega$、$R_2 = 50\\,\\Omega$、$C = 40\\,\\mu\\mathrm{F}$ です。切り換えた後の時定数は何 ms ですか。","fig":{"kind":"u54s8sm","L":{"src":"{E}","r1":"{R}_1=200 Ω","r2":"{R}_2=50 Ω","c":"{C}=40 μF","sw":"S","n1":"①","n2":"②"},"P":{}},"ch":[{"t":"$10\\,\\mathrm{ms}$","v":10,"why":"閉回路を読まず、$R_1$ も足した"},{"t":"$2\\,\\mathrm{ms}$","v":2,"why":""},{"t":"$8\\,\\mathrm{ms}$","v":8,"why":"① の側の $R_1$ で計算した（切り換えた後の閉回路を読んでいない）"},{"t":"$2000\\,\\mathrm{ms}$","v":2000,"why":"μs の値を ms とした"}],"ans":1}},{"ex":{"text":"図のように、$20\\,\\Omega$ の抵抗2つの並列と、$50\\,\\mu\\mathrm{F}$ のコンデンサ2つの並列を直列につないで充電します。時定数は何 ms ですか。","fig":{"kind":"u54s9pc","L":{"src":"{E}","r1":"{R}_1=20 Ω","r2":"{R}_2=20 Ω","c1":"{C}_1=50 μF","c2":"{C}_2=50 μF","rp":"{R}","cp":"{C}"},"P":{}},"ch":[{"t":"$2\\,\\mathrm{ms}$","v":2,"why":"抵抗をまとめていない（$20\\,\\Omega$ のまま）"},{"t":"$1\\,\\mathrm{ms}$","v":1,"why":""},{"t":"$0.5\\,\\mathrm{ms}$","v":0.5,"why":"コンデンサをまとめていない（$50\\,\\mu\\mathrm{F}$ のまま）"},{"t":"$0.25\\,\\mathrm{ms}$","v":0.25,"why":"コンデンサの並列を、抵抗の並列と同じ式（和分の積）でまとめた"}],"ans":1}},{"ex":{"text":"図のように、$12\\,\\mathrm{V}$ の電源に $R_1 = 6\\,\\Omega$ の抵抗とスイッチを直列につなぎ、その先に $R_2 = 3\\,\\Omega$ の抵抗と $C = 500\\,\\mu\\mathrm{F}$ のコンデンサを並列につなぎます。コンデンサから見た合成抵抗で考えると、時定数は何 ms ですか。","fig":{"kind":"u54s10th","L":{"src":"{E}=12 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","c":"{C}=500 μF","sw":""},"P":{}},"ch":[{"t":"$4.5\\,\\mathrm{ms}$","v":4.5,"why":"$R_1$ と $R_2$ を直列として足した（電源を短絡すると並列）"},{"t":"$1\\,\\mathrm{ms}$","v":1,"why":""},{"t":"$3\\,\\mathrm{ms}$","v":3,"why":"$R_1$ だけで計算した（$R_2$ との合成をしていない）"},{"t":"$1.5\\,\\mathrm{ms}$","v":1.5,"why":"$R_2$ だけで計算した（$R_1$ との合成をしていない）"}],"ans":1}},{"ex":{"text":"次のうち、誤っているものはどれですか。","fig":{"kind":"u54s11rc","L":{"src":"{E}","r":"{R}","c":"{C}","i":"{i}","y":"{i}","cv":"fall","st":"{E}/{R}","fin":"0","tau":"τ","pct":"63.2%"},"P":{}},"ch":[{"t":"抵抗とコイルの直列回路の時定数は、インダクタンスに比例する","v":"t0","why":"正しい文（26-3）"},{"t":"抵抗とコンデンサの直列回路でスイッチを入れた直後の電流は、静電容量の値に関係する","v":"f0","why":""},{"t":"定常状態のコイルの両端の電圧は 0 である","v":"t4","why":"正しい文（26-2・26-7）"},{"t":"時定数だけたつと、放電の電流は初めの値の 0.368 倍になる","v":"t8","why":"正しい文（26-3・26-6）"}],"ans":1}},{"ex":{"text":"$2\\,\\mathrm{k\\Omega}$ の抵抗と $50\\,\\mu\\mathrm{F}$ のコンデンサを直列につないだ回路の時定数は何 ms ですか。","fig":{"kind":"u54s12rc","L":{"src":"{E}","r":"{R}=2 kΩ","c":"{C}=50 μF","i":"{i}","y":"{i}","cv":"fall","st":"{E}/{R}","fin":"0","tau":"τ"},"P":{}},"ch":[{"t":"$0.1\\,\\mathrm{ms}$","v":"0.1","why":"キロを掛けていない（2 Ω で計算した）"},{"t":"$100\\,\\mathrm{ms}$","v":"100","why":""},{"t":"$1 \\times 10^{8}\\,\\mathrm{ms}$","v":"1e8","why":"マイクロを掛けていない（50 F で計算した）"},{"t":"$100\\,\\mathrm{s}$","v":"100s","why":"ms と s を取り違えた（0.1 s が 100 ms）"}],"ans":1}}],"past":[]}};
});
