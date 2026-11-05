/* 単元18「静電エネルギーと電荷の移動」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(18, function(H){
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
// ---- 18-1 静電エネルギー の図（※ textbook/gen/make_section.py が textbook/gen/data/u18_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U18S1K = {
  cv: {"vars":[],"items":[{"t":"z","id":"zbu18s1cv0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu18s1cv1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u18s1cvL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u18s1cvRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u18s1cvw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u18s1cvw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,323.5,null],"fh":1,"q":"q","w":"w","f":"cap","F":28.4},{"t":"v","k":"v","x":761.5,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c","lab":[761.5,255.21,null]}],"flows":[],"base":110,"von":["src","v"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]}
};
function tbU18s1cv(d, p, L){ tbFig_Draw(d, p, L, U18S1K.cv); }
// ---- 18-2 静電エネルギーの式の変形 の図（※ textbook/gen/make_section.py が textbook/gen/data/u18_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U18S2K = {
  cv: {"vars":[],"items":[{"t":"z","id":"zbu18s2cv0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu18s2cv1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u18s2cvL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u18s2cvRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u18s2cvw1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u18s2cvw2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,323.5,null],"fh":1,"q":"q","w":"w","f":"cap","F":28.4},{"t":"v","k":"v","x":761.5,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c","lab":[761.5,255.21,null]}],"flows":[],"base":110,"von":["src","v"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c","P","N",1,[]]]}
};
function tbU18s2cv(d, p, L){ tbFig_Draw(d, p, L, U18S2K.cv); }
// ---- 18-3 直列の電圧と電荷 の図（※ textbook/gen/make_section.py が textbook/gen/data/u18_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U18S3K = {
  ser: {"vars":[],"items":[{"t":"z","id":"zbu18s3ser0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[608.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu18s3ser1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[914.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu18s3ser2mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u18s3serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u18s3serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u18s3serw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u18s3serw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u18s3serw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.79,null]},{"t":"cap","k":"c1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,434.5,null],"fh":1,"q":"q1","f":"cap","F":28.4},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c1","lab":[638.67,255.21,null]},{"t":"cap","k":"c2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,434.5,null],"fh":1,"q":"q2","f":"cap","F":28.4},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"c2","lab":[884.33,255.21,null]}],"flows":[],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","c1","P","n1",1,[]],["R","c2","n1","N",1,[]]]}
};
function tbU18s3ser(d, p, L){ tbFig_Draw(d, p, L, U18S3K.ser); }
// ---- 18-4 電荷の合計は変わらない の図（※ textbook/gen/make_section.py が textbook/gen/data/u18_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U18S4K = {
  rc: {"vars":[],"items":[{"f":"ln","id":"zl","pts":[[330,415],[330,250],[579,250]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"],"no":["mvq"]},{"f":"ln","id":"zr","pts":[[651,250],[900,250],[900,415]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"],"no":["mvq"]},{"f":"ln","id":"za","pts":[[330,415],[330,250],[900,250],[900,415]],"w":16,"noobs":1,"o":["mvq"],"col":"#ffa8a8","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"zb","pts":[[330,435],[330,600],[900,600],[900,435]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wl","pts":[[330,415],[330,250],[579,250]],"vis":[],"t":"F"},{"f":"ln","id":"wr","pts":[[651,250],[900,250],[900,415]],"vis":[],"t":"F"},{"f":"ln","id":"wb","pts":[[330,435],[330,600],[900,600],[900,435]],"vis":[],"t":"F"},{"f":"ln","id":"c1","pts":[[300,415],[360,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:b","pts":[[300,435],[360,435]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2","pts":[[870,415],[930,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:b","pts":[[870,435],[930,435]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1t","k":"c1","bases":[[374,425,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":374,"y":465,"anc":"start"},{"f":"lb","id":"c2t","k":"c2","bases":[[856,425,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":856,"y":385,"anc":"end"},{"f":"lb","id":"q1p","k":"q1","bases":[[374,373,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":374,"y":373,"anc":"start"},{"f":"lb","id":"q1m","k":"q1","bases":[[374,477,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":416.43,"y":519.43,"anc":"start"},{"f":"lb","id":"q2p","k":"q2","bases":[[856,373,"end",[-1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":813.57,"y":330.57,"anc":"end"},{"f":"lb","id":"q2m","k":"q2","bases":[[856,477,"end",[-1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":856,"y":477,"anc":"end"},{"f":"c","id":"swp0","cx":579,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":651,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"sw","pts":[[579,250],[645,250]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[579,250],[641.35,214]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ar","id":"v1a","x0":260,"y0":580,"x1":260,"y1":270,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[244,425,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":244,"y":425,"anc":"end"},{"f":"ar","id":"v2a","x0":970,"y0":580,"x1":970,"y1":270,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[986,425,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":986,"y":425,"anc":"start"},{"f":"ln","id":"iso","pts":[[290,210],[940,210],[940,423],[290,423]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ln","id":"iso2","pts":[[290,427],[940,427],[940,640],[290,640]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ar","id":"mq0","x0":390,"y0":250,"x1":416,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":390,"x1":416,"mv":[["mvq",370,0]]},"rl":{"x0":840,"x1":814,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq1","x0":440,"y0":250,"x1":466,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":440,"x1":466,"mv":[["mvq",370,0]]},"rl":{"x0":790,"x1":764,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq2","x0":490,"y0":250,"x1":516,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":490,"x1":516,"mv":[["mvq",370,0]]},"rl":{"x0":740,"x1":714,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU18s4rc(d, p, L){ tbFig_Draw(d, p, L, U18S4K.rc); }
// ---- 18-5 つなぎ替え の図（※ textbook/gen/make_section.py が textbook/gen/data/u18_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U18S5K = {
  rc: {"vars":[],"items":[{"f":"ln","id":"zl","pts":[[330,415],[330,250],[579,250]],"w":16,"noobs":1,"col":"#ffa8a8","vis":[],"t":"F","zc":["v1","v2"],"no":["mvq"]},{"f":"ln","id":"zr","pts":[[651,250],[900,250],[900,415]],"w":16,"noobs":1,"col":"#b197fc","vis":[],"t":"F","zc":["v2","v1"],"no":["mvq"]},{"f":"ln","id":"za","pts":[[330,415],[330,250],[900,250],[900,415]],"w":16,"noobs":1,"o":["mvq"],"col":"#ffa8a8","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"zb","pts":[[330,435],[330,600],[900,600],[900,435]],"w":16,"noobs":1,"col":"#ced4da","vis":[],"t":"F","zc":["",""]},{"f":"ln","id":"wl","pts":[[330,415],[330,250],[579,250]],"vis":[],"t":"F"},{"f":"ln","id":"wr","pts":[[651,250],[900,250],[900,415]],"vis":[],"t":"F"},{"f":"ln","id":"wb","pts":[[330,435],[330,600],[900,600],[900,435]],"vis":[],"t":"F"},{"f":"ln","id":"c1","pts":[[300,415],[360,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c1:b","pts":[[300,435],[360,435]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2","pts":[[870,415],[930,415]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"c2:b","pts":[[870,435],[930,435]],"w":5,"vis":[],"t":"F"},{"f":"lb","id":"c1t","k":"c1","bases":[[374,425,"start",[1,0]]],"need":"c1","vis":[],"t":"F","x":374,"y":481,"anc":"start"},{"f":"lb","id":"c2t","k":"c2","bases":[[856,425,"end",[-1,0]]],"need":"c2","vis":[],"t":"F","x":856,"y":369,"anc":"end"},{"f":"lb","id":"q1p","k":"q1","bases":[[374,373,"start",[1,-1]]],"need":"q1","vis":[],"t":"F","pre":"+","x":388.14,"y":302.29,"anc":"start"},{"f":"lb","id":"q1m","k":"q1","bases":[[374,477,"start",[1,1]]],"need":"q1","vis":[],"t":"F","pre":"-","x":464.51,"y":556.2,"anc":"start"},{"f":"lb","id":"q2p","k":"q2","bases":[[856,373,"end",[-1,-1]]],"need":"q2","vis":[],"t":"F","pre":"+","x":751.35,"y":160.87,"anc":"end"},{"f":"lb","id":"q2m","k":"q2","bases":[[856,477,"end",[-1,1]]],"need":"q2","vis":[],"t":"F","pre":"-","x":751.35,"y":689.13,"anc":"end"},{"f":"c","id":"swp0","cx":579,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"c","id":"swp1","cx":651,"cy":250,"r":6,"fill":"w","vis":[],"t":"F"},{"f":"ln","id":"sw","pts":[[579,250],[645,250]],"w":4,"o":["swc"],"vis":[],"t":"F"},{"f":"ln","id":"swo","pts":[[579,250],[641.35,214]],"w":4,"no":["swc"],"vis":[],"t":"F"},{"f":"ar","id":"v1a","x0":260,"y0":580,"x1":260,"y1":270,"w":3,"need":"v1","vis":[],"t":"F"},{"f":"lb","id":"v1t","k":"v1","bases":[[244,425,"end",[-1,0]]],"need":"v1","vis":[],"t":"F","x":244,"y":425,"anc":"end"},{"f":"ar","id":"v2a","x0":970,"y0":580,"x1":970,"y1":270,"w":3,"need":"v2","vis":[],"t":"F"},{"f":"lb","id":"v2t","k":"v2","bases":[[986,425,"start",[1,0]]],"need":"v2","vis":[],"t":"F","x":986,"y":425,"anc":"start"},{"f":"ln","id":"iso","pts":[[290,210],[940,210],[940,423],[290,423]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ln","id":"iso2","pts":[[290,427],[940,427],[940,640],[290,640]],"dash":1,"w":3,"close":1,"o":["isod"],"vis":[],"t":"F"},{"f":"ar","id":"mq0","x0":390,"y0":250,"x1":416,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":390,"x1":416,"mv":[["mvq",370,0]]},"rl":{"x0":840,"x1":814,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq1","x0":440,"y0":250,"x1":466,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":440,"x1":466,"mv":[["mvq",370,0]]},"rl":{"x0":790,"x1":764,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"},{"f":"ar","id":"mq2","x0":490,"y0":250,"x1":516,"y1":250,"w":4,"o":["mvq"],"no":["mvq"],"sel":"dir","var":{"lr":{"x0":490,"x1":516,"mv":[["mvq",370,0]]},"rl":{"x0":740,"x1":714,"mv":[["mvq",-370,0]]}},"dflt":"lr","col":"#1971c2","vis":[],"t":"F"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU18s5rc(d, p, L){ tbFig_Draw(d, p, L, U18S5K.rc); }
var KINDS = {u18s1cv: tbU18s1cv, u18s2cv: tbU18s2cv, u18s3ser: tbU18s3ser, u18s4rc: tbU18s4rc, u18s5rc: tbU18s5rc};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 18-1 の図は電流が流れないので載せない,
  // 18-2 の図は電流が流れないので載せない,
  // 18-3 の図は電流が流れないので載せない,
  // 18-4 の図は電流が流れないので載せない,
  // 18-5 の図は電流が流れないので載せない
};

// 18-1 静電エネルギー の練習（※ textbook/gen/make_section.py が textbook/gen/data/u18_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU18s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU18s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU18s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU18s1_par(a, b){ return a * b / (a + b); }
function tbU18s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU18s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU18s1_Qw(r){
  var gcd = tbU18s1_gcd, ratio = tbU18s1_ratio, par = tbU18s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [1,2,3,4,5,6,8,10]);
    var v = pick(r, [1,2,3,4,5,6,8,10]);
    var X = (c * v * v / 2);
    var A = (c * v * v);
    var B = (c * v / 2);
    var D = (c * c * v / 2);
    if (!(c != v && nice(X) && nice(B) && nice(D) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{J}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A), why: "$\\dfrac{1}{2}$ を掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "電圧を2乗していない"}, {t: "$" + fmt(D) + "\\,\\mathrm{J}$", v: fmt(D), why: "静電容量を2乗した（2乗するのは電圧）"}]);
    return {form: "u18s1w", text: "静電容量 $" + fmt(c) + "\\,\\mathrm{F}$ のコンデンサを $" + fmt(v) + "\\,\\mathrm{V}$ の電源につないで充電した。コンデンサの静電エネルギーは何 J か。", fig: {kind: "u18s1cv", L: tbU18s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, [["c", "{C}=" + fmt(c) + " F"], ["v", "{V}=" + fmt(v) + " V"], ["src", "{V}=" + fmt(v) + " V"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} C V^2$", "$W = \\dfrac{1}{2} \\times " + fmt(c) + " \\times " + fmt(v) + "^2 = " + fmt(X) + "\\,\\mathrm{J}$"], chk: {form: "u18s1w", p: {c: c, v: v}}};
  }
  throw new Error("u18s1w：条件に合う数字が見つからない");
}
function tbU18s1_Qk(r){
  var gcd = tbU18s1_gcd, ratio = tbU18s1_ratio, par = tbU18s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [2,3,4,5]);
    var k2 = (k * k);
    var h = (k / 2);
    var k3 = (2 * k);
    if (!(distinct([k2, k, h, k3]))) continue;
    var _c = choices(r, [{t: "$" + fmt(k2) + "$ 倍", v: fmt(k2)}, {t: "$" + fmt(k) + "$ 倍", v: fmt(k), why: "電圧は2乗で効く"}, {t: "$" + fmt(h) + "$ 倍", v: fmt(h), why: "$\\dfrac{1}{2}$ は電圧を変えても変わらない"}, {t: "$" + fmt(k3) + "$ 倍", v: fmt(k3), why: "2乗は2倍ではない"}]);
    return {form: "u18s1k", text: "コンデンサを充電する電圧を " + fmt(k) + " 倍にした。静電エネルギーは元の何倍になるか。", fig: {kind: "u18s1cv", L: tbU18s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} C V^2$：$V$ の2乗に比例", "$" + fmt(k) + "^2 = " + fmt(k2) + "$ 倍"], chk: {form: "u18s1k", p: {k: k}}};
  }
  throw new Error("u18s1k：条件に合う数字が見つからない");
}
function tbU18s1_Qc(r){
  var gcd = tbU18s1_gcd, ratio = tbU18s1_ratio, par = tbU18s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [1,2,3,4,5,6,8,10]);
    var v = pick(r, [2,3,4,5,6,10]);
    var W = (c * v * v / 2);
    var A = (W / (v * v));
    var B = (2 * W / v);
    var D = (2 * W * v * v);
    if (!(c != v && nice(W) && nice(A) && distinct([c, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(c) + "\\,\\mathrm{F}$", v: fmt(c)}, {t: "$" + fmt(A) + "\\,\\mathrm{F}$", v: fmt(A), why: "$\\dfrac{1}{2}$ の分の 2 を掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{F}$", v: fmt(B), why: "電圧を2乗していない"}, {t: "$" + fmt(D) + "\\,\\mathrm{F}$", v: fmt(D), why: "電圧の2乗で割るのでなく掛けた"}]);
    return {form: "u18s1c", text: "コンデンサを $" + fmt(v) + "\\,\\mathrm{V}$ の電源につないで充電すると、静電エネルギーは $" + fmt(W) + "\\,\\mathrm{J}$ だった。静電容量は何 F か。", fig: {kind: "u18s1cv", L: tbU18s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, [["c", "{C}"], ["v", "{V}=" + fmt(v) + " V"], ["src", "{V}=" + fmt(v) + " V"], ["w", "{W}=" + fmt(W) + " J"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} C V^2$ より $C = \\dfrac{2W}{V^2}$", "$C = \\dfrac{2 \\times " + fmt(W) + "}{" + fmt(v) + "^2} = " + fmt(c) + "\\,\\mathrm{F}$"], chk: {form: "u18s1c", p: {c: c, v: v}}};
  }
  throw new Error("u18s1c：条件に合う数字が見つからない");
}
function tbU18s1_Qwhat(r){
  var gcd = tbU18s1_gcd, ratio = tbU18s1_ratio, par = tbU18s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "充電されたコンデンサが持っているエネルギー", v: "own"}, {t: "コンデンサに蓄えられた電荷", v: "q", why: "電荷は $Q$［C］。静電エネルギーは $W$［J］"}, {t: "コンデンサの静電容量", v: "c", why: "静電容量は $C$［F］。静電エネルギーは $W$［J］"}, {t: "コンデンサの極板間の電圧", v: "v", why: "電圧は $V$［V］。静電エネルギーは $W$［J］"}]);
    return {form: "u18s1what", text: "静電エネルギーとは、□ である。", fig: {kind: "u18s1cv", L: tbU18s1_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["充電されたコンデンサが持っているエネルギーを、静電エネルギーという。単位は J"], chk: {form: "u18s1what", p: {}}};
  }
  throw new Error("u18s1what：条件に合う数字が見つからない");
}
// 18-2 静電エネルギーの式の変形 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u18_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU18s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU18s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU18s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU18s2_par(a, b){ return a * b / (a + b); }
function tbU18s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU18s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU18s2_Qqc(r){
  var gcd = tbU18s2_gcd, ratio = tbU18s2_ratio, par = tbU18s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c = pick(r, [1,2,3,4,5,6,8,10]);
    var q = pick(r, [2,3,4,5,6,8,10,12,20]);
    var X = (q * q / (2 * c));
    var A = (q * q / c);
    var B = (q / (2 * c));
    var D = (q * q * c / 2);
    if (!(c != q && nice(X) && nice(B) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{J}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A), why: "2 で割っていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "電荷を2乗していない"}, {t: "$" + fmt(D) + "\\,\\mathrm{J}$", v: fmt(D), why: "静電容量で割るのでなく掛けた"}]);
    return {form: "u18s2qc", text: "静電容量 $" + fmt(c) + "\\,\\mathrm{F}$ のコンデンサに $" + fmt(q) + "\\,\\mathrm{C}$ の電荷が蓄えられている。コンデンサの静電エネルギーは何 J か。", fig: {kind: "u18s2cv", L: tbU18s2_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, [["c", "{C}=" + fmt(c) + " F"], ["q", "{Q}=" + fmt(q) + " C"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{Q^2}{2C}$", "$W = \\dfrac{" + fmt(q) + "^2}{2 \\times " + fmt(c) + "} = " + fmt(X) + "\\,\\mathrm{J}$"], chk: {form: "u18s2qc", p: {c: c, q: q}}};
  }
  throw new Error("u18s2qc：条件に合う数字が見つからない");
}
function tbU18s2_Qqv(r){
  var gcd = tbU18s2_gcd, ratio = tbU18s2_ratio, par = tbU18s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var q = pick(r, [1,2,3,4,5,6,8,10,12]);
    var v = pick(r, [2,3,4,5,6,10,12]);
    var X = (q * v / 2);
    var A = (q * v);
    var B = (q * v * v / 2);
    var D = (q * q * v / 2);
    if (!(q != v && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mathrm{J}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A), why: "$\\dfrac{1}{2}$ を掛けていない"}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "電圧を2乗した（$\\dfrac{1}{2} QV$ に2乗は無い）"}, {t: "$" + fmt(D) + "\\,\\mathrm{J}$", v: fmt(D), why: "電荷を2乗した（$\\dfrac{1}{2} QV$ に2乗は無い）"}]);
    return {form: "u18s2qv", text: "コンデンサに $" + fmt(v) + "\\,\\mathrm{V}$ の電圧を加えると、$" + fmt(q) + "\\,\\mathrm{C}$ の電荷が蓄えられた。コンデンサの静電エネルギーは何 J か。", fig: {kind: "u18s2cv", L: tbU18s2_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, [["src", "{V}=" + fmt(v) + " V"], ["v", "{V}=" + fmt(v) + " V"], ["q", "{Q}=" + fmt(q) + " C"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$W = \\dfrac{1}{2} QV$", "$W = \\dfrac{1}{2} \\times " + fmt(q) + " \\times " + fmt(v) + " = " + fmt(X) + "\\,\\mathrm{J}$"], chk: {form: "u18s2qv", p: {q: q, v: v}}};
  }
  throw new Error("u18s2qv：条件に合う数字が見つからない");
}
function tbU18s2_Qeq(r){
  var gcd = tbU18s2_gcd, ratio = tbU18s2_ratio, par = tbU18s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? '$\\dfrac{1}{2} QV$' : '$\\dfrac{Q^2}{2C}$');
    var _c = choices(r, [{t: String(nm), v: "good"}, {t: "$\\dfrac{1}{2} Q V^2$", v: "qv2", why: "$CV$ を $Q$ に置き換えると、残る $V$ は1つ"}, {t: "$\\dfrac{Q}{2C}$", v: "qc", why: "$\\dfrac{1}{2} QV$ の $V$ に $\\dfrac{Q}{C}$ を入れるので、$Q$ は2乗"}, {t: "$\\dfrac{1}{2} Q^2 C$", v: "q2c", why: "$V = \\dfrac{Q}{C}$ なので、$C$ は分母"}]);
    return {form: "u18s2eq", text: "静電エネルギーの式 $W = \\dfrac{1}{2} C V^2$ と等しい式は □ である。", fig: {kind: "u18s2cv", L: tbU18s2_fig({"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$Q = CV$ で置き換える", "$W = \\dfrac{1}{2} C V^2 = \\dfrac{1}{2} QV = \\dfrac{Q^2}{2C}$"], chk: {form: "u18s2eq", p: {k: k}}};
  }
  throw new Error("u18s2eq：条件に合う数字が見つからない");
}
// 18-3 直列の電圧と電荷 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u18_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU18s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU18s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU18s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU18s3_par(a, b){ return a * b / (a + b); }
function tbU18s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU18s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU18s3_Qq(r){
  var gcd = tbU18s3_gcd, ratio = tbU18s3_ratio, par = tbU18s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [10,20,30,40,50,60]);
    var c2 = pick(r, [10,20,30,40,50,60]);
    var m = pick(r, [1,2,3,4,5,10]);
    var g = (gcd(c1, c2));
    var V = (m * (c1 + c2) / g);
    var V1 = (V * c2 / (c1 + c2));
    var X = (c1 * V1);
    var A = (c1 * V);
    var B = (c1 * V * c1 / (c1 + c2));
    var D = ((c1 + c2) * V);
    if (!(c1 != c2 && V >= 10 && V <= 200 && nice(V1) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mu\\mathrm{C}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mu\\mathrm{C}$", v: fmt(A), why: "$C_1$ に電源の電圧が全部かかると考えた"}, {t: "$" + fmt(B) + "\\,\\mu\\mathrm{C}$", v: fmt(B), why: "電圧を静電容量の比のまま分けた（逆比で分ける）"}, {t: "$" + fmt(D) + "\\,\\mu\\mathrm{C}$", v: fmt(D), why: "直列の静電容量を足した"}]);
    return {form: "u18s3q", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につなぎ、$" + fmt(V) + "\\,\\mathrm{V}$ の電圧を加えた。各コンデンサに蓄えられる電荷は何 μC か。", fig: {kind: "u18s3ser", L: tbU18s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2","q1":"{Q}","q2":"{Q}"}, [["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"], ["src", "{V}=" + fmt(V) + " V"], ["_v", {"c1": (c1), "c2": (c2)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電圧は逆比で $V_1 = " + fmt(V) + " \\times \\dfrac{" + fmt(c2) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + fmt(V1) + "\\,\\mathrm{V}$", "$Q = C_1 V_1 = " + fmt(c1) + " \\times " + fmt(V1) + " = " + fmt(X) + "\\,\\mu\\mathrm{C}$"], chk: {form: "u18s3q", p: {c1: c1, c2: c2, V: V}}};
  }
  throw new Error("u18s3q：条件に合う数字が見つからない");
}
function tbU18s3_Qv(r){
  var gcd = tbU18s3_gcd, ratio = tbU18s3_ratio, par = tbU18s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [10,20,30,40,50,60]);
    var c2 = pick(r, [10,20,30,40,50,60]);
    var m = pick(r, [1,2,3,4,5,10]);
    var k = pick(r, [1,2]);
    var g = (gcd(c1, c2));
    var V = (m * (c1 + c2) / g);
    var Ck = (k == 1 ? c1 : c2);
    var Co = (k == 1 ? c2 : c1);
    if (!(c1 != c2 && V >= 10 && V <= 200)) continue;
    var ok = (V * Co / (c1 + c2));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU18s3_three(ok, [{x: (V * Ck / (c1 + c2)), why: "静電容量の比のまま分けた（逆比で分ける）"}, {x: (V / 2), why: "等しく分かれると考えた"}, {x: (V), why: "電源の電圧がそのままかかると考えた"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u18s3v", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につなぎ、$" + qv(V, "V") + "$ の電圧を加えた。$C_" + fmt(k) + "$ にかかる電圧は何 V か。", fig: {kind: "u18s3ser", L: tbU18s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2","q1":"{Q}","q2":"{Q}"}, [["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"], ["src", "{V}=" + qf(V, "V")], ["v" + fmt(k), "{V}_" + fmt(k)], ["_v", {"c1": (c1), "c2": (c2)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$V_1 : V_2$ は静電容量の逆比で $" + String(ratio([c2, c1])) + "$", "$V_" + fmt(k) + " = " + fmt(V) + " \\times \\dfrac{" + fmt(Co) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + qv(ok, "V") + "$"], chk: {form: "u18s3v", p: {V: V, c1: c1, c2: c2, k: k}}};
  }
  throw new Error("u18s3v：条件に合う数字が見つからない");
}
function tbU18s3_Qq2(r){
  var gcd = tbU18s3_gcd, ratio = tbU18s3_ratio, par = tbU18s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [10,20,30,40,50,60]);
    var c2 = pick(r, [10,20,30,40,50,60]);
    var v1 = pick(r, [2,3,4,5,6,10,12,20]);
    var X = (c1 * v1);
    var A = (c2 * v1);
    var B = (c2 * c2 * v1 / c1);
    var D = ((c1 + c2) * v1);
    if (!(c1 != c2 && nice(B) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mu\\mathrm{C}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mu\\mathrm{C}$", v: fmt(A), why: "$C_2$ に $C_1$ の電圧を掛けた（電圧は違う）"}, {t: "$" + fmt(B) + "\\,\\mu\\mathrm{C}$", v: fmt(B), why: "$C_2$ の電圧を静電容量の比のまま出した（逆比で分かれる）"}, {t: "$" + fmt(D) + "\\,\\mu\\mathrm{C}$", v: fmt(D), why: "2つの静電容量を足して掛けた"}]);
    return {form: "u18s3q2", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ と $C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ のコンデンサを直列につないで電圧を加えると、$C_1$ の電圧は $" + fmt(v1) + "\\,\\mathrm{V}$ だった。$C_2$ に蓄えられる電荷は何 μC か。", fig: {kind: "u18s3ser", L: tbU18s3_fig({"src":"{V}","c1":"{C}_1","c2":"{C}_2","q1":"{Q}","q2":"{Q}"}, [["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"], ["v1", "{V}_1=" + fmt(v1) + " V"], ["q1", null], ["q2", "{Q}_2"], ["_v", {"c1": (c1), "c2": (c2)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので、$C_2$ の電荷は $C_1$ の電荷と同じ", "$Q = C_1 V_1 = " + fmt(c1) + " \\times " + fmt(v1) + " = " + fmt(X) + "\\,\\mu\\mathrm{C}$"], chk: {form: "u18s3q2", p: {c1: c1, c2: c2, v1: v1}}};
  }
  throw new Error("u18s3q2：条件に合う数字が見つからない");
}
// 18-4 電荷の合計は変わらない の練習（※ textbook/gen/make_section.py が textbook/gen/data/u18_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU18s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU18s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU18s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU18s4_par(a, b){ return a * b / (a + b); }
function tbU18s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU18s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU18s4_Qrest(r){
  var gcd = tbU18s4_gcd, ratio = tbU18s4_ratio, par = tbU18s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [100,200,300,400,500,600]);
    var b = pick(r, [100,200,300,400,500,600]);
    var p = pick(r, [1,2,3,4,5,6,7,8,9]);
    var T = (a + b);
    var a2 = (T * p / 10);
    var X = (T - a2);
    var dirs = (a2 > a ? 'rl' : 'lr');
    if (!(a2 != a && X != b && a2 != X && distinct([X, a2, T, b]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mu\\mathrm{C}$", v: fmt(X)}, {t: "$" + fmt(a2) + "\\,\\mu\\mathrm{C}$", v: fmt(a2), why: "2つの電荷が同じになるとは限らない。合計が変わらない"}, {t: "$" + fmt(T) + "\\,\\mu\\mathrm{C}$", v: fmt(T), why: "合計から左の電荷を引いていない"}, {t: "$" + fmt(b) + "\\,\\mu\\mathrm{C}$", v: fmt(b), why: "電荷は移動する。変わらないのは合計"}]);
    return {form: "u18s4rest", text: "$" + fmt(a) + "\\,\\mu\\mathrm{C}$ と $" + fmt(b) + "\\,\\mu\\mathrm{C}$ の電荷が蓄えられた2つのコンデンサを、同じ極性どうしつないだ。電荷が移動した後、左のコンデンサの電荷は $" + fmt(a2) + "\\,\\mu\\mathrm{C}$ になった。右のコンデンサの電荷は何 μC か。", fig: {kind: "u18s4rc", L: tbU18s4_fig({"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1","q2":"{Q}_2","dir":"lr"}, [["q1", "{Q}_1'=" + fmt(a2) + " μC"], ["q2", "{Q}_2'"], ["dir", String(dirs)]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計は $" + fmt(a) + " + " + fmt(b) + " = " + fmt(T) + "\\,\\mu\\mathrm{C}$ のまま", "$Q_2' = " + fmt(T) + " - " + fmt(a2) + " = " + fmt(X) + "\\,\\mu\\mathrm{C}$"], chk: {form: "u18s4rest", p: {a: a, b: b, a2: a2}}};
  }
  throw new Error("u18s4rest：条件に合う数字が見つからない");
}
function tbU18s4_Qsum(r){
  var gcd = tbU18s4_gcd, ratio = tbU18s4_ratio, par = tbU18s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var a = pick(r, [100,200,300,400,500,600]);
    var b = pick(r, [100,200,300,400,500,600]);
    var T = (a + b);
    var D = (abs(a - b));
    var H = ((a + b) / 2);
    var M = (max(a, b));
    if (!(a != b && distinct([T, D, H, M]))) continue;
    var _c = choices(r, [{t: "$" + fmt(T) + "\\,\\mu\\mathrm{C}$", v: fmt(T)}, {t: "$" + fmt(D) + "\\,\\mu\\mathrm{C}$", v: fmt(D), why: "同じ極性どうしなので、電荷は打ち消し合わない"}, {t: "$" + fmt(H) + "\\,\\mu\\mathrm{C}$", v: fmt(H), why: "合計でなく、2つの平均を出した"}, {t: "$" + fmt(M) + "\\,\\mu\\mathrm{C}$", v: fmt(M), why: "つながった部分の電荷は、どちらも合計に入る"}]);
    return {form: "u18s4sum", text: "$" + fmt(a) + "\\,\\mu\\mathrm{C}$ と $" + fmt(b) + "\\,\\mu\\mathrm{C}$ の電荷が蓄えられた2つのコンデンサを、同じ極性どうしつないだ。電荷が移動した後の、2つのコンデンサの電荷の合計は何 μC か。", fig: {kind: "u18s4rc", L: tbU18s4_fig({"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1","q2":"{Q}_2","dir":"lr"}, [["q1", "{Q}_1=" + fmt(a) + " μC"], ["q2", "{Q}_2=" + fmt(b) + " μC"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["つながった部分の電荷の合計は、移動しても変わらない", "$" + fmt(a) + " + " + fmt(b) + " = " + fmt(T) + "\\,\\mu\\mathrm{C}$"], chk: {form: "u18s4sum", p: {a: a, b: b}}};
  }
  throw new Error("u18s4sum：条件に合う数字が見つからない");
}
function tbU18s4_Qwhy(r){
  var gcd = tbU18s4_gcd, ratio = tbU18s4_ratio, par = tbU18s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "変わらない", v: "own"}, {t: "増える", v: "up", why: "極板の間は電気を通さないので、外から電荷は入らない"}, {t: "減る", v: "down", why: "極板の間は電気を通さないので、電荷は外へ出ない"}, {t: "0 になる", v: "zero", why: "同じ極性どうしなので、打ち消し合わない"}]);
    return {form: "u18s4why", text: "充電した2つのコンデンサを、同じ極性どうしつないだ。電気的につながった部分の電荷の合計は、電荷が移動すると □。", fig: {kind: "u18s4rc", L: tbU18s4_fig({"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1","q2":"{Q}_2","dir":"lr"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷はつながった部分の中だけを移動する", "合計は変わらない"], chk: {form: "u18s4why", p: {}}};
  }
  throw new Error("u18s4why：条件に合う数字が見つからない");
}
// 18-5 つなぎ替え の練習（※ textbook/gen/make_section.py が textbook/gen/data/u18_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU18s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU18s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU18s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU18s5_par(a, b){ return a * b / (a + b); }
function tbU18s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU18s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU18s5_Qv(r){
  var gcd = tbU18s5_gcd, ratio = tbU18s5_ratio, par = tbU18s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [10,20,30,40,50,60]);
    var c2 = pick(r, [10,20,30,40,50,60]);
    var v1 = pick(r, [10,20,30,40,50,60,80,100]);
    var v2 = pick(r, [10,20,30,40,50]);
    var T = (c1 * v1 + c2 * v2);
    var V = (T / (c1 + c2));
    var q1n = (c1 * T / (c1 + c2));
    var dirs = (v1 > V ? 'lr' : 'rl');
    if (!(v1 != v2 && c1 != c2 && nice(V) && Math.abs(V - Math.round(V)) < 1e-9 && V != (v1 + v2) / 2)) continue;
    var ok = (T / (c1 + c2));
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU18s5_three(ok, [{x: ((v1 + v2) / 2), why: "2つの電圧の平均を出した（電荷の合計を静電容量の合計で割る）"}, {x: (v1 + v2), why: "電圧を足した（同じ電圧になるまで移動するので、間の値になる）"}, {x: (c1 * v1 / (c1 + c2)), why: "$C_1$ の電荷だけを使った（合計は $C_2$ の電荷も入る）"}, {x: (c2 * v2 / (c1 + c2)), why: "$C_2$ の電荷だけを使った（合計は $C_1$ の電荷も入る）"}]);
    if (!_w) continue;
    var _c = num(r, null, "V", ok, _w);
    return {form: "u18s5v", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ のコンデンサを $" + qv(v1, "V") + "$ で、$C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ のコンデンサを $" + qv(v2, "V") + "$ で充電した。この2つを同じ極性どうしつなぐと、電荷が移動した後の電圧は何 V か。", fig: {kind: "u18s5rc", L: tbU18s5_fig({"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1","q2":"{Q}_2","v1":"{V}_1","v2":"{V}_2","dir":"lr"}, [["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"], ["v1", "{V}_1=" + qf(v1, "V")], ["v2", "{V}_2=" + qf(v2, "V")], ["dir", String(dirs)], ["_v", {"v1": (v1), "v2": (v2), "v": (V)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計 $" + fmt(c1) + " \\times " + fmt(v1) + " + " + fmt(c2) + " \\times " + fmt(v2) + " = " + fmt(T) + "\\,\\mu\\mathrm{C}$", "静電容量の比で分けて $Q_1' = " + fmt(T) + " \\times \\dfrac{" + fmt(c1) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + fmt(q1n) + "\\,\\mu\\mathrm{C}$", "$V = \\dfrac{Q_1'}{C_1} = \\dfrac{" + fmt(q1n) + "}{" + fmt(c1) + "} = " + qv(ok, "V") + "$"], chk: {form: "u18s5v", p: {c1: c1, c2: c2, v1: v1, v2: v2}}};
  }
  throw new Error("u18s5v：条件に合う数字が見つからない");
}
function tbU18s5_Qqk(r){
  var gcd = tbU18s5_gcd, ratio = tbU18s5_ratio, par = tbU18s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var c1 = pick(r, [10,20,30,40,50,60]);
    var c2 = pick(r, [10,20,30,40,50,60]);
    var v1 = pick(r, [10,20,30,40,50,60,80,100]);
    var v2 = pick(r, [10,20,30,40,50]);
    var k = pick(r, [1,2]);
    var T = (c1 * v1 + c2 * v2);
    var V = (T / (c1 + c2));
    var Ck = (k == 1 ? c1 : c2);
    var Co = (k == 1 ? c2 : c1);
    var vk = (k == 1 ? v1 : v2);
    var X = (Ck * V);
    var A = (T / 2);
    var B = (T * Co / (c1 + c2));
    var D = (Ck * vk);
    var dirs = (v1 > V ? 'lr' : 'rl');
    if (!(v1 != v2 && c1 != c2 && nice(V) && nice(X) && nice(B) && distinct([X, A, B, D]))) continue;
    var _c = choices(r, [{t: "$" + fmt(X) + "\\,\\mu\\mathrm{C}$", v: fmt(X)}, {t: "$" + fmt(A) + "\\,\\mu\\mathrm{C}$", v: fmt(A), why: "等しく分かれると考えた（静電容量の比で分かれる）"}, {t: "$" + fmt(B) + "\\,\\mu\\mathrm{C}$", v: fmt(B), why: "静電容量の逆比で分けた（同じ電圧なので、電荷は静電容量に比例）"}, {t: "$" + fmt(D) + "\\,\\mu\\mathrm{C}$", v: fmt(D), why: "つなぐ前のまま（電圧が違うので、電荷は移動する）"}]);
    return {form: "u18s5qk", text: "静電容量 $C_1 = " + fmt(c1) + "\\,\\mu\\mathrm{F}$ のコンデンサを $" + qv(v1, "V") + "$ で、$C_2 = " + fmt(c2) + "\\,\\mu\\mathrm{F}$ のコンデンサを $" + qv(v2, "V") + "$ で充電した。この2つを同じ極性どうしつなぐと、電荷が移動した後の $C_" + fmt(k) + "$ の電荷は何 μC か。", fig: {kind: "u18s5rc", L: tbU18s5_fig({"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1","q2":"{Q}_2","v1":"{V}_1","v2":"{V}_2","dir":"lr"}, [["c1", "{C}_1=" + fmt(c1) + " μF"], ["c2", "{C}_2=" + fmt(c2) + " μF"], ["v1", "{V}_1=" + qf(v1, "V")], ["v2", "{V}_2=" + qf(v2, "V")], ["q" + fmt(k), "{Q}_" + fmt(k) + "'"], ["dir", String(dirs)], ["_v", {"v1": (v1), "v2": (v2), "v": (V)}]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電荷の合計 $" + fmt(c1) + " \\times " + fmt(v1) + " + " + fmt(c2) + " \\times " + fmt(v2) + " = " + fmt(T) + "\\,\\mu\\mathrm{C}$ を静電容量の比で分ける", "$Q_" + fmt(k) + "' = " + fmt(T) + " \\times \\dfrac{" + fmt(Ck) + "}{" + fmt(c1) + " + " + fmt(c2) + "} = " + fmt(X) + "\\,\\mu\\mathrm{C}$"], chk: {form: "u18s5qk", p: {c1: c1, c2: c2, v1: v1, v2: v2, k: k}}};
  }
  throw new Error("u18s5qk：条件に合う数字が見つからない");
}
function tbU18s5_Qstop(r){
  var gcd = tbU18s5_gcd, ratio = tbU18s5_ratio, par = tbU18s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "2つのコンデンサの電圧が同じになった", v: "own"}, {t: "2つのコンデンサの電荷が同じになった", v: "q", why: "電荷が同じになるのでなく、電圧が同じになる"}, {t: "片方のコンデンサの電荷が 0 になった", v: "zero", why: "電圧が同じになった所で止まる"}, {t: "電荷の合計が 0 になった", v: "sum", why: "電荷の合計は変わらない"}]);
    return {form: "u18s5stop", text: "電圧の違う2つのコンデンサを同じ極性どうしつなぐと、電荷が移動する。電荷の移動が止まるのは、□ 時である。", fig: {kind: "u18s5rc", L: tbU18s5_fig({"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1","q2":"{Q}_2","v1":"{V}_1","v2":"{V}_2","dir":"lr"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電位差がある間は電流が流れる", "2つの電圧が同じになると止まる"], chk: {form: "u18s5stop", p: {}}};
  }
  throw new Error("u18s5stop：条件に合う数字が見つからない");
}
var GEN = {
  // 18-1 静電エネルギー
  1: function(r){ return pick(r, [tbU18s1_Qw, tbU18s1_Qw, tbU18s1_Qw, tbU18s1_Qw, tbU18s1_Qk, tbU18s1_Qk, tbU18s1_Qc, tbU18s1_Qc, tbU18s1_Qwhat])(r); },
  // 18-2 静電エネルギーの式の変形
  2: function(r){ return pick(r, [tbU18s2_Qqc, tbU18s2_Qqc, tbU18s2_Qqc, tbU18s2_Qqv, tbU18s2_Qqv, tbU18s2_Qqv, tbU18s2_Qeq, tbU18s2_Qeq])(r); },
  // 18-3 直列の電圧と電荷
  3: function(r){ return pick(r, [tbU18s3_Qq, tbU18s3_Qq, tbU18s3_Qq, tbU18s3_Qq, tbU18s3_Qv, tbU18s3_Qv, tbU18s3_Qq2, tbU18s3_Qq2])(r); },
  // 18-4 電荷の合計は変わらない
  4: function(r){ return pick(r, [tbU18s4_Qrest, tbU18s4_Qrest, tbU18s4_Qrest, tbU18s4_Qrest, tbU18s4_Qsum, tbU18s4_Qsum, tbU18s4_Qwhy])(r); },
  // 18-5 つなぎ替え
  5: function(r){ return pick(r, [tbU18s5_Qv, tbU18s5_Qv, tbU18s5_Qv, tbU18s5_Qv, tbU18s5_Qqk, tbU18s5_Qqk, tbU18s5_Qqk, tbU18s5_Qstop])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t18s1e","scene":"t18s1e","kind":"u18s1cv","lab":{"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"},"viewbox":"464 226 595 408","band":{"want":"コンデンサが持つエネルギー","ans":"$W = \\dfrac{1}{2} C V^2$","full":"充電されたコンデンサが持っているエネルギーを静電エネルギーという。単位は J。電源の電圧 V で充電した静電容量 C のコンデンサの静電エネルギーは W = (1/2)CV²。"},"narr":{"start":{"co":1,"qd":0,"wd":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"①充電\n②静電エネルギー\n③式\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"直流電源にコンデンサをつなぎます。時間がたつほど、電流は流れにくくなります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","C"]},{"text":"やがて電流は 0 A になります。この時、〖コンデンサの電圧は電源と同じ $V$〗です。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"q","emph":["V","Q","src"],"zb":true}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"充電されたコンデンサは、エネルギーを持っています。これを〖静電エネルギー〗といいます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"w","emph":["W"]},{"text":"エネルギーなので、単位はジュール J です。","at":{"強調":1.0},"after":[],"emph":["W"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"静電エネルギーは、次の式で求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["W","C","V","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"]]}],"emphPre":["W","C","V","src"]},{"text":"〖電圧は2乗〗です。この式は、そのまま覚えます。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["W","V","src"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"zhi":["u18s1cvL","u18s1cvw1","zbu18s1cv0hi"],"zlo":["u18s1cvRw","u18s1cvw2","zbu18s1cv1lo"],"Q":["qp0","qp1","qm0","qm1"],"W":["wt0","wt1"]},"moves":{"q":{"to":{"qd":1},"dur":0.6},"w":{"to":{"wd":1},"dur":0.5}},"route":["充電","静電エネルギー","式"]}},{"id":"t18s1x","scene":"t18s1x","kind":"u18s1cv","lab":{"src":"{V}=3 V","c":"{C}=4 F","q":"{Q}","v":"{V}=3 V","w":["{W}","{W}=18 J"]},"viewbox":"464 226 595 408","band":{"want":"静電エネルギー $W$","known":"$C = 4\\,\\mathrm{F},\\;\\; V = 3\\,\\mathrm{V}$","ans":"$W = 18\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"qd":1,"wd":1,"wv":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、静電エネルギー $W$ です。","at":{"強調":1.0},"after":[],"emph":["W"]},{"text":"①式を書く\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["W"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"静電エネルギーの式を使います。〖電圧は2乗〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W","C","V","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2"]]}],"emphPre":["W","C","V","src"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$C = 4$、$V = 3$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"w","emph":["W","C","V","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} \\times 4 \\times 3^2"],["= \\dfrac{1}{2} \\times 4 \\times 9 = 18\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["W","C","V","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"zhi":["u18s1cvL","u18s1cvw1","zbu18s1cv0hi"],"zlo":["u18s1cvRw","u18s1cvw2","zbu18s1cv1lo"],"Q":["qp0","qp1","qm0","qm1"],"W":["wt0","wt1"]},"moves":{"w":{"to":{"wv":1},"dur":0.5}},"route":["式を書く","数を入れる"]}},{"id":"t18s2e","scene":"t18s2e","kind":"u18s2cv","lab":{"src":"{V}","c":"{C}","q":"{Q}","v":"{V}","w":"{W}"},"viewbox":"464 226 595 408","band":{"want":"電荷を使った静電エネルギーの式","ans":"$W = \\dfrac{1}{2} QV = \\dfrac{Q^2}{2C}$","full":"W = (1/2)CV² の CV を Q に置き換えると W = (1/2)QV。V = Q / C を入れると W = Q² /（2C）。覚えるのは W = (1/2)CV² と Q = CV だけ。"},"narr":{"start":{"co":1,"qd":1,"wd":1},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"①$Q$ に置き換える\n②$V$ を入れ替える\n③覚える物\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","V"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"静電エネルギーの式から始めます。$V^2$ を $V \\times V$ と見ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W","C","V","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2 = \\dfrac{1}{2} CV \\times V"]]}],"emphPre":["W","C","V","src"]},{"text":"$Q = CV$ なので、〖$CV$ の所を $Q$ に置き換えます〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["W","Q","V","src","C"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} QV"]]}],"emphPre":["Q","C","V","src"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$Q = CV$ から $V = \\dfrac{Q}{C}$ です。これを $\\dfrac{1}{2} QV$ の $V$ に入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["W","Q","C","src","V"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} Q \\times \\dfrac{Q}{C}"],["= \\dfrac{Q^2}{2C}"]]}],"emphPre":["V","Q","C","src","W"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"3つとも覚える必要はありません。〖$W = \\dfrac{1}{2} C V^2$ と $Q = CV$ を覚えておけば〗、式を変形して出せます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["W","Q","C","V","src"],"eq":[{"cont":false,"items":[["W = \\dfrac{1}{2} C V^2","= \\dfrac{1}{2} QV = \\dfrac{Q^2}{2C}"]]}],"ans":true,"emphPre":["W","src","V","C"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"zhi":["u18s2cvL","u18s2cvw1","zbu18s2cv0hi"],"zlo":["u18s2cvRw","u18s2cvw2","zbu18s2cv1lo"],"Q":["qp0","qp1","qm0","qm1"],"W":["wt0","wt1"]},"moves":{},"route":["Q に置き換える","V を入れ替える","覚える物"]}},{"id":"t18s2x","scene":"t18s2x","kind":"u18s2cv","lab":{"src":"{V}","c":"{C}=3 F","q":"{Q}=6 C","v":"{V}","w":["{W}","{W}=6 J"]},"viewbox":"464 226 595 408","band":{"want":"静電エネルギー $W$","known":"$C = 3\\,\\mathrm{F},\\;\\; Q = 6\\,\\mathrm{C}$","ans":"$W = 6\\,\\mathrm{J}$"},"narr":{"start":{"co":1,"qd":1,"wd":1,"wv":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、静電エネルギー $W$ です。分かっているのは静電容量と電荷です。","at":{"強調":1.0},"after":[],"emph":["W","C","Q"]},{"text":"①使う式を選ぶ\n②数を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["W"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電圧が分からないので、〖$C$ と $Q$ の式〗を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["W","C","Q"],"eq":[{"cont":false,"items":[["W = \\dfrac{Q^2}{2C}"]]}],"emphPre":["W","C","Q"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$Q = 6$、$C = 3$ を入れます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"w","emph":["W","C","Q"],"eq":[{"cont":false,"items":[["W = \\dfrac{6^2}{2 \\times 3}"],["= \\dfrac{36}{6} = 6\\,\\mathrm{J}"]]}],"ans":true,"emphPre":["W","C","Q"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C":["c","ct0","ct1","c:b","c:l1","c:l2"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"zhi":["u18s2cvL","u18s2cvw1","zbu18s2cv0hi"],"zlo":["u18s2cvRw","u18s2cvw2","zbu18s2cv1lo"],"Q":["qp0","qp1","qm0","qm1"],"W":["wt0","wt1"]},"moves":{"w":{"to":{"wv":1},"dur":0.5}},"route":["使う式を選ぶ","数を入れる"]}},{"id":"t18s3e","scene":"t18s3e","kind":"u18s3ser","lab":{"src":"{V}=50 V","c1":"{C}_1=20 μF","c2":"{C}_2=30 μF","q1":"{Q}","q2":"{Q}","v1":["{V}_1","{V}_1=30 V"],"v2":["{V}_2","{V}_2=20 V"],"_v":{"c1":20,"c2":30}},"viewbox":"464 226 595 408","band":{"want":"直列のコンデンサの電圧と電荷","ans":"電圧は逆比で分け、電荷は $Q = C_1 V_1$（どちらも同じ）","full":"直列のコンデンサの電圧は静電容量の逆比で分かれる。電荷は Q = CV で1つ求めれば、直列なのでもう一方も同じ。μ（マイクロ）の付いた単位のまま計算する。"},"narr":{"start":{"co":1,"qd":1,"v1v":0,"v2v":0,"q1v":0,"q2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"①電圧の比\n②電圧\n③電荷\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$20\\,\\mu\\mathrm{F}$ と $30\\,\\mu\\mathrm{F}$ のコンデンサを直列につなぎ、50 V を加えます。μ が付いた単位のまま計算します。μ はマイクロと読みます。","at":{"強調":1.0},"after":[],"emph":["C1","C2","src"]},{"text":"直列なので、〖電圧の比は静電容量の逆比〗です。$20 : 30 = 2 : 3$ なので、電圧は $3 : 2$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["V1","V2"],"eq":[{"cont":false,"items":[["V_1 : V_2 = 3 : 2"]]}],"emphPre":["C1","C2","V1","V2"],"zb":true}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"50 V を $3 : 2$ に分けると、30 V と 20 V です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"v","emph":["V1","V2"],"eq":[{"cont":false,"items":[["V_1 = 50 \\times \\dfrac{3}{3 + 2} = 30\\,\\mathrm{V}","V_2 = 50 - 30 = 20\\,\\mathrm{V}"]]}],"emphPre":["V1","V2","src"],"zb":true}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電荷は $Q = CV$ で求めます。$C_1$ の電荷です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"move":"q1","emph":["Q1","C1","V1","src"],"eq":[{"cont":false,"items":[["Q = C_1 V_1 = 20 \\times 30","= 600\\,\\mu\\mathrm{C}"]]}],"emphPre":["Q1","C1","V1","src"]},{"text":"直列なので、$C_2$ にも〖同じ電荷〗が蓄えられます。$C_2 V_2$ で求めても同じです。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"q2","emph":["Q2","C2","V2","src"],"eq":[{"cont":false,"items":[["C_2 V_2 = 30 \\times 20 = 600\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["Q2","C2","V2","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u18s3serL","u18s3serw1","zbu18s3ser0hi"],"zlo":["u18s3serRw","u18s3serw3","zbu18s3ser1lo"],"zmid":["u18s3serw2","zbu18s3ser2mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{"v":{"to":{"v1v":1,"v2v":1},"dur":0.5},"q1":{"to":{"q1v":1},"dur":0.5},"q2":{"to":{"q2v":1},"dur":0.5}},"route":["電圧の比","電圧","電荷"]}},{"id":"t18s3x","scene":"t18s3x","kind":"u18s3ser","lab":{"src":"{V}=40 V","c1":"{C}_1=10 μF","c2":"{C}_2=40 μF","q1":"{Q}","q2":"{Q}","v1":["{V}_1","{V}_1=32 V"],"v2":"{V}_2","_v":{"c1":10,"c2":40}},"viewbox":"464 226 595 408","band":{"want":"各コンデンサに蓄えられる電荷 $Q$","known":"$V = 40\\,\\mathrm{V},\\;\\; C_1 = 10\\,\\mu\\mathrm{F},\\;\\; C_2 = 40\\,\\mu\\mathrm{F}$","ans":"$Q = 320\\,\\mu\\mathrm{C}$"},"narr":{"start":{"co":1,"qd":1,"v1v":0,"q1v":0,"q2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、各コンデンサに蓄えられる電荷 $Q$ です。","at":{"強調":1.0},"after":[],"emph":["Q1","Q2"]},{"text":"①電圧を求める\n②電荷を求める\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$10 : 40 = 1 : 4$ なので、電圧は〖逆比の $4 : 1$〗です。40 V を分けます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"v","emph":["V1"],"eq":[{"cont":false,"items":[["V_1 = 40 \\times \\dfrac{4}{4 + 1} = 32\\,\\mathrm{V}"]]}],"emphPre":["V1","C1","C2","src"],"zb":true}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$C_1$ の電荷を $Q = CV$ で求めます。直列なので、$C_2$ も〖同じ電荷〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"q","emph":["Q1","Q2","C1","V1","src","C2"],"eq":[{"cont":false,"items":[["Q = C_1 V_1 = 10 \\times 32","= 320\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["Q1","Q2","C1","V1","src","C2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"C1":["c1","c1t0","c1t1","c1:b","c1:l1","c1:l2"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"C2":["c2","c2t0","c2t1","c2:b","c2:l1","c2:l2"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"zhi":["u18s3serL","u18s3serw1","zbu18s3ser0hi"],"zlo":["u18s3serRw","u18s3serw3","zbu18s3ser1lo"],"zmid":["u18s3serw2","zbu18s3ser2mid"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"]},"moves":{"v":{"to":{"v1v":1},"dur":0.5},"q":{"to":{"q1v":1,"q2v":1},"dur":0.5}},"route":["電圧を求める","電荷を求める"]}},{"id":"t18s4e","scene":"t18s4e","kind":"u18s4rc","lab":{"c1":"{C}_1","c2":"{C}_2","q1":["{Q}_1=200 μC","{Q}_1'"],"q2":["{Q}_2=100 μC","{Q}_2'"],"dir":"lr"},"viewbox":"246 198 738 454","band":{"want":"つないだ後の電荷","ans":"電気的につながった部分の電荷の合計は変わらない","full":"充電した2つのコンデンサを同じ極性どうしつなぐ。極板と線でつながった部分の電荷は移動するが、極板の間は電気を通さないので、つながった部分の電荷の合計は変わらない。"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0,"q1v":0,"q2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"①つなぎ方\n②つながった部分\n③合計は変わらない\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"充電した2つのコンデンサを、正の極板どうし、負の極板どうしでつなぎます。間にスイッチがあります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["C1","C2","SW"]},{"text":"左に $200\\,\\mu\\mathrm{C}$、右に $100\\,\\mu\\mathrm{C}$ の電荷が蓄えられています。","at":{"強調":1.0},"after":[],"emph":["Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"スイッチを閉じると、上の2枚の極板と線は、電気的につながります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"sw","emph":["Iso"]},{"text":"コンデンサの極板の間は、電気を通しません。電荷は、〖つながった部分の中だけ〗を移動します。","at":{"強調":1.0},"after":[],"emph":["Iso","C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"なので、〖つながった部分の電荷の合計は、電荷が移動しても変わりません〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Q1","Q2"],"eq":[{"cont":false,"items":[["Q_1 + Q_2 = 200 + 100","= 300\\,\\mu\\mathrm{C}"]]}],"emphPre":["Iso"]},{"text":"移動した後の電荷を $Q_1'$、$Q_2'$ とします。合計は 300 のままです。","at":{"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"move":"mv","emph":["Q1","Q2"],"eq":[{"cont":false,"items":[["Q_1' + Q_2' = 300\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["Q1","Q2"]}]}],"groups":{"C1":["c1","c1:b","c1t0","c1t1"],"C2":["c2","c2:b","c2t0","c2t1"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"SW":["swp0","swp1","sw","swo"],"V1":["v1a","v1a:h","v1t0","v1t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"Iso":["iso"],"Iso2":["iso2"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"mv":{"to":{"mvq":1,"q1v":1,"q2v":1},"dur":1.2}},"route":["つなぎ方","つながった部分","合計は変わらない"]}},{"id":"t18s4x","scene":"t18s4x","kind":"u18s4rc","lab":{"c1":"{C}_1","c2":"{C}_2","q1":["{Q}_1=200 μC","{Q}_1'=120 μC"],"q2":["{Q}_2=100 μC","{Q}_2'"],"dir":"lr"},"viewbox":"246 198 738 454","band":{"want":"移動した後の右の電荷 $Q_2'$","known":"前は $200\\,\\mu\\mathrm{C}$ と $100\\,\\mu\\mathrm{C}$、後の左は $120\\,\\mu\\mathrm{C}$","ans":"$Q_2' = 180\\,\\mu\\mathrm{C}$"},"narr":{"start":{"co":1,"swc":1,"isod":1,"mvq":1,"q1v":0,"q2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、移動した後の、右の電荷 $Q_2'$ です。","at":{"強調":1.0},"after":[],"emph":["Q2"]},{"text":"①合計を出す\n②合計から引く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Q2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"〖つながった部分の電荷の合計は、移動の前と同じ〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q1","Q2"],"eq":[{"cont":false,"items":[["200 + 100 = 300\\,\\mu\\mathrm{C}"]]}],"emphPre":["Iso","Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"後の左は $120\\,\\mu\\mathrm{C}$ なので、残りが右の電荷です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"move":"q","emph":["Q2"],"eq":[{"cont":false,"items":[["Q_2' = 300 - 120 = 180\\,\\mu\\mathrm{C}"]]}],"ans":true,"emphPre":["Q1","Q2"]}]}],"groups":{"C1":["c1","c1:b","c1t0","c1t1"],"C2":["c2","c2:b","c2t0","c2t1"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"SW":["swp0","swp1","sw","swo"],"V1":["v1a","v1a:h","v1t0","v1t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"Iso":["iso"],"Iso2":["iso2"]},"moves":{"q":{"to":{"q1v":1,"q2v":1},"dur":0.5}},"route":["合計を出す","合計から引く"]}},{"id":"t18s5e","scene":"t18s5e","kind":"u18s5rc","lab":{"c1":"{C}_1","c2":"{C}_2","q1":["{Q}_1","{Q}_1'"],"q2":["{Q}_2","{Q}_2'"],"v1":["{V}_1","{V}"],"v2":["{V}_2","{V}"],"dir":"lr","_v":{"v1":3,"v2":1,"v":2}},"viewbox":"-36 111 1302 627","band":{"want":"つなぎ替えた後の電荷と電圧","ans":"同じ電圧になるまで電荷が移動する","full":"電圧の違う2つのコンデンサを同じ極性どうしつなぐと、電位差があるので電荷が移動する。2つの電圧が同じになると止まる。電荷の合計を静電容量の比で分け、V = Q1' / C1 で電圧を求める。"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0,"v1v":0,"v2v":0,"q1v":0,"q2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"①電荷が移動する\n②同じ電圧\n③比で分ける\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電圧の違う2つのコンデンサを、同じ極性どうしつなぎます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V1","V2"]},{"text":"スイッチを閉じると、電位差があるので電流が流れます。電荷が移動します。","at":{"動き":1.0,"強調":1.0},"after":[],"move":"sw","emph":["SW","Iso"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電荷は、〖2つのコンデンサの電圧が同じになるまで〗移動して、そこで止まります。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"mv","emph":["V1","V2","Q1","Q2"]},{"text":"電圧は $V = \\dfrac{Q}{C}$ なので、移動した後は次の式が成り立ちます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Q1","Q2","C1","C2","V1","V2"],"eq":[{"cont":false,"items":[["\\dfrac{Q_1'}{C_1} = \\dfrac{Q_2'}{C_2}"]]}],"emphPre":["Q1","Q2","C1","C2","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"なので、移動した後の電荷は〖静電容量に比例〗します。合計は変わらないので、合計を静電容量の比で分けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["Q1","Q2","C1","C2"],"eq":[{"cont":false,"items":[["Q_1' : Q_2' = C_1 : C_2"]]}],"emphPre":["Q1","Q2","C1","C2"]},{"text":"分けた電荷を静電容量で割ると、電圧が出ます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["V1","Q1","C1","V2"],"eq":[{"cont":false,"items":[["V = \\dfrac{Q_1'}{C_1}"]]}],"ans":true,"emphPre":["V1","Q1","C1","V2"]}]}],"groups":{"C1":["c1","c1:b","c1t0","c1t1"],"C2":["c2","c2:b","c2t0","c2t1"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"SW":["swp0","swp1","sw","swo"],"V1":["v1a","v1a:h","v1t0","v1t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"Iso":["iso"],"Iso2":["iso2"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"mv":{"to":{"mvq":1,"v1v":1,"v2v":1,"q1v":1,"q2v":1},"dur":1.2}},"route":["電荷が移動する","同じ電圧","比で分ける"]}},{"id":"t18s5x","scene":"t18s5x","kind":"u18s5rc","lab":{"c1":"{C}_1=20 μF","c2":"{C}_2=30 μF","q1":["{Q}_1=1000 μC","{Q}_1'=520 μC"],"q2":["{Q}_2=300 μC","{Q}_2'=780 μC"],"v1":["{V}_1=50 V","{V}=26 V"],"v2":["{V}_2=10 V","{V}=26 V"],"dir":"lr","_v":{"v1":50,"v2":10,"v":26}},"viewbox":"-36 111 1302 627","band":{"want":"つないだ後の電圧 $V$","known":"$C_1 = 20\\,\\mu\\mathrm{F}$ を $50\\,\\mathrm{V}$、$C_2 = 30\\,\\mu\\mathrm{F}$ を $10\\,\\mathrm{V}$ で充電","ans":"$V = 26\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"swc":0,"isod":0,"mvq":0,"v1v":0,"v2v":0,"q1v":0,"q2v":0},"steps":[{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"求めるのは、つないで電荷が移動した後の電圧 $V$ です。","at":{"強調":1.0},"after":[],"emph":["V1","V2"]},{"text":"①前の電荷\n②合計を比で分ける\n③電圧\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V1","V2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"$Q = CV$ で、つなぐ前の電荷を求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["Q1","Q2"],"eq":[{"cont":false,"items":[["Q_1 = 20 \\times 50 = 1000\\,\\mu\\mathrm{C}","Q_2 = 30 \\times 10 = 300\\,\\mu\\mathrm{C}"]]}],"emphPre":["Q1","Q2","C1","C2","V1","V2"]},{"text":"合計は $1300\\,\\mu\\mathrm{C}$ です。〖つないだ後も変わりません〗。","at":{"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"move":"sw","emph":["Q1","Q2"],"eq":[{"cont":false,"items":[["1000 + 300 = 1300\\,\\mu\\mathrm{C}"]]}],"emphPre":["Iso","Q1","Q2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"移動した後の電荷は、〖静電容量の比〗 $20 : 30 = 2 : 3$ に分かれます。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"move":"q","emph":["Q1","C1"],"eq":[{"cont":false,"items":[["Q_1' = 1300 \\times \\dfrac{2}{2 + 3}","= 520\\,\\mu\\mathrm{C}"]]}],"emphPre":["Q1","Q2","C1","C2"]}]},{"cap":null,"eqp":null,"vid":[30],"sents":[{"text":"電荷を静電容量で割って、電圧を出します。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"move":"v","emph":["V1","V2","Q1","C1"],"eq":[{"cont":false,"items":[["V = \\dfrac{Q_1'}{C_1} = \\dfrac{520}{20} = 26\\,\\mathrm{V}"]]}],"ans":true,"emphPre":["V1","V2","Q1","C1"]}]}],"groups":{"C1":["c1","c1:b","c1t0","c1t1"],"C2":["c2","c2:b","c2t0","c2t1"],"Q1":["q1p0","q1p1","q1m0","q1m1"],"Q2":["q2p0","q2p1","q2m0","q2m1"],"SW":["swp0","swp1","sw","swo"],"V1":["v1a","v1a:h","v1t0","v1t1"],"V2":["v2a","v2a:h","v2t0","v2t1"],"Iso":["iso"],"Iso2":["iso2"]},"moves":{"sw":{"to":{"swc":1,"isod":1},"dur":0.8},"q":{"to":{"mvq":1,"q1v":1,"q2v":1},"dur":1.0},"v":{"to":{"v1v":1,"v2v":1},"dur":0.5}},"route":["前の電荷","合計を比で分ける","電圧"]}}],"secs":[{"ex":{"text":"静電容量 $4\\,\\mathrm{F}$ のコンデンサを $3\\,\\mathrm{V}$ の電源につないで充電した。コンデンサの静電エネルギーは何 J か。","fig":{"kind":"u18s1cv","L":{"src":"{V}=3 V","c":"{C}=4 F","q":"{Q}","v":"{V}=3 V","w":"{W}"},"P":{}},"ch":[{"t":"$36\\,\\mathrm{J}$","v":"36","why":"$\\dfrac{1}{2}$ を掛けていない"},{"t":"$18\\,\\mathrm{J}$","v":"18","why":""},{"t":"$6\\,\\mathrm{J}$","v":"6","why":"電圧を2乗していない"},{"t":"$24\\,\\mathrm{J}$","v":"24","why":"静電容量を2乗した（2乗するのは電圧）"}],"ans":1}},{"ex":{"text":"静電容量 $3\\,\\mathrm{F}$ のコンデンサに $6\\,\\mathrm{C}$ の電荷が蓄えられている。コンデンサの静電エネルギーは何 J か。","fig":{"kind":"u18s2cv","L":{"src":"{V}","c":"{C}=3 F","q":"{Q}=6 C","v":"{V}","w":"{W}"},"P":{}},"ch":[{"t":"$12\\,\\mathrm{J}$","v":"12","why":"2 で割っていない"},{"t":"$6\\,\\mathrm{J}$","v":"6","why":""},{"t":"$1\\,\\mathrm{J}$","v":"1","why":"電荷を2乗していない"},{"t":"$54\\,\\mathrm{J}$","v":"54","why":"静電容量で割るのでなく掛けた"}],"ans":1}},{"ex":{"text":"静電容量 $C_1 = 10\\,\\mu\\mathrm{F}$ と $C_2 = 40\\,\\mu\\mathrm{F}$ のコンデンサを直列につなぎ、$40\\,\\mathrm{V}$ の電圧を加えた。各コンデンサに蓄えられる電荷は何 μC か。","fig":{"kind":"u18s3ser","L":{"src":"{V}=40 V","c1":"{C}_1=10 μF","c2":"{C}_2=40 μF","q1":"{Q}","q2":"{Q}","v1":"{V}_1","v2":"{V}_2","_v":{"c1":10,"c2":40}},"P":{}},"ch":[{"t":"$400\\,\\mu\\mathrm{C}$","v":"400","why":"$C_1$ に電源の電圧が全部かかると考えた"},{"t":"$320\\,\\mu\\mathrm{C}$","v":"320","why":""},{"t":"$80\\,\\mu\\mathrm{C}$","v":"80","why":"電圧を静電容量の比のまま分けた（逆比で分ける）"},{"t":"$2000\\,\\mu\\mathrm{C}$","v":"2000","why":"直列の静電容量を足した"}],"ans":1}},{"ex":{"text":"$200\\,\\mu\\mathrm{C}$ と $100\\,\\mu\\mathrm{C}$ の電荷が蓄えられた2つのコンデンサを、同じ極性どうしつないだ。電荷が移動した後、左のコンデンサの電荷は $120\\,\\mu\\mathrm{C}$ になった。右のコンデンサの電荷は何 μC か。","fig":{"kind":"u18s4rc","L":{"c1":"{C}_1","c2":"{C}_2","q1":"{Q}_1'=120 μC","q2":"{Q}_2'","dir":"lr"},"P":{}},"ch":[{"t":"$120\\,\\mu\\mathrm{C}$","v":"120","why":"2つの電荷が同じになるとは限らない。合計が変わらない"},{"t":"$180\\,\\mu\\mathrm{C}$","v":"180","why":""},{"t":"$300\\,\\mu\\mathrm{C}$","v":"300","why":"合計から左の電荷を引いていない"},{"t":"$100\\,\\mu\\mathrm{C}$","v":"100","why":"電荷は移動する。変わらないのは合計"}],"ans":1}},{"ex":{"text":"静電容量 $C_1 = 20\\,\\mu\\mathrm{F}$ のコンデンサを $50\\,\\mathrm{V}$ で、$C_2 = 30\\,\\mu\\mathrm{F}$ のコンデンサを $10\\,\\mathrm{V}$ で充電した。この2つを同じ極性どうしつなぐと、電荷が移動した後の電圧は何 V か。","fig":{"kind":"u18s5rc","L":{"c1":"{C}_1=20 μF","c2":"{C}_2=30 μF","q1":null,"q2":null,"v1":"{V}_1=50 V","v2":"{V}_2=10 V","dir":"lr","_v":{"v1":50,"v2":10}},"P":{}},"ch":[{"t":"$30\\,\\mathrm{V}$","v":30,"why":"2つの電圧の平均を出した（電荷の合計を静電容量の合計で割る）"},{"t":"$26\\,\\mathrm{V}$","v":26,"why":""},{"t":"$60\\,\\mathrm{V}$","v":60,"why":"電圧を足した（同じ電圧になるまで移動するので、間の値になる）"},{"t":"$20\\,\\mathrm{V}$","v":20,"why":"$C_1$ の電荷だけを使った（合計は $C_2$ の電荷も入る）"}],"ans":1}}],"past":[]}};
});
