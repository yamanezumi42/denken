/* 単元12「電力と電力量」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(12, function(H){
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
// ---- 12-1 電力 の図（※ textbook/gen/make_section.py が textbook/gen/data/u12_s1.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U12S1K = {
  one: {"vars":[],"items":[{"t":"z","id":"zbu12s1one0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu12s1one1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u12s1oneL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u12s1oneRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u12s1onew1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u12s1onew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,599.9,null]},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,328.27,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.17,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","r","P","N",1,[]]]}
};
function tbU12s1one(d, p, L){ tbGen_Draw(d, p, L, U12S1K.one); }
// ---- 12-2 電力の3つの式 の図（※ textbook/gen/make_section.py が textbook/gen/data/u12_s2.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U12S2K = {
  one: {"vars":[],"items":[{"t":"z","id":"zbu12s2one0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu12s2one1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u12s2oneL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u12s2oneRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u12s2onew1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u12s2onew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,604.04,null]},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,330.34,null]},{"t":"v","k":"v","x":761.5,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r","lab":[761.5,255.96,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.38,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","r","P","N",1,[]]]},
  ser: {"vars":[],"items":[{"t":"z","id":"zbu12s2ser0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[608.67,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu12s2ser1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[914.33,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu12s2ser2mid","z":"mid","lines":[[[668.67,360],[854.33,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u12s2serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u12s2serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u12s2serw1","pts":[[478,360],[608.67,360]],"vis":[],"dash":0},{"t":"w","id":"u12s2serw2","pts":[[668.67,360],[854.33,360]],"vis":[],"dash":0},{"t":"w","id":"u12s2serw3","pts":[[914.33,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.5,null]},{"t":"r","k":"r1","x":638.67,"y":360,"dir":"h","vis":[],"lab":[638.67,325.37,null]},{"t":"v","k":"v1","x":638.67,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r1","lab":[638.67,251.5,null]},{"t":"r","k":"r2","x":884.33,"y":360,"dir":"h","vis":[],"lab":[884.33,325.37,null]},{"t":"v","k":"v2","x":884.33,"y":360,"dir":"h","side":-1,"hi":-1,"vis":[],"elem":"r2","lab":[884.33,251.5,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.87,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src","v1","v2"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]}
};
function tbU12s2one(d, p, L){ tbGen_Draw(d, p, L, U12S2K.one); }
function tbU12s2ser(d, p, L){ tbGen_Draw(d, p, L, U12S2K.ser); }
// ---- 12-3 電力量 の図（※ textbook/gen/make_section.py が textbook/gen/data/u12_s3.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U12S3K = {
  one: {"vars":[],"items":[{"t":"z","id":"zbu12s3one0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[731.5,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu12s3one1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[791.5,360]]],"vis":[],"pts":[],"node":"N"},{"t":"w","id":"u12s3oneL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u12s3oneRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u12s3onew1","pts":[[478,360],[731.5,360]],"vis":[],"dash":0},{"t":"w","id":"u12s3onew2","pts":[[791.5,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[770,599.9,null]},{"t":"r","k":"r","x":761.5,"y":360,"dir":"h","vis":[],"lab":[761.5,328.27,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[445.17,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","r","P","N",1,[]]]}
};
function tbU12s3one(d, p, L){ tbGen_Draw(d, p, L, U12S3K.one); }
// ---- 12-4 回路の電力量 の図（※ textbook/gen/make_section.py が textbook/gen/data/u12_s4.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U12S4K = {
  ser: {"vars":[],"items":[{"t":"z","id":"zbu12s4ser0hi","z":"hi","lines":[[[752,560],[478,560],[478,360],[615.33,360]]],"vis":[],"pts":[],"node":"P"},{"t":"z","id":"zbu12s4ser1lo","z":"lo","lines":[[[772,560],[1045,560],[1045,360],[907.67,360]]],"vis":[],"pts":[],"node":"N"},{"t":"z","id":"zbu12s4ser2mid","z":"mid","lines":[[[675.33,360],[847.67,360]]],"vis":[],"pts":[],"node":"n1"},{"t":"w","id":"u12s4serL","pts":[[478,360],[478,560],[752,560]],"vis":[],"dash":0},{"t":"w","id":"u12s4serRw","pts":[[772,560],[1045,560],[1045,360]],"vis":[],"dash":0},{"t":"w","id":"u12s4serw1","pts":[[478,360],[615.33,360]],"vis":[],"dash":0},{"t":"w","id":"u12s4serw2","pts":[[675.33,360],[847.67,360]],"vis":[],"dash":0},{"t":"w","id":"u12s4serw3","pts":[[907.67,360],[1045,360]],"vis":[],"dash":0},{"t":"e","k":"src","dir":"h","xp":752,"yp":560,"xm":772,"ym":560,"vis":[],"side":1,"loop":1,"lab":[762,608.29,null]},{"t":"r","k":"r1","x":645.33,"y":360,"dir":"h","vis":[],"lab":[645.33,325.6,null]},{"t":"r","k":"r2","x":877.67,"y":360,"dir":"h","vis":[],"lab":[877.67,325.6,null]},{"t":"i","k":"i","x0":461,"y0":500,"x1":461,"y1":460,"lab":[444.89,480,"end"],"vis":[],"ax":"v","sd":-1,"io":1}],"flows":[{"c":[],"paths":[{"I":1,"pts":[[752,560],[478,560],[478,360],[1045,360],[1045,560],[772,560]]}]}],"base":110,"von":["src"],"bands":"volt","pts":[],"net":[["E","src","P","N",1,[]],["R","r1","P","n1",1,[]],["R","r2","n1","N",1,[]]]}
};
function tbU12s4ser(d, p, L){ tbGen_Draw(d, p, L, U12S4K.ser); }
// ---- 12-5 グラフの面積 の図（※ textbook/gen/make_section.py が textbook/gen/data/u12_s5.py から作った。手で直さない（データを直して作り直す）。。図の道具＝gen/runtime.js の tbGen_…）
var U12S5K = {
  gr: {"vars":[],"items":[{"f":"ln","id":"gf1","pts":[[200,500],[200,244],[686.96,244],[686.96,500]],"fill":"area","close":1,"vis":[],"t":"F"},{"f":"lb","id":"ga1t","k":"ga1","bases":[[443.48,440,"middle",[0,-1]],[443.48,210,"middle",[0,-1]]],"need":"ga1","vis":[],"t":"F","x":443.48,"y":440,"anc":"middle"},{"f":"ar","id":"gax","x0":200,"y0":500,"x1":760,"y1":500,"vis":[],"t":"F"},{"f":"ar","id":"gay","x0":200,"y0":500,"x1":200,"y1":180,"vis":[],"t":"F"},{"f":"tx","id":"go","x":186,"y":526,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"ln","id":"gl","pts":[[200,244],[686.96,244]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"gpd","pts":[[200,244],[200,244]],"dash":1,"w":2,"need":"gp","vis":[],"t":"F"},{"f":"lb","id":"gpt","k":"gp","bases":[[186,244,"end",[-1,0]]],"need":"gp","vis":[],"t":"F","x":186,"y":244,"anc":"end"},{"f":"ln","id":"gt1d","pts":[[686.96,500],[686.96,244]],"dash":1,"w":2,"need":"gt1","vis":[],"t":"F"},{"f":"lb","id":"gt1t","k":"gt1","bases":[[686.96,530,"middle",[0,1]]],"need":"gt1","vis":[],"t":"F","x":686.96,"y":530,"anc":"middle"},{"f":"lb","id":"gxt","k":"gx","bases":[[772,500,"start",[1,0]],[760,540,"end",[0,1]]],"need":"gx","vis":[],"t":"F","x":760,"y":570,"anc":"end"},{"f":"lb","id":"gyt","k":"gy","bases":[[200,150,"middle",[0,-1]],[216,180,"start",[1,0]]],"need":"gy","vis":[],"t":"F","x":216,"y":180,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  gt: {"vars":[],"items":[{"f":"ln","id":"gf1","pts":[[200,500],[200,500],[686.96,244],[686.96,500]],"fill":"area","close":1,"vis":[],"t":"F"},{"f":"lb","id":"ga1t","k":"ga1","bases":[[524.64,440,"middle",[0,-1]],[524.64,210,"middle",[0,-1]]],"need":"ga1","vis":[],"t":"F","x":524.64,"y":440,"anc":"middle"},{"f":"ar","id":"gax","x0":200,"y0":500,"x1":760,"y1":500,"vis":[],"t":"F"},{"f":"ar","id":"gay","x0":200,"y0":500,"x1":200,"y1":180,"vis":[],"t":"F"},{"f":"tx","id":"go","x":186,"y":526,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"ln","id":"gl","pts":[[200,500],[686.96,244]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"gpd","pts":[[200,244],[686.96,244]],"dash":1,"w":2,"need":"gp","vis":[],"t":"F"},{"f":"lb","id":"gpt","k":"gp","bases":[[186,244,"end",[-1,0]]],"need":"gp","vis":[],"t":"F","x":186,"y":244,"anc":"end"},{"f":"ln","id":"gt1d","pts":[[686.96,500],[686.96,244]],"dash":1,"w":2,"need":"gt1","vis":[],"t":"F"},{"f":"lb","id":"gt1t","k":"gt1","bases":[[686.96,530,"middle",[0,1]]],"need":"gt1","vis":[],"t":"F","x":686.96,"y":530,"anc":"middle"},{"f":"lb","id":"gxt","k":"gx","bases":[[772,500,"start",[1,0]],[760,540,"end",[0,1]]],"need":"gx","vis":[],"t":"F","x":760,"y":570,"anc":"end"},{"f":"lb","id":"gyt","k":"gy","bases":[[200,150,"middle",[0,-1]],[216,180,"start",[1,0]]],"need":"gy","vis":[],"t":"F","x":216,"y":180,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  gm: {"vars":[],"items":[{"f":"ln","id":"gf1","pts":[[200,500],[200,500],[421.34,244],[421.34,500]],"fill":"area","close":1,"vis":[],"t":"F"},{"f":"lb","id":"ga1t","k":"ga1","bases":[[347.56,440,"middle",[0,-1]],[347.56,210,"middle",[0,-1]]],"need":"ga1","vis":[],"t":"F","x":347.56,"y":210,"anc":"middle"},{"f":"ln","id":"gf2","pts":[[421.34,500],[421.34,244],[686.96,244],[686.96,500]],"fill":"area","close":1,"vis":[],"t":"F"},{"f":"lb","id":"ga2t","k":"ga2","bases":[[554.15,440,"middle",[0,-1]],[554.15,210,"middle",[0,-1]]],"need":"ga2","vis":[],"t":"F","x":554.15,"y":440,"anc":"middle"},{"f":"ar","id":"gax","x0":200,"y0":500,"x1":760,"y1":500,"vis":[],"t":"F"},{"f":"ar","id":"gay","x0":200,"y0":500,"x1":200,"y1":180,"vis":[],"t":"F"},{"f":"tx","id":"go","x":186,"y":526,"s":"0","anc":"end","vis":[],"t":"F"},{"f":"ln","id":"gl","pts":[[200,500],[421.34,244],[686.96,244]],"w":5,"vis":[],"t":"F"},{"f":"ln","id":"gpd","pts":[[200,244],[421.34,244]],"dash":1,"w":2,"need":"gp","vis":[],"t":"F"},{"f":"lb","id":"gpt","k":"gp","bases":[[186,244,"end",[-1,0]]],"need":"gp","vis":[],"t":"F","x":186,"y":244,"anc":"end"},{"f":"ln","id":"gt1d","pts":[[421.34,500],[421.34,244]],"dash":1,"w":2,"need":"gt1","vis":[],"t":"F"},{"f":"lb","id":"gt1t","k":"gt1","bases":[[421.34,530,"middle",[0,1]]],"need":"gt1","vis":[],"t":"F","x":421.34,"y":530,"anc":"middle"},{"f":"ln","id":"gt2d","pts":[[686.96,500],[686.96,244]],"dash":1,"w":2,"need":"gt2","vis":[],"t":"F"},{"f":"lb","id":"gt2t","k":"gt2","bases":[[686.96,530,"middle",[0,1]]],"need":"gt2","vis":[],"t":"F","x":686.96,"y":530,"anc":"middle"},{"f":"lb","id":"gxt","k":"gx","bases":[[772,500,"start",[1,0]],[760,540,"end",[0,1]]],"need":"gx","vis":[],"t":"F","x":760,"y":570,"anc":"end"},{"f":"lb","id":"gyt","k":"gy","bases":[[200,150,"middle",[0,-1]],[216,180,"start",[1,0]]],"need":"gy","vis":[],"t":"F","x":216,"y":172,"anc":"start"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]},
  ge: {"vars":[["a","t",0],["a","t",1]],"items":[{"f":"ln","id":"gf1","pts":[[200,500],[200,244],[686.96,244],[686.96,500]],"fill":"area","close":1,"vis":[1],"t":"F"},{"f":"lb","id":"ga1t","k":"ga1","bases":[[443.48,440,"middle",[0,-1]],[443.48,210,"middle",[0,-1]]],"need":"ga1","vis":[1],"t":"F","x":443.48,"y":440,"anc":"middle"},{"f":"ar","id":"gax","x0":200,"y0":500,"x1":760,"y1":500,"vis":[1],"t":"F"},{"f":"ar","id":"gay","x0":200,"y0":500,"x1":200,"y1":180,"vis":[1],"t":"F"},{"f":"tx","id":"go","x":186,"y":526,"s":"0","anc":"end","vis":[1],"t":"F"},{"f":"ln","id":"gl","pts":[[200,244],[686.96,244]],"w":5,"vis":[1],"t":"F"},{"f":"ln","id":"gpd","pts":[[200,244],[200,244]],"dash":1,"w":2,"need":"gp","vis":[1],"t":"F"},{"f":"lb","id":"gpt","k":"gp","bases":[[186,244,"end",[-1,0]]],"need":"gp","vis":[1],"t":"F","x":186,"y":244,"anc":"end"},{"f":"ln","id":"gt1d","pts":[[686.96,500],[686.96,244]],"dash":1,"w":2,"need":"gt1","vis":[1],"t":"F"},{"f":"lb","id":"gt1t","k":"gt1","bases":[[686.96,530,"middle",[0,1]]],"need":"gt1","vis":[1],"t":"F","x":686.96,"y":530,"anc":"middle"},{"f":"lb","id":"gxt","k":"gx","bases":[[772,500,"start",[1,0]],[760,540,"end",[0,1]]],"need":"gx","vis":[1],"t":"F","x":760,"y":570,"anc":"end"},{"f":"lb","id":"gyt","k":"gy","bases":[[200,150,"middle",[0,-1]],[216,180,"start",[1,0]]],"need":"gy","vis":[1],"t":"F","x":216,"y":180,"anc":"start"},{"f":"ln","id":"gf1x1","pts":[[200,500],[200,500],[686.96,244],[686.96,500]],"fill":"area","close":1,"vis":[2],"t":"F"},{"f":"lb","id":"ga1tx1","k":"ga1","bases":[[524.64,440,"middle",[0,-1]],[524.64,210,"middle",[0,-1]]],"need":"ga1","vis":[2],"t":"F","x":524.64,"y":440,"anc":"middle","n":"ga1x1"},{"f":"ar","id":"gaxx1","x0":200,"y0":500,"x1":760,"y1":500,"vis":[2],"t":"F"},{"f":"ar","id":"gayx1","x0":200,"y0":500,"x1":200,"y1":180,"vis":[2],"t":"F"},{"f":"tx","id":"gox1","x":186,"y":526,"s":"0","anc":"end","vis":[2],"t":"F"},{"f":"ln","id":"glx1","pts":[[200,500],[686.96,244]],"w":5,"vis":[2],"t":"F"},{"f":"ln","id":"gpdx1","pts":[[200,244],[686.96,244]],"dash":1,"w":2,"need":"gp","vis":[2],"t":"F"},{"f":"lb","id":"gptx1","k":"gp","bases":[[186,244,"end",[-1,0]]],"need":"gp","vis":[2],"t":"F","x":186,"y":244,"anc":"end","n":"gpx1"},{"f":"ln","id":"gt1dx1","pts":[[686.96,500],[686.96,244]],"dash":1,"w":2,"need":"gt1","vis":[2],"t":"F"},{"f":"lb","id":"gt1tx1","k":"gt1","bases":[[686.96,530,"middle",[0,1]]],"need":"gt1","vis":[2],"t":"F","x":686.96,"y":530,"anc":"middle","n":"gt1x1"},{"f":"lb","id":"gxtx1","k":"gx","bases":[[772,500,"start",[1,0]],[760,540,"end",[0,1]]],"need":"gx","vis":[2],"t":"F","x":760,"y":570,"anc":"end","n":"gxx1"},{"f":"lb","id":"gytx1","k":"gy","bases":[[200,150,"middle",[0,-1]],[216,180,"start",[1,0]]],"need":"gy","vis":[2],"t":"F","x":216,"y":180,"anc":"start","n":"gyx1"}],"flows":[],"base":110,"von":[],"bands":"never","pts":[],"net":[]}
};
function tbU12s5gr(d, p, L){ tbFig_Draw(d, p, L, U12S5K.gr); }
function tbU12s5gt(d, p, L){ tbFig_Draw(d, p, L, U12S5K.gt); }
function tbU12s5gm(d, p, L){ tbFig_Draw(d, p, L, U12S5K.gm); }
function tbU12s5ge(d, p, L){ tbFig_Draw(d, p, L, U12S5K.ge); }
var KINDS = {u12s1one: tbU12s1one, u12s2one: tbU12s2one, u12s2ser: tbU12s2ser, u12s3one: tbU12s3one, u12s4ser: tbU12s4ser, u12s5gr: tbU12s5gr, u12s5gt: tbU12s5gt, u12s5gm: tbU12s5gm, u12s5ge: tbU12s5ge};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u12s1one: function(p, L){ return tbGen_Flow(p, L, U12S1K.one); },
  u12s2one: function(p, L){ return tbGen_Flow(p, L, U12S2K.one); },
  u12s2ser: function(p, L){ return tbGen_Flow(p, L, U12S2K.ser); },
  u12s3one: function(p, L){ return tbGen_Flow(p, L, U12S3K.one); },
  u12s4ser: function(p, L){ return tbGen_Flow(p, L, U12S4K.ser); },
  // 12-5 の図は電流が流れないので載せない
};

// 12-1 電力 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u12_s1.py から作った。手で直さない（データを直して作り直す）。）
function tbU12s1_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU12s1_ratio(a){ var g = a.reduce(function(x, y){ return tbU12s1_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU12s1_par(a, b){ return a * b / (a + b); }
function tbU12s1_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU12s1_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU12s1_Qdef(r){
  var gcd = tbU12s1_gcd, ratio = tbU12s1_ratio, par = tbU12s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "1秒あたりに使う電気のエネルギー", v: "own"}, {t: "使った電気のエネルギーの全部", v: "all", why: "電力は1秒あたり"}, {t: "1分あたりに使う電気のエネルギー", v: "min", why: "1分でなく1秒あたり"}, {t: "1秒あたりに流れる電流", v: "cur", why: "電力は電気のエネルギーの量"}]);
    return {form: "u12s1def", text: "電力とは、□ である。", fig: {kind: "u12s1one", L: tbU12s1_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電力は、1秒あたりに使う電気のエネルギー", "単位は $\\mathrm{W}$（$\\mathrm{J/s}$）"], chk: {form: "u12s1def", p: {}}};
  }
  throw new Error("u12s1def：条件に合う数字が見つからない");
}
function tbU12s1_Qunit(r){
  var gcd = tbU12s1_gcd, ratio = tbU12s1_ratio, par = tbU12s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\mathrm{J/s}$", v: "own"}, {t: "$\\mathrm{J}$", v: "j", why: "J はエネルギーの単位。電力は1秒あたり"}, {t: "$\\mathrm{s/J}$", v: "sj", why: "秒をエネルギーで割っている（逆）"}, {t: "$\\mathrm{V/A}$", v: "va", why: "電圧÷電流は抵抗（Ω）"}]);
    return {form: "u12s1unit", text: "電力の単位 W は、□ とも書ける。", fig: {kind: "u12s1one", L: tbU12s1_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電力は1秒あたりのエネルギー（J）", "$\\mathrm{W} = \\mathrm{J/s}$"], chk: {form: "u12s1unit", p: {}}};
  }
  throw new Error("u12s1unit：条件に合う数字が見つからない");
}
function tbU12s1_Qp(r){
  var gcd = tbU12s1_gcd, ratio = tbU12s1_ratio, par = tbU12s1_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var t = pick(r, [2,3,4,5,6,8,10,12,15,20,30,60]);
    var P = pick(r, [2,3,4,5,6,8,10,12,15,20,25,30,40,50,60,80,100,120,150,200]);
    var J = (P * t);
    if (!(J <= 6000)) continue;
    var ok = (J / t);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU12s1_three(ok, [{x: (J * t), why: "秒の数で割らずに掛けた"}, {x: (J), why: "全部のエネルギーを答えた（電力は1秒あたり）"}, {x: (t / J), why: "秒の数をエネルギーで割った"}, {x: (J / 60), why: "秒でなく分で割った"}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    return {form: "u12s1p", text: "図の抵抗は、$" + fmt(t) + "$ 秒で $" + fmt(J) + "$ J の電気のエネルギーを使った。この抵抗の電力は何 W か。", fig: {kind: "u12s1one", L: tbU12s1_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電力は1秒あたりのエネルギー　$\\dfrac{" + fmt(J) + "}{" + fmt(t) + "} = " + fmt(ok) + "\\,\\mathrm{J/s}$", "$" + qv(ok, "W") + "$"], chk: {form: "u12s1p", p: {J: J, t: t}}};
  }
  throw new Error("u12s1p：条件に合う数字が見つからない");
}
// 12-2 電力の3つの式 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u12_s2.py から作った。手で直さない（データを直して作り直す）。）
function tbU12s2_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU12s2_ratio(a){ var g = a.reduce(function(x, y){ return tbU12s2_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU12s2_par(a, b){ return a * b / (a + b); }
function tbU12s2_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU12s2_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU12s2_Qlaw(r){
  var gcd = tbU12s2_gcd, ratio = tbU12s2_ratio, par = tbU12s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "$\\dfrac{V}{R}$", v: "own"}, {t: "$VI$", v: "vi", why: "$P = VI$ は電力の式"}, {t: "$I^2 R$", v: "i2r", why: "$V = IR$ を入れた電力の式"}, {t: "$\\dfrac{V^2}{R}$", v: "v2r", why: "$I = \\dfrac{V}{R}$ を入れた電力の式"}]);
    return {form: "u12s2law", text: "抵抗 $R$ に電圧 $V$ がかかり、電流 $I$ が流れている。電力を表す式でないのは □ である。", fig: {kind: "u12s2one", L: tbU12s2_fig({"src":"{V}","r":"{R}"}, [["v", "{V}"], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電力は $P = VI = I^2 R = \\dfrac{V^2}{R}$", "$\\dfrac{V}{R}$ は電流"], chk: {form: "u12s2law", p: {}}};
  }
  throw new Error("u12s2law：条件に合う数字が見つからない");
}
function tbU12s2_Qvi(r){
  var gcd = tbU12s2_gcd, ratio = tbU12s2_ratio, par = tbU12s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [2,3,4,5,6,8,10,12,15,20,24,30,40,50,60,100]);
    var I = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10]);
    if (!(V != I && nice(V / I))) continue;
    var ok = (V * I);
    if (!(isFinite(ok) && nice(ok) && ok > 0)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU12s2_three(ok, [{x: (V / I), why: "掛けずに割った（それは抵抗）"}, {x: (V + I), why: "掛けずに足した"}, {x: (V * V * I), why: "電圧を2乗した"}, {x: (V * I / 2), why: "半分にした"}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    return {form: "u12s2vi", text: "図の抵抗に $V = " + qv(V, "V") + "$ がかかり、$I = " + qv(I, "A") + "$ が流れている。この抵抗の電力は何 W か。", fig: {kind: "u12s2one", L: tbU12s2_fig({"src":"{V}","r":"{R}"}, [["v", "{V}=" + qf(V, "V")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$P = VI$", "$P = " + fmt(V) + " \\times " + fmt(I) + " = " + qv(ok, "W") + "$"], chk: {form: "u12s2vi", p: {V: V, I: I}}};
  }
  throw new Error("u12s2vi：条件に合う数字が見つからない");
}
function tbU12s2_Qi2r(r){
  var gcd = tbU12s2_gcd, ratio = tbU12s2_ratio, par = tbU12s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var I = pick(r, [1,2,3,4,5,6,8,10]);
    var R = pick(r, [2,3,4,5,6,8,10,12,15,20,25,30,50]);
    if (!(I != R && I * I * R <= 3000)) continue;
    var ok = (I * I * R);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU12s2_three(ok, [{x: (I * R), why: "電流を2乗していない（それは電圧）"}, {x: (I * R * R), why: "抵抗を2乗した"}, {x: (I * I / R), why: "抵抗で割った"}, {x: (I * I * R * 2), why: "2倍した"}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    return {form: "u12s2i2r", text: "図の抵抗 $R = " + qv(R, "O") + "$ に $I = " + qv(I, "A") + "$ が流れている。この抵抗の電力は何 W か。", fig: {kind: "u12s2one", L: tbU12s2_fig({"src":"{V}","r":"{R}"}, [["r", "{R}=" + qf(R, "O")], ["i", "{I}=" + qf(I, "A")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$P = I^2 R$", "$P = " + fmt(I) + "^2 \\times " + fmt(R) + " = " + qv(ok, "W") + "$"], chk: {form: "u12s2i2r", p: {I: I, R: R}}};
  }
  throw new Error("u12s2i2r：条件に合う数字が見つからない");
}
function tbU12s2_Qv2r(r){
  var gcd = tbU12s2_gcd, ratio = tbU12s2_ratio, par = tbU12s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var V = pick(r, [2,4,5,6,8,10,12,15,20,24,30,40,50,60,100]);
    var R = pick(r, [2,4,5,8,10,20,25,40,50,100]);
    if (!(V != R && (V * V) % R == 0)) continue;
    var ok = (V * V / R);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU12s2_three(ok, [{x: (V / R), why: "電圧を2乗していない（それは電流）"}, {x: (V * V * R), why: "抵抗で割らずに掛けた"}, {x: (V * R), why: "電圧と抵抗を掛けた"}, {x: (V * V / R / 2), why: "半分にした"}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    return {form: "u12s2v2r", text: "図の抵抗 $R = " + qv(R, "O") + "$ に $V = " + qv(V, "V") + "$ がかかっている。この抵抗の電力は何 W か。", fig: {kind: "u12s2one", L: tbU12s2_fig({"src":"{V}","r":"{R}"}, [["r", "{R}=" + qf(R, "O")], ["v", "{V}=" + qf(V, "V")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$P = \\dfrac{V^2}{R}$", "$P = \\dfrac{" + fmt(V) + "^2}{" + fmt(R) + "} = " + qv(ok, "W") + "$"], chk: {form: "u12s2v2r", p: {V: V, R: R}}};
  }
  throw new Error("u12s2v2r：条件に合う数字が見つからない");
}
function tbU12s2_Qser(r){
  var gcd = tbU12s2_gcd, ratio = tbU12s2_ratio, par = tbU12s2_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15,20]);
    var I = pick(r, [1,2,3,4,5]);
    var k = pick(r, [1,2]);
    var V = (I * (R1 + R2));
    var Rk = (k == 1 ? R1 : R2);
    var Ro = (k == 1 ? R2 : R1);
    if (!(R1 != R2 && V <= 200)) continue;
    var ok = (I * I * Rk);
    if (!(isFinite(ok) && nice(ok) && ok > 0 && Math.abs(ok - Math.round(ok)) < 1e-9)) continue;
    ok = Math.round(ok * 1000) / 1000;
    var _w = tbU12s2_three(ok, [{x: (V * I), why: "全体の電力を答えた"}, {x: (I * I * Ro), why: "もう一方の抵抗の電力を答えた"}, {x: (I * Rk), why: "電流を2乗していない（$I^2 R$）"}, {x: (V * V / Rk), why: "全体の電圧で $\\dfrac{V^2}{R}$ にした（この抵抗にかかるのは一部）"}]);
    if (!_w) continue;
    var _c = num(r, null, "W", ok, _w);
    return {form: "u12s2ser", text: "図の回路で、$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ である。$R_" + fmt(k) + "$ の電力は何 W か。", fig: {kind: "u12s2ser", L: tbU12s2_fig({"src":"{V}","r":"{R}"}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")], ["i", "{I}"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["直列なので　$I = \\dfrac{" + fmt(V) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$", "$P_" + fmt(k) + " = I^2 R_" + fmt(k) + " = " + fmt(I) + "^2 \\times " + fmt(Rk) + " = " + qv(ok, "W") + "$"], chk: {form: "u12s2ser", p: {V: V, R1: R1, R2: R2, k: k}}};
  }
  throw new Error("u12s2ser：条件に合う数字が見つからない");
}
// 12-3 電力量 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u12_s3.py から作った。手で直さない（データを直して作り直す）。）
function tbU12s3_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU12s3_ratio(a){ var g = a.reduce(function(x, y){ return tbU12s3_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU12s3_par(a, b){ return a * b / (a + b); }
function tbU12s3_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU12s3_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU12s3_Qws(r){
  var gcd = tbU12s3_gcd, ratio = tbU12s3_ratio, par = tbU12s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var P = pick(r, [2,4,5,6,8,10,12,15,20,25,30,40,50,60,80,100]);
    var t = pick(r, [2,3,4,5,6,10,15,20,30,60]);
    var A = (P * t);
    var B = (P / t);
    var C = (P * t * 60);
    var D = (P + t);
    if (!(P != t && A != C && nice(B) && B != D)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "時間で掛けずに割った"}, {t: "$" + fmt(C) + "\\,\\mathrm{J}$", v: fmt(C), why: "秒を分と見て 60 を掛けた"}, {t: "$" + fmt(D) + "\\,\\mathrm{J}$", v: fmt(D), why: "掛けずに足した"}]);
    return {form: "u12s3ws", text: "図の抵抗の電力は $" + qv(P, "W") + "$ である。$" + fmt(t) + "$ 秒の間、電流を流した時の電力量は何 J か。", fig: {kind: "u12s3one", L: tbU12s3_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["W·s は J と同じ　$W = Pt$", "$W = " + fmt(P) + " \\times " + fmt(t) + " = " + fmt(A) + "\\,\\mathrm{J}$"], chk: {form: "u12s3ws", p: {P: P, t: t}}};
  }
  throw new Error("u12s3ws：条件に合う数字が見つからない");
}
function tbU12s3_Qwh(r){
  var gcd = tbU12s3_gcd, ratio = tbU12s3_ratio, par = tbU12s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var P = pick(r, [20,40,50,60,100,200,300,400,500,600,800,1000,1200,1500,2000]);
    var h = pick(r, [2,3,4,5,6,8,10]);
    var A = (P * h);
    var B = (P * h * 3600);
    var C = (P * h / 1000);
    var D = (P / h);
    if (!(nice(C) && nice(D) && D != C)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{Wh}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{Wh}$", v: fmt(B), why: "3600 を掛けた（それは秒にした W·s）"}, {t: "$" + fmt(C) + "\\,\\mathrm{Wh}$", v: fmt(C), why: "1000 で割った（それは kWh）"}, {t: "$" + fmt(D) + "\\,\\mathrm{Wh}$", v: fmt(D), why: "時間で掛けずに割った"}]);
    return {form: "u12s3wh", text: "図の抵抗の電力は $" + qv(P, "W") + "$ である。$" + fmt(h) + "$ 時間、電流を流した時の電力量は何 Wh か。", fig: {kind: "u12s3one", L: tbU12s3_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["Wh は W×時間", "$W = " + fmt(P) + " \\times " + fmt(h) + " = " + fmt(A) + "\\,\\mathrm{Wh}$"], chk: {form: "u12s3wh", p: {P: P, h: h}}};
  }
  throw new Error("u12s3wh：条件に合う数字が見つからない");
}
function tbU12s3_Qkwh(r){
  var gcd = tbU12s3_gcd, ratio = tbU12s3_ratio, par = tbU12s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var P = pick(r, [100,200,250,300,400,500,600,800,1000,1200,1500,2000,2500,3000,4000,5000]);
    var h = pick(r, [2,3,4,5,6,8,10]);
    var A = (P * h / 1000);
    var B = (P * h);
    var C = (P / 1000);
    var D = (P * h / 100);
    if (!(nice(A) && nice(C) && nice(D) && A != C)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{kWh}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{kWh}$", v: fmt(B), why: "1000 で割っていない（それは Wh）"}, {t: "$" + fmt(C) + "\\,\\mathrm{kWh}$", v: fmt(C), why: "時間を掛けていない"}, {t: "$" + fmt(D) + "\\,\\mathrm{kWh}$", v: fmt(D), why: "100 で割った（1 kW＝1000 W）"}]);
    return {form: "u12s3kwh", text: "図の抵抗の電力は $" + qv(P, "W") + "$ である。$" + fmt(h) + "$ 時間、電流を流した時の電力量は何 kWh か。", fig: {kind: "u12s3one", L: tbU12s3_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$" + fmt(P) + "\\,\\mathrm{W} = " + fmt(C) + "\\,\\mathrm{kW}$", "$W = " + fmt(C) + " \\times " + fmt(h) + " = " + fmt(A) + "\\,\\mathrm{kWh}$"], chk: {form: "u12s3kwh", p: {P: P, h: h}}};
  }
  throw new Error("u12s3kwh：条件に合う数字が見つからない");
}
function tbU12s3_Qconv(r){
  var gcd = tbU12s3_gcd, ratio = tbU12s3_ratio, par = tbU12s3_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var k = pick(r, [1,2]);
    var nm = (k == 1 ? '$1\\,\\mathrm{kWh}$ は □ Wh' : '$1\\,\\mathrm{Wh}$ は □ J');
    var A = (k == 1 ? 1000 : 3600);
    var B = (k == 1 ? 3600 : 1000);
    var C = (k == 1 ? 100 : 60);
    var D = (k == 1 ? 3600000 : 60000);
    var _c = choices(r, [{t: fmt(A), v: fmt(A)}, {t: fmt(B), v: fmt(B), why: "kWh→Wh は 1000 倍、Wh→J は 3600 倍（1 時間＝3600 秒）"}, {t: fmt(C), v: fmt(C), why: "kWh→Wh は 1000 倍、Wh→J は 3600 倍（1 時間＝3600 秒）"}, {t: fmt(D), v: fmt(D), why: "kWh→Wh は 1000 倍、Wh→J は 3600 倍（1 時間＝3600 秒）"}]);
    return {form: "u12s3conv", text: String(nm) + " である。", fig: {kind: "u12s3one", L: tbU12s3_fig({"src":"{V}","r":"{R}","i":"{I}"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$1\\,\\mathrm{kW} = 1000\\,\\mathrm{W}$、1 時間＝3600 秒", "kWh→Wh は 1000 倍、Wh→W·s（J）は 3600 倍"], chk: {form: "u12s3conv", p: {k: k}}};
  }
  throw new Error("u12s3conv：条件に合う数字が見つからない");
}
// 12-4 回路の電力量 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u12_s4.py から作った。手で直さない（データを直して作り直す）。）
function tbU12s4_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU12s4_ratio(a){ var g = a.reduce(function(x, y){ return tbU12s4_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU12s4_par(a, b){ return a * b / (a + b); }
function tbU12s4_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU12s4_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU12s4_Qwk(r){
  var gcd = tbU12s4_gcd, ratio = tbU12s4_ratio, par = tbU12s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10]);
    var I = pick(r, [1,2,3,4,5]);
    var t = pick(r, [2,5,10,20,30,60]);
    var k = pick(r, [1,2]);
    var V = (I * (R1 + R2));
    var Rk = (k == 1 ? R1 : R2);
    var Ro = (k == 1 ? R2 : R1);
    var A = (I * I * Rk * t);
    var B = (V * I * t);
    var C = (I * I * Ro * t);
    var D = (I * Rk * t);
    if (!(R1 != R2 && I > 1 && V <= 100 && new Set([A, B, C, D]).size == 4)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "電源の電力量（回路全体）を答えた"}, {t: "$" + fmt(C) + "\\,\\mathrm{J}$", v: fmt(C), why: "もう一方の抵抗の電力量を答えた"}, {t: "$" + fmt(D) + "\\,\\mathrm{J}$", v: fmt(D), why: "電流を2乗していない（$I^2 R$）"}]);
    return {form: "u12s4wk", text: "図の回路で、$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ である。$" + fmt(t) + "$ 秒の間、電流を流した時、$R_" + fmt(k) + "$ の電力量は何 J か。", fig: {kind: "u12s4ser", L: tbU12s4_fig({"src":"{V}","r1":"{R}_1","r2":"{R}_2","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I = \\dfrac{" + fmt(V) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$", "$W_" + fmt(k) + " = I^2 R_" + fmt(k) + " t = " + fmt(I) + "^2 \\times " + fmt(Rk) + " \\times " + fmt(t) + " = " + fmt(A) + "\\,\\mathrm{J}$"], chk: {form: "u12s4wk", p: {V: V, R1: R1, R2: R2, t: t, k: k}}};
  }
  throw new Error("u12s4wk：条件に合う数字が見つからない");
}
function tbU12s4_Qtot(r){
  var gcd = tbU12s4_gcd, ratio = tbU12s4_ratio, par = tbU12s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10]);
    var I = pick(r, [1,2,3,4,5]);
    var t = pick(r, [2,5,10,20,30,60]);
    var V = (I * (R1 + R2));
    var A = (V * I * t);
    var B = (V * I);
    var C = (V * t);
    var D = (I * I * R1 * t);
    if (!(R1 != R2 && I > 1 && V <= 100 && new Set([A, B, C, D]).size == 4)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{J}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{J}$", v: fmt(B), why: "時間を掛けていない（それは電力）"}, {t: "$" + fmt(C) + "\\,\\mathrm{J}$", v: fmt(C), why: "電流を掛けていない"}, {t: "$" + fmt(D) + "\\,\\mathrm{J}$", v: fmt(D), why: "$R_1$ の分だけ（電源の電力量は全部の抵抗の和）"}]);
    return {form: "u12s4tot", text: "図の回路で、$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ である。$" + fmt(t) + "$ 秒の間、電流を流した時、電源の電力量は何 J か。", fig: {kind: "u12s4ser", L: tbU12s4_fig({"src":"{V}","r1":"{R}_1","r2":"{R}_2","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I = \\dfrac{" + fmt(V) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(I, "A") + "$", "$W = VIt = " + fmt(V) + " \\times " + fmt(I) + " \\times " + fmt(t) + " = " + fmt(A) + "\\,\\mathrm{J}$"], chk: {form: "u12s4tot", p: {V: V, R1: R1, R2: R2, t: t}}};
  }
  throw new Error("u12s4tot：条件に合う数字が見つからない");
}
function tbU12s4_Qratio(r){
  var gcd = tbU12s4_gcd, ratio = tbU12s4_ratio, par = tbU12s4_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var R1 = pick(r, [1,2,3,4,5,6,8,10,12,15]);
    var R2 = pick(r, [1,2,3,4,5,6,8,10,12,15]);
    var I = pick(r, [1,2,3]);
    var t = pick(r, [5,10,20,30,60]);
    var k = pick(r, [1,2]);
    var V = (I * (R1 + R2));
    var Rk = (k == 1 ? R1 : R2);
    var Ro = (k == 1 ? R2 : R1);
    var A = (Rk / (R1 + R2));
    var B = (Rk / Ro);
    var C = (Ro / (R1 + R2));
    var D = ((R1 + R2) / Rk);
    var Wk = (I * I * Rk * t);
    var W = (V * I * t);
    if (!(R1 != R2 && nice(A) && nice(B) && nice(C) && nice(D) && V <= 100 && new Set([A, B, C, D]).size == 4)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "$ 倍", v: fmt(A)}, {t: "$" + fmt(B) + "$ 倍", v: fmt(B), why: "2つの抵抗の電力量の比をとった（比べるのは電源）"}, {t: "$" + fmt(C) + "$ 倍", v: fmt(C), why: "もう一方の抵抗の電力量で比をとった"}, {t: "$" + fmt(D) + "$ 倍", v: fmt(D), why: "電源の電力量を抵抗の電力量で割った（逆）"}]);
    return {form: "u12s4ratio", text: "図の回路で、$V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ である。$" + fmt(t) + "$ 秒の間、電流を流した時、$R_" + fmt(k) + "$ の電力量は電源の電力量の何倍か。", fig: {kind: "u12s4ser", L: tbU12s4_fig({"src":"{V}","r1":"{R}_1","r2":"{R}_2","i":"{I}"}, [["src", "{V}=" + qf(V, "V")], ["r1", "{R}_1=" + qf(R1, "O")], ["r2", "{R}_2=" + qf(R2, "O")]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["$I = " + qv(I, "A") + "$　$R_" + fmt(k) + "$：$" + fmt(I) + "^2 \\times " + fmt(Rk) + " \\times " + fmt(t) + " = " + fmt(Wk) + "\\,\\mathrm{J}$、電源：$" + fmt(V) + " \\times " + fmt(I) + " \\times " + fmt(t) + " = " + fmt(W) + "\\,\\mathrm{J}$", "$\\dfrac{" + fmt(Wk) + "}{" + fmt(W) + "} = " + fmt(A) + "$"], chk: {form: "u12s4ratio", p: {V: V, R1: R1, R2: R2, t: t, k: k}}};
  }
  throw new Error("u12s4ratio：条件に合う数字が見つからない");
}
// 12-5 グラフの面積 の練習（※ textbook/gen/make_section.py が textbook/gen/data/u12_s5.py から作った。手で直さない（データを直して作り直す）。）
function tbU12s5_gcd(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
function tbU12s5_ratio(a){ var g = a.reduce(function(x, y){ return tbU12s5_gcd(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function tbU12s5_par(a, b){ return a * b / (a + b); }
function tbU12s5_three(ok, cands){ var out = []; cands.forEach(function(z){ var x = Math.round(z.x * 1000) / 1000;
  if (out.length < 3 && isFinite(z.x) && nice(z.x) && x > 0 &&distinct([ok].concat(out.map(function(w){ return w.x; }), [x]))) out.push({x: x, why: z.why}); });
  return out.length === 3 ? out : null; }
function tbU12s5_fig(base, a){ var o = Object.assign({}, base); a.forEach(function(kv){ if (kv[1] === null) delete o[kv[0]]; else o[kv[0]] = kv[1]; }); return o; }
function tbU12s5_Qwhat(r){
  var gcd = tbU12s5_gcd, ratio = tbU12s5_ratio, par = tbU12s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var _c = choices(r, [{t: "電力量", v: "own"}, {t: "電力", v: "p", why: "電力はグラフの高さ。面積は電力×時間"}, {t: "電流", v: "i", why: "面積は電力×時間"}, {t: "抵抗", v: "r", why: "面積は電力×時間"}]);
    return {form: "u12s5what", text: "縦の軸に電力、横の軸に時間をとったグラフで、グラフと横の軸に囲まれた面積は □ を表す。", fig: {kind: "u12s5gr", L: tbU12s5_fig({"gx":"時間 [h]","gy":"電力 [kW]"}, []), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["面積＝縦×横＝電力×時間", "電力×時間＝電力量"], chk: {form: "u12s5what", p: {}}};
  }
  throw new Error("u12s5what：条件に合う数字が見つからない");
}
function tbU12s5_Qrect(r){
  var gcd = tbU12s5_gcd, ratio = tbU12s5_ratio, par = tbU12s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var P = pick(r, [0.5,1,1.5,2,2.5,3,4,5,6,8,10,12,20]);
    var h = pick(r, [2,3,4,5,6,8,10]);
    var A = (P * h);
    var B = (P * h / 2);
    var C = (P + h);
    var D = (P / h);
    if (!(P != h && nice(D) && new Set([A, B, C, D]).size == 4)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{kWh}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{kWh}$", v: fmt(B), why: "三角形と考えて半分にした（電力が一定なら長方形）"}, {t: "$" + fmt(C) + "\\,\\mathrm{kWh}$", v: fmt(C), why: "電力と時間を足した"}, {t: "$" + fmt(D) + "\\,\\mathrm{kWh}$", v: fmt(D), why: "時間で掛けずに割った"}]);
    return {form: "u12s5rect", text: "図のように、電力が $" + fmt(P) + "\\,\\mathrm{kW}$ のまま $" + fmt(h) + "$ 時間たった。電力と時間のグラフの面積から、この間の電力量は何 kWh か。", fig: {kind: "u12s5gr", L: tbU12s5_fig({"gx":"時間 [h]","gy":"電力 [kW]"}, [["gp", fmt(P) + " kW"], ["gt1", fmt(h) + " h"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電力が一定なので、グラフの下は長方形", "$" + fmt(P) + " \\times " + fmt(h) + " = " + fmt(A) + "\\,\\mathrm{kWh}$"], chk: {form: "u12s5rect", p: {P: P, h: h}}};
  }
  throw new Error("u12s5rect：条件に合う数字が見つからない");
}
function tbU12s5_Qtri(r){
  var gcd = tbU12s5_gcd, ratio = tbU12s5_ratio, par = tbU12s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var P = pick(r, [1,2,3,4,5,6,8,10,12,16,20]);
    var h = pick(r, [1,2,3,4,5,6,8]);
    var A = (P * h / 2);
    var B = (P * h);
    var C = (P / 2);
    var D = (P * h / 4);
    if (!(P != h && h > 1 && new Set([A, B, C, D]).size == 4)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{kWh}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{kWh}$", v: fmt(B), why: "ずっと $" + fmt(P) + "\\,\\mathrm{kW}$ と考えた（グラフの下は三角形）"}, {t: "$" + fmt(C) + "\\,\\mathrm{kWh}$", v: fmt(C), why: "時間を掛けていない"}, {t: "$" + fmt(D) + "\\,\\mathrm{kWh}$", v: fmt(D), why: "半分のさらに半分にした"}]);
    return {form: "u12s5tri", text: "図のように、電力が 0 から一定の割合で増え、$" + fmt(h) + "$ 時間で $" + fmt(P) + "\\,\\mathrm{kW}$ になった。この $" + fmt(h) + "$ 時間の電力量は何 kWh か。", fig: {kind: "u12s5gt", L: tbU12s5_fig({"gx":"時間 [h]","gy":"電力 [kW]"}, [["gp", fmt(P) + " kW"], ["gt1", fmt(h) + " h"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["電力が 0 から一定の割合で増えるので、グラフの下は三角形", "$" + fmt(P) + " \\times " + fmt(h) + " \\times \\dfrac{1}{2} = " + fmt(A) + "\\,\\mathrm{kWh}$"], chk: {form: "u12s5tri", p: {P: P, h: h}}};
  }
  throw new Error("u12s5tri：条件に合う数字が見つからない");
}
function tbU12s5_Qmix(r){
  var gcd = tbU12s5_gcd, ratio = tbU12s5_ratio, par = tbU12s5_par, max = Math.max, min = Math.min, abs = Math.abs;
  for (var _t = 0; _t < 20000; _t++) {
    var P = pick(r, [2,4,6,8,10,12]);
    var h1 = pick(r, [1,2,3,4]);
    var h2 = pick(r, [1,2,3,4,5]);
    var A = (P * h1 / 2 + P * h2);
    var B = (P * (h1 + h2));
    var C = (P * (h1 + h2) / 2);
    var D = (P * h2);
    if (!(h1 != h2 && new Set([A, B, C, D]).size == 4)) continue;
    var _c = choices(r, [{t: "$" + fmt(A) + "\\,\\mathrm{kWh}$", v: fmt(A)}, {t: "$" + fmt(B) + "\\,\\mathrm{kWh}$", v: fmt(B), why: "はじめからずっと $" + fmt(P) + "\\,\\mathrm{kW}$ と考えた（はじめは三角形）"}, {t: "$" + fmt(C) + "\\,\\mathrm{kWh}$", v: fmt(C), why: "全部を三角形と考えた（あとは長方形）"}, {t: "$" + fmt(D) + "\\,\\mathrm{kWh}$", v: fmt(D), why: "増えている間の分を足していない"}]);
    return {form: "u12s5mix", text: "図のように、電力が 0 から一定の割合で増えて $" + fmt(h1) + "$ 時間で $" + fmt(P) + "\\,\\mathrm{kW}$ になり、そのあと $" + fmt(P) + "\\,\\mathrm{kW}$ のまま $" + fmt(h2) + "$ 時間たった。全部で何 kWh か。", fig: {kind: "u12s5gm", L: tbU12s5_fig({"gx":"時間 [h]","gy":"電力 [kW]"}, [["gp", fmt(P) + " kW"], ["gt1", fmt(h1) + " h"], ["gt2", fmt(h1 + h2) + " h"]]), P: {}}, ch: _c.ch, ans: _c.ans, ex: ["三角形 $" + fmt(P) + " \\times " + fmt(h1) + " \\times \\dfrac{1}{2} = " + fmt(P * h1 / 2) + "$、長方形 $" + fmt(P) + " \\times " + fmt(h2) + " = " + fmt(P * h2) + "$", "$" + fmt(P * h1 / 2) + " + " + fmt(P * h2) + " = " + fmt(A) + "\\,\\mathrm{kWh}$"], chk: {form: "u12s5mix", p: {P: P, h1: h1, h2: h2}}};
  }
  throw new Error("u12s5mix：条件に合う数字が見つからない");
}
var GEN = {
  // 12-1 電力
  1: function(r){ return pick(r, [tbU12s1_Qdef, tbU12s1_Qunit, tbU12s1_Qp, tbU12s1_Qp, tbU12s1_Qp])(r); },
  // 12-2 電力の3つの式
  2: function(r){ return pick(r, [tbU12s2_Qlaw, tbU12s2_Qvi, tbU12s2_Qvi, tbU12s2_Qi2r, tbU12s2_Qi2r, tbU12s2_Qv2r, tbU12s2_Qv2r, tbU12s2_Qser, tbU12s2_Qser, tbU12s2_Qser])(r); },
  // 12-3 電力量
  3: function(r){ return pick(r, [tbU12s3_Qws, tbU12s3_Qws, tbU12s3_Qwh, tbU12s3_Qwh, tbU12s3_Qkwh, tbU12s3_Qkwh, tbU12s3_Qconv])(r); },
  // 12-4 回路の電力量
  4: function(r){ return pick(r, [tbU12s4_Qwk, tbU12s4_Qwk, tbU12s4_Qwk, tbU12s4_Qtot, tbU12s4_Qtot, tbU12s4_Qratio, tbU12s4_Qratio])(r); },
  // 12-5 グラフの面積
  5: function(r){ return pick(r, [tbU12s5_Qwhat, tbU12s5_Qrect, tbU12s5_Qrect, tbU12s5_Qtri, tbU12s5_Qtri, tbU12s5_Qtri, tbU12s5_Qmix])(r); }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t12s1e","scene":"t12s1e","kind":"u12s1one","lab":{"src":"{V}","r":"{R}","i":"{I}"},"viewbox":"417 297 642 335","band":{"want":"電力","ans":"1秒あたりに使う電気のエネルギー（単位 W＝J/s）","full":"電力は、1秒あたりに使う電気のエネルギー。単位は W（ワット）。エネルギーの単位は J（ジュール）なので、W＝J/s とも書ける。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電流が流れると、抵抗は電気のエネルギーを使います。","at":{"強調":1.0},"after":[],"emph":["R","I"]},{"text":"①エネルギー\n②1秒あたり\n③単位\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"エネルギーは、〖仕事をする能力〗のことです。電気のエネルギーは、熱や動きに変えられます。単位は J（ジュール）です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力は、〖1秒あたりに使う電気のエネルギー〗です。「1秒あたり」が大事です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R"]},{"text":"例えば、抵抗が 10 秒で 600 J の電気のエネルギーを使ったとします。1秒あたりは次のとおりです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R"],"eq":[{"cont":false,"items":[["\\dfrac{600}{10} = 60"]]}],"emphPre":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力の単位は〖$\\mathrm{W}$〗で、ワットと読みます。1秒あたりの $\\mathrm{J}$ なので、$\\mathrm{J/s}$ とも書けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R"],"eq":[{"cont":false,"items":[["\\mathrm{W} = \\mathrm{J/s}"]]}],"emphPre":["R"]},{"text":"この抵抗の電力は $60\\,\\mathrm{W}$ です。","at":{"強調":1.0,"続":1.0,"答え":1.0},"after":["答え","強調"],"emph":["R"],"eq":[{"cont":true,"items":[[""]]}],"ans":true,"emphPre":["R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s1oneL","u12s1onew1","zbu12s1one0hi"],"zlo":["u12s1oneRw","u12s1onew2","zbu12s1one1lo"]},"moves":{},"route":["エネルギー","1秒あたり","単位"]}},{"id":"t12s1x","scene":"t12s1x","kind":"u12s1one","lab":{"src":"{V}","r":"{R}","i":"{I}"},"viewbox":"417 297 642 335","band":{"want":"抵抗の電力","known":"5 秒で 400 J","ans":"$80\\,\\mathrm{W}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"求めるのは、抵抗の電力です。電力は〖1秒あたりに使う電気のエネルギー〗です。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"①1秒あたりにする\n②単位\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"5 秒で 400 J なので、〖秒の数で割ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R"],"eq":[{"cont":false,"items":[["\\dfrac{400}{5} = 80"]]}],"emphPre":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"1秒あたり 80 J なので、80 J/s＝$80\\,\\mathrm{W}$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R"],"eq":[{"cont":false,"items":[["80\\,\\mathrm{W}"]]}],"ans":true,"emphPre":["R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s1oneL","u12s1onew1","zbu12s1one0hi"],"zlo":["u12s1oneRw","u12s1onew2","zbu12s1one1lo"]},"moves":{},"route":["1秒あたりにする","単位"]}},{"id":"t12s2e","scene":"t12s2e","kind":"u12s2ser","lab":{"src":"{V}=20 V","r1":"{R}_1=4 Ω","r2":"{R}_2=6 Ω","i":["{I}","{I}=2 A"],"v1":"{V}_1","v2":"{V}_2"},"viewbox":"314 218 745 424","band":{"want":"電力の3つの式","ans":"$P = VI = I^2 R = \\dfrac{V^2}{R}$","full":"電力は電圧と電流の積 $P = VI$。オームの法則を入れると $P = I^2 R$、$P = \\dfrac{V^2}{R}$ とも書ける。"},"narr":{"start":{"co":1,"iv":0,"v1d":0,"v2d":0},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力を電圧・電流・抵抗で表す式を見ます。","at":{"強調":1.0},"after":[],"emph":["src","R1","R2","I"]},{"text":"①$P = VI$\n②ほかの2つ\n③各抵抗と全体\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","src","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力は、〖電圧と電流を掛けた物〗です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"move":"varr","emph":["V1","V2","I","src"],"eq":[{"cont":false,"items":[["P = VI"]]}],"emphPre":["V1","I","src"]}]},{"cap":null,"eqp":null,"vid":[1,12],"sents":[{"text":"オームの法則 $V = IR$ を入れると、〖電流と抵抗で表せます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I","R1","R2","src"],"eq":[{"cont":false,"items":[["P = VI = I \\times IR = I^2 R"]]}],"emphPre":["I","R1","R2","src"]},{"text":"$I = \\dfrac{V}{R}$ を入れると、電圧と抵抗で表せます。〖3つとも使えるようにします〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["V1","V2","R1","R2","I","src"],"eq":[{"cont":false,"items":[["P = V \\times \\dfrac{V}{R} = \\dfrac{V^2}{R}"]]}],"emphPre":["V1","V2","R1","R2","I","src"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"数字で確かめます。合成抵抗は $4 + 6 = 10\\,\\Omega$ なので、電流は次のとおりです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":3,"emph":["src","R1","R2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{20}{10} = 2\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["src","R1","R2","I"]},{"text":"各抵抗の電力は $I^2 R$ で出します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","I"],"eq":[{"cont":false,"items":[["P_1 = 2^2 \\times 4 = 16\\,\\mathrm{W}","P_2 = 2^2 \\times 6 = 24\\,\\mathrm{W}"]]}],"emphPre":["R1","R2","I"]},{"text":"全体の電力は和の $40\\,\\mathrm{W}$ です。〖全体の電圧と電流でも、3つの式のどれでも同じ〗です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["src","I","R1","R2"],"eq":[{"cont":false,"items":[["VI = 20 \\times 2 = 40"],["I^2 R = 2^2 \\times 10 = 40"],["\\dfrac{V^2}{R} = \\dfrac{20^2}{10} = 40\\,\\mathrm{W}"]]}],"ans":true,"emphPre":["src","I","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s2serL","u12s2serw1","zbu12s2ser0hi"],"zlo":["u12s2serRw","u12s2serw3","zbu12s2ser1lo"],"zmid":["u12s2serw2","zbu12s2ser2mid"]},"moves":{"ival":{"to":{"iv":1},"dur":0.4},"varr":{"to":{"v1d":1,"v2d":1},"dur":0.6}},"route":["$P = VI$","ほかの2つ","各抵抗と全体"]}},{"id":"t12s2x","scene":"t12s2x","kind":"u12s2ser","lab":{"src":"{V}=16 V","r1":"{R}_1=3 Ω","r2":"{R}_2=5 Ω","i":["{I}","{I}=2 A"]},"viewbox":"314 218 745 424","band":{"want":"$R_2$ の電力","known":"$V = 16\\,\\mathrm{V},\\;\\; R_1 = 3\\,\\Omega,\\;\\; R_2 = 5\\,\\Omega$","ans":"$20\\,\\mathrm{W}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"求めるのは、$R_2$ の電力です。〖直列で電流が同じ〗なので、$P = I^2 R$ を使います。","at":{"強調":1.0},"after":[],"emph":["R2","I"]},{"text":"①電流\n②$I^2 R$\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R2","I"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"合成抵抗は $3 + 5 = 8\\,\\Omega$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","R1","R2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R_1 + R_2}"],["I = \\dfrac{16}{8} = 2\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["R1","R2","src","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"$R_2$ の電力です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R2","I"],"eq":[{"cont":false,"items":[["P_2 = I^2 R_2"],["P_2 = 2^2 \\times 5 = 20\\,\\mathrm{W}"]]}],"ans":true,"emphPre":["R2","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"R2":["r2","r2t0","r2t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s2serL","u12s2serw1","zbu12s2ser0hi"],"zlo":["u12s2serRw","u12s2serw3","zbu12s2ser1lo"],"zmid":["u12s2serw2","zbu12s2ser2mid"]},"moves":{"ival":{"to":{"iv":1},"dur":0.4}},"route":["電流","$I^2 R$"]}},{"id":"t12s3e","scene":"t12s3e","kind":"u12s3one","lab":{"src":"{V}","r":"{R}","i":"{I}"},"viewbox":"417 297 642 335","band":{"want":"電力量","ans":"$W = Pt$（単位 W·s＝J・Wh・kWh）","full":"電力量は、使った電気のエネルギー。電力×時間で求める。W×秒＝W·s（＝J）、W×時間＝Wh、kW×時間＝kWh。"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力は1秒あたりの量でした。実際に使った電気のエネルギーの量を、〖電力量〗といいます。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"①電力量とは\n②$W = Pt$\n③単位\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力量は、〖電力に時間を掛けた物〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R"],"eq":[{"cont":false,"items":[["W = Pt"]]}],"emphPre":["R"]},{"text":"例えば、$500\\,\\mathrm{W}$ の抵抗に 2 時間、電流を流したとします。","at":{"強調":1.0},"after":[],"emph":["R","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力量の単位は、電力と時間の単位で決まります。時間を秒にすると W·s です。W は J/s なので、〖W·s は J と同じ〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R"],"eq":[{"cont":false,"items":[["500 \\times 7200 = 3600000\\,\\mathrm{J}"]]}],"emphPre":["R"]},{"text":"時間のまま掛けると Wh（ワット時）です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R"],"eq":[{"cont":false,"items":[["500 \\times 2 = 1000\\,\\mathrm{Wh}"]]}],"emphPre":["R"]},{"text":"$1000\\,\\mathrm{W}$ は $1\\,\\mathrm{kW}$ です。kW に時間を掛けると kWh です。〖kWh から Wh は 1000 倍、Wh から W·s は 3600 倍〗です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["R"],"eq":[{"cont":false,"items":[["0.5 \\times 2 = 1\\,\\mathrm{kWh}"]]}],"ans":true,"emphPre":["R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s3oneL","u12s3onew1","zbu12s3one0hi"],"zlo":["u12s3oneRw","u12s3onew2","zbu12s3one1lo"]},"moves":{},"route":["電力量とは","$W = Pt$","単位"]}},{"id":"t12s3x","scene":"t12s3x","kind":"u12s3one","lab":{"src":"{V}","r":"{R}","i":"{I}"},"viewbox":"417 297 642 335","band":{"want":"電力量（Wh）","known":"電力 $100\\,\\mathrm{W}$、30 分","ans":"$50\\,\\mathrm{Wh}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"求めるのは、Wh で表した電力量です。Wh は W×時間なので、時間の数で掛けます。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"①時間にする\n②$W = Pt$\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"30 分は、〖1 時間の半分〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R"],"eq":[{"cont":false,"items":[["\\dfrac{30}{60} = 0.5"]]}],"emphPre":["R"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力に時間を掛けます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["R"],"eq":[{"cont":false,"items":[["W = Pt"],["W = 100 \\times 0.5 = 50\\,\\mathrm{Wh}"]]}],"ans":true,"emphPre":["R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s3oneL","u12s3onew1","zbu12s3one0hi"],"zlo":["u12s3oneRw","u12s3onew2","zbu12s3one1lo"]},"moves":{},"route":["時間にする","$W = Pt$"]}},{"id":"t12s4e","scene":"t12s4e","kind":"u12s4ser","lab":{"src":"{V}=16 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","i":["{I}","{I}=2 A"]},"viewbox":"319 292 740 349","band":{"want":"回路の各抵抗と電源の電力量","ans":"電力×時間（秒で掛けると J）。電源の電力量＝各抵抗の電力量の和","full":"各抵抗の電力量は $I^2 R \\times$ 時間。電源の電力量は $VI \\times$ 時間で、各抵抗の電力量の和と等しい。"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"この回路に 10 秒の間、電流を流した時の、各抵抗と電源の電力量を求めます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","src"]},{"text":"①電流\n②各抵抗\n③電源と比\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","src"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"合成抵抗は $2 + 6 = 8\\,\\Omega$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","R1","R2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{16}{8} = 2\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"各抵抗の電力は $I^2 R$、〖電力量はそれに秒の数を掛けます〗。単位は J です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2","I"],"eq":[{"cont":false,"items":[["W_1 = 2^2 \\times 2 \\times 10 = 80\\,\\mathrm{J}","W_2 = 2^2 \\times 6 \\times 10 = 240\\,\\mathrm{J}"]]}],"emphPre":["R1","R2","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電源の電力量は、電源の電圧×電流×時間です。〖各抵抗の電力量の和と同じ〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["src","I","R1","R2"],"eq":[{"cont":false,"items":[["16 \\times 2 \\times 10 = 320\\,\\mathrm{J}"],["80 + 240 = 320\\,\\mathrm{J}"]]}],"emphPre":["src","I"]},{"text":"$R_1$ の電力量は、電源の電力量の何倍かを見ます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["R1","src"],"eq":[{"cont":false,"items":[["\\dfrac{80}{320} = 0.25"]]}],"ans":true,"emphPre":["R1","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s4serL","u12s4serw1","zbu12s4ser0hi"],"zlo":["u12s4serRw","u12s4serw3","zbu12s4ser1lo"],"zmid":["u12s4serw2","zbu12s4ser2mid"]},"moves":{"ival":{"to":{"iv":1},"dur":0.4}},"route":["電流","各抵抗","電源と比"]}},{"id":"t12s4x","scene":"t12s4x","kind":"u12s4ser","lab":{"src":"{V}=10 V","r1":"{R}_1=3 Ω","r2":"{R}_2=2 Ω","i":["{I}","{I}=2 A"]},"viewbox":"319 292 740 349","band":{"want":"$R_1$ の電力量は、電源の電力量の何倍か","known":"$V = 10\\,\\mathrm{V},\\;\\; R_1 = 3\\,\\Omega,\\;\\; R_2 = 2\\,\\Omega$、20 秒","ans":"$0.6$ 倍"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"求めるのは、〖$R_1$ の電力量が電源の電力量の何倍か〗です。","at":{"強調":1.0},"after":[],"emph":["R1","src"]},{"text":"①電流\n②$R_1$ の電力量\n③電源の電力量\n④比\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","src"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"合成抵抗は $3 + 2 = 5\\,\\Omega$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","R1","R2","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{10}{5} = 2\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"$R_1$ の電力量です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","I"],"eq":[{"cont":false,"items":[["W_1 = I^2 R_1 t"],["W_1 = 2^2 \\times 3 \\times 20 = 240\\,\\mathrm{J}"]]}],"emphPre":["R1","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電源の電力量です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["src","I"],"eq":[{"cont":false,"items":[["W = VIt"],["W = 10 \\times 2 \\times 20 = 400\\,\\mathrm{J}"]]}],"emphPre":["src","I"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"比をとります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":4,"emph":["R1","src"],"eq":[{"cont":false,"items":[["\\dfrac{240}{400} = 0.6"]]}],"ans":true,"emphPre":["R1","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u12s4serL","u12s4serw1","zbu12s4ser0hi"],"zlo":["u12s4serRw","u12s4serw3","zbu12s4ser1lo"],"zmid":["u12s4serw2","zbu12s4ser2mid"]},"moves":{"ival":{"to":{"iv":1},"dur":0.4}},"route":["電流","$R_1$ の電力量","電源の電力量","比"]}},{"id":"t12s5e","scene":"t12s5e","kind":"u12s5ge","lab":{"gx":"時間 [h]","gy":"電力 [kW]","gp":["3 kW","6 kW"],"gt1":["4 h","3 h"],"ga1":["12 kWh","9 kWh"]},"viewbox":"66 147 708 455","band":{"want":"電力と時間のグラフの面積","ans":"面積＝電力量","full":"縦の軸に電力、横の軸に時間をとったグラフでは、グラフと横の軸に囲まれた面積が電力量。"},"narr":{"start":{"co":1,"t":0,"gpv":0,"gt1v":0,"ga1v":0},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"縦の軸に電力、横の軸に時間をとったグラフを考えます。","at":{"強調":1.0},"after":[],"emph":["Ax"]},{"text":"①長方形\n②三角形\n③面積＝電力量\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ax"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力が $3\\,\\mathrm{kW}$ のまま 4 時間たつと、グラフは横の線になり、下は長方形になります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Line","Gp","Gt1"]},{"text":"長方形の面積は、縦×横＝電力×時間です。〖これは電力量そのもの〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Rect","Gp","Gt1"],"eq":[{"cont":false,"items":[["3 \\times 4 = 12\\,\\mathrm{kWh}"]]}],"emphPre":["Rect","Gp","Gt1"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力が 0 から一定の割合で増え、3 時間で $6\\,\\mathrm{kW}$ になるとします。グラフは斜めの線で、下は三角形です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":2,"move":"tri","emph":["Line","Gp","Gt1"]},{"text":"三角形の面積は、〖縦×横の半分〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["Tri","Gp","Gt1"],"eq":[{"cont":false,"items":[["6 \\times 3 \\times \\dfrac{1}{2} = 9\\,\\mathrm{kWh}"]]}],"emphPre":["Tri","Gp","Gt1"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"どちらも、〖グラフと横の軸に囲まれた面積が電力量〗です。","at":{"道筋":1.0,"答え":1.0,"強調":1.0},"after":[],"route":3,"ans":true,"emph":["Area"]}]}],"groups":{"Rect":["gf1","ga1t0","ga1t1"],"Area":["gf1","ga1t0","ga1t1","gf1x1","ga1tx10","ga1tx11"],"Ax":["gax","gax:h","gay","gay:h","go","gxt0","gxt1","gyt0","gyt1","gaxx1","gaxx1:h","gayx1","gayx1:h","gox1","gxtx10","gxtx11","gytx10","gytx11"],"Line":["gl","glx1"],"Gp":["gpd","gpt0","gpt1","gpdx1","gptx10","gptx11"],"Gt1":["gt1d","gt1t0","gt1t1","gt1dx1","gt1tx10","gt1tx11"],"Tri":["gf1x1","ga1tx10","ga1tx11"]},"moves":{"tri":{"to":{"t":1,"gpv":1,"gt1v":1,"ga1v":1},"dur":0.8}},"route":["長方形","三角形","面積＝電力量"]}},{"id":"t12s5x","scene":"t12s5x","kind":"u12s5gt","lab":{"gx":"時間 [h]","gy":"電力 [kW]","gp":"8 kW","gt1":"2 h","ga1":"8 kWh"},"viewbox":"66 147 708 455","band":{"want":"電力量（kWh）","known":"0 から $8\\,\\mathrm{kW}$ まで一定の割合で 2 時間","ans":"$8\\,\\mathrm{kWh}$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"求めるのは電力量です。電力と時間のグラフの面積で求めます。","at":{"強調":1.0},"after":[],"emph":["Ax"]},{"text":"①形を見る\n②面積\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["Ax"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"電力は 0 から一定の割合で増えるので、〖グラフの下は三角形〗です。縦が $8\\,\\mathrm{kW}$、横が 2 時間です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["Line","Gp","Gt1"]}]},{"cap":null,"eqp":null,"vid":[12],"sents":[{"text":"三角形の面積は、〖縦×横の半分〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["Tri","Gp","Gt1"],"eq":[{"cont":false,"items":[["8 \\times 2 \\times \\dfrac{1}{2} = 8\\,\\mathrm{kWh}"]]}],"ans":true,"emphPre":["Tri","Gp","Gt1"]}]}],"groups":{"Tri":["gf1","ga1t0","ga1t1"],"Area":["gf1","ga1t0","ga1t1"],"Ax":["gax","gax:h","gay","gay:h","go","gxt0","gxt1","gyt0","gyt1"],"Line":["gl"],"Gp":["gpd","gpt0","gpt1"],"Gt1":["gt1d","gt1t0","gt1t1"]},"moves":{},"route":["形を見る","面積"]}}],"secs":[{"ex":{"text":"図の抵抗は、5 秒で 400 J の電気のエネルギーを使った。この抵抗の電力は何 W か。","fig":{"kind":"u12s1one","L":{"src":"{V}","r":"{R}","i":"{I}"},"P":{}},"ch":[{"t":"$2000\\,\\mathrm{W}$","v":2000,"why":"秒の数で割らずに掛けた"},{"t":"$80\\,\\mathrm{W}$","v":80,"why":""},{"t":"$400\\,\\mathrm{W}$","v":400,"why":"5 秒の全部を答えた（電力は1秒あたり）"},{"t":"$0.0125\\,\\mathrm{W}$","v":0.0125,"why":"秒の数をエネルギーで割った"}],"ans":1}},{"ex":{"text":"図の回路で、$V = 16\\,\\mathrm{V}$、$R_1 = 3\\,\\Omega$、$R_2 = 5\\,\\Omega$ である。$R_2$ の電力は何 W か。","fig":{"kind":"u12s2ser","L":{"src":"{V}=16 V","r1":"{R}_1=3 Ω","r2":"{R}_2=5 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$32\\,\\mathrm{W}$","v":32,"why":"全体の電力を答えた"},{"t":"$20\\,\\mathrm{W}$","v":20,"why":""},{"t":"$12\\,\\mathrm{W}$","v":12,"why":"$R_1$ の電力を答えた"},{"t":"$10\\,\\mathrm{W}$","v":10,"why":"電流を2乗していない（$I^2 R$）"}],"ans":1}},{"ex":{"text":"図の抵抗の電力は $100\\,\\mathrm{W}$ である。30 分間電流を流した時の電力量は何 Wh か。","fig":{"kind":"u12s3one","L":{"src":"{V}","r":"{R}","i":"{I}"},"P":{}},"ch":[{"t":"$3000\\,\\mathrm{Wh}$","v":3000,"why":"分のまま掛けた（Wh は時間で掛ける）"},{"t":"$50\\,\\mathrm{Wh}$","v":50,"why":""},{"t":"$180000\\,\\mathrm{Wh}$","v":180000,"why":"秒にして掛けた（それは W·s＝J）"},{"t":"$0.05\\,\\mathrm{Wh}$","v":0.05,"why":"1000 で割った（それは kWh）"}],"ans":1}},{"ex":{"text":"図の回路で、$V = 10\\,\\mathrm{V}$、$R_1 = 3\\,\\Omega$、$R_2 = 2\\,\\Omega$ である。20 秒の間、電流を流した時、$R_1$ の電力量は電源の電力量の何倍か。","fig":{"kind":"u12s4ser","L":{"src":"{V}=10 V","r1":"{R}_1=3 Ω","r2":"{R}_2=2 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$1.5$ 倍","v":1.5,"why":"$R_1$ と $R_2$ の電力量の比をとった（比べるのは電源）"},{"t":"$0.6$ 倍","v":0.6,"why":""},{"t":"$0.4$ 倍","v":0.4,"why":"$R_2$ の電力量で比をとった"},{"t":"$0.5$ 倍","v":0.5,"why":"抵抗が2つなので半分ずつと考えた（抵抗の大きさで変わる）"}],"ans":1}},{"ex":{"text":"図のように、電力が 0 から一定の割合で増え、2 時間で $8\\,\\mathrm{kW}$ になった。この 2 時間の電力量は何 kWh か。","fig":{"kind":"u12s5gt","L":{"gx":"時間 [h]","gy":"電力 [kW]","gp":"8 kW","gt1":"2 h"},"P":{}},"ch":[{"t":"$16\\,\\mathrm{kWh}$","v":16,"why":"ずっと $8\\,\\mathrm{kW}$ と考えた（グラフの下は三角形）"},{"t":"$8\\,\\mathrm{kWh}$","v":8,"why":""},{"t":"$4\\,\\mathrm{kWh}$","v":4,"why":"時間を掛けていない（$8$ の半分だけ）"},{"t":"$10\\,\\mathrm{kWh}$","v":10,"why":"電力と時間を足した"}],"ans":1}}],"past":[]}};
});
