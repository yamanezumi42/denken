/* 単元7「ブリッジ回路」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(7, function(H){
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
// ---- 7-1 ブリッジ回路の形 の図（※ textbook/gen/make_section.py が textbook/gen/data/u07_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U7S1K = {
  br: {"vars":[],"items":[{"t":"w","id":"u7s1brL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw2","pts":[[478,670],[761.5,670]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw4","pts":[[761.5,670],[1045,670]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw5","pts":[[478,360],[478,503]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw6","pts":[[478,527],[478,670]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw7","pts":[[761.5,360],[761.5,407.5]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw8","pts":[[761.5,467.5],[761.5,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw9","pts":[[761.5,515],[761.5,562.5]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw10","pts":[[761.5,622.5],[761.5,670]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw11","pts":[[1045,360],[1045,407.5]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw12","pts":[[1045,467.5],[1045,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw13","pts":[[1045,515],[1045,562.5]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw14","pts":[[1045,622.5],[1045,670]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw15","pts":[[793.25,515],[823.25,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw16","pts":[[823.25,515],[881.25,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw17","pts":[[925.25,515],[983.25,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw18","pts":[[983.25,515],[1013.25,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw19","pts":[[761.5,515],[793.25,515]],"vis":[],"dash":0},{"t":"w","id":"u7s1brw20","pts":[[1013.25,515],[1045,515]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":503,"xm":478,"ym":527,"vis":[],"side":-1,"sp":[523.17,492.39],"sm":[523.17,537.61],"lab":[439.96,515,"end"]},{"t":"r","k":"r1","x":761.5,"y":437.5,"dir":"v","vis":[],"lab":[781.54,437.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":592.5,"dir":"v","vis":[],"lab":[781.54,592.5,"start"]},{"t":"r","k":"r2","x":1045,"y":437.5,"dir":"v","vis":[],"lab":[1065.04,437.5,"start"]},{"t":"r","k":"r4","x":1045,"y":592.5,"dir":"v","vis":[],"lab":[1065.04,592.5,"start"]},{"t":"p","k":"a","x":823.25,"y":515,"dir":"h","vis":[],"node":"n7","side":1,"nl":[823.25,544.72,null]},{"t":"g","k":"g","x":903.25,"y":515,"dir":"h","vis":[],"side":1,"lab":[903.25,467.32,null]},{"t":"p","k":"b","x":983.25,"y":515,"dir":"h","vis":[],"node":"n8","side":1,"nl":[983.25,544.72,null]},{"t":"d","id":"u7s1brj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u7s1brj7","x":761.5,"y":515,"vis":[]},{"t":"d","id":"u7s1brj10","x":761.5,"y":670,"vis":[]},{"t":"d","id":"u7s1brj20","x":1045,"y":515,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,670],[478,670],[478,527]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,670],[761.5,670]]},{"I":1,"pts":[[478,503],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,670]]}]}],"base":110,"von":["src"],"bands":"never","pts":["a","b"],"net":[["E","src","n1","n4",1,[]],["R","r1","n1","n7",1,[]],["R","r3","n7","n4",1,[]],["R","r2","n1","n8",1,[]],["R","r4","n8","n4",1,[]],["G","g","n7","n8",1,[]]]}
};
function tbU7s1br(d, p, L){ tbGen_Draw(d, p, L, U7S1K.br); }
// ---- 7-2 ブリッジの平衡 の図（※ textbook/gen/make_section.py が textbook/gen/data/u07_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U7S2K = {
  bal: {"vars":[],"items":[{"t":"z","id":"zbu7s2bal0hi","z":"hi","lines":[[[832.43,360],[478,360],[478,548]],[[832.43,360],[1190.22,360],[1190.22,430]],[[832.43,360],[832.43,430]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu7s2bal1lo","z":"lo","lines":[[[832.43,760],[478,760],[478,572]],[[832.43,760],[1190.22,760],[1190.22,690]],[[832.43,690],[832.43,760]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu7s2bal2mid","z":"mid","lines":[[[832.43,490],[832.43,560]],[[832.43,560],[832.43,630]],[[989.32,560],[832.43,560]]],"vis":[],"pts":["a"],"node":"n7"},{"t":"z","id":"zbu7s2bal3mid","z":"mid","lines":[[[1190.22,490],[1190.22,560]],[[1190.22,560],[1190.22,630]],[[1033.32,560],[1190.22,560]]],"vis":[],"pts":["b"],"node":"n8"},{"t":"w","id":"u7s2balL","pts":[[478,360],[832.43,360]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw2","pts":[[478,760],[832.43,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw3","pts":[[832.43,360],[1190.22,360]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw4","pts":[[832.43,760],[1190.22,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw7","pts":[[832.43,360],[832.43,430]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw8","pts":[[832.43,490],[832.43,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw9","pts":[[832.43,560],[832.43,630]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw10","pts":[[832.43,690],[832.43,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw11","pts":[[1190.22,360],[1190.22,430]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw12","pts":[[1190.22,490],[1190.22,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw13","pts":[[1190.22,560],[1190.22,630]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw14","pts":[[1190.22,690],[1190.22,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw15","pts":[[901.32,560],[931.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw16","pts":[[931.32,560],[989.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw17","pts":[[1033.32,560],[1091.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw18","pts":[[1091.32,560],[1121.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw19","pts":[[832.43,560],[901.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2balw20","pts":[[1121.32,560],[1190.22,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"sp":[525.68,535.84],"sm":[525.68,584.16],"lab":[546.34,560,"start"]},{"t":"r","k":"r1","x":832.43,"y":460,"dir":"v","vis":[],"lab":[852.77,460,"start"]},{"t":"v","k":"v1","x":832.43,"y":460,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[747.43,460,"end"]},{"t":"r","k":"r3","x":832.43,"y":660,"dir":"v","vis":[],"lab":[852.77,660,"start"]},{"t":"r","k":"r2","x":1190.22,"y":460,"dir":"v","vis":[],"lab":[1169.88,460,"end"]},{"t":"v","k":"v2","x":1190.22,"y":460,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[1105.22,460,"end"]},{"t":"r","k":"r4","x":1190.22,"y":660,"dir":"v","vis":[],"lab":[1169.88,660,"end"]},{"t":"p","k":"a","x":931.32,"y":560,"dir":"h","vis":[],"node":"n7","side":1,"z":"mid","nl":[931.32,592.6,null],"vl":[931.32,527.4,null]},{"t":"g","k":"g","x":1011.32,"y":560,"dir":"h","vis":[],"side":1,"lab":[1003.32,509.73,null]},{"t":"p","k":"b","x":1091.32,"y":560,"dir":"h","vis":[],"node":"n8","side":1,"z":"mid","nl":[1091.32,592.6,null],"vl":[1065.32,507.4,null]},{"t":"d","id":"u7s2balj4","x":832.43,"y":360,"vis":[]},{"t":"d","id":"u7s2balj7","x":832.43,"y":560,"vis":[]},{"t":"d","id":"u7s2balj10","x":832.43,"y":760,"vis":[]},{"t":"d","id":"u7s2balj20","x":1190.22,"y":560,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[832.43,760],[478,760],[478,572]]},{"I":0.5,"pts":[[832.43,360],[1190.22,360],[1190.22,760],[832.43,760]]},{"I":1,"pts":[[478,548],[478,360],[832.43,360]]},{"I":0.5,"pts":[[832.43,360],[832.43,760]]}]}],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":["a","b"],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",1,[]],["R","r3","n7","n4",1,[]],["R","r2","n1","n8",1,[]],["R","r4","n8","n4",1,[]],["G","g","n7","n8",1,[]]]},
  unb: {"vars":[],"items":[{"t":"z","id":"zbu7s2unb0hi","z":"hi","lines":[[[832.43,360],[478,360],[478,548]],[[832.43,360],[1190.22,360],[1190.22,430]],[[832.43,360],[832.43,430]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu7s2unb1lo","z":"lo","lines":[[[832.43,760],[478,760],[478,572]],[[832.43,760],[1190.22,760],[1190.22,690]],[[832.43,690],[832.43,760]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu7s2unb2mid","z":"mid","lines":[[[832.43,490],[832.43,560]],[[832.43,560],[832.43,630]],[[989.32,560],[832.43,560]]],"vis":[],"pts":["a"],"node":"n7"},{"t":"z","id":"zbu7s2unb3mid2","z":"mid2","lines":[[[1190.22,490],[1190.22,560]],[[1190.22,560],[1190.22,630]],[[1033.32,560],[1190.22,560]]],"vis":[],"pts":["b"],"node":"n8"},{"t":"w","id":"u7s2unbL","pts":[[478,360],[832.43,360]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw2","pts":[[478,760],[832.43,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw3","pts":[[832.43,360],[1190.22,360]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw4","pts":[[832.43,760],[1190.22,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw7","pts":[[832.43,360],[832.43,430]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw8","pts":[[832.43,490],[832.43,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw9","pts":[[832.43,560],[832.43,630]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw10","pts":[[832.43,690],[832.43,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw11","pts":[[1190.22,360],[1190.22,430]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw12","pts":[[1190.22,490],[1190.22,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw13","pts":[[1190.22,560],[1190.22,630]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw14","pts":[[1190.22,690],[1190.22,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw15","pts":[[901.32,560],[931.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw16","pts":[[931.32,560],[989.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw17","pts":[[1033.32,560],[1091.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw18","pts":[[1091.32,560],[1121.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw19","pts":[[832.43,560],[901.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2unbw20","pts":[[1121.32,560],[1190.22,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"sp":[525.68,535.84],"sm":[525.68,584.16],"lab":[546.34,560,"start"]},{"t":"r","k":"r1","x":832.43,"y":460,"dir":"v","vis":[],"lab":[852.77,460,"start"]},{"t":"v","k":"v1","x":832.43,"y":460,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[747.43,460,"end"]},{"t":"r","k":"r3","x":832.43,"y":660,"dir":"v","vis":[],"lab":[852.77,660,"start"]},{"t":"r","k":"r2","x":1190.22,"y":460,"dir":"v","vis":[],"lab":[1169.88,460,"end"]},{"t":"v","k":"v2","x":1190.22,"y":460,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[1105.22,460,"end"]},{"t":"r","k":"r4","x":1190.22,"y":660,"dir":"v","vis":[],"lab":[1169.88,660,"end"]},{"t":"p","k":"a","x":931.32,"y":560,"dir":"h","vis":[],"node":"n7","side":1,"z":"mid","nl":[931.32,592.6,null],"vl":[931.32,527.4,null]},{"t":"g","k":"g","x":1011.32,"y":560,"dir":"h","vis":[],"side":1,"lab":[1003.32,509.73,null]},{"t":"p","k":"b","x":1091.32,"y":560,"dir":"h","vis":[],"node":"n8","side":1,"z":"mid2","nl":[1091.32,592.6,null],"vl":[1065.32,507.4,null]},{"t":"d","id":"u7s2unbj4","x":832.43,"y":360,"vis":[]},{"t":"d","id":"u7s2unbj7","x":832.43,"y":560,"vis":[]},{"t":"d","id":"u7s2unbj10","x":832.43,"y":760,"vis":[]},{"t":"d","id":"u7s2unbj20","x":1190.22,"y":560,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[832.43,760],[478,760],[478,572]]},{"I":0.5,"pts":[[832.43,360],[1190.22,360],[1190.22,560]]},{"I":1,"pts":[[478,548],[478,360],[832.43,360]]},{"I":0.5,"pts":[[832.43,360],[832.43,560]]},{"I":0.5,"pts":[[832.43,560],[832.43,760]]},{"I":0.5,"pts":[[1190.22,560],[1190.22,760],[832.43,760]]},{"I":0,"pts":[[1033.32,560],[1190.22,560]]},{"I":0,"pts":[[832.43,560],[989.32,560]]}]}],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":["a","b"],"net":[["E","src","n1","n4",15,[]],["R","r1","n1","n7",1,[]],["R","r3","n7","n4",4,[]],["R","r2","n1","n8",3,[]],["R","r4","n8","n4",2,[]],["G","g","n7","n8",1000,[]]]},
  pr: {"vars":[],"items":[{"t":"w","id":"u7s2prL","pts":[[478,360],[832.43,360]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw2","pts":[[478,760],[832.43,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw3","pts":[[832.43,360],[1190.22,360]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw4","pts":[[832.43,760],[1190.22,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw7","pts":[[832.43,360],[832.43,430]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw8","pts":[[832.43,490],[832.43,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw9","pts":[[832.43,560],[832.43,630]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw10","pts":[[832.43,690],[832.43,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw11","pts":[[1190.22,360],[1190.22,430]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw12","pts":[[1190.22,490],[1190.22,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw13","pts":[[1190.22,560],[1190.22,630]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw14","pts":[[1190.22,690],[1190.22,760]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw15","pts":[[901.32,560],[931.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw16","pts":[[931.32,560],[989.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw17","pts":[[1033.32,560],[1091.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw18","pts":[[1091.32,560],[1121.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw19","pts":[[832.43,560],[901.32,560]],"vis":[],"dash":0},{"t":"w","id":"u7s2prw20","pts":[[1121.32,560],[1190.22,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"sp":[519.63,539.58],"sm":[519.63,580.42],"lab":[535.62,560,"start"]},{"t":"r","k":"r1","x":832.43,"y":460,"dir":"v","vis":[],"lab":[852.05,460,"start"]},{"t":"v","k":"v1","x":832.43,"y":460,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[747.43,460,"end"]},{"t":"r","k":"r3","x":832.43,"y":660,"dir":"v","vis":[],"lab":[852.05,660,"start"]},{"t":"r","k":"r2","x":1190.22,"y":460,"dir":"v","vis":[],"lab":[1209.84,460,"start"]},{"t":"v","k":"v2","x":1190.22,"y":460,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[1105.22,460,"end"]},{"t":"r","k":"r4","x":1190.22,"y":660,"dir":"v","vis":[],"lab":[1209.84,660,"start"]},{"t":"p","k":"a","x":931.32,"y":560,"dir":"h","vis":[],"node":"n7","side":1,"nl":[931.32,585.66,null],"vl":[931.32,534.34,null]},{"t":"g","k":"g","x":1011.32,"y":560,"dir":"h","vis":[],"side":1,"lab":[1011.32,515.96,null]},{"t":"p","k":"b","x":1091.32,"y":560,"dir":"h","vis":[],"node":"n8","side":1,"nl":[1091.32,585.66,null],"vl":[1065.32,514.34,null]},{"t":"d","id":"u7s2prj4","x":832.43,"y":360,"vis":[]},{"t":"d","id":"u7s2prj7","x":832.43,"y":560,"vis":[]},{"t":"d","id":"u7s2prj10","x":832.43,"y":760,"vis":[]},{"t":"d","id":"u7s2prj20","x":1190.22,"y":560,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[832.43,760],[478,760],[478,572]]},{"I":0.5,"pts":[[832.43,360],[1190.22,360],[1190.22,760],[832.43,760]]},{"I":1,"pts":[[478,548],[478,360],[832.43,360]]},{"I":0.5,"pts":[[832.43,360],[832.43,760]]}]}],"base":110,"von":["src","v1","v2"],"bands":"never","pts":["a","b"],"net":[["E","src","n1","n4",1,[]],["R","r1","n1","n7",1,[]],["R","r3","n7","n4",1,[]],["R","r2","n1","n8",1,[]],["R","r4","n8","n4",1,[]],["G","g","n7","n8",1,[]]]}
};
function tbU7s2bal(d, p, L){ tbGen_Draw(d, p, L, U7S2K.bal); }
function tbU7s2unb(d, p, L){ tbGen_Draw(d, p, L, U7S2K.unb); }
function tbU7s2pr(d, p, L){ tbGen_Draw(d, p, L, U7S2K.pr); }
// ---- 7-3 平衡条件 の図（※ textbook/gen/make_section.py が textbook/gen/data/u07_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U7S3K = {
  br: {"vars":[],"items":[{"t":"z","id":"zbu7s3br0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,598]],[[761.5,360],[1095.9,360],[1095.9,455]],[[761.5,360],[761.5,455]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu7s3br1lo","z":"lo","lines":[[[761.5,860],[478,860],[478,622]],[[761.5,860],[1095.9,860],[1095.9,765]],[[761.5,765],[761.5,860]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu7s3br2mid","z":"mid","lines":[[[761.5,515],[761.5,610]],[[761.5,610],[761.5,705]],[[906.7,610],[761.5,610]]],"vis":[],"pts":["a"],"node":"n7"},{"t":"z","id":"zbu7s3br3mid","z":"mid","lines":[[[1095.9,515],[1095.9,610]],[[1095.9,610],[1095.9,705]],[[950.7,610],[1095.9,610]]],"vis":[],"pts":["b"],"node":"n8"},{"t":"w","id":"u7s3brL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw2","pts":[[478,860],[761.5,860]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw3","pts":[[761.5,360],[1095.9,360]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw4","pts":[[761.5,860],[1095.9,860]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw5","pts":[[478,360],[478,598]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw6","pts":[[478,622],[478,860]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw7","pts":[[761.5,360],[761.5,455]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw8","pts":[[761.5,515],[761.5,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw9","pts":[[761.5,610],[761.5,705]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw10","pts":[[761.5,765],[761.5,860]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw11","pts":[[1095.9,360],[1095.9,455]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw12","pts":[[1095.9,515],[1095.9,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw13","pts":[[1095.9,610],[1095.9,705]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw14","pts":[[1095.9,765],[1095.9,860]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw15","pts":[[818.7,610],[848.7,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw16","pts":[[848.7,610],[906.7,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw17","pts":[[950.7,610],[1008.7,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw18","pts":[[1008.7,610],[1038.7,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw19","pts":[[761.5,610],[818.7,610]],"vis":[],"dash":0},{"t":"w","id":"u7s3brw20","pts":[[1038.7,610],[1095.9,610]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":598,"xm":478,"ym":622,"vis":[],"side":-1,"sp":[528.27,584.24],"sm":[528.27,635.76],"lab":[439.35,610,"end"]},{"t":"r","k":"r1","x":761.5,"y":485,"dir":"v","vis":[],"lab":[782.15,485,"start"]},{"t":"v","k":"v1","x":761.5,"y":485,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[676.5,485,"end"]},{"t":"r","k":"r3","x":761.5,"y":735,"dir":"v","vis":[],"lab":[782.15,735,"start"]},{"t":"v","k":"v3","x":761.5,"y":735,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r3","lab":[676.5,735,"end"]},{"t":"r","k":"r2","x":1095.9,"y":485,"dir":"v","vis":[],"lab":[1116.55,485,"start"]},{"t":"v","k":"v2","x":1095.9,"y":485,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[1010.9,485,"end"]},{"t":"r","k":"r4","x":1095.9,"y":735,"dir":"v","vis":[],"lab":[1116.55,735,"start"]},{"t":"v","k":"v4","x":1095.9,"y":735,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r4","lab":[1010.9,735,"end"]},{"t":"p","k":"a","x":848.7,"y":610,"dir":"h","vis":[],"node":"n7","side":1,"z":"mid","nl":[848.7,645.58,null]},{"t":"g","k":"g","x":928.7,"y":610,"dir":"h","vis":[],"side":1,"lab":[928.7,557.07,null]},{"t":"p","k":"b","x":1008.7,"y":610,"dir":"h","vis":[],"node":"n8","side":1,"z":"mid","nl":[992.7,645.58,null]},{"t":"d","id":"u7s3brj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u7s3brj7","x":761.5,"y":610,"vis":[]},{"t":"d","id":"u7s3brj10","x":761.5,"y":860,"vis":[]},{"t":"d","id":"u7s3brj20","x":1095.9,"y":610,"vis":[]},{"t":"i","k":"i1","x0":761.5,"y0":402.5,"x1":761.5,"y1":442.5,"lab":[778.15,422.5,"start"],"vis":[],"ax":"v","sd":1},{"t":"i","k":"i3","x0":761.5,"y0":652.5,"x1":761.5,"y1":692.5,"lab":[778.15,672.5,"start"],"vis":[],"ax":"v","sd":1},{"t":"i","k":"i2","x0":1095.9,"y0":402.5,"x1":1095.9,"y1":442.5,"lab":[1112.55,422.5,"start"],"vis":[],"ax":"v","sd":1},{"t":"i","k":"i4","x0":1095.9,"y0":652.5,"x1":1095.9,"y1":692.5,"lab":[1112.55,672.5,"start"],"vis":[],"ax":"v","sd":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,860],[478,860],[478,622]]},{"I":0.25,"pts":[[761.5,360],[1095.9,360],[1095.9,860],[761.5,860]]},{"I":1,"pts":[[478,598],[478,360],[761.5,360]]},{"I":0.75,"pts":[[761.5,360],[761.5,860]]}]}],"base":110,"von":["src","v1","v2","v3","v4"],"bands":"volt","pts":["a","b"],"net":[["E","src","n1","n4",1,[]],["R","r1","n1","n7",2,[]],["R","r3","n7","n4",4,[]],["R","r2","n1","n8",6,[]],["R","r4","n8","n4",12,[]],["G","g","n7","n8",1,[]]]}
};
function tbU7s3br(d, p, L){ tbGen_Draw(d, p, L, U7S3K.br); }
// ---- 7-4 平衡なら真ん中を消す の図（※ textbook/gen/make_section.py が textbook/gen/data/u07_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U7S4K = {
  br: {"vars":[],"items":[{"t":"z","id":"zbu7s4br0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,553]],[[761.5,360],[1056.68,360],[1056.68,432.5]],[[761.5,360],[761.5,432.5]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu7s4br1lo","z":"lo","lines":[[[761.5,770],[478,770],[478,577]],[[761.5,770],[1056.68,770],[1056.68,697.5]],[[761.5,697.5],[761.5,770]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu7s4br2mid","z":"mid","lines":[[[761.5,492.5],[761.5,565]],[[761.5,565],[761.5,637.5]],[[761.5,565],[879.09,565]]],"vis":[],"pts":[],"node":"n7"},{"t":"z","id":"zbu7s4br3mid","z":"mid","lines":[[[1056.68,492.5],[1056.68,565]],[[1056.68,565],[1056.68,637.5]],[[939.09,565],[1056.68,565]]],"vis":[],"pts":[],"node":"n8"},{"t":"w","id":"u7s4brL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw2","pts":[[478,770],[761.5,770]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw3","pts":[[761.5,360],[1056.68,360]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw4","pts":[[761.5,770],[1056.68,770]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw5","pts":[[478,360],[478,553]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw6","pts":[[478,577],[478,770]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw7","pts":[[761.5,360],[761.5,432.5]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw8","pts":[[761.5,492.5],[761.5,565]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw9","pts":[[761.5,565],[761.5,637.5]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw10","pts":[[761.5,697.5],[761.5,770]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw11","pts":[[1056.68,360],[1056.68,432.5]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw12","pts":[[1056.68,492.5],[1056.68,565]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw13","pts":[[1056.68,565],[1056.68,637.5]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw14","pts":[[1056.68,697.5],[1056.68,770]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw15","pts":[[761.5,565],[879.09,565]],"vis":[],"dash":0},{"t":"w","id":"u7s4brw16","pts":[[939.09,565],[1056.68,565]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":553,"xm":478,"ym":577,"vis":[],"side":-1,"sp":[522.07,543.07],"sm":[522.07,586.93],"lab":[545.91,565,"start"]},{"t":"r","k":"r1","x":761.5,"y":462.5,"dir":"v","vis":[],"lab":[781.41,462.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":667.5,"dir":"v","vis":[],"lab":[781.41,667.5,"start"]},{"t":"r","k":"r2","x":1056.68,"y":462.5,"dir":"v","vis":[],"lab":[1036.77,422.5,"end"]},{"t":"r","k":"r4","x":1056.68,"y":667.5,"dir":"v","vis":[],"lab":[1036.77,627.5,"end"]},{"t":"r","k":"r5","x":909.09,"y":565,"dir":"h","vis":[],"lab":[909.09,532.54,null]},{"t":"d","id":"u7s4brj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u7s4brj7","x":761.5,"y":565,"vis":[]},{"t":"d","id":"u7s4brj10","x":761.5,"y":770,"vis":[]},{"t":"d","id":"u7s4brj16","x":1056.68,"y":565,"vis":[]},{"t":"i","k":"i5","x0":831.59,"y0":565,"x1":871.59,"y1":565,"lab":[835.59,596.56,null],"vis":[],"ax":"h","iside":"down"}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,770],[478,770],[478,577]]},{"I":0.4,"pts":[[761.5,360],[1056.68,360],[1056.68,770],[761.5,770]]},{"I":1,"pts":[[478,553],[478,360],[761.5,360]]},{"I":0.6,"pts":[[761.5,360],[761.5,770]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","n1","n4",36,[]],["R","r1","n1","n7",4,[]],["R","r3","n7","n4",8,[]],["R","r2","n1","n8",6,[]],["R","r4","n8","n4",12,[]],["R","r5","n7","n8",10,[]]]}
};
function tbU7s4br(d, p, L){ tbGen_Draw(d, p, L, U7S4K.br); }
// ---- 7-5 平衡していないブリッジ の図（※ textbook/gen/make_section.py が textbook/gen/data/u07_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U7S5K = {
  br: {"vars":[],"items":[{"t":"z","id":"zbu7s5br0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,553]],[[761.5,360],[1045,360],[1045,432.5]],[[761.5,360],[761.5,432.5]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu7s5br1lo","z":"lo","lines":[[[761.5,770],[478,770],[478,577]],[[761.5,770],[1045,770],[1045,697.5]],[[761.5,697.5],[761.5,770]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu7s5br2mid","z":"mid","lines":[[[761.5,492.5],[761.5,565]],[[761.5,565],[761.5,637.5]],[[1045,492.5],[1045,565]],[[1045,565],[1045,637.5]],[[761.5,565],[1045,565]]],"vis":[],"pts":["a","b"],"node":"n7"},{"t":"w","id":"u7s5brL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw2","pts":[[478,770],[761.5,770]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw4","pts":[[761.5,770],[1045,770]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw5","pts":[[478,360],[478,553]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw6","pts":[[478,577],[478,770]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw7","pts":[[761.5,360],[761.5,432.5]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw8","pts":[[761.5,492.5],[761.5,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw9","pts":[[761.5,565],[761.5,637.5]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw10","pts":[[761.5,697.5],[761.5,770]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw11","pts":[[1045,360],[1045,432.5]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw12","pts":[[1045,492.5],[1045,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw13","pts":[[1045,565],[1045,637.5]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw14","pts":[[1045,697.5],[1045,770]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw15","pts":[[823.25,565],[853.25,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw16","pts":[[853.25,565],[903.25,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw17","pts":[[903.25,565],[953.25,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw18","pts":[[953.25,565],[983.25,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw19","pts":[[761.5,565],[823.25,565]],"vis":[],"dash":0},{"t":"w","id":"u7s5brw20","pts":[[983.25,565],[1045,565]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":553,"xm":478,"ym":577,"vis":[],"side":-1,"sp":[521.79,543.25],"sm":[521.79,586.75],"lab":[545.88,565,"start"]},{"t":"r","k":"r1","x":761.5,"y":462.5,"dir":"v","vis":[],"lab":[781.38,462.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":667.5,"dir":"v","vis":[],"lab":[781.38,667.5,"start"]},{"t":"r","k":"r2","x":1045,"y":462.5,"dir":"v","vis":[],"lab":[1025.12,422.5,"end"]},{"t":"r","k":"r4","x":1045,"y":667.5,"dir":"v","vis":[],"lab":[1025.12,627.5,"end"]},{"t":"p","k":"a","x":853.25,"y":565,"dir":"h","vis":[],"node":"n7","side":1,"z":"mid","nl":[853.25,593.13,null]},{"t":"p","k":"b","x":953.25,"y":565,"dir":"h","vis":[],"node":"n7","side":1,"z":"mid","nl":[953.25,593.13,null]},{"t":"d","id":"u7s5brj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u7s5brj7","x":761.5,"y":565,"vis":[]},{"t":"d","id":"u7s5brj10","x":761.5,"y":770,"vis":[]},{"t":"d","id":"u7s5brj19","x":1045,"y":565,"vis":[]},{"t":"i","k":"i","x0":478,"y0":541.5,"x1":478,"y1":501.5,"lab":[493.88,505.5,"start"],"vis":[],"ax":"v","sd":-1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,770],[478,770],[478,577]]},{"I":0.67,"pts":[[761.5,360],[1045,360],[1045,565]]},{"I":1,"pts":[[478,553],[478,360],[761.5,360]]},{"I":0.33,"pts":[[761.5,360],[761.5,565]]},{"I":0.75,"pts":[[761.5,565],[761.5,770]]},{"I":0.25,"pts":[[1045,565],[1045,770],[761.5,770]]},{"I":0.42,"pts":[[1045,565],[761.5,565]]}]}],"base":110,"von":["src"],"bands":"volt","pts":["a","b"],"net":[["E","src","n1","n4",30,[]],["R","r1","n1","n7",6,[]],["R","r3","n7","n4",4,[]],["R","r2","n1","n7",3,[]],["R","r4","n7","n4",12,[]]]}
};
function tbU7s5br(d, p, L){ tbGen_Draw(d, p, L, U7S5K.br); }
var KINDS = {u7s1br: tbU7s1br, u7s2bal: tbU7s2bal, u7s2unb: tbU7s2unb, u7s2pr: tbU7s2pr, u7s3br: tbU7s3br, u7s4br: tbU7s4br, u7s5br: tbU7s5br};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u7s1br: function(p, L){ return tbGen_Flow(p, L, U7S1K.br); },
  u7s2bal: function(p, L){ return tbGen_Flow(p, L, U7S2K.bal); },
  u7s2unb: function(p, L){ return tbGen_Flow(p, L, U7S2K.unb); },
  u7s2pr: function(p, L){ return tbGen_Flow(p, L, U7S2K.pr); },
  u7s3br: function(p, L){ return tbGen_Flow(p, L, U7S3K.br); },
  u7s4br: function(p, L){ return tbGen_Flow(p, L, U7S4K.br); },
  u7s5br: function(p, L){ return tbGen_Flow(p, L, U7S5K.br); }
};

// 7-1 ブリッジ回路の形 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u07_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU7s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU7s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU7s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU7s1_par(a, b){ return a * b / (a + b); }
function tbU7s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU7s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU7s1_Qfirst(r){
  var gcd = tbU7s1_gcd, ratio = tbU7s1_ratio, par = tbU7s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$R_1$ と $R_2$", v: "12"}, {t: "$R_3$ と $R_4$", v: "34", why: "$R_3$ と $R_4$ は、－極へ帰る前に通る2つ"}, {t: "$R_1$ と $R_3$", v: "13", why: "点 a を通ってつながる、同じ道の2つ"}, {t: "$R_2$ と $R_4$", v: "24", why: "点 b を通ってつながる、同じ道の2つ"}]);
    return {form: "u7s1first", text: "図のブリッジ回路で、電源の＋極から出た電流が、最初に分かれて通る2つの抵抗は □ である。", fig: {kind: "u7s1br", L: tbU7s1_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["＋極から出た線は、抵抗を通る前に2つの道に分かれる", "分かれた先にあるのは $R_1$ と $R_2$"], chk: {form: "u7s1first", p: {}}};
  }
  throw new Error("u7s1first：条件に合う数字が見つからない");
}
function tbU7s1_Qlast(r){
  var gcd = tbU7s1_gcd, ratio = tbU7s1_ratio, par = tbU7s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$R_3$ と $R_4$", v: "34"}, {t: "$R_1$ と $R_2$", v: "12", why: "$R_1$ と $R_2$ は、＋極から出て最初に通る2つ"}, {t: "$R_1$ と $R_3$", v: "13", why: "点 a を通ってつながる、同じ道の2つ"}, {t: "$R_2$ と $R_4$", v: "24", why: "点 b を通ってつながる、同じ道の2つ"}]);
    return {form: "u7s1last", text: "図のブリッジ回路で、電流が－極へ帰る前に、最後に通る2つの抵抗は □ である。", fig: {kind: "u7s1br", L: tbU7s1_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["点 a・b を通った後に $R_3$ と $R_4$ があり、2つの道は1つに戻って－極へ帰る", "最後に通るのは $R_3$ と $R_4$"], chk: {form: "u7s1last", p: {}}};
  }
  throw new Error("u7s1last：条件に合う数字が見つからない");
}
function tbU7s1_Qgal(r){
  var gcd = tbU7s1_gcd, ratio = tbU7s1_ratio, par = tbU7s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "電流が流れているかと、その向き", v: "own"}, {t: "電源の電圧", v: "v", why: "検流計が調べるのは電流"}, {t: "抵抗の大きさ", v: "r", why: "検流計が調べるのは電流"}, {t: "抵抗にかかる電圧", v: "vr", why: "検流計が調べるのは電流"}]);
    return {form: "u7s1gal", text: "図のブリッジ回路の検流計 G は、□ を調べる計器である。", fig: {kind: "u7s1br", L: tbU7s1_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["検流計は、a と b の間に電流が流れているかと、その向きを調べる"], chk: {form: "u7s1gal", p: {}}};
  }
  throw new Error("u7s1gal：条件に合う数字が見つからない");
}
function tbU7s1_Qnode(r){
  var gcd = tbU7s1_gcd, ratio = tbU7s1_ratio, par = tbU7s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? 'a' : 'b');
    var own = (k == 1 ? '$R_1$・$R_3$・G' : '$R_2$・$R_4$・G');
    var oth = (k == 1 ? '$R_2$・$R_4$・G' : '$R_1$・$R_3$・G');
    var top = (k == 1 ? '$R_1$・$R_2$・G' : '$R_3$・$R_4$・G');
    var nog = (k == 1 ? '$R_1$・$R_3$ だけ' : '$R_2$・$R_4$ だけ');
    var ot = (k == 1 ? 'b' : 'a');
    var _c = choices(r, [{t: String(own), v: "own"}, {t: String(oth), v: "oth", why: "点 " + String(ot) + " につながっている物"}, {t: String(top), v: "top", why: "2つの道の別々の抵抗。点 " + String(nm) + " でつながるのは同じ道の2つ"}, {t: String(nog), v: "nog", why: "検流計 G も点 " + String(nm) + " につながっている"}]);
    return {form: "u7s1node", text: "図のブリッジ回路で、点 " + String(nm) + " につながっているのは □ である。", fig: {kind: "u7s1br", L: tbU7s1_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["点 " + String(nm) + " には、同じ道の2つの抵抗（検流計の前と後）と、検流計 G がつながる", "点 " + String(nm) + " につながるのは " + String(own)], chk: {form: "u7s1node", p: {k: k}}};
  }
  throw new Error("u7s1node：条件に合う数字が見つからない");
}
function tbU7s1_Qcount(r){
  var gcd = tbU7s1_gcd, ratio = tbU7s1_ratio, par = tbU7s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "4つ", v: "4"}, {t: "2つ", v: "2", why: "ブリッジ回路は、2つに分かれた道のそれぞれに2つずつ、合わせて4つの抵抗がある"}, {t: "3つ", v: "3", why: "ブリッジ回路は、2つに分かれた道のそれぞれに2つずつ、合わせて4つの抵抗がある"}, {t: "5つ", v: "5", why: "検流計は抵抗に数えない。抵抗は4つ"}]);
    return {form: "u7s1count", text: "ブリッジ回路の目印になるのは、□ の抵抗があることである。", fig: {kind: "u7s1br", L: tbU7s1_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["2つに分かれた道のそれぞれに、検流計の前と後で1つずつ抵抗がある", "抵抗は合わせて4つ"], chk: {form: "u7s1count", p: {}}};
  }
  throw new Error("u7s1count：条件に合う数字が見つからない");
}
// 7-2 ブリッジの平衡 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u07_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU7s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU7s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU7s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU7s2_par(a, b){ return a * b / (a + b); }
function tbU7s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU7s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU7s2_Qdir(r){
  var gcd = tbU7s2_gcd, ratio = tbU7s2_ratio, par = tbU7s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var A = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20,24,30]);
    var B = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20,24,30]);
    var hi = (A > B ? 'a' : 'b');
    var lo = (A > B ? 'b' : 'a');
    if (!(A != B)) continue;
    var _c = choices(r, [{t: String(hi) + " から " + String(lo) + " へ", v: String(hi) + String(lo)}, {t: String(lo) + " から " + String(hi) + " へ", v: String(lo) + String(hi), why: "向きが逆（電流は電位の高い " + String(hi) + " から低い " + String(lo) + " へ流れる）"}, {t: "流れない", v: "0", why: "a と b の電位が違うので流れる"}, {t: "電源の電圧が分からないので決まらない", v: "none", why: "向きは a と b の電位だけで決まる"}]);
    return {form: "u7s2dir", text: "図のブリッジで、点 a の電位は $" + qv(A, "V") + "$、点 b の電位は $" + qv(B, "V") + "$ である。検流計 G に流れる電流の向きは □ である。", fig: {kind: "u7s2pr", L: tbU7s2_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["pa", {"v":"[[A|fV]]"}], ["pb", {"v":"[[B|fV]]"}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流は電位の高い所から低い所へ流れる", "$" + qv(max(A, B), "V") + "$ の " + String(hi) + " から $" + qv(min(A, B), "V") + "$ の " + String(lo) + " へ流れる"], chk: {form: "u7s2dir", p: {A: A, B: B}}};
  }
  throw new Error("u7s2dir：条件に合う数字が見つからない");
}
function tbU7s2_Qsame(r){
  var gcd = tbU7s2_gcd, ratio = tbU7s2_ratio, par = tbU7s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var A = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20,24,30]);
    var _c = choices(r, [{t: "流れない", v: "0"}, {t: "a から b へ流れる", v: "ab", why: "電位が同じなので、高い方も低い方も無い"}, {t: "b から a へ流れる", v: "ba", why: "電位が同じなので、高い方も低い方も無い"}, {t: "電源の電圧が分からないので決まらない", v: "none", why: "a と b の電位が同じなら流れない。電源の電圧は関係ない"}]);
    return {form: "u7s2same", text: "図のブリッジで、点 a と点 b の電位は、どちらも $" + qv(A, "V") + "$ である。検流計 G に流れる電流は □。", fig: {kind: "u7s2pr", L: tbU7s2_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["pa", {"v":"[[A|fV]]"}], ["pb", {"v":"[[A|fV]]"}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流は電位の高い所から低い所へ流れる", "a と b の電位が同じなので、検流計に電流は流れない（平衡）"], chk: {form: "u7s2same", p: {A: A}}};
  }
  throw new Error("u7s2same：条件に合う数字が見つからない");
}
function tbU7s2_Qname(r){
  var gcd = tbU7s2_gcd, ratio = tbU7s2_ratio, par = tbU7s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "平衡", v: "own"}, {t: "短絡", v: "short", why: "短絡は、抵抗の無い線だけでつながった所"}, {t: "分圧", v: "div", why: "分圧は、直列の抵抗に電圧が分かれること"}, {t: "直列", v: "ser", why: "直列は、1本の道につなぐこと"}]);
    return {form: "u7s2name", text: "図のブリッジで、a と b の電位が同じで、検流計 G に電流が流れない状態を、ブリッジが □ しているという。", fig: {kind: "u7s2pr", L: tbU7s2_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["a と b の電位が同じで、検流計に電流が流れない状態を、ブリッジが平衡しているという"], chk: {form: "u7s2name", p: {}}};
  }
  throw new Error("u7s2name：条件に合う数字が見つからない");
}
function tbU7s2_Qpot(r){
  var gcd = tbU7s2_gcd, ratio = tbU7s2_ratio, par = tbU7s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [6,9,10,12,15,18,20,24,30,36,40,48,50,60]);
    var Vk = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20,24,25,30,32,36,40,45]);
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? 'a' : 'b');
    if (!(Vk < V && Vk * 2 != V)) continue;
    var ok = (V - Vk);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s2_three(ok, [{x: (Vk), why: "$R_" + fmt(k) + "$ にかかる電圧を、そのまま " + String(nm) + " の電位とした"}, {x: (V + Vk), why: "下がる電圧を足した"}, {x: (V), why: "＋極の側の電圧のままとした（$R_" + fmt(k) + "$ で下がる分を引いていない）"}, {x: (V / 2), why: "電源の電圧の半分とした"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u7s2pot", text: "図のブリッジで、電源の電圧は $V = " + qv(V, "V") + "$、$R_" + fmt(k) + "$ にかかる電圧は $V_" + fmt(k) + " = " + qv(Vk, "V") + "$ である。－極を $0\\,\\mathrm{V}$ とすると、点 " + String(nm) + " の電位は何 V か。", fig: {kind: "u7s2pr", L: tbU7s2_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["src", "{V}=" + qf(V, "V")], ["v" + fmt(k), "{V}_" + fmt(k) + "=" + qf(Vk, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["＋極の側の線は $" + qv(V, "V") + "$。$R_" + fmt(k) + "$ を通ると $V_" + fmt(k) + "$ だけ下がる", "点 " + String(nm) + " の電位は　$" + fmt(V) + " - " + fmt(Vk) + " = " + qv(ok, "V") + "$"], chk: {form: "u7s2pot", p: {V: V, Vk: Vk}}};
  }
  throw new Error("u7s2pot：条件に合う数字が見つからない");
}
function tbU7s2_Qdir2(r){
  var gcd = tbU7s2_gcd, ratio = tbU7s2_ratio, par = tbU7s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,12,15,18,20,24,30,36,40,48,50,60]);
    var V1 = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20,24,25,30]);
    var V2 = pick(r, [2,3,4,5,6,8,9,10,12,15,16,18,20,24,25,30]);
    var A = (V - V1);
    var B = (V - V2);
    var hi = (V1 < V2 ? 'a' : 'b');
    var lo = (V1 < V2 ? 'b' : 'a');
    if (!(V1 != V2 && max(V1, V2) < V)) continue;
    var _c = choices(r, [{t: String(hi) + " から " + String(lo) + " へ", v: String(hi) + String(lo)}, {t: String(lo) + " から " + String(hi) + " へ", v: String(lo) + String(hi), why: "向きが逆（かかる電圧が大きい方の先が、電位は低い）"}, {t: "流れない", v: "0", why: "a は $" + qv(A, "V") + "$、b は $" + qv(B, "V") + "$ で電位が違うので流れる"}, {t: "抵抗の値が分からないので決まらない", v: "none", why: "向きは a と b の電位だけで決まる"}]);
    return {form: "u7s2dir2", text: "図のブリッジで、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$、$R_2$ にかかる電圧は $V_2 = " + qv(V2, "V") + "$ である。検流計 G に流れる電流の向きは □ である。", fig: {kind: "u7s2pr", L: tbU7s2_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["src", "{V}=" + qf(V, "V")], ["v1", "{V}_1=" + qf(V1, "V")], ["v2", "{V}_2=" + qf(V2, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["a の電位は $" + fmt(V) + " - " + fmt(V1) + " = " + qv(A, "V") + "$、b の電位は $" + fmt(V) + " - " + fmt(V2) + " = " + qv(B, "V") + "$", "電流は電位の高い " + String(hi) + " から低い " + String(lo) + " へ流れる"], chk: {form: "u7s2dir2", p: {V: V, V1: V1, V2: V2}}};
  }
  throw new Error("u7s2dir2：条件に合う数字が見つからない");
}
// 7-3 平衡条件 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u07_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU7s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU7s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU7s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU7s3_par(a, b){ return a * b / (a + b); }
function tbU7s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU7s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU7s3_Qcond(r){
  var gcd = tbU7s3_gcd, ratio = tbU7s3_ratio, par = tbU7s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$R_2 R_3 = R_1 R_4$", v: "own"}, {t: "$R_1 R_2 = R_3 R_4$", v: "12", why: "向かい合っていない $R_1$ と $R_2$、$R_3$ と $R_4$ の積にした"}, {t: "$R_1 R_3 = R_2 R_4$", v: "13", why: "同じ道の $R_1$ と $R_3$、$R_2$ と $R_4$ の積にした"}, {t: "$R_1 + R_4 = R_2 + R_3$", v: "sum", why: "積でなく和にした"}]);
    return {form: "u7s3cond", text: "図のブリッジが平衡する条件は □ である。", fig: {kind: "u7s3br", L: tbU7s3_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["向かい合う抵抗は $R_2$ と $R_3$、$R_1$ と $R_4$", "その積が等しいとき平衡する　$R_2 R_3 = R_1 R_4$"], chk: {form: "u7s3cond", p: {}}};
  }
  throw new Error("u7s3cond：条件に合う数字が見つからない");
}
function tbU7s3_Qpair(r){
  var gcd = tbU7s3_gcd, ratio = tbU7s3_ratio, par = tbU7s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4]);
    var pr = (k == 1 ? 4 : (k == 2 ? 3 : (k == 3 ? 2 : 1)));
    var sp = (k == 1 ? 3 : (k == 2 ? 4 : (k == 3 ? 1 : 2)));
    var tb = (k == 1 ? 2 : (k == 2 ? 1 : (k == 3 ? 4 : 3)));
    var pt = (k == 1 || k == 3 ? 'a' : 'b');
    var _c = choices(r, [{t: "$R_" + fmt(pr) + "$", v: fmt(pr)}, {t: "$R_" + fmt(sp) + "$", v: fmt(sp), why: "$R_" + fmt(sp) + "$ は、点 " + String(pt) + " を通ってつながる同じ道の抵抗"}, {t: "$R_" + fmt(tb) + "$", v: fmt(tb), why: "$R_" + fmt(tb) + "$ は、もう1つの道で同じ側にある抵抗。向かい合うのは斜めの組"}, {t: "検流計 G", v: "g", why: "G は抵抗ではない"}]);
    return {form: "u7s3pair", text: "図のブリッジで、$R_" + fmt(k) + "$ と向かい合う抵抗は □ である。", fig: {kind: "u7s3br", L: tbU7s3_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["r" + fmt(k), "{R}_" + fmt(k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["向かい合う抵抗は $R_2$ と $R_3$、$R_1$ と $R_4$ の組", "$R_" + fmt(k) + "$ と向かい合うのは $R_" + fmt(pr) + "$"], chk: {form: "u7s3pair", p: {k: k}}};
  }
  throw new Error("u7s3pair：条件に合う数字が見つからない");
}
function tbU7s3_Qx4(r){
  var gcd = tbU7s3_gcd, ratio = tbU7s3_ratio, par = tbU7s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R4 = (R2 * R3 / R1);
    if (!((R2 * R3) % R1 == 0 && R4 <= 100 && R1 != R2 && R1 != R3 && R2 + R3 > R1)) continue;
    var ok = (R2 * R3 / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s3_three(ok, [{x: (R1 * R2 / R3), why: "向かい合っていない $R_1$ と $R_2$、$R_3$ と $R_4$ の積を等しくした"}, {x: (R1 * R3 / R2), why: "同じ道の $R_1$ と $R_3$、$R_2$ と $R_4$ の積を等しくした"}, {x: (R2 + R3 - R1), why: "積でなく和を等しくした"}, {x: (R2 * R3), why: "$R_1$ で割っていない"}, {x: (R1), why: "向かい合う抵抗が等しいと考えた（等しいのは積）"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u7s3x4", text: "図のブリッジで、検流計 G に電流が流れなかった。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ のとき、$R_4$ は何 Ω か。", fig: {kind: "u7s3br", L: tbU7s3_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流が流れないので平衡している。向かい合う抵抗の積が等しい　$R_2 R_3 = R_1 R_4$", "$R_4 = \\dfrac{R_2 R_3}{R_1} = \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R1) + "} = " + qv(ok, "O") + "$"], chk: {form: "u7s3x4", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u7s3x4：条件に合う数字が見つからない");
}
function tbU7s3_Qx1(r){
  var gcd = tbU7s3_gcd, ratio = tbU7s3_ratio, par = tbU7s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R4 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R1 = (R2 * R3 / R4);
    if (!((R2 * R3) % R4 == 0 && R1 <= 100 && R4 != R2 && R4 != R3 && R2 + R3 > R4)) continue;
    var ok = (R2 * R3 / R4);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s3_three(ok, [{x: (R3 * R4 / R2), why: "向かい合っていない $R_1$ と $R_2$、$R_3$ と $R_4$ の積を等しくした"}, {x: (R2 * R4 / R3), why: "同じ道の $R_1$ と $R_3$、$R_2$ と $R_4$ の積を等しくした"}, {x: (R2 + R3 - R4), why: "積でなく和を等しくした"}, {x: (R2 * R3), why: "$R_4$ で割っていない"}, {x: (R4), why: "向かい合う抵抗が等しいと考えた（等しいのは積）"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u7s3x1", text: "図のブリッジで、検流計 G に電流が流れなかった。$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$ のとき、$R_1$ は何 Ω か。", fig: {kind: "u7s3br", L: tbU7s3_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流が流れないので平衡している。向かい合う抵抗の積が等しい　$R_2 R_3 = R_1 R_4$", "$R_1 = \\dfrac{R_2 R_3}{R_4} = \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R4) + "} = " + qv(ok, "O") + "$"], chk: {form: "u7s3x1", p: {R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u7s3x1：条件に合う数字が見つからない");
}
function tbU7s3_Qx2(r){
  var gcd = tbU7s3_gcd, ratio = tbU7s3_ratio, par = tbU7s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R4 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = (R1 * R4 / R3);
    if (!((R1 * R4) % R3 == 0 && R2 <= 100 && R3 != R1 && R3 != R4 && R1 + R4 > R3)) continue;
    var ok = (R1 * R4 / R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s3_three(ok, [{x: (R3 * R4 / R1), why: "向かい合っていない $R_1$ と $R_2$、$R_3$ と $R_4$ の積を等しくした"}, {x: (R1 * R3 / R4), why: "同じ道の $R_1$ と $R_3$、$R_2$ と $R_4$ の積を等しくした"}, {x: (R1 + R4 - R3), why: "積でなく和を等しくした"}, {x: (R1 * R4), why: "$R_3$ で割っていない"}, {x: (R3), why: "向かい合う抵抗が等しいと考えた（等しいのは積）"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u7s3x2", text: "図のブリッジで、検流計 G に電流が流れなかった。$R_1 = " + qv(R1, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$ のとき、$R_2$ は何 Ω か。", fig: {kind: "u7s3br", L: tbU7s3_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}}, [["r1", "{R}_1=" + qf(R1, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流が流れないので平衡している。向かい合う抵抗の積が等しい　$R_2 R_3 = R_1 R_4$", "$R_2 = \\dfrac{R_1 R_4}{R_3} = \\dfrac{" + fmt(R1) + " \\times " + fmt(R4) + "}{" + fmt(R3) + "} = " + qv(ok, "O") + "$"], chk: {form: "u7s3x2", p: {R1: R1, R3: R3, R4: R4}}};
  }
  throw new Error("u7s3x2：条件に合う数字が見つからない");
}
// 7-4 平衡なら真ん中を消す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u07_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU7s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU7s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU7s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU7s4_par(a, b){ return a * b / (a + b); }
function tbU7s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU7s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU7s4_Qrt(r){
  var gcd = tbU7s4_gcd, ratio = tbU7s4_ratio, par = tbU7s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R5 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R4 = (R2 * R3 / R1);
    var A = (R1 + R3);
    var B = (R2 + R2 * R3 / R1);
    if (!((R2 * R3) % R1 == 0 && R4 <= 100 && R1 != R2 && (A * B * 10) % (A + B) == 0)) continue;
    var ok = (A * B / (A + B));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s4_three(ok, [{x: (A + B), why: "2つの道を直列に足した"}, {x: (A * B / (A + B) + R5), why: "電流の流れない $R_5$ を足した"}, {x: (min(A, B)), why: "抵抗の小さい方の道だけを見た"}, {x: (max(A, B)), why: "抵抗の大きい方の道だけを見た"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u7s4rt", text: "図のブリッジで、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$、$R_5 = " + qv(R5, "O") + "$ である。回路全体の合成抵抗は何 Ω か。", fig: {kind: "u7s4br", L: tbU7s4_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["r5", "{R}_5=" + qf(R5, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で等しいので平衡。$R_5$ に電流は流れないので消す", "道の抵抗は $" + qv(A, "O") + "$ と $" + qv(B, "O") + "$　$R = \\dfrac{" + fmt(A) + " \\times " + fmt(B) + "}{" + fmt(A) + " + " + fmt(B) + "} = " + qv(ok, "O") + "$"], chk: {form: "u7s4rt", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u7s4rt：条件に合う数字が見つからない");
}
function tbU7s4_Qi(r){
  var gcd = tbU7s4_gcd, ratio = tbU7s4_ratio, par = tbU7s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var s = pick(r, [1,3,4,9]);
    var f = pick(r, [0,1]);
    var R5 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    var V = (I * A * B / (A + B));
    if (!(max(R2, R4) <= 100 && max(R1, R3) <= 100 && R1 != R3 && abs(V - Math.round(V)) < 1e-9 && V <= 240)) continue;
    var ok = (V * (A + B) / (A * B));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s4_three(ok, [{x: (V / (A + B)), why: "2つの道を直列に足した"}, {x: (V / A), why: "$R_1$・$R_3$ の道に流れる電流だけを求めた"}, {x: (V / B), why: "$R_2$・$R_4$ の道に流れる電流だけを求めた"}, {x: (V / (A * B / (A + B) + R5)), why: "電流の流れない $R_5$ を足した"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u7s4i", text: "図のブリッジで、$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$、$R_5 = " + qv(R5, "O") + "$ である。電源から流れ出る電流 $I$ は何 A か。", fig: {kind: "u7s4br", L: tbU7s4_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["r5", "{R}_5=" + qf(R5, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で平衡。$R_5$ を消すと、道の抵抗は $" + qv(A, "O") + "$ と $" + qv(B, "O") + "$、合成抵抗は $\\dfrac{" + fmt(A) + " \\times " + fmt(B) + "}{" + fmt(A) + " + " + fmt(B) + "} = " + qv(A * B / (A + B), "O") + "$", "$I = \\dfrac{" + fmt(V) + "}{" + fmt(A * B / (A + B)) + "} = " + qv(ok, "A") + "$"], chk: {form: "u7s4i", p: {V: V, R1: R1, R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u7s4i：条件に合う数字が見つからない");
}
function tbU7s4_Qpath(r){
  var gcd = tbU7s4_gcd, ratio = tbU7s4_ratio, par = tbU7s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var s = pick(r, [1,3,4,9]);
    var f = pick(r, [0,1]);
    var R5 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var m = pick(r, [1,2,3,4,5,6]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    var V = (m * A * (f == 0 ? s : 1));
    if (!(max(R2, R4) <= 100 && max(R1, R3) <= 100 && R1 != R3 && s != 1 && V <= 240)) continue;
    var ok = (V / A);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s4_three(ok, [{x: (V / B), why: "$R_2$・$R_4$ の道の電流を求めた"}, {x: (V * (A + B) / (A * B)), why: "電源から流れ出る全体の電流を求めた"}, {x: (V / (A + B)), why: "2つの道を直列に足した"}, {x: (V / R1), why: "$R_1$ だけで割った（$R_3$ も同じ道にある）"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u7s4path", text: "図のブリッジで、$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$、$R_5 = " + qv(R5, "O") + "$ である。$R_1$ に流れる電流は何 A か。", fig: {kind: "u7s4br", L: tbU7s4_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["r5", "{R}_5=" + qf(R5, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で平衡。$R_5$ を消すと、$R_1$ と $R_3$ の道に電源の電圧 $" + qv(V, "V") + "$ がかかる", "$\\dfrac{" + fmt(V) + "}{" + fmt(R1) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u7s4path", p: {V: V, R1: R1, R3: R3}}};
  }
  throw new Error("u7s4path：条件に合う数字が見つからない");
}
function tbU7s4_Qr5(r){
  var gcd = tbU7s4_gcd, ratio = tbU7s4_ratio, par = tbU7s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "変わらない", v: "same"}, {t: "2倍になる", v: "x2", why: "$R_5$ には電流が流れないので、合成抵抗に入らない"}, {t: "半分になる", v: "half", why: "$R_5$ には電流が流れないので、合成抵抗に入らない"}, {t: "0 になる", v: "zero", why: "電流が流れないのは $R_5$ だけ。2つの道には流れる"}]);
    return {form: "u7s4r5", text: "図のブリッジは平衡している。$R_5$ を2倍の抵抗に取り替えると、電源から流れ出る電流は □。", fig: {kind: "u7s4br", L: tbU7s4_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["平衡しているので $R_5$ に電流は流れず、無いものとして消せる", "$R_5$ の値は合成抵抗に入らないので、電流は変わらない"], chk: {form: "u7s4r5", p: {}}};
  }
  throw new Error("u7s4r5：条件に合う数字が見つからない");
}
// 7-5 平衡していないブリッジ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u07_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU7s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU7s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU7s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU7s5_par(a, b){ return a * b / (a + b); }
function tbU7s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU7s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU7s5_Qrt(r){
  var gcd = tbU7s5_gcd, ratio = tbU7s5_ratio, par = tbU7s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var A1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var t = pick(r, [1,3,4,9]);
    var f = pick(r, [0,1]);
    var A3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var u = pick(r, [1,3,4,9]);
    var g = pick(r, [0,1]);
    var R1 = (f == 0 ? A1 : A1 * t);
    var R2 = (f == 0 ? A1 * t : A1);
    var R3 = (g == 0 ? A3 : A3 * u);
    var R4 = (g == 0 ? A3 * u : A3);
    var P1 = (par(R1, R2));
    var P2 = (par(R3, R4));
    if (!(R2 * R3 != R1 * R4 && max(R1, R2) <= 100 && max(R3, R4) <= 100 && t + u > 2 && P1 != P2)) continue;
    var ok = (P1 + P2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s5_three(ok, [{x: (par(R1 + R3, R2 + R4)), why: "真ん中の線を消した（平衡していないので消せない）"}, {x: (R1 + R2 + R3 + R4), why: "4つの抵抗を直列と考えた"}, {x: (P1), why: "$R_1$ と $R_2$ の並列だけを見た（$R_3$ と $R_4$ の並列も直列に入る）"}, {x: (P2), why: "$R_3$ と $R_4$ の並列だけを見た（$R_1$ と $R_2$ の並列も直列に入る）"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u7s5rt", text: "図のように、ブリッジの a と b を抵抗の無い線でつないだ。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$ のとき、回路全体の合成抵抗は何 Ω か。", fig: {kind: "u7s5br", L: tbU7s5_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","pa":{},"pb":{}}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で平衡していない。a と b を1つの点と見る", "$R_1$ と $R_2$ の並列 $" + qv(P1, "O") + "$ と、$R_3$ と $R_4$ の並列 $" + qv(P2, "O") + "$ の直列　$" + fmt(P1) + " + " + fmt(P2) + " = " + qv(ok, "O") + "$"], chk: {form: "u7s5rt", p: {R1: R1, R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u7s5rt：条件に合う数字が見つからない");
}
function tbU7s5_Qv(r){
  var gcd = tbU7s5_gcd, ratio = tbU7s5_ratio, par = tbU7s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var A1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var t = pick(r, [1,3,4,9]);
    var f = pick(r, [0,1]);
    var A3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var u = pick(r, [1,3,4,9]);
    var g = pick(r, [0,1]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var R1 = (f == 0 ? A1 : A1 * t);
    var R2 = (f == 0 ? A1 * t : A1);
    var R3 = (g == 0 ? A3 : A3 * u);
    var R4 = (g == 0 ? A3 * u : A3);
    var P1 = (par(R1, R2));
    var P2 = (par(R3, R4));
    if (!(R2 * R3 != R1 * R4 && max(R1, R2) <= 100 && max(R3, R4) <= 100 && t + u > 2 && P1 != P2 && I * (P1 + P2) <= 240)) continue;
    var ok = (I * (P1 + P2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s5_three(ok, [{x: (I * par(R1 + R3, R2 + R4)), why: "真ん中の線を消した（平衡していないので消せない）"}, {x: (I * (R1 + R2 + R3 + R4)), why: "4つの抵抗を直列と考えた"}, {x: (I * P1), why: "$R_1$ と $R_2$ の並列だけに掛けた（$R_3$ と $R_4$ の並列も直列に入る）"}, {x: (I * P2), why: "$R_3$ と $R_4$ の並列だけに掛けた（$R_1$ と $R_2$ の並列も直列に入る）"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u7s5v", text: "図のように、ブリッジの a と b を抵抗の無い線でつないだ。電源から流れ出る電流は $I = " + qv(I, "A") + "$ である。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$ のとき、電源の電圧 $V$ は何 V か。", fig: {kind: "u7s5br", L: tbU7s5_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","pa":{},"pb":{}}, [["i", "{I}=" + qf(I, "A")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["平衡していないので、a と b を1つの点と見る。合成抵抗は $" + fmt(P1) + " + " + fmt(P2) + " = " + qv(P1 + P2, "O") + "$", "$V = " + fmt(P1 + P2) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u7s5v", p: {I: I, R1: R1, R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u7s5v：条件に合う数字が見つからない");
}
function tbU7s5_Qcan(r){
  var gcd = tbU7s5_gcd, ratio = tbU7s5_ratio, par = tbU7s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var A1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var t = pick(r, [1,3,4,9]);
    var f = pick(r, [0,1]);
    var A3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var u = pick(r, [1,3,4,9]);
    var g = pick(r, [0,1]);
    var R1 = (f == 0 ? A1 : A1 * t);
    var R2 = (f == 0 ? A1 * t : A1);
    var R3 = (g == 0 ? A3 : A3 * u);
    var R4 = (g == 0 ? A3 * u : A3);
    if (!(R2 * R3 != R1 * R4 && max(R1, R2) <= 100 && max(R3, R4) <= 100)) continue;
    var _c = choices(r, [{t: "電流が流れるので、消せない", v: "own"}, {t: "電流が流れないので、消せる", v: "flow0", why: "$R_2 R_3 = " + fmt(R2 * R3) + "$ と $R_1 R_4 = " + fmt(R1 * R4) + "$ は等しくないので平衡していない"}, {t: "抵抗が無いので、いつでも消せる", v: "always", why: "消してよいのは電流が流れない時だけ"}, {t: "a と b を別の点として残す", v: "sep", why: "線でつながった a と b は、同じ電位の1つの点"}]);
    return {form: "u7s5can", text: "図のように、ブリッジの a と b を抵抗の無い線でつないだ。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$ のとき、真ん中の線は □。", fig: {kind: "u7s5br", L: tbU7s5_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","pa":{},"pb":{}}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で等しくないので平衡していない", "真ん中の線には電流が流れるので、消せない"], chk: {form: "u7s5can", p: {R1: R1, R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u7s5can：条件に合う数字が見つからない");
}
function tbU7s5_Qva(r){
  var gcd = tbU7s5_gcd, ratio = tbU7s5_ratio, par = tbU7s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var A1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var t = pick(r, [1,3,4,9]);
    var f = pick(r, [0,1]);
    var A3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var u = pick(r, [1,3,4,9]);
    var g = pick(r, [0,1]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var R1 = (f == 0 ? A1 : A1 * t);
    var R2 = (f == 0 ? A1 * t : A1);
    var R3 = (g == 0 ? A3 : A3 * u);
    var R4 = (g == 0 ? A3 * u : A3);
    var P1 = (par(R1, R2));
    var P2 = (par(R3, R4));
    var V = (I * (P1 + P2));
    if (!(R2 * R3 != R1 * R4 && max(R1, R2) <= 100 && max(R3, R4) <= 100 && t + u > 2 && abs(V - Math.round(V)) < 1e-9 && V <= 240)) continue;
    var ok = (V * P2 / (P1 + P2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU7s5_three(ok, [{x: (V * P1 / (P1 + P2)), why: "$R_1$ と $R_2$ の並列にかかる電圧を出した"}, {x: (V / 2), why: "電圧が半分ずつに分かれると考えた"}, {x: (V), why: "＋極の側の線と同じ電位とした（$R_1$ と $R_2$ の並列で下がる分を引いていない）"}, {x: (V * R3 / (R1 + R3)), why: "真ん中の線を消して、$R_1$ と $R_3$ の道だけで分けた"}, {x: (V - V * R3 / (R1 + R3)), why: "真ん中の線を消して、$R_1$ にかかる電圧を出した"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u7s5va", text: "図のように、ブリッジの a と b を抵抗の無い線でつないだ。$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$ のとき、－極を $0\\,\\mathrm{V}$ とすると、点 a の電位は何 V か。", fig: {kind: "u7s5br", L: tbU7s5_fig({"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","pa":{},"pb":{}}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["pa", {"v":""}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["a と b を1つの点と見ると、並列 $" + qv(P1, "O") + "$ と並列 $" + qv(P2, "O") + "$ の直列。電圧はこの比に分かれる", "点 a の電位は、$R_3$ と $R_4$ の並列にかかる電圧　$" + fmt(V) + " \\times \\dfrac{" + fmt(P2) + "}{" + fmt(P1) + " + " + fmt(P2) + "} = " + qv(ok, "V") + "$"], chk: {form: "u7s5va", p: {V: V, R1: R1, R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u7s5va：条件に合う数字が見つからない");
}
var GEN = {
  // 7-1 ブリッジ回路の形
  1: function(r){ return pick(r, [tbU7s1_Qfirst, tbU7s1_Qfirst, tbU7s1_Qlast, tbU7s1_Qgal, tbU7s1_Qnode, tbU7s1_Qnode, tbU7s1_Qcount])(r); },
  // 7-2 ブリッジの平衡
  2: function(r){ return pick(r, [tbU7s2_Qdir, tbU7s2_Qdir, tbU7s2_Qsame, tbU7s2_Qname, tbU7s2_Qpot, tbU7s2_Qpot, tbU7s2_Qdir2, tbU7s2_Qdir2])(r); },
  // 7-3 平衡条件
  3: function(r){ return pick(r, [tbU7s3_Qcond, tbU7s3_Qpair, tbU7s3_Qx4, tbU7s3_Qx4, tbU7s3_Qx1, tbU7s3_Qx2])(r); },
  // 7-4 平衡なら真ん中を消す
  4: function(r){ return pick(r, [tbU7s4_Qrt, tbU7s4_Qrt, tbU7s4_Qi, tbU7s4_Qi, tbU7s4_Qi, tbU7s4_Qpath, tbU7s4_Qr5])(r); },
  // 7-5 平衡していないブリッジ
  5: function(r){ return pick(r, [tbU7s5_Qrt, tbU7s5_Qrt, tbU7s5_Qv, tbU7s5_Qv, tbU7s5_Qv, tbU7s5_Qcan, tbU7s5_Qva])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t7s1e","scene":"t7s1e","kind":"u7s1br","lab":{"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}},"viewbox":"406 340 713 350","band":{"want":"ブリッジ回路の形","ans":"4つの抵抗の間を、検流計でつないだ回路","full":"電源の＋極から2つの抵抗に分かれ、その先の点 a・b の間を検流計でつなぎ、さらに2つの抵抗を通って－極へ戻る回路をブリッジ回路という。検流計は、電流が流れているかと、その向きを調べる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"①2つに分かれる\n②検流計\n③4つの抵抗\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"電源の＋極から出た電流は、$R_1$ と $R_2$ の2つの道に分かれます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R1","R2"]},{"text":"$R_1$ の先が点 a、$R_2$ の先が点 b です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","Pa","Pb"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"点 a と点 b の間に、検流計 G がつながっています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["G","Pa","Pb"]},{"text":"検流計は、〖電流が流れているかと、どちらの向きに流れているかを調べる計器〗です。","at":{"強調":1.0},"after":[],"emph":["G"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"a・b の先には $R_3$ と $R_4$ があり、2つの道は1つに戻って－極へ帰ります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R3","R4","src"]},{"text":"描き方が違っても、〖つながり方が同じならブリッジ回路〗です。抵抗が4つあれば、ブリッジ回路かもしれないと考えます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R4"]},{"text":"このように、〖4つの抵抗の間を検流計でつないだ回路〗を、ブリッジ回路といいます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["R1","R2","R3","R4","G"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"Pa":["da","na","pat0","pat1"],"G":["g","g:t","gt0","gt1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s1brL","u7s1brw3","u7s1brw5","u7s1brw7","u7s1brw11"],"zlo":["u7s1brw2","u7s1brw4","u7s1brw6","u7s1brw10","u7s1brw14"],"zmid":["u7s1brw8","u7s1brw9","u7s1brw15","u7s1brw16","u7s1brw19","u7s1brw12","u7s1brw13","u7s1brw17","u7s1brw18","u7s1brw20"]},"moves":{},"route":["2つに分かれる","検流計","4つの抵抗"]}},{"id":"t7s1x","scene":"t7s1x","kind":"u7s1br","lab":{"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}},"viewbox":"406 340 713 350","band":{"want":"＋極から出た電流が、最初に分かれて通る2つの抵抗","ans":"$R_1$ と $R_2$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、電源の＋極から出た電流が、最初に分かれて通る2つの抵抗です。","at":{"強調":1.0},"after":[],"emph":["src"]},{"text":"①＋極から見る\n②分かれた先\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"＋極から出た線は、〖抵抗を通る前に2つの道に分かれます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"$R_3$ と $R_4$ は、点 a・b を通った後の抵抗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R3","R4","Pa","Pb"]},{"text":"分かれた先にすぐあるのは〖$R_1$ と $R_2$〗です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["R1","R2"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"Pa":["da","na","pat0","pat1"],"G":["g","g:t","gt0","gt1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s1brL","u7s1brw3","u7s1brw5","u7s1brw7","u7s1brw11"],"zlo":["u7s1brw2","u7s1brw4","u7s1brw6","u7s1brw10","u7s1brw14"],"zmid":["u7s1brw8","u7s1brw9","u7s1brw15","u7s1brw16","u7s1brw19","u7s1brw12","u7s1brw13","u7s1brw17","u7s1brw18","u7s1brw20"]},"moves":{},"route":["＋極から見る","分かれた先"]}},{"id":"t7s2e","scene":"t7s2e","kind":"u7s2bal","lab":{"pm":1,"src":"{V}=12 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{"v":"8 V"},"pb":{"v":"8 V"}},"viewbox":"440 340 800 440","band":{"want":"検流計に電流が流れない時","ans":"a と b の電位が同じ時（平衡）","full":"電流は電位の高い所から低い所へ流れる。点 a と点 b の電位が同じなら、検流計に電流は流れない。この状態を、ブリッジが平衡しているという。"},"narr":{"start":{"co":1,"pao":0,"pbo":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"①高い所から低い所へ\n②同じ電位なら\n③平衡\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"電流は、〖電位の高い所から低い所へ流れます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]},{"text":"点 a の電位が点 b より高ければ、検流計には a から b へ電流が流れます。","at":{"強調":1.0},"after":[],"emph":["Pa","Pb","G"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"では、a と b の電位が同じならどうなるでしょう。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pa","Pb"]},{"text":"電源の電圧が $12\\,\\mathrm{V}$ で、a も b も $8\\,\\mathrm{V}$ だったとします。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["src","Pa","Pb"],"move":"pv","zb":true},{"text":"高い方も低い方も無いので、〖検流計に電流は流れません〗。","at":{"強調":1.0},"after":[],"emph":["G","Pa","Pb"],"zb":true}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"このように、〖a と b の電位が同じで、検流計に電流が流れない状態〗を、ブリッジが平衡しているといいます。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["G","Pa","Pb"],"ans":true,"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"R4":["r4","r4t0","r4t1"],"Pa":["da","na","pat0","pat1"],"G":["g","g:t","gt0","gt1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s2balL","u7s2balw3","u7s2balw5","u7s2balw7","u7s2balw11","zbu7s2bal0hi"],"zlo":["u7s2balw2","u7s2balw4","u7s2balw6","u7s2balw10","u7s2balw14","zbu7s2bal1lo"],"zmid":["u7s2balw8","u7s2balw9","u7s2balw15","u7s2balw16","u7s2balw19","zbu7s2bal2mid","u7s2balw12","u7s2balw13","u7s2balw17","u7s2balw18","u7s2balw20","zbu7s2bal3mid"]},"moves":{"pv":{"to":{"pao":1,"pbo":1},"dur":0.5}},"route":["高い所から低い所へ","同じ電位なら","平衡"]}},{"id":"t7s2x","scene":"t7s2x","kind":"u7s2unb","lab":{"pm":1,"src":"{V}=15 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","v1":"{V}_1=3 V","v2":"{V}_2=9 V","pa":{"v":"12 V"},"pb":{"v":"6 V"}},"viewbox":"440 340 800 440","band":{"want":"検流計に流れる電流の向き","known":"$V = 15\\,\\mathrm{V},\\;\\; V_1 = 3\\,\\mathrm{V},\\;\\; V_2 = 9\\,\\mathrm{V}$","ans":"a から b へ"},"narr":{"start":{"co":1,"pao":0,"pbo":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、検流計 G に流れる電流の向きです。","at":{"強調":1.0},"after":[],"emph":["G"]},{"text":"向きは a と b の電位で決まるので、先に電位を出します。\n①a と b の電位\n②高い方から低い方へ\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Pa","Pb"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"－極を $0\\,\\mathrm{V}$ とすると、＋極の側の線は $15\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]},{"text":"a の電位は、〖$15\\,\\mathrm{V}$ から $R_1$ で下がった $V_1$ を引いた値〗です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R1","V1","Pa"],"eq":[{"cont":false,"items":[["15 - 3 = 12\\,\\mathrm{V}"]]}],"move":"pav","emphPre":["src","R1","V1","Pa"],"zb":true},{"text":"b の電位も同じように、$V_2$ を引いて出します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R2","V2","Pb"],"eq":[{"cont":false,"items":[["15 - 9 = 6\\,\\mathrm{V}"]]}],"move":"pbv","emphPre":["src","R2","V2","Pb"],"zb":true}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"a の $12\\,\\mathrm{V}$ の方が、b の $6\\,\\mathrm{V}$ より高いです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pa","Pb"],"zb":true},{"text":"電流は高い所から低い所へ流れるので、〖a から b へ流れます〗。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["G","Pa","Pb"],"ans":true,"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"R4":["r4","r4t0","r4t1"],"Pa":["da","na","pat0","pat1"],"G":["g","g:t","gt0","gt1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s2unbL","u7s2unbw3","u7s2unbw5","u7s2unbw7","u7s2unbw11","zbu7s2unb0hi"],"zlo":["u7s2unbw2","u7s2unbw4","u7s2unbw6","u7s2unbw10","u7s2unbw14","zbu7s2unb1lo"],"zmid":["u7s2unbw8","u7s2unbw9","u7s2unbw15","u7s2unbw16","u7s2unbw19","zbu7s2unb2mid"],"zmid2":["u7s2unbw12","u7s2unbw13","u7s2unbw17","u7s2unbw18","u7s2unbw20","zbu7s2unb3mid2"]},"moves":{"pav":{"to":{"pao":1},"dur":0.4},"pbv":{"to":{"pbo":1},"dur":0.4}},"route":["a と b の電位","高い方から低い方へ"]}},{"id":"t7s3e","scene":"t7s3e","kind":"u7s3br","lab":{"pm":1,"src":"{V}","r1":["{R}_1","{R}_1=2 Ω"],"r2":["{R}_2","{R}_2=6 Ω"],"r3":["{R}_3","{R}_3=4 Ω"],"r4":["{R}_4","{R}_4=12 Ω"],"g":"G","pa":{},"pb":{},"v1":"{V}_1","v2":"{V}_2","v3":"{V}_3","v4":"{V}_4","i1":"{I}_1","i2":"{I}_2","i3":"{I}_3","i4":"{I}_4"},"viewbox":"399 340 926 540","band":{"want":"ブリッジが平衡する条件","ans":"向かい合う抵抗の積が等しい　$R_2 R_3 = R_1 R_4$","full":"平衡しているとき、a と b は同じ電位なので V1 = V2、V3 = V4。検流計に電流が流れないので I1 = I3、I2 = I4。これらから R2 R3 = R1 R4（向かい合う抵抗の積が等しい）が出る。これを平衡条件という。"},"narr":{"start":{"co":1,"v1d":0,"v2d":0,"v3d":0,"v4d":0,"i1d":0,"i2d":0,"i3d":0,"i4d":0,"r1v":0,"r2v":0,"r3v":0,"r4v":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"①電圧が等しい\n②電流が等しい\n③向かい合う抵抗の積\n④数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"平衡しているとき、〖a と b は同じ電位〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Pa","Pb","G"],"zb":true},{"text":"＋極の側の線と a・b の間の $R_1$ と $R_2$、a・b と－極の側の線の間の $R_3$ と $R_4$ には、〖それぞれ等しい電圧がかかります〗。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R4","V1","V2","V3","V4","Pa","Pb"],"move":"v14","eq":[{"cont":false,"items":[["V_1 = V_2"],["V_3 = V_4"]]}],"emphPre":["R1","R2","R3","R4","V1","V2","V3","V4","Pa","Pb"],"zb":true},{"text":"オームの法則で、電圧を抵抗と電流の積で表します。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R4","I1","I2","I3","I4"],"move":"iarr","eq":[{"cont":false,"items":[["R_1 I_1 = R_2 I_2"],["R_3 I_3 = R_4 I_4"]]}],"emphPre":["R1","R2","R3","R4","I1","I2","I3","I4"]}]},{"cap":null,"eqp":null,"vid":[5,7],"sents":[{"text":"〖検流計には電流が流れない〗ので、a に入る $I_1$ はそのまま $R_3$ へ、b に入る $I_2$ はそのまま $R_4$ へ流れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I1","I2","I3","I4","R3","R4","Pa","Pb","G"],"eq":[{"cont":false,"items":[["I_1 = I_3"],["I_2 = I_4"]]}],"emphPre":["I1","I2","I3","I4","R3","R4","Pa","Pb","G"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"2つ目の式の $I_3$・$I_4$ を $I_1$・$I_2$ に置き換えて、2つの式をどちらも $\\dfrac{I_1}{I_2}$ の形にします。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["I1","I2","I3","I4","R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{I_1}{I_2} = \\dfrac{R_2}{R_1}"],["\\dfrac{I_1}{I_2} = \\dfrac{R_4}{R_3}"]]}],"emphPre":["I1","I2","I3","I4","R1","R2","R3","R4"]},{"text":"左辺が同じなので、右辺も等しくなります。両辺に $R_1 R_3$ を掛けます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{R_2}{R_1} = \\dfrac{R_4}{R_3}"],["R_2 R_3 = R_1 R_4"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"$R_2$ と $R_3$、$R_1$ と $R_4$ は、それぞれ向かい合う抵抗です。〖向かい合う抵抗の積が等しい〗ことを、平衡条件といいます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R4"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"$R_1 = 2\\,\\Omega$、$R_2 = 6\\,\\Omega$、$R_3 = 4\\,\\Omega$、$R_4 = 12\\,\\Omega$ のとき、向かい合う抵抗の積はどちらも $24$ で等しいので、このブリッジは平衡します。","at":{"道筋":1.0,"強調":1.0,"動き":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["R1","R2","R3","R4"],"move":"vals","eq":[{"cont":false,"items":[["R_2 R_3 = 6 \\times 4 = 24"],["R_1 R_4 = 2 \\times 12 = 24"]]}],"ans":true,"emphPre":["R1","R2","R3","R4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"R3":["r3","r3t0","r3t1"],"V3":["v3d:e","v3d:f","v3d:a","v3t0","v3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R4":["r4","r4t0","r4t1"],"V4":["v4d:e","v4d:f","v4d:a","v4t0","v4t1"],"I4":["i4a","i4a:h","i4t0","i4t1"],"Pa":["da","na","pat0","pat1"],"G":["g","g:t","gt0","gt1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s3brL","u7s3brw3","u7s3brw5","u7s3brw7","u7s3brw11","zbu7s3br0hi"],"zlo":["u7s3brw2","u7s3brw4","u7s3brw6","u7s3brw10","u7s3brw14","zbu7s3br1lo"],"zmid":["u7s3brw8","u7s3brw9","u7s3brw15","u7s3brw16","u7s3brw19","zbu7s3br2mid","u7s3brw12","u7s3brw13","u7s3brw17","u7s3brw18","u7s3brw20","zbu7s3br3mid"]},"moves":{"v14":{"to":{"v1d":1,"v2d":1,"v3d":1,"v4d":1},"dur":0.8},"iarr":{"to":{"i1d":1,"i2d":1,"i3d":1,"i4d":1},"dur":0.8},"vals":{"to":{"r1v":1,"r2v":1,"r3v":1,"r4v":1},"dur":0.6}},"route":["電圧が等しい","電流が等しい","向かい合う抵抗の積","数字で見る"]}},{"id":"t7s3x","scene":"t7s3x","kind":"u7s3br","lab":{"pm":1,"src":"{V}","r1":"{R}_1=3 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","r4":["{R}_4","{R}_4=24 Ω"],"g":"G","pa":{},"pb":{}},"viewbox":"399 340 926 540","band":{"want":"$R_4$","known":"$R_1 = 3\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 6\\,\\Omega$","ans":"$R_4 = 24\\,\\Omega$"},"narr":{"start":{"co":1,"r4v":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは $R_4$ です。","at":{"強調":1.0},"after":[],"emph":["R4"]},{"text":"①平衡している\n②平衡条件\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R4"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"検流計に電流が流れないので、ブリッジは平衡しています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["G","Pa","Pb"]},{"text":"平衡しているので、〖向かい合う抵抗の積が等しくなります〗。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R4"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う組は、〖$R_2$ と $R_3$、$R_1$ と $R_4$〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["R_2 R_3 = R_1 R_4"],["12 \\times 6 = 3 \\times R_4"],["R_4 = \\dfrac{72}{3} = 24\\,\\Omega"]]}],"move":"r4val","ans":true,"emphPre":["R1","R2","R3","R4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"R3":["r3","r3t0","r3t1"],"V3":["v3d:e","v3d:f","v3d:a","v3t0","v3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R4":["r4","r4t0","r4t1"],"V4":["v4d:e","v4d:f","v4d:a","v4t0","v4t1"],"I4":["i4a","i4a:h","i4t0","i4t1"],"Pa":["da","na","pat0","pat1"],"G":["g","g:t","gt0","gt1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s3brL","u7s3brw3","u7s3brw5","u7s3brw7","u7s3brw11","zbu7s3br0hi"],"zlo":["u7s3brw2","u7s3brw4","u7s3brw6","u7s3brw10","u7s3brw14","zbu7s3br1lo"],"zmid":["u7s3brw8","u7s3brw9","u7s3brw15","u7s3brw16","u7s3brw19","zbu7s3br2mid","u7s3brw12","u7s3brw13","u7s3brw17","u7s3brw18","u7s3brw20","zbu7s3br3mid"]},"moves":{"r4val":{"to":{"r4v":1},"dur":0.4}},"route":["平衡している","平衡条件"]}},{"id":"t7s4e","scene":"t7s4e","kind":"u7s4br","lab":{"pm":1,"src":"{V}=36 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=8 Ω","r4":"{R}_4=12 Ω","r5":"{R}_5=10 Ω","i5":["{I}_5","{I}_5=0 A"]},"viewbox":"440 340 666 450","band":{"want":"平衡しているブリッジの電流 $I$","ans":"真ん中を消して、2つの道の並列で解く","full":"向かい合う抵抗の積が等しければ平衡していて、真ん中の抵抗に電流は流れない。電流の流れない所は無いものとして消してよい。消すと、R1・R3 の道と R2・R4 の道の並列になる。"},"narr":{"start":{"co":1,"i5v":0,"i5d":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、電源から流れ出る電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["src"]},{"text":"①平衡を確かめる\n②真ん中を消す\n③合成抵抗と電流\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う抵抗の積を比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["R_2 R_3 = 6 \\times 8 = 48"],["R_1 R_4 = 4 \\times 12 = 48"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"等しいので、ブリッジは平衡しています。〖真ん中の $R_5$ に電流は流れません〗。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R5","I5"],"move":"i5","zb":true}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"〖電流の流れない所は、無いものとして消してよい〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R5"]},{"text":"消すと、〖$R_1$ と $R_3$ の道、$R_2$ と $R_4$ の道の2つが並列になります〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R3","R2","R4"],"eq":[{"cont":false,"items":[["R_1 + R_3 = 4 + 8 = 12\\,\\Omega"],["R_2 + R_4 = 6 + 12 = 18\\,\\Omega"]]}],"emphPre":["R1","R3","R2","R4"]},{"text":"$R_5$ の $10\\,\\Omega$ は、〖合成抵抗に入りません〗。","at":{"強調":1.0},"after":[],"emph":["R5"]}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"2つの道の並列なので、合成抵抗 $R$ は和分の積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{12 \\times 18}{12 + 18} = 7.2\\,\\Omega"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"電流はオームの法則 $I = \\dfrac{V}{R}$ で求めます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["src","R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{36}{7.2} = 5\\,\\mathrm{A}"]]}],"ans":true,"emphPre":["src","R1","R2","R3","R4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"R5":["r5","r5t0","r5t1"],"I5":["i5a","i5a:h","i5t0","i5t1"],"zhi":["u7s4brL","u7s4brw3","u7s4brw5","u7s4brw7","u7s4brw11","zbu7s4br0hi"],"zlo":["u7s4brw2","u7s4brw4","u7s4brw6","u7s4brw10","u7s4brw14","zbu7s4br1lo"],"zmid":["u7s4brw8","u7s4brw9","u7s4brw15","zbu7s4br2mid","u7s4brw12","u7s4brw13","u7s4brw16","zbu7s4br3mid"]},"moves":{"i5":{"to":{"i5d":1,"i5v":1},"dur":0.5}},"route":["平衡を確かめる","真ん中を消す","合成抵抗と電流"]}},{"id":"t7s4x","scene":"t7s4x","kind":"u7s4br","lab":{"pm":1,"src":"{V}=54 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","r3":"{R}_3=12 Ω","r4":"{R}_4=6 Ω","r5":"{R}_5=8 Ω","i5":["{I}_5","{I}_5=0 A"]},"viewbox":"440 340 666 450","band":{"want":"電源から流れ出る電流 $I$","known":"$V = 54\\,\\mathrm{V},\\;\\; R_1 = 6\\,\\Omega,\\;\\; R_2 = 3\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega,\\;\\; R_4 = 6\\,\\Omega,\\;\\; R_5 = 8\\,\\Omega$","ans":"$I = 9\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i5v":0,"i5d":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、電源から流れ出る電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["src"]},{"text":"①平衡を確かめる\n②真ん中を消す\n③合成抵抗と電流\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う抵抗の積を比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["R_2 R_3 = 3 \\times 12 = 36"],["R_1 R_4 = 6 \\times 6 = 36"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"等しいので平衡していて、〖$R_5$ に電流は流れません〗。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R5","I5"],"move":"i5","zb":true}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"$R_5$ を消すと、〖2つの道の並列になります〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R5"]},{"text":"それぞれの道の抵抗を足します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R3","R2","R4"],"eq":[{"cont":false,"items":[["R_1 + R_3 = 6 + 12 = 18\\,\\Omega"],["R_2 + R_4 = 3 + 6 = 9\\,\\Omega"]]}],"emphPre":["R1","R3","R2","R4"]}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"合成抵抗は和分の積で、電流はオームの法則で出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["src","R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{18 \\times 9}{18 + 9} = 6\\,\\Omega"],["\\dfrac{54}{6} = 9\\,\\mathrm{A}"]]}],"ans":true,"emphPre":["src","R1","R2","R3","R4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"R5":["r5","r5t0","r5t1"],"I5":["i5a","i5a:h","i5t0","i5t1"],"zhi":["u7s4brL","u7s4brw3","u7s4brw5","u7s4brw7","u7s4brw11","zbu7s4br0hi"],"zlo":["u7s4brw2","u7s4brw4","u7s4brw6","u7s4brw10","u7s4brw14","zbu7s4br1lo"],"zmid":["u7s4brw8","u7s4brw9","u7s4brw15","zbu7s4br2mid","u7s4brw12","u7s4brw13","u7s4brw16","zbu7s4br3mid"]},"moves":{"i5":{"to":{"i5d":1,"i5v":1},"dur":0.5}},"route":["平衡を確かめる","真ん中を消す","合成抵抗と電流"]}},{"id":"t7s5e","scene":"t7s5e","kind":"u7s5br","lab":{"pm":1,"src":"{V}=30 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","r3":"{R}_3=4 Ω","r4":"{R}_4=12 Ω","pa":{},"pb":{}},"viewbox":"440 340 654 450","band":{"want":"平衡していないブリッジの電流 $I$","ans":"真ん中は消さず、a と b を1つの点と見て解く","full":"向かい合う抵抗の積が等しくなければ平衡していないので、真ん中に電流が流れ、消すことはできない。真ん中が抵抗の無い線なら a と b は1つの点なので、R1 と R2、R3 と R4 がそれぞれ並列になり、その2つが直列につながる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、電源から流れ出る電流 $I$ です。真ん中の a と b は抵抗の無い線でつながっています。","at":{"強調":1.0},"after":[],"emph":["src","Pa","Pb"]},{"text":"①平衡を確かめる\n②a と b を1つの点に\n③合成抵抗と電流\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う抵抗の積を比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["R_2 R_3 = 3 \\times 4 = 12"],["R_1 R_4 = 6 \\times 12 = 72"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"等しくないので、平衡していません。〖真ん中の線には電流が流れるので、消すことはできません〗。","at":{"強調":1.0},"after":[],"emph":["Pa","Pb"]}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"線でつながった a と b は、〖同じ電位の1つの点〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pa","Pb","zmid"],"zb":true},{"text":"$R_1$ と $R_2$ は、どちらも＋極の側の線と a・b の間にあるので並列です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","zhi","zmid"],"zb":true},{"text":"$R_3$ と $R_4$ も、a・b と－極の側の線の間にあるので並列です。","at":{"強調":1.0},"after":[],"emph":["R3","R4","zmid","zlo"],"zb":true},{"text":"それぞれの並列の合成抵抗は、和分の積です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{6 \\times 3}{6 + 3} = 2\\,\\Omega"],["\\dfrac{4 \\times 12}{4 + 12} = 3\\,\\Omega"]]}],"emphPre":["R1","R2","R3","R4"]}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"〖2つの並列が直列につながっている〗ので、足して合成抵抗 $R$ を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["2 + 3 = 5\\,\\Omega"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"電流はオームの法則 $I = \\dfrac{V}{R}$ で求めます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["src"],"eq":[{"cont":false,"items":[["\\dfrac{30}{5} = 6\\,\\mathrm{A}"]]}],"ans":true,"emphPre":["src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"I":["ia","ia:h","it0","it1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"Pa":["da","na","pat0","pat1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s5brL","u7s5brw3","u7s5brw5","u7s5brw7","u7s5brw11","zbu7s5br0hi"],"zlo":["u7s5brw2","u7s5brw4","u7s5brw6","u7s5brw10","u7s5brw14","zbu7s5br1lo"],"zmid":["u7s5brw8","u7s5brw9","u7s5brw12","u7s5brw13","u7s5brw15","u7s5brw16","u7s5brw17","u7s5brw18","u7s5brw19","u7s5brw20","zbu7s5br2mid"]},"moves":{},"route":["平衡を確かめる","a と b を1つの点に","合成抵抗と電流"]}},{"id":"t7s5x","scene":"t7s5x","kind":"u7s5br","lab":{"pm":1,"src":"{V}=60 V","r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","r4":"{R}_4=3 Ω","pa":{},"pb":{}},"viewbox":"440 340 654 450","band":{"want":"電源から流れ出る電流 $I$","known":"$V = 60\\,\\mathrm{V},\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 6\\,\\Omega,\\;\\; R_4 = 3\\,\\Omega$","ans":"$I = 12\\,\\mathrm{A}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、電源から流れ出る電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["src"]},{"text":"①平衡を確かめる\n②a と b を1つの点に\n③合成抵抗と電流\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う抵抗の積は $12 \\times 6 = 72$ と $4 \\times 3 = 12$ で、等しくありません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3","R4"]},{"text":"平衡していないので、〖真ん中の線は消せません〗。","at":{"強調":1.0},"after":[],"emph":["Pa","Pb"]}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"a と b を1つの点と見ると、〖$R_1$ と $R_2$、$R_3$ と $R_4$ がそれぞれ並列〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2","R3","R4","Pa","Pb"],"eq":[{"cont":false,"items":[["\\dfrac{4 \\times 12}{4 + 12} = 3\\,\\Omega"],["\\dfrac{6 \\times 3}{6 + 3} = 2\\,\\Omega"]]}],"emphPre":["R1","R2","R3","R4","Pa","Pb"],"zb":true}]},{"cap":null,"eqp":null,"vid":[3,7],"sents":[{"text":"2つの並列は直列なので足し、電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["src","R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["3 + 2 = 5\\,\\Omega"],["\\dfrac{60}{5} = 12\\,\\mathrm{A}"]]}],"ans":true,"emphPre":["src","R1","R2","R3","R4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"I":["ia","ia:h","it0","it1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"Pa":["da","na","pat0","pat1"],"Pb":["db","nb","pbt0","pbt1"],"zhi":["u7s5brL","u7s5brw3","u7s5brw5","u7s5brw7","u7s5brw11","zbu7s5br0hi"],"zlo":["u7s5brw2","u7s5brw4","u7s5brw6","u7s5brw10","u7s5brw14","zbu7s5br1lo"],"zmid":["u7s5brw8","u7s5brw9","u7s5brw12","u7s5brw13","u7s5brw15","u7s5brw16","u7s5brw17","u7s5brw18","u7s5brw19","u7s5brw20","zbu7s5br2mid"]},"moves":{},"route":["平衡を確かめる","a と b を1つの点に","合成抵抗と電流"]}}],"secs":[{"ex":{"text":"図のブリッジ回路で、電源の＋極から出た電流が、最初に分かれて通る2つの抵抗はどれか。","fig":{"kind":"u7s1br","L":{"pm":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","pa":{},"pb":{}},"P":{}},"ch":[{"t":"$R_1$ と $R_2$","v":"12","why":""},{"t":"$R_3$ と $R_4$","v":"34","why":"$R_3$ と $R_4$ は、－極へ帰る前に通る2つ"},{"t":"$R_1$ と $R_3$","v":"13","why":"点 a を通ってつながる、同じ道の2つ"},{"t":"$R_2$ と $R_4$","v":"24","why":"点 b を通ってつながる、同じ道の2つ"}],"ans":0}},{"ex":{"text":"図のブリッジで、電源の電圧は $V = 15\\,\\mathrm{V}$、$R_1$ にかかる電圧は $V_1 = 3\\,\\mathrm{V}$、$R_2$ にかかる電圧は $V_2 = 9\\,\\mathrm{V}$ である。検流計 G に流れる電流の向きはどれか。","fig":{"kind":"u7s2unb","L":{"pm":1,"src":"{V}=15 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","g":"G","v1":"{V}_1=3 V","v2":"{V}_2=9 V","pa":{},"pb":{}},"P":{}},"ch":[{"t":"a から b へ","v":"ab","why":""},{"t":"b から a へ","v":"ba","why":"向きが逆（a は 12 V、b は 6 V で、電流は高い a から低い b へ流れる）"},{"t":"流れない","v":"0","why":"a は 12 V、b は 6 V で電位が違うので流れる"},{"t":"抵抗の値が分からないので決まらない","v":"none","why":"向きは a と b の電位だけで決まる"}],"ans":0}},{"ex":{"text":"図のブリッジで、検流計 G に電流が流れなかった。$R_1 = 3\\,\\Omega$、$R_2 = 12\\,\\Omega$、$R_3 = 6\\,\\Omega$ のとき、$R_4$ は何 Ω か。","fig":{"kind":"u7s3br","L":{"pm":1,"src":"{V}","r1":"{R}_1=3 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","r4":"{R}_4","g":"G","pa":{},"pb":{}},"P":{}},"ch":[{"t":"$6\\,\\Omega$","v":6,"why":"向かい合っていない $R_1$ と $R_2$、$R_3$ と $R_4$ の積を等しくした"},{"t":"$24\\,\\Omega$","v":24,"why":""},{"t":"$1.5\\,\\Omega$","v":1.5,"why":"同じ道の $R_1$ と $R_3$、$R_2$ と $R_4$ の積を等しくした"},{"t":"$15\\,\\Omega$","v":15,"why":"積でなく和を等しくした（$R_1 + R_4 = R_2 + R_3$）"}],"ans":1}},{"ex":{"text":"図のブリッジで、$V = 54\\,\\mathrm{V}$、$R_1 = 6\\,\\Omega$、$R_2 = 3\\,\\Omega$、$R_3 = 12\\,\\Omega$、$R_4 = 6\\,\\Omega$、$R_5 = 8\\,\\Omega$ である。電源から流れ出る電流 $I$ は何 A か。","fig":{"kind":"u7s4br","L":{"pm":1,"src":"{V}=54 V","r1":"{R}_1=6 Ω","r2":"{R}_2=3 Ω","r3":"{R}_3=12 Ω","r4":"{R}_4=6 Ω","r5":"{R}_5=8 Ω","pa":{},"pb":{}},"P":{}},"ch":[{"t":"$3\\,\\mathrm{A}$","v":3,"why":"$R_1$・$R_3$ の道に流れる電流だけを求めた"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"$R_2$・$R_4$ の道に流れる電流だけを求めた"},{"t":"$9\\,\\mathrm{A}$","v":9,"why":""},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"4つの抵抗を直列と考えた"}],"ans":2}},{"ex":{"text":"図のように、ブリッジの a と b を抵抗の無い線でつないだ。$V = 60\\,\\mathrm{V}$、$R_1 = 4\\,\\Omega$、$R_2 = 12\\,\\Omega$、$R_3 = 6\\,\\Omega$、$R_4 = 3\\,\\Omega$ のとき、電源から流れ出る電流 $I$ は何 A か。","fig":{"kind":"u7s5br","L":{"pm":1,"src":"{V}=60 V","r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","r4":"{R}_4=3 Ω","pa":{},"pb":{}},"P":{}},"ch":[{"t":"$10\\,\\mathrm{A}$","v":10,"why":"真ん中の線を消して計算した（平衡していないので消せない）"},{"t":"$20\\,\\mathrm{A}$","v":20,"why":"$R_1$ と $R_2$ の並列だけで割った（$R_3$ と $R_4$ の並列も直列に入る）"},{"t":"$2.4\\,\\mathrm{A}$","v":2.4,"why":"4つの抵抗を直列と考えた"},{"t":"$12\\,\\mathrm{A}$","v":12,"why":""}],"ans":3}}],"past":[]}};
});
