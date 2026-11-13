/* 単元5「キルヒホッフの法則」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(5, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, IOFF = H.IOFF, iSep = H.iSep, swapText = H.swapText, ZC = H.ZC, zband = H.zband, ztint = H.ztint, zpt = H.zpt, zones = H.zones, vOn = H.vOn, zoneTint = H.zoneTint, zSides = H.zSides, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元5の図（自作）の、節の間で共通の部品。共通の部品（vdim・pv・swapText・zones など）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 節の図は u05/sN_scenes.js（u05.py が番号順につなぎ、KINDS・FLOWK を1つにまとめる）。このファイルは書き換えない（足したい部品は自分の節のファイルへ）。
// 単元3の部品（u03/common_scenes.js）と同じ形。単元のファイルは別々に読み込むので、名前に 5 を付けて写した。
// 名前 L[k]：文字（そのまま）か [前, 後]（p[k + "v"] で前→後へ入れ替える）。矢印の濃さ＝p[k + "o"]（無ければ 1）、
// 電圧の矢印の伸び＝p[k + "d"]（無ければ 1）。問題の画面の図は p を渡さない＝全部出た形。
// 座標は単元3と同じ：上の線 y=360、左の縦の線 x=478、右の縦の線 x=1045、電池は下の線の真ん中（＋極＝長い線 x=752、－極 x=772）。
// 電流は＋極から出て、下の線を左へ → 左の線を上へ → 上の線を右へ → 右の線を下へ。抵抗は左の端（電流が入る側）が高い電位。
function lab5(d, id, x, y, spec, p, k, o, opt){
  if (spec === undefined || spec === null) return;
  if (Array.isArray(spec)) swapText(d, id, x, y, spec[0], spec[1], pv(p, k + "v"), o, opt);
  else swapText(d, id, x, y, spec, null, 0, o, opt);
}
// 抵抗（横）と名前（抵抗の上）
function resL5(d, id, x, y, L, k, p){
  d.res(id, x, y, "h");
  lab5(d, id + "t", x, y - 30, L[k], p, k, 1);
}
// 横の抵抗の電圧の矢印（上 or 下）。左の端が高い電位＝矢じりは左
function vArrow5(d, id, x, y, L, k, p, below){
  if (L[k] === undefined) return;
  var dd = pv(p, k + "d", 1), y0 = below ? y + 10 : y - 10, y1 = below ? y + 95 : y - 85, ya = below ? y + 85 : y - 75;
  var w = vdim(d, id + "d", x - 72.5, x + 72.5, y0, y1, ya, dd, {});
  lab5(d, id + "t", x, below ? ya + 25 : ya - 25, L[k], p, k, w);
}
// 電流の矢印（2026-11-14 本人の決まり＝導線に重ねず、導線から離した別の矢印・ループの外側。tb_scenes.js の iSep・proto_circuit/SPEC_expl.md §4）
// 全体の電流 I（監督の決定＝案A・2026-11-10）：左上の角に近い上の線（y=yt、既定 360）の外側（上）に右向き。左の線の外に名前を出すと
// 図の枠を左へ広げることになり、字が図に対して大きくなって名前が電池の線などに触れるため。id＝k + "a"・名前＝k + "t"
// bot＝真：上の線の左を R1 の名前・電圧の矢印が使う図は、下の線（＋極から左へ流れる・x=580〜620）の外側（下）
function iLeft5(d, yb, L, p, k, yt, bot){
  if (L[k] === undefined) return;
  var y = yt === undefined ? 360 : yt, o = pv(p, k + "o", 1);
  var lb = bot ? iSep(d, k + "a", 620, yb, 580, yb, 1, {o: o}) : iSep(d, k + "a", 510, y, 550, y, -1, {o: o});
  lab5(d, k + "t", lb[0], lb[1], L[k], p, k, o);
}
// 横の線の電流の矢印（右向き）。x＝矢印の真ん中、s＝置く側（-1＝線の上・1＝線の下。前の呼び方の true＝下・無し＝上も使える）。
// いちばん上の線＝外側（上）。外側を部品の値・一周の点線が使う線は内側（下）
function iWire5(d, k, x, y, L, p, s){
  if (L[k] === undefined) return;
  s = s === true ? 1 : (s === false || s === undefined) ? -1 : s;
  var o = pv(p, k + "o", 1), lb = iSep(d, k + "a", x - 20, y, x + 20, y, s, {o: o});
  lab5(d, k + "t", lb[0], lb[1], L[k], p, k, o);
}
// 電源（下の線の真ん中）・＋と－・電源の電圧の名前
function srcPart5(d, yb, L, p){
  d.cell("c", 752, yb);
  if (L.pm) { d.text("pp", 722, yb - 26, "+"); d.text("pm", 802, yb - 26, "−"); }
  lab5(d, "e", 762, yb + 42, L.src, p, "src", 1);
}
// 電位を見る点：L["p" + k] = {v: 電位}（v が無ければ点と名前だけ）。点の濃さ＝p["p" + k + "o"]、電位の濃さ＝p["p" + k + "vo"]
// side "v"＝縦の線の上（名前は線の左・電位は線の右）、無し＝横の線の上（名前は線の下・電位は線の上）
function pt5(d, k, x, y, L, p, side){
  var P = L["p" + k]; if (!P) return;
  var o = pv(p, "p" + k + "o", 1), vo = o * pv(p, "p" + k + "vo", 1);
  d.dot("d" + k, x, y, {o: o});
  if (side === "v") {
    d.text("n" + k, x - 18, y, k, {o: o, anchor: "end"});
    if (P.v !== undefined) lab5(d, "p" + k + "t", x + 18, y, P.v, p, "p" + k, vo, {anchor: "start"});
  } else {
    d.text("n" + k, x, y + 30, k, {o: o});
    if (P.v !== undefined) lab5(d, "p" + k + "t", x, y - 32, P.v, p, "p" + k, vo);
  }
}
// ---- 5-1 キルヒホッフの第1法則 の図：1つの点に4本の導線がつながった形（u5s1node）。点は (760, 430)。
// 枝（位置）：左 l（x=520〜760）・上 u（y=270〜430）・右 r（x=760〜1000）・下 d（y=430〜590）。
// 電流の矢印の id は位置で決める（左＝i1・上＝i2・右＝i3・下＝i4）。名前（L.i1 など）は問題ごとに変わる（"{I}_1"・"5 A"・"{I}"・"3{I}"）。
// L.br＝{l: 1 か 0, u: …, r: …, d: …}（1＝点に入る電流・0＝点から出る電流）。矢印は導線から離した別の矢印（2026-11-14）・向きは電流の向き。横の枝は線の上・縦の枝は線の右（名前も同じ側）。
// 導線の id は u5s1w＋位置＋入る（i）か出る（o）（電流の矢印の確かめで、向きの組を見分ける）。点＝u5s1n。電圧は出ないので色の帯は無い。
// 電流の流れ（矢じり）の間隔は電流に反比例：L.fl＝{i1: 値, …}（無ければ全部 1）。
var U5S1X = 760, U5S1Y = 430;
var U5S1B = {
  l: {k: "i1", end: [520, 430], ax: 640, ay: 430},
  u: {k: "i2", end: [760, 270], ax: 760, ay: 350},
  r: {k: "i3", end: [1000, 430], ax: 880, ay: 430},
  d: {k: "i4", end: [760, 590], ax: 760, ay: 510}
};
// 電流の矢印：入る＝点へ向かう・出る＝点から離れる
function u5s1arrow(d, pos, isIn, L, p){
  var B = U5S1B[pos], k = B.k;
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), h = (pos === "l" || pos === "r"), sg;
  if (h) {
    sg = (pos === "l") === !!isIn ? 1 : -1;        // 右向き＝1
    // 2026-11-14：導線から離した別の矢印（tb_scenes.js の iSep）。横の枝＝線の上（輪が無い＝どちらも外側）
    var la = iSep(d, k + "a", B.ax - 20 * sg, B.ay, B.ax + 20 * sg, B.ay, -1, {o: o});
    lab5(d, k + "t", la[0], la[1], L[k], p, k, o);
  } else {
    sg = (pos === "u") === !!isIn ? 1 : -1;        // 下向き＝1
    var lb = iSep(d, k + "a", B.ax, B.ay - 20 * sg, B.ax, B.ay + 20 * sg, 1, {o: o});    // 縦の枝＝線の右
    lab5(d, k + "t", lb[0], lb[1], L[k], p, k, o, {anchor: lb[2]});
  }
}
function tbU5s1node(d, p, L){
  var br = L.br || {l: 1, u: 1, r: 0, d: 0};
  ["l", "u", "r", "d"].forEach(function(pos){
    if (br[pos] === undefined) return;
    d.wire("u5s1w" + pos + (br[pos] ? "i" : "o"), [U5S1B[pos].end, [U5S1X, U5S1Y]]);
  });
  d.dot("u5s1n", U5S1X, U5S1Y);
  ["l", "u", "r", "d"].forEach(function(pos){ if (br[pos] !== undefined) u5s1arrow(d, pos, br[pos], L, p); });
}
// ---- 5-2 キルヒホッフの第2法則 の図：電源・R1（上の線）・R2 と R3（縦・並列）（u5s2sp）。
// 座標：左の縦の線 x=478、上の線 y=360、下の線 y=600。R1＝上の線 x=565（横）、R2＝x=760 の縦（y=480）、R3＝右の縦の線 x=1045（y=480）。
// 電源は下の線 x=600（＋極＝長い線 600・－極 620）。電流は＋極から出て、下の線を左へ → 左の線を上へ → R1 → 点 (760, 360) で R2 と R3 に分かれる。
// 名前：R1 は上の線の下（図の中）、R2 は R2 の左、R3 は右の縦の線の左、電源の電圧は電源の上（＋と－の上）。
// 電流の矢印（2026-11-14：導線から離した別の矢印）：I1＝上の線の外側（上）、I2＝R2 の線の右、I3＝右の縦の線の外側（右）。名前は矢印の外。
// 閉回路の向き（一周の矢印）：左の閉回路（電源・R1・R2）の中の丸い矢印（時計回り）。L.la＝1 で出す・濃さ＝p.lao。
// 線の id は u5s2 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
// 同じ電位の線の色の帯（tb_scenes.js の zones）：電源の電圧がある時。＋極の側＝赤・R1 の後ろ（R2・R3 の上の側）＝紫・R2・R3 の下の側（－極の側）＝灰。
// 電流の流れ（矢じり）の間隔は道ごとの電流に反比例：L.fl＝[I1, I2, I3] の比（無ければ [2, 1, 1]）。
var U5S2YB = 600, U5S2XB = 600, U5S2XR1 = 565, U5S2XR2 = 760, U5S2XR = 1045;
function U5S2Z(){
  var yb = U5S2YB;
  return {hi: {lines: [[[U5S2XB, yb], [478, yb], [478, 360], [U5S2XR1 - 30, 360]]]},
          mid: {lines: [[[U5S2XR1 + 30, 360], [U5S2XR, 360], [U5S2XR, 450]], [[U5S2XR2, 360], [U5S2XR2, 450]]]},
          lo: {lines: [[[U5S2XR2, 510], [U5S2XR2, yb]], [[U5S2XR, 510], [U5S2XR, yb], [U5S2XB + 20, yb]]]}};
}
// 縦の抵抗と名前（名前は左＝anchor end）
function u5s2resV(d, id, x, y, L, k, p){
  d.res(id, x, y, "v");
  lab5(d, id + "t", x - 24, y, L[k], p, k, 1, {anchor: "end"});
}
// 電源（下の線 x）・＋と－・電源の電圧の名前（＋と－の上）
function u5s2src(d, x, yb, L, p){
  d.cell("c", x, yb);
  if (L.pm) { d.text("pp", x - 30, yb - 26, "+"); d.text("pm", x + 50, yb - 26, "−"); }
  lab5(d, "e", x + 10, yb - 62, L.src, p, "src", 1);
}
// 閉回路の向きの丸い矢印（中心 cx, cy・半径 rr）。cw＝時計回り。id＝線・id + "e"＝矢じりの付いた終わりの所
function u5s2loop(d, id, cx, cy, rr, cw, o){
  var pts = [], n = 24, a0 = -60, span = 300, s = cw ? 1 : -1;
  for (var i = 0; i <= n; i++) { var a = (a0 + s * span * i / n) * Math.PI / 180; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  d.wire(id, pts.slice(0, n - 1), {o: o});
  d.arrow(id + "e", pts[n - 2][0], pts[n - 2][1], pts[n][0], pts[n][1], {o: o});
}
// 電流の矢印（縦の線・下向き）。導線から離した別の矢印（tb_scenes.js の iSep・2026-11-14）。side "r"＝線の右・"l"＝線の左（名前も同じ側）
function u5s2iV(d, k, x, y, L, p, side){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), lb = iSep(d, k + "a", x, y - 20, x, y + 20, side === "l" ? -1 : 1, {o: o});
  lab5(d, k + "t", lb[0], lb[1], L[k], p, k, o, {anchor: lb[2]});
}
function tbU5s2sp(d, p, L){
  var yb = U5S2YB, xb = U5S2XB, x1 = U5S2XR1, x2 = U5S2XR2, xr = U5S2XR;
  zones(d, p, L, U5S2Z(), vOn(L, ["src"]));
  d.wire("u5s2L", [[xb, yb], [478, yb], [478, 360], [x1 - 30, 360]]);
  d.wire("u5s2t1", [[x1 + 30, 360], [x2, 360]]);
  d.wire("u5s2t2", [[x2, 360], [xr, 360], [xr, 450]]);
  d.wire("u5s2a2", [[x2, 360], [x2, 450]]); d.wire("u5s2b2", [[x2, 510], [x2, yb]]);
  d.wire("u5s2b3", [[xr, 510], [xr, yb], [x2, yb]]);
  d.wire("u5s2B", [[x2, yb], [xb + 20, yb]]);
  d.dot("u5s2j1", x2, 360); d.dot("u5s2j2", x2, yb);
  u5s2src(d, xb, yb, L, p);
  d.res("r1", x1, 360, "h"); lab5(d, "r1t", x1, 392, L.r1, p, "r1", 1);
  u5s2resV(d, "r2", x2, 480, L, "r2", p); u5s2resV(d, "r3", xr, 480, L, "r3", p);
  if (L.i1 !== undefined) {
    var o1 = pv(p, "i1o", 1), l1 = iSep(d, "i1a", 670, 360, 710, 360, -1, {o: o1});    // 上の線の外側（上）
    lab5(d, "i1t", l1[0], l1[1], L.i1, p, "i1", o1);
  }
  // I2＝R2 の線（並列の中の枝＝外側が無い）の右・I3＝右の縦の線の外側（右）
  u5s2iV(d, "i2", x2, 405, L, p, "r"); u5s2iV(d, "i3", xr, 405, L, p, "r");
  if (L.la) u5s2loop(d, "u5s2la", 560, 480, 34, true, pv(p, "lao", 1));
}
// ---- 5-3 閉回路の向きと符号 の図：5-2 と同じ回路（電源・R1・R2 と R3 の並列）（u5s3sp）。形と座標は 5-2 の u5s2sp と同じ（名前の頭だけ u5s3）。
// 座標：左の縦の線 x=478、上の線 y=360、下の線 y=600。R1＝上の線 x=565（横）、R2＝x=760 の縦（y=480）、R3＝右の縦の線 x=1045（y=480）。
// 電源は下の線 x=600（＋極＝長い線 600・－極 620）。電流は＋極から出て、左の線を上へ → R1 → 点 (760, 360) で R2（下向き）と R3（下向き）に分かれる。
// 閉回路の向き（一周の矢印）：
//   左の閉回路（電源・R1・R2）＝丸い矢印（中心 560, 480）。L.la＝1 で時計回り・−1 で反時計回り。濃さ＝p.lao
//   右の閉回路（R2・R3）＝丸い矢印（中心 850, 530）。L.lb＝1 で時計回り・−1 で反時計回り。濃さ＝p.lbo
//   外側の閉回路（電源・R1・R3）＝回路の外を一周する点線（線から 22 外）と、上の辺の矢じり（時計回り）。L.lo＝1 で出す。濃さ＝p.loo
// 名前：R1 は上の線の下（図の中）、R2 は R2 の左、R3 は右の縦の線の左、電源の電圧は電源の上。外側の点線に名前はかからない。
// 電流の矢印（2026-11-14：導線から離した別の矢印）：I1＝上の線の外側・I3＝右の縦の線の外側（外側の点線がある図は内側）・I2＝R2 の線の右。
// 線の id は u5s3 で始める。同じ電位の線の色の帯：電源の電圧がある時（＋極の側＝赤・R1 の後ろ＝紫・R2・R3 の下の側＝灰）。
// 電流の流れ（矢じり）の間隔は道ごとの電流に反比例：L.fl＝[I1, I2, I3] の比（無ければ [2, 1, 1]）。
var U5S3YB = 600, U5S3XB = 600, U5S3XR1 = 565, U5S3XR2 = 760, U5S3XR = 1045;
function U5S3Z(){
  var yb = U5S3YB;
  return {hi: {lines: [[[U5S3XB, yb], [478, yb], [478, 360], [U5S3XR1 - 30, 360]]]},
          mid: {lines: [[[U5S3XR1 + 30, 360], [U5S3XR, 360], [U5S3XR, 450]], [[U5S3XR2, 360], [U5S3XR2, 450]]]},
          lo: {lines: [[[U5S3XR2, 510], [U5S3XR2, yb]], [[U5S3XR, 510], [U5S3XR, yb], [U5S3XB + 20, yb]]]}};
}
function u5s3resV(d, id, x, y, L, k, p){
  d.res(id, x, y, "v");
  lab5(d, id + "t", x - 24, y, L[k], p, k, 1, {anchor: "end"});
}
function u5s3src(d, x, yb, L, p){
  d.cell("c", x, yb);
  if (L.pm) { d.text("pp", x - 30, yb - 26, "+"); d.text("pm", x + 50, yb - 26, "−"); }
  lab5(d, "e", x + 10, yb - 62, L.src, p, "src", 1);
}
// 丸い矢印（中心 cx, cy・半径 rr）。cw＝時計回り
function u5s3loop(d, id, cx, cy, rr, cw, o){
  var pts = [], n = 24, a0 = cw ? -60 : 240, span = 300, s = cw ? 1 : -1;
  for (var i = 0; i <= n; i++) { var a = (a0 + s * span * i / n) * Math.PI / 180; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  d.wire(id, pts.slice(0, n - 1), {o: o});
  d.arrow(id + "e", pts[n - 2][0], pts[n - 2][1], pts[n][0], pts[n][1], {o: o});
}
// 電流の矢印（縦の線・下向き）。導線から離した別の矢印（tb_scenes.js の iSep・2026-11-14）。side "r"＝線の右・"l"＝線の左（名前も同じ側）
function u5s3iV(d, k, x, y, L, p, side){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), lb = iSep(d, k + "a", x, y - 20, x, y + 20, side === "l" ? -1 : 1, {o: o});
  lab5(d, k + "t", lb[0], lb[1], L[k], p, k, o, {anchor: lb[2]});
}
function tbU5s3sp(d, p, L){
  var yb = U5S3YB, xb = U5S3XB, x1 = U5S3XR1, x2 = U5S3XR2, xr = U5S3XR, g = 22;
  zones(d, p, L, U5S3Z(), vOn(L, ["src"]));
  if (L.lo) {
    var oo = pv(p, "loo", 1);
    d.wire("u5s3lo", [[478 - g, yb + g], [478 - g, 360 - g], [xr + g, 360 - g], [xr + g, yb + g], [478 - g, yb + g]], {o: oo, dash: 1});
    d.arrow("u5s3loe", 860, 360 - g, 900, 360 - g, {o: oo});
  }
  d.wire("u5s3L", [[xb, yb], [478, yb], [478, 360], [x1 - 30, 360]]);
  d.wire("u5s3t1", [[x1 + 30, 360], [x2, 360]]);
  d.wire("u5s3t2", [[x2, 360], [xr, 360], [xr, 450]]);
  d.wire("u5s3a2", [[x2, 360], [x2, 450]]); d.wire("u5s3b2", [[x2, 510], [x2, yb]]);
  d.wire("u5s3b3", [[xr, 510], [xr, yb], [x2, yb]]);
  d.wire("u5s3B", [[x2, yb], [xb + 20, yb]]);
  d.dot("u5s3j1", x2, 360); d.dot("u5s3j2", x2, yb);
  u5s3src(d, xb, yb, L, p);
  d.res("r1", x1, 360, "h"); lab5(d, "r1t", x1, 392, L.r1, p, "r1", 1);
  u5s3resV(d, "r2", x2, 480, L, "r2", p); u5s3resV(d, "r3", xr, 480, L, "r3", p);
  if (L.i1 !== undefined) {
    var o1 = pv(p, "i1o", 1), l1 = iSep(d, "i1a", 670, 360, 710, 360, L.lo ? 1 : -1, {o: o1});
    lab5(d, "i1t", l1[0], l1[1], L.i1, p, "i1", o1);
  }
  // I1＝上の線の外側（上）・I3＝右の縦の線の外側（右）。外側の一周の点線（L.lo）がある図は、外側を点線が使うので内側（I1＝下・I3＝左）。
  // I2＝R2 の線（並列の中の枝＝外側が無い）の右
  u5s3iV(d, "i2", x2, 405, L, p, "r"); u5s3iV(d, "i3", xr, 405, L, p, L.lo ? "l" : "r");
  if (L.la) u5s3loop(d, "u5s3la", 560, 480, 34, L.la > 0, pv(p, "lao", 1));
  if (L.lb) u5s3loop(d, "u5s3lb", 850, 530, 34, L.lb > 0, pv(p, "lbo", 1));
}
// ---- 5-4 直列の電源をまとめる の図（u5s4ser）：電源2つと抵抗1つの1つの回路。抵抗 R は上の線 x=760、電流 I は左の縦の線（上向き）。
// 下の線 y=560 に電源 V1（x=600〜620）・V2（x=880〜900）。L.d1・L.d2＝電源の向き（1＝長い線＝＋極が左＝電流 I を押す向き・-1＝逆向き。無ければ 1）。
// 問題の電流 I の向きは、大きい方の電源が押す向き（逆向きの電源は小さい方だけ）。
// L.lp があれば閉回路の向き（I と同じ時計回り）の矢印（濃さ p.lpo）。p.mg＝2つの電源を1つの電源 V（L.src・x=752）にまとめる（0→1）。
// 同じ電位の線の色の帯：電源の向きから電位の順を決める（＋極の側が高い）。まとめた後は V の＋極の側＝赤・－極の側＝灰。
// 線の id は u5s4 で始める。
var U5S4YB = 560;
// 電源（横の導線の途中・x〜x+20）。dir 1＝長い線（＋）が左、-1＝長い線が右。＋と－の文字・電源の名前（下）も描く
function u5s4cell(d, id, x, y, dir, L, k, p, o){
  var xl = dir > 0 ? x : x + 20, xs = dir > 0 ? x + 20 : x;
  d.wire(id + ":L", [[xl, y - 22], [xl, y + 22]], {o: o});
  var s = d.wire(id + ":S", [[xs, y - 11], [xs, y + 11]], {o: o}); s.style.strokeWidth = 4;
  if (L.pm) { d.text(id + "p", dir > 0 ? x - 30 : x + 50, y - 26, "+", {o: o}); d.text(id + "m", dir > 0 ? x + 50 : x - 30, y - 26, "−", {o: o}); }
  lab5(d, k + "t", x + 10, y + 42, L[k], p, k, o);
}
// 閉回路の向きの矢印（時計回り・中心 cx, cy・半径 r）。円の弧を折れ線で描き、終わりに矢じり
function u5s4arc(d, id, cx, cy, r, o){
  var a0 = 200 * Math.PI / 180, sw = 290 * Math.PI / 180, N = 24, pts = [], aE = a0 + sw;
  for (var k = 0; k <= N; k++) { var a = a0 + sw * k / N; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  var tx = -Math.sin(aE), ty = Math.cos(aE), tip = [cx + r * Math.cos(aE), cy + r * Math.sin(aE)], h = 13, w = 7;
  pts[N] = [tip[0] - tx * 6, tip[1] - ty * 6];
  d.wire(id, pts, {o: o});
  var e = d.el(id + ":h", "path", "ink head");
  e.setAttribute("d", "M" + n(tip[0]) + " " + n(tip[1]) + " L" + n(tip[0] - tx * h - ty * w) + " " + n(tip[1] - ty * h + tx * w) +
    " L" + n(tip[0] - tx * h + ty * w) + " " + n(tip[1] - ty * h - tx * w) + " Z");
  d.style(e, {o: o});
}
// 電位のまとまり：A＝V1 の＋極側（左）から R の左まで・M＝V1 と V2 の間・B＝R の右から V2 の右まで
function U5S4Z(d1, d2){
  var yb = U5S4YB, A = [[600, yb], [478, yb], [478, 360], [730, 360]], M = [[620, yb], [880, yb]], B = [[790, 360], [1045, 360], [1045, yb], [900, yb]];
  // 電流の向きに B →（V2）→ M →（V1）→ A →（R で下がる）→ B。B を 0 として、上がる＝＋
  var vm = d2 > 0 ? 2 : -1, va = vm + (d1 > 0 ? 2 : -1);
  if (d1 < 0 && d2 > 0) va = 1;                       // V1 が逆向き（V2 が大きい）：M が一番高い・A は 0 より高い
  var seg = [[va, A], [vm, M], [0, B]].sort(function(a, b){ return b[0] - a[0]; }), z = {};
  ["hi", "mid", "lo"].forEach(function(k, i){ z[k] = {lines: [seg[i][1]]}; });
  return z;
}
var U5S4ZM = {hi: {lines: [[[752, 560], [478, 560], [478, 360], [730, 360]]]}, lo: {lines: [[[790, 360], [1045, 360], [1045, 560], [772, 560]]]}};
function tbU5s4ser(d, p, L){
  var yb = U5S4YB, d1 = L.d1 || 1, d2 = L.d2 || 1, mg = pv(p, "mg"), o0 = 1 - mg;
  zones(d, p, L, U5S4Z(d1, d2), o0);
  zones(d, p, L, U5S4ZM, mg, "m");
  d.wire("u5s4L", [[478, 360], [478, yb], [600, yb]]);
  d.wire("u5s4R", [[900, yb], [1045, yb], [1045, 360]]);
  d.wire("u5s4w1", [[478, 360], [730, 360]]); d.wire("u5s4w2", [[790, 360], [1045, 360]]);
  d.wire("u5s4m", [[620, yb], [880, yb]], {o: o0});
  if (L.src !== undefined) {
    d.wire("u5s4ma", [[600, yb], [752, yb]], {o: mg}); d.wire("u5s4mb", [[772, yb], [900, yb]], {o: mg});
    d.cell("c", 752, yb, {o: mg});
    if (L.pm) { d.text("pp", 722, yb - 26, "+", {o: mg}); d.text("pm", 802, yb - 26, "−", {o: mg}); }
    lab5(d, "e", 762, yb + 42, L.src, p, "src", mg);
  }
  u5s4cell(d, "c1", 600, yb, d1, L, "s1", p, o0);
  u5s4cell(d, "c2", 880, yb, d2, L, "s2", p, o0);
  resL5(d, "r", 760, 360, L, "r", p);
  iLeft5(d, yb, L, p, "i");
  if (L.lp) u5s4arc(d, "u5s4lp", 760, 455, 50, pv(p, "lpo", 1));
}
// ---- 5-5 ループ電流法で式を立てる の図（u5s5two）：閉回路が2つの回路。上の線 y=300、下の線 y=580、左の縦の線 x=478、右の縦の線 x=1045。
// 上の線に R1（x=620）・R2（x=900）、真ん中の縦の線 x=760 に R3（縦・y=440）。下の線に電源 V1（x=600〜620）・V2（x=880〜900）。
// L.d1・L.d2＝電源の向き（1＝長い線＝＋極が左・-1＝逆向き。無ければ 1）。
// 電流（導線から離した別の矢印・2026-11-14）：I1＝左上の上の線の外側（右向き）、I2＝右の縦の線の外側（下向き）、R3 の電流（L.i3＝"I1−I2"）＝真ん中の線の R3 の下の右（下向き）。濃さ p.i1o・p.i2o・p.i3o。
// 閉回路の向き（時計回り）：L.lp1＝左・L.lp2＝右（濃さ p.lp1o・p.lp2o）。
// 同じ電位の線の色の帯：L.zp＝[A, B, C, D] の電位（A＝V1 の左から R1 の左・B＝R1・R2・R3 の間の上の点・C＝R2 の右から V2 の右・
//   D＝V1 と V2 の間と R3 の下）。値の高い順に 赤・紫・藍・灰。電位の数字は出さない（問題で決まった電源と抵抗の値から決まる順だけ）。
// 電流の流れの間隔：L.fl＝[I1, I2, I1 − I2]。線の id は u5s5 で始める。
var U5S5YT = 300, U5S5YB = 580;
function u5s5cell(d, id, x, y, dir, L, k, p){
  var xl = dir > 0 ? x : x + 20, xs = dir > 0 ? x + 20 : x;
  d.wire(id + ":L", [[xl, y - 22], [xl, y + 22]]);
  var s = d.wire(id + ":S", [[xs, y - 11], [xs, y + 11]]); s.style.strokeWidth = 4;
  if (L.pm) { d.text(id + "p", dir > 0 ? x - 30 : x + 50, y - 26, "+"); d.text(id + "m", dir > 0 ? x + 50 : x - 30, y - 26, "−"); }
  lab5(d, k + "t", x + 10, y + 42, L[k], p, k, 1);
}
// 閉回路の向きの矢印（時計回り）。円の弧を折れ線で描き、終わりに矢じり
function u5s5arc(d, id, cx, cy, r, o){
  var a0 = 200 * Math.PI / 180, sw = 290 * Math.PI / 180, N = 24, pts = [], aE = a0 + sw;
  for (var k = 0; k <= N; k++) { var a = a0 + sw * k / N; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  var tx = -Math.sin(aE), ty = Math.cos(aE), tip = [cx + r * Math.cos(aE), cy + r * Math.sin(aE)], h = 13, w = 7;
  pts[N] = [tip[0] - tx * 6, tip[1] - ty * 6];
  d.wire(id, pts, {o: o});
  var e = d.el(id + ":h", "path", "ink head");
  e.setAttribute("d", "M" + n(tip[0]) + " " + n(tip[1]) + " L" + n(tip[0] - tx * h - ty * w) + " " + n(tip[1] - ty * h + tx * w) +
    " L" + n(tip[0] - tx * h + ty * w) + " " + n(tip[1] - ty * h - tx * w) + " Z");
  d.style(e, {o: o});
}
function U5S5Z(zp){
  var yt = U5S5YT, yb = U5S5YB;
  var seg = [[zp[0], [[[600, yb], [478, yb], [478, yt], [590, yt]]]],
             [zp[1], [[[650, yt], [870, yt]], [[760, yt], [760, 410]]]],
             [zp[2], [[[930, yt], [1045, yt], [1045, yb], [900, yb]]]],
             [zp[3], [[[620, yb], [880, yb]], [[760, 470], [760, yb]]]]].sort(function(a, b){ return b[0] - a[0]; }), z = {};
  ["hi", "mid", "mid2", "lo"].forEach(function(k, i){ z[k] = {lines: seg[i][1]}; });
  return z;
}
function tbU5s5two(d, p, L){
  var yt = U5S5YT, yb = U5S5YB;
  if (L.zp) zones(d, p, L, U5S5Z(L.zp), 1);
  d.wire("u5s5L", [[590, yt], [478, yt], [478, yb], [600, yb]]);
  d.wire("u5s5t", [[650, yt], [870, yt]]);
  d.wire("u5s5R", [[930, yt], [1045, yt], [1045, yb], [900, yb]]);
  d.wire("u5s5b", [[620, yb], [880, yb]]);
  d.wire("u5s5m1", [[760, yt], [760, 410]]); d.wire("u5s5m2", [[760, 470], [760, yb]]);
  d.dot("u5s5j1", 760, yt); d.dot("u5s5j2", 760, yb);
  u5s5cell(d, "c1", 600, yb, L.d1 || 1, L, "s1", p);
  u5s5cell(d, "c2", 880, yb, L.d2 || 1, L, "s2", p);
  resL5(d, "r1", 620, yt, L, "r1", p); resL5(d, "r2", 900, yt, L, "r2", p);
  d.res("r3", 760, 440, "v");
  lab5(d, "r3t", 740, 440, L.r3, p, "r3", 1, {anchor: "end"});
  // 電流の矢印（2026-11-14：導線から離した別の矢印・ループの外側）：I1＝左上の上の線の外側（上）・I2＝右の縦の線の外側（右）・
  //   I3＝真ん中の縦の線（外側が無い）の右（R3 の名前が左を使う）
  iLeft5(d, yb, L, p, "i1", yt);
  if (L.i2 !== undefined) { var o2 = pv(p, "i2o", 1), l2 = iSep(d, "i2a", 1045, 420, 1045, 460, 1, {o: o2}); lab5(d, "i2t", l2[0], l2[1], L.i2, p, "i2", o2, {anchor: l2[2]}); }
  if (L.i3 !== undefined) { var o3 = pv(p, "i3o", 1), l3 = iSep(d, "i3a", 760, 495, 760, 535, 1, {o: o3}); lab5(d, "i3t", l3[0], l3[1], L.i3, p, "i3", o3, {anchor: l3[2]}); }
  if (L.lp1) u5s5arc(d, "u5s5l1", 576, 425, 38, pv(p, "lp1o", 1));    // 2026-11-14：x 592 → 576（枠を広げて字が図に対して大きくなり、R3 の名前に触れた）
  if (L.lp2) u5s5arc(d, "u5s5l2", 900, 420, 40, pv(p, "lp2o", 1));
}
// ---- 5-6 連立方程式を解く の図（自作）：電源が2つ・抵抗が3つの回路（u5s6net）。
// 左の縦の線 x=478 に電源 V1（＋極が上＝長い線 y=420・短い線 y=440）、右の縦の線 x=1045 に電源 V2（同じ形）。
// 上の線 y=360 に R1（x=640）・R2（x=850）、真ん中の縦の線 x=760 に R3（y=480・縦・名前は左）。下の線 y=560。
// 電流：I1 は R1 を右へ（矢印は R1 の左の線 x=525 の外側＝上）、I2 は R2 を右へ（矢印は R2 の右の線 x=990 の外側＝上）、真ん中は I1 − I2 が下へ（R3 の上の線の左）。
// 閉回路の向きの矢印（一周の矢印）：左右の閉回路とも右回り（u5s6o1・u5s6o2。5-5 と同じ）。L.loop が無い図は描かない。
// 同じ電位の線の色の帯：p.zo（スライドで解いた後に出す）。問題の画面は p が無い＝帯なし（色の順が答えの手がかりになるため。単元4の k3・k5 と同じ扱い）。
//   帯の色は L.zc＝{l: 左上, r: 右上, m: 真ん中, b: 下} に hi・mid・mid2・lo を入れる（高い順に 赤・紫・藍・灰）。
// 電流の流れ（矢じり）：p.co。向きは L.fl（[I1, I2] の実際の値。負なら逆向き）から作る。
// 線の id は u5s6 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
var U5S6X = {l: 478, m: 760, r: 1045, r1: 640, r2: 850}, U5S6Y = {t: 360, b: 560, c: 480, p: 420, s: 440};
// 縦の電源：x の線の上、＋極（長い線）が上。id＋":L"・":S"。＋と－・名前は回路の内側（side＝1 右へ・-1 左へ）
function u5s6cell(d, id, x, side, L, k, p){
  var Y = U5S6Y;
  d.wire(id + ":L", [[x - 22, Y.p], [x + 22, Y.p]]);
  var s = d.wire(id + ":S", [[x - 11, Y.s], [x + 11, Y.s]]); s.style.strokeWidth = 4;
  if (L.pm) { d.text(id + "p", x + side * 28, Y.p - 22, "+"); d.text(id + "m", x + side * 28, Y.s + 24, "−"); }
  lab5(d, id + "t", x + side * 36, (Y.p + Y.s) / 2, L[k], p, k, 1, {anchor: side > 0 ? "start" : "end"});
}
// 閉回路の向きの矢印（円の一部＋矢じり）。cw＝右回り
function u5s6arc(d, id, cx, cy, r, cw, o){
  var a0 = -60, sw = 290, pts = [], i, a;
  for (i = 0; i <= 29; i++) { a = (a0 + (cw ? 1 : -1) * sw * i / 29) * Math.PI / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  d.wire(id, pts.slice(0, -1), {o: o});
  var q = pts[pts.length - 2], e = pts[pts.length - 1], dx = e[0] - q[0], dy = e[1] - q[1], Ln = Math.sqrt(dx * dx + dy * dy), ux = dx / Ln, uy = dy / Ln;
  var h = d.el(id + ":h", "path", "ink head");
  h.setAttribute("d", "M" + n(e[0] + ux * 6) + " " + n(e[1] + uy * 6) + " L" + n(e[0] - ux * 8 - uy * 7) + " " + n(e[1] - uy * 8 + ux * 7) +
    " L" + n(e[0] - ux * 8 + uy * 7) + " " + n(e[1] - uy * 8 - ux * 7) + " Z");
  d.style(h, {o: o});
}
function u5s6zones(){
  var X = U5S6X, Y = U5S6Y;
  return {l: [[[X.l, Y.p], [X.l, Y.t], [X.r1 - 30, Y.t]]], r: [[[X.r2 + 30, Y.t], [X.r, Y.t], [X.r, Y.p]]],
          m: [[[X.r1 + 30, Y.t], [X.r2 - 30, Y.t]], [[X.m, Y.t], [X.m, Y.c - 30]]],
          b: [[[X.l, Y.s], [X.l, Y.b], [X.r, Y.b], [X.r, Y.s]], [[X.m, Y.c + 30], [X.m, Y.b]]]};
}
function tbU5s6net(d, p, L){
  var X = U5S6X, Y = U5S6Y, zo = pv(p, "zo");
  if (L.zc) { var Z = u5s6zones(); ["l", "r", "m", "b"].forEach(function(k){ zband(d, "zbu5s6" + k, Z[k], L.zc[k], zo); }); }
  d.wire("u5s6L", [[X.l, Y.p], [X.l, Y.t], [X.r1 - 30, Y.t]]);
  d.wire("u5s6t1", [[X.r1 + 30, Y.t], [X.m, Y.t]]); d.wire("u5s6t2", [[X.m, Y.t], [X.r2 - 30, Y.t]]);
  d.wire("u5s6R", [[X.r2 + 30, Y.t], [X.r, Y.t], [X.r, Y.p]]);
  d.wire("u5s6M", [[X.m, Y.t], [X.m, Y.c - 30]]); d.wire("u5s6Mb", [[X.m, Y.c + 30], [X.m, Y.b]]);
  d.wire("u5s6B1", [[X.l, Y.s], [X.l, Y.b], [X.m, Y.b]]); d.wire("u5s6B2", [[X.m, Y.b], [X.r, Y.b], [X.r, Y.s]]);
  d.dot("u5s6j1", X.m, Y.t); d.dot("u5s6j2", X.m, Y.b);
  u5s6cell(d, "u5s6c1", X.l, 1, L, "v1", p); u5s6cell(d, "u5s6c2", X.r, -1, L, "v2", p);
  resL5(d, "r1", X.r1, Y.t, L, "r1", p); resL5(d, "r2", X.r2, Y.t, L, "r2", p);
  d.res("r3", X.m, Y.c, "v"); lab5(d, "r3t", X.m - 26, Y.c, L.r3, p, "r3", 1, {anchor: "end"});
  if (L.loop) { u5s6arc(d, "u5s6o1", 562, 512, 25, true, pv(p, "lo", 1)); u5s6arc(d, "u5s6o2", 900, 505, 25, true, pv(p, "lo", 1)); }
  // 電流の矢印（2026-11-14：導線から離した別の矢印）：I1・I2＝上の線の外側（上）・I3＝真ん中の枝（外側が無い）の左
  iWire5(d, "i1", 525, Y.t, L, p, -1);
  iWire5(d, "i2", 990, Y.t, L, p, -1);
  if (L.i3 !== undefined) {
    var o3 = pv(p, "i3o", 1), l3 = iSep(d, "i3a", X.m, 375, X.m, 415, -1, {o: o3});
    lab5(d, "i3t", l3[0], l3[1], L.i3, p, "i3", o3, {anchor: l3[2]});
  }
}
// ---- 5-7 電位の基準を決める の図（自作）：電源が2つ・抵抗が2つの1つの閉回路（u5s7loop）。
// 左の縦の線 x=478 に電源 V1（＋極が上＝長い線 y=450・短い線 y=470）、右の縦の線 x=1045 に電源 V2（L.o2＝"t" で＋極が上・"b" で＋極が下）。
// 上の線 y=360 に R1（x=760）、下の線 y=560 に R2（x=760）。電流 I はいつも右回り（V1 の＋極から上へ・上の線を右へ）。矢印は上の線 x=640 から離した別の矢印（外側＝上）。
// 電位を見る点：a（上の線 x=540）・b（上の線 x=940）・c（下の線 x=940）・d（下の線 x=540）。L["p" + k]＝電位の文字（[前, 後] なら p[k+"v"] で入れ替え）、
//   "" なら点と名前だけ。電位の文字の濃さ＝p["p" + k + "vo"]（無ければ 1）。名前は線の内側、電位は線の外側。
// 閉回路の向きの矢印（一周の矢印・右回り）：L.loop の時、濃さ p.lo（無ければ 1）。
// 同じ電位の線の色の帯：L.zc＝{a: …, b: …, c: …, d: …}（hi・mid・mid2・lo＝高い順に 赤・紫・藍・灰）がある時だけ。帯と点・電位の文字の色は、
//   その点の電位の文字が出た時に出る。問題の画面は L.zc を渡さない＝帯なし（色の順が答えになるため。単元4の k3・k5 と同じ扱い）。
// 線の id は u5s7 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
// 2026-11-14：点 a・d の x 580 → 540（上の線の外側の電流 I の名前を、点 a の電位と R1 の名前の間に入れるため）
var U5S7P = {a: [540, 360, 1], b: [940, 360, 1], c: [940, 560, -1], d: [540, 560, -1]};
// 縦の電源：x の線の上。top＝＋極が上か。＋と－・名前は回路の内側（side＝1 右へ・-1 左へ）
function u5s7cell(d, id, x, top, side, L, k, p){
  var yl = top ? 450 : 470, ys = top ? 470 : 450;
  d.wire(id + ":L", [[x - 22, yl], [x + 22, yl]]);
  var s = d.wire(id + ":S", [[x - 11, ys], [x + 11, ys]]); s.style.strokeWidth = 4;
  if (L.pm) { d.text(id + "p", x + side * 28, top ? 428 : 494, "+"); d.text(id + "m", x + side * 28, top ? 494 : 428, "−"); }
  lab5(d, id + "t", x + side * 36, 460, L[k], p, k, 1, {anchor: side > 0 ? "start" : "end"});
}
// 閉回路の向きの矢印（円の一部＋矢じり・右回り）
function u5s7arc(d, id, cx, cy, r, o){
  var pts = [], i, a;
  for (i = 0; i <= 29; i++) { a = (-60 + 290 * i / 29) * Math.PI / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  d.wire(id, pts.slice(0, -1), {o: o});
  var q = pts[pts.length - 2], e = pts[pts.length - 1], dx = e[0] - q[0], dy = e[1] - q[1], Ln = Math.sqrt(dx * dx + dy * dy), ux = dx / Ln, uy = dy / Ln;
  var h = d.el(id + ":h", "path", "ink head");
  h.setAttribute("d", "M" + n(e[0] + ux * 6) + " " + n(e[1] + uy * 6) + " L" + n(e[0] - ux * 8 - uy * 7) + " " + n(e[1] - uy * 8 + ux * 7) +
    " L" + n(e[0] - ux * 8 + uy * 7) + " " + n(e[1] - uy * 8 - ux * 7) + " Z");
  d.style(h, {o: o});
}
// 点 k：点・名前（線の内側）・電位（線の外側）
function u5s7pt(d, k, L, p){
  var P = U5S7P[k], x = P[0], y = P[1], s = P[2], spec = L["p" + k];
  if (spec === undefined) return;
  d.dot("u5s7d" + k, x, y);
  d.text("u5s7n" + k, x, y + s * 26, k);
  if (spec !== "") lab5(d, "u5s7p" + k + "t", x, y - s * 28, spec, p, "p" + k, pv(p, "p" + k + "vo", 1));
}
var U5S7Z = {a: [[[478, 450], [478, 360], [730, 360]]], b: [[[790, 360], [1045, 360], [1045, 450]]],
             c: [[[1045, 470], [1045, 560], [790, 560]]], d: [[[730, 560], [478, 560], [478, 470]]]};
function tbU5s7loop(d, p, L){
  var ks = ["a", "b", "c", "d"];
  if (L.zc) ks.forEach(function(k){ zband(d, "zbu5s7" + k, U5S7Z[k], L.zc[k], pv(p, "p" + k + "vo", 1)); });
  d.wire("u5s7L", [[478, 450], [478, 360], [730, 360]]);
  d.wire("u5s7T", [[790, 360], [1045, 360], [1045, 450]]);
  d.wire("u5s7R", [[1045, 470], [1045, 560], [790, 560]]);
  d.wire("u5s7B", [[730, 560], [478, 560], [478, 470]]);
  u5s7cell(d, "u5s7c1", 478, true, 1, L, "v1", p);
  u5s7cell(d, "u5s7c2", 1045, L.o2 !== "b", -1, L, "v2", p);
  resL5(d, "r1", 760, 360, L, "r1", p);
  d.res("r2", 760, 560, "h"); lab5(d, "r2t", 760, 592, L.r2, p, "r2", 1);
  if (L.loop) u5s7arc(d, "u5s7o", 760, 460, 28, pv(p, "lo", 1));
  // I（2026-11-14：導線から離した別の矢印）：上の線の外側（上）。点 a の電位（x=540 の上）と R1 の名前（x=760 の上）の間（x=640）。
  //   前の x=850 では、離した分だけ上へ出た名前が R1 の名前・点 b の電位に重なった
  iWire5(d, "i", 640, 360, L, p, -1);
  ks.forEach(function(k){ u5s7pt(d, k, L, p); });
  if (L.zc) ks.forEach(function(k){ if (L["p" + k] && pv(p, "p" + k + "vo", 1) > 0) ztint(d, ["u5s7d" + k, "u5s7p" + k + "t0", "u5s7p" + k + "t1"], L.zc[k]); });
}
// ---- 単元5の終わりの過去問1：平成18年 問5（u5k1h18・図は試験センターの図を描き直した物）。電源（中に抵抗がある）と可変抵抗器の1つの閉回路。
// 左の縦の線 x=560：電源の中の抵抗（縦・y=330）と電源（＋極＝長い線 y=420・短い線 y=436）を、四角（x=525〜595・y=280〜470）で囲む。
// 上の線 y=250・下の線 y=530・右の縦の線 x=960 に可変抵抗器（縦・y=390・斜めの矢印）。電流 I の矢印は上の線（右向き・名前は線の上）。
// 問題の画面は名前を外側（公式の図と同じ）、解説は中の抵抗・電源の名前を四角の右、可変抵抗器の名前を左に置く。
// 名前 L：rx（電源の中の抵抗）・src（電源の電圧）・r（可変抵抗器）・i（電流）・q（1＝問題の画面＝四角の横に「電池」）。部品の id は u5k1 で始める。
// 同じ電位の線の色の帯：＋極と中の抵抗の間＝赤・中の抵抗の後ろ（上の線と可変抵抗器まで）＝紫・可変抵抗器の後ろ（下の線）＝灰。
var U5K1 = {xl: 560, xr: 960, yt: 250, yb: 530};
function u5k1Z(){
  var G = U5K1;
  return {hi: {lines: [[[G.xl, 420], [G.xl, 360]]]},
          mid: {lines: [[[G.xl, 300], [G.xl, G.yt], [G.xr, G.yt], [G.xr, 360]]]},
          lo: {lines: [[[G.xr, 420], [G.xr, G.yb], [G.xl, G.yb], [G.xl, 436]]]}};
}
function tbU5k1h18(d, p, L){
  var G = U5K1;
  zones(d, p, L, u5k1Z(), vOn(L, ["src"]), "u5k1");
  d.wire("u5k1L1", [[G.xl, 420], [G.xl, 360]]);
  d.wire("u5k1L2", [[G.xl, 300], [G.xl, G.yt], [G.xr, G.yt], [G.xr, 360]]);
  d.wire("u5k1L3", [[G.xr, 420], [G.xr, G.yb], [G.xl, G.yb], [G.xl, 436]]);
  // 電源の四角
  d.wire("u5k1box", [[525, 280], [595, 280], [595, 470], [525, 470], [525, 280]]);
  if (L.q) d.text("u5k1bn", 612, 375, "電池", {anchor: "start"});
  // 電源の中の抵抗と名前（左）
  d.res("u5k1rx", G.xl, 330, "v");
  // 名前：問題の画面は四角の左（公式の図と同じ）、解説は四角の右（図を大きく出すため）
  var nx = L.q ? G.xl - 50 : 612, na = L.q ? "end" : "start";
  lab5(d, "u5k1rxt", nx, L.q ? 330 : 322, L.rx, p, "rx", 1, {anchor: na});
  // 電源：上の長い線＝＋極
  d.wire("u5k1c:L", [[G.xl - 22, 420], [G.xl + 22, 420]]);
  var s = d.wire("u5k1c:S", [[G.xl - 11, 436], [G.xl + 11, 436]]); s.style.strokeWidth = 4;
  lab5(d, "u5k1e", nx, L.q ? 428 : 440, L.src, p, "src", 1, {anchor: na});
  // 可変抵抗器（縦）と斜めの矢印・名前（右）
  d.res("u5k1r", G.xr, 390, "v");
  d.arrow("u5k1va", G.xr - 26, 428, G.xr + 26, 352);
  if (L.q) lab5(d, "u5k1rt", G.xr + 44, 390, L.r, p, "r", 1, {anchor: "start"});
  else lab5(d, "u5k1rt", G.xr - 44, 378, L.r, p, "r", 1, {anchor: "end"});
  // 電流 I（上の線・右向き）
  if (L.i !== undefined) {
    var o = pv(p, "io", 1), la = iSep(d, "u5k1ia", 710, G.yt, 750, G.yt, -1, {o: o});    // 2026-11-14：上の線の外側（上）に離した別の矢印
    lab5(d, "u5k1it", la[0], la[1], L.i, p, "i", o);
  }
}
// ---- 単元5の終わりの過去問2：令和6年上期 問6（u5k2r6・図は試験センターの図を描き直した物）。電源が3つ・道が2つ。
// 左の縦の線 x=500 に 9 V（＋極＝上の長い線 y=392・短い線 y=408）。上の線 y=260 に 6 Ω（x=590）、分かれる点 a（x=680）。
// 上の道 y=260：3 V（短い線 x=752・長い線＝＋極 x=768＝右が＋）・R（x=930）。下の道 y=390：4 V（同じ向き）・1 Ω（x=930）。
// 右の縦の線 x=1020（合流する点 y=390）・下の線 y=530。
// 電流の矢印（2026-11-14：導線から離した別の矢印・ループの外側）：I1＝下の線の左（左向き・線の下）・上の道の 0.3 A＝3 V と R の間の線の上（右向き）・
//   I2＝点 a から下りる縦の線の右（下向き）。名前は矢印の外。
// 3 V の名前は、問題の画面は電源の下（公式の図と同じ）、解説は電源の上（I2 の名前と重ねないため）。
// 名前 L：r6・r・r1・e9・e3・e4・i1・i2・ia（0.3 A）・pa（1＝点 a の名前を出す）・q（1＝問題の画面＝色の帯を出さない）。部品の id は u5k2 で始める。
// 同じ電位の線の色の帯（解説だけ）：－極を 0 V とすると 9 V（＋極～6 Ω）＝赤・1.6 V（4 V の＋極～1 Ω）＝紫・0.6 V（3 V の＋極～R）＝藍・
//   0 V（R・1 Ω の後ろ～－極）＝青・−2.4 V（6 Ω の後ろ～点 a～3 V・4 V の－極）＝灰。電位が5つあり、0 V の所は ZC の5色目 mid3（青）で塗る。
// 問題の画面では帯を出さない（点 a が下の線より低い＝色の順が解き方の手がかりになるため）。
var U5K2 = {xl: 500, x6: 590, xp: 680, xc: 760, xr: 930, xo: 1020, yt: 260, ym: 390, yb: 530};
// 横の線の途中の電源（右が＋極）：短い線 x−8・長い線 x+8
function u5k2cell(d, id, x, y){
  d.wire(id + ":L", [[x + 8, y - 22], [x + 8, y + 22]]);
  var s = d.wire(id + ":S", [[x - 8, y - 11], [x - 8, y + 11]]); s.style.strokeWidth = 4;
}
function tbU5k2r6(d, p, L){
  var G = U5K2, xl = G.xl, xp = G.xp, xo = G.xo, yt = G.yt, ym = G.ym, yb = G.yb;
  if (!L.q) {
    zband(d, "zbu5k2hi", [[[xl, 392], [xl, yt], [G.x6 - 30, yt]]], "hi", 1);
    zband(d, "zbu5k2mid", [[[G.xc + 8, ym], [G.xr - 30, ym]]], "mid", 1);
    zband(d, "zbu5k2mid2", [[[G.xc + 8, yt], [G.xr - 30, yt]]], "mid2", 1);
    zband(d, "zbu5k2mid3", [[[G.xr + 30, yt], [xo, yt], [xo, yb], [xl, yb], [xl, 408]], [[G.xr + 30, ym], [xo, ym]]], "mid3", 1);
    zband(d, "zbu5k2lo", [[[G.x6 + 30, yt], [G.xc - 8, yt]], [[xp, yt], [xp, ym], [G.xc - 8, ym]]], "lo", 1);
  }
  d.wire("u5k2a", [[xl, 392], [xl, yt], [G.x6 - 30, yt]]);
  d.wire("u5k2b1", [[G.x6 + 30, yt], [xp, yt]]);
  d.wire("u5k2b2", [[xp, yt], [G.xc - 8, yt]]);
  d.wire("u5k2c", [[G.xc + 8, yt], [G.xr - 30, yt]]);
  d.wire("u5k2d", [[G.xr + 30, yt], [xo, yt], [xo, ym]]);
  d.wire("u5k2e", [[xp, yt], [xp, ym], [G.xc - 8, ym]]);
  d.wire("u5k2f", [[G.xc + 8, ym], [G.xr - 30, ym]]);
  d.wire("u5k2g", [[G.xr + 30, ym], [xo, ym]]);
  d.wire("u5k2h", [[xo, ym], [xo, yb], [xl, yb], [xl, 408]]);
  d.dot("u5k2j1", xp, yt); d.dot("u5k2j2", xo, ym);
  if (L.pa) d.text("u5k2na", xp - 14, yt - 24, "a", {anchor: "end"});
  resL5(d, "u5k2r6", G.x6, yt, L, "r6", p);
  resL5(d, "u5k2r", G.xr, yt, L, "r", p);
  resL5(d, "u5k2r1", G.xr, ym, L, "r1", p);
  // 9 V（縦の線の途中・上の長い線＝＋極）
  d.wire("u5k2c9:L", [[xl - 22, 392], [xl + 22, 392]]);
  var s = d.wire("u5k2c9:S", [[xl - 11, 408], [xl + 11, 408]]); s.style.strokeWidth = 4;
  lab5(d, "u5k2e9", xl - 30, 400, L.e9, p, "e9", 1, {anchor: "end"});
  u5k2cell(d, "u5k2c3", G.xc, yt); lab5(d, "u5k2e3", L.q ? G.xc : G.xc - 20, L.q ? yt + 44 : yt - 44, L.e3, p, "e3", 1);
  u5k2cell(d, "u5k2c4", G.xc, ym); lab5(d, "u5k2e4", G.xc, ym + 44, L.e4, p, "e4", 1);
  if (L.ia !== undefined) {
    var la = iSep(d, "u5k2iaa", 805, yt, 845, yt, -1);    // 2026-11-14：上の道の外側（上）に離した別の矢印
    lab5(d, "u5k2iat", la[0], la[1], L.ia, p, "ia", 1);
  }
  if (L.i2 !== undefined) {
    var o2 = pv(p, "i2o", 1), l2 = iSep(d, "u5k2i2a", xp, 305, xp, 345, 1, {o: o2});    // 点 a から下りる線（外側が無い）の右
    lab5(d, "u5k2i2t", l2[0], l2[1], L.i2, p, "i2", o2, {anchor: l2[2]});
  }
  if (L.i1 !== undefined) {
    // I1：前は左の縦の線の上。外側（左）は 9 V の名前が使うので、下の線（左へ流れる）の外側（下）
    var o1 = pv(p, "i1o", 1), l1 = iSep(d, "u5k2i1a", 620, yb, 580, yb, 1, {o: o1});
    lab5(d, "u5k2i1t", l1[0], l1[1], L.i1, p, "i1", o1);
  }
}
// ---- 単元5の終わりの過去問3：平成27年 問4（u5k3h27・図は試験センターの図を描き直した物）。はしごの形（上の線に 60 Ω が3つ・縦に R1〜R3）。
// 左の縦の線 x=480 に 90 V（＋極＝上の長い線 y=392・短い線 y=408）。上の線 y=280・下の線 y=520。縦の抵抗 R1〜R3 は y=400（名前は右）。
// 横の位置は2通り：問題の画面（U5K3Q）＝公式の図と同じ詰めた形。縦の抵抗の電圧の矢印（下から上へ）と名前（矢印の左）。
//   解説（U5K3S・L.pa）＝横に広げた形。電圧の矢印の代わりに、下の線を 0 V とした点 a・b の電位（数字）を線の下に、R3 の上の電位を右の縦の線の右に書く。
// 上の 60 Ω の名前：問題の画面は線の下・解説は線の上。電源の名前：問題の画面は線の左・解説は線の右（図の幅を詰めるため）。
// 電流の矢印（解説だけ。2026-11-14：導線から離した別の矢印・ループの外側）：I＝下の線の左（左向き・線の下）・Ia＝点 a と真ん中の 60 Ω の間・
//   Ib＝点 b と右の 60 Ω の間（右向き・線の上）・I1・I2＝R1・R2 の下の線（下向き・線の右＝中の枝）。名前は矢印の外。
// 名前 L：ra・rb・rc（60 Ω 左から）・r1・r2・r3・src・v1・v2・v3（電圧の矢印）・i・ia・ib・i1・i2・pa（1＝解説の形）・
//   pv＝[点 a, 点 b, R3 の上] の電位の文字。部品の id は u5k3 で始める。
// 同じ電位の線の色の帯（下の線を 0 V）：90 V＝赤・30 V（点 a）＝紫・15 V（点 b）＝藍・10 V（R3 の上）＝青・0 V＝灰。電位が5つあり
//   10 V の所は ZC の5色目 mid3（青）で塗る。
//   電位はどれも問題の文で決まっている（帯の色の順は答えの手がかりにならない）ので、問題の画面でも帯を出す。
var U5K3Q = {xl: 480, x1: 640, x2: 840, x3: 1040, ra: 560, rb: 740, rc: 940};
var U5K3S = {xl: 480, x1: 610, x2: 820, x3: 1030, ra: 545, rb: 715, rc: 925};
var U5K3Y = {yt: 280, yb: 520, ym: 400};
function u5k3G(L){ return L.pa ? U5K3S : U5K3Q; }
// 縦の抵抗と名前（右）・電圧の矢印（左・下から上へ）
function u5k3vres(d, k, x, L, p){
  var Y = U5K3Y;
  d.res("u5k3r" + k, x, Y.ym, "v");
  lab5(d, "u5k3r" + k + "t", x + 24, Y.ym, L["r" + k], p, "r" + k, 1, {anchor: "start"});
  if (L["v" + k] === undefined) return;
  var xa = x - 34, a = d.el("u5k3v" + k + "d:a", "path", "ink vdim");
  a.setAttribute("d", "M" + xa + " " + (Y.yb - 12) + " V" + (Y.yt + 12) + " M" + (xa - 6) + " " + (Y.yt + 23) + " L" + xa + " " + (Y.yt + 12) + " L" + (xa + 6) + " " + (Y.yt + 23));
  d.style(a, {});
  lab5(d, "u5k3v" + k + "t", xa - 10, 350, L["v" + k], p, "v" + k, 1, {anchor: "end"});
}
// 電流の矢印（2026-11-14：導線から離した別の矢印・tb_scenes.js の iSep）
// 横の線の電流の矢印（向きは x0→x1）。s＝置く側（-1＝線の上・1＝線の下）。名前も同じ側
function u5k3iR(d, k, x, L, p, y, s, x0, x1){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), yy = y === undefined ? U5K3Y.yt : y;
  var lb = iSep(d, "u5k3" + k + "a", x0 === undefined ? x - 20 : x0, yy, x1 === undefined ? x + 20 : x1, yy, s === undefined ? -1 : s, {o: o});
  lab5(d, "u5k3" + k + "t", lb[0], lb[1], L[k], p, k, o);
}
// 縦の線の電流の矢印。線の右（名前も右）
function u5k3iV(d, k, x, y0, y1, L, p){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), lb = iSep(d, "u5k3" + k + "a", x, y0, x, y1, 1, {o: o});
  lab5(d, "u5k3" + k + "t", lb[0], lb[1], L[k], p, k, o, {anchor: lb[2]});
}
function tbU5k3h27(d, p, L){
  var G = u5k3G(L), Y = U5K3Y, xl = G.xl, x1 = G.x1, x2 = G.x2, x3 = G.x3, yt = Y.yt, yb = Y.yb, ym = Y.ym;
  zband(d, "zbu5k3hi", [[[xl, 392], [xl, yt], [G.ra - 30, yt]]], "hi", 1);
  zband(d, "zbu5k3mid", [[[G.ra + 30, yt], [G.rb - 30, yt]], [[x1, yt], [x1, ym - 30]]], "mid", 1);
  zband(d, "zbu5k3mid2", [[[G.rb + 30, yt], [G.rc - 30, yt]], [[x2, yt], [x2, ym - 30]]], "mid2", 1);
  zband(d, "zbu5k3mid3", [[[G.rc + 30, yt], [x3, yt], [x3, ym - 30]]], "mid3", 1);
  zband(d, "zbu5k3lo", [[[x3, ym + 30], [x3, yb], [xl, yb], [xl, 408]], [[x1, ym + 30], [x1, yb]], [[x2, ym + 30], [x2, yb]]], "lo", 1);
  d.wire("u5k3a", [[xl, 392], [xl, yt], [G.ra - 30, yt]]);
  d.wire("u5k3b1", [[G.ra + 30, yt], [x1, yt]]); d.wire("u5k3b2", [[x1, yt], [G.rb - 30, yt]]);
  d.wire("u5k3c1", [[G.rb + 30, yt], [x2, yt]]); d.wire("u5k3c2", [[x2, yt], [G.rc - 30, yt]]);
  d.wire("u5k3d", [[G.rc + 30, yt], [x3, yt], [x3, ym - 30]]);
  d.wire("u5k3v1u", [[x1, yt], [x1, ym - 30]]); d.wire("u5k3v1d", [[x1, ym + 30], [x1, yb]]);
  d.wire("u5k3v2u", [[x2, yt], [x2, ym - 30]]); d.wire("u5k3v2d", [[x2, ym + 30], [x2, yb]]);
  d.wire("u5k3w1", [[x3, ym + 30], [x3, yb], [x2, yb]]); d.wire("u5k3w2", [[x2, yb], [x1, yb]]);
  d.wire("u5k3w3", [[x1, yb], [xl, yb], [xl, 408]]);
  [[x1, yt], [x1, yb], [x2, yt], [x2, yb]].forEach(function(q, i){ d.dot("u5k3j" + i, q[0], q[1]); });
  if (L.pa) {
    // 点の名前と電位（線の下）。電位の文字は帯の色の濃い方
    d.text("u5k3na", x1 + 14, yt + 38, "a", {anchor: "start"}); d.text("u5k3nb", x2 + 14, yt + 38, "b", {anchor: "start"});
    var PV = L.pv || [];
    if (PV[0]) d.text("u5k3pa", x1 + 40, yt + 38, PV[0], {anchor: "start"});
    if (PV[1]) d.text("u5k3pb", x2 + 40, yt + 38, PV[1], {anchor: "start"});
    if (PV[2]) d.text("u5k3pc", x3 + 16, yt + 38, PV[2], {anchor: "start"});
    ztint(d, ["u5k3j0", "u5k3pa"], "mid"); ztint(d, ["u5k3j2", "u5k3pb"], "mid2");
    ztint(d, ["u5k3pc"], "mid3");
  }
  [["a", G.ra], ["b", G.rb], ["c", G.rc]].forEach(function(q){
    d.res("u5k3r" + q[0], q[1], yt, "h");
    lab5(d, "u5k3r" + q[0] + "t", q[1], L.pa ? yt - 30 : yt + 32, L["r" + q[0]], p, "r" + q[0], 1);
  });
  u5k3vres(d, "1", x1, L, p); u5k3vres(d, "2", x2, L, p); u5k3vres(d, "3", x3, L, p);
  // 電源（左の縦の線の途中・上の長い線＝＋極）
  d.wire("u5k3c:L", [[xl - 22, 392], [xl + 22, 392]]);
  var s = d.wire("u5k3c:S", [[xl - 11, 408], [xl + 11, 408]]); s.style.strokeWidth = 4;
  if (L.pa) lab5(d, "u5k3e", xl + 22, 452, L.src, p, "src", 1, {anchor: "start"});
  else lab5(d, "u5k3e", xl - 30, 400, L.src, p, "src", 1, {anchor: "end"});
  // I：前は左の縦の線の上。外側（左）に名前を出すと枠を左へ広げる＝図が小さくなるので、下の線の左（左へ流れる）の外側（下）
  u5k3iR(d, "i", (x1 + xl) / 2, L, p, yb, 1, (x1 + xl) / 2 + 20, (x1 + xl) / 2 - 20);
  u5k3iR(d, "ia", x1 + 35, L, p); u5k3iR(d, "ib", x2 + 35, L, p);
  u5k3iV(d, "i1", x1, 450, 490, L, p); u5k3iV(d, "i2", x2, 450, 490, L, p);
}
// ---- 単元5の終わりの過去問4：平成22年 問6（u5k4h22・図は試験センターの図を描き直した物）。R1 と R2 の直列に 100 V（図1）、
// b-c 間に 150 Ω を並列に足す（図2）、b-c 間を短絡する（図3）。単元4の過去問4（令和7年上期 問6・u04/k4_scenes.js）と同じ形なので、
// その図の作りを名前に 5 を付けて写した（単元のファイルは別々に読むため）。
// 1つの回路の形（左上を (ox, oy) として）：左の縦の線 x=ox（電池は y=oy+150〜170・上の長い線＝＋極）、右の縦の線 x=ox+220 に
// 端子 a（y=oy）・R1（y=oy+80・縦）・端子 b（y=oy+160）・R2（y=oy+240・縦）・端子 c（y=oy+320）。b-c 間に足す物は x=ox+320（150 Ω は y=oy+240）。
// b-c 間の電圧の矢印は x=ox+450（低い c から高い b へ・上向き）。図3の電流 I の矢印は短絡した線の上（下向き・名前は線の右）。
// 名前 L：r1・r2・src・r15（150 Ω）・v1（図1の b-c 間）・v2（図2の b-c 間）・i（図3）・figs＝描く回路の並び [[形, ox, oy], …]。
//   形 1・2・3＝図1〜3（問題の画面）。形 0＝解説の1つの回路（p.s15＝150 Ω の濃さ・p.ssh＝短絡した線の濃さ・p.t1o〜t3o＝「図1〜3」の濃さ・
//   p.v1o・p.v2o＝電圧の矢印の濃さ）。部品の id は u5k4 + 回路の頭（解説＝s・問題＝f1〜f3）で始める。
// 同じ電位の線の色の帯：＋極の側（a まで）＝赤・b の側（R1 の後ろ）＝紫・c の側（－極の側）＝灰。短絡すると b の側も灰（b と c が同じ電位）。
//   電位は問題の文で決まっている（図3で b と c が同じ電位なのは短絡の決まり）ので、単元4の過去問4と同じく問題の画面でも帯を出す。
function u5k4one(d, p, L, P, ox, oy, V){
  var X = ox + 220, XS = ox + 320, ya = oy, yb = oy + 160, yc = oy + 320;
  // 色の帯
  zband(d, "zb" + P + "hi", [[[ox, oy + 150], [ox, ya], [X, ya], [X, oy + 50]]], "hi", 1);
  var mid = [[[X, oy + 110], [X, oy + 210]]], low = [[[X, oy + 270], [X, yc], [ox, yc], [ox, oy + 170]]];
  if (V.s15 > 0) { mid.push([[X, yb], [XS, yb], [XS, oy + 210]]); low.push([[XS, oy + 270], [XS, yc], [X, yc]]); }
  if (V.ssh > 0) mid.push([[X, yb], [XS, yb], [XS, yc], [X, yc]]);
  zband(d, "zb" + P + "mid", mid, "mid", 1 - V.ssh);
  zband(d, "zb" + P + "lo", low, "lo", 1);
  if (V.ssh > 0) zband(d, "zb" + P + "mlo", mid, "lo", V.ssh);
  // 回路
  d.wire(P + "L", [[ox, oy + 150], [ox, ya], [X, ya], [X, oy + 50]]);
  d.wire(P + "M", [[X, oy + 110], [X, oy + 210]]);
  d.wire(P + "B", [[X, oy + 270], [X, yc], [ox, yc], [ox, oy + 170]]);
  d.wire(P + "c:L", [[ox - 22, oy + 150], [ox + 22, oy + 150]]);
  var s = d.wire(P + "c:S", [[ox - 11, oy + 170], [ox + 11, oy + 170]]); s.style.strokeWidth = 4;
  lab5(d, P + "e", ox + 26, oy + 160, L.src, p, "src", 1, {anchor: "start"});
  d.res(P + "r1", X, oy + 80, "v"); lab5(d, P + "r1t", X - 24, oy + 80, L.r1, p, "r1", 1, {anchor: "end"});
  d.res(P + "r2", X, oy + 240, "v"); lab5(d, P + "r2t", X - 24, oy + 240, L.r2, p, "r2", 1, {anchor: "end"});
  [["a", ya, 0, -30], ["b", yb, -22, 0], ["c", yc, 0, 32]].forEach(function(q){
    var e = d.el(P + "t" + q[0], "circle", "ink term"); e.setAttribute("cx", X); e.setAttribute("cy", q[1]); e.setAttribute("r", 6); d.style(e, {});
    d.text(P + "t" + q[0] + ":t", X + q[2], q[1] + q[3], q[0], {anchor: q[2] ? "end" : "middle"});
  });
  // b-c 間に足す物：15 Ω（V.s15）・短絡した線（V.ssh）
  if (V.s15 > 0) {
    d.wire(P + "s1", [[X, yb], [XS, yb], [XS, oy + 210]], {o: V.s15});
    d.wire(P + "s2", [[XS, oy + 270], [XS, yc], [X, yc]], {o: V.s15});
    d.res(P + "r15", XS, oy + 240, "v", {o: V.s15}); lab5(d, P + "r15t", XS + 24, oy + 240, L.r15, p, "r15", V.s15, {anchor: "start"});
  }
  if (V.ssh > 0) {
    d.wire(P + "sh", [[X, yb], [XS, yb], [XS, yc], [X, yc]], {o: V.ssh});
    if (L.i !== undefined) {
      var o = V.ssh * pv(p, "io", 1), lb = iSep(d, P + "ia", XS, yb + 50, XS, yb + 86, 1, {o: o});   // 2026-11-14：右の短絡の線の外側（右）
      lab5(d, P + "it", lb[0], lb[1], L.i, p, "i", o, {anchor: lb[2]});
    }
  }
  // b-c 間の電圧の矢印（c から b へ・上向き）。x0＝補助線の始め
  function vbc(k, o, x0){
    if (!(o > 0) || L[k] === undefined) return;
    var xa = ox + 450;
    d.wire(P + k + "d:e", [[x0, yb], [xa + 10, yb]], {o: o}); d.wire(P + k + "d:f", [[x0, yc], [xa + 10, yc]], {o: o});
    var a = d.el(P + k + "d:a", "path", "ink vdim");
    a.setAttribute("d", "M" + xa + " " + yc + " V" + yb + " M" + (xa - 6) + " " + (yb + 11) + " L" + xa + " " + yb + " L" + (xa + 6) + " " + (yb + 11));
    d.style(a, {o: o});
    lab5(d, P + k + "t", xa + 16, (yb + yc) / 2, L[k], p, k, o, {anchor: "start"});
  }
  vbc("v1", V.v1, X + 12); vbc("v2", V.v2, XS + 12);
  // 図の名前
  [["図1", V.t1], ["図2", V.t2], ["図3", V.t3]].forEach(function(q, i){
    if (q[1] > 0) d.text(P + "n" + (i + 1), ox - 30, oy - 44, q[0], {anchor: "start", o: q[1]});
  });
}
function tbU5k4h22(d, p, L){
  (L.figs || [[0, 560, 250]]).forEach(function(f){
    var k = f[0], V;
    if (k === 0) V = {s15: pv(p, "s15"), ssh: pv(p, "ssh"), v1: pv(p, "v1o", 1), v2: pv(p, "v2o"), t1: pv(p, "t1o", 1), t2: pv(p, "t2o"), t3: pv(p, "t3o")};
    else V = {s15: k === 2 ? 1 : 0, ssh: k === 3 ? 1 : 0, v1: k === 1 ? 1 : 0, v2: k === 2 ? 1 : 0, t1: k === 1 ? 1 : 0, t2: k === 2 ? 1 : 0, t3: k === 3 ? 1 : 0};
    u5k4one(d, p, L, k === 0 ? "u5k4s" : "u5k4f" + k, f[1], f[2], V);
  });
}
var KINDS = {u5s1node: tbU5s1node, u5s2sp: tbU5s2sp, u5s3sp: tbU5s3sp, u5s4ser: tbU5s4ser, u5s5two: tbU5s5two, u5s6net: tbU5s6net, u5s7loop: tbU5s7loop, u5k1h18: tbU5k1h18, u5k2r6: tbU5k2r6, u5k3h27: tbU5k3h27, u5k4h22: tbU5k4h22};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u5s1node: function(p, L){
    var br = L.br || {l: 1, u: 1, r: 0, d: 0}, fl = L.fl || {}, out = [], mx = 1;
    ["l", "u", "r", "d"].forEach(function(pos){
      if (br[pos] === undefined) return;
      var B = U5S1B[pos], I = fl[B.k] || 1, e = B.end, c = [U5S1X, U5S1Y];
      mx = Math.max(mx, I);
      out.push({I: I, pts: br[pos] ? [e, c] : [c, e]});
    });
    return {o: pv(p, "co"), base: 80 * mx, paths: out};
  },
  u5s2sp: function(p, L){
    var yb = U5S2YB, f = L.fl || [2, 1, 1];
    return {o: pv(p, "co"), base: 90 * f[0], paths: [
      {I: f[0], pts: [[U5S2XB, yb], [478, yb], [478, 360], [U5S2XR2, 360]]},
      {I: f[1], pts: [[U5S2XR2, 360], [U5S2XR2, yb]]},
      {I: f[2], pts: [[U5S2XR2, 360], [U5S2XR, 360], [U5S2XR, yb], [U5S2XR2, yb]]},
      {I: f[0], pts: [[U5S2XR2, yb], [U5S2XB + 20, yb]]}]};
  },
  u5s3sp: function(p, L){
    var yb = U5S3YB, f = L.fl || [2, 1, 1];
    return {o: pv(p, "co"), base: 90 * f[0], paths: [
      {I: f[0], pts: [[U5S3XB, yb], [478, yb], [478, 360], [U5S3XR2, 360]]},
      {I: f[1], pts: [[U5S3XR2, 360], [U5S3XR2, yb]]},
      {I: f[2], pts: [[U5S3XR2, 360], [U5S3XR, 360], [U5S3XR, yb], [U5S3XR2, yb]]},
      {I: f[0], pts: [[U5S3XR2, yb], [U5S3XB + 20, yb]]}]};
  },
  u5s4ser: function(p, L){
    var yb = U5S4YB;
    if (pv(p, "mg") > 0.5) return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[600, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [900, yb]]},
                                                {I: 1, pts: [[880, yb], [620, yb]]}]};
  },
  u5s5two: function(p, L){
    var yt = U5S5YT, yb = U5S5YB, f = L.fl || [2, 1, 1], m = Math.max(f[0], f[1], f[2]);
    return {o: pv(p, "co"), base: 90 * m, paths: [
      {I: f[0], pts: [[600, yb], [478, yb], [478, yt], [760, yt]]},
      {I: f[1], pts: [[760, yt], [1045, yt], [1045, yb], [900, yb]]},
      {I: f[1], pts: [[880, yb], [760, yb]]},
      {I: f[2], pts: [[760, yt], [760, yb]]},
      {I: f[0], pts: [[760, yb], [620, yb]]}]};
  },
  u5s6net: function(p, L){
    var X = U5S6X, Y = U5S6Y, f = L.fl || [1, 1], a = f[0], b = f[1], m = a - b, paths = [];
    // 左の枝（I1）・右の枝（I2）・真ん中（I1 − I2）。値が負なら逆向きにたどる
    function add(I, pts){ if (I > 0) paths.push({I: I, pts: pts}); else if (I < 0) paths.push({I: -I, pts: pts.slice().reverse()}); }
    add(a, [[X.l, Y.p], [X.l, Y.t], [X.m, Y.t]]); add(a, [[X.m, Y.b], [X.l, Y.b], [X.l, Y.s]]);
    add(b, [[X.m, Y.t], [X.r, Y.t], [X.r, Y.p]]); add(b, [[X.r, Y.s], [X.r, Y.b], [X.m, Y.b]]);
    add(m, [[X.m, Y.t], [X.m, Y.b]]);
    return {o: pv(p, "co"), base: 110 * Math.max(Math.abs(a), Math.abs(b), Math.abs(m)), paths: paths};
  },
  u5s7loop: function(p, L){
    return {o: pv(p, "co"), base: 150, paths: [{I: 1, pts: [[478, 450], [478, 360], [1045, 360], [1045, 450]]},
                                               {I: 1, pts: [[1045, 470], [1045, 560], [478, 560], [478, 470]]}]};
  },
  u5k1h18: function(p, L){            // 1つの閉回路（電流は1つ）
    var G = U5K1;
    return {o: pv(p, "co"), base: 130, paths: [
      {I: 1, pts: [[G.xl, 420], [G.xl, G.yt], [G.xr, G.yt], [G.xr, G.yb], [G.xl, G.yb], [G.xl, 436]]}]};
  },
  u5k2r6: function(p, L){            // 電流の比（×10）：I1 19・上の道 3・下の道 I2 16。電源（3 V・4 V）の2本の線の間は導線が無いので、通り道を分ける
    var G = U5K2, xl = G.xl, xp = G.xp, xo = G.xo, yt = G.yt, ym = G.ym, yb = G.yb;
    return {o: pv(p, "co"), base: 600, paths: [
      {I: 19, pts: [[xl, 392], [xl, yt], [xp, yt]]},
      {I: 3, pts: [[xp, yt], [G.xc - 8, yt]]}, {I: 3, pts: [[G.xc + 8, yt], [xo, yt], [xo, ym]]},
      {I: 16, pts: [[xp, yt], [xp, ym], [G.xc - 8, ym]]}, {I: 16, pts: [[G.xc + 8, ym], [xo, ym]]},
      {I: 19, pts: [[xo, ym], [xo, yb], [xl, yb], [xl, 408]]}]};
  },
  u5k3h27: function(p, L){            // 電流の比（×12）：I 12・I1 9・Ia 3・I2 2・Ib 1
    var G = u5k3G(L), Y = U5K3Y, xl = G.xl, x1 = G.x1, x2 = G.x2, x3 = G.x3, yt = Y.yt, yb = Y.yb;
    return {o: pv(p, "co"), base: 360, paths: [
      {I: 12, pts: [[xl, 392], [xl, yt], [x1, yt]]},
      {I: 9, pts: [[x1, yt], [x1, yb]]},
      {I: 3, pts: [[x1, yt], [x2, yt]]},
      {I: 2, pts: [[x2, yt], [x2, yb]]},
      {I: 1, pts: [[x2, yt], [x3, yt], [x3, yb], [x2, yb]]},
      {I: 3, pts: [[x2, yb], [x1, yb]]},
      {I: 12, pts: [[x1, yb], [xl, yb], [xl, 408]]}]};
  },
  u5k4h22: function(p, L){            // 解説の1つの回路。図1＝1本の道・図2＝R1 17：R2 12：150 Ω 5（0.34 A・0.24 A・0.1 A）・図3＝短絡した線だけ
    var f = (L.figs || [[0, 560, 250]])[0], ox = f[1], oy = f[2], X = ox + 220, XS = ox + 320, yb = oy + 160, yc = oy + 320;
    var top = [[ox, oy + 150], [ox, oy], [X, oy], [X, yb]], bot = [[X, yc], [ox, yc], [ox, oy + 170]];
    var paths;
    if (pv(p, "ssh") > 0.5) paths = [{I: 1, pts: top}, {I: 1, pts: [[X, yb], [XS, yb], [XS, yc], [X, yc]]}, {I: 1, pts: bot}];
    else if (pv(p, "s15") > 0.5) paths = [{I: 17, pts: top}, {I: 12, pts: [[X, yb], [X, yc]]}, {I: 5, pts: [[X, yb], [XS, yb], [XS, yc], [X, yc]]}, {I: 17, pts: bot}];
    else paths = [{I: 1, pts: top.concat([[X, yc]]).concat(bot.slice(1))}];
    var base = pv(p, "ssh") > 0.5 ? 150 : pv(p, "s15") > 0.5 ? 1000 : 150;
    return {o: pv(p, "co"), base: base, paths: paths};
  }
};

// 単元5の練習問題の作り方の、節の間で共通の道具。共通の道具（rngOf・pick・shuffled・choices・num・qv・qf・nice・distinct・fmt など）は tb_gen.js。
// 節の練習は u05/sN_gen.js（u05.py が番号順につなぎ、GEN を1つにまとめる）。このファイルは書き換えない（足したい道具は自分の節のファイルへ）。
// 言葉・式の選択肢。list の先頭が正しい物：[t, v, why]
function rule5(r, text, fig, list, ex, form){
  var c = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
  return {form: form, text: text, fig: fig, ch: c.ch, ans: c.ans, ex: ex, chk: {form: form, p: {}}};
}
// 数字の選択肢：値が小数3けたで割り切れ・4つが重ならず・どれも 0 より大きい物だけ（呼ぶ側で決め直す）
function okNums5(ok, w){ return nice(ok) && ok > 0 && w.every(function(z){ return nice(z.x) && z.x > 0; }) && distinct([ok].concat(w.map(function(z){ return z.x; }))); }
function int5(x){ return Math.abs(x - Math.round(x)) < 1e-9; }
function r35(x){ return Math.round(x * 1000) / 1000; }        // 割り算の誤差（7.199999… など）を3けたに丸める
function gcd5(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
// 比を簡単にした文字（[6, 2] → "3 : 1"）。整数の比だけ
function ratio5(a){ var g = a.reduce(function(x, y){ return gcd5(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function ohm5(k, v){ return "{R}" + k + "=" + qf(v, "O"); }     // 図の抵抗の名前と値（"{R}_1=6 Ω"）
var RS5 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 35, 36, 40, 45, 48, 50, 60, 70, 75, 80, 90, 100];
// 5-1 キルヒホッフの第1法則：どの点でも、入る電流の合計＝出る電流の合計。図は全問に付ける（u5s1node：1つの点に4本の導線）。
// 形：u5s1law（入る電流の合計と出る電流の合計の関係）／u5s1name（法則の名前）／u5s1eq（図の点で成り立つ式）／
//     u5s1num（3つの電流の値から残りの電流 I）／u5s1var（文字を含む電流 I・kI から I）。
// 枝の位置と矢印の id：左＝i1・上＝i2・右＝i3・下＝i4（式の記号 I_1〜I_4 もこの順）。入る・出るの組は問題ごとに変える。
// まちがいの選択肢は、よくある取り違え（入る・出るを分けずに全部足した・同じ側の電流を引いていない・入る・出るを取り違えた など）。理由を1行付ける。
// 第2法則（5-2〜）は出さない。
var U5S1P = ["l", "u", "r", "d"];
function u5s1fig(br, L){ return {kind: "u5s1node", L: Object.assign({br: br}, L), P: {}}; }
// 入る電流の数 nin（1〜3）の、入る・出るの組（{l: 1, u: 0, …}）
function u5s1pat(r, nin){
  var s = shuffled(r, U5S1P), br = {};
  s.forEach(function(pos, i){ br[pos] = i < nin ? 1 : 0; });
  return br;
}
function u5s1sym(n){ return "I_" + n; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u5s1three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;
    z = {x: r35(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 式の辺（"I + 5 + 2.5"）
function u5s1sum(a){ return a.map(function(x){ return typeof x === "string" ? x : fmt(x); }).join(" + "); }
var U5S1V = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
// 5-2 キルヒホッフの第2法則：どの閉回路でも、起電力の和＝電圧降下の和。図は全問に付ける（u5s2sp：電源・R1・R2 と R3 の並列。
// 左の閉回路（電源・R1・R2）に時計回りの矢印）。電流・電源の向きは閉回路の向きとそろう形だけ（向きが逆の時の符号は 5-3）。
// 形：u5s2loop（閉回路とは）／u5s2emf（起電力とは）／u5s2law（起電力の和と電圧降下の和の関係）／u5s2eq（図の閉回路の式）／
//     u5s2i2（V・R1・I1・R2 から I2）／u5s2v（R1・I1・R2・I2 から V）／u5s2i1（V・R1・R2・I2 から I1）／u5s2r2（V・R1・I1・I2 から R2）。
// 数字は回路として成り立つ物だけ（I2 < I1＝R3 にも電流が流れる）。図に出す値は問題で決まっている物だけ。
// まちがいの選択肢は、よくある取り違え（R1 の電圧降下を引いていない・電流と抵抗の組を取り違えた・R2 にも I1 が流れると考えた など）。理由を1行付ける。
function u5s2fig(L){ return {kind: "u5s2sp", L: Object.assign({pm: 1, la: 1, src: "{V}", r1: "{R}_1", r2: "{R}_2", r3: "{R}_3"}, L), P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u5s2three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;
    z = {x: r35(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
var U5S2R = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30];
var U5S2I = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
// 回路の値（R1・R2・I1・I2・V）。I2 < I1、V は 300 V まで
function u5s2vals(r){
  var R1, R2, I1, I2, V;
  for (;;) {
    R1 = pick(r, U5S2R); R2 = pick(r, U5S2R); I1 = pick(r, U5S2I); I2 = pick(r, U5S2I);
    if (I2 >= I1) continue;
    V = r35(I1 * R1 + I2 * R2);
    if (V > 300 || !nice(V)) continue;
    return {R1: R1, R2: R2, I1: I1, I2: I2, V: V};
  }
}
var U5S2EQ = "電源・$R_1$・$R_2$ を通る閉回路で、起電力の和＝電圧降下の和　$V = I_1 R_1 + I_2 R_2$";
// 5-3 閉回路の向きと符号：電圧降下は、閉回路の向きと電流の向きが同じなら正・逆なら負。電源も、閉回路の向きに進んで－極から＋極なら正・逆なら負。
// 電源の無い閉回路は起電力の和が 0。外側を一周する閉回路でも式が立つ。図は全問に付ける（u5s3sp：5-2 と同じ回路）。
// 形：u5s3sign（向きが逆の電圧降下の符号）／u5s3src（向きが逆の電源の符号）／u5s3right（右の閉回路の式・時計回りか反時計回り）／
//     u5s3ccw（左の閉回路を反時計回りにした式）／u5s3outer（外側の閉回路の式）／
//     u5s3i3（右の閉回路：R2・I2・R3 から I3）／u5s3i2（右の閉回路：R2・R3・I3 から I2）／u5s3o3（外側の閉回路：V・R1・I1・R3 から I3）。
// 数字は回路として成り立つ物だけ（I3 < I1）。図に出す値は問題で決まっている物だけ。
// 直列の電源をまとめる（5-4）・ループ電流法（5-5）・連立方程式（5-6）は出さない。
function u5s3fig(L){ return {kind: "u5s3sp", L: Object.assign({pm: 1, src: "{V}", r1: "{R}_1", r2: "{R}_2", r3: "{R}_3", i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"}, L), P: {}}; }
function u5s3three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;
    z = {x: r35(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
var U5S3R = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30];
var U5S3I = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
// 5-4 直列の電源をまとめる：直列の2つの電源は、向きを見て1つにまとめられる（同じ向き＝足す・逆向き＝引く）。
// 1つの閉回路の起電力の和＝電圧降下の和（向きが逆の電源は －）。まとめた電源でオームの法則。図は全問に付ける（u5s4ser）。
// 形：u5s4how（まとめた電源の式）／u5s4eq（閉回路の式）／u5s4v（まとめた電源の電圧）／u5s4i（電流）／u5s4r（抵抗）。
// 電流 I の向きは大きい方の電源が押す向き（逆向きの電源は小さい方）。負の答え（5-6）は出さない。
// まちがいの選択肢は、よくある取り違え（向きを見ずに足した・引いた・片方の電源を入れなかった・掛けた など）。理由を1行付ける。
function u5s4fig(L){ return {kind: "u5s4ser", L: Object.assign({pm: 1, r: "{R}", i: "{I}"}, L), P: {}}; }
// 電源の向き：0＝同じ向き・1＝V1 が逆向き・2＝V2 が逆向き。返す物＝[d1, d2]
function u5s4dir(c){ return c === 1 ? [-1, 1] : c === 2 ? [1, -1] : [1, 1]; }
// まちがいの候補から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u5s4three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (!nice(z.x)) return;                     // 丸める前の値で割り切れるかを見る（丸めた後は必ず割り切れて素通りするため。2026-11-04）
    z = {x: r35(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 2つの電源の値（向き c に合わせる：逆向きがある時は、電流と同じ向きの電源の方を大きく）
function u5s4pair(r, c){
  var a, b;
  for (;;) {
    a = pick(r, [2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 48, 50, 60]);
    b = pick(r, [2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 48, 50, 60]);
    if (a === b) continue;
    if (c === 1 && a > b) continue;      // V1 が逆向き → V2 が大きい
    if (c === 2 && b > a) continue;      // V2 が逆向き → V1 が大きい
    return [a, b];
  }
}
// 5-5 ループ電流法で式を立てる：①電流を決める（R3 の電流は新しい文字を置かず I1 − I2）②閉回路と向きを決める（分からない電流の数だけ）
// ③起電力の和＝電圧降下の和で式を立てる（向きが逆なら －）。式を立てるまで（解くのは 5-6）。図は全問に付ける（u5s5two）。
// 形：u5s5mid（R3 の電流を I1・I2 で）／u5s5left（左の閉回路の式）／u5s5right（右の閉回路の式）／u5s5count（要る閉回路の数）。
// 回路の値は、I1 > I2 > 0 になる物から作る（電流の値は出さない）。V2 の向きは回路の値で決まる（逆向きもある）。
// 式の選択肢の値＝式の中身を表す記号（電源の係数と、抵抗ごとの I1・I2 の係数）。s5_check.py が閉回路を一周して同じ記号を作る。
function u5s5fig(C, L){
  return {kind: "u5s5two", L: Object.assign({pm: 1, d1: 1, d2: C.d2, s1: "{V}_1=" + qf(C.V1, "V"), s2: "{V}_2=" + qf(C.V2, "V"),
    r1: ohm5("_1", C.R1), r2: ohm5("_2", C.R2), r3: ohm5("_3", C.R3), i1: "{I}_1", i2: "{I}_2", i3: "{I}_1−{I}_2",
    zp: [C.V1, C.R3 * (C.I1 - C.I2), C.R3 * (C.I1 - C.I2) - C.R2 * C.I2, 0]}, L), P: {}};
}
// 回路の値（R は3つとも違う値）
function u5s5circ(r){
  for (;;) {
    var R1 = pick(r, [2, 3, 4, 5, 6, 8, 10]), R2 = pick(r, [2, 3, 4, 5, 6, 8, 10]), R3 = pick(r, [2, 3, 4, 5, 6, 8, 10]);
    if (R1 === R2 || R2 === R3 || R1 === R3) continue;
    var I1 = pick(r, [2, 3, 4, 5, 6]), I2 = pick(r, [1, 2, 3, 4, 5]);
    if (I2 >= I1) continue;
    var V1 = R1 * I1 + R3 * (I1 - I2), e2 = R2 * I2 - R3 * (I1 - I2);
    if (e2 === 0 || V1 > 100 || Math.abs(e2) > 100) continue;
    return {R1: R1, R2: R2, R3: R3, I1: I1, I2: I2, V1: V1, V2: Math.abs(e2), d2: e2 > 0 ? 1 : -1};
  }
}
// 式 E＝{v: [V1 の係数, V2 の係数], r: {R1: [I1 の係数, I2 の係数], R2: …, R3: …}} の記号と、数字を入れた式
function u5s5code(E){ return "v" + E.v.join(",") + "|" + ["R1", "R2", "R3"].map(function(k){ return k + ":" + (E.r[k] || [0, 0]).join(","); }).join("|"); }
function u5s5tex(E, C){
  var L = [], R = [];
  [[E.v[0], C.V1], [E.v[1], C.V2]].forEach(function(q){ if (q[0]) L.push([q[0], fmt(q[1])]); });
  ["R1", "R2", "R3"].forEach(function(k){
    var c = E.r[k]; if (!c || (!c[0] && !c[1])) return;
    var s, t;
    if (c[0] && c[1]) { s = c[0]; t = "(I_1 - I_2)"; } else if (c[0]) { s = c[0]; t = "I_1"; } else { s = c[1]; t = "I_2"; }
    R.push([s, fmt(C[k]) + " " + t]);
  });
  function side(a){ return a.map(function(q, i){ return (i ? (q[0] > 0 ? " + " : " - ") : (q[0] > 0 ? "" : "-")) + q[1]; }).join(""); }
  return "$" + side(L) + " = " + side(R) + "$";
}
function u5s5copy(E){ return {v: E.v.slice(), r: {R1: (E.r.R1 || [0, 0]).slice(), R2: (E.r.R2 || [0, 0]).slice(), R3: (E.r.R3 || [0, 0]).slice()}}; }
// 5-6 連立方程式を解く：ループ電流法で立てた2つの式を、カッコを外してまとめ、係数をそろえて足すか引いて1つの文字を消し、出た値をもう一方の式に入れる。
// 答えが負なら、決めた向きと逆に流れている。真ん中の電流は I1 − I2。図は全問に付ける（u5s6net・左右の電源の＋極は上）。
// 回路の式（閉回路はどちらも右回り＝5-5 と同じ）：V1 = R1 I1 + R3 (I1 − I2)、−V2 = R2 I2 − R3 (I1 − I2)。
// 形：u5s6solve（2つの式から I1 か I2）／u5s6back（I2 が分かった後に、まとめた式から I1）／u5s6mid（I1・I2 から真ん中の電流）／
//     u5s6neg（負の答えの読み方）。まちがいの選択肢は、よくある取り違え（もう一方の電流・真ん中の電流・符号・カッコを外す時の符号 など）。
// 式の立て方（5-5）・電位（5-7）は出さない。
function u5s6fig(L){
  return {kind: "u5s6net", L: Object.assign({pm: 1, loop: 1, i1: "{I}_1", i2: "{I}_2", i3: "({I}_1−{I}_2)"}, L), P: {}};
}
// 係数つきの文字（1 は書かない・−1 は − だけ）
function u5s6co(a, s){ return a === 1 ? s : a === -1 ? "-" + s : fmt(a) + s; }
// 「+ 項」「- 項」の形で後ろに足す
function u5s6pl(a, s){ return a < 0 ? " - " + u5s6co(-a, s) : " + " + u5s6co(a, s); }
// 式の左辺と右辺（a I1 + b I2 の形）
function u5s6eq(v, a, b){ return fmt(v) + " = " + u5s6co(a, "I_1") + u5s6pl(b, "I_2"); }
// まちがいの候補から、正しい値と重ならない・小数3けたで割り切れる・0 でない物を前から3つ。足りなければ null
function u5s6three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (z.x === null || !isFinite(z.x) || !nice(z.x)) return;     // 割り切れない値（11.111… など）は使わない
    z = {x: r35(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x !== 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 数字の選択肢（負の値もある）
function u5s6num(r, u, ok, w){
  return choices(r, [{t: "$" + qv(ok, u) + "$", v: ok}].concat(w.map(function(z){ return {t: "$" + qv(z.x, u) + "$", v: z.x, why: z.why}; })));
}
function u5s6gcd(a, b){ return gcd5(a, b) || 1; }
// 回路を1つ作る：R1・R2・R3・I1・I2（I1 − I2 > 0）・V1・V2（どちらも正の整数・150 V まで）
function u5s6circ(r){
  var R1, R2, R3, I1, I2, V1, V2;
  for (;;) {
    R1 = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]); R2 = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]); R3 = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
    I1 = pick(r, [1, 2, 3, 4, 5, 6, 7, 8]); I2 = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
    if (I1 - I2 <= 0) continue;
    V1 = R1 * I1 + R3 * (I1 - I2); V2 = -R2 * I2 + R3 * (I1 - I2);
    if (V1 > 0 && V2 > 0 && V1 <= 150 && V2 <= 150 && V1 !== V2) break;
  }
  return {R1: R1, R2: R2, R3: R3, I1: I1, I2: I2, V1: V1, V2: V2, a1: R1 + R3, b1: R3, a2: R2 + R3};
}
function u5s6lab(c){ return {v1: "{V}_1=" + qf(c.V1, "V"), v2: "{V}_2=" + qf(c.V2, "V"), r1: ohm5("_1", c.R1), r2: ohm5("_2", c.R2), r3: ohm5("_3", c.R3)}; }
// 2つの式（カッコのある形）
function u5s6raw(c){
  return ["$" + fmt(c.V1) + " = " + u5s6co(c.R1, "I_1") + " + " + u5s6co(c.R3, "(I_1 - I_2)") + "$",
          "$" + fmt(-c.V2) + " = " + u5s6co(c.R2, "I_2") + " - " + u5s6co(c.R3, "(I_1 - I_2)") + "$"];
}
// 2つの式 v1 = a I1 + b I2・v2 = c I1 + d I2 を解く（クラメルでなく、作った値と比べるための素直な消去）
function u5s6sol(v1, a, b, v2, c, d){
  var D = a * d - b * c;
  if (D === 0) return null;
  return [(v1 * d - b * v2) / D, (a * v2 - v1 * c) / D];
}
// 5-7 電位の基準を決める：電源が2つ以上ある時は、1つの点を 0 V と決め、電圧の上がり下がりを順に足してそれぞれの点の電位を出す。
// 電源を－から＋へ通ると電源の電圧だけ上がり、＋から－へは下がる。抵抗を電流の向きに通ると RI 下がる。電位は負になることもある。
// 図は全問に付ける（u5s7loop・電流 I は右回りで図に書く・点 a〜d・0 V と決めた点だけ電位を書く。帯は出さない＝色の順が答えになるため）。
// 形：u5s7pot（0 V の点を決めて、ほかの点の電位）／u5s7low（一番低い点）／u5s7rule（決まりの言葉）。
// まちがいの選択肢は、よくある取り違え（上がり下がりを逆・抵抗で上がると考えた・電源の向きを逆に読んだ・V1 の－極を 0 V とした など）。
function u5s7fig(L){ return {kind: "u5s7loop", L: Object.assign({pm: 1}, L), P: {}}; }
// 回路を1つ作る：R1・R2・I・V2・V2 の向き o2（"t"＝＋極が上＝V1 と向かい合う・"b"＝＋極が下＝同じ向き）。V1 は I が右回りに流れる値
function u5s7circ(r){
  var R1, R2, I, V1, V2, o2;
  for (;;) {
    R1 = pick(r, [1, 2, 3, 4, 5, 6, 8, 9, 10]); R2 = pick(r, [1, 2, 3, 4, 5, 6, 8, 9, 10]); I = pick(r, [1, 2, 3, 4, 5]);
    V2 = pick(r, [4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 30]); o2 = pick(r, ["t", "b"]);
    V1 = I * (R1 + R2) + (o2 === "t" ? V2 : -V2);
    if (V1 > 0 && V1 <= 150 && V1 !== V2 && R1 !== R2) break;
  }
  return {R1: R1, R2: R2, I: I, V1: V1, V2: V2, o2: o2};
}
// 右回りに d → a → b → c → d と通る時の上がり下がり（fR＝抵抗の向きを逆にした・fS＝V2 の向きを逆に読んだ）
function u5s7steps(c, fR, fS){
  var s2 = (c.o2 === "t" ? -1 : 1) * (fS ? -1 : 1), sr = fR ? 1 : -1;
  return {d: c.V1, a: sr * c.R1 * c.I, b: s2 * c.V2, c: sr * c.R2 * c.I};   // その点から次の点へ進む時の上がり下がり
}
var U5S7N = {d: "a", a: "b", b: "c", c: "d"};
// 点 from を 0 V として、右回りに to まで足す。返り値＝[電位, 足した数の並び]
function u5s7walk(c, from, to, fR, fS){
  var st = u5s7steps(c, fR, fS), k = from, v = 0, terms = [];
  while (k !== to) { terms.push(st[k]); v += st[k]; k = U5S7N[k]; }
  return [v, terms];
}
function u5s7lab(c, ref){
  var L = {o2: c.o2, v1: "{V}_1=" + qf(c.V1, "V"), v2: "{V}_2=" + qf(c.V2, "V"), r1: ohm5("_1", c.R1), r2: ohm5("_2", c.R2), i: "{I}=" + qf(c.I, "A"),
           pa: "", pb: "", pc: "", pd: ""};
  L["p" + ref] = "0 V";
  return L;
}
function u5s7three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    if (out.length < 3 && nice(z.x) && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
var GEN = {
  // 5-1 キルヒホッフの第1法則
  1: function(r){
    var f = pick(r, ["u5s1law", "u5s1name", "u5s1eq", "u5s1eq", "u5s1num", "u5s1num", "u5s1num", "u5s1var", "u5s1var"]);
    var br, c, ok, w, ins, outs, L = {}, q;
    if (f === "u5s1law" || f === "u5s1name") {
      br = u5s1pat(r, pick(r, [1, 2, 3]));
      U5S1P.forEach(function(pos, j){ L["i" + (j + 1)] = "{I}_" + (j + 1); });
      if (f === "u5s1law") {
        return rule5(r, "図のように、1つの点に線がつながっている。どの点でも、その点に入る電流の合計は、出る電流の合計と □。", u5s1fig(br, L),
          [["等しい", "eq"], ["等しくならず、出る電流の合計の方が小さい", "small", "点に入った電流は、なくならずにすべて出ていく"],
           ["線の数で決まる", "num", "線の数によらず、入る電流の合計と出る電流の合計は等しい"],
           ["抵抗の値で決まる", "res", "抵抗の値によらず、点に入る電流の合計と出る電流の合計は等しい"]],
          ["どの点でも、入る電流の合計＝出る電流の合計（キルヒホッフの第1法則）"], f);
      }
      return rule5(r, "どの点でも、その点に入る電流の合計と、出る電流の合計が等しいことを □ という。", u5s1fig(br, L),
        [["キルヒホッフの第1法則", "k1"], ["オームの法則", "ohm", "オームの法則は、電圧と抵抗と電流の関係　$V = RI$"],
         ["分流", "bunryu", "分流は、並列の抵抗に電流が分かれて流れること"], ["分圧", "bunatsu", "分圧は、直列の抵抗に電圧が分かれてかかること"]],
        ["入る電流の合計＝出る電流の合計　を、キルヒホッフの第1法則という"], f);
    }
    if (f === "u5s1eq") {               // 図の点で成り立つ式
      br = u5s1pat(r, pick(r, [1, 2, 2, 3]));
      ins = []; outs = [];
      U5S1P.forEach(function(pos, j){ L["i" + (j + 1)] = "{I}_" + (j + 1); (br[pos] ? ins : outs).push(j + 1); });
      var side = function(a){ return a.map(u5s1sym).join(" + "); };
      var key = function(a, b){ return a.join("") + "=" + b.join(""); };
      var cands = [];
      for (var m = 1; m < 15; m++) {
        var S = [1, 2, 3, 4].filter(function(k){ return m & (1 << (k - 1)); }), T = [1, 2, 3, 4].filter(function(k){ return !(m & (1 << (k - 1))); });
        if (S.indexOf(1) < 0) continue;                  // {S, T} と {T, S} は同じ式なので1つだけ
        if (key(S, T) === key(ins, outs) || key(T, S) === key(ins, outs)) continue;
        var sI = S.filter(function(k){ return ins.indexOf(k) >= 0; }).length, tI = T.filter(function(k){ return ins.indexOf(k) >= 0; }).length;
        if (tI > sI) { var t = S; S = T; T = t; }        // 左の辺＝入る電流が多い方
        var wIn = S.filter(function(k){ return ins.indexOf(k) < 0; }), wOut = T.filter(function(k){ return ins.indexOf(k) >= 0; }), why = [];
        if (wIn.length) why.push("$" + wIn.map(u5s1sym).join("$・$") + "$ は点から出る電流");
        if (wOut.length) why.push("$" + wOut.map(u5s1sym).join("$・$") + "$ は点に入る電流");
        cands.push(["$" + side(S) + " = " + side(T) + "$", key(S, T), "入る電流と出る電流の分け方がちがう（" + why.join("、") + "）"]);
      }
      q = rule5(r, "図の点で成り立つ式は □ である。", u5s1fig(br, L),
        [["$" + side(ins) + " = " + side(outs) + "$", key(ins, outs)]].concat(shuffled(r, cands).slice(0, 3)),
        ["点に入る電流は $" + ins.map(u5s1sym).join("$・$") + "$、出る電流は $" + outs.map(u5s1sym).join("$・$") + "$",
         "入る電流の合計＝出る電流の合計　$" + side(ins) + " = " + side(outs) + "$"], f);
      q.chk.p = {ins: ins};
      return q;
    }
    if (f === "u5s1num") {              // 3つの電流の値から残りの電流 I
      var pos0, vals, A, B, xin, sw, ow;
      for (;;) {
        br = u5s1pat(r, pick(r, [1, 2, 2, 3])); pos0 = pick(r, U5S1P); xin = br[pos0] === 1;
        vals = {}; A = 0; B = 0;
        U5S1P.forEach(function(pos){ if (pos === pos0) return; var v = pick(r, U5S1V); vals[pos] = v; if ((br[pos] === 1) === xin) B += v; else A += v; });
        ok = r35(A - B);
        if (!(ok > 0) || !nice(ok)) continue;
        sw = xin ? "入る" : "出る"; ow = xin ? "出る" : "入る";
        var cs = [{x: A + B, why: "入る電流と出る電流を分けずに、全部足した"}];
        if (B > 0) cs.push({x: A, why: "$I$ と同じく" + sw + "電流を、引いていない"});
        U5S1P.forEach(function(pos){
          if (pos === pos0) return;
          var v = vals[pos];
          if ((br[pos] === 1) === xin) cs.push({x: A - B + 2 * v, why: sw + "電流の $" + qv(v, "A") + "$ を、" + ow + "電流とした"});
          else cs.push({x: A - B - 2 * v, why: ow + "電流の $" + qv(v, "A") + "$ を、" + sw + "電流とした"});
        });
        w = u5s1three(ok, cs);
        if (w) break;
      }
      ins = []; outs = [];
      U5S1P.forEach(function(pos, j){
        L["i" + (j + 1)] = pos === pos0 ? "{I}" : qf(vals[pos], "A");
        (br[pos] ? ins : outs).push(pos === pos0 ? "I" : vals[pos]);
      });
      var rest = xin ? outs : ins, same = (xin ? ins : outs).filter(function(x){ return x !== "I"; });
      c = num(r, null, "A", ok, w);
      return {form: f, text: "図の点で、電流 $I$ は何 A か。", fig: u5s1fig(br, L), ch: c.ch, ans: c.ans,
              ex: ["入る電流の合計＝出る電流の合計　$" + u5s1sum(ins) + " = " + u5s1sum(outs) + "$",
                   "$I = " + u5s1sum(rest) + (same.length ? " - " + same.map(fmt).join(" - ") : "") + " = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {ins: ins, outs: outs}}};
    }
    // u5s1var：文字を含む電流（I と kI）。I の側に a、kI の側に b。I + a = kI + b → I = (a − b)/(k − 1)
    var k, I, a, b, xin2;
    for (;;) {
      k = pick(r, [2, 3, 4]); I = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5, 6]); b = pick(r, [0.5, 1, 1.5, 2, 3, 4, 5]);
      a = r35((k - 1) * I + b); ok = I;
      if (a > 20 || !nice(a)) continue;
      w = u5s1three(ok, [{x: (a - b) / k, why: "$I$ の側の $I$ を忘れて、$" + k + "I = " + fmt(a) + " - " + fmt(b) + "$ とした"},
                         {x: (a + b) / (k - 1), why: "数字を反対の辺へ移す時に、符号をまちがえた"},
                         {x: (a - b) / (k + 1), why: "$I$ を反対の辺へ移す時に、符号をまちがえた"},
                         {x: a - b, why: "$" + k + "I$ を $I$ と見た"}]);
      if (w) break;
    }
    br = u5s1pat(r, 2); xin2 = pick(r, [true, false]);
    var pin = U5S1P.filter(function(pos){ return br[pos] === 1; }), pout = U5S1P.filter(function(pos){ return br[pos] === 0; });
    var pI = xin2 ? pin : pout, pK = xin2 ? pout : pin, tI = shuffled(r, pI), tK = shuffled(r, pK);
    var lab = {}; lab[tI[0]] = "{I}"; lab[tI[1]] = qf(a, "A"); lab[tK[0]] = k + "{I}"; lab[tK[1]] = qf(b, "A");
    var ex0 = {}; ex0[tI[0]] = "I"; ex0[tI[1]] = fmt(a); ex0[tK[0]] = k + "I"; ex0[tK[1]] = fmt(b);
    U5S1P.forEach(function(pos, j){ L["i" + (j + 1)] = lab[pos]; });
    var exIn = pin.map(function(pos){ return ex0[pos]; }).join(" + "), exOut = pout.map(function(pos){ return ex0[pos]; }).join(" + ");
    c = num(r, null, "A", ok, w);
    return {form: "u5s1var", text: "図の点で、電流 $I$ は何 A か。", fig: u5s1fig(br, L), ch: c.ch, ans: c.ans,
            ex: ["入る電流の合計＝出る電流の合計　$" + exIn + " = " + exOut + "$",
                 "$" + (k - 1 === 1 ? "" : (k - 1)) + "I = " + fmt(a) + " - " + fmt(b) + "$　より　$I = " + qv(ok, "A") + "$"],
            chk: {form: "u5s1var", p: {a: a, b: b, k: k}}};
  },
  // 5-2 キルヒホッフの第2法則
  2: function(r){
    var f = pick(r, ["u5s2loop", "u5s2emf", "u5s2law", "u5s2eq", "u5s2eq", "u5s2i2", "u5s2i2", "u5s2v", "u5s2v", "u5s2i1", "u5s2r2"]);
    var P, ok, w, c, txt, L;
    if (f === "u5s2loop") {
      return rule5(r, "閉回路とは □ である。", u5s2fig({i1: "{I}_1", i2: "{I}_2"}),
        [["始めの点から線をたどって一周し、始めの点に戻る道", "loop"], ["電源から出て、抵抗を1つだけ通る道", "one", "閉回路は、一周して始めの点に戻る道"],
         ["電流が流れない道", "zero", "閉回路は電流が流れるかどうかでなく、一周して始めの点に戻る道"],
         ["抵抗の無い線だけでできた道", "wire", "閉回路は、抵抗や電源を通ってもよい。一周して始めの点に戻る道"]],
        ["回路の中で始めの点を決め、線をたどって一周し、始めの点に戻る道を閉回路という（向きがある）"], f);
    }
    if (f === "u5s2emf") {
      return rule5(r, "閉回路の中の電源の電圧を □ という。", u5s2fig({i1: "{I}_1", i2: "{I}_2"}),
        [["起電力", "emf"], ["電圧降下", "drop", "電圧降下は、抵抗で下がる電圧"], ["電位", "pot", "電位は、基準の点から見た高さ"],
         ["分圧", "bun", "分圧は、直列の抵抗に電圧が分かれてかかること"]],
        ["閉回路の中の電源の電圧を起電力という", "抵抗で下がる電圧は電圧降下"], f);
    }
    if (f === "u5s2law") {
      return rule5(r, "どの閉回路でも、起電力の和は、電圧降下の和と □。", u5s2fig({i1: "{I}_1", i2: "{I}_2"}),
        [["等しい", "eq"], ["等しくならず、電圧降下の和の方が大きい", "big", "起電力の和と電圧降下の和は等しい（キルヒホッフの第2法則）"],
         ["抵抗の数で決まる", "num", "抵抗の数によらず、起電力の和と電圧降下の和は等しい"],
         ["関係がない", "none", "起電力の和と電圧降下の和は等しい（キルヒホッフの第2法則）"]],
        ["どの閉回路でも、起電力の和＝電圧降下の和（キルヒホッフの第2法則）"], f);
    }
    if (f === "u5s2eq") {
      return rule5(r, "図の矢印の向きに、電源・$R_1$・$R_2$ を通って一周する閉回路で、成り立つ式は □ である。", u5s2fig({i1: "{I}_1", i2: "{I}_2"}),
        [["$V = I_1 R_1 + I_2 R_2$", "ok"], ["$V = I_1 R_2 + I_2 R_1$", "swap", "電流と抵抗の組を取り違えた（$R_1$ には $I_1$、$R_2$ には $I_2$）"],
         ["$V = I_1 R_1$", "one", "$R_2$ の電圧降下 $I_2 R_2$ を入れていない"],
         ["$V = I_1 (R_1 + R_2)$", "same", "$R_2$ に流れる電流は $I_2$（$I_1$ は $R_2$ と $R_3$ に分かれる）"]],
        ["起電力は $V$、電圧降下は $R_1$ の $I_1 R_1$ と $R_2$ の $I_2 R_2$", "起電力の和＝電圧降下の和　$V = I_1 R_1 + I_2 R_2$"], f);
    }
    if (f === "u5s2i2") {               // V・R1・I1・R2 から I2
      for (;;) {
        P = u5s2vals(r); ok = P.I2;
        w = u5s2three(ok, [{x: P.V / P.R2, why: "$R_1$ の電圧降下を引かずに、$V$ を $R_2$ で割った"},
                           {x: (P.V + P.I1 * P.R1) / P.R2, why: "$R_1$ の電圧降下を、引かずに足した"},
                           {x: P.I1, why: "$R_2$ にも $I_1$ が流れると考えた（$I_1$ は $R_2$ と $R_3$ に分かれる）"},
                           {x: (P.V - P.I1 * P.R2) / P.R1, why: "電流と抵抗の組を取り違えた"},
                           {x: P.I1 * P.R1 / P.R2, why: "$R_1$ の電圧降下を、そのまま $R_2$ で割った"}]);
        if (w) break;
      }
      c = num(r, null, "A", ok, w);
      txt = "図の回路で、電源の電圧は $V = " + qv(P.V, "V") + "$、$R_1 = " + qv(P.R1, "O") + "$、$R_2 = " + qv(P.R2, "O") + "$ で、"
          + "$R_1$ に流れる電流は $I_1 = " + qv(P.I1, "A") + "$ である。$R_2$ に流れる電流 $I_2$ は何 A か。";
      L = {src: "{V}=" + qf(P.V, "V"), r1: ohm5("_1", P.R1), r2: ohm5("_2", P.R2), i1: "{I}_1=" + qf(P.I1, "A"), i2: "{I}_2"};
      return {form: f, text: txt, fig: u5s2fig(L), ch: c.ch, ans: c.ans,
              ex: [U5S2EQ, "$" + fmt(P.V) + " = " + fmt(P.I1) + " \\times " + fmt(P.R1) + " + " + fmt(P.R2) + " I_2$　より　$I_2 = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {V: P.V, R1: P.R1, I1: P.I1, R2: P.R2}}};
    }
    if (f === "u5s2v") {                // R1・I1・R2・I2 から V
      for (;;) {
        P = u5s2vals(r); ok = P.V;
        w = u5s2three(ok, [{x: P.I1 * P.R1, why: "$R_2$ の電圧降下 $I_2 R_2$ を入れていない"},
                           {x: P.I1 * P.R2 + P.I2 * P.R1, why: "電流と抵抗の組を取り違えた"},
                           {x: P.I1 * (P.R1 + P.R2), why: "$R_2$ にも $I_1$ が流れると考えた"},
                           {x: P.I1 * P.R1 - P.I2 * P.R2, why: "$R_2$ の電圧降下を引いた"}]);
        if (w) break;
      }
      c = num(r, null, "V", ok, w);
      txt = "図の回路で、$R_1 = " + qv(P.R1, "O") + "$ に $I_1 = " + qv(P.I1, "A") + "$、$R_2 = " + qv(P.R2, "O") + "$ に $I_2 = " + qv(P.I2, "A") + "$ の電流が流れている。"
          + "電源の電圧 $V$ は何 V か。";
      L = {r1: ohm5("_1", P.R1), r2: ohm5("_2", P.R2), i1: "{I}_1=" + qf(P.I1, "A"), i2: "{I}_2=" + qf(P.I2, "A")};
      return {form: f, text: txt, fig: u5s2fig(L), ch: c.ch, ans: c.ans,
              ex: [U5S2EQ, "$V = " + fmt(P.I1) + " \\times " + fmt(P.R1) + " + " + fmt(P.I2) + " \\times " + fmt(P.R2) + " = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {R1: P.R1, I1: P.I1, R2: P.R2, I2: P.I2}}};
    }
    if (f === "u5s2i1") {               // V・R1・R2・I2 から I1
      for (;;) {
        P = u5s2vals(r); ok = P.I1;
        w = u5s2three(ok, [{x: P.V / P.R1, why: "$R_2$ の電圧降下を引かずに、$V$ を $R_1$ で割った"},
                           {x: (P.V + P.I2 * P.R2) / P.R1, why: "$R_2$ の電圧降下を、引かずに足した"},
                           {x: P.I2, why: "$R_1$ にも $I_2$ が流れると考えた（$I_1$ は $R_2$ と $R_3$ に分かれる）"},
                           {x: (P.V - P.I2 * P.R1) / P.R2, why: "電流と抵抗の組を取り違えた"}]);
        if (w) break;
      }
      c = num(r, null, "A", ok, w);
      txt = "図の回路で、電源の電圧は $V = " + qv(P.V, "V") + "$、$R_1 = " + qv(P.R1, "O") + "$、$R_2 = " + qv(P.R2, "O") + "$ で、"
          + "$R_2$ に流れる電流は $I_2 = " + qv(P.I2, "A") + "$ である。$R_1$ に流れる電流 $I_1$ は何 A か。";
      L = {src: "{V}=" + qf(P.V, "V"), r1: ohm5("_1", P.R1), r2: ohm5("_2", P.R2), i1: "{I}_1", i2: "{I}_2=" + qf(P.I2, "A")};
      return {form: f, text: txt, fig: u5s2fig(L), ch: c.ch, ans: c.ans,
              ex: [U5S2EQ, "$" + fmt(P.V) + " = " + fmt(P.R1) + " I_1 + " + fmt(P.I2) + " \\times " + fmt(P.R2) + "$　より　$I_1 = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {V: P.V, R1: P.R1, R2: P.R2, I2: P.I2}}};
    }
    for (;;) {                          // u5s2r2：V・R1・I1・I2 から R2
      P = u5s2vals(r); ok = P.R2;
      w = u5s2three(ok, [{x: P.V / P.I2, why: "$R_1$ の電圧降下を引かずに、$V$ を $I_2$ で割った"},
                         {x: (P.V - P.I1 * P.R1) / P.I1, why: "$R_2$ にも $I_1$ が流れると考えた"},
                         {x: (P.V + P.I1 * P.R1) / P.I2, why: "$R_1$ の電圧降下を、引かずに足した"},
                         {x: P.R1, why: "$R_1$ と同じ抵抗と考えた"}]);
      if (w) break;
    }
    c = num(r, null, "O", ok, w);
    txt = "図の回路で、電源の電圧は $V = " + qv(P.V, "V") + "$、$R_1 = " + qv(P.R1, "O") + "$ で、$R_1$ に $I_1 = " + qv(P.I1, "A") + "$、"
        + "$R_2$ に $I_2 = " + qv(P.I2, "A") + "$ の電流が流れている。$R_2$ は何 Ω か。";
    L = {src: "{V}=" + qf(P.V, "V"), r1: ohm5("_1", P.R1), i1: "{I}_1=" + qf(P.I1, "A"), i2: "{I}_2=" + qf(P.I2, "A")};
    return {form: "u5s2r2", text: txt, fig: u5s2fig(L), ch: c.ch, ans: c.ans,
            ex: [U5S2EQ, "$" + fmt(P.V) + " = " + fmt(P.I1) + " \\times " + fmt(P.R1) + " + " + fmt(P.I2) + " R_2$　より　$R_2 = " + qv(ok, "O") + "$"],
            chk: {form: "u5s2r2", p: {V: P.V, R1: P.R1, I1: P.I1, I2: P.I2}}};
  },
  // 5-3 閉回路の向きと符号
  3: function(r){
    var f = pick(r, ["u5s3sign", "u5s3src", "u5s3right", "u5s3right", "u5s3ccw", "u5s3outer", "u5s3i3", "u5s3i3", "u5s3i2", "u5s3o3", "u5s3o3"]);
    var ok, w, c, R1, R2, R3, I1, I2, I3, V, cw;
    if (f === "u5s3sign") {
      return rule5(r, "閉回路の向きと電流の向きが逆の時、その抵抗の電圧降下は □ とする。", u5s3fig({lb: 1}),
        [["負", "neg"], ["正", "pos", "向きが同じなら正、逆なら負"], ["0", "zero", "向きが逆でも電圧降下はある。負とする"],
         ["式に入れない", "skip", "向きが逆でも式に入れる。負とする"]],
        ["閉回路の向きと電流の向きが同じなら正、逆なら負"], f);
    }
    if (f === "u5s3src") {
      return rule5(r, "閉回路の向きに進んで、電源を＋極から－極へ通る時、その起電力は □ とする。", u5s3fig({la: -1}),
        [["負", "neg"], ["正", "pos", "－極から＋極へ通るなら正、＋極から－極へ通るなら負"],
         ["0", "zero", "向きが逆でも起電力はある。負とする"], ["式に入れない", "skip", "向きが逆でも式に入れる。負とする"]],
        ["閉回路の向きに進んで、電源を－極から＋極へ通るなら正、＋極から－極へ通るなら負"], f);
    }
    if (f === "u5s3right") {            // 右の閉回路（電源なし）の式
      cw = pick(r, [1, -1]);
      var okT = cw > 0 ? "$0 = -I_2 R_2 + I_3 R_3$" : "$0 = I_2 R_2 - I_3 R_3$";
      return rule5(r, "図の矢印の向きに、$R_2$ と $R_3$ を通って一周する閉回路で、成り立つ式は □ である。", u5s3fig({lb: cw}),
        [[okT, "ok"], ["$0 = I_2 R_2 + I_3 R_3$", "nosign", "向きが逆の電圧降下を、負にしていない"],
         [cw > 0 ? "$V = -I_2 R_2 + I_3 R_3$" : "$V = I_2 R_2 - I_3 R_3$", "emf", "この閉回路は電源を通らないので、起電力の和は 0"],
         [cw > 0 ? "$0 = -I_2 R_3 + I_3 R_2$" : "$0 = I_2 R_3 - I_3 R_2$", "swap", "電流と抵抗の組を取り違えた（$R_2$ には $I_2$、$R_3$ には $I_3$）"]],
        [cw > 0 ? "$R_2$ では閉回路は上向き・$I_2$ は下向き（逆なので負）、$R_3$ では閉回路も $I_3$ も下向き（正）"
                : "$R_2$ では閉回路も $I_2$ も下向き（正）、$R_3$ では閉回路は上向き・$I_3$ は下向き（逆なので負）",
         "電源が無いので起電力の和は 0　" + okT], f);
    }
    if (f === "u5s3ccw") {              // 左の閉回路を反時計回りに
      return rule5(r, "図の矢印の向き（反時計回り）に、電源・$R_1$・$R_2$ を通って一周する閉回路で、成り立つ式は □ である。", u5s3fig({la: -1}),
        [["$-V = -I_1 R_1 - I_2 R_2$", "ok"], ["$V = -I_1 R_1 - I_2 R_2$", "src", "電源も閉回路の向きと逆（＋極から－極へ通る）なので負"],
         ["$-V = I_1 R_1 + I_2 R_2$", "drop", "電流も閉回路の向きと逆なので、電圧降下も負"],
         ["$V = I_1 R_1 - I_2 R_2$", "one", "$I_1$ も $I_2$ も閉回路の向きと逆。どちらも同じ符号"]],
        ["電源は＋極から－極へ通り（負）、$I_1$・$I_2$ も閉回路の向きと逆（負）", "$-V = -I_1 R_1 - I_2 R_2$"], f);
    }
    if (f === "u5s3outer") {            // 外側の閉回路の式
      return rule5(r, "図の外側の矢印の向きに、電源・$R_1$・$R_3$ を通って外側を一周する閉回路で、成り立つ式は □ である。", u5s3fig({lo: 1}),
        [["$V = I_1 R_1 + I_3 R_3$", "ok"], ["$V = I_1 R_1 + I_2 R_2 + I_3 R_3$", "all", "外側の閉回路は $R_2$ を通らない"],
         ["$0 = I_1 R_1 + I_3 R_3$", "zero", "この閉回路は電源を通るので、起電力は $V$"],
         ["$V = I_1 R_1 - I_3 R_3$", "neg", "$I_3$ の向きは閉回路の向きと同じなので正"]],
        ["起電力は $V$、電圧降下は $R_1$ の $I_1 R_1$ と $R_3$ の $I_3 R_3$（どれも向きが同じで正）", "$V = I_1 R_1 + I_3 R_3$"], f);
    }
    if (f === "u5s3i3" || f === "u5s3i2") {      // 右の閉回路（時計回り）：0 = −I2 R2 + I3 R3
      for (;;) {
        R2 = pick(r, U5S3R); R3 = pick(r, U5S3R); if (R2 === R3) continue;
        if (f === "u5s3i3") {
          I2 = pick(r, U5S3I); if (!nice(I2 * R2 / R3)) continue; ok = I3 = r35(I2 * R2 / R3);
          w = u5s3three(ok, [{x: I2 * R3 / R2, why: "$R_2$ と $R_3$ を取り違えた"}, {x: I2, why: "$I_3$ も $I_2$ と同じ電流と考えた"},
                             {x: I2 * R2, why: "$R_2$ の電圧降下の値を、そのまま電流とした"}, {x: I2 * R2 / (R2 + R3), why: "$R_2$ の電圧降下を、$R_2 + R_3$ で割った"}]);
        } else {
          I3 = pick(r, U5S3I); if (!nice(I3 * R3 / R2)) continue; ok = I2 = r35(I3 * R3 / R2);
          w = u5s3three(ok, [{x: I3 * R2 / R3, why: "$R_2$ と $R_3$ を取り違えた"}, {x: I3, why: "$I_2$ も $I_3$ と同じ電流と考えた"},
                             {x: I3 * R3, why: "$R_3$ の電圧降下の値を、そのまま電流とした"}, {x: I3 * R3 / (R2 + R3), why: "$R_3$ の電圧降下を、$R_2 + R_3$ で割った"}]);
        }
        if (nice(ok) && ok <= 30 && w) break;
      }
      c = num(r, null, "A", ok, w);
      var known = f === "u5s3i3" ? "I_2" : "I_3", want = f === "u5s3i3" ? "I_3" : "I_2", kv = f === "u5s3i3" ? I2 : I3;
      var L3 = {lb: 1, r2: ohm5("_2", R2), r3: ohm5("_3", R3)};
      if (f === "u5s3i3") { L3.i2 = "{I}_2=" + qf(I2, "A"); L3.i3 = "{I}_3"; } else { L3.i3 = "{I}_3=" + qf(I3, "A"); L3.i2 = "{I}_2"; }
      return {form: f, text: "図の回路で、$R_2 = " + qv(R2, "O") + "$、$R_3 = " + qv(R3, "O") + "$ で、$" + known + " = " + qv(kv, "A") + "$ である。"
                    + "図の矢印の向きに $R_2$ と $R_3$ を通って一周する閉回路で考えると、$" + want + "$ は何 A か。",
              fig: u5s3fig(L3), ch: c.ch, ans: c.ans,
              ex: ["電源が無いので起電力の和は 0。$R_2$ は向きが逆（負）、$R_3$ は同じ（正）　$0 = -I_2 R_2 + I_3 R_3$",
                   (f === "u5s3i3" ? "$0 = -" + fmt(I2) + " \\times " + fmt(R2) + " + " + fmt(R3) + " I_3$"
                                   : "$0 = -" + fmt(R2) + " I_2 + " + fmt(I3) + " \\times " + fmt(R3) + "$")
                   + "　より　$" + want + " = " + qv(ok, "A") + "$"],
              chk: {form: f, p: f === "u5s3i3" ? {R2: R2, R3: R3, I2: I2} : {R2: R2, R3: R3, I3: I3}}};
    }
    for (;;) {                          // u5s3o3：外側の閉回路 V = I1 R1 + I3 R3 から I3
      R1 = pick(r, U5S3R); R3 = pick(r, U5S3R); I1 = pick(r, U5S3I); I3 = pick(r, U5S3I);
      if (I3 >= I1) continue;
      V = r35(I1 * R1 + I3 * R3); ok = I3;
      if (V > 300 || !nice(V)) continue;
      w = u5s3three(ok, [{x: V / R3, why: "$R_1$ の電圧降下を引かずに、$V$ を $R_3$ で割った"},
                         {x: (V + I1 * R1) / R3, why: "$R_1$ の電圧降下を、引かずに足した"},
                         {x: I1, why: "$R_3$ にも $I_1$ が流れると考えた（$I_1$ は $R_2$ と $R_3$ に分かれる）"},
                         {x: (V - I1 * R3) / R1, why: "電流と抵抗の組を取り違えた"}]);
      if (w) break;
    }
    c = num(r, null, "A", ok, w);
    return {form: "u5s3o3", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1 = " + qv(R1, "O") + "$、$R_3 = " + qv(R3, "O") + "$ で、"
                  + "$R_1$ に流れる電流は $I_1 = " + qv(I1, "A") + "$ である。図の外側の矢印の向きに一周する閉回路で考えると、$R_3$ に流れる電流 $I_3$ は何 A か。",
            fig: u5s3fig({lo: 1, src: "{V}=" + qf(V, "V"), r1: ohm5("_1", R1), r3: ohm5("_3", R3), i1: "{I}_1=" + qf(I1, "A")}), ch: c.ch, ans: c.ans,
            ex: ["外側の閉回路で、起電力の和＝電圧降下の和　$V = I_1 R_1 + I_3 R_3$",
                 "$" + fmt(V) + " = " + fmt(I1) + " \\times " + fmt(R1) + " + " + fmt(R3) + " I_3$　より　$I_3 = " + qv(ok, "A") + "$"],
            chk: {form: "u5s3o3", p: {V: V, R1: R1, I1: I1, R3: R3}}};
  },
  // 5-4 直列の電源をまとめる
  4: function(r){
    var f = pick(r, ["u5s4how", "u5s4eq", "u5s4v", "u5s4v", "u5s4i", "u5s4i", "u5s4i", "u5s4r"]);
    var c = pick(r, [0, 0, 1, 2]), D = u5s4dir(c), P, V1, V2, V, R, I, ok, w, ch, same = c === 0;
    var dl = same ? {d1: 1, d2: 1} : {d1: D[0], d2: D[1]};
    if (f === "u5s4how") {
      var okt = same ? "$V_1 + V_2$" : c === 1 ? "$V_2 - V_1$" : "$V_1 - V_2$";
      var list = same
        ? [[okt, "sum"], ["$V_2 - V_1$", "d21", "同じ向きの電源なのに、引いた"], ["$V_1 - V_2$", "d12", "同じ向きの電源なのに、引いた"],
           ["$V_1 \\times V_2$", "mul", "電圧どうしを掛けた（直列の電源は、向きを見て足すか引く）"]]
        : [[okt, c === 1 ? "d21" : "d12"], ["$V_1 + V_2$", "sum", "逆向きの電源なのに、足した"],
           [c === 1 ? "$V_1 - V_2$" : "$V_2 - V_1$", c === 1 ? "d12" : "d21", "引く順が逆（電流と同じ向きの、大きい方から引く）"],
           ["$V_1 \\times V_2$", "mul", "電圧どうしを掛けた（直列の電源は、向きを見て足すか引く）"]];
      ch = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
      return {form: f, text: "図のように、2つの電源を直列につないだ。2つの電源を1つにまとめた電源の電圧は □ である。",
              fig: u5s4fig(Object.assign({s1: "{V}_1", s2: "{V}_2"}, dl)), ch: ch.ch, ans: ch.ans,
              ex: [same ? "2つの電源は同じ向きなので、足してまとめる" : "2つの電源は逆向きなので、引いてまとめる",
                   "まとめた電源の電圧は　" + okt],
              chk: {form: f, p: dl}};
    }
    if (f === "u5s4eq") {
      var lhs = same ? "V_1 + V_2" : c === 1 ? "-V_1 + V_2" : "V_1 - V_2";
      var cand = [["V_1 + V_2", "pp"], ["-V_1 + V_2", "mp"], ["V_1 - V_2", "pm"]];
      var okc = same ? "pp" : c === 1 ? "mp" : "pm";
      var why = {pp: "逆向きの電源にも ＋ を付けた", mp: same ? "同じ向きの電源に － を付けた" : "＋ と － を付ける電源が逆",
                 pm: same ? "同じ向きの電源に － を付けた" : "＋ と － を付ける電源が逆"};
      var list2 = [["$" + lhs + " = R I$", okc]];
      cand.forEach(function(x){ if (x[1] !== okc) list2.push(["$" + x[0] + " = R I$", x[1], why[x[1]]]); });
      list2 = list2.slice(0, 3).concat([["$" + lhs + " = -R I$", "neg", "電流 $I$ は閉回路と同じ向きなので、電圧降下は ＋"]]);
      ch = choices(r, list2.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
      return {form: f, text: "図の回路で、閉回路を矢印の向きに決めた。起電力の和＝電圧降下の和の式は □ である。",
              fig: u5s4fig(Object.assign({s1: "{V}_1", s2: "{V}_2", lp: 1}, dl)), ch: ch.ch, ans: ch.ans,
              ex: [same ? "$V_1$ も $V_2$ も、閉回路の向きに進むと－極から＋極へ通るので ＋"
                        : "$V_" + (c === 1 ? 1 : 2) + "$ は向きが逆で、＋極から－極へ通るので －",
                   "電圧降下は $R I$　$" + lhs + " = R I$"],
              chk: {form: f, p: dl}};
    }
    if (f === "u5s4v") {                // V1・V2 からまとめた電源の電圧
      for (;;) {
        P = u5s4pair(r, c); V1 = P[0]; V2 = P[1];
        ok = same ? V1 + V2 : Math.abs(V1 - V2);
        w = u5s4three(ok, same
          ? [{x: Math.abs(V1 - V2), why: "同じ向きの電源なのに、引いた"}, {x: V1, why: "$V_2$ を入れなかった"}, {x: V2, why: "$V_1$ を入れなかった"},
             {x: V1 * V2, why: "電圧どうしを掛けた"}]
          : [{x: V1 + V2, why: "逆向きの電源なのに、足した"}, {x: Math.max(V1, V2), why: "逆向きの電源を入れなかった"},
             {x: Math.min(V1, V2), why: "電流と同じ向きの電源を入れなかった"}, {x: V1 * V2, why: "電圧どうしを掛けた"}]);
        if (w) break;
      }
      ch = num(r, null, "V", ok, w);
      return {form: f, text: "図のように、電源 $V_1 = " + qv(V1, "V") + "$ と $V_2 = " + qv(V2, "V") + "$ を直列につないだ。2つの電源を1つにまとめた電源の電圧は何 V か。",
              fig: u5s4fig(Object.assign({s1: "{V}_1=" + qf(V1, "V"), s2: "{V}_2=" + qf(V2, "V")}, dl)), ch: ch.ch, ans: ch.ans,
              ex: [same ? "2つの電源は同じ向きなので、足してまとめる" : "2つの電源は逆向きなので、大きい方から小さい方を引いてまとめる",
                   "$" + (same ? fmt(V1) + " + " + fmt(V2) : fmt(Math.max(V1, V2)) + " - " + fmt(Math.min(V1, V2))) + " = " + qv(ok, "V") + "$"],
              chk: {form: f, p: Object.assign({V1: V1, V2: V2}, dl)}};
    }
    if (f === "u5s4i") {                // V1・V2・R から I
      for (;;) {
        P = u5s4pair(r, c); V1 = P[0]; V2 = P[1]; V = same ? V1 + V2 : Math.abs(V1 - V2);
        R = pick(r, RS5); ok = V / R; if (!int5(ok * 2) || ok > 30) continue;
        var Vo = same ? Math.abs(V1 - V2) : V1 + V2;
        w = u5s4three(ok, [{x: Vo / R, why: same ? "同じ向きの電源なのに、引いてまとめた" : "逆向きの電源なのに、足してまとめた"},
                           {x: Math.max(V1, V2) / R, why: same ? "片方の電源だけで割った" : "逆向きの電源を入れなかった"},
                           {x: V * R, why: "まとめた電圧と抵抗を掛けた"}, {x: Math.min(V1, V2) / R, why: "片方の電源だけで割った"}]);
        if (w) break;
      }
      ch = num(r, null, "A", ok, w);
      return {form: f, text: "図のように、電源 $V_1 = " + qv(V1, "V") + "$、$V_2 = " + qv(V2, "V") + "$ と抵抗 $R = " + qv(R, "O") + "$ を直列につないだ。電流 $I$ は何 A か。",
              fig: u5s4fig(Object.assign({s1: "{V}_1=" + qf(V1, "V"), s2: "{V}_2=" + qf(V2, "V"), r: ohm5("", R)}, dl)), ch: ch.ch, ans: ch.ans,
              ex: [(same ? "同じ向きなので足す" : "逆向きなので引く") + "　$V = " + (same ? fmt(V1) + " + " + fmt(V2) : fmt(Math.max(V1, V2)) + " - " + fmt(Math.min(V1, V2))) + " = " + qv(V, "V") + "$",
                   "$I = \\dfrac{V}{R} = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "} = " + qv(ok, "A") + "$"],
              chk: {form: f, p: Object.assign({V1: V1, V2: V2, R: R}, dl)}};
    }
    for (;;) {                          // u5s4r：V1・V2・I から R
      P = u5s4pair(r, c); V1 = P[0]; V2 = P[1]; V = same ? V1 + V2 : Math.abs(V1 - V2);
      I = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]); ok = V / I; if (!int5(ok)) continue;
      w = u5s4three(ok, [{x: (same ? Math.abs(V1 - V2) : V1 + V2) / I, why: same ? "同じ向きの電源なのに、引いてまとめた" : "逆向きの電源なのに、足してまとめた"},
                         {x: V * I, why: "まとめた電圧と電流を掛けた"}, {x: Math.max(V1, V2) / I, why: "片方の電源だけで割った"},
                         {x: Math.min(V1, V2) / I, why: "片方の電源だけで割った"}]);
      if (w) break;
    }
    ch = num(r, null, "O", ok, w);
    return {form: "u5s4r", text: "図のように、電源 $V_1 = " + qv(V1, "V") + "$、$V_2 = " + qv(V2, "V") + "$ と抵抗 $R$ を直列につないだところ、電流 $I = " + qv(I, "A") + "$ が流れた。$R$ は何 Ω か。",
            fig: u5s4fig(Object.assign({s1: "{V}_1=" + qf(V1, "V"), s2: "{V}_2=" + qf(V2, "V"), i: "{I}=" + qf(I, "A")}, dl)), ch: ch.ch, ans: ch.ans,
            ex: [(same ? "同じ向きなので足す" : "逆向きなので引く") + "　$V = " + (same ? fmt(V1) + " + " + fmt(V2) : fmt(Math.max(V1, V2)) + " - " + fmt(Math.min(V1, V2))) + " = " + qv(V, "V") + "$",
                 "$R = \\dfrac{V}{I} = \\dfrac{" + fmt(V) + "}{" + fmt(I) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "u5s4r", p: Object.assign({V1: V1, V2: V2, I: I}, dl)}};
  },
  // 5-5 ループ電流法で式を立てる
  5: function(r){
    var f = pick(r, ["u5s5mid", "u5s5mid", "u5s5left", "u5s5left", "u5s5left", "u5s5right", "u5s5right", "u5s5right", "u5s5count"]);
    var C = u5s5circ(r), c, P = {d1: 1, d2: C.d2};
    if (f === "u5s5mid") {
      c = choices(r, [{t: "$I_1 - I_2$", v: "a-b"}, {t: "$I_1 + I_2$", v: "a+b", why: "上の点に入る電流と出る電流を、足してしまった"},
                      {t: "$I_2 - I_1$", v: "b-a", why: "引く順が逆（上の点に入るのは $I_1$、出るのは $I_2$）"},
                      {t: "$I_1$", v: "a", why: "$I_2$ に分かれた分を引いていない"}]);
      return {form: f, text: "図の回路で、$R_3$ に下向きに流れる電流を $I_1$ と $I_2$ で表すと □ である。",
              fig: u5s5fig(C, {i3: undefined}), ch: c.ch, ans: c.ans,
              ex: ["上の点に $I_1$ が入り、$I_2$ が出ていく", "$R_3$ には残りが流れる　$I_1 - I_2$"],
              chk: {form: f, p: P}};
    }
    if (f === "u5s5count") {
      c = choices(r, [{t: "2つ", v: 2}, {t: "1つ", v: 1, why: "式が1つでは、分からない電流2つは決まらない"},
                      {t: "3つ", v: 3, why: "抵抗の数だけ式を立てると考えた（要るのは、分からない電流の数）"},
                      {t: "5つ", v: 5, why: "抵抗と電源の数だけ式を立てると考えた（要るのは、分からない電流の数）"}]);
      return {form: f, text: "図の回路で、分からない電流を $I_1$・$I_2$ とした。式を立てるのに要る閉回路の数は □ である。",
              fig: u5s5fig(C, {}), ch: c.ch, ans: c.ans,
              ex: ["分からない電流は $I_1$ と $I_2$ の2つ", "分からない電流の数だけ閉回路を決めて式を立てる　2つ"],
              chk: {form: f, p: {n: 2}}};
    }
    var left = f === "u5s5left", ok, wr;
    if (left) {
      ok = {v: [1, 0], r: {R1: [1, 0], R3: [1, -1]}};
      wr = [[{R3: [-1, 1]}, "$R_3$ の $I_1 - I_2$ は閉回路と同じ向きなので ＋"],
            [{R3: [1, 0]}, "$R_3$ に流れるのは $I_1 - I_2$"],
            [{v: [-1, 0]}, "$V_1$ は、閉回路の向きに進むと－極から＋極へ通るので ＋"],
            [{R2: [0, 1]}, "閉回路に入っていない $R_2$ を入れた"]];
    } else {
      ok = {v: [0, C.d2], r: {R2: [0, 1], R3: [-1, 1]}};
      wr = [[{R3: [1, -1]}, "$R_3$ の $I_1 - I_2$ は閉回路と逆向きなので －"],
            [{R3: [-1, 0]}, "$R_3$ に流れるのは $I_1 - I_2$"],
            [{v: [0, -C.d2]}, C.d2 > 0 ? "$V_2$ は、閉回路の向きに進むと－極から＋極へ通るので ＋" : "$V_2$ は、閉回路の向きに進むと＋極から－極へ通るので －"],
            [{R1: [1, 0]}, "閉回路に入っていない $R_1$ を入れた"]];
    }
    var list = [{t: u5s5tex(ok, C), v: u5s5code(ok)}];
    shuffled(r, wr).slice(0, 3).forEach(function(q){
      var E = u5s5copy(ok);
      if (q[0].v) E.v = q[0].v;
      ["R1", "R2", "R3"].forEach(function(k){ if (q[0][k]) E.r[k] = q[0][k]; });
      list.push({t: u5s5tex(E, C), v: u5s5code(E), why: q[1]});
    });
    c = choices(r, list);
    P.loop = left ? "left" : "right";
    return {form: f, text: "図の回路で、" + (left ? "左" : "右") + "の閉回路を矢印の向きに決めた。起電力の和＝電圧降下の和の式は □ である。",
            fig: u5s5fig(C, left ? {lp1: 1} : {lp2: 1}), ch: c.ch, ans: c.ans,
            ex: [left ? "$V_1$・$R_1$ の $I_1$・$R_3$ の $I_1 - I_2$ は、どれも閉回路と同じ向きなので ＋"
                      : "$R_2$ の $I_2$ は ＋、$R_3$ の $I_1 - I_2$ は逆向きなので －、$V_2$ は " + (C.d2 > 0 ? "＋" : "－"),
                 u5s5tex(ok, C)],
            chk: {form: f, p: P}};
  },
  // 5-6 連立方程式を解く
  6: function(r){
    var f = pick(r, ["u5s6solve", "u5s6solve", "u5s6solve", "u5s6back", "u5s6back", "u5s6mid", "u5s6mid", "u5s6neg"]);
    var c, k, ok, w, ch, L, raw, x;
    if (f === "u5s6solve") {
      for (;;) {
        c = u5s6circ(r); k = pick(r, [1, 2]); ok = k === 1 ? c.I1 : c.I2;
        x = u5s6sol(c.V1, c.a1, c.b1, c.V2, c.R3, c.R3 - c.R2);       // カッコを外す時に −R3 I2 を ＋ とした（2つの式とも）
        w = u5s6three(ok, [{x: k === 1 ? c.I2 : c.I1, why: "求める電流でなく、もう一方の電流を求めた"},
                           {x: c.I1 - c.I2, why: "真ん中の $R_3$ に流れる $I_1 - I_2$ を答えた"},
                           {x: -ok, why: ok < 0 ? "負の符号を落とした（負の答えは、決めた向きと逆に流れているということ）" : "符号をまちがえた"},
                           {x: x ? x[k - 1] : null, why: "カッコを外す時に、$-" + u5s6co(c.R3, "I_2") + "$ の符号をまちがえた"}]);
        if (w) break;
      }
      ch = u5s6num(r, "A", ok, w); raw = u5s6raw(c);
      var o = 3 - k, A1 = c.a1, B1 = -c.b1, A2 = -c.R3, B2 = c.a2, W2 = -c.V2, Lc, m1, m2, N, D;
      // 消す文字（I_o）の係数をそろえて、2つの式を足す（I_1 の係数は上が正・下が負、I_2 は上が負・下が正なので、足すと消える）
      if (o === 1) { Lc = A1 / u5s6gcd(A1, -A2) * -A2; m1 = Lc / A1; m2 = Lc / -A2; N = c.V1 * m1 + W2 * m2; D = B1 * m1 + B2 * m2; }
      else { Lc = -B1 / u5s6gcd(-B1, B2) * B2; m1 = Lc / -B1; m2 = Lc / B2; N = c.V1 * m1 + W2 * m2; D = A1 * m1 + A2 * m2; }
      return {form: f, text: "図の回路で、2つの閉回路について次の式を立てた。" + raw[0] + "、" + raw[1] + "　電流 $I_" + k + "$ は何 A か。",
              fig: u5s6fig(u5s6lab(c)), ch: ch.ch, ans: ch.ans,
              ex: ["カッコを外してまとめる　$" + u5s6eq(c.V1, A1, B1) + "$、$" + u5s6eq(W2, A2, B2) + "$",
                   "$I_" + o + "$ の係数を " + fmt(Lc) + " にそろえて足す　$" + fmt(N) + " = " + u5s6co(D, "I_" + k) + "$",
                   "$I_" + k + " = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {V1: c.V1, V2: c.V2, R1: c.R1, R2: c.R2, R3: c.R3, k: k}}};
    }
    if (f === "u5s6back") {
      for (;;) {
        c = u5s6circ(r); ok = c.I1;
        w = u5s6three(ok, [{x: (c.V1 - c.b1 * c.I2) / c.a1, why: "$I_2$ の値を入れる時に、符号をまちがえた"},
                           {x: c.V1 / c.a1, why: "$I_2$ の値を入れ忘れた"},
                           {x: c.I2, why: "分かっている $I_2$ をそのまま答えた"},
                           {x: c.I1 - c.I2, why: "真ん中の $R_3$ に流れる $I_1 - I_2$ を答えた"}]);
        if (w) break;
      }
      ch = u5s6num(r, "A", ok, w); L = u5s6lab(c); L.i2 = "{I}_2=" + qf(c.I2, "A");
      return {form: f, text: "図の回路で、カッコを外してまとめた式 $" + u5s6eq(c.V1, c.a1, -c.b1) + "$ と、$I_2 = " + qv(c.I2, "A") + "$ が分かった。電流 $I_1$ は何 A か。",
              fig: u5s6fig(L), ch: ch.ch, ans: ch.ans,
              ex: ["$I_2 = " + qv(c.I2, "A") + "$ を入れる　$" + fmt(c.V1) + " = " + u5s6co(c.a1, "I_1") + (c.I2 < 0 ? " + " : " - ") + fmt(Math.abs(c.b1 * c.I2)) + "$",
                   "$I_1 = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {V1: c.V1, a: c.a1, b: c.b1, I2: c.I2}}};
    }
    if (f === "u5s6mid") {
      for (;;) {
        c = u5s6circ(r); ok = c.I1 - c.I2;
        w = u5s6three(ok, [{x: c.I1 + c.I2, why: c.I2 < 0 ? "負の数を引く時に、符号をまちがえた" : "$I_1$ と $I_2$ を足した"},
                           {x: c.I1, why: "$I_2$ を引き忘れた"},
                           {x: c.I2 - c.I1, why: "引く順が逆"},
                           {x: Math.abs(c.I2), why: "$I_2$ を答えた"}]);
        if (w) break;
      }
      ch = u5s6num(r, "A", ok, w); L = u5s6lab(c); L.i1 = "{I}_1=" + qf(c.I1, "A"); L.i2 = "{I}_2=" + qf(c.I2, "A");
      return {form: f, text: "図の回路で、$I_1 = " + qv(c.I1, "A") + "$、$I_2 = " + qv(c.I2, "A") + "$ と求まった。真ん中の $R_3$ に流れる電流は何 A か。",
              fig: u5s6fig(L), ch: ch.ch, ans: ch.ans,
              ex: ["真ん中の $R_3$ には $I_1 - I_2$ が流れる",
                   "$I_1 - I_2 = " + fmt(c.I1) + " - " + (c.I2 < 0 ? "(" + fmt(c.I2) + ")" : fmt(c.I2)) + " = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {I1: c.I1, I2: c.I2}}};
    }
    // u5s6neg：負の答えの読み方
    k = pick(r, [1, 2]); x = pick(r, [1, 2, 3, 4, 5, 6]);
    c = u5s6circ(r);
    var me = "$I_" + k + "$", rk = "$R_" + k + "$", amp = "$" + qv(x, "A") + "$";
    return rule5(r, "電流 " + me + " を求めたら $" + qv(-x, "A") + "$ になった。正しいのは □ である。", u5s6fig(u5s6lab(c)),
      [[me + " の矢印と逆の向きに " + amp + " 流れている", "rev"],
       [me + " の矢印の向きに " + amp + " 流れている", "same", "負の答えは、決めた向きと逆に流れているということ"],
       ["計算がまちがっている", "wrong", "負の答えもある。まちがいとは限らない"],
       [rk + " には電流が流れていない", "zero", "電流は 0 ではない。向きが逆なだけ"]],
      ["負の答えは、決めた矢印の向きと逆に流れているということ", me + " の矢印と逆の向きに " + amp], "u5s6neg");
  },
  // 5-7 電位の基準を決める
  7: function(r){
    var f = pick(r, ["u5s7pot", "u5s7pot", "u5s7pot", "u5s7low", "u5s7low", "u5s7rule"]);
    var c, ref, q, ok, w, ch, P, ks = ["a", "b", "c", "d"];
    if (f === "u5s7pot") {
      for (;;) {
        c = u5s7circ(r); ref = pick(r, ks); q = pick(r, ks.filter(function(k){ return k !== ref; }));
        P = u5s7walk(c, ref, q); ok = P[0];
        if (ok === 0) continue;
        w = u5s7three(ok, [{x: u5s7walk(c, ref, q, true)[0], why: "抵抗を電流の向きに通ると下がる（上がると考えた）"},
                           {x: -ok, why: "上がり下がりを逆にした"},
                           {x: u5s7walk(c, ref, q, false, true)[0], why: "$V_2$ の向き（＋と－）を逆に読んだ"},
                           {x: ref === "d" ? null : u5s7walk(c, "d", q)[0], why: "$V_1$ の－極の側（点 d）を 0 V とした"}].filter(function(z){ return z.x !== null; }));
        if (w) break;
      }
      ch = choices(r, [{t: "$" + qv(ok, "V") + "$", v: ok}].concat(w.map(function(z){ return {t: "$" + qv(z.x, "V") + "$", v: z.x, why: z.why}; })));
      var sum = "0" + P[1].map(function(x){ return x < 0 ? " - " + fmt(-x) : " + " + fmt(x); }).join("");
      return {form: f, text: "図の回路で、点 " + ref + " を 0 V とする。点 " + q + " の電位は何 V か。",
              fig: u5s7fig(u5s7lab(c, ref)), ch: ch.ch, ans: ch.ans,
              ex: ["点 " + ref + " から電流の向きに、電源で上がる分・抵抗で下がる分を順に足す",
                   "$" + sum + " = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {V1: c.V1, V2: c.V2, o2: c.o2, R1: c.R1, R2: c.R2, I: c.I, ref: ref, q: q}}};
    }
    if (f === "u5s7low") {
      var pot, lo;
      for (;;) {
        c = u5s7circ(r); ref = pick(r, ks);
        pot = {}; ks.forEach(function(k){ pot[k] = u5s7walk(c, ref, k)[0]; });
        lo = ks.filter(function(k){ return pot[k] === Math.min(pot.a, pot.b, pot.c, pot.d); });
        if (lo.length === 1) break;
      }
      lo = lo[0];
      ch = choices(r, [{t: "点 " + lo, v: lo}].concat(ks.filter(function(k){ return k !== lo; }).map(function(k){
        return {t: "点 " + k, v: k, why: k === ref ? "0 V と決めた点が一番低いとは限らない。順に足すと、もっと低い点がある"
                               : k === "d" ? "$V_1$ の－極の点が一番低いとは限らない。順に足して比べる"
                               : "順に足すと、もっと低い点がある"};
      })));
      return {form: f, text: "図の回路で、点 " + ref + " を 0 V とする。電位が一番低い点は □ である。",
              fig: u5s7fig(u5s7lab(c, ref)), ch: ch.ch, ans: ch.ans,
              ex: ["点 " + ref + " から順に足す　" + ks.map(function(k){ return k + "：$" + qv(pot[k], "V") + "$"; }).join("、"),
                   "一番低いのは点 " + lo],
              chk: {form: f, p: {V1: c.V1, V2: c.V2, o2: c.o2, R1: c.R1, R2: c.R2, I: c.I, ref: ref}}};
    }
    // u5s7rule：決まりの言葉
    c = u5s7circ(r);
    var v = pick(r, [1, 2, 3]), fig = u5s7fig(u5s7lab(c, pick(r, ks))), out;
    if (v === 1)
      out = rule5(r, "電源が2つ以上ある回路で、それぞれの点の電位を出す時は □。", fig,
        [["1つの点を 0 V と決め、電圧の上がり下がりを順に足す", "one"],
         ["どの電源の－極も 0 V とする", "minus", "－極が2つ以上あると、－極どうしの電位は同じとは限らない"],
         ["電源の＋極の電位を、その電源の電圧とする", "plus", "－極を 0 V と決められないので、＋極の電位も決まらない"],
         ["電位は決められない", "none", "1つの点を 0 V と決めれば、全部の点の電位が出る"]],
        ["電源が2つ以上あると、－極を 0 V と決められない", "1つの点を 0 V と決め、上がり下がりを順に足す"], "u5s7rule");
    else if (v === 2)
      out = rule5(r, "電流の向きに抵抗 $R$ を通ると、電位は □。", fig,
        [["$RI$ 下がる", "down"], ["$RI$ 上がる", "up", "電流の向きに通ると、電圧降下の分だけ下がる"],
         ["変わらない", "same", "抵抗では、電圧降下の分だけ電位が変わる"],
         ["$R$ だけ下がる", "r", "下がるのは、抵抗と電流を掛けた $RI$"]],
        ["抵抗を電流の向きに通ると、電圧降下 $RI$ の分だけ下がる"], "u5s7rule");
    else out = rule5(r, "電源を－極から＋極へ通ると、電位は □。", fig,
      [["電源の電圧だけ上がる", "up"], ["電源の電圧だけ下がる", "down", "－から＋へ通ると上がる（＋から－へ通ると下がる）"],
       ["変わらない", "same", "電源を通ると、電源の電圧だけ電位が変わる"],
       ["0 V になる", "zero", "0 V になるのは、0 V と決めた点だけ"]],
      ["電源を－極から＋極へ通ると、電源の電圧だけ上がる"], "u5s7rule");
    out.chk.p = {k: v};          // どの決まりを聞いたか（s7_check.py が正しい選択肢を決める）
    return out;
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t5s1e","scene":"t5s1e","kind":"u5s1node","lab":{"br":{"l":1,"u":1,"r":0,"d":0},"fl":{"i1":3,"i2":5,"i3":6,"i4":2},"i1":["{I}_1","{I}_1=3 A"],"i2":["{I}_2","{I}_2=5 A"],"i3":["{I}_3","{I}_3=6 A"],"i4":["{I}_4","{I}_4=2 A"]},"viewbox":"464 232 595 400","band":{"want":"1つの点に入る電流と出る電流","ans":"入る電流の合計＝出る電流の合計　$I_1 + I_2 = I_3 + I_4$","full":"どの点でも、入る電流の合計と、出る電流の合計は等しい。これをキルヒホッフの第1法則という。"},"narr":{"start":{"co":1,"i1v":0,"i2v":0,"i3v":0,"i4v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"①入る電流と出る電流\n②第1法則\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"真ん中の点に、4本の線がつながっています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["N"]},{"text":"$I_1$ と $I_2$ は、この点に入る電流です。","at":{"強調":1.0},"after":[],"emph":["N","I1","I2"]},{"text":"$I_3$ と $I_4$ は、この点から出る電流です。","at":{"強調":1.0},"after":[],"emph":["N","I3","I4"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"どの点でも、〖入る電流の合計と、出る電流の合計は等しく〗なります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["N","I1","I2","I3","I4"],"eq":[{"cont":false,"items":[["I_1 + I_2 = I_3 + I_4"]]}],"emphPre":["N","I1","I2","I3","I4"]},{"text":"この決まりが、〖キルヒホッフの第1法則〗です。","at":{"強調":1.0},"after":[],"emph":["N","I1","I2","I3","I4"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$I_1 = 3\\,\\mathrm{A}$、$I_2 = 5\\,\\mathrm{A}$、$I_3 = 6\\,\\mathrm{A}$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["I1","I2","I3"],"move":"vals"},{"text":"入る電流の合計は $3 + 5 = 8\\,\\mathrm{A}$ です。","at":{"強調":1.0},"after":[],"emph":["I1","I2"]},{"text":"〖出る電流の合計も $8\\,\\mathrm{A}$〗 なので、$I_4$ は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I3","I4"],"eq":[{"cont":false,"items":[["6 + I_4 = 8"],["I_4 = 2\\,\\mathrm{A}"]]}],"move":"i4val","ans":true,"emphPre":["I3","I4"]}]}],"groups":{"N":["u5s1n"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I4":["i4a","i4a:h","i4t0","i4t1"]},"moves":{"vals":{"to":{"i1v":1,"i2v":1,"i3v":1},"dur":0.6},"i4val":{"to":{"i4v":1},"dur":0.4}},"route":["入る電流と出る電流","第1法則","数字で見る"]}},{"id":"t5s1x","scene":"t5s1x","kind":"u5s1node","lab":{"br":{"l":1,"u":1,"r":0,"d":0},"fl":{"i1":7,"i2":5,"i3":9,"i4":3},"i1":"{I}_1=7 A","i2":"{I}_2=5 A","i3":"{I}_3=9 A","i4":["{I}_4","{I}_4=3 A"]},"viewbox":"464 232 595 400","band":{"want":"点から出る電流 $I_4$","known":"$I_1 = 7\\,\\mathrm{A},\\;\\; I_2 = 5\\,\\mathrm{A},\\;\\; I_3 = 9\\,\\mathrm{A}$","ans":"$I_4 = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i4v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、点から出る電流 $I_4$ です。","at":{"強調":1.0},"after":[],"emph":["I4"]},{"text":"①入る電流と出る電流\n②第1法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I4"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"点に入るのは $I_1$ と $I_2$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["N","I1","I2"]},{"text":"点から出るのは $I_3$ と $I_4$ です。","at":{"強調":1.0},"after":[],"emph":["N","I3","I4"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"〖入る電流の合計と、出る電流の合計は等しく〗なります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I1","I2","I3","I4"],"eq":[{"cont":false,"items":[["I_1 + I_2 = I_3 + I_4"],["7 + 5 = 9 + I_4"],["I_4 = 3\\,\\mathrm{A}"]]}],"move":"i4val","ans":true,"emphPre":["I1","I2","I3","I4"]}]}],"groups":{"N":["u5s1n"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"I4":["i4a","i4a:h","i4t0","i4t1"]},"moves":{"i4val":{"to":{"i4v":1},"dur":0.4}},"route":["入る電流と出る電流","第1法則"]}},{"id":"t5s2e","scene":"t5s2e","kind":"u5s2sp","lab":{"pm":1,"la":1,"fl":[3,2,1],"src":["{V}","{V}=24 V"],"r1":["{R}_1","{R}_1=4 Ω"],"r2":["{R}_2","{R}_2=6 Ω"],"r3":"{R}_3","i1":["{I}_1","{I}_1=3 A"],"i2":["{I}_2","{I}_2=2 A"]},"viewbox":"464 290 595 370","band":{"want":"閉回路の起電力と電圧降下","ans":"起電力の和＝電圧降下の和　$V = I_1 R_1 + I_2 R_2$","full":"どの閉回路でも、起電力の和と、電圧降下の和は等しい。これをキルヒホッフの第2法則という。起電力は、今は電源の電圧と考える。"},"narr":{"start":{"co":1,"lao":0,"srcv":0,"r1v":0,"r2v":0,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"①閉回路\n②起電力と電圧降下\n③第2法則\n④数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"回路の中で始めの点を決め、〖線をたどって一周し、始めの点に戻る道を閉回路〗といいます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["LA","W"],"move":"loop"},{"text":"閉回路には向きがあります。この閉回路の向きは時計回りです。","at":{"強調":1.0},"after":[],"emph":["LA"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"〖閉回路の中の電源の電圧を、起電力〗といいます。この閉回路の起電力は $V$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["src","LA"]},{"text":"閉回路の中の〖抵抗で下がる電圧が、電圧降下〗です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","LA"],"zb":true},{"text":"$R_1$ の電圧降下は $I_1 R_1$、$R_2$ の電圧降下は $I_2 R_2$ です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","I1","I2"],"zb":true}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"どの閉回路でも、〖起電力の和と、電圧降下の和は等しく〗なります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["src","R1","R2","I1","I2","LA"],"eq":[{"cont":false,"items":[["V = I_1 R_1 + I_2 R_2"]]}],"emphPre":["src","R1","R2","I1","I2","LA"],"zb":true},{"text":"この決まりが、キルヒホッフの第2法則です。","at":{"強調":1.0},"after":[],"emph":["src","R1","R2","I1","I2","LA"]},{"text":"この閉回路では、電流も電源も、閉回路の向きとそろっています。","at":{"強調":1.0},"after":[],"emph":["src","I1","I2","LA"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$R_1 = 4\\,\\Omega$、$I_1 = 3\\,\\mathrm{A}$、$R_2 = 6\\,\\Omega$、$I_2 = 2\\,\\mathrm{A}$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":4,"emph":["R1","I1","R2","I2"],"move":"vals"},{"text":"電圧降下の和が、起電力 $V$ と等しくなります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["src","R1","I1","R2","I2"],"eq":[{"cont":false,"items":[["V = 3 \\times 4 + 2 \\times 6"],["V = 24\\,\\mathrm{V}"]]}],"move":"vval","ans":true,"emphPre":["src","R1","I1","R2","I2"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"LA":["u5s2la","u5s2lae","u5s2lae:h"],"W":["u5s2L","u5s2t1","u5s2a2","u5s2b2","u5s2B"],"zhi":["u5s2L","zbhi"],"zmid":["u5s2t1","u5s2t2","u5s2a2","zbmid"],"zlo":["u5s2b2","u5s2b3","u5s2B","zblo"]},"moves":{"loop":{"to":{"lao":1},"dur":0.6},"vals":{"to":{"r1v":1,"r2v":1,"i1v":1,"i2v":1},"dur":0.6},"vval":{"to":{"srcv":1},"dur":0.4}},"route":["閉回路","起電力と電圧降下","第2法則","数字で見る"]}},{"id":"t5s2x","scene":"t5s2x","kind":"u5s2sp","lab":{"pm":1,"la":1,"fl":[5,3,2],"src":"{V}=50 V","r1":"{R}_1=4 Ω","r2":"{R}_2=10 Ω","r3":"{R}_3","i1":"{I}_1=5 A","i2":["{I}_2","{I}_2=3 A"]},"viewbox":"464 290 595 370","band":{"want":"$R_2$ に流れる電流 $I_2$","known":"$V = 50\\,\\mathrm{V},\\;\\; R_1 = 4\\,\\Omega,\\;\\; I_1 = 5\\,\\mathrm{A},\\;\\; R_2 = 10\\,\\Omega$","ans":"$I_2 = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"lao":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、$R_2$ に流れる電流 $I_2$ です。","at":{"強調":1.0},"after":[],"emph":["I2","R2"]},{"text":"①閉回路を決める\n②第2法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I2","R2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"電源・$R_1$・$R_2$ を通る閉回路を、〖時計回りに決めます〗。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["LA","W","src","R1","R2"],"move":"loop"}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"〖起電力は $V$、電圧降下は $I_1 R_1$ と $I_2 R_2$〗 です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["src","R1","I1","R2","I2","LA"],"eq":[{"cont":false,"items":[["V = I_1 R_1 + I_2 R_2"],["50 = 5 \\times 4 + 10 I_2"],["I_2 = 3\\,\\mathrm{A}"]]}],"move":"i2val","ans":true,"emphPre":["src","R1","I1","R2","I2","LA"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"LA":["u5s2la","u5s2lae","u5s2lae:h"],"W":["u5s2L","u5s2t1","u5s2a2","u5s2b2","u5s2B"],"zhi":["u5s2L","zbhi"],"zmid":["u5s2t1","u5s2t2","u5s2a2","zbmid"],"zlo":["u5s2b2","u5s2b3","u5s2B","zblo"]},"moves":{"loop":{"to":{"lao":1},"dur":0.6},"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["閉回路を決める","第2法則"]}},{"id":"t5s3e","scene":"t5s3e","kind":"u5s3sp","lab":{"pm":1,"lb":1,"lo":1,"fl":[3,1,2],"src":"{V}","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2","i3":"{I}_3"},"viewbox":"442 290 780 370","band":{"want":"閉回路の向きと逆の電流・電源","ans":"向きが逆なら負　$0 = -I_2 R_2 + I_3 R_3$","full":"閉回路の向きと電流の向きが同じなら電圧降下は正、逆なら負。電源も、閉回路の向きに進んで－極から＋極へ通るなら正、逆なら負。電源の無い閉回路は、起電力の和が 0。外側を一周する閉回路でも式が立つ。"},"narr":{"start":{"co":1,"lbo":0,"loo":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"①向きが逆なら負\n②電源の無い閉回路\n③外側の閉回路\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$R_2$ と $R_3$ を通る右の閉回路を、時計回りに決めます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["LB","WB","R2","R3"],"move":"lb"},{"text":"〖閉回路の向きと電流の向きが同じなら、電圧降下は正〗とします。逆なら負とします。","at":{"強調":1.0},"after":[],"emph":["LB","I2","I3"]},{"text":"電源も同じです。閉回路の向きに進んで、〖－極から＋極へ通るなら正〗、逆なら負とします。","at":{"強調":1.0},"after":[],"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"右の閉回路には電源が無いので、〖起電力の和は 0〗 です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["LB","WB"]},{"text":"$R_2$ では、閉回路は上向き、電流 $I_2$ は下向きです。逆なので負です。","at":{"強調":1.0},"after":[],"emph":["LB","R2","I2"]},{"text":"$R_3$ では、閉回路も電流 $I_3$ も下向きです。同じなので正です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["LB","R2","I2","R3","I3"],"eq":[{"cont":false,"items":[["0 = -I_2 R_2 + I_3 R_3"]]}],"emphPre":["LB","R3","I3"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"電源から外側を一周する閉回路でも、式が立ちます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["LO","WO","src","R1","R3"],"move":"lo"},{"text":"起電力は $V$、電圧降下は $I_1 R_1$ と $I_3 R_3$ です。どれも向きが同じなので正です。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["LO","src","R1","I1","R3","I3"],"eq":[{"cont":false,"items":[["V = I_1 R_1 + I_3 R_3"]]}],"ans":true,"emphPre":["LO","src","R1","I1","R3","I3"],"zb":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"LA":["u5s3la","u5s3lae","u5s3lae:h"],"LB":["u5s3lb","u5s3lbe","u5s3lbe:h"],"LO":["u5s3lo","u5s3loe","u5s3loe:h"],"WB":["u5s3t2","u5s3a2","u5s3b2","u5s3b3"],"WO":["u5s3L","u5s3t1","u5s3t2","u5s3b3","u5s3B"]},"moves":{"lb":{"to":{"lbo":1},"dur":0.6},"lo":{"to":{"loo":1},"dur":0.6}},"route":["向きが逆なら負","電源の無い閉回路","外側の閉回路"]}},{"id":"t5s3x","scene":"t5s3x","kind":"u5s3sp","lab":{"pm":1,"lb":1,"fl":[6,2,4],"src":"{V}","r1":"{R}_1","r2":"{R}_2=6 Ω","r3":"{R}_3=3 Ω","i1":"{I}_1","i2":"{I}_2=2 A","i3":["{I}_3","{I}_3=4 A"]},"viewbox":"442 290 780 370","band":{"want":"$R_3$ に流れる電流 $I_3$","known":"$R_2 = 6\\,\\Omega,\\;\\; I_2 = 2\\,\\mathrm{A},\\;\\; R_3 = 3\\,\\Omega$","ans":"$I_3 = 4\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i3v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、$R_3$ に流れる電流 $I_3$ です。","at":{"強調":1.0},"after":[],"emph":["I3","R3"]},{"text":"①向きを比べる\n②第2法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I3","R3"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"右の閉回路は時計回りです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["LB","WB"]},{"text":"$R_2$ では、閉回路は上向き、$I_2$ は下向きです。〖逆なので負〗です。","at":{"強調":1.0},"after":[],"emph":["LB","R2","I2"]},{"text":"$R_3$ では、閉回路も $I_3$ も下向きです。同じなので正です。","at":{"強調":1.0},"after":[],"emph":["LB","R3","I3"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"電源が無いので、〖起電力の和は 0〗 です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["LB","R2","I2","R3","I3"],"eq":[{"cont":false,"items":[["0 = -I_2 R_2 + I_3 R_3"],["0 = -2 \\times 6 + 3 I_3"],["I_3 = 4\\,\\mathrm{A}"]]}],"move":"i3val","ans":true,"emphPre":["LB","R2","I2","R3","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"LA":["u5s3la","u5s3lae","u5s3lae:h"],"LB":["u5s3lb","u5s3lbe","u5s3lbe:h"],"LO":["u5s3lo","u5s3loe","u5s3loe:h"],"WB":["u5s3t2","u5s3a2","u5s3b2","u5s3b3"],"WO":["u5s3L","u5s3t1","u5s3t2","u5s3b3","u5s3B"]},"moves":{"i3val":{"to":{"i3v":1},"dur":0.4}},"route":["向きを比べる","第2法則"]}},{"id":"t5s4e","scene":"t5s4e","kind":"u5s4ser","lab":{"pm":1,"d1":-1,"d2":1,"lp":1,"s1":["{V}_1","{V}_1=6 V"],"s2":["{V}_2","{V}_2=18 V"],"r":["{R}","{R}=4 Ω"],"i":["{I}","{I}=3 A"],"src":["{V}","{V}=12 V"]},"viewbox":"464 232 595 400","band":{"want":"直列につないだ2つの電源","ans":"向きを見て1つにまとめる　$V = V_2 - V_1$","full":"直列につないだ電源は、向きを見て1つの電源にまとめられる。同じ向きなら足し、逆向きなら引く。"},"narr":{"start":{"co":1,"lpo":0,"mg":0,"s1v":0,"s2v":0,"rv":0,"iv":0,"srcv":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①閉回路の式\n②1つにまとめる\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"閉回路を、電流 $I$ と同じ向きに決めます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["lp","I"],"move":"lp"},{"text":"$V_2$ は、閉回路の向きに進むと〖－極から＋極へ通るので＋〗です。","at":{"強調":1.0},"after":[],"emph":["V2","lp"],"zb":true},{"text":"$V_1$ は向きが逆で、〖＋極から－極へ通るので－〗です。","at":{"強調":1.0},"after":[],"emph":["V1","lp"],"zb":true},{"text":"電圧降下は $R$ の所だけです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["V1","V2","R","I"],"eq":[{"cont":false,"items":[["-V_1 + V_2 = R I"]]}],"emphPre":["R","I"],"zb":true}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"左辺の $-V_1 + V_2$ が、2つの電源をまとめた電圧です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["V1","V2"]},{"text":"〖大きい方の $V_2$ と同じ向き〗の、1つの電源 $V$ にまとめられます。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["V","R","I"],"move":"mg","eq":[{"cont":false,"items":[["V = V_2 - V_1"]]}],"emphPre":["V","V2"]},{"text":"同じ向きの2つの電源なら、〖足してまとめます〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["V"],"eq":[{"cont":false,"items":[["V = V_1 + V_2"]]}],"emphPre":["V"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V_1 = 6\\,\\mathrm{V}$、$V_2 = 18\\,\\mathrm{V}$、$R = 4\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["V1","V2","R"],"move":"vals"},{"text":"逆向きなので引きます。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["V"],"move":"mg2","eq":[{"cont":false,"items":[["V = 18 - 6 = 12\\,\\mathrm{V}"]]}],"emphPre":["V1","V2","V"]},{"text":"$V$ を $R$ で割ると、電流 $I$ です。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["V","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R} = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["V","R","I"]}]}],"groups":{"V1":["c1:L","c1:S","c1p","c1m","s1t0","s1t1"],"V2":["c2:L","c2:S","c2p","c2m","s2t0","s2t1"],"V":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"lp":["u5s4lp","u5s4lp:h"]},"moves":{"lp":{"to":{"lpo":1},"dur":0.6},"mg":{"to":{"mg":1},"dur":0.9},"vals":{"to":{"mg":0,"s1v":1,"s2v":1,"rv":1},"dur":0.9},"mg2":{"to":{"mg":1,"srcv":1},"dur":0.9},"ival":{"to":{"iv":1},"dur":0.4}},"route":["閉回路の式","1つにまとめる","数字で見る"]}},{"id":"t5s4x","scene":"t5s4x","kind":"u5s4ser","lab":{"pm":1,"d1":1,"d2":1,"lp":1,"s1":"{V}_1=8 V","s2":"{V}_2=12 V","r":"{R}=4 Ω","i":["{I}","{I}=5 A"],"src":"{V}=20 V"},"viewbox":"464 232 595 400","band":{"want":"電流 $I$","known":"$V_1 = 8\\,\\mathrm{V},\\;\\; V_2 = 12\\,\\mathrm{V},\\;\\; R = 4\\,\\Omega$","ans":"$I = 5\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"lpo":0,"mg":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①向きを見る\n②1つにまとめる\n③オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"閉回路を、電流 $I$ と同じ向きに決めます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["lp","I"],"move":"lp"},{"text":"$V_1$ も $V_2$ も、〖－極から＋極へ通るので＋〗です。2つは同じ向きです。","at":{"強調":1.0},"after":[],"emph":["V1","V2","lp"],"zb":true}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"同じ向きなので、〖足して1つの電源 $V$ にまとめます〗。","at":{"道筋":1.0,"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["V"],"move":"mg","eq":[{"cont":false,"items":[["V = V_1 + V_2"],["V = 8 + 12 = 20\\,\\mathrm{V}"]]}],"emphPre":["V1","V2","V"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V$ を $R$ で割ると、電流 $I$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R} = \\dfrac{20}{4} = 5\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["V","R","I"]}]}],"groups":{"V1":["c1:L","c1:S","c1p","c1m","s1t0","s1t1"],"V2":["c2:L","c2:S","c2p","c2m","s2t0","s2t1"],"V":["c:L","c:S","pp","pm","e0","e1"],"R":["r","rt0","rt1"],"I":["ia","ia:h","it0","it1"],"lp":["u5s4lp","u5s4lp:h"]},"moves":{"lp":{"to":{"lpo":1},"dur":0.6},"mg":{"to":{"mg":1},"dur":0.9},"ival":{"to":{"iv":1},"dur":0.4}},"route":["向きを見る","1つにまとめる","オームの法則"]}},{"id":"t5s5e","scene":"t5s5e","kind":"u5s5two","lab":{"pm":1,"d1":1,"d2":1,"s1":"{V}_1=18 V","s2":"{V}_2=4 V","r1":"{R}_1=4 Ω","r2":"{R}_2=5 Ω","r3":"{R}_3=6 Ω","i1":"{I}_1","i2":"{I}_2","i3":"{I}_1−{I}_2","lp1":1,"lp2":1,"zp":[18,6,-4,0],"fl":[3,2,1]},"viewbox":"464 218 670 432","band":{"want":"ループ電流法で式を立てる","ans":"分からない電流の数だけ、閉回路の式を立てる","full":"①電流を決める（書いていなければ自分で決める。新しい文字を置かず、すでにある文字で表す）②閉回路と向きを決める③起電力の和＝電圧降下の和で式を立てる。分からない電流の数だけ閉回路を決める。この手順をループ電流法という。"},"narr":{"start":{"co":0,"i1o":0,"i2o":0,"i3o":0,"lp1o":0,"lp2o":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"①電流を決める\n②閉回路を決める\n③式を立てる\nこの順に式を立てる方法を、〖ループ電流法〗といいます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$R_1$ に流れる電流を $I_1$、$R_2$ に流れる電流を $I_2$ と、自分で決めます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["R1","R2","I1","I2"],"move":"cur"},{"text":"上の点に $I_1$ が入り、$I_2$ が出ていきます。$R_3$ には、残りが流れます。","at":{"強調":1.0},"after":[],"emph":["J","I1","I2","R3"]},{"text":"〖新しい文字を置かず、$I_1$ と $I_2$ で表します〗。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R3","I3","I1","I2"],"move":"cur3","eq":[{"cont":false,"items":[["I_1 - I_2"]]}],"emphPre":["R3","I3","I1","I2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"分からない電流は $I_1$ と $I_2$ の2つなので、〖閉回路も2つ決めます〗。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["I1","I2","I3","lp1","lp2"],"move":"loops"}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"左の閉回路です。$V_1$ も、$I_1$ も、$I_1 - I_2$ も、閉回路と同じ向きなので＋です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["lp1","V1","R1","R3","I1","I3","I2"]},{"text":"起電力の和＝電圧降下の和で、式を立てます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["lp1","V1","R1","R3","I1","I3","I2"],"eq":[{"cont":false,"items":[["18 = 4 I_1 + 6 (I_1 - I_2)"]]}],"emphPre":["lp1","V1","R1","R3","I1","I3","I2"],"zb":true},{"text":"右の閉回路です。$V_2$ と $I_2$ は＋、〖$R_3$ の $I_1 - I_2$ は閉回路と逆向きなので－〗です。","at":{"強調":1.0},"after":[],"emph":["lp2","V2","R2","I2","R3","I3","I1"]},{"text":"同じように、式を立てます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["lp2","V2","R2","R3","I2","I3","I1"],"eq":[{"cont":false,"items":[["4 = 5 I_2 - 6 (I_1 - I_2)"]]}],"emphPre":["lp2","V2","R2","R3","I2","I3","I1"]},{"text":"分からない電流2つに、式が2つそろいました。","at":{"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["I1","I2","I3"],"eq":[{"cont":false,"items":[["18 = 4 I_1 + 6 (I_1 - I_2)","4 = 5 I_2 - 6 (I_1 - I_2)"]]}],"ans":true,"emphPre":["I1","I2","I3"]}]}],"groups":{"V1":["c1:L","c1:S","c1p","c1m","s1t0","s1t1"],"V2":["c2:L","c2:S","c2p","c2m","s2t0","s2t1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"J":["u5s5j1"],"lp1":["u5s5l1","u5s5l1:h"],"lp2":["u5s5l2","u5s5l2:h"]},"moves":{"cur":{"to":{"i1o":1,"i2o":1,"co":1},"dur":0.6},"cur3":{"to":{"i3o":1},"dur":0.5},"loops":{"to":{"lp1o":1,"lp2o":1},"dur":0.8}},"route":["電流を決める","閉回路を決める","式を立てる"]}},{"id":"t5s5x","scene":"t5s5x","kind":"u5s5two","lab":{"pm":1,"d1":1,"d2":-1,"s1":"{V}_1=17 V","s2":"{V}_2=3 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=3 Ω","i1":"{I}_1","i2":"{I}_2","i3":"{I}_1−{I}_2","lp2":1,"zp":[17,9,3,0],"fl":[4,1,3]},"viewbox":"464 218 670 432","band":{"want":"右の閉回路の式","known":"$V_2 = 3\\,\\mathrm{V},\\;\\; R_2 = 6\\,\\Omega,\\;\\; R_3 = 3\\,\\Omega$","ans":"$-3 = 6 I_2 - 3 (I_1 - I_2)$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、右の閉回路の式です。","at":{"強調":1.0},"after":[],"emph":["lp2"]},{"text":"①電流を確かめる\n②向きを比べる\n③式を立てる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["lp2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"上の点に入る $I_1$ から、$I_2$ が分かれた残りの $I_1 - I_2$ が、$R_3$ に流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["J","R3","I3","I1","I2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$R_2$ の $I_2$ は閉回路と同じ向きなので＋、〖$R_3$ の $I_1 - I_2$ は逆向きなので－〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["lp2","R2","I2","R3","I3","I1"]},{"text":"$V_2$ は、閉回路の向きに進むと〖＋極から－極へ通るので－〗です。","at":{"強調":1.0},"after":[],"emph":["lp2","V2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"起電力の和＝電圧降下の和で、式を立てます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["lp2","V2","R2","R3","I2","I3","I1"],"eq":[{"cont":false,"items":[["-3 = 6 I_2 - 3 (I_1 - I_2)"]]}],"ans":true,"emphPre":["lp2","V2","R2","R3","I2","I3","I1"],"zb":true}]}],"groups":{"V1":["c1:L","c1:S","c1p","c1m","s1t0","s1t1"],"V2":["c2:L","c2:S","c2p","c2m","s2t0","s2t1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"J":["u5s5j1"],"lp1":["u5s5l1","u5s5l1:h"],"lp2":["u5s5l2","u5s5l2:h"]},"moves":{},"route":["電流を確かめる","向きを比べる","式を立てる"]}},{"id":"t5s6e","scene":"t5s6e","kind":"u5s6net","lab":{"pm":1,"loop":1,"v1":"{V}_1=23 V","v2":"{V}_2=19 V","r1":"{R}_1=2 Ω","r2":"{R}_2=4 Ω","r3":"{R}_3=3 Ω","i1":["{I}_1","{I}_1=4 A"],"i2":["{I}_2","{I}_2=−1 A"],"i3":["({I}_1−{I}_2)","({I}_1−{I}_2)=5 A"],"fl":[4,-1],"zc":{"l":"hi","r":"mid","m":"mid2","b":"lo"}},"viewbox":"448 232 627 400","band":{"want":"2つの式から $I_1$・$I_2$","ans":"係数をそろえて足すか引き、1つの文字を消す","full":"ループ電流法で立てた2つの式は、カッコを外して同じ文字をまとめ、消したい文字の係数をそろえて足すか引くと、1つの文字が消える。出た値をもう一方の式に入れる。答えが負なら、決めた向きと逆に流れている。"},"narr":{"start":{"co":0,"zo":0,"i1v":0,"i2v":0,"i3v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"①文字を1つ消す\n②もう一方の式に入れる\n③負の答えを読む\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"2つの閉回路で、$I_1$ と $I_2$ の式を立てました。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["L1","L2","I1","I2"],"eq":[{"cont":false,"items":[["23 = 2I_1 + 3(I_1 - I_2)","-19 = 4I_2 - 3(I_1 - I_2)"]]}],"emphPre":["L1","L2","I1","I2"]},{"text":"カッコを外して、同じ文字をまとめます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I1","I2"],"eq":[{"cont":false,"items":[["23 = 5I_1 - 3I_2","-19 = -3I_1 + 7I_2"]]}],"emphPre":["I1","I2"]},{"text":"$I_1$ を消すため、〖$I_1$ の係数を最小公倍数の 15 にそろえます〗。上の式を3倍、下の式を5倍します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I1","I2"],"eq":[{"cont":false,"items":[["69 = 15I_1 - 9I_2","-95 = -15I_1 + 35I_2"]]}],"emphPre":["I1","I2"]},{"text":"2つの式を足すと、$I_1$ が消えて $I_2$ が出ます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I1","I2"],"eq":[{"cont":false,"items":[["-26 = 26I_2"],["I_2 = -1\\,\\mathrm{A}"]]}],"move":"i2val","emphPre":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$I_2 = -1$ を上の式に入れて、$I_1$ を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":2,"emph":["I1","I2"],"eq":[{"cont":false,"items":[["23 = 5I_1 + 3"],["I_1 = 4\\,\\mathrm{A}"]]}],"move":"i1val","emphPre":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I_2$ は負になりました。〖負の答えは、決めた矢印の向きと逆に流れている〗ということです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["I2"]},{"text":"$R_2$ には、右から左へ $1\\,\\mathrm{A}$ 流れています。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["I2","R2","z"],"move":"flow","zb":true},{"text":"真ん中の $R_3$ には $I_1 - I_2$ が流れます。〖負の数を引くので足し算〗になります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I1","I2","I3","R3"],"eq":[{"cont":false,"items":[["I_1 - I_2 = 4 - (-1) = 5\\,\\mathrm{A}"]]}],"move":"i3val","ans":true,"emphPre":["I1","I2","I3","R3"]}]}],"groups":{"V1":["u5s6c1:L","u5s6c1:S","u5s6c1p","u5s6c1m","u5s6c1t0","u5s6c1t1"],"V2":["u5s6c2:L","u5s6c2:S","u5s6c2p","u5s6c2m","u5s6c2t0","u5s6c2t1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"L1":["u5s6o1","u5s6o1:h"],"L2":["u5s6o2","u5s6o2:h"],"z":["zbu5s6l","zbu5s6r","zbu5s6m","zbu5s6b"]},"moves":{"i2val":{"to":{"i2v":1},"dur":0.4},"i1val":{"to":{"i1v":1},"dur":0.4},"flow":{"to":{"co":1,"zo":1},"dur":0.6},"i3val":{"to":{"i3v":1},"dur":0.4}},"route":["文字を1つ消す","もう一方の式に入れる","負の答えを読む"]}},{"id":"t5s6x","scene":"t5s6x","kind":"u5s6net","lab":{"pm":1,"loop":1,"v1":"{V}_1=24 V","v2":"{V}_2=10 V","r1":"{R}_1=4 Ω","r2":"{R}_2=2 Ω","r3":"{R}_3=6 Ω","i1":["{I}_1","{I}_1=3 A"],"i2":"{I}_2","i3":"({I}_1−{I}_2)"},"viewbox":"448 232 627 400","band":{"want":"電流 $I_1$","known":"$24 = 4I_1 + 6(I_1 - I_2)$、$-10 = 2I_2 - 6(I_1 - I_2)$","ans":"$I_1 = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":0,"i1v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、電流 $I_1$ です。","at":{"強調":1.0},"after":[],"emph":["I1"]},{"text":"①カッコを外す\n②文字を1つ消す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"2つの閉回路の式です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["L1","L2","I1","I2"],"eq":[{"cont":false,"items":[["24 = 4I_1 + 6(I_1 - I_2)","-10 = 2I_2 - 6(I_1 - I_2)"]]}],"emphPre":["L1","L2","I1","I2"]},{"text":"〖カッコを外して、同じ文字をまとめます〗。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I1","I2"],"eq":[{"cont":false,"items":[["24 =10I_1 - 6I_2","-10 = -6I_1 + 8I_2"]]}],"emphPre":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$I_1$ を求めたいので、$I_2$ を消します。〖$I_2$ の係数を 24 にそろえる〗ため、上の式を4倍、下の式を3倍します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I1","I2"],"eq":[{"cont":false,"items":[["96 = 40I_1 - 24I_2","-30 = -18I_1 + 24I_2"]]}],"emphPre":["I1","I2"]},{"text":"2つの式を足すと、$I_2$ が消えます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I1","I2"],"eq":[{"cont":false,"items":[["66 = 22I_1"],["I_1 = 3\\,\\mathrm{A}"]]}],"move":"i1val","ans":true,"emphPre":["I1","I2"]}]}],"groups":{"V1":["u5s6c1:L","u5s6c1:S","u5s6c1p","u5s6c1m","u5s6c1t0","u5s6c1t1"],"V2":["u5s6c2:L","u5s6c2:S","u5s6c2p","u5s6c2m","u5s6c2t0","u5s6c2t1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"L1":["u5s6o1","u5s6o1:h"],"L2":["u5s6o2","u5s6o2:h"],"z":["zbu5s6l","zbu5s6r","zbu5s6m","zbu5s6b"]},"moves":{"i1val":{"to":{"i1v":1},"dur":0.4}},"route":["カッコを外す","文字を1つ消す"]}},{"id":"t5s7e","scene":"t5s7e","kind":"u5s7loop","lab":{"pm":1,"loop":1,"o2":"t","v1":"{V}_1=30 V","v2":"{V}_2=10 V","r1":"{R}_1=6 Ω","r2":"{R}_2=4 Ω","i":"{I}=2 A","pa":["12 V","30 V"],"pb":["0 V","18 V"],"pc":["−10 V","8 V"],"pd":["−18 V","0 V"],"zc":{"a":"hi","b":"mid","c":"mid2","d":"lo"}},"viewbox":"448 232 627 400","band":{"want":"電源が2つある回路のそれぞれの点の電位","ans":"1つの点を 0 V と決め、上がり下がりを順に足す","full":"電源が2つ以上あると、－極が1つではないので、－極を 0 V と決められない。どこか1つの点を 0 V と決め、電源を－から＋へ通ると上がり、抵抗を電流の向きに通ると下がる分を順に足して、それぞれの点の電位を出す。電位は負になることもある。"},"narr":{"start":{"co":1,"lo":0,"pavo":0,"pbvo":0,"pcvo":0,"pdvo":0,"pav":0,"pbv":0,"pcv":0,"pdv":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"①0 V の点を決める\n②順に足す\n③一番低い点\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[4,5],"sents":[{"text":"電源が2つあると－極も2つあり、どちらを 0 V にするか決まりません。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V1","V2"]},{"text":"そこで、〖どこか1つの点を 0 V と決めます〗。ここでは点 b にします。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["pb"],"move":"pbv","zb":true}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"電流 $I = 2\\,\\mathrm{A}$ の向きに、b から一周します。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["I","O","pb"],"move":"loop"},{"text":"b から c へは、$V_2$ を＋から－へ通るので、$10\\,\\mathrm{V}$ 下がります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["V2","pb","pc"],"eq":[{"cont":false,"items":[["0 - 10 = -10\\,\\mathrm{V}"]]}],"move":"pcv","emphPre":["V2","pb","pc"],"zb":true},{"text":"c から d へは、〖$R_2$ を電流の向きに通るので、$R_2 I$ だけ下がります〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R2","I","pc","pd"],"eq":[{"cont":false,"items":[["-10 - 4 \\times 2 = -18\\,\\mathrm{V}"]]}],"move":"pdv","emphPre":["R2","I","pc","pd"],"zb":true},{"text":"d から a へは、〖$V_1$ を－から＋へ通るので、$30\\,\\mathrm{V}$ 上がります〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["V1","pd","pa"],"eq":[{"cont":false,"items":[["-18 + 30 = 12\\,\\mathrm{V}"]]}],"move":"pav","emphPre":["V1","pd","pa"],"zb":true},{"text":"a から b へは、$R_1$ で $R_1 I$ 下がり、0 V に戻ります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","I","pa","pb"],"eq":[{"cont":false,"items":[["12 - 6 \\times 2 = 0\\,\\mathrm{V}"]]}],"emphPre":["R1","I","pa","pb"],"zb":true}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"比べると、一番低いのは点 d の $-18\\,\\mathrm{V}$ です。〖電位は負になることもあります〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":3,"emph":["pd"],"ans":true,"zb":true},{"text":"点 d を 0 V と決め直すと、どの点も $18\\,\\mathrm{V}$ ずつ上がり、負の電位は無くなります。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["pa","pb","pc","pd"],"move":"shift","zb":true}]}],"groups":{"V1":["u5s7c1:L","u5s7c1:S","u5s7c1p","u5s7c1m","u5s7c1t0","u5s7c1t1"],"V2":["u5s7c2:L","u5s7c2:S","u5s7c2p","u5s7c2m","u5s7c2t0","u5s7c2t1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"O":["u5s7o","u5s7o:h"],"pa":["u5s7da","u5s7na","u5s7pat0","u5s7pat1","zbu5s7a"],"pb":["u5s7db","u5s7nb","u5s7pbt0","u5s7pbt1","zbu5s7b"],"pc":["u5s7dc","u5s7nc","u5s7pct0","u5s7pct1","zbu5s7c"],"pd":["u5s7dd","u5s7nd","u5s7pdt0","u5s7pdt1","zbu5s7d"]},"moves":{"pbv":{"to":{"pbvo":1},"dur":0.4},"pcv":{"to":{"pcvo":1},"dur":0.4},"pdv":{"to":{"pdvo":1},"dur":0.4},"pav":{"to":{"pavo":1},"dur":0.4},"loop":{"to":{"lo":1},"dur":0.5},"shift":{"to":{"pav":1,"pbv":1,"pcv":1,"pdv":1},"dur":0.8}},"route":["0 V の点を決める","順に足す","一番低い点"]}},{"id":"t5s7x","scene":"t5s7x","kind":"u5s7loop","lab":{"pm":1,"loop":1,"o2":"b","v1":"{V}_1=12 V","v2":"{V}_2=18 V","r1":"{R}_1=9 Ω","r2":"{R}_2=1 Ω","i":"{I}=3 A","pa":"12 V","pb":"−15 V","pc":"3 V","pd":"0 V","zc":{"a":"hi","b":"lo","c":"mid","d":"mid2"}},"viewbox":"448 232 627 400","band":{"want":"一番低い点の電位","known":"点 d が 0 V、$V_1 = 12\\,\\mathrm{V},\\;\\; V_2 = 18\\,\\mathrm{V},\\;\\; R_1 = 9\\,\\Omega,\\;\\; R_2 = 1\\,\\Omega,\\;\\; I = 3\\,\\mathrm{A}$","ans":"点 b の $-15\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"lo":0,"pavo":0,"pbvo":0,"pcvo":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"〖点 d を 0 V として〗、それぞれの点の電位を出し、一番低い点を探します。","at":{"強調":1.0},"after":[],"emph":["pd"],"zb":true},{"text":"①順に足す\n②一番低い点\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["pd"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"電流 $I = 3\\,\\mathrm{A}$ の向きに、d から一周します。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["I","O","pd"],"move":"loop"},{"text":"d から a へは、〖$V_1$ を－から＋へ通るので上がります〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["V1","pd","pa"],"eq":[{"cont":false,"items":[["0 + 12 = 12\\,\\mathrm{V}"]]}],"move":"pav","emphPre":["V1","pd","pa"],"zb":true},{"text":"a から b へは、$R_1$ で $R_1 I$ 下がります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","I","pa","pb"],"eq":[{"cont":false,"items":[["12 - 9 \\times 3 = -15\\,\\mathrm{V}"]]}],"move":"pbv","emphPre":["R1","I","pa","pb"],"zb":true},{"text":"b から c へは、$V_2$ を－から＋へ通るので上がります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["V2","pb","pc"],"eq":[{"cont":false,"items":[["-15 + 18 = 3\\,\\mathrm{V}"]]}],"move":"pcv","emphPre":["V2","pb","pc"],"zb":true}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"比べると、一番低いのは点 b の $-15\\,\\mathrm{V}$ です。〖0 V と決めた点 d ではありません〗。","at":{"道筋":1.0,"強調":1.0,"答え":1.0},"after":[],"route":2,"emph":["pb","pd"],"ans":true,"zb":true}]}],"groups":{"V1":["u5s7c1:L","u5s7c1:S","u5s7c1p","u5s7c1m","u5s7c1t0","u5s7c1t1"],"V2":["u5s7c2:L","u5s7c2:S","u5s7c2p","u5s7c2m","u5s7c2t0","u5s7c2t1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"O":["u5s7o","u5s7o:h"],"pa":["u5s7da","u5s7na","u5s7pat0","u5s7pat1","zbu5s7a"],"pb":["u5s7db","u5s7nb","u5s7pbt0","u5s7pbt1","zbu5s7b"],"pc":["u5s7dc","u5s7nc","u5s7pct0","u5s7pct1","zbu5s7c"],"pd":["u5s7dd","u5s7nd","u5s7pdt0","u5s7pdt1","zbu5s7d"]},"moves":{"pav":{"to":{"pavo":1},"dur":0.4},"pbv":{"to":{"pbvo":1},"dur":0.4},"pcv":{"to":{"pcvo":1},"dur":0.4},"loop":{"to":{"lo":1},"dur":0.5}},"route":["順に足す","一番低い点"]}},{"id":"t5k1x","scene":"t5k1x","kind":"u5k1h18","lab":{"rx":["{r}","{r}=0.15 Ω"],"src":["{E}","{E}=7.2 V"],"r":["{R}=2.25 Ω","{R}=3.45 Ω"],"i":["{I}=3 A","{I}=2 A"]},"viewbox":"500 178 516 392","band":{"want":"起電力 $E$","known":"$R = 2.25\\,\\Omega$ の時 $I = 3\\,\\mathrm{A}$・$R = 3.45\\,\\Omega$ の時 $I = 2\\,\\mathrm{A}$","ans":"$7.2\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"rxv":0,"srcv":0,"rv":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、起電力 $E$ です。電源の中の抵抗は $r$ です。","at":{"強調":1.0},"after":[],"emph":["src","Rx","box"]},{"text":"〖分からない物が2つなので、式も2つ要ります〗。$R$ を変えた2つの時で、閉回路の式を立てます。","at":{"強調":1.0},"after":[],"emph":["src","Rx","R"]},{"text":"①1つ目の閉回路の式\n②2つ目の閉回路の式\n③連立方程式を解く\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","Rx","R"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"電流 $I$ の向きに一周します。起電力は $E$、〖電圧降下は $r$ と $R$ の2つ〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","Rx","R","I","loop"],"zb":true},{"text":"$R = 2.25\\,\\Omega$ の時、$I = 3\\,\\mathrm{A}$ です。〖起電力の和は、電圧降下の和〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","Rx","R","I"],"eq":[{"cont":false,"items":[["E = r \\times 3 + 2.25 \\times 3"],["E = 3 r + 6.75"]]}],"emphPre":["src","Rx","R","I"],"zb":true}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$R = 3.45\\,\\Omega$ にすると、$I = 2\\,\\mathrm{A}$ になりました。同じように式にします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["src","Rx","R","I"],"move":"to2","eq":[{"cont":false,"items":[["E = r \\times 2 + 3.45 \\times 2"],["E = 2 r + 6.9"]]}],"emphPre":["src","Rx","R","I"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"2つの式を並べます。上の式から下の式を引くと、$E$ が消えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":3,"emph":["src","Rx"],"eq":[{"cont":false,"items":[["E = 3 r + 6.75","E = 2 r + 6.9"],["0 = r - 0.15"],["r = 0.15\\,\\Omega"]]}],"move":"rxval","emphPre":["src","Rx"]},{"text":"$r$ を上の式に入れます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","Rx"],"eq":[{"cont":false,"items":[["E = 3 \\times 0.15 + 6.75"],["E = 7.2\\,\\mathrm{V}"]]}],"move":"vval","emphPre":["src","Rx"]},{"text":"起電力 $E$ は $7.2\\,\\mathrm{V}$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["src"]}]}],"groups":{"src":["u5k1c:L","u5k1c:S","u5k1e0","u5k1e1"],"Rx":["u5k1rx","u5k1rxt0","u5k1rxt1"],"R":["u5k1r","u5k1rt0","u5k1rt1","u5k1va","u5k1va:h"],"I":["u5k1ia","u5k1ia:h","u5k1it0","u5k1it1"],"loop":["u5k1L1","u5k1L2","u5k1L3"],"box":["u5k1box"]},"moves":{"to2":{"to":{"rv":1,"iv":1},"dur":0.8},"rxval":{"to":{"rxv":1},"dur":0.4},"vval":{"to":{"srcv":1},"dur":0.4}},"route":["1つ目の閉回路の式","2つ目の閉回路の式","連立方程式を解く"]}},{"id":"t5k2x","scene":"t5k2x","kind":"u5k2r6","lab":{"pa":1,"r6":"6 Ω","r":["{R}","{R}=2 Ω"],"r1":"1 Ω","e9":"9 V","e3":"3 V","e4":"4 V","ia":"0.3 A","i1":["{I}_1","{I}_1=1.9 A"],"i2":["{I}_2","{I}_2=1.6 A"]},"viewbox":"404 190 716 420","band":{"want":"抵抗 $R$ の値","known":"$R$ の電流 $0.3\\,\\mathrm{A}$・電源 $9\\,\\mathrm{V}$・$3\\,\\mathrm{V}$・$4\\,\\mathrm{V}$・図の抵抗の値","ans":"$R = 2\\,\\Omega$"},"narr":{"start":{"co":1,"rv":0,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、抵抗 $R$ の値です。","at":{"強調":1.0},"after":[],"emph":["R","Ia"]},{"text":"$6\\,\\Omega$ の電流を $I_1$、下の道の電流を $I_2$ とします。向きは図の矢印の向きです。","at":{"強調":1.0},"after":[],"emph":["I1","I2","R6"]},{"text":"①点 a で第1法則\n②下の道を通る閉回路\n③上の道を通る閉回路\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["a","I1","I2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"点 a に〖入る電流は $I_1$、出る電流は $I_2$ と $0.3\\,\\mathrm{A}$〗 です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["a","I1","I2","Ia"],"eq":[{"cont":false,"items":[["I_1 = I_2 + 0.3"]]}],"emphPre":["a","I1","I2","Ia"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"$9\\,\\mathrm{V}$ から $6\\,\\Omega$ と下の道を通って一周します。起電力は $9\\,\\mathrm{V}$ と $4\\,\\mathrm{V}$ で、〖どちらも閉回路と同じ向きなので足します〗。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["E9","E4","R6","R1","I1","I2","loopB"],"eq":[{"cont":false,"items":[["9 + 4 = 6 \\times I_1 + 1 \\times I_2"]]}],"emphPre":["E9","E4","R6","R1","I1","I2","loopB"],"zb":true},{"text":"〖$I_1$ に $I_2 + 0.3$ を入れます〗。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I1","I2","R6","R1"],"eq":[{"cont":false,"items":[["13 = 6 \\times (I_2 + 0.3) + I_2"],["13 = 7 \\times I_2 + 1.8"],["I_2 = 1.6\\,\\mathrm{A}","I_1 = 1.9\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["I1","I2","R6","R1"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"次は $6\\,\\Omega$ と上の道を通って一周します。起電力は $9\\,\\mathrm{V}$ と $3\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":3,"emph":["E9","E3","R6","R","I1","Ia","loopT"],"eq":[{"cont":false,"items":[["9 + 3 = 6 \\times 1.9 + R \\times 0.3"]]}],"emphPre":["E9","E3","R6","R","I1","Ia","loopT"],"zb":true},{"text":"両辺から $11.4$ を引き、$0.3$ で割ります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R","Ia"],"eq":[{"cont":false,"items":[["0.6 = R \\times 0.3"],["R = 2\\,\\Omega"]]}],"move":"rval","emphPre":["R","Ia"]},{"text":"$R$ は $2\\,\\Omega$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["R"]}]}],"groups":{"R6":["u5k2r6","u5k2r6t0","u5k2r6t1"],"R":["u5k2r","u5k2rt0","u5k2rt1"],"R1":["u5k2r1","u5k2r1t0","u5k2r1t1"],"E9":["u5k2c9:L","u5k2c9:S","u5k2e90","u5k2e91"],"E3":["u5k2c3:L","u5k2c3:S","u5k2e30","u5k2e31"],"E4":["u5k2c4:L","u5k2c4:S","u5k2e40","u5k2e41"],"I1":["u5k2i1a","u5k2i1a:h","u5k2i1t0","u5k2i1t1"],"I2":["u5k2i2a","u5k2i2a:h","u5k2i2t0","u5k2i2t1"],"Ia":["u5k2iaa","u5k2iaa:h","u5k2iat0","u5k2iat1"],"a":["u5k2j1","u5k2na"],"loopB":["u5k2a","u5k2b1","u5k2e","u5k2f","u5k2g","u5k2h"],"loopT":["u5k2a","u5k2b1","u5k2b2","u5k2c","u5k2d","u5k2h"]},"moves":{"ival":{"to":{"i1v":1,"i2v":1},"dur":0.4},"rval":{"to":{"rv":1},"dur":0.4}},"route":["点 a で第1法則","下の道を通る閉回路","上の道を通る閉回路"]}},{"id":"t5k3x","scene":"t5k3x","kind":"u5k3h27","lab":{"pa":1,"ra":"60 Ω","rb":"60 Ω","rc":"60 Ω","r1":["{R}_1","{R}_1=40 Ω"],"r2":["{R}_2","{R}_2=90 Ω"],"r3":["{R}_3","{R}_3=120 Ω"],"src":"90 V","pv":["30 V","15 V","10 V"],"i":"{I}","ia":"{I}_a","ib":"{I}_b","i1":"{I}_1","i2":"{I}_2"},"viewbox":"440 206 810 392","band":{"want":"$R_1$・$R_2$・$R_3$ の値","known":"電源 $90\\,\\mathrm{V}$・$R_1$・$R_2$・$R_3$ の電圧 $30\\,\\mathrm{V}$・$15\\,\\mathrm{V}$・$10\\,\\mathrm{V}$","ans":"$R_1 = 40\\,\\Omega$・$R_2 = 90\\,\\Omega$・$R_3 = 120\\,\\Omega$"},"narr":{"start":{"co":1,"r1v":0,"r2v":0,"r3v":0},"steps":[{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"求めるのは、$R_1$・$R_2$・$R_3$ の値です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3"]},{"text":"どの抵抗も電圧は分かっています。〖電流が分かれば、オームの法則で値が出ます〗。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","a","b","c3"]},{"text":"①上の $60\\,\\Omega$ の電流\n②$R_3$ と $R_2$\n③$R_1$\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R60","R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[1,4],"sents":[{"text":"下の線を $0\\,\\mathrm{V}$ とすると、点 a は $30\\,\\mathrm{V}$、点 b は $15\\,\\mathrm{V}$ です。〖縦の抵抗の電圧と同じ〗です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["a","b","bot"],"zb":true},{"text":"上の $60\\,\\Omega$ の電圧は、〖左と右の電位の差〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R60","I","Ia","src","a","b"],"eq":[{"cont":false,"items":[["I = \\dfrac{90 - 30}{60} = 1\\,\\mathrm{A}"],["I_a = \\dfrac{30 - 15}{60} = 0.25\\,\\mathrm{A}"]]}],"emphPre":["R60","I","Ia","src","a","b"],"zb":true}]},{"cap":null,"eqp":null,"vid":[4,5],"sents":[{"text":"右の $60\\,\\Omega$ と $R_3$ は直列です。電圧は $15 - 10 = 5\\,\\mathrm{V}$ と $10\\,\\mathrm{V}$ で、比は $1 : 2$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R60","R3","b","c3","Ib"],"zb":true},{"text":"分圧では、〖電圧の比が抵抗の比〗です。$R_3$ は $60\\,\\Omega$ の2倍です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R60","R3"],"eq":[{"cont":false,"items":[["R_3 = 60 \\times 2 = 120\\,\\Omega"]]}],"move":"r3val","emphPre":["R60","R3"]},{"text":"点 b に入る電流 $I_a$ は、$I_2$ と $I_b$ に分かれます。$I_b$ は $R_3$ の電流です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["b","Ia","I2","Ib","R3","c3"],"eq":[{"cont":false,"items":[["I_b = \\dfrac{10}{120} = \\dfrac{1}{12}\\,\\mathrm{A}"],["I_2 = \\dfrac{3}{12} - \\dfrac{1}{12} = \\dfrac{1}{6}\\,\\mathrm{A}"]]}],"emphPre":["b","Ia","I2","Ib","R3","c3"]},{"text":"$\\dfrac{1}{6}$ で割るのは、$6$ を掛けるのと同じです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R2","b","I2"],"eq":[{"cont":false,"items":[["R_2 = 15 \\times 6 = 90\\,\\Omega"]]}],"move":"r2val","emphPre":["R2","b","I2"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"点 a に入る電流 $I$ は、$I_1$ と $I_a$ に分かれます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":3,"emph":["a","I","I1","Ia","R1"],"eq":[{"cont":false,"items":[["I_1 = 1 - 0.25 = 0.75\\,\\mathrm{A}"],["R_1 = \\dfrac{30}{0.75} = 40\\,\\Omega"]]}],"move":"r1val","emphPre":["a","I","I1","Ia","R1"]},{"text":"$R_1 = 40\\,\\Omega$・$R_2 = 90\\,\\Omega$・$R_3 = 120\\,\\Omega$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["R1","R2","R3"]}]}],"groups":{"R60":["u5k3ra","u5k3rat0","u5k3rat1","u5k3rb","u5k3rbt0","u5k3rbt1","u5k3rc","u5k3rct0","u5k3rct1"],"R1":["u5k3r1","u5k3r1t0","u5k3r1t1"],"R2":["u5k3r2","u5k3r2t0","u5k3r2t1"],"R3":["u5k3r3","u5k3r3t0","u5k3r3t1"],"src":["u5k3c:L","u5k3c:S","u5k3e0","u5k3e1"],"I":["u5k3ia","u5k3ia:h","u5k3it0","u5k3it1"],"Ia":["u5k3iaa","u5k3iaa:h","u5k3iat0","u5k3iat1"],"Ib":["u5k3iba","u5k3iba:h","u5k3ibt0","u5k3ibt1"],"I1":["u5k3i1a","u5k3i1a:h","u5k3i1t0","u5k3i1t1"],"I2":["u5k3i2a","u5k3i2a:h","u5k3i2t0","u5k3i2t1"],"a":["u5k3j0","u5k3na","u5k3pa"],"b":["u5k3j2","u5k3nb","u5k3pb"],"c3":["u5k3pc"],"bot":["u5k3w1","u5k3w2","u5k3w3","u5k3v1d","u5k3v2d"]},"moves":{"r3val":{"to":{"r3v":1},"dur":0.4},"r2val":{"to":{"r2v":1},"dur":0.4},"r1val":{"to":{"r1v":1},"dur":0.4}},"route":["上の $60\\,\\Omega$ の電流","$R_3$ と $R_2$","$R_1$"]}},{"id":"t5k4x","scene":"t5k4x","kind":"u5k4h22","lab":{"r1":["{R}_1","{R}_1=250 Ω"],"r2":["{R}_2","{R}_2=62.5 Ω"],"src":"100 V","r15":"150 Ω","v1":"20 V","v2":"15 V","i":"{I}"},"viewbox":"490 186 612 434","band":{"want":"図3で b-c 間を短絡した時の電流 $I$","known":"図1：b-c 間 $20\\,\\mathrm{V}$　図2：$150\\,\\Omega$ を並列で b-c 間 $15\\,\\mathrm{V}$　電源 $100\\,\\mathrm{V}$","ans":"$I = 0.4\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"s15":0,"ssh":0,"v1o":1,"v2o":0,"t1o":1,"t2o":0,"t3o":0,"r1v":0,"r2v":0},"steps":[{"cap":null,"eqp":null,"vid":[4,5],"sents":[{"text":"求めるのは、図3で b-c 間を短絡した時の電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I","S","bc"]},{"text":"①図1：分圧から $R_1$ と $R_2$\n②図2：点 b で第1法則\n③図3：短絡\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","b"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"図1は直列です。b-c 間の $R_2$ に $20\\,\\mathrm{V}$、$R_1$ に残りの $80\\,\\mathrm{V}$ がかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","V1","src"],"zb":true},{"text":"分圧では、〖電圧の比が抵抗の比〗です。$80 : 20 = 4 : 1$ なので、$R_1$ は $R_2$ の4倍です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","V1"],"eq":[{"cont":false,"items":[["R_1 = 4 R_2"]]}],"emphPre":["R1","R2","V1"]}]},{"cap":null,"eqp":null,"vid":[4],"sents":[{"text":"図2では、b-c 間に $150\\,\\Omega$ が並列に入り、b-c 間は $15\\,\\mathrm{V}$、$R_1$ は残りの $85\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["R15","V2","R1","bc"],"move":"to2","zb":true},{"text":"点 b に〖入る電流は $R_1$ の電流、出る電流は $R_2$ と $150\\,\\Omega$ の電流〗です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["b","R1","R2","R15","V2"],"eq":[{"cont":false,"items":[["\\dfrac{85}{R_1} = \\dfrac{15}{R_2} + \\dfrac{15}{150}"]]}],"emphPre":["b","R1","R2","R15","V2"]},{"text":"$R_1$ に $4 R_2$ を入れ、両辺に $4 R_2$ を掛けます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R2"],"eq":[{"cont":false,"items":[["\\dfrac{85}{4 R_2} = \\dfrac{15}{R_2} + 0.1"],["85 = 60 + 0.4 R_2"],["R_2 = 62.5\\,\\Omega"]]}],"move":"r2val","emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"図3では、b-c 間を短絡します。〖電流は全部が短絡した線に流れ〗、$R_2$ には流れません。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["S","R2","I","bc"],"move":"to3"},{"text":"〖回路は $R_1$ だけと同じ〗です。$R_1$ は $R_2$ の4倍で $250\\,\\Omega$ です。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","I","src"],"move":"r1val","eq":[{"cont":false,"items":[["I = \\dfrac{100}{250} = 0.4\\,\\mathrm{A}"]]}],"emphPre":["R1","R2","I","src"]},{"text":"$I$ は $0.4\\,\\mathrm{A}$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["I"]}]}],"groups":{"R1":["u5k4sr1","u5k4sr1t0","u5k4sr1t1"],"R2":["u5k4sr2","u5k4sr2t0","u5k4sr2t1"],"R15":["u5k4sr15","u5k4sr15t0","u5k4sr15t1","u5k4ss1","u5k4ss2"],"S":["u5k4ssh"],"src":["u5k4sc:L","u5k4sc:S","u5k4se0","u5k4se1"],"V1":["u5k4sv1d:e","u5k4sv1d:f","u5k4sv1d:a","u5k4sv1t0","u5k4sv1t1"],"V2":["u5k4sv2d:e","u5k4sv2d:f","u5k4sv2d:a","u5k4sv2t0","u5k4sv2t1"],"I":["u5k4sia","u5k4sia:h","u5k4sit0","u5k4sit1"],"bc":["u5k4stb","u5k4stb:t","u5k4stc","u5k4stc:t"],"b":["u5k4stb","u5k4stb:t"]},"moves":{"to2":{"to":{"s15":1,"v1o":0,"v2o":1,"t1o":0,"t2o":1},"dur":0.8},"to3":{"to":{"s15":0,"v2o":0,"ssh":1,"t2o":0,"t3o":1},"dur":0.8},"r2val":{"to":{"r2v":1},"dur":0.4},"r1val":{"to":{"r1v":1},"dur":0.4}},"route":["図1：分圧から $R_1$ と $R_2$","図2：点 b で第1法則","図3：短絡"]}}],"secs":[{"ex":{"text":"図の点に、$I_1 = 7\\,\\mathrm{A}$ と $I_2 = 5\\,\\mathrm{A}$ の電流が入り、$I_3 = 9\\,\\mathrm{A}$ と $I_4$ の電流が出ている。$I_4$ は何 A か。","fig":{"kind":"u5s1node","L":{"br":{"l":1,"u":1,"r":0,"d":0},"i1":"{I}_1=7 A","i2":"{I}_2=5 A","i3":"{I}_3=9 A","i4":"{I}_4"},"P":{}},"ch":[{"t":"$21\\,\\mathrm{A}$","v":21,"why":"入る電流と出る電流を分けずに、全部足した"},{"t":"$12\\,\\mathrm{A}$","v":12,"why":"入る電流の合計を、そのまま $I_4$ とした（$I_3$ を引いていない）"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$11\\,\\mathrm{A}$","v":11,"why":"$I_2$ と $I_3$ の、入る・出るを取り違えた"}],"ans":2}},{"ex":{"text":"図の回路で、電源の電圧は $V = 50\\,\\mathrm{V}$、$R_1 = 4\\,\\Omega$、$R_2 = 10\\,\\Omega$ で、$R_1$ に流れる電流は $I_1 = 5\\,\\mathrm{A}$ である。$R_2$ に流れる電流 $I_2$ は何 A か。","fig":{"kind":"u5s2sp","L":{"pm":1,"src":"{V}=50 V","r1":"{R}_1=4 Ω","r2":"{R}_2=10 Ω","r3":"{R}_3","i1":"{I}_1=5 A","i2":"{I}_2"},"P":{}},"ch":[{"t":"$5\\,\\mathrm{A}$","v":5,"why":"$R_1$ の電圧降下を引かずに、$V$ を $R_2$ で割った"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$7\\,\\mathrm{A}$","v":7,"why":"$R_1$ の電圧降下を、引かずに足した"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"$R_1$ の電圧降下を、そのまま $R_2$ で割った"}],"ans":1}},{"ex":{"text":"図の回路で、$R_2 = 6\\,\\Omega$ に $I_2 = 2\\,\\mathrm{A}$ の電流が流れ、$R_3 = 3\\,\\Omega$ に $I_3$ の電流が流れている。図の矢印の向きに $R_2$ と $R_3$ を通って一周する閉回路で考えると、$I_3$ は何 A か。","fig":{"kind":"u5s3sp","L":{"pm":1,"lb":1,"src":"{V}","r1":"{R}_1","r2":"{R}_2=6 Ω","r3":"{R}_3=3 Ω","i1":"{I}_1","i2":"{I}_2=2 A","i3":"{I}_3"},"P":{}},"ch":[{"t":"$1\\,\\mathrm{A}$","v":1,"why":"$R_2$ と $R_3$ を取り違えた"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"$I_3$ も $I_2$ と同じ電流と考えた"},{"t":"$12\\,\\mathrm{A}$","v":12,"why":"$R_2$ の電圧降下の値を、そのまま電流とした"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":""}],"ans":3}},{"ex":{"text":"図のように、電源 $V_1 = 8\\,\\mathrm{V}$、$V_2 = 12\\,\\mathrm{V}$ と抵抗 $R = 4\\,\\Omega$ を直列につないだ。電流 $I$ は何 A か。","fig":{"kind":"u5s4ser","L":{"pm":1,"d1":1,"d2":1,"s1":"{V}_1=8 V","s2":"{V}_2=12 V","r":"{R}=4 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$1\\,\\mathrm{A}$","v":1,"why":"同じ向きの電源なのに、引いてまとめた"},{"t":"$5\\,\\mathrm{A}$","v":5,"why":""},{"t":"$3\\,\\mathrm{A}$","v":3,"why":"$V_1$ を入れず、$V_2$ だけで割った"},{"t":"$80\\,\\mathrm{A}$","v":80,"why":"まとめた電圧と抵抗を掛けた"}],"ans":1}},{"ex":{"text":"図の回路で、右の閉回路を矢印の向きに決めた。起電力の和＝電圧降下の和の式は □ である。","fig":{"kind":"u5s5two","L":{"pm":1,"d1":1,"d2":-1,"s1":"{V}_1=17 V","s2":"{V}_2=3 V","r1":"{R}_1=2 Ω","r2":"{R}_2=6 Ω","r3":"{R}_3=3 Ω","i1":"{I}_1","i2":"{I}_2","i3":"{I}_1−{I}_2","lp2":1,"zp":[17,9,3,0]},"P":{}},"ch":[{"t":"$3 = 6 I_2 - 3 (I_1 - I_2)$","v":"v2","why":"$V_2$ は、閉回路の向きに進むと＋極から－極へ通るので －"},{"t":"$-3 = 6 I_2 - 3 (I_1 - I_2)$","v":"ok","why":""},{"t":"$-3 = 6 I_2 + 3 (I_1 - I_2)$","v":"r3","why":"$R_3$ の $I_1 - I_2$ は閉回路と逆向きなので －"},{"t":"$-3 = 6 I_2 - 3 I_1$","v":"i","why":"$R_3$ に流れるのは $I_1 - I_2$"}],"ans":1}},{"ex":{"text":"図の回路で、2つの閉回路について次の式を立てた。$24 = 4I_1 + 6(I_1 - I_2)$、$-10 = 2I_2 - 6(I_1 - I_2)$　電流 $I_1$ は何 A か。","fig":{"kind":"u5s6net","L":{"pm":1,"loop":1,"v1":"{V}_1=24 V","v2":"{V}_2=10 V","r1":"{R}_1=4 Ω","r2":"{R}_2=2 Ω","r3":"{R}_3=6 Ω","i1":"{I}_1","i2":"{I}_2","i3":"({I}_1−{I}_2)"},"P":{}},"ch":[{"t":"$1\\,\\mathrm{A}$","v":1,"why":"$I_1$ でなく、もう一方の $I_2$ を求めた"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$9\\,\\mathrm{A}$","v":9,"why":"カッコを外す時に、$-6I_2$ の符号をまちがえた"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":"真ん中の $R_3$ に流れる $I_1 - I_2$ を答えた"}],"ans":1}},{"ex":{"text":"図の回路で、点 d を 0 V とする。電位が一番低い点の電位は何 V か。","fig":{"kind":"u5s7loop","L":{"pm":1,"o2":"b","v1":"{V}_1=12 V","v2":"{V}_2=18 V","r1":"{R}_1=9 Ω","r2":"{R}_2=1 Ω","i":"{I}=3 A","pa":"","pb":"","pc":"","pd":"0 V"},"P":{}},"ch":[{"t":"$0\\,\\mathrm{V}$","v":0,"why":"－極の点 d が一番低いと考えた"},{"t":"$-27\\,\\mathrm{V}$","v":-27,"why":"$V_1$ で上がる分を足していない"},{"t":"$-15\\,\\mathrm{V}$","v":-15,"why":""},{"t":"$15\\,\\mathrm{V}$","v":15,"why":"上がり下がりを逆にした"}],"ans":2}}],"past":[{"id":"h18q5","title":"平成18年 問5","text":"図のように，内部抵抗 $r$ [Ω]，起電力 $E$ [V] の電池に抵抗 $R$ [Ω] の可変抵抗器を接続した回路がある。$R = 2.25$ [Ω] にしたとき，回路を流れる電流は $I = 3$ [A] であった。次に，$R = 3.45$ [Ω] にしたとき，回路を流れる電流は $I = 2$ [A] となった。この電池の起電力 $E$ [V] の値として，正しいのは次のうちどれか。","fig":{"kind":"u5k1h18","L":{"q":1,"rx":"{r} [Ω]","src":"{E} [V]","r":"{R} [Ω]","i":"{I} [A]"},"P":{}},"ch":[{"t":"$6.75$","v":"1","why":""},{"t":"$6.90$","v":"2","why":""},{"t":"$7.05$","v":"3","why":""},{"t":"$7.20$","v":"4","why":""},{"t":"$9.30$","v":"5","why":""}],"ans":3,"slide":"t5k1x","credit":"出典：一般財団法人 電気技術者試験センター 平成18年度 第三種 理論 問5（図は描き直し）"},{"id":"r6aq6","title":"令和6年上期 問6","text":"図の回路において，抵抗 $R$ [Ω] には電流 0.3 A が流れている。抵抗 $R$ の値 [Ω] として，最も近いものを次の(1)～(5)のうちから一つ選べ。","fig":{"kind":"u5k2r6","L":{"q":1,"r6":"6 Ω","r":"{R} [Ω]","r1":"1 Ω","e9":"9 V","e3":"3 V","e4":"4 V","ia":"0.3 A"},"P":{}},"ch":[{"t":"$2.0$","v":"1","why":""},{"t":"$2.8$","v":"2","why":""},{"t":"$3.7$","v":"3","why":""},{"t":"$4.9$","v":"4","why":""},{"t":"$25$","v":"5","why":""}],"ans":0,"slide":"t5k2x","credit":"出典：一般財団法人 電気技術者試験センター 令和6年度上期 第三種 理論 問6（図は描き直し）"},{"id":"h27q4","title":"平成27年 問4","text":"図のような直流回路において，直流電源の電圧が 90 V であるとき，抵抗 $R_1$ [Ω]，$R_2$ [Ω]，$R_3$ [Ω] の両端電圧はそれぞれ 30 V，15 V，10 V であった。抵抗 $R_1$，$R_2$，$R_3$ のそれぞれの値 [Ω] の組合せとして，正しいものを次の(1)～(5)のうちから一つ選べ。","fig":{"kind":"u5k3h27","L":{"ra":"60 Ω","rb":"60 Ω","rc":"60 Ω","r1":"{R}_1 [Ω]","r2":"{R}_2 [Ω]","r3":"{R}_3 [Ω]","src":"90 V","v1":"30 V","v2":"15 V","v3":"10 V"},"P":{}},"ch":[{"t":"$R_1$ $30$・$R_2$ $90$・$R_3$ $120$","v":"1","why":""},{"t":"$R_1$ $80$・$R_2$ $60$・$R_3$ $120$","v":"2","why":""},{"t":"$R_1$ $30$・$R_2$ $90$・$R_3$ $30$","v":"3","why":""},{"t":"$R_1$ $60$・$R_2$ $60$・$R_3$ $30$","v":"4","why":""},{"t":"$R_1$ $40$・$R_2$ $90$・$R_3$ $120$","v":"5","why":""}],"ans":4,"slide":"t5k3x","credit":"出典：一般財団法人 電気技術者試験センター 平成27年度 第三種 理論 問4（図は描き直し）"},{"id":"h22q6","title":"平成22年 問6","text":"図1の直流回路において，端子 a-c 間に直流電圧 100 [V] を加えたところ，端子 b-c 間の電圧は 20 [V] であった。また，図2のように端子 b-c 間に 150 [Ω] の抵抗を並列に追加したとき，端子 b-c 間の端子電圧は 15 [V] であった。いま，図3のように端子 b-c 間を短絡したとき，電流 $I$ [A] の値として，正しいのは次のうちどれか。","fig":{"kind":"u5k4h22","L":{"r1":"{R}_1 [Ω]","r2":"{R}_2 [Ω]","src":"100 V","r15":"150 Ω","v1":"20 V","v2":"15 V","i":"{I} [A]","figs":[[1,560,250],[2,1160,250],[3,560,740]]},"P":{}},"ch":[{"t":"$0$","v":"1","why":""},{"t":"$0.10$","v":"2","why":""},{"t":"$0.32$","v":"3","why":""},{"t":"$0.40$","v":"4","why":""},{"t":"$0.67$","v":"5","why":""}],"ans":3,"slide":"t5k4x","credit":"出典：一般財団法人 電気技術者試験センター 平成22年度 第三種 理論 問6（図は描き直し）"}]}};
});
