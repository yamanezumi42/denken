/* 単元45「直流のつなぎ（2つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(45, function(H){
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
// ---- 45-1 合成から全体の電流 の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S1K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u45s1xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s1xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s1xqj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  xx: {"vars":[["m","mg","r23"]],"items":[{"t":"z","id":"zbu45s1xx0hi","z":"hi","lines":[[[752,590],[478,590],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s1xx1lo","z":"lo","lines":[[[772,590],[1045,590],[1045,360],[995,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s1xx2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu45s1xx3lo","z":"lo","lines":[[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu45s1xx4mid","z":"mid","lines":[[[708,360],[821.5,360]]],"vis":[1],"pts":[],"node":"n1"},{"t":"z","id":"zbu45s1xx5lo","z":"lo","lines":[[[881.5,360],[995,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"z","id":"zbu45s1xx6mid","z":"mid","lines":[[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s1xxL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s1xxRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1xxw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1xxw2","pts":[[708,280],[708,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s1xxw3","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s1xxw4","pts":[[708,280],[821.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u45s1xxw5","pts":[[881.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u45s1xxw6","pts":[[708,440],[821.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s1xxw7","pts":[[881.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s1xxw8","pts":[[708,360],[821.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s1xxw9","pts":[[881.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s1xxw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1xxw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[762,638.29,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.6,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[-1],"lab":[851.5,245.6,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[-1],"lab":[851.5,405.6,null]},{"t":"d","id":"u45s1xxj113","x":708,"y":360,"vis":[-1]},{"t":"d","id":"u45s1xxj214","x":995,"y":360,"vis":[-1]},{"t":"r","k":"r23","x":851.5,"y":360,"dir":"h","vis":[1],"lab":[851.5,325.6,null]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":512.29,"vis":[],"y2m":[368,1]},{"t":"i","k":"i","x0":461,"y0":530,"x1":461,"y1":490,"lab":[444.89,510,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]},{"c":[1],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",6,[-1]],["R","r3","n1","N",12,[-1]],["R","r23","n1","N",1,[1]]]},
  lR: {"vars":[],"items":[{"t":"w","id":"u45s1lRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1lRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s1lRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s1lRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  lL: {"vars":[],"items":[{"t":"w","id":"u45s1lLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1lLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s1lLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s1lLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  col: {"vars":[],"items":[{"t":"w","id":"u45s1colL","pts":[[478,360],[589.75,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw2","pts":[[649.75,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw3","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw4","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw5","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw6","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw7","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw8","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw9","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw10","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s1colw11","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":619.75,"y":360,"dir":"h","vis":[],"lab":[619.75,330.34,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r2","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,470,"start"]},{"t":"r","k":"r3","x":1045,"y":470,"dir":"v","vis":[],"lab":[1025.38,430,"end"]},{"t":"d","id":"u45s1colj6","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u45s1colj9","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445.38,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",1,[]],["E","src","n1","n4",1,[]],["R","r2","n2","n4",1,[]],["R","r3","n2","n4",1,[]]]}
};
function tbU45s1xq(d, p, L){ tbGen_Draw(d, p, L, U45S1K.xq); }
function tbU45s1xx(d, p, L){ tbGen_Draw(d, p, L, U45S1K.xx); }
function tbU45s1lR(d, p, L){ tbGen_Draw(d, p, L, U45S1K.lR); }
function tbU45s1lL(d, p, L){ tbGen_Draw(d, p, L, U45S1K.lL); }
function tbU45s1col(d, p, L){ tbGen_Draw(d, p, L, U45S1K.col); }
// ---- 45-2 矢印の位置と分流 の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S2K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u45s2xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s2xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s2xqj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu45s2xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s2xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s2xx2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s2xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2xxw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,602.5,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.37,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.37,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,405.37,null]},{"t":"d","id":"u45s2xxj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s2xxj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,490.73,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  e0: {"vars":[],"items":[{"t":"z","id":"zbu45s2e00hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s2e01lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s2e02mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s2e0L","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e0w9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,602.5,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.37,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.37,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,405.37,null]},{"t":"d","id":"u45s2e0j113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s2e0j214","x":995,"y":360,"vis":[]},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,490.73,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  e1: {"vars":[],"items":[{"t":"z","id":"zbu45s2e10hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[532.25,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s2e11lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[1025.75,360]],[[915.75,280],[1025.75,280],[1025.75,440],[915.75,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s2e12mid","z":"mid","lines":[[[592.25,360],[745.75,360]],[[855.75,280],[745.75,280],[745.75,440],[855.75,440]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s2e1L","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w1","pts":[[478,360],[532.25,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w2","pts":[[592.25,360],[686.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w3","pts":[[745.75,280],[745.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w4","pts":[[1025.75,280],[1025.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w5","pts":[[745.75,280],[855.75,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w6","pts":[[915.75,280],[1025.75,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w7","pts":[[745.75,440],[855.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w8","pts":[[915.75,440],[1025.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w9","pts":[[686.5,360],[745.75,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e1w10","pts":[[1025.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.79,null]},{"t":"r","k":"r1","x":562.25,"y":360,"dir":"h","vis":[],"lab":[562.25,390.5,null]},{"t":"r","k":"r2","x":885.75,"y":280,"dir":"h","vis":[],"lab":[885.75,249.5,null]},{"t":"r","k":"r3","x":885.75,"y":440,"dir":"h","vis":[],"lab":[885.75,409.5,null]},{"t":"d","id":"u45s2e1j114","x":745.75,"y":360,"vis":[]},{"t":"d","id":"u45s2e1j215","x":1025.75,"y":360,"vis":[]},{"t":"i","k":"i","x0":666.5,"y0":343,"x1":706.5,"y1":343,"lab":[670.5,313.4,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":808.25,"y0":457,"x1":848.25,"y1":457,"lab":[828.25,486.6,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[745.75,360]]},{"I":0.67,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.33,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  e2: {"vars":[],"items":[{"t":"z","id":"zbu45s2e20hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s2e21lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s2e22mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s2e2L","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2e2w9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.79,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,329.5,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,310.5,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,409.5,null]},{"t":"d","id":"u45s2e2j113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s2e2j214","x":995,"y":360,"vis":[]},{"t":"i","k":"i2","x0":774,"y0":263,"x1":814,"y1":263,"lab":[794,233.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",12,[]]]},
  aR: {"vars":[],"items":[{"t":"w","id":"u45s2aRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2aRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s2aRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s2aRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  aL: {"vars":[],"items":[{"t":"w","id":"u45s2aLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2aLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s2aLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s2aLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  bR: {"vars":[],"items":[{"t":"w","id":"u45s2bRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw1","pts":[[478,360],[542.25,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw2","pts":[[602.25,360],[706.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw3","pts":[[775.75,280],[775.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw4","pts":[[1015.75,280],[1015.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw5","pts":[[775.75,280],[865.75,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw6","pts":[[925.75,280],[1015.75,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw7","pts":[[775.75,440],[865.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw8","pts":[[925.75,440],[1015.75,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw9","pts":[[706.5,360],[775.75,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bRw10","pts":[[1015.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":572.25,"y":360,"dir":"h","vis":[],"lab":[572.25,330.34,null]},{"t":"r","k":"r2","x":895.75,"y":280,"dir":"h","vis":[],"lab":[895.75,250.34,null]},{"t":"r","k":"r3","x":895.75,"y":440,"dir":"h","vis":[],"lab":[895.75,410.34,null]},{"t":"d","id":"u45s2bRj114","x":775.75,"y":360,"vis":[]},{"t":"d","id":"u45s2bRj215","x":1015.75,"y":360,"vis":[]},{"t":"i","k":"i","x0":686.5,"y0":343,"x1":726.5,"y1":343,"lab":[706.5,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[775.75,360]]},{"I":0.5,"pts":[[775.75,360],[775.75,280],[1015.75,280],[1015.75,360]]},{"I":0.5,"pts":[[775.75,360],[775.75,440],[1015.75,440],[1015.75,360]]},{"I":1,"pts":[[1015.75,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  bL: {"vars":[],"items":[{"t":"w","id":"u45s2bLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw1","pts":[[507.25,280],[507.25,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw2","pts":[[747.25,280],[747.25,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw3","pts":[[507.25,280],[597.25,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw4","pts":[[657.25,280],[747.25,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw5","pts":[[507.25,440],[597.25,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw6","pts":[[657.25,440],[747.25,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw7","pts":[[478,360],[507.25,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw8","pts":[[747.25,360],[816.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw9","pts":[[816.5,360],[920.75,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2bLw10","pts":[[980.75,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r2","x":627.25,"y":280,"dir":"h","vis":[],"lab":[627.25,250.34,null]},{"t":"r","k":"r3","x":627.25,"y":440,"dir":"h","vis":[],"lab":[627.25,410.34,null]},{"t":"d","id":"u45s2bLj111","x":507.25,"y":360,"vis":[]},{"t":"d","id":"u45s2bLj212","x":747.25,"y":360,"vis":[]},{"t":"r","k":"r1","x":950.75,"y":360,"dir":"h","vis":[],"lab":[950.75,330.34,null]},{"t":"i","k":"i","x0":796.5,"y0":343,"x1":836.5,"y1":343,"lab":[816.5,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[507.25,360]]},{"I":0.5,"pts":[[507.25,360],[507.25,280],[747.25,280],[747.25,360]]},{"I":0.5,"pts":[[507.25,360],[507.25,440],[747.25,440],[747.25,360]]},{"I":1,"pts":[[747.25,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  cR: {"vars":[],"items":[{"t":"w","id":"u45s2cRL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2cRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,309.66,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s2cRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s2cRj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i2","x0":774,"y0":263,"x1":814,"y1":263,"lab":[794,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,485.76,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  cL: {"vars":[],"items":[{"t":"w","id":"u45s2cLL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s2cLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,309.66,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s2cLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s2cLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i2","x0":594,"y0":263,"x1":634,"y1":263,"lab":[614,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i3","x0":594,"y0":457,"x1":634,"y1":457,"lab":[614,485.76,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  ae: {"vars":[["a","t",0],["a","t",1],["a","t",2]],"items":[{"t":"z","id":"zbu45s2ae0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[1],"pts":[],"node":"L0:P"},{"t":"z","id":"zbu45s2ae1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[1],"pts":[],"node":"L0:N"},{"t":"z","id":"zbu45s2ae2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[1],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu45s2aex10hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[532.25,360]]],"vis":[2],"pts":[],"node":"L1:P"},{"t":"z","id":"zbu45s2aex11lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[1025.75,360]],[[915.75,280],[1025.75,280],[1025.75,440],[915.75,440]]],"vis":[2],"pts":[],"node":"L1:N"},{"t":"z","id":"zbu45s2aex12mid","z":"mid","lines":[[[592.25,360],[745.75,360]],[[855.75,280],[745.75,280],[745.75,440],[855.75,440]]],"vis":[2],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu45s2aex20hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[3],"pts":[],"node":"L2:P"},{"t":"z","id":"zbu45s2aex21lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[3],"pts":[],"node":"L2:N"},{"t":"z","id":"zbu45s2aex22mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[3],"pts":[],"node":"L2:n1"},{"t":"w","id":"u45s2aeL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew1","pts":[[478,360],[563,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew2","pts":[[708,280],[708,440]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew3","pts":[[995,280],[995,440]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew4","pts":[[708,280],[821.5,280]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew5","pts":[[881.5,280],[995,280]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew6","pts":[[708,440],[821.5,440]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew7","pts":[[881.5,440],[995,440]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew8","pts":[[623,360],[708,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aew9","pts":[[995,360],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s2aex1L","pts":[[478,360],[478,560],[752,560]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w1","pts":[[478,360],[532.25,360]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w2","pts":[[592.25,360],[686.5,360]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w3","pts":[[745.75,280],[745.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w4","pts":[[1025.75,280],[1025.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w5","pts":[[745.75,280],[855.75,280]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w6","pts":[[915.75,280],[1025.75,280]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w7","pts":[[745.75,440],[855.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w8","pts":[[915.75,440],[1025.75,440]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w9","pts":[[686.5,360],[745.75,360]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex1w10","pts":[[1025.75,360],[1045,360]],"vis":[2],"dash":0},{"t":"w","id":"u45s2aex2L","pts":[[478,360],[478,560],[752,560]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2Rw","pts":[[772,560],[1045,560],[1045,360]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w1","pts":[[478,360],[563,360]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w2","pts":[[708,280],[708,440]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w3","pts":[[995,280],[995,440]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w4","pts":[[708,280],[821.5,280]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w5","pts":[[881.5,280],[995,280]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w6","pts":[[708,440],[821.5,440]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w7","pts":[[881.5,440],[995,440]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w8","pts":[[623,360],[708,360]],"vis":[3],"dash":0},{"t":"w","id":"u45s2aex2w9","pts":[[995,360],[1045,360]],"vis":[3],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[770,602.52,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[1],"lab":[593,325.35,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[1],"lab":[851.5,245.35,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[1],"lab":[851.5,405.35,null]},{"t":"d","id":"u45s2aej113","x":708,"y":360,"vis":[1]},{"t":"d","id":"u45s2aej214","x":995,"y":360,"vis":[1]},{"t":"i","k":"i3","x0":774,"y0":457,"x1":814,"y1":457,"lab":[794,490.75,null],"vis":[1],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.86,480,"end"],"vis":[1],"ax":"v","sd":-1,"io":1},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[2],"side":1,"loop":1,"lab":[770,602.52,null],"n":"srcx1"},{"t":"r","k":"r1","x":562.25,"y":360,"dir":"h","vis":[2],"lab":[562.25,394.65,null],"n":"r1x1"},{"t":"r","k":"r2","x":885.75,"y":280,"dir":"h","vis":[2],"lab":[885.75,245.35,null],"n":"r2x1"},{"t":"r","k":"r3","x":885.75,"y":440,"dir":"h","vis":[2],"lab":[885.75,405.35,null],"n":"r3x1"},{"t":"d","id":"u45s2aex1j114","x":745.75,"y":360,"vis":[2]},{"t":"d","id":"u45s2aex1j215","x":1025.75,"y":360,"vis":[2]},{"t":"i","k":"i","x0":666.5,"y0":343,"x1":706.5,"y1":343,"lab":[670.5,309.25,null],"vis":[2],"ax":"h","iside":"up","io":1,"n":"ix1"},{"t":"i","k":"i3","x0":808.25,"y0":457,"x1":848.25,"y1":457,"lab":[828.25,490.75,null],"vis":[2],"ax":"h","iside":"down","io":1,"n":"i3x1"},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[3],"side":1,"loop":1,"lab":[770,602.52,null],"n":"srcx2"},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[3],"lab":[593,325.35,null],"n":"r1x2"},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[3],"lab":[851.5,314.65,null],"n":"r2x2"},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[3],"lab":[851.5,405.35,null],"n":"r3x2"},{"t":"d","id":"u45s2aex2j113","x":708,"y":360,"vis":[3]},{"t":"d","id":"u45s2aex2j214","x":995,"y":360,"vis":[3]},{"t":"i","k":"i2","x0":774,"y0":263,"x1":814,"y1":263,"lab":[794,229.25,null],"vis":[3],"ax":"h","iside":"up","io":1,"n":"i2x2"}],"flows":[{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[2],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[745.75,360]]},{"I":0.67,"pts":[[745.75,360],[745.75,280],[1025.75,280],[1025.75,360]]},{"I":0.33,"pts":[[745.75,360],[745.75,440],[1025.75,440],[1025.75,360]]},{"I":1,"pts":[[1025.75,360],[1045,360],[1045,560],[772,560]]}]},{"c":[3],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.67,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.33,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","L0:P","L0:N",24,[1]],["R","r1","L0:P","L0:n1",4,[1]],["R","r2","L0:n1","L0:N",6,[1]],["R","r3","L0:n1","L0:N",12,[1]],["E","src","L1:P","L1:N",24,[2]],["R","r1","L1:P","L1:n1",4,[2]],["R","r2","L1:n1","L1:N",6,[2]],["R","r3","L1:n1","L1:N",12,[2]],["E","src","L2:P","L2:N",24,[3]],["R","r1","L2:P","L2:n1",4,[3]],["R","r2","L2:n1","L2:N",6,[3]],["R","r3","L2:n1","L2:N",12,[3]]]}
};
function tbU45s2xq(d, p, L){ tbGen_Draw(d, p, L, U45S2K.xq); }
function tbU45s2xx(d, p, L){ tbGen_Draw(d, p, L, U45S2K.xx); }
function tbU45s2e0(d, p, L){ tbGen_Draw(d, p, L, U45S2K.e0); }
function tbU45s2e1(d, p, L){ tbGen_Draw(d, p, L, U45S2K.e1); }
function tbU45s2e2(d, p, L){ tbGen_Draw(d, p, L, U45S2K.e2); }
function tbU45s2aR(d, p, L){ tbGen_Draw(d, p, L, U45S2K.aR); }
function tbU45s2aL(d, p, L){ tbGen_Draw(d, p, L, U45S2K.aL); }
function tbU45s2bR(d, p, L){ tbGen_Draw(d, p, L, U45S2K.bR); }
function tbU45s2bL(d, p, L){ tbGen_Draw(d, p, L, U45S2K.bL); }
function tbU45s2cR(d, p, L){ tbGen_Draw(d, p, L, U45S2K.cR); }
function tbU45s2cL(d, p, L){ tbGen_Draw(d, p, L, U45S2K.cL); }
function tbU45s2ae(d, p, L){ tbGen_Draw(d, p, L, U45S2K.ae); }
// ---- 45-3 合成の式を逆に解く の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S3K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u45s3xqL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3xqw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"rx","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s3xqj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s3xqj214","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",12,[]],["R","rx","n1","N",6,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu45s3xx0hi","z":"hi","lines":[[[752,590],[478,590],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s3xx1lo","z":"lo","lines":[[[772,590],[1045,590],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s3xx2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s3xxL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3xxw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.79,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,329.5,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,249.5,null]},{"t":"r","k":"rx","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,409.5,null]},{"t":"d","id":"u45s3xxj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s3xxj214","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.79,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",24,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",12,[]],["R","rx","n1","N",6,[]]]},
  aR: {"vars":[],"items":[{"t":"w","id":"u45s3aRL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"rx","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s3aRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s3aRj214","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","rx","n1","N",1,[]]]},
  aRu: {"vars":[],"items":[{"t":"w","id":"u45s3aRuL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aRuw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"rx","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r2","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s3aRuj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s3aRuj214","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","rx","n1","N",1,[]],["R","r2","n1","N",1,[]]]},
  aL: {"vars":[],"items":[{"t":"w","id":"u45s3aLL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"rx","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s3aLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s3aLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"dim","k":"rd","x1":528,"y1":452,"x2":960,"y2":380,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","rx","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  aLu: {"vars":[],"items":[{"t":"w","id":"u45s3aLuL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3aLuw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"rx","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r2","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s3aLuj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s3aLuj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"dim","k":"rd","x1":528,"y1":452,"x2":960,"y2":380,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","rx","P","n1",1,[]],["R","r2","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  bR: {"vars":[],"items":[{"t":"w","id":"u45s3bRL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3bRw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"rx","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s3bRj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s3bRj214","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":563,"y1":380,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","rx","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  bL: {"vars":[],"items":[{"t":"w","id":"u45s3bLL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s3bLw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1,"lab":[770,628.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s3bLj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s3bLj212","x":815,"y":360,"vis":[]},{"t":"r","k":"rx","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"dim","k":"rd","x1":528,"y1":452,"x2":960,"y2":380,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","rx","n1","N",1,[]]]}
};
function tbU45s3xq(d, p, L){ tbGen_Draw(d, p, L, U45S3K.xq); }
function tbU45s3xx(d, p, L){ tbGen_Draw(d, p, L, U45S3K.xx); }
function tbU45s3aR(d, p, L){ tbGen_Draw(d, p, L, U45S3K.aR); }
function tbU45s3aRu(d, p, L){ tbGen_Draw(d, p, L, U45S3K.aRu); }
function tbU45s3aL(d, p, L){ tbGen_Draw(d, p, L, U45S3K.aL); }
function tbU45s3aLu(d, p, L){ tbGen_Draw(d, p, L, U45S3K.aLu); }
function tbU45s3bR(d, p, L){ tbGen_Draw(d, p, L, U45S3K.bR); }
function tbU45s3bL(d, p, L){ tbGen_Draw(d, p, L, U45S3K.bL); }
// ---- 45-4 二次方程式で2つの抵抗 の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S4K = {
  sp: {"vars":[],"items":[{"t":"w","id":"u45s4spL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw4","pts":[[478,360],[478,396.67]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw5","pts":[[478,396.67],[478,433.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw6","pts":[[478,506.67],[478,543.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw7","pts":[[478,543.33],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw8","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4spw9","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1L","pts":[[1220,360],[1503.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w2","pts":[[1220,580],[1503.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w3","pts":[[1503.5,360],[1787,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w4","pts":[[1503.5,580],[1787,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w5","pts":[[1220,360],[1220,396.67]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w6","pts":[[1220,396.67],[1220,433.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w7","pts":[[1220,506.67],[1220,543.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w8","pts":[[1220,543.33],[1220,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w9","pts":[[1503.5,360],[1503.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w10","pts":[[1503.5,500],[1503.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w11","pts":[[1787,360],[1787,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4spx1w12","pts":[[1787,500],[1787,580]],"vis":[],"dash":0},{"t":"r","k":"ra","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,308.96,null]},{"t":"T","k":"a","x":478,"y":396.67,"dir":"v","vis":[],"side":-1,"lab":[462.17,396.67,"end"]},{"t":"T","k":"b","x":478,"y":543.33,"dir":"v","vis":[],"side":-1,"lab":[493.83,527.33,"start"]},{"t":"r","k":"rb","x":1045,"y":470,"dir":"v","vis":[],"lab":[1023.17,470,"end"]},{"t":"cap","id":"u45s4spcap0","x":753,"y":661.26,"s":"直列","vis":[]},{"t":"T","k":"a","x":1220,"y":396.67,"dir":"v","vis":[],"side":-1,"lab":[1204.17,396.67,"end"],"n":"ax1"},{"t":"T","k":"b","x":1220,"y":543.33,"dir":"v","vis":[],"side":-1,"lab":[1235.83,527.33,"start"],"n":"bx1"},{"t":"r","k":"ra","x":1503.5,"y":470,"dir":"v","vis":[],"lab":[1525.33,470,"start"],"n":"rax1"},{"t":"r","k":"rb","x":1787,"y":470,"dir":"v","vis":[],"lab":[1765.17,470,"end"],"n":"rbx1"},{"t":"d","id":"u45s4spx1j6","x":1503.5,"y":360,"vis":[]},{"t":"d","id":"u45s4spx1j9","x":1503.5,"y":580,"vis":[]},{"t":"cap","id":"u45s4spcap1","x":1495,"y":661.26,"s":"並列","vis":[]}],"flows":[{"c":[],"paths":[]},{"c":[],"paths":[]}],"base":110,"von":[],"bands":"never","pts":[],"net":[["R","ra","L0:n1","L0:n2",1,[]],["R","rb","L0:n2","L0:n6",1,[]],["R","ra","L1:n1","L1:n8",1,[]],["R","rb","L1:n1","L1:n8",1,[]]]},
  xs: {"vars":[],"items":[{"t":"w","id":"u45s4xsL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw4","pts":[[478,360],[478,396.67]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw5","pts":[[478,396.67],[478,433.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw6","pts":[[478,506.67],[478,543.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw7","pts":[[478,543.33],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw8","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsw9","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1L","pts":[[1176,360],[1459.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w2","pts":[[1176,580],[1459.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w3","pts":[[1459.5,360],[1743,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w4","pts":[[1459.5,580],[1743,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w5","pts":[[1176,360],[1176,396.67]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w6","pts":[[1176,396.67],[1176,433.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w7","pts":[[1176,506.67],[1176,543.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w8","pts":[[1176,543.33],[1176,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w9","pts":[[1459.5,360],[1459.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w10","pts":[[1459.5,500],[1459.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w11","pts":[[1743,360],[1743,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4xsx1w12","pts":[[1743,500],[1743,580]],"vis":[],"dash":0},{"t":"r","k":"ra","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,306.08,null]},{"t":"T","k":"a","x":478,"y":396.67,"dir":"v","vis":[],"side":-1,"lab":[494.13,412.67,"start"]},{"t":"T","k":"b","x":478,"y":543.33,"dir":"v","vis":[],"side":-1,"lab":[494.13,527.33,"start"]},{"t":"r","k":"rb","x":1045,"y":470,"dir":"v","vis":[],"lab":[1022.87,470,"end"]},{"t":"cap","id":"u45s4xscap0","x":775,"y":657.47,"s":"直列","vis":[]},{"t":"T","k":"a","x":1176,"y":396.67,"dir":"v","vis":[],"side":-1,"lab":[1192.13,412.67,"start"],"n":"ax1"},{"t":"T","k":"b","x":1176,"y":543.33,"dir":"v","vis":[],"side":-1,"lab":[1192.13,527.33,"start"],"n":"bx1"},{"t":"r","k":"ra","x":1459.5,"y":470,"dir":"v","vis":[],"lab":[1481.63,470,"start"],"n":"rax1"},{"t":"r","k":"rb","x":1743,"y":470,"dir":"v","vis":[],"lab":[1720.87,470,"end"],"n":"rbx1"},{"t":"d","id":"u45s4xsx1j6","x":1459.5,"y":360,"vis":[]},{"t":"d","id":"u45s4xsx1j9","x":1459.5,"y":580,"vis":[]},{"t":"cap","id":"u45s4xscap1","x":1473,"y":657.47,"s":"並列","vis":[]}],"flows":[{"c":[],"paths":[]},{"c":[],"paths":[]}],"base":110,"von":[],"bands":"never","pts":[],"net":[["R","ra","L0:n1","L0:n2",20,[]],["R","rb","L0:n2","L0:n6",5,[]],["R","ra","L1:n1","L1:n8",20,[]],["R","rb","L1:n1","L1:n8",5,[]]]},
  es: {"vars":[],"items":[{"t":"w","id":"u45s4esL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw4","pts":[[478,360],[478,396.67]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw5","pts":[[478,396.67],[478,433.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw6","pts":[[478,506.67],[478,543.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw7","pts":[[478,543.33],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw8","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4esw9","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1L","pts":[[1176,360],[1459.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w2","pts":[[1176,580],[1459.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w3","pts":[[1459.5,360],[1743,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w4","pts":[[1459.5,580],[1743,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w5","pts":[[1176,360],[1176,396.67]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w6","pts":[[1176,396.67],[1176,433.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w7","pts":[[1176,506.67],[1176,543.33]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w8","pts":[[1176,543.33],[1176,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w9","pts":[[1459.5,360],[1459.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w10","pts":[[1459.5,500],[1459.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w11","pts":[[1743,360],[1743,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4esx1w12","pts":[[1743,500],[1743,580]],"vis":[],"dash":0},{"t":"r","k":"ra","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,306.08,null]},{"t":"T","k":"a","x":478,"y":396.67,"dir":"v","vis":[],"side":-1,"lab":[494.13,412.67,"start"]},{"t":"T","k":"b","x":478,"y":543.33,"dir":"v","vis":[],"side":-1,"lab":[494.13,527.33,"start"]},{"t":"r","k":"rb","x":1045,"y":470,"dir":"v","vis":[],"lab":[1022.87,470,"end"]},{"t":"cap","id":"u45s4escap0","x":775,"y":657.47,"s":"直列","vis":[]},{"t":"T","k":"a","x":1176,"y":396.67,"dir":"v","vis":[],"side":-1,"lab":[1192.13,412.67,"start"],"n":"ax1"},{"t":"T","k":"b","x":1176,"y":543.33,"dir":"v","vis":[],"side":-1,"lab":[1192.13,527.33,"start"],"n":"bx1"},{"t":"r","k":"ra","x":1459.5,"y":470,"dir":"v","vis":[],"lab":[1481.63,470,"start"],"n":"rax1"},{"t":"r","k":"rb","x":1743,"y":470,"dir":"v","vis":[],"lab":[1720.87,470,"end"],"n":"rbx1"},{"t":"d","id":"u45s4esx1j6","x":1459.5,"y":360,"vis":[]},{"t":"d","id":"u45s4esx1j9","x":1459.5,"y":580,"vis":[]},{"t":"cap","id":"u45s4escap1","x":1473,"y":657.47,"s":"並列","vis":[]}],"flows":[{"c":[],"paths":[]},{"c":[],"paths":[]}],"base":110,"von":[],"bands":"never","pts":[],"net":[["R","ra","L0:n1","L0:n2",4,[]],["R","rb","L0:n2","L0:n6",6,[]],["R","ra","L1:n1","L1:n8",4,[]],["R","rb","L1:n1","L1:n8",6,[]]]},
  two: {"vars":[],"items":[{"t":"w","id":"u45s4twoL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow3","pts":[[528,280],[632,280]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow4","pts":[[692,280],[831,280]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow5","pts":[[891,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow6","pts":[[528,440],[632,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow7","pts":[[692,440],[831,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow8","pts":[[891,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow9","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4twow10","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1},{"t":"r","k":"r1","x":662,"y":280,"dir":"h","vis":[],"lab":[662,250.34,null]},{"t":"r","k":"rx","x":861,"y":280,"dir":"h","vis":[],"lab":[861,250.34,null]},{"t":"r","k":"r2","x":662,"y":440,"dir":"h","vis":[],"lab":[662,410.34,null]},{"t":"r","k":"rx2","x":861,"y":440,"dir":"h","vis":[],"lab":[861,410.34,null]},{"t":"d","id":"u45s4twoj115","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s4twoj216","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":528,"y1":452,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.5,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","rx","n1","N",1,[]],["R","r2","P","n2",1,[]],["R","rx2","n2","N",1,[]]]},
  twoL: {"vars":[],"items":[{"t":"w","id":"u45s4twoLL","pts":[[478,360],[478,590],[752,590]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLRw","pts":[[772,590],[1045,590],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw3","pts":[[528,280],[632,280]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw4","pts":[[692,280],[831,280]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw5","pts":[[891,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw6","pts":[[528,440],[632,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw7","pts":[[692,440],[831,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw8","pts":[[891,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw9","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s4twoLw10","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":590,"xm":772,"ym":590,"vis":[],"side":1,"loop":1},{"t":"r","k":"rx","x":662,"y":280,"dir":"h","vis":[],"lab":[662,250.34,null]},{"t":"r","k":"r1","x":861,"y":280,"dir":"h","vis":[],"lab":[861,250.34,null]},{"t":"r","k":"rx2","x":662,"y":440,"dir":"h","vis":[],"lab":[662,410.34,null]},{"t":"r","k":"r2","x":861,"y":440,"dir":"h","vis":[],"lab":[861,410.34,null]},{"t":"d","id":"u45s4twoLj115","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s4twoLj216","x":995,"y":360,"vis":[]},{"t":"dim","k":"rd","x1":528,"y1":452,"x2":995,"y2":452,"ya":488,"yt":498,"ly":508.04,"vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,590],[478,590],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.5,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,590],[772,590]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","rx","P","n1",1,[]],["R","r1","n1","N",1,[]],["R","rx2","P","n2",1,[]],["R","r2","n2","N",1,[]]]}
};
function tbU45s4sp(d, p, L){ tbFig_Draw(d, p, L, U45S4K.sp); }
function tbU45s4xs(d, p, L){ tbFig_Draw(d, p, L, U45S4K.xs); }
function tbU45s4es(d, p, L){ tbFig_Draw(d, p, L, U45S4K.es); }
function tbU45s4two(d, p, L){ tbGen_Draw(d, p, L, U45S4K.two); }
function tbU45s4twoL(d, p, L){ tbGen_Draw(d, p, L, U45S4K.twoL); }
// ---- 45-5 ミリとキロ の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S5K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u45s5xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s5xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5xqw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5xqw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,389.66,null]},{"t":"v","k":"v1","x":761.5,"y":360,"dir":"h","side":1,"hi":-1,"vis":[],"elem":"r1","lab":[761.5,464.04,null]},{"t":"i","k":"i","x0":674,"y0":343,"x1":714,"y1":343,"lab":[694,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1"],"bands":"never","pts":[],"net":[["E","src","P","N",10,[]],["R","r1","P","N",2,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu45s5xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s5xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u45s5xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s5xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5xxw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5xxw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.79,null]},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,390.5,null]},{"t":"v","k":"v1","x":761.5,"y":360,"dir":"h","side":1,"hi":-1,"vis":[],"elem":"r1","lab":[761.5,464.79,null]},{"t":"i","k":"i","x0":674,"y0":343,"x1":714,"y1":343,"lab":[694,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1"],"bands":"volt","pts":[],"net":[["E","src","P","N",10,[]],["R","r1","P","N",2,[]]]},
  lp: {"vars":[],"items":[{"t":"w","id":"u45s5lpL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s5lpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5lpw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5lpw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,389.66,null]},{"t":"v","k":"v1","x":761.5,"y":360,"dir":"h","side":1,"hi":-1,"vis":[],"elem":"r1","lab":[761.5,464.04,null]},{"t":"i","k":"i","x0":674,"y0":343,"x1":714,"y1":343,"lab":[694,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]]]},
  col: {"vars":[],"items":[{"t":"w","id":"u45s5colL","pts":[[478,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s5colw2","pts":[[478,630],[1045,630]],"vis":[],"dash":0},{"t":"w","id":"u45s5colw3","pts":[[478,360],[478,483]],"vis":[],"dash":0},{"t":"w","id":"u45s5colw4","pts":[[478,507],[478,630]],"vis":[],"dash":0},{"t":"w","id":"u45s5colw5","pts":[[1045,360],[1045,465]],"vis":[],"dash":0},{"t":"w","id":"u45s5colw6","pts":[[1045,525],[1045,630]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":483,"xm":478,"ym":507,"vis":[],"side":-1,"lab":[515.62,495,"start"]},{"t":"r","k":"r1","x":1045,"y":495,"dir":"v","vis":[],"lab":[1064.62,495,"start"]},{"t":"v","k":"v1","x":1045,"y":495,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[960,495,"end"]},{"t":"i","k":"i","x0":1062,"y0":412.5,"x1":1062,"y1":452.5,"lab":[1077.62,432.5,"start"],"vis":[],"ax":"v","sd":1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,483],[478,360],[1045,360],[1045,630],[478,630],[478,507]]}]}],"base":110,"von":["src","v1"],"bands":"never","pts":[],"net":[["E","src","n1","n3",1,[]],["R","r1","n1","n3",1,[]]]}
};
function tbU45s5xq(d, p, L){ tbGen_Draw(d, p, L, U45S5K.xq); }
function tbU45s5xx(d, p, L){ tbGen_Draw(d, p, L, U45S5K.xx); }
function tbU45s5lp(d, p, L){ tbGen_Draw(d, p, L, U45S5K.lp); }
function tbU45s5col(d, p, L){ tbGen_Draw(d, p, L, U45S5K.col); }
// ---- 45-6 オームから電流の和 の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S6K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u45s6xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6xqw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,309.66,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,410.34,null]},{"t":"d","id":"u45s6xqj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s6xqj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,485.76,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.6,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.4,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","N",4,[]],["R","r2","P","N",6,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu45s6xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[528,360]],[[731.5,280],[528,280],[528,440],[731.5,440]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s6xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[791.5,280],[995,280],[995,440],[791.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u45s6xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6xxw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,314.63,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,405.37,null]},{"t":"d","id":"u45s6xxj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s6xxj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,229.27,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,490.73,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.6,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.4,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","N",4,[]],["R","r2","P","N",6,[]]]},
  lp: {"vars":[],"items":[{"t":"w","id":"u45s6lpL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6lpw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,309.66,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,410.34,null]},{"t":"d","id":"u45s6lpj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s6lpj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,485.76,null],"vis":[],"ax":"h","iside":"down","io":1},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.5,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r2","P","N",1,[]]]},
  col: {"vars":[],"items":[{"t":"w","id":"u45s6colL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw2","pts":[[478,580],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw4","pts":[[761.5,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw5","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw6","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw7","pts":[[761.5,360],[761.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw8","pts":[[761.5,500],[761.5,580]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw9","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s6colw10","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r1","x":761.5,"y":470,"dir":"v","vis":[],"lab":[781.12,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1025.38,430,"end"]},{"t":"d","id":"u45s6colj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u45s6colj7","x":761.5,"y":580,"vis":[]},{"t":"i","k":"i","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445.38,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"i","k":"i1","x0":744.5,"y0":397.5,"x1":744.5,"y1":437.5,"lab":[728.88,417.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"i","k":"i2","x0":1062,"y0":397.5,"x1":1062,"y1":437.5,"lab":[1077.62,417.5,"start"],"vis":[],"ax":"v","sd":1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,580],[478,580],[478,482]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,580],[761.5,580]]},{"I":1,"pts":[[478,458],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,580]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","n1","n4",1,[]],["R","r1","n1","n4",1,[]],["R","r2","n1","n4",1,[]]]}
};
function tbU45s6xq(d, p, L){ tbGen_Draw(d, p, L, U45S6K.xq); }
function tbU45s6xx(d, p, L){ tbGen_Draw(d, p, L, U45S6K.xx); }
function tbU45s6lp(d, p, L){ tbGen_Draw(d, p, L, U45S6K.lp); }
function tbU45s6col(d, p, L){ tbGen_Draw(d, p, L, U45S6K.col); }
// ---- 45-7 電圧の引き算からオーム の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S7K = {
  xq: {"vars":[],"items":[{"t":"w","id":"u45s7xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s7xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7xqw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7xqw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7xqw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,330.34,null]},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[638.67,255.96,null]},{"t":"r","k":"r2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,330.34,null]},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[884.33,255.96,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",30,[]],["R","r1","P","n1",6,[]],["R","r2","n1","N",4,[]]]},
  xx: {"vars":[],"items":[{"t":"z","id":"zbu45s7xx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[608.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s7xx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[914.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s7xx2mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s7xxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s7xxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7xxw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7xxw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7xxw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null]},{"t":"r","k":"r1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,325.37,null]},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[638.67,251.5,null]},{"t":"r","k":"r2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,325.37,null]},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[884.33,251.5,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",30,[]],["R","r1","P","n1",6,[]],["R","r2","n1","N",4,[]]]},
  lp: {"vars":[],"items":[{"t":"w","id":"u45s7lpL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s7lpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7lpw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7lpw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7lpw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,330.34,null]},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[638.67,255.96,null]},{"t":"r","k":"r2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,330.34,null]},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[884.33,255.96,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]},
  col: {"vars":[],"items":[{"t":"w","id":"u45s7colL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7colw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s7colw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s7colw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s7colw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s7colw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s7colw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,330.34,null]},{"t":"v","k":"v1","x":761.5,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[761.5,255.96,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[515.62,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1064.62,470,"start"]},{"t":"v","k":"v2","x":1045,"y":470,"dir":"v","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[960,470,"end"]},{"t":"i","k":"i","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445.38,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]}],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["R","r1","n1","n2",1,[]],["E","src","n1","n3",1,[]],["R","r2","n2","n3",1,[]]]}
};
function tbU45s7xq(d, p, L){ tbGen_Draw(d, p, L, U45S7K.xq); }
function tbU45s7xx(d, p, L){ tbGen_Draw(d, p, L, U45S7K.xx); }
function tbU45s7lp(d, p, L){ tbGen_Draw(d, p, L, U45S7K.lp); }
function tbU45s7col(d, p, L){ tbGen_Draw(d, p, L, U45S7K.col); }
// ---- 45-8 合成から電源の電圧を出す の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s8.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S8K = {
  a: {"vars":[],"items":[{"t":"w","id":"u45s8aL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8aRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8aw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s8aj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s8aj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.5,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.5,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]],["R","r3","n1","N",1,[]]]},
  b: {"vars":[],"items":[{"t":"w","id":"u45s8bL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8bRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8bw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r2","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r3","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s8bj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s8bj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r1","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r2","P","n1",1,[]],["R","r3","P","n1",1,[]],["R","r1","n1","N",1,[]]]},
  c: {"vars":[],"items":[{"t":"w","id":"u45s8cL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8cRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw2","pts":[[815,280],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw3","pts":[[528,280],[641.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw4","pts":[[701.5,280],[815,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw5","pts":[[528,440],[641.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw6","pts":[[701.5,440],[815,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw8","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8cw9","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":671.5,"y":280,"dir":"h","vis":[],"lab":[671.5,250.34,null]},{"t":"r","k":"r2","x":671.5,"y":440,"dir":"h","vis":[],"lab":[671.5,410.34,null]},{"t":"d","id":"u45s8cj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s8cj212","x":815,"y":360,"vis":[]},{"t":"r","k":"r3","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[815,280],[815,360]]},{"I":0.5,"pts":[[528,360],[528,440],[815,440],[815,360]]},{"I":1,"pts":[[815,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","P","n1",1,[]],["R","r3","n1","N",1,[]]]},
  d: {"vars":[],"items":[{"t":"w","id":"u45s8dL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8dRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8dw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8dw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8dw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,330.34,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu45s8ae0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s8ae1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s8ae2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]],[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s8aeL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8aew9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.37,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,245.37,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,405.37,null]},{"t":"d","id":"u45s8aej113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s8aej214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",6,[]],["R","r3","n1","N",3,[]]]},
  ax: {"vars":[["m","am","r23"]],"items":[{"t":"z","id":"zbu45s8ax0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s8ax1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s8ax2mid","z":"mid","lines":[[[821.5,280],[708,280],[708,440],[821.5,440]]],"vis":[-1],"pts":[],"node":"n1"},{"t":"z","id":"zbu45s8ax3lo","z":"lo","lines":[[[881.5,280],[995,280],[995,440],[881.5,440]]],"vis":[-1],"pts":[],"node":"N"},{"t":"z","id":"zbu45s8ax4mid","z":"mid","lines":[[[708,360],[821.5,360]]],"vis":[1],"pts":[],"node":"n1"},{"t":"z","id":"zbu45s8ax5lo","z":"lo","lines":[[[881.5,360],[995,360]]],"vis":[1],"pts":[],"node":"N"},{"t":"z","id":"zbu45s8ax6mid","z":"mid","lines":[[[623,360],[708,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s8axL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8axRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8axw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8axw2","pts":[[708,280],[708,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s8axw3","pts":[[995,280],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s8axw4","pts":[[708,280],[821.5,280]],"vis":[-1],"dash":0},{"t":"w","id":"u45s8axw5","pts":[[881.5,280],[995,280]],"vis":[-1],"dash":0},{"t":"w","id":"u45s8axw6","pts":[[708,440],[821.5,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s8axw7","pts":[[881.5,440],[995,440]],"vis":[-1],"dash":0},{"t":"w","id":"u45s8axw8","pts":[[708,360],[821.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s8axw9","pts":[[881.5,360],[995,360]],"vis":[1],"dash":0},{"t":"w","id":"u45s8axw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8axw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,325.37,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[-1],"lab":[851.5,245.37,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[-1],"lab":[851.5,405.37,null]},{"t":"d","id":"u45s8axj113","x":708,"y":360,"vis":[-1]},{"t":"d","id":"u45s8axj214","x":995,"y":360,"vis":[-1]},{"t":"r","k":"r23","x":851.5,"y":360,"dir":"h","vis":[1],"lab":[851.5,325.37,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]},{"c":[1],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",20,[]],["R","r1","P","n1",6,[]],["R","r2","n1","N",12,[-1]],["R","r3","n1","N",6,[-1]],["R","r23","n1","N",1,[1]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u45s8qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s8qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw2","pts":[[708,280],[708,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw3","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw4","pts":[[708,280],[821.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw5","pts":[[881.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw6","pts":[[708,440],[821.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw7","pts":[[881.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw8","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s8qw9","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":280,"dir":"h","vis":[],"lab":[851.5,250.34,null]},{"t":"r","k":"r3","x":851.5,"y":440,"dir":"h","vis":[],"lab":[851.5,410.34,null]},{"t":"d","id":"u45s8qj113","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s8qj214","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[708,360]]},{"I":0.33,"pts":[[708,360],[708,280],[995,280],[995,360]]},{"I":0.67,"pts":[[708,360],[708,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",20,[]],["R","r1","P","n1",6,[]],["R","r2","n1","N",12,[]],["R","r3","n1","N",6,[]]]}
};
function tbU45s8a(d, p, L){ tbGen_Draw(d, p, L, U45S8K.a); }
function tbU45s8b(d, p, L){ tbGen_Draw(d, p, L, U45S8K.b); }
function tbU45s8c(d, p, L){ tbGen_Draw(d, p, L, U45S8K.c); }
function tbU45s8d(d, p, L){ tbGen_Draw(d, p, L, U45S8K.d); }
function tbU45s8ae(d, p, L){ tbGen_Draw(d, p, L, U45S8K.ae); }
function tbU45s8ax(d, p, L){ tbGen_Draw(d, p, L, U45S8K.ax); }
function tbU45s8q(d, p, L){ tbGen_Draw(d, p, L, U45S8K.q); }
// ---- 45-9 電源の電圧を次の図へ持ち越す の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s9.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S9K = {
  rep: {"vars":[],"items":[{"t":"w","id":"u45s9repL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9repw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9repw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1L","pts":[[1332,360],[1585.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1w2","pts":[[1645.5,360],[1899,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1w3","pts":[[1332,580],[1899,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1w4","pts":[[1332,360],[1332,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1w5","pts":[[1332,482],[1332,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1w6","pts":[[1899,360],[1899,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9repx1w7","pts":[[1899,500],[1899,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,300.31,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.73,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1022.27,470,"end"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u45s9repcap0","x":697,"y":662.9,"s":"図1","vis":[]},{"t":"r","k":"r1","x":1615.5,"y":360,"dir":"h","vis":[],"lab":[1615.5,300.31,null],"n":"r1x1"},{"t":"e","k":"src","dir":"v","xp":1332,"yp":458,"xm":1332,"ym":482,"vis":[],"side":-1,"lab":[1372.73,470,"start"],"n":"srcx1"},{"t":"r","k":"r3","x":1899,"y":470,"dir":"v","vis":[],"lab":[1876.27,470,"end"],"n":"r3x1"},{"t":"i","k":"i2","x0":1315,"y0":446.5,"x1":1315,"y1":406.5,"lab":[1299,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u45s9repcap1","x":1551,"y":662.9,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1332,458],[1332,360],[1899,360],[1899,580],[1332,580],[1332,482]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","r2","L0:n2","L0:n3",1,[]],["R","r1","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n3",1,[]],["R","r3","L1:n2","L1:n3",1,[]]]},
  repb: {"vars":[],"items":[{"t":"w","id":"u45s9repbL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1L","pts":[[1332,360],[1585.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1w2","pts":[[1645.5,360],[1899,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1w3","pts":[[1332,580],[1899,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1w4","pts":[[1332,360],[1332,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1w5","pts":[[1332,482],[1332,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1w6","pts":[[1899,360],[1899,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9repbx1w7","pts":[[1899,500],[1899,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,300.31,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.73,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1022.27,470,"end"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u45s9repbcap0","x":697,"y":662.9,"s":"図1","vis":[]},{"t":"r","k":"r3","x":1615.5,"y":360,"dir":"h","vis":[],"lab":[1615.5,300.31,null],"n":"r3x1"},{"t":"e","k":"src","dir":"v","xp":1332,"yp":458,"xm":1332,"ym":482,"vis":[],"side":-1,"lab":[1372.73,470,"start"],"n":"srcx1"},{"t":"r","k":"r2","x":1899,"y":470,"dir":"v","vis":[],"lab":[1876.27,470,"end"],"n":"r2x1"},{"t":"i","k":"i2","x0":1315,"y0":446.5,"x1":1315,"y1":406.5,"lab":[1299,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u45s9repbcap1","x":1551,"y":662.9,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1332,458],[1332,360],[1899,360],[1899,580],[1332,580],[1332,482]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","r2","L0:n2","L0:n3",1,[]],["R","r3","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n3",1,[]],["R","r2","L1:n2","L1:n3",1,[]]]},
  add: {"vars":[],"items":[{"t":"w","id":"u45s9addL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9addw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9addw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9addw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9addw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9addw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9addw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1L","pts":[[1332,360],[1585.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w2","pts":[[1645.5,360],[1899,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w3","pts":[[1332,670],[1899,670]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w4","pts":[[1332,360],[1332,503]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w5","pts":[[1332,527],[1332,670]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w6","pts":[[1899,360],[1899,407.5]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w7","pts":[[1899,467.5],[1899,515]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w8","pts":[[1899,515],[1899,562.5]],"vis":[],"dash":0},{"t":"w","id":"u45s9addx1w9","pts":[[1899,622.5],[1899,670]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,300.31,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.73,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1022.27,470,"end"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u45s9addcap0","x":697,"y":752.9,"s":"図1","vis":[]},{"t":"r","k":"r1","x":1615.5,"y":360,"dir":"h","vis":[],"lab":[1615.5,300.31,null],"n":"r1x1"},{"t":"e","k":"src","dir":"v","xp":1332,"yp":503,"xm":1332,"ym":527,"vis":[],"side":-1,"lab":[1372.73,515,"start"],"n":"srcx1"},{"t":"r","k":"r2","x":1899,"y":437.5,"dir":"v","vis":[],"lab":[1876.27,437.5,"end"],"n":"r2x1"},{"t":"r","k":"r3","x":1899,"y":592.5,"dir":"v","vis":[],"lab":[1876.27,592.5,"end"],"n":"r3x1"},{"t":"i","k":"i2","x0":1315,"y0":491.5,"x1":1315,"y1":451.5,"lab":[1299,471.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u45s9addcap1","x":1551,"y":752.9,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1332,503],[1332,360],[1899,360],[1899,670],[1332,670],[1332,527]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","r2","L0:n2","L0:n3",1,[]],["R","r1","L1:n1","L1:n2",1,[]],["E","src","L1:n1","L1:n3",1,[]],["R","r2","L1:n2","L1:n5",1,[]],["R","r3","L1:n5","L1:n3",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu45s9ae0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu45s9ae1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,440]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu45s9ae2lo","z":"lo","lines":[[[478,482],[478,580],[1045,580],[1045,500]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu45s9aex10hi","z":"hi","lines":[[[743,797],[489.5,797],[489.5,895]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu45s9aex11mid","z":"mid","lines":[[[803,797],[1056.5,797],[1056.5,877]]],"vis":[],"pts":[],"node":"L1:n2"},{"t":"z","id":"zbu45s9aex12lo","z":"lo","lines":[[[489.5,919],[489.5,1017],[1056.5,1017],[1056.5,937]]],"vis":[],"pts":[],"node":"L1:n3"},{"t":"w","id":"u45s9aeL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9aew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9aew3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9aew4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9aew5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9aew6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9aew7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1L","pts":[[489.5,797],[743,797]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1w2","pts":[[803,797],[1056.5,797]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1w3","pts":[[489.5,1017],[1056.5,1017]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1w4","pts":[[489.5,797],[489.5,895]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1w5","pts":[[489.5,919],[489.5,1017]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1w6","pts":[[1056.5,797],[1056.5,877]],"vis":[],"dash":0},{"t":"w","id":"u45s9aex1w7","pts":[[1056.5,937],[1056.5,1017]],"vis":[],"dash":0},{"t":"r","k":"sr1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,322.24,null]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.46,470,"start"]},{"t":"r","k":"sr2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1024.54,470,"end"]},{"t":"i","k":"si1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.54,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u45s9aecap0","x":689,"y":629.16,"s":"図1","vis":[]},{"t":"r","k":"sr1","x":773,"y":797,"dir":"h","vis":[],"lab":[773,759.24,null],"n":"sr1x1"},{"t":"e","k":"ssrc","dir":"v","xp":489.5,"yp":895,"xm":489.5,"ym":919,"vis":[],"side":-1,"lab":[527.96,907,"start"],"n":"ssrcx1"},{"t":"r","k":"sr3","x":1056.5,"y":907,"dir":"v","vis":[],"lab":[1036.04,907,"end"],"n":"sr3x1"},{"t":"i","k":"si2","x0":472.5,"y0":883.5,"x1":472.5,"y1":843.5,"lab":[456.04,863.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"si2x1"},{"t":"cap","id":"u45s9aecap1","x":689,"y":1066.16,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[489.5,895],[489.5,797],[1056.5,797],[1056.5,1017],[489.5,1017],[489.5,919]]}]}],"base":110,"von":["ssrc"],"bands":"volt","pts":[],"net":[["R","sr1","L0:n1","L0:n2",4,[]],["E","ssrc","L0:n1","L0:n3",36,[]],["R","sr2","L0:n2","L0:n3",8,[]],["R","sr1","L1:n1","L1:n2",4,[]],["E","ssrc","L1:n1","L1:n3",36,[]],["R","sr3","L1:n2","L1:n3",2,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu45s9ax0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,458]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu45s9ax1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,440]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu45s9ax2lo","z":"lo","lines":[[[478,482],[478,580],[1045,580],[1045,500]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu45s9axx10hi","z":"hi","lines":[[[743,797],[489.5,797],[489.5,895]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu45s9axx11mid","z":"mid","lines":[[[803,797],[1056.5,797],[1056.5,877]]],"vis":[],"pts":[],"node":"L1:n2"},{"t":"z","id":"zbu45s9axx12lo","z":"lo","lines":[[[489.5,919],[489.5,1017],[1056.5,1017],[1056.5,937]]],"vis":[],"pts":[],"node":"L1:n3"},{"t":"w","id":"u45s9axL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9axw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9axw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9axw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9axw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9axw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9axw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1L","pts":[[489.5,797],[743,797]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1w2","pts":[[803,797],[1056.5,797]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1w3","pts":[[489.5,1017],[1056.5,1017]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1w4","pts":[[489.5,797],[489.5,895]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1w5","pts":[[489.5,919],[489.5,1017]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1w6","pts":[[1056.5,797],[1056.5,877]],"vis":[],"dash":0},{"t":"w","id":"u45s9axx1w7","pts":[[1056.5,937],[1056.5,1017]],"vis":[],"dash":0},{"t":"r","k":"sr1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,322.24,null]},{"t":"e","k":"ssrc","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[516.46,470,"start"]},{"t":"r","k":"sr2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1024.54,470,"end"]},{"t":"i","k":"si1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[444.54,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u45s9axcap0","x":689,"y":629.16,"s":"図1","vis":[]},{"t":"r","k":"sr1","x":773,"y":797,"dir":"h","vis":[],"lab":[773,759.24,null],"n":"sr1x1"},{"t":"e","k":"ssrc","dir":"v","xp":489.5,"yp":895,"xm":489.5,"ym":919,"vis":[],"side":-1,"lab":[527.96,907,"start"],"n":"ssrcx1"},{"t":"r","k":"sr3","x":1056.5,"y":907,"dir":"v","vis":[],"lab":[1036.04,907,"end"],"n":"sr3x1"},{"t":"i","k":"si2","x0":472.5,"y0":883.5,"x1":472.5,"y1":843.5,"lab":[456.04,863.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"si2x1"},{"t":"cap","id":"u45s9axcap1","x":689,"y":1066.16,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[489.5,895],[489.5,797],[1056.5,797],[1056.5,1017],[489.5,1017],[489.5,919]]}]}],"base":110,"von":["ssrc"],"bands":"volt","pts":[],"net":[["R","sr1","L0:n1","L0:n2",2,[]],["E","ssrc","L0:n1","L0:n3",60,[]],["R","sr2","L0:n2","L0:n3",10,[]],["R","sr1","L1:n1","L1:n2",2,[]],["E","ssrc","L1:n1","L1:n3",60,[]],["R","sr3","L1:n2","L1:n3",3,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u45s9qL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9qw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9qw3","pts":[[478,580],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9qw4","pts":[[478,360],[478,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9qw5","pts":[[478,482],[478,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9qw6","pts":[[1045,360],[1045,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9qw7","pts":[[1045,500],[1045,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1L","pts":[[1332,360],[1585.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1w2","pts":[[1645.5,360],[1899,360]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1w3","pts":[[1332,580],[1899,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1w4","pts":[[1332,360],[1332,458]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1w5","pts":[[1332,482],[1332,580]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1w6","pts":[[1899,360],[1899,440]],"vis":[],"dash":0},{"t":"w","id":"u45s9qx1w7","pts":[[1899,500],[1899,580]],"vis":[],"dash":0},{"t":"r","k":"r1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,300.31,null]},{"t":"e","k":"src","dir":"v","xp":478,"yp":458,"xm":478,"ym":482,"vis":[],"side":-1,"lab":[518.73,470,"start"]},{"t":"r","k":"r2","x":1045,"y":470,"dir":"v","vis":[],"lab":[1022.27,470,"end"]},{"t":"i","k":"i1","x0":461,"y0":446.5,"x1":461,"y1":406.5,"lab":[445,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1},{"t":"cap","id":"u45s9qcap0","x":697,"y":662.9,"s":"図1","vis":[]},{"t":"r","k":"r1","x":1615.5,"y":360,"dir":"h","vis":[],"lab":[1615.5,300.31,null],"n":"r1x1"},{"t":"e","k":"src","dir":"v","xp":1332,"yp":458,"xm":1332,"ym":482,"vis":[],"side":-1,"lab":[1372.73,470,"start"],"n":"srcx1"},{"t":"r","k":"r3","x":1899,"y":470,"dir":"v","vis":[],"lab":[1876.27,470,"end"],"n":"r3x1"},{"t":"i","k":"i2","x0":1315,"y0":446.5,"x1":1315,"y1":406.5,"lab":[1299,426.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1,"n":"i2x1"},{"t":"cap","id":"u45s9qcap1","x":1551,"y":662.9,"s":"図2","vis":[]}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[478,458],[478,360],[1045,360],[1045,580],[478,580],[478,482]]}]},{"c":[],"paths":[{"I":1,"pts":[[1332,458],[1332,360],[1899,360],[1899,580],[1332,580],[1332,482]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["R","r1","L0:n1","L0:n2",2,[]],["E","src","L0:n1","L0:n3",60,[]],["R","r2","L0:n2","L0:n3",10,[]],["R","r1","L1:n1","L1:n2",2,[]],["E","src","L1:n1","L1:n3",60,[]],["R","r3","L1:n2","L1:n3",3,[]]]}
};
function tbU45s9rep(d, p, L){ tbFig_Draw(d, p, L, U45S9K.rep); }
function tbU45s9repb(d, p, L){ tbFig_Draw(d, p, L, U45S9K.repb); }
function tbU45s9add(d, p, L){ tbFig_Draw(d, p, L, U45S9K.add); }
function tbU45s9ae(d, p, L){ tbFig_Draw(d, p, L, U45S9K.ae); }
function tbU45s9ax(d, p, L){ tbFig_Draw(d, p, L, U45S9K.ax); }
function tbU45s9q(d, p, L){ tbFig_Draw(d, p, L, U45S9K.q); }
// ---- 45-10 短絡を見抜いて合成する の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s10.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S10K = {
  p: {"vars":[],"items":[{"t":"w","id":"u45s10pL","pts":[[478,360],[478,570],[752,570]],"vis":[],"dash":0},{"t":"w","id":"u45s10pRw","pts":[[772,570],[1045,570],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw2","pts":[[708,240],[708,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw3","pts":[[995,240],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw4","pts":[[708,240],[821.5,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw5","pts":[[881.5,240],[995,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw6","pts":[[708,360],[821.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw7","pts":[[881.5,360],[995,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw8","pts":[[708,480],[851.5,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw9","pts":[[851.5,480],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10pw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":570,"xm":772,"ym":570,"vis":[],"side":1,"loop":1,"lab":[762,614.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":240,"dir":"h","vis":[],"lab":[851.5,210.34,null]},{"t":"r","k":"r3","x":851.5,"y":360,"dir":"h","vis":[],"lab":[851.5,330.34,null]},{"t":"d","id":"u45s10pj115","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s10pj216","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":510,"x1":461,"y1":470,"lab":[445,490,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,570],[478,570],[478,360],[708,360],[708,480],[995,480],[995,360],[1045,360],[1045,570],[772,570]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","n1",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","n1",1,[]],["R","r3","n1","n1",1,[]]]},
  s: {"vars":[],"items":[{"t":"w","id":"u45s10sL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s10sRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw1","pts":[[507,280],[507,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw2","pts":[[747,280],[747,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw3","pts":[[507,280],[597,280]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw4","pts":[[657,280],[747,280]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw5","pts":[[507,440],[627,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw6","pts":[[627,440],[747,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw7","pts":[[478,360],[507,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw8","pts":[[776,280],[776,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw9","pts":[[1016,280],[1016,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw10","pts":[[776,280],[866,280]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw11","pts":[[926,280],[1016,280]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw12","pts":[[776,440],[866,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw13","pts":[[926,440],[1016,440]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw14","pts":[[747,360],[776,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10sw15","pts":[[1016,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":627,"y":280,"dir":"h","vis":[],"lab":[627,250.34,null]},{"t":"d","id":"u45s10sj110","x":507,"y":360,"vis":[]},{"t":"d","id":"u45s10sj211","x":747,"y":360,"vis":[]},{"t":"r","k":"r2","x":896,"y":280,"dir":"h","vis":[],"lab":[896,250.34,null]},{"t":"r","k":"r3","x":896,"y":440,"dir":"h","vis":[],"lab":[896,410.34,null]},{"t":"d","id":"u45s10sj121","x":776,"y":360,"vis":[]},{"t":"d","id":"u45s10sj222","x":1016,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[507,360],[507,440],[747,440],[747,360],[776,360]]},{"I":0.5,"pts":[[776,360],[776,280],[1016,280],[1016,360]]},{"I":0.5,"pts":[[776,360],[776,440],[1016,440],[1016,360]]},{"I":1,"pts":[[1016,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","P",1,[]],["R","r2","P","N",1,[]],["R","r3","P","N",1,[]]]},
  q2: {"vars":[],"items":[{"t":"w","id":"u45s10q2L","pts":[[478,360],[478,570],[752,570]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2Rw","pts":[[772,570],[1045,570],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w1","pts":[[528,240],[528,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w2","pts":[[815,240],[815,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w3","pts":[[528,240],[641.5,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w4","pts":[[701.5,240],[815,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w5","pts":[[528,360],[641.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w6","pts":[[701.5,360],[815,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w7","pts":[[528,480],[671.5,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w8","pts":[[671.5,480],[815,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w9","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w10","pts":[[815,360],[900,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10q2w11","pts":[[960,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":570,"xm":772,"ym":570,"vis":[],"side":1,"loop":1,"lab":[762,614.04,null]},{"t":"r","k":"r1","x":671.5,"y":240,"dir":"h","vis":[],"lab":[671.5,210.34,null]},{"t":"r","k":"r2","x":671.5,"y":360,"dir":"h","vis":[],"lab":[671.5,330.34,null]},{"t":"d","id":"u45s10q2j113","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s10q2j214","x":815,"y":360,"vis":[]},{"t":"r","k":"r3","x":930,"y":360,"dir":"h","vis":[],"lab":[930,330.34,null]},{"t":"i","k":"i","x0":461,"y0":510,"x1":461,"y1":470,"lab":[445,490,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,570],[478,570],[478,360],[528,360],[528,480],[815,480],[815,360],[1045,360],[1045,570],[772,570]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","P",1,[]],["R","r2","P","P",1,[]],["R","r3","P","N",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu45s10ae0hi","z":"hi","lines":[[[752,570],[478,570],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s10ae1lo","z":"lo","lines":[[[772,570],[1045,570],[1045,360],[881.5,360]],[[821.5,240],[708,240],[708,480],[995,480],[995,240],[881.5,240]],[[821.5,360],[623,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s10aeL","pts":[[478,360],[478,570],[752,570]],"vis":[],"dash":0},{"t":"w","id":"u45s10aeRw","pts":[[772,570],[1045,570],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew2","pts":[[708,240],[708,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew3","pts":[[995,240],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew4","pts":[[708,240],[821.5,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew5","pts":[[881.5,240],[995,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew6","pts":[[708,360],[821.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew7","pts":[[881.5,360],[995,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew8","pts":[[708,480],[851.5,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew9","pts":[[851.5,480],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10aew11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":570,"xm":772,"ym":570,"vis":[],"side":1,"loop":1,"lab":[762,615.21,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,329.03,null]},{"t":"r","k":"r2","x":851.5,"y":240,"dir":"h","vis":[],"lab":[851.5,209.03,null]},{"t":"r","k":"r3","x":851.5,"y":360,"dir":"h","vis":[],"lab":[851.5,329.03,null]},{"t":"d","id":"u45s10aej115","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s10aej216","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":510,"x1":461,"y1":470,"lab":[445,490,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,570],[478,570],[478,360],[708,360],[708,480],[995,480],[995,360],[1045,360],[1045,570],[772,570]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","n1",12,[]],["R","r1","P","n1",4,[]],["R","r2","n1","n1",6,[]],["R","r3","n1","n1",3,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu45s10ax0hi","z":"hi","lines":[[[752,570],[478,570],[478,360],[563,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s10ax1lo","z":"lo","lines":[[[772,570],[1045,570],[1045,360],[881.5,360]],[[821.5,240],[708,240],[708,480],[995,480],[995,240],[881.5,240]],[[821.5,360],[623,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s10axL","pts":[[478,360],[478,570],[752,570]],"vis":[],"dash":0},{"t":"w","id":"u45s10axRw","pts":[[772,570],[1045,570],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw2","pts":[[708,240],[708,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw3","pts":[[995,240],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw4","pts":[[708,240],[821.5,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw5","pts":[[881.5,240],[995,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw6","pts":[[708,360],[821.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw7","pts":[[881.5,360],[995,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw8","pts":[[708,480],[851.5,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw9","pts":[[851.5,480],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10axw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":570,"xm":772,"ym":570,"vis":[],"side":1,"loop":1,"lab":[762,615.21,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,329.03,null]},{"t":"r","k":"r2","x":851.5,"y":240,"dir":"h","vis":[],"lab":[851.5,209.03,null]},{"t":"r","k":"r3","x":851.5,"y":360,"dir":"h","vis":[],"lab":[851.5,329.03,null]},{"t":"d","id":"u45s10axj115","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s10axj216","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":510,"x1":461,"y1":470,"lab":[445,490,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,570],[478,570],[478,360],[708,360],[708,480],[995,480],[995,360],[1045,360],[1045,570],[772,570]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","n1",12,[]],["R","r1","P","n1",6,[]],["R","r2","n1","n1",12,[]],["R","r3","n1","n1",4,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u45s10qL","pts":[[478,360],[478,570],[752,570]],"vis":[],"dash":0},{"t":"w","id":"u45s10qRw","pts":[[772,570],[1045,570],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw1","pts":[[478,360],[563,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw2","pts":[[708,240],[708,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw3","pts":[[995,240],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw4","pts":[[708,240],[821.5,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw5","pts":[[881.5,240],[995,240]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw6","pts":[[708,360],[821.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw7","pts":[[881.5,360],[995,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw8","pts":[[708,480],[851.5,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw9","pts":[[851.5,480],[995,480]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw10","pts":[[623,360],[708,360]],"vis":[],"dash":0},{"t":"w","id":"u45s10qw11","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":570,"xm":772,"ym":570,"vis":[],"side":1,"loop":1,"lab":[762,614.04,null]},{"t":"r","k":"r1","x":593,"y":360,"dir":"h","vis":[],"lab":[593,330.34,null]},{"t":"r","k":"r2","x":851.5,"y":240,"dir":"h","vis":[],"lab":[851.5,210.34,null]},{"t":"r","k":"r3","x":851.5,"y":360,"dir":"h","vis":[],"lab":[851.5,330.34,null]},{"t":"d","id":"u45s10qj115","x":708,"y":360,"vis":[]},{"t":"d","id":"u45s10qj216","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":510,"x1":461,"y1":470,"lab":[445,490,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,570],[478,570],[478,360],[708,360],[708,480],[995,480],[995,360],[1045,360],[1045,570],[772,570]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","n1",12,[]],["R","r1","P","n1",6,[]],["R","r2","n1","n1",12,[]],["R","r3","n1","n1",4,[]]]}
};
function tbU45s10p(d, p, L){ tbGen_Draw(d, p, L, U45S10K.p); }
function tbU45s10s(d, p, L){ tbGen_Draw(d, p, L, U45S10K.s); }
function tbU45s10q2(d, p, L){ tbGen_Draw(d, p, L, U45S10K.q2); }
function tbU45s10ae(d, p, L){ tbGen_Draw(d, p, L, U45S10K.ae); }
function tbU45s10ax(d, p, L){ tbGen_Draw(d, p, L, U45S10K.ax); }
function tbU45s10q(d, p, L){ tbGen_Draw(d, p, L, U45S10K.q); }
// ---- 45-11 平衡を見抜いて合成する の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s11.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S11K = {
  br: {"vars":[],"items":[{"t":"w","id":"u45s11brL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw2","pts":[[478,730],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw4","pts":[[761.5,730],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw5","pts":[[478,360],[478,533]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw6","pts":[[478,557],[478,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw7","pts":[[761.5,360],[761.5,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw8","pts":[[761.5,482.5],[761.5,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw9","pts":[[761.5,545],[761.5,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw10","pts":[[761.5,667.5],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw11","pts":[[1045,360],[1045,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw12","pts":[[1045,482.5],[1045,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw13","pts":[[1045,545],[1045,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw14","pts":[[1045,667.5],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw15","pts":[[761.5,545],[873.25,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11brw16","pts":[[933.25,545],[1045,545]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":533,"xm":478,"ym":557,"vis":[],"side":-1,"lab":[515.62,545,"start"]},{"t":"r","k":"r1","x":761.5,"y":452.5,"dir":"v","vis":[],"lab":[781.12,452.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":637.5,"dir":"v","vis":[],"lab":[781.12,637.5,"start"]},{"t":"r","k":"r2","x":1045,"y":452.5,"dir":"v","vis":[],"lab":[1025.38,412.5,"end"]},{"t":"r","k":"r4","x":1045,"y":637.5,"dir":"v","vis":[],"lab":[1025.38,597.5,"end"]},{"t":"r","k":"r5","x":903.25,"y":545,"dir":"h","vis":[],"lab":[903.25,515.34,null]},{"t":"d","id":"u45s11brj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u45s11brj7","x":761.5,"y":545,"vis":[]},{"t":"d","id":"u45s11brj10","x":761.5,"y":730,"vis":[]},{"t":"d","id":"u45s11brj16","x":1045,"y":545,"vis":[]},{"t":"i","k":"i","x0":461,"y0":521.5,"x1":461,"y1":481.5,"lab":[445.38,501.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,730],[478,730],[478,557]]},{"I":0.5,"pts":[[761.5,360],[1045,360],[1045,730],[761.5,730]]},{"I":1,"pts":[[478,533],[478,360],[761.5,360]]},{"I":0.5,"pts":[[761.5,360],[761.5,730]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","n1","n4",1,[]],["R","r1","n1","n7",1,[]],["R","r3","n7","n4",1,[]],["R","r2","n1","n8",1,[]],["R","r4","n8","n4",1,[]],["R","r5","n7","n8",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu45s11ae0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,533]],[[761.5,360],[1045,360],[1045,422.5]],[[761.5,360],[761.5,422.5]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu45s11ae1lo","z":"lo","lines":[[[761.5,730],[478,730],[478,557]],[[761.5,730],[1045,730],[1045,667.5]],[[761.5,667.5],[761.5,730]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu45s11ae2mid","z":"mid","lines":[[[761.5,482.5],[761.5,545]],[[761.5,545],[761.5,607.5]],[[761.5,545],[873.25,545]]],"vis":[],"pts":[],"node":"n7"},{"t":"z","id":"zbu45s11ae3mid","z":"mid","lines":[[[1045,482.5],[1045,545]],[[1045,545],[1045,607.5]],[[933.25,545],[1045,545]]],"vis":[],"pts":[],"node":"n8"},{"t":"w","id":"u45s11aeL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew2","pts":[[478,730],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew4","pts":[[761.5,730],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew5","pts":[[478,360],[478,533]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew6","pts":[[478,557],[478,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew7","pts":[[761.5,360],[761.5,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew8","pts":[[761.5,482.5],[761.5,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew9","pts":[[761.5,545],[761.5,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew10","pts":[[761.5,667.5],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew11","pts":[[1045,360],[1045,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew12","pts":[[1045,482.5],[1045,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew13","pts":[[1045,545],[1045,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew14","pts":[[1045,667.5],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew15","pts":[[761.5,545],[873.25,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11aew16","pts":[[933.25,545],[1045,545]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":533,"xm":478,"ym":557,"vis":[],"side":-1,"lab":[515.93,545,"start"]},{"t":"r","k":"r1","x":761.5,"y":452.5,"dir":"v","vis":[],"lab":[781.43,452.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":637.5,"dir":"v","vis":[],"lab":[781.43,637.5,"start"]},{"t":"r","k":"r2","x":1045,"y":452.5,"dir":"v","vis":[],"lab":[1025.07,412.5,"end"]},{"t":"r","k":"r4","x":1045,"y":637.5,"dir":"v","vis":[],"lab":[1025.07,597.5,"end"]},{"t":"r","k":"r5","x":903.25,"y":545,"dir":"h","vis":[],"lab":[903.25,512.3,null]},{"t":"d","id":"u45s11aej4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u45s11aej7","x":761.5,"y":545,"vis":[]},{"t":"d","id":"u45s11aej10","x":761.5,"y":730,"vis":[]},{"t":"d","id":"u45s11aej16","x":1045,"y":545,"vis":[]},{"t":"i","k":"i","x0":461,"y0":521.5,"x1":461,"y1":481.5,"lab":[445.07,501.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,730],[478,730],[478,557]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,730],[761.5,730]]},{"I":1,"pts":[[478,533],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,730]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",3,[]],["R","r3","n7","n4",2,[]],["R","r2","n1","n8",6,[]],["R","r4","n8","n4",4,[]],["R","r5","n7","n8",5,[]]]},
  ax: {"vars":[["s","r5o",0]],"items":[{"t":"z","id":"zbu45s11ax0hi","z":"hi","lines":[[[761.5,360],[478,360],[478,533]],[[761.5,360],[1045,360],[1045,422.5]],[[761.5,360],[761.5,422.5]]],"vis":[],"pts":[],"node":"n1"},{"t":"z","id":"zbu45s11ax1lo","z":"lo","lines":[[[761.5,730],[478,730],[478,557]],[[761.5,730],[1045,730],[1045,667.5]],[[761.5,667.5],[761.5,730]]],"vis":[],"pts":[],"node":"n4"},{"t":"z","id":"zbu45s11ax2mid","z":"mid","lines":[[[761.5,482.5],[761.5,545]],[[761.5,545],[761.5,607.5]],[[761.5,545],[873.25,545]]],"vis":[],"pts":[],"node":"n7"},{"t":"z","id":"zbu45s11ax3mid","z":"mid","lines":[[[1045,482.5],[1045,545]],[[1045,545],[1045,607.5]],[[933.25,545],[1045,545]]],"vis":[],"pts":[],"node":"n8"},{"t":"w","id":"u45s11axL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw2","pts":[[478,730],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw4","pts":[[761.5,730],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw5","pts":[[478,360],[478,533]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw6","pts":[[478,557],[478,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw7","pts":[[761.5,360],[761.5,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw8","pts":[[761.5,482.5],[761.5,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw9","pts":[[761.5,545],[761.5,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw10","pts":[[761.5,667.5],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw11","pts":[[1045,360],[1045,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw12","pts":[[1045,482.5],[1045,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw13","pts":[[1045,545],[1045,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw14","pts":[[1045,667.5],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw15","pts":[[761.5,545],[873.25,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11axw16","pts":[[933.25,545],[1045,545]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":533,"xm":478,"ym":557,"vis":[],"side":-1,"lab":[515.93,545,"start"]},{"t":"r","k":"r1","x":761.5,"y":452.5,"dir":"v","vis":[],"lab":[781.43,452.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":637.5,"dir":"v","vis":[],"lab":[781.43,637.5,"start"]},{"t":"r","k":"r2","x":1045,"y":452.5,"dir":"v","vis":[],"lab":[1025.07,412.5,"end"]},{"t":"r","k":"r4","x":1045,"y":637.5,"dir":"v","vis":[],"lab":[1025.07,597.5,"end"]},{"t":"r","k":"r5","x":903.25,"y":545,"dir":"h","vis":[],"lab":[903.25,512.3,null],"off":1},{"t":"d","id":"u45s11axj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u45s11axj7","x":761.5,"y":545,"vis":[]},{"t":"d","id":"u45s11axj10","x":761.5,"y":730,"vis":[]},{"t":"d","id":"u45s11axj16","x":1045,"y":545,"vis":[]},{"t":"i","k":"i","x0":461,"y0":521.5,"x1":461,"y1":481.5,"lab":[445.07,501.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[-1],"paths":[{"I":1,"pts":[[761.5,730],[478,730],[478,557]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,730],[761.5,730]]},{"I":1,"pts":[[478,533],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,730]]}]},{"c":[1],"paths":[{"I":1,"pts":[[761.5,730],[478,730],[478,557]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,730],[761.5,730]]},{"I":1,"pts":[[478,533],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,730]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",4,[]],["R","r3","n7","n4",2,[]],["R","r2","n1","n8",8,[]],["R","r4","n8","n4",4,[]],["R","r5","n7","n8",10,[-1]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u45s11qL","pts":[[478,360],[761.5,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw2","pts":[[478,730],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw3","pts":[[761.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw4","pts":[[761.5,730],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw5","pts":[[478,360],[478,533]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw6","pts":[[478,557],[478,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw7","pts":[[761.5,360],[761.5,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw8","pts":[[761.5,482.5],[761.5,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw9","pts":[[761.5,545],[761.5,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw10","pts":[[761.5,667.5],[761.5,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw11","pts":[[1045,360],[1045,422.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw12","pts":[[1045,482.5],[1045,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw13","pts":[[1045,545],[1045,607.5]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw14","pts":[[1045,667.5],[1045,730]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw15","pts":[[761.5,545],[873.25,545]],"vis":[],"dash":0},{"t":"w","id":"u45s11qw16","pts":[[933.25,545],[1045,545]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"v","xp":478,"yp":533,"xm":478,"ym":557,"vis":[],"side":-1,"lab":[515.62,545,"start"]},{"t":"r","k":"r1","x":761.5,"y":452.5,"dir":"v","vis":[],"lab":[781.12,452.5,"start"]},{"t":"r","k":"r3","x":761.5,"y":637.5,"dir":"v","vis":[],"lab":[781.12,637.5,"start"]},{"t":"r","k":"r2","x":1045,"y":452.5,"dir":"v","vis":[],"lab":[1025.38,412.5,"end"]},{"t":"r","k":"r4","x":1045,"y":637.5,"dir":"v","vis":[],"lab":[1025.38,597.5,"end"]},{"t":"r","k":"r5","x":903.25,"y":545,"dir":"h","vis":[],"lab":[903.25,515.34,null]},{"t":"d","id":"u45s11qj4","x":761.5,"y":360,"vis":[]},{"t":"d","id":"u45s11qj7","x":761.5,"y":545,"vis":[]},{"t":"d","id":"u45s11qj10","x":761.5,"y":730,"vis":[]},{"t":"d","id":"u45s11qj16","x":1045,"y":545,"vis":[]},{"t":"i","k":"i","x0":461,"y0":521.5,"x1":461,"y1":481.5,"lab":[445.38,501.5,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[761.5,730],[478,730],[478,557]]},{"I":0.33,"pts":[[761.5,360],[1045,360],[1045,730],[761.5,730]]},{"I":1,"pts":[[478,533],[478,360],[761.5,360]]},{"I":0.67,"pts":[[761.5,360],[761.5,730]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","n1","n4",12,[]],["R","r1","n1","n7",4,[]],["R","r3","n7","n4",2,[]],["R","r2","n1","n8",8,[]],["R","r4","n8","n4",4,[]],["R","r5","n7","n8",10,[]]]}
};
function tbU45s11br(d, p, L){ tbGen_Draw(d, p, L, U45S11K.br); }
function tbU45s11ae(d, p, L){ tbGen_Draw(d, p, L, U45S11K.ae); }
function tbU45s11ax(d, p, L){ tbGen_Draw(d, p, L, U45S11K.ax); }
function tbU45s11q(d, p, L){ tbGen_Draw(d, p, L, U45S11K.q); }
// ---- 45-12 比をとる の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s12.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S12K = {
  par: {"vars":[],"items":[{"t":"w","id":"u45s12parL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s12parRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12parw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,309.66,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,410.34,null]},{"t":"d","id":"u45s12parj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s12parj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,485.76,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.5,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r2","P","N",1,[]]]},
  ser: {"vars":[],"items":[{"t":"w","id":"u45s12serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s12serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12serw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12serw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12serw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,330.34,null]},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[638.67,255.96,null]},{"t":"r","k":"r2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,330.34,null]},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[884.33,255.96,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu45s12ae0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[528,360]],[[731.5,280],[528,280],[528,440],[731.5,440]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s12ae1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[791.5,280],[995,280],[995,440],[791.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u45s12aeL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s12aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12aew8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.79,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,310.5,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,409.5,null]},{"t":"d","id":"u45s12aej111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s12aej212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,233.4,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,486.6,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.8,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.2,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",40,[]],["R","r1","P","N",10,[]],["R","r2","P","N",40,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu45s12ax0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[528,360]],[[731.5,280],[528,280],[528,440],[731.5,440]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s12ax1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[995,360]],[[791.5,280],[995,280],[995,440],[791.5,440]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u45s12axL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s12axRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12axw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.79,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,310.5,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,409.5,null]},{"t":"d","id":"u45s12axj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s12axj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,233.4,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,486.6,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.8,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.2,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",40,[]],["R","r1","P","N",10,[]],["R","r2","P","N",40,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u45s12qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s12qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s12qw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,309.66,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,410.34,null]},{"t":"d","id":"u45s12qj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s12qj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i1","x0":684,"y0":263,"x1":724,"y1":263,"lab":[704,234.24,null],"vis":[],"ax":"h","iside":"up","io":1},{"t":"i","k":"i2","x0":684,"y0":457,"x1":724,"y1":457,"lab":[704,485.76,null],"vis":[],"ax":"h","iside":"down","io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.8,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.2,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",40,[]],["R","r1","P","N",10,[]],["R","r2","P","N",40,[]]]}
};
function tbU45s12par(d, p, L){ tbGen_Draw(d, p, L, U45S12K.par); }
function tbU45s12ser(d, p, L){ tbGen_Draw(d, p, L, U45S12K.ser); }
function tbU45s12ae(d, p, L){ tbGen_Draw(d, p, L, U45S12K.ae); }
function tbU45s12ax(d, p, L){ tbGen_Draw(d, p, L, U45S12K.ax); }
function tbU45s12q(d, p, L){ tbGen_Draw(d, p, L, U45S12K.q); }
// ---- 45-13 電力を出して比べる の図（※ textbook/gen/make_section.py が textbook/gen/data/u45_s13.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U45S13K = {
  ser: {"vars":[],"items":[{"t":"w","id":"u45s13serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s13serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13serw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13serw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13serw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,330.34,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]},
  par: {"vars":[],"items":[{"t":"w","id":"u45s13parL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s13parRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13parw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,250.34,null]},{"t":"r","k":"r2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,410.34,null]},{"t":"d","id":"u45s13parj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u45s13parj212","x":995,"y":360,"vis":[]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[528,360]]},{"I":0.5,"pts":[[528,360],[528,280],[995,280],[995,360]]},{"I":0.5,"pts":[[528,360],[528,440],[995,440],[995,360]]},{"I":1,"pts":[[995,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","N",1,[]],["R","r2","P","N",1,[]]]},
  ae: {"vars":[],"items":[{"t":"z","id":"zbu45s13ae0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[615.33,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s13ae1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[907.67,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s13ae2mid","z":"mid","lines":[[[675.33,360],[847.67,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s13aeL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s13aeRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13aew1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13aew2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13aew3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,325.6,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,325.6,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",12,[]],["R","r1","P","n1",2,[]],["R","r2","n1","N",4,[]]]},
  ax: {"vars":[],"items":[{"t":"z","id":"zbu45s13ax0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[615.33,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu45s13ax1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[907.67,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu45s13ax2mid","z":"mid","lines":[[[675.33,360],[847.67,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u45s13axL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s13axRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13axw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13axw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13axw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,325.6,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,325.6,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",30,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]]]},
  q: {"vars":[],"items":[{"t":"w","id":"u45s13qL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u45s13qRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13qw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13qw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u45s13qw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,330.34,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,330.34,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",30,[]],["R","r1","P","n1",4,[]],["R","r2","n1","N",6,[]]]}
};
function tbU45s13ser(d, p, L){ tbGen_Draw(d, p, L, U45S13K.ser); }
function tbU45s13par(d, p, L){ tbGen_Draw(d, p, L, U45S13K.par); }
function tbU45s13ae(d, p, L){ tbGen_Draw(d, p, L, U45S13K.ae); }
function tbU45s13ax(d, p, L){ tbGen_Draw(d, p, L, U45S13K.ax); }
function tbU45s13q(d, p, L){ tbGen_Draw(d, p, L, U45S13K.q); }
var KINDS = {u45s1xq: tbU45s1xq, u45s1xx: tbU45s1xx, u45s1lR: tbU45s1lR, u45s1lL: tbU45s1lL, u45s1col: tbU45s1col, u45s2xq: tbU45s2xq, u45s2xx: tbU45s2xx, u45s2e0: tbU45s2e0, u45s2e1: tbU45s2e1, u45s2e2: tbU45s2e2, u45s2aR: tbU45s2aR, u45s2aL: tbU45s2aL, u45s2bR: tbU45s2bR, u45s2bL: tbU45s2bL, u45s2cR: tbU45s2cR, u45s2cL: tbU45s2cL, u45s2ae: tbU45s2ae, u45s3xq: tbU45s3xq, u45s3xx: tbU45s3xx, u45s3aR: tbU45s3aR, u45s3aRu: tbU45s3aRu, u45s3aL: tbU45s3aL, u45s3aLu: tbU45s3aLu, u45s3bR: tbU45s3bR, u45s3bL: tbU45s3bL, u45s4sp: tbU45s4sp, u45s4xs: tbU45s4xs, u45s4es: tbU45s4es, u45s4two: tbU45s4two, u45s4twoL: tbU45s4twoL, u45s5xq: tbU45s5xq, u45s5xx: tbU45s5xx, u45s5lp: tbU45s5lp, u45s5col: tbU45s5col, u45s6xq: tbU45s6xq, u45s6xx: tbU45s6xx, u45s6lp: tbU45s6lp, u45s6col: tbU45s6col, u45s7xq: tbU45s7xq, u45s7xx: tbU45s7xx, u45s7lp: tbU45s7lp, u45s7col: tbU45s7col, u45s8a: tbU45s8a, u45s8b: tbU45s8b, u45s8c: tbU45s8c, u45s8d: tbU45s8d, u45s8ae: tbU45s8ae, u45s8ax: tbU45s8ax, u45s8q: tbU45s8q, u45s9rep: tbU45s9rep, u45s9repb: tbU45s9repb, u45s9add: tbU45s9add, u45s9ae: tbU45s9ae, u45s9ax: tbU45s9ax, u45s9q: tbU45s9q, u45s10p: tbU45s10p, u45s10s: tbU45s10s, u45s10q2: tbU45s10q2, u45s10ae: tbU45s10ae, u45s10ax: tbU45s10ax, u45s10q: tbU45s10q, u45s11br: tbU45s11br, u45s11ae: tbU45s11ae, u45s11ax: tbU45s11ax, u45s11q: tbU45s11q, u45s12par: tbU45s12par, u45s12ser: tbU45s12ser, u45s12ae: tbU45s12ae, u45s12ax: tbU45s12ax, u45s12q: tbU45s12q, u45s13ser: tbU45s13ser, u45s13par: tbU45s13par, u45s13ae: tbU45s13ae, u45s13ax: tbU45s13ax, u45s13q: tbU45s13q};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u45s1xq: function(p, L){ return tbGen_Flow(p, L, U45S1K.xq); },
  u45s1xx: function(p, L){ return tbGen_Flow(p, L, U45S1K.xx); },
  u45s1lR: function(p, L){ return tbGen_Flow(p, L, U45S1K.lR); },
  u45s1lL: function(p, L){ return tbGen_Flow(p, L, U45S1K.lL); },
  u45s1col: function(p, L){ return tbGen_Flow(p, L, U45S1K.col); },
  u45s2xq: function(p, L){ return tbGen_Flow(p, L, U45S2K.xq); },
  u45s2xx: function(p, L){ return tbGen_Flow(p, L, U45S2K.xx); },
  u45s2e0: function(p, L){ return tbGen_Flow(p, L, U45S2K.e0); },
  u45s2e1: function(p, L){ return tbGen_Flow(p, L, U45S2K.e1); },
  u45s2e2: function(p, L){ return tbGen_Flow(p, L, U45S2K.e2); },
  u45s2aR: function(p, L){ return tbGen_Flow(p, L, U45S2K.aR); },
  u45s2aL: function(p, L){ return tbGen_Flow(p, L, U45S2K.aL); },
  u45s2bR: function(p, L){ return tbGen_Flow(p, L, U45S2K.bR); },
  u45s2bL: function(p, L){ return tbGen_Flow(p, L, U45S2K.bL); },
  u45s2cR: function(p, L){ return tbGen_Flow(p, L, U45S2K.cR); },
  u45s2cL: function(p, L){ return tbGen_Flow(p, L, U45S2K.cL); },
  u45s2ae: function(p, L){ return tbGen_Flow(p, L, U45S2K.ae); },
  u45s3xq: function(p, L){ return tbGen_Flow(p, L, U45S3K.xq); },
  u45s3xx: function(p, L){ return tbGen_Flow(p, L, U45S3K.xx); },
  u45s3aR: function(p, L){ return tbGen_Flow(p, L, U45S3K.aR); },
  u45s3aRu: function(p, L){ return tbGen_Flow(p, L, U45S3K.aRu); },
  u45s3aL: function(p, L){ return tbGen_Flow(p, L, U45S3K.aL); },
  u45s3aLu: function(p, L){ return tbGen_Flow(p, L, U45S3K.aLu); },
  u45s3bR: function(p, L){ return tbGen_Flow(p, L, U45S3K.bR); },
  u45s3bL: function(p, L){ return tbGen_Flow(p, L, U45S3K.bL); },
  u45s4two: function(p, L){ return tbGen_Flow(p, L, U45S4K.two); },
  u45s4twoL: function(p, L){ return tbGen_Flow(p, L, U45S4K.twoL); },
  u45s5xq: function(p, L){ return tbGen_Flow(p, L, U45S5K.xq); },
  u45s5xx: function(p, L){ return tbGen_Flow(p, L, U45S5K.xx); },
  u45s5lp: function(p, L){ return tbGen_Flow(p, L, U45S5K.lp); },
  u45s5col: function(p, L){ return tbGen_Flow(p, L, U45S5K.col); },
  u45s6xq: function(p, L){ return tbGen_Flow(p, L, U45S6K.xq); },
  u45s6xx: function(p, L){ return tbGen_Flow(p, L, U45S6K.xx); },
  u45s6lp: function(p, L){ return tbGen_Flow(p, L, U45S6K.lp); },
  u45s6col: function(p, L){ return tbGen_Flow(p, L, U45S6K.col); },
  u45s7xq: function(p, L){ return tbGen_Flow(p, L, U45S7K.xq); },
  u45s7xx: function(p, L){ return tbGen_Flow(p, L, U45S7K.xx); },
  u45s7lp: function(p, L){ return tbGen_Flow(p, L, U45S7K.lp); },
  u45s7col: function(p, L){ return tbGen_Flow(p, L, U45S7K.col); },
  u45s8a: function(p, L){ return tbGen_Flow(p, L, U45S8K.a); },
  u45s8b: function(p, L){ return tbGen_Flow(p, L, U45S8K.b); },
  u45s8c: function(p, L){ return tbGen_Flow(p, L, U45S8K.c); },
  u45s8d: function(p, L){ return tbGen_Flow(p, L, U45S8K.d); },
  u45s8ae: function(p, L){ return tbGen_Flow(p, L, U45S8K.ae); },
  u45s8ax: function(p, L){ return tbGen_Flow(p, L, U45S8K.ax); },
  u45s8q: function(p, L){ return tbGen_Flow(p, L, U45S8K.q); },
  u45s9rep: function(p, L){ return tbGen_Flow(p, L, U45S9K.rep); },
  u45s9repb: function(p, L){ return tbGen_Flow(p, L, U45S9K.repb); },
  u45s9add: function(p, L){ return tbGen_Flow(p, L, U45S9K.add); },
  u45s9ae: function(p, L){ return tbGen_Flow(p, L, U45S9K.ae); },
  u45s9ax: function(p, L){ return tbGen_Flow(p, L, U45S9K.ax); },
  u45s9q: function(p, L){ return tbGen_Flow(p, L, U45S9K.q); },
  u45s10p: function(p, L){ return tbGen_Flow(p, L, U45S10K.p); },
  u45s10s: function(p, L){ return tbGen_Flow(p, L, U45S10K.s); },
  u45s10q2: function(p, L){ return tbGen_Flow(p, L, U45S10K.q2); },
  u45s10ae: function(p, L){ return tbGen_Flow(p, L, U45S10K.ae); },
  u45s10ax: function(p, L){ return tbGen_Flow(p, L, U45S10K.ax); },
  u45s10q: function(p, L){ return tbGen_Flow(p, L, U45S10K.q); },
  u45s11br: function(p, L){ return tbGen_Flow(p, L, U45S11K.br); },
  u45s11ae: function(p, L){ return tbGen_Flow(p, L, U45S11K.ae); },
  u45s11ax: function(p, L){ return tbGen_Flow(p, L, U45S11K.ax); },
  u45s11q: function(p, L){ return tbGen_Flow(p, L, U45S11K.q); },
  u45s12par: function(p, L){ return tbGen_Flow(p, L, U45S12K.par); },
  u45s12ser: function(p, L){ return tbGen_Flow(p, L, U45S12K.ser); },
  u45s12ae: function(p, L){ return tbGen_Flow(p, L, U45S12K.ae); },
  u45s12ax: function(p, L){ return tbGen_Flow(p, L, U45S12K.ax); },
  u45s12q: function(p, L){ return tbGen_Flow(p, L, U45S12K.q); },
  u45s13ser: function(p, L){ return tbGen_Flow(p, L, U45S13K.ser); },
  u45s13par: function(p, L){ return tbGen_Flow(p, L, U45S13K.par); },
  u45s13ae: function(p, L){ return tbGen_Flow(p, L, U45S13K.ae); },
  u45s13ax: function(p, L){ return tbGen_Flow(p, L, U45S13K.ax); },
  u45s13q: function(p, L){ return tbGen_Flow(p, L, U45S13K.q); }
};

// 45-1 合成から全体の電流 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s1_par(a, b){ return a * b / (a + b); }
function tbU45s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s1_QlR(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_2$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R3)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_1$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1lR", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1lR", L: tbU45s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$", "全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1lR", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s1lR：条件に合う数字が見つからない");
}
function tbU45s1_QlL(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_2$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R3)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_1$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1lL", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1lL", L: tbU45s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$", "全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1lL", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s1lL：条件に合う数字が見つからない");
}
function tbU45s1_Qcol(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_2$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R3)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_1$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1col", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1col", L: tbU45s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2 R_3}{R_2 + R_3} = " + qv(Rp, "O") + "$", "全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1col", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s1col：条件に合う数字が見つからない");
}
function tbU45s1_Qsw(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var Rt = (R1 + par(R2, R3));
    if (!(R2 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_3$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_1$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R3)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_3$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1sw", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$、$R_3 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1lR", L: tbU45s1_fig({}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_1 R_2}{R_1 + R_2} = " + qv(Rp, "O") + "$", "全体 $R = R_3 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1sw", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s1sw：条件に合う数字が見つからない");
}
function tbU45s1_QlRe(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 / 2);
    var Rt = (R1 + R2 / 2);
    if (!(max(R1, R2) / min(R1, R2) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_2$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R2)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_1$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1lRe", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = R_3 = " + qv(R2, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1lR", L: tbU45s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R2, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2}{2} = " + qv(Rp, "O") + "$", "全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1lRe", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s1lRe：条件に合う数字が見つからない");
}
function tbU45s1_QlLe(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 / 2);
    var Rt = (R1 + R2 / 2);
    if (!(max(R1, R2) / min(R1, R2) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_2$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R2)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_1$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1lLe", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = R_3 = " + qv(R2, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1lL", L: tbU45s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R2, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2}{2} = " + qv(Rp, "O") + "$", "全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1lLe", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s1lLe：条件に合う数字が見つからない");
}
function tbU45s1_Qcole(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 / 2);
    var Rt = (R1 + R2 / 2);
    if (!(max(R1, R2) / min(R1, R2) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_1$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_2$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R2)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_1$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1cole", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = R_3 = " + qv(R2, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1col", L: tbU45s1_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R2, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_2}{2} = " + qv(Rp, "O") + "$", "全体 $R = R_1 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1cole", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s1cole：条件に合う数字が見つからない");
}
function tbU45s1_Qswe(r){
  var gcd = tbU45s1_gcd, ratio = tbU45s1_ratio, par = tbU45s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (R2 / 2);
    var Rt = (R1 + R2 / 2);
    if (!(max(R1, R2) / min(R1, R2) <= 10 && E / Rt <= 20 && abs(E / Rt * 10 - Math.round(E / Rt * 10)) < 1e-9)) continue;
    var ok = (E / Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s1_three4(ok, [{x: (E / Rp), why: "$R_3$ を足さず、並列の部分だけで割った", w: 0, cut: 1}, {x: (E / (R1 + R2)), why: "並列をまとめず、$R_1$ だけと直列にした", w: 1, cut: 1}, {x: (E / (R1 + R2 + R2)), why: "並列を足して合成した", w: 2, cut: 0}, {x: (E / R1), why: "並列の部分を飛ばして $R_3$ だけで割った", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s1swe", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s1lR", L: tbU45s1_fig({}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R2, "O")], ["src", "{E}=" + qf(E, "V")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $\\dfrac{R_1}{2} = " + qv(Rp, "O") + "$", "全体 $R = R_3 + " + fmt(Rp) + " = " + qv(Rt, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(Rt) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s1swe", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s1swe：条件に合う数字が見つからない");
}
// 45-2 矢印の位置と分流 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s2_par(a, b){ return a * b / (a + b); }
function tbU45s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s2_QaR(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    var on = ((5 - k));
    var A = (I * Ro / (R2 + R3));
    var MW = (I * Ro / Rk);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Ro / Rk), why: "矢印の $I$ を $R_{" + fmt(on) + "}$ の道の電流と読んだ（矢印は電源の導線＝分かれる前）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (I * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2aR", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2aR", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は電源の導線。分かれる前の全体の電流です", "$I_{" + fmt(kn) + "} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2aR", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2aR：条件に合う数字が見つからない");
}
function tbU45s2_QaL(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    var on = ((5 - k));
    var A = (I * Ro / (R2 + R3));
    var MW = (I * Ro / Rk);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Ro / Rk), why: "矢印の $I$ を $R_{" + fmt(on) + "}$ の道の電流と読んだ（矢印は電源の導線＝分かれる前）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (I * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2aL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2aL", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は電源の導線。分かれる前の全体の電流です", "$I_{" + fmt(kn) + "} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2aL", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2aL：条件に合う数字が見つからない");
}
function tbU45s2_QbR(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    var on = ((5 - k));
    var A = (I * Ro / (R2 + R3));
    var MW = (I * Ro / Rk);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Ro / Rk), why: "矢印の $I$ を $R_{" + fmt(on) + "}$ の道の電流と読んだ（矢印は分かれる前の導線＝分かれる前）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (I * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2bR", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2bR", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線。分かれる前の全体の電流です", "$I_{" + fmt(kn) + "} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2bR", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2bR：条件に合う数字が見つからない");
}
function tbU45s2_QbL(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = (k);
    var on = ((5 - k));
    var A = (I * Ro / (R2 + R3));
    var MW = (I * Ro / Rk);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Ro / Rk), why: "矢印の $I$ を $R_{" + fmt(on) + "}$ の道の電流と読んだ（矢印は分かれる前の導線＝分かれる前）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (I * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2bL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2bL", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は分かれる前の導線。分かれる前の全体の電流です", "$I_{" + fmt(kn) + "} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2bL", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2bL：条件に合う数字が見つからない");
}
function tbU45s2_QcR(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var on = (5 - k);
    var A = (I * Rk / Ro);
    var MW = (I * Rk / (R2 + R3));
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Rk / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Rk / (R2 + R3)), why: "片方の道の $I$ を全体の電流と読んで分流した（矢印は $R_{" + fmt(k) + "}$ の道の上）", w: 0, cut: 1}, {x: (I), why: "同じ電流が流れるとした。並列の電圧を通していない", w: 1, cut: 1}, {x: (I * Ro / Rk), why: "比を逆にした", w: 2, cut: 0}, {x: (I * (R2 + R3) / Ro), why: "全体の電流を答えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2cR", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(on) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2cR", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i" + fmt(k), "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_{" + fmt(k) + "}$ の道の上。$R_{" + fmt(k) + "}$ だけの電流です", "並列の電圧 $V = " + fmt(Rk) + " \\times " + fmt(I) + " = " + qv(Rk * I, "V") + "$", "$I_{" + fmt(on) + "} = \\dfrac{" + fmt(Rk * I) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2cR", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2cR：条件に合う数字が見つからない");
}
function tbU45s2_QcL(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var on = (5 - k);
    var A = (I * Rk / Ro);
    var MW = (I * Rk / (R2 + R3));
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Rk / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Rk / (R2 + R3)), why: "片方の道の $I$ を全体の電流と読んで分流した（矢印は $R_{" + fmt(k) + "}$ の道の上）", w: 0, cut: 1}, {x: (I), why: "同じ電流が流れるとした。並列の電圧を通していない", w: 1, cut: 1}, {x: (I * Ro / Rk), why: "比を逆にした", w: 2, cut: 0}, {x: (I * (R2 + R3) / Ro), why: "全体の電流を答えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2cL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(on) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2cL", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i" + fmt(k), "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_{" + fmt(k) + "}$ の道の上。$R_{" + fmt(k) + "}$ だけの電流です", "並列の電圧 $V = " + fmt(Rk) + " \\times " + fmt(I) + " = " + qv(Rk * I, "V") + "$", "$I_{" + fmt(on) + "} = \\dfrac{" + fmt(Rk * I) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2cL", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2cL：条件に合う数字が見つからない");
}
function tbU45s2_QtR(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var on = (5 - k);
    var A = (I * (R2 + R3) / Ro);
    var MW = (I * Rk / Ro);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * (R2 + R3) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I), why: "片方の道の $I$ を全体の電流と読んだ（矢印は $R_{" + fmt(k) + "}$ の道の上）", w: 0, cut: 1}, {x: (I * Rk / Ro), why: "もう一方の道の電流で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: (I * (R2 + R3) / Rk), why: "比の分母を取り違えた", w: 2, cut: 0}, {x: (2 * I), why: "2つの道に同じ電流が流れると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2tR", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。電源から流れる電流は何 A ですか。", fig: {kind: "u45s2cR", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i" + fmt(k), "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_{" + fmt(k) + "}$ の道の上。$R_{" + fmt(k) + "}$ だけの電流です", "もう一方の道 $\\dfrac{" + fmt(Rk) + " \\times " + fmt(I) + "}{" + fmt(Ro) + "} = " + qv(I * Rk / Ro, "A") + "$", "電源の電流は2つの和 $" + fmt(I) + " + " + fmt(I * Rk / Ro) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s2tR", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2tR：条件に合う数字が見つからない");
}
function tbU45s2_QtL(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var on = (5 - k);
    var A = (I * (R2 + R3) / Ro);
    var MW = (I * Rk / Ro);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * (R2 + R3) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I), why: "片方の道の $I$ を全体の電流と読んだ（矢印は $R_{" + fmt(k) + "}$ の道の上）", w: 0, cut: 1}, {x: (I * Rk / Ro), why: "もう一方の道の電流で止めた（2つの和をとっていない）", w: 1, cut: 1}, {x: (I * (R2 + R3) / Rk), why: "比の分母を取り違えた", w: 2, cut: 0}, {x: (2 * I), why: "2つの道に同じ電流が流れると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2tL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。電源から流れる電流は何 A ですか。", fig: {kind: "u45s2cL", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i" + fmt(k), "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は $R_{" + fmt(k) + "}$ の道の上。$R_{" + fmt(k) + "}$ だけの電流です", "もう一方の道 $\\dfrac{" + fmt(Rk) + " \\times " + fmt(I) + "}{" + fmt(Ro) + "} = " + qv(I * Rk / Ro, "A") + "$", "電源の電流は2つの和 $" + fmt(I) + " + " + fmt(I * Rk / Ro) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s2tL", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2tL：条件に合う数字が見つからない");
}
function tbU45s2_QsR(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = ((k - 1));
    var on = ((4 - k));
    var A = (I * Ro / (R2 + R3));
    var MW = (I * Ro / Rk);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Ro / Rk), why: "矢印の $I$ を $R_{" + fmt(on) + "}$ の道の電流と読んだ（矢印は電源の導線＝分かれる前）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (I * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2sR", text: "図の回路で、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$、$R_3 = " + qv(R1, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2aR", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は電源の導線。分かれる前の全体の電流です", "$I_{" + fmt(kn) + "} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2sR", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2sR：条件に合う数字が見つからない");
}
function tbU45s2_QsL(r){
  var gcd = tbU45s2_gcd, ratio = tbU45s2_ratio, par = tbU45s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [2,3]);
    var Rk = (k == 2 ? R2 : R3);
    var Ro = (k == 2 ? R3 : R2);
    var kn = ((k - 1));
    var on = ((4 - k));
    var A = (I * Ro / (R2 + R3));
    var MW = (I * Ro / Rk);
    if (!(R2 != R3 && max(R2, R3) / min(R2, R3) <= 10 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && abs(A * 10 - Math.round(A * 10)) < 1e-9 && A <= 20 && nice(MW) && abs(MW - A) > 1e-9)) continue;
    var ok = (I * Ro / (R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s2_three4(ok, [{x: (I * Ro / Rk), why: "矢印の $I$ を $R_{" + fmt(on) + "}$ の道の電流と読んだ（矢印は電源の導線＝分かれる前）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま。分流していない", w: 1, cut: 1}, {x: (I * Rk / (R2 + R3)), why: "分流の分子に自分の抵抗", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれると考えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s2sL", text: "図の回路で、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$、$R_3 = " + qv(R1, "O") + "$ です。矢印の電流 $I$ は $" + qv(I, "A") + "$ です。$R_{" + fmt(kn) + "}$ に流れる電流は何 A ですか。", fig: {kind: "u45s2aL", L: tbU45s2_fig({"src":"{E}"}, [["r1", "{R}_3=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["矢印は電源の導線。分かれる前の全体の電流です", "$I_{" + fmt(kn) + "} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s2sL", p: {I: I, R2: R2, R3: R3, k: k}}};
  }
  throw new Error("u45s2sL：条件に合う数字が見つからない");
}
// 45-3 合成の式を逆に解く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s3_par(a, b){ return a * b / (a + b); }
function tbU45s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s3_QaR(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, Rx));
    var R = (R1 + par(R2, Rx));
    var W1 = (1 / (1 / R - 1 / R2));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && R < R2 && nice(W1) && abs(W1 - Rx) > 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (1 / (1 / R - 1 / R2)), why: "$R_1$ を引かずに、全体の $R$ を並列の式に入れた", w: 0, cut: 1}, {x: (R - R1), why: "並列の部分の合成抵抗で止めた", w: 1, cut: 1}, {x: (R2 - (R - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (R - R1 - R2), why: "並列を直列と見て引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3aR", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3aR", L: tbU45s3_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $" + fmt(R) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s3aR", p: {R1: R1, R2: R2, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3aR：条件に合う数字が見つからない");
}
function tbU45s3_QaRu(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, Rx));
    var R = (R1 + par(R2, Rx));
    var W1 = (1 / (1 / R - 1 / R2));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && R < R2 && nice(W1) && abs(W1 - Rx) > 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (1 / (1 / R - 1 / R2)), why: "$R_1$ を引かずに、全体の $R$ を並列の式に入れた", w: 0, cut: 1}, {x: (R - R1), why: "並列の部分の合成抵抗で止めた", w: 1, cut: 1}, {x: (R2 - (R - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (R - R1 - R2), why: "並列を直列と見て引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3aRu", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3aRu", L: tbU45s3_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $" + fmt(R) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s3aRu", p: {R1: R1, R2: R2, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3aRu：条件に合う数字が見つからない");
}
function tbU45s3_QaL(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, Rx));
    var R = (R1 + par(R2, Rx));
    var W1 = (1 / (1 / R - 1 / R2));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && R < R2 && nice(W1) && abs(W1 - Rx) > 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (1 / (1 / R - 1 / R2)), why: "$R_1$ を引かずに、全体の $R$ を並列の式に入れた", w: 0, cut: 1}, {x: (R - R1), why: "並列の部分の合成抵抗で止めた", w: 1, cut: 1}, {x: (R2 - (R - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (R - R1 - R2), why: "並列を直列と見て引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3aL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3aL", L: tbU45s3_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $" + fmt(R) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s3aL", p: {R1: R1, R2: R2, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3aL：条件に合う数字が見つからない");
}
function tbU45s3_QaLu(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, Rx));
    var R = (R1 + par(R2, Rx));
    var W1 = (1 / (1 / R - 1 / R2));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && R < R2 && nice(W1) && abs(W1 - Rx) > 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (1 / (1 / R - 1 / R2)), why: "$R_1$ を引かずに、全体の $R$ を並列の式に入れた", w: 0, cut: 1}, {x: (R - R1), why: "並列の部分の合成抵抗で止めた", w: 1, cut: 1}, {x: (R2 - (R - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (R - R1 - R2), why: "並列を直列と見て引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3aLu", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3aLu", L: tbU45s3_fig({"src":"{E}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $" + fmt(R) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s3aLu", p: {R1: R1, R2: R2, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3aLu：条件に合う数字が見つからない");
}
function tbU45s3_QbR(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var R = (Rx + par(R2, R3));
    if (!(R2 != R3 && max(Rx, R2, R3) / min(Rx, R2, R3) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && nice(Rp))) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (par(R2, R3)), why: "並列の部分の合成抵抗を答えた（引く前で止めた）", w: 0, cut: 1}, {x: (R), why: "全体の $R$ のまま。並列の部分を引いていない", w: 1, cut: 1}, {x: (R - R2 - R3), why: "並列を足してから引いた", w: 2, cut: 0}, {x: (R - R2), why: "並列をまとめず、$R_2$ だけを引いた", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3bR", text: "図の回路で、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3bR", L: tbU45s3_fig({"src":"{E}"}, [["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$R_x = " + fmt(R) + " - " + fmt(Rp) + " = " + qv(ok, "O") + "$"], chk: {form: "u45s3bR", p: {R2: R2, R3: R3, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3bR：条件に合う数字が見つからない");
}
function tbU45s3_QbL(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var R = (Rx + par(R2, R3));
    if (!(R2 != R3 && max(Rx, R2, R3) / min(Rx, R2, R3) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && nice(Rp))) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (par(R2, R3)), why: "並列の部分の合成抵抗を答えた（引く前で止めた）", w: 0, cut: 1}, {x: (R), why: "全体の $R$ のまま。並列の部分を引いていない", w: 1, cut: 1}, {x: (R - R2 - R3), why: "並列を足してから引いた", w: 2, cut: 0}, {x: (R - R2), why: "並列をまとめず、$R_2$ だけを引いた", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3bL", text: "図の回路で、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3bL", L: tbU45s3_fig({"src":"{E}"}, [["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$R_x = " + fmt(R) + " - " + fmt(Rp) + " = " + qv(ok, "O") + "$"], chk: {form: "u45s3bL", p: {R2: R2, R3: R3, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3bL：条件に合う数字が見つからない");
}
function tbU45s3_Qsa(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, Rx));
    var R = (R1 + par(R2, Rx));
    var W1 = (1 / (1 / R - 1 / R2));
    if (!(R2 != Rx && max(R1, R2, Rx) / min(R1, R2, Rx) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && R < R2 && nice(W1) && abs(W1 - Rx) > 1e-9)) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (1 / (1 / R - 1 / R2)), why: "$R_2$ を引かずに、全体の $R$ を並列の式に入れた", w: 0, cut: 1}, {x: (R - R1), why: "並列の部分の合成抵抗で止めた", w: 1, cut: 1}, {x: (R2 - (R - R1)), why: "並列を差で出した（逆数で解いていない）", w: 2, cut: 0}, {x: (R - R1 - R2), why: "並列を直列と見て引いた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3sa", text: "図の回路で、$R_2 = " + qv(R1, "O") + "$、$R_1 = " + qv(R2, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3aR", L: tbU45s3_fig({"src":"{E}"}, [["r1", "{R}_2=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $" + fmt(R) + " - " + fmt(R1) + " = " + qv(Rp, "O") + "$", "$\\dfrac{1}{" + fmt(Rp) + "} = \\dfrac{1}{" + fmt(R2) + "} + \\dfrac{1}{R_x}$ から $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s3sa", p: {R1: R1, R2: R2, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3sa：条件に合う数字が見つからない");
}
function tbU45s3_Qsb(r){
  var gcd = tbU45s3_gcd, ratio = tbU45s3_ratio, par = tbU45s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Rx = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Rp = (par(R2, R3));
    var R = (Rx + par(R2, R3));
    if (!(R2 != R3 && max(Rx, R2, R3) / min(Rx, R2, R3) <= 10 && abs(R * 10 - Math.round(R * 10)) < 1e-9 && nice(Rp))) continue;
    var ok = (Rx);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s3_three4(ok, [{x: (par(R2, R3)), why: "並列の部分の合成抵抗を答えた（引く前で止めた）", w: 0, cut: 1}, {x: (R), why: "全体の $R$ のまま。並列の部分を引いていない", w: 1, cut: 1}, {x: (R - R2 - R3), why: "並列を足してから引いた", w: 2, cut: 0}, {x: (R - R2), why: "並列をまとめず、$R_1$ だけを引いた", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s3sb", text: "図の回路で、$R_1 = " + qv(R2, "O") + "$、$R_2 = " + qv(R3, "O") + "$ です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s3bL", L: tbU45s3_fig({"src":"{E}"}, [["r2", "{R}_1=" + qf(R2, "O")], ["r3", "{R}_2=" + qf(R3, "O")], ["rx", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分 $\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(Rp, "O") + "$", "$R_x = " + fmt(R) + " - " + fmt(Rp) + " = " + qv(ok, "O") + "$"], chk: {form: "u45s3sb", p: {R2: R2, R3: R3, R10: Math.round(R * 10)}}};
  }
  throw new Error("u45s3sb：条件に合う数字が見つからない");
}
// 45-4 二次方程式で2つの抵抗 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s4_par(a, b){ return a * b / (a + b); }
function tbU45s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s4_Qbig(r){
  var gcd = tbU45s4_gcd, ratio = tbU45s4_ratio, par = tbU45s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var b = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var S = (a + b);
    var Pv = (a * b / (a + b));
    var Pr = (a * b);
    var Big = (max(a, b));
    var Sm = (min(a, b));
    if (!(a != b && max(a, b) / min(a, b) <= 10 && a + b <= 200 && abs(Pv * 10 - Math.round(Pv * 10)) < 1e-9)) continue;
    var ok = (max(a, b));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s4_three4(ok, [{x: (a * b), why: "積で止めた（二次方程式を解いていない）", w: 0, cut: 1}, {x: (a + b), why: "直列の値のまま（並列の式を使っていない）", w: 1, cut: 1}, {x: (min(a, b)), why: "小さい方を答えた", w: 2, cut: 0}, {x: ((a + b) / 2), why: "2つが等しいとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s4big", text: "2つの抵抗 $R_a$・$R_b$ を直列にすると $" + qv(S, "O") + "$、並列にすると $" + qv(Pv, "O") + "$ になります。大きい方の抵抗は何 Ω ですか。", fig: {kind: "u45s4sp", L: tbU45s4_fig({}, [["ra", "{R}_a"], ["rb", "{R}_b"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["和 $R_a + R_b = " + fmt(S) + "$、積 $R_a R_b = " + fmt(Pv) + " \\times " + fmt(S) + " = " + fmt(Pr) + "$", "$R_a^2 - " + fmt(S) + " R_a + " + fmt(Pr) + " = 0$ → $(R_a - " + fmt(Sm) + ")(R_a - " + fmt(Big) + ") = 0$", "大きい方 $" + qv(ok, "O") + "$"], chk: {form: "u45s4big", p: {S: a + b, P10: Math.round(a * b / (a + b) * 10)}}};
  }
  throw new Error("u45s4big：条件に合う数字が見つからない");
}
function tbU45s4_Qsmall(r){
  var gcd = tbU45s4_gcd, ratio = tbU45s4_ratio, par = tbU45s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var b = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,60]);
    var S = (a + b);
    var Pv = (a * b / (a + b));
    var Pr = (a * b);
    var Big = (max(a, b));
    var Sm = (min(a, b));
    if (!(a != b && max(a, b) / min(a, b) <= 10 && a + b <= 200 && abs(Pv * 10 - Math.round(Pv * 10)) < 1e-9)) continue;
    var ok = (min(a, b));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s4_three4(ok, [{x: (a * b), why: "積で止めた（二次方程式を解いていない）", w: 0, cut: 1}, {x: (a + b), why: "直列の値のまま（並列の式を使っていない）", w: 1, cut: 1}, {x: (max(a, b)), why: "大きい方を答えた", w: 2, cut: 0}, {x: ((a + b) / 2), why: "2つが等しいとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s4small", text: "2つの抵抗 $R_a$・$R_b$ を直列にすると $" + qv(S, "O") + "$、並列にすると $" + qv(Pv, "O") + "$ になります。小さい方の抵抗は何 Ω ですか。", fig: {kind: "u45s4sp", L: tbU45s4_fig({}, [["ra", "{R}_a"], ["rb", "{R}_b"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["和 $R_a + R_b = " + fmt(S) + "$、積 $R_a R_b = " + fmt(Pv) + " \\times " + fmt(S) + " = " + fmt(Pr) + "$", "$R_a^2 - " + fmt(S) + " R_a + " + fmt(Pr) + " = 0$ → $(R_a - " + fmt(Sm) + ")(R_a - " + fmt(Big) + ") = 0$", "小さい方 $" + qv(ok, "O") + "$"], chk: {form: "u45s4small", p: {S: a + b, P10: Math.round(a * b / (a + b) * 10)}}};
  }
  throw new Error("u45s4small：条件に合う数字が見つからない");
}
function tbU45s4_Qneg(r){
  var gcd = tbU45s4_gcd, ratio = tbU45s4_ratio, par = tbU45s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,16,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,16,20]);
    var x = pick(r, [1,2,3,4,5,6,8,10,12]);
    var R = ((R1 + x) * (R2 + x) / (R1 + R2 + 2 * x));
    var b = (R1 + R2 - 2 * (R1 + x) * (R2 + x) / (R1 + R2 + 2 * x));
    var c = (R1 * R2 - (R1 + x) * (R2 + x) / (R1 + R2 + 2 * x) * (R1 + R2));
    var y = ((R1 * R2 - (R1 + x) * (R2 + x) / (R1 + R2 + 2 * x) * (R1 + R2)) / x);
    var bs = (b > 0 ? '+ ' + b + ' R_x' : (b < 0 ? '- ' + (-b) + ' R_x' : ''));
    if (!(R1 < R2 && abs(R - Math.round(R)) < 1e-9 && abs(y - Math.round(y)) < 1e-9 && y < 0 && -y != x && R1 + x != R2)) continue;
    var ok = (x);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s4_three4(ok, [{x: (R), why: "全体の合成抵抗のまま（式を立てていない）", w: 0, cut: 1}, {x: (-c), why: "式の数の項で止めた（因数分解していない）", w: 1, cut: 1}, {x: (-y), why: "負の答えを正にして選んだ（負の答えは捨てる）", w: 2, cut: 0}, {x: ((R1 + R2) / 2), why: "2つの抵抗の平均をとった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s4neg", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、2つの $R_x$ は同じ値です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s4two", L: tbU45s4_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"], ["rx2", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dfrac{(" + fmt(R1) + " + R_x)(" + fmt(R2) + " + R_x)}{" + fmt(R1) + " + " + fmt(R2) + " + 2R_x} = " + fmt(R) + "$", "$R_x^2 " + String(bs) + " - " + fmt(-c) + " = 0$ → $(R_x - " + fmt(x) + ")(R_x + " + fmt(-y) + ") = 0$", "負の答えは捨てて $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s4neg", p: {R1: R1, R2: R2, R: R}}};
  }
  throw new Error("u45s4neg：条件に合う数字が見つからない");
}
function tbU45s4_QnegL(r){
  var gcd = tbU45s4_gcd, ratio = tbU45s4_ratio, par = tbU45s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,16,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,16,20]);
    var x = pick(r, [1,2,3,4,5,6,8,10,12]);
    var R = ((R1 + x) * (R2 + x) / (R1 + R2 + 2 * x));
    var b = (R1 + R2 - 2 * (R1 + x) * (R2 + x) / (R1 + R2 + 2 * x));
    var c = (R1 * R2 - (R1 + x) * (R2 + x) / (R1 + R2 + 2 * x) * (R1 + R2));
    var y = ((R1 * R2 - (R1 + x) * (R2 + x) / (R1 + R2 + 2 * x) * (R1 + R2)) / x);
    var bs = (b > 0 ? '+ ' + b + ' R_x' : (b < 0 ? '- ' + (-b) + ' R_x' : ''));
    if (!(R1 < R2 && abs(R - Math.round(R)) < 1e-9 && abs(y - Math.round(y)) < 1e-9 && y < 0 && -y != x && R1 + x != R2)) continue;
    var ok = (x);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s4_three4(ok, [{x: (R), why: "全体の合成抵抗のまま（式を立てていない）", w: 0, cut: 1}, {x: (-c), why: "式の数の項で止めた（因数分解していない）", w: 1, cut: 1}, {x: (-y), why: "負の答えを正にして選んだ（負の答えは捨てる）", w: 2, cut: 0}, {x: ((R1 + R2) / 2), why: "2つの抵抗の平均をとった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s4negL", text: "図の回路で、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、2つの $R_x$ は同じ値です。全体の合成抵抗 $R$ は $" + qv(R, "O") + "$ です。$R_x$ は何 Ω ですか。", fig: {kind: "u45s4twoL", L: tbU45s4_fig({}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["rx", "{R}_x"], ["rx2", "{R}_x"], ["rd", "{R}=" + qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dfrac{(" + fmt(R1) + " + R_x)(" + fmt(R2) + " + R_x)}{" + fmt(R1) + " + " + fmt(R2) + " + 2R_x} = " + fmt(R) + "$", "$R_x^2 " + String(bs) + " - " + fmt(-c) + " = 0$ → $(R_x - " + fmt(x) + ")(R_x + " + fmt(-y) + ") = 0$", "負の答えは捨てて $R_x = " + qv(ok, "O") + "$"], chk: {form: "u45s4negL", p: {R1: R1, R2: R2, R: R}}};
  }
  throw new Error("u45s4negL：条件に合う数字が見つからない");
}
// 45-5 ミリとキロ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s5_par(a, b){ return a * b / (a + b); }
function tbU45s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s5_Qv(r){
  var gcd = tbU45s5_gcd, ratio = tbU45s5_ratio, par = tbU45s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Rk = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Im = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Ro = (Rk * 1000);
    var Ia = (Im / 1000);
    if (!(Rk * Im <= 200)) continue;
    var ok = (Rk * Im);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s5_three4(ok, [{x: (Rk * Im * 1000), why: "mA を A に直していない", w: 0, cut: 1}, {x: (Rk * Im / 1000), why: "kΩ を Ω に直していない", w: 1, cut: 1}, {x: (Rk / Im), why: "掛けるところを割った", w: 2, cut: 0}, {x: (Im / Rk), why: "掛けるところを割った（逆）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s5v", text: "図の回路で、抵抗 $R = " + qv(Rk, "kO") + "$ に電流 $I = " + qv(Im, "mA") + "$ が流れています。$R$ にかかる電圧 $V$ は何 V ですか。", fig: {kind: "u45s5lp", L: tbU45s5_fig({}, [["r1", "{R}=" + qf(Rk, "kO")], ["i", "{I}=" + qf(Im, "mA")], ["v1", "{V}"], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R = " + qv(Ro, "O") + "$、$I = " + qv(Ia, "A") + "$", "$V = " + fmt(Ro) + " \\times " + fmt(Ia) + " = " + qv(ok, "V") + "$"], chk: {form: "u45s5v", p: {Rk: Rk, Im: Im}}};
  }
  throw new Error("u45s5v：条件に合う数字が見つからない");
}
function tbU45s5_Qvc(r){
  var gcd = tbU45s5_gcd, ratio = tbU45s5_ratio, par = tbU45s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Rk = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Im = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Ro = (Rk * 1000);
    var Ia = (Im / 1000);
    if (!(Rk * Im <= 200)) continue;
    var ok = (Rk * Im);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s5_three4(ok, [{x: (Rk * Im * 1000), why: "mA を A に直していない", w: 0, cut: 1}, {x: (Rk * Im / 1000), why: "kΩ を Ω に直していない", w: 1, cut: 1}, {x: (Rk / Im), why: "掛けるところを割った", w: 2, cut: 0}, {x: (Im / Rk), why: "掛けるところを割った（逆）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s5vc", text: "図の回路で、抵抗 $R = " + qv(Rk, "kO") + "$ に電流 $I = " + qv(Im, "mA") + "$ が流れています。$R$ にかかる電圧 $V$ は何 V ですか。", fig: {kind: "u45s5col", L: tbU45s5_fig({}, [["r1", "{R}=" + qf(Rk, "kO")], ["i", "{I}=" + qf(Im, "mA")], ["v1", "{V}"], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R = " + qv(Ro, "O") + "$、$I = " + qv(Ia, "A") + "$", "$V = " + fmt(Ro) + " \\times " + fmt(Ia) + " = " + qv(ok, "V") + "$"], chk: {form: "u45s5vc", p: {Rk: Rk, Im: Im}}};
  }
  throw new Error("u45s5vc：条件に合う数字が見つからない");
}
function tbU45s5_Qi(r){
  var gcd = tbU45s5_gcd, ratio = tbU45s5_ratio, par = tbU45s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Rk = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Ro = (Rk * 1000);
    var Ia = (V / (Rk * 1000));
    if (!(abs(V / Rk - Math.round(V / Rk)) < 1e-9 && V / Rk <= 100)) continue;
    var ok = (V / Rk);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s5_three4(ok, [{x: (V / Rk / 1000), why: "A のまま答えた（mA に直していない）", w: 0, cut: 1}, {x: (V / Rk * 1000), why: "kΩ を Ω に直していない", w: 1, cut: 1}, {x: (Rk / V), why: "割る順が逆", w: 2, cut: 0}, {x: (V * Rk), why: "割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "mA", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s5i", text: "図の回路で、抵抗 $R = " + qv(Rk, "kO") + "$ に電圧 $V = " + qv(V, "V") + "$ がかかっています。電流 $I$ は何 mA ですか。", fig: {kind: "u45s5lp", L: tbU45s5_fig({}, [["r1", "{R}=" + qf(Rk, "kO")], ["v1", "{V}=" + qf(V, "V")], ["i", "{I}"], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R = " + qv(Ro, "O") + "$", "$I = \\dfrac{" + fmt(V) + "}{" + fmt(Ro) + "} = " + qv(Ia, "A") + " = " + qv(ok, "mA") + "$"], chk: {form: "u45s5i", p: {V: V, Rk: Rk}}};
  }
  throw new Error("u45s5i：条件に合う数字が見つからない");
}
function tbU45s5_Qr(r){
  var gcd = tbU45s5_gcd, ratio = tbU45s5_ratio, par = tbU45s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Im = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var Ia = (Im / 1000);
    var Ro = (V / Im * 1000);
    if (!(abs(V / Im - Math.round(V / Im)) < 1e-9 && V / Im <= 100)) continue;
    var ok = (V / Im);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s5_three4(ok, [{x: (V / Im / 1000), why: "mA を A に直さずに割った", w: 0, cut: 1}, {x: (V / Im * 1000), why: "Ω のまま答えた（kΩ に直していない）", w: 1, cut: 1}, {x: (Im / V), why: "割る順が逆", w: 2, cut: 0}, {x: (V * Im), why: "割るところを掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "kO", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s5r", text: "図の回路で、抵抗 $R$ に電圧 $V = " + qv(V, "V") + "$ がかかり、電流 $I = " + qv(Im, "mA") + "$ が流れています。$R$ は何 kΩ ですか。", fig: {kind: "u45s5lp", L: tbU45s5_fig({}, [["r1", "{R}"], ["v1", "{V}=" + qf(V, "V")], ["i", "{I}=" + qf(Im, "mA")], ["src", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I = " + qv(Ia, "A") + "$", "$R = \\dfrac{" + fmt(V) + "}{" + fmt(Ia) + "} = " + qv(Ro, "O") + " = " + qv(ok, "kO") + "$"], chk: {form: "u45s5r", p: {V: V, Im: Im}}};
  }
  throw new Error("u45s5r：条件に合う数字が見つからない");
}
// 45-6 オームから電流の和 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s6_par(a, b){ return a * b / (a + b); }
function tbU45s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s6_Qsum(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = (E / R1);
    var I2 = (E / R2);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E / R1 + E / R2 <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && abs(E / R2 * 10 - Math.round(E / R2 * 10)) < 1e-9)) continue;
    var ok = (E / R1 + E / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / R1), why: "$R_1$ の電流で止めた（和をとっていない）", w: 0, cut: 1}, {x: (E / R2), why: "$R_2$ の電流で止めた（和をとっていない）", w: 1, cut: 1}, {x: (E / (R1 + R2)), why: "抵抗を足して割った（並列を直列と見た）", w: 2, cut: 0}, {x: (abs(E / R1 - E / R2)), why: "2つの電流の差をとった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6sum", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s6lp", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["i", "{I}"], ["i1", "{I}_1"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$、$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "並列なので電源の電流は和 $I = " + fmt(I1) + " + " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s6sum", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s6sum：条件に合う数字が見つからない");
}
function tbU45s6_Qsumc(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = (E / R1);
    var I2 = (E / R2);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E / R1 + E / R2 <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && abs(E / R2 * 10 - Math.round(E / R2 * 10)) < 1e-9)) continue;
    var ok = (E / R1 + E / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / R1), why: "$R_1$ の電流で止めた（和をとっていない）", w: 0, cut: 1}, {x: (E / R2), why: "$R_2$ の電流で止めた（和をとっていない）", w: 1, cut: 1}, {x: (E / (R1 + R2)), why: "抵抗を足して割った（並列を直列と見た）", w: 2, cut: 0}, {x: (abs(E / R1 - E / R2)), why: "2つの電流の差をとった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6sumc", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s6col", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["i", "{I}"], ["i1", "{I}_1"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$、$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "並列なので電源の電流は和 $I = " + fmt(I1) + " + " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s6sumc", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s6sumc：条件に合う数字が見つからない");
}
function tbU45s6_Qsub(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I1 = (E / R1);
    var I2 = (I - E / R1);
    if (!(I - E / R1 > 0 && I / 2 != I - E / R1 && I <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && E / (I - E / R1) <= 200)) continue;
    var ok = (I - E / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / R1), why: "$R_1$ の電流で止めた（引いていない）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま（$R_1$ の分を引いていない）", w: 1, cut: 1}, {x: (I + E / R1), why: "引くところを足した", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれるとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6sub", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ に流れる電流は何 A ですか。", fig: {kind: "u45s6lp", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2"], ["i", "{I}=" + qf(I, "A")], ["i1", "{I}_1"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$", "$I_2 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s6sub", p: {E: E, R1: R1, I: I}}};
  }
  throw new Error("u45s6sub：条件に合う数字が見つからない");
}
function tbU45s6_Qsubc(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I1 = (E / R1);
    var I2 = (I - E / R1);
    if (!(I - E / R1 > 0 && I / 2 != I - E / R1 && I <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && E / (I - E / R1) <= 200)) continue;
    var ok = (I - E / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / R1), why: "$R_1$ の電流で止めた（引いていない）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま（$R_1$ の分を引いていない）", w: 1, cut: 1}, {x: (I + E / R1), why: "引くところを足した", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれるとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6subc", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ に流れる電流は何 A ですか。", fig: {kind: "u45s6col", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2"], ["i", "{I}=" + qf(I, "A")], ["i1", "{I}_1"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$", "$I_2 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s6subc", p: {E: E, R1: R1, I: I}}};
  }
  throw new Error("u45s6subc：条件に合う数字が見つからない");
}
function tbU45s6_Qr2(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I1 = (E / R1);
    var I2 = (I - E / R1);
    if (!(I - E / R1 > 0 && I <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && abs(E / (I - E / R1) - Math.round(E / (I - E / R1))) < 1e-9 && E / (I - E / R1) != R1 && max(R1, E / (I - E / R1)) / min(R1, E / (I - E / R1)) <= 10)) continue;
    var ok = (E / (I - E / R1));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / I), why: "全体の電流で割った（並列の合成抵抗を出した）", w: 0, cut: 1}, {x: (I - E / R1), why: "$I_2$ の値で止めた（オームの法則に入れていない）", w: 1, cut: 1}, {x: (E / I - R1), why: "直列と見て引いた", w: 2, cut: 0}, {x: (E / (I + E / R1)), why: "引くところを足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6r2", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ は何 Ω ですか。", fig: {kind: "u45s6lp", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2"], ["i", "{I}=" + qf(I, "A")], ["i1", "{I}_1"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$、$I_2 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(I2, "A") + "$", "$R_2 = \\dfrac{" + fmt(E) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s6r2", p: {E: E, R1: R1, I: I}}};
  }
  throw new Error("u45s6r2：条件に合う数字が見つからない");
}
function tbU45s6_Qr2c(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I1 = (E / R1);
    var I2 = (I - E / R1);
    if (!(I - E / R1 > 0 && I <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && abs(E / (I - E / R1) - Math.round(E / (I - E / R1))) < 1e-9 && E / (I - E / R1) != R1 && max(R1, E / (I - E / R1)) / min(R1, E / (I - E / R1)) <= 10)) continue;
    var ok = (E / (I - E / R1));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / I), why: "全体の電流で割った（並列の合成抵抗を出した）", w: 0, cut: 1}, {x: (I - E / R1), why: "$I_2$ の値で止めた（オームの法則に入れていない）", w: 1, cut: 1}, {x: (E / I - R1), why: "直列と見て引いた", w: 2, cut: 0}, {x: (E / (I + E / R1)), why: "引くところを足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6r2c", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ は何 Ω ですか。", fig: {kind: "u45s6col", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2"], ["i", "{I}=" + qf(I, "A")], ["i1", "{I}_1"], ["i2", "{I}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$、$I_2 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(I2, "A") + "$", "$R_2 = \\dfrac{" + fmt(E) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s6r2c", p: {E: E, R1: R1, I: I}}};
  }
  throw new Error("u45s6r2c：条件に合う数字が見つからない");
}
function tbU45s6_Qsums(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = (E / R1);
    var I2 = (E / R2);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E / R1 + E / R2 <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && abs(E / R2 * 10 - Math.round(E / R2 * 10)) < 1e-9)) continue;
    var ok = (E / R1 + E / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / R1), why: "$R_2$ の電流で止めた（和をとっていない）", w: 0, cut: 1}, {x: (E / R2), why: "$R_1$ の電流で止めた（和をとっていない）", w: 1, cut: 1}, {x: (E / (R1 + R2)), why: "抵抗を足して割った（並列を直列と見た）", w: 2, cut: 0}, {x: (abs(E / R1 - E / R2)), why: "2つの電流の差をとった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6sums", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(R1, "O") + "$、$R_1 = " + qv(R2, "O") + "$ です。電源から流れる電流 $I$ は何 A ですか。", fig: {kind: "u45s6lp", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_2=" + qf(R1, "O")], ["r2", "{R}_1=" + qf(R2, "O")], ["i", "{I}"], ["i1", "{I}_2"], ["i2", "{I}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$、$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R2) + "} = " + qv(I2, "A") + "$", "並列なので電源の電流は和 $I = " + fmt(I1) + " + " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s6sums", p: {E: E, R1: R1, R2: R2}}};
  }
  throw new Error("u45s6sums：条件に合う数字が見つからない");
}
function tbU45s6_Qsubs(r){
  var gcd = tbU45s6_gcd, ratio = tbU45s6_ratio, par = tbU45s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var I1 = (E / R1);
    var I2 = (I - E / R1);
    if (!(I - E / R1 > 0 && I / 2 != I - E / R1 && I <= 20 && abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9 && E / (I - E / R1) <= 200)) continue;
    var ok = (I - E / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s6_three4(ok, [{x: (E / R1), why: "$R_2$ の電流で止めた（引いていない）", w: 0, cut: 1}, {x: (I), why: "全体の電流のまま（$R_2$ の分を引いていない）", w: 1, cut: 1}, {x: (I + E / R1), why: "引くところを足した", w: 2, cut: 0}, {x: (I / 2), why: "等しく分かれるとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s6subs", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(R1, "O") + "$ です。電源から流れる電流 $I$ は $" + qv(I, "A") + "$ です。$R_1$ に流れる電流は何 A ですか。", fig: {kind: "u45s6col", L: tbU45s6_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_2=" + qf(R1, "O")], ["r2", "{R}_1"], ["i", "{I}=" + qf(I, "A")], ["i1", "{I}_2"], ["i2", "{I}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(I1, "A") + "$", "$I_1 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(ok, "A") + "$"], chk: {form: "u45s6subs", p: {E: E, R1: R1, I: I}}};
  }
  throw new Error("u45s6subs：条件に合う数字が見つからない");
}
// 45-7 電圧の引き算からオーム の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s7_par(a, b){ return a * b / (a + b); }
function tbU45s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s7_Qi1(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var Ro = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / Ro <= 20 && abs((E - Vk) / Ro * 10 - Math.round((E - Vk) / Ro * 10)) < 1e-9)) continue;
    var ok = ((E - Vk) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / Ro), why: "引かずに電源の電圧で割った", w: 0, cut: 1}, {x: (Vk / Ro), why: "$R_1$ の電圧を $R_2$ に使った", w: 1, cut: 1}, {x: ((E + Vk) / Ro), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_2$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7i1", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(Ro, "O") + "$ です。$R_1$ にかかる電圧は $" + qv(Vk, "V") + "$ です。回路の電流 $I$ は何 A ですか。", fig: {kind: "u45s7lp", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["v1", "{V}_1=" + qf(Vk, "V")], ["v2", "{V}_2"], ["r2", "{R}_2=" + qf(Ro, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_2 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$I = \\dfrac{" + fmt(Vo) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s7i1", p: {E: E, Vk: Vk, Ro: Ro}}};
  }
  throw new Error("u45s7i1：条件に合う数字が見つからない");
}
function tbU45s7_Qi2(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var Ro = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / Ro <= 20 && abs((E - Vk) / Ro * 10 - Math.round((E - Vk) / Ro * 10)) < 1e-9)) continue;
    var ok = ((E - Vk) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / Ro), why: "引かずに電源の電圧で割った", w: 0, cut: 1}, {x: (Vk / Ro), why: "$R_2$ の電圧を $R_1$ に使った", w: 1, cut: 1}, {x: ((E + Vk) / Ro), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_1$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7i2", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(Ro, "O") + "$ です。$R_2$ にかかる電圧は $" + qv(Vk, "V") + "$ です。回路の電流 $I$ は何 A ですか。", fig: {kind: "u45s7lp", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r2", "{R}_2"], ["v2", "{V}_2=" + qf(Vk, "V")], ["v1", "{V}_1"], ["r1", "{R}_1=" + qf(Ro, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_1 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$I = \\dfrac{" + fmt(Vo) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s7i2", p: {E: E, Vk: Vk, Ro: Ro}}};
  }
  throw new Error("u45s7i2：条件に合う数字が見つからない");
}
function tbU45s7_Qi1c(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var Ro = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / Ro <= 20 && abs((E - Vk) / Ro * 10 - Math.round((E - Vk) / Ro * 10)) < 1e-9)) continue;
    var ok = ((E - Vk) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / Ro), why: "引かずに電源の電圧で割った", w: 0, cut: 1}, {x: (Vk / Ro), why: "$R_1$ の電圧を $R_2$ に使った", w: 1, cut: 1}, {x: ((E + Vk) / Ro), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_2$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7i1c", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_2 = " + qv(Ro, "O") + "$ です。$R_1$ にかかる電圧は $" + qv(Vk, "V") + "$ です。回路の電流 $I$ は何 A ですか。", fig: {kind: "u45s7col", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["v1", "{V}_1=" + qf(Vk, "V")], ["v2", "{V}_2"], ["r2", "{R}_2=" + qf(Ro, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_2 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$I = \\dfrac{" + fmt(Vo) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s7i1c", p: {E: E, Vk: Vk, Ro: Ro}}};
  }
  throw new Error("u45s7i1c：条件に合う数字が見つからない");
}
function tbU45s7_Qi2c(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var Ro = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / Ro <= 20 && abs((E - Vk) / Ro * 10 - Math.round((E - Vk) / Ro * 10)) < 1e-9)) continue;
    var ok = ((E - Vk) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / Ro), why: "引かずに電源の電圧で割った", w: 0, cut: 1}, {x: (Vk / Ro), why: "$R_2$ の電圧を $R_1$ に使った", w: 1, cut: 1}, {x: ((E + Vk) / Ro), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_1$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7i2c", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(Ro, "O") + "$ です。$R_2$ にかかる電圧は $" + qv(Vk, "V") + "$ です。回路の電流 $I$ は何 A ですか。", fig: {kind: "u45s7col", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r2", "{R}_2"], ["v2", "{V}_2=" + qf(Vk, "V")], ["v1", "{V}_1"], ["r1", "{R}_1=" + qf(Ro, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_1 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$I = \\dfrac{" + fmt(Vo) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s7i2c", p: {E: E, Vk: Vk, Ro: Ro}}};
  }
  throw new Error("u45s7i2c：条件に合う数字が見つからない");
}
function tbU45s7_Qr1(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / I <= 100 && abs((E - Vk) / I - Math.round((E - Vk) / I)) < 1e-9 && (E - Vk) / I >= 1)) continue;
    var ok = ((E - Vk) / I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / I), why: "引かずに電源の電圧で割った（全体の合成抵抗）", w: 0, cut: 1}, {x: (Vk / I), why: "$R_1$ の電圧で割った（$R_1$ を出した）", w: 1, cut: 1}, {x: ((E + Vk) / I), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_2$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7r1", text: "図の回路で、$E = " + qv(E, "V") + "$、回路の電流 $I$ は $" + qv(I, "A") + "$ です。$R_1$ にかかる電圧は $" + qv(Vk, "V") + "$ です。$R_2$ は何 Ω ですか。", fig: {kind: "u45s7lp", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1"], ["v1", "{V}_1=" + qf(Vk, "V")], ["v2", "{V}_2"], ["r2", "{R}_2"], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_2 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$R_2 = \\dfrac{" + fmt(Vo) + "}{" + fmt(I) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s7r1", p: {E: E, Vk: Vk, I: I}}};
  }
  throw new Error("u45s7r1：条件に合う数字が見つからない");
}
function tbU45s7_Qr2c(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / I <= 100 && abs((E - Vk) / I - Math.round((E - Vk) / I)) < 1e-9 && (E - Vk) / I >= 1)) continue;
    var ok = ((E - Vk) / I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / I), why: "引かずに電源の電圧で割った（全体の合成抵抗）", w: 0, cut: 1}, {x: (Vk / I), why: "$R_2$ の電圧で割った（$R_2$ を出した）", w: 1, cut: 1}, {x: ((E + Vk) / I), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_1$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7r2c", text: "図の回路で、$E = " + qv(E, "V") + "$、回路の電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ にかかる電圧は $" + qv(Vk, "V") + "$ です。$R_1$ は何 Ω ですか。", fig: {kind: "u45s7col", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r2", "{R}_2"], ["v2", "{V}_2=" + qf(Vk, "V")], ["v1", "{V}_1"], ["r1", "{R}_1"], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_1 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$R_1 = \\dfrac{" + fmt(Vo) + "}{" + fmt(I) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s7r2c", p: {E: E, Vk: Vk, I: I}}};
  }
  throw new Error("u45s7r2c：条件に合う数字が見つからない");
}
function tbU45s7_Qi1s(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var Ro = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / Ro <= 20 && abs((E - Vk) / Ro * 10 - Math.round((E - Vk) / Ro * 10)) < 1e-9)) continue;
    var ok = ((E - Vk) / Ro);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / Ro), why: "引かずに電源の電圧で割った", w: 0, cut: 1}, {x: (Vk / Ro), why: "$R_2$ の電圧を $R_1$ に使った", w: 1, cut: 1}, {x: ((E + Vk) / Ro), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_1$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7i1s", text: "図の回路で、$E = " + qv(E, "V") + "$、$R_1 = " + qv(Ro, "O") + "$ です。$R_2$ にかかる電圧は $" + qv(Vk, "V") + "$ です。回路の電流 $I$ は何 A ですか。", fig: {kind: "u45s7lp", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_2"], ["v1", "{V}_2=" + qf(Vk, "V")], ["v2", "{V}_1"], ["r2", "{R}_1=" + qf(Ro, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_1 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$I = \\dfrac{" + fmt(Vo) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s7i1s", p: {E: E, Vk: Vk, Ro: Ro}}};
  }
  throw new Error("u45s7i1s：条件に合う数字が見つからない");
}
function tbU45s7_Qr1s(r){
  var gcd = tbU45s7_gcd, ratio = tbU45s7_ratio, par = tbU45s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var Vk = pick(r, [2,3,4,5,6,8,10,12,15,18,20,24,30,36,40,45,48,50,60,80]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var Vo = (E - Vk);
    if (!(Vk < E && Vk != E - Vk && (E - Vk) / I <= 100 && abs((E - Vk) / I - Math.round((E - Vk) / I)) < 1e-9 && (E - Vk) / I >= 1)) continue;
    var ok = ((E - Vk) / I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s7_three4(ok, [{x: (E / I), why: "引かずに電源の電圧で割った（全体の合成抵抗）", w: 0, cut: 1}, {x: (Vk / I), why: "$R_2$ の電圧で割った（$R_2$ を出した）", w: 1, cut: 1}, {x: ((E + Vk) / I), why: "引くところを足した", w: 2, cut: 0}, {x: (E - Vk), why: "$R_1$ の電圧で止めた（オームの法則に入れていない）", w: 3, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s7r1s", text: "図の回路で、$E = " + qv(E, "V") + "$、回路の電流 $I$ は $" + qv(I, "A") + "$ です。$R_2$ にかかる電圧は $" + qv(Vk, "V") + "$ です。$R_1$ は何 Ω ですか。", fig: {kind: "u45s7col", L: tbU45s7_fig({}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_2"], ["v1", "{V}_2=" + qf(Vk, "V")], ["v2", "{V}_1"], ["r2", "{R}_1"], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $V_1 = " + fmt(E) + " - " + fmt(Vk) + " = " + qv(Vo, "V") + "$", "$R_1 = \\dfrac{" + fmt(Vo) + "}{" + fmt(I) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s7r1s", p: {E: E, Vk: Vk, I: I}}};
  }
  throw new Error("u45s7r1s：条件に合う数字が見つからない");
}
// 45-8 合成から電源の電圧を出す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s8.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s8_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s8_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s8_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s8_par(a, b){ return a * b / (a + b); }
function tbU45s8_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s8_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s8_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s8_Qea(r){
  var gcd = tbU45s8_gcd, ratio = tbU45s8_ratio, par = tbU45s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var p = (par(R2, R3));
    var E = (I * (R1 + p));
    if (!(R2 != R3 && Math.abs(p - Math.round(p)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E <= 200 && Math.abs(E * 10 - Math.round(E * 10)) < 1e-9)) continue;
    var ok = (I * (R1 + p));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s8_three4(ok, [{x: (I * p), why: "直列の $R_1$ を足していない", w: 0, cut: 1}, {x: (I * R1), why: "$R_1$ にかかる電圧で止めた", w: 1, cut: 1}, {x: (I * (R1 + R2 + R3)), why: "並列の部分を和分の積でまとめずに足した", w: 2, cut: 0}, {x: ((R1 + p) / I), why: "電流で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s8ea", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と、$R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列を直列につないだ。電源から流れる電流は $I = " + qv(I, "A") + "$ でした。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u45s8a", L: tbU45s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列をまとめる　$R_{23} = \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(p, "O") + "$", "全体の合成抵抗　$" + fmt(R1) + " + " + fmt(p) + " = " + qv(R1 + p, "O") + "$", "電流を掛ける　$E = " + fmt(R1 + p) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u45s8ea", p: {I: I, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s8ea：条件に合う数字が見つからない");
}
function tbU45s8_Qeb(r){
  var gcd = tbU45s8_gcd, ratio = tbU45s8_ratio, par = tbU45s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var p = (par(R2, R3));
    var E = (I * (R1 + p));
    if (!(R2 != R3 && Math.abs(p - Math.round(p)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E <= 200 && Math.abs(E * 10 - Math.round(E * 10)) < 1e-9)) continue;
    var ok = (I * (R1 + p));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s8_three4(ok, [{x: (I * p), why: "直列の $R_1$ を足していない", w: 0, cut: 1}, {x: (I * R1), why: "$R_1$ にかかる電圧で止めた", w: 1, cut: 1}, {x: (I * (R1 + R2 + R3)), why: "並列の部分を和分の積でまとめずに足した", w: 2, cut: 0}, {x: ((R1 + p) / I), why: "電流で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s8eb", text: "図のように、$R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列と、$R_1 = " + qv(R1, "O") + "$ を直列につないだ。電源から流れる電流は $I = " + qv(I, "A") + "$ でした。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u45s8b", L: tbU45s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列をまとめる　$R_{23} = \\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(p, "O") + "$", "全体の合成抵抗　$" + fmt(p) + " + " + fmt(R1) + " = " + qv(R1 + p, "O") + "$", "電流を掛ける　$E = " + fmt(R1 + p) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u45s8eb", p: {I: I, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s8eb：条件に合う数字が見つからない");
}
function tbU45s8_Qec(r){
  var gcd = tbU45s8_gcd, ratio = tbU45s8_ratio, par = tbU45s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var p = (par(R1, R2));
    var E = (I * (R3 + p));
    if (!(R1 != R2 && Math.abs(p - Math.round(p)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E <= 200 && Math.abs(E * 10 - Math.round(E * 10)) < 1e-9)) continue;
    var ok = (I * (R3 + p));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s8_three4(ok, [{x: (I * p), why: "直列の $R_3$ を足していない", w: 0, cut: 1}, {x: (I * R3), why: "$R_3$ にかかる電圧で止めた", w: 1, cut: 1}, {x: (I * (R1 + R2 + R3)), why: "並列の部分を和分の積でまとめずに足した", w: 2, cut: 0}, {x: ((R3 + p) / I), why: "電流で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s8ec", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ の並列と、$R_3 = " + qv(R3, "O") + "$ を直列につないだ。電源から流れる電流は $I = " + qv(I, "A") + "$ でした。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u45s8c", L: tbU45s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列をまとめる　$R_{12} = \\dfrac{" + fmt(R1) + " \\times " + fmt(R2) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(p, "O") + "$", "全体の合成抵抗　$" + fmt(p) + " + " + fmt(R3) + " = " + qv(R3 + p, "O") + "$", "電流を掛ける　$E = " + fmt(R3 + p) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u45s8ec", p: {I: I, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s8ec：条件に合う数字が見つからない");
}
function tbU45s8_Qed(r){
  var gcd = tbU45s8_gcd, ratio = tbU45s8_ratio, par = tbU45s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I * (R1 + R2));
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E <= 200 && Math.abs(E * 10 - Math.round(E * 10)) < 1e-9)) continue;
    var ok = (I * (R1 + R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s8_three4(ok, [{x: (I * R2), why: "直列の $R_1$ を足していない", w: 0, cut: 1}, {x: (I * R1), why: "$R_1$ にかかる電圧で止めた", w: 1, cut: 1}, {x: (I * par(R1, R2)), why: "直列を和分の積でまとめた", w: 2, cut: 0}, {x: ((R1 + R2) / I), why: "電流で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s8ed", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列につないだ。電源から流れる電流は $I = " + qv(I, "A") + "$ でした。電源の電圧 $E$ は何 V ですか。", fig: {kind: "u45s8d", L: tbU45s8_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["i", "{I}=" + qf(I, "A")], ["r3", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["全体の合成抵抗　$" + fmt(R1) + " + " + fmt(R2) + " = " + qv(R1 + R2, "O") + "$", "電流を掛ける　$E = " + fmt(R1 + R2) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"], chk: {form: "u45s8ed", p: {I: I, R1: R1, R2: R2}}};
  }
  throw new Error("u45s8ed：条件に合う数字が見つからない");
}
// 45-9 電源の電圧を次の図へ持ち越す の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s9.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s9_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s9_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s9_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s9_par(a, b){ return a * b / (a + b); }
function tbU45s9_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s9_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s9_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s9_Qrep(r){
  var gcd = tbU45s9_gcd, ratio = tbU45s9_ratio, par = tbU45s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I1 * (R1 + R2));
    var I2 = (E / (R1 + R3));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && I2 <= 20 && Math.abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9)) continue;
    var ok = (E / (R1 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s9_three4(ok, [{x: (I1), why: "図1の電流のまま。電源の電圧を図2へ持っていっていない", w: 0, cut: 1}, {x: (I1 * R2 / (R1 + R3)), why: "図1で $R_2$ にかかっていた電圧を図2でも使った", w: 1, cut: 1}, {x: (E / R3), why: "図2で $R_1$ を足していない", w: 2, cut: 0}, {x: (I1 * (R1 + R3) / (R1 + R2)), why: "抵抗の比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s9rep", text: "図1のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につなぐと、電流 $I_1 = " + qv(I1, "A") + "$ が流れました。図2のように、同じ電源で $R_2$ を $R_3 = " + qv(R3, "O") + "$ に替えました。図2の電流 $I_2$ は何 A ですか。", fig: {kind: "u45s9rep", L: tbU45s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i1", "{I}_1=" + qf(I1, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R2) + ") \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2へ持っていく　$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s9rep", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s9rep：条件に合う数字が見つからない");
}
function tbU45s9_Qrepb(r){
  var gcd = tbU45s9_gcd, ratio = tbU45s9_ratio, par = tbU45s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I1 * (R1 + R2));
    var I2 = (E / (R3 + R2));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && I2 <= 20 && Math.abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9)) continue;
    var ok = (E / (R3 + R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s9_three4(ok, [{x: (I1), why: "図1の電流のまま。電源の電圧を図2へ持っていっていない", w: 0, cut: 1}, {x: (I1 * R1 / (R3 + R2)), why: "図1で $R_1$ にかかっていた電圧を図2でも使った", w: 1, cut: 1}, {x: (E / R3), why: "図2で $R_2$ を足していない", w: 2, cut: 0}, {x: (I1 * (R3 + R2) / (R1 + R2)), why: "抵抗の比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s9repb", text: "図1のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につなぐと、電流 $I_1 = " + qv(I1, "A") + "$ が流れました。図2のように、同じ電源で $R_1$ を $R_3 = " + qv(R3, "O") + "$ に替えました。図2の電流 $I_2$ は何 A ですか。", fig: {kind: "u45s9repb", L: tbU45s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i1", "{I}_1=" + qf(I1, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R2) + ") \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2へ持っていく　$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R3) + " + " + fmt(R2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s9repb", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s9repb：条件に合う数字が見つからない");
}
function tbU45s9_Qadd(r){
  var gcd = tbU45s9_gcd, ratio = tbU45s9_ratio, par = tbU45s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I1 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I1 * (R1 + R2));
    var I2 = (E / (R1 + R2 + R3));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && Math.abs(I2 * 10 - Math.round(I2 * 10)) < 1e-9)) continue;
    var ok = (E / (R1 + R2 + R3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s9_three4(ok, [{x: (I1), why: "図1の電流のまま。電源の電圧を図2へ持っていっていない", w: 0, cut: 1}, {x: (I1 * R2 / (R1 + R2 + R3)), why: "図1で $R_2$ にかかっていた電圧を電源の電圧として使った", w: 1, cut: 1}, {x: (E / R3), why: "図2の電流を、足した $R_3$ だけで出した", w: 2, cut: 0}, {x: (E / (R1 + R3)), why: "図2で $R_2$ を足していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s9add", text: "図1のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につなぐと、電流 $I_1 = " + qv(I1, "A") + "$ が流れました。図2のように、同じ電源で $R_3 = " + qv(R3, "O") + "$ を直列に足しました。図2の電流 $I_2$ は何 A ですか。", fig: {kind: "u45s9add", L: tbU45s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i1", "{I}_1=" + qf(I1, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R2) + ") \\times " + fmt(I1) + " = " + qv(E, "V") + "$", "図2へ持っていく　$I_2 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s9add", p: {I1: I1, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s9add：条件に合う数字が見つからない");
}
function tbU45s9_Qinv(r){
  var gcd = tbU45s9_gcd, ratio = tbU45s9_ratio, par = tbU45s9_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var I2 = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var E = (I2 * (R1 + R3));
    var I1 = (E / (R1 + R2));
    if (!(R1 != R2 && R2 != R3 && R1 != R3 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E == Math.round(E) && E <= 200 && I1 <= 20 && Math.abs(I1 * 10 - Math.round(I1 * 10)) < 1e-9)) continue;
    var ok = (E / (R1 + R2));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s9_three4(ok, [{x: (I2), why: "図2の電流のまま。電源の電圧を図1へ持っていっていない", w: 0, cut: 1}, {x: (I2 * R3 / (R1 + R2)), why: "図2で $R_3$ にかかっていた電圧を図1でも使った", w: 1, cut: 1}, {x: (E / R2), why: "図1で $R_1$ を足していない", w: 2, cut: 0}, {x: (I2 * (R1 + R2) / (R1 + R3)), why: "抵抗の比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s9inv", text: "図1の回路の $R_2$ を、図2のように $R_3 = " + qv(R3, "O") + "$ に替えると、電流 $I_2 = " + qv(I2, "A") + "$ が流れました（同じ電源）。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ です。図1の電流 $I_1$ は何 A ですか。", fig: {kind: "u45s9rep", L: tbU45s9_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["i2", "{I}_2=" + qf(I2, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図2で電源の電圧を出す　$E = (" + fmt(R1) + " + " + fmt(R3) + ") \\times " + fmt(I2) + " = " + qv(E, "V") + "$", "図1へ持っていく　$I_1 = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s9inv", p: {I2: I2, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s9inv：条件に合う数字が見つからない");
}
// 45-10 短絡を見抜いて合成する の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s10.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s10_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s10_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s10_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s10_par(a, b){ return a * b / (a + b); }
function tbU45s10_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s10_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s10_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s10_Qrp(r){
  var gcd = tbU45s10_gcd, ratio = tbU45s10_ratio, par = tbU45s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var p = (par(R2, R3));
    if (!(R2 != R3 && R1 != R2 && R1 != R3 && Math.abs(p * 10 - Math.round(p * 10)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10)) continue;
    var ok = (R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s10_three4(ok, [{x: (R1 + p), why: "短絡を見ずに、並列の部分も合成した", w: 0, cut: 1}, {x: (p), why: "並列の部分の値だけを答えた（$R_1$ を飛ばした）", w: 1, cut: 1}, {x: (R1 + R2), why: "$R_3$ だけを消して $R_2$ を残した", w: 2, cut: 0}, {x: (R1 + R2 + R3), why: "並列の部分を足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s10rp", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と、$R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列を直列につなぎ、$R_3$ の両端を導線でつないだ。全体の合成抵抗は何 Ω ですか。", fig: {kind: "u45s10p", L: tbU45s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["導線の両端は同じ電位　並列の部分は 0 Ω", "残るのは $R_1$ だけ　$" + qv(ok, "O") + "$"], chk: {form: "u45s10rp", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s10rp：条件に合う数字が見つからない");
}
function tbU45s10_Qip(r){
  var gcd = tbU45s10_gcd, ratio = tbU45s10_ratio, par = tbU45s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var p = (par(R2, R3));
    if (!(R2 != R3 && R1 != R2 && R1 != R3 && Math.abs(p * 10 - Math.round(p * 10)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && E / R1 <= 20 && Math.abs(E / R1 * 10 - Math.round(E / R1 * 10)) < 1e-9)) continue;
    var ok = (E / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s10_three4(ok, [{x: (E / (R1 + p)), why: "短絡を見ずに、並列の部分も合成した", w: 0, cut: 1}, {x: (E / p), why: "並列の部分だけで割った（$R_1$ を飛ばした）", w: 1, cut: 1}, {x: (E / (R1 + R2)), why: "$R_3$ だけを消して $R_2$ を残した", w: 2, cut: 0}, {x: (E / (R1 + R2 + R3)), why: "並列の部分を足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s10ip", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と、$R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列を直列につなぎ、$R_3$ の両端を導線でつないだ。電源の電圧は $E = " + qv(E, "V") + "$ です。電源から流れる電流は何 A ですか。", fig: {kind: "u45s10p", L: tbU45s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列の部分は短絡で 0 Ω　全体の合成抵抗は $" + qv(R1, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s10ip", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s10ip：条件に合う数字が見つからない");
}
function tbU45s10_Qrs(r){
  var gcd = tbU45s10_gcd, ratio = tbU45s10_ratio, par = tbU45s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var p = (par(R2, R3));
    if (!(R2 != R3 && R1 != R2 && R1 != R3 && Math.abs(p * 10 - Math.round(p * 10)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10)) continue;
    var ok = (p);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s10_three4(ok, [{x: (R1 + p), why: "短絡を見ずに、$R_1$ も足した", w: 0, cut: 1}, {x: (R2), why: "並列の $R_3$ を落とした（並列をまとめていない）", w: 1, cut: 1}, {x: (R2 + R3), why: "並列の部分を足した", w: 2, cut: 0}, {x: (R1), why: "短絡した $R_1$ の値を答えた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s10rs", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と、$R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列を直列につなぎ、$R_1$ の両端を導線でつないだ。全体の合成抵抗は何 Ω ですか。", fig: {kind: "u45s10s", L: tbU45s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_1$ は短絡で 0 Ω", "残るのは並列の部分　$\\dfrac{" + fmt(R2) + " \\times " + fmt(R3) + "}{" + fmt(R2) + " + " + fmt(R3) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s10rs", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s10rs：条件に合う数字が見つからない");
}
function tbU45s10_Qis(r){
  var gcd = tbU45s10_gcd, ratio = tbU45s10_ratio, par = tbU45s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var p = (par(R2, R3));
    var I = (E / p);
    if (!(R2 != R3 && R1 != R2 && R1 != R3 && Math.abs(p * 10 - Math.round(p * 10)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10 && I <= 20 && Math.abs(I * 10 - Math.round(I * 10)) < 1e-9)) continue;
    var ok = (E / p);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s10_three4(ok, [{x: (E / (R1 + p)), why: "短絡を見ずに、$R_1$ も足した", w: 0, cut: 1}, {x: (E / R2), why: "$R_2$ の電流で止めた（並列の電流を足していない）", w: 1, cut: 1}, {x: (E / (R2 + R3)), why: "並列の部分を足した", w: 2, cut: 0}, {x: (E / R1), why: "短絡した $R_1$ で割った", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s10is", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と、$R_2 = " + qv(R2, "O") + "$ と $R_3 = " + qv(R3, "O") + "$ の並列を直列につなぎ、$R_1$ の両端を導線でつないだ。電源の電圧は $E = " + qv(E, "V") + "$ です。電源から流れる電流は何 A ですか。", fig: {kind: "u45s10s", L: tbU45s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_1$ は短絡で 0 Ω　全体は並列の部分　$" + qv(p, "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(p) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s10is", p: {E: E, R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s10is：条件に合う数字が見つからない");
}
function tbU45s10_Qrq(r){
  var gcd = tbU45s10_gcd, ratio = tbU45s10_ratio, par = tbU45s10_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var p = (par(R1, R2));
    if (!(R1 != R2 && R1 != R3 && R2 != R3 && Math.abs(p * 10 - Math.round(p * 10)) < 1e-9 && max(R1, R2, R3) / min(R1, R2, R3) <= 10)) continue;
    var ok = (R3);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s10_three4(ok, [{x: (R3 + p), why: "短絡を見ずに、並列の部分も合成した", w: 0, cut: 1}, {x: (p), why: "並列の部分の値だけを答えた（$R_3$ を飛ばした）", w: 1, cut: 1}, {x: (R3 + R1), why: "$R_2$ だけを消して $R_1$ を残した", w: 2, cut: 0}, {x: (R1 + R2 + R3), why: "並列の部分を足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s10rq", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ の並列と、$R_3 = " + qv(R3, "O") + "$ を直列につなぎ、$R_2$ の両端を導線でつないだ。全体の合成抵抗は何 Ω ですか。", fig: {kind: "u45s10q2", L: tbU45s10_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["導線の両端は同じ電位　並列の部分は 0 Ω", "残るのは $R_3$ だけ　$" + qv(ok, "O") + "$"], chk: {form: "u45s10rq", p: {R1: R1, R2: R2, R3: R3}}};
  }
  throw new Error("u45s10rq：条件に合う数字が見つからない");
}
// 45-11 平衡を見抜いて合成する の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s11.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s11_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s11_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s11_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s11_par(a, b){ return a * b / (a + b); }
function tbU45s11_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s11_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s11_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s11_Qrt(r){
  var gcd = tbU45s11_gcd, ratio = tbU45s11_ratio, par = tbU45s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var s = pick(r, [2,3,4]);
    var f = pick(r, [0,1]);
    var R5 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    if (!(max(R1, R2, R3, R4) <= 60 && R1 != R3 && R5 != R1 && Math.abs(A * B / (A + B) * 10 - Math.round(A * B / (A + B) * 10)) < 1e-9)) continue;
    var ok = (A * B / (A + B));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s11_three4(ok, [{x: (R1 + R3), why: "$R_1$・$R_3$ の道だけを見た（もう1つの道を飛ばした）", w: 0, cut: 1}, {x: (A * B / (A + B) + R5), why: "電流の流れない $R_5$ を消さずに足した", w: 1, cut: 1}, {x: (A + B), why: "2つの道を直列に足した", w: 2, cut: 0}, {x: (A * B), why: "和分の積で、和で割っていない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s11rt", text: "図のブリッジで、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$、$R_5 = " + qv(R5, "O") + "$ です。電源から見た全体の合成抵抗は何 Ω ですか。", fig: {kind: "u45s11br", L: tbU45s11_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["r5", "{R}_5=" + qf(R5, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で平衡。$R_5$ に電流は流れないので消す", "道の抵抗は $" + qv(A, "O") + "$ と $" + qv(B, "O") + "$　$\\dfrac{" + fmt(A) + " \\times " + fmt(B) + "}{" + fmt(A) + " + " + fmt(B) + "} = " + qv(ok, "O") + "$"], chk: {form: "u45s11rt", p: {R1: R1, R2: R2, R3: R3, R4: R4, R5: R5}}};
  }
  throw new Error("u45s11rt：条件に合う数字が見つからない");
}
function tbU45s11_Qi(r){
  var gcd = tbU45s11_gcd, ratio = tbU45s11_ratio, par = tbU45s11_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var a3 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var s = pick(r, [2,3,4]);
    var f = pick(r, [0,1]);
    var R5 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var R1 = (f == 0 ? a1 : a1 * s);
    var R2 = (f == 0 ? a1 * s : a1);
    var R3 = (f == 0 ? a3 : a3 * s);
    var R4 = (f == 0 ? a3 * s : a3);
    var A = (R1 + R3);
    var B = (R2 + R4);
    var E = (I * A * B / (A + B));
    if (!(max(R1, R2, R3, R4) <= 60 && R1 != R3 && R5 != R1 && Math.abs(E - Math.round(E)) < 1e-9 && E <= 200)) continue;
    var ok = (E * (A + B) / (A * B));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s11_three4(ok, [{x: (E / A), why: "$R_1$・$R_3$ の道の電流だけを求めた（もう1つの道を飛ばした）", w: 0, cut: 1}, {x: (E / (A * B / (A + B) + R5)), why: "電流の流れない $R_5$ を消さずに足した", w: 1, cut: 1}, {x: (E / (A + B)), why: "2つの道を直列に足した", w: 2, cut: 0}, {x: (E / (A + B + R5)), why: "全部の抵抗を直列に足した", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s11i", text: "図のブリッジで、$E = " + qv(E, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$、$R_4 = " + qv(R4, "O") + "$、$R_5 = " + qv(R5, "O") + "$ です。電源から流れ出る電流 $I$ は何 A ですか。", fig: {kind: "u45s11br", L: tbU45s11_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["r3", "{R}_3=" + qf(R3, "O")], ["r4", "{R}_4=" + qf(R4, "O")], ["r5", "{R}_5=" + qf(R5, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$R_2 R_3 = " + fmt(R2 * R3) + "$、$R_1 R_4 = " + fmt(R1 * R4) + "$ で平衡。$R_5$ を消すと、道の抵抗は $" + qv(A, "O") + "$ と $" + qv(B, "O") + "$、合成抵抗は $\\dfrac{" + fmt(A) + " \\times " + fmt(B) + "}{" + fmt(A) + " + " + fmt(B) + "} = " + qv(A * B / (A + B), "O") + "$", "$I = \\dfrac{" + fmt(E) + "}{" + fmt(A * B / (A + B)) + "} = " + qv(ok, "A") + "$"], chk: {form: "u45s11i", p: {E: E, R1: R1, R2: R2, R3: R3, R4: R4, R5: R5}}};
  }
  throw new Error("u45s11i：条件に合う数字が見つからない");
}
// 45-12 比をとる の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s12.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s12_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s12_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s12_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s12_par(a, b){ return a * b / (a + b); }
function tbU45s12_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s12_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s12_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s12_Qip(r){
  var gcd = tbU45s12_gcd, ratio = tbU45s12_ratio, par = tbU45s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var k = pick(r, [1,2]);
    var Ra = (k == 1 ? R1 : R2);
    var Rb = (k == 1 ? R2 : R1);
    var j = (3 - k);
    if (!(R1 != R2 && Math.abs((Rb / Ra) * 100 - Math.round((Rb / Ra) * 100)) < 1e-9 && (Rb / Ra) != 1 && max(R1, R2) / min(R1, R2) <= 10)) continue;
    var ok = (Rb / Ra);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s12_three4(ok, [{x: (1), why: "電圧が同じなので、電流も同じと考えた（比をとっていない）", w: 0, cut: 1}, {x: (Rb / (Ra + Rb)), why: "全体の電流と比べた（$I_" + fmt(j) + "$ でなく $I$ で割った）", w: 1, cut: 1}, {x: (Ra / Rb), why: "比を逆にした（電流は抵抗の逆比）", w: 2, cut: 0}, {x: (Ra / (Ra + Rb)), why: "分流の式と混ぜた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s12ip", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列にして電源につないだ。$I_" + fmt(k) + "$ は $I_" + fmt(j) + "$ の何倍ですか。", fig: {kind: "u45s12par", L: tbU45s12_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列なので電圧は同じ $E$　$I_" + fmt(k) + " = \\dfrac{E}{" + fmt(Ra) + "}$、$I_" + fmt(j) + " = \\dfrac{E}{" + fmt(Rb) + "}$", "割ると $E$ が消える　$\\dfrac{I_" + fmt(k) + "}{I_" + fmt(j) + "} = \\dfrac{" + fmt(Rb) + "}{" + fmt(Ra) + "} = " + qv(ok, "X") + "$"], chk: {form: "u45s12ip", p: {Ra: Ra, Rb: Rb}}};
  }
  throw new Error("u45s12ip：条件に合う数字が見つからない");
}
function tbU45s12_Qvs(r){
  var gcd = tbU45s12_gcd, ratio = tbU45s12_ratio, par = tbU45s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(R1 != R2 && Math.abs((R1 / R2) * 100 - Math.round((R1 / R2) * 100)) < 1e-9 && (R1 / R2) != 1 && max(R1, R2) / min(R1, R2) <= 10)) continue;
    var ok = (R1 / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s12_three4(ok, [{x: (1), why: "電流が同じなので、電圧も同じと考えた（比をとっていない）", w: 0, cut: 1}, {x: (R1 / (R1 + R2)), why: "電源の電圧と比べた（$V_2$ でなく $E$ で割った）", w: 1, cut: 1}, {x: (R2 / R1), why: "比を逆にした（直列の電圧は抵抗の比）", w: 2, cut: 0}, {x: (R2 / (R1 + R2)), why: "分圧の式と混ぜた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s12vs", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につないだ。$R_1$ にかかる電圧 $V_1$ は、$R_2$ にかかる電圧 $V_2$ の何倍ですか。", fig: {kind: "u45s12ser", L: tbU45s12_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["v1", "{V}_1"], ["v2", "{V}_2"], ["i", "{I}"], ["i1", null], ["i2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので電流は同じ $I$　$V_1 = " + fmt(R1) + " I$、$V_2 = " + fmt(R2) + " I$", "割ると $I$ が消える　$\\dfrac{V_1}{V_2} = \\dfrac{" + fmt(R1) + "}{" + fmt(R2) + "} = " + qv(ok, "X") + "$"], chk: {form: "u45s12vs", p: {R1: R1, R2: R2}}};
  }
  throw new Error("u45s12vs：条件に合う数字が見つからない");
}
function tbU45s12_Qpp(r){
  var gcd = tbU45s12_gcd, ratio = tbU45s12_ratio, par = tbU45s12_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(R1 != R2 && Math.abs((R2 / R1) * 100 - Math.round((R2 / R1) * 100)) < 1e-9 && (R2 / R1) != 1 && max(R1, R2) / min(R1, R2) <= 10)) continue;
    var ok = (R2 / R1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s12_three4(ok, [{x: (1), why: "電圧が同じなので、電力も同じと考えた（比をとっていない）", w: 0, cut: 1}, {x: (R2 / (R1 + R2)), why: "全体の電力と比べた（$P_2$ でなく全体で割った）", w: 1, cut: 1}, {x: (R1 / R2), why: "比を逆にした（$P = \\dfrac{E^2}{R}$ は抵抗が小さいほど大きい）", w: 2, cut: 0}, {x: ((R2 / R1) * (R2 / R1)), why: "比を2乗した（2乗するのは $E$）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s12pp", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列にして電源につないだ。$R_1$ の電力 $P_1$ は、$R_2$ の電力 $P_2$ の何倍ですか。", fig: {kind: "u45s12par", L: tbU45s12_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","i1":"{I}_1","i2":"{I}_2"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["i1", null], ["i2", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列なので電圧は同じ $E$　$P_1 = \\dfrac{E^2}{" + fmt(R1) + "}$、$P_2 = \\dfrac{E^2}{" + fmt(R2) + "}$", "割ると $E^2$ が消える　$\\dfrac{P_1}{P_2} = \\dfrac{" + fmt(R2) + "}{" + fmt(R1) + "} = " + qv(ok, "X") + "$"], chk: {form: "u45s12pp", p: {R1: R1, R2: R2}}};
  }
  throw new Error("u45s12pp：条件に合う数字が見つからない");
}
// 45-13 電力を出して比べる の練習（※ textbook/gen/make_section.py が textbook/gen/data/u45_s13.py から作った。手で直さない（データを直して作り直す）。）
function tbU45s13_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU45s13_ratio(a){ var g = a.reduce(function(x, y){ return tbU45s13_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU45s13_par(a, b){ return a * b / (a + b); }
function tbU45s13_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU45s13_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU45s13_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU45s13_Qps(r){
  var gcd = tbU45s13_gcd, ratio = tbU45s13_ratio, par = tbU45s13_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    var k = pick(r, [1,2]);
    var E = (I * (R1 + R2));
    var Rk = (k == 1 ? R1 : R2);
    var Ro = (k == 1 ? R2 : R1);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && E <= 200 && Math.abs(E - Math.round(E)) < 1e-9 && Math.abs(Rk * I * I * 10 - Math.round(Rk * I * I * 10)) < 1e-9 && Rk * I * I <= 2000)) continue;
    var ok = (Rk * I * I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s13_three4(ok, [{x: (E * E / Rk), why: "電源の電圧のまま $\\dfrac{E^2}{R_" + fmt(k) + "}$ にした（電流を出していない）", w: 0, cut: 1}, {x: (E * I), why: "回路全体の電力で止めた（$R_" + fmt(k) + "$ の分にしていない）", w: 1, cut: 1}, {x: (Ro * I * I), why: "もう一方の抵抗の電力を出した", w: 2, cut: 0}, {x: (Rk * I), why: "2乗していない", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s13ps", text: "図のように、$E = " + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列につないだ。$R_" + fmt(k) + "$ の電力は何 W ですか。", fig: {kind: "u45s13ser", L: tbU45s13_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","i":"{I}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["回路の電流　$I = \\dfrac{" + fmt(E) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$", "$R_" + fmt(k) + "$ にも $" + qv(I, "A") + "$　$P = " + fmt(Rk) + " \\times " + fmt(I) + "^2 = " + qv(ok, "W") + "$"], chk: {form: "u45s13ps", p: {E: E, Rk: Rk, Ro: Ro, I: I}}};
  }
  throw new Error("u45s13ps：条件に合う数字が見つからない");
}
function tbU45s13_Qpp(r){
  var gcd = tbU45s13_gcd, ratio = tbU45s13_ratio, par = tbU45s13_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,30,36,40,45,48,60]);
    var E = pick(r, [10,12,15,20,24,30,36,40,48,50,60,80,90,100]);
    var k = pick(r, [1,2]);
    var Rk = (k == 1 ? R1 : R2);
    var Ro = (k == 1 ? R2 : R1);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && Math.abs(E * E / Rk * 10 - Math.round(E * E / Rk * 10)) < 1e-9 && E * E / Rk <= 2000 && Math.abs(E / Rk * 10 - Math.round(E / Rk * 10)) < 1e-9)) continue;
    var ok = (E * E / Rk);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s13_three4(ok, [{x: (E / Rk), why: "電流を出して止めた（電力にしていない）", w: 0, cut: 1}, {x: (E * E * (R1 + R2) / (R1 * R2)), why: "回路全体の電力を答えた（$R_" + fmt(k) + "$ の分にしていない）", w: 1, cut: 1}, {x: (E * E / Ro), why: "もう一方の抵抗の電力を出した", w: 2, cut: 0}, {x: (Rk * (E / (R1 + R2)) * (E / (R1 + R2))), why: "直列と取り違えた（並列はどちらにも $E$ がかかる）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s13pp", text: "図のように、$E = " + qv(E, "V") + "$ の電源に $R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列につないだ。$R_" + fmt(k) + "$ の電力は何 W ですか。", fig: {kind: "u45s13par", L: tbU45s13_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","i":"{I}"}, [["src", "{E}=" + qf(E, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["i", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列なので $R_" + fmt(k) + "$ にかかる電圧は $" + qv(E, "V") + "$", "$P = \\dfrac{" + fmt(E) + "^2}{" + fmt(Rk) + "} = " + qv(ok, "W") + "$"], chk: {form: "u45s13pp", p: {E: E, Rk: Rk, Ro: Ro}}};
  }
  throw new Error("u45s13pp：条件に合う数字が見つからない");
}
function tbU45s13_Qpr(r){
  var gcd = tbU45s13_gcd, ratio = tbU45s13_ratio, par = tbU45s13_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    var R2 = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(R1 != R2 && max(R1, R2) / min(R1, R2) <= 10 && Math.abs(R1 / R2 * 100 - Math.round(R1 / R2 * 100)) < 1e-9)) continue;
    var ok = (R1 / R2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU45s13_three4(ok, [{x: (1), why: "電流が同じなので、電力も同じと考えた（比をとっていない）", w: 0, cut: 1}, {x: (R1 / (R1 + R2)), why: "全体の電力と比べた（$P_2$ でなく全体で割った）", w: 1, cut: 1}, {x: (R2 / R1), why: "比を逆にした（直列は電流が同じなので抵抗の比）", w: 2, cut: 0}, {x: ((R1 / R2) * (R1 / R2)), why: "比を2乗した（2乗するのは $I$）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u45s13pr", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列にして電源につないだ。$R_1$ の電力 $P_1$ は、$R_2$ の電力 $P_2$ の何倍ですか。", fig: {kind: "u45s13ser", L: tbU45s13_fig({"src":"{E}","r1":"{R}_1","r2":"{R}_2","i":"{I}"}, [["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので電流は同じ $I$　$P_1 = " + fmt(R1) + " I^2$、$P_2 = " + fmt(R2) + " I^2$", "割ると $I^2$ が消える　$\\dfrac{P_1}{P_2} = \\dfrac{" + fmt(R1) + "}{" + fmt(R2) + "} = " + qv(ok, "X") + "$"], chk: {form: "u45s13pr", p: {R1: R1, R2: R2}}};
  }
  throw new Error("u45s13pr：条件に合う数字が見つからない");
}
var GEN = {
  // 45-1 合成から全体の電流
  1: function(r){ return pick(r, [tbU45s1_QlR, tbU45s1_QlL, tbU45s1_Qcol, tbU45s1_Qsw, tbU45s1_QlRe, tbU45s1_QlLe, tbU45s1_Qcole, tbU45s1_Qswe])(r); },
  // 45-2 矢印の位置と分流
  2: function(r){ return pick(r, [tbU45s2_QaR, tbU45s2_QaL, tbU45s2_QbR, tbU45s2_QbL, tbU45s2_QcR, tbU45s2_QcL, tbU45s2_QtR, tbU45s2_QtL, tbU45s2_QsR, tbU45s2_QsL])(r); },
  // 45-3 合成の式を逆に解く
  3: function(r){ return pick(r, [tbU45s3_QaR, tbU45s3_QaRu, tbU45s3_QaL, tbU45s3_QaLu, tbU45s3_QbR, tbU45s3_QbL, tbU45s3_Qsa, tbU45s3_Qsb])(r); },
  // 45-4 二次方程式で2つの抵抗
  4: function(r){ return pick(r, [tbU45s4_Qbig, tbU45s4_Qsmall, tbU45s4_Qneg, tbU45s4_QnegL])(r); },
  // 45-5 ミリとキロ
  5: function(r){ return pick(r, [tbU45s5_Qv, tbU45s5_Qvc, tbU45s5_Qi, tbU45s5_Qr])(r); },
  // 45-6 オームから電流の和
  6: function(r){ return pick(r, [tbU45s6_Qsum, tbU45s6_Qsumc, tbU45s6_Qsub, tbU45s6_Qsubc, tbU45s6_Qr2, tbU45s6_Qr2c, tbU45s6_Qsums, tbU45s6_Qsubs])(r); },
  // 45-7 電圧の引き算からオーム
  7: function(r){ return pick(r, [tbU45s7_Qi1, tbU45s7_Qi2, tbU45s7_Qi1c, tbU45s7_Qi2c, tbU45s7_Qr1, tbU45s7_Qr2c, tbU45s7_Qi1s, tbU45s7_Qr1s])(r); },
  // 45-8 合成から電源の電圧を出す
  8: function(r){ return pick(r, [tbU45s8_Qea, tbU45s8_Qea, tbU45s8_Qeb, tbU45s8_Qec, tbU45s8_Qec, tbU45s8_Qed, tbU45s8_Qed])(r); },
  // 45-9 電源の電圧を次の図へ持ち越す
  9: function(r){ return pick(r, [tbU45s9_Qrep, tbU45s9_Qrep, tbU45s9_Qrep, tbU45s9_Qrepb, tbU45s9_Qrepb, tbU45s9_Qadd, tbU45s9_Qadd, tbU45s9_Qinv, tbU45s9_Qinv])(r); },
  // 45-10 短絡を見抜いて合成する
  10: function(r){ return pick(r, [tbU45s10_Qrp, tbU45s10_Qrp, tbU45s10_Qip, tbU45s10_Qrs, tbU45s10_Qrs, tbU45s10_Qis, tbU45s10_Qrq, tbU45s10_Qrq])(r); },
  // 45-11 平衡を見抜いて合成する
  11: function(r){ return pick(r, [tbU45s11_Qrt, tbU45s11_Qrt, tbU45s11_Qrt, tbU45s11_Qi, tbU45s11_Qi])(r); },
  // 45-12 比をとる
  12: function(r){ return pick(r, [tbU45s12_Qip, tbU45s12_Qip, tbU45s12_Qip, tbU45s12_Qvs, tbU45s12_Qvs, tbU45s12_Qpp, tbU45s12_Qpp])(r); },
  // 45-13 電力を出して比べる
  13: function(r){ return pick(r, [tbU45s13_Qps, tbU45s13_Qps, tbU45s13_Qps, tbU45s13_Qpp, tbU45s13_Qpp, tbU45s13_Qpr, tbU45s13_Qpr])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t45s1e","scene":"t45s1e","kind":"u45s1xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r23":"{R}_23","rd":"{R}","i":"{I}"},"viewbox":"319 212 740 459","band":{"want":"電源から流れる電流 $I$","ans":"全体の合成抵抗 $R$ でオームの法則"},"narr":{"start":{"co":1,"mg":0,"rdd":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、電源から流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I","src"]},{"text":"①並列をまとめる\n②直列を足す\n③オームの法則\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"並列の部分を1つにまとめます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"merge","emph":["R2","R3","R23"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と足すと、全体の合成抵抗 $R$ です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"dim","emph":["R1","R23","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この $R$ が電源から見た抵抗〗なので、オームの法則に使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R}"]]}],"ans":true,"emphPre":["R","src","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R23":["r23","r23t0","r23t1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s1xxL","u45s1xxw1","zbu45s1xx0hi"],"zlo":["u45s1xxRw","u45s1xxw11","zbu45s1xx1lo","u45s1xxw3","u45s1xxw5","u45s1xxw7","zbu45s1xx3lo","u45s1xxw9","zbu45s1xx5lo"],"zmid":["u45s1xxw2","u45s1xxw4","u45s1xxw6","zbu45s1xx2mid","u45s1xxw8","zbu45s1xx4mid","u45s1xxw10","zbu45s1xx6mid"]},"moves":{"merge":{"to":{"mg":1},"dur":0.8},"dim":{"to":{"rdd":1},"dur":0.8}},"route":["並列をまとめる","直列を足す","オームの法則"]}},{"id":"t45s1x","scene":"t45s1x","kind":"u45s1xx","lab":{"src":"{E}=24 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=12 Ω","r23":"{R}_23=4 Ω","rd":["{R}","{R}=6 Ω"],"i":["{I}","{I}=4 A"]},"viewbox":"319 212 740 459","band":{"want":"電源から流れる電流 $I$","known":"$E = 24\\,\\mathrm{V},\\;\\; R_1 = 2\\,\\Omega,\\;\\; R_2 = 6\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega$","ans":"$I = 4\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"mg":0,"rdd":0,"rdv":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、電源から流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I","src"]},{"text":"①並列をまとめる\n②直列を足す\n③オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_2$ と $R_3$ は並列なので、和分の積でまとめます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R2","R3","R23"],"eq":[{"cont":false,"items":[["R_{23} = \\dfrac{R_2 R_3}{R_2 + R_3}"],["R_{23} = \\dfrac{6 \\times 12}{6 + 12} = 4\\,\\Omega"]]}],"move":"merge","emphPre":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_{23}$ と $R_1$ は直列なので、足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["R1","R23","R"],"eq":[{"cont":false,"items":[["R = R_1 + R_{23}"],["R = 2 + 4 = 6\\,\\Omega"]]}],"move":"rval","emphPre":["R1","R23","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この $6\\,\\Omega$ が電源から見た抵抗〗なので、オームの法則に使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["R","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R}"],["I = \\dfrac{24}{6} = 4\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["R","src","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R23":["r23","r23t0","r23t1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s1xxL","u45s1xxw1","zbu45s1xx0hi"],"zlo":["u45s1xxRw","u45s1xxw11","zbu45s1xx1lo","u45s1xxw3","u45s1xxw5","u45s1xxw7","zbu45s1xx3lo","u45s1xxw9","zbu45s1xx5lo"],"zmid":["u45s1xxw2","u45s1xxw4","u45s1xxw6","zbu45s1xx2mid","u45s1xxw8","zbu45s1xx4mid","u45s1xxw10","zbu45s1xx6mid"]},"moves":{"merge":{"to":{"mg":1},"dur":0.8},"rval":{"to":{"rdd":1,"rdv":1},"dur":0.8},"ival":{"to":{"iv":1},"dur":0.4}},"route":["並列をまとめる","直列を足す","オームの法則"]}},{"id":"t45s2e","scene":"t45s2e","kind":"u45s2ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}","i2":"{I}_2","i3":"{I}_3"},"viewbox":"314 195 745 441","band":{"want":"$R_3$ の電流","ans":"分かれる前の電流を分流の式へ"},"narr":{"start":{"co":1,"t":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①矢印の位置\n②分流の式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[2,5],"sents":[{"text":"電源の導線の矢印は、〖分かれる前〗の全体の電流 $I$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","src"]},{"text":"$R_1$ の隣の矢印も、まだ分かれる前です。直列なので同じ $I$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"to1","emph":["I","R1"]},{"text":"片方の道の矢印は、〖その道だけの電流〗 $I_2$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"to2","emph":["I2","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"分流の式に入れるのは、〖分かれる前の電流〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"to0","emph":["I","R2","R3","I3"],"eq":[{"cont":false,"items":[["I_3 = I \\times \\dfrac{R_2}{R_2 + R_3}"]]}],"ans":true,"emphPre":["I","R2","R3","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1","cx1:L","cx1:S","ppx1","pmx1","ex10","ex11","cx2:L","cx2:S","ppx2","pmx2","ex20","ex21"],"R1":["r1","r1t0","r1t1","r1x1","r1x1t0","r1x1t1","r1x2","r1x2t0","r1x2t1"],"R2":["r2","r2t0","r2t1","r2x1","r2x1t0","r2x1t1","r2x2","r2x2t0","r2x2t1"],"R3":["r3","r3t0","r3t1","r3x1","r3x1t0","r3x1t1","r3x2","r3x2t0","r3x2t1"],"I3":["i3a","i3a:h","i3t0","i3t1","i3x1a","i3x1a:h","i3x1t0","i3x1t1"],"I":["ia","ia:h","it0","it1","ix1a","ix1a:h","ix1t0","ix1t1"],"zhi":["u45s2aeL","u45s2aew1","zbu45s2ae0hi","u45s2aex1L","u45s2aex1w1","zbu45s2aex10hi","u45s2aex2L","u45s2aex2w1","zbu45s2aex20hi"],"zlo":["u45s2aeRw","u45s2aew3","u45s2aew5","u45s2aew7","u45s2aew9","zbu45s2ae1lo","u45s2aex1Rw","u45s2aex1w4","u45s2aex1w6","u45s2aex1w8","u45s2aex1w10","zbu45s2aex11lo","u45s2aex2Rw","u45s2aex2w3","u45s2aex2w5","u45s2aex2w7","u45s2aex2w9","zbu45s2aex21lo"],"zmid":["u45s2aew2","u45s2aew4","u45s2aew6","u45s2aew8","zbu45s2ae2mid","u45s2aex1w2","u45s2aex1w3","u45s2aex1w5","u45s2aex1w7","u45s2aex1w9","zbu45s2aex12mid","u45s2aex2w2","u45s2aex2w4","u45s2aex2w6","u45s2aex2w8","zbu45s2aex22mid"],"I2":["i2x2a","i2x2a:h","i2x2t0","i2x2t1"]},"moves":{"to1":{"to":{"t":1},"dur":0.5},"to2":{"to":{"t":2},"dur":0.5},"to0":{"to":{"t":0},"dur":0.5}},"route":["矢印の位置","分流の式"]}},{"id":"t45s2x","scene":"t45s2x","kind":"u45s2xx","lab":{"src":"{E}","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=12 Ω","i":"{I}=6 A","i3":["{I}_3","{I}_3=2 A"]},"viewbox":"314 212 745 424","band":{"want":"$R_3$ の電流 $I_3$","known":"$I = 6\\,\\mathrm{A},\\;\\; R_2 = 6\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega$","ans":"$I_3 = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i3v":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、$R_3$ に流れる電流 $I_3$ です。","at":{"強調":1.0},"after":[],"emph":["R3","I3"]},{"text":"①矢印の位置\n②分流の式\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R3","I3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I = 6\\,\\mathrm{A}$ の矢印は〖電源の導線の上〗です。分かれる前の全体の電流です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","src"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"分かれる前の電流なので、〖この $6\\,\\mathrm{A}$ を分流の式に入れます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","R2","R3","I3"],"eq":[{"cont":false,"items":[["I_3 = I \\times \\dfrac{R_2}{R_2 + R_3}"],["I_3 = 6 \\times \\dfrac{6}{6 + 12}"],["I_3 = 2\\,\\mathrm{A}"]]}],"move":"i3val","ans":true,"emphPre":["I","R2","R3","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s2xxL","u45s2xxw1","zbu45s2xx0hi"],"zlo":["u45s2xxRw","u45s2xxw3","u45s2xxw5","u45s2xxw7","u45s2xxw9","zbu45s2xx1lo"],"zmid":["u45s2xxw2","u45s2xxw4","u45s2xxw6","u45s2xxw8","zbu45s2xx2mid"]},"moves":{"i3val":{"to":{"i3v":1},"dur":0.4}},"route":["矢印の位置","分流の式"]}},{"id":"t45s3e","scene":"t45s3e","kind":"u45s3xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","rx":"{R}_x","rd":"{R}"},"viewbox":"464 220 595 442","band":{"want":"$R_x$","ans":"直列の分を引いてから並列の式で解く"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"全体の合成抵抗 $R$ から、$R_x$ を求めます。","at":{"強調":1.0},"after":[],"emph":["R","Rx"]},{"text":"①直列の分を引く\n②並列の式で解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R","Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"直列なので、$R$ から $R_1$ を引くと〖並列の部分の合成抵抗〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","R1","R2","Rx"],"eq":[{"cont":false,"items":[["R_{2x} = R - R_1"]]}],"emphPre":["R","R1","R2","Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この値が並列の合成抵抗〗なので、並列の式に入れて $R_x$ を解きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R2","Rx"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R_{2x}} = \\dfrac{1}{R_2} + \\dfrac{1}{R_x}"]]}],"ans":true,"emphPre":["R2","Rx"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"Rx":["rx","rxt0","rxt1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"zhi":["u45s3xxL","u45s3xxw1","zbu45s3xx0hi"],"zlo":["u45s3xxRw","u45s3xxw3","u45s3xxw5","u45s3xxw7","u45s3xxw9","zbu45s3xx1lo"],"zmid":["u45s3xxw2","u45s3xxw4","u45s3xxw6","u45s3xxw8","zbu45s3xx2mid"]},"moves":{},"route":["直列の分を引く","並列の式で解く"]}},{"id":"t45s3x","scene":"t45s3x","kind":"u45s3xx","lab":{"src":"{E}","r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","rx":["{R}_x","{R}_x=6 Ω"],"rd":"{R}=8 Ω"},"viewbox":"464 220 595 442","band":{"want":"$R_x$","known":"$R = 8\\,\\Omega,\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega$","ans":"$R_x = 6\\,\\Omega$"},"narr":{"start":{"co":1,"rxv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、$R_x$ です。","at":{"強調":1.0},"after":[],"emph":["Rx"]},{"text":"①直列の分を引く\n②並列の式で解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と並列の部分は直列なので、$R$ から $R_1$ を引きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","R1","R2","Rx"],"eq":[{"cont":false,"items":[["R_{2x} = R - R_1"],["R_{2x} = 8 - 4 = 4\\,\\Omega"]]}],"emphPre":["R","R1","R2","Rx"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"〖この値が並列の合成抵抗〗なので、並列の式に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R2","Rx"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R_{2x}} = \\dfrac{1}{R_2} + \\dfrac{1}{R_x}"],["\\dfrac{1}{4} = \\dfrac{1}{12} + \\dfrac{1}{R_x}"]]}],"emphPre":["R2","Rx"]},{"text":"$\\dfrac{1}{12}$ を左へ移して、$R_x$ を出します。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["Rx"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R_x} = \\dfrac{1}{4} - \\dfrac{1}{12} = \\dfrac{2}{12}"],["R_x = 6\\,\\Omega"]]}],"move":"rxval","ans":true,"emphPre":["Rx"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"Rx":["rx","rxt0","rxt1"],"R":["rdd:e","rdd:f","rdd:a","rdt0","rdt1"],"zhi":["u45s3xxL","u45s3xxw1","zbu45s3xx0hi"],"zlo":["u45s3xxRw","u45s3xxw3","u45s3xxw5","u45s3xxw7","u45s3xxw9","zbu45s3xx1lo"],"zmid":["u45s3xxw2","u45s3xxw4","u45s3xxw6","u45s3xxw8","zbu45s3xx2mid"]},"moves":{"rxval":{"to":{"rxv":1},"dur":0.4}},"route":["直列の分を引く","並列の式で解く"]}},{"id":"t45s4e","scene":"t45s4e","kind":"u45s4es","lab":{"ra":"{R}_a","rb":"{R}_b"},"viewbox":"456 252 1336 457","band":{"want":"2つの抵抗","ans":"和と積から二次方程式を因数分解"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①和と積\n②二次方程式\n③因数分解\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ra","Rb"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"直列にすると $10\\,\\Omega$、並列にすると $2.4\\,\\Omega$ です。並列の式の分母は和なので、〖積〗が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ra","Rb"],"eq":[{"cont":false,"items":[["R_a + R_b = 10"],["\\dfrac{R_a R_b}{10} = 2.4"],["R_a R_b = 24"]]}],"emphPre":["Ra","Rb"]}]},{"cap":null,"eqp":null,"vid":[8],"sents":[{"text":"〖積の式に〗 $R_b = 10 - R_a$ を入れると、二次方程式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ra","Rb"],"eq":[{"cont":false,"items":[["R_a(10 - R_a) = 24"],["R_a^2 - 10R_a + 24 = 0"]]}],"emphPre":["Ra","Rb"]}]},{"cap":null,"eqp":null,"vid":[8],"sents":[{"text":"因数分解で解きます。2つの答えが2つの抵抗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Ra","Rb"],"eq":[{"cont":false,"items":[["(R_a - 4)(R_a - 6) = 0"],["R_a = 4,\\; 6"]]}],"ans":true,"emphPre":["Ra","Rb"]}]}],"groups":{"Ra":["ra","rat0","rat1","rax1","rax1t0","rax1t1"],"Ta":["tma","tma:t","tmax1","tmax1:t"],"Tb":["tmb","tmb:t","tmbx1","tmbx1:t"],"Rb":["rb","rbt0","rbt1","rbx1","rbx1t0","rbx1t1"]},"moves":{},"route":["和と積","二次方程式","因数分解"]}},{"id":"t45s4x","scene":"t45s4x","kind":"u45s4xs","lab":{"ra":"{R}_a","rb":"{R}_b"},"viewbox":"456 252 1336 457","band":{"want":"大きい方の抵抗","known":"直列 $25\\,\\Omega$・並列 $4\\,\\Omega$","ans":"$20\\,\\Omega$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、大きい方の抵抗です。","at":{"強調":1.0},"after":[],"emph":["Ra","Rb"]},{"text":"①和と積\n②二次方程式\n③因数分解\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ra","Rb"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"並列の式の分母は和の $25$ なので、〖積〗が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Ra","Rb"],"eq":[{"cont":false,"items":[["\\dfrac{R_a R_b}{R_a + R_b} = 4"],["\\dfrac{R_a R_b}{25} = 4"],["R_a R_b = 100"]]}],"emphPre":["Ra","Rb"]}]},{"cap":null,"eqp":null,"vid":[8],"sents":[{"text":"〖この積の式に〗 $R_b = 25 - R_a$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Ra","Rb"],"eq":[{"cont":false,"items":[["R_a(25 - R_a) = 100"],["R_a^2 - 25R_a + 100 = 0"]]}],"emphPre":["Ra","Rb"]}]},{"cap":null,"eqp":null,"vid":[8],"sents":[{"text":"因数分解します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Ra","Rb"],"eq":[{"cont":false,"items":[["(R_a - 5)(R_a - 20) = 0"],["R_a = 5,\\; 20"]]}],"emphPre":["Ra","Rb"]},{"text":"2つの答えが2つの抵抗です。大きい方は $20\\,\\Omega$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["Ra","Rb"]}]}],"groups":{"Ra":["ra","rat0","rat1","rax1","rax1t0","rax1t1"],"Ta":["tma","tma:t","tmax1","tmax1:t"],"Tb":["tmb","tmb:t","tmbx1","tmbx1:t"],"Rb":["rb","rbt0","rbt1","rbx1","rbx1t0","rbx1t1"]},"moves":{},"route":["和と積","二次方程式","因数分解"]}},{"id":"t45s5e","scene":"t45s5e","kind":"u45s5xx","lab":{"src":"{E}","r1":"{R}","i":"{I}","v1":"{V}"},"viewbox":"464 284 595 348","band":{"want":"$V$・$I$・$R$","ans":"単位をそろえてからオームの法則"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①単位をそろえる\n②オームの法則\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"〖キロは 1000 倍〗、ミリは 1000 分の 1 です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","I"],"eq":[{"cont":false,"items":[["1\\,\\mathrm{k}\\Omega = 1000\\,\\Omega"],["1\\,\\mathrm{mA} = 0.001\\,\\mathrm{A}"]]}],"emphPre":["R1","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖Ω と A にそろえた値〗を、オームの法則に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R1","I","V1"],"eq":[{"cont":false,"items":[["V = RI"]]}],"ans":true,"emphPre":["R1","I","V1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s5xxL","u45s5xxw1","zbu45s5xx0hi"],"zlo":["u45s5xxRw","u45s5xxw2","zbu45s5xx1lo"]},"moves":{},"route":["単位をそろえる","オームの法則"]}},{"id":"t45s5x","scene":"t45s5x","kind":"u45s5xx","lab":{"src":"{E}","r1":"{R}=2 kΩ","i":"{I}=5 mA","v1":["{V}","{V}=10 V"]},"viewbox":"464 284 595 348","band":{"want":"$R$ にかかる電圧 $V$","known":"$R = 2\\,\\mathrm{k}\\Omega,\\;\\; I = 5\\,\\mathrm{mA}$","ans":"$V = 10\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"v1v":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、$R$ にかかる電圧 $V$ です。","at":{"強調":1.0},"after":[],"emph":["V1","R1"]},{"text":"①単位をそろえる\n②オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V1","R1"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"キロは 1000 倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1"],"eq":[{"cont":false,"items":[["2\\,\\mathrm{k}\\Omega = 2000\\,\\Omega"]]}],"emphPre":["R1"]},{"text":"ミリは 1000 分の 1 です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I"],"eq":[{"cont":false,"items":[["5\\,\\mathrm{mA} = 0.005\\,\\mathrm{A}"]]}],"emphPre":["I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖そろえた $2000\\,\\Omega$ と $0.005\\,\\mathrm{A}$〗をオームの法則に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R1","I","V1"],"eq":[{"cont":false,"items":[["V = RI"],["V = 2000 \\times 0.005 = 10\\,\\mathrm{V}"]]}],"move":"vval","ans":true,"emphPre":["R1","I","V1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s5xxL","u45s5xxw1","zbu45s5xx0hi"],"zlo":["u45s5xxRw","u45s5xxw2","zbu45s5xx1lo"]},"moves":{"vval":{"to":{"v1v":1},"dur":0.4}},"route":["単位をそろえる","オームの法則"]}},{"id":"t45s6e","scene":"t45s6e","kind":"u45s6xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","i":"{I}","i1":"{I}_1","i2":"{I}_2"},"viewbox":"314 195 745 446","band":{"want":"電源から流れる電流 $I$","ans":"それぞれの道の電流の和"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①それぞれの道の電流\n②電流の和\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"並列なので、〖どちらの道にも電源の電圧 $E$〗がかかります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["src","R1","R2","I1","I2"],"eq":[{"cont":false,"items":[["I_1 = \\dfrac{E}{R_1}"],["I_2 = \\dfrac{E}{R_2}"]]}],"emphPre":["src","R1","R2","I1","I2"],"zb":true}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"〖この2つの電流が合わさって〗、電源の電流になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["I","I1","I2"],"eq":[{"cont":false,"items":[["I = I_1 + I_2"]]}],"ans":true,"emphPre":["I","I1","I2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s6xxL","u45s6xxw1","u45s6xxw3","u45s6xxw5","u45s6xxw7","zbu45s6xx0hi"],"zlo":["u45s6xxRw","u45s6xxw2","u45s6xxw4","u45s6xxw6","u45s6xxw8","zbu45s6xx1lo"]},"moves":{},"route":["それぞれの道の電流","電流の和"]}},{"id":"t45s6x","scene":"t45s6x","kind":"u45s6xx","lab":{"src":"{E}=12 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","i":["{I}","{I}=5 A"],"i1":["{I}_1","{I}_1=3 A"],"i2":["{I}_2","{I}_2=2 A"]},"viewbox":"314 195 745 446","band":{"want":"電源から流れる電流 $I$","known":"$E = 12\\,\\mathrm{V},\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 6\\,\\Omega$","ans":"$I = 5\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"iv":0,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、電源から流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①それぞれの道の電流\n②電流の和\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"並列なので、どちらの道にも $12\\,\\mathrm{V}$ がかかります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","R1","I1"],"eq":[{"cont":false,"items":[["I_1 = \\dfrac{E}{R_1}"],["I_1 = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"i1val","emphPre":["src","R1","I1"],"zb":true},{"text":"$R_2$ も同じです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R2","I2"],"eq":[{"cont":false,"items":[["I_2 = \\dfrac{E}{R_2}"],["I_2 = \\dfrac{12}{6} = 2\\,\\mathrm{A}"]]}],"move":"i2val","emphPre":["src","R2","I2"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"並列なので、〖電源の電流は2つの和〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","I1","I2"],"eq":[{"cont":false,"items":[["I = I_1 + I_2"],["I = 3 + 2 = 5\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["I","I1","I2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s6xxL","u45s6xxw1","u45s6xxw3","u45s6xxw5","u45s6xxw7","zbu45s6xx0hi"],"zlo":["u45s6xxRw","u45s6xxw2","u45s6xxw4","u45s6xxw6","u45s6xxw8","zbu45s6xx1lo"]},"moves":{"i1val":{"to":{"i1v":1},"dur":0.4},"i2val":{"to":{"i2v":1},"dur":0.4},"ival":{"to":{"iv":1},"dur":0.4}},"route":["それぞれの道の電流","電流の和"]}},{"id":"t45s7e","scene":"t45s7e","kind":"u45s7xx","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","v1":"{V}_1","v2":"{V}_2","i":"{I}"},"viewbox":"314 218 745 424","band":{"want":"回路の電流 $I$","ans":"引いた電圧と値の分かる抵抗でオームの法則"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①電圧の引き算\n②オームの法則\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列なので、〖電源の電圧は2つの電圧の和〗です。$V_1$ を引くと $V_2$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V_2 = E - V_1"]]}],"emphPre":["src","V1","V2"],"zb":true}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖$R_2$ の値が分かっているので〗、$R_2$ の電圧 $V_2$ で電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R2","V2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V_2}{R_2}"]]}],"ans":true,"emphPre":["R2","V2","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s7xxL","u45s7xxw1","zbu45s7xx0hi"],"zlo":["u45s7xxRw","u45s7xxw3","zbu45s7xx1lo"],"zmid":["u45s7xxw2","zbu45s7xx2mid"]},"moves":{},"route":["電圧の引き算","オームの法則"]}},{"id":"t45s7x","scene":"t45s7x","kind":"u45s7xx","lab":{"src":"{E}=30 V","r1":"{R}_1","r2":"{R}_2=4 Ω","v1":"{V}_1=18 V","v2":["{V}_2","{V}_2=12 V"],"i":["{I}","{I}=3 A"]},"viewbox":"314 218 745 424","band":{"want":"回路の電流 $I$","known":"$E = 30\\,\\mathrm{V},\\;\\; V_1 = 18\\,\\mathrm{V},\\;\\; R_2 = 4\\,\\Omega$","ans":"$I = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"v2v":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、回路の電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①電圧の引き算\n②オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列なので、電源の電圧から $V_1$ を引くと $V_2$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V_2 = E - V_1"],["V_2 = 30 - 18 = 12\\,\\mathrm{V}"]]}],"move":"v2val","emphPre":["src","V1","V2"],"zb":true}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"〖$R_2$ の値が分かっているので〗、この $12\\,\\mathrm{V}$ で電流を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R2","V2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V_2}{R_2}"],["I = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["R2","V2","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s7xxL","u45s7xxw1","zbu45s7xx0hi"],"zlo":["u45s7xxRw","u45s7xxw3","zbu45s7xx1lo"],"zmid":["u45s7xxw2","zbu45s7xx2mid"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4},"ival":{"to":{"iv":1},"dur":0.4}},"route":["電圧の引き算","オームの法則"]}},{"id":"t45s8e","scene":"t45s8e","kind":"u45s8ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i":"{I}"},"viewbox":"314 212 745 430","band":{"want":"電源の電圧","ans":"全体の合成抵抗 × 全体の電流","full":"電源から流れる電流 $I$ が分かっている時は、全体の合成抵抗を出し、$I$ を掛けると電源の電圧 $E$ になる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"電源から流れる電流 $I$ が分かっている時、電源の電圧 $E$ を求めます。","at":{"強調":1.0},"after":[],"emph":["I","src"]},{"text":"①全体の合成抵抗を出す\n②全体の電流を掛ける\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"全体の合成抵抗は、〖電源から見た抵抗〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3"]},{"text":"〖だから全体の電流 $I$ を掛けると、電源の電圧 $E$ になります〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["R1","R2","R3","I","src"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"par":["u45s8aew2","u45s8aew3","u45s8aew4","u45s8aew5","u45s8aew6","u45s8aew7","u45s8aej113","u45s8aej214"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s8aeL","u45s8aew1","zbu45s8ae0hi"],"zlo":["u45s8aeRw","u45s8aew3","u45s8aew5","u45s8aew7","u45s8aew9","zbu45s8ae1lo"],"zmid":["u45s8aew2","u45s8aew4","u45s8aew6","u45s8aew8","zbu45s8ae2mid"]},"moves":{},"route":["全体の合成抵抗","電流を掛ける"]}},{"id":"t45s8x","scene":"t45s8x","kind":"u45s8ax","lab":{"src":["{E}","{E}=20 V"],"r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","r23":"{R}_23=4 Ω","i":"{I}=2 A"},"viewbox":"314 212 745 430","band":{"want":"電源の電圧 $E$","known":"$R_1 = 6\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 6\\,\\Omega,\\;\\; I = 2\\,\\mathrm{A}$","ans":"$E = 20\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"am":0,"srcv":0},"steps":[{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"求めるのは、電源の電圧 $E$ です。","at":{"強調":1.0},"after":[],"emph":["src"]},{"text":"①並列をまとめる\n②全体の合成抵抗を出す\n③全体の電流を掛ける\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_2$ と $R_3$ は並列なので、和分の積でまとめます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R2","R3","R23"],"eq":[{"cont":false,"items":[["R_{23} = \\dfrac{R_2 R_3}{R_2 + R_3}"],["R_{23} = \\dfrac{12 \\times 6}{12 + 6} = 4\\,\\Omega"]]}],"move":"amerge","emphPre":["R2","R3"]},{"text":"〖この $R_{23}$ を次の直列に使います〗。","at":{"強調":1.0},"after":[],"emph":["R23"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と $R_{23}$ は直列なので、足すと全体の合成抵抗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R23"],"eq":[{"cont":false,"items":[["R_1 + R_{23} = 6 + 4 = 10\\,\\Omega"]]}],"emphPre":["R1","R23"]},{"text":"〖この $10\\,\\Omega$ が電源から見た抵抗なので、全体の電流を掛けます〗。","at":{"強調":1.0},"after":[],"emph":["R1","R23","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電源から流れる電流は $I = 2\\,\\mathrm{A}$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["src","R1","R23","I"],"eq":[{"cont":false,"items":[["E = (R_1 + R_{23}) I"],["E = 10 \\times 2 = 20\\,\\mathrm{V}"]]}],"move":"ev","ans":true,"emphPre":["src","R1","R23","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"par":["u45s8axw2","u45s8axw3","u45s8axw4","u45s8axw5","u45s8axw6","u45s8axw7","u45s8axj113","u45s8axj214"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R23":["r23","r23t0","r23t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s8axL","u45s8axw1","zbu45s8ax0hi"],"zlo":["u45s8axRw","u45s8axw11","zbu45s8ax1lo","u45s8axw3","u45s8axw5","u45s8axw7","zbu45s8ax3lo","u45s8axw9","zbu45s8ax5lo"],"zmid":["u45s8axw2","u45s8axw4","u45s8axw6","zbu45s8ax2mid","u45s8axw8","zbu45s8ax4mid","u45s8axw10","zbu45s8ax6mid"]},"moves":{"amerge":{"to":{"am":1},"dur":0.8},"ev":{"to":{"srcv":1},"dur":0.4}},"route":["並列をまとめる","全体の合成抵抗","電流を掛ける"]}},{"id":"t45s9e","scene":"t45s9e","kind":"u45s9ae","lab":{"ssrc":"{E}","sr1":"{R}_1","sr2":"{R}_2","sr3":"{R}_3","si1":"{I}_1","si2":"{I}_2"},"viewbox":"272 285 834 815","band":{"want":"図2の電流","ans":"図1で $E$ を出して図2へ持っていく","full":"同じ電源の2つの図では、変わらない物は電源の電圧 $E$ だけ。先に図1で $E$ を出し、その $E$ で図2を解く。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"同じ電源で、図1の $R_2$ を図2で $R_3$ に替えました。図2の電流 $I_2$ を求めます。","at":{"強調":1.0},"after":[],"emph":["R2","R3","SI2"]},{"text":"①図1で電源の電圧 $E$ を出す\n②図2で電流を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"図1と図2で変わらない物は、〖電源の電圧 $E$〗だけです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]},{"text":"抵抗が替わると、各抵抗にかかる電圧は変わります。〖だから先に図1で $E$ を出し、図2へ持っていきます〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["src","R1","R3"],"ans":true}]}],"groups":{"R1":["sr1","sr1t0","sr1t1","sr1x1","sr1x1t0","sr1x1t1"],"src":["cssrc:L","cssrc:S","ppssrc","pmssrc","essrc0","essrc1","cssrcx1:L","cssrcx1:S","ppssrcx1","pmssrcx1","essrcx10","essrcx11"],"SI1":["si1a","si1a:h","si1t0","si1t1"],"R2":["sr2","sr2t0","sr2t1"],"zhi":["u45s9aeL","u45s9aew4","zbu45s9ae0hi","u45s9aex1L","u45s9aex1w4","zbu45s9aex10hi"],"zmid":["u45s9aew2","u45s9aew6","zbu45s9ae1mid","u45s9aex1w2","u45s9aex1w6","zbu45s9aex11mid"],"zlo":["u45s9aew3","u45s9aew5","u45s9aew7","zbu45s9ae2lo","u45s9aex1w3","u45s9aex1w5","u45s9aex1w7","zbu45s9aex12lo"],"SI2":["si2x1a","si2x1a:h","si2x1t0","si2x1t1"],"R3":["sr3x1","sr3x1t0","sr3x1t1"]},"moves":{},"route":["図1で電源の電圧","図2で電流"]}},{"id":"t45s9x","scene":"t45s9x","kind":"u45s9ax","lab":{"ssrc":["{E}","{E}=60 V"],"sr1":"{R}_1=2 Ω","sr2":"{R}_2=10 Ω","sr3":"{R}_3=3 Ω","si1":"{I}_1=5 A","si2":["{I}_2","{I}_2=12 A"]},"viewbox":"272 285 834 815","band":{"want":"図2の電流 $I_2$","known":"$R_1 = 2\\,\\Omega,\\;\\; R_2 = 10\\,\\Omega,\\;\\; I_1 = 5\\,\\mathrm{A},\\;\\; R_3 = 3\\,\\Omega$","ans":"$I_2 = 12\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"ssrcv":0,"si2v":0},"steps":[{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"求めるのは、図2の電流 $I_2$ です。","at":{"強調":1.0},"after":[],"emph":["SI2"]},{"text":"①変わらない物を見つける\n②図1で電源の電圧を出す\n③図2へ持っていく\n④図2で電流を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["SI2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"図1と図2は同じ電源です。〖変わらない物は電源の電圧 $E$〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"図1は $R_1$ と $R_2$ の直列で、$I_1 = 5\\,\\mathrm{A}$ が流れています。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["src","R1","R2","SI1"],"eq":[{"cont":false,"items":[["E = (R_1 + R_2) I_1"],["E = (2 + 10) \\times 5 = 60\\,\\mathrm{V}"]]}],"move":"ev","emphPre":["src","R1","R2","SI1"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"この $60\\,\\mathrm{V}$ を図2へ持っていきます。図2の電源も $60\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["src"]},{"text":"図1で $R_2$ にかかっていた電圧は、図2では使いません。〖抵抗が替わると変わります〗。","at":{"強調":1.0},"after":[],"emph":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"図2は $R_1$ と $R_3$ の直列です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":4,"emph":["src","R1","R3","SI2"],"eq":[{"cont":false,"items":[["I_2 = \\dfrac{E}{R_1 + R_3}"],["I_2 = \\dfrac{60}{2 + 3} = 12\\,\\mathrm{A}"]]}],"move":"i2val","ans":true,"emphPre":["src","R1","R3","SI2"]}]}],"groups":{"R1":["sr1","sr1t0","sr1t1","sr1x1","sr1x1t0","sr1x1t1"],"src":["cssrc:L","cssrc:S","ppssrc","pmssrc","essrc0","essrc1","cssrcx1:L","cssrcx1:S","ppssrcx1","pmssrcx1","essrcx10","essrcx11"],"SI1":["si1a","si1a:h","si1t0","si1t1"],"R2":["sr2","sr2t0","sr2t1"],"zhi":["u45s9axL","u45s9axw4","zbu45s9ax0hi","u45s9axx1L","u45s9axx1w4","zbu45s9axx10hi"],"zmid":["u45s9axw2","u45s9axw6","zbu45s9ax1mid","u45s9axx1w2","u45s9axx1w6","zbu45s9axx11mid"],"zlo":["u45s9axw3","u45s9axw5","u45s9axw7","zbu45s9ax2lo","u45s9axx1w3","u45s9axx1w5","u45s9axx1w7","zbu45s9axx12lo"],"SI2":["si2x1a","si2x1a:h","si2x1t0","si2x1t1"],"R3":["sr3x1","sr3x1t0","sr3x1t1"]},"moves":{"ev":{"to":{"ssrcv":1},"dur":0.4},"i2val":{"to":{"si2v":1},"dur":0.4}},"route":["変わらない物","図1で電源の電圧","図2へ持っていく","図2で電流"]}},{"id":"t45s10e","scene":"t45s10e","kind":"u45s10ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3"},"viewbox":"447 179 612 466","band":{"want":"短絡のある回路の合成抵抗","ans":"短絡した部分を 0 Ω にしてから合成","full":"抵抗の両端が導線でつながっていると、その両端は同じ電位で電圧が0。抵抗に電流は流れないので、その部分は 0 Ω として合成する。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_2$ と $R_3$ の並列の両端が、導線でつながっています。","at":{"強調":1.0},"after":[],"emph":["par","R2","R3"]},{"text":"①短絡を見つける\n②残りで合成する\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["par"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"導線の両端は同じ電位です。〖並列の部分の電圧は 0 になり、$R_2$・$R_3$ に電流は流れません〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["par","R2","R3"],"zb":true},{"text":"〖だから並列の部分を 0 Ω にしてから、残りで合成します〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["R1"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"par":["u45s10aew2","u45s10aew3","u45s10aew4","u45s10aew5","u45s10aew6","u45s10aew7","u45s10aew8","u45s10aew9","u45s10aej115","u45s10aej216"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s10aeL","u45s10aew1","zbu45s10ae0hi"],"zlo":["u45s10aeRw","u45s10aew2","u45s10aew3","u45s10aew4","u45s10aew5","u45s10aew6","u45s10aew7","u45s10aew8","u45s10aew9","u45s10aew10","u45s10aew11","zbu45s10ae1lo"]},"moves":{},"route":["短絡を見つける","残りで合成"]}},{"id":"t45s10x","scene":"t45s10x","kind":"u45s10ax","lab":{"src":"{E}","r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=4 Ω"},"viewbox":"447 179 612 466","band":{"want":"全体の合成抵抗","known":"$R_1 = 6\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 4\\,\\Omega$","ans":"$6\\,\\Omega$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、全体の合成抵抗です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3"]},{"text":"①短絡を見つける\n②短絡した部分を 0 Ω にする\n③残りで合成する\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$R_3$ の両端が導線でつながっています。〖導線の両端は同じ電位です〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["par","R3"],"zb":true},{"text":"並列の部分は電圧が 0 なので、$R_2$ にも $R_3$ にも電流は流れません。","at":{"強調":1.0},"after":[],"emph":["par","R2","R3"],"zb":true}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"〖並列の部分は 0 Ω〗です。この値を次の直列に使います。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["par"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"残るのは $R_1$ だけです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["R1"],"eq":[{"cont":false,"items":[["R_1 + 0 = 6 + 0 = 6\\,\\Omega"]]}],"ans":true,"emphPre":["R1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"par":["u45s10axw2","u45s10axw3","u45s10axw4","u45s10axw5","u45s10axw6","u45s10axw7","u45s10axw8","u45s10axw9","u45s10axj115","u45s10axj216"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s10axL","u45s10axw1","zbu45s10ax0hi"],"zlo":["u45s10axRw","u45s10axw2","u45s10axw3","u45s10axw4","u45s10axw5","u45s10axw6","u45s10axw7","u45s10axw8","u45s10axw9","u45s10axw10","u45s10axw11","zbu45s10ax1lo"]},"moves":{},"route":["短絡を見つける","並列の部分は 0 Ω","残りで合成"]}},{"id":"t45s11e","scene":"t45s11e","kind":"u45s11ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","r4":"{R}_4","r5":"{R}_5"},"viewbox":"419 340 675 410","band":{"want":"ブリッジの合成抵抗","ans":"平衡を確かめ、真ん中を消してから合成","full":"向かい合う抵抗の積が等しければ平衡で、真ん中に電流は流れない。真ん中を消すと2つの道の並列になる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"ブリッジの全体の合成抵抗を求めます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R4","R5"]},{"text":"①平衡を確かめる\n②真ん中を消す\n③2つの道の並列で合成する\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","R3","R4","R5"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う抵抗の積が等しければ平衡です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R4","R2","R3"]},{"text":"〖平衡なら真ん中に電流が流れないので、消してから合成します〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["R5"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"I":["ia","ia:h","it0","it1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"R5":["r5","r5t0","r5t1"],"zhi":["u45s11aeL","u45s11aew3","u45s11aew5","u45s11aew7","u45s11aew11","zbu45s11ae0hi"],"zlo":["u45s11aew2","u45s11aew4","u45s11aew6","u45s11aew10","u45s11aew14","zbu45s11ae1lo"],"zmid":["u45s11aew8","u45s11aew9","u45s11aew15","zbu45s11ae2mid","u45s11aew12","u45s11aew13","u45s11aew16","zbu45s11ae3mid"]},"moves":{},"route":["平衡を確かめる","真ん中を消す","合成"]}},{"id":"t45s11x","scene":"t45s11x","kind":"u45s11ax","lab":{"src":"{E}","r1":"{R}_1=4 Ω","r2":"{R}_2=8 Ω","r3":"{R}_3=2 Ω","r4":"{R}_4=4 Ω","r5":"{R}_5=10 Ω"},"viewbox":"419 340 675 410","band":{"want":"全体の合成抵抗","known":"$R_1 = 4\\,\\Omega,\\;\\; R_2 = 8\\,\\Omega,\\;\\; R_3 = 2\\,\\Omega,\\;\\; R_4 = 4\\,\\Omega,\\;\\; R_5 = 10\\,\\Omega$","ans":"$4\\,\\Omega$"},"narr":{"start":{"co":1,"r5o":0},"steps":[{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"求めるのは、全体の合成抵抗です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R4","R5"]},{"text":"①平衡を確かめる\n②真ん中を消す\n③道の抵抗を出す\n④並列で合成する\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","R3","R4","R5"]}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"向かい合う抵抗の積を比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["R_2 R_3 = 8 \\times 2 = 16"],["R_1 R_4 = 4 \\times 4 = 16"]]}],"emphPre":["R1","R2","R3","R4"]},{"text":"等しいので平衡しています。〖真ん中の $R_5$ に電流は流れません〗。","at":{"強調":1.0},"after":[],"emph":["R5"],"zb":true}]},{"cap":null,"eqp":null,"vid":[7],"sents":[{"text":"〖電流の流れない $R_5$ は消してよい〗です。この形を次の合成に使います。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["R5"],"move":"r5off"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"残るのは2つの道です。それぞれ直列なので足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R3","R2","R4"],"eq":[{"cont":false,"items":[["R_1 + R_3 = 4 + 2 = 6\\,\\Omega"],["R_2 + R_4 = 8 + 4 = 12\\,\\Omega"]]}],"emphPre":["R1","R3","R2","R4"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"2つの道の並列なので、和分の積です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["R1","R2","R3","R4"],"eq":[{"cont":false,"items":[["\\dfrac{6 \\times 12}{6 + 12} = 4\\,\\Omega"]]}],"ans":true,"emphPre":["R1","R2","R3","R4"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"I":["ia","ia:h","it0","it1"],"R1":["r1","r1t0","r1t1"],"R3":["r3","r3t0","r3t1"],"R2":["r2","r2t0","r2t1"],"R4":["r4","r4t0","r4t1"],"R5":["r5","r5t0","r5t1"],"zhi":["u45s11axL","u45s11axw3","u45s11axw5","u45s11axw7","u45s11axw11","zbu45s11ax0hi"],"zlo":["u45s11axw2","u45s11axw4","u45s11axw6","u45s11axw10","u45s11axw14","zbu45s11ax1lo"],"zmid":["u45s11axw8","u45s11axw9","u45s11axw15","zbu45s11ax2mid","u45s11axw12","u45s11axw13","u45s11axw16","zbu45s11ax3mid"]},"moves":{"r5off":{"to":{"r5o":1},"dur":0.8}},"route":["平衡を確かめる","真ん中を消す","道の抵抗","並列で合成"]}},{"id":"t45s12e","scene":"t45s12e","kind":"u45s12ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","i1":"{I}_1","i2":"{I}_2"},"viewbox":"464 204 595 428","band":{"want":"2つの電流の比","ans":"割ると電源の電圧が消える","full":"並列の2つの抵抗は電圧が同じ。2つの電流の式を割ると電源の電圧が消えるので、電源の値が分からなくても比は出せる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"電源の電圧が分からない時、$I_1$ が $I_2$ の何倍かを求めます。","at":{"強調":1.0},"after":[],"emph":["I1","I2","src"]},{"text":"①同じ物を見つける\n②2つの式を割る\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"並列なので、$R_1$ と $R_2$ にかかる電圧は〖どちらも電源の電圧 $E$〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["par","src","R1","R2"]},{"text":"〖割ると同じ $E$ が消えるので、電源の値は要りません〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["I1","I2","src"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"par":["u45s12aew1","u45s12aew2","u45s12aew3","u45s12aew4","u45s12aew5","u45s12aew6","u45s12aej111","u45s12aej212"],"R1":["r1","r1t0","r1t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"zhi":["u45s12aeL","u45s12aew1","u45s12aew3","u45s12aew5","u45s12aew7","zbu45s12ae0hi"],"zlo":["u45s12aeRw","u45s12aew2","u45s12aew4","u45s12aew6","u45s12aew8","zbu45s12ae1lo"]},"moves":{},"route":["同じ物を見つける","割る"]}},{"id":"t45s12x","scene":"t45s12x","kind":"u45s12ax","lab":{"src":"{E}","r1":"{R}_1=10 Ω","r2":"{R}_2=40 Ω","i1":"{I}_1","i2":"{I}_2"},"viewbox":"464 204 595 428","band":{"want":"$I_1$ は $I_2$ の何倍か","known":"$R_1 = 10\\,\\Omega,\\;\\; R_2 = 40\\,\\Omega$","ans":"4 倍"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$I_1$ が $I_2$ の何倍かです。電源の電圧は分かりません。","at":{"強調":1.0},"after":[],"emph":["I1","I2","src"]},{"text":"①それぞれの電流の式を書く\n②割って電源の電圧を消す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[1,5],"sents":[{"text":"並列なので、どちらにも電源の電圧 $E$ がかかります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["src","R1","R2","I1","I2"],"eq":[{"cont":false,"items":[["I_1 = \\dfrac{E}{10}"],["I_2 = \\dfrac{E}{40}"]]}],"emphPre":["src","R1","R2","I1","I2"]},{"text":"〖この2つの式を次で割ります〗。","at":{"強調":1.0},"after":[],"emph":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"割ると $E$ が消えます。〖電源の値は要りません〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["I1","I2","src"],"eq":[{"cont":false,"items":[["\\dfrac{I_1}{I_2} = \\dfrac{E}{10} \\div \\dfrac{E}{40}"],["\\dfrac{I_1}{I_2} = \\dfrac{40}{10} = 4"]]}],"ans":true,"emphPre":["I1","I2","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"par":["u45s12axw1","u45s12axw2","u45s12axw3","u45s12axw4","u45s12axw5","u45s12axw6","u45s12axj111","u45s12axj212"],"R1":["r1","r1t0","r1t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"R2":["r2","r2t0","r2t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"zhi":["u45s12axL","u45s12axw1","u45s12axw3","u45s12axw5","u45s12axw7","zbu45s12ax0hi"],"zlo":["u45s12axRw","u45s12axw2","u45s12axw4","u45s12axw6","u45s12axw8","zbu45s12ax1lo"]},"moves":{},"route":["電流の式","割る"]}},{"id":"t45s13e","scene":"t45s13e","kind":"u45s13ae","lab":{"src":"{E}","r1":"{R}_1","r2":"{R}_2","i":"{I}"},"viewbox":"319 292 740 349","band":{"want":"直列の1つの抵抗の電力","ans":"先に電流を出してから $P = RI^2$","full":"直列の1つの抵抗にかかる電圧は、電源の電圧ではない。先に回路の電流を出し、その電流で電力を出す。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"直列の $R_2$ の電力を求めます。","at":{"強調":1.0},"after":[],"emph":["R2"]},{"text":"①回路の電流を出す\n②電力の式に入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","R2"]}]},{"cap":null,"eqp":null,"vid":[3,12],"sents":[{"text":"$R_2$ にかかる電圧は、電源の電圧 $E$ ではありません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R2","src"]},{"text":"〖直列なので、$R_2$ にも回路の電流 $I$ が流れます。だから先に $I$ を出します〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["I","R2"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s13aeL","u45s13aew1","zbu45s13ae0hi"],"zlo":["u45s13aeRw","u45s13aew3","zbu45s13ae1lo"],"zmid":["u45s13aew2","zbu45s13ae2mid"]},"moves":{},"route":["電流","電力"]}},{"id":"t45s13x","scene":"t45s13x","kind":"u45s13ax","lab":{"src":"{E}=30 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","i":["{I}","{I}=3 A"]},"viewbox":"319 292 740 349","band":{"want":"$R_2$ の電力","known":"$E = 30\\,\\mathrm{V},\\;\\; R_1 = 4\\,\\Omega,\\;\\; R_2 = 6\\,\\Omega$","ans":"$54\\,\\mathrm{W}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"求めるのは、$R_2$ の電力です。","at":{"強調":1.0},"after":[],"emph":["R2"]},{"text":"①回路の電流を出す\n②電力の式に入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","R2"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"$R_1$ と $R_2$ の直列なので、電流は次のとおりです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","R1","R2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{E}{R_1 + R_2}"],["I = \\dfrac{30}{4 + 6} = 3\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["src","R1","R2","I"]},{"text":"〖直列なので $R_2$ にも $3\\,\\mathrm{A}$ が流れます。この電流を電力の式に使います〗。","at":{"強調":1.0},"after":[],"emph":["R2","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電流と抵抗が分かっているので、電力は抵抗 × 電流の2乗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R2","I"],"eq":[{"cont":false,"items":[["R_2 I^2 = 6 \\times 3^2 = 54\\,\\mathrm{W}"]]}],"ans":true,"emphPre":["R2","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u45s13axL","u45s13axw1","zbu45s13ax0hi"],"zlo":["u45s13axRw","u45s13axw3","zbu45s13ax1lo"],"zmid":["u45s13axw2","zbu45s13ax2mid"]},"moves":{"ival":{"to":{"iv":1},"dur":0.4}},"route":["電流","電力"]}}],"secs":[{"ex":{"text":"図の回路で、$E = 24\\,\\mathrm{V}$、$R_1 = 2\\,\\Omega$、$R_2 = 6\\,\\Omega$、$R_3 = 12\\,\\Omega$ です。電源から流れる電流 $I$ は何 A ですか。","fig":{"kind":"u45s1xq","L":{"src":"{E}=24 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=12 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$1.2\\,\\mathrm{A}$","v":1.2,"why":"並列を足して合成した（並列の部分は和分の積）"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"$R_1$ を足さず、並列の部分だけで割った"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":""},{"t":"$3\\,\\mathrm{A}$","v":3,"why":"並列をまとめず、$R_2$ だけと直列にした"}],"ans":2}},{"ex":{"text":"図の回路で、$R_1 = 4\\,\\Omega$、$R_2 = 6\\,\\Omega$、$R_3 = 12\\,\\Omega$ です。矢印の電流 $I$ は $6\\,\\mathrm{A}$ です。$R_3$ に流れる電流は何 A ですか。","fig":{"kind":"u45s2xq","L":{"src":"{E}","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=12 Ω","i":"{I}=6 A"},"P":{}},"ch":[{"t":"$3\\,\\mathrm{A}$","v":3,"why":"$I$ を $R_2$ の道の電流と読んだ（矢印は電源の導線＝分かれる前）"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"分流の分子に自分の抵抗 $R_3$ を入れた"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"全体の電流のまま。分流していない"}],"ans":1}},{"ex":{"text":"図の回路で、$R_1 = 4\\,\\Omega$、$R_2 = 12\\,\\Omega$ です。全体の合成抵抗 $R$ は $8\\,\\Omega$ です。$R_x$ は何 Ω ですか。","fig":{"kind":"u45s3xq","L":{"src":"{E}","r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","rx":"{R}_x","rd":"{R}=8 Ω"},"P":{}},"ch":[{"t":"$24\\,\\Omega$","v":24,"why":"$R_1$ を引かずに、全体の $R$ を並列の式に入れた"},{"t":"$4\\,\\Omega$","v":4,"why":"並列の部分の合成抵抗で止めた"},{"t":"$6\\,\\Omega$","v":6,"why":""},{"t":"$8\\,\\Omega$","v":8,"why":"並列を差 $12 - 4$ で出した（逆数で解いていない）"}],"ans":2}},{"ex":{"text":"2つの抵抗 $R_a$・$R_b$ を直列にすると $25\\,\\Omega$、並列にすると $4\\,\\Omega$ になります。大きい方の抵抗は何 Ω ですか。","fig":{"kind":"u45s4xs","L":{"ra":"{R}_a","rb":"{R}_b"},"P":{}},"ch":[{"t":"$5\\,\\Omega$","v":5,"why":"小さい方を答えた"},{"t":"$12.5\\,\\Omega$","v":12.5,"why":"直列の値を半分にした（2つが等しいとした）"},{"t":"$20\\,\\Omega$","v":20,"why":""},{"t":"$100\\,\\Omega$","v":100,"why":"積で止めた（二次方程式を解いていない）"}],"ans":2}},{"ex":{"text":"図の回路で、抵抗 $R = 2\\,\\mathrm{k}\\Omega$ に電流 $I = 5\\,\\mathrm{mA}$ が流れています。$R$ にかかる電圧 $V$ は何 V ですか。","fig":{"kind":"u45s5xq","L":{"src":"{E}","r1":"{R}=2 kΩ","i":"{I}=5 mA","v1":"{V}"},"P":{}},"ch":[{"t":"$10000\\,\\mathrm{V}$","v":10000,"why":"mA を A に直していない"},{"t":"$10\\,\\mathrm{V}$","v":10,"why":""},{"t":"$0.01\\,\\mathrm{V}$","v":0.01,"why":"kΩ を Ω に直していない"},{"t":"$10000000\\,\\mathrm{V}$","v":10000000,"why":"kΩ と mA を両方とも逆に直した"}],"ans":1}},{"ex":{"text":"図の回路で、$E = 12\\,\\mathrm{V}$、$R_1 = 4\\,\\Omega$、$R_2 = 6\\,\\Omega$ です。電源から流れる電流 $I$ は何 A ですか。","fig":{"kind":"u45s6xq","L":{"src":"{E}=12 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","i":"{I}","i1":"{I}_1","i2":"{I}_2"},"P":{}},"ch":[{"t":"$1.2\\,\\mathrm{A}$","v":1.2,"why":"抵抗を足して割った（並列を直列と見た）"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":"$R_1$ の電流で止めた（和をとっていない）"},{"t":"$5\\,\\mathrm{A}$","v":5,"why":""},{"t":"$1\\,\\mathrm{A}$","v":1,"why":"2つの電流の差をとった"}],"ans":2}},{"ex":{"text":"図の回路で、$E = 30\\,\\mathrm{V}$、$R_2 = 4\\,\\Omega$ です。$R_1$ にかかる電圧は $18\\,\\mathrm{V}$ です。回路の電流 $I$ は何 A ですか。","fig":{"kind":"u45s7xq","L":{"src":"{E}=30 V","r1":"{R}_1","r2":"{R}_2=4 Ω","v1":"{V}_1=18 V","v2":"{V}_2","i":"{I}"},"P":{}},"ch":[{"t":"$7.5\\,\\mathrm{A}$","v":7.5,"why":"引かずに電源の電圧で割った"},{"t":"$4.5\\,\\mathrm{A}$","v":4.5,"why":"$R_1$ の電圧を $R_2$ に使った"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$12\\,\\mathrm{A}$","v":12,"why":"$R_2$ の電圧で止めた（オームの法則に入れていない）"}],"ans":2}},{"ex":{"text":"図のように、$R_1 = 6\\,\\Omega$ と、$R_2 = 12\\,\\Omega$ と $R_3 = 6\\,\\Omega$ の並列を直列につないだ。電源から流れる電流は $I = 2\\,\\mathrm{A}$ でした。電源の電圧 $E$ は何 V ですか。","fig":{"kind":"u45s8q","L":{"src":"{E}","r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","i":"{I}=2 A"},"P":{}},"ch":[{"t":"$48\\,\\mathrm{V}$","v":48,"why":"並列の部分を和分の積でまとめずに足した"},{"t":"$20\\,\\mathrm{V}$","v":20,"why":""},{"t":"$8\\,\\mathrm{V}$","v":8,"why":"直列の $R_1$ を足していない"},{"t":"$12\\,\\mathrm{V}$","v":12,"why":"$R_1$ にかかる電圧で止めた"}],"ans":1}},{"ex":{"text":"図1のように、$R_1 = 2\\,\\Omega$ と $R_2 = 10\\,\\Omega$ を直列にして電源につなぐと、電流 $I_1 = 5\\,\\mathrm{A}$ が流れました。図2のように、同じ電源で $R_2$ を $R_3 = 3\\,\\Omega$ に替えました。図2の電流 $I_2$ は何 A ですか。","fig":{"kind":"u45s9q","L":{"src":"{E}","r1":"{R}_1=2 Ω","r2":"{R}_2=10 Ω","r3":"{R}_3=3 Ω","i1":"{I}_1=5 A","i2":"{I}_2"},"P":{}},"ch":[{"t":"$5\\,\\mathrm{A}$","v":5,"why":"図1の電流のまま。電源の電圧を図2へ持っていっていない"},{"t":"$10\\,\\mathrm{A}$","v":10,"why":"図1で $R_2$ にかかっていた $50\\,\\mathrm{V}$ を図2でも使った"},{"t":"$12\\,\\mathrm{A}$","v":12,"why":""},{"t":"$20\\,\\mathrm{A}$","v":20,"why":"図2で $R_1$ を足していない"}],"ans":2}},{"ex":{"text":"図のように、$R_1 = 6\\,\\Omega$ と、$R_2 = 12\\,\\Omega$ と $R_3 = 4\\,\\Omega$ の並列を直列につなぎ、$R_3$ の両端を導線でつないだ。全体の合成抵抗は何 Ω ですか。","fig":{"kind":"u45s10q","L":{"src":"{E}","r1":"{R}_1=6 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=4 Ω"},"P":{}},"ch":[{"t":"$9\\,\\Omega$","v":9,"why":"短絡を見ずに、並列の部分も合成した"},{"t":"$18\\,\\Omega$","v":18,"why":"$R_3$ だけを消して $R_2$ を残した"},{"t":"$6\\,\\Omega$","v":6,"why":""},{"t":"$3\\,\\Omega$","v":3,"why":"並列の部分の値だけを答えた"}],"ans":2}},{"ex":{"text":"図のブリッジで、$R_1 = 4\\,\\Omega$、$R_2 = 8\\,\\Omega$、$R_3 = 2\\,\\Omega$、$R_4 = 4\\,\\Omega$、$R_5 = 10\\,\\Omega$ です。電源から見た全体の合成抵抗は何 Ω ですか。","fig":{"kind":"u45s11q","L":{"src":"{E}","r1":"{R}_1=4 Ω","r2":"{R}_2=8 Ω","r3":"{R}_3=2 Ω","r4":"{R}_4=4 Ω","r5":"{R}_5=10 Ω"},"P":{}},"ch":[{"t":"$18\\,\\Omega$","v":18,"why":"2つの道を直列に足した"},{"t":"$4\\,\\Omega$","v":4,"why":""},{"t":"$14\\,\\Omega$","v":14,"why":"電流の流れない $R_5$ を消さずに足した"},{"t":"$12\\,\\Omega$","v":12,"why":"$R_2$・$R_4$ の道だけを見た"}],"ans":1}},{"ex":{"text":"図のように、$R_1 = 10\\,\\Omega$ と $R_2 = 40\\,\\Omega$ を並列にして電源につないだ。$R_1$ の電流 $I_1$ は、$R_2$ の電流 $I_2$ の何倍ですか。","fig":{"kind":"u45s12q","L":{"src":"{E}","r1":"{R}_1=10 Ω","r2":"{R}_2=40 Ω","i1":"{I}_1","i2":"{I}_2"},"P":{}},"ch":[{"t":"$0.25\\,\\text{倍}$","v":0.25,"why":"比を逆にした"},{"t":"$1\\,\\text{倍}$","v":1,"why":"電圧が同じなので、電流も同じと考えた"},{"t":"$0.2\\,\\text{倍}$","v":0.2,"why":"分流の式 $\\dfrac{R_1}{R_1 + R_2}$ と混ぜた"},{"t":"$4\\,\\text{倍}$","v":4,"why":""}],"ans":3}},{"ex":{"text":"図のように、$E = 30\\,\\mathrm{V}$ の電源に $R_1 = 4\\,\\Omega$ と $R_2 = 6\\,\\Omega$ を直列につないだ。$R_2$ の電力は何 W ですか。","fig":{"kind":"u45s13q","L":{"src":"{E}=30 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$150\\,\\mathrm{W}$","v":150,"why":"電源の電圧のまま $\\dfrac{E^2}{R_2}$ にした（電流を出していない）"},{"t":"$36\\,\\mathrm{W}$","v":36,"why":"$R_1$ の電力を出した"},{"t":"$54\\,\\mathrm{W}$","v":54,"why":""},{"t":"$90\\,\\mathrm{W}$","v":90,"why":"回路全体の電力で止めた"}],"ans":2}}],"past":[]}};
});
