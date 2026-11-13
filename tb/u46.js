/* 単元46「直流のつなぎ（3つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(46, function(H){
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
    else if (it.t === "cap") d.text(it.id, it.x, it.y, it.s, {o: o});   // 並べた図の見出し（図1・図2。kit の side(..., cap=…)。2026-11-12）
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
// ---- 46-1 合成から全体の電流、分流 の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S1K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u46s1xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s1xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s1xqj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",36,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  xx: {"vars":[["m","mg","r23"]],"items":[{"t":"z","id":"zbu46s1xx0hi","z":"hi","lines":[[[752,630],[478,630],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s1xx1lo","z":"lo","lines":[[[772,630],[1045,630],[1045,360],[995,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s1xx2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s1xx3lo","z":"lo","lines":[[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu46s1xx4mid","z":"mid","lines":[[[708,360],[821.5,360]]],"vis":[1],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s1xx5lo","z":"lo","lines":[[[881.5,360],[995,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"z","id":"zbu46s1xx6mid","z":"mid","lines":[[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s1xxL","pts":[[478,360],[478,630],[752,630]],"vis":[],"dash":0},{"t":"w","id":"u46s1xxRw","pts":[[772,630],[1045,630],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1xxw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1xxw2","pts":[[708,280],[708,440]],"vis":[-1],"dash":0},{"t":"w","id":"u46s1xxw3","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u46s1xxw4","pts":[[708,280],[821.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u46s1xxw5","pts":[[881.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u46s1xxw6","pts":[[708,440],[821.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u46s1xxw7","pts":[[881.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u46s1xxw8","pts":[[708,360],[821.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s1xxw9","pts":[[881.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s1xxw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1xxw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":630,"xm":772,"ym":630,"vis":[],"side":1,"loop":1,"lab":[762,678.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[-1],"lab":[851.5,245.6,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[-1],"lab":[851.5,405.6,null]},{"t":"d","id":"u46s1xxj113","x":708,"y":360,"vis":[-1]},{"t":"d","id":"u46s1xxj214","x":995,"y":360,"vis":[-1]},{"t":"r","k":"r23","x":851.5,"y":360,"dir":"h","vis":[1],"lab":[851.5,325.6,null]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":522,"yt":532,"ly":546.29,"vis":[],"y2m":[368,1]},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,490.5,null],"vis":[-1],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":570,"x1":461,"y1":530,"lab":[444.89,550,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[752,630],[478,630],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,630],[772,630]]}]},{"c":[1],"paths":[{"I":1,"pts":[[752,630],[478,630],[478,360],[1045,360],[1045,630],[772,630]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",36,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",6,[-1]],["R","r3","n1","N",12,[-1]],["R","r23","n1","N",1,[1]]]},
  lR: {"vars":[],"items":[{"t":"w","id":"u46s1lRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1lRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s1lRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s1lRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  lL: {"vars":[],"items":[{"t":"w","id":"u46s1lLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1lLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u46s1lLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s1lLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  col: {"vars":[],"items":[{"t":"w","id":"u46s1colL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw4","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw5","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw6","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw7","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw8","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw9","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw10","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1colw11","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r2","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,470,"start"]},{"t":"r","k":"r3","x":1045,"y":470,"dir":"v","vis":[],"lab":[1025.38,430,"end"]},{"t":"d","id":"u46s1colj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s1colj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445.38,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",1,[]],["E","src","n1","n4",1,[]],["R","r2","n2","n4",1,[]],["R","r3","n2","n4",1,[]]]},
  vR: {"vars":[],"items":[{"t":"w","id":"u46s1vRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"v","k":"v","x":851.5,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[851.5,175.96,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s1vRj114","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s1vRj215","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  vL: {"vars":[],"items":[{"t":"w","id":"u46s1vLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"v","k":"v","x":671.5,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[671.5,175.96,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u46s1vLj112","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s1vLj213","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  vc: {"vars":[],"items":[{"t":"w","id":"u46s1vcL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw4","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw5","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw6","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw7","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw8","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw9","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw10","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s1vcw11","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r2","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,470,"start"]},{"t":"v","k":"v","x":761.5,"y":470,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[676.5,470,"end"]},{"t":"r","k":"r3","x":1045,"y":470,"dir":"v","vis":[],"lab":[1025.38,430,"end"]},{"t":"d","id":"u46s1vcj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s1vcj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445.38,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]}],"base":110,"von":["src","v"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",1,[]],["E","src","n1","n4",1,[]],["R","r2","n2","n4",1,[]],["R","r3","n2","n4",1,[]]]}
};
function tbU46s1xq(d, p, L){ tbGen_Draw(d, p, L, U46S1K.xq); }
function tbU46s1xx(d, p, L){ tbGen_Draw(d, p, L, U46S1K.xx); }
function tbU46s1lR(d, p, L){ tbGen_Draw(d, p, L, U46S1K.lR); }
function tbU46s1lL(d, p, L){ tbGen_Draw(d, p, L, U46S1K.lL); }
function tbU46s1col(d, p, L){ tbGen_Draw(d, p, L, U46S1K.col); }
function tbU46s1vR(d, p, L){ tbGen_Draw(d, p, L, U46S1K.vR); }
function tbU46s1vL(d, p, L){ tbGen_Draw(d, p, L, U46S1K.vL); }
function tbU46s1vc(d, p, L){ tbGen_Draw(d, p, L, U46S1K.vc); }
// ---- 46-2 分流を2回 の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S2K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u46s2xqL","pts":[[478,360],[478,600],[752,600]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqRw","pts":[[772,600],[1045,600],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw1","pts":[[521.5,280],[521.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw2","pts":[[1001.5,280],[1001.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw3","pts":[[521.5,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw4","pts":[[791.5,280],[1001.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw5","pts":[[521.5,440],[593.17,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw6","pts":[[724.83,360],[724.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw7","pts":[[964.83,360],[964.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw8","pts":[[724.83,360],[814.83,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw9","pts":[[874.83,360],[964.83,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw10","pts":[[724.83,520],[814.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw11","pts":[[874.83,520],[964.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw12","pts":[[653.17,440],[724.83,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw13","pts":[[964.83,440],[1001.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw14","pts":[[478,360],[521.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2xqw15","pts":[[1001.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":600,"xm":772,"ym":600,"vis":[],"side":1,"loop":1,"lab":[770,638.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,250.34,null]},{"t":"r","k":"r2","x":623.17,"y":440,"dir":"h","vis":[],"lab":[623.17,410.34,null]},{"t":"r","k":"r3","x":844.83,"y":360,"dir":"h","vis":[],"lab":[844.83,330.34,null]},{"t":"r","k":"r4","x":844.83,"y":520,"dir":"h","vis":[],"lab":[844.83,490.34,null]},{"t":"d","id":"u46s2xqj118","x":724.83,"y":440,"vis":[]},{"t":"d","id":"u46s2xqj219","x":964.83,"y":440,"vis":[]},{"t":"d","id":"u46s2xqj122","x":521.5,"y":360,"vis":[]},{"t":"d","id":"u46s2xqj223","x":1001.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":540,"x1":461,"y1":500,"lab":[445.38,520,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,600],[478,600],[478,360],[521.5,360]]},{"I":0.4,"pts":[[521.5,360],[521.5,280],[1001.5,280],[1001.5,360]]},{"I":0.6,"pts":[[521.5,360],[521.5,440],[724.83,440]]},{"I":0.15,"pts":[[724.83,440],[724.83,360],[964.83,360],[964.83,440]]},{"I":0.45,"pts":[[724.83,440],[724.83,520],[964.83,520],[964.83,440]]},{"I":0.6,"pts":[[964.83,440],[1001.5,440],[1001.5,360]]},{"I":1,"pts":[[1001.5,360],[1045,360],[1045,600],[772,600]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","N",6,[]],["R","r2","P","n1",1,[]],["R","r3","n1","N",12,[]],["R","r4","n1","N",4,[]]]},
  xx: {"vars":[["m","mg","r34"]],"items":[{"t":"z","id":"zbu46s2xx0hi","z":"hi","lines":[[[752,630],[478,630],[478,360],[481.5,360]],[[731.5,280],[481.5,280],[481.5,440],[573.17,440]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s2xx1lo","z":"lo","lines":[[[772,630],[1045,630],[1045,360],[1041.5,360]],[[791.5,280],[1041.5,280],[1041.5,440],[1004.83,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s2xx2mid","z":"mid","lines":[[[834.83,360],[724.83,360],[724.83,520],[834.83,520]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s2xx3lo","z":"lo","lines":[[[894.83,360],[1004.83,360],[1004.83,520],[894.83,520]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu46s2xx4mid","z":"mid","lines":[[[724.83,440],[834.83,440]]],"vis":[1],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s2xx5lo","z":"lo","lines":[[[894.83,440],[1004.83,440]]],"vis":[1],"pts":[],"node":"N"},{"t":"z","id":"zbu46s2xx6mid","z":"mid","lines":[[[633.17,440],[724.83,440]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s2xxL","pts":[[478,360],[478,630],[752,630]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxRw","pts":[[772,630],[1045,630],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw1","pts":[[481.5,280],[481.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw2","pts":[[1041.5,280],[1041.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw3","pts":[[481.5,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw4","pts":[[791.5,280],[1041.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw5","pts":[[481.5,440],[573.17,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw6","pts":[[724.83,360],[724.83,520]],"vis":[-1],"dash":0},{"t":"w","id":"u46s2xxw7","pts":[[1004.83,360],[1004.83,520]],"vis":[-1],"dash":0},{"t":"w","id":"u46s2xxw8","pts":[[724.83,360],[834.83,360]],"vis":[-1],"dash":0},{"t":"w","id":"u46s2xxw9","pts":[[894.83,360],[1004.83,360]],"vis":[-1],"dash":0},{"t":"w","id":"u46s2xxw10","pts":[[724.83,520],[834.83,520]],"vis":[-1],"dash":0},{"t":"w","id":"u46s2xxw11","pts":[[894.83,520],[1004.83,520]],"vis":[-1],"dash":0},{"t":"w","id":"u46s2xxw12","pts":[[724.83,440],[834.83,440]],"vis":[1],"dash":0},{"t":"w","id":"u46s2xxw13","pts":[[894.83,440],[1004.83,440]],"vis":[1],"dash":0},{"t":"w","id":"u46s2xxw14","pts":[[633.17,440],[724.83,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw15","pts":[[1004.83,440],[1041.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw16","pts":[[478,360],[481.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2xxw17","pts":[[1041.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":630,"xm":772,"ym":630,"vis":[],"side":1,"loop":1,"lab":[770,672.61,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,245.24,null]},{"t":"r","k":"r2","x":603.17,"y":440,"dir":"h","vis":[],"lab":[603.17,405.24,null]},{"t":"r","k":"r3","x":864.83,"y":360,"dir":"h","vis":[-1],"lab":[864.83,325.24,null]},{"t":"r","k":"r4","x":864.83,"y":520,"dir":"h","vis":[-1],"lab":[864.83,485.24,null]},{"t":"d","id":"u46s2xxj118","x":724.83,"y":440,"vis":[-1]},{"t":"d","id":"u46s2xxj219","x":1004.83,"y":440,"vis":[-1]},{"t":"r","k":"r34","x":864.83,"y":440,"dir":"h","vis":[1],"lab":[864.83,405.24,null]},{"t":"d","id":"u46s2xxj125","x":481.5,"y":360,"vis":[]},{"t":"d","id":"u46s2xxj226","x":1041.5,"y":360,"vis":[]},{"t":"i","k":"i2","x0":525.67,"y0":457,"x1":565.67,"y1":457,"lab":[545.67,490.86,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i4","x0":787.33,"y0":537,"x1":827.33,"y1":537,"lab":[807.33,570.86,null],"vis":[-1],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":570,"x1":461,"y1":530,"lab":[444.85,550,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[752,630],[478,630],[478,360],[481.5,360]]},{"I":0.4,"pts":[[481.5,360],[481.5,280],[1041.5,280],[1041.5,360]]},{"I":0.6,"pts":[[481.5,360],[481.5,440],[724.83,440]]},{"I":0.15,"pts":[[724.83,440],[724.83,360],[1004.83,360],[1004.83,440]]},{"I":0.45,"pts":[[724.83,440],[724.83,520],[1004.83,520],[1004.83,440]]},{"I":0.6,"pts":[[1004.83,440],[1041.5,440],[1041.5,360]]},{"I":1,"pts":[[1041.5,360],[1045,360],[1045,630],[772,630]]}]},{"c":[1],"paths":[{"I":1,"pts":[[752,630],[478,630],[478,360],[481.5,360]]},{"I":0.25,"pts":[[481.5,360],[481.5,280],[1041.5,280],[1041.5,360]]},{"I":0.75,"pts":[[481.5,360],[481.5,440],[1041.5,440],[1041.5,360]]},{"I":1,"pts":[[1041.5,360],[1045,360],[1045,630],[772,630]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","N",6,[]],["R","r2","P","n1",1,[]],["R","r3","n1","N",12,[-1]],["R","r4","n1","N",4,[-1]],["R","r34","n1","N",1,[1]]]},
  aR: {"vars":[],"items":[{"t":"w","id":"u46s2aRL","pts":[[478,360],[478,600],[752,600]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRRw","pts":[[772,600],[1045,600],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw1","pts":[[521.5,280],[521.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw2","pts":[[1001.5,280],[1001.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw3","pts":[[521.5,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw4","pts":[[791.5,280],[1001.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw5","pts":[[521.5,440],[593.17,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw6","pts":[[724.83,360],[724.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw7","pts":[[964.83,360],[964.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw8","pts":[[724.83,360],[814.83,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw9","pts":[[874.83,360],[964.83,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw10","pts":[[724.83,520],[814.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw11","pts":[[874.83,520],[964.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw12","pts":[[653.17,440],[724.83,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw13","pts":[[964.83,440],[1001.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw14","pts":[[478,360],[521.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aRw15","pts":[[1001.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":600,"xm":772,"ym":600,"vis":[],"side":1,"loop":1,"lab":[770,638.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,250.34,null]},{"t":"r","k":"r2","x":623.17,"y":440,"dir":"h","vis":[],"lab":[623.17,410.34,null]},{"t":"r","k":"r3","x":844.83,"y":360,"dir":"h","vis":[],"lab":[844.83,330.34,null]},{"t":"r","k":"r4","x":844.83,"y":520,"dir":"h","vis":[],"lab":[844.83,490.34,null]},{"t":"d","id":"u46s2aRj118","x":724.83,"y":440,"vis":[]},{"t":"d","id":"u46s2aRj219","x":964.83,"y":440,"vis":[]},{"t":"d","id":"u46s2aRj122","x":521.5,"y":360,"vis":[]},{"t":"d","id":"u46s2aRj223","x":1001.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":540,"x1":461,"y1":500,"lab":[445.38,520,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,600],[478,600],[478,360],[521.5,360]]},{"I":0.6,"pts":[[521.5,360],[521.5,280],[1001.5,280],[1001.5,360]]},{"I":0.4,"pts":[[521.5,360],[521.5,440],[724.83,440]]},{"I":0.2,"pts":[[724.83,440],[724.83,360],[964.83,360],[964.83,440]]},{"I":0.2,"pts":[[724.83,440],[724.83,520],[964.83,520],[964.83,440]]},{"I":0.4,"pts":[[964.83,440],[1001.5,440],[1001.5,360]]},{"I":1,"pts":[[1001.5,360],[1045,360],[1045,600],[772,600]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","n1","N",1,[]],["R","r4","n1","N",1,[]]]},
  aL: {"vars":[],"items":[{"t":"w","id":"u46s2aLL","pts":[[478,360],[478,600],[752,600]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLRw","pts":[[772,600],[1045,600],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw1","pts":[[521.5,280],[521.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw2","pts":[[1001.5,280],[1001.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw3","pts":[[521.5,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw4","pts":[[791.5,280],[1001.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw5","pts":[[558.17,360],[558.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw6","pts":[[798.17,360],[798.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw7","pts":[[558.17,360],[648.17,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw8","pts":[[708.17,360],[798.17,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw9","pts":[[558.17,520],[648.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw10","pts":[[708.17,520],[798.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw11","pts":[[521.5,440],[558.17,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw12","pts":[[798.17,440],[869.83,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw13","pts":[[929.83,440],[1001.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw14","pts":[[478,360],[521.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2aLw15","pts":[[1001.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":600,"xm":772,"ym":600,"vis":[],"side":1,"loop":1,"lab":[770,638.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,250.34,null]},{"t":"r","k":"r3","x":678.17,"y":360,"dir":"h","vis":[],"lab":[678.17,330.34,null]},{"t":"r","k":"r4","x":678.17,"y":520,"dir":"h","vis":[],"lab":[678.17,490.34,null]},{"t":"d","id":"u46s2aLj116","x":558.17,"y":440,"vis":[]},{"t":"d","id":"u46s2aLj217","x":798.17,"y":440,"vis":[]},{"t":"r","k":"r2","x":899.83,"y":440,"dir":"h","vis":[],"lab":[899.83,410.34,null]},{"t":"d","id":"u46s2aLj122","x":521.5,"y":360,"vis":[]},{"t":"d","id":"u46s2aLj223","x":1001.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":540,"x1":461,"y1":500,"lab":[445.38,520,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,600],[478,600],[478,360],[521.5,360]]},{"I":0.6,"pts":[[521.5,360],[521.5,280],[1001.5,280],[1001.5,360]]},{"I":0.4,"pts":[[521.5,360],[521.5,440],[558.17,440]]},{"I":0.2,"pts":[[558.17,440],[558.17,360],[798.17,360],[798.17,440]]},{"I":0.2,"pts":[[558.17,440],[558.17,520],[798.17,520],[798.17,440]]},{"I":0.4,"pts":[[798.17,440],[1001.5,440],[1001.5,360]]},{"I":1,"pts":[[1001.5,360],[1045,360],[1045,600],[772,600]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r3","P","n1",1,[]],["R","r4","P","n1",1,[]],["R","r2","n1","N",1,[]]]},
  bR: {"vars":[],"items":[{"t":"w","id":"u46s2bRL","pts":[[478,360],[478,600],[752,600]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRRw","pts":[[772,600],[1045,600],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw1","pts":[[501.5,280],[501.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw2","pts":[[1021.5,280],[1021.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw3","pts":[[501.5,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw4","pts":[[791.5,280],[1021.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw5","pts":[[501.5,440],[593.17,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw6","pts":[[744.83,360],[744.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw7","pts":[[984.83,360],[984.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw8","pts":[[744.83,360],[834.83,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw9","pts":[[894.83,360],[984.83,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw10","pts":[[744.83,520],[834.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw11","pts":[[894.83,520],[984.83,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw12","pts":[[653.17,440],[744.83,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw13","pts":[[984.83,440],[1021.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw14","pts":[[478,360],[501.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bRw15","pts":[[1021.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":600,"xm":772,"ym":600,"vis":[],"side":1,"loop":1,"lab":[770,638.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,250.34,null]},{"t":"r","k":"r2","x":623.17,"y":440,"dir":"h","vis":[],"lab":[623.17,410.34,null]},{"t":"r","k":"r3","x":864.83,"y":360,"dir":"h","vis":[],"lab":[864.83,330.34,null]},{"t":"r","k":"r4","x":864.83,"y":520,"dir":"h","vis":[],"lab":[864.83,490.34,null]},{"t":"d","id":"u46s2bRj118","x":744.83,"y":440,"vis":[]},{"t":"d","id":"u46s2bRj219","x":984.83,"y":440,"vis":[]},{"t":"d","id":"u46s2bRj122","x":501.5,"y":360,"vis":[]},{"t":"d","id":"u46s2bRj223","x":1021.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":545.67,"y0":457,"x1":585.67,"y1":457,"lab":[565.67,485.76,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,600],[478,600],[478,360],[501.5,360]]},{"I":0.6,"pts":[[501.5,360],[501.5,280],[1021.5,280],[1021.5,360]]},{"I":0.4,"pts":[[501.5,360],[501.5,440],[744.83,440]]},{"I":0.2,"pts":[[744.83,440],[744.83,360],[984.83,360],[984.83,440]]},{"I":0.2,"pts":[[744.83,440],[744.83,520],[984.83,520],[984.83,440]]},{"I":0.4,"pts":[[984.83,440],[1021.5,440],[1021.5,360]]},{"I":1,"pts":[[1021.5,360],[1045,360],[1045,600],[772,600]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","n1","N",1,[]],["R","r4","n1","N",1,[]]]},
  bL: {"vars":[],"items":[{"t":"w","id":"u46s2bLL","pts":[[478,360],[478,600],[752,600]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLRw","pts":[[772,600],[1045,600],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw1","pts":[[501.5,280],[501.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw2","pts":[[1021.5,280],[1021.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw3","pts":[[501.5,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw4","pts":[[791.5,280],[1021.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw5","pts":[[538.17,360],[538.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw6","pts":[[778.17,360],[778.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw7","pts":[[538.17,360],[628.17,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw8","pts":[[688.17,360],[778.17,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw9","pts":[[538.17,520],[628.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw10","pts":[[688.17,520],[778.17,520]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw11","pts":[[501.5,440],[538.17,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw12","pts":[[778.17,440],[869.83,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw13","pts":[[929.83,440],[1021.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw14","pts":[[478,360],[501.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s2bLw15","pts":[[1021.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":600,"xm":772,"ym":600,"vis":[],"side":1,"loop":1,"lab":[770,638.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,250.34,null]},{"t":"r","k":"r3","x":658.17,"y":360,"dir":"h","vis":[],"lab":[658.17,330.34,null]},{"t":"r","k":"r4","x":658.17,"y":520,"dir":"h","vis":[],"lab":[658.17,490.34,null]},{"t":"d","id":"u46s2bLj116","x":538.17,"y":440,"vis":[]},{"t":"d","id":"u46s2bLj217","x":778.17,"y":440,"vis":[]},{"t":"r","k":"r2","x":899.83,"y":440,"dir":"h","vis":[],"lab":[899.83,410.34,null]},{"t":"d","id":"u46s2bLj122","x":501.5,"y":360,"vis":[]},{"t":"d","id":"u46s2bLj223","x":1021.5,"y":360,"vis":[]},{"t":"i","k":"i","x0":822.33,"y0":457,"x1":862.33,"y1":457,"lab":[850.33,485.76,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,600],[478,600],[478,360],[501.5,360]]},{"I":0.6,"pts":[[501.5,360],[501.5,280],[1021.5,280],[1021.5,360]]},{"I":0.4,"pts":[[501.5,360],[501.5,440],[538.17,440]]},{"I":0.2,"pts":[[538.17,440],[538.17,360],[778.17,360],[778.17,440]]},{"I":0.2,"pts":[[538.17,440],[538.17,520],[778.17,520],[778.17,440]]},{"I":0.4,"pts":[[778.17,440],[1021.5,440],[1021.5,360]]},{"I":1,"pts":[[1021.5,360],[1045,360],[1045,600],[772,600]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r3","P","n1",1,[]],["R","r4","P","n1",1,[]],["R","r2","n1","N",1,[]]]}
};
function tbU46s2xq(d, p, L){ tbGen_Draw(d, p, L, U46S2K.xq); }
function tbU46s2xx(d, p, L){ tbGen_Draw(d, p, L, U46S2K.xx); }
function tbU46s2aR(d, p, L){ tbGen_Draw(d, p, L, U46S2K.aR); }
function tbU46s2aL(d, p, L){ tbGen_Draw(d, p, L, U46S2K.aL); }
function tbU46s2bR(d, p, L){ tbGen_Draw(d, p, L, U46S2K.bR); }
function tbU46s2bL(d, p, L){ tbGen_Draw(d, p, L, U46S2K.bL); }
// ---- 46-3 はしごを奥から解く の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S3K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u46s3xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,309.66,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s3xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s3xqj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i2","x0":774,"y0":263,"x1":814,"y1":263,"lab":[794,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,485.76,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.6,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.4,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",17,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",4,[]],["R","r3","n1","N",6,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu46s3xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[552,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s3xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[1006,360]],[[876,272],[1006,272],[1006,448],[876,448]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s3xx2mid","z":"mid","lines":[[[816,272],[686,272],[686,448],[816,448]],[[612,360],[686,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s3xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw1","pts":[[478,360],[552,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw2","pts":[[686,272],[686,448]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw3","pts":[[1006,272],[1006,448]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw4","pts":[[686,272],[816,272]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw5","pts":[[876,272],[1006,272]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw6","pts":[[686,448],[816,448]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw7","pts":[[876,448],[1006,448]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw8","pts":[[612,360],[686,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3xxw9","pts":[[1006,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,602.5,null]},{"t":"r","k":"r1","x":582,"y":360,"dir":"h","vis":[],"lab":[582,325.37,null]},{"t":"r","k":"r2","x":846,"y":272,"dir":"h","vis":[],"lab":[922,237.37,null]},{"t":"r","k":"r3","x":846,"y":448,"dir":"h","vis":[],"lab":[846,413.37,null]},{"t":"v","k":"v","x":846,"y":448,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r3","lab":[846,339.5,null]},{"t":"d","id":"u46s3xxj114","x":686,"y":360,"vis":[]},{"t":"d","id":"u46s3xxj215","x":1006,"y":360,"vis":[]},{"t":"i","k":"i2","x0":768.5,"y0":255,"x1":808.5,"y1":255,"lab":[788.5,221.27,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":758.5,"y0":465,"x1":798.5,"y1":465,"lab":[778.5,498.73,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[686,360]]},{"I":0.6,"pts":[[686,360],[686,272],[1006,272],[1006,360]]},{"I":0.4,"pts":[[686,360],[686,448],[1006,448],[1006,360]]},{"I":1,"pts":[[1006,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v"],"bands":"volt","pts":[],"net":[["E","src","P","N",17,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",4,[]],["R","r3","n1","N",6,[]]]},
  lR: {"vars":[],"items":[{"t":"w","id":"u46s3lRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3lRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,309.66,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s3lRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s3lRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i2","x0":774,"y0":263,"x1":814,"y1":263,"lab":[794,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,485.76,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  lL: {"vars":[],"items":[{"t":"w","id":"u46s3lLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u46s3lLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,309.66,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u46s3lLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s3lLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i2","x0":594,"y0":263,"x1":634,"y1":263,"lab":[614,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":594,"y0":457,"x1":634,"y1":457,"lab":[614,485.76,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]}
};
function tbU46s3xq(d, p, L){ tbGen_Draw(d, p, L, U46S3K.xq); }
function tbU46s3xx(d, p, L){ tbGen_Draw(d, p, L, U46S3K.xx); }
function tbU46s3lR(d, p, L){ tbGen_Draw(d, p, L, U46S3K.lR); }
function tbU46s3lL(d, p, L){ tbGen_Draw(d, p, L, U46S3K.lL); }
// ---- 46-4 電圧と電流から逆に解く の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S4K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u46s4xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"rx","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s4xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s4xqj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",48,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",24,[]],["R","rx","n1","N",12,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu46s4xx0hi","z":"hi","lines":[[[752,590],[478,590],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s4xx1lo","z":"lo","lines":[[[772,590],[1045,590],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s4xx2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s4xxL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4xxw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[762,638.5,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.37,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.37,null]},{"t":"r","k":"rx","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,405.37,null]},{"t":"d","id":"u46s4xxj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s4xxj214","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":512.5,"vis":[]},{"t":"i","k":"i","x0":461,"y0":530,"x1":461,"y1":490,"lab":[444.87,510,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",48,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",24,[]],["R","rx","n1","N",12,[]]]},
  aR: {"vars":[],"items":[{"t":"w","id":"u46s4aRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4aRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"rx","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s4aRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s4aRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","rx","n1","N",1,[]]]},
  aL: {"vars":[],"items":[{"t":"w","id":"u46s4aLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4aLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"rx","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u46s4aLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s4aLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","rx","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  bR: {"vars":[],"items":[{"t":"w","id":"u46s4bRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4bRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"rx","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u46s4bRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s4bRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","rx","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  bL: {"vars":[],"items":[{"t":"w","id":"u46s4bLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4bLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u46s4bLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s4bLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"rx","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","rx","n1","N",1,[]]]},
  sp: {"vars":[],"items":[{"t":"w","id":"u46s4spL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s4spRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4spw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1L","pts":[[1297,360],[1550.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1w2","pts":[[1610.5,360],[1864,360]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1w3","pts":[[1297,580],[1864,580]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1w4","pts":[[1297,360],[1297,458]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1w5","pts":[[1297,482],[1297,580]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1w6","pts":[[1864,360],[1864,440]],"vis":[],"dash":0},{"t":"w","id":"u46s4spx1w7","pts":[[1864,500],[1864,580]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,630.59,null]},{"t":"r","k":"ra","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,220.73,null]},{"t":"r","k":"rb","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,380.73,null]},{"t":"d","id":"u46s4spj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s4spj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i2","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s4spcap0","x":679.5,"y":759.25,"s":"並列","vis":[]},{"t":"r","k":"ra","x":1580.5,"y":360,"dir":"h","vis":[],"lab":[1580.5,300.73,null],"n":"rax1"},{"t":"e","k":"src","dir":"v","xp":1297,"yp":458,"xm":1297,"ym":482,"vis":[],"side":-1,"lab":[1337.68,470,"start"],"n":"srcx1"},{"t":"r","k":"rb","x":1864,"y":470,"dir":"v","vis":[],"lab":[1886.68,470,"start"],"n":"rbx1"},{"t":"i","k":"i1","x0":1280,"y0":446.5,"x1":1280,"y1":406.5,"lab":[1264,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i1x1"},{"t":"cap","id":"u46s4spcap1","x":1526,"y":759.25,"s":"直列","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.5,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[],"paths":[{"I":1,"pts":[[1297,458],[1297,360],[1864,360],[1864,580],[1297,580],[1297,482]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","ra","L0:P","L0:N",1,[]],["R","rb","L0:P","L0:N",1,[]],["R","ra","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n3",1,[]],["R","rb","L1:n2","L1:n3",1,[]]]}
};
function tbU46s4xq(d, p, L){ tbGen_Draw(d, p, L, U46S4K.xq); }
function tbU46s4xx(d, p, L){ tbGen_Draw(d, p, L, U46S4K.xx); }
function tbU46s4aR(d, p, L){ tbGen_Draw(d, p, L, U46S4K.aR); }
function tbU46s4aL(d, p, L){ tbGen_Draw(d, p, L, U46S4K.aL); }
function tbU46s4bR(d, p, L){ tbGen_Draw(d, p, L, U46S4K.bR); }
function tbU46s4bL(d, p, L){ tbGen_Draw(d, p, L, U46S4K.bL); }
function tbU46s4sp(d, p, L){ tbFig_Draw(d, p, L, U46S4K.sp); }
// ---- 46-5 電圧の引き算から電流の和 の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S5K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u46s5xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw1","pts":[[478,360],[583,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw2","pts":[[748,280],[748,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw4","pts":[[748,280],[841.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw5","pts":[[901.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw6","pts":[[748,440],[841.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw7","pts":[[901.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw8","pts":[[643,360],[748,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":613,"y":360,"dir":"h","vis":[],"lab":[613,330.34,null]},{"t":"v","k":"v1","x":613,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[613,255.96,null]},{"t":"r","k":"r2","x":871.5,"y":280,"dir":"h","vis":[],"lab":[871.5,250.34,null]},{"t":"r","k":"r3","x":871.5,"y":440,"dir":"h","vis":[],"lab":[871.5,410.34,null]},{"t":"d","id":"u46s5xqj114","x":748,"y":360,"vis":[]},{"t":"d","id":"u46s5xqj215","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[748,360]]},{"I":0.8,"pts":[[748,360],[748,280],[995,280],[995,360]]},{"I":0.2,"pts":[[748,360],[748,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1"],"bands":"never","pts":[],"net":[["E","src","P","N",30,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",5,[]],["R","r3","n1","N",20,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu46s5xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[545.33,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s5xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[1032.67,360]],[[941,280],[1032.67,280],[1032.67,440],[882.67,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s5xx2mid","z":"mid","lines":[[[881,280],[672.67,280],[672.67,440],[822.67,440]],[[605.33,360],[672.67,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s5xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw1","pts":[[478,360],[545.33,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw2","pts":[[672.67,280],[672.67,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw3","pts":[[1032.67,280],[1032.67,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw4","pts":[[672.67,280],[749.33,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw5","pts":[[749.33,280],[881,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw6","pts":[[941,280],[1032.67,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw7","pts":[[672.67,440],[822.67,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw8","pts":[[882.67,440],[1032.67,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw9","pts":[[605.33,360],[672.67,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5xxw10","pts":[[1032.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.68,null]},{"t":"r","k":"r1","x":575.33,"y":360,"dir":"h","vis":[],"lab":[575.33,325.17,null]},{"t":"v","k":"v1","x":575.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[575.33,251.32,null]},{"t":"r","k":"r2","x":911,"y":280,"dir":"h","vis":[],"lab":[911,245.17,null]},{"t":"v","k":"v","x":911,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[911,171.32,null]},{"t":"r","k":"r3","x":852.67,"y":440,"dir":"h","vis":[],"lab":[852.67,405.17,null]},{"t":"d","id":"u46s5xxj116","x":672.67,"y":360,"vis":[]},{"t":"d","id":"u46s5xxj217","x":1032.67,"y":360,"vis":[]},{"t":"i","k":"i2","x0":729.33,"y0":263,"x1":769.33,"y1":263,"lab":[749.33,229.07,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":775.17,"y0":457,"x1":815.17,"y1":457,"lab":[795.17,490.93,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i1","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.84,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[672.67,360]]},{"I":0.8,"pts":[[672.67,360],[672.67,280],[1032.67,280],[1032.67,360]]},{"I":0.2,"pts":[[672.67,360],[672.67,440],[1032.67,440],[1032.67,360]]},{"I":1,"pts":[[1032.67,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v","v1"],"bands":"volt","pts":[],"net":[["E","src","P","N",30,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",5,[]],["R","r3","n1","N",20,[]]]},
  lR: {"vars":[],"items":[{"t":"w","id":"u46s5lRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw1","pts":[[478,360],[583,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw2","pts":[[748,280],[748,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw4","pts":[[748,280],[841.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw5","pts":[[901.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw6","pts":[[748,440],[841.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw7","pts":[[901.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw8","pts":[[643,360],[748,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5lRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":613,"y":360,"dir":"h","vis":[],"lab":[613,330.34,null]},{"t":"v","k":"v1","x":613,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[613,255.96,null]},{"t":"r","k":"r2","x":871.5,"y":280,"dir":"h","vis":[],"lab":[871.5,250.34,null]},{"t":"r","k":"r3","x":871.5,"y":440,"dir":"h","vis":[],"lab":[871.5,410.34,null]},{"t":"d","id":"u46s5lRj114","x":748,"y":360,"vis":[]},{"t":"d","id":"u46s5lRj215","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[748,360]]},{"I":0.5,"pts":[[748,360],[748,280],[995,280],[995,360]]},{"I":0.5,"pts":[[748,360],[748,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  lL: {"vars":[],"items":[{"t":"w","id":"u46s5lLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw2","pts":[[775,280],[775,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw3","pts":[[528,280],[621.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw4","pts":[[681.5,280],[775,280]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw5","pts":[[528,440],[621.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw6","pts":[[681.5,440],[775,440]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw8","pts":[[775,360],[880,360]],"vis":[],"dash":0},{"t":"w","id":"u46s5lLw9","pts":[[940,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":651.5,"y":280,"dir":"h","vis":[],"lab":[651.5,250.34,null]},{"t":"r","k":"r3","x":651.5,"y":440,"dir":"h","vis":[],"lab":[651.5,410.34,null]},{"t":"d","id":"u46s5lLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s5lLj212","x":775,"y":360,"vis":[]},{"t":"r","k":"r1","x":910,"y":360,"dir":"h","vis":[],"lab":[910,330.34,null]},{"t":"v","k":"v1","x":910,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[910,255.96,null]},{"t":"i","k":"i1","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[775,280],[775,360]]},{"I":0.5,"pts":[[528,360],[528,440],[775,440],[775,360]]},{"I":1,"pts":[[775,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]}
};
function tbU46s5xq(d, p, L){ tbGen_Draw(d, p, L, U46S5K.xq); }
function tbU46s5xx(d, p, L){ tbGen_Draw(d, p, L, U46S5K.xx); }
function tbU46s5lR(d, p, L){ tbGen_Draw(d, p, L, U46S5K.lR); }
function tbU46s5lL(d, p, L){ tbGen_Draw(d, p, L, U46S5K.lL); }
// ---- 46-6 重ね合わせで分流する の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S6K = {
  all: {"vars":[],"items":[{"t":"w","id":"u46s6allL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6allw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,330.34,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,510,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1007.38,470,"end"]},{"t":"d","id":"u46s6allj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6allj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.88,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":1,"pts":[[761.5,580],[1045,580],[1045,482]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":2,"pts":[[761.5,360],[761.5,580]]},{"I":1,"pts":[[1045,458],[1045,360],[761.5,360]]}]}],"base":110,"von":["e1","e2"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",1,[]],["R","r2","n2","n3",1,[]],["E","e1","n1","n4",1,[]],["R","r3","n2","n4",1,[]],["E","e2","n3","n4",1,[]]]},
  rev: {"vars":[],"items":[{"t":"w","id":"u46s6revL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6revw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,330.34,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,510,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":482,"xm":1045,"ym":458,"vis":[],"side":1,"lab":[1007.38,470,"end"]},{"t":"d","id":"u46s6revj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6revj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.88,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,458]]},{"I":1,"pts":[[1045,482],[1045,580],[478,580],[478,482]]}]}],"base":110,"von":["e1","e2"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",1,[]],["R","r2","n2","n3",1,[]],["E","e1","n1","n4",1,[]],["R","r3","n2","n4",1,[]],["E","e2","n4","n3",1,[]]]},
  lr: {"vars":[],"items":[{"t":"w","id":"u46s6lrL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r2","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"r","k":"r1","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,330.34,null]},{"t":"e","k":"e2","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,510,"start"]},{"t":"e","k":"e1","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1007.38,470,"end"]},{"t":"d","id":"u46s6lrj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6lrj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.88,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":1,"pts":[[761.5,580],[1045,580],[1045,482]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":2,"pts":[[761.5,360],[761.5,580]]},{"I":1,"pts":[[1045,458],[1045,360],[761.5,360]]}]}],"base":110,"von":["e1","e2"],"bands":"never","pts":[],"net":[["R","r2","n1","n2",1,[]],["R","r1","n2","n3",1,[]],["E","e2","n1","n4",1,[]],["R","r3","n2","n4",1,[]],["E","e1","n3","n4",1,[]]]},
  lrr: {"vars":[],"items":[{"t":"w","id":"u46s6lrrL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6lrrw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r2","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"r","k":"r1","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,330.34,null]},{"t":"e","k":"e2","dir":"v","xp":478,"yp":482,"xm":478,"ym":458,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,510,"start"]},{"t":"e","k":"e1","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1007.38,470,"end"]},{"t":"d","id":"u46s6lrrj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6lrrj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.88,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,482],[478,580],[1045,580],[1045,482]]},{"I":1,"pts":[[1045,458],[1045,360],[478,360],[478,458]]}]}],"base":110,"von":["e1","e2"],"bands":"never","pts":[],"net":[["R","r2","n1","n2",1,[]],["R","r1","n2","n3",1,[]],["E","e2","n4","n1",1,[]],["R","r3","n2","n4",1,[]],["E","e1","n3","n4",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu46s6ae0hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s6ae1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[],"pts":[],"node":"n2"},{"t":"z","id":"zbu46s6ae2lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu46s6ae3mid","z":"mid","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[],"pts":[],"node":"n3"},{"t":"w","id":"u46s6aeL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6aew12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,328.17,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,328.17,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.84,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.34,510,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1007.16,470,"end"]},{"t":"d","id":"u46s6aej6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6aej9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.66,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[761.5,360],[761.5,580],[478,580],[478,482]]}]}],"base":110,"von":["e1","e2"],"bands":"volt","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["E","e1","n1","n4",12,[]],["R","r3","n2","n4",2,[]],["E","e2","n3","n4",6,[]]]},
  s1e: {"vars":[],"items":[{"t":"z","id":"zbu46s6s1e0hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s6s1e1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[],"pts":[],"node":"n2"},{"t":"z","id":"zbu46s6s1e2lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[933.25,360],[1045,360],[1045,580],[761.5,580]],[[761.5,500],[761.5,580]]],"vis":[],"pts":[],"node":"n3"},{"t":"w","id":"u46s6s1eL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew11","pts":[[1045,360],[1045,470]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1ew12","pts":[[1045,470],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,325.26,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,325.26,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.15,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.65,470,"start"]},{"t":"d","id":"u46s6s1ej6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6s1ej9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"ia","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.85,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"i","k":"i3a","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.35,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]}],"base":110,"von":["e1"],"bands":"volt","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["E","e1","n1","n3",12,[]],["R","r3","n2","n3",2,[]]]},
  s2e: {"vars":[],"items":[{"t":"z","id":"zbu46s6s2e0lo","z":"lo","lines":[[[589.75,360],[478,360],[478,580],[761.5,580]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s6s2e1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[],"pts":[],"node":"n2"},{"t":"z","id":"zbu46s6s2e2hi","z":"hi","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[],"pts":[],"node":"n3"},{"t":"w","id":"u46s6s2eL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew7","pts":[[478,360],[478,470]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew8","pts":[[478,470],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2ew12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,324.91,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,324.91,null]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[741.32,470,"end"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1006.82,470,"end"]},{"t":"d","id":"u46s6s2ej5","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6s2ej8","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3b","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.32,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"i","k":"ib","x0":1062,"y0":446.5,"x1":1062,"y1":406.5,"lab":[1078.18,426.5,"start"],"vis":[],"ax":"v","sd":1,"io":1}],"flows":[{"c":[],"paths":[{"I":0.5,"pts":[[761.5,360],[478,360],[478,580],[761.5,580]]},{"I":1,"pts":[[761.5,580],[1045,580],[1045,482]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]},{"I":1,"pts":[[1045,458],[1045,360],[761.5,360]]}]}],"base":110,"von":["e2"],"bands":"volt","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["R","r3","n2","n1",2,[]],["E","e2","n3","n1",6,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu46s6ax0hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s6ax1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[],"pts":[],"node":"n2"},{"t":"z","id":"zbu46s6ax2lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu46s6ax3mid","z":"mid","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[],"pts":[],"node":"n3"},{"t":"w","id":"u46s6axL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6axw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,328.17,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,328.17,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.84,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.34,510,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1007.16,470,"end"]},{"t":"d","id":"u46s6axj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6axj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.66,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[761.5,360],[761.5,580],[478,580],[478,482]]}]}],"base":110,"von":["e1","e2"],"bands":"volt","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["E","e1","n1","n4",12,[]],["R","r3","n2","n4",2,[]],["E","e2","n3","n4",6,[]]]},
  s1x: {"vars":[],"items":[{"t":"z","id":"zbu46s6s1x0hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s6s1x1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[],"pts":[],"node":"n2"},{"t":"z","id":"zbu46s6s1x2lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[933.25,360],[1045,360],[1045,580],[761.5,580]],[[761.5,500],[761.5,580]]],"vis":[],"pts":[],"node":"n3"},{"t":"w","id":"u46s6s1xL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw11","pts":[[1045,360],[1045,470]],"vis":[],"dash":0},{"t":"w","id":"u46s6s1xw12","pts":[[1045,470],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,325.26,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,325.26,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.15,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.65,470,"start"]},{"t":"d","id":"u46s6s1xj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6s1xj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"ia","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.85,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"i","k":"i3a","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.35,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]}],"base":110,"von":["e1"],"bands":"volt","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["E","e1","n1","n3",12,[]],["R","r3","n2","n3",2,[]]]},
  s2x: {"vars":[],"items":[{"t":"z","id":"zbu46s6s2x0lo","z":"lo","lines":[[[589.75,360],[478,360],[478,580],[761.5,580]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s6s2x1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[],"pts":[],"node":"n2"},{"t":"z","id":"zbu46s6s2x2hi","z":"hi","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[],"pts":[],"node":"n3"},{"t":"w","id":"u46s6s2xL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw7","pts":[[478,360],[478,470]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw8","pts":[[478,470],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6s2xw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,324.91,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,324.91,null]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[741.32,470,"end"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1006.82,470,"end"]},{"t":"d","id":"u46s6s2xj5","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6s2xj8","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3b","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.32,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"i","k":"ib","x0":1062,"y0":446.5,"x1":1062,"y1":406.5,"lab":[1078.18,426.5,"start"],"vis":[],"ax":"v","sd":1,"io":1}],"flows":[{"c":[],"paths":[{"I":0.5,"pts":[[761.5,360],[478,360],[478,580],[761.5,580]]},{"I":1,"pts":[[761.5,580],[1045,580],[1045,482]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]},{"I":1,"pts":[[1045,458],[1045,360],[761.5,360]]}]}],"base":110,"von":["e2"],"bands":"volt","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["R","r3","n2","n1",2,[]],["E","e2","n3","n1",6,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u46s6qL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw4","pts":[[761.5,360],[873.25,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw5","pts":[[933.25,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw6","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw7","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw8","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw9","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw10","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw11","pts":[[1045,360],[1045,458]],"vis":[],"dash":0},{"t":"w","id":"u46s6qw12","pts":[[1045,482],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[],"lab":[903.25,330.34,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,510,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[],"side":1,"lab":[1007.38,470,"end"]},{"t":"d","id":"u46s6qj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s6qj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.88,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[761.5,360],[761.5,580],[478,580],[478,482]]}]}],"base":110,"von":["e1","e2"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",2,[]],["R","r2","n2","n3",2,[]],["E","e1","n1","n4",12,[]],["R","r3","n2","n4",2,[]],["E","e2","n3","n4",6,[]]]},
  esw: {"vars":[["a","t",0],["a","t",1],["a","t",2]],"items":[{"t":"z","id":"zbu46s6esw0hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[1],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s6esw1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[1],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu46s6esw2lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[1],"pts":[],"node":"L0:n4"},{"t":"z","id":"zbu46s6esw3mid","z":"mid","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[1],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu46s6eswx10hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[2],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu46s6eswx11mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[2],"pts":[],"node":"L1:n2"},{"t":"z","id":"zbu46s6eswx12lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[933.25,360],[1045,360],[1045,580],[761.5,580]],[[761.5,500],[761.5,580]]],"vis":[2],"pts":[],"node":"L1:n3"},{"t":"z","id":"zbu46s6eswx20lo","z":"lo","lines":[[[589.75,360],[478,360],[478,580],[761.5,580]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[3],"pts":[],"node":"L2:n1"},{"t":"z","id":"zbu46s6eswx21mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[3],"pts":[],"node":"L2:n2"},{"t":"z","id":"zbu46s6eswx22hi","z":"hi","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[3],"pts":[],"node":"L2:n3"},{"t":"w","id":"u46s6eswL","pts":[[478,360],[589.75,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww2","pts":[[649.75,360],[761.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww3","pts":[[478,580],[761.5,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww4","pts":[[761.5,360],[873.25,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww5","pts":[[933.25,360],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww6","pts":[[761.5,580],[1045,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww7","pts":[[478,360],[478,458]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww8","pts":[[478,482],[478,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww9","pts":[[761.5,360],[761.5,440]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww10","pts":[[761.5,500],[761.5,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww11","pts":[[1045,360],[1045,458]],"vis":[1],"dash":0},{"t":"w","id":"u46s6esww12","pts":[[1045,482],[1045,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6eswx1L","pts":[[478,360],[589.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w2","pts":[[649.75,360],[761.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w3","pts":[[478,580],[761.5,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w4","pts":[[761.5,360],[873.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w5","pts":[[933.25,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w6","pts":[[761.5,580],[1045,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w7","pts":[[478,360],[478,458]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w8","pts":[[478,482],[478,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w9","pts":[[761.5,360],[761.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w10","pts":[[761.5,500],[761.5,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w11","pts":[[1045,360],[1045,470]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx1w12","pts":[[1045,470],[1045,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6eswx2L","pts":[[478,360],[589.75,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w2","pts":[[649.75,360],[761.5,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w3","pts":[[478,580],[761.5,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w4","pts":[[761.5,360],[873.25,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w5","pts":[[933.25,360],[1045,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w6","pts":[[761.5,580],[1045,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w7","pts":[[478,360],[478,470]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w8","pts":[[478,470],[478,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w9","pts":[[761.5,360],[761.5,440]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w10","pts":[[761.5,500],[761.5,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w11","pts":[[1045,360],[1045,458]],"vis":[3],"dash":0},{"t":"w","id":"u46s6eswx2w12","pts":[[1045,482],[1045,580]],"vis":[3],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[1],"lab":[619.75,318.11,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[1],"lab":[903.25,318.11,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[1],"side":-1,"lab":[516.89,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[1],"lab":[782.39,526,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[1],"side":1,"lab":[1006.11,470,"end"]},{"t":"d","id":"u46s6eswj6","x":761.5,"y":360,"vis":[1]},{"t":"d","id":"u46s6eswj9","x":761.5,"y":580,"vis":[1]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[727.61,417.5,"end"],"vis":[1],"ax":"v","sd":-1,"io":1},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[2],"lab":[619.75,318.11,null],"n":"r1x1"},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[2],"lab":[903.25,318.11,null],"n":"r2x1"},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[2],"side":-1,"lab":[516.89,470,"start"],"n":"e1x1"},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[2],"lab":[782.39,470,"start"],"n":"r3x1"},{"t":"d","id":"u46s6eswx1j6","x":761.5,"y":360,"vis":[2]},{"t":"d","id":"u46s6eswx1j9","x":761.5,"y":580,"vis":[2]},{"t":"i","k":"ia","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.11,426.5,"end"],"vis":[2],"ax":"v","sd":-1,"io":1,"n":"iax1"},{"t":"i","k":"i3a","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[727.61,417.5,"end"],"vis":[2],"ax":"v","sd":-1,"io":1,"n":"i3ax1"},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[3],"lab":[619.75,318.11,null],"n":"r1x2"},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[3],"lab":[903.25,318.11,null],"n":"r2x2"},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[3],"lab":[734.61,470,"end"],"n":"r3x2"},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[3],"side":1,"lab":[1006.11,470,"end"],"n":"e2x2"},{"t":"d","id":"u46s6eswx2j5","x":761.5,"y":360,"vis":[3]},{"t":"d","id":"u46s6eswx2j8","x":761.5,"y":580,"vis":[3]},{"t":"i","k":"i3b","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[727.61,417.5,"end"],"vis":[3],"ax":"v","sd":-1,"io":1,"n":"i3bx2"},{"t":"i","k":"ib","x0":1062,"y0":446.5,"x1":1062,"y1":406.5,"lab":[1078.89,426.5,"start"],"vis":[3],"ax":"v","sd":1,"io":1,"n":"ibx2"}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[478,458],[478,360],[761.5,360],[761.5,580],[478,580],[478,482]]}]},{"c":[2],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]},{"c":[3],"paths":[{"I":0.5,"pts":[[761.5,360],[478,360],[478,580],[761.5,580]]},{"I":1,"pts":[[761.5,580],[1045,580],[1045,482]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]},{"I":1,"pts":[[1045,458],[1045,360],[761.5,360]]}]}],"base":110,"von":["e1","e2"],"bands":"volt","pts":[],"net":[["R","r1","L0:n1","L0:n2",2,[1]],["R","r2","L0:n2","L0:n3",2,[1]],["E","e1","L0:n1","L0:n4",12,[1]],["R","r3","L0:n2","L0:n4",2,[1]],["E","e2","L0:n3","L0:n4",6,[1]],["R","r1","L1:n1","L1:n2",2,[2]],["R","r2","L1:n2","L1:n3",2,[2]],["E","e1","L1:n1","L1:n3",12,[2]],["R","r3","L1:n2","L1:n3",2,[2]],["R","r1","L2:n1","L2:n2",2,[3]],["R","r2","L2:n2","L2:n3",2,[3]],["R","r3","L2:n2","L2:n1",2,[3]],["E","e2","L2:n3","L2:n1",6,[3]]]},
  xsw: {"vars":[["a","t",0],["a","t",1],["a","t",2]],"items":[{"t":"z","id":"zbu46s6xsw0hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[1],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s6xsw1mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[1],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu46s6xsw2lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[1],"pts":[],"node":"L0:n4"},{"t":"z","id":"zbu46s6xsw3mid","z":"mid","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[1],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu46s6xswx10hi","z":"hi","lines":[[[589.75,360],[478,360],[478,458]]],"vis":[2],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu46s6xswx11mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[2],"pts":[],"node":"L1:n2"},{"t":"z","id":"zbu46s6xswx12lo","z":"lo","lines":[[[761.5,580],[478,580],[478,482]],[[933.25,360],[1045,360],[1045,580],[761.5,580]],[[761.5,500],[761.5,580]]],"vis":[2],"pts":[],"node":"L1:n3"},{"t":"z","id":"zbu46s6xswx20lo","z":"lo","lines":[[[589.75,360],[478,360],[478,580],[761.5,580]],[[761.5,580],[1045,580],[1045,482]],[[761.5,500],[761.5,580]]],"vis":[3],"pts":[],"node":"L2:n1"},{"t":"z","id":"zbu46s6xswx21mid","z":"mid","lines":[[[649.75,360],[761.5,360]],[[761.5,360],[873.25,360]],[[761.5,360],[761.5,440]]],"vis":[3],"pts":[],"node":"L2:n2"},{"t":"z","id":"zbu46s6xswx22hi","z":"hi","lines":[[[933.25,360],[1045,360],[1045,458]]],"vis":[3],"pts":[],"node":"L2:n3"},{"t":"w","id":"u46s6xswL","pts":[[478,360],[589.75,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww2","pts":[[649.75,360],[761.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww3","pts":[[478,580],[761.5,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww4","pts":[[761.5,360],[873.25,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww5","pts":[[933.25,360],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww6","pts":[[761.5,580],[1045,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww7","pts":[[478,360],[478,458]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww8","pts":[[478,482],[478,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww9","pts":[[761.5,360],[761.5,440]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww10","pts":[[761.5,500],[761.5,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww11","pts":[[1045,360],[1045,458]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xsww12","pts":[[1045,482],[1045,580]],"vis":[1],"dash":0},{"t":"w","id":"u46s6xswx1L","pts":[[478,360],[589.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w2","pts":[[649.75,360],[761.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w3","pts":[[478,580],[761.5,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w4","pts":[[761.5,360],[873.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w5","pts":[[933.25,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w6","pts":[[761.5,580],[1045,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w7","pts":[[478,360],[478,458]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w8","pts":[[478,482],[478,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w9","pts":[[761.5,360],[761.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w10","pts":[[761.5,500],[761.5,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w11","pts":[[1045,360],[1045,470]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx1w12","pts":[[1045,470],[1045,580]],"vis":[2],"dash":0},{"t":"w","id":"u46s6xswx2L","pts":[[478,360],[589.75,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w2","pts":[[649.75,360],[761.5,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w3","pts":[[478,580],[761.5,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w4","pts":[[761.5,360],[873.25,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w5","pts":[[933.25,360],[1045,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w6","pts":[[761.5,580],[1045,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w7","pts":[[478,360],[478,470]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w8","pts":[[478,470],[478,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w9","pts":[[761.5,360],[761.5,440]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w10","pts":[[761.5,500],[761.5,580]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w11","pts":[[1045,360],[1045,458]],"vis":[3],"dash":0},{"t":"w","id":"u46s6xswx2w12","pts":[[1045,482],[1045,580]],"vis":[3],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[1],"lab":[619.75,318.11,null]},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[1],"lab":[903.25,318.11,null]},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[1],"side":-1,"lab":[516.89,470,"start"]},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[1],"lab":[782.39,526,"start"]},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[1],"side":1,"lab":[1006.11,470,"end"]},{"t":"d","id":"u46s6xswj6","x":761.5,"y":360,"vis":[1]},{"t":"d","id":"u46s6xswj9","x":761.5,"y":580,"vis":[1]},{"t":"i","k":"i3","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[727.61,417.5,"end"],"vis":[1],"ax":"v","sd":-1,"io":1},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[2],"lab":[619.75,318.11,null],"n":"r1x1"},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[2],"lab":[903.25,318.11,null],"n":"r2x1"},{"t":"e","k":"e1","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[2],"side":-1,"lab":[516.89,470,"start"],"n":"e1x1"},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[2],"lab":[782.39,470,"start"],"n":"r3x1"},{"t":"d","id":"u46s6xswx1j6","x":761.5,"y":360,"vis":[2]},{"t":"d","id":"u46s6xswx1j9","x":761.5,"y":580,"vis":[2]},{"t":"i","k":"ia","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.11,426.5,"end"],"vis":[2],"ax":"v","sd":-1,"io":1,"n":"iax1"},{"t":"i","k":"i3a","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[727.61,417.5,"end"],"vis":[2],"ax":"v","sd":-1,"io":1,"n":"i3ax1"},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[3],"lab":[619.75,318.11,null],"n":"r1x2"},{"t":"r","k":"r2","x":903.25,"y":360,"dir":"h","vis":[3],"lab":[903.25,318.11,null],"n":"r2x2"},{"t":"r","k":"r3","x":761.5,"y":470,"dir":"v","vis":[3],"lab":[734.61,470,"end"],"n":"r3x2"},{"t":"e","k":"e2","dir":"v","xp":1045,"yp":458,"xm":1045,"ym":482,"vis":[3],"side":1,"lab":[1006.11,470,"end"],"n":"e2x2"},{"t":"d","id":"u46s6xswx2j5","x":761.5,"y":360,"vis":[3]},{"t":"d","id":"u46s6xswx2j8","x":761.5,"y":580,"vis":[3]},{"t":"i","k":"i3b","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[727.61,417.5,"end"],"vis":[3],"ax":"v","sd":-1,"io":1,"n":"i3bx2"},{"t":"i","k":"ib","x0":1062,"y0":446.5,"x1":1062,"y1":406.5,"lab":[1078.89,426.5,"start"],"vis":[3],"ax":"v","sd":1,"io":1,"n":"ibx2"}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[478,458],[478,360],[761.5,360],[761.5,580],[478,580],[478,482]]}]},{"c":[2],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]},{"c":[3],"paths":[{"I":0.5,"pts":[[761.5,360],[478,360],[478,580],[761.5,580]]},{"I":1,"pts":[[761.5,580],[1045,580],[1045,482]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]},{"I":1,"pts":[[1045,458],[1045,360],[761.5,360]]}]}],"base":110,"von":["e1","e2"],"bands":"volt","pts":[],"net":[["R","r1","L0:n1","L0:n2",2,[1]],["R","r2","L0:n2","L0:n3",2,[1]],["E","e1","L0:n1","L0:n4",12,[1]],["R","r3","L0:n2","L0:n4",2,[1]],["E","e2","L0:n3","L0:n4",6,[1]],["R","r1","L1:n1","L1:n2",2,[2]],["R","r2","L1:n2","L1:n3",2,[2]],["E","e1","L1:n1","L1:n3",12,[2]],["R","r3","L1:n2","L1:n3",2,[2]],["R","r1","L2:n1","L2:n2",2,[3]],["R","r2","L2:n2","L2:n3",2,[3]],["R","r3","L2:n2","L2:n1",2,[3]],["E","e2","L2:n3","L2:n1",6,[3]]]}
};
function tbU46s6all(d, p, L){ tbGen_Draw(d, p, L, U46S6K.all); }
function tbU46s6rev(d, p, L){ tbGen_Draw(d, p, L, U46S6K.rev); }
function tbU46s6lr(d, p, L){ tbGen_Draw(d, p, L, U46S6K.lr); }
function tbU46s6lrr(d, p, L){ tbGen_Draw(d, p, L, U46S6K.lrr); }
function tbU46s6ae(d, p, L){ tbGen_Draw(d, p, L, U46S6K.ae); }
function tbU46s6s1e(d, p, L){ tbGen_Draw(d, p, L, U46S6K.s1e); }
function tbU46s6s2e(d, p, L){ tbGen_Draw(d, p, L, U46S6K.s2e); }
function tbU46s6ax(d, p, L){ tbGen_Draw(d, p, L, U46S6K.ax); }
function tbU46s6s1x(d, p, L){ tbGen_Draw(d, p, L, U46S6K.s1x); }
function tbU46s6s2x(d, p, L){ tbGen_Draw(d, p, L, U46S6K.s2x); }
function tbU46s6q(d, p, L){ tbGen_Draw(d, p, L, U46S6K.q); }
function tbU46s6esw(d, p, L){ tbGen_Draw(d, p, L, U46S6K.esw); }
function tbU46s6xsw(d, p, L){ tbGen_Draw(d, p, L, U46S6K.xsw); }
// ---- 46-7 スイッチを読んで描き直す の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S7K = {
  shc: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u46s7shcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw6","pts":[[708,440],[817.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw7","pts":[[885.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7shcw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[],"lab":[851.5,389.96,null]},{"t":"d","id":"u46s7shcj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s7shcj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["C","sw","n1","N",0,[1]]]},
  sh1: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u46s7sh1L","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w5","pts":[[528,440],[637.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w6","pts":[[705.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7sh1w9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"s","k":"sw","dir":"h","x0":637.5,"y0":440,"x1":705.5,"y1":440,"v":1,"vis":[],"lab":[671.5,389.96,null]},{"t":"d","id":"u46s7sh1j111","x":528,"y":360,"vis":[]},{"t":"d","id":"u46s7sh1j212","x":815,"y":360,"vis":[]},{"t":"r","k":"r2","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360],[528,440],[637.5,440]]},{"I":1,"pts":[[705.5,440],[815,440],[815,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360],[528,280],[815,280],[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["C","sw","P","n1",0,[1]],["R","r2","n1","N",1,[]]]},
  sho: {"vars":[["s","swc",0]],"items":[{"t":"w","id":"u46s7shoL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7shoRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7show1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7show2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7show3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7show4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7show5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7show6","pts":[[708,440],[817.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7show7","pts":[[885.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7show8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7show9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[],"lab":[851.5,389.96,null]},{"t":"d","id":"u46s7shoj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s7shoj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["C","sw","n1","N",0,[1]]]},
  brc: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u46s7brcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw1","pts":[[478,360],[542,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw2","pts":[[666,280],[666,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw3","pts":[[1016,280],[1016,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw4","pts":[[666,280],[811,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw5","pts":[[871,280],[1016,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw6","pts":[[666,440],[723.67,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw7","pts":[[791.67,440],[884.33,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw8","pts":[[944.33,440],[1016,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw9","pts":[[602,360],[666,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7brcw10","pts":[[1016,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":572,"y":360,"dir":"h","vis":[],"lab":[572,330.34,null]},{"t":"r","k":"r2","x":841,"y":280,"dir":"h","vis":[],"lab":[841,250.34,null]},{"t":"s","k":"sw","dir":"h","x0":723.67,"y0":440,"x1":791.67,"y1":440,"v":1,"vis":[],"lab":[757.67,389.96,null]},{"t":"r","k":"r3","x":914.33,"y":440,"dir":"h","vis":[],"lab":[914.33,410.34,null]},{"t":"d","id":"u46s7brcj115","x":666,"y":360,"vis":[]},{"t":"d","id":"u46s7brcj216","x":1016,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[666,360]]},{"I":0.5,"pts":[[666,360],[666,280],[1016,280],[1016,360]]},{"I":0.5,"pts":[[666,360],[666,440],[723.67,440]]},{"I":0.5,"pts":[[791.67,440],[1016,440],[1016,360]]},{"I":1,"pts":[[1016,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[666,360],[666,280],[1016,280],[1016,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["C","sw","n1","n2",0,[1]],["R","r3","n2","N",1,[]]]},
  bro: {"vars":[["s","swc",0]],"items":[{"t":"w","id":"u46s7broL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7broRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow1","pts":[[478,360],[542,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow2","pts":[[666,280],[666,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow3","pts":[[1016,280],[1016,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow4","pts":[[666,280],[811,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow5","pts":[[871,280],[1016,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow6","pts":[[666,440],[723.67,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow7","pts":[[791.67,440],[884.33,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow8","pts":[[944.33,440],[1016,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow9","pts":[[602,360],[666,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7brow10","pts":[[1016,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":572,"y":360,"dir":"h","vis":[],"lab":[572,330.34,null]},{"t":"r","k":"r2","x":841,"y":280,"dir":"h","vis":[],"lab":[841,250.34,null]},{"t":"s","k":"sw","dir":"h","x0":723.67,"y0":440,"x1":791.67,"y1":440,"v":1,"vis":[],"lab":[757.67,389.96,null]},{"t":"r","k":"r3","x":914.33,"y":440,"dir":"h","vis":[],"lab":[914.33,410.34,null]},{"t":"d","id":"u46s7broj115","x":666,"y":360,"vis":[]},{"t":"d","id":"u46s7broj216","x":1016,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[666,360],[666,280],[1016,280],[1016,360],[1045,360],[1045,560],[772,560]]}]},{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[666,360]]},{"I":0.5,"pts":[[666,360],[666,280],[1016,280],[1016,360]]},{"I":0.5,"pts":[[666,360],[666,440],[723.67,440]]},{"I":0.5,"pts":[[791.67,440],[1016,440],[1016,360]]},{"I":1,"pts":[[1016,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["C","sw","n1","n2",0,[1]],["R","r3","n2","N",1,[]]]},
  ae: {"vars":[["s","swc",1]],"items":[{"t":"z","id":"zbu46s7ae0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s7ae1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[885.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s7ae2lo","z":"lo","lines":[[[821.5,280],[708,280],[708,440],[817.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s7aeL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew6","pts":[[708,440],[817.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew7","pts":[[885.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7aew9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.6,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[],"lab":[851.5,385.71,null]},{"t":"d","id":"u46s7aej113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s7aej214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",12,[]],["C","sw","n1","N",0,[1]]]},
  re: {"vars":[],"items":[{"t":"z","id":"zbu46s7re0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s7re1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u46s7reL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7reRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7rew1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7rew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,325.6,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","N",4,[]]]},
  ax: {"vars":[["s","swc",1]],"items":[{"t":"z","id":"zbu46s7ax0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s7ax1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[885.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu46s7ax2lo","z":"lo","lines":[[[821.5,280],[708,280],[708,440],[817.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u46s7axL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7axRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw6","pts":[[708,440],[817.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw7","pts":[[885.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7axw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.6,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[],"lab":[851.5,385.71,null]},{"t":"d","id":"u46s7axj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s7axj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",12,[]],["C","sw","n1","N",0,[1]]]},
  rx: {"vars":[],"items":[{"t":"z","id":"zbu46s7rx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu46s7rx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u46s7rxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7rxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7rxw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7rxw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,325.6,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","N",4,[]]]},
  q: {"vars":[["s","swc",1]],"items":[{"t":"w","id":"u46s7qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u46s7qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw6","pts":[[708,440],[817.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw7","pts":[[885.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u46s7qw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[],"lab":[851.5,389.96,null]},{"t":"d","id":"u46s7qj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u46s7qj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",12,[]],["C","sw","n1","N",0,[1]]]},
  esw: {"vars":[["s","swc",1],["a","t",0],["a","t",1]],"items":[{"t":"z","id":"zbu46s7esw0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[2],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu46s7esw1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[885.5,440]]],"vis":[2],"pts":[],"node":"L0:N"},{"t":"z","id":"zbu46s7esw2lo","z":"lo","lines":[[[821.5,280],[708,280],[708,440],[817.5,440]],[[623,360],[708,360]]],"vis":[2],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s7eswx10hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[3],"pts":[],"node":"L1:P"},{"t":"z","id":"zbu46s7eswx11lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[3],"pts":[],"node":"L1:N"},{"t":"w","id":"u46s7eswL","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u46s7eswRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww1","pts":[[478,360],[563,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww2","pts":[[708,280],[708,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww3","pts":[[995,280],[995,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww4","pts":[[708,280],[821.5,280]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww5","pts":[[881.5,280],[995,280]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww6","pts":[[708,440],[817.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww7","pts":[[885.5,440],[995,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww8","pts":[[623,360],[708,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7esww9","pts":[[995,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7eswx1L","pts":[[478,360],[478,560],[752,560]],"vis":[3],"dash":0},{"t":"w","id":"u46s7eswx1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s7eswx1w1","pts":[[478,360],[731.5,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s7eswx1w2","pts":[[791.5,360],[1045,360]],"vis":[3],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[2],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[2],"lab":[851.5,245.6,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[2],"lab":[851.5,385.71,null]},{"t":"d","id":"u46s7eswj113","x":708,"y":360,"vis":[2]},{"t":"d","id":"u46s7eswj214","x":995,"y":360,"vis":[2]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[2],"ax":"v","sd":-1,"io":1},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[3],"side":1,"loop":1,"lab":[762,608.29,null],"n":"srcx1"},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[3],"lab":[761.5,325.6,null],"n":"r1x1"},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[3],"ax":"v","sd":-1,"io":1,"n":"ix1"}],"flows":[{"c":[1,2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1,2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[3],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","L0:P","L0:N",24,[2]],["R","r1","L0:P","L0:n1",4,[2]],["R","r2","L0:n1","L0:N",12,[2]],["C","sw","L0:n1","L0:N",0,[1,2]],["E","src","L1:P","L1:N",24,[3]],["R","r1","L1:P","L1:N",4,[3]]]},
  xsw: {"vars":[["s","swc",1],["a","t",0],["a","t",1]],"items":[{"t":"z","id":"zbu46s7xsw0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[2],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu46s7xsw1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[885.5,440]]],"vis":[2],"pts":[],"node":"L0:N"},{"t":"z","id":"zbu46s7xsw2lo","z":"lo","lines":[[[821.5,280],[708,280],[708,440],[817.5,440]],[[623,360],[708,360]]],"vis":[2],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s7xswx10hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[3],"pts":[],"node":"L1:P"},{"t":"z","id":"zbu46s7xswx11lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[3],"pts":[],"node":"L1:N"},{"t":"w","id":"u46s7xswL","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xswRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww1","pts":[[478,360],[563,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww2","pts":[[708,280],[708,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww3","pts":[[995,280],[995,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww4","pts":[[708,280],[821.5,280]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww5","pts":[[881.5,280],[995,280]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww6","pts":[[708,440],[817.5,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww7","pts":[[885.5,440],[995,440]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww8","pts":[[623,360],[708,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xsww9","pts":[[995,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u46s7xswx1L","pts":[[478,360],[478,560],[752,560]],"vis":[3],"dash":0},{"t":"w","id":"u46s7xswx1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s7xswx1w1","pts":[[478,360],[731.5,360]],"vis":[3],"dash":0},{"t":"w","id":"u46s7xswx1w2","pts":[[791.5,360],[1045,360]],"vis":[3],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[2],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[2],"lab":[851.5,245.6,null]},{"t":"s","k":"sw","dir":"h","x0":817.5,"y0":440,"x1":885.5,"y1":440,"v":1,"vis":[2],"lab":[851.5,385.71,null]},{"t":"d","id":"u46s7xswj113","x":708,"y":360,"vis":[2]},{"t":"d","id":"u46s7xswj214","x":995,"y":360,"vis":[2]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[2],"ax":"v","sd":-1,"io":1},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[3],"side":1,"loop":1,"lab":[762,608.29,null],"n":"srcx1"},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[3],"lab":[761.5,325.6,null],"n":"r1x1"},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[3],"ax":"v","sd":-1,"io":1,"n":"ix1"}],"flows":[{"c":[1,2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,440],[817.5,440]]},{"I":1,"pts":[[885.5,440],[995,440],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[-1,2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360],[708,280],[995,280],[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[3],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","L0:P","L0:N",24,[2]],["R","r1","L0:P","L0:n1",4,[2]],["R","r2","L0:n1","L0:N",12,[2]],["C","sw","L0:n1","L0:N",0,[1,2]],["E","src","L1:P","L1:N",24,[3]],["R","r1","L1:P","L1:N",4,[3]]]}
};
function tbU46s7shc(d, p, L){ tbGen_Draw(d, p, L, U46S7K.shc); }
function tbU46s7sh1(d, p, L){ tbGen_Draw(d, p, L, U46S7K.sh1); }
function tbU46s7sho(d, p, L){ tbGen_Draw(d, p, L, U46S7K.sho); }
function tbU46s7brc(d, p, L){ tbGen_Draw(d, p, L, U46S7K.brc); }
function tbU46s7bro(d, p, L){ tbGen_Draw(d, p, L, U46S7K.bro); }
function tbU46s7ae(d, p, L){ tbGen_Draw(d, p, L, U46S7K.ae); }
function tbU46s7re(d, p, L){ tbGen_Draw(d, p, L, U46S7K.re); }
function tbU46s7ax(d, p, L){ tbGen_Draw(d, p, L, U46S7K.ax); }
function tbU46s7rx(d, p, L){ tbGen_Draw(d, p, L, U46S7K.rx); }
function tbU46s7q(d, p, L){ tbGen_Draw(d, p, L, U46S7K.q); }
function tbU46s7esw(d, p, L){ tbGen_Draw(d, p, L, U46S7K.esw); }
function tbU46s7xsw(d, p, L){ tbGen_Draw(d, p, L, U46S7K.xsw); }
// ---- 46-8 平衡と読んで電流を出す の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s8.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S8K = {
  br: {"vars":[["s","swc",0]],"items":[{"t":"w","id":"u46s8brL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw2","pts":[[478,760],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw4","pts":[[761.5,760],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw7","pts":[[761.5,360],[761.5,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw8","pts":[[761.5,490],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw9","pts":[[761.5,560],[761.5,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw10","pts":[[761.5,690],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw11","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw12","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw13","pts":[[1045,560],[1045,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw14","pts":[[1045,690],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw15","pts":[[761.5,560],[869.25,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8brw16","pts":[[937.25,560],[1045,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"lab":[515.62,560,"start"]},{"t":"r","k":"r1","x":761.5,"y":460,"dir":"v","vis":[],"lab":[781.12,460,"start"]},{"t":"r","k":"r3","x":761.5,"y":660,"dir":"v","vis":[],"lab":[781.12,660,"start"]},{"t":"r","k":"r2","x":1045,"y":460,"dir":"v","vis":[],"lab":[1025.38,420,"end"]},{"t":"r","k":"r4","x":1045,"y":660,"dir":"v","vis":[],"lab":[1025.38,620,"end"]},{"t":"s","k":"sw","dir":"h","x0":869.25,"y0":560,"x1":937.25,"y1":560,"v":1,"vis":[],"lab":[903.25,509.96,null]},{"t":"d","id":"u46s8brj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s8brj7","x":761.5,"y":560,"vis":[]},{"t":"d","id":"u46s8brj10","x":761.5,"y":760,"vis":[]},{"t":"d","id":"u46s8brj16","x":1045,"y":560,"vis":[]},{"t":"i","k":"i","x0":461,"y0":536.5,"x1":461,"y1":496.5,"lab":[445.38,516.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,760]]}]},{"c":[1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,760]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","n1","n4",1,[]],["R","r1","n1","n7",1,[]],["R","r3","n7","n4",1,[]],["R","r2","n1","n8",1,[]],["R","r4","n8","n4",1,[]],["C","sw","n7","n8",0,[1]]]},
  ae: {"vars":[["s","swc",0]],"items":[{"t":"z","id":"zbu46s8ae0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,548]],[[761.5,360],[1045,360],[1045,430]],[[761.5,360],[761.5,430]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s8ae1lo","z":"lo","lines":[[[761.5,760],[478,760],[478,572]],[[761.5,760],[1045,760],[1045,690]],[[761.5,690],[761.5,760]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu46s8ae2mid","z":"mid","lines":[[[761.5,490],[761.5,560]],[[761.5,560],[761.5,630]],[[761.5,560],[869.25,560]]],"vis":[],"pts":[],"node":"n7"},{"t":"z","id":"zbu46s8ae3mid","z":"mid","lines":[[[1045,490],[1045,560]],[[1045,560],[1045,630]],[[937.25,560],[1045,560]]],"vis":[],"pts":[],"node":"n8"},{"t":"w","id":"u46s8aeL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew2","pts":[[478,760],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew4","pts":[[761.5,760],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew7","pts":[[761.5,360],[761.5,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew8","pts":[[761.5,490],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew9","pts":[[761.5,560],[761.5,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew10","pts":[[761.5,690],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew11","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew12","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew13","pts":[[1045,560],[1045,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew14","pts":[[1045,690],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew15","pts":[[761.5,560],[869.25,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8aew16","pts":[[937.25,560],[1045,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"lab":[516.23,560,"start"]},{"t":"r","k":"r1","x":761.5,"y":460,"dir":"v","vis":[],"lab":[781.73,460,"start"]},{"t":"r","k":"r3","x":761.5,"y":660,"dir":"v","vis":[],"lab":[781.73,660,"start"]},{"t":"r","k":"r2","x":1045,"y":460,"dir":"v","vis":[],"lab":[1024.77,420,"end"]},{"t":"r","k":"r4","x":1045,"y":660,"dir":"v","vis":[],"lab":[1024.77,620,"end"]},{"t":"s","k":"sw","dir":"h","x0":869.25,"y0":560,"x1":937.25,"y1":560,"v":1,"vis":[],"lab":[903.25,504.71,null]},{"t":"d","id":"u46s8aej4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s8aej7","x":761.5,"y":560,"vis":[]},{"t":"d","id":"u46s8aej10","x":761.5,"y":760,"vis":[]},{"t":"d","id":"u46s8aej16","x":1045,"y":560,"vis":[]},{"t":"i","k":"i","x0":461,"y0":536.5,"x1":461,"y1":496.5,"lab":[444.77,516.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,760]]}]},{"c":[1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,760]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",2,[]],["R","r3","n7","n4",4,[]],["R","r2","n1","n8",4,[]],["R","r4","n8","n4",8,[]],["C","sw","n7","n8",0,[1]]]},
  ax: {"vars":[["s","swc",0]],"items":[{"t":"z","id":"zbu46s8ax0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,548]],[[761.5,360],[1045,360],[1045,430]],[[761.5,360],[761.5,430]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu46s8ax1lo","z":"lo","lines":[[[761.5,760],[478,760],[478,572]],[[761.5,760],[1045,760],[1045,690]],[[761.5,690],[761.5,760]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu46s8ax2mid","z":"mid","lines":[[[761.5,490],[761.5,560]],[[761.5,560],[761.5,630]],[[761.5,560],[869.25,560]]],"vis":[],"pts":[],"node":"n7"},{"t":"z","id":"zbu46s8ax3mid","z":"mid","lines":[[[1045,490],[1045,560]],[[1045,560],[1045,630]],[[937.25,560],[1045,560]]],"vis":[],"pts":[],"node":"n8"},{"t":"w","id":"u46s8axL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw2","pts":[[478,760],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw4","pts":[[761.5,760],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw7","pts":[[761.5,360],[761.5,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw8","pts":[[761.5,490],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw9","pts":[[761.5,560],[761.5,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw10","pts":[[761.5,690],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw11","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw12","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw13","pts":[[1045,560],[1045,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw14","pts":[[1045,690],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw15","pts":[[761.5,560],[869.25,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8axw16","pts":[[937.25,560],[1045,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"lab":[516.23,560,"start"]},{"t":"r","k":"r1","x":761.5,"y":460,"dir":"v","vis":[],"lab":[781.73,460,"start"]},{"t":"r","k":"r3","x":761.5,"y":660,"dir":"v","vis":[],"lab":[781.73,660,"start"]},{"t":"r","k":"r2","x":1045,"y":460,"dir":"v","vis":[],"lab":[1024.77,420,"end"]},{"t":"r","k":"r4","x":1045,"y":660,"dir":"v","vis":[],"lab":[1024.77,620,"end"]},{"t":"s","k":"sw","dir":"h","x0":869.25,"y0":560,"x1":937.25,"y1":560,"v":1,"vis":[],"lab":[903.25,504.71,null]},{"t":"d","id":"u46s8axj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s8axj7","x":761.5,"y":560,"vis":[]},{"t":"d","id":"u46s8axj10","x":761.5,"y":760,"vis":[]},{"t":"d","id":"u46s8axj16","x":1045,"y":560,"vis":[]},{"t":"i","k":"i","x0":461,"y0":536.5,"x1":461,"y1":496.5,"lab":[444.77,516.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,760]]}]},{"c":[1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,760]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",2,[]],["R","r3","n7","n4",4,[]],["R","r2","n1","n8",4,[]],["R","r4","n8","n4",8,[]],["C","sw","n7","n8",0,[1]]]},
  q: {"vars":[["s","swc",0]],"items":[{"t":"w","id":"u46s8qL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw2","pts":[[478,760],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw4","pts":[[761.5,760],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw5","pts":[[478,360],[478,548]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw6","pts":[[478,572],[478,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw7","pts":[[761.5,360],[761.5,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw8","pts":[[761.5,490],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw9","pts":[[761.5,560],[761.5,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw10","pts":[[761.5,690],[761.5,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw11","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw12","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw13","pts":[[1045,560],[1045,630]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw14","pts":[[1045,690],[1045,760]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw15","pts":[[761.5,560],[869.25,560]],"vis":[],"dash":0},{"t":"w","id":"u46s8qw16","pts":[[937.25,560],[1045,560]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":548,"xm":478,"ym":572,"vis":[],"side":-1,"lab":[515.62,560,"start"]},{"t":"r","k":"r1","x":761.5,"y":460,"dir":"v","vis":[],"lab":[781.12,460,"start"]},{"t":"r","k":"r3","x":761.5,"y":660,"dir":"v","vis":[],"lab":[781.12,660,"start"]},{"t":"r","k":"r2","x":1045,"y":460,"dir":"v","vis":[],"lab":[1025.38,420,"end"]},{"t":"r","k":"r4","x":1045,"y":660,"dir":"v","vis":[],"lab":[1025.38,620,"end"]},{"t":"s","k":"sw","dir":"h","x0":869.25,"y0":560,"x1":937.25,"y1":560,"v":1,"vis":[],"lab":[903.25,509.96,null]},{"t":"d","id":"u46s8qj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s8qj7","x":761.5,"y":560,"vis":[]},{"t":"d","id":"u46s8qj10","x":761.5,"y":760,"vis":[]},{"t":"d","id":"u46s8qj16","x":1045,"y":560,"vis":[]},{"t":"i","k":"i","x0":461,"y0":536.5,"x1":461,"y1":496.5,"lab":[445.38,516.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,760]]}]},{"c":[1],"paths":[{"I":1,"pts":[[761.5,760],[478,760],[478,572]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,760],[761.5,760]]},{"I":1,"pts":[[478,548],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,760]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",2,[]],["R","r3","n7","n4",4,[]],["R","r2","n1","n8",4,[]],["R","r4","n8","n4",8,[]],["C","sw","n7","n8",0,[1]]]}
};
function tbU46s8br(d, p, L){ tbGen_Draw(d, p, L, U46S8K.br); }
function tbU46s8ae(d, p, L){ tbGen_Draw(d, p, L, U46S8K.ae); }
function tbU46s8ax(d, p, L){ tbGen_Draw(d, p, L, U46S8K.ax); }
function tbU46s8q(d, p, L){ tbGen_Draw(d, p, L, U46S8K.q); }
// ---- 46-9 2つの図の持ち越し の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s9.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S9K = {
  add: {"vars":[],"items":[{"t":"w","id":"u46s9addL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9addw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9addw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9addw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9addw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1L","pts":[[1321,360],[1432.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w2","pts":[[1492.75,360],[1604.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w3","pts":[[1321,580],[1604.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w4","pts":[[1604.5,360],[1888,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w5","pts":[[1604.5,580],[1888,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w6","pts":[[1321,360],[1321,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w7","pts":[[1321,482],[1321,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w8","pts":[[1604.5,360],[1604.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w9","pts":[[1604.5,500],[1604.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w10","pts":[[1888,360],[1888,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9addx1w11","pts":[[1888,500],[1888,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,297.21,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[519.05,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1021.95,470,"end"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s9addcap0","x":697,"y":675.72,"s":"図1","vis":[]},{"t":"r","k":"r1","x":1462.75,"y":360,"dir":"h","vis":[],"lab":[1462.75,297.21,null],"n":"r1x1"},{"t":"e","k":"src","dir":"v","xp":1321,"yp":458,"xm":1321,"ym":482,"vis":[],"side":-1,"lab":[1362.05,470,"start"],"n":"srcx1"},{"t":"r","k":"r2","x":1604.5,"y":470,"dir":"v","vis":[],"lab":[1627.55,470,"start"],"n":"r2x1"},{"t":"r","k":"r3","x":1888,"y":470,"dir":"v","vis":[],"lab":[1911.05,510,"start"],"n":"r3x1"},{"t":"d","id":"u46s9addx1j6","x":1604.5,"y":360,"vis":[]},{"t":"d","id":"u46s9addx1j9","x":1604.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":1304,"y0":446.5,"x1":1304,"y1":406.5,"lab":[1288,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"ix1"},{"t":"i","k":"i2","x0":1587.5,"y0":397.5,"x1":1587.5,"y1":437.5,"lab":[1568.45,425.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"i","k":"i3","x0":1905,"y0":397.5,"x1":1905,"y1":437.5,"lab":[1921,417.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"i3x1"},{"t":"cap","id":"u46s9addcap1","x":1607,"y":675.72,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1604.5,580],[1321,580],[1321,482]]},{"I":0.5,"pts":[[1604.5,360],[1888,360],[1888,580],[1604.5,580]]},{"I":1,"pts":[[1321,458],[1321,360],[1604.5,360]]},{"I":0.5,"pts":[[1604.5,360],[1604.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","r2","L0:n2","L0:n3",1,[]],["R","r1","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n4",1,[]],["R","r2","L1:n2","L1:n4",1,[]],["R","r3","L1:n2","L1:n4",1,[]]]},
  sw: {"vars":[["s","swc",0],["s","swc",1]],"items":[{"t":"w","id":"u46s9swL","pts":[[499.75,280],[499.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww2","pts":[[739.75,280],[739.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww3","pts":[[499.75,280],[589.75,280]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww4","pts":[[649.75,280],[739.75,280]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww5","pts":[[499.75,440],[585.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww6","pts":[[653.75,440],[739.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww7","pts":[[478,360],[499.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww8","pts":[[739.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww9","pts":[[478,560],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww10","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww11","pts":[[761.5,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww12","pts":[[478,360],[478,448]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww13","pts":[[478,472],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww14","pts":[[761.5,360],[761.5,430]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww15","pts":[[761.5,490],[761.5,560]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww16","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u46s9sww17","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1L","pts":[[1465.75,280],[1465.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w2","pts":[[1705.75,280],[1705.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w3","pts":[[1465.75,280],[1555.75,280]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w4","pts":[[1615.75,280],[1705.75,280]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w5","pts":[[1465.75,440],[1551.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w6","pts":[[1619.75,440],[1705.75,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w7","pts":[[1444,360],[1465.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w8","pts":[[1705.75,360],[1727.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w9","pts":[[1444,580],[1727.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w10","pts":[[1727.5,360],[2011,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w11","pts":[[1727.5,580],[2011,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w12","pts":[[1444,360],[1444,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w13","pts":[[1444,482],[1444,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w14","pts":[[1727.5,360],[1727.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w15","pts":[[1727.5,500],[1727.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w16","pts":[[2011,360],[2011,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9swx1w17","pts":[[2011,500],[2011,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":280,"dir":"h","vis":[],"lab":[619.75,216.6,null]},{"t":"s","k":"sw","dir":"h","x0":585.75,"y0":440,"x1":653.75,"y1":440,"v":1,"vis":[],"lab":[619.75,359.71,null]},{"t":"d","id":"u46s9swj18","x":499.75,"y":360,"vis":[]},{"t":"d","id":"u46s9swj29","x":739.75,"y":360,"vis":[]},{"t":"e","k":"src","dir":"v","xp":478,"yp":448,"xm":478,"ym":472,"vis":[],"side":-1,"lab":[436.89,460,"end"]},{"t":"r","k":"r2","x":761.5,"y":460,"dir":"v","vis":[],"lab":[784.61,460,"start"]},{"t":"r","k":"r3","x":1045,"y":460,"dir":"v","vis":[],"lab":[1068.11,460,"start"]},{"t":"d","id":"u46s9swj5","x":499.75,"y":360,"vis":[]},{"t":"d","id":"u46s9swj12","x":739.75,"y":360,"vis":[]},{"t":"d","id":"u46s9swj14","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s9swj17","x":761.5,"y":560,"vis":[]},{"t":"cap","id":"u46s9swcap0","x":809.5,"y":676.66,"s":"図1","vis":[]},{"t":"r","k":"r1","x":1585.75,"y":280,"dir":"h","vis":[],"lab":[1585.75,216.6,null],"n":"r1x1"},{"t":"s","k":"sw","dir":"h","x0":1551.75,"y0":440,"x1":1619.75,"y1":440,"v":1,"vis":[],"lab":[1585.75,359.71,null],"n":"swx1"},{"t":"d","id":"u46s9swx1j18","x":1465.75,"y":360,"vis":[]},{"t":"d","id":"u46s9swx1j29","x":1705.75,"y":360,"vis":[]},{"t":"e","k":"src","dir":"v","xp":1444,"yp":458,"xm":1444,"ym":482,"vis":[],"side":-1,"lab":[1402.89,470,"end"],"n":"srcx1"},{"t":"r","k":"r2","x":1727.5,"y":470,"dir":"v","vis":[],"lab":[1750.61,470,"start"],"n":"r2x1"},{"t":"r","k":"r3","x":2011,"y":470,"dir":"v","vis":[],"lab":[2034.11,510,"start"],"n":"r3x1"},{"t":"d","id":"u46s9swx1j5","x":1465.75,"y":360,"vis":[]},{"t":"d","id":"u46s9swx1j12","x":1705.75,"y":360,"vis":[]},{"t":"d","id":"u46s9swx1j14","x":1727.5,"y":360,"vis":[]},{"t":"d","id":"u46s9swx1j17","x":1727.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":1427,"y0":446.5,"x1":1427,"y1":406.5,"lab":[1407.89,370.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"ix1"},{"t":"i","k":"i3","x0":2028,"y0":397.5,"x1":2028,"y1":437.5,"lab":[2044,417.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"i3x1"},{"t":"cap","id":"u46s9swcap1","x":1730.5,"y":676.66,"s":"図2","vis":[]}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[761.5,560],[478,560],[478,472]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,560],[761.5,560]]},{"I":1,"pts":[[478,448],[478,360],[499.75,360],[499.75,280],[739.75,280],[739.75,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,560]]}]},{"c":[1],"paths":[{"I":1,"pts":[[653.75,440],[739.75,440],[739.75,360],[761.5,360]]},{"I":1,"pts":[[761.5,560],[478,560],[478,472]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,560],[761.5,560]]},{"I":1,"pts":[[478,448],[478,360],[499.75,360],[499.75,440],[585.75,440]]},{"I":0.5,"pts":[[761.5,360],[761.5,560]]}]},{"c":[2],"paths":[{"I":1,"pts":[[1619.75,440],[1705.75,440],[1705.75,360],[1727.5,360]]},{"I":1,"pts":[[1727.5,580],[1444,580],[1444,482]]},{"I":0.5,"pts":[[1727.5,360],[2011,360],[2011,580],[1727.5,580]]},{"I":1,"pts":[[1444,458],[1444,360],[1465.75,360],[1465.75,440],[1551.75,440]]},{"I":0.5,"pts":[[1727.5,360],[1727.5,580]]}]},{"c":[-2],"paths":[{"I":1,"pts":[[1727.5,580],[1444,580],[1444,482]]},{"I":0.5,"pts":[[1727.5,360],[2011,360],[2011,580],[1727.5,580]]},{"I":1,"pts":[[1444,458],[1444,360],[1465.75,360],[1465.75,280],[1705.75,280],[1705.75,360],[1727.5,360]]},{"I":0.5,"pts":[[1727.5,360],[1727.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["C","sw","L0:n1","L0:n2",0,[1]],["E","src","L0:n1","L0:n4",1,[]],["R","r2","L0:n2","L0:n4",1,[]],["R","r3","L0:n2","L0:n4",1,[]],["R","r1","L1:n1","L1:n2",1,[]],["C","sw","L1:n1","L1:n2",0,[2]],["E","src","L1:n1","L1:n4",1,[]],["R","r2","L1:n2","L1:n4",1,[]],["R","r3","L1:n2","L1:n4",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu46s9ae0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s9ae1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,440]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu46s9ae2lo","z":"lo","lines":[[[478,482],[478,580],[1045,580],[1045,500]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu46s9aex10hi","z":"hi","lines":[[[496.25,804],[384.5,804],[384.5,902]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu46s9aex11mid","z":"mid","lines":[[[556.25,804],[668,804]],[[668,804],[955.53,804],[955.53,884]],[[668,804],[668,884]]],"vis":[],"pts":[],"node":"L1:n2"},{"t":"z","id":"zbu46s9aex12lo","z":"lo","lines":[[[668,1024],[384.5,1024],[384.5,926]],[[668,1024],[955.53,1024],[955.53,944]],[[668,944],[668,1024]]],"vis":[],"pts":[],"node":"L1:n4"},{"t":"w","id":"u46s9aeL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9aew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9aew3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9aew4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9aew5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9aew6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9aew7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1L","pts":[[384.5,804],[496.25,804]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w2","pts":[[556.25,804],[668,804]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w3","pts":[[384.5,1024],[668,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w4","pts":[[668,804],[955.53,804]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w5","pts":[[668,1024],[955.53,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w6","pts":[[384.5,804],[384.5,902]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w7","pts":[[384.5,926],[384.5,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w8","pts":[[668,804],[668,884]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w9","pts":[[668,944],[668,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w10","pts":[[955.53,804],[955.53,884]],"vis":[],"dash":0},{"t":"w","id":"u46s9aex1w11","pts":[[955.53,944],[955.53,1024]],"vis":[],"dash":0},{"t":"r","k":"sr1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,318.89,null]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.8,470,"start"]},{"t":"r","k":"sr2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1024.2,470,"end"]},{"t":"i","k":"si1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.2,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s9aecap0","x":678.5,"y":634.25,"s":"図1","vis":[]},{"t":"r","k":"sr1","x":526.25,"y":804,"dir":"h","vis":[],"lab":[526.25,762.89,null],"n":"sr1x1"},{"t":"e","k":"ssrc","dir":"v","xp":384.5,"yp":902,"xm":384.5,"ym":926,"vis":[],"side":-1,"lab":[423.3,914,"start"],"n":"ssrcx1"},{"t":"r","k":"sr2","x":668,"y":914,"dir":"v","vis":[],"lab":[688.8,914,"start"],"n":"sr2x1"},{"t":"r","k":"sr3","x":955.53,"y":914,"dir":"v","vis":[],"lab":[934.72,858,"end"],"n":"sr3x1"},{"t":"d","id":"u46s9aex1j6","x":668,"y":804,"vis":[]},{"t":"d","id":"u46s9aex1j9","x":668,"y":1024,"vis":[]},{"t":"i","k":"si","x0":367.5,"y0":890.5,"x1":367.5,"y1":850.5,"lab":[350.7,870.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"six1"},{"t":"i","k":"si2","x0":685,"y0":841.5,"x1":685,"y1":881.5,"lab":[701,861.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"si2x1"},{"t":"i","k":"si3","x0":972.53,"y0":841.5,"x1":972.53,"y1":881.5,"lab":[989.33,861.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"si3x1"},{"t":"cap","id":"u46s9aecap1","x":678,"y":1086.25,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[668,1024],[384.5,1024],[384.5,926]]},{"I":0.75,"pts":[[668,804],[955.53,804],[955.53,1024],[668,1024]]},{"I":1,"pts":[[384.5,902],[384.5,804],[668,804]]},{"I":0.25,"pts":[[668,804],[668,1024]]}]}],"base":110,"von":["ssrc"],"bands":"volt","pts":[],"net":[["R","sr1","L0:n1","L0:n2",6,[]],["E","ssrc","L0:n1","L0:n3",36,[]],["R","sr2","L0:n2","L0:n3",12,[]],["R","sr1","L1:n1","L1:n2",6,[]],["E","ssrc","L1:n1","L1:n4",36,[]],["R","sr2","L1:n2","L1:n4",12,[]],["R","sr3","L1:n2","L1:n4",4,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu46s9ax0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s9ax1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,440]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu46s9ax2lo","z":"lo","lines":[[[478,482],[478,580],[1045,580],[1045,500]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu46s9axx10hi","z":"hi","lines":[[[496.25,804],[384.5,804],[384.5,902]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu46s9axx11mid","z":"mid","lines":[[[556.25,804],[668,804]],[[668,804],[955.53,804],[955.53,884]],[[668,804],[668,884]]],"vis":[],"pts":[],"node":"L1:n2"},{"t":"z","id":"zbu46s9axx12lo","z":"lo","lines":[[[668,1024],[384.5,1024],[384.5,926]],[[668,1024],[955.53,1024],[955.53,944]],[[668,944],[668,1024]]],"vis":[],"pts":[],"node":"L1:n4"},{"t":"w","id":"u46s9axL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9axw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9axw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9axw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9axw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9axw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9axw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1L","pts":[[384.5,804],[496.25,804]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w2","pts":[[556.25,804],[668,804]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w3","pts":[[384.5,1024],[668,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w4","pts":[[668,804],[955.53,804]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w5","pts":[[668,1024],[955.53,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w6","pts":[[384.5,804],[384.5,902]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w7","pts":[[384.5,926],[384.5,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w8","pts":[[668,804],[668,884]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w9","pts":[[668,944],[668,1024]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w10","pts":[[955.53,804],[955.53,884]],"vis":[],"dash":0},{"t":"w","id":"u46s9axx1w11","pts":[[955.53,944],[955.53,1024]],"vis":[],"dash":0},{"t":"r","k":"sr1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,318.89,null]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.8,470,"start"]},{"t":"r","k":"sr2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1024.2,470,"end"]},{"t":"i","k":"si1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.2,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s9axcap0","x":678.5,"y":634.25,"s":"図1","vis":[]},{"t":"r","k":"sr1","x":526.25,"y":804,"dir":"h","vis":[],"lab":[526.25,762.89,null],"n":"sr1x1"},{"t":"e","k":"ssrc","dir":"v","xp":384.5,"yp":902,"xm":384.5,"ym":926,"vis":[],"side":-1,"lab":[423.3,914,"start"],"n":"ssrcx1"},{"t":"r","k":"sr2","x":668,"y":914,"dir":"v","vis":[],"lab":[688.8,914,"start"],"n":"sr2x1"},{"t":"r","k":"sr3","x":955.53,"y":914,"dir":"v","vis":[],"lab":[934.72,858,"end"],"n":"sr3x1"},{"t":"d","id":"u46s9axx1j6","x":668,"y":804,"vis":[]},{"t":"d","id":"u46s9axx1j9","x":668,"y":1024,"vis":[]},{"t":"i","k":"si","x0":367.5,"y0":890.5,"x1":367.5,"y1":850.5,"lab":[350.7,870.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"six1"},{"t":"i","k":"si2","x0":685,"y0":841.5,"x1":685,"y1":881.5,"lab":[701,861.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"si2x1"},{"t":"i","k":"si3","x0":972.53,"y0":841.5,"x1":972.53,"y1":881.5,"lab":[989.33,861.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"si3x1"},{"t":"cap","id":"u46s9axcap1","x":678,"y":1086.25,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[668,1024],[384.5,1024],[384.5,926]]},{"I":0.75,"pts":[[668,804],[955.53,804],[955.53,1024],[668,1024]]},{"I":1,"pts":[[384.5,902],[384.5,804],[668,804]]},{"I":0.25,"pts":[[668,804],[668,1024]]}]}],"base":110,"von":["ssrc"],"bands":"volt","pts":[],"net":[["R","sr1","L0:n1","L0:n2",6,[]],["E","ssrc","L0:n1","L0:n3",36,[]],["R","sr2","L0:n2","L0:n3",12,[]],["R","sr1","L1:n1","L1:n2",6,[]],["E","ssrc","L1:n1","L1:n4",36,[]],["R","sr2","L1:n2","L1:n4",12,[]],["R","sr3","L1:n2","L1:n4",4,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u46s9qL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9qw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9qw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9qw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9qw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1L","pts":[[1321,360],[1432.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w2","pts":[[1492.75,360],[1604.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w3","pts":[[1321,580],[1604.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w4","pts":[[1604.5,360],[1888,360]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w5","pts":[[1604.5,580],[1888,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w6","pts":[[1321,360],[1321,458]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w7","pts":[[1321,482],[1321,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w8","pts":[[1604.5,360],[1604.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w9","pts":[[1604.5,500],[1604.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w10","pts":[[1888,360],[1888,440]],"vis":[],"dash":0},{"t":"w","id":"u46s9qx1w11","pts":[[1888,500],[1888,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,297.21,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[519.05,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1021.95,470,"end"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s9qcap0","x":697,"y":675.72,"s":"図1","vis":[]},{"t":"r","k":"r1","x":1462.75,"y":360,"dir":"h","vis":[],"lab":[1462.75,297.21,null],"n":"r1x1"},{"t":"e","k":"src","dir":"v","xp":1321,"yp":458,"xm":1321,"ym":482,"vis":[],"side":-1,"lab":[1362.05,470,"start"],"n":"srcx1"},{"t":"r","k":"r2","x":1604.5,"y":470,"dir":"v","vis":[],"lab":[1627.55,470,"start"],"n":"r2x1"},{"t":"r","k":"r3","x":1888,"y":470,"dir":"v","vis":[],"lab":[1911.05,510,"start"],"n":"r3x1"},{"t":"d","id":"u46s9qx1j6","x":1604.5,"y":360,"vis":[]},{"t":"d","id":"u46s9qx1j9","x":1604.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":1304,"y0":446.5,"x1":1304,"y1":406.5,"lab":[1288,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"ix1"},{"t":"i","k":"i2","x0":1587.5,"y0":397.5,"x1":1587.5,"y1":437.5,"lab":[1568.45,425.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"i","k":"i3","x0":1905,"y0":397.5,"x1":1905,"y1":437.5,"lab":[1921,417.5,"start"],"vis":[],"ax":"v","sd":1,"io":1,"n":"i3x1"},{"t":"cap","id":"u46s9qcap1","x":1607,"y":675.72,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1604.5,580],[1321,580],[1321,482]]},{"I":0.75,"pts":[[1604.5,360],[1888,360],[1888,580],[1604.5,580]]},{"I":1,"pts":[[1321,458],[1321,360],[1604.5,360]]},{"I":0.25,"pts":[[1604.5,360],[1604.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",6,[]],["E","src","L0:n1","L0:n3",36,[]],["R","r2","L0:n2","L0:n3",12,[]],["R","r1","L1:n1","L1:n2",6,[]],["E","src","L1:n1","L1:n4",36,[]],["R","r2","L1:n2","L1:n4",12,[]],["R","r3","L1:n2","L1:n4",4,[]]]}
};
function tbU46s9add(d, p, L){ tbFig_Draw(d, p, L, U46S9K.add); }
function tbU46s9sw(d, p, L){ tbFig_Draw(d, p, L, U46S9K.sw); }
function tbU46s9ae(d, p, L){ tbFig_Draw(d, p, L, U46S9K.ae); }
function tbU46s9ax(d, p, L){ tbFig_Draw(d, p, L, U46S9K.ax); }
function tbU46s9q(d, p, L){ tbFig_Draw(d, p, L, U46S9K.q); }
// ---- 46-10 2つの条件を等しく置く の図（※ textbook/gen/make_section.py が textbook/gen/data/u46_s10.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U46S10K = {
  eq: {"vars":[],"items":[{"t":"w","id":"u46s10eqL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1L","pts":[[1246,360],[1529.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w2","pts":[[1246,580],[1529.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w3","pts":[[1529.5,360],[1813,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w4","pts":[[1529.5,580],[1813,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w5","pts":[[1246,360],[1246,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w6","pts":[[1246,482],[1246,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w7","pts":[[1529.5,360],[1529.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w8","pts":[[1529.5,500],[1529.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w9","pts":[[1813,360],[1813,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10eqx1w10","pts":[[1813,500],[1813,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,302.2,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.53,470,"start"]},{"t":"r","k":"rx","x":1045,"y":470,"dir":"v","vis":[],"lab":[1067.53,470,"start"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s10eqcap0","x":759,"y":667.97,"s":"図1","vis":[]},{"t":"e","k":"src","dir":"v","xp":1246,"yp":458,"xm":1246,"ym":482,"vis":[],"side":-1,"lab":[1286.53,470,"start"],"n":"srcx1"},{"t":"r","k":"r2","x":1529.5,"y":470,"dir":"v","vis":[],"lab":[1552.03,470,"start"],"n":"r2x1"},{"t":"r","k":"r3","x":1813,"y":470,"dir":"v","vis":[],"lab":[1835.53,470,"start"],"n":"r3x1"},{"t":"d","id":"u46s10eqx1j4","x":1529.5,"y":360,"vis":[]},{"t":"d","id":"u46s10eqx1j7","x":1529.5,"y":580,"vis":[]},{"t":"i","k":"i2","x0":1229,"y0":446.5,"x1":1229,"y1":406.5,"lab":[1213,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u46s10eqcap1","x":1579,"y":667.97,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1529.5,580],[1246,580],[1246,482]]},{"I":0.5,"pts":[[1529.5,360],[1813,360],[1813,580],[1529.5,580]]},{"I":1,"pts":[[1246,458],[1246,360],[1529.5,360]]},{"I":0.5,"pts":[[1529.5,360],[1529.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","rx","L0:n2","L0:n3",1,[]],["E","src","L1:n1","L1:n4",1,[]],["R","r2","L1:n1","L1:n4",1,[]],["R","r3","L1:n1","L1:n4",1,[]]]},
  par: {"vars":[],"items":[{"t":"w","id":"u46s10parL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw2","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw4","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw5","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw6","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw7","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw8","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw9","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10parw10","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1L","pts":[[1246,360],[1499.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1w2","pts":[[1559.5,360],[1813,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1w3","pts":[[1246,580],[1813,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1w4","pts":[[1246,360],[1246,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1w5","pts":[[1246,482],[1246,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1w6","pts":[[1813,360],[1813,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10parx1w7","pts":[[1813,500],[1813,580]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.18,470,"start"]},{"t":"r","k":"r1","x":761.5,"y":470,"dir":"v","vis":[],"lab":[783.68,470,"start"]},{"t":"r","k":"rx","x":1045,"y":470,"dir":"v","vis":[],"lab":[1067.18,470,"start"]},{"t":"d","id":"u46s10parj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u46s10parj7","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s10parcap0","x":759,"y":662.68,"s":"図1","vis":[]},{"t":"r","k":"r2","x":1529.5,"y":360,"dir":"h","vis":[],"lab":[1529.5,305.61,null],"n":"r2x1"},{"t":"e","k":"src","dir":"v","xp":1246,"yp":458,"xm":1246,"ym":482,"vis":[],"side":-1,"lab":[1286.18,470,"start"],"n":"srcx1"},{"t":"r","k":"r3","x":1813,"y":470,"dir":"v","vis":[],"lab":[1790.82,470,"end"],"n":"r3x1"},{"t":"i","k":"i2","x0":1229,"y0":446.5,"x1":1229,"y1":406.5,"lab":[1213,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u46s10parcap1","x":1517.5,"y":662.68,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]},{"c":[],"paths":[{"I":1,"pts":[[1246,458],[1246,360],[1813,360],[1813,580],[1246,580],[1246,482]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:n1","L0:n4",1,[]],["R","r1","L0:n1","L0:n4",1,[]],["R","rx","L0:n1","L0:n4",1,[]],["R","r2","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n3",1,[]],["R","r3","L1:n2","L1:n3",1,[]]]},
  bun: {"vars":[],"items":[{"t":"w","id":"u46s10bunL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1L","pts":[[1246,360],[1357.75,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w2","pts":[[1417.75,360],[1529.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w3","pts":[[1246,580],[1529.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w4","pts":[[1529.5,360],[1813,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w5","pts":[[1529.5,580],[1813,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w6","pts":[[1246,360],[1246,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w7","pts":[[1246,482],[1246,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w8","pts":[[1529.5,360],[1529.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w9","pts":[[1529.5,500],[1529.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w10","pts":[[1813,360],[1813,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10bunx1w11","pts":[[1813,500],[1813,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,302.2,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.53,470,"start"]},{"t":"r","k":"rx","x":1045,"y":470,"dir":"v","vis":[],"lab":[1067.53,470,"start"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s10buncap0","x":759,"y":667.97,"s":"図1","vis":[]},{"t":"r","k":"r2","x":1387.75,"y":360,"dir":"h","vis":[],"lab":[1387.75,302.2,null],"n":"r2x1"},{"t":"e","k":"src","dir":"v","xp":1246,"yp":458,"xm":1246,"ym":482,"vis":[],"side":-1,"lab":[1286.53,470,"start"],"n":"srcx1"},{"t":"r","k":"r3","x":1529.5,"y":470,"dir":"v","vis":[],"lab":[1552.03,470,"start"],"n":"r3x1"},{"t":"r","k":"r4","x":1813,"y":470,"dir":"v","vis":[],"lab":[1835.53,470,"start"],"n":"r4x1"},{"t":"d","id":"u46s10bunx1j6","x":1529.5,"y":360,"vis":[]},{"t":"d","id":"u46s10bunx1j9","x":1529.5,"y":580,"vis":[]},{"t":"i","k":"i2","x0":1229,"y0":446.5,"x1":1229,"y1":406.5,"lab":[1213,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"i","k":"i3","x0":1512.5,"y0":397.5,"x1":1512.5,"y1":437.5,"lab":[1496.5,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i3x1"},{"t":"cap","id":"u46s10buncap1","x":1579,"y":667.97,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1529.5,580],[1246,580],[1246,482]]},{"I":0.5,"pts":[[1529.5,360],[1813,360],[1813,580],[1529.5,580]]},{"I":1,"pts":[[1246,458],[1246,360],[1529.5,360]]},{"I":0.5,"pts":[[1529.5,360],[1529.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","rx","L0:n2","L0:n3",1,[]],["R","r2","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n4",1,[]],["R","r3","L1:n2","L1:n4",1,[]],["R","r4","L1:n2","L1:n4",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu46s10ae0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s10ae1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,440]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu46s10ae2lo","z":"lo","lines":[[[478,482],[478,580],[1045,580],[1045,500]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu46s10aex10hi","z":"hi","lines":[[[761.5,742],[478,742],[478,840]],[[761.5,742],[1045,742],[1045,822]],[[761.5,742],[761.5,822]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu46s10aex11lo","z":"lo","lines":[[[761.5,962],[478,962],[478,864]],[[761.5,962],[1045,962],[1045,882]],[[761.5,882],[761.5,962]]],"vis":[],"pts":[],"node":"L1:n4"},{"t":"w","id":"u46s10aeL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10aew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10aew3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10aew4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10aew5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10aew6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10aew7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1L","pts":[[478,742],[761.5,742]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w2","pts":[[478,962],[761.5,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w3","pts":[[761.5,742],[1045,742]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w4","pts":[[761.5,962],[1045,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w5","pts":[[478,742],[478,840]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w6","pts":[[478,864],[478,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w7","pts":[[761.5,742],[761.5,822]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w8","pts":[[761.5,882],[761.5,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w9","pts":[[1045,742],[1045,822]],"vis":[],"dash":0},{"t":"w","id":"u46s10aex1w10","pts":[[1045,882],[1045,962]],"vis":[],"dash":0},{"t":"r","k":"sr1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,323.89,null]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.29,470,"start"]},{"t":"r","k":"srx","x":1045,"y":470,"dir":"v","vis":[],"lab":[1024.71,470,"end"]},{"t":"i","k":"si1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.71,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s10aecap0","x":746,"y":626.62,"s":"図1","vis":[]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":840,"xm":478,"ym":864,"vis":[],"side":-1,"lab":[516.29,852,"start"],"n":"ssrcx1"},{"t":"r","k":"sr2","x":761.5,"y":852,"dir":"v","vis":[],"lab":[781.79,852,"start"],"n":"sr2x1"},{"t":"r","k":"sr3","x":1045,"y":852,"dir":"v","vis":[],"lab":[1024.71,796,"end"],"n":"sr3x1"},{"t":"d","id":"u46s10aex1j4","x":761.5,"y":742,"vis":[]},{"t":"d","id":"u46s10aex1j7","x":761.5,"y":962,"vis":[]},{"t":"i","k":"si2","x0":461,"y0":828.5,"x1":461,"y1":788.5,"lab":[444.71,808.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"si2x1"},{"t":"cap","id":"u46s10aecap1","x":746,"y":1016.62,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[761.5,962],[478,962],[478,864]]},{"I":0.33,"pts":[[761.5,742],[1045,742],[1045,962],[761.5,962]]},{"I":1,"pts":[[478,840],[478,742],[761.5,742]]},{"I":0.67,"pts":[[761.5,742],[761.5,962]]}]}],"base":110,"von":["ssrc"],"bands":"volt","pts":[],"net":[["R","sr1","L0:n1","L0:n2",4,[]],["E","ssrc","L0:n1","L0:n3",1,[]],["R","srx","L0:n2","L0:n3",4,[]],["E","ssrc","L1:n1","L1:n4",1,[]],["R","sr2","L1:n1","L1:n4",12,[]],["R","sr3","L1:n1","L1:n4",24,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu46s10ax0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu46s10ax1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,440]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu46s10ax2lo","z":"lo","lines":[[[478,482],[478,580],[1045,580],[1045,500]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu46s10axx10hi","z":"hi","lines":[[[761.5,742],[478,742],[478,840]],[[761.5,742],[1045,742],[1045,822]],[[761.5,742],[761.5,822]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu46s10axx11lo","z":"lo","lines":[[[761.5,962],[478,962],[478,864]],[[761.5,962],[1045,962],[1045,882]],[[761.5,882],[761.5,962]]],"vis":[],"pts":[],"node":"L1:n4"},{"t":"w","id":"u46s10axL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10axw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10axw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10axw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10axw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10axw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10axw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1L","pts":[[478,742],[761.5,742]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w2","pts":[[478,962],[761.5,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w3","pts":[[761.5,742],[1045,742]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w4","pts":[[761.5,962],[1045,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w5","pts":[[478,742],[478,840]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w6","pts":[[478,864],[478,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w7","pts":[[761.5,742],[761.5,822]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w8","pts":[[761.5,882],[761.5,962]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w9","pts":[[1045,742],[1045,822]],"vis":[],"dash":0},{"t":"w","id":"u46s10axx1w10","pts":[[1045,882],[1045,962]],"vis":[],"dash":0},{"t":"r","k":"sr1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,323.89,null]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.29,470,"start"]},{"t":"r","k":"srx","x":1045,"y":470,"dir":"v","vis":[],"lab":[1024.71,470,"end"]},{"t":"i","k":"si1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.71,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s10axcap0","x":746,"y":626.62,"s":"図1","vis":[]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":840,"xm":478,"ym":864,"vis":[],"side":-1,"lab":[516.29,852,"start"],"n":"ssrcx1"},{"t":"r","k":"sr2","x":761.5,"y":852,"dir":"v","vis":[],"lab":[781.79,852,"start"],"n":"sr2x1"},{"t":"r","k":"sr3","x":1045,"y":852,"dir":"v","vis":[],"lab":[1024.71,796,"end"],"n":"sr3x1"},{"t":"d","id":"u46s10axx1j4","x":761.5,"y":742,"vis":[]},{"t":"d","id":"u46s10axx1j7","x":761.5,"y":962,"vis":[]},{"t":"i","k":"si2","x0":461,"y0":828.5,"x1":461,"y1":788.5,"lab":[444.71,808.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"si2x1"},{"t":"cap","id":"u46s10axcap1","x":746,"y":1016.62,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[761.5,962],[478,962],[478,864]]},{"I":0.33,"pts":[[761.5,742],[1045,742],[1045,962],[761.5,962]]},{"I":1,"pts":[[478,840],[478,742],[761.5,742]]},{"I":0.67,"pts":[[761.5,742],[761.5,962]]}]}],"base":110,"von":["ssrc"],"bands":"volt","pts":[],"net":[["R","sr1","L0:n1","L0:n2",4,[]],["E","ssrc","L0:n1","L0:n3",1,[]],["R","srx","L0:n2","L0:n3",4,[]],["E","ssrc","L1:n1","L1:n4",1,[]],["R","sr2","L1:n1","L1:n4",12,[]],["R","sr3","L1:n1","L1:n4",24,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u46s10qL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10qw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10qw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10qw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10qw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1L","pts":[[1246,360],[1529.5,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w2","pts":[[1246,580],[1529.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w3","pts":[[1529.5,360],[1813,360]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w4","pts":[[1529.5,580],[1813,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w5","pts":[[1246,360],[1246,458]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w6","pts":[[1246,482],[1246,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w7","pts":[[1529.5,360],[1529.5,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w8","pts":[[1529.5,500],[1529.5,580]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w9","pts":[[1813,360],[1813,440]],"vis":[],"dash":0},{"t":"w","id":"u46s10qx1w10","pts":[[1813,500],[1813,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,302.2,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.53,470,"start"]},{"t":"r","k":"rx","x":1045,"y":470,"dir":"v","vis":[],"lab":[1067.53,470,"start"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u46s10qcap0","x":759,"y":667.97,"s":"図1","vis":[]},{"t":"e","k":"src","dir":"v","xp":1246,"yp":458,"xm":1246,"ym":482,"vis":[],"side":-1,"lab":[1286.53,470,"start"],"n":"srcx1"},{"t":"r","k":"r2","x":1529.5,"y":470,"dir":"v","vis":[],"lab":[1552.03,470,"start"],"n":"r2x1"},{"t":"r","k":"r3","x":1813,"y":470,"dir":"v","vis":[],"lab":[1835.53,470,"start"],"n":"r3x1"},{"t":"d","id":"u46s10qx1j4","x":1529.5,"y":360,"vis":[]},{"t":"d","id":"u46s10qx1j7","x":1529.5,"y":580,"vis":[]},{"t":"i","k":"i2","x0":1229,"y0":446.5,"x1":1229,"y1":406.5,"lab":[1213,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u46s10qcap1","x":1579,"y":667.97,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1529.5,580],[1246,580],[1246,482]]},{"I":0.33,"pts":[[1529.5,360],[1813,360],[1813,580],[1529.5,580]]},{"I":1,"pts":[[1246,458],[1246,360],[1529.5,360]]},{"I":0.67,"pts":[[1529.5,360],[1529.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",4,[]],["E","src","L0:n1","L0:n3",1,[]],["R","rx","L0:n2","L0:n3",4,[]],["E","src","L1:n1","L1:n4",1,[]],["R","r2","L1:n1","L1:n4",12,[]],["R","r3","L1:n1","L1:n4",24,[]]]}
};
function tbU46s10eq(d, p, L){ tbFig_Draw(d, p, L, U46S10K.eq); }
function tbU46s10par(d, p, L){ tbFig_Draw(d, p, L, U46S10K.par); }
function tbU46s10bun(d, p, L){ tbFig_Draw(d, p, L, U46S10K.bun); }
function tbU46s10ae(d, p, L){ tbFig_Draw(d, p, L, U46S10K.ae); }
function tbU46s10ax(d, p, L){ tbFig_Draw(d, p, L, U46S10K.ax); }
function tbU46s10q(d, p, L){ tbFig_Draw(d, p, L, U46S10K.q); }
var KINDS = {u46s1xq: tbU46s1xq, u46s1xx: tbU46s1xx, u46s1lR: tbU46s1lR, u46s1lL: tbU46s1lL, u46s1col: tbU46s1col, u46s1vR: tbU46s1vR, u46s1vL: tbU46s1vL, u46s1vc: tbU46s1vc, u46s2xq: tbU46s2xq, u46s2xx: tbU46s2xx, u46s2aR: tbU46s2aR, u46s2aL: tbU46s2aL, u46s2bR: tbU46s2bR, u46s2bL: tbU46s2bL, u46s3xq: tbU46s3xq, u46s3xx: tbU46s3xx, u46s3lR: tbU46s3lR, u46s3lL: tbU46s3lL, u46s4xq: tbU46s4xq, u46s4xx: tbU46s4xx, u46s4aR: tbU46s4aR, u46s4aL: tbU46s4aL, u46s4bR: tbU46s4bR, u46s4bL: tbU46s4bL, u46s4sp: tbU46s4sp, u46s5xq: tbU46s5xq, u46s5xx: tbU46s5xx, u46s5lR: tbU46s5lR, u46s5lL: tbU46s5lL, u46s6all: tbU46s6all, u46s6rev: tbU46s6rev, u46s6lr: tbU46s6lr, u46s6lrr: tbU46s6lrr, u46s6ae: tbU46s6ae, u46s6s1e: tbU46s6s1e, u46s6s2e: tbU46s6s2e, u46s6ax: tbU46s6ax, u46s6s1x: tbU46s6s1x, u46s6s2x: tbU46s6s2x, u46s6q: tbU46s6q, u46s6esw: tbU46s6esw, u46s6xsw: tbU46s6xsw, u46s7shc: tbU46s7shc, u46s7sh1: tbU46s7sh1, u46s7sho: tbU46s7sho, u46s7brc: tbU46s7brc, u46s7bro: tbU46s7bro, u46s7ae: tbU46s7ae, u46s7re: tbU46s7re, u46s7ax: tbU46s7ax, u46s7rx: tbU46s7rx, u46s7q: tbU46s7q, u46s7esw: tbU46s7esw, u46s7xsw: tbU46s7xsw, u46s8br: tbU46s8br, u46s8ae: tbU46s8ae, u46s8ax: tbU46s8ax, u46s8q: tbU46s8q, u46s9add: tbU46s9add, u46s9sw: tbU46s9sw, u46s9ae: tbU46s9ae, u46s9ax: tbU46s9ax, u46s9q: tbU46s9q, u46s10eq: tbU46s10eq, u46s10par: tbU46s10par, u46s10bun: tbU46s10bun, u46s10ae: tbU46s10ae, u46s10ax: tbU46s10ax, u46s10q: tbU46s10q};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u46s1xq: function(p, L){ return tbGen_Flow(p, L, U46S1K.xq); },
  u46s1xx: function(p, L){ return tbGen_Flow(p, L, U46S1K.xx); },
  u46s1lR: function(p, L){ return tbGen_Flow(p, L, U46S1K.lR); },
  u46s1lL: function(p, L){ return tbGen_Flow(p, L, U46S1K.lL); },
  u46s1col: function(p, L){ return tbGen_Flow(p, L, U46S1K.col); },
  u46s1vR: function(p, L){ return tbGen_Flow(p, L, U46S1K.vR); },
  u46s1vL: function(p, L){ return tbGen_Flow(p, L, U46S1K.vL); },
  u46s1vc: function(p, L){ return tbGen_Flow(p, L, U46S1K.vc); },
  u46s2xq: function(p, L){ return tbGen_Flow(p, L, U46S2K.xq); },
  u46s2xx: function(p, L){ return tbGen_Flow(p, L, U46S2K.xx); },
  u46s2aR: function(p, L){ return tbGen_Flow(p, L, U46S2K.aR); },
  u46s2aL: function(p, L){ return tbGen_Flow(p, L, U46S2K.aL); },
  u46s2bR: function(p, L){ return tbGen_Flow(p, L, U46S2K.bR); },
  u46s2bL: function(p, L){ return tbGen_Flow(p, L, U46S2K.bL); },
  u46s3xq: function(p, L){ return tbGen_Flow(p, L, U46S3K.xq); },
  u46s3xx: function(p, L){ return tbGen_Flow(p, L, U46S3K.xx); },
  u46s3lR: function(p, L){ return tbGen_Flow(p, L, U46S3K.lR); },
  u46s3lL: function(p, L){ return tbGen_Flow(p, L, U46S3K.lL); },
  u46s4xq: function(p, L){ return tbGen_Flow(p, L, U46S4K.xq); },
  u46s4xx: function(p, L){ return tbGen_Flow(p, L, U46S4K.xx); },
  u46s4aR: function(p, L){ return tbGen_Flow(p, L, U46S4K.aR); },
  u46s4aL: function(p, L){ return tbGen_Flow(p, L, U46S4K.aL); },
  u46s4bR: function(p, L){ return tbGen_Flow(p, L, U46S4K.bR); },
  u46s4bL: function(p, L){ return tbGen_Flow(p, L, U46S4K.bL); },
  u46s4sp: function(p, L){ return tbGen_Flow(p, L, U46S4K.sp); },
  u46s5xq: function(p, L){ return tbGen_Flow(p, L, U46S5K.xq); },
  u46s5xx: function(p, L){ return tbGen_Flow(p, L, U46S5K.xx); },
  u46s5lR: function(p, L){ return tbGen_Flow(p, L, U46S5K.lR); },
  u46s5lL: function(p, L){ return tbGen_Flow(p, L, U46S5K.lL); },
  u46s6all: function(p, L){ return tbGen_Flow(p, L, U46S6K.all); },
  u46s6rev: function(p, L){ return tbGen_Flow(p, L, U46S6K.rev); },
  u46s6lr: function(p, L){ return tbGen_Flow(p, L, U46S6K.lr); },
  u46s6lrr: function(p, L){ return tbGen_Flow(p, L, U46S6K.lrr); },
  u46s6ae: function(p, L){ return tbGen_Flow(p, L, U46S6K.ae); },
  u46s6s1e: function(p, L){ return tbGen_Flow(p, L, U46S6K.s1e); },
  u46s6s2e: function(p, L){ return tbGen_Flow(p, L, U46S6K.s2e); },
  u46s6ax: function(p, L){ return tbGen_Flow(p, L, U46S6K.ax); },
  u46s6s1x: function(p, L){ return tbGen_Flow(p, L, U46S6K.s1x); },
  u46s6s2x: function(p, L){ return tbGen_Flow(p, L, U46S6K.s2x); },
  u46s6q: function(p, L){ return tbGen_Flow(p, L, U46S6K.q); },
  u46s6esw: function(p, L){ return tbGen_Flow(p, L, U46S6K.esw); },
  u46s6xsw: function(p, L){ return tbGen_Flow(p, L, U46S6K.xsw); },
  u46s7shc: function(p, L){ return tbGen_Flow(p, L, U46S7K.shc); },
  u46s7sh1: function(p, L){ return tbGen_Flow(p, L, U46S7K.sh1); },
  u46s7sho: function(p, L){ return tbGen_Flow(p, L, U46S7K.sho); },
  u46s7brc: function(p, L){ return tbGen_Flow(p, L, U46S7K.brc); },
  u46s7bro: function(p, L){ return tbGen_Flow(p, L, U46S7K.bro); },
  u46s7ae: function(p, L){ return tbGen_Flow(p, L, U46S7K.ae); },
  u46s7re: function(p, L){ return tbGen_Flow(p, L, U46S7K.re); },
  u46s7ax: function(p, L){ return tbGen_Flow(p, L, U46S7K.ax); },
  u46s7rx: function(p, L){ return tbGen_Flow(p, L, U46S7K.rx); },
  u46s7q: function(p, L){ return tbGen_Flow(p, L, U46S7K.q); },
  u46s7esw: function(p, L){ return tbGen_Flow(p, L, U46S7K.esw); },
  u46s7xsw: function(p, L){ return tbGen_Flow(p, L, U46S7K.xsw); },
  u46s8br: function(p, L){ return tbGen_Flow(p, L, U46S8K.br); },
  u46s8ae: function(p, L){ return tbGen_Flow(p, L, U46S8K.ae); },
  u46s8ax: function(p, L){ return tbGen_Flow(p, L, U46S8K.ax); },
  u46s8q: function(p, L){ return tbGen_Flow(p, L, U46S8K.q); },
  u46s9add: function(p, L){ return tbGen_Flow(p, L, U46S9K.add); },
  u46s9sw: function(p, L){ return tbGen_Flow(p, L, U46S9K.sw); },
  u46s9ae: function(p, L){ return tbGen_Flow(p, L, U46S9K.ae); },
  u46s9ax: function(p, L){ return tbGen_Flow(p, L, U46S9K.ax); },
  u46s9q: function(p, L){ return tbGen_Flow(p, L, U46S9K.q); },
  u46s10eq: function(p, L){ return tbGen_Flow(p, L, U46S10K.eq); },
  u46s10par: function(p, L){ return tbGen_Flow(p, L, U46S10K.par); },
  u46s10bun: function(p, L){ return tbGen_Flow(p, L, U46S10K.bun); },
  u46s10ae: function(p, L){ return tbGen_Flow(p, L, U46S10K.ae); },
  u46s10ax: function(p, L){ return tbGen_Flow(p, L, U46S10K.ax); },
  u46s10q: function(p, L){ return tbGen_Flow(p, L, U46S10K.q); }
};

// 46-1 合成から全体の電流、分流 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s1_par(a, b){ return a * b / (a + b); }
function tbU46s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s1_QlR(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Ro / (R2 + R3) * 10 - Math.round(It * Ro / (R2 + R3) * 10)) < 1e-9)) continue;
    var ok = (It * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (It), why: "全体の電流で止めた（並列で2つの道に分かれる）", w: 0, cut: 1}, {x: (E / Rk), why: "$R_1$ を足さず、並列に電源の電圧がそのままかかるとした", w: 1, cut: 1}, {x: (It * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (E / (R1 + R2 + R3) * Ro / (R2 + R3)), why: "並列を足して合成した（並列の部分は和分の積）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1lR", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u46s1lR", L: tbU46s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$、全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列で2つの道に分かれる　$I_{" + fmt(kn) + "} = " + fmt(It) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s1lR", p: {E: E, R1: R1, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u46s1lR：条件に合う数字が見つからない");
}
function tbU46s1_QlL(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Ro / (R2 + R3) * 10 - Math.round(It * Ro / (R2 + R3) * 10)) < 1e-9)) continue;
    var ok = (It * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (It), why: "全体の電流で止めた（並列で2つの道に分かれる）", w: 0, cut: 1}, {x: (E / Rk), why: "$R_1$ を足さず、並列に電源の電圧がそのままかかるとした", w: 1, cut: 1}, {x: (It * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (E / (R1 + R2 + R3) * Ro / (R2 + R3)), why: "並列を足して合成した（並列の部分は和分の積）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1lL", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u46s1lL", L: tbU46s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$、全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列で2つの道に分かれる　$I_{" + fmt(kn) + "} = " + fmt(It) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s1lL", p: {E: E, R1: R1, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u46s1lL：条件に合う数字が見つからない");
}
function tbU46s1_Qcol(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Ro / (R2 + R3) * 10 - Math.round(It * Ro / (R2 + R3) * 10)) < 1e-9)) continue;
    var ok = (It * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (It), why: "全体の電流で止めた（並列で2つの道に分かれる）", w: 0, cut: 1}, {x: (E / Rk), why: "$R_1$ を足さず、並列に電源の電圧がそのままかかるとした", w: 1, cut: 1}, {x: (It * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (E / (R1 + R2 + R3) * Ro / (R2 + R3)), why: "並列を足して合成した（並列の部分は和分の積）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1col", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u46s1col", L: tbU46s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$、全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列で2つの道に分かれる　$I_{" + fmt(kn) + "} = " + fmt(It) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s1col", p: {E: E, R1: R1, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u46s1col：条件に合う数字が見つからない");
}
function tbU46s1_Qsw(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = ((k - 1));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Ro / (R2 + R3) * 10 - Math.round(It * Ro / (R2 + R3) * 10)) < 1e-9)) continue;
    var ok = (It * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (It), why: "全体の電流で止めた（並列で2つの道に分かれる）", w: 0, cut: 1}, {x: (E / Rk), why: "$R_3$ を足さず、並列に電源の電圧がそのままかかるとした", w: 1, cut: 1}, {x: (It * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (E / (R1 + R2 + R3) * Ro / (R2 + R3)), why: "並列を足して合成した（並列の部分は和分の積）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1sw", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$、$R_3 = " + qv(R1, "O") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u46s1lR", L: tbU46s1_fig({}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_1 R_2}{R_1 + R_2} = " + qv(Rp, "O") + "$、全体 $R = R_3 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列で2つの道に分かれる　$I_{" + fmt(kn) + "} = " + fmt(It) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s1sw", p: {E: E, R1: R1, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u46s1sw：条件に合う数字が見つからない");
}
function tbU46s1_QvR(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Rp * 10 - Math.round(It * Rp * 10)) < 1e-9)) continue;
    var ok = (It * Rp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (E), why: "$R_1$ の分を引いていない（並列に電源の電圧がそのままかかるとした）", w: 0, cut: 1}, {x: (It * R1), why: "$R_1$ にかかる電圧を答えた（渡す電圧を取り違えた）", w: 1, cut: 1}, {x: (E * (R2 + R3) / (R1 + R2 + R3)), why: "並列を足して分けた（並列の部分は和分の積）", w: 2, cut: 0}, {x: (E / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1vR", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。並列の部分にかかる電圧 $V$ は何 V ですか。", fig: {kind: "u46s1vR", L: tbU46s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"], ["v", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$、全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列の部分を通る　$V = " + fmt(It) + " \\times " + fmt(Rp) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s1vR", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s1vR：条件に合う数字が見つからない");
}
function tbU46s1_QvL(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Rp * 10 - Math.round(It * Rp * 10)) < 1e-9)) continue;
    var ok = (It * Rp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (E), why: "$R_1$ の分を引いていない（並列に電源の電圧がそのままかかるとした）", w: 0, cut: 1}, {x: (It * R1), why: "$R_1$ にかかる電圧を答えた（渡す電圧を取り違えた）", w: 1, cut: 1}, {x: (E * (R2 + R3) / (R1 + R2 + R3)), why: "並列を足して分けた（並列の部分は和分の積）", w: 2, cut: 0}, {x: (E / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1vL", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。並列の部分にかかる電圧 $V$ は何 V ですか。", fig: {kind: "u46s1vL", L: tbU46s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"], ["v", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$、全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列の部分を通る　$V = " + fmt(It) + " \\times " + fmt(Rp) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s1vL", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s1vL：条件に合う数字が見つからない");
}
function tbU46s1_Qvc(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Rp * 10 - Math.round(It * Rp * 10)) < 1e-9)) continue;
    var ok = (It * Rp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (E), why: "$R_1$ の分を引いていない（並列に電源の電圧がそのままかかるとした）", w: 0, cut: 1}, {x: (It * R1), why: "$R_1$ にかかる電圧を答えた（渡す電圧を取り違えた）", w: 1, cut: 1}, {x: (E * (R2 + R3) / (R1 + R2 + R3)), why: "並列を足して分けた（並列の部分は和分の積）", w: 2, cut: 0}, {x: (E / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1vc", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。並列の部分にかかる電圧 $V$ は何 V ですか。", fig: {kind: "u46s1vc", L: tbU46s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"], ["v", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$、全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列の部分を通る　$V = " + fmt(It) + " \\times " + fmt(Rp) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s1vc", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s1vc：条件に合う数字が見つからない");
}
function tbU46s1_Qvsw(r){
  var gcd = tbU46s1_gcd, ratio = tbU46s1_ratio, par = tbU46s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    var It = (E / (R1 + par(R2, R3)));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && nice(Rp) && It <= 20 && abs(It * 10 - Math.round(It * 10)) < 1e-9 && abs(It * Rp * 10 - Math.round(It * Rp * 10)) < 1e-9)) continue;
    var ok = (It * Rp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s1_three4(ok, [{x: (E), why: "$R_3$ の分を引いていない（並列に電源の電圧がそのままかかるとした）", w: 0, cut: 1}, {x: (It * R1), why: "$R_3$ にかかる電圧を答えた（渡す電圧を取り違えた）", w: 1, cut: 1}, {x: (E * (R2 + R3) / (R1 + R2 + R3)), why: "並列を足して分けた（並列の部分は和分の積）", w: 2, cut: 0}, {x: (E / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s1vsw", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$、$R_3 = " + qv(R1, "O") + "$ です。並列の部分にかかる電圧 $V$ は何 V ですか。", fig: {kind: "u46s1vL", L: tbU46s1_fig({}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"], ["v", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_1 R_2}{R_1 + R_2} = " + qv(Rp, "O") + "$、全体 $R = R_3 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "全体の電流 $I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(It, "A") + "$", "この電流が並列の部分を通る　$V = " + fmt(It) + " \\times " + fmt(Rp) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s1vsw", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s1vsw：条件に合う数字が見つからない");
}
// 46-2 分流を2回 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s2_par(a, b){ return a * b / (a + b); }
function tbU46s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s2_QaR(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (T1 * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && abs(A * 100 - Math.round(A * 100)) < 1e-9)) continue;
    var ok = (T1 * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (T1), why: "1つ目の分流で止めた（右の道へ来た電流のまま。奥でさらに分かれる）", w: 0, cut: 1}, {x: (T2), why: "矢印の $I$ を $R_2$ の電流と読んだ（矢印は分かれる前の導線の上）", w: 1, cut: 1}, {x: (T1 * (1 - T2)), why: "2つ目の分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: ((1 - T1) * T2), why: "1つ目の分流の分子を取り違えた（右の道でなく $R_1$ の道へ行く割合）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2aR", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は、矢印の電流 $I$ の何倍ですか。", fig: {kind: "u46s2aR", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線の上。全体の電流 $I$ です", "右の道 $R_2 + \\dfrac{R_3 R_4}{R_3 + R_4} = " + qv(Rr, "O") + "$", "1つ目 $\\dfrac{" + fmt(X) + "}{" + fmt(X) + " + " + fmt(Rr) + "} = " + fmt(T1) + "$、2つ目 $\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + fmt(T2) + "$", "$" + fmt(T1) + " \\times " + fmt(T2) + " = " + qv(ok, "X") + "$"], chk: {form: "u46s2aR", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k}}};
  }
  throw new Error("u46s2aR：条件に合う数字が見つからない");
}
function tbU46s2_QaL(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (T1 * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && abs(A * 100 - Math.round(A * 100)) < 1e-9)) continue;
    var ok = (T1 * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (T1), why: "1つ目の分流で止めた（右の道へ来た電流のまま。奥でさらに分かれる）", w: 0, cut: 1}, {x: (T2), why: "矢印の $I$ を $R_2$ の電流と読んだ（矢印は分かれる前の導線の上）", w: 1, cut: 1}, {x: (T1 * (1 - T2)), why: "2つ目の分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: ((1 - T1) * T2), why: "1つ目の分流の分子を取り違えた（右の道でなく $R_1$ の道へ行く割合）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2aL", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は、矢印の電流 $I$ の何倍ですか。", fig: {kind: "u46s2aL", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線の上。全体の電流 $I$ です", "右の道 $R_2 + \\dfrac{R_3 R_4}{R_3 + R_4} = " + qv(Rr, "O") + "$", "1つ目 $\\dfrac{" + fmt(X) + "}{" + fmt(X) + " + " + fmt(Rr) + "} = " + fmt(T1) + "$、2つ目 $\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + fmt(T2) + "$", "$" + fmt(T1) + " \\times " + fmt(T2) + " = " + qv(ok, "X") + "$"], chk: {form: "u46s2aL", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k}}};
  }
  throw new Error("u46s2aL：条件に合う数字が見つからない");
}
function tbU46s2_QbR(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && abs(A * 100 - Math.round(A * 100)) < 1e-9)) continue;
    var ok = (T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (T1 * T2), why: "矢印の $I$ を分かれる前の電流と読んだ（矢印は $R_2$ の導線＝右の道へ来た電流）", w: 0, cut: 1}, {x: (1), why: "分流していない（右の道へ来た電流のまま）", w: 1, cut: 1}, {x: ((1 - T2)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (0.5), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2bR", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は、矢印の電流 $I$ の何倍ですか。", fig: {kind: "u46s2bR", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_2$ の導線の上。右の道へ来た電流で、ここから1回だけ分かれます", "$\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + qv(ok, "X") + "$"], chk: {form: "u46s2bR", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k}}};
  }
  throw new Error("u46s2bR：条件に合う数字が見つからない");
}
function tbU46s2_QbL(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && abs(A * 100 - Math.round(A * 100)) < 1e-9)) continue;
    var ok = (T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (T1 * T2), why: "矢印の $I$ を分かれる前の電流と読んだ（矢印は $R_2$ の導線＝右の道へ来た電流）", w: 0, cut: 1}, {x: (1), why: "分流していない（右の道へ来た電流のまま）", w: 1, cut: 1}, {x: ((1 - T2)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (0.5), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2bL", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は、矢印の電流 $I$ の何倍ですか。", fig: {kind: "u46s2bL", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_2$ の導線の上。右の道へ来た電流で、ここから1回だけ分かれます", "$\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + qv(ok, "X") + "$"], chk: {form: "u46s2bL", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k}}};
  }
  throw new Error("u46s2bL：条件に合う数字が見つからない");
}
function tbU46s2_QvaR(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (I * T1 * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && A <= 20 && abs(A * 10 - Math.round(A * 10)) < 1e-9)) continue;
    var ok = (I * T1 * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (I * T1), why: "1つ目の分流で止めた（右の道へ来た電流のまま。奥でさらに分かれる）", w: 0, cut: 1}, {x: (I * T2), why: "矢印の $I$ を $R_2$ の電流と読んだ（矢印は分かれる前の導線の上）", w: 1, cut: 1}, {x: (I * T1 * (1 - T2)), why: "2つ目の分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (I * (1 - T1) * T2), why: "1つ目の分流の分子を取り違えた（右の道でなく $R_1$ の道へ行く割合）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2vaR", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は何 A ですか。", fig: {kind: "u46s2aR", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線の上。全体の電流 $I$ です", "右の道 $R_2 + \\dfrac{R_3 R_4}{R_3 + R_4} = " + qv(Rr, "O") + "$", "1つ目 $\\dfrac{" + fmt(X) + "}{" + fmt(X) + " + " + fmt(Rr) + "} = " + fmt(T1) + "$、2つ目 $\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + fmt(T2) + "$", "$" + fmt(I) + " \\times " + fmt(T1) + " \\times " + fmt(T2) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s2vaR", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k, I: I}}};
  }
  throw new Error("u46s2vaR：条件に合う数字が見つからない");
}
function tbU46s2_QvaL(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (I * T1 * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && A <= 20 && abs(A * 10 - Math.round(A * 10)) < 1e-9)) continue;
    var ok = (I * T1 * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (I * T1), why: "1つ目の分流で止めた（右の道へ来た電流のまま。奥でさらに分かれる）", w: 0, cut: 1}, {x: (I * T2), why: "矢印の $I$ を $R_2$ の電流と読んだ（矢印は分かれる前の導線の上）", w: 1, cut: 1}, {x: (I * T1 * (1 - T2)), why: "2つ目の分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (I * (1 - T1) * T2), why: "1つ目の分流の分子を取り違えた（右の道でなく $R_1$ の道へ行く割合）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2vaL", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は何 A ですか。", fig: {kind: "u46s2aL", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線の上。全体の電流 $I$ です", "右の道 $R_2 + \\dfrac{R_3 R_4}{R_3 + R_4} = " + qv(Rr, "O") + "$", "1つ目 $\\dfrac{" + fmt(X) + "}{" + fmt(X) + " + " + fmt(Rr) + "} = " + fmt(T1) + "$、2つ目 $\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + fmt(T2) + "$", "$" + fmt(I) + " \\times " + fmt(T1) + " \\times " + fmt(T2) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s2vaL", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k, I: I}}};
  }
  throw new Error("u46s2vaL：条件に合う数字が見つからない");
}
function tbU46s2_QvbR(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (I * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && A <= 20 && abs(A * 10 - Math.round(A * 10)) < 1e-9)) continue;
    var ok = (I * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (I * T1 * T2), why: "矢印の $I$ を分かれる前の電流と読んだ（矢印は $R_2$ の導線＝右の道へ来た電流）", w: 0, cut: 1}, {x: (I * 1), why: "分流していない（右の道へ来た電流のまま）", w: 1, cut: 1}, {x: (I * (1 - T2)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (I * 0.5), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2vbR", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は何 A ですか。", fig: {kind: "u46s2bR", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_2$ の導線の上。右の道へ来た電流で、ここから1回だけ分かれます", "$" + fmt(I) + " \\times \\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s2vbR", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k, I: I}}};
  }
  throw new Error("u46s2vbR：条件に合う数字が見つからない");
}
function tbU46s2_QvbL(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 3 : 4);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (I * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && A <= 20 && abs(A * 10 - Math.round(A * 10)) < 1e-9)) continue;
    var ok = (I * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (I * T1 * T2), why: "矢印の $I$ を分かれる前の電流と読んだ（矢印は $R_2$ の導線＝右の道へ来た電流）", w: 0, cut: 1}, {x: (I * 1), why: "分流していない（右の道へ来た電流のまま）", w: 1, cut: 1}, {x: (I * (1 - T2)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (I * 0.5), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2vbL", text: "図の回路で、$R_1 = " + qv(X, "O") + "$、$R_2 = " + qv(Y, "O") + "$、$R_3 = " + qv(Z1, "O") + "$、$R_4 = " + qv(Z2, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は何 A ですか。", fig: {kind: "u46s2bL", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(X, "O")], ["r2", "{R}_2=" + qf(Y, "O")], ["r3", "{R}_3=" + qf(Z1, "O")], ["r4", "{R}_4=" + qf(Z2, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_2$ の導線の上。右の道へ来た電流で、ここから1回だけ分かれます", "$" + fmt(I) + " \\times \\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s2vbL", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k, I: I}}};
  }
  throw new Error("u46s2vbL：条件に合う数字が見つからない");
}
function tbU46s2_QsaR(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 1 : 2);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (T1 * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && abs(A * 100 - Math.round(A * 100)) < 1e-9)) continue;
    var ok = (T1 * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (T1), why: "1つ目の分流で止めた（右の道へ来た電流のまま。奥でさらに分かれる）", w: 0, cut: 1}, {x: (T2), why: "矢印の $I$ を $R_4$ の電流と読んだ（矢印は分かれる前の導線の上）", w: 1, cut: 1}, {x: (T1 * (1 - T2)), why: "2つ目の分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: ((1 - T1) * T2), why: "1つ目の分流の分子を取り違えた（右の道でなく $R_3$ の道へ行く割合）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2saR", text: "図の回路で、$R_1 = " + qv(Z1, "O") + "$、$R_2 = " + qv(Z2, "O") + "$、$R_3 = " + qv(X, "O") + "$、$R_4 = " + qv(Y, "O") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は、矢印の電流 $I$ の何倍ですか。", fig: {kind: "u46s2aR", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_3=" + qf(X, "O")], ["r2", "{R}_4=" + qf(Y, "O")], ["r3", "{R}_1=" + qf(Z1, "O")], ["r4", "{R}_2=" + qf(Z2, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線の上。全体の電流 $I$ です", "右の道 $R_4 + \\dfrac{R_1 R_2}{R_1 + R_2} = " + qv(Rr, "O") + "$", "1つ目 $\\dfrac{" + fmt(X) + "}{" + fmt(X) + " + " + fmt(Rr) + "} = " + fmt(T1) + "$、2つ目 $\\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + fmt(T2) + "$", "$" + fmt(T1) + " \\times " + fmt(T2) + " = " + qv(ok, "X") + "$"], chk: {form: "u46s2saR", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k}}};
  }
  throw new Error("u46s2saR：条件に合う数字が見つからない");
}
function tbU46s2_QsvbL(r){
  var gcd = tbU46s2_gcd, ratio = tbU46s2_ratio, par = tbU46s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Y = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Z2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Rr = (Y + par(Z1, Z2));
    var T1 = (X / (X + Y + par(Z1, Z2)));
    var T2 = ((k == 1 ? Z2 : Z1) / (Z1 + Z2));
    var kn = (k == 1 ? 1 : 2);
    var Zo = (k == 1 ? Z2 : Z1);
    var A = (I * T2);
    if (!(Z1 != Z2 && max(X, Y, Z1, Z2) / min(X, Y, Z1, Z2) <= 10 && nice(Rr) && nice(T1) && nice(T2) && abs(T1 - T2) > 1e-9 && A <= 20 && abs(A * 10 - Math.round(A * 10)) < 1e-9)) continue;
    var ok = (I * T2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s2_three4(ok, [{x: (I * T1 * T2), why: "矢印の $I$ を分かれる前の電流と読んだ（矢印は $R_4$ の導線＝右の道へ来た電流）", w: 0, cut: 1}, {x: (I * 1), why: "分流していない（右の道へ来た電流のまま）", w: 1, cut: 1}, {x: (I * (1 - T2)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (I * 0.5), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s2svbL", text: "図の回路で、$R_1 = " + qv(Z1, "O") + "$、$R_2 = " + qv(Z2, "O") + "$、$R_3 = " + qv(X, "O") + "$、$R_4 = " + qv(Y, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_" + fmt(kn) + "$ に流れる電流は何 A ですか。", fig: {kind: "u46s2bL", L: tbU46s2_fig({"src":"{E}"}, [["r1", "{R}_3=" + qf(X, "O")], ["r2", "{R}_4=" + qf(Y, "O")], ["r3", "{R}_1=" + qf(Z1, "O")], ["r4", "{R}_2=" + qf(Z2, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_4$ の導線の上。右の道へ来た電流で、ここから1回だけ分かれます", "$" + fmt(I) + " \\times \\dfrac{" + fmt(Zo) + "}{" + fmt(Z1) + " + " + fmt(Z2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s2svbL", p: {X: X, Y: Y, Z1: Z1, Z2: Z2, k: k, I: I}}};
  }
  throw new Error("u46s2svbL：条件に合う数字が見つからない");
}
// 46-3 はしごを奥から解く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s3_par(a, b){ return a * b / (a + b); }
function tbU46s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s3_QrR(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (I - I3);
    var R2 = (R3 * I3 / (I - I3));
    if (!(I > I3 && abs(R2 - Math.round(R2)) < 1e-9 && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && V <= 200)) continue;
    var ok = (R3 * I3 / (I - I3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (R3 * I3 / I), why: "全体の電流 $I$ で割った（$I_3$ を引いていない）", w: 0, cut: 1}, {x: (I - I3), why: "$I_2$ の値で止めた（オームの法則に入れていない）", w: 1, cut: 1}, {x: (R3), why: "$R_3$ の電流で割った（$R_3$ の値のまま）", w: 2, cut: 0}, {x: ((I - I3) * R3 / I3), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3rR", text: "図の回路で、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流 $I_3$ は $" + qv(I3, "A") + "$、電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ は何 Ω ですか。", fig: {kind: "u46s3lR", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_1"], ["r2", "{R}_2"], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2"], ["i3", "{I}_3=" + qf(I3, "A")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$", "$I_2 = " + fmt(I) + " - " + fmt(I3) + " = " + qv(I2, "A") + "$", "$R_2 = \\dfrac{" + fmt(V) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u46s3rR", p: {R3: R3, I3: I3, I: I}}};
  }
  throw new Error("u46s3rR：条件に合う数字が見つからない");
}
function tbU46s3_QrL(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (I - I3);
    var R2 = (R3 * I3 / (I - I3));
    if (!(I > I3 && abs(R2 - Math.round(R2)) < 1e-9 && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && V <= 200)) continue;
    var ok = (R3 * I3 / (I - I3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (R3 * I3 / I), why: "全体の電流 $I$ で割った（$I_3$ を引いていない）", w: 0, cut: 1}, {x: (I - I3), why: "$I_2$ の値で止めた（オームの法則に入れていない）", w: 1, cut: 1}, {x: (R3), why: "$R_3$ の電流で割った（$R_3$ の値のまま）", w: 2, cut: 0}, {x: ((I - I3) * R3 / I3), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3rL", text: "図の回路で、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流 $I_3$ は $" + qv(I3, "A") + "$、電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ は何 Ω ですか。", fig: {kind: "u46s3lL", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_1"], ["r2", "{R}_2"], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2"], ["i3", "{I}_3=" + qf(I3, "A")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$", "$I_2 = " + fmt(I) + " - " + fmt(I3) + " = " + qv(I2, "A") + "$", "$R_2 = \\dfrac{" + fmt(V) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u46s3rL", p: {R3: R3, I3: I3, I: I}}};
  }
  throw new Error("u46s3rL：条件に合う数字が見つからない");
}
function tbU46s3_QeR(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (R3 * I3 / R2);
    var It = (I3 + R3 * I3 / R2);
    var E = (R3 * I3 + R1 * (I3 + R3 * I3 / R2));
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && It <= 20 && E <= 200 && abs(E - Math.round(E)) < 1e-9)) continue;
    var ok = (R3 * I3 + R1 * (I3 + R3 * I3 / R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (R3 * I3), why: "並列の電圧で止めた（$R_1$ の電圧を足していない）", w: 0, cut: 1}, {x: (R3 * I3 + R1 * I3), why: "$R_1$ に $I_3$ だけが流れるとした（電流の和をとっていない）", w: 1, cut: 1}, {x: (I3 * (R1 + par(R2, R3))), why: "$I_3$ を全体の電流と読んだ", w: 2, cut: 0}, {x: (R1 * (I3 + R3 * I3 / R2)), why: "$R_1$ の電圧で止めた（並列の電圧を足していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3eR", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流 $I_3$ は $" + qv(I3, "A") + "$ です。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u46s3lR", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2"], ["i3", "{I}_3=" + qf(I3, "A")], ["i", "{I}"], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$、$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "全体の電流 $I = " + fmt(I3) + " + " + fmt(I2) + " = " + qv(It, "A") + "$", "$E = " + fmt(R1) + " \\times " + fmt(It) + " + " + fmt(V) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s3eR", p: {R1: R1, R2: R2, R3: R3, I3: I3}}};
  }
  throw new Error("u46s3eR：条件に合う数字が見つからない");
}
function tbU46s3_QeL(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (R3 * I3 / R2);
    var It = (I3 + R3 * I3 / R2);
    var E = (R3 * I3 + R1 * (I3 + R3 * I3 / R2));
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && It <= 20 && E <= 200 && abs(E - Math.round(E)) < 1e-9)) continue;
    var ok = (R3 * I3 + R1 * (I3 + R3 * I3 / R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (R3 * I3), why: "並列の電圧で止めた（$R_1$ の電圧を足していない）", w: 0, cut: 1}, {x: (R3 * I3 + R1 * I3), why: "$R_1$ に $I_3$ だけが流れるとした（電流の和をとっていない）", w: 1, cut: 1}, {x: (I3 * (R1 + par(R2, R3))), why: "$I_3$ を全体の電流と読んだ", w: 2, cut: 0}, {x: (R1 * (I3 + R3 * I3 / R2)), why: "$R_1$ の電圧で止めた（並列の電圧を足していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3eL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流 $I_3$ は $" + qv(I3, "A") + "$ です。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u46s3lL", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2"], ["i3", "{I}_3=" + qf(I3, "A")], ["i", "{I}"], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$、$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "全体の電流 $I = " + fmt(I3) + " + " + fmt(I2) + " = " + qv(It, "A") + "$", "$E = " + fmt(R1) + " \\times " + fmt(It) + " + " + fmt(V) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s3eL", p: {R1: R1, R2: R2, R3: R3, I3: I3}}};
  }
  throw new Error("u46s3eL：条件に合う数字が見つからない");
}
function tbU46s3_QiR(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (R3 * I3 / R2);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && I3 + I2 <= 20 && V <= 200)) continue;
    var ok = (I3 + R3 * I3 / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (I3), why: "$I_3$ のまま（$I_2$ を足していない）", w: 0, cut: 1}, {x: (R3 * I3 / R2), why: "$I_2$ で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: (R3 * I3 / (R2 + R3)), why: "並列の電圧を、抵抗を足して割った", w: 2, cut: 0}, {x: (I3 + R2 * I3 / R3), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3iR", text: "図の回路で、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流 $I_3$ は $" + qv(I3, "A") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s3lR", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_1"], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2"], ["i3", "{I}_3=" + qf(I3, "A")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$", "$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "並列なので電源の電流は和 $I = " + fmt(I3) + " + " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s3iR", p: {R2: R2, R3: R3, I3: I3}}};
  }
  throw new Error("u46s3iR：条件に合う数字が見つからない");
}
function tbU46s3_QiL(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (R3 * I3 / R2);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && I3 + I2 <= 20 && V <= 200)) continue;
    var ok = (I3 + R3 * I3 / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (I3), why: "$I_3$ のまま（$I_2$ を足していない）", w: 0, cut: 1}, {x: (R3 * I3 / R2), why: "$I_2$ で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: (R3 * I3 / (R2 + R3)), why: "並列の電圧を、抵抗を足して割った", w: 2, cut: 0}, {x: (I3 + R2 * I3 / R3), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3iL", text: "図の回路で、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流 $I_3$ は $" + qv(I3, "A") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s3lL", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_1"], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2"], ["i3", "{I}_3=" + qf(I3, "A")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$", "$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "並列なので電源の電流は和 $I = " + fmt(I3) + " + " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s3iL", p: {R2: R2, R3: R3, I3: I3}}};
  }
  throw new Error("u46s3iL：条件に合う数字が見つからない");
}
function tbU46s3_QsrL(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (I - I3);
    var R2 = (R3 * I3 / (I - I3));
    if (!(I > I3 && abs(R2 - Math.round(R2)) < 1e-9 && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && V <= 200)) continue;
    var ok = (R3 * I3 / (I - I3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (R3 * I3 / I), why: "全体の電流 $I$ で割った（$I_2$ を引いていない）", w: 0, cut: 1}, {x: (I - I3), why: "$I_1$ の値で止めた（オームの法則に入れていない）", w: 1, cut: 1}, {x: (R3), why: "$R_2$ の電流で割った（$R_2$ の値のまま）", w: 2, cut: 0}, {x: ((I - I3) * R3 / I3), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3srL", text: "図の回路で、$R_2 = " + qv(R3, "O") + "$ です。$R_2$ に流れる電流 $I_2$ は $" + qv(I3, "A") + "$、電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_1$ は何 Ω ですか。", fig: {kind: "u46s3lL", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_3"], ["r2", "{R}_1"], ["r3", "{R}_2=" + qf(R3, "O")], ["i2", "{I}_1"], ["i3", "{I}_2=" + qf(I3, "A")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$", "$I_1 = " + fmt(I) + " - " + fmt(I3) + " = " + qv(I2, "A") + "$", "$R_1 = \\dfrac{" + fmt(V) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u46s3srL", p: {R3: R3, I3: I3, I: I}}};
  }
  throw new Error("u46s3srL：条件に合う数字が見つからない");
}
function tbU46s3_QseR(r){
  var gcd = tbU46s3_gcd, ratio = tbU46s3_ratio, par = tbU46s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I3 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var V = (R3 * I3);
    var I2 = (R3 * I3 / R2);
    var It = (I3 + R3 * I3 / R2);
    var E = (R3 * I3 + R1 * (I3 + R3 * I3 / R2));
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && It <= 20 && E <= 200 && abs(E - Math.round(E)) < 1e-9)) continue;
    var ok = (R3 * I3 + R1 * (I3 + R3 * I3 / R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s3_three4(ok, [{x: (R3 * I3), why: "並列の電圧で止めた（$R_3$ の電圧を足していない）", w: 0, cut: 1}, {x: (R3 * I3 + R1 * I3), why: "$R_3$ に $I_2$ だけが流れるとした（電流の和をとっていない）", w: 1, cut: 1}, {x: (I3 * (R1 + par(R2, R3))), why: "$I_2$ を全体の電流と読んだ", w: 2, cut: 0}, {x: (R1 * (I3 + R3 * I3 / R2)), why: "$R_3$ の電圧で止めた（並列の電圧を足していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s3seR", text: "図の回路で、$R_3 = " + qv(R1, "O") + "$、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$ です。$R_2$ に流れる電流 $I_2$ は $" + qv(I3, "A") + "$ です。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u46s3lR", L: tbU46s3_fig({"src":"{E}"}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["i2", "{I}_1"], ["i3", "{I}_2=" + qf(I3, "A")], ["i", "{I}"], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $V = " + fmt(R3) + " \\times " + fmt(I3) + " = " + qv(V, "V") + "$、$I_1 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "全体の電流 $I = " + fmt(I3) + " + " + fmt(I2) + " = " + qv(It, "A") + "$", "$E = " + fmt(R1) + " \\times " + fmt(It) + " + " + fmt(V) + " = " + qv(ok, "V") + "$"], chk: {form: "u46s3seR", p: {R1: R1, R2: R2, R3: R3, I3: I3}}};
  }
  throw new Error("u46s3seR：条件に合う数字が見つからない");
}
// 46-4 電圧と電流から逆に解く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s4_par(a, b){ return a * b / (a + b); }
function tbU46s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s4_QaR(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = (E / (R1 + par(R2, Rx)));
    var Rt = (R1 + par(R2, Rx));
    var Rp = (par(R2, Rx));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && nice(Rp) && I <= 20 && abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (E / I - R1), why: "並列の部分の合成抵抗で止めた（並列の式に入れていない）", w: 0, cut: 1}, {x: (1 / (I / E - 1 / R2)), why: "$R_1$ を引かずに、全体の抵抗を並列の式に入れた", w: 1, cut: 1}, {x: (R2 - (E / I - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (E / I), why: "全体の合成抵抗のまま（直列の分を引いていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4aR", text: "図の回路で、$E = " + qv(E, "V") + "$ のとき電流 $I = " + qv(I, "A") + "$ が流れました。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u46s4aR", L: tbU46s4_fig({}, [["src", "{E}=" + qf(E, "V")], ["i", "{I}=" + qf(I, "A")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全体の合成抵抗 $R = \\dfrac{" + fmt(E) + "}{" + fmt(I) + "} = " + qv(Rt, "O") + "$", "並列の部分 $" + fmt(Rt) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u46s4aR", p: {E: E, R1: R1, R2: R2, I10: Math.round(I * 10)}}};
  }
  throw new Error("u46s4aR：条件に合う数字が見つからない");
}
function tbU46s4_QaL(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = (E / (R1 + par(R2, Rx)));
    var Rt = (R1 + par(R2, Rx));
    var Rp = (par(R2, Rx));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && nice(Rp) && I <= 20 && abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (E / I - R1), why: "並列の部分の合成抵抗で止めた（並列の式に入れていない）", w: 0, cut: 1}, {x: (1 / (I / E - 1 / R2)), why: "$R_1$ を引かずに、全体の抵抗を並列の式に入れた", w: 1, cut: 1}, {x: (R2 - (E / I - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (E / I), why: "全体の合成抵抗のまま（直列の分を引いていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4aL", text: "図の回路で、$E = " + qv(E, "V") + "$ のとき電流 $I = " + qv(I, "A") + "$ が流れました。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u46s4aL", L: tbU46s4_fig({}, [["src", "{E}=" + qf(E, "V")], ["i", "{I}=" + qf(I, "A")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全体の合成抵抗 $R = \\dfrac{" + fmt(E) + "}{" + fmt(I) + "} = " + qv(Rt, "O") + "$", "並列の部分 $" + fmt(Rt) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u46s4aL", p: {E: E, R1: R1, R2: R2, I10: Math.round(I * 10)}}};
  }
  throw new Error("u46s4aL：条件に合う数字が見つからない");
}
function tbU46s4_QbR(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = (E / (Rx + par(R2, R3)));
    var Rt = (Rx + par(R2, R3));
    var Rp = (par(R2, R3));
    if (!(R2 != R3 && max(Rx, R2, R3) / min(Rx, R2, R3) <= 10 && nice(Rp) && I <= 20 && abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (E / I), why: "全体の合成抵抗のまま（並列の部分を引いていない）", w: 0, cut: 1}, {x: (par(R2, R3)), why: "並列の部分の合成抵抗を答えた（引く前で止めた）", w: 1, cut: 1}, {x: (E / I - R2 - R3), why: "並列を足してから引いた", w: 2, cut: 0}, {x: (E / I - R2), why: "並列をまとめず、$R_2$ だけを引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4bR", text: "図の回路で、$E = " + qv(E, "V") + "$ のとき電流 $I = " + qv(I, "A") + "$ が流れました。$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u46s4bR", L: tbU46s4_fig({}, [["src", "{E}=" + qf(E, "V")], ["i", "{I}=" + qf(I, "A")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["rx", "{R}_x"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全体の合成抵抗 $R = \\dfrac{" + fmt(E) + "}{" + fmt(I) + "} = " + qv(Rt, "O") + "$", "並列の部分 $\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$R_x = " + fmt(Rt) + " - " + fmt(Rp) + " = " + qv(ok, "O") + "$"], chk: {form: "u46s4bR", p: {E: E, R2: R2, R3: R3, I10: Math.round(I * 10)}}};
  }
  throw new Error("u46s4bR：条件に合う数字が見つからない");
}
function tbU46s4_QbL(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = (E / (Rx + par(R2, R3)));
    var Rt = (Rx + par(R2, R3));
    var Rp = (par(R2, R3));
    if (!(R2 != R3 && max(Rx, R2, R3) / min(Rx, R2, R3) <= 10 && nice(Rp) && I <= 20 && abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (E / I), why: "全体の合成抵抗のまま（並列の部分を引いていない）", w: 0, cut: 1}, {x: (par(R2, R3)), why: "並列の部分の合成抵抗を答えた（引く前で止めた）", w: 1, cut: 1}, {x: (E / I - R2 - R3), why: "並列を足してから引いた", w: 2, cut: 0}, {x: (E / I - R2), why: "並列をまとめず、$R_2$ だけを引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4bL", text: "図の回路で、$E = " + qv(E, "V") + "$ のとき電流 $I = " + qv(I, "A") + "$ が流れました。$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u46s4bL", L: tbU46s4_fig({}, [["src", "{E}=" + qf(E, "V")], ["i", "{I}=" + qf(I, "A")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["rx", "{R}_x"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全体の合成抵抗 $R = \\dfrac{" + fmt(E) + "}{" + fmt(I) + "} = " + qv(Rt, "O") + "$", "並列の部分 $\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$R_x = " + fmt(Rt) + " - " + fmt(Rp) + " = " + qv(ok, "O") + "$"], chk: {form: "u46s4bL", p: {E: E, R2: R2, R3: R3, I10: Math.round(I * 10)}}};
  }
  throw new Error("u46s4bL：条件に合う数字が見つからない");
}
function tbU46s4_Qbig(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var b = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var S = (a + b);
    var Pv = (a * b / (a + b));
    var Pr = (a * b);
    var Big = (max(a, b));
    var Sm = (min(a, b));
    var I1 = (E / (a + b));
    var I2 = (E * (a + b) / (a * b));
    if (!(a != b && max(a, b) / min(a, b) <= 10 && abs(I1 * 10 - Math.round(I1 * 10)) < 1e-9 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && I2 <= 20 && nice(Pv))) continue;
    var ok = (max(a, b));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (a + b), why: "直列の合成抵抗（和）で止めた（並列の式を使っていない）", w: 0, cut: 1}, {x: (a * b / (a + b)), why: "並列の合成抵抗で止めた（和と積の式にしていない）", w: 1, cut: 1}, {x: (min(a, b)), why: "小さい方を答えた", w: 2, cut: 0}, {x: (a * b), why: "積で止めた（二次方程式を解いていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4big", text: "同じ電源 $E = " + qv(E, "V") + "$ に、2つの抵抗 $R_a$・$R_b$ を直列につなぐと $I_1 = " + qv(I1, "A") + "$、並列につなぐと $I_2 = " + qv(I2, "A") + "$ が流れました。大きい方の抵抗は何 Ω ですか。", fig: {kind: "u46s4sp", L: tbU46s4_fig({}, [["ra", "{R}_a"], ["rb", "{R}_b"], ["i1", "{I}_1=" + qf(I1, "A")], ["i2", "{I}_2=" + qf(I2, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["和 $R_a + R_b = \\dfrac{" + fmt(E) + "}{" + fmt(I1) + "} = " + qv(S, "O") + "$、並列 $\\dfrac{" + fmt(E) + "}{" + fmt(I2) + "} = " + qv(Pv, "O") + "$", "積 $R_a R_b = " + fmt(Pv) + " \\times " + fmt(S) + " = " + fmt(Pr) + "$", "$R_a^2 - " + fmt(S) + " R_a + " + fmt(Pr) + " = 0$ → $(R_a - " + fmt(Sm) + ")(R_a - " + fmt(Big) + ") = 0$", "大きい方 $" + qv(ok, "O") + "$"], chk: {form: "u46s4big", p: {E: E, J10: Math.round(I1 * 10), K10: Math.round(I2 * 10)}}};
  }
  throw new Error("u46s4big：条件に合う数字が見つからない");
}
function tbU46s4_Qsmall(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var b = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var S = (a + b);
    var Pv = (a * b / (a + b));
    var Pr = (a * b);
    var Big = (max(a, b));
    var Sm = (min(a, b));
    var I1 = (E / (a + b));
    var I2 = (E * (a + b) / (a * b));
    if (!(a != b && max(a, b) / min(a, b) <= 10 && abs(I1 * 10 - Math.round(I1 * 10)) < 1e-9 && abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && I2 <= 20 && nice(Pv))) continue;
    var ok = (min(a, b));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (a + b), why: "直列の合成抵抗（和）で止めた（並列の式を使っていない）", w: 0, cut: 1}, {x: (a * b / (a + b)), why: "並列の合成抵抗で止めた（和と積の式にしていない）", w: 1, cut: 1}, {x: (max(a, b)), why: "大きい方を答えた", w: 2, cut: 0}, {x: (a * b), why: "積で止めた（二次方程式を解いていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4small", text: "同じ電源 $E = " + qv(E, "V") + "$ に、2つの抵抗 $R_a$・$R_b$ を直列につなぐと $I_1 = " + qv(I1, "A") + "$、並列につなぐと $I_2 = " + qv(I2, "A") + "$ が流れました。小さい方の抵抗は何 Ω ですか。", fig: {kind: "u46s4sp", L: tbU46s4_fig({}, [["ra", "{R}_a"], ["rb", "{R}_b"], ["i1", "{I}_1=" + qf(I1, "A")], ["i2", "{I}_2=" + qf(I2, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["和 $R_a + R_b = \\dfrac{" + fmt(E) + "}{" + fmt(I1) + "} = " + qv(S, "O") + "$、並列 $\\dfrac{" + fmt(E) + "}{" + fmt(I2) + "} = " + qv(Pv, "O") + "$", "積 $R_a R_b = " + fmt(Pv) + " \\times " + fmt(S) + " = " + fmt(Pr) + "$", "$R_a^2 - " + fmt(S) + " R_a + " + fmt(Pr) + " = 0$ → $(R_a - " + fmt(Sm) + ")(R_a - " + fmt(Big) + ") = 0$", "小さい方 $" + qv(ok, "O") + "$"], chk: {form: "u46s4small", p: {E: E, J10: Math.round(I1 * 10), K10: Math.round(I2 * 10)}}};
  }
  throw new Error("u46s4small：条件に合う数字が見つからない");
}
function tbU46s4_Qsa(r){
  var gcd = tbU46s4_gcd, ratio = tbU46s4_ratio, par = tbU46s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = (E / (R1 + par(R2, Rx)));
    var Rt = (R1 + par(R2, Rx));
    var Rp = (par(R2, Rx));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && nice(Rp) && I <= 20 && abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s4_three4(ok, [{x: (E / I - R1), why: "並列の部分の合成抵抗で止めた（並列の式に入れていない）", w: 0, cut: 1}, {x: (1 / (I / E - 1 / R2)), why: "$R_2$ を引かずに、全体の抵抗を並列の式に入れた", w: 1, cut: 1}, {x: (R2 - (E / I - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (E / I), why: "全体の合成抵抗のまま（直列の分を引いていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s4sa", text: "図の回路で、$E = " + qv(E, "V") + "$ のとき電流 $I = " + qv(I, "A") + "$ が流れました。$R_2 = " + qv(R1, "O") + "$、$R_1 = " + qv(R2, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u46s4aL", L: tbU46s4_fig({}, [["src", "{E}=" + qf(E, "V")], ["i", "{I}=" + qf(I, "A")], ["r1", "{R}_2=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["rx", "{R}_x"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全体の合成抵抗 $R = \\dfrac{" + fmt(E) + "}{" + fmt(I) + "} = " + qv(Rt, "O") + "$", "並列の部分 $" + fmt(Rt) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u46s4sa", p: {E: E, R1: R1, R2: R2, I10: Math.round(I * 10)}}};
  }
  throw new Error("u46s4sa：条件に合う数字が見つからない");
}
// 46-5 電圧の引き算から電流の和 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s5_par(a, b){ return a * b / (a + b); }
function tbU46s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s5_QcR(r){
  var gcd = tbU46s5_gcd, ratio = tbU46s5_ratio, par = tbU46s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var V1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var V = (E - V1);
    var Ia = ((E - V1) / R2);
    var Ib = ((E - V1) / R3);
    if (!(V1 < E && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Ia + Ib <= 20)) continue;
    var ok = ((E - V1) / R2 + (E - V1) / R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s5_three4(ok, [{x: (E / R2 + E / R3), why: "$V_1$ を引かずに、電源の電圧で計算した", w: 0, cut: 1}, {x: ((E - V1) / R2), why: "$R_2$ の電流で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: ((E - V1) / (R2 + R3)), why: "並列を足して割った（並列の部分は和分の積）", w: 2, cut: 0}, {x: (V1 / R2 + V1 / R3), why: "$R_1$ の電圧を並列にも使った（引き算で並列の電圧を出していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s5cR", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_1$ にかかる電圧 $V_1$ は $" + qv(V1, "V") + "$ です。$R_1$ に流れる電流 $I_1$ は何 A ですか。", fig: {kind: "u46s5lR", L: tbU46s5_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["v1", "{V}_1=" + qf(V1, "V")], ["i1", "{I}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $" + fmt(E) + " - " + fmt(V1) + " = " + qv(V, "V") + "$", "$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(Ia, "A") + "$、$I_3 = \\dfrac{" + fmt(V) + "}{" + fmt(R3) + "} = " + qv(Ib, "A") + "$", "$R_1$ の電流は並列へ入る電流＝和　$I_1 = " + fmt(Ia) + " + " + fmt(Ib) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s5cR", p: {E: E, V1: V1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s5cR：条件に合う数字が見つからない");
}
function tbU46s5_QcL(r){
  var gcd = tbU46s5_gcd, ratio = tbU46s5_ratio, par = tbU46s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var V1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var V = (E - V1);
    var Ia = ((E - V1) / R2);
    var Ib = ((E - V1) / R3);
    if (!(V1 < E && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Ia + Ib <= 20)) continue;
    var ok = ((E - V1) / R2 + (E - V1) / R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s5_three4(ok, [{x: (E / R2 + E / R3), why: "$V_1$ を引かずに、電源の電圧で計算した", w: 0, cut: 1}, {x: ((E - V1) / R2), why: "$R_2$ の電流で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: ((E - V1) / (R2 + R3)), why: "並列を足して割った（並列の部分は和分の積）", w: 2, cut: 0}, {x: (V1 / R2 + V1 / R3), why: "$R_1$ の電圧を並列にも使った（引き算で並列の電圧を出していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s5cL", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_1$ にかかる電圧 $V_1$ は $" + qv(V1, "V") + "$ です。$R_1$ に流れる電流 $I_1$ は何 A ですか。", fig: {kind: "u46s5lL", L: tbU46s5_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["v1", "{V}_1=" + qf(V1, "V")], ["i1", "{I}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $" + fmt(E) + " - " + fmt(V1) + " = " + qv(V, "V") + "$", "$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(Ia, "A") + "$、$I_3 = \\dfrac{" + fmt(V) + "}{" + fmt(R3) + "} = " + qv(Ib, "A") + "$", "$R_1$ の電流は並列へ入る電流＝和　$I_1 = " + fmt(Ia) + " + " + fmt(Ib) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s5cL", p: {E: E, V1: V1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s5cL：条件に合う数字が見つからない");
}
function tbU46s5_QrR(r){
  var gcd = tbU46s5_gcd, ratio = tbU46s5_ratio, par = tbU46s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var V1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var V = (E - V1);
    var Ia = ((E - V1) / R2);
    var Ib = ((E - V1) / R3);
    var It = ((E - V1) / R2 + (E - V1) / R3);
    if (!(V1 < E && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Ia + Ib <= 20 && nice(V1 / It) && abs(V1 / It * 10 - Math.round(V1 / It * 10)) < 1e-9)) continue;
    var ok = (V1 / ((E - V1) / R2 + (E - V1) / R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s5_three4(ok, [{x: (V1 / ((E - V1) / R2)), why: "$R_2$ の電流だけで割った（2つの和をとっていない）", w: 0, cut: 1}, {x: ((E - V1) / It), why: "並列の電圧で割った（$R_1$ の電圧を使っていない）", w: 1, cut: 1}, {x: (E / It), why: "電源の電圧で割った（全体の合成抵抗を答えた）", w: 2, cut: 0}, {x: (V1 / (E / R2 + E / R3)), why: "$V_1$ を引かずに、電源の電圧で電流を出した", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s5rR", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_1$ にかかる電圧 $V_1$ は $" + qv(V1, "V") + "$ です。$R_1$ は何 Ω ですか。", fig: {kind: "u46s5lR", L: tbU46s5_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["v1", "{V}_1=" + qf(V1, "V")], ["i1", "{I}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $" + fmt(E) + " - " + fmt(V1) + " = " + qv(V, "V") + "$", "$I_1 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} + \\dfrac{" + fmt(V) + "}{" + fmt(R3) + "} = " + fmt(Ia) + " + " + fmt(Ib) + " = " + qv(It, "A") + "$", "$R_1 = \\dfrac{" + fmt(V1) + "}{" + fmt(It) + "} = " + qv(ok, "O") + "$"], chk: {form: "u46s5rR", p: {E: E, V1: V1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s5rR：条件に合う数字が見つからない");
}
function tbU46s5_QrL(r){
  var gcd = tbU46s5_gcd, ratio = tbU46s5_ratio, par = tbU46s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var V1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var V = (E - V1);
    var Ia = ((E - V1) / R2);
    var Ib = ((E - V1) / R3);
    var It = ((E - V1) / R2 + (E - V1) / R3);
    if (!(V1 < E && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Ia + Ib <= 20 && nice(V1 / It) && abs(V1 / It * 10 - Math.round(V1 / It * 10)) < 1e-9)) continue;
    var ok = (V1 / ((E - V1) / R2 + (E - V1) / R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s5_three4(ok, [{x: (V1 / ((E - V1) / R2)), why: "$R_2$ の電流だけで割った（2つの和をとっていない）", w: 0, cut: 1}, {x: ((E - V1) / It), why: "並列の電圧で割った（$R_1$ の電圧を使っていない）", w: 1, cut: 1}, {x: (E / It), why: "電源の電圧で割った（全体の合成抵抗を答えた）", w: 2, cut: 0}, {x: (V1 / (E / R2 + E / R3)), why: "$V_1$ を引かずに、電源の電圧で電流を出した", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s5rL", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_1$ にかかる電圧 $V_1$ は $" + qv(V1, "V") + "$ です。$R_1$ は何 Ω ですか。", fig: {kind: "u46s5lL", L: tbU46s5_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["v1", "{V}_1=" + qf(V1, "V")], ["i1", "{I}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $" + fmt(E) + " - " + fmt(V1) + " = " + qv(V, "V") + "$", "$I_1 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} + \\dfrac{" + fmt(V) + "}{" + fmt(R3) + "} = " + fmt(Ia) + " + " + fmt(Ib) + " = " + qv(It, "A") + "$", "$R_1 = \\dfrac{" + fmt(V1) + "}{" + fmt(It) + "} = " + qv(ok, "O") + "$"], chk: {form: "u46s5rL", p: {E: E, V1: V1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s5rL：条件に合う数字が見つからない");
}
function tbU46s5_QscL(r){
  var gcd = tbU46s5_gcd, ratio = tbU46s5_ratio, par = tbU46s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var V1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var V = (E - V1);
    var Ia = ((E - V1) / R2);
    var Ib = ((E - V1) / R3);
    if (!(V1 < E && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Ia + Ib <= 20)) continue;
    var ok = ((E - V1) / R2 + (E - V1) / R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s5_three4(ok, [{x: (E / R2 + E / R3), why: "$V_3$ を引かずに、電源の電圧で計算した", w: 0, cut: 1}, {x: ((E - V1) / R2), why: "$R_1$ の電流で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: ((E - V1) / (R2 + R3)), why: "並列を足して割った（並列の部分は和分の積）", w: 2, cut: 0}, {x: (V1 / R2 + V1 / R3), why: "$R_3$ の電圧を並列にも使った（引き算で並列の電圧を出していない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s5scL", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$ です。$R_3$ にかかる電圧 $V_3$ は $" + qv(V1, "V") + "$ です。$R_3$ に流れる電流 $I_3$ は何 A ですか。", fig: {kind: "u46s5lL", L: tbU46s5_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_3"], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["v1", "{V}_3=" + qf(V1, "V")], ["i1", "{I}_3"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $" + fmt(E) + " - " + fmt(V1) + " = " + qv(V, "V") + "$", "$I_1 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} = " + qv(Ia, "A") + "$、$I_2 = \\dfrac{" + fmt(V) + "}{" + fmt(R3) + "} = " + qv(Ib, "A") + "$", "$R_3$ の電流は並列へ入る電流＝和　$I_3 = " + fmt(Ia) + " + " + fmt(Ib) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s5scL", p: {E: E, V1: V1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s5scL：条件に合う数字が見つからない");
}
function tbU46s5_QsrR(r){
  var gcd = tbU46s5_gcd, ratio = tbU46s5_ratio, par = tbU46s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var V1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var V = (E - V1);
    var Ia = ((E - V1) / R2);
    var Ib = ((E - V1) / R3);
    var It = ((E - V1) / R2 + (E - V1) / R3);
    if (!(V1 < E && R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Ia + Ib <= 20 && nice(V1 / It) && abs(V1 / It * 10 - Math.round(V1 / It * 10)) < 1e-9)) continue;
    var ok = (V1 / ((E - V1) / R2 + (E - V1) / R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s5_three4(ok, [{x: (V1 / ((E - V1) / R2)), why: "$R_1$ の電流だけで割った（2つの和をとっていない）", w: 0, cut: 1}, {x: ((E - V1) / It), why: "並列の電圧で割った（$R_3$ の電圧を使っていない）", w: 1, cut: 1}, {x: (E / It), why: "電源の電圧で割った（全体の合成抵抗を答えた）", w: 2, cut: 0}, {x: (V1 / (E / R2 + E / R3)), why: "$V_3$ を引かずに、電源の電圧で電流を出した", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s5srR", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$ です。$R_3$ にかかる電圧 $V_3$ は $" + qv(V1, "V") + "$ です。$R_3$ は何 Ω ですか。", fig: {kind: "u46s5lR", L: tbU46s5_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_3"], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["v1", "{V}_3=" + qf(V1, "V")], ["i1", "{I}_3"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の電圧 $" + fmt(E) + " - " + fmt(V1) + " = " + qv(V, "V") + "$", "$I_3 = \\dfrac{" + fmt(V) + "}{" + fmt(R2) + "} + \\dfrac{" + fmt(V) + "}{" + fmt(R3) + "} = " + fmt(Ia) + " + " + fmt(Ib) + " = " + qv(It, "A") + "$", "$R_3 = \\dfrac{" + fmt(V1) + "}{" + fmt(It) + "} = " + qv(ok, "O") + "$"], chk: {form: "u46s5srR", p: {E: E, V1: V1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s5srR：条件に合う数字が見つからない");
}
// 46-6 重ね合わせで分流する の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s6_par(a, b){ return a * b / (a + b); }
function tbU46s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s6_Qadd(r){
  var gcd = tbU46s6_gcd, ratio = tbU46s6_ratio, par = tbU46s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var E2 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var D = (R1 * R2 + R2 * R3 + R3 * R1);
    var Rt1 = (R1 + R2 * R3 / (R2 + R3));
    var Rt2 = (R2 + R1 * R3 / (R1 + R3));
    var Ia = (E1 / Rt1);
    var Ib = (E2 / Rt2);
    var a = (E1 * R2 / D);
    var b = (E2 * R1 / D);
    if (!(E1 != E2 && !(R1 == R2 && R2 == R3) && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && a != b && Ia != Ib && Math.abs(Rt1 * 10 - Math.round(Rt1 * 10)) < 1e-9 && Math.abs(Rt2 * 10 - Math.round(Rt2 * 10)) < 1e-9 && Math.abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && Math.abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Math.abs(a * 10 - Math.round(a * 10)) < 1e-9 && Math.abs(b * 10 - Math.round(b * 10)) < 1e-9 && a + b <= 20)) continue;
    var ok = (a + b);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s6_three4(ok, [{x: (a), why: "$E_1$ の分だけ。$E_2$ の分を重ねていない", w: 0, cut: 1}, {x: (b), why: "$E_2$ の分だけ。$E_1$ の分を重ねていない", w: 1, cut: 1}, {x: (Ia + Ib), why: "分流せず、全体の電流どうしを足した", w: 2, cut: 1}, {x: (abs(a - b)), why: "同じ向きの成分を引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s6add", text: "図の回路で、$E_1 = " + qv(E1, "V") + "$、$E_2 = " + qv(E2, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流の大きさは何 A ですか。", fig: {kind: "u46s6all", L: tbU46s6_fig({"e1":"{E}_1","e2":"{E}_2","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["e1", "{E}_1=" + qf(E1, "V")], ["e2", "{E}_2=" + qf(E2, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i3", "{I}_3"], ["_v", {"e1": (E1), "e2": (E2), "r1": (R1), "r2": (R2), "r3": (R3)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E_1$ だけ　$I' = \\dfrac{" + fmt(E1) + "}{" + fmt(Rt1) + "} = " + qv(Ia, "A") + "$　$I_3' = " + fmt(Ia) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(a, "A") + "$", "$E_2$ だけ　$I'' = \\dfrac{" + fmt(E2) + "}{" + fmt(Rt2) + "} = " + qv(Ib, "A") + "$　$I_3'' = " + fmt(Ib) + " \\times \\dfrac{" + fmt(R1) + "}{" + fmt(R1) + " + " + fmt(R3) + "} = " + qv(b, "A") + "$", "どちらも同じ向きなので足す　$I_3 = " + fmt(a) + " + " + fmt(b) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s6add", p: {E1: E1, E2: E2, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s6add：条件に合う数字が見つからない");
}
function tbU46s6_Qsub(r){
  var gcd = tbU46s6_gcd, ratio = tbU46s6_ratio, par = tbU46s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var E2 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var D = (R1 * R2 + R2 * R3 + R3 * R1);
    var Rt1 = (R1 + R2 * R3 / (R2 + R3));
    var Rt2 = (R2 + R1 * R3 / (R1 + R3));
    var Ia = (E1 / Rt1);
    var Ib = (E2 / Rt2);
    var a = (E1 * R2 / D);
    var b = (E2 * R1 / D);
    if (!(E1 != E2 && !(R1 == R2 && R2 == R3) && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && a != b && Ia != Ib && Math.abs(Rt1 * 10 - Math.round(Rt1 * 10)) < 1e-9 && Math.abs(Rt2 * 10 - Math.round(Rt2 * 10)) < 1e-9 && Math.abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && Math.abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Math.abs(a * 10 - Math.round(a * 10)) < 1e-9 && Math.abs(b * 10 - Math.round(b * 10)) < 1e-9 && a <= 20 && b <= 20)) continue;
    var ok = (abs(a - b));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s6_three4(ok, [{x: (a), why: "$E_1$ の分だけ。$E_2$ の分を重ねていない", w: 0, cut: 1}, {x: (b), why: "$E_2$ の分だけ。$E_1$ の分を重ねていない", w: 1, cut: 1}, {x: (abs(Ia - Ib)), why: "分流せず、全体の電流どうしで引いた", w: 2, cut: 1}, {x: (a + b), why: "向きが逆の成分を足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s6sub", text: "図の回路で、$E_1 = " + qv(E1, "V") + "$、$E_2 = " + qv(E2, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流の大きさは何 A ですか。", fig: {kind: "u46s6rev", L: tbU46s6_fig({"e1":"{E}_1","e2":"{E}_2","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["e1", "{E}_1=" + qf(E1, "V")], ["e2", "{E}_2=" + qf(E2, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i3", "{I}_3"], ["_v", {"e1": (E1), "e2": (E2), "r1": (R1), "r2": (R2), "r3": (R3)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E_1$ だけ　$I' = \\dfrac{" + fmt(E1) + "}{" + fmt(Rt1) + "} = " + qv(Ia, "A") + "$　$I_3' = " + fmt(Ia) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(a, "A") + "$", "$E_2$ だけ　$I'' = \\dfrac{" + fmt(E2) + "}{" + fmt(Rt2) + "} = " + qv(Ib, "A") + "$　$I_3'' = " + fmt(Ib) + " \\times \\dfrac{" + fmt(R1) + "}{" + fmt(R1) + " + " + fmt(R3) + "} = " + qv(b, "A") + "$", "向きが逆なので、大きい方から引く　$I_3 = " + fmt(max(a, b)) + " - " + fmt(min(a, b)) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s6sub", p: {E1: E1, E2: E2, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s6sub：条件に合う数字が見つからない");
}
function tbU46s6_Qaddb(r){
  var gcd = tbU46s6_gcd, ratio = tbU46s6_ratio, par = tbU46s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var E2 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var D = (R1 * R2 + R2 * R3 + R3 * R1);
    var Rt1 = (R1 + R2 * R3 / (R2 + R3));
    var Rt2 = (R2 + R1 * R3 / (R1 + R3));
    var Ia = (E1 / Rt1);
    var Ib = (E2 / Rt2);
    var a = (E1 * R2 / D);
    var b = (E2 * R1 / D);
    if (!(E1 != E2 && !(R1 == R2 && R2 == R3) && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && a != b && Ia != Ib && Math.abs(Rt1 * 10 - Math.round(Rt1 * 10)) < 1e-9 && Math.abs(Rt2 * 10 - Math.round(Rt2 * 10)) < 1e-9 && Math.abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && Math.abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Math.abs(a * 10 - Math.round(a * 10)) < 1e-9 && Math.abs(b * 10 - Math.round(b * 10)) < 1e-9 && a + b <= 20)) continue;
    var ok = (a + b);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s6_three4(ok, [{x: (a), why: "$E_1$ の分だけ。$E_2$ の分を重ねていない", w: 0, cut: 1}, {x: (b), why: "$E_2$ の分だけ。$E_1$ の分を重ねていない", w: 1, cut: 1}, {x: (Ia + Ib), why: "分流せず、全体の電流どうしを足した", w: 2, cut: 1}, {x: (abs(a - b)), why: "同じ向きの成分を引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s6addb", text: "図の回路で、$E_1 = " + qv(E1, "V") + "$、$E_2 = " + qv(E2, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流の大きさは何 A ですか。", fig: {kind: "u46s6lr", L: tbU46s6_fig({"e1":"{E}_1","e2":"{E}_2","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["e1", "{E}_1=" + qf(E1, "V")], ["e2", "{E}_2=" + qf(E2, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i3", "{I}_3"], ["_v", {"e1": (E1), "e2": (E2), "r1": (R1), "r2": (R2), "r3": (R3)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E_1$ だけ　$I' = \\dfrac{" + fmt(E1) + "}{" + fmt(Rt1) + "} = " + qv(Ia, "A") + "$　$I_3' = " + fmt(Ia) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(a, "A") + "$", "$E_2$ だけ　$I'' = \\dfrac{" + fmt(E2) + "}{" + fmt(Rt2) + "} = " + qv(Ib, "A") + "$　$I_3'' = " + fmt(Ib) + " \\times \\dfrac{" + fmt(R1) + "}{" + fmt(R1) + " + " + fmt(R3) + "} = " + qv(b, "A") + "$", "どちらも同じ向きなので足す　$I_3 = " + fmt(a) + " + " + fmt(b) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s6addb", p: {E1: E1, E2: E2, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s6addb：条件に合う数字が見つからない");
}
function tbU46s6_Qsubb(r){
  var gcd = tbU46s6_gcd, ratio = tbU46s6_ratio, par = tbU46s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E1 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var E2 = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var D = (R1 * R2 + R2 * R3 + R3 * R1);
    var Rt1 = (R1 + R2 * R3 / (R2 + R3));
    var Rt2 = (R2 + R1 * R3 / (R1 + R3));
    var Ia = (E1 / Rt1);
    var Ib = (E2 / Rt2);
    var a = (E1 * R2 / D);
    var b = (E2 * R1 / D);
    if (!(E1 != E2 && !(R1 == R2 && R2 == R3) && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && a != b && Ia != Ib && Math.abs(Rt1 * 10 - Math.round(Rt1 * 10)) < 1e-9 && Math.abs(Rt2 * 10 - Math.round(Rt2 * 10)) < 1e-9 && Math.abs(Ia * 10 - Math.round(Ia * 10)) < 1e-9 && Math.abs(Ib * 10 - Math.round(Ib * 10)) < 1e-9 && Math.abs(a * 10 - Math.round(a * 10)) < 1e-9 && Math.abs(b * 10 - Math.round(b * 10)) < 1e-9 && a <= 20 && b <= 20)) continue;
    var ok = (abs(a - b));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s6_three4(ok, [{x: (a), why: "$E_1$ の分だけ。$E_2$ の分を重ねていない", w: 0, cut: 1}, {x: (b), why: "$E_2$ の分だけ。$E_1$ の分を重ねていない", w: 1, cut: 1}, {x: (abs(Ia - Ib)), why: "分流せず、全体の電流どうしで引いた", w: 2, cut: 1}, {x: (a + b), why: "向きが逆の成分を足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s6subb", text: "図の回路で、$E_1 = " + qv(E1, "V") + "$、$E_2 = " + qv(E2, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。$R_3$ に流れる電流の大きさは何 A ですか。", fig: {kind: "u46s6lrr", L: tbU46s6_fig({"e1":"{E}_1","e2":"{E}_2","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["e1", "{E}_1=" + qf(E1, "V")], ["e2", "{E}_2=" + qf(E2, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i3", "{I}_3"], ["_v", {"e1": (E1), "e2": (E2), "r1": (R1), "r2": (R2), "r3": (R3)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E_1$ だけ　$I' = \\dfrac{" + fmt(E1) + "}{" + fmt(Rt1) + "} = " + qv(Ia, "A") + "$　$I_3' = " + fmt(Ia) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(a, "A") + "$", "$E_2$ だけ　$I'' = \\dfrac{" + fmt(E2) + "}{" + fmt(Rt2) + "} = " + qv(Ib, "A") + "$　$I_3'' = " + fmt(Ib) + " \\times \\dfrac{" + fmt(R1) + "}{" + fmt(R1) + " + " + fmt(R3) + "} = " + qv(b, "A") + "$", "向きが逆なので、大きい方から引く　$I_3 = " + fmt(max(a, b)) + " - " + fmt(min(a, b)) + " = " + qv(ok, "A") + "$"], chk: {form: "u46s6subb", p: {E1: E1, E2: E2, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s6subb：条件に合う数字が見つからない");
}
// 46-7 スイッチを読んで描き直す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s7_par(a, b){ return a * b / (a + b); }
function tbU46s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s7_Qcl(r){
  var gcd = tbU46s7_gcd, ratio = tbU46s7_ratio, par = tbU46s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E / R1 <= 20 && Math.abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9)) continue;
    var ok = (E / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s7_three4(ok, [{x: (E / (R1 + R2)), why: "閉じた S を見ていない（開いた時の電流）", w: 0, cut: 1}, {x: (E / R2), why: "消す抵抗を取り違えた（$R_1$ を消した）", w: 1, cut: 1}, {x: (E / par(R1, R2)), why: "$R_1$ と $R_2$ を並列と考えた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s7cl", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。スイッチ S を閉じた時、電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s7shc", L: tbU46s7_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["sw", "S"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["S を閉じると $R_2$ の両端が導線でつながり、$R_2$ に電流は流れない。消すと $R_1$ だけ", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s7cl", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u46s7cl：条件に合う数字が見つからない");
}
function tbU46s7_Qcl1(r){
  var gcd = tbU46s7_gcd, ratio = tbU46s7_ratio, par = tbU46s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E / R2 <= 20 && Math.abs(E / R2 * 10 - Math.round(E / R2 * 10)) < 1e-9)) continue;
    var ok = (E / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s7_three4(ok, [{x: (E / (R1 + R2)), why: "閉じた S を見ていない（開いた時の電流）", w: 0, cut: 1}, {x: (E / R1), why: "消す抵抗を取り違えた（$R_2$ を消した）", w: 1, cut: 1}, {x: (E / par(R1, R2)), why: "$R_1$ と $R_2$ を並列と考えた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s7cl1", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。スイッチ S を閉じた時、電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s7sh1", L: tbU46s7_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["sw", "S"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["S を閉じると $R_1$ の両端が導線でつながり、$R_1$ に電流は流れない。消すと $R_2$ だけ", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s7cl1", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u46s7cl1：条件に合う数字が見つからない");
}
function tbU46s7_Qop(r){
  var gcd = tbU46s7_gcd, ratio = tbU46s7_ratio, par = tbU46s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E / (R1 + R2) <= 20 && Math.abs(E / (R1 + R2) * 10 - Math.round(E / (R1 + R2) * 10)) < 1e-9)) continue;
    var ok = (E / (R1 + R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s7_three4(ok, [{x: (E / R1), why: "開くと閉じるを取り違えた（$R_2$ を消した）", w: 0, cut: 1}, {x: (E / R2), why: "$R_1$ を飛ばした", w: 1, cut: 1}, {x: (E / par(R1, R2)), why: "$R_1$ と $R_2$ を並列と考えた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s7op", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。スイッチ S を開いた時、電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s7sho", L: tbU46s7_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["sw", "S"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["S を開くと S の所は切れていて、$R_1$ と $R_2$ の直列", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s7op", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u46s7op：条件に合う数字が見つからない");
}
function tbU46s7_Qpc(r){
  var gcd = tbU46s7_gcd, ratio = tbU46s7_ratio, par = tbU46s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 * R3 / (R2 + R3));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / (R1 + Rp) <= 20 && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9 && Math.abs(E / (R1 + Rp) * 10 - Math.round(E / (R1 + Rp) * 10)) < 1e-9)) continue;
    var ok = (E / (R1 + Rp));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s7_three4(ok, [{x: (E / (R1 + R2)), why: "閉じた S を見ていない（開いた時の電流）", w: 0, cut: 1}, {x: (E / R1), why: "閉じると並列の部分が短絡すると考えた", w: 1, cut: 1}, {x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 2, cut: 1}, {x: (E / (R1 + R2 + R3)), why: "並列を足して合成した", w: 3, cut: 0}, {x: (E / par(R1, R2)), why: "$R_1$ と $R_2$ を並列と考えた", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s7pc", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。スイッチ S を閉じた時、電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s7brc", L: tbU46s7_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["sw", "S"], ["i", "{I}"], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["S を閉じると $R_3$ の道がつながり、$R_2$ と $R_3$ の並列　$\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(Rp) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s7pc", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s7pc：条件に合う数字が見つからない");
}
function tbU46s7_Qpo(r){
  var gcd = tbU46s7_gcd, ratio = tbU46s7_ratio, par = tbU46s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 * R3 / (R2 + R3));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / (R1 + R2) <= 20 && Math.abs(E / (R1 + R2) * 10 - Math.round(E / (R1 + R2) * 10)) < 1e-9)) continue;
    var ok = (E / (R1 + R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s7_three4(ok, [{x: (E / (R1 + Rp)), why: "開くと閉じるを取り違えた（$R_3$ の道を残した）", w: 0, cut: 1}, {x: (E / R1), why: "開くと短絡すると考えた", w: 1, cut: 1}, {x: (E / R2), why: "$R_1$ を飛ばした", w: 2, cut: 1}, {x: (E / (R1 + R2 + R3)), why: "切れた道の $R_3$ を直列に足した", w: 3, cut: 0}, {x: (E / par(R1, R2)), why: "$R_1$ と $R_2$ を並列と考えた", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s7po", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。スイッチ S を開いた時、電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s7bro", L: tbU46s7_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["sw", "S"], ["i", "{I}"], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["S を開くと $R_3$ の道は切れて、電流が流れない。消すと $R_1$ と $R_2$ の直列", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s7po", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s7po：条件に合う数字が見つからない");
}
// 46-8 平衡と読んで電流を出す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s8.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s8_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s8_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s8_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s8_par(a, b){ return a * b / (a + b); }
function tbU46s8_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s8_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s8_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s8_Qi(r){
  var gcd = tbU46s8_gcd, ratio = tbU46s8_ratio, par = tbU46s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var s = pick(r, [2,3,4]);
    var f = pick(r, [0,1]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    var Rt = (A * B / (A + B));
    var Xw = (R1 * R3 / R2);
    if (!(max(R1, R2, R3, R4) <= 60 && R1 != R3 && max(R1, R2, R3, R4) / min(R1, R2, R3, R4) <= 10 && Math.abs(Rt * 10 - Math.round(Rt * 10)) < 1e-9 && Math.abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9 && E / Rt <= 20 && Xw != R4)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s8_three4(ok, [{x: (E / A), why: "$R_1$・$R_3$ の道だけを見た（もう1つの道を飛ばした）", w: 0, cut: 1}, {x: (E / B), why: "$R_2$・$R_x$ の道だけを見た（もう1つの道を飛ばした）", w: 1, cut: 1}, {x: (E / (A * (R2 + Xw) / (A + R2 + Xw))), why: "平衡の式を、向かい合わない抵抗の組で作った", w: 2, cut: 0}, {x: (E / (A + B)), why: "2つの道を直列に足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s8i", text: "図のブリッジで、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。スイッチ S を開いても閉じても、電源から流れる電流は変わりませんでした。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s8br", L: tbU46s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_x"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["変わらない＝S に電流が流れない＝平衡　$R_1 R_x = R_2 R_3$ から $R_x = " + qv(R4, "O") + "$", "道の抵抗は $" + qv(A, "O") + "$ と $" + qv(B, "O") + "$　合成 $\\dfrac{" + fmt(A) + " \\times " + fmt(B) + "}{" + fmt(A) + " + " + fmt(B) + "} = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s8i", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s8i：条件に合う数字が見つからない");
}
function tbU46s8_Qi3(r){
  var gcd = tbU46s8_gcd, ratio = tbU46s8_ratio, par = tbU46s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var s = pick(r, [2,3,4]);
    var f = pick(r, [0,1]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    var Rt = (A * B / (A + B));
    var Xw = (R2 * R4 / R1);
    if (!(max(R1, R2, R3, R4) <= 60 && R1 != R3 && max(R1, R2, R3, R4) / min(R1, R2, R3, R4) <= 10 && Math.abs(Rt * 10 - Math.round(Rt * 10)) < 1e-9 && Math.abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9 && E / Rt <= 20 && Xw != R3)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s8_three4(ok, [{x: (E / A), why: "$R_1$・$R_x$ の道だけを見た（もう1つの道を飛ばした）", w: 0, cut: 1}, {x: (E / B), why: "$R_2$・$R_4$ の道だけを見た（もう1つの道を飛ばした）", w: 1, cut: 1}, {x: (E / ((R1 + Xw) * B / (R1 + Xw + B))), why: "平衡の式を、向かい合わない抵抗の組で作った", w: 2, cut: 0}, {x: (E / (A + B)), why: "2つの道を直列に足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s8i3", text: "図のブリッジで、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_4 = " + qv(R4, "O") + "$ です。スイッチ S を開いても閉じても、電源から流れる電流は変わりませんでした。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u46s8br", L: tbU46s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_x"], ["r4", "{R}_4=" + qf(R4, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["変わらない＝S に電流が流れない＝平衡　$R_1 R_4 = R_2 R_x$ から $R_x = " + qv(R3, "O") + "$", "道の抵抗は $" + qv(A, "O") + "$ と $" + qv(B, "O") + "$　合成 $\\dfrac{" + fmt(A) + " \\times " + fmt(B) + "}{" + fmt(A) + " + " + fmt(B) + "} = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s8i3", p: {E: E, R1: R1, R2: R2, R4: R4}}};
  }
  throw new Error("u46s8i3：条件に合う数字が見つからない");
}
function tbU46s8_Qi4(r){
  var gcd = tbU46s8_gcd, ratio = tbU46s8_ratio, par = tbU46s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var s = pick(r, [2,3,4]);
    var f = pick(r, [0,1]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    var Rt = (A * B / (A + B));
    var Xw = (R1 * R3 / R2);
    if (!(max(R1, R2, R3, R4) <= 60 && R1 != R3 && max(R1, R2, R3, R4) / min(R1, R2, R3, R4) <= 10 && Math.abs(Rt * 10 - Math.round(Rt * 10)) < 1e-9 && Math.abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9 && E / Rt <= 20 && Xw != R4 && Math.abs(E / B * 10 - Math.round(E / B * 10)) < 1e-9)) continue;
    var ok = (E / B);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s8_three4(ok, [{x: (E / Rt), why: "全体の電流のまま。道に分けていない", w: 0, cut: 1}, {x: (E / R2), why: "$R_x$ を出さずに、$R_2$ だけで割った", w: 1, cut: 1}, {x: (E / (R2 + Xw)), why: "平衡の式を、向かい合わない抵抗の組で作った", w: 2, cut: 0}, {x: (E / A), why: "もう1つの道（$R_1$・$R_3$）の電流を答えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s8i4", text: "図のブリッジで、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。スイッチ S を開いても閉じても、電源から流れる電流は変わりませんでした。$R_x$ に流れる電流は何 A ですか。", fig: {kind: "u46s8br", L: tbU46s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","sw":"S"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_x"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["変わらない＝S に電流が流れない＝平衡　$R_1 R_x = R_2 R_3$ から $R_x = " + qv(R4, "O") + "$", "$R_2$ と $R_x$ の道は電源に直接つながる　$\\dfrac{" + fmt(E) + "}{" + fmt(R2) + " + " + fmt(R4) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s8i4", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s8i4：条件に合う数字が見つからない");
}
// 46-9 2つの図の持ち越し の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s9.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s9_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s9_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s9_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s9_par(a, b){ return a * b / (a + b); }
function tbU46s9_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s9_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s9_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s9_Qadd(r){
  var gcd = tbU46s9_gcd, ratio = tbU46s9_ratio, par = tbU46s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I1 * (R1 + R2));
    var Rp = (R2 * R3 / (R2 + R3));
    var It = (E / (R1 + Rp));
    var I3 = (It * R2 / (R2 + R3));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9 && Math.abs(It * 10 - Math.round(It * 10)) < 1e-9 && Math.abs(I3 * 10 - Math.round(I3 * 10)) < 1e-9 && It <= 20)) continue;
    var ok = (It * R2 / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s9_three4(ok, [{x: (I1 * R2 / R3), why: "図1で $R_2$ にかかっていた電圧を図2の並列にかけた", w: 0, cut: 1}, {x: (It), why: "図2の全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (E / R3), why: "図2で $R_1$ を足さず、並列に電源の電圧がかかるとした", w: 2, cut: 0}, {x: (It * R3 / (R2 + R3)), why: "分流の分子に自分の抵抗を入れた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s9add", text: "図1のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につなぐと、電流 $I_1 = " + qv(I1, "A") + "$ が流れました。図2のように、同じ電源で $R_2$ に $R_3 = " + qv(R3, "O") + "$ を並列に足しました。図2の $R_3$ に流れる電流 $I_3$ は何 A ですか。", fig: {kind: "u46s9add", L: tbU46s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i1", "{I}_1=" + qf(I1, "A")], ["i3", "{I}_3"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R2) + ") \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2の合成抵抗　$" + fmt(R1) + " + \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(R1 + Rp, "O") + "$　全体の電流 $I = " + qv(It, "A") + "$", "分流　$I_3 = " + fmt(It) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s9add", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s9add：条件に合う数字が見つからない");
}
function tbU46s9_Qadd2(r){
  var gcd = tbU46s9_gcd, ratio = tbU46s9_ratio, par = tbU46s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I1 * (R1 + R2));
    var Rp = (R2 * R3 / (R2 + R3));
    var It = (E / (R1 + Rp));
    var I2 = (It * R3 / (R2 + R3));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9 && Math.abs(It * 10 - Math.round(It * 10)) < 1e-9 && Math.abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9 && It <= 20)) continue;
    var ok = (It * R3 / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s9_three4(ok, [{x: (I1), why: "図1で $R_2$ にかかっていた電圧を図2でも使った（図1の電流のまま）", w: 0, cut: 1}, {x: (It), why: "図2の全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (It * R2 / (R2 + R3)), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}, {x: (E / R2), why: "図2で $R_1$ を足さず、並列に電源の電圧がかかるとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s9add2", text: "図1のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につなぐと、電流 $I_1 = " + qv(I1, "A") + "$ が流れました。図2のように、同じ電源で $R_2$ に $R_3 = " + qv(R3, "O") + "$ を並列に足しました。図2の $R_2$ に流れる電流 $I_2$ は何 A ですか。", fig: {kind: "u46s9add", L: tbU46s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i1", "{I}_1=" + qf(I1, "A")], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R2) + ") \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2の合成抵抗　$" + fmt(R1) + " + \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(R1 + Rp, "O") + "$　全体の電流 $I = " + qv(It, "A") + "$", "分流　$I_2 = " + fmt(It) + " \\times \\dfrac{" + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s9add2", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s9add2：条件に合う数字が見つからない");
}
function tbU46s9_Qsw(r){
  var gcd = tbU46s9_gcd, ratio = tbU46s9_ratio, par = tbU46s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Rp = (R2 * R3 / (R2 + R3));
    var E = (I1 * (R1 + Rp));
    var I3 = (E / R3);
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9 && Math.abs(I3 * 10 - Math.round(I3 * 10)) < 1e-9 && E / Rp <= 20)) continue;
    var ok = (E / R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s9_three4(ok, [{x: (I1 * R2 / (R2 + R3)), why: "図1で $R_3$ にかかっていた電圧を図2でも使った", w: 0, cut: 1}, {x: (E / Rp), why: "図2の全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (E / R2), why: "$R_2$ の電流を答えた（分流の分子の取り違え）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s9sw", text: "図1のように、スイッチ S を開いた回路では、電源から $" + qv(I1, "A") + "$ の電流が流れました。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。図2のように、同じ電源で S を閉じました。図2の $R_3$ に流れる電流 $I_3$ は何 A ですか。", fig: {kind: "u46s9sw", L: tbU46s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i3", "{I}_3"], ["sw", "S"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = \\left(" + fmt(R1) + " + \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "}\\right) \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2では S を閉じると $R_1$ が短絡し、並列に $E$ がかかる", "$I_3 = \\dfrac{" + fmt(E) + "}{" + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u46s9sw", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s9sw：条件に合う数字が見つからない");
}
function tbU46s9_Qrx(r){
  var gcd = tbU46s9_gcd, ratio = tbU46s9_ratio, par = tbU46s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I1 * (R1 + R2));
    var Rp = (R2 * R3 / (R2 + R3));
    var It = (E / (R1 + Rp));
    var Rt = (E / It);
    var Rw = (I1 * R2 / (It - I1));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9 && Math.abs(It * 10 - Math.round(It * 10)) < 1e-9 && It <= 20 && R2 - Rp > 0 && Math.abs(Rw * 10 - Math.round(Rw * 10)) < 1e-9)) continue;
    var ok = (R2 * Rp / (R2 - Rp));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s9_three4(ok, [{x: (Rp), why: "並列の部分の合成抵抗で止めた", w: 0, cut: 1}, {x: (Rw), why: "図1で $R_2$ にかかっていた電圧を図2でも使った", w: 1, cut: 1}, {x: (R2 - Rp), why: "並列の式を逆数でなく差で解いた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s9rx", text: "図1のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につなぐと、電流 $I_1 = " + qv(I1, "A") + "$ が流れました。図2のように、同じ電源で $R_2$ に $R_3$ を並列に足すと、電源の電流が $I = " + qv(It, "A") + "$ になりました。$R_3$ は何 Ω ですか。", fig: {kind: "u46s9add", L: tbU46s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3"], ["i1", "{I}_1=" + qf(I1, "A")], ["i", "{I}=" + qf(It, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R2) + ") \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2の全体の抵抗　$\\dfrac{" + fmt(E) + "}{" + fmt(It) + "} = " + qv(Rt, "O") + "$　並列の部分　$" + fmt(Rt) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_3}$　$R_3 = " + qv(ok, "O") + "$"], chk: {form: "u46s9rx", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s9rx：条件に合う数字が見つからない");
}
// 46-10 2つの条件を等しく置く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u46_s10.py から作った。手で直さない（データを直して作り直す）。）
function tbU46s10_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU46s10_ratio(a){ var g = a.reduce(function(x, y){ return tbU46s10_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU46s10_par(a, b){ return a * b / (a + b); }
function tbU46s10_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU46s10_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU46s10_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU46s10_Qeq(r){
  var gcd = tbU46s10_gcd, ratio = tbU46s10_ratio, par = tbU46s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 * R3 / (R2 + R3));
    var X = (Rp - R1);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && X >= 1 && R1 != Rp && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9)) continue;
    var ok = (Rp - R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s10_three4(ok, [{x: (Rp), why: "図2の合成抵抗で止めた（$R_1$ を引いていない）", w: 0, cut: 1}, {x: (R3 - R1), why: "並列を合成せず、$R_3$ だけと等しく置いた", w: 1, cut: 1}, {x: (R2 - R1), why: "並列を合成せず、$R_2$ だけと等しく置いた", w: 2, cut: 1}, {x: (R2 + R3 - R1), why: "並列を足して合成した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s10eq", text: "同じ電源で、図1は $R_1 = " + qv(R1, "O") + "$ と $R_x$ の直列、図2は $R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列です。図1の電流 $I_1$ と図2の電流 $I_2$ が等しい時、$R_x$ は何 Ω ですか。", fig: {kind: "u46s10eq", L: tbU46s10_fig({"src":"{E}","r1":"{R}_1","rx":"{R}_x","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源が同じで電流が等しい＝合成抵抗が等しい", "図2　$\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$" + fmt(R1) + " + R_x = " + fmt(Rp) + "$　$R_x = " + qv(ok, "O") + "$"], chk: {form: "u46s10eq", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s10eq：条件に合う数字が見つからない");
}
function tbU46s10_Qpar(r){
  var gcd = tbU46s10_gcd, ratio = tbU46s10_ratio, par = tbU46s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Xs = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Ss = (R1 * Xs / (R1 + Xs));
    var R3 = (Ss - R2);
    var W2 = (R1 * R2 / (R1 - R2));
    if (!(R1 != Xs && max(R1, Xs) / min(R1, Xs) <= 10 && Ss == Math.round(Ss) && R3 >= 2 && R3 != R2 && R2 < R1 && max(R2, R3) / min(R2, R3) <= 10 && Math.abs(W2 * 10 - Math.round(W2 * 10)) < 1e-9)) continue;
    var ok = (R1 * (R2 + R3) / (R1 - R2 - R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s10_three4(ok, [{x: (R2 + R3), why: "図2の合成抵抗で止めた（並列の式を解いていない）", w: 0, cut: 1}, {x: (W2), why: "図2を合成せず、$R_2$ だけと等しく置いた", w: 1, cut: 1}, {x: (R1 - R2 - R3), why: "並列の式を、逆数でなく差で解いた", w: 2, cut: 0}, {x: (R1 * (R2 + R3) / (R1 + R2 + R3)), why: "和分の積で、$R_1$ と合成した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s10par", text: "同じ電源で、図1は $R_1 = " + qv(R1, "O") + "$ と $R_x$ の並列、図2は $R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の直列です。図1の電流 $I_1$ と図2の電流 $I_2$ が等しい時、$R_x$ は何 Ω ですか。", fig: {kind: "u46s10par", L: tbU46s10_fig({"src":"{E}","r1":"{R}_1","rx":"{R}_x","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源が同じで電流が等しい＝合成抵抗が等しい", "図2　$" + fmt(R2) + " + " + fmt(R3) + " = " + qv(Ss, "O") + "$", "$\\dfrac{1}{" + fmt(Ss) + "} = \\dfrac{1}{" + fmt(R1) + "} + \\dfrac{1}{R_x}$　$R_x = " + qv(ok, "O") + "$"], chk: {form: "u46s10par", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u46s10par：条件に合う数字が見つからない");
}
function tbU46s10_Qbun(r){
  var gcd = tbU46s10_gcd, ratio = tbU46s10_ratio, par = tbU46s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R4 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R3 * R4 / (R3 + R4));
    var T = ((R2 + Rp) * (R3 + R4) / R4);
    var X = (T - R1);
    if (!(R3 != R4 && R2 != R3 && R2 != R4 && max(R2, R3, R4) / min(R2, R3, R4) <= 10 && X >= 1 && R2 + Rp - R1 > 0 && Math.abs(Rp * 10 - Math.round(Rp * 10)) < 1e-9 && Math.abs(T * 10 - Math.round(T * 10)) < 1e-9)) continue;
    var ok = (T - R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU46s10_three4(ok, [{x: (T), why: "$R_1 + R_x$ のまま（$R_1$ を引いていない）", w: 0, cut: 1}, {x: (R2 + Rp - R1), why: "分流せず、図2の全体の電流と等しく置いた", w: 1, cut: 1}, {x: ((R2 + Rp) * (R3 + R4) / R3 - R1), why: "分流の分子に自分の抵抗を入れた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u46s10bun", text: "同じ電源で、図1は $R_1 = " + qv(R1, "O") + "$ と $R_x$ の直列、図2は $R_2 = " + qv(R2, "O") + "$ のあとに $R_3 = " + qv(R3, "O") + "$ と $R_4 = " + qv(R4, "O") + "$ の並列です。図1の電流 $I_1$ と図2の $R_3$ の電流 $I_3$ が等しい時、$R_x$ は何 Ω ですか。", fig: {kind: "u46s10bun", L: tbU46s10_fig({"src":"{E}","r1":"{R}_1","rx":"{R}_x","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["i2", null], ["i3", "{I}_3"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図2の合成抵抗　$" + fmt(R2) + " + \\dfrac{" + fmt(R3) + " \\times " + fmt(R4) + "}{" + fmt(R3) + " + " + fmt(R4) + "} = " + qv(R2 + Rp, "O") + "$", "$I_3 = \\dfrac{E}{" + fmt(R2 + Rp) + "} \\times \\dfrac{" + fmt(R4) + "}{" + fmt(R3) + " + " + fmt(R4) + "}$、$I_1 = \\dfrac{E}{" + fmt(R1) + " + R_x}$ を等しく置く", "$" + fmt(R1) + " + R_x = " + qv(T, "O") + "$　$R_x = " + qv(ok, "O") + "$"], chk: {form: "u46s10bun", p: {R1: R1, R2: R2, R3: R3, R4: R4}}};
  }
  throw new Error("u46s10bun：条件に合う数字が見つからない");
}
var GEN = {
  // 46-1 合成から全体の電流、分流
  1: function(r){ return pick(r, [tbU46s1_QlR, tbU46s1_QlL, tbU46s1_Qcol, tbU46s1_Qsw, tbU46s1_QvR, tbU46s1_QvL, tbU46s1_Qvc, tbU46s1_Qvsw])(r); },
  // 46-2 分流を2回
  2: function(r){ return pick(r, [tbU46s2_QaR, tbU46s2_QaL, tbU46s2_QbR, tbU46s2_QbL, tbU46s2_QvaR, tbU46s2_QvaL, tbU46s2_QvbR, tbU46s2_QvbL, tbU46s2_QsaR, tbU46s2_QsvbL])(r); },
  // 46-3 はしごを奥から解く
  3: function(r){ return pick(r, [tbU46s3_QrR, tbU46s3_QrL, tbU46s3_QeR, tbU46s3_QeL, tbU46s3_QiR, tbU46s3_QiL, tbU46s3_QsrL, tbU46s3_QseR])(r); },
  // 46-4 電圧と電流から逆に解く
  4: function(r){ return pick(r, [tbU46s4_QaR, tbU46s4_QaL, tbU46s4_QbR, tbU46s4_QbL, tbU46s4_Qbig, tbU46s4_Qsmall, tbU46s4_Qsa])(r); },
  // 46-5 電圧の引き算から電流の和
  5: function(r){ return pick(r, [tbU46s5_QcR, tbU46s5_QcL, tbU46s5_QrR, tbU46s5_QrL, tbU46s5_QscL, tbU46s5_QsrR])(r); },
  // 46-6 重ね合わせで分流する
  6: function(r){ return pick(r, [tbU46s6_Qadd, tbU46s6_Qadd, tbU46s6_Qsub, tbU46s6_Qsub, tbU46s6_Qaddb, tbU46s6_Qsubb])(r); },
  // 46-7 スイッチを読んで描き直す
  7: function(r){ return pick(r, [tbU46s7_Qcl, tbU46s7_Qcl, tbU46s7_Qcl1, tbU46s7_Qop, tbU46s7_Qpc, tbU46s7_Qpc, tbU46s7_Qpo])(r); },
  // 46-8 平衡と読んで電流を出す
  8: function(r){ return pick(r, [tbU46s8_Qi, tbU46s8_Qi, tbU46s8_Qi, tbU46s8_Qi3, tbU46s8_Qi3, tbU46s8_Qi4, tbU46s8_Qi4])(r); },
  // 46-9 2つの図の持ち越し
  9: function(r){ return pick(r, [tbU46s9_Qadd, tbU46s9_Qadd, tbU46s9_Qadd, tbU46s9_Qadd2, tbU46s9_Qadd2, tbU46s9_Qsw, tbU46s9_Qsw, tbU46s9_Qrx, tbU46s9_Qrx])(r); },
  // 46-10 2つの条件を等しく置く
  10: function(r){ return pick(r, [tbU46s10_Qeq, tbU46s10_Qeq, tbU46s10_Qeq, tbU46s10_Qpar, tbU46s10_Qpar, tbU46s10_Qbun, tbU46s10_Qbun])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t46s1e","scene":"t46s1e","kind":"u46s1xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r23":"{R}_23","rd":"{R}","i":"{I}","i3":"{I}_3"},"viewbox":"319 212 740 499","band":{"want":"$R_3$ の電流 $I_3$","ans":"全体の電流 $I$ を分流の式へ"},"narr":{"start":{"co":1,"mg":0,"rdd":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①全体の合成抵抗\n②全体の電流\n③分流\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R3","I3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"並列をまとめて $R_1$ と足すと、全体の合成抵抗 $R$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"merge","emph":["R1","R23","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R$ でオームの法則を使うと、全体の電流 $I$ が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R}"]]}],"emphPre":["R","src","I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"〖この $I$ が並列で2つの道に分かれます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"split","emph":["I","R2","R3","I3"],"eq":[{"cont":false,"items":[["I_3 = I \\times \\dfrac{R_2}{R_2 + R_3}"]]}],"ans":true,"emphPre":["I","R2","R3","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"R23":["r23","r23t0","r23t1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s1xxL","u46s1xxw1","zbu46s1xx0hi"],"zlo":["u46s1xxRw","u46s1xxw11","zbu46s1xx1lo","u46s1xxw3","u46s1xxw5","u46s1xxw7","zbu46s1xx3lo","u46s1xxw9","zbu46s1xx5lo"],"zmid":["u46s1xxw2","u46s1xxw4","u46s1xxw6","zbu46s1xx2mid","u46s1xxw8","zbu46s1xx4mid","u46s1xxw10","zbu46s1xx6mid"]},"moves":{"merge":{"to":{"mg":1,"rdd":1},"dur":0.8},"split":{"to":{"mg":0},"dur":0.8}},"route":["全体の合成抵抗","全体の電流","分流"]}},{"id":"t46s1x","scene":"t46s1x","kind":"u46s1xx","lab":{"src":"{E}=36 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=12 Ω","r23":"{R}_23=4 Ω","rd":["{R}","{R}=6 Ω"],"i":["{I}","{I}=6 A"],"i3":["{I}_3","{I}_3=2 A"]},"viewbox":"319 212 740 499","band":{"want":"$R_3$ の電流 $I_3$","known":"$E = 36\\,\\mathrm{V},\\;\\; R_1 = 2\\,\\Omega,\\;\\; R_2 = 6\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega$","ans":"$I_3 = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"mg":0,"rdd":0,"rdv":0,"iv":0,"i3v":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、$R_3$ に流れる電流 $I_3$ です。","at":{"強調":1.0},"after":[],"emph":["R3","I3"]},{"text":"①全体の合成抵抗\n②全体の電流\n③分流\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R3","I3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_2$ と $R_3$ は並列なので、和分の積でまとめます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R2","R3","R23"],"eq":[{"cont":false,"items":[["R_{23} = \\dfrac{R_2 R_3}{R_2 + R_3}"],["R_{23} = \\dfrac{6 \\times 12}{6 + 12} = 4\\,\\Omega"]]}],"move":"merge","emphPre":["R2","R3"]},{"text":"$R_{23}$ と $R_1$ は直列なので、足します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R23","R"],"eq":[{"cont":false,"items":[["R = R_1 + R_{23}"],["R = 2 + 4 = 6\\,\\Omega"]]}],"move":"rval","emphPre":["R1","R23","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この $6\\,\\Omega$ が電源から見た抵抗〗なので、オームの法則に使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["R","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R}"],["I = \\dfrac{36}{6} = 6\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["R","src","I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"〖この $6\\,\\mathrm{A}$ が並列で2つの道に分かれます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"split","emph":["I","R2","R3","I3"]},{"text":"分かれる前の電流なので、分流の式に入れます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I","R2","R3","I3"],"eq":[{"cont":false,"items":[["I_3 = I \\times \\dfrac{R_2}{R_2 + R_3}"],["I_3 = 6 \\times \\dfrac{6}{6 + 12} = 2\\,\\mathrm{A}"]]}],"move":"i3val","ans":true,"emphPre":["I","R2","R3","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"R23":["r23","r23t0","r23t1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s1xxL","u46s1xxw1","zbu46s1xx0hi"],"zlo":["u46s1xxRw","u46s1xxw11","zbu46s1xx1lo","u46s1xxw3","u46s1xxw5","u46s1xxw7","zbu46s1xx3lo","u46s1xxw9","zbu46s1xx5lo"],"zmid":["u46s1xxw2","u46s1xxw4","u46s1xxw6","zbu46s1xx2mid","u46s1xxw8","zbu46s1xx4mid","u46s1xxw10","zbu46s1xx6mid"]},"moves":{"merge":{"to":{"mg":1},"dur":0.8},"rval":{"to":{"rdd":1,"rdv":1},"dur":0.8},"ival":{"to":{"iv":1},"dur":0.4},"split":{"to":{"mg":0},"dur":0.8},"i3val":{"to":{"i3v":1},"dur":0.4}},"route":["全体の合成抵抗","全体の電流","分流"]}},{"id":"t46s2e","scene":"t46s2e","kind":"u46s2xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r34":"{R}_34","i":"{I}","i2":"{I}_2","i4":"{I}_4"},"viewbox":"314 211 750 495","band":{"want":"$R_4$ の電流は $I$ の何倍か","ans":"2つの分流の割合を掛ける"},"narr":{"start":{"co":1,"mg":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①矢印の位置\n②1つ目の分流\n③2つ目の分流\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","I4"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"矢印は〖分かれる前〗の導線の上です。全体の電流 $I$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","src"]},{"text":"$R_3$ と $R_4$ をまとめると、$I$ は $R_1$ の道と右の道に分かれます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"merge","emph":["I","R1","R2","R34","I2"],"eq":[{"cont":false,"items":[["I_2 = I \\times \\dfrac{R_1}{R_1 + R_2 + R_{34}}"]]}],"emphPre":["I","R1","R2","R34","I2"]},{"text":"〖右の道へ来た $I_2$ が、奥でさらに分かれます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"move":"split","emph":["I2","R3","R4","I4"],"eq":[{"cont":false,"items":[["I_4 = I_2 \\times \\dfrac{R_3}{R_3 + R_4}"]]}],"emphPre":["I2","R3","R4","I4"]},{"text":"〖2つの割合を掛けた値〗が、$I$ の何倍かです。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["I","I4"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R3":["r3","r3t0","r3t1"],"R4":["r4","r4t0","r4t1"],"I4":["i4a","i4a:h","i4t0","i4t1"],"R34":["r34","r34t0","r34t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s2xxL","u46s2xxw1","u46s2xxw3","u46s2xxw5","u46s2xxw16","zbu46s2xx0hi"],"zlo":["u46s2xxRw","u46s2xxw2","u46s2xxw4","u46s2xxw15","u46s2xxw17","zbu46s2xx1lo","u46s2xxw7","u46s2xxw9","u46s2xxw11","zbu46s2xx3lo","u46s2xxw13","zbu46s2xx5lo"],"zmid":["u46s2xxw6","u46s2xxw8","u46s2xxw10","zbu46s2xx2mid","u46s2xxw12","zbu46s2xx4mid","u46s2xxw14","zbu46s2xx6mid"]},"moves":{"merge":{"to":{"mg":1},"dur":0.8},"split":{"to":{"mg":0},"dur":0.8}},"route":["矢印の位置","1つ目の分流","2つ目の分流"]}},{"id":"t46s2x","scene":"t46s2x","kind":"u46s2xx","lab":{"src":"{E}","r1":"{R}_1=6 Ω","r2":"{R}_2=1 Ω","r3":"{R}_3=12 Ω","r4":"{R}_4=4 Ω","r34":"{R}_34=3 Ω","i":"{I}","i2":"{I}_2","i4":"{I}_4"},"viewbox":"314 211 750 495","band":{"want":"$R_4$ の電流 $I_4$ は $I$ の何倍か","known":"$R_1 = 6\\,\\Omega,\\;\\; R_2 = 1\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega,\\;\\; R_4 = 4\\,\\Omega$","ans":"$0.45\\,\\text{倍}$"},"narr":{"start":{"co":1,"mg":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_4$ の電流 $I_4$ が $I$ の何倍かです。","at":{"強調":1.0},"after":[],"emph":["R4","I4","I"]},{"text":"①矢印の位置\n②右の道の抵抗\n③1つ目の分流\n④2つ目の分流\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R4","I4","I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"矢印 $I$ は〖分かれる前の導線の上〗です。全体の電流です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_3$ と $R_4$ は並列なので、和分の積でまとめます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["R3","R4","R34"],"eq":[{"cont":false,"items":[["R_{34} = \\dfrac{R_3 R_4}{R_3 + R_4}"],["R_{34} = \\dfrac{12 \\times 4}{12 + 4} = 3\\,\\Omega"]]}],"move":"merge","emphPre":["R3","R4","R34"]},{"text":"右の道は $R_2$ と $R_{34}$ の直列です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R2","R34"],"eq":[{"cont":false,"items":[["R_2 + R_{34} = 1 + 3 = 4\\,\\Omega"]]}],"emphPre":["R2","R34"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I$ は $R_1$ の道と右の道に分かれます。〖右の道へ行く割合〗を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["I","R1","R2","R34","I2"],"eq":[{"cont":false,"items":[["I_2 = I \\times \\dfrac{R_1}{R_1 + R_2 + R_{34}}"],["I_2 = I \\times \\dfrac{6}{6 + 4} = 0.6\\,I"]]}],"emphPre":["I","R1","R2","R34","I2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"〖右の道へ来た $0.6\\,I$ が、奥でさらに分かれます〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"move":"split","emph":["I","I2","R3","R4","I4"],"eq":[{"cont":false,"items":[["I_4 = I_2 \\times \\dfrac{R_3}{R_3 + R_4}"],["I_4 = 0.6\\,I \\times \\dfrac{12}{12 + 4}"],["I_4 = 0.45\\,I"]]}],"ans":true,"emphPre":["I","I2","R3","R4","I4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R3":["r3","r3t0","r3t1"],"R4":["r4","r4t0","r4t1"],"I4":["i4a","i4a:h","i4t0","i4t1"],"R34":["r34","r34t0","r34t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s2xxL","u46s2xxw1","u46s2xxw3","u46s2xxw5","u46s2xxw16","zbu46s2xx0hi"],"zlo":["u46s2xxRw","u46s2xxw2","u46s2xxw4","u46s2xxw15","u46s2xxw17","zbu46s2xx1lo","u46s2xxw7","u46s2xxw9","u46s2xxw11","zbu46s2xx3lo","u46s2xxw13","zbu46s2xx5lo"],"zmid":["u46s2xxw6","u46s2xxw8","u46s2xxw10","zbu46s2xx2mid","u46s2xxw12","zbu46s2xx4mid","u46s2xxw14","zbu46s2xx6mid"]},"moves":{"merge":{"to":{"mg":1},"dur":0.8},"split":{"to":{"mg":0},"dur":0.8}},"route":["矢印の位置","右の道の抵抗","1つ目の分流","2つ目の分流"]}},{"id":"t46s3e","scene":"t46s3e","kind":"u46s3xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}","i2":"{I}_2","i3":"{I}_3","v":"{V}"},"viewbox":"314 187 745 448","band":{"want":"$R_2$","ans":"並列の電圧 → もう一方の電流 → オームの法則"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①並列の電圧\n②もう一方の電流\n③オームの法則\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"$R_3$ の抵抗と電流から、並列の電圧 $V$ が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R3","I3","V"],"eq":[{"cont":false,"items":[["V = R_3 I_3"]]}],"emphPre":["R3","I3","V"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"〖並列に入る $I$ は $I_2$ と $I_3$ の和〗なので、引くと $I_2$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I","I2","I3"],"eq":[{"cont":false,"items":[["I_2 = I - I_3"]]}],"emphPre":["I","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"〖並列なので、$R_2$ にも同じ $V$ がかかります〗。オームの法則で $R_2$ を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["V","I2","R2"],"eq":[{"cont":false,"items":[["R_2 = \\dfrac{V}{I_2}"]]}],"ans":true,"emphPre":["V","I2","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R3":["r3","r3t0","r3t1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s3xxL","u46s3xxw1","zbu46s3xx0hi"],"zlo":["u46s3xxRw","u46s3xxw3","u46s3xxw5","u46s3xxw7","u46s3xxw9","zbu46s3xx1lo"],"zmid":["u46s3xxw2","u46s3xxw4","u46s3xxw6","u46s3xxw8","zbu46s3xx2mid"]},"moves":{},"route":["並列の電圧","もう一方の電流","オームの法則"]}},{"id":"t46s3x","scene":"t46s3x","kind":"u46s3xx","lab":{"src":"{E}","r1":"{R}_1","r2":["{R}_2","{R}_2=4 Ω"],"r3":"{R}_3=6 Ω","i":"{I}=5 A","i2":["{I}_2","{I}_2=3 A"],"i3":"{I}_3=2 A","v":["{V}","{V}=12 V"]},"viewbox":"314 187 745 448","band":{"want":"$R_2$","known":"$R_3 = 6\\,\\Omega,\\;\\; I_3 = 2\\,\\mathrm{A},\\;\\; I = 5\\,\\mathrm{A}$","ans":"$R_2 = 4\\,\\Omega$"},"narr":{"start":{"co":1,"vv":0,"i2v":0,"r2v":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、$R_2$ です。","at":{"強調":1.0},"after":[],"emph":["R2"]},{"text":"①並列の電圧\n②もう一方の電流\n③オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"$R_3$ の抵抗と電流が分かっているので、並列の電圧が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R3","I3","V"],"eq":[{"cont":false,"items":[["V = R_3 I_3"],["V = 6 \\times 2 = 12\\,\\mathrm{V}"]]}],"move":"vval","emphPre":["R3","I3","V"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"並列に入る $5\\,\\mathrm{A}$ は、$I_2$ と $I_3$ の和です。〖引くと $I_2$〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["I","I2","I3"],"eq":[{"cont":false,"items":[["I_2 = I - I_3"],["I_2 = 5 - 2 = 3\\,\\mathrm{A}"]]}],"move":"i2val","emphPre":["I","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"〖並列なので、$R_2$ にも同じ $12\\,\\mathrm{V}$ がかかります〗。この電圧と $I_2$ でオームの法則を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["V","I2","R2"],"eq":[{"cont":false,"items":[["R_2 = \\dfrac{V}{I_2}"],["R_2 = \\dfrac{12}{3} = 4\\,\\Omega"]]}],"move":"r2val","ans":true,"emphPre":["V","I2","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R3":["r3","r3t0","r3t1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s3xxL","u46s3xxw1","zbu46s3xx0hi"],"zlo":["u46s3xxRw","u46s3xxw3","u46s3xxw5","u46s3xxw7","u46s3xxw9","zbu46s3xx1lo"],"zmid":["u46s3xxw2","u46s3xxw4","u46s3xxw6","u46s3xxw8","zbu46s3xx2mid"]},"moves":{"vval":{"to":{"vv":1},"dur":0.4},"i2val":{"to":{"i2v":1},"dur":0.4},"r2val":{"to":{"r2v":1},"dur":0.4}},"route":["並列の電圧","もう一方の電流","オームの法則"]}},{"id":"t46s4e","scene":"t46s4e","kind":"u46s4xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","rx":"{R}_x","rd":"{R}","i":"{I}"},"viewbox":"314 212 745 460","band":{"want":"$R_x$","ans":"全体の抵抗 → 直列の分を引く → 並列の式"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①全体の合成抵抗\n②直列の分を引く\n③並列の式で解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電源の電圧と電流から、全体の合成抵抗 $R$ が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["src","I","R"],"eq":[{"cont":false,"items":[["R = \\dfrac{E}{I}"]]}],"emphPre":["src","I","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この $R$ から $R_1$ を引くと〗、並列の部分の合成抵抗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R","R1","R2","Rx"],"eq":[{"cont":false,"items":[["R_{2x} = R - R_1"]]}],"emphPre":["R","R1","R2","Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この値を並列の式に入れて〗、$R_x$ を解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R2","Rx"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R_{2x}} = \\dfrac{1}{R_2} + \\dfrac{1}{R_x}"]]}],"ans":true,"emphPre":["R2","Rx"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"Rx":["rx","rxt0","rxt1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s4xxL","u46s4xxw1","zbu46s4xx0hi"],"zlo":["u46s4xxRw","u46s4xxw3","u46s4xxw5","u46s4xxw7","u46s4xxw9","zbu46s4xx1lo"],"zmid":["u46s4xxw2","u46s4xxw4","u46s4xxw6","u46s4xxw8","zbu46s4xx2mid"]},"moves":{},"route":["全体の合成抵抗","直列の分を引く","並列の式で解く"]}},{"id":"t46s4x","scene":"t46s4x","kind":"u46s4xx","lab":{"src":"{E}=48 V","r1":"{R}_1=4 Ω","r2":"{R}_2=24 Ω","rx":["{R}_x","{R}_x=12 Ω"],"rd":["{R}","{R}=12 Ω"],"i":"{I}=4 A"},"viewbox":"314 212 745 460","band":{"want":"$R_x$","known":"$E = 48\\,\\mathrm{V},\\;\\; I = 4\\,\\mathrm{A},\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 24\\,\\Omega$","ans":"$R_x = 12\\,\\Omega$"},"narr":{"start":{"co":1,"rdd":0,"rdv":0,"rxv":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、$R_x$ です。","at":{"強調":1.0},"after":[],"emph":["Rx"]},{"text":"①全体の合成抵抗\n②直列の分を引く\n③並列の式で解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電源の電圧と電流から、全体の合成抵抗が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","I","R"],"eq":[{"cont":false,"items":[["R = \\dfrac{E}{I}"],["R = \\dfrac{48}{4} = 12\\,\\Omega"]]}],"move":"rval","emphPre":["src","I","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この $12\\,\\Omega$ から〗 $R_1$ を引くと、並列の部分の合成抵抗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R","R1","R2","Rx"],"eq":[{"cont":false,"items":[["R_{2x} = R - R_1"],["R_{2x} = 12 - 4 = 8\\,\\Omega"]]}],"emphPre":["R","R1","R2","Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この $8\\,\\Omega$ を並列の式に入れます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R2","Rx"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R_{2x}} = \\dfrac{1}{R_2} + \\dfrac{1}{R_x}"],["\\dfrac{1}{8} = \\dfrac{1}{24} + \\dfrac{1}{R_x}"]]}],"emphPre":["R2","Rx"]},{"text":"$\\dfrac{1}{24}$ を左へ移して、$R_x$ を出します。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["Rx","R"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R_x} = \\dfrac{1}{8} - \\dfrac{1}{24} = \\dfrac{2}{24}"],["R_x = 12\\,\\Omega"]]}],"move":"rxval","ans":true,"emphPre":["Rx","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"Rx":["rx","rxt0","rxt1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u46s4xxL","u46s4xxw1","zbu46s4xx0hi"],"zlo":["u46s4xxRw","u46s4xxw3","u46s4xxw5","u46s4xxw7","u46s4xxw9","zbu46s4xx1lo"],"zmid":["u46s4xxw2","u46s4xxw4","u46s4xxw6","u46s4xxw8","zbu46s4xx2mid"]},"moves":{"rval":{"to":{"rdd":1,"rdv":1},"dur":0.8},"rxval":{"to":{"rxv":1},"dur":0.4}},"route":["全体の合成抵抗","直列の分を引く","並列の式で解く"]}},{"id":"t46s5e","scene":"t46s5e","kind":"u46s5xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","v1":"{V}_1","v":"{V}","i1":"{I}_1","i2":"{I}_2","i3":"{I}_3"},"viewbox":"302 137 757 505","band":{"want":"$R_1$ の電流 $I_1$","ans":"電圧の引き算 → オームの法則 → 電流の和"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①並列の電圧\n②並列の電流\n③電流の和\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","I1"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列なので、電源の電圧から $V_1$ を引くと、並列の電圧 $V$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["src","V1","V"],"eq":[{"cont":false,"items":[["V = E - V_1"]]}],"emphPre":["src","V1","V"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖この $V$ が $R_2$ にも $R_3$ にもかかる〗ので、オームの法則で電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["V","R2","R3","I2","I3"],"eq":[{"cont":false,"items":[["I_2 = \\dfrac{V}{R_2}","I_3 = \\dfrac{V}{R_3}"]]}],"emphPre":["V","R2","R3","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"〖$R_1$ の電流は、並列へ入る電流〗なので2つの和です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R1","I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 = I_2 + I_3"]]}],"ans":true,"emphPre":["R1","I1","I2","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R2":["r2","r2t0","r2t1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"R3":["r3","r3t0","r3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"zhi":["u46s5xxL","u46s5xxw1","zbu46s5xx0hi"],"zlo":["u46s5xxRw","u46s5xxw3","u46s5xxw6","u46s5xxw8","u46s5xxw10","zbu46s5xx1lo"],"zmid":["u46s5xxw2","u46s5xxw4","u46s5xxw5","u46s5xxw7","u46s5xxw9","zbu46s5xx2mid"]},"moves":{},"route":["並列の電圧","並列の電流","電流の和"]}},{"id":"t46s5x","scene":"t46s5x","kind":"u46s5xx","lab":{"src":"{E}=30 V","r1":"{R}_1","r2":"{R}_2=5 Ω","r3":"{R}_3=20 Ω","v1":"{V}_1=10 V","v":["{V}","{V}=20 V"],"i1":["{I}_1","{I}_1=5 A"],"i2":["{I}_2","{I}_2=4 A"],"i3":["{I}_3","{I}_3=1 A"]},"viewbox":"302 137 757 505","band":{"want":"$R_1$ の電流 $I_1$","known":"$E = 30\\,\\mathrm{V},\\;\\; V_1 = 10\\,\\mathrm{V},\\;\\; R_2 = 5\\,\\Omega,\\;\\; R_3 = 20\\,\\Omega$","ans":"$I_1 = 5\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"vv":0,"i2v":0,"i3v":0,"i1v":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、$R_1$ に流れる電流 $I_1$ です。","at":{"強調":1.0},"after":[],"emph":["R1","I1"]},{"text":"①並列の電圧\n②並列の電流\n③電流の和\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","I1"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列なので、電源の電圧から $V_1$ を引くと、並列の電圧です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","V1","V"],"eq":[{"cont":false,"items":[["V = E - V_1"],["V = 30 - 10 = 20\\,\\mathrm{V}"]]}],"move":"vval","emphPre":["src","V1","V"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖この $20\\,\\mathrm{V}$ が $R_2$ にも $R_3$ にもかかります〗。オームの法則で2つの電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["V","R2","R3","I2","I3"],"eq":[{"cont":false,"items":[["I_2 = \\dfrac{V}{R_2}","I_3 = \\dfrac{V}{R_3}"],["I_2 = \\dfrac{20}{5} = 4\\,\\mathrm{A}","I_3 = \\dfrac{20}{20} = 1\\,\\mathrm{A}"]]}],"move":"i23","emphPre":["V","R2","R3","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"〖$R_1$ の電流は、並列へ入る電流〗です。2つの和をとります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["R1","I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 = I_2 + I_3"],["I_1 = 4 + 1 = 5\\,\\mathrm{A}"]]}],"move":"i1val","ans":true,"emphPre":["R1","I1","I2","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"R2":["r2","r2t0","r2t1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"R3":["r3","r3t0","r3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"zhi":["u46s5xxL","u46s5xxw1","zbu46s5xx0hi"],"zlo":["u46s5xxRw","u46s5xxw3","u46s5xxw6","u46s5xxw8","u46s5xxw10","zbu46s5xx1lo"],"zmid":["u46s5xxw2","u46s5xxw4","u46s5xxw5","u46s5xxw7","u46s5xxw9","zbu46s5xx2mid"]},"moves":{"vval":{"to":{"vv":1},"dur":0.4},"i23":{"to":{"i2v":1,"i3v":1},"dur":0.4},"i1val":{"to":{"i1v":1},"dur":0.4}},"route":["並列の電圧","並列の電流","電流の和"]}},{"id":"t46s6e","scene":"t46s6e","kind":"u46s6esw","lab":{"e1":"{E}_1","e2":"{E}_2","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i3":"{I}_3","i3a":"{I}_3'","i3b":"{I}_3''","ia":"{I}'","ib":"{I}''"},"viewbox":"262 277 1014 323","band":{"want":"電源が2つの回路の $R_3$ の電流","ans":"1つずつ全体の電流 → 分流 → 向きを見て足し引き","full":"1つの電源だけを残すと、電源1つの直並列になる。全体の電流を出して分流し、2つの成分を向きを見て足し引きする。"},"narr":{"start":{"co":1,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[9],"sents":[{"text":"電源が2つある回路で、$R_3$ の電流 $I_3$ を求めます。","at":{"強調":1.0},"after":[],"emph":["R3","I3"]},{"text":"①$E_1$ だけで全体の電流 → 分流\n②$E_2$ だけで全体の電流 → 分流\n③向きを見て足し引き\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["e1","e2","R3","I3"]}]},{"cap":null,"eqp":null,"vid":[9],"sents":[{"text":"$E_2$ を短絡すると、$E_1$ だけの直並列です。〖全体の電流を出してから分流します〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"to1","emph":["e1","R3","I3a"]},{"text":"$E_2$ だけも同じです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"to2","emph":["e2","R3","I3b"]},{"text":"元の回路に戻り、〖2つの成分を向きを見て足し引き〗します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"move":"to0","emph":["R3","I3"],"ans":true}]}],"groups":{"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"e1":["ce1:L","ce1:S","ppe1","pme1","ee10","ee11","ce1x1:L","ce1x1:S","ppe1x1","pme1x1","ee1x10","ee1x11"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"e2":["ce2:L","ce2:S","ppe2","pme2","ee20","ee21","ce2x2:L","ce2x2:S","ppe2x2","pme2x2","ee2x20","ee2x21"],"zhi":["u46s6eswL","u46s6esww7","zbu46s6esw0hi","u46s6eswx1L","u46s6eswx1w7","zbu46s6eswx10hi","u46s6eswx2w5","u46s6eswx2w11","zbu46s6eswx22hi"],"zmid":["u46s6esww2","u46s6esww4","u46s6esww9","zbu46s6esw1mid","u46s6esww5","u46s6esww11","zbu46s6esw3mid","u46s6eswx1w2","u46s6eswx1w4","u46s6eswx1w9","zbu46s6eswx11mid","u46s6eswx2w2","u46s6eswx2w4","u46s6eswx2w9","zbu46s6eswx21mid"],"zlo":["u46s6esww3","u46s6esww6","u46s6esww8","u46s6esww10","u46s6esww12","zbu46s6esw2lo","u46s6eswx1w3","u46s6eswx1w5","u46s6eswx1w6","u46s6eswx1w8","u46s6eswx1w10","u46s6eswx1w11","u46s6eswx1w12","zbu46s6eswx12lo","u46s6eswx2L","u46s6eswx2w3","u46s6eswx2w6","u46s6eswx2w7","u46s6eswx2w8","u46s6eswx2w10","u46s6eswx2w12","zbu46s6eswx20lo"],"Ia":["iax1a","iax1a:h","iax1t0","iax1t1"],"I3a":["i3ax1a","i3ax1a:h","i3ax1t0","i3ax1t1"],"I3b":["i3bx2a","i3bx2a:h","i3bx2t0","i3bx2t1"],"Ib":["ibx2a","ibx2a:h","ibx2t0","ibx2t1"]},"moves":{"to1":{"to":{"t":1},"dur":0.5},"to2":{"to":{"t":2},"dur":0.5},"to0":{"to":{"t":0},"dur":0.5}},"route":["$E_1$ だけ","$E_2$ だけ","足し引き"]}},{"id":"t46s6x","scene":"t46s6x","kind":"u46s6xsw","lab":{"e1":"{E}_1=12 V","e2":"{E}_2=6 V","r1":"{R}_1=2 Ω","r2":"{R}_2=2 Ω","r3":"{R}_3=2 Ω","i3":["{I}_3","{I}_3=3 A"],"i3a":["{I}_3'","{I}_3'=2 A"],"i3b":["{I}_3''","{I}_3''=1 A"],"ia":["{I}'","{I}'=4 A"],"ib":["{I}''","{I}''=2 A"]},"viewbox":"262 277 1014 323","band":{"want":"$R_3$ の電流 $I_3$","known":"$E_1 = 12\\,\\mathrm{V},\\;\\; E_2 = 6\\,\\mathrm{V},\\;\\; R_1 = R_2 = R_3 = 2\\,\\Omega$","ans":"$I_3 = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"t":0,"i3v":0,"i3av":0,"i3bv":0,"iav":0,"ibv":0},"steps":[{"cap":null,"eqp":null,"vid":[9],"sents":[{"text":"求めるのは、$R_3$ の電流 $I_3$ です。","at":{"強調":1.0},"after":[],"emph":["R3","I3"]},{"text":"①$E_1$ だけ\n②$E_2$ だけ\n③向きを見て合わせる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R3","I3","e1","e2"]}]},{"cap":null,"eqp":null,"vid":[3,9],"sents":[{"text":"$E_2$ を短絡し、$E_1$ だけを残します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"to1","emph":["e1"]},{"text":"$R_2$ と $R_3$ の並列に $R_1$ を足し、全体の電流 $I'$ を出します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["e1","R1","R2","R3","Ia"],"eq":[{"cont":false,"items":[["2 + \\dfrac{2 \\times 2}{2 + 2} = 3\\,\\Omega"],["I' = \\dfrac{12}{3} = 4\\,\\mathrm{A}"]]}],"move":"ia","emphPre":["e1","R1","R2","R3","Ia"]},{"text":"〖この電流が $R_2$ と $R_3$ に分かれます〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Ia","R2","R3","I3a"],"eq":[{"cont":false,"items":[["I_3' = 4 \\times \\dfrac{2}{2 + 2} = 2\\,\\mathrm{A}"]]}],"move":"a","emphPre":["Ia","R2","R3","I3a"]}]},{"cap":null,"eqp":null,"vid":[3,9],"sents":[{"text":"$E_1$ を短絡し、$E_2$ だけを残します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"to2","emph":["e2"]},{"text":"同じように合成して、全体の電流 $I''$ を出します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["e2","R1","R2","R3","Ib"],"eq":[{"cont":false,"items":[["2 + \\dfrac{2 \\times 2}{2 + 2} = 3\\,\\Omega"],["I'' = \\dfrac{6}{3} = 2\\,\\mathrm{A}"]]}],"move":"ib","emphPre":["e2","R1","R2","R3","Ib"]},{"text":"〖この電流が $R_1$ と $R_3$ に分かれます〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Ib","R1","R3","I3b"],"eq":[{"cont":false,"items":[["I_3'' = 2 \\times \\dfrac{2}{2 + 2} = 1\\,\\mathrm{A}"]]}],"move":"b","emphPre":["Ib","R1","R3","I3b"]}]},{"cap":null,"eqp":null,"vid":[9],"sents":[{"text":"元の回路に戻ります。$I_3'$ も $I_3''$ も下向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"to0","emph":["R3","I3"]},{"text":"〖同じ向きなので足します〗。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R3","I3"],"eq":[{"cont":false,"items":[["I_3 = I_3' + I_3'' = 2 + 1 = 3\\,\\mathrm{A}"]]}],"move":"i3","ans":true,"emphPre":["R3","I3"]}]}],"groups":{"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"e1":["ce1:L","ce1:S","ppe1","pme1","ee10","ee11","ce1x1:L","ce1x1:S","ppe1x1","pme1x1","ee1x10","ee1x11"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"e2":["ce2:L","ce2:S","ppe2","pme2","ee20","ee21","ce2x2:L","ce2x2:S","ppe2x2","pme2x2","ee2x20","ee2x21"],"zhi":["u46s6xswL","u46s6xsww7","zbu46s6xsw0hi","u46s6xswx1L","u46s6xswx1w7","zbu46s6xswx10hi","u46s6xswx2w5","u46s6xswx2w11","zbu46s6xswx22hi"],"zmid":["u46s6xsww2","u46s6xsww4","u46s6xsww9","zbu46s6xsw1mid","u46s6xsww5","u46s6xsww11","zbu46s6xsw3mid","u46s6xswx1w2","u46s6xswx1w4","u46s6xswx1w9","zbu46s6xswx11mid","u46s6xswx2w2","u46s6xswx2w4","u46s6xswx2w9","zbu46s6xswx21mid"],"zlo":["u46s6xsww3","u46s6xsww6","u46s6xsww8","u46s6xsww10","u46s6xsww12","zbu46s6xsw2lo","u46s6xswx1w3","u46s6xswx1w5","u46s6xswx1w6","u46s6xswx1w8","u46s6xswx1w10","u46s6xswx1w11","u46s6xswx1w12","zbu46s6xswx12lo","u46s6xswx2L","u46s6xswx2w3","u46s6xswx2w6","u46s6xswx2w7","u46s6xswx2w8","u46s6xswx2w10","u46s6xswx2w12","zbu46s6xswx20lo"],"Ia":["iax1a","iax1a:h","iax1t0","iax1t1"],"I3a":["i3ax1a","i3ax1a:h","i3ax1t0","i3ax1t1"],"I3b":["i3bx2a","i3bx2a:h","i3bx2t0","i3bx2t1"],"Ib":["ibx2a","ibx2a:h","ibx2t0","ibx2t1"]},"moves":{"to1":{"to":{"t":1},"dur":0.5},"to2":{"to":{"t":2},"dur":0.5},"to0":{"to":{"t":0},"dur":0.5},"ia":{"to":{"iav":1},"dur":0.4},"ib":{"to":{"ibv":1},"dur":0.4},"a":{"to":{"i3av":1},"dur":0.4},"b":{"to":{"i3bv":1},"dur":0.4},"i3":{"to":{"i3v":1},"dur":0.4}},"route":["$E_1$ だけ","$E_2$ だけ","向きを見て合わせる"]}},{"id":"t46s7e","scene":"t46s7e","kind":"u46s7esw","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","sw":"S","i":"{I}"},"viewbox":"319 212 740 429","band":{"want":"スイッチを閉じた時の電流","ans":"閉じる＝導線。短絡した抵抗を消して描き直す","full":"スイッチを閉じると導線でつながる。閉じたスイッチと並列の抵抗には電流が流れないので、消して描き直してから解く。"},"narr":{"start":{"co":1,"t":0,"swc":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"スイッチ S を閉じた時の電流 $I$ を求めます。","at":{"強調":1.0},"after":[],"emph":["SW","I"]},{"text":"①スイッチを読む\n②短絡した所を消して描き直す\n③オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["SW","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖閉じる＝導線でつながる〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"on","emph":["SW"]},{"text":"$R_2$ の両端が S でつながるので、〖$R_2$ に電流は流れません〗。","at":{"強調":1.0},"after":[],"emph":["SW","R2"]},{"text":"消して描き直すと、$R_1$ だけの回路です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"move":"redraw","emph":["src","R1"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1"],"sh":["u46s7esww2","u46s7esww3","u46s7esww4","u46s7esww5","u46s7esww6","u46s7esww7","u46s7eswj113","u46s7eswj214"],"R2":["r2","r2t0","r2t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"I":["ia","ia:h","it0","it1","ix1a","ix1a:h","ix1t0","ix1t1"],"zhi":["u46s7eswL","u46s7esww1","zbu46s7esw0hi","u46s7eswx1L","u46s7eswx1w1","zbu46s7eswx10hi"],"zlo":["u46s7eswRw","u46s7esww3","u46s7esww5","u46s7esww7","u46s7esww9","zbu46s7esw1lo","u46s7esww2","u46s7esww4","u46s7esww6","u46s7esww8","zbu46s7esw2lo","u46s7eswx1Rw","u46s7eswx1w2","zbu46s7eswx11lo"]},"moves":{"on":{"to":{"swc":1},"dur":0.5},"redraw":{"to":{"t":1},"dur":0.6}},"route":["スイッチを読む","描き直す","オームの法則"]}},{"id":"t46s7x","scene":"t46s7x","kind":"u46s7xsw","lab":{"src":"{E}=24 V","r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","sw":"S","i":["{I}","{I}=6 A"]},"viewbox":"319 212 740 429","band":{"want":"S を閉じた時の電流 $I$","known":"$E = 24\\,\\mathrm{V},\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega$","ans":"$I = 6\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"t":0,"swc":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めるのは、S を閉じた時の電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["SW","I"]},{"text":"①スイッチを読む\n②描き直す\n③オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["SW","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"S を閉じると、〖S は導線〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"on","emph":["SW"]},{"text":"$R_2$ の両端が S でつながり、短絡しています。〖$R_2$ に電流は流れません〗。","at":{"強調":1.0},"after":[],"emph":["SW","R2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"$R_2$ を消して描き直すと、$R_1$ だけの回路です。この形でオームの法則を使います。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"redraw","emph":["src","R1"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電源の電圧を $R_1$ で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["src","R1","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R_1}"],["I = \\dfrac{24}{4} = 6\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["src","R1","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1"],"sh":["u46s7xsww2","u46s7xsww3","u46s7xsww4","u46s7xsww5","u46s7xsww6","u46s7xsww7","u46s7xswj113","u46s7xswj214"],"R2":["r2","r2t0","r2t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"I":["ia","ia:h","it0","it1","ix1a","ix1a:h","ix1t0","ix1t1"],"zhi":["u46s7xswL","u46s7xsww1","zbu46s7xsw0hi","u46s7xswx1L","u46s7xswx1w1","zbu46s7xswx10hi"],"zlo":["u46s7xswRw","u46s7xsww3","u46s7xsww5","u46s7xsww7","u46s7xsww9","zbu46s7xsw1lo","u46s7xsww2","u46s7xsww4","u46s7xsww6","u46s7xsww8","zbu46s7xsw2lo","u46s7xswx1Rw","u46s7xswx1w2","zbu46s7xswx11lo"]},"moves":{"on":{"to":{"swc":1},"dur":0.5},"redraw":{"to":{"t":1},"dur":0.6},"ival":{"to":{"iv":1},"dur":0.4}},"route":["スイッチを読む","描き直す","オームの法則"]}},{"id":"t46s8e","scene":"t46s8e","kind":"u46s8ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_x","sw":"S","i":"{I}"},"viewbox":"313 340 781 440","band":{"want":"S を開いても閉じても変わらない時の電流","ans":"平衡と読み、$R_x$ を出してから合成","full":"S を開いても閉じても電流が変わらない＝S に電流が流れない＝平衡。平衡条件で $R_x$ を出し、2つの道の並列で合成する。"},"narr":{"start":{"co":1,"swc":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"S を開いても閉じても電源の電流が変わらない時の、電流 $I$ を求めます。","at":{"強調":1.0},"after":[],"emph":["SW","I"]},{"text":"①平衡と読む\n②平衡条件で $R_x$ を出す\n③合成抵抗から電流\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["SW","R4"]}]},{"cap":null,"eqp":null,"vid":[1,7],"sents":[{"text":"閉じても変わらないのは、〖S に電流が流れない＝平衡〗だからです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"on","emph":["SW"]},{"text":"〖平衡なので、向かい合う抵抗の積が等しい〗。この式で $R_x$ を出し、S を消して合成します。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["R1","R4","R2","R3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"I":["ia","ia:h","it0","it1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"zhi":["u46s8aeL","u46s8aew3","u46s8aew5","u46s8aew7","u46s8aew11","zbu46s8ae0hi"],"zlo":["u46s8aew2","u46s8aew4","u46s8aew6","u46s8aew10","u46s8aew14","zbu46s8ae1lo"],"zmid":["u46s8aew8","u46s8aew9","u46s8aew15","zbu46s8ae2mid","u46s8aew12","u46s8aew13","u46s8aew16","zbu46s8ae3mid"]},"moves":{"on":{"to":{"swc":1},"dur":0.5}},"route":["平衡と読む","$R_x$ を出す","合成して電流"]}},{"id":"t46s8x","scene":"t46s8x","kind":"u46s8ax","lab":{"src":"{E}=12 V","r1":"{R}_1=2 Ω","r2":"{R}_2=4 Ω","r3":"{R}_3=4 Ω","r4":["{R}_x","{R}_x=8 Ω"],"sw":"S","i":["{I}","{I}=3 A"]},"viewbox":"313 340 781 440","band":{"want":"電源から流れる電流 $I$","known":"$E = 12\\,\\mathrm{V},\\;\\; R_1 = 2\\,\\Omega,\\;\\; R_2 = 4\\,\\Omega,\\;\\; R_3 = 4\\,\\Omega$","ans":"$I = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"swc":0,"r4v":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、電源から流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①平衡と読む\n②$R_x$ を出す\n③道の抵抗を出す\n④合成して電流を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","R4"]}]},{"cap":null,"eqp":null,"vid":[1,7],"sents":[{"text":"S を開いても閉じても電流が変わらないのは、S に電流が流れないからです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["SW"]},{"text":"〖つまり平衡〗しています。","at":{"強調":1.0},"after":[],"emph":["SW"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"平衡なので、向かい合う抵抗の積が等しくなります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["R1","R4","R2","R3"],"eq":[{"cont":false,"items":[["R_1 R_x = R_2 R_3"],["2 R_x = 4 \\times 4"],["R_x = 8\\,\\Omega"]]}],"move":"rx","emphPre":["R1","R4","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"S を消すと、2つの道が残ります。それぞれ直列なので足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R3","R2","R4"],"eq":[{"cont":false,"items":[["R_1 + R_3 = 2 + 4 = 6\\,\\Omega"],["R_2 + R_x = 4 + 8 = 12\\,\\Omega"]]}],"emphPre":["R1","R3","R2","R4"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"2つの道の並列を合成し、電源の電圧を割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":4,"emph":["src","R1","R2","R3","R4","I"],"eq":[{"cont":false,"items":[["\\dfrac{6 \\times 12}{6 + 12} = 4\\,\\Omega"],["I = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["src","R1","R2","R3","R4","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"I":["ia","ia:h","it0","it1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"SW":["sw","sw:p0","sw:p1","swt0","swt1"],"zhi":["u46s8axL","u46s8axw3","u46s8axw5","u46s8axw7","u46s8axw11","zbu46s8ax0hi"],"zlo":["u46s8axw2","u46s8axw4","u46s8axw6","u46s8axw10","u46s8axw14","zbu46s8ax1lo"],"zmid":["u46s8axw8","u46s8axw9","u46s8axw15","zbu46s8ax2mid","u46s8axw12","u46s8axw13","u46s8axw16","zbu46s8ax3mid"]},"moves":{"rx":{"to":{"r4v":1},"dur":0.4},"ival":{"to":{"iv":1},"dur":0.4}},"route":["平衡と読む","$R_x$ を出す","道の抵抗","合成して電流"]}},{"id":"t46s9e","scene":"t46s9e","kind":"u46s9ae","lab":{"ssrc":"{E}","sr1":"{R}_1","sr2":"{R}_2","sr3":"{R}_3","si1":"{I}_1","si3":"{I}_3"},"viewbox":"187 278 982 846","band":{"want":"図2の $R_3$ の電流","ans":"図1で $E$ を出して図2へ持っていく","full":"同じ電源の2つの図では、変わらない物は電源の電圧 $E$ だけ。図1で $E$ を出し、図2で合成抵抗・全体の電流・分流と進む。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[1,5],"sents":[{"text":"同じ電源で、図1の $R_2$ に $R_3$ を並列に足しました。図2の $I_3$ を求めます。","at":{"強調":1.0},"after":[],"emph":["R2","R3","SI3"]},{"text":"①図1で電源の電圧 $E$ を出す\n②図2で全体の電流を出す\n③分流で $I_3$ を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","SI3"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"図1と図2で変わらない物は、〖電源の電圧 $E$〗だけです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]},{"text":"並列を足すと、$R_2$ にかかる電圧は変わります。〖だから $E$ を図2へ持っていきます〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["src","R2","R3"],"ans":true}]}],"groups":{"R1":["sr1","sr1t0","sr1t1","sr1x1","sr1x1t0","sr1x1t1"],"src":["cssrc:L","cssrc:S","ppssrc","pmssrc","essrc0","essrc1","cssrcx1:L","cssrcx1:S","ppssrcx1","pmssrcx1","essrcx10","essrcx11"],"SI1":["si1a","si1a:h","si1t0","si1t1"],"R2":["sr2","sr2t0","sr2t1","sr2x1","sr2x1t0","sr2x1t1"],"zhi":["u46s9aeL","u46s9aew4","zbu46s9ae0hi","u46s9aex1L","u46s9aex1w6","zbu46s9aex10hi"],"zmid":["u46s9aew2","u46s9aew6","zbu46s9ae1mid","u46s9aex1w2","u46s9aex1w4","u46s9aex1w8","u46s9aex1w10","zbu46s9aex11mid"],"zlo":["u46s9aew3","u46s9aew5","u46s9aew7","zbu46s9ae2lo","u46s9aex1w3","u46s9aex1w5","u46s9aex1w7","u46s9aex1w9","u46s9aex1w11","zbu46s9aex12lo"],"SI":["six1a","six1a:h","six1t0","six1t1"],"SI2":["si2x1a","si2x1a:h","si2x1t0","si2x1t1"],"R3":["sr3x1","sr3x1t0","sr3x1t1"],"SI3":["si3x1a","si3x1a:h","si3x1t0","si3x1t1"]},"moves":{},"route":["図1で電源の電圧","図2で全体の電流","分流"]}},{"id":"t46s9x","scene":"t46s9x","kind":"u46s9ax","lab":{"ssrc":["{E}","{E}=36 V"],"sr1":"{R}_1=6 Ω","sr2":"{R}_2=12 Ω","sr3":"{R}_3=4 Ω","si1":"{I}_1=2 A","si":["{I}","{I}=4 A"],"si3":["{I}_3","{I}_3=3 A"]},"viewbox":"187 278 982 846","band":{"want":"図2の $R_3$ の電流 $I_3$","known":"$R_1 = 6\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; I_1 = 2\\,\\mathrm{A},\\;\\; R_3 = 4\\,\\Omega$","ans":"$I_3 = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"ssrcv":0,"siv":0,"si3v":0},"steps":[{"cap":null,"eqp":null,"vid":[1,5],"sents":[{"text":"求めるのは、図2の $R_3$ の電流 $I_3$ です。","at":{"強調":1.0},"after":[],"emph":["R3","SI3"]},{"text":"①図1で電源の電圧を出す\n②図2へ持っていく\n③図2で全体の電流を出す\n④分流で $I_3$ を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R3","SI3"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"図1と図2は同じ電源です。〖変わらない物は電源の電圧 $E$〗なので、先に図1で出します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]},{"text":"図1は $R_1$ と $R_2$ の直列で、$I_1 = 2\\,\\mathrm{A}$ が流れています。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R1","R2","SI1"],"eq":[{"cont":false,"items":[["E = (R_1 + R_2) I_1"],["E = (6 + 12) \\times 2 = 36\\,\\mathrm{V}"]]}],"move":"ev","emphPre":["src","R1","R2","SI1"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"この $36\\,\\mathrm{V}$ を図2へ持っていきます。図2の電源も $36\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["src"]},{"text":"図1で $R_2$ にかかっていた電圧は、図2では使いません。〖並列を足すと変わります〗。","at":{"強調":1.0},"after":[],"emph":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"図2の $R_2$ と $R_3$ は並列です。合成して、$R_1$ と足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{12 \\times 4}{12 + 4} = 3\\,\\Omega"],["6 + 3 = 9\\,\\Omega"]]}],"emphPre":["R1","R2","R3"]},{"text":"電源の電圧をこの合成抵抗で割ると、全体の電流です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","SI"],"eq":[{"cont":false,"items":[["I = \\dfrac{36}{9} = 4\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["src","SI"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"この電流が、$R_2$ と $R_3$ に分かれます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":4,"emph":["SI","R2","R3","SI3"],"eq":[{"cont":false,"items":[["I_3 = I \\times \\dfrac{R_2}{R_2 + R_3}"],["I_3 = 4 \\times \\dfrac{12}{12 + 4} = 3\\,\\mathrm{A}"]]}],"move":"i3val","ans":true,"emphPre":["SI","R2","R3","SI3"]}]}],"groups":{"R1":["sr1","sr1t0","sr1t1","sr1x1","sr1x1t0","sr1x1t1"],"src":["cssrc:L","cssrc:S","ppssrc","pmssrc","essrc0","essrc1","cssrcx1:L","cssrcx1:S","ppssrcx1","pmssrcx1","essrcx10","essrcx11"],"SI1":["si1a","si1a:h","si1t0","si1t1"],"R2":["sr2","sr2t0","sr2t1","sr2x1","sr2x1t0","sr2x1t1"],"zhi":["u46s9axL","u46s9axw4","zbu46s9ax0hi","u46s9axx1L","u46s9axx1w6","zbu46s9axx10hi"],"zmid":["u46s9axw2","u46s9axw6","zbu46s9ax1mid","u46s9axx1w2","u46s9axx1w4","u46s9axx1w8","u46s9axx1w10","zbu46s9axx11mid"],"zlo":["u46s9axw3","u46s9axw5","u46s9axw7","zbu46s9ax2lo","u46s9axx1w3","u46s9axx1w5","u46s9axx1w7","u46s9axx1w9","u46s9axx1w11","zbu46s9axx12lo"],"SI":["six1a","six1a:h","six1t0","six1t1"],"SI2":["si2x1a","si2x1a:h","si2x1t0","si2x1t1"],"R3":["sr3x1","sr3x1t0","sr3x1t1"],"SI3":["si3x1a","si3x1a:h","si3x1t0","si3x1t1"]},"moves":{"ev":{"to":{"ssrcv":1},"dur":0.4},"ival":{"to":{"siv":1},"dur":0.4},"i3val":{"to":{"si3v":1},"dur":0.4}},"route":["図1で電源の電圧","図2へ持っていく","図2で全体の電流","分流"]}},{"id":"t46s10e","scene":"t46s10e","kind":"u46s10ae","lab":{"ssrc":"{E}","sr1":"{R}_1","srx":"{R}_x","sr2":"{R}_2","sr3":"{R}_3","si1":"{I}_1","si2":"{I}_2"},"viewbox":"398 289 696 759","band":{"want":"2つの電流が等しい時の $R_x$","ans":"合成抵抗を等しく置いて解く","full":"同じ電源で電流が等しいなら、電流 ＝ 電圧 ÷ 合成抵抗 なので合成抵抗も等しい。2つの合成抵抗を「＝」で結んで解く。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"同じ電源の図1と図2で、$I_1$ と $I_2$ が等しい時の $R_x$ を求めます。","at":{"強調":1.0},"after":[],"emph":["SI1","SI2","Rx"]},{"text":"①等しい物を見つける\n②図2の合成抵抗を出す\n③等しく置いて解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["SI1","SI2","Rx"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電源が同じで電流が等しいので、〖2つの図の合成抵抗が等しい〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","SI1","SI2"]},{"text":"〖図2の合成抵抗を出して、図1の合成抵抗と「＝」で結びます〗。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["R1","Rx","R2","R3"]}]}],"groups":{"R1":["sr1","sr1t0","sr1t1"],"src":["cssrc:L","cssrc:S","ppssrc","pmssrc","essrc0","essrc1","cssrcx1:L","cssrcx1:S","ppssrcx1","pmssrcx1","essrcx10","essrcx11"],"SI1":["si1a","si1a:h","si1t0","si1t1"],"Rx":["srx","srxt0","srxt1"],"zhi":["u46s10aeL","u46s10aew4","zbu46s10ae0hi","u46s10aex1L","u46s10aex1w3","u46s10aex1w5","u46s10aex1w7","u46s10aex1w9","zbu46s10aex10hi"],"zmid":["u46s10aew2","u46s10aew6","zbu46s10ae1mid"],"zlo":["u46s10aew3","u46s10aew5","u46s10aew7","zbu46s10ae2lo","u46s10aex1w2","u46s10aex1w4","u46s10aex1w6","u46s10aex1w8","u46s10aex1w10","zbu46s10aex11lo"],"SI2":["si2x1a","si2x1a:h","si2x1t0","si2x1t1"],"R2":["sr2x1","sr2x1t0","sr2x1t1"],"R3":["sr3x1","sr3x1t0","sr3x1t1"]},"moves":{},"route":["等しい物","図2の合成抵抗","等しく置いて解く"]}},{"id":"t46s10x","scene":"t46s10x","kind":"u46s10ax","lab":{"ssrc":"{E}","sr1":"{R}_1=4 Ω","srx":["{R}_x","{R}_x=4 Ω"],"sr2":"{R}_2=12 Ω","sr3":"{R}_3=24 Ω","si1":"{I}_1","si2":"{I}_2"},"viewbox":"398 289 696 759","band":{"want":"図1の $R_x$","known":"$R_1 = 4\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 24\\,\\Omega,\\;\\; I_1 = I_2$","ans":"$R_x = 4\\,\\Omega$"},"narr":{"start":{"co":1,"srxv":0},"steps":[{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"求めるのは、図1の $R_x$ です。","at":{"強調":1.0},"after":[],"emph":["Rx"]},{"text":"①等しい物を見つける\n②図2の合成抵抗を出す\n③等しく置いて解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Rx"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"2つの図は同じ電源で、電流 $I_1$ と $I_2$ も等しいです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","SI1","SI2"]},{"text":"電流＝電圧÷合成抵抗です。だから〖合成抵抗も等しい〗です。","at":{"強調":1.0},"after":[],"emph":["src","SI1","SI2"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"図2は $R_2$ と $R_3$ の並列です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{12 \\times 24}{12 + 24} = 8\\,\\Omega"]]}],"emphPre":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"図1の合成抵抗 $R_1 + R_x$ を、この合成抵抗と等しく置きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["R1","Rx"],"eq":[{"cont":false,"items":[["4 + R_x = 8"],["R_x = 8 - 4 = 4\\,\\Omega"]]}],"move":"rxv","ans":true,"emphPre":["R1","Rx"]}]}],"groups":{"R1":["sr1","sr1t0","sr1t1"],"src":["cssrc:L","cssrc:S","ppssrc","pmssrc","essrc0","essrc1","cssrcx1:L","cssrcx1:S","ppssrcx1","pmssrcx1","essrcx10","essrcx11"],"SI1":["si1a","si1a:h","si1t0","si1t1"],"Rx":["srx","srxt0","srxt1"],"zhi":["u46s10axL","u46s10axw4","zbu46s10ax0hi","u46s10axx1L","u46s10axx1w3","u46s10axx1w5","u46s10axx1w7","u46s10axx1w9","zbu46s10axx10hi"],"zmid":["u46s10axw2","u46s10axw6","zbu46s10ax1mid"],"zlo":["u46s10axw3","u46s10axw5","u46s10axw7","zbu46s10ax2lo","u46s10axx1w2","u46s10axx1w4","u46s10axx1w6","u46s10axx1w8","u46s10axx1w10","zbu46s10axx11lo"],"SI2":["si2x1a","si2x1a:h","si2x1t0","si2x1t1"],"R2":["sr2x1","sr2x1t0","sr2x1t1"],"R3":["sr3x1","sr3x1t0","sr3x1t1"]},"moves":{"rxv":{"to":{"srxv":1},"dur":0.4}},"route":["等しい物","図2の合成抵抗","等しく置いて解く"]}}],"secs":[{"ex":{"text":"図の回路で、$E = 36\\,\\mathrm{V}$、$R_1 = 2\\,\\Omega$、$R_2 = 6\\,\\Omega$、$R_3 = 12\\,\\Omega$ です。$R_3$ の電流は何 A ですか。","fig":{"kind":"u46s1xq","L":{"src":"{E}=36 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=12 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$6\\,\\mathrm{A}$","v":6,"why":"全体の電流で止めた（並列で2つの道に分かれる）"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"分流の分子に自分の抵抗 $R_3$ を入れた"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$3\\,\\mathrm{A}$","v":3,"why":"$R_1$ を足さず、並列に電源の電圧がそのままかかるとした"}],"ans":2}},{"ex":{"text":"図の回路で、$R_1 = 6\\,\\Omega$、$R_2 = 1\\,\\Omega$、$R_3 = 12\\,\\Omega$、$R_4 = 4\\,\\Omega$ です。$R_4$ に流れる電流は、矢印の電流 $I$ の何倍ですか。","fig":{"kind":"u46s2xq","L":{"src":"{E}","r1":"{R}_1=6 Ω","r2":"{R}_2=1 Ω","r3":"{R}_3=12 Ω","r4":"{R}_4=4 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$0.6\\,\\text{倍}$","v":0.6,"why":"1つ目の分流で止めた（右の道へ来た電流のまま。奥でさらに分かれる）"},{"t":"$0.45\\,\\text{倍}$","v":0.45,"why":""},{"t":"$0.75\\,\\text{倍}$","v":0.75,"why":"矢印の $I$ を $R_2$ の電流と読んだ（矢印は分かれる前の導線の上）"},{"t":"$0.15\\,\\text{倍}$","v":0.15,"why":"2つ目の分流の分子に自分の抵抗 $R_4$ を入れた"}],"ans":1}},{"ex":{"text":"図の回路で、$R_3 = 6\\,\\Omega$ です。$R_3$ に流れる電流 $I_3$ は $2\\,\\mathrm{A}$、電源から流れる電流 $I$ は $5\\,\\mathrm{A}$ です。$R_2$ は何 Ω ですか。","fig":{"kind":"u46s3xq","L":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3=6 Ω","i":"{I}=5 A","i2":"{I}_2","i3":"{I}_3=2 A"},"P":{}},"ch":[{"t":"$2.4\\,\\Omega$","v":2.4,"why":"全体の電流 $I$ で割った（$I_3$ を引いていない）"},{"t":"$4\\,\\Omega$","v":4,"why":""},{"t":"$6\\,\\Omega$","v":6,"why":"$R_3$ の電流で割った（$R_3$ の値のまま）"},{"t":"$3\\,\\Omega$","v":3,"why":"$I_2$ の値で止めた（オームの法則に入れていない）"}],"ans":1}},{"ex":{"text":"図の回路で、$E = 48\\,\\mathrm{V}$ のとき電流 $I = 4\\,\\mathrm{A}$ が流れました。$R_1 = 4\\,\\Omega$、$R_2 = 24\\,\\Omega$ です。$R_x$ は何 Ω ですか。","fig":{"kind":"u46s4xq","L":{"src":"{E}=48 V","r1":"{R}_1=4 Ω","r2":"{R}_2=24 Ω","rx":"{R}_x","i":"{I}=4 A"},"P":{}},"ch":[{"t":"$8\\,\\Omega$","v":8,"why":"並列の部分の合成抵抗で止めた（並列の式に入れていない）"},{"t":"$24\\,\\Omega$","v":24,"why":"$R_1$ を引かずに、全体の抵抗を並列の式に入れた"},{"t":"$12\\,\\Omega$","v":12,"why":""},{"t":"$16\\,\\Omega$","v":16,"why":"並列を差 $24 - 8$ で出した（逆数で解いていない）"}],"ans":2}},{"ex":{"text":"図の回路で、$E = 30\\,\\mathrm{V}$、$R_2 = 5\\,\\Omega$、$R_3 = 20\\,\\Omega$ です。$R_1$ にかかる電圧 $V_1$ は $10\\,\\mathrm{V}$ です。$R_1$ に流れる電流 $I_1$ は何 A ですか。","fig":{"kind":"u46s5xq","L":{"src":"{E}=30 V","r1":"{R}_1","r2":"{R}_2=5 Ω","r3":"{R}_3=20 Ω","v1":"{V}_1=10 V","i1":"{I}_1"},"P":{}},"ch":[{"t":"$7.5\\,\\mathrm{A}$","v":7.5,"why":"$V_1$ を引かずに、電源の電圧で計算した"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"$R_2$ の電流で止めた（2つの和をとっていない）"},{"t":"$5\\,\\mathrm{A}$","v":5,"why":""},{"t":"$0.8\\,\\mathrm{A}$","v":0.8,"why":"並列を足して割った（並列の部分は和分の積）"}],"ans":2}},{"ex":{"text":"図の回路で、$E_1 = 12\\,\\mathrm{V}$、$E_2 = 6\\,\\mathrm{V}$、$R_1 = R_2 = R_3 = 2\\,\\Omega$ です。$R_3$ に流れる電流 $I_3$ は何 A ですか。","fig":{"kind":"u46s6q","L":{"e1":"{E}_1=12 V","e2":"{E}_2=6 V","r1":"{R}_1=2 Ω","r2":"{R}_2=2 Ω","r3":"{R}_3=2 Ω","i3":"{I}_3"},"P":{}},"ch":[{"t":"$1\\,\\mathrm{A}$","v":1,"why":"同じ向きの成分を引いた"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"$E_1$ の分だけ。$E_2$ の分を重ねていない"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"分流せず、全体の電流どうしを足した"}],"ans":2}},{"ex":{"text":"図の回路で、$E = 24\\,\\mathrm{V}$、$R_1 = 4\\,\\Omega$、$R_2 = 12\\,\\Omega$ です。スイッチ S を閉じた時、電源から流れる電流 $I$ は何 A ですか。","fig":{"kind":"u46s7q","L":{"src":"{E}=24 V","r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","sw":"S","i":"{I}"},"P":{}},"ch":[{"t":"$1.5\\,\\mathrm{A}$","v":1.5,"why":"閉じた S を見ていない（開いた時の電流）"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"消す抵抗を取り違えた（$R_1$ を消した）"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":""},{"t":"$8\\,\\mathrm{A}$","v":8,"why":"$R_1$ と $R_2$ を並列と考えた"}],"ans":2}},{"ex":{"text":"図のブリッジで、$E = 12\\,\\mathrm{V}$、$R_1 = 2\\,\\Omega$、$R_2 = 4\\,\\Omega$、$R_3 = 4\\,\\Omega$ です。スイッチ S を開いても閉じても、電源から流れる電流は変わりませんでした。電源から流れる電流 $I$ は何 A ですか。","fig":{"kind":"u46s8q","L":{"src":"{E}=12 V","r1":"{R}_1=2 Ω","r2":"{R}_2=4 Ω","r3":"{R}_3=4 Ω","r4":"{R}_x","sw":"S","i":"{I}"},"P":{}},"ch":[{"t":"$4\\,\\mathrm{A}$","v":4,"why":"平衡の式を、向かい合わない抵抗の組で作った"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"$R_1$・$R_3$ の道だけを見た（もう1つの道を飛ばした）"},{"t":"$1\\,\\mathrm{A}$","v":1,"why":"$R_2$・$R_x$ の道だけを見た（もう1つの道を飛ばした）"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""}],"ans":3}},{"ex":{"text":"図1のように、$R_1 = 6\\,\\Omega$ と $R_2 = 12\\,\\Omega$ を直列にして電源につなぐと、電流 $I_1 = 2\\,\\mathrm{A}$ が流れました。図2のように、同じ電源で $R_2$ に $R_3 = 4\\,\\Omega$ を並列に足しました。図2の $R_3$ に流れる電流 $I_3$ は何 A ですか。","fig":{"kind":"u46s9q","L":{"src":"{E}","r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=4 Ω","i1":"{I}_1=2 A","i3":"{I}_3"},"P":{}},"ch":[{"t":"$6\\,\\mathrm{A}$","v":6,"why":"図1で $R_2$ にかかっていた $24\\,\\mathrm{V}$ を図2の並列にかけた"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"図2の全体の電流のまま。分流していない"},{"t":"$9\\,\\mathrm{A}$","v":9,"why":"図2で $R_1$ を足さず、並列に電源の電圧がかかるとした"}],"ans":1}},{"ex":{"text":"同じ電源で、図1は $R_1 = 4\\,\\Omega$ と $R_x$ の直列、図2は $R_2 = 12\\,\\Omega$ と $R_3 = 24\\,\\Omega$ の並列です。図1の電流 $I_1$ と図2の電流 $I_2$ が等しい時、$R_x$ は何 Ω ですか。","fig":{"kind":"u46s10q","L":{"src":"{E}","r1":"{R}_1=4 Ω","rx":"{R}_x","r2":"{R}_2=12 Ω","r3":"{R}_3=24 Ω","i1":"{I}_1","i2":"{I}_2"},"P":{}},"ch":[{"t":"$8\\,\\Omega$","v":8,"why":"図2の合成抵抗で止めた（$R_1$ を引いていない）"},{"t":"$20\\,\\Omega$","v":20,"why":"並列を合成せず、$R_3$ だけと等しく置いた"},{"t":"$32\\,\\Omega$","v":32,"why":"並列を足して合成した"},{"t":"$4\\,\\Omega$","v":4,"why":""}],"ans":3}}],"past":[]}};
});
