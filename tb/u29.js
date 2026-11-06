/* 単元29「ベクトル図」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(29, function(H){
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
    put(3, function(){ tbFig_PlaceL(d, RM, "pa" + k + S, L2, p, "a" + k, oo, cands); });
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
// ---- 29-1 ベクトル表示 の図（※ textbook/gen/make_section.py が textbook/gen/data/u29_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U29S1K = {
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU29s1pv(d, p, L){ tbFig_Draw(d, p, L, U29S1K.pv); }
// ---- 29-2 同じ向き・逆向き の図（※ textbook/gen/make_section.py が textbook/gen/data/u29_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U29S2K = {
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU29s2pv(d, p, L){ tbFig_Draw(d, p, L, U29S2K.pv); }
// ---- 29-3 向きの違う2つ の図（※ textbook/gen/make_section.py が textbook/gen/data/u29_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U29S3K = {
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  wv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wv","sfx":"","X0":200,"W":600,"Yc":420,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[1],"df":{}},{"f":"ln","id":"frmx1","pts":[[30,80],[1120,80],[1120,750],[30,750]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":200,"W":600,"Yc":420,"H":250,"vis":[2],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU29s3pv(d, p, L){ tbFig_Draw(d, p, L, U29S3K.pv); }
function tbU29s3wv(d, p, L){ tbFig_Draw(d, p, L, U29S3K.wv); }
function tbU29s3pw(d, p, L){ tbFig_Draw(d, p, L, U29S3K.pw); }
// ---- 29-4 引き算 の図（※ textbook/gen/make_section.py が textbook/gen/data/u29_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U29S4K = {
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU29s4pv(d, p, L){ tbFig_Draw(d, p, L, U29S4K.pv); }
// ---- 29-5 斜めのベクトル の図（※ textbook/gen/make_section.py が textbook/gen/data/u29_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U29S5K = {
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU29s5pv(d, p, L){ tbFig_Draw(d, p, L, U29S5K.pv); }
// ---- 29-6 複素数で書く の図（※ textbook/gen/make_section.py が textbook/gen/data/u29_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U29S6K = {
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU29s6pv(d, p, L){ tbFig_Draw(d, p, L, U29S6K.pv); }
var KINDS = {u29s1pv: tbU29s1pv, u29s2pv: tbU29s2pv, u29s3pv: tbU29s3pv, u29s3wv: tbU29s3wv, u29s3pw: tbU29s3pw, u29s4pv: tbU29s4pv, u29s5pv: tbU29s5pv, u29s6pv: tbU29s6pv};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 29-1 の図は電流が流れないので載せない,
  // 29-2 の図は電流が流れないので載せない,
  // 29-3 の図は電流が流れないので載せない,
  // 29-4 の図は電流が流れないので載せない,
  // 29-5 の図は電流が流れないので載せない,
  // 29-6 の図は電流が流れないので載せない
};

// 29-1 ベクトル表示 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u29_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU29s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU29s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU29s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU29s1_par(a, b){ return a * b / (a + b); }
function tbU29s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU29s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU29s1_Qto(r){
  var gcd = tbU29s1_gcd, ratio = tbU29s1_ratio, par = tbU29s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,4,5,10,20,50,100]);
    var k = pick(r, [2,3,4,6]);
    var d = pick(r, [0,1]);
    var P = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][k]);
    var sg = (d == 0 ? '-' : '+');
    var dg = (180 / k);
    var ms = (d == 0 ? '-' : '');
    var os = (d == 0 ? '' : '-');
    if (!(a != dg)) continue;
    var _c = choices(r, [{t: "$\\dot{V} = " + fmt(a) + " \\angle " + String(ms) + fmt(dg) + "^\\circ$", v: "ok"}, {t: "$\\dot{V} = " + fmt(a) + " \\angle " + String(os) + fmt(dg) + "^\\circ$", v: "op", why: "位相の符号も、そのまま書く"}, {t: "$\\dot{V} = " + fmt(dg) + " \\angle " + String(ms) + fmt(a) + "^\\circ$", v: "sw", why: "大きさと位相を取り違えた"}, {t: "$\\dot{V} = " + fmt(a) + " \\angle 0^\\circ$", v: "zero", why: "位相を入れていない"}]);
    return {form: "u29s1to", text: "$v = " + fmt(a) + " \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$［V］をベクトル表示で表したものはどれか。", fig: {kind: "u29s1pv", L: tbU29s1_fig({"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0}, [["a1g", fmt(d == 0 ? -180 / k : 180 / k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["最大値が " + fmt(a) + "、位相が $" + String(ms) + String(P) + "$（$" + String(ms) + fmt(dg) + "^\\circ$）", "$\\dot{V} = " + fmt(a) + " \\angle " + String(ms) + fmt(dg) + "^\\circ$"], chk: {form: "u29s1to", p: {a: a, k: k, d: d}}};
  }
  throw new Error("u29s1to：条件に合う数字が見つからない");
}
function tbU29s1_Qfrom(r){
  var gcd = tbU29s1_gcd, ratio = tbU29s1_ratio, par = tbU29s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,4,5,10,20,50,100]);
    var k = pick(r, [2,3,4,6]);
    var d = pick(r, [0,1]);
    var P = (['', '', '\\dfrac{\\pi}{2}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{4}', '', '\\dfrac{\\pi}{6}'][k]);
    var sg = (d == 0 ? '-' : '+');
    var og = (d == 0 ? '+' : '-');
    var dg = (180 / k);
    var ms = (d == 0 ? '-' : '');
    if (!(a != dg)) continue;
    var _c = choices(r, [{t: "$v = " + fmt(a) + " \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$", v: "ok"}, {t: "$v = " + fmt(a) + " \\sin\\left(\\omega t " + String(og) + " " + String(P) + "\\right)$", v: "op", why: "位相の符号も、そのまま書く"}, {t: "$v = " + fmt(a) + " \\sin \\omega t$", v: "zero", why: "位相を入れていない"}, {t: "$v = " + fmt(a) + " \\sin\\left(\\omega t " + String(sg) + " " + fmt(dg) + "\\pi\\right)$", v: "dpi", why: "$" + fmt(dg) + "^\\circ$ は $" + String(P) + "$"}]);
    return {form: "u29s1from", text: "$\\dot{V} = " + fmt(a) + " \\angle " + String(ms) + fmt(dg) + "^\\circ$ を瞬時値の式で表したものはどれか。", fig: {kind: "u29s1pv", L: tbU29s1_fig({"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0}, [["a1g", fmt(d == 0 ? -180 / k : 180 / k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["大きさが最大値、角度が位相（$" + String(ms) + fmt(dg) + "^\\circ = " + String(ms) + String(P) + "$）", "$v = " + fmt(a) + " \\sin\\left(\\omega t " + String(sg) + " " + String(P) + "\\right)$"], chk: {form: "u29s1from", p: {a: a, k: k, d: d}}};
  }
  throw new Error("u29s1from：条件に合う数字が見つからない");
}
function tbU29s1_Qdir(r){
  var gcd = tbU29s1_gcd, ratio = tbU29s1_ratio, par = tbU29s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [0,1,2,3]);
    var gg = ([0, 90, 180, -90][c]);
    var W = (['右向き', '上向き', '左向き', '下向き']);
    var _c = choices(r, [{t: String(W[c]), v: String(W[c])}, {t: String(W[(c + 1) % 4]), v: String(W[(c + 1) % 4]), why: "0° が右向きで、反時計回りに角度が増える"}, {t: String(W[(c + 2) % 4]), v: String(W[(c + 2) % 4]), why: "0° が右向きで、反時計回りに角度が増える"}, {t: String(W[(c + 3) % 4]), v: String(W[(c + 3) % 4]), why: "0° が右向きで、反時計回りに角度が増える"}]);
    return {form: "u29s1dir", text: "$\\dot{V} = V_m \\angle " + fmt(gg) + "^\\circ$ の矢印は、どの向きか。", fig: {kind: "u29s1pv", L: tbU29s1_fig({"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0}, [["a1g", fmt(gg)], ["a1", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["0° が右、90° が上、180° が左、-90° が下", String(W[c])], chk: {form: "u29s1dir", p: {c: c}}};
  }
  throw new Error("u29s1dir：条件に合う数字が見つからない");
}
function tbU29s1_Qdot(r){
  var gcd = tbU29s1_gcd, ratio = tbU29s1_ratio, par = tbU29s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "ベクトルの大きさ", v: "own"}, {t: "ベクトルの位相", v: "ph", why: "位相は ∠ の後ろの角度"}, {t: "瞬時値", v: "v", why: "瞬時値は小文字の $v$"}, {t: "周波数", v: "f", why: "周波数は $f$"}]);
    return {form: "u29s1dot", text: "$\\dot{V}$ に対して、点の付かない $V$ は何を表すか。", fig: {kind: "u29s1pv", L: tbU29s1_fig({"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["点の付いた文字がベクトル、点の無い文字は大きさ", "ベクトルの大きさ"], chk: {form: "u29s1dot", p: {}}};
  }
  throw new Error("u29s1dot：条件に合う数字が見つからない");
}
// 29-2 同じ向き・逆向き の練習（※ textbook/gen/make_section.py が textbook/gen/data/u29_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU29s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU29s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU29s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU29s2_par(a, b){ return a * b / (a + b); }
function tbU29s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU29s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU29s2_Qsame(r){
  var gcd = tbU29s2_gcd, ratio = tbU29s2_ratio, par = tbU29s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var b = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    if (!(a != b)) continue;
    var ok = (a + b);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU29s2_three(ok, [{x: (abs(a - b)), why: "それは逆向きのときの計算。同じ向きなら足す"}, {x: (max(a, b)), why: "大きい方だけを残した。同じ向きなら足す"}, {x: ((a + b) / 2), why: "足したあと 2 で割った"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u29s2same", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle 0^\\circ$［V］と $\\dot{V}_2 = " + fmt(b) + " \\angle 0^\\circ$［V］を合成したベクトルの大きさは何 V か。", fig: {kind: "u29s2pv", L: tbU29s2_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"a1y":0.04,"a2y":-0.04}, [["a1", "{V}_1=" + fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a2", "{V}_2=" + fmt(b)], ["a2l", fmt(b)], ["a2g", 0], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["同じ向きなので、大きさどうしを足す", "$V = " + fmt(a) + " + " + fmt(b) + " = " + qv(ok, "V") + "$"], chk: {form: "u29s2same", p: {a: a, b: b}}};
  }
  throw new Error("u29s2same：条件に合う数字が見つからない");
}
function tbU29s2_Qopp(r){
  var gcd = tbU29s2_gcd, ratio = tbU29s2_ratio, par = tbU29s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var b = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var g = pick(r, [0,1]);
    var D = (abs(a - b));
    var S = (a + b);
    var ga = (g == 0 ? 0 : 180);
    var gb = (g == 0 ? 180 : 0);
    var gok = (a > b ? ga : gb);
    var gng = (a > b ? gb : ga);
    if (!(a != b)) continue;
    var _c = choices(r, [{t: "$" + fmt(D) + " \\angle " + fmt(gok) + "^\\circ$", v: fmt(D) + "a" + fmt(gok)}, {t: "$" + fmt(D) + " \\angle " + fmt(gng) + "^\\circ$", v: fmt(D) + "a" + fmt(gng), why: "向きは大きい方の向き"}, {t: "$" + fmt(S) + " \\angle " + fmt(gok) + "^\\circ$", v: fmt(S) + "a" + fmt(gok), why: "逆向きなので、大きい方から小さい方を引く"}, {t: "$" + fmt(S) + " \\angle " + fmt(gng) + "^\\circ$", v: fmt(S) + "a" + fmt(gng), why: "逆向きなので引く。向きは大きい方"}]);
    return {form: "u29s2opp", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle " + fmt(ga) + "^\\circ$［V］と $\\dot{V}_2 = " + fmt(b) + " \\angle " + fmt(gb) + "^\\circ$［V］を合成したベクトルはどれか。", fig: {kind: "u29s2pv", L: tbU29s2_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"a1y":0.04,"a2y":-0.04}, [["a1", "{V}_1=" + fmt(a)], ["a1l", fmt(a)], ["a1g", fmt(ga)], ["a2", "{V}_2=" + fmt(b)], ["a2l", fmt(b)], ["a2g", fmt(gb)], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["逆向きなので、大きい方から小さい方を引く：$" + fmt(max(a, b)) + " - " + fmt(min(a, b)) + " = " + fmt(D) + "$", "向きは大きい方：$" + fmt(D) + " \\angle " + fmt(gok) + "^\\circ$"], chk: {form: "u29s2opp", p: {a: a, b: b, g: g}}};
  }
  throw new Error("u29s2opp：条件に合う数字が見つからない");
}
function tbU29s2_Qinst(r){
  var gcd = tbU29s2_gcd, ratio = tbU29s2_ratio, par = tbU29s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var b = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var D = (abs(a - b));
    var S = (a + b);
    if (!(a != b)) continue;
    var _c = choices(r, [{t: String(a > b ? '$' + fmt(D) + ' \\sin \\omega t$' : '$' + fmt(D) + ' \\sin(\\omega t + \\pi)$'), v: "ok"}, {t: String(a > b ? '$' + fmt(D) + ' \\sin(\\omega t + \\pi)$' : '$' + fmt(D) + ' \\sin \\omega t$'), v: "dir", why: "向きは大きい方の向き"}, {t: "$" + fmt(S) + " \\sin \\omega t$", v: "sum", why: "$\\pi$（180°）ずれた2つは逆向き。大きい方から小さい方を引く"}, {t: "$" + fmt(S) + " \\sin(\\omega t + \\pi)$", v: "sum2", why: "$\\pi$（180°）ずれた2つは逆向き。大きい方から小さい方を引く"}]);
    return {form: "u29s2inst", text: "$v_1 = " + fmt(a) + " \\sin \\omega t$［V］と $v_2 = " + fmt(b) + " \\sin(\\omega t + \\pi)$［V］の和 $v_1 + v_2$ を表す式はどれか。", fig: {kind: "u29s2pv", L: tbU29s2_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"a1y":0.04,"a2y":-0.04}, [["a1", "{V}_1=" + fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a2", "{V}_2=" + fmt(b)], ["a2l", fmt(b)], ["a2g", 180], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(a) + " \\angle 0^\\circ$ と $" + fmt(b) + " \\angle 180^\\circ$ は逆向き。大きさは $" + fmt(D) + "$、向きは大きい方", String(a > b ? '$v_1 + v_2 = ' + fmt(D) + ' \\sin \\omega t$' : '$v_1 + v_2 = ' + fmt(D) + ' \\sin(\\omega t + \\pi)$')], chk: {form: "u29s2inst", p: {a: a, b: b}}};
  }
  throw new Error("u29s2inst：条件に合う数字が見つからない");
}
// 29-3 向きの違う2つ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u29_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU29s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU29s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU29s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU29s3_par(a, b){ return a * b / (a + b); }
function tbU29s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU29s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU29s3_Qtri(r){
  var gcd = tbU29s3_gcd, ratio = tbU29s3_ratio, par = tbU29s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4,5,10,20]);
    var s = pick(r, [0,1]);
    var g = pick(r, [0,1]);
    var a = (s == 0 ? 3 * k : 4 * k);
    var b = (s == 0 ? 4 * k : 3 * k);
    var gb = (g == 0 ? -90 : 90);
    var ok = (5 * k);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU29s3_three(ok, [{x: (a + b), why: "向きが違うので、そのまま足せない（山が同じ時刻に来ない）"}, {x: (abs(a - b)), why: "逆向きではないので、引くのではない"}, {x: (a * a + b * b), why: "2乗の和のルートをとっていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u29s3tri", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle 0^\\circ$［V］と $\\dot{V}_2 = " + fmt(b) + " \\angle " + fmt(gb) + "^\\circ$［V］を合成したベクトルの大きさは何 V か。", fig: {kind: "u29s3pv", L: tbU29s3_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}_1=" + fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a2", "{V}_2=" + fmt(b)], ["a2l", fmt(b)], ["a2g", fmt(gb)], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直角なので、平行四辺形の対角線は三平方の定理で求める", "$V = \\sqrt{" + fmt(a) + "^2 + " + fmt(b) + "^2} = " + qv(ok, "V") + "$"], chk: {form: "u29s3tri", p: {k: k, s: s}}};
  }
  throw new Error("u29s3tri：条件に合う数字が見つからない");
}
function tbU29s3_Qr3(r){
  var gcd = tbU29s3_gcd, ratio = tbU29s3_ratio, par = tbU29s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,10,20,50]);
    var g = pick(r, [0,1]);
    var s = pick(r, [0,1]);
    var D = (2 * a);
    var gb = (g == 0 ? -90 : 90);
    var sg = (g == 0 ? '-' : '');
    var og = (g == 0 ? '' : '-');
    var ang = (s == 0 ? 60 : 30);
    var oth = (s == 0 ? 30 : 60);
    var t1 = (s == 0 ? fmt(a) : fmt(a) + '\\sqrt{3}');
    var t2 = (s == 0 ? fmt(a) + '\\sqrt{3}' : fmt(a));
    var _c = choices(r, [{t: "$" + fmt(D) + " \\angle " + String(sg) + fmt(ang) + "^\\circ$", v: "ok"}, {t: "$" + fmt(D) + " \\angle " + String(og) + fmt(ang) + "^\\circ$", v: "op", why: String(g == 0 ? '下向きの側なので遅れ（−）' : '上向きの側なので進み（＋）')}, {t: "$" + fmt(D) + " \\angle " + String(sg) + fmt(oth) + "^\\circ$", v: "ang", why: "1 : $\\sqrt{3}$ : 2 の三角形で、角度は横の辺と斜めの辺の間を見る"}, {t: "$" + fmt(a) + "(1 + \\sqrt{3}) \\angle " + String(sg) + fmt(ang) + "^\\circ$", v: "sum", why: "向きが違うので、大きさをそのまま足せない"}]);
    return {form: "u29s3r3", text: "$\\dot{V}_1 = " + String(t1) + " \\angle 0^\\circ$［V］と $\\dot{V}_2 = " + String(t2) + " \\angle " + fmt(gb) + "^\\circ$［V］を合成したベクトルはどれか。", fig: {kind: "u29s3pv", L: tbU29s3_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}_1"], ["a1l", fmt(s == 0 ? 1 : 1.732)], ["a1g", 0], ["a2", "{V}_2"], ["a2l", fmt(s == 0 ? 1.732 : 1)], ["a2g", fmt(gb)], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["横と縦が " + String(s == 0 ? '1 : √3' : '√3 : 1') + " の直角三角形。斜めの辺は 2 にあたり、大きさは $" + fmt(D) + "$", "角度は " + fmt(ang) + "°（" + String(g == 0 ? '下向きの側＝遅れ' : '上向きの側＝進み') + "）：$" + fmt(D) + " \\angle " + String(sg) + fmt(ang) + "^\\circ$"], chk: {form: "u29s3r3", p: {a: a, g: g, s: s}}};
  }
  throw new Error("u29s3r3：条件に合う数字が見つからない");
}
function tbU29s3_Qwhy(r){
  var gcd = tbU29s3_gcd, ratio = tbU29s3_ratio, par = tbU29s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "2つの山が同じ時刻に来ないから", v: "own"}, {t: "電圧は足せないから", v: "no", why: "瞬時値どうしは足せる。山の時刻がずれている"}, {t: "最大値は2乗して足すと決まっているから", v: "sq", why: "直角のときに三平方の定理になるだけ。理由は山の時刻のずれ"}, {t: "周波数が違うから", v: "f", why: "同じ周波数で、位相（山の時刻）がずれている"}]);
    return {form: "u29s3why", text: "位相の違う2つの正弦波交流の電圧を足すと、合成した電圧の最大値が2つの最大値の和にならないのはなぜか。", fig: {kind: "u29s3wv", L: tbU29s3_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["ax", "{ω}{t}［rad］"], ["ay", "{v}［V］"], ["w1", "{v}_1"], ["w2", "{v}_2"], ["w3", "{v}"], ["w1a", 0.375], ["w2a", 0.5], ["w2p", -90], ["w3a", 0.625], ["w3p", -53], ["a1", null], ["a2", null], ["a3", null], ["a1dot", null], ["a2dot", null], ["a3dot", null], ["pg1ab", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["一方が山のとき、もう一方は山ではない", "2つの山が同じ時刻に来ないから"], chk: {form: "u29s3why", p: {}}};
  }
  throw new Error("u29s3why：条件に合う数字が見つからない");
}
// 29-4 引き算 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u29_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU29s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU29s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU29s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU29s4_par(a, b){ return a * b / (a + b); }
function tbU29s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU29s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU29s4_Qneg(r){
  var gcd = tbU29s4_gcd, ratio = tbU29s4_ratio, par = tbU29s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var c = pick(r, [0,1,2,3]);
    var th = ([0, 90, -90, 180][c]);
    var op = ([180, -90, 90, 0][c]);
    var r9 = ([90, 180, 0, -90][c]);
    var D = (2 * a);
    var _c = choices(r, [{t: "$" + fmt(a) + " \\angle " + fmt(op) + "^\\circ$", v: "ok"}, {t: "$" + fmt(a) + " \\angle " + fmt(th) + "^\\circ$", v: "same", why: "マイナスを付けると、向きが逆になる"}, {t: "$" + fmt(a) + " \\angle " + fmt(r9) + "^\\circ$", v: "r90", why: "逆向きは 180° 回した向き（90° ではない）"}, {t: "$" + fmt(D) + " \\angle " + fmt(op) + "^\\circ$", v: "dbl", why: "向きが逆になるだけで、大きさは変わらない"}]);
    return {form: "u29s4neg", text: "$\\dot{V} = " + fmt(a) + " \\angle " + fmt(th) + "^\\circ$ のとき、$-\\dot{V}$ はどれか。", fig: {kind: "u29s4pv", L: tbU29s4_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}"], ["a1l", 1], ["a1g", fmt(th)], ["a2", null], ["a3", null], ["pg1ab", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["マイナスを付けると、大きさはそのままで向きが逆（180° 回る）", "$-\\dot{V} = " + fmt(a) + " \\angle " + fmt(op) + "^\\circ$"], chk: {form: "u29s4neg", p: {a: a, c: c}}};
  }
  throw new Error("u29s4neg：条件に合う数字が見つからない");
}
function tbU29s4_Qsub(r){
  var gcd = tbU29s4_gcd, ratio = tbU29s4_ratio, par = tbU29s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var b = pick(r, [1,2,3,4,5,6,8,10,12,15,20,30,40,50]);
    var g = pick(r, [0,1]);
    var gb = (g == 0 ? 0 : 180);
    var S = (a + b);
    var D = (abs(a - b));
    var gd = (a > b ? 0 : 180);
    var od = (a > b ? 180 : 0);
    var good = (g == 0 ? fmt(D) + ' \\angle ' + fmt(gd) : fmt(S) + ' \\angle 0');
    var w1_ = (g == 0 ? fmt(D) + ' \\angle ' + fmt(od) : fmt(S) + ' \\angle 180');
    var w2_ = (g == 0 ? fmt(S) + ' \\angle 0' : fmt(D) + ' \\angle ' + fmt(gd));
    var w3_ = (g == 0 ? fmt(S) + ' \\angle 180' : fmt(D) + ' \\angle ' + fmt(od));
    var y1 = (g == 0 ? '向きは大きい方の向き' : '$-\\dot{V}_2$ は右向き。合成も右向き');
    var y2 = (g == 0 ? '$-\\dot{V}_2$ は左向きで $\\dot{V}_1$ と逆向き。大きい方から小さい方を引く' : 'マイナスを付けたベクトルの向きを逆にしていない');
    var y3 = (g == 0 ? '$-\\dot{V}_2$ は $\\dot{V}_1$ と逆向き。大きさは引き算' : 'マイナスを付けると向きが逆になる。逆にしてから足す');
    if (!(a != b)) continue;
    var _c = choices(r, [{t: "$" + String(good) + "^\\circ$", v: String(good)}, {t: "$" + String(w1_) + "^\\circ$", v: String(w1_), why: String(y1)}, {t: "$" + String(w2_) + "^\\circ$", v: String(w2_), why: String(y2)}, {t: "$" + String(w3_) + "^\\circ$", v: String(w3_), why: String(y3)}]);
    return {form: "u29s4sub", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle 0^\\circ$［V］、$\\dot{V}_2 = " + fmt(b) + " \\angle " + fmt(gb) + "^\\circ$［V］のとき、$\\dot{V}_1 - \\dot{V}_2$ はどれか。", fig: {kind: "u29s4pv", L: tbU29s4_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}_1=" + fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a1y", 0.04], ["a2", "{V}_2=" + fmt(b)], ["a2l", fmt(b)], ["a2g", fmt(gb)], ["a2y", -0.04], ["a3", null], ["pg1ab", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$-\\dot{V}_2 = " + fmt(b) + " \\angle " + fmt(g == 0 ? 180 : 0) + "^\\circ$ を足す", "$\\dot{V}_1 - \\dot{V}_2 = " + String(good) + "^\\circ$"], chk: {form: "u29s4sub", p: {a: a, b: b, g: g}}};
  }
  throw new Error("u29s4sub：条件に合う数字が見つからない");
}
function tbU29s4_Qr3(r){
  var gcd = tbU29s4_gcd, ratio = tbU29s4_ratio, par = tbU29s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,10,20,50]);
    var g = pick(r, [0,1]);
    var D = (2 * a);
    var gb = (g == 0 ? -90 : 90);
    var sg = (g == 0 ? '' : '-');
    var og = (g == 0 ? '-' : '');
    var _c = choices(r, [{t: "$" + fmt(D) + " \\angle " + String(sg) + "60^\\circ$", v: "ok"}, {t: "$" + fmt(D) + " \\angle " + String(og) + "60^\\circ$", v: "add", why: "それは足し算 $\\dot{V}_1 + \\dot{V}_2$ の答え。マイナスを付けて向きを逆にする"}, {t: "$" + fmt(D) + " \\angle " + String(sg) + "30^\\circ$", v: "ang", why: "横 1 : 縦 $\\sqrt{3}$ なので、横の辺との間の角度は 60°"}, {t: "$" + fmt(a) + "(\\sqrt{3} - 1) \\angle " + String(sg) + "60^\\circ$", v: "sub", why: "向きが違うので、大きさをそのまま引けない"}]);
    return {form: "u29s4r3", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle 0^\\circ$［V］、$\\dot{V}_2 = " + fmt(a) + "\\sqrt{3} \\angle " + fmt(gb) + "^\\circ$［V］のとき、$\\dot{V}_1 - \\dot{V}_2$ はどれか。", fig: {kind: "u29s4pv", L: tbU29s4_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}_1"], ["a1l", 1], ["a1g", 0], ["a2", "{V}_2"], ["a2l", 1.732], ["a2g", fmt(gb)], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$-\\dot{V}_2 = " + fmt(a) + "\\sqrt{3} \\angle " + fmt(g == 0 ? 90 : -90) + "^\\circ$。横 $" + fmt(a) + "$・縦 $" + fmt(a) + "\\sqrt{3}$ で大きさ $" + fmt(D) + "$・60°", "$\\dot{V}_1 - \\dot{V}_2 = " + fmt(D) + " \\angle " + String(sg) + "60^\\circ$"], chk: {form: "u29s4r3", p: {a: a, g: g}}};
  }
  throw new Error("u29s4r3：条件に合う数字が見つからない");
}
// 29-5 斜めのベクトル の練習（※ textbook/gen/make_section.py が textbook/gen/data/u29_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU29s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU29s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU29s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU29s5_par(a, b){ return a * b / (a + b); }
function tbU29s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU29s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU29s5_Qmag(r){
  var gcd = tbU29s5_gcd, ratio = tbU29s5_ratio, par = tbU29s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var i = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var a = ([[3, 5], [5, 3], [7, 8], [8, 7], [5, 16], [16, 5], [6, 10], [10, 6], [9, 15], [15, 9], [14, 16], [16, 14]][i][0]);
    var b = ([[3, 5], [5, 3], [7, 8], [8, 7], [5, 16], [16, 5], [6, 10], [10, 6], [9, 15], [15, 9], [14, 16], [16, 14]][i][1]);
    var M = (Math.sqrt(a * a + a * b + b * b));
    var ok = (M);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU29s5_three(ok, [{x: (a + b), why: "向きが違うので、大きさをそのまま足せない"}, {x: (a * a + a * b + b * b), why: "2乗の和のルートをとっていない"}, {x: (a + b / 2), why: "横の長さだけを答えた。縦も合わせて三平方の定理"}, {x: (abs(a - b)), why: "逆向きではないので、引くのではない"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u29s5mag", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle 0^\\circ$［V］と $\\dot{V}_2 = " + fmt(b) + " \\angle 60^\\circ$［V］を合成したベクトルの大きさは何 V か。", fig: {kind: "u29s5pv", L: tbU29s5_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}_1=" + fmt(a)], ["a1l", fmt(a)], ["a1g", 0], ["a2", "{V}_2=" + fmt(b)], ["a2l", fmt(b)], ["a2g", 60], ["a3", null], ["g2", "60°"], ["g2f", 0], ["g2t", 60]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{V}_2$ を分けると横 $\\dfrac{" + fmt(b) + "}{2}$・縦 $\\dfrac{" + fmt(b) + "\\sqrt{3}}{2}$。合成の横は $" + fmt(a) + " + \\dfrac{" + fmt(b) + "}{2}$", "$V = \\sqrt{\\left(" + fmt(a) + " + \\dfrac{" + fmt(b) + "}{2}\\right)^2 + \\left(\\dfrac{" + fmt(b) + "\\sqrt{3}}{2}\\right)^2} = " + qv(ok, "V") + "$"], chk: {form: "u29s5mag", p: {i: i}}};
  }
  throw new Error("u29s5mag：条件に合う数字が見つからない");
}
function tbU29s5_Qsplit(r){
  var gcd = tbU29s5_gcd, ratio = tbU29s5_ratio, par = tbU29s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,4,6,8,10,20,40,100]);
    var s = pick(r, [0,1]);
    var H = (a / 2);
    var ang = (s == 0 ? 60 : 30);
    var hx = (s == 0 ? fmt(H) : fmt(H) + '\\sqrt{3}');
    var vy = (s == 0 ? fmt(H) + '\\sqrt{3}' : fmt(H));
    var _c = choices(r, [{t: "横 $" + String(hx) + "$、縦 $" + String(vy) + "$", v: "ok"}, {t: "横 $" + String(vy) + "$、縦 $" + String(hx) + "$", v: "sw", why: String(s == 0 ? '60° なら、横が大きさの半分' : '30° なら、縦が大きさの半分')}, {t: "横 $" + fmt(H) + "$、縦 $" + fmt(H) + "$", v: "half", why: "1 : $\\sqrt{3}$ : 2 の三角形なので、一方は $\\sqrt{3}$ が付く"}, {t: "横 $" + fmt(a) + "$、縦 $" + fmt(a) + "$", v: "full", why: "分けた長さは、それぞれ大きさより短い"}]);
    return {form: "u29s5split", text: "$\\dot{V} = " + fmt(a) + " \\angle " + fmt(ang) + "^\\circ$ を横と縦に分けた。横と縦の長さの組はどれか。", fig: {kind: "u29s5pv", L: tbU29s5_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}"], ["a1l", 1], ["a1g", fmt(ang)], ["a2", null], ["a3", null], ["pg1ab", null], ["c1of", "a1"], ["c1x", "?"], ["c1y", "?"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(s == 0 ? '60°' : '30°') + " の 1 : $\\sqrt{3}$ : 2 の三角形。斜めの辺が " + fmt(a), "横 $" + String(hx) + "$、縦 $" + String(vy) + "$"], chk: {form: "u29s5split", p: {a: a, s: s}}};
  }
  throw new Error("u29s5split：条件に合う数字が見つからない");
}
function tbU29s5_Qt120(r){
  var gcd = tbU29s5_gcd, ratio = tbU29s5_ratio, par = tbU29s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10,20]);
    var g = pick(r, [0,1]);
    var D = (2 * a);
    var sg = (g == 0 ? '' : '-');
    var _c = choices(r, [{t: "$" + fmt(a) + " \\angle " + String(sg) + "60^\\circ$", v: "ok"}, {t: "$" + fmt(D) + " \\angle " + String(sg) + "60^\\circ$", v: "sum", why: "向きが違うので、大きさをそのまま足せない（正三角形になる）"}, {t: "$" + fmt(a) + " \\angle " + String(sg) + "120^\\circ$", v: "a2", why: "合成は2つの間（対角線）の向き"}, {t: "$0 \\angle 0^\\circ$", v: "zero", why: "逆向き（180°）ではないので、打ち消し合わない"}]);
    return {form: "u29s5t120", text: "$\\dot{V}_1 = " + fmt(a) + " \\angle 0^\\circ$［V］と $\\dot{V}_2 = " + fmt(a) + " \\angle " + String(sg) + "120^\\circ$［V］を合成したベクトルはどれか。", fig: {kind: "u29s5pv", L: tbU29s5_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}_1"], ["a1l", 1], ["a1g", 0], ["a2", "{V}_2"], ["a2l", 1], ["a2g", fmt(g == 0 ? 120 : -120)], ["a3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["平行四辺形の中に、辺が " + fmt(a) + " で間が 60° の三角形＝正三角形ができる", "$" + fmt(a) + " \\angle " + String(sg) + "60^\\circ$"], chk: {form: "u29s5t120", p: {a: a, g: g}}};
  }
  throw new Error("u29s5t120：条件に合う数字が見つからない");
}
function tbU29s5_Qatan(r){
  var gcd = tbU29s5_gcd, ratio = tbU29s5_ratio, par = tbU29s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\theta = \\arctan \\dfrac{\\text{縦}}{\\text{横}}$", v: "own"}, {t: "$\\theta = \\arctan \\dfrac{\\text{横}}{\\text{縦}}$", v: "inv", why: "割る順が逆（縦を横で割る）"}, {t: "$\\theta = \\dfrac{\\text{縦}}{\\text{横}}$", v: "noat", why: "縦 ÷ 横は角度ではない。アークタンジェントで角度にする"}, {t: "$\\theta = \\sqrt{\\text{縦}^2 + \\text{横}^2}$", v: "mag", why: "それは大きさ（三平方の定理）"}]);
    return {form: "u29s5atan", text: "合成したベクトルを横と縦に分けた。位相 $\\theta$ を表す式はどれか。", fig: {kind: "u29s5pv", L: tbU29s5_fig({"ref":true,"a1":"{V}_1","a1dot":true,"a2":"{V}_2","a2dot":true,"a3":"{V}","a3dot":true,"pg1ab":"a1,a2"}, [["a1", "{V}"], ["a1l", 1], ["a1g", 35], ["a2", null], ["a3", null], ["pg1ab", null], ["c1of", "a1"], ["c1x", "横"], ["c1y", "縦"], ["g1", "θ"], ["g1f", 0], ["g1t", 35]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["角度は、縦 ÷ 横のアークタンジェント", "$\\theta = \\arctan \\dfrac{\\text{縦}}{\\text{横}}$"], chk: {form: "u29s5atan", p: {}}};
  }
  throw new Error("u29s5atan：条件に合う数字が見つからない");
}
// 29-6 複素数で書く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u29_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU29s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU29s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU29s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU29s6_par(a, b){ return a * b / (a + b); }
function tbU29s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU29s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU29s6_Qto(r){
  var gcd = tbU29s6_gcd, ratio = tbU29s6_ratio, par = tbU29s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [4,6,8,10,12,20,40,100]);
    var c = pick(r, [0,1,2,3]);
    var H = (a / 2);
    var g = ([60, 30, -60, -30][c]);
    var re = ([fmt(H), fmt(H) + '\\sqrt{3}', fmt(H), fmt(H) + '\\sqrt{3}'][c]);
    var im = ([fmt(H) + '\\sqrt{3}', fmt(H), fmt(H) + '\\sqrt{3}', fmt(H)][c]);
    var sg = (c < 2 ? '+' : '-');
    var og = (c < 2 ? '-' : '+');
    var _c = choices(r, [{t: "$" + String(re) + " " + String(sg) + " j" + String(im) + "$", v: "ok"}, {t: "$" + String(im) + " " + String(sg) + " j" + String(re) + "$", v: "sw", why: "横と縦を取り違えた"}, {t: "$" + String(re) + " " + String(og) + " j" + String(im) + "$", v: "neg", why: String(c < 2 ? '上向きの側なので、j の前は＋' : '下向きの側なので、j の前は－')}, {t: "$" + String(re) + " " + String(sg) + " " + String(im) + "$", v: "noj", why: "縦の分には $j$ を付ける"}]);
    return {form: "u29s6to", text: "$\\dot{V} = " + fmt(a) + " \\angle " + fmt(g) + "^\\circ$ を複素数で表したものはどれか。", fig: {kind: "u29s6pv", L: tbU29s6_fig({"cplx":true,"axr":"実数","axi":"虚数","a1":"{V}","a1dot":true,"a1l":1,"a1g":60}, [["a1g", fmt(g)], ["a1", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["横 $" + String(re) + "$、縦 $" + String(sg == '+' ? '' : '-') + String(im) + "$（1 : $\\sqrt{3}$ : 2 の三角形）", "$\\dot{V} = " + String(re) + " " + String(sg) + " j" + String(im) + "$"], chk: {form: "u29s6to", p: {a: a, c: c}}};
  }
  throw new Error("u29s6to：条件に合う数字が見つからない");
}
function tbU29s6_Qfrom(r){
  var gcd = tbU29s6_gcd, ratio = tbU29s6_ratio, par = tbU29s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var p = pick(r, [2,3,4,5,6,10,20,50]);
    var s = pick(r, [0,1]);
    var D = (2 * p);
    var sg = (s == 0 ? '+' : '-');
    var ms = (s == 0 ? '' : '-');
    var os = (s == 0 ? '-' : '');
    var _c = choices(r, [{t: "$" + fmt(D) + " \\angle " + String(ms) + "60^\\circ$", v: "ok"}, {t: "$" + fmt(D) + " \\angle " + String(ms) + "30^\\circ$", v: "ang", why: "横 1 : 縦 $\\sqrt{3}$ なので、角度は 60°"}, {t: "$" + fmt(D) + " \\angle " + String(os) + "60^\\circ$", v: "neg", why: String(s == 0 ? 'j の前が＋なので上向き（進み）' : 'j の前が－なので下向き（遅れ）')}, {t: "$" + fmt(p) + "(1 + \\sqrt{3}) \\angle " + String(ms) + "60^\\circ$", v: "sum", why: "大きさは横と縦の和ではなく、三平方の定理で出す"}]);
    return {form: "u29s6from", text: "$\\dot{V} = " + fmt(p) + " " + String(sg) + " j" + fmt(p) + "\\sqrt{3}$ をベクトル表示（大きさ∠位相）で表したものはどれか。", fig: {kind: "u29s6pv", L: tbU29s6_fig({"cplx":true,"axr":"実数","axi":"虚数","a1":"{V}","a1dot":true,"a1l":1,"a1g":60}, [["a1g", fmt(s == 0 ? 60 : -60)], ["a1", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["横 " + fmt(p) + "・縦 $" + String(ms) + fmt(p) + "\\sqrt{3}$ は 1 : $\\sqrt{3}$ : 2 の三角形。大きさ $" + fmt(D) + "$・角度 60°", "$" + fmt(D) + " \\angle " + String(ms) + "60^\\circ$"], chk: {form: "u29s6from", p: {p: p, s: s}}};
  }
  throw new Error("u29s6from：条件に合う数字が見つからない");
}
function tbU29s6_Qaxis(r){
  var gcd = tbU29s6_gcd, ratio = tbU29s6_ratio, par = tbU29s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "虚数", v: "own"}, {t: "実数", v: "re", why: "実数は左右の軸"}, {t: "最大値", v: "max", why: "最大値は矢印の長さ（大きさ）"}, {t: "時間", v: "t", why: "時間の軸は波形のグラフの横の軸"}]);
    return {form: "u29s6axis", text: "ベクトルを複素数で表すとき、上下の軸は何を表すか。", fig: {kind: "u29s6pv", L: tbU29s6_fig({"cplx":true,"axr":"実数","axi":"虚数","a1":"{V}","a1dot":true,"a1l":1,"a1g":60}, [["a1", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["左右が実数の軸、上下が虚数の軸", "虚数"], chk: {form: "u29s6axis", p: {}}};
  }
  throw new Error("u29s6axis：条件に合う数字が見つからない");
}
var GEN = {
  // 29-1 ベクトル表示
  1: function(r){ return pick(r, [tbU29s1_Qto, tbU29s1_Qto, tbU29s1_Qto, tbU29s1_Qto, tbU29s1_Qfrom, tbU29s1_Qfrom, tbU29s1_Qfrom, tbU29s1_Qdir, tbU29s1_Qdir, tbU29s1_Qdot])(r); },
  // 29-2 同じ向き・逆向き
  2: function(r){ return pick(r, [tbU29s2_Qsame, tbU29s2_Qsame, tbU29s2_Qsame, tbU29s2_Qopp, tbU29s2_Qopp, tbU29s2_Qopp, tbU29s2_Qopp, tbU29s2_Qinst, tbU29s2_Qinst])(r); },
  // 29-3 向きの違う2つ
  3: function(r){ return pick(r, [tbU29s3_Qtri, tbU29s3_Qtri, tbU29s3_Qtri, tbU29s3_Qtri, tbU29s3_Qr3, tbU29s3_Qr3, tbU29s3_Qr3, tbU29s3_Qwhy])(r); },
  // 29-4 引き算
  4: function(r){ return pick(r, [tbU29s4_Qneg, tbU29s4_Qneg, tbU29s4_Qneg, tbU29s4_Qsub, tbU29s4_Qsub, tbU29s4_Qsub, tbU29s4_Qsub, tbU29s4_Qr3, tbU29s4_Qr3])(r); },
  // 29-5 斜めのベクトル
  5: function(r){ return pick(r, [tbU29s5_Qmag, tbU29s5_Qmag, tbU29s5_Qmag, tbU29s5_Qmag, tbU29s5_Qsplit, tbU29s5_Qsplit, tbU29s5_Qsplit, tbU29s5_Qt120, tbU29s5_Qt120, tbU29s5_Qatan])(r); },
  // 29-6 複素数で書く
  6: function(r){ return pick(r, [tbU29s6_Qto, tbU29s6_Qto, tbU29s6_Qto, tbU29s6_Qto, tbU29s6_Qfrom, tbU29s6_Qfrom, tbU29s6_Qfrom, tbU29s6_Qaxis])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t29s1e","scene":"t29s1e","kind":"u29s1pv","lab":{"ref":true,"a1":"{V}_1","a1dot":true,"a1l":0.5,"a1g":0,"a2":"{V}_2","a2dot":true,"a2l":1,"a2g":0,"a3":"{V}_3","a3dot":true,"a3l":0.8,"a3g":-60,"g1":"-60°","g1f":0,"g1t":-60,"dirs":true,"d0":"0°","d90":"90°","d180":"180°","dm90":"-90°"},"viewbox":"86 88 828 684","band":{"want":"瞬時値の式をベクトルで書く","ans":"最大値∠位相（文字の上に点）","full":"ベクトルは大きさと方向を持った量。瞬時値の式を、文字の上に点を付けて「最大値∠位相」の形で書く。位相 0° は右向き。点の付かない文字は大きさを表す。"},"narr":{"start":{"co":1,"a1d":0,"a2d":0,"a3d":0,"g1d":0,"dirsd":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"①最大値∠位相\n②向き\n③点の無い文字\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"ベクトルは、〖大きさと方向を持った量〗です。図にした物がベクトル図です。波形の足し引きが簡単になります。","at":{"道筋":1.0},"after":[],"route":1},{"text":"$v_1 = V_m \\sin \\omega t$ を、ベクトル表示に直します。文字の上に点を付け、〖最大値∠位相〗の形で書きます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"a1","emph":["A1"],"eq":[{"cont":false,"items":[["\\dot{V}_1 = V_m \\angle 0^\\circ"]]}],"emphPre":["A1"]},{"text":"$v_2 = 2V_m \\sin \\omega t$ なら、〖長さが2倍〗の矢印です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"a2","emph":["A2"],"eq":[{"cont":false,"items":[["\\dot{V}_2 = 2V_m \\angle 0^\\circ"]]}],"emphPre":["A2"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"位相 0° は〖右向き〗です。90° は上、180° は左、-90° は下を向きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"dirs","emph":["D0","D90","D180","Dm90"]},{"text":"$v_3 = V_m \\sin\\left(\\omega t - \\dfrac{\\pi}{3}\\right)$ は、〖時計回りに 60° 傾け〗ます。180° と $\\pi$ のように、度と $\\pi$ はどちらで書いてもかまいません。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"a3","emph":["A3"],"eq":[{"cont":false,"items":[["\\dot{V}_3 = V_m \\angle -60^\\circ"]]}],"emphPre":["A3","G1"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"点の付かない $V$ は、〖ベクトルの大きさ〗（矢印の長さ）を表します。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["A1","A2","A3"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"a1":{"to":{"a1d":1},"dur":0.6},"a2":{"to":{"a2d":1},"dur":0.6},"dirs":{"to":{"dirsd":1},"dur":0.6},"a3":{"to":{"a3d":1,"g1d":1},"dur":0.8}},"route":["最大値∠位相","向き","点の無い文字"]}},{"id":"t29s1x","scene":"t29s1x","kind":"u29s1pv","lab":{"ref":true,"a1":["{V}","{V}=10∠-60°"],"a1dot":true,"a1l":1,"a1g":-60,"g1":"60°","g1f":0,"g1t":-60},"viewbox":"86 88 828 684","band":{"want":"ベクトル表示","known":"$v = 10 \\sin\\left(\\omega t - \\dfrac{\\pi}{3}\\right)$","ans":"$\\dot{V} = 10 \\angle -60^\\circ$"},"narr":{"start":{"co":1,"a1v":0,"g1d":1},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"求めるのは、$v = 10 \\sin\\left(\\omega t - \\dfrac{\\pi}{3}\\right)$ のベクトル表示です。","at":{"強調":1.0},"after":[],"emph":["A1"]},{"text":"①最大値\n②位相\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"〖$\\sin$ の前の 10〗が最大値です。矢印の長さになります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["A1"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$\\omega t$ の後ろの $-\\dfrac{\\pi}{3}$ が位相です。$-60^\\circ$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["G1"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["\\dot{V} = 10 \\angle -60^\\circ"]]}],"move":"v","ans":true,"emph":["A1","G1"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"v":{"to":{"a1v":1},"dur":0.4}},"route":["最大値","位相"]}},{"id":"t29s2e","scene":"t29s2e","kind":"u29s2pv","lab":{"ref":true,"a1":"{V}_1=4","a1dot":true,"a2":"{V}_2=6","a2dot":true,"a3":["{V}","{V}=10"],"a3dot":true,"a1y":0.04,"a2y":-0.04,"a1l":4,"a1g":0,"a2l":6,"a2g":0,"a3l":10,"a3g":0,"a4":"{V}=2","a4dot":true,"a4l":2,"a4g":180,"a4c":"blue"},"viewbox":"86 88 828 684","band":{"want":"同じ向き・逆向きの2つのベクトルの合成","ans":"同じ向きは足す。逆向きは大きい方から小さい方を引き、向きは大きい方","full":"同じ向きの2つは、大きさどうしを足す。逆向きの2つは、大きい方から小さい方を引き、向きは大きい方の向き。"},"narr":{"start":{"co":1,"a1d":1,"a2d":1,"a2s":0,"a3d":0,"a2f":0,"a3v":0,"a4d":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"①同じ向き\n②逆向き\n③瞬時値の式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$\\dot{V}_1 = 4 \\angle 0^\\circ$ と $\\dot{V}_2 = 6 \\angle 0^\\circ$ を足します。どちらも右向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["A1","A2"]},{"text":"$\\dot{V}_2$ を、〖$\\dot{V}_1$ の先につなぎ〗ます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"s","emph":["A1","A2"]},{"text":"〖同じ向きなら、大きさどうしを足し〗ます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"sum","emph":["A3"],"eq":[{"cont":false,"items":[["4 + 6 = 10","\\dot{V} = 10 \\angle 0^\\circ"]]}],"emphPre":["A3"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"次は $\\dot{V}_2 = 6 \\angle 180^\\circ$ とします。左向きで、$\\dot{V}_1$ と逆向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"flip","emph":["A2"]},{"text":"〖逆向きなら、大きい方から小さい方を引き〗ます。打ち消し合って小さくなります。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["6 - 4 = 2"]]}],"emph":["A1","A2"]},{"text":"向きは、〖大きい方の左向き〗です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"sum2","emph":["A4"],"eq":[{"cont":false,"items":[["\\dot{V} = 2 \\angle 180^\\circ"]]}],"emphPre":["A4"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"瞬時値の式に直すと、180° は $\\pi$ です。","at":{"道筋":1.0,"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"route":3,"eq":[{"cont":false,"items":[["v = 2 \\sin(\\omega t + \\pi)"]]}],"ans":true,"emph":["A4"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"s":{"to":{"a2s":1},"dur":0.6},"sum":{"to":{"a3d":1,"a3v":1},"dur":0.6},"flip":{"to":{"a2f":1,"a3d":0},"dur":0.8},"sum2":{"to":{"a4d":1},"dur":0.8}},"route":["同じ向き","逆向き","瞬時値の式"]}},{"id":"t29s2x","scene":"t29s2x","kind":"u29s2pv","lab":{"ref":true,"a1":"{V}_1=8","a1dot":true,"a2":"{V}_2=3","a2dot":true,"a3":["{V}","{V}=5"],"a3dot":true,"a1y":0.04,"a2y":-0.04,"a1l":8,"a1g":0,"a2l":3,"a2g":180,"a3l":5,"a3g":0},"viewbox":"86 88 828 684","band":{"want":"合成したベクトル","known":"$8 \\angle 0^\\circ$ と $3 \\angle 180^\\circ$","ans":"$5 \\angle 0^\\circ$"},"narr":{"start":{"co":1,"a3d":0,"a3v":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"求めるのは、$\\dot{V}_1 = 8 \\angle 0^\\circ$ と $\\dot{V}_2 = 3 \\angle 180^\\circ$ を合成したベクトルです。","at":{"強調":1.0},"after":[],"emph":["A1","A2"]},{"text":"①向きを見る\n②引く\n③向き\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"右向きと左向きで、逆向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["A1","A2"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"〖大きい方から小さい方を引き〗ます。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":2,"eq":[{"cont":false,"items":[["8 - 3 = 5"]]}],"emph":["A1","A2"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"向きは、大きい方の右向きです。","at":{"道筋":1.0,"動き":1.0,"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"route":3,"move":"sum","eq":[{"cont":false,"items":[["\\dot{V} = 5 \\angle 0^\\circ"]]}],"ans":true,"emph":["A3"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"sum":{"to":{"a3d":1,"a3v":1},"dur":0.6}},"route":["向きを見る","引く","向き"]}},{"id":"t29s3e","scene":"t29s3e","kind":"u29s3pw","lab":{"ref":true,"a1":"{V}_1=2","a1dot":true,"a2":"{V}_2=2\\sqrt{3}","a2dot":true,"a3":["{V}","{V}=4"],"a3dot":true,"pg1ab":"a1,a2","ax":"{ω}{t}［rad］","ay":"{v}［V］","w1":"{v}_1","w2":"{v}_2","w3":"{v}","w1a":0.375,"w2a":0.5,"w2p":-90,"w3a":0.625,"w3p":-53,"a1l":2,"a1g":0,"a2l":3.464,"a2g":90,"a3l":4,"a3g":60,"g1":"60°","g1f":0,"g1t":60,"s1":"1","s2":"\\sqrt{3}","s3":"2"},"viewbox":"16 68 1118 704","band":{"want":"向きの違う2つのベクトルの合成","ans":"平行四辺形の対角線","full":"向きの違う2つのベクトルの合成は、2つを隣り合う辺とする平行四辺形の対角線。直角なら三平方の定理で大きさを出す。位相が違うと山が同じ時刻に来ないので、単純な和にはならない。"},"narr":{"start":{"co":1,"t":0,"a1d":1,"a2d":1,"pg1d":0,"a3d":0,"a3v":0,"sd":0,"g1d":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"①平行四辺形\n②大きさと角度\n③足すだけでない理由\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$\\dot{V}_1 = 2 \\angle 0^\\circ$ と $\\dot{V}_2 = 2\\sqrt{3} \\angle 90^\\circ$ を合成します。右向きと上向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["A1","A2"]},{"text":"それぞれに平行な補助線を引き、〖平行四辺形〗を作ります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"pg","emph":["Pg1"]},{"text":"始点から、補助線の交わる点へ矢印を引きます。これが〖合成したベクトル〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a3","emph":["A3"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"横 2 と縦 $2\\sqrt{3}$ は、1 : $\\sqrt{3}$ の直角三角形です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"s","emph":["S1","S2"]},{"text":"三平方の定理から、斜めの辺は 2 にあたります。〖大きさは 4〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["A3"],"eq":[{"cont":false,"items":[["\\sqrt{2^2 + (2\\sqrt{3})^2} = \\sqrt{16} = 4"]]}],"emphPre":["S3","A3"]},{"text":"1 : $\\sqrt{3}$ : 2 の直角三角形なので、角度は 60° です。上向きなので進みです。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"v","emph":["A3"],"eq":[{"cont":false,"items":[["\\dot{V} = 4 \\angle 60^\\circ"]]}],"emphPre":["G1","A3"]}]},{"cap":null,"eqp":null,"vid":[0],"sents":[{"text":"大きさは $2 + 2\\sqrt{3}$ ではありません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"wv","emph":["W1","W2"]},{"text":"2つの波は〖位相が違う〗ので、山が同じ時刻に来ません。一方が山のとき、もう一方は 0 です。","at":{"強調":1.0},"after":[],"emph":["W1","W2"]},{"text":"合成した波の山は、2つの山の和より小さくなります。だから〖ベクトル図で合成〗します。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["W3"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1","waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1","ws2x1"],"S3":["ps3t0","ps3t1","ws3x1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{"pg":{"to":{"pg1d":1},"dur":0.6},"a3":{"to":{"a3d":1},"dur":0.6},"s":{"to":{"sd":1},"dur":0.5},"v":{"to":{"a3v":1,"g1d":1},"dur":0.5},"wv":{"to":{"t":1},"dur":0.6}},"route":["平行四辺形","大きさと角度","足すだけでない理由"]}},{"id":"t29s3x","scene":"t29s3x","kind":"u29s3pv","lab":{"ref":true,"a1":"{V}_1=6","a1dot":true,"a2":"{V}_2=8","a2dot":true,"a3":["{V}","{V}=10"],"a3dot":true,"pg1ab":"a1,a2","a1l":6,"a1g":0,"a2l":8,"a2g":-90,"a3l":10,"a3g":-53.13,"s1":"6","s2":"8","s3":"10"},"viewbox":"86 88 828 684","band":{"want":"合成したベクトルの大きさ","known":"$6 \\angle 0^\\circ$ と $8 \\angle -90^\\circ$","ans":"$10\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pg1d":0,"a3d":0,"a3v":0,"sd":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"求めるのは、$\\dot{V}_1 = 6 \\angle 0^\\circ$ と $\\dot{V}_2 = 8 \\angle -90^\\circ$ を合成したベクトルの大きさです。","at":{"強調":1.0},"after":[],"emph":["A1","A2"]},{"text":"①平行四辺形\n②三平方の定理\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"右向きと下向きなので、平行四辺形は長方形です。対角線が〖合成したベクトル〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"pg","emph":["Pg1","A3"]}]},{"cap":null,"eqp":null,"vid":[0],"sents":[{"text":"直角三角形の横が 6、縦が 8 です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"v","emph":["S1","S2"]},{"text":"","at":{"式":0.0,"答え":0.0,"強調":0.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["V = \\sqrt{6^2 + 8^2}","= \\sqrt{100} = 10\\,\\mathrm{V}"]]}],"ans":true,"emph":["A3","S3"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"pg":{"to":{"pg1d":1,"a3d":1},"dur":0.8},"v":{"to":{"sd":1,"a3v":1},"dur":0.5}},"route":["平行四辺形","三平方の定理"]}},{"id":"t29s4e","scene":"t29s4e","kind":"u29s4pv","lab":{"ref":true,"a1":"{V}_1=2","a1dot":true,"a2":["{V}_2=2\\sqrt{3}","-{V}_2"],"a2dot":true,"a3":["{V}","{V}=4"],"a3dot":true,"pg1ab":"a1,a2","a1l":2,"a1g":0,"a2l":3.464,"a2g":-90,"a2ghost":true,"a3l":4,"a3g":60,"g1":"60°","g1f":0,"g1t":60},"viewbox":"86 88 828 684","band":{"want":"ベクトルの引き算","ans":"マイナスを付けて向きを逆にし、足す","full":"ベクトル図では引き算ができないので、v1 − v2 ＝ v1 ＋ (−v2) と足し算の形にする。マイナスを付けると向きが逆になるだけで、大きさは変わらない。"},"narr":{"start":{"co":1,"a1d":1,"a2d":1,"a2f":0,"a2v":0,"pg1d":0,"a3d":0,"a3v":0,"g1d":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"①足し算の形にする\n②向きを逆にする\n③合成する\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$\\dot{V}_1 = 2 \\angle 0^\\circ$ から $\\dot{V}_2 = 2\\sqrt{3} \\angle -90^\\circ$ を引きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["A1","A2"]},{"text":"ベクトル図では、引き算はできません。〖足し算の形〗にします。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["\\dot{V}_1 - \\dot{V}_2 = \\dot{V}_1 + (-\\dot{V}_2)"]]}],"emph":["A1","A2"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"マイナスを付けると、〖向きが逆になるだけ〗です。大きさは変わりません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"f","emph":["A2"]},{"text":"下向きだった $\\dot{V}_2$ は、$-\\dot{V}_2$ で上向きになります。","at":{"強調":1.0},"after":[],"emph":["A2"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"あとは足し算です。平行四辺形の対角線を引きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"pg","emph":["Pg1","A3"]},{"text":"横 2・縦 $2\\sqrt{3}$ で、大きさは 4、角度は 60° です。右上なので進みです。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"v","emph":["A3"],"eq":[{"cont":false,"items":[["\\dot{V} = 4 \\angle 60^\\circ"]]}],"ans":true,"emphPre":["A3","G1"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"f":{"to":{"a2f":1,"a2v":1},"dur":0.8},"pg":{"to":{"pg1d":1,"a3d":1},"dur":0.8},"v":{"to":{"a3v":1,"g1d":1},"dur":0.5}},"route":["足し算の形にする","向きを逆にする","合成する"]}},{"id":"t29s4x","scene":"t29s4x","kind":"u29s4pv","lab":{"ref":true,"a1":"{V}_1=5","a1dot":true,"a2":["{V}_2=3","-{V}_2"],"a2dot":true,"a3":["{V}","{V}=8"],"a3dot":true,"pg1ab":null,"a1l":5,"a1g":0,"a1y":0.04,"a2l":3,"a2g":180,"a2y":-0.04,"a2ghost":true,"a3l":8,"a3g":0},"viewbox":"86 88 828 684","band":{"want":"$\\dot{V}_1 - \\dot{V}_2$","known":"$5 \\angle 0^\\circ$ と $3 \\angle 180^\\circ$","ans":"$8 \\angle 0^\\circ$"},"narr":{"start":{"co":1,"a2f":0,"a2v":0,"a3d":0,"a3v":0},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"求めるのは、$\\dot{V}_1 = 5 \\angle 0^\\circ$ から $\\dot{V}_2 = 3 \\angle 180^\\circ$ を引いたベクトルです。","at":{"強調":1.0},"after":[],"emph":["A1","A2"]},{"text":"①向きを逆にする\n②足す\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$-\\dot{V}_2$ は、左向きを逆にした右向きです。大きさは 3 のままです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"f","emph":["A2"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$\\dot{V}_1$ と $-\\dot{V}_2$ は同じ向きなので、〖大きさを足し〗ます。","at":{"道筋":1.0,"式":1.0,"強調":1.0},"after":["強調"],"route":2,"eq":[{"cont":false,"items":[["5 + 3 = 8"]]}],"emph":["A1","A2"]},{"text":"","at":{"式":0.0,"動き":0.0,"答え":0.0,"強調":0.0},"after":["動き","答え","強調"],"eq":[{"cont":false,"items":[["\\dot{V}_1 - \\dot{V}_2 = 8 \\angle 0^\\circ"]]}],"move":"s","ans":true,"emph":["A3"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"f":{"to":{"a2f":1,"a2v":1},"dur":0.8},"s":{"to":{"a3d":1,"a3v":1},"dur":0.6}},"route":["向きを逆にする","足す"]}},{"id":"t29s5e","scene":"t29s5e","kind":"u29s5pv","lab":{"ref":true,"a1":"{V}_1=5","a1dot":true,"a2":"{V}_2=3","a2dot":true,"a3":["{V}","{V}=7"],"a3dot":true,"pg1ab":"a1,a2","a1l":5,"a1g":0,"a2l":3,"a2g":60,"a3l":7,"a3g":21.79,"g2":"60°","g2f":0,"g2t":60,"c2of":"a2","c2x":"1.5","c2y":"\\dfrac{3\\sqrt{3}}{2}","c1of":"a3","c1x":"6.5","c1y":"\\dfrac{3\\sqrt{3}}{2}","g1":"θ","g1f":0,"g1t":21.79},"viewbox":"86 88 828 684","band":{"want":"斜めのベクトルを含む合成","ans":"横と縦に分けて三平方の定理。角度はアークタンジェント","full":"斜めのベクトルは横と縦に分ける（60° なら横は大きさの 1/2、縦は √3/2）。横の合計と縦で直角三角形を作り、三平方の定理で大きさを出す。位相は θ = arctan（縦/横）。"},"narr":{"start":{"co":1,"pg1d":0,"a3d":0,"a3v":0,"c1d":0,"c2d":0,"g1d":0,"g2d":1},"steps":[{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"①横と縦に分ける\n②三平方の定理\n③角度\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"$\\dot{V}_1 = 5 \\angle 0^\\circ$ と $\\dot{V}_2 = 3 \\angle 60^\\circ$ を合成します。平行四辺形の対角線です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"pg","emph":["A1","A2","Pg1","A3"]},{"text":"斜めの $\\dot{V}_2$ を、60° を使って〖横と縦に分け〗ます。1 : $\\sqrt{3}$ : 2 の三角形です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"c2","emph":["C2"],"eq":[{"cont":false,"items":[["\\text{横} = 3 \\times \\dfrac{1}{2} = 1.5","\\text{縦} = 3 \\times \\dfrac{\\sqrt{3}}{2} = \\dfrac{3\\sqrt{3}}{2}"]]}],"emphPre":["A2","C2","G2"]},{"text":"合成したベクトルの横は $5 + 1.5 = 6.5$、縦は $\\dfrac{3\\sqrt{3}}{2}$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"c1","emph":["C1","A3"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"大きな直角三角形で、〖三平方の定理〗を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["A3"],"eq":[{"cont":false,"items":[["V = \\sqrt{6.5^2 + \\left(\\dfrac{3\\sqrt{3}}{2}\\right)^2}","= \\sqrt{42.25 + 6.75}","= \\sqrt{49} = 7"]]}],"move":"v","emphPre":["C1","A3"]}]},{"cap":null,"eqp":null,"vid":[16],"sents":[{"text":"位相 $\\theta$ は、〖アークタンジェント〗で表します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"move":"g","emph":["G1"],"eq":[{"cont":false,"items":[["\\theta = \\arctan \\dfrac{\\dfrac{3\\sqrt{3}}{2}}{6.5}"]]}],"emphPre":["G1","C1"]},{"text":"点の付かない $V$ は、大きさです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A3"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"pg":{"to":{"pg1d":1,"a3d":1},"dur":0.8},"c2":{"to":{"c2d":1},"dur":0.6},"c1":{"to":{"c1d":1},"dur":0.6},"v":{"to":{"a3v":1},"dur":0.4},"g":{"to":{"g1d":1},"dur":0.4}},"route":["横と縦に分ける","三平方の定理","角度"]}},{"id":"t29s5x","scene":"t29s5x","kind":"u29s5pv","lab":{"ref":true,"a1":"{V}_1=4","a1dot":true,"a2":"{V}_2=4","a2dot":true,"a3":["{V}","{V}=4"],"a3dot":true,"pg1ab":"a1,a2","a1l":4,"a1g":0,"a2l":4,"a2g":120,"a3l":4,"a3g":60,"g2":"120°","g2f":0,"g2t":120,"g1":"60°","g1f":0,"g1t":60},"viewbox":"86 88 828 684","band":{"want":"合成したベクトル","known":"$4 \\angle 0^\\circ$ と $4 \\angle 120^\\circ$","ans":"$4 \\angle 60^\\circ$"},"narr":{"start":{"co":1,"pg1d":0,"a3d":0,"a3v":0,"g1d":0,"g2d":1},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、$\\dot{V}_1 = 4 \\angle 0^\\circ$ と $\\dot{V}_2 = 4 \\angle 120^\\circ$ を合成したベクトルです。","at":{"強調":1.0},"after":[],"emph":["A1","A2"]},{"text":"①平行四辺形\n②三角形の形\n③大きさと角度\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"平行四辺形を作り、対角線を引きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"pg","emph":["Pg1","A3"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"向かい合う辺は等しく、どちらも 4 です。隣り合う角の和は 180° なので、$\\dot{V}_1$ と補助線の間は 60° です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["G2","A1"]},{"text":"2つの辺が 4 で間が 60° の三角形は、〖正三角形〗です。","at":{"強調":1.0},"after":[],"emph":["A1","A3"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"大きさは 4、角度は 60° です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"v","emph":["A3"],"eq":[{"cont":false,"items":[["\\dot{V} = 4 \\angle 60^\\circ"]]}],"ans":true,"emphPre":["A3","G1"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"pg":{"to":{"pg1d":1,"a3d":1},"dur":0.8},"v":{"to":{"a3v":1,"g1d":1},"dur":0.5}},"route":["平行四辺形","三角形の形","大きさと角度"]}},{"id":"t29s6e","scene":"t29s6e","kind":"u29s6pv","lab":{"cplx":true,"axr":"実数","axi":"虚数","a1":["{V}","{V}=2∠60°"],"a1dot":true,"a1l":2,"a1g":60,"tx1":"1","ty1":"\\sqrt{3}","g1":"60°","g1f":0,"g1t":60},"viewbox":"86 88 828 684","band":{"want":"ベクトルを複素数で書く","ans":"$2 \\angle 60^\\circ = 1 + j\\sqrt{3}$","full":"左右に実数の軸、上下に虚数の軸をとる。右と上が＋。2∠60° は右に 1・上に √3 なので 1 + j√3。j は虚数を表す。"},"narr":{"start":{"co":1,"cd":0,"a1d":0,"a1v":1,"txd":0,"tyd":0,"g1d":1},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①実数の軸と虚数の軸\n②横と縦に分ける\n③j を付けて書く\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"ベクトルは、これから〖複素数〗で表すことが多くなります。","at":{"道筋":1.0},"after":[],"route":1},{"text":"始点から左右に実数の軸、上下に虚数の軸をとります。右と上が＋、左と下が－です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ax","emph":["Ax"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"$\\dot{V} = 2 \\angle 60^\\circ$ をかきます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"a1","emph":["A1","G1"]},{"text":"1 : $\\sqrt{3}$ : 2 の三角形なので、右に 1、上に $\\sqrt{3}$ 動いた点です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"t","emph":["Tx1","Ty1"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"上下に動いた分には、〖虚数を表す $j$〗を付けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["A1","Tx1","Ty1"],"eq":[{"cont":false,"items":[["\\dot{V} = 1 + j\\sqrt{3}"]]}],"emphPre":["Ty1"]},{"text":"〖実数＋$j$ 虚数〗、の形です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A1"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"ax":{"to":{"cd":1},"dur":0.6},"a1":{"to":{"a1d":1},"dur":0.6},"t":{"to":{"txd":1,"tyd":1},"dur":0.6}},"route":["実数の軸と虚数の軸","横と縦に分ける","j を付けて書く"]}},{"id":"t29s6x","scene":"t29s6x","kind":"u29s6pv","lab":{"cplx":true,"axr":"実数","axi":"虚数","a1":"{V}=4∠30°","a1dot":true,"a1l":4,"a1g":30,"tx1":"2\\sqrt{3}","ty1":"2","g1":"30°","g1f":0,"g1t":30},"viewbox":"86 88 828 684","band":{"want":"複素数で書いた形","known":"$\\dot{V} = 4 \\angle 30^\\circ$","ans":"$\\dot{V} = 2\\sqrt{3} + j2$"},"narr":{"start":{"co":1,"txd":0,"tyd":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、$\\dot{V} = 4 \\angle 30^\\circ$ を複素数で書いた形です。","at":{"強調":1.0},"after":[],"emph":["A1"]},{"text":"①横と縦に分ける\n②j を付けて書く\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"30° の 1 : $\\sqrt{3}$ : 2 の三角形です。斜めの辺が 4 なので、横は $2\\sqrt{3}$、縦は 2 です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"t","emph":["Tx1","Ty1","G1"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"〖縦の分に $j$〗を付けます。","at":{"道筋":1.0,"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"route":2,"eq":[{"cont":false,"items":[["\\dot{V} = 2\\sqrt{3} + j2"]]}],"ans":true,"emph":["A1"]}]}],"groups":{"O":["po","po1t0","po1t1"],"Ref":["pref"],"O1":["po1t0","po1t1"],"Dg1":["pdg1"],"A1":["pa1","pa1:h","pa1t0","pa1t1","pa1t2"],"A2":["pa2","pa2:h","pa2t0","pa2t1","pa2t2"],"A3":["pa3","pa3:h","pa3t0","pa3t1","pa3t2"],"A4":["pa4","pa4:h","pa4t0","pa4t1","pa4t2"],"A5":["pa5","pa5:h","pa5t0","pa5t1","pa5t2"],"A6":["pa6","pa6:h","pa6t0","pa6t1","pa6t2"],"A7":["pa7","pa7:h","pa7t0","pa7t1","pa7t2"],"A8":["pa8","pa8:h","pa8t0","pa8t1","pa8t2"],"A9":["pa9","pa9:h","pa9t0","pa9t1","pa9t2"],"G1":["pg1","pg1a","pg1a:h","pg1t0","pg1t1"],"G2":["pg2","pg2a","pg2a:h","pg2t0","pg2t1"],"G3":["pg3","pg3a","pg3a:h","pg3t0","pg3t1"],"Rot":["prA","prAh","prAh:h","prB","prBh","prBh:h","pradvt0","pradvt1","prlagt0","prlagt1"],"Pg1":["ppg1","ppg2"],"C1":["pc1a","pc1b","pc1xt0","pc1xt1","pc1yt0","pc1yt1"],"Ax":["pax","pax:h","pay","pay:h","paxrt0","paxrt1","paxit0","paxit1"],"Tx1":["ptx1","ptx1t0","ptx1t1"],"D0":["pd0","pd0t0","pd0t1"],"D90":["pd90","pd90t0","pd90t1"],"D180":["pd180","pd180t0","pd180t1"],"Dm90":["pdm90","pdm90t0","pdm90t1"],"S1":["ps1t0","ps1t1"],"S2":["ps2t0","ps2t1"],"S3":["ps3t0","ps3t1"],"C2":["pc2a","pc2b","pc2xt0","pc2xt1","pc2yt0","pc2yt1"],"Ty1":["pty1","pty1t0","pty1t1"]},"moves":{"t":{"to":{"txd":1,"tyd":1},"dur":0.6}},"route":["横と縦に分ける","j を付けて書く"]}}],"secs":[{"ex":{"text":"$v = 10 \\sin\\left(\\omega t - \\dfrac{\\pi}{3}\\right)$［V］をベクトル表示で表したものはどれか。","fig":{"kind":"u29s1pv","L":{"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":-60},"P":{}},"ch":[{"t":"$\\dot{V} = 10 \\angle 60^\\circ$","v":"p60","why":"位相の符号は $-$（遅れ）"},{"t":"$\\dot{V} = 60 \\angle -10^\\circ$","v":"sw","why":"大きさと位相を取り違えた"},{"t":"$\\dot{V} = 10 \\angle 0^\\circ$","v":"zero","why":"位相を入れていない"},{"t":"$\\dot{V} = 10 \\angle -60^\\circ$","v":"ok","why":""}],"ans":3}},{"ex":{"text":"$\\dot{V}_1 = 8 \\angle 0^\\circ$［V］と $\\dot{V}_2 = 3 \\angle 180^\\circ$［V］を合成したベクトルはどれか。","fig":{"kind":"u29s2pv","L":{"ref":true,"a1":"{V}_1=8","a1dot":true,"a2":"{V}_2=3","a2dot":true,"a3":null,"a3dot":true,"a1y":0.04,"a2y":-0.04,"a1l":8,"a1g":0,"a2l":3,"a2g":180},"P":{}},"ch":[{"t":"$11 \\angle 0^\\circ$","v":"11","why":"逆向きなので、大きい方から小さい方を引く"},{"t":"$5 \\angle 0^\\circ$","v":"ok","why":""},{"t":"$5 \\angle 180^\\circ$","v":"5l","why":"向きは大きい方（$8 \\angle 0^\\circ$）の向き"},{"t":"$11 \\angle 180^\\circ$","v":"11l","why":"逆向きなので引く。向きは大きい方"}],"ans":1}},{"ex":{"text":"$\\dot{V}_1 = 6 \\angle 0^\\circ$［V］と $\\dot{V}_2 = 8 \\angle -90^\\circ$［V］を合成したベクトルの大きさは何 V か。","fig":{"kind":"u29s3pv","L":{"ref":true,"a1":"{V}_1=6","a1dot":true,"a2":"{V}_2=8","a2dot":true,"a3":null,"a3dot":true,"pg1ab":"a1,a2","a1l":6,"a1g":0,"a2l":8,"a2g":-90},"P":{}},"ch":[{"t":"$14\\,\\mathrm{V}$","v":"14","why":"向きが違うので、そのまま足せない（山が同じ時刻に来ない）"},{"t":"$2\\,\\mathrm{V}$","v":"2","why":"逆向きではないので、引くのではない"},{"t":"$10\\,\\mathrm{V}$","v":"10","why":""},{"t":"$100\\,\\mathrm{V}$","v":"100","why":"2乗の和のルートをとっていない"}],"ans":2}},{"ex":{"text":"$\\dot{V}_1 = 5 \\angle 0^\\circ$［V］、$\\dot{V}_2 = 3 \\angle 180^\\circ$［V］のとき、$\\dot{V}_1 - \\dot{V}_2$ はどれか。","fig":{"kind":"u29s4pv","L":{"ref":true,"a1":"{V}_1=5","a1dot":true,"a2":"{V}_2=3","a2dot":true,"a3":null,"a3dot":true,"pg1ab":null,"a1l":5,"a1g":0,"a1y":0.04,"a2l":3,"a2g":180,"a2y":-0.04},"P":{}},"ch":[{"t":"$2 \\angle 0^\\circ$","v":"2","why":"マイナスを付けたベクトルの向きを逆にしていない"},{"t":"$8 \\angle 180^\\circ$","v":"8l","why":"$-\\dot{V}_2$ は右向きなので、合成も右向き"},{"t":"$8 \\angle 0^\\circ$","v":"ok","why":""},{"t":"$2 \\angle 180^\\circ$","v":"2l","why":"マイナスを付けると向きが逆になる。逆にしてから足す"}],"ans":2}},{"ex":{"text":"$\\dot{V}_1 = 4 \\angle 0^\\circ$［V］と $\\dot{V}_2 = 4 \\angle 120^\\circ$［V］を合成したベクトルはどれか。","fig":{"kind":"u29s5pv","L":{"ref":true,"a1":"{V}_1=4","a1dot":true,"a2":"{V}_2=4","a2dot":true,"a3":null,"a3dot":true,"pg1ab":"a1,a2","a1l":4,"a1g":0,"a2l":4,"a2g":120,"g2":"120°","g2f":0,"g2t":120},"P":{}},"ch":[{"t":"$8 \\angle 60^\\circ$","v":"8","why":"向きが違うので、大きさをそのまま足せない"},{"t":"$4 \\angle 60^\\circ$","v":"ok","why":""},{"t":"$4 \\angle 120^\\circ$","v":"120","why":"合成は2つの間（対角線）の向き"},{"t":"$0 \\angle 0^\\circ$","v":"0","why":"逆向き（180°）ではないので、打ち消し合わない"}],"ans":1}},{"ex":{"text":"$\\dot{V} = 4 \\angle 30^\\circ$ を複素数で表したものはどれか。","fig":{"kind":"u29s6pv","L":{"cplx":true,"axr":"実数","axi":"虚数","a1":"{V}=4∠30°","a1dot":true,"a1l":4,"a1g":30},"P":{}},"ch":[{"t":"$2 + j2\\sqrt{3}$","v":"sw","why":"横と縦を取り違えた。30° なら縦が大きさの半分"},{"t":"$2\\sqrt{3} + j2$","v":"ok","why":""},{"t":"$2\\sqrt{3} - j2$","v":"neg","why":"上向きの側なので、$j$ の前は＋"},{"t":"$2\\sqrt{3} + 2$","v":"noj","why":"縦の分には $j$ を付ける"}],"ans":1}}],"past":[]}};
});
