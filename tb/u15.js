/* 単元15「電界と電位」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(15, function(H){
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
// ---- 15-1 電界の強さ の図（※ textbook/gen/make_section.py が textbook/gen/data/u15_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U15S1K = {
  pe: {"vars":[],"items":[{"f":"c","id":"qc","cx":260,"cy":400,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[231.5,371.5],[288.5,371.5],[288.5,428.5],[231.5,428.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":260,"y":401,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[260,340,"middle",[0,-1]],[260,460,"middle",[0,1]],[302,360,"start",[1,-1]]],"need":"q","vis":[],"t":"F","x":260,"y":340,"anc":"middle"},{"f":"c","id":"ppd","cx":600,"cy":400,"r":7,"fill":"k","need":"p","vis":[],"t":"F","hide":["t","td"]},{"f":"lb","id":"pt","k":"p","bases":[[584,434,"end",[-1,1]],[600,440,"middle",[0,1]]],"need":"p","vis":[],"t":"F","x":541.57,"y":476.43,"anc":"end"},{"f":"c","id":"tc","cx":600,"cy":400,"r":18,"fill":"w","sk":"ts","o":["td"],"need":"t","vis":[],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[600,348,"middle",[0,-1]],[570,360,"end",[-1,-1]]],"o":["td"],"need":"t","vis":[],"t":"F","x":600,"y":348,"anc":"middle"},{"f":"ar","id":"ea","x0":618,"y0":400,"x1":738,"y1":400,"need":"e","sel":"ea","var":{"out":{"x0":618,"y0":400,"x1":738,"y1":400},"in":{"x0":582,"y0":400,"x1":462,"y1":400}},"dflt":"out","gr":"ed","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"vbases":{"out":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"in":[[522,370,"middle",[0,-1]],[522,430,"middle",[0,1]],[446,400,"end",[-1,0]]]},"o":["ed"],"need":"e","sel":"ea","var":{"out":{"x":678,"y":310,"anc":"middle"},"in":{"x":522,"y":266,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":678,"y":370,"anc":"middle"},{"f":"ar","id":"fa","x0":618,"y0":446,"x1":738,"y1":446,"need":"f","sel":"fa","var":{"out":{"x0":618,"y0":446,"x1":738,"y1":446},"in":{"x0":582,"y0":446,"x1":462,"y1":446}},"dflt":"out","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"vbases":{"out":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"in":[[522,416,"middle",[0,-1]],[522,476,"middle",[0,1]],[446,446,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"out":{"x":678,"y":476,"anc":"middle"},"in":{"x":506,"y":476,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":678,"y":416,"anc":"middle"},{"f":"ln","id":"re1","pts":[[260,436],[260,564]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[600,436],[600,564]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":260,"y0":550,"x1":600,"y1":550,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[430,590,"middle",[0,1]],[430,510,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":430,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU15s1pe(d, p, L){ tbFig_Draw(d, p, L, U15S1K.pe); }
// ---- 15-2 電界の中の力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u15_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U15S2K = {
  pe: {"vars":[],"items":[{"f":"c","id":"qc","cx":260,"cy":400,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[231.5,371.5],[288.5,371.5],[288.5,428.5],[231.5,428.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":260,"y":401,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[260,340,"middle",[0,-1]],[260,460,"middle",[0,1]],[302,360,"start",[1,-1]]],"need":"q","vis":[],"t":"F","x":260,"y":340,"anc":"middle"},{"f":"c","id":"ppd","cx":600,"cy":400,"r":7,"fill":"k","need":"p","vis":[],"t":"F","hide":["t","td"]},{"f":"lb","id":"pt","k":"p","bases":[[584,434,"end",[-1,1]],[600,440,"middle",[0,1]]],"need":"p","vis":[],"t":"F","x":541.57,"y":476.43,"anc":"end"},{"f":"c","id":"tc","cx":600,"cy":400,"r":18,"fill":"w","sk":"ts","o":["td"],"need":"t","vis":[],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[600,348,"middle",[0,-1]],[570,360,"end",[-1,-1]]],"o":["td"],"need":"t","vis":[],"t":"F","x":600,"y":348,"anc":"middle"},{"f":"ar","id":"ea","x0":618,"y0":400,"x1":738,"y1":400,"need":"e","sel":"ea","var":{"out":{"x0":618,"y0":400,"x1":738,"y1":400},"in":{"x0":582,"y0":400,"x1":462,"y1":400}},"dflt":"out","gr":"ed","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"vbases":{"out":[[678,370,"middle",[0,-1]],[678,430,"middle",[0,1]],[754,400,"start",[1,0]]],"in":[[522,370,"middle",[0,-1]],[522,430,"middle",[0,1]],[446,400,"end",[-1,0]]]},"o":["ed"],"need":"e","sel":"ea","var":{"out":{"x":678,"y":310,"anc":"middle"},"in":{"x":446,"y":370,"anc":"middle"}},"dflt":"out","vis":[],"t":"F","x":678,"y":370,"anc":"middle"},{"f":"ar","id":"fa","x0":618,"y0":446,"x1":738,"y1":446,"need":"f","sel":"fa","var":{"out":{"x0":618,"y0":446,"x1":738,"y1":446},"in":{"x0":582,"y0":446,"x1":462,"y1":446}},"dflt":"out","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"vbases":{"out":[[678,416,"middle",[0,-1]],[678,476,"middle",[0,1]],[754,446,"start",[1,0]]],"in":[[522,416,"middle",[0,-1]],[522,476,"middle",[0,1]],[446,446,"end",[-1,0]]]},"o":["fd"],"need":"f","sel":"fa","var":{"out":{"x":678,"y":476,"anc":"middle"},"in":{"x":446,"y":446,"anc":"end"}},"dflt":"out","vis":[],"t":"F","x":678,"y":416,"anc":"middle"},{"f":"ln","id":"re1","pts":[[260,436],[260,564]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[600,436],[600,564]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":260,"y0":550,"x1":600,"y1":550,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[430,590,"middle",[0,1]],[430,510,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":430,"y":590,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU15s2pe(d, p, L){ tbFig_Draw(d, p, L, U15S2K.pe); }
// ---- 15-3 誘電率 の図（※ textbook/gen/make_section.py が textbook/gen/data/u15_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U15S3K = {
  pr: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[110,230],[900,230],[900,590],[110,590]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[130,262,"start",[0,-1]],[880,262,"end",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":130,"y":262,"anc":"start"},{"f":"c","id":"q1c","cx":300,"cy":400,"r":30,"fill":"w","sk":"q1s","sel":"q1s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q1m","pts":[[271.5,371.5],[328.5,371.5],[328.5,428.5],[271.5,428.5]],"w":3,"close":1,"sel":"q1s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q1mt","x":300,"y":401,"s":"N","anc":"middle","size":33,"sel":"q1s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q1t","k":"q1","bases":[[300,340,"middle",[0,-1]],[300,460,"middle",[0,1]],[342,360,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","x":300,"y":340,"anc":"middle"},{"f":"c","id":"q2c","cx":680,"cy":400,"r":30,"fill":"w","sk":"q2s","sel":"q2s","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"q2m","pts":[[651.5,371.5],[708.5,371.5],[708.5,428.5],[651.5,428.5]],"w":3,"close":1,"sel":"q2s","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"q2mt","x":680,"y":401,"s":"N","anc":"middle","size":33,"sel":"q2s","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"q2t","k":"q2","bases":[[680,340,"middle",[0,-1]],[680,460,"middle",[0,1]],[722,360,"start",[1,-1]]],"need":"q2","vis":[],"t":"F","x":680,"y":340,"anc":"middle"},{"f":"ar","id":"f1a","x0":336,"y0":400,"x1":456,"y1":400,"need":"f1","sel":"f1a","var":{"in":{"x0":336,"y0":400,"x1":456,"y1":400},"out":{"x0":264,"y0":400,"x1":144,"y1":400}},"dflt":"in","gr":"f1d","sc":["fs",0.25],"vis":[],"t":"F"},{"f":"lb","id":"f1t","k":"f1","bases":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"vbases":{"in":[[396,370,"middle",[0,-1]],[396,430,"middle",[0,1]],[472,400,"start",[1,0]]],"out":[[204,370,"middle",[0,-1]],[204,430,"middle",[0,1]],[128,400,"end",[-1,0]]]},"o":["f1d"],"need":"f1","sel":"f1a","var":{"in":{"x":472,"y":364,"anc":"middle"},"out":{"x":260,"y":550,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":396,"y":370,"anc":"middle"},{"f":"ar","id":"f2a","x0":644,"y0":400,"x1":524,"y1":400,"need":"f2","sel":"f2a","var":{"in":{"x0":644,"y0":400,"x1":524,"y1":400},"out":{"x0":716,"y0":400,"x1":836,"y1":400}},"dflt":"in","gr":"f2d","sc":["fs",0.25],"vis":[],"t":"F"},{"f":"lb","id":"f2t","k":"f2","bases":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"vbases":{"in":[[584,370,"middle",[0,-1]],[584,430,"middle",[0,1]],[508,400,"end",[-1,0]]],"out":[[776,370,"middle",[0,-1]],[776,430,"middle",[0,1]],[852,400,"start",[1,0]]]},"o":["f2d"],"need":"f2","sel":"f2a","var":{"in":{"x":584,"y":298,"anc":"middle"},"out":{"x":760,"y":550,"anc":"middle"}},"dflt":"in","vis":[],"t":"F","x":584,"y":370,"anc":"middle"},{"f":"ln","id":"re1","pts":[[300,436],[300,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ln","id":"re2","pts":[[680,436],[680,514]],"w":2,"need":"r","vis":[],"t":"F"},{"f":"ar","id":"rd","x0":300,"y0":500,"x1":680,"y1":500,"two":1,"w":2,"need":"r","vis":[],"t":"F"},{"f":"lb","id":"rt","k":"r","bases":[[490,540,"middle",[0,1]],[490,460,"middle",[0,-1]]],"need":"r","vis":[],"t":"F","x":490,"y":540,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU15s3pr(d, p, L){ tbFig_Draw(d, p, L, U15S3K.pr); }
// ---- 15-4 電位 の図（※ textbook/gen/make_section.py が textbook/gen/data/u15_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U15S4K = {
  pot: {"vars":[],"items":[{"f":"c","id":"qc","cx":200,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[171.5,391.5],[228.5,391.5],[228.5,448.5],[171.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":200,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[200,360,"middle",[0,-1]],[200,480,"middle",[0,1]],[242,380,"start",[1,-1]]],"need":"q","vis":[],"t":"F","x":200,"y":360,"anc":"middle"},{"f":"c","id":"pad","cx":440,"cy":420,"r":8,"fill":"k","need":"pa","vis":[],"t":"F"},{"f":"lb","id":"pat","k":"pa","bases":[[440,460,"middle",[0,1]],[440,380,"middle",[0,-1]]],"need":"pa","vis":[],"t":"F","x":440,"y":460,"anc":"middle"},{"f":"c","id":"pbd","cx":660,"cy":420,"r":8,"fill":"k","need":"pb","vis":[],"t":"F"},{"f":"lb","id":"pbt","k":"pb","bases":[[660,380,"middle",[0,-1]],[660,460,"middle",[0,1]]],"need":"pb","vis":[],"t":"F","x":660,"y":380,"anc":"middle"},{"f":"lb","id":"inft","k":"inf","bases":[[900,420,"middle",[0,-1]]],"need":"inf","vis":[],"t":"F","x":900,"y":420,"anc":"middle"},{"f":"ar","id":"wa","x0":870,"y0":270,"x1":450,"y1":270,"o":["wad"],"need":"wa","vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[670,238,"middle",[0,-1]]],"o":["wad"],"need":"wa","vis":[],"t":"F","x":670,"y":238,"anc":"middle"},{"f":"ar","id":"wb","x0":870,"y0":200,"x1":670,"y1":200,"o":["wbd"],"need":"wb","vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[780,168,"middle",[0,-1]]],"o":["wbd"],"need":"wb","vis":[],"t":"F","x":780,"y":168,"anc":"middle"},{"f":"ar","id":"wba","x0":650,"y0":270,"x1":450,"y1":270,"o":["wbad"],"need":"wba","vis":[],"t":"F"},{"f":"lb","id":"wbat","k":"wba","bases":[[550,238,"middle",[0,-1]]],"o":["wbad"],"need":"wba","vis":[],"t":"F","x":550,"y":238,"anc":"middle"},{"f":"c","id":"tc","cx":840,"cy":364,"r":18,"fill":"w","sk":"ts","o":["td"],"need":"t","sel":"t0","var":{"":{"cx":840,"mv":[["tx",-400,0]]},"B":{"cx":660,"mv":[["tx",-220,0]]}},"dflt":"","vis":[],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[840,318,"middle",[0,-1]]],"vbases":{"":[[840,318,"middle",[0,-1]]],"B":[[660,318,"middle",[0,-1]]]},"o":["td"],"need":"t","sel":"t0","var":{"":{"mv":[["tx",-400,0]],"x":840,"y":318,"anc":"middle"},"B":{"mv":[["tx",-220,0]],"x":660,"y":318,"anc":"middle"}},"dflt":"","vis":[],"t":"F","x":840,"y":318,"anc":"middle"},{"f":"ln","id":"ae1","pts":[[200,506],[200,574]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ln","id":"ae2","pts":[[440,506],[440,574]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ar","id":"ad","x0":200,"y0":560,"x1":440,"y1":560,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[320,600,"middle",[0,1]],[320,520,"middle",[0,-1]]],"need":"a","vis":[],"t":"F","x":320,"y":600,"anc":"middle"},{"f":"ln","id":"be1","pts":[[200,506],[200,654]],"w":2,"need":"b","vis":[],"t":"F"},{"f":"ln","id":"be2","pts":[[660,506],[660,654]],"w":2,"need":"b","vis":[],"t":"F"},{"f":"ar","id":"bd","x0":200,"y0":640,"x1":660,"y1":640,"two":1,"w":2,"need":"b","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[430,680,"middle",[0,1]],[430,600,"middle",[0,-1]]],"need":"b","vis":[],"t":"F","x":430,"y":680,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU15s4pot(d, p, L){ tbFig_Draw(d, p, L, U15S4K.pot); }
// ---- 15-5 電位差と仕事 の図（※ textbook/gen/make_section.py が textbook/gen/data/u15_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U15S5K = {
  pot: {"vars":[],"items":[{"f":"c","id":"qc","cx":200,"cy":420,"r":30,"fill":"w","sk":"qs","sel":"qs","var":{"":{},"+":{},"-":{},"−":{}},"vis":[],"t":"F"},{"f":"ln","id":"qm","pts":[[171.5,391.5],[228.5,391.5],[228.5,448.5],[171.5,448.5]],"w":3,"close":1,"sel":"qs","var":{"N":{"fill":"n","col":"#c92a2a"},"S":{"fill":"s","col":"#1971c2"}},"vis":[],"t":"F"},{"f":"tx","id":"qmt","x":200,"y":421,"s":"N","anc":"middle","size":33,"sel":"qs","var":{"N":{"s":"N"},"S":{"s":"S"}},"vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[200,360,"middle",[0,-1]],[200,480,"middle",[0,1]],[242,380,"start",[1,-1]]],"need":"q","vis":[],"t":"F","x":200,"y":360,"anc":"middle"},{"f":"c","id":"pad","cx":440,"cy":420,"r":8,"fill":"k","need":"pa","vis":[],"t":"F"},{"f":"lb","id":"pat","k":"pa","bases":[[440,460,"middle",[0,1]],[440,380,"middle",[0,-1]]],"need":"pa","vis":[],"t":"F","x":440,"y":460,"anc":"middle"},{"f":"c","id":"pbd","cx":660,"cy":420,"r":8,"fill":"k","need":"pb","vis":[],"t":"F"},{"f":"lb","id":"pbt","k":"pb","bases":[[660,380,"middle",[0,-1]],[660,460,"middle",[0,1]]],"need":"pb","vis":[],"t":"F","x":660,"y":320,"anc":"middle"},{"f":"lb","id":"inft","k":"inf","bases":[[900,420,"middle",[0,-1]]],"need":"inf","vis":[],"t":"F","x":900,"y":420,"anc":"middle"},{"f":"ar","id":"wa","x0":870,"y0":270,"x1":450,"y1":270,"o":["wad"],"need":"wa","vis":[],"t":"F"},{"f":"lb","id":"wat","k":"wa","bases":[[670,238,"middle",[0,-1]]],"o":["wad"],"need":"wa","vis":[],"t":"F","x":670,"y":238,"anc":"middle"},{"f":"ar","id":"wb","x0":870,"y0":200,"x1":670,"y1":200,"o":["wbd"],"need":"wb","vis":[],"t":"F"},{"f":"lb","id":"wbt","k":"wb","bases":[[780,168,"middle",[0,-1]]],"o":["wbd"],"need":"wb","vis":[],"t":"F","x":780,"y":168,"anc":"middle"},{"f":"ar","id":"wba","x0":650,"y0":270,"x1":450,"y1":270,"o":["wbad"],"need":"wba","vis":[],"t":"F"},{"f":"lb","id":"wbat","k":"wba","bases":[[550,238,"middle",[0,-1]]],"o":["wbad"],"need":"wba","vis":[],"t":"F","x":550,"y":238,"anc":"middle"},{"f":"c","id":"tc","cx":840,"cy":364,"r":18,"fill":"w","sk":"ts","o":["td"],"need":"t","sel":"t0","var":{"":{"cx":840,"mv":[["tx",-400,0]]},"B":{"cx":660,"mv":[["tx",-220,0]]}},"dflt":"","vis":[],"t":"F"},{"f":"lb","id":"tt","k":"t","bases":[[840,318,"middle",[0,-1]]],"vbases":{"":[[840,318,"middle",[0,-1]]],"B":[[660,318,"middle",[0,-1]]]},"o":["td"],"need":"t","sel":"t0","var":{"":{"mv":[["tx",-400,0]],"x":848,"y":318,"anc":"middle"},"B":{"mv":[["tx",-220,0]],"x":660,"y":238,"anc":"middle"}},"dflt":"","vis":[],"t":"F","x":840,"y":318,"anc":"middle"},{"f":"ln","id":"ae1","pts":[[200,506],[200,574]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ln","id":"ae2","pts":[[440,506],[440,574]],"w":2,"need":"a","vis":[],"t":"F"},{"f":"ar","id":"ad","x0":200,"y0":560,"x1":440,"y1":560,"two":1,"w":2,"need":"a","vis":[],"t":"F"},{"f":"lb","id":"at","k":"a","bases":[[320,600,"middle",[0,1]],[320,520,"middle",[0,-1]]],"need":"a","vis":[],"t":"F","x":320,"y":600,"anc":"middle"},{"f":"ln","id":"be1","pts":[[200,506],[200,654]],"w":2,"need":"b","vis":[],"t":"F"},{"f":"ln","id":"be2","pts":[[660,506],[660,654]],"w":2,"need":"b","vis":[],"t":"F"},{"f":"ar","id":"bd","x0":200,"y0":640,"x1":660,"y1":640,"two":1,"w":2,"need":"b","vis":[],"t":"F"},{"f":"lb","id":"bt","k":"b","bases":[[430,680,"middle",[0,1]],[430,600,"middle",[0,-1]]],"need":"b","vis":[],"t":"F","x":430,"y":680,"anc":"middle"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU15s5pot(d, p, L){ tbFig_Draw(d, p, L, U15S5K.pot); }
// ---- 15-6 平行な極板の間の電界 の図（※ textbook/gen/make_section.py が textbook/gen/data/u15_s6.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U15S6K = {
  pl: {"vars":[],"items":[{"f":"ln","id":"medf","pts":[[300,305],[800,305],[800,555],[300,555]],"w":1,"fill":"med","close":1,"o":["medd"],"need":"med","vis":[],"t":"F"},{"f":"lb","id":"medt","k":"med","bases":[[550,430,"middle",[0,-1]],[314,335,"start",[0,-1]]],"o":["medd"],"need":"med","vis":[],"t":"F","x":550,"y":430,"anc":"middle"},{"f":"ln","id":"zt","pts":[[300,300],[800,300]],"w":18,"noobs":1,"need":"v","col":"#ffa8a8","vis":[],"t":"F"},{"f":"ln","id":"zb","pts":[[300,560],[800,560]],"w":18,"noobs":1,"mv":[["dz",0,-130]],"need":"v","col":"#ced4da","vis":[],"t":"F"},{"f":"ln","id":"top","pts":[[300,300],[800,300]],"w":8,"vis":[],"t":"F"},{"f":"ln","id":"bot","pts":[[300,560],[800,560]],"w":8,"mv":[["dz",0,-130]],"vis":[],"t":"F"},{"f":"lb","id":"topt","k":"top","bases":[[280,300,"end",[-1,0]],[300,266,"start",[0,-1]]],"need":"top","vis":[],"t":"F","x":280,"y":356,"anc":"end"},{"f":"lb","id":"bott","k":"bot","bases":[[280,560,"end",[-1,0]],[300,594,"start",[0,1]]],"mv":[["dz",0,-130]],"need":"bot","vis":[],"t":"F","x":280,"y":504,"anc":"end"},{"f":"ln","id":"de1","pts":[[816,300],[904,300]],"w":2,"need":"d","vis":[],"t":"F"},{"f":"ln","id":"de2","pts":[[816,560],[904,560]],"w":2,"mv":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"ar","id":"dd","x0":890,"y0":300,"x1":890,"y1":560,"two":1,"w":2,"mve":[["dz",0,-130]],"need":"d","vis":[],"t":"F"},{"f":"lb","id":"dt","k":"d","bases":[[906,430,"start",[1,0]],[874,430,"end",[-1,0]]],"mv":[["dz",0,-65]],"need":"d","vis":[],"t":"F","x":912,"y":430,"anc":"start"},{"f":"ar","id":"va","x0":160,"y0":560,"x1":160,"y1":300,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve1","pts":[[294,560],[148,560]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"ln","id":"ve2","pts":[[294,300],[148,300]],"w":2,"need":"v","vis":[],"t":"F"},{"f":"lb","id":"vt","k":"v","bases":[[128,430,"end",[-1,0]],[180,430,"start",[1,0]]],"need":"v","vis":[],"t":"F","x":128,"y":430,"anc":"end"},{"f":"ln","id":"se1","pts":[[300,288],[300,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ln","id":"se2","pts":[[800,288],[800,216]],"w":2,"need":"s","vis":[],"t":"F"},{"f":"ar","id":"sd","x0":300,"y0":230,"x1":800,"y1":230,"two":1,"w":2,"need":"s","vis":[],"t":"F"},{"f":"lb","id":"st","k":"s","bases":[[550,190,"middle",[0,-1]],[550,270,"middle",[0,1]]],"need":"s","vis":[],"t":"F","x":550,"y":190,"anc":"middle"},{"f":"lb","id":"capt","k":"c","bases":[[280,430,"end",[-1,0]],[280,340,"end",[-1,0]]],"need":"c","vis":[],"t":"F","x":280,"y":430,"anc":"end"},{"f":"ar","id":"e0","x0":350,"y0":326,"x1":350,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e1","x0":450,"y0":326,"x1":450,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e2","x0":550,"y0":326,"x1":550,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e3","x0":650,"y0":326,"x1":650,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"ar","id":"e4","x0":750,"y0":326,"x1":750,"y1":534,"o":["ed"],"need":"e","vis":[],"t":"F"},{"f":"lb","id":"et","k":"e","bases":[[768,430,"start",[1,0]],[550,604,"middle",[0,1]],[550,256,"middle",[0,-1]]],"o":["ed"],"need":"e","vis":[],"t":"F","x":550,"y":610,"anc":"middle"},{"f":"c","id":"qc","cx":600,"cy":404,"r":16,"fill":"w","sk":"qs","o":["qd"],"need":"q","vis":[],"t":"F"},{"f":"lb","id":"qt","k":"q","bases":[[600,364,"middle",[0,-1]],[626,380,"start",[1,-1]]],"o":["qd"],"need":"q","vis":[],"t":"F","x":600,"y":178,"anc":"middle"},{"f":"ar","id":"fa","x0":600,"y0":426,"x1":600,"y1":516,"need":"f","sel":"fa","var":{"down":{"x0":600,"y0":426,"x1":600,"y1":516},"up":{"x0":600,"y0":382,"x1":600,"y1":292}},"dflt":"down","gr":"fd","col":"#c2255c","vis":[],"t":"F"},{"f":"lb","id":"ft","k":"f","bases":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"vbases":{"down":[[618,471,"start",[1,0]],[582,471,"end",[-1,0]],[600,550,"middle",[0,1]]],"up":[[618,337,"start",[1,0]],[582,337,"end",[-1,0]],[600,258,"middle",[0,-1]]]},"o":["fd"],"need":"f","sel":"fa","var":{"down":{"x":618,"y":479,"anc":"start"},"up":{"x":678,"y":353,"anc":"start"}},"dflt":"down","vis":[],"t":"F","x":618,"y":471,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU15s6pl(d, p, L){ tbFig_Draw(d, p, L, U15S6K.pl); }
var KINDS = {u15s1pe: tbU15s1pe, u15s2pe: tbU15s2pe, u15s3pr: tbU15s3pr, u15s4pot: tbU15s4pot, u15s5pot: tbU15s5pot, u15s6pl: tbU15s6pl};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 15-1 の図は電流が流れないので載せない,
  // 15-2 の図は電流が流れないので載せない,
  // 15-3 の図は電流が流れないので載せない,
  // 15-4 の図は電流が流れないので載せない,
  // 15-5 の図は電流が流れないので載せない,
  // 15-6 の図は電流が流れないので載せない
};

// 15-1 電界の強さ の練習（※ textbook/gen/make_section.py が textbook/gen/data/u15_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU15s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU15s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU15s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU15s1_par(a, b){ return a * b / (a + b); }
function tbU15s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU15s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU15s1_Qe(r){
  var gcd = tbU15s1_gcd, ratio = tbU15s1_ratio, par = tbU15s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [1,2,3,4,5,6,8,9,10,12,16,18,20]);
    var d = pick(r, [2,3,4,5,6]);
    var E = (9 * q / (d * d));
    var A = (9 * q / d);
    var B = (q / (d * d));
    var C = (9 * q);
    if (!(Number.isInteger(E) && nice(A) && nice(B) && E >= 1 && distinct([E, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(E) + " \\times 10^9\\,\\mathrm{N/C}$", v: fmt(E)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N/C}$", v: fmt(A), why: "距離を2乗していない"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N/C}$", v: fmt(B), why: "$9$ を掛けていない"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N/C}$", v: fmt(C), why: "距離の2乗で割っていない"}]);
    return {form: "u15s1e", text: "真空中に $Q = " + fmt(q) + "\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $" + fmt(d) + "\\,\\mathrm{m}$ 離れた点 P の電界の強さは何 N/C か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u15s1pe", L: tbU15s1_fig({"q":"{Q}","qs":"+","p":"P","r":"{r}"}, [["q", "{Q}=" + fmt(q) + " C"], ["r", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = 9 \\times 10^9 \\times \\dfrac{Q}{r^2}$", "$E = 9 \\times 10^9 \\times \\dfrac{" + fmt(q) + "}{" + fmt(d) + "^2} = " + fmt(E) + " \\times 10^9\\,\\mathrm{N/C}$"], chk: {form: "u15s1e", p: {q: q, d: d}}};
  }
  throw new Error("u15s1e：条件に合う数字が見つからない");
}
function tbU15s1_Qdef(r){
  var gcd = tbU15s1_gcd, ratio = tbU15s1_ratio, par = tbU15s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "+1 C", v: "own"}, {t: "+9 C", v: "9", why: "電界の強さは 1 C あたりの力"}, {t: "+1 N", v: "n", why: "N は力の単位。電荷の単位は C"}, {t: "+1 m", v: "m", why: "m は距離の単位。電荷の単位は C"}]);
    return {form: "u15s1def", text: "ある点の電界の強さとは、その点に置いた □ の電荷に働くクーロン力の大きさである。", fig: {kind: "u15s1pe", L: tbU15s1_fig({"q":"{Q}","qs":"+","p":"P","r":"{r}"}, [["t", "+1 C"], ["ts", "+"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電界の強さは、+1 C あたりのクーロン力の大きさ"], chk: {form: "u15s1def", p: {}}};
  }
  throw new Error("u15s1def：条件に合う数字が見つからない");
}
function tbU15s1_Qunit(r){
  var gcd = tbU15s1_gcd, ratio = tbU15s1_ratio, par = tbU15s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mathrm{N/C}$", v: "own"}, {t: "$\\mathrm{N}$", v: "n", why: "N は力の単位。電界の強さは 1 C あたりの力"}, {t: "$\\mathrm{C}$", v: "c", why: "C は電荷の単位"}, {t: "$\\mathrm{C/N}$", v: "cn", why: "1 C あたりの力なので、N を C で割る"}]);
    return {form: "u15s1unit", text: "電界の強さの単位は □ である。", fig: {kind: "u15s1pe", L: tbU15s1_fig({"q":"{Q}","qs":"+","p":"P","r":"{r}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["1 C あたりの力なので N/C（V/m とも書く）"], chk: {form: "u15s1unit", p: {}}};
  }
  throw new Error("u15s1unit：条件に合う数字が見つからない");
}
// 15-2 電界の中の力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u15_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU15s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU15s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU15s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU15s2_par(a, b){ return a * b / (a + b); }
function tbU15s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU15s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU15s2_Qf(r){
  var gcd = tbU15s2_gcd, ratio = tbU15s2_ratio, par = tbU15s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,50]);
    var q = pick(r, [2,3,4,5,6,8,10]);
    var F = (q * e);
    var A = (q + e);
    var B = (e / q);
    var C = (e);
    if (!(nice(B) && distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + "\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "電界の強さと電荷を足した"}, {t: "$" + fmt(B) + "\\,\\mathrm{N}$", v: fmt(B), why: "電界の強さを電荷で割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "電荷を掛けていない（1 C あたりの力のまま）"}]);
    return {form: "u15s2f", text: "電界の強さが $" + fmt(e) + "\\,\\mathrm{N/C}$ の点に、$" + fmt(q) + "\\,\\mathrm{C}$ の電荷を置いた。電荷に働く力の大きさは何 N か。", fig: {kind: "u15s2pe", L: tbU15s2_fig({"q":"{Q}","qs":"+","p":"P","r":null,"e":"{E}","ea":"out","t":"{q}","ts":"+","f":"{F}","fa":"out"}, [["e", "{E}=" + fmt(e) + " N/C"], ["t", "{q}=" + fmt(q) + " C"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = qE$", "$F = " + fmt(q) + " \\times " + fmt(e) + " = " + fmt(F) + "\\,\\mathrm{N}$"], chk: {form: "u15s2f", p: {q: q, e: e}}};
  }
  throw new Error("u15s2f：条件に合う数字が見つからない");
}
function tbU15s2_Qe(r){
  var gcd = tbU15s2_gcd, ratio = tbU15s2_ratio, par = tbU15s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [2,3,4,5,6,8,10,12,15,20,25]);
    var q = pick(r, [2,3,4,5,6,8,10]);
    var F = (q * e);
    var A = (F * q);
    var B = (F - q);
    var C = (F);
    if (!(distinct([e, A, B, C]) && B > 0)) continue;
    var _c = choices(r, [{t: "$" + fmt(e) + "\\,\\mathrm{N/C}$", v: fmt(e)}, {t: "$" + fmt(A) + "\\,\\mathrm{N/C}$", v: fmt(A), why: "力に電荷を掛けた（割る）"}, {t: "$" + fmt(B) + "\\,\\mathrm{N/C}$", v: fmt(B), why: "力から電荷を引いた"}, {t: "$" + fmt(C) + "\\,\\mathrm{N/C}$", v: fmt(C), why: "力をそのまま答えた（1 C あたりにしていない）"}]);
    return {form: "u15s2e", text: "ある点に $" + fmt(q) + "\\,\\mathrm{C}$ の電荷を置くと、$" + fmt(F) + "\\,\\mathrm{N}$ の力が働いた。この点の電界の強さは何 N/C か。", fig: {kind: "u15s2pe", L: tbU15s2_fig({"q":"{Q}","qs":"+","p":"P","r":null,"e":"{E}","ea":"out","t":"{q}","ts":"+","f":"{F}","fa":"out"}, [["t", "{q}=" + fmt(q) + " C"], ["f", "{F}=" + fmt(F) + " N"], ["e", "{E}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = qE$ より $E = \\dfrac{F}{q}$", "$E = \\dfrac{" + fmt(F) + "}{" + fmt(q) + "} = " + fmt(e) + "\\,\\mathrm{N/C}$"], chk: {form: "u15s2e", p: {ff: F, q: q}}};
  }
  throw new Error("u15s2e：条件に合う数字が見つからない");
}
function tbU15s2_Qq(r){
  var gcd = tbU15s2_gcd, ratio = tbU15s2_ratio, par = tbU15s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [2,3,4,5,6,8,10,12,15,20]);
    var q = pick(r, [2,3,4,5,6,8,10]);
    var F = (q * e);
    var A = (F * e);
    var B = (F - e);
    var C = (e);
    if (!(distinct([q, A, B, C]) && B > 0)) continue;
    var _c = choices(r, [{t: "$" + fmt(q) + "\\,\\mathrm{C}$", v: fmt(q)}, {t: "$" + fmt(A) + "\\,\\mathrm{C}$", v: fmt(A), why: "力に電界の強さを掛けた（割る）"}, {t: "$" + fmt(B) + "\\,\\mathrm{C}$", v: fmt(B), why: "力から電界の強さを引いた"}, {t: "$" + fmt(C) + "\\,\\mathrm{C}$", v: fmt(C), why: "電界の強さをそのまま答えた"}]);
    return {form: "u15s2q", text: "電界の強さが $" + fmt(e) + "\\,\\mathrm{N/C}$ の点に電荷を置くと、$" + fmt(F) + "\\,\\mathrm{N}$ の力が働いた。電荷は何 C か。", fig: {kind: "u15s2pe", L: tbU15s2_fig({"q":"{Q}","qs":"+","p":"P","r":null,"e":"{E}","ea":"out","t":"{q}","ts":"+","f":"{F}","fa":"out"}, [["e", "{E}=" + fmt(e) + " N/C"], ["f", "{F}=" + fmt(F) + " N"], ["t", "{q}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$F = qE$ より $q = \\dfrac{F}{E}$", "$q = \\dfrac{" + fmt(F) + "}{" + fmt(e) + "} = " + fmt(q) + "\\,\\mathrm{C}$"], chk: {form: "u15s2q", p: {ff: F, ee: e}}};
  }
  throw new Error("u15s2q：条件に合う数字が見つからない");
}
// 15-3 誘電率 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u15_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU15s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU15s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU15s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU15s3_par(a, b){ return a * b / (a + b); }
function tbU15s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU15s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU15s3_Qratio(r){
  var gcd = tbU15s3_gcd, ratio = tbU15s3_ratio, par = tbU15s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5,8,10,80]);
    var er2 = (er * er);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(er) + "}$ 倍", v: "1/" + fmt(er)}, {t: "$" + fmt(er) + "$ 倍", v: fmt(er), why: "誘電率は分母にあるので、力は弱まる"}, {t: "$\\dfrac{1}{" + fmt(er2) + "}$ 倍", v: "1/" + fmt(er2), why: "比誘電率を2乗した（2乗するのは距離）"}, {t: "$1$ 倍（変わらない）", v: "1", why: "まわりの物質で力は変わる"}]);
    return {form: "u15s3ratio", text: "2つの点電荷のまわりを、真空中から比誘電率 " + fmt(er) + " の物質に変えた。距離が同じとき、働く力の大きさは元の何倍になるか。", fig: {kind: "u15s3pr", L: tbU15s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{ε}_r=" + fmt(er)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["誘電率は $\\varepsilon = \\varepsilon_0 \\varepsilon_r$ で、真空中の " + fmt(er) + " 倍", "分母が " + fmt(er) + " 倍なので、力は $\\dfrac{1}{" + fmt(er) + "}$ 倍"], chk: {form: "u15s3ratio", p: {er: er}}};
  }
  throw new Error("u15s3ratio：条件に合う数字が見つからない");
}
function tbU15s3_Qval(r){
  var gcd = tbU15s3_gcd, ratio = tbU15s3_ratio, par = tbU15s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var er = pick(r, [2,3,4,5]);
    var k = pick(r, [1,2,3,4,5,6,8,9]);
    var F0 = (k * er * er);
    var ok2 = (k * er);
    var A = (k * er * er * er);
    var B = (k);
    var C = (k * er * er);
    if (!(distinct([ok2, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(ok2) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(ok2)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(A), why: "誘電率は分母にあるので、力は弱まる"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(B), why: "比誘電率を2乗した"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{N}$", v: fmt(C), why: "まわりの物質で力は変わる"}]);
    return {form: "u15s3val", text: "真空中で 2つの点電荷の間に $" + fmt(F0) + " \\times 10^9\\,\\mathrm{N}$ の力が働いていた。距離を変えずに、まわりを比誘電率 " + fmt(er) + " の物質にした。働く力の大きさは何 N になるか。", fig: {kind: "u15s3pr", L: tbU15s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{ε}_r=" + fmt(er)], ["f1", "{F}"], ["f2", "{F}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["比誘電率 " + fmt(er) + " の物質の中では、力は $\\dfrac{1}{" + fmt(er) + "}$ 倍", "$" + fmt(F0) + " \\times 10^9 \\times \\dfrac{1}{" + fmt(er) + "} = " + fmt(ok2) + " \\times 10^9\\,\\mathrm{N}$"], chk: {form: "u15s3val", p: {k: k, er: er}}};
  }
  throw new Error("u15s3val：条件に合う数字が見つからない");
}
function tbU15s3_Qeps(r){
  var gcd = tbU15s3_gcd, ratio = tbU15s3_ratio, par = tbU15s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\varepsilon_0 \\varepsilon_r$", v: "own"}, {t: "$\\dfrac{\\varepsilon_0}{\\varepsilon_r}$", v: "div", why: "比誘電率は真空中の何倍かを表すので、掛ける"}, {t: "$\\varepsilon_0 + \\varepsilon_r$", v: "sum", why: "足すのでなく、掛ける"}, {t: "$\\dfrac{\\varepsilon_r}{\\varepsilon_0}$", v: "inv", why: "比誘電率は真空中の何倍かを表すので、$\\varepsilon_0$ に掛ける"}]);
    return {form: "u15s3eps", text: "比誘電率 $\\varepsilon_r$ の物質の誘電率 $\\varepsilon$ は □ である。ただし真空中の誘電率を $\\varepsilon_0$ とする。", fig: {kind: "u15s3pr", L: tbU15s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", "{ε}_r"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["比誘電率は、真空中の誘電率の何倍かを表す", "$\\varepsilon = \\varepsilon_0 \\varepsilon_r$"], chk: {form: "u15s3eps", p: {}}};
  }
  throw new Error("u15s3eps：条件に合う数字が見つからない");
}
function tbU15s3_Qvac(r){
  var gcd = tbU15s3_gcd, ratio = tbU15s3_ratio, par = tbU15s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$1$", v: "own"}, {t: "$0$", v: "0", why: "比誘電率は真空中の何倍かなので、真空中は 1 倍"}, {t: "$80$", v: "80", why: "80 は 20℃の水の比誘電率"}, {t: "$9 \\times 10^9$", v: "9e9", why: "$9 \\times 10^9$ は $\\dfrac{1}{4 \\pi \\varepsilon_0}$ の値"}]);
    return {form: "u15s3vac", text: "真空中の比誘電率は □ である。", fig: {kind: "u15s3pr", L: tbU15s3_fig({"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out"}, [["med", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["比誘電率は真空中の誘電率の何倍かを表すので、真空中は 1"], chk: {form: "u15s3vac", p: {}}};
  }
  throw new Error("u15s3vac：条件に合う数字が見つからない");
}
// 15-4 電位 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u15_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU15s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU15s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU15s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU15s4_par(a, b){ return a * b / (a + b); }
function tbU15s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU15s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU15s4_Qv(r){
  var gcd = tbU15s4_gcd, ratio = tbU15s4_ratio, par = tbU15s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [1,2,3,4,5,6,8,9,10,12,15,16,18,20]);
    var d = pick(r, [2,3,4,5,6]);
    var V = (9 * q / d);
    var A = (9 * q / (d * d));
    var B = (q / d);
    var C = (9 * q * d);
    if (!(Number.isInteger(V) && nice(A) && nice(B) && V >= 1 && distinct([V, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(V) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(V)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(A), why: "距離を2乗した（2乗するのは電界の強さ）"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(B), why: "$9$ を掛けていない"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(C), why: "距離で割らずに掛けた"}]);
    return {form: "u15s4v", text: "真空中に $Q = " + fmt(q) + "\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $" + fmt(d) + "\\,\\mathrm{m}$ 離れた点 A の電位は何 V か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u15s4pot", L: tbU15s4_fig({"q":"{Q}","qs":"+","pa":"A","a":"{r}","inf":"∞"}, [["q", "{Q}=" + fmt(q) + " C"], ["a", "{r}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V = 9 \\times 10^9 \\times \\dfrac{Q}{r}$（$r$ は1乗）", "$V = 9 \\times 10^9 \\times \\dfrac{" + fmt(q) + "}{" + fmt(d) + "} = " + fmt(V) + " \\times 10^9\\,\\mathrm{V}$"], chk: {form: "u15s4v", p: {q: q, d: d}}};
  }
  throw new Error("u15s4v：条件に合う数字が見つからない");
}
function tbU15s4_Qfar(r){
  var gcd = tbU15s4_gcd, ratio = tbU15s4_ratio, par = tbU15s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var n = pick(r, [2,3,4,5]);
    var n2 = (n * n);
    var _c = choices(r, [{t: "$\\dfrac{1}{" + fmt(n) + "}$ 倍", v: "1/" + fmt(n)}, {t: "$\\dfrac{1}{" + fmt(n2) + "}$ 倍", v: "1/" + fmt(n2), why: "電位の式の $r$ は1乗（2乗は電界の強さ）"}, {t: "$" + fmt(n) + "$ 倍", v: fmt(n), why: "遠いほど電位は小さい"}, {t: "$" + fmt(n2) + "$ 倍", v: fmt(n2), why: "遠いほど電位は小さい"}]);
    return {form: "u15s4far", text: "点電荷から点 A までの距離を、" + fmt(n) + " 倍にした。点 A の電位は元の何倍になるか。", fig: {kind: "u15s4pot", L: tbU15s4_fig({"q":"{Q}","qs":"+","pa":"A","a":"{r}","inf":"∞"}, [["a", fmt(n) + "{r}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電位は $V = 9 \\times 10^9 \\times \\dfrac{Q}{r}$ で、$r$ の1乗に反比例する", "距離 " + fmt(n) + " 倍で、電位は $\\dfrac{1}{" + fmt(n) + "}$ 倍"], chk: {form: "u15s4far", p: {n: n}}};
  }
  throw new Error("u15s4far：条件に合う数字が見つからない");
}
function tbU15s4_Qdef(r){
  var gcd = tbU15s4_gcd, ratio = tbU15s4_ratio, par = tbU15s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "+1 C の電荷", v: "own"}, {t: "+1 N の力", v: "n", why: "運ぶのは電荷。N は力の単位"}, {t: "点電荷 $Q$", v: "q", why: "運ぶのは +1 C の電荷。$Q$ は電位をつくる電荷"}, {t: "+9 C の電荷", v: "9", why: "電位は 1 C あたりのエネルギー"}]);
    return {form: "u15s4def", text: "ある点の電位とは、無限に離れた所を 0 V として、そこから □ をその点まで運ぶのに要るエネルギーである。", fig: {kind: "u15s4pot", L: tbU15s4_fig({"q":"{Q}","qs":"+","pa":"A","a":"{r}","inf":"∞"}, [["t", "+1 C"], ["ts", "+"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電位は、無限に遠い所から +1 C を運ぶのに要るエネルギー（1 C が持つ位置エネルギー）"], chk: {form: "u15s4def", p: {}}};
  }
  throw new Error("u15s4def：条件に合う数字が見つからない");
}
function tbU15s4_Qeq(r){
  var gcd = tbU15s4_gcd, ratio = tbU15s4_ratio, par = tbU15s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$V = \\dfrac{Q}{4 \\pi \\varepsilon_0 r}$", v: "own"}, {t: "$V = \\dfrac{Q}{4 \\pi \\varepsilon_0 r^2}$", v: "r2", why: "$r$ が2乗なのは電界の強さ。電位は1乗"}, {t: "$V = \\dfrac{4 \\pi \\varepsilon_0 Q}{r}$", v: "inv", why: "$4 \\pi \\varepsilon_0$ は分母にある"}, {t: "$V = \\dfrac{Q r}{4 \\pi \\varepsilon_0}$", v: "mul", why: "$r$ は分母にある（遠いほど電位は小さい）"}]);
    return {form: "u15s4eq", text: "真空中で、点電荷 $Q$［C］から $r$［m］離れた点の電位 $V$［V］を表す式は □ である。", fig: {kind: "u15s4pot", L: tbU15s4_fig({"q":"{Q}","qs":"+","pa":"A","a":"{r}","inf":"∞"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電位の式は、電界の強さの式と違い $r$ が1乗", "$V = \\dfrac{Q}{4 \\pi \\varepsilon_0 r}$"], chk: {form: "u15s4eq", p: {}}};
  }
  throw new Error("u15s4eq：条件に合う数字が見つからない");
}
// 15-5 電位差と仕事 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u15_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU15s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU15s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU15s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU15s5_par(a, b){ return a * b / (a + b); }
function tbU15s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU15s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU15s5_Qw(r){
  var gcd = tbU15s5_gcd, ratio = tbU15s5_ratio, par = tbU15s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var v = pick(r, [10,12,15,20,24,30,40,50,60,100]);
    var q = pick(r, [2,3,4,5,6,8,10]);
    var W = (q * v);
    var A = (v / q);
    var B = (q + v);
    var C = (v);
    if (!(nice(A) && distinct([W, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(W) + "\\,\\mathrm{J}$", v: fmt(W)}, {t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A), why: "電位を電荷で割った"}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "電位と電荷を足した"}, {t: "$" + fmt(C) + "\\,\\mathrm{J}$", v: fmt(C), why: "電荷を掛けていない（1 C あたりのまま）"}]);
    return {form: "u15s5w", text: "電位が $" + fmt(v) + "\\,\\mathrm{V}$ の点にある $" + fmt(q) + "\\,\\mathrm{C}$ の電荷が持つエネルギーは何 J か。", fig: {kind: "u15s5pot", L: tbU15s5_fig({"q":"{Q}","qs":"+","pa":"A","pb":"B","a":"{a}","b":"{b}","inf":"∞"}, [["pa", "A " + fmt(v) + " V"], ["t", "{q}=" + fmt(q) + " C"], ["ts", "+"], ["t0", "A"], ["a", null], ["pb", null], ["b", null]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電位は 1 C あたりのエネルギー　$W = qV$", "$W = " + fmt(q) + " \\times " + fmt(v) + " = " + fmt(W) + "\\,\\mathrm{J}$"], chk: {form: "u15s5w", p: {q: q, v: v}}};
  }
  throw new Error("u15s5w：条件に合う数字が見つからない");
}
function tbU15s5_Qdv(r){
  var gcd = tbU15s5_gcd, ratio = tbU15s5_ratio, par = tbU15s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [1,2,3,4,5,6,8,10,12]);
    var a = pick(r, [1,2,3,4]);
    var b = pick(r, [2,3,4,5,6]);
    var VA = (9 * q / a);
    var VB = (9 * q / b);
    var D = (VA - VB);
    var A = (VA + VB);
    var B = (9 * q / (a * a) - 9 * q / (b * b));
    var C = (VA);
    if (!(a < b && Number.isInteger(VA) && Number.isInteger(VB) && nice(B) && D >= 1 && distinct([D, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(D) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(D)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(A), why: "2つの電位を足した"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(B), why: "距離を2乗した（電位は1乗）"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{V}$", v: fmt(C), why: "A の電位だけで、B の電位を引いていない"}]);
    return {form: "u15s5dv", text: "真空中に $Q = " + fmt(q) + "\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $" + fmt(a) + "\\,\\mathrm{m}$ の点 A と、$" + fmt(b) + "\\,\\mathrm{m}$ の点 B の電位差は何 V か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u15s5pot", L: tbU15s5_fig({"q":"{Q}","qs":"+","pa":"A","pb":"B","a":"{a}","b":"{b}","inf":"∞"}, [["q", "{Q}=" + fmt(q) + " C"], ["a", "{a}=" + fmt(a) + " m"], ["b", "{b}=" + fmt(b) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_A = 9 \\times 10^9 \\times \\dfrac{" + fmt(q) + "}{" + fmt(a) + "} = " + fmt(VA) + " \\times 10^9\\,\\mathrm{V}$、$V_B = 9 \\times 10^9 \\times \\dfrac{" + fmt(q) + "}{" + fmt(b) + "} = " + fmt(VB) + " \\times 10^9\\,\\mathrm{V}$", "高い方から引く　$V_A - V_B = " + fmt(D) + " \\times 10^9\\,\\mathrm{V}$"], chk: {form: "u15s5dv", p: {q: q, a: a, b: b}}};
  }
  throw new Error("u15s5dv：条件に合う数字が見つからない");
}
function tbU15s5_Qwab(r){
  var gcd = tbU15s5_gcd, ratio = tbU15s5_ratio, par = tbU15s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [1,2,3,4,6,12]);
    var t = pick(r, [1,2,3,4,5]);
    var a = pick(r, [1,2,3]);
    var b = pick(r, [2,3,4,6]);
    var VA = (9 * q / a);
    var VB = (9 * q / b);
    var W = (t * (VA - VB));
    var A = (VA - VB);
    var B = (t * (VA + VB));
    var C = (t * VA);
    if (!(a < b && Number.isInteger(VA) && Number.isInteger(VB) && Number.isInteger(W) && W >= 1 && t >= 2 && distinct([W, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(W) + " \\times 10^9\\,\\mathrm{J}$", v: fmt(W)}, {t: "$" + fmt(A) + " \\times 10^9\\,\\mathrm{J}$", v: fmt(A), why: "電位差に電荷を掛けていない"}, {t: "$" + fmt(B) + " \\times 10^9\\,\\mathrm{J}$", v: fmt(B), why: "2つの電位を足した"}, {t: "$" + fmt(C) + " \\times 10^9\\,\\mathrm{J}$", v: fmt(C), why: "A の電位だけで、B の電位を引いていない"}]);
    return {form: "u15s5wab", text: "真空中に $Q = " + fmt(q) + "\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $" + fmt(b) + "\\,\\mathrm{m}$ の点 B にある $" + fmt(t) + "\\,\\mathrm{C}$ の電荷を、$Q$ から $" + fmt(a) + "\\,\\mathrm{m}$ の点 A まで運ぶ。要る仕事は何 J か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。", fig: {kind: "u15s5pot", L: tbU15s5_fig({"q":"{Q}","qs":"+","pa":"A","pb":"B","a":"{a}","b":"{b}","inf":"∞"}, [["q", "{Q}=" + fmt(q) + " C"], ["a", "{a}=" + fmt(a) + " m"], ["b", "{b}=" + fmt(b) + " m"], ["t", "{q}=" + fmt(t) + " C"], ["ts", "+"], ["t0", "B"], ["wba", "{W}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_A - V_B = 9 \\times 10^9 \\times \\dfrac{" + fmt(q) + "}{" + fmt(a) + "} - 9 \\times 10^9 \\times \\dfrac{" + fmt(q) + "}{" + fmt(b) + "} = " + fmt(VA - VB) + " \\times 10^9\\,\\mathrm{V}$", "$W = q(V_A - V_B) = " + fmt(t) + " \\times " + fmt(VA - VB) + " \\times 10^9 = " + fmt(W) + " \\times 10^9\\,\\mathrm{J}$"], chk: {form: "u15s5wab", p: {q: q, t: t, a: a, b: b}}};
  }
  throw new Error("u15s5wab：条件に合う数字が見つからない");
}
// 15-6 平行な極板の間の電界 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u15_s6.py から作った。手で直さない（データを直して作り直す）。）
function tbU15s6_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU15s6_ratio(a){ var g = a.reduce(function(x, y){ return tbU15s6_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU15s6_par(a, b){ return a * b / (a + b); }
function tbU15s6_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU15s6_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU15s6_Qe(r){
  var gcd = tbU15s6_gcd, ratio = tbU15s6_ratio, par = tbU15s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var v = pick(r, [10,20,30,50,60,100,120,200,300,500,600,1000]);
    var d = pick(r, [0.1,0.2,0.4,0.5,1]);
    var E = (v / d);
    var A = (v * d);
    var B = (d / v);
    var C = (v);
    if (!(nice(E) && nice(A) && nice(B) && B >= 0.001 && distinct([E, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(E) + "\\,\\mathrm{V/m}$", v: fmt(E)}, {t: "$" + fmt(A) + "\\,\\mathrm{V/m}$", v: fmt(A), why: "電圧に距離を掛けた"}, {t: "$" + fmt(B) + "\\,\\mathrm{V/m}$", v: fmt(B), why: "距離を電圧で割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{V/m}$", v: fmt(C), why: "距離で割っていない"}]);
    return {form: "u15s6e", text: "平行に向かい合わせた2枚の極板の間に $" + fmt(v) + "\\,\\mathrm{V}$ の電圧をかけた。極板の間の距離は $" + fmt(d) + "\\,\\mathrm{m}$ である。極板の間の電界の強さは何 V/m か。", fig: {kind: "u15s6pl", L: tbU15s6_fig({"top":"+","bot":"-","v":"{V}","d":"{d}","e":"{E}"}, [["v", "{V}=" + fmt(v) + " V"], ["d", "{d}=" + fmt(d) + " m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{V}{d}$", "$E = \\dfrac{" + fmt(v) + "}{" + fmt(d) + "} = " + fmt(E) + "\\,\\mathrm{V/m}$"], chk: {form: "u15s6e", p: {v: v, d: d}}};
  }
  throw new Error("u15s6e：条件に合う数字が見つからない");
}
function tbU15s6_Qv(r){
  var gcd = tbU15s6_gcd, ratio = tbU15s6_ratio, par = tbU15s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var e = pick(r, [10,20,50,100,200,400,500,1000]);
    var d = pick(r, [0.1,0.2,0.4,0.5,1]);
    var V = (e * d);
    var A = (e / d);
    var B = (d / e);
    var C = (e);
    if (!(nice(V) && nice(A) && nice(B) && V >= 1 && B >= 0.001 && distinct([V, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(V) + "\\,\\mathrm{V}$", v: fmt(V)}, {t: "$" + fmt(A) + "\\,\\mathrm{V}$", v: fmt(A), why: "電界の強さを距離で割った（掛ける）"}, {t: "$" + fmt(B) + "\\,\\mathrm{V}$", v: fmt(B), why: "距離を電界の強さで割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{V}$", v: fmt(C), why: "距離を掛けていない"}]);
    return {form: "u15s6v", text: "平行に向かい合わせた2枚の極板の間の電界の強さが $" + fmt(e) + "\\,\\mathrm{V/m}$、極板の間の距離が $" + fmt(d) + "\\,\\mathrm{m}$ である。極板の間の電圧は何 V か。", fig: {kind: "u15s6pl", L: tbU15s6_fig({"top":"+","bot":"-","v":"{V}","d":"{d}","e":"{E}"}, [["v", "{V}"], ["d", "{d}=" + fmt(d) + " m"], ["e", "{E}=" + fmt(e) + " V/m"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{V}{d}$ より $V = Ed$", "$V = " + fmt(e) + " \\times " + fmt(d) + " = " + fmt(V) + "\\,\\mathrm{V}$"], chk: {form: "u15s6v", p: {e: e, d: d}}};
  }
  throw new Error("u15s6v：条件に合う数字が見つからない");
}
function tbU15s6_Qf(r){
  var gcd = tbU15s6_gcd, ratio = tbU15s6_ratio, par = tbU15s6_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var v = pick(r, [10,20,50,100,200]);
    var d = pick(r, [0.1,0.2,0.4,0.5,1]);
    var q = pick(r, [2,3,4,5]);
    var E = (v / d);
    var F = (q * v / d);
    var A = (v / d);
    var B = (q * v * d);
    var C = (q * v);
    if (!(nice(E) && nice(F) && nice(B) && distinct([F, A, B, C]))) continue;
    var _c = choices(r, [{t: "$" + fmt(F) + "\\,\\mathrm{N}$", v: fmt(F)}, {t: "$" + fmt(A) + "\\,\\mathrm{N}$", v: fmt(A), why: "電荷を掛けていない（電界の強さのまま）"}, {t: "$" + fmt(B) + "\\,\\mathrm{N}$", v: fmt(B), why: "電界の強さを出すとき、電圧に距離を掛けた"}, {t: "$" + fmt(C) + "\\,\\mathrm{N}$", v: fmt(C), why: "電界の強さを出さず、電圧に電荷を掛けた"}]);
    return {form: "u15s6f", text: "平行に向かい合わせた2枚の極板の間に $" + fmt(v) + "\\,\\mathrm{V}$ の電圧をかけた。極板の間の距離は $" + fmt(d) + "\\,\\mathrm{m}$ である。極板の間に $" + fmt(q) + "\\,\\mathrm{C}$ の電荷を置いたとき、電荷に働く力の大きさは何 N か。", fig: {kind: "u15s6pl", L: tbU15s6_fig({"top":"+","bot":"-","v":"{V}","d":"{d}","e":"{E}"}, [["v", "{V}=" + fmt(v) + " V"], ["d", "{d}=" + fmt(d) + " m"], ["q", "{q}=" + fmt(q) + " C"], ["qs", "+"], ["f", "{F}"], ["fa", "down"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$E = \\dfrac{V}{d} = \\dfrac{" + fmt(v) + "}{" + fmt(d) + "} = " + fmt(E) + "\\,\\mathrm{V/m}$", "$F = qE = " + fmt(q) + " \\times " + fmt(E) + " = " + fmt(F) + "\\,\\mathrm{N}$"], chk: {form: "u15s6f", p: {v: v, d: d, q: q}}};
  }
  throw new Error("u15s6f：条件に合う数字が見つからない");
}
var GEN = {
  // 15-1 電界の強さ
  1: function(r){ return pick(r, [tbU15s1_Qe, tbU15s1_Qe, tbU15s1_Qe, tbU15s1_Qe, tbU15s1_Qdef, tbU15s1_Qdef, tbU15s1_Qunit])(r); },
  // 15-2 電界の中の力
  2: function(r){ return pick(r, [tbU15s2_Qf, tbU15s2_Qf, tbU15s2_Qf, tbU15s2_Qe, tbU15s2_Qe, tbU15s2_Qq])(r); },
  // 15-3 誘電率
  3: function(r){ return pick(r, [tbU15s3_Qratio, tbU15s3_Qratio, tbU15s3_Qval, tbU15s3_Qval, tbU15s3_Qval, tbU15s3_Qeps, tbU15s3_Qvac])(r); },
  // 15-4 電位
  4: function(r){ return pick(r, [tbU15s4_Qv, tbU15s4_Qv, tbU15s4_Qv, tbU15s4_Qv, tbU15s4_Qfar, tbU15s4_Qfar, tbU15s4_Qdef, tbU15s4_Qeq])(r); },
  // 15-5 電位差と仕事
  5: function(r){ return pick(r, [tbU15s5_Qw, tbU15s5_Qw, tbU15s5_Qdv, tbU15s5_Qdv, tbU15s5_Qdv, tbU15s5_Qwab, tbU15s5_Qwab, tbU15s5_Qwab])(r); },
  // 15-6 平行な極板の間の電界
  6: function(r){ return pick(r, [tbU15s6_Qe, tbU15s6_Qe, tbU15s6_Qe, tbU15s6_Qv, tbU15s6_Qv, tbU15s6_Qf, tbU15s6_Qf])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t15s1e","scene":"t15s1e","kind":"u15s1pe","lab":{"q":"{Q}","qs":"+","p":"P","r":"{r}","t":"+1 C","ts":"+","f":"{F}","fa":"out","e":"{E}","ea":"out"},"viewbox":"183 235 633 385","band":{"want":"電界の強さ","ans":"+1 C に働くクーロン力の大きさ　$E = 9 \\times 10^9 \\times \\dfrac{Q}{r^2}$","full":"電界の強さ E は、その点に置いた +1 C の電荷に働くクーロン力の大きさ。単位は N/C（V/m とも書く）。E = Q /（4π ε0 r^2）= 9 × 10^9 × Q / r^2。"},"narr":{"start":{"co":1,"td":0,"fd":0,"ed":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①+1 C を置く\n②式\n③単位\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"点電荷 $Q$ から $r$ 離れた点 P を考えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q","Pp","R"]},{"text":"P に +1 C の電荷を置きます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"t","emph":["T","Pp"]},{"text":"この +1 C は、$Q$ からクーロン力を受けます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"f","emph":["T","F","Q"]},{"text":"この +1 C に働くクーロン力の大きさを、P の〖電界の強さ $E$〗といいます。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"e","emph":["E","Pp"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"クーロンの法則で、〖一方の電荷を 1 にします〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E","Q","R"],"eq":[{"cont":false,"items":[["E = \\dfrac{Q \\times 1}{4 \\pi \\varepsilon_0 r^2} = \\dfrac{Q}{4 \\pi \\varepsilon_0 r^2}"]]}],"emphPre":["Q","T","R"]},{"text":"$\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ を使うと、次の式になります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["E","Q","R"],"eq":[{"cont":false,"items":[["E = 9 \\times 10^9 \\times \\dfrac{Q}{r^2}"]]}],"emphPre":["E","Q","R"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"1 C あたりの力なので、単位は〖N/C〗で、ニュートン毎クーロンと読みます。V/m と書くこともあります。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["E"],"ans":true}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pp":["ppd","pt0","pt1"],"T":["tc","tc:t","tt0","tt1"],"E":["ea","ea:h","et0","et1"],"F":["fa","fa:h","ft0","ft1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"t":{"to":{"td":1},"dur":0.5},"f":{"to":{"fd":1},"dur":0.7},"e":{"to":{"ed":1},"dur":0.7}},"route":["+1 C を置く","式","単位"]}},{"id":"t15s1x","scene":"t15s1x","kind":"u15s1pe","lab":{"q":"{Q}=8 C","qs":"+","p":"P","r":"{r}=2 m","e":["{E}","{E}=18×10⁹ N/C"],"ea":"out"},"viewbox":"183 235 633 385","band":{"want":"点 P の電界の強さ $E$","known":"$Q = 8\\,\\mathrm{C},\\;\\; r = 2\\,\\mathrm{m}$","ans":"$E = 18 \\times 10^9\\,\\mathrm{N/C}$"},"narr":{"start":{"co":1,"ed":0,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、点 P の電界の強さ $E$ です。","at":{"強調":1.0},"after":[],"emph":["Pp","E"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Pp"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電界の強さの式を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q","R","E"],"eq":[{"cont":false,"items":[["E = 9 \\times 10^9 \\times \\dfrac{Q}{r^2}"]]}],"emphPre":["Q","R","E"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$Q = 8$、$r = 2$ を入れます。分母は〖$r$ の2乗〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"e","emph":["Q","R","E"],"eq":[{"cont":false,"items":[["E = 9 \\times 10^9 \\times \\dfrac{8}{2^2}","= 18 \\times 10^9\\,\\mathrm{N/C}"]]}],"ans":true,"emphPre":["Q","R","E"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pp":["ppd","pt0","pt1"],"T":["tc","tc:t","tt0","tt1"],"E":["ea","ea:h","et0","et1"],"F":["fa","fa:h","ft0","ft1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"e":{"to":{"ed":1,"ev":1},"dur":0.7}},"route":["式を書く","数を入れる"]}},{"id":"t15s2e","scene":"t15s2e","kind":"u15s2pe","lab":{"q":"{Q}","qs":"+","p":"P","r":null,"e":"{E}","ea":"out","t":"{q}","ts":"+","f":"{F}","fa":"out"},"viewbox":"213 281 561 295","band":{"want":"電界の中の電荷に働く力","ans":"$F = qE$","full":"電界の強さ E は 1 C あたりの力なので、q［C］の電荷に働く力は F = qE。"},"narr":{"start":{"co":1,"ed":1,"td":0,"fd":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①1 C あたり\n②q 倍する\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"点 P の電界の強さを $E$ とします。$E$ は、〖+1 C に働く力の大きさ〗でした。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["E","Pp"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"P に $q$［C］の電荷を置きます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"t","emph":["T","Pp"]},{"text":"1 C あたり $E$ の力なので、$q$［C］には〖$q$ 倍の力〗が働きます。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"f","emph":["T","E","F"],"eq":[{"cont":false,"items":[["F = qE"]]}],"emphPre":["T","E","F"]},{"text":"たとえば $E = 5\\,\\mathrm{N/C}$ の所に 2 C を置けば 10 N、3 C を置けば 15 N です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["F","E"],"ans":true}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pp":["ppd","pt0","pt1"],"T":["tc","tc:t","tt0","tt1"],"E":["ea","ea:h","et0","et1"],"F":["fa","fa:h","ft0","ft1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"t":{"to":{"td":1},"dur":0.5},"f":{"to":{"fd":1},"dur":0.7}},"route":["1 C あたり","q 倍する"]}},{"id":"t15s2x","scene":"t15s2x","kind":"u15s2pe","lab":{"q":"{Q}","qs":"+","p":"P","r":null,"e":"{E}=6 N/C","ea":"out","t":"{q}=4 C","ts":"+","f":["{F}","{F}=24 N"],"fa":"out"},"viewbox":"213 281 561 295","band":{"want":"電荷に働く力 $F$","known":"$E = 6\\,\\mathrm{N/C},\\;\\; q = 4\\,\\mathrm{C}$","ans":"$F = 24\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"ed":1,"td":1,"fd":0,"fv":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、電荷に働く力 $F$ です。","at":{"強調":1.0},"after":[],"emph":["T","F"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電界の強さは〖1 C あたりの力〗なので、$q$ 倍します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","T","F"],"eq":[{"cont":false,"items":[["F = qE"]]}],"emphPre":["E","T","F"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$q = 4$、$E = 6$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"f","emph":["E","T","F"],"eq":[{"cont":false,"items":[["F = 4 \\times 6 = 24\\,\\mathrm{N}"]]}],"ans":true,"emphPre":["E","T","F"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pp":["ppd","pt0","pt1"],"T":["tc","tc:t","tt0","tt1"],"E":["ea","ea:h","et0","et1"],"F":["fa","fa:h","ft0","ft1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"f":{"to":{"fd":1,"fv":1},"dur":0.7}},"route":["式を書く","数を入れる"]}},{"id":"t15s3e","scene":"t15s3e","kind":"u15s3pr","lab":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":["{F}","{F}'"],"f1a":"out","f2":["{F}","{F}'"],"f2a":"out","med":"水 {ε}_r=80"},"viewbox":"96 218 818 384","band":{"want":"まわりの物質とクーロン力","ans":"$\\varepsilon = \\varepsilon_0 \\varepsilon_r$、力は $\\dfrac{1}{\\varepsilon_r}$ 倍","full":"誘電率 ε はまわりの物質の性質を表す数で、大きいほどクーロン力は弱まる。ε = ε0 εr（εr は比誘電率）。真空中・空気中は εr = 1、20℃の水は 80。水の中では力は真空中の 1/80。"},"narr":{"start":{"co":1,"f1d":1,"f2d":1,"medd":0,"fs":0,"f1v":0,"f2v":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①誘電率\n②比誘電率\n③力の変わり方\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"誘電率 $\\varepsilon$ は、電荷のまわりの物質の性質を表す数です。大きいほど、〖クーロン力は弱まります〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["F1","F2"]},{"text":"クーロンの法則の $\\varepsilon_0$ は真空中の誘電率です。正しくは、まわりの物質の $\\varepsilon$ を使います。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["F1","F2","Q1","Q2","R"],"eq":[{"cont":false,"items":[["F = \\dfrac{q_1 q_2}{4 \\pi \\varepsilon r^2}"]]}],"emphPre":["Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"誘電率は、真空中の誘電率 $\\varepsilon_0$ に、〖比誘電率 $\\varepsilon_r$ を掛けて〗表します。","at":{"道筋":1.0,"式":1.0},"after":[],"route":2,"eq":[{"cont":false,"items":[["\\varepsilon = \\varepsilon_0 \\varepsilon_r"]]}]},{"text":"比誘電率は物質ごとに決まった数で、真空中の誘電率の何倍かを表します。真空中と空気中は 1、20℃の水は 80 です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"med","emph":["Med"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"まわりを水にすると、$\\varepsilon$ は $\\varepsilon_0$ の 80 倍です。分母が 80 倍になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Med"],"eq":[{"cont":false,"items":[["\\varepsilon = 80 \\varepsilon_0"]]}],"emphPre":["Med"]},{"text":"力は真空中の〖$\\dfrac{1}{80}$ 倍〗になります。比誘電率 $\\varepsilon_r$ の物質の中では、力は $\\dfrac{1}{\\varepsilon_r}$ 倍です。","at":{"動き":1.0,"強調":1.0,"答え":1.0},"after":[],"move":"fs","emph":["F1","F2","Med"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"med":{"to":{"medd":1},"dur":0.6},"fs":{"to":{"fs":1,"f1v":1,"f2v":1},"dur":0.8}},"route":["誘電率","比誘電率","力の変わり方"]}},{"id":"t15s3x","scene":"t15s3x","kind":"u15s3pr","lab":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":["{F}=36×10⁹ N","{F}'"],"f1a":"out","f2":["{F}=36×10⁹ N","{F}'"],"f2a":"out","med":"{ε}_r=4"},"viewbox":"96 218 818 384","band":{"want":"比誘電率 4 の物質の中での力 $F'$","known":"真空中で $F = 36 \\times 10^9\\,\\mathrm{N}$、$\\varepsilon_r = 4$","ans":"$F' = 9 \\times 10^9\\,\\mathrm{N}$"},"narr":{"start":{"co":1,"f1d":1,"f2d":1,"medd":0,"fs":0,"f1v":0,"f2v":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、比誘電率 4 の物質の中で働く力 $F'$ です。","at":{"強調":1.0},"after":[],"emph":["F1","F2"]},{"text":"①誘電率の変わり方\n②力の変わり方\nこの順に解きます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"比誘電率が 4 なので、誘電率は真空中の 4 倍です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"med","emph":["Med"],"eq":[{"cont":false,"items":[["\\varepsilon = \\varepsilon_0 \\varepsilon_r = 4 \\varepsilon_0"]]}],"emphPre":["Med"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"誘電率は分母にあるので、力は〖$\\dfrac{1}{4}$ 倍〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"fs","emph":["F1","F2","Med"],"eq":[{"cont":false,"items":[["F' = 36 \\times 10^9 \\times \\dfrac{1}{4}","= 9 \\times 10^9\\,\\mathrm{N}"]]}],"ans":true,"emphPre":["F1","F2","Med"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Q1":["q1c","q1c:t","q1m","q1mt","q1t0","q1t1"],"Q2":["q2c","q2c:t","q2m","q2mt","q2t0","q2t1"],"F1":["f1a","f1a:h","f1t0","f1t1"],"F2":["f2a","f2a:h","f2t0","f2t1"],"R":["re1","re2","rd","rd:h","rd:h2","rt0","rt1"]},"moves":{"med":{"to":{"medd":1},"dur":0.6},"fs":{"to":{"fs":1,"f1v":1,"f2v":1},"dur":0.8}},"route":["誘電率の変わり方","力の変わり方"]}},{"id":"t15s4e","scene":"t15s4e","kind":"u15s4pot","lab":{"q":"{Q}","qs":"+","pa":"A","a":"{r}","inf":"∞","t":"+1 C","ts":"+","wa":""},"viewbox":"119 188 808 478","band":{"want":"電位","ans":"無限に遠い所から +1 C を運ぶエネルギー　$V = 9 \\times 10^9 \\times \\dfrac{Q}{r}$","full":"無限に離れた所を 0 V とし、そこから +1 C の電荷をある点まで運ぶのに要るエネルギーを、その点の電位という。単位は V。V = Q /（4π ε0 r）= 9 × 10^9 × Q / r。r は1乗。"},"narr":{"start":{"co":1,"td":0,"tx":0,"wad":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①0 V の所\n②運ぶエネルギー\n③式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"クーロン力は、距離の2乗に反比例して弱くなります。無限に離れた所では、$Q$ から力を受けません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Q","Inf"]},{"text":"この〖無限に離れた所を、電位の基準の 0 V〗とします。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"t","emph":["Inf","T"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"+1 C を、無限に遠い所から点 A へ近づけていきます。近づくほど、退け合う力が強くなります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"go","emph":["T","Wa","Pa"]},{"text":"力に逆らって押さなければ、近づけられません。物を高い所へ持ち上げるのと同じです。","at":{"強調":1.0},"after":[],"emph":["T","Wa"]},{"text":"このとき要るエネルギーを、〖点 A の電位〗といいます。単位はボルト V です。1 C が持つ位置エネルギーです。","at":{"強調":1.0},"after":[],"emph":["Pa"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"点電荷 $Q$ から $r$ 離れた点の電位は、次の式で求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Q","A","Pa"],"eq":[{"cont":false,"items":[["V = \\dfrac{Q}{4 \\pi \\varepsilon_0 r} = 9 \\times 10^9 \\times \\dfrac{Q}{r}"]]}],"emphPre":["Q","A","Pa"]},{"text":"電界の強さの式と違い、〖$r$ は2乗でなく1乗〗です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["A"],"ans":true}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pa":["pad","pat0","pat1"],"Pb":["pbd","pbt0","pbt1"],"Inf":["inft0","inft1"],"Wa":["wa","wa:h","wat0","wat1"],"Wb":["wb","wb:h","wbt0","wbt1"],"Wba":["wba","wba:h","wbat0","wbat1"],"T":["tc","tc:t","tt0","tt1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1"],"B":["be1","be2","bd","bd:h","bd:h2","bt0","bt1"]},"moves":{"t":{"to":{"td":1},"dur":0.5},"go":{"to":{"tx":1,"wad":1},"dur":1.4}},"route":["0 V の所","運ぶエネルギー","式"]}},{"id":"t15s4x","scene":"t15s4x","kind":"u15s4pot","lab":{"q":"{Q}=6 C","qs":"+","pa":["A","A 18×10⁹ V"],"a":"{r}=3 m","inf":"∞"},"viewbox":"119 188 808 478","band":{"want":"点 A の電位 $V$","known":"$Q = 6\\,\\mathrm{C},\\;\\; r = 3\\,\\mathrm{m}$","ans":"$V = 18 \\times 10^9\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pav":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、点 A の電位 $V$ です。","at":{"強調":1.0},"after":[],"emph":["Pa"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Pa"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電位の式を使います。〖$r$ は1乗〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q","A"],"eq":[{"cont":false,"items":[["V = 9 \\times 10^9 \\times \\dfrac{Q}{r}"]]}],"emphPre":["Q","A"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$Q = 6$、$r = 3$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"v","emph":["Q","A","Pa"],"eq":[{"cont":false,"items":[["V = 9 \\times 10^9 \\times \\dfrac{6}{3}","= 18 \\times 10^9\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["Q","A","Pa"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pa":["pad","pat0","pat1"],"Pb":["pbd","pbt0","pbt1"],"Inf":["inft0","inft1"],"Wa":["wa","wa:h","wat0","wat1"],"Wb":["wb","wb:h","wbt0","wbt1"],"Wba":["wba","wba:h","wbat0","wbat1"],"T":["tc","tc:t","tt0","tt1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1"],"B":["be1","be2","bd","bd:h","bd:h2","bt0","bt1"]},"moves":{"v":{"to":{"pav":1},"dur":0.5}},"route":["式を書く","数を入れる"]}},{"id":"t15s5e","scene":"t15s5e","kind":"u15s5pot","lab":{"q":"{Q}","qs":"+","pa":"A","pb":"B","a":"{a}","b":"{b}","inf":"∞","t":"{q}","ts":"+","t0":"B","wba":"{W}"},"viewbox":"106 188 821 528","band":{"want":"電位差と、電荷を運ぶ仕事","ans":"$W = qV$、B から A へは $q(V_A - V_B)$","full":"電位は 1 C あたりのエネルギーなので、電荷 q を掛けるとエネルギー（仕事）：W = qV。電位差は高い方から低い方を引く。q を B から A へ運ぶ仕事は q（VA − VB）。"},"narr":{"start":{"co":1,"td":0,"tx":0,"wbad":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"①電荷を掛ける\n②電位差\n③運ぶ仕事\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"電位は、1 C あたりのエネルギーでした。$q$［C］なら〖$q$ 倍のエネルギー〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"t","emph":["T"],"eq":[{"cont":false,"items":[["W = qV"]]}],"emphPre":["T"]},{"text":"エネルギーの単位はジュール J です。運ぶのに要るエネルギーを、仕事ともいいます。","at":{"強調":1.0},"after":[],"emph":["T"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"点 A と点 B の電位の差を、〖電位差〗といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Pa","Pb"]},{"text":"A の方が $Q$ に近いので、電位が高くなります。高い方から低い方を引きます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Pa","Pb","A","B","Q"],"eq":[{"cont":false,"items":[["V_A - V_B = 9 \\times 10^9 \\times \\dfrac{Q}{a}","- 9 \\times 10^9 \\times \\dfrac{Q}{b}"]]}],"emphPre":["Pa","Pb","A","B","Q"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"$q$ を B から A へ運ぶ仕事は、〖電位差に $q$ を掛けて〗求めます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"go","emph":["T","Wba","Pa","Pb"],"eq":[{"cont":false,"items":[["W = q(V_A - V_B)"]]}],"ans":true,"emphPre":["T","Wba","Pa","Pb"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pa":["pad","pat0","pat1"],"Pb":["pbd","pbt0","pbt1"],"Inf":["inft0","inft1"],"Wa":["wa","wa:h","wat0","wat1"],"Wb":["wb","wb:h","wbt0","wbt1"],"Wba":["wba","wba:h","wbat0","wbat1"],"T":["tc","tc:t","tt0","tt1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1"],"B":["be1","be2","bd","bd:h","bd:h2","bt0","bt1"]},"moves":{"t":{"to":{"td":1},"dur":0.5},"go":{"to":{"tx":1,"wbad":1},"dur":1.2}},"route":["電荷を掛ける","電位差","運ぶ仕事"]}},{"id":"t15s5x","scene":"t15s5x","kind":"u15s5pot","lab":{"q":"{Q}=12 C","qs":"+","pa":["A","A 54×10⁹ V"],"pb":["B","B 36×10⁹ V"],"a":"{a}=2 m","b":"{b}=3 m","inf":"∞"},"viewbox":"106 188 821 528","band":{"want":"A と B の電位差","known":"$Q = 12\\,\\mathrm{C},\\;\\; a = 2\\,\\mathrm{m},\\;\\; b = 3\\,\\mathrm{m}$","ans":"$V_A - V_B = 18 \\times 10^9\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pav":0,"pbv":0},"steps":[{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"求めるのは、点 A と点 B の電位差です。","at":{"強調":1.0},"after":[],"emph":["Pa","Pb"]},{"text":"①A の電位\n②B の電位\n③引く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Pa","Pb"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"A は $Q$ から 2 m です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"va","emph":["Q","A","Pa"],"eq":[{"cont":false,"items":[["V_A = 9 \\times 10^9 \\times \\dfrac{12}{2}","= 54 \\times 10^9\\,\\mathrm{V}"]]}],"emphPre":["Q","A","Pa"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"B は $Q$ から 3 m です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"vb","emph":["Q","B","Pb"],"eq":[{"cont":false,"items":[["V_B = 9 \\times 10^9 \\times \\dfrac{12}{3}","= 36 \\times 10^9\\,\\mathrm{V}"]]}],"emphPre":["Q","B","Pb"]}]},{"cap":null,"eqp":null,"vid":[28],"sents":[{"text":"〖高い方の A から、低い方の B を引きます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Pa","Pb"],"eq":[{"cont":false,"items":[["V_A - V_B","= 54 \\times 10^9 - 36 \\times 10^9","= 18 \\times 10^9\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["Pa","Pb"]}]}],"groups":{"Q":["qc","qc:t","qm","qmt","qt0","qt1"],"Pa":["pad","pat0","pat1"],"Pb":["pbd","pbt0","pbt1"],"Inf":["inft0","inft1"],"Wa":["wa","wa:h","wat0","wat1"],"Wb":["wb","wb:h","wbt0","wbt1"],"Wba":["wba","wba:h","wbat0","wbat1"],"T":["tc","tc:t","tt0","tt1"],"A":["ae1","ae2","ad","ad:h","ad:h2","at0","at1"],"B":["be1","be2","bd","bd:h","bd:h2","bt0","bt1"]},"moves":{"va":{"to":{"pav":1},"dur":0.5},"vb":{"to":{"pbv":1},"dur":0.5}},"route":["A の電位","B の電位","引く"]}},{"id":"t15s6e","scene":"t15s6e","kind":"u15s6pl","lab":{"top":"+","bot":"-","v":"{V}","d":"{d}","e":"{E}"},"viewbox":"-180 126 1385 536","band":{"want":"平行な極板の間の電界の強さ","ans":"$E = \\dfrac{V}{d}$","full":"2枚の極板を平行に向かい合わせ、電圧 V をかけると、極板の間の電界はどこでも同じ強さで、＋の極板から－の極板への向き。強さは E = V / d。単位 V/m。"},"narr":{"start":{"co":1,"ed":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"①極板\n②電界の向き\n③式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"2枚の平らな金属の板を、平行に向かい合わせます。この板を極板といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Top","Bot"]},{"text":"極板の間に電圧 $V$ をかけ、極板の間の距離を $d$ とします。","at":{"強調":1.0},"after":[],"emph":["V","D"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"+1 C を極板の間に置くと、正の極板から退けられ、負の極板へ引かれます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["Top","Bot"]},{"text":"なので、電界は正の極板から負の極板への向きです。極板の間なら、〖どこでも同じ強さ〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"e","emph":["E"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"電界の強さは、〖電圧を距離で割って〗求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["E","V","D"],"eq":[{"cont":false,"items":[["E = \\dfrac{V}{d}"]]}],"emphPre":["E","V","D"]},{"text":"V を m で割るので、単位は〖V/m〗です。電界の強さの単位 N/C は、V/m とも書くのでした。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["E"],"ans":true}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"e":{"to":{"ed":1},"dur":0.8}},"route":["極板","電界の向き","式"]}},{"id":"t15s6x","scene":"t15s6x","kind":"u15s6pl","lab":{"top":"+","bot":"-","v":"{V}=100 V","d":"{d}=0.5 m","e":["{E}","{E}=200 V/m"]},"viewbox":"-180 126 1385 536","band":{"want":"極板の間の電界の強さ $E$","known":"$V = 100\\,\\mathrm{V},\\;\\; d = 0.5\\,\\mathrm{m}$","ans":"$E = 200\\,\\mathrm{V/m}$"},"narr":{"start":{"co":1,"ed":1,"ev":0},"steps":[{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"求めるのは、極板の間の電界の強さ $E$ です。","at":{"強調":1.0},"after":[],"emph":["E"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["E"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"〖電圧を距離で割ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["E","V","D"],"eq":[{"cont":false,"items":[["E = \\dfrac{V}{d}"]]}],"emphPre":["E","V","D"]}]},{"cap":null,"eqp":null,"vid":[],"sents":[{"text":"$V = 100$、$d = 0.5$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"e","emph":["E","V","D"],"eq":[{"cont":false,"items":[["E = \\dfrac{100}{0.5} = 200\\,\\mathrm{V/m}"]]}],"ans":true,"emphPre":["E","V","D"]}]}],"groups":{"Med":["medf","medt0","medt1"],"Top":["zt","top","topt0","topt1"],"Bot":["zb","bot","bott0","bott1"],"D":["de1","de2","dd","dd:h","dd:h2","dt0","dt1"],"V":["va","va:h","ve1","ve2","vt0","vt1"],"S":["se1","se2","sd","sd:h","sd:h2","st0","st1"],"Cap":["capt0","capt1"],"E":["e0","e0:h","e1","e1:h","e2","e2:h","e3","e3:h","e4","e4:h","et0","et1"],"Qc":["qc","qc:t","qt0","qt1"],"F":["fa","fa:h","ft0","ft1"]},"moves":{"e":{"to":{"ev":1},"dur":0.5}},"route":["式を書く","数を入れる"]}}],"secs":[{"ex":{"text":"真空中に $Q = 8\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $2\\,\\mathrm{m}$ 離れた点 P の電界の強さは何 N/C か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。","fig":{"kind":"u15s1pe","L":{"q":"{Q}=8 C","qs":"+","p":"P","r":"{r}=2 m"},"P":{}},"ch":[{"t":"$36 \\times 10^9\\,\\mathrm{N/C}$","v":"36","why":"距離を2乗していない"},{"t":"$2 \\times 10^9\\,\\mathrm{N/C}$","v":"2","why":"$9$ を掛けていない"},{"t":"$72 \\times 10^9\\,\\mathrm{N/C}$","v":"72","why":"距離の2乗で割っていない"},{"t":"$18 \\times 10^9\\,\\mathrm{N/C}$","v":"18","why":""}],"ans":3}},{"ex":{"text":"電界の強さが $6\\,\\mathrm{N/C}$ の点に、$4\\,\\mathrm{C}$ の電荷を置いた。電荷に働く力の大きさは何 N か。","fig":{"kind":"u15s2pe","L":{"q":"{Q}","qs":"+","p":"P","r":null,"e":"{E}=6 N/C","ea":"out","t":"{q}=4 C","ts":"+","f":"{F}","fa":"out"},"P":{}},"ch":[{"t":"$24\\,\\mathrm{N}$","v":"24","why":""},{"t":"$10\\,\\mathrm{N}$","v":"10","why":"電界の強さと電荷を足した"},{"t":"$1.5\\,\\mathrm{N}$","v":"1.5","why":"電界の強さを電荷で割った"},{"t":"$6\\,\\mathrm{N}$","v":"6","why":"電荷の 4 C を掛けていない（1 C あたりの力のまま）"}],"ans":0}},{"ex":{"text":"真空中で 2つの点電荷の間に $36 \\times 10^9\\,\\mathrm{N}$ の力が働いていた。距離を変えずに、まわりを比誘電率 4 の物質にした。働く力の大きさは何 N になるか。","fig":{"kind":"u15s3pr","L":{"q1":"{q}_1","q1s":"+","q2":"{q}_2","q2s":"+","r":"{r}","f1":"{F}","f1a":"out","f2":"{F}","f2a":"out","med":"{ε}_r=4"},"P":{}},"ch":[{"t":"$144 \\times 10^9\\,\\mathrm{N}$","v":"144","why":"誘電率は分母にあるので、力は弱まる"},{"t":"$9 \\times 10^9\\,\\mathrm{N}$","v":"9","why":""},{"t":"$2.25 \\times 10^9\\,\\mathrm{N}$","v":"2.25","why":"比誘電率を2乗した"},{"t":"$36 \\times 10^9\\,\\mathrm{N}$","v":"36","why":"まわりの物質で力は変わる"}],"ans":1}},{"ex":{"text":"真空中に $Q = 6\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $3\\,\\mathrm{m}$ 離れた点 A の電位は何 V か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。","fig":{"kind":"u15s4pot","L":{"q":"{Q}=6 C","qs":"+","pa":"A","a":"{r}=3 m","inf":"∞"},"P":{}},"ch":[{"t":"$6 \\times 10^9\\,\\mathrm{V}$","v":"6","why":"距離を2乗した（2乗するのは電界の強さ）"},{"t":"$18 \\times 10^9\\,\\mathrm{V}$","v":"18","why":""},{"t":"$2 \\times 10^9\\,\\mathrm{V}$","v":"2","why":"$9$ を掛けていない"},{"t":"$162 \\times 10^9\\,\\mathrm{V}$","v":"162","why":"距離で割らずに掛けた"}],"ans":1}},{"ex":{"text":"真空中に $Q = 12\\,\\mathrm{C}$ の点電荷を置いた。$Q$ から $2\\,\\mathrm{m}$ の点 A と、$3\\,\\mathrm{m}$ の点 B の電位差は何 V か。ただし $\\dfrac{1}{4 \\pi \\varepsilon_0} = 9 \\times 10^9$ とする。","fig":{"kind":"u15s5pot","L":{"q":"{Q}=12 C","qs":"+","pa":"A","pb":"B","a":"{a}=2 m","b":"{b}=3 m","inf":"∞"},"P":{}},"ch":[{"t":"$90 \\times 10^9\\,\\mathrm{V}$","v":"90","why":"2つの電位を足した"},{"t":"$15 \\times 10^9\\,\\mathrm{V}$","v":"15","why":"距離を2乗した（電位は1乗）"},{"t":"$54 \\times 10^9\\,\\mathrm{V}$","v":"54","why":"A の電位だけで、B の電位を引いていない"},{"t":"$18 \\times 10^9\\,\\mathrm{V}$","v":"18","why":""}],"ans":3}},{"ex":{"text":"平行に向かい合わせた2枚の極板の間に $100\\,\\mathrm{V}$ の電圧をかけた。極板の間の距離は $0.5\\,\\mathrm{m}$ である。極板の間の電界の強さは何 V/m か。","fig":{"kind":"u15s6pl","L":{"top":"+","bot":"-","v":"{V}=100 V","d":"{d}=0.5 m","e":"{E}"},"P":{}},"ch":[{"t":"$50\\,\\mathrm{V/m}$","v":"50","why":"電圧に距離を掛けた"},{"t":"$200\\,\\mathrm{V/m}$","v":"200","why":""},{"t":"$0.005\\,\\mathrm{V/m}$","v":"0.005","why":"距離を電圧で割った"},{"t":"$100\\,\\mathrm{V/m}$","v":"100","why":"距離で割っていない"}],"ans":1}}],"past":[]}};
});
