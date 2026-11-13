/* 単元30「コイルとコンデンサ（リアクタンス）」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(30, function(H){
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
// ---- 30-1 誘導性リアクタンス の図（※ textbook/gen/make_section.py が textbook/gen/data/u30_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U30S1K = {
  lc: {"vars":[],"items":[{"t":"w","id":"u30s1lcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s1lcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s1lcw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s1lcw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"ind","k":"l","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,390.5,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","l","P","N",0,[]]]}
};
function tbU30s1lc(d, p, L){ tbFig_Draw(d, p, L, U30S1K.lc); }
// ---- 30-2 容量性リアクタンス の図（※ textbook/gen/make_section.py が textbook/gen/data/u30_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U30S2K = {
  cc: {"vars":[],"items":[{"t":"w","id":"u30s2ccL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s2ccRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s2ccw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s2ccw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,396.5,null],"fh":1,"f":"cap","F":28.4},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,313.4,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]}
};
function tbU30s2cc(d, p, L){ tbFig_Draw(d, p, L, U30S2K.cc); }
// ---- 30-3 周波数との関係 の図（※ textbook/gen/make_section.py が textbook/gen/data/u30_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U30S3K = {
  xg: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[80,140],[940,140],[940,700],[80,700]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"xg","t":"F","id":"xg","sfx":"","X0":200,"W":560,"Y0":620,"H":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  lc: {"vars":[],"items":[{"t":"w","id":"u30s3lcL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s3lcRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s3lcw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s3lcw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null],"f":"ac"},{"t":"ind","k":"l","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,330.34,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","l","P","N",0,[]]]},
  cc: {"vars":[],"items":[{"t":"w","id":"u30s3ccL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s3ccRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s3ccw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s3ccw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,598.04,null],"f":"ac"},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,324.34,null],"fh":1,"f":"cap","F":27},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,314.24,null],"vis":[],"ax":"h","iside":"up","io":1}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]}
};
function tbU30s3xg(d, p, L){ tbFig_Draw(d, p, L, U30S3K.xg); }
function tbU30s3lc(d, p, L){ tbFig_Draw(d, p, L, U30S3K.lc); }
function tbU30s3cc(d, p, L){ tbFig_Draw(d, p, L, U30S3K.cc); }
// ---- 30-4 抵抗は同相 の図（※ textbook/gen/make_section.py が textbook/gen/data/u30_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U30S4K = {
  cw: {"vars":[],"items":[{"t":"w","id":"u30s4cwL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s4cwRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s4cww1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s4cww2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,410.73,null]},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","r","L0:P","L0:N",1,[]]]},
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  cwp: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u30s4cwpL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u30s4cwpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u30s4cwpw1","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u30s4cwpw2","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,410.73,null]},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[1],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[1],"df":{}},{"f":"ln","id":"frmx1","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":300,"Oy":430,"S":400,"vis":[2],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:L0:P","L0:L0:N",1,[1]],["R","r","L0:L0:P","L0:L0:N",1,[1]]]}
};
function tbU30s4cw(d, p, L){ tbFig_Draw(d, p, L, U30S4K.cw); }
function tbU30s4pv(d, p, L){ tbFig_Draw(d, p, L, U30S4K.pv); }
function tbU30s4cwp(d, p, L){ tbFig_Draw(d, p, L, U30S4K.cwp); }
// ---- 30-5 コイルは 90° 遅れ の図（※ textbook/gen/make_section.py が textbook/gen/data/u30_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U30S5K = {
  lw: {"vars":[],"items":[{"t":"w","id":"u30s5lwL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s5lwRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s5lww1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s5lww2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"ind","k":"l","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,410.73,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","l","L0:P","L0:N",0,[]]]},
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  lwp: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u30s5lwpL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u30s5lwpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u30s5lwpw1","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u30s5lwpw2","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"ind","k":"l","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,410.73,null],"f":"ind","cd":1},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[1],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[1],"df":{}},{"f":"ln","id":"frmx1","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":300,"Oy":430,"S":400,"vis":[2],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:L0:P","L0:L0:N",1,[1]],["R","l","L0:L0:P","L0:L0:N",0,[1]]]}
};
function tbU30s5lw(d, p, L){ tbFig_Draw(d, p, L, U30S5K.lw); }
function tbU30s5pv(d, p, L){ tbFig_Draw(d, p, L, U30S5K.pv); }
function tbU30s5lwp(d, p, L){ tbFig_Draw(d, p, L, U30S5K.lwp); }
// ---- 30-6 コンデンサは 90° 進み の図（※ textbook/gen/make_section.py が textbook/gen/data/u30_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U30S6K = {
  cw: {"vars":[],"items":[{"t":"w","id":"u30s6cwL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s6cwRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s6cww1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s6cww2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,416.73,null],"fh":1,"f":"cap","F":63.3},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","c","L0:P","L0:N",1,[]]]},
  pv: {"vars":[],"items":[{"f":"ln","id":"frm","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"phasor","t":"F","id":"ph","sfx":"","Ox":300,"Oy":430,"S":400,"vis":[],"df":{}}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  bw: {"vars":[],"items":[{"t":"w","id":"u30s6bwL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u30s6bwRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u30s6bww1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u30s6bww2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"r","k":"bx","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,410.73,null]},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:P","L0:N",1,[]],["R","bx","L0:P","L0:N",1,[]]]},
  cwp: {"vars":[["a","t",0],["a","t",1]],"items":[{"t":"w","id":"u30s6cwpL","pts":[[478,360],[478,560],[752,560]],"vis":[1],"dash":0},{"t":"w","id":"u30s6cwpRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[1],"dash":0},{"t":"w","id":"u30s6cwpw1","pts":[[478,360],[731.5,360]],"vis":[1],"dash":0},{"t":"w","id":"u30s6cwpw2","pts":[[791.5,360],[1045,360]],"vis":[1],"dash":0},{"t":"ac","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[1],"side":1,"loop":1,"lab":[762,604.79,null],"f":"ac"},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[1],"lab":[761.5,416.73,null],"fh":1,"f":"cap","F":63.3},{"t":"i","k":"i","x0":684,"y0":343,"x1":724,"y1":343,"lab":[704,293.17,null],"vis":[1],"ax":"h","iside":"up","io":1},{"f":"ln","id":"frmx1","pts":[[217,704],[1307,704],[1307,1374],[217,1374]],"close":1,"noobs":1,"need":"__none__","vis":[1],"t":"F"},{"f":"wave","t":"F","id":"wvx1","sfx":"x1","X0":387,"W":600,"Yc":1044,"H":250,"vis":[1],"df":{}},{"f":"ln","id":"frmx1","pts":[[100,100],[900,100],[900,760],[100,760]],"close":1,"noobs":1,"need":"__none__","vis":[2],"t":"F"},{"f":"phasor","t":"F","id":"phx1","sfx":"x1","Ox":300,"Oy":430,"S":400,"vis":[2],"df":{}}],"flows":[],"base":110,"von":["src"],"bands":"never","pts":[],"net":[["E","src","L0:L0:P","L0:L0:N",1,[1]],["R","c","L0:L0:P","L0:L0:N",1,[1]]]}
};
function tbU30s6cw(d, p, L){ tbFig_Draw(d, p, L, U30S6K.cw); }
function tbU30s6pv(d, p, L){ tbFig_Draw(d, p, L, U30S6K.pv); }
function tbU30s6bw(d, p, L){ tbFig_Draw(d, p, L, U30S6K.bw); }
function tbU30s6cwp(d, p, L){ tbFig_Draw(d, p, L, U30S6K.cwp); }
var KINDS = {u30s1lc: tbU30s1lc, u30s2cc: tbU30s2cc, u30s3xg: tbU30s3xg, u30s3lc: tbU30s3lc, u30s3cc: tbU30s3cc, u30s4cw: tbU30s4cw, u30s4pv: tbU30s4pv, u30s4cwp: tbU30s4cwp, u30s5lw: tbU30s5lw, u30s5pv: tbU30s5pv, u30s5lwp: tbU30s5lwp, u30s6cw: tbU30s6cw, u30s6pv: tbU30s6pv, u30s6bw: tbU30s6bw, u30s6cwp: tbU30s6cwp};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 30-1 の図は電流が流れないので載せない,
  // 30-2 の図は電流が流れないので載せない,
  // 30-3 の図は電流が流れないので載せない,
  // 30-4 の図は電流が流れないので載せない,
  // 30-5 の図は電流が流れないので載せない,
  // 30-6 の図は電流が流れないので載せない
};

// 30-1 誘導性リアクタンス の練習（※ textbook/gen/make_section.py が textbook/gen/data/u30_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU30s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU30s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU30s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU30s1_par(a, b){ return a * b / (a + b); }
function tbU30s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU30s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU30s1_Qxl(r){
  var gcd = tbU30s1_gcd, ratio = tbU30s1_ratio, par = tbU30s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var w = pick(r, [100,200,250,400,500,1000]);
    var Lm = pick(r, [10,20,40,50,100,200,500]);
    if (!(nice(w * Lm / 1000) && w * Lm / 1000 >= 1)) continue;
    var ok = (w * Lm / 1000);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s1_three(ok, [{x: (w * Lm), why: "mH を H に直していない"}, {x: (1000 / (w * Lm)), why: "逆数をとった。$X_L = \\omega L$"}, {x: (w * Lm / 500), why: "$\\omega$ にさらに 2 を掛けた"}, {x: (w * Lm / 100), why: "ミリは 1000 分の 1"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u30s1xl", text: "図のように、角速度 $\\omega = " + fmt(w) + "\\,\\mathrm{rad/s}$ の交流電源に、インダクタンス $" + fmt(Lm) + "\\,\\mathrm{mH}$ のコイルをつないだ。コイルの誘導性リアクタンスは何 Ω か。", fig: {kind: "u30s1lc", L: tbU30s1_fig({"src":"{V}","l":"{L}","i":"{I}"}, [["l", "{L}=" + fmt(Lm) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(Lm) + "\\,\\mathrm{mH} = " + fmt(Lm / 1000) + "\\,\\mathrm{H}$", "$X_L = \\omega L = " + fmt(w) + " \\times " + fmt(Lm / 1000) + " = " + qv(ok, "O") + "$"], chk: {form: "u30s1xl", p: {w: w, Lm: Lm}}};
  }
  throw new Error("u30s1xl：条件に合う数字が見つからない");
}
function tbU30s1_Qi(r){
  var gcd = tbU30s1_gcd, ratio = tbU30s1_ratio, par = tbU30s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,50,100,120,200]);
    var w = pick(r, [100,200,250,400,500,1000]);
    var Lm = pick(r, [10,20,40,50,100,200,500]);
    var X = (w * Lm / 1000);
    if (!(nice(X) && X >= 2 && X != V)) continue;
    var ok = (V / X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s1_three(ok, [{x: (X / V), why: "割る順が逆"}, {x: (V * X), why: "割るところを掛けた"}, {x: (V / (w * Lm)), why: "mH を H に直していない"}, {x: (V * 1000 / Lm), why: "$\\omega$ を掛けていない。$X_L = \\omega L$ で Ω に直す"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u30s1i", text: "図のように、電圧の実効値 $" + fmt(V) + "\\,\\mathrm{V}$、角速度 $\\omega = " + fmt(w) + "\\,\\mathrm{rad/s}$ の交流電源に、インダクタンス $" + fmt(Lm) + "\\,\\mathrm{mH}$ のコイルをつないだ。流れる電流の実効値は何 A か。", fig: {kind: "u30s1lc", L: tbU30s1_fig({"src":"{V}","l":"{L}","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["l", "{L}=" + fmt(Lm) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_L = \\omega L = " + fmt(w) + " \\times " + fmt(Lm / 1000) + " = " + qv(X, "O") + "$", "$I = \\dfrac{V}{X_L} = \\dfrac{" + fmt(V) + "}{" + fmt(X) + "} = " + qv(ok, "A") + "$"], chk: {form: "u30s1i", p: {V: V, w: w, Lm: Lm}}};
  }
  throw new Error("u30s1i：条件に合う数字が見つからない");
}
function tbU30s1_Qpi(r){
  var gcd = tbU30s1_gcd, ratio = tbU30s1_ratio, par = tbU30s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [25,50,60,100,200,250,500]);
    var Lm = pick(r, [10,20,40,50,100,200,500]);
    var K = (2 * f * Lm / 1000);
    var H = (f * Lm / 1000);
    var M = (2 * f * Lm);
    if (!(nice(H) && H >= 1)) continue;
    var _c = choices(r, [{t: "$" + fmt(K) + "\\pi\\,\\Omega$", v: "g" + fmt(K)}, {t: "$" + fmt(H) + "\\pi\\,\\Omega$", v: "h", why: "$2\\pi f L$ の 2 を掛けていない"}, {t: "$" + fmt(K) + "\\,\\Omega$", v: "n", why: "$\\pi$ を掛けていない"}, {t: "$" + fmt(M) + "\\pi\\,\\Omega$", v: "m", why: "mH を H に直していない"}]);
    return {form: "u30s1pi", text: "周波数 $" + fmt(f) + "\\,\\mathrm{Hz}$ の交流電源に、インダクタンス $" + fmt(Lm) + "\\,\\mathrm{mH}$ のコイルをつないだ。コイルの誘導性リアクタンスは何 Ω か。", fig: {kind: "u30s1lc", L: tbU30s1_fig({"src":"{V}","l":"{L}","i":"{I}"}, [["l", "{L}=" + fmt(Lm) + " mH"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_L = 2\\pi f L$", "$X_L = 2\\pi \\times " + fmt(f) + " \\times " + fmt(Lm / 1000) + " = " + fmt(K) + "\\pi\\,\\Omega$"], chk: {form: "u30s1pi", p: {f: f, Lm: Lm}}};
  }
  throw new Error("u30s1pi：条件に合う数字が見つからない");
}
function tbU30s1_Qword(r){
  var gcd = tbU30s1_gcd, ratio = tbU30s1_ratio, par = tbU30s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "誘導性リアクタンス", v: "own"}, {t: "容量性リアクタンス", v: "c", why: "容量性リアクタンスはコンデンサの流しにくさ"}, {t: "インダクタンス", v: "l", why: "インダクタンスは $L$［H］。Ω に直した物が誘導性リアクタンス"}, {t: "静電容量", v: "q", why: "静電容量はコンデンサの値［F］"}]);
    return {form: "u30s1word", text: "コイルの、交流の電流の流しにくさを何というか。", fig: {kind: "u30s1lc", L: tbU30s1_fig({"src":"{V}","l":"{L}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コイルの流しにくさ＝誘導性リアクタンス $X_L$［Ω］", "$X_L = \\omega L = 2\\pi f L$"], chk: {form: "u30s1word", p: {}}};
  }
  throw new Error("u30s1word：条件に合う数字が見つからない");
}
// 30-2 容量性リアクタンス の練習（※ textbook/gen/make_section.py が textbook/gen/data/u30_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU30s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU30s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU30s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU30s2_par(a, b){ return a * b / (a + b); }
function tbU30s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU30s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU30s2_Qxc(r){
  var gcd = tbU30s2_gcd, ratio = tbU30s2_ratio, par = tbU30s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var w = pick(r, [100,200,250,400,500,1000,2000,5000]);
    var Cu = pick(r, [1,2,4,5,10,20,25,40,50,100,200,500]);
    var X = (1000000 / (w * Cu));
    if (!(nice(X) && X >= 1 && X <= 1000)) continue;
    var ok = (X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s2_three(ok, [{x: (w * Cu / 1000000), why: "逆数をとっていない。$X_C = \\dfrac{1}{\\omega C}$"}, {x: (500000 / (w * Cu)), why: "$\\omega$ にさらに 2 を掛けた"}, {x: (100000 / (w * Cu)), why: "マイクロは $10^{-6}$"}, {x: (10000000 / (w * Cu)), why: "マイクロは $10^{-6}$"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u30s2xc", text: "図のように、角速度 $\\omega = " + fmt(w) + "\\,\\mathrm{rad/s}$ の交流電源に、静電容量 $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサをつないだ。コンデンサの容量性リアクタンスは何 Ω か。", fig: {kind: "u30s2cc", L: tbU30s2_fig({"src":"{V}","c":"{C}","i":"{I}"}, [["c", "{C}=" + fmt(Cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_C = \\dfrac{1}{\\omega C} = \\dfrac{1}{" + fmt(w) + " \\times " + fmt(Cu) + " \\times 10^{-6}}$", "$X_C = \\dfrac{1000000}{" + fmt(w * Cu) + "} = " + qv(ok, "O") + "$"], chk: {form: "u30s2xc", p: {w: w, Cu: Cu}}};
  }
  throw new Error("u30s2xc：条件に合う数字が見つからない");
}
function tbU30s2_Qi(r){
  var gcd = tbU30s2_gcd, ratio = tbU30s2_ratio, par = tbU30s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [50,100,120,200]);
    var w = pick(r, [100,200,250,400,500,1000,2000,5000]);
    var Cu = pick(r, [1,2,4,5,10,20,25,40,50,100,200,500]);
    if (!(nice(w * Cu * V / 1000000) && w * Cu * V / 1000000 >= 0.1 && w * Cu * V / 1000000 <= 50)) continue;
    var ok = (w * Cu * V / 1000000);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s2_three(ok, [{x: (V * 1000000 / (w * Cu)), why: "$\\omega C$ の逆数をとっていない（電圧を $\\omega C$ で割った）"}, {x: (w * Cu * V / 100000), why: "マイクロは $10^{-6}$"}, {x: (w * Cu / 1000000 / V), why: "電圧を掛けるところを割った"}, {x: (w * Cu * V), why: "μF を F に直していない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u30s2i", text: "図のように、電圧の実効値 $" + fmt(V) + "\\,\\mathrm{V}$、角速度 $\\omega = " + fmt(w) + "\\,\\mathrm{rad/s}$ の交流電源に、静電容量 $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサをつないだ。流れる電流の実効値は何 A か。", fig: {kind: "u30s2cc", L: tbU30s2_fig({"src":"{V}","c":"{C}","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["c", "{C}=" + fmt(Cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I = \\dfrac{V}{X_C} = \\omega C V$", "$I = " + fmt(w) + " \\times " + fmt(Cu) + " \\times 10^{-6} \\times " + fmt(V) + " = " + qv(ok, "A") + "$"], chk: {form: "u30s2i", p: {V: V, w: w, Cu: Cu}}};
  }
  throw new Error("u30s2i：条件に合う数字が見つからない");
}
function tbU30s2_Qpi(r){
  var gcd = tbU30s2_gcd, ratio = tbU30s2_ratio, par = tbU30s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var f = pick(r, [25,50,100,125,250,500]);
    var Cu = pick(r, [1,2,4,5,10,20,25,40,50,100,200,500]);
    var G = (500000 / (f * Cu));
    var G2 = (1000000 / (f * Cu));
    var B = (2 * f * Cu);
    if (!(Math.abs(G - Math.round(G)) < 1e-9 && G >= 2)) continue;
    var _c = choices(r, [{t: "$\\dfrac{" + fmt(G) + "}{\\pi}\\,\\Omega$", v: "g" + fmt(G)}, {t: "$" + fmt(G) + "\\pi\\,\\Omega$", v: "p", why: "$\\pi$ は分母に入る"}, {t: "$\\dfrac{" + fmt(G2) + "}{\\pi}\\,\\Omega$", v: "two", why: "$2\\pi f C$ の 2 を掛けていない"}, {t: "$\\dfrac{1}{" + fmt(B) + "\\pi}\\,\\Omega$", v: "mu", why: "μF を F に直していない"}]);
    return {form: "u30s2pi", text: "周波数 $" + fmt(f) + "\\,\\mathrm{Hz}$ の交流電源に、静電容量 $" + fmt(Cu) + "\\,\\mu\\mathrm{F}$ のコンデンサをつないだ。コンデンサの容量性リアクタンスは何 Ω か。", fig: {kind: "u30s2cc", L: tbU30s2_fig({"src":"{V}","c":"{C}","i":"{I}"}, [["c", "{C}=" + fmt(Cu) + " μF"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_C = \\dfrac{1}{2\\pi f C} = \\dfrac{1}{2\\pi \\times " + fmt(f) + " \\times " + fmt(Cu) + " \\times 10^{-6}}$", "$X_C = \\dfrac{" + fmt(G) + "}{\\pi}\\,\\Omega$"], chk: {form: "u30s2pi", p: {f: f, Cu: Cu}}};
  }
  throw new Error("u30s2pi：条件に合う数字が見つからない");
}
function tbU30s2_Qword(r){
  var gcd = tbU30s2_gcd, ratio = tbU30s2_ratio, par = tbU30s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "容量性リアクタンス", v: "own"}, {t: "誘導性リアクタンス", v: "l", why: "誘導性リアクタンスはコイルの流しにくさ"}, {t: "静電容量", v: "q", why: "静電容量は $C$［F］。Ω に直した物が容量性リアクタンス"}, {t: "インダクタンス", v: "ind", why: "インダクタンスはコイルの値［H］"}]);
    return {form: "u30s2word", text: "コンデンサの、交流の電流の流しにくさを何というか。", fig: {kind: "u30s2cc", L: tbU30s2_fig({"src":"{V}","c":"{C}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["コンデンサの流しにくさ＝容量性リアクタンス $X_C$［Ω］", "$X_C = \\dfrac{1}{\\omega C} = \\dfrac{1}{2\\pi f C}$"], chk: {form: "u30s2word", p: {}}};
  }
  throw new Error("u30s2word：条件に合う数字が見つからない");
}
// 30-3 周波数との関係 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u30_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU30s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU30s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU30s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU30s3_par(a, b){ return a * b / (a + b); }
function tbU30s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU30s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU30s3_Qxl(r){
  var gcd = tbU30s3_gcd, ratio = tbU30s3_ratio, par = tbU30s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X0 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,25,30,40,50,60,80,100]);
    var f1 = pick(r, [50,60,100]);
    var f2 = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    if (!(f1 != f2 && nice(X0 * f2 / f1))) continue;
    var ok = (X0 * f2 / f1);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s3_three(ok, [{x: (X0 * f1 / f2), why: "反比例とした（コンデンサと取り違えた）"}, {x: (X0), why: "変わらないとした（抵抗と取り違えた）"}, {x: (X0 * f2 * f2 / (f1 * f1)), why: "周波数の比の 2 乗を掛けた"}, {x: (X0 * (f2 - f1) / f1), why: "増えた分だけを答えた"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u30s3xl", text: "周波数 $" + fmt(f1) + "\\,\\mathrm{Hz}$ の交流電源につないだコイルの誘導性リアクタンスは $" + fmt(X0) + "\\,\\Omega$ であった。電源の周波数を $" + fmt(f2) + "\\,\\mathrm{Hz}$ にすると、誘導性リアクタンスは何 Ω になるか。", fig: {kind: "u30s3lc", L: tbU30s3_fig({"src":"{V}","l":"{X}_L","i":"{I}"}, [["l", "{X}_L"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["誘導性リアクタンスは周波数に比例する", "$X_L = " + fmt(X0) + " \\times \\dfrac{" + fmt(f2) + "}{" + fmt(f1) + "} = " + qv(ok, "O") + "$"], chk: {form: "u30s3xl", p: {X0: X0, f1: f1, f2: f2}}};
  }
  throw new Error("u30s3xl：条件に合う数字が見つからない");
}
function tbU30s3_Qxc(r){
  var gcd = tbU30s3_gcd, ratio = tbU30s3_ratio, par = tbU30s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var X0 = pick(r, [2,3,4,5,6,8,10,12,15,20,24,25,30,40,50,60,80,100]);
    var f1 = pick(r, [50,60,100]);
    var f2 = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    if (!(f1 != f2 && nice(X0 * f1 / f2))) continue;
    var ok = (X0 * f1 / f2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s3_three(ok, [{x: (X0 * f2 / f1), why: "比例とした（コイルと取り違えた）"}, {x: (X0), why: "変わらないとした（抵抗と取り違えた）"}, {x: (X0 * f1 * f1 / (f2 * f2)), why: "周波数の比の 2 乗で割った"}, {x: (X0 * f2 * f2 / (f1 * f1)), why: "2 乗で比例するとした"}]);
    if (!_w) continue;
    var _c = num(r, null, "O", ok, _w);
    return {form: "u30s3xc", text: "周波数 $" + fmt(f1) + "\\,\\mathrm{Hz}$ の交流電源につないだコンデンサの容量性リアクタンスは $" + fmt(X0) + "\\,\\Omega$ であった。電源の周波数を $" + fmt(f2) + "\\,\\mathrm{Hz}$ にすると、容量性リアクタンスは何 Ω になるか。", fig: {kind: "u30s3cc", L: tbU30s3_fig({"src":"{V}","l":"{X}_L","i":"{I}"}, [["src", "{V}"], ["c", "{X}_C"], ["i", "{I}"], ["l", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["容量性リアクタンスは周波数に反比例する", "$X_C = " + fmt(X0) + " \\times \\dfrac{" + fmt(f1) + "}{" + fmt(f2) + "} = " + qv(ok, "O") + "$"], chk: {form: "u30s3xc", p: {X0: X0, f1: f1, f2: f2}}};
  }
  throw new Error("u30s3xc：条件に合う数字が見つからない");
}
function tbU30s3_Qcur(r){
  var gcd = tbU30s3_gcd, ratio = tbU30s3_ratio, par = tbU30s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I0 = pick(r, [1,2,3,4,5,6,8,10,12]);
    var f1 = pick(r, [50,60,100]);
    var f2 = pick(r, [25,50,60,100,120,150,200,250,300,400,500]);
    if (!(f1 != f2 && nice(I0 * f1 / f2) && I0 * f1 / f2 >= 0.1)) continue;
    var ok = (I0 * f1 / f2);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s3_three(ok, [{x: (I0 * f2 / f1), why: "電流もリアクタンスと同じく比例するとした。電流は $X_L$ で割るので反比例"}, {x: (I0), why: "変わらないとした"}, {x: (I0 * f1 * f1 / (f2 * f2)), why: "周波数の比の 2 乗で割った"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u30s3cur", text: "電圧の大きさの変わらない交流電源にコイルをつなぐと、周波数 $" + fmt(f1) + "\\,\\mathrm{Hz}$ の時に $" + fmt(I0) + "\\,\\mathrm{A}$ の電流が流れた。電圧の大きさはそのままで、周波数を $" + fmt(f2) + "\\,\\mathrm{Hz}$ にすると、電流は何 A になるか。", fig: {kind: "u30s3lc", L: tbU30s3_fig({"src":"{V}","l":"{X}_L","i":"{I}"}, [["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_L$ は周波数に比例し、$I = \\dfrac{V}{X_L}$ なので電流は反比例", "$I = " + fmt(I0) + " \\times \\dfrac{" + fmt(f1) + "}{" + fmt(f2) + "} = " + qv(ok, "A") + "$"], chk: {form: "u30s3cur", p: {I0: I0, f1: f1, f2: f2}}};
  }
  throw new Error("u30s3cur：条件に合う数字が見つからない");
}
function tbU30s3_Qword(r){
  var gcd = tbU30s3_gcd, ratio = tbU30s3_ratio, par = tbU30s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4]);
    var _c = choices(r, [{t: "$R$：1 倍、$X_L$：" + fmt(k) + " 倍、$X_C$：$\\dfrac{1}{" + fmt(k) + "}$ 倍", v: "R1L" + fmt(k) + "C-" + fmt(k)}, {t: "$R$：1 倍、$X_L$：$\\dfrac{1}{" + fmt(k) + "}$ 倍、$X_C$：" + fmt(k) + " 倍", v: "R1L-" + fmt(k) + "C" + fmt(k), why: "コイルとコンデンサを取り違えた。$X_L = 2\\pi f L$ は比例"}, {t: "$R$：" + fmt(k) + " 倍、$X_L$：" + fmt(k) + " 倍、$X_C$：$\\dfrac{1}{" + fmt(k) + "}$ 倍", v: "R" + fmt(k) + "L" + fmt(k) + "C-" + fmt(k), why: "抵抗は周波数で変わらない"}, {t: "$R$：1 倍、$X_L$：" + fmt(k) + " 倍、$X_C$：" + fmt(k) + " 倍", v: "R1L" + fmt(k) + "C" + fmt(k), why: "$X_C = \\dfrac{1}{2\\pi f C}$ は $f$ が分母なので反比例"}]);
    return {form: "u30s3word", text: "交流電源の周波数を " + fmt(k) + " 倍にした。抵抗 $R$、誘導性リアクタンス $X_L$、容量性リアクタンス $X_C$ は、それぞれ何倍になるか。", fig: {kind: "u30s3xg", L: tbU30s3_fig({"src":"{V}","l":"{X}_L","i":"{I}"}, [["ax", "{f}"], ["ay", "{X}"], ["c1", "{X}_L"], ["c1s", "lin"], ["c1a", 0.35], ["c2", "{X}_C"], ["c2s", "inv"], ["c2a", 0.6], ["c3", "{R}"], ["c3s", "flat"], ["c3a", 0.45]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$X_L = 2\\pi f L$ は比例、$X_C = \\dfrac{1}{2\\pi f C}$ は反比例、$R$ は変わらない", "$R$：1 倍、$X_L$：" + fmt(k) + " 倍、$X_C$：$\\dfrac{1}{" + fmt(k) + "}$ 倍"], chk: {form: "u30s3word", p: {k: k}}};
  }
  throw new Error("u30s3word：条件に合う数字が見つからない");
}
// 30-4 抵抗は同相 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u30_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU30s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU30s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU30s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU30s4_par(a, b){ return a * b / (a + b); }
function tbU30s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU30s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU30s4_Qieff(r){
  var gcd = tbU30s4_gcd, ratio = tbU30s4_ratio, par = tbU30s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,30,40,50,60,80,100,120,200]);
    var R = pick(r, [2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,35,36,40,45,48,50,60,70,75,80,90,100]);
    if (!(V > R && nice(V / R))) continue;
    var ok = (V / R);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s4_three(ok, [{x: (R / V), why: "割る順が逆"}, {x: (V * R), why: "割るところを掛けた"}, {x: (V / R / 2), why: "実効値は最大値を $\\sqrt{2}$ で割る。2 では割らない"}, {x: (2 * V / R), why: "$\\sqrt{2}$ を 2 として最大値にした"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u30s4ieff", text: "図のように、$v = " + fmt(V) + "\\sqrt{2} \\sin \\omega t$［V］の電圧を $" + fmt(R) + "\\,\\Omega$ の抵抗に加えた。流れる電流の実効値は何 A か。", fig: {kind: "u30s4cw", L: tbU30s4_fig({"src":"{v}","r":"{R}","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5}, [["src", "{v}=" + fmt(V) + "\\sqrt{2}\\sin{ω}{t}"], ["r", qf(R, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電圧の実効値は $\\dfrac{" + fmt(V) + "\\sqrt{2}}{\\sqrt{2}} = " + fmt(V) + "\\,\\mathrm{V}$", "$I = \\dfrac{V}{R} = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "} = " + qv(ok, "A") + "$"], chk: {form: "u30s4ieff", p: {V: V, R: R}}};
  }
  throw new Error("u30s4ieff：条件に合う数字が見つからない");
}
function tbU30s4_Qvec(r){
  var gcd = tbU30s4_gcd, ratio = tbU30s4_ratio, par = tbU30s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,50,100,120,200]);
    var R = pick(r, [2,4,5,8,10,20,25,40,50]);
    var m = (V / R);
    var VR = (V * R);
    if (!(nice(m) && m != VR && m != 1)) continue;
    var _c = choices(r, [{t: "$\\dot{I} = " + fmt(m) + "$", v: fmt(m) + ",0"}, {t: "$\\dot{I} = j" + fmt(m) + "$", v: "0," + fmt(m), why: "抵抗で割るだけなので j は付かない（右向き）"}, {t: "$\\dot{I} = -j" + fmt(m) + "$", v: "0,-" + fmt(m), why: "抵抗で割るだけなので j は付かない（右向き）"}, {t: "$\\dot{I} = " + fmt(VR) + "$", v: fmt(VR) + ",0", why: "割るところを掛けた"}]);
    return {form: "u30s4vec", text: "$" + fmt(R) + "\\,\\Omega$ の抵抗に、交流の電圧 $\\dot{V} = " + fmt(V) + "\\,\\mathrm{V}$（基準）を加えた。電流のベクトル $\\dot{I}$［A］はどれか。", fig: {kind: "u30s4pv", L: tbU30s4_fig({"src":"{v}","r":"{R}","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5}, [["ref", true], ["a1", "{V}"], ["a1dot", true], ["a1l", 1], ["a1g", 0], ["a2", "{I}"], ["a2dot", true], ["a2l", 0.5], ["a2g", 0], ["a2y", -0.04]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{I} = \\dfrac{\\dot{V}}{R} = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "}$。j が無いので右向き（同相）", "$\\dot{I} = " + fmt(m) + "\\,\\mathrm{A}$"], chk: {form: "u30s4vec", p: {V: V, R: R}}};
  }
  throw new Error("u30s4vec：条件に合う数字が見つからない");
}
function tbU30s4_Qsame(r){
  var gcd = tbU30s4_gcd, ratio = tbU30s4_ratio, par = tbU30s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "左右にずれない（同相）", v: "own"}, {t: "$\\dfrac{\\pi}{2}$ 右へずれる（遅れ）", v: "lag", why: "抵抗では $R$ で割るだけなので、ずれない"}, {t: "$\\dfrac{\\pi}{2}$ 左へずれる（進み）", v: "lead", why: "抵抗では $R$ で割るだけなので、ずれない"}, {t: "上下が逆になる", v: "inv", why: "$R$ で割っても符号は変わらない"}]);
    return {form: "u30s4same", text: "抵抗に正弦波交流の電圧を加えた時、電流の波形は電圧の波形に比べてどうなるか。", fig: {kind: "u30s4cw", L: tbU30s4_fig({"src":"{v}","r":"{R}","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5}, [["src", "{v}"], ["r", "{R}"], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$i = \\sqrt{2} \\dfrac{V}{R} \\sin \\omega t$ で、電圧と同じ時に上がり下がる", "左右にずれない（同相）"], chk: {form: "u30s4same", p: {}}};
  }
  throw new Error("u30s4same：条件に合う数字が見つからない");
}
function tbU30s4_Qeff(r){
  var gcd = tbU30s4_gcd, ratio = tbU30s4_ratio, par = tbU30s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "実効値", v: "own"}, {t: "最大値", v: "max", why: "最大値は $V_m$ と書く。ふつうは実効値"}, {t: "瞬時値", v: "inst", why: "瞬時値は小文字の $v$・$i$"}, {t: "平均値", v: "avg", why: "ふつうは実効値"}]);
    return {form: "u30s4eff", text: "交流回路で、ふつう電圧 $V$・電流 $I$ と書いた時の値は何か。", fig: {kind: "u30s4cw", L: tbU30s4_fig({"src":"{v}","r":"{R}","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5}, [["src", "{v}"], ["r", "{R}"], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電圧・電流は、ふつう実効値で表す", "$V$・$I$ は実効値"], chk: {form: "u30s4eff", p: {}}};
  }
  throw new Error("u30s4eff：条件に合う数字が見つからない");
}
// 30-5 コイルは 90° 遅れ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u30_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU30s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU30s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU30s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU30s5_par(a, b){ return a * b / (a + b); }
function tbU30s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU30s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU30s5_Qvec(r){
  var gcd = tbU30s5_gcd, ratio = tbU30s5_ratio, par = tbU30s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,50,100,120,200]);
    var X = pick(r, [2,4,5,8,10,20,25,40,50]);
    var m = (V / X);
    var VX = (V * X);
    if (!(nice(m) && m != 1 && m != VX)) continue;
    var _c = choices(r, [{t: "$\\dot{I} = -j" + fmt(m) + "$", v: "0,-" + fmt(m)}, {t: "$\\dot{I} = j" + fmt(m) + "$", v: "0," + fmt(m), why: "分母と分子に j を掛けると $-j$ になる（下向き）"}, {t: "$\\dot{I} = " + fmt(m) + "$", v: fmt(m) + ",0", why: "j を付けないと同相になってしまう。コイルは $jX_L$"}, {t: "$\\dot{I} = -j" + fmt(VX) + "$", v: "0,-" + fmt(VX), why: "割るところを掛けた"}]);
    return {form: "u30s5vec", text: "誘導性リアクタンス $X_L = " + fmt(X) + "\\,\\Omega$ のコイルに、交流の電圧 $\\dot{V} = " + fmt(V) + "\\,\\mathrm{V}$（基準）を加えた。電流のベクトル $\\dot{I}$［A］はどれか。", fig: {kind: "u30s5pv", L: tbU30s5_fig({}, [["ref", true], ["a1", "{V}"], ["a1dot", true], ["a1l", 1], ["a1g", 0], ["a2", null], ["a2dot", true], ["a2l", 0.6], ["a2g", -90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{I} = \\dfrac{\\dot{V}}{jX_L} = \\dfrac{" + fmt(V) + "}{j" + fmt(X) + "}$", "$\\dot{I} = -j" + fmt(m) + "\\,\\mathrm{A}$"], chk: {form: "u30s5vec", p: {V: V, X: X}}};
  }
  throw new Error("u30s5vec：条件に合う数字が見つからない");
}
function tbU30s5_Qisin(r){
  var gcd = tbU30s5_gcd, ratio = tbU30s5_ratio, par = tbU30s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [2,3,4,5,6,10]);
    var X = pick(r, [2,4,5,10,20,25]);
    var a = (m * X);
    var aX = (m * X * X);
    if (!(m != aX)) continue;
    var _c = choices(r, [{t: "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$", v: fmt(m) + ",-90"}, {t: "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t + \\dfrac{\\pi}{2}\\right)$", v: fmt(m) + ",90", why: "進むのはコンデンサ。コイルは遅れ"}, {t: "$i = " + fmt(m) + "\\sqrt{2} \\sin \\omega t$", v: fmt(m) + ",0", why: "コイルでは、電流は電圧より 90° 遅れる"}, {t: "$i = " + fmt(aX) + "\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$", v: fmt(aX) + ",-90", why: "割るところを掛けた"}]);
    return {form: "u30s5isin", text: "図のように、$v = " + fmt(a) + "\\sqrt{2} \\sin \\omega t$［V］の電圧を、誘導性リアクタンス $" + fmt(X) + "\\,\\Omega$ のコイルに加えた。電流 $i$［A］を表す式はどれか。", fig: {kind: "u30s5lw", L: tbU30s5_fig({}, [["src", "{v}=" + fmt(a) + "\\sqrt{2}\\sin{ω}{t}"], ["l", "{X}_L=" + qf(X, "O")], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5], ["w2p", -90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["最大値は $\\dfrac{" + fmt(a) + "\\sqrt{2}}{" + fmt(X) + "} = " + fmt(m) + "\\sqrt{2}$。コイルなので 90° 遅れ", "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$"], chk: {form: "u30s5isin", p: {m: m, X: X}}};
  }
  throw new Error("u30s5isin：条件に合う数字が見つからない");
}
function tbU30s5_Qmag(r){
  var gcd = tbU30s5_gcd, ratio = tbU30s5_ratio, par = tbU30s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,50,100,120,200]);
    var X = pick(r, [2,4,5,8,10,20,25,40,50]);
    if (!(nice(V / X) && V != X)) continue;
    var ok = (V / X);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU30s5_three(ok, [{x: (X / V), why: "割る順が逆"}, {x: (V * X), why: "割るところを掛けた"}, {x: (V), why: "誘導性リアクタンスで割っていない"}]);
    if (!_w) continue;
    var _c = num(r, null, "A", ok, _w);
    return {form: "u30s5mag", text: "誘導性リアクタンス $" + fmt(X) + "\\,\\Omega$ のコイルに、実効値 $" + fmt(V) + "\\,\\mathrm{V}$ の交流の電圧を加えた。流れる電流の大きさ（実効値）は何 A か。", fig: {kind: "u30s5lw", L: tbU30s5_fig({}, [["src", "{V}=" + qf(V, "V")], ["l", "{X}_L=" + qf(X, "O")], ["i", "{I}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5], ["w2p", -90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["大きさだけなので j は要らない", "$I = \\dfrac{V}{X_L} = \\dfrac{" + fmt(V) + "}{" + fmt(X) + "} = " + qv(ok, "A") + "$"], chk: {form: "u30s5mag", p: {V: V, X: X}}};
  }
  throw new Error("u30s5mag：条件に合う数字が見つからない");
}
function tbU30s5_Qdir(r){
  var gcd = tbU30s5_gcd, ratio = tbU30s5_ratio, par = tbU30s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "下向き（90° 遅れ）", v: "down"}, {t: "上向き（90° 進み）", v: "up", why: "上向きはコンデンサ。コイルは $-j$ で下向き"}, {t: "右向き（同相）", v: "right", why: "同相は抵抗。コイルは 90° ずれる"}, {t: "左向き", v: "left", why: "コイルは 90° のずれで、逆向きにはならない"}]);
    return {form: "u30s5dir", text: "コイルに交流の電圧を加えた。電圧のベクトルを右向き（基準）にかくと、電流のベクトルはどちら向きか。", fig: {kind: "u30s5pv", L: tbU30s5_fig({}, [["ref", true], ["a1", "{V}"], ["a1dot", true], ["a1l", 1], ["a1g", 0], ["a2", null], ["a2dot", true], ["a2l", 0.6], ["a2g", -90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{I} = \\dfrac{V}{jX_L} = -j\\dfrac{V}{X_L}$（マイナスの虚数）", "下向き（90° 遅れ）"], chk: {form: "u30s5dir", p: {}}};
  }
  throw new Error("u30s5dir：条件に合う数字が見つからない");
}
// 30-6 コンデンサは 90° 進み の練習（※ textbook/gen/make_section.py が textbook/gen/data/u30_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU30s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU30s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU30s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU30s6_par(a, b){ return a * b / (a + b); }
function tbU30s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU30s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU30s6_Qvec(r){
  var gcd = tbU30s6_gcd, ratio = tbU30s6_ratio, par = tbU30s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [10,20,50,100,120,200]);
    var X = pick(r, [2,4,5,8,10,20,25,40,50]);
    var m = (V / X);
    var VX = (V * X);
    if (!(nice(m) && m != 1 && m != VX)) continue;
    var _c = choices(r, [{t: "$\\dot{I} = j" + fmt(m) + "$", v: "0," + fmt(m)}, {t: "$\\dot{I} = -j" + fmt(m) + "$", v: "0,-" + fmt(m), why: "分母と分子に j を掛けると、$j \\times j = -1$ で $+j$ になる（上向き）"}, {t: "$\\dot{I} = " + fmt(m) + "$", v: fmt(m) + ",0", why: "j を付けないと同相になってしまう。コンデンサは $-jX_C$"}, {t: "$\\dot{I} = j" + fmt(VX) + "$", v: "0," + fmt(VX), why: "割るところを掛けた"}]);
    return {form: "u30s6vec", text: "容量性リアクタンス $X_C = " + fmt(X) + "\\,\\Omega$ のコンデンサに、交流の電圧 $\\dot{V} = " + fmt(V) + "\\,\\mathrm{V}$（基準）を加えた。電流のベクトル $\\dot{I}$［A］はどれか。", fig: {kind: "u30s6pv", L: tbU30s6_fig({}, [["ref", true], ["a1", "{V}"], ["a1dot", true], ["a1l", 1], ["a1g", 0], ["a2", null], ["a2dot", true], ["a2l", 0.6], ["a2g", 90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$\\dot{I} = \\dfrac{\\dot{V}}{-jX_C} = \\dfrac{j" + fmt(V) + "}{-j \\times j" + fmt(X) + "} = \\dfrac{j" + fmt(V) + "}{" + fmt(X) + "}$", "$\\dot{I} = j" + fmt(m) + "\\,\\mathrm{A}$"], chk: {form: "u30s6vec", p: {V: V, X: X}}};
  }
  throw new Error("u30s6vec：条件に合う数字が見つからない");
}
function tbU30s6_Qisin(r){
  var gcd = tbU30s6_gcd, ratio = tbU30s6_ratio, par = tbU30s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var m = pick(r, [2,3,4,5,6,10]);
    var X = pick(r, [2,4,5,10,20,25]);
    var a = (m * X);
    var aX = (m * X * X);
    if (!(m != aX)) continue;
    var _c = choices(r, [{t: "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t + \\dfrac{\\pi}{2}\\right)$", v: fmt(m) + ",90"}, {t: "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$", v: fmt(m) + ",-90", why: "遅れるのはコイル。コンデンサは進み"}, {t: "$i = " + fmt(m) + "\\sqrt{2} \\sin \\omega t$", v: fmt(m) + ",0", why: "コンデンサでは、電流は電圧より 90° 進む"}, {t: "$i = " + fmt(aX) + "\\sqrt{2} \\sin\\left(\\omega t + \\dfrac{\\pi}{2}\\right)$", v: fmt(aX) + ",90", why: "割るところを掛けた"}]);
    return {form: "u30s6isin", text: "図のように、$v = " + fmt(a) + "\\sqrt{2} \\sin \\omega t$［V］の電圧を、容量性リアクタンス $" + fmt(X) + "\\,\\Omega$ のコンデンサに加えた。電流 $i$［A］を表す式はどれか。", fig: {kind: "u30s6cw", L: tbU30s6_fig({}, [["src", "{v}=" + fmt(a) + "\\sqrt{2}\\sin{ω}{t}"], ["c", "{X}_C=" + qf(X, "O")], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5], ["w2p", 90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["最大値は $\\dfrac{" + fmt(a) + "\\sqrt{2}}{" + fmt(X) + "} = " + fmt(m) + "\\sqrt{2}$。コンデンサなので 90° 進み", "$i = " + fmt(m) + "\\sqrt{2} \\sin\\left(\\omega t + \\dfrac{\\pi}{2}\\right)$"], chk: {form: "u30s6isin", p: {m: m, X: X}}};
  }
  throw new Error("u30s6isin：条件に合う数字が見つからない");
}
function tbU30s6_Qwhich(r){
  var gcd = tbU30s6_gcd, ratio = tbU30s6_ratio, par = tbU30s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var Vm = pick(r, [50,100,141,200]);
    var Im = pick(r, [1,2,5,10]);
    var s = pick(r, [-1,0,1]);
    var P = (s == 0 ? '' : (s > 0 ? ' + ' : ' - '));
    var P2 = (s == 0 ? '' : '\\dfrac{\\pi}{2}');
    var Lp = (s == 0 ? '' : '\\left(');
    var Rp = (s == 0 ? '' : '\\right)');
    var _c = choices(r, [{t: String(s > 0 ? 'コンデンサ' : (s < 0 ? 'コイル' : '抵抗')), v: String(s > 0 ? 'C' : (s < 0 ? 'L' : 'R'))}, {t: String(s > 0 ? 'コイル' : (s < 0 ? 'コンデンサ' : 'コイル')), v: String(s > 0 ? 'L' : (s < 0 ? 'C' : 'L')), why: String(s == 0 ? 'コイルなら電流は 90° 遅れる' : 'コイルは遅れ、コンデンサは進み')}, {t: String(s == 0 ? 'コンデンサ' : '抵抗'), v: String(s == 0 ? 'C' : 'R'), why: String(s == 0 ? 'コンデンサなら電流は 90° 進む' : '抵抗なら同相（ずれない）')}, {t: "どれでもない", v: "N", why: "抵抗は同相・コイルは 90° 遅れ・コンデンサは 90° 進み"}]);
    return {form: "u30s6which", text: "図の四角の中には、抵抗・コイル・コンデンサのどれか1つが入っている。電圧が $v = " + fmt(Vm) + " \\sin \\omega t$［V］、電流が $i = " + fmt(Im) + " \\sin" + String(Lp) + "\\omega t" + String(P) + String(P2) + String(Rp) + "$［A］であった。四角の中の素子はどれか。", fig: {kind: "u30s6bw", L: tbU30s6_fig({}, [["src", "{v}"], ["bx", "?"], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5], ["w2p", fmt(s * 90)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流の位相のずれは " + String(s == 0 ? '0（同相）' : (s > 0 ? '90° 進み' : '90° 遅れ')), String(s > 0 ? 'コンデンサ' : (s < 0 ? 'コイル' : '抵抗'))], chk: {form: "u30s6which", p: {s: s}}};
  }
  throw new Error("u30s6which：条件に合う数字が見つからない");
}
function tbU30s6_Qval(r){
  var gcd = tbU30s6_gcd, ratio = tbU30s6_ratio, par = tbU30s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var w = pick(r, [100,200,250,500,1000]);
    var Vm = pick(r, [50,100,200,300]);
    var Im = pick(r, [1,2,4,5,10]);
    var d = pick(r, [-1,1]);
    var X = (Vm / Im);
    var Lh = (Vm / Im / w);
    var Cu = (1000000 * Im / (Vm * w));
    var Lw = (Vm / Im * w);
    var Cw = (1000000 * Vm / (Im * w));
    var E1 = (d < 0 ? 'コイル' : 'コンデンサ');
    var E2 = (d < 0 ? 'コンデンサ' : 'コイル');
    var T1 = (d < 0 ? fmt(Lh) + ' H' : fmt(Cu) + ' μF');
    var T2 = (d < 0 ? fmt(Cu) + ' μF' : fmt(Lh) + ' H');
    var T3 = (d < 0 ? fmt(Lw) + ' H' : fmt(Cw) + ' μF');
    var K1 = (d < 0 ? 'L' + fmt(Lh) : 'C' + fmt(Cu));
    var K2 = (d < 0 ? 'C' + fmt(Cu) : 'L' + fmt(Lh));
    var K3 = (d < 0 ? 'L' + fmt(Lw) : 'C' + fmt(Cw));
    var PS = (d < 0 ? '-' : '+');
    if (!(nice(Lh) && nice(Cu) && nice(Lw) && nice(Cw) && Lh >= 0.01 && Cu >= 1 && Cw <= 1000000 && Lw <= 100000)) continue;
    var _c = choices(r, [{t: String(E1) + "、" + String(T1), v: String(K1)}, {t: String(E2) + "、" + String(T2), v: String(K2), why: "電流が進むのはコンデンサ、遅れるのはコイル"}, {t: String(E1) + "、" + String(T3), v: String(K3), why: String(d < 0 ? '$X_L = \\omega L$ なので $L = \\dfrac{X_L}{\\omega}$' : '$X_C = \\dfrac{1}{\\omega C}$ なので $C = \\dfrac{1}{\\omega X_C}$')}, {t: "抵抗、" + fmt(X) + " Ω", v: "R" + fmt(X), why: "位相がずれているので抵抗ではない"}]);
    return {form: "u30s6val", text: "図の四角の中には、コイルかコンデンサのどちらかが入っている。電圧が $v = " + fmt(Vm) + " \\sin " + fmt(w) + "t$［V］、電流が $i = " + fmt(Im) + " \\sin\\left(" + fmt(w) + "t " + String(PS) + " \\dfrac{\\pi}{2}\\right)$［A］であった。素子と、その値の組はどれか。", fig: {kind: "u30s6bw", L: tbU30s6_fig({}, [["src", "{v}"], ["bx", "?"], ["i", "{i}"], ["ax", "{ω}{t}［rad］"], ["ay", "{v}・{i}"], ["w1", "{v}"], ["w2", "{i}"], ["w2a", 0.5], ["w2p", fmt(d * 90)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電流は " + String(d < 0 ? '90° 遅れ＝コイル' : '90° 進み＝コンデンサ') + "。リアクタンスは $\\dfrac{" + fmt(Vm) + "}{" + fmt(Im) + "} = " + fmt(X) + "\\,\\Omega$、$\\omega = " + fmt(w) + "$", String(d < 0 ? '$L = \\dfrac{X_L}{\\omega}$' : '$C = \\dfrac{1}{\\omega X_C}$') + "　" + String(E1) + "、" + String(T1)], chk: {form: "u30s6val", p: {w: w, Vm: Vm, Im: Im, d: d}}};
  }
  throw new Error("u30s6val：条件に合う数字が見つからない");
}
function tbU30s6_Qjj(r){
  var gcd = tbU30s6_gcd, ratio = tbU30s6_ratio, par = tbU30s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$-1$", v: "-1"}, {t: "$1$", v: "1", why: "$j \\times j = -1$。マイナスになる"}, {t: "$j$", v: "j", why: "j × j は j の付かない数になる"}, {t: "$0$", v: "0", why: "0 にはならない"}]);
    return {form: "u30s6jj", text: "$j \\times j$ はいくらか。", fig: {kind: "u30s6pv", L: tbU30s6_fig({}, [["ref", true], ["a1", "{V}"], ["a1dot", true], ["a1l", 1], ["a1g", 0], ["a2", "{I}"], ["a2dot", true], ["a2l", 0.6], ["a2g", 90]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["j は虚数を表す", "$j \\times j = -1$"], chk: {form: "u30s6jj", p: {}}};
  }
  throw new Error("u30s6jj：条件に合う数字が見つからない");
}
var GEN = {
  // 30-1 誘導性リアクタンス
  1: function(r){ return pick(r, [tbU30s1_Qxl, tbU30s1_Qxl, tbU30s1_Qxl, tbU30s1_Qi, tbU30s1_Qi, tbU30s1_Qi, tbU30s1_Qpi, tbU30s1_Qpi, tbU30s1_Qword])(r); },
  // 30-2 容量性リアクタンス
  2: function(r){ return pick(r, [tbU30s2_Qxc, tbU30s2_Qxc, tbU30s2_Qxc, tbU30s2_Qi, tbU30s2_Qi, tbU30s2_Qi, tbU30s2_Qpi, tbU30s2_Qpi, tbU30s2_Qword])(r); },
  // 30-3 周波数との関係
  3: function(r){ return pick(r, [tbU30s3_Qxl, tbU30s3_Qxl, tbU30s3_Qxl, tbU30s3_Qxc, tbU30s3_Qxc, tbU30s3_Qxc, tbU30s3_Qcur, tbU30s3_Qcur, tbU30s3_Qword, tbU30s3_Qword])(r); },
  // 30-4 抵抗は同相
  4: function(r){ return pick(r, [tbU30s4_Qieff, tbU30s4_Qieff, tbU30s4_Qieff, tbU30s4_Qvec, tbU30s4_Qvec, tbU30s4_Qvec, tbU30s4_Qsame, tbU30s4_Qeff])(r); },
  // 30-5 コイルは 90° 遅れ
  5: function(r){ return pick(r, [tbU30s5_Qvec, tbU30s5_Qvec, tbU30s5_Qvec, tbU30s5_Qisin, tbU30s5_Qisin, tbU30s5_Qisin, tbU30s5_Qmag, tbU30s5_Qmag, tbU30s5_Qdir])(r); },
  // 30-6 コンデンサは 90° 進み
  6: function(r){ return pick(r, [tbU30s6_Qvec, tbU30s6_Qvec, tbU30s6_Qvec, tbU30s6_Qisin, tbU30s6_Qisin, tbU30s6_Qwhich, tbU30s6_Qwhich, tbU30s6_Qval, tbU30s6_Qval, tbU30s6_Qval, tbU30s6_Qjj])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t30s1e","scene":"t30s1e","kind":"u30s1lc","lab":{"src":"{V}","l":["{L}","{X}_L"],"i":"{I}"},"viewbox":"464 284 595 350","band":{"want":"コイルの電流の流しにくさと、電流の大きさ","ans":"$X_L = \\omega L = 2\\pi f L$、$I = \\dfrac{V}{X_L}$","full":"コイルの電流の流しにくさを誘導性リアクタンス X_L［Ω］という。X_L = ωL = 2πfL。電流は I = V/X_L。V・I は実効値。"},"narr":{"start":{"co":1,"lv":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①流しにくさ\n②$\\Omega$ に直す\n③電流\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"交流電源にコイルをつなぎます。交流になっても、〖オームの法則はそのまま使えます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","L"]},{"text":"電圧と電流は、ふつう実効値で表します。ここの $V$ と $I$ も実効値です。","at":{"強調":1.0},"after":[],"emph":["src","I"]},{"text":"コイルには、電流の流しにくさがあります。これを〖誘導性リアクタンス〗といい、$X_L$ と書きます。単位は $\\Omega$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"x","emph":["L"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"インダクタンス $L$［H］が書いてある時は、そのまま割ってはいけません。〖$\\Omega$ に直します〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["L"]},{"text":"","at":{"強調":0.0,"式":0.0},"after":["強調"],"emph":["L"],"eq":[{"cont":false,"items":[["X_L = \\omega L"],["= 2\\pi f L"]]}],"emphPre":["L"]},{"text":"$f$ は電源の周波数です。ミリの付いた値は、〖H に直してから〗入れます。","at":{"強調":1.0},"after":[],"emph":["src","L"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"電流は、〖電圧を誘導性リアクタンスで割ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["I","src","L"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{X_L}"],["= \\dfrac{V}{2\\pi f L}"]]}],"ans":true,"emphPre":["src","L","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s1lcL","u30s1lcw1"],"zlo":["u30s1lcRw","u30s1lcw2"]},"moves":{"x":{"to":{"lv":1},"dur":0.5}},"route":["流しにくさ","$\\Omega$ に直す","電流"]}},{"id":"t30s1x","scene":"t30s1x","kind":"u30s1lc","lab":{"src":"{V}=100 V","l":["{L}=50 mH","{X}_L=10 Ω"],"i":["{I}","{I}=10 A"]},"viewbox":"464 284 595 350","band":{"want":"電流 $I$","known":"$V = 100\\,\\mathrm{V},\\;\\; \\omega = 200\\,\\mathrm{rad/s},\\;\\; L = 50\\,\\mathrm{mH}$","ans":"$I = 10\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"lv":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、コイルに流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①$\\Omega$ に直す\n②電流\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"電流を出すには、コイルの流しにくさが $\\Omega$ で要ります。〖先に誘導性リアクタンスを出します〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["L"]},{"text":"$50\\,\\mathrm{mH}$ は〖$0.05\\,\\mathrm{H}$〗です。","at":{"式":1.0,"強調":1.0},"after":["強調"],"eq":[{"cont":false,"items":[["50\\,\\mathrm{mH} = 0.05\\,\\mathrm{H}"]]}],"emph":["L"]},{"text":"","at":{"強調":0.0,"式":0.0,"動き":0.0},"after":["動き","強調"],"emph":["L"],"eq":[{"cont":false,"items":[["X_L = \\omega L"],["= 200 \\times 0.05 = 10\\,\\Omega"]]}],"move":"x","emphPre":["L"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"電圧を誘導性リアクタンスで割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","src","L"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{X_L}"],["= \\dfrac{100}{10} = 10\\,\\mathrm{A}"]]}],"move":"i","ans":true,"emphPre":["src","L","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s1lcL","u30s1lcw1"],"zlo":["u30s1lcRw","u30s1lcw2"]},"moves":{"x":{"to":{"lv":1},"dur":0.5},"i":{"to":{"iv":1},"dur":0.5}},"route":["$\\Omega$ に直す","電流"]}},{"id":"t30s2e","scene":"t30s2e","kind":"u30s2cc","lab":{"src":"{V}","c":["{C}","{X}_C"],"i":"{I}"},"viewbox":"464 284 595 350","band":{"want":"コンデンサの電流の流しにくさと、電流の大きさ","ans":"$X_C = \\dfrac{1}{\\omega C} = \\dfrac{1}{2\\pi f C}$、$I = \\omega C V$","full":"コンデンサの電流の流しにくさを容量性リアクタンス X_C［Ω］という。X_C = 1/(ωC) = 1/(2πfC)。電流は I = V/X_C = ωCV = 2πfCV。"},"narr":{"start":{"co":1,"cv":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①流しにくさ\n②$\\Omega$ に直す\n③電流\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"交流電源にコンデンサをつなぎます。コンデンサにも、〖電流の流しにくさ〗があります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","C"]},{"text":"これを〖容量性リアクタンス〗といい、$X_C$ と書きます。単位は $\\Omega$ です。コイルは誘導性、コンデンサは容量性です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"x","emph":["C"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"静電容量 $C$［F］が書いてある時は、$\\Omega$ に直します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["C"]},{"text":"コイルと違い、〖$\\omega C$ の逆数〗になります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["C"],"eq":[{"cont":false,"items":[["X_C = \\dfrac{1}{\\omega C}"],["= \\dfrac{1}{2\\pi f C}"]]}],"emphPre":["C"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"電流は、電圧を容量性リアクタンスで割ります。逆数で割るので、〖掛け算になります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["I","src","C"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{X_C}"],["= \\omega C V = 2\\pi f C V"]]}],"emphPre":["src","C","I"]},{"text":"数はすぐに入れず、〖求めたい物の式を文字のまま作ってから〗入れると、計算が楽になります。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["I","src","C"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s2ccL","u30s2ccw1"],"zlo":["u30s2ccRw","u30s2ccw2"]},"moves":{"x":{"to":{"cv":1},"dur":0.5}},"route":["流しにくさ","$\\Omega$ に直す","電流"]}},{"id":"t30s2x","scene":"t30s2x","kind":"u30s2cc","lab":{"src":"{V}=100 V","c":"{C}=40 μF","i":["{I}","{I}=2 A"]},"viewbox":"464 284 595 350","band":{"want":"電流 $I$","known":"$V = 100\\,\\mathrm{V},\\;\\; \\omega = 500\\,\\mathrm{rad/s},\\;\\; C = 40\\,\\mu\\mathrm{F}$","ans":"$I = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、コンデンサに流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①式を作る\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"$X_C$ の数を先に出すより、〖電流の式を文字のまま作る〗方が楽です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["I","src","C"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{X_C}"],["= \\omega C V"]]}],"emphPre":["C","I","src"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"マイクロは〖$10^{-6}$〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I"],"eq":[{"cont":false,"items":[["I = 500 \\times 40 \\times 10^{-6} \\times 100"],["= 2\\,\\mathrm{A}"]]}],"move":"i","ans":true,"emphPre":["src","C","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s2ccL","u30s2ccw1"],"zlo":["u30s2ccRw","u30s2ccw2"]},"moves":{"i":{"to":{"iv":1},"dur":0.5}},"route":["式を作る","数を入れる"]}},{"id":"t30s3e","scene":"t30s3e","kind":"u30s3xg","lab":{"ax":"{f}","ay":"{X}","c1":"{X}_L","c1s":"lin","c1a":0.35,"c2":"{X}_C","c2s":"inv","c2a":0.6,"c3":"{R}","c3s":"flat","c3a":0.45,"x1":"{f}","x2":"2{f}","h11":"{X}_L","h12":"2{X}_L","h21":"{X}_C","h22":"{X}_C/2"},"viewbox":"66 128 888 584","band":{"want":"周波数を変えた時のリアクタンス","ans":"$X_L$ は周波数に比例、$X_C$ は反比例、$R$ は変わらない","full":"X_L = 2πfL は f に比例（2 倍で 2 倍）。X_C = 1/(2πfC) は f に反比例（2 倍で 1/2 倍）。抵抗は周波数で変わらない。"},"narr":{"start":{"co":1,"c1d":0,"c2d":0,"c3d":0,"x1d":0,"x2d":0,"hd":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①コイル\n②コンデンサ\n③抵抗\nこの順に、周波数を変えた時を見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"$X_L = 2\\pi f L$ です。$f$ が分子にあるので、〖周波数に比例します〗。","at":{"道筋":1.0,"式":1.0,"動き":1.0,"強調":1.0},"after":["動き","強調"],"route":1,"eq":[{"cont":false,"items":[["X_L = 2\\pi f L"]]}],"move":"c1","emph":["C1"]},{"text":"周波数を 2 倍にすると、$X_L$ も 2 倍になります。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"xh","emph":["C1","X1","X2","H11","H12"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"$X_C = \\dfrac{1}{2\\pi f C}$ です。$f$ が分母にあるので、〖周波数に反比例します〗。","at":{"道筋":1.0,"式":1.0,"動き":1.0,"強調":1.0},"after":["動き","強調"],"route":2,"eq":[{"cont":false,"items":[["X_C = \\dfrac{1}{2\\pi f C}"]]}],"move":"c2","emph":["C2","H21","H22"]},{"text":"周波数を 2 倍にすると、分母が 2 倍になり、$X_C$ は $\\dfrac{1}{2}$ 倍になります。3 倍なら $\\dfrac{1}{3}$ 倍です。","at":{"強調":1.0},"after":[],"emph":["C2","X1","X2","H21","H22"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"〖抵抗は、周波数を変えても変わりません〗。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"c3","emph":["C3"]},{"text":"周波数が大きいと、〖コイルは流しにくく、コンデンサは流しやすく〗なります。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["C1","C2"]}]}],"groups":{"Ax":["xax","xax:h","xay","xay:h","xo","xaxt0","xaxt1","xayt0","xayt1"],"C1":["xc1","xc1t0","xc1t1"],"C2":["xc2","xc2t0","xc2t1"],"C3":["xc3","xc3t0","xc3t1"],"X1":["xx1","xx1t0","xx1t1"],"X2":["xx2","xx2t0","xx2t1"],"H11":["xd11","xh11t0","xh11t1"],"H12":["xd12","xh12t0","xh12t1"],"H21":["xd21","xh21t0","xh21t1"],"H22":["xd22","xh22t0","xh22t1"],"H31":["xd31","xh31t0","xh31t1"],"H32":["xd32","xh32t0","xh32t1"]},"moves":{"c1":{"to":{"c1d":1},"dur":1.0},"xh":{"to":{"x1d":1,"x2d":1,"hd":1},"dur":0.6},"c2":{"to":{"c2d":1},"dur":1.0},"c3":{"to":{"c3d":1},"dur":0.8}},"route":["コイル","コンデンサ","抵抗"]}},{"id":"t30s3x","scene":"t30s3x","kind":"u30s3xg","lab":{"ax":"{f}","ay":"{X}","c1":"{X}_L","c1s":"lin","c1a":0.25,"x1":"60 Hz","x2":"180 Hz","x1at":0.25,"x2at":0.75,"h11":"15 Ω","h12":["{X}_L","45 Ω"]},"viewbox":"66 128 888 584","band":{"want":"180 Hz の時の誘導性リアクタンス","known":"60 Hz で $X_L = 15\\,\\Omega$","ans":"$X_L = 45\\,\\Omega$"},"narr":{"start":{"co":1,"h12v":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、180 Hz の時の誘導性リアクタンスです。","at":{"強調":1.0},"after":[],"emph":["H12"]},{"text":"①何倍か\n②比例で掛ける\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"周波数は 60 Hz から 180 Hz で、3 倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["X1","X2"],"eq":[{"cont":false,"items":[["\\dfrac{180}{60} = 3"]]}]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"誘導性リアクタンスは周波数に比例するので、〖3 倍〗になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["H12","C1"],"eq":[{"cont":false,"items":[["X_L = 15 \\times 3 = 45\\,\\Omega"]]}],"move":"h","ans":true,"emphPre":["C1","H11"]}]}],"groups":{"Ax":["xax","xax:h","xay","xay:h","xo","xaxt0","xaxt1","xayt0","xayt1"],"C1":["xc1","xc1t0","xc1t1"],"C2":["xc2","xc2t0","xc2t1"],"C3":["xc3","xc3t0","xc3t1"],"X1":["xx1","xx1t0","xx1t1"],"X2":["xx2","xx2t0","xx2t1"],"H11":["xd11","xh11t0","xh11t1"],"H12":["xd12","xh12t0","xh12t1"],"H21":["xd21","xh21t0","xh21t1"],"H22":["xd22","xh22t0","xh22t1"],"H31":["xd31","xh31t0","xh31t1"],"H32":["xd32","xh32t0","xh32t1"]},"moves":{"h":{"to":{"h12v":1},"dur":0.5}},"route":["何倍か","比例で掛ける"]}},{"id":"t30s4e","scene":"t30s4e","kind":"u30s4cwp","lab":{"src":"{v}","r":"{R}","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0,"a2":"{I}","a2dot":true,"a2l":0.5,"a2g":0,"a2y":-0.04},"viewbox":"86 88 1234 1298","band":{"want":"抵抗の電圧と電流の位相","ans":"抵抗では電圧と電流は同相。$\\dot{I} = \\dfrac{V}{R}$ は右向き","full":"交流でもオームの法則が使え、値はふつう実効値。抵抗では i = √2(V/R) sin ωt で電圧と同相。İ = V/R に j が無いので、電圧を基準（右向き）にすると電流も右向き。"},"narr":{"start":{"co":1,"t":0,"w2d":0,"a1d":0,"a2d":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①実効値で考える\n②瞬時値の式\n③ベクトル\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"交流になっても、〖オームの法則はそのまま使えます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R"]},{"text":"電圧 $V$ と電流 $I$ は、〖ふつう実効値〗です。時間で変わる様子を見る時は、瞬時値 $v$・$i$ を使います。","at":{"強調":1.0},"after":[],"emph":["W1"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"抵抗に $v = \\sqrt{2} V \\sin \\omega t$ を加えます。$\\sqrt{2} V$ は最大値です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["src","W1"]},{"text":"電流は〖$R$ で割るだけ〗です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["W2","I","R"],"eq":[{"cont":false,"items":[["i = \\sqrt{2} \\dfrac{V}{R} \\sin \\omega t"]]}],"move":"i","emphPre":["R","W1"]},{"text":"電圧と電流は、上がる時も下がる時も同じです。左右にずれません。これが〖同相〗です。","at":{"強調":1.0},"after":[],"emph":["W1","W2","R"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"ベクトルで見ます。電圧 $\\dot{V}$ を基準にして、右向きにかきます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"pv","emph":["A1"]},{"text":"j が付いていないので実数です。〖電流も右向き〗です。","at":{"式":0.0,"動き":1.0,"強調":1.0},"after":["動き","強調"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{V}{R}"]]}],"move":"a2","emph":["A2"]},{"text":"抵抗では、電圧と電流は同相です。電流の大きさは $I = \\dfrac{V}{R}$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A1","A2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s4cwpL","u30s4cwpw1"],"zlo":["u30s4cwpRw","u30s4cwpw2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1","paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1","ps2x1t0","ps2x1t1"],"S3":["ws3x1","ps3x1t0","ps3x1t1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"i":{"to":{"w2d":1},"dur":1.0},"pv":{"to":{"t":1,"a1d":1},"dur":0.8},"a2":{"to":{"a2d":1},"dur":0.6}},"route":["実効値で考える","瞬時値の式","ベクトル"]}},{"id":"t30s4x","scene":"t30s4x","kind":"u30s4cw","lab":{"src":"{v}=100\\sqrt{2}\\sin{ω}{t}","r":"25 Ω","i":["{i}","{I}=4 A"],"ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5},"viewbox":"202 243 1118 1143","band":{"want":"電流の実効値 $I$","known":"$v = 100\\sqrt{2} \\sin \\omega t$、$R = 25\\,\\Omega$","ans":"$I = 4\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"w2d":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、電流の実効値 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①電圧の実効値\n②オームの法則\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"$100\\sqrt{2}$ は最大値です。実効値は〖$\\sqrt{2}$ で割って〗100 V です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["src","W1"],"eq":[{"cont":false,"items":[["V = \\dfrac{100\\sqrt{2}}{\\sqrt{2}} = 100\\,\\mathrm{V}"]]}]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"〖実効値どうし〗で、オームの法則を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R}"],["= \\dfrac{100}{25} = 4\\,\\mathrm{A}"]]}],"move":"i","ans":true,"emphPre":["src","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s4cwL","u30s4cww1"],"zlo":["u30s4cwRw","u30s4cww2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1"],"S3":["ws3x1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{"i":{"to":{"iv":1},"dur":0.5}},"route":["電圧の実効値","オームの法則"]}},{"id":"t30s5e","scene":"t30s5e","kind":"u30s5lwp","lab":{"src":"{v}","l":"{X}_L","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"w2p":-90,"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0,"a2":"{I}","a2dot":true,"a2l":0.6,"a2g":-90,"g1":"90°","g1f":0,"g1t":-90},"viewbox":"86 88 1234 1298","band":{"want":"コイルの電圧と電流の位相","ans":"コイルは $jX_L$。電流は電圧より 90° 遅れる（下向き）","full":"コイルでは電流が電圧より 90° 遅れる。交流回路のコイルは jX_L と書く。İ = V/(jX_L) = −jV/X_L で下向き。大きさだけなら I = V/X_L で j は要らない。"},"narr":{"start":{"co":1,"t":0,"w2d":0,"w2m":0,"a1d":0,"a2d":0,"g1d":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①電流の波形\n②$jX_L$\n③ベクトル図\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["L"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"コイルに $v = \\sqrt{2} V \\sin \\omega t$ を加えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","W1"]},{"text":"コイルは、〖電流の位相を電圧より 90° 遅らせます〗。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"i","emph":["W2","I"]},{"text":"電流の波形は、〖右へ $\\dfrac{\\pi}{2}$ ずれます〗。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sh","emph":["W1","W2"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["i = \\sqrt{2} \\dfrac{V}{X_L} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)"]]}],"emph":["W2","L"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"$-\\dfrac{\\pi}{2}$ を覚える必要はありません。大事なのは、〖交流回路のコイルに j を付ける〗ことです。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["L"],"eq":[{"cont":false,"items":[["jX_L"]]}]},{"text":"電流のベクトルは、電圧を $jX_L$ で割ります。分母と分子に j を掛けると、こうなります。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["L","I"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{V}{jX_L}"],["= -j\\dfrac{V}{X_L}"]]}]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"電圧を基準にして、右向きにかきます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"pv","emph":["A1"]},{"text":"電流は $-j$ が付くので、マイナスの虚数です。〖下向きで、90° 遅れ〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"a2","emph":["A2","G1"]},{"text":"大きさだけを求める時は、j は要りません。ベクトルを求める時は、〖必ず j を付けます〗。","at":{"式":1.0,"答え":1.0,"強調":1.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{X_L}"]]}],"ans":true,"emph":["A2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s5lwpL","u30s5lwpw1"],"zlo":["u30s5lwpRw","u30s5lwpw2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1","paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1","ps2x1t0","ps2x1t1"],"S3":["ws3x1","ps3x1t0","ps3x1t1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"i":{"to":{"w2d":1},"dur":1.0},"sh":{"to":{"w2m":1},"dur":0.8},"pv":{"to":{"t":1,"a1d":1},"dur":0.8},"a2":{"to":{"a2d":1,"g1d":1},"dur":0.8}},"route":["電流の波形","$jX_L$","ベクトル図"]}},{"id":"t30s5x","scene":"t30s5x","kind":"u30s5lw","lab":{"src":"{v}=100\\sqrt{2}\\sin{ω}{t}","l":"{X}_L=20 Ω","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"w2p":-90},"viewbox":"202 243 1118 1143","band":{"want":"電流 $i$ の式","known":"$v = 100\\sqrt{2} \\sin \\omega t$、$X_L = 20\\,\\Omega$","ans":"$i = 5\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、コイルに流れる電流 $i$ の式です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①最大値\n②位相\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"大きさは、電圧を誘導性リアクタンスで割ります。〖最大値どうし〗で割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W2"],"eq":[{"cont":false,"items":[["I_m = \\dfrac{100\\sqrt{2}}{20} = 5\\sqrt{2}\\,\\mathrm{A}"]]}],"emphPre":["W1","L"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"コイルなので、〖電流は電圧より 90° 遅れます〗。電圧の位相は 0 なので、$-\\dfrac{\\pi}{2}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["L","W2"]},{"text":"","at":{"式":0.0,"答え":0.0,"強調":0.0},"after":["答え","強調"],"eq":[{"cont":false,"items":[["i = 5\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)"]]}],"ans":true,"emph":["I","W2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"L":["l","lt0","lt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s5lwL","u30s5lww1"],"zlo":["u30s5lwRw","u30s5lww2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1"],"S3":["ws3x1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{},"route":["最大値","位相"]}},{"id":"t30s6e","scene":"t30s6e","kind":"u30s6cwp","lab":{"src":"{v}","c":"{X}_C","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"w2p":90,"ref":true,"a1":"{V}","a1dot":true,"a1l":1,"a1g":0,"a2":"{I}","a2dot":true,"a2l":0.6,"a2g":90,"g1":"90°","g1f":0,"g1t":90},"viewbox":"86 88 1234 1298","band":{"want":"コンデンサの電圧と電流の位相","ans":"コンデンサは $-jX_C$。電流は電圧より 90° 進む（上向き）","full":"コンデンサでは電流が電圧より 90° 進む。交流回路のコンデンサは −jX_C と書く。İ = V/(−jX_C) は分母と分子に j を掛けると、j × j = −1 なので jV/X_C で上向き。抵抗は同相・コイルは遅れ・コンデンサは進み。"},"narr":{"start":{"co":1,"t":0,"w2d":0,"w2m":0,"a1d":0,"a2d":0,"g1d":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"①電流の波形\n②$-jX_C$\n③素子を決める\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"コンデンサは、〖電流の位相を電圧より 90° 進めます〗。電流の波形は、左へずれます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":1,"move":"i","emph":["W1","W2"]},{"text":"ずれは $\\dfrac{\\pi}{2}$ です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sh","emph":["W2"]},{"text":"","at":{"式":0.0,"強調":0.0},"after":["強調"],"eq":[{"cont":false,"items":[["i = \\sqrt{2} \\dfrac{V}{X_C} \\sin\\left(\\omega t + \\dfrac{\\pi}{2}\\right)"]]}],"emph":["W2","C"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"交流回路のコンデンサには、〖$-j$ を付けます〗。コイルは $j$、コンデンサは $-j$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["C"],"eq":[{"cont":false,"items":[["-jX_C"]]}]},{"text":"電流のベクトルは、電圧を $-jX_C$ で割ります。分母と分子に j を掛けます。〖$j \\times j = -1$〗です。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["C","I"],"eq":[{"cont":false,"items":[["\\dot{I} = \\dfrac{V}{-jX_C}"],["= \\dfrac{jV}{-j \\times jX_C}"],["= j\\dfrac{V}{X_C}"]]}]},{"text":"電圧を右向きにかくと、電流は $j$ が付くので上向きです。90° 進みです。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"pv","emph":["A1","A2","G1"]}]},{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"まとめます。〖抵抗は同相、コイルは 90° 遅れ、コンデンサは 90° 進み〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["A2"]},{"text":"電圧と電流の式を比べて、〖位相のずれから、どの素子か分かります〗。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["A1","A2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s6cwpL","u30s6cwpw1"],"zlo":["u30s6cwpRw","u30s6cwpw2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1","paxx1","paxx1:h","payx1","payx1:h","paxrx1t0","paxrx1t1","paxix1t0","paxix1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1","ps2x1t0","ps2x1t1"],"S3":["ws3x1","ps3x1t0","ps3x1t1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"],"O":["pox1","po1x1t0","po1x1t1"],"Ref":["prefx1"],"O1":["po1x1t0","po1x1t1"],"Dg1":["pdg1x1"],"A1":["pa1x1","pa1x1:h","pa1x1t0","pa1x1t1","pa1x1t2"],"A2":["pa2x1","pa2x1:h","pa2x1t0","pa2x1t1","pa2x1t2"],"A3":["pa3x1","pa3x1:h","pa3x1t0","pa3x1t1","pa3x1t2"],"A4":["pa4x1","pa4x1:h","pa4x1t0","pa4x1t1","pa4x1t2"],"A5":["pa5x1","pa5x1:h","pa5x1t0","pa5x1t1","pa5x1t2"],"A6":["pa6x1","pa6x1:h","pa6x1t0","pa6x1t1","pa6x1t2"],"A7":["pa7x1","pa7x1:h","pa7x1t0","pa7x1t1","pa7x1t2"],"A8":["pa8x1","pa8x1:h","pa8x1t0","pa8x1t1","pa8x1t2"],"A9":["pa9x1","pa9x1:h","pa9x1t0","pa9x1t1","pa9x1t2"],"G1":["pg1x1","pg1ax1","pg1ax1:h","pg1x1t0","pg1x1t1"],"G2":["pg2x1","pg2ax1","pg2ax1:h","pg2x1t0","pg2x1t1"],"G3":["pg3x1","pg3ax1","pg3ax1:h","pg3x1t0","pg3x1t1"],"Rot":["prAx1","prAhx1","prAhx1:h","prBx1","prBhx1","prBhx1:h","pradvx1t0","pradvx1t1","prlagx1t0","prlagx1t1"],"Pg1":["ppg1x1","ppg2x1"],"C1":["pc1ax1","pc1bx1","pc1xx1t0","pc1xx1t1","pc1yx1t0","pc1yx1t1"],"Tx1":["ptx1x1","ptx1x1t0","ptx1x1t1"],"D0":["pd0x1","pd0x1t0","pd0x1t1"],"D90":["pd90x1","pd90x1t0","pd90x1t1"],"D180":["pd180x1","pd180x1t0","pd180x1t1"],"Dm90":["pdm90x1","pdm90x1t0","pdm90x1t1"],"S1":["ps1x1t0","ps1x1t1"],"C2":["pc2ax1","pc2bx1","pc2xx1t0","pc2xx1t1","pc2yx1t0","pc2yx1t1"],"Ty1":["pty1x1","pty1x1t0","pty1x1t1"]},"moves":{"i":{"to":{"w2d":1},"dur":1.0},"sh":{"to":{"w2m":1},"dur":0.8},"pv":{"to":{"t":1,"a1d":1,"a2d":1,"g1d":1},"dur":1.0}},"route":["電流の波形","$-jX_C$","素子を決める"]}},{"id":"t30s6x","scene":"t30s6x","kind":"u30s6bw","lab":{"src":"{v}=100\\sin500{t}","bx":["?","{C}=40 μF"],"i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"w2p":90},"viewbox":"202 243 1118 1143","band":{"want":"素子と、その値","known":"$v = 100 \\sin 500t$、$i = 2 \\sin\\left(500t + \\dfrac{\\pi}{2}\\right)$","ans":"コンデンサ、$C = 40\\,\\mu\\mathrm{F}$"},"narr":{"start":{"co":1,"bxv":0},"steps":[{"cap":null,"eqp":null,"vid":[17],"sents":[{"text":"求めるのは、四角の中の素子と、その値です。","at":{"強調":1.0},"after":[],"emph":["Bx"]},{"text":"①素子\n②リアクタンス\n③静電容量\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[17,18],"sents":[{"text":"電流の位相は $+\\dfrac{\\pi}{2}$ で、電圧より 90° 進んでいます。進むのは〖コンデンサ〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["W1","W2"]}]},{"cap":null,"eqp":null,"vid":[17,18],"sents":[{"text":"〖大きさの比〗が容量性リアクタンスです。最大値どうしで割ります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["src","I"],"eq":[{"cont":false,"items":[["X_C = \\dfrac{100}{2} = 50\\,\\Omega"]]}]}]},{"cap":null,"eqp":null,"vid":[17,18],"sents":[{"text":"$\\omega t$ の所が $500t$ なので、$\\omega = 500\\,\\mathrm{rad/s}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["src"]},{"text":"$X_C = \\dfrac{1}{\\omega C}$ を〖$C$ の式に直して〗、数を入れます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["Bx"],"eq":[{"cont":false,"items":[["C = \\dfrac{1}{\\omega X_C}"],["= \\dfrac{1}{500 \\times 50} = 40 \\times 10^{-6}\\,\\mathrm{F}"],["= 40\\,\\mu\\mathrm{F}"]]}],"move":"c","ans":true,"emphPre":["Bx"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"Bx":["bx","bxt0","bxt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u30s6bwL","u30s6bww1"],"zlo":["u30s6bwRw","u30s6bww2"],"Ax":["waxx1","waxx1:h","wayx1","wayx1:h","wox1","waxx1t0","waxx1t1","wayx1t0","wayx1t1"],"W1":["ww1x1","ww1x1t0","ww1x1t1"],"W2":["ww2x1","ww2x1t0","ww2x1t1"],"W3":["ww3x1","ww3x1t0","ww3x1t1"],"X1":["wx1x1","wx1x1t0","wx1x1t1"],"X2":["wx2x1","wx2x1t0","wx2x1t1"],"X3":["wx3x1","wx3x1t0","wx3x1t1"],"X4":["wx4x1","wx4x1t0","wx4x1t1"],"Y1":["wy1x1","wy1x1t0","wy1x1t1"],"Y2":["wy2x1","wy2x1t0","wy2x1t1"],"Y3":["wy3x1","wy3x1t0","wy3x1t1"],"Per1":["wprx1","wprx1:h","wprx1:h2","wprx1t0","wprx1t1"],"Pt":["wptx1","wptlx1","wptx1t0","wptx1t1"],"Pt2":["wpx1t2","wpt2lx1","wpt2x1t0","wpt2x1t1"],"W1a":["ww1ax1"],"S2":["ws2x1"],"S3":["ws3x1"],"Fill":["wflx1","wflx1t0","wflx1t1"],"Lv1":["wlv1x1","wlb1x1","wlv1x1t0","wlv1x1t1"],"Lv2":["wlv2x1","wlb2x1","wlv2x1t0","wlv2x1t1"]},"moves":{"c":{"to":{"bxv":1},"dur":0.5}},"route":["素子","リアクタンス","静電容量"]}}],"secs":[{"ex":{"text":"図のように、電圧の実効値 $100\\,\\mathrm{V}$、角速度 $\\omega = 200\\,\\mathrm{rad/s}$ の交流電源に、インダクタンス $50\\,\\mathrm{mH}$ のコイルをつないだ。流れる電流の実効値は何 A か。","fig":{"kind":"u30s1lc","L":{"src":"{V}=100 V","l":"{L}=50 mH","i":"{I}"},"P":{}},"ch":[{"t":"$0.01\\,\\mathrm{A}$","v":0.01,"why":"mH を H に直していない"},{"t":"$0.1\\,\\mathrm{A}$","v":0.1,"why":"割る順が逆"},{"t":"$10\\,\\mathrm{A}$","v":10,"why":""},{"t":"$2000\\,\\mathrm{A}$","v":2000,"why":"$\\omega$ を掛けていない。$X_L = \\omega L$ で Ω に直す"}],"ans":2}},{"ex":{"text":"図のように、電圧の実効値 $100\\,\\mathrm{V}$、角速度 $\\omega = 500\\,\\mathrm{rad/s}$ の交流電源に、静電容量 $40\\,\\mu\\mathrm{F}$ のコンデンサをつないだ。流れる電流の実効値は何 A か。","fig":{"kind":"u30s2cc","L":{"src":"{V}=100 V","c":"{C}=40 μF","i":"{I}"},"P":{}},"ch":[{"t":"$0.5\\,\\mathrm{A}$","v":0.5,"why":"割る順が逆（$X_C = 50\\,\\Omega$ を電圧で割った）"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$5000\\,\\mathrm{A}$","v":5000,"why":"$\\omega C$ の逆数をとっていない。$X_C = \\dfrac{1}{\\omega C}$"},{"t":"$2000000\\,\\mathrm{A}$","v":2000000,"why":"μF を F に直していない"}],"ans":1}},{"ex":{"text":"周波数 $60\\,\\mathrm{Hz}$ の交流電源につないだコイルの誘導性リアクタンスは $15\\,\\Omega$ であった。電源の周波数を $180\\,\\mathrm{Hz}$ にすると、誘導性リアクタンスは何 Ω になるか。","fig":{"kind":"u30s3lc","L":{"src":"{V}","l":"{X}_L","i":"{I}"},"P":{}},"ch":[{"t":"$5\\,\\Omega$","v":5,"why":"反比例とした（コンデンサと取り違えた）"},{"t":"$15\\,\\Omega$","v":15,"why":"変わらないとした（抵抗と取り違えた）"},{"t":"$45\\,\\Omega$","v":45,"why":""},{"t":"$135\\,\\Omega$","v":135,"why":"周波数の比の 2 乗を掛けた。比例なので 3 倍"}],"ans":2}},{"ex":{"text":"図のように、$v = 100\\sqrt{2} \\sin \\omega t$［V］の電圧を $25\\,\\Omega$ の抵抗に加えた。流れる電流の実効値は何 A か。","fig":{"kind":"u30s4cw","L":{"src":"{v}=100\\sqrt{2}\\sin{ω}{t}","r":"25 Ω","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5},"P":{}},"ch":[{"t":"$4\\sqrt{2}\\,\\mathrm{A}$","v":"m","why":"最大値を答えた。実効値は最大値を $\\sqrt{2}$ で割る"},{"t":"$4\\,\\mathrm{A}$","v":"ok","why":""},{"t":"$0.25\\,\\mathrm{A}$","v":"inv","why":"割る順が逆"},{"t":"$2500\\,\\mathrm{A}$","v":"mul","why":"割るところを掛けた"}],"ans":1}},{"ex":{"text":"図のように、$v = 100\\sqrt{2} \\sin \\omega t$［V］の電圧を、誘導性リアクタンス $20\\,\\Omega$ のコイルに加えた。流れる電流 $i$［A］を表す式はどれか。","fig":{"kind":"u30s5lw","L":{"src":"{v}=100\\sqrt{2}\\sin{ω}{t}","l":"{X}_L=20 Ω","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"w2p":-90},"P":{}},"ch":[{"t":"$i = 5\\sqrt{2} \\sin \\omega t$","v":"zero","why":"コイルでは、電流は電圧より 90° 遅れる"},{"t":"$i = 5\\sqrt{2} \\sin\\left(\\omega t + \\dfrac{\\pi}{2}\\right)$","v":"lead","why":"進むのはコンデンサ。コイルは遅れ"},{"t":"$i = 5\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$","v":"ok","why":""},{"t":"$i = 2000\\sqrt{2} \\sin\\left(\\omega t - \\dfrac{\\pi}{2}\\right)$","v":"mul","why":"割るところを掛けた"}],"ans":2}},{"ex":{"text":"図の四角の中には、抵抗・コイル・コンデンサのどれか1つが入っている。電圧が $v = 100 \\sin 500t$［V］、電流が $i = 2 \\sin\\left(500t + \\dfrac{\\pi}{2}\\right)$［A］であった。素子と、その値の組はどれか。","fig":{"kind":"u30s6bw","L":{"src":"{v}=100\\sin500{t}","bx":"?","i":"{i}","ax":"{ω}{t}［rad］","ay":"{v}・{i}","w1":"{v}","w2":"{i}","w2a":0.5,"w2p":90},"P":{}},"ch":[{"t":"コイル、$0.1\\,\\mathrm{H}$","v":"L","why":"電流が進むのはコンデンサ。遅れるのがコイル"},{"t":"抵抗、$50\\,\\Omega$","v":"R","why":"位相がずれているので抵抗ではない"},{"t":"コンデンサ、$100000\\,\\mu\\mathrm{F}$","v":"Cx","why":"$X_C = \\dfrac{1}{\\omega C}$ なので $C = \\dfrac{1}{\\omega X_C}$"},{"t":"コンデンサ、$40\\,\\mu\\mathrm{F}$","v":"C","why":""}],"ans":3}}],"past":[]}};
});
