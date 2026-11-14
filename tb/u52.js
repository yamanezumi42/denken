/* 単元52「磁気のつなぎ（3つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(52, function(H){
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
// ---- 52-1 2本の導体の磁界が 0 になる点 の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S1K = {
  xq: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[460,150],[460,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[460,116,"middle",[0,-1]]],"need":"wa","vis":[],"t":"F","x":460,"y":116,"anc":"middle"},{"f":"ar","id":"iaa","x0":434,"y0":355,"x1":434,"y1":245,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":434,"y0":355,"x1":434,"y1":245},"down":{"x0":434,"y0":245,"x1":434,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[416,300,"end",[-1,0]],[452,300,"start",[1,0]]],"need":"ia","vis":[],"t":"F","x":416,"y":300,"anc":"end"},{"f":"ln","id":"wb","pts":[[860,150],[860,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[860,116,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":860,"y":116,"anc":"middle"},{"f":"ar","id":"iba","x0":886,"y0":355,"x1":886,"y1":245,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":886,"y0":355,"x1":886,"y1":245},"down":{"x0":886,"y0":245,"x1":886,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[904,300,"start",[1,0]],[868,300,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":848,"y":300,"anc":"end"},{"f":"c","id":"pd","cx":260,"cy":520,"r":9,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[260,480,"middle",[0,-1]],[236,490,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":260,"y":480,"anc":"middle"},{"f":"ar","id":"dpad","x0":270,"y0":520,"x1":456,"y1":520,"two":1,"w":2,"need":"dpa","vis":[],"t":"F"},{"f":"lb","id":"dpat","k":"dpa","bases":[[363,552,"middle",[0,1]],[363,488,"middle",[0,-1]]],"need":"dpa","vis":[],"t":"F","x":363,"y":552,"anc":"middle"},{"f":"ar","id":"dabd","x0":464,"y0":520,"x1":856,"y1":520,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[660,552,"middle",[0,1]],[660,488,"middle",[0,-1]]],"need":"dab","vis":[],"t":"F","x":660,"y":552,"anc":"middle"},{"f":"ln","id":"dpbe1","pts":[[260,546],[260,664]],"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"ln","id":"dpbe2","pts":[[860,546],[860,664]],"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"ar","id":"dpbd","x0":260,"y0":650,"x1":860,"y1":650,"two":1,"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"lb","id":"dpbt","k":"dpb","bases":[[560,690,"middle",[0,1]],[560,610,"middle",[0,-1]]],"need":"dpb","vis":[],"t":"F","x":560,"y":690,"anc":"middle"},{"f":"c","id":"hpac","cx":226,"cy":410,"r":20,"fill":"w","need":"hpa","vis":[],"t":"F","sel":["hpa"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hat","k":"ha","bases":[[200,410,"end",[-1,0]],[226,370,"middle",[0,-1]]],"need":"ha","vis":[],"t":"F","x":226,"y":364,"anc":"middle"},{"f":"c","id":"hpbc","cx":294,"cy":410,"r":20,"fill":"w","need":"hpb","vis":[],"t":"F","sel":["hpb"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hbt","k":"hb","bases":[[320,410,"start",[1,0]],[294,370,"middle",[0,-1]]],"need":"hb","vis":[],"t":"F","x":320,"y":410,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pm: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[260,150],[260,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[260,116,"middle",[0,-1]]],"need":"wa","vis":[],"t":"F","x":260,"y":116,"anc":"middle"},{"f":"ar","id":"iaa","x0":234,"y0":355,"x1":234,"y1":245,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":234,"y0":355,"x1":234,"y1":245},"down":{"x0":234,"y0":245,"x1":234,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[216,300,"end",[-1,0]],[252,300,"start",[1,0]]],"need":"ia","vis":[],"t":"F","x":272,"y":300,"anc":"start"},{"f":"ln","id":"wb","pts":[[860,150],[860,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[860,116,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":860,"y":116,"anc":"middle"},{"f":"ar","id":"iba","x0":886,"y0":355,"x1":886,"y1":245,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":886,"y0":355,"x1":886,"y1":245},"down":{"x0":886,"y0":245,"x1":886,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[904,300,"start",[1,0]],[868,300,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":848,"y":300,"anc":"end"},{"f":"c","id":"pd","cx":560,"cy":520,"r":9,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[560,480,"middle",[0,-1]],[536,490,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":560,"y":480,"anc":"middle"},{"f":"ar","id":"dpad","x0":264,"y0":520,"x1":550,"y1":520,"two":1,"w":2,"need":"dpa","vis":[],"t":"F"},{"f":"lb","id":"dpat","k":"dpa","bases":[[407,552,"middle",[0,1]],[407,488,"middle",[0,-1]]],"need":"dpa","vis":[],"t":"F","x":407,"y":552,"anc":"middle"},{"f":"ar","id":"dpbd","x0":570,"y0":520,"x1":856,"y1":520,"two":1,"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"lb","id":"dpbt","k":"dpb","bases":[[713,552,"middle",[0,1]],[713,488,"middle",[0,-1]]],"need":"dpb","vis":[],"t":"F","x":713,"y":552,"anc":"middle"},{"f":"ln","id":"dabe1","pts":[[260,546],[260,664]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ln","id":"dabe2","pts":[[860,546],[860,664]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ar","id":"dabd","x0":260,"y0":650,"x1":860,"y1":650,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[560,690,"middle",[0,1]],[560,610,"middle",[0,-1]]],"need":"dab","vis":[],"t":"F","x":560,"y":690,"anc":"middle"},{"f":"c","id":"hpac","cx":526,"cy":410,"r":20,"fill":"w","need":"hpa","vis":[],"t":"F","sel":["hpa"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hat","k":"ha","bases":[[500,410,"end",[-1,0]],[526,370,"middle",[0,-1]]],"need":"ha","vis":[],"t":"F","x":500,"y":410,"anc":"end"},{"f":"c","id":"hpbc","cx":594,"cy":410,"r":20,"fill":"w","need":"hpb","vis":[],"t":"F","sel":["hpb"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hbt","k":"hb","bases":[[620,410,"start",[1,0]],[594,370,"middle",[0,-1]]],"need":"hb","vis":[],"t":"F","x":620,"y":410,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  xy: {"vars":[],"items":[{"f":"ln","id":"xw","pts":[[290,440],[750,440]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"xwd0","pts":[[200,440],[285,440]],"dash":1,"w":3,"vis":[],"t":"F"},{"f":"ln","id":"xwd1","pts":[[755,440],[840,440]],"dash":1,"w":3,"vis":[],"t":"F"},{"f":"ar","id":"xax","x0":845,"y0":440,"x1":920,"y1":440,"w":2,"vis":[],"t":"F"},{"f":"lb","id":"axt","k":"ax","bases":[[930,440,"start",[1,0]]],"need":"ax","vis":[],"t":"F","x":936,"y":440,"anc":"start"},{"f":"ln","id":"yw","pts":[[520,220],[520,660]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"ywd0","pts":[[520,140],[520,215]],"dash":1,"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ywd1","pts":[[520,665],[520,740]],"dash":1,"w":3,"vis":[],"t":"F"},{"f":"ar","id":"yax","x0":520,"y0":135,"x1":520,"y1":70,"w":2,"vis":[],"t":"F"},{"f":"lb","id":"ayt","k":"ay","bases":[[520,40,"middle",[0,-1]]],"need":"ay","vis":[],"t":"F","x":520,"y":34,"anc":"middle"},{"f":"tx","id":"o","x":500,"y":470,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[320,480,"middle",[0,1]]],"need":"wa","vis":[],"t":"F","x":320,"y":480,"anc":"middle"},{"f":"lb","id":"wbt","k":"wb","bases":[[540,640,"start",[1,0]]],"need":"wb","vis":[],"t":"F","x":540,"y":648,"anc":"start"},{"f":"ar","id":"ixa0","x0":350,"y0":410,"x1":430,"y1":410,"w":4,"need":"ix","sel":"ixa","var":{"right":{"x0":350,"y0":410,"x1":430,"y1":410},"left":{"x0":430,"y0":410,"x1":350,"y1":410}},"dflt":"right","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ixt0","k":"ix","bases":[[390,378,"middle",[0,-1]],[390,442,"middle",[0,1]]],"need":"ix","vis":[],"t":"F","x":374,"y":372,"anc":"middle"},{"f":"ar","id":"ixa1","x0":610,"y0":410,"x1":690,"y1":410,"w":4,"need":"ix","sel":"ixa","var":{"right":{"x0":610,"y0":410,"x1":690,"y1":410},"left":{"x0":690,"y0":410,"x1":610,"y1":410}},"dflt":"right","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ixt1","k":"ix","bases":[[650,378,"middle",[0,-1]],[650,442,"middle",[0,1]]],"need":"ix","vis":[],"t":"F","x":666,"y":372,"anc":"middle"},{"f":"ar","id":"iya0","x0":542,"y0":350,"x1":542,"y1":270,"w":4,"need":"iy","sel":"iya","var":{"up":{"x0":542,"y0":350,"x1":542,"y1":270},"down":{"x0":542,"y0":270,"x1":542,"y1":350}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iyt0","k":"iy","bases":[[560,310,"start",[1,0]],[524,310,"end",[-1,0]]],"need":"iy","vis":[],"t":"F","x":560,"y":310,"anc":"start"},{"f":"ar","id":"iya1","x0":542,"y0":610,"x1":542,"y1":530,"w":4,"need":"iy","sel":"iya","var":{"up":{"x0":542,"y0":610,"x1":542,"y1":530},"down":{"x0":542,"y0":530,"x1":542,"y1":610}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iyt1","k":"iy","bases":[[560,570,"start",[1,0]],[524,570,"end",[-1,0]]],"need":"iy","vis":[],"t":"F","x":560,"y":570,"anc":"start"},{"f":"ln","id":"zl","pts":[[290,670],[750,210]],"dash":1,"w":3,"need":"zl","sel":"zla","var":{"p":{"pts":[[290,670],[750,210]]},"n":{"pts":[[290,210],[750,670]]}},"dflt":"p","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"zlt","k":"zl","bases":[[760,200,"start",[1,-1]]],"vbases":{"p":[[760,200,"start",[1,-1]]],"n":[[760,680,"start",[1,1]]]},"need":"zl","sel":"zla","var":{"p":{"x":760,"y":200,"anc":"start"},"n":{"x":760,"y":680,"anc":"start"}},"dflt":"p","vis":[],"t":"F","x":760,"y":200,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s1xq(d, p, L){ tbFig_Draw(d, p, L, U52S1K.xq); }
function tbU52s1pm(d, p, L){ tbFig_Draw(d, p, L, U52S1K.pm); }
function tbU52s1xy(d, p, L){ tbFig_Draw(d, p, L, U52S1K.xy); }
// ---- 52-2 辺ごとの磁界を足して比べる の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S2K = {
  sc: {"vars":[],"items":[{"f":"ln","id":"sq","pts":[[280,220],[680,220],[680,620],[280,620]],"w":6,"close":1,"vis":[],"t":"F"},{"f":"c","id":"o1d","cx":480,"cy":420,"r":9,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"o1t","k":"o1","bases":[[480,476,"middle",[0,1]],[504,460,"start",[1,1]]],"need":"o1","vis":[],"t":"F","x":480,"y":476,"anc":"middle"},{"f":"ln","id":"ae1","pts":[[274,220],[206,220]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ln","id":"ae2","pts":[[274,620],[206,620]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ar","id":"ad","x0":220,"y0":220,"x1":220,"y1":620,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[204,420,"end",[-1,0]],[236,420,"start",[1,0]]],"need":"a","vis":[],"t":"F","x":204,"y":420,"anc":"end"},{"f":"ar","id":"ia","x0":435,"y0":186,"x1":525,"y1":186,"w":4,"need":"i","sel":"ia","var":{"right":{"x0":435,"y0":186,"x1":525,"y1":186},"left":{"x0":525,"y0":186,"x1":435,"y1":186}},"dflt":"right","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[480,154,"middle",[0,-1]],[480,218,"middle",[0,1]]],"need":"i","vis":[],"t":"F","x":480,"y":148,"anc":"middle"},{"t":"cap","id":"u52s2sccap0","x":428.5,"y":686.7,"s":"図1","vis":[]},{"f":"ln","id":"clx1","pts":[[1188,420.5],[1187.2,438.8],[1184.81,456.97],[1180.84,474.85],[1175.34,492.32],[1168.32,509.25],[1159.87,525.5],[1150.02,540.95],[1138.87,555.49],[1126.49,568.99],[1112.99,581.37],[1098.45,592.52],[1083,602.37],[1066.75,610.82],[1049.82,617.84],[1032.35,623.34],[1014.47,627.31],[996.3,629.7],[978,630.5],[959.7,629.7],[941.53,627.31],[923.65,623.34],[906.18,617.84],[889.25,610.82],[873,602.37],[857.55,592.52],[843.01,581.37],[829.51,568.99],[817.13,555.49],[805.98,540.95],[796.13,525.5],[787.68,509.25],[780.66,492.32],[775.16,474.85],[771.19,456.97],[768.8,438.8],[768,420.5],[768.8,402.2],[771.19,384.03],[775.16,366.15],[780.66,348.68],[787.68,331.75],[796.13,315.5],[805.98,300.05],[817.13,285.51],[829.51,272.01],[843.01,259.63],[857.55,248.48],[873,238.63],[889.25,230.18],[906.18,223.16],[923.65,217.66],[941.53,213.69],[959.7,211.3],[978,210.5],[996.3,211.3],[1014.47,213.69],[1032.35,217.66],[1049.82,223.16],[1066.75,230.18],[1083,238.63],[1098.45,248.48],[1112.99,259.63],[1126.49,272.01],[1138.87,285.51],[1150.02,300.05],[1159.87,315.5],[1168.32,331.75],[1175.34,348.68],[1180.84,366.15],[1184.81,384.03],[1187.2,402.2],[1188,420.5]],"w":6,"vis":[],"t":"F"},{"f":"c","id":"o2dx1","cx":978,"cy":420.5,"r":9,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"o2tx1","k":"o2","bases":[[998,470.5,"start",[0.3,1]],[1018,440.5,"start",[1,0.3]]],"need":"o2","vis":[],"t":"F","x":998,"y":470.5,"anc":"start","n":"o2x1"},{"f":"ar","id":"adx1","x0":832.34,"y0":566.16,"x1":1123.66,"y1":274.84,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"atx1","k":"a","bases":[[954,364.5,"end",[-1,-1]],[954,310.5,"end",[-1,-1]],[1038,330.5,"start",[1,-1]]],"need":"a","vis":[],"t":"F","x":954,"y":364.5,"anc":"end","n":"ax1"},{"f":"ar","id":"iax1","x0":933,"y0":176.5,"x1":1023,"y1":176.5,"w":4,"need":"i","sel":"ia","var":{"right":{"x0":933,"y0":176.5,"x1":1023,"y1":176.5},"left":{"x0":1023,"y0":176.5,"x1":933,"y1":176.5}},"dflt":"right","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"itx1","k":"i","bases":[[978,144.5,"middle",[0,-1]],[978,208.5,"middle",[0,1]]],"need":"i","vis":[],"t":"F","x":978,"y":138.5,"anc":"middle","n":"ix1"},{"t":"cap","id":"u52s2sccap1","x":978,"y":686.7,"s":"図2","vis":[]}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s2sc(d, p, L){ tbFig_Draw(d, p, L, U52S2K.sc); }
// ---- 52-3 四角いループに働く力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S3K = {
  ws: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[260,170],[260,710]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"wad0","pts":[[260,110],[260,165]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"wad1","pts":[[260,715],[260,770]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[284,210,"start",[1,-1]],[236,210,"end",[-1,-1]]],"need":"wa","vis":[],"t":"F","x":284,"y":210,"anc":"start"},{"f":"ar","id":"iaa","x0":286,"y0":385,"x1":286,"y1":495,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":286,"y0":495,"x1":286,"y1":385},"down":{"x0":286,"y0":385,"x1":286,"y1":495}},"dflt":"down","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[304,440,"start",[1,0]],[268,440,"end",[-1,0]]],"need":"ia","vis":[],"t":"F","x":304,"y":440,"anc":"start"},{"f":"ln","id":"wb","pts":[[480,300],[760,300],[760,580],[480,580]],"w":5,"close":1,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[620,260,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":620,"y":260,"anc":"middle"},{"f":"ar","id":"iba","x0":514,"y0":490,"x1":514,"y1":390,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":514,"y0":490,"x1":514,"y1":390},"down":{"x0":514,"y0":390,"x1":514,"y1":490}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[532,440,"start",[1,0]],[496,440,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":532,"y":440,"anc":"start"},{"f":"ln","id":"de1","pts":[[260,592],[260,694]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[480,592],[480,694]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":260,"y0":680,"x1":480,"y1":680,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[370,720,"middle",[0,1]],[370,640,"middle",[0,-1]]],"need":"d","vis":[],"t":"F","x":370,"y":720,"anc":"middle"},{"f":"ln","id":"ae1","pts":[[480,592],[480,694]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ln","id":"ae2","pts":[[760,592],[760,694]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ar","id":"ad","x0":480,"y0":680,"x1":760,"y1":680,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[620,720,"middle",[0,1]],[620,640,"middle",[0,-1]]],"need":"a","vis":[],"t":"F","x":620,"y":726,"anc":"middle"},{"f":"ln","id":"a2e1","pts":[[766,300],[844,300]],"w":2,"need":"a2","vis":[],"t":"F"},{"f":"ln","id":"a2e2","pts":[[766,580],[844,580]],"w":2,"need":"a2","vis":[],"t":"F"},{"f":"ar","id":"a2d","x0":830,"y0":300,"x1":830,"y1":580,"two":1,"w":2,"need":"a2","vis":[],"t":"F"},{"f":"lb","id":"a2t","k":"a2","bases":[[846,440,"start",[1,0]],[814,440,"end",[-1,0]]],"need":"a2","vis":[],"t":"F","x":846,"y":440,"anc":"start"},{"f":"ar","id":"fna","x0":472,"y0":530,"x1":360,"y1":530,"w":5,"need":"fn","sel":"fna","var":{"right":{"x0":488,"y0":530,"x1":600,"y1":530},"left":{"x0":472,"y0":530,"x1":360,"y1":530}},"dflt":"left","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"fnt","k":"fn","bases":[[416,498,"middle",[0,-1]]],"vbases":{"right":[[544,498,"middle",[0,-1]]],"left":[[416,498,"middle",[0,-1]]]},"need":"fn","sel":"fna","var":{"right":{"x":552,"y":498,"anc":"middle"},"left":{"x":416,"y":498,"anc":"middle"}},"dflt":"left","vis":[],"t":"F","x":416,"y":498,"anc":"middle"},{"f":"ar","id":"ffa","x0":752,"y0":530,"x1":640,"y1":530,"w":5,"need":"ff","sel":"ffa","var":{"right":{"x0":768,"y0":530,"x1":880,"y1":530},"left":{"x0":752,"y0":530,"x1":640,"y1":530}},"dflt":"left","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"fft","k":"ff","bases":[[696,498,"middle",[0,-1]]],"vbases":{"right":[[824,498,"middle",[0,-1]]],"left":[[696,498,"middle",[0,-1]]]},"need":"ff","sel":"ffa","var":{"right":{"x":798,"y":498,"anc":"middle"},"left":{"x":696,"y":498,"anc":"middle"}},"dflt":"left","vis":[],"t":"F","x":696,"y":498,"anc":"middle"},{"f":"ar","id":"fta","x0":653.6,"y0":292,"x1":653.6,"y1":190,"w":5,"need":"ft","sel":"fta","var":{"up":{"x0":653.6,"y0":292,"x1":653.6,"y1":190},"down":{"x0":653.6,"y0":308,"x1":653.6,"y1":410}},"dflt":"up","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ftt","k":"ft","bases":[[671.6,240,"start",[1,0]]],"vbases":{"up":[[671.6,240,"start",[1,0]]],"down":[[671.6,360,"start",[1,0]]]},"need":"ft","sel":"fta","var":{"up":{"x":671.6,"y":240,"anc":"start"},"down":{"x":671.6,"y":360,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":671.6,"y":240,"anc":"start"},{"f":"ar","id":"fba","x0":653.6,"y0":588,"x1":653.6,"y1":690,"w":5,"need":"fb","sel":"fba","var":{"up":{"x0":653.6,"y0":572,"x1":653.6,"y1":470},"down":{"x0":653.6,"y0":588,"x1":653.6,"y1":690}},"dflt":"down","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"fbt","k":"fb","bases":[[671.6,640,"start",[1,0]]],"vbases":{"up":[[671.6,520,"start",[1,0]]],"down":[[671.6,640,"start",[1,0]]]},"need":"fb","sel":"fba","var":{"up":{"x":671.6,"y":444,"anc":"start"},"down":{"x":671.6,"y":640,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":671.6,"y":640,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  wx: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[260,170],[260,710]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"wad0","pts":[[260,110],[260,165]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"wad1","pts":[[260,715],[260,770]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[284,210,"start",[1,-1]],[236,210,"end",[-1,-1]]],"need":"wa","vis":[],"t":"F","x":284,"y":210,"anc":"start"},{"f":"ar","id":"iaa","x0":286,"y0":385,"x1":286,"y1":495,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":286,"y0":495,"x1":286,"y1":385},"down":{"x0":286,"y0":385,"x1":286,"y1":495}},"dflt":"down","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[304,440,"start",[1,0]],[268,440,"end",[-1,0]]],"need":"ia","vis":[],"t":"F","x":304,"y":440,"anc":"start"},{"f":"ln","id":"wb","pts":[[480,300],[760,300],[760,580],[480,580]],"w":5,"close":1,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[620,260,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":620,"y":260,"anc":"middle"},{"f":"ar","id":"iba","x0":514,"y0":490,"x1":514,"y1":390,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":514,"y0":490,"x1":514,"y1":390},"down":{"x0":514,"y0":390,"x1":514,"y1":490}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[532,440,"start",[1,0]],[496,440,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":532,"y":440,"anc":"start"},{"f":"ln","id":"de1","pts":[[260,592],[260,694]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[480,592],[480,694]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":260,"y0":680,"x1":480,"y1":680,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[370,720,"middle",[0,1]],[370,640,"middle",[0,-1]]],"need":"d","vis":[],"t":"F","x":370,"y":720,"anc":"middle"},{"f":"ln","id":"ae1","pts":[[480,592],[480,694]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ln","id":"ae2","pts":[[760,592],[760,694]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ar","id":"ad","x0":480,"y0":680,"x1":760,"y1":680,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[620,720,"middle",[0,1]],[620,640,"middle",[0,-1]]],"need":"a","vis":[],"t":"F","x":620,"y":726,"anc":"middle"},{"f":"ln","id":"a2e1","pts":[[766,300],[844,300]],"w":2,"need":"a2","vis":[],"t":"F"},{"f":"ln","id":"a2e2","pts":[[766,580],[844,580]],"w":2,"need":"a2","vis":[],"t":"F"},{"f":"ar","id":"a2d","x0":830,"y0":300,"x1":830,"y1":580,"two":1,"w":2,"need":"a2","vis":[],"t":"F"},{"f":"lb","id":"a2t","k":"a2","bases":[[846,440,"start",[1,0]],[814,440,"end",[-1,0]]],"need":"a2","vis":[],"t":"F","x":846,"y":440,"anc":"start"},{"f":"ar","id":"fna","x0":472,"y0":530,"x1":360,"y1":530,"w":5,"need":"fn","sel":"fna","var":{"right":{"x0":488,"y0":530,"x1":600,"y1":530},"left":{"x0":472,"y0":530,"x1":360,"y1":530}},"dflt":"left","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"fnt","k":"fn","bases":[[416,498,"middle",[0,-1]]],"vbases":{"right":[[544,498,"middle",[0,-1]]],"left":[[416,498,"middle",[0,-1]]]},"need":"fn","sel":"fna","var":{"right":{"x":552,"y":492,"anc":"middle"},"left":{"x":416,"y":492,"anc":"middle"}},"dflt":"left","vis":[],"t":"F","x":416,"y":498,"anc":"middle"},{"f":"ar","id":"ffa","x0":752,"y0":530,"x1":640,"y1":530,"w":5,"need":"ff","sel":"ffa","var":{"right":{"x0":768,"y0":530,"x1":880,"y1":530},"left":{"x0":752,"y0":530,"x1":640,"y1":530}},"dflt":"left","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"fft","k":"ff","bases":[[696,498,"middle",[0,-1]]],"vbases":{"right":[[824,498,"middle",[0,-1]]],"left":[[696,498,"middle",[0,-1]]]},"need":"ff","sel":"ffa","var":{"right":{"x":880,"y":492,"anc":"middle"},"left":{"x":696,"y":492,"anc":"middle"}},"dflt":"left","vis":[],"t":"F","x":696,"y":498,"anc":"middle"},{"f":"ar","id":"fta","x0":653.6,"y0":292,"x1":653.6,"y1":190,"w":5,"need":"ft","sel":"fta","var":{"up":{"x0":653.6,"y0":292,"x1":653.6,"y1":190},"down":{"x0":653.6,"y0":308,"x1":653.6,"y1":410}},"dflt":"up","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ftt","k":"ft","bases":[[671.6,240,"start",[1,0]]],"vbases":{"up":[[671.6,240,"start",[1,0]]],"down":[[671.6,360,"start",[1,0]]]},"need":"ft","sel":"fta","var":{"up":{"x":671.6,"y":240,"anc":"start"},"down":{"x":671.6,"y":360,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":671.6,"y":240,"anc":"start"},{"f":"ar","id":"fba","x0":653.6,"y0":588,"x1":653.6,"y1":690,"w":5,"need":"fb","sel":"fba","var":{"up":{"x0":653.6,"y0":572,"x1":653.6,"y1":470},"down":{"x0":653.6,"y0":588,"x1":653.6,"y1":690}},"dflt":"down","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"fbt","k":"fb","bases":[[671.6,640,"start",[1,0]]],"vbases":{"up":[[671.6,520,"start",[1,0]]],"down":[[671.6,640,"start",[1,0]]]},"need":"fb","sel":"fba","var":{"up":{"x":671.6,"y":444,"anc":"start"},"down":{"x":671.6,"y":640,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":671.6,"y":640,"anc":"start"},{"f":"ln","id":"xyzb","pts":[[950,180],[1150,180],[1150,360],[950,360]],"dash":1,"w":2,"close":1,"vis":[],"t":"F"},{"f":"c","id":"xyzc","cx":1014,"cy":290,"r":16,"fill":"w","sign":"×","vis":[],"t":"F"},{"f":"ar","id":"xyzz","x0":1014,"y0":272,"x1":1014,"y1":206,"w":2,"vis":[],"t":"F"},{"f":"ar","id":"xyzx","x0":1032,"y0":290,"x1":1116,"y1":290,"w":2,"vis":[],"t":"F"},{"f":"tx","id":"xyzzt","x":1014,"y":194,"s":"z","anc":"middle","size":30,"vis":[],"t":"F"},{"f":"tx","id":"xyzxt","x":1132,"y":290,"s":"x","anc":"middle","size":30,"vis":[],"t":"F"},{"f":"tx","id":"xyzyt","x":992,"y":330,"s":"y","anc":"middle","size":30,"vis":[],"t":"F"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s3ws(d, p, L){ tbFig_Draw(d, p, L, U52S3K.ws); }
function tbU52s3wx(d, p, L){ tbFig_Draw(d, p, L, U52S3K.wx); }
// ---- 52-4 ファラデーの法則と自己誘導を等しく置く の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S4K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":139,"y":290,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s4tr(d, p, L){ tbFig_Draw(d, p, L, U52S4K.tr); }
// ---- 52-5 エアギャップのある磁気回路の巻数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S5K = {
  cg: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"gapc","pts":[[760,404],[760,436]],"w":80,"o":["gapd"],"col":"#ffffff","vis":[],"t":"F"},{"f":"lb","id":"gapt","k":"gap","bases":[[818,360,"start",[1,-1]]],"need":"gap","vis":[],"t":"F","x":812.34,"y":354.34,"anc":"start"},{"f":"ar","id":"gld","x0":838,"y0":404,"x1":838,"y1":436,"two":1,"w":2,"need":"gl","vis":[],"t":"F"},{"f":"lb","id":"glt","k":"gl","bases":[[858,440,"start",[1,0]]],"need":"gl","vis":[],"t":"F","x":858,"y":440,"anc":"start"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":56,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":147,"y":276,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":142,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":508,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":142,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":698,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s5cg(d, p, L){ tbFig_Draw(d, p, L, U52S5K.cg); }
// ---- 52-6 和動と差動の2つの測定 の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S6K = {
  rr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[710,440],[709.43,453.07],[707.72,466.05],[704.89,478.82],[700.95,491.3],[695.95,503.39],[689.9,515],[682.87,526.04],[674.91,536.42],[666.07,546.07],[656.42,554.91],[646.04,562.87],[635,569.9],[623.39,575.95],[611.3,580.95],[598.82,584.89],[586.05,587.72],[573.07,589.43],[560,590],[546.93,589.43],[533.95,587.72],[521.18,584.89],[508.7,580.95],[496.61,575.95],[485,569.9],[473.96,562.87],[463.58,554.91],[453.93,546.07],[445.09,536.42],[437.13,526.04],[430.1,515],[424.05,503.39],[419.05,491.3],[415.11,478.82],[412.28,466.05],[410.57,453.07],[410,440],[410.57,426.93],[412.28,413.95],[415.11,401.18],[419.05,388.7],[424.05,376.61],[430.1,365],[437.13,353.96],[445.09,343.58],[453.93,333.93],[463.58,325.09],[473.96,317.13],[485,310.1],[496.61,304.05],[508.7,299.05],[521.18,295.11],[533.95,292.28],[546.93,290.57],[560,290],[573.07,290.57],[586.05,292.28],[598.82,295.11],[611.3,299.05],[623.39,304.05],[635,310.1],[646.04,317.13],[656.42,325.09],[666.07,333.93],[674.91,343.58],[682.87,353.96],[689.9,365],[695.95,376.61],[700.95,388.7],[704.89,401.18],[707.72,413.95],[709.43,426.93],[710,440]],"w":64,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"co","pts":[[742,440],[741.31,455.86],[739.24,471.6],[735.8,487.11],[731.02,502.25],[724.95,516.92],[717.62,531],[709.09,544.39],[699.42,556.99],[688.69,568.69],[676.99,579.42],[664.39,589.09],[651,597.62],[636.92,604.95],[622.25,611.02],[607.11,615.8],[591.6,619.24],[575.86,621.31],[560,622],[544.14,621.31],[528.4,619.24],[512.89,615.8],[497.75,611.02],[483.08,604.95],[469,597.62],[455.61,589.09],[443.01,579.42],[431.31,568.69],[420.58,556.99],[410.91,544.39],[402.38,531],[395.05,516.92],[388.98,502.25],[384.2,487.11],[380.76,471.6],[378.69,455.86],[378,440],[378.69,424.14],[380.76,408.4],[384.2,392.89],[388.98,377.75],[395.05,363.08],[402.38,349],[410.91,335.61],[420.58,323.01],[431.31,311.31],[443.01,300.58],[455.61,290.91],[469,282.38],[483.08,275.05],[497.75,268.98],[512.89,264.2],[528.4,260.76],[544.14,258.69],[560,258],[575.86,258.69],[591.6,260.76],[607.11,264.2],[622.25,268.98],[636.92,275.05],[651,282.38],[664.39,290.91],[676.99,300.58],[688.69,311.31],[699.42,323.01],[709.09,335.61],[717.62,349],[724.95,363.08],[731.02,377.75],[735.8,392.89],[739.24,408.4],[741.31,424.14],[742,440]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"ci","pts":[[678,440],[677.55,450.28],[676.21,460.49],[673.98,470.54],[670.88,480.36],[666.94,489.87],[662.19,499],[656.66,507.68],[650.39,515.85],[643.44,523.44],[635.85,530.39],[627.68,536.66],[619,542.19],[609.87,546.94],[600.36,550.88],[590.54,553.98],[580.49,556.21],[570.28,557.55],[560,558],[549.72,557.55],[539.51,556.21],[529.46,553.98],[519.64,550.88],[510.13,546.94],[501,542.19],[492.32,536.66],[484.15,530.39],[476.56,523.44],[469.61,515.85],[463.34,507.68],[457.81,499],[453.06,489.87],[449.12,480.36],[446.02,470.54],[443.79,460.49],[442.45,450.28],[442,440],[442.45,429.72],[443.79,419.51],[446.02,409.46],[449.12,399.64],[453.06,390.13],[457.81,381],[463.34,372.32],[469.61,364.15],[476.56,356.56],[484.15,349.61],[492.32,343.34],[501,337.81],[510.13,333.06],[519.64,329.12],[529.46,326.02],[539.51,323.79],[549.72,322.45],[560,322],[570.28,322.45],[580.49,323.79],[590.54,326.02],[600.36,329.12],[609.87,333.06],[619,337.81],[627.68,343.34],[635.85,349.61],[643.44,356.56],[650.39,364.15],[656.66,372.32],[662.19,381],[666.94,390.13],[670.88,399.64],[673.98,409.46],[676.21,419.51],[677.55,429.72],[678,440]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"cld","pts":[[497.75,611.02],[457.75,701.02]],"w":2,"need":"core","vis":[],"t":"F"},{"f":"lb","id":"coret","k":"core","bases":[[457.75,731.02,"middle",[0,1]]],"need":"core","vis":[],"t":"F","x":457.75,"y":731.02,"anc":"middle"},{"f":"ln","id":"w10","pts":[[370,386],[450,398]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w11","pts":[[370,410],[450,422]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w12","pts":[[370,434],[450,446]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w13","pts":[[370,458],[450,470]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w14","pts":[[370,482],[450,494]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"n1t","k":"n1","bases":[[348,440,"end",[-1,0]],[346,338,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":348,"y":440,"anc":"end"},{"f":"lb","id":"l1t","k":"l1","bases":[[410,214,"middle",[0,-1]],[370,214,"end",[-1,-1]]],"need":"l1","vis":[],"t":"F","x":410,"y":214,"anc":"middle"},{"f":"ln","id":"w20","pts":[[670,386],[750,398]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w21","pts":[[670,410],[750,422]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w22","pts":[[670,434],[750,446]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w23","pts":[[670,458],[750,470]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w24","pts":[[670,482],[750,494]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"n2t","k":"n2","bases":[[772,440,"start",[1,0]],[774,338,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":772,"y":440,"anc":"start"},{"f":"lb","id":"l2t","k":"l2","bases":[[710,214,"middle",[0,-1]],[750,214,"start",[1,-1]]],"need":"l2","vis":[],"t":"F","x":710,"y":214,"anc":"middle"},{"f":"ln","id":"lda","pts":[[370,386],[230,386],[230,782],[482,782]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tma","cx":490,"cy":782,"r":8,"fill":"w","vis":[],"t":"F"},{"f":"lb","id":"tat","k":"ta","bases":[[490,818,"middle",[0,1]]],"need":"ta","vis":[],"t":"F","x":490,"y":838,"anc":"middle"},{"f":"ln","id":"ldm","pts":[[370,494],[290,494],[290,692],[830,692],[830,494],[750,494]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ldb","pts":[[750,386],[890,386],[890,782],[638,782]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tmb","cx":630,"cy":782,"r":8,"fill":"w","vis":[],"t":"F"},{"f":"lb","id":"tbt","k":"tb","bases":[[630,818,"middle",[0,1]]],"need":"tb","vis":[],"t":"F","x":630,"y":838,"anc":"middle"},{"f":"c","id":"e1t","cx":320,"cy":386,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"e1b","cx":320,"cy":494,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"e2t","cx":800,"cy":386,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"e2b","cx":800,"cy":494,"r":7,"fill":"w","vis":[],"t":"F"},{"t":"cap","id":"u52s6rrcap0","x":560,"y":952.78,"s":"図1","vis":[]},{"f":"ln","id":"corex1","pts":[[1458,440],[1457.43,453.07],[1455.72,466.05],[1452.89,478.82],[1448.95,491.3],[1443.95,503.39],[1437.9,515],[1430.87,526.04],[1422.91,536.42],[1414.07,546.07],[1404.42,554.91],[1394.04,562.87],[1383,569.9],[1371.39,575.95],[1359.3,580.95],[1346.82,584.89],[1334.05,587.72],[1321.07,589.43],[1308,590],[1294.93,589.43],[1281.95,587.72],[1269.18,584.89],[1256.7,580.95],[1244.61,575.95],[1233,569.9],[1221.96,562.87],[1211.58,554.91],[1201.93,546.07],[1193.09,536.42],[1185.13,526.04],[1178.1,515],[1172.05,503.39],[1167.05,491.3],[1163.11,478.82],[1160.28,466.05],[1158.57,453.07],[1158,440],[1158.57,426.93],[1160.28,413.95],[1163.11,401.18],[1167.05,388.7],[1172.05,376.61],[1178.1,365],[1185.13,353.96],[1193.09,343.58],[1201.93,333.93],[1211.58,325.09],[1221.96,317.13],[1233,310.1],[1244.61,304.05],[1256.7,299.05],[1269.18,295.11],[1281.95,292.28],[1294.93,290.57],[1308,290],[1321.07,290.57],[1334.05,292.28],[1346.82,295.11],[1359.3,299.05],[1371.39,304.05],[1383,310.1],[1394.04,317.13],[1404.42,325.09],[1414.07,333.93],[1422.91,343.58],[1430.87,353.96],[1437.9,365],[1443.95,376.61],[1448.95,388.7],[1452.89,401.18],[1455.72,413.95],[1457.43,426.93],[1458,440]],"w":64,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cox1","pts":[[1490,440],[1489.31,455.86],[1487.24,471.6],[1483.8,487.11],[1479.02,502.25],[1472.95,516.92],[1465.62,531],[1457.09,544.39],[1447.42,556.99],[1436.69,568.69],[1424.99,579.42],[1412.39,589.09],[1399,597.62],[1384.92,604.95],[1370.25,611.02],[1355.11,615.8],[1339.6,619.24],[1323.86,621.31],[1308,622],[1292.14,621.31],[1276.4,619.24],[1260.89,615.8],[1245.75,611.02],[1231.08,604.95],[1217,597.62],[1203.61,589.09],[1191.01,579.42],[1179.31,568.69],[1168.58,556.99],[1158.91,544.39],[1150.38,531],[1143.05,516.92],[1136.98,502.25],[1132.2,487.11],[1128.76,471.6],[1126.69,455.86],[1126,440],[1126.69,424.14],[1128.76,408.4],[1132.2,392.89],[1136.98,377.75],[1143.05,363.08],[1150.38,349],[1158.91,335.61],[1168.58,323.01],[1179.31,311.31],[1191.01,300.58],[1203.61,290.91],[1217,282.38],[1231.08,275.05],[1245.75,268.98],[1260.89,264.2],[1276.4,260.76],[1292.14,258.69],[1308,258],[1323.86,258.69],[1339.6,260.76],[1355.11,264.2],[1370.25,268.98],[1384.92,275.05],[1399,282.38],[1412.39,290.91],[1424.99,300.58],[1436.69,311.31],[1447.42,323.01],[1457.09,335.61],[1465.62,349],[1472.95,363.08],[1479.02,377.75],[1483.8,392.89],[1487.24,408.4],[1489.31,424.14],[1490,440]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"cix1","pts":[[1426,440],[1425.55,450.28],[1424.21,460.49],[1421.98,470.54],[1418.88,480.36],[1414.94,489.87],[1410.19,499],[1404.66,507.68],[1398.39,515.85],[1391.44,523.44],[1383.85,530.39],[1375.68,536.66],[1367,542.19],[1357.87,546.94],[1348.36,550.88],[1338.54,553.98],[1328.49,556.21],[1318.28,557.55],[1308,558],[1297.72,557.55],[1287.51,556.21],[1277.46,553.98],[1267.64,550.88],[1258.13,546.94],[1249,542.19],[1240.32,536.66],[1232.15,530.39],[1224.56,523.44],[1217.61,515.85],[1211.34,507.68],[1205.81,499],[1201.06,489.87],[1197.12,480.36],[1194.02,470.54],[1191.79,460.49],[1190.45,450.28],[1190,440],[1190.45,429.72],[1191.79,419.51],[1194.02,409.46],[1197.12,399.64],[1201.06,390.13],[1205.81,381],[1211.34,372.32],[1217.61,364.15],[1224.56,356.56],[1232.15,349.61],[1240.32,343.34],[1249,337.81],[1258.13,333.06],[1267.64,329.12],[1277.46,326.02],[1287.51,323.79],[1297.72,322.45],[1308,322],[1318.28,322.45],[1328.49,323.79],[1338.54,326.02],[1348.36,329.12],[1357.87,333.06],[1367,337.81],[1375.68,343.34],[1383.85,349.61],[1391.44,356.56],[1398.39,364.15],[1404.66,372.32],[1410.19,381],[1414.94,390.13],[1418.88,399.64],[1421.98,409.46],[1424.21,419.51],[1425.55,429.72],[1426,440]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"cldx1","pts":[[1245.75,611.02],[1205.75,701.02]],"w":2,"need":"core","vis":[],"t":"F"},{"f":"lb","id":"coretx1","k":"core","bases":[[1205.75,731.02,"middle",[0,1]]],"need":"core","vis":[],"t":"F","x":1205.75,"y":731.02,"anc":"middle","n":"corex1"},{"f":"ln","id":"w10x1","pts":[[1118,386],[1198,398]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w11x1","pts":[[1118,410],[1198,422]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w12x1","pts":[[1118,434],[1198,446]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w13x1","pts":[[1118,458],[1198,470]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w14x1","pts":[[1118,482],[1198,494]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"n1tx1","k":"n1","bases":[[1096,440,"end",[-1,0]],[1094,338,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":1096,"y":440,"anc":"end","n":"n1x1"},{"f":"lb","id":"l1tx1","k":"l1","bases":[[1158,214,"middle",[0,-1]],[1118,214,"end",[-1,-1]]],"need":"l1","vis":[],"t":"F","x":1158,"y":214,"anc":"middle","n":"l1x1"},{"f":"ln","id":"w20x1","pts":[[1418,386],[1498,398]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w21x1","pts":[[1418,410],[1498,422]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w22x1","pts":[[1418,434],[1498,446]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w23x1","pts":[[1418,458],[1498,470]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"w24x1","pts":[[1418,482],[1498,494]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"n2tx1","k":"n2","bases":[[1520,440,"start",[1,0]],[1522,338,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":1520,"y":440,"anc":"start","n":"n2x1"},{"f":"lb","id":"l2tx1","k":"l2","bases":[[1458,214,"middle",[0,-1]],[1498,214,"start",[1,-1]]],"need":"l2","vis":[],"t":"F","x":1458,"y":214,"anc":"middle","n":"l2x1"},{"f":"ln","id":"ldax1","pts":[[1118,386],[978,386],[978,782],[1230,782]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tmax1","cx":1238,"cy":782,"r":8,"fill":"w","vis":[],"t":"F"},{"f":"lb","id":"tctx1","k":"tc","bases":[[1238,818,"middle",[0,1]]],"need":"tc","vis":[],"t":"F","x":1238,"y":838,"anc":"middle","n":"tcx1"},{"f":"ln","id":"ldmx1","pts":[[1118,494],[1038,494],[1038,692],[1638,692],[1638,386],[1498,386]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ldbx1","pts":[[1498,494],[1578,494],[1578,782],[1386,782]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tmbx1","cx":1378,"cy":782,"r":8,"fill":"w","vis":[],"t":"F"},{"f":"lb","id":"tdtx1","k":"td","bases":[[1378,818,"middle",[0,1]]],"need":"td","vis":[],"t":"F","x":1378,"y":838,"anc":"middle","n":"tdx1"},{"f":"c","id":"e1tx1","cx":1068,"cy":386,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"e1bx1","cx":1068,"cy":494,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"e2tx1","cx":1548,"cy":386,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"e2bx1","cx":1548,"cy":494,"r":7,"fill":"w","vis":[],"t":"F"},{"t":"cap","id":"u52s6rrcap1","x":1308,"y":952.78,"s":"図2","vis":[]}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s6rr(d, p, L){ tbFig_Draw(d, p, L, U52S6K.rr); }
// ---- 52-7 鉄心の透磁率を逆に出す の図（※ textbook/gen/make_section.py が textbook/gen/data/u52_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U52S7K = {
  tu: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[740,430],[739.39,443.94],[737.57,457.78],[734.55,471.41],[730.35,484.72],[725.01,497.62],[718.56,510],[711.06,521.77],[702.57,532.85],[693.14,543.14],[682.85,552.57],[671.77,561.06],[660,568.56],[647.62,575.01],[634.72,580.35],[621.41,584.55],[607.78,587.57],[593.94,589.39],[580,590],[566.06,589.39],[552.22,587.57],[538.59,584.55],[525.28,580.35],[512.38,575.01],[500,568.56],[488.23,561.06],[477.15,552.57],[466.86,543.14],[457.43,532.85],[448.94,521.77],[441.44,510],[434.99,497.62],[429.65,484.72],[425.45,471.41],[422.43,457.78],[420.61,443.94],[420,430],[420.61,416.06],[422.43,402.22],[425.45,388.59],[429.65,375.28],[434.99,362.38],[441.44,350],[448.94,338.23],[457.43,327.15],[466.86,316.86],[477.15,307.43],[488.23,298.94],[500,291.44],[512.38,284.99],[525.28,279.65],[538.59,275.45],[552.22,272.43],[566.06,270.61],[580,270],[593.94,270.61],[607.78,272.43],[621.41,275.45],[634.72,279.65],[647.62,284.99],[660,291.44],[671.77,298.94],[682.85,307.43],[693.14,316.86],[702.57,327.15],[711.06,338.23],[718.56,350],[725.01,362.38],[730.35,375.28],[734.55,388.59],[737.57,402.22],[739.39,416.06],[740,430]],"w":80,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"co","pts":[[780,430],[779.24,447.43],[776.96,464.73],[773.19,481.76],[767.94,498.4],[761.26,514.52],[753.21,530],[743.83,544.72],[733.21,558.56],[721.42,571.42],[708.56,583.21],[694.72,593.83],[680,603.21],[664.52,611.26],[648.4,617.94],[631.76,623.19],[614.73,626.96],[597.43,629.24],[580,630],[562.57,629.24],[545.27,626.96],[528.24,623.19],[511.6,617.94],[495.48,611.26],[480,603.21],[465.28,593.83],[451.44,583.21],[438.58,571.42],[426.79,558.56],[416.17,544.72],[406.79,530],[398.74,514.52],[392.06,498.4],[386.81,481.76],[383.04,464.73],[380.76,447.43],[380,430],[380.76,412.57],[383.04,395.27],[386.81,378.24],[392.06,361.6],[398.74,345.48],[406.79,330],[416.17,315.28],[426.79,301.44],[438.58,288.58],[451.44,276.79],[465.28,266.17],[480,256.79],[495.48,248.74],[511.6,242.06],[528.24,236.81],[545.27,233.04],[562.57,230.76],[580,230],[597.43,230.76],[614.73,233.04],[631.76,236.81],[648.4,242.06],[664.52,248.74],[680,256.79],[694.72,266.17],[708.56,276.79],[721.42,288.58],[733.21,301.44],[743.83,315.28],[753.21,330],[761.26,345.48],[767.94,361.6],[773.19,378.24],[776.96,395.27],[779.24,412.57],[780,430]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"ci","pts":[[700,430],[699.54,440.46],[698.18,450.84],[695.91,461.06],[692.76,471.04],[688.76,480.71],[683.92,490],[678.3,498.83],[671.93,507.13],[664.85,514.85],[657.13,521.93],[648.83,528.3],[640,533.92],[630.71,538.76],[621.04,542.76],[611.06,545.91],[600.84,548.18],[590.46,549.54],[580,550],[569.54,549.54],[559.16,548.18],[548.94,545.91],[538.96,542.76],[529.29,538.76],[520,533.92],[511.17,528.3],[502.87,521.93],[495.15,514.85],[488.07,507.13],[481.7,498.83],[476.08,490],[471.24,480.71],[467.24,471.04],[464.09,461.06],[461.82,450.84],[460.46,440.46],[460,430],[460.46,419.54],[461.82,409.16],[464.09,398.94],[467.24,388.96],[471.24,379.29],[476.08,370],[481.7,361.17],[488.07,352.87],[495.15,345.15],[502.87,338.07],[511.17,331.7],[520,326.08],[529.29,321.24],[538.96,317.24],[548.94,314.09],[559.16,311.82],[569.54,310.46],[580,310],[590.46,310.46],[600.84,311.82],[611.06,314.09],[621.04,317.24],[630.71,321.24],[640,326.08],[648.83,331.7],[657.13,338.07],[664.85,345.15],[671.93,352.87],[678.3,361.17],[683.92,370],[688.76,379.29],[692.76,388.96],[695.91,398.94],[698.18,409.16],[699.54,419.54],[700,430]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"ll","pts":[[740,430],[739.39,443.94],[737.57,457.78],[734.55,471.41],[730.35,484.72],[725.01,497.62],[718.56,510],[711.06,521.77],[702.57,532.85],[693.14,543.14],[682.85,552.57],[671.77,561.06],[660,568.56],[647.62,575.01],[634.72,580.35],[621.41,584.55],[607.78,587.57],[593.94,589.39],[580,590],[566.06,589.39],[552.22,587.57],[538.59,584.55],[525.28,580.35],[512.38,575.01],[500,568.56],[488.23,561.06],[477.15,552.57],[466.86,543.14],[457.43,532.85],[448.94,521.77],[441.44,510],[434.99,497.62],[429.65,484.72],[425.45,471.41],[422.43,457.78],[420.61,443.94],[420,430],[420.61,416.06],[422.43,402.22],[425.45,388.59],[429.65,375.28],[434.99,362.38],[441.44,350],[448.94,338.23],[457.43,327.15],[466.86,316.86],[477.15,307.43],[488.23,298.94],[500,291.44],[512.38,284.99],[525.28,279.65],[538.59,275.45],[552.22,272.43],[566.06,270.61],[580,270],[593.94,270.61],[607.78,272.43],[621.41,275.45],[634.72,279.65],[647.62,284.99],[660,291.44],[671.77,298.94],[682.85,307.43],[693.14,316.86],[702.57,327.15],[711.06,338.23],[718.56,350],[725.01,362.38],[730.35,375.28],[734.55,388.59],[737.57,402.22],[739.39,416.06],[740,430]],"dash":1,"w":3,"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"ln","id":"lld","pts":[[734.55,471.41],[884.55,511.41]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[894.55,511.41,"start",[1,0]],[894.55,561.41,"start",[1,1]]],"need":"l","vis":[],"t":"F","x":894.55,"y":511.41,"anc":"start"},{"f":"c","id":"sc","cx":634.72,"cy":580.35,"r":34,"fill":"area","need":"s","vis":[],"t":"F"},{"f":"ln","id":"sld","pts":[[658.72,604.35],[714.72,690.35]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[724.72,700.35,"start",[1,1]],[714.72,730.35,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":724.72,"y":700.35,"anc":"start"},{"f":"ln","id":"muld","pts":[[708.56,276.79],[788.56,216.79]],"w":2,"need":"mu","vis":[],"t":"F"},{"f":"lb","id":"mut","k":"mu","bases":[[798.56,206.79,"start",[1,-1]]],"need":"mu","vis":[],"t":"F","x":798.56,"y":206.79,"anc":"start"},{"f":"lb","id":"coret","k":"core","bases":[[540,190,"end",[-1,-1]],[800,270,"start",[1,-1]]],"need":"core","vis":[],"t":"F","x":540,"y":190,"anc":"end"},{"f":"ln","id":"wd0","pts":[[492.67,356.72],[409.22,314.81]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd1","pts":[[481.27,373],[391.81,346.21]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd2","pts":[[472.88,391.01],[380.12,380.16]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd3","pts":[[467.73,410.2],[374.5,415.63]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd4","pts":[[466,430],[375.13,451.53]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd5","pts":[[467.73,449.8],[381.98,486.78]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd6","pts":[[472.88,468.99],[394.85,520.3]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd7","pts":[[481.27,487],[413.34,551.08]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd8","pts":[[492.67,503.28],[436.9,578.18]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld0","pts":[[416.17,315.28],[180,315.28]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[416.17,544.72],[180,544.72]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tm0","cx":180,"cy":315.28,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"tm1","cx":180,"cy":544.72,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"ar","id":"ia","x0":210,"y0":293.28,"x1":290,"y1":293.28,"w":3,"need":"i","sel":"ia","var":{"in":{"x0":210,"y0":293.28,"x1":290,"y1":293.28},"out":{"x0":290,"y0":293.28,"x1":210,"y1":293.28}},"dflt":"in","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[250,257.28,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":250,"y":257.28,"anc":"middle"},{"f":"lb","id":"nt","k":"n","bases":[[580,430,"middle",[0,0]],[166,430,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":580,"y":430,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[690,420],[689.35,434.82],[687.42,449.52],[684.21,464],[679.75,478.14],[674.07,491.85],[667.22,505],[659.26,517.51],[650.23,529.27],[640.21,540.21],[629.27,550.23],[617.51,559.26],[605,567.22],[591.85,574.07],[578.14,579.75],[564,584.21],[549.52,587.42],[534.82,589.35],[520,590],[505.18,589.35],[490.48,587.42],[476,584.21],[461.86,579.75],[448.15,574.07],[435,567.22],[422.49,559.26],[410.73,550.23],[399.79,540.21],[389.77,529.27],[380.74,517.51],[372.78,505],[365.93,491.85],[360.25,478.14],[355.79,464],[352.58,449.52],[350.65,434.82],[350,420],[350.65,405.18],[352.58,390.48],[355.79,376],[360.25,361.86],[365.93,348.15],[372.78,335],[380.74,322.49],[389.77,310.73],[399.79,299.79],[410.73,289.77],[422.49,280.74],[435,272.78],[448.15,265.93],[461.86,260.25],[476,255.79],[490.48,252.58],[505.18,250.65],[520,250],[534.82,250.65],[549.52,252.58],[564,255.79],[578.14,260.25],[591.85,265.93],[605,272.78],[617.51,280.74],[629.27,289.77],[640.21,299.79],[650.23,310.73],[659.26,322.49],[667.22,335],[674.07,348.15],[679.75,361.86],[684.21,376],[687.42,390.48],[689.35,405.18],[690,420]],"w":80,"col":"#ced4da","vis":[],"t":"F"},{"f":"lb","id":"coret","k":"core","bases":[[670,220,"start",[1,-1]]],"need":"core","vis":[],"t":"F","x":670,"y":220,"anc":"start"},{"f":"ln","id":"wd0","pts":[[452.32,323.34],[392.67,238.15]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd1","pts":[[436.56,336.56],[363.02,263.02]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd2","pts":[[423.34,352.32],[338.15,292.67]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd3","pts":[[413.06,370.13],[318.8,326.18]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd4","pts":[[406.02,389.46],[305.56,362.54]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd5","pts":[[402.45,409.72],[298.84,400.65]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd6","pts":[[402.45,430.28],[298.84,439.35]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd7","pts":[[406.02,450.54],[305.56,477.46]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd8","pts":[[413.06,469.87],[318.8,513.82]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd9","pts":[[423.34,487.68],[338.15,547.33]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd10","pts":[[436.56,503.44],[363.02,576.98]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd11","pts":[[452.32,516.66],[392.67,601.85]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld0","pts":[[392.67,238.15],[232.67,238.15]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[392.67,601.85],[232.67,601.85]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"nt","k":"n","bases":[[362.67,198.15,"end",[-1,-1]]],"need":"n","vis":[],"t":"F","x":362.67,"y":198.15,"anc":"end"},{"f":"ar","id":"ia","x0":242.67,"y0":238.15,"x1":332.67,"y1":238.15,"o":["id"],"need":"i","sel":"ia","var":{"in":{"x0":242.67,"y0":238.15,"x1":332.67,"y1":238.15},"out":{"x0":332.67,"y0":238.15,"x1":242.67,"y1":238.15}},"dflt":"in","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[287.67,208.15,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":287.67,"y":148.15,"anc":"middle"},{"f":"ar","id":"rd","x0":520,"y0":420,"x1":650.23,"y1":529.27,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"c","id":"rc0","cx":520,"cy":420,"r":6,"fill":"k","need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[565.11,504.64,"end",[-1,1]]],"need":"r","vis":[],"t":"F","x":435.01,"y":646.06,"anc":"end"},{"f":"ln","id":"hlccw","pts":[[617.51,559.26],[630.41,549.27],[642.29,538.09],[653.04,525.83],[662.57,512.59],[670.79,498.5],[677.62,483.68],[683,468.28],[686.88,452.44],[689.22,436.29],[690,420],[689.22,403.71],[686.88,387.56],[683,371.72],[677.62,356.32],[670.79,341.5],[662.57,327.41],[653.04,314.17],[642.29,301.91]],"w":4,"o":["hd"],"need":"h","sel":"ha","var":{"ccw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"ar","id":"hhccw","x0":642.29,"y0":301.91,"x1":617.51,"y1":280.74,"o":["hd"],"need":"h","sel":"ha","var":{"ccw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"ln","id":"hlcw","pts":[[617.51,280.74],[630.41,290.73],[642.29,301.91],[653.04,314.17],[662.57,327.41],[670.79,341.5],[677.62,356.32],[683,371.72],[686.88,387.56],[689.22,403.71],[690,420],[689.22,436.29],[686.88,452.44],[683,468.28],[677.62,483.68],[670.79,498.5],[662.57,512.59],[653.04,525.83],[642.29,538.09]],"w":4,"o":["hd"],"need":"h","sel":"ha","var":{"cw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"ar","id":"hhcw","x0":642.29,"y0":538.09,"x1":617.51,"y1":559.26,"o":["hd"],"need":"h","sel":"ha","var":{"cw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[750,420,"start",[1,0]]],"o":["hd"],"need":"h","vis":[],"t":"F","x":750,"y":420,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU52s7tu(d, p, L){ tbFig_Draw(d, p, L, U52S7K.tu); }
function tbU52s7tr(d, p, L){ tbFig_Draw(d, p, L, U52S7K.tr); }
var KINDS = {u52s1xq: tbU52s1xq, u52s1pm: tbU52s1pm, u52s1xy: tbU52s1xy, u52s2sc: tbU52s2sc, u52s3ws: tbU52s3ws, u52s3wx: tbU52s3wx, u52s4tr: tbU52s4tr, u52s5cg: tbU52s5cg, u52s6rr: tbU52s6rr, u52s7tu: tbU52s7tu, u52s7tr: tbU52s7tr};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 52-1 の図は電流が流れないので載せない,
  // 52-2 の図は電流が流れないので載せない,
  // 52-3 の図は電流が流れないので載せない,
  // 52-4 の図は電流が流れないので載せない,
  // 52-5 の図は電流が流れないので載せない,
  // 52-6 の図は電流が流れないので載せない,
  // 52-7 の図は電流が流れないので載せない
};

// 52-1 2本の導体の磁界が 0 になる点 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s1_par(a, b){ return a * b / (a + b); }
function tbU52s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s1_Qout(r){
  var gcd = tbU52s1_gcd, ratio = tbU52s1_ratio, par = tbU52s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6]);
    var IB = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20]);
    var d = pick(r, [0.5,1,1.5,2,3,4,5,6]);
    var x = (d * IA / (IB - IA));
    if (!(IB > IA && abs((d * IA / (IB - IA)) * 10 - Math.round((d * IA / (IB - IA)) * 10)) < 1e-9 && x <= 10)) continue;
    var ok = (x);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s1_three4(ok, [{x: (d * IA / (IA + IB)), why: "向きを決めず、A と B の間に置いた（間では2つとも奥向きで強め合う）", w: 0, cut: 1}, {x: (d * IB / (IB - IA)), why: "B からの距離を答えた（A からの距離に直していない）", w: 1, cut: 1}, {x: (IB / IA), why: "等しく置かず、電流の比で止めた", w: 2, cut: 1}, {x: (d * IA / IB), why: "B からの距離を、A と B の間の距離にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s1out", text: "図のように、$" + fmt(d) + "\\,\\mathrm{m}$ 離れた平行な2本の導体 A・B に、A は上向きに $" + qv(IA, "A") + "$、B は下向きに $" + qv(IB, "A") + "$ の電流を流しました。A の左側で、磁界の強さが 0 になる点 P の、A からの距離 $x$ [m] の値はいくつですか。", fig: {kind: "u52s1xq", L: tbU52s1_fig({"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down"}, [["ia", fmt(IA) + " A"], ["ib", fmt(IB) + " A"], ["dpa", "{x}"], ["dab", fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、A の左では A の磁界は手前、B の磁界は奥。逆向きなので、大きさが等しい所で 0", "$\\dfrac{" + fmt(IA) + "}{2 \\pi x} = \\dfrac{" + fmt(IB) + "}{2 \\pi (x + " + fmt(d) + ")}$", "$x = \\dfrac{" + fmt(d) + " \\times " + fmt(IA) + "}{" + fmt(IB) + " - " + fmt(IA) + "} = " + fmt(ok) + "\\,\\mathrm{m}$"], chk: {form: "u52s1out", p: {IA: IA, IB: IB, d: d}}};
  }
  throw new Error("u52s1out：条件に合う数字が見つからない");
}
function tbU52s1_Qmm(r){
  var gcd = tbU52s1_gcd, ratio = tbU52s1_ratio, par = tbU52s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5]);
    var IB = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var dm = pick(r, [100,200,300,400,500,600,800,1000,1200,1500,2000]);
    var d = (dm / 1000);
    var x = (dm / 1000 * IA / (IB - IA));
    if (!(IB > IA && abs((dm / 1000 * IA / (IB - IA)) * 10 - Math.round((dm / 1000 * IA / (IB - IA)) * 10)) < 1e-9 && abs((dm * IA / (IB - IA)) * 10 - Math.round((dm * IA / (IB - IA)) * 10)) < 1e-9 && x <= 10)) continue;
    var ok = (x);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s1_three4(ok, [{x: (d * IA / (IA + IB)), why: "向きを決めず、A と B の間に置いた（間では2つとも奥向きで強め合う）", w: 0, cut: 1}, {x: (d * IB / (IB - IA)), why: "B からの距離を答えた（A からの距離に直していない）", w: 1, cut: 1}, {x: (dm * IA / (IB - IA)), why: "mm を m に直していない", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s1mm", text: "図のように、$" + fmt(dm) + "\\,\\mathrm{mm}$ 離れた平行な2本の導体 A・B に、A は上向きに $" + qv(IA, "A") + "$、B は下向きに $" + qv(IB, "A") + "$ の電流を流しました。A の左側で、磁界の強さが 0 になる点 P の、A からの距離 $x$ [m] の値はいくつですか。", fig: {kind: "u52s1xq", L: tbU52s1_fig({"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down"}, [["ia", fmt(IA) + " A"], ["ib", fmt(IB) + " A"], ["dpa", "{x}"], ["dab", fmt(dm) + " mm"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(dm) + "\\,\\mathrm{mm} = " + fmt(d) + "\\,\\mathrm{m}$。右ねじの法則で、A の左では A の磁界は手前、B の磁界は奥。逆向きなので、大きさが等しい所で 0", "$\\dfrac{" + fmt(IA) + "}{2 \\pi x} = \\dfrac{" + fmt(IB) + "}{2 \\pi (x + " + fmt(d) + ")}$", "$x = \\dfrac{" + fmt(d) + " \\times " + fmt(IA) + "}{" + fmt(IB) + " - " + fmt(IA) + "} = " + fmt(ok) + "\\,\\mathrm{m}$"], chk: {form: "u52s1mm", p: {IA: IA, IB: IB, dm: dm}}};
  }
  throw new Error("u52s1mm：条件に合う数字が見つからない");
}
function tbU52s1_Qmid(r){
  var gcd = tbU52s1_gcd, ratio = tbU52s1_ratio, par = tbU52s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6]);
    var IB = pick(r, [1,2,3,4,5,6,8,9,10,12]);
    var d = pick(r, [0.5,1,1.5,2,3,4,5,6]);
    var x = (d * IA / (IA + IB));
    if (!(IA != IB && abs((d * IA / (IA + IB)) * 10 - Math.round((d * IA / (IA + IB)) * 10)) < 1e-9)) continue;
    var ok = (x);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s1_three4(ok, [{x: (d * IA / abs(IB - IA)), why: "向きを決めず、外に置いた（外では2つの磁界は同じ向き）", w: 0, cut: 1}, {x: (d * IB / (IA + IB)), why: "B からの距離を答えた（A からの距離に直していない）", w: 1, cut: 1}, {x: (d * IA / IB), why: "B からの距離を、A と B の間の距離にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s1mid", text: "図のように、$" + fmt(d) + "\\,\\mathrm{m}$ 離れた平行な2本の導体 A・B に、どちらも上向きに、A は $" + qv(IA, "A") + "$、B は $" + qv(IB, "A") + "$ の電流を流しました。A と B の間で、磁界の強さが 0 になる点 P の、A からの距離 $x$ [m] の値はいくつですか。", fig: {kind: "u52s1pm", L: tbU52s1_fig({"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down"}, [["iba", "up"], ["ia", fmt(IA) + " A"], ["ib", fmt(IB) + " A"], ["dpa", "{x}"], ["dab", fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、間では A の磁界は奥、B の磁界は手前。逆向きなので、大きさが等しい所で 0", "$\\dfrac{" + fmt(IA) + "}{2 \\pi x} = \\dfrac{" + fmt(IB) + "}{2 \\pi (" + fmt(d) + " - x)}$", "$x = \\dfrac{" + fmt(d) + " \\times " + fmt(IA) + "}{" + fmt(IA) + " + " + fmt(IB) + "} = " + fmt(ok) + "\\,\\mathrm{m}$"], chk: {form: "u52s1mid", p: {IA: IA, IB: IB, d: d}}};
  }
  throw new Error("u52s1mid：条件に合う数字が見つからない");
}
function tbU52s1_Qgap(r){
  var gcd = tbU52s1_gcd, ratio = tbU52s1_ratio, par = tbU52s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,1.2,1.5,2,2.5,3,4,5]);
    var IB = pick(r, [2,3,4,5,6,8,10,12]);
    var p = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1,2]);
    var l = (p * (IB - IA) / IA);
    if (!(IB > IA && abs((p * (IB - IA) / IA) * 100 - Math.round((p * (IB - IA) / IA) * 100)) < 1e-9 && abs((p * IB / IA) * 100 - Math.round((p * IB / IA) * 100)) < 1e-9 && l <= 10)) continue;
    var ok = (l);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s1_three4(ok, [{x: (p * IB / IA), why: "P から B までの距離を答えた（P から A までを引いていない）", w: 0, cut: 1}, {x: (IB / IA), why: "等しく置かず、電流の比で止めた", w: 1, cut: 1}, {x: (p * (IA + IB) / IA), why: "P を A と B の間に置いた形で、P から B までの距離を立てた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s1gap", text: "図のように、平行な2本の導体 A・B に、A は上向きに $" + qv(IA, "A") + "$、B は下向きに $" + qv(IB, "A") + "$ の電流を流しました。A の左 $" + fmt(p) + "\\,\\mathrm{m}$ の点 P で、磁界の強さが 0 になりました。A と B の間の距離 $l$ [m] の値はいくつですか。", fig: {kind: "u52s1xq", L: tbU52s1_fig({"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down"}, [["ia", fmt(IA) + " A"], ["ib", fmt(IB) + " A"], ["dpa", fmt(p) + " m"], ["dab", "{l}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、A の左では A の磁界は手前、B の磁界は奥。逆向きなので、大きさが等しい所で 0", "$\\dfrac{" + fmt(IA) + "}{2 \\pi \\times " + fmt(p) + "} = \\dfrac{" + fmt(IB) + "}{2 \\pi (" + fmt(p) + " + l)}$　より　$" + fmt(p) + " + l = " + fmt(p) + " \\times \\dfrac{" + fmt(IB) + "}{" + fmt(IA) + "}$", "$l = " + fmt(ok) + "\\,\\mathrm{m}$"], chk: {form: "u52s1gap", p: {IA: IA, IB: IB, p: p}}};
  }
  throw new Error("u52s1gap：条件に合う数字が見つからない");
}
function tbU52s1_Qxy(r){
  var gcd = tbU52s1_gcd, ratio = tbU52s1_ratio, par = tbU52s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Ix = pick(r, [1,2,3,4,5,6,8,10,12]);
    var x0 = pick(r, [1,2,3,4,5,6]);
    var y0 = pick(r, [1,2,3,4,5,6]);
    var Iy = (Ix * x0 / y0);
    if (!(x0 != y0 && abs((Ix * x0 / y0) * 10 - Math.round((Ix * x0 / y0) * 10)) < 1e-9 && abs((Ix * y0 / x0) * 10 - Math.round((Ix * y0 / x0) * 10)) < 1e-9 && Iy <= 30)) continue;
    var ok = (Iy);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s1_three4(ok, [{x: (Ix), why: "等しく置かず、同じ電流にした", w: 0, cut: 1}, {x: (Ix * x0), why: "解く途中で止めた（A からの距離で割っていない）", w: 1, cut: 1}, {x: (Ix * y0 / x0), why: "導体からの距離を取り違えた（x 軸の導体 A からの距離は y の値）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s1xy", text: "図のように、x 軸に沿う導体 A に +x 方向の電流 $" + qv(Ix, "A") + "$、y 軸に沿う導体 B に +y 方向の電流 $I_B$ を流しました。x = " + fmt(x0) + " m、y = " + fmt(y0) + " m の点で、磁界の強さが 0 になりました。$I_B$ は何 A ですか。", fig: {kind: "u52s1xy", L: tbU52s1_fig({"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down"}, [["ax", "{x}"], ["ay", "{y}"], ["wa", "A"], ["wb", "B"], ["ix", fmt(Ix) + " A"], ["ixa", "right"], ["iy", "{I}_B"], ["iya", "up"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["点では、右ねじの法則で A の磁界は手前、B の磁界は奥。A からの距離は $" + fmt(y0) + "\\,\\mathrm{m}$、B からの距離は $" + fmt(x0) + "\\,\\mathrm{m}$", "$\\dfrac{" + fmt(Ix) + "}{2 \\pi \\times " + fmt(y0) + "} = \\dfrac{I_B}{2 \\pi \\times " + fmt(x0) + "}$", "$I_B = " + qv(ok, "A") + "$"], chk: {form: "u52s1xy", p: {Ix: Ix, x0: x0, y0: y0}}};
  }
  throw new Error("u52s1xy：条件に合う数字が見つからない");
}
// 52-2 辺ごとの磁界を足して比べる の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s2_par(a, b){ return a * b / (a + b); }
function tbU52s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s2_Qrat(r){
  var gcd = tbU52s2_gcd, ratio = tbU52s2_ratio, par = tbU52s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var h = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var D = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var N = pick(r, [1,1,2,3,4]);
    var Hc = (N * I / D);
    if (!(abs((4 * h * D / (N * I)) * 100 - Math.round((4 * h * D / (N * I)) * 100)) < 1e-9 && abs((h * D / (N * I)) * 1000 - Math.round((h * D / (N * I)) * 1000)) < 1e-9 && abs((Hc) * 10 - Math.round((Hc) * 10)) < 1e-9)) continue;
    var ok = (4 * h / Hc);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s2_three4(ok, [{x: (h / Hc), why: "1辺の磁界だけで比べた（4辺を足していない）", w: 0, cut: 1}, {x: (2 * h / Hc), why: "2辺の磁界だけで比べた", w: 1, cut: 1}, {x: (8 * h / Hc), why: "円の直径を半径とした", w: 2, cut: 0}, {x: (4 * h * D / I), why: "円形コイルの巻数を掛けていない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s2rat", text: "図1 の4つの辺の長さが等しい四角いコイルと、図2 の直径 $" + fmt(D) + "\\,\\mathrm{m}$・巻数 $" + fmt(N) + "$ の円形コイルに、同じ電流 $" + qv(I, "A") + "$ を流しました。四角いコイルの1つの辺が中心 O₁ につくる磁界の強さは $" + fmt(h) + "$ A/m です。O₁ の磁界の強さは、円形コイルの中心 O₂ の磁界の強さの何倍ですか。", fig: {kind: "u52s2sc", L: tbU52s2_fig({"ia":"right","o1":"O₁","o2":"O₂"}, [["i", fmt(I) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、4辺とも O₁ では同じ向き。$H_1 = 4 \\times " + fmt(h) + " = " + fmt(4 * h) + "$ A/m", "半径は $" + fmt(D / 2) + "\\,\\mathrm{m}$。$H_2 = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{2 \\times " + fmt(D / 2) + "} = " + fmt(Hc) + "$ A/m", "$\\dfrac{H_1}{H_2} = \\dfrac{" + fmt(4 * h) + "}{" + fmt(Hc) + "} = " + qv(ok, "X") + "$"], chk: {form: "u52s2rat", p: {h: h, I: I, D: D, N: N}}};
  }
  throw new Error("u52s2rat：条件に合う数字が見つからない");
}
function tbU52s2_Qcur(r){
  var gcd = tbU52s2_gcd, ratio = tbU52s2_ratio, par = tbU52s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var h = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Dm = pick(r, [100,200,250,300,400,500,600,800]);
    var D = (Dm / 1000);
    if (!(abs((4 * h * Dm / 1000) * 100 - Math.round((4 * h * Dm / 1000) * 100)) < 1e-9 && abs((h * Dm / 1000) * 1000 - Math.round((h * Dm / 1000) * 1000)) < 1e-9 && 4 * h * Dm / 1000 <= 50)) continue;
    var ok = (4 * h * D);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s2_three4(ok, [{x: (h * D), why: "1辺の磁界と等しく置いた（4辺を足していない）", w: 0, cut: 1}, {x: (2 * h * D), why: "2辺の磁界と等しく置いた", w: 1, cut: 1}, {x: (4 * h * Dm), why: "mm を m に直していない", w: 2, cut: 0}, {x: (8 * h * D), why: "円の直径を半径とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s2cur", text: "図1 の4つの辺の長さが等しい四角いコイルに電流を流すと、1つの辺が中心 O₁ につくる磁界の強さは $" + fmt(h) + "$ A/m でした。図2 の直径 $" + fmt(Dm) + "\\,\\mathrm{mm}$・1回巻きの円形コイルの中心 O₂ の磁界を、O₁ の磁界と等しくするには、円形コイルの電流を何 A にしますか。", fig: {kind: "u52s2sc", L: tbU52s2_fig({"ia":"right","o1":"O₁","o2":"O₂"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["4辺とも O₁ では同じ向き。$H_1 = 4 \\times " + fmt(h) + " = " + fmt(4 * h) + "$ A/m。直径 $" + fmt(Dm) + "\\,\\mathrm{mm} = " + fmt(D) + "\\,\\mathrm{m}$、半径 $" + fmt(D / 2) + "\\,\\mathrm{m}$", "$\\dfrac{I}{2 \\times " + fmt(D / 2) + "} = " + fmt(4 * h) + "$", "$I = " + qv(ok, "A") + "$"], chk: {form: "u52s2cur", p: {h: h, Dm: Dm}}};
  }
  throw new Error("u52s2cur：条件に合う数字が見つからない");
}
// 52-3 四角いループに働く力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s3_par(a, b){ return a * b / (a + b); }
function tbU52s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s3_Qmag(r){
  var gcd = tbU52s3_gcd, ratio = tbU52s3_ratio, par = tbU52s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,4,5,6,8,10,12,15,20]);
    var IB = pick(r, [1,2,3,4,5,6,8,10]);
    var d = pick(r, [0.1,0.2,0.3,0.4,0.5]);
    var a = pick(r, [0.1,0.2,0.3,0.4,0.5]);
    var k = pick(r, [1,2]);
    var F1 = (2 * IA * IB * a / d);
    var F2 = (2 * IA * IB * a / (d + a));
    var ib = (k == 1 ? 'up' : 'down');
    var rel = (k == 1 ? '逆向き' : '同じ向き');
    if (!(abs((2 * IA * IB * a / d - 2 * IA * IB * a / (d + a)) * 1000 - Math.round((2 * IA * IB * a / d - 2 * IA * IB * a / (d + a)) * 1000)) < 1e-9 && abs((2 * IA * IB * a / (d + a)) * 1000 - Math.round((2 * IA * IB * a / (d + a)) * 1000)) < 1e-9 && F1 <= 10000)) continue;
    var ok = (F1 - F2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s3_three4(ok, [{x: (F1), why: "近い辺の力だけを答えた", w: 0, cut: 1}, {x: (F1 + F2), why: "遠い辺の向きを決めず、2つの力を足した", w: 1, cut: 1}, {x: (F2), why: "遠い辺の力だけを答えた", w: 2, cut: 1}, {x: (2 * (F1 - F2)), why: "$\\dfrac{\\mu_0}{2 \\pi}$ を $\\dfrac{\\mu_0}{\\pi}$ とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s3mag", text: "図のように、長い直線の導体 A に下向きの電流 $" + qv(IA, "A") + "$ を流し、A から $" + fmt(d) + "\\,\\mathrm{m}$ の所に、辺の長さがどれも $" + fmt(a) + "\\,\\mathrm{m}$ の四角いループ B を置いて、電流 $" + qv(IB, "A") + "$ を流しました。A に近い辺の電流は、A と" + String(rel) + "です。B 全体に働く力の大きさは $\\square \\times 10^{-7}\\,\\mathrm{N}$ です。□ に入る数はいくつですか。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。", fig: {kind: "u52s3ws", L: tbU52s3_fig({"wa":"A","wb":"B","iaa":"down","iba":"up"}, [["ia", fmt(IA) + " A"], ["ib", fmt(IB) + " A"], ["iba", String(ib)], ["d", fmt(d) + " m"], ["a", fmt(a) + " m"], ["a2", fmt(a) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["上下の辺は打ち消し合う。$\\dfrac{\\mu_0}{2 \\pi} = 2 \\times 10^{-7}$", "近い辺 $F_1 = 2 \\times 10^{-7} \\times \\dfrac{" + fmt(IA) + " \\times " + fmt(IB) + " \\times " + fmt(a) + "}{" + fmt(d) + "} = " + fmt(F1) + " \\times 10^{-7}\\,\\mathrm{N}$、遠い辺 $F_2 = " + fmt(F2) + " \\times 10^{-7}\\,\\mathrm{N}$", "逆向きなので引く　$F = " + fmt(F1) + " - " + fmt(F2) + " = " + fmt(ok) + " \\times 10^{-7}\\,\\mathrm{N}$"], chk: {form: "u52s3mag", p: {IA: IA, IB: IB, d: d, a: a, k: k}}};
  }
  throw new Error("u52s3mag：条件に合う数字が見つからない");
}
function tbU52s3_Qinv(r){
  var gcd = tbU52s3_gcd, ratio = tbU52s3_ratio, par = tbU52s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,4,5,6,8,10,12,15,20]);
    var IB = pick(r, [1,2,3,4,5,6,8,10]);
    var d = pick(r, [0.1,0.2,0.3,0.4,0.5]);
    var a = pick(r, [0.1,0.2,0.3,0.4,0.5]);
    var Fn = (2 * IA * IB * a / d - 2 * IA * IB * a / (d + a));
    if (!(abs((2 * IA * IB * a / d - 2 * IA * IB * a / (d + a)) * 1000 - Math.round((2 * IA * IB * a / d - 2 * IA * IB * a / (d + a)) * 1000)) < 1e-9 && abs((IB * a / (d + a)) * 1000 - Math.round((IB * a / (d + a)) * 1000)) < 1e-9 && abs((IB * a / (2 * d + a)) * 1000 - Math.round((IB * a / (2 * d + a)) * 1000)) < 1e-9)) continue;
    var ok = (IB);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s3_three4(ok, [{x: (IB * a / (d + a)), why: "近い辺の力だけで、逆に解いた", w: 0, cut: 1}, {x: (IB * a / (2 * d + a)), why: "遠い辺の向きを決めず、2つの力を足した式で解いた", w: 1, cut: 1}, {x: (IB / 2), why: "$\\dfrac{\\mu_0}{2 \\pi}$ を $\\dfrac{\\mu_0}{\\pi}$ とした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s3inv", text: "図のように、長い直線の導体 A に下向きの電流 $" + qv(IA, "A") + "$ を流し、A から $" + fmt(d) + "\\,\\mathrm{m}$ の所に、辺の長さがどれも $" + fmt(a) + "\\,\\mathrm{m}$ の四角いループ B を置きました。B に電流 $I_B$ を流すと、B 全体に働く力の大きさは $" + fmt(Fn) + " \\times 10^{-7}\\,\\mathrm{N}$ でした。$I_B$ は何 A ですか。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。", fig: {kind: "u52s3ws", L: tbU52s3_fig({"wa":"A","wb":"B","iaa":"down","iba":"up"}, [["ia", fmt(IA) + " A"], ["ib", "{I}_B"], ["d", fmt(d) + " m"], ["a", fmt(a) + " m"], ["a2", fmt(a) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["上下の辺は打ち消し合い、近い辺と遠い辺の力は逆向き", "$" + fmt(Fn) + " \\times 10^{-7} = 2 \\times 10^{-7} \\times " + fmt(IA) + " \\times I_B \\times " + fmt(a) + " \\left( \\dfrac{1}{" + fmt(d) + "} - \\dfrac{1}{" + fmt(d + a) + "} \\right)$", "$I_B = " + qv(ok, "A") + "$"], chk: {form: "u52s3inv", p: {IA: IA, IB: IB, d: d, a: a}}};
  }
  throw new Error("u52s3inv：条件に合う数字が見つからない");
}
function tbU52s3_Qdir(r){
  var gcd = tbU52s3_gcd, ratio = tbU52s3_ratio, par = tbU52s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var ib = (k == 1 ? 'up' : 'down');
    var rel = (k == 1 ? '逆向き' : '同じ向き');
    var gd = (k == 1 ? 'px' : 'mx');
    var gt = (k == 1 ? '+x 方向' : '−x 方向');
    var bt = (k == 1 ? '−x 方向' : '+x 方向');
    var why = (k == 1 ? '近い辺は反発・遠い辺は引き合う。近い辺の方が強い' : '近い辺は引き合い・遠い辺は反発。近い辺の方が強い');
    var _c = choices(r, [{t: String(gt), v: String(gd)}, {t: String(bt), v: "bad", why: String(why)}, {t: "+z 方向", v: "pz", why: "上下の辺の力は、線対称で打ち消し合う"}, {t: "力は働かない", v: "none", why: "近い辺と遠い辺は距離が違うので、力の大きさが違い、打ち消し合わない"}]);
    return {form: "u52s3dir", text: "図のように、長い直線の導体 A に下向きの電流を流し、四角いループ B に電流を流しました。A に近い辺の電流は、A と" + String(rel) + "です。B 全体に働く力の向きはどれですか。", fig: {kind: "u52s3wx", L: tbU52s3_fig({"wa":"A","wb":"B","iaa":"down","iba":"up"}, [["ia", "{I}_A"], ["ib", "{I}_B"], ["iba", String(ib)], ["d", "{d}"], ["a", "{a}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A の電流は下向きなので、右ねじの法則で、ループの所の磁界は手前向き。上下の辺の力は打ち消し合う", "左手で、近い辺の力は" + String(k == 1 ? '+x（反発）' : '−x（引き合う）') + "。近い辺の方が A に近く、力が大きいので、向きは " + String(gt)], chk: {form: "u52s3dir", p: {k: k}}};
  }
  throw new Error("u52s3dir：条件に合う数字が見つからない");
}
function tbU52s3_Qexpr(r){
  var gcd = tbU52s3_gcd, ratio = tbU52s3_ratio, par = tbU52s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1]);
    var _c = choices(r, [{t: "$\\dfrac{\\mu_0 I_A I_B a^2}{2 \\pi d (d + a)}$", v: "ok"}, {t: "$\\dfrac{\\mu_0 I_A I_B a}{2 \\pi d}$", v: "near", why: "近い辺の力だけを答えた"}, {t: "$\\dfrac{\\mu_0 I_A I_B a (2d + a)}{2 \\pi d (d + a)}$", v: "add", why: "遠い辺の向きを決めず、2つの力を足した"}, {t: "$\\dfrac{\\mu_0 I_A I_B a^2}{\\pi d (d + a)}$", v: "pi", why: "$2 \\pi$ で割るところを $\\pi$ で割った"}]);
    return {form: "u52s3expr", text: "図のように、長い直線の導体 A に電流 $I_A$ を流し、A から $d$ の所に、辺の長さがどれも $a$ の四角いループ B を置いて、電流 $I_B$ を流しました。B 全体に働く力の大きさを表す式はどれですか。真空中の透磁率を $\\mu_0$ とします。", fig: {kind: "u52s3ws", L: tbU52s3_fig({"wa":"A","wb":"B","iaa":"down","iba":"up"}, [["ia", "{I}_A"], ["ib", "{I}_B"], ["d", "{d}"], ["a", "{a}"], ["a2", "{a}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["近い辺 $\\dfrac{\\mu_0 I_A I_B a}{2 \\pi d}$、遠い辺 $\\dfrac{\\mu_0 I_A I_B a}{2 \\pi (d + a)}$、逆向きなので引く", "$\\dfrac{\\mu_0 I_A I_B a}{2 \\pi} \\left( \\dfrac{1}{d} - \\dfrac{1}{d + a} \\right) = \\dfrac{\\mu_0 I_A I_B a^2}{2 \\pi d (d + a)}$"], chk: {form: "u52s3expr", p: {k: k}}};
  }
  throw new Error("u52s3expr：条件に合う数字が見つからない");
}
// 52-4 ファラデーの法則と自己誘導を等しく置く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s4_par(a, b){ return a * b / (a + b); }
function tbU52s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s4_QL(r){
  var gcd = tbU52s4_gcd, ratio = tbU52s4_ratio, par = tbU52s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [10,20,50,100,200,400,500]);
    var dp = pick(r, [0.1,0.2,0.4,0.5,1,2,4,5]);
    var t1 = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var di = pick(r, [0.1,0.2,0.4,0.5,1,2,4]);
    var t2 = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var E = (N * dp / 1000 / t1);
    if (!(nice(E) && E >= 0.01 && N * dp * t2 / (t1 * di) <= 5000 && nice(N * dp * t2 / (t1 * di)))) continue;
    var ok = (N * dp * t2 / (t1 * di));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s4_three4(ok, [{x: (E * 1000), why: "起電力を、そのまま自己インダクタンスとした", w: 0, cut: 1}, {x: (dp * t2 / (t1 * di)), why: "ファラデーの法則で巻数を掛けていない", w: 1, cut: 1}, {x: (E * 1000 / (di * t2)), why: "電流の変化を時間で割らず、掛けた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{mH}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s4L", text: "巻数 $" + fmt(N) + "$ のコイルの電流が、$" + fmt(t2) + "\\,\\mathrm{s}$ の間に $" + qv(di, "A") + "$ の割合で変わりました。そのとき、コイルを貫く磁束は、$" + fmt(t1) + "\\,\\mathrm{s}$ の間に $" + fmt(dp) + "\\,\\mathrm{mWb}" + "$ の割合で変わりました。このコイルの自己インダクタンスは何 mH ですか。", fig: {kind: "u52s4tr", L: tbU52s4_fig({"n":"{N}","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, [["n", "{N}=" + fmt(N)], ["i", "Δ{I}=" + fmt(di) + " A"], ["phi", "Δ{Φ}=" + fmt(dp) + " mWb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t} = " + fmt(N) + " \\times \\dfrac{" + fmt(dp) + " \\times 10^{-3}}{" + fmt(t1) + "} = " + qv(E, "V") + "$", "同じ起電力を電流の式と等しく置く　$" + fmt(E) + " = L \\times \\dfrac{" + fmt(di) + "}{" + fmt(t2) + "}$", "$L = " + fmt(ok) + "\\,\\mathrm{mH}" + "$"], chk: {form: "u52s4L", p: {N: N, dp: dp, t1: t1, di: di, t2: t2}}};
  }
  throw new Error("u52s4L：条件に合う数字が見つからない");
}
function tbU52s4_QN(r){
  var gcd = tbU52s4_gcd, ratio = tbU52s4_ratio, par = tbU52s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Lm = pick(r, [10,20,40,50,100,200,400,500]);
    var dp = pick(r, [0.1,0.2,0.4,0.5,1,2,4,5]);
    var t1 = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var di = pick(r, [0.1,0.2,0.4,0.5,1,2,4]);
    var t2 = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var E = (Lm / 1000 * di / t2);
    if (!(nice(E) && E >= 0.01 && Lm * di * t1 / (t2 * dp) >= 2 && Lm * di * t1 / (t2 * dp) <= 2000)) continue;
    var ok = (Lm * di * t1 / (t2 * dp));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s4_three4(ok, [{x: (E), why: "起電力で止めた（巻数を出していない）", w: 0, cut: 1}, {x: (E * 1000 / dp), why: "ファラデーの法則で、磁束の変化の時間を使っていない", w: 1, cut: 1}, {x: (Lm * di * t1 / (t2 * dp) / 1000), why: "mWb を Wb に直さなかった（mH は H に直した）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s4N", text: "自己インダクタンス $" + fmt(Lm) + "\\,\\mathrm{mH}" + "$ のコイルの電流が、$" + fmt(t2) + "\\,\\mathrm{s}$ の間に $" + qv(di, "A") + "$ の割合で変わりました。そのとき、コイルを貫く磁束は、$" + fmt(t1) + "\\,\\mathrm{s}$ の間に $" + fmt(dp) + "\\,\\mathrm{mWb}" + "$ の割合で変わりました。このコイルの巻数はいくつですか。", fig: {kind: "u52s4tr", L: tbU52s4_fig({"n":"{N}","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, [["n", "{N}"], ["i", "Δ{I}=" + fmt(di) + " A"], ["phi", "Δ{Φ}=" + fmt(dp) + " mWb"], ["ind", "{L}=" + fmt(Lm) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = L \\dfrac{\\Delta I}{\\Delta t} = " + fmt(Lm) + " \\times 10^{-3} \\times \\dfrac{" + fmt(di) + "}{" + fmt(t2) + "} = " + qv(E, "V") + "$", "同じ起電力をファラデーの法則と等しく置く　$" + fmt(E) + " = N \\times \\dfrac{" + fmt(dp) + " \\times 10^{-3}}{" + fmt(t1) + "}$", "$N = " + fmt(ok) + "$"], chk: {form: "u52s4N", p: {Lm: Lm, dp: dp, t1: t1, di: di, t2: t2}}};
  }
  throw new Error("u52s4N：条件に合う数字が見つからない");
}
// 52-5 エアギャップのある磁気回路の巻数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s5_par(a, b){ return a * b / (a + b); }
function tbU52s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s5_QN(r){
  var gcd = tbU52s5_gcd, ratio = tbU52s5_ratio, par = tbU52s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l1 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var mr = pick(r, [200,500,1000,2000,4000,5000]);
    var g = pick(r, [0.5,1,1.5,2,2.5,3,4,5]);
    var H0 = pick(r, [20000,50000,100000,200000,400000,500000]);
    var I = pick(r, [0.5,1,2,4,5,10]);
    var NI = (H0 * (l1 / mr + g / 1000));
    if (!(abs((H0 * (l1 / mr + g / 1000) / I) * 1 - Math.round((H0 * (l1 / mr + g / 1000) / I) * 1)) < 1e-9 && abs((H0 * g / 1000 / I) * 1 - Math.round((H0 * g / 1000 / I) * 1)) < 1e-9 && abs((H0 * l1 / mr / I) * 1 - Math.round((H0 * l1 / mr / I) * 1)) < 1e-9 && NI / I >= 10 && NI / I <= 5000)) continue;
    var ok = (NI / I);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s5_three4(ok, [{x: (H0 * g / 1000 / I), why: "エアギャップの分だけで、鉄心の磁気抵抗を足していない", w: 0, cut: 1}, {x: (H0 * l1 / mr / I), why: "鉄心の分だけで、エアギャップの磁気抵抗を足していない", w: 1, cut: 1}, {x: (H0 * (l1 / mr + g / 100) / I), why: "mm を m に直す時、$\\dfrac{1}{100}$ にした", w: 2, cut: 0}, {x: (NI), why: "電流で割っていない", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s5N", text: "図のように、鉄心の磁路の長さ $l_1 = " + fmt(l1) + "\\,\\mathrm{m}$・比透磁率 $" + fmt(mr) + "$ の鉄心に、長さ $l_2 = " + fmt(g) + "\\,\\mathrm{mm}$ のエアギャップがあります。断面積はどこも同じです。電流 $" + qv(I, "A") + "$ で、ギャップの磁界の強さ $H_0$ を $" + fmt(H0) + "\\,\\mathrm{A/m}$ にするには、巻数はいくら要りますか。", fig: {kind: "u52s5cg", L: tbU52s5_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","gap":"{H}_0","s":"{S}"}, [["l", "{l}_1=" + fmt(l1) + " m"], ["gl", "{l}_2=" + fmt(g) + " mm"], ["mu", "{μ}_r=" + fmt(mr)], ["i", "{I}=" + fmt(I) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束 $\\Phi = \\mu_0 H_0 S$ は鉄心も同じ。$NI = \\Phi (R_1 + R_2) = H_0 \\left( \\dfrac{l_1}{\\mu_r} + l_2 \\right)$", "$NI = " + fmt(H0) + " \\times \\left( \\dfrac{" + fmt(l1) + "}{" + fmt(mr) + "} + " + fmt(g / 1000) + " \\right) = " + qv(NI, "A") + "$", "$N = \\dfrac{" + fmt(NI) + "}{" + fmt(I) + "} = " + fmt(ok) + "$"], chk: {form: "u52s5N", p: {l1: l1, mr: mr, g: g, H0: H0, I: I}}};
  }
  throw new Error("u52s5N：条件に合う数字が見つからない");
}
function tbU52s5_QH(r){
  var gcd = tbU52s5_gcd, ratio = tbU52s5_ratio, par = tbU52s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l1 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var mr = pick(r, [200,500,1000,2000,4000,5000]);
    var g = pick(r, [0.5,1,1.5,2,2.5,3,4,5]);
    var N = pick(r, [50,100,200,300,400,500,600,800,1000]);
    var I = pick(r, [0.5,1,2,4,5]);
    var R = (l1 / mr + g / 1000);
    if (!(abs((N * I / (l1 / mr + g / 1000)) * 1 - Math.round((N * I / (l1 / mr + g / 1000)) * 1)) < 1e-9 && abs((N * I * 1000 / g) * 1 - Math.round((N * I * 1000 / g) * 1)) < 1e-9 && abs((N * I * mr / l1) * 1 - Math.round((N * I * mr / l1) * 1)) < 1e-9 && abs((N * I / (l1 / mr + g / 100)) * 1 - Math.round((N * I / (l1 / mr + g / 100)) * 1)) < 1e-9)) continue;
    var ok = (N * I / R);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s5_three4(ok, [{x: (N * I * 1000 / g), why: "エアギャップの分だけで、鉄心の磁気抵抗を足していない", w: 0, cut: 1}, {x: (N * I * mr / l1), why: "鉄心の分だけで、エアギャップの磁気抵抗を足していない", w: 1, cut: 1}, {x: (N * I / (l1 / mr + g / 100)), why: "mm を m に直す時、$\\dfrac{1}{100}$ にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "Am", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s5H", text: "図のように、鉄心の磁路の長さ $l_1 = " + fmt(l1) + "\\,\\mathrm{m}$・比透磁率 $" + fmt(mr) + "$ の鉄心に、長さ $l_2 = " + fmt(g) + "\\,\\mathrm{mm}$ のエアギャップがあります。断面積はどこも同じです。巻数 $" + fmt(N) + "$ のコイルに $" + qv(I, "A") + "$ を流しました。ギャップの磁界の強さ $H_0$ は何 A/m ですか。", fig: {kind: "u52s5cg", L: tbU52s5_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","gap":"{H}_0","s":"{S}"}, [["n", "{N}=" + fmt(N)], ["l", "{l}_1=" + fmt(l1) + " m"], ["gl", "{l}_2=" + fmt(g) + " mm"], ["mu", "{μ}_r=" + fmt(mr)], ["i", "{I}=" + fmt(I) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$NI = H_0 \\left( \\dfrac{l_1}{\\mu_r} + l_2 \\right)$（磁束は鉄心も同じ・直列の磁気抵抗）", "$" + fmt(N) + " \\times " + fmt(I) + " = H_0 \\times \\left( \\dfrac{" + fmt(l1) + "}{" + fmt(mr) + "} + " + fmt(g / 1000) + " \\right)$", "$H_0 = " + qv(ok, "Am") + "$"], chk: {form: "u52s5H", p: {l1: l1, mr: mr, g: g, N: N, I: I}}};
  }
  throw new Error("u52s5H：条件に合う数字が見つからない");
}
function tbU52s5_Qrat(r){
  var gcd = tbU52s5_gcd, ratio = tbU52s5_ratio, par = tbU52s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l1 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var mr = pick(r, [200,500,1000,2000,4000,5000]);
    var g = pick(r, [0.5,1,1.5,2,2.5,3,4,5]);
    if (!(abs((mr * g / 1000 / l1) * 100 - Math.round((mr * g / 1000 / l1) * 100)) < 1e-9)) continue;
    var ok = (mr);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s5_three4(ok, [{x: (1), why: "断面積も磁束も同じなので、磁界も同じとした（磁束密度で止めた）", w: 0, cut: 1}, {x: (mr * g / 1000 / l1), why: "磁気抵抗の比を答えた（長さで割っていない）", w: 1, cut: 1}, {x: (1 / mr), why: "比を逆にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s5rat", text: "図のように、鉄心の磁路の長さ $l_1 = " + fmt(l1) + "\\,\\mathrm{m}$・比透磁率 $" + fmt(mr) + "$ の鉄心に、長さ $l_2 = " + fmt(g) + "\\,\\mathrm{mm}$ のエアギャップがあります。断面積はどこも同じです。ギャップの磁界の強さ $H_0$ は、鉄心の中の磁界の強さの何倍ですか。", fig: {kind: "u52s5cg", L: tbU52s5_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","gap":"{H}_0","s":"{S}"}, [["l", "{l}_1=" + fmt(l1) + " m"], ["gl", "{l}_2=" + fmt(g) + " mm"], ["mu", "{μ}_r=" + fmt(mr)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["断面積も磁束も同じなので、磁束密度 $B$ も同じ", "$B = \\mu_0 H_0 = \\mu_0 \\mu_r H_1$　より　$\\dfrac{H_0}{H_1} = \\mu_r = " + qv(ok, "X") + "$"], chk: {form: "u52s5rat", p: {mr: mr, l1: l1, g: g}}};
  }
  throw new Error("u52s5rat：条件に合う数字が見つからない");
}
// 52-6 和動と差動の2つの測定 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s6_par(a, b){ return a * b / (a + b); }
function tbU52s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s6_QM(r){
  var gcd = tbU52s6_gcd, ratio = tbU52s6_ratio, par = tbU52s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var LL = pick(r, [0.2,0.3,0.4,0.5,0.6,0.8,1,1.2,1.5,2]);
    var MM = pick(r, [0.05,0.1,0.15,0.2,0.25,0.3,0.4,0.5,0.6]);
    var Lp = (Math.round((2 * LL + 2 * MM) * 1000) / 1000);
    var Lm = (Math.round((2 * LL - 2 * MM) * 1000) / 1000);
    var M4 = (Math.round((4 * MM) * 1000) / 1000);
    if (!(MM < LL)) continue;
    var ok = (MM);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s6_three4(ok, [{x: (4 * MM), why: "2つの式を引いた $4M$ で止めた", w: 0, cut: 1}, {x: (2 * MM), why: "$2M$ で止めた（4 で割っていない）", w: 1, cut: 1}, {x: (LL), why: "足して $L$ を出した（求めるのは $M$）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "H", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s6M", text: "図1・図2 のように、自己インダクタンスの等しい2つのコイルを、ドーナツの形の鉄心に同じ向きに巻き、直列につなぎました。合成インダクタンスは、図1 の端子 A–B 間で $" + fmt(Lp) + "\\,\\mathrm{H}$、図2 の端子 C–D 間で $" + fmt(Lm) + "\\,\\mathrm{H}$ でした。相互インダクタンスは何 H ですか。", fig: {kind: "u52s6rr", L: tbU52s6_fig({"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、図1 は和動・図2 は差動。$2L + 2M = " + fmt(Lp) + "$、$2L - 2M = " + fmt(Lm) + "$", "引くと $4M = " + fmt(M4) + "$", "$M = " + qv(ok, "H") + "$"], chk: {form: "u52s6M", p: {LL: LL, MM: MM}}};
  }
  throw new Error("u52s6M：条件に合う数字が見つからない");
}
function tbU52s6_QL(r){
  var gcd = tbU52s6_gcd, ratio = tbU52s6_ratio, par = tbU52s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var LL = pick(r, [0.2,0.3,0.4,0.5,0.6,0.8,1,1.2,1.5,2]);
    var MM = pick(r, [0.05,0.1,0.15,0.2,0.25,0.3,0.4,0.5,0.6]);
    var Lp = (Math.round((2 * LL + 2 * MM) * 1000) / 1000);
    var Lm = (Math.round((2 * LL - 2 * MM) * 1000) / 1000);
    var L4 = (Math.round((4 * LL) * 1000) / 1000);
    if (!(MM < LL)) continue;
    var ok = (LL);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s6_three4(ok, [{x: (4 * LL), why: "2つの式を足した $4L$ で止めた", w: 0, cut: 1}, {x: (2 * LL), why: "$2L$ で止めた（4 で割っていない）", w: 1, cut: 1}, {x: (MM), why: "引いて $M$ を出した（求めるのは $L$）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "H", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s6L", text: "図1・図2 のように、自己インダクタンスの等しい2つのコイルを、ドーナツの形の鉄心に同じ向きに巻き、直列につなぎました。合成インダクタンスは、図1 の端子 A–B 間で $" + fmt(Lp) + "\\,\\mathrm{H}$、図2 の端子 C–D 間で $" + fmt(Lm) + "\\,\\mathrm{H}$ でした。1つのコイルの自己インダクタンスは何 H ですか。", fig: {kind: "u52s6rr", L: tbU52s6_fig({"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、図1 は和動・図2 は差動。$2L + 2M = " + fmt(Lp) + "$、$2L - 2M = " + fmt(Lm) + "$", "足すと $4L = " + fmt(L4) + "$", "$L = " + qv(ok, "H") + "$"], chk: {form: "u52s6L", p: {LL: LL, MM: MM}}};
  }
  throw new Error("u52s6L：条件に合う数字が見つからない");
}
function tbU52s6_Qk(r){
  var gcd = tbU52s6_gcd, ratio = tbU52s6_ratio, par = tbU52s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var LL = pick(r, [0.2,0.4,0.5,0.8,1,2]);
    var kk = pick(r, [0.1,0.2,0.25,0.4,0.5,0.6,0.75,0.8,0.9]);
    var MM = (Math.round((LL * kk) * 1000) / 1000);
    var Lp = (Math.round((2 * LL + 2 * LL * kk) * 1000) / 1000);
    var Lm = (Math.round((2 * LL - 2 * LL * kk) * 1000) / 1000);
    if (!(abs((LL * kk) * 1000 - Math.round((LL * kk) * 1000)) < 1e-9 && abs((2 * LL * kk) * 1000 - Math.round((2 * LL * kk) * 1000)) < 1e-9)) continue;
    var ok = (kk);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s6_three4(ok, [{x: (MM), why: "$M$ で止めた（$L$ で割っていない）", w: 0, cut: 1}, {x: (2 * kk), why: "$2M$ を $L$ で割った（4 で割っていない）", w: 1, cut: 1}, {x: (kk / 2), why: "$\\sqrt{L_1 L_2}$ を $L_1 + L_2$ とした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s6k", text: "図1・図2 のように、自己インダクタンスの等しい2つのコイルを、ドーナツの形の鉄心に同じ向きに巻き、直列につなぎました。合成インダクタンスは、図1 の端子 A–B 間で $" + fmt(Lp) + "\\,\\mathrm{H}$、図2 の端子 C–D 間で $" + fmt(Lm) + "\\,\\mathrm{H}$ でした。結合係数はいくらですか。", fig: {kind: "u52s6rr", L: tbU52s6_fig({"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1 は和動・図2 は差動。引くと $4M$、足すと $4L$　→　$M = " + fmt(MM) + "\\,\\mathrm{H}$、$L = " + fmt(LL) + "\\,\\mathrm{H}$", "$M = k \\sqrt{L \\times L} = kL$", "$k = \\dfrac{M}{L} = " + fmt(ok) + "$"], chk: {form: "u52s6k", p: {LL: LL, kk: kk}}};
  }
  throw new Error("u52s6k：条件に合う数字が見つからない");
}
function tbU52s6_Qmh(r){
  var gcd = tbU52s6_gcd, ratio = tbU52s6_ratio, par = tbU52s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var LL = pick(r, [20,40,50,60,80,100,120,150,200]);
    var MM = pick(r, [5,10,15,20,25,30,40,50]);
    var Lp = (2 * LL + 2 * MM);
    var Lm = (2 * LL - 2 * MM);
    if (!(MM < LL)) continue;
    var ok = (MM);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s6_three4(ok, [{x: (4 * MM), why: "2つの式を引いた $4M$ で止めた", w: 0, cut: 1}, {x: (2 * MM), why: "$2M$ で止めた（4 で割っていない）", w: 1, cut: 1}, {x: (LL), why: "足して $L$ を出した（求めるのは $M$）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{mH}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s6mh", text: "図1・図2 のように、自己インダクタンスの等しい2つのコイルを、ドーナツの形の鉄心に同じ向きに巻き、直列につなぎました。合成インダクタンスは、図1 の端子 A–B 間で $" + fmt(Lp) + "\\,\\mathrm{mH}" + "$、図2 の端子 C–D 間で $" + fmt(Lm) + "\\,\\mathrm{mH}" + "$ でした。相互インダクタンスは何 mH ですか。", fig: {kind: "u52s6rr", L: tbU52s6_fig({"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、図1 は和動・図2 は差動。$2L + 2M = " + fmt(Lp) + "$、$2L - 2M = " + fmt(Lm) + "$（mH のまま計算してよい）", "引くと $4M = " + fmt(Lp - Lm) + "$", "$M = " + fmt(ok) + "\\,\\mathrm{mH}" + "$"], chk: {form: "u52s6mh", p: {LL: LL, MM: MM}}};
  }
  throw new Error("u52s6mh：条件に合う数字が見つからない");
}
// 52-7 鉄心の透磁率を逆に出す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u52_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU52s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU52s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU52s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU52s7_par(a, b){ return a * b / (a + b); }
function tbU52s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU52s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU52s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU52s7_Qmu(r){
  var gcd = tbU52s7_gcd, ratio = tbU52s7_ratio, par = tbU52s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l = pick(r, [0.1,0.2,0.25,0.4,0.5,0.8,1]);
    var N = pick(r, [100,200,250,400,500,800,1000,2000]);
    var I = pick(r, [0.1,0.2,0.5,1,2,4,5]);
    var B = pick(r, [0.5,0.8,1,1.2,1.5,1.6,2]);
    var H = (N * I / l);
    if (!(abs((N * I / l) * 1 - Math.round((N * I / l) * 1)) < 1e-9 && nice(B * l / (N * I)) && B * l / (N * I) >= 0.001 && nice(B / (N * I)) && nice(B * l / I) && nice(N * I / (l * B)))) continue;
    var ok = (B / H);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s7_three4(ok, [{x: (B / (N * I)), why: "磁界の強さを出す時、磁路の長さで割っていない", w: 0, cut: 1}, {x: (B * l / I), why: "磁界の強さを出す時、巻数を掛けていない", w: 1, cut: 1}, {x: (H / B), why: "$B = \\mu H$ を逆に解いた（$H$ を $B$ で割った）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{H/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s7mu", text: "図のように、磁路の長さ $" + fmt(l) + "\\,\\mathrm{m}$ のドーナツの形の鉄心に巻数 $" + fmt(N) + "$ のコイルを巻き、$" + qv(I, "A") + "$ の電流を流すと、鉄心の中の磁束密度は $" + qv(B, "T") + "$ でした。鉄心の透磁率は何 H/m ですか。", fig: {kind: "u52s7tu", L: tbU52s7_fig({"ia":"in","n":"{N}","i":"{I}","l":"{l}","mu":"{μ}"}, [["n", "{N}=" + fmt(N)], ["i", "{I}=" + fmt(I) + " A"], ["l", "{l}=" + fmt(l) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{l} = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{" + fmt(l) + "} = " + qv(H, "Am") + "$", "$B = \\mu H$　より　$\\mu = \\dfrac{B}{H} = \\dfrac{" + fmt(B) + "}{" + fmt(H) + "}$", "$\\mu = " + fmt(ok) + "\\,\\mathrm{H/m}" + "$"], chk: {form: "u52s7mu", p: {l: l, N: N, I: I, B: B}}};
  }
  throw new Error("u52s7mu：条件に合う数字が見つからない");
}
function tbU52s7_Qmur(r){
  var gcd = tbU52s7_gcd, ratio = tbU52s7_ratio, par = tbU52s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var rr = pick(r, [0.05,0.1,0.15,0.2,0.25,0.3]);
    var N = pick(r, [100,200,250,400,500,1000]);
    var I = pick(r, [0.1,0.2,0.5,1,2]);
    var B = pick(r, [0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var M = (B * rr / (2 * N * I) * 10000000);
    if (!(abs((B * rr / (2 * N * I) * 10000000) * 1 - Math.round((B * rr / (2 * N * I) * 10000000) * 1)) < 1e-9 && M >= 10 && M <= 100000 && N * I != 1)) continue;
    var ok = (M);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s7_three4(ok, [{x: (M * N), why: "磁界の強さを出す時、巻数を掛けていない", w: 0, cut: 1}, {x: (M * N * I), why: "磁界の強さを出す時、起磁力 $NI$ を使っていない（巻数も電流も掛けていない）", w: 1, cut: 1}, {x: (M / 2), why: "$2 \\pi r$ を $\\pi r$ とした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s7mur", text: "図のように、半径 $" + fmt(rr) + "\\,\\mathrm{m}$ のドーナツの形の鉄心に巻数 $" + fmt(N) + "$ のコイルを巻き、$" + qv(I, "A") + "$ の電流を流すと、鉄心の中の磁束密度は $" + qv(B, "T") + "$ でした。鉄心の比透磁率はいくらですか。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。", fig: {kind: "u52s7tr", L: tbU52s7_fig({"ia":"in","n":"{N}","i":"{I}","l":"{l}","mu":"{μ}"}, [["n", "{N}=" + fmt(N)], ["i", "{I}=" + fmt(I) + " A"], ["r", "{r}=" + fmt(rr) + " m"], ["l", null], ["mu", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{2 \\pi r} = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{2 \\pi \\times " + fmt(rr) + "}$", "$\\mu_r = \\dfrac{B}{\\mu_0 H} = \\dfrac{" + fmt(B) + " \\times 2 \\pi \\times " + fmt(rr) + "}{4 \\pi \\times 10^{-7} \\times " + fmt(N) + " \\times " + fmt(I) + "}$", "$\\mu_r = " + fmt(ok) + "$"], chk: {form: "u52s7mur", p: {rr: rr, N: N, I: I, B: B}}};
  }
  throw new Error("u52s7mur：条件に合う数字が見つからない");
}
function tbU52s7_Qphi(r){
  var gcd = tbU52s7_gcd, ratio = tbU52s7_ratio, par = tbU52s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var l = pick(r, [0.1,0.2,0.25,0.4,0.5,0.8,1]);
    var N = pick(r, [100,200,250,400,500,800,1000,2000]);
    var I = pick(r, [0.1,0.2,0.5,1,2,4,5]);
    var ph = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2]);
    var S = pick(r, [0.0001,0.0002,0.0004,0.0005,0.001]);
    var B = (ph / 1000 / S);
    var H = (N * I / l);
    if (!(nice(B) && B <= 3 && abs((N * I / l) * 1 - Math.round((N * I / l) * 1)) < 1e-9 && nice(B / H) && B / H >= 0.001 && nice(B * l / I) && nice(B / (N * I)) && nice(ph / S / H))) continue;
    var ok = (B / H);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU52s7_three4(ok, [{x: (B * l / I), why: "磁界の強さを出す時、巻数を掛けていない", w: 0, cut: 1}, {x: (B / (N * I)), why: "磁界の強さを出す時、磁路の長さで割っていない", w: 1, cut: 1}, {x: (ph / S / H), why: "mWb を Wb に直していない", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{H/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u52s7phi", text: "図のように、磁路の長さ $" + fmt(l) + "\\,\\mathrm{m}$・断面積 $" + fmt(S) + "\\,\\mathrm{m^2}$ のドーナツの形の鉄心に巻数 $" + fmt(N) + "$ のコイルを巻き、$" + qv(I, "A") + "$ の電流を流すと、鉄心の中の磁束は $" + fmt(ph) + "\\,\\mathrm{mWb}" + "$ でした。鉄心の透磁率は何 H/m ですか。", fig: {kind: "u52s7tu", L: tbU52s7_fig({"ia":"in","n":"{N}","i":"{I}","l":"{l}","mu":"{μ}"}, [["n", "{N}=" + fmt(N)], ["i", "{I}=" + fmt(I) + " A"], ["l", "{l}=" + fmt(l) + " m"], ["s", "{S}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$B = \\dfrac{\\Phi}{S} = \\dfrac{" + fmt(ph) + " \\times 10^{-3}}{" + fmt(S) + "} = " + qv(B, "T") + "$", "$H = \\dfrac{NI}{l} = " + qv(H, "Am") + "$", "$\\mu = \\dfrac{B}{H} = " + fmt(ok) + "\\,\\mathrm{H/m}" + "$"], chk: {form: "u52s7phi", p: {l: l, N: N, I: I, ph: ph, S: S}}};
  }
  throw new Error("u52s7phi：条件に合う数字が見つからない");
}
var GEN = {
  // 52-1 2本の導体の磁界が 0 になる点
  1: function(r){ return pick(r, [tbU52s1_Qout, tbU52s1_Qout, tbU52s1_Qout, tbU52s1_Qmm, tbU52s1_Qmm, tbU52s1_Qmid, tbU52s1_Qmid, tbU52s1_Qgap, tbU52s1_Qgap, tbU52s1_Qxy, tbU52s1_Qxy])(r); },
  // 52-2 辺ごとの磁界を足して比べる
  2: function(r){ return pick(r, [tbU52s2_Qrat, tbU52s2_Qrat, tbU52s2_Qrat, tbU52s2_Qcur, tbU52s2_Qcur])(r); },
  // 52-3 四角いループに働く力
  3: function(r){ return pick(r, [tbU52s3_Qmag, tbU52s3_Qmag, tbU52s3_Qmag, tbU52s3_Qinv, tbU52s3_Qinv, tbU52s3_Qdir, tbU52s3_Qdir, tbU52s3_Qexpr])(r); },
  // 52-4 ファラデーの法則と自己誘導を等しく置く
  4: function(r){ return pick(r, [tbU52s4_QL, tbU52s4_QL, tbU52s4_QL, tbU52s4_QN, tbU52s4_QN])(r); },
  // 52-5 エアギャップのある磁気回路の巻数
  5: function(r){ return pick(r, [tbU52s5_QN, tbU52s5_QN, tbU52s5_QN, tbU52s5_QH, tbU52s5_QH, tbU52s5_Qrat, tbU52s5_Qrat])(r); },
  // 52-6 和動と差動の2つの測定
  6: function(r){ return pick(r, [tbU52s6_QM, tbU52s6_QM, tbU52s6_QM, tbU52s6_QL, tbU52s6_QL, tbU52s6_Qk, tbU52s6_Qk, tbU52s6_Qmh, tbU52s6_Qmh])(r); },
  // 52-7 鉄心の透磁率を逆に出す
  7: function(r){ return pick(r, [tbU52s7_Qmu, tbU52s7_Qmu, tbU52s7_Qmu, tbU52s7_Qmur, tbU52s7_Qmur, tbU52s7_Qphi, tbU52s7_Qphi])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t52s1e","scene":"t52s1e","kind":"u52s1xq","lab":{"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down","ia":"{I}_A","ib":"{I}_B","dpa":"{x}","dab":"{d}","hpa":"front","hpb":"back","ha":"{H}_A","hb":"{H}_B"},"viewbox":"184 81 716 691","band":{"want":"磁界が 0 になる点 P の位置","ans":"逆向きの所で、2つの磁界の式を等しく置いて解く"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①右ねじで向き\n②式を等しく置く\n③解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["P"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"右ねじの法則で、点 P での2つの磁界の向きを出します。〖逆向きの所でだけ、0 になれます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["P","Ha","Hb","Ia","Ib"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"0 になるのは、逆向きの2つの〖大きさが等しい〗時です。直線の導体の式を2つ、等しく置きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ha","Hb","Ia","Ib","Dpa","Dab"],"eq":[{"cont":false,"items":[["\\dfrac{I_A}{2 \\pi x} = \\dfrac{I_B}{2 \\pi (x + d)}"]]}],"emphPre":["Ha","Hb","Ia","Ib","Dpa","Dab"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"この式を $x$ について解くと、点 P の位置が分かります。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["P","Dpa"]}]}],"groups":{"Wa":["wa","wat0","wat1"],"Ia":["iaa","iaa:h","iat0","iat1"],"Wb":["wb","wbt0","wbt1"],"Ib":["iba","iba:h","ibt0","ibt1"],"P":["pd","pt0","pt1"],"Dpa":["dpad","dpad:h","dpad:h2","dpat0","dpat1"],"Dab":["dabd","dabd:h","dabd:h2","dabt0","dabt1"],"Dpb":["dpbe1","dpbe2","dpbd","dpbd:h","dpbd:h2","dpbt0","dpbt1"],"Ha":["hpac","hpac:t","hat0","hat1"],"Hb":["hpbc","hpbc:t","hbt0","hbt1"]},"moves":{},"route":["右ねじで向き","式を等しく置く","解く"]}},{"id":"t52s1x","scene":"t52s1x","kind":"u52s1xq","lab":{"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down","ia":"1 A","ib":"3 A","dpa":["{x}","{x}=1 m"],"dab":"2 m","dpb":"{x}+2","hpa":"front","hpb":"back","ha":"{H}_A","hb":"{H}_B"},"viewbox":"184 81 716 691","band":{"want":"磁界が 0 になる点 P の、A からの距離 $x$","known":"A 上向き $1\\,\\mathrm{A}$、B 下向き $3\\,\\mathrm{A}$、間隔 $2\\,\\mathrm{m}$","ans":"$x = 1\\,\\mathrm{m}$"},"narr":{"start":{"co":1,"dpav":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、磁界が 0 になる点 P の、A からの距離 $x$ です。","at":{"強調":1.0},"after":[],"emph":["P","Dpa","Dpb"]},{"text":"①右ねじで向き\n②磁界の強さ\n③等しく置く\n④解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["P","Dpa","Dpb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"A の電流は上向きです。右ねじの法則で、A の左の点 P では、A の磁界は手前向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ia","Ha"]},{"text":"B の電流は下向きです。B の左の点 P では、B の磁界は奥向きです。","at":{"強調":1.0},"after":[],"emph":["Ib","Hb"]},{"text":"〖2つの磁界は逆向き〗なので、引き算になります。大きさが等しい所で 0 です。","at":{"強調":1.0},"after":[],"emph":["Ha","Hb"]},{"text":"A と B の間では、2つとも奥向きで強め合うので、0 になりません。","at":{"強調":1.0},"after":[],"emph":["Wa","Wb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"A から $x$ 離れた所の、A の磁界です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ia","Dpa","Ha"],"eq":[{"cont":false,"items":[["H_A = \\dfrac{1}{2 \\pi x}"]]}],"emphPre":["Ia","Dpa","Ha"]},{"text":"B からは $x + 2$ 離れています。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Ib","Dpb","Hb","Dab"],"eq":[{"cont":false,"items":[["H_B = \\dfrac{3}{2 \\pi (x + 2)}"]]}],"emphPre":["Ib","Dpb","Hb","Dab"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"0 になるのは、2つの大きさが等しい時です。〖この2つの式を、等しく置きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Ha","Hb","Dpa","Dpb"],"eq":[{"cont":false,"items":[["\\dfrac{1}{2 \\pi x} = \\dfrac{3}{2 \\pi (x + 2)}"]]}],"emphPre":["Ha","Hb","Dpa","Dpb"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"両辺の $2 \\pi$ を消して、$x$ について解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":4,"emph":["Dpa","Dpb"],"eq":[{"cont":false,"items":[["\\dfrac{1}{x} = \\dfrac{3}{x + 2}"],["x + 2 = 3x"]]}],"emphPre":["Dpa","Dpb"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["2x = 2"],["x = 1\\,\\mathrm{m}"]]}],"move":"x","ans":true,"emph":["Dpa","P"]}]}],"groups":{"Wa":["wa","wat0","wat1"],"Ia":["iaa","iaa:h","iat0","iat1"],"Wb":["wb","wbt0","wbt1"],"Ib":["iba","iba:h","ibt0","ibt1"],"P":["pd","pt0","pt1"],"Dpa":["dpad","dpad:h","dpad:h2","dpat0","dpat1"],"Dab":["dabd","dabd:h","dabd:h2","dabt0","dabt1"],"Dpb":["dpbe1","dpbe2","dpbd","dpbd:h","dpbd:h2","dpbt0","dpbt1"],"Ha":["hpac","hpac:t","hat0","hat1"],"Hb":["hpbc","hpbc:t","hbt0","hbt1"]},"moves":{"x":{"to":{"dpav":1},"dur":0.4}},"route":["右ねじで向き","磁界の強さ","等しく置く","解く"]}},{"id":"t52s2e","scene":"t52s2e","kind":"u52s2sc","lab":{"ia":"right","o1":"O₁","o2":"O₂","i":"{I}","a":"{a}"},"viewbox":"163 96 1039 631","band":{"want":"四角いコイルの中心の磁界と、円形コイルの中心の磁界の比","ans":"4辺を足して、円形コイルの磁界で割る"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①4辺を足す\n②比べる\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Sq","O1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"右ねじの法則で、4つの辺は〖中心ではどれも同じ向き〗の磁界をつくります。足すと、1辺の磁界の4倍です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Sq","I","O1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"円形コイルの中心の磁界を、直径から半径に直して出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Cl","A","O2","I"],"eq":[{"cont":false,"items":[["H_2 = \\dfrac{NI}{2r}"]]}],"emphPre":["Cl","A","O2","I"]},{"text":"四角いコイルの磁界を、この磁界で割ります。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Sq","O1","O2"]}]}],"groups":{"Sq":["sq"],"O1":["o1d","o1t0","o1t1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1","adx1","adx1:h","adx1:h2","atx10","atx11"],"I":["ia","ia:h","it0","it1","iax1","iax1:h","itx10","itx11"],"Cl":["clx1"],"O2":["o2dx1","o2tx10","o2tx11"]},"moves":{},"route":["4辺を足す","比べる"]}},{"id":"t52s2x","scene":"t52s2x","kind":"u52s2sc","lab":{"ia":"right","o1":"O₁","o2":"O₂","i":"{I}","a":"{a}"},"viewbox":"163 96 1039 631","band":{"want":"四角いコイルの中心の磁界 $H_1$ が、円形コイルの中心の磁界 $H_2$ の何倍か","known":"1辺の磁界 $\\dfrac{\\sqrt{2}\\,I}{2 \\pi a}$、円の直径 $a$、同じ電流 $I$","ans":"約 $0.90$ 倍"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、図1 の中心 O₁ の磁界 $H_1$ が、図2 の中心 O₂ の磁界 $H_2$ の何倍かです。","at":{"強調":1.0},"after":[],"emph":["O1","O2"]},{"text":"①4辺の向き\n②4辺を足す\n③円形コイル\n④比\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["O1","O2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"上の辺の電流 $I$ は右向きです。右ねじの法則で、下にある中心 O₁ では奥向きの磁界です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","O1"]},{"text":"電流はコイルを回る向きに流れるので、ほかの3つの辺も、中心ではどれも奥向きです。〖4辺とも同じ向き〗です。","at":{"強調":1.0},"after":[],"emph":["Sq","O1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"同じ向きなので足します。4辺は同じ大きさなので、1辺の磁界の4倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Sq","A","I","O1"],"eq":[{"cont":false,"items":[["H_1 = 4 \\times \\dfrac{\\sqrt{2}\\,I}{2 \\pi a}"],["= \\dfrac{2\\sqrt{2}\\,I}{\\pi a}"]]}],"emphPre":["Sq","A","I","O1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"円形コイルの式は半径 $r$ を使います。図2 の $a$ は直径なので、〖半径は $\\dfrac{a}{2}$〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Cl","A","O2"]},{"text":"1回巻きなので $N = 1$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Cl","A","I","O2"],"eq":[{"cont":false,"items":[["H_2 = \\dfrac{I}{2 \\times \\dfrac{a}{2}}"],["= \\dfrac{I}{a}"]]}],"emphPre":["Cl","I","O2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"〖2つの答えを割ります〗。$I$ と $a$ は消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":4,"emph":["O1","O2","I","A"],"eq":[{"cont":false,"items":[["\\dfrac{H_1}{H_2} = \\dfrac{2\\sqrt{2}\\,I}{\\pi a} \\times \\dfrac{a}{I}"],["= \\dfrac{2\\sqrt{2}}{\\pi}"]]}],"emphPre":["O1","O2","I","A"]},{"text":"$\\sqrt{2}$ を $1.41$、$\\pi$ を $3.14$ として計算します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["O1","O2"],"eq":[{"cont":false,"items":[["\\dfrac{2 \\times 1.41}{3.14} = \\dfrac{2.82}{3.14}"]]}],"emphPre":["O1","O2"]},{"text":"割ると、〖約 $0.90$ 倍〗です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["O1","O2"]}]}],"groups":{"Sq":["sq"],"O1":["o1d","o1t0","o1t1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1","adx1","adx1:h","adx1:h2","atx10","atx11"],"I":["ia","ia:h","it0","it1","iax1","iax1:h","itx10","itx11"],"Cl":["clx1"],"O2":["o2dx1","o2tx10","o2tx11"]},"moves":{},"route":["4辺の向き","4辺を足す","円形コイル","比"]}},{"id":"t52s3e","scene":"t52s3e","kind":"u52s3ws","lab":{"wa":"A","wb":"B","iaa":"down","iba":"up","fn":"{F}_1","fna":"right","ff":"{F}_2","ffa":"left","ft":"{F}_3","fta":"down","fb":"{F}_4","fba":"up","ia":"{I}_A","ib":"{I}_B","d":"{d}","a":"{a}","a2":"{a}"},"viewbox":"246 98 722 684","band":{"want":"ループ B 全体に働く力","ans":"近い辺と遠い辺の力を引く（上下の辺は打ち消す）"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①近い辺・遠い辺\n②上下の辺\n③引く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Wb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"A に平行な2つの辺には、平行な2本の導体の式で力が働きます。〖距離は $d$ と $d + a$〗で違います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Fn","Ff","D","A"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"上と下の辺は、線対称なので〖同じ大きさで逆向き〗の力になり、打ち消し合います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ft","Fb"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"近い辺と遠い辺の力は逆向きなので、〖引き算〗します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Fn","Ff"],"eq":[{"cont":false,"items":[["F = F_1 - F_2"]]}],"ans":true,"emphPre":["Fn","Ff"]}]}],"groups":{"Wa":["wa","wad0","wad1","wat0","wat1"],"Ia":["iaa","iaa:h","iat0","iat1"],"Wb":["wb","wbt0","wbt1"],"Ib":["iba","iba:h","ibt0","ibt1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1"],"A2":["a2e1","a2e2","a2d","a2d:h","a2d:h2","a2t0","a2t1"],"Fn":["fna","fna:h","fnt0","fnt1"],"Ff":["ffa","ffa:h","fft0","fft1"],"Ft":["fta","fta:h","ftt0","ftt1"],"Fb":["fba","fba:h","fbt0","fbt1"]},"moves":{},"route":["近い辺・遠い辺","上下の辺","引く"]}},{"id":"t52s3x","scene":"t52s3x","kind":"u52s3ws","lab":{"wa":"A","wb":"B","iaa":"down","iba":"up","fn":"{F}_1","fna":"right","ff":"{F}_2","ffa":"left","ft":"{F}_3","fta":"down","fb":"{F}_4","fba":"up","ia":"10 A","ib":"5 A","d":"0.2 m","a":"0.2 m","a2":"0.2 m"},"viewbox":"246 98 722 684","band":{"want":"B 全体に働く力 $F$","known":"$I_A = 10\\,\\mathrm{A}$、$I_B = 5\\,\\mathrm{A}$、$d = a = 0.2\\,\\mathrm{m}$、$\\dfrac{\\mu_0}{2 \\pi} = 2 \\times 10^{-7}$","ans":"$F = 5 \\times 10^{-6}\\,\\mathrm{N}$（A から離れる向き）"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、ループ B 全体に働く力 $F$ です。","at":{"強調":1.0},"after":[],"emph":["Wb"]},{"text":"①近い辺\n②遠い辺\n③上下の辺\n④引く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Wb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"近い辺は、A から $0.2\\,\\mathrm{m}$ の所にある長さ $0.2\\,\\mathrm{m}$ の導体です。平行な2本の導体の式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Fn","D","A","A2","Ia","Ib"],"eq":[{"cont":false,"items":[["\\dfrac{10 \\times 5 \\times 0.2}{0.2} = 50"],["F_1 = 2 \\times 10^{-7} \\times 50"],["= 1 \\times 10^{-5}\\,\\mathrm{N}"]]}],"emphPre":["Fn","D","A","A2","Ia","Ib"]},{"text":"A の電流は下向きなので、右ねじの法則で、近い辺の所の磁界は手前向きです。近い辺の電流は上向きなので、左手で力は右向きです。","at":{"強調":1.0},"after":[],"emph":["Ia","Ib","Fn"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"遠い辺は、A から $0.4\\,\\mathrm{m}$ の所です。〖力は半分〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ff","D","A","Ia","Ib"],"eq":[{"cont":false,"items":[["\\dfrac{10 \\times 5 \\times 0.2}{0.4} = 25"],["F_2 = 2 \\times 10^{-7} \\times 25"],["= 0.5 \\times 10^{-5}\\,\\mathrm{N}"]]}],"emphPre":["Ff","D","A"]},{"text":"遠い辺の電流は下向きです。左手で、力は左向きです。","at":{"強調":1.0},"after":[],"emph":["Ff","Ia"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"上の辺と下の辺は、A から同じ所にあり、電流が逆向きです。〖線対称なので、同じ大きさで逆向き〗の力になり、打ち消し合います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Ft","Fb"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"残るのは、右向きの $F_1$ と左向きの $F_2$ です。〖逆向きなので引きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":4,"emph":["Fn","Ff"],"eq":[{"cont":false,"items":[["F = 1 \\times 10^{-5} - 0.5 \\times 10^{-5}"],["= 5 \\times 10^{-6}\\,\\mathrm{N}"]]}],"emphPre":["Fn","Ff"]},{"text":"$F_1$ の方が大きいので、向きは A から離れる向き（右向き）です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Fn"]}]}],"groups":{"Wa":["wa","wad0","wad1","wat0","wat1"],"Ia":["iaa","iaa:h","iat0","iat1"],"Wb":["wb","wbt0","wbt1"],"Ib":["iba","iba:h","ibt0","ibt1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1"],"A2":["a2e1","a2e2","a2d","a2d:h","a2d:h2","a2t0","a2t1"],"Fn":["fna","fna:h","fnt0","fnt1"],"Ff":["ffa","ffa:h","fft0","fft1"],"Ft":["fta","fta:h","ftt0","ftt1"],"Fb":["fba","fba:h","fbt0","fbt1"]},"moves":{},"route":["近い辺","遠い辺","上下の辺","引く"]}},{"id":"t52s4e","scene":"t52s4e","kind":"u52s4tr","lab":{"n":"{N}","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"},"viewbox":"-142 109 924 523","band":{"want":"自己インダクタンス $L$","ans":"磁束の変化から出した起電力を、電流の式と等しく置いて解く"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①磁束から起電力\n②等しく置く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ind"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"ファラデーの法則で、磁束の変化から起電力 $e$ を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","N","Phi"],"eq":[{"cont":false,"items":[["e = N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"emphPre":["E","N","Phi"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"同じ起電力は、電流の変化でも表せます。〖2つの式を等しく置き〗、$L$ について解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["E","Ind","I"],"eq":[{"cont":false,"items":[["e = L \\dfrac{\\Delta I}{\\Delta t}"]]}],"ans":true,"emphPre":["E","Ind","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["磁束から起電力","等しく置く"]}},{"id":"t52s4x","scene":"t52s4x","kind":"u52s4tr","lab":{"n":"{N}=20","i":"Δ{I}=0.4 A","phi":"Δ{Φ}=0.5 mWb","phia":"cw","e":["{e}","{e}=0.1 V"],"ea":"oppose","ind":["{L}","{L}=50 mH"]},"viewbox":"-142 109 924 523","band":{"want":"自己インダクタンス $L$","known":"$N = 20$、$0.2\\,\\mathrm{s}$ の間に $\\Delta I = 0.4\\,\\mathrm{A}$、$0.1\\,\\mathrm{s}$ の間に $\\Delta \\Phi = 0.5\\,\\mathrm{mWb}$","ans":"$L = 50\\,\\mathrm{mH}$"},"narr":{"start":{"co":1,"ev":0,"indv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは $L$ です。","at":{"強調":1.0},"after":[],"emph":["Ind"]},{"text":"①磁束から起電力\n②電流の式\n③等しく置く\n④解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ind"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"磁束は $0.1\\,\\mathrm{s}$ の間に $0.5\\,\\mathrm{mWb}$ 変わります。〖mWb を Wb に直します〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Phi"],"eq":[{"cont":false,"items":[["0.5\\,\\mathrm{mWb} = 0.5 \\times 10^{-3}\\,\\mathrm{Wb}"]]}],"emphPre":["Phi"]},{"text":"ファラデーの法則で、起電力の大きさを出します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["E","N","Phi"],"eq":[{"cont":false,"items":[["e = N \\dfrac{\\Delta \\Phi}{\\Delta t}"],["e = 20 \\times \\dfrac{0.5 \\times 10^{-3}}{0.1}"],["= 0.1\\,\\mathrm{V}"]]}],"move":"e","emphPre":["E","N","Phi"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"この $0.1\\,\\mathrm{V}$ は、電流が変わったことで生じた自己誘導起電力です。〖同じ起電力を、電流の変化でも表せます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E","I","Ind"],"eq":[{"cont":false,"items":[["e = L \\dfrac{\\Delta I}{\\Delta t}"]]}],"emphPre":["E","I","Ind"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"電流は $0.2\\,\\mathrm{s}$ の間に $0.4\\,\\mathrm{A}$ 変わります。〖2つの式を等しく置きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["E","I","Ind"],"eq":[{"cont":false,"items":[["0.1 = L \\times \\dfrac{0.4}{0.2}"]]}],"emphPre":["E","I","Ind"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$L$ について解き、mH に直します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":4,"emph":["Ind"],"eq":[{"cont":false,"items":[["L = \\dfrac{0.1}{2} = 0.05\\,\\mathrm{H}"],["= 50\\,\\mathrm{mH}"]]}],"move":"l","ans":true,"emphPre":["Ind"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"e":{"to":{"ev":1},"dur":0.4},"l":{"to":{"indv":1},"dur":0.4}},"route":["磁束から起電力","電流の式","等しく置く","解く"]}},{"id":"t52s5e","scene":"t52s5e","kind":"u52s5cg","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","gap":"{H}_0","s":"{S}","l":"{l}_1","gl":"{l}_2","mu":"{μ}_r"},"viewbox":"-176 91 1332 657","band":{"want":"ギャップの磁界を $H_0$ にする巻数 $N$","ans":"磁束を出し、直列の磁気抵抗に掛けて起磁力にする"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"①磁束\n②直列の磁気抵抗\n③起磁力\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["N"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"ギャップの磁界 $H_0$ から、磁束密度 $B = \\mu_0 H_0$ と磁束 $\\Phi = BS$ を出します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Gap","Phi","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"鉄心とエアギャップは、直列の2つの磁気抵抗です。〖足します〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["L","Gl","Mu","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"〖磁束 × 磁気抵抗が起磁力〗です。電流で割ると巻数です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["N","I","Phi"],"eq":[{"cont":false,"items":[["NI = \\Phi (R_1 + R_2)"]]}],"ans":true,"emphPre":["N","I","Phi"]}]}],"groups":{"Core":["core"],"Gap":["gapc","gapt0","gapt1"],"Gl":["gld","gld:h","gld:h2","glt0","glt1"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["磁束","直列の磁気抵抗","起磁力"]}},{"id":"t52s5x","scene":"t52s5x","kind":"u52s5cg","lab":{"n":["{N}","{N}=120"],"i":"{I}=1 A","phi":"{Φ}","phia":"cw","gap":"{H}_0","s":"{S}","l":"{l}_1=0.2 m","gl":"{l}_2=1 mm","mu":"{μ}_r=1000"},"viewbox":"-176 91 1332 657","band":{"want":"巻数 $N$","known":"$l_1 = 0.2\\,\\mathrm{m}$、$\\mu_r = 1000$、$l_2 = 1\\,\\mathrm{mm}$、$H_0 = 1 \\times 10^{5}\\,\\mathrm{A/m}$、$I = 1\\,\\mathrm{A}$","ans":"$N = 120$"},"narr":{"start":{"co":1,"nv":0},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"求めるのは、ギャップの磁界を $1 \\times 10^{5}\\,\\mathrm{A/m}$ にする巻数 $N$ です。","at":{"強調":1.0},"after":[],"emph":["N","Gap"]},{"text":"①磁束\n②直列の磁気抵抗\n③起磁力\n④巻数\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["N","Gap"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"ギャップの磁束密度は、空気なので $\\mu_0$ を掛けます。磁束は、断面積を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Gap","Phi","S"],"eq":[{"cont":false,"items":[["B = \\mu_0 H_0"],["\\Phi = BS = \\mu_0 H_0 S"]]}],"emphPre":["Gap","Phi","S"]},{"text":"断面積はどこも同じなので、〖鉄心の中も同じ磁束〗です。","at":{"強調":1.0},"after":[],"emph":["Phi","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"$l_2 = 1\\,\\mathrm{mm} = 0.001\\,\\mathrm{m}$ に直します。鉄心とエアギャップの磁気抵抗を足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["L","Gl","Mu","S"],"eq":[{"cont":false,"items":[["R_1 + R_2 = \\dfrac{l_1}{\\mu_0 \\mu_r S} + \\dfrac{l_2}{\\mu_0 S}"]]}],"emphPre":["L","Gl","Mu","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"〖この磁束を、足した磁気抵抗に掛けると起磁力〗です。$\\mu_0$ と $S$ は消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["N","I","Phi","S","Gap","L","Gl","Mu"],"eq":[{"cont":false,"items":[["NI = \\Phi (R_1 + R_2)"],["= H_0 \\left( \\dfrac{l_1}{\\mu_r} + l_2 \\right)"]]}],"emphPre":["N","I","Phi","S"]},{"text":"数を入れます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","I","Gap","L","Gl","Mu"],"eq":[{"cont":false,"items":[["\\dfrac{0.2}{1000} + 0.001 = 0.0012"],["NI = 1 \\times 10^{5} \\times 0.0012"],["= 120\\,\\mathrm{A}"]]}],"emphPre":["N","I","Gap","L","Gl","Mu"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"電流は $1\\,\\mathrm{A}$ なので、巻数は起磁力と同じ数です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":4,"emph":["N","I"],"eq":[{"cont":false,"items":[["N = \\dfrac{120}{1} = 120"]]}],"move":"n","ans":true,"emphPre":["N","I"]}]}],"groups":{"Core":["core"],"Gap":["gapc","gapt0","gapt1"],"Gl":["gld","gld:h","gld:h2","glt0","glt1"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"n":{"to":{"nv":1},"dur":0.4}},"route":["磁束","直列の磁気抵抗","起磁力","巻数"]}},{"id":"t52s6e","scene":"t52s6e","kind":"u52s6rr","lab":{"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"},"viewbox":"216 160 1436 848","band":{"want":"2つのつなぎ方の合成インダクタンスから $M$","ans":"和動か差動かを決め、2つの式を引く"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①和動と差動\n②引く\n③足す\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Core"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"右ねじの法則で、2つのコイルの磁束の向きを見ます。同じ向きなら和動、逆なら差動です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["L1","L2"],"eq":[{"cont":false,"items":[["\\text{和動}\\;\\; 2L + 2M","\\text{差動}\\;\\; 2L - 2M"]]}],"emphPre":["L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖2つの式を引くと $4M$〗が残ります。4 で割ると $M$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖足すと $4L$〗です。$M$ と $L$ が分かれば、結合係数 $k = \\dfrac{M}{L}$ も出せます。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["L1","L2"]}]}],"groups":{"Core":["core","co","ci","cld","coret0","coret1","corex1","cox1","cix1","cldx1","coretx10","coretx11"],"N1":["w10","w11","w12","w13","w14","n1t0","n1t1","lda","w10x1","w11x1","w12x1","w13x1","w14x1","n1tx10","n1tx11","ldax1"],"L1":["l1t0","l1t1","l1tx10","l1tx11"],"N2":["w20","w21","w22","w23","w24","n2t0","n2t1","ldb","w20x1","w21x1","w22x1","w23x1","w24x1","n2tx10","n2tx11","ldbx1"],"L2":["l2t0","l2t1","l2tx10","l2tx11"],"Ta":["tma","tat0","tat1"],"Tb":["tmb","tbt0","tbt1"],"Tc":["tmax1","tctx10","tctx11"],"Td":["tmbx1","tdtx10","tdtx11"]},"moves":{},"route":["和動と差動","引く","足す"]}},{"id":"t52s6x","scene":"t52s6x","kind":"u52s6rr","lab":{"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"},"viewbox":"216 160 1436 848","band":{"want":"相互インダクタンス $M$","known":"図1 の A–B 間 $2.4\\,\\mathrm{H}$、図2 の C–D 間 $1.6\\,\\mathrm{H}$","ans":"$M = 0.2\\,\\mathrm{H}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは $M$ です。","at":{"強調":1.0},"after":[],"emph":["L1","L2"]},{"text":"①和動と差動\n②式を立てる\n③引く\n④4 で割る\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"図1 では、端子 A から入った電流が、左のコイルを上から下へ、右のコイルを下から上へ流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ta","Tb","L1","L2"]},{"text":"巻き方は同じなので、右ねじの法則で、2つの磁束は鉄心を〖同じ向きに回ります〗。図1 は和動です。","at":{"強調":1.0},"after":[],"emph":["Core","L1","L2"]},{"text":"図2 では、2つのコイルとも上から下へ流れます。磁束は〖逆向き〗になり、図2 は差動です。","at":{"強調":1.0},"after":[],"emph":["Tc","Td","Core"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"和動は $2M$ を足し、差動は $2M$ を引きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["L1","L2"],"eq":[{"cont":false,"items":[["2L + 2M = 2.4","2L - 2M = 1.6"]]}],"emphPre":["L1","L2"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖2つの式を引くと、$L$ が消えます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["L1","L2"],"eq":[{"cont":false,"items":[["4M = 2.4 - 1.6"],["= 0.8"]]}],"emphPre":["L1","L2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$4M$ で止めずに、4 で割ります。","at":{"道筋":1.0,"式":1.0,"答え":1.0},"after":["答え"],"route":4,"eq":[{"cont":false,"items":[["M = \\dfrac{0.8}{4} = 0.2\\,\\mathrm{H}"]]}],"ans":true}]}],"groups":{"Core":["core","co","ci","cld","coret0","coret1","corex1","cox1","cix1","cldx1","coretx10","coretx11"],"N1":["w10","w11","w12","w13","w14","n1t0","n1t1","lda","w10x1","w11x1","w12x1","w13x1","w14x1","n1tx10","n1tx11","ldax1"],"L1":["l1t0","l1t1","l1tx10","l1tx11"],"N2":["w20","w21","w22","w23","w24","n2t0","n2t1","ldb","w20x1","w21x1","w22x1","w23x1","w24x1","n2tx10","n2tx11","ldbx1"],"L2":["l2t0","l2t1","l2tx10","l2tx11"],"Ta":["tma","tat0","tat1"],"Tb":["tmb","tbt0","tbt1"],"Tc":["tmax1","tctx10","tctx11"],"Td":["tmbx1","tdtx10","tdtx11"]},"moves":{},"route":["和動と差動","式を立てる","引く","4 で割る"]}},{"id":"t52s7e","scene":"t52s7e","kind":"u52s7tu","lab":{"ia":"in","n":"{N}","i":"{I}","l":"{l}","mu":"{μ}"},"viewbox":"144 167 944 572","band":{"want":"鉄心の透磁率 $\\mu$","ans":"$H = \\dfrac{NI}{l}$ を出し、$B = \\mu H$ を $\\mu$ について解く"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①磁界の強さ\n②μ について解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Mu"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"鉄心の中の磁界の強さです。〖$2 \\pi r$ は、輪を一周する長さ $l$〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["N","I","L"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{l}"]]}],"emphPre":["N","I","L"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖この $H$ と測った磁束密度を〗 $B = \\mu H$ に入れ、$\\mu$ について解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Mu"],"eq":[{"cont":false,"items":[["\\mu = \\dfrac{B}{H}"]]}],"ans":true,"emphPre":["Mu"]}]}],"groups":{"Core":["core","co","ci","coret0","coret1"],"L":["ll","lld","lt0","lt1"],"S":["sc","sld","st0","st1"],"Mu":["muld","mut0","mut1"],"N":["wd0","wd1","wd2","wd3","wd4","wd5","wd6","wd7","wd8","ld0","ld1","nt0","nt1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["磁界の強さ","μ について解く"]}},{"id":"t52s7x","scene":"t52s7x","kind":"u52s7tu","lab":{"ia":"in","n":"{N}=1000","i":"{I}=0.1 A","l":"{l}=0.2 m","mu":"{μ}"},"viewbox":"144 167 944 572","band":{"want":"鉄心の透磁率 $\\mu$","known":"$l = 0.2\\,\\mathrm{m}$、$N = 1000$、$I = 0.1\\,\\mathrm{A}$、$B = 1.0\\,\\mathrm{T}$","ans":"$\\mu = 2 \\times 10^{-3}\\,\\mathrm{H/m}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、鉄心の透磁率 $\\mu$ です。","at":{"強調":1.0},"after":[],"emph":["Mu"]},{"text":"①磁界の強さ\n②B = μH\n③μ について解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Mu"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"鉄心の中の磁界の強さです。$2 \\pi r$ は、輪を一周する長さ $l$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["N","I","L"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{l}"],["H = \\dfrac{1000 \\times 0.1}{0.2}"],["= 500\\,\\mathrm{A/m}"]]}],"emphPre":["N","I","L"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖この $500\\,\\mathrm{A/m}$ と、測った $1.0\\,\\mathrm{T}$ を〗、$B = \\mu H$ に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Mu"],"eq":[{"cont":false,"items":[["1.0 = \\mu \\times 500"]]}],"emphPre":["Mu"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$\\mu$ について解きます。$H$ で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Mu"],"eq":[{"cont":false,"items":[["\\mu = \\dfrac{1.0}{500}"],["= 0.002 = 2 \\times 10^{-3}\\,\\mathrm{H/m}"]]}],"ans":true,"emphPre":["Mu"]}]}],"groups":{"Core":["core","co","ci","coret0","coret1"],"L":["ll","lld","lt0","lt1"],"S":["sc","sld","st0","st1"],"Mu":["muld","mut0","mut1"],"N":["wd0","wd1","wd2","wd3","wd4","wd5","wd6","wd7","wd8","ld0","ld1","nt0","nt1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["磁界の強さ","B = μH","μ について解く"]}}],"secs":[{"ex":{"text":"図のように、$2\\,\\mathrm{m}$ 離れた平行な2本の導体 A・B に、A は上向きに $1\\,\\mathrm{A}$、B は下向きに $3\\,\\mathrm{A}$ の電流を流しました。A の左側で、磁界の強さが 0 になる点 P は、A から何 m ですか。","fig":{"kind":"u52s1xq","L":{"wa":"A","wb":"B","p":"P","iaa":"up","iba":"down","ia":"1 A","ib":"3 A","dpa":"{x}","dab":"2 m"},"P":{}},"ch":[{"t":"$0.5\\,\\mathrm{m}$","v":0.5,"why":"向きを決めず、A と B の間に置いた（間では2つとも奥向きで強め合う）"},{"t":"$1\\,\\mathrm{m}$","v":1,"why":""},{"t":"$3\\,\\mathrm{m}$","v":3,"why":"B からの距離 $x + 2$ を答えた（A からの距離に直していない）"},{"t":"$\\dfrac{2}{3}\\,\\mathrm{m}$","v":0.667,"why":"B からの距離を、A と B の間の $2\\,\\mathrm{m}$ にした"}],"ans":1}},{"ex":{"text":"図1 のように、4つの辺の長さがどれも $a$ の四角いコイルに電流 $I$ を流すと、1つの辺が中心 O₁ につくる磁界の強さは $\\dfrac{\\sqrt{2}\\,I}{2 \\pi a}$ です。同じ電流 $I$ を、図2 の直径 $a$・1回巻きの円形コイルに流しました。O₁ の磁界の強さは、円形コイルの中心 O₂ の磁界の強さの何倍ですか。","fig":{"kind":"u52s2sc","L":{"ia":"right","o1":"O₁","o2":"O₂","i":"{I}","a":"{a}"},"P":{}},"ch":[{"t":"$0.23$ 倍","v":0.23,"why":"1辺の磁界だけで比べた（4辺を足していない）"},{"t":"$0.45$ 倍","v":0.45,"why":"2辺の磁界だけで比べた"},{"t":"$0.90$ 倍","v":0.9,"why":""},{"t":"$1.80$ 倍","v":1.8,"why":"円の直径 $a$ を半径とした"}],"ans":2}},{"ex":{"text":"図のように、長い直線の導体 A に下向きの電流 $10\\,\\mathrm{A}$ を流し、A から $0.2\\,\\mathrm{m}$ の所に、辺の長さがどれも $0.2\\,\\mathrm{m}$ の四角いループ B を置いて、電流 $5\\,\\mathrm{A}$ を流しました。A に近い辺の電流は上向きです。B 全体に働く力の大きさは何 N ですか。真空中の透磁率を $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。","fig":{"kind":"u52s3ws","L":{"wa":"A","wb":"B","iaa":"down","iba":"up","ia":"10 A","ib":"5 A","d":"0.2 m","a":"0.2 m","a2":"0.2 m"},"P":{}},"ch":[{"t":"$1 \\times 10^{-5}\\,\\mathrm{N}$","v":1e-05,"why":"近い辺の力だけを答えた"},{"t":"$1.5 \\times 10^{-5}\\,\\mathrm{N}$","v":1.5e-05,"why":"遠い辺の向きを決めず、2つの力を足した"},{"t":"$5 \\times 10^{-6}\\,\\mathrm{N}$","v":5e-06,"why":""},{"t":"$0\\,\\mathrm{N}$","v":0,"why":"全部の辺が打ち消し合うとした（打ち消すのは上下の辺だけ）"}],"ans":2}},{"ex":{"text":"巻数 $20$ のコイルの電流が、$0.2\\,\\mathrm{s}$ の間に $0.4\\,\\mathrm{A}$ の割合で変わりました。そのとき、コイルを貫く磁束は、$0.1\\,\\mathrm{s}$ の間に $0.5\\,\\mathrm{mWb}$ の割合で変わりました。このコイルの自己インダクタンスは何 mH ですか。","fig":{"kind":"u52s4tr","L":{"n":"{N}=20","i":"Δ{I}=0.4 A","phi":"Δ{Φ}=0.5 mWb","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"},"P":{}},"ch":[{"t":"$100\\,\\mathrm{mH}$","v":100,"why":"起電力 $0.1\\,\\mathrm{V}$ を、そのまま自己インダクタンスとした"},{"t":"$2.5\\,\\mathrm{mH}$","v":2.5,"why":"ファラデーの法則で巻数を掛けていない"},{"t":"$50\\,\\mathrm{mH}$","v":50,"why":""},{"t":"$1250\\,\\mathrm{mH}$","v":1250,"why":"電流の変化を時間で割らず、掛けた"}],"ans":2}},{"ex":{"text":"図のように、鉄心の磁路の長さ $l_1 = 0.2\\,\\mathrm{m}$・比透磁率 $1000$ の鉄心に、長さ $l_2 = 1\\,\\mathrm{mm}$ のエアギャップがあります。断面積はどこも同じです。電流 $1\\,\\mathrm{A}$ で、ギャップの磁界の強さ $H_0$ を $1 \\times 10^{5}\\,\\mathrm{A/m}$ にするには、巻数はいくら要りますか。","fig":{"kind":"u52s5cg","L":{"n":"{N}","i":"{I}=1 A","phi":"{Φ}","phia":"cw","gap":"{H}_0","s":"{S}","l":"{l}_1=0.2 m","gl":"{l}_2=1 mm","mu":"{μ}_r=1000"},"P":{}},"ch":[{"t":"$100$","v":100,"why":"エアギャップの分だけで、鉄心の磁気抵抗を足していない"},{"t":"$120$","v":120,"why":""},{"t":"$20$","v":20,"why":"鉄心の分だけで、エアギャップの磁気抵抗を足していない"},{"t":"$1020$","v":1020,"why":"$1\\,\\mathrm{mm}$ を $0.01\\,\\mathrm{m}$ と直した"}],"ans":1}},{"ex":{"text":"図1・図2 のように、自己インダクタンスの等しい2つのコイルを、ドーナツの形の鉄心に同じ向きに巻き、直列につなぎました。合成インダクタンスは、図1 の端子 A–B 間で $2.4\\,\\mathrm{H}$、図2 の端子 C–D 間で $1.6\\,\\mathrm{H}$ でした。相互インダクタンスは何 H ですか。","fig":{"kind":"u52s6rr","L":{"ta":"A","tb":"B","tc":"C","td":"D","l1":"{L}","l2":"{L}"},"P":{}},"ch":[{"t":"$0.8\\,\\mathrm{H}$","v":0.8,"why":"2つの式を引いた $4M$ で止めた"},{"t":"$0.4\\,\\mathrm{H}$","v":0.4,"why":"$2M$ で止めた（4 で割っていない）"},{"t":"$0.2\\,\\mathrm{H}$","v":0.2,"why":""},{"t":"$1\\,\\mathrm{H}$","v":1.0,"why":"足して $L$ を出した（求めるのは $M$）"}],"ans":2}},{"ex":{"text":"図のように、磁路の長さ $0.2\\,\\mathrm{m}$ のドーナツの形の鉄心に巻数 $1000$ のコイルを巻き、$0.1\\,\\mathrm{A}$ の電流を流すと、鉄心の中の磁束密度は $1.0\\,\\mathrm{T}$ でした。鉄心の透磁率は何 H/m ですか。","fig":{"kind":"u52s7tu","L":{"ia":"in","n":"{N}=1000","i":"{I}=0.1 A","l":"{l}=0.2 m","mu":"{μ}"},"P":{}},"ch":[{"t":"$1 \\times 10^{-2}\\,\\mathrm{H/m}$","v":0.01,"why":"磁界の強さを出す時、磁路の長さで割っていない"},{"t":"$2 \\times 10^{-3}\\,\\mathrm{H/m}$","v":0.002,"why":""},{"t":"$2\\,\\mathrm{H/m}$","v":2,"why":"磁界の強さを出す時、巻数を掛けていない"},{"t":"$5 \\times 10^{2}\\,\\mathrm{H/m}$","v":500,"why":"$B = \\mu H$ を逆に解いた（$H$ を $B$ で割った）"}],"ans":1}}],"past":[]}};
});
