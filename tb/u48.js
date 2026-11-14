/* 単元48「静電気のつなぎ（2つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(48, function(H){
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
// ---- 48-1 誘電体を直列・並列と読む の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S1K = {
  l11: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,430],[300,430]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[316,365,"start",[0,-1]],[550,365,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":316,"y":365,"anc":"start"},{"f":"ln","id":"m2f","pts":[[300,430],[800,430],[800,555],[300,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,495,"start",[0,-1]],[550,495,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":316,"y":495,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,430],[800,430]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":322,"x1":510,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":322,"x1":580,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":322,"x1":650,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":322,"x1":720,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,365,"start",[1,0]],[492,365,"end",[-1,0]],[615,365,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[],"t":"F","x":738,"y":365,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,430],[984,430]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":430,"two":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,365,"start",[1,0]],[954,365,"end",[-1,0]]],"need":"t1","vis":[],"t":"F","x":986,"y":365,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":426,"x1":230,"y1":304,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,365,"end",[-1,0]],[246,365,"start",[1,0]]],"need":"v1","vis":[],"t":"F","x":214,"y":365,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":452,"x1":510,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":452,"x1":580,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":452,"x1":650,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":452,"x1":720,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,495,"start",[1,0]],[492,495,"end",[-1,0]],[615,495,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[],"t":"F","x":738,"y":495,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,430],[984,430]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":430,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,495,"start",[1,0]],[954,495,"end",[-1,0]]],"need":"t2","vis":[],"t":"F","x":986,"y":495,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":434,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,495,"end",[-1,0]],[246,495,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":214,"y":495,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  l12: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,386.67],[300,386.67]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[316,343.33,"start",[0,-1]],[550,343.33,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":316,"y":343.33,"anc":"start"},{"f":"ln","id":"m2f","pts":[[300,386.67],[800,386.67],[800,555],[300,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,473.33,"start",[0,-1]],[550,473.33,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":316,"y":473.33,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,386.67],[800,386.67]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":315.6,"x1":510,"y1":371.07,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":315.6,"x1":580,"y1":371.07,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":315.6,"x1":650,"y1":371.07,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":315.6,"x1":720,"y1":371.07,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,343.33,"start",[1,0]],[492,343.33,"end",[-1,0]],[615,343.33,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[],"t":"F","x":738,"y":343.33,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,386.67],[984,386.67]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":386.67,"two":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,343.33,"start",[1,0]],[954,343.33,"end",[-1,0]]],"need":"t1","vis":[],"t":"F","x":986,"y":343.33,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":382.67,"x1":230,"y1":304,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,343.33,"end",[-1,0]],[246,343.33,"start",[1,0]]],"need":"v1","vis":[],"t":"F","x":214,"y":343.33,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":408.67,"x1":510,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":408.67,"x1":580,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":408.67,"x1":650,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":408.67,"x1":720,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,473.33,"start",[1,0]],[492,473.33,"end",[-1,0]],[615,473.33,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[],"t":"F","x":738,"y":473.33,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,386.67],[984,386.67]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":386.67,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,473.33,"start",[1,0]],[954,473.33,"end",[-1,0]]],"need":"t2","vis":[],"t":"F","x":986,"y":473.33,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":390.67,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,473.33,"end",[-1,0]],[246,473.33,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":214,"y":473.33,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  l21: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,473.33],[300,473.33]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[316,386.67,"start",[0,-1]],[550,386.67,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":316,"y":386.67,"anc":"start"},{"f":"ln","id":"m2f","pts":[[300,473.33],[800,473.33],[800,555],[300,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,516.67,"start",[0,-1]],[550,516.67,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":316,"y":516.67,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,473.33],[800,473.33]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":322,"x1":510,"y1":451.33,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":322,"x1":580,"y1":451.33,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":322,"x1":650,"y1":451.33,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":322,"x1":720,"y1":451.33,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,386.67,"start",[1,0]],[492,386.67,"end",[-1,0]],[615,386.67,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[],"t":"F","x":738,"y":386.67,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,473.33],[984,473.33]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":473.33,"two":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,386.67,"start",[1,0]],[954,386.67,"end",[-1,0]]],"need":"t1","vis":[],"t":"F","x":986,"y":386.67,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":469.33,"x1":230,"y1":304,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,386.67,"end",[-1,0]],[246,386.67,"start",[1,0]]],"need":"v1","vis":[],"t":"F","x":214,"y":386.67,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":488.93,"x1":510,"y1":544.4,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":488.93,"x1":580,"y1":544.4,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":488.93,"x1":650,"y1":544.4,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":488.93,"x1":720,"y1":544.4,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,516.67,"start",[1,0]],[492,516.67,"end",[-1,0]],[615,516.67,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[],"t":"F","x":738,"y":516.67,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,473.33],[984,473.33]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":473.33,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,516.67,"start",[1,0]],[954,516.67,"end",[-1,0]]],"need":"t2","vis":[],"t":"F","x":986,"y":516.67,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":477.33,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,516.67,"end",[-1,0]],[246,516.67,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":214,"y":516.67,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  c11: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[550,305],[550,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[425,430,"middle",[0,-1]],[314,330,"start",[0,-1]],[536,546,"end",[0,1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":425,"y":430,"anc":"middle"},{"f":"ln","id":"m2f","pts":[[550,305],[800,305],[800,555],[550,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[675,430,"middle",[0,-1]],[564,330,"start",[0,-1]],[786,546,"end",[0,1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":675,"y":430,"anc":"middle"},{"f":"ln","id":"cut1","pts":[[550,306],[550,554]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":274,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":534,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,136]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,136]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":150,"x1":800,"y1":150,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,110,"middle",[0,-1]],[550,190,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":110,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ln","id":"s1e1","pts":[[300,288],[300,216]],"w":2,"need":"s1","vis":[],"t":"F"},{"f":"ln","id":"s1e2","pts":[[550,288],[550,216]],"w":2,"need":"s1","vis":[],"t":"F"},{"f":"ar","id":"s1d","x0":300,"y0":230,"x1":550,"y1":230,"two":1,"w":2,"need":"s1","vis":[],"t":"F"},{"f":"lb","id":"s1t","k":"s1","bases":[[425,190,"middle",[0,-1]],[425,270,"middle",[0,1]]],"need":"s1","vis":[],"t":"F","x":425,"y":190,"anc":"middle"},{"f":"lb","id":"c1t","k":"c1","bases":[[425,604,"middle",[0,1]],[425,660,"middle",[0,1]]],"need":"c1","vis":[],"t":"F","x":425,"y":604,"anc":"middle"},{"f":"ln","id":"s2e1","pts":[[550,288],[550,216]],"w":2,"need":"s2","vis":[],"t":"F"},{"f":"ln","id":"s2e2","pts":[[800,288],[800,216]],"w":2,"need":"s2","vis":[],"t":"F"},{"f":"ar","id":"s2d","x0":550,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s2","vis":[],"t":"F"},{"f":"lb","id":"s2t","k":"s2","bases":[[675,190,"middle",[0,-1]],[675,270,"middle",[0,1]]],"need":"s2","vis":[],"t":"F","x":675,"y":190,"anc":"middle"},{"f":"lb","id":"c2t","k":"c2","bases":[[675,604,"middle",[0,1]],[675,660,"middle",[0,1]]],"need":"c2","vis":[],"t":"F","x":675,"y":604,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  c12: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[466.67,305],[466.67,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[383.33,430,"middle",[0,-1]],[314,330,"start",[0,-1]],[452.67,546,"end",[0,1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":383.33,"y":430,"anc":"middle"},{"f":"ln","id":"m2f","pts":[[466.67,305],[800,305],[800,555],[466.67,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[633.33,430,"middle",[0,-1]],[480.67,330,"start",[0,-1]],[786,546,"end",[0,1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":633.33,"y":430,"anc":"middle"},{"f":"ln","id":"cut1","pts":[[466.67,306],[466.67,554]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":274,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":534,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,136]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,136]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":150,"x1":800,"y1":150,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,110,"middle",[0,-1]],[550,190,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":110,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ln","id":"s1e1","pts":[[300,288],[300,216]],"w":2,"need":"s1","vis":[],"t":"F"},{"f":"ln","id":"s1e2","pts":[[466.67,288],[466.67,216]],"w":2,"need":"s1","vis":[],"t":"F"},{"f":"ar","id":"s1d","x0":300,"y0":230,"x1":466.67,"y1":230,"two":1,"w":2,"need":"s1","vis":[],"t":"F"},{"f":"lb","id":"s1t","k":"s1","bases":[[383.33,190,"middle",[0,-1]],[383.33,270,"middle",[0,1]]],"need":"s1","vis":[],"t":"F","x":383.33,"y":190,"anc":"middle"},{"f":"lb","id":"c1t","k":"c1","bases":[[383.33,604,"middle",[0,1]],[383.33,660,"middle",[0,1]]],"need":"c1","vis":[],"t":"F","x":383.33,"y":604,"anc":"middle"},{"f":"ln","id":"s2e1","pts":[[466.67,288],[466.67,216]],"w":2,"need":"s2","vis":[],"t":"F"},{"f":"ln","id":"s2e2","pts":[[800,288],[800,216]],"w":2,"need":"s2","vis":[],"t":"F"},{"f":"ar","id":"s2d","x0":466.67,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s2","vis":[],"t":"F"},{"f":"lb","id":"s2t","k":"s2","bases":[[633.33,190,"middle",[0,-1]],[633.33,270,"middle",[0,1]]],"need":"s2","vis":[],"t":"F","x":633.33,"y":190,"anc":"middle"},{"f":"lb","id":"c2t","k":"c2","bases":[[633.33,604,"middle",[0,1]],[633.33,660,"middle",[0,1]]],"need":"c2","vis":[],"t":"F","x":633.33,"y":604,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  c21: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[633.33,305],[633.33,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[466.67,430,"middle",[0,-1]],[314,330,"start",[0,-1]],[619.33,546,"end",[0,1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":466.67,"y":430,"anc":"middle"},{"f":"ln","id":"m2f","pts":[[633.33,305],[800,305],[800,555],[633.33,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[716.67,430,"middle",[0,-1]],[647.33,330,"start",[0,-1]],[786,546,"end",[0,1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":716.67,"y":430,"anc":"middle"},{"f":"ln","id":"cut1","pts":[[633.33,306],[633.33,554]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":274,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":534,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,136]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,136]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":150,"x1":800,"y1":150,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,110,"middle",[0,-1]],[550,190,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":110,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ln","id":"s1e1","pts":[[300,288],[300,216]],"w":2,"need":"s1","vis":[],"t":"F"},{"f":"ln","id":"s1e2","pts":[[633.33,288],[633.33,216]],"w":2,"need":"s1","vis":[],"t":"F"},{"f":"ar","id":"s1d","x0":300,"y0":230,"x1":633.33,"y1":230,"two":1,"w":2,"need":"s1","vis":[],"t":"F"},{"f":"lb","id":"s1t","k":"s1","bases":[[466.67,190,"middle",[0,-1]],[466.67,270,"middle",[0,1]]],"need":"s1","vis":[],"t":"F","x":466.67,"y":190,"anc":"middle"},{"f":"lb","id":"c1t","k":"c1","bases":[[466.67,604,"middle",[0,1]],[466.67,660,"middle",[0,1]]],"need":"c1","vis":[],"t":"F","x":466.67,"y":604,"anc":"middle"},{"f":"ln","id":"s2e1","pts":[[633.33,288],[633.33,216]],"w":2,"need":"s2","vis":[],"t":"F"},{"f":"ln","id":"s2e2","pts":[[800,288],[800,216]],"w":2,"need":"s2","vis":[],"t":"F"},{"f":"ar","id":"s2d","x0":633.33,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s2","vis":[],"t":"F"},{"f":"lb","id":"s2t","k":"s2","bases":[[716.67,190,"middle",[0,-1]],[716.67,270,"middle",[0,1]]],"need":"s2","vis":[],"t":"F","x":716.67,"y":190,"anc":"middle"},{"f":"lb","id":"c2t","k":"c2","bases":[[716.67,604,"middle",[0,1]],[716.67,660,"middle",[0,1]]],"need":"c2","vis":[],"t":"F","x":716.67,"y":604,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  rg: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,430],[300,430]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[550,365,"middle",[0,-1]],[314,330,"start",[0,-1]],[786,416,"end",[0,1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":550,"y":365,"anc":"middle"},{"f":"ln","id":"m2f","pts":[[300,430],[550,430],[550,555],[300,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[425,495,"middle",[0,-1]],[314,460,"start",[0,-1]],[536,546,"end",[0,1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":425,"y":495,"anc":"middle"},{"f":"ln","id":"m3f","pts":[[550,430],[800,430],[800,555],[550,555]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m3t","k":"m3","bases":[[675,495,"middle",[0,-1]],[564,460,"start",[0,-1]],[786,546,"end",[0,1]]],"o":["medd"],"need":"m3","vis":[],"t":"F","x":675,"y":495,"anc":"middle"},{"f":"ln","id":"cut1","pts":[[300,430],[800,430]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"cut2","pts":[[300,430],[550,430]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"cut3","pts":[[550,430],[550,554]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"cut4","pts":[[550,430],[800,430]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":274,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":534,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ae: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,430],[300,430]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[1],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[316,365,"start",[0,-1]],[550,365,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[1],"t":"F","x":316,"y":365,"anc":"start"},{"f":"ln","id":"m2f","pts":[[300,430],[800,430],[800,555],[300,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[1],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,495,"start",[0,-1]],[550,495,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[1],"t":"F","x":316,"y":495,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,430],[800,430]],"dash":1,"w":3,"o":["cutd"],"vis":[1],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[1],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[1],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[1],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[1],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[1],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[1],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[1],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[1],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[1],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[1],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[1],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[1],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[1],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[1],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[1],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[1],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[1],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[1],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[1],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":322,"x1":510,"y1":408,"o":["ed"],"need":"e1","vis":[1],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":322,"x1":580,"y1":408,"o":["ed"],"need":"e1","vis":[1],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":322,"x1":650,"y1":408,"o":["ed"],"need":"e1","vis":[1],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":322,"x1":720,"y1":408,"o":["ed"],"need":"e1","vis":[1],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,365,"start",[1,0]],[492,365,"end",[-1,0]],[615,365,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[1],"t":"F","x":738,"y":365,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[1],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,430],[984,430]],"w":2,"need":"t1","vis":[1],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":430,"two":1,"w":2,"need":"t1","vis":[1],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,365,"start",[1,0]],[954,365,"end",[-1,0]]],"need":"t1","vis":[1],"t":"F","x":986,"y":365,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":426,"x1":230,"y1":304,"need":"v1","vis":[1],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,365,"end",[-1,0]],[246,365,"start",[1,0]]],"need":"v1","vis":[1],"t":"F","x":214,"y":365,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":452,"x1":510,"y1":538,"o":["ed"],"need":"e2","vis":[1],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":452,"x1":580,"y1":538,"o":["ed"],"need":"e2","vis":[1],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":452,"x1":650,"y1":538,"o":["ed"],"need":"e2","vis":[1],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":452,"x1":720,"y1":538,"o":["ed"],"need":"e2","vis":[1],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,495,"start",[1,0]],[492,495,"end",[-1,0]],[615,495,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[1],"t":"F","x":738,"y":495,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,430],[984,430]],"w":2,"need":"t2","vis":[1],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[1],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":430,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[1],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,495,"start",[1,0]],[954,495,"end",[-1,0]]],"need":"t2","vis":[1],"t":"F","x":986,"y":495,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":434,"need":"v2","vis":[1],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,495,"end",[-1,0]],[246,495,"start",[1,0]]],"need":"v2","vis":[1],"t":"F","x":214,"y":495,"anc":"end"},{"f":"ln","id":"m1fx1","pts":[[300,305],[550,305],[550,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[2],"t":"F"},{"f":"lb","id":"m1tx1","k":"m1","bases":[[425,430,"middle",[0,-1]],[314,330,"start",[0,-1]],[536,546,"end",[0,1]]],"o":["medd"],"need":"m1","vis":[2],"t":"F","x":425,"y":430,"anc":"middle","n":"m1x1"},{"f":"ln","id":"m2fx1","pts":[[550,305],[800,305],[800,555],[550,555]],"w":1,"fill":"gray","close":1,"o":["medd"],"vis":[2],"t":"F"},{"f":"lb","id":"m2tx1","k":"m2","bases":[[675,430,"middle",[0,-1]],[564,330,"start",[0,-1]],[786,546,"end",[0,1]]],"o":["medd"],"need":"m2","vis":[2],"t":"F","x":675,"y":430,"anc":"middle","n":"m2x1"},{"f":"ln","id":"cut1x1","pts":[[550,306],[550,554]],"dash":1,"w":3,"o":["cutd"],"vis":[2],"t":"F"},{"f":"ln","id":"ztx1","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[2],"t":"F"},{"f":"ln","id":"zbx1","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[2],"t":"F"},{"f":"ln","id":"topx1","pts":[[300,300],[800,300]],"w":8,"vis":[2],"t":"F"},{"f":"ln","id":"botx1","pts":[[300,560],[800,560]],"w":8,"vis":[2],"t":"F"},{"f":"lb","id":"toptx1","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[2],"t":"F","x":280,"y":260,"anc":"end","n":"topx1"},{"f":"lb","id":"bottx1","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[2],"t":"F","x":280,"y":520,"anc":"end","n":"botx1"},{"f":"ln","id":"de1x1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[2],"t":"F"},{"f":"ln","id":"de2x1","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[2],"t":"F"},{"f":"ar","id":"ddx1","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[2],"t":"F"},{"f":"lb","id":"dtx1","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[2],"t":"F","x":906,"y":430,"anc":"start","n":"dx1"},{"f":"ar","id":"vax1","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[2],"t":"F"},{"f":"ln","id":"ve1x1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[2],"t":"F"},{"f":"ln","id":"ve2x1","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[2],"t":"F"},{"f":"lb","id":"vtx1","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[2],"t":"F","x":128,"y":430,"anc":"end","n":"vx1"},{"f":"ln","id":"se1x1","pts":[[300,288],[300,136]],"w":2,"need":"s","vis":[2],"t":"F"},{"f":"ln","id":"se2x1","pts":[[800,288],[800,136]],"w":2,"need":"s","vis":[2],"t":"F"},{"f":"ar","id":"sdx1","x0":300,"y0":150,"x1":800,"y1":150,"two":1,"w":2,"need":"s","vis":[2],"t":"F"},{"f":"lb","id":"stx1","k":"s","bases":[[550,110,"middle",[0,-1]],[550,190,"middle",[0,1]]],"need":"s","vis":[2],"t":"F","x":550,"y":110,"anc":"middle","n":"sx1"},{"f":"lb","id":"captx1","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[2],"t":"F","x":280,"y":430,"anc":"end","n":"cx1"},{"f":"ln","id":"s1e1x1","pts":[[300,288],[300,216]],"w":2,"need":"s1","vis":[2],"t":"F"},{"f":"ln","id":"s1e2x1","pts":[[550,288],[550,216]],"w":2,"need":"s1","vis":[2],"t":"F"},{"f":"ar","id":"s1dx1","x0":300,"y0":230,"x1":550,"y1":230,"two":1,"w":2,"need":"s1","vis":[2],"t":"F"},{"f":"lb","id":"s1tx1","k":"s1","bases":[[425,190,"middle",[0,-1]],[425,270,"middle",[0,1]]],"need":"s1","vis":[2],"t":"F","x":425,"y":190,"anc":"middle","n":"s1x1"},{"f":"lb","id":"c1tx1","k":"c1","bases":[[425,604,"middle",[0,1]],[425,660,"middle",[0,1]]],"need":"c1","vis":[2],"t":"F","x":425,"y":604,"anc":"middle","n":"c1x1"},{"f":"ln","id":"s2e1x1","pts":[[550,288],[550,216]],"w":2,"need":"s2","vis":[2],"t":"F"},{"f":"ln","id":"s2e2x1","pts":[[800,288],[800,216]],"w":2,"need":"s2","vis":[2],"t":"F"},{"f":"ar","id":"s2dx1","x0":550,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s2","vis":[2],"t":"F"},{"f":"lb","id":"s2tx1","k":"s2","bases":[[675,190,"middle",[0,-1]],[675,270,"middle",[0,1]]],"need":"s2","vis":[2],"t":"F","x":675,"y":190,"anc":"middle","n":"s2x1"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[675,604,"middle",[0,1]],[675,660,"middle",[0,1]]],"need":"c2","vis":[2],"t":"F","x":675,"y":604,"anc":"middle","n":"c2x1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU48s1l11(d, p, L){ tbFig_Draw(d, p, L, U48S1K.l11); }
function tbU48s1l12(d, p, L){ tbFig_Draw(d, p, L, U48S1K.l12); }
function tbU48s1l21(d, p, L){ tbFig_Draw(d, p, L, U48S1K.l21); }
function tbU48s1c11(d, p, L){ tbFig_Draw(d, p, L, U48S1K.c11); }
function tbU48s1c12(d, p, L){ tbFig_Draw(d, p, L, U48S1K.c12); }
function tbU48s1c21(d, p, L){ tbFig_Draw(d, p, L, U48S1K.c21); }
function tbU48s1rg(d, p, L){ tbFig_Draw(d, p, L, U48S1K.rg); }
function tbU48s1ae(d, p, L){ tbFig_Draw(d, p, L, U48S1K.ae); }
// ---- 48-2 違うコンデンサの直列の電圧 の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S2K = {
  q: {"vars":[],"items":[{"t":"w","id":"u48s2qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s2qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s2qw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u48s2qw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u48s2qw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,324.34,null],"fh":1,"f":"cap","F":27},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1","lab":[638.67,255.96,null]},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,324.34,null],"fh":1,"f":"cap","F":27},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[884.33,255.96,null]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu48s2xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[608.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu48s2xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[914.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu48s2xx2mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u48s2xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s2xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s2xxw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u48s2xxw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u48s2xxw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1","lab":[638.67,255.21,null]},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[884.33,255.21,null]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]}
};
function tbU48s2q(d, p, L){ tbFig_Draw(d, p, L, U48S2K.q); }
function tbU48s2xx(d, p, L){ tbFig_Draw(d, p, L, U48S2K.xx); }
// ---- 48-3 直列のコンデンサの中の電界 の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S3K = {
  q: {"vars":[],"items":[{"t":"w","id":"u48s3qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s3qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s3qw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u48s3qw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u48s3qw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,395.66,null],"fh":1,"f":"cap","F":27},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1","lab":[638.67,255.96,null]},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,395.66,null],"fh":1,"f":"cap","F":27},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[884.33,255.96,null]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu48s3xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[608.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu48s3xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[914.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu48s3xx2mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u48s3xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s3xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s3xxw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u48s3xxw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u48s3xxw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,396.5,null],"fh":1,"f":"cap","F":28.4},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1","lab":[638.67,255.21,null]},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,396.5,null],"fh":1,"f":"cap","F":28.4},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[884.33,255.21,null]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]}
};
function tbU48s3q(d, p, L){ tbFig_Draw(d, p, L, U48S3K.q); }
function tbU48s3xx(d, p, L){ tbFig_Draw(d, p, L, U48S3K.xx); }
// ---- 48-4 つないだまま・切り離した の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S4K = {
  pl: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":550,"y":430,"anc":"middle"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":140,"y":340,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":604,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":626,"y":344,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  pq: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":550,"y":430,"anc":"middle"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":260,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":520,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":140,"y":340,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":604,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":626,"y":344,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  cv: {"vars":[],"items":[{"t":"w","id":"u48s4cvL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s4cvRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s4cvw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u48s4cvw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,324.34,null],"fh":1,"q":"q","f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]},
  co: {"vars":[["s","swc",0]],"items":[{"t":"w","id":"u48s4coL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s4coRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s4cow1","pts":[[478,360],[608,360]],"vis":[],"dash":0},{"t":"w","id":"u48s4cow2","pts":[[676,360],[841,360]],"vis":[],"dash":0},{"t":"w","id":"u48s4cow3","pts":[[901,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"s","k":"sw","dir":"h","x0":608,"y0":360,"x1":676,"y1":360,"v":1,"vis":[],"lab":[642,309.96,null]},{"t":"cap","k":"c","x":871,"y":360,"dir":"h","vis":[],"lab":[871,324.34,null],"fh":1,"q":"q","f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["C","sw","P","n1",0,[1]],["R","c","n1","N",1,[]]]}
};
function tbU48s4pl(d, p, L){ tbFig_Draw(d, p, L, U48S4K.pl); }
function tbU48s4pq(d, p, L){ tbFig_Draw(d, p, L, U48S4K.pq); }
function tbU48s4cv(d, p, L){ tbFig_Draw(d, p, L, U48S4K.cv); }
function tbU48s4co(d, p, L){ tbFig_Draw(d, p, L, U48S4K.co); }
// ---- 48-5 極板の形から合成 の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S5K = {
  ser: {"vars":[["m","cm","c12"]],"items":[{"t":"w","id":"u48s5serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s5serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s5serw1","pts":[[478,360],[615.33,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5serw2","pts":[[675.33,360],[847.67,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5serw3","pts":[[907.67,360],[1045,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5serw4","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s5serw5","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[-1],"lab":[645.33,324.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[-1],"lab":[877.67,324.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,395.66,null],"fh":1,"f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[-1]],["R","c2","n1","N",1,[-1]],["R","c12","P","N",1,[1]]]},
  par: {"vars":[["m","cm","c12"]],"items":[{"t":"w","id":"u48s5parL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s5parRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s5parw1","pts":[[528,280],[528,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5parw2","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5parw3","pts":[[528,280],[731.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5parw4","pts":[[791.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5parw5","pts":[[528,440],[731.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5parw6","pts":[[791.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5parw7","pts":[[528,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s5parw8","pts":[[791.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s5parw9","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u48s5parw10","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"cap","k":"c1","x":761.5,"y":280,"dir":"h","vis":[-1],"lab":[761.5,244.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":761.5,"y":440,"dir":"h","vis":[-1],"lab":[761.5,404.34,null],"fh":1,"f":"cap","F":27},{"t":"d","id":"u48s5parj111","x":528,"y":360,"vis":[-1]},{"t":"d","id":"u48s5parj212","x":995,"y":360,"vis":[-1]},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,324.34,null],"fh":1,"f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","N",1,[-1]],["R","c2","P","N",1,[-1]],["R","c12","P","N",1,[1]]]},
  xx: {"vars":[["m","cm","c12"]],"items":[{"t":"w","id":"u48s5xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s5xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s5xxw1","pts":[[478,360],[615.33,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5xxw2","pts":[[675.33,360],[847.67,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5xxw3","pts":[[907.67,360],[1045,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s5xxw4","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s5xxw5","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.79,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[-1],"lab":[645.33,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[-1],"lab":[877.67,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,285.5,null],"fh":1,"f":"cap","F":28.4},{"t":"dim","k":"cab","x1":478,"y1":380,"x2":1045,"y2":380,"ya":408,"yt":418,"ly":428.79,"vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[-1]],["R","c2","n1","N",1,[-1]],["R","c12","P","N",1,[1]]]}
};
function tbU48s5ser(d, p, L){ tbFig_Draw(d, p, L, U48S5K.ser); }
function tbU48s5par(d, p, L){ tbFig_Draw(d, p, L, U48S5K.par); }
function tbU48s5xx(d, p, L){ tbFig_Draw(d, p, L, U48S5K.xx); }
// ---- 48-6 直並列の電荷 の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S6K = {
  R: {"vars":[],"items":[{"t":"w","id":"u48s6RL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s6RRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6Rw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,324.34,null],"fh":1,"q":"q1","f":"cap","F":27},{"t":"cap","k":"c2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,244.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,404.34,null],"fh":1,"f":"cap","F":27},{"t":"d","id":"u48s6Rj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u48s6Rj214","x":995,"y":360,"vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]],["R","c3","n1","N",1,[]]]},
  L: {"vars":[],"items":[{"t":"w","id":"u48s6LL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s6LRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6Lw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,244.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,404.34,null],"fh":1,"f":"cap","F":27},{"t":"d","id":"u48s6Lj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u48s6Lj212","x":815,"y":360,"vis":[]},{"t":"cap","k":"c1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,324.34,null],"fh":1,"q":"q1","f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c2","P","n1",1,[]],["R","c3","P","n1",1,[]],["R","c1","n1","N",1,[]]]},
  xq: {"vars":[],"items":[{"t":"w","id":"u48s6xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,324.34,null],"fh":1,"q":"q1","f":"cap","F":27},{"t":"cap","k":"c2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,244.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,404.34,null],"fh":1,"f":"cap","F":27},{"t":"d","id":"u48s6xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u48s6xqj214","x":995,"y":360,"vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",0.17,[]],["R","c2","n1","N",1,[]],["R","c3","n1","N",0.5,[]]]},
  xx: {"vars":[["m","cm","c23"]],"items":[{"t":"z","id":"zbu48s6xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu48s6xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu48s6xx2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu48s6xx3lo","z":"lo","lines":[[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu48s6xx4mid","z":"mid","lines":[[[708,360],[821.5,360]]],"vis":[1],"pts":[],"node":"n1"},{"t":"z","id":"zbu48s6xx5lo","z":"lo","lines":[[[881.5,360],[995,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"z","id":"zbu48s6xx6mid","z":"mid","lines":[[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u48s6xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s6xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6xxw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6xxw2","pts":[[708,280],[708,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s6xxw3","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s6xxw4","pts":[[708,280],[821.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u48s6xxw5","pts":[[881.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u48s6xxw6","pts":[[708,440],[821.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s6xxw7","pts":[[881.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s6xxw8","pts":[[708,360],[821.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s6xxw9","pts":[[881.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s6xxw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u48s6xxw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,323.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"cap","k":"c2","x":851.5,"y":280,"dir":"h","vis":[-1],"lab":[851.5,243.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c3","x":851.5,"y":440,"dir":"h","vis":[-1],"lab":[851.5,403.5,null],"fh":1,"f":"cap","F":28.4},{"t":"d","id":"u48s6xxj113","x":708,"y":360,"vis":[-1]},{"t":"d","id":"u48s6xxj214","x":995,"y":360,"vis":[-1]},{"t":"cap","k":"c23","x":851.5,"y":360,"dir":"h","vis":[1],"lab":[851.5,323.5,null],"fh":1,"f":"cap","F":28.4}],"flows":[],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",0.17,[]],["R","c2","n1","N",1,[-1]],["R","c3","n1","N",0.5,[-1]],["R","c23","n1","N",1,[1]]]}
};
function tbU48s6R(d, p, L){ tbFig_Draw(d, p, L, U48S6K.R); }
function tbU48s6L(d, p, L){ tbFig_Draw(d, p, L, U48S6K.L); }
function tbU48s6xq(d, p, L){ tbFig_Draw(d, p, L, U48S6K.xq); }
function tbU48s6xx(d, p, L){ tbFig_Draw(d, p, L, U48S6K.xx); }
// ---- 48-7 合成から静電エネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S7K = {
  ser: {"vars":[["m","cm","c12"]],"items":[{"t":"w","id":"u48s7serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s7serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7serw1","pts":[[478,360],[615.33,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7serw2","pts":[[675.33,360],[847.67,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7serw3","pts":[[907.67,360],[1045,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7serw4","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s7serw5","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[-1],"lab":[645.33,324.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[-1],"lab":[877.67,324.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,395.66,null],"fh":1,"f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[-1]],["R","c2","n1","N",1,[-1]],["R","c12","P","N",1,[1]]]},
  par: {"vars":[["m","cm","c12"]],"items":[{"t":"w","id":"u48s7parL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s7parRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7parw1","pts":[[528,280],[528,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7parw2","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7parw3","pts":[[528,280],[731.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7parw4","pts":[[791.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7parw5","pts":[[528,440],[731.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7parw6","pts":[[791.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7parw7","pts":[[528,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s7parw8","pts":[[791.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s7parw9","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7parw10","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":761.5,"y":280,"dir":"h","vis":[-1],"lab":[761.5,244.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":761.5,"y":440,"dir":"h","vis":[-1],"lab":[761.5,404.34,null],"fh":1,"f":"cap","F":27},{"t":"d","id":"u48s7parj111","x":528,"y":360,"vis":[-1]},{"t":"d","id":"u48s7parj212","x":995,"y":360,"vis":[-1]},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,324.34,null],"fh":1,"f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","N",1,[-1]],["R","c2","P","N",1,[-1]],["R","c12","P","N",1,[1]]]},
  cmp: {"vars":[],"items":[{"t":"w","id":"u48s7cmpL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1L","pts":[[1133,360],[1133,560],[1407,560]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1Rw","pts":[[1427,560],[1700,560],[1700,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w1","pts":[[1183,280],[1183,440]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w2","pts":[[1650,280],[1650,440]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w3","pts":[[1183,280],[1386.5,280]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w4","pts":[[1446.5,280],[1650,280]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w5","pts":[[1183,440],[1386.5,440]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w6","pts":[[1446.5,440],[1650,440]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w7","pts":[[1133,360],[1183,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7cmpx1w8","pts":[[1650,360],[1700,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,621.07,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,305.35,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,305.35,null],"fh":1,"f":"cap","F":27},{"t":"cap","id":"u48s7cmpcap0","x":761.5,"y":722.77,"s":"図1","vis":[]},{"t":"e","k":"src","dir":"h","xp":1407,"yp":560,"xm":1427,"ym":560,"vis":[],"side":1,"loop":1,"lab":[1417,621.07,null],"n":"srcx1"},{"t":"cap","k":"c1","x":1416.5,"y":280,"dir":"h","vis":[],"lab":[1416.5,225.34,null],"fh":1,"f":"cap","F":59.8,"n":"c1x1"},{"t":"cap","k":"c2","x":1416.5,"y":440,"dir":"h","vis":[],"lab":[1416.5,385.35,null],"fh":1,"f":"cap","F":59.8,"n":"c2x1"},{"t":"d","id":"u48s7cmpx1j111","x":1183,"y":360,"vis":[]},{"t":"d","id":"u48s7cmpx1j212","x":1650,"y":360,"vis":[]},{"t":"cap","id":"u48s7cmpcap1","x":1416.5,"y":722.77,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","c1","L0:P","L0:n1",1,[]],["R","c2","L0:n1","L0:N",1,[]],["E","src","L1:P","L1:N",1,[]],["R","c1","L1:P","L1:N",1,[]],["R","c2","L1:P","L1:N",1,[]]]},
  ae: {"vars":[["m","cm","c12"]],"items":[{"t":"z","id":"zbu48s7ae0hi","z":"hi","lines":[[[478,360],[478,560],[752,560]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu48s7ae1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu48s7ae2hi","z":"hi","lines":[[[478,360],[615.33,360]]],"vis":[-1],"pts":[],"node":"P"},{"t":"z","id":"zbu48s7ae3mid","z":"mid","lines":[[[675.33,360],[847.67,360]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu48s7ae4lo","z":"lo","lines":[[[907.67,360],[1045,360]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu48s7ae5hi","z":"hi","lines":[[[478,360],[731.5,360]]],"vis":[1],"pts":[],"node":"P"},{"t":"z","id":"zbu48s7ae6lo","z":"lo","lines":[[[791.5,360],[1045,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"w","id":"u48s7aeL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s7aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7aew1","pts":[[478,360],[615.33,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7aew2","pts":[[675.33,360],[847.67,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7aew3","pts":[[907.67,360],[1045,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7aew4","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s7aew5","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[-1],"lab":[645.33,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[-1],"lab":[877.67,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,396.5,null],"fh":1,"f":"cap","F":28.4}],"flows":[],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",0.5,[-1]],["R","c2","n1","N",0.17,[-1]],["R","c12","P","N",1,[1]]]},
  ax: {"vars":[["m","cm","c12"]],"items":[{"t":"z","id":"zbu48s7ax0hi","z":"hi","lines":[[[478,360],[478,560],[752,560]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu48s7ax1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu48s7ax2hi","z":"hi","lines":[[[478,360],[615.33,360]]],"vis":[-1],"pts":[],"node":"P"},{"t":"z","id":"zbu48s7ax3mid","z":"mid","lines":[[[675.33,360],[847.67,360]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu48s7ax4lo","z":"lo","lines":[[[907.67,360],[1045,360]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu48s7ax5hi","z":"hi","lines":[[[478,360],[731.5,360]]],"vis":[1],"pts":[],"node":"P"},{"t":"z","id":"zbu48s7ax6lo","z":"lo","lines":[[[791.5,360],[1045,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"w","id":"u48s7axL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s7axRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s7axw1","pts":[[478,360],[615.33,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7axw2","pts":[[675.33,360],[847.67,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7axw3","pts":[[907.67,360],[1045,360]],"vis":[-1],"dash":0},{"t":"w","id":"u48s7axw4","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u48s7axw5","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[-1],"lab":[645.33,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[-1],"lab":[877.67,323.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c12","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,396.5,null],"fh":1,"f":"cap","F":28.4}],"flows":[],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",0.5,[-1]],["R","c2","n1","N",0.17,[-1]],["R","c12","P","N",1,[1]]]}
};
function tbU48s7ser(d, p, L){ tbFig_Draw(d, p, L, U48S7K.ser); }
function tbU48s7par(d, p, L){ tbFig_Draw(d, p, L, U48S7K.par); }
function tbU48s7cmp(d, p, L){ tbFig_Draw(d, p, L, U48S7K.cmp); }
function tbU48s7ae(d, p, L){ tbFig_Draw(d, p, L, U48S7K.ae); }
function tbU48s7ax(d, p, L){ tbFig_Draw(d, p, L, U48S7K.ax); }
// ---- 48-8 電荷の合計を並列の合成で割る の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s8.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S8K = {
  rc: {"vars":[],"items":[{"f":"ln","id":"zl","pts":[[330,415],[330,250],[579,250]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"],"no":["mvq"]},{"f":"ln","id":"zr","pts":[[651,250],[900,250],[900,415]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"],"no":["mvq"]},{"f":"ln","id":"za","pts":[[330,415],[330,250],[900,250],[900,415]],"w":16,"noobs":1,"o":["mvq"],"col":"#ffa8a8","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"zb","pts":[[330,435],[330,600],[900,600],[900,435]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wl","pts":[[330,415],[330,250],[579,250]],"vis":[],"t":"F"},{"f":"ln","id":"wr","pts":[[651,250],[900,250],[900,415]],"vis":[],"t":"F"},{"f":"ln","id":"wb","pts":[[330,435],[330,600],[900,600],[900,435]],"vis":[],"t":"F"},{"f":"ln","id":"c1","pts":[[300,415],[360,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:b","pts":[[300,435],[360,435]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2","pts":[[870,415],[930,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:b","pts":[[870,435],[930,435]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1t","k":"c1","bases":[[374,425,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":374,"y":465,"anc":"start"},{"f":"lb","id":"c2t","k":"c2","bases":[[856,425,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":856,"y":385,"anc":"end"},{"f":"lb","id":"q1p","k":"q1","bases":[[374,373,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":374,"y":373,"anc":"start"},{"f":"lb","id":"q1m","k":"q1","bases":[[374,477,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":410.77,"y":525.08,"anc":"start"},{"f":"lb","id":"q2p","k":"q2","bases":[[856,373,"end",[-1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":856,"y":373,"anc":"end"},{"f":"lb","id":"q2m","k":"q2","bases":[[856,477,"end",[-1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":856,"y":477,"anc":"end"},{"f":"c","id":"swp0","cx":579,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":651,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"sw","pts":[[579,250],[645,250]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[579,250],[641.35,214]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ar","id":"v1a","x0":260,"y0":580,"x1":260,"y1":270,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[244,425,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":244,"y":425,"anc":"end"},{"f":"ar","id":"v2a","x0":970,"y0":580,"x1":970,"y1":270,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[986,425,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":986,"y":425,"anc":"start"},{"f":"ln","id":"iso","pts":[[290,210],[940,210],[940,423],[290,423]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ln","id":"iso2","pts":[[290,427],[940,427],[940,640],[290,640]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ar","id":"mq0","x0":390,"y0":250,"x1":416,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":390,"x1":416,"mv":[["mvq",370,0]]},"rl":{"x0":840,"x1":814,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq1","x0":440,"y0":250,"x1":466,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":440,"x1":466,"mv":[["mvq",370,0]]},"rl":{"x0":790,"x1":764,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq2","x0":490,"y0":250,"x1":516,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":490,"x1":516,"mv":[["mvq",370,0]]},"rl":{"x0":740,"x1":714,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  rq: {"vars":[],"items":[{"f":"ln","id":"zl","pts":[[330,415],[330,250],[579,250]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"]},{"f":"ln","id":"zr","pts":[[651,250],[900,250],[900,415]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"]},{"f":"ln","id":"zb","pts":[[330,435],[330,600],[900,600],[900,435]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wl","pts":[[330,415],[330,250],[579,250]],"vis":[],"t":"F"},{"f":"ln","id":"wr","pts":[[651,250],[900,250],[900,415]],"vis":[],"t":"F"},{"f":"ln","id":"wb","pts":[[330,435],[330,600],[900,600],[900,435]],"vis":[],"t":"F"},{"f":"ln","id":"c1","pts":[[300,415],[360,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:b","pts":[[300,435],[360,435]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2","pts":[[870,415],[930,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:b","pts":[[870,435],[930,435]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1t","k":"c1","bases":[[374,425,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":374,"y":425,"anc":"start"},{"f":"lb","id":"c2t","k":"c2","bases":[[856,425,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":856,"y":349,"anc":"end"},{"f":"lb","id":"q1p","k":"q1","bases":[[374,373,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":382.49,"y":364.51,"anc":"start"},{"f":"lb","id":"q1m","k":"q1","bases":[[374,477,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":382.49,"y":485.49,"anc":"start"},{"f":"lb","id":"q2p","k":"q2","bases":[[856,373,"end",[-1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":856,"y":373,"anc":"end"},{"f":"lb","id":"q2m","k":"q2","bases":[[856,477,"end",[-1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":856,"y":477,"anc":"end"},{"f":"c","id":"swp0","cx":579,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":651,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[579,250],[641.35,214]],"w":4,"vis":[],"t":"F"},{"f":"ar","id":"v1a","x0":260,"y0":580,"x1":260,"y1":270,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[244,425,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":244,"y":425,"anc":"end"},{"f":"ar","id":"v2a","x0":970,"y0":580,"x1":970,"y1":270,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[986,425,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":986,"y":425,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  rq3: {"vars":[],"items":[{"f":"ln","id":"zl","pts":[[300,415],[300,250],[434,250]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"]},{"f":"ln","id":"zr","pts":[[506,250],[940,250],[940,415]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"]},{"f":"ln","id":"zr2","pts":[[640,250],[640,415]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"]},{"f":"ln","id":"zb","pts":[[300,435],[300,600],[940,600],[940,435]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"zb2","pts":[[640,600],[640,435]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wl","pts":[[300,415],[300,250],[434,250]],"vis":[],"t":"F"},{"f":"ln","id":"wr","pts":[[506,250],[940,250],[940,415]],"vis":[],"t":"F"},{"f":"ln","id":"wm","pts":[[640,250],[640,415]],"vis":[],"t":"F"},{"f":"ln","id":"wb","pts":[[300,435],[300,600],[940,600],[940,435]],"vis":[],"t":"F"},{"f":"ln","id":"wmb","pts":[[640,600],[640,435]],"vis":[],"t":"F"},{"f":"c","id":"jt","cx":640,"cy":250,"r":6,"fill":"k","vis":[],"t":"F"},{"f":"c","id":"jb","cx":640,"cy":600,"r":6,"fill":"k","vis":[],"t":"F"},{"f":"ln","id":"c1","pts":[[270,415],[330,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:b","pts":[[270,435],[330,435]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2","pts":[[610,415],[670,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:b","pts":[[610,435],[670,435]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c3","pts":[[910,415],[970,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c3:b","pts":[[910,435],[970,435]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1t","k":"c1","bases":[[344,425,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":344,"y":481,"anc":"start"},{"f":"lb","id":"c2t","k":"c2","bases":[[684,425,"start",[1,0]],[596,425,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":596,"y":369,"anc":"end"},{"f":"lb","id":"c3t","k":"c3","bases":[[896,425,"end",[-1,0]]],"need":"c3","vis":[],"t":"F","x":896,"y":425,"anc":"end"},{"f":"lb","id":"q1p","k":"q1","bases":[[344,373,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":358.14,"y":302.29,"anc":"start"},{"f":"lb","id":"q1m","k":"q1","bases":[[344,477,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":434.51,"y":556.2,"anc":"start"},{"f":"lb","id":"q2p","k":"q2","bases":[[684,373,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":684,"y":373,"anc":"start"},{"f":"lb","id":"q2m","k":"q2","bases":[[684,477,"start",[1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":684,"y":477,"anc":"start"},{"f":"lb","id":"q3p","k":"q3","bases":[[896,373,"end",[-1,-1]]],"need":"q3","vis":[],"t":"F","pre":"+","x":896,"y":373,"anc":"end"},{"f":"lb","id":"q3m","k":"q3","bases":[[896,477,"end",[-1,1]]],"need":"q3","vis":[],"t":"F","pre":"-","x":896,"y":477,"anc":"end"},{"f":"c","id":"swp0","cx":434,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":506,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[434,250],[496.35,214]],"w":4,"vis":[],"t":"F"},{"f":"ar","id":"v1a","x0":230,"y0":580,"x1":230,"y1":270,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,425,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":214,"y":425,"anc":"end"},{"f":"ar","id":"v2a","x0":1010,"y0":580,"x1":1010,"y1":270,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[1026,425,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":1026,"y":425,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU48s8rc(d, p, L){ tbFig_Draw(d, p, L, U48S8K.rc); }
function tbU48s8rq(d, p, L){ tbFig_Draw(d, p, L, U48S8K.rq); }
function tbU48s8rq3(d, p, L){ tbFig_Draw(d, p, L, U48S8K.rq3); }
// ---- 48-9 電界の強さから電束密度 の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s9.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S9K = {
  pl: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":314,"y":171,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":610,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ae: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":314,"y":171,"anc":"start"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":610,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU48s9pl(d, p, L){ tbFig_Draw(d, p, L, U48S9K.pl); }
function tbU48s9ae(d, p, L){ tbFig_Draw(d, p, L, U48S9K.ae); }
// ---- 48-10 電界の強さから運ぶ仕事 の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s10.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S10K = {
  pp: {"vars":[],"items":[{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":610,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"},{"f":"c","id":"pad","cx":450,"cy":554,"r":8,"fill":"k","need":"pa","vis":[],"t":"F"},{"f":"lb","id":"pat","k":"pa","bases":[[468,532,"start",[1,-1]],[468,580,"start",[1,1]],[432,532,"end",[-1,-1]]],"need":"pa","vis":[],"t":"F","x":470.83,"y":421.69,"anc":"start"},{"f":"c","id":"pbd","cx":450,"cy":456,"r":8,"fill":"k","need":"pb","vis":[],"t":"F"},{"f":"lb","id":"pbt","k":"pb","bases":[[468,434,"start",[1,-1]],[468,482,"start",[1,1]],[432,434,"end",[-1,-1]]],"need":"pb","vis":[],"t":"F","x":429.17,"y":408.54,"anc":"end"},{"f":"ar","id":"ptha","x0":476,"y0":540,"x1":476,"y1":470,"w":4,"o":["pthd"],"need":"pth","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ptht","k":"pth","bases":[[494,505,"start",[1,0]]],"o":["pthd"],"need":"pth","vis":[],"t":"F","x":494,"y":505,"anc":"start"},{"f":"ln","id":"dabe1","pts":[[434,456],[366,456]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ln","id":"dabe2","pts":[[434,554],[366,554]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ar","id":"dabd","x0":380,"y0":456,"x1":380,"y1":554,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[364,505,"end",[-1,0]],[396,505,"start",[1,0]]],"need":"dab","vis":[],"t":"F","x":140,"y":505,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ae: {"vars":[],"items":[{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":610,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"},{"f":"c","id":"pad","cx":450,"cy":554,"r":8,"fill":"k","need":"pa","vis":[],"t":"F"},{"f":"lb","id":"pat","k":"pa","bases":[[468,532,"start",[1,-1]],[468,580,"start",[1,1]],[432,532,"end",[-1,-1]]],"need":"pa","vis":[],"t":"F","x":470.83,"y":421.69,"anc":"start"},{"f":"c","id":"pbd","cx":450,"cy":456,"r":8,"fill":"k","need":"pb","vis":[],"t":"F"},{"f":"lb","id":"pbt","k":"pb","bases":[[468,434,"start",[1,-1]],[468,482,"start",[1,1]],[432,434,"end",[-1,-1]]],"need":"pb","vis":[],"t":"F","x":429.17,"y":408.54,"anc":"end"},{"f":"ar","id":"ptha","x0":476,"y0":540,"x1":476,"y1":470,"w":4,"o":["pthd"],"need":"pth","col":"#1971c2","vis":[],"t":"F"},{"f":"lb","id":"ptht","k":"pth","bases":[[494,505,"start",[1,0]]],"o":["pthd"],"need":"pth","vis":[],"t":"F","x":494,"y":505,"anc":"start"},{"f":"ln","id":"dabe1","pts":[[434,456],[366,456]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ln","id":"dabe2","pts":[[434,554],[366,554]],"w":2,"need":"dab","vis":[],"t":"F"},{"f":"ar","id":"dabd","x0":380,"y0":456,"x1":380,"y1":554,"two":1,"w":2,"need":"dab","vis":[],"t":"F"},{"f":"lb","id":"dabt","k":"dab","bases":[[364,505,"end",[-1,0]],[396,505,"start",[1,0]]],"need":"dab","vis":[],"t":"F","x":140,"y":505,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU48s10pp(d, p, L){ tbFig_Draw(d, p, L, U48S10K.pp); }
function tbU48s10ae(d, p, L){ tbFig_Draw(d, p, L, U48S10K.ae); }
// ---- 48-11 一直線上の力の足し引き の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s11.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S11K = {
  lm: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":244,"y":356,"anc":"start"},{"f":"c","id":"q0c","cx":653.33,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[624.83,371.5],[681.83,371.5],[681.83,428.5],[624.83,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":653.33,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[653.33,340,"middle",[0,-1]],[697.33,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":653.33,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":226,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[653.33,468,"middle",[0,1]],[613.33,452,"end",[-1,1]],[693.33,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":627.33,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":906,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":617.33,"y0":386,"x1":507.33,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":617.33,"y0":386,"x1":507.33,"y1":386},"out":{"x0":689.33,"y0":386,"x1":799.33,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[562.33,356,"middle",[0,-1]],[562.33,416,"middle",[0,1]],[491.33,386,"end",[-1,0]]],"vbases":{"in":[[562.33,356,"middle",[0,-1]],[562.33,416,"middle",[0,1]],[491.33,386,"end",[-1,0]]],"out":[[744.33,356,"middle",[0,-1]],[744.33,416,"middle",[0,1]],[815.33,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":522.33,"y":350,"anc":"middle"},"out":{"x":744.33,"y":296,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":562.33,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":689.33,"y0":414,"x1":799.33,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":689.33,"y0":414,"x1":799.33,"y1":414},"out":{"x0":617.33,"y0":414,"x1":507.33,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[744.33,384,"middle",[0,-1]],[744.33,444,"middle",[0,1]],[815.33,414,"start",[1,0]]],"vbases":{"in":[[744.33,384,"middle",[0,-1]],[744.33,444,"middle",[0,1]],[815.33,414,"start",[1,0]]],"out":[[562.33,384,"middle",[0,-1]],[562.33,444,"middle",[0,1]],[491.33,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":744.33,"y":488,"anc":"middle"},"out":{"x":491.33,"y":406,"anc":"end"}},"dflt":"out","vis":[],"t":"F","x":744.33,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":689.33,"y0":444,"x1":839.33,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":689.33,"y0":444,"x1":839.33,"y1":444},"left":{"x0":617.33,"y0":444,"x1":467.33,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[764.33,414,"middle",[0,-1]],[764.33,474,"middle",[0,1]],[855.33,444,"start",[1,0]]],"vbases":{"right":[[764.33,414,"middle",[0,-1]],[764.33,474,"middle",[0,1]],[855.33,444,"start",[1,0]]],"left":[[542.33,414,"middle",[0,-1]],[542.33,474,"middle",[0,1]],[451.33,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":764.33,"y":594,"anc":"middle"},"left":{"x":542.33,"y":480,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":764.33,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[653.33,436],[653.33,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":653.33,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[426.67,590,"middle",[0,1]],[426.67,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":426.67,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[653.33,436],[653.33,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":653.33,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[766.67,590,"middle",[0,1]],[766.67,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":766.67,"y":650,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  lr: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":244,"y":356,"anc":"start"},{"f":"c","id":"q0c","cx":880,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":653.33,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[624.83,371.5],[681.83,371.5],[681.83,428.5],[624.83,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":653.33,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[653.33,340,"middle",[0,-1]],[697.33,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":653.33,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":240,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":854,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[653.33,468,"middle",[0,1]],[613.33,452,"end",[-1,1]],[693.33,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":627.33,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":844,"y0":386,"x1":734,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":844,"y0":386,"x1":734,"y1":386},"out":{"x0":916,"y0":386,"x1":1026,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[789,356,"middle",[0,-1]],[789,416,"middle",[0,1]],[718,386,"end",[-1,0]]],"vbases":{"in":[[789,356,"middle",[0,-1]],[789,416,"middle",[0,1]],[718,386,"end",[-1,0]]],"out":[[971,356,"middle",[0,-1]],[971,416,"middle",[0,1]],[1042,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":789,"y":290,"anc":"middle"},"out":{"x":1027,"y":350,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":789,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":844,"y0":414,"x1":734,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":844,"y0":414,"x1":734,"y1":414},"out":{"x0":916,"y0":414,"x1":1026,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[789,384,"middle",[0,-1]],[789,444,"middle",[0,1]],[718,414,"end",[-1,0]]],"vbases":{"in":[[789,384,"middle",[0,-1]],[789,444,"middle",[0,1]],[718,414,"end",[-1,0]]],"out":[[971,384,"middle",[0,-1]],[971,444,"middle",[0,1]],[1042,414,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":763,"y":488,"anc":"middle"},"out":{"x":971,"y":488,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":789,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":916,"y0":444,"x1":1066,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":916,"y0":444,"x1":1066,"y1":444},"left":{"x0":844,"y0":444,"x1":694,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[991,414,"middle",[0,-1]],[991,474,"middle",[0,1]],[1082,444,"start",[1,0]]],"vbases":{"right":[[991,414,"middle",[0,-1]],[991,474,"middle",[0,1]],[1082,444,"start",[1,0]]],"left":[[769,414,"middle",[0,-1]],[769,474,"middle",[0,1]],[678,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":991,"y":540,"anc":"middle"},"left":{"x":606,"y":444,"anc":"end"}},"dflt":"right","vis":[],"t":"F","x":991,"y":414,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[653.33,436],[653.33,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":653.33,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[766.67,590,"middle",[0,1]],[766.67,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":766.67,"y":590,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,654]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[880,436],[880,654]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":640,"x1":880,"y1":640,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[540,680,"middle",[0,1]],[540,600,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":540,"y":680,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ae: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":244,"y":356,"anc":"start"},{"f":"c","id":"q0c","cx":653.33,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[624.83,371.5],[681.83,371.5],[681.83,428.5],[624.83,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":653.33,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[653.33,340,"middle",[0,-1]],[697.33,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":653.33,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":226,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[653.33,468,"middle",[0,1]],[613.33,452,"end",[-1,1]],[693.33,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":627.33,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":906,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":617.33,"y0":386,"x1":507.33,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":617.33,"y0":386,"x1":507.33,"y1":386},"out":{"x0":689.33,"y0":386,"x1":799.33,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[562.33,356,"middle",[0,-1]],[562.33,416,"middle",[0,1]],[491.33,386,"end",[-1,0]]],"vbases":{"in":[[562.33,356,"middle",[0,-1]],[562.33,416,"middle",[0,1]],[491.33,386,"end",[-1,0]]],"out":[[744.33,356,"middle",[0,-1]],[744.33,416,"middle",[0,1]],[815.33,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":522.33,"y":350,"anc":"middle"},"out":{"x":744.33,"y":296,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":562.33,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":689.33,"y0":414,"x1":799.33,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":689.33,"y0":414,"x1":799.33,"y1":414},"out":{"x0":617.33,"y0":414,"x1":507.33,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[744.33,384,"middle",[0,-1]],[744.33,444,"middle",[0,1]],[815.33,414,"start",[1,0]]],"vbases":{"in":[[744.33,384,"middle",[0,-1]],[744.33,444,"middle",[0,1]],[815.33,414,"start",[1,0]]],"out":[[562.33,384,"middle",[0,-1]],[562.33,444,"middle",[0,1]],[491.33,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":744.33,"y":488,"anc":"middle"},"out":{"x":491.33,"y":406,"anc":"end"}},"dflt":"out","vis":[],"t":"F","x":744.33,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":689.33,"y0":444,"x1":839.33,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":689.33,"y0":444,"x1":839.33,"y1":444},"left":{"x0":617.33,"y0":444,"x1":467.33,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[764.33,414,"middle",[0,-1]],[764.33,474,"middle",[0,1]],[855.33,444,"start",[1,0]]],"vbases":{"right":[[764.33,414,"middle",[0,-1]],[764.33,474,"middle",[0,1]],[855.33,444,"start",[1,0]]],"left":[[542.33,414,"middle",[0,-1]],[542.33,474,"middle",[0,1]],[451.33,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":764.33,"y":594,"anc":"middle"},"left":{"x":542.33,"y":480,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":764.33,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[653.33,436],[653.33,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":653.33,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[426.67,590,"middle",[0,1]],[426.67,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":426.67,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[653.33,436],[653.33,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":653.33,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[766.67,590,"middle",[0,1]],[766.67,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":766.67,"y":650,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU48s11lm(d, p, L){ tbFig_Draw(d, p, L, U48S11K.lm); }
function tbU48s11lr(d, p, L){ tbFig_Draw(d, p, L, U48S11K.lr); }
function tbU48s11ae(d, p, L){ tbFig_Draw(d, p, L, U48S11K.ae); }
// ---- 48-12 10のべき乗のまま計算する の図（※ textbook/gen/make_section.py が textbook/gen/data/u48_s12.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U48S12K = {
  pl: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":550,"y":430,"anc":"middle"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":274,"y":206,"anc":"start"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":300,"y":654,"anc":"start"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":918,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":50,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":140,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  cv: {"vars":[],"items":[{"t":"w","id":"u48s12cvL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u48s12cvRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u48s12cvw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u48s12cvw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,324.34,null],"fh":1,"q":"q","f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]},
  pr: {"vars":[],"items":[{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":396,"y":370,"anc":"middle"},"out":{"x":204,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":370,"anc":"middle"},"out":{"x":776,"y":370,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ae: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":550,"y":430,"anc":"middle"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":274,"y":206,"anc":"start"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":300,"y":654,"anc":"start"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":918,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":50,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":140,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU48s12pl(d, p, L){ tbFig_Draw(d, p, L, U48S12K.pl); }
function tbU48s12cv(d, p, L){ tbFig_Draw(d, p, L, U48S12K.cv); }
function tbU48s12pr(d, p, L){ tbFig_Draw(d, p, L, U48S12K.pr); }
function tbU48s12ae(d, p, L){ tbFig_Draw(d, p, L, U48S12K.ae); }
var KINDS = {u48s1l11: tbU48s1l11, u48s1l12: tbU48s1l12, u48s1l21: tbU48s1l21, u48s1c11: tbU48s1c11, u48s1c12: tbU48s1c12, u48s1c21: tbU48s1c21, u48s1rg: tbU48s1rg, u48s1ae: tbU48s1ae, u48s2q: tbU48s2q, u48s2xx: tbU48s2xx, u48s3q: tbU48s3q, u48s3xx: tbU48s3xx, u48s4pl: tbU48s4pl, u48s4pq: tbU48s4pq, u48s4cv: tbU48s4cv, u48s4co: tbU48s4co, u48s5ser: tbU48s5ser, u48s5par: tbU48s5par, u48s5xx: tbU48s5xx, u48s6R: tbU48s6R, u48s6L: tbU48s6L, u48s6xq: tbU48s6xq, u48s6xx: tbU48s6xx, u48s7ser: tbU48s7ser, u48s7par: tbU48s7par, u48s7cmp: tbU48s7cmp, u48s7ae: tbU48s7ae, u48s7ax: tbU48s7ax, u48s8rc: tbU48s8rc, u48s8rq: tbU48s8rq, u48s8rq3: tbU48s8rq3, u48s9pl: tbU48s9pl, u48s9ae: tbU48s9ae, u48s10pp: tbU48s10pp, u48s10ae: tbU48s10ae, u48s11lm: tbU48s11lm, u48s11lr: tbU48s11lr, u48s11ae: tbU48s11ae, u48s12pl: tbU48s12pl, u48s12cv: tbU48s12cv, u48s12pr: tbU48s12pr, u48s12ae: tbU48s12ae};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 48-1 の図は電流が流れないので載せない,
  // 48-2 の図は電流が流れないので載せない,
  // 48-3 の図は電流が流れないので載せない,
  // 48-4 の図は電流が流れないので載せない,
  // 48-5 の図は電流が流れないので載せない,
  // 48-6 の図は電流が流れないので載せない,
  // 48-7 の図は電流が流れないので載せない,
  // 48-8 の図は電流が流れないので載せない,
  // 48-9 の図は電流が流れないので載せない,
  // 48-10 の図は電流が流れないので載せない,
  // 48-11 の図は電流が流れないので載せない,
  // 48-12 の図は電流が流れないので載せない
};

// 48-1 誘電体を直列・並列と読む の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s1_par(a, b){ return a * b / (a + b); }
function tbU48s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s1_Qs11(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8,10]);
    var e2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C1 = (e1 * 2 / 1);
    var C2 = (e2 * 2 / 1);
    if (!(e1 != e2 && abs(C1 * C2 / (C1 + C2) * 100 - Math.round(C1 * C2 / (C1 + C2) * 100)) < 1e-9 && abs(e1 * e2 / (e1 + e2) * 100 - Math.round(e1 * e2 / (e1 + e2) * 100)) < 1e-9 && abs((e1 * 1 + e2 * 1) / 2 * 100 - Math.round((e1 * 1 + e2 * 1) / 2 * 100)) < 1e-9 && abs(C1 * 100 - Math.round(C1 * 100)) < 1e-9 && abs(C1 + C2 * 100 - Math.round(C1 + C2 * 100)) < 1e-9 && distinct([C1 * C2 / (C1 + C2), C1 + C2, e1 * e2 / (e1 + e2), (e1 * 1 + e2 * 1) / 2, C1]))) continue;
    var ok = (C1 * C2 / (C1 + C2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (C1 + C2), why: "直列なのに足した", w: 0, cut: 1}, {x: (e1 * e2 / (e1 + e2)), why: "厚さが半分になると静電容量が大きくなる所を飛ばした", w: 1, cut: 1}, {x: ((e1 * 1 + e2 * 1) / 2), why: "面積の方向に分けた（並列）と読んだ", w: 2, cut: 0}, {x: (C1), why: "上の層の静電容量で止めた（下の層と合わせていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1s11", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板と平行に、厚さの半分ずつに、上は比誘電率 " + fmt(e1) + "、下は比誘電率 " + fmt(e2) + " の誘電体を入れました。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1l11", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["t1", "{d}/2"], ["t2", "{d}/2"], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["極板と平行＝直列。厚さ $\\dfrac{1}{2}d$ の上は $" + fmt(e1) + " \\times \\dfrac{2}{1}C_0 = " + fmt(C1) + "C_0$、下は $" + fmt(C2) + "C_0$", "直列なので $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "}C_0$　$" + qv(ok, "X") + "$"], chk: {form: "u48s1s11", p: {e1: e1, e2: e2}}};
  }
  throw new Error("u48s1s11：条件に合う数字が見つからない");
}
function tbU48s1_Qs12(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8,10]);
    var e2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C1 = (e1 * 3 / 1);
    var C2 = (e2 * 3 / 2);
    if (!(e1 != e2 && abs(C1 * C2 / (C1 + C2) * 100 - Math.round(C1 * C2 / (C1 + C2) * 100)) < 1e-9 && abs(e1 * e2 / (e1 + e2) * 100 - Math.round(e1 * e2 / (e1 + e2) * 100)) < 1e-9 && abs((e1 * 1 + e2 * 2) / 3 * 100 - Math.round((e1 * 1 + e2 * 2) / 3 * 100)) < 1e-9 && abs(C1 * 100 - Math.round(C1 * 100)) < 1e-9 && abs(C1 + C2 * 100 - Math.round(C1 + C2 * 100)) < 1e-9 && distinct([C1 * C2 / (C1 + C2), C1 + C2, e1 * e2 / (e1 + e2), (e1 * 1 + e2 * 2) / 3, C1]))) continue;
    var ok = (C1 * C2 / (C1 + C2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (C1 + C2), why: "直列なのに足した", w: 0, cut: 1}, {x: (e1 * e2 / (e1 + e2)), why: "厚さが薄くなると静電容量が大きくなる所を飛ばした", w: 1, cut: 1}, {x: ((e1 * 1 + e2 * 2) / 3), why: "面積の方向に分けた（並列）と読んだ", w: 2, cut: 0}, {x: (C1), why: "上の層の静電容量で止めた（下の層と合わせていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1s12", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板と平行に、上の厚さ $\\dfrac{1}{3}d$ に比誘電率 " + fmt(e1) + "、残りの厚さ $\\dfrac{2}{3}d$ に比誘電率 " + fmt(e2) + " の誘電体を入れました。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1l12", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["t1", "{d}/3"], ["t2", "2{d}/3"], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["極板と平行＝直列。厚さ $\\dfrac{1}{3}d$ の上は $" + fmt(e1) + " \\times \\dfrac{3}{1}C_0 = " + fmt(C1) + "C_0$、下は $" + fmt(C2) + "C_0$", "直列なので $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "}C_0$　$" + qv(ok, "X") + "$"], chk: {form: "u48s1s12", p: {e1: e1, e2: e2}}};
  }
  throw new Error("u48s1s12：条件に合う数字が見つからない");
}
function tbU48s1_Qs21(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8,10]);
    var e2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C1 = (e1 * 3 / 2);
    var C2 = (e2 * 3 / 1);
    if (!(e1 != e2 && abs(C1 * C2 / (C1 + C2) * 100 - Math.round(C1 * C2 / (C1 + C2) * 100)) < 1e-9 && abs(e1 * e2 / (e1 + e2) * 100 - Math.round(e1 * e2 / (e1 + e2) * 100)) < 1e-9 && abs((e1 * 2 + e2 * 1) / 3 * 100 - Math.round((e1 * 2 + e2 * 1) / 3 * 100)) < 1e-9 && abs(C1 * 100 - Math.round(C1 * 100)) < 1e-9 && abs(C1 + C2 * 100 - Math.round(C1 + C2 * 100)) < 1e-9 && distinct([C1 * C2 / (C1 + C2), C1 + C2, e1 * e2 / (e1 + e2), (e1 * 2 + e2 * 1) / 3, C1]))) continue;
    var ok = (C1 * C2 / (C1 + C2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (C1 + C2), why: "直列なのに足した", w: 0, cut: 1}, {x: (e1 * e2 / (e1 + e2)), why: "厚さが薄くなると静電容量が大きくなる所を飛ばした", w: 1, cut: 1}, {x: ((e1 * 2 + e2 * 1) / 3), why: "面積の方向に分けた（並列）と読んだ", w: 2, cut: 0}, {x: (C1), why: "上の層の静電容量で止めた（下の層と合わせていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1s21", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板と平行に、上の厚さ $\\dfrac{2}{3}d$ に比誘電率 " + fmt(e1) + "、残りの厚さ $\\dfrac{1}{3}d$ に比誘電率 " + fmt(e2) + " の誘電体を入れました。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1l21", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["t1", "2{d}/3"], ["t2", "{d}/3"], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["極板と平行＝直列。厚さ $\\dfrac{2}{3}d$ の上は $" + fmt(e1) + " \\times \\dfrac{3}{2}C_0 = " + fmt(C1) + "C_0$、下は $" + fmt(C2) + "C_0$", "直列なので $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "}C_0$　$" + qv(ok, "X") + "$"], chk: {form: "u48s1s21", p: {e1: e1, e2: e2}}};
  }
  throw new Error("u48s1s21：条件に合う数字が見つからない");
}
function tbU48s1_Qp11(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8,10]);
    var e2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C1 = (e1 * 1 / 2);
    var C2 = (e2 * 1 / 2);
    var Sr = (1 / (1 / 2 / e1 + 1 / 2 / e2));
    if (!(e1 != e2 && abs(C1 + C2 * 100 - Math.round(C1 + C2 * 100)) < 1e-9 && abs(C1 * C2 / (C1 + C2) * 100 - Math.round(C1 * C2 / (C1 + C2) * 100)) < 1e-9 && abs(Sr * 100 - Math.round(Sr * 100)) < 1e-9 && abs(C1 * 100 - Math.round(C1 * 100)) < 1e-9 && distinct([C1 + C2, e1 + e2, C1 * C2 / (C1 + C2), Sr, C1]))) continue;
    var ok = (C1 + C2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (e1 + e2), why: "面積が半分になると静電容量が小さくなる所を飛ばした", w: 0, cut: 1}, {x: (C1 * C2 / (C1 + C2)), why: "並列なのに和分の積でまとめた", w: 1, cut: 1}, {x: (Sr), why: "極板と平行に重なった（直列）と読んだ", w: 2, cut: 0}, {x: (C1), why: "左の部分の静電容量で止めた（右の部分と合わせていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1p11", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板の間の面積の半分ずつに、左は比誘電率 " + fmt(e1) + "、右は比誘電率 " + fmt(e2) + " の誘電体を入れました（どちらも極板の間いっぱいの厚さ）。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1c11", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["s1", "{S}/2"], ["s2", "{S}/2"], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["面積の方向＝並列。面積 $\\dfrac{1}{2}S$ の左は $" + fmt(e1) + " \\times \\dfrac{1}{2}C_0 = " + fmt(C1) + "C_0$、右は $" + fmt(C2) + "C_0$", "並列なので足す　$" + fmt(C1) + " + " + fmt(C2) + " = " + qv(ok, "X") + "$"], chk: {form: "u48s1p11", p: {e1: e1, e2: e2}}};
  }
  throw new Error("u48s1p11：条件に合う数字が見つからない");
}
function tbU48s1_Qp12(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8,10]);
    var e2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C1 = (e1 * 1 / 3);
    var C2 = (e2 * 2 / 3);
    var Sr = (1 / (1 / 3 / e1 + 2 / 3 / e2));
    if (!(e1 != e2 && abs(C1 + C2 * 100 - Math.round(C1 + C2 * 100)) < 1e-9 && abs(C1 * C2 / (C1 + C2) * 100 - Math.round(C1 * C2 / (C1 + C2) * 100)) < 1e-9 && abs(Sr * 100 - Math.round(Sr * 100)) < 1e-9 && abs(C1 * 100 - Math.round(C1 * 100)) < 1e-9 && distinct([C1 + C2, e1 + e2, C1 * C2 / (C1 + C2), Sr, C1]))) continue;
    var ok = (C1 + C2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (e1 + e2), why: "面積が狭くなると静電容量が小さくなる所を飛ばした", w: 0, cut: 1}, {x: (C1 * C2 / (C1 + C2)), why: "並列なのに和分の積でまとめた", w: 1, cut: 1}, {x: (Sr), why: "極板と平行に重なった（直列）と読んだ", w: 2, cut: 0}, {x: (C1), why: "左の部分の静電容量で止めた（右の部分と合わせていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1p12", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板の間の面積の左 $\\dfrac{1}{3}S$ に比誘電率 " + fmt(e1) + "、残りの $\\dfrac{2}{3}S$ に比誘電率 " + fmt(e2) + " の誘電体を入れました（どちらも極板の間いっぱいの厚さ）。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1c12", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["s1", "{S}/3"], ["s2", "2{S}/3"], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["面積の方向＝並列。面積 $\\dfrac{1}{3}S$ の左は $" + fmt(e1) + " \\times \\dfrac{1}{3}C_0 = " + fmt(C1) + "C_0$、右は $" + fmt(C2) + "C_0$", "並列なので足す　$" + fmt(C1) + " + " + fmt(C2) + " = " + qv(ok, "X") + "$"], chk: {form: "u48s1p12", p: {e1: e1, e2: e2}}};
  }
  throw new Error("u48s1p12：条件に合う数字が見つからない");
}
function tbU48s1_Qp21(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8,10]);
    var e2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C1 = (e1 * 2 / 3);
    var C2 = (e2 * 1 / 3);
    var Sr = (1 / (2 / 3 / e1 + 1 / 3 / e2));
    if (!(e1 != e2 && abs(C1 + C2 * 100 - Math.round(C1 + C2 * 100)) < 1e-9 && abs(C1 * C2 / (C1 + C2) * 100 - Math.round(C1 * C2 / (C1 + C2) * 100)) < 1e-9 && abs(Sr * 100 - Math.round(Sr * 100)) < 1e-9 && abs(C1 * 100 - Math.round(C1 * 100)) < 1e-9 && distinct([C1 + C2, e1 + e2, C1 * C2 / (C1 + C2), Sr, C1]))) continue;
    var ok = (C1 + C2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (e1 + e2), why: "面積が狭くなると静電容量が小さくなる所を飛ばした", w: 0, cut: 1}, {x: (C1 * C2 / (C1 + C2)), why: "並列なのに和分の積でまとめた", w: 1, cut: 1}, {x: (Sr), why: "極板と平行に重なった（直列）と読んだ", w: 2, cut: 0}, {x: (C1), why: "左の部分の静電容量で止めた（右の部分と合わせていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1p21", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板の間の面積の左 $\\dfrac{2}{3}S$ に比誘電率 " + fmt(e1) + "、残りの $\\dfrac{1}{3}S$ に比誘電率 " + fmt(e2) + " の誘電体を入れました（どちらも極板の間いっぱいの厚さ）。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1c21", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["s1", "2{S}/3"], ["s2", "{S}/3"], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["面積の方向＝並列。面積 $\\dfrac{2}{3}S$ の左は $" + fmt(e1) + " \\times \\dfrac{2}{3}C_0 = " + fmt(C1) + "C_0$、右は $" + fmt(C2) + "C_0$", "並列なので足す　$" + fmt(C1) + " + " + fmt(C2) + " = " + qv(ok, "X") + "$"], chk: {form: "u48s1p21", p: {e1: e1, e2: e2}}};
  }
  throw new Error("u48s1p21：条件に合う数字が見つからない");
}
function tbU48s1_Qrg(r){
  var gcd = tbU48s1_gcd, ratio = tbU48s1_ratio, par = tbU48s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e1 = pick(r, [1,2,3,4,5,6,8]);
    var e2 = pick(r, [1,2,3,4,5,6,8]);
    var e3 = pick(r, [1,2,3,4,5,6,8]);
    var Ct = (2 * e1);
    var Cb = (e2 + e3);
    var Cs = (e2 * e3 / (e2 + e3));
    if (!(e2 != e3 && abs(Ct * Cb / (Ct + Cb) * 100 - Math.round(Ct * Cb / (Ct + Cb) * 100)) < 1e-9 && abs(Ct * e2 / (Ct + e2) * 100 - Math.round(Ct * e2 / (Ct + e2) * 100)) < 1e-9 && abs(Ct * Cs / (Ct + Cs) * 100 - Math.round(Ct * Cs / (Ct + Cs) * 100)) < 1e-9 && distinct([Ct * Cb / (Ct + Cb), Ct + Cb, Ct * e2 / (Ct + e2), Ct * Cs / (Ct + Cs), Ct]))) continue;
    var ok = (Ct * Cb / (Ct + Cb));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s1_three4(ok, [{x: (Ct + Cb), why: "上と下は直列なのに足した", w: 0, cut: 1}, {x: (Ct * e2 / (Ct + e2)), why: "下の並列をまとめず、左だけと直列にした", w: 1, cut: 1}, {x: (Ct * Cs / (Ct + Cs)), why: "下の2つを直列と読んだ（面積の方向に並んだ物は並列）", w: 2, cut: 0}, {x: (Ct), why: "上の層の静電容量で止めた", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s1rg", text: "真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板と平行に、厚さの上の半分に比誘電率 " + fmt(e1) + " の誘電体を入れました。下の半分は、面積の半分ずつに、左は比誘電率 " + fmt(e2) + "、右は比誘電率 " + fmt(e3) + " の誘電体です。静電容量は $C_0$ の何倍ですか。", fig: {kind: "u48s1rg", L: tbU48s1_fig({}, [["m1", "{ε}_r=" + fmt(e1)], ["m2", "{ε}_r=" + fmt(e2)], ["m3", "{ε}_r=" + fmt(e3)], ["top", ""], ["bot", ""]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["上の層は厚さが半分で $" + fmt(Ct) + "C_0$。下の左と右は厚さも面積も半分で $" + fmt(e2) + "C_0$・$" + fmt(e3) + "C_0$、並列で $" + fmt(Cb) + "C_0$", "上と下は直列　$\\dfrac{" + fmt(Ct) + " \\times " + fmt(Cb) + "}{" + fmt(Ct) + " + " + fmt(Cb) + "} = " + qv(ok, "X") + "$"], chk: {form: "u48s1rg", p: {e1: e1, e2: e2, e3: e3}}};
  }
  throw new Error("u48s1rg：条件に合う数字が見つからない");
}
// 48-2 違うコンデンサの直列の電圧 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s2_par(a, b){ return a * b / (a + b); }
function tbU48s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s2_Qv(r){
  var gcd = tbU48s2_gcd, ratio = tbU48s2_ratio, par = tbU48s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8]);
    var b = pick(r, [2,3,4,5,6,8]);
    var p = pick(r, [1,2,3]);
    var q = pick(r, [1,2,3]);
    var V = pick(r, [60,90,100,120,150,200,240,300,600]);
    var k = pick(r, [1,2]);
    var C1 = (a / p);
    var C2 = (b / q);
    var Ck = (k == 1 ? a / p : b / q);
    var Cj = (k == 1 ? b / q : a / p);
    var ek = (k == 1 ? a : b);
    var j = (3 - k);
    var dp = (p == 1 ? '$d$' : '$' + p + 'd$');
    var dq = (q == 1 ? '$d$' : '$' + q + 'd$');
    if (!(C1 != C2 && abs(V * Ck / (C1 + C2) * 10 - Math.round(V * Ck / (C1 + C2) * 10)) < 1e-9 && abs(V * Cj / (C1 + C2) * 10 - Math.round(V * Cj / (C1 + C2) * 10)) < 1e-9 && abs(V * ek / (a + b) * 10 - Math.round(V * ek / (a + b) * 10)) < 1e-9 && abs(V * (k == 1 ? q : p) / (p + q) * 10 - Math.round(V * (k == 1 ? q : p) / (p + q) * 10)) < 1e-9 && distinct([V * Ck / (C1 + C2), V * Cj / (C1 + C2), V * ek / (a + b), V / 2, V * (k == 1 ? q : p) / (p + q)]))) continue;
    var ok = (V * Ck / (C1 + C2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s2_three4(ok, [{x: (V * Cj / (C1 + C2)), why: "抵抗と同じく静電容量の比で分けた（直列のコンデンサは逆比）", w: 0, cut: 0}, {x: (V * ek / (a + b)), why: "距離の違いを飛ばし、比誘電率だけで分けた", w: 1, cut: 1}, {x: (V / 2), why: "静電容量を出さず、半分ずつにした", w: 2, cut: 1}, {x: (V * (k == 1 ? q : p) / (p + q)), why: "比誘電率の違いを飛ばし、距離だけで分けた", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s2v", text: "極板の面積が同じ2つの平行平板コンデンサがあります。$C_1$ は極板の間が比誘電率 " + fmt(a) + "・距離 " + String(dp) + "、$C_2$ は極板の間が比誘電率 " + fmt(b) + "・距離 " + String(dq) + " です。図のように直列にして $" + qv(V, "V") + "$ を加えました。$C_" + fmt(j) + "$ の電圧は何 V ですか。", fig: {kind: "u48s2q", L: tbU48s2_fig({"c1":"{C}_1","c2":"{C}_2"}, [["src", "{V}=" + qf(V, "V")], ["v" + fmt(j), "{V}_" + fmt(j)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C_1 : C_2 = \\dfrac{" + fmt(a) + "}{" + fmt(p) + "} : \\dfrac{" + fmt(b) + "}{" + fmt(q) + "}$（比誘電率に比例・距離に反比例）", "逆比で分ける　$V_" + fmt(j) + " = " + fmt(V) + " \\times \\dfrac{C_" + fmt(k) + "}{C_1 + C_2} = " + qv(ok, "V") + "$"], chk: {form: "u48s2v", p: {a: a, b: b, p: p, q: q, V: V, k: k}}};
  }
  throw new Error("u48s2v：条件に合う数字が見つからない");
}
function tbU48s2_Qr(r){
  var gcd = tbU48s2_gcd, ratio = tbU48s2_ratio, par = tbU48s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8]);
    var b = pick(r, [2,3,4,5,6,8]);
    var p = pick(r, [1,2,3]);
    var q = pick(r, [1,2,3]);
    var C1 = (a / p);
    var C2 = (b / q);
    var dp = (p == 1 ? '$d$' : '$' + p + 'd$');
    var dq = (q == 1 ? '$d$' : '$' + q + 'd$');
    if (!(C1 != C2 && abs(C2 / C1 * 100 - Math.round(C2 / C1 * 100)) < 1e-9 && abs(C1 / C2 * 100 - Math.round(C1 / C2 * 100)) < 1e-9 && abs(b / a * 100 - Math.round(b / a * 100)) < 1e-9 && abs(p / q * 100 - Math.round(p / q * 100)) < 1e-9 && distinct([C2 / C1, C1 / C2, 1, b / a, p / q]))) continue;
    var ok = (C2 / C1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s2_three4(ok, [{x: (1), why: "静電容量を出さず、電圧は同じと考えた", w: 0, cut: 1}, {x: (b / a), why: "距離の違いを飛ばし、比誘電率だけで比べた", w: 1, cut: 1}, {x: (p / q), why: "比誘電率の違いを飛ばし、距離だけで比べた", w: 2, cut: 1}, {x: (C1 / C2), why: "静電容量の比のまま（直列の電圧は逆比）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s2r", text: "極板の面積が同じ2つの平行平板コンデンサがあります。$C_1$ は極板の間が比誘電率 " + fmt(a) + "・距離 " + String(dp) + "、$C_2$ は極板の間が比誘電率 " + fmt(b) + "・距離 " + String(dq) + " です。図のように直列にして電圧を加えました。$C_1$ の電圧 $V_1$ は、$C_2$ の電圧 $V_2$ の何倍ですか。", fig: {kind: "u48s2q", L: tbU48s2_fig({"c1":"{C}_1","c2":"{C}_2"}, [["src", "{V}"], ["v1", "{V}_1"], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C_1 : C_2 = \\dfrac{" + fmt(a) + "}{" + fmt(p) + "} : \\dfrac{" + fmt(b) + "}{" + fmt(q) + "}$", "電荷が同じなので電圧は逆比　$\\dfrac{V_1}{V_2} = \\dfrac{C_2}{C_1} = " + qv(ok, "X") + "$"], chk: {form: "u48s2r", p: {a: a, b: b, p: p, q: q}}};
  }
  throw new Error("u48s2r：条件に合う数字が見つからない");
}
function tbU48s2_Qer(r){
  var gcd = tbU48s2_gcd, ratio = tbU48s2_ratio, par = tbU48s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var x = pick(r, [2,3,4,5,6,8,10]);
    var p = pick(r, [1,2,3]);
    var q = pick(r, [1,2,3]);
    var V = pick(r, [60,90,100,120,150,200,240,300,600]);
    var C2 = (x * p / q);
    var V1 = (V * C2 / (1 + C2));
    var V2 = (V / (1 + C2));
    var dp = (p == 1 ? '$d$' : '$' + p + 'd$');
    var dq = (q == 1 ? '$d$' : '$' + q + 'd$');
    if (!(C2 != 1 && abs(V1 * 10 - Math.round(V1 * 10)) < 1e-9 && abs(V2 * 10 - Math.round(V2 * 10)) < 1e-9 && abs(V2 / V1 * q / p * 100 - Math.round(V2 / V1 * q / p * 100)) < 1e-9 && abs(V1 / V2 * 100 - Math.round(V1 / V2 * 100)) < 1e-9 && abs(V1 / V * q / p * 100 - Math.round(V1 / V * q / p * 100)) < 1e-9 && distinct([x, V2 / V1 * q / p, V1 / V2, V1 / V * q / p]))) continue;
    var ok = (x);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s2_three4(ok, [{x: (V1 / V2), why: "距離の違いを飛ばした（電圧の比で止めた）", w: 0, cut: 1}, {x: (V1 / V * q / p), why: "$C_2$ の電圧でなく全体の電圧と比べた", w: 1, cut: 1}, {x: (V2 / V1 * q / p), why: "逆比を逆にした（電圧の大きい方が静電容量が小さい）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s2er", text: "極板の面積が同じ2つの平行平板コンデンサがあります。$C_1$ は極板の間が真空で距離 " + String(dp) + "、$C_2$ は極板の間が誘電体で距離 " + String(dq) + " です。図のように直列にして $" + qv(V, "V") + "$ を加えると、$C_1$ の電圧が $" + qv(V1, "V") + "$ でした。誘電体の比誘電率はいくらですか。", fig: {kind: "u48s2q", L: tbU48s2_fig({"c1":"{C}_1","c2":"{C}_2"}, [["src", "{V}=" + qf(V, "V")], ["v1", "{V}_1=" + qf(V1, "V")], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_2 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(V2, "V") + "$。直列は逆比なので $\\dfrac{C_2}{C_1} = \\dfrac{V_1}{V_2} = \\dfrac{" + fmt(V1) + "}{" + fmt(V2) + "}$", "$\\dfrac{C_2}{C_1} = \\varepsilon_r \\times \\dfrac{" + fmt(p) + "}{" + fmt(q) + "}$ より　$\\varepsilon_r = " + fmt(ok) + "$"], chk: {form: "u48s2er", p: {x: x, p: p, q: q, V: V}}};
  }
  throw new Error("u48s2er：条件に合う数字が見つからない");
}
// 48-3 直列のコンデンサの中の電界 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s3_par(a, b){ return a * b / (a + b); }
function tbU48s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s3_Qe(r){
  var gcd = tbU48s3_gcd, ratio = tbU48s3_ratio, par = tbU48s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [60,90,100,120,150,200,240,300,400,500,600]);
    var dk = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var k = pick(r, [1,2]);
    var Vk = (k == 1 ? V * C2 / (C1 + C2) : V * C1 / (C1 + C2));
    var Vo = (k == 1 ? V * C1 / (C1 + C2) : V * C2 / (C1 + C2));
    if (!(C1 != C2 && abs(Vk * 10 - Math.round(Vk * 10)) < 1e-9 && abs(Vk / dk * 10 - Math.round(Vk / dk * 10)) < 1e-9 && abs(V / dk * 10 - Math.round(V / dk * 10)) < 1e-9 && abs(Vo / dk * 10 - Math.round(Vo / dk * 10)) < 1e-9 && Vk / dk <= 5000 && distinct([Vk / dk, V / dk, Vk, Vo / dk]))) continue;
    var ok = (Vk / dk);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s3_three4(ok, [{x: (V / dk), why: "電圧を分けず、全部の電圧を距離で割った", w: 0, cut: 1}, {x: (Vk), why: "$C_" + fmt(k) + "$ の電圧で止めた（距離で割っていない）", w: 1, cut: 1}, {x: (Vo / dk), why: "もう一方のコンデンサの電圧を使った（逆比を取り違えた）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{V/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s3e", text: "静電容量 $C_1 = " + qv(C1, "uF") + "$ と $C_2 = " + qv(C2, "uF") + "$ の平行平板コンデンサを図のように直列にして、$" + qv(V, "V") + "$ を加えました。$C_" + fmt(k) + "$ の極板の間の距離は $" + fmt(dk) + "\\,\\mathrm{m}$ です。$C_" + fmt(k) + "$ の中の電界の強さは何 V/m ですか。", fig: {kind: "u48s3q", L: tbU48s3_fig({}, [["src", "{V}=" + qf(V, "V")], ["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["v" + fmt(k), "{V}_" + fmt(k)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["逆比で分ける　$V_" + fmt(k) + " = " + fmt(V) + " \\times \\dfrac{C_" + fmt(3 - k) + "}{C_1 + C_2} = " + qv(Vk, "V") + "$", "$E_" + fmt(k) + " = \\dfrac{" + fmt(Vk) + "}{" + fmt(dk) + "} = " + fmt(ok) + "\\,\\mathrm{V/m}" + "$"], chk: {form: "u48s3e", p: {C1: C1, C2: C2, V: V, dk: dk, k: k}}};
  }
  throw new Error("u48s3e：条件に合う数字が見つからない");
}
function tbU48s3_Qr(r){
  var gcd = tbU48s3_gcd, ratio = tbU48s3_ratio, par = tbU48s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var d1 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    var d2 = pick(r, [0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]);
    if (!(C1 != C2 && d1 != d2 && abs(C2 * d2 / (C1 * d1) * 100 - Math.round(C2 * d2 / (C1 * d1) * 100)) < 1e-9 && abs(C2 / C1 * 100 - Math.round(C2 / C1 * 100)) < 1e-9 && abs(d2 / d1 * 100 - Math.round(d2 / d1 * 100)) < 1e-9 && abs(C1 * d2 / (C2 * d1) * 100 - Math.round(C1 * d2 / (C2 * d1) * 100)) < 1e-9 && distinct([C2 * d2 / (C1 * d1), 1, C2 / C1, d2 / d1, C1 * d2 / (C2 * d1)]))) continue;
    var ok = (C2 * d2 / (C1 * d1));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s3_three4(ok, [{x: (C2 / C1), why: "電圧の比で止めた（距離で割っていない）", w: 0, cut: 1}, {x: (d2 / d1), why: "電圧を分けず、どちらも同じ電圧として距離だけで比べた", w: 1, cut: 1}, {x: (1), why: "電界は同じと考えた", w: 2, cut: 1}, {x: (C1 * d2 / (C2 * d1)), why: "静電容量の比のまま電圧を分けた（直列は逆比）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s3r", text: "静電容量 $C_1 = " + qv(C1, "uF") + "$ と $C_2 = " + qv(C2, "uF") + "$ の平行平板コンデンサを図のように直列にして、電圧を加えました。極板の間の距離は $C_1$ が $" + fmt(d1) + "\\,\\mathrm{m}$、$C_2$ が $" + fmt(d2) + "\\,\\mathrm{m}$ です。$C_1$ の中の電界は、$C_2$ の中の電界の何倍ですか。", fig: {kind: "u48s3q", L: tbU48s3_fig({}, [["src", "{V}"], ["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["v1", "{V}_1"], ["v2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["逆比なので $V_1 : V_2 = " + fmt(C2) + " : " + fmt(C1) + "$", "$\\dfrac{E_1}{E_2} = \\dfrac{V_1 / " + fmt(d1) + "}{V_2 / " + fmt(d2) + "} = \\dfrac{" + fmt(C2) + " \\times " + fmt(d2) + "}{" + fmt(C1) + " \\times " + fmt(d1) + "} = " + qv(ok, "X") + "$"], chk: {form: "u48s3r", p: {C1: C1, C2: C2, d1: d1, d2: d2}}};
  }
  throw new Error("u48s3r：条件に合う数字が見つからない");
}
// 48-4 つないだまま・切り離した の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s4_par(a, b){ return a * b / (a + b); }
function tbU48s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s4_Qkeep(r){
  var gcd = tbU48s4_gcd, ratio = tbU48s4_ratio, par = tbU48s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [50,100,120,200,300,400,500]);
    var m = pick(r, [2,3,4]);
    var up = pick(r, [1,2]);
    var Cn = (up == 1 ? C * m : C / m);
    var Cw = (up == 1 ? C / m : C * m);
    var dt = (up == 1 ? '$\\dfrac{1}{' + m + '}$ に' : m + ' 倍に');
    if (!((up == 1 || C % m == 0) && abs(Cw * V * 10 - Math.round(Cw * V * 10)) < 1e-9 && distinct([Cn * V, C * V, Cn, Cw * V]))) continue;
    var ok = (Cn * V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s4_three4(ok, [{x: (C * V), why: "電荷が変わらないとした（つないだままは電圧が変わらない。切り離した時と取り違えた）", w: 0, cut: 1}, {x: (Cn), why: "新しい静電容量で止めた（電圧を掛けていない）", w: 1, cut: 1}, {x: (Cw * V), why: "距離と静電容量の関係を逆にした（静電容量は距離に反比例）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s4keep", text: "静電容量 $" + qv(C, "uF") + "$ の平行平板コンデンサを $" + qv(V, "V") + "$ の電源につないだまま、極板の間の距離を " + String(dt) + "しました。蓄えられる電荷は何 μC ですか。", fig: {kind: "u48s4cv", L: tbU48s4_fig({}, [["src", "{V}=" + qf(V, "V")], ["c", "{C}=" + qf(C, "uF")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["つないだままなので電圧は $" + qv(V, "V") + "$ のまま。距離を " + String(dt) + "したので $C' = " + qv(Cn, "uF") + "$", "$Q' = C'V = " + fmt(Cn) + " \\times " + fmt(V) + " = " + qv(ok, "uC") + "$"], chk: {form: "u48s4keep", p: {C: C, V: V, m: m, up: up}}};
  }
  throw new Error("u48s4keep：条件に合う数字が見つからない");
}
function tbU48s4_Qoffv(r){
  var gcd = tbU48s4_gcd, ratio = tbU48s4_ratio, par = tbU48s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C = pick(r, [2,3,4,5,6,8,10]);
    var V = pick(r, [50,100,120,200,300,400,500]);
    var m = pick(r, [2,3,4]);
    var up = pick(r, [1,2]);
    var Cn = (up == 1 ? C * m : C / m);
    var Vn = (up == 1 ? V / m : V * m);
    var Vw = (up == 1 ? V * m : V / m);
    var dt = (up == 1 ? '$\\dfrac{1}{' + m + '}$ に' : m + ' 倍に');
    if (!((up == 1 || C % m == 0) && Vn <= 1000 && abs(Vn * 10 - Math.round(Vn * 10)) < 1e-9 && abs(Vw * 10 - Math.round(Vw * 10)) < 1e-9 && distinct([Vn, V, C * V, Vw]))) continue;
    var ok = (Vn);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s4_three4(ok, [{x: (V), why: "電圧が変わらないとした（切り離すと電荷が変わらない。つないだままと取り違えた）", w: 0, cut: 1}, {x: (C * V), why: "電荷を出して止めた（新しい静電容量で割っていない）", w: 1, cut: 1}, {x: (Vw), why: "距離と静電容量の関係を逆にした（静電容量は距離に反比例）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s4offv", text: "静電容量 $" + qv(C, "uF") + "$ の平行平板コンデンサを $" + qv(V, "V") + "$ で充電し、スイッチ S を開いて電源から切り離しました。その後、極板の間の距離を " + String(dt) + "しました。極板の間の電圧は何 V ですか。", fig: {kind: "u48s4co", L: tbU48s4_fig({}, [["src", "{V}=" + qf(V, "V")], ["c", "{C}=" + qf(C, "uF")], ["q", "{Q}"], ["sw", "S"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["切り離したので電荷は $Q = " + fmt(C) + " \\times " + fmt(V) + " = " + qv(C * V, "uC") + "$ のまま。$C' = " + qv(Cn, "uF") + "$", "$V' = \\dfrac{Q}{C'} = \\dfrac{" + fmt(C * V) + "}{" + fmt(Cn) + "} = " + qv(ok, "V") + "$"], chk: {form: "u48s4offv", p: {C: C, V: V, m: m, up: up}}};
  }
  throw new Error("u48s4offv：条件に合う数字が見つからない");
}
function tbU48s4_Qoffe(r){
  var gcd = tbU48s4_gcd, ratio = tbU48s4_ratio, par = tbU48s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [100,120,200,300,400,500,600]);
    var dd = pick(r, [0.1,0.2,0.4,0.5,1]);
    var m = pick(r, [2,3,4]);
    var up = pick(r, [1,2]);
    var dn = (up == 1 ? dd / m : dd * m);
    var Vn = (up == 1 ? V / m : V * m);
    var dt = (up == 1 ? '$\\dfrac{1}{' + m + '}$ に' : m + ' 倍に');
    if (!(Vn <= 1000 && abs(Vn * 10 - Math.round(Vn * 10)) < 1e-9 && abs(V / dd * 10 - Math.round(V / dd * 10)) < 1e-9 && abs(V / (up == 1 ? dd / m : dd * m) * 10 - Math.round(V / (up == 1 ? dd / m : dd * m) * 10)) < 1e-9 && abs(Vn / dd * 10 - Math.round(Vn / dd * 10)) < 1e-9 && distinct([V / dd, V / dn, Vn / dd, Vn]))) continue;
    var ok = (V / dd);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s4_three4(ok, [{x: (V / dn), why: "電圧が変わらないとした（切り離すと電荷が変わらない。つないだままと取り違えた）", w: 0, cut: 1}, {x: (Vn / dd), why: "新しい電圧を前の距離で割った（距離も変わっている）", w: 1, cut: 1}, {x: (Vn), why: "新しい電圧で止めた（距離で割っていない）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{V/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s4offe", text: "極板の間の距離 $" + fmt(dd) + "\\,\\mathrm{m}$ の平行平板コンデンサを $" + qv(V, "V") + "$ で充電し、電源から切り離しました。その後、極板の間の距離を " + String(dt) + "しました。極板の間の電界の強さは何 V/m ですか。", fig: {kind: "u48s4pq", L: tbU48s4_fig({}, [["top", ""], ["bot", ""], ["d", "{d}=" + fmt(dd) + " m"], ["e", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["切り離したので電荷が一定。$C$ は距離に反比例するので、電圧は距離と同じ倍率で $V' = " + qv(Vn, "V") + "$", "$E = \\dfrac{V'}{d'} = \\dfrac{" + fmt(Vn) + "}{" + fmt(dn) + "} = " + fmt(ok) + "\\,\\mathrm{V/m}" + "$（変わらない）"], chk: {form: "u48s4offe", p: {V: V, dd: dd, m: m, up: up}}};
  }
  throw new Error("u48s4offe：条件に合う数字が見つからない");
}
function tbU48s4_Qwhich(r){
  var gcd = tbU48s4_gcd, ratio = tbU48s4_ratio, par = tbU48s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var how = (k == 1 ? '電源につないだまま' : '電源から切り離して');
    var good = (k == 1 ? '電圧' : '電荷');
    var bad = (k == 1 ? '電荷' : '電圧');
    var _c = choices(r, [{t: String(good), v: "good"}, {t: String(bad), v: "bad", why: "つないだまま（電圧が変わらない）と切り離した（電荷が変わらない）を取り違えた"}, {t: "静電容量", v: "cap", why: "静電容量は距離に反比例するので変わる"}, {t: "静電エネルギー", v: "w", why: "静電容量が変わるので、静電エネルギーも変わる"}]);
    return {form: "u48s4which", text: "平行平板コンデンサを充電し、" + String(how) + "極板の間の距離を変えました。変わらない物はどれですか。", fig: {kind: "u48s4pq", L: tbU48s4_fig({}, [["top", ""], ["bot", ""], ["d", "{d}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["つないだままなら電圧は電源の電圧のまま。切り離したなら電荷は移る先が無いのでそのまま", "変わらない物は" + String(good)], chk: {form: "u48s4which", p: {k: k}}};
  }
  throw new Error("u48s4which：条件に合う数字が見つからない");
}
function tbU48s4_Qratio(r){
  var gcd = tbU48s4_gcd, ratio = tbU48s4_ratio, par = tbU48s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,6]);
    var b = pick(r, [2,3,4]);
    if (!(a != b && abs(a / b * 100 - Math.round(a / b * 100)) < 1e-9 && abs(b / a * 100 - Math.round(b / a * 100)) < 1e-9 && distinct([a / b, 1, b / a, a]))) continue;
    var ok = (a / b);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s4_three4(ok, [{x: (1), why: "電圧が変わらないとした（切り離すと電荷が変わらない。つないだままと取り違えた）", w: 0, cut: 1}, {x: (b / a), why: "静電容量の比で止めた（電荷が一定なら電圧は静電容量に反比例）", w: 1, cut: 1}, {x: (a), why: "面積の変化を見ていない", w: 2, cut: 1}, {x: (a * b), why: "面積も電圧を大きくすると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s4ratio", text: "平行平板コンデンサを充電し、スイッチ S を開いて電源から切り離しました。その後、極板の間の距離を " + fmt(a) + " 倍、面積を " + fmt(b) + " 倍にしました。極板の間の電圧は元の何倍ですか。", fig: {kind: "u48s4co", L: tbU48s4_fig({}, [["src", "{V}"], ["c", "{C}"], ["q", "{Q}"], ["sw", "S"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$ なので $C' = \\dfrac{" + fmt(b) + "}{" + fmt(a) + "} C$。切り離したので電荷は一定", "$V' = \\dfrac{Q}{C'} = \\dfrac{" + fmt(a) + "}{" + fmt(b) + "} V$　$" + qv(ok, "X") + "$"], chk: {form: "u48s4ratio", p: {a: a, b: b}}};
  }
  throw new Error("u48s4ratio：条件に合う数字が見つからない");
}
// 48-5 極板の形から合成 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s5_par(a, b){ return a * b / (a + b); }
function tbU48s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s5_Qser(r){
  var gcd = tbU48s5_gcd, ratio = tbU48s5_ratio, par = tbU48s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,9,10,12]);
    var m = pick(r, [2,3,4]);
    var up = pick(r, [1,2]);
    var C2 = (up == 1 ? C1 * m : C1 / m);
    var dt = (up == 1 ? '$\\dfrac{1}{' + m + '}$' : m + ' 倍');
    if (!((up == 1 || C1 % m == 0) && abs(C1 * C2 / (C1 + C2) * 10 - Math.round(C1 * C2 / (C1 + C2) * 10)) < 1e-9 && abs(C1 + C2 * 10 - Math.round(C1 + C2 * 10)) < 1e-9 && abs(C1 / 2 * 10 - Math.round(C1 / 2 * 10)) < 1e-9 && distinct([C1 * C2 / (C1 + C2), C1 + C2, C2, C1 / 2]))) continue;
    var ok = (C1 * C2 / (C1 + C2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s5_three4(ok, [{x: (C1 + C2), why: "並列と取り違えた（直列は和分の積）", w: 0, cut: 0}, {x: (C2), why: "$C_2$ を出して止めた（直列にまとめていない）", w: 1, cut: 1}, {x: (C1 / 2), why: "距離の違いを見ず、$C_1$ と同じ物どうしの直列とした", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s5ser", text: "静電容量 $C_1 = " + qv(C1, "uF") + "$ の平行平板コンデンサがあります。$C_2$ は $C_1$ と同じ極板で、極板の間の距離を $C_1$ の " + String(dt) + "にした物です。図のように直列につないだ時の合成静電容量は何 μF ですか。", fig: {kind: "u48s5ser", L: tbU48s5_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["静電容量は距離に反比例するので $C_2 = " + qv(C2, "uF") + "$", "直列は和分の積　$\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u48s5ser", p: {C1: C1, m: m, up: up}}};
  }
  throw new Error("u48s5ser：条件に合う数字が見つからない");
}
function tbU48s5_Qpar(r){
  var gcd = tbU48s5_gcd, ratio = tbU48s5_ratio, par = tbU48s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,9,10,12]);
    var m = pick(r, [2,3,4]);
    var up = pick(r, [1,2]);
    var C2 = (up == 1 ? C1 * m : C1 / m);
    var dt = (up == 1 ? '$\\dfrac{1}{' + m + '}$' : m + ' 倍');
    if (!((up == 1 || C1 % m == 0) && abs(C1 + C2 * 10 - Math.round(C1 + C2 * 10)) < 1e-9 && abs(C1 * C2 / (C1 + C2) * 10 - Math.round(C1 * C2 / (C1 + C2) * 10)) < 1e-9 && abs(2 * C1 * 10 - Math.round(2 * C1 * 10)) < 1e-9 && distinct([C1 + C2, C1 * C2 / (C1 + C2), C2, 2 * C1]))) continue;
    var ok = (C1 + C2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s5_three4(ok, [{x: (C1 * C2 / (C1 + C2)), why: "直列と取り違えた（並列は足す）", w: 0, cut: 0}, {x: (C2), why: "$C_2$ を出して止めた（並列にまとめていない）", w: 1, cut: 1}, {x: (2 * C1), why: "距離の違いを見ず、$C_1$ と同じ物どうしの並列とした", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s5par", text: "静電容量 $C_1 = " + qv(C1, "uF") + "$ の平行平板コンデンサがあります。$C_2$ は $C_1$ と同じ極板で、極板の間の距離を $C_1$ の " + String(dt) + "にした物です。図のように並列につないだ時の合成静電容量は何 μF ですか。", fig: {kind: "u48s5par", L: tbU48s5_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["静電容量は距離に反比例するので $C_2 = " + qv(C2, "uF") + "$", "並列は足す　$" + fmt(C1) + " + " + fmt(C2) + " = " + qv(ok, "uF") + "$"], chk: {form: "u48s5par", p: {C1: C1, m: m, up: up}}};
  }
  throw new Error("u48s5par：条件に合う数字が見つからない");
}
function tbU48s5_Qrp(r){
  var gcd = tbU48s5_gcd, ratio = tbU48s5_ratio, par = tbU48s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,4,5]);
    var b = pick(r, [2,3,4,5,6,8]);
    var R0 = (b / a);
    if (!(a != b && abs(R0 * 100 - Math.round(R0 * 100)) < 1e-9 && abs(1 + R0 * 100 - Math.round(1 + R0 * 100)) < 1e-9 && abs(1 + 1 / a * 100 - Math.round(1 + 1 / a * 100)) < 1e-9 && abs(1 + a / b * 100 - Math.round(1 + a / b * 100)) < 1e-9 && distinct([1 + R0, R0, 1 + 1 / a, 1 + b, 1 + a / b]))) continue;
    var ok = (1 + R0);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s5_three4(ok, [{x: (R0), why: "$C_2$ が $C_1$ の何倍かで止めた（並列にまとめていない）", w: 0, cut: 1}, {x: (1 + 1 / a), why: "面積の変化を見ていない", w: 1, cut: 1}, {x: (1 + b), why: "距離の変化を見ていない", w: 2, cut: 1}, {x: (1 + a / b), why: "面積と距離の関係を逆にした（面積に比例・距離に反比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s5rp", text: "平行平板コンデンサ $C_1$ と、$C_1$ の極板の面積を " + fmt(b) + " 倍、極板の間の距離を " + fmt(a) + " 倍にしたコンデンサ $C_2$ を、図のように並列につなぎました。合成静電容量は $C_1$ の何倍ですか。", fig: {kind: "u48s5par", L: tbU48s5_fig({}, [["c1", "{C}_1"], ["c2", "{C}_2"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$ なので $C_2 = \\dfrac{" + fmt(b) + "}{" + fmt(a) + "} C_1$", "並列は足す　$C_1 + \\dfrac{" + fmt(b) + "}{" + fmt(a) + "} C_1$　$" + qv(ok, "X") + "$"], chk: {form: "u48s5rp", p: {a: a, b: b}}};
  }
  throw new Error("u48s5rp：条件に合う数字が見つからない");
}
// 48-6 直並列の電荷 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s6_par(a, b){ return a * b / (a + b); }
function tbU48s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s6_QqR(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var V = pick(r, [10,20,30,50,60,100,120,150,200,300]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    if (!(C2 != C3 && abs(Ct * 10 - Math.round(Ct * 10)) < 1e-9 && abs(Ct * V * 10 - Math.round(Ct * V * 10)) < 1e-9 && Ct * V <= 5000 && distinct([Ct * V, C1 * V, Cp * V, (C1 + Cp) * V, Ct]))) continue;
    var ok = (Ct * V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (C1 * V), why: "合成せず、$C_1$ だけに電源の電圧がかかるとした", w: 0, cut: 1}, {x: (Cp * V), why: "並列の部分の合成で止めた（$C_1$ と直列にまとめていない）", w: 1, cut: 1}, {x: ((C1 + Cp) * V), why: "直列の部分も足して合成した（直列は和分の積）", w: 2, cut: 0}, {x: (Ct), why: "合成静電容量で止めた（電圧を掛けていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6qR", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$、$V = " + qv(V, "V") + "$ です。$C_1$ に蓄えられる電荷は何 μC ですか。", fig: {kind: "u48s6R", L: tbU48s6_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}=" + qf(V, "V")], ["q1", "{Q}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $C_2 + C_3 = " + qv(Cp, "uF") + "$。$C_1$ と直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(Ct, "uF") + "$", "直列なので $C_1$ の電荷は全体の電荷　$Q = " + fmt(Ct) + " \\times " + fmt(V) + " = " + qv(ok, "uC") + "$"], chk: {form: "u48s6qR", p: {C1: C1, C2: C2, C3: C3, V: V}}};
  }
  throw new Error("u48s6qR：条件に合う数字が見つからない");
}
function tbU48s6_QqL(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var V = pick(r, [10,20,30,50,60,100,120,150,200,300]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    if (!(C2 != C3 && abs(Ct * 10 - Math.round(Ct * 10)) < 1e-9 && abs(Ct * V * 10 - Math.round(Ct * V * 10)) < 1e-9 && Ct * V <= 5000 && distinct([Ct * V, C1 * V, Cp * V, (C1 + Cp) * V, Ct]))) continue;
    var ok = (Ct * V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (C1 * V), why: "合成せず、$C_1$ だけに電源の電圧がかかるとした", w: 0, cut: 1}, {x: (Cp * V), why: "並列の部分の合成で止めた（$C_1$ と直列にまとめていない）", w: 1, cut: 1}, {x: ((C1 + Cp) * V), why: "直列の部分も足して合成した（直列は和分の積）", w: 2, cut: 0}, {x: (Ct), why: "合成静電容量で止めた（電圧を掛けていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6qL", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$、$V = " + qv(V, "V") + "$ です。$C_1$ に蓄えられる電荷は何 μC ですか。", fig: {kind: "u48s6L", L: tbU48s6_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}=" + qf(V, "V")], ["q1", "{Q}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $C_2 + C_3 = " + qv(Cp, "uF") + "$。$C_1$ と直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(Ct, "uF") + "$", "直列なので $C_1$ の電荷は全体の電荷　$Q = " + fmt(Ct) + " \\times " + fmt(V) + " = " + qv(ok, "uC") + "$"], chk: {form: "u48s6qL", p: {C1: C1, C2: C2, C3: C3, V: V}}};
  }
  throw new Error("u48s6qL：条件に合う数字が見つからない");
}
function tbU48s6_QqS(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var V = pick(r, [10,20,30,50,60,100,120,150,200,300]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    if (!(C2 != C3 && abs(Ct * 10 - Math.round(Ct * 10)) < 1e-9 && abs(Ct * V * 10 - Math.round(Ct * V * 10)) < 1e-9 && Ct * V <= 5000 && distinct([Ct * V, C1 * V, Cp * V, (C1 + Cp) * V, Ct]))) continue;
    var ok = (Ct * V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (C1 * V), why: "合成せず、$C_3$ だけに電源の電圧がかかるとした", w: 0, cut: 1}, {x: (Cp * V), why: "並列の部分の合成で止めた（$C_3$ と直列にまとめていない）", w: 1, cut: 1}, {x: ((C1 + Cp) * V), why: "直列の部分も足して合成した（直列は和分の積）", w: 2, cut: 0}, {x: (Ct), why: "合成静電容量で止めた（電圧を掛けていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6qS", text: "図の回路で、$C_3 = " + qv(C1, "uF") + "$、$C_1 = " + qv(C2, "uF") + "$、$C_2 = " + qv(C3, "uF") + "$、$V = " + qv(V, "V") + "$ です。$C_3$ に蓄えられる電荷は何 μC ですか。", fig: {kind: "u48s6R", L: tbU48s6_fig({}, [["c1", "{C}_3=" + qf(C1, "uF")], ["c2", "{C}_1=" + qf(C2, "uF")], ["c3", "{C}_2=" + qf(C3, "uF")], ["src", "{V}=" + qf(V, "V")], ["q1", "{Q}_3"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $C_1 + C_2 = " + qv(Cp, "uF") + "$。$C_3$ と直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(Ct, "uF") + "$", "直列なので $C_3$ の電荷は全体の電荷　$Q = " + fmt(Ct) + " \\times " + fmt(V) + " = " + qv(ok, "uC") + "$"], chk: {form: "u48s6qS", p: {C1: C1, C2: C2, C3: C3, V: V}}};
  }
  throw new Error("u48s6qS：条件に合う数字が見つからない");
}
function tbU48s6_QcR(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    var C12 = (C1 * C2 / (C1 + C2));
    if (!(C2 != C3 && abs(Ct * 10 - Math.round(Ct * 10)) < 1e-9 && abs(C12 * 10 - Math.round(C12 * 10)) < 1e-9 && distinct([Ct, C1 + Cp, Cp, C12]))) continue;
    var ok = (Ct);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (C1 + Cp), why: "直列の部分も足した（直列は和分の積）", w: 0, cut: 0}, {x: (Cp), why: "並列の部分の合成で止めた（$C_1$ と直列にまとめていない）", w: 1, cut: 1}, {x: (C12), why: "並列をまとめず、$C_2$ だけと直列にした", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6cR", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$ です。電源から見た合成静電容量は何 μF ですか。", fig: {kind: "u48s6R", L: tbU48s6_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列は足す　$C_2 + C_3 = " + qv(Cp, "uF") + "$", "$C_1$ と直列　$\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u48s6cR", p: {C1: C1, C2: C2, C3: C3}}};
  }
  throw new Error("u48s6cR：条件に合う数字が見つからない");
}
function tbU48s6_QcL(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    var C12 = (C1 * C2 / (C1 + C2));
    if (!(C2 != C3 && abs(Ct * 10 - Math.round(Ct * 10)) < 1e-9 && abs(C12 * 10 - Math.round(C12 * 10)) < 1e-9 && distinct([Ct, C1 + Cp, Cp, C12]))) continue;
    var ok = (Ct);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (C1 + Cp), why: "直列の部分も足した（直列は和分の積）", w: 0, cut: 0}, {x: (Cp), why: "並列の部分の合成で止めた（$C_1$ と直列にまとめていない）", w: 1, cut: 1}, {x: (C12), why: "並列をまとめず、$C_2$ だけと直列にした", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6cL", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$ です。電源から見た合成静電容量は何 μF ですか。", fig: {kind: "u48s6L", L: tbU48s6_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列は足す　$C_2 + C_3 = " + qv(Cp, "uF") + "$", "$C_1$ と直列　$\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u48s6cL", p: {C1: C1, C2: C2, C3: C3}}};
  }
  throw new Error("u48s6cL：条件に合う数字が見つからない");
}
function tbU48s6_QcS(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    var C12 = (C1 * C2 / (C1 + C2));
    if (!(C2 != C3 && abs(Ct * 10 - Math.round(Ct * 10)) < 1e-9 && abs(C12 * 10 - Math.round(C12 * 10)) < 1e-9 && distinct([Ct, C1 + Cp, Cp, C12]))) continue;
    var ok = (Ct);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (C1 + Cp), why: "直列の部分も足した（直列は和分の積）", w: 0, cut: 0}, {x: (Cp), why: "並列の部分の合成で止めた（$C_3$ と直列にまとめていない）", w: 1, cut: 1}, {x: (C12), why: "並列をまとめず、$C_1$ だけと直列にした", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "uF", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6cS", text: "図の回路で、$C_3 = " + qv(C1, "uF") + "$、$C_1 = " + qv(C2, "uF") + "$、$C_2 = " + qv(C3, "uF") + "$ です。電源から見た合成静電容量は何 μF ですか。", fig: {kind: "u48s6R", L: tbU48s6_fig({}, [["c1", "{C}_3=" + qf(C1, "uF")], ["c2", "{C}_1=" + qf(C2, "uF")], ["c3", "{C}_2=" + qf(C3, "uF")], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列は足す　$C_1 + C_2 = " + qv(Cp, "uF") + "$", "$C_3$ と直列　$\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(ok, "uF") + "$"], chk: {form: "u48s6cS", p: {C1: C1, C2: C2, C3: C3}}};
  }
  throw new Error("u48s6cS：条件に合う数字が見つからない");
}
function tbU48s6_Qrat(r){
  var gcd = tbU48s6_gcd, ratio = tbU48s6_ratio, par = tbU48s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var Cp = (C2 + C3);
    if (!(C2 != C3 && abs(Cp / (C1 + Cp) * 100 - Math.round(Cp / (C1 + Cp) * 100)) < 1e-9 && abs(Cp / C1 * 100 - Math.round(Cp / C1 * 100)) < 1e-9 && abs(C2 / (C1 + C2) * 100 - Math.round(C2 / (C1 + C2) * 100)) < 1e-9 && abs((C1 + Cp) / C1 * 100 - Math.round((C1 + Cp) / C1 * 100)) < 1e-9 && distinct([Cp / (C1 + Cp), Cp / C1, (C1 + Cp) / C1, C2 / (C1 + C2)]))) continue;
    var ok = (Cp / (C1 + Cp));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s6_three4(ok, [{x: (Cp / C1), why: "並列の部分の合成で止めた（$C_1$ と直列にまとめていない）", w: 0, cut: 1}, {x: (C2 / (C1 + C2)), why: "並列をまとめず、$C_2$ だけと直列にした", w: 1, cut: 1}, {x: ((C1 + Cp) / C1), why: "直列の部分も足して合成した（直列は和分の積）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s6rat", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$ です。合成静電容量は $C_1$ の何倍ですか。", fig: {kind: "u48s6R", L: tbU48s6_fig({}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $" + qv(Cp, "uF") + "$。$C_1$ と直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "}$", "$C_1 = " + fmt(C1) + "$ で割る　$\\dfrac{" + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(ok, "X") + "$"], chk: {form: "u48s6rat", p: {C1: C1, C2: C2, C3: C3}}};
  }
  throw new Error("u48s6rat：条件に合う数字が見つからない");
}
// 48-7 合成から静電エネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s7_par(a, b){ return a * b / (a + b); }
function tbU48s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s7_Qser(r){
  var gcd = tbU48s7_gcd, ratio = tbU48s7_ratio, par = tbU48s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,6,8,12]);
    var c2 = pick(r, [1,2,3,4,6,8,12]);
    var V = pick(r, [2,4,6,8,10,12,20]);
    var Cs = (c1 * c2 / (c1 + c2));
    if (!(c1 != c2 && nice(Cs) && Math.abs((Cs * V * V / 2) * 10 - Math.round((Cs * V * V / 2) * 10)) < 1e-9)) continue;
    var ok = (Cs * V * V / 2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s7_three4(ok, [{x: ((c1 + c2) * V * V / 2), why: "並列と取り違えて、静電容量を足した", w: 0, cut: 0}, {x: (c1 * V * V / 2), why: "$C_1$ だけで計算した（合成していない）", w: 1, cut: 1}, {x: (c2 * V * V / 2), why: "$C_2$ だけで計算した（合成していない）", w: 2, cut: 1}, {x: (Cs), why: "合成静電容量で止めた（静電エネルギーを出していない）", w: 3, cut: 1}, {x: (Cs * V * V), why: "$\\dfrac{1}{2}$ を掛けていない", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s7ser", text: "図のように、静電容量 $C_1 = " + qv(c1, "F") + "$ と $C_2 = " + qv(c2, "F") + "$ のコンデンサを直列にして、$" + qv(V, "V") + "$ の電源につないだ。2つのコンデンサに蓄えられる静電エネルギーの合計は何 J ですか。", fig: {kind: "u48s7ser", L: tbU48s7_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + qf(c1, "F")], ["c2", "{C}_2=" + qf(c2, "F")], ["src", "{V}=" + qf(V, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列の合成 $C = \\dfrac{" + fmt(c1) + " \\times " + fmt(c2) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + qv(Cs, "F") + "$　この値を次に使う", "$W = \\dfrac{1}{2} \\times " + fmt(Cs) + " \\times " + fmt(V) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u48s7ser", p: {c1: c1, c2: c2, V: V}}};
  }
  throw new Error("u48s7ser：条件に合う数字が見つからない");
}
function tbU48s7_Qpar(r){
  var gcd = tbU48s7_gcd, ratio = tbU48s7_ratio, par = tbU48s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,6,8,12]);
    var c2 = pick(r, [1,2,3,4,6,8,12]);
    var V = pick(r, [2,4,6,8,10,12,20]);
    var Cs = (c1 * c2 / (c1 + c2));
    if (!(c1 != c2 && Math.abs(((c1 + c2) * V * V / 2) * 10 - Math.round(((c1 + c2) * V * V / 2) * 10)) < 1e-9)) continue;
    var ok = ((c1 + c2) * V * V / 2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s7_three4(ok, [{x: (Cs * V * V / 2), why: "直列と取り違えて、和分の積にした", w: 0, cut: 0}, {x: (c1 * V * V / 2), why: "$C_1$ だけで計算した（合成していない）", w: 1, cut: 1}, {x: (c2 * V * V / 2), why: "$C_2$ だけで計算した（合成していない）", w: 2, cut: 1}, {x: (c1 + c2), why: "合成静電容量で止めた（静電エネルギーを出していない）", w: 3, cut: 1}, {x: ((c1 + c2) * V * V), why: "$\\dfrac{1}{2}$ を掛けていない", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s7par", text: "図のように、静電容量 $C_1 = " + qv(c1, "F") + "$ と $C_2 = " + qv(c2, "F") + "$ のコンデンサを並列にして、$" + qv(V, "V") + "$ の電源につないだ。2つのコンデンサに蓄えられる静電エネルギーの合計は何 J ですか。", fig: {kind: "u48s7par", L: tbU48s7_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + qf(c1, "F")], ["c2", "{C}_2=" + qf(c2, "F")], ["src", "{V}=" + qf(V, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の合成 $C = " + fmt(c1) + " + " + fmt(c2) + " = " + qv(c1 + c2, "F") + "$　この値を次に使う", "$W = \\dfrac{1}{2} \\times " + fmt(c1 + c2) + " \\times " + fmt(V) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u48s7par", p: {c1: c1, c2: c2, V: V}}};
  }
  throw new Error("u48s7par：条件に合う数字が見つからない");
}
function tbU48s7_Qrt(r){
  var gcd = tbU48s7_gcd, ratio = tbU48s7_ratio, par = tbU48s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,6,8,12]);
    var c2 = pick(r, [1,2,3,4,6,8,12]);
    var R2 = ((c1 + c2) * (c1 + c2) / (c1 * c2));
    if (!(c1 != c2 && Math.abs(R2 * 100 - Math.round(R2 * 100)) < 1e-9)) continue;
    var ok = (R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s7_three4(ok, [{x: (c1 * c2 / ((c1 + c2) * (c1 + c2))), why: "比を逆にした（図1を図2で割った）", w: 0, cut: 0}, {x: ((c1 + c2) / c1), why: "図1を合成せず、$C_1$ だけで比べた", w: 1, cut: 1}, {x: ((c1 + c2) / c2), why: "図1を合成せず、$C_2$ だけで比べた", w: 2, cut: 1}, {x: (1), why: "直列も並列も、足して合成した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s7rt", text: "図1は $C_1 = " + qv(c1, "F") + "$ と $C_2 = " + qv(c2, "F") + "$ のコンデンサを直列に、図2は同じ2つを並列にして、同じ電圧 $V$ の電源につないだ。図2の静電エネルギーの合計は、図1の何倍ですか。", fig: {kind: "u48s7cmp", L: tbU48s7_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2"}, [["c1", "{C}_1=" + qf(c1, "F")], ["c2", "{C}_2=" + qf(c2, "F")], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1 $C = \\dfrac{" + fmt(c1) + " \\times " + fmt(c2) + "}{" + fmt(c1) + " + " + fmt(c2) + "}$、図2 $C = " + fmt(c1) + " + " + fmt(c2) + "$　電圧は同じ", "$W = \\dfrac{1}{2} C V^2$ なので、比は合成静電容量の比　$" + qv(ok, "X") + "$"], chk: {form: "u48s7rt", p: {c1: c1, c2: c2}}};
  }
  throw new Error("u48s7rt：条件に合う数字が見つからない");
}
// 48-8 電荷の合計を並列の合成で割る の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s8.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s8_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s8_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s8_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s8_par(a, b){ return a * b / (a + b); }
function tbU48s8_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s8_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s8_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s8_Qemp(r){
  var gcd = tbU48s8_gcd, ratio = tbU48s8_ratio, par = tbU48s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10]);
    var V0 = pick(r, [20,30,40,50,60,80,100,120,150,200,300,400,500,600]);
    var T = (c1 * V0);
    var Cp = (c1 + c2);
    if (!(c1 != c2 && Math.abs((T / Cp) * 10 - Math.round((T / Cp) * 10)) < 1e-9)) continue;
    var ok = (T / Cp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s8_three4(ok, [{x: (V0), why: "電荷が移動しないと考えた（前の電圧のまま）", w: 0, cut: 1}, {x: (T / c2), why: "$C_2$ だけで割った（並列の合成をしていない）", w: 1, cut: 1}, {x: (T), why: "電荷の合計で止めた（静電容量で割っていない）", w: 2, cut: 1}, {x: (V0 / 2), why: "電圧を半分にした（等しく分かれると考えた）", w: 3, cut: 0}, {x: (V0 * c2 / Cp), why: "静電容量の逆比で分けた", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s8emp", text: "図のように、$C_1 = " + qv(c1, "uF") + "$ のコンデンサを $" + qv(V0, "V") + "$ で充電し、充電していない $C_2 = " + qv(c2, "uF") + "$ のコンデンサと、スイッチ S を閉じて同じ極性どうしつないだ。電荷が移動した後の電圧は何 V ですか。", fig: {kind: "u48s8rq", L: tbU48s8_fig({"c1":"{C}_1","c2":"{C}_2","sw":"S","dir":"lr"}, [["c1", "{C}_1=" + qf(c1, "uF")], ["c2", "{C}_2=" + qf(c2, "uF")], ["v1", "{V}_1=" + qf(V0, "V")], ["v2", "0 V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計 $Q_1 = " + fmt(c1) + " \\times " + fmt(V0) + " = " + qv(T, "uC") + "$　つないでも変わらない", "移動した後は並列と同じ　$C_1 + C_2 = " + qv(Cp, "uF") + "$", "$V = \\dfrac{" + fmt(T) + "}{" + fmt(Cp) + "} = " + qv(ok, "V") + "$"], chk: {form: "u48s8emp", p: {c1: c1, c2: c2, V0: V0}}};
  }
  throw new Error("u48s8emp：条件に合う数字が見つからない");
}
function tbU48s8_Qboth(r){
  var gcd = tbU48s8_gcd, ratio = tbU48s8_ratio, par = tbU48s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10]);
    var V1 = pick(r, [20,30,40,50,60,80,100,120,150,200,300,400,500,600]);
    var V2 = pick(r, [20,30,40,50,60,80,100,120,150,200,300,400,500,600]);
    var T = (c1 * V1 + c2 * V2);
    var Cp = (c1 + c2);
    if (!(c1 != c2 && V1 > V2 && Math.abs((T / Cp) * 10 - Math.round((T / Cp) * 10)) < 1e-9)) continue;
    var ok = (T / Cp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s8_three4(ok, [{x: ((V1 + V2) / 2), why: "2つの電圧の平均を出した（電荷の合計を合成で割る）", w: 0, cut: 0}, {x: (c1 * V1 / Cp), why: "$C_2$ の電荷を合計に入れていない", w: 1, cut: 1}, {x: (c2 * V2 / Cp), why: "$C_1$ の電荷を合計に入れていない", w: 2, cut: 1}, {x: (T / c1), why: "$C_1$ だけで割った（並列の合成をしていない）", w: 3, cut: 1}, {x: (V1 + V2), why: "電圧を足した", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s8both", text: "図のように、$C_1 = " + qv(c1, "uF") + "$ のコンデンサを $" + qv(V1, "V") + "$ で、$C_2 = " + qv(c2, "uF") + "$ のコンデンサを $" + qv(V2, "V") + "$ で充電した。スイッチ S を閉じて同じ極性どうしつなぐと、電荷が移動した後の電圧は何 V ですか。", fig: {kind: "u48s8rq", L: tbU48s8_fig({"c1":"{C}_1","c2":"{C}_2","sw":"S","dir":"lr"}, [["c1", "{C}_1=" + qf(c1, "uF")], ["c2", "{C}_2=" + qf(c2, "uF")], ["v1", "{V}_1=" + qf(V1, "V")], ["v2", "{V}_2=" + qf(V2, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計 $" + fmt(c1) + " \\times " + fmt(V1) + " + " + fmt(c2) + " \\times " + fmt(V2) + " = " + qv(T, "uC") + "$　この値を次に使う", "移動した後は並列と同じ　$C_1 + C_2 = " + qv(Cp, "uF") + "$", "$V = \\dfrac{" + fmt(T) + "}{" + fmt(Cp) + "} = " + qv(ok, "V") + "$"], chk: {form: "u48s8both", p: {c1: c1, c2: c2, V1: V1, V2: V2}}};
  }
  throw new Error("u48s8both：条件に合う数字が見つからない");
}
function tbU48s8_Qthr(r){
  var gcd = tbU48s8_gcd, ratio = tbU48s8_ratio, par = tbU48s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10]);
    var c3 = pick(r, [1,2,3,4,5,6,8,10]);
    var V0 = pick(r, [20,30,40,50,60,80,100,120,150,200,300,400,500,600]);
    var T = (c1 * V0);
    var Cp = (c1 + c2 + c3);
    if (!(c2 != c3 && Math.abs((T / Cp) * 10 - Math.round((T / Cp) * 10)) < 1e-9)) continue;
    var ok = (T / Cp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s8_three4(ok, [{x: (T / (c1 + c2)), why: "$C_3$ を並列の合成に入れていない", w: 0, cut: 1}, {x: (T / (c1 + c3)), why: "$C_2$ を並列の合成に入れていない", w: 1, cut: 1}, {x: (V0), why: "電荷が移動しないと考えた（前の電圧のまま）", w: 2, cut: 1}, {x: (T / (c2 + c3)), why: "充電していない2つだけで割った", w: 3, cut: 0}, {x: (V0 / 3), why: "3つに等しく分かれると考えた", w: 4, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s8thr", text: "図のように、$C_1 = " + qv(c1, "uF") + "$ のコンデンサを $" + qv(V0, "V") + "$ で充電した。充電していない $C_2 = " + qv(c2, "uF") + "$ と $C_3 = " + qv(c3, "uF") + "$ は、前からつながっている。スイッチ S を閉じると、電荷が移動した後の電圧は何 V ですか。", fig: {kind: "u48s8rq3", L: tbU48s8_fig({"c1":"{C}_1","c2":"{C}_2","sw":"S","dir":"lr"}, [["c1", "{C}_1=" + qf(c1, "uF")], ["c2", "{C}_2=" + qf(c2, "uF")], ["c3", "{C}_3=" + qf(c3, "uF")], ["v1", "{V}_1=" + qf(V0, "V")], ["v2", "0 V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計 $Q_1 = " + fmt(c1) + " \\times " + fmt(V0) + " = " + qv(T, "uC") + "$　つないでも変わらない", "移動した後は3つが並列と同じ　$C_1 + C_2 + C_3 = " + qv(Cp, "uF") + "$", "$V = \\dfrac{" + fmt(T) + "}{" + fmt(Cp) + "} = " + qv(ok, "V") + "$"], chk: {form: "u48s8thr", p: {c1: c1, c2: c2, c3: c3, V0: V0}}};
  }
  throw new Error("u48s8thr：条件に合う数字が見つからない");
}
function tbU48s8_Qrt(r){
  var gcd = tbU48s8_gcd, ratio = tbU48s8_ratio, par = tbU48s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [1,2,3,4,5,6,8,10]);
    var c2 = pick(r, [1,2,3,4,5,6,8,10]);
    var X = (c1 / (c1 + c2));
    if (!(c1 != c2 && Math.abs(X * 100 - Math.round(X * 100)) < 1e-9)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s8_three4(ok, [{x: (1), why: "電荷が移動しないと考えた（前の電圧のまま）", w: 0, cut: 1}, {x: (c1 / c2), why: "$C_2$ だけで割った（並列の合成をしていない）", w: 1, cut: 1}, {x: (c2 / (c1 + c2)), why: "比を取り違えた（$C_2$ の割合にした）", w: 2, cut: 0}, {x: (0.5), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s8rt", text: "図のように、$C_1 = " + qv(c1, "uF") + "$ のコンデンサをある電圧で充電し、充電していない $C_2 = " + qv(c2, "uF") + "$ のコンデンサと、スイッチ S を閉じて同じ極性どうしつないだ。電荷が移動した後の電圧は、つなぐ前の $C_1$ の電圧の何倍ですか。", fig: {kind: "u48s8rq", L: tbU48s8_fig({"c1":"{C}_1","c2":"{C}_2","sw":"S","dir":"lr"}, [["c1", "{C}_1=" + qf(c1, "uF")], ["c2", "{C}_2=" + qf(c2, "uF")], ["v1", "{V}_1"], ["v2", "0 V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計 $C_1 V_1 = " + fmt(c1) + " V_1$ は変わらない　この値を次に使う", "$V = \\dfrac{" + fmt(c1) + " V_1}{" + fmt(c1) + " + " + fmt(c2) + "}$　なので $\\dfrac{V}{V_1} = " + qv(ok, "X") + "$"], chk: {form: "u48s8rt", p: {c1: c1, c2: c2}}};
  }
  throw new Error("u48s8rt：条件に合う数字が見つからない");
}
// 48-9 電界の強さから電束密度 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s9.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s9_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s9_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s9_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s9_par(a, b){ return a * b / (a + b); }
function tbU48s9_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s9_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s9_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s9_Qd(r){
  var gcd = tbU48s9_gcd, ratio = tbU48s9_ratio, par = tbU48s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300,400,500,600,800,1000]);
    var d10 = pick(r, [1,2,3,4,5,6,7,8,9,10]);
    var er = pick(r, [2,3,4,5,6,8,10]);
    var dd = (d10 / 10);
    var E = (V * 10 / d10);
    if (!(nice(E) && Math.abs(E * 10 - Math.round(E * 10)) < 1e-9 && Math.abs((er * E) * 10 - Math.round((er * E) * 10)) < 1e-9 && er * E <= 100000)) continue;
    var ok = (er * E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s9_three4(ok, [{x: (E), why: "電界の強さで止めた（誘電率を掛けていない）", w: 0, cut: 1}, {x: (er * V), why: "電界の強さを出さず、電圧に比誘電率を掛けた", w: 1, cut: 1}, {x: (E / er), why: "比誘電率で割った（$D = \\varepsilon E$ は掛ける）", w: 2, cut: 0}, {x: (er * V * d10 / 10), why: "距離で割らずに掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s9d", text: "図のように、比誘電率 $" + fmt(er) + "$ の誘電体で満たした平行平板コンデンサに $" + qv(V, "V") + "$ を加えた。極板の間の距離は $" + fmt(dd) + "\\,\\mathrm{m}$ です。極板の間の電束密度は $\\varepsilon_0$ の何倍ですか。", fig: {kind: "u48s9pl", L: tbU48s9_fig({"top":"","bot":"","d":"{d}","e":"{E}","med":"{ε}_r"}, [["d", "{d}=" + fmt(dd) + " m"], ["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{" + fmt(V) + "}{" + fmt(dd) + "} = " + fmt(E) + "\\,\\mathrm{V/m}" + "$　この値を次に使う", "$D = \\varepsilon_0 \\times " + fmt(er) + " \\times " + fmt(E) + " = " + fmt(ok) + "\\,\\varepsilon_0" + "$　なので $" + qv(ok, "X") + "$"], chk: {form: "u48s9d", p: {V: V, d10: d10, er: er}}};
  }
  throw new Error("u48s9d：条件に合う数字が見つからない");
}
function tbU48s9_Qrt(r){
  var gcd = tbU48s9_gcd, ratio = tbU48s9_ratio, par = tbU48s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,5]);
    var er = pick(r, [2,3,4,5,6,8,10]);
    var h = pick(r, [1,2]);
    var kk = (h == 1 ? k : 1 / k);
    var X = (er / kk);
    var kt = (h == 1 ? String(k) + ' 倍' : '$\\dfrac{1}{' + k + '}$');
    var et = (h == 1 ? '$\\dfrac{1}{' + k + '}$ 倍' : String(k) + ' 倍');
    if (!(Math.abs(X * 100 - Math.round(X * 100)) < 1e-9 && X != 1)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s9_three4(ok, [{x: (er), why: "距離が変わって電界の強さが変わることを入れていない", w: 0, cut: 1}, {x: (1 / kk), why: "誘電体を入れたことを入れていない（電界の強さの比で止めた）", w: 1, cut: 1}, {x: (er * kk), why: "距離が長いほど電界が強いとした（逆）", w: 2, cut: 0}, {x: (kk / er), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s9rt", text: "極板の間が真空の平行平板コンデンサを電源につないだ。電源につないだまま、極板の間の距離を " + String(kt) + " にし、間を比誘電率 $" + fmt(er) + "$ の誘電体で満たした。極板の間の電束密度は、前の何倍ですか。", fig: {kind: "u48s9pl", L: tbU48s9_fig({"top":"","bot":"","d":"{d}","e":"{E}","med":"{ε}_r"}, [["d", "{d}"], ["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電源につないだままなので、電圧 $V$ は変わらない　$E = \\dfrac{V}{d}$ は距離に反比例", "電界の強さは " + String(et) + "、誘電率は $" + fmt(er) + "$ 倍　$D = \\varepsilon_0 \\varepsilon_r E$ なので $" + qv(ok, "X") + "$"], chk: {form: "u48s9rt", p: {k: k, er: er, h: h}}};
  }
  throw new Error("u48s9rt：条件に合う数字が見つからない");
}
// 48-10 電界の強さから運ぶ仕事 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s10.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s10_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s10_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s10_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s10_par(a, b){ return a * b / (a + b); }
function tbU48s10_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s10_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s10_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s10_Qw(r){
  var gcd = tbU48s10_gcd, ratio = tbU48s10_ratio, par = tbU48s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300,400,500,600,800,1000]);
    var d10 = pick(r, [2,3,4,5,6,8,10]);
    var x10 = pick(r, [1,2,3,4,5,6,7,8,9]);
    var q = pick(r, [1,2,3,4,5,6,8,10]);
    var dd = (d10 / 10);
    var xx = (x10 / 10);
    var E = (V * 10 / d10);
    var Vab = (V * x10 / d10);
    if (!(x10 < d10 && nice(E) && Math.abs(Vab * 10 - Math.round(Vab * 10)) < 1e-9 && Math.abs((q * Vab) * 10 - Math.round((q * Vab) * 10)) < 1e-9)) continue;
    var ok = (q * Vab);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s10_three4(ok, [{x: (q * V), why: "極板の間の全部の電圧を使った（運ぶ距離の分の電位差にしていない）", w: 0, cut: 1}, {x: (Vab), why: "電位差で止めた（電荷を掛けていない）", w: 1, cut: 1}, {x: (q * E), why: "力 $qE$ で止めた（運ぶ距離を掛けていない）", w: 2, cut: 0}, {x: (q * V * (d10 - x10) / d10), why: "正の極板から距離を測った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s10w", text: "図のように、上の極板が正の平行平板コンデンサがあります。極板の間の距離は $" + fmt(dd) + "\\,\\mathrm{m}$、電圧は $" + qv(V, "V") + "$ です。$" + qv(q, "C") + "$ の正の電荷を、負の極板の上の点 A から点 B まで、電界に逆らって $" + fmt(xx) + "\\,\\mathrm{m}$ 運びます。要る仕事は何 J ですか。", fig: {kind: "u48s10pp", L: tbU48s10_fig({"top":"","bot":"","d":"{d}","pa":"A","pb":"B","pth":"","dab":""}, [["d", "{d}=" + fmt(dd) + " m"], ["dab", fmt(xx) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{" + fmt(V) + "}{" + fmt(dd) + "} = " + fmt(E) + "\\,\\mathrm{V/m}" + "$　この値を次に使う", "A と B の電位差 $" + fmt(E) + " \\times " + fmt(xx) + " = " + qv(Vab, "V") + "$", "$W = " + fmt(q) + " \\times " + fmt(Vab) + " = " + qv(ok, "J") + "$"], chk: {form: "u48s10w", p: {V: V, d10: d10, x10: x10, q: q}}};
  }
  throw new Error("u48s10w：条件に合う数字が見つからない");
}
function tbU48s10_Qdv(r){
  var gcd = tbU48s10_gcd, ratio = tbU48s10_ratio, par = tbU48s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300,400,500,600,800,1000]);
    var d10 = pick(r, [2,3,4,5,6,8,10]);
    var x10 = pick(r, [1,2,3,4,5,6,7,8,9]);
    var dd = (d10 / 10);
    var xx = (x10 / 10);
    var E = (V * 10 / d10);
    if (!(x10 < d10 && nice(E) && Math.abs((V * x10 / d10) * 10 - Math.round((V * x10 / d10) * 10)) < 1e-9)) continue;
    var ok = (V * x10 / d10);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s10_three4(ok, [{x: (V), why: "極板の間の全部の電圧を使った", w: 0, cut: 1}, {x: (E), why: "電界の強さで止めた（運ぶ距離を掛けていない）", w: 1, cut: 1}, {x: (V * (d10 - x10) / d10), why: "正の極板から距離を測った", w: 2, cut: 0}, {x: (V * x10 / 10), why: "距離で割らずに、運ぶ距離を掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s10dv", text: "図のように、上の極板が正の平行平板コンデンサがあります。極板の間の距離は $" + fmt(dd) + "\\,\\mathrm{m}$、電圧は $" + qv(V, "V") + "$ です。負の極板の上の点 A と、A から $" + fmt(xx) + "\\,\\mathrm{m}$ 上の点 B の電位差は何 V ですか。", fig: {kind: "u48s10pp", L: tbU48s10_fig({"top":"","bot":"","d":"{d}","pa":"A","pb":"B","pth":"","dab":""}, [["d", "{d}=" + fmt(dd) + " m"], ["pth", null], ["dab", fmt(xx) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{" + fmt(V) + "}{" + fmt(dd) + "} = " + fmt(E) + "\\,\\mathrm{V/m}" + "$　この値を次に使う", "電位差 $= " + fmt(E) + " \\times " + fmt(xx) + " = " + qv(ok, "V") + "$"], chk: {form: "u48s10dv", p: {V: V, d10: d10, x10: x10}}};
  }
  throw new Error("u48s10dv：条件に合う数字が見つからない");
}
function tbU48s10_Qf(r){
  var gcd = tbU48s10_gcd, ratio = tbU48s10_ratio, par = tbU48s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300,400,500,600,800,1000]);
    var d10 = pick(r, [1,2,3,4,5,6,8,10]);
    var q = pick(r, [1,2,3,4,5,6,8,10]);
    var dd = (d10 / 10);
    var E = (V * 10 / d10);
    if (!(nice(E) && Math.abs((q * E) * 10 - Math.round((q * E) * 10)) < 1e-9 && q * E <= 100000)) continue;
    var ok = (q * E);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s10_three4(ok, [{x: (E), why: "電界の強さで止めた（電荷を掛けていない）", w: 0, cut: 1}, {x: (q * V), why: "電界の強さを出さず、電圧に電荷を掛けた", w: 1, cut: 1}, {x: (q * V * d10 / 10), why: "距離で割らずに掛けた", w: 2, cut: 0}, {x: (E / q), why: "電荷で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "N", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s10f", text: "図のように、上の極板が正の平行平板コンデンサがあります。極板の間の距離は $" + fmt(dd) + "\\,\\mathrm{m}$、電圧は $" + qv(V, "V") + "$ です。極板の間に置いた $" + qv(q, "C") + "$ の正の電荷に働く力の大きさは何 N ですか。", fig: {kind: "u48s10pp", L: tbU48s10_fig({"top":"","bot":"","d":"{d}","pa":"A","pb":"B","pth":"","dab":""}, [["d", "{d}=" + fmt(dd) + " m"], ["pth", null], ["dab", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{" + fmt(V) + "}{" + fmt(dd) + "} = " + fmt(E) + "\\,\\mathrm{V/m}" + "$　この値を次に使う", "$F = qE = " + fmt(q) + " \\times " + fmt(E) + " = " + qv(ok, "N") + "$"], chk: {form: "u48s10f", p: {V: V, d10: d10, q: q}}};
  }
  throw new Error("u48s10f：条件に合う数字が見つからない");
}
function tbU48s10_Qrt(r){
  var gcd = tbU48s10_gcd, ratio = tbU48s10_ratio, par = tbU48s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var d10 = pick(r, [2,3,4,5,6,8,10]);
    var x10 = pick(r, [1,2,3,4,5,6,7,8,9]);
    var dd = (d10 / 10);
    var xx = (x10 / 10);
    var X = (x10 / d10);
    if (!(x10 < d10 && Math.abs(X * 100 - Math.round(X * 100)) < 1e-9)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s10_three4(ok, [{x: (1), why: "どちらも極板の間の全部の電圧を使った", w: 0, cut: 1}, {x: (10 / d10), why: "B の方を電界の強さで止めた（運ぶ距離を掛けていない）", w: 1, cut: 1}, {x: (d10 / x10), why: "比を逆にした", w: 2, cut: 0}, {x: ((d10 - x10) / d10), why: "正の極板から距離を測った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s10rt", text: "図のように、上の極板が正の平行平板コンデンサがあります。極板の間の距離は $" + fmt(dd) + "\\,\\mathrm{m}$ です。正の電荷を、負の極板の上の点 A から、$" + fmt(xx) + "\\,\\mathrm{m}$ 上の点 B まで運ぶ仕事は、A から正の極板まで運ぶ仕事の何倍ですか。", fig: {kind: "u48s10pp", L: tbU48s10_fig({"top":"","bot":"","d":"{d}","pa":"A","pb":"B","pth":"","dab":""}, [["d", "{d}=" + fmt(dd) + " m"], ["dab", fmt(xx) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電界の強さ $E$ はどこでも同じ　B までの電位差 $E \\times " + fmt(xx) + "$、正の極板までの電位差 $E \\times " + fmt(dd) + "$", "$\\dfrac{" + fmt(xx) + "}{" + fmt(dd) + "} = " + qv(ok, "X") + "$"], chk: {form: "u48s10rt", p: {d10: d10, x10: x10}}};
  }
  throw new Error("u48s10rt：条件に合う数字が見つからない");
}
// 48-11 一直線上の力の足し引き の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s11.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s11_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s11_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s11_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s11_par(a, b){ return a * b / (a + b); }
function tbU48s11_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s11_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s11_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s11_Qsame(r){
  var gcd = tbU48s11_gcd, ratio = tbU48s11_ratio, par = tbU48s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q0 = pick(r, [1,2]);
    var qa = pick(r, [1,2,3,4,6,8,9,12,16,18]);
    var qb = pick(r, [1,2,3,4,6,8,9]);
    var ra = pick(r, [2,3,4]);
    var rb = pick(r, [1,2]);
    var Fa = (9 * q0 * qa / (ra * ra));
    var Fb = (9 * q0 * qb / (rb * rb));
    if (!(ra > rb && Number.isInteger(Fa) && Number.isInteger(Fb) && Fa != Fb)) continue;
    var ok = (abs(Fa - Fb));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s11_three4(ok, [{x: (Fa + Fb), why: "逆向きの2つの力を足した（逆向きは引く）", w: 0, cut: 0}, {x: (Fa), why: "A からの力だけを出した（B からの力を入れていない）", w: 1, cut: 1}, {x: (Fb), why: "B からの力だけを出した（A からの力を入れていない）", w: 2, cut: 1}, {x: (abs(9 * q0 * qa / ra - 9 * q0 * qb / rb)), why: "距離を2乗していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s11same", text: "図のように、真空中で、点 P に置いた点電荷 $q_0 = +" + qv(q0, "C") + "$ の左 $" + fmt(ra) + "\\,\\mathrm{m}$ の点 A に $q_A = +" + qv(qa, "C") + "$、右 $" + fmt(rb) + "\\,\\mathrm{m}$ の点 B に $q_B = +" + qv(qb, "C") + "$ の点電荷を置いた。$q_0$ に働く力の大きさは $\\square \\times 10^9\\,\\mathrm{N}$ です。□ に入る数はいくつですか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とします。", fig: {kind: "u48s11lm", L: tbU48s11_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_A","qas":"+","qb":"{q}_B","qbs":"+","na":"A","n0":"P","nb":"B","ra":"{r}_A","rb":"{r}_B","f1":null,"f2":null,"f":null}, [["q0", "{q}_0=" + qf(q0, "C")], ["qa", "{q}_A=" + qf(qa, "C")], ["qb", "{q}_B=" + qf(qb, "C")], ["ra", fmt(ra) + " m"], ["rb", fmt(rb) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A から $9 \\times \\dfrac{" + fmt(qa) + " \\times " + fmt(q0) + "}{" + fmt(ra) + "^2} = " + fmt(Fa) + "$（右向き）、B から $9 \\times \\dfrac{" + fmt(qb) + " \\times " + fmt(q0) + "}{" + fmt(rb) + "^2} = " + fmt(Fb) + "$（左向き）", "逆向きなので引く　$" + fmt(ok) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u48s11same", p: {q0: q0, qa: qa, qb: qb, ra: ra, rb: rb, xa: -ra, xb: rb, sa: 1, sb: 1}}};
  }
  throw new Error("u48s11same：条件に合う数字が見つからない");
}
function tbU48s11_Qopp(r){
  var gcd = tbU48s11_gcd, ratio = tbU48s11_ratio, par = tbU48s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q0 = pick(r, [1,2]);
    var qa = pick(r, [1,2,3,4,6,8,9,12,16,18]);
    var qb = pick(r, [1,2,3,4,6,8,9]);
    var ra = pick(r, [2,3,4]);
    var rb = pick(r, [1,2]);
    var Fa = (9 * q0 * qa / (ra * ra));
    var Fb = (9 * q0 * qb / (rb * rb));
    if (!(ra > rb && Number.isInteger(Fa) && Number.isInteger(Fb) && Fa != Fb)) continue;
    var ok = (Fa + Fb);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s11_three4(ok, [{x: (abs(Fa - Fb)), why: "同じ向きの2つの力を引いた（同じ向きは足す）", w: 0, cut: 0}, {x: (Fa), why: "A からの力だけを出した（B からの力を入れていない）", w: 1, cut: 1}, {x: (Fb), why: "B からの力だけを出した（A からの力を入れていない）", w: 2, cut: 1}, {x: (9 * q0 * qa / ra + 9 * q0 * qb / rb), why: "距離を2乗していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s11opp", text: "図のように、真空中で、点 P に置いた点電荷 $q_0 = +" + qv(q0, "C") + "$ の左 $" + fmt(ra) + "\\,\\mathrm{m}$ の点 A に $q_A = +" + qv(qa, "C") + "$、右 $" + fmt(rb) + "\\,\\mathrm{m}$ の点 B に $q_B = -" + qv(qb, "C") + "$ の点電荷を置いた。$q_0$ に働く力の大きさは $\\square \\times 10^9\\,\\mathrm{N}$ です。□ に入る数はいくつですか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とします。", fig: {kind: "u48s11lm", L: tbU48s11_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_A","qas":"+","qb":"{q}_B","qbs":"+","na":"A","n0":"P","nb":"B","ra":"{r}_A","rb":"{r}_B","f1":null,"f2":null,"f":null}, [["q0", "{q}_0=" + qf(q0, "C")], ["qa", "{q}_A=" + qf(qa, "C")], ["qb", "{q}_B=-" + qf(qb, "C")], ["qbs", "-"], ["ra", fmt(ra) + " m"], ["rb", fmt(rb) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A から $" + fmt(Fa) + "$（離れる右向き）、B から $" + fmt(Fb) + "$（引き合う右向き）", "同じ向きなので足す　$" + fmt(ok) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u48s11opp", p: {q0: q0, qa: qa, qb: qb, ra: ra, rb: rb, xa: -ra, xb: rb, sa: 1, sb: -1}}};
  }
  throw new Error("u48s11opp：条件に合う数字が見つからない");
}
function tbU48s11_Qend(r){
  var gcd = tbU48s11_gcd, ratio = tbU48s11_ratio, par = tbU48s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q0 = pick(r, [1,2]);
    var qa = pick(r, [1,2,3,4,6,8,9,12,16,18]);
    var qb = pick(r, [1,2,3,4,6,8,9]);
    var ra = pick(r, [2,3,4]);
    var rb = pick(r, [1,2]);
    var k = pick(r, [1,2]);
    var Fa = (9 * q0 * qa / (ra * ra));
    var Fb = (9 * q0 * qb / (rb * rb));
    var sB = (k == 1 ? '+' : '-');
    if (!(ra > rb && Number.isInteger(Fa) && Number.isInteger(Fb) && Fa != Fb)) continue;
    var ok = (k == 1 ? Fa + Fb : abs(Fa - Fb));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s11_three4(ok, [{x: (k == 1 ? abs(Fa - Fb) : Fa + Fb), why: "向きを取り違えた（同じ向きは足し、逆向きは引く）", w: 0, cut: 0}, {x: (Fa), why: "A からの力だけを出した（B からの力を入れていない）", w: 1, cut: 1}, {x: (Fb), why: "B からの力だけを出した（A からの力を入れていない）", w: 2, cut: 1}, {x: (9 * q0 * qa / ((ra - rb) * (ra - rb))), why: "A までの距離を B から測った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s11end", text: "図のように、真空中で、点 P に置いた点電荷 $q_0 = +" + qv(q0, "C") + "$ の左 $" + fmt(ra) + "\\,\\mathrm{m}$ の点 A に $q_A = +" + qv(qa, "C") + "$、左 $" + fmt(rb) + "\\,\\mathrm{m}$ の点 B に $q_B = " + String(sB) + qv(qb, "C") + "$ の点電荷を置いた。$q_0$ に働く力の大きさは $\\square \\times 10^9\\,\\mathrm{N}$ です。□ に入る数はいくつですか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とします。", fig: {kind: "u48s11lr", L: tbU48s11_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_A","qas":"+","qb":"{q}_B","qbs":"+","na":"A","n0":"P","nb":"B","ra":"{r}_A","rb":"{r}_B","f1":null,"f2":null,"f":null}, [["q0", "{q}_0=" + qf(q0, "C")], ["qa", "{q}_A=" + qf(qa, "C")], ["qb", "{q}_B=" + String(sB) + qf(qb, "C")], ["qbs", String(sB)], ["ra", fmt(ra) + " m"], ["rb", fmt(rb) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A から $" + fmt(Fa) + "$（離れる右向き）、B から $" + fmt(Fb) + "$（" + String(k == 1 ? '離れる右向き' : '引き合う左向き') + "）", String(k == 1 ? '同じ向きなので足す' : '逆向きなので引く') + "　$" + fmt(ok) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u48s11end", p: {q0: q0, qa: qa, qb: qb, ra: ra, rb: rb, xa: -ra, xb: -rb, sa: 1, sb: k == 1 ? 1 : -1, k: k}}};
  }
  throw new Error("u48s11end：条件に合う数字が見つからない");
}
function tbU48s11_Qrt(r){
  var gcd = tbU48s11_gcd, ratio = tbU48s11_ratio, par = tbU48s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q0 = pick(r, [1,2]);
    var qa = pick(r, [1,2,3,4,6,8,9,12,16,18]);
    var qb = pick(r, [1,2,3,4,6,8,9]);
    var ra = pick(r, [2,3,4]);
    var rb = pick(r, [1,2]);
    var Fa = (9 * q0 * qa / (ra * ra));
    var Fb = (9 * q0 * qb / (rb * rb));
    var X = (Fa / Fb);
    if (!(ra > rb && Number.isInteger(Fa) && Number.isInteger(Fb) && Fa != Fb && Math.abs(X * 100 - Math.round(X * 100)) < 1e-9)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s11_three4(ok, [{x: (qa / qb), why: "距離を見ていない（電荷の比だけ）", w: 0, cut: 1}, {x: ((rb * rb) / (ra * ra)), why: "電荷を見ていない（距離の比だけ）", w: 1, cut: 1}, {x: ((qa / ra) / (qb / rb)), why: "距離を2乗していない", w: 2, cut: 0}, {x: (Fb / Fa), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s11rt", text: "図のように、真空中で、点 P に置いた点電荷 $q_0$ の左 $" + fmt(ra) + "\\,\\mathrm{m}$ の点 A に $q_A = +" + qv(qa, "C") + "$、右 $" + fmt(rb) + "\\,\\mathrm{m}$ の点 B に $q_B = +" + qv(qb, "C") + "$ の点電荷を置いた。$q_0$ が A から受ける力 $F_1$ は、B から受ける力 $F_2$ の何倍ですか。", fig: {kind: "u48s11lm", L: tbU48s11_fig({"q0":"{q}_0","q0s":"+","qa":"{q}_A","qas":"+","qb":"{q}_B","qbs":"+","na":"A","n0":"P","nb":"B","ra":"{r}_A","rb":"{r}_B","f1":null,"f2":null,"f":null}, [["qa", "{q}_A=" + qf(qa, "C")], ["qb", "{q}_B=" + qf(qb, "C")], ["ra", fmt(ra) + " m"], ["rb", fmt(rb) + " m"], ["f1", "{F}_1"], ["f2", "{F}_2"], ["f1a", "out"], ["f2a", "out"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F_1 = 9 \\times 10^9 \\times \\dfrac{" + fmt(qa) + " q_0}{" + fmt(ra) + "^2}$、$F_2 = 9 \\times 10^9 \\times \\dfrac{" + fmt(qb) + " q_0}{" + fmt(rb) + "^2}$", "割ると $9 \\times 10^9$ と $q_0$ が消える　$" + qv(ok, "X") + "$"], chk: {form: "u48s11rt", p: {qa: qa, qb: qb, ra: ra, rb: rb}}};
  }
  throw new Error("u48s11rt：条件に合う数字が見つからない");
}
// 48-12 10のべき乗のまま計算する の練習（※ textbook/gen/make_section.py が textbook/gen/data/u48_s12.py から作った。手で直さない（データを直して作り直す）。）
function tbU48s12_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU48s12_ratio(a){ var g = a.reduce(function(x, y){ return tbU48s12_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU48s12_par(a, b){ return a * b / (a + b); }
function tbU48s12_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s12_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU48s12_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s12_threen(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU48s12_three4n(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU48s12_Qc(r){
  var gcd = tbU48s12_gcd, ratio = tbU48s12_ratio, par = tbU48s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [-1,-2,-3]);
    var b = pick(r, [-2,-3,-4,-5]);
    var Ss = (String(Math.pow(10, a).toFixed(-a)));
    var ds = ('1×10' + ({'-1': '⁻¹', '-2': '⁻²', '-3': '⁻³', '-4': '⁻⁴', '-5': '⁻⁵', '-6': '⁻⁶', '1': '', '2': '²', '3': '³'})[String(b)]);
    var dt = (String(b));
    if (!(b < a)) continue;
    var ok = (-12 + a - b);
    if (!(isFinite(ok) && nice(ok) && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s12_three4n(ok, [{x: (-12 + a), why: "距離で割るのを飛ばした", w: 0, cut: 1}, {x: (-12 - b), why: "面積を掛けるのを飛ばした", w: 1, cut: 1}, {x: (a - b), why: "$\\varepsilon_0$ の $10^{-12}$ を掛けていない", w: 2, cut: 1}, {x: (-12 + a + b), why: "割るのに右上の数を足した（割る時は引く）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s12c", text: "図のように、真空中の平行平板コンデンサの極板の面積は $" + String(Ss) + "\\,\\mathrm{m^2}$、極板の間の距離は $1 \\times 10^{" + String(dt) + "}\\,\\mathrm{m}$ です。静電容量は $8.85 \\times 10^{\\square}\\,\\mathrm{F}$ です。□ に入る数はいくつですか。ただし $\\varepsilon_0 = 8.85 \\times 10^{-12}$ とします。", fig: {kind: "u48s12pl", L: tbU48s12_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}"}, [["s", "{S}=" + String(Ss) + " m²"], ["d", "{d}=" + String(ds) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["面積 $" + String(Ss) + " = 10^{" + fmt(a) + "}$　$C = \\dfrac{\\varepsilon_0 S}{d}$", "右上の数だけ　$-12 + (" + fmt(a) + ") - (" + fmt(b) + ") = " + fmt(ok) + "$"], chk: {form: "u48s12c", p: {a: a, b: b}}};
  }
  throw new Error("u48s12c：条件に合う数字が見つからない");
}
function tbU48s12_Qq(r){
  var gcd = tbU48s12_gcd, ratio = tbU48s12_ratio, par = tbU48s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [1,2,3,4,5,6,8]);
    var k = pick(r, [1,2,3]);
    var V = (Math.pow(10, k));
    var ok = (-6 + k);
    if (!(isFinite(ok) && nice(ok) && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s12_three4n(ok, [{x: (-6), why: "電圧の 10 のべき乗を掛けていない", w: 0, cut: 1}, {x: (k), why: "μ（$10^{-6}$）を落とした", w: 1, cut: 1}, {x: (-6 - k), why: "掛けるのに右上の数を引いた（掛ける時は足す）", w: 2, cut: 0}, {x: (-6 * k), why: "右上の数を掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s12q", text: "図のように、静電容量 $" + fmt(n) + "\\,\\mu\\mathrm{F}$ のコンデンサに $" + qv(V, "V") + "$ を加えた。蓄えられる電荷は $" + fmt(n) + " \\times 10^{\\square}\\,\\mathrm{C}$ です。□ に入る数はいくつですか。", fig: {kind: "u48s12cv", L: tbU48s12_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}"}, [["c", "{C}=" + fmt(n) + " μF"], ["src", "{V}=" + qf(V, "V")], ["s", null], ["d", null], ["top", null], ["bot", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(n) + "\\,\\mu\\mathrm{F} = " + fmt(n) + " \\times 10^{-6}\\,\\mathrm{F}$、$" + fmt(V) + " = 10^{" + fmt(k) + "}$", "$Q = CV$　掛けるので右上の数を足す　$-6 + " + fmt(k) + " = " + fmt(ok) + "$"], chk: {form: "u48s12q", p: {k: k}}};
  }
  throw new Error("u48s12q：条件に合う数字が見つからない");
}
function tbU48s12_Qf(r){
  var gcd = tbU48s12_gcd, ratio = tbU48s12_ratio, par = tbU48s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var p = pick(r, [3,4,5,6]);
    var m = pick(r, [3,4,5,6]);
    var c = pick(r, [1,2]);
    var rs = (String(Math.pow(10, -c).toFixed(c)));
    var ok = (9 - p - m + 2 * c);
    if (!(isFinite(ok) && nice(ok) && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s12_three4n(ok, [{x: (9 - p - m), why: "距離の2乗で割るのを飛ばした", w: 0, cut: 1}, {x: (-p - m + 2 * c), why: "$9 \\times 10^9$ の $10^9$ を掛けていない", w: 1, cut: 1}, {x: (9 - p - m + c), why: "距離を2乗していない", w: 2, cut: 0}, {x: (9 - p - m - 2 * c), why: "割るのに右上の数を足した（割る時は引く）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s12f", text: "図のように、真空中で $q_1 = 1 \\times 10^{-" + fmt(p) + "}\\,\\mathrm{C}$ と $q_2 = 1 \\times 10^{-" + fmt(m) + "}\\,\\mathrm{C}$ の点電荷を、$" + String(rs) + "\\,\\mathrm{m}$ 離して置いた。働く力は $9 \\times 10^{\\square}\\,\\mathrm{N}$ です。□ に入る数はいくつですか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とします。", fig: {kind: "u48s12pr", L: tbU48s12_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}"}, [["q1", "{q}_1"], ["q2", "{q}_2"], ["q1s", "+"], ["q2s", "+"], ["r", String(rs) + " m"], ["s", null], ["d", null], ["c", null], ["top", null], ["bot", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = 9 \\times 10^9 \\times \\dfrac{10^{-" + fmt(p) + "} \\times 10^{-" + fmt(m) + "}}{(10^{-" + fmt(c) + "})^2}$", "右上の数だけ　$9 - " + fmt(p) + " - " + fmt(m) + " + 2 \\times " + fmt(c) + " = " + fmt(ok) + "$"], chk: {form: "u48s12f", p: {p: p, m: m, c: c}}};
  }
  throw new Error("u48s12f：条件に合う数字が見つからない");
}
function tbU48s12_Qrt(r){
  var gcd = tbU48s12_gcd, ratio = tbU48s12_ratio, par = tbU48s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [-1,-2,-3]);
    var b1 = pick(r, [-2,-3,-4]);
    var a2 = pick(r, [-1,-2,-3]);
    var b2 = pick(r, [-2,-3,-4]);
    var X = (Math.pow(10, a1 - b1 - a2 + b2));
    var s1 = (String(Math.pow(10, a1).toFixed(-a1)));
    var s2 = (String(Math.pow(10, a2).toFixed(-a2)));
    var e1 = (String(b1));
    var e2 = (String(b2));
    if (!(b1 < a1 && b2 < a2 && a1 != a2 && b1 != b2 && X != 1 && X >= 0.01 && X <= 1000)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU48s12_three4(ok, [{x: (Math.pow(10, a1 - a2)), why: "距離を見ていない（面積の比だけ）", w: 0, cut: 1}, {x: (Math.pow(10, b2 - b1)), why: "面積を見ていない（距離の比だけ）", w: 1, cut: 1}, {x: (1 / X), why: "比を逆にした", w: 2, cut: 0}, {x: (a1 - b1 - a2 + b2), why: "右上の数で止めた（10 のべき乗を倍に直していない）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u48s12rt", text: "真空中の平行平板コンデンサ A は極板の面積 $" + String(s1) + "\\,\\mathrm{m^2}$・距離 $1 \\times 10^{" + String(e1) + "}\\,\\mathrm{m}$、B は面積 $" + String(s2) + "\\,\\mathrm{m^2}$・距離 $1 \\times 10^{" + String(e2) + "}\\,\\mathrm{m}$ です。A の静電容量は B の何倍ですか。", fig: {kind: "u48s12pl", L: tbU48s12_fig({"top":"","bot":"","s":"{S}","d":"{d}","c":"{C}"}, [["s", "{S}"], ["d", "{d}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon_0 S}{d}$　割ると $\\varepsilon_0$ が消える", "$\\dfrac{10^{" + fmt(a1) + "}}{10^{" + fmt(b1) + "}} \\div \\dfrac{10^{" + fmt(a2) + "}}{10^{" + fmt(b2) + "}} = 10^{" + fmt(a1 - b1 - a2 + b2) + "} = " + qv(ok, "X") + "$"], chk: {form: "u48s12rt", p: {a1: a1, b1: b1, a2: a2, b2: b2}}};
  }
  throw new Error("u48s12rt：条件に合う数字が見つからない");
}
var GEN = {
  // 48-1 誘電体を直列・並列と読む
  1: function(r){ return pick(r, [tbU48s1_Qs11, tbU48s1_Qs12, tbU48s1_Qs21, tbU48s1_Qp11, tbU48s1_Qp12, tbU48s1_Qp21, tbU48s1_Qrg, tbU48s1_Qrg])(r); },
  // 48-2 違うコンデンサの直列の電圧
  2: function(r){ return pick(r, [tbU48s2_Qv, tbU48s2_Qv, tbU48s2_Qv, tbU48s2_Qr, tbU48s2_Qr, tbU48s2_Qer, tbU48s2_Qer])(r); },
  // 48-3 直列のコンデンサの中の電界
  3: function(r){ return pick(r, [tbU48s3_Qe, tbU48s3_Qe, tbU48s3_Qe, tbU48s3_Qr, tbU48s3_Qr])(r); },
  // 48-4 つないだまま・切り離した
  4: function(r){ return pick(r, [tbU48s4_Qkeep, tbU48s4_Qkeep, tbU48s4_Qkeep, tbU48s4_Qoffv, tbU48s4_Qoffv, tbU48s4_Qoffv, tbU48s4_Qoffe, tbU48s4_Qoffe, tbU48s4_Qwhich, tbU48s4_Qratio, tbU48s4_Qratio])(r); },
  // 48-5 極板の形から合成
  5: function(r){ return pick(r, [tbU48s5_Qser, tbU48s5_Qser, tbU48s5_Qser, tbU48s5_Qpar, tbU48s5_Qpar, tbU48s5_Qpar, tbU48s5_Qrp, tbU48s5_Qrp])(r); },
  // 48-6 直並列の電荷
  6: function(r){ return pick(r, [tbU48s6_QqR, tbU48s6_QqR, tbU48s6_QqL, tbU48s6_QqL, tbU48s6_QqS, tbU48s6_QqS, tbU48s6_QcR, tbU48s6_QcL, tbU48s6_QcS, tbU48s6_Qrat])(r); },
  // 48-7 合成から静電エネルギー
  7: function(r){ return pick(r, [tbU48s7_Qser, tbU48s7_Qser, tbU48s7_Qser, tbU48s7_Qpar, tbU48s7_Qpar, tbU48s7_Qrt, tbU48s7_Qrt])(r); },
  // 48-8 電荷の合計を並列の合成で割る
  8: function(r){ return pick(r, [tbU48s8_Qemp, tbU48s8_Qemp, tbU48s8_Qemp, tbU48s8_Qboth, tbU48s8_Qboth, tbU48s8_Qthr, tbU48s8_Qthr, tbU48s8_Qrt, tbU48s8_Qrt])(r); },
  // 48-9 電界の強さから電束密度
  9: function(r){ return pick(r, [tbU48s9_Qd, tbU48s9_Qd, tbU48s9_Qd, tbU48s9_Qrt, tbU48s9_Qrt])(r); },
  // 48-10 電界の強さから運ぶ仕事
  10: function(r){ return pick(r, [tbU48s10_Qw, tbU48s10_Qw, tbU48s10_Qw, tbU48s10_Qdv, tbU48s10_Qdv, tbU48s10_Qf, tbU48s10_Qf, tbU48s10_Qrt, tbU48s10_Qrt])(r); },
  // 48-11 一直線上の力の足し引き
  11: function(r){ return pick(r, [tbU48s11_Qsame, tbU48s11_Qsame, tbU48s11_Qopp, tbU48s11_Qopp, tbU48s11_Qend, tbU48s11_Qend, tbU48s11_Qrt, tbU48s11_Qrt])(r); },
  // 48-12 10のべき乗のまま計算する
  12: function(r){ return pick(r, [tbU48s12_Qc, tbU48s12_Qc, tbU48s12_Qc, tbU48s12_Qq, tbU48s12_Qq, tbU48s12_Qf, tbU48s12_Qf, tbU48s12_Qrt, tbU48s12_Qrt])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t48s1e","scene":"t48s1e","kind":"u48s1ae","lab":{"top":"","bot":"","m1":"{ε}_1","m2":"{ε}_2"},"viewbox":"54 124 1029 448","band":{"want":"誘電体が2つ入った静電容量","ans":"層＝直列・面積の方向＝並列と読んでから合成","full":"極板と平行に重なった層は直列、面積の方向に並んだ物は並列。それぞれの静電容量を C = εS/d で出し、直列は和分の積、並列は足す。"},"narr":{"start":{"co":1,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"誘電体が2つ入った静電容量は、\n①直列か並列かを読む\n②それぞれの $C$\n③合成\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["M1","M2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"極板と平行に重なった層は、〖直列〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["M1","M2","Cut"]},{"text":"面積の方向に並んだ物は、〖並列〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"col","emph":["M1","M2","Cut"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"それぞれの $C$ は、厚さと面積の割合と比誘電率を入れて、$C = \\dfrac{\\varepsilon S}{d}$ で出します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["M1","M2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖読んだ形の式で、2つの $C$ をまとめます〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["M1","M2"],"ans":true}]}],"groups":{"M1":["m1f","m1t0","m1t1","m1fx1","m1tx10","m1tx11"],"M2":["m2f","m2t0","m2t1","m2fx1","m2tx10","m2tx11"],"Cut":["cut1","cut1x1"],"Top":["zt","top","topt0","topt1","ztx1","topx1","toptx10","toptx11"],"Bot":["zb","bot","bott0","bott1","zbx1","botx1","bottx10","bottx11"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1","de1x1","de2x1","ddx1","ddx1:h","ddx1:h2","dtx10","dtx11"],"V":["va","va:h","ve1","ve2","vt0","vt1","vax1","vax1:h","ve1x1","ve2x1","vtx10","vtx11"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1","se1x1","se2x1","sdx1","sdx1:h","sdx1:h2","stx10","stx11"],"Cap":["capt0","capt1","captx10","captx11"],"E1":["e1_0","e1_0:h","e1_1","e1_1:h","e1_2","e1_2:h","e1_3","e1_3:h","e1t0","e1t1"],"T1":["t1e1","t1e2","t1d","t1d:h","t1d:h2","t1t0","t1t1"],"V1":["v1a","v1a:h","v1t0","v1t1"],"E2":["e2_0","e2_0:h","e2_1","e2_1:h","e2_2","e2_2:h","e2_3","e2_3:h","e2t0","e2t1"],"T2":["t2e1","t2e2","t2d","t2d:h","t2d:h2","t2t0","t2t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"S1":["s1e1x1","s1e2x1","s1dx1","s1dx1:h","s1dx1:h2","s1tx10","s1tx11"],"C1":["c1tx10","c1tx11"],"S2":["s2e1x1","s2e2x1","s2dx1","s2dx1:h","s2dx1:h2","s2tx10","s2tx11"],"C2":["c2tx10","c2tx11"]},"moves":{"col":{"to":{"t":1},"dur":0.6}},"route":["直列か並列か","それぞれの C","合成"]}},{"id":"t48s1x","scene":"t48s1x","kind":"u48s1l11","lab":{"top":"","bot":"","m1":"{ε}_r=2","m2":"{ε}_r=6","t1":"{d}/2","t2":"{d}/2"},"viewbox":"54 204 1029 368","band":{"want":"静電容量は $C_0$ の何倍か","known":"厚さの半分ずつ、上 $\\varepsilon_r = 2$・下 $\\varepsilon_r = 6$（極板と平行）","ans":"$3$ 倍"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、静電容量が $C_0$ の何倍かです。","at":{"強調":1.0},"after":[],"emph":["M1","M2"]},{"text":"①直列か並列かを読む\n②それぞれの $C$\n③合成\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["M1","M2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"誘電体は極板と平行に重なっているので、〖直列〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["M1","M2","Cut"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"どちらも厚さが半分なので、真空なら $2C_0$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["T1","T2"]},{"text":"比誘電率を掛けます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["M1","M2"],"eq":[{"cont":false,"items":[["C_1 = 2 \\times 2C_0 = 4C_0"],["C_2 = 6 \\times 2C_0 = 12C_0"]]}],"emphPre":["M1","M2"]},{"text":"〖この2つを次の直列の式に使います〗。","at":{"強調":1.0},"after":[],"emph":["M1","M2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なので、和分の積でまとめます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["M1","M2"],"eq":[{"cont":false,"items":[["C = \\dfrac{4C_0 \\times 12C_0}{4C_0 + 12C_0}"],["C = 3C_0"]]}],"ans":true,"emphPre":["M1","M2"]}]}],"groups":{"M1":["m1f","m1t0","m1t1"],"M2":["m2f","m2t0","m2t1"],"Cut":["cut1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E1":["e1_0","e1_0:h","e1_1","e1_1:h","e1_2","e1_2:h","e1_3","e1_3:h","e1t0","e1t1"],"T1":["t1e1","t1e2","t1d","t1d:h","t1d:h2","t1t0","t1t1"],"V1":["v1a","v1a:h","v1t0","v1t1"],"E2":["e2_0","e2_0:h","e2_1","e2_1:h","e2_2","e2_2:h","e2_3","e2_3:h","e2t0","e2t1"],"T2":["t2e1","t2e2","t2d","t2d:h","t2d:h2","t2t0","t2t1"],"V2":["v2a","v2a:h","v2t0","v2t1"]},"moves":{},"route":["直列か並列か","それぞれの C","合成"]}},{"id":"t48s2e","scene":"t48s2e","kind":"u48s2xx","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","v1":"{V}_1","v2":"{V}_2","_v":{"c1":1,"c2":2}},"viewbox":"464 226 595 408","band":{"want":"違うコンデンサを直列にした時の電圧","ans":"$C$ の比を出してから逆比で分ける","full":"面積が同じなら、静電容量は比誘電率に比例し、距離に反比例する。2つの静電容量の比を出し、直列の電圧はその逆比で分ける。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"違うコンデンサを直列にした時の電圧は、\n①$C$ の比を出す\n②逆比で分ける\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C = \\dfrac{\\varepsilon S}{d}$ なので、面積が同じなら、静電容量は〖比誘電率に比例し、距離に反比例〗します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","C2"]},{"text":"〖この比を次の分け方に使います〗。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列の電圧は、静電容量の〖逆比〗で分かれます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["V2","src","C1","C2"],"eq":[{"cont":false,"items":[["V_2 = V \\times \\dfrac{C_1}{C_1 + C_2}"]]}],"ans":true,"emphPre":["V1","V2","src"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u48s2xxL","u48s2xxw1","zbu48s2xx0hi"],"zlo":["u48s2xxRw","u48s2xxw3","zbu48s2xx1lo"],"zmid":["u48s2xxw2","zbu48s2xx2mid"]},"moves":{},"route":["C の比","逆比で分ける"]}},{"id":"t48s2x","scene":"t48s2x","kind":"u48s2xx","lab":{"src":"{V}=120 V","c1":["{C}_1","{C}_1={C}_0"],"c2":["{C}_2","{C}_2=2{C}_0"],"v1":"{V}_1","v2":["{V}_2","{V}_2=40 V"],"_v":{"c1":1,"c2":2}},"viewbox":"464 226 595 408","band":{"want":"$C_2$ の電圧 $V_2$","known":"$C_1$：真空・距離 $d$、$C_2$：比誘電率 4・距離 $2d$、$V = 120\\,\\mathrm{V}$","ans":"$V_2 = 40\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"c1v":0,"c2v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、$C_2$ の電圧 $V_2$ です。","at":{"強調":1.0},"after":[],"emph":["V2","C2"]},{"text":"①$C$ の比を出す\n②逆比で分ける\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1$ は真空・距離 $d$ なので、$C_0$ とします。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1"]},{"text":"$C_2$ は比誘電率 4 で 4 倍、距離が 2 倍で $\\dfrac{1}{2}$ 倍です。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"c","emph":["C2","C1"],"eq":[{"cont":false,"items":[["C_2 = 4 \\times \\dfrac{1}{2} C_0 = 2C_0"]]}],"emphPre":["C2","C1"]},{"text":"〖この $C_1 : C_2 = 1 : 2$ を次の分け方に使います〗。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列の電圧は逆比なので、$V_2$ の分子には $C_1$ が来ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V2","src","C1","C2"],"eq":[{"cont":false,"items":[["V_2 = V \\times \\dfrac{C_1}{C_1 + C_2}"],["V_2 = 120 \\times \\dfrac{1}{1 + 2} = 40\\,\\mathrm{V}"]]}],"move":"v2","ans":true,"emphPre":["V2","src","C1","C2"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u48s2xxL","u48s2xxw1","zbu48s2xx0hi"],"zlo":["u48s2xxRw","u48s2xxw3","zbu48s2xx1lo"],"zmid":["u48s2xxw2","zbu48s2xx2mid"]},"moves":{"c":{"to":{"c1v":1,"c2v":1},"dur":0.5},"v2":{"to":{"v2v":1},"dur":0.5}},"route":["C の比","逆比で分ける"]}},{"id":"t48s3e","scene":"t48s3e","kind":"u48s3xx","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","v1":"{V}_1","v2":"{V}_2","_v":{"c1":1,"c2":3}},"viewbox":"464 226 595 408","band":{"want":"直列のコンデンサの中の電界","ans":"逆比で分けた電圧を、その距離で割る","full":"直列のコンデンサの電圧は静電容量の逆比で分かれる。そのコンデンサの電圧を、極板の間の距離で割ると電界 E = V/d。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列のコンデンサの中の電界は、\n①逆比で電圧を分ける\n②電界を出す\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列の電圧は、静電容量の〖逆比〗で分かれます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["V1","src","C2","C1"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{C_2}{C_1 + C_2}"]]}],"emphPre":["V1","src","C2","C1"],"zb":true},{"text":"〖この $V_1$ が、次の電界の式の $V$ です〗。全部の電圧 $V$ ではありません。","at":{"強調":1.0},"after":[],"emph":["V1","src"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$V_1$ を、$C_1$ の極板の間の距離で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["V1","C1"],"eq":[{"cont":false,"items":[["E_1 = \\dfrac{V_1}{d_1}"]]}],"ans":true,"emphPre":["V1","C1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u48s3xxL","u48s3xxw1","zbu48s3xx0hi"],"zlo":["u48s3xxRw","u48s3xxw3","zbu48s3xx1lo"],"zmid":["u48s3xxw2","zbu48s3xx2mid"]},"moves":{},"route":["逆比で分ける","電界を出す"]}},{"id":"t48s3x","scene":"t48s3x","kind":"u48s3xx","lab":{"src":"{V}=200 V","c1":"{C}_1=1 μF","c2":"{C}_2=3 μF","v1":["{V}_1","{V}_1=150 V"],"v2":"{V}_2","_v":{"c1":1,"c2":3}},"viewbox":"464 226 595 408","band":{"want":"$C_1$ の中の電界の強さ","known":"$C_1 = 1\\,\\mu\\mathrm{F},\\;\\; C_2 = 3\\,\\mu\\mathrm{F},\\;\\; V = 200\\,\\mathrm{V},\\;\\; d_1 = 0.5\\,\\mathrm{m}$","ans":"$E_1 = 300\\,\\mathrm{V/m}$"},"narr":{"start":{"co":1,"v1v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、$C_1$ の中の電界の強さ $E_1$ です。","at":{"強調":1.0},"after":[],"emph":["C1"]},{"text":"①逆比で電圧を分ける\n②電界を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なので、電圧は静電容量の逆比 $3 : 1$ に分かれます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["V1","src","C1","C2"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{C_2}{C_1 + C_2}"],["V_1 = 200 \\times \\dfrac{3}{1 + 3} = 150\\,\\mathrm{V}"]]}],"move":"v1","emphPre":["V1","src","C1","C2"],"zb":true},{"text":"〖この $150\\,\\mathrm{V}$ を次の電界の式に使います〗。","at":{"強調":1.0},"after":[],"emph":["V1"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1$ の極板の間は $0.5\\,\\mathrm{m}$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["V1","C1"],"eq":[{"cont":false,"items":[["E_1 = \\dfrac{V_1}{d_1}"],["E_1 = \\dfrac{150}{0.5} = 300\\,\\mathrm{V/m}"]]}],"ans":true,"emphPre":["V1","C1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u48s3xxL","u48s3xxw1","zbu48s3xx0hi"],"zlo":["u48s3xxRw","u48s3xxw3","zbu48s3xx1lo"],"zmid":["u48s3xxw2","zbu48s3xx2mid"]},"moves":{"v1":{"to":{"v1v":1},"dur":0.5}},"route":["逆比で分ける","電界を出す"]}},{"id":"t48s4e","scene":"t48s4e","kind":"u48s4pl","lab":{"top":"","bot":"","v":"{V}","d":["{d}","{d}/2"],"c":["{C}","2{C}"]},"viewbox":"-153 204 1200 447","band":{"want":"極板の間を変えた後の電荷・電圧","ans":"変わらない方と新しい $C$ を $Q = CV$ に入れる","full":"電源につないだままなら電圧が変わらない。電源から切り離したなら電荷が変わらない。C = εS/d で新しい静電容量を出し、変わらない方と合わせて Q = CV に入れる。"},"narr":{"start":{"co":1,"dz":0,"dv":0,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"極板の間の距離を変えた後の電荷や電圧は、\n①何が変わらないかを読む\n②新しい $C$\n③電荷や電圧を出す\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["D","Cap"]}]},{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"電源につないだままなら、〖電圧が変わりません〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V"]},{"text":"電源から切り離したなら、〖電荷が変わりません〗。","at":{"強調":1.0},"after":[],"emph":["Top","Bot"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"距離を半分にすると、静電容量は 2 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"dz","emph":["D","Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖変わらない方と新しい $C$〗を、$Q = CV$ に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["V","Cap"],"eq":[{"cont":false,"items":[["Q = CV"]]}],"ans":true,"emphPre":["V","Cap"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"dz":{"to":{"dz":1,"dv":1,"cv":1},"dur":0.8}},"route":["何が変わらないか","新しい C","電荷や電圧を出す"]}},{"id":"t48s4x","scene":"t48s4x","kind":"u48s4pl","lab":{"top":"","bot":"","v":"{V}=200 V","d":["{d}","{d}/2"],"c":["{C}=6 μF","{C}'=12 μF"]},"viewbox":"-153 204 1200 447","band":{"want":"距離を半分にした後の電荷 $Q'$","known":"$C = 6\\,\\mu\\mathrm{F},\\;\\; V = 200\\,\\mathrm{V}$（つないだまま）","ans":"$Q' = 2400\\,\\mu\\mathrm{C}$"},"narr":{"start":{"co":1,"dz":0,"dv":0,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、距離を半分にした後の電荷 $Q'$ です。","at":{"強調":1.0},"after":[],"emph":["Cap","D"]},{"text":"①何が変わらないかを読む\n②新しい $C$\n③電荷や電圧を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Cap","D"]}]},{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"〖電源につないだまま〗なので、電圧は $200\\,\\mathrm{V}$ のままです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"静電容量は距離に反比例します。距離が半分なので、2 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"dz","emph":["D","Cap"],"eq":[{"cont":false,"items":[["C' = 2 \\times 6 = 12\\,\\mu\\mathrm{F}"]]}],"emphPre":["D","Cap"]},{"text":"〖この $C'$ を次の電荷の式に使います〗。","at":{"強調":1.0},"after":[],"emph":["Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"変わらない電圧と新しい $C'$ を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["V","Cap"],"eq":[{"cont":false,"items":[["Q' = C'V"],["Q' = 12 \\times 200 = 2400\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["V","Cap"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"dz":{"to":{"dz":1,"dv":1,"cv":1},"dur":0.8}},"route":["何が変わらないか","新しい C","電荷や電圧を出す"]}},{"id":"t48s5e","scene":"t48s5e","kind":"u48s5xx","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","c12":"{C}","cab":"{C}"},"viewbox":"464 256 595 376","band":{"want":"極板の形が違うコンデンサの合成静電容量","ans":"$C = \\dfrac{\\varepsilon S}{d}$ で各 $C$ を出してから合成","full":"静電容量が数で無い時は、C = εS/d で各コンデンサの静電容量を出す。同じ極板なら距離に反比例・面積に比例。直列なら和分の積、並列なら足す。"},"narr":{"start":{"co":1,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"極板の形が違うコンデンサの合成は、\n①$C_2$ を出す\n②合成\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"同じ極板なら、静電容量は〖距離に反比例し、面積に比例〗します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C2","C1"]},{"text":"〖出した $C_2$ を、次の合成の式に入れます〗。","at":{"強調":1.0},"after":[],"emph":["C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なら和分の積、並列なら足します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"cm","emph":["C12","Cab"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_1 C_2}{C_1 + C_2}"]]}],"ans":true,"emphPre":["C12","Cab"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"Cab":["cabd:e","cabd:f","cabd:a","cabt0","cabt1"],"zhi":["u48s5xxL","u48s5xxw1","u48s5xxw4"],"zlo":["u48s5xxRw","u48s5xxw3","u48s5xxw5"],"zmid":["u48s5xxw2"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8}},"route":["C2 を出す","合成"]}},{"id":"t48s5x","scene":"t48s5x","kind":"u48s5xx","lab":{"src":"{V}","c1":"{C}_1=6 μF","c2":["{C}_2","{C}_2=2 μF"],"c12":["{C}","{C}=1.5 μF"],"cab":"{C}"},"viewbox":"464 256 595 376","band":{"want":"直列の合成静電容量 $C$","known":"$C_1 = 6\\,\\mu\\mathrm{F}$・$C_2$ は同じ極板で距離が 3 倍","ans":"$C = 1.5\\,\\mu\\mathrm{F}$"},"narr":{"start":{"co":1,"cm":0,"c2v":0,"c12v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、直列の合成静電容量 $C$ です。","at":{"強調":1.0},"after":[],"emph":["C1","C2","Cab"]},{"text":"①$C_2$ を出す\n②合成\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_2$ は $C_1$ と同じ極板で、距離が 3 倍です。静電容量は距離に反比例するので $\\dfrac{1}{3}$ 倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["C2","C1"],"eq":[{"cont":false,"items":[["C_2 = 6 \\times \\dfrac{1}{3} = 2\\,\\mu\\mathrm{F}"]]}],"move":"c2","emphPre":["C2","C1"]},{"text":"〖この $2\\,\\mu\\mathrm{F}$ を次の合成の式に入れます〗。","at":{"強調":1.0},"after":[],"emph":["C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なので、1つにまとめます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"cm","emph":["C12","Cab"]},{"text":"和分の積で求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["C12","Cab"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_1 C_2}{C_1 + C_2}"],["C = \\dfrac{6 \\times 2}{6 + 2} = 1.5\\,\\mu\\mathrm{F}"]]}],"move":"c","ans":true,"emphPre":["C12","Cab"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"Cab":["cabd:e","cabd:f","cabd:a","cabt0","cabt1"],"zhi":["u48s5xxL","u48s5xxw1","u48s5xxw4"],"zlo":["u48s5xxRw","u48s5xxw3","u48s5xxw5"],"zmid":["u48s5xxw2"]},"moves":{"c2":{"to":{"c2v":1},"dur":0.5},"cm":{"to":{"cm":1},"dur":0.8},"c":{"to":{"c12v":1},"dur":0.5}},"route":["C2 を出す","合成"]}},{"id":"t48s6e","scene":"t48s6e","kind":"u48s6xx","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","c3":"{C}_3","c23":"{C}_23","q1":"{Q}_1"},"viewbox":"464 214 595 420","band":{"want":"直並列のコンデンサの電荷","ans":"全体の合成静電容量から $Q = CV$","full":"並列を足し、直列を和分の積でまとめて全体の合成静電容量 C を出す。Q = CV が全体の電荷で、直列の C1 の電荷と同じ。"},"narr":{"start":{"co":1,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直並列のコンデンサの電荷は、\n①並列を足す\n②直列をまとめる\n③電荷を出す\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2","C3"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列の部分を1つにまとめます。並列は足します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"cm","emph":["C2","C3","C23"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1$ と直列なので、和分の積で全体の合成静電容量 $C$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["C1","C23"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖この $C$ が電源から見たコンデンサ〗なので、$Q = CV$ が全体の電荷です。直列の $C_1$ の電荷と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C1","src","Q1"],"eq":[{"cont":false,"items":[["Q = CV"]]}],"ans":true,"emphPre":["C1","src","Q1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"C3":["c3","c3t0","c3t1","c3:b","c3:l1","c3:l2"],"C23":["c23","c23t0","c23t1","c23:b","c23:l1","c23:l2"],"zhi":["u48s6xxL","u48s6xxw1","zbu48s6xx0hi"],"zlo":["u48s6xxRw","u48s6xxw11","zbu48s6xx1lo","u48s6xxw3","u48s6xxw5","u48s6xxw7","zbu48s6xx3lo","u48s6xxw9","zbu48s6xx5lo"],"zmid":["u48s6xxw2","u48s6xxw4","u48s6xxw6","zbu48s6xx2mid","u48s6xxw8","zbu48s6xx4mid","u48s6xxw10","zbu48s6xx6mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8}},"route":["並列を足す","直列をまとめる","電荷を出す"]}},{"id":"t48s6x","scene":"t48s6x","kind":"u48s6xx","lab":{"src":"{V}=120 V","c1":"{C}_1=6 μF","c2":"{C}_2=1 μF","c3":"{C}_3=2 μF","c23":"{C}_23=3 μF","q1":"{Q}_1"},"viewbox":"464 214 595 420","band":{"want":"$C_1$ の電荷 $Q_1$","known":"$C_1 = 6\\,\\mu\\mathrm{F},\\;\\; C_2 = 1\\,\\mu\\mathrm{F},\\;\\; C_3 = 2\\,\\mu\\mathrm{F},\\;\\; V = 120\\,\\mathrm{V}$","ans":"$Q_1 = 240\\,\\mu\\mathrm{C}$"},"narr":{"start":{"co":1,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、$C_1$ の電荷 $Q_1$ です。","at":{"強調":1.0},"after":[],"emph":["Q1","C1"]},{"text":"①並列を足す\n②直列をまとめる\n③電荷を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q1"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_2$ と $C_3$ は並列なので、足します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"cm","emph":["C2","C3","C23"],"eq":[{"cont":false,"items":[["C_{23} = 1 + 2 = 3\\,\\mu\\mathrm{F}"]]}],"emphPre":["C2","C3","C23"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_1$ と $C_{23}$ は直列なので、和分の積で全体の $C$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["C1","C23"],"eq":[{"cont":false,"items":[["C = \\dfrac{6 \\times 3}{6 + 3} = 2\\,\\mu\\mathrm{F}"]]}],"emphPre":["C1","C23"]},{"text":"〖この $2\\,\\mu\\mathrm{F}$ を次の電荷の式に使います〗。","at":{"強調":1.0},"after":[],"emph":["C1","C23"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"全体の電荷は、直列の $C_1$ の電荷と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C1","src","Q1"],"eq":[{"cont":false,"items":[["Q_1 = CV"],["Q_1 = 2 \\times 120 = 240\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["C1","src","Q1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"C3":["c3","c3t0","c3t1","c3:b","c3:l1","c3:l2"],"C23":["c23","c23t0","c23t1","c23:b","c23:l1","c23:l2"],"zhi":["u48s6xxL","u48s6xxw1","zbu48s6xx0hi"],"zlo":["u48s6xxRw","u48s6xxw11","zbu48s6xx1lo","u48s6xxw3","u48s6xxw5","u48s6xxw7","zbu48s6xx3lo","u48s6xxw9","zbu48s6xx5lo"],"zmid":["u48s6xxw2","u48s6xxw4","u48s6xxw6","zbu48s6xx2mid","u48s6xxw8","zbu48s6xx4mid","u48s6xxw10","zbu48s6xx6mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8}},"route":["並列を足す","直列をまとめる","電荷を出す"]}},{"id":"t48s7e","scene":"t48s7e","kind":"u48s7ae","lab":{"src":"{V}","c1":"{C}_1","c2":"{C}_2","c12":"{C}"},"viewbox":"464 294 595 340","band":{"want":"直列のコンデンサの静電エネルギーの合計","ans":"合成静電容量 $C$ を出して $W = \\dfrac{1}{2} C V^2$","full":"2つのコンデンサを合成静電容量 C の1つのコンデンサにまとめると、その C に電源の電圧 V がかかる。静電エネルギーの合計は W = CV²/2。"},"narr":{"start":{"co":1,"cm":0},"steps":[{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"直列の2つのコンデンサに蓄えられる、静電エネルギーの合計を求めます。","at":{"強調":1.0},"after":[],"emph":["C1","C2","src"]},{"text":"①合成静電容量\n②静電エネルギー\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"まず、2つを1つのコンデンサにまとめます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"cm","emph":["C12"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖まとめたコンデンサに電源の電圧がかかる〗ので、この $C$ を静電エネルギーの式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["C12","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"]]}],"ans":true,"emphPre":["C12","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"zhi":["u48s7aeL","zbu48s7ae0hi","u48s7aew1","zbu48s7ae2hi","u48s7aew4","zbu48s7ae5hi"],"zlo":["u48s7aeRw","zbu48s7ae1lo","u48s7aew3","zbu48s7ae4lo","u48s7aew5","zbu48s7ae6lo"],"zmid":["u48s7aew2","zbu48s7ae3mid"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8}},"route":["合成静電容量","静電エネルギー"]}},{"id":"t48s7x","scene":"t48s7x","kind":"u48s7ax","lab":{"src":"{V}=10 V","c1":"{C}_1=2 F","c2":"{C}_2=6 F","c12":["{C}","{C}=1.5 F"]},"viewbox":"464 294 595 340","band":{"want":"静電エネルギーの合計 $W$","known":"$C_1 = 2\\,\\mathrm{F},\\;\\; C_2 = 6\\,\\mathrm{F},\\;\\; V = 10\\,\\mathrm{V}$","ans":"$W = 75\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"cm":0,"c12v":0},"steps":[{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"求めるのは、静電エネルギーの合計 $W$ です。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]},{"text":"①合成静電容量\n②静電エネルギー\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"直列なので、和分の積で1つにまとめます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"cm","emph":["C12"],"eq":[{"cont":false,"items":[["C = \\dfrac{C_1 C_2}{C_1 + C_2}"],["C = \\dfrac{2 \\times 6}{2 + 6} = 1.5\\,\\mathrm{F}"]]}],"emphPre":["C12"]},{"text":"〖この $1.5\\,\\mathrm{F}$ に、電源の $10\\,\\mathrm{V}$ がかかります〗。この値を次に使います。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"c","emph":["C12","src"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"まとめたコンデンサの静電エネルギーが、2つの合計です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["C12","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"],["W = \\dfrac{1}{2} \\times 1.5 \\times 10^2 = 75\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["C12","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"C12":["c12","c12t0","c12t1","c12:b","c12:l1","c12:l2"],"zhi":["u48s7axL","zbu48s7ax0hi","u48s7axw1","zbu48s7ax2hi","u48s7axw4","zbu48s7ax5hi"],"zlo":["u48s7axRw","zbu48s7ax1lo","u48s7axw3","zbu48s7ax4lo","u48s7axw5","zbu48s7ax6lo"],"zmid":["u48s7axw2","zbu48s7ax3mid"]},"moves":{"cm":{"to":{"cm":1},"dur":0.8},"c":{"to":{"c12v":1},"dur":0.5}},"route":["合成静電容量","静電エネルギー"]}},{"id":"t48s8e","scene":"t48s8e","kind":"u48s8rc","lab":{"c1":"{C}_1","c2":"{C}_2","sw":"S","dir":"lr","v1":["{V}_1","{V}"],"v2":["0 V","{V}"],"q1":"{Q}_1","_v":{"v1":3,"v2":0,"v":2}},"viewbox":"-42 198 1173 454","band":{"want":"つないだ後の電圧","ans":"電荷の合計を、並列の合成静電容量で割る","full":"充電したコンデンサを、充電していないコンデンサとつなぐ。電荷の合計は変わらない。移動した後は2つの電圧が同じなので並列と同じ。電圧は、電荷の合計を並列の合成静電容量で割る。"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"充電したコンデンサを、充電していないコンデンサとつないだ後の電圧を求めます。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]},{"text":"①電荷の合計\n②並列の合成\n③電圧\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"つないでも、〖電荷の合計は変わりません〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"sw","emph":["Iso","Q1"]}]},{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"移動した後は2つの電圧が同じなので、〖並列〗と同じです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"mv","emph":["C1","C2","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖この合計を、並列の合成静電容量で割ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Q1","C1","C2","V1","V2"],"eq":[{"cont":false,"items":[["V = \\dfrac{Q_1}{C_1 + C_2}"]]}],"ans":true,"emphPre":["Q1","C1","C2","V1","V2"]}]}],"groups":{"C1":["c1","c1:b","c1t0","c1t1"],"C2":["c2","c2:b","c2t0","c2t1"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"SW":["swp0","swp1","sw","swo"],"V1":["v1a","v1a:h","v1t0","v1t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"Iso":["iso"],"Iso2":["iso2"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"mv":{"to":{"mvq":1,"v1v":1,"v2v":1},"dur":1.2}},"route":["電荷の合計","並列の合成","電圧"]}},{"id":"t48s8x","scene":"t48s8x","kind":"u48s8rc","lab":{"c1":"{C}_1=3 μF","c2":"{C}_2=2 μF","sw":"S","dir":"lr","v1":["{V}_1=100 V","{V}"],"v2":["0 V","{V}"],"q1":"{Q}_1","_v":{"v1":100,"v2":0,"v":60}},"viewbox":"-42 198 1173 454","band":{"want":"つないだ後の電圧 $V$","known":"$C_1 = 3\\,\\mu\\mathrm{F}$ を $100\\,\\mathrm{V}$ で充電、$C_2 = 2\\,\\mu\\mathrm{F}$ は充電していない","ans":"$V = 60\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、つないで電荷が移動した後の電圧 $V$ です。","at":{"強調":1.0},"after":[],"emph":["V1","V2"]},{"text":"①電荷の合計\n②並列の合成\n③電圧\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V1","V2"]}]},{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"つなぐ前の電荷は $C_1$ だけです。$Q = CV$ で求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q1","C1","V1"],"eq":[{"cont":false,"items":[["Q_1 = C_1 V_1","= 3 \\times 100 = 300\\,\\mu\\mathrm{C}"]]}],"emphPre":["Q1","C1","V1"]},{"text":"つないでも、〖この $300\\,\\mu\\mathrm{C}$ が合計のまま〗です。この値を次に使います。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sw","emph":["Iso","Q1"]}]},{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"移動した後は2つの電圧が同じなので、並列と同じです。合成静電容量は足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["C_1 + C_2 = 3 + 2 = 5\\,\\mu\\mathrm{F}"]]}],"emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"電荷の合計を、並列の合成静電容量で割ります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"mv","emph":["V1","V2","Q1","C1","C2"],"eq":[{"cont":false,"items":[["V = \\dfrac{Q_1}{C_1 + C_2}","= \\dfrac{300}{5} = 60\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["V1","V2","Q1","C1","C2"]}]}],"groups":{"C1":["c1","c1:b","c1t0","c1t1"],"C2":["c2","c2:b","c2t0","c2t1"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"SW":["swp0","swp1","sw","swo"],"V1":["v1a","v1a:h","v1t0","v1t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"Iso":["iso"],"Iso2":["iso2"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"mv":{"to":{"mvq":1,"v1v":1,"v2v":1},"dur":1.2}},"route":["電荷の合計","並列の合成","電圧"]}},{"id":"t48s9e","scene":"t48s9e","kind":"u48s9ae","lab":{"top":"","bot":"","d":"{d}","e":"{E}","med":"{ε}_r","v":"{V}"},"viewbox":"-180 119 1385 543","band":{"want":"極板の間の電束密度","ans":"$E = \\dfrac{V}{d}$ を出して $D = \\varepsilon_0 \\varepsilon_r E$","full":"電圧を距離で割って電界の強さ E を出し、それに誘電率 ε0 εr を掛けると電束密度 D。"},"narr":{"start":{"co":1,"medd":1,"ed":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"誘電体で満たした極板の間の、電束密度 $D$ を求めます。","at":{"強調":1.0},"after":[],"emph":["Med"]},{"text":"①電界の強さ\n②電束密度\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Med"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電圧を距離で割ると、電界の強さです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"e","emph":["V","D","E"],"eq":[{"cont":false,"items":[["E = \\dfrac{V}{d}"]]}],"emphPre":["V","D","E"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"〖この $E$ に誘電率を掛けると〗、電束密度です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["E","Med"],"eq":[{"cont":false,"items":[["D = \\varepsilon_0 \\varepsilon_r E"]]}],"ans":true,"emphPre":["E","Med"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"e":{"to":{"ed":1},"dur":0.6}},"route":["電界の強さ","電束密度"]}},{"id":"t48s9x","scene":"t48s9x","kind":"u48s9ae","lab":{"top":"","bot":"","d":"{d}=0.5 m","e":["{E}","{E}=200 V/m"],"med":"{ε}_r=4","v":"{V}=100 V"},"viewbox":"-180 119 1385 543","band":{"want":"電束密度 $D$ は $\\varepsilon_0$ の何倍か","known":"$V = 100\\,\\mathrm{V},\\;\\; d = 0.5\\,\\mathrm{m},\\;\\; \\varepsilon_r = 4$","ans":"$800$ 倍"},"narr":{"start":{"co":1,"medd":1,"ed":0,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、電束密度 $D$ が $\\varepsilon_0$ の何倍かです。","at":{"強調":1.0},"after":[],"emph":["Med"]},{"text":"①電界の強さ\n②電束密度\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Med"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電圧を距離で割って、電界の強さを出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"e","emph":["V","D","E"],"eq":[{"cont":false,"items":[["E = \\dfrac{V}{d}"],["E = \\dfrac{100}{0.5} = 200\\,\\mathrm{V/m}"]]}],"emphPre":["V","D","E"]},{"text":"〖この $200\\,\\mathrm{V/m}$ を、次の式の $E$ に使います〗。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ev","emph":["E"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"誘電率は $\\varepsilon_0 \\varepsilon_r$ です。電界の強さに掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["E","Med"],"eq":[{"cont":false,"items":[["D = \\varepsilon_0 \\varepsilon_r E"],["D = \\varepsilon_0 \\times 4 \\times 200 = 800\\,\\varepsilon_0"]]}],"ans":true,"emphPre":["E","Med"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"e":{"to":{"ed":1},"dur":0.6},"ev":{"to":{"ev":1},"dur":0.5}},"route":["電界の強さ","電束密度"]}},{"id":"t48s10e","scene":"t48s10e","kind":"u48s10ae","lab":{"top":"","bot":"","d":"{d}","pa":"A","pb":"B","pth":"","dab":"{x}","v":"{V}","e":"{E}"},"viewbox":"-177 204 1373 458","band":{"want":"極板の間で電荷を運ぶ仕事","ans":"$E = \\dfrac{V}{d}$ → 電位差 $E x$ → $W = q E x$","full":"電圧を距離で割って電界の強さ E を出す。E に運ぶ距離 x を掛けると、2点の電位差。電位差に電荷 q を掛けると仕事。"},"narr":{"start":{"co":1,"ed":0,"pthd":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電荷 $q$ を、負の極板の A から B まで運ぶ仕事を求めます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"p","emph":["Pa","Pb","Pth"]},{"text":"①電界の強さ\n②電位差\n③仕事\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Pth"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電圧を距離で割って、電界の強さ $E$ を出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"e","emph":["V","D","E"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"〖$E$ に運ぶ距離 $x$ を掛けると〗、A と B の電位差です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["E","Dab"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電位差に電荷を掛けると、仕事です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Pa","Pb","Pth"],"eq":[{"cont":false,"items":[["W = q V_{AB}"]]}],"ans":true,"emphPre":["Pa","Pb","Pth"]}]}],"groups":{"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"],"Pa":["pad","pat0","pat1"],"Pb":["pbd","pbt0","pbt1"],"Pth":["ptha","ptha:h","ptht0","ptht1"],"Dab":["dabe1","dabe2","dabd","dabd:h","dabd:h2","dabt0","dabt1"]},"moves":{"e":{"to":{"ed":1},"dur":0.6},"p":{"to":{"pthd":1},"dur":0.6}},"route":["電界の強さ","電位差","仕事"]}},{"id":"t48s10x","scene":"t48s10x","kind":"u48s10ae","lab":{"top":"","bot":"","d":"{d}=0.5 m","pa":"A","pb":"B","pth":"","dab":"0.2 m","v":"{V}=100 V","e":["{E}","{E}=200 V/m"]},"viewbox":"-177 204 1373 458","band":{"want":"運ぶ仕事 $W$","known":"$V = 100\\,\\mathrm{V},\\;\\; d = 0.5\\,\\mathrm{m}$、$2\\,\\mathrm{C}$ を $0.2\\,\\mathrm{m}$ 運ぶ","ans":"$W = 80\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"ed":0,"ev":0,"pthd":1},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、$2\\,\\mathrm{C}$ を A から B まで運ぶ仕事 $W$ です。","at":{"強調":1.0},"after":[],"emph":["Pa","Pb","Pth"]},{"text":"①電界の強さ\n②電位差\n③仕事\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Pth"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電圧を距離で割って、電界の強さを出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"e","emph":["V","D","E"],"eq":[{"cont":false,"items":[["E = \\dfrac{V}{d}"],["E = \\dfrac{100}{0.5} = 200\\,\\mathrm{V/m}"]]}],"emphPre":["V","D","E"]},{"text":"〖この $200\\,\\mathrm{V/m}$ を次に使います〗。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"ev","emph":["E"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電界の強さに、運ぶ距離 $0.2\\,\\mathrm{m}$ を掛けると、A と B の電位差です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E","Dab"],"eq":[{"cont":false,"items":[["V_{AB} = 200 \\times 0.2 = 40\\,\\mathrm{V}"]]}],"emphPre":["E","Dab"]},{"text":"〖この $40\\,\\mathrm{V}$ に電荷を掛けます〗。","at":{"強調":1.0},"after":[],"emph":["Pa","Pb"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電位差に電荷を掛けると、仕事です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Pa","Pb","Pth"],"eq":[{"cont":false,"items":[["W = q V_{AB}"],["W = 2 \\times 40 = 80\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["Pa","Pb","Pth"]}]}],"groups":{"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"],"Pa":["pad","pat0","pat1"],"Pb":["pbd","pbt0","pbt1"],"Pth":["ptha","ptha:h","ptht0","ptht1"],"Dab":["dabe1","dabe2","dabd","dabd:h","dabd:h2","dabt0","dabt1"]},"moves":{"e":{"to":{"ed":1},"dur":0.6},"ev":{"to":{"ev":1},"dur":0.5}},"route":["電界の強さ","電位差","仕事"]}},{"id":"t48s11e","scene":"t48s11e","kind":"u48s11ae","lab":{"q0":"{q}_0","q0s":"+","qa":"{q}_A","qas":"+","qb":"{q}_B","qbs":"+","na":"A","n0":"P","nb":"B","ra":"{r}_A","rb":"{r}_B","f1":"{F}_1","f2":"{F}_2","f":"{F}","f1a":"out","f2a":"out","fa":"left"},"viewbox":"153 260 831 426","band":{"want":"一直線に並んだ電荷が受ける力","ans":"2つの力を別々に出し、同じ向きは足し・逆向きは引く","full":"P の電荷が A と B から受ける力を、それぞれクーロンの法則で出す。一直線上なので、同じ向きなら足し、逆向きなら引く。"},"narr":{"start":{"co":1,"f1d":0,"f2d":0,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"一直線に並んだ3つの電荷のうち、P の電荷 $q_0$ が受ける力を求めます。","at":{"強調":1.0},"after":[],"emph":["Q0","N0"]},{"text":"①それぞれの力\n②向きを見て足し引き\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q0"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"A からの力と B からの力を、別々にクーロンの法則で出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"f","emph":["F1","F2","Qa","Qb"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"〖2つの力は同じ線の上〗なので、同じ向きなら足し、逆向きなら引きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"ff","emph":["F","F1","F2"],"eq":[{"cont":false,"items":[["F = F_2 - F_1"]]}],"ans":true,"emphPre":["F1","F2","F"]}]}],"groups":{"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Q0":["q0c","q0c:t","q0m","q0mt","q0t0","q0t1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Na":["nat0","nat1"],"N0":["n0t0","n0t1"],"Nb":["nbt0","nbt1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"F":["fa","fa:h","ft0","ft1"],"Ra":["rae1","rae2","rad","rad:h","rad:h2","rat0","rat1"],"Rb":["rbe1","rbe2","rbd","rbd:h","rbd:h2","rbt0","rbt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8},"ff":{"to":{"fd":1},"dur":0.8}},"route":["それぞれの力","足し引き"]}},{"id":"t48s11x","scene":"t48s11x","kind":"u48s11ae","lab":{"q0":"{q}_0=1 C","q0s":"+","qa":"{q}_A=4 C","qas":"+","qb":"{q}_B=3 C","qbs":"+","na":"A","n0":"P","nb":"B","ra":"2 m","rb":"1 m","f1":["{F}_1","{F}_1=9"],"f2":["{F}_2","{F}_2=27"],"f":["{F}","{F}=18"],"f1a":"out","f2a":"out","fa":"left"},"viewbox":"153 260 831 426","band":{"want":"$q_0$ に働く力の大きさと向き","known":"$q_A = 4\\,\\mathrm{C}$（左 $2\\,\\mathrm{m}$）、$q_B = 3\\,\\mathrm{C}$（右 $1\\,\\mathrm{m}$）、$q_0 = 1\\,\\mathrm{C}$","ans":"$18 \\times 10^9\\,\\mathrm{N}$・左向き"},"narr":{"start":{"co":1,"f1d":0,"f2d":0,"fd":0,"f1v":0,"f2v":0,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、$q_0$ に働く力の大きさと向きです。","at":{"強調":1.0},"after":[],"emph":["Q0"]},{"text":"①A からの力\n②B からの力\n③足し引き\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q0"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"A からの力です。〖$10^9$ は外して〗計算します。同じ符号なので、A から離れる右向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"f1","emph":["F1"],"eq":[{"cont":false,"items":[["F_1 = 9 \\times \\dfrac{4 \\times 1}{2^2} = 9"]]}],"emphPre":["F1","Qa","Ra","Q0"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"B からの力です。同じ符号なので、B から離れる左向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"f2","emph":["F2"],"eq":[{"cont":false,"items":[["F_2 = 9 \\times \\dfrac{3 \\times 1}{1^2} = 27"]]}],"emphPre":["F2","Qb","Rb","Q0"]},{"text":"〖$F_1$ と $F_2$ は逆向き〗です。この2つの値を次で引きます。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"逆向きなので、大きい方から小さい方を引きます。向きは大きい $F_2$ の左向きです。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"move":"ff","emph":["F","F1","F2"],"eq":[{"cont":false,"items":[["F = 27 - 9 = 18"]]}],"emphPre":["F","F1","F2"]},{"text":"最後に〖$10^9$ を付けます〗。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["F"],"eq":[{"cont":false,"items":[["F = 18 \\times 10^9\\,\\mathrm{N}"]]}],"ans":true,"emphPre":["F"]}]}],"groups":{"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Q0":["q0c","q0c:t","q0m","q0mt","q0t0","q0t1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Na":["nat0","nat1"],"N0":["n0t0","n0t1"],"Nb":["nbt0","nbt1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"F":["fa","fa:h","ft0","ft1"],"Ra":["rae1","rae2","rad","rad:h","rad:h2","rat0","rat1"],"Rb":["rbe1","rbe2","rbd","rbd:h","rbd:h2","rbt0","rbt1"]},"moves":{"f1":{"to":{"f1d":1,"f1v":1},"dur":0.8},"f2":{"to":{"f2d":1,"f2v":1},"dur":0.8},"ff":{"to":{"fd":1,"fv":1},"dur":0.8}},"route":["A からの力","B からの力","足し引き"]}},{"id":"t48s12e","scene":"t48s12e","kind":"u48s12ae","lab":{"top":"","bot":"","s":"{S}=0.1 m²","d":"{d}=1×10⁻³ m","c":"{C}=8.85×10⁻¹⁰ F"},"viewbox":"-1160 -49 3068 801","band":{"want":"10 のべき乗の数の計算","ans":"8.85 と分けて、掛ける時は右上の数を足し、割る時は引く","full":"ε0 = 8.85 × 10⁻¹² のような数は、8.85 と 10 のべき乗を分ける。10⁻³ は 1/10³。掛ける時は右上の数を足し、割る時は右上の数を引く。8.85 は最後に付ける。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[27,29],"sents":[{"text":"$\\varepsilon_0 = 8.85 \\times 10^{-12}$ のような数は、〖8.85 と 10 のべき乗を分けて〗計算します。","at":{"強調":1.0},"after":[],"emph":["Cap"]},{"text":"①マイナスの右上の数\n②右上の数を足し引き\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["S","D"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"$10^{-3}$ は $\\dfrac{1}{10^3}$ です。〖マイナスの右上の数は、割り算〗を表します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["D"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"掛ける時は右上の数を足し、〖割る時は右上の数を引きます〗。8.85 は最後に付けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Cap","S","D"],"eq":[{"cont":false,"items":[["\\dfrac{10^{-12} \\times 10^{-1}}{10^{-3}}"],["= 10^{-12 - 1 + 3} = 10^{-10}"]]}],"ans":true,"emphPre":["Cap","S","D"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{},"route":["マイナスの右上の数","右上の数を足し引き"]}},{"id":"t48s12x","scene":"t48s12x","kind":"u48s12ae","lab":{"top":"","bot":"","s":"{S}=0.1 m²","d":"{d}=1×10⁻³ m","c":["{C}","{C}=8.85×10⁻¹⁰ F"]},"viewbox":"-1160 -49 3068 801","band":{"want":"静電容量 $C = 8.85 \\times 10^{\\square}\\,\\mathrm{F}$ の □","known":"$S = 0.1\\,\\mathrm{m^2},\\;\\; d = 1 \\times 10^{-3}\\,\\mathrm{m},\\;\\; \\varepsilon_0 = 8.85 \\times 10^{-12}$","ans":"$-10$"},"narr":{"start":{"co":1,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[27,29],"sents":[{"text":"静電容量 $C$ の、10 の右上の数を求めます。","at":{"強調":1.0},"after":[],"emph":["Cap"]},{"text":"①10 のべき乗に直す\n②右上の数を足し引き\n③8.85 を付ける\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Cap"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"面積 0.1 は $10^{-1}$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["S"],"eq":[{"cont":false,"items":[["0.1 = 10^{-1}"]]}],"emphPre":["S"]},{"text":"〖この $10^{-1}$ と、距離の $10^{-3}$ を次の式に入れます〗。","at":{"強調":1.0},"after":[],"emph":["S","D"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C = \\dfrac{\\varepsilon_0 S}{d}$ の、10 の右上の数だけを計算します。掛ける時は足し、割る時は引きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Cap","S","D"],"eq":[{"cont":false,"items":[["C = \\dfrac{\\varepsilon_0 S}{d}"],["-12 + (-1) - (-3) = -10"]]}],"emphPre":["Cap","S","D"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"最後に 8.85 を付けます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"c","emph":["Cap"],"eq":[{"cont":false,"items":[["C = 8.85 \\times 10^{-10}\\,\\mathrm{F}"]]}],"ans":true,"emphPre":["Cap"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"c":{"to":{"cv":1},"dur":0.5}},"route":["10 のべき乗に直す","右上の数を足し引き","8.85 を付ける"]}}],"secs":[{"ex":{"text":"真空中で静電容量 $C_0$ の平行平板コンデンサがあります。極板と平行に、厚さの半分ずつに、上は比誘電率 2、下は比誘電率 6 の誘電体を入れました。静電容量は $C_0$ の何倍ですか。","fig":{"kind":"u48s1l11","L":{"top":"","bot":"","m1":"{ε}_r=2","m2":"{ε}_r=6","t1":"{d}/2","t2":"{d}/2"},"P":{}},"ch":[{"t":"$4\\,\\text{倍}$","v":4,"why":"面積の方向に分けた（並列）と読んだ"},{"t":"$3\\,\\text{倍}$","v":3,"why":""},{"t":"$1.5\\,\\text{倍}$","v":1.5,"why":"厚さが半分になると静電容量が 2 倍になる所を飛ばした"},{"t":"$16\\,\\text{倍}$","v":16,"why":"直列なのに足した"}],"ans":1}},{"ex":{"text":"極板の面積が同じ2つの平行平板コンデンサがあります。$C_1$ は極板の間が真空で距離 $d$、$C_2$ は極板の間が比誘電率 4 で距離 $2d$ です。図のように直列にして $120\\,\\mathrm{V}$ を加えました。$C_2$ の電圧は何 V ですか。","fig":{"kind":"u48s2q","L":{"src":"{V}=120 V","c1":"{C}_1","c2":"{C}_2","v2":"{V}_2"},"P":{}},"ch":[{"t":"$80\\,\\mathrm{V}$","v":80,"why":"抵抗と同じく静電容量の比で分けた（直列のコンデンサは逆比）"},{"t":"$24\\,\\mathrm{V}$","v":24,"why":"距離が 2 倍を飛ばして $C_2 = 4C_0$ とした"},{"t":"$60\\,\\mathrm{V}$","v":60,"why":"静電容量を出さず、半分ずつにした"},{"t":"$40\\,\\mathrm{V}$","v":40,"why":""}],"ans":3}},{"ex":{"text":"静電容量 $C_1 = 1\\,\\mu\\mathrm{F}$ と $C_2 = 3\\,\\mu\\mathrm{F}$ の平行平板コンデンサを図のように直列にして、$200\\,\\mathrm{V}$ を加えました。$C_1$ の極板の間の距離は $0.5\\,\\mathrm{m}$ です。$C_1$ の中の電界の強さは何 V/m ですか。","fig":{"kind":"u48s3q","L":{"src":"{V}=200 V","c1":"{C}_1=1 μF","c2":"{C}_2=3 μF","v1":"{V}_1"},"P":{}},"ch":[{"t":"$400\\,\\mathrm{V/m}$","v":400,"why":"電圧を分けず、全部の $200\\,\\mathrm{V}$ を距離で割った"},{"t":"$300\\,\\mathrm{V/m}$","v":300,"why":""},{"t":"$150\\,\\mathrm{V/m}$","v":150,"why":"$C_1$ の電圧 $150\\,\\mathrm{V}$ で止めた（距離で割っていない）"},{"t":"$100\\,\\mathrm{V/m}$","v":100,"why":"$C_2$ の電圧を使った（逆比を取り違えた）"}],"ans":1}},{"ex":{"text":"静電容量 $6\\,\\mu\\mathrm{F}$ の平行平板コンデンサを $200\\,\\mathrm{V}$ の電源につないだまま、極板の間の距離を半分にしました。蓄えられる電荷は何 μC ですか。","fig":{"kind":"u48s4cv","L":{"src":"{V}=200 V","c":"{C}=6 μF"},"P":{}},"ch":[{"t":"$1200\\,\\mu\\mathrm{C}$","v":1200,"why":"電荷が変わらないとした（つないだままは電圧が変わらない。切り離した時と取り違えた）"},{"t":"$12\\,\\mu\\mathrm{C}$","v":12,"why":"新しい静電容量 $12\\,\\mu\\mathrm{F}$ で止めた（電圧を掛けていない）"},{"t":"$2400\\,\\mu\\mathrm{C}$","v":2400,"why":""},{"t":"$600\\,\\mu\\mathrm{C}$","v":600,"why":"距離と静電容量の関係を逆にした（静電容量は距離に反比例）"}],"ans":2}},{"ex":{"text":"静電容量 $C_1 = 6\\,\\mu\\mathrm{F}$ の平行平板コンデンサがあります。$C_2$ は $C_1$ と同じ極板で、極板の間の距離を $C_1$ の 3 倍にした物です。図のように直列につないだ時の合成静電容量は何 μF ですか。","fig":{"kind":"u48s5ser","L":{"src":"{V}","c1":"{C}_1=6 μF","c2":"{C}_2"},"P":{}},"ch":[{"t":"$8\\,\\mu\\mathrm{F}$","v":8,"why":"並列と取り違えて足した（直列は和分の積）"},{"t":"$2\\,\\mu\\mathrm{F}$","v":2,"why":"$C_2$ を出して止めた（直列にまとめていない）"},{"t":"$3\\,\\mu\\mathrm{F}$","v":3,"why":"距離の違いを見ず、$C_1$ と同じ物どうしの直列とした"},{"t":"$1.5\\,\\mu\\mathrm{F}$","v":1.5,"why":""}],"ans":3}},{"ex":{"text":"図の回路で、$C_1 = 6\\,\\mu\\mathrm{F}$、$C_2 = 1\\,\\mu\\mathrm{F}$、$C_3 = 2\\,\\mu\\mathrm{F}$、$V = 120\\,\\mathrm{V}$ です。$C_1$ に蓄えられる電荷は何 μC ですか。","fig":{"kind":"u48s6xq","L":{"src":"{V}=120 V","c1":"{C}_1=6 μF","c2":"{C}_2=1 μF","c3":"{C}_3=2 μF","q1":"{Q}_1"},"P":{}},"ch":[{"t":"$720\\,\\mu\\mathrm{C}$","v":720,"why":"合成せず、$C_1$ だけに電源の電圧がかかるとした"},{"t":"$240\\,\\mu\\mathrm{C}$","v":240,"why":""},{"t":"$360\\,\\mu\\mathrm{C}$","v":360,"why":"並列の部分の合成で止めた（$C_1$ と直列にまとめていない）"},{"t":"$1080\\,\\mu\\mathrm{C}$","v":1080,"why":"直列の部分も足して合成した（直列は和分の積）"}],"ans":1}},{"ex":{"text":"図のように、静電容量 $C_1 = 2\\,\\mathrm{F}$ と $C_2 = 6\\,\\mathrm{F}$ のコンデンサを直列にして、$10\\,\\mathrm{V}$ の電源につないだ。2つのコンデンサに蓄えられる静電エネルギーの合計は何 J ですか。","fig":{"kind":"u48s7ser","L":{"src":"{V}=10 V","c1":"{C}_1=2 F","c2":"{C}_2=6 F"},"P":{}},"ch":[{"t":"$400\\,\\mathrm{J}$","v":400,"why":"並列と取り違えて、静電容量を足した"},{"t":"$100\\,\\mathrm{J}$","v":100,"why":"$C_1$ だけで計算した（合成していない）"},{"t":"$1.5\\,\\mathrm{J}$","v":1.5,"why":"合成静電容量で止めた（静電エネルギーを出していない）"},{"t":"$75\\,\\mathrm{J}$","v":75,"why":""}],"ans":3}},{"ex":{"text":"図のように、$C_1 = 3\\,\\mu\\mathrm{F}$ のコンデンサを $100\\,\\mathrm{V}$ で充電し、充電していない $C_2 = 2\\,\\mu\\mathrm{F}$ のコンデンサと、スイッチ S を閉じて同じ極性どうしつないだ。電荷が移動した後の電圧は何 V ですか。","fig":{"kind":"u48s8rq","L":{"c1":"{C}_1=3 μF","c2":"{C}_2=2 μF","sw":"S","dir":"lr","v1":"{V}_1=100 V","v2":"0 V"},"P":{}},"ch":[{"t":"$100\\,\\mathrm{V}$","v":100,"why":"電荷が移動しないと考えた（前の電圧のまま）"},{"t":"$150\\,\\mathrm{V}$","v":150,"why":"$C_2$ だけで割った（並列の合成をしていない）"},{"t":"$60\\,\\mathrm{V}$","v":60,"why":""},{"t":"$50\\,\\mathrm{V}$","v":50,"why":"電圧を半分にした（等しく分かれると考えた）"}],"ans":2}},{"ex":{"text":"図のように、比誘電率 $4$ の誘電体で満たした平行平板コンデンサに $100\\,\\mathrm{V}$ を加えた。極板の間の距離は $0.5\\,\\mathrm{m}$ です。極板の間の電束密度は $\\varepsilon_0$ の何倍ですか。","fig":{"kind":"u48s9pl","L":{"top":"","bot":"","d":"{d}=0.5 m","e":"{E}","med":"{ε}_r=4"},"P":{}},"ch":[{"t":"$200\\,\\text{倍}$","v":200,"why":"電界の強さで止めた（誘電率を掛けていない）"},{"t":"$800\\,\\text{倍}$","v":800,"why":""},{"t":"$400\\,\\text{倍}$","v":400,"why":"電界の強さを出さず、電圧に比誘電率を掛けた"},{"t":"$50\\,\\text{倍}$","v":50,"why":"比誘電率で割った（$D = \\varepsilon E$ は掛ける）"}],"ans":1}},{"ex":{"text":"図のように、上の極板が正の平行平板コンデンサがあります。極板の間の距離は $0.5\\,\\mathrm{m}$、電圧は $100\\,\\mathrm{V}$ です。$2\\,\\mathrm{C}$ の正の電荷を、負の極板の上の点 A から点 B まで、電界に逆らって $0.2\\,\\mathrm{m}$ 運びます。要る仕事は何 J ですか。","fig":{"kind":"u48s10pp","L":{"top":"","bot":"","d":"{d}=0.5 m","pa":"A","pb":"B","pth":"","dab":"0.2 m"},"P":{}},"ch":[{"t":"$200\\,\\mathrm{J}$","v":200,"why":"極板の間の全部の電圧を使った（運ぶ距離の分の電位差にしていない）"},{"t":"$40\\,\\mathrm{J}$","v":40,"why":"電位差で止めた（電荷を掛けていない）"},{"t":"$80\\,\\mathrm{J}$","v":80,"why":""},{"t":"$400\\,\\mathrm{J}$","v":400,"why":"力 $qE$ で止めた（運ぶ距離を掛けていない）"}],"ans":2}},{"ex":{"text":"図のように、真空中で、点 P に置いた点電荷 $q_0 = +1\\,\\mathrm{C}$ の左 $2\\,\\mathrm{m}$ の点 A に $q_A = +4\\,\\mathrm{C}$、右 $1\\,\\mathrm{m}$ の点 B に $q_B = +3\\,\\mathrm{C}$ の点電荷を置いた。$q_0$ に働く力の大きさと向きはどれですか。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とします。","fig":{"kind":"u48s11lm","L":{"q0":"{q}_0=1 C","q0s":"+","qa":"{q}_A=4 C","qas":"+","qb":"{q}_B=3 C","qbs":"+","na":"A","n0":"P","nb":"B","ra":"2 m","rb":"1 m","f1":null,"f2":null,"f":null},"P":{}},"ch":[{"t":"$36 \\times 10^9\\,\\mathrm{N}$・左向き","v":"36L","why":"逆向きの2つの力を足した（逆向きは引く）"},{"t":"$18 \\times 10^9\\,\\mathrm{N}$・左向き","v":"18L","why":""},{"t":"$27 \\times 10^9\\,\\mathrm{N}$・左向き","v":"27L","why":"B からの力だけを出した（A からの力を引いていない）"},{"t":"$9 \\times 10^9\\,\\mathrm{N}$・右向き","v":"9R","why":"A からの力だけを出した（B からの力を入れていない）"}],"ans":1}},{"ex":{"text":"図のように、真空中の平行平板コンデンサの極板の面積は $0.1\\,\\mathrm{m^2}$、極板の間の距離は $1 \\times 10^{-3}\\,\\mathrm{m}$ です。静電容量は $8.85 \\times 10^{\\square}\\,\\mathrm{F}$ です。□ に入る数はいくつですか。ただし $\\varepsilon_0 = 8.85 \\times 10^{-12}$ とします。","fig":{"kind":"u48s12pl","L":{"top":"","bot":"","s":"{S}=0.1 m²","d":"{d}=1×10⁻³ m","c":"{C}"},"P":{}},"ch":[{"t":"$-13$","v":-13,"why":"距離で割るのを飛ばした（$10^{-3}$ で割ると右上の数は $+3$）"},{"t":"$-9$","v":-9,"why":"面積を掛けるのを飛ばした（$0.1 = 10^{-1}$）"},{"t":"$-16$","v":-16,"why":"割るのに右上の数を足した（割る時は引く）"},{"t":"$-10$","v":-10,"why":""}],"ans":3}}],"past":[]}};
});
