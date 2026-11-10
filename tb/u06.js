/* 単元6「抵抗率と温度」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(6, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, ZC = H.ZC, zband = H.zband, ztint = H.ztint, zpt = H.zpt, zones = H.zones, vOn = H.vOn, zoneTint = H.zoneTint, zSides = H.zSides, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元6の図（自作）の、節の間で共通の部品。共通の部品（vdim・pv・swapText・zones など）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 節の図は u06/sN_scenes.js（u06.py が番号順につなぎ、KINDS・FLOWK を1つにまとめる）。このファイルは書き換えない（足したい部品は自分の節のファイルへ）。
// 単元3の部品（u03/common_scenes.js）と同じ形。単元のファイルは別々に読み込むので、名前に 6 を付けて写した（単元5の部品と同じ形）。
// 名前 L[k]：文字（そのまま）か [前, 後]（p[k + "v"] で前→後へ入れ替える）。矢印の濃さ＝p[k + "o"]（無ければ 1）、
// 電圧の矢印の伸び＝p[k + "d"]（無ければ 1）。問題の画面の図は p を渡さない＝全部出た形。
// 座標は単元3と同じ：上の線 y=360、左の縦の線 x=478、右の縦の線 x=1045、電池は下の線の真ん中（＋極＝長い線 x=752、－極 x=772）。
// 電流は＋極から出て、下の線を左へ → 左の線を上へ → 上の線を右へ → 右の線を下へ。抵抗は左の端（電流が入る側）が高い電位。
function lab6(d, id, x, y, spec, p, k, o, opt){
  if (spec === undefined || spec === null) return;
  if (Array.isArray(spec)) swapText(d, id, x, y, spec[0], spec[1], pv(p, k + "v"), o, opt);
  else swapText(d, id, x, y, spec, null, 0, o, opt);
}
// 抵抗（横）と名前（抵抗の上）
function resL6(d, id, x, y, L, k, p){
  d.res(id, x, y, "h");
  lab6(d, id + "t", x, y - 30, L[k], p, k, 1);
}
// 横の抵抗の電圧の矢印（上 or 下）。左の端が高い電位＝矢じりは左
function vArrow6(d, id, x, y, L, k, p, below){
  if (L[k] === undefined) return;
  var dd = pv(p, k + "d", 1), y0 = below ? y + 10 : y - 10, y1 = below ? y + 95 : y - 85, ya = below ? y + 85 : y - 75;
  var w = vdim(d, id + "d", x - 72.5, x + 72.5, y0, y1, ya, dd, {});
  lab6(d, id + "t", x, below ? ya + 25 : ya - 25, L[k], p, k, w);
}
// 左の縦の線（x=478）の全体の電流 I（上向き）。名前は線の右。id＝k + "a"・名前＝k + "t"
function iLeft6(d, yb, L, p, k){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), ym = yb - 80;
  d.arrow(k + "a", 478, ym + 20, 478, ym - 20, {o: o});
  lab6(d, k + "t", 494, ym, L[k], p, k, o, {anchor: "start"});
}
// 横の線の上の電流の矢印（右向き）。x＝矢印の真ん中、名前は線の上（below で下）。並列の道の電流（抵抗の右の線）などに使う
// （電流の矢印は、その電流が流れる導線の上に置く＝proto_circuit/SPEC_expl.md §4。名前は線にかけない）
function iWire6(d, k, x, y, L, p, below){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1);
  d.arrow(k + "a", x - 20, y, x + 20, y, {o: o});
  lab6(d, k + "t", x, below ? y + 30 : y - 24, L[k], p, k, o);
}
// 電源（下の線の真ん中）・＋と－・電源の電圧の名前
function srcPart6(d, yb, L, p){
  d.cell("c", 752, yb);
  if (L.pm) { d.text("pp", 722, yb - 26, "+"); d.text("pm", 802, yb - 26, "−"); }
  lab6(d, "e", 762, yb + 42, L.src, p, "src", 1);
}
// 電位を見る点：L["p" + k] = {v: 電位}（v が無ければ点と名前だけ）。点の濃さ＝p["p" + k + "o"]、電位の濃さ＝p["p" + k + "vo"]
// side "v"＝縦の線の上（名前は線の左・電位は線の右）、無し＝横の線の上（名前は線の下・電位は線の上）
function pt6(d, k, x, y, L, p, side){
  var P = L["p" + k]; if (!P) return;
  var o = pv(p, "p" + k + "o", 1), vo = o * pv(p, "p" + k + "vo", 1);
  d.dot("d" + k, x, y, {o: o});
  if (side === "v") {
    d.text("n" + k, x - 18, y, k, {o: o, anchor: "end"});
    if (P.v !== undefined) lab6(d, "p" + k + "t", x + 18, y, P.v, p, "p" + k, vo, {anchor: "start"});
  } else {
    d.text("n" + k, x, y + 30, k, {o: o});
    if (P.v !== undefined) lab6(d, "p" + k + "t", x, y - 32, P.v, p, "p" + k, vo);
  }
}
// ---- 単元6で足した部品（抵抗の形と温度。電流の流れない図）
// 長さの寸法線（両端に矢じり。2026-11-04 まとめ役：電圧の矢印 vdim は片矢じりなので、長さには使わない）。
// xa・xb＝両端の x、yb→yt＝両端の縦の補助線、ya＝寸法線の高さ。v＝伸び（0〜0.5 で補助線、0.5〜1 で寸法線が真ん中から両側へ伸びる）。
// 線の id と class は vdim と同じ（id:e・id:f＝補助線、id:a＝寸法線「ink vdim」＝導線として数えない）。返す物＝寸法線の伸び（0〜1）
function dim6(d, id, xa, xb, yb, yt, ya, v, o){
  var e1 = Math.min(1, v * 2), w = Math.max(0, v * 2 - 1), yy = yb + (yt - yb) * e1, oo = o && o.o !== undefined ? o.o : 1;
  d.wire(id + ":e", [[xa, yb], [xa, yy]], Object.assign({}, o, {o: e1 > 0 ? oo : 0}));
  d.wire(id + ":f", [[xb, yb], [xb, yy]], Object.assign({}, o, {o: e1 > 0 ? oo : 0}));
  var c = (xa + xb) / 2, hw = (xb - xa) / 2 * w, A = c - hw, B = c + hw, sg = xb > xa ? 1 : -1, h = 11, dd = "";
  if (w > 0.02) dd = "M" + n(A) + " " + ya + " H" + n(B)
    + " M" + n(A + sg * h) + " " + (ya - 6) + " L" + n(A) + " " + ya + " L" + n(A + sg * h) + " " + (ya + 6)
    + " M" + n(B - sg * h) + " " + (ya - 6) + " L" + n(B) + " " + ya + " L" + n(B - sg * h) + " " + (ya + 6);
  var a = d.el(id + ":a", "path", "ink vdim"); a.setAttribute("d", dd);
  d.style(a, o);
  return w;
}
// 円柱の抵抗（横向き）：左の端の中心 (x0, y)・長さ w・半径 h。名前 L.l＝長さ（下の寸法線）・L.S＝断面積（右の端の面の右）・L.rho＝物質（上）。
// 線の id は id + ":…"。寸法線の伸び＝p[id + "d"]（無ければ 1）
function cyl6(d, id, x0, y, w, h, L, p){
  var k = 24, e = function(cx, half){ var pts = []; for (var i = 0; i <= k; i++){ var t = (half ? -0.5 : 0) * Math.PI + (half ? Math.PI : 2 * Math.PI) * i / k;
    pts.push([cx + h * 0.32 * Math.cos(t), y + h * Math.sin(t)]); } return pts; };
  d.wire(id + ":a", e(x0 + w, false));
  d.wire(id + ":b", e(x0, true).map(function(q){ return [2 * x0 - q[0], q[1]]; }));
  d.wire(id + ":t", [[x0, y - h], [x0 + w, y - h]]); d.wire(id + ":u", [[x0, y + h], [x0 + w, y + h]]);
  if (L.l !== undefined) { var dd = pv(p, id + "d", 1), w2 = dim6(d, id + "d", x0, x0 + w, y + h + 10, y + h + 70, y + h + 60, dd, {});
    lab6(d, id + "lt", x0 + w / 2, y + h + 90, L.l, p, id + "l", w2); }
  if (L.S !== undefined) lab6(d, id + "st", x0 + w + h * 0.32 + 20, y, L.S, p, id + "s", 1, {anchor: "start"});
  if (L.rho !== undefined) lab6(d, id + "rt", x0 + w / 2, y - h - 24, L.rho, p, id + "r", 1);
}
// グラフの軸：原点 (x0, y0)・横の長さ w・縦の長さ h。L.ax＝横軸の名前・L.ay＝縦軸の名前（矢じりの先）
function axes6(d, id, x0, y0, w, h, L){
  d.arrow(id + "x", x0, y0, x0 + w, y0); d.arrow(id + "y", x0, y0, x0, y0 - h);
  if (L.ax !== undefined) d.text(id + "xt", x0 + w, y0 + 34, L.ax, {anchor: "end"});
  if (L.ay !== undefined) d.text(id + "yt", x0 - 14, y0 - h, L.ay, {anchor: "end"});
}
// ---- 6-1 抵抗率 の図：円柱の抵抗（u6s1cyl）。電流は流さない（FLOWK に載せない）。電位も出ないので色の帯は無い。
// 円柱＝cyl6（左の端 x=540・長さ 300・半径 60・中心の高さ y=400）。長さ l は下の寸法線、断面積 S は右の端の面の右。
// 抵抗の名前 R は円柱の上、抵抗率 ρ は円柱の中。名前の入れ替え＝p.rv（R）・p.rhov（ρ）・p.u6s1clv（l）・p.u6s1csv（S）。
// 寸法線の伸び＝p.u6s1cd（無ければ 1）。線の id は u6s1 で始める。
function tbU6s1cyl(d, p, L){
  var x0 = 540, y = 400, w = 300, h = 60;
  cyl6(d, "u6s1c", x0, y, w, h, {l: L.l, S: L.S}, p);
  lab6(d, "u6s1rt", x0 + w / 2, y - h - 30, L.r, p, "r", 1);
  lab6(d, "u6s1pt", x0 + w / 2, y, L.rho, p, "rho", 1);
}
// ---- 6-2 単位を式から出す の図：円柱の抵抗（u6s2cyl）。6-1 の円柱と同じ置き方（左の端 x=540・長さ 300・半径 60・y=400）。
// 電流は流さない（FLOWK に載せない）。電位も出ないので色の帯は無い。
// 名前を記号から単位へ入れ替えて「単位に置き換える」を見せる：p.rv（R）・p.rhov（ρ）・p.u6s2clv（l）・p.u6s2csv（S）。線の id は u6s2 で始める。
function tbU6s2cyl(d, p, L){
  var x0 = 540, y = 400, w = 300, h = 60;
  cyl6(d, "u6s2c", x0, y, w, h, {l: L.l, S: L.S}, p);
  lab6(d, "u6s2rt", x0 + w / 2, y - h - 30, L.r, p, "r", 1);
  lab6(d, "u6s2pt", x0 + w / 2, y, L.rho, p, "rho", 1);
}
// ---- 6-3 長さと断面積 の図：同じ物質の円柱の抵抗2つ（u6s3two）。上＝元の抵抗、下＝長さか断面積を変えた抵抗。
// 電流は流さない（FLOWK に載せない）。電位も出ないので色の帯は無い。
// 上：cyl6（左の端 x=520・長さ 150・半径 40・y=310）、名前 R は円柱の中。
// 下：左の端 x=520・y=560。長さ＝150 × lk、半径＝40 × √sk（断面積が sk 倍）。lk・sk＝p.lk・p.sk（無ければ L.lk・L.sk、それも無ければ 1）。
//   下の名前（L.r2・L.l2・L.S2）は文字か、段ごとの名前の並び（p.g の段で入れ替える。p.g が無ければ最後の名前）。
//   下の寸法線と名前は、段で動くのでこのファイルで描く（cyl6 には名前を渡さない）。
// L.one があれば上だけ描く。線の id は u6s3 で始める。
function u6s3txt(d, id, x, y, spec, g, opt){
  if (spec === undefined || spec === null) return;
  if (!Array.isArray(spec)) { swapText(d, id, x, y, spec, null, 0, 1, opt); return; }
  if (spec.length === 1) { swapText(d, id, x, y, spec[0], null, 0, 1, opt); return; }
  if (g === undefined) g = spec.length - 1;
  var i = Math.max(0, Math.min(spec.length - 2, Math.floor(g))), t = Math.max(0, Math.min(1, g - i));
  swapText(d, id, x, y, spec[i], spec[i + 1], t, 1, opt);
}
function tbU6s3two(d, p, L){
  var x0 = 520, w0 = 150, h0 = 40, ya = 310, yb = 560;
  cyl6(d, "u6s3a", x0, ya, w0, h0, {l: L.l1, S: L.S1}, p);
  lab6(d, "u6s3rat", x0 + w0 / 2, ya, L.r1, p, "r1", 1);
  if (L.one) return;
  var lk = pv(p, "lk", L.lk || 1), sk = pv(p, "sk", L.sk || 1), g = p.g;
  var w = w0 * lk, h = h0 * Math.sqrt(sk);
  cyl6(d, "u6s3b", x0, yb, w, h, {}, p);
  vdim(d, "u6s3bd", x0, x0 + w, yb + h + 10, yb + h + 70, yb + h + 60, 1, {});
  u6s3txt(d, "u6s3blt", x0 + w / 2, yb + h + 90, L.l2, g);
  u6s3txt(d, "u6s3bst", x0 + w + h * 0.32 + 20, yb, L.S2, g, {anchor: "start"});
  // 名前 R2 は、円柱が元の長さ以上なら中、短い時は右の端の面の右下（断面積の名前の下。中に入らないため）
  if (w >= w0 - 1e-6) u6s3txt(d, "u6s3rbt", x0 + w / 2, yb, L.r2, g);
  else u6s3txt(d, "u6s3rbt", x0 + w + h * 0.32 + 20, yb + 44, L.r2, g, {anchor: "start"});
}
// ---- 6-4 抵抗を長さで分ける の図（自作）。
// u6s4bar：上の線に1本の長い抵抗（x=560〜960・高さ28）。電源は下の線の真ん中（単元3と同じ座標）。
//   L.f＝左の部分の長さの割合（分ける所 xd = 560 + 400 f）。分ける前の形と分けた形は p.cv（0→1）で入れ替わる。
//   名前：L.r＝1本の抵抗（下の寸法線のさらに下 y=488）／L.r1・L.r2＝分けた部分（抵抗の上 y=318。短絡した線の縦の線にかからないよう分ける所から 80 離す）。
//   長さ：L.l＝全体の寸法線／L.l1・L.l2＝部分の寸法線（抵抗の下 y=380〜446。分ける前は全体・分けた後は部分）。
//   短絡：L.sh＝1（左の部分の両端を線でつなぐ）／2（右の部分）。線は y=268 を通る。濃さ p.sh（無ければ 1）。
//   L.bare＝1 なら抵抗と名前と寸法線と両端の点だけ（電源を描かない・電流は流れない。長さの比だけを問う練習）。
// u6s4ser：分けた2つの抵抗を回路図に描き直した形（R1 x=640・R2 x=880、単元4の直列と同じ座標）。短絡した線は y=280 を通る。
// u6s4e（説明・例題の解説）：p.t が 0.5 より前は u6s4bar（濃さ 1−2t）、後は u6s4ser（濃さ 2t−1）。同時には描かない。
// 同じ電位の線の色の帯：電源の電圧が出ている時（vOn）。＋極の側＝赤・－極の側＝灰。短絡した線はつながっている側と同じ色（短絡した抵抗の両端は同じ電位）。
// 短絡していない直列（u6s4ser の sh 無し）は R1 と R2 の間＝紫。線の id は u6s4 で始める。
var U6S4XA = 560, U6S4XB = 960, U6S4YS = 268, U6S4YQ = 280;
function u6s4xd(L){ return U6S4XA + (U6S4XB - U6S4XA) * (L.f === undefined ? 0.5 : L.f); }
// 長い抵抗の四角（id・左の端 x0・右の端 x1）
function u6s4box(d, id, x0, x1, O){
  var e = d.el(id, "rect", "ink box");
  e.setAttribute("x", x0); e.setAttribute("y", 346); e.setAttribute("width", Math.max(0, x1 - x0)); e.setAttribute("height", 28);
  d.style(e, {o: O});
}
// 端の点（丸）
function u6s4term(d, id, x, y, O){
  var e = d.el(id, "circle", "ink term");
  e.setAttribute("cx", x); e.setAttribute("cy", y); e.setAttribute("r", 6);
  d.style(e, {o: O});
}
// 長さの寸法線（両矢印）と長さの名前
function u6s4len(d, id, x0, x1, s, O){
  if (s === undefined || s === null || !(O > 0)) return;
  var w = d.dim(id, x0, x1, 380, 428, 420, 1, {o: O});
  d.text(id + "t0", (x0 + x1) / 2, 446, s, {o: O * w});
}
// 分けた部分の名前の x（分ける所と短絡した線の縦の線から 80 離す）
function u6s4lx(L, k){
  var xd = u6s4xd(L);
  return k === 1 ? Math.max(Math.min((U6S4XA + xd) / 2, xd - 80), 600) : Math.min(Math.max((xd + U6S4XB) / 2, xd + 80), 920);
}
// 短絡した線（u6s4bar）の点の並び
function u6s4bshort(L){
  var xd = u6s4xd(L);
  return L.sh === 1 ? [[520, 360], [520, U6S4YS], [xd, U6S4YS], [xd, 346]] : [[xd, 346], [xd, U6S4YS], [1000, U6S4YS], [1000, 360]];
}
function u6s4sshort(L){
  return L.sh === 1 ? [[530, 360], [530, U6S4YQ], [760, U6S4YQ], [760, 360]] : [[760, 360], [760, U6S4YQ], [990, U6S4YQ], [990, 360]];
}
// 電源・＋と－・電源の電圧・全体の電流 I（左の縦の線）を濃さ O で
function u6s4src(d, L, p, O){
  var yb = 560;
  d.cell("c", 752, yb, {o: O});
  if (L.pm) { d.text("pp", 722, yb - 26, "+", {o: O}); d.text("pm", 802, yb - 26, "−", {o: O}); }
  lab6(d, "e", 762, yb + 42, L.src, p, "src", O);
  if (L.i !== undefined && L.i !== null) {
    var o = pv(p, "io", 1) * O;
    d.arrow("ia", 478, yb - 60, 478, yb - 100, {o: o});
    lab6(d, "it", 494, yb - 80, L.i, p, "i", o, {anchor: "start"});
  }
}
// ---- 1本の長い抵抗（分ける前と分けた後）
function u6s4drawBar(d, p, L, O){
  var yb = 560, xd = u6s4xd(L), cv = L.f === undefined ? 0 : pv(p, "cv", 1), sh = L.sh ? pv(p, "sh", 1) : 0;
  if (!L.bare) {
    if (vOn(L, ["src"])) {
      var hi = [[[752, yb], [478, yb], [478, 360], [U6S4XA, 360]]], lo = [[[U6S4XB, 360], [1045, 360], [1045, yb], [772, yb]]];
      zband(d, "zbu6s4bh", hi, "hi", O);
      zband(d, "zbu6s4bl", lo, "lo", O);
      if (L.sh) zband(d, "zbu6s4bs", [u6s4bshort(L)], L.sh === 1 ? "hi" : "lo", O * sh);
    }
    d.wire("u6s4L", [[478, 360], [478, yb], [752, yb]], {o: O});
    d.wire("u6s4R", [[772, yb], [1045, yb], [1045, 360]], {o: O});
    d.wire("u6s4bw1", [[478, 360], [U6S4XA, 360]], {o: O}); d.wire("u6s4bw2", [[U6S4XB, 360], [1045, 360]], {o: O});
    if (L.sh && sh > 0) {
      d.wire("u6s4bs", u6s4bshort(L), {o: O * sh});
      var q = u6s4bshort(L);
      d.dot("u6s4bs0", q[0][0], q[0][1], {o: O * sh}); d.dot("u6s4bs1", q[3][0], q[3][1], {o: O * sh});
    }
    u6s4src(d, L, p, O);
  }
  else {                // 抵抗だけの形：両端に短い線と点（u6s4ta・u6s4tb）
    d.wire("u6s4bl", [[526, 360], [U6S4XA, 360]], {o: O}); d.wire("u6s4br", [[U6S4XB, 360], [994, 360]], {o: O});
    u6s4term(d, "u6s4ta", 520, 360, O); u6s4term(d, "u6s4tb", 1000, 360, O);
  }
  // 抵抗：分ける前＝1つの四角 r、分けた後＝2つの四角 r1・r2
  if (cv < 1) u6s4box(d, "r", U6S4XA, U6S4XB, O * (1 - cv));
  if (cv > 0) { u6s4box(d, "r1", U6S4XA, xd, O * cv); u6s4box(d, "r2", xd, U6S4XB, O * cv); }
  lab6(d, "rt", (U6S4XA + U6S4XB) / 2, 488, L.r, p, "r", O * pv(p, "ro", 1));
  var ko = O * pv(p, "rko", 1) * cv;
  if (ko > 0) { lab6(d, "r1t", u6s4lx(L, 1), 318, L.r1, p, "r1", ko); lab6(d, "r2t", u6s4lx(L, 2), 318, L.r2, p, "r2", ko); }
  u6s4len(d, "u6s4dl", U6S4XA, U6S4XB, L.l, O * (1 - cv));
  u6s4len(d, "u6s4d1", U6S4XA, xd, L.l1, O * cv);
  u6s4len(d, "u6s4d2", xd, U6S4XB, L.l2, O * cv);
}
// ---- 回路図に描き直した形（R1・R2 の直列。短絡した線つき）
function u6s4drawSer(d, p, L, O){
  var yb = 560, sh = L.sh ? pv(p, "sh", 1) : 0;
  if (vOn(L, ["src"])) {
    var left = [[752, yb], [478, yb], [478, 360], [610, 360]], mid = [[670, 360], [850, 360]], right = [[910, 360], [1045, 360], [1045, yb], [772, yb]];
    if (L.sh === 1) { zband(d, "zbu6s4sh", [left, mid, u6s4sshort(L)], "hi", O); zband(d, "zbu6s4sl", [right], "lo", O); }
    else if (L.sh === 2) { zband(d, "zbu6s4sh", [left], "hi", O); zband(d, "zbu6s4sl", [mid, u6s4sshort(L), right], "lo", O); }
    else { zband(d, "zbu6s4sh", [left], "hi", O); zband(d, "zbu6s4sm", [mid], "mid", O); zband(d, "zbu6s4sl", [right], "lo", O); }
  }
  d.wire("u6s4L", [[478, 360], [478, yb], [752, yb]], {o: O});
  d.wire("u6s4R", [[772, yb], [1045, yb], [1045, 360]], {o: O});
  d.wire("u6s4sw1", [[478, 360], [610, 360]], {o: O}); d.wire("u6s4swm", [[670, 360], [850, 360]], {o: O}); d.wire("u6s4sw2", [[910, 360], [1045, 360]], {o: O});
  if (L.sh && sh > 0) {
    var q = u6s4sshort(L);
    d.wire("u6s4ss", q, {o: O * sh});
    d.dot("u6s4ss0", q[0][0], q[0][1], {o: O * sh}); d.dot("u6s4ss1", q[3][0], q[3][1], {o: O * sh});
  }
  u6s4src(d, L, p, O);
  d.res("r1", 640, 360, "h", {o: O}); lab6(d, "r1t", 640, 330, L.r1, p, "r1", O);
  d.res("r2", 880, 360, "h", {o: O}); lab6(d, "r2t", 880, 330, L.r2, p, "r2", O);
}
function tbU6s4bar(d, p, L){ u6s4drawBar(d, p, L, 1); }
function tbU6s4ser(d, p, L){ u6s4drawSer(d, p, L, 1); }
function tbU6s4e(d, p, L){
  var t = pv(p, "t", 0);
  if (t < 0.5) u6s4drawBar(d, p, L, 1 - 2 * t);
  else u6s4drawSer(d, p, L, 2 * t - 1);
}
// 電流の通り道：短絡した線がある時（濃さ 0.5 から）は短絡した線を通り、短絡した部分（抵抗）を通らない
function u6s4flowBar(p, L){
  var yb = 560, xd = u6s4xd(L), on = L.sh && pv(p, "sh", 1) >= 0.5, pts;
  if (on && L.sh === 1) pts = [[752, yb], [478, yb], [478, 360], [520, 360], [520, U6S4YS], [xd, U6S4YS], [xd, 360], [1045, 360], [1045, yb], [772, yb]];
  else if (on) pts = [[752, yb], [478, yb], [478, 360], [xd, 360], [xd, U6S4YS], [1000, U6S4YS], [1000, 360], [1045, 360], [1045, yb], [772, yb]];
  else pts = [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]];
  return {o: L.bare ? 0 : pv(p, "co"), base: 110, paths: [{I: 1, pts: pts}]};
}
function u6s4flowSer(p, L){
  var yb = 560, on = L.sh && pv(p, "sh", 1) >= 0.5, pts;
  if (on && L.sh === 1) pts = [[752, yb], [478, yb], [478, 360], [530, 360], [530, U6S4YQ], [760, U6S4YQ], [760, 360], [1045, 360], [1045, yb], [772, yb]];
  else if (on) pts = [[752, yb], [478, yb], [478, 360], [760, 360], [760, U6S4YQ], [990, U6S4YQ], [990, 360], [1045, 360], [1045, yb], [772, yb]];
  else pts = [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]];
  return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: pts}]};
}
// ---- 6-5 コンダクタンス の図（自作）。電源の無い抵抗の図（電流は流れない＝FLOWK・IARROW に載せない。電圧が無いので色の帯も無い）。
// u6s5res：両端の点（x=560・960）の間に抵抗（x=760）。名前は抵抗の上＝抵抗 L.r、抵抗の下＝コンダクタンス L.g。
//   L.n＝2 なら2段（y=330・y=510）：上の段 L.r1・L.g1、下の段 L.r2・L.g2。1段は y=420。
// 線の id は u6s5 で始める。
// 両端の点（丸）
function u6s5term(d, id, x, y){
  var e = d.el(id, "circle", "ink term");
  e.setAttribute("cx", x); e.setAttribute("cy", y); e.setAttribute("r", 6);
  d.style(e, {});
}
// 1段：y・抵抗の id・抵抗の名前のキー・コンダクタンスの名前のキー
function u6s5row(d, p, L, y, rid, rk, gk, m){
  d.wire("u6s5w" + m + "a", [[566, y], [730, y]]); d.wire("u6s5w" + m + "b", [[790, y], [954, y]]);
  u6s5term(d, "u6s5t" + m + "a", 560, y); u6s5term(d, "u6s5t" + m + "b", 960, y);
  d.res(rid, 760, y, "h");
  lab6(d, rid + "t", 760, y - 30, L[rk], p, rk, 1);
  lab6(d, gk + "t", 760, y + 34, L[gk], p, gk, 1);
}
function tbU6s5res(d, p, L){
  if (L.n === 2) { u6s5row(d, p, L, 330, "r1", "r1", "g1", 1); u6s5row(d, p, L, 510, "r2", "r2", "g2", 2); }
  else u6s5row(d, p, L, 420, "r", "r", "g", 0);
}
// ---- 6-6 導電率 の図（自作）。物質の円柱（共通の cyl6）に、抵抗率 L.rho（円柱の上）と導電率 L.sig（円柱の下）の名前。
// 電源が無く電流は流れない（FLOWK・IARROW に載せない。電圧が無いので色の帯も無い）。
// u6s6cyl：1つ（y=420・半径 50）。L.n＝2 なら2つ（y=330・y=520・半径 40）：上 L.rho1・L.sig1、下 L.rho2・L.sig2。
// 円柱の線の id は u6s6c（2つの時は u6s6c1・u6s6c2）で始める。
function u6s6one(d, p, id, y, h, rho, sig, sk){
  cyl6(d, id, 640, y, 260, h, {rho: rho}, p);
  lab6(d, id + "gt", 770, y + h + 34, sig, p, sk, 1);
}
function tbU6s6cyl(d, p, L){
  if (L.n === 2) {
    u6s6one(d, p, "u6s6c1", 330, 40, L.rho1, L.sig1, "sig1");
    u6s6one(d, p, "u6s6c2", 520, 40, L.rho2, L.sig2, "sig2");
  } else u6s6one(d, p, "u6s6c", 420, 50, L.rho, L.sig, "sig");
}
// ---- 6-7 温度と抵抗 の図：温度と抵抗値のグラフ（u6s7graph）。電流は流れない図（FLOWK・IARROW に載せない）。
// 軸＝common_scenes.js の axes6（原点 x=600・y=600、横 420・縦 360）。線の id は u6s7 で始める。
//   金属の線 u6s7m＝右へ行くほど一定の割合で上がる直線（x=680〜960）。名前 L.nm は線の右の端。
//   超電導の線 u6s7c＝金属の線の左の端から、抵抗値 0（横の軸）まで真下へ落ちる線（L.sc が有る時）。名前 L.ns は落ちる線の右。
//   半導体の線 u6s7h＝右へ行くほど下がる曲線（L.nh が有る時）。名前 L.nh は線の右の端。
// 濃さ＝p.mo（金属）・p.so（超電導）・p.ho（半導体）。問題の画面の図は p を渡さない＝全部出た形。
var U6S7X0 = 600, U6S7Y0 = 600;
function u6s7semi(){
  var pts = [];
  for (var i = 0; i <= 14; i++) { var x = 680 + 20 * i; pts.push([x, 540 - 260 * Math.exp(-(x - 680) / 90)]); }
  return pts;
}
function tbU6s7graph(d, p, L){
  axes6(d, "u6s7a", U6S7X0, U6S7Y0, 420, 360, {ax: "温度", ay: "抵抗値"});
  var mo = pv(p, "mo", 1), so = pv(p, "so", 1), ho = pv(p, "ho", 1);
  d.wire("u6s7m", [[680, 470], [960, 300]], {o: mo});
  lab6(d, "u6s7mt", 974, 300, L.nm, p, "nm", mo, {anchor: "start"});
  if (L.sc) {
    d.wire("u6s7c", [[680, 470], [680, U6S7Y0], [630, U6S7Y0]], {o: so});
    lab6(d, "u6s7ct", 694, 545, L.ns, p, "ns", so, {anchor: "start"});
  }
  if (L.nh !== undefined) {
    var h = u6s7semi();
    d.wire("u6s7h", h, {o: ho});
    lab6(d, "u6s7ht", 974, h[h.length - 1][1], L.nh, p, "nh", ho, {anchor: "start"});
  }
}
// ---- 6-8 抵抗温度係数 の図：温度と抵抗値のグラフ（u6s8graph）。電流は流れない図（FLOWK・IARROW に載せない）。
// 軸＝common_scenes.js の axes6（原点 x=660・y=600、横 380・縦 340）。抵抗値は右へ行くほど一定の割合で上がる直線（u6s8ln）。
// 点1（基準の温度）＝(760, 480)、点2（上がった後）＝(920, 360)。点から軸へ点線（u6s8g1・u6s8g2）。
// 名前：L.t1・L.t2＝温度（横の軸の下）、L.r1・L.r2＝抵抗値（縦の軸の左）、L.al＝抵抗温度係数（グラフの上）。L.t2 が無ければ点2を描かない。
// 上がった分：L.dt＝温度の上がり幅（点1と点2の間・横の軸の上の両矢印）、L.dr＝増えた抵抗値（縦の軸の右の両矢印）。濃さ＝p.dto・p.dro。
// 名前は線・点線にかけない。数字は問題で決まった値だけ（上がった分は解説の中で出す）。
function u6s8dbl(d, id, x0, y0, x1, y1, o){
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  d.arrow(id + "a", cx, cy, x0, y0, {o: o}); d.arrow(id + "b", cx, cy, x1, y1, {o: o});
}
function tbU6s8graph(d, p, L){
  var X0 = 660, Y0 = 600, x1 = 760, y1 = 480, x2 = 920, y2 = 360;
  axes6(d, "u6s8a", X0, Y0, 380, 340, {ax: "温度", ay: "抵抗値"});
  d.wire("u6s8ln", [[700, 525], [1000, 300]]);
  d.wire("u6s8g1", [[x1, Y0], [x1, y1], [X0, y1]], {dash: true});
  d.dot("u6s8d1", x1, y1);
  lab6(d, "u6s8t1t", x1, Y0 + 30, L.t1, p, "t1", 1);
  lab6(d, "u6s8r1t", X0 - 14, y1, L.r1, p, "r1", 1, {anchor: "end"});
  if (L.t2 !== undefined) {
    d.wire("u6s8g2", [[x2, Y0], [x2, y2], [X0, y2]], {dash: true});
    d.dot("u6s8d2", x2, y2);
    lab6(d, "u6s8t2t", x2, Y0 + 30, L.t2, p, "t2", 1);
    lab6(d, "u6s8r2t", X0 - 14, y2, L.r2, p, "r2", 1, {anchor: "end"});
  }
  if (L.al !== undefined) lab6(d, "u6s8alt", 780, 250, L.al, p, "al", 1, {anchor: "start"});
  if (L.dt !== undefined) {
    var to = pv(p, "dto", 1);
    u6s8dbl(d, "u6s8dt", x1 + 2, 572, x2 - 2, 572, to);
    lab6(d, "u6s8dtt", (x1 + x2) / 2, 546, L.dt, p, "dt", to);
  }
  if (L.dr !== undefined) {
    var ro = pv(p, "dro", 1);
    u6s8dbl(d, "u6s8dr", 690, y1 - 2, 690, y2 + 2, ro);
    lab6(d, "u6s8drt", 704, (y1 + y2) / 2, L.dr, p, "dr", ro, {anchor: "start"});
  }
}
// ---- 6-9 温度が変わった後の抵抗 の図：温度と抵抗値のグラフ（u6s9graph）。電流は流れない図（FLOWK・IARROW に載せない）。
// 軸＝common_scenes.js の axes6（原点 x=660・y=600、横 380・縦 340）。抵抗値の直線 u6s9ln（L.neg＝α が負の時は右へ行くほど下がる）。
// 点1（基準の温度）x=760・点2（変わった後）x=920。上がる時 点1 y=480・点2 y=360／下がる時 点1 y=360・点2 y=480。点から軸へ点線（u6s9g1・u6s9g2）。
// 名前：L.t1・L.t2＝温度（横の軸の下）、L.r1・L.r2＝抵抗値（縦の軸の左）、L.al＝抵抗温度係数（グラフの上）、
//       L.dt＝上がった温度（点1と点2の間・横の軸の上の両矢印。濃さ p.dto）。名前は線・点線にかけない。数字は問題で決まった値だけ。
function u6s9dbl(d, id, x0, y0, x1, y1, o){
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  d.arrow(id + "a", cx, cy, x0, y0, {o: o}); d.arrow(id + "b", cx, cy, x1, y1, {o: o});
}
function tbU6s9graph(d, p, L){
  var X0 = 660, Y0 = 600, x1 = 760, x2 = 920, y1 = L.neg ? 360 : 480, y2 = L.neg ? 480 : 360;
  axes6(d, "u6s9a", X0, Y0, 380, 340, {ax: "温度", ay: "抵抗値"});
  d.wire("u6s9ln", L.neg ? [[700, 315], [1000, 540]] : [[700, 525], [1000, 300]]);
  d.wire("u6s9g1", [[x1, Y0], [x1, y1], [X0, y1]], {dash: true});
  d.wire("u6s9g2", [[x2, Y0], [x2, y2], [X0, y2]], {dash: true});
  d.dot("u6s9d1", x1, y1); d.dot("u6s9d2", x2, y2);
  lab6(d, "u6s9t1t", x1, Y0 + 30, L.t1, p, "t1", 1);
  lab6(d, "u6s9t2t", x2, Y0 + 30, L.t2, p, "t2", 1);
  lab6(d, "u6s9r1t", X0 - 14, y1, L.r1, p, "r1", 1, {anchor: "end"});
  lab6(d, "u6s9r2t", X0 - 14, y2, L.r2, p, "r2", 1, {anchor: "end"});
  if (L.al !== undefined) lab6(d, "u6s9alt", 780, 250, L.al, p, "al", 1, {anchor: "start"});
  if (L.dt !== undefined) {
    var to = pv(p, "dto", 1);
    u6s9dbl(d, "u6s9dt", x1 + 2, 572, x2 - 2, 572, to);
    lab6(d, "u6s9dtt", (x1 + x2) / 2, 546, L.dt, p, "dt", to);
  }
}
// ---- 単元6の終わりの過去問1：令和2年 問5（u6k1r2・図は自作。公式の問題には図が無い）。4本の電線 A〜D を横向きの円柱で上から順に描く。
// 円柱は共通の cyl6（名前は渡さず形だけ）。左の端 x=600・長さ 300、中心 y=250・360・470・580。半径＝11×√(断面積の前の数字)（太さを断面積に合わせた）。
// 名前 L：mat（1＝問題の画面：右に物質の名前）・num（1＝解説：右に ρ と S の前の数字の列）・qa〜qd（ρ÷S の値。濃さ p.qao〜p.qdo）。
// 部品の id は u6k1 で始める（円柱 u6k1a〜u6k1d、名前 u6k1an、ρ の数字 u6k1ar0、S の数字 u6k1as0、値 u6k1aq0、列の見出し u6k1hr・u6k1hs）。
// 電流も電圧も無い図なので、色の帯・電流の流れ（FLOWK）・電流の矢印は無い。
var U6K1 = [["a", "A", 9, "8.90", "9", "鉄"], ["b", "B", 5, "2.50", "5", "アルミニウム"], ["c", "C", 1, "1.47", "1", "銀"], ["d", "D", 2, "1.55", "2", "銅"]];
function tbU6k1r2(d, p, L){
  var x0 = 600, w = 300;
  if (L.num) { d.text("u6k1hr", 1010, 180, "ρ"); d.text("u6k1hs", 1110, 180, "{S}"); }
  U6K1.forEach(function(r, i){
    var k = r[0], y = 250 + 110 * i, h = 11 * Math.sqrt(r[2]);
    cyl6(d, "u6k1" + k, x0, y, w, h, {}, p);
    d.text("u6k1" + k + "n", 540, y, r[1]);
    if (L.mat) d.text("u6k1" + k + "m", 990, y, r[5], {anchor: "start"});
    if (L.num) { lab6(d, "u6k1" + k + "r", 1010, y, r[3], p, "u6k1" + k + "r", 1); lab6(d, "u6k1" + k + "s", 1110, y, r[4], p, "u6k1" + k + "s", 1); }
    if (L["q" + k] !== undefined) lab6(d, "u6k1" + k + "q", 1230, y, L["q" + k], p, "q" + k, pv(p, "q" + k + "o", 1));
  });
}
// ---- 単元6の終わりの過去問2：令和5年上期 問7（u6k2r5・図は試験センターの図を描き直した物）。電源と金属の抵抗1つとスイッチ S の回路。
// 電池は左の縦の線 x=500（上の長い線＝＋極 y=400・下の短い線 y=420）。上の線 y=300・下の線 y=520・右の縦の線 x=900。
// 抵抗は右の縦の線（y=410・縦）。スイッチ S は下の線の x=700〜760（支点 x=700）。電流 I の矢印は上の線（x=700・右向き・名前は線の上）。
// 名前 L：sw（1＝閉じた形。無ければ開いた形＝問題の画面）・src・r（抵抗の名前）・t（抵抗の温度）・i。部品の id は u6k2 で始める。
// 同じ電位の線の色の帯：電源の電圧の名前があり、スイッチが閉じている時。＋極から抵抗の上の端まで＝赤・抵抗の下の端から－極まで＝灰。
// 問題の画面は名前を出さない（公式の図と同じく S だけ）ので帯も無い（帯の例外は使っていない）。
function tbU6k2r5(d, p, L){
  var xl = 500, xr = 900, yt = 300, yb = 520;
  if (L.sw) zones(d, p, L, {hi: {lines: [[[xl, 400], [xl, yt], [xr, yt], [xr, 380]]]},
                            lo: {lines: [[[xr, 440], [xr, yb], [xl, yb], [xl, 420]]]}}, vOn(L, ["src"]), "u6k2");
  d.wire("u6k2T", [[xl, 400], [xl, yt], [xr, yt], [xr, 380]]);
  d.wire("u6k2B", [[xr, 440], [xr, yb], [760, yb]]);
  d.wire("u6k2BL", [[700, yb], [xl, yb], [xl, 420]]);
  d.wire("u6k2sw", L.sw ? [[700, yb], [760, yb]] : [[700, yb], [752, yb - 30]]);
  d.text("u6k2sn", 730, yb + 32, "S");
  d.res("u6k2r", xr, 410, "v");
  lab6(d, "u6k2rt", xr + 24, 392, L.r, p, "r", 1, {anchor: "start"});
  lab6(d, "u6k2tt", xr + 24, 430, L.t, p, "t", 1, {anchor: "start"});
  // 電池（縦の線の途中）：上の長い線＝＋極
  d.wire("u6k2c:L", [[xl - 22, 400], [xl + 22, 400]]);
  var s = d.wire("u6k2c:S", [[xl - 11, 420], [xl + 11, 420]]); s.style.strokeWidth = 4;
  lab6(d, "u6k2e", xl - 34, 410, L.src, p, "src", 1, {anchor: "end"});
  if (L.i !== undefined) {
    var o = pv(p, "io", 1);
    d.arrow("u6k2ia", 680, yt, 720, yt, {o: o});
    lab6(d, "u6k2it", 700, yt - 26, L.i, p, "i", o);
  }
}
// ---- 単元6の終わりの過去問3：平成24年 問5（u6k3h24・図は試験センターの図を描き直した物）。左＝図1（電源 E と R1・R2・R3、端子 a・b）・右＝図2（電流源 I と G）。
// 図1：電池は左の縦の線 x=500（上の長い線＝＋極 y=340・下の短い線 y=360）。上の線 y=250・下の線 y=450。R1 は上の線 x=620（横）、
//   分かれる点 x=740（R2 は縦 y=350）、R3 は上の線 x=860（横）、端子 a (960, 250)・b (960, 450)。
// 図2（L.f2 の時だけ＝問題の画面）：左の縦の線 x=1120 に電流源（中心 y=350・半径 26・上向きの矢印は円の左）、分かれる点 x=1340（G は縦 y=350）、端子 a (1560, 250)・b (1560, 450)。
// 解説は図1だけを使い、2つの形に変わる：sab＝a-b を短絡する線（濃さ）、ssrc＝電源を短絡した形（電池が消えて1本の線になる）。
// 電流の矢印：I0＝左の縦の線（上向き・名前は線の右）、I＝R3 の右の線（右向き・名前は線の上）。どちらも a-b を短絡した時の電流。
// 名前 L：r1・r2・r3・src・i0・i・f2・g・cs（図2の名前）。部品の id は u6k3a（図1）・u6k3b（図2）で始める。
// 同じ電位の線の色の帯（図1・電源の電圧の名前がある時）：a-b を開いた時＝＋極から R1 まで赤・R1 の後ろ（R3 から a まで）紫・－極の側 灰。
//   a-b を短絡した時＝R3 の右の端から a・b は灰。電源を短絡した形では電圧が無いので帯を消す。帯は答えの手がかりにならない（答えは式の組）ので問題の画面にも付ける。
function u6k3Zopen(){
  return {hi: {lines: [[[500, 340], [500, 250], [590, 250]]]},
          mid: {lines: [[[650, 250], [830, 250]], [[740, 250], [740, 320]], [[890, 250], [960, 250]]]},
          lo: {lines: [[[740, 380], [740, 450]], [[960, 450], [500, 450], [500, 360]]]}};
}
function u6k3Zshort(){
  return {hi: {lines: [[[500, 340], [500, 250], [590, 250]]]},
          mid: {lines: [[[650, 250], [830, 250]], [[740, 250], [740, 320]]]},
          lo: {lines: [[[890, 250], [960, 250], [960, 450], [500, 450], [500, 360]], [[740, 380], [740, 450]]]}};
}
function tbU6k3h24(d, p, L){
  var sab = pv(p, "sab", 0), ssrc = pv(p, "ssrc", 0), on = vOn(L, ["src"]) ? 1 - ssrc : 0;
  zones(d, p, L, u6k3Zopen(), on * (1 - sab), "u6k3o");
  zones(d, p, L, u6k3Zshort(), on * sab, "u6k3s");
  // 図1
  if (L.f2) d.text("u6k3an", 730, 510, "図1");
  // 電源を短絡し終えた形（ssrc＝1）では、左の線を b から R1 まで1本の線で描く（線の継ぎ目の丸が重ならないように）
  if (ssrc >= 1) d.wire("u6k3aL", [[960, 450], [500, 450], [500, 250], [590, 250]]);
  else { d.wire("u6k3aL", [[500, 340], [500, 250], [590, 250]]); d.wire("u6k3aB", [[960, 450], [500, 450], [500, 360]]); }
  d.wire("u6k3aT1", [[650, 250], [830, 250]]);
  d.wire("u6k3aT2", [[890, 250], [960, 250]]);
  d.wire("u6k3a2u", [[740, 250], [740, 320]]); d.wire("u6k3a2d", [[740, 380], [740, 450]]);
  d.dot("u6k3aj1", 740, 250); d.dot("u6k3aj2", 740, 450);
  if (sab > 0) d.wire("u6k3ash", [[960, 250], [960, 450]], {o: sab});
  d.term("u6k3ta", 960, 250, "a", "r"); d.term("u6k3tb", 960, 450, "b", "r");
  d.res("u6k3ar1", 620, 250, "h"); lab6(d, "u6k3ar1t", 620, 220, L.r1, p, "r1", 1);
  d.res("u6k3ar3", 860, 250, "h"); lab6(d, "u6k3ar3t", 860, 220, L.r3, p, "r3", 1);
  d.res("u6k3ar2", 740, 350, "v"); lab6(d, "u6k3ar2t", 764, 350, L.r2, p, "r2", 1, {anchor: "start"});
  // 電池（縦の線の途中）：上の長い線＝＋極。電源を短絡した形では電池が消えて1本の線
  d.wire("u6k3c:L", [[478, 340], [522, 340]], {o: 1 - ssrc});
  var s = d.wire("u6k3c:S", [[489, 360], [511, 360]], {o: 1 - ssrc}); s.style.strokeWidth = 4;
  if (ssrc > 0 && ssrc < 1) d.wire("u6k3csh", [[500, 340], [500, 360]], {o: ssrc});
  lab6(d, "u6k3e", 466, 350, L.src, p, "src", 1 - ssrc, {anchor: "end"});
  if (L.i0 !== undefined) {
    var o0 = pv(p, "i0o", 1);
    d.arrow("u6k3i0a", 500, 320, 500, 280, {o: o0});
    lab6(d, "u6k3i0t", 516, 300, L.i0, p, "i0", o0, {anchor: "start"});
  }
  if (L.i !== undefined) {
    var o1 = pv(p, "io", 1);
    d.arrow("u6k3ia", 905, 250, 941, 250, {o: o1});
    lab6(d, "u6k3it", 923, 224, L.i, p, "i", o1);
  }
  if (!L.f2) return;
  // 図2（問題の画面だけ）
  d.text("u6k3bn", 1340, 510, "図2");
  d.wire("u6k3bL", [[1120, 324], [1120, 250], [1560, 250]]);
  d.wire("u6k3bB", [[1560, 450], [1120, 450], [1120, 376]]);
  d.wire("u6k3bGu", [[1340, 250], [1340, 320]]); d.wire("u6k3bGd", [[1340, 380], [1340, 450]]);
  d.dot("u6k3bj1", 1340, 250); d.dot("u6k3bj2", 1340, 450);
  d.term("u6k3tc", 1560, 250, "a", "r"); d.term("u6k3td", 1560, 450, "b", "r");
  var c = d.el("u6k3bs", "circle", "ink box"); c.setAttribute("cx", 1120); c.setAttribute("cy", 350); c.setAttribute("r", 26); d.style(c, {});
  d.wire("u6k3bs:m", [[1094, 350], [1146, 350]]);
  d.arrow("u6k3bsa", 1076, 374, 1076, 326);
  d.text("u6k3bst", 1062, 350, L.cs || "", {anchor: "end"});
  d.res("u6k3bg", 1340, 350, "v"); d.text("u6k3bgt", 1364, 350, L.g || "", {anchor: "start"});
}
var KINDS = {u6s1cyl: tbU6s1cyl, u6s2cyl: tbU6s2cyl, u6s3two: tbU6s3two, u6s4bar: tbU6s4bar, u6s4ser: tbU6s4ser, u6s4e: tbU6s4e, u6s5res: tbU6s5res, u6s6cyl: tbU6s6cyl, u6s7graph: tbU6s7graph, u6s8graph: tbU6s8graph, u6s9graph: tbU6s9graph, u6k1r2: tbU6k1r2, u6k2r5: tbU6k2r5, u6k3h24: tbU6k3h24};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  // 6-1 の円柱の図は電流が流れないので載せない,
  // 6-2 の円柱の図は電流が流れないので載せない,
  // 6-3 の円柱の図は電流が流れないので載せない,
  u6s4bar: function(p, L){ return u6s4flowBar(p, L); },
  u6s4ser: function(p, L){ return u6s4flowSer(p, L); },
  u6s4e: function(p, L){ return pv(p, "t", 0) < 0.5 ? u6s4flowBar(p, L) : u6s4flowSer(p, L); },
  // u6s5res は電源が無く電流が流れないので載せない,
  // u6s6cyl は電源が無く電流が流れないので載せない,
  // 6-7 のグラフは電流が流れない（載せる物なし）,
  // 6-8 のグラフは電流が流れない（載せる物なし）,
  // 6-9 のグラフは電流が流れない（載せる物なし）,
  // 電流の流れる図は無い（円柱の図。SPEC.md §17-2 単元6：FLOWK に載せない）,
  u6k2r5: function(p, L){            // スイッチが閉じている時だけ。1本の道
    return {o: L.sw ? pv(p, "co") : 0, base: 120, paths: [
      {I: 1, pts: [[500, 400], [500, 300], [900, 300], [900, 520], [500, 520], [500, 420]]}]};
  },
  u6k3h24: function(p, L){           // a-b を短絡した形だけ（電源を短絡した形は電流が無い）。全体＝3・R2 の道＝1・R3 と短絡の線の道＝2（形を見せる比）
    return {o: pv(p, "co") * pv(p, "sab", 0) * (1 - pv(p, "ssrc", 0)), base: 120, paths: [
      {I: 3, pts: [[500, 340], [500, 250], [740, 250]]},
      {I: 1, pts: [[740, 250], [740, 450]]},
      {I: 2, pts: [[740, 250], [960, 250], [960, 450], [740, 450]]},
      {I: 3, pts: [[740, 450], [500, 450], [500, 360]]}]};
  }
};

// 単元6の練習問題の作り方の、節の間で共通の道具。共通の道具（rngOf・pick・shuffled・choices・num・qv・qf・nice・distinct・fmt など）は tb_gen.js。
// 節の練習は u06/sN_gen.js（u06.py が番号順につなぎ、GEN を1つにまとめる）。このファイルは書き換えない（足したい道具は自分の節のファイルへ）。
// 言葉・式の選択肢。list の先頭が正しい物：[t, v, why]
function rule6(r, text, fig, list, ex, form){
  var c = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
  return {form: form, text: text, fig: fig, ch: c.ch, ans: c.ans, ex: ex, chk: {form: form, p: {}}};
}
// 数字の選択肢：値が小数3けたで割り切れ・4つが重ならず・どれも 0 より大きい物だけ（呼ぶ側で決め直す）
function okNums6(ok, w){ return nice(ok) && ok > 0 && w.every(function(z){ return nice(z.x) && z.x > 0; }) && distinct([ok].concat(w.map(function(z){ return z.x; }))); }
function int6(x){ return Math.abs(x - Math.round(x)) < 1e-9; }
function r36(x){ return Math.round(x * 1000) / 1000; }        // 割り算の誤差（7.199999… など）を3けたに丸める
function gcd6(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
// 比を簡単にした文字（[6, 2] → "3 : 1"）。整数の比だけ
function ratio6(a){ var g = a.reduce(function(x, y){ return gcd6(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function ohm6(k, v){ return "{R}" + k + "=" + qf(v, "O"); }     // 図の抵抗の名前と値（"{R}_1=6 Ω"）
var RS6 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 35, 36, 40, 45, 48, 50, 60, 70, 75, 80, 90, 100];
// 6-1 抵抗率：抵抗の値は物質・形・温度で変わる。円柱の抵抗は R = ρ l / S（ρ＝抵抗率・物質で決まる、l＝長さ m、S＝断面積 m²）。
// 図は全問に付ける（u6s1cyl）。形：u6s1law（式の穴埋め）／u6s1sym（記号が表す物）／u6s1dep（抵抗率を決める物）／
//     u6s1r（ρ・l・S から R）／u6s1rho（R・l・S から ρ）／u6s1l（R・ρ・S から l）。
// まちがいの選択肢は、よくある取り違え（長さと断面積を逆・断面積で割らずに掛けた・ρ を掛け忘れた など）。理由を1行付ける。
// 単位を式から出すやり方（6-2）・長さや断面積を変えた時の何倍（6-3）は出さない。
function u6s1fig(L){ return {kind: "u6s1cyl", L: Object.assign({r: "{R}", rho: "{ρ}", l: "{l}", S: "{S}"}, L), P: {}}; }
var U6S1RHO = [0.1, 0.2, 0.4, 0.5, 1, 2, 4, 5], U6S1LEN = [1, 2, 3, 4, 5, 6, 8, 10, 12, 20], U6S1AREA = [0.1, 0.2, 0.4, 0.5, 1, 2, 4];
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u6s1three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r36(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// Ω と V・A 以外の単位の数字の選択肢（tex＝単位の書き方）。値は文字（fmt）で持つ
function u6s1nu(r, ok, w, tex){
  return choices(r, [{t: "$" + fmt(ok) + "\\," + tex + "$", v: fmt(ok)}].concat(w.map(function(z){ return {t: "$" + fmt(z.x) + "\\," + tex + "$", v: fmt(z.x), why: z.why}; })));
}
var U6S1OM = "\\Omega \\cdot \\mathrm{m}";
function u6s1lab(rho, l, S){ return {rho: "{ρ}=" + fmt(rho) + " Ω·m", l: "{l}=" + fmt(l) + " m", S: "{S}=" + fmt(S) + " m²"}; }
function u6s1q(rho, l, S){
  return "$\\rho = " + fmt(rho) + "\\," + U6S1OM + "$、$l = " + fmt(l) + "\\,\\mathrm{m}$、$S = " + fmt(S) + "\\,\\mathrm{m}^2$";
}
// 6-2 単位を式から出す：式の量を単位に置き換えて約分すると、分からない量の単位が出る（抵抗率の単位＝Ω·m）。
// 図は全問に付ける（u6s2cyl）。形：u6s2rho（抵抗率の単位）／u6s2unit（記号の単位）／u6s2deriv（変形した式の右辺から左辺の単位）／
//     u6s2mul（両辺に何を掛けるか）。
// まちがいの選択肢は、よくある取り違え（約分しすぎ・約分し忘れ・掛けずに割った・ほかの量の単位 など）。理由を1行付ける。
// 長さと断面積を変えた時の何倍（6-3）は出さない。
function u6s2fig(L){ return {kind: "u6s2cyl", L: Object.assign({r: "{R}", rho: "{ρ}", l: "{l}", S: "{S}"}, L), P: {}}; }
// 単位：記号・書き方・名前（その単位を持つ量）
var U6S2U = {O: ["\\Omega", "抵抗"], m: ["\\mathrm{m}", "長さ"], m2: ["\\mathrm{m}^2", "断面積"], Om: ["\\Omega \\cdot \\mathrm{m}", "抵抗率"]};
// 変形した式：左辺の記号・左辺の書き方・右辺・右辺を単位に置き換えた形・答え・約分の言い方
var U6S2EQ = [
  {x: "R", lhs: "R", rhs: "\\rho \\dfrac{l}{S}", u: "\\dfrac{\\Omega \\cdot \\mathrm{m} \\times \\mathrm{m}}{\\mathrm{m}^2}", a: "O", k: "上と下の $\\mathrm{m}^2$ を約分すると $\\Omega$ が残る"},
  {x: "S", lhs: "S", rhs: "\\rho \\dfrac{l}{R}", u: "\\dfrac{\\Omega \\cdot \\mathrm{m} \\times \\mathrm{m}}{\\Omega}", a: "m2", k: "上と下の $\\Omega$ を約分すると $\\mathrm{m} \\times \\mathrm{m} = \\mathrm{m}^2$ が残る"},
  {x: "l", lhs: "l", rhs: "\\dfrac{R S}{\\rho}", u: "\\dfrac{\\Omega \\times \\mathrm{m}^2}{\\Omega \\cdot \\mathrm{m}}", a: "m", k: "上と下の $\\Omega$ と $\\mathrm{m}$ を約分すると $\\mathrm{m}$ が残る"},
  {x: "rho", lhs: "\\rho", rhs: "\\dfrac{R S}{l}", u: "\\dfrac{\\Omega \\times \\mathrm{m}^2}{\\mathrm{m}}", a: "Om", k: "上と下の $\\mathrm{m}$ を約分すると $\\Omega \\cdot \\mathrm{m}$ が残る"}
];
var U6S2SYM = {R: ["R", "O"], l: ["l", "m"], S: ["S", "m2"], rho: ["\\rho", "Om"]};
// 4つの単位の選択肢（正しい物 a）。why(k)＝まちがい k の理由
function u6s2four(r, a, why){
  var ks = ["O", "m", "m2", "Om"], list = [{t: "$" + U6S2U[a][0] + "$", v: a}];
  ks.forEach(function(k){ if (k !== a) list.push({t: "$" + U6S2U[k][0] + "$", v: k, why: why(k)}); });
  return choices(r, list);
}
// 6-3 長さと断面積：抵抗は長さに比例し、断面積に反比例する（同じ物質）。長い道は通りにくく、広い道は通りやすい。
// 図は全問に付ける（u6s3two＝上が元の抵抗・下が変えた抵抗。u6s3shape だけ上の1つ）。
// 形：u6s3shape（抵抗が最も大きい・小さい形）／u6s3fac（長さか断面積を k 倍 → 抵抗は何倍）／u6s3len（長さを変えた R2）／
//     u6s3area（断面積を変えた R2）／u6s3both（両方を変えた R2）。
// まちがいの選択肢は、よくある取り違え（比例と反比例を逆・断面積が大きいと抵抗も大きいと考えた・元の抵抗に足した など）。理由を1行付ける。
// 抵抗を長さで分ける・短絡（6-4）は出さない。
// 何倍：{n, d}＝d 分の n（2・3・1/2・1/3）
var U6S3K = [{n: 2, d: 1}, {n: 3, d: 1}, {n: 1, d: 2}, {n: 1, d: 3}];
function u6s3v(k){ return k.n / k.d; }
function u6s3tex(k){ return k.d === 1 ? String(k.n) : "\\dfrac{" + k.n + "}{" + k.d + "}"; }
function u6s3pre(k){ return k.d === 1 ? String(k.n) : {2: "½", 3: "⅓"}[k.d]; }       // 図の名前の前に付ける何倍（"2{l}"・"½{l}"）
function u6s3fig(R1, kl, ks, r2){
  return {kind: "u6s3two", L: {r1: R1 === null ? "{R}_1" : "{R}_1=" + qf(R1, "O"), l1: "{l}", S1: "{S}", r2: r2 || "{R}_2",
                                l2: kl ? u6s3pre(kl) + "{l}" : "{l}", S2: ks ? u6s3pre(ks) + "{S}" : "{S}",
                                lk: kl ? u6s3v(kl) : 1, sk: ks ? u6s3v(ks) : 1}, P: {}};
}
function u6s3three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r36(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 6-4 抵抗を長さで分ける：抵抗は長さに比例するので、1本の抵抗は長さの比で分けられる（R_k = R × 長さの割合）。
// 途中を短絡したら、短絡した部分には電流が流れない（電流の通る残りの部分だけで解く）。図は全問に付ける（u6s4bar）。
// 形：u6s4part（R と長さから分けた部分の抵抗）／u6s4whole（分けた部分の抵抗と長さから R）／u6s4ratio（分けた抵抗の比）／
//     u6s4path（途中を短絡した時に電流が通る抵抗）／u6s4cur（途中を短絡した時の電流）。
// まちがいの選択肢は、よくある取り違え（もう一方の長さの割合・割合を逆・比を逆・短絡を見落とした・長さで割った など）。理由を1行付ける。
function u6s4fig(L){ return {kind: "u6s4bar", L: L, P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない 0 より大きい3つ（前から順に）。足りなければ null
function u6s4three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;
    z = {x: r36(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 全体の長さ T（m）と左の部分の長さ a（右＝T − a）。どちらも全体の 1/3〜2/3（図の名前が重ならないように）
function u6s4pair(r){
  var T, a;
  do { T = pick(r, [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20]); a = pick(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]); } while (3 * a < T || 3 * a > 2 * T);
  return [T, a, T - a];
}
function u6s4m(x){ return qf(x, "V").replace(" V", " m"); }      // 図の長さ（"3 m"）
function u6s4mt(x){ return fmt(x) + "\\,\\mathrm{m}"; }          // 式の中の長さ
// 6-5 コンダクタンス：抵抗 R の逆数がコンダクタンス G（G = 1/R）。単位はジーメンス S（S＝Ω の逆数＝Ω^{-1}）。図は全問に付ける（u6s5res）。
// 形：u6s5def（抵抗の逆数の名前）／u6s5unit（コンダクタンスの単位）／u6s5same（S と同じ単位）／
//     u6s5g（R から G）／u6s5r（G から R）／u6s5cmp（2つの抵抗のどちらの G が大きいか）。
// まちがいの選択肢は、よくある取り違え（逆数にしていない・けたを取り違えた・単位を取り違えた・大小を逆 など）。理由を1行付ける。
// G の値の選択肢は単位 S（tb_gen.js の num は V・A・Ω だけ）なので、文字の値（fmt）で持つ。
function u6s5fig(L){ return {kind: "u6s5res", L: L, P: {}}; }
function u6s5s(x){ return "$" + fmt(x) + "\\,\\mathrm{S}$"; }
// S の数字の選択肢（v＝fmt の文字）
function u6s5numS(r, ok, w){
  return choices(r, [{t: u6s5s(ok), v: fmt(ok)}].concat(w.map(function(z){ return {t: u6s5s(z.x), v: fmt(z.x), why: z.why}; })));
}
// まちがいの候補から、正しい値と重ならない 0 より大きい3つ（前から順に）。足りなければ null
function u6s5three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;
    z = {x: r36(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 逆数が小数3けたで割り切れる抵抗の値（Ω）
var U6S5R = [0.2, 0.25, 0.5, 2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125, 200, 250, 500];
// 6-6 導電率：抵抗率 ρ の逆数が導電率 σ（σ = 1/ρ）。単位は Ω·m の逆数＝S/m。導電率が大きいほど電気が流れやすい。図は全問に付ける（u6s6cyl）。
// 形：u6s6def（抵抗率の逆数の名前）／u6s6unit（導電率の単位）／u6s6sig（ρ から σ）／u6s6rho（σ から ρ）／u6s6cmp（2つの物質のどちらの σ が大きいか）。
// まちがいの選択肢は、よくある取り違え（逆数にしていない・けたを取り違えた・コンダクタンスや抵抗率と取り違えた・大小を逆 など）。理由を1行付ける。
// 値の選択肢の単位（S/m・Ω·m）は tb_gen.js の num に無いので、文字の値（fmt）で持つ。
function u6s6fig(L){ return {kind: "u6s6cyl", L: L, P: {}}; }
var U6S6U = {sm: "\\,\\mathrm{S/m}", om: "\\,\\Omega \\cdot \\mathrm{m}"}, U6S6F = {sm: " S/m", om: " Ω·m"};
function u6s6q(x, u){ return fmt(x) + U6S6U[u]; }
function u6s6num(r, ok, w, u){
  return choices(r, [{t: "$" + u6s6q(ok, u) + "$", v: fmt(ok)}].concat(w.map(function(z){ return {t: "$" + u6s6q(z.x, u) + "$", v: fmt(z.x), why: z.why}; })));
}
// まちがいの候補から、正しい値と重ならない 0 より大きい3つ（前から順に）。足りなければ null
function u6s6three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;
    z = {x: r36(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 逆数が小数3けたで割り切れる抵抗率の値（Ω·m）
var U6S6R = [0.002, 0.004, 0.005, 0.008, 0.01, 0.02, 0.025, 0.04, 0.05, 0.1, 0.125, 0.2, 0.25, 0.5, 2, 4, 5, 8, 10, 20, 25, 40, 50, 100];
// 6-7 温度と抵抗：金属の抵抗値は温度が上がると一定の割合で増える・とても冷やすと急に 0（超電導）・半導体は温度が上がると下がる。
// 図は全問に付ける（u6s7graph。2つの線の名前は a・b で、どちらが金属かは問題ごとに変える）。
// 形：u6s7which（グラフの a・b のどちらが金属か半導体か）／u6s7metal（金属の抵抗値の変わり方）／u6s7semi（半導体の抵抗値の変わり方）／
//     u6s7sup（とても冷やすと 0 になる現象の名前）／u6s7cool（金属の温度を下げていった時）。
// まちがいの選択肢は、よくある取り違え（金属と半導体を取り違えた・温度で変わらないと考えた・超電導と取り違えた など）。理由を1行付ける。
// 抵抗温度係数（6-8）は出さない。
function u6s7fig(r){
  var am = r() < 0.5 ? "a" : "b";
  return {am: am, fig: {kind: "u6s7graph", L: {nm: am, nh: am === "a" ? "b" : "a", sc: 1}, P: {}}};
}
// 6-8 抵抗温度係数：ある温度の抵抗値を基準に、1 ℃ 上がった時に増える抵抗値の割合＝α。添え字は基準にした温度。
// 出し方＝1 ℃ あたり増える抵抗値 ÷ 基準の抵抗値。図は全問に付ける（u6s8graph）。
// 形：u6s8def（抵抗温度係数とは）／u6s8sub（添え字が表す物）／u6s8den（割る抵抗値はどれか）／
//     u6s8per（2つの温度の抵抗値から 1 ℃ あたり増える抵抗値）／u6s8alpha（2つの温度の抵抗値から α）／u6s8inc（α と基準の抵抗値から 1 ℃ あたり増える抵抗値）。
// まちがいの選択肢は、よくある取り違え（基準の抵抗値で割っていない・1 ℃ あたりにしていない・後の抵抗値で割った など）。理由を1行付ける。
// 温度が変わった後の抵抗の式（6-9）は出さない。α は小数5けたまで（fmt は3けたで丸めるので、α は u6s8fa で書く）。
var U6S8AL = [0.002, 0.0025, 0.004, 0.005, 0.01, 0.02, 0.025, 0.05];
function u6s8fa(x){ return String(Math.round(x * 1e6) / 1e6); }
function u6s8nice5(x){ return Math.abs(x * 1e5 - Math.round(x * 1e5)) < 1e-6; }
function u6s8tc(t){ return fmt(t) + " ℃"; }
function u6s8fig(L){ return {kind: "u6s8graph", L: L, P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。ok5＝小数5けたまでで見る（α）。足りなければ null
function u6s8three(ok, cands, ok5){
  var out = [];
  cands.forEach(function(z){
    z = {x: ok5 ? Math.round(z.x * 1e6) / 1e6 : r36(z.x), why: z.why};
    var good = ok5 ? u6s8nice5(z.x) : nice(z.x);
    if (out.length < 3 && good && z.x > 0 && [ok].concat(out.map(function(w){ return w.x; })).every(function(y){ return Math.abs(y - z.x) > 1e-9; })) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 2つの温度の抵抗値：t1・t2・R1・R2・1 ℃ あたり per・α
function u6s8data(r){
  for (;;) {
    var t1 = pick(r, [0, 10, 15, 20, 25, 30]), dt = pick(r, [2, 4, 5, 8, 10, 20, 25, 40]), R1 = pick(r, [10, 20, 25, 40, 50, 60, 80, 100, 120, 200]);
    var al = pick(r, U6S8AL), per = al * R1, dR = per * dt;
    if (!nice(per) || !nice(dR)) continue;
    per = r36(per); dR = r36(dR);
    if (dR > R1 || t1 + dt > 100) continue;
    return {t1: t1, t2: t1 + dt, dt: dt, R1: R1, R2: r36(R1 + dR), dR: dR, per: per, al: al};
  }
}
// 6-9 温度が変わった後の抵抗：変わった後の抵抗値＝基準の抵抗値 ×（1 ＋ α × 上がった温度）。後の抵抗値から基準の抵抗値も出せる（割る）。
// α が負の数なら、温度が上がると抵抗値は下がる。図は全問に付ける（u6s9graph。α が負の時は下がる線）。
// 形：u6s9law（式の □ に入る物）／u6s9after（基準から後の抵抗値）／u6s9base（後の抵抗値から基準の抵抗値）／
//     u6s9neg（α が負の時の変わり方）／u6s9negv（α が負の時の後の抵抗値）。
// まちがいの選択肢は、よくある取り違え（上がった温度を掛けていない・後の温度をそのまま掛けた・増えた分だけ答えた・割るところを掛けた・負の符号を落とした など）。
// α は小数5けたまで（fmt は3けたで丸めるので、α は u6s9fa で書く）。
function u6s9fa(x){ return String(Math.round(x * 1e6) / 1e6); }
function u6s9tc(t){ return fmt(t) + " ℃"; }
function u6s9fig(L){ return {kind: "u6s9graph", L: L, P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に・3けたに丸める）。足りなければ null
function u6s9three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r36(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 基準の温度 t1・上がった温度 dt・α・基準の抵抗値 R1 → 後の抵抗値 R2（3けたで割り切れる物だけ）
function u6s9data(r, neg){
  for (;;) {
    var t1 = pick(r, [0, 10, 15, 20, 25, 30]), dt = pick(r, [5, 10, 15, 20, 25, 30, 40, 50]);
    var al = pick(r, [0.001, 0.002, 0.0025, 0.004, 0.005]) * (neg ? -1 : 1), R1 = pick(r, [10, 20, 25, 30, 40, 50, 60, 80, 100, 120, 200]);
    var k = al * dt, R2 = R1 * (1 + k);
    if (t1 + dt > 100 || !nice(R2) || !nice(R1 * k)) continue;
    return {t1: t1, t2: t1 + dt, dt: dt, al: al, k: r36(k * 1000) / 1000, R1: R1, R2: r36(R2)};
  }
}
// 解説の行：上がった温度・式
function u6s9ex(D){
  return ["上がった温度 $" + D.t2 + " - " + D.t1 + " = " + D.dt + "$ ℃",
          "$R_{" + D.t2 + "} = R_{" + D.t1 + "}(1 + \\alpha_{" + D.t1 + "} \\times " + D.dt + ")$"];
}
var GEN = {
  // 6-1 抵抗率
  1: function(r){
    var f = pick(r, ["u6s1law", "u6s1sym", "u6s1dep", "u6s1r", "u6s1r", "u6s1r", "u6s1rho", "u6s1rho", "u6s1l", "u6s1l"]);
    var rho, l, S, R, ok, w, c;
    if (f === "u6s1law") {
      return rule6(r, "図の円柱の抵抗は $R = \\rho \\times$ □ である。", u6s1fig({}),
        [["$\\dfrac{l}{S}$", "l/S"], ["$\\dfrac{S}{l}$", "S/l", "長さと断面積を逆にした"],
         ["$l S$", "lS", "断面積は掛けずに割る"], ["$\\dfrac{1}{l S}$", "1/lS", "長さは割らずに掛ける"]],
        ["抵抗は、抵抗率に長さを掛け、断面積で割った物", "$R = \\rho \\dfrac{l}{S}$"], f);
    }
    if (f === "u6s1sym") {
      var SY = [["rho", "\\rho", "抵抗率"], ["l", "l", "長さ"], ["S", "S", "断面積"]], k = pick(r, [0, 1, 2]);
      var list = [[SY[k][2], SY[k][2]]];
      SY.forEach(function(z, i){ if (i !== k) list.push([z[2], z[2], z[2] + "を表す記号は $" + z[1] + "$"]); });
      list.push(["抵抗", "抵抗", "抵抗を表す記号は $R$"]);
      c = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
      return {form: f, text: "図の円柱の抵抗を $R = \\rho \\dfrac{l}{S}$ と表すとき、$" + SY[k][1] + "$ は □ を表す。",
              fig: u6s1fig({}), ch: c.ch, ans: c.ans,
              ex: ["$\\rho$ は抵抗率、$l$ は長さ、$S$ は断面積", "$" + SY[k][1] + "$ は" + SY[k][2]],
              chk: {form: f, p: {s: SY[k][0]}}};
    }
    if (f === "u6s1dep") {
      return rule6(r, "図の円柱の抵抗で、抵抗率 $\\rho$ が決まる物は □ である。", u6s1fig({}),
        [["物質", "物質"], ["長さ", "長さ", "長さは形の1つ。抵抗率は形で変わらない"],
         ["断面積", "断面積", "断面積は形の1つ。抵抗率は形で変わらない"],
         ["流れる電流", "電流", "抵抗率は流れる電流で決まらない"]],
        ["抵抗率 $\\rho$ は物質で決まる値", "物質が違うと抵抗率も違う"], f);
    }
    if (f === "u6s1r") {                // ρ・l・S から R
      for (;;) {
        rho = pick(r, U6S1RHO); l = pick(r, U6S1LEN); S = pick(r, U6S1AREA); ok = r36(rho * l / S);
        if (!nice(ok) || ok < 0.5 || ok > 400) continue;
        w = u6s1three(ok, [{x: rho * S / l, why: "長さと断面積を逆にした"}, {x: rho * l * S, why: "断面積で割らずに掛けた"},
                           {x: l / S, why: "抵抗率 $\\rho$ を掛けていない"}, {x: rho * l, why: "断面積で割っていない"}]);
        if (w) break;
      }
      c = num(r, null, "O", ok, w);
      return {form: f, text: "図のように、" + u6s1q(rho, l, S) + " の円柱の抵抗がある。この抵抗 $R$ は何 Ω か。",
              fig: u6s1fig(u6s1lab(rho, l, S)), ch: c.ch, ans: c.ans,
              ex: ["抵抗は、抵抗率に長さを掛け、断面積で割った物",
                   "$R = \\rho \\dfrac{l}{S} = " + fmt(rho) + " \\times \\dfrac{" + fmt(l) + "}{" + fmt(S) + "} = " + qv(ok, "O") + "$"],
              chk: {form: f, p: {rho: rho, l: l, S: S}}};
    }
    if (f === "u6s1rho") {              // R・l・S から ρ
      for (;;) {
        rho = pick(r, U6S1RHO); l = pick(r, U6S1LEN); S = pick(r, U6S1AREA); R = r36(rho * l / S); ok = rho;
        if (!nice(R) || R < 0.5 || R > 400) continue;
        w = u6s1three(ok, [{x: R * l / S, why: "長さと断面積を逆にした"}, {x: R * l * S, why: "長さで割らずに掛けた"},
                           {x: R / (l * S), why: "断面積で割った（断面積は掛ける）"}, {x: R, why: "抵抗の値をそのまま抵抗率とした"}]);
        if (w) break;
      }
      c = u6s1nu(r, ok, w, U6S1OM);
      return {form: f, text: "図のように、長さ $l = " + fmt(l) + "\\,\\mathrm{m}$、断面積 $S = " + fmt(S) + "\\,\\mathrm{m}^2$ の円柱の抵抗の値は "
                    + "$R = " + qv(R, "O") + "$ である。この物質の抵抗率 $\\rho$ は何 $" + U6S1OM + "$ か。",
              fig: u6s1fig({r: "{R}=" + qf(R, "O"), l: "{l}=" + fmt(l) + " m", S: "{S}=" + fmt(S) + " m²"}), ch: c.ch, ans: c.ans,
              ex: ["$R = \\rho \\dfrac{l}{S}$ の両辺に $\\dfrac{S}{l}$ を掛けて　$\\rho = R \\dfrac{S}{l}$",
                   "$\\rho = " + fmt(R) + " \\times \\dfrac{" + fmt(S) + "}{" + fmt(l) + "} = " + fmt(ok) + "\\," + U6S1OM + "$"],
              chk: {form: f, p: {R: R, l: l, S: S}}};
    }
    for (;;) {                          // u6s1l：R・ρ・S から l
      rho = pick(r, U6S1RHO); l = pick(r, U6S1LEN); S = pick(r, U6S1AREA); R = r36(rho * l / S); ok = l;
      if (!nice(R) || R < 0.5 || R > 400) continue;
      w = u6s1three(ok, [{x: R * rho / S, why: "抵抗率と断面積を逆にした"}, {x: R * S, why: "抵抗率で割っていない"},
                         {x: R / (rho * S), why: "断面積で割った（断面積は掛ける）"}, {x: R * rho * S, why: "抵抗率で割らずに掛けた"}]);
      if (w) break;
    }
    c = u6s1nu(r, ok, w, "\\mathrm{m}");
    return {form: "u6s1l", text: "図のように、抵抗率 $\\rho = " + fmt(rho) + "\\," + U6S1OM + "$、断面積 $S = " + fmt(S) + "\\,\\mathrm{m}^2$ の円柱の抵抗の値は "
                  + "$R = " + qv(R, "O") + "$ である。この抵抗の長さ $l$ は何 m か。",
            fig: u6s1fig({r: "{R}=" + qf(R, "O"), rho: "{ρ}=" + fmt(rho) + " Ω·m", S: "{S}=" + fmt(S) + " m²"}), ch: c.ch, ans: c.ans,
            ex: ["$R = \\rho \\dfrac{l}{S}$ の両辺に $\\dfrac{S}{\\rho}$ を掛けて　$l = \\dfrac{R S}{\\rho}$",
                 "$l = \\dfrac{" + fmt(R) + " \\times " + fmt(S) + "}{" + fmt(rho) + "} = " + fmt(ok) + "\\,\\mathrm{m}$"],
            chk: {form: "u6s1l", p: {R: R, rho: rho, S: S}}};
  },
  // 6-2 単位を式から出す
  2: function(r){
    var f = pick(r, ["u6s2rho", "u6s2unit", "u6s2unit", "u6s2deriv", "u6s2deriv", "u6s2deriv", "u6s2mul"]);
    var c, e, s;
    if (f === "u6s2rho") {
      c = choices(r, [{t: "$\\Omega \\cdot \\mathrm{m}$", v: "Om"},
                      {t: "$\\Omega / \\mathrm{m}$", v: "O/m", why: "最後に両辺に $\\mathrm{m}$ を掛けずに割った"},
                      {t: "$\\Omega \\cdot \\mathrm{m}^2$", v: "Om2", why: "上と下の $\\mathrm{m}$ を約分していない"},
                      {t: "$\\Omega$", v: "O", why: "$\\Omega$ は抵抗の単位"}]);
      return {form: f, text: "図の円柱の抵抗 $R = \\rho \\dfrac{l}{S}$ の量を単位に置き換えて約分すると、抵抗率 $\\rho$ の単位は □ である。",
              fig: u6s2fig({r: "Ω", l: "m", S: "m²"}), ch: c.ch, ans: c.ans,
              ex: ["$\\Omega = \\rho \\times \\dfrac{\\mathrm{m}}{\\mathrm{m}^2} = \\rho \\times \\dfrac{1}{\\mathrm{m}}$",
                   "両辺に $\\mathrm{m}$ を掛けて　$\\rho$ の単位は $\\Omega \\cdot \\mathrm{m}$"],
              chk: {form: f, p: {}}};
    }
    if (f === "u6s2unit") {
      s = pick(r, ["R", "l", "S", "rho"]);
      var a = U6S2SYM[s][1];
      c = u6s2four(r, a, function(k){ return "$" + U6S2U[k][0] + "$ は" + U6S2U[k][1] + "の単位"; });
      return {form: f, text: "図の円柱の抵抗 $R = \\rho \\dfrac{l}{S}$ で、$" + U6S2SYM[s][0] + "$ の単位は □ である。",
              fig: u6s2fig({}), ch: c.ch, ans: c.ans,
              ex: ["$R$ は $\\Omega$、$l$ は $\\mathrm{m}$、$S$ は $\\mathrm{m}^2$、$\\rho$ は $\\Omega \\cdot \\mathrm{m}$",
                   "$" + U6S2SYM[s][0] + "$ は" + U6S2U[a][1] + "なので、単位は $" + U6S2U[a][0] + "$"],
              chk: {form: f, p: {s: s}}};
    }
    if (f === "u6s2deriv") {
      e = pick(r, U6S2EQ);
      c = u6s2four(r, e.a, function(k){ return "約分して残るのは $" + U6S2U[e.a][0] + "$（$" + U6S2U[k][0] + "$ は" + U6S2U[k][1] + "の単位）"; });
      return {form: f, text: "図の円柱の抵抗で、$" + e.lhs + " = " + e.rhs + "$ の右辺の量を単位に置き換えて約分すると、$" + e.lhs + "$ の単位は □ になる。",
              fig: u6s2fig({}), ch: c.ch, ans: c.ans,
              ex: ["右辺を単位に置き換えて　$" + e.u + "$", e.k],
              chk: {form: f, p: {x: e.x}}};
    }
    c = choices(r, [{t: "$\\mathrm{m}$", v: "m"},
                    {t: "$\\Omega$", v: "O", why: "$\\Omega$ を掛けても、右辺の $\\dfrac{1}{\\mathrm{m}}$ は消えない"},
                    {t: "$\\mathrm{m}^2$", v: "m2", why: "$\\mathrm{m}^2$ を掛けると、右辺に $\\mathrm{m}$ が残る"},
                    {t: "$\\dfrac{1}{\\mathrm{m}}$", v: "1/m", why: "$\\dfrac{1}{\\mathrm{m}}$ を掛けると、右辺は $\\dfrac{1}{\\mathrm{m}^2}$ になる"}]);
    return {form: "u6s2mul", text: "図の円柱の抵抗の量を単位に置き換えて約分すると、$\\Omega = \\rho \\times \\dfrac{1}{\\mathrm{m}}$ になった。"
                  + "抵抗率 $\\rho$ の単位を出すには、両辺に □ を掛ける。",
            fig: u6s2fig({r: "Ω"}), ch: c.ch, ans: c.ans,
            ex: ["両辺に $\\mathrm{m}$ を掛けると、右辺の $\\dfrac{1}{\\mathrm{m}}$ が消える", "$\\Omega \\cdot \\mathrm{m} = \\rho$"],
            chk: {form: "u6s2mul", p: {}}};
  },
  // 6-3 長さと断面積
  3: function(r){
    var f = pick(r, ["u6s3shape", "u6s3fac", "u6s3fac", "u6s3len", "u6s3len", "u6s3area", "u6s3area", "u6s3both", "u6s3both", "u6s3both"]);
    var R1, kl, ks, ok, w, c;
    if (f === "u6s3shape") {
      var big = pick(r, [1, 0]), wd = big ? "大きい" : "小さい";
      var list = big
        ? [["細く長い", "細く長い"], ["太く短い", "太く短い", "比例と反比例を逆にした（太く短いと抵抗は最も小さい）"],
           ["太く長い", "太く長い", "太いと通りやすく、抵抗は小さくなる"], ["細く短い", "細く短い", "短いと通りやすく、抵抗は小さくなる"]]
        : [["太く短い", "太く短い"], ["細く長い", "細く長い", "比例と反比例を逆にした（細く長いと抵抗は最も大きい）"],
           ["太く長い", "太く長い", "長いと通りにくく、抵抗は大きくなる"], ["細く短い", "細く短い", "細いと通りにくく、抵抗は大きくなる"]];
      var q = rule6(r, "同じ物質の円柱の抵抗で、抵抗が最も" + wd + "のは □ 形である。", {kind: "u6s3two", L: {r1: "{R}", l1: "{l}", S1: "{S}", one: 1}, P: {}},
        list, ["抵抗は長さ $l$ に比例し、断面積 $S$ に反比例する", "長い道は通りにくく、広い道は通りやすい　→　" + list[0][0] + "形が最も" + wd], f);
      q.chk.p = {big: big};
      return q;
    }
    if (f === "u6s3fac") {
      var isL = pick(r, [1, 0]), k = pick(r, U6S3K);
      var fr = function(n, d){ var g = gcd6(n, d); n /= g; d /= g; return {t: d === 1 ? "$" + n + "$ 倍" : "$\\dfrac{" + n + "}{" + d + "}$ 倍", v: n + "/" + d}; };
      var same = fr(k.n, k.d), rev = fr(k.d, k.n), sq = fr(k.n * k.n, k.d * k.d), one = fr(1, 1);
      var okc = isL ? same : rev, wr = isL ? rev : same;
      c = choices(r, [okc, Object.assign(wr, {why: isL ? "比例と反比例を逆にした（長いほど通りにくい）" : "比例と反比例を逆にした（広いほど通りやすい）"}),
                      Object.assign(one, {why: (isL ? "長さ" : "断面積") + "が変わると、抵抗も変わる"}),
                      Object.assign(sq, {why: "何倍を、もう1つ多く掛けた"})]);
      return {form: f, text: "図の上の円柱の抵抗と同じ物質で、" + (isL ? "断面積はそのまま、長さ" : "長さはそのまま、断面積") + "を $" + u6s3tex(k) + "$ 倍にした。"
                    + "下の抵抗 $R_2$ は、上の抵抗 $R_1$ の □ である。",
              fig: u6s3fig(null, isL ? k : null, isL ? null : k), ch: c.ch, ans: c.ans,
              ex: ["抵抗は長さ $l$ に比例し、断面積 $S$ に反比例する",
                   (isL ? "長さが $" + u6s3tex(k) + "$ 倍なので、抵抗は " : "断面積が $" + u6s3tex(k) + "$ 倍なので、抵抗は ") + okc.t],
              chk: {form: f, p: {L: isL, n: k.n, d: k.d}}};
    }
    if (f === "u6s3len" || f === "u6s3area") {
      var isLen = f === "u6s3len";
      for (;;) {
        R1 = pick(r, RS6); var k2 = pick(r, U6S3K), v2 = u6s3v(k2);
        ok = r36(isLen ? R1 * v2 : R1 / v2);
        if (!nice(ok) || !int6(ok) || ok > 300) continue;
        w = u6s3three(ok, isLen
          ? [{x: R1 / v2, why: "比例と反比例を逆にした（長いほど通りにくい）"}, {x: R1, why: "長さが変わると、抵抗も変わる"},
             {x: R1 + R1 * v2, why: "元の抵抗 $R_1$ に足した"}]
          : [{x: R1 * v2, why: "断面積が大きいほど抵抗も大きいと考えた（広いほど通りやすい）"}, {x: R1, why: "断面積が変わると、抵抗も変わる"},
             {x: R1 + R1 / v2, why: "元の抵抗 $R_1$ に足した"}]);
        if (w) break;
      }
      c = num(r, null, "O", ok, w);
      return {form: f, text: "図の上の抵抗は $R_1 = " + qv(R1, "O") + "$ である。同じ物質で、" + (isLen ? "断面積はそのまま、長さ" : "長さはそのまま、断面積")
                    + "を $" + u6s3tex(k2) + "$ 倍にした下の抵抗 $R_2$ は何 Ω か。",
              fig: u6s3fig(R1, isLen ? k2 : null, isLen ? null : k2), ch: c.ch, ans: c.ans,
              ex: [isLen ? "抵抗は長さに比例する" : "抵抗は断面積に反比例する",
                   "$R_2 = " + fmt(R1) + " \\times " + (isLen ? u6s3tex(k2) : u6s3tex({n: k2.d, d: k2.n})) + " = " + qv(ok, "O") + "$"],
              chk: {form: f, p: {R1: R1, n: k2.n, d: k2.d}}};
    }
    for (;;) {                          // u6s3both：長さも断面積も変えた R2
      R1 = pick(r, RS6); kl = pick(r, U6S3K); ks = pick(r, U6S3K);
      var a = u6s3v(kl), b = u6s3v(ks);
      ok = r36(R1 * a / b);
      if (!nice(ok) || !int6(ok) || ok > 300 || Math.abs(a - b) < 1e-9) continue;
      w = u6s3three(ok, [{x: R1 * b / a, why: "長さと断面積の何倍を逆にした"}, {x: R1 * a * b, why: "断面積の何倍も掛けた（断面積が大きいほど抵抗は小さい）"},
                         {x: R1 * a, why: "断面積を変えた分を入れていない"}, {x: R1 / b, why: "長さを変えた分を入れていない"}]);
      if (w) break;
    }
    c = num(r, null, "O", ok, w);
    return {form: "u6s3both", text: "図の上の抵抗は $R_1 = " + qv(R1, "O") + "$ である。同じ物質で、長さを $" + u6s3tex(kl) + "$ 倍、断面積を $" + u6s3tex(ks)
                  + "$ 倍にした下の抵抗 $R_2$ は何 Ω か。",
            fig: u6s3fig(R1, kl, ks), ch: c.ch, ans: c.ans,
            ex: ["長さで $" + u6s3tex(kl) + "$ 倍、断面積で $" + u6s3tex({n: ks.d, d: ks.n}) + "$ 倍",
                 "$R_2 = " + fmt(R1) + " \\times " + u6s3tex(kl) + " \\times " + u6s3tex({n: ks.d, d: ks.n}) + " = " + qv(ok, "O") + "$"],
            chk: {form: "u6s3both", p: {R1: R1, ln: kl.n, ld: kl.d, sn: ks.n, sd: ks.d}}};
  },
  // 6-4 抵抗を長さで分ける
  4: function(r){
    var f = pick(r, ["u6s4part", "u6s4part", "u6s4whole", "u6s4ratio", "u6s4path", "u6s4cur", "u6s4cur", "u6s4cur"]);
    var P, T, a, b, R, k, lk, lo, Rk, Ro, V, I, ok, w, c;
    P = u6s4pair(r); T = P[0]; a = P[1]; b = P[2];
    var base = {f: a / T, l1: u6s4m(a), l2: u6s4m(b)};
    if (f === "u6s4ratio") {
      while (a === b) { P = u6s4pair(r); T = P[0]; a = P[1]; b = P[2]; }
      base = {f: a / T, l1: u6s4m(a), l2: u6s4m(b)};
      return rule6(r, "図のように、1本の抵抗を、左の端から $" + u6s4mt(a) + "$ の所で $R_1$ と $R_2$ に分けた。$R_1 : R_2$ は □ である。",
        u6s4fig(Object.assign({bare: 1, r1: "{R}_1", r2: "{R}_2"}, base)),
        [["$" + ratio6([a, b]) + "$", "len"], ["$" + ratio6([b, a]) + "$", "rev", "比を逆にした（長い部分ほど抵抗は大きい）"],
         ["$1 : 1$", "one", "抵抗は長さに比例する。長さが違えば抵抗も違う"],
         ["$" + ratio6([a, T]) + "$", "whole", "$R_1$ と、分ける前の1本の抵抗の比と取り違えた"]],
        ["抵抗は長さに比例する", "$R_1 : R_2 = " + fmt(a) + " : " + fmt(b) + " = " + ratio6([a, b]) + "$"], "u6s4ratio");
    }
    if (f === "u6s4path") {
      k = pick(r, [1, 2]);
      var on = "R_" + (3 - k), off = "R_" + k;
      return rule6(r, "図のように、1本の抵抗を $R_1$ と $R_2$ に分け、$" + off + "$ の両端を、抵抗を挟まずに線でつないだ。電流が通る抵抗は □ である。",
        u6s4fig(Object.assign({pm: 1, src: "{V}", sh: k, r1: "{R}_1", r2: "{R}_2", i: "{I}"}, base)),
        [["$" + on + "$ だけ", "on"], ["$" + off + "$ だけ", "off", "逆。短絡した $" + off + "$ には電流が流れない"],
         ["$R_1$ と $R_2$ のどちらにも", "both", "短絡した線を考えていない"],
         ["どちらも通らない", "none", "短絡していない $" + on + "$ には電流が流れる"]],
        ["$" + off + "$ の両端は短絡した線でつながっているので、電流は $" + off + "$ を通らない", "電流が通るのは $" + on + "$ だけ"], "u6s4path");
    }
    if (f === "u6s4part") {             // R と長さから R_k
      for (;;) {
        R = pick(r, RS6); k = pick(r, [1, 2]); lk = k === 1 ? a : b; lo = T - lk;
        ok = R * lk / T;
        if (!int6(ok)) { P = u6s4pair(r); T = P[0]; a = P[1]; b = P[2]; continue; }
        w = u6s4three(ok, [{x: R - ok, why: "もう一方の部分の抵抗を求めた"}, {x: R * T / lk, why: "割合を逆にした"},
                           {x: R / 2, why: "長さに関係なく半分に分かれると考えた"}, {x: R * lk, why: "全体の長さで割っていない"}]);
        if (w) break;
        P = u6s4pair(r); T = P[0]; a = P[1]; b = P[2];
      }
      base = {f: a / T, l1: u6s4m(a), l2: u6s4m(b)};
      c = num(r, null, "O", ok, w);
      return {form: f, text: "図のように、長さ $" + u6s4mt(T) + "$、$R = " + qv(R, "O") + "$ の1本の抵抗を、左の端から $" + u6s4mt(a) + "$ の所で $R_1$ と $R_2$ に分けた。"
                    + "$R_" + k + "$ は何 Ω か。",
              fig: u6s4fig(Object.assign({bare: 1, r: "{R}=" + qf(R, "O"), r1: "{R}_1", r2: "{R}_2"}, base)), ch: c.ch, ans: c.ans,
              ex: ["抵抗は長さに比例するので、長さの割合で分ける",
                   "$R_" + k + " = R \\times \\dfrac{" + fmt(lk) + "}{" + fmt(T) + "} = " + fmt(R) + " \\times \\dfrac{" + fmt(lk) + "}{" + fmt(T) + "} = " + qv(ok, "O") + "$"],
              chk: {form: f, p: {R: R, T: T, a: a, k: k}}};
    }
    if (f === "u6s4whole") {            // R_k と長さから R
      for (;;) {
        k = pick(r, [1, 2]); lk = k === 1 ? a : b; lo = T - lk;
        Rk = pick(r, RS6); ok = Rk * T / lk;
        if (int6(ok) && ok <= 300) {
          w = u6s4three(ok, [{x: Rk * lo / lk, why: "もう一方の部分の抵抗を求めた"}, {x: Rk * lk / T, why: "割合を逆にした"},
                             {x: Rk * T, why: "長さを掛けただけ（$" + u6s4mt(lk) + "$ で割っていない）"}, {x: Rk * 2, why: "長さに関係なく2倍にした"}]);
          if (w) break;
        }
        P = u6s4pair(r); T = P[0]; a = P[1]; b = P[2];
      }
      base = {f: a / T, l1: u6s4m(a), l2: u6s4m(b)};
      c = num(r, null, "O", ok, w);
      var Lb = {bare: 1, r: "{R}", r1: "{R}_1", r2: "{R}_2"};
      Lb["r" + k] = ohm6("_" + k, Rk);
      return {form: f, text: "図のように、1本の抵抗 $R$ を、左の端から $" + u6s4mt(a) + "$ の所で $R_1$ と $R_2$ に分けると、$R_" + k + " = " + qv(Rk, "O") + "$ になった。"
                    + "$R$ は何 Ω か。",
              fig: u6s4fig(Object.assign(Lb, base)), ch: c.ch, ans: c.ans,
              ex: ["抵抗は長さに比例する。$R$ は $R_" + k + "$ の $\\dfrac{" + fmt(T) + "}{" + fmt(lk) + "}$ 倍",
                   "$R = " + fmt(Rk) + " \\times \\dfrac{" + fmt(T) + "}{" + fmt(lk) + "} = " + qv(ok, "O") + "$"],
              chk: {form: f, p: {Rk: Rk, T: T, a: a, k: k}}};
    }
    for (;;) {                          // u6s4cur：k の部分を短絡 → 残りの部分の抵抗 Ro だけで I = V / Ro
      R = pick(r, RS6); k = pick(r, [1, 2]); lk = k === 1 ? a : b; lo = T - lk;
      Ro = R * lo / T; Rk = R - Ro; I = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]); V = I * Ro;
      if (int6(Ro) && int6(V) && V >= 2 && V <= 200) {
        ok = I;
        w = u6s4three(ok, [{x: V / R, why: "短絡した部分も電流が通ると考えた（全体の $R$ で割った）"},
                           {x: V / Rk, why: "短絡した部分の抵抗で割った"},
                           {x: V / lo, why: "抵抗でなく長さで割った"}, {x: V * Ro, why: "割るところを掛けた"}]);
        if (w) break;
      }
      P = u6s4pair(r); T = P[0]; a = P[1]; b = P[2];
    }
    base = {f: a / T, l1: u6s4m(a), l2: u6s4m(b)};
    c = num(r, null, "A", ok, w);
    return {form: "u6s4cur", text: "図のように、長さ $" + u6s4mt(T) + "$、$R = " + qv(R, "O") + "$ の1本の抵抗を、左の端から $" + u6s4mt(a) + "$ の所で分けた。"
                  + (k === 1 ? "左" : "右") + "の $" + u6s4mt(lk) + "$ の部分の両端を、抵抗を挟まずに線でつないだ。電源の電圧は $V = " + qv(V, "V") + "$ である。"
                  + "流れる電流 $I$ は何 A か。",
            fig: u6s4fig(Object.assign({pm: 1, src: "{V}=" + qf(V, "V"), sh: k, r: "{R}=" + qf(R, "O"), i: "{I}"}, base)), ch: c.ch, ans: c.ans,
            ex: ["短絡した部分は電流が通らない。通るのは残りの $" + u6s4mt(lo) + "$ の部分だけ",
                 "その抵抗は　$" + fmt(R) + " \\times \\dfrac{" + fmt(lo) + "}{" + fmt(T) + "} = " + qv(Ro, "O") + "$",
                 "$I = \\dfrac{V}{" + fmt(Ro) + "} = \\dfrac{" + fmt(V) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"],
            chk: {form: "u6s4cur", p: {V: V, R: R, T: T, a: a, k: k}}};
  },
  // 6-5 コンダクタンス
  5: function(r){
    var f = pick(r, ["u6s5def", "u6s5unit", "u6s5same", "u6s5g", "u6s5g", "u6s5g", "u6s5r", "u6s5r", "u6s5cmp"]);
    var R, G, R1, R2, ok, w, c;
    if (f === "u6s5def") {
      return rule6(r, "抵抗 $R$ の逆数を □ という。", u6s5fig({r: "{R}", g: "{G}"}),
        [["コンダクタンス", "cond"], ["抵抗率", "rho", "抵抗率は、物質で決まる値（$R = \\rho \\dfrac{l}{S}$ の $\\rho$）"],
         ["ジーメンス", "siemens", "ジーメンスは単位の名前。量の名前ではない"],
         ["合成抵抗", "comb", "合成抵抗は、2つ以上の抵抗を1つの抵抗に置き換えた物"]],
        ["抵抗 $R$ の逆数をコンダクタンスという　$G = \\dfrac{1}{R}$"], "u6s5def");
    }
    if (f === "u6s5unit") {
      return rule6(r, "コンダクタンス $G$ の単位は □ である。", u6s5fig({r: "{R}", g: "{G}"}),
        [["$\\mathrm{S}$", "S"], ["$\\Omega$", "O", "$\\Omega$ は抵抗の単位"],
         ["$\\Omega \\cdot \\mathrm{m}$", "Om", "$\\Omega \\cdot \\mathrm{m}$ は抵抗率の単位"], ["$\\mathrm{A}$", "A", "A は電流の単位"]],
        ["コンダクタンスの単位は $\\mathrm{S}$（ジーメンス）"], "u6s5unit");
    }
    if (f === "u6s5same") {
      return rule6(r, "コンダクタンスの単位 $\\mathrm{S}$ と同じ単位は □ である。", u6s5fig({r: "{R}", g: "{G}"}),
        [["$\\Omega^{-1}$", "Oinv"], ["$\\Omega$", "O", "$\\mathrm{S}$ は $\\Omega$ の逆数。$\\Omega$ そのものではない"],
         ["$\\Omega \\cdot \\mathrm{m}$", "Om", "$\\Omega \\cdot \\mathrm{m}$ は抵抗率の単位"], ["$\\mathrm{V}$", "V", "V は電圧の単位"]],
        ["$G = \\dfrac{1}{R}$ を単位だけで書くと　$\\mathrm{S} = \\dfrac{1}{\\Omega} = \\Omega^{-1}$"], "u6s5same");
    }
    if (f === "u6s5cmp") {
      do { R1 = pick(r, U6S5R); R2 = pick(r, U6S5R); } while (R1 === R2);
      var big = R1 < R2 ? 1 : 2;
      c = choices(r, [{t: "$G_" + big + "$", v: "G" + big}, {t: "$G_" + (3 - big) + "$", v: "G" + (3 - big), why: "逆。抵抗が小さいほど、その逆数の $G$ は大きい"},
                      {t: "どちらも同じ", v: "same", why: "抵抗が違えば、その逆数も違う"},
                      {t: "電圧が分からないので決まらない", v: "none", why: "$G$ は抵抗の値だけで決まる"}]);
      return {form: f, text: "図の2つの抵抗 $R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ のコンダクタンスを $G_1$・$G_2$ とする。大きいのは □ である。",
              fig: u6s5fig({n: 2, r1: ohm6("_1", R1), r2: ohm6("_2", R2), g1: "{G}_1", g2: "{G}_2"}), ch: c.ch, ans: c.ans,
              ex: ["$G$ は抵抗の逆数なので、抵抗が小さいほど $G$ は大きい", "$R_" + big + "$ の方が小さいので、大きいのは $G_" + big + "$"],
              chk: {form: f, p: {R1: R1, R2: R2}}};
    }
    if (f === "u6s5g") {                // R から G（S）
      for (;;) {
        R = pick(r, U6S5R); ok = 1 / R;
        w = u6s5three(ok, [{x: R, why: "逆数にしていない（$R$ の値のまま）"}, {x: ok * 10, why: "けたを取り違えた"},
                           {x: ok / 10, why: "けたを取り違えた"}, {x: ok * 100, why: "けたを取り違えた"}]);
        if (w && nice(ok)) break;
      }
      c = u6s5numS(r, r36(ok), w);
      return {form: f, text: "図の抵抗 $R = " + qv(R, "O") + "$ のコンダクタンス $G$ は何 S か。",
              fig: u6s5fig({r: ohm6("", R), g: "{G}"}), ch: c.ch, ans: c.ans,
              ex: ["$G$ は抵抗 $R$ の逆数", "$G = \\dfrac{1}{R} = \\dfrac{1}{" + fmt(R) + "} = " + fmt(r36(ok)) + "\\,\\mathrm{S}$"],
              chk: {form: f, p: {R: R}}};
    }
    for (;;) {                          // u6s5r：G から R（Ω）
      R = pick(r, U6S5R); G = r36(1 / R); ok = R;
      w = u6s5three(ok, [{x: G, why: "逆数にしていない（$G$ の値のまま）"}, {x: R * 10, why: "けたを取り違えた"},
                         {x: R / 10, why: "けたを取り違えた"}, {x: R * 100, why: "けたを取り違えた"}]);
      if (w && nice(G) && Math.abs(G * R - 1) < 1e-9) break;
    }
    c = num(r, null, "O", ok, w);
    return {form: "u6s5r", text: "図の抵抗のコンダクタンスは $G = " + fmt(G) + "\\,\\mathrm{S}$ である。抵抗 $R$ は何 Ω か。",
            fig: u6s5fig({r: "{R}", g: "{G}=" + fmt(G) + " S"}), ch: c.ch, ans: c.ans,
            ex: ["$G = \\dfrac{1}{R}$ なので、$R$ は $G$ の逆数", "$R = \\dfrac{1}{G} = \\dfrac{1}{" + fmt(G) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "u6s5r", p: {G: G}}};
  },
  // 6-6 導電率
  6: function(r){
    var f = pick(r, ["u6s6def", "u6s6unit", "u6s6sig", "u6s6sig", "u6s6sig", "u6s6rho", "u6s6rho", "u6s6cmp", "u6s6cmp"]);
    var rho, sig, r1, r2, ok, w, c;
    if (f === "u6s6def") {
      return rule6(r, "抵抗率 $\\rho$ の逆数を □ という。", u6s6fig({rho: "{ρ}", sig: "{σ}"}),
        [["導電率", "cond"], ["コンダクタンス", "G", "コンダクタンスは、抵抗 $R$ の逆数"],
         ["抵抗", "R", "抵抗は　$R = \\rho \\dfrac{l}{S}$　で、抵抗率の逆数ではない"],
         ["ジーメンス", "siemens", "ジーメンスは単位の名前。量の名前ではない"]],
        ["抵抗率 $\\rho$ の逆数を導電率という　$\\sigma = \\dfrac{1}{\\rho}$"], "u6s6def");
    }
    if (f === "u6s6unit") {
      return rule6(r, "導電率 $\\sigma$ の単位は □ である。", u6s6fig({rho: "{ρ}", sig: "{σ}"}),
        [["$\\mathrm{S/m}$", "Sm"], ["$\\mathrm{S}$", "S", "$\\mathrm{S}$ はコンダクタンスの単位"],
         ["$\\Omega \\cdot \\mathrm{m}$", "Om", "$\\Omega \\cdot \\mathrm{m}$ は抵抗率の単位"],
         ["$\\mathrm{S} \\cdot \\mathrm{m}$", "S_m", "$\\Omega \\cdot \\mathrm{m}$ の逆数は、$\\mathrm{m}$ も逆数になる"]],
        ["$\\sigma = \\dfrac{1}{\\rho}$ なので、単位は $\\Omega \\cdot \\mathrm{m}$ の逆数",
         "$\\dfrac{1}{\\Omega \\cdot \\mathrm{m}} = \\dfrac{1}{\\Omega} \\times \\dfrac{1}{\\mathrm{m}} = \\mathrm{S/m}$"], "u6s6unit");
    }
    if (f === "u6s6cmp") {
      do { r1 = pick(r, U6S6R); r2 = pick(r, U6S6R); } while (r1 === r2);
      var big = r1 < r2 ? 1 : 2;
      c = choices(r, [{t: "$\\sigma_" + big + "$", v: "s" + big},
                      {t: "$\\sigma_" + (3 - big) + "$", v: "s" + (3 - big), why: "逆。抵抗率が小さいほど、その逆数の導電率は大きい"},
                      {t: "どちらも同じ", v: "same", why: "抵抗率が違えば、その逆数の導電率も違う"},
                      {t: "長さと断面積が分からないので決まらない", v: "none", why: "導電率は抵抗率の逆数で、物質で決まる。形には関係しない"}]);
      return {form: f, text: "図の2つの物質の抵抗率は $\\rho_1 = " + u6s6q(r1, "om") + "$、$\\rho_2 = " + u6s6q(r2, "om") + "$ である。"
                    + "導電率 $\\sigma_1$・$\\sigma_2$ のうち、大きいのは □ である。",
              fig: u6s6fig({n: 2, rho1: "{ρ}_1=" + fmt(r1) + U6S6F.om, rho2: "{ρ}_2=" + fmt(r2) + U6S6F.om, sig1: "{σ}_1", sig2: "{σ}_2"}), ch: c.ch, ans: c.ans,
              ex: ["導電率は抵抗率の逆数なので、抵抗率が小さいほど大きい",
                   "$\\rho_" + big + "$ の方が小さいので、大きいのは $\\sigma_" + big + "$（電気が流れやすい）"],
              chk: {form: f, p: {r1: r1, r2: r2}}};
    }
    if (f === "u6s6sig") {              // ρ から σ（S/m）
      for (;;) {
        rho = pick(r, U6S6R); ok = r36(1 / rho);
        w = u6s6three(ok, [{x: rho, why: "逆数にしていない（$\\rho$ の値のまま）"}, {x: ok * 10, why: "けたを取り違えた"},
                           {x: ok / 10, why: "けたを取り違えた"}, {x: ok * 100, why: "けたを取り違えた"}]);
        if (w && Math.abs(ok * rho - 1) < 1e-9) break;
      }
      c = u6s6num(r, ok, w, "sm");
      return {form: f, text: "図の物質の抵抗率は $\\rho = " + u6s6q(rho, "om") + "$ である。導電率 $\\sigma$ は何 S/m か。",
              fig: u6s6fig({rho: "{ρ}=" + fmt(rho) + U6S6F.om, sig: "{σ}"}), ch: c.ch, ans: c.ans,
              ex: ["導電率は抵抗率の逆数", "$\\sigma = \\dfrac{1}{\\rho} = \\dfrac{1}{" + fmt(rho) + "} = " + u6s6q(ok, "sm") + "$"],
              chk: {form: f, p: {rho: rho}}};
    }
    for (;;) {                          // u6s6rho：σ から ρ（Ω·m）
      ok = pick(r, U6S6R); sig = r36(1 / ok);
      w = u6s6three(ok, [{x: sig, why: "逆数にしていない（$\\sigma$ の値のまま）"}, {x: ok * 10, why: "けたを取り違えた"},
                         {x: ok / 10, why: "けたを取り違えた"}, {x: ok * 100, why: "けたを取り違えた"}]);
      if (w && Math.abs(ok * sig - 1) < 1e-9) break;
    }
    c = u6s6num(r, ok, w, "om");
    return {form: "u6s6rho", text: "図の物質の導電率は $\\sigma = " + u6s6q(sig, "sm") + "$ である。抵抗率 $\\rho$ は何 Ω·m か。",
            fig: u6s6fig({rho: "{ρ}", sig: "{σ}=" + fmt(sig) + U6S6F.sm}), ch: c.ch, ans: c.ans,
            ex: ["$\\sigma = \\dfrac{1}{\\rho}$ なので、$\\rho$ は $\\sigma$ の逆数", "$\\rho = \\dfrac{1}{\\sigma} = \\dfrac{1}{" + fmt(sig) + "} = " + u6s6q(ok, "om") + "$"],
            chk: {form: "u6s6rho", p: {sig: sig}}};
  },
  // 6-7 温度と抵抗
  7: function(r){
    var f = pick(r, ["u6s7which", "u6s7which", "u6s7metal", "u6s7semi", "u6s7sup", "u6s7cool"]);
    var G = u6s7fig(r), ah = G.am === "a" ? "b" : "a", c;
    if (f === "u6s7which") {
      var mat = r() < 0.5 ? "metal" : "semi", ok = mat === "metal" ? G.am : ah, ng = mat === "metal" ? ah : G.am;
      c = choices(r, [{t: ok, v: ok},
                      {t: ng, v: ng, why: mat === "metal" ? "温度が上がると抵抗値が下がるのは半導体" : "温度が上がると抵抗値が一定の割合で増えるのは金属"},
                      {t: "a と b のどちらも", v: "ab", why: "a と b は、温度が上がった時の抵抗値の変わり方が逆"},
                      {t: "どちらでもない", v: "none", why: "金属は温度が上がると抵抗値が増え、半導体は下がる"}]);
      return {form: f, text: "図は、金属と半導体の温度と抵抗値の関係を表したグラフである。" + (mat === "metal" ? "金属" : "半導体") + "を表すのは □ である。",
              fig: G.fig, ch: c.ch, ans: c.ans,
              ex: ["金属は、温度が上がると抵抗値が一定の割合で増える（" + G.am + "）",
                   "半導体は、温度が上がると抵抗値が下がる（" + ah + "）"],
              chk: {form: f, p: {mat: mat, am: G.am}}};
    }
    if (f === "u6s7metal") {
      return rule6(r, "金属の抵抗値は、温度が上がると □ 。", G.fig,
        [["一定の割合で増える", "inc"],
         ["下がる", "dec", "温度が上がると抵抗値が下がるのは半導体"],
         ["変わらない", "same", "抵抗値は温度でも変わる"],
         ["急に 0 になる", "zero", "抵抗値が急に 0 になるのは、とても冷やした時（超電導）"]],
        ["金属の抵抗値は、温度が上がると一定の割合で増える（" + G.am + "）"], f);
    }
    if (f === "u6s7semi") {
      return rule6(r, "半導体の抵抗値は、温度が上がると □ 。", G.fig,
        [["下がる", "dec"],
         ["一定の割合で増える", "inc", "温度が上がると抵抗値が一定の割合で増えるのは金属"],
         ["変わらない", "same", "抵抗値は温度でも変わる"],
         ["急に 0 になる", "zero", "抵抗値が急に 0 になるのは、金属をとても冷やした時（超電導）"]],
        ["半導体の抵抗値は、温度が上がると下がる（" + ah + "）"], f);
    }
    if (f === "u6s7sup") {
      return rule6(r, "金属をとても冷やすと、ある温度で抵抗値が急に 0 になる。これを □ という。", G.fig,
        [["超電導", "sup"],
         ["半導体", "semi", "半導体は、温度が上がると抵抗値が下がる物"],
         ["抵抗率", "rho", "抵抗率は、物質で決まる値"],
         ["導電率", "sigma", "導電率は、抵抗率の逆数"]],
        ["とても冷やすと抵抗値が急に 0 になる＝超電導（" + G.am + " の左の端）"], f);
    }
    return rule6(r, "金属の温度を下げていくと、抵抗値は □ 。", G.fig,
      [["一定の割合で減り、とても冷やすと急に 0 になる", "dec0"],
       ["増える", "inc", "温度を下げると抵抗値が増えるのは半導体"],
       ["変わらない", "same", "抵抗値は温度でも変わる"],
       ["一定の割合で減り続け、0 にはならない", "dec", "とても冷やすと、ある温度で急に 0 になる（超電導）"]],
      ["金属の抵抗値は、温度が下がると一定の割合で減る（" + G.am + "）", "とても冷やすと急に 0 になる＝超電導"], "u6s7cool");
  },
  // 6-8 抵抗温度係数
  8: function(r){
    var f = pick(r, ["u6s8def", "u6s8sub", "u6s8den", "u6s8per", "u6s8per", "u6s8alpha", "u6s8alpha", "u6s8alpha", "u6s8inc", "u6s8inc"]);
    var D, T, w, c;
    if (f === "u6s8def") {
      T = pick(r, [10, 15, 20, 25, 30]);
      return rule6(r, "抵抗温度係数 $\\alpha_{" + T + "}$ は、" + T + " ℃ の抵抗値を基準にして、温度が 1 ℃ 上がった時に □ である。",
        u6s8fig({t1: u6s8tc(T), r1: "{R}_" + T}),
        [["増える抵抗値の割合", "rate"],
         ["増える抵抗値", "dR", "増える抵抗値を、基準の抵抗値で割った割合が抵抗温度係数"],
         ["上がった後の抵抗値", "R", "抵抗値そのものではなく、増える割合"],
         ["抵抗率", "rho", "抵抗率は、物質で決まる値"]],
        ["抵抗温度係数＝" + T + " ℃ の抵抗値を基準に、1 ℃ 上がった時に増える抵抗値の割合",
         "$\\alpha_{" + T + "}$ ＝ 1 ℃ あたり増える抵抗値 ÷ $R_{" + T + "}$"], f);
    }
    if (f === "u6s8sub") {
      T = pick(r, [10, 15, 20, 25, 30]);
      return rule6(r, "抵抗温度係数 $\\alpha_{" + T + "}$ の添え字の " + T + " が表す物は □ である。",
        u6s8fig({t1: u6s8tc(T), r1: "{R}_" + T}),
        [["基準にした温度 " + T + " ℃", "base"],
         ["上がった温度の幅 " + T + " ℃", "dt", "添え字は、基準にした温度"],
         ["基準の抵抗値 " + T + " Ω", "R", "添え字は温度で、抵抗値ではない"],
         ["抵抗温度係数の値", "val", "値は $\\alpha_{" + T + "} =$ の右に書く"]],
        ["添え字は、基準にした温度（" + T + " ℃ の抵抗値を基準にした抵抗温度係数）"], f);
    }
    D = u6s8data(r);
    if (f === "u6s8den") {
      return rule6(r, "抵抗値が " + D.t1 + " ℃ で $R_{" + D.t1 + "}$、" + D.t2 + " ℃ で $R_{" + D.t2 + "}$ であった。$\\alpha_{" + D.t1 + "}$ を求める時、"
                    + "1 ℃ あたり増える抵抗値を割るのは □ である。",
        u6s8fig({t1: u6s8tc(D.t1), t2: u6s8tc(D.t2), r1: "{R}_" + D.t1, r2: "{R}_" + D.t2}),
        [["$R_{" + D.t1 + "}$", "r1"],
         ["$R_{" + D.t2 + "}$", "r2", "基準にするのは " + D.t1 + " ℃ の抵抗値"],
         ["$R_{" + D.t2 + "} - R_{" + D.t1 + "}$", "dR", "増えた抵抗値は割られる方（温度の上がり幅で割って 1 ℃ あたりにする）"],
         ["温度の上がり幅 " + D.dt + " ℃", "dt", "温度の上がり幅で割るのは、1 ℃ あたりに直す時"]],
        ["$\\alpha_{" + D.t1 + "}$ は " + D.t1 + " ℃ を基準にした割合",
         "1 ℃ あたり増える抵抗値を $R_{" + D.t1 + "}$ で割る"], f);
    }
    var L = {t1: u6s8tc(D.t1), t2: u6s8tc(D.t2), r1: "{R}_" + D.t1 + "=" + qf(D.R1, "O"), r2: "{R}_" + D.t2 + "=" + qf(D.R2, "O")};
    var q = "ある抵抗の抵抗値は、" + D.t1 + " ℃ で $R_{" + D.t1 + "} = " + qv(D.R1, "O") + "$、" + D.t2 + " ℃ で $R_{" + D.t2 + "} = " + qv(D.R2, "O") + "$ であった。";
    var ex1 = "増えた抵抗値 $R_{" + D.t2 + "} - R_{" + D.t1 + "} = " + fmt(D.R2) + " - " + fmt(D.R1) + " = " + qv(D.dR, "O") + "$（" + D.dt + " ℃ で）";
    var ex2 = "1 ℃ あたり $\\dfrac{" + fmt(D.dR) + "}{" + D.dt + "} = " + qv(D.per, "O") + "$";
    if (f === "u6s8per") {
      w = u6s8three(D.per, [{x: D.dR, why: "温度の上がり幅で割っていない"},
                            {x: D.t2 ? D.dR / D.t2 : 0, why: "上がった後の温度で割った（割るのは温度の上がり幅）"},
                            {x: D.R2 / D.dt, why: "増えた分でなく、上がった後の抵抗値を割った"},
                            {x: D.R1 / D.dt, why: "増えた分でなく、基準の抵抗値を割った"},
                            {x: D.dR * D.dt, why: "温度の上がり幅で割るところを掛けた"}]);
      if (!w) return GEN[8](r);
      c = num(r, null, "O", D.per, w);
      return {form: f, text: q + "温度が 1 ℃ 上がるごとに、抵抗値は何 Ω 増えるか。", fig: u6s8fig(L), ch: c.ch, ans: c.ans,
              ex: [ex1, ex2], chk: {form: f, p: {t1: D.t1, t2: D.t2, R1: D.R1, R2: D.R2}}};
    }
    if (f === "u6s8alpha") {
      w = u6s8three(D.al, [{x: D.per, why: "1 ℃ あたり増える抵抗値のまま（基準の抵抗値で割っていない）"},
                           {x: D.dR / D.R1, why: "増えた抵抗値を基準の抵抗値で割っただけ（1 ℃ あたりにしていない）"},
                           {x: D.per / D.R2, why: "上がった後の抵抗値で割った（基準は " + D.t1 + " ℃ の抵抗値）"},
                           {x: D.dR, why: "増えた抵抗値そのもの"}], true);
      if (!w) return GEN[8](r);
      c = choices(r, [{t: "$" + u6s8fa(D.al) + "$", v: u6s8fa(D.al)}].concat(w.map(function(z){ return {t: "$" + u6s8fa(z.x) + "$", v: u6s8fa(z.x), why: z.why}; })));
      return {form: f, text: q + D.t1 + " ℃ を基準にした抵抗温度係数 $\\alpha_{" + D.t1 + "}$ はいくつか。", fig: u6s8fig(L), ch: c.ch, ans: c.ans,
              ex: [ex1, ex2, "基準の $R_{" + D.t1 + "}$ で割る　$\\alpha_{" + D.t1 + "} = \\dfrac{" + fmt(D.per) + "}{" + fmt(D.R1) + "} = " + u6s8fa(D.al) + "$"],
              chk: {form: f, p: {t1: D.t1, t2: D.t2, R1: D.R1, R2: D.R2}}};
    }
    // u6s8inc：α と基準の抵抗値から、1 ℃ あたり増える抵抗値＝α × 基準の抵抗値
    w = u6s8three(D.per, [{x: D.R1 * (1 + D.al), why: "1 ℃ 上がった後の抵抗値を答えた（増えた分だけを聞いている）"},
                          {x: D.R1 / D.al, why: "割合を掛けるところを割った"},
                          {x: D.R1, why: "基準の抵抗値そのもの"},
                          {x: D.per * D.t1, why: "基準の温度を掛けた"}]);
    if (!w) return GEN[8](r);
    c = num(r, null, "O", D.per, w);
    return {form: f, text: "抵抗温度係数が $\\alpha_{" + D.t1 + "} = " + u6s8fa(D.al) + "$ の抵抗がある。この抵抗の抵抗値は、" + D.t1 + " ℃ で $R_{" + D.t1 + "} = "
                  + qv(D.R1, "O") + "$ である。" + D.t1 + " ℃ から温度が 1 ℃ 上がると、抵抗値は何 Ω 増えるか。",
            fig: u6s8fig({t1: u6s8tc(D.t1), r1: "{R}_" + D.t1 + "=" + qf(D.R1, "O"), al: "{α}_" + D.t1 + "=" + u6s8fa(D.al)}), ch: c.ch, ans: c.ans,
            ex: ["$\\alpha_{" + D.t1 + "}$ は、$R_{" + D.t1 + "}$ に対して 1 ℃ で増える割合",
                 "$" + u6s8fa(D.al) + " \\times " + fmt(D.R1) + " = " + qv(D.per, "O") + "$"],
            chk: {form: f, p: {t1: D.t1, al: u6s8fa(D.al), R1: D.R1}}};
  },
  // 6-9 温度が変わった後の抵抗
  9: function(r){
    var f = pick(r, ["u6s9law", "u6s9after", "u6s9after", "u6s9after", "u6s9base", "u6s9base", "u6s9base", "u6s9neg", "u6s9negv", "u6s9negv"]);
    var D, w, c, ex;
    if (f === "u6s9law") {
      do { D = u6s9data(r, false); } while (D.t1 === 0 || D.dt === D.t1);
      var A = "\\alpha_{" + D.t1 + "}";
      return rule6(r, "抵抗温度係数 $" + A + "$ の抵抗の、" + D.t1 + " ℃ での抵抗値を $R_{" + D.t1 + "}$ とする。" + D.t2 + " ℃ での抵抗値は "
                    + "$R_{" + D.t2 + "} = R_{" + D.t1 + "}(1 + \\square)$ である。",
        u6s9fig({t1: u6s9tc(D.t1), t2: u6s9tc(D.t2), r1: "{R}_" + D.t1, r2: "{R}_" + D.t2}),
        [["$" + A + " \\times " + D.dt + "$", "d"],
         ["$" + A + "$", "a", "上がった温度を掛けていない（α は 1 ℃ あたりの割合）"],
         ["$" + A + " \\times " + D.t2 + "$", "t2", "後の温度をそのまま掛けた（掛けるのは上がった温度）"],
         ["$" + A + " \\times " + D.t1 + "$", "t1", "基準の温度を掛けた（掛けるのは上がった温度）"]],
        u6s9ex(D), f);
    }
    if (f === "u6s9neg") {
      D = u6s9data(r, true);
      return rule6(r, "抵抗温度係数が負の数の抵抗は、温度が上がると抵抗値が □ 。",
        u6s9fig({neg: 1, t1: u6s9tc(D.t1), t2: u6s9tc(D.t2), r1: "{R}_" + D.t1, r2: "{R}_" + D.t2, al: "{α}_" + D.t1 + "=" + u6s9fa(D.al)}),
        [["下がる", "dec"],
         ["上がる", "inc", "温度が上がると抵抗値が上がるのは、抵抗温度係数が正の数の時"],
         ["変わらない", "same", "抵抗温度係数が 0 でなければ、温度で抵抗値は変わる"],
         ["急に 0 になる", "zero", "抵抗値が急に 0 になるのは、とても冷やした時（超電導）"]],
        ["1 ＋ α × 上がった温度 が 1 より小さくなる", "温度が上がると抵抗値は下がる"], f);
    }
    var neg = f === "u6s9negv";
    D = u6s9data(r, neg);
    var a = u6s9fa(D.al), A2 = "\\alpha_{" + D.t1 + "} = " + a;
    var ftxt = "1 + " + (neg ? "(" + a + ")" : a) + " \\times " + D.dt;
    var m = r36(1 + D.al * D.dt);
    if (f === "u6s9after" || neg) {
      w = u6s9three(D.R2, neg ?
            [{x: D.R1 * (1 - D.k), why: "負の符号を落とした（α が負なら、温度が上がると抵抗値は下がる）"},
             {x: D.R1, why: "抵抗値が温度で変わらないと考えた"},
             {x: -D.R1 * D.k, why: "変わった分だけを答えた"},
             {x: D.R1 * (1 + D.al), why: "上がった温度を掛けていない"}] :
            [{x: D.R1 * (1 + D.al), why: "上がった温度を掛けていない（α は 1 ℃ あたりの割合）"},
             {x: D.R1 * D.k, why: "増えた分だけを答えた（1 を足していない）"},
             {x: D.R1 * (1 + D.al * D.t2), why: "後の温度をそのまま掛けた（掛けるのは上がった温度）"},
             {x: D.R1 * (1 - D.k), why: "増える割合を引いた"}]);
      if (!w) return GEN[9](r);
      c = num(r, null, "O", D.R2, w);
      ex = u6s9ex(D).concat(["$R_{" + D.t2 + "} = " + fmt(D.R1) + " \\times (" + ftxt + ") = " + fmt(D.R1) + " \\times " + fmt(m) + " = " + qv(D.R2, "O") + "$"]);
      return {form: f, text: "抵抗温度係数が $" + A2 + "$ の抵抗がある。この抵抗の抵抗値は、" + D.t1 + " ℃ で $R_{" + D.t1 + "} = " + qv(D.R1, "O") + "$ である。"
                    + D.t2 + " ℃ での抵抗値 $R_{" + D.t2 + "}$ は何 Ω か。",
              fig: u6s9fig({neg: neg ? 1 : 0, t1: u6s9tc(D.t1), t2: u6s9tc(D.t2), r1: "{R}_" + D.t1 + "=" + qf(D.R1, "O"), r2: "{R}_" + D.t2,
                            al: "{α}_" + D.t1 + "=" + a}), ch: c.ch, ans: c.ans, ex: ex,
              chk: {form: f, p: {t1: D.t1, t2: D.t2, al: a, R1: D.R1}}};
    }
    // u6s9base：後の抵抗値から基準の抵抗値（同じ式を立てて割る）
    w = u6s9three(D.R1, [{x: D.R2 * (1 + D.k), why: "割るところを掛けた（" + D.t2 + " ℃ の抵抗値を基準にした）"},
                         {x: D.R2 * (1 - D.k), why: "割らずに、増える割合の分を引いた"},
                         {x: D.R2, why: "抵抗値が温度で変わらないと考えた"},
                         {x: D.R2 / (1 + D.al), why: "上がった温度を掛けていない"}]);
    if (!w) return GEN[9](r);
    c = num(r, null, "O", D.R1, w);
    ex = u6s9ex(D).concat(["$" + fmt(D.R2) + " = R_{" + D.t1 + "} \\times (" + ftxt + ") = " + fmt(m) + " R_{" + D.t1 + "}$",
                           "$R_{" + D.t1 + "} = \\dfrac{" + fmt(D.R2) + "}{" + fmt(m) + "} = " + qv(D.R1, "O") + "$"]);
    return {form: f, text: "抵抗温度係数が $" + A2 + "$ の抵抗がある。この抵抗の抵抗値は、" + D.t2 + " ℃ で $R_{" + D.t2 + "} = " + qv(D.R2, "O") + "$ であった。"
                  + D.t1 + " ℃ での抵抗値 $R_{" + D.t1 + "}$ は何 Ω か。",
            fig: u6s9fig({t1: u6s9tc(D.t1), t2: u6s9tc(D.t2), r1: "{R}_" + D.t1, r2: "{R}_" + D.t2 + "=" + qf(D.R2, "O"), al: "{α}_" + D.t1 + "=" + a}),
            ch: c.ch, ans: c.ans, ex: ex,
            chk: {form: f, p: {t1: D.t1, t2: D.t2, al: a, R2: D.R2}}};
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t6s1e","scene":"t6s1e","kind":"u6s1cyl","lab":{"r":["{R}","{R}=10 Ω"],"rho":["{ρ}","{ρ}=0.5 Ω·m"],"l":["{l}","{l}=4 m"],"S":["{S}","{S}=0.2 m²"]},"viewbox":"464 270 595 330","band":{"want":"抵抗の値を決める物","ans":"$R = \\rho \\dfrac{l}{S}$","full":"抵抗の値は、物質・形・温度で変わる。円柱の抵抗では、抵抗率に長さを掛け、断面積で割った物が抵抗になる。抵抗率は物質で決まる。"},"narr":{"start":{"u6s1cd":0,"rv":0,"rhov":0,"u6s1clv":0,"u6s1csv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①抵抗が変わる物\n②抵抗率の式\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗の値は、〖物質・形・温度で変わります〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["cyl","rho"]},{"text":"ここでは、抵抗を円柱の形と考えます。","at":{"強調":1.0},"after":[],"emph":["cyl","R"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"円柱の長さを $l$、輪切りにした面の面積を断面積 $S$ とします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["l","S"],"move":"dim"},{"text":"抵抗 $R$ は、〖抵抗率 $\\rho$ に長さ $l$ を掛け、断面積 $S$ で割った物〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R","rho","l","S"],"eq":[{"cont":false,"items":[["R = \\rho \\dfrac{l}{S}"]]}],"emphPre":["R","rho","l","S"]},{"text":"抵抗率 $\\rho$ は〖物質で決まる値〗で、物質が違うと値も違います。","at":{"強調":1.0},"after":[],"emph":["rho"]},{"text":"長さ $l$ の単位は $\\mathrm{m}$、断面積 $S$ の単位は $\\mathrm{m}^2$ です。","at":{"強調":1.0},"after":[],"emph":["l","S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\rho = 0.5\\,\\Omega \\cdot \\mathrm{m}$、$l = 4\\,\\mathrm{m}$、$S = 0.2\\,\\mathrm{m}^2$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["rho","l","S"],"move":"vals"},{"text":"式に数字を入れると、抵抗 $R$ は $10\\,\\Omega$ です。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R","rho","l","S"],"eq":[{"cont":false,"items":[["R = 0.5 \\times \\dfrac{4}{0.2} = 10\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["R","rho","l","S"]}]}],"groups":{"cyl":["u6s1c:a","u6s1c:b","u6s1c:t","u6s1c:u"],"R":["u6s1rt0","u6s1rt1"],"rho":["u6s1pt0","u6s1pt1"],"l":["u6s1cd:e","u6s1cd:f","u6s1cd:a","u6s1clt0","u6s1clt1"],"S":["u6s1c:a","u6s1cst0","u6s1cst1"]},"moves":{"dim":{"to":{"u6s1cd":1},"dur":0.8},"vals":{"to":{"rhov":1,"u6s1clv":1,"u6s1csv":1},"dur":0.6},"rval":{"to":{"rv":1},"dur":0.4}},"route":["抵抗が変わる物","抵抗率の式","数字で見る"]}},{"id":"t6s1x","scene":"t6s1x","kind":"u6s1cyl","lab":{"r":["{R}","{R}=15 Ω"],"rho":"{ρ}=0.5 Ω·m","l":"{l}=6 m","S":"{S}=0.2 m²"},"viewbox":"464 270 595 330","band":{"want":"円柱の抵抗 $R$","known":"$\\rho = 0.5\\,\\Omega \\cdot \\mathrm{m},\\;\\; l = 6\\,\\mathrm{m},\\;\\; S = 0.2\\,\\mathrm{m}^2$","ans":"$R = 15\\,\\Omega$"},"narr":{"start":{"rv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、円柱の抵抗 $R$ です。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"①抵抗率の式\n②数字を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗は、〖抵抗率に長さを掛け、断面積で割った物〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","rho","l","S"],"eq":[{"cont":false,"items":[["R = \\rho \\dfrac{l}{S}"]]}],"emphPre":["R","rho","l","S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"数字を入れると、$R$ が出ます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R","rho","l","S"],"eq":[{"cont":false,"items":[["R = 0.5 \\times \\dfrac{6}{0.2}"],["R = 15\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["R","rho","l","S"]}]}],"groups":{"cyl":["u6s1c:a","u6s1c:b","u6s1c:t","u6s1c:u"],"R":["u6s1rt0","u6s1rt1"],"rho":["u6s1pt0","u6s1pt1"],"l":["u6s1cd:e","u6s1cd:f","u6s1cd:a","u6s1clt0","u6s1clt1"],"S":["u6s1c:a","u6s1cst0","u6s1cst1"]},"moves":{"rval":{"to":{"rv":1},"dur":0.4}},"route":["抵抗率の式","数字を入れる"]}},{"id":"t6s2e","scene":"t6s2e","kind":"u6s2cyl","lab":{"r":["{R}","Ω"],"rho":["{ρ}","Ω·m"],"l":["{l}","m"],"S":["{S}","m²"]},"viewbox":"464 270 595 330","band":{"want":"抵抗率 $\\rho$ の単位","ans":"$\\Omega \\cdot \\mathrm{m}$","full":"式の量を単位に置き換えて約分すると、分からない量の単位が出る。R = ρ l / S から、抵抗率の単位は Ω と m を掛けた Ω·m。"},"narr":{"start":{"rv":0,"rhov":0,"u6s2clv":0,"u6s2csv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①単位に置き換える\n②約分する\n③両辺に掛ける\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗率 $\\rho$ の単位を、$R = \\rho \\dfrac{l}{S}$ から出してみます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","rho","l","S"],"eq":[{"cont":false,"items":[["R = \\rho \\dfrac{l}{S}"]]}],"emphPre":["R","rho","l","S"]},{"text":"〖$R$ は $\\Omega$、$l$ は $\\mathrm{m}$、$S$ は $\\mathrm{m}^2$ に置き換え〗、単位の分からない $\\rho$ はそのまま置きます。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R","l","S","rho"],"move":"units","eq":[{"cont":false,"items":[["\\Omega = \\rho \\times \\dfrac{\\mathrm{m}}{\\mathrm{m}^2}"]]}],"emphPre":["R","l","S","rho"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"上と下にある $\\mathrm{m}$ を約分します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["l","S"],"eq":[{"cont":false,"items":[["\\Omega = \\rho \\times \\dfrac{1}{\\mathrm{m}}"]]}],"emphPre":["l","S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"両辺に $\\mathrm{m}$ を掛けると、右辺の $\\mathrm{m}$ が消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["rho","R"],"eq":[{"cont":false,"items":[["\\Omega \\cdot \\mathrm{m} = \\rho"]]}],"emphPre":["rho","R"]},{"text":"抵抗率の単位は、〖$\\Omega$ と $\\mathrm{m}$ を掛けた $\\Omega \\cdot \\mathrm{m}$〗です。","at":{"動き":1.0,"答え":1.0,"強調":1.0},"after":[],"move":"rhou","ans":true,"emph":["rho"]},{"text":"ほかの式でも、〖同じやり方で単位を出せます〗。","at":{},"after":[]}]}],"groups":{"cyl":["u6s2c:a","u6s2c:b","u6s2c:t","u6s2c:u"],"R":["u6s2rt0","u6s2rt1"],"rho":["u6s2pt0","u6s2pt1"],"l":["u6s2cd:e","u6s2cd:f","u6s2cd:a","u6s2clt0","u6s2clt1"],"S":["u6s2c:a","u6s2cst0","u6s2cst1"]},"moves":{"units":{"to":{"rv":1,"u6s2clv":1,"u6s2csv":1},"dur":0.6},"rhou":{"to":{"rhov":1},"dur":0.4}},"route":["単位に置き換える","約分する","両辺に掛ける"]}},{"id":"t6s2x","scene":"t6s2x","kind":"u6s2cyl","lab":{"r":["{R}","Ω"],"rho":["{ρ}","Ω·m"],"l":["{l}","m"],"S":["{S}","m²"]},"viewbox":"464 270 595 330","band":{"want":"断面積 $S$ の単位","known":"$S = \\rho \\dfrac{l}{R}$","ans":"$\\mathrm{m}^2$"},"narr":{"start":{"rv":0,"rhov":0,"u6s2clv":0,"u6s2csv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、式の右辺から出る断面積 $S$ の単位です。","at":{"強調":1.0},"after":[],"emph":["S"]},{"text":"①単位に置き換える\n②約分する\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"〖右辺の $\\rho$ を $\\Omega \\cdot \\mathrm{m}$、$l$ を $\\mathrm{m}$、$R$ を $\\Omega$ に置き換えます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["rho","l","R","S"],"eq":[{"cont":false,"items":[["S = \\rho \\dfrac{l}{R}"],["\\dfrac{\\Omega \\cdot \\mathrm{m} \\times \\mathrm{m}}{\\Omega}"]]}],"move":"units","emphPre":["rho","l","R","S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"上と下にある $\\Omega$ を約分すると、〖$\\mathrm{m}$ が2つ残ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["S","rho","l","R"],"eq":[{"cont":false,"items":[["\\mathrm{m} \\times \\mathrm{m} = \\mathrm{m}^2"]]}],"move":"sval","ans":true,"emphPre":["rho","l","R","S"]}]}],"groups":{"cyl":["u6s2c:a","u6s2c:b","u6s2c:t","u6s2c:u"],"R":["u6s2rt0","u6s2rt1"],"rho":["u6s2pt0","u6s2pt1"],"l":["u6s2cd:e","u6s2cd:f","u6s2cd:a","u6s2clt0","u6s2clt1"],"S":["u6s2c:a","u6s2cst0","u6s2cst1"]},"moves":{"units":{"to":{"rv":1,"rhov":1,"u6s2clv":1},"dur":0.6},"sval":{"to":{"u6s2csv":1},"dur":0.4}},"route":["単位に置き換える","約分する"]}},{"id":"t6s3e","scene":"t6s3e","kind":"u6s3two","lab":{"r1":["{R}","{R}_1=12 Ω"],"l1":"{l}","S1":"{S}","r2":["{R}","2{R}","½{R}","{R}_2","{R}_2=18 Ω"],"l2":["{l}","2{l}","{l}","3{l}","3{l}"],"S2":["{S}","{S}","2{S}","2{S}","2{S}"]},"viewbox":"464 250 595 480","band":{"want":"長さ・断面積を変えた時の抵抗","ans":"長さ2倍→抵抗2倍、断面積2倍→抵抗 $\\dfrac{1}{2}$ 倍","full":"抵抗は長さに比例し、断面積に反比例する。長い道は電流が通りにくく、広い道は通りやすい。"},"narr":{"start":{"g":0,"lk":1,"sk":1,"r1v":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①長さ\n②断面積\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗は $R = \\rho \\dfrac{l}{S}$ なので、〖長さ $l$ に比例します〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["tr","tl","tS","br","bS"],"eq":[{"cont":false,"items":[["R = \\rho \\dfrac{l}{S}"]]}],"emphPre":["tr","tl","tS","br","bS"]},{"text":"下の抵抗の長さを2倍にすると、抵抗も2倍です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["bl","br"],"move":"len"},{"text":"長い道ほど、電流は通りにくくなります。","at":{"強調":1.0},"after":[],"emph":["bl","bot"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"長さを元に戻し、断面積を2倍にします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["bS"],"move":"area"},{"text":"抵抗は〖断面積 $S$ に反比例する〗ので、$\\dfrac{1}{2}$ 倍です。","at":{"強調":1.0},"after":[],"emph":["bS","br","tS"]},{"text":"広い道ほど、電流は通りやすくなります。","at":{"強調":1.0},"after":[],"emph":["bS","bot"]},{"text":"断面積が2倍でも、〖抵抗は2倍にはなりません〗。","at":{"強調":1.0},"after":[],"emph":["bS","br"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"上の抵抗を $R_1 = 12\\,\\Omega$ とし、下は長さを3倍、断面積を2倍にします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["tr","bl","bS"],"move":"num"},{"text":"長さで3倍、断面積で $\\dfrac{1}{2}$ 倍になるので、下の抵抗 $R_2$ が出ます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["tr","bl","bS","br"],"eq":[{"cont":false,"items":[["R_2 = 12 \\times 3 \\times \\dfrac{1}{2} = 18\\,\\Omega"]]}],"move":"r2val","ans":true,"emphPre":["tr","bl","bS","br"]}]}],"groups":{"top":["u6s3a:a","u6s3a:b","u6s3a:t","u6s3a:u"],"tr":["u6s3rat0","u6s3rat1"],"tl":["u6s3ad:e","u6s3ad:f","u6s3ad:a","u6s3alt0","u6s3alt1"],"tS":["u6s3a:a","u6s3ast0","u6s3ast1"],"bot":["u6s3b:a","u6s3b:b","u6s3b:t","u6s3b:u"],"br":["u6s3rbt0","u6s3rbt1"],"bl":["u6s3bd:e","u6s3bd:f","u6s3bd:a","u6s3blt0","u6s3blt1","u6s3b:t","u6s3b:u"],"bS":["u6s3b:a","u6s3bst0","u6s3bst1"]},"moves":{"len":{"to":{"g":1,"lk":2},"dur":0.8},"area":{"to":{"g":2,"lk":1,"sk":2},"dur":0.8},"num":{"to":{"g":3,"lk":3,"sk":2,"r1v":1},"dur":0.8},"r2val":{"to":{"g":4},"dur":0.4}},"route":["長さ","断面積","数字で見る"]}},{"id":"t6s3x","scene":"t6s3x","kind":"u6s3two","lab":{"r1":"{R}_1=20 Ω","l1":"{l}","S1":"{S}","r2":["{R}_2","{R}_2=5 Ω"],"l2":"½{l}","S2":"2{S}","lk":0.5,"sk":2},"viewbox":"464 250 595 480","band":{"want":"下の抵抗 $R_2$","known":"$R_1 = 20\\,\\Omega$、長さ $\\dfrac{1}{2}$ 倍、断面積2倍","ans":"$R_2 = 5\\,\\Omega$"},"narr":{"start":{"g":0,"lk":0.5,"sk":2},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、長さと断面積を変えた下の抵抗 $R_2$ です。","at":{"強調":1.0},"after":[],"emph":["br"]},{"text":"①長さで何倍か\n②断面積で何倍か\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["br"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"長さが $\\dfrac{1}{2}$ 倍なので、〖抵抗も $\\dfrac{1}{2}$ 倍です〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["tr","bl"],"eq":[{"cont":false,"items":[["20 \\times \\dfrac{1}{2} = 10\\,\\Omega"]]}],"emphPre":["tr","bl"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"断面積が2倍なので、〖抵抗はさらに $\\dfrac{1}{2}$ 倍です〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["bS","br","tr"],"eq":[{"cont":false,"items":[["R_2 = 10 \\times \\dfrac{1}{2} = 5\\,\\Omega"]]}],"move":"r2val","ans":true,"emphPre":["bS","br"]}]}],"groups":{"top":["u6s3a:a","u6s3a:b","u6s3a:t","u6s3a:u"],"tr":["u6s3rat0","u6s3rat1"],"tl":["u6s3ad:e","u6s3ad:f","u6s3ad:a","u6s3alt0","u6s3alt1"],"tS":["u6s3a:a","u6s3ast0","u6s3ast1"],"bot":["u6s3b:a","u6s3b:b","u6s3b:t","u6s3b:u"],"br":["u6s3rbt0","u6s3rbt1"],"bl":["u6s3bd:e","u6s3bd:f","u6s3bd:a","u6s3blt0","u6s3blt1","u6s3b:t","u6s3b:u"],"bS":["u6s3b:a","u6s3bst0","u6s3bst1"]},"moves":{"r2val":{"to":{"g":1},"dur":0.4}},"route":["長さで何倍か","断面積で何倍か"]}},{"id":"t6s4e","scene":"t6s4e","kind":"u6s4e","lab":{"pm":1,"src":"{V}=12 V","f":0.6666666666666666,"sh":1,"r":"{R}=30 Ω","r1":"{R}_1=20 Ω","r2":"{R}_2=10 Ω","l":"6 m","l1":"4 m","l2":"2 m","i":["{I}","{I}=1.2 A"]},"viewbox":"464 232 595 400","band":{"want":"1本の抵抗を分けた時の抵抗と、途中を短絡した時の電流","ans":"長さの比で分ける　短絡した部分は通らない","full":"抵抗は長さに比例するので、1本の抵抗は長さの比で分けられる。途中を短絡したら、分けた抵抗と短絡した線を回路図に描き直し、電流の通る所だけで解く。"},"narr":{"start":{"co":1,"cv":0,"ro":1,"rko":0,"sh":0,"t":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①長さの比で分ける\n②回路図に描き直す\n③電流の通る所で解く\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"長さ $6\\,\\mathrm{m}$、$R = 30\\,\\Omega$ の1本の抵抗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R","L"]},{"text":"抵抗は長さに比例するので、$4\\,\\mathrm{m}$ と $2\\,\\mathrm{m}$ に分けると、〖抵抗も $4 : 2$ に分かれます〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R2","L1","L2"],"eq":[{"cont":false,"items":[["R_1 = 30 \\times \\dfrac{4}{6} = 20\\,\\Omega"],["R_2 = 30 \\times \\dfrac{2}{6} = 10\\,\\Omega"]]}],"move":"cut","emphPre":["R","L"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"左の $4\\,\\mathrm{m}$ の両端を、〖抵抗を挟まずに線でつなぎます〗。短絡です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["S","R1","L1"],"move":"short"},{"text":"分けた2つの抵抗と短絡した線を、回路図に描き直します。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","S"],"move":"toser"}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$R_1$ の両端は短絡した線でつながっているので、〖電流は $R_1$ を通りません〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R1","S","ZH"],"zb":true},{"text":"電流が通るのは $R_2$ だけなので、$V$ を $R_2$ で割ります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R2","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R_2} = \\dfrac{12}{10} = 1.2\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["R2","src","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"L":["u6s4dl:e","u6s4dl:f","u6s4dl:a","u6s4dlt0"],"L1":["u6s4d1:e","u6s4d1:f","u6s4d1:a","u6s4d1t0"],"L2":["u6s4d2:e","u6s4d2:f","u6s4d2:a","u6s4d2t0"],"S":["u6s4bs","u6s4bs0","u6s4bs1","u6s4ss","u6s4ss0","u6s4ss1"],"ZH":["zbu6s4bh","zbu6s4sh","zbu6s4bs"],"ZL":["zbu6s4bl","zbu6s4sl","zbu6s4bs"]},"moves":{"cut":{"to":{"cv":1,"ro":0,"rko":1},"dur":0.8},"short":{"to":{"sh":1},"dur":0.8},"toser":{"to":{"t":1},"dur":1.0},"ival":{"to":{"iv":1},"dur":0.4}},"route":["長さの比で分ける","回路図に描き直す","電流の通る所で解く"]}},{"id":"t6s4x","scene":"t6s4x","kind":"u6s4e","lab":{"pm":1,"src":"{V}=30 V","f":0.375,"sh":2,"r":"{R}=40 Ω","r1":"{R}_1=15 Ω","r2":"{R}_2=25 Ω","l1":"3 m","l2":"5 m","i":["{I}","{I}=2 A"]},"viewbox":"464 232 595 400","band":{"want":"流れる電流 $I$","known":"$R = 40\\,\\Omega,\\;\\; V = 30\\,\\mathrm{V}$","ans":"$I = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"ro":1,"rko":0,"t":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、流れる電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①長さの比で分ける\n②回路図に描き直す\n③電流を求める\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗は長さに比例するので、$R = 40\\,\\Omega$ を〖長さの比 $3 : 5$ に分けます〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R1","R2","L1","L2"],"eq":[{"cont":false,"items":[["R_1 = 40 \\times \\dfrac{3}{8} = 15\\,\\Omega"],["R_2 = 40 \\times \\dfrac{5}{8} = 25\\,\\Omega"]]}],"move":"rval","emphPre":["R","L1","L2"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"分けた2つの抵抗と短絡した線を、回路図に描き直します。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["R1","R2","S"],"move":"toser"}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$R_2$ の両端は短絡した線でつながっているので、〖電流は $R_2$ を通りません〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R2","S","ZL"],"zb":true},{"text":"電流が通るのは $R_1$ だけなので、$V$ を $R_1$ で割ります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R1","src","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R_1} = \\dfrac{30}{15} = 2\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["R1","src","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"L":["u6s4dl:e","u6s4dl:f","u6s4dl:a","u6s4dlt0"],"L1":["u6s4d1:e","u6s4d1:f","u6s4d1:a","u6s4d1t0"],"L2":["u6s4d2:e","u6s4d2:f","u6s4d2:a","u6s4d2t0"],"S":["u6s4bs","u6s4bs0","u6s4bs1","u6s4ss","u6s4ss0","u6s4ss1"],"ZH":["zbu6s4bh","zbu6s4sh","zbu6s4bs"],"ZL":["zbu6s4bl","zbu6s4sl","zbu6s4bs"]},"moves":{"rval":{"to":{"ro":0,"rko":1},"dur":0.6},"toser":{"to":{"t":1},"dur":1.0},"ival":{"to":{"iv":1},"dur":0.4}},"route":["長さの比で分ける","回路図に描き直す","電流を求める"]}},{"id":"t6s5e","scene":"t6s5e","kind":"u6s5res","lab":{"r":["{R}","{R}=4 Ω"],"g":["{G}","{G}=0.25 S"]},"viewbox":"464 232 595 400","band":{"want":"コンダクタンス $G$ とその単位","ans":"$G = \\dfrac{1}{R}$　単位は $\\mathrm{S}$（ジーメンス）","full":"抵抗 R の逆数をコンダクタンス G という。単位は S（ジーメンス）。S は Ω の逆数と同じ単位。"},"narr":{"start":{"rv":0,"gv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①コンダクタンスとは\n②単位\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"〖抵抗 $R$ の逆数を、コンダクタンスといいます〗。記号は $G$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","G"],"eq":[{"cont":false,"items":[["G = \\dfrac{1}{R}"]]}],"emphPre":["R","G"]},{"text":"$R$ が大きいほど $G$ は小さく、$R$ が小さいほど $G$ は大きくなります。","at":{"強調":1.0},"after":[],"emph":["R","G"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"コンダクタンスの単位は〖$\\mathrm{S}$ で、ジーメンスと読みます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["G"]},{"text":"単位だけで式を書くと、〖$\\Omega$ の逆数が $\\mathrm{S}$〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["G","R"],"eq":[{"cont":false,"items":[["\\mathrm{S} = \\dfrac{1}{\\Omega} = \\Omega^{-1}"]]}],"emphPre":["G","R"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$R = 4\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R"],"move":"rval"},{"text":"$G$ は $R$ の逆数です。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R","G"],"eq":[{"cont":false,"items":[["G = \\dfrac{1}{4} = 0.25\\,\\mathrm{S}"]]}],"move":"gval","ans":true,"emphPre":["R","G"]}]}],"groups":{"R":["r","rt0","rt1"],"G":["gt0","gt1"]},"moves":{"rval":{"to":{"rv":1},"dur":0.4},"gval":{"to":{"gv":1},"dur":0.4}},"route":["コンダクタンスとは","単位","数字で見る"]}},{"id":"t6s5x","scene":"t6s5x","kind":"u6s5res","lab":{"r":"{R}=20 Ω","g":["{G}","{G}=0.05 S"]},"viewbox":"464 232 595 400","band":{"want":"コンダクタンス $G$","known":"$R = 20\\,\\Omega$","ans":"$G = 0.05\\,\\mathrm{S}$"},"narr":{"start":{"gv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、コンダクタンス $G$ です。","at":{"強調":1.0},"after":[],"emph":["G"]},{"text":"①コンダクタンスの式\n②数字を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["G"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$G$ は〖抵抗 $R$ の逆数〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R","G"],"eq":[{"cont":false,"items":[["G = \\dfrac{1}{R}"]]}],"emphPre":["R","G"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$R = 20\\,\\Omega$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R","G"],"eq":[{"cont":false,"items":[["G = \\dfrac{1}{20} = 0.05\\,\\mathrm{S}"]]}],"move":"gval","ans":true,"emphPre":["R","G"]}]}],"groups":{"R":["r","rt0","rt1"],"G":["gt0","gt1"]},"moves":{"gval":{"to":{"gv":1},"dur":0.4}},"route":["コンダクタンスの式","数字を入れる"]}},{"id":"t6s6e","scene":"t6s6e","kind":"u6s6cyl","lab":{"rho":["{ρ}","{ρ}=0.5 Ω·m"],"sig":["{σ}","{σ}=2 S/m"]},"viewbox":"464 232 595 400","band":{"want":"導電率 $\\sigma$ とその単位","ans":"$\\sigma = \\dfrac{1}{\\rho}$　単位は $\\mathrm{S/m}$","full":"抵抗率 ρ の逆数を導電率 σ という。単位は S/m（Ω·m の逆数）。導電率が大きいほど電気が流れやすい。"},"narr":{"start":{"u6s6crv":0,"sigv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①導電率とは\n②単位\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"〖抵抗率 $\\rho$ の逆数を、導電率といいます〗。記号は $\\sigma$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["rho","sig"],"eq":[{"cont":false,"items":[["\\sigma = \\dfrac{1}{\\rho}"]]}],"emphPre":["rho","sig"]},{"text":"導電率が大きいほど、〖電気が流れやすい物質〗です。","at":{"強調":1.0},"after":[],"emph":["sig"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗率の単位は $\\Omega \\cdot \\mathrm{m}$ です。その逆数を、分けて書きます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["rho","sig"],"eq":[{"cont":false,"items":[["\\dfrac{1}{\\Omega \\cdot \\mathrm{m}} = \\dfrac{1}{\\Omega} \\times \\dfrac{1}{\\mathrm{m}}"]]}],"emphPre":["rho","sig"]},{"text":"$\\Omega$ の逆数は $\\mathrm{S}$ なので、〖導電率の単位は $\\mathrm{S/m}$〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["sig"],"eq":[{"cont":false,"items":[["\\mathrm{S} \\times \\dfrac{1}{\\mathrm{m}} = \\mathrm{S/m}"]]}],"emphPre":["sig"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\rho = 0.5\\,\\Omega \\cdot \\mathrm{m}$ の物質を考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["rho"],"move":"rval"},{"text":"$\\sigma$ は $\\rho$ の逆数です。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["rho","sig"],"eq":[{"cont":false,"items":[["\\sigma = \\dfrac{1}{0.5} = 2\\,\\mathrm{S/m}"]]}],"move":"sval","ans":true,"emphPre":["rho","sig"]}]}],"groups":{"rho":["u6s6c:a","u6s6c:b","u6s6c:t","u6s6c:u","u6s6crt0","u6s6crt1"],"sig":["u6s6cgt0","u6s6cgt1"]},"moves":{"rval":{"to":{"u6s6crv":1},"dur":0.4},"sval":{"to":{"sigv":1},"dur":0.4}},"route":["導電率とは","単位","数字で見る"]}},{"id":"t6s6x","scene":"t6s6x","kind":"u6s6cyl","lab":{"rho":"{ρ}=0.25 Ω·m","sig":["{σ}","{σ}=4 S/m"]},"viewbox":"464 232 595 400","band":{"want":"導電率 $\\sigma$","known":"$\\rho = 0.25\\,\\Omega \\cdot \\mathrm{m}$","ans":"$\\sigma = 4\\,\\mathrm{S/m}$"},"narr":{"start":{"sigv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、導電率 $\\sigma$ です。","at":{"強調":1.0},"after":[],"emph":["sig"]},{"text":"①導電率の式\n②単位\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["sig"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\sigma$ は〖抵抗率 $\\rho$ の逆数〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["rho","sig"],"eq":[{"cont":false,"items":[["\\sigma = \\dfrac{1}{\\rho}"],["\\sigma = \\dfrac{1}{0.25} = 4"]]}],"emphPre":["rho","sig"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"単位は $\\Omega \\cdot \\mathrm{m}$ の逆数で、〖$\\mathrm{S/m}$〗です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["rho","sig"],"eq":[{"cont":false,"items":[["\\sigma = 4\\,\\mathrm{S/m}"]]}],"move":"sval","ans":true,"emphPre":["rho","sig"]}]}],"groups":{"rho":["u6s6c:a","u6s6c:b","u6s6c:t","u6s6c:u","u6s6crt0","u6s6crt1"],"sig":["u6s6cgt0","u6s6cgt1"]},"moves":{"sval":{"to":{"sigv":1},"dur":0.4}},"route":["導電率の式","単位"]}},{"id":"t6s7e","scene":"t6s7e","kind":"u6s7graph","lab":{"nm":"金属","ns":"超電導","nh":"半導体","sc":1},"viewbox":"464 210 595 450","band":{"want":"温度と抵抗値の関係","ans":"金属は温度が上がると一定の割合で増える／半導体は温度が上がると下がる","full":"金属の抵抗値は、温度が上がると一定の割合で増える。金属をとても冷やすと、ある温度で抵抗値が急に 0 になる（超電導）。半導体は、温度が上がると抵抗値が下がる。"},"narr":{"start":{"mo":0,"so":0,"ho":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①金属\n②とても冷やすと\n③半導体\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"横を温度、縦を抵抗値にしたグラフで見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["ax"]},{"text":"金属の抵抗値は、〖温度が上がると一定の割合で増えます〗。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["M"],"move":"mshow"},{"text":"一定の割合なので、グラフはまっすぐな線になります。","at":{"強調":1.0},"after":[],"emph":["M"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"金属をとても冷やすと、ある温度で抵抗値が急に 0 になります。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["C"],"move":"cshow"},{"text":"これを〖超電導〗といいます。","at":{"強調":1.0},"after":[],"emph":["C"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"半導体は、〖温度が上がると抵抗値が下がります〗。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["H"],"move":"hshow"},{"text":"金属と半導体では、〖温度による抵抗値の変わり方が逆〗です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["M","H"]}]}],"groups":{"ax":["u6s7ax","u6s7ax:h","u6s7axt","u6s7ay","u6s7ay:h","u6s7ayt"],"M":["u6s7m","u6s7mt0","u6s7mt1"],"C":["u6s7c","u6s7ct0","u6s7ct1"],"H":["u6s7h","u6s7ht0","u6s7ht1"]},"moves":{"mshow":{"to":{"mo":1},"dur":0.6},"cshow":{"to":{"so":1},"dur":0.6},"hshow":{"to":{"ho":1},"dur":0.6}},"route":["金属","とても冷やすと","半導体"]}},{"id":"t6s7x","scene":"t6s7x","kind":"u6s7graph","lab":{"nm":"a","nh":"b","sc":1},"viewbox":"464 210 595 450","band":{"want":"半導体を表すグラフ","known":"a と b の2つのグラフ","ans":"b"},"narr":{"start":{},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、半導体を表すグラフです。","at":{"強調":1.0},"after":[],"emph":["M","H"]},{"text":"①金属の線\n②半導体の線\nこの順に見ます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["M","H"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"a は、温度が上がると抵抗値が一定の割合で増えています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["M"]},{"text":"とても冷やすと 0 になる所もあります。a は金属です。","at":{"強調":1.0},"after":[],"emph":["M","C"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"b は、温度が上がると抵抗値が下がっています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["H"]},{"text":"〖温度が上がると抵抗値が下がるのは半導体〗なので、答えは b です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["H"]}]}],"groups":{"ax":["u6s7ax","u6s7ax:h","u6s7axt","u6s7ay","u6s7ay:h","u6s7ayt"],"M":["u6s7m","u6s7mt0","u6s7mt1"],"C":["u6s7c","u6s7ct0","u6s7ct1"],"H":["u6s7h","u6s7ht0","u6s7ht1"]},"moves":{},"route":["金属の線","半導体の線"]}},{"id":"t6s8e","scene":"t6s8e","kind":"u6s8graph","lab":{"t1":"20 ℃","t2":"30 ℃","r1":"{R}_20=40 Ω","r2":"{R}_30=46 Ω","dt":"10 ℃","dr":"6 Ω"},"viewbox":"464 210 595 450","band":{"want":"抵抗温度係数 $\\alpha$","ans":"基準の温度の抵抗値に対して、1 ℃ 上がった時に増える抵抗値の割合","full":"抵抗温度係数 α は、ある温度の抵抗値を基準にして、温度が 1 ℃ 上がった時に増える抵抗値の割合。基準にした温度を添え字で書く（20 ℃ が基準なら α_20）。1 ℃ あたり増える抵抗値を、基準の抵抗値で割って出す。"},"narr":{"start":{"dto":0,"dro":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①抵抗温度係数とは\n②基準の温度\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"金属の抵抗値は、温度が上がると一定の割合で増えます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["ln"]},{"text":"ある温度の抵抗値を基準にして、〖温度が 1 ℃ 上がった時に増える抵抗値の割合〗を、抵抗温度係数といいます。","at":{"強調":1.0},"after":[],"emph":["ln","P1"]},{"text":"記号は $\\alpha$ です。","at":{"強調":1.0},"after":[],"emph":["ln","P1"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗温度係数は、〖必ずある温度の抵抗値を基準にします〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["P1"]},{"text":"基準にした温度は添え字で書きます。20 ℃ が基準なら $\\alpha_{20}$ です。","at":{"強調":1.0},"after":[],"emph":["P1"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"20 ℃ で $R_{20} = 40\\,\\Omega$ の抵抗が、30 ℃ で $R_{30} = 46\\,\\Omega$ になったとします。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["P1","P2"]},{"text":"温度が 10 ℃ 上がって、抵抗値は 6 Ω 増えました。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["DT","DR","P1","P2"],"move":"dtr","eq":[{"cont":false,"items":[["R_{30} - R_{20} = 46 - 40 = 6\\,\\Omega"]]}],"emphPre":["DT","DR","P1","P2"]},{"text":"1 ℃ あたりでは、6 Ω を 10 で割って 0.6 Ω 増えます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["DT","DR"],"eq":[{"cont":false,"items":[["\\dfrac{6}{10} = 0.6\\,\\Omega"]]}],"emphPre":["DT","DR"]},{"text":"これを〖基準の $R_{20}$ で割る〗と、増える割合が出ます。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["P1"],"eq":[{"cont":false,"items":[["\\alpha_{20} = \\dfrac{0.6}{R_{20}} = \\dfrac{0.6}{40} = 0.015"]]}],"ans":true,"emphPre":["P1"]}]}],"groups":{"ln":["u6s8ln"],"P1":["u6s8d1","u6s8g1","u6s8t1t0","u6s8t1t1","u6s8r1t0","u6s8r1t1"],"P2":["u6s8d2","u6s8g2","u6s8t2t0","u6s8t2t1","u6s8r2t0","u6s8r2t1"],"DT":["u6s8dta","u6s8dta:h","u6s8dtb","u6s8dtb:h","u6s8dtt0","u6s8dtt1"],"DR":["u6s8dra","u6s8dra:h","u6s8drb","u6s8drb:h","u6s8drt0","u6s8drt1"]},"moves":{"dtr":{"to":{"dto":1,"dro":1},"dur":0.5}},"route":["抵抗温度係数とは","基準の温度","数字で見る"]}},{"id":"t6s8x","scene":"t6s8x","kind":"u6s8graph","lab":{"t1":"10 ℃","t2":"15 ℃","r1":"{R}_10=80 Ω","r2":"{R}_15=82 Ω","dt":"5 ℃","dr":"2 Ω"},"viewbox":"464 210 595 450","band":{"want":"10 ℃ を基準にした抵抗温度係数 $\\alpha_{10}$","known":"$R_{10} = 80\\,\\Omega,\\;\\; R_{15} = 82\\,\\Omega$","ans":"$\\alpha_{10} = 0.005$"},"narr":{"start":{"dto":0,"dro":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、10 ℃ を基準にした抵抗温度係数 $\\alpha_{10}$ です。","at":{"強調":1.0},"after":[],"emph":["P1"]},{"text":"①1 ℃ あたり増える抵抗値\n②基準の抵抗値で割る\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["P1"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗温度係数は 1 ℃ あたりの割合なので、先に〖1 ℃ あたり増える抵抗値〗を出します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["P1","P2"]},{"text":"5 ℃ 上がって、2 Ω 増えました。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["DT","DR","P1","P2"],"move":"dtr","eq":[{"cont":false,"items":[["R_{15} - R_{10} = 82 - 80 = 2\\,\\Omega"]]}],"emphPre":["DT","DR","P1","P2"]},{"text":"1 ℃ あたりでは 0.4 Ω です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["DT","DR"],"eq":[{"cont":false,"items":[["\\dfrac{2}{5} = 0.4\\,\\Omega"]]}],"emphPre":["DT","DR"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"基準は 10 ℃ なので、〖$R_{10}$ で割ります〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":2,"emph":["P1"],"eq":[{"cont":false,"items":[["\\alpha_{10} = \\dfrac{0.4}{R_{10}}"],["\\alpha_{10} = \\dfrac{0.4}{80} = 0.005"]]}],"ans":true,"emphPre":["P1"]}]}],"groups":{"ln":["u6s8ln"],"P1":["u6s8d1","u6s8g1","u6s8t1t0","u6s8t1t1","u6s8r1t0","u6s8r1t1"],"P2":["u6s8d2","u6s8g2","u6s8t2t0","u6s8t2t1","u6s8r2t0","u6s8r2t1"],"DT":["u6s8dta","u6s8dta:h","u6s8dtb","u6s8dtb:h","u6s8dtt0","u6s8dtt1"],"DR":["u6s8dra","u6s8dra:h","u6s8drb","u6s8drb:h","u6s8drt0","u6s8drt1"]},"moves":{"dtr":{"to":{"dto":1,"dro":1},"dur":0.5}},"route":["1 ℃ あたり増える抵抗値","基準の抵抗値で割る"]}},{"id":"t6s9e","scene":"t6s9e","kind":"u6s9graph","lab":{"t1":"20 ℃","t2":"45 ℃","r1":"{R}_20=50 Ω","r2":["{R}_45","{R}_45=55 Ω"],"al":"{α}_20=0.004","dt":"25 ℃"},"viewbox":"464 210 595 450","band":{"want":"温度が変わった後の抵抗値","ans":"基準の抵抗値 ×（1 ＋ $\\alpha$ × 上がった温度）","full":"温度が変わった後の抵抗値は、基準の抵抗値に（1 ＋ α × 上がった温度）を掛けて出す。1 は基準の抵抗値そのものの分。α は 1 ℃ あたりの割合なので、上がった温度を掛ける。α が負の数なら、温度が上がると抵抗値は下がる。"},"narr":{"start":{"r2v":0,"dto":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"①式の意味\n②数字で見る\n③$\\alpha$ が負の時\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"20 ℃ の抵抗値 $R_{20}$ を基準にして、45 ℃ の抵抗値 $R_{45}$ を出します。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["P1","P2"]},{"text":"上がった温度は 25 ℃ です。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["DT"],"move":"dt","eq":[{"cont":false,"items":[["45 - 20 = 25^\\circ\\mathrm{C}"]]}],"emphPre":["DT"]},{"text":"$\\alpha_{20}$ は 1 ℃ あたりの割合なので、〖上がった温度の 25 を掛けます〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["AL","DT"],"eq":[{"cont":false,"items":[["\\alpha_{20} \\times 25"]]}],"emphPre":["AL","DT"]},{"text":"〖1 を足すのは、基準の抵抗値そのものの分〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["P1","P2","AL","DT"],"eq":[{"cont":false,"items":[["R_{45} = R_{20}(1 + \\alpha_{20} \\times 25)"]]}],"emphPre":["P1","P2","AL","DT"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$R_{20} = 50\\,\\Omega$、$\\alpha_{20} = 0.004$ を入れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["P1","P2","AL"],"eq":[{"cont":false,"items":[["1 + 0.004 \\times 25 = 1.1"],["R_{45} = 50 \\times 1.1 = 55\\,\\Omega"]]}],"move":"r2val","ans":true,"emphPre":["P1","P2","AL"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\alpha$ が負の数の時は、〖温度が上がると抵抗値は下がります〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["AL"]}]}],"groups":{"ln":["u6s9ln"],"P1":["u6s9d1","u6s9g1","u6s9t1t0","u6s9t1t1","u6s9r1t0","u6s9r1t1"],"P2":["u6s9d2","u6s9g2","u6s9t2t0","u6s9t2t1","u6s9r2t0","u6s9r2t1"],"AL":["u6s9alt0","u6s9alt1"],"DT":["u6s9dta","u6s9dta:h","u6s9dtb","u6s9dtb:h","u6s9dtt0","u6s9dtt1"]},"moves":{"dt":{"to":{"dto":1},"dur":0.5},"r2val":{"to":{"r2v":1},"dur":0.4}},"route":["式の意味","数字で見る","$\\alpha$ が負の時"]}},{"id":"t6s9x","scene":"t6s9x","kind":"u6s9graph","lab":{"t1":"20 ℃","t2":"60 ℃","r1":["{R}_20","{R}_20=30 Ω"],"r2":"{R}_60=36 Ω","al":"{α}_20=0.005","dt":"40 ℃"},"viewbox":"464 210 595 450","band":{"want":"20 ℃ の抵抗値 $R_{20}$","known":"$\\alpha_{20} = 0.005,\\;\\; R_{60} = 36\\,\\Omega$","ans":"$R_{20} = 30\\,\\Omega$"},"narr":{"start":{"r1v":0,"dto":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、20 ℃ の抵抗値 $R_{20}$ です。","at":{"強調":1.0},"after":[],"emph":["P1"]},{"text":"①式を立てる\n②$R_{20}$ を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["P1"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\alpha_{20}$ は 20 ℃ が基準なので、〖$R_{20}$ を基準にして式を立てます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["AL","P1"]},{"text":"上がった温度は 40 ℃ です。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["DT"],"move":"dt","eq":[{"cont":false,"items":[["60 - 20 = 40^\\circ\\mathrm{C}"]]}],"emphPre":["DT"]},{"text":"60 ℃ の $R_{60}$ は、〖$R_{20}$ に $1 + \\alpha_{20} \\times 40$ を掛けた値〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["P1","P2","AL","DT"],"eq":[{"cont":false,"items":[["R_{60} = R_{20}(1 + \\alpha_{20} \\times 40)"]]}],"emphPre":["P1","P2","AL","DT"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"数字を入れると、$R_{20}$ の 1.2 倍が 36 Ω です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["P1","P2","AL"],"eq":[{"cont":false,"items":[["36 = R_{20}(1 + 0.005 \\times 40)"],["36 = 1.2 R_{20}"]]}],"emphPre":["P1","P2","AL"]},{"text":"1.2 で割ると、$R_{20}$ が出ます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["P1","P2"],"eq":[{"cont":false,"items":[["R_{20} = \\dfrac{36}{1.2} = 30\\,\\Omega"]]}],"move":"r1val","ans":true,"emphPre":["P1","P2"]}]}],"groups":{"ln":["u6s9ln"],"P1":["u6s9d1","u6s9g1","u6s9t1t0","u6s9t1t1","u6s9r1t0","u6s9r1t1"],"P2":["u6s9d2","u6s9g2","u6s9t2t0","u6s9t2t1","u6s9r2t0","u6s9r2t1"],"AL":["u6s9alt0","u6s9alt1"],"DT":["u6s9dta","u6s9dta:h","u6s9dtb","u6s9dtb:h","u6s9dtt0","u6s9dtt1"]},"moves":{"dt":{"to":{"dto":1},"dur":0.5},"r1val":{"to":{"r1v":1},"dur":0.4}},"route":["式を立てる","$R_{20}$ を出す"]}},{"id":"t6k1x","scene":"t6k1x","kind":"u6k1r2","lab":{"num":1,"qa":"0.99","qb":"0.5","qc":"1.47","qd":"0.78"},"viewbox":"470 150 830 500","band":{"want":"4本の電線の抵抗の大きい順","known":"長さはどれも同じ・$\\rho$ と断面積 $S$ は図の右","ans":"大きい順に C・A・D・B"},"narr":{"start":{"qao":0,"qbo":0,"qco":0,"qdo":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、A・B・C・D の4本の電線の抵抗の大きい順です。","at":{"強調":1.0},"after":[],"emph":["all"]},{"text":"①抵抗率の式\n②$\\rho$ を $S$ で割って比べる\n③大きい順に並べる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["all","S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"抵抗は $R = \\rho \\dfrac{l}{S}$ です。〖抵抗率 $\\rho$ と長さ $l$ に比例し、断面積 $S$ に反比例します〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["all","S"]},{"text":"4本とも長さは同じです。なので、〖$\\rho$ を $S$ で割った値が大きい電線ほど、抵抗は大きくなります〗。","at":{"強調":1.0},"after":[],"emph":["rho","S"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\rho$ にはどれも 10 の $-8$ 乗、$S$ にはどれも 10 の $-5$ 乗が付いています。4本とも同じなので、〖前の数字だけで比べます〗。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["rho","S"]},{"text":"A は $\\dfrac{8.90}{9}$ で、約 $0.99$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["A"],"move":"qa"},{"text":"B は $\\dfrac{2.50}{5} = 0.5$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["B"],"move":"qb"},{"text":"C は $\\dfrac{1.47}{1} = 1.47$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["C"],"move":"qc"},{"text":"D は $\\dfrac{1.55}{2}$ で、約 $0.78$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["D"],"move":"qd"}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"大きい順に並べると、〖C・A・D・B〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["q"]},{"text":"抵抗の大きい順が C・A・D・B の組は (4) です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["q"]}]}],"groups":{"A":["u6k1a:a","u6k1a:b","u6k1a:t","u6k1a:u","u6k1an","u6k1ar0","u6k1as0","u6k1aq0"],"B":["u6k1b:a","u6k1b:b","u6k1b:t","u6k1b:u","u6k1bn","u6k1br0","u6k1bs0","u6k1bq0"],"C":["u6k1c:a","u6k1c:b","u6k1c:t","u6k1c:u","u6k1cn","u6k1cr0","u6k1cs0","u6k1cq0"],"D":["u6k1d:a","u6k1d:b","u6k1d:t","u6k1d:u","u6k1dn","u6k1dr0","u6k1ds0","u6k1dq0"],"all":["u6k1a:a","u6k1a:b","u6k1a:t","u6k1a:u","u6k1an","u6k1b:a","u6k1b:b","u6k1b:t","u6k1b:u","u6k1bn","u6k1c:a","u6k1c:b","u6k1c:t","u6k1c:u","u6k1cn","u6k1d:a","u6k1d:b","u6k1d:t","u6k1d:u","u6k1dn"],"rho":["u6k1hr","u6k1ar0","u6k1br0","u6k1cr0","u6k1dr0"],"S":["u6k1hs","u6k1as0","u6k1bs0","u6k1cs0","u6k1ds0"],"q":["u6k1aq0","u6k1bq0","u6k1cq0","u6k1dq0"]},"moves":{"qa":{"to":{"qao":1},"dur":0.4},"qb":{"to":{"qbo":1},"dur":0.4},"qc":{"to":{"qco":1},"dur":0.4},"qd":{"to":{"qdo":1},"dur":0.4}},"route":["抵抗率の式","$\\rho$ を $S$ で割って比べる","大きい順に並べる"]}},{"id":"t6k2x","scene":"t6k2x","kind":"u6k2r5","lab":{"sw":1,"src":"{V}","r":["{R}_20","{R}_120"],"t":["20 ℃","120 ℃"],"i":["{I}_20","{I}_120"]},"viewbox":"400 230 760 360","band":{"want":"抵抗が 120 ℃ になった時の電流の変わり方","known":"はじめ 20 ℃・$\\alpha = 0.005$・電源の電圧は一定","ans":"約 33 % 減る"},"narr":{"start":{"co":1,"rv":0,"tv":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、抵抗の温度が 20 ℃ から 120 ℃ になった時、電流がどう変わるかです。","at":{"強調":1.0},"after":[],"emph":["R","T","I"]},{"text":"①120 ℃ の抵抗\n②電流の比\n③何 % 変わるか\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R","I"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"スイッチ S を閉じた時、抵抗は 20 ℃ です。この時の抵抗を $R_{20}$ とします。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R","T","S"]},{"text":"温度上昇は $120 - 20 = 100$ ℃ です。","at":{"強調":1.0},"after":[],"emph":["T"]},{"text":"〖温度上昇に $\\alpha = 0.005$ を掛けて 1 を足し、もとの抵抗に掛ける〗と、温度が変わった後の抵抗です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R","T"],"eq":[{"cont":false,"items":[["1 + 0.005 \\times 100 = 1.5"],["R_{120} = 1.5\\,R_{20}"]]}],"move":"hot","emphPre":["R","T"]}]},{"cap":null,"eqp":null,"vid":[1,6],"sents":[{"text":"〖電源の電圧 $V$ は変わりません〗。電流は、電圧を抵抗で割った値です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["src","R","I"],"eq":[{"cont":false,"items":[["I_{20} = \\dfrac{V}{R_{20}}"],["I_{120} = \\dfrac{V}{1.5\\,R_{20}}"]]}],"emphPre":["src","R","I"],"zb":true},{"text":"抵抗が $1.5$ 倍なので、〖電流は $\\dfrac{1}{1.5} = \\dfrac{2}{3}$ 倍〗です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I"],"eq":[{"cont":false,"items":[["I_{120} = \\dfrac{2}{3} I_{20}"]]}],"move":"ival","emphPre":["I"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"$\\dfrac{2}{3}$ 倍は、もとの電流より $\\dfrac{1}{3}$ 減ることです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["I"]},{"text":"$\\dfrac{1}{3}$ は約 33 % です。〖電流は約 33 % 減ります〗。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["I"]}]}],"groups":{"R":["u6k2r","u6k2rt0","u6k2rt1"],"T":["u6k2tt0","u6k2tt1"],"I":["u6k2ia","u6k2ia:h","u6k2it0","u6k2it1"],"src":["u6k2c:L","u6k2c:S","u6k2e0","u6k2e1"],"S":["u6k2sw","u6k2sn"]},"moves":{"hot":{"to":{"rv":1,"tv":1},"dur":0.6},"ival":{"to":{"iv":1},"dur":0.4}},"route":["120 ℃ の抵抗","電流の比","何 % 変わるか"]}},{"id":"t6k3x","scene":"t6k3x","kind":"u6k3h24","lab":{"r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","src":"{E}","i0":"{I}_0","i":"{I}"},"viewbox":"400 180 640 330","band":{"want":"図2の電流 $I$ とコンダクタンス $G$ の式","known":"$I$＝a-b を短絡した時の電流　$G$＝電源を短絡して a-b から見たコンダクタンス","ans":"(2)"},"narr":{"start":{"co":1,"sab":0,"ssrc":0,"i0o":0,"io":0},"steps":[{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"求めるのは、図2の電流 $I$ とコンダクタンス $G$ を、図1の抵抗と電源の電圧で表した式です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","src"]},{"text":"①a-b を短絡した時の電流\n②電源を短絡して a-b から見た合成抵抗\n③逆数で $G$\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["ab","src"]}]},{"cap":null,"eqp":null,"vid":[3,5],"sents":[{"text":"a-b を短絡すると、$R_3$ の右の端が b とつながり、〖$R_2$ と $R_3$ が並列になります〗。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["ab","R2","R3"],"move":"short","zb":true},{"text":"全体の合成抵抗は、$R_1$ に、$R_2$ と $R_3$ の和分の積を足した値です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["R_1 + \\dfrac{R_2 R_3}{R_2 + R_3}"]]}],"emphPre":["R1","R2","R3"]},{"text":"分母をそろえて足します。$R_1$ の分母と分子に $R_2 + R_3$ を掛け、カッコの中のそれぞれに $R_1$ を掛けます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{R_1 R_2 + R_2 R_3 + R_3 R_1}{R_2 + R_3}"]]}],"emphPre":["R1","R2","R3"]},{"text":"電源から出る電流 $I_0$ は、電源の電圧をこの合成抵抗で割った値です。分数で割るので、分母と分子を入れ替えて掛けます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I0","src","R1","R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{(R_2 + R_3) E}{R_1 R_2 + R_2 R_3 + R_3 R_1}"]]}],"emphPre":["I0","src","R1","R2","R3"]},{"text":"$I_0$ は $R_2$ と $R_3$ に分かれます。$R_3$ に流れる分が $I$ で、〖反対側の $R_2$ の割合の分〗です（分流）。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I0","I","R2","R3"],"eq":[{"cont":false,"items":[["I = I_0 \\times \\dfrac{R_2}{R_2 + R_3}"]]}],"move":"ival","emphPre":["I0","I","R2","R3"]},{"text":"$R_2 + R_3$ が約分で消えて、$I$ は次の値です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I","R1","R2","R3","src"],"eq":[{"cont":false,"items":[["\\dfrac{R_2 E}{R_1 R_2 + R_2 R_3 + R_3 R_1}"]]}],"emphPre":["I","R1","R2","R3","src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"次に、a-b の短絡を外し、電源を短絡します。〖電源は1本の線と同じになります〗。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["src","ab"],"move":"src"},{"text":"a-b から見ると、〖$R_1$ と $R_2$ が並列で、そこに $R_3$ が直列〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","ab"],"eq":[{"cont":false,"items":[["R_3 + \\dfrac{R_1 R_2}{R_1 + R_2}"]]}],"emphPre":["R1","R2","R3","ab"]},{"text":"同じように分母をそろえて足します。$R_3$ の分母と分子に $R_1 + R_2$ を掛け、カッコの中のそれぞれに $R_3$ を掛けます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["\\dfrac{R_1 R_2 + R_2 R_3 + R_3 R_1}{R_1 + R_2}"]]}],"emphPre":["R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[6],"sents":[{"text":"コンダクタンスは抵抗の逆数なので、$G$ は分母と分子を入れ替えた値です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["R1","R2","R3","ab"],"eq":[{"cont":false,"items":[["\\dfrac{R_1 + R_2}{R_1 R_2 + R_2 R_3 + R_3 R_1}"]]}],"emphPre":["R1","R2","R3","ab"]},{"text":"$I$ の分子が $R_2$、$G$ の分子が $R_1 + R_2$ の組は (2) です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["R1","R2"]}]}],"groups":{"R1":["u6k3ar1","u6k3ar1t0","u6k3ar1t1"],"R2":["u6k3ar2","u6k3ar2t0","u6k3ar2t1"],"R3":["u6k3ar3","u6k3ar3t0","u6k3ar3t1"],"src":["u6k3c:L","u6k3c:S","u6k3e0","u6k3e1","u6k3csh"],"ab":["u6k3ta","u6k3ta:t","u6k3tb","u6k3tb:t","u6k3ash"],"I0":["u6k3i0a","u6k3i0a:h","u6k3i0t0","u6k3i0t1"],"I":["u6k3ia","u6k3ia:h","u6k3it0","u6k3it1"]},"moves":{"short":{"to":{"sab":1,"i0o":1},"dur":0.8},"ival":{"to":{"io":1},"dur":0.4},"src":{"to":{"sab":0,"ssrc":1,"i0o":0,"io":0},"dur":0.8}},"route":["a-b を短絡した時の電流","電源を短絡して a-b から見た合成抵抗","逆数で $G$"]}}],"secs":[{"ex":{"text":"図のように、抵抗率 $\\rho = 0.5\\,\\Omega \\cdot \\mathrm{m}$ の物質で、長さ $l = 6\\,\\mathrm{m}$、断面積 $S = 0.2\\,\\mathrm{m}^2$ の円柱の抵抗を作った。この抵抗 $R$ は何 Ω か。","fig":{"kind":"u6s1cyl","L":{"r":"{R}","rho":"{ρ}=0.5 Ω·m","l":"{l}=6 m","S":"{S}=0.2 m²"},"P":{}},"ch":[{"t":"$0.6\\,\\Omega$","v":0.6,"why":"断面積で割らずに掛けた"},{"t":"$3\\,\\Omega$","v":3,"why":"断面積で割っていない"},{"t":"$15\\,\\Omega$","v":15,"why":""},{"t":"$30\\,\\Omega$","v":30,"why":"抵抗率 $\\rho$ を掛けていない"}],"ans":2}},{"ex":{"text":"図の円柱の抵抗で、$R = \\rho \\dfrac{l}{S}$ から $S = \\rho \\dfrac{l}{R}$ が出る。右辺の量を単位に置き換えて約分すると、断面積 $S$ の単位は □ になる。","fig":{"kind":"u6s2cyl","L":{"r":"{R}","rho":"{ρ}","l":"{l}","S":"{S}"},"P":{}},"ch":[{"t":"$\\mathrm{m}$","v":"m","why":"$\\mathrm{m}$ が2つ残るのを、1つと数えた"},{"t":"$\\mathrm{m}^2$","v":"m2","why":""},{"t":"$\\Omega \\cdot \\mathrm{m}^2$","v":"Om2","why":"上と下の $\\Omega$ を約分していない"},{"t":"$\\Omega \\cdot \\mathrm{m}$","v":"Om","why":"抵抗率 $\\rho$ の単位をそのまま答えた"}],"ans":1}},{"ex":{"text":"図の上の抵抗は $R_1 = 20\\,\\Omega$ である。同じ物質で、長さを $\\dfrac{1}{2}$ 倍、断面積を2倍にした下の抵抗 $R_2$ は何 Ω か。","fig":{"kind":"u6s3two","L":{"r1":"{R}_1=20 Ω","l1":"{l}","S1":"{S}","r2":"{R}_2","l2":"½{l}","S2":"2{S}","lk":0.5,"sk":2},"P":{}},"ch":[{"t":"$20\\,\\Omega$","v":20,"why":"断面積が2倍で、抵抗も2倍になると考えた"},{"t":"$5\\,\\Omega$","v":5,"why":""},{"t":"$80\\,\\Omega$","v":80,"why":"長さと断面積の何倍を逆にした"},{"t":"$10\\,\\Omega$","v":10,"why":"断面積を変えた分を入れていない"}],"ans":1}},{"ex":{"text":"図のように、長さ $8\\,\\mathrm{m}$、$R = 40\\,\\Omega$ の1本の抵抗を、左の端から $3\\,\\mathrm{m}$ の所で分けた。右の $5\\,\\mathrm{m}$ の部分の両端を、抵抗を挟まずに線でつないだ。電源の電圧は $V = 30\\,\\mathrm{V}$ である。流れる電流 $I$ は何 A か。","fig":{"kind":"u6s4bar","L":{"pm":1,"src":"{V}=30 V","f":0.375,"sh":2,"r":"{R}=40 Ω","l1":"3 m","l2":"5 m","i":"{I}"},"P":{}},"ch":[{"t":"$0.75\\,\\mathrm{A}$","v":0.75,"why":"短絡した部分も電流が通ると考えた（$40\\,\\Omega$ で割った）"},{"t":"$1.2\\,\\mathrm{A}$","v":1.2,"why":"短絡した $5\\,\\mathrm{m}$ の部分の抵抗で割った"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$10\\,\\mathrm{A}$","v":10,"why":"抵抗でなく、長さ $3\\,\\mathrm{m}$ で割った"}],"ans":2}},{"ex":{"text":"図の抵抗 $R = 20\\,\\Omega$ のコンダクタンス $G$ は何 S か。","fig":{"kind":"u6s5res","L":{"r":"{R}=20 Ω","g":"{G}"},"P":{}},"ch":[{"t":"$20\\,\\mathrm{S}$","v":20,"why":"逆数にしていない（$R$ の値のまま）"},{"t":"$0.05\\,\\mathrm{S}$","v":0.05,"why":""},{"t":"$0.5\\,\\mathrm{S}$","v":0.5,"why":"けたを取り違えた"},{"t":"$2\\,\\mathrm{S}$","v":2,"why":"$R$ を 10 で割った"}],"ans":1}},{"ex":{"text":"図の物質の抵抗率は $\\rho = 0.25\\,\\Omega \\cdot \\mathrm{m}$ である。この物質の導電率 $\\sigma$ は □ である。","fig":{"kind":"u6s6cyl","L":{"rho":"{ρ}=0.25 Ω·m","sig":"{σ}"},"P":{}},"ch":[{"t":"$4\\,\\mathrm{S/m}$","v":"4Sm","why":""},{"t":"$0.25\\,\\mathrm{S/m}$","v":"0.25Sm","why":"逆数にしていない（$\\rho$ の値のまま）"},{"t":"$4\\,\\mathrm{S}$","v":"4S","why":"単位を取り違えた（$\\mathrm{S}$ はコンダクタンスの単位）"},{"t":"$4\\,\\Omega \\cdot \\mathrm{m}$","v":"4Om","why":"単位を取り違えた（$\\Omega \\cdot \\mathrm{m}$ は抵抗率の単位）"}],"ans":0}},{"ex":{"text":"図は、金属と半導体の温度と抵抗値の関係を表したグラフである。半導体を表すのは □ である。","fig":{"kind":"u6s7graph","L":{"nm":"a","nh":"b","sc":1},"P":{}},"ch":[{"t":"b","v":"b","why":""},{"t":"a","v":"a","why":"温度が上がると抵抗値が一定の割合で増えるのは金属"},{"t":"a と b のどちらも","v":"ab","why":"a と b は、温度が上がった時の抵抗値の変わり方が逆"},{"t":"どちらでもない","v":"none","why":"温度が上がると抵抗値が下がる b が半導体"}],"ans":0}},{"ex":{"text":"ある抵抗の抵抗値は、10 ℃ で $R_{10} = 80\\,\\Omega$、15 ℃ で $R_{15} = 82\\,\\Omega$ であった。10 ℃ を基準にした抵抗温度係数 $\\alpha_{10}$ はいくつか。","fig":{"kind":"u6s8graph","L":{"t1":"10 ℃","t2":"15 ℃","r1":"{R}_10=80 Ω","r2":"{R}_15=82 Ω"},"P":{}},"ch":[{"t":"$0.005$","v":"0.005","why":""},{"t":"$0.4$","v":"0.4","why":"1 ℃ あたり増える抵抗値のまま（基準の抵抗値で割っていない）"},{"t":"$0.025$","v":"0.025","why":"増えた 2 Ω を基準の抵抗値で割っただけ（1 ℃ あたりにしていない）"},{"t":"$2$","v":"2","why":"増えた抵抗値そのもの"}],"ans":0}},{"ex":{"text":"抵抗温度係数が $\\alpha_{20} = 0.005$ の抵抗がある。この抵抗の抵抗値は、60 ℃ で $R_{60} = 36\\,\\Omega$ であった。20 ℃ での抵抗値 $R_{20}$ は何 Ω か。","fig":{"kind":"u6s9graph","L":{"t1":"20 ℃","t2":"60 ℃","r1":"{R}_20","r2":"{R}_60=36 Ω","al":"{α}_20=0.005"},"P":{}},"ch":[{"t":"$30\\,\\Omega$","v":30,"why":""},{"t":"$43.2\\,\\Omega$","v":43.2,"why":"60 ℃ の抵抗値を基準にして掛けた（基準は 20 ℃ の抵抗値。1.2 で割る）"},{"t":"$28.8\\,\\Omega$","v":28.8,"why":"36 Ω から増える割合の分を引いた（1.2 で割る）"},{"t":"$36\\,\\Omega$","v":36,"why":"抵抗値が温度で変わらないと考えた"}],"ans":0}}],"past":[{"id":"r2q5","title":"令和2年 問5","text":"次に示す，A，B，C，D の四種類の電線がある。いずれの電線もその長さは 1 km である。この四つの電線の直流抵抗値をそれぞれ $R_{\\mathrm{A}}$ [Ω]，$R_{\\mathrm{B}}$ [Ω]，$R_{\\mathrm{C}}$ [Ω]，$R_{\\mathrm{D}}$ [Ω] とする。$R_{\\mathrm{A}}$ ～ $R_{\\mathrm{D}}$ の大きさを比較したとき，その大きさの大きい順として，正しいものを次の(1)～(5)のうちから一つ選べ。ただし，$\\rho$ は各導体の抵抗率とし，また，各電線は等断面，等質であるとする。　A：断面積が $9 \\times 10^{-5}$ m$^2$ の鉄（$\\rho = 8.90 \\times 10^{-8}$ Ω·m）でできた電線　B：断面積が $5 \\times 10^{-5}$ m$^2$ のアルミニウム（$\\rho = 2.50 \\times 10^{-8}$ Ω·m）でできた電線　C：断面積が $1 \\times 10^{-5}$ m$^2$ の銀（$\\rho = 1.47 \\times 10^{-8}$ Ω·m）でできた電線　D：断面積が $2 \\times 10^{-5}$ m$^2$ の銅（$\\rho = 1.55 \\times 10^{-8}$ Ω·m）でできた電線","fig":{"kind":"u6k1r2","L":{"mat":1},"P":{}},"ch":[{"t":"$R_{\\mathrm{A}} > R_{\\mathrm{C}} > R_{\\mathrm{D}} > R_{\\mathrm{B}}$","v":"1","why":""},{"t":"$R_{\\mathrm{A}} > R_{\\mathrm{D}} > R_{\\mathrm{C}} > R_{\\mathrm{B}}$","v":"2","why":""},{"t":"$R_{\\mathrm{B}} > R_{\\mathrm{D}} > R_{\\mathrm{C}} > R_{\\mathrm{A}}$","v":"3","why":""},{"t":"$R_{\\mathrm{C}} > R_{\\mathrm{A}} > R_{\\mathrm{D}} > R_{\\mathrm{B}}$","v":"4","why":""},{"t":"$R_{\\mathrm{D}} > R_{\\mathrm{C}} > R_{\\mathrm{A}} > R_{\\mathrm{B}}$","v":"5","why":""}],"ans":3,"slide":"t6k1x","credit":"出典：一般財団法人 電気技術者試験センター 令和2年度 第三種 理論 問5（図は自作）"},{"id":"r5aq7","title":"令和5年上期 問7","text":"図の回路において，スイッチ S を閉じ，直流電源から金属製の抵抗に電流を流したとき，発熱により抵抗の温度が 120 ℃になった。スイッチ S を閉じた直後に回路を流れる電流に比べ，抵抗の温度が 120 ℃になったときに回路を流れる電流は，どのように変化するか。最も近いものを次の(1)～(5)のうちから一つ選べ。ただし，スイッチ S を閉じた直後の抵抗の温度は 20 ℃とし，抵抗の温度係数は一定で 0.005 ℃$^{-1}$ とする。また，直流電源の起電力の大きさは温度によらず一定とし，直流電源の内部抵抗は無視できるものとする。","fig":{"kind":"u6k2r5","L":{},"P":{}},"ch":[{"t":"変化しない","v":"1","why":""},{"t":"50 ％増加","v":"2","why":""},{"t":"33 ％減少","v":"3","why":""},{"t":"50 ％減少","v":"4","why":""},{"t":"33 ％増加","v":"5","why":""}],"ans":2,"slide":"t6k2x","credit":"出典：一般財団法人 電気技術者試験センター 令和5年度上期 第三種 理論 問7（図は描き直し）"},{"id":"h24q5","title":"平成24年 問5","text":"図1のように電圧が $E$ [V] の直流電圧源で構成される回路を，図2のように電流が $I$ [A] の直流電流源（内部抵抗が無限大で，負荷変動があっても定電流を流出する電源）で構成される等価回路に置き替えることを考える。この場合，電流 $I$ [A] の大きさは図1の端子 a-b を短絡したとき，そこを流れる電流の大きさに等しい。また，図2のコンダクタンス $G$ [S] の大きさは図1の直流電圧源を短絡し，端子 a-b からみたコンダクタンスの大きさに等しい。$I$ [A] と $G$ [S] の値を表す式の組合せとして，正しいものを次の(1)～(5)のうちから一つ選べ。","fig":{"kind":"u6k3h24","L":{"f2":1,"r1":"{R}_1 [Ω]","r2":"{R}_2 [Ω]","r3":"{R}_3 [Ω]","src":"{E} [V]","cs":"{I} [A]","g":"{G} [S]"},"P":{}},"ch":[{"t":"$I = \\dfrac{R_1}{R_1 R_2 + R_2 R_3 + R_3 R_1} E$，$G = \\dfrac{R_2 + R_3}{R_1 R_2 + R_2 R_3 + R_3 R_1}$","v":"1","why":""},{"t":"$I = \\dfrac{R_2}{R_1 R_2 + R_2 R_3 + R_3 R_1} E$，$G = \\dfrac{R_1 + R_2}{R_1 R_2 + R_2 R_3 + R_3 R_1}$","v":"2","why":""},{"t":"$I = \\dfrac{R_2}{R_1 R_2 + R_2 R_3 + R_3 R_1} E$，$G = \\dfrac{R_2 + R_3}{R_1 R_2 + R_2 R_3 + R_3 R_1}$","v":"3","why":""},{"t":"$I = \\dfrac{R_1}{R_1 R_2 + R_2 R_3 + R_3 R_1} E$，$G = \\dfrac{R_1 + R_2}{R_1 R_2 + R_2 R_3 + R_3 R_1}$","v":"4","why":""},{"t":"$I = \\dfrac{R_3}{R_1 R_2 + R_2 R_3 + R_3 R_1} E$，$G = \\dfrac{R_1 + R_2}{R_1 R_2 + R_2 R_3 + R_3 R_1}$","v":"5","why":""}],"ans":1,"slide":"t6k3x","credit":"出典：一般財団法人 電気技術者試験センター 平成24年度 第三種 理論 問5（図は描き直し）"}]}};
});
