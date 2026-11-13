/* 単元22「電磁誘導」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(22, function(H){
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
// ---- 22-1 電磁誘導 の図（※ textbook/gen/make_section.py が textbook/gen/data/u22_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U22S1K = {
  cm: {"vars":[],"items":[{"f":"ln","id":"mga","pts":[[140,380],[250,380],[250,460],[140,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"s","col":"#1971c2"},"S":{"fill":"n","col":"#c92a2a"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgat","x":195,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"S"},"S":{"s":"N"}},"dflt":"N","vis":[],"t":"F"},{"f":"ln","id":"mgb","pts":[[250,380],[360,380],[360,460],[250,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgbt","x":305,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"mgt","k":"mg","bases":[[250,496,"middle",[0,1]]],"mv":[["pos",160,0]],"need":"mg","vis":[],"t":"F","x":250,"y":496,"anc":"middle"},{"f":"ar","id":"goa","x0":200,"y0":310,"x1":320,"y1":310,"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x0":190,"y0":330,"x1":320,"y1":330},"left":{"x0":320,"y0":330,"x1":190,"y1":330},"in":{"x0":190,"y0":330,"x1":320,"y1":330},"out":{"x0":320,"y0":330,"x1":190,"y1":330}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"got","k":"go","bases":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"vbases":{"right":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"left":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]],"in":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"out":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]]},"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x":260,"y":274,"anc":"middle"},"left":{"x":140,"y":280,"anc":"middle"},"in":{"x":260,"y":274,"anc":"middle"},"out":{"x":140,"y":280,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":260,"y":280,"anc":"middle"},{"f":"ln","id":"phf0","pts":[[362,400],[620,220],[860,160]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn0","pts":[[522,400],[700,340],[900,310]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf1","pts":[[362,420],[620,420],[860,420]],"w":3,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn1","pts":[[522,420],[700,420],[900,420]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf2","pts":[[362,440],[620,620],[860,680]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn2","pts":[[522,440],[700,500],[900,530]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"pht","k":"ph","bases":[[870,300,"start",[1,-1]]],"need":"ph","vis":[],"t":"F","x":851.62,"y":281.62,"anc":"start"},{"f":"ln","id":"clb","pts":[[700,550],[695.19,549.29],[690.44,547.16],[685.79,543.64],[681.29,538.76],[677,532.58],[672.96,525.17],[669.22,516.61],[665.82,506.99],[662.79,496.41],[660.16,485],[657.98,472.88],[656.25,460.17],[655.01,447.03],[654.25,433.59],[654,420],[654.25,406.41],[655.01,392.97],[656.25,379.83],[657.98,367.12],[660.16,355],[662.79,343.59],[665.82,333.01],[669.22,323.39],[672.96,314.83],[677,307.42],[681.29,301.24],[685.79,296.36],[690.44,292.84],[695.19,290.71],[700,290]],"dash":1,"w":4,"vis":[],"t":"F"},{"f":"ln","id":"clf","pts":[[700,290],[704.81,290.71],[709.56,292.84],[714.21,296.36],[718.71,301.24],[723,307.42],[727.04,314.83],[730.78,323.39],[734.18,333.01],[737.21,343.59],[739.84,355],[742.02,367.12],[743.75,379.83],[744.99,392.97],[745.75,406.41],[746,420],[745.75,433.59],[744.99,447.03],[743.75,460.17],[742.02,472.88],[739.84,485],[737.21,496.41],[734.18,506.99],[730.78,516.61],[727.04,525.17],[723,532.58],[718.71,538.76],[714.21,543.64],[709.56,547.16],[704.81,549.29],[700,550]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"cl0","pts":[[694,550],[694,640]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"cl1","pts":[[722,544],[722,640]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"clt","k":"cl","bases":[[760,290,"start",[1,-1]]],"need":"cl","vis":[],"t":"F","x":760,"y":290,"anc":"start"},{"f":"ar","id":"ipa","x0":630,"y0":420,"x1":770,"y1":420,"w":12,"o":["ipd"],"need":"ip","sel":"ipa","var":{"left":{"x0":770,"y0":420,"x1":630,"y1":420},"right":{"x0":630,"y0":420,"x1":770,"y1":420}},"dflt":"right","col":"#adb5bd","vis":[],"t":"F"},{"f":"lb","id":"ipt","k":"ip","bases":[[700,380,"middle",[0,-1]]],"o":["ipd"],"need":"ip","vis":[],"t":"F","x":700,"y":380,"anc":"middle"},{"f":"ar","id":"ih0","x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76},"cw":{"x0":736.74,"y0":341.76,"x1":742.34,"y1":369.2}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"ih1","x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8},"cw":{"x0":742.34,"y0":470.8,"x1":736.74,"y1":498.24}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[776,480,"start",[1,1]]],"o":["id"],"need":"i","vis":[],"t":"F","x":776,"y":480,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[640,610,"end",[-1,1]]],"need":"n","vis":[],"t":"F","x":640,"y":610,"anc":"end"},{"f":"ar","id":"ea","x0":790,"y0":630,"x1":790,"y1":560,"w":3,"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[810,596,"start",[1,0]]],"need":"e","vis":[],"t":"F","x":810,"y":596,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU22s1cm(d, p, L){ tbFig_Draw(d, p, L, U22S1K.cm); }
// ---- 22-2 誘導電流の向き の図（※ textbook/gen/make_section.py が textbook/gen/data/u22_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U22S2K = {
  cm: {"vars":[],"items":[{"f":"ln","id":"mga","pts":[[140,380],[250,380],[250,460],[140,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"s","col":"#1971c2"},"S":{"fill":"n","col":"#c92a2a"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgat","x":195,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"S"},"S":{"s":"N"}},"dflt":"N","vis":[],"t":"F"},{"f":"ln","id":"mgb","pts":[[250,380],[360,380],[360,460],[250,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgbt","x":305,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"mgt","k":"mg","bases":[[250,496,"middle",[0,1]]],"mv":[["pos",160,0]],"need":"mg","vis":[],"t":"F","x":250,"y":496,"anc":"middle"},{"f":"ar","id":"goa","x0":200,"y0":310,"x1":320,"y1":310,"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x0":190,"y0":330,"x1":320,"y1":330},"left":{"x0":320,"y0":330,"x1":190,"y1":330},"in":{"x0":190,"y0":330,"x1":320,"y1":330},"out":{"x0":320,"y0":330,"x1":190,"y1":330}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"got","k":"go","bases":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"vbases":{"right":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"left":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]],"in":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"out":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]]},"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x":260,"y":274,"anc":"middle"},"left":{"x":140,"y":280,"anc":"middle"},"in":{"x":260,"y":274,"anc":"middle"},"out":{"x":140,"y":280,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":260,"y":280,"anc":"middle"},{"f":"ln","id":"phf0","pts":[[362,400],[620,220],[860,160]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn0","pts":[[522,400],[700,340],[900,310]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf1","pts":[[362,420],[620,420],[860,420]],"w":3,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn1","pts":[[522,420],[700,420],[900,420]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf2","pts":[[362,440],[620,620],[860,680]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn2","pts":[[522,440],[700,500],[900,530]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"pht","k":"ph","bases":[[870,300,"start",[1,-1]]],"need":"ph","vis":[],"t":"F","x":851.62,"y":281.62,"anc":"start"},{"f":"ln","id":"clb","pts":[[700,550],[695.19,549.29],[690.44,547.16],[685.79,543.64],[681.29,538.76],[677,532.58],[672.96,525.17],[669.22,516.61],[665.82,506.99],[662.79,496.41],[660.16,485],[657.98,472.88],[656.25,460.17],[655.01,447.03],[654.25,433.59],[654,420],[654.25,406.41],[655.01,392.97],[656.25,379.83],[657.98,367.12],[660.16,355],[662.79,343.59],[665.82,333.01],[669.22,323.39],[672.96,314.83],[677,307.42],[681.29,301.24],[685.79,296.36],[690.44,292.84],[695.19,290.71],[700,290]],"dash":1,"w":4,"vis":[],"t":"F"},{"f":"ln","id":"clf","pts":[[700,290],[704.81,290.71],[709.56,292.84],[714.21,296.36],[718.71,301.24],[723,307.42],[727.04,314.83],[730.78,323.39],[734.18,333.01],[737.21,343.59],[739.84,355],[742.02,367.12],[743.75,379.83],[744.99,392.97],[745.75,406.41],[746,420],[745.75,433.59],[744.99,447.03],[743.75,460.17],[742.02,472.88],[739.84,485],[737.21,496.41],[734.18,506.99],[730.78,516.61],[727.04,525.17],[723,532.58],[718.71,538.76],[714.21,543.64],[709.56,547.16],[704.81,549.29],[700,550]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"cl0","pts":[[694,550],[694,640]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"cl1","pts":[[722,544],[722,640]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"clt","k":"cl","bases":[[760,290,"start",[1,-1]]],"need":"cl","vis":[],"t":"F","x":760,"y":290,"anc":"start"},{"f":"ar","id":"ipa","x0":630,"y0":420,"x1":770,"y1":420,"w":12,"o":["ipd"],"need":"ip","sel":"ipa","var":{"left":{"x0":770,"y0":420,"x1":630,"y1":420},"right":{"x0":630,"y0":420,"x1":770,"y1":420}},"dflt":"right","col":"#adb5bd","vis":[],"t":"F"},{"f":"lb","id":"ipt","k":"ip","bases":[[700,380,"middle",[0,-1]]],"o":["ipd"],"need":"ip","vis":[],"t":"F","x":700,"y":380,"anc":"middle"},{"f":"ar","id":"ih0","x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76},"cw":{"x0":736.74,"y0":341.76,"x1":742.34,"y1":369.2}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"ih1","x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8},"cw":{"x0":742.34,"y0":470.8,"x1":736.74,"y1":498.24}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[776,480,"start",[1,1]]],"o":["id"],"need":"i","vis":[],"t":"F","x":776,"y":480,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[640,610,"end",[-1,1]]],"need":"n","vis":[],"t":"F","x":640,"y":610,"anc":"end"},{"f":"ar","id":"ea","x0":790,"y0":630,"x1":790,"y1":560,"w":3,"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[810,596,"start",[1,0]]],"need":"e","vis":[],"t":"F","x":810,"y":596,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  rl: {"vars":[],"items":[{"f":"ln","id":"rl","pts":[[980,250],[200,250],[200,570],[980,570]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"dsf","pts":[[520,254],[740,254],[740,566],[520,566]],"w":1,"fill":"area","close":1,"o":["dsd"],"need":"ds","vis":[],"t":"F"},{"f":"tx","id":"bs0","x":270,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[],"t":"F"},{"f":"tx","id":"bs1","x":270,"y":410,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[],"t":"F"},{"f":"tx","id":"bs2","x":370,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[210,210,"start",[0,-1]]],"need":"b","vis":[],"t":"F","x":210,"y":210,"anc":"start"},{"f":"ln","id":"rod","pts":[[520,220],[520,600]],"w":10,"mv":[["md",220,0]],"col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"rodt","k":"rod","bases":[[520,190,"middle",[0,-1]]],"mv":[["md",220,0]],"need":"rod","vis":[],"t":"F","x":520,"y":184,"anc":"middle"},{"f":"ar","id":"ld","x0":464,"y0":250,"x1":464,"y1":570,"two":1,"w":2,"mv":[["md",220,0]],"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[446,470,"end",[-1,0]]],"mv":[["md",220,0]],"need":"l","vis":[],"t":"F","x":446,"y":470,"anc":"end"},{"f":"ar","id":"va","x0":534,"y0":540,"x1":664,"y1":540,"w":5,"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x0":534,"y0":540,"x1":664,"y1":540},"left":{"x0":534,"y0":540,"x1":404,"y1":540}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"vbases":{"right":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"left":[[469,510,"middle",[0,-1]],[469,570,"middle",[0,1]],[386,540,"end",[-1,0]]]},"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x":599,"y":504,"anc":"middle"},"left":{"x":485,"y":504,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":599,"y":510,"anc":"middle"},{"f":"ln","id":"dxe1","pts":[[520,582],[520,654]],"w":2,"need":"dx","vis":[],"t":"F"},{"f":"ln","id":"dxe2","pts":[[740,582],[740,654]],"w":2,"need":"dx","vis":[],"t":"F"},{"f":"ar","id":"dxd","x0":520,"y0":640,"x1":740,"y1":640,"two":1,"w":2,"need":"dx","vis":[],"t":"F"},{"f":"lb","id":"dxt","k":"dx","bases":[[630,680,"middle",[0,1]],[630,600,"middle",[0,-1]]],"need":"dx","vis":[],"t":"F","x":630,"y":680,"anc":"middle"},{"f":"ar","id":"ea","x0":550,"y0":470,"x1":550,"y1":270,"w":3,"mv":[["md",220,0]],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[566,350,"start",[1,0]]],"mv":[["md",220,0]],"need":"e","vis":[],"t":"F","x":566,"y":350,"anc":"start"},{"f":"ar","id":"irh0","x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19},"cw":{"x0":340.5,"y0":251.19,"x1":379.5,"y1":251.19}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"irh1","x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5},"cw":{"x0":201.19,"y0":429.5,"x1":201.19,"y1":390.5}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"irh2","x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81},"cw":{"x0":379.5,"y0":568.81,"x1":340.5,"y1":568.81}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"c","id":"iprc","cx":360,"cy":410,"r":44,"fill":"w","o":["iprd"],"need":"ipr","vis":[],"t":"F","sel":["ipra"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"mga","pts":[[140,380],[250,380],[250,460],[140,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"s","col":"#1971c2"},"S":{"fill":"n","col":"#c92a2a"}},"dflt":"N","vis":[1],"t":"F"},{"f":"tx","id":"mgat","x":195,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"S"},"S":{"s":"N"}},"dflt":"N","vis":[1],"t":"F"},{"f":"ln","id":"mgb","pts":[[250,380],[360,380],[360,460],[250,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[1],"t":"F"},{"f":"tx","id":"mgbt","x":305,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[1],"t":"F"},{"f":"lb","id":"mgt","k":"mg","bases":[[250,496,"middle",[0,1]]],"mv":[["pos",160,0]],"need":"mg","vis":[1],"t":"F","x":250,"y":496,"anc":"middle"},{"f":"ar","id":"goa","x0":200,"y0":310,"x1":320,"y1":310,"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x0":190,"y0":330,"x1":320,"y1":330},"left":{"x0":320,"y0":330,"x1":190,"y1":330},"in":{"x0":190,"y0":330,"x1":320,"y1":330},"out":{"x0":320,"y0":330,"x1":190,"y1":330}},"dflt":"right","vis":[1],"t":"F"},{"f":"lb","id":"got","k":"go","bases":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"vbases":{"right":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"left":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]],"in":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"out":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]]},"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x":260,"y":274,"anc":"middle"},"left":{"x":140,"y":280,"anc":"middle"},"in":{"x":260,"y":274,"anc":"middle"},"out":{"x":140,"y":280,"anc":"middle"}},"dflt":"right","vis":[1],"t":"F","x":260,"y":280,"anc":"middle"},{"f":"ln","id":"phf0","pts":[[362,400],[620,220],[860,160]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[1],"t":"F"},{"f":"ln","id":"phn0","pts":[[522,400],[700,340],[900,310]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[1],"t":"F"},{"f":"ln","id":"phf1","pts":[[362,420],[620,420],[860,420]],"w":3,"no":["pos"],"need":"ph","col":"#868e96","vis":[1],"t":"F"},{"f":"ln","id":"phn1","pts":[[522,420],[700,420],[900,420]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[1],"t":"F"},{"f":"ln","id":"phf2","pts":[[362,440],[620,620],[860,680]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[1],"t":"F"},{"f":"ln","id":"phn2","pts":[[522,440],[700,500],[900,530]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[1],"t":"F"},{"f":"lb","id":"pht","k":"ph","bases":[[870,300,"start",[1,-1]]],"need":"ph","vis":[1],"t":"F","x":851.62,"y":281.62,"anc":"start"},{"f":"ln","id":"clb","pts":[[700,550],[695.19,549.29],[690.44,547.16],[685.79,543.64],[681.29,538.76],[677,532.58],[672.96,525.17],[669.22,516.61],[665.82,506.99],[662.79,496.41],[660.16,485],[657.98,472.88],[656.25,460.17],[655.01,447.03],[654.25,433.59],[654,420],[654.25,406.41],[655.01,392.97],[656.25,379.83],[657.98,367.12],[660.16,355],[662.79,343.59],[665.82,333.01],[669.22,323.39],[672.96,314.83],[677,307.42],[681.29,301.24],[685.79,296.36],[690.44,292.84],[695.19,290.71],[700,290]],"dash":1,"w":4,"vis":[1],"t":"F"},{"f":"ln","id":"clf","pts":[[700,290],[704.81,290.71],[709.56,292.84],[714.21,296.36],[718.71,301.24],[723,307.42],[727.04,314.83],[730.78,323.39],[734.18,333.01],[737.21,343.59],[739.84,355],[742.02,367.12],[743.75,379.83],[744.99,392.97],[745.75,406.41],[746,420],[745.75,433.59],[744.99,447.03],[743.75,460.17],[742.02,472.88],[739.84,485],[737.21,496.41],[734.18,506.99],[730.78,516.61],[727.04,525.17],[723,532.58],[718.71,538.76],[714.21,543.64],[709.56,547.16],[704.81,549.29],[700,550]],"w":4,"vis":[1],"t":"F"},{"f":"ln","id":"cl0","pts":[[694,550],[694,640]],"w":3,"vis":[1],"t":"F"},{"f":"ln","id":"cl1","pts":[[722,544],[722,640]],"w":3,"vis":[1],"t":"F"},{"f":"lb","id":"clt","k":"cl","bases":[[760,290,"start",[1,-1]]],"need":"cl","vis":[1],"t":"F","x":760,"y":290,"anc":"start"},{"f":"ar","id":"ipa","x0":630,"y0":420,"x1":770,"y1":420,"w":12,"o":["ipd"],"need":"ip","sel":"ipa","var":{"left":{"x0":770,"y0":420,"x1":630,"y1":420},"right":{"x0":630,"y0":420,"x1":770,"y1":420}},"dflt":"right","col":"#adb5bd","vis":[1],"t":"F"},{"f":"lb","id":"ipt","k":"ip","bases":[[700,380,"middle",[0,-1]]],"o":["ipd"],"need":"ip","vis":[1],"t":"F","x":700,"y":380,"anc":"middle"},{"f":"ar","id":"ih0","x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76},"cw":{"x0":736.74,"y0":341.76,"x1":742.34,"y1":369.2}},"dflt":"ccw","col":"#1971c2","vis":[1],"t":"F"},{"f":"ar","id":"ih1","x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8},"cw":{"x0":742.34,"y0":470.8,"x1":736.74,"y1":498.24}},"dflt":"ccw","col":"#1971c2","vis":[1],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[776,480,"start",[1,1]]],"o":["id"],"need":"i","vis":[1],"t":"F","x":776,"y":480,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[640,610,"end",[-1,1]]],"need":"n","vis":[1],"t":"F","x":640,"y":610,"anc":"end"},{"f":"ar","id":"ea","x0":790,"y0":630,"x1":790,"y1":560,"w":3,"need":"e","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[810,596,"start",[1,0]]],"need":"e","vis":[1],"t":"F","x":810,"y":596,"anc":"start"},{"f":"ln","id":"rlx1","pts":[[980,250],[200,250],[200,570],[980,570]],"w":4,"vis":[2],"t":"F"},{"f":"ln","id":"dsfx1","pts":[[520,254],[740,254],[740,566],[520,566]],"w":1,"fill":"area","close":1,"o":["dsd"],"need":"ds","vis":[2],"t":"F"},{"f":"tx","id":"bs0x1","x":270,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[2],"t":"F"},{"f":"tx","id":"bs1x1","x":270,"y":410,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[2],"t":"F"},{"f":"tx","id":"bs2x1","x":370,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[2],"t":"F"},{"f":"lb","id":"btx1","k":"b","bases":[[210,210,"start",[0,-1]]],"need":"b","vis":[2],"t":"F","x":210,"y":210,"anc":"start","n":"bx1"},{"f":"ln","id":"rodx1","pts":[[520,220],[520,600]],"w":10,"mv":[["md",220,0]],"col":"#495057","vis":[2],"t":"F"},{"f":"lb","id":"rodtx1","k":"rod","bases":[[520,190,"middle",[0,-1]]],"mv":[["md",220,0]],"need":"rod","vis":[2],"t":"F","x":520,"y":184,"anc":"middle","n":"rodx1"},{"f":"ar","id":"ldx1","x0":464,"y0":250,"x1":464,"y1":570,"two":1,"w":2,"mv":[["md",220,0]],"need":"l","vis":[2],"t":"F"},{"f":"lb","id":"ltx1","k":"l","bases":[[446,470,"end",[-1,0]]],"mv":[["md",220,0]],"need":"l","vis":[2],"t":"F","x":446,"y":470,"anc":"end","n":"lx1"},{"f":"ar","id":"vax1","x0":534,"y0":540,"x1":664,"y1":540,"w":5,"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x0":534,"y0":540,"x1":664,"y1":540},"left":{"x0":534,"y0":540,"x1":404,"y1":540}},"dflt":"right","vis":[2],"t":"F"},{"f":"lb","id":"vtx1","k":"v","bases":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"vbases":{"right":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"left":[[469,510,"middle",[0,-1]],[469,570,"middle",[0,1]],[386,540,"end",[-1,0]]]},"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x":599,"y":504,"anc":"middle"},"left":{"x":495,"y":504,"anc":"middle"}},"dflt":"right","vis":[2],"t":"F","x":599,"y":510,"anc":"middle","n":"vx1"},{"f":"ln","id":"dxe1x1","pts":[[520,582],[520,654]],"w":2,"need":"dx","vis":[2],"t":"F"},{"f":"ln","id":"dxe2x1","pts":[[740,582],[740,654]],"w":2,"need":"dx","vis":[2],"t":"F"},{"f":"ar","id":"dxdx1","x0":520,"y0":640,"x1":740,"y1":640,"two":1,"w":2,"need":"dx","vis":[2],"t":"F"},{"f":"lb","id":"dxtx1","k":"dx","bases":[[630,680,"middle",[0,1]],[630,600,"middle",[0,-1]]],"need":"dx","vis":[2],"t":"F","x":630,"y":680,"anc":"middle","n":"dxx1"},{"f":"ar","id":"eax1","x0":550,"y0":470,"x1":550,"y1":270,"w":3,"mv":[["md",220,0]],"need":"e","vis":[2],"t":"F"},{"f":"lb","id":"etx1","k":"e","bases":[[566,350,"start",[1,0]]],"mv":[["md",220,0]],"need":"e","vis":[2],"t":"F","x":566,"y":350,"anc":"start","n":"ex1"},{"f":"ar","id":"irh0x1","x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19},"cw":{"x0":340.5,"y0":251.19,"x1":379.5,"y1":251.19}},"dflt":"ccw","col":"#1971c2","vis":[2],"t":"F"},{"f":"ar","id":"irh1x1","x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5},"cw":{"x0":201.19,"y0":429.5,"x1":201.19,"y1":390.5}},"dflt":"ccw","col":"#1971c2","vis":[2],"t":"F"},{"f":"ar","id":"irh2x1","x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81},"cw":{"x0":379.5,"y0":568.81,"x1":340.5,"y1":568.81}},"dflt":"ccw","col":"#1971c2","vis":[2],"t":"F"},{"f":"c","id":"iprcx1","cx":360,"cy":410,"r":44,"fill":"w","o":["iprd"],"need":"ipr","vis":[2],"t":"F","sel":["ipra"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU22s2cm(d, p, L){ tbFig_Draw(d, p, L, U22S2K.cm); }
function tbU22s2rl(d, p, L){ tbFig_Draw(d, p, L, U22S2K.rl); }
function tbU22s2sw(d, p, L){ tbFig_Draw(d, p, L, U22S2K.sw); }
// ---- 22-3 ファラデーの法則 の図（※ textbook/gen/make_section.py が textbook/gen/data/u22_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U22S3K = {
  cm: {"vars":[],"items":[{"f":"ln","id":"mga","pts":[[140,380],[250,380],[250,460],[140,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"s","col":"#1971c2"},"S":{"fill":"n","col":"#c92a2a"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgat","x":195,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"S"},"S":{"s":"N"}},"dflt":"N","vis":[],"t":"F"},{"f":"ln","id":"mgb","pts":[[250,380],[360,380],[360,460],[250,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgbt","x":305,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"mgt","k":"mg","bases":[[250,496,"middle",[0,1]]],"mv":[["pos",160,0]],"need":"mg","vis":[],"t":"F","x":250,"y":496,"anc":"middle"},{"f":"ar","id":"goa","x0":200,"y0":310,"x1":320,"y1":310,"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x0":190,"y0":330,"x1":320,"y1":330},"left":{"x0":320,"y0":330,"x1":190,"y1":330},"in":{"x0":190,"y0":330,"x1":320,"y1":330},"out":{"x0":320,"y0":330,"x1":190,"y1":330}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"got","k":"go","bases":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"vbases":{"right":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"left":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]],"in":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"out":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]]},"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x":260,"y":280,"anc":"middle"},"left":{"x":140,"y":280,"anc":"middle"},"in":{"x":260,"y":280,"anc":"middle"},"out":{"x":140,"y":280,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":260,"y":280,"anc":"middle"},{"f":"ln","id":"phf0","pts":[[362,400],[620,220],[860,160]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn0","pts":[[522,400],[700,340],[900,310]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf1","pts":[[362,420],[620,420],[860,420]],"w":3,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn1","pts":[[522,420],[700,420],[900,420]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf2","pts":[[362,440],[620,620],[860,680]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn2","pts":[[522,440],[700,500],[900,530]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"pht","k":"ph","bases":[[870,300,"start",[1,-1]]],"need":"ph","vis":[],"t":"F","x":851.62,"y":281.62,"anc":"start"},{"f":"ln","id":"clb","pts":[[700,550],[695.19,549.29],[690.44,547.16],[685.79,543.64],[681.29,538.76],[677,532.58],[672.96,525.17],[669.22,516.61],[665.82,506.99],[662.79,496.41],[660.16,485],[657.98,472.88],[656.25,460.17],[655.01,447.03],[654.25,433.59],[654,420],[654.25,406.41],[655.01,392.97],[656.25,379.83],[657.98,367.12],[660.16,355],[662.79,343.59],[665.82,333.01],[669.22,323.39],[672.96,314.83],[677,307.42],[681.29,301.24],[685.79,296.36],[690.44,292.84],[695.19,290.71],[700,290]],"dash":1,"w":4,"vis":[],"t":"F"},{"f":"ln","id":"clf","pts":[[700,290],[704.81,290.71],[709.56,292.84],[714.21,296.36],[718.71,301.24],[723,307.42],[727.04,314.83],[730.78,323.39],[734.18,333.01],[737.21,343.59],[739.84,355],[742.02,367.12],[743.75,379.83],[744.99,392.97],[745.75,406.41],[746,420],[745.75,433.59],[744.99,447.03],[743.75,460.17],[742.02,472.88],[739.84,485],[737.21,496.41],[734.18,506.99],[730.78,516.61],[727.04,525.17],[723,532.58],[718.71,538.76],[714.21,543.64],[709.56,547.16],[704.81,549.29],[700,550]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"cl0","pts":[[694,550],[694,640]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"cl1","pts":[[722,544],[722,640]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"clt","k":"cl","bases":[[760,290,"start",[1,-1]]],"need":"cl","vis":[],"t":"F","x":760,"y":290,"anc":"start"},{"f":"ar","id":"ipa","x0":630,"y0":420,"x1":770,"y1":420,"w":12,"o":["ipd"],"need":"ip","sel":"ipa","var":{"left":{"x0":770,"y0":420,"x1":630,"y1":420},"right":{"x0":630,"y0":420,"x1":770,"y1":420}},"dflt":"right","col":"#adb5bd","vis":[],"t":"F"},{"f":"lb","id":"ipt","k":"ip","bases":[[700,380,"middle",[0,-1]]],"o":["ipd"],"need":"ip","vis":[],"t":"F","x":700,"y":380,"anc":"middle"},{"f":"ar","id":"ih0","x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76},"cw":{"x0":736.74,"y0":341.76,"x1":742.34,"y1":369.2}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"ih1","x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8},"cw":{"x0":742.34,"y0":470.8,"x1":736.74,"y1":498.24}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[776,480,"start",[1,1]]],"o":["id"],"need":"i","vis":[],"t":"F","x":776,"y":480,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[640,610,"end",[-1,1]]],"need":"n","vis":[],"t":"F","x":597.57,"y":652.43,"anc":"end"},{"f":"ar","id":"ea","x0":790,"y0":630,"x1":790,"y1":560,"w":3,"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[810,596,"start",[1,0]]],"need":"e","vis":[],"t":"F","x":810,"y":596,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU22s3cm(d, p, L){ tbFig_Draw(d, p, L, U22S3K.cm); }
// ---- 22-4 磁束のグラフと起電力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u22_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U22S4K = {
  fg: {"vars":[],"items":[{"f":"ar","id":"axu","x0":220,"y0":380,"x1":830,"y1":380,"vis":[],"t":"F"},{"f":"ar","id":"ayu","x0":220,"y0":380,"x1":220,"y1":100,"vis":[],"t":"F"},{"f":"tx","id":"alu","x":220,"y":66,"s":"{Φ}［Wb］","anc":"middle","vis":[],"t":"F"},{"f":"tx","id":"atu","x":840,"y":420,"s":"{t}［s］","anc":"end","vis":[],"t":"F"},{"f":"tx","id":"ou","x":206,"y":406,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"ar","id":"axd","x0":220,"y0":760,"x1":830,"y1":760,"vis":[],"t":"F"},{"f":"ar","id":"ayd","x0":220,"y0":760,"x1":220,"y1":480,"vis":[],"t":"F"},{"f":"tx","id":"ald","x":220,"y":446,"s":"{e}［V］","anc":"middle","vis":[],"t":"F"},{"f":"tx","id":"atd","x":840,"y":800,"s":"{t}［s］","anc":"end","vis":[],"t":"F"},{"f":"tx","id":"od","x":206,"y":786,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"ln","id":"g1","pts":[[220,380],[421.6,196]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"g2","pts":[[421.6,196],[656.8,196]],"w":5,"sel":"sh","var":{"rise_flat":{"pts":[[421.6,196],[656.8,196]]},"rise_fall":{"pts":[[421.6,196],[656.8,380]]}},"dflt":"rise_flat","vis":[],"t":"F"},{"f":"ln","id":"t1g","pts":[[421.6,380],[421.6,196]],"dash":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1g2","pts":[[421.6,760],[421.6,530]],"dash":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[421.6,410,"middle",[0,1]]],"need":"t1","vis":[],"t":"F","x":421.6,"y":416,"anc":"middle"},{"f":"ln","id":"t2g","pts":[[656.8,380],[656.8,196]],"dash":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2g2","pts":[[656.8,760],[656.8,530]],"dash":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[656.8,410,"middle",[0,1]]],"need":"t2","vis":[],"t":"F","x":656.8,"y":416,"anc":"middle"},{"f":"ln","id":"p1g","pts":[[220,196],[421.6,196]],"dash":1,"w":2,"need":"p1","vis":[],"t":"F"},{"f":"lb","id":"p1t","k":"p1","bases":[[206,196,"end",[-1,0]]],"need":"p1","vis":[],"t":"F","x":206,"y":196,"anc":"end"},{"f":"ln","id":"tri1","pts":[[240,372],[401.6,372],[401.6,226]],"dash":1,"w":2,"o":["tri1d"],"vis":[],"t":"F"},{"f":"ln","id":"tri2","pts":[[441.6,216],[441.6,372],[626.8,372]],"dash":1,"w":2,"o":["tri2d"],"sel":"sh","var":{"rise_flat":{"pts":[[421.6,196],[421.6,196]]},"rise_fall":{"pts":[[441.6,216],[441.6,372],[626.8,372]]}},"dflt":"rise_fall","vis":[],"t":"F"},{"f":"ln","id":"e1l","pts":[[220,599],[421.6,599]],"w":6,"o":["e1d"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[320.8,567,"middle",[0,-1]]],"o":["e1d"],"need":"e1","vis":[],"t":"F","x":320.8,"y":561,"anc":"middle"},{"f":"ln","id":"e2l","pts":[[421.6,599],[656.8,599]],"w":6,"o":["e2d"],"need":"e2","sel":"sh","var":{"rise_flat":{"pts":[[421.6,756],[656.8,756]]},"rise_fall":{"pts":[[421.6,599],[656.8,599]]}},"dflt":"rise_fall","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[539.2,567,"middle",[0,-1]]],"vbases":{"rise_flat":[[539.2,724,"middle",[0,-1]]],"rise_fall":[[539.2,567,"middle",[0,-1]]]},"o":["e2d"],"need":"e2","sel":"sh","var":{"rise_flat":{"x":539.2,"y":718,"anc":"middle"},"rise_fall":{"x":539.2,"y":561,"anc":"middle"}},"dflt":"rise_fall","vis":[],"t":"F","x":539.2,"y":567,"anc":"middle"},{"f":"lb","id":"nt","k":"n","bases":[[780,110,"end",[1,-1]]],"need":"n","vis":[],"t":"F","x":780,"y":110,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU22s4fg(d, p, L){ tbFig_Draw(d, p, L, U22S4K.fg); }
// ---- 22-5 導体棒 の図（※ textbook/gen/make_section.py が textbook/gen/data/u22_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U22S5K = {
  rl: {"vars":[],"items":[{"f":"ln","id":"rl","pts":[[980,250],[200,250],[200,570],[980,570]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"dsf","pts":[[520,254],[740,254],[740,566],[520,566]],"w":1,"fill":"area","close":1,"o":["dsd"],"need":"ds","vis":[],"t":"F"},{"f":"tx","id":"bs0","x":270,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[],"t":"F"},{"f":"tx","id":"bs1","x":270,"y":410,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[],"t":"F"},{"f":"tx","id":"bs2","x":370,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[210,210,"start",[0,-1]]],"need":"b","vis":[],"t":"F","x":210,"y":210,"anc":"start"},{"f":"ln","id":"rod","pts":[[520,220],[520,600]],"w":10,"mv":[["md",220,0]],"col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"rodt","k":"rod","bases":[[520,190,"middle",[0,-1]]],"mv":[["md",220,0]],"need":"rod","vis":[],"t":"F","x":536,"y":190,"anc":"middle"},{"f":"ar","id":"ld","x0":464,"y0":250,"x1":464,"y1":570,"two":1,"w":2,"mv":[["md",220,0]],"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[446,470,"end",[-1,0]]],"mv":[["md",220,0]],"need":"l","vis":[],"t":"F","x":446,"y":496,"anc":"end"},{"f":"ar","id":"va","x0":534,"y0":540,"x1":664,"y1":540,"w":5,"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x0":534,"y0":540,"x1":664,"y1":540},"left":{"x0":534,"y0":540,"x1":404,"y1":540}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"vbases":{"right":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"left":[[469,510,"middle",[0,-1]],[469,570,"middle",[0,1]],[386,540,"end",[-1,0]]]},"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x":599,"y":690,"anc":"middle"},"left":{"x":386,"y":616,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":599,"y":510,"anc":"middle"},{"f":"ln","id":"dxe1","pts":[[520,582],[520,654]],"w":2,"need":"dx","vis":[],"t":"F"},{"f":"ln","id":"dxe2","pts":[[740,582],[740,654]],"w":2,"need":"dx","vis":[],"t":"F"},{"f":"ar","id":"dxd","x0":520,"y0":640,"x1":740,"y1":640,"two":1,"w":2,"need":"dx","vis":[],"t":"F"},{"f":"lb","id":"dxt","k":"dx","bases":[[630,680,"middle",[0,1]],[630,600,"middle",[0,-1]]],"need":"dx","vis":[],"t":"F","x":630,"y":746,"anc":"middle"},{"f":"ar","id":"ea","x0":550,"y0":470,"x1":550,"y1":270,"w":3,"mv":[["md",220,0]],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[566,350,"start",[1,0]]],"mv":[["md",220,0]],"need":"e","vis":[],"t":"F","x":790,"y":350,"anc":"start"},{"f":"ar","id":"irh0","x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19},"cw":{"x0":340.5,"y0":251.19,"x1":379.5,"y1":251.19}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"irh1","x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5},"cw":{"x0":201.19,"y0":429.5,"x1":201.19,"y1":390.5}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"irh2","x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81},"cw":{"x0":379.5,"y0":568.81,"x1":340.5,"y1":568.81}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"c","id":"iprc","cx":360,"cy":410,"r":44,"fill":"w","o":["iprd"],"need":"ipr","vis":[],"t":"F","sel":["ipra"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  fm: {"vars":[],"items":[{"f":"c","id":"o","cx":480,"cy":430,"r":7,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"handt","k":"hand","bases":[[140,160,"start",[-1,-1]]],"need":"hand","vis":[],"t":"F","x":140,"y":160,"anc":"start"},{"f":"ar","id":"fa1","x0":490,"y0":430,"x1":720,"y1":430,"w":5,"need":"f1","sel":"f1a","var":{"right":{"x0":490,"y0":430,"x1":720,"y1":430}},"dflt":"right","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"vbases":{"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]]},"need":"f1","sel":"f1a","var":{"right":{"x":750,"y":430,"anc":"start"}},"dflt":"right","vis":[],"t":"F","x":750,"y":430,"anc":"start"},{"f":"lb","id":"fn1t","k":"fn1","bases":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"vbases":{"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]]},"need":"fn1","sel":"f1a","var":{"right":{"x":750,"y":470,"anc":"start"}},"dflt":"right","vis":[],"t":"F","x":750,"y":470,"anc":"start"},{"f":"ar","id":"fa2","x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2,"w":5,"need":"f2","sel":"f2a","var":{"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"back","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]],"vbases":{"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f2","sel":"f2a","var":{"back":{"x":636.2,"y":292.71,"anc":"start"}},"dflt":"back","vis":[],"t":"F","x":616.4,"y":289.88,"anc":"start"},{"f":"lb","id":"fn2t","k":"fn2","bases":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]],"vbases":{"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn2","sel":"f2a","var":{"back":{"x":619.56,"y":334.98,"anc":"start"}},"dflt":"back","vis":[],"t":"F","x":616.4,"y":329.88,"anc":"start"},{"f":"c","id":"fs2back","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f2","sel":"f2a","var":{"back":{}},"vis":[],"t":"F"},{"f":"ar","id":"fa3","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f3","sel":"f3a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210}},"dflt":"up","gr":"f3d","vis":[],"t":"F"},{"f":"lb","id":"f3t","k":"f3","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]]},"need":"f3","sel":"f3a","var":{"up":{"x":504,"y":186,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":480,"y":174,"anc":"middle"},{"f":"lb","id":"fn3t","k":"fn3","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]]},"need":"fn3","sel":"f3a","var":{"up":{"x":480,"y":134,"anc":"middle"}},"dflt":"up","vis":[],"t":"F","x":480,"y":214,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  rc: {"vars":[],"items":[{"f":"ln","id":"bl0","pts":[[120,230],[860,230]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"blh0","x0":207.6,"y0":230,"x1":237.6,"y1":230,"sel":"ba","var":{"right":{"x0":207.6,"y0":230,"x1":237.6,"y1":230},"left":{"x0":239.6,"y0":230,"x1":209.6,"y1":230}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"bl1","pts":[[120,430],[860,430]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"blh1","x0":207.6,"y0":430,"x1":237.6,"y1":430,"sel":"ba","var":{"right":{"x0":207.6,"y0":430,"x1":237.6,"y1":430},"left":{"x0":239.6,"y0":430,"x1":209.6,"y1":430}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"bl2","pts":[[120,630],[860,630]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"blh2","x0":207.6,"y0":630,"x1":237.6,"y1":630,"sel":"ba","var":{"right":{"x0":207.6,"y0":630,"x1":237.6,"y1":630},"left":{"x0":239.6,"y0":630,"x1":209.6,"y1":630}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[850,200,"end",[0,-1]],[870,230,"start",[1,0]]],"need":"b","vis":[],"t":"F","x":850,"y":200,"anc":"end"},{"f":"c","id":"cc","cx":480,"cy":430,"r":30,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[440,474,"end",[-1,1]]],"need":"c","vis":[],"t":"F","x":440,"y":474,"anc":"end"},{"f":"ar","id":"va","x0":480,"y0":396,"x1":480,"y1":220,"w":5,"need":"v","sel":"vang","var":{"90":{"x0":480,"y0":396,"x1":480,"y1":220},"-90":{"x0":480,"y0":464,"x1":480,"y1":640},"30":{"x0":509.44,"y0":413,"x1":661.87,"y1":325},"0":{"x0":514,"y0":430,"x1":690,"y1":430},"60":{"x0":497,"y0":400.56,"x1":585,"y1":248.13}},"dflt":"90","gr":"vd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[500,200,"start",[1,-1]],[504,230,"start",[1,0]]],"vbases":{"90":[[500,200,"start",[1,-1]],[504,230,"start",[1,0]]],"-90":[[500,620,"start",[1,-1]],[504,650,"start",[1,0]]],"30":[[681.87,305,"start",[1,-1]],[685.87,335,"start",[1,0]]],"0":[[710,410,"start",[1,-1]],[714,440,"start",[1,0]]],"60":[[605,228.13,"start",[1,-1]],[609,258.13,"start",[1,0]]]},"need":"v","sel":"vang","var":{"90":{"x":500,"y":200,"anc":"start"},"-90":{"x":497.17,"y":600.2,"anc":"start"},"30":{"x":681.87,"y":305,"anc":"start"},"0":{"x":698.69,"y":398.69,"anc":"start"},"60":{"x":609,"y":258.13,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":500,"y":200,"anc":"start"},{"f":"ln","id":"tha","pts":[[570,430],[569.91,426.07],[569.66,422.16],[569.23,418.25],[568.63,414.37],[567.87,410.52],[566.93,406.71],[565.83,402.94],[564.57,399.22],[563.15,395.56],[561.57,391.96],[559.83,388.44],[557.94,385]],"w":3,"need":"th","sel":"vang","var":{"90":{"pts":[[570,430],[569.23,418.25],[566.93,406.71],[563.15,395.56],[557.94,385],[551.4,375.21],[543.64,366.36],[534.79,358.6],[525,352.06],[514.44,346.85],[503.29,343.07],[491.75,340.77],[480,340]]},"-90":{"pts":[[570,430],[569.23,441.75],[566.93,453.29],[563.15,464.44],[557.94,475],[551.4,484.79],[543.64,493.64],[534.79,501.4],[525,507.94],[514.44,513.15],[503.29,516.93],[491.75,519.23],[480,520]]},"30":{"pts":[[570,430],[569.91,426.07],[569.66,422.16],[569.23,418.25],[568.63,414.37],[567.87,410.52],[566.93,406.71],[565.83,402.94],[564.57,399.22],[563.15,395.56],[561.57,391.96],[559.83,388.44],[557.94,385]]},"0":{"pts":[[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430]]},"60":{"pts":[[570,430],[569.66,422.16],[568.63,414.37],[566.93,406.71],[564.57,399.22],[561.57,391.96],[557.94,385],[553.72,378.38],[548.94,372.15],[543.64,366.36],[537.85,361.06],[531.62,356.28],[525,352.06]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"tht","k":"th","bases":[[590,404,"start",[1,-0.3]]],"need":"th","vis":[],"t":"F","x":590,"y":404,"anc":"start"},{"f":"ln","id":"vln","pts":[[480,170],[480,550]],"dash":1,"w":2,"o":["thpd"],"need":"thp","vis":[],"t":"F"},{"f":"ln","id":"thpa","pts":[[480,310],[490.46,310.46],[500.84,311.82],[511.06,314.09],[521.04,317.24],[530.71,321.24],[540,326.08],[548.83,331.7],[557.13,338.07],[564.85,345.15],[571.93,352.87],[578.3,361.17],[583.92,370]],"w":3,"o":["thpd"],"need":"thp","sel":"vang","var":{"90":{"pts":[[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310]]},"-90":{"pts":[[480,310],[511.06,314.09],[540,326.08],[564.85,345.15],[583.92,370],[595.91,398.94],[600,430],[595.91,461.06],[583.92,490],[564.85,514.85],[540,533.92],[511.06,545.91],[480,550]]},"30":{"pts":[[480,310],[490.46,310.46],[500.84,311.82],[511.06,314.09],[521.04,317.24],[530.71,321.24],[540,326.08],[548.83,331.7],[557.13,338.07],[564.85,345.15],[571.93,352.87],[578.3,361.17],[583.92,370]]},"0":{"pts":[[480,310],[495.66,311.03],[511.06,314.09],[525.92,319.13],[540,326.08],[553.05,334.8],[564.85,345.15],[575.2,356.95],[583.92,370],[590.87,384.08],[595.91,398.94],[598.97,414.34],[600,430]]},"60":{"pts":[[480,310],[485.23,310.11],[490.46,310.46],[495.66,311.03],[500.84,311.82],[505.97,312.84],[511.06,314.09],[516.08,315.55],[521.04,317.24],[525.92,319.13],[530.71,321.24],[535.41,323.56],[540,326.08]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"thpt","k":"thp","bases":[[520,280,"start",[1,-1]]],"o":["thpd"],"need":"thp","vis":[],"t":"F","x":520,"y":280,"anc":"start"},{"f":"ar","id":"vsa","x0":480,"y0":396,"x1":480,"y1":325,"w":3,"o":["vsd"],"need":"vs","sel":"vang","var":{"90":{"x0":480,"y0":396,"x1":480,"y1":220},"-90":{"x0":480,"y0":396,"x1":480,"y1":640},"30":{"x0":480,"y0":396,"x1":480,"y1":325},"0":{"x0":480,"y0":396,"x1":480,"y1":430},"60":{"x0":480,"y0":396,"x1":480,"y1":248.13}},"dflt":"30","vis":[],"t":"F","dash":1},{"f":"lb","id":"vst","k":"vs","bases":[[460,340,"end",[-1,0]]],"o":["vsd"],"need":"vs","vis":[],"t":"F","x":460,"y":340,"anc":"end"},{"f":"ar","id":"vpa","x0":514,"y0":430,"x1":660,"y1":430,"w":3,"o":["vpd"],"need":"vp","sel":"vang","var":{"90":{"x0":514,"y0":430,"x1":480,"y1":430},"-90":{"x0":514,"y0":430,"x1":480,"y1":430},"30":{"x0":514,"y0":430,"x1":661.87,"y1":430},"0":{"x0":514,"y0":430,"x1":690,"y1":430},"60":{"x0":514,"y0":430,"x1":585,"y1":430}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"vpt","k":"vp","bases":[[600,470,"middle",[0,1]]],"o":["vpd"],"need":"vp","vis":[],"t":"F","x":600,"y":470,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"rl","pts":[[980,250],[200,250],[200,570],[980,570]],"w":4,"vis":[1],"t":"F"},{"f":"ln","id":"dsf","pts":[[520,254],[740,254],[740,566],[520,566]],"w":1,"fill":"area","close":1,"o":["dsd"],"need":"ds","vis":[1],"t":"F"},{"f":"tx","id":"bs0","x":270,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[1],"t":"F"},{"f":"tx","id":"bs1","x":270,"y":410,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[1],"t":"F"},{"f":"tx","id":"bs2","x":370,"y":330,"s":"×","anc":"middle","size":30,"sel":"bs","var":{"back":{"s":"×"},"front":{"s":"•"}},"dflt":"back","vis":[1],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[210,210,"start",[0,-1]]],"need":"b","vis":[1],"t":"F","x":210,"y":210,"anc":"start"},{"f":"ln","id":"rod","pts":[[520,220],[520,600]],"w":10,"mv":[["md",220,0]],"col":"#495057","vis":[1],"t":"F"},{"f":"lb","id":"rodt","k":"rod","bases":[[520,190,"middle",[0,-1]]],"mv":[["md",220,0]],"need":"rod","vis":[1],"t":"F","x":536,"y":190,"anc":"middle"},{"f":"ar","id":"ld","x0":464,"y0":250,"x1":464,"y1":570,"two":1,"w":2,"mv":[["md",220,0]],"need":"l","vis":[1],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[446,470,"end",[-1,0]]],"mv":[["md",220,0]],"need":"l","vis":[1],"t":"F","x":446,"y":496,"anc":"end"},{"f":"ar","id":"va","x0":534,"y0":540,"x1":664,"y1":540,"w":5,"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x0":534,"y0":540,"x1":664,"y1":540},"left":{"x0":534,"y0":540,"x1":404,"y1":540}},"dflt":"right","vis":[1],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"vbases":{"right":[[599,510,"middle",[0,-1]],[599,570,"middle",[0,1]],[682,540,"start",[1,0]]],"left":[[469,510,"middle",[0,-1]],[469,570,"middle",[0,1]],[386,540,"end",[-1,0]]]},"mv":[["md",220,0]],"need":"v","sel":"va","var":{"right":{"x":599,"y":690,"anc":"middle"},"left":{"x":386,"y":616,"anc":"end"}},"dflt":"right","vis":[1],"t":"F","x":599,"y":510,"anc":"middle"},{"f":"ln","id":"dxe1","pts":[[520,582],[520,654]],"w":2,"need":"dx","vis":[1],"t":"F"},{"f":"ln","id":"dxe2","pts":[[740,582],[740,654]],"w":2,"need":"dx","vis":[1],"t":"F"},{"f":"ar","id":"dxd","x0":520,"y0":640,"x1":740,"y1":640,"two":1,"w":2,"need":"dx","vis":[1],"t":"F"},{"f":"lb","id":"dxt","k":"dx","bases":[[630,680,"middle",[0,1]],[630,600,"middle",[0,-1]]],"need":"dx","vis":[1],"t":"F","x":630,"y":746,"anc":"middle"},{"f":"ar","id":"ea","x0":550,"y0":470,"x1":550,"y1":270,"w":3,"mv":[["md",220,0]],"need":"e","vis":[1],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[566,350,"start",[1,0]]],"mv":[["md",220,0]],"need":"e","vis":[1],"t":"F","x":790,"y":350,"anc":"start"},{"f":"ar","id":"irh0","x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":379.5,"y0":251.19,"x1":340.5,"y1":251.19},"cw":{"x0":340.5,"y0":251.19,"x1":379.5,"y1":251.19}},"dflt":"ccw","col":"#1971c2","vis":[1],"t":"F"},{"f":"ar","id":"irh1","x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":201.19,"y0":390.5,"x1":201.19,"y1":429.5},"cw":{"x0":201.19,"y0":429.5,"x1":201.19,"y1":390.5}},"dflt":"ccw","col":"#1971c2","vis":[1],"t":"F"},{"f":"ar","id":"irh2","x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81,"o":["ird"],"need":"ir","sel":"ira","var":{"ccw":{"x0":340.5,"y0":568.81,"x1":379.5,"y1":568.81},"cw":{"x0":379.5,"y0":568.81,"x1":340.5,"y1":568.81}},"dflt":"ccw","col":"#1971c2","vis":[1],"t":"F"},{"f":"c","id":"iprc","cx":360,"cy":410,"r":44,"fill":"w","o":["iprd"],"need":"ipr","vis":[1],"t":"F","sel":["ipra"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"c","id":"ox1","cx":480,"cy":430,"r":7,"fill":"k","vis":[2],"t":"F"},{"f":"lb","id":"handtx1","k":"hand","bases":[[140,160,"start",[-1,-1]]],"need":"hand","vis":[2],"t":"F","x":140,"y":160,"anc":"start","n":"handx1"},{"f":"ar","id":"fa1x1","x0":490,"y0":430,"x1":720,"y1":430,"w":5,"need":"f1","sel":"f1a","var":{"right":{"x0":490,"y0":430,"x1":720,"y1":430}},"dflt":"right","gr":"f1d","vis":[2],"t":"F"},{"f":"lb","id":"f1tx1","k":"f1","bases":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]],"vbases":{"right":[[750,430,"start",[1,0]],[744,406,"start",[1,-1]]]},"need":"f1","sel":"f1a","var":{"right":{"x":750,"y":430,"anc":"start"}},"dflt":"right","vis":[2],"t":"F","x":750,"y":430,"anc":"start","n":"f1x1"},{"f":"lb","id":"fn1tx1","k":"fn1","bases":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]],"vbases":{"right":[[750,470,"start",[1,1]],[750,390,"start",[1,-1]]]},"need":"fn1","sel":"f1a","var":{"right":{"x":731.62,"y":488.38,"anc":"start"}},"dflt":"right","vis":[2],"t":"F","x":750,"y":470,"anc":"start","n":"fn1x1"},{"f":"ar","id":"fa2x1","x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2,"w":5,"need":"f2","sel":"f2a","var":{"back":{"x0":486.2,"y0":423.8,"x1":597.8,"y1":312.2}},"dflt":"back","gr":"f2d","vis":[2],"t":"F"},{"f":"lb","id":"f2tx1","k":"f2","bases":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]],"vbases":{"back":[[616.4,289.88,"start",[0.62,-0.62]],[621.8,288.2,"start",[1,-1]]]},"need":"f2","sel":"f2a","var":{"back":{"x":636.2,"y":292.71,"anc":"start"}},"dflt":"back","vis":[2],"t":"F","x":616.4,"y":289.88,"anc":"start","n":"f2x1"},{"f":"lb","id":"fn2tx1","k":"fn2","bases":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]],"vbases":{"back":[[616.4,329.88,"start",[0.62,1]],[616.4,249.88,"start",[0.62,-1]]]},"need":"fn2","sel":"f2a","var":{"back":{"x":594.3,"y":236.18,"anc":"start"}},"dflt":"back","vis":[2],"t":"F","x":616.4,"y":329.88,"anc":"start","n":"fn2x1"},{"f":"c","id":"fs2backx1","cx":613.92,"cy":296.08,"r":16,"fill":"w","sign":"×","need":"f2","sel":"f2a","var":{"back":{}},"vis":[2],"t":"F"},{"f":"ar","id":"fa3x1","x0":480,"y0":420,"x1":480,"y1":210,"w":5,"need":"f3","sel":"f3a","var":{"up":{"x0":480,"y0":420,"x1":480,"y1":210}},"dflt":"up","gr":"f3d","vis":[2],"t":"F"},{"f":"lb","id":"f3tx1","k":"f3","bases":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]],"vbases":{"up":[[480,174,"middle",[0,-1]],[504,186,"start",[1,-1]]]},"need":"f3","sel":"f3a","var":{"up":{"x":508.24,"y":181.76,"anc":"start"}},"dflt":"up","vis":[2],"t":"F","x":480,"y":174,"anc":"middle","n":"f3x1"},{"f":"lb","id":"fn3tx1","k":"fn3","bases":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]],"vbases":{"up":[[480,214,"middle",[0,1]],[480,134,"middle",[0,-1]]]},"need":"fn3","sel":"f3a","var":{"up":{"x":480,"y":128,"anc":"middle"}},"dflt":"up","vis":[2],"t":"F","x":480,"y":214,"anc":"middle","n":"fn3x1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU22s5rl(d, p, L){ tbFig_Draw(d, p, L, U22S5K.rl); }
function tbU22s5fm(d, p, L){ tbFig_Draw(d, p, L, U22S5K.fm); }
function tbU22s5rc(d, p, L){ tbFig_Draw(d, p, L, U22S5K.rc); }
function tbU22s5sw(d, p, L){ tbFig_Draw(d, p, L, U22S5K.sw); }
// ---- 22-6 斜めに動かす の図（※ textbook/gen/make_section.py が textbook/gen/data/u22_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U22S6K = {
  rc: {"vars":[],"items":[{"f":"ln","id":"bl0","pts":[[120,230],[860,230]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"blh0","x0":207.6,"y0":230,"x1":237.6,"y1":230,"sel":"ba","var":{"right":{"x0":207.6,"y0":230,"x1":237.6,"y1":230},"left":{"x0":239.6,"y0":230,"x1":209.6,"y1":230}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"bl1","pts":[[120,430],[860,430]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"blh1","x0":207.6,"y0":430,"x1":237.6,"y1":430,"sel":"ba","var":{"right":{"x0":207.6,"y0":430,"x1":237.6,"y1":430},"left":{"x0":239.6,"y0":430,"x1":209.6,"y1":430}},"dflt":"right","vis":[],"t":"F"},{"f":"ln","id":"bl2","pts":[[120,630],[860,630]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"blh2","x0":207.6,"y0":630,"x1":237.6,"y1":630,"sel":"ba","var":{"right":{"x0":207.6,"y0":630,"x1":237.6,"y1":630},"left":{"x0":239.6,"y0":630,"x1":209.6,"y1":630}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[850,200,"end",[0,-1]],[870,230,"start",[1,0]]],"need":"b","vis":[],"t":"F","x":850,"y":200,"anc":"end"},{"f":"c","id":"cc","cx":480,"cy":430,"r":30,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[440,474,"end",[-1,1]]],"need":"c","vis":[],"t":"F","x":440,"y":474,"anc":"end"},{"f":"ar","id":"va","x0":480,"y0":396,"x1":480,"y1":220,"w":5,"need":"v","sel":"vang","var":{"90":{"x0":480,"y0":396,"x1":480,"y1":220},"-90":{"x0":480,"y0":464,"x1":480,"y1":640},"30":{"x0":509.44,"y0":413,"x1":661.87,"y1":325},"0":{"x0":514,"y0":430,"x1":690,"y1":430},"60":{"x0":497,"y0":400.56,"x1":585,"y1":248.13}},"dflt":"90","gr":"vd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[500,200,"start",[1,-1]],[504,230,"start",[1,0]]],"vbases":{"90":[[500,200,"start",[1,-1]],[504,230,"start",[1,0]]],"-90":[[500,620,"start",[1,-1]],[504,650,"start",[1,0]]],"30":[[681.87,305,"start",[1,-1]],[685.87,335,"start",[1,0]]],"0":[[710,410,"start",[1,-1]],[714,440,"start",[1,0]]],"60":[[605,228.13,"start",[1,-1]],[609,258.13,"start",[1,0]]]},"need":"v","sel":"vang","var":{"90":{"x":500,"y":200,"anc":"start"},"-90":{"x":497.17,"y":600.2,"anc":"start"},"30":{"x":681.87,"y":305,"anc":"start"},"0":{"x":698.69,"y":398.69,"anc":"start"},"60":{"x":609,"y":258.13,"anc":"start"}},"dflt":"90","vis":[],"t":"F","x":500,"y":200,"anc":"start"},{"f":"ln","id":"tha","pts":[[570,430],[569.91,426.07],[569.66,422.16],[569.23,418.25],[568.63,414.37],[567.87,410.52],[566.93,406.71],[565.83,402.94],[564.57,399.22],[563.15,395.56],[561.57,391.96],[559.83,388.44],[557.94,385]],"w":3,"need":"th","sel":"vang","var":{"90":{"pts":[[570,430],[569.23,418.25],[566.93,406.71],[563.15,395.56],[557.94,385],[551.4,375.21],[543.64,366.36],[534.79,358.6],[525,352.06],[514.44,346.85],[503.29,343.07],[491.75,340.77],[480,340]]},"-90":{"pts":[[570,430],[569.23,441.75],[566.93,453.29],[563.15,464.44],[557.94,475],[551.4,484.79],[543.64,493.64],[534.79,501.4],[525,507.94],[514.44,513.15],[503.29,516.93],[491.75,519.23],[480,520]]},"30":{"pts":[[570,430],[569.91,426.07],[569.66,422.16],[569.23,418.25],[568.63,414.37],[567.87,410.52],[566.93,406.71],[565.83,402.94],[564.57,399.22],[563.15,395.56],[561.57,391.96],[559.83,388.44],[557.94,385]]},"0":{"pts":[[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430],[570,430]]},"60":{"pts":[[570,430],[569.66,422.16],[568.63,414.37],[566.93,406.71],[564.57,399.22],[561.57,391.96],[557.94,385],[553.72,378.38],[548.94,372.15],[543.64,366.36],[537.85,361.06],[531.62,356.28],[525,352.06]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"tht","k":"th","bases":[[590,404,"start",[1,-0.3]]],"need":"th","vis":[],"t":"F","x":611.84,"y":476.79,"anc":"start"},{"f":"ln","id":"vln","pts":[[480,170],[480,550]],"dash":1,"w":2,"o":["thpd"],"need":"thp","vis":[],"t":"F"},{"f":"ln","id":"thpa","pts":[[480,310],[490.46,310.46],[500.84,311.82],[511.06,314.09],[521.04,317.24],[530.71,321.24],[540,326.08],[548.83,331.7],[557.13,338.07],[564.85,345.15],[571.93,352.87],[578.3,361.17],[583.92,370]],"w":3,"o":["thpd"],"need":"thp","sel":"vang","var":{"90":{"pts":[[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310],[480,310]]},"-90":{"pts":[[480,310],[511.06,314.09],[540,326.08],[564.85,345.15],[583.92,370],[595.91,398.94],[600,430],[595.91,461.06],[583.92,490],[564.85,514.85],[540,533.92],[511.06,545.91],[480,550]]},"30":{"pts":[[480,310],[490.46,310.46],[500.84,311.82],[511.06,314.09],[521.04,317.24],[530.71,321.24],[540,326.08],[548.83,331.7],[557.13,338.07],[564.85,345.15],[571.93,352.87],[578.3,361.17],[583.92,370]]},"0":{"pts":[[480,310],[495.66,311.03],[511.06,314.09],[525.92,319.13],[540,326.08],[553.05,334.8],[564.85,345.15],[575.2,356.95],[583.92,370],[590.87,384.08],[595.91,398.94],[598.97,414.34],[600,430]]},"60":{"pts":[[480,310],[485.23,310.11],[490.46,310.46],[495.66,311.03],[500.84,311.82],[505.97,312.84],[511.06,314.09],[516.08,315.55],[521.04,317.24],[525.92,319.13],[530.71,321.24],[535.41,323.56],[540,326.08]]}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"thpt","k":"thp","bases":[[520,280,"start",[1,-1]]],"o":["thpd"],"need":"thp","vis":[],"t":"F","x":647.28,"y":152.72,"anc":"start"},{"f":"ar","id":"vsa","x0":480,"y0":396,"x1":480,"y1":325,"w":3,"o":["vsd"],"need":"vs","sel":"vang","var":{"90":{"x0":480,"y0":396,"x1":480,"y1":220},"-90":{"x0":480,"y0":396,"x1":480,"y1":640},"30":{"x0":480,"y0":396,"x1":480,"y1":325},"0":{"x0":480,"y0":396,"x1":480,"y1":430},"60":{"x0":480,"y0":396,"x1":480,"y1":248.13}},"dflt":"30","vis":[],"t":"F","dash":1},{"f":"lb","id":"vst","k":"vs","bases":[[460,340,"end",[-1,0]]],"o":["vsd"],"need":"vs","vis":[],"t":"F","x":460,"y":340,"anc":"end"},{"f":"ar","id":"vpa","x0":514,"y0":430,"x1":660,"y1":430,"w":3,"o":["vpd"],"need":"vp","sel":"vang","var":{"90":{"x0":514,"y0":430,"x1":480,"y1":430},"-90":{"x0":514,"y0":430,"x1":480,"y1":430},"30":{"x0":514,"y0":430,"x1":661.87,"y1":430},"0":{"x0":514,"y0":430,"x1":690,"y1":430},"60":{"x0":514,"y0":430,"x1":585,"y1":430}},"dflt":"30","vis":[],"t":"F"},{"f":"lb","id":"vpt","k":"vp","bases":[[600,470,"middle",[0,1]]],"o":["vpd"],"need":"vp","vis":[],"t":"F","x":608,"y":470,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU22s6rc(d, p, L){ tbFig_Draw(d, p, L, U22S6K.rc); }
var KINDS = {u22s1cm: tbU22s1cm, u22s2cm: tbU22s2cm, u22s2rl: tbU22s2rl, u22s2sw: tbU22s2sw, u22s3cm: tbU22s3cm, u22s4fg: tbU22s4fg, u22s5rl: tbU22s5rl, u22s5fm: tbU22s5fm, u22s5rc: tbU22s5rc, u22s5sw: tbU22s5sw, u22s6rc: tbU22s6rc};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 22-1 の図は電流が流れないので載せない,
  // 22-2 の図は電流が流れないので載せない,
  // 22-3 の図は電流が流れないので載せない,
  // 22-4 の図は電流が流れないので載せない,
  // 22-5 の図は電流が流れないので載せない,
  // 22-6 の図は電流が流れないので載せない
};

// 22-1 電磁誘導 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u22_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU22s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU22s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU22s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU22s1_par(a, b){ return a * b / (a + b); }
function tbU22s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU22s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU22s1_Qmake(r){
  var gcd = tbU22s1_gcd, ratio = tbU22s1_ratio, par = tbU22s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var goa = (k == 1 ? 'in' : 'out');
    var act = (k == 1 ? 'コイルに近づけた' : 'コイルから遠ざけた');
    var chg = (k == 1 ? '増える' : '減る');
    var good = (k == 1 ? '磁石の磁束と逆向き' : '磁石の磁束と同じ向き');
    var bad = (k == 1 ? '磁石の磁束と同じ向き' : '磁石の磁束と逆向き');
    var why = (k == 1 ? '同じ向きにつくると、増えるのを助けてしまう' : '逆向きにつくると、減るのを助けてしまう');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "磁束はつくらない", v: "none", why: "鎖交する磁束が変わるので、コイルは変化を妨げる磁束をつくろうとする"}, {t: "磁石の動きと同じ向き", v: "go", why: "コイルは、鎖交する磁束の変化を妨げる向きに磁束をつくる"}]);
    return {form: "u22s1make", text: "図のように、磁石の N 極を" + String(act) + "。コイルがつくろうとする磁束の向きはどれか。", fig: {kind: "u22s1cm", L: tbU22s1_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, [["goa", String(goa)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["N 極を" + String(act) + "ので、コイルに鎖交する磁束は" + String(chg), "変化を妨げる向きなので、" + String(good)], chk: {form: "u22s1make", p: {k: k}}};
  }
  throw new Error("u22s1make：条件に合う数字が見つからない");
}
function tbU22s1_Qchg(r){
  var gcd = tbU22s1_gcd, ratio = tbU22s1_ratio, par = tbU22s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var goa = (k == 1 ? 'in' : 'out');
    var act = (k == 1 ? 'コイルに近づけた' : 'コイルから遠ざけた');
    var good = (k == 1 ? '増える' : '減る');
    var bad = (k == 1 ? '減る' : '増える');
    var why = (k == 1 ? '減るのは、磁石を遠ざけたとき' : '増えるのは、磁石を近づけたとき');
    var rule = (k == 1 ? '近づけると、コイルの中を通る磁束が多くなる' : '遠ざけると、コイルの中を通る磁束が少なくなる');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "変わらない", v: "same", why: "磁石を動かすと、コイルの中を通る磁束の数が変わる"}, {t: "磁束は鎖交しない", v: "zero", why: "磁石の磁束の一部は、コイルの中を通っている"}]);
    return {form: "u22s1chg", text: "図のように、磁石の N 極を" + String(act) + "。コイルに鎖交する磁束はどうなるか。", fig: {kind: "u22s1cm", L: tbU22s1_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, [["goa", String(goa)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), "鎖交する磁束は" + String(good)], chk: {form: "u22s1chg", p: {k: k}}};
  }
  throw new Error("u22s1chg：条件に合う数字が見つからない");
}
function tbU22s1_Qdef(r){
  var gcd = tbU22s1_gcd, ratio = tbU22s1_ratio, par = tbU22s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "電磁誘導", v: "own"}, {t: "電磁力", v: "f", why: "電磁力は、磁界の中の導体に電流を流したときに働く力"}, {t: "右ねじの法則", v: "rs", why: "右ねじの法則は、電流と磁界の向きの関係"}, {t: "透磁率", v: "mu", why: "透磁率は、磁束の通りやすさを表す値"}]);
    return {form: "u22s1def", text: "コイルに鎖交する磁束が変わると、コイルにその変化を妨げる向きの起電力が生じる。これを □ という。", fig: {kind: "u22s1cm", L: tbU22s1_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["鎖交する磁束が変わると、変化を妨げる向きに起電力が生じる", "これを電磁誘導という"], chk: {form: "u22s1def", p: {}}};
  }
  throw new Error("u22s1def：条件に合う数字が見つからない");
}
function tbU22s1_Qword(r){
  var gcd = tbU22s1_gcd, ratio = tbU22s1_ratio, par = tbU22s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁束がコイルの中を通る（交わる）", v: "own"}, {t: "磁束がコイルの外を回る", v: "out", why: "鎖交は交わるという意味。コイルの中を通ること"}, {t: "コイルに電流が流れる", v: "i", why: "電流が流れることではなく、磁束がコイルの中を通ること"}, {t: "磁束が無くなる", v: "zero", why: "鎖交は交わるという意味。磁束がコイルの中を通ること"}]);
    return {form: "u22s1word", text: "磁束がコイルに鎖交するとは、□ ことである。", fig: {kind: "u22s1cm", L: tbU22s1_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["鎖交は、交わるという意味", "磁束がコイルの中を通ること"], chk: {form: "u22s1word", p: {}}};
  }
  throw new Error("u22s1word：条件に合う数字が見つからない");
}
function tbU22s1_Qname(r){
  var gcd = tbU22s1_gcd, ratio = tbU22s1_ratio, par = tbU22s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "誘導電流", v: "own"}, {t: "誘導起電力", v: "e", why: "誘導起電力は、誘導電流を流す起電力"}, {t: "磁束", v: "phi", why: "磁束は、磁界の様子を表す線"}, {t: "電磁力", v: "f", why: "電磁力は、磁界の中の導体に電流を流したときに働く力"}]);
    return {form: "u22s1name", text: "電磁誘導でコイルに流れる電流を □ という。", fig: {kind: "u22s1cm", L: tbU22s1_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電磁誘導で流れる電流は誘導電流", "誘導電流を流す起電力は誘導起電力"], chk: {form: "u22s1name", p: {}}};
  }
  throw new Error("u22s1name：条件に合う数字が見つからない");
}
// 22-2 誘導電流の向き の練習（※ textbook/gen/make_section.py が textbook/gen/data/u22_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU22s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU22s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU22s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU22s2_par(a, b){ return a * b / (a + b); }
function tbU22s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU22s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU22s2_Qflux(r){
  var gcd = tbU22s2_gcd, ratio = tbU22s2_ratio, par = tbU22s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var mgs = (k <= 2 ? 'N' : 'S');
    var goa = (k == 1 || k == 3 ? 'in' : 'out');
    var act = (k == 1 || k == 3 ? 'コイルに近づけた' : 'コイルから遠ざけた');
    var chg = (k == 1 || k == 3 ? '増える' : '減る');
    var mdir = (k <= 2 ? '右向き' : '左向き');
    var good = (k == 1 || k == 4 ? '左向き' : '右向き');
    var bad = (k == 1 || k == 4 ? '右向き' : '左向き');
    var why = ('それでは、鎖交する磁束が' + chg + 'のを助けてしまう');
    var pole = (k <= 2 ? 'N 極から出る磁束は、コイルの中を右向きに通る' : 'S 極に入る磁束は、コイルの中を左向きに通る');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "上向き", v: "up", why: "コイルは、自分の中を通る向きに磁束をつくる"}, {t: "磁束はつくらない", v: "none", why: "鎖交する磁束が変わるので、コイルは変化を妨げる磁束をつくろうとする"}]);
    return {form: "u22s2flux", text: "図のように、磁石の " + String(mgs) + " 極を" + String(act) + "。コイルがつくろうとする磁束の向きはどれか。", fig: {kind: "u22s2cm", L: tbU22s2_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, [["mgs", String(mgs)], ["goa", String(goa)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(pole) + "。" + String(act) + "ので、" + String(mdir) + "の磁束が" + String(chg), "変化を妨げるので、つくる磁束は" + String(good)], chk: {form: "u22s2flux", p: {k: k}}};
  }
  throw new Error("u22s2flux：条件に合う数字が見つからない");
}
function tbU22s2_Qcur(r){
  var gcd = tbU22s2_gcd, ratio = tbU22s2_ratio, par = tbU22s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var mgs = (k <= 2 ? 'N' : 'S');
    var goa = (k == 1 || k == 3 ? 'in' : 'out');
    var act = (k == 1 || k == 3 ? 'コイルに近づけた' : 'コイルから遠ざけた');
    var fdir = (k == 1 || k == 4 ? '左向き' : '右向き');
    var good = (k == 1 || k == 4 ? '反時計回り' : '時計回り');
    var bad = (k == 1 || k == 4 ? '時計回り' : '反時計回り');
    var why = ('その向きの電流は、' + (k == 1 || k == 4 ? '右向き' : '左向き') + 'の磁束をつくる');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "磁石の動きと同じ向き", v: "go", why: "電流はコイルに沿って回る向きに流れる"}, {t: "電流は流れない", v: "none", why: "鎖交する磁束が変わるので、誘導電流が流れる"}]);
    return {form: "u22s2cur", text: "図のように、磁石の " + String(mgs) + " 極を" + String(act) + "。磁石の側から見て、コイルに流れる誘導電流の向きはどれか。", fig: {kind: "u22s2cm", L: tbU22s2_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, [["mgs", String(mgs)], ["goa", String(goa)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コイルがつくろうとする磁束は" + String(fdir), "右手の親指を" + String(fdir) + "に向けると、磁石の側から見て4本の指は" + String(good) + "に巻く"], chk: {form: "u22s2cur", p: {k: k}}};
  }
  throw new Error("u22s2cur：条件に合う数字が見つからない");
}
function tbU22s2_Qrail(r){
  var gcd = tbU22s2_gcd, ratio = tbU22s2_ratio, par = tbU22s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var bs = (k <= 2 ? 'back' : 'front');
    var mk = (k <= 2 ? '奥向き（×）' : '手前向き（・）');
    var va = (k == 1 || k == 3 ? 'right' : 'left');
    var dir = (k == 1 || k == 3 ? '右' : '左');
    var area = (k == 1 || k == 3 ? '増える' : '減る');
    var mkf = (k == 1 || k == 4 ? '手前向き' : '奥向き');
    var good = (k == 1 || k == 4 ? '反時計回り' : '時計回り');
    var bad = (k == 1 || k == 4 ? '時計回り' : '反時計回り');
    var why = ('その向きの電流は、' + (k == 1 || k == 4 ? '奥向き' : '手前向き') + 'の磁束をつくる');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "導体棒の動きと同じ向き", v: "r", why: "電流は、閉じた回路を回る向きに流れる"}, {t: "電流は流れない", v: "none", why: "囲む面積が変わり、鎖交する磁束が変わるので、電流が流れる"}]);
    return {form: "u22s2rail", text: "図のように、" + String(mk) + "の磁束の中で、レールの上の導体棒を" + String(dir) + "に動かした。上から見た誘導電流の向きはどれか。", fig: {kind: "u22s2rl", L: tbU22s2_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, [["b", "{B}"], ["bs", String(bs)], ["rod", ""], ["v", "{v}"], ["va", String(va)], ["mg", null], ["mgs", null], ["ph", null], ["cl", null], ["go", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["囲む面積が" + String(area) + "ので、" + String(mk) + "の鎖交する磁束が" + String(area), "コイルは" + String(mkf) + "の磁束をつくろうとする。親指を" + String(mkf) + "に向けると、上から見て" + String(good)], chk: {form: "u22s2rail", p: {k: k}}};
  }
  throw new Error("u22s2rail：条件に合う数字が見つからない");
}
function tbU22s2_Qrule(r){
  var gcd = tbU22s2_gcd, ratio = tbU22s2_ratio, par = tbU22s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "コイルがつくろうとする磁束の向きに右手の親指を向けたときの、4本の指の向き", v: "own"}, {t: "磁石の磁束の向きに右手の親指を向けたときの、4本の指の向き", v: "mag", why: "親指は、コイルがつくろうとする磁束（変化を妨げる向き）に向ける"}, {t: "フレミングの左手の法則の中指", v: "left", why: "フレミングの左手の法則は、電磁力の向きを求めるときに使う"}, {t: "磁石を動かした向き", v: "go", why: "向きは、コイルがつくろうとする磁束から右ねじの法則で決まる"}]);
    return {form: "u22s2rule", text: "誘導電流の向きは、□ の向きで求める。", fig: {kind: "u22s2cm", L: tbU22s2_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":""}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コイルは、鎖交する磁束の変化を妨げる向きに磁束をつくろうとする", "その向きに右手の親指を向けると、4本の指の巻く向きが誘導電流"], chk: {form: "u22s2rule", p: {}}};
  }
  throw new Error("u22s2rule：条件に合う数字が見つからない");
}
// 22-3 ファラデーの法則 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u22_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU22s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU22s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU22s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU22s3_par(a, b){ return a * b / (a + b); }
function tbU22s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU22s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU22s3_Qe(r){
  var gcd = tbU22s3_gcd, ratio = tbU22s3_ratio, par = tbU22s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,5,10,20,50,100,200]);
    var p = pick(r, [0.01,0.02,0.04,0.05,0.1,0.2,0.4,0.5,1,2]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.4,0.5,1,2]);
    var E = (n * p / t);
    if (!(p != t && E >= 1 && E <= 1000 && nice(E) && nice(p / t) && nice(n * p * t) && nice(n * t / p) && n * p * t >= 0.01)) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU22s3_three(ok, [{x: (p / t), why: "巻数を掛けていない"}, {x: (n * p * t), why: "時間で割るところを掛けた"}, {x: (n * t / p), why: "割る順が逆（時間を磁束の変化で割った）"}, {x: (n * p), why: "時間で割っていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u22s3e", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が、$" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(p) + "\\,\\mathrm{Wb}$ 変わった。誘導起電力の大きさは何 V か。", fig: {kind: "u22s3cm", L: tbU22s3_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, [["n", "{N}=" + fmt(n)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["大きさなので、$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$", "$e = " + fmt(n) + " \\times \\dfrac{" + fmt(p) + "}{" + fmt(t) + "} = " + qv(ok, "V") + "$"], chk: {form: "u22s3e", p: {n: n, p: p, t: t}}};
  }
  throw new Error("u22s3e：条件に合う数字が見つからない");
}
function tbU22s3_Qdphi(r){
  var gcd = tbU22s3_gcd, ratio = tbU22s3_ratio, par = tbU22s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200]);
    var p = pick(r, [0.01,0.02,0.04,0.05,0.1,0.2,0.5,1]);
    var t = pick(r, [0.1,0.2,0.5,1,2]);
    var E = (n * p / t);
    var A = (E * t);
    var B = (E / (n * t));
    var C = (n * t / E);
    if (!(nice(E) && E >= 1 && nice(A) && nice(B) && nice(C) && B >= 0.001 && distinct([p, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(p) + "\\,\\mathrm{Wb}$", v: fmt(p)}, {t: "$" + fmt(A) + "\\,\\mathrm{Wb}$", v: fmt(A), why: "巻数で割っていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{Wb}$", v: fmt(B), why: "時間を掛けるところを割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{Wb}$", v: fmt(C), why: "割る順が逆"}]);
    return {form: "u22s3dphi", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が $" + fmt(t) + "\\,\\mathrm{s}$ の間に変わり、大きさ $" + fmt(E) + "\\,\\mathrm{V}$ の誘導起電力が生じた。この間に変わった磁束は何 Wb か。", fig: {kind: "u22s3cm", L: tbU22s3_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, [["n", "{N}=" + fmt(n)], ["e", "{e}=" + fmt(E) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ より $\\Delta \\Phi = \\dfrac{e \\Delta t}{N}$", "$\\Delta \\Phi = \\dfrac{" + fmt(E) + " \\times " + fmt(t) + "}{" + fmt(n) + "} = " + fmt(p) + "\\,\\mathrm{Wb}$"], chk: {form: "u22s3dphi", p: {n: n, p: p, t: t}}};
  }
  throw new Error("u22s3dphi：条件に合う数字が見つからない");
}
function tbU22s3_Qn(r){
  var gcd = tbU22s3_gcd, ratio = tbU22s3_ratio, par = tbU22s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [5,10,20,25,50,100,200]);
    var p = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var t = pick(r, [0.1,0.2,0.5,1,2]);
    var E = (n * p / t);
    var A = (E / p);
    var B = (E * t);
    var C = (E * t * p);
    if (!(nice(E) && E >= 1 && nice(A) && nice(B) && nice(C) && C >= 0.001 && distinct([n, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(n) + "$", v: fmt(n)}, {t: "$" + fmt(A) + "$", v: fmt(A), why: "時間を掛けていない"}, {t: "$" + fmt(B) + "$", v: fmt(B), why: "磁束の変化で割っていない"}, {t: "$" + fmt(C) + "$", v: fmt(C), why: "磁束の変化で割るところを掛けた"}]);
    return {form: "u22s3n", text: "コイルに鎖交する磁束が $" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(p) + "\\,\\mathrm{Wb}$ 変わり、大きさ $" + fmt(E) + "\\,\\mathrm{V}$ の誘導起電力が生じた。コイルの巻数はいくらか。", fig: {kind: "u22s3cm", L: tbU22s3_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, [["e", "{e}=" + fmt(E) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ より $N = \\dfrac{e \\Delta t}{\\Delta \\Phi}$", "$N = \\dfrac{" + fmt(E) + " \\times " + fmt(t) + "}{" + fmt(p) + "} = " + fmt(n) + "$"], chk: {form: "u22s3n", p: {n: n, p: p, t: t}}};
  }
  throw new Error("u22s3n：条件に合う数字が見つからない");
}
function tbU22s3_Qtimes(r){
  var gcd = tbU22s3_gcd, ratio = tbU22s3_ratio, par = tbU22s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var m = pick(r, [2,3,4,5]);
    var m2 = (m * m);
    var what = (k == 1 ? 'コイルの巻数を ' + m + ' 倍にした' : (k == 2 ? '変わる磁束はそのままで、変わるまでの時間を ' + m + ' 分の 1 にした' : '変わる磁束はそのままで、変わるまでの時間を ' + m + ' 倍にした'));
    var gs = (k == 3 ? '\\dfrac{1}{' + m + '}' : '' + m);
    var bs = (k == 3 ? '' + m : '\\dfrac{1}{' + m + '}');
    var why = (k == 1 ? '誘導起電力は巻数に比例する' : '誘導起電力は、時間に反比例する（短い時間で変わるほど大きい）');
    var _c = choices(r, [{t: "$" + String(gs) + "$ 倍", v: "good"}, {t: "$" + String(bs) + "$ 倍", v: "bad", why: String(why)}, {t: "$" + fmt(m2) + "$ 倍", v: "sq", why: "$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ に2乗は無い"}, {t: "$1$ 倍（変わらない）", v: "one", why: String(why)}]);
    return {form: "u22s3times", text: String(what) + "。誘導起電力の大きさは元の何倍になるか。", fig: {kind: "u22s3cm", L: tbU22s3_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$", "誘導起電力は $" + String(gs) + "$ 倍"], chk: {form: "u22s3times", p: {k: k, m: m}}};
  }
  throw new Error("u22s3times：条件に合う数字が見つからない");
}
function tbU22s3_Qsign(r){
  var gcd = tbU22s3_gcd, ratio = tbU22s3_ratio, par = tbU22s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁束の変化を妨げる向きに起電力が生じる", v: "own"}, {t: "起電力が必ず負の値になる", v: "neg", why: "大きさを求めるときは、マイナスを外して計算する"}, {t: "磁束が減っている", v: "dec", why: "磁束が増えても減っても、マイナスは付いている"}, {t: "巻数を引く", v: "sub", why: "巻数は掛ける。マイナスは向きを表す"}]);
    return {form: "u22s3sign", text: "ファラデーの法則 $e = -N \\dfrac{\\Delta \\Phi}{\\Delta t}$ のマイナスが表すのは、□ ことである。", fig: {kind: "u22s3cm", L: tbU22s3_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["マイナスは、磁束の変化と逆向きに起電力が生じることを表す", "変化を妨げる向きに起電力が生じる"], chk: {form: "u22s3sign", p: {}}};
  }
  throw new Error("u22s3sign：条件に合う数字が見つからない");
}
// 22-4 磁束のグラフと起電力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u22_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU22s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU22s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU22s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU22s4_par(a, b){ return a * b / (a + b); }
function tbU22s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU22s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU22s4_Qrise(r){
  var gcd = tbU22s4_gcd, ratio = tbU22s4_ratio, par = tbU22s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [1,2,5,10,20,50]);
    var p = pick(r, [0.1,0.2,0.4,0.5,0.6,0.8,1,2,4,6]);
    var t1 = pick(r, [0.1,0.2,0.3,0.4,0.5,1,2]);
    var T2 = (t1 * 2);
    var E = (n * p / t1);
    if (!(p != t1 && E >= 1 && E <= 1000 && nice(E) && nice(p / t1) && nice(n * p * t1) && nice(n * t1 / p) && nice(E / 2))) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU22s4_three(ok, [{x: (p / t1), why: "巻数を掛けていない"}, {x: (n * p * t1), why: "時間で割るところを掛けた"}, {x: (n * t1 / p), why: "割る順が逆"}, {x: (E / 2), why: "磁束が変わらない区間まで含めた時間で割った"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u22s4rise", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が、図のように変わった。$0\\,\\mathrm{s}$ から $" + fmt(t1) + "\\,\\mathrm{s}$ までの誘導起電力の大きさは何 V か。", fig: {kind: "u22s4fg", L: tbU22s4_fig({"sh":"rise_flat"}, [["n", "{N}=" + fmt(n)], ["t1", fmt(t1)], ["t2", fmt(T2)], ["p1", fmt(p)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["傾きが一定なので、$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ は一定", "$e = " + fmt(n) + " \\times \\dfrac{" + fmt(p) + "}{" + fmt(t1) + "} = " + qv(ok, "V") + "$"], chk: {form: "u22s4rise", p: {n: n, p: p, t1: t1}}};
  }
  throw new Error("u22s4rise：条件に合う数字が見つからない");
}
function tbU22s4_Qflat(r){
  var gcd = tbU22s4_gcd, ratio = tbU22s4_ratio, par = tbU22s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [1,2,5,10,20]);
    var p = pick(r, [0.2,0.4,0.5,0.6,0.8,1,2,4]);
    var t1 = pick(r, [0.1,0.2,0.4,0.5,1]);
    var T2 = (t1 * 3);
    var E = (n * p / t1);
    var A = (n * p);
    var B = (n * p / T2);
    if (!(nice(E) && nice(A) && nice(B) && nice(T2) && B > 0 && distinct([0, E, A, B]))) continue;
    var _c = choices(r, [{t: "$0\\,\\mathrm{V}$", v: "0"}, {t: "$" + fmt(E) + "\\,\\mathrm{V}$", v: fmt(E), why: "それは磁束が変わる区間（0 s から " + fmt(t1) + " s まで）の起電力"}, {t: "$" + fmt(A) + "\\,\\mathrm{V}$", v: fmt(A), why: "起電力は、磁束の大きさではなく、変化で決まる"}, {t: "$" + fmt(B) + "\\,\\mathrm{V}$", v: fmt(B), why: "この区間は磁束が変わらないので、起電力は生じない"}]);
    return {form: "u22s4flat", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が、図のように変わった。$" + fmt(t1) + "\\,\\mathrm{s}$ から $" + fmt(T2) + "\\,\\mathrm{s}$ までの誘導起電力の大きさは何 V か。", fig: {kind: "u22s4fg", L: tbU22s4_fig({"sh":"rise_flat"}, [["n", "{N}=" + fmt(n)], ["t1", fmt(t1)], ["t2", fmt(T2)], ["p1", fmt(p)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["この区間は、磁束が $" + fmt(p) + "\\,\\mathrm{Wb}$ のまま変わらない（$\\Delta \\Phi = 0$）", "$e = 0\\,\\mathrm{V}$"], chk: {form: "u22s4flat", p: {n: n}}};
  }
  throw new Error("u22s4flat：条件に合う数字が見つからない");
}
function tbU22s4_Qfall(r){
  var gcd = tbU22s4_gcd, ratio = tbU22s4_ratio, par = tbU22s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [1,2,5,10,20]);
    var p = pick(r, [0.2,0.4,0.5,0.6,0.8,1,2,4]);
    var t1 = pick(r, [0.1,0.2,0.3,0.4,0.5]);
    var d = pick(r, [0.1,0.2,0.3,0.4,0.5,1]);
    var T2 = (t1 + d);
    var E = (n * p / d);
    if (!(t1 != d && p != d && E >= 1 && E <= 1000 && nice(E) && nice(T2) && nice(n * p / t1) && nice(n * p / T2) && nice(n * p * d))) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU22s4_three(ok, [{x: (n * p / t1), why: "前の区間（0 s から " + fmt(t1) + " s まで）の傾きで計算した"}, {x: (n * p / T2), why: "0 s からの時間で割った"}, {x: (n * p * d), why: "時間で割るところを掛けた"}, {x: (p / d), why: "巻数を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u22s4fall", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が、図のように変わった。$" + fmt(t1) + "\\,\\mathrm{s}$ から $" + fmt(T2) + "\\,\\mathrm{s}$ までの誘導起電力の大きさは何 V か。", fig: {kind: "u22s4fg", L: tbU22s4_fig({"sh":"rise_flat"}, [["sh", "rise_fall"], ["n", "{N}=" + fmt(n)], ["t1", fmt(t1)], ["t2", fmt(T2)], ["p1", fmt(p)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["この区間は、$" + fmt(d) + "\\,\\mathrm{s}$ の間に磁束が $" + fmt(p) + "\\,\\mathrm{Wb}$ から 0 まで減る", "$e = " + fmt(n) + " \\times \\dfrac{" + fmt(p) + "}{" + fmt(d) + "} = " + qv(ok, "V") + "$"], chk: {form: "u22s4fall", p: {n: n, p: p, d: d}}};
  }
  throw new Error("u22s4fall：条件に合う数字が見つからない");
}
function tbU22s4_Qcmp(r){
  var gcd = tbU22s4_gcd, ratio = tbU22s4_ratio, par = tbU22s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t1 = pick(r, [0.1,0.2,0.3,0.4]);
    var d = pick(r, [0.1,0.2,0.3,0.4,0.6]);
    var T2 = (t1 + d);
    var good = (t1 < d ? '0 s から ' + fmt(t1) + ' s まで' : fmt(t1) + ' s から ' + fmt(T2) + ' s まで');
    var bad = (t1 < d ? fmt(t1) + ' s から ' + fmt(T2) + ' s まで' : '0 s から ' + fmt(t1) + ' s まで');
    if (!(t1 != d && nice(T2))) continue;
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: "変わる磁束は同じなので、短い時間で変わる（傾きが急な）区間の方が大きい"}, {t: "どちらも同じ", v: "same", why: "変わる磁束は同じでも、かかる時間が違う"}, {t: "どちらも 0 V", v: "zero", why: "磁束が変わっている間は、起電力が生じる"}]);
    return {form: "u22s4cmp", text: "コイルに鎖交する磁束が、図のように変わった。誘導起電力が大きいのはどの区間か。", fig: {kind: "u22s4fg", L: tbU22s4_fig({"sh":"rise_flat"}, [["sh", "rise_fall"], ["n", null], ["t1", fmt(t1)], ["t2", fmt(T2)], ["p1", "{Φ}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["どちらの区間も、変わる磁束は同じ", "短い時間で変わる（傾きが急な）" + String(good) + "の方が大きい"], chk: {form: "u22s4cmp", p: {t1: t1, d: d}}};
  }
  throw new Error("u22s4cmp：条件に合う数字が見つからない");
}
function tbU22s4_Qstop(r){
  var gcd = tbU22s4_gcd, ratio = tbU22s4_ratio, par = tbU22s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "生じない（0 V）", v: "own"}, {t: "近づけている間と同じ大きさで生じる", v: "same", why: "止めると鎖交する磁束が変わらないので、起電力は生じない"}, {t: "近づけている間より大きく生じる", v: "big", why: "止めると鎖交する磁束が変わらないので、起電力は生じない"}, {t: "逆向きに生じる", v: "rev", why: "逆向きに生じるのは、遠ざけたとき"}]);
    return {form: "u22s4stop", text: "コイルに磁石を近づけたあと、磁石をコイルの近くで止めた。止めている間の誘導起電力は □。", fig: {kind: "u22s4fg", L: tbU22s4_fig({"sh":"rise_flat"}, [["sh", "rise_flat"], ["t1", null], ["t2", null], ["p1", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["止めている間は、鎖交する磁束が変わらない（$\\Delta \\Phi = 0$）", "誘導起電力は生じない"], chk: {form: "u22s4stop", p: {}}};
  }
  throw new Error("u22s4stop：条件に合う数字が見つからない");
}
// 22-5 導体棒 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u22_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU22s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU22s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU22s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU22s5_par(a, b){ return a * b / (a + b); }
function tbU22s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU22s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU22s5_Qe(r){
  var gcd = tbU22s5_gcd, ratio = tbU22s5_ratio, par = tbU22s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.1,0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var l = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var v = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var E = (b * l * v);
    if (!(nice(E) && E >= 0.1 && nice(b * l) && nice(b * v) && nice(l * v / b) && b != l)) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU22s5_three(ok, [{x: (b * l), why: "速さを掛けていない"}, {x: (b * v), why: "長さを掛けていない"}, {x: (l * v / b), why: "磁束密度で割った"}, {x: (l * v), why: "磁束密度を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u22s5e", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体棒を、磁界と直角に速さ $" + fmt(v) + "\\,\\mathrm{m/s}$ で動かした。導体棒に生じる誘導起電力は何 V か。", fig: {kind: "u22s5rl", L: tbU22s5_fig({"b":"{B}","bs":"back","rod":"","l":"{l}","v":"{v}","va":"right","e":"{e}"}, [["b", "{B}=" + fmt(b) + " T"], ["l", "{l}=" + fmt(l) + " m"], ["v", "{v}=" + fmt(v) + " m/s"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = B l v$", "$e = " + fmt(b) + " \\times " + fmt(l) + " \\times " + fmt(v) + " = " + qv(ok, "V") + "$"], chk: {form: "u22s5e", p: {b: b, l: l, v: v}}};
  }
  throw new Error("u22s5e：条件に合う数字が見つからない");
}
function tbU22s5_Qv(r){
  var gcd = tbU22s5_gcd, ratio = tbU22s5_ratio, par = tbU22s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2]);
    var l = pick(r, [0.1,0.2,0.4,0.5,1]);
    var v = pick(r, [2,4,5,8,10,20]);
    var E = (b * l * v);
    var A = (E / b);
    var C = (E * b * l);
    var D = (b * l / E);
    if (!(nice(E) && E >= 0.1 && nice(A) && nice(C) && nice(D) && C >= 0.001 && D >= 0.001 && distinct([v, A, C, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(v) + "\\,\\mathrm{m/s}$", v: fmt(v)}, {t: "$" + fmt(A) + "\\,\\mathrm{m/s}$", v: fmt(A), why: "長さで割っていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{m/s}$", v: fmt(C), why: "割るところを掛けた"}, {t: "$" + fmt(D) + "\\,\\mathrm{m/s}$", v: fmt(D), why: "割る順が逆"}]);
    return {form: "u22s5v", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体棒を磁界と直角に動かすと、$" + fmt(E) + "\\,\\mathrm{V}$ の誘導起電力が生じた。導体棒の速さは何 m/s か。", fig: {kind: "u22s5rl", L: tbU22s5_fig({"b":"{B}","bs":"back","rod":"","l":"{l}","v":"{v}","va":"right","e":"{e}"}, [["b", "{B}=" + fmt(b) + " T"], ["l", "{l}=" + fmt(l) + " m"], ["v", "{v}"], ["e", "{e}=" + fmt(E) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = B l v$ より $v = \\dfrac{e}{B l}$", "$v = \\dfrac{" + fmt(E) + "}{" + fmt(b) + " \\times " + fmt(l) + "} = " + fmt(v) + "\\,\\mathrm{m/s}$"], chk: {form: "u22s5v", p: {b: b, l: l, v: v}}};
  }
  throw new Error("u22s5v：条件に合う数字が見つからない");
}
function tbU22s5_Qdir(r){
  var gcd = tbU22s5_gcd, ratio = tbU22s5_ratio, par = tbU22s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var ba = (k <= 2 ? 'right' : 'left');
    var bd = (k <= 2 ? '右向き' : '左向き');
    var vang = (k == 1 || k == 3 ? '90' : '-90');
    var vd = (k == 1 || k == 3 ? '上向き' : '下向き');
    var good = (k == 1 || k == 4 ? '奥向き（×）' : '手前向き（・）');
    var bad = (k == 1 || k == 4 ? '手前向き（・）' : '奥向き（×）');
    var gd = (k == 1 || k == 4 ? '奥' : '手前');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: "人差し指を磁界、親指を運動の向きに合わせると、中指は" + String(gd) + "を向く"}, {t: String(bd) + "（磁束と同じ向き）", v: "b", why: "起電力の向きは、磁界の向きとも運動の向きとも直角"}, {t: String(vd) + "（動かした向き）", v: "v", why: "起電力の向きは、磁界の向きとも運動の向きとも直角"}]);
    return {form: "u22s5dir", text: "図のように、" + String(bd) + "の磁束の中で、導体を" + String(vd) + "に動かした。導体に生じる起電力の向きはどれか。", fig: {kind: "u22s5rc", L: tbU22s5_fig({"b":"{B}","bs":"back","rod":"","l":"{l}","v":"{v}","va":"right","e":"{e}"}, [["b", "{B}"], ["ba", String(ba)], ["c", ""], ["v", "{v}"], ["vang", String(vang)], ["bs", null], ["rod", null], ["l", null], ["va", null], ["e", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["フレミングの右手の法則：人差し指を" + String(bd) + "（磁界）、親指を" + String(vd) + "（運動）に向ける", "中指（起電力）は" + String(good)], chk: {form: "u22s5dir", p: {k: k}}};
  }
  throw new Error("u22s5dir：条件に合う数字が見つからない");
}
function tbU22s5_Qfinger(r){
  var gcd = tbU22s5_gcd, ratio = tbU22s5_ratio, par = tbU22s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var fg = (k == 1 ? '中指' : (k == 2 ? '人差し指' : '親指'));
    var good = (k == 1 ? '起電力（電流）' : (k == 2 ? '磁界' : '運動'));
    var b1 = (k == 1 ? '磁界' : '起電力（電流）');
    var w1 = (k == 1 ? '磁界は人差し指' : '起電力（電流）は中指');
    var b2 = (k == 3 ? '磁界' : '運動');
    var w2 = (k == 3 ? '磁界は人差し指' : '運動は親指');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(b1), v: "b1", why: String(w1)}, {t: String(b2), v: "b2", why: String(w2)}, {t: "磁束密度の大きさ", v: "size", why: "指が表すのは向き。中指から起電力・磁界・運動"}]);
    return {form: "u22s5finger", text: "フレミングの右手の法則で、" + String(fg) + "が表す向きはどれか。", fig: {kind: "u22s5rl", L: tbU22s5_fig({"b":"{B}","bs":"back","rod":"","l":"{l}","v":"{v}","va":"right","e":"{e}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["中指から順に、起電力・磁界・運動（起・磁・力）", String(fg) + "は" + String(good)], chk: {form: "u22s5finger", p: {k: k}}};
  }
  throw new Error("u22s5finger：条件に合う数字が見つからない");
}
function tbU22s5_Qprop(r){
  var gcd = tbU22s5_gcd, ratio = tbU22s5_ratio, par = tbU22s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var m = pick(r, [2,3,4]);
    var what = (k == 1 ? '磁束密度' : (k == 2 ? '導体棒の長さ' : '導体棒の速さ'));
    var m2 = (m * m);
    var _c = choices(r, [{t: "$" + fmt(m) + "$ 倍", v: "good"}, {t: "$\\dfrac{1}{" + fmt(m) + "}$ 倍", v: "inv", why: "$e = Blv$ は" + String(what) + "に比例する"}, {t: "$" + fmt(m2) + "$ 倍", v: "sq", why: "$e = Blv$ に2乗は無い"}, {t: "$1$ 倍（変わらない）", v: "one", why: "$e = Blv$ は" + String(what) + "に比例する"}]);
    return {form: "u22s5prop", text: "ほかは変えずに、" + String(what) + "だけを " + fmt(m) + " 倍にした。誘導起電力は元の何倍になるか。", fig: {kind: "u22s5rl", L: tbU22s5_fig({"b":"{B}","bs":"back","rod":"","l":"{l}","v":"{v}","va":"right","e":"{e}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = B l v$ は、磁束密度・長さ・速さに比例する", "誘導起電力は $" + fmt(m) + "$ 倍"], chk: {form: "u22s5prop", p: {k: k, m: m}}};
  }
  throw new Error("u22s5prop：条件に合う数字が見つからない");
}
// 22-6 斜めに動かす の練習（※ textbook/gen/make_section.py が textbook/gen/data/u22_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU22s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU22s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU22s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU22s6_par(a, b){ return a * b / (a + b); }
function tbU22s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU22s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU22s6_Qe(r){
  var gcd = tbU22s6_gcd, ratio = tbU22s6_ratio, par = tbU22s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var b = pick(r, [0.1,0.2,0.4,0.5,0.8,1,1.2,1.5,2]);
    var l = pick(r, [0.1,0.2,0.4,0.5,0.6,0.8,1]);
    var v = pick(r, [2,4,5,6,8,10,12,20]);
    var E = (b * l * v / 2);
    if (!(nice(E) && E >= 0.1 && nice(b * l / 2) && nice(l * v / 2) && nice(2 * b * l * v) && b != l)) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU22s6_three(ok, [{x: (b * l * v), why: "$\\sin\\theta$ を掛けていない（磁束と垂直な成分だけが効く）"}, {x: (2 * b * l * v), why: "$\\sin\\theta$ で割った"}, {x: (b * l / 2), why: "速さを掛けていない"}, {x: (l * v / 2), why: "磁束密度を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u22s6e", text: "磁束密度 $" + fmt(b) + "\\,\\mathrm{T}$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体を、磁束の向きと $30^\\circ$ の向きに速さ $" + fmt(v) + "\\,\\mathrm{m/s}$ で動かした。導体に生じる誘導起電力は何 V か。ただし $\\sin 30^\\circ = \\dfrac{1}{2}$ とする。", fig: {kind: "u22s6rc", L: tbU22s6_fig({"b":"{B}","ba":"right","c":"","v":"{v}","vang":"30","th":"{θ}"}, [["b", "{B}=" + fmt(b) + " T"], ["v", "{v}=" + fmt(v) + " m/s"], ["th", "30°"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = B l v \\sin\\theta$", "$e = " + fmt(b) + " \\times " + fmt(l) + " \\times " + fmt(v) + " \\times \\dfrac{1}{2} = " + qv(ok, "V") + "$"], chk: {form: "u22s6e", p: {b: b, l: l, v: v}}};
  }
  throw new Error("u22s6e：条件に合う数字が見つからない");
}
function tbU22s6_Qang(r){
  var gcd = tbU22s6_gcd, ratio = tbU22s6_ratio, par = tbU22s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$30^\\circ$", v: "own"}, {t: "$60^\\circ$", v: "60", why: "$\\theta$ は磁束の向きから測った角度。$60^\\circ$ は垂直な線からの角度"}, {t: "$90^\\circ$", v: "90", why: "$90^\\circ$ は、磁束と直角に動かしたとき"}, {t: "$0^\\circ$", v: "0", why: "$0^\\circ$ は、磁束と同じ向きに動かしたとき"}]);
    return {form: "u22s6ang", text: "図のように、導体を、磁束と垂直な線から $60^\\circ$ かたむいた向きに動かした。$e = Blv\\sin\\theta$ の $\\theta$ に入れる角度はどれか。", fig: {kind: "u22s6rc", L: tbU22s6_fig({"b":"{B}","ba":"right","c":"","v":"{v}","vang":"30","th":"{θ}"}, [["th", "{θ}"], ["thp", "60°"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\theta$ は、磁束の向きと動かす向きの間の角度", "$\\theta = 90^\\circ - 60^\\circ = 30^\\circ$"], chk: {form: "u22s6ang", p: {}}};
  }
  throw new Error("u22s6ang：条件に合う数字が見つからない");
}
function tbU22s6_Qcomp(r){
  var gcd = tbU22s6_gcd, ratio = tbU22s6_ratio, par = tbU22s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "磁束の向きと垂直な成分", v: "own"}, {t: "磁束の向きと同じ向きの成分", v: "par", why: "磁束と同じ向きに動いても、起電力は生じない"}, {t: "速さの全部", v: "all", why: "効くのは、磁束と垂直な成分だけ"}, {t: "速さの半分", v: "half", why: "半分になるのは $30^\\circ$ のときだけ。効くのは磁束と垂直な成分"}]);
    return {form: "u22s6comp", text: "導体を磁束の向きと斜めに動かしたとき、起電力に関係するのは、速さのうち □ である。", fig: {kind: "u22s6rc", L: tbU22s6_fig({"b":"{B}","ba":"right","c":"","v":"{v}","vang":"30","th":"{θ}"}, [["vs", ""], ["vp", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["起電力に関係するのは、磁束の向きと垂直な成分 $v \\sin\\theta$", "$e = B l v \\sin\\theta$"], chk: {form: "u22s6comp", p: {}}};
  }
  throw new Error("u22s6comp：条件に合う数字が見つからない");
}
function tbU22s6_Qhand(r){
  var gcd = tbU22s6_gcd, ratio = tbU22s6_ratio, par = tbU22s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var what = (k == 1 ? '磁界の中の導体に電流を流したときに働く力の向き' : '磁界の中で導体を動かしたときに生じる起電力の向き');
    var good = (k == 1 ? 'フレミングの左手の法則' : 'フレミングの右手の法則');
    var bad = (k == 1 ? 'フレミングの右手の法則' : 'フレミングの左手の法則');
    var why = (k == 1 ? '右手は、動かして起電力を得るとき（運動から電気）' : '左手は、電流を流して力を得るとき（電気から運動）');
    var rule = (k == 1 ? '電気から運動を得るので、左手' : '運動から電気を得るので、右手');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "右ねじの法則", v: "rs", why: "右ねじの法則は、電流がつくる磁界の向き"}, {t: "ファラデーの法則", v: "fa", why: "ファラデーの法則は、誘導起電力の大きさの式"}]);
    return {form: "u22s6hand", text: String(what) + "を求めるのに使うのはどれか。", fig: {kind: "u22s6rc", L: tbU22s6_fig({"b":"{B}","ba":"right","c":"","v":"{v}","vang":"30","th":"{θ}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), "使うのは" + String(good)], chk: {form: "u22s6hand", p: {k: k}}};
  }
  throw new Error("u22s6hand：条件に合う数字が見つからない");
}
function tbU22s6_Qpair(r){
  var gcd = tbU22s6_gcd, ratio = tbU22s6_ratio, par = tbU22s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var what = (k == 1 ? '導体を動かして起電力を得る' : '導体に電流を流して力を得る');
    var good = (k == 1 ? 'e = Blv\\sin\\theta' : 'F = BIl\\sin\\theta');
    var bad = (k == 1 ? 'F = BIl\\sin\\theta' : 'e = Blv\\sin\\theta');
    var why = (k == 1 ? 'それは電流を流して力を得るとき（電磁力）の式' : 'それは導体を動かして起電力を得るとき（電磁誘導）の式');
    var _c = choices(r, [{t: "$" + String(good) + "$", v: "good"}, {t: "$" + String(bad) + "$", v: "bad", why: String(why)}, {t: "$e = N \\dfrac{\\Delta t}{\\Delta \\Phi}$", v: "fa", why: "ファラデーの法則は $\\dfrac{\\Delta \\Phi}{\\Delta t}$（時間で割る）"}, {t: "$\\Phi = BS$", v: "bs", why: "それは磁束と磁束密度の関係"}]);
    return {form: "u22s6pair", text: String(what) + "ときの式はどれか。", fig: {kind: "u22s6rc", L: tbU22s6_fig({"b":"{B}","ba":"right","c":"","v":"{v}","vang":"30","th":"{θ}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電磁力は $F = BIl\\sin\\theta$、電磁誘導は $e = Blv\\sin\\theta$", "答えは $" + String(good) + "$"], chk: {form: "u22s6pair", p: {k: k}}};
  }
  throw new Error("u22s6pair：条件に合う数字が見つからない");
}
var GEN = {
  // 22-1 電磁誘導
  1: function(r){ return pick(r, [tbU22s1_Qmake, tbU22s1_Qmake, tbU22s1_Qmake, tbU22s1_Qchg, tbU22s1_Qchg, tbU22s1_Qdef, tbU22s1_Qword, tbU22s1_Qname])(r); },
  // 22-2 誘導電流の向き
  2: function(r){ return pick(r, [tbU22s2_Qflux, tbU22s2_Qflux, tbU22s2_Qflux, tbU22s2_Qcur, tbU22s2_Qcur, tbU22s2_Qcur, tbU22s2_Qrail, tbU22s2_Qrail, tbU22s2_Qrule])(r); },
  // 22-3 ファラデーの法則
  3: function(r){ return pick(r, [tbU22s3_Qe, tbU22s3_Qe, tbU22s3_Qe, tbU22s3_Qdphi, tbU22s3_Qdphi, tbU22s3_Qn, tbU22s3_Qn, tbU22s3_Qtimes, tbU22s3_Qsign])(r); },
  // 22-4 磁束のグラフと起電力
  4: function(r){ return pick(r, [tbU22s4_Qrise, tbU22s4_Qrise, tbU22s4_Qrise, tbU22s4_Qflat, tbU22s4_Qflat, tbU22s4_Qfall, tbU22s4_Qfall, tbU22s4_Qcmp, tbU22s4_Qstop])(r); },
  // 22-5 導体棒
  5: function(r){ return pick(r, [tbU22s5_Qe, tbU22s5_Qe, tbU22s5_Qe, tbU22s5_Qv, tbU22s5_Qv, tbU22s5_Qdir, tbU22s5_Qdir, tbU22s5_Qfinger, tbU22s5_Qprop])(r); },
  // 22-6 斜めに動かす
  6: function(r){ return pick(r, [tbU22s6_Qe, tbU22s6_Qe, tbU22s6_Qe, tbU22s6_Qang, tbU22s6_Qang, tbU22s6_Qcomp, tbU22s6_Qhand, tbU22s6_Qhand, tbU22s6_Qpair])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t22s1e","scene":"t22s1e","kind":"u22s1cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":"","goa":["in","out"],"ip":"","ipa":["left","right"],"i":"","ia":["ccw","cw"]},"viewbox":"126 148 788 544","band":{"want":"コイルに鎖交する磁束が変わると何が起きるか","ans":"変化を妨げる向きに起電力が生じる（電磁誘導）","full":"磁束がコイルの中を通ることを鎖交という。コイルに鎖交する磁束が変わると、コイルはその変化を妨げる向きに起電力を生じる。これを電磁誘導という。流れる電流を誘導電流、それを流す起電力を誘導起電力という。"},"narr":{"start":{"co":1,"pos":0,"ipd":0,"id":0,"goav":0,"ipav":0,"iav":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"①鎖交する磁束\n②磁石を近づける\n③磁石を遠ざける\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"電磁力は、電流を流して力を得ました。今度はその逆で、動かして電気を得ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Mg","Cl"]},{"text":"磁石の N 極から、磁束が出ています。","at":{"強調":1.0},"after":[],"emph":["Mg","Ph"]},{"text":"磁束がコイルの中を通ることを、〖コイルに鎖交する〗といいます。鎖交は、交わるという意味です。","at":{"強調":1.0},"after":[],"emph":["Ph","Cl"]},{"text":"今、コイルに鎖交している磁束は1本です。","at":{"強調":1.0},"after":[],"emph":["Ph","Cl"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"磁石の N 極を、コイルに近づけます。鎖交する磁束は3本に増えます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"near","emph":["Mg","Go","Ph"]},{"text":"コイルは、〖磁束が増えるのを妨げる向き〗に、磁束をつくろうとします。磁石の磁束と逆向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ip","emph":["Ip","Ph"]},{"text":"その磁束をつくるように、コイルに電流が流れます。この電流を誘導電流といいます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i","emph":["I","Cl"]},{"text":"誘導電流を流す起電力を、誘導起電力といいます。","at":{"強調":1.0},"after":[],"emph":["I","Cl"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"反対に、磁石を遠ざけると、鎖交する磁束は減ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"far","emph":["Mg","Go","Ph"]},{"text":"コイルは、減るのを妨げる向き、つまり増やす向きに磁束をつくろうとします。誘導電流も逆向きです。","at":{"強調":1.0},"after":[],"emph":["Ip","I"]},{"text":"鎖交する磁束が変わると、その変化を妨げる向きに起電力が生じます。これを〖電磁誘導〗といいます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Cl","Ph","Ip"],"ans":true}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{"near":{"to":{"pos":1},"dur":1.0},"ip":{"to":{"ipd":1},"dur":0.6},"i":{"to":{"id":1},"dur":0.6},"far":{"to":{"pos":0,"goav":1,"ipav":1,"iav":1},"dur":1.0}},"route":["鎖交する磁束","磁石を近づける","磁石を遠ざける"]}},{"id":"t22s1x","scene":"t22s1x","kind":"u22s1cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":"","goa":"out","ip":"","ipa":"right"},"viewbox":"126 148 788 544","band":{"want":"遠ざけたときにコイルがつくろうとする磁束","ans":"磁石の磁束と同じ向き（減るのを妨げる向き）"},"narr":{"start":{"co":1,"pos":1,"ipd":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、N 極を遠ざけたときに、コイルがつくろうとする磁束の向きです。","at":{"強調":1.0},"after":[],"emph":["Mg","Go"]},{"text":"①鎖交する磁束\n②変化を妨げる向き\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"N 極を遠ざけると、コイルに鎖交する磁束は減ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"far","emph":["Ph","Cl"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"コイルは、減るのを妨げる向きに磁束をつくろうとします。減るのを妨げるには、〖増やせばよい〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Cl"]},{"text":"答えは、磁石の磁束と同じ向き（減るのを妨げる向き）です。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"ip","emph":["Ip","Ph"],"ans":true}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{"far":{"to":{"pos":0},"dur":1.0},"ip":{"to":{"ipd":1},"dur":0.6}},"route":["鎖交する磁束","変化を妨げる向き"]}},{"id":"t22s2e","scene":"t22s2e","kind":"u22s2sw","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":"","b":"{B}","bs":"back","rod":"","v":"{v}","va":"right","goa":"in","ip":"","ipa":"left","i":"","ia":"ccw","ir":"","ira":"ccw","ipr":"","ipra":"front"},"viewbox":"126 147 868 545","band":{"want":"誘導電流の向き","ans":"つくりたい磁束の向きに右手の親指を向け、4本の指の巻く向き","full":"コイルがつくろうとする磁束の向きに右手の親指を向けると、4本の指の巻く向きが誘導電流の向き（右ねじの法則）。囲む面積が変わって鎖交する磁束が変わるときも同じ。"},"narr":{"start":{"co":1,"t":0,"pos":0,"ipd":0,"id":0,"md":0,"dsd":0,"ird":0,"iprd":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"①つくる磁束の向き\n②右ねじの法則\n③面積が変わるとき\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"N 極を近づけると、鎖交する磁束が増えます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"near","emph":["Mg","Go","Ph"]},{"text":"コイルは増えるのを妨げるため、〖磁石の磁束と逆向き〗に磁束をつくろうとします。図では左向きです。","at":{"強調":1.0},"after":[],"emph":["Ip"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"電流の向きは、右ねじの法則で考えます。右手の親指を、つくりたい磁束の向きに向けます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ip"]},{"text":"4本の指の巻く向きが、〖誘導電流の向き〗です。磁石の側から見ると、反時計回りです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i","emph":["I","Cl"]},{"text":"遠ざけるときは、つくる磁束が右向きになり、電流は時計回りになります。","at":{"強調":1.0},"after":[],"emph":["Ip","I"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"上から見た図です。奥向きの磁束を × で表します。その中に、レールと導体棒を置きます。全体が1回巻きのコイルです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"sw","emph":["B","Rod"]},{"text":"導体棒を右に動かすと、囲む面積が増えます。鎖交する磁束も増えます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"md","emph":["Rod","V","Ds"]},{"text":"コイルは、〖増えるのを妨げる〗向きに磁束をつくろうとします。向きは手前です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ipr","emph":["Ipr","B"]},{"text":"親指を手前に向けると、4本の指は上から見て反時計回りです。これが誘導電流の向きです。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"ir","emph":["Ir","Ipr"],"ans":true}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1","eax1","eax1:h","etx10","etx11"],"Ds":["dsfx1"],"B":["bs0x1","bs1x1","bs2x1","btx10","btx11"],"Rod":["rodx1","rodtx10","rodtx11"],"L":["ldx1","ldx1:h","ldx1:h2","ltx10","ltx11"],"V":["vax1","vax1:h","vtx10","vtx11"],"Dx":["dxe1x1","dxe2x1","dxdx1","dxdx1:h","dxdx1:h2","dxtx10","dxtx11"],"Ir":["irh0x1","irh0x1:h","irh1x1","irh1x1:h","irh2x1","irh2x1:h"],"Ipr":["iprcx1","iprcx1:t"]},"moves":{"near":{"to":{"pos":1,"ipd":1},"dur":1.0},"i":{"to":{"id":1},"dur":0.6},"sw":{"to":{"t":1},"dur":0.6},"md":{"to":{"md":1,"dsd":1},"dur":1.0},"ipr":{"to":{"iprd":1},"dur":0.6},"ir":{"to":{"ird":1},"dur":0.6}},"route":["つくる磁束の向き","右ねじの法則","面積が変わるとき"]}},{"id":"t22s2x","scene":"t22s2x","kind":"u22s2rl","lab":{"b":"{B}","bs":"front","rod":"","v":"{v}","va":"right","ir":"","ira":"cw","ipr":"","ipra":"back"},"viewbox":"186 148 808 518","band":{"want":"導体棒を右に動かしたときの誘導電流の向き","ans":"上から見て時計回り"},"narr":{"start":{"co":1,"md":0,"dsd":0,"ird":0,"iprd":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、導体棒を右に動かしたときの、誘導電流の向きです。","at":{"強調":1.0},"after":[],"emph":["Rod","V"]},{"text":"①鎖交する磁束\n②つくる磁束\n③右ねじの法則\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"導体棒を右に動かすと、囲む面積が増えます。手前向き（・）の鎖交する磁束が増えます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"md","emph":["Ds","B"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"コイルは、〖増えるのを妨げる〗向きに磁束をつくろうとします。向きは奥です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"ipr","emph":["Ipr"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"右手の親指を奥に向けると、4本の指は上から見て時計回りに巻きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"ir","emph":["Ir","Ipr"]},{"text":"答えは、上から見て時計回りです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Ir"],"ans":true}]}],"groups":{"Ds":["dsf"],"B":["bs0","bs1","bs2","bt0","bt1"],"Rod":["rod","rodt0","rodt1"],"L":["ld","ld:h","ld:h2","lt0","lt1"],"V":["va","va:h","vt0","vt1"],"Dx":["dxe1","dxe2","dxd","dxd:h","dxd:h2","dxt0","dxt1"],"E":["ea","ea:h","et0","et1"],"Ir":["irh0","irh0:h","irh1","irh1:h","irh2","irh2:h"],"Ipr":["iprc","iprc:t"]},"moves":{"md":{"to":{"md":1,"dsd":1},"dur":1.0},"ipr":{"to":{"iprd":1},"dur":0.6},"ir":{"to":{"ird":1},"dur":0.6}},"route":["鎖交する磁束","つくる磁束","右ねじの法則"]}},{"id":"t22s3e","scene":"t22s3e","kind":"u22s3cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"},"viewbox":"126 148 851 544","band":{"want":"誘導起電力の大きさ","ans":"$e = -N \\dfrac{\\Delta \\Phi}{\\Delta t}$（大きさはマイナスを外す）","full":"誘導起電力の大きさはファラデーの法則で表す。e は誘導起電力［V］、N は巻数、ΔΦ は Δt の間に変わった磁束。マイナスは変化を妨げる向きに生じることを表す。大きさを求めるときはマイナスを外す。"},"narr":{"start":{"co":1,"pos":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"①式\n②巻数と変化の割合\n③マイナスの意味\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"誘導起電力の大きさは、〖ファラデーの法則〗で表します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"near","emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = -N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"emphPre":["E","Cl","Ph"]},{"text":"$e$ は誘導起電力で、単位は V です。$N$ はコイルの巻数です。","at":{"強調":1.0},"after":[],"emph":["E","N"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"$\\Delta t$ は、ある時間の間という意味です。$\\Delta \\Phi$ は、その間に変わった磁束です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ph"]},{"text":"$\\dfrac{\\Delta \\Phi}{\\Delta t}$ は、〖決まった時間に磁束がどれだけ変わるか〗を表します。たとえば 2 s の間に 6 Wb 変われば $3$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Ph"],"eq":[{"cont":false,"items":[["\\dfrac{\\Delta \\Phi}{\\Delta t} = \\dfrac{6}{2} = 3"]]}],"emphPre":["Ph"]},{"text":"巻数が多いほど、また、短い時間で大きく変わるほど、誘導起電力は大きくなります。","at":{"強調":1.0},"after":[],"emph":["N","Ph","E"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"マイナスは、磁束の変化と逆向き、つまり〖変化を妨げる向き〗に起電力が生じることを表します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["E"]},{"text":"向きは電磁誘導の決まりで分かります。大きさを求めるときは、マイナスを外して計算します。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"ans":true,"emphPre":["E","N","Ph"]}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{"near":{"to":{"pos":1},"dur":1.0}},"route":["式","巻数と変化の割合","マイナスの意味"]}},{"id":"t22s3x","scene":"t22s3x","kind":"u22s3cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}=50","e":["{e}","{e}=10 V"]},"viewbox":"126 148 851 544","band":{"want":"誘導起電力の大きさ $e$","known":"$N = 50,\\;\\; \\Delta \\Phi = 0.04\\,\\mathrm{Wb},\\;\\; \\Delta t = 0.2\\,\\mathrm{s}$","ans":"$e = 10\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pos":1,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、誘導起電力の大きさ $e$ です。","at":{"強調":1.0},"after":[],"emph":["E"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"大きさを求めるので、ファラデーの法則の〖マイナスを外し〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"emphPre":["E","N","Ph"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"$N = 50$、$\\Delta \\Phi = 0.04$、$\\Delta t = 0.2$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = 50 \\times \\dfrac{0.04}{0.2}"],["= 50 \\times 0.2 = 10\\,\\mathrm{V}"]]}],"move":"ev","ans":true,"emphPre":["N","Ph"]}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{"ev":{"to":{"ev":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t22s4e","scene":"t22s4e","kind":"u22s4fg","lab":{"sh":"rise_flat","n":"{N}=1","t1":"0.3","t2":"0.6","p1":"6","e1":"20 V","e2":"0 V"},"viewbox":"104 27 750 812","band":{"want":"磁束のグラフから誘導起電力を読む","ans":"誘導起電力は磁束のグラフの傾き（変わらない区間は 0 V）","full":"傾きが一定の区間は誘導起電力も一定で、大きさは N × ΔΦ/Δt。磁束が変わらない区間は 0 V。誘導起電力のグラフは磁束のグラフの傾きを表し、傾きが大きいほど大きい。"},"narr":{"start":{"co":1,"tri1d":0,"tri2d":0,"e1d":0,"e2d":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"①傾きを読む\n②傾きが一定の区間\n③変わらない区間\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"1回巻きのコイルに鎖交する磁束が、上のグラフのように変わります。下に、誘導起電力のグラフをかきます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["G","N"]},{"text":"誘導起電力は、決まった時間に磁束がどれだけ変わるかで決まります。グラフでは、〖線の傾き〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["G","N"],"eq":[{"cont":false,"items":[["e = N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"emphPre":["G","N"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"0 s から 0.3 s までは、傾きが一定です。なので、〖誘導起電力も一定〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"tri1","emph":["S1","Tri1"]},{"text":"この間に、磁束は 6 Wb 変わります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["E1"],"eq":[{"cont":false,"items":[["e = 1 \\times \\dfrac{6}{0.3} = 20\\,\\mathrm{V}"]]}],"move":"e1","emphPre":["Tri1","T1","P1"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"0.3 s から後は、磁束が 6 Wb のまま変わりません。$\\Delta \\Phi = 0$ なので、〖誘導起電力は 0 V〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"e2","emph":["S2","E2"]},{"text":"磁石を動かしている間だけ起電力が生じ、止めると生じないのと同じです。","at":{"強調":1.0},"after":[],"emph":["E1","E2"]},{"text":"誘導起電力のグラフは、磁束のグラフの傾きを表します。傾きが大きいほど、起電力は大きくなります。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["G","E1","E2"],"ans":true}]}],"groups":{"Ax":["axu","axu:h","ayu","ayu:h","alu","atu","ou","axd","axd:h","ayd","ayd:h","ald","atd","od"],"G":["g1","g2"],"S1":["g1"],"S2":["g2"],"T1":["t1g","t1g2","t1t0","t1t1"],"T2":["t2g","t2g2","t2t0","t2t1"],"P1":["p1g","p1t0","p1t1"],"Tri1":["tri1"],"Tri2":["tri2"],"E1":["e1l","e1t0","e1t1"],"E2":["e2l","e2t0","e2t1"],"N":["nt0","nt1"]},"moves":{"tri1":{"to":{"tri1d":1},"dur":0.6},"e1":{"to":{"e1d":1},"dur":0.8},"e2":{"to":{"e2d":1},"dur":0.8}},"route":["傾きを読む","傾きが一定の区間","変わらない区間"]}},{"id":"t22s4x","scene":"t22s4x","kind":"u22s4fg","lab":{"sh":"rise_fall","n":"{N}=2","t1":"0.2","t2":"0.5","p1":"0.6","e2":["{e}","4 V"]},"viewbox":"104 27 750 812","band":{"want":"0.2 s から 0.5 s までの誘導起電力の大きさ","known":"$N = 2$","ans":"$e = 4\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"tri2d":0,"e2d":0,"e2v":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、0.2 s から 0.5 s までの誘導起電力の大きさです。","at":{"強調":1.0},"after":[],"emph":["S2"]},{"text":"①傾きを読む\n②式に入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"この区間は、磁束が 0.6 Wb から 0 まで、一定の割合で減ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"tri2","emph":["S2","Tri2","P1"]},{"text":"変わった磁束は 0.6 Wb、時間は $0.5 - 0.2 = 0.3\\,\\mathrm{s}$ です。〖減るときも〗、磁束が変わるので起電力が生じます。","at":{"強調":1.0},"after":[],"emph":["Tri2","T1","T2"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"巻数 2 と合わせて、式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["E2","N","Tri2"],"eq":[{"cont":false,"items":[["e = 2 \\times \\dfrac{0.6}{0.3} = 4\\,\\mathrm{V}"]]}],"move":"e2","ans":true,"emphPre":["N","Tri2"]}]}],"groups":{"Ax":["axu","axu:h","ayu","ayu:h","alu","atu","ou","axd","axd:h","ayd","ayd:h","ald","atd","od"],"G":["g1","g2"],"S1":["g1"],"S2":["g2"],"T1":["t1g","t1g2","t1t0","t1t1"],"T2":["t2g","t2g2","t2t0","t2t1"],"P1":["p1g","p1t0","p1t1"],"Tri1":["tri1"],"Tri2":["tri2"],"E1":["e1l","e1t0","e1t1"],"E2":["e2l","e2t0","e2t1"],"N":["nt0","nt1"]},"moves":{"tri2":{"to":{"tri2d":1},"dur":0.6},"e2":{"to":{"e2d":1,"e2v":1},"dur":0.8}},"route":["傾きを読む","式に入れる"]}},{"id":"t22s5e","scene":"t22s5e","kind":"u22s5sw","lab":{"b":"{B}","bs":"back","rod":"","l":"{l}","v":"{v}","va":"right","e":"{e}","dx":"{v}Δ{t}","ds":"","hand":"右手","f1":"運動","f1a":"right","fn1":"親指","f2":"磁界","f2a":"back","fn2":"人差し指","f3":"起電力","f3a":"up","fn3":"中指"},"viewbox":"123 85 1063 703","band":{"want":"導体棒を動かしたときの誘導起電力","ans":"$e = Blv$、向きはフレミングの右手の法則","full":"Δt の間に面積が l × vΔt 増え、ΔΦ = BlvΔt。ファラデーの法則に N = 1 で入れて e = Blv。向きはフレミングの右手の法則：中指＝起電力・人差し指＝磁界・親指＝運動。"},"narr":{"start":{"co":1,"t":0,"md":0,"dsd":0,"f1d":0,"f2d":0,"f3d":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"①増える磁束\n②$e = Blv$\n③フレミングの右手の法則\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["B"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"磁束密度 $B$ の磁界の中で、長さ $l$ の導体棒を、速さ $v$ で右に動かします。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["B","Rod","L","V"]},{"text":"$\\Delta t$ の間に、導体棒は $v \\Delta t$ 進みます。囲む面積は、縦 $l$、横 $v \\Delta t$ の分だけ増えます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"md","emph":["Ds","Dx","L"],"eq":[{"cont":false,"items":[["\\Delta S = l v \\Delta t"]]}],"emphPre":["Ds","Dx","L"]},{"text":"$\\Phi = BS$ なので、増えた磁束は、磁束密度に増えた面積を掛けた物です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["B","Ds"],"eq":[{"cont":false,"items":[["\\Delta \\Phi = B l v \\Delta t"]]}],"emphPre":["B","Ds"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"導体棒とレールは、〖1回巻きのコイル〗です。ファラデーの法則に $N = 1$ で入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E","B","L","V"],"eq":[{"cont":false,"items":[["e = \\dfrac{\\Delta \\Phi}{\\Delta t} = \\dfrac{B l v \\Delta t}{\\Delta t}"],["e = B l v"]]}],"emphPre":["Rod","E","B","L","V"]},{"text":"$\\Delta t$ は約分で消えます。誘導起電力は、〖磁束密度・導体の長さ・速さに比例〗します。","at":{"強調":1.0},"after":[],"emph":["E","B","L","V"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"起電力の向きは、フレミングの右手の法則で求められます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"sw","emph":["Hand"]},{"text":"右手の親指・人差し指・中指を、互いに直角に開きます。親指が運動、人差し指が磁界、中指が起電力の向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f","emph":["F1","F2","F3"]},{"text":"中指から順に、〖起電力・磁界・運動〗で「起・磁・力」と覚えます。中指は、電流の向きと考えてもよいです。","at":{"強調":1.0},"after":[],"emph":["F3","F2","F1"]},{"text":"右へ動かし、磁界が奥向きなら、中指は図の上を向きます。導体棒には、図の上向きに起電力が生じます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["F1","F2","F3"],"ans":true}]}],"groups":{"Ds":["dsf"],"B":["bs0","bs1","bs2","bt0","bt1"],"Rod":["rod","rodt0","rodt1"],"L":["ld","ld:h","ld:h2","lt0","lt1"],"V":["va","va:h","vt0","vt1"],"Dx":["dxe1","dxe2","dxd","dxd:h","dxd:h2","dxt0","dxt1"],"E":["ea","ea:h","et0","et1"],"Ir":["irh0","irh0:h","irh1","irh1:h","irh2","irh2:h"],"Ipr":["iprc","iprc:t"],"Hand":["handtx10","handtx11"],"F1":["fa1x1","fa1x1:h","f1tx10","f1tx11","fn1tx10","fn1tx11"],"F2":["fa2x1","fa2x1:h","f2tx10","f2tx11","fn2tx10","fn2tx11","fs2backx1","fs2backx1:t"],"F3":["fa3x1","fa3x1:h","f3tx10","f3tx11","fn3tx10","fn3tx11"]},"moves":{"md":{"to":{"md":1,"dsd":1},"dur":1.0},"sw":{"to":{"t":1},"dur":0.6},"f":{"to":{"f1d":1,"f2d":1,"f3d":1},"dur":1.0}},"route":["増える磁束","$e = Blv$","フレミングの右手の法則"]}},{"id":"t22s5x","scene":"t22s5x","kind":"u22s5rl","lab":{"b":"{B}=0.5 T","bs":"back","rod":"","l":"{l}=0.4 m","v":"{v}=10 m/s","va":"right","e":["{e}","{e}=2 V"]},"viewbox":"125 147 1060 641","band":{"want":"誘導起電力 $e$","known":"$B = 0.5\\,\\mathrm{T},\\;\\; l = 0.4\\,\\mathrm{m},\\;\\; v = 10\\,\\mathrm{m/s}$","ans":"$e = 2\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"md":0,"dsd":0,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、導体棒に生じる誘導起電力 $e$ です。","at":{"強調":1.0},"after":[],"emph":["E","Rod"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"導体棒を動かしたときの誘導起電力は、〖磁束密度・長さ・速さの積〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"md","emph":["E","B","L","V"],"eq":[{"cont":false,"items":[["e = B l v"]]}],"emphPre":["E","B","L","V"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"$B = 0.5$、$l = 0.4$、$v = 10$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["E","B","L","V"],"eq":[{"cont":false,"items":[["e = 0.5 \\times 0.4 \\times 10 = 2\\,\\mathrm{V}"]]}],"move":"ev","ans":true,"emphPre":["B","L","V"]}]}],"groups":{"Ds":["dsf"],"B":["bs0","bs1","bs2","bt0","bt1"],"Rod":["rod","rodt0","rodt1"],"L":["ld","ld:h","ld:h2","lt0","lt1"],"V":["va","va:h","vt0","vt1"],"Dx":["dxe1","dxe2","dxd","dxd:h","dxd:h2","dxt0","dxt1"],"E":["ea","ea:h","et0","et1"],"Ir":["irh0","irh0:h","irh1","irh1:h","irh2","irh2:h"],"Ipr":["iprc","iprc:t"]},"moves":{"md":{"to":{"md":1},"dur":0.8},"ev":{"to":{"ev":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t22s6e","scene":"t22s6e","kind":"u22s6rc","lab":{"b":"{B}","ba":"right","c":"","v":"{v}","vang":["90","30"],"th":"{θ}","vs":"{v} sin{θ}","thp":""},"viewbox":"106 118 792 534","band":{"want":"斜めに動かしたときの誘導起電力","ans":"$e = Blv\\sin\\theta$（磁束と垂直な成分だけが効く）","full":"導体を磁束の向きと θ の角度で動かすと、起電力に関係するのは磁束の向きと垂直な成分 v sinθ だけ。e = Blv sinθ。電流を流して力を得るときは左手で F = BIl sinθ、動かして起電力を得るときは右手で e = Blv sinθ。"},"narr":{"start":{"co":1,"vangv":0,"vsd":0,"thpd":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"①垂直な成分\n②$e = Blv\\sin\\theta$\n③左手と右手\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["B"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"これまでは、導体を磁束の向きと直角に動かしました。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["B","V","C"]},{"text":"今度は、磁束の向きと $\\theta$ の角度で、斜めに動かします。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"tilt","emph":["V","Th","B"]},{"text":"起電力に関係するのは、速さのうち、〖磁束の向きと垂直な成分〗だけです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"vs","emph":["Vs","B"]},{"text":"垂直な成分は、$v \\sin\\theta$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Vs","Th"],"eq":[{"cont":false,"items":[["v \\sin\\theta"]]}],"emphPre":["Vs","Th"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"$e = Blv$ の $v$ を、垂直な成分に置き換えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Vs","B","Th"],"eq":[{"cont":false,"items":[["e = B l v \\sin\\theta"]]}],"emphPre":["Vs","B"]},{"text":"式だけを覚えず、磁束と垂直な成分が効く、と覚えます。","at":{"強調":1.0},"after":[],"emph":["Vs"]},{"text":"角度が、〖磁束と垂直な線から〗測ってあることもあります。その角度をそのまま $\\theta$ に入れると間違えます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"thp","emph":["Thp","Th"]}]},{"cap":null,"eqp":null,"vid":[32,33],"sents":[{"text":"電磁力と比べます。電流を流して力を得るときは、フレミングの左手の法則で、$F = BIl\\sin\\theta$ でした。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["B","C"],"eq":[{"cont":false,"items":[["F = B I l \\sin\\theta"]]}],"emphPre":["B","C"]},{"text":"導体を動かして起電力を得るときは、〖フレミングの右手の法則〗で、$e = Blv\\sin\\theta$ です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["B","V","C"],"eq":[{"cont":false,"items":[["F = B I l \\sin\\theta","e = B l v \\sin\\theta"]]}],"ans":true,"emphPre":["B","V","C"]}]}],"groups":{"B":["bl0","blh0","blh0:h","bl1","blh1","blh1:h","bl2","blh2","blh2:h","bt0","bt1"],"C":["cc","cc:t","ct0","ct1"],"V":["va","va:h","vt0","vt1"],"Th":["tha","tht0","tht1"],"Thp":["vln","thpa","thpt0","thpt1"],"Vs":["vsa","vsa:h","vst0","vst1"],"Vp":["vpa","vpa:h","vpt0","vpt1"]},"moves":{"tilt":{"to":{"vangv":1},"dur":0.8},"vs":{"to":{"vsd":1},"dur":0.6},"thp":{"to":{"thpd":1},"dur":0.6}},"route":["垂直な成分","$e = Blv\\sin\\theta$","左手と右手"]}},{"id":"t22s6x","scene":"t22s6x","kind":"u22s6rc","lab":{"b":"{B}=0.4 T","ba":"right","c":"","v":"{v}=10 m/s","vang":"30","th":"{θ}=30°","vs":""},"viewbox":"106 118 792 534","band":{"want":"誘導起電力 $e$","known":"$B = 0.4\\,\\mathrm{T},\\;\\; l = 0.5\\,\\mathrm{m},\\;\\; v = 10\\,\\mathrm{m/s},\\;\\; \\theta = 30^\\circ$","ans":"$e = 1\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"vsd":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、斜めに動かした導体に生じる誘導起電力 $e$ です。","at":{"強調":1.0},"after":[],"emph":["C","V"]},{"text":"①垂直な成分\n②式に入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"起電力に関係するのは、〖磁束の向きと垂直な成分〗 $v \\sin 30^\\circ$ だけです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"vs","emph":["Vs","Th"],"eq":[{"cont":false,"items":[["v \\sin 30^\\circ = 10 \\times \\dfrac{1}{2} = 5"]]}],"emphPre":["Vs","Th"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"$e = Blv\\sin\\theta$ に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["B","Vs","Th"],"eq":[{"cont":false,"items":[["e = B l v \\sin\\theta"],["e = 0.4 \\times 0.5 \\times 10 \\times \\dfrac{1}{2}","= 1\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["B","Vs"]}]}],"groups":{"B":["bl0","blh0","blh0:h","bl1","blh1","blh1:h","bl2","blh2","blh2:h","bt0","bt1"],"C":["cc","cc:t","ct0","ct1"],"V":["va","va:h","vt0","vt1"],"Th":["tha","tht0","tht1"],"Thp":["vln","thpa","thpt0","thpt1"],"Vs":["vsa","vsa:h","vst0","vst1"],"Vp":["vpa","vpa:h","vpt0","vpt1"]},"moves":{"vs":{"to":{"vsd":1},"dur":0.6}},"route":["垂直な成分","式に入れる"]}}],"secs":[{"ex":{"text":"図のように、磁石の N 極をコイルから遠ざけた。コイルがつくろうとする磁束の向きはどれか。","fig":{"kind":"u22s1cm","L":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","go":"","goa":"out"},"P":{}},"ch":[{"t":"磁石の磁束と逆向き（減らす向き）","v":"inv","why":"減らす向きにつくるのは、鎖交する磁束が増えるとき"},{"t":"磁石の磁束と同じ向き（減るのを妨げる向き）","v":"same","why":""},{"t":"磁束はつくらない","v":"none","why":"鎖交する磁束が変わるので、コイルは変化を妨げる磁束をつくろうとする"},{"t":"磁石の動きと同じ向き","v":"go","why":"コイルは、鎖交する磁束の変化を妨げる向きに磁束をつくる"}],"ans":1}},{"ex":{"text":"図のように、手前向き（・）の磁束の中で、レールの上の導体棒を右に動かした。上から見た誘導電流の向きはどれか。","fig":{"kind":"u22s2rl","L":{"b":"{B}","bs":"front","rod":"","v":"{v}","va":"right"},"P":{}},"ch":[{"t":"時計回り","v":"cw","why":""},{"t":"反時計回り","v":"ccw","why":"反時計回りの電流は手前向きの磁束をつくる。それでは増えるのを助けてしまう"},{"t":"導体棒の動きと同じ右向き","v":"r","why":"電流は、閉じた回路を回る向きに流れる"},{"t":"電流は流れない","v":"none","why":"囲む面積が増えて鎖交する磁束が変わるので、電流が流れる"}],"ans":0}},{"ex":{"text":"巻数 50 のコイルに鎖交する磁束が、$0.2\\,\\mathrm{s}$ の間に $0.04\\,\\mathrm{Wb}$ 増えた。誘導起電力の大きさは何 V か。","fig":{"kind":"u22s3cm","L":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}=50","e":"{e}"},"P":{}},"ch":[{"t":"$0.2\\,\\mathrm{V}$","v":0.2,"why":"巻数を掛けていない"},{"t":"$0.4\\,\\mathrm{V}$","v":0.4,"why":"時間で割るところを掛けた"},{"t":"$10\\,\\mathrm{V}$","v":10,"why":""},{"t":"$250\\,\\mathrm{V}$","v":250,"why":"割る順が逆（時間を磁束の変化で割った）"}],"ans":2}},{"ex":{"text":"巻数 2 のコイルに鎖交する磁束が、図のように変わった。$0.2\\,\\mathrm{s}$ から $0.5\\,\\mathrm{s}$ までの誘導起電力の大きさは何 V か。","fig":{"kind":"u22s4fg","L":{"sh":"rise_fall","n":"{N}=2","t1":"0.2","t2":"0.5","p1":"0.6"},"P":{}},"ch":[{"t":"$6\\,\\mathrm{V}$","v":6,"why":"前の区間（0 s から 0.2 s まで）の傾きで計算した"},{"t":"$0\\,\\mathrm{V}$","v":0,"why":"磁束が減る間も変わっているので、起電力が生じる"},{"t":"$4\\,\\mathrm{V}$","v":4,"why":""},{"t":"$0.36\\,\\mathrm{V}$","v":0.36,"why":"時間で割るところを掛けた"}],"ans":2}},{"ex":{"text":"磁束密度 $0.5\\,\\mathrm{T}$ の磁界の中で、長さ $0.4\\,\\mathrm{m}$ の導体棒を、磁界と直角に速さ $10\\,\\mathrm{m/s}$ で動かした。導体棒に生じる誘導起電力は何 V か。","fig":{"kind":"u22s5rl","L":{"b":"{B}=0.5 T","bs":"back","rod":"","l":"{l}=0.4 m","v":"{v}=10 m/s","va":"right","e":"{e}"},"P":{}},"ch":[{"t":"$0.2\\,\\mathrm{V}$","v":0.2,"why":"速さを掛けていない"},{"t":"$2\\,\\mathrm{V}$","v":2,"why":""},{"t":"$5\\,\\mathrm{V}$","v":5,"why":"長さを掛けていない"},{"t":"$8\\,\\mathrm{V}$","v":8,"why":"磁束密度で割った"}],"ans":1}},{"ex":{"text":"磁束密度 $0.4\\,\\mathrm{T}$ の磁界の中で、長さ $0.5\\,\\mathrm{m}$ の導体を、磁束の向きと $30^\\circ$ の向きに速さ $10\\,\\mathrm{m/s}$ で動かした。導体に生じる誘導起電力は何 V か。ただし $\\sin 30^\\circ = \\dfrac{1}{2}$ とする。","fig":{"kind":"u22s6rc","L":{"b":"{B}=0.4 T","ba":"right","c":"","v":"{v}=10 m/s","vang":"30","th":"30°"},"P":{}},"ch":[{"t":"$2\\,\\mathrm{V}$","v":2,"why":"$\\sin\\theta$ を掛けていない（磁束と垂直な成分だけが効く）"},{"t":"$1\\,\\mathrm{V}$","v":1,"why":""},{"t":"$4\\,\\mathrm{V}$","v":4,"why":"$\\sin\\theta$ で割った"},{"t":"$0.1\\,\\mathrm{V}$","v":0.1,"why":"速さを掛けていない"}],"ans":1}}],"past":[]}};
});
