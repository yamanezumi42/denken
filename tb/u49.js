/* 単元49「静電気のつなぎ（3つ）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(49, function(H){
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
// ---- 49-1 層の中の電界 の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S1K = {
  xq: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,404],[300,404]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[316,352,"start",[0,-1]],[550,352,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":316,"y":352,"anc":"start"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,482,"start",[0,-1]],[550,482,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":316,"y":482,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,404],[800,404]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":318.72,"x1":510,"y1":385.28,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":318.72,"x1":580,"y1":385.28,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":318.72,"x1":650,"y1":385.28,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":318.72,"x1":720,"y1":385.28,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,352,"start",[1,0]],[492,352,"end",[-1,0]],[615,352,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[],"t":"F","x":738,"y":352,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,404],[984,404]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":404,"two":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,352,"start",[1,0]],[954,352,"end",[-1,0]]],"need":"t1","vis":[],"t":"F","x":986,"y":352,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":400,"x1":230,"y1":304,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,352,"end",[-1,0]],[246,352,"start",[1,0]]],"need":"v1","vis":[],"t":"F","x":64,"y":352,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":426,"x1":510,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":426,"x1":580,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":426,"x1":650,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":426,"x1":720,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,482,"start",[1,0]],[492,482,"end",[-1,0]],[615,482,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[],"t":"F","x":738,"y":482,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,404],[984,404]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":404,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,482,"start",[1,0]],[954,482,"end",[-1,0]]],"need":"t2","vis":[],"t":"F","x":986,"y":482,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":408,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,482,"end",[-1,0]],[246,482,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":64,"y":498,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  da: {"vars":[],"items":[{"f":"ln","id":"m1f","pts":[[300,305],[800,305],[800,430],[300,430]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m1t","k":"m1","bases":[[316,365,"start",[0,-1]],[550,365,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":316,"y":365,"anc":"start"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,495,"start",[0,-1]],[550,495,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":316,"y":495,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,430],[800,430]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":322,"x1":510,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":322,"x1":580,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":322,"x1":650,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":322,"x1":720,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,365,"start",[1,0]],[492,365,"end",[-1,0]],[615,365,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[],"t":"F","x":738,"y":365,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,430],[984,430]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":430,"two":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,365,"start",[1,0]],[954,365,"end",[-1,0]]],"need":"t1","vis":[],"t":"F","x":986,"y":365,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":426,"x1":230,"y1":304,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,365,"end",[-1,0]],[246,365,"start",[1,0]]],"need":"v1","vis":[],"t":"F","x":64,"y":357,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":452,"x1":510,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":452,"x1":580,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":452,"x1":650,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":452,"x1":720,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,495,"start",[1,0]],[492,495,"end",[-1,0]],[615,495,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[],"t":"F","x":738,"y":495,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,430],[984,430]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":430,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,495,"start",[1,0]],[954,495,"end",[-1,0]]],"need":"t2","vis":[],"t":"F","x":986,"y":495,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":434,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,495,"end",[-1,0]],[246,495,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":64,"y":503,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ad: {"vars":[],"items":[{"f":"lb","id":"m1t","k":"m1","bases":[[316,365,"start",[0,-1]],[550,365,"middle",[0,-1]]],"o":["medd"],"need":"m1","vis":[],"t":"F","x":316,"y":365,"anc":"start"},{"f":"ln","id":"m2f","pts":[[300,430],[800,430],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"vis":[],"t":"F"},{"f":"lb","id":"m2t","k":"m2","bases":[[316,495,"start",[0,-1]],[550,495,"middle",[0,-1]]],"o":["medd"],"need":"m2","vis":[],"t":"F","x":316,"y":495,"anc":"start"},{"f":"ln","id":"cut1","pts":[[300,430],[800,430]],"dash":1,"w":3,"o":["cutd"],"vis":[],"t":"F"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"need":"d","vis":[],"t":"F","x":906,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":80,"y0":560,"x1":80,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[68,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[68,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[48,430,"end",[-1,0]],[100,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":48,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e1_0","x0":510,"y0":322,"x1":510,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_1","x0":580,"y0":322,"x1":580,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_2","x0":650,"y0":322,"x1":650,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"ar","id":"e1_3","x0":720,"y0":322,"x1":720,"y1":408,"o":["ed"],"need":"e1","vis":[],"t":"F"},{"f":"lb","id":"e1t","k":"e1","bases":[[738,365,"start",[1,0]],[492,365,"end",[-1,0]],[615,365,"middle",[0,-1]]],"o":["ed"],"need":"e1","vis":[],"t":"F","x":738,"y":365,"anc":"start"},{"f":"ln","id":"t1e1","pts":[[816,300],[984,300]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ln","id":"t1e2","pts":[[816,430],[984,430]],"w":2,"need":"t1","vis":[],"t":"F"},{"f":"ar","id":"t1d","x0":970,"y0":300,"x1":970,"y1":430,"two":1,"w":2,"need":"t1","vis":[],"t":"F"},{"f":"lb","id":"t1t","k":"t1","bases":[[986,365,"start",[1,0]],[954,365,"end",[-1,0]]],"need":"t1","vis":[],"t":"F","x":986,"y":365,"anc":"start"},{"f":"ar","id":"v1a","x0":230,"y0":426,"x1":230,"y1":304,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[214,365,"end",[-1,0]],[246,365,"start",[1,0]]],"need":"v1","vis":[],"t":"F","x":64,"y":357,"anc":"end"},{"f":"ar","id":"e2_0","x0":510,"y0":452,"x1":510,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_1","x0":580,"y0":452,"x1":580,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_2","x0":650,"y0":452,"x1":650,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"ar","id":"e2_3","x0":720,"y0":452,"x1":720,"y1":538,"o":["ed"],"need":"e2","vis":[],"t":"F"},{"f":"lb","id":"e2t","k":"e2","bases":[[738,495,"start",[1,0]],[492,495,"end",[-1,0]],[615,495,"middle",[0,-1]]],"o":["ed"],"need":"e2","vis":[],"t":"F","x":738,"y":495,"anc":"start"},{"f":"ln","id":"t2e1","pts":[[816,430],[984,430]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ln","id":"t2e2","pts":[[816,560],[984,560]],"w":2,"need":"t2","vis":[],"t":"F"},{"f":"ar","id":"t2d","x0":970,"y0":430,"x1":970,"y1":560,"two":1,"w":2,"need":"t2","vis":[],"t":"F"},{"f":"lb","id":"t2t","k":"t2","bases":[[986,495,"start",[1,0]],[954,495,"end",[-1,0]]],"need":"t2","vis":[],"t":"F","x":986,"y":495,"anc":"start"},{"f":"ar","id":"v2a","x0":230,"y0":556,"x1":230,"y1":434,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[214,495,"end",[-1,0]],[246,495,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":64,"y":503,"anc":"end"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU49s1xq(d, p, L){ tbFig_Draw(d, p, L, U49S1K.xq); }
function tbU49s1da(d, p, L){ tbFig_Draw(d, p, L, U49S1K.da); }
function tbU49s1ad(d, p, L){ tbFig_Draw(d, p, L, U49S1K.ad); }
// ---- 49-2 直列で充電して並列につなぐ の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S2K = {
  xs: {"vars":[],"items":[{"t":"w","id":"u49s2xsL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s2xsRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s2xsw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u49s2xsw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u49s2xsw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,624.62,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,301.38,null],"fh":1,"f":"cap","F":66.6},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,418.62,null],"fh":1,"f":"cap","F":66.6},{"t":"cap","id":"u49s2xscap0","x":761.5,"y":749.93,"s":"図1","vis":[]},{"f":"ln","id":"zlx1","pts":[[1203,453],[1203,288],[1452,288]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"],"no":["mvq"]},{"f":"ln","id":"zrx1","pts":[[1524,288],[1773,288],[1773,453]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"],"no":["mvq"]},{"f":"ln","id":"zax1","pts":[[1203,453],[1203,288],[1773,288],[1773,453]],"w":16,"noobs":1,"o":["mvq"],"col":"#ffa8a8","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"zbx1","pts":[[1203,473],[1203,638],[1773,638],[1773,473]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wlx1","pts":[[1203,453],[1203,288],[1452,288]],"vis":[],"t":"F"},{"f":"ln","id":"wrx1","pts":[[1524,288],[1773,288],[1773,453]],"vis":[],"t":"F"},{"f":"ln","id":"wbx1","pts":[[1203,473],[1203,638],[1773,638],[1773,473]],"vis":[],"t":"F"},{"f":"ln","id":"c1x1","pts":[[1173,453],[1233,453]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:bx1","pts":[[1173,473],[1233,473]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2x1","pts":[[1743,453],[1803,453]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:bx1","pts":[[1743,473],[1803,473]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1tx1","k":"c1","bases":[[1247,463,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":1247,"y":519,"anc":"start","n":"c1x1"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[1729,463,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":1729,"y":407,"anc":"end","n":"c2x1"},{"f":"lb","id":"q1px1","k":"q1","bases":[[1247,411,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":1247,"y":411,"anc":"start","n":"q1x1"},{"f":"lb","id":"q1mx1","k":"q1","bases":[[1247,515,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":1247,"y":515,"anc":"start","n":"q1x1"},{"f":"lb","id":"q2px1","k":"q2","bases":[[1729,411,"end",[-1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":1729,"y":411,"anc":"end","n":"q2x1"},{"f":"lb","id":"q2mx1","k":"q2","bases":[[1729,515,"end",[-1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":1729,"y":515,"anc":"end","n":"q2x1"},{"f":"c","id":"swp0x1","cx":1452,"cy":288,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1x1","cx":1524,"cy":288,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"swx1","pts":[[1452,288],[1518,288]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swox1","pts":[[1452,288],[1514.35,252]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ar","id":"v1ax1","x0":1133,"y0":618,"x1":1133,"y1":308,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1tx1","k":"v1","bases":[[1117,463,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":1117,"y":463,"anc":"end","n":"v1x1"},{"f":"ar","id":"v2ax1","x0":1843,"y0":618,"x1":1843,"y1":308,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2tx1","k":"v2","bases":[[1859,463,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":1859,"y":463,"anc":"start","n":"v2x1"},{"f":"ln","id":"isox1","pts":[[1163,248],[1813,248],[1813,461],[1163,461]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ln","id":"iso2x1","pts":[[1163,465],[1813,465],[1813,678],[1163,678]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ar","id":"mq0x1","x0":1263,"y0":288,"x1":1289,"y1":288,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":1263,"x1":1289,"mv":[["mvq",370,0]]},"rl":{"x0":1713,"x1":1687,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq1x1","x0":1313,"y0":288,"x1":1339,"y1":288,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":1313,"x1":1339,"mv":[["mvq",370,0]]},"rl":{"x0":1663,"x1":1637,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq2x1","x0":1363,"y0":288,"x1":1389,"y1":288,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":1363,"x1":1389,"mv":[["mvq",370,0]]},"rl":{"x0":1613,"x1":1587,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"t":"cap","id":"u49s2xscap1","x":1488,"y":749.93,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","c1","L0:P","L0:n1",1,[]],["R","c2","L0:n1","L0:N",1,[]]]},
  xq: {"vars":[],"items":[{"t":"w","id":"u49s2xqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s2xqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s2xqw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u49s2xqw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u49s2xqw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,624.62,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,301.38,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,418.62,null],"fh":1,"f":"cap","F":27},{"t":"cap","id":"u49s2xqcap0","x":761.5,"y":736.93,"s":"図1","vis":[]},{"f":"ln","id":"zlx1","pts":[[1203,471.5],[1203,306.5],[1452,306.5]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"]},{"f":"ln","id":"zrx1","pts":[[1524,306.5],[1773,306.5],[1773,471.5]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"]},{"f":"ln","id":"zbx1","pts":[[1203,491.5],[1203,656.5],[1773,656.5],[1773,491.5]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wlx1","pts":[[1203,471.5],[1203,306.5],[1452,306.5]],"vis":[],"t":"F"},{"f":"ln","id":"wrx1","pts":[[1524,306.5],[1773,306.5],[1773,471.5]],"vis":[],"t":"F"},{"f":"ln","id":"wbx1","pts":[[1203,491.5],[1203,656.5],[1773,656.5],[1773,491.5]],"vis":[],"t":"F"},{"f":"ln","id":"c1x1","pts":[[1173,471.5],[1233,471.5]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:bx1","pts":[[1173,491.5],[1233,491.5]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2x1","pts":[[1743,471.5],[1803,471.5]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:bx1","pts":[[1743,491.5],[1803,491.5]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1tx1","k":"c1","bases":[[1247,481.5,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":1247,"y":481.5,"anc":"start","n":"c1x1"},{"f":"lb","id":"c2tx1","k":"c2","bases":[[1729,481.5,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":1729,"y":405.5,"anc":"end","n":"c2x1"},{"f":"lb","id":"q1px1","k":"q1","bases":[[1247,429.5,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":1247,"y":429.5,"anc":"start","n":"q1x1"},{"f":"lb","id":"q1mx1","k":"q1","bases":[[1247,533.5,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":1247,"y":533.5,"anc":"start","n":"q1x1"},{"f":"lb","id":"q2px1","k":"q2","bases":[[1729,429.5,"end",[-1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":1729,"y":429.5,"anc":"end","n":"q2x1"},{"f":"lb","id":"q2mx1","k":"q2","bases":[[1729,533.5,"end",[-1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":1729,"y":533.5,"anc":"end","n":"q2x1"},{"f":"c","id":"swp0x1","cx":1452,"cy":306.5,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1x1","cx":1524,"cy":306.5,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"swox1","pts":[[1452,306.5],[1514.35,270.5]],"w":4,"vis":[],"t":"F"},{"f":"ar","id":"v1ax1","x0":1133,"y0":636.5,"x1":1133,"y1":326.5,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1tx1","k":"v1","bases":[[1117,481.5,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":1117,"y":481.5,"anc":"end","n":"v1x1"},{"f":"ar","id":"v2ax1","x0":1843,"y0":636.5,"x1":1843,"y1":326.5,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2tx1","k":"v2","bases":[[1859,481.5,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":1859,"y":481.5,"anc":"start","n":"v2x1"},{"t":"cap","id":"u49s2xqcap1","x":1488,"y":736.93,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","c1","L0:P","L0:n1",1,[]],["R","c2","L0:n1","L0:N",1,[]]]}
};
function tbU49s2xs(d, p, L){ tbFig_Draw(d, p, L, U49S2K.xs); }
function tbU49s2xq(d, p, L){ tbFig_Draw(d, p, L, U49S2K.xq); }
// ---- 49-3 2つの回路のエネルギーを比べる の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S3K = {
  ps: {"vars":[],"items":[{"t":"w","id":"u49s3psL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s3psRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3psw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3psx1L","pts":[[1133,360],[1133,560],[1407,560]],"vis":[],"dash":0},{"t":"w","id":"u49s3psx1Rw","pts":[[1427,560],[1700,560],[1700,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3psx1w1","pts":[[1133,360],[1270.33,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3psx1w2","pts":[[1330.33,360],[1502.67,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3psx1w3","pts":[[1562.67,360],[1700,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,621.07,null]},{"t":"cap","k":"c1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,225.34,null],"fh":1,"f":"cap","F":59.8},{"t":"cap","k":"c2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,385.35,null],"fh":1,"f":"cap","F":59.8},{"t":"d","id":"u49s3psj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u49s3psj212","x":995,"y":360,"vis":[]},{"t":"cap","id":"u49s3pscap0","x":761.5,"y":722.77,"s":"図1","vis":[]},{"t":"e","k":"src2","dir":"h","xp":1407,"yp":560,"xm":1427,"ym":560,"vis":[],"side":1,"loop":1,"lab":[1417,621.07,null],"n":"src2x1"},{"t":"cap","k":"c1","x":1300.33,"y":360,"dir":"h","vis":[],"lab":[1300.33,305.35,null],"fh":1,"f":"cap","F":59.8,"n":"c1x1"},{"t":"cap","k":"c2","x":1532.67,"y":360,"dir":"h","vis":[],"lab":[1532.67,305.35,null],"fh":1,"f":"cap","F":59.8,"n":"c2x1"},{"t":"cap","id":"u49s3pscap1","x":1416.5,"y":722.77,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src","src2"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","c1","L0:P","L0:N",1,[]],["R","c2","L0:P","L0:N",1,[]],["E","src2","L1:P","L1:N",1,[]],["R","c1","L1:P","L1:n1",1,[]],["R","c2","L1:n1","L1:N",1,[]]]},
  sp: {"vars":[],"items":[{"t":"w","id":"u49s3spL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s3spRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3spw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3spw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3spw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1L","pts":[[1133,360],[1133,560],[1407,560]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1Rw","pts":[[1427,560],[1700,560],[1700,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w1","pts":[[1183,280],[1183,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w2","pts":[[1650,280],[1650,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w3","pts":[[1183,280],[1386.5,280]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w4","pts":[[1446.5,280],[1650,280]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w5","pts":[[1183,440],[1386.5,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w6","pts":[[1446.5,440],[1650,440]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w7","pts":[[1133,360],[1183,360]],"vis":[],"dash":0},{"t":"w","id":"u49s3spx1w8","pts":[[1650,360],[1700,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,621.07,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,305.35,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,305.35,null],"fh":1,"f":"cap","F":27},{"t":"cap","id":"u49s3spcap0","x":761.5,"y":722.77,"s":"図1","vis":[]},{"t":"e","k":"src2","dir":"h","xp":1407,"yp":560,"xm":1427,"ym":560,"vis":[],"side":1,"loop":1,"lab":[1417,621.07,null],"n":"src2x1"},{"t":"cap","k":"c1","x":1416.5,"y":280,"dir":"h","vis":[],"lab":[1416.5,225.34,null],"fh":1,"f":"cap","F":59.8,"n":"c1x1"},{"t":"cap","k":"c2","x":1416.5,"y":440,"dir":"h","vis":[],"lab":[1416.5,385.35,null],"fh":1,"f":"cap","F":59.8,"n":"c2x1"},{"t":"d","id":"u49s3spx1j111","x":1183,"y":360,"vis":[]},{"t":"d","id":"u49s3spx1j212","x":1650,"y":360,"vis":[]},{"t":"cap","id":"u49s3spcap1","x":1416.5,"y":722.77,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src","src2"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","c1","L0:P","L0:n1",1,[]],["R","c2","L0:n1","L0:N",1,[]],["E","src2","L1:P","L1:N",1,[]],["R","c1","L1:P","L1:N",1,[]],["R","c2","L1:P","L1:N",1,[]]]}
};
function tbU49s3ps(d, p, L){ tbFig_Draw(d, p, L, U49S3K.ps); }
function tbU49s3sp(d, p, L){ tbFig_Draw(d, p, L, U49S3K.sp); }
// ---- 49-4 極板の形から合成して電荷 の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S4K = {
  pa: {"vars":[],"items":[{"t":"w","id":"u49s4paL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s4paRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw1","pts":[[528,280],[528,440]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw2","pts":[[995,280],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw3","pts":[[528,280],[731.5,280]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw4","pts":[[791.5,280],[995,280]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw5","pts":[[528,440],[731.5,440]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw6","pts":[[791.5,440],[995,440]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw7","pts":[[478,360],[528,360]],"vis":[],"dash":0},{"t":"w","id":"u49s4paw8","pts":[[995,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":761.5,"y":280,"dir":"h","vis":[],"lab":[761.5,243.5,null],"fh":1,"f":"cap","F":28.4},{"t":"cap","k":"c2","x":761.5,"y":440,"dir":"h","vis":[],"lab":[761.5,403.5,null],"fh":1,"f":"cap","F":28.4},{"t":"d","id":"u49s4paj111","x":528,"y":360,"vis":[]},{"t":"d","id":"u49s4paj212","x":995,"y":360,"vis":[]}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","N",1,[]],["R","c2","P","N",1,[]]]},
  se: {"vars":[],"items":[{"t":"w","id":"u49s4seL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s4seRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s4sew1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u49s4sew2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u49s4sew3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,324.34,null],"fh":1,"f":"cap","F":27},{"t":"cap","k":"c2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,324.34,null],"fh":1,"f":"cap","F":27}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]}
};
function tbU49s4pa(d, p, L){ tbFig_Draw(d, p, L, U49S4K.pa); }
function tbU49s4se(d, p, L){ tbFig_Draw(d, p, L, U49S4K.se); }
// ---- 49-5 切り離して距離を変える の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S5K = {
  pe: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":550,"y":430,"anc":"middle"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":274,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":534,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":874,"y":404,"anc":"end"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":274,"y":264,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":768,"y":430,"anc":"start"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":364,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":471,"anc":"start"},"up":{"x":618,"y":337,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU49s5pe(d, p, L){ tbFig_Draw(d, p, L, U49S5K.pe); }
// ---- 49-6 直並列の電荷 の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S6K = {
  sq: {"vars":[],"items":[{"t":"w","id":"u49s6sqL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw1","pts":[[478,360],[572,360]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw2","pts":[[726,280],[726,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw3","pts":[[1006,280],[1006,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw4","pts":[[726,280],[836,280]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw5","pts":[[896,280],[1006,280]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw6","pts":[[726,440],[836,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw7","pts":[[896,440],[1006,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw8","pts":[[632,360],[726,360]],"vis":[],"dash":0},{"t":"w","id":"u49s6sqw9","pts":[[1006,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"cap","k":"c1","x":602,"y":360,"dir":"h","vis":[],"lab":[602,324.34,null],"fh":1,"q":"q1","f":"cap","F":27},{"t":"v","k":"v1","x":602,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1"},{"t":"cap","k":"c2","x":866,"y":280,"dir":"h","vis":[],"lab":[866,315.66,null],"fh":1,"f":"cap","F":27},{"t":"v","k":"v2","x":866,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[866,175.96,null]},{"t":"cap","k":"c3","x":866,"y":440,"dir":"h","vis":[],"lab":[866,404.34,null],"fh":1,"q":"q3","f":"cap","F":27},{"t":"d","id":"u49s6sqj115","x":726,"y":360,"vis":[]},{"t":"d","id":"u49s6sqj216","x":1006,"y":360,"vis":[]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]],["R","c3","n1","N",1,[]]]},
  sx: {"vars":[],"items":[{"t":"z","id":"zbu49s6sx0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[572,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu49s6sx1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[1006,360]],[[896,280],[1006,280],[1006,440],[896,440]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu49s6sx2mid","z":"mid","lines":[[[836,280],[726,280],[726,440],[836,440]],[[632,360],[726,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u49s6sxL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw1","pts":[[478,360],[572,360]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw2","pts":[[726,280],[726,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw3","pts":[[1006,280],[1006,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw4","pts":[[726,280],[836,280]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw5","pts":[[896,280],[1006,280]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw6","pts":[[726,440],[836,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw7","pts":[[896,440],[1006,440]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw8","pts":[[632,360],[726,360]],"vis":[],"dash":0},{"t":"w","id":"u49s6sxw9","pts":[[1006,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":602,"y":360,"dir":"h","vis":[],"lab":[602,323.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"v","k":"v1","x":602,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1"},{"t":"cap","k":"c2","x":866,"y":280,"dir":"h","vis":[],"lab":[866,316.5,null],"fh":1,"f":"cap","F":28.4},{"t":"v","k":"v2","x":866,"y":280,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[866,175.21,null]},{"t":"cap","k":"c3","x":866,"y":440,"dir":"h","vis":[],"lab":[866,403.5,null],"fh":1,"q":"q3","f":"cap","F":28.4},{"t":"d","id":"u49s6sxj115","x":726,"y":360,"vis":[]},{"t":"d","id":"u49s6sxj216","x":1006,"y":360,"vis":[]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]],["R","c3","n1","N",1,[]]]}
};
function tbU49s6sq(d, p, L){ tbFig_Draw(d, p, L, U49S6K.sq); }
function tbU49s6sx(d, p, L){ tbFig_Draw(d, p, L, U49S6K.sx); }
// ---- 49-7 2つの図のエネルギーを等しく置く の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s7.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S7K = {
  tq: {"vars":[],"items":[{"t":"w","id":"u49s7tqL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqw3","pts":[[478,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqw4","pts":[[478,360],[478,448]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqw5","pts":[[478,472],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqw6","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqw7","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1L","pts":[[1192,360],[1475.5,360]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w2","pts":[[1192,560],[1475.5,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w3","pts":[[1475.5,360],[1759,360]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w4","pts":[[1475.5,560],[1759,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w5","pts":[[1192,360],[1192,448]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w6","pts":[[1192,472],[1192,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w7","pts":[[1475.5,360],[1475.5,430]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w8","pts":[[1475.5,490],[1475.5,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w9","pts":[[1759,360],[1759,430]],"vis":[],"dash":0},{"t":"w","id":"u49s7tqx1w10","pts":[[1759,490],[1759,560]],"vis":[],"dash":0},{"t":"cap","k":"c1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,298.08,null],"fh":1,"f":"cap","F":27},{"t":"e","k":"src","dir":"v","xp":478,"yp":448,"xm":478,"ym":472,"vis":[],"side":-1,"lab":[518.34,460,"start"]},{"t":"cap","k":"c2","x":1045,"y":460,"dir":"v","vis":[],"lab":[1016.66,460,"end"],"fh":1,"f":"cap","F":27},{"t":"cap","id":"u49s7tqcap0","x":767,"y":645.05,"s":"図1","vis":[]},{"t":"e","k":"src2","dir":"v","xp":1192,"yp":448,"xm":1192,"ym":472,"vis":[],"side":-1,"lab":[1232.34,460,"start"],"n":"src2x1"},{"t":"cap","k":"c1","x":1475.5,"y":460,"dir":"v","vis":[],"lab":[1503.84,460,"start"],"fh":1,"f":"cap","F":72.3,"n":"c1x1"},{"t":"cap","k":"c2","x":1759,"y":460,"dir":"v","vis":[],"lab":[1787.34,460,"start"],"fh":1,"f":"cap","F":72.3,"n":"c2x1"},{"t":"d","id":"u49s7tqx1j4","x":1475.5,"y":360,"vis":[]},{"t":"d","id":"u49s7tqx1j7","x":1475.5,"y":560,"vis":[]},{"t":"cap","id":"u49s7tqcap1","x":1553,"y":645.05,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src","src2"],"bands":"never","pts":[],"net":[["R","c1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","c2","L0:n2","L0:n3",1,[]],["E","src2","L1:n1","L1:n4",1,[]],["R","c1","L1:n1","L1:n4",1,[]],["R","c2","L1:n1","L1:n4",1,[]]]},
  tx: {"vars":[],"items":[{"t":"z","id":"zbu49s7tx0hi","z":"hi","lines":[[[731.5,360],[478,360],[478,448]]],"vis":[],"pts":[],"node":"L0:n1"},{"t":"z","id":"zbu49s7tx1mid","z":"mid","lines":[[[791.5,360],[1045,360],[1045,430]]],"vis":[],"pts":[],"node":"L0:n2"},{"t":"z","id":"zbu49s7tx2lo","z":"lo","lines":[[[478,472],[478,560],[1045,560],[1045,490]]],"vis":[],"pts":[],"node":"L0:n3"},{"t":"z","id":"zbu49s7txx10hi","z":"hi","lines":[[[761.5,722],[478,722],[478,810]],[[761.5,722],[1045,722],[1045,792]],[[761.5,722],[761.5,792]]],"vis":[],"pts":[],"node":"L1:n1"},{"t":"z","id":"zbu49s7txx11lo","z":"lo","lines":[[[761.5,922],[478,922],[478,834]],[[761.5,922],[1045,922],[1045,852]],[[761.5,852],[761.5,922]]],"vis":[],"pts":[],"node":"L1:n4"},{"t":"w","id":"u49s7txL","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u49s7txw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u49s7txw3","pts":[[478,560],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7txw4","pts":[[478,360],[478,448]],"vis":[],"dash":0},{"t":"w","id":"u49s7txw5","pts":[[478,472],[478,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7txw6","pts":[[1045,360],[1045,430]],"vis":[],"dash":0},{"t":"w","id":"u49s7txw7","pts":[[1045,490],[1045,560]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1L","pts":[[478,722],[761.5,722]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w2","pts":[[478,922],[761.5,922]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w3","pts":[[761.5,722],[1045,722]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w4","pts":[[761.5,922],[1045,922]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w5","pts":[[478,722],[478,810]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w6","pts":[[478,834],[478,922]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w7","pts":[[761.5,722],[761.5,792]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w8","pts":[[761.5,852],[761.5,922]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w9","pts":[[1045,722],[1045,792]],"vis":[],"dash":0},{"t":"w","id":"u49s7txx1w10","pts":[[1045,852],[1045,922]],"vis":[],"dash":0},{"t":"cap","k":"c1","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,319.04,null],"fh":1,"f":"cap","F":36.1},{"t":"e","k":"src","dir":"v","xp":478,"yp":448,"xm":478,"ym":472,"vis":[],"side":-1,"lab":[516.17,460,"start"]},{"t":"cap","k":"c2","x":1045,"y":460,"dir":"v","vis":[],"lab":[1018.83,460,"end"],"fh":1,"f":"cap","F":36.1},{"t":"cap","id":"u49s7txcap0","x":767,"y":604.82,"s":"図1","vis":[]},{"t":"e","k":"src2","dir":"v","xp":478,"yp":810,"xm":478,"ym":834,"vis":[],"side":-1,"lab":[516.17,822,"start"],"n":"src2x1"},{"t":"cap","k":"c1","x":761.5,"y":822,"dir":"v","vis":[],"lab":[787.67,822,"start"],"fh":1,"f":"cap","F":36.1,"n":"c1x1"},{"t":"cap","k":"c2","x":1045,"y":822,"dir":"v","vis":[],"lab":[1024.83,782,"end"],"fh":1,"f":"cap","F":36.1,"n":"c2x1"},{"t":"d","id":"u49s7txx1j4","x":761.5,"y":722,"vis":[]},{"t":"d","id":"u49s7txx1j7","x":761.5,"y":922,"vis":[]},{"t":"cap","id":"u49s7txcap1","x":767,"y":974.82,"s":"図2","vis":[]}],"flows":[],"base":110,"von":["src","src2"],"bands":"volt","pts":[],"net":[["R","c1","L0:n1","L0:n2",1,[]],["E","src","L0:n1","L0:n3",1,[]],["R","c2","L0:n2","L0:n3",1,[]],["E","src2","L1:n1","L1:n4",1,[]],["R","c1","L1:n1","L1:n4",1,[]],["R","c2","L1:n1","L1:n4",1,[]]]}
};
function tbU49s7tq(d, p, L){ tbFig_Draw(d, p, L, U49S7K.tq); }
function tbU49s7tx(d, p, L){ tbFig_Draw(d, p, L, U49S7K.tx); }
// ---- 49-8 一直線上で力が 0 になる電荷 の図（※ textbook/gen/make_section.py が textbook/gen/data/u49_s8.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U49S8K = {
  l31: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":244,"y":356,"anc":"start"},{"f":"c","id":"q0c","cx":710,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[681.5,371.5],[738.5,371.5],[738.5,428.5],[681.5,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":710,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[710,340,"middle",[0,-1]],[754,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":710,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":226,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[710,468,"middle",[0,1]],[670,452,"end",[-1,1]],[750,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":684,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":854,"y":480,"anc":"middle"},{"f":"ar","id":"f1a","x0":674,"y0":386,"x1":564,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":674,"y0":386,"x1":564,"y1":386},"out":{"x0":746,"y0":386,"x1":856,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[619,356,"middle",[0,-1]],[619,416,"middle",[0,1]],[548,386,"end",[-1,0]]],"vbases":{"in":[[619,356,"middle",[0,-1]],[619,416,"middle",[0,1]],[548,386,"end",[-1,0]]],"out":[[801,356,"middle",[0,-1]],[801,416,"middle",[0,1]],[872,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":619,"y":350,"anc":"middle"},"out":{"x":761,"y":344,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":619,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":746,"y0":414,"x1":856,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":746,"y0":414,"x1":856,"y1":414},"out":{"x0":674,"y0":414,"x1":564,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[801,384,"middle",[0,-1]],[801,444,"middle",[0,1]],[872,414,"start",[1,0]]],"vbases":{"in":[[801,384,"middle",[0,-1]],[801,444,"middle",[0,1]],[872,414,"start",[1,0]]],"out":[[619,384,"middle",[0,-1]],[619,444,"middle",[0,1]],[548,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":801,"y":488,"anc":"middle"},"out":{"x":548,"y":406,"anc":"end"}},"dflt":"out","vis":[],"t":"F","x":801,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":746,"y0":444,"x1":896,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":746,"y0":444,"x1":896,"y1":444},"left":{"x0":674,"y0":444,"x1":524,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[821,414,"middle",[0,-1]],[821,474,"middle",[0,1]],[912,444,"start",[1,0]]],"vbases":{"right":[[821,414,"middle",[0,-1]],[821,474,"middle",[0,1]],[912,444,"start",[1,0]]],"left":[[599,414,"middle",[0,-1]],[599,474,"middle",[0,1]],[508,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":821,"y":414,"anc":"middle"},"left":{"x":599,"y":414,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":821,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[710,436],[710,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":710,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[455,590,"middle",[0,1]],[455,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":455,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[710,436],[710,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":710,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[795,590,"middle",[0,1]],[795,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":795,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  l21: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":244,"y":356,"anc":"start"},{"f":"c","id":"q0c","cx":653.33,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[624.83,371.5],[681.83,371.5],[681.83,428.5],[624.83,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":653.33,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[653.33,340,"middle",[0,-1]],[697.33,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":653.33,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":226,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[653.33,468,"middle",[0,1]],[613.33,452,"end",[-1,1]],[693.33,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":627.33,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":906,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":617.33,"y0":386,"x1":507.33,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":617.33,"y0":386,"x1":507.33,"y1":386},"out":{"x0":689.33,"y0":386,"x1":799.33,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[562.33,356,"middle",[0,-1]],[562.33,416,"middle",[0,1]],[491.33,386,"end",[-1,0]]],"vbases":{"in":[[562.33,356,"middle",[0,-1]],[562.33,416,"middle",[0,1]],[491.33,386,"end",[-1,0]]],"out":[[744.33,356,"middle",[0,-1]],[744.33,416,"middle",[0,1]],[815.33,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":562.33,"y":350,"anc":"middle"},"out":{"x":744.33,"y":350,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":562.33,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":689.33,"y0":414,"x1":799.33,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":689.33,"y0":414,"x1":799.33,"y1":414},"out":{"x0":617.33,"y0":414,"x1":507.33,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[744.33,384,"middle",[0,-1]],[744.33,444,"middle",[0,1]],[815.33,414,"start",[1,0]]],"vbases":{"in":[[744.33,384,"middle",[0,-1]],[744.33,444,"middle",[0,1]],[815.33,414,"start",[1,0]]],"out":[[562.33,384,"middle",[0,-1]],[562.33,444,"middle",[0,1]],[491.33,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":744.33,"y":488,"anc":"middle"},"out":{"x":491.33,"y":406,"anc":"end"}},"dflt":"out","vis":[],"t":"F","x":744.33,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":689.33,"y0":444,"x1":839.33,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":689.33,"y0":444,"x1":839.33,"y1":444},"left":{"x0":617.33,"y0":444,"x1":467.33,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[764.33,414,"middle",[0,-1]],[764.33,474,"middle",[0,1]],[855.33,444,"start",[1,0]]],"vbases":{"right":[[764.33,414,"middle",[0,-1]],[764.33,474,"middle",[0,1]],[855.33,444,"start",[1,0]]],"left":[[542.33,414,"middle",[0,-1]],[542.33,474,"middle",[0,1]],[451.33,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":764.33,"y":414,"anc":"middle"},"left":{"x":542.33,"y":414,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":764.33,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[653.33,436],[653.33,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":653.33,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[426.67,590,"middle",[0,1]],[426.67,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":426.67,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[653.33,436],[653.33,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":653.33,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[766.67,590,"middle",[0,1]],[766.67,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":766.67,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  l12: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":246.83,"y":341.86,"anc":"start"},{"f":"c","id":"q0c","cx":426.67,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[398.17,371.5],[455.17,371.5],[455.17,428.5],[398.17,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":426.67,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[426.67,340,"middle",[0,-1]],[470.67,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":434.67,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":174,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[426.67,468,"middle",[0,1]],[386.67,452,"end",[-1,1]],[466.67,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":400.67,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":854,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":390.67,"y0":386,"x1":280.67,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":390.67,"y0":386,"x1":280.67,"y1":386},"out":{"x0":462.67,"y0":386,"x1":572.67,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[335.67,356,"middle",[0,-1]],[335.67,416,"middle",[0,1]],[264.67,386,"end",[-1,0]]],"vbases":{"in":[[335.67,356,"middle",[0,-1]],[335.67,416,"middle",[0,1]],[264.67,386,"end",[-1,0]]],"out":[[517.67,356,"middle",[0,-1]],[517.67,416,"middle",[0,1]],[588.67,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":335.67,"y":296,"anc":"middle"},"out":{"x":517.67,"y":350,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":335.67,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":462.67,"y0":414,"x1":572.67,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":462.67,"y0":414,"x1":572.67,"y1":414},"out":{"x0":390.67,"y0":414,"x1":280.67,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[517.67,384,"middle",[0,-1]],[517.67,444,"middle",[0,1]],[588.67,414,"start",[1,0]]],"vbases":{"in":[[517.67,384,"middle",[0,-1]],[517.67,444,"middle",[0,1]],[588.67,414,"start",[1,0]]],"out":[[335.67,384,"middle",[0,-1]],[335.67,444,"middle",[0,1]],[264.67,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":588.67,"y":406,"anc":"start"},"out":{"x":335.67,"y":488,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":517.67,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":462.67,"y0":444,"x1":612.67,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":462.67,"y0":444,"x1":612.67,"y1":444},"left":{"x0":390.67,"y0":444,"x1":240.67,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[537.67,414,"middle",[0,-1]],[537.67,474,"middle",[0,1]],[628.67,444,"start",[1,0]]],"vbases":{"right":[[537.67,414,"middle",[0,-1]],[537.67,474,"middle",[0,1]],[628.67,444,"start",[1,0]]],"left":[[315.67,414,"middle",[0,-1]],[315.67,474,"middle",[0,1]],[224.67,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":537.67,"y":414,"anc":"middle"},"left":{"x":315.67,"y":414,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":537.67,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[426.67,436],[426.67,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":426.67,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[313.33,590,"middle",[0,1]],[313.33,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":313.33,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[426.67,436],[426.67,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":426.67,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[653.33,590,"middle",[0,1]],[653.33,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":653.33,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  l13: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":246.83,"y":341.86,"anc":"start"},{"f":"c","id":"q0c","cx":370,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[341.5,371.5],[398.5,371.5],[398.5,428.5],[341.5,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":370,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[370,340,"middle",[0,-1]],[414,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":433.8,"y":347.51,"anc":"start"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":226,"y":480,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[370,468,"middle",[0,1]],[330,452,"end",[-1,1]],[410,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":344,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":854,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":334,"y0":386,"x1":224,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":334,"y0":386,"x1":224,"y1":386},"out":{"x0":406,"y0":386,"x1":516,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[279,356,"middle",[0,-1]],[279,416,"middle",[0,1]],[208,386,"end",[-1,0]]],"vbases":{"in":[[279,356,"middle",[0,-1]],[279,416,"middle",[0,1]],[208,386,"end",[-1,0]]],"out":[[461,356,"middle",[0,-1]],[461,416,"middle",[0,1]],[532,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":223,"y":336,"anc":"middle"},"out":{"x":477,"y":350,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":279,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":406,"y0":414,"x1":516,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":406,"y0":414,"x1":516,"y1":414},"out":{"x0":334,"y0":414,"x1":224,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[461,384,"middle",[0,-1]],[461,444,"middle",[0,1]],[532,414,"start",[1,0]]],"vbases":{"in":[[461,384,"middle",[0,-1]],[461,444,"middle",[0,1]],[532,414,"start",[1,0]]],"out":[[279,384,"middle",[0,-1]],[279,444,"middle",[0,1]],[208,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":532,"y":406,"anc":"start"},"out":{"x":279,"y":488,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":461,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":406,"y0":444,"x1":556,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":406,"y0":444,"x1":556,"y1":444},"left":{"x0":334,"y0":444,"x1":184,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[481,414,"middle",[0,-1]],[481,474,"middle",[0,1]],[572,444,"start",[1,0]]],"vbases":{"right":[[481,414,"middle",[0,-1]],[481,474,"middle",[0,1]],[572,444,"start",[1,0]]],"left":[[259,414,"middle",[0,-1]],[259,474,"middle",[0,1]],[168,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":481,"y":414,"anc":"middle"},"left":{"x":259,"y":414,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":481,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[370,436],[370,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":370,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[285,590,"middle",[0,1]],[285,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":285,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[370,436],[370,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":370,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[625,590,"middle",[0,1]],[625,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":625,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  l11: {"vars":[],"items":[{"f":"c","id":"qac","cx":200,"cy":400,"r":30,"fill":"w","sk":"qas","sel":"qas","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qam","pts":[[171.5,371.5],[228.5,371.5],[228.5,428.5],[171.5,428.5]],"w":3,"close":1,"sel":"qas","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qamt","x":200,"y":401,"s":"N","anc":"middle","size":33,"sel":"qas","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qat","k":"qa","bases":[[200,340,"middle",[0,-1]],[244,356,"start",[1,-1]]],"need":"qa","vis":[],"t":"F","x":248.24,"y":351.76,"anc":"start"},{"f":"c","id":"q0c","cx":540,"cy":400,"r":30,"fill":"w","sk":"q0s","sel":"q0s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q0m","pts":[[511.5,371.5],[568.5,371.5],[568.5,428.5],[511.5,428.5]],"w":3,"close":1,"sel":"q0s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q0mt","x":540,"y":401,"s":"N","anc":"middle","size":33,"sel":"q0s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q0t","k":"q0","bases":[[540,340,"middle",[0,-1]],[584,356,"start",[1,-1]]],"need":"q0","vis":[],"t":"F","x":540,"y":340,"anc":"middle"},{"f":"c","id":"qbc","cx":880,"cy":400,"r":30,"fill":"w","sk":"qbs","sel":"qbs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qbm","pts":[[851.5,371.5],[908.5,371.5],[908.5,428.5],[851.5,428.5]],"w":3,"close":1,"sel":"qbs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qbmt","x":880,"y":401,"s":"N","anc":"middle","size":33,"sel":"qbs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qbt","k":"qb","bases":[[880,340,"middle",[0,-1]],[924,356,"start",[1,-1]]],"need":"qb","vis":[],"t":"F","x":880,"y":340,"anc":"middle"},{"f":"lb","id":"nat","k":"na","bases":[[200,468,"middle",[0,1]],[160,452,"end",[-1,1]],[240,452,"start",[1,1]]],"need":"na","vis":[],"t":"F","x":226,"y":468,"anc":"middle"},{"f":"lb","id":"n0t","k":"n0","bases":[[540,468,"middle",[0,1]],[500,452,"end",[-1,1]],[580,452,"start",[1,1]]],"need":"n0","vis":[],"t":"F","x":514,"y":480,"anc":"middle"},{"f":"lb","id":"nbt","k":"nb","bases":[[880,468,"middle",[0,1]],[840,452,"end",[-1,1]],[920,452,"start",[1,1]]],"need":"nb","vis":[],"t":"F","x":854,"y":468,"anc":"middle"},{"f":"ar","id":"f1a","x0":504,"y0":386,"x1":394,"y1":386,"need":"f1","sel":"f1a","var":{"in":{"x0":504,"y0":386,"x1":394,"y1":386},"out":{"x0":576,"y0":386,"x1":686,"y1":386}},"dflt":"out","gr":"f1d","vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[449,356,"middle",[0,-1]],[449,416,"middle",[0,1]],[378,386,"end",[-1,0]]],"vbases":{"in":[[449,356,"middle",[0,-1]],[449,416,"middle",[0,1]],[378,386,"end",[-1,0]]],"out":[[631,356,"middle",[0,-1]],[631,416,"middle",[0,1]],[702,386,"start",[1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":449,"y":350,"anc":"middle"},"out":{"x":631,"y":350,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":449,"y":356,"anc":"middle"},{"f":"ar","id":"f2a","x0":576,"y0":414,"x1":686,"y1":414,"need":"f2","sel":"f2a","var":{"in":{"x0":576,"y0":414,"x1":686,"y1":414},"out":{"x0":504,"y0":414,"x1":394,"y1":414}},"dflt":"out","gr":"f2d","vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[631,384,"middle",[0,-1]],[631,444,"middle",[0,1]],[702,414,"start",[1,0]]],"vbases":{"in":[[631,384,"middle",[0,-1]],[631,444,"middle",[0,1]],[702,414,"start",[1,0]]],"out":[[449,384,"middle",[0,-1]],[449,444,"middle",[0,1]],[378,414,"end",[-1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":702,"y":406,"anc":"start"},"out":{"x":378,"y":406,"anc":"end"}},"dflt":"out","vis":[],"t":"F","x":631,"y":384,"anc":"middle"},{"f":"ar","id":"fa","x0":576,"y0":444,"x1":726,"y1":444,"need":"f","sel":"fa","var":{"right":{"x0":576,"y0":444,"x1":726,"y1":444},"left":{"x0":504,"y0":444,"x1":354,"y1":444}},"dflt":"right","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[651,414,"middle",[0,-1]],[651,474,"middle",[0,1]],[742,444,"start",[1,0]]],"vbases":{"right":[[651,414,"middle",[0,-1]],[651,474,"middle",[0,1]],[742,444,"start",[1,0]]],"left":[[429,414,"middle",[0,-1]],[429,474,"middle",[0,1]],[338,444,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"right":{"x":651,"y":414,"anc":"middle"},"left":{"x":429,"y":414,"anc":"middle"}},"dflt":"right","vis":[],"t":"F","x":651,"y":414,"anc":"middle"},{"f":"ln","id":"rae1","pts":[[200,436],[200,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ln","id":"rae2","pts":[[540,436],[540,564]],"w":2,"need":"ra","vis":[],"t":"F"},{"f":"ar","id":"rad","x0":200,"y0":550,"x1":540,"y1":550,"two":1,"w":2,"need":"ra","vis":[],"t":"F"},{"f":"lb","id":"rat","k":"ra","bases":[[370,590,"middle",[0,1]],[370,510,"middle",[0,-1]]],"need":"ra","vis":[],"t":"F","x":370,"y":590,"anc":"middle"},{"f":"ln","id":"rbe1","pts":[[540,436],[540,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ln","id":"rbe2","pts":[[880,436],[880,564]],"w":2,"need":"rb","vis":[],"t":"F"},{"f":"ar","id":"rbd","x0":540,"y0":550,"x1":880,"y1":550,"two":1,"w":2,"need":"rb","vis":[],"t":"F"},{"f":"lb","id":"rbt","k":"rb","bases":[[710,590,"middle",[0,1]],[710,510,"middle",[0,-1]]],"need":"rb","vis":[],"t":"F","x":710,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU49s8l31(d, p, L){ tbFig_Draw(d, p, L, U49S8K.l31); }
function tbU49s8l21(d, p, L){ tbFig_Draw(d, p, L, U49S8K.l21); }
function tbU49s8l12(d, p, L){ tbFig_Draw(d, p, L, U49S8K.l12); }
function tbU49s8l13(d, p, L){ tbFig_Draw(d, p, L, U49S8K.l13); }
function tbU49s8l11(d, p, L){ tbFig_Draw(d, p, L, U49S8K.l11); }
var KINDS = {u49s1xq: tbU49s1xq, u49s1da: tbU49s1da, u49s1ad: tbU49s1ad, u49s2xs: tbU49s2xs, u49s2xq: tbU49s2xq, u49s3ps: tbU49s3ps, u49s3sp: tbU49s3sp, u49s4pa: tbU49s4pa, u49s4se: tbU49s4se, u49s5pe: tbU49s5pe, u49s6sq: tbU49s6sq, u49s6sx: tbU49s6sx, u49s7tq: tbU49s7tq, u49s7tx: tbU49s7tx, u49s8l31: tbU49s8l31, u49s8l21: tbU49s8l21, u49s8l12: tbU49s8l12, u49s8l13: tbU49s8l13, u49s8l11: tbU49s8l11};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 49-1 の図は電流が流れないので載せない,
  // 49-2 の図は電流が流れないので載せない,
  // 49-3 の図は電流が流れないので載せない,
  // 49-4 の図は電流が流れないので載せない,
  // 49-5 の図は電流が流れないので載せない,
  // 49-6 の図は電流が流れないので載せない,
  // 49-7 の図は電流が流れないので載せない,
  // 49-8 の図は電流が流れないので載せない
};

// 49-1 層の中の電界 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s1_par(a, b){ return a * b / (a + b); }
function tbU49s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s1_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s1_Qea(r){
  var gcd = tbU49s1_gcd, ratio = tbU49s1_ratio, par = tbU49s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,8,10]);
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var m = pick(r, [2,4,5,10,20]);
    var V = (m * (n1 + er * n2));
    var dd = (n1 / 10);
    var da = (n2 / 10);
    var Va = (m * (n1 + er * n2) * er * n2 / (n1 + er * n2));
    var Vd = (m * (n1 + er * n2) * n1 / (n1 + er * n2));
    var cA = (er * n2 / gcd(er * n2, n1));
    var cB = (n1 / gcd(er * n2, n1));
    if (!(n1 != n2 && V >= 100 && V <= 1000 && abs((10 * V / (n1 + n2)) * 10 - Math.round((10 * V / (n1 + n2)) * 10)) < 1e-9 && abs((10 * V / n2) * 10 - Math.round((10 * V / n2) * 10)) < 1e-9)) continue;
    var ok = (Va / da);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s1_three4(ok, [{x: (10 * V / (n1 + n2)), why: "層に分けず、全部の電圧を全部の距離で割った", w: 0, cut: 1}, {x: (Va), why: "空気の部分の電圧で止めた（厚さで割っていない）", w: 1, cut: 1}, {x: (10 * V / n2), why: "分圧せず、全部の電圧が空気の部分にかかるとした", w: 2, cut: 1}, {x: (Vd / da), why: "誘電体の部分の電圧を使った（逆比の取り違え）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{V/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s1ea", text: "極板の間に、厚さ $" + fmt(dd) + "\\,\\mathrm{m}$・比誘電率 $" + fmt(er) + "$ の誘電体と、厚さ $" + fmt(da) + "\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間の電圧は $" + qv(V, "V") + "$ です。空気の部分の電界の強さ $E$ は何 V/m ですか。", fig: {kind: "u49s1da", L: tbU49s1_fig({"top":"","bot":""}, [["m1", "{ε}_r=" + fmt(er)], ["m2", "空気"], ["t1", fmt(dd) + " m"], ["t2", fmt(da) + " m"], ["e2", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["層は直列。$C_{\\text{誘}} : C_{\\text{空}} = \\dfrac{" + fmt(er) + "}{" + fmt(dd) + "} : \\dfrac{1}{" + fmt(da) + "} = " + fmt(cA) + " : " + fmt(cB) + "$。電圧はこの逆比で分かれる", "空気の部分の電圧 $V_{\\text{空}} = " + fmt(V) + " \\times \\dfrac{" + fmt(cA) + "}{" + fmt(cA) + " + " + fmt(cB) + "} = " + qv(Va, "V") + "$", "この電圧を空気の厚さで割る　$E = \\dfrac{" + fmt(Va) + "}{" + fmt(da) + "} = " + fmt(ok) + "\\,\\mathrm{V/m}" + "$"], chk: {form: "u49s1ea", p: {V: V, er: er, n1: n1, n2: n2}}};
  }
  throw new Error("u49s1ea：条件に合う数字が見つからない");
}
function tbU49s1_Qeb(r){
  var gcd = tbU49s1_gcd, ratio = tbU49s1_ratio, par = tbU49s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,8,10]);
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var m = pick(r, [2,4,5,10,20]);
    var V = (m * (n1 + er * n2));
    var dd = (n1 / 10);
    var da = (n2 / 10);
    var Va = (m * (n1 + er * n2) * er * n2 / (n1 + er * n2));
    var Vd = (m * (n1 + er * n2) * n1 / (n1 + er * n2));
    var cA = (er * n2 / gcd(er * n2, n1));
    var cB = (n1 / gcd(er * n2, n1));
    if (!(n1 != n2 && V >= 100 && V <= 1000 && abs((10 * V / (n1 + n2)) * 10 - Math.round((10 * V / (n1 + n2)) * 10)) < 1e-9 && abs((10 * V / n2) * 10 - Math.round((10 * V / n2) * 10)) < 1e-9)) continue;
    var ok = (Va / da);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s1_three4(ok, [{x: (10 * V / (n1 + n2)), why: "層に分けず、全部の電圧を全部の距離で割った", w: 0, cut: 1}, {x: (Va), why: "空気の部分の電圧で止めた（厚さで割っていない）", w: 1, cut: 1}, {x: (10 * V / n2), why: "分圧せず、全部の電圧が空気の部分にかかるとした", w: 2, cut: 1}, {x: (Vd / da), why: "誘電体の部分の電圧を使った（逆比の取り違え）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{V/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s1eb", text: "極板の間に、厚さ $" + fmt(dd) + "\\,\\mathrm{m}$・比誘電率 $" + fmt(er) + "$ の誘電体と、厚さ $" + fmt(da) + "\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間の電圧は $" + qv(V, "V") + "$ です。空気の部分の電界の強さ $E$ は何 V/m ですか。", fig: {kind: "u49s1ad", L: tbU49s1_fig({"top":"","bot":""}, [["m2", "{ε}_r=" + fmt(er)], ["m1", "空気"], ["t2", fmt(dd) + " m"], ["t1", fmt(da) + " m"], ["e1", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["層は直列。$C_{\\text{誘}} : C_{\\text{空}} = \\dfrac{" + fmt(er) + "}{" + fmt(dd) + "} : \\dfrac{1}{" + fmt(da) + "} = " + fmt(cA) + " : " + fmt(cB) + "$。電圧はこの逆比で分かれる", "空気の部分の電圧 $V_{\\text{空}} = " + fmt(V) + " \\times \\dfrac{" + fmt(cA) + "}{" + fmt(cA) + " + " + fmt(cB) + "} = " + qv(Va, "V") + "$", "この電圧を空気の厚さで割る　$E = \\dfrac{" + fmt(Va) + "}{" + fmt(da) + "} = " + fmt(ok) + "\\,\\mathrm{V/m}" + "$"], chk: {form: "u49s1eb", p: {V: V, er: er, n1: n1, n2: n2}}};
  }
  throw new Error("u49s1eb：条件に合う数字が見つからない");
}
function tbU49s1_Qda(r){
  var gcd = tbU49s1_gcd, ratio = tbU49s1_ratio, par = tbU49s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,8,10]);
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var m = pick(r, [2,4,5,10,20]);
    var V = (m * (n1 + er * n2));
    var dd = (n1 / 10);
    var da = (n2 / 10);
    var Va = (m * (n1 + er * n2) * er * n2 / (n1 + er * n2));
    var Vd = (m * (n1 + er * n2) * n1 / (n1 + er * n2));
    var cA = (er * n2 / gcd(er * n2, n1));
    var cB = (n1 / gcd(er * n2, n1));
    if (!(n1 != n2 && V >= 100 && V <= 1000 && abs((10 * V / (n1 + n2)) * 10 - Math.round((10 * V / (n1 + n2)) * 10)) < 1e-9 && abs((10 * V / n1) * 10 - Math.round((10 * V / n1) * 10)) < 1e-9 && abs((10 * Va / n1) * 10 - Math.round((10 * Va / n1) * 10)) < 1e-9)) continue;
    var ok = (Vd / dd);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s1_three4(ok, [{x: (10 * V / (n1 + n2)), why: "層に分けず、全部の電圧を全部の距離で割った", w: 0, cut: 1}, {x: (Vd), why: "誘電体の部分の電圧で止めた（厚さで割っていない）", w: 1, cut: 1}, {x: (10 * V / n1), why: "分圧せず、全部の電圧が誘電体の部分にかかるとした", w: 2, cut: 1}, {x: (Va / dd), why: "空気の部分の電圧を使った（逆比の取り違え）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{V/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s1da", text: "極板の間に、厚さ $" + fmt(dd) + "\\,\\mathrm{m}$・比誘電率 $" + fmt(er) + "$ の誘電体と、厚さ $" + fmt(da) + "\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間の電圧は $" + qv(V, "V") + "$ です。誘電体の部分の電界の強さ $E$ は何 V/m ですか。", fig: {kind: "u49s1da", L: tbU49s1_fig({"top":"","bot":""}, [["m1", "{ε}_r=" + fmt(er)], ["m2", "空気"], ["t1", fmt(dd) + " m"], ["t2", fmt(da) + " m"], ["e1", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["層は直列。$C_{\\text{誘}} : C_{\\text{空}} = \\dfrac{" + fmt(er) + "}{" + fmt(dd) + "} : \\dfrac{1}{" + fmt(da) + "} = " + fmt(cA) + " : " + fmt(cB) + "$。電圧はこの逆比で分かれる", "誘電体の部分の電圧 $V_{\\text{誘}} = " + fmt(V) + " \\times \\dfrac{" + fmt(cB) + "}{" + fmt(cA) + " + " + fmt(cB) + "} = " + qv(Vd, "V") + "$", "この電圧を誘電体の厚さで割る　$E = \\dfrac{" + fmt(Vd) + "}{" + fmt(dd) + "} = " + fmt(ok) + "\\,\\mathrm{V/m}" + "$"], chk: {form: "u49s1da", p: {V: V, er: er, n1: n1, n2: n2}}};
  }
  throw new Error("u49s1da：条件に合う数字が見つからない");
}
function tbU49s1_Qdb(r){
  var gcd = tbU49s1_gcd, ratio = tbU49s1_ratio, par = tbU49s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,8,10]);
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var m = pick(r, [2,4,5,10,20]);
    var V = (m * (n1 + er * n2));
    var dd = (n1 / 10);
    var da = (n2 / 10);
    var Va = (m * (n1 + er * n2) * er * n2 / (n1 + er * n2));
    var Vd = (m * (n1 + er * n2) * n1 / (n1 + er * n2));
    var cA = (er * n2 / gcd(er * n2, n1));
    var cB = (n1 / gcd(er * n2, n1));
    if (!(n1 != n2 && V >= 100 && V <= 1000 && abs((10 * V / (n1 + n2)) * 10 - Math.round((10 * V / (n1 + n2)) * 10)) < 1e-9 && abs((10 * V / n1) * 10 - Math.round((10 * V / n1) * 10)) < 1e-9 && abs((10 * Va / n1) * 10 - Math.round((10 * Va / n1) * 10)) < 1e-9)) continue;
    var ok = (Vd / dd);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s1_three4(ok, [{x: (10 * V / (n1 + n2)), why: "層に分けず、全部の電圧を全部の距離で割った", w: 0, cut: 1}, {x: (Vd), why: "誘電体の部分の電圧で止めた（厚さで割っていない）", w: 1, cut: 1}, {x: (10 * V / n1), why: "分圧せず、全部の電圧が誘電体の部分にかかるとした", w: 2, cut: 1}, {x: (Va / dd), why: "空気の部分の電圧を使った（逆比の取り違え）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "1", ok, _w);
    _c.ch.forEach(function(c){ c.t = "$" + fmt(c.v) + "\\,\\mathrm{V/m}" + "$"; });
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s1db", text: "極板の間に、厚さ $" + fmt(dd) + "\\,\\mathrm{m}$・比誘電率 $" + fmt(er) + "$ の誘電体と、厚さ $" + fmt(da) + "\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間の電圧は $" + qv(V, "V") + "$ です。誘電体の部分の電界の強さ $E$ は何 V/m ですか。", fig: {kind: "u49s1ad", L: tbU49s1_fig({"top":"","bot":""}, [["m2", "{ε}_r=" + fmt(er)], ["m1", "空気"], ["t2", fmt(dd) + " m"], ["t1", fmt(da) + " m"], ["e2", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["層は直列。$C_{\\text{誘}} : C_{\\text{空}} = \\dfrac{" + fmt(er) + "}{" + fmt(dd) + "} : \\dfrac{1}{" + fmt(da) + "} = " + fmt(cA) + " : " + fmt(cB) + "$。電圧はこの逆比で分かれる", "誘電体の部分の電圧 $V_{\\text{誘}} = " + fmt(V) + " \\times \\dfrac{" + fmt(cB) + "}{" + fmt(cA) + " + " + fmt(cB) + "} = " + qv(Vd, "V") + "$", "この電圧を誘電体の厚さで割る　$E = \\dfrac{" + fmt(Vd) + "}{" + fmt(dd) + "} = " + fmt(ok) + "\\,\\mathrm{V/m}" + "$"], chk: {form: "u49s1db", p: {V: V, er: er, n1: n1, n2: n2}}};
  }
  throw new Error("u49s1db：条件に合う数字が見つからない");
}
function tbU49s1_Qra(r){
  var gcd = tbU49s1_gcd, ratio = tbU49s1_ratio, par = tbU49s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,8,10]);
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var m = pick(r, [2,4,5,10,20]);
    var V = (m * (n1 + er * n2));
    var dd = (n1 / 10);
    var da = (n2 / 10);
    var Va = (m * (n1 + er * n2) * er * n2 / (n1 + er * n2));
    var Vd = (m * (n1 + er * n2) * n1 / (n1 + er * n2));
    var cA = (er * n2 / gcd(er * n2, n1));
    var cB = (n1 / gcd(er * n2, n1));
    if (!(n1 != n2 && abs((1 / er) * 100 - Math.round((1 / er) * 100)) < 1e-9 && abs((er * n2 / n1) * 100 - Math.round((er * n2 / n1) * 100)) < 1e-9 && distinct([er, er * n2 / n1, 1, 1 / er]))) continue;
    var ok = ((Va / da) / (Vd / dd));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s1_three4(ok, [{x: (er * n2 / n1), why: "電圧の比で止めた（厚さで割っていない）", w: 0, cut: 1}, {x: (1), why: "層に分けず、どちらも同じ電界とした", w: 1, cut: 1}, {x: (1 / er), why: "比を逆にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s1ra", text: "極板の間に、厚さ $" + fmt(dd) + "\\,\\mathrm{m}$・比誘電率 $" + fmt(er) + "$ の誘電体と、厚さ $" + fmt(da) + "\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間に電圧をかけました。空気の部分の電界の強さは、誘電体の部分の電界の強さの何倍ですか。", fig: {kind: "u49s1da", L: tbU49s1_fig({"top":"","bot":""}, [["m1", "{ε}_r=" + fmt(er)], ["m2", "空気"], ["t1", fmt(dd) + " m"], ["t2", fmt(da) + " m"], ["e2", "{E}_2"], ["e1", "{E}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["層は直列。$C_{\\text{誘}} : C_{\\text{空}} = \\dfrac{" + fmt(er) + "}{" + fmt(dd) + "} : \\dfrac{1}{" + fmt(da) + "} = " + fmt(cA) + " : " + fmt(cB) + "$。電圧はこの逆比で分かれる（$V_{\\text{空}} : V_{\\text{誘}} = " + fmt(cA) + " : " + fmt(cB) + "$）", "それぞれ厚さで割る　$E_{\\text{空}} : E_{\\text{誘}} = \\dfrac{" + fmt(cA) + "}{" + fmt(da) + "} : \\dfrac{" + fmt(cB) + "}{" + fmt(dd) + "}$", "$\\dfrac{E_{\\text{空}}}{E_{\\text{誘}}} = " + qv(ok, "X") + "$"], chk: {form: "u49s1ra", p: {er: er, n1: n1, n2: n2}}};
  }
  throw new Error("u49s1ra：条件に合う数字が見つからない");
}
function tbU49s1_Qrb(r){
  var gcd = tbU49s1_gcd, ratio = tbU49s1_ratio, par = tbU49s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,6,8,10]);
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var m = pick(r, [2,4,5,10,20]);
    var V = (m * (n1 + er * n2));
    var dd = (n1 / 10);
    var da = (n2 / 10);
    var Va = (m * (n1 + er * n2) * er * n2 / (n1 + er * n2));
    var Vd = (m * (n1 + er * n2) * n1 / (n1 + er * n2));
    var cA = (er * n2 / gcd(er * n2, n1));
    var cB = (n1 / gcd(er * n2, n1));
    if (!(n1 != n2 && abs((1 / er) * 100 - Math.round((1 / er) * 100)) < 1e-9 && abs((er * n2 / n1) * 100 - Math.round((er * n2 / n1) * 100)) < 1e-9 && distinct([er, er * n2 / n1, 1, 1 / er]))) continue;
    var ok = ((Va / da) / (Vd / dd));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s1_three4(ok, [{x: (er * n2 / n1), why: "電圧の比で止めた（厚さで割っていない）", w: 0, cut: 1}, {x: (1), why: "層に分けず、どちらも同じ電界とした", w: 1, cut: 1}, {x: (1 / er), why: "比を逆にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s1rb", text: "極板の間に、厚さ $" + fmt(dd) + "\\,\\mathrm{m}$・比誘電率 $" + fmt(er) + "$ の誘電体と、厚さ $" + fmt(da) + "\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間に電圧をかけました。空気の部分の電界の強さは、誘電体の部分の電界の強さの何倍ですか。", fig: {kind: "u49s1ad", L: tbU49s1_fig({"top":"","bot":""}, [["m2", "{ε}_r=" + fmt(er)], ["m1", "空気"], ["t2", fmt(dd) + " m"], ["t1", fmt(da) + " m"], ["e1", "{E}_1"], ["e2", "{E}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["層は直列。$C_{\\text{誘}} : C_{\\text{空}} = \\dfrac{" + fmt(er) + "}{" + fmt(dd) + "} : \\dfrac{1}{" + fmt(da) + "} = " + fmt(cA) + " : " + fmt(cB) + "$。電圧はこの逆比で分かれる（$V_{\\text{空}} : V_{\\text{誘}} = " + fmt(cA) + " : " + fmt(cB) + "$）", "それぞれ厚さで割る　$E_{\\text{空}} : E_{\\text{誘}} = \\dfrac{" + fmt(cA) + "}{" + fmt(da) + "} : \\dfrac{" + fmt(cB) + "}{" + fmt(dd) + "}$", "$\\dfrac{E_{\\text{空}}}{E_{\\text{誘}}} = " + qv(ok, "X") + "$"], chk: {form: "u49s1rb", p: {er: er, n1: n1, n2: n2}}};
  }
  throw new Error("u49s1rb：条件に合う数字が見つからない");
}
// 49-2 直列で充電して並列につなぐ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s2_par(a, b){ return a * b / (a + b); }
function tbU49s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s2_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s2_Qv(r){
  var gcd = tbU49s2_gcd, ratio = tbU49s2_ratio, par = tbU49s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var m = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var g = (gcd(C1 * C2, C1 + C2));
    var V = (m * (C1 + C2) / gcd(C1 * C2, C1 + C2));
    var Cs = (C1 * C2 / (C1 + C2));
    var Q = (C1 * C2 * m / gcd(C1 * C2, C1 + C2));
    var Cp = (C1 + C2);
    var V2 = (2 * C1 * C2 * m / gcd(C1 * C2, C1 + C2) / (C1 + C2));
    if (!(C1 != C2 && V >= 10 && V <= 1000 && abs((V2) * 10 - Math.round((V2) * 10)) < 1e-9 && abs((Q / Cp) * 10 - Math.round((Q / Cp) * 10)) < 1e-9 && abs((Q / C2) * 10 - Math.round((Q / C2) * 10)) < 1e-9 && abs((Q / C1) * 10 - Math.round((Q / C1) * 10)) < 1e-9)) continue;
    var ok = (V2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s2_three4(ok, [{x: (Q / Cp), why: "電荷を1つ分しか足さなかった（合計は 2Q）", w: 0, cut: 1}, {x: (Q / C2), why: "並列の合成をせず、$C_2$ だけで割った", w: 1, cut: 1}, {x: (Q / C1), why: "つなぐ前の $C_1$ の電圧のまま（つないだ後を求めていない）", w: 2, cut: 1}, {x: (V), why: "つなぎ替えても電圧は変わらないとした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s2v", text: "図1のように、$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(C2) + "\\,\\mu\\mathrm{F}$ を直列にして、$" + qv(V, "V") + "$ で充電しました。電源から切り離し、図2のように同じ極性どうしをつなぎ、スイッチ S を閉じました。つないだ後の電圧は何 V ですか。", fig: {kind: "u49s2xq", L: tbU49s2_fig({"sw":"S"}, [["c1", "{C}_1=" + fmt(C1) + " μF"], ["c2", "{C}_2=" + fmt(C2) + " μF"], ["src", "{E}=" + qf(V, "V")], ["sw", "S"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列の合成 $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$、電荷 $Q = " + fmt(Cs) + " \\times " + fmt(V) + " = " + fmt(Q) + "\\,\\mu\\mathrm{C}$（直列なので2つとも同じ）", "つないでも電荷の合計 $2Q = " + fmt(2 * Q) + "\\,\\mu\\mathrm{C}$ は変わらない。並列の合成 $" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$", "この合計を並列の静電容量で割る　$V' = \\dfrac{" + fmt(2 * Q) + "}{" + fmt(Cp) + "} = " + qv(ok, "V") + "$"], chk: {form: "u49s2v", p: {C1: C1, C2: C2, V: V}}};
  }
  throw new Error("u49s2v：条件に合う数字が見つからない");
}
function tbU49s2_Qq(r){
  var gcd = tbU49s2_gcd, ratio = tbU49s2_ratio, par = tbU49s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var m = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var k = pick(r, [1,2]);
    var g = (gcd(C1 * C2, C1 + C2));
    var V = (m * (C1 + C2) / gcd(C1 * C2, C1 + C2));
    var Cs = (C1 * C2 / (C1 + C2));
    var Q = (C1 * C2 * m / gcd(C1 * C2, C1 + C2));
    var Cp = (C1 + C2);
    var V2 = (2 * C1 * C2 * m / gcd(C1 * C2, C1 + C2) / (C1 + C2));
    var Ck = (k == 1 ? C1 : C2);
    var Co = (k == 1 ? C2 : C1);
    if (!(C1 != C2 && V >= 10 && V <= 1000 && abs((V2) * 10 - Math.round((V2) * 10)) < 1e-9 && abs((Ck * V2) * 10 - Math.round((Ck * V2) * 10)) < 1e-9 && abs((Ck * Q / Cp) * 10 - Math.round((Ck * Q / Cp) * 10)) < 1e-9 && abs((Co * V2) * 10 - Math.round((Co * V2) * 10)) < 1e-9)) continue;
    var ok = (Ck * V2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s2_three4(ok, [{x: (Q), why: "つなぐ前の電荷のまま（つないだ後に分け直していない）", w: 0, cut: 1}, {x: (2 * Q), why: "電荷の合計で止めた（2つに分けていない）", w: 1, cut: 1}, {x: (Ck * Q / Cp), why: "電荷を1つ分しか足さなかった（合計は 2Q）", w: 2, cut: 1}, {x: (Co * V2), why: "もう一方の静電容量を掛けた", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s2q", text: "図1のように、$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(C2) + "\\,\\mu\\mathrm{F}$ を直列にして、$" + qv(V, "V") + "$ で充電しました。電源から切り離し、図2のように同じ極性どうしをつなぎ、スイッチ S を閉じました。つないだ後の $C_" + fmt(k) + "$ の電荷は何 µC ですか。", fig: {kind: "u49s2xq", L: tbU49s2_fig({"sw":"S"}, [["c1", "{C}_1=" + fmt(C1) + " μF"], ["c2", "{C}_2=" + fmt(C2) + " μF"], ["src", "{E}=" + qf(V, "V")], ["sw", "S"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列の合成 $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$、電荷 $Q = " + fmt(Cs) + " \\times " + fmt(V) + " = " + fmt(Q) + "\\,\\mu\\mathrm{C}$（直列なので2つとも同じ）", "つないでも電荷の合計 $2Q = " + fmt(2 * Q) + "\\,\\mu\\mathrm{C}$ は変わらない。並列の合成 $" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$、電圧 $V' = \\dfrac{" + fmt(2 * Q) + "}{" + fmt(Cp) + "} = " + qv(V2, "V") + "$", "$C_" + fmt(k) + "$ の電荷 $Q_" + fmt(k) + "' = " + fmt(Ck) + " \\times " + fmt(V2) + " = " + qv(ok, "uC") + "$"], chk: {form: "u49s2q", p: {C1: C1, C2: C2, V: V, k: k}}};
  }
  throw new Error("u49s2q：条件に合う数字が見つからない");
}
function tbU49s2_Qr(r){
  var gcd = tbU49s2_gcd, ratio = tbU49s2_ratio, par = tbU49s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var m = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var k = pick(r, [1,2]);
    var g = (gcd(C1 * C2, C1 + C2));
    var V = (m * (C1 + C2) / gcd(C1 * C2, C1 + C2));
    var Cs = (C1 * C2 / (C1 + C2));
    var Q = (C1 * C2 * m / gcd(C1 * C2, C1 + C2));
    var Cp = (C1 + C2);
    var V2 = (2 * C1 * C2 * m / gcd(C1 * C2, C1 + C2) / (C1 + C2));
    var Ck = (k == 1 ? C1 : C2);
    var Co = (k == 1 ? C2 : C1);
    if (!(C1 != C2 && V >= 10 && V <= 1000 && abs((2 * Ck / Cp) * 100 - Math.round((2 * Ck / Cp) * 100)) < 1e-9 && abs((Ck / Cp) * 100 - Math.round((Ck / Cp) * 100)) < 1e-9 && abs((2 * Co / Cp) * 100 - Math.round((2 * Co / Cp) * 100)) < 1e-9 && distinct([2 * Ck / Cp, 1, Ck / Cp, 2 * Co / Cp]))) continue;
    var ok = (Ck * V2 / Q);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s2_three4(ok, [{x: (1), why: "電荷はつないでも変わらないとした（つないだ後に分け直す）", w: 0, cut: 1}, {x: (Ck / Cp), why: "電荷を1つ分しか足さなかった（合計は 2Q）", w: 1, cut: 1}, {x: (2 * Co / Cp), why: "もう一方の静電容量で分けた", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s2r", text: "図1のように、$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(C2) + "\\,\\mu\\mathrm{F}$ を直列にして、$" + qv(V, "V") + "$ で充電しました。電源から切り離し、図2のように同じ極性どうしをつなぎ、スイッチ S を閉じました。つないだ後の $C_" + fmt(k) + "$ の電荷は、つなぐ前の $C_" + fmt(k) + "$ の電荷の何倍ですか。", fig: {kind: "u49s2xq", L: tbU49s2_fig({"sw":"S"}, [["c1", "{C}_1=" + fmt(C1) + " μF"], ["c2", "{C}_2=" + fmt(C2) + " μF"], ["src", "{E}=" + qf(V, "V")], ["sw", "S"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列の合成 $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$、電荷 $Q = " + fmt(Cs) + " \\times " + fmt(V) + " = " + fmt(Q) + "\\,\\mu\\mathrm{C}$（直列なので2つとも同じ）", "つないでも電荷の合計 $2Q = " + fmt(2 * Q) + "\\,\\mu\\mathrm{C}$ は変わらない。並列の合成 $" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$、電圧 $V' = \\dfrac{" + fmt(2 * Q) + "}{" + fmt(Cp) + "} = " + qv(V2, "V") + "$", "$Q_" + fmt(k) + "' = " + fmt(Ck) + " \\times " + fmt(V2) + " = " + fmt(Ck * V2) + "\\,\\mu\\mathrm{C}$、$\\dfrac{" + fmt(Ck * V2) + "}{" + fmt(Q) + "} = " + qv(ok, "X") + "$"], chk: {form: "u49s2r", p: {C1: C1, C2: C2, V: V, k: k}}};
  }
  throw new Error("u49s2r：条件に合う数字が見つからない");
}
// 49-3 2つの回路のエネルギーを比べる の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s3_par(a, b){ return a * b / (a + b); }
function tbU49s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s3_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s3_Qw(r){
  var gcd = tbU49s3_gcd, ratio = tbU49s3_ratio, par = tbU49s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var E1 = pick(r, [10,20,30,40,50,60,80,100]);
    var E2 = pick(r, [10,20,30,40,50,60,80,100]);
    var Cp = (C1 + C2);
    var Cs = (C1 * C2 / (C1 + C2));
    var W1 = ((C1 + C2) * E1 * E1 / 2);
    var W2 = (C1 * C2 / (C1 + C2) * E2 * E2 / 2);
    if (!(E1 != E2 && abs((Cs) * 10 - Math.round((Cs) * 10)) < 1e-9 && abs((W1 / W2) * 100 - Math.round((W1 / W2) * 100)) < 1e-9 && abs((Cp / Cs) * 100 - Math.round((Cp / Cs) * 100)) < 1e-9 && abs((E1 * E1 / (E2 * E2)) * 100 - Math.round((E1 * E1 / (E2 * E2)) * 100)) < 1e-9 && abs((W2 / W1) * 100 - Math.round((W2 / W1) * 100)) < 1e-9 && W1 / W2 <= 100 && W2 / W1 <= 100)) continue;
    var ok = (W1 / W2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s3_three4(ok, [{x: (Cp / Cs), why: "電圧の違いを見ず、合成した静電容量の比で止めた", w: 0, cut: 1}, {x: (E1 * E1 / (E2 * E2)), why: "合成せず、コンデンサ1つで比べた", w: 1, cut: 1}, {x: (W2 / W1), why: "比を逆にした", w: 2, cut: 0}, {x: (Cp * E1 / (Cs * E2)), why: "電圧を2乗しなかった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s3w", text: "2つのコンデンサ $C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$、$C_2 = " + fmt(C2) + "\\,\\mu\\mathrm{F}$ を、図1 では並列にして $E_1 = " + qv(E1, "V") + "$ に、図2 では同じ2つを直列にして $E_2 = " + qv(E2, "V") + "$ につなぎました。図1 の静電エネルギーは、図2 の何倍ですか。", fig: {kind: "u49s3ps", L: tbU49s3_fig({}, [["c1", "{C}_1"], ["c2", "{C}_2"], ["src", "{E}_1"], ["src2", "{E}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1 は並列 $" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$、図2 は直列 $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$", "この合成と、それぞれの電圧で $W = \\dfrac{1}{2}CV^2$　$W_1 = \\dfrac{1}{2} \\times " + fmt(Cp) + " \\times " + fmt(E1) + "^2$、$W_2 = \\dfrac{1}{2} \\times " + fmt(Cs) + " \\times " + fmt(E2) + "^2$", "$\\dfrac{W_1}{W_2} = \\dfrac{" + fmt(Cp) + " \\times " + fmt(E1) + "^2}{" + fmt(Cs) + " \\times " + fmt(E2) + "^2} = " + qv(ok, "X") + "$"], chk: {form: "u49s3w", p: {C1: C1, C2: C2, E1: E1, E2: E2}}};
  }
  throw new Error("u49s3w：条件に合う数字が見つからない");
}
function tbU49s3_Qnb(r){
  var gcd = tbU49s3_gcd, ratio = tbU49s3_ratio, par = tbU49s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n1 = pick(r, [1,2,3,4,5]);
    var n2 = pick(r, [1,2,3,4,5]);
    var k = pick(r, [1,2]);
    var R0 = (k == 1 ? n1 * n1 / (4 * n2 * n2) : 4 * n2 * n2 / (n1 * n1));
    var rc = (k == 1 ? 1 / 4 : 4);
    var rn = (k == 1 ? n1 * n1 / (n2 * n2) : n2 * n2 / (n1 * n1));
    var rv = (k == 1 ? n1 / (4 * n2) : 4 * n2 / n1);
    var a = (k == 1 ? 1 : 2);
    var b = (k == 1 ? 2 : 1);
    var ws = (k == 1 ? '\\dfrac{C}{2}' : '2C');
    var wo = (k == 1 ? '2C' : '\\dfrac{C}{2}');
    var na = (k == 1 ? n1 : n2);
    var nb = (k == 1 ? n2 : n1);
    var e1s = (n1 == 1 ? 'E' : n1 + 'E');
    var e2s = (n2 == 1 ? 'E' : n2 + 'E');
    var eas = (k == 1 ? (n1 == 1 ? 'E' : n1 + 'E') : (n2 == 1 ? 'E' : n2 + 'E'));
    var ebs = (k == 1 ? (n2 == 1 ? 'E' : n2 + 'E') : (n1 == 1 ? 'E' : n1 + 'E'));
    if (!(n1 != n2 && abs((R0) * 100 - Math.round((R0) * 100)) < 1e-9 && abs((rn) * 100 - Math.round((rn) * 100)) < 1e-9 && abs((rv) * 100 - Math.round((rv) * 100)) < 1e-9 && R0 <= 100 && distinct([R0, rc, rn, rv]))) continue;
    var ok = (R0);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s3_three4(ok, [{x: (rc), why: "電池の数を見ず、同じ電圧として静電容量の比で止めた", w: 0, cut: 1}, {x: (rn), why: "合成せず、コンデンサ1つで比べた", w: 1, cut: 1}, {x: (rv), why: "電圧を2乗しなかった", w: 2, cut: 0}, {x: (1 / R0), why: "比を逆にした", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s3nb", text: "静電容量 $C$ のコンデンサを2つずつ使い、図1 では直列、図2 では並列にしました。図1 の電源 $E_1$ は電圧 $E$ の電池 " + fmt(n1) + " 個、図2 の電源 $E_2$ は同じ電池 " + fmt(n2) + " 個でできています（電池が2個以上の時は直列）。図" + fmt(a) + " の静電エネルギーは、図" + fmt(b) + " の何倍ですか。", fig: {kind: "u49s3sp", L: tbU49s3_fig({}, [["c1", "{C}"], ["c2", "{C}"], ["src", "{E}_1"], ["src2", "{E}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電池の直列は電圧を足す　$E_1 = " + String(e1s) + "$、$E_2 = " + String(e2s) + "$。図1 は直列 $\\dfrac{C}{2}$、図2 は並列 $2C$", "$W_" + fmt(a) + " = \\dfrac{1}{2} \\times " + String(ws) + " \\times (" + String(eas) + ")^2$、$W_" + fmt(b) + " = \\dfrac{1}{2} \\times " + String(wo) + " \\times (" + String(ebs) + ")^2$", "$\\dfrac{W_" + fmt(a) + "}{W_" + fmt(b) + "} = " + qv(ok, "X") + "$"], chk: {form: "u49s3nb", p: {n1: n1, n2: n2, k: k}}};
  }
  throw new Error("u49s3nb：条件に合う数字が見つからない");
}
function tbU49s3_Qq(r){
  var gcd = tbU49s3_gcd, ratio = tbU49s3_ratio, par = tbU49s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var E1 = pick(r, [10,20,30,40,50,60,80,100]);
    var E2 = pick(r, [10,20,30,40,50,60,80,100]);
    var Cp = (C1 + C2);
    var Cs = (C1 * C2 / (C1 + C2));
    var W1 = ((C1 + C2) * E1 * E1 / 2);
    var W2 = (C1 * C2 / (C1 + C2) * E2 * E2 / 2);
    var Q1 = ((C1 + C2) * E1);
    var Q2 = (C1 * C2 / (C1 + C2) * E2);
    if (!(E1 != E2 && abs((Cs) * 10 - Math.round((Cs) * 10)) < 1e-9 && abs((Q1 / Q2) * 100 - Math.round((Q1 / Q2) * 100)) < 1e-9 && abs((Cp / Cs) * 100 - Math.round((Cp / Cs) * 100)) < 1e-9 && abs((E1 / E2) * 100 - Math.round((E1 / E2) * 100)) < 1e-9 && abs((Q2 / Q1) * 100 - Math.round((Q2 / Q1) * 100)) < 1e-9 && abs((W1 / W2) * 100 - Math.round((W1 / W2) * 100)) < 1e-9 && Q1 / Q2 <= 100 && Q2 / Q1 <= 100)) continue;
    var ok = (Q1 / Q2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s3_three4(ok, [{x: (Cp / Cs), why: "電圧の違いを見ず、合成した静電容量の比で止めた", w: 0, cut: 1}, {x: (E1 / E2), why: "合成せず、コンデンサ1つで比べた", w: 1, cut: 1}, {x: (Q2 / Q1), why: "比を逆にした", w: 2, cut: 0}, {x: (W1 / W2), why: "電圧を2乗した（エネルギーの比と取り違えた）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s3q", text: "2つのコンデンサ $C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$、$C_2 = " + fmt(C2) + "\\,\\mu\\mathrm{F}$ を、図1 では並列にして $E_1 = " + qv(E1, "V") + "$ に、図2 では同じ2つを直列にして $E_2 = " + qv(E2, "V") + "$ につなぎました。図1 に蓄えられる電荷は、図2 の何倍ですか。", fig: {kind: "u49s3ps", L: tbU49s3_fig({}, [["c1", "{C}_1"], ["c2", "{C}_2"], ["src", "{E}_1"], ["src2", "{E}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1 は並列 $" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$、図2 は直列 $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$", "この合成と、それぞれの電圧で $Q = CV$　$Q_1 = " + fmt(Cp) + " \\times " + fmt(E1) + "$、$Q_2 = " + fmt(Cs) + " \\times " + fmt(E2) + "$", "$\\dfrac{Q_1}{Q_2} = " + qv(ok, "X") + "$"], chk: {form: "u49s3q", p: {C1: C1, C2: C2, E1: E1, E2: E2}}};
  }
  throw new Error("u49s3q：条件に合う数字が見つからない");
}
// 49-4 極板の形から合成して電荷 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s4_par(a, b){ return a * b / (a + b); }
function tbU49s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s4_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s4_Qp(r){
  var gcd = tbU49s4_gcd, ratio = tbU49s4_ratio, par = tbU49s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var a = pick(r, [1,2,3,4]);
    var b = pick(r, [1,2,3,4]);
    var e = pick(r, [1,1,2,3,4]);
    var V = pick(r, [10,20,50,100,200,500]);
    var C2 = (C1 * e * a / b);
    var Cp = (C1 + C1 * e * a / b);
    var Cs = (C1 * C1 * e * a / b / (C1 + C1 * e * a / b));
    var aS = (a == 1 ? 'S' : a + 'S');
    var bd = (b == 1 ? 'd' : b + 'd');
    var med = (e == 1 ? '間は真空です' : '間を比誘電率 ' + e + ' の誘電体で満たしてあります');
    var fa = (a == 1 ? '1' : a);
    var fb = (b == 1 ? '1' : b);
    var es = (e == 1 ? '' : ' \\times ' + e);
    if (!(!(a == 1 && b == 1) && a != b && e * a != b && abs((C2) * 10 - Math.round((C2) * 10)) < 1e-9 && abs((Cp * V) * 10 - Math.round((Cp * V) * 10)) < 1e-9 && abs((Cs * V) * 10 - Math.round((Cs * V) * 10)) < 1e-9 && abs((C1 * (1 + a / b) * V) * 10 - Math.round((C1 * (1 + a / b) * V) * 10)) < 1e-9 && Cp * V <= 10000)) continue;
    var ok = (Cp * V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s4_three4(ok, [{x: (2 * C1 * V), why: "$C_2$ を出さず、$C_1$ と同じとした", w: 0, cut: 1}, {x: (C2 * V), why: "$C_2$ だけの電荷（合成していない）", w: 1, cut: 1}, {x: (Cs * V), why: "並列を直列と取り違えた（和分の積）", w: 2, cut: 0}, {x: (C1 * (1 + a / b) * V), why: "比誘電率を掛けなかった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s4p", text: "$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ は、極板の面積 $S$・極板の間の距離 $d$ で、間は真空です。$C_2$ は、面積 $" + String(aS) + "$・距離 $" + String(bd) + "$ で、" + String(med) + "。図のように、2つを並列にして $" + qv(V, "V") + "$ につなぎました。蓄えられる電荷の合計は何 µC ですか。", fig: {kind: "u49s4pa", L: tbU49s4_fig({}, [["c1", "{C}_1"], ["c2", "{C}_2"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$ なので、$C_2 = " + fmt(C1) + String(es) + " \\times \\dfrac{" + fmt(fa) + "}{" + fmt(fb) + "} = " + fmt(C2) + "\\,\\mu\\mathrm{F}$", "この $C_2$ を使って並列なので足す　$" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$", "$Q = CV = " + fmt(Cp) + " \\times " + fmt(V) + " = " + qv(ok, "uC") + "$"], chk: {form: "u49s4p", p: {C1: C1, a: a, b: b, e: e, V: V}}};
  }
  throw new Error("u49s4p：条件に合う数字が見つからない");
}
function tbU49s4_Qs(r){
  var gcd = tbU49s4_gcd, ratio = tbU49s4_ratio, par = tbU49s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var a = pick(r, [1,2,3,4]);
    var b = pick(r, [1,2,3,4]);
    var e = pick(r, [1,1,2,3,4]);
    var V = pick(r, [10,20,50,100,200,500]);
    var C2 = (C1 * e * a / b);
    var Cp = (C1 + C1 * e * a / b);
    var Cs = (C1 * C1 * e * a / b / (C1 + C1 * e * a / b));
    var aS = (a == 1 ? 'S' : a + 'S');
    var bd = (b == 1 ? 'd' : b + 'd');
    var med = (e == 1 ? '間は真空です' : '間を比誘電率 ' + e + ' の誘電体で満たしてあります');
    var fa = (a == 1 ? '1' : a);
    var fb = (b == 1 ? '1' : b);
    var es = (e == 1 ? '' : ' \\times ' + e);
    if (!(!(a == 1 && b == 1) && a != b && e * a != b && abs((C2) * 10 - Math.round((C2) * 10)) < 1e-9 && abs((Cs) * 10 - Math.round((Cs) * 10)) < 1e-9 && abs((Cs * V) * 10 - Math.round((Cs * V) * 10)) < 1e-9 && abs((C1 * V / 2) * 10 - Math.round((C1 * V / 2) * 10)) < 1e-9 && abs((Cp * V) * 10 - Math.round((Cp * V) * 10)) < 1e-9 && abs((C1 * C1 * a / b / (C1 + C1 * a / b) * V) * 10 - Math.round((C1 * C1 * a / b / (C1 + C1 * a / b) * V) * 10)) < 1e-9 && Cp * V <= 10000)) continue;
    var ok = (Cs * V);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s4_three4(ok, [{x: (C1 * V / 2), why: "$C_2$ を出さず、$C_1$ と同じとした", w: 0, cut: 1}, {x: (C1 * V), why: "合成せず、$C_1$ だけの電荷とした", w: 1, cut: 1}, {x: (Cp * V), why: "直列を並列と取り違えた（足した）", w: 2, cut: 0}, {x: (C1 * C1 * a / b / (C1 + C1 * a / b) * V), why: "比誘電率を掛けなかった", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s4s", text: "$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ は、極板の面積 $S$・極板の間の距離 $d$ で、間は真空です。$C_2$ は、面積 $" + String(aS) + "$・距離 $" + String(bd) + "$ で、" + String(med) + "。図のように、2つを直列にして $" + qv(V, "V") + "$ につなぎました。$C_1$ に蓄えられる電荷は何 µC ですか。", fig: {kind: "u49s4se", L: tbU49s4_fig({}, [["c1", "{C}_1"], ["c2", "{C}_2"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$ なので、$C_2 = " + fmt(C1) + String(es) + " \\times \\dfrac{" + fmt(fa) + "}{" + fmt(fb) + "} = " + fmt(C2) + "\\,\\mu\\mathrm{F}$", "この $C_2$ を使って直列なので和分の積　$\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$", "直列なので、どちらも同じ電荷　$Q = CV = " + fmt(Cs) + " \\times " + fmt(V) + " = " + qv(ok, "uC") + "$"], chk: {form: "u49s4s", p: {C1: C1, a: a, b: b, e: e, V: V}}};
  }
  throw new Error("u49s4s：条件に合う数字が見つからない");
}
function tbU49s4_Qr(r){
  var gcd = tbU49s4_gcd, ratio = tbU49s4_ratio, par = tbU49s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var a = pick(r, [1,2,3,4]);
    var b = pick(r, [1,2,3,4]);
    var e = pick(r, [1,1,2,3,4]);
    var V = pick(r, [10,20,50,100,200,500]);
    var C2 = (C1 * e * a / b);
    var Cp = (C1 + C1 * e * a / b);
    var Cs = (C1 * C1 * e * a / b / (C1 + C1 * e * a / b));
    var aS = (a == 1 ? 'S' : a + 'S');
    var bd = (b == 1 ? 'd' : b + 'd');
    var med = (e == 1 ? '間は真空です' : '間を比誘電率 ' + e + ' の誘電体で満たしてあります');
    var fa = (a == 1 ? '1' : a);
    var fb = (b == 1 ? '1' : b);
    var es = (e == 1 ? '' : ' \\times ' + e);
    if (!(!(a == 1 && b == 1) && a != b && e * a != b && abs((C2) * 10 - Math.round((C2) * 10)) < 1e-9 && abs((Cs) * 10 - Math.round((Cs) * 10)) < 1e-9 && abs((Cp / Cs) * 100 - Math.round((Cp / Cs) * 100)) < 1e-9 && abs((C2 / C1) * 100 - Math.round((C2 / C1) * 100)) < 1e-9 && abs((Cs / Cp) * 100 - Math.round((Cs / Cp) * 100)) < 1e-9 && distinct([Cp / Cs, C2 / C1, 4, Cs / Cp]) && Cp / Cs <= 100)) continue;
    var ok = (Cp / Cs);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s4_three4(ok, [{x: (C2 / C1), why: "合成せず、$C_2$ と $C_1$ の比で止めた", w: 0, cut: 1}, {x: (4), why: "$C_2$ を出さず、$C_1$ と同じとした", w: 1, cut: 1}, {x: (Cs / Cp), why: "比を逆にした", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s4r", text: "$C_1 = " + fmt(C1) + "\\,\\mu\\mathrm{F}$ は、極板の面積 $S$・極板の間の距離 $d$ で、間は真空です。$C_2$ は、面積 $" + String(aS) + "$・距離 $" + String(bd) + "$ で、" + String(med) + "。図のように2つを並列にして電圧 $V$ につないだ時と、2つを直列にして同じ電圧 $V$ につないだ時を比べます。並列の時の電荷の合計は、直列の時の $C_1$ の電荷の何倍ですか。", fig: {kind: "u49s4pa", L: tbU49s4_fig({}, [["c1", "{C}_1"], ["c2", "{C}_2"], ["src", "{V}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$C = \\dfrac{\\varepsilon S}{d}$ なので、$C_2 = " + fmt(C1) + String(es) + " \\times \\dfrac{" + fmt(fa) + "}{" + fmt(fb) + "} = " + fmt(C2) + "\\,\\mu\\mathrm{F}$", "この $C_2$ を使って並列は $" + fmt(C1) + " + " + fmt(C2) + " = " + fmt(Cp) + "\\,\\mu\\mathrm{F}$、直列は $\\dfrac{" + fmt(C1) + " \\times " + fmt(C2) + "}{" + fmt(C1) + " + " + fmt(C2) + "} = " + fmt(Cs) + "\\,\\mu\\mathrm{F}$", "電圧は同じなので $Q = CV$ の比は $C$ の比　$\\dfrac{" + fmt(Cp) + "}{" + fmt(Cs) + "} = " + qv(ok, "X") + "$"], chk: {form: "u49s4r", p: {C1: C1, a: a, b: b, e: e}}};
  }
  throw new Error("u49s4r：条件に合う数字が見つからない");
}
// 49-5 切り離して距離を変える の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s5_par(a, b){ return a * b / (a + b); }
function tbU49s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s5_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s5_Qkw(r){
  var gcd = tbU49s5_gcd, ratio = tbU49s5_ratio, par = tbU49s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [10,20,30,40,50,60,80,100]);
    var n = pick(r, [2,3,4]);
    var up = pick(r, [0,1]);
    var Q = (C * V);
    var Cn = (up == 1 ? C / n : C * n);
    var Vn = (up == 1 ? V * n : V / n);
    var W0 = (C * V * V / 2);
    var Wn = (C * V * V * (up == 1 ? n : 1 / n) / 2);
    var Wv = ((up == 1 ? C / n : C * n) * V * V / 2);
    var dt = (up == 1 ? n + ' 倍' : '$\\dfrac{1}{' + n + '}$');
    if (!(Cn > 0 && Math.abs(Cn * 10 - Math.round(Cn * 10)) < 1e-9 && Math.abs(Wn - Math.round(Wn)) < 1e-9 && Math.abs(Vn - Math.round(Vn)) < 1e-9 && distinct([Wn, W0, Vn, Wv]))) continue;
    var ok = (Wn);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s5_three4(ok, [{x: (W0), why: "前の静電エネルギーのまま（距離を変えた後の静電容量を使っていない）", w: 0, cut: 1}, {x: (Vn), why: "後の電圧で止めた（静電エネルギーまで出していない）", w: 1, cut: 1}, {x: (Wv), why: "電圧が変わらないとした（切り離すと変わらないのは電荷）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s5kw", text: "静電容量 $C = " + qv(C, "F") + "$ のコンデンサを $" + qv(V, "V") + "$ で充電し、電源から切り離してから、極板間の距離を " + String(dt) + " にしました。静電エネルギーは何 J ですか。", fig: {kind: "u49s5pe", L: tbU49s5_fig({"c":"{C}","d":"{d}","top":"","bot":""}, [["c", "{C}=" + qf(C, "F")], ["d", "{d}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["距離を " + String(dt) + " にすると、静電容量は $C' = " + qv(Cn, "F") + "$", "切り離したので電荷はそのまま　$Q = " + fmt(C) + " \\times " + fmt(V) + " = " + qv(Q, "C") + "$", "$W = \\dfrac{Q^2}{2C'} = \\dfrac{" + fmt(Q) + "^2}{2 \\times " + fmt(Cn) + "} = " + qv(ok, "J") + "$"], chk: {form: "u49s5kw", p: {C: C, V: V, n: n, up: up}}};
  }
  throw new Error("u49s5kw：条件に合う数字が見つからない");
}
function tbU49s5_Qkv(r){
  var gcd = tbU49s5_gcd, ratio = tbU49s5_ratio, par = tbU49s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [10,20,30,40,50,60,80,100]);
    var n = pick(r, [2,3,4]);
    var up = pick(r, [0,1]);
    var Q = (C * V);
    var Cn = (up == 1 ? C / n : C * n);
    var Vn = (up == 1 ? V * n : V / n);
    var W0 = (C * V * V / 2);
    var Wn = (C * V * V * (up == 1 ? n : 1 / n) / 2);
    var Wv = ((up == 1 ? C / n : C * n) * V * V / 2);
    var dt = (up == 1 ? n + ' 倍' : '$\\dfrac{1}{' + n + '}$');
    if (!(Cn > 0 && Math.abs(Cn * 10 - Math.round(Cn * 10)) < 1e-9 && Math.abs(Vn - Math.round(Vn)) < 1e-9 && distinct([Vn, V, Q, Cn]))) continue;
    var ok = (Vn);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s5_three4(ok, [{x: (Q), why: "電荷 $Q$ で止めた（後の静電容量で割っていない）", w: 0, cut: 1}, {x: (Cn), why: "後の静電容量で止めた（電荷を出していない）", w: 1, cut: 1}, {x: (V), why: "電圧が変わらないとした（切り離すと変わらないのは電荷）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s5kv", text: "静電容量 $C = " + qv(C, "F") + "$ のコンデンサを $" + qv(V, "V") + "$ で充電し、電源から切り離してから、極板間の距離を " + String(dt) + " にしました。コンデンサの電圧は何 V ですか。", fig: {kind: "u49s5pe", L: tbU49s5_fig({"c":"{C}","d":"{d}","top":"","bot":""}, [["c", "{C}=" + qf(C, "F")], ["d", "{d}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["距離を " + String(dt) + " にすると、静電容量は $C' = " + qv(Cn, "F") + "$", "切り離したので電荷はそのまま　$Q = " + fmt(C) + " \\times " + fmt(V) + " = " + qv(Q, "C") + "$", "$V' = \\dfrac{Q}{C'} = \\dfrac{" + fmt(Q) + "}{" + fmt(Cn) + "} = " + qv(ok, "V") + "$"], chk: {form: "u49s5kv", p: {C: C, V: V, n: n, up: up}}};
  }
  throw new Error("u49s5kv：条件に合う数字が見つからない");
}
function tbU49s5_Qcw(r){
  var gcd = tbU49s5_gcd, ratio = tbU49s5_ratio, par = tbU49s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [10,20,30,40,50,60,80,100]);
    var n = pick(r, [2,3,4]);
    var up = pick(r, [0,1]);
    var Q = (C * V);
    var Cn = (up == 1 ? C / n : C * n);
    var Vn = (up == 1 ? V * n : V / n);
    var W0 = (C * V * V / 2);
    var Wn = (C * V * V * (up == 1 ? n : 1 / n) / 2);
    var Wv = ((up == 1 ? C / n : C * n) * V * V / 2);
    var dt = (up == 1 ? n + ' 倍' : '$\\dfrac{1}{' + n + '}$');
    if (!(Cn > 0 && Math.abs(Cn * 10 - Math.round(Cn * 10)) < 1e-9 && Math.abs(Wv - Math.round(Wv)) < 1e-9 && Math.abs(Wn - Math.round(Wn)) < 1e-9 && distinct([Wv, W0, Cn * V, Wn]))) continue;
    var ok = (Wv);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s5_three4(ok, [{x: (W0), why: "前の静電エネルギーのまま（距離を変えた後の静電容量を使っていない）", w: 0, cut: 1}, {x: (Cn * V), why: "後の電荷で止めた（静電エネルギーまで出していない）", w: 1, cut: 1}, {x: (Wn), why: "電荷が変わらないとした（つないだままなら変わらないのは電圧）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "J", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s5cw", text: "静電容量 $C = " + qv(C, "F") + "$ のコンデンサを $" + qv(V, "V") + "$ の電源につないだまま、極板間の距離を " + String(dt) + " にしました。静電エネルギーは何 J ですか。", fig: {kind: "u49s5pe", L: tbU49s5_fig({"c":"{C}","d":"{d}","top":"","bot":""}, [["c", "{C}=" + qf(C, "F")], ["d", "{d}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["距離を " + String(dt) + " にすると、静電容量は $C' = " + qv(Cn, "F") + "$", "つないだままなので電圧はそのまま $" + qv(V, "V") + "$", "$W = \\dfrac{1}{2} C' V^2 = \\dfrac{1}{2} \\times " + fmt(Cn) + " \\times " + fmt(V) + "^2 = " + qv(ok, "J") + "$"], chk: {form: "u49s5cw", p: {C: C, V: V, n: n, up: up}}};
  }
  throw new Error("u49s5cw：条件に合う数字が見つからない");
}
function tbU49s5_Qkr(r){
  var gcd = tbU49s5_gcd, ratio = tbU49s5_ratio, par = tbU49s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,3,4,5]);
    var up = pick(r, [0,1]);
    var kk = (up == 1 ? 1 / n : n);
    var dt = (up == 1 ? n + ' 倍' : '$\\dfrac{1}{' + n + '}$');
    if (!(Math.abs(100 / kk - Math.round(100 / kk)) < 1e-9 && Math.abs(100 / (kk * kk) - Math.round(100 / (kk * kk))) < 1e-9 && Math.abs(kk * 100 - Math.round(kk * 100)) < 1e-9)) continue;
    var ok = (1 / kk);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s5_three4(ok, [{x: (1 / (kk * kk)), why: "電圧の変わり方だけで $W = \\dfrac{1}{2}CV^2$ を見た（静電容量の変わり方を入れていない）", w: 0, cut: 1}, {x: (1), why: "電荷が変わらないので静電エネルギーも変わらないとした（静電容量の変わり方を入れていない）", w: 1, cut: 1}, {x: (kk), why: "電圧が変わらないとした（切り離すと変わらないのは電荷）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s5kr", text: "コンデンサを充電し、電源から切り離してから、極板間の距離を " + String(dt) + " にしました。静電エネルギーは元の何倍ですか。", fig: {kind: "u49s5pe", L: tbU49s5_fig({"c":"{C}","d":"{d}","top":"","bot":""}, [["c", "{C}"], ["d", "{d}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["距離を " + String(dt) + " にすると、静電容量は " + qv(kk, "X"), "切り離したので電荷 $Q$ はそのまま", "$W = \\dfrac{Q^2}{2C}$ は $C$ に反比例　" + qv(ok, "X")], chk: {form: "u49s5kr", p: {n: n, up: up}}};
  }
  throw new Error("u49s5kr：条件に合う数字が見つからない");
}
// 49-6 直並列の電荷 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s6_par(a, b){ return a * b / (a + b); }
function tbU49s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s6_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s6_Qqk(r){
  var gcd = tbU49s6_gcd, ratio = tbU49s6_ratio, par = tbU49s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300]);
    var k = pick(r, [2,3]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    var Qt = (C1 * (C2 + C3) * V / (C1 + C2 + C3));
    var Vp = (V * C1 / (C1 + C2 + C3));
    var V1 = (V * (C2 + C3) / (C1 + C2 + C3));
    var Vx = (V * C2 / (C1 + C2));
    var Vy = (V * C1 / (C1 + C2));
    var Ck = (k == 2 ? C2 : C3);
    var Co = (k == 2 ? C3 : C2);
    if (!(C2 != C3 && C1 != C2 + C3 && Math.abs(Ct * 100 - Math.round(Ct * 100)) < 1e-9 && Math.abs(Qt - Math.round(Qt)) < 1e-9 && Math.abs(Vp - Math.round(Vp)) < 1e-9 && Math.abs(Ck * Vp - Math.round(Ck * Vp)) < 1e-9 && distinct([Ck * Vp, Qt, Vp, Ck * V, Qt * Co / (C2 + C3)]))) continue;
    var ok = (Ck * Vp);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s6_three4(ok, [{x: (Qt), why: "全体の電荷で止めた（並列で2つに分かれる）", w: 0, cut: 1}, {x: (Vp), why: "並列の電圧で止めた（電荷まで出していない）", w: 1, cut: 1}, {x: (Ck * V), why: "電源の電圧が全部かかるとした（直列の $C_1$ にも電圧が分かれる）", w: 2, cut: 0}, {x: (Qt * Co / (C2 + C3)), why: "全体の電荷をもう一方の静電容量の割合で分けた（並列の電荷は自分の静電容量に比例）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "uC", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s6qk", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$、$V = " + qv(V, "V") + "$ です。$C_" + fmt(k) + "$ に蓄えられる電荷は何 μC ですか。", fig: {kind: "u49s6sq", L: tbU49s6_fig({"c1":"{C}_1","c2":"{C}_2","c3":"{C}_3","src":"{V}"}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}=" + qf(V, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $" + fmt(C2) + " + " + fmt(C3) + " = " + qv(Cp, "uF") + "$、直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(Ct, "uF") + "$", "全体の電荷 $Q = " + fmt(Ct) + " \\times " + fmt(V) + " = " + qv(Qt, "uC") + "$（直列なので $C_1$ の電荷も同じ）", "並列の電圧 $V_2 = \\dfrac{" + fmt(Qt) + "}{" + fmt(Cp) + "} = " + qv(Vp, "V") + "$", "$Q_" + fmt(k) + " = " + fmt(Ck) + " \\times " + fmt(Vp) + " = " + qv(ok, "uC") + "$"], chk: {form: "u49s6qk", p: {C1: C1, C2: C2, C3: C3, V: V, k: k}}};
  }
  throw new Error("u49s6qk：条件に合う数字が見つからない");
}
function tbU49s6_Qv1(r){
  var gcd = tbU49s6_gcd, ratio = tbU49s6_ratio, par = tbU49s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    var Qt = (C1 * (C2 + C3) * V / (C1 + C2 + C3));
    var Vp = (V * C1 / (C1 + C2 + C3));
    var V1 = (V * (C2 + C3) / (C1 + C2 + C3));
    var Vx = (V * C2 / (C1 + C2));
    var Vy = (V * C1 / (C1 + C2));
    if (!(C2 != C3 && C1 != C2 + C3 && Math.abs(Ct * 100 - Math.round(Ct * 100)) < 1e-9 && Math.abs(Qt - Math.round(Qt)) < 1e-9 && Math.abs(Vp - Math.round(Vp)) < 1e-9 && Math.abs(V1 - Math.round(V1)) < 1e-9 && Math.abs(Vx * 100 - Math.round(Vx * 100)) < 1e-9 && distinct([V1, Qt, Vx, Vp, V / 2]))) continue;
    var ok = (Qt / C1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s6_three4(ok, [{x: (Qt), why: "全体の電荷で止めた（$C_1$ で割っていない）", w: 0, cut: 1}, {x: (Vx), why: "並列を合成していない（$C_3$ を入れずに $C_1$ と $C_2$ の直列とした）", w: 1, cut: 1}, {x: (Vp), why: "逆比を取り違えた（並列の部分の電圧を答えた）", w: 2, cut: 0}, {x: (V / 2), why: "等しく分かれるとした（直列の電圧は静電容量の逆比）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s6v1", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$、$V = " + qv(V, "V") + "$ です。$C_1$ にかかる電圧は何 V ですか。", fig: {kind: "u49s6sq", L: tbU49s6_fig({"c1":"{C}_1","c2":"{C}_2","c3":"{C}_3","src":"{V}"}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}=" + qf(V, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $" + fmt(C2) + " + " + fmt(C3) + " = " + qv(Cp, "uF") + "$、直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(Ct, "uF") + "$", "全体の電荷 $Q = " + fmt(Ct) + " \\times " + fmt(V) + " = " + qv(Qt, "uC") + "$（直列なので $C_1$ の電荷も同じ）", "$V_1 = \\dfrac{Q}{C_1} = \\dfrac{" + fmt(Qt) + "}{" + fmt(C1) + "} = " + qv(ok, "V") + "$"], chk: {form: "u49s6v1", p: {C1: C1, C2: C2, C3: C3, V: V}}};
  }
  throw new Error("u49s6v1：条件に合う数字が見つからない");
}
function tbU49s6_Qbig(r){
  var gcd = tbU49s6_gcd, ratio = tbU49s6_ratio, par = tbU49s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10]);
    var V = pick(r, [10,20,30,40,50,60,80,100,120,150,200,300]);
    var Cp = (C2 + C3);
    var Ct = (C1 * (C2 + C3) / (C1 + C2 + C3));
    var Qt = (C1 * (C2 + C3) * V / (C1 + C2 + C3));
    var Vp = (V * C1 / (C1 + C2 + C3));
    var V1 = (V * (C2 + C3) / (C1 + C2 + C3));
    var Vx = (V * C2 / (C1 + C2));
    var Vy = (V * C1 / (C1 + C2));
    var Mx = (max(V1, Vp));
    var Mn = (min(V1, Vp));
    var Mz = (max(Vx, Vy));
    if (!(C2 != C3 && C1 != C2 + C3 && Math.abs(Ct * 100 - Math.round(Ct * 100)) < 1e-9 && Math.abs(Qt - Math.round(Qt)) < 1e-9 && Math.abs(Vp - Math.round(Vp)) < 1e-9 && Math.abs(V1 - Math.round(V1)) < 1e-9 && Math.abs(Mz * 100 - Math.round(Mz * 100)) < 1e-9 && distinct([Mx, Mn, Qt, Mz]))) continue;
    var ok = (Mx);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s6_three4(ok, [{x: (Mn), why: "静電容量の大きい方に大きい電圧がかかるとした（直列の電圧は静電容量の逆比）", w: 0, cut: 0}, {x: (Qt), why: "全体の電荷で止めた（静電容量で割っていない）", w: 1, cut: 1}, {x: (Mz), why: "並列を合成していない（$C_3$ を入れずに $C_1$ と $C_2$ の直列とした）", w: 2, cut: 1}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s6big", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$、$V = " + qv(V, "V") + "$ です。3つのコンデンサのうち、かかる電圧が一番大きいものの電圧は何 V ですか。", fig: {kind: "u49s6sq", L: tbU49s6_fig({"c1":"{C}_1","c2":"{C}_2","c3":"{C}_3","src":"{V}"}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["src", "{V}=" + qf(V, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["並列 $" + fmt(C2) + " + " + fmt(C3) + " = " + qv(Cp, "uF") + "$、直列で $\\dfrac{" + fmt(C1) + " \\times " + fmt(Cp) + "}{" + fmt(C1) + " + " + fmt(Cp) + "} = " + qv(Ct, "uF") + "$", "全体の電荷 $Q = " + fmt(Ct) + " \\times " + fmt(V) + " = " + qv(Qt, "uC") + "$（直列なので $C_1$ の電荷も同じ）", "$V_1 = \\dfrac{" + fmt(Qt) + "}{" + fmt(C1) + "} = " + qv(V1, "V") + "$、並列の電圧 $V_2 = \\dfrac{" + fmt(Qt) + "}{" + fmt(Cp) + "} = " + qv(Vp, "V") + "$", "並列の $C_2$ と $C_3$ は同じ電圧　一番大きいのは $" + qv(ok, "V") + "$"], chk: {form: "u49s6big", p: {C1: C1, C2: C2, C3: C3, V: V}}};
  }
  throw new Error("u49s6big：条件に合う数字が見つからない");
}
function tbU49s6_Qrq(r){
  var gcd = tbU49s6_gcd, ratio = tbU49s6_ratio, par = tbU49s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var C1 = pick(r, [1,2,3,4,5,6,8,10]);
    var C2 = pick(r, [1,2,3,4,5,6,8,10]);
    var C3 = pick(r, [1,2,3,4,5,6,8,10]);
    var k = pick(r, [2,3]);
    var Ck = (k == 2 ? C2 : C3);
    var Co = (k == 2 ? C3 : C2);
    if (!(C2 != C3 && Math.abs(Ck / (C2 + C3) * 100 - Math.round(Ck / (C2 + C3) * 100)) < 1e-9 && Math.abs(Ck / Co * 100 - Math.round(Ck / Co * 100)) < 1e-9 && Math.abs(Ck / C1 * 100 - Math.round(Ck / C1 * 100)) < 1e-9 && distinct([Ck / (C2 + C3), Ck / Co, 1, Ck / C1]))) continue;
    var ok = (Ck / (C2 + C3));
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s6_three4(ok, [{x: (Ck / Co), why: "もう一方の並列の電荷と比べた（$Q_1$ は並列の2つの電荷の和）", w: 0, cut: 1}, {x: (1), why: "直列なので同じ電荷とした（並列の部分で2つに分かれる）", w: 1, cut: 1}, {x: (Ck / C1), why: "静電容量の比を $C_1$ とそのまま比べた（$Q_1$ は並列の合計の電荷）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s6rq", text: "図の回路で、$C_1 = " + qv(C1, "uF") + "$、$C_2 = " + qv(C2, "uF") + "$、$C_3 = " + qv(C3, "uF") + "$ です。$C_" + fmt(k) + "$ の電荷は、$C_1$ の電荷 $Q_1$ の何倍ですか。", fig: {kind: "u49s6sq", L: tbU49s6_fig({"c1":"{C}_1","c2":"{C}_2","c3":"{C}_3","src":"{V}"}, [["c1", "{C}_1=" + qf(C1, "uF")], ["c2", "{C}_2=" + qf(C2, "uF")], ["c3", "{C}_3=" + qf(C3, "uF")], ["q1", "{Q}_1"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので $Q_1$ は並列の部分へ入る電荷＝並列の2つの電荷の和", "並列は同じ電圧なので、電荷は静電容量に比例", "$\\dfrac{" + fmt(Ck) + "}{" + fmt(C2) + " + " + fmt(C3) + "} = " + qv(ok, "X") + "$"], chk: {form: "u49s6rq", p: {C1: C1, C2: C2, C3: C3, k: k}}};
  }
  throw new Error("u49s6rq：条件に合う数字が見つからない");
}
// 49-7 2つの図のエネルギーを等しく置く の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s7.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s7_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s7_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s7_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s7_par(a, b){ return a * b / (a + b); }
function tbU49s7_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s7_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s7_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s7_Qw(r){
  var gcd = tbU49s7_gcd, ratio = tbU49s7_ratio, par = tbU49s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10]);
    var b = pick(r, [1,2,3,4,5,6,8,10]);
    var ask = pick(r, [1,1,0]);
    var Cs = (a * b / (a + b));
    var Cp = (a + b);
    var r2 = ((a + b) * (a + b) / (a * b));
    var R = (Math.sqrt((a + b) * (a + b) / (a * b)));
    var p = (ask == 1 ? 1 : 2);
    var o = (ask == 1 ? 2 : 1);
    if (!(Math.abs(R - Math.round(R * 1000) / 1000) < 1e-9 && Math.abs(R * 100 - Math.round(R * 100)) < 1e-9 && Math.abs(1 / R * 100 - Math.round(1 / R * 100)) < 1e-9 && Math.abs(1 / r2 * 100 - Math.round(1 / r2 * 100)) < 1e-9 && Math.abs(Cs * 100 - Math.round(Cs * 100)) < 1e-9)) continue;
    var ok = (ask == 1 ? R : 1 / R);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s7_three4(ok, [{x: (ask == 1 ? r2 : 1 / r2), why: "√をとっていない（電圧の2乗の比で止めた）", w: 0, cut: 1}, {x: (1), why: "合成せずに比べた（直列と並列で静電容量が違う）", w: 1, cut: 1}, {x: (ask == 1 ? 1 / R : R), why: "直列と並列の合成を取り違えた（比が逆）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s7w", text: "静電容量 $C_1 = " + qv(a, "uF") + "$ と $C_2 = " + qv(b, "uF") + "$ のコンデンサがあります。図1は2つを直列にして電圧 $V_1$ を、図2は2つを並列にして電圧 $V_2$ を加えました。2つの静電エネルギーが等しい時、$V_" + fmt(p) + "$ は $V_" + fmt(o) + "$ の何倍ですか。", fig: {kind: "u49s7tq", L: tbU49s7_fig({"src":"{V}_1","src2":"{V}_2"}, [["c1", "{C}_1=" + qf(a, "uF")], ["c2", "{C}_2=" + qf(b, "uF")], ["src", "{V}_1"], ["src2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1 直列 $\\dfrac{" + fmt(a) + " \\times " + fmt(b) + "}{" + fmt(a) + " + " + fmt(b) + "} = " + qv(Cs, "uF") + "$、図2 並列 $" + fmt(a) + " + " + fmt(b) + " = " + qv(Cp, "uF") + "$", "$\\dfrac{1}{2} \\times " + fmt(Cs) + " \\times V_1^2 = \\dfrac{1}{2} \\times " + fmt(Cp) + " \\times V_2^2$　$V_1^2 = " + fmt(r2) + " V_2^2$", "√をとって $V_1 = " + fmt(R) + " V_2$　$V_" + fmt(p) + "$ は $V_" + fmt(o) + "$ の " + qv(ok, "X")], chk: {form: "u49s7w", p: {a: a, b: b, ask: ask}}};
  }
  throw new Error("u49s7w：条件に合う数字が見つからない");
}
function tbU49s7_Qq(r){
  var gcd = tbU49s7_gcd, ratio = tbU49s7_ratio, par = tbU49s7_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [1,2,3,4,5,6,8,10]);
    var b = pick(r, [1,2,3,4,5,6,8,10]);
    var ask = pick(r, [1,1,0]);
    var Cs = (a * b / (a + b));
    var Cp = (a + b);
    var r2 = ((a + b) * (a + b) / (a * b));
    var R = (Math.sqrt((a + b) * (a + b) / (a * b)));
    var p = (ask == 1 ? 1 : 2);
    var o = (ask == 1 ? 2 : 1);
    var xb = ((a + b) / b);
    if (!(Math.abs(R - Math.round(R * 1000) / 1000) < 1e-9 && Math.abs(R * 100 - Math.round(R * 100)) < 1e-9 && Math.abs(1 / R * 100 - Math.round(1 / R * 100)) < 1e-9 && Math.abs(r2 * 100 - Math.round(r2 * 100)) < 1e-9 && Math.abs(1 / r2 * 100 - Math.round(1 / r2 * 100)) < 1e-9 && Math.abs(xb * 100 - Math.round(xb * 100)) < 1e-9 && Math.abs(1 / xb * 100 - Math.round(1 / xb * 100)) < 1e-9 && Math.abs(Cs * 100 - Math.round(Cs * 100)) < 1e-9 && distinct([r2, xb, 1, R]))) continue;
    var ok = (ask == 1 ? r2 : 1 / r2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s7_three4(ok, [{x: (ask == 1 ? xb : 1 / xb), why: "図2の並列を合成していない（$C_1$ だけとした）", w: 0, cut: 1}, {x: (1), why: "合成せずに比べた（直列と並列で静電容量が違う）", w: 1, cut: 1}, {x: (ask == 1 ? R : 1 / R), why: "√をとった（静電エネルギーの時と混ぜた）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s7q", text: "静電容量 $C_1 = " + qv(a, "uF") + "$ と $C_2 = " + qv(b, "uF") + "$ のコンデンサがあります。図1は2つを直列にして電圧 $V_1$ を、図2は2つを並列にして電圧 $V_2$ を加えました。図1と図2で、合成静電容量に蓄えられる電荷が等しい時、$V_" + fmt(p) + "$ は $V_" + fmt(o) + "$ の何倍ですか。", fig: {kind: "u49s7tq", L: tbU49s7_fig({"src":"{V}_1","src2":"{V}_2"}, [["c1", "{C}_1=" + qf(a, "uF")], ["c2", "{C}_2=" + qf(b, "uF")], ["src", "{V}_1"], ["src2", "{V}_2"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["図1 直列 $\\dfrac{" + fmt(a) + " \\times " + fmt(b) + "}{" + fmt(a) + " + " + fmt(b) + "} = " + qv(Cs, "uF") + "$、図2 並列 $" + fmt(a) + " + " + fmt(b) + " = " + qv(Cp, "uF") + "$", "$Q = CV$ を「＝」で結ぶ　$" + fmt(Cs) + " \\times V_1 = " + fmt(Cp) + " \\times V_2$", "$V_1 = " + fmt(r2) + " V_2$　$V_" + fmt(p) + "$ は $V_" + fmt(o) + "$ の " + qv(ok, "X")], chk: {form: "u49s7q", p: {a: a, b: b, ask: ask}}};
  }
  throw new Error("u49s7q：条件に合う数字が見つからない");
}
// 49-8 一直線上で力が 0 になる電荷 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u49_s8.py から作った。手で直さない（データを直して作り直す）。）
function tbU49s8_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU49s8_ratio(a){ var g = a.reduce(function(x, y){ return tbU49s8_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU49s8_par(a, b){ return a * b / (a + b); }
function tbU49s8_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s8_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU49s8_three4(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && x > 0 && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s8_threen(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU49s8_three4n(ok, cands){ var v = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (isFinite(z.x) && nice(z.x) && distinct([ok].concat(v.map(function(w){ return w.x; }), [x]))) v.push({x: x, why: z.why, w: z.w, cut: z.cut}); });
  for (var a = 0; a < v.length; a++) for (var b = a + 1; b < v.length; b++) for (var c = b + 1; c < v.length; c++) {
    var s = [v[a], v[b], v[c]]; if (s.filter(function(z){ return z.cut; }).length >= 2) return s; }
  return null; }
function tbU49s8_Qb31(r){
  var gcd = tbU49s8_gcd, ratio = tbU49s8_ratio, par = tbU49s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var qa = pick(r, [9,18,27,36,45,54,72,81,90]);
    var m = pick(r, [0.1,0.2,0.5,1,2]);
    var RA = (3);
    var RB = (1);
    var da = (3 * m);
    var db = (1 * m);
    var ok = (qa * RB * RB / (RA * RA));
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s8_three4n(ok, [{x: (qa * RB / RA), why: "距離の比をそのまま使った（力は距離の2乗に反比例）", w: 0, cut: 1}, {x: (qa), why: "力を出さずに、A と同じ電荷とした（距離が違う）", w: 1, cut: 1}, {x: (qa * RA * RA / (RB * RB)), why: "距離の比を逆にした（近い方が力は大きい）", w: 2, cut: 0}, {x: (-qa * RB * RB / (RA * RA)), why: "B を負の電荷とした（負の電荷は P を引くので、A の力と同じ向きになる）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "C", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s8b31", text: "一直線上で、点 P の左 $" + fmt(da) + "\\,\\mathrm{m}$ の点 A に $+" + qv(qa, "C") + "$、右 $" + fmt(db) + "\\,\\mathrm{m}$ の点 B に電荷 $q_b$ を置きました。P に置いた正の電荷に働く力が 0 になる時、$q_b$ は何 C ですか。", fig: {kind: "u49s8l31", L: tbU49s8_fig({"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":""}, [["qa", "{q}_a=+" + qf(qa, "C")], ["qb", "{q}_b"], ["ra", fmt(da) + " m"], ["rb", fmt(db) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A は正なので、P の正の電荷を B の向きへ押す。0 にするには B も正で、A の向きへ押す", "2つの力の大きさが等しい　$9 \\times 10^9 \\times \\dfrac{" + fmt(qa) + " q}{" + fmt(da) + "^2} = 9 \\times 10^9 \\times \\dfrac{q_b q}{" + fmt(db) + "^2}$", "$q_b = " + fmt(qa) + " \\times \\dfrac{" + fmt(db) + "^2}{" + fmt(da) + "^2} = " + qv(ok, "C") + "$"], chk: {form: "u49s8b31", p: {qa: qa, m: m}}};
  }
  throw new Error("u49s8b31：条件に合う数字が見つからない");
}
function tbU49s8_Qb21(r){
  var gcd = tbU49s8_gcd, ratio = tbU49s8_ratio, par = tbU49s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var qa = pick(r, [4,8,12,16,20,24,32,36,40]);
    var m = pick(r, [0.1,0.2,0.5,1,2]);
    var RA = (2);
    var RB = (1);
    var da = (2 * m);
    var db = (1 * m);
    var ok = (qa * RB * RB / (RA * RA));
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s8_three4n(ok, [{x: (qa * RB / RA), why: "距離の比をそのまま使った（力は距離の2乗に反比例）", w: 0, cut: 1}, {x: (qa), why: "力を出さずに、A と同じ電荷とした（距離が違う）", w: 1, cut: 1}, {x: (qa * RA * RA / (RB * RB)), why: "距離の比を逆にした（近い方が力は大きい）", w: 2, cut: 0}, {x: (-qa * RB * RB / (RA * RA)), why: "B を負の電荷とした（負の電荷は P を引くので、A の力と同じ向きになる）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "C", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s8b21", text: "一直線上で、点 P の左 $" + fmt(da) + "\\,\\mathrm{m}$ の点 A に $+" + qv(qa, "C") + "$、右 $" + fmt(db) + "\\,\\mathrm{m}$ の点 B に電荷 $q_b$ を置きました。P に置いた正の電荷に働く力が 0 になる時、$q_b$ は何 C ですか。", fig: {kind: "u49s8l21", L: tbU49s8_fig({"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":""}, [["qa", "{q}_a=+" + qf(qa, "C")], ["qb", "{q}_b"], ["ra", fmt(da) + " m"], ["rb", fmt(db) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A は正なので、P の正の電荷を B の向きへ押す。0 にするには B も正で、A の向きへ押す", "2つの力の大きさが等しい　$9 \\times 10^9 \\times \\dfrac{" + fmt(qa) + " q}{" + fmt(da) + "^2} = 9 \\times 10^9 \\times \\dfrac{q_b q}{" + fmt(db) + "^2}$", "$q_b = " + fmt(qa) + " \\times \\dfrac{" + fmt(db) + "^2}{" + fmt(da) + "^2} = " + qv(ok, "C") + "$"], chk: {form: "u49s8b21", p: {qa: qa, m: m}}};
  }
  throw new Error("u49s8b21：条件に合う数字が見つからない");
}
function tbU49s8_Qb12(r){
  var gcd = tbU49s8_gcd, ratio = tbU49s8_ratio, par = tbU49s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var qa = pick(r, [1,2,3,4,5,6,8,10]);
    var m = pick(r, [0.1,0.2,0.5,1,2]);
    var RA = (1);
    var RB = (2);
    var da = (1 * m);
    var db = (2 * m);
    var ok = (qa * RB * RB / (RA * RA));
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s8_three4n(ok, [{x: (qa * RB / RA), why: "距離の比をそのまま使った（力は距離の2乗に反比例）", w: 0, cut: 1}, {x: (qa), why: "力を出さずに、A と同じ電荷とした（距離が違う）", w: 1, cut: 1}, {x: (qa * RA * RA / (RB * RB)), why: "距離の比を逆にした（近い方が力は大きい）", w: 2, cut: 0}, {x: (-qa * RB * RB / (RA * RA)), why: "B を負の電荷とした（負の電荷は P を引くので、A の力と同じ向きになる）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "C", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s8b12", text: "一直線上で、点 P の左 $" + fmt(da) + "\\,\\mathrm{m}$ の点 A に $+" + qv(qa, "C") + "$、右 $" + fmt(db) + "\\,\\mathrm{m}$ の点 B に電荷 $q_b$ を置きました。P に置いた正の電荷に働く力が 0 になる時、$q_b$ は何 C ですか。", fig: {kind: "u49s8l12", L: tbU49s8_fig({"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":""}, [["qa", "{q}_a=+" + qf(qa, "C")], ["qb", "{q}_b"], ["ra", fmt(da) + " m"], ["rb", fmt(db) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A は正なので、P の正の電荷を B の向きへ押す。0 にするには B も正で、A の向きへ押す", "2つの力の大きさが等しい　$9 \\times 10^9 \\times \\dfrac{" + fmt(qa) + " q}{" + fmt(da) + "^2} = 9 \\times 10^9 \\times \\dfrac{q_b q}{" + fmt(db) + "^2}$", "$q_b = " + fmt(qa) + " \\times \\dfrac{" + fmt(db) + "^2}{" + fmt(da) + "^2} = " + qv(ok, "C") + "$"], chk: {form: "u49s8b12", p: {qa: qa, m: m}}};
  }
  throw new Error("u49s8b12：条件に合う数字が見つからない");
}
function tbU49s8_Qb13(r){
  var gcd = tbU49s8_gcd, ratio = tbU49s8_ratio, par = tbU49s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var qa = pick(r, [1,2,3,4,5]);
    var m = pick(r, [0.1,0.2,0.5,1,2]);
    var RA = (1);
    var RB = (3);
    var da = (1 * m);
    var db = (3 * m);
    var ok = (qa * RB * RB / (RA * RA));
    if (!(isFinite(ok) && nice(ok))) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s8_three4n(ok, [{x: (qa * RB / RA), why: "距離の比をそのまま使った（力は距離の2乗に反比例）", w: 0, cut: 1}, {x: (qa), why: "力を出さずに、A と同じ電荷とした（距離が違う）", w: 1, cut: 1}, {x: (qa * RA * RA / (RB * RB)), why: "距離の比を逆にした（近い方が力は大きい）", w: 2, cut: 0}, {x: (-qa * RB * RB / (RA * RA)), why: "B を負の電荷とした（負の電荷は P を引くので、A の力と同じ向きになる）", w: 3, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "C", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s8b13", text: "一直線上で、点 P の左 $" + fmt(da) + "\\,\\mathrm{m}$ の点 A に $+" + qv(qa, "C") + "$、右 $" + fmt(db) + "\\,\\mathrm{m}$ の点 B に電荷 $q_b$ を置きました。P に置いた正の電荷に働く力が 0 になる時、$q_b$ は何 C ですか。", fig: {kind: "u49s8l13", L: tbU49s8_fig({"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":""}, [["qa", "{q}_a=+" + qf(qa, "C")], ["qb", "{q}_b"], ["ra", fmt(da) + " m"], ["rb", fmt(db) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["A は正なので、P の正の電荷を B の向きへ押す。0 にするには B も正で、A の向きへ押す", "2つの力の大きさが等しい　$9 \\times 10^9 \\times \\dfrac{" + fmt(qa) + " q}{" + fmt(da) + "^2} = 9 \\times 10^9 \\times \\dfrac{q_b q}{" + fmt(db) + "^2}$", "$q_b = " + fmt(qa) + " \\times \\dfrac{" + fmt(db) + "^2}{" + fmt(da) + "^2} = " + qv(ok, "C") + "$"], chk: {form: "u49s8b13", p: {qa: qa, m: m}}};
  }
  throw new Error("u49s8b13：条件に合う数字が見つからない");
}
function tbU49s8_Qpos(r){
  var gcd = tbU49s8_gcd, ratio = tbU49s8_ratio, par = tbU49s8_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var u = pick(r, [1,2,3,4,5]);
    var k = pick(r, [2,3,4,5]);
    var big = pick(r, [0,1]);
    var QA = (big == 1 ? k * k * u : u);
    var QB = (big == 1 ? u : k * k * u);
    var Rt = (big == 1 ? k : 1 / k);
    if (!(true && Math.abs(Rt * 100 - Math.round(Rt * 100)) < 1e-9 && Math.abs(QA / QB * 100 - Math.round(QA / QB * 100)) < 1e-9 && Math.abs(1 / Rt * 100 - Math.round(1 / Rt * 100)) < 1e-9)) continue;
    var ok = (Rt);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU49s8_three4(ok, [{x: (QA / QB), why: "√をとっていない（力は距離の2乗に反比例）", w: 0, cut: 1}, {x: (1), why: "力を出さずに真ん中とした（電荷が違う）", w: 1, cut: 1}, {x: (1 / Rt), why: "比を逆にした（大きい電荷の方が遠い）", w: 2, cut: 0}]);
    if (!_w) continue;
    var _c = num(r, null, "X", ok, _w);
    _c.ch.forEach(function(c){ _w.forEach(function(z){ if (!c.ok && c.v === z.x) { c.w = z.w; c.cut = z.cut; } }); });
    return {form: "u49s8pos", text: "一直線上の点 A に $+" + qv(QA, "C") + "$、点 B に $+" + qv(QB, "C") + "$ の電荷があります。A と B の間の点 P に置いた正の電荷に働く力が 0 です。P から A までの距離 $r_a$ は、P から B までの距離 $r_b$ の何倍ですか。", fig: {kind: "u49s8l11", L: tbU49s8_fig({"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":""}, [["qa", "{q}_a=+" + qf(QA, "C")], ["qb", "{q}_b=+" + qf(QB, "C")], ["qbs", "+"], ["ra", "{r}_a"], ["rb", "{r}_b"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["2つの力の大きさが等しい　$\\dfrac{" + fmt(QA) + "}{r_a^2} = \\dfrac{" + fmt(QB) + "}{r_b^2}$（$9 \\times 10^9$ と P の電荷は消える）", "$\\dfrac{r_a^2}{r_b^2} = \\dfrac{" + fmt(QA) + "}{" + fmt(QB) + "} = " + fmt(QA / QB) + "$", "√をとって　$\\dfrac{r_a}{r_b} = " + qv(ok, "X") + "$"], chk: {form: "u49s8pos", p: {QA: QA, QB: QB}}};
  }
  throw new Error("u49s8pos：条件に合う数字が見つからない");
}
var GEN = {
  // 49-1 層の中の電界
  1: function(r){ return pick(r, [tbU49s1_Qea, tbU49s1_Qea, tbU49s1_Qea, tbU49s1_Qeb, tbU49s1_Qeb, tbU49s1_Qeb, tbU49s1_Qda, tbU49s1_Qda, tbU49s1_Qdb, tbU49s1_Qdb, tbU49s1_Qra, tbU49s1_Qra, tbU49s1_Qrb, tbU49s1_Qrb])(r); },
  // 49-2 直列で充電して並列につなぐ
  2: function(r){ return pick(r, [tbU49s2_Qv, tbU49s2_Qv, tbU49s2_Qv, tbU49s2_Qq, tbU49s2_Qq, tbU49s2_Qr, tbU49s2_Qr])(r); },
  // 49-3 2つの回路のエネルギーを比べる
  3: function(r){ return pick(r, [tbU49s3_Qw, tbU49s3_Qw, tbU49s3_Qw, tbU49s3_Qnb, tbU49s3_Qnb, tbU49s3_Qq, tbU49s3_Qq])(r); },
  // 49-4 極板の形から合成して電荷
  4: function(r){ return pick(r, [tbU49s4_Qp, tbU49s4_Qp, tbU49s4_Qp, tbU49s4_Qs, tbU49s4_Qs, tbU49s4_Qr, tbU49s4_Qr])(r); },
  // 49-5 切り離して距離を変える
  5: function(r){ return pick(r, [tbU49s5_Qkw, tbU49s5_Qkw, tbU49s5_Qkw, tbU49s5_Qkv, tbU49s5_Qkv, tbU49s5_Qcw, tbU49s5_Qcw, tbU49s5_Qkr, tbU49s5_Qkr])(r); },
  // 49-6 直並列の電荷
  6: function(r){ return pick(r, [tbU49s6_Qqk, tbU49s6_Qqk, tbU49s6_Qqk, tbU49s6_Qv1, tbU49s6_Qv1, tbU49s6_Qbig, tbU49s6_Qbig, tbU49s6_Qrq, tbU49s6_Qrq])(r); },
  // 49-7 2つの図のエネルギーを等しく置く
  7: function(r){ return pick(r, [tbU49s7_Qw, tbU49s7_Qw, tbU49s7_Qw, tbU49s7_Qq, tbU49s7_Qq])(r); },
  // 49-8 一直線上で力が 0 になる電荷
  8: function(r){ return pick(r, [tbU49s8_Qb31, tbU49s8_Qb31, tbU49s8_Qb21, tbU49s8_Qb21, tbU49s8_Qb12, tbU49s8_Qb13, tbU49s8_Qpos, tbU49s8_Qpos, tbU49s8_Qpos])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t49s1e","scene":"t49s1e","kind":"u49s1xq","lab":{"top":"","bot":"","m1":"{ε}_r","m2":"空気","t1":"{d}_1","t2":"{d}_2","v":"{V}","v1":"{V}_1","v2":"{V}_2","e2":"{E}"},"viewbox":"-157 204 1336 368","band":{"want":"空気の部分の電界 $E$","ans":"分かれた電圧を層の厚さで割る"},"narr":{"start":{"co":1,"ed":0,"cutd":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①直列と読む\n②逆比で分圧\n③電界\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["M2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"極板と平行な層は、〖2つのコンデンサの直列〗です。静電容量は、それぞれ比誘電率と厚さで決まります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["M1","M2","Cut","T1","T2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖この静電容量の比で、電圧の分かれ方が決まります〗。直列なので逆比です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["V","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"〖分かれた電圧を、その層の厚さで割る〗と、層の電界です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"e","emph":["V2","T2","E2"],"eq":[{"cont":false,"items":[["E = \\dfrac{V_2}{d_2}"]]}],"ans":true,"emphPre":["V2","T2","E2"]}]}],"groups":{"M1":["m1f","m1t0","m1t1"],"M2":["m2t0","m2t1"],"Cut":["cut1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E1":["e1_0","e1_0:h","e1_1","e1_1:h","e1_2","e1_2:h","e1_3","e1_3:h","e1t0","e1t1"],"T1":["t1e1","t1e2","t1d","t1d:h","t1d:h2","t1t0","t1t1"],"V1":["v1a","v1a:h","v1t0","v1t1"],"E2":["e2_0","e2_0:h","e2_1","e2_1:h","e2_2","e2_2:h","e2_3","e2_3:h","e2t0","e2t1"],"T2":["t2e1","t2e2","t2d","t2d:h","t2d:h2","t2t0","t2t1"],"V2":["v2a","v2a:h","v2t0","v2t1"]},"moves":{"e":{"to":{"ed":1},"dur":0.8}},"route":["直列と読む","逆比で分圧","電界"]}},{"id":"t49s1x","scene":"t49s1x","kind":"u49s1xq","lab":{"top":"","bot":"","m1":"{ε}_r=4","m2":"空気","t1":"0.1 m","t2":"0.2 m","v":"900 V","v1":["{V}_1","100 V"],"v2":["{V}_2","800 V"],"e2":"{E}"},"viewbox":"-157 204 1336 368","band":{"want":"空気の部分の電界 $E$","known":"$V = 900\\,\\mathrm{V}$、誘電体 $0.1\\,\\mathrm{m}$・$\\varepsilon_r = 4$、空気 $0.2\\,\\mathrm{m}$","ans":"$E = 4000\\,\\mathrm{V/m}$"},"narr":{"start":{"co":1,"ed":0,"cutd":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、空気の部分の電界の強さ $E$ です。","at":{"強調":1.0},"after":[],"emph":["M2","E2"]},{"text":"①直列と読む\n②静電容量\n③逆比で分圧\n④電界\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["M2","E2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"誘電体は極板と平行なので、誘電体と空気の間で分けると〖誘電体の部分と空気の部分の直列〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"cut","emph":["M1","M2","Cut"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"面積 $S$ と $\\varepsilon_0$ は同じなので、比誘電率 ÷ 厚さ の比で比べます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["M1","T1","M2","T2"],"eq":[{"cont":false,"items":[["C_1 : C_2 = \\dfrac{4}{0.1} : \\dfrac{1}{0.2}"],["C_1 : C_2 = 40 : 5 = 8 : 1"]]}],"emphPre":["M1","T1","M2","T2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖この比を、次の電圧の分け方に使います〗。直列なので、電圧は逆比 $1 : 8$ で分かれます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":3,"emph":["V","V2"],"eq":[{"cont":false,"items":[["V_2 = 900 \\times \\dfrac{8}{1 + 8} = 800\\,\\mathrm{V}"]]}],"move":"v2","emphPre":["V","V2"]},{"text":"誘電体の部分は、残りの $100\\,\\mathrm{V}$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"v1","emph":["V1"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"〖この $800\\,\\mathrm{V}$ は空気の層だけにかかる電圧〗なので、空気の層の中に電界ができます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":4,"move":"e","emph":["V2","E2"]},{"text":"空気の厚さで割ります。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["V2","T2","E2"],"eq":[{"cont":false,"items":[["E = \\dfrac{V_2}{d_2}"],["E = \\dfrac{800}{0.2} = 4000\\,\\mathrm{V/m}"]]}],"ans":true,"emphPre":["V2","T2","E2"]}]}],"groups":{"M1":["m1f","m1t0","m1t1"],"M2":["m2t0","m2t1"],"Cut":["cut1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E1":["e1_0","e1_0:h","e1_1","e1_1:h","e1_2","e1_2:h","e1_3","e1_3:h","e1t0","e1t1"],"T1":["t1e1","t1e2","t1d","t1d:h","t1d:h2","t1t0","t1t1"],"V1":["v1a","v1a:h","v1t0","v1t1"],"E2":["e2_0","e2_0:h","e2_1","e2_1:h","e2_2","e2_2:h","e2_3","e2_3:h","e2t0","e2t1"],"T2":["t2e1","t2e2","t2d","t2d:h","t2d:h2","t2t0","t2t1"],"V2":["v2a","v2a:h","v2t0","v2t1"]},"moves":{"cut":{"to":{"cutd":1},"dur":0.6},"v2":{"to":{"v2v":1},"dur":0.4},"v1":{"to":{"v1v":1},"dur":0.4},"e":{"to":{"ed":1},"dur":0.8}},"route":["直列と読む","静電容量","逆比で分圧","電界"]}},{"id":"t49s2e","scene":"t49s2e","kind":"u49s2xs","lab":{"c1":"{C}_1","c2":"{C}_2","src":"{E}","sw":"S","dir":"rl","_v":{"v1":1,"v2":2,"v":1.5}},"viewbox":"464 236 1393 568","band":{"want":"つないだ後の電圧 $V'$","ans":"電荷の合計を並列の静電容量で割る"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①電荷の合計\n②並列の合成\n③電圧\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"直列で充電すると、2つの電荷は同じです。〖その2つ分〗が、つないでも変わらない電荷の合計です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"sw","emph":["C1","C2","src","SW","Iso"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"同じ極性どうしつなぐと並列なので、静電容量は足します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"mv","emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖電荷の合計を並列の静電容量で割る〗と、つないだ後の電圧です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["V' = \\dfrac{2Q}{C_1 + C_2}"]]}],"ans":true,"emphPre":["C1","C2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","c1x1","c1:bx1","c1tx10","c1tx11"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","c2x1","c2:bx1","c2tx10","c2tx11"],"zhi":["u49s2xsL","u49s2xsw1"],"zlo":["u49s2xsRw","u49s2xsw3"],"zmid":["u49s2xsw2"],"Q1":["q1px10","q1px11","q1mx10","q1mx11"],"Q2":["q2px10","q2px11","q2mx10","q2mx11"],"SW":["swp0x1","swp1x1","swx1","swox1"],"V1":["v1ax1","v1ax1:h","v1tx10","v1tx11"],"V2":["v2ax1","v2ax1:h","v2tx10","v2tx11"],"Iso":["isox1"],"Iso2":["iso2x1"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"mv":{"to":{"mvq":1},"dur":1.0}},"route":["電荷の合計","並列の合成","電圧"]}},{"id":"t49s2x","scene":"t49s2x","kind":"u49s2xs","lab":{"c1":"{C}_1=6 μF","c2":"{C}_2=3 μF","src":"{E}=90 V","sw":"S","dir":"rl","_v":{"v1":30,"v2":60,"v":40}},"viewbox":"464 236 1393 568","band":{"want":"つないだ後の電圧 $V'$","known":"$C_1 = 6\\,\\mu\\mathrm{F}$、$C_2 = 3\\,\\mu\\mathrm{F}$ を直列にして $90\\,\\mathrm{V}$ で充電","ans":"$V' = 40\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、図2でつないだ後の電圧 $V'$ です。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]},{"text":"①直列の電荷\n②電荷の合計\n③並列の合成\n④電圧\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"図1は直列なので、和分の積で合成します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["\\dfrac{6 \\times 3}{6 + 3} = 2\\,\\mu\\mathrm{F}"]]}],"emphPre":["C1","C2"]},{"text":"$Q = CV$ で電荷を出します。直列なので、2つとも同じ電荷です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src"],"eq":[{"cont":false,"items":[["Q = 2 \\times 90 = 180\\,\\mu\\mathrm{C}"]]}],"emphPre":["src"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖この $180\\,\\mu\\mathrm{C}$ が2つ分〗です。切り離してつないでも、合計は変わりません。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"sw","emph":["C1","C2"],"eq":[{"cont":false,"items":[["180 + 180 = 360\\,\\mu\\mathrm{C}"]]}],"emphPre":["SW","Iso"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"同じ極性どうしつなぐと並列なので、静電容量は足します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"move":"mv","emph":["C1","C2"],"eq":[{"cont":false,"items":[["6 + 3 = 9\\,\\mu\\mathrm{F}"]]}],"emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖合計の $360\\,\\mu\\mathrm{C}$ を、並列の $9\\,\\mu\\mathrm{F}$ で割ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["V' = \\dfrac{360}{9} = 40\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["C1","C2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","c1x1","c1:bx1","c1tx10","c1tx11"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","c2x1","c2:bx1","c2tx10","c2tx11"],"zhi":["u49s2xsL","u49s2xsw1"],"zlo":["u49s2xsRw","u49s2xsw3"],"zmid":["u49s2xsw2"],"Q1":["q1px10","q1px11","q1mx10","q1mx11"],"Q2":["q2px10","q2px11","q2mx10","q2mx11"],"SW":["swp0x1","swp1x1","swx1","swox1"],"V1":["v1ax1","v1ax1:h","v1tx10","v1tx11"],"V2":["v2ax1","v2ax1:h","v2tx10","v2tx11"],"Iso":["isox1"],"Iso2":["iso2x1"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"mv":{"to":{"mvq":1},"dur":1.0}},"route":["直列の電荷","電荷の合計","並列の合成","電圧"]}},{"id":"t49s3e","scene":"t49s3e","kind":"u49s3ps","lab":{"c1":"{C}","c2":"{C}","src":"{E}_1","src2":"{E}_2"},"viewbox":"464 177 1250 594","band":{"want":"2つの回路の静電エネルギーの比","ans":"$W$ どうしを割る"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①合成\n②静電エネルギー\n③比\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"それぞれの回路の合成静電容量を出します。図1 は並列なので足し、図2 は直列なので和分の積です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖この合成と、その回路の電源の電圧〗で、静電エネルギーを出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["C1","C2","src","src2"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2}CV^2"]]}],"emphPre":["C1","C2","src","src2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"2つの $W$ を割ると、何倍かが出ます。","at":{"道筋":1.0,"答え":1.0},"after":[],"route":3,"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","c1x1","c1x1t0","c1x1t1","c1x1:b","c1x1:l1","c1x1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","c2x1","c2x1t0","c2x1t1","c2x1:b","c2x1:l1","c2x1:l2"],"zhi":["u49s3psL","u49s3psw1","u49s3psw3","u49s3psw5","u49s3psw7","u49s3psx1L","u49s3psx1w1"],"zlo":["u49s3psRw","u49s3psw2","u49s3psw4","u49s3psw6","u49s3psw8","u49s3psx1Rw","u49s3psx1w3"],"src2":["c2x1:L","c2x1:S","pp2x1","pm2x1","e2x10","e2x11"],"zmid":["u49s3psx1w2"]},"moves":{},"route":["合成","静電エネルギー","比"]}},{"id":"t49s3x","scene":"t49s3x","kind":"u49s3ps","lab":{"c1":"{C}","c2":"{C}","src":"{E}","src2":"3{E}"},"viewbox":"464 177 1250 594","band":{"want":"図1 の $W$ は図2 の何倍か","known":"同じ $C$ を2つ、図1 並列・$E$、図2 直列・$3E$","ans":"4/9 倍"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、図1 の静電エネルギーが図2 の何倍かです。","at":{},"after":[]},{"text":"①合成\n②静電エネルギー\n③比\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"図1 は並列なので足して $2C$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["C + C = 2C"]]}],"emphPre":["C1","C2"]},{"text":"図2 は直列なので和分の積で $\\dfrac{C}{2}$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C1","C2"],"eq":[{"cont":false,"items":[["\\dfrac{C \\times C}{C + C} = \\dfrac{C}{2}"]]}],"emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖この合成と、それぞれの電源の電圧〗で $W$ を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["src","C1","C2"],"eq":[{"cont":false,"items":[["W_1 = \\dfrac{1}{2} \\times 2C \\times E^2"],["W_1 = CE^2"]]}],"emphPre":["src","C1","C2"]},{"text":"図2 の電圧は $3E$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","src2","C1","C2"],"eq":[{"cont":false,"items":[["W_2 = \\dfrac{1}{2} \\times \\dfrac{C}{2} \\times (3E)^2"],["W_2 = \\dfrac{9}{4}CE^2"]]}],"emphPre":["src","src2","C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖2つの $W$ を割ります〗。$CE^2$ は消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C1","C2","src","src2"],"eq":[{"cont":false,"items":[["\\dfrac{W_1}{W_2} = \\dfrac{CE^2}{\\dfrac{9}{4}CE^2} = \\dfrac{4}{9}"]]}],"ans":true,"emphPre":["C1","C2","src","src2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","c1x1","c1x1t0","c1x1t1","c1x1:b","c1x1:l1","c1x1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","c2x1","c2x1t0","c2x1t1","c2x1:b","c2x1:l1","c2x1:l2"],"zhi":["u49s3psL","u49s3psw1","u49s3psw3","u49s3psw5","u49s3psw7","u49s3psx1L","u49s3psx1w1"],"zlo":["u49s3psRw","u49s3psw2","u49s3psw4","u49s3psw6","u49s3psw8","u49s3psx1Rw","u49s3psx1w3"],"src2":["c2x1:L","c2x1:S","pp2x1","pm2x1","e2x10","e2x11"],"zmid":["u49s3psx1w2"]},"moves":{},"route":["合成","静電エネルギー","比"]}},{"id":"t49s4e","scene":"t49s4e","kind":"u49s4pa","lab":{"c1":"{C}_1","c2":"{C}_2","src":"{V}"},"viewbox":"464 214 595 420","band":{"want":"電荷の合計 $Q$","ans":"$C_2$ を出してから合成し、$Q = CV$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"①C=εS/d\n②合成\n③Q=CV\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_2$ は、面積・距離・比誘電率から、$C_1$ の何倍かを出します。面積と比誘電率に比例し、距離に反比例します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["C = \\dfrac{\\varepsilon S}{d}"]]}],"emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖出した $C_2$ を使って〗合成します。並列なら足し、直列なら和分の積です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"合成した静電容量と電圧で、電荷を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C1","C2","src"],"eq":[{"cont":false,"items":[["Q = CV"]]}],"ans":true,"emphPre":["C1","C2","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"zhi":["u49s4paL","u49s4paw1","u49s4paw3","u49s4paw5","u49s4paw7"],"zlo":["u49s4paRw","u49s4paw2","u49s4paw4","u49s4paw6","u49s4paw8"]},"moves":{},"route":["C=εS/d","合成","Q=CV"]}},{"id":"t49s4x","scene":"t49s4x","kind":"u49s4pa","lab":{"c1":"{C}_1=2 μF","c2":["{C}_2","{C}_2=3 μF"],"src":"{V}=100 V"},"viewbox":"464 214 595 420","band":{"want":"電荷の合計 $Q$","known":"$C_1 = 2\\,\\mu\\mathrm{F}$（$S$・$d$）、$C_2$ は面積 $3S$・距離 $2d$、並列に $100\\,\\mathrm{V}$","ans":"$Q = 500\\,\\mu\\mathrm{C}$"},"narr":{"start":{"co":1,"c2v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、並列の2つに蓄えられる電荷の合計です。","at":{"強調":1.0},"after":[],"emph":["C1","C2"]},{"text":"①C=εS/d\n②合成\n③Q=CV\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"$C_2$ は面積が 3 倍なので $C$ は 3 倍、距離が 2 倍なので $C$ は $\\dfrac{1}{2}$ 倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["C2"],"eq":[{"cont":false,"items":[["C_2 = 2 \\times 3 \\times \\dfrac{1}{2} = 3\\,\\mu\\mathrm{F}"]]}],"move":"c2","emphPre":["C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖この $3\\,\\mu\\mathrm{F}$ を使って〗合成します。並列なので足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["2 + 3 = 5\\,\\mu\\mathrm{F}"]]}],"emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"合成した $5\\,\\mu\\mathrm{F}$ と $100\\,\\mathrm{V}$ で、電荷を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["C1","C2","src"],"eq":[{"cont":false,"items":[["Q = 5 \\times 100 = 500\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["C1","C2","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"zhi":["u49s4paL","u49s4paw1","u49s4paw3","u49s4paw5","u49s4paw7"],"zlo":["u49s4paRw","u49s4paw2","u49s4paw4","u49s4paw6","u49s4paw8"]},"moves":{"c2":{"to":{"c2v":1},"dur":0.4}},"route":["C=εS/d","合成","Q=CV"]}},{"id":"t49s5e","scene":"t49s5e","kind":"u49s5pe","lab":{"c":["{C}","{C}'"],"d":["{d}","{d}/2"],"top":"","bot":""},"viewbox":"124 204 794 368","band":{"want":"切り離して距離を変えた後の静電エネルギー","ans":"静電容量を変える → 電荷は変わらない → $W = \\dfrac{Q^2}{2C'}$","full":"電源から切り離したコンデンサは、極板間の距離を変えても電荷 Q が変わらない。距離から後の静電容量 C' を出し、W = Q²/(2C') で静電エネルギーを出す。電源につないだままなら、変わらないのは電圧 V。"},"narr":{"start":{"co":1,"dz":0,"dv":0,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"①静電容量を変える\n②電荷は変わらない\n③静電エネルギー\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"距離を半分にすると、静電容量は距離に反比例するので 2 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"dz","emph":["D","Cap"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖電源から切り離したので、電荷 $Q$ は変わりません〗。つないだままなら、変わらないのは電圧 $V$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Top","Bot"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖変わらない $Q$ と、後の $C'$〗で静電エネルギーを出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Cap"],"eq":[{"cont":false,"items":[["W = \\dfrac{Q^2}{2C'}"]]}],"ans":true,"emphPre":["Cap"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"dz":{"to":{"dz":1,"dv":1,"cv":1},"dur":0.8}},"route":["静電容量を変える","電荷は変わらない","静電エネルギー"]}},{"id":"t49s5x","scene":"t49s5x","kind":"u49s5pe","lab":{"c":["{C}=4 F","{C}'=8 F"],"d":["{d}","{d}/2"],"top":"","bot":""},"viewbox":"124 204 794 368","band":{"want":"切り離して距離を半分にした後の静電エネルギー $W$","known":"$C = 4\\,\\mathrm{F}$ を $10\\,\\mathrm{V}$ で充電・切り離して距離を半分","ans":"$W = 100\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"dz":0,"dv":0,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、切り離して距離を半分にした後の静電エネルギー $W$ です。","at":{"強調":1.0},"after":[],"emph":["Cap"]},{"text":"①静電容量を変える\n②電荷は変わらない\n③静電エネルギー\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Cap"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"距離を半分にします。静電容量は距離に反比例するので 2 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"dz","emph":["D","Cap"]},{"text":"後の静電容量です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["Cap"],"eq":[{"cont":false,"items":[["C' = 4 \\times 2 = 8\\,\\mathrm{F}"]]}],"move":"c","emphPre":["Cap"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖電源から切り離したので、電荷は前のまま〗です。前の電荷を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["Cap"],"eq":[{"cont":false,"items":[["Q = CV = 4 \\times 10 = 40\\,\\mathrm{C}"]]}],"emphPre":["Cap"]},{"text":"〖この $40\\,\\mathrm{C}$ を後の $C'$ で割る〗と、電圧は下がって $5\\,\\mathrm{V}$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Cap"],"eq":[{"cont":false,"items":[["V' = \\dfrac{Q}{C'} = \\dfrac{40}{8} = 5\\,\\mathrm{V}"]]}],"emphPre":["Cap"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"変わらない電荷と後の静電容量で、静電エネルギーを出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Cap"],"eq":[{"cont":false,"items":[["W = \\dfrac{Q^2}{2C'} = \\dfrac{40^2}{2 \\times 8} = 100\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["Cap"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"dz":{"to":{"dz":1,"dv":1},"dur":0.8},"c":{"to":{"cv":1},"dur":0.4}},"route":["静電容量を変える","電荷は変わらない","静電エネルギー"]}},{"id":"t49s6e","scene":"t49s6e","kind":"u49s6sx","lab":{"c1":"{C}_1","c2":"{C}_2","c3":"{C}_3","src":"{V}","q1":"{Q}","v2":"{V}_2","q3":"{Q}_3"},"viewbox":"464 146 595 488","band":{"want":"並列の片方 $C_3$ の電荷 $Q_3$","ans":"合成 → 全体の電荷 → 並列の電圧 → 電荷","full":"並列を足し、C1 と直列に合成して全体の電荷 Q = CV を出す。直列なので並列の部分にも Q が入る。Q を並列の合成静電容量で割ると並列の電圧、それに C3 を掛けると C3 の電荷。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"①合成\n②全体の電荷\n③並列の電圧\n④電荷\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C3","Q3"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列の $C_2$ と $C_3$ を足し、$C_1$ と直列に合成します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","C2","C3"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"合成静電容量に $V$ を掛けると全体の電荷 $Q$ です。〖直列なので、$C_1$ にも並列の部分にも $Q$ が入ります〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["src","Q1","C1"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"〖この $Q$ を並列の合成静電容量で割る〗と、並列の電圧 $V_2$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["Q1","C2","C3","V2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列の電圧に $C_3$ を掛けると、$C_3$ の電荷です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["V2","C3","Q3"],"eq":[{"cont":false,"items":[["Q_3 = C_3 V_2"]]}],"ans":true,"emphPre":["V2","C3","Q3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"C3":["c3","c3t0","c3t1","c3:b","c3:l1","c3:l2"],"zhi":["u49s6sxL","u49s6sxw1","zbu49s6sx0hi"],"zlo":["u49s6sxRw","u49s6sxw3","u49s6sxw5","u49s6sxw7","u49s6sxw9","zbu49s6sx1lo"],"zmid":["u49s6sxw2","u49s6sxw4","u49s6sxw6","u49s6sxw8","zbu49s6sx2mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q3":["q3p0","q3p1","q3m0","q3m1"]},"moves":{},"route":["合成","全体の電荷","並列の電圧","電荷"]}},{"id":"t49s6x","scene":"t49s6x","kind":"u49s6sx","lab":{"c1":"{C}_1=4 μF","c2":"{C}_2=1 μF","c3":"{C}_3=3 μF","src":"{V}=100 V","q1":"{Q}","v2":["{V}_2","{V}_2=50 V"],"q3":"{Q}_3","_v":{"c1":4,"c2":1,"c3":3}},"viewbox":"464 146 595 488","band":{"want":"$C_3$ の電荷 $Q_3$","known":"$C_1 = 4\\,\\mu\\mathrm{F},\\;\\; C_2 = 1\\,\\mu\\mathrm{F},\\;\\; C_3 = 3\\,\\mu\\mathrm{F},\\;\\; V = 100\\,\\mathrm{V}$","ans":"$Q_3 = 150\\,\\mu\\mathrm{C}$"},"narr":{"start":{"co":1,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"求めるのは、$C_3$ の電荷 $Q_3$ です。","at":{"強調":1.0},"after":[],"emph":["C3","Q3"]},{"text":"①合成\n②全体の電荷\n③並列の電圧\n④電荷\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C3","Q3"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列の $C_2$ と $C_3$ は足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["C2","C3"],"eq":[{"cont":false,"items":[["1 + 3 = 4\\,\\mu\\mathrm{F}"]]}],"emphPre":["C2","C3"]},{"text":"$C_1$ との直列は和分の積です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C1","C2","C3"],"eq":[{"cont":false,"items":[["\\dfrac{4 \\times 4}{4 + 4} = 2\\,\\mu\\mathrm{F}"]]}],"emphPre":["C1","C2","C3"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"合成静電容量に電源の電圧を掛けて、全体の電荷です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["src","Q1"],"eq":[{"cont":false,"items":[["Q = 2 \\times 100 = 200\\,\\mu\\mathrm{C}"]]}],"emphPre":["src","Q1"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖この $200\\,\\mu\\mathrm{C}$ が並列の部分にも入ります〗。並列の合成静電容量で割ると、並列の電圧です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":3,"emph":["Q1","V2"],"eq":[{"cont":false,"items":[["V_2 = \\dfrac{200}{4} = 50\\,\\mathrm{V}"]]}],"move":"v","emphPre":["Q1","C2","C3","V2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"並列の電圧に $C_3$ を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["V2","C3","Q3"],"eq":[{"cont":false,"items":[["Q_3 = 3 \\times 50 = 150\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["V2","C3","Q3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"C3":["c3","c3t0","c3t1","c3:b","c3:l1","c3:l2"],"zhi":["u49s6sxL","u49s6sxw1","zbu49s6sx0hi"],"zlo":["u49s6sxRw","u49s6sxw3","u49s6sxw5","u49s6sxw7","u49s6sxw9","zbu49s6sx1lo"],"zmid":["u49s6sxw2","u49s6sxw4","u49s6sxw6","u49s6sxw8","zbu49s6sx2mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q3":["q3p0","q3p1","q3m0","q3m1"]},"moves":{"v":{"to":{"v2v":1},"dur":0.4}},"route":["合成","全体の電荷","並列の電圧","電荷"]}},{"id":"t49s7e","scene":"t49s7e","kind":"u49s7tx","lab":{"c1":"{C}","c2":"{C}","src":"{V}_1","src2":"{V}_2"},"viewbox":"440 285 654 719","band":{"want":"静電エネルギーが等しい時の $V_1$ と $V_2$ の比","ans":"合成 → 静電エネルギー → 等しく置く","full":"図1（直列）と図2（並列）の合成静電容量を出し、それぞれの静電エネルギー W = CV²/2 を出す。2つを「＝」で結ぶと電圧の2乗の比が出るので、√をとる。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[29,30],"sents":[{"text":"①合成\n②静電エネルギー\n③等しく置く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","src2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"図1は直列、図2は並列です。それぞれ合成静電容量を出します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"合成静電容量と電源の電圧で、〖それぞれの静電エネルギー〗を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["C1","C2","src","src2"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"]]}],"emphPre":["C1","C2","src","src2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖2つの静電エネルギーを「＝」で結ぶ〗と、電圧の2乗の比が出ます。√をとって $V_1$ と $V_2$ の比です。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["src","src2"]}]}],"groups":{"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","c1x1","c1x1t0","c1x1t1","c1x1:b","c1x1:l1","c1x1:l2"],"src":["c:L","c:S","pp","pm","e0","e1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","c2x1","c2x1t0","c2x1t1","c2x1:b","c2x1:l1","c2x1:l2"],"zhi":["u49s7txL","u49s7txw4","zbu49s7tx0hi","u49s7txx1L","u49s7txx1w3","u49s7txx1w5","u49s7txx1w7","u49s7txx1w9","zbu49s7txx10hi"],"zmid":["u49s7txw2","u49s7txw6","zbu49s7tx1mid"],"zlo":["u49s7txw3","u49s7txw5","u49s7txw7","zbu49s7tx2lo","u49s7txx1w2","u49s7txx1w4","u49s7txx1w6","u49s7txx1w8","u49s7txx1w10","zbu49s7txx11lo"],"src2":["c2x1:L","c2x1:S","pp2x1","pm2x1","e2x10","e2x11"]},"moves":{},"route":["合成","静電エネルギー","等しく置く"]}},{"id":"t49s7x","scene":"t49s7x","kind":"u49s7tx","lab":{"c1":"{C}","c2":"{C}","src":"{V}_1","src2":"{V}_2"},"viewbox":"440 285 654 719","band":{"want":"$V_1$ は $V_2$ の何倍か","known":"同じ静電容量 $C$ を2つ・図1 直列に $V_1$・図2 並列に $V_2$・静電エネルギーが等しい","ans":"$2$ 倍"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、静電エネルギーが等しい時、$V_1$ が $V_2$ の何倍かです。","at":{"強調":1.0},"after":[],"emph":["src","src2"]},{"text":"①合成\n②静電エネルギー\n③等しく置く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","src2"]}]},{"cap":null,"eqp":null,"vid":[29],"sents":[{"text":"図1は直列です。和分の積で合成します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["C1","C2"],"eq":[{"cont":false,"items":[["\\dfrac{C \\times C}{C + C} = \\dfrac{C}{2}"]]}],"emphPre":["C1","C2"]},{"text":"図2は並列です。足して合成します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C1","C2"],"eq":[{"cont":false,"items":[["C + C = 2C"]]}],"emphPre":["C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖この合成静電容量で〗、それぞれの静電エネルギーを出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["C1","C2","src","src2"],"eq":[{"cont":false,"items":[["W_1 = \\dfrac{1}{2} \\times \\dfrac{C}{2} \\times V_1^2","W_2 = \\dfrac{1}{2} \\times 2C \\times V_2^2"]]}],"emphPre":["C1","C2","src","src2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖2つを「＝」で結びます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["C1","C2","src","src2"],"eq":[{"cont":false,"items":[["\\dfrac{C}{4} V_1^2 = C V_2^2"],["V_1^2 = 4 V_2^2"]]}],"emphPre":["C1","C2","src","src2"]},{"text":"2乗が 4 倍なので、√をとって 2 倍です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["src","src2"],"eq":[{"cont":false,"items":[["V_1 = 2 V_2"]]}],"ans":true,"emphPre":["src","src2"]}]}],"groups":{"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2","c1x1","c1x1t0","c1x1t1","c1x1:b","c1x1:l1","c1x1:l2"],"src":["c:L","c:S","pp","pm","e0","e1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2","c2x1","c2x1t0","c2x1t1","c2x1:b","c2x1:l1","c2x1:l2"],"zhi":["u49s7txL","u49s7txw4","zbu49s7tx0hi","u49s7txx1L","u49s7txx1w3","u49s7txx1w5","u49s7txx1w7","u49s7txx1w9","zbu49s7txx10hi"],"zmid":["u49s7txw2","u49s7txw6","zbu49s7tx1mid"],"zlo":["u49s7txw3","u49s7txw5","u49s7txw7","zbu49s7tx2lo","u49s7txx1w2","u49s7txx1w4","u49s7txx1w6","u49s7txx1w8","u49s7txx1w10","zbu49s7txx11lo"],"src2":["c2x1:L","c2x1:S","pp2x1","pm2x1","e2x10","e2x11"]},"moves":{},"route":["合成","静電エネルギー","等しく置く"]}},{"id":"t49s8e","scene":"t49s8e","kind":"u49s8l31","lab":{"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":"","qa":"{q}_a","qb":"{q}_b","ra":"{r}_a","rb":"{r}_b","f1":"{F}_a","f2":"{F}_b","f1a":"out","f2a":"out"},"viewbox":"153 304 830 322","band":{"want":"P の力が 0 になる B の電荷","ans":"2つの力 → 向き → 等しく置いて解く","full":"P の電荷が A・B から受ける力をクーロンの法則で別々に出す。一直線上なので力は足し引きで合わせ、逆向きで同じ大きさなら 0。2つの力の大きさを「＝」で結んで解く。"},"narr":{"start":{"co":1,"f1d":0,"f2d":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"①2つの力\n②向き\n③等しく置いて解く\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q0"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"P の電荷が A から受ける力と、B から受ける力を、クーロンの法則で別々に出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"f","emph":["F1","F2","Qa","Qb","Q0"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"〖一直線上なので、力は足し引きで合わせます〗。逆向きで同じ大きさなら、打ち消し合って 0 です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["F1","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"〖2つの力の大きさを「＝」で結んで〗、B の電荷を解きます。$9 \\times 10^9$ は両方にあるので消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Qa","Qb","Q0","Ra","Rb"],"eq":[{"cont":false,"items":[["\\dfrac{q_a q}{r_a^2} = \\dfrac{q_b q}{r_b^2}"]]}],"ans":true,"emphPre":["Qa","Qb","Q0","Ra","Rb"]}]}],"groups":{"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Q0":["q0c","q0c:t","q0m","q0mt","q0t0","q0t1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Na":["nat0","nat1"],"N0":["n0t0","n0t1"],"Nb":["nbt0","nbt1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"F":["fa","fa:h","ft0","ft1"],"Ra":["rae1","rae2","rad","rad:h","rad:h2","rat0","rat1"],"Rb":["rbe1","rbe2","rbd","rbd:h","rbd:h2","rbt0","rbt1"]},"moves":{"f":{"to":{"f1d":1,"f2d":1},"dur":0.8}},"route":["2つの力","向き","等しく置いて解く"]}},{"id":"t49s8x","scene":"t49s8x","kind":"u49s8l31","lab":{"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":"","qa":"{q}_a=+9 C","qb":["{q}_b","{q}_b=+1 C"],"ra":"3 m","rb":"1 m","f1":"{F}_a","f2":"{F}_b","f1a":"out","f2a":"out"},"viewbox":"153 304 830 322","band":{"want":"P の力が 0 になる $q_b$","known":"A に $+9\\,\\mathrm{C}$（P から $3\\,\\mathrm{m}$）・B は P から $1\\,\\mathrm{m}$","ans":"$q_b = 1\\,\\mathrm{C}$"},"narr":{"start":{"co":1,"f1d":0,"f2d":0,"qbv":0},"steps":[{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"求めるのは、P の力が 0 になる時の B の電荷 $q_b$ です。","at":{"強調":1.0},"after":[],"emph":["Qb"]},{"text":"①2つの力\n②向き\n③等しく置いて解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Qb"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"A は正の電荷なので、P の正の電荷を右へ押します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"fa","emph":["Qa","Q0","F1"]},{"text":"A から受ける力です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Qa","Q0","Ra","F1"],"eq":[{"cont":false,"items":[["F_a = 9 \\times 10^9 \\times \\dfrac{9 q}{3^2}"]]}],"emphPre":["Qa","Q0","Ra","F1"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"力を 0 にするには、B から左向きの力が要ります。〖左へ押すので、B も正の電荷〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"fb","emph":["Qb","F2"]},{"text":"B から受ける力です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Qb","Q0","Rb","F2"],"eq":[{"cont":false,"items":[["F_b = 9 \\times 10^9 \\times \\dfrac{q_b q}{1^2}"]]}],"emphPre":["Qb","Q0","Rb","F2"]}]},{"cap":null,"eqp":null,"vid":[27],"sents":[{"text":"〖逆向きの2つの力が同じ大きさ〗なら 0 です。「＝」で結びます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["F1","F2","Qa","Qb","Q0"],"eq":[{"cont":false,"items":[["F_a = F_b"]]}],"emphPre":["F1","F2","Qa","Qb","Q0"]},{"text":"$9 \\times 10^9$ と $q$ は両方にあるので消えます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["Qa","Q0","Qb"],"eq":[{"cont":false,"items":[["\\dfrac{9}{3^2} = \\dfrac{q_b}{1^2}"],["q_b = 1\\,\\mathrm{C}"]]}],"move":"qb","ans":true,"emphPre":["Qa","Q0","Qb"]}]}],"groups":{"Qa":["qac","qac:t","qam","qamt","qat0","qat1"],"Q0":["q0c","q0c:t","q0m","q0mt","q0t0","q0t1"],"Qb":["qbc","qbc:t","qbm","qbmt","qbt0","qbt1"],"Na":["nat0","nat1"],"N0":["n0t0","n0t1"],"Nb":["nbt0","nbt1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"F":["fa","fa:h","ft0","ft1"],"Ra":["rae1","rae2","rad","rad:h","rad:h2","rat0","rat1"],"Rb":["rbe1","rbe2","rbd","rbd:h","rbd:h2","rbt0","rbt1"]},"moves":{"fa":{"to":{"f1d":1},"dur":0.6},"fb":{"to":{"f2d":1},"dur":0.6},"qb":{"to":{"qbv":1},"dur":0.4}},"route":["2つの力","向き","等しく置いて解く"]}}],"secs":[{"ex":{"text":"極板の間に、厚さ $0.1\\,\\mathrm{m}$・比誘電率 $4$ の誘電体と、厚さ $0.2\\,\\mathrm{m}$ の空気の層が、極板と平行に入っています。極板の間の電圧は $900\\,\\mathrm{V}$ です。空気の部分の電界の強さ $E$ は何 V/m ですか。","fig":{"kind":"u49s1xq","L":{"top":"","bot":"","m1":"{ε}_r=4","m2":"空気","t1":"0.1 m","t2":"0.2 m","e2":"{E}"},"P":{}},"ch":[{"t":"$3000\\,\\mathrm{V/m}$","v":3000,"why":"層に分けず、全部の電圧を全部の距離で割った"},{"t":"$4000\\,\\mathrm{V/m}$","v":4000,"why":""},{"t":"$800\\,\\mathrm{V/m}$","v":800,"why":"空気の部分の電圧で止めた（厚さで割っていない）"},{"t":"$500\\,\\mathrm{V/m}$","v":500,"why":"誘電体の部分の電圧 $100\\,\\mathrm{V}$ を使った（逆比の取り違え）"}],"ans":1}},{"ex":{"text":"図1のように、$C_1 = 6\\,\\mu\\mathrm{F}$ と $C_2 = 3\\,\\mu\\mathrm{F}$ を直列にして、$90\\,\\mathrm{V}$ で充電しました。電源から切り離し、図2のように同じ極性どうしをつなぎ、スイッチ S を閉じました。つないだ後の電圧は何 V ですか。","fig":{"kind":"u49s2xq","L":{"c1":"{C}_1=6 μF","c2":"{C}_2=3 μF","src":"{E}=90 V","sw":"S"},"P":{}},"ch":[{"t":"$20\\,\\mathrm{V}$","v":20,"why":"電荷を1つ分しか足さなかった（合計は $2Q$）"},{"t":"$60\\,\\mathrm{V}$","v":60,"why":"並列の合成をせず、$C_2 = 3\\,\\mu\\mathrm{F}$ だけで割った"},{"t":"$40\\,\\mathrm{V}$","v":40,"why":""},{"t":"$90\\,\\mathrm{V}$","v":90,"why":"つなぎ替えても電圧は変わらないとした"}],"ans":2}},{"ex":{"text":"同じ静電容量 $C$ のコンデンサを2つ使い、図1 では並列にして電圧 $E$ に、図2 では直列にして電圧 $3E$ につなぎました。図1 の静電エネルギーは、図2 の何倍ですか。","fig":{"kind":"u49s3ps","L":{"c1":"{C}","c2":"{C}","src":"{E}","src2":"3{E}"},"P":{}},"ch":[{"t":"$4$ 倍","v":"4","why":"電圧の違いを見ず、合成した静電容量の比で止めた"},{"t":"$\\dfrac{1}{9}$ 倍","v":"1/9","why":"合成せず、コンデンサ1つで比べた"},{"t":"$\\dfrac{4}{9}$ 倍","v":"4/9","why":""},{"t":"$\\dfrac{9}{4}$ 倍","v":"9/4","why":"比を逆にした"}],"ans":2}},{"ex":{"text":"$C_1 = 2\\,\\mu\\mathrm{F}$ は、極板の面積 $S$・極板の間の距離 $d$ で、間は真空です。$C_2$ は、面積 $3S$・距離 $2d$ で、間は真空です。図のように、2つを並列にして $100\\,\\mathrm{V}$ につなぎました。蓄えられる電荷の合計は何 µC ですか。","fig":{"kind":"u49s4pa","L":{"c1":"{C}_1","c2":"{C}_2","src":"{V}=100 V"},"P":{}},"ch":[{"t":"$400\\,\\mu\\mathrm{C}$","v":400,"why":"$C_2$ を出さず、$C_1$ と同じとした"},{"t":"$300\\,\\mu\\mathrm{C}$","v":300,"why":"$C_2$ だけの電荷（合成していない）"},{"t":"$120\\,\\mu\\mathrm{C}$","v":120,"why":"並列を直列と取り違えた（和分の積）"},{"t":"$500\\,\\mu\\mathrm{C}$","v":500,"why":""}],"ans":3}},{"ex":{"text":"静電容量 $C = 4\\,\\mathrm{F}$ のコンデンサを $10\\,\\mathrm{V}$ で充電し、電源から切り離してから、極板間の距離を半分にしました。静電エネルギーは何 J ですか。","fig":{"kind":"u49s5pe","L":{"c":"{C}=4 F","d":"{d}","top":"","bot":""},"P":{}},"ch":[{"t":"$200\\,\\mathrm{J}$","v":200,"why":"前の静電エネルギーのまま（距離を変えた後の静電容量を使っていない）"},{"t":"$100\\,\\mathrm{J}$","v":100,"why":""},{"t":"$5\\,\\mathrm{J}$","v":5,"why":"後の電圧 $5\\,\\mathrm{V}$ で止めた（静電エネルギーまで出していない）"},{"t":"$400\\,\\mathrm{J}$","v":400,"why":"電圧が変わらないとした（切り離すと変わらないのは電荷）"}],"ans":1}},{"ex":{"text":"図の回路で、$C_1 = 4\\,\\mu\\mathrm{F}$、$C_2 = 1\\,\\mu\\mathrm{F}$、$C_3 = 3\\,\\mu\\mathrm{F}$、$V = 100\\,\\mathrm{V}$ です。$C_3$ に蓄えられる電荷は何 μC ですか。","fig":{"kind":"u49s6sq","L":{"c1":"{C}_1=4 μF","c2":"{C}_2=1 μF","c3":"{C}_3=3 μF","src":"{V}=100 V"},"P":{}},"ch":[{"t":"$200\\,\\mu\\mathrm{C}$","v":200,"why":"全体の電荷で止めた（並列で2つに分かれる）"},{"t":"$50\\,\\mu\\mathrm{C}$","v":50,"why":"並列の電圧 $50\\,\\mathrm{V}$ で止めた（電荷まで出していない）"},{"t":"$150\\,\\mu\\mathrm{C}$","v":150,"why":""},{"t":"$300\\,\\mu\\mathrm{C}$","v":300,"why":"$C_3$ に電源の電圧が全部かかるとした（直列の $C_1$ にも電圧が分かれる）"}],"ans":2}},{"ex":{"text":"同じ静電容量 $C$ のコンデンサが2つあります。図1は2つを直列にして電圧 $V_1$ を、図2は2つを並列にして電圧 $V_2$ を加えました。2つの静電エネルギーが等しい時、$V_1$ は $V_2$ の何倍ですか。","fig":{"kind":"u49s7tq","L":{"c1":"{C}","c2":"{C}","src":"{V}_1","src2":"{V}_2"},"P":{}},"ch":[{"t":"$4$ 倍","v":4,"why":"√をとっていない（電圧の2乗の比で止めた）"},{"t":"$1$ 倍","v":1,"why":"合成せずに比べた（直列と並列で静電容量が違う）"},{"t":"$2$ 倍","v":2,"why":""},{"t":"$\\dfrac{1}{2}$ 倍","v":0.5,"why":"直列と並列の合成を取り違えた（比が逆）"}],"ans":2}},{"ex":{"text":"一直線上で、点 P の左 $3\\,\\mathrm{m}$ の点 A に $+9\\,\\mathrm{C}$、右 $1\\,\\mathrm{m}$ の点 B に電荷 $q_b$ を置きました。P に置いた正の電荷に働く力が 0 になる時、$q_b$ は何 C ですか。","fig":{"kind":"u49s8l31","L":{"na":"A","n0":"P","nb":"B","q0":"{q}","q0s":"+","qas":"+","qbs":"","qa":"{q}_a=+9 C","qb":"{q}_b","ra":"3 m","rb":"1 m"},"P":{}},"ch":[{"t":"$3\\,\\mathrm{C}$","v":3,"why":"距離の比をそのまま使った（力は距離の2乗に反比例）"},{"t":"$9\\,\\mathrm{C}$","v":9,"why":"力を出さずに、A と同じ電荷とした（距離が違う）"},{"t":"$1\\,\\mathrm{C}$","v":1,"why":""},{"t":"$81\\,\\mathrm{C}$","v":81,"why":"距離の比を逆にした（近い方が力は大きい）"}],"ans":2}}],"past":[]}};
});
