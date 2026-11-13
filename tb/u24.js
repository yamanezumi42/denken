/* 単元24「自己インダクタンス」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(24, function(H){
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
// ---- 24-1 自己誘導 の図（※ textbook/gen/make_section.py が textbook/gen/data/u24_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U24S1K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":290,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU24s1tr(d, p, L){ tbFig_Draw(d, p, L, U24S1K.tr); }
// ---- 24-2 自己インダクタンスと磁束 の図（※ textbook/gen/make_section.py が textbook/gen/data/u24_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U24S2K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU24s2tr(d, p, L){ tbFig_Draw(d, p, L, U24S2K.tr); }
// ---- 24-3 自己インダクタンスの式 の図（※ textbook/gen/make_section.py が textbook/gen/data/u24_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U24S3K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":290,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU24s3tr(d, p, L){ tbFig_Draw(d, p, L, U24S3K.tr); }
// ---- 24-4 巻数の2乗に比例 の図（※ textbook/gen/make_section.py が textbook/gen/data/u24_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U24S4K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU24s4tr(d, p, L){ tbFig_Draw(d, p, L, U24S4K.tr); }
var KINDS = {u24s1tr: tbU24s1tr, u24s2tr: tbU24s2tr, u24s3tr: tbU24s3tr, u24s4tr: tbU24s4tr};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 24-1 の図は電流が流れないので載せない,
  // 24-2 の図は電流が流れないので載せない,
  // 24-3 の図は電流が流れないので載せない,
  // 24-4 の図は電流が流れないので載せない
};

// 24-1 自己誘導 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u24_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU24s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU24s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU24s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU24s1_par(a, b){ return a * b / (a + b); }
function tbU24s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU24s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU24s1_Qe(r){
  var gcd = tbU24s1_gcd, ratio = tbU24s1_ratio, par = tbU24s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ind = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2,5]);
    var di = pick(r, [0.5,1,2,3,4,5,10]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5,1]);
    var A = (ind * di * t);
    var B = (ind * di);
    var C = (di / t);
    var D = (ind * t / di);
    if (!(di != t && nice(ind * di / t) && ind * di / t >= 1 && ind * di / t <= 1000 && nice(A) && nice(B) && nice(C) && nice(D))) continue;
    var ok = (ind * di / t);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU24s1_three(ok, [{x: (A), why: "時間で割るところを掛けた"}, {x: (B), why: "時間で割っていない"}, {x: (C), why: "自己インダクタンスを掛けていない"}, {x: (D), why: "割る順が逆（時間を電流の変化で割った）"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u24s1e", text: "自己インダクタンス $" + fmt(ind) + "\\,\\mathrm{H}$ のコイルの電流が、$" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(di) + "\\,\\mathrm{A}$ 変わった。自己誘導起電力の大きさは何 V か。", fig: {kind: "u24s1tr", L: tbU24s1_fig({"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, [["i", "Δ{I}=" + fmt(di) + " A"], ["ind", "{L}=" + fmt(ind) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["大きさなので、$e = L \\dfrac{\\Delta I}{\\Delta t}$", "$e = " + fmt(ind) + " \\times \\dfrac{" + fmt(di) + "}{" + fmt(t) + "} = " + qv(ok, "V") + "$"], chk: {form: "u24s1e", p: {ind: ind, di: di, t: t}}};
  }
  throw new Error("u24s1e：条件に合う数字が見つからない");
}
function tbU24s1_Qind(r){
  var gcd = tbU24s1_gcd, ratio = tbU24s1_ratio, par = tbU24s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ind = pick(r, [0.1,0.2,0.4,0.5,0.8,1,2]);
    var di = pick(r, [1,2,4,5,10]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var E = (Math.round((ind * di / t) * 1000) / 1000);
    var A = (E * di / t);
    var B = (E * t);
    var C = (di / (E * t));
    if (!(nice(ind * di / t) && E >= 1 && E <= 1000 && nice(A) && nice(B) && nice(C) && C >= 0.001 && distinct([ind, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ind) + "\\,\\mathrm{H}$", v: fmt(ind)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "電流の変化の割合で割るところを掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "電流の変化で割っていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "割る順が逆"}]);
    return {form: "u24s1ind", text: "コイルの電流が $" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(di) + "\\,\\mathrm{A}$ 変わり、大きさ $" + fmt(E) + "\\,\\mathrm{V}$ の自己誘導起電力が生じた。このコイルの自己インダクタンスは何 H か。", fig: {kind: "u24s1tr", L: tbU24s1_fig({"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, [["i", "Δ{I}=" + fmt(di) + " A"], ["e", "{e}=" + fmt(E) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = L \\dfrac{\\Delta I}{\\Delta t}$ より $L = \\dfrac{e \\Delta t}{\\Delta I}$", "$L = \\dfrac{" + fmt(E) + " \\times " + fmt(t) + "}{" + fmt(di) + "} = " + fmt(ind) + "\\,\\mathrm{H}$"], chk: {form: "u24s1ind", p: {ind: ind, di: di, t: t}}};
  }
  throw new Error("u24s1ind：条件に合う数字が見つからない");
}
function tbU24s1_Qdi(r){
  var gcd = tbU24s1_gcd, ratio = tbU24s1_ratio, par = tbU24s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ind = pick(r, [0.1,0.2,0.4,0.5,1,2]);
    var di = pick(r, [0.5,1,2,3,4,5,10]);
    var t = pick(r, [0.01,0.02,0.05,0.1,0.2,0.5]);
    var E = (Math.round((ind * di / t) * 1000) / 1000);
    if (!(nice(ind * di / t) && E >= 1 && E <= 1000)) continue;
    var ok = (E * t / ind);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU24s1_three(ok, [{x: (E * ind / t), why: "時間を掛けるところを割り、自己インダクタンスで割るところを掛けた"}, {x: (E * t), why: "自己インダクタンスで割っていない"}, {x: (E / ind), why: "時間を掛けていない"}, {x: (ind * t / E), why: "割る順が逆"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u24s1di", text: "自己インダクタンス $" + fmt(ind) + "\\,\\mathrm{H}$ のコイルに、$" + fmt(t) + "\\,\\mathrm{s}$ の間に大きさ $" + fmt(E) + "\\,\\mathrm{V}$ の自己誘導起電力が生じた。この間に変わった電流は何 A か。", fig: {kind: "u24s1tr", L: tbU24s1_fig({"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, [["i", "Δ{I}"], ["ind", "{L}=" + fmt(ind) + " H"], ["e", "{e}=" + fmt(E) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = L \\dfrac{\\Delta I}{\\Delta t}$ より $\\Delta I = \\dfrac{e \\Delta t}{L}$", "$\\Delta I = \\dfrac{" + fmt(E) + " \\times " + fmt(t) + "}{" + fmt(ind) + "} = " + qv(ok, "A") + "$"], chk: {form: "u24s1di", p: {ind: ind, di: di, t: t}}};
  }
  throw new Error("u24s1di：条件に合う数字が見つからない");
}
function tbU24s1_Qtimes(r){
  var gcd = tbU24s1_gcd, ratio = tbU24s1_ratio, par = tbU24s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var m = pick(r, [2,3,4,5]);
    var m2 = (m * m);
    var what = (k == 1 ? '自己インダクタンスが ' + m + ' 倍のコイルにかえた' : (k == 2 ? '同じだけ電流を変える時間を ' + m + ' 分の 1 にした' : '同じだけ電流を変える時間を ' + m + ' 倍にした'));
    var gs = (k == 3 ? '\\dfrac{1}{' + m + '}' : '' + m);
    var bs = (k == 3 ? '' + m : '\\dfrac{1}{' + m + '}');
    var why = (k == 1 ? '自己誘導起電力は自己インダクタンスに比例する' : '短い時間で電流を変えるほど、起電力は大きい');
    var _c = choices(r, [{t: "$" + String(gs) + "$ 倍", v: "good"}, {t: "$" + String(bs) + "$ 倍", v: "bad", why: String(why)}, {t: "$" + fmt(m2) + "$ 倍", v: "sq", why: "$e = L \\dfrac{\\Delta I}{\\Delta t}$ に2乗は無い"}, {t: "$1$ 倍（変わらない）", v: "one", why: String(why)}]);
    return {form: "u24s1times", text: String(what) + "。自己誘導起電力の大きさは元の何倍になるか。", fig: {kind: "u24s1tr", L: tbU24s1_fig({"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = L \\dfrac{\\Delta I}{\\Delta t}$", "自己誘導起電力は $" + String(gs) + "$ 倍"], chk: {form: "u24s1times", p: {k: k, m: m}}};
  }
  throw new Error("u24s1times：条件に合う数字が見つからない");
}
function tbU24s1_Qwhat(r){
  var gcd = tbU24s1_gcd, ratio = tbU24s1_ratio, par = tbU24s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "自己誘導起電力", v: "own"}, {t: "静電エネルギー", v: "ene", why: "それはコンデンサに蓄えられるエネルギー"}, {t: "起磁力", v: "mmf", why: "起磁力は巻数と電流の積 $NI$"}, {t: "電磁力", v: "force", why: "電磁力は、磁界の中の電流が受ける力"}]);
    return {form: "u24s1what", text: "コイル自身の電流が変わった時に、そのコイルに生じる起電力を □ という。", fig: {kind: "u24s1tr", L: tbU24s1_fig({"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["自分の電流の変化で、自分に生じる起電力", "自己誘導起電力 $e = -L \\dfrac{\\Delta I}{\\Delta t}$"], chk: {form: "u24s1what", p: {}}};
  }
  throw new Error("u24s1what：条件に合う数字が見つからない");
}
function tbU24s1_Qsign(r){
  var gcd = tbU24s1_gcd, ratio = tbU24s1_ratio, par = tbU24s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "流す電流の変化と逆向きに起電力が生じる", v: "own"}, {t: "起電力が必ず負の値になる", v: "neg", why: "大きさを求めるときは、マイナスを外して計算する"}, {t: "電流が減っている", v: "dec", why: "電流が増えても減っても、マイナスは付いている"}, {t: "自己インダクタンスが負の値である", v: "lneg", why: "自己インダクタンスはコイルの性質を表す定数。マイナスは向きを表す"}]);
    return {form: "u24s1sign", text: "$e = -L \\dfrac{\\Delta I}{\\Delta t}$ のマイナスが表すのは、□ ことである。", fig: {kind: "u24s1tr", L: tbU24s1_fig({"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["マイナスは、電流の変化を妨げる向きに起電力が生じることを表す", "流す電流の変化と逆向きに起電力が生じる"], chk: {form: "u24s1sign", p: {}}};
  }
  throw new Error("u24s1sign：条件に合う数字が見つからない");
}
// 24-2 自己インダクタンスと磁束 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u24_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU24s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU24s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU24s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU24s2_par(a, b){ return a * b / (a + b); }
function tbU24s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU24s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU24s2_Qind(r){
  var gcd = tbU24s2_gcd, ratio = tbU24s2_ratio, par = tbU24s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,400,500,1000]);
    var pk = pick(r, [1,2,4,5,10,20,50]);
    var i = pick(r, [0.5,1,2,4,5,10]);
    var ph = (pk / 1000);
    var LL = (n * ph / i);
    var A = (n * ph * i);
    var B = (n * ph);
    var C = (i / (n * ph));
    if (!(i != 1 && nice(LL) && LL >= 0.01 && LL <= 100 && nice(A) && nice(B) && nice(C) && C >= 0.001 && distinct([LL, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(LL) + "\\,\\mathrm{H}$", v: fmt(LL)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "電流で割るところを掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "電流で割っていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "割る順が逆（電流を巻数と磁束の積で割った）"}]);
    return {form: "u24s2ind", text: "巻数 " + fmt(n) + " のコイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流すと、鉄心の中に $" + fmt(ph) + "\\,\\mathrm{Wb}$ の磁束が生じた。このコイルの自己インダクタンスは何 H か。", fig: {kind: "u24s2tr", L: tbU24s2_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}"}, [["n", "{N}=" + fmt(n)], ["i", "{I}=" + fmt(i) + " A"], ["phi", "{Φ}=" + fmt(ph) + " Wb"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{N \\Phi}{I}$", "$L = \\dfrac{" + fmt(n) + " \\times " + fmt(ph) + "}{" + fmt(i) + "} = " + fmt(LL) + "\\,\\mathrm{H}$"], chk: {form: "u24s2ind", p: {n: n, pk: pk, i: i}}};
  }
  throw new Error("u24s2ind：条件に合う数字が見つからない");
}
function tbU24s2_Qphi(r){
  var gcd = tbU24s2_gcd, ratio = tbU24s2_ratio, par = tbU24s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,500,1000]);
    var pk = pick(r, [1,2,4,5,10,20,50]);
    var i = pick(r, [0.5,2,4,5,10]);
    var ph = (pk / 1000);
    var LL = (Math.round((n * ph / i) * 1000) / 1000);
    var A = (LL * n / i);
    var B = (LL * i);
    var C = (n / (LL * i));
    if (!(nice(n * ph / i) && LL >= 0.01 && LL <= 100 && nice(A) && nice(B) && nice(C) && C >= 0.001 && distinct([ph, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ph) + "\\,\\mathrm{Wb}$", v: fmt(ph)}, {t: "$" + fmt(A) + "\\,\\mathrm{Wb}$", v: fmt(A), why: "巻数で割るところを掛け、電流を掛けるところを割った"}, {t: "$" + fmt(B) + "\\,\\mathrm{Wb}$", v: fmt(B), why: "巻数で割っていない"}, {t: "$" + fmt(C) + "\\,\\mathrm{Wb}$", v: fmt(C), why: "割る順が逆"}]);
    return {form: "u24s2phi", text: "自己インダクタンス $" + fmt(LL) + "\\,\\mathrm{H}$、巻数 " + fmt(n) + " のコイルに $" + fmt(i) + "\\,\\mathrm{A}$ の電流を流した。鉄心の中の磁束は何 Wb か。", fig: {kind: "u24s2tr", L: tbU24s2_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}"}, [["n", "{N}=" + fmt(n)], ["i", "{I}=" + fmt(i) + " A"], ["ind", "{L}=" + fmt(LL) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$LI = N \\Phi$ より $\\Phi = \\dfrac{LI}{N}$", "$\\Phi = \\dfrac{" + fmt(LL) + " \\times " + fmt(i) + "}{" + fmt(n) + "} = " + fmt(ph) + "\\,\\mathrm{Wb}$"], chk: {form: "u24s2phi", p: {n: n, pk: pk, i: i}}};
  }
  throw new Error("u24s2phi：条件に合う数字が見つからない");
}
function tbU24s2_Qi(r){
  var gcd = tbU24s2_gcd, ratio = tbU24s2_ratio, par = tbU24s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,500]);
    var pk = pick(r, [2,4,5,10,20,50]);
    var LL = pick(r, [0.1,0.2,0.25,0.5,1,2]);
    var ph = (pk / 1000);
    if (!(nice(n * ph / LL) && n * ph / LL >= 0.1 && n * ph / LL <= 50)) continue;
    var ok = (n * ph / LL);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU24s2_three(ok, [{x: (LL * n / ph), why: "割る順が逆"}, {x: (n * ph * LL), why: "自己インダクタンスで割るところを掛けた"}, {x: (ph / LL), why: "巻数を掛けていない"}, {x: (LL * ph / n), why: "式の変形をまちがえた"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u24s2i", text: "自己インダクタンス $" + fmt(LL) + "\\,\\mathrm{H}$、巻数 " + fmt(n) + " のコイルに電流を流すと、鉄心の中に $" + fmt(ph) + "\\,\\mathrm{Wb}$ の磁束が生じた。流した電流は何 A か。", fig: {kind: "u24s2tr", L: tbU24s2_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}"}, [["n", "{N}=" + fmt(n)], ["i", "{I}"], ["phi", "{Φ}=" + fmt(ph) + " Wb"], ["ind", "{L}=" + fmt(LL) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$LI = N \\Phi$ より $I = \\dfrac{N \\Phi}{L}$", "$I = \\dfrac{" + fmt(n) + " \\times " + fmt(ph) + "}{" + fmt(LL) + "} = " + qv(ok, "A") + "$"], chk: {form: "u24s2i", p: {n: n, pk: pk, LL: LL}}};
  }
  throw new Error("u24s2i：条件に合う数字が見つからない");
}
function tbU24s2_Qeq(r){
  var gcd = tbU24s2_gcd, ratio = tbU24s2_ratio, par = tbU24s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{N \\Phi}{I}$", v: "own"}, {t: "$\\dfrac{NI}{\\Phi}$", v: "swap", why: "磁束と電流が逆。$LI = N\\Phi$"}, {t: "$N \\Phi I$", v: "mul", why: "電流は掛けずに割る。$LI = N\\Phi$"}, {t: "$\\dfrac{I}{N \\Phi}$", v: "inv", why: "分子と分母が逆"}]);
    return {form: "u24s2eq", text: "巻数 $N$ のコイルに電流 $I$ を流すと、磁束 $\\Phi$ が生じた。自己インダクタンス $L$ は □ である。", fig: {kind: "u24s2tr", L: tbU24s2_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}"}, [["n", "{N}"], ["i", "{I}"], ["phi", "{Φ}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$LI = N \\Phi$", "$L = \\dfrac{N \\Phi}{I}$"], chk: {form: "u24s2eq", p: {}}};
  }
  throw new Error("u24s2eq：条件に合う数字が見つからない");
}
function tbU24s2_Qmean(r){
  var gcd = tbU24s2_gcd, ratio = tbU24s2_ratio, par = tbU24s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "1 A", v: "own"}, {t: "1 V", v: "v", why: "電圧ではない。$L = \\dfrac{N \\Phi}{I}$ の $I$ を 1 とおく"}, {t: "最も大きい", v: "max", why: "$L = \\dfrac{N \\Phi}{I}$ の $I$ を 1 とおく"}, {t: "1 Wb", v: "wb", why: "Wb は磁束の単位。$I$ を 1 とおく"}]);
    return {form: "u24s2mean", text: "自己インダクタンスは、コイルに □ の電流を流した時の、巻数と磁束の積といえる。", fig: {kind: "u24s2tr", L: tbU24s2_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{N \\Phi}{I}$ で $I = 1$ とおくと $L = N\\Phi$", "1 A の電流を流した時の、巻数と磁束の積"], chk: {form: "u24s2mean", p: {}}};
  }
  throw new Error("u24s2mean：条件に合う数字が見つからない");
}
// 24-3 自己インダクタンスの式 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u24_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU24s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU24s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU24s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU24s3_par(a, b){ return a * b / (a + b); }
function tbU24s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU24s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU24s3_Qind(r){
  var gcd = tbU24s3_gcd, ratio = tbU24s3_ratio, par = tbU24s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,4,5,10]);
    var sk = pick(r, [1,2,4,5,10,20]);
    var n = pick(r, [20,50,100,200,300,400,500]);
    var lm = pick(r, [0.1,0.2,0.25,0.4,0.5,1]);
    var mu = (a / 1000);
    var s = (sk / 1000);
    var LL = (mu * s * n * n / lm);
    var A = (mu * s * n / lm);
    var B = (mu * s * n * n * lm);
    var C = (s * n * n / lm);
    if (!(nice(LL) && LL >= 0.01 && LL <= 100 && nice(A) && A >= 0.001 && nice(B) && nice(C) && distinct([LL, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(LL) + "\\,\\mathrm{H}$", v: fmt(LL)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "巻数を2乗していない"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "磁路の長さで割るところを掛けた"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "透磁率を掛けていない"}]);
    return {form: "u24s3ind", text: "透磁率 $" + fmt(a) + " \\times 10^{-3}\\,\\mathrm{H/m}$、断面積 $" + fmt(s) + "\\,\\mathrm{m^2}$、磁路の長さ $" + fmt(lm) + "\\,\\mathrm{m}$ の鉄心に、導体を " + fmt(n) + " 回巻いた。このコイルの自己インダクタンスは何 H か。", fig: {kind: "u24s3tr", L: tbU24s3_fig({"mu":"{μ}","n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","s":"{S}","l":"{l}"}, [["mu", "{μ}=" + fmt(a) + "×10⁻³ H/m"], ["n", "{N}=" + fmt(n)], ["s", "{S}=" + fmt(s) + " m²"], ["l", "{l}=" + fmt(lm) + " m"], ["i", null], ["phi", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{\\mu S N^2}{l}$", "$L = \\dfrac{" + fmt(a) + " \\times 10^{-3} \\times " + fmt(s) + " \\times " + fmt(n) + "^2}{" + fmt(lm) + "} = " + fmt(LL) + "\\,\\mathrm{H}$"], chk: {form: "u24s3ind", p: {a: a, sk: sk, n: n, lm: lm}}};
  }
  throw new Error("u24s3ind：条件に合う数字が見つからない");
}
function tbU24s3_Qorder(r){
  var gcd = tbU24s3_gcd, ratio = tbU24s3_ratio, par = tbU24s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var lhs = (k == 1 ? '\\Phi' : (k == 2 ? 'B' : 'H'));
    var good = (k == 1 ? 'BS' : (k == 2 ? '\\mu H' : '\\dfrac{NI}{l}'));
    var b1 = (k == 1 ? '\\mu H' : (k == 2 ? 'BS' : 'BS'));
    var w1 = (k == 1 ? 'それは磁束密度の式' : 'それは磁束の式');
    var b2 = (k == 3 ? '\\mu H' : '\\dfrac{NI}{l}');
    var w2 = (k == 3 ? 'それは磁束密度の式' : 'それは磁界の強さの式');
    var b3 = (k == 1 ? '\\dfrac{B}{S}' : (k == 2 ? '\\dfrac{H}{\\mu}' : '\\dfrac{l}{NI}'));
    var w3 = (k == 1 ? '磁束は、磁束密度に断面積を掛ける' : (k == 2 ? '磁束密度は、透磁率に磁界の強さを掛ける' : '磁界の強さは、起磁力を磁路の長さで割る'));
    var _c = choices(r, [{t: "$" + String(good) + "$", v: "good"}, {t: "$" + String(b1) + "$", v: "b1", why: String(w1)}, {t: "$" + String(b2) + "$", v: "b2", why: String(w2)}, {t: "$" + String(b3) + "$", v: "b3", why: String(w3)}]);
    return {form: "u24s3order", text: "$L = \\dfrac{N \\Phi}{I}$ から $L = \\dfrac{\\mu S N^2}{l}$ を導く時に使う式で、$" + String(lhs) + " = $ □ に入るのはどれか。", fig: {kind: "u24s3tr", L: tbU24s3_fig({"mu":"{μ}","n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","s":"{S}","l":"{l}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\Phi = BS$・$B = \\mu H$・$H = \\dfrac{NI}{l}$ を順に入れる", "$" + String(lhs) + " = " + String(good) + "$"], chk: {form: "u24s3order", p: {k: k}}};
  }
  throw new Error("u24s3order：条件に合う数字が見つからない");
}
function tbU24s3_Qeq(r){
  var gcd = tbU24s3_gcd, ratio = tbU24s3_ratio, par = tbU24s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{\\mu S N^2}{l}$", v: "own"}, {t: "$\\dfrac{\\mu S N}{l}$", v: "n1", why: "巻数は2乗する（$I$ を約分すると $N$ が2つ残る）"}, {t: "$\\dfrac{\\mu l N^2}{S}$", v: "swap", why: "断面積と磁路の長さが逆"}, {t: "$\\dfrac{S N^2}{\\mu l}$", v: "mu", why: "透磁率は分子。$B = \\mu H$"}]);
    return {form: "u24s3eq", text: "透磁率 $\\mu$、断面積 $S$、磁路の長さ $l$ の鉄心に、導体を $N$ 回巻いた。自己インダクタンス $L$ は □ である。", fig: {kind: "u24s3tr", L: tbU24s3_fig({"mu":"{μ}","n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","s":"{S}","l":"{l}"}, [["mu", "{μ}"], ["n", "{N}"], ["s", "{S}"], ["l", "{l}"], ["i", null], ["phi", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{N}{I} \\times BS = \\dfrac{N \\mu S}{I} \\times \\dfrac{NI}{l}$", "$L = \\dfrac{\\mu S N^2}{l}$"], chk: {form: "u24s3eq", p: {}}};
  }
  throw new Error("u24s3eq：条件に合う数字が見つからない");
}
function tbU24s3_Qtimes(r){
  var gcd = tbU24s3_gcd, ratio = tbU24s3_ratio, par = tbU24s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2,3]);
    var m = pick(r, [2,3,4,5]);
    var what = (k == 1 ? '鉄心の断面積を ' + m + ' 倍' : (k == 2 ? '鉄心の磁路の長さを ' + m + ' 倍' : '透磁率が ' + m + ' 倍の鉄心'));
    var gs = (k == 2 ? '\\dfrac{1}{' + m + '}' : '' + m);
    var bs = (k == 2 ? '' + m : '\\dfrac{1}{' + m + '}');
    var why = (k == 2 ? '磁路の長さは分母にある' : (k == 1 ? '断面積は分子にある' : '透磁率は分子にある'));
    var m2 = (m * m);
    var _c = choices(r, [{t: "$" + String(gs) + "$ 倍", v: "good"}, {t: "$" + String(bs) + "$ 倍", v: "bad", why: String(why)}, {t: "$" + fmt(m2) + "$ 倍", v: "sq", why: "2乗するのは巻数だけ"}, {t: "$1$ 倍（変わらない）", v: "one", why: String(why)}]);
    return {form: "u24s3times", text: "巻数はそのままで、" + String(what) + "にした。自己インダクタンスは元の何倍になるか。", fig: {kind: "u24s3tr", L: tbU24s3_fig({"mu":"{μ}","n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","s":"{S}","l":"{l}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{\\mu S N^2}{l}$", "自己インダクタンスは $" + String(gs) + "$ 倍"], chk: {form: "u24s3times", p: {k: k, m: m}}};
  }
  throw new Error("u24s3times：条件に合う数字が見つからない");
}
// 24-4 巻数の2乗に比例 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u24_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU24s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU24s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU24s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU24s4_par(a, b){ return a * b / (a + b); }
function tbU24s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU24s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU24s4_Qtimes(r){
  var gcd = tbU24s4_gcd, ratio = tbU24s4_ratio, par = tbU24s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [2,3,4,5,10]);
    var m2 = (m * m);
    var m3 = (m * m * m);
    var _c = choices(r, [{t: "$" + fmt(m2) + "$ 倍", v: fmt(m2)}, {t: "$" + fmt(m) + "$ 倍", v: fmt(m), why: "磁束も巻数に比例して大きくなるので、2乗に比例する"}, {t: "$" + fmt(m3) + "$ 倍", v: fmt(m3), why: "3乗ではない。$L = \\dfrac{\\mu S N^2}{l}$"}, {t: "$\\dfrac{1}{" + fmt(m) + "}$ 倍", v: "1/" + fmt(m), why: "巻数は分子にある"}]);
    return {form: "u24s4times", text: "鉄心はそのままで、コイルの巻数を " + fmt(m) + " 倍にした。自己インダクタンスは元の何倍になるか。", fig: {kind: "u24s4tr", L: tbU24s4_fig({"n":"{N}","nt":1,"i":null,"phi":null,"phia":"cw","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{\\mu S N^2}{l}$ で、巻数の2乗に比例", "$" + fmt(m) + "^2 = " + fmt(m2) + "$ 倍"], chk: {form: "u24s4times", p: {m: m}}};
  }
  throw new Error("u24s4times：条件に合う数字が見つからない");
}
function tbU24s4_Qnewl(r){
  var gcd = tbU24s4_gcd, ratio = tbU24s4_ratio, par = tbU24s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n1 = pick(r, [50,100,200,300,400,500]);
    var n2 = pick(r, [50,100,150,200,300,400,500,600,800,1000]);
    var l1 = pick(r, [0.01,0.02,0.04,0.05,0.1,0.2,0.4,0.5,1]);
    var L2 = (l1 * n2 * n2 / (n1 * n1));
    var A = (l1 * n2 / n1);
    var B = (l1 * n1 * n1 / (n2 * n2));
    var C = (l1 * n2 * n2 * n2 / (n1 * n1 * n1));
    if (!(n1 != n2 && nice(n2 / n1) && nice(L2) && L2 <= 200 && nice(A) && nice(B) && B >= 0.001 && nice(C) && C <= 10000 && distinct([L2, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(L2) + "\\,\\mathrm{H}$", v: fmt(L2)}, {t: "$" + fmt(A) + "\\,\\mathrm{H}$", v: fmt(A), why: "巻数の1乗に比例させた。2乗に比例する"}, {t: "$" + fmt(B) + "\\,\\mathrm{H}$", v: fmt(B), why: "比を逆にした"}, {t: "$" + fmt(C) + "\\,\\mathrm{H}$", v: fmt(C), why: "3乗した。2乗に比例する"}]);
    return {form: "u24s4newl", text: "巻数 " + fmt(n1) + " のコイルの自己インダクタンスは $" + fmt(l1) + "\\,\\mathrm{H}$ である。鉄心はそのままで、巻数を " + fmt(n2) + " にすると、自己インダクタンスは何 H になるか。", fig: {kind: "u24s4tr", L: tbU24s4_fig({"n":"{N}","nt":1,"i":null,"phi":null,"phia":"cw","ind":"{L}"}, [["n", "{N}=" + fmt(n1)], ["ind", "{L}=" + fmt(l1) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["巻数は $\\dfrac{" + fmt(n2) + "}{" + fmt(n1) + "}$ 倍。自己インダクタンスは2乗に比例", "$L = " + fmt(l1) + " \\times \\left(\\dfrac{" + fmt(n2) + "}{" + fmt(n1) + "}\\right)^2 = " + fmt(L2) + "\\,\\mathrm{H}$"], chk: {form: "u24s4newl", p: {l1: l1, n1: n1, n2: n2}}};
  }
  throw new Error("u24s4newl：条件に合う数字が見つからない");
}
function tbU24s4_Qratio(r){
  var gcd = tbU24s4_gcd, ratio = tbU24s4_ratio, par = tbU24s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [2,3,4,5,10]);
    var m2 = (m * m);
    var h = (m * m / 2);
    if (!(nice(h) && h != m)) continue;
    var _c = choices(r, [{t: "$" + fmt(m) + "$ 倍", v: fmt(m)}, {t: "$" + fmt(m2) + "$ 倍", v: fmt(m2), why: "自己インダクタンスは巻数の2乗に比例する"}, {t: "$" + fmt(h) + "$ 倍", v: fmt(h), why: "2 で割るのではない。2乗して " + fmt(m2) + " になる数"}, {t: "$\\dfrac{1}{" + fmt(m) + "}$ 倍", v: "1/" + fmt(m), why: "巻数は分子にある"}]);
    return {form: "u24s4ratio", text: "鉄心はそのままで巻数を変えたところ、自己インダクタンスが元の " + fmt(m2) + " 倍になった。巻数は元の何倍にしたか。", fig: {kind: "u24s4tr", L: tbU24s4_fig({"n":"{N}","nt":1,"i":null,"phi":null,"phia":"cw","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L$ は $N^2$ に比例するので、2乗して " + fmt(m2) + " になる数", "$" + fmt(m) + "^2 = " + fmt(m2) + "$ より、巻数は $" + fmt(m) + "$ 倍"], chk: {form: "u24s4ratio", p: {m: m}}};
  }
  throw new Error("u24s4ratio：条件に合う数字が見つからない");
}
function tbU24s4_Qwhy(r){
  var gcd = tbU24s4_gcd, ratio = tbU24s4_ratio, par = tbU24s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "巻数を変えると、磁束も同じ割合で変わる", v: "own"}, {t: "巻数を変えると、電流が小さくなる", v: "i", why: "電流はそのまま。磁束の中にも巻数が入っている"}, {t: "巻数を変えると、磁路の長さが変わる", v: "l", why: "鉄心はそのまま。磁束の中にも巻数が入っている"}, {t: "巻数を変えると、透磁率が変わる", v: "mu", why: "鉄心はそのまま。磁束の中にも巻数が入っている"}]);
    return {form: "u24s4why", text: "$L = \\dfrac{N \\Phi}{I}$ では巻数の1乗に見えるのに、自己インダクタンスが巻数の2乗に比例するのは、□ からである。", fig: {kind: "u24s4tr", L: tbU24s4_fig({"n":"{N}","nt":1,"i":null,"phi":null,"phia":"cw","ind":"{L}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["起磁力 $NI$ が巻数に比例するので、磁束 $\\Phi$ も巻数に比例する", "巻数を変えると、磁束も同じ割合で変わる"], chk: {form: "u24s4why", p: {}}};
  }
  throw new Error("u24s4why：条件に合う数字が見つからない");
}
var GEN = {
  // 24-1 自己誘導
  1: function(r){ return pick(r, [tbU24s1_Qe, tbU24s1_Qe, tbU24s1_Qe, tbU24s1_Qind, tbU24s1_Qind, tbU24s1_Qdi, tbU24s1_Qdi, tbU24s1_Qtimes, tbU24s1_Qwhat, tbU24s1_Qsign])(r); },
  // 24-2 自己インダクタンスと磁束
  2: function(r){ return pick(r, [tbU24s2_Qind, tbU24s2_Qind, tbU24s2_Qind, tbU24s2_Qphi, tbU24s2_Qphi, tbU24s2_Qi, tbU24s2_Qi, tbU24s2_Qeq, tbU24s2_Qmean])(r); },
  // 24-3 自己インダクタンスの式
  3: function(r){ return pick(r, [tbU24s3_Qind, tbU24s3_Qind, tbU24s3_Qind, tbU24s3_Qorder, tbU24s3_Qorder, tbU24s3_Qeq, tbU24s3_Qtimes, tbU24s3_Qtimes])(r); },
  // 24-4 巻数の2乗に比例
  4: function(r){ return pick(r, [tbU24s4_Qtimes, tbU24s4_Qtimes, tbU24s4_Qnewl, tbU24s4_Qnewl, tbU24s4_Qnewl, tbU24s4_Qratio, tbU24s4_Qratio, tbU24s4_Qwhy])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t24s1e","scene":"t24s1e","kind":"u24s1tr","lab":{"n":"","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}"},"viewbox":"-123 110 897 522","band":{"want":"自己誘導起電力の大きさ","ans":"$e = -L \\dfrac{\\Delta I}{\\Delta t}$","full":"コイルの電流が変わると磁束も変わり、コイルはその変化を妨げる向きに起電力を生じる。これが自己誘導起電力。e = -L ΔI/Δt。L は自己インダクタンスで、コイルの性質を表す定数。マイナスは電流の変化と逆向きに生じることを表す。"},"narr":{"start":{"co":1,"id":0,"phid":0,"ed":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①自己誘導\n②式\n③マイナスと2つの式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"鉄心にコイルを巻き、電流を流します。電流が $\\Delta I$ だけ増えたとします。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"i","emph":["N","I"]},{"text":"右ねじの法則で、鉄心の中の磁束も増えます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"phi","emph":["Phi"]},{"text":"コイルは、この磁束の変化を妨げる向きに起電力を生じます。電磁誘導です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"e","emph":["E"]},{"text":"自分の電流の変化で、自分に生じる起電力です。これを〖自己誘導起電力〗といいます。","at":{"強調":1.0},"after":[],"emph":["E","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己誘導起電力は、次の式で表します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E","Ind","I"],"eq":[{"cont":false,"items":[["e = -L \\dfrac{\\Delta I}{\\Delta t}"]]}],"emphPre":["E","Ind","I"]},{"text":"$L$ は自己インダクタンスで、〖コイルの性質を表す定数〗です。単位は H（ヘンリー）です。","at":{"強調":1.0},"after":[],"emph":["Ind"]},{"text":"$\\dfrac{\\Delta I}{\\Delta t}$ は、決まった時間に電流がどれだけ変わるかを表します。短い時間で電流を大きく変えるほど、起電力は大きくなります。","at":{"強調":1.0},"after":[],"emph":["I","E"]},{"text":"自己インダクタンスが大きいほど、大きな起電力を生じます。","at":{"強調":1.0},"after":[],"emph":["Ind","E"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"マイナスは、〖流す電流の変化と逆向き〗に起電力が生じることを表します。大きさを求めるときは外します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["E","Ind","I"],"eq":[{"cont":false,"items":[["e = L \\dfrac{\\Delta I}{\\Delta t}"]]}],"emphPre":["E"]},{"text":"同じ起電力は、巻数と磁束の変化でも表せます。2つの式を並べて覚えます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["E","Ind","I","Phi"],"eq":[{"cont":false,"items":[["e = -L \\dfrac{\\Delta I}{\\Delta t}","e = -N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"ans":true,"emphPre":["E","Phi"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"i":{"to":{"id":1},"dur":0.8},"phi":{"to":{"phid":1},"dur":0.8},"e":{"to":{"ed":1},"dur":0.6}},"route":["自己誘導","式","マイナスと2つの式"]}},{"id":"t24s1x","scene":"t24s1x","kind":"u24s1tr","lab":{"n":"","i":"Δ{I}=4 A","phi":"Δ{Φ}","phia":"cw","e":["{e}","{e}=10 V"],"ea":"oppose","ind":"{L}=0.5 H"},"viewbox":"-123 110 897 522","band":{"want":"自己誘導起電力の大きさ $e$","known":"$L = 0.5\\,\\mathrm{H},\\;\\; \\Delta I = 4\\,\\mathrm{A},\\;\\; \\Delta t = 0.2\\,\\mathrm{s}$","ans":"$e = 10\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"id":1,"phid":1,"ed":1,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、自己誘導起電力の大きさ $e$ です。","at":{"強調":1.0},"after":[],"emph":["E"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"大きさを求めるので、〖マイナスを外した式〗を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","Ind","I"],"eq":[{"cont":false,"items":[["e = L \\dfrac{\\Delta I}{\\Delta t}"]]}],"emphPre":["E","Ind","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$L = 0.5$、$\\Delta I = 4$、$\\Delta t = 0.2$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["E","Ind","I"],"eq":[{"cont":false,"items":[["e = 0.5 \\times \\dfrac{4}{0.2}"],["= 0.5 \\times 20 = 10\\,\\mathrm{V}"]]}],"move":"ev","ans":true,"emphPre":["Ind","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"ev":{"to":{"ev":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t24s2e","scene":"t24s2e","kind":"u24s2tr","lab":{"n":"{N}","i":"Δ{I}","phi":"Δ{Φ}","phia":"cw","ind":"{L}"},"viewbox":"42 115 732 517","band":{"want":"自己インダクタンスを巻数・磁束・電流で表す","ans":"$L = \\dfrac{N \\Phi}{I}$（$LI = N\\Phi$）","full":"自己誘導起電力の2つの式は同じ物なので等しいとおける。L ΔI/Δt = N ΔΦ/Δt から L ΔI = N ΔΦ。電流と磁束は比例するので Δ を外せて L = NΦ/I。自己インダクタンスは 1 A の電流を流した時の巻数と磁束の積。"},"narr":{"start":{"co":1,"id":1,"phid":1,"iv":0,"phiv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①2つの式を等しく\n②Δ を外す\n③1 A あたり\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己誘導起電力は、2つの式で表せました。同じ物なので、〖等しい〗とおけます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ind","I","N","Phi"],"eq":[{"cont":false,"items":[["L \\dfrac{\\Delta I}{\\Delta t} = N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"emphPre":["Ind","I","N","Phi"]},{"text":"両辺に $\\Delta t$ を掛けると、分母が消えます。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["L \\Delta I = N \\Delta \\Phi"]]}],"emph":["Ind","I","N","Phi"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖流れる電流と、生じる磁束は比例〗します。そのため、$\\Delta$ を外せます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"nod","emph":["Ind","I","N","Phi"],"eq":[{"cont":false,"items":[["LI = N \\Phi"]]}],"emphPre":["I","Phi"]},{"text":"$I$ で割ると、自己インダクタンスの式になります。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"]]}],"emph":["Ind","N","Phi","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$I = 1$ とおくと、$L = N\\Phi$ です。自己インダクタンスは、〖1 A の電流〗を流した時の、巻数と磁束の積です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Ind","N","Phi"]},{"text":"式は覚えるだけでなく、2つの式から導けるようにしておきます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"]]}],"ans":true,"emphPre":["Ind"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"nod":{"to":{"iv":1,"phiv":1},"dur":0.6}},"route":["2つの式を等しく","Δ を外す","1 A あたり"]}},{"id":"t24s2x","scene":"t24s2x","kind":"u24s2tr","lab":{"n":"{N}=100","i":"{I}=4 A","phi":"{Φ}=0.02 Wb","phia":"cw","ind":["{L}","{L}=0.5 H"]},"viewbox":"42 115 732 517","band":{"want":"自己インダクタンス $L$","known":"$N = 100,\\;\\; I = 4\\,\\mathrm{A},\\;\\; \\Phi = 0.02\\,\\mathrm{Wb}$","ans":"$L = 0.5\\,\\mathrm{H}$"},"narr":{"start":{"co":1,"id":1,"phid":1,"indv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、自己インダクタンス $L$ です。","at":{"強調":1.0},"after":[],"emph":["Ind"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスは、〖巻数と磁束の積を電流で割り〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"]]}],"emphPre":["Ind","N","Phi","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$N = 100$、$\\Phi = 0.02$、$I = 4$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{100 \\times 0.02}{4}"],["= \\dfrac{2}{4} = 0.5\\,\\mathrm{H}"]]}],"move":"indv","ans":true,"emphPre":["N","Phi","I","Ind"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"indv":{"to":{"indv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t24s3e","scene":"t24s3e","kind":"u24s3tr","lab":{"mu":"{μ}","n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","s":"{S}","l":"{l}"},"viewbox":"42 108 977 624","band":{"want":"自己インダクタンスを鉄心とコイルで表す","ans":"$L = \\dfrac{\\mu S N^2}{l}$","full":"L = NΦ/I に Φ = BS、B = μH、H = NI/l を順に入れ、I を約分すると L = μSN²/l。S は鉄心の断面積、l は磁路の長さ、μ は透磁率。"},"narr":{"start":{"co":1,"id":1,"phid":1,"sd":0,"ld":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①使う式\n②順に入れる\n③約分\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"鉄心の断面積を $S$ とします。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"s","emph":["S"]},{"text":"磁路の長さを $l$ とします。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"l","emph":["S","L"]},{"text":"磁束は、磁束密度に断面積を掛けた物でした。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Phi","S"],"eq":[{"cont":false,"items":[["\\Phi = BS"]]}],"emphPre":["Phi","S"]},{"text":"磁束密度は、透磁率に磁界の強さを掛けた物でした。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Mu"],"eq":[{"cont":false,"items":[["B = \\mu H"]]}],"emphPre":["Mu"]},{"text":"磁界の強さは、起磁力 $NI$ を磁路の長さで割った物でした。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","I","L"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{l}"]]}],"emphPre":["N","I","L"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$L = \\dfrac{N \\Phi}{I}$ から始めます。$\\Phi = BS$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ind","N","S","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"],["= \\dfrac{NBS}{I}"]]}],"emphPre":["Ind","N","Phi","I","S"]},{"text":"$B = \\mu H$ を入れます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Ind","N","Mu","S","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\mu H S}{I}"]]}],"emphPre":["Ind","N","Mu","S","I"]},{"text":"$H = \\dfrac{NI}{l}$ を入れます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Ind","N","Mu","S","I","L"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\mu S}{I} \\times \\dfrac{NI}{l}"]]}],"emphPre":["Ind","N","Mu","S","I","L"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"分子と分母の $I$ を約分すると、〖電流が消えます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Ind","Mu","S","N","L","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{\\mu S N^2}{l}"]]}],"emphPre":["I"]},{"text":"自己インダクタンスは、〖透磁率と断面積に比例〗し、磁路の長さに反比例します。巻数は2乗です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Ind","Mu","S","N","L","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{\\mu S N^2}{l}"]]}],"ans":true,"emphPre":["Mu","S","L","N","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"s":{"to":{"sd":1},"dur":0.6},"l":{"to":{"ld":1},"dur":0.8}},"route":["使う式","順に入れる","約分"]}},{"id":"t24s3x","scene":"t24s3x","kind":"u24s3tr","lab":{"mu":"{μ}=2×10⁻³ H/m","n":"{N}=100","i":"{I}","phi":"{Φ}","phia":"cw","ind":["{L}","{L}=0.2 H"],"s":"{S}=0.004 m²","l":"{l}=0.4 m"},"viewbox":"42 108 977 624","band":{"want":"自己インダクタンス $L$","known":"$\\mu = 2 \\times 10^{-3}\\,\\mathrm{H/m},\\;\\; S = 0.004\\,\\mathrm{m^2},\\;\\; N = 100,\\;\\; l = 0.4\\,\\mathrm{m}$","ans":"$L = 0.2\\,\\mathrm{H}$"},"narr":{"start":{"co":1,"id":0,"phid":0,"sd":1,"ld":1,"indv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、自己インダクタンス $L$ です。","at":{"強調":1.0},"after":[],"emph":["Ind"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"鉄心とコイルの値が分かっているので、$L = \\dfrac{\\mu S N^2}{l}$ を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ind","Mu","S","N","L"],"eq":[{"cont":false,"items":[["L = \\dfrac{\\mu S N^2}{l}"]]}],"emphPre":["Ind","Mu","S","N","L"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$\\mu = 2 \\times 10^{-3}$、$S = 0.004$、$N = 100$、$l = 0.4$ を入れます。〖巻数は2乗〗します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["Ind","Mu","S","N","L"],"eq":[{"cont":false,"items":[["\\mu S N^2 = 2 \\times 10^{-3} \\times 0.004","\\times 100^2 = 0.08"],["L = \\dfrac{0.08}{0.4} = 0.2\\,\\mathrm{H}"]]}],"move":"indv","ans":true,"emphPre":["Mu","S","N","L","Ind"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"indv":{"to":{"indv":1},"dur":0.4}},"route":["式を書く","数を入れる"]}},{"id":"t24s4e","scene":"t24s4e","kind":"u24s4tr","lab":{"n":["{N}","2{N}"],"nt":[1,2],"i":"{I}","phi":["{Φ}","2{Φ}"],"phia":"cw","ind":["{L}","4{L}"]},"viewbox":"42 115 732 517","band":{"want":"巻数を変えた時の自己インダクタンス","ans":"巻数の2乗に比例（2倍で4倍）","full":"L = μSN²/l の N は2乗なので、自己インダクタンスは巻数の2乗に比例する。巻数を 2・3・4 倍にすると 4・9・16 倍。L = NΦ/I では1乗に見えるが、巻数を変えると磁束も同じ割合で変わる。"},"narr":{"start":{"co":1,"id":1,"phid":1,"ntv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"①2乗に比例\n②1乗に見える理由\n③まとめ\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスの式で、巻数 $N$ は2乗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ind","N"],"eq":[{"cont":false,"items":[["L = \\dfrac{\\mu S N^2}{l}"]]}],"emphPre":["Ind","N"]},{"text":"巻数を 2 倍にすると、自己インダクタンスは 〖$2^2 = 4$ 倍〗になります。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"nt","emph":["N","Ind"],"eq":[{"cont":false,"items":[["(2N)^2 = 4N^2"]]}],"emphPre":["N","Ind"]},{"text":"3 倍なら 9 倍、4 倍なら 16 倍です。","at":{"強調":1.0},"after":[],"emph":["N","Ind"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"$L = \\dfrac{N \\Phi}{I}$ だけを見ると、巻数の1乗に比例するように見えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"]]}],"emphPre":["Ind","N","Phi","I"]},{"text":"しかし、巻数を 2 倍にすると、起磁力 $NI$ も 2 倍になり、磁束 $\\Phi$ も 2 倍になります。〖磁束の中にも $N$〗があります。","at":{"強調":1.0},"after":[],"emph":["Phi","N","I"]},{"text":"$N$ が 2 倍、$\\Phi$ も 2 倍なので、$L$ は 4 倍です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","Phi","Ind","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{2N \\times 2\\Phi}{I} = 4 \\times \\dfrac{N \\Phi}{I}"]]}],"emphPre":["N","Phi","Ind","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスは、〖巻数の2乗に比例〗します。計算にも、文章の問題にも出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Ind","N"],"eq":[{"cont":false,"items":[["L = \\dfrac{\\mu S N^2}{l}"]]}],"ans":true,"emphPre":["Ind","N"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"nt":{"to":{"ntv":1},"dur":0.8}},"route":["2乗に比例","1乗に見える理由","まとめ"]}},{"id":"t24s4x","scene":"t24s4x","kind":"u24s4tr","lab":{"n":["{N}=100","{N}=300"],"nt":[1,2],"i":null,"phi":null,"phia":"cw","ind":["{L}=0.2 H","{L}=1.8 H"]},"viewbox":"42 115 732 517","band":{"want":"巻数を 300 にした時の自己インダクタンス","known":"巻数 100 で $L = 0.2\\,\\mathrm{H}$","ans":"$1.8\\,\\mathrm{H}$"},"narr":{"start":{"co":1,"id":0,"phid":0,"ntv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、巻数を 300 にした時の自己インダクタンスです。","at":{"強調":1.0},"after":[],"emph":["Ind"]},{"text":"①何倍か\n②2乗する\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"巻数は 100 から 300 で、3 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"nt","emph":["N"],"eq":[{"cont":false,"items":[["\\dfrac{300}{100} = 3"]]}],"emphPre":["N"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスは巻数の2乗に比例するので、〖$3^2 = 9$ 倍〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Ind","N"],"eq":[{"cont":false,"items":[["L = 0.2 \\times 3^2"],["= 0.2 \\times 9 = 1.8\\,\\mathrm{H}"]]}],"ans":true,"emphPre":["Ind","N"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"nt":{"to":{"ntv":1},"dur":0.8}},"route":["何倍か","2乗する"]}}],"secs":[{"ex":{"text":"自己インダクタンス $0.5\\,\\mathrm{H}$ のコイルの電流が、$0.2\\,\\mathrm{s}$ の間に $4\\,\\mathrm{A}$ 増えた。自己誘導起電力の大きさは何 V か。","fig":{"kind":"u24s1tr","L":{"n":"","i":"Δ{I}=4 A","phi":"Δ{Φ}","phia":"cw","e":"{e}","ea":"oppose","ind":"{L}=0.5 H"},"P":{}},"ch":[{"t":"$0.4\\,\\mathrm{V}$","v":0.4,"why":"時間で割るところを掛けた"},{"t":"$10\\,\\mathrm{V}$","v":10,"why":""},{"t":"$2\\,\\mathrm{V}$","v":2,"why":"時間で割っていない"},{"t":"$20\\,\\mathrm{V}$","v":20,"why":"自己インダクタンスを掛けていない"}],"ans":1}},{"ex":{"text":"巻数 100 のコイルに $4\\,\\mathrm{A}$ の電流を流すと、鉄心の中に $0.02\\,\\mathrm{Wb}$ の磁束が生じた。このコイルの自己インダクタンスは何 H か。","fig":{"kind":"u24s2tr","L":{"n":"{N}=100","i":"{I}=4 A","phi":"{Φ}=0.02 Wb","phia":"cw","ind":"{L}"},"P":{}},"ch":[{"t":"$8\\,\\mathrm{H}$","v":"8","why":"電流で割るところを掛けた"},{"t":"$2\\,\\mathrm{H}$","v":"2","why":"電流で割っていない"},{"t":"$0.5\\,\\mathrm{H}$","v":"0.5","why":""},{"t":"$0.005\\,\\mathrm{H}$","v":"0.005","why":"巻数を掛けていない"}],"ans":2}},{"ex":{"text":"透磁率 $2 \\times 10^{-3}\\,\\mathrm{H/m}$、断面積 $0.004\\,\\mathrm{m^2}$、磁路の長さ $0.4\\,\\mathrm{m}$ の鉄心に、導体を 100 回巻いた。このコイルの自己インダクタンスは何 H か。","fig":{"kind":"u24s3tr","L":{"mu":"{μ}=2×10⁻³ H/m","n":"{N}=100","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","s":"{S}=0.004 m²","l":"{l}=0.4 m"},"P":{}},"ch":[{"t":"$0.002\\,\\mathrm{H}$","v":"0.002","why":"巻数を2乗していない"},{"t":"$0.2\\,\\mathrm{H}$","v":"0.2","why":""},{"t":"$0.032\\,\\mathrm{H}$","v":"0.032","why":"磁路の長さで割るところを掛けた"},{"t":"$20\\,\\mathrm{H}$","v":"20","why":"透磁率を掛けていない"}],"ans":1}},{"ex":{"text":"巻数 100 のコイルの自己インダクタンスは $0.2\\,\\mathrm{H}$ である。鉄心はそのままで、巻数を 300 にすると、自己インダクタンスは何 H になるか。","fig":{"kind":"u24s4tr","L":{"n":"{N}=100","nt":1,"i":null,"phi":null,"phia":"cw","ind":"{L}=0.2 H"},"P":{}},"ch":[{"t":"$0.6\\,\\mathrm{H}$","v":"0.6","why":"巻数の1乗に比例させた。2乗に比例する"},{"t":"$1.8\\,\\mathrm{H}$","v":"1.8","why":""},{"t":"$0.2\\,\\mathrm{H}$","v":"0.2","why":"鉄心が同じでも、巻数で変わる"},{"t":"$5.4\\,\\mathrm{H}$","v":"5.4","why":"3乗した。2乗に比例する"}],"ans":1}}],"past":[]}};
});
