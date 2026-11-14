/* 単元51「磁気のつなぎ（2つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(51, function(H){
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
// ---- 51-1 2本の導体の磁界を足す・引く の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S1K = {
  wm: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[260,150],[260,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[260,116,"middle",[0,-1]]],"need":"wa","vis":[],"t":"F","x":260,"y":116,"anc":"middle"},{"f":"ar","id":"iaa","x0":234,"y0":355,"x1":234,"y1":245,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":234,"y0":355,"x1":234,"y1":245},"down":{"x0":234,"y0":245,"x1":234,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[216,300,"end",[-1,0]],[252,300,"start",[1,0]]],"need":"ia","vis":[],"t":"F","x":272,"y":300,"anc":"start"},{"f":"ln","id":"wb","pts":[[860,150],[860,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[860,116,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":860,"y":116,"anc":"middle"},{"f":"ar","id":"iba","x0":886,"y0":355,"x1":886,"y1":245,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":886,"y0":355,"x1":886,"y1":245},"down":{"x0":886,"y0":245,"x1":886,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[904,300,"start",[1,0]],[868,300,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":848,"y":300,"anc":"end"},{"f":"c","id":"pd","cx":410,"cy":520,"r":9,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[410,480,"middle",[0,-1]],[386,490,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":410,"y":480,"anc":"middle"},{"f":"ar","id":"dpad","x0":264,"y0":520,"x1":400,"y1":520,"two":1,"w":2,"need":"dpa","vis":[],"t":"F"},{"f":"lb","id":"dpat","k":"dpa","bases":[[332,552,"middle",[0,1]],[332,488,"middle",[0,-1]]],"need":"dpa","vis":[],"t":"F","x":332,"y":552,"anc":"middle"},{"f":"ar","id":"dpbd","x0":420,"y0":520,"x1":856,"y1":520,"two":1,"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"lb","id":"dpbt","k":"dpb","bases":[[638,552,"middle",[0,1]],[638,488,"middle",[0,-1]]],"need":"dpb","vis":[],"t":"F","x":638,"y":552,"anc":"middle"},{"f":"ln","id":"dabe1","pts":[[260,546],[260,664]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ln","id":"dabe2","pts":[[860,546],[860,664]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ar","id":"dabd","x0":260,"y0":650,"x1":860,"y1":650,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[560,690,"middle",[0,1]],[560,610,"middle",[0,-1]]],"need":"dab","vis":[],"t":"F","x":560,"y":690,"anc":"middle"},{"f":"c","id":"hpac","cx":376,"cy":410,"r":20,"fill":"w","need":"hpa","vis":[],"t":"F","sel":["hpa"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hat","k":"ha","bases":[[350,410,"end",[-1,0]],[376,370,"middle",[0,-1]]],"need":"ha","vis":[],"t":"F","x":402,"y":364,"anc":"middle"},{"f":"c","id":"hpbc","cx":444,"cy":410,"r":20,"fill":"w","need":"hpb","vis":[],"t":"F","sel":["hpb"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hbt","k":"hb","bases":[[470,410,"start",[1,0]],[444,370,"middle",[0,-1]]],"need":"hb","vis":[],"t":"F","x":470,"y":410,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  wn: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[260,150],[260,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[260,116,"middle",[0,-1]]],"need":"wa","vis":[],"t":"F","x":260,"y":116,"anc":"middle"},{"f":"ar","id":"iaa","x0":234,"y0":355,"x1":234,"y1":245,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":234,"y0":355,"x1":234,"y1":245},"down":{"x0":234,"y0":245,"x1":234,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[216,300,"end",[-1,0]],[252,300,"start",[1,0]]],"need":"ia","vis":[],"t":"F","x":272,"y":300,"anc":"start"},{"f":"ln","id":"wb","pts":[[860,150],[860,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[860,116,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":860,"y":116,"anc":"middle"},{"f":"ar","id":"iba","x0":886,"y0":355,"x1":886,"y1":245,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":886,"y0":355,"x1":886,"y1":245},"down":{"x0":886,"y0":245,"x1":886,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[904,300,"start",[1,0]],[868,300,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":848,"y":300,"anc":"end"},{"f":"c","id":"pd","cx":460,"cy":520,"r":9,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[460,480,"middle",[0,-1]],[436,490,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":460,"y":480,"anc":"middle"},{"f":"ar","id":"dpad","x0":264,"y0":520,"x1":450,"y1":520,"two":1,"w":2,"need":"dpa","vis":[],"t":"F"},{"f":"lb","id":"dpat","k":"dpa","bases":[[357,552,"middle",[0,1]],[357,488,"middle",[0,-1]]],"need":"dpa","vis":[],"t":"F","x":357,"y":552,"anc":"middle"},{"f":"ar","id":"dpbd","x0":470,"y0":520,"x1":856,"y1":520,"two":1,"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"lb","id":"dpbt","k":"dpb","bases":[[663,552,"middle",[0,1]],[663,488,"middle",[0,-1]]],"need":"dpb","vis":[],"t":"F","x":663,"y":552,"anc":"middle"},{"f":"ln","id":"dabe1","pts":[[260,546],[260,664]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ln","id":"dabe2","pts":[[860,546],[860,664]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ar","id":"dabd","x0":260,"y0":650,"x1":860,"y1":650,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[560,690,"middle",[0,1]],[560,610,"middle",[0,-1]]],"need":"dab","vis":[],"t":"F","x":560,"y":690,"anc":"middle"},{"f":"c","id":"hpac","cx":426,"cy":410,"r":20,"fill":"w","need":"hpa","vis":[],"t":"F","sel":["hpa"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hat","k":"ha","bases":[[400,410,"end",[-1,0]],[426,370,"middle",[0,-1]]],"need":"ha","vis":[],"t":"F","x":426,"y":364,"anc":"middle"},{"f":"c","id":"hpbc","cx":494,"cy":410,"r":20,"fill":"w","need":"hpb","vis":[],"t":"F","sel":["hpb"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hbt","k":"hb","bases":[[520,410,"start",[1,0]],[494,370,"middle",[0,-1]]],"need":"hb","vis":[],"t":"F","x":520,"y":410,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  wl: {"vars":[],"items":[{"f":"ln","id":"wa","pts":[[560,150],[560,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[560,116,"middle",[0,-1]]],"need":"wa","vis":[],"t":"F","x":560,"y":116,"anc":"middle"},{"f":"ar","id":"iaa","x0":534,"y0":355,"x1":534,"y1":245,"w":4,"need":"ia","sel":"iaa","var":{"up":{"x0":534,"y0":355,"x1":534,"y1":245},"down":{"x0":534,"y0":245,"x1":534,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"iat","k":"ia","bases":[[516,300,"end",[-1,0]],[552,300,"start",[1,0]]],"need":"ia","vis":[],"t":"F","x":516,"y":300,"anc":"end"},{"f":"ln","id":"wb","pts":[[860,150],[860,760]],"w":6,"vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[860,116,"middle",[0,-1]]],"need":"wb","vis":[],"t":"F","x":860,"y":116,"anc":"middle"},{"f":"ar","id":"iba","x0":886,"y0":355,"x1":886,"y1":245,"w":4,"need":"ib","sel":"iba","var":{"up":{"x0":886,"y0":355,"x1":886,"y1":245},"down":{"x0":886,"y0":245,"x1":886,"y1":355}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ibt","k":"ib","bases":[[904,300,"start",[1,0]],[868,300,"end",[-1,0]]],"need":"ib","vis":[],"t":"F","x":848,"y":300,"anc":"end"},{"f":"c","id":"pd","cx":260,"cy":520,"r":9,"fill":"k","need":"p","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[260,480,"middle",[0,-1]],[236,490,"end",[-1,-1]]],"need":"p","vis":[],"t":"F","x":260,"y":480,"anc":"middle"},{"f":"ar","id":"dpad","x0":270,"y0":520,"x1":556,"y1":520,"two":1,"w":2,"need":"dpa","vis":[],"t":"F"},{"f":"lb","id":"dpat","k":"dpa","bases":[[413,552,"middle",[0,1]],[413,488,"middle",[0,-1]]],"need":"dpa","vis":[],"t":"F","x":413,"y":552,"anc":"middle"},{"f":"ar","id":"dabd","x0":564,"y0":520,"x1":856,"y1":520,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[710,552,"middle",[0,1]],[710,488,"middle",[0,-1]]],"need":"dab","vis":[],"t":"F","x":710,"y":552,"anc":"middle"},{"f":"ln","id":"dpbe1","pts":[[260,546],[260,664]],"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"ln","id":"dpbe2","pts":[[860,546],[860,664]],"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"ar","id":"dpbd","x0":260,"y0":650,"x1":860,"y1":650,"two":1,"w":2,"need":"dpb","vis":[],"t":"F"},{"f":"lb","id":"dpbt","k":"dpb","bases":[[560,690,"middle",[0,1]],[560,610,"middle",[0,-1]]],"need":"dpb","vis":[],"t":"F","x":504,"y":690,"anc":"middle"},{"f":"c","id":"hpac","cx":226,"cy":410,"r":20,"fill":"w","need":"hpa","vis":[],"t":"F","sel":["hpa"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hat","k":"ha","bases":[[200,410,"end",[-1,0]],[226,370,"middle",[0,-1]]],"need":"ha","vis":[],"t":"F","x":226,"y":364,"anc":"middle"},{"f":"c","id":"hpbc","cx":294,"cy":410,"r":20,"fill":"w","need":"hpb","vis":[],"t":"F","sel":["hpb"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"hbt","k":"hb","bases":[[320,410,"start",[1,0]],[294,370,"middle",[0,-1]]],"need":"hb","vis":[],"t":"F","x":294,"y":310,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s1wm(d, p, L){ tbFig_Draw(d, p, L, U51S1K.wm); }
function tbU51s1wn(d, p, L){ tbFig_Draw(d, p, L, U51S1K.wn); }
function tbU51s1wl(d, p, L){ tbFig_Draw(d, p, L, U51S1K.wl); }
// ---- 51-2 2つの磁極の磁界を足す・引く の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S2K = {
  pe: {"vars":[],"items":[{"f":"ln","id":"cl","pts":[[140,440],[980,440]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"magb0","pts":[[300,426],[100,426]],"w":3,"need":"magb","vis":[],"t":"F"},{"f":"ln","id":"magb1","pts":[[300,454],[100,454]],"w":3,"need":"magb","vis":[],"t":"F"},{"f":"ln","id":"magbd","pts":[[100,426],[40,426]],"dash":1,"w":2,"need":"magb","vis":[],"t":"F"},{"f":"lb","id":"magbt","k":"magb","bases":[[190,394,"middle",[0,-1]]],"need":"magb","vis":[],"t":"F","x":190,"y":394,"anc":"middle"},{"f":"c","id":"pb","cx":300,"cy":440,"r":16,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nbt","k":"nb","bases":[[300,490,"middle",[0,1]]],"need":"nb","vis":[],"t":"F","x":300,"y":490,"anc":"middle"},{"f":"lb","id":"mbt","k":"mb","bases":[[300,536,"middle",[0,1]]],"need":"mb","vis":[],"t":"F","x":300,"y":536,"anc":"middle"},{"f":"ln","id":"magc0","pts":[[820,426],[1020,426]],"w":3,"need":"magc","vis":[],"t":"F"},{"f":"ln","id":"magc1","pts":[[820,454],[1020,454]],"w":3,"need":"magc","vis":[],"t":"F"},{"f":"ln","id":"magcd","pts":[[1020,426],[1080,426]],"dash":1,"w":2,"need":"magc","vis":[],"t":"F"},{"f":"lb","id":"magct","k":"magc","bases":[[930,394,"middle",[0,-1]]],"need":"magc","vis":[],"t":"F","x":930,"y":394,"anc":"middle"},{"f":"c","id":"pc","cx":820,"cy":440,"r":16,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nct","k":"nc","bases":[[820,490,"middle",[0,1]]],"need":"nc","vis":[],"t":"F","x":820,"y":490,"anc":"middle"},{"f":"lb","id":"mct","k":"mc","bases":[[820,536,"middle",[0,1]]],"need":"mc","vis":[],"t":"F","x":820,"y":536,"anc":"middle"},{"f":"c","id":"pa","cx":560,"cy":440,"r":14,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nat","k":"na","bases":[[560,490,"middle",[0,1]]],"need":"na","vis":[],"t":"F","x":560,"y":490,"anc":"middle"},{"f":"ln","id":"d1e1","pts":[[300,410],[300,316]],"w":2,"need":"d1","vis":[],"t":"F"},{"f":"ln","id":"d1e2","pts":[[560,410],[560,316]],"w":2,"need":"d1","vis":[],"t":"F"},{"f":"ar","id":"d1d","x0":300,"y0":330,"x1":560,"y1":330,"two":1,"w":2,"need":"d1","vis":[],"t":"F"},{"f":"lb","id":"d1t","k":"d1","bases":[[430,290,"middle",[0,-1]],[430,370,"middle",[0,1]]],"need":"d1","vis":[],"t":"F","x":430,"y":370,"anc":"middle"},{"f":"ln","id":"d2e1","pts":[[560,410],[560,316]],"w":2,"need":"d2","vis":[],"t":"F"},{"f":"ln","id":"d2e2","pts":[[820,410],[820,316]],"w":2,"need":"d2","vis":[],"t":"F"},{"f":"ar","id":"d2d","x0":560,"y0":330,"x1":820,"y1":330,"two":1,"w":2,"need":"d2","vis":[],"t":"F"},{"f":"lb","id":"d2t","k":"d2","bases":[[690,290,"middle",[0,-1]],[690,370,"middle",[0,1]]],"need":"d2","vis":[],"t":"F","x":690,"y":370,"anc":"middle"},{"f":"ar","id":"h1a","x0":570,"y0":290,"x1":690,"y1":290,"w":4,"need":"h1","sel":"h1a","var":{"right":{"x0":570,"y0":290,"x1":690,"y1":290},"left":{"x0":550,"y0":290,"x1":430,"y1":290}},"dflt":"right","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h1t","k":"h1","bases":[[706,290,"start",[1,0]]],"vbases":{"right":[[706,290,"start",[1,0]]],"left":[[414,290,"end",[-1,0]]]},"need":"h1","sel":"h1a","var":{"right":{"x":706,"y":290,"anc":"start"},"left":{"x":414,"y":290,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":706,"y":290,"anc":"start"},{"f":"ar","id":"h2a","x0":570,"y0":240,"x1":690,"y1":240,"w":4,"need":"h2","sel":"h2a","var":{"right":{"x0":570,"y0":240,"x1":690,"y1":240},"left":{"x0":550,"y0":240,"x1":430,"y1":240}},"dflt":"right","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h2t","k":"h2","bases":[[706,240,"start",[1,0]]],"vbases":{"right":[[706,240,"start",[1,0]]],"left":[[414,240,"end",[-1,0]]]},"need":"h2","sel":"h2a","var":{"right":{"x":706,"y":232,"anc":"start"},"left":{"x":414,"y":232,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":706,"y":240,"anc":"start"},{"f":"ar","id":"ha","x0":570,"y0":190,"x1":690,"y1":190,"w":4,"need":"h","sel":"ha","var":{"right":{"x0":570,"y0":190,"x1":690,"y1":190},"left":{"x0":550,"y0":190,"x1":430,"y1":190}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[706,190,"start",[1,0]]],"vbases":{"right":[[706,190,"start",[1,0]]],"left":[[414,190,"end",[-1,0]]]},"need":"h","sel":"ha","var":{"right":{"x":706,"y":174,"anc":"start"},"left":{"x":414,"y":174,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":706,"y":190,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pb: {"vars":[],"items":[{"f":"ln","id":"cl","pts":[[140,440],[980,440]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"magb0","pts":[[300,426],[100,426]],"w":3,"need":"magb","vis":[],"t":"F"},{"f":"ln","id":"magb1","pts":[[300,454],[100,454]],"w":3,"need":"magb","vis":[],"t":"F"},{"f":"ln","id":"magbd","pts":[[100,426],[40,426]],"dash":1,"w":2,"need":"magb","vis":[],"t":"F"},{"f":"lb","id":"magbt","k":"magb","bases":[[190,394,"middle",[0,-1]]],"need":"magb","vis":[],"t":"F","x":190,"y":394,"anc":"middle"},{"f":"c","id":"pb","cx":300,"cy":440,"r":16,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nbt","k":"nb","bases":[[300,490,"middle",[0,1]]],"need":"nb","vis":[],"t":"F","x":300,"y":490,"anc":"middle"},{"f":"lb","id":"mbt","k":"mb","bases":[[300,536,"middle",[0,1]]],"need":"mb","vis":[],"t":"F","x":300,"y":536,"anc":"middle"},{"f":"ln","id":"magc0","pts":[[820,426],[1020,426]],"w":3,"need":"magc","vis":[],"t":"F"},{"f":"ln","id":"magc1","pts":[[820,454],[1020,454]],"w":3,"need":"magc","vis":[],"t":"F"},{"f":"ln","id":"magcd","pts":[[1020,426],[1080,426]],"dash":1,"w":2,"need":"magc","vis":[],"t":"F"},{"f":"lb","id":"magct","k":"magc","bases":[[930,394,"middle",[0,-1]]],"need":"magc","vis":[],"t":"F","x":930,"y":394,"anc":"middle"},{"f":"c","id":"pc","cx":820,"cy":440,"r":16,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nct","k":"nc","bases":[[820,490,"middle",[0,1]]],"need":"nc","vis":[],"t":"F","x":820,"y":490,"anc":"middle"},{"f":"lb","id":"mct","k":"mc","bases":[[820,536,"middle",[0,1]]],"need":"mc","vis":[],"t":"F","x":820,"y":536,"anc":"middle"},{"f":"c","id":"pa","cx":473.33,"cy":440,"r":14,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nat","k":"na","bases":[[473.33,490,"middle",[0,1]]],"need":"na","vis":[],"t":"F","x":473.33,"y":490,"anc":"middle"},{"f":"ln","id":"d1e1","pts":[[300,410],[300,316]],"w":2,"need":"d1","vis":[],"t":"F"},{"f":"ln","id":"d1e2","pts":[[473.33,410],[473.33,316]],"w":2,"need":"d1","vis":[],"t":"F"},{"f":"ar","id":"d1d","x0":300,"y0":330,"x1":473.33,"y1":330,"two":1,"w":2,"need":"d1","vis":[],"t":"F"},{"f":"lb","id":"d1t","k":"d1","bases":[[386.67,290,"middle",[0,-1]],[386.67,370,"middle",[0,1]]],"need":"d1","vis":[],"t":"F","x":386.67,"y":370,"anc":"middle"},{"f":"ln","id":"d2e1","pts":[[473.33,410],[473.33,316]],"w":2,"need":"d2","vis":[],"t":"F"},{"f":"ln","id":"d2e2","pts":[[820,410],[820,316]],"w":2,"need":"d2","vis":[],"t":"F"},{"f":"ar","id":"d2d","x0":473.33,"y0":330,"x1":820,"y1":330,"two":1,"w":2,"need":"d2","vis":[],"t":"F"},{"f":"lb","id":"d2t","k":"d2","bases":[[646.67,290,"middle",[0,-1]],[646.67,370,"middle",[0,1]]],"need":"d2","vis":[],"t":"F","x":672.67,"y":290,"anc":"middle"},{"f":"ar","id":"h1a","x0":483.33,"y0":290,"x1":603.33,"y1":290,"w":4,"need":"h1","sel":"h1a","var":{"right":{"x0":483.33,"y0":290,"x1":603.33,"y1":290},"left":{"x0":463.33,"y0":290,"x1":343.33,"y1":290}},"dflt":"right","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h1t","k":"h1","bases":[[619.33,290,"start",[1,0]]],"vbases":{"right":[[619.33,290,"start",[1,0]]],"left":[[327.33,290,"end",[-1,0]]]},"need":"h1","sel":"h1a","var":{"right":{"x":619.33,"y":234,"anc":"start"},"left":{"x":327.33,"y":282,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":619.33,"y":290,"anc":"start"},{"f":"ar","id":"h2a","x0":483.33,"y0":240,"x1":603.33,"y1":240,"w":4,"need":"h2","sel":"h2a","var":{"right":{"x0":483.33,"y0":240,"x1":603.33,"y1":240},"left":{"x0":463.33,"y0":240,"x1":343.33,"y1":240}},"dflt":"right","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h2t","k":"h2","bases":[[619.33,240,"start",[1,0]]],"vbases":{"right":[[619.33,240,"start",[1,0]]],"left":[[327.33,240,"end",[-1,0]]]},"need":"h2","sel":"h2a","var":{"right":{"x":739.33,"y":240,"anc":"start"},"left":{"x":327.33,"y":224,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":619.33,"y":240,"anc":"start"},{"f":"ar","id":"ha","x0":483.33,"y0":190,"x1":603.33,"y1":190,"w":4,"need":"h","sel":"ha","var":{"right":{"x0":483.33,"y0":190,"x1":603.33,"y1":190},"left":{"x0":463.33,"y0":190,"x1":343.33,"y1":190}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[619.33,190,"start",[1,0]]],"vbases":{"right":[[619.33,190,"start",[1,0]]],"left":[[327.33,190,"end",[-1,0]]]},"need":"h","sel":"ha","var":{"right":{"x":619.33,"y":174,"anc":"start"},"left":{"x":327.33,"y":164,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":619.33,"y":190,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pa: {"vars":[],"items":[{"f":"ln","id":"cl","pts":[[140,440],[980,440]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"magb0","pts":[[560,426],[360,426]],"w":3,"need":"magb","vis":[],"t":"F"},{"f":"ln","id":"magb1","pts":[[560,454],[360,454]],"w":3,"need":"magb","vis":[],"t":"F"},{"f":"ln","id":"magbd","pts":[[360,426],[300,426]],"dash":1,"w":2,"need":"magb","vis":[],"t":"F"},{"f":"lb","id":"magbt","k":"magb","bases":[[450,394,"middle",[0,-1]]],"need":"magb","vis":[],"t":"F","x":450,"y":394,"anc":"middle"},{"f":"c","id":"pb","cx":560,"cy":440,"r":16,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nbt","k":"nb","bases":[[560,490,"middle",[0,1]]],"need":"nb","vis":[],"t":"F","x":560,"y":490,"anc":"middle"},{"f":"lb","id":"mbt","k":"mb","bases":[[560,536,"middle",[0,1]]],"need":"mb","vis":[],"t":"F","x":560,"y":536,"anc":"middle"},{"f":"ln","id":"magc0","pts":[[820,426],[1020,426]],"w":3,"need":"magc","vis":[],"t":"F"},{"f":"ln","id":"magc1","pts":[[820,454],[1020,454]],"w":3,"need":"magc","vis":[],"t":"F"},{"f":"ln","id":"magcd","pts":[[1020,426],[1080,426]],"dash":1,"w":2,"need":"magc","vis":[],"t":"F"},{"f":"lb","id":"magct","k":"magc","bases":[[930,394,"middle",[0,-1]]],"need":"magc","vis":[],"t":"F","x":930,"y":394,"anc":"middle"},{"f":"c","id":"pc","cx":820,"cy":440,"r":16,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nct","k":"nc","bases":[[820,490,"middle",[0,1]]],"need":"nc","vis":[],"t":"F","x":820,"y":490,"anc":"middle"},{"f":"lb","id":"mct","k":"mc","bases":[[820,536,"middle",[0,1]]],"need":"mc","vis":[],"t":"F","x":820,"y":536,"anc":"middle"},{"f":"c","id":"pa","cx":300,"cy":440,"r":14,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"nat","k":"na","bases":[[300,490,"middle",[0,1]]],"need":"na","vis":[],"t":"F","x":300,"y":490,"anc":"middle"},{"f":"ln","id":"d1e1","pts":[[300,410],[300,316]],"w":2,"need":"d1","vis":[],"t":"F"},{"f":"ln","id":"d1e2","pts":[[560,410],[560,316]],"w":2,"need":"d1","vis":[],"t":"F"},{"f":"ar","id":"d1d","x0":300,"y0":330,"x1":560,"y1":330,"two":1,"w":2,"need":"d1","vis":[],"t":"F"},{"f":"lb","id":"d1t","k":"d1","bases":[[430,290,"middle",[0,-1]],[430,370,"middle",[0,1]]],"need":"d1","vis":[],"t":"F","x":430,"y":370,"anc":"middle"},{"f":"ln","id":"d2e1","pts":[[560,410],[560,316]],"w":2,"need":"d2","vis":[],"t":"F"},{"f":"ln","id":"d2e2","pts":[[820,410],[820,316]],"w":2,"need":"d2","vis":[],"t":"F"},{"f":"ar","id":"d2d","x0":560,"y0":330,"x1":820,"y1":330,"two":1,"w":2,"need":"d2","vis":[],"t":"F"},{"f":"lb","id":"d2t","k":"d2","bases":[[690,290,"middle",[0,-1]],[690,370,"middle",[0,1]]],"need":"d2","vis":[],"t":"F","x":690,"y":290,"anc":"middle"},{"f":"ar","id":"h1a","x0":310,"y0":290,"x1":430,"y1":290,"w":4,"need":"h1","sel":"h1a","var":{"right":{"x0":310,"y0":290,"x1":430,"y1":290},"left":{"x0":290,"y0":290,"x1":170,"y1":290}},"dflt":"right","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h1t","k":"h1","bases":[[446,290,"start",[1,0]]],"vbases":{"right":[[446,290,"start",[1,0]]],"left":[[154,290,"end",[-1,0]]]},"need":"h1","sel":"h1a","var":{"right":{"x":446,"y":290,"anc":"start"},"left":{"x":154,"y":290,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":446,"y":290,"anc":"start"},{"f":"ar","id":"h2a","x0":310,"y0":240,"x1":430,"y1":240,"w":4,"need":"h2","sel":"h2a","var":{"right":{"x0":310,"y0":240,"x1":430,"y1":240},"left":{"x0":290,"y0":240,"x1":170,"y1":240}},"dflt":"right","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h2t","k":"h2","bases":[[446,240,"start",[1,0]]],"vbases":{"right":[[446,240,"start",[1,0]]],"left":[[154,240,"end",[-1,0]]]},"need":"h2","sel":"h2a","var":{"right":{"x":446,"y":232,"anc":"start"},"left":{"x":154,"y":232,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":446,"y":240,"anc":"start"},{"f":"ar","id":"ha","x0":310,"y0":190,"x1":430,"y1":190,"w":4,"need":"h","sel":"ha","var":{"right":{"x0":310,"y0":190,"x1":430,"y1":190},"left":{"x0":290,"y0":190,"x1":170,"y1":190}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ht","k":"h","bases":[[446,190,"start",[1,0]]],"vbases":{"right":[[446,190,"start",[1,0]]],"left":[[154,190,"end",[-1,0]]]},"need":"h","sel":"ha","var":{"right":{"x":446,"y":174,"anc":"start"},"left":{"x":154,"y":174,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":446,"y":190,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s2pe(d, p, L){ tbFig_Draw(d, p, L, U51S2K.pe); }
function tbU51s2pb(d, p, L){ tbFig_Draw(d, p, L, U51S2K.pb); }
function tbU51s2pa(d, p, L){ tbFig_Draw(d, p, L, U51S2K.pa); }
// ---- 51-3 2つの磁界の式を等しく置く の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S3K = {
  sc: {"vars":[],"items":[{"f":"ln","id":"wl","pts":[[560,160],[560,720]],"w":4,"vis":[],"t":"F"},{"f":"lb","id":"wt","k":"w","bases":[[560,126,"middle",[0,-1]]],"need":"w","vis":[],"t":"F","x":560,"y":126,"anc":"middle"},{"f":"ar","id":"i1a","x0":560,"y0":360,"x1":560,"y1":300,"w":3,"need":"i1","sel":"i1a","var":{"up":{"x0":560,"y0":360,"x1":560,"y1":300},"down":{"x0":560,"y0":300,"x1":560,"y1":360}},"dflt":"up","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[580,320,"start",[1,0]]],"need":"i1","vis":[],"t":"F","x":580,"y":320,"anc":"start"},{"f":"c","id":"pd","cx":320,"cy":470,"r":10,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"pt","k":"p","bases":[[320,512,"middle",[0,1]]],"need":"p","vis":[],"t":"F","x":320,"y":524,"anc":"middle"},{"f":"ar","id":"ad","x0":332,"y0":470,"x1":556,"y1":470,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[440,438,"middle",[0,-1]]],"need":"a","vis":[],"t":"F","x":440,"y":418,"anc":"middle"},{"t":"cap","id":"u51s3sccap0","x":569.5,"y":939.16,"s":"図1","vis":[]},{"f":"ln","id":"clx1","pts":[[1421,491],[1420.24,508.43],[1417.96,525.73],[1414.19,542.76],[1408.94,559.4],[1402.26,575.52],[1394.21,591],[1384.83,605.72],[1374.21,619.56],[1362.42,632.42],[1349.56,644.21],[1335.72,654.83],[1321,664.21],[1305.52,672.26],[1289.4,678.94],[1272.76,684.19],[1255.73,687.96],[1238.43,690.24],[1221,691],[1203.57,690.24],[1186.27,687.96],[1169.24,684.19],[1152.6,678.94],[1136.48,672.26],[1121,664.21],[1106.28,654.83],[1092.44,644.21],[1079.58,632.42],[1067.79,619.56],[1057.17,605.72],[1047.79,591],[1039.74,575.52],[1033.06,559.4],[1027.81,542.76],[1024.04,525.73],[1021.76,508.43],[1021,491],[1021.76,473.57],[1024.04,456.27],[1027.81,439.24],[1033.06,422.6],[1039.74,406.48],[1047.79,391],[1057.17,376.28],[1067.79,362.44],[1079.58,349.58],[1092.44,337.79],[1106.28,327.17],[1121,317.79],[1136.48,309.74],[1152.6,303.06],[1169.24,297.81],[1186.27,294.04],[1203.57,291.76],[1221,291],[1238.43,291.76],[1255.73,294.04],[1272.76,297.81],[1289.4,303.06],[1305.52,309.74],[1321,317.79],[1335.72,327.17],[1349.56,337.79],[1362.42,349.58],[1374.21,362.44],[1384.83,376.28],[1394.21,391],[1402.26,406.48],[1408.94,422.6],[1414.19,439.24],[1417.96,456.27],[1420.24,473.57],[1421,491]],"w":6,"no":["rs"],"vis":[],"t":"F"},{"f":"ln","id":"clx0x1","pts":[[1412,491],[1411.27,507.65],[1409.1,524.17],[1405.49,540.43],[1400.48,556.33],[1394.1,571.72],[1386.41,586.5],[1377.46,600.55],[1367.31,613.77],[1356.06,626.06],[1343.77,637.31],[1330.55,647.46],[1316.5,656.41],[1301.72,664.1],[1286.33,670.48],[1270.43,675.49],[1254.17,679.1],[1237.65,681.27],[1221,682],[1204.35,681.27],[1187.83,679.1],[1171.57,675.49],[1155.67,670.48],[1140.28,664.1],[1125.5,656.41],[1111.45,647.46],[1098.23,637.31],[1085.94,626.06],[1074.69,613.77],[1064.54,600.55],[1055.59,586.5],[1047.9,571.72],[1041.52,556.33],[1036.51,540.43],[1032.9,524.17],[1030.73,507.65],[1030,491],[1030.73,474.35],[1032.9,457.83],[1036.51,441.57],[1041.52,425.67],[1047.9,410.28],[1055.59,395.5],[1064.54,381.45],[1074.69,368.23],[1085.94,355.94],[1098.23,344.69],[1111.45,334.54],[1125.5,325.59],[1140.28,317.9],[1155.67,311.52],[1171.57,306.51],[1187.83,302.9],[1204.35,300.73],[1221,300],[1237.65,300.73],[1254.17,302.9],[1270.43,306.51],[1286.33,311.52],[1301.72,317.9],[1316.5,325.59],[1330.55,334.54],[1343.77,344.69],[1356.06,355.94],[1367.31,368.23],[1377.46,381.45],[1386.41,395.5],[1394.1,410.28],[1400.48,425.67],[1405.49,441.57],[1409.1,457.83],[1411.27,474.35],[1412,491]],"w":3,"no":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"clx1x1","pts":[[1430,491],[1429.2,509.22],[1426.82,527.29],[1422.88,545.09],[1417.4,562.48],[1410.42,579.33],[1402,595.5],[1392.2,610.88],[1381.1,625.34],[1368.79,638.79],[1355.34,651.1],[1340.88,662.2],[1325.5,672],[1309.33,680.42],[1292.48,687.4],[1275.09,692.88],[1257.29,696.82],[1239.22,699.2],[1221,700],[1202.78,699.2],[1184.71,696.82],[1166.91,692.88],[1149.52,687.4],[1132.67,680.42],[1116.5,672],[1101.12,662.2],[1086.66,651.1],[1073.21,638.79],[1060.9,625.34],[1049.8,610.88],[1040,595.5],[1031.58,579.33],[1024.6,562.48],[1019.12,545.09],[1015.18,527.29],[1012.8,509.22],[1012,491],[1012.8,472.78],[1015.18,454.71],[1019.12,436.91],[1024.6,419.52],[1031.58,402.67],[1040,386.5],[1049.8,371.12],[1060.9,356.66],[1073.21,343.21],[1086.66,330.9],[1101.12,319.8],[1116.5,310],[1132.67,301.58],[1149.52,294.6],[1166.91,289.12],[1184.71,285.18],[1202.78,282.8],[1221,282],[1239.22,282.8],[1257.29,285.18],[1275.09,289.12],[1292.48,294.6],[1309.33,301.58],[1325.5,310],[1340.88,319.8],[1355.34,330.9],[1368.79,343.21],[1381.1,356.66],[1392.2,371.12],[1402,386.5],[1410.42,402.67],[1417.4,419.52],[1422.88,436.91],[1426.82,454.71],[1429.2,472.78],[1430,491]],"w":3,"no":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ar","id":"iax1","x0":1243,"y0":291,"x1":1199,"y1":291,"w":5,"no":["rs"],"need":"i","sel":"ia","var":{"ccw":{"x0":1243,"y0":291,"x1":1199,"y1":291},"cw":{"x0":1199,"y0":291,"x1":1243,"y1":291}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"itx1","k":"i","bases":[[1221,245,"middle",[0,-1]]],"no":["rs"],"need":"i","vis":[],"t":"F","x":1221,"y":125,"anc":"middle","n":"ix1"},{"f":"ar","id":"rdx1","x0":1231,"y0":497,"x1":1384.83,"y1":605.72,"two":1,"w":2,"no":["rs"],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rtx1","k":"r","bases":[[1312.92,578.36,"start",[0.5,1]]],"no":["rs"],"need":"r","vis":[],"t":"F","x":1406.83,"y":766.19,"anc":"start","n":"rx1"},{"f":"lb","id":"cltx1","k":"cl","bases":[[1371,321,"start",[1,-1]]],"no":["rs"],"need":"cl","vis":[],"t":"F","x":1371,"y":321,"anc":"start","n":"clx1"},{"f":"ln","id":"clbx1","pts":[[1501,491],[1499.93,515.4],[1496.75,539.62],[1491.46,563.47],[1484.11,586.77],[1474.77,609.33],[1463.49,631],[1450.36,651.6],[1435.49,670.98],[1418.99,688.99],[1400.98,705.49],[1381.6,720.36],[1361,733.49],[1339.33,744.77],[1316.77,754.11],[1293.47,761.46],[1269.62,766.75],[1245.4,769.93],[1221,771],[1196.6,769.93],[1172.38,766.75],[1148.53,761.46],[1125.23,754.11],[1102.67,744.77],[1081,733.49],[1060.4,720.36],[1041.02,705.49],[1023.01,688.99],[1006.51,670.98],[991.64,651.6],[978.51,631],[967.23,609.33],[957.89,586.77],[950.54,563.47],[945.25,539.62],[942.07,515.4],[941,491],[942.07,466.6],[945.25,442.38],[950.54,418.53],[957.89,395.23],[967.23,372.67],[978.51,351],[991.64,330.4],[1006.51,311.02],[1023.01,293.01],[1041.02,276.51],[1060.4,261.64],[1081,248.51],[1102.67,237.23],[1125.23,227.89],[1148.53,220.54],[1172.38,215.25],[1196.6,212.07],[1221,211],[1245.4,212.07],[1269.62,215.25],[1293.47,220.54],[1316.77,227.89],[1339.33,237.23],[1361,248.51],[1381.6,261.64],[1400.98,276.51],[1418.99,293.01],[1435.49,311.02],[1450.36,330.4],[1463.49,351],[1474.77,372.67],[1484.11,395.23],[1491.46,418.53],[1496.75,442.38],[1499.93,466.6],[1501,491]],"w":6,"o":["rs"],"vis":[],"t":"F"},{"f":"ln","id":"clbx0x1","pts":[[1492,491],[1490.97,514.62],[1487.88,538.06],[1482.77,561.14],[1475.66,583.69],[1466.61,605.53],[1455.69,626.5],[1442.99,646.44],[1428.6,665.2],[1412.63,682.63],[1395.2,698.6],[1376.44,712.99],[1356.5,725.69],[1335.53,736.61],[1313.69,745.66],[1291.14,752.77],[1268.06,757.88],[1244.62,760.97],[1221,762],[1197.38,760.97],[1173.94,757.88],[1150.86,752.77],[1128.31,745.66],[1106.47,736.61],[1085.5,725.69],[1065.56,712.99],[1046.8,698.6],[1029.37,682.63],[1013.4,665.2],[999.01,646.44],[986.31,626.5],[975.39,605.53],[966.34,583.69],[959.23,561.14],[954.12,538.06],[951.03,514.62],[950,491],[951.03,467.38],[954.12,443.94],[959.23,420.86],[966.34,398.31],[975.39,376.47],[986.31,355.5],[999.01,335.56],[1013.4,316.8],[1029.37,299.37],[1046.8,283.4],[1065.56,269.01],[1085.5,256.31],[1106.47,245.39],[1128.31,236.34],[1150.86,229.23],[1173.94,224.12],[1197.38,221.03],[1221,220],[1244.62,221.03],[1268.06,224.12],[1291.14,229.23],[1313.69,236.34],[1335.53,245.39],[1356.5,256.31],[1376.44,269.01],[1395.2,283.4],[1412.63,299.37],[1428.6,316.8],[1442.99,335.56],[1455.69,355.5],[1466.61,376.47],[1475.66,398.31],[1482.77,420.86],[1487.88,443.94],[1490.97,467.38],[1492,491]],"w":3,"o":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"clbx1x1","pts":[[1510,491],[1508.9,516.19],[1505.61,541.18],[1500.15,565.8],[1492.57,589.84],[1482.92,613.14],[1471.28,635.5],[1457.73,656.76],[1442.39,676.77],[1425.35,695.35],[1406.77,712.39],[1386.76,727.73],[1365.5,741.28],[1343.14,752.92],[1319.84,762.57],[1295.8,770.15],[1271.18,775.61],[1246.19,778.9],[1221,780],[1195.81,778.9],[1170.82,775.61],[1146.2,770.15],[1122.16,762.57],[1098.86,752.92],[1076.5,741.28],[1055.24,727.73],[1035.23,712.39],[1016.65,695.35],[999.61,676.77],[984.27,656.76],[970.72,635.5],[959.08,613.14],[949.43,589.84],[941.85,565.8],[936.39,541.18],[933.1,516.19],[932,491],[933.1,465.81],[936.39,440.82],[941.85,416.2],[949.43,392.16],[959.08,368.86],[970.72,346.5],[984.27,325.24],[999.61,305.23],[1016.65,286.65],[1035.23,269.61],[1055.24,254.27],[1076.5,240.72],[1098.86,229.08],[1122.16,219.43],[1146.2,211.85],[1170.82,206.39],[1195.81,203.1],[1221,202],[1246.19,203.1],[1271.18,206.39],[1295.8,211.85],[1319.84,219.43],[1343.14,229.08],[1365.5,240.72],[1386.76,254.27],[1406.77,269.61],[1425.35,286.65],[1442.39,305.23],[1457.73,325.24],[1471.28,346.5],[1482.92,368.86],[1492.57,392.16],[1500.15,416.2],[1505.61,440.82],[1508.9,465.81],[1510,491]],"w":3,"o":["rs"],"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ar","id":"iabx1","x0":1243,"y0":211,"x1":1199,"y1":211,"w":5,"o":["rs"],"need":"i","sel":"ia","var":{"ccw":{"x0":1243,"y0":211,"x1":1199,"y1":211},"cw":{"x0":1199,"y0":211,"x1":1243,"y1":211}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"itbx1","k":"i","bases":[[1221,165,"middle",[0,-1]]],"o":["rs"],"need":"i","vis":[],"t":"F","x":1221,"y":45,"anc":"middle","n":"ix1"},{"f":"ar","id":"rdbx1","x0":1231,"y0":497,"x1":1450.36,"y1":651.6,"two":1,"w":2,"o":["rs"],"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rtbx1","k":"r","bases":[[1345.68,601.3,"start",[0.5,1]]],"o":["rs"],"need":"r","vis":[],"t":"F","x":1377.88,"y":835.64,"anc":"start","n":"rx1"},{"f":"lb","id":"cltbx1","k":"cl","bases":[[1431,261,"start",[1,-1]]],"o":["rs"],"need":"cl","vis":[],"t":"F","x":1431,"y":261,"anc":"start","n":"clx1"},{"f":"c","id":"odx1","cx":1221,"cy":491,"r":7,"fill":"k","vis":[],"t":"F"},{"f":"lb","id":"otx1","k":"o","bases":[[1205,463,"end",[-1,-1]]],"need":"o","vis":[],"t":"F","x":1205,"y":463,"anc":"end","n":"ox1"},{"f":"lb","id":"htx1","k":"h","bases":[[1221,537,"middle",[0,1]],[1237,457,"start",[1,-1]]],"o":["hd"],"need":"h","vis":[],"t":"F","x":1221,"y":537,"anc":"middle","n":"hx1"},{"t":"cap","id":"u51s3sccap1","x":1229,"y":939.16,"s":"図2","vis":[]}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s3sc(d, p, L){ tbFig_Draw(d, p, L, U51S3K.sc); }
// ---- 51-4 平行な2本の力から逆に解く の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S4K = {
  pa: {"vars":[],"items":[{"f":"ln","id":"w1","pts":[[360,160],[360,680]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[680,160],[680,440]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"w2b","pts":[[680,500],[680,680]],"w":6,"vis":[],"t":"F"},{"f":"ar","id":"ia1","x0":334,"y0":280,"x1":334,"y1":180,"need":"i1","sel":"ia1","var":{"up":{"x0":334,"y0":310,"x1":334,"y1":210},"down":{"x0":334,"y0":210,"x1":334,"y1":310}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[352,230,"start",[1,0]],[316,230,"end",[-1,0]],[334,150,"middle",[0,-1]]],"vbases":{"up":[[352,230,"start",[1,0]],[316,230,"end",[-1,0]],[334,150,"middle",[0,-1]]],"down":[[352,330,"start",[1,0]],[316,330,"end",[-1,0]],[334,410,"middle",[0,1]]]},"need":"i1","sel":"ia1","var":{"up":{"x":372,"y":230,"anc":"start"},"down":{"x":372,"y":330,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":352,"y":230,"anc":"start"},{"f":"ar","id":"ia2","x0":706,"y0":280,"x1":706,"y1":180,"need":"i2","sel":"ia2","var":{"up":{"x0":706,"y0":310,"x1":706,"y1":210},"down":{"x0":706,"y0":210,"x1":706,"y1":310}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i2t","k":"i2","bases":[[724,230,"start",[1,0]],[688,230,"end",[-1,0]],[706,150,"middle",[0,-1]]],"vbases":{"up":[[724,230,"start",[1,0]],[688,230,"end",[-1,0]],[706,150,"middle",[0,-1]]],"down":[[724,330,"start",[1,0]],[688,330,"end",[-1,0]],[706,410,"middle",[0,1]]]},"need":"i2","sel":"ia2","var":{"up":{"x":724,"y":230,"anc":"start"},"down":{"x":724,"y":330,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":724,"y":230,"anc":"start"},{"f":"c","id":"h2c","cx":680,"cy":470,"r":24,"fill":"w","o":["h2d"],"vis":[],"t":"F","sel":["h2a"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"h2t","k":"h2","bases":[[716,510,"start",[1,1]]],"o":["h2d"],"need":"h2","vis":[],"t":"F","x":716,"y":510,"anc":"start"},{"f":"ar","id":"f1a","x0":374,"y0":470,"x1":484,"y1":470,"need":"f1","sel":"f1a","var":{"in":{"x0":374,"y0":470,"x1":484,"y1":470},"out":{"x0":346,"y0":470,"x1":236,"y1":470}},"dflt":"in","gr":"f1d","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[429,440,"middle",[0,-1]],[429,500,"middle",[0,1]],[500,470,"start",[1,0]]],"vbases":{"in":[[429,440,"middle",[0,-1]],[429,500,"middle",[0,1]],[500,470,"start",[1,0]]],"out":[[291,440,"middle",[0,-1]],[291,500,"middle",[0,1]],[220,470,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":429,"y":440,"anc":"middle"},"out":{"x":291,"y":440,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":429,"y":440,"anc":"middle"},{"f":"ar","id":"f2a","x0":632,"y0":470,"x1":522,"y1":470,"need":"f2","sel":"f2a","var":{"in":{"x0":632,"y0":470,"x1":522,"y1":470},"out":{"x0":728,"y0":470,"x1":838,"y1":470}},"dflt":"in","gr":"f2d","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[577,440,"middle",[0,-1]],[577,500,"middle",[0,1]],[506,470,"end",[-1,0]]],"vbases":{"in":[[577,440,"middle",[0,-1]],[577,500,"middle",[0,1]],[506,470,"end",[-1,0]]],"out":[[783,440,"middle",[0,-1]],[783,500,"middle",[0,1]],[854,470,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":577,"y":434,"anc":"middle"},"out":{"x":783,"y":434,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":577,"y":440,"anc":"middle"},{"f":"ln","id":"re1","pts":[[360,692],[360,754]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,692],[680,754]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":360,"y0":740,"x1":680,"y1":740,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[520,780,"middle",[0,1]],[520,700,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":520,"y":780,"anc":"middle"},{"f":"ln","id":"le1","pts":[[696,160],[894,160]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ln","id":"le2","pts":[[696,680],[894,680]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":880,"y0":160,"x1":880,"y1":680,"two":1,"w":2,"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[896,420,"start",[1,0]],[864,420,"end",[-1,0]]],"need":"l","vis":[],"t":"F","x":864,"y":394,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s4pa(d, p, L){ tbFig_Draw(d, p, L, U51S4K.pa); }
// ---- 51-5 右ねじから左手で力の向き の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S5K = {
  xs: {"vars":[],"items":[{"f":"c","id":"cc1","cx":300,"cy":420,"r":28,"fill":"w","vis":[],"t":"F","sel":["ca1"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"c1t","k":"c1","bases":[[300,490,"middle",[0,1]]],"need":"c1","vis":[],"t":"F","x":274,"y":490,"anc":"middle"},{"f":"lb","id":"i1t","k":"i1","bases":[[300,358,"middle",[0,-1]],[264,374,"end",[-1,-1]]],"need":"i1","vis":[],"t":"F","x":300,"y":358,"anc":"middle"},{"f":"ar","id":"h1a","x0":356,"y0":470,"x1":356,"y1":370,"w":3,"need":"h1","sel":"h1a","var":{"up":{"x0":356,"y0":470,"x1":356,"y1":370},"down":{"x0":356,"y0":370,"x1":356,"y1":470}},"dflt":"up","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h1t","k":"h1","bases":[[374,380,"start",[1,-1]],[374,460,"start",[1,1]]],"need":"h1","vis":[],"t":"F","x":374,"y":380,"anc":"start"},{"f":"ar","id":"f1a","x0":332,"y0":420,"x1":450,"y1":420,"w":5,"need":"f1","sel":"f1a","var":{"right":{"x0":332,"y0":420,"x1":450,"y1":420},"left":{"x0":268,"y0":420,"x1":150,"y1":420}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[410,454,"middle",[0,1]],[460,420,"start",[1,0]]],"vbases":{"right":[[410,454,"middle",[0,1]],[460,420,"start",[1,0]]],"left":[[190,454,"middle",[0,1]],[140,420,"end",[-1,0]]]},"need":"f1","sel":"f1a","var":{"right":{"x":410,"y":454,"anc":"middle"},"left":{"x":190,"y":454,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":410,"y":454,"anc":"middle"},{"f":"c","id":"cc2","cx":630,"cy":420,"r":28,"fill":"w","vis":[],"t":"F","sel":["ca2"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"c2t","k":"c2","bases":[[630,490,"middle",[0,1]]],"need":"c2","vis":[],"t":"F","x":604,"y":490,"anc":"middle"},{"f":"lb","id":"i2t","k":"i2","bases":[[630,358,"middle",[0,-1]],[594,374,"end",[-1,-1]]],"need":"i2","vis":[],"t":"F","x":630,"y":358,"anc":"middle"},{"f":"ar","id":"h2a","x0":686,"y0":470,"x1":686,"y1":370,"w":3,"need":"h2","sel":"h2a","var":{"up":{"x0":686,"y0":470,"x1":686,"y1":370},"down":{"x0":686,"y0":370,"x1":686,"y1":470}},"dflt":"up","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h2t","k":"h2","bases":[[704,380,"start",[1,-1]],[704,460,"start",[1,1]]],"need":"h2","vis":[],"t":"F","x":704,"y":380,"anc":"start"},{"f":"ar","id":"f2a","x0":662,"y0":420,"x1":780,"y1":420,"w":5,"need":"f2","sel":"f2a","var":{"right":{"x0":662,"y0":420,"x1":780,"y1":420},"left":{"x0":598,"y0":420,"x1":480,"y1":420}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[740,454,"middle",[0,1]],[790,420,"start",[1,0]]],"vbases":{"right":[[740,454,"middle",[0,1]],[790,420,"start",[1,0]]],"left":[[520,454,"middle",[0,1]],[470,420,"end",[-1,0]]]},"need":"f2","sel":"f2a","var":{"right":{"x":740,"y":454,"anc":"middle"},"left":{"x":520,"y":454,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":740,"y":454,"anc":"middle"},{"f":"ln","id":"d12e1","pts":[[300,466],[300,584]],"w":2,"need":"d12","vis":[],"t":"F"},{"f":"ln","id":"d12e2","pts":[[630,466],[630,584]],"w":2,"need":"d12","vis":[],"t":"F"},{"f":"ar","id":"d12d","x0":300,"y0":570,"x1":630,"y1":570,"two":1,"w":2,"need":"d12","vis":[],"t":"F"},{"f":"lb","id":"d12t","k":"d12","bases":[[465,610,"middle",[0,1]],[465,530,"middle",[0,-1]]],"need":"d12","vis":[],"t":"F","x":465,"y":610,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  xz: {"vars":[],"items":[{"f":"c","id":"cc1","cx":300,"cy":420,"r":28,"fill":"w","vis":[],"t":"F","sel":["ca1"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"c1t","k":"c1","bases":[[300,490,"middle",[0,1]]],"need":"c1","vis":[],"t":"F","x":260,"y":490,"anc":"middle"},{"f":"lb","id":"i1t","k":"i1","bases":[[300,358,"middle",[0,-1]],[264,374,"end",[-1,-1]]],"need":"i1","vis":[],"t":"F","x":300,"y":358,"anc":"middle"},{"f":"ar","id":"h1a","x0":356,"y0":470,"x1":356,"y1":370,"w":3,"need":"h1","sel":"h1a","var":{"up":{"x0":356,"y0":470,"x1":356,"y1":370},"down":{"x0":356,"y0":370,"x1":356,"y1":470}},"dflt":"up","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h1t","k":"h1","bases":[[374,380,"start",[1,-1]],[374,460,"start",[1,1]]],"need":"h1","vis":[],"t":"F","x":374,"y":380,"anc":"start"},{"f":"ar","id":"f1a","x0":332,"y0":420,"x1":450,"y1":420,"w":5,"need":"f1","sel":"f1a","var":{"right":{"x0":332,"y0":420,"x1":450,"y1":420},"left":{"x0":268,"y0":420,"x1":150,"y1":420}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[410,454,"middle",[0,1]],[460,420,"start",[1,0]]],"vbases":{"right":[[410,454,"middle",[0,1]],[460,420,"start",[1,0]]],"left":[[190,454,"middle",[0,1]],[140,420,"end",[-1,0]]]},"need":"f1","sel":"f1a","var":{"right":{"x":410,"y":454,"anc":"middle"},"left":{"x":190,"y":454,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":410,"y":454,"anc":"middle"},{"f":"c","id":"cc2","cx":630,"cy":420,"r":28,"fill":"w","vis":[],"t":"F","sel":["ca2"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"c2t","k":"c2","bases":[[630,490,"middle",[0,1]]],"need":"c2","vis":[],"t":"F","x":604,"y":490,"anc":"middle"},{"f":"lb","id":"i2t","k":"i2","bases":[[630,358,"middle",[0,-1]],[594,374,"end",[-1,-1]]],"need":"i2","vis":[],"t":"F","x":630,"y":358,"anc":"middle"},{"f":"ar","id":"h2a","x0":686,"y0":470,"x1":686,"y1":370,"w":3,"need":"h2","sel":"h2a","var":{"up":{"x0":686,"y0":470,"x1":686,"y1":370},"down":{"x0":686,"y0":370,"x1":686,"y1":470}},"dflt":"up","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"h2t","k":"h2","bases":[[704,380,"start",[1,-1]],[704,460,"start",[1,1]]],"need":"h2","vis":[],"t":"F","x":704,"y":380,"anc":"start"},{"f":"ar","id":"f2a","x0":662,"y0":420,"x1":780,"y1":420,"w":5,"need":"f2","sel":"f2a","var":{"right":{"x0":662,"y0":420,"x1":780,"y1":420},"left":{"x0":598,"y0":420,"x1":480,"y1":420}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[740,454,"middle",[0,1]],[790,420,"start",[1,0]]],"vbases":{"right":[[740,454,"middle",[0,1]],[790,420,"start",[1,0]]],"left":[[520,454,"middle",[0,1]],[470,420,"end",[-1,0]]]},"need":"f2","sel":"f2a","var":{"right":{"x":740,"y":460,"anc":"middle"},"left":{"x":520,"y":460,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":740,"y":454,"anc":"middle"},{"f":"ln","id":"d12e1","pts":[[300,466],[300,584]],"w":2,"need":"d12","vis":[],"t":"F"},{"f":"ln","id":"d12e2","pts":[[630,466],[630,584]],"w":2,"need":"d12","vis":[],"t":"F"},{"f":"ar","id":"d12d","x0":300,"y0":570,"x1":630,"y1":570,"two":1,"w":2,"need":"d12","vis":[],"t":"F"},{"f":"lb","id":"d12t","k":"d12","bases":[[465,610,"middle",[0,1]],[465,530,"middle",[0,-1]]],"need":"d12","vis":[],"t":"F","x":465,"y":610,"anc":"middle"},{"f":"ln","id":"xyzb","pts":[[860,320],[1060,320],[1060,500],[860,500]],"dash":1,"w":2,"close":1,"vis":[],"t":"F"},{"f":"c","id":"xyzc","cx":924,"cy":430,"r":16,"fill":"w","sign":"×","vis":[],"t":"F"},{"f":"ar","id":"xyzz","x0":924,"y0":412,"x1":924,"y1":346,"w":2,"vis":[],"t":"F"},{"f":"ar","id":"xyzx","x0":942,"y0":430,"x1":1026,"y1":430,"w":2,"vis":[],"t":"F"},{"f":"tx","id":"xyzzt","x":924,"y":334,"s":"z","anc":"middle","size":30,"vis":[],"t":"F"},{"f":"tx","id":"xyzxt","x":1042,"y":430,"s":"x","anc":"middle","size":30,"vis":[],"t":"F"},{"f":"tx","id":"xyzyt","x":902,"y":470,"s":"y","anc":"middle","size":30,"vis":[],"t":"F"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s5xs(d, p, L){ tbFig_Draw(d, p, L, U51S5K.xs); }
function tbU51s5xz(d, p, L){ tbFig_Draw(d, p, L, U51S5K.xz); }
// ---- 51-6 磁界の強さから磁束密度 の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S6K = {
  tr: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[740,430],[739.39,443.94],[737.57,457.78],[734.55,471.41],[730.35,484.72],[725.01,497.62],[718.56,510],[711.06,521.77],[702.57,532.85],[693.14,543.14],[682.85,552.57],[671.77,561.06],[660,568.56],[647.62,575.01],[634.72,580.35],[621.41,584.55],[607.78,587.57],[593.94,589.39],[580,590],[566.06,589.39],[552.22,587.57],[538.59,584.55],[525.28,580.35],[512.38,575.01],[500,568.56],[488.23,561.06],[477.15,552.57],[466.86,543.14],[457.43,532.85],[448.94,521.77],[441.44,510],[434.99,497.62],[429.65,484.72],[425.45,471.41],[422.43,457.78],[420.61,443.94],[420,430],[420.61,416.06],[422.43,402.22],[425.45,388.59],[429.65,375.28],[434.99,362.38],[441.44,350],[448.94,338.23],[457.43,327.15],[466.86,316.86],[477.15,307.43],[488.23,298.94],[500,291.44],[512.38,284.99],[525.28,279.65],[538.59,275.45],[552.22,272.43],[566.06,270.61],[580,270],[593.94,270.61],[607.78,272.43],[621.41,275.45],[634.72,279.65],[647.62,284.99],[660,291.44],[671.77,298.94],[682.85,307.43],[693.14,316.86],[702.57,327.15],[711.06,338.23],[718.56,350],[725.01,362.38],[730.35,375.28],[734.55,388.59],[737.57,402.22],[739.39,416.06],[740,430]],"w":80,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"co","pts":[[780,430],[779.24,447.43],[776.96,464.73],[773.19,481.76],[767.94,498.4],[761.26,514.52],[753.21,530],[743.83,544.72],[733.21,558.56],[721.42,571.42],[708.56,583.21],[694.72,593.83],[680,603.21],[664.52,611.26],[648.4,617.94],[631.76,623.19],[614.73,626.96],[597.43,629.24],[580,630],[562.57,629.24],[545.27,626.96],[528.24,623.19],[511.6,617.94],[495.48,611.26],[480,603.21],[465.28,593.83],[451.44,583.21],[438.58,571.42],[426.79,558.56],[416.17,544.72],[406.79,530],[398.74,514.52],[392.06,498.4],[386.81,481.76],[383.04,464.73],[380.76,447.43],[380,430],[380.76,412.57],[383.04,395.27],[386.81,378.24],[392.06,361.6],[398.74,345.48],[406.79,330],[416.17,315.28],[426.79,301.44],[438.58,288.58],[451.44,276.79],[465.28,266.17],[480,256.79],[495.48,248.74],[511.6,242.06],[528.24,236.81],[545.27,233.04],[562.57,230.76],[580,230],[597.43,230.76],[614.73,233.04],[631.76,236.81],[648.4,242.06],[664.52,248.74],[680,256.79],[694.72,266.17],[708.56,276.79],[721.42,288.58],[733.21,301.44],[743.83,315.28],[753.21,330],[761.26,345.48],[767.94,361.6],[773.19,378.24],[776.96,395.27],[779.24,412.57],[780,430]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"ci","pts":[[700,430],[699.54,440.46],[698.18,450.84],[695.91,461.06],[692.76,471.04],[688.76,480.71],[683.92,490],[678.3,498.83],[671.93,507.13],[664.85,514.85],[657.13,521.93],[648.83,528.3],[640,533.92],[630.71,538.76],[621.04,542.76],[611.06,545.91],[600.84,548.18],[590.46,549.54],[580,550],[569.54,549.54],[559.16,548.18],[548.94,545.91],[538.96,542.76],[529.29,538.76],[520,533.92],[511.17,528.3],[502.87,521.93],[495.15,514.85],[488.07,507.13],[481.7,498.83],[476.08,490],[471.24,480.71],[467.24,471.04],[464.09,461.06],[461.82,450.84],[460.46,440.46],[460,430],[460.46,419.54],[461.82,409.16],[464.09,398.94],[467.24,388.96],[471.24,379.29],[476.08,370],[481.7,361.17],[488.07,352.87],[495.15,345.15],[502.87,338.07],[511.17,331.7],[520,326.08],[529.29,321.24],[538.96,317.24],[548.94,314.09],[559.16,311.82],[569.54,310.46],[580,310],[590.46,310.46],[600.84,311.82],[611.06,314.09],[621.04,317.24],[630.71,321.24],[640,326.08],[648.83,331.7],[657.13,338.07],[664.85,345.15],[671.93,352.87],[678.3,361.17],[683.92,370],[688.76,379.29],[692.76,388.96],[695.91,398.94],[698.18,409.16],[699.54,419.54],[700,430]],"w":2,"vis":[],"t":"F"},{"f":"ln","id":"ll","pts":[[740,430],[739.39,443.94],[737.57,457.78],[734.55,471.41],[730.35,484.72],[725.01,497.62],[718.56,510],[711.06,521.77],[702.57,532.85],[693.14,543.14],[682.85,552.57],[671.77,561.06],[660,568.56],[647.62,575.01],[634.72,580.35],[621.41,584.55],[607.78,587.57],[593.94,589.39],[580,590],[566.06,589.39],[552.22,587.57],[538.59,584.55],[525.28,580.35],[512.38,575.01],[500,568.56],[488.23,561.06],[477.15,552.57],[466.86,543.14],[457.43,532.85],[448.94,521.77],[441.44,510],[434.99,497.62],[429.65,484.72],[425.45,471.41],[422.43,457.78],[420.61,443.94],[420,430],[420.61,416.06],[422.43,402.22],[425.45,388.59],[429.65,375.28],[434.99,362.38],[441.44,350],[448.94,338.23],[457.43,327.15],[466.86,316.86],[477.15,307.43],[488.23,298.94],[500,291.44],[512.38,284.99],[525.28,279.65],[538.59,275.45],[552.22,272.43],[566.06,270.61],[580,270],[593.94,270.61],[607.78,272.43],[621.41,275.45],[634.72,279.65],[647.62,284.99],[660,291.44],[671.77,298.94],[682.85,307.43],[693.14,316.86],[702.57,327.15],[711.06,338.23],[718.56,350],[725.01,362.38],[730.35,375.28],[734.55,388.59],[737.57,402.22],[739.39,416.06],[740,430]],"dash":1,"w":3,"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"ln","id":"lld","pts":[[734.55,471.41],[884.55,511.41]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[894.55,511.41,"start",[1,0]],[894.55,561.41,"start",[1,1]]],"need":"l","vis":[],"t":"F","x":894.55,"y":511.41,"anc":"start"},{"f":"c","id":"sc","cx":634.72,"cy":580.35,"r":34,"fill":"area","need":"s","vis":[],"t":"F"},{"f":"ln","id":"sld","pts":[[658.72,604.35],[714.72,690.35]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[724.72,700.35,"start",[1,1]],[714.72,730.35,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":724.72,"y":700.35,"anc":"start"},{"f":"ln","id":"muld","pts":[[708.56,276.79],[788.56,216.79]],"w":2,"need":"mu","vis":[],"t":"F"},{"f":"lb","id":"mut","k":"mu","bases":[[798.56,206.79,"start",[1,-1]]],"need":"mu","vis":[],"t":"F","x":798.56,"y":206.79,"anc":"start"},{"f":"lb","id":"coret","k":"core","bases":[[540,190,"end",[-1,-1]],[800,270,"start",[1,-1]]],"need":"core","vis":[],"t":"F","x":540,"y":190,"anc":"end"},{"f":"ln","id":"wd0","pts":[[492.67,356.72],[409.22,314.81]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd1","pts":[[481.27,373],[391.81,346.21]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd2","pts":[[472.88,391.01],[380.12,380.16]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd3","pts":[[467.73,410.2],[374.5,415.63]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd4","pts":[[466,430],[375.13,451.53]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd5","pts":[[467.73,449.8],[381.98,486.78]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd6","pts":[[472.88,468.99],[394.85,520.3]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd7","pts":[[481.27,487],[413.34,551.08]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"wd8","pts":[[492.67,503.28],[436.9,578.18]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld0","pts":[[416.17,315.28],[180,315.28]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[416.17,544.72],[180,544.72]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tm0","cx":180,"cy":315.28,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"tm1","cx":180,"cy":544.72,"r":7,"fill":"w","vis":[],"t":"F"},{"f":"ar","id":"ia","x0":210,"y0":293.28,"x1":290,"y1":293.28,"w":3,"need":"i","sel":"ia","var":{"in":{"x0":210,"y0":293.28,"x1":290,"y1":293.28},"out":{"x0":290,"y0":293.28,"x1":210,"y1":293.28}},"dflt":"in","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[250,257.28,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":250,"y":257.28,"anc":"middle"},{"f":"lb","id":"nt","k":"n","bases":[[580,430,"middle",[0,0]],[166,430,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":580,"y":430,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s6tr(d, p, L){ tbFig_Draw(d, p, L, U51S6K.tr); }
// ---- 51-7 電流のグラフから自己誘導起電力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S7K = {
  g1: {"vars":[],"items":[{"f":"ar","id":"gax","x0":200,"y0":520,"x1":890,"y1":520,"w":2,"vis":[],"t":"F"},{"f":"ar","id":"gay","x0":220,"y0":550,"x1":220,"y1":100,"w":2,"vis":[],"t":"F"},{"f":"tx","id":"go","x":206,"y":550,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"lb","id":"gxt","k":"gx","bases":[[900,520,"start",[1,0]],[890,470,"end",[1,-1]]],"need":"gx","vis":[],"t":"F","x":906,"y":520,"anc":"start"},{"f":"lb","id":"gyt","k":"gy","bases":[[204,100,"end",[-1,-1]],[236,100,"start",[1,-1]]],"need":"gy","vis":[],"t":"F","x":236,"y":100,"anc":"start"},{"f":"ln","id":"gl","pts":[[220,520],[478.33,270],[736.67,270],[840,520]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"gv1d","pts":[[220,270],[478.33,270]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"lb","id":"gv1t","k":"gv1","bases":[[204,270,"end",[-1,0]]],"need":"gv1","vis":[],"t":"F","x":204,"y":270,"anc":"end"},{"f":"ln","id":"gt1d","pts":[[478.33,270],[478.33,520]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"gt2d","pts":[[736.67,270],[736.67,520]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"gw1e0","pts":[[220,526],[220,576]],"w":2,"need":"gw1","vis":[],"t":"F"},{"f":"ln","id":"gw1e1","pts":[[478.33,526],[478.33,576]],"w":2,"need":"gw1","vis":[],"t":"F"},{"f":"ar","id":"gw1d","x0":220,"y0":564,"x1":478.33,"y1":564,"two":1,"w":2,"need":"gw1","vis":[],"t":"F"},{"f":"lb","id":"gw1t","k":"gw1","bases":[[349.17,620,"middle",[0,1]],[349.17,790,"middle",[0,1]]],"need":"gw1","vis":[],"t":"F","x":349.17,"y":620,"anc":"middle"},{"f":"ln","id":"gw2e0","pts":[[478.33,526],[478.33,576]],"w":2,"need":"gw2","vis":[],"t":"F"},{"f":"ln","id":"gw2e1","pts":[[736.67,526],[736.67,576]],"w":2,"need":"gw2","vis":[],"t":"F"},{"f":"ar","id":"gw2d","x0":478.33,"y0":564,"x1":736.67,"y1":564,"two":1,"w":2,"need":"gw2","vis":[],"t":"F"},{"f":"lb","id":"gw2t","k":"gw2","bases":[[607.5,620,"middle",[0,1]],[607.5,790,"middle",[0,1]]],"need":"gw2","vis":[],"t":"F","x":607.5,"y":620,"anc":"middle"},{"f":"ln","id":"gw3e0","pts":[[736.67,526],[736.67,576]],"w":2,"need":"gw3","vis":[],"t":"F"},{"f":"ln","id":"gw3e1","pts":[[840,526],[840,576]],"w":2,"need":"gw3","vis":[],"t":"F"},{"f":"ar","id":"gw3d","x0":736.67,"y0":564,"x1":840,"y1":564,"two":1,"w":2,"need":"gw3","vis":[],"t":"F"},{"f":"lb","id":"gw3t","k":"gw3","bases":[[788.33,620,"middle",[0,1]],[788.33,790,"middle",[0,1]]],"need":"gw3","vis":[],"t":"F","x":788.33,"y":620,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  g2: {"vars":[],"items":[{"f":"ar","id":"gax","x0":200,"y0":520,"x1":890,"y1":520,"w":2,"vis":[],"t":"F"},{"f":"ar","id":"gay","x0":220,"y0":550,"x1":220,"y1":100,"w":2,"vis":[],"t":"F"},{"f":"tx","id":"go","x":206,"y":550,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"lb","id":"gxt","k":"gx","bases":[[900,520,"start",[1,0]],[890,470,"end",[1,-1]]],"need":"gx","vis":[],"t":"F","x":932.43,"y":427.57,"anc":"end"},{"f":"lb","id":"gyt","k":"gy","bases":[[204,100,"end",[-1,-1]],[236,100,"start",[1,-1]]],"need":"gy","vis":[],"t":"F","x":236,"y":100,"anc":"start"},{"f":"ln","id":"gl","pts":[[220,520],[344,270],[592,270],[840,520]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"gv1d","pts":[[220,270],[344,270]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"lb","id":"gv1t","k":"gv1","bases":[[204,270,"end",[-1,0]]],"need":"gv1","vis":[],"t":"F","x":204,"y":270,"anc":"end"},{"f":"ln","id":"gt1d","pts":[[344,270],[344,520]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"gt2d","pts":[[592,270],[592,520]],"dash":1,"w":2,"vis":[],"t":"F"},{"f":"ln","id":"gw1e0","pts":[[220,526],[220,576]],"w":2,"need":"gw1","vis":[],"t":"F"},{"f":"ln","id":"gw1e1","pts":[[344,526],[344,576]],"w":2,"need":"gw1","vis":[],"t":"F"},{"f":"ar","id":"gw1d","x0":220,"y0":564,"x1":344,"y1":564,"two":1,"w":2,"need":"gw1","vis":[],"t":"F"},{"f":"lb","id":"gw1t","k":"gw1","bases":[[282,620,"middle",[0,1]],[282,790,"middle",[0,1]]],"need":"gw1","vis":[],"t":"F","x":282,"y":620,"anc":"middle"},{"f":"ln","id":"gw2e0","pts":[[344,526],[344,576]],"w":2,"need":"gw2","vis":[],"t":"F"},{"f":"ln","id":"gw2e1","pts":[[592,526],[592,576]],"w":2,"need":"gw2","vis":[],"t":"F"},{"f":"ar","id":"gw2d","x0":344,"y0":564,"x1":592,"y1":564,"two":1,"w":2,"need":"gw2","vis":[],"t":"F"},{"f":"lb","id":"gw2t","k":"gw2","bases":[[468,620,"middle",[0,1]],[468,790,"middle",[0,1]]],"need":"gw2","vis":[],"t":"F","x":468,"y":620,"anc":"middle"},{"f":"ln","id":"gw3e0","pts":[[592,526],[592,576]],"w":2,"need":"gw3","vis":[],"t":"F"},{"f":"ln","id":"gw3e1","pts":[[840,526],[840,576]],"w":2,"need":"gw3","vis":[],"t":"F"},{"f":"ar","id":"gw3d","x0":592,"y0":564,"x1":840,"y1":564,"two":1,"w":2,"need":"gw3","vis":[],"t":"F"},{"f":"lb","id":"gw3t","k":"gw3","bases":[[716,620,"middle",[0,1]],[716,790,"middle",[0,1]]],"need":"gw3","vis":[],"t":"F","x":716,"y":620,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s7g1(d, p, L){ tbFig_Draw(d, p, L, U51S7K.g1); }
function tbU51s7g2(d, p, L){ tbFig_Draw(d, p, L, U51S7K.g2); }
// ---- 51-8 磁束鎖交数から起電力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s8.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S8K = {
  cm: {"vars":[],"items":[{"f":"ln","id":"mga","pts":[[140,380],[250,380],[250,460],[140,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"s","col":"#1971c2"},"S":{"fill":"n","col":"#c92a2a"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgat","x":195,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"S"},"S":{"s":"N"}},"dflt":"N","vis":[],"t":"F"},{"f":"ln","id":"mgb","pts":[[250,380],[360,380],[360,460],[250,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgbt","x":305,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"mgt","k":"mg","bases":[[250,496,"middle",[0,1]]],"mv":[["pos",160,0]],"need":"mg","vis":[],"t":"F","x":250,"y":496,"anc":"middle"},{"f":"ar","id":"goa","x0":200,"y0":310,"x1":320,"y1":310,"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x0":190,"y0":330,"x1":320,"y1":330},"left":{"x0":320,"y0":330,"x1":190,"y1":330},"in":{"x0":190,"y0":330,"x1":320,"y1":330},"out":{"x0":320,"y0":330,"x1":190,"y1":330}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"got","k":"go","bases":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"vbases":{"right":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"left":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]],"in":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"out":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]]},"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x":260,"y":280,"anc":"middle"},"left":{"x":140,"y":280,"anc":"middle"},"in":{"x":260,"y":280,"anc":"middle"},"out":{"x":140,"y":280,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":260,"y":280,"anc":"middle"},{"f":"ln","id":"phf0","pts":[[362,400],[620,220],[860,160]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn0","pts":[[522,400],[700,340],[900,310]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf1","pts":[[362,420],[620,420],[860,420]],"w":3,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn1","pts":[[522,420],[700,420],[900,420]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf2","pts":[[362,440],[620,620],[860,680]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn2","pts":[[522,440],[700,500],[900,530]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"pht","k":"ph","bases":[[870,300,"start",[1,-1]]],"need":"ph","vis":[],"t":"F","x":851.62,"y":281.62,"anc":"start"},{"f":"ln","id":"clb","pts":[[700,550],[695.19,549.29],[690.44,547.16],[685.79,543.64],[681.29,538.76],[677,532.58],[672.96,525.17],[669.22,516.61],[665.82,506.99],[662.79,496.41],[660.16,485],[657.98,472.88],[656.25,460.17],[655.01,447.03],[654.25,433.59],[654,420],[654.25,406.41],[655.01,392.97],[656.25,379.83],[657.98,367.12],[660.16,355],[662.79,343.59],[665.82,333.01],[669.22,323.39],[672.96,314.83],[677,307.42],[681.29,301.24],[685.79,296.36],[690.44,292.84],[695.19,290.71],[700,290]],"dash":1,"w":4,"vis":[],"t":"F"},{"f":"ln","id":"clf","pts":[[700,290],[704.81,290.71],[709.56,292.84],[714.21,296.36],[718.71,301.24],[723,307.42],[727.04,314.83],[730.78,323.39],[734.18,333.01],[737.21,343.59],[739.84,355],[742.02,367.12],[743.75,379.83],[744.99,392.97],[745.75,406.41],[746,420],[745.75,433.59],[744.99,447.03],[743.75,460.17],[742.02,472.88],[739.84,485],[737.21,496.41],[734.18,506.99],[730.78,516.61],[727.04,525.17],[723,532.58],[718.71,538.76],[714.21,543.64],[709.56,547.16],[704.81,549.29],[700,550]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"cl0","pts":[[694,550],[694,640]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"cl1","pts":[[722,544],[722,640]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"clt","k":"cl","bases":[[760,290,"start",[1,-1]]],"need":"cl","vis":[],"t":"F","x":760,"y":290,"anc":"start"},{"f":"ar","id":"ipa","x0":630,"y0":420,"x1":770,"y1":420,"w":12,"o":["ipd"],"need":"ip","sel":"ipa","var":{"left":{"x0":770,"y0":420,"x1":630,"y1":420},"right":{"x0":630,"y0":420,"x1":770,"y1":420}},"dflt":"right","col":"#adb5bd","vis":[],"t":"F"},{"f":"lb","id":"ipt","k":"ip","bases":[[700,380,"middle",[0,-1]]],"o":["ipd"],"need":"ip","vis":[],"t":"F","x":700,"y":380,"anc":"middle"},{"f":"ar","id":"ih0","x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76},"cw":{"x0":736.74,"y0":341.76,"x1":742.34,"y1":369.2}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"ih1","x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8},"cw":{"x0":742.34,"y0":470.8,"x1":736.74,"y1":498.24}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[776,480,"start",[1,1]]],"o":["id"],"need":"i","vis":[],"t":"F","x":776,"y":480,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[640,610,"end",[-1,1]]],"need":"n","vis":[],"t":"F","x":597.57,"y":652.43,"anc":"end"},{"f":"ar","id":"ea","x0":790,"y0":630,"x1":790,"y1":560,"w":3,"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[810,596,"start",[1,0]]],"need":"e","vis":[],"t":"F","x":810,"y":596,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s8cm(d, p, L){ tbFig_Draw(d, p, L, U51S8K.cm); }
// ---- 51-9 磁束鎖交数から磁気エネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s9.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S9K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s9co(d, p, L){ tbFig_Draw(d, p, L, U51S9K.co); }
// ---- 51-10 和動から結合係数 の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s10.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S10K = {
  tc: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[340,230],[760,230],[760,610],[340,610]],"w":70,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"w1r0","pts":[[299,342],[381,318]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r1","pts":[[299,378],[381,354]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r2","pts":[[299,414],[381,390]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r3","pts":[[299,450],[381,426]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r4","pts":[[299,486],[381,462]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1r5","pts":[[299,522],[381,498]],"w":3,"sel":"w1","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l0","pts":[[299,318],[381,342]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l1","pts":[[299,354],[381,378]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l2","pts":[[299,390],[381,414]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l3","pts":[[299,426],[381,450]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l4","pts":[[299,462],[381,486]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w1l5","pts":[[299,498],[381,522]],"w":3,"sel":"w1","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"lb","id":"n1t","k":"n1","bases":[[285,270,"end",[-1,-1]]],"need":"n1","vis":[],"t":"F","x":285,"y":270,"anc":"end"},{"f":"lb","id":"l1t","k":"l1","bases":[[285,570,"end",[-1,1]]],"need":"l1","vis":[],"t":"F","x":200.15,"y":654.85,"anc":"end"},{"f":"ln","id":"w2r0","pts":[[719,342],[801,318]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r1","pts":[[719,378],[801,354]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r2","pts":[[719,414],[801,390]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r3","pts":[[719,450],[801,426]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r4","pts":[[719,486],[801,462]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2r5","pts":[[719,522],[801,498]],"w":3,"sel":"w2","var":{"r":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l0","pts":[[719,318],[801,342]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l1","pts":[[719,354],[801,378]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l2","pts":[[719,390],[801,414]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l3","pts":[[719,426],[801,450]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l4","pts":[[719,462],[801,486]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"ln","id":"w2l5","pts":[[719,498],[801,522]],"w":3,"sel":"w2","var":{"l":{}},"dflt":"r","vis":[],"t":"F"},{"f":"lb","id":"n2t","k":"n2","bases":[[815,270,"start",[1,-1]]],"need":"n2","vis":[],"t":"F","x":815,"y":270,"anc":"start"},{"f":"lb","id":"l2t","k":"l2","bases":[[815,570,"start",[1,1]]],"need":"l2","vis":[],"t":"F","x":899.85,"y":654.85,"anc":"start"},{"f":"ln","id":"ph1","pts":[[354,244],[746,244],[746,596],[354,596]],"dash":1,"w":4,"close":1,"o":["phi1d"],"need":"phi1","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh10","x0":490,"y0":244,"x1":530,"y1":244,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":490,"y0":244,"x1":530,"y1":244},"ccw":{"x0":530,"y0":244,"x1":490,"y1":244}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh11","x0":746,"y0":400,"x1":746,"y1":440,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":746,"y0":400,"x1":746,"y1":440},"ccw":{"x0":746,"y0":440,"x1":746,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh12","x0":530,"y0":596,"x1":490,"y1":596,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":530,"y0":596,"x1":490,"y1":596},"ccw":{"x0":490,"y0":596,"x1":530,"y1":596}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh13","x0":354,"y0":440,"x1":354,"y1":400,"w":5,"o":["phi1d"],"need":"phi1","sel":"phi1a","var":{"cw":{"x0":354,"y0":440,"x1":354,"y1":400},"ccw":{"x0":354,"y0":400,"x1":354,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi1t","k":"phi1","bases":[[460,161,"middle",[0,-1]]],"o":["phi1d"],"need":"phi1","vis":[],"t":"F","x":460,"y":161,"anc":"middle"},{"f":"ln","id":"ph2","pts":[[326,216],[774,216],[774,624],[326,624]],"dash":1,"w":4,"close":1,"o":["phi2d"],"need":"phi2","col":"#868e96","vis":[],"t":"F"},{"f":"ar","id":"phh20","x0":570,"y0":216,"x1":610,"y1":216,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":570,"y0":216,"x1":610,"y1":216},"ccw":{"x0":610,"y0":216,"x1":570,"y1":216}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh21","x0":774,"y0":400,"x1":774,"y1":440,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":774,"y0":400,"x1":774,"y1":440},"ccw":{"x0":774,"y0":440,"x1":774,"y1":400}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh22","x0":610,"y0":624,"x1":570,"y1":624,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":610,"y0":624,"x1":570,"y1":624},"ccw":{"x0":570,"y0":624,"x1":610,"y1":624}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh23","x0":326,"y0":440,"x1":326,"y1":400,"w":5,"o":["phi2d"],"need":"phi2","sel":"phi2a","var":{"cw":{"x0":326,"y0":440,"x1":326,"y1":400},"ccw":{"x0":326,"y0":400,"x1":326,"y1":440}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phi2t","k":"phi2","bases":[[640,161,"middle",[0,-1]]],"o":["phi2d"],"need":"phi2","vis":[],"t":"F","x":640,"y":161,"anc":"middle"},{"f":"lb","id":"mt","k":"m","bases":[[550,400,"middle",[0,-1]]],"need":"m","vis":[],"t":"F","x":550,"y":400,"anc":"middle"},{"f":"lb","id":"kct","k":"kc","bases":[[550,460,"middle",[0,1]]],"need":"kc","vis":[],"t":"F","x":550,"y":472,"anc":"middle"},{"f":"ln","id":"lk0","pts":[[320.9,501.25],[310.91,499.56],[301.18,497.19],[291.78,494.15],[282.8,490.47],[274.31,486.18],[266.4,481.31],[259.12,475.91],[252.54,470.03],[246.71,463.72],[241.7,457.03],[237.54,450.01],[234.26,442.74],[231.9,435.27],[230.48,427.67],[230,420],[230.48,412.33],[231.9,404.73],[234.26,397.26],[237.54,389.99],[241.7,382.97],[246.71,376.28],[252.54,369.97],[259.12,364.09],[266.4,358.69],[274.31,353.82],[282.8,349.53],[291.78,345.85],[301.18,342.81],[310.91,340.44],[320.9,338.75]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"ln","id":"lk1","pts":[[313.95,530.79],[300.33,528.5],[287.06,525.26],[274.24,521.11],[262,516.09],[250.43,510.24],[239.63,503.6],[229.7,496.24],[220.73,488.23],[212.79,479.62],[205.96,470.49],[200.28,460.93],[195.81,451.01],[192.59,440.82],[190.65,430.46],[190,420],[190.65,409.54],[192.59,399.18],[195.81,388.99],[200.28,379.07],[205.96,369.51],[212.79,360.38],[220.73,351.77],[229.7,343.76],[239.63,336.4],[250.43,329.76],[262,323.91],[274.24,318.89],[287.06,314.74],[300.33,311.5],[313.95,309.21]],"dash":1,"w":3,"o":["lkd"],"need":"lk","vis":[],"t":"F"},{"f":"lb","id":"lkt","k":"lk","bases":[[170,280,"end",[-1,-1]]],"o":["lkd"],"need":"lk","vis":[],"t":"F","x":170,"y":280,"anc":"end"},{"f":"lb","id":"mut","k":"mu","bases":[[550,679,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":550,"y":679,"anc":"middle"},{"f":"ln","id":"ll","pts":[[340,230],[760,230],[760,610],[340,610]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[670,545,"middle",[0,-1]]],"need":"l","vis":[],"t":"F","x":670,"y":545,"anc":"middle"},{"f":"ln","id":"sq","pts":[[524,196],[576,196],[590,264],[538,264]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,161,"middle",[0,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":550,"y":161,"anc":"middle"},{"f":"ln","id":"s1t","pts":[[299,316],[140,316]],"w":3,"vis":[],"t":"F"},{"f":"c","id":"tma","cx":134,"cy":316,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[118,316,"end",[-1,0]]],"need":"a","vis":[],"t":"F","x":118,"y":316,"anc":"end"},{"f":"ln","id":"s1b","pts":[[299,524],[220,524],[220,715],[880,715]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"s2a","pts":[[880,715],[880,524],[801,524]],"w":3,"sel":"j2","var":{"bot":{"pts":[[880,715],[880,524],[801,524]]},"top":{"pts":[[880,715],[880,316],[801,316]]}},"dflt":"bot","vis":[],"t":"F"},{"f":"ln","id":"s2b","pts":[[801,316],[960,316]],"w":3,"sel":"j2","var":{"bot":{"pts":[[801,316],[960,316]]},"top":{"pts":[[801,524],[960,524]]}},"dflt":"bot","vis":[],"t":"F"},{"f":"c","id":"tmb","cx":966,"cy":316,"r":6,"fill":"w","sel":"j2","var":{"bot":{"cx":966,"cy":316},"top":{"cx":966,"cy":524}},"dflt":"bot","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[982,316,"start",[1,0]]],"vbases":{"bot":[[982,316,"start",[1,0]]],"top":[[982,524,"start",[1,0]]]},"need":"b","sel":"j2","var":{"bot":{"x":982,"y":316,"anc":"start"},"top":{"x":982,"y":524,"anc":"start"}},"dflt":"bot","vis":[],"t":"F","x":982,"y":316,"anc":"start"},{"f":"ar","id":"ia","x0":150,"y0":316,"x1":230,"y1":316,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[190,286,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":190,"y":266,"anc":"middle"},{"f":"lb","id":"ltt","k":"lt","bases":[[550,761,"middle",[0,1]],[990,420,"start",[1,0]]],"need":"lt","vis":[],"t":"F","x":550,"y":761,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s10tc(d, p, L){ tbFig_Draw(d, p, L, U51S10K.tc); }
// ---- 51-11 導体棒の起電力から電流 の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s11.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S11K = {
  rl: {"vars":[],"items":[{"f":"ln","id":"rt","pts":[[260,250],[980,250]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"rb","pts":[[260,600],[980,600]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"wl0","pts":[[260,250],[260,385]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"wl1","pts":[[260,465],[260,600]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"rr","pts":[[247,385],[273,385],[273,465],[247,465]],"w":3,"fill":"w","close":1,"vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[230,425,"end",[-1,0]]],"need":"r","vis":[],"t":"F","x":230,"y":425,"anc":"end"},{"f":"c","id":"ct","cx":260,"cy":250,"r":8,"fill":"k","vis":[],"t":"F"},{"f":"c","id":"cb","cx":260,"cy":600,"r":8,"fill":"k","vis":[],"t":"F"},{"f":"ar","id":"ia","x0":286,"y0":560,"x1":286,"y1":490,"w":4,"need":"i","sel":"ia","var":{"up":{"x0":286,"y0":560,"x1":286,"y1":490},"down":{"x0":286,"y0":490,"x1":286,"y1":560}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[304,525,"start",[1,0]],[268,525,"end",[-1,0]]],"need":"i","vis":[],"t":"F","x":304,"y":525,"anc":"start"},{"f":"ln","id":"rod","pts":[[650,200],[650,650]],"w":8,"col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"npt","k":"np","bases":[[650,170,"middle",[0,-1]]],"need":"np","vis":[],"t":"F","x":650,"y":164,"anc":"middle"},{"f":"lb","id":"nqt","k":"nq","bases":[[650,680,"middle",[0,1]]],"need":"nq","vis":[],"t":"F","x":650,"y":686,"anc":"middle"},{"f":"c","id":"bsc","cx":450,"cy":435,"r":24,"fill":"w","need":"bs","vis":[],"t":"F","sel":["bs"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"bt","k":"b","bases":[[450,365,"middle",[0,-1]],[450,495,"middle",[0,1]]],"need":"b","vis":[],"t":"F","x":450,"y":365,"anc":"middle"},{"f":"ar","id":"va","x0":670,"y0":425,"x1":810,"y1":425,"w":5,"need":"v","sel":"va","var":{"right":{"x0":670,"y0":425,"x1":810,"y1":425},"left":{"x0":810,"y0":425,"x1":670,"y1":425}},"dflt":"right","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[740,457,"middle",[0,1]],[740,393,"middle",[0,-1]]],"need":"v","vis":[],"t":"F","x":748,"y":463,"anc":"middle"},{"f":"ln","id":"tha","pts":[[650,365],[657.83,365.51],[665.53,367.04],[672.96,369.57],[680,373.04],[686.53,377.4],[692.43,382.57],[697.6,388.47],[701.96,395],[705.43,402.04],[707.96,409.47],[709.49,417.17],[710,425]],"w":2,"need":"th","vis":[],"t":"F"},{"f":"lb","id":"tht","k":"th","bases":[[700,355,"start",[1,-1]]],"need":"th","vis":[],"t":"F","x":700,"y":355,"anc":"start"},{"f":"ln","id":"le1","pts":[[986,250],[1034,250]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ln","id":"le2","pts":[[986,600],[1034,600]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":1020,"y0":250,"x1":1020,"y1":600,"two":1,"w":2,"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[1036,425,"start",[1,0]],[1004,425,"end",[-1,0]]],"need":"l","vis":[],"t":"F","x":1004,"y":385,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s11rl(d, p, L){ tbFig_Draw(d, p, L, U51S11K.rl); }
// ---- 51-12 単位を式から出す（磁気） の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s12.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S12K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  cm: {"vars":[],"items":[{"f":"ln","id":"mga","pts":[[140,380],[250,380],[250,460],[140,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"s","col":"#1971c2"},"S":{"fill":"n","col":"#c92a2a"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgat","x":195,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"S"},"S":{"s":"N"}},"dflt":"N","vis":[],"t":"F"},{"f":"ln","id":"mgb","pts":[[250,380],[360,380],[360,460],[250,460]],"w":3,"close":1,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"dflt":"N","vis":[],"t":"F"},{"f":"tx","id":"mgbt","x":305,"y":420,"s":"N","anc":"middle","size":36,"mv":[["pos",160,0]],"sel":"mgs","var":{"N":{"s":"N"},"S":{"s":"S"}},"dflt":"N","vis":[],"t":"F"},{"f":"lb","id":"mgt","k":"mg","bases":[[250,496,"middle",[0,1]]],"mv":[["pos",160,0]],"need":"mg","vis":[],"t":"F","x":250,"y":496,"anc":"middle"},{"f":"ar","id":"goa","x0":200,"y0":310,"x1":320,"y1":310,"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x0":190,"y0":330,"x1":320,"y1":330},"left":{"x0":320,"y0":330,"x1":190,"y1":330},"in":{"x0":190,"y0":330,"x1":320,"y1":330},"out":{"x0":320,"y0":330,"x1":190,"y1":330}},"dflt":"right","vis":[],"t":"F"},{"f":"lb","id":"got","k":"go","bases":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"vbases":{"right":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"left":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]],"in":[[260,280,"middle",[0,-1]],[260,340,"middle",[0,1]],[338,310,"start",[1,0]]],"out":[[140,280,"middle",[0,-1]],[140,340,"middle",[0,1]],[62,310,"end",[-1,0]]]},"mv":[["pos",160,0]],"need":"go","sel":"goa","var":{"right":{"x":260,"y":280,"anc":"middle"},"left":{"x":140,"y":280,"anc":"middle"},"in":{"x":260,"y":280,"anc":"middle"},"out":{"x":140,"y":280,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":260,"y":280,"anc":"middle"},{"f":"ln","id":"phf0","pts":[[362,400],[620,220],[860,160]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn0","pts":[[522,400],[700,340],[900,310]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf1","pts":[[362,420],[620,420],[860,420]],"w":3,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn1","pts":[[522,420],[700,420],[900,420]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"ln","id":"phf2","pts":[[362,440],[620,620],[860,680]],"w":2,"no":["pos"],"need":"ph","col":"#868e96","vis":[],"t":"F"},{"f":"ln","id":"phn2","pts":[[522,440],[700,500],[900,530]],"w":3,"o":["pos"],"need":"ph","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"pht","k":"ph","bases":[[870,300,"start",[1,-1]]],"need":"ph","vis":[],"t":"F","x":851.62,"y":281.62,"anc":"start"},{"f":"ln","id":"clb","pts":[[700,550],[695.19,549.29],[690.44,547.16],[685.79,543.64],[681.29,538.76],[677,532.58],[672.96,525.17],[669.22,516.61],[665.82,506.99],[662.79,496.41],[660.16,485],[657.98,472.88],[656.25,460.17],[655.01,447.03],[654.25,433.59],[654,420],[654.25,406.41],[655.01,392.97],[656.25,379.83],[657.98,367.12],[660.16,355],[662.79,343.59],[665.82,333.01],[669.22,323.39],[672.96,314.83],[677,307.42],[681.29,301.24],[685.79,296.36],[690.44,292.84],[695.19,290.71],[700,290]],"dash":1,"w":4,"vis":[],"t":"F"},{"f":"ln","id":"clf","pts":[[700,290],[704.81,290.71],[709.56,292.84],[714.21,296.36],[718.71,301.24],[723,307.42],[727.04,314.83],[730.78,323.39],[734.18,333.01],[737.21,343.59],[739.84,355],[742.02,367.12],[743.75,379.83],[744.99,392.97],[745.75,406.41],[746,420],[745.75,433.59],[744.99,447.03],[743.75,460.17],[742.02,472.88],[739.84,485],[737.21,496.41],[734.18,506.99],[730.78,516.61],[727.04,525.17],[723,532.58],[718.71,538.76],[714.21,543.64],[709.56,547.16],[704.81,549.29],[700,550]],"w":4,"vis":[],"t":"F"},{"f":"ln","id":"cl0","pts":[[694,550],[694,640]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"cl1","pts":[[722,544],[722,640]],"w":3,"vis":[],"t":"F"},{"f":"lb","id":"clt","k":"cl","bases":[[760,290,"start",[1,-1]]],"need":"cl","vis":[],"t":"F","x":760,"y":290,"anc":"start"},{"f":"ar","id":"ipa","x0":630,"y0":420,"x1":770,"y1":420,"w":12,"o":["ipd"],"need":"ip","sel":"ipa","var":{"left":{"x0":770,"y0":420,"x1":630,"y1":420},"right":{"x0":630,"y0":420,"x1":770,"y1":420}},"dflt":"right","col":"#adb5bd","vis":[],"t":"F"},{"f":"lb","id":"ipt","k":"ip","bases":[[700,380,"middle",[0,-1]]],"o":["ipd"],"need":"ip","vis":[],"t":"F","x":700,"y":380,"anc":"middle"},{"f":"ar","id":"ih0","x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":742.34,"y0":369.2,"x1":736.74,"y1":341.76},"cw":{"x0":736.74,"y0":341.76,"x1":742.34,"y1":369.2}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"ih1","x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8,"o":["id"],"need":"i","sel":"ia","var":{"ccw":{"x0":736.74,"y0":498.24,"x1":742.34,"y1":470.8},"cw":{"x0":742.34,"y0":470.8,"x1":736.74,"y1":498.24}},"dflt":"ccw","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[776,480,"start",[1,1]]],"o":["id"],"need":"i","vis":[],"t":"F","x":776,"y":480,"anc":"start"},{"f":"lb","id":"nt","k":"n","bases":[[640,610,"end",[-1,1]]],"need":"n","vis":[],"t":"F","x":597.57,"y":652.43,"anc":"end"},{"f":"ar","id":"ea","x0":790,"y0":630,"x1":790,"y1":560,"w":3,"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[810,596,"start",[1,0]]],"need":"e","vis":[],"t":"F","x":810,"y":596,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s12co(d, p, L){ tbFig_Draw(d, p, L, U51S12K.co); }
function tbU51s12cm(d, p, L){ tbFig_Draw(d, p, L, U51S12K.cm); }
// ---- 51-13 文の正誤（磁界・電磁力・電磁誘導） の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s13.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S13K = {
  pa: {"vars":[],"items":[{"f":"ln","id":"w1","pts":[[360,160],[360,680]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"w2","pts":[[680,160],[680,440]],"w":6,"vis":[],"t":"F"},{"f":"ln","id":"w2b","pts":[[680,500],[680,680]],"w":6,"vis":[],"t":"F"},{"f":"ar","id":"ia1","x0":334,"y0":280,"x1":334,"y1":180,"need":"i1","sel":"ia1","var":{"up":{"x0":334,"y0":310,"x1":334,"y1":210},"down":{"x0":334,"y0":210,"x1":334,"y1":310}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i1t","k":"i1","bases":[[352,230,"start",[1,0]],[316,230,"end",[-1,0]],[334,150,"middle",[0,-1]]],"vbases":{"up":[[352,230,"start",[1,0]],[316,230,"end",[-1,0]],[334,150,"middle",[0,-1]]],"down":[[352,330,"start",[1,0]],[316,330,"end",[-1,0]],[334,410,"middle",[0,1]]]},"need":"i1","sel":"ia1","var":{"up":{"x":372,"y":230,"anc":"start"},"down":{"x":372,"y":330,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":352,"y":230,"anc":"start"},{"f":"ar","id":"ia2","x0":706,"y0":280,"x1":706,"y1":180,"need":"i2","sel":"ia2","var":{"up":{"x0":706,"y0":310,"x1":706,"y1":210},"down":{"x0":706,"y0":210,"x1":706,"y1":310}},"dflt":"up","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"i2t","k":"i2","bases":[[724,230,"start",[1,0]],[688,230,"end",[-1,0]],[706,150,"middle",[0,-1]]],"vbases":{"up":[[724,230,"start",[1,0]],[688,230,"end",[-1,0]],[706,150,"middle",[0,-1]]],"down":[[724,330,"start",[1,0]],[688,330,"end",[-1,0]],[706,410,"middle",[0,1]]]},"need":"i2","sel":"ia2","var":{"up":{"x":724,"y":230,"anc":"start"},"down":{"x":724,"y":330,"anc":"start"}},"dflt":"up","vis":[],"t":"F","x":724,"y":230,"anc":"start"},{"f":"c","id":"h2c","cx":680,"cy":470,"r":24,"fill":"w","o":["h2d"],"vis":[],"t":"F","sel":["h2a"],"var":{"front":{"sign":"•"},"back":{"sign":"×"},"":{}},"dflt":""},{"f":"lb","id":"h2t","k":"h2","bases":[[716,510,"start",[1,1]]],"o":["h2d"],"need":"h2","vis":[],"t":"F","x":716,"y":510,"anc":"start"},{"f":"ar","id":"f1a","x0":374,"y0":470,"x1":484,"y1":470,"need":"f1","sel":"f1a","var":{"in":{"x0":374,"y0":470,"x1":484,"y1":470},"out":{"x0":346,"y0":470,"x1":236,"y1":470}},"dflt":"in","gr":"f1d","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[429,440,"middle",[0,-1]],[429,500,"middle",[0,1]],[500,470,"start",[1,0]]],"vbases":{"in":[[429,440,"middle",[0,-1]],[429,500,"middle",[0,1]],[500,470,"start",[1,0]]],"out":[[291,440,"middle",[0,-1]],[291,500,"middle",[0,1]],[220,470,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":429,"y":440,"anc":"middle"},"out":{"x":291,"y":440,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":429,"y":440,"anc":"middle"},{"f":"ar","id":"f2a","x0":632,"y0":470,"x1":522,"y1":470,"need":"f2","sel":"f2a","var":{"in":{"x0":632,"y0":470,"x1":522,"y1":470},"out":{"x0":728,"y0":470,"x1":838,"y1":470}},"dflt":"in","gr":"f2d","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[577,440,"middle",[0,-1]],[577,500,"middle",[0,1]],[506,470,"end",[-1,0]]],"vbases":{"in":[[577,440,"middle",[0,-1]],[577,500,"middle",[0,1]],[506,470,"end",[-1,0]]],"out":[[783,440,"middle",[0,-1]],[783,500,"middle",[0,1]],[854,470,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":577,"y":434,"anc":"middle"},"out":{"x":783,"y":434,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":577,"y":440,"anc":"middle"},{"f":"ln","id":"re1","pts":[[360,692],[360,754]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,692],[680,754]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":360,"y0":740,"x1":680,"y1":740,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[520,780,"middle",[0,1]],[520,700,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":520,"y":780,"anc":"middle"},{"f":"ln","id":"le1","pts":[[696,160],[894,160]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ln","id":"le2","pts":[[696,680],[894,680]],"w":2,"need":"l","vis":[],"t":"F"},{"f":"ar","id":"ld","x0":880,"y0":160,"x1":880,"y1":680,"two":1,"w":2,"need":"l","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[896,420,"start",[1,0]],[864,420,"end",[-1,0]]],"need":"l","vis":[],"t":"F","x":896,"y":420,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s13pa(d, p, L){ tbFig_Draw(d, p, L, U51S13K.pa); }
// ---- 51-14 文の正誤（磁気回路・インダクタンス） の図（※ textbook/gen/make_section.py が textbook/gen/data/u51_s14.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U51S14K = {
  co: {"vars":[],"items":[{"f":"ln","id":"core","pts":[[300,220],[760,220],[760,620],[300,620]],"w":76,"close":1,"col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"cw0","pts":[[256,342],[344,318]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw1","pts":[[256,372],[344,348]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw2","pts":[[256,402],[344,378]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw3","pts":[[256,432],[344,408]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw4","pts":[[256,462],[344,438]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw5","pts":[[256,492],[344,468]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"ln","id":"cw6","pts":[[256,522],[344,498]],"w":3,"vis":[],"t":"F","sel":"nt","var":{"":{}}},{"f":"lb","id":"nt","k":"n","bases":[[242,400,"end",[-1,0]]],"need":"n","vis":[],"t":"F","x":242,"y":400,"anc":"end"},{"f":"ln","id":"ld0","pts":[[256,522],[100,522]],"w":3,"vis":[],"t":"F"},{"f":"ln","id":"ld1","pts":[[256,328],[100,328]],"w":3,"vis":[],"t":"F"},{"f":"ar","id":"ia","x0":110,"y0":328,"x1":200,"y1":328,"w":4,"need":"i","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"it","k":"i","bases":[[155,296,"middle",[0,-1]]],"need":"i","vis":[],"t":"F","x":155,"y":296,"anc":"middle"},{"f":"ln","id":"phl","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":3,"close":1,"need":"phi","vis":[],"t":"F"},{"f":"ar","id":"phh0","x0":512,"y0":220,"x1":548,"y1":220,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":512,"y0":220,"x1":548,"y1":220},"ccw":{"x0":548,"y0":220,"x1":512,"y1":220}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh1","x0":760,"y0":402,"x1":760,"y1":438,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":760,"y0":402,"x1":760,"y1":438},"ccw":{"x0":760,"y0":438,"x1":760,"y1":402}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh2","x0":548,"y0":620,"x1":512,"y1":620,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":548,"y0":620,"x1":512,"y1":620},"ccw":{"x0":512,"y0":620,"x1":548,"y1":620}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"ar","id":"phh3","x0":300,"y0":438,"x1":300,"y1":402,"o":["phid"],"need":"phi","sel":"phia","var":{"cw":{"x0":300,"y0":438,"x1":300,"y1":402},"ccw":{"x0":300,"y0":402,"x1":300,"y1":438}},"dflt":"cw","col":"#495057","vis":[],"t":"F"},{"f":"lb","id":"phit","k":"phi","bases":[[610,148,"middle",[0,-1]]],"need":"phi","vis":[],"t":"F","x":610,"y":148,"anc":"middle"},{"f":"ln","id":"ll","pts":[[300,220],[760,220],[760,620],[300,620]],"dash":1,"w":7,"close":1,"o":["ld"],"need":"l","col":"#e67700","vis":[],"t":"F"},{"f":"lb","id":"lt","k":"l","bases":[[818,500,"start",[1,0]]],"need":"l","vis":[],"t":"F","x":818,"y":500,"anc":"start"},{"f":"ln","id":"sq","pts":[[404,186],[456,186],[470,254],[418,254]],"w":3,"fill":"area","close":1,"o":["sd"],"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[430,148,"middle",[0,-1]],[370,152,"end",[-1,-1]]],"o":["sd"],"need":"s","vis":[],"t":"F","x":430,"y":148,"anc":"middle"},{"f":"lb","id":"mut","k":"mu","bases":[[530,692,"middle",[0,1]]],"need":"mu","vis":[],"t":"F","x":530,"y":692,"anc":"middle"},{"f":"lb","id":"rmt","k":"rm","bases":[[530,420,"middle",[0,-1]],[530,748,"middle",[0,1]]],"need":"rm","vis":[],"t":"F","x":530,"y":420,"anc":"middle"},{"f":"ln","id":"cn1_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_1","pts":[[256,372],[344,352]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_2","pts":[[256,414],[344,394]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_3","pts":[[256,456],[344,436]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_4","pts":[[256,498],[344,478]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn1_5","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"1":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_0","pts":[[256,330],[344,310]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_1","pts":[[256,349.09],[344,329.09]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_2","pts":[[256,368.18],[344,348.18]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_3","pts":[[256,387.27],[344,367.27]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_4","pts":[[256,406.36],[344,386.36]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_5","pts":[[256,425.45],[344,405.45]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_6","pts":[[256,444.55],[344,424.55]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_7","pts":[[256,463.64],[344,443.64]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_8","pts":[[256,482.73],[344,462.73]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_9","pts":[[256,501.82],[344,481.82]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_10","pts":[[256,520.91],[344,500.91]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn2_11","pts":[[256,540],[344,520]],"w":3,"sel":"nt","var":{"2":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_0","pts":[[256,330],[344,310]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_1","pts":[[256,339.13],[344,319.13]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_2","pts":[[256,348.26],[344,328.26]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_3","pts":[[256,357.39],[344,337.39]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_4","pts":[[256,366.52],[344,346.52]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_5","pts":[[256,375.65],[344,355.65]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_6","pts":[[256,384.78],[344,364.78]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_7","pts":[[256,393.91],[344,373.91]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_8","pts":[[256,403.04],[344,383.04]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_9","pts":[[256,412.17],[344,392.17]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_10","pts":[[256,421.3],[344,401.3]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_11","pts":[[256,430.43],[344,410.43]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_12","pts":[[256,439.57],[344,419.57]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_13","pts":[[256,448.7],[344,428.7]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_14","pts":[[256,457.83],[344,437.83]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_15","pts":[[256,466.96],[344,446.96]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_16","pts":[[256,476.09],[344,456.09]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_17","pts":[[256,485.22],[344,465.22]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_18","pts":[[256,494.35],[344,474.35]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_19","pts":[[256,503.48],[344,483.48]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_20","pts":[[256,512.61],[344,492.61]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_21","pts":[[256,521.74],[344,501.74]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_22","pts":[[256,530.87],[344,510.87]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"cn4_23","pts":[[256,540],[344,520]],"w":2,"sel":"nt","var":{"4":{}},"vis":[],"t":"F"},{"f":"ln","id":"ee1","pts":[[100,328],[56,328]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ln","id":"ee2","pts":[[100,522],[56,522]],"w":2,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"ea","x0":70,"y0":516,"x1":70,"y1":334,"w":3,"o":["ed"],"need":"e","sel":"ea","var":{"oppose":{"x0":70,"y0":516,"x1":70,"y1":334},"along":{"x0":70,"y0":334,"x1":70,"y1":516}},"dflt":"oppose","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[52,425,"end",[-1,0]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":52,"y":425,"anc":"end"},{"f":"lb","id":"indt","k":"ind","bases":[[550,390,"middle",[0,-1]]],"need":"ind","vis":[],"t":"F","x":550,"y":390,"anc":"middle"},{"f":"lb","id":"wt","k":"w","bases":[[550,460,"middle",[0,1]]],"need":"w","vis":[],"t":"F","x":550,"y":460,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU51s14co(d, p, L){ tbFig_Draw(d, p, L, U51S14K.co); }
var KINDS = {u51s1wm: tbU51s1wm, u51s1wn: tbU51s1wn, u51s1wl: tbU51s1wl, u51s2pe: tbU51s2pe, u51s2pb: tbU51s2pb, u51s2pa: tbU51s2pa, u51s3sc: tbU51s3sc, u51s4pa: tbU51s4pa, u51s5xs: tbU51s5xs, u51s5xz: tbU51s5xz, u51s6tr: tbU51s6tr, u51s7g1: tbU51s7g1, u51s7g2: tbU51s7g2, u51s8cm: tbU51s8cm, u51s9co: tbU51s9co, u51s10tc: tbU51s10tc, u51s11rl: tbU51s11rl, u51s12co: tbU51s12co, u51s12cm: tbU51s12cm, u51s13pa: tbU51s13pa, u51s14co: tbU51s14co};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 51-1 の図は電流が流れないので載せない,
  // 51-2 の図は電流が流れないので載せない,
  // 51-3 の図は電流が流れないので載せない,
  // 51-4 の図は電流が流れないので載せない,
  // 51-5 の図は電流が流れないので載せない,
  // 51-6 の図は電流が流れないので載せない,
  // 51-7 の図は電流が流れないので載せない,
  // 51-8 の図は電流が流れないので載せない,
  // 51-9 の図は電流が流れないので載せない,
  // 51-10 の図は電流が流れないので載せない,
  // 51-11 の図は電流が流れないので載せない,
  // 51-12 の図は電流が流れないので載せない,
  // 51-13 の図は電流が流れないので載せない,
  // 51-14 の図は電流が流れないので載せない
};

// 51-1 2本の導体の磁界を足す・引く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s1_par(a, b){ return a * b / (a + b); }
function tbU51s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s1_Qadd(r){
  var gcd = tbU51s1_gcd, ratio = tbU51s1_ratio, par = tbU51s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var IB = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var a10 = pick(r, [1,2,5,10]);
    var h = pick(r, [1,2]);
    var a = (a10 / 10);
    var dd = (4 * a10 / 10);
    var HA = (IA * 5 / a10);
    var HB = (IB * 5 / (3 * a10));
    var ta = (h == 1 ? '上向き' : '下向き');
    var tb = (h == 1 ? '下向き' : '上向き');
    var ua = (h == 1 ? 'up' : 'down');
    var ub = (h == 1 ? 'down' : 'up');
    if (!(Math.abs(HA * 10 - Math.round(HA * 10)) < 1e-9 && Math.abs(HB * 10 - Math.round(HB * 10)) < 1e-9 && Math.abs(HA + HB * 10 - Math.round(HA + HB * 10)) < 1e-9 && Math.abs(abs(HA - HB) * 10 - Math.round(abs(HA - HB) * 10)) < 1e-9 && Math.abs(IB * 5 / a10 * 10 - Math.round(IB * 5 / a10 * 10)) < 1e-9 && HA != HB)) continue;
    var ok = (HA + HB);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s1_three4(ok, [{x: (HA), why: "A がつくる磁界で止めた（B の磁界を足していない）", w: 0, cut: 1}, {x: (HB), why: "B がつくる磁界だけを出した（A の磁界を足していない）", w: 1, cut: 1}, {x: (abs(HA - HB)), why: "2つの磁界を逆向きと読んで引いた（右ねじで向きを決める）", w: 2, cut: 0}, {x: (HA + IB * 5 / a10), why: "B までの距離に P–A の距離を使った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + "\\dfrac{" + fmt(c.v) + "}{\\pi}\\,\\mathrm{A/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s1add", text: "図のように、平行な導体 A と B が $" + fmt(dd) + "\\,\\mathrm{m}$ 離れています。A には" + String(ta) + "に $" + fmt(IA) + "\\,\\mathrm{A}$、B には" + String(tb) + "に $" + fmt(IB) + "\\,\\mathrm{A}$ の電流が流れています。A と B の間の点 P は、A から $" + fmt(a) + "\\,\\mathrm{m}$ です。P の磁界の強さは何 A/m ですか。", fig: {kind: "u51s1wm", L: tbU51s1_fig({"wa":"A","wb":"B","p":"P"}, [["ia", fmt(IA) + " A"], ["iaa", String(ua)], ["ib", fmt(IB) + " A"], ["iba", String(ub)], ["dpa", fmt(a) + " m"], ["dab", fmt(dd) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H_A = \\dfrac{" + fmt(IA) + "}{2 \\pi \\times " + fmt(a) + "} = " + "\\dfrac{" + fmt(HA) + "}{\\pi}\\,\\mathrm{A/m}" + "$、$H_B = \\dfrac{" + fmt(IB) + "}{2 \\pi \\times " + fmt(3 * a) + "} = " + "\\dfrac{" + fmt(HB) + "}{\\pi}\\,\\mathrm{A/m}" + "$", "電流が逆向きなので、間の点では右ねじで同じ向き　足して $H = " + "\\dfrac{" + fmt(ok) + "}{\\pi}\\,\\mathrm{A/m}" + "$"], chk: {form: "u51s1add", p: {IA: IA, IB: IB, a10: a10, h: h}}};
  }
  throw new Error("u51s1add：条件に合う数字が見つからない");
}
function tbU51s1_Qsub(r){
  var gcd = tbU51s1_gcd, ratio = tbU51s1_ratio, par = tbU51s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var IB = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var a10 = pick(r, [1,2,5,10]);
    var h = pick(r, [1,2]);
    var a = (a10 / 10);
    var dd = (3 * a10 / 10);
    var HA = (IA * 5 / a10);
    var HB = (IB * 5 / (2 * a10));
    var ta = (h == 1 ? '上向き' : '下向き');
    var ua = (h == 1 ? 'up' : 'down');
    if (!(Math.abs(HA * 10 - Math.round(HA * 10)) < 1e-9 && Math.abs(HB * 10 - Math.round(HB * 10)) < 1e-9 && Math.abs(HA + HB * 10 - Math.round(HA + HB * 10)) < 1e-9 && Math.abs(abs(HA - HB) * 10 - Math.round(abs(HA - HB) * 10)) < 1e-9 && Math.abs(IB * 5 / a10 * 10 - Math.round(IB * 5 / a10 * 10)) < 1e-9 && HA != HB)) continue;
    var ok = (abs(HA - HB));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s1_three4(ok, [{x: (HA + HB), why: "2つの磁界を同じ向きと読んで足した（右ねじで向きを決める）", w: 0, cut: 0}, {x: (HA), why: "A がつくる磁界で止めた（B の磁界を引いていない）", w: 1, cut: 1}, {x: (HB), why: "B がつくる磁界だけを出した（A の磁界と合わせていない）", w: 2, cut: 1}, {x: (abs(HA - IB * 5 / a10)), why: "B までの距離に P–A の距離を使った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + "\\dfrac{" + fmt(c.v) + "}{\\pi}\\,\\mathrm{A/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s1sub", text: "図のように、平行な導体 A と B が $" + fmt(dd) + "\\,\\mathrm{m}$ 離れています。A にも B にも" + String(ta) + "に、A には $" + fmt(IA) + "\\,\\mathrm{A}$、B には $" + fmt(IB) + "\\,\\mathrm{A}$ の電流が流れています。A と B の間の点 P は、A から $" + fmt(a) + "\\,\\mathrm{m}$ です。P の磁界の強さは何 A/m ですか。", fig: {kind: "u51s1wn", L: tbU51s1_fig({"wa":"A","wb":"B","p":"P"}, [["ia", fmt(IA) + " A"], ["iaa", String(ua)], ["ib", fmt(IB) + " A"], ["iba", String(ua)], ["dpa", fmt(a) + " m"], ["dab", fmt(dd) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H_A = " + "\\dfrac{" + fmt(HA) + "}{\\pi}\\,\\mathrm{A/m}" + "$、$H_B = \\dfrac{" + fmt(IB) + "}{2 \\pi \\times " + fmt(2 * a) + "} = " + "\\dfrac{" + fmt(HB) + "}{\\pi}\\,\\mathrm{A/m}" + "$", "電流が同じ向きなので、間の点では右ねじで逆向き　引いて $H = " + "\\dfrac{" + fmt(ok) + "}{\\pi}\\,\\mathrm{A/m}" + "$"], chk: {form: "u51s1sub", p: {IA: IA, IB: IB, a10: a10, h: h}}};
  }
  throw new Error("u51s1sub：条件に合う数字が見つからない");
}
function tbU51s1_Qout(r){
  var gcd = tbU51s1_gcd, ratio = tbU51s1_ratio, par = tbU51s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var IB = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var am = pick(r, [10,20,50,100]);
    var h = pick(r, [1,2]);
    var HA = (IA * 500 / am);
    var HB = (IB * 250 / am);
    var tb = (h == 1 ? '下向き' : '上向き');
    var ub = (h == 1 ? 'down' : 'up');
    var HH = (h == 1 ? abs(HA - HB) : HA + HB);
    var HW = (h == 1 ? HA + HB : abs(HA - HB));
    var hw = (h == 1 ? '同じ向きと読んで足した' : '逆向きと読んで引いた');
    var ox = (h == 1 ? '逆向きなので磁界も逆向き　引いて' : '同じ向きなので磁界も同じ向き　足して');
    if (!(Math.abs(HA * 10 - Math.round(HA * 10)) < 1e-9 && Math.abs(HB * 10 - Math.round(HB * 10)) < 1e-9 && Math.abs(HA + HB * 10 - Math.round(HA + HB * 10)) < 1e-9 && Math.abs(abs(HA - HB) * 10 - Math.round(abs(HA - HB) * 10)) < 1e-9 && HA != HB)) continue;
    var ok = (HH);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s1_three4(ok, [{x: (HW), why: "2つの磁界を" + String(hw) + "（右ねじで向きを決める）", w: 0, cut: 0}, {x: (HA), why: "A がつくる磁界で止めた（B の磁界と合わせていない）", w: 1, cut: 1}, {x: (HB), why: "B がつくる磁界だけを出した（A の磁界と合わせていない）", w: 2, cut: 1}, {x: (HH * 1000), why: "mm を m に直していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + "\\dfrac{" + fmt(c.v) + "}{\\pi}\\,\\mathrm{A/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s1out", text: "図のように、平行な導体 A と B が $" + fmt(am) + "\\,\\mathrm{mm}$ 離れています。A には上向きに $" + fmt(IA) + "\\,\\mathrm{A}$、B には" + String(tb) + "に $" + fmt(IB) + "\\,\\mathrm{A}$ の電流が流れています。点 P は A の左にあり、A から $" + fmt(am) + "\\,\\mathrm{mm}$ です。P の磁界の強さは何 A/m ですか。", fig: {kind: "u51s1wl", L: tbU51s1_fig({"wa":"A","wb":"B","p":"P"}, [["ia", fmt(IA) + " A"], ["iaa", "up"], ["ib", fmt(IB) + " A"], ["iba", String(ub)], ["dpa", fmt(am) + " mm"], ["dab", fmt(am) + " mm"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(am) + "\\,\\mathrm{mm} = " + fmt(am / 1000) + "\\,\\mathrm{m}$　P から B までは $" + fmt(am / 500) + "\\,\\mathrm{m}$　$H_A = " + "\\dfrac{" + fmt(HA) + "}{\\pi}\\,\\mathrm{A/m}" + "$、$H_B = " + "\\dfrac{" + fmt(HB) + "}{\\pi}\\,\\mathrm{A/m}" + "$", "外の点では、電流が" + String(ox) + " $H = " + "\\dfrac{" + fmt(ok) + "}{\\pi}\\,\\mathrm{A/m}" + "$"], chk: {form: "u51s1out", p: {IA: IA, IB: IB, am: am, h: h}}};
  }
  throw new Error("u51s1out：条件に合う数字が見つからない");
}
function tbU51s1_Qinv(r){
  var gcd = tbU51s1_gcd, ratio = tbU51s1_ratio, par = tbU51s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var IB = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var a10 = pick(r, [1,2,5,10]);
    var a = (a10 / 10);
    var dd = (4 * a10 / 10);
    var HA = (IA * 5 / a10);
    var HT = (IA * 5 / a10 + IB * 5 / (3 * a10));
    if (!(Math.abs(HA * 10 - Math.round(HA * 10)) < 1e-9 && Math.abs(HT * 10 - Math.round(HT * 10)) < 1e-9 && Math.abs(HT * 6 * a10 / 10 * 10 - Math.round(HT * 6 * a10 / 10 * 10)) < 1e-9 && Math.abs((HT - HA) * 2 * a10 / 10 * 10 - Math.round((HT - HA) * 2 * a10 / 10 * 10)) < 1e-9 && Math.abs((HT + HA) * 6 * a10 / 10 * 10 - Math.round((HT + HA) * 6 * a10 / 10 * 10)) < 1e-9 && IB != IA)) continue;
    var ok = (IB);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s1_three4(ok, [{x: (HT * 6 * a10 / 10), why: "A がつくる磁界を引かずに、合計の磁界から出した", w: 0, cut: 1}, {x: ((HT - HA) * 2 * a10 / 10), why: "B の磁界から電流を出す時、B までの距離でなく P–A の距離を使った", w: 1, cut: 1}, {x: ((HT + HA) * 6 * a10 / 10), why: "A の磁界を引くところを足した", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s1inv", text: "図のように、平行な導体 A と B が $" + fmt(dd) + "\\,\\mathrm{m}$ 離れています。A には上向きに $" + fmt(IA) + "\\,\\mathrm{A}$、B には下向きの電流が流れています。A と B の間の点 P は A から $" + fmt(a) + "\\,\\mathrm{m}$ で、P の磁界の強さは $" + "\\dfrac{" + fmt(HT) + "}{\\pi}\\,\\mathrm{A/m}" + "$ でした。B の電流は何 A ですか。", fig: {kind: "u51s1wm", L: tbU51s1_fig({"wa":"A","wb":"B","p":"P"}, [["ia", fmt(IA) + " A"], ["iaa", "up"], ["ib", "{I}_B"], ["iba", "down"], ["dpa", fmt(a) + " m"], ["dab", fmt(dd) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["逆向きの電流なので、間の点では2つの磁界は同じ向き（足してある）　$H_B = " + "\\dfrac{" + fmt(HT) + "}{\\pi}\\,\\mathrm{A/m}" + " - " + "\\dfrac{" + fmt(HA) + "}{\\pi}\\,\\mathrm{A/m}" + " = " + "\\dfrac{" + fmt(HT - HA) + "}{\\pi}\\,\\mathrm{A/m}" + "$", "P から B までは $" + fmt(3 * a) + "\\,\\mathrm{m}$　$I_B = 2 \\pi \\times " + fmt(3 * a) + " \\times " + "\\dfrac{" + fmt(HT - HA) + "}{\\pi}\\,\\mathrm{A/m}" + " = " + qv(ok, "A") + "$"], chk: {form: "u51s1inv", p: {IA: IA, IB: IB, a10: a10}}};
  }
  throw new Error("u51s1inv：条件に合う数字が見つからない");
}
function tbU51s1_Qdir(r){
  var gcd = tbU51s1_gcd, ratio = tbU51s1_ratio, par = tbU51s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var IA = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var IB = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var a10 = pick(r, [1,2,5,10]);
    var h = pick(r, [1,2]);
    var a = (a10 / 10);
    var dd = (4 * a10 / 10);
    var HA = (IA * 5 / a10);
    var HB = (IB * 5 / (3 * a10));
    var ta = (h == 1 ? '上向き' : '下向き');
    var ua = (h == 1 ? 'up' : 'down');
    var ga = (h == 1 ? '奥向き' : '手前向き');
    var gb = (h == 1 ? '手前向き' : '奥向き');
    var GO = (HA > HB ? ga : gb);
    var GW = (HA > HB ? gb : ga);
    var gov = (GO == '奥向き' ? 'back' : 'front');
    var gwv = (GO == '奥向き' ? 'front' : 'back');
    var wa = (HA > HB ? 'B' : 'A');
    var sa = (HA > HB ? 'A' : 'B');
    if (!(Math.abs(HA * 10 - Math.round(HA * 10)) < 1e-9 && Math.abs(HB * 10 - Math.round(HB * 10)) < 1e-9 && HA != HB)) continue;
    var _c = choices(r, [{t: String(GO), v: String(gov)}, {t: String(GW), v: String(gwv), why: String(wa) + " がつくる磁界の向きで決めた（大きさを比べると " + String(sa) + " の方が強い）"}, {t: "磁界は 0", v: "zero", why: "同じ向きの電流でも、距離が違うので2つの磁界の大きさは違う"}, {t: String(ta), v: "cur", why: "電流の向きを磁界の向きとした（右ねじで手前・奥を決める）"}]);
    return {form: "u51s1dir", text: "図のように、平行な導体 A と B が $" + fmt(dd) + "\\,\\mathrm{m}$ 離れています。A にも B にも" + String(ta) + "に、A には $" + fmt(IA) + "\\,\\mathrm{A}$、B には $" + fmt(IB) + "\\,\\mathrm{A}$ の電流が流れています。A と B の間の点 P は、A から $" + fmt(a) + "\\,\\mathrm{m}$ です。P の磁界の向きはどれですか。", fig: {kind: "u51s1wm", L: tbU51s1_fig({"wa":"A","wb":"B","p":"P"}, [["ia", fmt(IA) + " A"], ["iaa", String(ua)], ["ib", fmt(IB) + " A"], ["iba", String(ua)], ["dpa", fmt(a) + " m"], ["dab", fmt(dd) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H_A = " + "\\dfrac{" + fmt(HA) + "}{\\pi}\\,\\mathrm{A/m}" + "$（右ねじで" + String(ga) + "）、$H_B = " + "\\dfrac{" + fmt(HB) + "}{\\pi}\\,\\mathrm{A/m}" + "$（右ねじで" + String(gb) + "）", "逆向きなので引き、強い " + String(sa) + " の向きが残る　" + String(GO)], chk: {form: "u51s1dir", p: {IA: IA, IB: IB, a10: a10, h: h}}};
  }
  throw new Error("u51s1dir：条件に合う数字が見つからない");
}
// 51-2 2つの磁極の磁界を足す・引く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s2_par(a, b){ return a * b / (a + b); }
function tbU51s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s2_Qboth(r){
  var gcd = tbU51s2_gcd, ratio = tbU51s2_ratio, par = tbU51s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var K = pick(r, [2,4,6,8,9,10,12,16,18,20,24,27,32,36,40,45,48]);
    var u10 = pick(r, [5,10,20,30]);
    var h = pick(r, [1,2]);
    var ua = (u10 / 10);
    var ub = (2 * u10 / 10);
    var HL = (K * 100 / (u10 * u10));
    var HR = (K * 25 / (u10 * u10));
    var pl = (h == 1 ? 'N 極' : 'S 極');
    var pr = (h == 1 ? 'S 極' : 'N 極');
    var nl = (h == 1 ? 'N' : 'S');
    var nr = (h == 1 ? 'S' : 'N');
    if (!(Math.abs(HL * 10 - Math.round(HL * 10)) < 1e-9 && Math.abs(HR * 10 - Math.round(HR * 10)) < 1e-9 && Math.abs(HL + HR * 10 - Math.round(HL + HR * 10)) < 1e-9 && Math.abs(abs(HL - HR) * 10 - Math.round(abs(HL - HR) * 10)) < 1e-9 && Math.abs(K * 10 / u10 + K * 5 / u10 * 10 - Math.round(K * 10 / u10 + K * 5 / u10 * 10)) < 1e-9 && HL + HR <= 1000)) continue;
    var ok = (HL + HR);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s2_three4(ok, [{x: (HL), why: "左の磁極の磁界で止めた（右の磁極の磁界を足していない）", w: 0, cut: 1}, {x: (HR), why: "右の磁極の磁界だけを出した（左の磁極の磁界を足していない）", w: 1, cut: 1}, {x: (abs(HL - HR)), why: "S 極の磁界の向きを逆に取って引いた（N から出て S へ入る）", w: 2, cut: 0}, {x: (K * 10 / u10 + K * 5 / u10), why: "磁界を距離に反比例とした（距離の2乗に反比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "Am", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s2both", text: "図のように、同じ直線の上で、点 A の左 $" + fmt(ua) + "\\,\\mathrm{m}$ に" + String(pl) + "、右 $" + fmt(ub) + "\\,\\mathrm{m}$ に同じ強さの" + String(pr) + "があります。この磁極が $1\\,\\mathrm{m}$ 離れた点につくる磁界の強さは $" + fmt(K) + "\\,\\mathrm{A/m}$ です。A の磁界の強さは何 A/m ですか。", fig: {kind: "u51s2pb", L: tbU51s2_fig({"na":"A"}, [["nb", String(nl)], ["nc", String(nr)], ["d1", fmt(ua) + " m"], ["d2", fmt(ub) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["左の磁極 $" + fmt(K) + " \\times \\dfrac{1}{" + fmt(ua) + "^2} = " + qv(HL, "Am") + "$、右の磁極 $" + fmt(K) + " \\times \\dfrac{1}{" + fmt(ub) + "^2} = " + qv(HR, "Am") + "$", "N から出て S へ入るので、A ではどちらも同じ向き　足して $H = " + qv(ok, "Am") + "$"], chk: {form: "u51s2both", p: {K: K, u10: u10, h: h}}};
  }
  throw new Error("u51s2both：条件に合う数字が見つからない");
}
function tbU51s2_Qsame(r){
  var gcd = tbU51s2_gcd, ratio = tbU51s2_ratio, par = tbU51s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var K = pick(r, [2,4,6,8,9,10,12,16,18,20,24,27,32,36,40,45,48]);
    var u10 = pick(r, [5,10,20,30]);
    var ua = (u10 / 10);
    var HN = (K * 100 / (u10 * u10));
    var HS = (K * 25 / (u10 * u10));
    if (!(Math.abs(HN * 10 - Math.round(HN * 10)) < 1e-9 && Math.abs(HS * 10 - Math.round(HS * 10)) < 1e-9 && Math.abs(HN + HS * 10 - Math.round(HN + HS * 10)) < 1e-9 && Math.abs(HN - HS * 10 - Math.round(HN - HS * 10)) < 1e-9 && Math.abs(K * 10 / u10 - K * 5 / u10 * 10 - Math.round(K * 10 / u10 - K * 5 / u10 * 10)) < 1e-9 && HN + HS <= 1000)) continue;
    var ok = (HN - HS);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s2_three4(ok, [{x: (HN + HS), why: "S 極の磁界も同じ向きと読んで足した（N から出て S へ入る）", w: 0, cut: 0}, {x: (HN), why: "N 極の磁界で止めた（S 極の磁界を引いていない）", w: 1, cut: 1}, {x: (HS), why: "S 極の磁界だけを出した（N 極の磁界と合わせていない）", w: 2, cut: 1}, {x: (K * 10 / u10 - K * 5 / u10), why: "磁界を距離に反比例とした（距離の2乗に反比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "Am", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s2same", text: "図のように、同じ直線の上で、点 A の右 $" + fmt(ua) + "\\,\\mathrm{m}$ に N 極、そのさらに右 $" + fmt(ua) + "\\,\\mathrm{m}$ に同じ強さの S 極があります。この磁極が $1\\,\\mathrm{m}$ 離れた点につくる磁界の強さは $" + fmt(K) + "\\,\\mathrm{A/m}$ です。A の磁界の強さは何 A/m ですか。", fig: {kind: "u51s2pa", L: tbU51s2_fig({"na":"A"}, [["nb", "N"], ["nc", "S"], ["d1", fmt(ua) + " m"], ["d2", fmt(ua) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["N 極 $" + fmt(K) + " \\times \\dfrac{1}{" + fmt(ua) + "^2} = " + qv(HN, "Am") + "$、S 極は $" + fmt(2 * ua) + "\\,\\mathrm{m}$ で $" + qv(HS, "Am") + "$", "N 極から出る磁界は左向き、S 極へ入る磁界は右向き　引いて $H = " + qv(ok, "Am") + "$"], chk: {form: "u51s2same", p: {K: K, u10: u10}}};
  }
  throw new Error("u51s2same：条件に合う数字が見つからない");
}
function tbU51s2_Qnn(r){
  var gcd = tbU51s2_gcd, ratio = tbU51s2_ratio, par = tbU51s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var K = pick(r, [2,4,6,8,9,10,12,16,18,20,24,27,32,36,40,45,48]);
    var u10 = pick(r, [5,10,20,30]);
    var ua = (u10 / 10);
    var ub = (2 * u10 / 10);
    var HL = (K * 100 / (u10 * u10));
    var HR = (K * 25 / (u10 * u10));
    if (!(Math.abs(HL * 10 - Math.round(HL * 10)) < 1e-9 && Math.abs(HR * 10 - Math.round(HR * 10)) < 1e-9 && Math.abs(HL + HR * 10 - Math.round(HL + HR * 10)) < 1e-9 && Math.abs(HL - HR * 10 - Math.round(HL - HR * 10)) < 1e-9 && Math.abs(K * 10 / u10 - K * 5 / u10 * 10 - Math.round(K * 10 / u10 - K * 5 / u10 * 10)) < 1e-9 && HL + HR <= 1000)) continue;
    var ok = (HL - HR);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s2_three4(ok, [{x: (HL + HR), why: "右の N 極の磁界も同じ向きと読んで足した（N 極から出る向き）", w: 0, cut: 0}, {x: (HL), why: "左の N 極の磁界で止めた（右の N 極の磁界を引いていない）", w: 1, cut: 1}, {x: (HR), why: "右の N 極の磁界だけを出した（左の N 極の磁界と合わせていない）", w: 2, cut: 1}, {x: (K * 10 / u10 - K * 5 / u10), why: "磁界を距離に反比例とした（距離の2乗に反比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "Am", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s2nn", text: "図のように、同じ直線の上で、点 A の左 $" + fmt(ua) + "\\,\\mathrm{m}$ と右 $" + fmt(ub) + "\\,\\mathrm{m}$ に、同じ強さの N 極があります。この磁極が $1\\,\\mathrm{m}$ 離れた点につくる磁界の強さは $" + fmt(K) + "\\,\\mathrm{A/m}$ です。A の磁界の強さは何 A/m ですか。", fig: {kind: "u51s2pb", L: tbU51s2_fig({"na":"A"}, [["nb", "N"], ["nc", "N"], ["d1", fmt(ua) + " m"], ["d2", fmt(ub) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["左の N 極 $" + qv(HL, "Am") + "$、右の N 極 $" + fmt(K) + " \\times \\dfrac{1}{" + fmt(ub) + "^2} = " + qv(HR, "Am") + "$", "どちらの N 極からも磁界は出るので、A では逆向き　引いて $H = " + qv(ok, "Am") + "$"], chk: {form: "u51s2nn", p: {K: K, u10: u10}}};
  }
  throw new Error("u51s2nn：条件に合う数字が見つからない");
}
function tbU51s2_Qinv(r){
  var gcd = tbU51s2_gcd, ratio = tbU51s2_ratio, par = tbU51s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var K = pick(r, [2,4,6,8,9,10,12,16,18,20,24,27,32,36,40,45,48]);
    var u10 = pick(r, [5,10,20,30]);
    var ua = (u10 / 10);
    var ub = (2 * u10 / 10);
    var HT = (K * 125 / (u10 * u10));
    if (!(Math.abs(HT * 10 - Math.round(HT * 10)) < 1e-9 && Math.abs(HT * u10 * u10 / 100 * 10 - Math.round(HT * u10 * u10 / 100 * 10)) < 1e-9 && Math.abs(HT * u10 * u10 / 75 * 10 - Math.round(HT * u10 * u10 / 75 * 10)) < 1e-9 && Math.abs(HT * u10 * u10 / 25 * 10 - Math.round(HT * u10 * u10 / 25 * 10)) < 1e-9 && Math.abs(HT * u10 / 15 * 10 - Math.round(HT * u10 / 15 * 10)) < 1e-9 && HT <= 1000)) continue;
    var ok = (K);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s2_three4(ok, [{x: (HT * u10 * u10 / 100), why: "A の磁界を全部 N 極の磁界とした（S 極の分を入れていない）", w: 0, cut: 1}, {x: (HT * u10 * u10 / 25), why: "A の磁界を全部 S 極の磁界とした（N 極の分を入れていない）", w: 1, cut: 1}, {x: (HT * u10 * u10 / 75), why: "2つの磁界を引いた形で解いた（どちらも同じ向き）", w: 2, cut: 0}, {x: (HT * u10 / 15), why: "磁界を距離に反比例として解いた（距離の2乗に反比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "Am", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s2inv", text: "図のように、同じ直線の上で、点 A の左 $" + fmt(ua) + "\\,\\mathrm{m}$ に N 極、右 $" + fmt(ub) + "\\,\\mathrm{m}$ に同じ強さの S 極があり、A の磁界の強さは $" + fmt(HT) + "\\,\\mathrm{A/m}$ でした。この磁極が $1\\,\\mathrm{m}$ 離れた点につくる磁界の強さは何 A/m ですか。", fig: {kind: "u51s2pb", L: tbU51s2_fig({"na":"A"}, [["nb", "N"], ["nc", "S"], ["d1", fmt(ua) + " m"], ["d2", fmt(ub) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["1 m の所の磁界を $H_0$ とすると、N 極は $\\dfrac{H_0}{" + fmt(ua) + "^2}$、S 極は $\\dfrac{H_0}{" + fmt(ub) + "^2}$　どちらも右向きなので足して $" + qv(HT, "Am") + "$", "$H_0 \\left( \\dfrac{1}{" + fmt(ua) + "^2} + \\dfrac{1}{" + fmt(ub) + "^2} \\right) = " + fmt(HT) + "$　$H_0 = " + qv(ok, "Am") + "$"], chk: {form: "u51s2inv", p: {K: K, u10: u10}}};
  }
  throw new Error("u51s2inv：条件に合う数字が見つからない");
}
// 51-3 2つの磁界の式を等しく置く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s3_par(a, b){ return a * b / (a + b); }
function tbU51s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s3_Qline(r){
  var gcd = tbU51s3_gcd, ratio = tbU51s3_ratio, par = tbU51s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [1,2,3,4,5,10]);
    var I2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var a10 = pick(r, [1,2,3,4,5,10,20,30]);
    var r10 = pick(r, [1,2,4,5,10,20]);
    var aa = (a10 / 10);
    var rr = (r10 / 10);
    var H = (N * I2 * 5 / r10);
    var nt = (N > 1 ? '2' : '');
    var nw = (N > 1 ? '巻数 ' + N + ' の' : '1回巻きの');
    if (!(Math.abs(H * 10 - Math.round(H * 10)) < 1e-9 && Math.abs(a10 * N * I2 / r10 * 10 - Math.round(a10 * N * I2 / r10 * 10)) < 1e-9 && Math.abs(N * I2 * 10 - Math.round(N * I2 * 10)) < 1e-9 && Math.abs(2 * a10 * N * I2 / r10 * 10 - Math.round(2 * a10 * N * I2 / r10 * 10)) < 1e-9 && Math.abs(a10 * I2 / r10 * 10 - Math.round(a10 * I2 / r10 * 10)) < 1e-9 && Math.abs(a10 * N * I2 / 5 * 10 - Math.round(a10 * N * I2 / 5 * 10)) < 1e-9 && a10 != r10 && a10 * N * I2 / r10 <= 400 && N * I2 <= 100)) continue;
    var ok = (a10 * N * I2 / r10);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s3_three4(ok, [{x: (N * I2), why: "直線の側の距離 $a$ に、円形コイルの半径 $r$ を使った（2つの図の長さを取り違えた）", w: 0, cut: 1}, {x: (a10 * N * I2 / 5), why: "円形コイルの中心の磁界を出す所を飛ばし、$NI_2$ をそのまま等しく置いた", w: 1, cut: 1}, {x: (2 * a10 * N * I2 / r10), why: "円形コイルの中心の磁界を $\\dfrac{NI}{r}$ とした（2 で割る）", w: 2, cut: 0}, {x: (a10 * I2 / r10), why: "円形コイルの巻数を掛けていない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + "" + (fmt(c.v) === "1" ? "" : fmt(c.v)) + "\\pi\\,\\mathrm{A}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s3line", text: "図1の直線の導体から $" + fmt(aa) + "\\,\\mathrm{m}$ 離れた点 P の磁界と、図2の半径 $" + fmt(rr) + "\\,\\mathrm{m}$・" + String(nw) + "円形コイルに $" + fmt(I2) + "\\,\\mathrm{A}$ を流した時の中心の磁界が等しくなりました。直線の導体の電流は何 A ですか。", fig: {kind: "u51s3sc", L: tbU51s3_fig({"p":"P","o":"O","i1a":"up","ia":"ccw"}, [["i1", "{I}_1"], ["a", fmt(aa) + " m"], ["i", fmt(I2) + " A"], ["r", fmt(rr) + " m"], ["nt", String(nt)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["中心の磁界 $H = \\dfrac{" + fmt(N) + " \\times " + fmt(I2) + "}{2 \\times " + fmt(rr) + "} = " + qv(H, "Am") + "$　これを P の磁界と等しく置く", "$\\dfrac{I_1}{2 \\pi \\times " + fmt(aa) + "} = " + fmt(H) + "$　$I_1 = " + "" + (fmt(ok) === "1" ? "" : fmt(ok)) + "\\pi\\,\\mathrm{A}" + "$"], chk: {form: "u51s3line", p: {N: N, I2: I2, a10: a10, r10: r10}}};
  }
  throw new Error("u51s3line：条件に合う数字が見つからない");
}
function tbU51s3_Qma(r){
  var gcd = tbU51s3_gcd, ratio = tbU51s3_ratio, par = tbU51s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [10,20,50,100,200,500]);
    var Im = pick(r, [10,20,50,100,200,500]);
    var a10 = pick(r, [1,2,3,4,5,10]);
    var r10 = pick(r, [1,2,4,5,10]);
    var aa = (a10 / 10);
    var rr = (r10 / 10);
    var H = (N * Im * 5 / (r10 * 1000));
    if (!(Math.abs(H * 10 - Math.round(H * 10)) < 1e-9 && Math.abs(a10 * N * Im / (r10 * 1000) * 10 - Math.round(a10 * N * Im / (r10 * 1000) * 10)) < 1e-9 && Math.abs(N * Im / 1000 * 10 - Math.round(N * Im / 1000 * 10)) < 1e-9 && Math.abs(a10 * N * Im / r10 * 10 - Math.round(a10 * N * Im / r10 * 10)) < 1e-9 && Math.abs(2 * a10 * N * Im / (r10 * 1000) * 10 - Math.round(2 * a10 * N * Im / (r10 * 1000) * 10)) < 1e-9 && Math.abs(a10 * N * Im / 5000 * 10 - Math.round(a10 * N * Im / 5000 * 10)) < 1e-9 && a10 != r10 && a10 * N * Im / (r10 * 1000) >= 1 && a10 * N * Im / (r10 * 1000) <= 400)) continue;
    var ok = (a10 * N * Im / (r10 * 1000));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s3_three4(ok, [{x: (N * Im / 1000), why: "直線の側の距離 $a$ に、円形コイルの半径 $r$ を使った（2つの図の長さを取り違えた）", w: 0, cut: 1}, {x: (a10 * N * Im / 5000), why: "円形コイルの中心の磁界を出す所を飛ばし、$NI_2$ をそのまま等しく置いた", w: 1, cut: 1}, {x: (a10 * N * Im / r10), why: "mA を A に直していない", w: 2, cut: 0}, {x: (2 * a10 * N * Im / (r10 * 1000)), why: "円形コイルの中心の磁界を $\\dfrac{NI}{r}$ とした（2 で割る）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + "" + (fmt(c.v) === "1" ? "" : fmt(c.v)) + "\\pi\\,\\mathrm{A}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s3ma", text: "図1の直線の導体から $" + fmt(aa) + "\\,\\mathrm{m}$ 離れた点 P の磁界と、図2の半径 $" + fmt(rr) + "\\,\\mathrm{m}$・巻数 " + fmt(N) + " の円形コイルに $" + qv(Im, "mA") + "$ を流した時の中心の磁界が等しくなりました。直線の導体の電流は何 A ですか。", fig: {kind: "u51s3sc", L: tbU51s3_fig({"p":"P","o":"O","i1a":"up","ia":"ccw"}, [["i1", "{I}_1"], ["a", fmt(aa) + " m"], ["i", qf(Im, "mA")], ["r", fmt(rr) + " m"], ["nt", "2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + qv(Im, "mA") + " = " + qv(Im / 1000, "A") + "$　中心の磁界 $H = \\dfrac{" + fmt(N) + " \\times " + fmt(Im / 1000) + "}{2 \\times " + fmt(rr) + "} = " + qv(H, "Am") + "$", "$\\dfrac{I_1}{2 \\pi \\times " + fmt(aa) + "} = " + fmt(H) + "$　$I_1 = " + "" + (fmt(ok) === "1" ? "" : fmt(ok)) + "\\pi\\,\\mathrm{A}" + "$"], chk: {form: "u51s3ma", p: {N: N, Im: Im, a10: a10, r10: r10}}};
  }
  throw new Error("u51s3ma：条件に合う数字が見つからない");
}
function tbU51s3_Qratio(r){
  var gcd = tbU51s3_gcd, ratio = tbU51s3_ratio, par = tbU51s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [1,2,3,4,5,10]);
    var a10 = pick(r, [1,2,3,4,5,10,20,30]);
    var r10 = pick(r, [1,2,4,5,10,20]);
    var aa = (a10 / 10);
    var rr = (r10 / 10);
    var nt = (N > 1 ? '2' : '');
    var nw = (N > 1 ? '巻数 ' + N + ' の' : '1回巻きの');
    if (!(Math.abs(a10 * N / r10 * 10 - Math.round(a10 * N / r10 * 10)) < 1e-9 && Math.abs(2 * a10 * N / r10 * 10 - Math.round(2 * a10 * N / r10 * 10)) < 1e-9 && Math.abs(a10 / r10 * 10 - Math.round(a10 / r10 * 10)) < 1e-9 && Math.abs(a10 * N / 5 * 10 - Math.round(a10 * N / 5 * 10)) < 1e-9 && Math.abs(N * 10 - Math.round(N * 10)) < 1e-9 && a10 != r10 && a10 * N / r10 <= 100)) continue;
    var ok = (a10 * N / r10);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s3_three4(ok, [{x: (N), why: "直線の側の距離 $a$ に、円形コイルの半径 $r$ を使った（2つの図の長さを取り違えた）", w: 0, cut: 1}, {x: (a10 * N / 5), why: "円形コイルの中心の磁界を出す所を飛ばし、$NI_2$ をそのまま等しく置いた", w: 1, cut: 1}, {x: (2 * a10 * N / r10), why: "円形コイルの中心の磁界を $\\dfrac{NI}{r}$ とした（2 で割る）", w: 2, cut: 0}, {x: (a10 / r10), why: "円形コイルの巻数を掛けていない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + "" + (fmt(c.v) === "1" ? "" : fmt(c.v)) + "\\pi" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s3ratio", text: "図1の直線の導体（電流 $I_1$）から $" + fmt(aa) + "\\,\\mathrm{m}$ 離れた点 P の磁界と、図2の半径 $" + fmt(rr) + "\\,\\mathrm{m}$・" + String(nw) + "円形コイル（電流 $I_2$）の中心の磁界が等しくなりました。$I_1$ は $I_2$ の何倍ですか。", fig: {kind: "u51s3sc", L: tbU51s3_fig({"p":"P","o":"O","i1a":"up","ia":"ccw"}, [["i1", "{I}_1"], ["a", fmt(aa) + " m"], ["i", "{I}_2"], ["r", fmt(rr) + " m"], ["nt", String(nt)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dfrac{I_1}{2 \\pi \\times " + fmt(aa) + "} = \\dfrac{" + fmt(N) + " I_2}{2 \\times " + fmt(rr) + "}$", "$I_1 = \\dfrac{2 \\pi \\times " + fmt(aa) + " \\times " + fmt(N) + "}{2 \\times " + fmt(rr) + "} I_2$　$" + "" + (fmt(ok) === "1" ? "" : fmt(ok)) + "\\pi" + "$ 倍"], chk: {form: "u51s3ratio", p: {N: N, a10: a10, r10: r10}}};
  }
  throw new Error("u51s3ratio：条件に合う数字が見つからない");
}
function tbU51s3_Qturns(r){
  var gcd = tbU51s3_gcd, ratio = tbU51s3_ratio, par = tbU51s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [2,3,4,5,6,8,10,12,15,20,25,50]);
    var I2 = pick(r, [1,2,4,5,10]);
    var a10 = pick(r, [1,2,5,10,20]);
    var r10 = pick(r, [1,2,4,5,10]);
    var aa = (a10 / 10);
    var rr = (r10 / 10);
    var K = (a10 * N * I2 / r10);
    if (!(Math.abs(K * 10 - Math.round(K * 10)) < 1e-9 && Math.abs(K / I2 * 10 - Math.round(K / I2 * 10)) < 1e-9 && Math.abs(K * r10 / (5 * I2) * 10 - Math.round(K * r10 / (5 * I2) * 10)) < 1e-9 && a10 != r10 && K >= 1 && K <= 400 && N % 2 == 0)) continue;
    var ok = (N);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s3_three4(ok, [{x: (K / I2), why: "直線の側の距離 $a$ と円形コイルの半径 $r$ を同じとして解いた（2つの図の長さを取り違えた）", w: 0, cut: 1}, {x: (K * r10 / (5 * I2)), why: "P の磁界を出す所を飛ばし、直線の電流の係数 $" + fmt(K) + "$ をそのまま中心の磁界と等しく置いた", w: 1, cut: 1}, {x: (N / 2), why: "円形コイルの中心の磁界を $\\dfrac{NI}{r}$ とした（2 で割る）", w: 2, cut: 0}, {x: (N * 2), why: "P の磁界を出す時、$2 \\pi a$ でなく $\\pi a$ で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s3turns", text: "図1の直線の導体に $" + fmt(K) + "\\pi\\,\\mathrm{A}$ を流した時、導体から $" + fmt(aa) + "\\,\\mathrm{m}$ 離れた点 P の磁界と、図2の半径 $" + fmt(rr) + "\\,\\mathrm{m}$ の円形コイルに $" + fmt(I2) + "\\,\\mathrm{A}$ を流した時の中心の磁界が等しくなりました。円形コイルの巻数はいくつですか。", fig: {kind: "u51s3sc", L: tbU51s3_fig({"p":"P","o":"O","i1a":"up","ia":"ccw"}, [["i1", fmt(K) + "π A"], ["a", fmt(aa) + " m"], ["i", fmt(I2) + " A"], ["r", fmt(rr) + " m"], ["nt", "2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["P の磁界 $\\dfrac{" + fmt(K) + "\\pi}{2 \\pi \\times " + fmt(aa) + "} = " + qv(K * 5 / a10, "Am") + "$　これが中心の磁界 $\\dfrac{N \\times " + fmt(I2) + "}{2 \\times " + fmt(rr) + "}$ と等しい", "$N = \\dfrac{" + fmt(K * 5 / a10) + " \\times 2 \\times " + fmt(rr) + "}{" + fmt(I2) + "} = " + fmt(ok) + "$"], chk: {form: "u51s3turns", p: {N: N, I2: I2, a10: a10, r10: r10}}};
  }
  throw new Error("u51s3turns：条件に合う数字が見つからない");
}
// 51-4 平行な2本の力から逆に解く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s4_par(a, b){ return a * b / (a + b); }
function tbU51s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s4_Qi2(r){
  var gcd = tbU51s4_gcd, ratio = tbU51s4_ratio, par = tbU51s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I1 = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var I2 = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var r10 = pick(r, [1,2,4,5,20]);
    var rr = (r10 / 10);
    var F7 = (20 * I1 * I2 / r10);
    var e = (F7 % 10000 == 0 ? 3 : F7 % 1000 == 0 ? 4 : F7 % 100 == 0 ? 5 : F7 % 10 == 0 ? 6 : 7);
    var Fa = (F7 / Math.pow(10, 7 - e));
    if (!((20 * I1 * I2) % r10 == 0 && I1 != 1 && I1 != I2)) continue;
    var ok = (I2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s4_three4(ok, [{x: (I2 * 10 / r10), why: "距離 $r$ を掛けていない", w: 0, cut: 1}, {x: (I1 * I2), why: "もう一方の電流 $I_1$ で割っていない", w: 1, cut: 1}, {x: (I2 / 2), why: "$\\dfrac{\\mu_0}{2 \\pi}$ を $\\dfrac{\\mu_0}{\\pi}$ とした（$2 \\times 10^{-7}$ でなく $4 \\times 10^{-7}$）", w: 2, cut: 0}, {x: (I2 * 10), why: "10 のべき乗を1つ取り違えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s4i2", text: "図のように、真空中で $" + fmt(rr) + "\\,\\mathrm{m}$ 離れた平行な2本の導体の一方に $" + fmt(I1) + "\\,\\mathrm{A}$ を流すと、$1\\,\\mathrm{m}$ あたり $" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "}\\,\\mathrm{N}$ の力が働きました。もう一方の電流は何 A ですか。真空中の透磁率は $\\mu_0 = 4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。", fig: {kind: "u51s4pa", L: tbU51s4_fig({"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"1 m"}, [["i1", fmt(I1) + " A"], ["i2", "{I}_2"], ["r", fmt(rr) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = 2 \\times 10^{-7} \\times \\dfrac{I_1 I_2 l}{r}$ に入れる　$" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "} = 2 \\times 10^{-7} \\times \\dfrac{" + fmt(I1) + " \\times I_2 \\times 1}{" + fmt(rr) + "}$", "$I_2 = \\dfrac{" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "} \\times " + fmt(rr) + "}{2 \\times 10^{-7} \\times " + fmt(I1) + "} = " + qv(ok, "A") + "$"], chk: {form: "u51s4i2", p: {I1: I1, r10: r10, Fa: Fa, e: e}}};
  }
  throw new Error("u51s4i2：条件に合う数字が見つからない");
}
function tbU51s4_Qdist(r){
  var gcd = tbU51s4_gcd, ratio = tbU51s4_ratio, par = tbU51s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I1 = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var I2 = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var r10 = pick(r, [1,2,3,4,5,6,8,10,15,20]);
    var rr = (r10 / 10);
    var F7 = (20 * I1 * I2 / r10);
    var e = (F7 % 10000 == 0 ? 3 : F7 % 1000 == 0 ? 4 : F7 % 100 == 0 ? 5 : F7 % 10 == 0 ? 6 : 7);
    var Fa = (F7 / Math.pow(10, 7 - e));
    if (!((20 * I1 * I2) % r10 == 0 && I1 != 1 && I2 != 1 && I1 != I2 && Math.abs(r10 / I1 * 1000 - Math.round(r10 / I1 * 1000)) < 1e-7 && Math.abs(r10 / I2 * 1000 - Math.round(r10 / I2 * 1000)) < 1e-7)) continue;
    var ok = (rr);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s4_three4(ok, [{x: (rr / I2), why: "もう一方の電流 $I_2$ を掛けていない", w: 0, cut: 1}, {x: (rr / I1), why: "電流 $I_1$ を掛けていない", w: 1, cut: 1}, {x: (rr * 2), why: "$\\dfrac{\\mu_0}{2 \\pi}$ を $\\dfrac{\\mu_0}{\\pi}$ とした（$2 \\times 10^{-7}$ でなく $4 \\times 10^{-7}$）", w: 2, cut: 0}, {x: (rr * 10), why: "10 のべき乗を1つ取り違えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s4dist", text: "真空中で平行な2本の導体に $" + fmt(I1) + "\\,\\mathrm{A}$ と $" + fmt(I2) + "\\,\\mathrm{A}$ を流すと、$1\\,\\mathrm{m}$ あたり $" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "}\\,\\mathrm{N}$ の力が働きました。導体の間の距離 $r$ [m] の値はいくつですか。真空中の透磁率は $\\mu_0 = 4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。", fig: {kind: "u51s4pa", L: tbU51s4_fig({"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"1 m"}, [["i1", fmt(I1) + " A"], ["i2", fmt(I2) + " A"], ["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "} = 2 \\times 10^{-7} \\times \\dfrac{" + fmt(I1) + " \\times " + fmt(I2) + " \\times 1}{r}$", "$r = \\dfrac{2 \\times 10^{-7} \\times " + fmt(I1) + " \\times " + fmt(I2) + "}{" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "}} = " + fmt(ok) + "\\,\\mathrm{m}$"], chk: {form: "u51s4dist", p: {I1: I1, I2: I2, r10: r10, Fa: Fa, e: e}}};
  }
  throw new Error("u51s4dist：条件に合う数字が見つからない");
}
function tbU51s4_Qmm(r){
  var gcd = tbU51s4_gcd, ratio = tbU51s4_ratio, par = tbU51s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I1 = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var I2 = pick(r, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
    var rm = pick(r, [10,20,50,100,200,500]);
    var F7 = (2000 * I1 * I2 / rm);
    var e = (F7 % 10000 == 0 ? 3 : F7 % 1000 == 0 ? 4 : F7 % 100 == 0 ? 5 : F7 % 10 == 0 ? 6 : 7);
    var Fa = (F7 / Math.pow(10, 7 - e));
    if (!((2000 * I1 * I2) % rm == 0 && I1 != 1 && I1 != I2 && Math.abs(I2 * 1000 / rm * 1000 - Math.round(I2 * 1000 / rm * 1000)) < 1e-7)) continue;
    var ok = (I2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s4_three4(ok, [{x: (I2 * 1000 / rm), why: "距離 $r$ を掛けていない", w: 0, cut: 1}, {x: (I1 * I2), why: "もう一方の電流 $I_1$ で割っていない", w: 1, cut: 1}, {x: (I2 * 1000), why: "mm を m に直していない", w: 2, cut: 0}, {x: (I2 / 2), why: "$\\dfrac{\\mu_0}{2 \\pi}$ を $\\dfrac{\\mu_0}{\\pi}$ とした（$2 \\times 10^{-7}$ でなく $4 \\times 10^{-7}$）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s4mm", text: "図のように、真空中で $" + fmt(rm) + "\\,\\mathrm{mm}$ 離れた平行な2本の導体の一方に $" + fmt(I1) + "\\,\\mathrm{A}$ を流すと、$1\\,\\mathrm{m}$ あたり $" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "}\\,\\mathrm{N}$ の力が働きました。もう一方の電流は何 A ですか。真空中の透磁率は $\\mu_0 = 4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。", fig: {kind: "u51s4pa", L: tbU51s4_fig({"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"1 m"}, [["i1", fmt(I1) + " A"], ["i2", "{I}_2"], ["r", fmt(rm) + " mm"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(rm) + "\\,\\mathrm{mm} = " + fmt(rm / 1000) + "\\,\\mathrm{m}$　$" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "} = 2 \\times 10^{-7} \\times \\dfrac{" + fmt(I1) + " \\times I_2 \\times 1}{" + fmt(rm / 1000) + "}$", "$I_2 = \\dfrac{" + fmt(Fa) + " \\times 10^{-" + fmt(e) + "} \\times " + fmt(rm / 1000) + "}{2 \\times 10^{-7} \\times " + fmt(I1) + "} = " + qv(ok, "A") + "$"], chk: {form: "u51s4mm", p: {I1: I1, rm: rm, Fa: Fa, e: e}}};
  }
  throw new Error("u51s4mm：条件に合う数字が見つからない");
}
function tbU51s4_Qratio(r){
  var gcd = tbU51s4_gcd, ratio = tbU51s4_ratio, par = tbU51s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4]);
    var b = pick(r, [2,3,4]);
    var c = pick(r, [2,3,4,5]);
    var X = (a * b / c);
    if (!(a != c && b != c && Math.abs(X * 100 - Math.round(X * 100)) < 1e-9 && Math.abs(a * b / (c * c) * 100 - Math.round(a * b / (c * c) * 100)) < 1e-9 && Math.abs(a / c * 100 - Math.round(a / c * 100)) < 1e-9 && X != 1)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s4_three4(ok, [{x: (a * b), why: "距離を変えたことを入れていない", w: 0, cut: 1}, {x: (a / c), why: "もう一方の電流 $I_2$ を変えたことを入れていない", w: 1, cut: 1}, {x: (a * b * c), why: "力が距離に比例するとした（距離に反比例）", w: 2, cut: 0}, {x: (a * b / (c * c)), why: "力が距離の2乗に反比例するとした（距離に反比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s4ratio", text: "平行な2本の導体に電流 $I_1$・$I_2$ を流しています。$I_1$ を " + fmt(a) + " 倍、$I_2$ を " + fmt(b) + " 倍にし、導体の間の距離を " + fmt(c) + " 倍にしました。導体の1 m あたりに働く力は、前の何倍ですか。", fig: {kind: "u51s4pa", L: tbU51s4_fig({"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"1 m"}, [["i1", "{I}_1"], ["i2", "{I}_2"], ["r", "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = 2 \\times 10^{-7} \\times \\dfrac{I_1 I_2 l}{r}$　力は電流の積に比例し、距離に反比例する", "$\\dfrac{" + fmt(a) + " \\times " + fmt(b) + "}{" + fmt(c) + "} = " + qv(ok, "X") + "$"], chk: {form: "u51s4ratio", p: {a: a, b: b, c: c}}};
  }
  throw new Error("u51s4ratio：条件に合う数字が見つからない");
}
// 51-5 右ねじから左手で力の向き の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s5_par(a, b){ return a * b / (a + b); }
function tbU51s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s5_Qone(r){
  var gcd = tbU51s5_gcd, ratio = tbU51s5_ratio, par = tbU51s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var sa = pick(r, [1,2]);
    var sb = pick(r, [1,2]);
    var k = pick(r, [1,2]);
    var va = (sa == 1 ? 'front' : 'back');
    var vb = (sb == 1 ? 'front' : 'back');
    var ta = (va == 'front' ? '手前向き' : '奥向き');
    var tb = (vb == 'front' ? '手前向き' : '奥向き');
    var who = (k == 1 ? 'B' : 'A');
    var oth = (k == 1 ? 'A' : 'B');
    var hu = (k == 1 ? (sa == 1 ? 'up' : 'down') : (sb == 1 ? 'down' : 'up'));
    var ht = (hu == 'up' ? '上向き' : '下向き');
    var same = (sa == sb);
    var fo = ((same == (k == 1)) ? 'left' : 'right');
    var fw = (fo == 'left' ? 'right' : 'left');
    var ft = (fo == 'left' ? '左向き' : '右向き');
    var fwt = (fo == 'left' ? '右向き' : '左向き');
    var _c = choices(r, [{t: String(ft), v: String(fo)}, {t: String(ht), v: String(hu), why: String(oth) + " がつくる磁界の向きで止めた（左手で力の向きを出していない）"}, {t: "力は働かない", v: "none", why: String(who) + " の所の、" + String(oth) + " がつくる磁界を考えていない"}, {t: String(fwt), v: String(fw), why: "左手の指の向きを取り違えた（中指が電流・人差し指が磁界）"}]);
    return {form: "u51s5one", text: "図のように、導体 A の右に導体 B を置き、A には" + String(ta) + "、B には" + String(tb) + "の電流を流しました。" + String(who) + " に働く力の向きはどれですか。", fig: {kind: "u51s5xs", L: tbU51s5_fig({"c1":"A","c2":"B","i1":"{I}","i2":"{I}"}, [["ca1", String(va)], ["ca2", String(vb)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["右ねじの法則で、" + String(who) + " の所の " + String(oth) + " がつくる磁界は" + String(ht), "左手：人差し指を" + String(ht) + "、中指を " + String(who) + " の電流の向きに　力は" + String(ft)], chk: {form: "u51s5one", p: {sa: sa, sb: sb, k: k}}};
  }
  throw new Error("u51s5one：条件に合う数字が見つからない");
}
function tbU51s5_Qxyz(r){
  var gcd = tbU51s5_gcd, ratio = tbU51s5_ratio, par = tbU51s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var sa = pick(r, [1,2]);
    var sb = pick(r, [1,2]);
    var va = (sa == 1 ? 'front' : 'back');
    var vb = (sb == 1 ? 'front' : 'back');
    var ta = (va == 'front' ? '手前向き' : '奥向き');
    var tb = (vb == 'front' ? '手前向き' : '奥向き');
    var hz = (sa == 1 ? '+z 方向' : '−z 方向');
    var hv = (sa == 1 ? 'pz' : 'mz');
    var fo = (sa == sb ? 'mx' : 'px');
    var ft = (sa == sb ? '−x 方向' : '+x 方向');
    var fwt = (sa == sb ? '+x 方向' : '−x 方向');
    var fw = (sa == sb ? 'px' : 'mx');
    var ct = (sb == 1 ? '−y 方向' : '+y 方向');
    var cv = (sb == 1 ? 'my' : 'py');
    var _c = choices(r, [{t: String(ft), v: String(fo)}, {t: String(hz), v: String(hv), why: "A がつくる磁界の向きで止めた（左手で力の向きを出していない）"}, {t: String(ct), v: String(cv), why: "B の電流の向きを答えた（A がつくる磁界と左手を使っていない）"}, {t: String(fwt), v: String(fw), why: "左手の指の向きを取り違えた（中指が電流・人差し指が磁界）"}]);
    return {form: "u51s5xyz", text: "図のように、導体 A の右に導体 B を置き、A には" + String(ta) + "、B には" + String(tb) + "の電流を流しました。図の右の x・y・z の向きで、B に働く力の向きはどれですか。", fig: {kind: "u51s5xz", L: tbU51s5_fig({"c1":"A","c2":"B","i1":"{I}","i2":"{I}"}, [["ca1", String(va)], ["ca2", String(vb)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["B の所の A がつくる磁界は、右ねじの法則で" + String(hz), "左手：人差し指を" + String(hz) + "、中指を B の電流の向きに　力は" + String(ft)], chk: {form: "u51s5xyz", p: {sa: sa, sb: sb}}};
  }
  throw new Error("u51s5xyz：条件に合う数字が見つからない");
}
function tbU51s5_Qboth(r){
  var gcd = tbU51s5_gcd, ratio = tbU51s5_ratio, par = tbU51s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var sa = pick(r, [1,2]);
    var sb = pick(r, [1,2]);
    var va = (sa == 1 ? 'front' : 'back');
    var vb = (sb == 1 ? 'front' : 'back');
    var ta = (va == 'front' ? '手前向き' : '奥向き');
    var tb = (vb == 'front' ? '手前向き' : '奥向き');
    var ao = (sa == sb ? '右' : '左');
    var bo = (sa == sb ? '左' : '右');
    var _c = choices(r, [{t: "A は" + String(ao) + "向き・B は" + String(bo) + "向き", v: String(ao) + String(bo)}, {t: "A は" + String(bo) + "向き・B は" + String(bo) + "向き", v: String(bo) + String(bo), why: "A の力を、B の所の磁界のまま決めた（A の所で B がつくる磁界を出し直していない）"}, {t: "A は" + String(ao) + "向き・B は" + String(ao) + "向き", v: String(ao) + String(ao), why: "B の力を、A の所の磁界のまま決めた（B の所で A がつくる磁界を出し直していない）"}, {t: "A は" + String(bo) + "向き・B は" + String(ao) + "向き", v: String(bo) + String(ao), why: "左手の指の向きを取り違えた（中指が電流・人差し指が磁界）"}]);
    return {form: "u51s5both", text: "図のように、導体 A の右に導体 B を置き、A には" + String(ta) + "、B には" + String(tb) + "の電流を流しました。A と B に働く力の向きの組はどれですか。", fig: {kind: "u51s5xs", L: tbU51s5_fig({"c1":"A","c2":"B","i1":"{I}","i2":"{I}"}, [["ca1", String(va)], ["ca2", String(vb)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["B の所の A がつくる磁界・A の所の B がつくる磁界を、それぞれ右ねじで出す", "それぞれ左手で：A は" + String(ao) + "向き・B は" + String(bo) + "向き"], chk: {form: "u51s5both", p: {sa: sa, sb: sb}}};
  }
  throw new Error("u51s5both：条件に合う数字が見つからない");
}
function tbU51s5_Qinv(r){
  var gcd = tbU51s5_gcd, ratio = tbU51s5_ratio, par = tbU51s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var sa = pick(r, [1,2]);
    var fr = pick(r, [1,2]);
    var va = (sa == 1 ? 'front' : 'back');
    var ta = (va == 'front' ? '手前向き' : '奥向き');
    var fdt = (fr == 1 ? '右向き' : '左向き');
    var hu = (sa == 1 ? '上向き' : '下向き');
    var hv = (sa == 1 ? 'up' : 'down');
    var bo = ((fr == 1) == (sa == 1) ? 'back' : 'front');
    var bw = (bo == 'back' ? 'front' : 'back');
    var bt = (bo == 'back' ? '奥向き' : '手前向き');
    var bwt = (bo == 'back' ? '手前向き' : '奥向き');
    var _c = choices(r, [{t: String(bt), v: String(bo)}, {t: String(bwt), v: String(bw), why: "左手の指の向きを取り違えた（中指が電流・人差し指が磁界）"}, {t: String(hu), v: String(hv), why: "A がつくる磁界の向きを答えた（左手で電流の向きを出していない）"}, {t: String(fdt), v: "force", why: "力の向きを答えた（電流は手前向きか奥向き。左手の中指で出す）"}]);
    return {form: "u51s5inv", text: "図のように、導体 A の右に導体 B を置き、A には" + String(ta) + "の電流を流しました。B に働く力は" + String(fdt) + "でした。B の電流の向きはどれですか。", fig: {kind: "u51s5xs", L: tbU51s5_fig({"c1":"A","c2":"B","i1":"{I}","i2":"{I}"}, [["ca1", String(va)], ["i2", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["B の所の A がつくる磁界は、右ねじの法則で" + String(hu), "左手：人差し指を" + String(hu) + "、親指を" + String(fdt) + "にすると、中指は" + String(bt)], chk: {form: "u51s5inv", p: {sa: sa, fr: fr}}};
  }
  throw new Error("u51s5inv：条件に合う数字が見つからない");
}
// 51-6 磁界の強さから磁束密度 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s6_par(a, b){ return a * b / (a + b); }
function tbU51s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s6_Qb(r){
  var gcd = tbU51s6_gcd, ratio = tbU51s6_ratio, par = tbU51s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [100,200,250,400,500,1000]);
    var I = pick(r, [1,2,3,4,5,6,7,8,9,10]);
    var l10 = pick(r, [2,4,5,10,20]);
    var mk = pick(r, [1,2,4,5,8]);
    var ll = (l10 / 10);
    var H = (N * I * 10 / l10);
    var B = (mk * N * I / (l10 * 100));
    if (!(Math.abs(B * 10 - Math.round(B * 10)) < 1e-9 && Math.abs(mk * N * I / 1000 * 10 - Math.round(mk * N * I / 1000 * 10)) < 1e-9 && B <= 2 && B >= 0.1 && l10 != 10)) continue;
    var ok = (B);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s6_three4(ok, [{x: (mk * N * I / 1000), why: "磁路の長さで割っていない", w: 0, cut: 1}, {x: (mk * I / (l10 * 100)), why: "巻数を掛けていない", w: 1, cut: 1}, {x: (H), why: "磁界の強さで止めた（透磁率を掛けていない）", w: 2, cut: 1}, {x: (H * 1000 / mk), why: "透磁率で割った（$B = \\mu H$ は掛ける）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "T", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s6b", text: "図のように、磁路の長さ $" + fmt(ll) + "\\,\\mathrm{m}$ の環状ソレノイドの鉄心に巻数 " + fmt(N) + " のコイルを巻き、$" + fmt(I) + "\\,\\mathrm{A}$ を流しました。鉄心の透磁率は $" + fmt(mk) + " \\times 10^{-3}\\,\\mathrm{H/m}$ です。鉄心の中の磁束密度は何 T ですか。", fig: {kind: "u51s6tr", L: tbU51s6_fig({"mu":"{μ}","ia":"in"}, [["l", "{l}=" + fmt(ll) + " m"], ["n", "{N}=" + fmt(N)], ["i", fmt(I) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{" + fmt(ll) + "} = " + qv(H, "Am") + "$　この値を次に使う", "$B = \\mu H = " + fmt(mk) + " \\times 10^{-3} \\times " + fmt(H) + " = " + qv(ok, "T") + "$"], chk: {form: "u51s6b", p: {N: N, I: I, l10: l10, mk: mk}}};
  }
  throw new Error("u51s6b：条件に合う数字が見つからない");
}
function tbU51s6_Qmr(r){
  var gcd = tbU51s6_gcd, ratio = tbU51s6_ratio, par = tbU51s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [100,200,250,400,500,1000]);
    var I = pick(r, [1,2,3,4,5,6,7,8,9,10]);
    var l10 = pick(r, [2,4,5,10,20]);
    var mr = pick(r, [100,200,250,500,1000,2000]);
    var ll = (l10 / 10);
    var H = (N * I * 10 / l10);
    var K = (4 * mr * N * I * 10 / (l10 * 1000));
    if (!(Math.abs(K * 10 - Math.round(K * 10)) < 1e-9 && Math.abs(4 * N * I * 10 / (l10 * 1000) * 10 - Math.round(4 * N * I * 10 / (l10 * 1000) * 10)) < 1e-9 && Math.abs(4 * mr * N * I / 1000 * 10 - Math.round(4 * mr * N * I / 1000 * 10)) < 1e-9 && Math.abs(K / 4 * 10 - Math.round(K / 4 * 10)) < 1e-9 && K >= 1 && K <= 6000 && l10 != 10)) continue;
    var ok = (K);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s6_three4(ok, [{x: (4 * N * I * 10 / (l10 * 1000)), why: "比透磁率を掛けていない（真空の透磁率のまま）", w: 0, cut: 1}, {x: (4 * mr * N * I / 1000), why: "磁路の長さで割っていない", w: 1, cut: 1}, {x: (K / 4), why: "$\\mu_0$ を $\\pi \\times 10^{-7}$ とした（$4 \\pi \\times 10^{-7}$）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s6mr", text: "図のように、磁路の長さ $" + fmt(ll) + "\\,\\mathrm{m}$ の環状ソレノイドの鉄心に巻数 " + fmt(N) + " のコイルを巻き、$" + fmt(I) + "\\,\\mathrm{A}$ を流しました。鉄心の比透磁率は " + fmt(mr) + "、真空の透磁率は $4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ です。鉄心の中の磁束密度は $\\square \\pi \\times 10^{-4}\\,\\mathrm{T}$ です。□ に入る数はいくつですか。", fig: {kind: "u51s6tr", L: tbU51s6_fig({"mu":"{μ}","ia":"in"}, [["l", "{l}=" + fmt(ll) + " m"], ["n", "{N}=" + fmt(N)], ["i", fmt(I) + " A"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{" + fmt(N) + " \\times " + fmt(I) + "}{" + fmt(ll) + "} = " + qv(H, "Am") + "$　$\\mu = \\mu_0 \\mu_r = 4 \\pi \\times 10^{-7} \\times " + fmt(mr) + "$", "$B = 4 \\pi \\times 10^{-7} \\times " + fmt(mr) + " \\times " + fmt(H) + " = " + fmt(ok) + " \\pi \\times 10^{-4}\\,\\mathrm{T}$"], chk: {form: "u51s6mr", p: {N: N, I: I, l10: l10, mr: mr}}};
  }
  throw new Error("u51s6mr：条件に合う数字が見つからない");
}
function tbU51s6_Qinv(r){
  var gcd = tbU51s6_gcd, ratio = tbU51s6_ratio, par = tbU51s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var N = pick(r, [100,200,250,400,500,1000]);
    var Im = pick(r, [10,20,50,100,200,250,400,500]);
    var l10 = pick(r, [2,4,5,10,20]);
    var mk = pick(r, [1,2,4,5,8]);
    var ll = (l10 / 10);
    var B = (mk * N * Im / (l10 * 100000));
    if (!((mk * N * Im) % (l10 * 100) == 0 && B >= 0.01 && B <= 2 && l10 != 10 && nice(Im / 1000) && Im * N != Im * 10 / l10)) continue;
    var ok = (Im);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s6_three4(ok, [{x: (Im * N), why: "巻数で割っていない", w: 0, cut: 1}, {x: (Im * 10 / l10), why: "磁路の長さを掛けていない", w: 1, cut: 1}, {x: (Im / 1000), why: "A を mA に直していない", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "mA", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s6inv", text: "図のように、磁路の長さ $" + fmt(ll) + "\\,\\mathrm{m}$ の環状ソレノイドの鉄心に巻数 " + fmt(N) + " のコイルを巻きました。鉄心の透磁率は $" + fmt(mk) + " \\times 10^{-3}\\,\\mathrm{H/m}$ です。鉄心の中の磁束密度を $" + fmt(B) + "\\,\\mathrm{T}$ にするには、何 mA を流せばよいですか。", fig: {kind: "u51s6tr", L: tbU51s6_fig({"mu":"{μ}","ia":"in"}, [["l", "{l}=" + fmt(ll) + " m"], ["n", "{N}=" + fmt(N)], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$H = \\dfrac{B}{\\mu} = \\dfrac{" + fmt(B) + "}{" + fmt(mk) + " \\times 10^{-3}} = " + qv(B * 1000 / mk, "Am") + "$　この値を $H = \\dfrac{NI}{l}$ に使う", "$I = \\dfrac{H l}{N} = \\dfrac{" + fmt(B * 1000 / mk) + " \\times " + fmt(ll) + "}{" + fmt(N) + "} = " + qv(Im / 1000, "A") + " = " + qv(ok, "mA") + "$"], chk: {form: "u51s6inv", p: {N: N, l10: l10, mk: mk, B_: mk * N * Im / (l10 * 100)}}};
  }
  throw new Error("u51s6inv：条件に合う数字が見つからない");
}
// 51-7 電流のグラフから自己誘導起電力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s7_par(a, b){ return a * b / (a + b); }
function tbU51s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s7_Qmax1(r){
  var gcd = tbU51s7_gcd, ratio = tbU51s7_ratio, par = tbU51s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Im = pick(r, [2,4,5,6,8,10,12,15,16,20]);
    var L = pick(r, [1,2,4,5,10]);
    var k = pick(r, [1,2]);
    var t1 = (5 * k);
    var t3 = (2 * k);
    var e1 = (L * Im / (5 * k));
    var e3 = (L * Im / (2 * k));
    var EM = (Math.max(e1, e3));
    var Em = (Math.min(e1, e3));
    var sl = (Math.max(Im / (5 * k), Im / (2 * k)));
    var wk = (e1 < e3 ? '増える' : '減る');
    if (!(Math.abs(e1 * 10 - Math.round(e1 * 10)) < 1e-9 && Math.abs(e3 * 10 - Math.round(e3 * 10)) < 1e-9 && EM <= 200 && L != 1)) continue;
    var ok = (EM);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s7_three4(ok, [{x: (Em), why: "傾きを比べず、" + String(wk) + "区間で止めた（傾きが大きい区間で最大）", w: 0, cut: 1}, {x: (sl), why: "傾きで止めた（$L$ を掛けていない）", w: 1, cut: 1}, {x: (EM / 1000), why: "ms を s に直していない", w: 2, cut: 0}, {x: (L * Im), why: "時間で割っていない（電流の変化に $L$ を掛けただけ）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s7max1", text: "自己インダクタンス $" + fmt(L) + "\\,\\mathrm{H}$ のコイルに、図のように変わる電流を流しました（最大 $" + qv(Im, "mA") + "$）。コイルの電圧の大きさの最大は何 V ですか。", fig: {kind: "u51s7g1", L: tbU51s7_fig({"gx":"{t} [ms]","gy":"{I} [mA]"}, [["gv1", fmt(Im)], ["gw1", fmt(5 * k)], ["gw2", fmt(5 * k)], ["gw3", fmt(2 * k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["増える区間 $\\dfrac{" + fmt(Im) + "\\,\\mathrm{mA}}{" + fmt(t1) + "\\,\\mathrm{ms}}$、減る区間 $\\dfrac{" + fmt(Im) + "\\,\\mathrm{mA}}{" + fmt(t3) + "\\,\\mathrm{ms}}$（一定の区間は 0）　傾きの大きい区間で最大", "$v = L \\dfrac{\\Delta I}{\\Delta t} = " + fmt(L) + " \\times " + fmt(sl) + " = " + qv(ok, "V") + "$"], chk: {form: "u51s7max1", p: {Im: Im, L: L, k: k}}};
  }
  throw new Error("u51s7max1：条件に合う数字が見つからない");
}
function tbU51s7_Qmax2(r){
  var gcd = tbU51s7_gcd, ratio = tbU51s7_ratio, par = tbU51s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Im = pick(r, [2,4,5,6,8,10,12,15,16,20]);
    var L = pick(r, [1,2,4,5,10]);
    var k = pick(r, [1,2]);
    var t1 = (2 * k);
    var t3 = (4 * k);
    var e1 = (L * Im / (2 * k));
    var e3 = (L * Im / (4 * k));
    var EM = (Math.max(e1, e3));
    var Em = (Math.min(e1, e3));
    var sl = (Math.max(Im / (2 * k), Im / (4 * k)));
    var wk = (e1 < e3 ? '増える' : '減る');
    if (!(Math.abs(e1 * 10 - Math.round(e1 * 10)) < 1e-9 && Math.abs(e3 * 10 - Math.round(e3 * 10)) < 1e-9 && EM <= 200 && L != 1)) continue;
    var ok = (EM);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s7_three4(ok, [{x: (Em), why: "傾きを比べず、" + String(wk) + "区間で止めた（傾きが大きい区間で最大）", w: 0, cut: 1}, {x: (sl), why: "傾きで止めた（$L$ を掛けていない）", w: 1, cut: 1}, {x: (EM / 1000), why: "ms を s に直していない", w: 2, cut: 0}, {x: (L * Im), why: "時間で割っていない（電流の変化に $L$ を掛けただけ）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s7max2", text: "自己インダクタンス $" + fmt(L) + "\\,\\mathrm{H}$ のコイルに、図のように変わる電流を流しました（最大 $" + qv(Im, "mA") + "$）。コイルの電圧の大きさの最大は何 V ですか。", fig: {kind: "u51s7g2", L: tbU51s7_fig({"gx":"{t} [ms]","gy":"{I} [mA]"}, [["gv1", fmt(Im)], ["gw1", fmt(2 * k)], ["gw2", fmt(4 * k)], ["gw3", fmt(4 * k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["増える区間 $\\dfrac{" + fmt(Im) + "\\,\\mathrm{mA}}{" + fmt(t1) + "\\,\\mathrm{ms}}$、減る区間 $\\dfrac{" + fmt(Im) + "\\,\\mathrm{mA}}{" + fmt(t3) + "\\,\\mathrm{ms}}$（一定の区間は 0）　傾きの大きい区間で最大", "$v = L \\dfrac{\\Delta I}{\\Delta t} = " + fmt(L) + " \\times " + fmt(sl) + " = " + qv(ok, "V") + "$"], chk: {form: "u51s7max2", p: {Im: Im, L: L, k: k}}};
  }
  throw new Error("u51s7max2：条件に合う数字が見つからない");
}
function tbU51s7_Qsec(r){
  var gcd = tbU51s7_gcd, ratio = tbU51s7_ratio, par = tbU51s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Im = pick(r, [2,4,5,6,8,10,12,15,16,20]);
    var L = pick(r, [1,2,4,5,10]);
    var k = pick(r, [1,2]);
    var h = pick(r, [1,3]);
    var t1 = (5 * k);
    var t2 = (10 * k);
    var t3 = (12 * k);
    var tt = (h == 1 ? 5 * k : 2 * k);
    var tw = (h == 1 ? 2 * k : 5 * k);
    var ta = (h == 1 ? 0 : 10 * k);
    var tb = (h == 1 ? 5 * k : 12 * k);
    var E = (L * Im / tt);
    var EW = (L * Im / tw);
    if (!(Math.abs(E * 10 - Math.round(E * 10)) < 1e-9 && Math.abs(EW * 10 - Math.round(EW * 10)) < 1e-9 && Math.abs(Im / tt * 10 - Math.round(Im / tt * 10)) < 1e-9 && L != 1 && E <= 200)) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s7_three4(ok, [{x: (Im / tt), why: "傾きで止めた（$L$ を掛けていない）", w: 0, cut: 1}, {x: (L * Im), why: "時間で割っていない（電流の変化に $L$ を掛けただけ）", w: 1, cut: 1}, {x: (EW), why: "ほかの区間の傾きを使った（区間の時間を取り違えた）", w: 2, cut: 0}, {x: (E / 1000), why: "ms を s に直していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s7sec", text: "自己インダクタンス $" + fmt(L) + "\\,\\mathrm{H}$ のコイルに、図のように変わる電流を流しました（最大 $" + qv(Im, "mA") + "$）。$" + fmt(ta) + "\\,\\mathrm{ms}$ から $" + fmt(tb) + "\\,\\mathrm{ms}$ の間のコイルの電圧の大きさは何 V ですか。", fig: {kind: "u51s7g1", L: tbU51s7_fig({"gx":"{t} [ms]","gy":"{I} [mA]"}, [["gv1", fmt(Im)], ["gw1", fmt(5 * k)], ["gw2", fmt(5 * k)], ["gw3", fmt(2 * k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["この区間は $" + fmt(tt) + "\\,\\mathrm{ms}$ で $" + fmt(Im) + "\\,\\mathrm{mA}$ 変わる　傾き $\\dfrac{" + fmt(Im) + "}{" + fmt(tt) + "} = " + fmt(Im / tt) + "\\,\\mathrm{A/s}$", "$v = " + fmt(L) + " \\times " + fmt(Im / tt) + " = " + qv(ok, "V") + "$"], chk: {form: "u51s7sec", p: {Im: Im, L: L, tt_: tt, tw_: tw}}};
  }
  throw new Error("u51s7sec：条件に合う数字が見つからない");
}
function tbU51s7_Qzero(r){
  var gcd = tbU51s7_gcd, ratio = tbU51s7_ratio, par = tbU51s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Im = pick(r, [2,4,5,6,8,10,12,15,16,20]);
    var L = pick(r, [1,2,4,5,10]);
    var k = pick(r, [1,2]);
    var a1 = (2 * k);
    var a2 = (6 * k);
    var a3 = (10 * k);
    var _c = choices(r, [{t: "$" + fmt(a1) + "$〜$" + fmt(a2) + "\\,\\mathrm{ms}$", v: "flat"}, {t: "$0$〜$" + fmt(a1) + "\\,\\mathrm{ms}$", v: "up", why: "電流が 0 から増える区間を選んだ（増えている間は電圧が生じる）"}, {t: "$" + fmt(a2) + "$〜$" + fmt(a3) + "\\,\\mathrm{ms}$", v: "down", why: "電流が 0 に戻る区間を選んだ（減っている間も電圧が生じる）"}, {t: "0 になる区間は無い", v: "none", why: "電流が流れていれば電圧が生じるとした（一定なら傾きが 0 で電圧も 0）"}]);
    return {form: "u51s7zero", text: "自己インダクタンス $" + fmt(L) + "\\,\\mathrm{H}$ のコイルに、図のように変わる電流を流しました（最大 $" + qv(Im, "mA") + "$）。コイルの電圧が 0 になる区間はどれですか。", fig: {kind: "u51s7g2", L: tbU51s7_fig({"gx":"{t} [ms]","gy":"{I} [mA]"}, [["gv1", fmt(Im)], ["gw1", fmt(2 * k)], ["gw2", fmt(4 * k)], ["gw3", fmt(4 * k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電圧は電流の傾き $\\dfrac{\\Delta I}{\\Delta t}$ に $L$ を掛けた物", "電流が一定の $" + fmt(a1) + "$〜$" + fmt(a2) + "\\,\\mathrm{ms}$ は傾きが 0 で、電圧も 0"], chk: {form: "u51s7zero", p: {k: k}}};
  }
  throw new Error("u51s7zero：条件に合う数字が見つからない");
}
function tbU51s7_Qinv(r){
  var gcd = tbU51s7_gcd, ratio = tbU51s7_ratio, par = tbU51s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Im = pick(r, [2,4,5,6,8,10,12,15,16,20]);
    var L = pick(r, [1,2,4,5,10]);
    var k = pick(r, [1,2]);
    var t1 = (5 * k);
    var E = (L * Im / (5 * k));
    if (!(Math.abs(E * 10 - Math.round(E * 10)) < 1e-9 && Math.abs(E / Im * 10 - Math.round(E / Im * 10)) < 1e-9 && Math.abs(E * 5 * k * 10 - Math.round(E * 5 * k * 10)) < 1e-9 && L != 1 && E != L)) continue;
    var ok = (L);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s7_three4(ok, [{x: (E / Im), why: "時間を掛けていない（電圧を電流の変化で割っただけ）", w: 0, cut: 1}, {x: (E * 5 * k), why: "電流の変化で割っていない", w: 1, cut: 1}, {x: (L * 1000), why: "mA を A に直したのに、ms を s に直していない", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "H", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s7inv", text: "コイルに図のように変わる電流を流しました（最大 $" + qv(Im, "mA") + "$）。$0$ から $" + fmt(t1) + "\\,\\mathrm{ms}$ の間のコイルの電圧の大きさは $" + fmt(E) + "\\,\\mathrm{V}$ でした。コイルの自己インダクタンスは何 H ですか。", fig: {kind: "u51s7g1", L: tbU51s7_fig({"gx":"{t} [ms]","gy":"{I} [mA]"}, [["gv1", fmt(Im)], ["gw1", fmt(5 * k)], ["gw2", fmt(5 * k)], ["gw3", fmt(2 * k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["増える区間の傾き $\\dfrac{" + fmt(Im) + "}{" + fmt(t1) + "} = " + fmt(Im / t1) + "\\,\\mathrm{A/s}$　この値で電圧を割る", "$L = \\dfrac{" + fmt(E) + "}{" + fmt(Im / t1) + "} = " + qv(ok, "H") + "$"], chk: {form: "u51s7inv", p: {Im: Im, k: k, E_: L * Im * 2 / k}}};
  }
  throw new Error("u51s7inv：条件に合う数字が見つからない");
}
// 51-8 磁束鎖交数から起電力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s8.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s8_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s8_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s8_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s8_par(a, b){ return a * b / (a + b); }
function tbU51s8_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s8_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s8_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s8_Qe(r){
  var gcd = tbU51s8_gcd, ratio = tbU51s8_ratio, par = tbU51s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [20,50,100,200,400,500]);
    var dp = pick(r, [2,4,5,10,20,40,50]);
    var t = pick(r, [0.1,0.2,0.4,0.5,1,2]);
    var E = (n * dp / 1000 / t);
    if (!(E >= 1 && E <= 200 && Math.abs(E * 10 - Math.round(E * 10)) < 1e-9)) continue;
    var ok = (E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s8_three4(ok, [{x: (n * dp / 1000), why: "磁束鎖交数の変化で止めた（時間で割っていない）", w: 0, cut: 1}, {x: (dp / 1000 / t), why: "巻数を掛けていない（磁束鎖交数を出していない）", w: 1, cut: 1}, {x: (n * dp / t), why: "mWb を Wb に直していない", w: 2, cut: 0}, {x: (n * dp / 1000 * t), why: "時間で割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s8e", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が、$" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(dp) + "\\,\\mathrm{mWb}" + "$ 変わりました。誘導起電力の大きさは何 V ですか。", fig: {kind: "u51s8cm", L: tbU51s8_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, [["n", "{N}=" + fmt(n)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束鎖交数の変化 $N \\Delta \\Phi = " + fmt(n) + " \\times " + fmt(dp / 1000) + " = " + qv(n * dp / 1000, "Wb") + "$　この値を次に使う", "$e = \\dfrac{" + fmt(n * dp / 1000) + "}{" + fmt(t) + "} = " + qv(ok, "V") + "$"], chk: {form: "u51s8e", p: {n: n, dp: dp, t: t}}};
  }
  throw new Error("u51s8e：条件に合う数字が見つからない");
}
function tbU51s8_Qdphi(r){
  var gcd = tbU51s8_gcd, ratio = tbU51s8_ratio, par = tbU51s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,500]);
    var Ev = pick(r, [1,2,4,5,10,20,50]);
    var tm = pick(r, [10,20,50,100,200,500]);
    var P = (Ev * tm / n);
    if (!(P >= 1 && P <= 500 && Math.abs(P * 10 - Math.round(P * 10)) < 1e-9 && n * 1000 != tm)) continue;
    var ok = (P);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s8_three4(ok, [{x: (Ev * tm), why: "磁束鎖交数の変化で止めた（巻数で割っていない）", w: 0, cut: 1}, {x: (Ev / n * 1000), why: "時間を掛けていない（磁束鎖交数の変化を出していない）", w: 1, cut: 1}, {x: (Ev * tm / n / 1000), why: "ms を s に直したまま mWb に直していない", w: 2, cut: 0}, {x: (Ev * tm * n), why: "巻数で割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{mWb}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s8dphi", text: "巻数 " + fmt(n) + " のコイルに鎖交する磁束が $" + fmt(tm) + "\\,\\mathrm{ms}" + "$ の間に変わり、大きさ $" + qv(Ev, "V") + "$ の誘導起電力が生じました。この間に変わった磁束は何 mWb ですか。", fig: {kind: "u51s8cm", L: tbU51s8_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, [["n", "{N}=" + fmt(n)], ["e", "{e}=" + qf(Ev, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束鎖交数の変化 $N \\Delta \\Phi = e \\Delta t = " + fmt(Ev) + " \\times " + fmt(tm / 1000) + " = " + qv(Ev * tm / 1000, "Wb") + "$　この値を次に使う", "$\\Delta \\Phi = \\dfrac{" + fmt(Ev * tm / 1000) + "}{" + fmt(n) + "} = " + qv(P / 1000, "Wb") + " = " + fmt(ok) + "\\,\\mathrm{mWb}" + "$"], chk: {form: "u51s8dphi", p: {n: n, Ev: Ev, tm: tm}}};
  }
  throw new Error("u51s8dphi：条件に合う数字が見つからない");
}
function tbU51s8_Qn(r){
  var gcd = tbU51s8_gcd, ratio = tbU51s8_ratio, par = tbU51s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [10,20,50,100,200,400,500]);
    var dp = pick(r, [2,4,5,10,20,50]);
    var t = pick(r, [0.1,0.2,0.5,1,2]);
    var Ev = (n * dp / 1000 / t);
    if (!(Ev >= 1 && Ev <= 100 && Math.abs(Ev * 10 - Math.round(Ev * 10)) < 1e-9 && Math.abs((Ev * t) * 10 - Math.round((Ev * t) * 10)) < 1e-9)) continue;
    var ok = (n);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s8_three4(ok, [{x: (Ev * t), why: "磁束鎖交数の変化で止めた（磁束の変化で割っていない）", w: 0, cut: 1}, {x: (Ev / (dp / 1000)), why: "時間を掛けていない（磁束鎖交数の変化を出していない）", w: 1, cut: 1}, {x: (Ev * t / dp), why: "mWb を Wb に直していない", w: 2, cut: 0}, {x: (Ev / t / (dp / 1000)), why: "時間を掛けるところを割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s8n", text: "コイルに鎖交する磁束が $" + fmt(t) + "\\,\\mathrm{s}$ の間に $" + fmt(dp) + "\\,\\mathrm{mWb}" + "$ 変わり、大きさ $" + qv(Ev, "V") + "$ の誘導起電力が生じました。コイルの巻数はいくらですか。", fig: {kind: "u51s8cm", L: tbU51s8_fig({"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"}, [["e", "{e}=" + qf(Ev, "V")], ["n", "{N}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["磁束鎖交数の変化 $N \\Delta \\Phi = e \\Delta t = " + fmt(Ev) + " \\times " + fmt(t) + " = " + qv(Ev * t, "Wb") + "$　この値を次に使う", "$N = \\dfrac{" + fmt(Ev * t) + "}{" + fmt(dp / 1000) + "} = " + qv(ok, "1") + "$"], chk: {form: "u51s8n", p: {n: n, dp: dp, t: t}}};
  }
  throw new Error("u51s8n：条件に合う数字が見つからない");
}
// 51-9 磁束鎖交数から磁気エネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s9.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s9_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s9_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s9_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s9_par(a, b){ return a * b / (a + b); }
function tbU51s9_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s9_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s9_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s9_Qw(r){
  var gcd = tbU51s9_gcd, ratio = tbU51s9_ratio, par = tbU51s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var ps = pick(r, [0.01,0.02,0.04,0.05,0.1,0.2,0.4,0.5,1,2]);
    var i = pick(r, [1,2,4,5,10,20]);
    var W = (ps * i / 2);
    if (!(W >= 0.1 && W <= 50 && Math.abs(W * 10 - Math.round(W * 10)) < 1e-9)) continue;
    var ok = (W);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s9_three4(ok, [{x: (ps / i), why: "自己インダクタンスで止めた（磁気エネルギーを出していない）", w: 0, cut: 1}, {x: (ps * i * i / 2), why: "磁束鎖交数をそのまま $L$ とした（自己インダクタンスを出していない）", w: 1, cut: 1}, {x: (ps * i), why: "$\\dfrac{1}{2}$ を掛けていない", w: 2, cut: 0}, {x: (ps / 2), why: "電流を2乗していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s9w", text: "コイルに $" + qv(i, "A") + "$ の電流を流すと、磁束鎖交数 $N \\Phi$ は $" + qv(ps, "Wb") + "$ でした。コイルに蓄えられる磁気エネルギーは何 J ですか。", fig: {kind: "u51s9co", L: tbU51s9_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","w":"{W}"}, [["i", "{I}=" + qf(i, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L = \\dfrac{N \\Phi}{I} = \\dfrac{" + fmt(ps) + "}{" + fmt(i) + "} = " + qv(ps / i, "H") + "$　この値を次に使う", "$W = \\dfrac{1}{2} \\times " + fmt(ps / i) + " \\times " + fmt(i) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u51s9w", p: {ps: ps, i: i}}};
  }
  throw new Error("u51s9w：条件に合う数字が見つからない");
}
function tbU51s9_Qrt(r){
  var gcd = tbU51s9_gcd, ratio = tbU51s9_ratio, par = tbU51s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,5,10]);
    var ok = (k * k);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s9_three4(ok, [{x: (k), why: "磁束鎖交数の倍で止めた（磁気エネルギーを出していない）", w: 0, cut: 1}, {x: (1), why: "自己インダクタンスの倍で止めた（電流の2乗を掛けていない）", w: 1, cut: 1}, {x: (k * k * k), why: "磁束鎖交数をそのまま $L$ とした（自己インダクタンスは変わらない）", w: 2, cut: 0}, {x: (2 * k), why: "2乗を 2 倍とした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s9rt", text: "鉄心に巻いたコイルの電流を " + fmt(k) + " 倍にしました。自己インダクタンスは変わりません。コイルに蓄えられる磁気エネルギーは何倍になりますか。", fig: {kind: "u51s9co", L: tbU51s9_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","w":"{W}"}, [["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$L$ は変わらないので、磁束鎖交数 $N \\Phi = LI$ は $" + fmt(k) + "$ 倍　この値を次に使う", "$W = \\dfrac{1}{2} N \\Phi \\times I$ なので $" + fmt(k) + " \\times " + fmt(k) + " = " + qv(ok, "X") + "$"], chk: {form: "u51s9rt", p: {k: k}}};
  }
  throw new Error("u51s9rt：条件に合う数字が見つからない");
}
function tbU51s9_Qmh(r){
  var gcd = tbU51s9_gcd, ratio = tbU51s9_ratio, par = tbU51s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Lm = pick(r, [10,20,40,50,100,200,400,500]);
    var ps = pick(r, [0.01,0.02,0.04,0.05,0.1,0.2,0.4,0.5,1,2]);
    var I = (ps * 1000 / Lm);
    var W = (ps * ps * 1000 / (2 * Lm));
    if (!(I >= 1 && I <= 20 && Math.abs(I * 10 - Math.round(I * 10)) < 1e-9 && W >= 0.01 && W <= 50 && Math.abs(W * 100 - Math.round(W * 100)) < 1e-9)) continue;
    var ok = (W);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s9_three4(ok, [{x: (I), why: "電流で止めた（磁気エネルギーを出していない）", w: 0, cut: 1}, {x: (Lm / 1000 * ps * ps / 2), why: "電流を出さず、磁束鎖交数を電流の所に入れた", w: 1, cut: 1}, {x: (ps * ps / (2 * Lm)), why: "mH を H に直していない", w: 2, cut: 0}, {x: (ps * ps * 1000 / Lm), why: "$\\dfrac{1}{2}$ を掛けていない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s9mh", text: "自己インダクタンス $" + fmt(Lm) + "\\,\\mathrm{mH}" + "$ のコイルに電流を流すと、磁束鎖交数 $N \\Phi$ は $" + qv(ps, "Wb") + "$ でした。コイルに蓄えられる磁気エネルギーは何 J ですか。", fig: {kind: "u51s9co", L: tbU51s9_fig({"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","w":"{W}"}, [["ind", "{L}=" + fmt(Lm) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I = \\dfrac{N \\Phi}{L} = \\dfrac{" + fmt(ps) + "}{" + fmt(Lm / 1000) + "} = " + qv(I, "A") + "$　この値を次に使う", "$W = \\dfrac{1}{2} \\times " + fmt(Lm / 1000) + " \\times " + fmt(I) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u51s9mh", p: {Lm: Lm, ps: ps}}};
  }
  throw new Error("u51s9mh：条件に合う数字が見つからない");
}
// 51-10 和動から結合係数 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s10.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s10_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s10_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s10_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s10_par(a, b){ return a * b / (a + b); }
function tbU51s10_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s10_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s10_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s10_Qwa(r){
  var gcd = tbU51s10_gcd, ratio = tbU51s10_ratio, par = tbU51s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var pr = pick(r, [0,1,2,3,4,5,6,7,8,9]);
    var k = pick(r, [0.2,0.25,0.4,0.5,0.6,0.75,0.8,0.9]);
    var L1 = ([0.8, 0.9, 0.4, 1.6, 0.9, 1, 2, 1.8, 1.2, 0.2][pr]);
    var L2 = ([0.2, 0.1, 0.1, 0.4, 0.4, 0.25, 0.5, 0.2, 0.3, 0.05][pr]);
    var rt = ([0.4, 0.3, 0.2, 0.8, 0.6, 0.5, 1, 0.6, 0.6, 0.1][pr]);
    var M = (Math.round((k * [0.4, 0.3, 0.2, 0.8, 0.6, 0.5, 1, 0.6, 0.6, 0.1][pr]) * 1000) / 1000);
    var Lw = (Math.round(([0.8, 0.9, 0.4, 1.6, 0.9, 1, 2, 1.8, 1.2, 0.2][pr] + [0.2, 0.1, 0.1, 0.4, 0.4, 0.25, 0.5, 0.2, 0.3, 0.05][pr] + 2 * k * [0.4, 0.3, 0.2, 0.8, 0.6, 0.5, 1, 0.6, 0.6, 0.1][pr]) * 1000) / 1000);
    var ok = (k);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s10_three4(ok, [{x: (M), why: "相互インダクタンス $M$ で止めた（結合係数を出していない）", w: 0, cut: 1}, {x: (2 * M), why: "$2M$ で止めた（2 で割っていない）", w: 1, cut: 1}, {x: (2 * M / rt), why: "$2M$ のまま結合係数の式に入れた", w: 2, cut: 1}, {x: (M / (L1 * L2)), why: "$\\sqrt{\\;}$ をとらなかった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s10wa", text: "自己インダクタンス $L_1 = " + qv(L1, "H") + "$ と $L_2 = " + qv(L2, "H") + "$ のコイルを、和動接続になるように直列につなぐと、合成インダクタンスは $" + qv(Lw, "H") + "$ でした。結合係数はいくらですか。", fig: {kind: "u51s10tc", L: tbU51s10_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","kc":"{k}"}, [["l1", "{L}_1=" + fmt(L1) + " H"], ["l2", "{L}_2=" + fmt(L2) + " H"], ["lt", "{L}=" + fmt(Lw) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["和動 $" + fmt(Lw) + " = " + fmt(L1) + " + " + fmt(L2) + " + 2M$ より $M = " + qv(M, "H") + "$　この値を次に使う", "$k = \\dfrac{" + fmt(M) + "}{\\sqrt{" + fmt(L1) + " \\times " + fmt(L2) + "}} = \\dfrac{" + fmt(M) + "}{" + fmt(rt) + "} = " + qv(ok, "1") + "$"], chk: {form: "u51s10wa", p: {L1: L1, L2: L2, rt: rt, Lw: Lw}}};
  }
  throw new Error("u51s10wa：条件に合う数字が見つからない");
}
function tbU51s10_Qsa(r){
  var gcd = tbU51s10_gcd, ratio = tbU51s10_ratio, par = tbU51s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var pr = pick(r, [0,1,2,3,4,5,6,7,8,9]);
    var k = pick(r, [0.2,0.25,0.4,0.5,0.6,0.75,0.8,0.9]);
    var L1 = ([0.8, 0.9, 0.4, 1.6, 0.9, 1, 2, 1.8, 1.2, 0.2][pr]);
    var L2 = ([0.2, 0.1, 0.1, 0.4, 0.4, 0.25, 0.5, 0.2, 0.3, 0.05][pr]);
    var rt = ([0.4, 0.3, 0.2, 0.8, 0.6, 0.5, 1, 0.6, 0.6, 0.1][pr]);
    var M = (Math.round((k * [0.4, 0.3, 0.2, 0.8, 0.6, 0.5, 1, 0.6, 0.6, 0.1][pr]) * 1000) / 1000);
    var Lw = (Math.round(([0.8, 0.9, 0.4, 1.6, 0.9, 1, 2, 1.8, 1.2, 0.2][pr] + [0.2, 0.1, 0.1, 0.4, 0.4, 0.25, 0.5, 0.2, 0.3, 0.05][pr] - 2 * k * [0.4, 0.3, 0.2, 0.8, 0.6, 0.5, 1, 0.6, 0.6, 0.1][pr]) * 1000) / 1000);
    var ok = (k);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s10_three4(ok, [{x: (M), why: "相互インダクタンス $M$ で止めた（結合係数を出していない）", w: 0, cut: 1}, {x: (2 * M), why: "$2M$ で止めた（2 で割っていない）", w: 1, cut: 1}, {x: (2 * M / rt), why: "$2M$ のまま結合係数の式に入れた", w: 2, cut: 1}, {x: (M / (L1 * L2)), why: "$\\sqrt{\\;}$ をとらなかった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s10sa", text: "自己インダクタンス $L_1 = " + qv(L1, "H") + "$ と $L_2 = " + qv(L2, "H") + "$ のコイルを、差動接続になるように直列につなぐと、合成インダクタンスは $" + qv(Lw, "H") + "$ でした。結合係数はいくらですか。", fig: {kind: "u51s10tc", L: tbU51s10_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","kc":"{k}"}, [["w2", "l"], ["l1", "{L}_1=" + fmt(L1) + " H"], ["l2", "{L}_2=" + fmt(L2) + " H"], ["lt", "{L}=" + fmt(Lw) + " H"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["差動 $" + fmt(Lw) + " = " + fmt(L1) + " + " + fmt(L2) + " - 2M$ より $M = " + qv(M, "H") + "$　この値を次に使う", "$k = \\dfrac{" + fmt(M) + "}{\\sqrt{" + fmt(L1) + " \\times " + fmt(L2) + "}} = \\dfrac{" + fmt(M) + "}{" + fmt(rt) + "} = " + qv(ok, "1") + "$"], chk: {form: "u51s10sa", p: {L1: L1, L2: L2, rt: rt, Lw: Lw}}};
  }
  throw new Error("u51s10sa：条件に合う数字が見つからない");
}
function tbU51s10_Qmh(r){
  var gcd = tbU51s10_gcd, ratio = tbU51s10_ratio, par = tbU51s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var pr = pick(r, [0,1,2,3,4,5,6,7,8]);
    var k = pick(r, [0.2,0.25,0.4,0.5,0.6,0.75,0.8,0.9]);
    var L1 = ([40, 90, 80, 160, 90, 100, 200, 180, 120][pr]);
    var L2 = ([10, 10, 20, 40, 40, 25, 50, 20, 30][pr]);
    var rt = ([20, 30, 40, 80, 60, 50, 100, 60, 60][pr]);
    var M = (Math.round((k * [20, 30, 40, 80, 60, 50, 100, 60, 60][pr]) * 1000) / 1000);
    var Lw = (Math.round(([40, 90, 80, 160, 90, 100, 200, 180, 120][pr] + [10, 10, 20, 40, 40, 25, 50, 20, 30][pr] + 2 * k * [20, 30, 40, 80, 60, 50, 100, 60, 60][pr]) * 1000) / 1000);
    var ok = (k);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s10_three4(ok, [{x: (M), why: "相互インダクタンス $M$ で止めた（結合係数を出していない）", w: 0, cut: 1}, {x: (2 * M), why: "$2M$ で止めた（2 で割っていない）", w: 1, cut: 1}, {x: (2 * M / rt), why: "$2M$ のまま結合係数の式に入れた", w: 2, cut: 1}, {x: (M / (L1 * L2)), why: "$\\sqrt{\\;}$ をとらなかった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s10mh", text: "自己インダクタンス $L_1 = " + fmt(L1) + "\\,\\mathrm{mH}" + "$ と $L_2 = " + fmt(L2) + "\\,\\mathrm{mH}" + "$ のコイルを、和動接続になるように直列につなぐと、合成インダクタンスは $" + fmt(Lw) + "\\,\\mathrm{mH}" + "$ でした。結合係数はいくらですか。", fig: {kind: "u51s10tc", L: tbU51s10_fig({"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","kc":"{k}"}, [["l1", "{L}_1=" + fmt(L1) + " mH"], ["l2", "{L}_2=" + fmt(L2) + " mH"], ["lt", "{L}=" + fmt(Lw) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["和動 $" + fmt(Lw) + " = " + fmt(L1) + " + " + fmt(L2) + " + 2M$ より $M = " + fmt(M) + "\\,\\mathrm{mH}" + "$　この値を次に使う", "$k = \\dfrac{" + fmt(M) + "}{\\sqrt{" + fmt(L1) + " \\times " + fmt(L2) + "}} = \\dfrac{" + fmt(M) + "}{" + fmt(rt) + "} = " + qv(ok, "1") + "$"], chk: {form: "u51s10mh", p: {L1: L1, L2: L2, rt: rt, Lw: Lw}}};
  }
  throw new Error("u51s10mh：条件に合う数字が見つからない");
}
// 51-11 導体棒の起電力から電流 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s11.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s11_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s11_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s11_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s11_par(a, b){ return a * b / (a + b); }
function tbU51s11_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s11_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s11_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s11_threen(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s11_three4n(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU51s11_Qi(r){
  var gcd = tbU51s11_gcd, ratio = tbU51s11_ratio, par = tbU51s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var B = pick(r, [0.1,0.2,0.4,0.5,0.8,1]);
    var l = pick(r, [0.1,0.2,0.4,0.5,1]);
    var v = pick(r, [1,2,4,5,10,20]);
    var R = pick(r, [1,2,4,5,10,20]);
    var E = (B * l * v);
    var I = (B * l * v / R);
    if (!(I >= 0.1 && I <= 20 && E <= 100 && Math.abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s11_three4(ok, [{x: (E), why: "誘導起電力で止めた（抵抗で割っていない）", w: 0, cut: 1}, {x: (B * l / R), why: "速さを掛けていない（誘導起電力を出していない）", w: 1, cut: 1}, {x: (B * v / R), why: "長さを掛けていない（誘導起電力を出していない）", w: 2, cut: 1}, {x: (E * R), why: "抵抗で割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s11i", text: "図のように、磁束密度 $" + qv(B, "T") + "$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体棒を $" + fmt(v) + "\\,\\mathrm{m/s}$ で動かします。レールの端に $" + qv(R, "O") + "$ の抵抗があります。抵抗の電流は何 A ですか。", fig: {kind: "u51s11rl", L: tbU51s11_fig({"r":"{R}","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}","v":"{v}","va":"right","l":"{l}"}, [["b", "{B}=" + qf(B, "T")], ["l", "{l}=" + fmt(l) + " m"], ["v", fmt(v) + " m/s"], ["r", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = Blv = " + fmt(B) + " \\times " + fmt(l) + " \\times " + fmt(v) + " = " + qv(E, "V") + "$　この値を次に使う", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R) + "} = " + qv(ok, "A") + "$"], chk: {form: "u51s11i", p: {B: B, l: l, v: v, R: R}}};
  }
  throw new Error("u51s11i：条件に合う数字が見つからない");
}
function tbU51s11_Qma(r){
  var gcd = tbU51s11_gcd, ratio = tbU51s11_ratio, par = tbU51s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var B = pick(r, [0.01,0.02,0.05,0.1,0.2]);
    var l = pick(r, [0.1,0.2,0.5,1]);
    var v = pick(r, [1,2,5,10]);
    var R = pick(r, [1,2,5,10,20,50,100]);
    var E = (B * l * v);
    var I = (B * l * v / R * 1000);
    if (!(I >= 1 && I <= 500 && I < 1000 && Math.abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s11_three4(ok, [{x: (E), why: "誘導起電力で止めた（抵抗で割っていない）", w: 0, cut: 1}, {x: (B * l / R * 1000), why: "速さを掛けていない（誘導起電力を出していない）", w: 1, cut: 1}, {x: (B * l * v / R), why: "A を mA に直していない", w: 2, cut: 0}, {x: (E * R * 1000), why: "抵抗で割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "mA", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s11ma", text: "図のように、磁束密度 $" + qv(B, "T") + "$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体棒を $" + fmt(v) + "\\,\\mathrm{m/s}$ で動かします。レールの端に $" + qv(R, "O") + "$ の抵抗があります。抵抗の電流は何 mA ですか。", fig: {kind: "u51s11rl", L: tbU51s11_fig({"r":"{R}","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}","v":"{v}","va":"right","l":"{l}"}, [["b", "{B}=" + qf(B, "T")], ["l", "{l}=" + fmt(l) + " m"], ["v", fmt(v) + " m/s"], ["r", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = Blv = " + fmt(B) + " \\times " + fmt(l) + " \\times " + fmt(v) + " = " + qv(E, "V") + "$　この値を次に使う", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R) + "} = " + qv(I / 1000, "A") + " = " + qv(ok, "mA") + "$"], chk: {form: "u51s11ma", p: {B: B, l: l, v: v, R: R}}};
  }
  throw new Error("u51s11ma：条件に合う数字が見つからない");
}
function tbU51s11_Qdir(r){
  var gcd = tbU51s11_gcd, ratio = tbU51s11_ratio, par = tbU51s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var bk = pick(r, [0,1]);
    var vr = pick(r, [0,1]);
    var bss = (bk ? 'back' : 'front');
    var vas = (vr ? 'right' : 'left');
    var up = (bk == vr ? 1 : 0);
    var G = (up ? '導体棒の中は Q から P、抵抗の中は下向き' : '導体棒の中は P から Q、抵抗の中は上向き');
    var GV = (up ? 'QPd' : 'PQu');
    var RV = (up ? '導体棒の中は P から Q、抵抗の中は上向き' : '導体棒の中は Q から P、抵抗の中は下向き');
    var RVV = (up ? 'PQu' : 'QPd');
    var B1 = (up ? '導体棒の中は Q から P、抵抗の中は上向き' : '導体棒の中は P から Q、抵抗の中は下向き');
    var B1V = (up ? 'QPu' : 'PQd');
    var B2 = (up ? '導体棒の中は P から Q、抵抗の中は下向き' : '導体棒の中は Q から P、抵抗の中は上向き');
    var B2V = (up ? 'PQd' : 'QPu');
    var RD = (up ? 'Q から P' : 'P から Q');
    var AD = (up ? '下向き' : '上向き');
    var _c = choices(r, [{t: String(G), v: String(GV)}, {t: String(RV), v: String(RVV), why: "フレミングの右手の法則の向きを逆にした（中指が起電力の向き）"}, {t: String(B1), v: String(B1V), why: "導体棒の向きで止めた。電流は一周するので、抵抗の中では逆に回る"}, {t: String(B2), v: String(B2V), why: "導体棒の向きを逆にした（抵抗の向きと一周にならない）"}]);
    return {form: "u51s11dir", text: "図のように、導体棒を動かしました。導体棒の中と、抵抗の中の電流の向きの組はどれですか。", fig: {kind: "u51s11rl", L: tbU51s11_fig({"r":"{R}","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}","v":"{v}","va":"right","l":"{l}"}, [["bs", String(bss)], ["va", String(vas)], ["i", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["フレミングの右手の法則（人差し指＝磁界・親指＝運動）で、導体棒の中は " + String(RD) + "　この向きを次に使う", "電流は一周するので、抵抗の中は " + String(AD)], chk: {form: "u51s11dir", p: {bk: bk, vr: vr}}};
  }
  throw new Error("u51s11dir：条件に合う数字が見つからない");
}
function tbU51s11_Qsgn(r){
  var gcd = tbU51s11_gcd, ratio = tbU51s11_ratio, par = tbU51s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var B = pick(r, [0.1,0.2,0.4,0.5,0.8,1]);
    var l = pick(r, [0.1,0.2,0.4,0.5,1]);
    var v = pick(r, [1,2,4,5,10,20]);
    var R = pick(r, [1,2,4,5,10,20]);
    var bk = pick(r, [0,1]);
    var vr = pick(r, [0,1]);
    var bss = (bk ? 'back' : 'front');
    var vas = (vr ? 'right' : 'left');
    var sg = (bk == vr ? -1 : 1);
    var E = (B * l * v);
    var I = (B * l * v / R);
    if (!(I >= 0.1 && I <= 20 && E <= 100 && Math.abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (sg * I);
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s11_three4n(ok, [{x: (-sg * I), why: "向きを逆に取った（抵抗の中は導体棒の中と逆に回る）", w: 0, cut: 0}, {x: (sg * E), why: "誘導起電力で止めた（抵抗で割っていない）", w: 1, cut: 1}, {x: (sg * B * l / R), why: "速さを掛けていない（誘導起電力を出していない）", w: 2, cut: 1}, {x: (sg * E * R), why: "抵抗で割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s11sgn", text: "図のように、磁束密度 $" + qv(B, "T") + "$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体棒を $" + fmt(v) + "\\,\\mathrm{m/s}$ で動かします。図の矢印の向きを正として、抵抗 $" + qv(R, "O") + "$ の電流は何 A ですか。", fig: {kind: "u51s11rl", L: tbU51s11_fig({"r":"{R}","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}","v":"{v}","va":"right","l":"{l}"}, [["b", "{B}=" + qf(B, "T")], ["l", "{l}=" + fmt(l) + " m"], ["v", fmt(v) + " m/s"], ["r", "{R}=" + qf(R, "O")], ["bs", String(bss)], ["va", String(vas)], ["ia", "up"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = Blv = " + qv(E, "V") + "$、$I = \\dfrac{" + fmt(E) + "}{" + fmt(R) + "} = " + qv(I, "A") + "$　大きさを次に使う", "抵抗の中は" + String(sg > 0 ? '上向き＝矢印と同じ' : '下向き＝矢印と逆') + "なので $" + qv(ok, "A") + "$"], chk: {form: "u51s11sgn", p: {B: B, l: l, v: v, R: R, bk: bk, vr: vr}}};
  }
  throw new Error("u51s11sgn：条件に合う数字が見つからない");
}
function tbU51s11_Qv(r){
  var gcd = tbU51s11_gcd, ratio = tbU51s11_ratio, par = tbU51s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var B = pick(r, [0.1,0.2,0.4,0.5,0.8,1]);
    var l = pick(r, [0.1,0.2,0.4,0.5,1]);
    var v = pick(r, [1,2,4,5,10,20]);
    var R = pick(r, [1,2,4,5,10,20]);
    var E = (B * l * v);
    var I = (Math.round(B * l * v / R * 1000) / 1000);
    if (!(I >= 0.1 && I <= 20 && E <= 100 && Math.abs((B * l * v / R) * 10 - Math.round((B * l * v / R) * 10)) < 1e-9)) continue;
    var ok = (v);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU51s11_three4(ok, [{x: (I * R), why: "誘導起電力で止めた（磁束密度と長さで割っていない）", w: 0, cut: 1}, {x: (I / (B * l)), why: "抵抗を掛けていない（誘導起電力を出していない）", w: 1, cut: 1}, {x: (I * R * B * l), why: "割るところを掛けた", w: 2, cut: 0}, {x: (I * R / B), why: "長さで割っていない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u51s11v", text: "図のように、磁束密度 $" + qv(B, "T") + "$ の磁界の中で、長さ $" + fmt(l) + "\\,\\mathrm{m}$ の導体棒を動かすと、レールの端の $" + qv(R, "O") + "$ の抵抗に $" + qv(I, "A") + "$ の電流が流れました。導体棒の速さは何 m/s ですか。", fig: {kind: "u51s11rl", L: tbU51s11_fig({"r":"{R}","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}","v":"{v}","va":"right","l":"{l}"}, [["b", "{B}=" + qf(B, "T")], ["l", "{l}=" + fmt(l) + " m"], ["v", "{v}"], ["r", "{R}=" + qf(R, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$e = RI = " + fmt(R) + " \\times " + fmt(I) + " = " + qv(I * R, "V") + "$　この値を次に使う", "$v = \\dfrac{e}{Bl} = \\dfrac{" + fmt(I * R) + "}{" + fmt(B) + " \\times " + fmt(l) + "} = " + fmt(ok) + "\\,\\mathrm{m/s}$"], chk: {form: "u51s11v", p: {B: B, l: l, R: R, I: I}}};
  }
  throw new Error("u51s11v：条件に合う数字が見つからない");
}
// 51-12 単位を式から出す（磁気） の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s12.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s12_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s12_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s12_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s12_par(a, b){ return a * b / (a + b); }
function tbU51s12_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s12_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s12_Qone(r){
  var gcd = tbU51s12_gcd, ratio = tbU51s12_ratio, par = tbU51s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1,2,3,4]);
    var QT = (["自己インダクタンスの単位 H を、Wb と A で表すとどれですか。", "自己インダクタンスの単位 H を、V と s と A で表すとどれですか。", "磁束密度の単位 T を、Wb と m で表すとどれですか。", "磁気抵抗の単位 A/Wb と同じ単位はどれですか。", "磁束の単位 Wb を、H と A で表すとどれですか。"][k]);
    var C = (["$\\mathrm{Wb/A}$", "$\\mathrm{V} \\cdot \\mathrm{s/A}$", "$\\mathrm{Wb/m^2}$", "$\\mathrm{H^{-1}}$", "$\\mathrm{H} \\cdot \\mathrm{A}$"][k]);
    var W1 = (["$\\mathrm{A/Wb}$", "$\\mathrm{V}/(\\mathrm{A} \\cdot \\mathrm{s})$", "$\\mathrm{Wb} \\cdot \\mathrm{m^2}$", "$\\mathrm{H}$", "$\\mathrm{H/A}$"][k]);
    var R1 = (["$L = \\dfrac{N \\Phi}{I}$ から $\\mathrm{Wb/A}$（24-2）。$\\mathrm{A/Wb}$ は磁気抵抗の単位（23-4）", "$e = L \\dfrac{\\Delta I}{\\Delta t}$ から $L = \\dfrac{e \\Delta t}{\\Delta I}$。時間は掛ける（24-1）", "$B = \\dfrac{\\Phi}{S}$。面積で割る（19-5）", "$R_m = \\dfrac{l}{\\mu S}$ から H の逆数（23-4）", "$LI = N \\Phi$ から $\\mathrm{H} \\cdot \\mathrm{A}$。電流は掛ける（24-2）"][k]);
    var W2 = (["$\\mathrm{Wb} \\cdot \\mathrm{A}$", "$\\mathrm{V} \\cdot \\mathrm{A/s}$", "$\\mathrm{Wb/m}$", "$\\mathrm{Wb/A}$", "$\\mathrm{A/H}$"][k]);
    var R2 = (["$L = \\dfrac{N \\Phi}{I}$ は電流で割る（24-2）", "$L = \\dfrac{e \\Delta t}{\\Delta I}$。電流で割る（24-1）", "$B = \\dfrac{\\Phi}{S}$ の $S$ は面積（$\\mathrm{m^2}$）（19-5）", "$R_m = \\dfrac{NI}{\\Phi}$ から $\\mathrm{A/Wb}$。$\\mathrm{Wb/A}$ は H と同じ（23-4・24-2）", "$LI = N \\Phi$ から $\\mathrm{H} \\cdot \\mathrm{A}$（24-2）"][k]);
    var W3 = (["$\\mathrm{Wb}$", "$\\mathrm{V} \\cdot \\mathrm{s}$", "$\\mathrm{Wb}$", "$\\mathrm{H/m}$", "$\\mathrm{H}$"][k]);
    var R3 = (["$L = \\dfrac{N \\Phi}{I}$ の電流を落とした（24-2）", "$L = \\dfrac{e \\Delta t}{\\Delta I}$ の電流を落とした（24-1）", "$B = \\dfrac{\\Phi}{S}$ の面積を落とした（19-5）", "$\\mathrm{H/m}$ は透磁率の単位（19-3）", "$LI = N \\Phi$ の電流を落とした（24-2）"][k]);
    var _c = choices(r, [{t: String(C), v: "ok"}, {t: String(W1), v: "w1", why: String(R1)}, {t: String(W2), v: "w2", why: String(R2)}, {t: String(W3), v: "w3", why: String(R3)}]);
    return {form: "u51s12one", text: String(QT), fig: null, ch: _c.ch, ans: _c.ans, ex: ["式の量を単位に置き換える（巻数は単位なし）", "答え " + String(C)], chk: {form: "u51s12one", p: {k: k}}};
  }
  throw new Error("u51s12one：条件に合う数字が見つからない");
}
function tbU51s12_Qpair(r){
  var gcd = tbU51s12_gcd, ratio = tbU51s12_ratio, par = tbU51s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [0,1,2,3,4,5]);
    var t1 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var t2 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var t3 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var SF = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V/s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{A/Wb}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb} \\cdot \\mathrm{m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H}$ と同じ", "透磁率の単位は $\\mathrm{H} \\cdot \\mathrm{m}$", "磁界の強さの単位は $\\mathrm{A} \\cdot \\mathrm{m}$"][f]);
    var WF = (["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ から $\\mathrm{V} \\cdot \\mathrm{s}$（22-3）", "$L = \\dfrac{N \\Phi}{I}$ から $\\mathrm{Wb/A}$（24-2）", "$B = \\dfrac{\\Phi}{S}$ から $\\mathrm{Wb/m^2}$（19-5）", "H の逆数 $\\mathrm{H^{-1}}$ と同じ（23-4）", "透磁率は $\\mathrm{H/m}$（19-3）", "磁界の強さは $\\mathrm{A/m}$（19-1）"][f]);
    var S1 = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V} \\cdot \\mathrm{s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{Wb/A}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb/m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H^{-1}}$ と同じ", "透磁率の単位は $\\mathrm{H/m}$", "磁界の強さの単位は $\\mathrm{A/m}$", "静電容量の単位 $\\mathrm{F}$ は $\\mathrm{C/V}$ と同じ", "電力の単位 $\\mathrm{W}$ は $\\mathrm{J/s}$ と同じ", "抵抗率の単位は $\\Omega \\cdot \\mathrm{m}$"][t1]);
    var S2 = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V} \\cdot \\mathrm{s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{Wb/A}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb/m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H^{-1}}$ と同じ", "透磁率の単位は $\\mathrm{H/m}$", "磁界の強さの単位は $\\mathrm{A/m}$", "静電容量の単位 $\\mathrm{F}$ は $\\mathrm{C/V}$ と同じ", "電力の単位 $\\mathrm{W}$ は $\\mathrm{J/s}$ と同じ", "抵抗率の単位は $\\Omega \\cdot \\mathrm{m}$"][t2]);
    var S3 = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V} \\cdot \\mathrm{s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{Wb/A}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb/m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H^{-1}}$ と同じ", "透磁率の単位は $\\mathrm{H/m}$", "磁界の強さの単位は $\\mathrm{A/m}$", "静電容量の単位 $\\mathrm{F}$ は $\\mathrm{C/V}$ と同じ", "電力の単位 $\\mathrm{W}$ は $\\mathrm{J/s}$ と同じ", "抵抗率の単位は $\\Omega \\cdot \\mathrm{m}$"][t3]);
    var W1 = (["正しい（$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$・22-3）", "正しい（$L = \\dfrac{N \\Phi}{I}$・24-2）", "正しい（$B = \\dfrac{\\Phi}{S}$・19-5）", "正しい（23-4）", "正しい（19-3）", "正しい（19-1）", "正しい（$C = \\dfrac{Q}{V}$・17-1）", "正しい（12-1）", "正しい（6-2）"][t1]);
    var W2 = (["正しい（$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$・22-3）", "正しい（$L = \\dfrac{N \\Phi}{I}$・24-2）", "正しい（$B = \\dfrac{\\Phi}{S}$・19-5）", "正しい（23-4）", "正しい（19-3）", "正しい（19-1）", "正しい（$C = \\dfrac{Q}{V}$・17-1）", "正しい（12-1）", "正しい（6-2）"][t2]);
    var W3 = (["正しい（$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$・22-3）", "正しい（$L = \\dfrac{N \\Phi}{I}$・24-2）", "正しい（$B = \\dfrac{\\Phi}{S}$・19-5）", "正しい（23-4）", "正しい（19-3）", "正しい（19-1）", "正しい（$C = \\dfrac{Q}{V}$・17-1）", "正しい（12-1）", "正しい（6-2）"][t3]);
    if (!(t1 < t2 && t2 < t3)) continue;
    var _c = choices(r, [{t: String(SF), v: "f" + fmt(f)}, {t: String(S1), v: "t" + fmt(t1), why: String(W1)}, {t: String(S2), v: "t" + fmt(t2), why: String(W2)}, {t: String(S3), v: "t" + fmt(t3), why: String(W3)}]);
    return {form: "u51s12pair", text: "次のうち、量と単位の組で、誤っているものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["式の量を単位に置き換えて確かめる", "誤り：" + String(WF)], chk: {form: "u51s12pair", p: {f: f, t1: t1, t2: t2, t3: t3}}};
  }
  throw new Error("u51s12pair：条件に合う数字が見つからない");
}
function tbU51s12_Qright(r){
  var gcd = tbU51s12_gcd, ratio = tbU51s12_ratio, par = tbU51s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t = pick(r, [0,1,2,3,4,5,6,7,8]);
    var f1 = pick(r, [0,1,2,3,4,5]);
    var f2 = pick(r, [0,1,2,3,4,5]);
    var f3 = pick(r, [0,1,2,3,4,5]);
    var ST = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V} \\cdot \\mathrm{s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{Wb/A}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb/m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H^{-1}}$ と同じ", "透磁率の単位は $\\mathrm{H/m}$", "磁界の強さの単位は $\\mathrm{A/m}$", "静電容量の単位 $\\mathrm{F}$ は $\\mathrm{C/V}$ と同じ", "電力の単位 $\\mathrm{W}$ は $\\mathrm{J/s}$ と同じ", "抵抗率の単位は $\\Omega \\cdot \\mathrm{m}$"][t]);
    var WT = (["正しい（$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$・22-3）", "正しい（$L = \\dfrac{N \\Phi}{I}$・24-2）", "正しい（$B = \\dfrac{\\Phi}{S}$・19-5）", "正しい（23-4）", "正しい（19-3）", "正しい（19-1）", "正しい（$C = \\dfrac{Q}{V}$・17-1）", "正しい（12-1）", "正しい（6-2）"][t]);
    var F1 = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V/s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{A/Wb}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb} \\cdot \\mathrm{m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H}$ と同じ", "透磁率の単位は $\\mathrm{H} \\cdot \\mathrm{m}$", "磁界の強さの単位は $\\mathrm{A} \\cdot \\mathrm{m}$"][f1]);
    var F2 = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V/s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{A/Wb}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb} \\cdot \\mathrm{m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H}$ と同じ", "透磁率の単位は $\\mathrm{H} \\cdot \\mathrm{m}$", "磁界の強さの単位は $\\mathrm{A} \\cdot \\mathrm{m}$"][f2]);
    var F3 = (["磁束の単位 $\\mathrm{Wb}$ は $\\mathrm{V/s}$ と同じ", "自己インダクタンスの単位 $\\mathrm{H}$ は $\\mathrm{A/Wb}$ と同じ", "磁束密度の単位 $\\mathrm{T}$ は $\\mathrm{Wb} \\cdot \\mathrm{m^2}$ と同じ", "磁気抵抗の単位 $\\mathrm{A/Wb}$ は $\\mathrm{H}$ と同じ", "透磁率の単位は $\\mathrm{H} \\cdot \\mathrm{m}$", "磁界の強さの単位は $\\mathrm{A} \\cdot \\mathrm{m}$"][f3]);
    var X1 = (["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ から $\\mathrm{V} \\cdot \\mathrm{s}$（22-3）", "$L = \\dfrac{N \\Phi}{I}$ から $\\mathrm{Wb/A}$（24-2）", "$B = \\dfrac{\\Phi}{S}$ から $\\mathrm{Wb/m^2}$（19-5）", "H の逆数 $\\mathrm{H^{-1}}$ と同じ（23-4）", "透磁率は $\\mathrm{H/m}$（19-3）", "磁界の強さは $\\mathrm{A/m}$（19-1）"][f1]);
    var X2 = (["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ から $\\mathrm{V} \\cdot \\mathrm{s}$（22-3）", "$L = \\dfrac{N \\Phi}{I}$ から $\\mathrm{Wb/A}$（24-2）", "$B = \\dfrac{\\Phi}{S}$ から $\\mathrm{Wb/m^2}$（19-5）", "H の逆数 $\\mathrm{H^{-1}}$ と同じ（23-4）", "透磁率は $\\mathrm{H/m}$（19-3）", "磁界の強さは $\\mathrm{A/m}$（19-1）"][f2]);
    var X3 = (["$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ から $\\mathrm{V} \\cdot \\mathrm{s}$（22-3）", "$L = \\dfrac{N \\Phi}{I}$ から $\\mathrm{Wb/A}$（24-2）", "$B = \\dfrac{\\Phi}{S}$ から $\\mathrm{Wb/m^2}$（19-5）", "H の逆数 $\\mathrm{H^{-1}}$ と同じ（23-4）", "透磁率は $\\mathrm{H/m}$（19-3）", "磁界の強さは $\\mathrm{A/m}$（19-1）"][f3]);
    if (!(f1 < f2 && f2 < f3)) continue;
    var _c = choices(r, [{t: String(ST), v: "t" + fmt(t)}, {t: String(F1), v: "f" + fmt(f1), why: String(X1)}, {t: String(F2), v: "f" + fmt(f2), why: String(X2)}, {t: String(F3), v: "f" + fmt(f3), why: String(X3)}]);
    return {form: "u51s12right", text: "次のうち、量と単位の組で、正しいものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["式の量を単位に置き換えて確かめる", String(WT)], chk: {form: "u51s12right", p: {t: t, f1: f1, f2: f2, f3: f3}}};
  }
  throw new Error("u51s12right：条件に合う数字が見つからない");
}
// 51-13 文の正誤（磁界・電磁力・電磁誘導） の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s13.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s13_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s13_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s13_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s13_par(a, b){ return a * b / (a + b); }
function tbU51s13_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s13_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s13_Qwrong(r){
  var gcd = tbU51s13_gcd, ratio = tbU51s13_ratio, par = tbU51s13_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [0,1,2,3,4,5,6,7,8]);
    var t1 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var t2 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var t3 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var SF = (["平行な2本の導体に働く力は、導体の間の距離の2乗に反比例する", "直線の導体のまわりの磁界の強さは、導体からの距離の2乗に反比例する", "フレミングの左手の法則で、中指は力の向きを表す", "磁束は、まわりの物質の透磁率に影響される", "円形コイルの中心の磁界の強さは、コイルの半径に比例する", "コイルに鎖交する磁束が変わると、その変化を強める向きに起電力が生じる", "導体棒の誘導起電力の向きは、フレミングの左手の法則で求める", "電磁力の大きさは、導体の長さに反比例する", "誘導起電力の大きさは、磁束が変わるまでの時間に関係しない"][f]);
    var WF = (["力は距離に反比例する（21-5）", "$H = \\dfrac{I}{2 \\pi r}$ で、距離に反比例する（20-2）", "中指は電流の向き。力は親指（21-2）", "磁束は透磁率に影響されない。影響されるのは磁力線（19-5）", "$H = \\dfrac{NI}{2r}$ で、半径に反比例する（20-3）", "変化を妨げる向きに生じる（22-1）", "起電力は右手の法則。左手は電磁力（22-5・22-6）", "$F = BIl$ で、長さに比例する（21-3）", "短い時間で変わるほど大きい（22-3）"][f]);
    var S1 = (["直線の導体のまわりの磁界の強さは、導体からの距離に反比例する", "フレミングの左手の法則で、親指は力の向きを表す", "磁力線の密度は、その点の磁界の強さを表す", "磁束は N 極から出て、S 極に入る", "円形コイルの中心の磁界の強さは、コイルの半径に反比例する", "電磁力の大きさは、磁束密度と電流と導体の長さに比例する", "コイルに鎖交する磁束が変わると、その変化を妨げる向きに起電力が生じる", "誘導起電力の大きさは、コイルの巻数に比例する", "導体棒の誘導起電力の向きは、フレミングの右手の法則で求める", "磁束は、まわりの物質の透磁率に影響されない", "導体が磁界と斜めの時、電磁力に関係するのは、電流のうち磁界と垂直な成分だけである", "右手の親指を電流の向きに向けると、4本の指の巻く向きが磁界の向きである"][t1]);
    var S2 = (["直線の導体のまわりの磁界の強さは、導体からの距離に反比例する", "フレミングの左手の法則で、親指は力の向きを表す", "磁力線の密度は、その点の磁界の強さを表す", "磁束は N 極から出て、S 極に入る", "円形コイルの中心の磁界の強さは、コイルの半径に反比例する", "電磁力の大きさは、磁束密度と電流と導体の長さに比例する", "コイルに鎖交する磁束が変わると、その変化を妨げる向きに起電力が生じる", "誘導起電力の大きさは、コイルの巻数に比例する", "導体棒の誘導起電力の向きは、フレミングの右手の法則で求める", "磁束は、まわりの物質の透磁率に影響されない", "導体が磁界と斜めの時、電磁力に関係するのは、電流のうち磁界と垂直な成分だけである", "右手の親指を電流の向きに向けると、4本の指の巻く向きが磁界の向きである"][t2]);
    var S3 = (["直線の導体のまわりの磁界の強さは、導体からの距離に反比例する", "フレミングの左手の法則で、親指は力の向きを表す", "磁力線の密度は、その点の磁界の強さを表す", "磁束は N 極から出て、S 極に入る", "円形コイルの中心の磁界の強さは、コイルの半径に反比例する", "電磁力の大きさは、磁束密度と電流と導体の長さに比例する", "コイルに鎖交する磁束が変わると、その変化を妨げる向きに起電力が生じる", "誘導起電力の大きさは、コイルの巻数に比例する", "導体棒の誘導起電力の向きは、フレミングの右手の法則で求める", "磁束は、まわりの物質の透磁率に影響されない", "導体が磁界と斜めの時、電磁力に関係するのは、電流のうち磁界と垂直な成分だけである", "右手の親指を電流の向きに向けると、4本の指の巻く向きが磁界の向きである"][t3]);
    var W1 = (["正しい文（20-2）", "正しい文（21-2）", "正しい文（19-4）", "正しい文（19-5）", "正しい文（20-3）", "正しい文（21-3）", "正しい文（22-1）", "正しい文（22-3）", "正しい文（22-5）", "正しい文（19-5）", "正しい文（21-4）", "正しい文（20-1）"][t1]);
    var W2 = (["正しい文（20-2）", "正しい文（21-2）", "正しい文（19-4）", "正しい文（19-5）", "正しい文（20-3）", "正しい文（21-3）", "正しい文（22-1）", "正しい文（22-3）", "正しい文（22-5）", "正しい文（19-5）", "正しい文（21-4）", "正しい文（20-1）"][t2]);
    var W3 = (["正しい文（20-2）", "正しい文（21-2）", "正しい文（19-4）", "正しい文（19-5）", "正しい文（20-3）", "正しい文（21-3）", "正しい文（22-1）", "正しい文（22-3）", "正しい文（22-5）", "正しい文（19-5）", "正しい文（21-4）", "正しい文（20-1）"][t3]);
    if (!(t1 < t2 && t2 < t3)) continue;
    var _c = choices(r, [{t: String(SF), v: "f" + fmt(f)}, {t: String(S1), v: "t" + fmt(t1), why: String(W1)}, {t: String(S2), v: "t" + fmt(t2), why: String(W2)}, {t: String(S3), v: "t" + fmt(t3), why: String(W3)}]);
    return {form: "u51s13wrong", text: "次のうち、誤っているものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["文を1つずつ、習った式・決まりと照らす", "誤り：" + String(WF)], chk: {form: "u51s13wrong", p: {f: f, t1: t1, t2: t2, t3: t3}}};
  }
  throw new Error("u51s13wrong：条件に合う数字が見つからない");
}
function tbU51s13_Qright(r){
  var gcd = tbU51s13_gcd, ratio = tbU51s13_ratio, par = tbU51s13_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var f1 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var f2 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var f3 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var ST = (["直線の導体のまわりの磁界の強さは、導体からの距離に反比例する", "フレミングの左手の法則で、親指は力の向きを表す", "磁力線の密度は、その点の磁界の強さを表す", "磁束は N 極から出て、S 極に入る", "円形コイルの中心の磁界の強さは、コイルの半径に反比例する", "電磁力の大きさは、磁束密度と電流と導体の長さに比例する", "コイルに鎖交する磁束が変わると、その変化を妨げる向きに起電力が生じる", "誘導起電力の大きさは、コイルの巻数に比例する", "導体棒の誘導起電力の向きは、フレミングの右手の法則で求める", "磁束は、まわりの物質の透磁率に影響されない", "導体が磁界と斜めの時、電磁力に関係するのは、電流のうち磁界と垂直な成分だけである", "右手の親指を電流の向きに向けると、4本の指の巻く向きが磁界の向きである"][t]);
    var WT = (["正しい文（20-2）", "正しい文（21-2）", "正しい文（19-4）", "正しい文（19-5）", "正しい文（20-3）", "正しい文（21-3）", "正しい文（22-1）", "正しい文（22-3）", "正しい文（22-5）", "正しい文（19-5）", "正しい文（21-4）", "正しい文（20-1）"][t]);
    var F1 = (["平行な2本の導体に働く力は、導体の間の距離の2乗に反比例する", "直線の導体のまわりの磁界の強さは、導体からの距離の2乗に反比例する", "フレミングの左手の法則で、中指は力の向きを表す", "磁束は、まわりの物質の透磁率に影響される", "円形コイルの中心の磁界の強さは、コイルの半径に比例する", "コイルに鎖交する磁束が変わると、その変化を強める向きに起電力が生じる", "導体棒の誘導起電力の向きは、フレミングの左手の法則で求める", "電磁力の大きさは、導体の長さに反比例する", "誘導起電力の大きさは、磁束が変わるまでの時間に関係しない"][f1]);
    var F2 = (["平行な2本の導体に働く力は、導体の間の距離の2乗に反比例する", "直線の導体のまわりの磁界の強さは、導体からの距離の2乗に反比例する", "フレミングの左手の法則で、中指は力の向きを表す", "磁束は、まわりの物質の透磁率に影響される", "円形コイルの中心の磁界の強さは、コイルの半径に比例する", "コイルに鎖交する磁束が変わると、その変化を強める向きに起電力が生じる", "導体棒の誘導起電力の向きは、フレミングの左手の法則で求める", "電磁力の大きさは、導体の長さに反比例する", "誘導起電力の大きさは、磁束が変わるまでの時間に関係しない"][f2]);
    var F3 = (["平行な2本の導体に働く力は、導体の間の距離の2乗に反比例する", "直線の導体のまわりの磁界の強さは、導体からの距離の2乗に反比例する", "フレミングの左手の法則で、中指は力の向きを表す", "磁束は、まわりの物質の透磁率に影響される", "円形コイルの中心の磁界の強さは、コイルの半径に比例する", "コイルに鎖交する磁束が変わると、その変化を強める向きに起電力が生じる", "導体棒の誘導起電力の向きは、フレミングの左手の法則で求める", "電磁力の大きさは、導体の長さに反比例する", "誘導起電力の大きさは、磁束が変わるまでの時間に関係しない"][f3]);
    var X1 = (["力は距離に反比例する（21-5）", "$H = \\dfrac{I}{2 \\pi r}$ で、距離に反比例する（20-2）", "中指は電流の向き。力は親指（21-2）", "磁束は透磁率に影響されない。影響されるのは磁力線（19-5）", "$H = \\dfrac{NI}{2r}$ で、半径に反比例する（20-3）", "変化を妨げる向きに生じる（22-1）", "起電力は右手の法則。左手は電磁力（22-5・22-6）", "$F = BIl$ で、長さに比例する（21-3）", "短い時間で変わるほど大きい（22-3）"][f1]);
    var X2 = (["力は距離に反比例する（21-5）", "$H = \\dfrac{I}{2 \\pi r}$ で、距離に反比例する（20-2）", "中指は電流の向き。力は親指（21-2）", "磁束は透磁率に影響されない。影響されるのは磁力線（19-5）", "$H = \\dfrac{NI}{2r}$ で、半径に反比例する（20-3）", "変化を妨げる向きに生じる（22-1）", "起電力は右手の法則。左手は電磁力（22-5・22-6）", "$F = BIl$ で、長さに比例する（21-3）", "短い時間で変わるほど大きい（22-3）"][f2]);
    var X3 = (["力は距離に反比例する（21-5）", "$H = \\dfrac{I}{2 \\pi r}$ で、距離に反比例する（20-2）", "中指は電流の向き。力は親指（21-2）", "磁束は透磁率に影響されない。影響されるのは磁力線（19-5）", "$H = \\dfrac{NI}{2r}$ で、半径に反比例する（20-3）", "変化を妨げる向きに生じる（22-1）", "起電力は右手の法則。左手は電磁力（22-5・22-6）", "$F = BIl$ で、長さに比例する（21-3）", "短い時間で変わるほど大きい（22-3）"][f3]);
    if (!(f1 < f2 && f2 < f3)) continue;
    var _c = choices(r, [{t: String(ST), v: "t" + fmt(t)}, {t: String(F1), v: "f" + fmt(f1), why: String(X1)}, {t: String(F2), v: "f" + fmt(f2), why: String(X2)}, {t: String(F3), v: "f" + fmt(f3), why: String(X3)}]);
    return {form: "u51s13right", text: "次のうち、正しいものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["文を1つずつ、習った式・決まりと照らす", String(WT)], chk: {form: "u51s13right", p: {t: t, f1: f1, f2: f2, f3: f3}}};
  }
  throw new Error("u51s13right：条件に合う数字が見つからない");
}
function tbU51s13_Qblank(r){
  var gcd = tbU51s13_gcd, ratio = tbU51s13_ratio, par = tbU51s13_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1,2,3]);
    var QT = (["次の文の □ に入る語の組はどれですか。\n(ア) フレミングの左手の法則で、中指は □ の向きを表す。\n(イ) 人差し指は □ の向きを表す。", "次の文の □ に入る語の組はどれですか。\n(ア) 直線の導体のまわりの磁界の強さは、導体からの距離に □ する。\n(イ) 円形コイルの中心の磁界の強さは、コイルの半径に □ する。", "次の文の □ に入る語の組はどれですか。\n(ア) コイルに鎖交する磁束が変わると、その変化を □ 向きに起電力が生じる。\n(イ) 誘導起電力の大きさは、コイルの巻数に □ する。", "次の文の □ に入る語の組はどれですか。\n(ア) 電流を流して力を得る時の向きは、フレミングの □ の法則で求める。\n(イ) 導体を動かして起電力を得る時の向きは、フレミングの □ の法則で求める。"][k]);
    var C = (["(ア) 電流　(イ) 磁界", "(ア) 反比例　(イ) 反比例", "(ア) 妨げる　(イ) 比例", "(ア) 左手　(イ) 右手"][k]);
    var W1 = (["(ア) 力　(イ) 磁界", "(ア) 比例　(イ) 反比例", "(ア) 強める　(イ) 比例", "(ア) 右手　(イ) 左手"][k]);
    var R1 = (["中指は電流。力は親指（21-2）", "$H = \\dfrac{I}{2 \\pi r}$ で、距離に反比例（20-2）", "変化を妨げる向き（22-1）", "電気から運動は左手、運動から電気は右手（22-6）"][k]);
    var W2 = (["(ア) 電流　(イ) 力", "(ア) 反比例　(イ) 比例", "(ア) 妨げる　(イ) 反比例", "(ア) 左手　(イ) 左手"][k]);
    var R2 = (["人差し指は磁界。力は親指（21-2）", "$H = \\dfrac{NI}{2r}$ で、半径に反比例（20-3）", "$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ で、巻数に比例（22-3）", "起電力は右手の法則（22-5）"][k]);
    var W3 = (["(ア) 磁界　(イ) 電流", "(ア) 比例　(イ) 比例", "(ア) 強める　(イ) 反比例", "(ア) 右手　(イ) 右手"][k]);
    var R3 = (["中指から電・磁・力の順（21-2）", "どちらも距離・半径は分母（20-2・20-3）", "妨げる向き・巻数に比例（22-1・22-3）", "電磁力は左手の法則（21-2）"][k]);
    var _c = choices(r, [{t: String(C), v: "ok"}, {t: String(W1), v: "w1", why: String(R1)}, {t: String(W2), v: "w2", why: String(R2)}, {t: String(W3), v: "w3", why: String(R3)}]);
    return {form: "u51s13blank", text: String(QT), fig: null, ch: _c.ch, ans: _c.ans, ex: ["(ア)(イ) の文を、習った式・決まりと照らす", "答え " + String(C)], chk: {form: "u51s13blank", p: {k: k}}};
  }
  throw new Error("u51s13blank：条件に合う数字が見つからない");
}
// 51-14 文の正誤（磁気回路・インダクタンス） の練習（※ textbook/gen/make_section.py が textbook/gen/data/u51_s14.py から作った。手で直さない（データを直して作り直す）。）
function tbU51s14_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU51s14_ratio(a){ var g = a.reduce(function(x, y){ return tbU51s14_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU51s14_par(a, b){ return a * b / (a + b); }
function tbU51s14_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU51s14_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU51s14_Qwrong(r){
  var gcd = tbU51s14_gcd, ratio = tbU51s14_ratio, par = tbU51s14_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [0,1,2,3,4,5,6,7,8]);
    var t1 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var t2 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var t3 = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var SF = (["磁気回路の起磁力は、電気回路の電流にあたる", "磁気抵抗は、鉄心の断面積に比例する", "磁気抵抗は、鉄心の透磁率に比例する", "自己インダクタンスは、巻数に比例する", "相互インダクタンスの最大は $L_1 + L_2$ である", "差動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流に比例する", "自己インダクタンスは、平均磁路長に比例する", "起磁力の単位は Wb である"][f]);
    var WF = (["起磁力は起電力（電圧）にあたる。電流にあたるのは磁束（23-3）", "$R_m = \\dfrac{l}{\\mu S}$ で、断面積に反比例する（23-2）", "$R_m = \\dfrac{l}{\\mu S}$ で、透磁率は分母（23-2）", "巻数の2乗に比例する（24-4）", "$M = k \\sqrt{L_1 L_2}$ で、最大は $k = 1$ の $\\sqrt{L_1 L_2}$（25-3）", "差動は $L_1 + L_2 - 2M$（25-4）", "$W = \\dfrac{1}{2} L I^2$ で、電流の2乗に比例する（25-5）", "$L = \\dfrac{\\mu S N^2}{l}$ で、長さは分母（24-3）", "起磁力 $NI$ の単位は A（23-1）"][f]);
    var S1 = (["磁気抵抗は、鉄心の断面積に反比例する", "磁気抵抗は、平均磁路長に比例する", "起磁力は、巻数と電流の積で表す", "磁気回路の起磁力は、電気回路の起電力にあたる", "磁気回路の磁束は、電気回路の電流にあたる", "自己インダクタンスは、巻数の2乗に比例する", "相互インダクタンスの最大は $\\sqrt{L_1 L_2}$ である", "和動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流の2乗に比例する", "自己インダクタンスは、鉄心の透磁率に比例する", "エアギャップのある磁気回路は、鉄心とエアギャップの磁気抵抗の直列とみなす", "磁気抵抗の単位 A/Wb は、H の逆数と同じである"][t1]);
    var S2 = (["磁気抵抗は、鉄心の断面積に反比例する", "磁気抵抗は、平均磁路長に比例する", "起磁力は、巻数と電流の積で表す", "磁気回路の起磁力は、電気回路の起電力にあたる", "磁気回路の磁束は、電気回路の電流にあたる", "自己インダクタンスは、巻数の2乗に比例する", "相互インダクタンスの最大は $\\sqrt{L_1 L_2}$ である", "和動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流の2乗に比例する", "自己インダクタンスは、鉄心の透磁率に比例する", "エアギャップのある磁気回路は、鉄心とエアギャップの磁気抵抗の直列とみなす", "磁気抵抗の単位 A/Wb は、H の逆数と同じである"][t2]);
    var S3 = (["磁気抵抗は、鉄心の断面積に反比例する", "磁気抵抗は、平均磁路長に比例する", "起磁力は、巻数と電流の積で表す", "磁気回路の起磁力は、電気回路の起電力にあたる", "磁気回路の磁束は、電気回路の電流にあたる", "自己インダクタンスは、巻数の2乗に比例する", "相互インダクタンスの最大は $\\sqrt{L_1 L_2}$ である", "和動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流の2乗に比例する", "自己インダクタンスは、鉄心の透磁率に比例する", "エアギャップのある磁気回路は、鉄心とエアギャップの磁気抵抗の直列とみなす", "磁気抵抗の単位 A/Wb は、H の逆数と同じである"][t3]);
    var W1 = (["正しい文（23-2）", "正しい文（23-2）", "正しい文（23-1）", "正しい文（23-3）", "正しい文（23-3）", "正しい文（24-4）", "正しい文（25-3）", "正しい文（25-4）", "正しい文（25-5）", "正しい文（24-3）", "正しい文（23-5）", "正しい文（23-4）"][t1]);
    var W2 = (["正しい文（23-2）", "正しい文（23-2）", "正しい文（23-1）", "正しい文（23-3）", "正しい文（23-3）", "正しい文（24-4）", "正しい文（25-3）", "正しい文（25-4）", "正しい文（25-5）", "正しい文（24-3）", "正しい文（23-5）", "正しい文（23-4）"][t2]);
    var W3 = (["正しい文（23-2）", "正しい文（23-2）", "正しい文（23-1）", "正しい文（23-3）", "正しい文（23-3）", "正しい文（24-4）", "正しい文（25-3）", "正しい文（25-4）", "正しい文（25-5）", "正しい文（24-3）", "正しい文（23-5）", "正しい文（23-4）"][t3]);
    if (!(t1 < t2 && t2 < t3)) continue;
    var _c = choices(r, [{t: String(SF), v: "f" + fmt(f)}, {t: String(S1), v: "t" + fmt(t1), why: String(W1)}, {t: String(S2), v: "t" + fmt(t2), why: String(W2)}, {t: String(S3), v: "t" + fmt(t3), why: String(W3)}]);
    return {form: "u51s14wrong", text: "次のうち、誤っているものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["文を1つずつ、習った式・決まりと照らす", "誤り：" + String(WF)], chk: {form: "u51s14wrong", p: {f: f, t1: t1, t2: t2, t3: t3}}};
  }
  throw new Error("u51s14wrong：条件に合う数字が見つからない");
}
function tbU51s14_Qright(r){
  var gcd = tbU51s14_gcd, ratio = tbU51s14_ratio, par = tbU51s14_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t = pick(r, [0,1,2,3,4,5,6,7,8,9,10,11]);
    var f1 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var f2 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var f3 = pick(r, [0,1,2,3,4,5,6,7,8]);
    var ST = (["磁気抵抗は、鉄心の断面積に反比例する", "磁気抵抗は、平均磁路長に比例する", "起磁力は、巻数と電流の積で表す", "磁気回路の起磁力は、電気回路の起電力にあたる", "磁気回路の磁束は、電気回路の電流にあたる", "自己インダクタンスは、巻数の2乗に比例する", "相互インダクタンスの最大は $\\sqrt{L_1 L_2}$ である", "和動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流の2乗に比例する", "自己インダクタンスは、鉄心の透磁率に比例する", "エアギャップのある磁気回路は、鉄心とエアギャップの磁気抵抗の直列とみなす", "磁気抵抗の単位 A/Wb は、H の逆数と同じである"][t]);
    var WT = (["正しい文（23-2）", "正しい文（23-2）", "正しい文（23-1）", "正しい文（23-3）", "正しい文（23-3）", "正しい文（24-4）", "正しい文（25-3）", "正しい文（25-4）", "正しい文（25-5）", "正しい文（24-3）", "正しい文（23-5）", "正しい文（23-4）"][t]);
    var F1 = (["磁気回路の起磁力は、電気回路の電流にあたる", "磁気抵抗は、鉄心の断面積に比例する", "磁気抵抗は、鉄心の透磁率に比例する", "自己インダクタンスは、巻数に比例する", "相互インダクタンスの最大は $L_1 + L_2$ である", "差動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流に比例する", "自己インダクタンスは、平均磁路長に比例する", "起磁力の単位は Wb である"][f1]);
    var F2 = (["磁気回路の起磁力は、電気回路の電流にあたる", "磁気抵抗は、鉄心の断面積に比例する", "磁気抵抗は、鉄心の透磁率に比例する", "自己インダクタンスは、巻数に比例する", "相互インダクタンスの最大は $L_1 + L_2$ である", "差動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流に比例する", "自己インダクタンスは、平均磁路長に比例する", "起磁力の単位は Wb である"][f2]);
    var F3 = (["磁気回路の起磁力は、電気回路の電流にあたる", "磁気抵抗は、鉄心の断面積に比例する", "磁気抵抗は、鉄心の透磁率に比例する", "自己インダクタンスは、巻数に比例する", "相互インダクタンスの最大は $L_1 + L_2$ である", "差動接続の合成インダクタンスは $L_1 + L_2 + 2M$ である", "コイルに蓄えられる磁気エネルギーは、電流に比例する", "自己インダクタンスは、平均磁路長に比例する", "起磁力の単位は Wb である"][f3]);
    var X1 = (["起磁力は起電力（電圧）にあたる。電流にあたるのは磁束（23-3）", "$R_m = \\dfrac{l}{\\mu S}$ で、断面積に反比例する（23-2）", "$R_m = \\dfrac{l}{\\mu S}$ で、透磁率は分母（23-2）", "巻数の2乗に比例する（24-4）", "$M = k \\sqrt{L_1 L_2}$ で、最大は $k = 1$ の $\\sqrt{L_1 L_2}$（25-3）", "差動は $L_1 + L_2 - 2M$（25-4）", "$W = \\dfrac{1}{2} L I^2$ で、電流の2乗に比例する（25-5）", "$L = \\dfrac{\\mu S N^2}{l}$ で、長さは分母（24-3）", "起磁力 $NI$ の単位は A（23-1）"][f1]);
    var X2 = (["起磁力は起電力（電圧）にあたる。電流にあたるのは磁束（23-3）", "$R_m = \\dfrac{l}{\\mu S}$ で、断面積に反比例する（23-2）", "$R_m = \\dfrac{l}{\\mu S}$ で、透磁率は分母（23-2）", "巻数の2乗に比例する（24-4）", "$M = k \\sqrt{L_1 L_2}$ で、最大は $k = 1$ の $\\sqrt{L_1 L_2}$（25-3）", "差動は $L_1 + L_2 - 2M$（25-4）", "$W = \\dfrac{1}{2} L I^2$ で、電流の2乗に比例する（25-5）", "$L = \\dfrac{\\mu S N^2}{l}$ で、長さは分母（24-3）", "起磁力 $NI$ の単位は A（23-1）"][f2]);
    var X3 = (["起磁力は起電力（電圧）にあたる。電流にあたるのは磁束（23-3）", "$R_m = \\dfrac{l}{\\mu S}$ で、断面積に反比例する（23-2）", "$R_m = \\dfrac{l}{\\mu S}$ で、透磁率は分母（23-2）", "巻数の2乗に比例する（24-4）", "$M = k \\sqrt{L_1 L_2}$ で、最大は $k = 1$ の $\\sqrt{L_1 L_2}$（25-3）", "差動は $L_1 + L_2 - 2M$（25-4）", "$W = \\dfrac{1}{2} L I^2$ で、電流の2乗に比例する（25-5）", "$L = \\dfrac{\\mu S N^2}{l}$ で、長さは分母（24-3）", "起磁力 $NI$ の単位は A（23-1）"][f3]);
    if (!(f1 < f2 && f2 < f3)) continue;
    var _c = choices(r, [{t: String(ST), v: "t" + fmt(t)}, {t: String(F1), v: "f" + fmt(f1), why: String(X1)}, {t: String(F2), v: "f" + fmt(f2), why: String(X2)}, {t: String(F3), v: "f" + fmt(f3), why: String(X3)}]);
    return {form: "u51s14right", text: "次のうち、正しいものはどれですか。", fig: null, ch: _c.ch, ans: _c.ans, ex: ["文を1つずつ、習った式・決まりと照らす", String(WT)], chk: {form: "u51s14right", p: {t: t, f1: f1, f2: f2, f3: f3}}};
  }
  throw new Error("u51s14right：条件に合う数字が見つからない");
}
function tbU51s14_Qblank(r){
  var gcd = tbU51s14_gcd, ratio = tbU51s14_ratio, par = tbU51s14_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [0,1,2,3]);
    var QT = (["次の文の □ に入る語の組はどれですか。\n(ア) 起磁力は、電気回路の □ にあたる。\n(イ) 磁気抵抗は、電気回路の □ にあたる。", "次の文の □ に入る語の組はどれですか。\n(ア) 巻数を 2 倍にすると、自己インダクタンスは □ 倍になる。\n(イ) 自己インダクタンスは、平均磁路長に □ する。", "次の文の □ に入る語の組はどれですか。\n(ア) 和動接続の合成インダクタンスは、$L_1 + L_2$ に $2M$ を □ 。\n(イ) 結合係数が 1 の時、相互インダクタンスは □ である。", "次の文の □ に入る語の組はどれですか。\n(ア) コイルに蓄えられる磁気エネルギーは、電流の □ に比例する。\n(イ) 磁気抵抗の単位 A/Wb は、□ と同じである。"][k]);
    var C = (["(ア) 起電力　(イ) 抵抗", "(ア) 4　(イ) 反比例", "(ア) 足す　(イ) $\\sqrt{L_1 L_2}$", "(ア) 2乗　(イ) $\\mathrm{H^{-1}}$"][k]);
    var W1 = (["(ア) 電流　(イ) 抵抗", "(ア) 2　(イ) 反比例", "(ア) 引く　(イ) $\\sqrt{L_1 L_2}$", "(ア) 1乗　(イ) $\\mathrm{H^{-1}}$"][k]);
    var R1 = (["起磁力は起電力にあたる（23-3）", "巻数の2乗に比例する（24-4）", "和動は $+2M$、差動が $-2M$（25-4）", "$W = \\dfrac{1}{2} L I^2$（25-5）"][k]);
    var W2 = (["(ア) 起電力　(イ) 電流", "(ア) 4　(イ) 比例", "(ア) 足す　(イ) $L_1 L_2$", "(ア) 2乗　(イ) $\\mathrm{H}$"][k]);
    var R2 = (["磁気抵抗は抵抗にあたる（23-3）", "$L = \\dfrac{\\mu S N^2}{l}$ で、長さは分母（24-3）", "$M = k \\sqrt{L_1 L_2}$（25-3）", "H の逆数（23-4）"][k]);
    var W3 = (["(ア) 電流　(イ) 起電力", "(ア) 2　(イ) 比例", "(ア) 引く　(イ) $L_1 L_2$", "(ア) 1乗　(イ) $\\mathrm{H}$"][k]);
    var R3 = (["起磁力は起電力、磁気抵抗は抵抗（23-3）", "巻数の2乗・長さは分母（24-4・24-3）", "和動は $+2M$・$M = k \\sqrt{L_1 L_2}$（25-4・25-3）", "$W = \\dfrac{1}{2} L I^2$・H の逆数（25-5・23-4）"][k]);
    var _c = choices(r, [{t: String(C), v: "ok"}, {t: String(W1), v: "w1", why: String(R1)}, {t: String(W2), v: "w2", why: String(R2)}, {t: String(W3), v: "w3", why: String(R3)}]);
    return {form: "u51s14blank", text: String(QT), fig: null, ch: _c.ch, ans: _c.ans, ex: ["(ア)(イ) の文を、習った式・決まりと照らす", "答え " + String(C)], chk: {form: "u51s14blank", p: {k: k}}};
  }
  throw new Error("u51s14blank：条件に合う数字が見つからない");
}
var GEN = {
  // 51-1 2本の導体の磁界を足す・引く
  1: function(r){ return pick(r, [tbU51s1_Qadd, tbU51s1_Qadd, tbU51s1_Qadd, tbU51s1_Qsub, tbU51s1_Qsub, tbU51s1_Qsub, tbU51s1_Qout, tbU51s1_Qout, tbU51s1_Qinv, tbU51s1_Qinv, tbU51s1_Qdir, tbU51s1_Qdir])(r); },
  // 51-2 2つの磁極の磁界を足す・引く
  2: function(r){ return pick(r, [tbU51s2_Qboth, tbU51s2_Qboth, tbU51s2_Qboth, tbU51s2_Qsame, tbU51s2_Qsame, tbU51s2_Qsame, tbU51s2_Qnn, tbU51s2_Qnn, tbU51s2_Qinv, tbU51s2_Qinv])(r); },
  // 51-3 2つの磁界の式を等しく置く
  3: function(r){ return pick(r, [tbU51s3_Qline, tbU51s3_Qline, tbU51s3_Qline, tbU51s3_Qma, tbU51s3_Qma, tbU51s3_Qratio, tbU51s3_Qratio, tbU51s3_Qturns, tbU51s3_Qturns])(r); },
  // 51-4 平行な2本の力から逆に解く
  4: function(r){ return pick(r, [tbU51s4_Qi2, tbU51s4_Qi2, tbU51s4_Qi2, tbU51s4_Qdist, tbU51s4_Qdist, tbU51s4_Qmm, tbU51s4_Qmm, tbU51s4_Qratio, tbU51s4_Qratio])(r); },
  // 51-5 右ねじから左手で力の向き
  5: function(r){ return pick(r, [tbU51s5_Qone, tbU51s5_Qone, tbU51s5_Qone, tbU51s5_Qxyz, tbU51s5_Qxyz, tbU51s5_Qboth, tbU51s5_Qboth, tbU51s5_Qinv, tbU51s5_Qinv])(r); },
  // 51-6 磁界の強さから磁束密度
  6: function(r){ return pick(r, [tbU51s6_Qb, tbU51s6_Qb, tbU51s6_Qb, tbU51s6_Qmr, tbU51s6_Qmr, tbU51s6_Qinv, tbU51s6_Qinv, tbU51s6_Qinv])(r); },
  // 51-7 電流のグラフから自己誘導起電力
  7: function(r){ return pick(r, [tbU51s7_Qmax1, tbU51s7_Qmax1, tbU51s7_Qmax2, tbU51s7_Qmax2, tbU51s7_Qsec, tbU51s7_Qsec, tbU51s7_Qzero, tbU51s7_Qinv, tbU51s7_Qinv])(r); },
  // 51-8 磁束鎖交数から起電力
  8: function(r){ return pick(r, [tbU51s8_Qe, tbU51s8_Qe, tbU51s8_Qe, tbU51s8_Qdphi, tbU51s8_Qdphi, tbU51s8_Qn, tbU51s8_Qn])(r); },
  // 51-9 磁束鎖交数から磁気エネルギー
  9: function(r){ return pick(r, [tbU51s9_Qw, tbU51s9_Qw, tbU51s9_Qw, tbU51s9_Qrt, tbU51s9_Qrt, tbU51s9_Qmh, tbU51s9_Qmh])(r); },
  // 51-10 和動から結合係数
  10: function(r){ return pick(r, [tbU51s10_Qwa, tbU51s10_Qwa, tbU51s10_Qwa, tbU51s10_Qsa, tbU51s10_Qsa, tbU51s10_Qmh, tbU51s10_Qmh])(r); },
  // 51-11 導体棒の起電力から電流
  11: function(r){ return pick(r, [tbU51s11_Qi, tbU51s11_Qi, tbU51s11_Qi, tbU51s11_Qma, tbU51s11_Qma, tbU51s11_Qdir, tbU51s11_Qdir, tbU51s11_Qsgn, tbU51s11_Qv, tbU51s11_Qv])(r); },
  // 51-12 単位を式から出す（磁気）
  12: function(r){ return pick(r, [tbU51s12_Qone, tbU51s12_Qone, tbU51s12_Qone, tbU51s12_Qpair, tbU51s12_Qpair, tbU51s12_Qpair, tbU51s12_Qright, tbU51s12_Qright])(r); },
  // 51-13 文の正誤（磁界・電磁力・電磁誘導）
  13: function(r){ return pick(r, [tbU51s13_Qwrong, tbU51s13_Qwrong, tbU51s13_Qwrong, tbU51s13_Qright, tbU51s13_Qright, tbU51s13_Qblank, tbU51s13_Qblank])(r); },
  // 51-14 文の正誤（磁気回路・インダクタンス）
  14: function(r){ return pick(r, [tbU51s14_Qwrong, tbU51s14_Qwrong, tbU51s14_Qwrong, tbU51s14_Qright, tbU51s14_Qright, tbU51s14_Qblank, tbU51s14_Qblank])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t51s1e","scene":"t51s1e","kind":"u51s1wm","lab":{"wa":"A","wb":"B","p":"P","ia":"{I}_A","iaa":"up","ib":"{I}_B","iba":"down","dpa":"{r}_A","dpb":"{r}_B","hpa":"back","hpb":"back","ha":"{H}_A","hb":"{H}_B"},"viewbox":"220 81 680 691","band":{"want":"2本の導体が点 P につくる磁界の強さ","ans":"向きを決めてから、同じ向きなら足す・逆向きなら引く","full":"それぞれの導体の磁界の強さを H = I/(2πr) で出し、右ねじの法則で手前向きか奥向きかを決める。同じ向きなら足し、逆向きなら引く。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"2本の導体が点 P につくる磁界は、\n①それぞれの大きさ\n②右ねじで向き\n③足すか引くか\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ia","Ib","P"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"A がつくる磁界と B がつくる磁界を、それぞれ直線の導体の式で出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ia","Ib","Dpa","Dpb","Ha","Hb"],"eq":[{"cont":false,"items":[["H = \\dfrac{I}{2 \\pi r}"]]}],"emphPre":["Ia","Ib","Dpa","Dpb","Ha","Hb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"向きは、右ねじの法則で手前向きか奥向きかを決めます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ia","Ib","Ha","Hb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖同じ向きなら足し、逆向きなら引きます〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["Ha","Hb"],"ans":true}]}],"groups":{"Wa":["wa","wat0","wat1"],"Ia":["iaa","iaa:h","iat0","iat1"],"Wb":["wb","wbt0","wbt1"],"Ib":["iba","iba:h","ibt0","ibt1"],"P":["pd","pt0","pt1"],"Dpa":["dpad","dpad:h","dpad:h2","dpat0","dpat1"],"Dpb":["dpbd","dpbd:h","dpbd:h2","dpbt0","dpbt1"],"Dab":["dabe1","dabe2","dabd","dabd:h","dabd:h2","dabt0","dabt1"],"Ha":["hpac","hpac:t","hat0","hat1"],"Hb":["hpbc","hpbc:t","hbt0","hbt1"]},"moves":{},"route":["それぞれの大きさ","右ねじで向き","足すか引くか"]}},{"id":"t51s1x","scene":"t51s1x","kind":"u51s1wm","lab":{"wa":"A","wb":"B","p":"P","ia":"6 A","iaa":"up","ib":"6 A","iba":"down","dpa":"1 m","dab":"4 m","dpb":["{r}_B","3 m"],"hpa":"back","hpb":"back","ha":["{H}_A","{H}_A=3/π A/m"],"hb":["{H}_B","{H}_B=1/π A/m"]},"viewbox":"220 81 680 691","band":{"want":"点 P の磁界の強さ $H$","known":"A 上向き $6\\,\\mathrm{A}$、B 下向き $6\\,\\mathrm{A}$、A–B $4\\,\\mathrm{m}$、P–A $1\\,\\mathrm{m}$","ans":"$H = \\dfrac{4}{\\pi}\\,\\mathrm{A/m}$"},"narr":{"start":{"co":1,"dpbv":0,"hav":0,"hbv":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、点 P の磁界の強さです。","at":{"強調":1.0},"after":[],"emph":["P"]},{"text":"①それぞれの大きさ\n②右ねじで向き\n③足すか引くか\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["P"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"P から B までは、$4 - 1 = 3\\,\\mathrm{m}$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"rb","emph":["Dab","Dpa","Dpb"]},{"text":"A がつくる磁界です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Ia","Dpa","Ha"],"eq":[{"cont":false,"items":[["H_A = \\dfrac{6}{2 \\pi \\times 1}"],["H_A = \\dfrac{3}{\\pi}\\,\\mathrm{A/m}"]]}],"move":"ha","emphPre":["Ia","Dpa","Ha"]},{"text":"B がつくる磁界です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Ib","Dpb","Hb"],"eq":[{"cont":false,"items":[["H_B = \\dfrac{6}{2 \\pi \\times 3}"],["H_B = \\dfrac{1}{\\pi}\\,\\mathrm{A/m}"]]}],"move":"hb","emphPre":["Ib","Dpb","Hb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"A の電流は上向きです。右ねじの法則で、A の右にある P の磁界は奥向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Ia","Ha"]},{"text":"B の電流は下向きです。B の左にある P の磁界も、奥向きです。","at":{"強調":1.0},"after":[],"emph":["Ib","Hb"]},{"text":"〖向きが分かったので、次に足すか引くかが決まります〗。","at":{"強調":1.0},"after":[],"emph":["Ha","Hb"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"どちらも奥向きなので、足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Ha","Hb"],"eq":[{"cont":false,"items":[["H = H_A + H_B"],["H = \\dfrac{3}{\\pi} + \\dfrac{1}{\\pi} = \\dfrac{4}{\\pi}\\,\\mathrm{A/m}"]]}],"ans":true,"emphPre":["Ha","Hb"]}]}],"groups":{"Wa":["wa","wat0","wat1"],"Ia":["iaa","iaa:h","iat0","iat1"],"Wb":["wb","wbt0","wbt1"],"Ib":["iba","iba:h","ibt0","ibt1"],"P":["pd","pt0","pt1"],"Dpa":["dpad","dpad:h","dpad:h2","dpat0","dpat1"],"Dpb":["dpbd","dpbd:h","dpbd:h2","dpbt0","dpbt1"],"Dab":["dabe1","dabe2","dabd","dabd:h","dabd:h2","dabt0","dabt1"],"Ha":["hpac","hpac:t","hat0","hat1"],"Hb":["hpbc","hpbc:t","hbt0","hbt1"]},"moves":{"rb":{"to":{"dpbv":1},"dur":0.4},"ha":{"to":{"hav":1},"dur":0.4},"hb":{"to":{"hbv":1},"dur":0.4}},"route":["それぞれの大きさ","右ねじで向き","足すか引くか"]}},{"id":"t51s2e","scene":"t51s2e","kind":"u51s2pe","lab":{"na":"A","nb":"N","nc":"S","d1":"{r}_N","d2":"{r}_S","h1":"{H}_N","h1a":"right","h2":"{H}_S","h2a":"right"},"viewbox":"26 131 1068 402","band":{"want":"2つの磁極が点 A につくる磁界の強さ","ans":"向きを決めてから、同じ向きなら足す・逆向きなら引く","full":"それぞれの磁極の磁界の強さは距離の2乗に反比例する。磁界は N 極から出て S 極へ入る向き。同じ向きなら足し、逆向きなら引く。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"2つの磁極が点 A につくる磁界は、\n①それぞれの大きさ\n②N から出て S へ\n③足すか引くか\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Nb","Nc","Na"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"それぞれの磁極の磁界は、距離の2乗に反比例します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["D1","D2","H1","H2"],"eq":[{"cont":false,"items":[["H = \\dfrac{m}{4 \\pi \\mu_0 r^2}"]]}],"emphPre":["D1","D2","H1","H2"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁界は、N 極から出て S 極へ入る向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Nb","Nc","H1","H2"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖同じ向きなら足し、逆向きなら引きます〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["H1","H2"],"ans":true}]}],"groups":{"Cl":["cl"],"Magb":["magb0","magb1","magbd","magbt0","magbt1"],"Nb":["pb","nbt0","nbt1"],"Mb":["mbt0","mbt1"],"Magc":["magc0","magc1","magcd","magct0","magct1"],"Nc":["pc","nct0","nct1"],"Mc":["mct0","mct1"],"Na":["pa","nat0","nat1"],"D1":["d1e1","d1e2","d1d","d1d:h","d1d:h2","d1t0","d1t1"],"D2":["d2e1","d2e2","d2d","d2d:h","d2d:h2","d2t0","d2t1"],"H1":["h1a","h1a:h","h1t0","h1t1"],"H2":["h2a","h2a:h","h2t0","h2t1"],"H":["ha","ha:h","ht0","ht1"]},"moves":{},"route":["それぞれの大きさ","N から出て S へ","足すか引くか"]}},{"id":"t51s2x","scene":"t51s2x","kind":"u51s2pb","lab":{"na":"A","nb":"N","nc":"S","d1":"1 m","d2":"2 m","h1":"{H}_N","h1a":"right","h2":"{H}_S","h2a":"right","h":"{H}","ha":"right"},"viewbox":"26 121 1068 412","band":{"want":"点 A の磁界の強さ $H$","known":"左 $1\\,\\mathrm{m}$ に N 極、右 $2\\,\\mathrm{m}$ に同じ強さの S 極、N 極が $1\\,\\mathrm{m}$ の所につくる磁界 $8\\,\\mathrm{A/m}$","ans":"$H = 10\\,\\mathrm{A/m}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"求めるのは、点 A の磁界の強さです。","at":{"強調":1.0},"after":[],"emph":["Na","H"]},{"text":"①それぞれの大きさ\n②N から出て S へ\n③足すか引くか\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Na","H"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"N 極は A から $1\\,\\mathrm{m}$ なので、A の磁界は問題のとおり $8\\,\\mathrm{A/m}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Nb","D1","H1"]},{"text":"S 極は同じ強さで、A から $2\\,\\mathrm{m}$ です。距離が 2 倍なので、磁界は $\\dfrac{1}{2^2}$ 倍です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Nc","D2","H2"],"eq":[{"cont":false,"items":[["H_S = 8 \\times \\dfrac{1}{2^2}"],["H_S = 2\\,\\mathrm{A/m}"]]}],"emphPre":["Nc","D2","H2"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"磁界は N 極から出ます。A は N 極の右なので、右向きです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Nb","H1"]},{"text":"磁界は S 極へ入ります。S 極は A の右なので、こちらも右向きです。","at":{"強調":1.0},"after":[],"emph":["Nc","H2"]},{"text":"〖向きが分かったので、次に足すか引くかが決まります〗。","at":{"強調":1.0},"after":[],"emph":["H1","H2"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"どちらも右向きなので、足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["H1","H2","H"],"eq":[{"cont":false,"items":[["H = H_N + H_S"],["H = 8 + 2 = 10\\,\\mathrm{A/m}"]]}],"ans":true,"emphPre":["H1","H2","H"]}]}],"groups":{"Cl":["cl"],"Magb":["magb0","magb1","magbd","magbt0","magbt1"],"Nb":["pb","nbt0","nbt1"],"Mb":["mbt0","mbt1"],"Magc":["magc0","magc1","magcd","magct0","magct1"],"Nc":["pc","nct0","nct1"],"Mc":["mct0","mct1"],"Na":["pa","nat0","nat1"],"D1":["d1e1","d1e2","d1d","d1d:h","d1d:h2","d1t0","d1t1"],"D2":["d2e1","d2e2","d2d","d2d:h","d2d:h2","d2t0","d2t1"],"H1":["h1a","h1a:h","h1t0","h1t1"],"H2":["h2a","h2a:h","h2t0","h2t1"],"H":["ha","ha:h","ht0","ht1"]},"moves":{},"route":["それぞれの大きさ","N から出て S へ","足すか引くか"]}},{"id":"t51s3e","scene":"t51s3e","kind":"u51s3sc","lab":{"p":"P","o":"O","i1":"{I}_1","i1a":"up","a":"{a}","i":"{I}_2","ia":"ccw","r":"{r}"},"viewbox":"281 -4 1259 992","band":{"want":"直線の導体の電流 $I_1$（P の磁界と円形コイルの中心の磁界が等しい）","ans":"中心の磁界を出し、直線の式と等しく置いて $I_1$ について解く","full":"円形コイルの中心の磁界 H = NI2/(2r) を出し、直線の導体の式 I1/(2πa) と等しく置いて、I1 について解く。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"2つの磁界が等しい時は、\n①中心の磁界\n②等しく置く\n③解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["P","O"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"円形コイルの中心の磁界を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["I","R","O"],"eq":[{"cont":false,"items":[["H = \\dfrac{N I_2}{2 r}"]]}],"emphPre":["I","R","O"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖この磁界と、直線の導体がつくる P の磁界を等しく置きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I1","A","P","I","R"],"eq":[{"cont":false,"items":[["\\dfrac{I_1}{2 \\pi a} = \\dfrac{N I_2}{2 r}"]]}],"emphPre":["I1","A","P","I","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖あとは $I_1$ について解きます〗。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["I1","A","I","R"]}]}],"groups":{"W":["wl","wt0","wt1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"P":["pd","pt0","pt1"],"A":["ad","ad:h","ad:h2","at0","at1"],"Cl":["clx1","clx0x1","clx1x1","cltx10","cltx11","clbx1","clbx0x1","clbx1x1","cltbx10","cltbx11"],"I":["iax1","iax1:h","itx10","itx11","iabx1","iabx1:h","itbx10","itbx11"],"R":["rdx1","rdx1:h","rdx1:h2","rtx10","rtx11","rdbx1","rdbx1:h","rdbx1:h2","rtbx10","rtbx11"],"O":["odx1","otx10","otx11"],"H":["htx10","htx11"]},"moves":{},"route":["中心の磁界","等しく置く","解く"]}},{"id":"t51s3x","scene":"t51s3x","kind":"u51s3sc","lab":{"p":"P","o":"O","i1":["{I}_1","{I}_1=6π A"],"i1a":"up","a":"2 m","i":"6 A","ia":"ccw","r":"2 m"},"viewbox":"281 -4 1259 992","band":{"want":"直線の導体の電流 $I_1$","known":"P まで $2\\,\\mathrm{m}$、1回巻き・半径 $2\\,\\mathrm{m}$ の円形コイルに $6\\,\\mathrm{A}$、2つの磁界が等しい","ans":"$I_1 = 6\\pi\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i1v":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、直線の導体の電流 $I_1$ です。","at":{"強調":1.0},"after":[],"emph":["I1"]},{"text":"①中心の磁界\n②等しく置く\n③解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"円形コイルは1回巻きです。中心の磁界を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["I","R","O"],"eq":[{"cont":false,"items":[["H = \\dfrac{I}{2 r}"],["H = \\dfrac{6}{2 \\times 2} = 1.5\\,\\mathrm{A/m}"]]}],"emphPre":["I","R","O"]},{"text":"〖この $1.5\\,\\mathrm{A/m}$ が、P の磁界と同じ値です〗。","at":{"強調":1.0},"after":[],"emph":["O","P"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"直線の導体から $2\\,\\mathrm{m}$ の P の磁界と、等しく置きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I1","A","P","R"],"eq":[{"cont":false,"items":[["\\dfrac{I_1}{2 \\pi \\times 2} = 1.5"]]}],"emphPre":["I1","A","P","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$I_1$ について解きます。$\\pi$ は残します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["I1"],"eq":[{"cont":false,"items":[["I_1 = 1.5 \\times 2 \\pi \\times 2"],["I_1 = 6 \\pi\\,\\mathrm{A}"]]}],"move":"i1","ans":true,"emphPre":["I1"]}]}],"groups":{"W":["wl","wt0","wt1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"P":["pd","pt0","pt1"],"A":["ad","ad:h","ad:h2","at0","at1"],"Cl":["clx1","clx0x1","clx1x1","cltx10","cltx11","clbx1","clbx0x1","clbx1x1","cltbx10","cltbx11"],"I":["iax1","iax1:h","itx10","itx11","iabx1","iabx1:h","itbx10","itbx11"],"R":["rdx1","rdx1:h","rdx1:h2","rtx10","rtx11","rdbx1","rdbx1:h","rdbx1:h2","rtbx10","rtbx11"],"O":["odx1","otx10","otx11"],"H":["htx10","htx11"]},"moves":{"i1":{"to":{"i1v":1},"dur":0.4}},"route":["中心の磁界","等しく置く","解く"]}},{"id":"t51s4e","scene":"t51s4e","kind":"u51s4pa","lab":{"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"{l}","i1":"{I}_1","i2":"{I}_2","r":"{r}"},"viewbox":"222 148 686 666","band":{"want":"力が分かっている時の電流・距離","ans":"$F = 2 \\times 10^{-7} \\times \\dfrac{I_1 I_2 l}{r}$ を、分からない物について解く","full":"平行な2本の導体の力の式に μ0 = 4π×10^-7 を入れると、F = 2×10^-7 × I1 I2 l / r。分かっていない電流か距離について解く。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"力から電流や距離を出す時は、\n①力の式\n②10のべき乗\n③逆に解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["F2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"平行な2本の導体の力の式です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{\\mu_0 I_1 I_2 l}{2 \\pi r}"]]}],"emphPre":["F2","I1","I2","L","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$\\mu_0 = 4 \\pi \\times 10^{-7}$ を入れると、$\\pi$ が消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = 2 \\times 10^{-7} \\times \\dfrac{I_1 I_2 l}{r}"]]}],"emphPre":["F2","I1","I2","L","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖分かっていない電流か距離について、この式を解きます〗。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["I2","R"]}]}],"groups":{"I1":["w1","ia1","ia1:h","i1t0","i1t1"],"I2":["w2","w2b","ia2","ia2:h","i2t0","i2t1"],"H2":["h2c","h2c:t","h2t0","h2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{},"route":["力の式","10のべき乗","逆に解く"]}},{"id":"t51s4x","scene":"t51s4x","kind":"u51s4pa","lab":{"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"1 m","i1":"{I}_1=10 A","i2":["{I}_2","{I}_2=4 A"],"r":"0.2 m"},"viewbox":"222 148 686 666","band":{"want":"もう一方の電流 $I_2$","known":"$r = 0.2\\,\\mathrm{m},\\;\\; I_1 = 10\\,\\mathrm{A}$、$1\\,\\mathrm{m}$ あたり $4 \\times 10^{-5}\\,\\mathrm{N}$","ans":"$I_2 = 4\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、もう一方の電流 $I_2$ です。","at":{"強調":1.0},"after":[],"emph":["I2"]},{"text":"①力の式\n②10のべき乗\n③逆に解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"真空中なので、$\\mu_0 = 4 \\pi \\times 10^{-7}$ を入れた式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = 2 \\times 10^{-7} \\times \\dfrac{I_1 I_2 l}{r}"]]}],"emphPre":["F2","I1","I2","L","R"]},{"text":"$I_1$、$l$、$r$ の数を入れます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F2","I1","L","R","I2"],"eq":[{"cont":false,"items":[["F = 2 \\times 10^{-7} \\times \\dfrac{10 I_2}{0.2}"]]}],"emphPre":["F2","I1","L","R","I2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"数をまとめます。$\\dfrac{10}{0.2}$ は $50$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I1","R"],"eq":[{"cont":false,"items":[["2 \\times 10^{-7} \\times 50"],["= 10^{-5}"]]}],"emphPre":["I1","R"]},{"text":"〖この $10^{-5}$ で割れば、$I_2$ が出ます〗。","at":{"強調":1.0},"after":[],"emph":["I2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"$F = 4 \\times 10^{-5}$ を入れて、$I_2$ について解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["I2","F2"],"eq":[{"cont":false,"items":[["4 \\times 10^{-5} = 10^{-5} \\times I_2"],["I_2 = 4\\,\\mathrm{A}"]]}],"move":"i2","ans":true,"emphPre":["I2","F2"]}]}],"groups":{"I1":["w1","ia1","ia1:h","i1t0","i1t1"],"I2":["w2","w2b","ia2","ia2:h","i2t0","i2t1"],"H2":["h2c","h2c:t","h2t0","h2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{"i2":{"to":{"i2v":1},"dur":0.4}},"route":["力の式","10のべき乗","逆に解く"]}},{"id":"t51s5e","scene":"t51s5e","kind":"u51s5xs","lab":{"c1":"A","c2":"B","i1":"{I}_A","i2":"{I}_B","h2":"{H}","f2":"{F}"},"viewbox":"136 327 658 269","band":{"want":"もう一方の導体から受ける力の向き","ans":"もう一方がつくる磁界を右ねじで決め、左手で力の向き","full":"B の所の、A がつくる磁界の向きを右ねじの法則で決める。その磁界と B の電流から、フレミングの左手の法則で力の向きを出す。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"B に働く力の向きは、\n①もう一方がつくる磁界\n②左手で力\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C2","F2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"B の所には、A がつくる磁界があります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","H2"]},{"text":"その向きは、右ねじの法則で決めます。","at":{"強調":1.0},"after":[],"emph":["C1","I1","H2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"〖その磁界を人差し指に〗、B の電流を中指に向けると、親指が力の向きです。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["H2","I2","F2"],"ans":true}]}],"groups":{"C1":["cc1","cc1:t","c1t0","c1t1"],"I1":["i1t0","i1t1"],"H1":["h1a","h1a:h","h1t0","h1t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"C2":["cc2","cc2:t","c2t0","c2t1"],"I2":["i2t0","i2t1"],"H2":["h2a","h2a:h","h2t0","h2t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"D12":["d12e1","d12e2","d12d","d12d:h","d12d:h2","d12t0","d12t1"]},"moves":{},"route":["もう一方がつくる磁界","左手で力"]}},{"id":"t51s5x","scene":"t51s5x","kind":"u51s5xs","lab":{"c1":"A","c2":"B","ca1":"back","ca2":"back","i1":"{I}","i2":"{I}","h2":"{H}","h2a":"down"},"viewbox":"136 327 658 269","band":{"want":"B に働く力の向き","known":"A・B とも奥向きの電流（A が左・B が右）","ans":"左向き（A へ向かう）"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、B に働く力の向きです。","at":{"強調":1.0},"after":[],"emph":["C2"]},{"text":"①もう一方がつくる磁界\n②左手で力\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"A の電流は奥向きです。右ねじの法則で、A のまわりの磁界は時計回りです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","I1"]},{"text":"A の右にある B の所では、磁界は下向きです。","at":{"強調":1.0},"after":[],"emph":["C1","C2","H2"]},{"text":"〖この下向きの磁界を、次の左手の人差し指に使います〗。","at":{"強調":1.0},"after":[],"emph":["H2"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"人差し指を下に向け、中指を B の電流の奥向きに向けます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["H2","C2","I2"]},{"text":"親指は左を向きます。B に働く力は左向き、A へ向かう向きです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["C2","C1"]}]}],"groups":{"C1":["cc1","cc1:t","c1t0","c1t1"],"I1":["i1t0","i1t1"],"H1":["h1a","h1a:h","h1t0","h1t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"C2":["cc2","cc2:t","c2t0","c2t1"],"I2":["i2t0","i2t1"],"H2":["h2a","h2a:h","h2t0","h2t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"D12":["d12e1","d12e2","d12d","d12d:h","d12d:h2","d12t0","d12t1"]},"moves":{},"route":["もう一方がつくる磁界","左手で力"]}},{"id":"t51s6e","scene":"t51s6e","kind":"u51s6tr","lab":{"mu":"{μ}","l":"{l}","n":"{N}","i":"{I}","ia":"in"},"viewbox":"156 168 929 534","band":{"want":"鉄心の中の磁束密度","ans":"$H = \\dfrac{NI}{l}$ を出して $B = \\mu H$","full":"鉄心の中の磁界の強さは H = NI/l（l は輪の一周＝磁路の長さ）。それに透磁率を掛けると磁束密度 B = μH。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"鉄心の中の磁束密度は、\n①磁界の強さ\n②磁束密度\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Core"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"環状ソレノイドの式を使います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["N","I"]},{"text":"輪の一周の長さを $l$ と書きます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","I","L"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{l}"]]}],"emphPre":["N","I","L"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"〖この $H$ に透磁率を掛けると〗、磁束密度です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Mu","N","I","L"],"eq":[{"cont":false,"items":[["B = \\mu H"]]}],"ans":true,"emphPre":["Mu"]}]}],"groups":{"Core":["core","co","ci","coret0","coret1"],"L":["ll","lld","lt0","lt1"],"S":["sc","sld","st0","st1"],"Mu":["muld","mut0","mut1"],"N":["wd0","wd1","wd2","wd3","wd4","wd5","wd6","wd7","wd8","ld0","ld1","nt0","nt1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["磁界の強さ","磁束密度"]}},{"id":"t51s6x","scene":"t51s6x","kind":"u51s6tr","lab":{"mu":"{μ}","l":"{l}=0.5 m","n":"{N}=200","i":"{I}=2 A","ia":"in"},"viewbox":"156 168 929 534","band":{"want":"鉄心の中の磁束密度 $B$","known":"$l = 0.5\\,\\mathrm{m},\\;\\; N = 200,\\;\\; I = 2\\,\\mathrm{A},\\;\\; \\mu = 2 \\times 10^{-3}\\,\\mathrm{H/m}$","ans":"$B = 1.6\\,\\mathrm{T}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"求めるのは、鉄心の中の磁束密度 $B$ です。","at":{"強調":1.0},"after":[],"emph":["Core"]},{"text":"①磁界の強さ\n②磁束密度\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Core"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"磁界の強さを出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["N","I","L"],"eq":[{"cont":false,"items":[["H = \\dfrac{NI}{l}"],["H = \\dfrac{200 \\times 2}{0.5} = 800\\,\\mathrm{A/m}"]]}],"emphPre":["N","I","L"]},{"text":"〖この $800\\,\\mathrm{A/m}$ を、次の式の $H$ に使います〗。","at":{"強調":1.0},"after":[],"emph":["Core"]}]},{"cap":null,"eqp":null,"vid":[31],"sents":[{"text":"透磁率を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Mu","Core"],"eq":[{"cont":false,"items":[["B = \\mu H"],["B = 2 \\times 10^{-3} \\times 800"],["B = 1.6\\,\\mathrm{T}"]]}],"ans":true,"emphPre":["Mu"]}]}],"groups":{"Core":["core","co","ci","coret0","coret1"],"L":["ll","lld","lt0","lt1"],"S":["sc","sld","st0","st1"],"Mu":["muld","mut0","mut1"],"N":["wd0","wd1","wd2","wd3","wd4","wd5","wd6","wd7","wd8","ld0","ld1","nt0","nt1"],"I":["ia","ia:h","it0","it1"]},"moves":{},"route":["磁界の強さ","磁束密度"]}},{"id":"t51s7e","scene":"t51s7e","kind":"u51s7g1","lab":{"gx":"{t} [ms]","gy":"{I} [mA]"},"viewbox":"143 61 936 598","band":{"want":"電流のグラフからコイルの電圧","ans":"区間ごとの傾き $\\dfrac{\\Delta I}{\\Delta t}$ に $L$ を掛ける","full":"区間ごとに電流の傾き ΔI/Δt を出し（一定の区間は 0）、自己インダクタンス L を掛けると、その区間のコイルの電圧。傾きの大きい区間ほど大きい。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"電流のグラフからコイルの電圧を出す時は、\n①区間ごとの傾き\n②L を掛ける\n③大きい区間\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Line"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"区間ごとに、電流の傾きを出します。電流が一定の区間は、傾きが 0 です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Line","Ax"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖その傾きに $L$ を掛けると〗、その区間のコイルの電圧です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Line","Ax"],"eq":[{"cont":false,"items":[["v = L \\dfrac{\\Delta I}{\\Delta t}"]]}],"emphPre":["Line","Ax"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"傾きの大きい区間ほど、電圧が大きくなります。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["Line"],"ans":true}]}],"groups":{"Ax":["gax","gax:h","gay","gay:h","go","gxt0","gxt1","gyt0","gyt1"],"Line":["gl","gt1d","gt2d"],"Gv1":["gv1d","gv1t0","gv1t1"],"Gw1":["gw1e0","gw1e1","gw1d","gw1d:h","gw1d:h2","gw1t0","gw1t1"],"Gw2":["gw2e0","gw2e1","gw2d","gw2d:h","gw2d:h2","gw2t0","gw2t1"],"Gw3":["gw3e0","gw3e1","gw3d","gw3d:h","gw3d:h2","gw3t0","gw3t1"]},"moves":{},"route":["区間ごとの傾き","L を掛ける","大きい区間"]}},{"id":"t51s7x","scene":"t51s7x","kind":"u51s7g1","lab":{"gx":"{t} [ms]","gy":"{I} [mA]","gv1":"8","gw1":"5","gw2":"5","gw3":"2"},"viewbox":"143 61 936 598","band":{"want":"コイルの電圧の大きさの最大","known":"$L = 5\\,\\mathrm{H}$、$5\\,\\mathrm{ms}$ で $0 \\to 8\\,\\mathrm{mA}$、一定、$2\\,\\mathrm{ms}$ で $8 \\to 0\\,\\mathrm{mA}$","ans":"$20\\,\\mathrm{V}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、電圧の大きさの最大です。","at":{"強調":1.0},"after":[],"emph":["Line"]},{"text":"①区間ごとの傾き\n②L を掛ける\n③大きい区間\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Line"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"増える区間は、$5\\,\\mathrm{ms}$ で $8\\,\\mathrm{mA}$ 増えます。mA と ms は、そのまま割れば A/s です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Gw1","Gv1","Line"],"eq":[{"cont":false,"items":[["\\dfrac{8}{5} = 1.6\\,\\mathrm{A/s}"]]}],"emphPre":["Gw1","Gv1","Line"]},{"text":"一定の区間は、傾きが 0 です。","at":{"強調":1.0},"after":[],"emph":["Gw2","Line"]},{"text":"減る区間は、$2\\,\\mathrm{ms}$ で $8\\,\\mathrm{mA}$ 減ります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Gw3","Gv1","Line"],"eq":[{"cont":false,"items":[["\\dfrac{8}{2} = 4\\,\\mathrm{A/s}"]]}],"emphPre":["Gw3","Gv1","Line"]},{"text":"〖傾きを比べて、大きい方に次の $L$ を掛けます〗。","at":{"強調":1.0},"after":[],"emph":["Gw3","Line"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"減る区間の傾きに、$L$ を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Gw3","Ax","Line"],"eq":[{"cont":false,"items":[["v = L \\dfrac{\\Delta I}{\\Delta t}"],["v = 5 \\times 4 = 20\\,\\mathrm{V}"]]}],"emphPre":["Gw3","Ax","Line"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"傾きが一番大きい減る区間で、電圧は最大の $20\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["Gw3","Line"]}]}],"groups":{"Ax":["gax","gax:h","gay","gay:h","go","gxt0","gxt1","gyt0","gyt1"],"Line":["gl","gt1d","gt2d"],"Gv1":["gv1d","gv1t0","gv1t1"],"Gw1":["gw1e0","gw1e1","gw1d","gw1d:h","gw1d:h2","gw1t0","gw1t1"],"Gw2":["gw2e0","gw2e1","gw2d","gw2d:h","gw2d:h2","gw2t0","gw2t1"],"Gw3":["gw3e0","gw3e1","gw3d","gw3d:h","gw3d:h2","gw3t0","gw3t1"]},"moves":{},"route":["区間ごとの傾き","L を掛ける","大きい区間"]}},{"id":"t51s8e","scene":"t51s8e","kind":"u51s8cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"},"viewbox":"126 148 823 544","band":{"want":"磁束鎖交数の変化から誘導起電力","ans":"$N \\Delta \\Phi$ を出して $e = \\dfrac{N \\Delta \\Phi}{\\Delta t}$","full":"変わった磁束に巻数を掛けると、磁束鎖交数の変化になる。それを時間で割ると、誘導起電力の大きさになる。mWb は 10⁻³ Wb に直してから計算する。"},"narr":{"start":{"co":1,"pos":0},"steps":[{"cap":null,"eqp":null,"vid":[35,33],"sents":[{"text":"コイルの誘導起電力を、磁束鎖交数から求めます。","at":{"強調":1.0},"after":[],"emph":["E","Cl"]},{"text":"①磁束鎖交数\n②誘導起電力\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"巻数と磁束の積が、磁束鎖交数です。〖変わった磁束に巻数を掛け〗ます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"near","emph":["N","Ph"],"eq":[{"cont":false,"items":[["N \\Delta \\Phi"]]}],"emphPre":["N","Ph"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"それを時間で割ると、誘導起電力です。〖磁束鎖交数の変化が、式の分子〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = \\dfrac{N \\Delta \\Phi}{\\Delta t}"]]}],"ans":true,"emphPre":["E","N","Ph"]}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{"near":{"to":{"pos":1},"dur":1.0}},"route":["磁束鎖交数","誘導起電力"]}},{"id":"t51s8x","scene":"t51s8x","kind":"u51s8cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}=200","e":["{e}","{e}=4 V"]},"viewbox":"126 148 823 544","band":{"want":"誘導起電力の大きさ $e$","known":"$N = 200,\\;\\; \\Delta \\Phi = 10\\,\\mathrm{mWb},\\;\\; \\Delta t = 0.5\\,\\mathrm{s}$","ans":"$e = 4\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pos":1,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、誘導起電力の大きさ $e$ です。","at":{"強調":1.0},"after":[],"emph":["E"]},{"text":"①磁束鎖交数の変化\n②誘導起電力\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"まず $10\\,\\mathrm{mWb}$ を $0.01\\,\\mathrm{Wb}$ に直します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Ph"]},{"text":"巻数を掛けて、磁束鎖交数の変化を出します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["N","Ph"],"eq":[{"cont":false,"items":[["N \\Delta \\Phi = 200 \\times 0.01"],["= 2\\,\\mathrm{Wb}"]]}],"emphPre":["N","Ph"]},{"text":"〖この $2\\,\\mathrm{Wb}$ を、次の式の分子に使います〗。","at":{"強調":1.0},"after":[],"emph":["N","Ph"]}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"時間 $0.5\\,\\mathrm{s}$ で割ると、誘導起電力です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = \\dfrac{N \\Delta \\Phi}{\\Delta t}"],["e = \\dfrac{2}{0.5} = 4\\,\\mathrm{V}"]]}],"move":"ev","ans":true,"emphPre":["E","N","Ph"]}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{"ev":{"to":{"ev":1},"dur":0.4}},"route":["磁束鎖交数の変化","誘導起電力"]}},{"id":"t51s9e","scene":"t51s9e","kind":"u51s9co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}","w":"{W}"},"viewbox":"42 115 732 517","band":{"want":"磁束鎖交数から磁気エネルギー","ans":"$L = \\dfrac{N \\Phi}{I}$ を出して $W = \\dfrac{1}{2} L I^2$","full":"磁束鎖交数を電流で割ると自己インダクタンスになる。その自己インダクタンスを磁気エネルギーの式に入れる。"},"narr":{"start":{"co":1,"id":1,"phid":1},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"磁束鎖交数と電流から、コイルの磁気エネルギーを求めます。","at":{"強調":1.0},"after":[],"emph":["W","N","Phi","I"]},{"text":"①自己インダクタンス\n②磁気エネルギー\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"磁束鎖交数を電流で割ると、自己インダクタンスです。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"]]}],"emphPre":["Ind","N","Phi","I"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖その $L$ を、磁気エネルギーの式に入れ〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["W","Ind","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2"]]}],"ans":true,"emphPre":["W","Ind","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["自己インダクタンス","磁気エネルギー"]}},{"id":"t51s9x","scene":"t51s9x","kind":"u51s9co","lab":{"n":"{N}","i":"{I}=10 A","phi":"{Φ}","phia":"cw","ind":["{L}","{L}=0.004 H"],"w":["{W}","{W}=0.2 J"]},"viewbox":"42 115 732 517","band":{"want":"磁気エネルギー $W$","known":"$N \\Phi = 0.04\\,\\mathrm{Wb},\\;\\; I = 10\\,\\mathrm{A}$","ans":"$W = 0.2\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"id":1,"phid":1,"indv":0,"wv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、コイルに蓄えられる磁気エネルギー $W$ です。","at":{"強調":1.0},"after":[],"emph":["W"]},{"text":"①自己インダクタンス\n②磁気エネルギー\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"磁束鎖交数 $0.04\\,\\mathrm{Wb}$ を、電流 $10\\,\\mathrm{A}$ で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"],["L = \\dfrac{0.04}{10} = 0.004\\,\\mathrm{H}"]]}],"move":"indv","emphPre":["Ind","N","Phi","I"]},{"text":"〖この $0.004\\,\\mathrm{H}$ を、次の式の $L$ に使います〗。","at":{"強調":1.0},"after":[],"emph":["Ind"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"磁気エネルギーの式に入れます。電流を先に2乗します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["W","Ind","I"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} L I^2"],["W = \\dfrac{1}{2} \\times 0.004 \\times 10^2"],["= 0.2\\,\\mathrm{J}"]]}],"move":"wv","ans":true,"emphPre":["W","Ind","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{"indv":{"to":{"indv":1},"dur":0.4},"wv":{"to":{"wv":1},"dur":0.4}},"route":["自己インダクタンス","磁気エネルギー"]}},{"id":"t51s10e","scene":"t51s10e","kind":"u51s10tc","lab":{"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1","l2":"{L}_2","m":"{M}","lt":"{L}","kc":"{k}"},"viewbox":"-112 184 1324 627","band":{"want":"和動接続の合成インダクタンスから結合係数","ans":"$M = \\dfrac{L - L_1 - L_2}{2}$ を出して $k = \\dfrac{M}{\\sqrt{L_1 L_2}}$","full":"和動接続の合成インダクタンスの式から L1 と L2 を引いて 2 で割ると、相互インダクタンス M になる。その M を、相互インダクタンスと結合係数の式に入れて k を出す。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"結合係数を、和動接続の値で求めます。","at":{"強調":1.0},"after":[],"emph":["Lt","Kc"]},{"text":"①相互インダクタンス\n②結合係数\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"和動の式から $L_1$ と $L_2$ を引き、2 で割ると $M$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["M","Lt","L1","L2"],"eq":[{"cont":false,"items":[["M = \\dfrac{L - L_1 - L_2}{2}"]]}],"emphPre":["Lt","L1","L2","M"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"〖その $M$ を、結合係数の式に入れ〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Kc","M","L1","L2"],"eq":[{"cont":false,"items":[["k = \\dfrac{M}{\\sqrt{L_1 L_2}}"]]}],"ans":true,"emphPre":["Kc","M","L1","L2"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","n1t0","n1t1","s1t","s1b"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","s2a","s2b"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Ta":["tma","at0","at1"],"Tb":["tmb","bt0","bt1"],"I":["ia","ia:h","it0","it1"],"Lt":["ltt0","ltt1"]},"moves":{},"route":["相互インダクタンス","結合係数"]}},{"id":"t51s10x","scene":"t51s10x","kind":"u51s10tc","lab":{"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1=0.8 H","l2":"{L}_2=0.2 H","m":["{M}","{M}=0.2 H"],"lt":"{L}=1.4 H","kc":["{k}","{k}=0.5"]},"viewbox":"-112 184 1324 627","band":{"want":"結合係数 $k$","known":"$L_1 = 0.8\\,\\mathrm{H},\\;\\; L_2 = 0.2\\,\\mathrm{H},\\;\\; L = 1.4\\,\\mathrm{H}$（和動）","ans":"$k = 0.5$"},"narr":{"start":{"co":1,"mv":0,"kcv":0},"steps":[{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"求めるのは、結合係数 $k$ です。","at":{"強調":1.0},"after":[],"emph":["Kc"]},{"text":"①相互インダクタンス\n②結合係数\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"和動接続なので、$2M$ を足す式に数を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Lt","L1","L2","M"],"eq":[{"cont":false,"items":[["L = L_1 + L_2 + 2M"],["1.4 = 0.8 + 0.2 + 2M"]]}],"emphPre":["Lt","L1","L2","M"]},{"text":"$2M = 0.4$ なので、$M = 0.2\\,\\mathrm{H}$ です。〖この $M$ を、次の式に使います〗。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"m","emph":["M"]}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"結合係数の式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["Kc","M","L1","L2"],"eq":[{"cont":false,"items":[["k = \\dfrac{M}{\\sqrt{L_1 L_2}}"],["k = \\dfrac{0.2}{\\sqrt{0.8 \\times 0.2}}"],["= \\dfrac{0.2}{0.4} = 0.5"]]}],"move":"k","ans":true,"emphPre":["Kc","M","L1","L2"]}]}],"groups":{"N1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5","n1t0","n1t1","s1t","s1b"],"W1":["w1r0","w1r1","w1r2","w1r3","w1r4","w1r5","w1l0","w1l1","w1l2","w1l3","w1l4","w1l5"],"L1":["l1t0","l1t1"],"N2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","n2t0","n2t1"],"W2":["w2r0","w2r1","w2r2","w2r3","w2r4","w2r5","w2l0","w2l1","w2l2","w2l3","w2l4","w2l5","s2a","s2b"],"L2":["l2t0","l2t1"],"Phi1":["ph1","phh10","phh10:h","phh11","phh11:h","phh12","phh12:h","phh13","phh13:h","phi1t0","phi1t1"],"Phi2":["ph2","phh20","phh20:h","phh21","phh21:h","phh22","phh22:h","phh23","phh23:h","phi2t0","phi2t1"],"M":["mt0","mt1"],"Kc":["kct0","kct1"],"Lk":["lk0","lk1","lkt0","lkt1"],"Mu":["mut0","mut1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Ta":["tma","at0","at1"],"Tb":["tmb","bt0","bt1"],"I":["ia","ia:h","it0","it1"],"Lt":["ltt0","ltt1"]},"moves":{"m":{"to":{"mv":1},"dur":0.4},"k":{"to":{"kcv":1},"dur":0.4}},"route":["相互インダクタンス","結合係数"]}},{"id":"t51s11e","scene":"t51s11e","kind":"u51s11rl","lab":{"r":"{R}","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}","v":"{v}","va":"right","l":"{l}"},"viewbox":"53 123 995 603","band":{"want":"導体棒の起電力から抵抗の電流","ans":"$e = Blv$ を出して $I = \\dfrac{e}{R}$","full":"導体棒の誘導起電力は e = Blv。導体棒とレールと抵抗は1つの閉じた回路なので、その起電力が抵抗にかかり、I = e/R。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"動かした導体棒の起電力から、抵抗の電流を求めます。","at":{"強調":1.0},"after":[],"emph":["Rod","I","R"]},{"text":"①誘導起電力\n②電流\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"導体棒の誘導起電力は、磁束密度・長さ・速さの積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["B","L","V"],"eq":[{"cont":false,"items":[["e = Blv"]]}],"emphPre":["B","L","V"]}]},{"cap":null,"eqp":null,"vid":[33,2],"sents":[{"text":"〖この起電力が、抵抗にかかり〗ます。オームの法則で電流です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["I","R"],"eq":[{"cont":false,"items":[["I = \\dfrac{e}{R}"]]}],"ans":true,"emphPre":["I","R"]}]}],"groups":{"R":["rr","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"Rod":["rod","npt0","npt1","nqt0","nqt1"],"B":["bsc","bsc:t","bt0","bt1"],"V":["va","va:h","vt0","vt1"],"Th":["tha","tht0","tht1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{},"route":["誘導起電力","電流"]}},{"id":"t51s11x","scene":"t51s11x","kind":"u51s11rl","lab":{"r":"{R}=4 Ω","i":["{I}","{I}=0.5 A"],"ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}=0.5 T","v":"10 m/s","va":"right","l":"{l}=0.4 m"},"viewbox":"53 123 995 603","band":{"want":"抵抗の電流 $I$","known":"$B = 0.5\\,\\mathrm{T},\\;\\; l = 0.4\\,\\mathrm{m},\\;\\; v = 10\\,\\mathrm{m/s},\\;\\; R = 4\\,\\Omega$","ans":"$I = 0.5\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、抵抗の電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I","R"]},{"text":"①誘導起電力\n②電流\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"導体棒の誘導起電力を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["B","L","V"],"eq":[{"cont":false,"items":[["e = Blv"],["e = 0.5 \\times 0.4 \\times 10 = 2\\,\\mathrm{V}"]]}],"emphPre":["B","L","V"]},{"text":"〖この起電力が、抵抗にかかる電圧〗です。次の式に使います。","at":{"強調":1.0},"after":[],"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"オームの法則で、電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","R"],"eq":[{"cont":false,"items":[["I = \\dfrac{e}{R}"],["I = \\dfrac{2}{4} = 0.5\\,\\mathrm{A}"]]}],"move":"iv","ans":true,"emphPre":["I","R"]}]}],"groups":{"R":["rr","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"Rod":["rod","npt0","npt1","nqt0","nqt1"],"B":["bsc","bsc:t","bt0","bt1"],"V":["va","va:h","vt0","vt1"],"Th":["tha","tht0","tht1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{"iv":{"to":{"iv":1},"dur":0.4}},"route":["誘導起電力","電流"]}},{"id":"t51s12e","scene":"t51s12e","kind":"u51s12co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","ind":"{L}"},"viewbox":"21 114 753 518","band":{"want":"式から磁気の量の単位","ans":"$L = \\dfrac{N \\Phi}{I}$ から $\\mathrm{H} = \\mathrm{Wb/A}$","full":"式の量を単位に置き換えて約分すると、分からない量の単位が出る。巻数は単位なし。"},"narr":{"start":{"co":1,"id":1,"phid":1},"steps":[{"cap":null,"eqp":null,"vid":[6,35],"sents":[{"text":"式の量を単位に置き換えると、磁気の量の単位が出ます。","at":{"強調":1.0},"after":[],"emph":["Ind"]},{"text":"①式を書く\n②単位に置き換える\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[35],"sents":[{"text":"自己インダクタンスの式です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ind","N","Phi","I"],"eq":[{"cont":false,"items":[["L = \\dfrac{N \\Phi}{I}"]]}],"emphPre":["Ind","N","Phi","I"]}]},{"cap":null,"eqp":null,"vid":[6,34],"sents":[{"text":"巻数は単位なしなので、〖磁束の単位を電流の単位で割り〗ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Ind","Phi","I"],"eq":[{"cont":false,"items":[["\\mathrm{H} = \\dfrac{\\mathrm{Wb}}{\\mathrm{A}}"]]}],"ans":true,"emphPre":["Ind","Phi","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["式を書く","単位に置き換える"]}},{"id":"t51s12x","scene":"t51s12x","kind":"u51s12cm","lab":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"},"viewbox":"126 148 788 544","band":{"want":"磁束の単位 Wb を V と s で","ans":"$\\mathrm{Wb} = \\mathrm{V} \\cdot \\mathrm{s}$"},"narr":{"start":{"co":1,"pos":1},"steps":[{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"求めるのは、磁束の単位 Wb を、V と s で表した形です。","at":{"強調":1.0},"after":[],"emph":["Ph"]},{"text":"①式を書く\n②単位に置き換える\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[33],"sents":[{"text":"V と s と Wb が出てくるのは、ファラデーの法則です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","N","Ph"],"eq":[{"cont":false,"items":[["e = N \\dfrac{\\Delta \\Phi}{\\Delta t}"]]}],"emphPre":["E","N","Ph"]}]},{"cap":null,"eqp":null,"vid":[6,33],"sents":[{"text":"量を単位に置き換えます。巻数は単位なしです。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E","Ph"],"eq":[{"cont":false,"items":[["\\mathrm{V} = \\dfrac{\\mathrm{Wb}}{\\mathrm{s}}"]]}],"emphPre":["E","Ph"]},{"text":"〖両辺に s を掛け〗ます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["Ph"],"eq":[{"cont":false,"items":[["\\mathrm{Wb} = \\mathrm{V} \\cdot \\mathrm{s}"]]}],"ans":true,"emphPre":["Ph"]}]}],"groups":{"Mg":["mga","mgat","mgb","mgbt","mgt0","mgt1"],"Go":["goa","goa:h","got0","got1"],"Ph":["phf0","phn0","phf1","phn1","phf2","phn2","pht0","pht1"],"Cl":["clb","clf","cl0","cl1","clt0","clt1"],"Ip":["ipa","ipa:h","ipt0","ipt1"],"I":["ih0","ih0:h","ih1","ih1:h","it0","it1"],"N":["nt0","nt1"],"E":["ea","ea:h","et0","et1"]},"moves":{},"route":["式を書く","単位に置き換える"]}},{"id":"t51s13e","scene":"t51s13e","kind":"u51s13pa","lab":{"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","f2":"{F}","f2a":"in"},"viewbox":"222 148 699 666","band":{"want":"文が正しいか、誤っているか","ans":"文を1つずつ、習った式と照らす","full":"文を1つずつ、どの節の決まりかを思い出し、習った式と照らす。比例・反比例・2乗は、式の分子か分母か・2乗が付くかで見る。"},"narr":{"start":{"co":1,"f2d":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"文が正しいか、誤っているかは、文を1つずつ、習った式と照らします。","at":{"強調":1.0},"after":[],"emph":["I1","I2","F2"]},{"text":"①どの決まりか\n②式と照らす\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"たとえば、平行な2本の導体に働く力の文なら、この式です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{\\mu I_1 I_2 l}{2 \\pi r}"]]}],"emphPre":["F2","I1","I2","L","R"]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"比例・反比例は、〖式の分子か分母か〗で見ます。2乗が付くかも見ます。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["R","F2"],"ans":true}]}],"groups":{"I1":["w1","ia1","ia1:h","i1t0","i1t1"],"I2":["w2","w2b","ia2","ia2:h","i2t0","i2t1"],"H2":["h2c","h2c:t","h2t0","h2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{},"route":["どの決まりか","式と照らす"]}},{"id":"t51s13x","scene":"t51s13x","kind":"u51s13pa","lab":{"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","f2":"{F}","f2a":"in"},"viewbox":"222 148 699 666","band":{"want":"誤っている文","ans":"(2)（力は距離に反比例する）"},"narr":{"start":{"co":1,"f2d":1},"steps":[{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"誤っている文を、1つ選びます。","at":{"強調":1.0},"after":[],"emph":["I1","I2"]},{"text":"①文を1つずつ\n②式と照らす\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[32,31],"sents":[{"text":"(1) 直線の導体の磁界は、距離に反比例します。正しい文です。","at":{"道筋":1.0},"after":[],"route":1},{"text":"(3) フレミングの左手の法則の親指は、力の向きです。正しい文です。","at":{},"after":[]},{"text":"(4) 磁力線の密度は、その点の磁界の強さです。正しい文です。","at":{},"after":[]}]},{"cap":null,"eqp":null,"vid":[32],"sents":[{"text":"(2) 平行な2本の導体に働く力の式と照らします。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["F2","I1","I2","L","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{\\mu I_1 I_2 l}{2 \\pi r}"]]}],"emphPre":["F2","I1","I2","L","R"]},{"text":"〖距離 $r$ は2乗でない〗ので、力は距離に反比例します。(2) が誤りです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["R","F2"]}]}],"groups":{"I1":["w1","ia1","ia1:h","i1t0","i1t1"],"I2":["w2","w2b","ia2","ia2:h","i2t0","i2t1"],"H2":["h2c","h2c:t","h2t0","h2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"],"L":["le1","le2","ld","ld:h","ld:h2","lt0","lt1"]},"moves":{},"route":["文を1つずつ","式と照らす"]}},{"id":"t51s14e","scene":"t51s14e","kind":"u51s14co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}","rm":"{R}_m"},"viewbox":"42 113 802 614","band":{"want":"文が正しいか、誤っているか","ans":"文を1つずつ、習った式と照らす","full":"文を1つずつ、どの節の決まりかを思い出し、習った式と照らす。比例・反比例は、式の分子か分母かで見る。磁気回路の文は、電気回路に置き換えて照らす。"},"narr":{"start":{"co":1,"phid":1,"ld":1,"sd":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"文が正しいか、誤っているかは、文を1つずつ、習った式と照らします。","at":{"強調":1.0},"after":[],"emph":["Rm"]},{"text":"①どの決まりか\n②式と照らす\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"たとえば、磁気抵抗の文なら、この式です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Rm","L","Mu","S"],"eq":[{"cont":false,"items":[["R_m = \\dfrac{l}{\\mu S}"]]}],"emphPre":["Rm","L","Mu","S"]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"比例・反比例は、〖式の分子か分母か〗で見ます。磁気回路の文は、電気回路に置き換えて見ます。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["Rm","L","S"],"ans":true}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["どの決まりか","式と照らす"]}},{"id":"t51s14x","scene":"t51s14x","kind":"u51s14co","lab":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}","rm":"{R}_m"},"viewbox":"42 113 802 614","band":{"want":"誤っている文","ans":"(2)（起磁力は起電力にあたる）"},"narr":{"start":{"co":1,"phid":1,"ld":1,"sd":1},"steps":[{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"誤っている文を、1つ選びます。","at":{"強調":1.0},"after":[],"emph":["N","I","Rm"]},{"text":"①文を1つずつ\n②電気回路と照らす\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[34,35],"sents":[{"text":"(1) 磁気抵抗の式で、断面積 $S$ は分母です。正しい文です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Rm","S"]},{"text":"(3) 自己インダクタンスは、巻数の2乗に比例します。正しい文です。","at":{"強調":1.0},"after":[],"emph":["N"]},{"text":"(4) 相互インダクタンスは、結合係数が 1 の時に最大です。正しい文です。","at":{},"after":[]}]},{"cap":null,"eqp":null,"vid":[34],"sents":[{"text":"(2) 磁気回路を、電気回路に置き換えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["N","I","Phi","Rm"]},{"text":"起磁力は起電力、磁束は電流、磁気抵抗は抵抗にあたります。〖起磁力は電流ではない〗ので、(2) が誤りです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["N","I"]}]}],"groups":{"Core":["core"],"N":["cw0","cw1","cw2","cw3","cw4","cw5","cw6","nt0","nt1","ld0","ld1","cn1_0","cn1_1","cn1_2","cn1_3","cn1_4","cn1_5","cn2_0","cn2_1","cn2_2","cn2_3","cn2_4","cn2_5","cn2_6","cn2_7","cn2_8","cn2_9","cn2_10","cn2_11","cn4_0","cn4_1","cn4_2","cn4_3","cn4_4","cn4_5","cn4_6","cn4_7","cn4_8","cn4_9","cn4_10","cn4_11","cn4_12","cn4_13","cn4_14","cn4_15","cn4_16","cn4_17","cn4_18","cn4_19","cn4_20","cn4_21","cn4_22","cn4_23"],"I":["ia","ia:h","it0","it1"],"Phi":["phl","phh0","phh0:h","phh1","phh1:h","phh2","phh2:h","phh3","phh3:h","phit0","phit1"],"L":["ll","lt0","lt1"],"S":["sq","st0","st1"],"Mu":["mut0","mut1"],"Rm":["rmt0","rmt1"],"E":["ee1","ee2","ea","ea:h","et0","et1"],"Ind":["indt0","indt1"],"W":["wt0","wt1"]},"moves":{},"route":["文を1つずつ","電気回路と照らす"]}}],"secs":[{"ex":{"text":"図のように、平行な導体 A と B が $4\\,\\mathrm{m}$ 離れています。A には上向きに $6\\,\\mathrm{A}$、B には下向きに $6\\,\\mathrm{A}$ の電流が流れています。A と B の間の点 P は、A から $1\\,\\mathrm{m}$ です。P の磁界の強さは何 A/m ですか。","fig":{"kind":"u51s1wm","L":{"wa":"A","wb":"B","p":"P","ia":"6 A","iaa":"up","ib":"6 A","iba":"down","dpa":"1 m","dab":"4 m"},"P":{}},"ch":[{"t":"$\\dfrac{2}{\\pi}\\,\\mathrm{A/m}$","v":2,"why":"2つの磁界を逆向きと読んで引いた（右ねじで向きを決める）"},{"t":"$\\dfrac{4}{\\pi}\\,\\mathrm{A/m}$","v":4,"why":""},{"t":"$\\dfrac{3}{\\pi}\\,\\mathrm{A/m}$","v":3,"why":"A がつくる磁界で止めた（B の磁界を足していない）"},{"t":"$\\dfrac{1}{\\pi}\\,\\mathrm{A/m}$","v":1,"why":"B がつくる磁界だけを出した（A の磁界を足していない）"}],"ans":1}},{"ex":{"text":"図のように、同じ直線の上で、点 A の左 $1\\,\\mathrm{m}$ に N 極、右 $2\\,\\mathrm{m}$ に同じ強さの S 極があります。N 極が $1\\,\\mathrm{m}$ 離れた点につくる磁界の強さは $8\\,\\mathrm{A/m}$ です。A の磁界の強さは何 A/m ですか。","fig":{"kind":"u51s2pb","L":{"na":"A","nb":"N","nc":"S","d1":"1 m","d2":"2 m"},"P":{}},"ch":[{"t":"$6\\,\\mathrm{A/m}$","v":6,"why":"S 極の磁界の向きを逆に取って引いた（磁界は S 極へ入る）"},{"t":"$10\\,\\mathrm{A/m}$","v":10,"why":""},{"t":"$8\\,\\mathrm{A/m}$","v":8,"why":"N 極の磁界で止めた（S 極の磁界を足していない）"},{"t":"$2\\,\\mathrm{A/m}$","v":2,"why":"S 極の磁界だけを出した（N 極の磁界を足していない）"}],"ans":1}},{"ex":{"text":"図1の直線の導体から $2\\,\\mathrm{m}$ 離れた点 P の磁界と、図2の半径 $2\\,\\mathrm{m}$・1回巻きの円形コイルに $6\\,\\mathrm{A}$ を流した時の中心の磁界が等しくなりました。直線の導体の電流は何 A ですか。","fig":{"kind":"u51s3sc","L":{"p":"P","o":"O","i1":"{I}_1","i1a":"up","a":"2 m","i":"6 A","ia":"ccw","r":"2 m"},"P":{}},"ch":[{"t":"$6\\,\\mathrm{A}$","v":6,"why":"等しく置かず、直線の導体にも同じ電流が流れるとした"},{"t":"$1.5\\,\\mathrm{A}$","v":1.5,"why":"円形コイルの中心の磁界の値で止めた（等しく置いて $I_1$ を出していない）"},{"t":"$6\\pi\\,\\mathrm{A}$","v":18.85,"why":""},{"t":"$12\\pi\\,\\mathrm{A}$","v":37.7,"why":"円形コイルの中心の磁界を $\\dfrac{NI}{r}$ とした（2 で割る）"}],"ans":2}},{"ex":{"text":"図のように、真空中で $0.2\\,\\mathrm{m}$ 離れた平行な2本の導体の一方に $10\\,\\mathrm{A}$ を流すと、$1\\,\\mathrm{m}$ あたり $4 \\times 10^{-5}\\,\\mathrm{N}$ の力が働きました。もう一方の電流は何 A ですか。真空中の透磁率は $\\mu_0 = 4 \\pi \\times 10^{-7}\\,\\mathrm{H/m}$ とします。","fig":{"kind":"u51s4pa","L":{"ia1":"up","ia2":"up","h2":"","h2a":"back","f2":"{F}","f2a":"in","l":"1 m","i1":"{I}_1=10 A","i2":"{I}_2","r":"0.2 m"},"P":{}},"ch":[{"t":"$20\\,\\mathrm{A}$","v":20,"why":"距離 $0.2\\,\\mathrm{m}$ を掛けていない"},{"t":"$40\\,\\mathrm{A}$","v":40,"why":"$10\\,\\mathrm{A}$ で割っていない"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":""},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"$\\dfrac{\\mu_0}{2 \\pi}$ を $\\dfrac{\\mu_0}{\\pi}$ とした（$2 \\times 10^{-7}$ でなく $4 \\times 10^{-7}$）"}],"ans":2}},{"ex":{"text":"図のように、導体 A の右に導体 B を置き、どちらにも奥向きの電流を流しました。B に働く力の向きはどれですか。","fig":{"kind":"u51s5xs","L":{"c1":"A","c2":"B","ca1":"back","ca2":"back","i1":"{I}","i2":"{I}"},"P":{}},"ch":[{"t":"下向き","v":"down","why":"A がつくる磁界の向きで止めた（左手で力の向きを出していない）"},{"t":"力は働かない","v":"none","why":"B の所の、A がつくる磁界を考えていない"},{"t":"左向き（A へ向かう）","v":"left","why":""},{"t":"右向き（A から離れる）","v":"right","why":"左手の指の向きを取り違えた（中指が電流・人差し指が磁界）"}],"ans":2}},{"ex":{"text":"図のように、磁路の長さ $0.5\\,\\mathrm{m}$ の環状ソレノイドの鉄心に巻数 200 のコイルを巻き、$2\\,\\mathrm{A}$ を流しました。鉄心の透磁率は $2 \\times 10^{-3}\\,\\mathrm{H/m}$ です。鉄心の中の磁束密度は何 T ですか。","fig":{"kind":"u51s6tr","L":{"mu":"{μ}","l":"{l}=0.5 m","n":"{N}=200","i":"{I}=2 A","ia":"in"},"P":{}},"ch":[{"t":"$0.8\\,\\mathrm{T}$","v":0.8,"why":"磁路の長さで割っていない"},{"t":"$1.6\\,\\mathrm{T}$","v":1.6,"why":""},{"t":"$0.008\\,\\mathrm{T}$","v":0.008,"why":"巻数を掛けていない"},{"t":"$4 \\times 10^{5}\\,\\mathrm{T}$","v":400000,"why":"透磁率で割った（$B = \\mu H$ は掛ける）"}],"ans":1}},{"ex":{"text":"自己インダクタンス $5\\,\\mathrm{H}$ のコイルの電流が、図のように $5\\,\\mathrm{ms}$ で 0 から $8\\,\\mathrm{mA}$ に増え、しばらく一定のあと $2\\,\\mathrm{ms}$ で 0 に減りました。コイルの電圧の大きさの最大は何 V ですか。","fig":{"kind":"u51s7g1","L":{"gx":"{t} [ms]","gy":"{I} [mA]","gv1":"8","gw1":"5","gw2":"5","gw3":"2"},"P":{}},"ch":[{"t":"$8\\,\\mathrm{V}$","v":8,"why":"傾きを比べず、増える区間で止めた（傾きが大きい区間で最大）"},{"t":"$20\\,\\mathrm{V}$","v":20,"why":""},{"t":"$4\\,\\mathrm{V}$","v":4,"why":"傾きで止めた（$L$ を掛けていない）"},{"t":"$0.02\\,\\mathrm{V}$","v":0.02,"why":"ms を s に直していない"}],"ans":1}},{"ex":{"text":"巻数 200 のコイルに鎖交する磁束が、$0.5\\,\\mathrm{s}$ の間に $10\\,\\mathrm{mWb}$ 増えました。誘導起電力の大きさは何 V ですか。","fig":{"kind":"u51s8cm","L":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}=200","e":"{e}"},"P":{}},"ch":[{"t":"$2\\,\\mathrm{V}$","v":2,"why":"磁束鎖交数の変化 $2\\,\\mathrm{Wb}$ で止めた（時間で割っていない）"},{"t":"$0.02\\,\\mathrm{V}$","v":0.02,"why":"巻数を掛けていない（磁束鎖交数を出していない）"},{"t":"$4\\,\\mathrm{V}$","v":4,"why":""},{"t":"$1\\,\\mathrm{V}$","v":1,"why":"時間で割るところを掛けた"}],"ans":2}},{"ex":{"text":"コイルに $10\\,\\mathrm{A}$ の電流を流すと、磁束鎖交数 $N \\Phi$ は $0.04\\,\\mathrm{Wb}$ でした。コイルに蓄えられる磁気エネルギーは何 J ですか。","fig":{"kind":"u51s9co","L":{"n":"{N}","i":"{I}=10 A","phi":"{Φ}","phia":"cw","ind":"{L}","w":"{W}"},"P":{}},"ch":[{"t":"$0.004\\,\\mathrm{J}$","v":0.004,"why":"自己インダクタンス $0.004\\,\\mathrm{H}$ で止めた（磁気エネルギーを出していない）"},{"t":"$2\\,\\mathrm{J}$","v":2,"why":"磁束鎖交数をそのまま $L$ とした（自己インダクタンスを出していない）"},{"t":"$0.2\\,\\mathrm{J}$","v":0.2,"why":""},{"t":"$0.4\\,\\mathrm{J}$","v":0.4,"why":"$\\dfrac{1}{2}$ を掛けていない"}],"ans":2}},{"ex":{"text":"自己インダクタンス $L_1 = 0.8\\,\\mathrm{H}$ と $L_2 = 0.2\\,\\mathrm{H}$ のコイルを、和動接続になるように直列につなぐと、合成インダクタンスは $1.4\\,\\mathrm{H}$ でした。結合係数はいくらですか。","fig":{"kind":"u51s10tc","L":{"ser":true,"w1":"r","w2":"r","j2":"bot","a":"a","b":"b","i":"{I}","l1":"{L}_1=0.8 H","l2":"{L}_2=0.2 H","m":"{M}","lt":"{L}=1.4 H","kc":"{k}"},"P":{}},"ch":[{"t":"$0.2$","v":0.2,"why":"相互インダクタンス $M = 0.2\\,\\mathrm{H}$ で止めた（結合係数を出していない）"},{"t":"$0.4$","v":0.4,"why":"$2M$ で止めた（2 で割っていない）"},{"t":"$0.5$","v":0.5,"why":""},{"t":"$1.25$","v":1.25,"why":"$\\sqrt{\\;}$ をとらなかった"}],"ans":2}},{"ex":{"text":"図のように、磁束密度 $0.5\\,\\mathrm{T}$ の磁界の中で、長さ $0.4\\,\\mathrm{m}$ の導体棒を $10\\,\\mathrm{m/s}$ で動かします。レールの端に $4\\,\\Omega$ の抵抗があります。抵抗の電流は何 A ですか。","fig":{"kind":"u51s11rl","L":{"r":"{R}=4 Ω","i":"{I}","ia":"down","np":"P","nq":"Q","bs":"back","b":"{B}=0.5 T","v":"10 m/s","va":"right","l":"{l}=0.4 m"},"P":{}},"ch":[{"t":"$2\\,\\mathrm{A}$","v":2,"why":"誘導起電力 $2\\,\\mathrm{V}$ で止めた（抵抗で割っていない）"},{"t":"$0.05\\,\\mathrm{A}$","v":0.05,"why":"速さを掛けていない（誘導起電力を出していない）"},{"t":"$0.5\\,\\mathrm{A}$","v":0.5,"why":""},{"t":"$8\\,\\mathrm{A}$","v":8,"why":"抵抗で割るところを掛けた"}],"ans":2}},{"ex":{"text":"磁束の単位 Wb を、V と s で表すとどれですか。","fig":{"kind":"u51s12cm","L":{"mg":"","mgs":"N","ph":"{Φ}","cl":"","n":"{N}","e":"{e}"},"P":{}},"ch":[{"t":"$\\mathrm{V/s}$","v":"Vds","why":"$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ から $\\mathrm{V} = \\mathrm{Wb/s}$。時間は掛ける（22-3）"},{"t":"$\\mathrm{V} \\cdot \\mathrm{s}$","v":"Vs","why":""},{"t":"$\\mathrm{V}$","v":"V","why":"$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ の時間を落とした（22-3）"},{"t":"$\\mathrm{s}$","v":"s","why":"$e = N \\dfrac{\\Delta \\Phi}{\\Delta t}$ の起電力を落とした（22-3）"}],"ans":1}},{"ex":{"text":"次のうち、誤っているものはどれですか。","fig":{"kind":"u51s13pa","L":{"i1":"{I}_1","ia1":"up","i2":"{I}_2","ia2":"up","r":"{r}","l":"{l}","f2":"{F}","f2a":"in"},"P":{}},"ch":[{"t":"直線の導体のまわりの磁界の強さは、導体からの距離に反比例する","v":"t0","why":"正しい文（20-2）"},{"t":"平行な2本の導体に働く力は、導体の間の距離の2乗に反比例する","v":"f0","why":""},{"t":"フレミングの左手の法則で、親指は力の向きを表す","v":"t1","why":"正しい文（21-2）"},{"t":"磁力線の密度は、その点の磁界の強さを表す","v":"t2","why":"正しい文（19-4）"}],"ans":1}},{"ex":{"text":"次のうち、誤っているものはどれですか。","fig":{"kind":"u51s14co","L":{"n":"{N}","i":"{I}","phi":"{Φ}","phia":"cw","l":"{l}","s":"{S}","mu":"{μ}","rm":"{R}_m"},"P":{}},"ch":[{"t":"磁気抵抗は、鉄心の断面積に反比例する","v":"t0","why":"正しい文（23-2）"},{"t":"磁気回路の起磁力は、電気回路の電流にあたる","v":"f0","why":""},{"t":"自己インダクタンスは、巻数の2乗に比例する","v":"t5","why":"正しい文（24-4）"},{"t":"相互インダクタンスの最大は $\\sqrt{L_1 L_2}$ である","v":"t6","why":"正しい文（25-3）"}],"ans":1}}],"past":[]}};
});
