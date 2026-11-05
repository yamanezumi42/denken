/* 単元20「電流がつくる磁界」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(20, function(H){
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
// ---- 20-1 右ねじの法則 の図（※ textbook/gen/make_section.py が textbook/gen/data/u20_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U20S1K = {
  wc: {"vars":[],"items":[{"f":"ln","id":"fl","pts":[[640,420],[639.39,433.94],[637.57,447.78],[634.55,461.41],[630.35,474.72],[625.01,487.62],[618.56,500],[611.06,511.77],[602.57,522.85],[593.14,533.14],[582.85,542.57],[571.77,551.06],[560,558.56],[547.62,565.01],[534.72,570.35],[521.41,574.55],[507.78,577.57],[493.94,579.39],[480,580],[466.06,579.39],[452.22,577.57],[438.59,574.55],[425.28,570.35],[412.38,565.01],[400,558.56],[388.23,551.06],[377.15,542.57],[366.86,533.14],[357.43,522.85],[348.94,511.77],[341.44,500],[334.99,487.62],[329.65,474.72],[325.45,461.41],[322.43,447.78],[320.61,433.94],[320,420],[320.61,406.06],[322.43,392.22],[325.45,378.59],[329.65,365.28],[334.99,352.38],[341.44,340],[348.94,328.23],[357.43,317.15],[366.86,306.86],[377.15,297.43],[388.23,288.94],[400,281.44],[412.38,274.99],[425.28,269.65],[438.59,265.45],[452.22,262.43],[466.06,260.61],[480,260],[493.94,260.61],[507.78,262.43],[521.41,265.45],[534.72,269.65],[547.62,274.99],[560,281.44],[571.77,288.94],[582.85,297.43],[593.14,306.86],[602.57,317.15],[611.06,328.23],[618.56,340],[625.01,352.38],[630.35,365.28],[634.55,378.59],[637.57,392.22],[639.39,406.06],[640,420]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92},"cw":{"x0":578.51,"y0":293.92,"x1":606.08,"y1":321.49}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49},"cw":{"x0":353.92,"y0":321.49,"x1":381.49,"y1":293.92}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh2","x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08},"cw":{"x0":381.49,"y0":546.08,"x1":353.92,"y1":518.51}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh3","x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51},"cw":{"x0":606.08,"y0":518.51,"x1":578.51,"y1":546.08}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[605,280,"start",[1,-1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":647.43,"y":237.57,"anc":"start"},{"f":"ln","id":"lp","pts":[[297.7,486.35],[287.15,441.12],[287.66,394.68],[299.19,349.69],[321.08,308.73],[352.09,274.14],[390.42,247.92],[433.89,231.56],[480,226],[526.11,231.56],[569.58,247.92],[607.91,274.14],[638.92,308.73],[660.81,349.69],[672.34,394.68],[672.85,441.12],[662.3,486.35],[641.31,527.78],[611.06,563.03],[573.31,590.08],[530.21,607.39],[484.23,613.95],[438.01,609.4]],"w":3,"o":["lpd"],"need":"lp","vis":[],"t":"F"},{"f":"ar","id":"lph","x0":438.01,"y0":609.4,"x1":355.3,"y1":568.61,"o":["lpd"],"need":"lp","vis":[],"t":"F"},{"f":"lb","id":"lpt","k":"lp","bases":[[330,610,"end",[-1,1]]],"o":["lpd"],"need":"lp","vis":[],"t":"F","x":330,"y":610,"anc":"end"},{"f":"c","id":"cc","cx":480,"cy":420,"r":32,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[434,380,"end",[-1,-1]],[480,360,"middle",[0,-1]]],"need":"c","vis":[],"t":"F","x":434,"y":380,"anc":"end"},{"f":"c","id":"ppd","cx":640,"cy":420,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[658,450,"start",[1,1]]],"need":"p","vis":[],"t":"F","x":658,"y":450,"anc":"start"},{"f":"ar","id":"rd","x0":536,"y0":420,"x1":630,"y1":420,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[578,452,"middle",[0,1]],[578,390,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":578,"y":452,"anc":"middle"},{"f":"ar","id":"ha","x0":670,"y0":420,"x1":670,"y1":290,"need":"h","sel":"ha","var":{"up":{"x0":670,"y0":420,"x1":670,"y1":290},"down":{"x0":670,"y0":420,"x1":670,"y1":550}},"dflt":"up","gr":"hd","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"vbases":{"up":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"down":[[688,485,"start",[1,0]],[652,485,"end",[-1,0]],[670,580,"middle",[0,1]]]},"need":"h","sel":"ha","var":{"up":{"x":688,"y":355,"anc":"start"},"down":{"x":688,"y":485,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":688,"y":355,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ws: {"vars":[],"items":[{"f":"ln","id":"wl","pts":[[380,140],[380,720]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wt","k":"w","bases":[[356,160,"end",[-1,0]]],"need":"w","vis":[],"t":"F","x":356,"y":160,"anc":"end"},{"f":"ar","id":"ia","x0":404,"y0":300,"x1":404,"y1":200,"need":"i","sel":"ia","var":{"up":{"x0":404,"y0":320,"x1":404,"y1":200},"down":{"x0":404,"y0":200,"x1":404,"y1":320}},"dflt":"up","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"vbases":{"up":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"down":[[422,350,"start",[1,0]],[386,350,"end",[-1,0]],[404,430,"middle",[0,1]]]},"need":"i","sel":"ia","var":{"up":{"x":422,"y":258,"anc":"start"},"down":{"x":422,"y":350,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":422,"y":250,"anc":"start"},{"f":"ln","id":"flb","pts":[[230,430],[230.57,425.99],[232.28,422.01],[235.11,418.09],[239.05,414.27],[244.05,410.56],[250.1,407],[257.13,403.62],[265.09,400.43],[273.93,397.47],[283.58,394.76],[293.96,392.32],[305,390.16],[316.61,388.31],[328.7,386.77],[341.18,385.57],[353.95,384.7],[366.93,384.18],[380,384],[393.07,384.18],[406.05,384.7],[418.82,385.57],[431.3,386.77],[443.39,388.31],[455,390.16],[466.04,392.32],[476.42,394.76],[486.07,397.47],[494.91,400.43],[502.87,403.62],[509.9,407],[515.95,410.56],[520.95,414.27],[524.89,418.09],[527.72,422.01],[529.43,425.99],[530,430]],"dash":1,"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ln","id":"flf","pts":[[530,430],[529.43,434.01],[527.72,437.99],[524.89,441.91],[520.95,445.73],[515.95,449.44],[509.9,453],[502.87,456.38],[494.91,459.57],[486.07,462.53],[476.42,465.24],[466.04,467.68],[455,469.84],[443.39,471.69],[431.3,473.23],[418.82,474.43],[406.05,475.3],[393.07,475.82],[380,476],[366.93,475.82],[353.95,475.3],[341.18,474.43],[328.7,473.23],[316.61,471.69],[305,469.84],[293.96,467.68],[283.58,465.24],[273.93,462.53],[265.09,459.57],[257.13,456.38],[250.1,453],[244.05,449.44],[239.05,445.73],[235.11,441.91],[232.28,437.99],[230.57,434.01],[230,430]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66},"cw":{"x0":321.39,"y0":387.66,"x1":289.73,"y1":393.26}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26},"cw":{"x0":470.27,"y0":393.26,"x1":438.61,"y1":387.66}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[214,400,"end",[-1,-1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":214,"y":400,"anc":"end"},{"f":"c","id":"ppd","cx":740,"cy":430,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[760,430,"start",[1,0]]],"need":"p","vis":[],"t":"F","x":760,"y":430,"anc":"start"},{"f":"ln","id":"re1","pts":[[380,496],[380,574]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[740,496],[740,574]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":380,"y0":560,"x1":740,"y1":560,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[560,600,"middle",[0,1]],[560,520,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":560,"y":600,"anc":"middle"},{"f":"ln","id":"dl","pts":[[380,190],[740,430]],"dash":1,"w":3,"o":["dd"],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[580,290,"start",[1,-1]]],"o":["dd"],"need":"d","vis":[],"t":"F","x":580,"y":290,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"wl","pts":[[380,140],[380,720]],"w":6,"vis":[1],"t":"F"},{"f":"lb","id":"wt","k":"w","bases":[[356,160,"end",[-1,0]]],"need":"w","vis":[1],"t":"F","x":356,"y":160,"anc":"end"},{"f":"ar","id":"ia","x0":404,"y0":300,"x1":404,"y1":200,"need":"i","sel":"ia","var":{"up":{"x0":404,"y0":320,"x1":404,"y1":200},"down":{"x0":404,"y0":200,"x1":404,"y1":320}},"dflt":"up","vis":[1],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"vbases":{"up":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"down":[[422,350,"start",[1,0]],[386,350,"end",[-1,0]],[404,430,"middle",[0,1]]]},"need":"i","sel":"ia","var":{"up":{"x":422,"y":258,"anc":"start"},"down":{"x":422,"y":350,"anc":"start"}},"dflt":"up","vis":[1],"t":"F","x":422,"y":250,"anc":"start"},{"f":"ln","id":"flb","pts":[[230,430],[230.57,425.99],[232.28,422.01],[235.11,418.09],[239.05,414.27],[244.05,410.56],[250.1,407],[257.13,403.62],[265.09,400.43],[273.93,397.47],[283.58,394.76],[293.96,392.32],[305,390.16],[316.61,388.31],[328.7,386.77],[341.18,385.57],[353.95,384.7],[366.93,384.18],[380,384],[393.07,384.18],[406.05,384.7],[418.82,385.57],[431.3,386.77],[443.39,388.31],[455,390.16],[466.04,392.32],[476.42,394.76],[486.07,397.47],[494.91,400.43],[502.87,403.62],[509.9,407],[515.95,410.56],[520.95,414.27],[524.89,418.09],[527.72,422.01],[529.43,425.99],[530,430]],"dash":1,"w":3,"o":["fld"],"need":"fl","vis":[1],"t":"F"},{"f":"ln","id":"flf","pts":[[530,430],[529.43,434.01],[527.72,437.99],[524.89,441.91],[520.95,445.73],[515.95,449.44],[509.9,453],[502.87,456.38],[494.91,459.57],[486.07,462.53],[476.42,465.24],[466.04,467.68],[455,469.84],[443.39,471.69],[431.3,473.23],[418.82,474.43],[406.05,475.3],[393.07,475.82],[380,476],[366.93,475.82],[353.95,475.3],[341.18,474.43],[328.7,473.23],[316.61,471.69],[305,469.84],[293.96,467.68],[283.58,465.24],[273.93,462.53],[265.09,459.57],[257.13,456.38],[250.1,453],[244.05,449.44],[239.05,445.73],[235.11,441.91],[232.28,437.99],[230.57,434.01],[230,430]],"w":3,"o":["fld"],"need":"fl","vis":[1],"t":"F"},{"f":"ar","id":"flh0","x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66},"cw":{"x0":321.39,"y0":387.66,"x1":289.73,"y1":393.26}},"dflt":"ccw","vis":[1],"t":"F"},{"f":"ar","id":"flh1","x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26},"cw":{"x0":470.27,"y0":393.26,"x1":438.61,"y1":387.66}},"dflt":"ccw","vis":[1],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[214,400,"end",[-1,-1]]],"o":["fld"],"need":"fl","vis":[1],"t":"F","x":214,"y":400,"anc":"end"},{"f":"c","id":"ppd","cx":740,"cy":430,"r":8,"fill":"k","need":"p","vis":[1],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[760,430,"start",[1,0]]],"need":"p","vis":[1],"t":"F","x":760,"y":430,"anc":"start"},{"f":"ln","id":"re1","pts":[[380,496],[380,574]],"w":2,"need":"r","vis":[1],"t":"F"},{"f":"ln","id":"re2","pts":[[740,496],[740,574]],"w":2,"need":"r","vis":[1],"t":"F"},{"f":"ar","id":"rd","x0":380,"y0":560,"x1":740,"y1":560,"two":1,"w":2,"need":"r","vis":[1],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[560,600,"middle",[0,1]],[560,520,"middle",[0,-1]]],"need":"r","vis":[1],"t":"F","x":560,"y":600,"anc":"middle"},{"f":"ln","id":"dl","pts":[[380,190],[740,430]],"dash":1,"w":3,"o":["dd"],"need":"d","vis":[1],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[580,290,"start",[1,-1]]],"o":["dd"],"need":"d","vis":[1],"t":"F","x":580,"y":290,"anc":"start"},{"f":"ln","id":"flx1","pts":[[640,420],[639.39,433.94],[637.57,447.78],[634.55,461.41],[630.35,474.72],[625.01,487.62],[618.56,500],[611.06,511.77],[602.57,522.85],[593.14,533.14],[582.85,542.57],[571.77,551.06],[560,558.56],[547.62,565.01],[534.72,570.35],[521.41,574.55],[507.78,577.57],[493.94,579.39],[480,580],[466.06,579.39],[452.22,577.57],[438.59,574.55],[425.28,570.35],[412.38,565.01],[400,558.56],[388.23,551.06],[377.15,542.57],[366.86,533.14],[357.43,522.85],[348.94,511.77],[341.44,500],[334.99,487.62],[329.65,474.72],[325.45,461.41],[322.43,447.78],[320.61,433.94],[320,420],[320.61,406.06],[322.43,392.22],[325.45,378.59],[329.65,365.28],[334.99,352.38],[341.44,340],[348.94,328.23],[357.43,317.15],[366.86,306.86],[377.15,297.43],[388.23,288.94],[400,281.44],[412.38,274.99],[425.28,269.65],[438.59,265.45],[452.22,262.43],[466.06,260.61],[480,260],[493.94,260.61],[507.78,262.43],[521.41,265.45],[534.72,269.65],[547.62,274.99],[560,281.44],[571.77,288.94],[582.85,297.43],[593.14,306.86],[602.57,317.15],[611.06,328.23],[618.56,340],[625.01,352.38],[630.35,365.28],[634.55,378.59],[637.57,392.22],[639.39,406.06],[640,420]],"w":3,"o":["fld"],"need":"fl","vis":[2],"t":"F"},{"f":"ar","id":"flh0x1","x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92},"cw":{"x0":578.51,"y0":293.92,"x1":606.08,"y1":321.49}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh1x1","x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49},"cw":{"x0":353.92,"y0":321.49,"x1":381.49,"y1":293.92}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh2x1","x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08},"cw":{"x0":381.49,"y0":546.08,"x1":353.92,"y1":518.51}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh3x1","x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51},"cw":{"x0":606.08,"y0":518.51,"x1":578.51,"y1":546.08}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"lb","id":"fltx1","k":"fl","bases":[[605,280,"start",[1,-1]]],"o":["fld"],"need":"fl","vis":[2],"t":"F","x":647.43,"y":237.57,"anc":"start","n":"flx1"},{"f":"ln","id":"lpx1","pts":[[297.7,486.35],[287.15,441.12],[287.66,394.68],[299.19,349.69],[321.08,308.73],[352.09,274.14],[390.42,247.92],[433.89,231.56],[480,226],[526.11,231.56],[569.58,247.92],[607.91,274.14],[638.92,308.73],[660.81,349.69],[672.34,394.68],[672.85,441.12],[662.3,486.35],[641.31,527.78],[611.06,563.03],[573.31,590.08],[530.21,607.39],[484.23,613.95],[438.01,609.4]],"w":3,"o":["lpd"],"need":"lp","vis":[2],"t":"F"},{"f":"ar","id":"lphx1","x0":438.01,"y0":609.4,"x1":355.3,"y1":568.61,"o":["lpd"],"need":"lp","vis":[2],"t":"F"},{"f":"lb","id":"lptx1","k":"lp","bases":[[330,610,"end",[-1,1]]],"o":["lpd"],"need":"lp","vis":[2],"t":"F","x":330,"y":610,"anc":"end","n":"lpx1"},{"f":"c","id":"ccx1","cx":480,"cy":420,"r":32,"fill":"w","vis":[2],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ctx1","k":"c","bases":[[434,380,"end",[-1,-1]],[480,360,"middle",[0,-1]]],"need":"c","vis":[2],"t":"F","x":434,"y":380,"anc":"end","n":"cx1"},{"f":"c","id":"ppdx1","cx":640,"cy":420,"r":8,"fill":"k","need":"p","vis":[2],"t":"F"},{"f":"lb","id":"ptx1","k":"p","bases":[[658,450,"start",[1,1]]],"need":"p","vis":[2],"t":"F","x":658,"y":450,"anc":"start","n":"px1"},{"f":"ar","id":"rdx1","x0":536,"y0":420,"x1":630,"y1":420,"two":1,"w":2,"need":"r","vis":[2],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[578,452,"middle",[0,1]],[578,390,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":578,"y":452,"anc":"middle","n":"rx1"},{"f":"ar","id":"hax1","x0":670,"y0":420,"x1":670,"y1":290,"need":"h","sel":"ha","var":{"up":{"x0":670,"y0":420,"x1":670,"y1":290},"down":{"x0":670,"y0":420,"x1":670,"y1":550}},"dflt":"up","gr":"hd","vis":[2],"t":"F"},{"f":"lb","id":"htx1","k":"h","bases":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"vbases":{"up":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"down":[[688,485,"start",[1,0]],[652,485,"end",[-1,0]],[670,580,"middle",[0,1]]]},"need":"h","sel":"ha","var":{"up":{"x":688,"y":355,"anc":"start"},"down":{"x":688,"y":485,"anc":"start"}},"dflt":"up","vis":[2],"t":"F","x":688,"y":355,"anc":"start","n":"hx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU20s1wc(d, p, L){ tbFig_Draw(d, p, L, U20S1K.wc); }
function tbU20s1ws(d, p, L){ tbFig_Draw(d, p, L, U20S1K.ws); }
function tbU20s1sw(d, p, L){ tbFig_Draw(d, p, L, U20S1K.sw); }
// ---- 20-2 直線の導体 の図（※ textbook/gen/make_section.py が textbook/gen/data/u20_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U20S2K = {
  wc: {"vars":[],"items":[{"f":"ln","id":"fl","pts":[[640,420],[639.39,433.94],[637.57,447.78],[634.55,461.41],[630.35,474.72],[625.01,487.62],[618.56,500],[611.06,511.77],[602.57,522.85],[593.14,533.14],[582.85,542.57],[571.77,551.06],[560,558.56],[547.62,565.01],[534.72,570.35],[521.41,574.55],[507.78,577.57],[493.94,579.39],[480,580],[466.06,579.39],[452.22,577.57],[438.59,574.55],[425.28,570.35],[412.38,565.01],[400,558.56],[388.23,551.06],[377.15,542.57],[366.86,533.14],[357.43,522.85],[348.94,511.77],[341.44,500],[334.99,487.62],[329.65,474.72],[325.45,461.41],[322.43,447.78],[320.61,433.94],[320,420],[320.61,406.06],[322.43,392.22],[325.45,378.59],[329.65,365.28],[334.99,352.38],[341.44,340],[348.94,328.23],[357.43,317.15],[366.86,306.86],[377.15,297.43],[388.23,288.94],[400,281.44],[412.38,274.99],[425.28,269.65],[438.59,265.45],[452.22,262.43],[466.06,260.61],[480,260],[493.94,260.61],[507.78,262.43],[521.41,265.45],[534.72,269.65],[547.62,274.99],[560,281.44],[571.77,288.94],[582.85,297.43],[593.14,306.86],[602.57,317.15],[611.06,328.23],[618.56,340],[625.01,352.38],[630.35,365.28],[634.55,378.59],[637.57,392.22],[639.39,406.06],[640,420]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92},"cw":{"x0":578.51,"y0":293.92,"x1":606.08,"y1":321.49}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49},"cw":{"x0":353.92,"y0":321.49,"x1":381.49,"y1":293.92}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh2","x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08},"cw":{"x0":381.49,"y0":546.08,"x1":353.92,"y1":518.51}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh3","x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51},"cw":{"x0":606.08,"y0":518.51,"x1":578.51,"y1":546.08}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[605,280,"start",[1,-1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":647.43,"y":237.57,"anc":"start"},{"f":"ln","id":"lp","pts":[[297.7,486.35],[287.15,441.12],[287.66,394.68],[299.19,349.69],[321.08,308.73],[352.09,274.14],[390.42,247.92],[433.89,231.56],[480,226],[526.11,231.56],[569.58,247.92],[607.91,274.14],[638.92,308.73],[660.81,349.69],[672.34,394.68],[672.85,441.12],[662.3,486.35],[641.31,527.78],[611.06,563.03],[573.31,590.08],[530.21,607.39],[484.23,613.95],[438.01,609.4]],"w":3,"o":["lpd"],"need":"lp","vis":[],"t":"F"},{"f":"ar","id":"lph","x0":438.01,"y0":609.4,"x1":355.3,"y1":568.61,"o":["lpd"],"need":"lp","vis":[],"t":"F"},{"f":"lb","id":"lpt","k":"lp","bases":[[330,610,"end",[-1,1]]],"o":["lpd"],"need":"lp","vis":[],"t":"F","x":330,"y":610,"anc":"end"},{"f":"c","id":"cc","cx":480,"cy":420,"r":32,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[434,380,"end",[-1,-1]],[480,360,"middle",[0,-1]]],"need":"c","vis":[],"t":"F","x":480,"y":360,"anc":"middle"},{"f":"c","id":"ppd","cx":640,"cy":420,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[658,450,"start",[1,1]]],"need":"p","vis":[],"t":"F","x":683.46,"y":452.83,"anc":"start"},{"f":"ar","id":"rd","x0":536,"y0":420,"x1":630,"y1":420,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[578,452,"middle",[0,1]],[578,390,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":538,"y":482,"anc":"middle"},{"f":"ar","id":"ha","x0":670,"y0":420,"x1":670,"y1":290,"need":"h","sel":"ha","var":{"up":{"x0":670,"y0":420,"x1":670,"y1":290},"down":{"x0":670,"y0":420,"x1":670,"y1":550}},"dflt":"up","gr":"hd","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"vbases":{"up":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"down":[[688,485,"start",[1,0]],[652,485,"end",[-1,0]],[670,580,"middle",[0,1]]]},"need":"h","sel":"ha","var":{"up":{"x":688,"y":355,"anc":"start"},"down":{"x":678,"y":624,"anc":"middle"}},"dflt":"up","vis":[],"t":"F","x":688,"y":355,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ws: {"vars":[],"items":[{"f":"ln","id":"wl","pts":[[380,140],[380,720]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wt","k":"w","bases":[[356,160,"end",[-1,0]]],"need":"w","vis":[],"t":"F","x":356,"y":160,"anc":"end"},{"f":"ar","id":"ia","x0":404,"y0":300,"x1":404,"y1":200,"need":"i","sel":"ia","var":{"up":{"x0":404,"y0":320,"x1":404,"y1":200},"down":{"x0":404,"y0":200,"x1":404,"y1":320}},"dflt":"up","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"vbases":{"up":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"down":[[422,350,"start",[1,0]],[386,350,"end",[-1,0]],[404,430,"middle",[0,1]]]},"need":"i","sel":"ia","var":{"up":{"x":366,"y":250,"anc":"end"},"down":{"x":422,"y":350,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":422,"y":250,"anc":"start"},{"f":"ln","id":"flb","pts":[[230,430],[230.57,425.99],[232.28,422.01],[235.11,418.09],[239.05,414.27],[244.05,410.56],[250.1,407],[257.13,403.62],[265.09,400.43],[273.93,397.47],[283.58,394.76],[293.96,392.32],[305,390.16],[316.61,388.31],[328.7,386.77],[341.18,385.57],[353.95,384.7],[366.93,384.18],[380,384],[393.07,384.18],[406.05,384.7],[418.82,385.57],[431.3,386.77],[443.39,388.31],[455,390.16],[466.04,392.32],[476.42,394.76],[486.07,397.47],[494.91,400.43],[502.87,403.62],[509.9,407],[515.95,410.56],[520.95,414.27],[524.89,418.09],[527.72,422.01],[529.43,425.99],[530,430]],"dash":1,"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ln","id":"flf","pts":[[530,430],[529.43,434.01],[527.72,437.99],[524.89,441.91],[520.95,445.73],[515.95,449.44],[509.9,453],[502.87,456.38],[494.91,459.57],[486.07,462.53],[476.42,465.24],[466.04,467.68],[455,469.84],[443.39,471.69],[431.3,473.23],[418.82,474.43],[406.05,475.3],[393.07,475.82],[380,476],[366.93,475.82],[353.95,475.3],[341.18,474.43],[328.7,473.23],[316.61,471.69],[305,469.84],[293.96,467.68],[283.58,465.24],[273.93,462.53],[265.09,459.57],[257.13,456.38],[250.1,453],[244.05,449.44],[239.05,445.73],[235.11,441.91],[232.28,437.99],[230.57,434.01],[230,430]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66},"cw":{"x0":321.39,"y0":387.66,"x1":289.73,"y1":393.26}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26},"cw":{"x0":470.27,"y0":393.26,"x1":438.61,"y1":387.66}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[214,400,"end",[-1,-1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":214,"y":400,"anc":"end"},{"f":"c","id":"ppd","cx":740,"cy":430,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[760,430,"start",[1,0]]],"need":"p","vis":[],"t":"F","x":760,"y":430,"anc":"start"},{"f":"ln","id":"re1","pts":[[380,496],[380,574]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[740,496],[740,574]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":380,"y0":560,"x1":740,"y1":560,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[560,600,"middle",[0,1]],[560,520,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":560,"y":600,"anc":"middle"},{"f":"ln","id":"dl","pts":[[380,190],[740,430]],"dash":1,"w":3,"o":["dd"],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[580,290,"start",[1,-1]]],"o":["dd"],"need":"d","vis":[],"t":"F","x":580,"y":290,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  sw: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"fl","pts":[[640,420],[639.39,433.94],[637.57,447.78],[634.55,461.41],[630.35,474.72],[625.01,487.62],[618.56,500],[611.06,511.77],[602.57,522.85],[593.14,533.14],[582.85,542.57],[571.77,551.06],[560,558.56],[547.62,565.01],[534.72,570.35],[521.41,574.55],[507.78,577.57],[493.94,579.39],[480,580],[466.06,579.39],[452.22,577.57],[438.59,574.55],[425.28,570.35],[412.38,565.01],[400,558.56],[388.23,551.06],[377.15,542.57],[366.86,533.14],[357.43,522.85],[348.94,511.77],[341.44,500],[334.99,487.62],[329.65,474.72],[325.45,461.41],[322.43,447.78],[320.61,433.94],[320,420],[320.61,406.06],[322.43,392.22],[325.45,378.59],[329.65,365.28],[334.99,352.38],[341.44,340],[348.94,328.23],[357.43,317.15],[366.86,306.86],[377.15,297.43],[388.23,288.94],[400,281.44],[412.38,274.99],[425.28,269.65],[438.59,265.45],[452.22,262.43],[466.06,260.61],[480,260],[493.94,260.61],[507.78,262.43],[521.41,265.45],[534.72,269.65],[547.62,274.99],[560,281.44],[571.77,288.94],[582.85,297.43],[593.14,306.86],[602.57,317.15],[611.06,328.23],[618.56,340],[625.01,352.38],[630.35,365.28],[634.55,378.59],[637.57,392.22],[639.39,406.06],[640,420]],"w":3,"o":["fld"],"need":"fl","vis":[1],"t":"F"},{"f":"ar","id":"flh0","x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92},"cw":{"x0":578.51,"y0":293.92,"x1":606.08,"y1":321.49}},"dflt":"ccw","vis":[1],"t":"F"},{"f":"ar","id":"flh1","x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49},"cw":{"x0":353.92,"y0":321.49,"x1":381.49,"y1":293.92}},"dflt":"ccw","vis":[1],"t":"F"},{"f":"ar","id":"flh2","x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08},"cw":{"x0":381.49,"y0":546.08,"x1":353.92,"y1":518.51}},"dflt":"ccw","vis":[1],"t":"F"},{"f":"ar","id":"flh3","x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51},"cw":{"x0":606.08,"y0":518.51,"x1":578.51,"y1":546.08}},"dflt":"ccw","vis":[1],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[605,280,"start",[1,-1]]],"o":["fld"],"need":"fl","vis":[1],"t":"F","x":647.43,"y":237.57,"anc":"start"},{"f":"ln","id":"lp","pts":[[297.7,486.35],[287.15,441.12],[287.66,394.68],[299.19,349.69],[321.08,308.73],[352.09,274.14],[390.42,247.92],[433.89,231.56],[480,226],[526.11,231.56],[569.58,247.92],[607.91,274.14],[638.92,308.73],[660.81,349.69],[672.34,394.68],[672.85,441.12],[662.3,486.35],[641.31,527.78],[611.06,563.03],[573.31,590.08],[530.21,607.39],[484.23,613.95],[438.01,609.4]],"w":3,"o":["lpd"],"need":"lp","vis":[1],"t":"F"},{"f":"ar","id":"lph","x0":438.01,"y0":609.4,"x1":355.3,"y1":568.61,"o":["lpd"],"need":"lp","vis":[1],"t":"F"},{"f":"lb","id":"lpt","k":"lp","bases":[[330,610,"end",[-1,1]]],"o":["lpd"],"need":"lp","vis":[1],"t":"F","x":330,"y":610,"anc":"end"},{"f":"c","id":"cc","cx":480,"cy":420,"r":32,"fill":"w","vis":[1],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[434,380,"end",[-1,-1]],[480,360,"middle",[0,-1]]],"need":"c","vis":[1],"t":"F","x":480,"y":360,"anc":"middle"},{"f":"c","id":"ppd","cx":640,"cy":420,"r":8,"fill":"k","need":"p","vis":[1],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[658,450,"start",[1,1]]],"need":"p","vis":[1],"t":"F","x":683.46,"y":452.83,"anc":"start"},{"f":"ar","id":"rd","x0":536,"y0":420,"x1":630,"y1":420,"two":1,"w":2,"need":"r","vis":[1],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[578,452,"middle",[0,1]],[578,390,"middle",[0,-1]]],"need":"r","vis":[1],"t":"F","x":538,"y":482,"anc":"middle"},{"f":"ar","id":"ha","x0":670,"y0":420,"x1":670,"y1":290,"need":"h","sel":"ha","var":{"up":{"x0":670,"y0":420,"x1":670,"y1":290},"down":{"x0":670,"y0":420,"x1":670,"y1":550}},"dflt":"up","gr":"hd","vis":[1],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"vbases":{"up":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"down":[[688,485,"start",[1,0]],[652,485,"end",[-1,0]],[670,580,"middle",[0,1]]]},"need":"h","sel":"ha","var":{"up":{"x":688,"y":355,"anc":"start"},"down":{"x":678,"y":624,"anc":"middle"}},"dflt":"up","vis":[1],"t":"F","x":688,"y":355,"anc":"start"},{"f":"ln","id":"wlx1","pts":[[380,140],[380,720]],"w":6,"vis":[2],"t":"F"},{"f":"lb","id":"wtx1","k":"w","bases":[[356,160,"end",[-1,0]]],"need":"w","vis":[2],"t":"F","x":356,"y":160,"anc":"end","n":"wx1"},{"f":"ar","id":"iax1","x0":404,"y0":300,"x1":404,"y1":200,"need":"i","sel":"ia","var":{"up":{"x0":404,"y0":320,"x1":404,"y1":200},"down":{"x0":404,"y0":200,"x1":404,"y1":320}},"dflt":"up","vis":[2],"t":"F"},{"f":"lb","id":"itx1","k":"i","bases":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"vbases":{"up":[[422,250,"start",[1,0]],[386,250,"end",[-1,0]],[404,170,"middle",[0,-1]]],"down":[[422,350,"start",[1,0]],[386,350,"end",[-1,0]],[404,430,"middle",[0,1]]]},"need":"i","sel":"ia","var":{"up":{"x":366,"y":250,"anc":"end"},"down":{"x":422,"y":350,"anc":"start"}},"dflt":"up","vis":[2],"t":"F","x":422,"y":250,"anc":"start","n":"ix1"},{"f":"ln","id":"flbx1","pts":[[230,430],[230.57,425.99],[232.28,422.01],[235.11,418.09],[239.05,414.27],[244.05,410.56],[250.1,407],[257.13,403.62],[265.09,400.43],[273.93,397.47],[283.58,394.76],[293.96,392.32],[305,390.16],[316.61,388.31],[328.7,386.77],[341.18,385.57],[353.95,384.7],[366.93,384.18],[380,384],[393.07,384.18],[406.05,384.7],[418.82,385.57],[431.3,386.77],[443.39,388.31],[455,390.16],[466.04,392.32],[476.42,394.76],[486.07,397.47],[494.91,400.43],[502.87,403.62],[509.9,407],[515.95,410.56],[520.95,414.27],[524.89,418.09],[527.72,422.01],[529.43,425.99],[530,430]],"dash":1,"w":3,"o":["fld"],"need":"fl","vis":[2],"t":"F"},{"f":"ln","id":"flfx1","pts":[[530,430],[529.43,434.01],[527.72,437.99],[524.89,441.91],[520.95,445.73],[515.95,449.44],[509.9,453],[502.87,456.38],[494.91,459.57],[486.07,462.53],[476.42,465.24],[466.04,467.68],[455,469.84],[443.39,471.69],[431.3,473.23],[418.82,474.43],[406.05,475.3],[393.07,475.82],[380,476],[366.93,475.82],[353.95,475.3],[341.18,474.43],[328.7,473.23],[316.61,471.69],[305,469.84],[293.96,467.68],[283.58,465.24],[273.93,462.53],[265.09,459.57],[257.13,456.38],[250.1,453],[244.05,449.44],[239.05,445.73],[235.11,441.91],[232.28,437.99],[230.57,434.01],[230,430]],"w":3,"o":["fld"],"need":"fl","vis":[2],"t":"F"},{"f":"ar","id":"flh0x1","x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":289.73,"y0":393.26,"x1":321.39,"y1":387.66},"cw":{"x0":321.39,"y0":387.66,"x1":289.73,"y1":393.26}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"ar","id":"flh1x1","x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":438.61,"y0":387.66,"x1":470.27,"y1":393.26},"cw":{"x0":470.27,"y0":393.26,"x1":438.61,"y1":387.66}},"dflt":"ccw","vis":[2],"t":"F"},{"f":"lb","id":"fltx1","k":"fl","bases":[[214,400,"end",[-1,-1]]],"o":["fld"],"need":"fl","vis":[2],"t":"F","x":214,"y":400,"anc":"end","n":"flx1"},{"f":"c","id":"ppdx1","cx":740,"cy":430,"r":8,"fill":"k","need":"p","vis":[2],"t":"F"},{"f":"lb","id":"ptx1","k":"p","bases":[[760,430,"start",[1,0]]],"need":"p","vis":[2],"t":"F","x":760,"y":430,"anc":"start","n":"px1"},{"f":"ln","id":"re1x1","pts":[[380,496],[380,574]],"w":2,"need":"r","vis":[2],"t":"F"},{"f":"ln","id":"re2x1","pts":[[740,496],[740,574]],"w":2,"need":"r","vis":[2],"t":"F"},{"f":"ar","id":"rdx1","x0":380,"y0":560,"x1":740,"y1":560,"two":1,"w":2,"need":"r","vis":[2],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[560,600,"middle",[0,1]],[560,520,"middle",[0,-1]]],"need":"r","vis":[2],"t":"F","x":560,"y":600,"anc":"middle","n":"rx1"},{"f":"ln","id":"dlx1","pts":[[380,190],[740,430]],"dash":1,"w":3,"o":["dd"],"need":"d","vis":[2],"t":"F"},{"f":"lb","id":"dtx1","k":"d","bases":[[580,290,"start",[1,-1]]],"o":["dd"],"need":"d","vis":[2],"t":"F","x":580,"y":290,"anc":"start","n":"dx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU20s2wc(d, p, L){ tbFig_Draw(d, p, L, U20S2K.wc); }
function tbU20s2ws(d, p, L){ tbFig_Draw(d, p, L, U20S2K.ws); }
function tbU20s2sw(d, p, L){ tbFig_Draw(d, p, L, U20S2K.sw); }
// ---- 20-3 円形コイルの中心 の図（※ textbook/gen/make_section.py が textbook/gen/data/u20_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U20S3K = {
  cl: {"vars":[],"items":[{"f":"ln","id":"cl","pts":[[680,420],[679.24,437.43],[676.96,454.73],[673.19,471.76],[667.94,488.4],[661.26,504.52],[653.21,520],[643.83,534.72],[633.21,548.56],[621.42,561.42],[608.56,573.21],[594.72,583.83],[580,593.21],[564.52,601.26],[548.4,607.94],[531.76,613.19],[514.73,616.96],[497.43,619.24],[480,620],[462.57,619.24],[445.27,616.96],[428.24,613.19],[411.6,607.94],[395.48,601.26],[380,593.21],[365.28,583.83],[351.44,573.21],[338.58,561.42],[326.79,548.56],[316.17,534.72],[306.79,520],[298.74,504.52],[292.06,488.4],[286.81,471.76],[283.04,454.73],[280.76,437.43],[280,420],[280.76,402.57],[283.04,385.27],[286.81,368.24],[292.06,351.6],[298.74,335.48],[306.79,320],[316.17,305.28],[326.79,291.44],[338.58,278.58],[351.44,266.79],[365.28,256.17],[380,246.79],[395.48,238.74],[411.6,232.06],[428.24,226.81],[445.27,223.04],[462.57,220.76],[480,220],[497.43,220.76],[514.73,223.04],[531.76,226.81],[548.4,232.06],[564.52,238.74],[580,246.79],[594.72,256.17],[608.56,266.79],[621.42,278.58],[633.21,291.44],[643.83,305.28],[653.21,320],[661.26,335.48],[667.94,351.6],[673.19,368.24],[676.96,385.27],[679.24,402.57],[680,420]],"w":6,"no":["rs"],"vis":[],"t":"F"},{"f":"ln","id":"clx0","pts":[[671,420],[670.27,436.65],[668.1,453.17],[664.49,469.43],[659.48,485.33],[653.1,500.72],[645.41,515.5],[636.46,529.55],[626.31,542.77],[615.06,555.06],[602.77,566.31],[589.55,576.46],[575.5,585.41],[560.72,593.1],[545.33,599.48],[529.43,604.49],[513.17,608.1],[496.65,610.27],[480,611],[463.35,610.27],[446.83,608.1],[430.57,604.49],[414.67,599.48],[399.28,593.1],[384.5,585.41],[370.45,576.46],[357.23,566.31],[344.94,555.06],[333.69,542.77],[323.54,529.55],[314.59,515.5],[306.9,500.72],[300.52,485.33],[295.51,469.43],[291.9,453.17],[289.73,436.65],[289,420],[289.73,403.35],[291.9,386.83],[295.51,370.57],[300.52,354.67],[306.9,339.28],[314.59,324.5],[323.54,310.45],[333.69,297.23],[344.94,284.94],[357.23,273.69],[370.45,263.54],[384.5,254.59],[399.28,246.9],[414.67,240.52],[430.57,235.51],[446.83,231.9],[463.35,229.73],[480,229],[496.65,229.73],[513.17,231.9],[529.43,235.51],[545.33,240.52],[560.72,246.9],[575.5,254.59],[589.55,263.54],[602.77,273.69],[615.06,284.94],[626.31,297.23],[636.46,310.45],[645.41,324.5],[653.1,339.28],[659.48,354.67],[664.49,370.57],[668.1,386.83],[670.27,403.35],[671,420]],"w":3,"no":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"clx1","pts":[[689,420],[688.2,438.22],[685.82,456.29],[681.88,474.09],[676.4,491.48],[669.42,508.33],[661,524.5],[651.2,539.88],[640.1,554.34],[627.79,567.79],[614.34,580.1],[599.88,591.2],[584.5,601],[568.33,609.42],[551.48,616.4],[534.09,621.88],[516.29,625.82],[498.22,628.2],[480,629],[461.78,628.2],[443.71,625.82],[425.91,621.88],[408.52,616.4],[391.67,609.42],[375.5,601],[360.12,591.2],[345.66,580.1],[332.21,567.79],[319.9,554.34],[308.8,539.88],[299,524.5],[290.58,508.33],[283.6,491.48],[278.12,474.09],[274.18,456.29],[271.8,438.22],[271,420],[271.8,401.78],[274.18,383.71],[278.12,365.91],[283.6,348.52],[290.58,331.67],[299,315.5],[308.8,300.12],[319.9,285.66],[332.21,272.21],[345.66,259.9],[360.12,248.8],[375.5,239],[391.67,230.58],[408.52,223.6],[425.91,218.12],[443.71,214.18],[461.78,211.8],[480,211],[498.22,211.8],[516.29,214.18],[534.09,218.12],[551.48,223.6],[568.33,230.58],[584.5,239],[599.88,248.8],[614.34,259.9],[627.79,272.21],[640.1,285.66],[651.2,300.12],[661,315.5],[669.42,331.67],[676.4,348.52],[681.88,365.91],[685.82,383.71],[688.2,401.78],[689,420]],"w":3,"no":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":502,"y0":220,"x1":458,"y1":220,"w":5,"no":["rs"],"need":"i","sel":"ia","var":{"ccw":{"x0":502,"y0":220,"x1":458,"y1":220},"cw":{"x0":458,"y0":220,"x1":502,"y1":220}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[480,174,"middle",[0,-1]]],"no":["rs"],"need":"i","vis":[],"t":"F","x":480,"y":94,"anc":"middle"},{"f":"ar","id":"rd","x0":490,"y0":426,"x1":643.83,"y1":534.72,"two":1,"w":2,"no":["rs"],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[571.92,507.36,"start",[0.5,1]]],"no":["rs"],"need":"r","vis":[],"t":"F","x":661.36,"y":686.24,"anc":"start"},{"f":"lb","id":"clt","k":"cl","bases":[[630,250,"start",[1,-1]]],"no":["rs"],"need":"cl","vis":[],"t":"F","x":693.64,"y":186.36,"anc":"start"},{"f":"ln","id":"clb","pts":[[760,420],[758.93,444.4],[755.75,468.62],[750.46,492.47],[743.11,515.77],[733.77,538.33],[722.49,560],[709.36,580.6],[694.49,599.98],[677.99,617.99],[659.98,634.49],[640.6,649.36],[620,662.49],[598.33,673.77],[575.77,683.11],[552.47,690.46],[528.62,695.75],[504.4,698.93],[480,700],[455.6,698.93],[431.38,695.75],[407.53,690.46],[384.23,683.11],[361.67,673.77],[340,662.49],[319.4,649.36],[300.02,634.49],[282.01,617.99],[265.51,599.98],[250.64,580.6],[237.51,560],[226.23,538.33],[216.89,515.77],[209.54,492.47],[204.25,468.62],[201.07,444.4],[200,420],[201.07,395.6],[204.25,371.38],[209.54,347.53],[216.89,324.23],[226.23,301.67],[237.51,280],[250.64,259.4],[265.51,240.02],[282.01,222.01],[300.02,205.51],[319.4,190.64],[340,177.51],[361.67,166.23],[384.23,156.89],[407.53,149.54],[431.38,144.25],[455.6,141.07],[480,140],[504.4,141.07],[528.62,144.25],[552.47,149.54],[575.77,156.89],[598.33,166.23],[620,177.51],[640.6,190.64],[659.98,205.51],[677.99,222.01],[694.49,240.02],[709.36,259.4],[722.49,280],[733.77,301.67],[743.11,324.23],[750.46,347.53],[755.75,371.38],[758.93,395.6],[760,420]],"w":6,"o":["rs"],"vis":[],"t":"F"},{"f":"ln","id":"clbx0","pts":[[751,420],[749.97,443.62],[746.88,467.06],[741.77,490.14],[734.66,512.69],[725.61,534.53],[714.69,555.5],[701.99,575.44],[687.6,594.2],[671.63,611.63],[654.2,627.6],[635.44,641.99],[615.5,654.69],[594.53,665.61],[572.69,674.66],[550.14,681.77],[527.06,686.88],[503.62,689.97],[480,691],[456.38,689.97],[432.94,686.88],[409.86,681.77],[387.31,674.66],[365.47,665.61],[344.5,654.69],[324.56,641.99],[305.8,627.6],[288.37,611.63],[272.4,594.2],[258.01,575.44],[245.31,555.5],[234.39,534.53],[225.34,512.69],[218.23,490.14],[213.12,467.06],[210.03,443.62],[209,420],[210.03,396.38],[213.12,372.94],[218.23,349.86],[225.34,327.31],[234.39,305.47],[245.31,284.5],[258.01,264.56],[272.4,245.8],[288.37,228.37],[305.8,212.4],[324.56,198.01],[344.5,185.31],[365.47,174.39],[387.31,165.34],[409.86,158.23],[432.94,153.12],[456.38,150.03],[480,149],[503.62,150.03],[527.06,153.12],[550.14,158.23],[572.69,165.34],[594.53,174.39],[615.5,185.31],[635.44,198.01],[654.2,212.4],[671.63,228.37],[687.6,245.8],[701.99,264.56],[714.69,284.5],[725.61,305.47],[734.66,327.31],[741.77,349.86],[746.88,372.94],[749.97,396.38],[751,420]],"w":3,"o":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"clbx1","pts":[[769,420],[767.9,445.19],[764.61,470.18],[759.15,494.8],[751.57,518.84],[741.92,542.14],[730.28,564.5],[716.73,585.76],[701.39,605.77],[684.35,624.35],[665.77,641.39],[645.76,656.73],[624.5,670.28],[602.14,681.92],[578.84,691.57],[554.8,699.15],[530.18,704.61],[505.19,707.9],[480,709],[454.81,707.9],[429.82,704.61],[405.2,699.15],[381.16,691.57],[357.86,681.92],[335.5,670.28],[314.24,656.73],[294.23,641.39],[275.65,624.35],[258.61,605.77],[243.27,585.76],[229.72,564.5],[218.08,542.14],[208.43,518.84],[200.85,494.8],[195.39,470.18],[192.1,445.19],[191,420],[192.1,394.81],[195.39,369.82],[200.85,345.2],[208.43,321.16],[218.08,297.86],[229.72,275.5],[243.27,254.24],[258.61,234.23],[275.65,215.65],[294.23,198.61],[314.24,183.27],[335.5,169.72],[357.86,158.08],[381.16,148.43],[405.2,140.85],[429.82,135.39],[454.81,132.1],[480,131],[505.19,132.1],[530.18,135.39],[554.8,140.85],[578.84,148.43],[602.14,158.08],[624.5,169.72],[645.76,183.27],[665.77,198.61],[684.35,215.65],[701.39,234.23],[716.73,254.24],[730.28,275.5],[741.92,297.86],[751.57,321.16],[759.15,345.2],[764.61,369.82],[767.9,394.81],[769,420]],"w":3,"o":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ar","id":"iab","x0":502,"y0":140,"x1":458,"y1":140,"w":5,"o":["rs"],"need":"i","sel":"ia","var":{"ccw":{"x0":502,"y0":140,"x1":458,"y1":140},"cw":{"x0":458,"y0":140,"x1":502,"y1":140}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"itb","k":"i","bases":[[480,94,"middle",[0,-1]]],"o":["rs"],"need":"i","vis":[],"t":"F","x":480,"y":34,"anc":"middle"},{"f":"ar","id":"rdb","x0":490,"y0":426,"x1":709.36,"y1":580.6,"two":1,"w":2,"o":["rs"],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rtb","k":"r","bases":[[604.68,530.3,"start",[0.5,1]]],"o":["rs"],"need":"r","vis":[],"t":"F","x":622.57,"y":736.02,"anc":"start"},{"f":"lb","id":"cltb","k":"cl","bases":[[690,190,"start",[1,-1]]],"o":["rs"],"need":"cl","vis":[],"t":"F","x":636.26,"y":136.26,"anc":"start"},{"f":"c","id":"od","cx":480,"cy":420,"r":7,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"ot","k":"o","bases":[[464,392,"end",[-1,-1]]],"need":"o","vis":[],"t":"F","x":464,"y":392,"anc":"end"},{"f":"lb","id":"ht","k":"h","bases":[[480,466,"middle",[0,1]],[496,386,"start",[1,-1]]],"o":["hd"],"need":"h","vis":[],"t":"F","x":480,"y":526,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU20s3cl(d, p, L){ tbFig_Draw(d, p, L, U20S3K.cl); }
// ---- 20-4 環状ソレノイド の図（※ textbook/gen/make_section.py が textbook/gen/data/u20_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U20S4K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[690,420],[689.35,434.82],[687.42,449.52],[684.21,464],[679.75,478.14],[674.07,491.85],[667.22,505],[659.26,517.51],[650.23,529.27],[640.21,540.21],[629.27,550.23],[617.51,559.26],[605,567.22],[591.85,574.07],[578.14,579.75],[564,584.21],[549.52,587.42],[534.82,589.35],[520,590],[505.18,589.35],[490.48,587.42],[476,584.21],[461.86,579.75],[448.15,574.07],[435,567.22],[422.49,559.26],[410.73,550.23],[399.79,540.21],[389.77,529.27],[380.74,517.51],[372.78,505],[365.93,491.85],[360.25,478.14],[355.79,464],[352.58,449.52],[350.65,434.82],[350,420],[350.65,405.18],[352.58,390.48],[355.79,376],[360.25,361.86],[365.93,348.15],[372.78,335],[380.74,322.49],[389.77,310.73],[399.79,299.79],[410.73,289.77],[422.49,280.74],[435,272.78],[448.15,265.93],[461.86,260.25],[476,255.79],[490.48,252.58],[505.18,250.65],[520,250],[534.82,250.65],[549.52,252.58],[564,255.79],[578.14,260.25],[591.85,265.93],[605,272.78],[617.51,280.74],[629.27,289.77],[640.21,299.79],[650.23,310.73],[659.26,322.49],[667.22,335],[674.07,348.15],[679.75,361.86],[684.21,376],[687.42,390.48],[689.35,405.18],[690,420]],"w":80,"col":"#ced4da","vis":[],"t":"F"},{"f":"lb","id":"coret","k":"core","bases":[[670,220,"start",[1,-1]]],"need":"core","vis":[],"t":"F","x":658.69,"y":208.69,"anc":"start"},{"f":"ln","id":"wd0","pts":[[452.32,323.34],[392.67,238.15]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd1","pts":[[436.56,336.56],[363.02,263.02]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd2","pts":[[423.34,352.32],[338.15,292.67]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd3","pts":[[413.06,370.13],[318.8,326.18]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd4","pts":[[406.02,389.46],[305.56,362.54]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd5","pts":[[402.45,409.72],[298.84,400.65]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd6","pts":[[402.45,430.28],[298.84,439.35]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd7","pts":[[406.02,450.54],[305.56,477.46]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd8","pts":[[413.06,469.87],[318.8,513.82]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd9","pts":[[423.34,487.68],[338.15,547.33]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd10","pts":[[436.56,503.44],[363.02,576.98]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd11","pts":[[452.32,516.66],[392.67,601.85]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld0","pts":[[392.67,238.15],[232.67,238.15]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[392.67,601.85],[232.67,601.85]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"nt","k":"n","bases":[[362.67,198.15,"end",[-1,-1]]],"need":"n","vis":[],"t":"F","x":362.67,"y":198.15,"anc":"end"},{"f":"ar","id":"ia","x0":242.67,"y0":238.15,"x1":332.67,"y1":238.15,"o":["id"],"need":"i","sel":"ia","var":{"in":{"x0":242.67,"y0":238.15,"x1":332.67,"y1":238.15},"out":{"x0":332.67,"y0":238.15,"x1":242.67,"y1":238.15}},"dflt":"in","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[287.67,208.15,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":287.67,"y":148.15,"anc":"middle"},{"f":"ar","id":"rd","x0":520,"y0":420,"x1":650.23,"y1":529.27,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"c","id":"rc0","cx":520,"cy":420,"r":6,"fill":"k","need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[565.11,504.64,"end",[-1,1]]],"need":"r","vis":[],"t":"F","x":429.35,"y":651.72,"anc":"end"},{"f":"ln","id":"hlccw","pts":[[617.51,559.26],[630.41,549.27],[642.29,538.09],[653.04,525.83],[662.57,512.59],[670.79,498.5],[677.62,483.68],[683,468.28],[686.88,452.44],[689.22,436.29],[690,420],[689.22,403.71],[686.88,387.56],[683,371.72],[677.62,356.32],[670.79,341.5],[662.57,327.41],[653.04,314.17],[642.29,301.91]],"w":4,"o":["hd"],"need":"h","sel":"ha","var":{"ccw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"ar","id":"hhccw","x0":642.29,"y0":301.91,"x1":617.51,"y1":280.74,"o":["hd"],"need":"h","sel":"ha","var":{"ccw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"ln","id":"hlcw","pts":[[617.51,280.74],[630.41,290.73],[642.29,301.91],[653.04,314.17],[662.57,327.41],[670.79,341.5],[677.62,356.32],[683,371.72],[686.88,387.56],[689.22,403.71],[690,420],[689.22,436.29],[686.88,452.44],[683,468.28],[677.62,483.68],[670.79,498.5],[662.57,512.59],[653.04,525.83],[642.29,538.09]],"w":4,"o":["hd"],"need":"h","sel":"ha","var":{"cw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"ar","id":"hhcw","x0":642.29,"y0":538.09,"x1":617.51,"y1":559.26,"o":["hd"],"need":"h","sel":"ha","var":{"cw":{}},"col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[750,420,"start",[1,0]]],"o":["hd"],"need":"h","vis":[],"t":"F","x":750,"y":420,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  wc: {"vars":[],"items":[{"f":"ln","id":"fl","pts":[[640,420],[639.39,433.94],[637.57,447.78],[634.55,461.41],[630.35,474.72],[625.01,487.62],[618.56,500],[611.06,511.77],[602.57,522.85],[593.14,533.14],[582.85,542.57],[571.77,551.06],[560,558.56],[547.62,565.01],[534.72,570.35],[521.41,574.55],[507.78,577.57],[493.94,579.39],[480,580],[466.06,579.39],[452.22,577.57],[438.59,574.55],[425.28,570.35],[412.38,565.01],[400,558.56],[388.23,551.06],[377.15,542.57],[366.86,533.14],[357.43,522.85],[348.94,511.77],[341.44,500],[334.99,487.62],[329.65,474.72],[325.45,461.41],[322.43,447.78],[320.61,433.94],[320,420],[320.61,406.06],[322.43,392.22],[325.45,378.59],[329.65,365.28],[334.99,352.38],[341.44,340],[348.94,328.23],[357.43,317.15],[366.86,306.86],[377.15,297.43],[388.23,288.94],[400,281.44],[412.38,274.99],[425.28,269.65],[438.59,265.45],[452.22,262.43],[466.06,260.61],[480,260],[493.94,260.61],[507.78,262.43],[521.41,265.45],[534.72,269.65],[547.62,274.99],[560,281.44],[571.77,288.94],[582.85,297.43],[593.14,306.86],[602.57,317.15],[611.06,328.23],[618.56,340],[625.01,352.38],[630.35,365.28],[634.55,378.59],[637.57,392.22],[639.39,406.06],[640,420]],"w":3,"o":["fld"],"need":"fl","vis":[],"t":"F"},{"f":"ar","id":"flh0","x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":606.08,"y0":321.49,"x1":578.51,"y1":293.92},"cw":{"x0":578.51,"y0":293.92,"x1":606.08,"y1":321.49}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh1","x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":381.49,"y0":293.92,"x1":353.92,"y1":321.49},"cw":{"x0":353.92,"y0":321.49,"x1":381.49,"y1":293.92}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh2","x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":353.92,"y0":518.51,"x1":381.49,"y1":546.08},"cw":{"x0":381.49,"y0":546.08,"x1":353.92,"y1":518.51}},"dflt":"ccw","vis":[],"t":"F"},{"f":"ar","id":"flh3","x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51,"o":["fld"],"need":"fl","sel":"fla","var":{"ccw":{"x0":578.51,"y0":546.08,"x1":606.08,"y1":518.51},"cw":{"x0":606.08,"y0":518.51,"x1":578.51,"y1":546.08}},"dflt":"ccw","vis":[],"t":"F"},{"f":"lb","id":"flt","k":"fl","bases":[[605,280,"start",[1,-1]]],"o":["fld"],"need":"fl","vis":[],"t":"F","x":647.43,"y":237.57,"anc":"start"},{"f":"ln","id":"lp","pts":[[297.7,486.35],[287.15,441.12],[287.66,394.68],[299.19,349.69],[321.08,308.73],[352.09,274.14],[390.42,247.92],[433.89,231.56],[480,226],[526.11,231.56],[569.58,247.92],[607.91,274.14],[638.92,308.73],[660.81,349.69],[672.34,394.68],[672.85,441.12],[662.3,486.35],[641.31,527.78],[611.06,563.03],[573.31,590.08],[530.21,607.39],[484.23,613.95],[438.01,609.4]],"w":3,"o":["lpd"],"need":"lp","vis":[],"t":"F"},{"f":"ar","id":"lph","x0":438.01,"y0":609.4,"x1":355.3,"y1":568.61,"o":["lpd"],"need":"lp","vis":[],"t":"F"},{"f":"lb","id":"lpt","k":"lp","bases":[[330,610,"end",[-1,1]]],"o":["lpd"],"need":"lp","vis":[],"t":"F","x":330,"y":610,"anc":"end"},{"f":"c","id":"cc","cx":480,"cy":420,"r":32,"fill":"w","vis":[],"t":"F","sel":["ca"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"ct","k":"c","bases":[[434,380,"end",[-1,-1]],[480,360,"middle",[0,-1]]],"need":"c","vis":[],"t":"F","x":434,"y":380,"anc":"end"},{"f":"c","id":"ppd","cx":640,"cy":420,"r":8,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[658,450,"start",[1,1]]],"need":"p","vis":[],"t":"F","x":683.46,"y":452.83,"anc":"start"},{"f":"ar","id":"rd","x0":536,"y0":420,"x1":630,"y1":420,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[578,452,"middle",[0,1]],[578,390,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":538,"y":482,"anc":"middle"},{"f":"ar","id":"ha","x0":670,"y0":420,"x1":670,"y1":290,"need":"h","sel":"ha","var":{"up":{"x0":670,"y0":420,"x1":670,"y1":290},"down":{"x0":670,"y0":420,"x1":670,"y1":550}},"dflt":"up","gr":"hd","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"vbases":{"up":[[688,355,"start",[1,0]],[652,355,"end",[-1,0]],[670,260,"middle",[0,-1]]],"down":[[688,485,"start",[1,0]],[652,485,"end",[-1,0]],[670,580,"middle",[0,1]]]},"need":"h","sel":"ha","var":{"up":{"x":688,"y":355,"anc":"start"},"down":{"x":670,"y":624,"anc":"middle"}},"dflt":"up","vis":[],"t":"F","x":688,"y":355,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  cl: {"vars":[],"items":[{"f":"ln","id":"cl","pts":[[680,420],[679.24,437.43],[676.96,454.73],[673.19,471.76],[667.94,488.4],[661.26,504.52],[653.21,520],[643.83,534.72],[633.21,548.56],[621.42,561.42],[608.56,573.21],[594.72,583.83],[580,593.21],[564.52,601.26],[548.4,607.94],[531.76,613.19],[514.73,616.96],[497.43,619.24],[480,620],[462.57,619.24],[445.27,616.96],[428.24,613.19],[411.6,607.94],[395.48,601.26],[380,593.21],[365.28,583.83],[351.44,573.21],[338.58,561.42],[326.79,548.56],[316.17,534.72],[306.79,520],[298.74,504.52],[292.06,488.4],[286.81,471.76],[283.04,454.73],[280.76,437.43],[280,420],[280.76,402.57],[283.04,385.27],[286.81,368.24],[292.06,351.6],[298.74,335.48],[306.79,320],[316.17,305.28],[326.79,291.44],[338.58,278.58],[351.44,266.79],[365.28,256.17],[380,246.79],[395.48,238.74],[411.6,232.06],[428.24,226.81],[445.27,223.04],[462.57,220.76],[480,220],[497.43,220.76],[514.73,223.04],[531.76,226.81],[548.4,232.06],[564.52,238.74],[580,246.79],[594.72,256.17],[608.56,266.79],[621.42,278.58],[633.21,291.44],[643.83,305.28],[653.21,320],[661.26,335.48],[667.94,351.6],[673.19,368.24],[676.96,385.27],[679.24,402.57],[680,420]],"w":6,"no":["rs"],"vis":[],"t":"F"},{"f":"ln","id":"clx0","pts":[[671,420],[670.27,436.65],[668.1,453.17],[664.49,469.43],[659.48,485.33],[653.1,500.72],[645.41,515.5],[636.46,529.55],[626.31,542.77],[615.06,555.06],[602.77,566.31],[589.55,576.46],[575.5,585.41],[560.72,593.1],[545.33,599.48],[529.43,604.49],[513.17,608.1],[496.65,610.27],[480,611],[463.35,610.27],[446.83,608.1],[430.57,604.49],[414.67,599.48],[399.28,593.1],[384.5,585.41],[370.45,576.46],[357.23,566.31],[344.94,555.06],[333.69,542.77],[323.54,529.55],[314.59,515.5],[306.9,500.72],[300.52,485.33],[295.51,469.43],[291.9,453.17],[289.73,436.65],[289,420],[289.73,403.35],[291.9,386.83],[295.51,370.57],[300.52,354.67],[306.9,339.28],[314.59,324.5],[323.54,310.45],[333.69,297.23],[344.94,284.94],[357.23,273.69],[370.45,263.54],[384.5,254.59],[399.28,246.9],[414.67,240.52],[430.57,235.51],[446.83,231.9],[463.35,229.73],[480,229],[496.65,229.73],[513.17,231.9],[529.43,235.51],[545.33,240.52],[560.72,246.9],[575.5,254.59],[589.55,263.54],[602.77,273.69],[615.06,284.94],[626.31,297.23],[636.46,310.45],[645.41,324.5],[653.1,339.28],[659.48,354.67],[664.49,370.57],[668.1,386.83],[670.27,403.35],[671,420]],"w":3,"no":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"clx1","pts":[[689,420],[688.2,438.22],[685.82,456.29],[681.88,474.09],[676.4,491.48],[669.42,508.33],[661,524.5],[651.2,539.88],[640.1,554.34],[627.79,567.79],[614.34,580.1],[599.88,591.2],[584.5,601],[568.33,609.42],[551.48,616.4],[534.09,621.88],[516.29,625.82],[498.22,628.2],[480,629],[461.78,628.2],[443.71,625.82],[425.91,621.88],[408.52,616.4],[391.67,609.42],[375.5,601],[360.12,591.2],[345.66,580.1],[332.21,567.79],[319.9,554.34],[308.8,539.88],[299,524.5],[290.58,508.33],[283.6,491.48],[278.12,474.09],[274.18,456.29],[271.8,438.22],[271,420],[271.8,401.78],[274.18,383.71],[278.12,365.91],[283.6,348.52],[290.58,331.67],[299,315.5],[308.8,300.12],[319.9,285.66],[332.21,272.21],[345.66,259.9],[360.12,248.8],[375.5,239],[391.67,230.58],[408.52,223.6],[425.91,218.12],[443.71,214.18],[461.78,211.8],[480,211],[498.22,211.8],[516.29,214.18],[534.09,218.12],[551.48,223.6],[568.33,230.58],[584.5,239],[599.88,248.8],[614.34,259.9],[627.79,272.21],[640.1,285.66],[651.2,300.12],[661,315.5],[669.42,331.67],[676.4,348.52],[681.88,365.91],[685.82,383.71],[688.2,401.78],[689,420]],"w":3,"no":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":502,"y0":220,"x1":458,"y1":220,"w":5,"no":["rs"],"need":"i","sel":"ia","var":{"ccw":{"x0":502,"y0":220,"x1":458,"y1":220},"cw":{"x0":458,"y0":220,"x1":502,"y1":220}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[480,174,"middle",[0,-1]]],"no":["rs"],"need":"i","vis":[],"t":"F","x":480,"y":94,"anc":"middle"},{"f":"ar","id":"rd","x0":490,"y0":426,"x1":643.83,"y1":534.72,"two":1,"w":2,"no":["rs"],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[571.92,507.36,"start",[0.5,1]]],"no":["rs"],"need":"r","vis":[],"t":"F","x":661.36,"y":686.24,"anc":"start"},{"f":"lb","id":"clt","k":"cl","bases":[[630,250,"start",[1,-1]]],"no":["rs"],"need":"cl","vis":[],"t":"F","x":714.85,"y":165.15,"anc":"start"},{"f":"ln","id":"clb","pts":[[760,420],[758.93,444.4],[755.75,468.62],[750.46,492.47],[743.11,515.77],[733.77,538.33],[722.49,560],[709.36,580.6],[694.49,599.98],[677.99,617.99],[659.98,634.49],[640.6,649.36],[620,662.49],[598.33,673.77],[575.77,683.11],[552.47,690.46],[528.62,695.75],[504.4,698.93],[480,700],[455.6,698.93],[431.38,695.75],[407.53,690.46],[384.23,683.11],[361.67,673.77],[340,662.49],[319.4,649.36],[300.02,634.49],[282.01,617.99],[265.51,599.98],[250.64,580.6],[237.51,560],[226.23,538.33],[216.89,515.77],[209.54,492.47],[204.25,468.62],[201.07,444.4],[200,420],[201.07,395.6],[204.25,371.38],[209.54,347.53],[216.89,324.23],[226.23,301.67],[237.51,280],[250.64,259.4],[265.51,240.02],[282.01,222.01],[300.02,205.51],[319.4,190.64],[340,177.51],[361.67,166.23],[384.23,156.89],[407.53,149.54],[431.38,144.25],[455.6,141.07],[480,140],[504.4,141.07],[528.62,144.25],[552.47,149.54],[575.77,156.89],[598.33,166.23],[620,177.51],[640.6,190.64],[659.98,205.51],[677.99,222.01],[694.49,240.02],[709.36,259.4],[722.49,280],[733.77,301.67],[743.11,324.23],[750.46,347.53],[755.75,371.38],[758.93,395.6],[760,420]],"w":6,"o":["rs"],"vis":[],"t":"F"},{"f":"ln","id":"clbx0","pts":[[751,420],[749.97,443.62],[746.88,467.06],[741.77,490.14],[734.66,512.69],[725.61,534.53],[714.69,555.5],[701.99,575.44],[687.6,594.2],[671.63,611.63],[654.2,627.6],[635.44,641.99],[615.5,654.69],[594.53,665.61],[572.69,674.66],[550.14,681.77],[527.06,686.88],[503.62,689.97],[480,691],[456.38,689.97],[432.94,686.88],[409.86,681.77],[387.31,674.66],[365.47,665.61],[344.5,654.69],[324.56,641.99],[305.8,627.6],[288.37,611.63],[272.4,594.2],[258.01,575.44],[245.31,555.5],[234.39,534.53],[225.34,512.69],[218.23,490.14],[213.12,467.06],[210.03,443.62],[209,420],[210.03,396.38],[213.12,372.94],[218.23,349.86],[225.34,327.31],[234.39,305.47],[245.31,284.5],[258.01,264.56],[272.4,245.8],[288.37,228.37],[305.8,212.4],[324.56,198.01],[344.5,185.31],[365.47,174.39],[387.31,165.34],[409.86,158.23],[432.94,153.12],[456.38,150.03],[480,149],[503.62,150.03],[527.06,153.12],[550.14,158.23],[572.69,165.34],[594.53,174.39],[615.5,185.31],[635.44,198.01],[654.2,212.4],[671.63,228.37],[687.6,245.8],[701.99,264.56],[714.69,284.5],[725.61,305.47],[734.66,327.31],[741.77,349.86],[746.88,372.94],[749.97,396.38],[751,420]],"w":3,"o":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"clbx1","pts":[[769,420],[767.9,445.19],[764.61,470.18],[759.15,494.8],[751.57,518.84],[741.92,542.14],[730.28,564.5],[716.73,585.76],[701.39,605.77],[684.35,624.35],[665.77,641.39],[645.76,656.73],[624.5,670.28],[602.14,681.92],[578.84,691.57],[554.8,699.15],[530.18,704.61],[505.19,707.9],[480,709],[454.81,707.9],[429.82,704.61],[405.2,699.15],[381.16,691.57],[357.86,681.92],[335.5,670.28],[314.24,656.73],[294.23,641.39],[275.65,624.35],[258.61,605.77],[243.27,585.76],[229.72,564.5],[218.08,542.14],[208.43,518.84],[200.85,494.8],[195.39,470.18],[192.1,445.19],[191,420],[192.1,394.81],[195.39,369.82],[200.85,345.2],[208.43,321.16],[218.08,297.86],[229.72,275.5],[243.27,254.24],[258.61,234.23],[275.65,215.65],[294.23,198.61],[314.24,183.27],[335.5,169.72],[357.86,158.08],[381.16,148.43],[405.2,140.85],[429.82,135.39],[454.81,132.1],[480,131],[505.19,132.1],[530.18,135.39],[554.8,140.85],[578.84,148.43],[602.14,158.08],[624.5,169.72],[645.76,183.27],[665.77,198.61],[684.35,215.65],[701.39,234.23],[716.73,254.24],[730.28,275.5],[741.92,297.86],[751.57,321.16],[759.15,345.2],[764.61,369.82],[767.9,394.81],[769,420]],"w":3,"o":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ar","id":"iab","x0":502,"y0":140,"x1":458,"y1":140,"w":5,"o":["rs"],"need":"i","sel":"ia","var":{"ccw":{"x0":502,"y0":140,"x1":458,"y1":140},"cw":{"x0":458,"y0":140,"x1":502,"y1":140}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"itb","k":"i","bases":[[480,94,"middle",[0,-1]]],"o":["rs"],"need":"i","vis":[],"t":"F","x":480,"y":34,"anc":"middle"},{"f":"ar","id":"rdb","x0":490,"y0":426,"x1":709.36,"y1":580.6,"two":1,"w":2,"o":["rs"],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rtb","k":"r","bases":[[604.68,530.3,"start",[0.5,1]]],"o":["rs"],"need":"r","vis":[],"t":"F","x":622.57,"y":736.02,"anc":"start"},{"f":"lb","id":"cltb","k":"cl","bases":[[690,190,"start",[1,-1]]],"o":["rs"],"need":"cl","vis":[],"t":"F","x":650.4,"y":150.4,"anc":"start"},{"f":"c","id":"od","cx":480,"cy":420,"r":7,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"ot","k":"o","bases":[[464,392,"end",[-1,-1]]],"need":"o","vis":[],"t":"F","x":464,"y":392,"anc":"end"},{"f":"lb","id":"ht","k":"h","bases":[[480,466,"middle",[0,1]],[496,386,"start",[1,-1]]],"o":["hd"],"need":"h","vis":[],"t":"F","x":480,"y":466,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU20s4tr(d, p, L){ tbFig_Draw(d, p, L, U20S4K.tr); }
function tbU20s4wc(d, p, L){ tbFig_Draw(d, p, L, U20S4K.wc); }
function tbU20s4cl(d, p, L){ tbFig_Draw(d, p, L, U20S4K.cl); }
var KINDS = {u20s1wc: tbU20s1wc, u20s1ws: tbU20s1ws, u20s1sw: tbU20s1sw, u20s2wc: tbU20s2wc, u20s2ws: tbU20s2ws, u20s2sw: tbU20s2sw, u20s3cl: tbU20s3cl, u20s4tr: tbU20s4tr, u20s4wc: tbU20s4wc, u20s4cl: tbU20s4cl};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 20-1 の図は電流が流れないので載せない,
  // 20-2 の図は電流が流れないので載せない,
  // 20-3 の図は電流が流れないので載せない,
  // 20-4 の図は電流が流れないので載せない
};

// 20-1 右ねじの法則 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u20_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU20s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU20s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU20s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU20s1_par(a, b){ return a * b / (a + b); }
function tbU20s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU20s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU20s1_Qdir(r){
  var gcd = tbU20s1_gcd, ratio = tbU20s1_ratio, par = tbU20s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var ca = (k == 1 ? 'front' : 'back');
    var nm = (k == 1 ? '手前向き（・）' : '奥向き（×）');
    var good = (k == 1 ? '反時計回り' : '時計回り');
    var bad = (k == 1 ? '時計回り' : '反時計回り');
    var why = (k == 1 ? '時計回りになるのは、奥向きの電流' : '反時計回りになるのは、手前向きの電流');
    var th = (k == 1 ? '手前' : '奥');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "導体から外へ向かう向き", v: "out", why: "磁界は導体を囲むように回る"}, {t: "磁界はできない", v: "none", why: "電流を流した導体のまわりには磁界ができる"}]);
    return {form: "u20s1dir", text: "図のように、導体に" + String(nm) + "の電流を流した。導体のまわりにできる磁界の向きはどれか。", fig: {kind: "u20s1wc", L: tbU20s1_fig({"c":"{I}","ca":"front","fl":"","fla":null}, [["ca", String(ca)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右手の親指を" + String(th) + "に向けると、4本の指は" + String(good) + "に巻く", "磁界は " + String(good)], chk: {form: "u20s1dir", p: {k: k}}};
  }
  throw new Error("u20s1dir：条件に合う数字が見つからない");
}
function tbU20s1_Qrev(r){
  var gcd = tbU20s1_gcd, ratio = tbU20s1_ratio, par = tbU20s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var fla = (k == 1 ? 'ccw' : 'cw');
    var nm = (k == 1 ? '反時計回り' : '時計回り');
    var good = (k == 1 ? '手前向き' : '奥向き');
    var bad = (k == 1 ? '奥向き' : '手前向き');
    var why = (k == 1 ? '奥向きの電流なら、磁界は時計回り' : '手前向きの電流なら、磁界は反時計回り');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "右向き", v: "r", why: "電流は導体に沿って、手前か奥に流れる"}, {t: "電流は流れていない", v: "none", why: "磁界ができているので、電流が流れている"}]);
    return {form: "u20s1rev", text: "図のように、導体のまわりに" + String(nm) + "の磁界ができた。導体に流れる電流の向きはどれか。", fig: {kind: "u20s1wc", L: tbU20s1_fig({"c":"{I}","ca":"front","fl":"","fla":null}, [["ca", null], ["fl", "{H}"], ["fla", String(fla)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["4本の指を" + String(nm) + "に巻くと、右手の親指は" + String(good), "電流は " + String(good)], chk: {form: "u20s1rev", p: {k: k}}};
  }
  throw new Error("u20s1rev：条件に合う数字が見つからない");
}
function tbU20s1_Qside(r){
  var gcd = tbU20s1_gcd, ratio = tbU20s1_ratio, par = tbU20s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var ia = (k == 1 ? 'up' : 'down');
    var nm = (k == 1 ? '上向き' : '下向き');
    var good = (k == 1 ? '反時計回り' : '時計回り');
    var bad = (k == 1 ? '時計回り' : '反時計回り');
    var why = (k == 1 ? '時計回りになるのは、下向きの電流' : '反時計回りになるのは、上向きの電流');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: String(nm) + "（電流と同じ向き）", v: "same", why: "磁界は導体を囲むように回る"}, {t: "磁界はできない", v: "none", why: "電流を流した導体のまわりには磁界ができる"}]);
    return {form: "u20s1side", text: "図のように、縦の導体に" + String(nm) + "の電流を流した。上から見ると、導体のまわりの磁界の向きはどれか。", fig: {kind: "u20s1ws", L: tbU20s1_fig({"c":"{I}","ca":"front","fl":"","fla":null}, [["w", ""], ["i", "{I}"], ["ia", String(ia)], ["fl", ""], ["fla", null], ["c", null], ["ca", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右手の親指を" + String(nm) + "に向けると、上から見て4本の指は" + String(good) + "に巻く", "磁界は " + String(good)], chk: {form: "u20s1side", p: {k: k}}};
  }
  throw new Error("u20s1side：条件に合う数字が見つからない");
}
function tbU20s1_Qsym(r){
  var gcd = tbU20s1_gcd, ratio = tbU20s1_ratio, par = tbU20s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var mk = (k == 1 ? '・' : '×');
    var ca = (k == 1 ? 'front' : 'back');
    var good = (k == 1 ? '手前向き' : '奥向き');
    var bad = (k == 1 ? '奥向き' : '手前向き');
    var why = (k == 1 ? '奥向きは×（奥へ飛んでいく矢の羽）' : '手前向きは・（手前に飛んでくる矢の先）');
    var rule = (k == 1 ? '手前に飛んでくる矢の先は、点に見える' : '奥へ飛んでいく矢の羽は、×に見える');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: String(why)}, {t: "上向き", v: "up", why: "・と×は、平面の図に手前向き・奥向きを表す記号"}, {t: "右向き", v: "r", why: "・と×は、平面の図に手前向き・奥向きを表す記号"}]);
    return {form: "u20s1sym", text: "図の導体の記号 " + String(mk) + " が表す電流の向きはどれか。", fig: {kind: "u20s1wc", L: tbU20s1_fig({"c":"{I}","ca":"front","fl":"","fla":null}, [["ca", String(ca)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: [String(rule), String(mk) + " は " + String(good)], chk: {form: "u20s1sym", p: {k: k}}};
  }
  throw new Error("u20s1sym：条件に合う数字が見つからない");
}
// 20-2 直線の導体 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u20_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU20s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU20s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU20s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU20s2_par(a, b){ return a * b / (a + b); }
function tbU20s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU20s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU20s2_Qh(r){
  var gcd = tbU20s2_gcd, ratio = tbU20s2_ratio, par = tbU20s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,40,50,60]);
    var rr = pick(r, [0.1,0.2,0.25,0.5,1,2,3,4,5]);
    var A = (I / (2 * rr));
    var B = (I / rr);
    var C = (I / (2 * rr * rr));
    if (!(nice(A) && nice(B) && nice(C) && distinct([A, B, C]) && A >= 0.5)) continue;
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(A) + "p"}, {t: "$\\dfrac{" + fmt(B) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(B) + "p", why: "2 で割っていない"}, {t: "$\\dfrac{" + fmt(C) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(C) + "p", why: "距離を2乗した"}, {t: "$" + fmt(A) + "\\,\\mathrm{A/m}$", v: fmt(A), why: "$\\pi$ で割っていない"}]);
    return {form: "u20s2h", text: "まっすぐな導体に $" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した。導体から $" + fmt(rr) + "\\,\\mathrm{m}$ 離れた点 P の磁界の強さは何 A/m か。", fig: {kind: "u20s2wc", L: tbU20s2_fig({"c":"{I}","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}","h":"{H}","ha":"up"}, [["c", "{I}=" + fmt(I) + " A"], ["r", "{r}=" + fmt(rr) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{I}{2 \\pi r}$", "$H = \\dfrac{" + fmt(I) + "}{2 \\pi \\times " + fmt(rr) + "} = \\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{A/m}$"], chk: {form: "u20s2h", p: {I: I, rr: rr}}};
  }
  throw new Error("u20s2h：条件に合う数字が見つからない");
}
function tbU20s2_Qperp(r){
  var gcd = tbU20s2_gcd, ratio = tbU20s2_ratio, par = tbU20s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [4,6,8,10,12,16,20,24,30,40,60]);
    var rr = pick(r, [1,2,3,4]);
    var d = pick(r, [2,3,4,5,6,8]);
    var A = (I / (2 * rr));
    var W = (I / (2 * d));
    var B = (I / rr);
    if (!(d > rr && nice(A) && nice(W) && nice(B) && distinct([A, W, B]))) continue;
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(A) + "p"}, {t: "$\\dfrac{" + fmt(W) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(W) + "p", why: "斜めの距離を入れた。$r$ は垂直の距離"}, {t: "$\\dfrac{" + fmt(B) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(B) + "p", why: "2 で割っていない"}, {t: "$" + fmt(A) + "\\,\\mathrm{A/m}$", v: fmt(A), why: "$\\pi$ で割っていない"}]);
    return {form: "u20s2perp", text: "まっすぐな導体に $" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した。点 P は導体から垂直に $" + fmt(rr) + "\\,\\mathrm{m}$ 離れていて、導体の上の方の点から P までの斜めの距離は $" + fmt(d) + "\\,\\mathrm{m}$ である。点 P の磁界の強さは何 A/m か。", fig: {kind: "u20s2ws", L: tbU20s2_fig({"c":"{I}","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}","h":"{H}","ha":"up"}, [["w", ""], ["i", "{I}=" + fmt(I) + " A"], ["ia", "up"], ["fl", ""], ["fla", "ccw"], ["p", "P"], ["r", "{r}=" + fmt(rr) + " m"], ["d", fmt(d) + " m"], ["c", null], ["ca", null], ["h", null], ["ha", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$r$ は導体からの垂直の距離なので $r = " + fmt(rr) + "\\,\\mathrm{m}$", "$H = \\dfrac{" + fmt(I) + "}{2 \\pi \\times " + fmt(rr) + "} = \\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{A/m}$"], chk: {form: "u20s2perp", p: {I: I, rr: rr, d: d}}};
  }
  throw new Error("u20s2perp：条件に合う数字が見つからない");
}
function tbU20s2_Qinv(r){
  var gcd = tbU20s2_gcd, ratio = tbU20s2_ratio, par = tbU20s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var rr = pick(r, [0.1,0.2,0.25,0.5,1,2,3,4,5]);
    if (!(k * rr * 2 >= 1)) continue;
    var ok = (2 * rr * k);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU20s2_three(ok, [{x: (rr * k), why: "2 を掛けていない"}, {x: (k / (2 * rr)), why: "$2 \\pi r$ を掛けるところを割った"}, {x: (2 * rr * rr * k), why: "距離を2乗した"}, {x: (k), why: "一周の長さを掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u20s2inv", text: "まっすぐな導体に電流を流すと、導体から $" + fmt(rr) + "\\,\\mathrm{m}$ 離れた点 P の磁界の強さが $\\dfrac{" + fmt(k) + "}{\\pi}\\,\\mathrm{A/m}$ だった。流した電流は何 A か。", fig: {kind: "u20s2wc", L: tbU20s2_fig({"c":"{I}","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}","h":"{H}","ha":"up"}, [["c", "{I}"], ["r", "{r}=" + fmt(rr) + " m"], ["h", "{H}=" + fmt(k) + "/π A/m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["一周の長さと磁界の強さの積が電流：$I = 2 \\pi r H$", "$I = 2 \\pi \\times " + fmt(rr) + " \\times \\dfrac{" + fmt(k) + "}{\\pi} = " + qv(ok, "A") + "$"], chk: {form: "u20s2inv", p: {k: k, rr: rr}}};
  }
  throw new Error("u20s2inv：条件に合う数字が見つからない");
}
function tbU20s2_Qeq(r){
  var gcd = tbU20s2_gcd, ratio = tbU20s2_ratio, par = tbU20s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{I}{2 \\pi r}$", v: "own"}, {t: "$\\dfrac{I}{2 \\pi r^2}$", v: "r2", why: "距離は2乗しない"}, {t: "$\\dfrac{2 \\pi r}{I}$", v: "inv", why: "分子と分母が逆"}, {t: "$2 \\pi r I$", v: "mul", why: "一周の長さ $2 \\pi r$ で割る"}]);
    return {form: "u20s2eq", text: "まっすぐな導体に電流 $I$［A］を流した。導体から垂直に $r$［m］離れた点の磁界の強さ $H$［A/m］は □ である。", fig: {kind: "u20s2wc", L: tbU20s2_fig({"c":"{I}","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}","h":"{H}","ha":"up"}, [["c", "{I}"], ["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["一周の長さ $2 \\pi r$ と $H$ の積が $I$", "$H = \\dfrac{I}{2 \\pi r}$"], chk: {form: "u20s2eq", p: {}}};
  }
  throw new Error("u20s2eq：条件に合う数字が見つからない");
}
// 20-3 円形コイルの中心 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u20_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU20s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU20s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU20s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU20s3_par(a, b){ return a * b / (a + b); }
function tbU20s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU20s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU20s3_Qh(r){
  var gcd = tbU20s3_gcd, ratio = tbU20s3_ratio, par = tbU20s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [2,3,5,10,20,50,100]);
    var I = pick(r, [0.5,1,2,3,4,5,10]);
    var rr = pick(r, [0.05,0.1,0.2,0.25,0.5,1]);
    var H = (N * I / (2 * rr));
    var B = (N * I / rr);
    var C = (I / (2 * rr));
    if (!(nice(H) && nice(B) && nice(C) && distinct([H, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(H) + "\\,\\mathrm{A/m}$", v: fmt(H)}, {t: "$\\dfrac{" + fmt(H) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(H) + "p", why: "円形コイルの中心の式には $\\pi$ が付かない"}, {t: "$" + fmt(B) + "\\,\\mathrm{A/m}$", v: fmt(B), why: "2 で割っていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{A/m}$", v: fmt(C), why: "巻数を掛けていない"}]);
    return {form: "u20s3h", text: "半径 $" + fmt(rr) + "\\,\\mathrm{m}$、巻数 " + fmt(N) + " の円形コイルに $" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した。コイルの中心の磁界の強さは何 A/m か。", fig: {kind: "u20s3cl", L: tbU20s3_fig({"cl":"{N} 回","i":"{I}","ia":"ccw","o":"O","r":"{r}","h":"{H}","nt":2}, [["cl", fmt(N) + " 回"], ["i", "{I}=" + fmt(I) + " A"], ["r", "{r}=" + fmt(rr) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{2r}$", "$H = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{2 \\times " + fmt(rr) + "} = " + fmt(H) + "\\,\\mathrm{A/m}$"], chk: {form: "u20s3h", p: {N: N, I: I, rr: rr}}};
  }
  throw new Error("u20s3h：条件に合う数字が見つからない");
}
function tbU20s3_Qi(r){
  var gcd = tbU20s3_gcd, ratio = tbU20s3_ratio, par = tbU20s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [2,4,5,10,20,50,100]);
    var h = pick(r, [10,20,25,40,50,100,200,250,400,500,1000]);
    var rr = pick(r, [0.05,0.1,0.2,0.25,0.5]);
    if (!(nice(2 * rr * h / N) && 2 * rr * h / N >= 0.5 && 2 * rr * h / N <= 20)) continue;
    var ok = (2 * rr * h / N);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU20s3_three(ok, [{x: (rr * h / N), why: "2 を掛けていない"}, {x: (2 * rr * h), why: "巻数で割っていない"}, {x: (h * N / (2 * rr)), why: "式を変形せずに、$H$ の式に数を入れた"}, {x: (h / N), why: "半径を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u20s3i", text: "半径 $" + fmt(rr) + "\\,\\mathrm{m}$、巻数 " + fmt(N) + " の円形コイルに電流を流すと、中心の磁界の強さが $" + fmt(h) + "\\,\\mathrm{A/m}$ になった。流した電流は何 A か。", fig: {kind: "u20s3cl", L: tbU20s3_fig({"cl":"{N} 回","i":"{I}","ia":"ccw","o":"O","r":"{r}","h":"{H}","nt":2}, [["cl", fmt(N) + " 回"], ["i", "{I}"], ["r", "{r}=" + fmt(rr) + " m"], ["h", "{H}=" + fmt(h) + " A/m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{2r}$ を変形して $I = \\dfrac{2rH}{N}$", "$I = \\dfrac{2 \\times " + fmt(rr) + " \\times " + fmt(h) + "}{" + fmt(N) + "} = " + qv(ok, "A") + "$"], chk: {form: "u20s3i", p: {N: N, h: h, rr: rr}}};
  }
  throw new Error("u20s3i：条件に合う数字が見つからない");
}
function tbU20s3_Qcmp(r){
  var gcd = tbU20s3_gcd, ratio = tbU20s3_ratio, par = tbU20s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4]);
    var j = pick(r, [1,2]);
    var k2 = (k * k);
    var what = (j == 1 ? '半径' : '巻数');
    var g = (j == 1 ? '$\\dfrac{1}{' + k + '}$ 倍' : '$' + k + '$ 倍');
    var gv = (j == 1 ? '1/' + k : '' + k);
    var b1 = (j == 1 ? '$' + k + '$ 倍' : '$\\dfrac{1}{' + k + '}$ 倍');
    var b1v = (j == 1 ? '' + k : '1/' + k);
    var why1 = (j == 1 ? '半径は分母にあるので、円を大きくすると弱くなる' : '巻数は分子にあるので、巻くほど強くなる');
    var b2 = (j == 1 ? '$\\dfrac{1}{' + k2 + '}$ 倍' : '$' + k2 + '$ 倍');
    var b2v = (j == 1 ? '1/' + k2 : '' + k2);
    var why2 = (j == 1 ? '半径は2乗しない' : '巻数は2乗しない');
    var rule = (j == 1 ? '半径 $r$ は分母にある' : '巻数 $N$ は分子にある');
    var _c = choices(r, [{t: String(g), v: String(gv)}, {t: String(b1), v: String(b1v), why: String(why1)}, {t: String(b2), v: String(b2v), why: String(why2)}, {t: "$1$ 倍（変わらない）", v: "1", why: String(what) + "で中心の磁界の強さは変わる"}]);
    return {form: "u20s3cmp", text: "円形コイルの電流を変えずに、" + String(what) + "を " + fmt(k) + " 倍にした。中心の磁界の強さは元の何倍になるか。", fig: {kind: "u20s3cl", L: tbU20s3_fig({"cl":"{N} 回","i":"{I}","ia":"ccw","o":"O","r":"{r}","h":"{H}","nt":2}, [["cl", "{N} 回"], ["i", "{I}"], ["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{2r}$ で、" + String(rule), "磁界の強さは " + String(g)], chk: {form: "u20s3cmp", p: {k: k, j: j}}};
  }
  throw new Error("u20s3cmp：条件に合う数字が見つからない");
}
function tbU20s3_Qeq(r){
  var gcd = tbU20s3_gcd, ratio = tbU20s3_ratio, par = tbU20s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{NI}{2r}$", v: "own"}, {t: "$\\dfrac{NI}{2 \\pi r}$", v: "pi", why: "円形コイルの中心の式には $\\pi$ が付かない"}, {t: "$\\dfrac{I}{2Nr}$", v: "nd", why: "巻くほど強くなるので、巻数は分子"}, {t: "$\\dfrac{2r}{NI}$", v: "inv", why: "分子と分母が逆"}]);
    return {form: "u20s3eq", text: "巻数 $N$、半径 $r$［m］の円形コイルに電流 $I$［A］を流した。中心の磁界の強さ $H$［A/m］は □ である。", fig: {kind: "u20s3cl", L: tbU20s3_fig({"cl":"{N} 回","i":"{I}","ia":"ccw","o":"O","r":"{r}","h":"{H}","nt":2}, [["cl", "{N} 回"], ["i", "{I}"], ["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\pi$ が付かず、巻数 $N$ は分子", "$H = \\dfrac{NI}{2r}$"], chk: {form: "u20s3eq", p: {}}};
  }
  throw new Error("u20s3eq：条件に合う数字が見つからない");
}
// 20-4 環状ソレノイド の練習（※ textbook/gen/make_section.py が textbook/gen/data/u20_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU20s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU20s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU20s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU20s4_par(a, b){ return a * b / (a + b); }
function tbU20s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU20s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU20s4_Qh(r){
  var gcd = tbU20s4_gcd, ratio = tbU20s4_ratio, par = tbU20s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [10,20,50,100,200,300,400,500,1000]);
    var I = pick(r, [0.1,0.2,0.5,1,2,3,4,5]);
    var rr = pick(r, [0.05,0.1,0.2,0.25,0.5]);
    var A = (N * I / (2 * rr));
    var B = (N * I / rr);
    var C = (I / (2 * rr));
    if (!(nice(A) && nice(B) && nice(C) && distinct([A, B, C]))) continue;
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(A) + "p"}, {t: "$" + fmt(A) + "\\,\\mathrm{A/m}$", v: fmt(A), why: "環状ソレノイドの式には $\\pi$ が付く"}, {t: "$\\dfrac{" + fmt(B) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(B) + "p", why: "2 で割っていない"}, {t: "$\\dfrac{" + fmt(C) + "}{\\pi}\\,\\mathrm{A/m}$", v: fmt(C) + "p", why: "巻数を掛けていない"}]);
    return {form: "u20s4h", text: "半径 $" + fmt(rr) + "\\,\\mathrm{m}$ の輪の形の鉄心に、導体を " + fmt(N) + " 回巻いた環状ソレノイドがある。$" + fmt(I) + "\\,\\mathrm{A}$ の電流を流した時、鉄心の中の磁界の強さは何 A/m か。", fig: {kind: "u20s4tr", L: tbU20s4_fig({"core":"","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"}, [["n", fmt(N) + " 回"], ["i", "{I}=" + fmt(I) + " A"], ["r", "{r}=" + fmt(rr) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{2 \\pi r}$", "$H = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{2 \\pi \\times " + fmt(rr) + "} = \\dfrac{" + fmt(A) + "}{\\pi}\\,\\mathrm{A/m}$"], chk: {form: "u20s4h", p: {N: N, I: I, rr: rr}}};
  }
  throw new Error("u20s4h：条件に合う数字が見つからない");
}
function tbU20s4_Qi(r){
  var gcd = tbU20s4_gcd, ratio = tbU20s4_ratio, par = tbU20s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [10,20,50,100,200,500]);
    var k = pick(r, [50,100,200,250,400,500,1000,2000]);
    var rr = pick(r, [0.05,0.1,0.2,0.25,0.5]);
    if (!(nice(2 * rr * k / N) && 2 * rr * k / N >= 0.1 && 2 * rr * k / N <= 20)) continue;
    var ok = (2 * rr * k / N);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU20s4_three(ok, [{x: (rr * k / N), why: "2 を掛けていない"}, {x: (2 * rr * k), why: "巻数で割っていない"}, {x: (k * N / (2 * rr)), why: "式を変形せずに、$H$ の式に数を入れた"}, {x: (k / N), why: "半径を掛けていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u20s4i", text: "半径 $" + fmt(rr) + "\\,\\mathrm{m}$ の輪の形の鉄心に、導体を " + fmt(N) + " 回巻いた環状ソレノイドがある。電流を流すと、鉄心の中の磁界の強さが $\\dfrac{" + fmt(k) + "}{\\pi}\\,\\mathrm{A/m}$ になった。流した電流は何 A か。", fig: {kind: "u20s4tr", L: tbU20s4_fig({"core":"","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"}, [["n", fmt(N) + " 回"], ["i", "{I}"], ["r", "{r}=" + fmt(rr) + " m"], ["h", "{H}=" + fmt(k) + "/π A/m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{NI}{2 \\pi r}$ を変形して $I = \\dfrac{2 \\pi r H}{N}$", "$I = \\dfrac{2 \\pi \\times " + fmt(rr) + "}{" + fmt(N) + "} \\times \\dfrac{" + fmt(k) + "}{\\pi} = " + qv(ok, "A") + "$"], chk: {form: "u20s4i", p: {N: N, k: k, rr: rr}}};
  }
  throw new Error("u20s4i：条件に合う数字が見つからない");
}
function tbU20s4_Qwwc(r){
  var gcd = tbU20s4_gcd, ratio = tbU20s4_ratio, par = tbU20s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{I}{2 \\pi r}$", v: "own"}, {t: "$\\dfrac{NI}{2r}$", v: "cl", why: "それは円形コイルの中心の式"}, {t: "$\\dfrac{NI}{2 \\pi r}$", v: "tr", why: "それは環状ソレノイドの式"}, {t: "$\\dfrac{NI}{2 \\pi r^2}$", v: "r2", why: "どの式も、$r$ は2乗しない"}]);
    return {form: "u20s4wwc", text: "まっすぐな導体から $r$ 離れた点の磁界の強さ $H$ を表す式はどれか。ただし、電流を $I$、巻数を $N$ とする。", fig: {kind: "u20s4wc", L: tbU20s4_fig({"core":"","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"}, [["c", "{I}"], ["ca", "front"], ["fl", ""], ["fla", null], ["p", "P"], ["r", "{r}"], ["h", "{H}"], ["ha", "up"], ["core", null], ["n", null], ["i", null], ["ia", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直線の導体 $\\dfrac{I}{2 \\pi r}$・円形コイルの中心 $\\dfrac{NI}{2r}$・環状ソレノイド $\\dfrac{NI}{2 \\pi r}$", "まっすぐな導体から $r$ 離れた点は $\\dfrac{I}{2 \\pi r}$"], chk: {form: "u20s4wwc", p: {}}};
  }
  throw new Error("u20s4wwc：条件に合う数字が見つからない");
}
function tbU20s4_Qwcl(r){
  var gcd = tbU20s4_gcd, ratio = tbU20s4_ratio, par = tbU20s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{NI}{2r}$", v: "own"}, {t: "$\\dfrac{I}{2 \\pi r}$", v: "wc", why: "それは直線の導体の式"}, {t: "$\\dfrac{NI}{2 \\pi r}$", v: "tr", why: "それは環状ソレノイドの式"}, {t: "$\\dfrac{NI}{2 \\pi r^2}$", v: "r2", why: "どの式も、$r$ は2乗しない"}]);
    return {form: "u20s4wcl", text: "半径 $r$ の円形コイルの中心の磁界の強さ $H$ を表す式はどれか。ただし、電流を $I$、巻数を $N$ とする。", fig: {kind: "u20s4cl", L: tbU20s4_fig({"core":"","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"}, [["cl", "{N} 回"], ["i", "{I}"], ["ia", "ccw"], ["o", "O"], ["r", "{r}"], ["h", "{H}"], ["nt", 2], ["core", null], ["n", null], ["ha", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直線の導体 $\\dfrac{I}{2 \\pi r}$・円形コイルの中心 $\\dfrac{NI}{2r}$・環状ソレノイド $\\dfrac{NI}{2 \\pi r}$", "半径 $r$ の円形コイルの中心は $\\dfrac{NI}{2r}$"], chk: {form: "u20s4wcl", p: {}}};
  }
  throw new Error("u20s4wcl：条件に合う数字が見つからない");
}
function tbU20s4_Qwtr(r){
  var gcd = tbU20s4_gcd, ratio = tbU20s4_ratio, par = tbU20s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{NI}{2 \\pi r}$", v: "own"}, {t: "$\\dfrac{I}{2 \\pi r}$", v: "wc", why: "それは直線の導体の式"}, {t: "$\\dfrac{NI}{2r}$", v: "cl", why: "それは円形コイルの中心の式"}, {t: "$\\dfrac{NI}{2 \\pi r^2}$", v: "r2", why: "どの式も、$r$ は2乗しない"}]);
    return {form: "u20s4wtr", text: "半径 $r$ の環状ソレノイドの鉄心の中の磁界の強さ $H$ を表す式はどれか。ただし、電流を $I$、巻数を $N$ とする。", fig: {kind: "u20s4tr", L: tbU20s4_fig({"core":"","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直線の導体 $\\dfrac{I}{2 \\pi r}$・円形コイルの中心 $\\dfrac{NI}{2r}$・環状ソレノイド $\\dfrac{NI}{2 \\pi r}$", "半径 $r$ の環状ソレノイドの鉄心の中は $\\dfrac{NI}{2 \\pi r}$"], chk: {form: "u20s4wtr", p: {}}};
  }
  throw new Error("u20s4wtr：条件に合う数字が見つからない");
}
function tbU20s4_Qeq(r){
  var gcd = tbU20s4_gcd, ratio = tbU20s4_ratio, par = tbU20s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{NI}{2 \\pi r}$", v: "own"}, {t: "$\\dfrac{NI}{2r}$", v: "nopi", why: "それは円形コイルの中心の式。環状ソレノイドは $\\pi$ が付く"}, {t: "$\\dfrac{I}{2 \\pi r}$", v: "non", why: "それは直線の導体の式。巻数 $N$ が付く"}, {t: "$\\dfrac{2 \\pi r}{NI}$", v: "inv", why: "分子と分母が逆"}]);
    return {form: "u20s4eq", text: "巻数 $N$、半径 $r$［m］の環状ソレノイドに電流 $I$［A］を流した。鉄心の中の磁界の強さ $H$［A/m］は □ である。", fig: {kind: "u20s4tr", L: tbU20s4_fig({"core":"","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"}, [["n", "{N} 回"], ["i", "{I}"], ["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\pi$ も巻数 $N$ も付く", "$H = \\dfrac{NI}{2 \\pi r}$"], chk: {form: "u20s4eq", p: {}}};
  }
  throw new Error("u20s4eq：条件に合う数字が見つからない");
}
var GEN = {
  // 20-1 右ねじの法則
  1: function(r){ return pick(r, [tbU20s1_Qdir, tbU20s1_Qdir, tbU20s1_Qdir, tbU20s1_Qrev, tbU20s1_Qrev, tbU20s1_Qside, tbU20s1_Qside, tbU20s1_Qsym, tbU20s1_Qsym])(r); },
  // 20-2 直線の導体
  2: function(r){ return pick(r, [tbU20s2_Qh, tbU20s2_Qh, tbU20s2_Qh, tbU20s2_Qh, tbU20s2_Qperp, tbU20s2_Qperp, tbU20s2_Qinv, tbU20s2_Qinv, tbU20s2_Qeq])(r); },
  // 20-3 円形コイルの中心
  3: function(r){ return pick(r, [tbU20s3_Qh, tbU20s3_Qh, tbU20s3_Qh, tbU20s3_Qh, tbU20s3_Qi, tbU20s3_Qi, tbU20s3_Qcmp, tbU20s3_Qcmp, tbU20s3_Qeq])(r); },
  // 20-4 環状ソレノイド
  4: function(r){ return pick(r, [tbU20s4_Qh, tbU20s4_Qh, tbU20s4_Qh, tbU20s4_Qh, tbU20s4_Qi, tbU20s4_Qi, tbU20s4_Qwwc, tbU20s4_Qwcl, tbU20s4_Qwtr, tbU20s4_Qeq])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t20s1e","scene":"t20s1e","kind":"u20s1sw","lab":{"w":"","i":"{I}","ia":"up","fl":"{H}","fla":"ccw","c":"{I}","ca":"front"},"viewbox":"172 127 593 605","band":{"want":"電流がつくる磁界の向き","ans":"右手の親指を電流の向きに向けると、4本の指の巻く向きが磁界の向き","full":"導体に電流を流すと、まわりに磁界ができる。右手の親指を電流の向きに向けると、4本の指の巻く向きが磁界の向き（右ねじの法則）。手前向きは・、奥向きは×。手前向きの電流のまわりの磁界は反時計回り、奥向きなら時計回り。"},"narr":{"start":{"co":1,"t":0,"fld":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①電流がつくる磁界\n②右ねじの法則\n③手前向き・奥向き\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"導体に電流 $I$ を流します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W","I"]},{"text":"すると、導体のまわりに磁界ができます。導体を囲むように回る向きです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"fl","emph":["Fl"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"向きは、右手で考えます。〖右手の親指を、電流の向き〗に向けます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["I"]},{"text":"〖残りの4本の指の巻く向きが、磁界の向き〗です。これを右ねじの法則といいます。","at":{"強調":1.0},"after":[],"emph":["Fl","I"]},{"text":"上向きの電流なら、上から見て反時計回りです。","at":{"強調":1.0},"after":[],"emph":["Fl","I"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"立体の向きを平面の図で表すため、〖手前向きを・、奥向きを×〗で表します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"sw","emph":["C"]},{"text":"手前に飛んでくる矢の先は、点に見えます。奥へ飛んでいく矢の羽は、×に見えます。","at":{"強調":1.0},"after":[],"emph":["C"]},{"text":"手前向きの電流なら、親指を手前に向けます。磁界は反時計回りです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"fl2","emph":["C","Fl"]},{"text":"奥向きの電流なら、磁界は時計回りです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["C","Fl"],"ans":true}]}],"groups":{"W":["wl","wt0","wt1"],"I":["ia","ia:h","it0","it1"],"Fl":["flb","flf","flh0","flh0:h","flh1","flh1:h","flt0","flt1","flx1","flh0x1","flh0x1:h","flh1x1","flh1x1:h","flh2x1","flh2x1:h","flh3x1","flh3x1:h","fltx10","fltx11"],"Pp":["ppd","pt0","pt1","ppdx1","ptx10","ptx11"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1","rdx1","rdx1:h","rdx1:h2","rtx10","rtx11"],"D":["dl","dt0","dt1"],"Lp":["lpx1","lphx1","lphx1:h","lptx10","lptx11"],"C":["ccx1","ccx1:t","ctx10","ctx11"],"H":["hax1","hax1:h","htx10","htx11"]},"moves":{"fl":{"to":{"fld":1},"dur":1.0},"sw":{"to":{"t":1,"fld":0},"dur":0.6},"fl2":{"to":{"fld":1},"dur":1.0}},"route":["電流がつくる磁界","右ねじの法則","手前向き・奥向き"]}},{"id":"t20s1x","scene":"t20s1x","kind":"u20s1wc","lab":{"c":"{I}","ca":"back","fl":"{H}","fla":"cw"},"viewbox":"273 209 414 417","band":{"want":"奥向きの電流のまわりの磁界の向き","ans":"時計回り"},"narr":{"start":{"co":1,"fld":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、導体のまわりの磁界の向きです。","at":{"強調":1.0},"after":[],"emph":["Fl"]},{"text":"①電流の向き\n②右ねじの法則\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"導体の記号は×です。電流は奥向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"右手の親指を奥に向けると、〖4本の指は時計回り〗に巻きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"fl","emph":["C","Fl"]},{"text":"答えは、時計回りです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["Fl"],"ans":true}]}],"groups":{"Fl":["fl","flh0","flh0:h","flh1","flh1:h","flh2","flh2:h","flh3","flh3:h","flt0","flt1"],"Lp":["lp","lph","lph:h","lpt0","lpt1"],"C":["cc","cc:t","ct0","ct1"],"Pp":["ppd","pt0","pt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"H":["ha","ha:h","ht0","ht1"]},"moves":{"fl":{"to":{"fld":1},"dur":1.0}},"route":["電流の向き","右ねじの法則"]}},{"id":"t20s2e","scene":"t20s2e","kind":"u20s2sw","lab":{"c":"{I}","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}","h":"{H}","ha":"up","lp":"一周 2π{r}","w":"","i":"{I}","ia":"up","d":"斜めの距離"},"viewbox":"165 126 770 606","band":{"want":"直線の導体から $r$ 離れた点の磁界の強さ","ans":"$H = \\dfrac{I}{2 \\pi r}$（$r$ は垂直の距離）","full":"磁界の強さが同じ所を一周すると、一周の長さと磁界の強さの積が流した電流になる。導体から r 離れた所の一周は 2πr なので、2πr H = I、H = I/(2πr)。r は導体からの垂直の距離。"},"narr":{"start":{"co":1,"t":0,"fld":1,"hd":0,"lpd":0,"dd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①同じ強さの所を一周\n②式\n③垂直の距離\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"導体に電流 $I$ を流すと、まわりに磁界ができます。導体から離れるほど弱くなります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C","Fl"]},{"text":"導体から $r$ 離れた点 P の磁界の強さ $H$ を求めます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"h","emph":["Pp","R","H"]},{"text":"導体から $r$ 離れた所は、どこも同じ強さです。その所だけをたどって一周します。一周の長さは $2 \\pi r$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"lp","emph":["Lp","R"]},{"text":"〖一周の長さと磁界の強さの積が、流した電流〗になります。これをアンペールの周回積分の法則といいます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Lp","H","C"],"eq":[{"cont":false,"items":[["2 \\pi r \\times H = I"]]}],"emphPre":["Lp","H","C"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"これを $H$ について解きます。法則よりも、〖この式を覚えれば十分〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["H","C","R"],"eq":[{"cont":false,"items":[["2 \\pi r \\times H = I"],["H = \\dfrac{I}{2 \\pi r}"]]}],"emphPre":["H","C","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$r$ は、〖導体からの垂直の距離〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"sw","emph":["R","Pp"]},{"text":"斜めの距離を入れないように気をつけます。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"d","emph":["R","I"],"eq":[{"cont":false,"items":[["H = \\dfrac{I}{2 \\pi r}"]]}],"ans":true,"emphPre":["D","I"]}]}],"groups":{"Fl":["fl","flh0","flh0:h","flh1","flh1:h","flh2","flh2:h","flh3","flh3:h","flt0","flt1","flbx1","flfx1","flh0x1","flh0x1:h","flh1x1","flh1x1:h","fltx10","fltx11"],"Lp":["lp","lph","lph:h","lpt0","lpt1"],"C":["cc","cc:t","ct0","ct1"],"Pp":["ppd","pt0","pt1","ppdx1","ptx10","ptx11"],"R":["rd","rd:h","rd:h2","rt0","rt1","re1x1","re2x1","rdx1","rdx1:h","rdx1:h2","rtx10","rtx11"],"H":["ha","ha:h","ht0","ht1"],"W":["wlx1","wtx10","wtx11"],"I":["iax1","iax1:h","itx10","itx11"],"D":["dlx1","dtx10","dtx11"]},"moves":{"lp":{"to":{"lpd":1},"dur":1.2},"h":{"to":{"hd":1},"dur":0.6},"sw":{"to":{"t":1},"dur":0.6},"d":{"to":{"dd":1},"dur":0.6}},"route":["同じ強さの所を一周","式","垂直の距離"]}},{"id":"t20s2x","scene":"t20s2x","kind":"u20s2wc","lab":{"c":"{I}=18 A","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}=3 m","h":["{H}","{H}=3/π A/m"],"ha":"up"},"viewbox":"167 203 765 454","band":{"want":"点 P の磁界の強さ $H$","known":"$I = 18\\,\\mathrm{A},\\;\\; r = 3\\,\\mathrm{m}$","ans":"$H = \\dfrac{3}{\\pi}\\,\\mathrm{A/m}$"},"narr":{"start":{"co":1,"fld":1,"hd":1,"hv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、導体から $3\\,\\mathrm{m}$ 離れた点 P の磁界の強さ $H$ です。","at":{"強調":1.0},"after":[],"emph":["H","Pp"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"直線の導体のまわりの磁界の強さの式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["H","C","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{I}{2 \\pi r}"]]}],"emphPre":["H","C","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$I = 18$、$r = 3$ を入れます。〖$\\pi$ は残します〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["H","C","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{18}{2 \\pi \\times 3}"],["= \\dfrac{3}{\\pi}\\,\\mathrm{A/m}"]]}],"move":"hv","ans":true,"emphPre":["C","R","H"]}]}],"groups":{"Fl":["fl","flh0","flh0:h","flh1","flh1:h","flh2","flh2:h","flh3","flh3:h","flt0","flt1"],"Lp":["lp","lph","lph:h","lpt0","lpt1"],"C":["cc","cc:t","ct0","ct1"],"Pp":["ppd","pt0","pt1"],"R":["rd","rd:h","rd:h2","rt0","rt1"],"H":["ha","ha:h","ht0","ht1"]},"moves":{"hv":{"to":{"hv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t20s3e","scene":"t20s3e","kind":"u20s3cl","lab":{"cl":"{N} 回","i":"{I}","ia":"ccw","o":"O","r":"{r}","h":["{H}","{H}"],"nt":2},"viewbox":"177 -4 678 778","band":{"want":"円形コイルの中心の磁界の強さ","ans":"$H = \\dfrac{NI}{2r}$（$\\pi$ が付かない）","full":"円形コイルの中心の磁界の強さは H = NI/(2r)。N は巻数、r は半径。π は付かない。1回巻きなら I/(2r)。巻くほど・電流が大きいほど強く、円を大きくすると弱い。"},"narr":{"start":{"co":1,"id":0,"hd":0,"rs":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①円形コイル\n②式\n③強くなる・弱くなる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"導体を円の形に巻いた物を、円形コイルといいます。何回巻いたかを巻数 $N$ といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Cl","I","H"]},{"text":"コイルに電流 $I$ を流し、コイルの中心 O の磁界の強さ $H$ を求めます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i","emph":["I","O","Cl","H"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"中心の磁界の強さは、次の式です。この式は覚えます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"h","emph":["H","Cl","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2r}"]]}],"emphPre":["H","Cl","I","R"]},{"text":"直線の導体の $\\dfrac{I}{2 \\pi r}$ と比べると、〖$\\pi$ が付きません〗。分子に巻数 $N$ が付きます。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["H","I","Cl"],"eq":[{"cont":false,"items":[["\\dfrac{I}{2 \\pi r} \\to \\dfrac{NI}{2r}"]]}]},{"text":"1回巻きなら $N = 1$ で、$H = \\dfrac{I}{2r}$ です。","at":{"強調":1.0},"after":[],"emph":["Cl","I","H"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"巻くほど、電流が大きいほど、〖中心の磁界は強く〗なります。$N$ と $I$ は分子です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Cl","I"]},{"text":"円を大きくすると、〖磁界は弱く〗なります。半径 $r$ は分母です。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"rs","emph":["H","Cl","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2r}"]]}],"ans":true,"emphPre":["R"]}]}],"groups":{"Cl":["cl","clx0","clx1","clt0","clt1","clb","clbx0","clbx1","cltb0","cltb1"],"I":["ia","ia:h","it0","it1","iab","iab:h","itb0","itb1"],"R":["rd","rd:h","rd:h2","rt0","rt1","rdb","rdb:h","rdb:h2","rtb0","rtb1"],"O":["od","ot0","ot1"],"H":["ht0","ht1"]},"moves":{"i":{"to":{"id":1},"dur":1.0},"h":{"to":{"hd":1},"dur":0.6},"rs":{"to":{"rs":1},"dur":0.8}},"route":["円形コイル","式","強くなる・弱くなる"]}},{"id":"t20s3x","scene":"t20s3x","kind":"u20s3cl","lab":{"cl":"10 回","i":"{I}=3 A","ia":"ccw","o":"O","r":"{r}=0.5 m","h":"{H}","nt":2},"viewbox":"177 -4 678 778","band":{"want":"中心の磁界の強さ $H$","known":"$N = 10,\\;\\; I = 3\\,\\mathrm{A},\\;\\; r = 0.5\\,\\mathrm{m}$","ans":"$H = 30\\,\\mathrm{A/m}$"},"narr":{"start":{"co":1,"id":1,"hd":1,"hv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、円形コイルの中心の磁界の強さ $H$ です。","at":{"強調":1.0},"after":[],"emph":["H","O"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"円形コイルの中心の式を使います。〖$\\pi$ は付きません〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["H","Cl","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2r}"]]}],"emphPre":["H","Cl","I","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$N = 10$、$I = 3$、$r = 0.5$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["H","Cl","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{10 \\times 3}{2 \\times 0.5}"],["= 30\\,\\mathrm{A/m}"]]}],"move":"hv","ans":true,"emphPre":["Cl","I","R","H"]}]}],"groups":{"Cl":["cl","clx0","clx1","clt0","clt1","clb","clbx0","clbx1","cltb0","cltb1"],"I":["ia","ia:h","it0","it1","iab","iab:h","itb0","itb1"],"R":["rd","rd:h","rd:h2","rt0","rt1","rdb","rdb:h","rdb:h2","rtb0","rtb1"],"O":["od","ot0","ot1"],"H":["ht0","ht1"]},"moves":{"hv":{"to":{"hv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t20s4e","scene":"t20s4e","kind":"u20s4tr","lab":{"core":"鉄心","n":"{N} 回","i":"{I}","ia":"in","r":"{r}","h":"{H}","ha":"cw"},"viewbox":"187 110 897 579","band":{"want":"環状ソレノイドの中の磁界の強さ","ans":"$H = \\dfrac{NI}{2 \\pi r}$（$\\pi$ が付く）","full":"ドーナツの形の鉄心に導体を巻いた物が環状ソレノイド。鉄心の中の磁界の強さは H = NI/(2πr)。π が付く。直線の導体 I/(2πr)・円形コイルの中心 NI/(2r)・環状ソレノイド NI/(2πr)。"},"narr":{"start":{"co":1,"id":0,"hd":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"①環状ソレノイド\n②式\n③3つの式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"ドーナツの形の鉄心に、導体をぐるぐる巻き付けます。これを環状ソレノイドといいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Core","N"]},{"text":"巻数 $N$ のコイルに、電流 $I$ を流します。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i","emph":["N","I"]},{"text":"鉄心の中に、〖輪に沿って回る磁界〗ができます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"h","emph":["H","Core"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"鉄心の中の磁界の強さは、次の式です。$r$ は輪の半径です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["H","N","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2 \\pi r}"]]}],"emphPre":["H","N","I","R"]},{"text":"こちらは〖$\\pi$ が付きます〗。巻くほど、電流が大きいほど強くなります。","at":{"強調":1.0},"after":[],"emph":["N","I"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁界の強さの式は3つです。どれに $\\pi$ が付き、どれに $N$ が付くかを覚えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["N"]},{"text":"直線の導体は $\\pi$ が付き、$N$ は付きません。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","H","I"],"eq":[{"cont":false,"items":[["H = \\dfrac{I}{2 \\pi r}"]]}],"emphPre":["N","H","I"]},{"text":"円形コイルの中心は、$\\pi$ が付きません。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2r}"]]}],"emph":["N","H","I"]},{"text":"環状ソレノイドは、〖$\\pi$ も $N$ も付きます〗。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["H","N","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2 \\pi r}"]]}],"ans":true,"emphPre":["H","N","I","R"]}]}],"groups":{"Core":["core","coret0","coret1"],"N":["wd0","wd1","wd2","wd3","wd4","wd5","wd6","wd7","wd8","wd9","wd10","wd11","ld0","ld1","nt0","nt1"],"I":["ia","ia:h","it0","it1"],"R":["rd","rd:h","rd:h2","rc0","rt0","rt1"],"H":["hlccw","hhccw","hhccw:h","hlcw","hhcw","hhcw:h","ht0","ht1"]},"moves":{"i":{"to":{"id":1},"dur":0.8},"h":{"to":{"hd":1},"dur":1.0}},"route":["環状ソレノイド","式","3つの式"]}},{"id":"t20s4x","scene":"t20s4x","kind":"u20s4tr","lab":{"core":"","n":"200 回","i":"{I}=0.5 A","ia":"in","r":"{r}=0.1 m","h":["{H}","{H}=500/π A/m"],"ha":"cw"},"viewbox":"187 110 897 579","band":{"want":"鉄心の中の磁界の強さ $H$","known":"$N = 200,\\;\\; I = 0.5\\,\\mathrm{A},\\;\\; r = 0.1\\,\\mathrm{m}$","ans":"$H = \\dfrac{500}{\\pi}\\,\\mathrm{A/m}$"},"narr":{"start":{"co":1,"id":1,"hd":1,"hv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、環状ソレノイドの鉄心の中の磁界の強さ $H$ です。","at":{"強調":1.0},"after":[],"emph":["H"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"環状ソレノイドの式を使います。〖$\\pi$ が付きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["H","N","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{2 \\pi r}"]]}],"emphPre":["H","N","I","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$N = 200$、$I = 0.5$、$r = 0.1$ を入れます。$\\pi$ は残します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["H","N","I","R"],"eq":[{"cont":false,"items":[["H = \\dfrac{200 \\times 0.5}{2 \\pi \\times 0.1}"],["= \\dfrac{500}{\\pi}\\,\\mathrm{A/m}"]]}],"move":"hv","ans":true,"emphPre":["N","I","R","H"]}]}],"groups":{"Core":["core","coret0","coret1"],"N":["wd0","wd1","wd2","wd3","wd4","wd5","wd6","wd7","wd8","wd9","wd10","wd11","ld0","ld1","nt0","nt1"],"I":["ia","ia:h","it0","it1"],"R":["rd","rd:h","rd:h2","rc0","rt0","rt1"],"H":["hlccw","hhccw","hhccw:h","hlcw","hhcw","hhcw:h","ht0","ht1"]},"moves":{"hv":{"to":{"hv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}}],"secs":[{"ex":{"text":"図のように、導体に奥向き（×）の電流を流した。導体のまわりにできる磁界の向きはどれか。","fig":{"kind":"u20s1wc","L":{"c":"{I}","ca":"back","fl":"","fla":null},"P":{}},"ch":[{"t":"時計回り","v":"cw","why":""},{"t":"反時計回り","v":"ccw","why":"反時計回りになるのは、手前向きの電流"},{"t":"導体から外へ向かう向き","v":"out","why":"磁界は導体を囲むように回る"},{"t":"磁界はできない","v":"none","why":"電流を流した導体のまわりには磁界ができる"}],"ans":0}},{"ex":{"text":"まっすぐな導体に $18\\,\\mathrm{A}$ の電流を流した。導体から $3\\,\\mathrm{m}$ 離れた点 P の磁界の強さは何 A/m か。","fig":{"kind":"u20s2wc","L":{"c":"{I}=18 A","ca":"front","fl":"","fla":"ccw","p":"P","r":"{r}=3 m","h":"{H}","ha":"up"},"P":{}},"ch":[{"t":"$\\dfrac{6}{\\pi}\\,\\mathrm{A/m}$","v":"6p","why":"2 で割っていない"},{"t":"$\\dfrac{3}{\\pi}\\,\\mathrm{A/m}$","v":"3p","why":""},{"t":"$\\dfrac{1}{\\pi}\\,\\mathrm{A/m}$","v":"1p","why":"距離を2乗した"},{"t":"$3\\,\\mathrm{A/m}$","v":"3","why":"$\\pi$ で割っていない"}],"ans":1}},{"ex":{"text":"半径 $0.5\\,\\mathrm{m}$、巻数 10 の円形コイルに $3\\,\\mathrm{A}$ の電流を流した。コイルの中心の磁界の強さは何 A/m か。","fig":{"kind":"u20s3cl","L":{"cl":"10 回","i":"{I}=3 A","ia":"ccw","o":"O","r":"{r}=0.5 m","h":"{H}","nt":2},"P":{}},"ch":[{"t":"$\\dfrac{30}{\\pi}\\,\\mathrm{A/m}$","v":"30p","why":"円形コイルの中心の式には $\\pi$ が付かない"},{"t":"$60\\,\\mathrm{A/m}$","v":"60","why":"2 で割っていない"},{"t":"$3\\,\\mathrm{A/m}$","v":"3","why":"巻数を掛けていない"},{"t":"$30\\,\\mathrm{A/m}$","v":"30","why":""}],"ans":3}},{"ex":{"text":"半径 $0.1\\,\\mathrm{m}$ の輪の形の鉄心に、導体を 200 回巻いた環状ソレノイドがある。$0.5\\,\\mathrm{A}$ の電流を流した時、鉄心の中の磁界の強さは何 A/m か。","fig":{"kind":"u20s4tr","L":{"core":"","n":"200 回","i":"{I}=0.5 A","ia":"in","r":"{r}=0.1 m","h":"{H}","ha":"cw"},"P":{}},"ch":[{"t":"$\\dfrac{500}{\\pi}\\,\\mathrm{A/m}$","v":"500p","why":""},{"t":"$500\\,\\mathrm{A/m}$","v":"500","why":"環状ソレノイドの式には $\\pi$ が付く"},{"t":"$\\dfrac{1000}{\\pi}\\,\\mathrm{A/m}$","v":"1000p","why":"2 で割っていない"},{"t":"$\\dfrac{2.5}{\\pi}\\,\\mathrm{A/m}$","v":"2.5p","why":"巻数を掛けていない"}],"ans":0}}],"past":[]}};
});
