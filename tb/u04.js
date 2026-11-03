/* 単元4「分圧と分流」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(4, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, ZC = H.ZC, zband = H.zband, ztint = H.ztint, zpt = H.zpt, zones = H.zones, vOn = H.vOn, zoneTint = H.zoneTint, zSides = H.zSides, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元4の図（自作）の、節の間で共通の部品。共通の部品（vdim・pv・swapText・zones など）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 節の図は u04/sN_scenes.js（u04.py が番号順につなぎ、KINDS・FLOWK を1つにまとめる）。このファイルは書き換えない（足したい部品は自分の節のファイルへ）。
// 単元3の部品（u03/common_scenes.js）と同じ形。単元のファイルは別々に読み込むので、名前に 4 を付けて写した。
// 名前 L[k]：文字（そのまま）か [前, 後]（p[k + "v"] で前→後へ入れ替える）。矢印の濃さ＝p[k + "o"]（無ければ 1）、
// 電圧の矢印の伸び＝p[k + "d"]（無ければ 1）。問題の画面の図は p を渡さない＝全部出た形。
// 座標は単元3と同じ：上の線 y=360、左の縦の線 x=478、右の縦の線 x=1045、電池は下の線の真ん中（＋極＝長い線 x=752、－極 x=772）。
// 電流は＋極から出て、下の線を左へ → 左の線を上へ → 上の線を右へ → 右の線を下へ。抵抗は左の端（電流が入る側）が高い電位。
function lab4(d, id, x, y, spec, p, k, o, opt){
  if (spec === undefined || spec === null) return;
  if (Array.isArray(spec)) swapText(d, id, x, y, spec[0], spec[1], pv(p, k + "v"), o, opt);
  else swapText(d, id, x, y, spec, null, 0, o, opt);
}
// 抵抗（横）と名前（抵抗の上）
function resL4(d, id, x, y, L, k, p){
  d.res(id, x, y, "h");
  lab4(d, id + "t", x, y - 30, L[k], p, k, 1);
}
// 横の抵抗の電圧の矢印（上 or 下）。左の端が高い電位＝矢じりは左
function vArrow4(d, id, x, y, L, k, p, below){
  if (L[k] === undefined) return;
  var dd = pv(p, k + "d", 1), y0 = below ? y + 10 : y - 10, y1 = below ? y + 95 : y - 85, ya = below ? y + 85 : y - 75;
  var w = vdim(d, id + "d", x - 72.5, x + 72.5, y0, y1, ya, dd, {});
  lab4(d, id + "t", x, below ? ya + 25 : ya - 25, L[k], p, k, w);
}
// 左の縦の線（x=478）の全体の電流 I（上向き）。名前は線の右。id＝k + "a"・名前＝k + "t"
function iLeft4(d, yb, L, p, k){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), ym = yb - 80;
  d.arrow(k + "a", 478, ym + 20, 478, ym - 20, {o: o});
  lab4(d, k + "t", 494, ym, L[k], p, k, o, {anchor: "start"});
}
// 横の線の上の電流の矢印（右向き）。x＝矢印の真ん中、名前は線の上（below で下）。並列の道の電流（抵抗の右の線）などに使う
// （電流の矢印は、その電流が流れる導線の上に置く＝proto_circuit/SPEC_expl.md §4。名前は線にかけない）
function iWire4(d, k, x, y, L, p, below){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1);
  d.arrow(k + "a", x - 20, y, x + 20, y, {o: o});
  lab4(d, k + "t", x, below ? y + 30 : y - 24, L[k], p, k, o);
}
// 電源（下の線の真ん中）・＋と－・電源の電圧の名前
function srcPart4(d, yb, L, p){
  d.cell("c", 752, yb);
  if (L.pm) { d.text("pp", 722, yb - 26, "+"); d.text("pm", 802, yb - 26, "−"); }
  lab4(d, "e", 762, yb + 42, L.src, p, "src", 1);
}
// 電位を見る点：L["p" + k] = {v: 電位}（v が無ければ点と名前だけ）。点の濃さ＝p["p" + k + "o"]、電位の濃さ＝p["p" + k + "vo"]
// side "v"＝縦の線の上（名前は線の左・電位は線の右）、無し＝横の線の上（名前は線の下・電位は線の上）
function pt4(d, k, x, y, L, p, side){
  var P = L["p" + k]; if (!P) return;
  var o = pv(p, "p" + k + "o", 1), vo = o * pv(p, "p" + k + "vo", 1);
  d.dot("d" + k, x, y, {o: o});
  if (side === "v") {
    d.text("n" + k, x - 18, y, k, {o: o, anchor: "end"});
    if (P.v !== undefined) lab4(d, "p" + k + "t", x + 18, y, P.v, p, "p" + k, vo, {anchor: "start"});
  } else {
    d.text("n" + k, x, y + 30, k, {o: o});
    if (P.v !== undefined) lab4(d, "p" + k + "t", x, y - 32, P.v, p, "p" + k, vo);
  }
}
// ---- 4-1 分圧（2つの抵抗）の図：直列（u4s1ser）。上の線に R1（x=640）・R2（x=880）、下の線 y=560、電池は下の線の真ん中。
// 電圧の矢印 V1・V2 は各抵抗の上。全体の電流 I は左の縦の線（上向き）。形は単元3の 3-1 の pser と同じ（点は無い）。
// 線の id は u4s1 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
// 同じ電位の線の色の帯（tb_scenes.js の zones）：電源の電圧か電圧の矢印がある時。＋極の側＝赤・R1 と R2 の間＝紫・－極の側＝灰。
function U4S1Z(yb){ return {hi: {lines: [[[752, yb], [478, yb], [478, 360], [610, 360]]]}, mid: {lines: [[[670, 360], [850, 360]]]},
  lo: {lines: [[[910, 360], [1045, 360], [1045, yb], [772, yb]]]}}; }
function tbU4s1ser(d, p, L){
  var yb = 560;
  zones(d, p, L, U4S1Z(yb), vOn(L, ["src", "v1", "v2"]));
  d.wire("u4s1L", [[478, 360], [478, yb], [752, yb]]);
  d.wire("u4s1R", [[772, yb], [1045, yb], [1045, 360]]);
  d.wire("u4s1w1", [[478, 360], [610, 360]]); d.wire("u4s1wm", [[670, 360], [850, 360]]); d.wire("u4s1w2", [[910, 360], [1045, 360]]);
  srcPart4(d, yb, L, p);
  resL4(d, "r1", 640, 360, L, "r1", p); resL4(d, "r2", 880, 360, L, "r2", p);
  vArrow4(d, "v1", 640, 360, L, "v1", p); vArrow4(d, "v2", 880, 360, L, "v2", p);
  iLeft4(d, yb, L, p, "i");
}
// ---- 4-2 分圧（3つ以上）の図：直列の3つの抵抗（u4s2ser）。上の線に R1（x=600）・R2（x=760）・R3（x=920）、下の線 y=560、電池は下の線の真ん中。
// 抵抗の置き場所は単元3の 3-2 の直列3つと同じ。電圧の矢印 V1・V2・V3 は各抵抗の上。全体の電流 I は左の縦の線（上向き）。
// 線の id は u4s2 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
// 同じ電位の線の色の帯（tb_scenes.js の zones）：電源の電圧か電圧の矢印がある時。＋極の側＝赤・R1〜R2＝紫・R2〜R3＝藍・－極の側＝灰。
function U4S2Z(yb){ return {hi: {lines: [[[752, yb], [478, yb], [478, 360], [570, 360]]]}, mid: {lines: [[[630, 360], [730, 360]]]},
  mid2: {lines: [[[790, 360], [890, 360]]]}, lo: {lines: [[[950, 360], [1045, 360], [1045, yb], [772, yb]]]}}; }
function tbU4s2ser(d, p, L){
  var yb = 560;
  zones(d, p, L, U4S2Z(yb), vOn(L, ["src", "v1", "v2", "v3"]));
  d.wire("u4s2L", [[478, 360], [478, yb], [752, yb]]);
  d.wire("u4s2R", [[772, yb], [1045, yb], [1045, 360]]);
  d.wire("u4s2w0", [[478, 360], [570, 360]]); d.wire("u4s2w1", [[630, 360], [730, 360]]);
  d.wire("u4s2w2", [[790, 360], [890, 360]]); d.wire("u4s2w3", [[950, 360], [1045, 360]]);
  srcPart4(d, yb, L, p);
  resL4(d, "r1", 600, 360, L, "r1", p); resL4(d, "r2", 760, 360, L, "r2", p); resL4(d, "r3", 920, 360, L, "r3", p);
  vArrow4(d, "v1", 600, 360, L, "v1", p); vArrow4(d, "v2", 760, 360, L, "v2", p); vArrow4(d, "v3", 920, 360, L, "v3", p);
  iLeft4(d, yb, L, p, "i");
}
// ---- 4-3 分流（2つの抵抗）の図：並列（u4s3par）。左右の縦の線 x=600・960、上の道 y=280（R1）・下の道 y=440（R2）、抵抗 x=740、下の線 y=640。
// 形は単元2の par と同じ。分かれる点・合流する点（y=360）に点。電池は下の線の真ん中。
// 電流の矢印：全体の電流 I は左の縦の線（上向き）、I1・I2 は各道の抵抗の右の線（x=880・右向き。名前は道の内側＝I1 は線の下・I2 は線の上）。
// 電圧の矢印 V1（R1 の上）・V2（R2 の下）は、どちらも電源の電圧と同じ電圧がかかることを見せる時だけ。
// 線の id は u4s3 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
// 同じ電位の線の色の帯（tb_scenes.js の zones）：電源の電圧か電圧の矢印がある時。分かれる側（＋極の側）＝赤・合流する側（－極の側）＝灰。
// 電流の流れ（矢じり）の間隔は道ごとの電流に反比例：L.fl＝[全体, 上の道, 下の道] の電流の比（無ければ [2, 1, 1]）。
function U4S3Z(yb, xl, xr, xm){
  return {hi: {lines: [[[752, yb], [478, yb], [478, 360], [xl, 360]], [[xm - 30, 280], [xl, 280], [xl, 440], [xm - 30, 440]]]},
          lo: {lines: [[[xr, 360], [1045, 360], [1045, yb], [772, yb]], [[xm + 30, 280], [xr, 280], [xr, 440], [xm + 30, 440]]]}};
}
function tbU4s3par(d, p, L){
  var yb = 640, xl = 600, xr = 960, xm = 740;
  zones(d, p, L, U4S3Z(yb, xl, xr, xm), vOn(L, ["src", "v1", "v2"]));
  d.wire("u4s3L", [[xl, 360], [478, 360], [478, yb], [752, yb]]);
  d.wire("u4s3R", [[772, yb], [1045, yb], [1045, 360], [xr, 360]]);
  d.wire("u4s3bl", [[xl, 280], [xl, 440]]); d.wire("u4s3br", [[xr, 280], [xr, 440]]);
  [[280, "1"], [440, "2"]].forEach(function(q){
    d.wire("u4s3w" + q[1] + "l", [[xl, q[0]], [xm - 30, q[0]]]); d.wire("u4s3w" + q[1] + "r", [[xm + 30, q[0]], [xr, q[0]]]);
    resL4(d, "r" + q[1], xm, q[0], L, "r" + q[1], p);
  });
  d.dot("u4s3j1", xl, 360); d.dot("u4s3j2", xr, 360);
  srcPart4(d, yb, L, p);
  vArrow4(d, "v1", xm, 280, L, "v1", p); vArrow4(d, "v2", xm, 440, L, "v2", p, true);
  iWire4(d, "i1", 880, 280, L, p, true); iWire4(d, "i2", 880, 440, L, p);
  iLeft4(d, yb, L, p, "i");
}
// ---- 4-4 分流（3つ以上）の図：並列（u4s4par＝3本の道・u4s4par4＝4本の道）。左右の縦の線（x=600・960）の間に、抵抗を1つずつ置いた道を並べる（抵抗は x=780）。
// 道の y：3本＝260・380・500（真ん中の道は電源から来る線とまっすぐつながる）／4本＝230・330・430・530。電源から来る線は y=380 で左の縦の線につながる。下の線＝いちばん下の道の 165 下。
// 全体の電流 I は左の縦の線（上向き）。道の電流 I1・I2・… は各抵抗の右の線（右向き・名前は線の下）。どちらも、その電流が流れる導線の上。
// 線の id は u4s4 で始める。左右の縦の線は道の数で id を変える（u4s4b3l・u4s4b4l など。電流の矢印の確かめで、3本と4本を見分ける）。
// 同じ電位の線の色の帯（tb_scenes.js の zones・zSides）：並列の両端は同じ電位＝左の縦の線の側（＋極の側）が赤・右の縦の線の側（－極の側）が灰。数字は添えない。
function u4s4Ys(n){ return n === 4 ? [230, 330, 430, 530] : [260, 380, 500]; }
function u4s4draw(d, p, L, n){
  var ys = u4s4Ys(n), xl = 600, xr = 960, cx = 780, ym = 380, yt = ys[0], ybt = ys[ys.length - 1], yb = ybt + 165, P = zSides(xl, xr, ys, cx);
  zones(d, p, L, {hi: {lines: [[[752, yb], [478, yb], [478, ym], [xl, ym]]].concat(P[0])},
                  lo: {lines: [[[xr, ym], [1045, ym], [1045, yb], [772, yb]]].concat(P[1])}}, 1);
  d.wire("u4s4L", [[xl, ym], [478, ym], [478, yb], [752, yb]]);
  d.wire("u4s4Rw", [[772, yb], [1045, yb], [1045, ym], [xr, ym]]);
  d.wire("u4s4b" + n + "l", [[xl, yt], [xl, ybt]]); d.wire("u4s4b" + n + "r", [[xr, yt], [xr, ybt]]);
  ys.forEach(function(y, i){
    var k = String(i + 1);
    d.wire("u4s4w" + k + "l", [[xl, y], [cx - 30, y]]); d.wire("u4s4w" + k + "r", [[cx + 30, y], [xr, y]]);
    resL4(d, "r" + k, cx, y, L, "r" + k, p);
    if (i > 0 && i < ys.length - 1 && y !== ym) { d.dot("u4s4d" + k + "l", xl, y); d.dot("u4s4d" + k + "r", xr, y); }
  });
  d.dot("u4s4j1", xl, ym); d.dot("u4s4j2", xr, ym);
  srcPart4(d, yb, L, p);
  iLeft4(d, yb, L, p, "i");
  ys.forEach(function(y, i){ iWire4(d, "i" + (i + 1), 885, y, L, p, true); });
}
function tbU4s4par(d, p, L){ u4s4draw(d, p, L, 3); }
function tbU4s4par4(d, p, L){ u4s4draw(d, p, L, 4); }
// 電流の通り道。L.fl＝[全体, 1本目, 2本目, …] の電流の比（無ければ同じ）。矢じりは全部で32個までしか出ないので、比の大きさで数を合わせる（全部で約30個）
function u4s4flow(p, L, n){
  var ys = u4s4Ys(n), xl = 600, xr = 960, ym = 380, yb = ys[ys.length - 1] + 165;
  var f = L.fl || [3].concat(ys.map(function(){ return 3 / n; }));
  var paths = [{I: f[0], pts: [[752, yb], [478, yb], [478, ym], [xl, ym]]}];
  ys.forEach(function(y, i){
    paths.push({I: f[i + 1], pts: y === ym ? [[xl, ym], [xr, ym]] : [[xl, ym], [xl, y], [xr, y], [xr, ym]]});
  });
  paths.push({I: f[0], pts: [[xr, ym], [1045, ym], [1045, yb], [772, yb]]});
  return {o: pv(p, "co"), base: 200, paths: paths};
}
// ---- 4-5 短絡の図（自作）。
// u4s5par（道2つ）・u4s5par3（道3つ）：点 a（x=500）から点 b（x=1010）へ電流 I が流れ、縦の線 x=620・940 の間で道に分かれる（抵抗は x=760）。
//   道の作り L.ps：道ごとに "1"・"2"（抵抗 R1・R2）／"s"（短絡した線）／"2s"（R2 が p.sh で短絡した線に替わる。説明で使う）。
//   道の電流の矢印は道の右の線（x=880）の上・名前は線の上（いちばん下の道だけ線の下）。全体の電流 I は点 a の右の線（x=550）。
//   同じ電位の線の色の帯：短絡すると、並列の左の端の側（赤）が右の端の側と同じ灰になる（短絡した線の両端・並べた抵抗の両端が同じ電位）。
// u4s5ser：直列（4-1 の u4s1ser と同じ形）。R2 は 0 Ω の抵抗。帯は＋極の側＝赤・R1 の後ろ（R2 の両端と－極の側）＝灰。
// u4s5e（説明）：p.t が 0.5 より前は u4s5par（濃さ 1−2t）、後は u4s5ser（名前は L に L.s を上書きした物・濃さ 2t−1）。同時には描かない（部品の id が同じため）。
// 電流は＋極（直列）・点 a（並列）から流れる。線の id は u4s5 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
var U4S5XL = 620, U4S5XR = 940, U4S5XM = 760;
function u4s5ys(n){ return n === 3 ? [260, 360, 460] : [280, 440]; }
// 抵抗（横）と名前（抵抗の上）を濃さ O で
function u4s5res(d, id, x, y, L, p, O){
  d.res(id, x, y, "h", {o: O});
  lab4(d, id + "t", x, y - 30, L[id], p, id, O);
}
// 横の線の上の電流の矢印（右向き）を濃さ O で。名前は線の上（below で下）
function u4s5iw(d, k, x, y, L, p, below, O){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1) * O;
  d.arrow(k + "a", x - 20, y, x + 20, y, {o: o});
  lab4(d, k + "t", x, below ? y + 30 : y - 30, L[k], p, k, o);
}
// 横の抵抗の電圧の矢印（抵抗の上）を濃さ O で。左の端が高い電位＝矢じりは左
function u4s5va(d, k, x, y, L, p, O){
  if (L[k] === undefined) return;
  var w = vdim(d, k + "d", x - 72.5, x + 72.5, y - 10, y - 85, y - 75, pv(p, k + "d", 1), {o: O});
  lab4(d, k + "t", x, y - 100, L[k], p, k, w * O);
}
// 点（端子）と名前を濃さ O で
function u4s5term(d, id, x, y, nm, side, O){
  var e = d.el(id, "circle", "ink term");
  e.setAttribute("cx", x); e.setAttribute("cy", y); e.setAttribute("r", 6);
  d.style(e, {o: O});
  d.text(id + "t", x + (side === "l" ? -16 : 16), y, nm, {o: O, anchor: side === "l" ? "end" : "start"});
}
// ---- 並列（道2つか3つ）
function u4s5drawPar(d, p, L, O){
  var ps = L.ps || ["1", "s"], n = ps.length, ys = u4s5ys(n), xl = U4S5XL, xr = U4S5XR, xm = U4S5XM;
  var sh = pv(p, "sh", 1), Zs = zSides(xl, xr, ys, xm);
  var left = [[[506, 360], [xl, 360]]].concat(Zs[0]), right = [[[xr, 360], [1004, 360]]].concat(Zs[1]), mid = [];
  ps.forEach(function(k, i){ if (k === "s" || k === "2s") mid.push([[xm - 30, ys[i]], [xm + 30, ys[i]]]); });
  var s = ps.indexOf("2s") >= 0 ? sh : (mid.length ? 1 : 0);
  zband(d, "zbu4s5h", left, "hi", O * (1 - s));
  zband(d, "zbu4s5k", left, "lo", O * s);
  zband(d, "zbu4s5r", right, "lo", O);
  if (mid.length) zband(d, "zbu4s5m", mid, "lo", O * s);
  d.wire("u4s5a" + n, [[506, 360], [xl, 360]], {o: O}); d.wire("u4s5b", [[xr, 360], [1004, 360]], {o: O});
  d.wire("u4s5bl", [[xl, ys[0]], [xl, ys[n - 1]]], {o: O}); d.wire("u4s5br", [[xr, ys[0]], [xr, ys[n - 1]]], {o: O});
  ps.forEach(function(k, i){
    var y = ys[i], m = i + 1, so = k === "s" ? 1 : k === "2s" ? sh : 0, rk = k === "2s" ? "r2" : "r" + k;
    d.wire("u4s5p" + m + "l", [[xl, y], [xm - 30, y]], {o: O}); d.wire("u4s5p" + m + "r", [[xm + 30, y], [xr, y]], {o: O});
    if (so > 0) d.wire("u4s5p" + m + "m", [[xm - 30, y], [xm + 30, y]], {o: O * so});
    if (k !== "s" && so < 1) u4s5res(d, rk, xm, y, L, p, O * (1 - so));
    u4s5iw(d, "i" + m, 880, y, L, p, i === n - 1, O);
  });
  d.dot("u4s5j1", xl, 360, {o: O}); d.dot("u4s5j2", xr, 360, {o: O});
  u4s5term(d, "u4s5ta", 500, 360, "a", "l", O); u4s5term(d, "u4s5tb", 1010, 360, "b", "r", O);
  u4s5iw(d, "i", 550, 360, L, p, false, O);
}
// ---- 直列（R2 は 0 Ω）
function u4s5drawSer(d, p, L, O){
  var yb = 560;
  if (vOn(L, ["src", "v1", "v2"])) {
    zband(d, "zbu4s5sh", [[[752, yb], [478, yb], [478, 360], [610, 360]]], "hi", O);
    zband(d, "zbu4s5sl", [[[670, 360], [850, 360]], [[910, 360], [1045, 360], [1045, yb], [772, yb]]], "lo", O);
  }
  d.wire("u4s5L", [[478, 360], [478, yb], [752, yb]], {o: O});
  d.wire("u4s5R", [[772, yb], [1045, yb], [1045, 360]], {o: O});
  d.wire("u4s5w1", [[478, 360], [610, 360]], {o: O}); d.wire("u4s5wm", [[670, 360], [850, 360]], {o: O}); d.wire("u4s5w2", [[910, 360], [1045, 360]], {o: O});
  d.cell("c", 752, yb, {o: O});
  if (L.pm) { d.text("pp", 722, yb - 26, "+", {o: O}); d.text("pm", 802, yb - 26, "−", {o: O}); }
  lab4(d, "e", 762, yb + 42, L.src, p, "src", O);
  u4s5res(d, "r1", 640, 360, L, p, O); u4s5res(d, "r2", 880, 360, L, p, O);
  u4s5va(d, "v1", 640, 360, L, p, O); u4s5va(d, "v2", 880, 360, L, p, O);
  if (L.i !== undefined && L.i !== null) {
    var o = pv(p, "io", 1) * O;
    d.arrow("ia", 478, yb - 60, 478, yb - 100, {o: o});
    lab4(d, "it", 494, yb - 80, L.i, p, "i", o, {anchor: "start"});
  }
}
function tbU4s5par(d, p, L){ u4s5drawPar(d, p, L, 1); }
function tbU4s5ser(d, p, L){ u4s5drawSer(d, p, L, 1); }
function tbU4s5e(d, p, L){
  var t = pv(p, "t", 0);
  if (t < 0.5) u4s5drawPar(d, p, L, 1 - 2 * t);
  else u4s5drawSer(d, p, Object.assign({}, L, L.s || {}), 2 * t - 1);
}
// 電流の通り道（並列）：短絡すると、短絡した線に全部（抵抗の道は 0）。短絡の前は L.fl（道の電流の比）
function u4s5flowPar(p, L){
  var ps = L.ps || ["1", "s"], ys = u4s5ys(ps.length), xl = U4S5XL, xr = U4S5XR, sh = pv(p, "sh", 1);
  var shorted = ps.some(function(k){ return k === "s" || (k === "2s" && sh >= 0.5); });
  var f = ps.map(function(k, i){ return shorted ? ((k === "s" || k === "2s") ? 1 : 0) : (L.fl ? L.fl[i] : 1); });
  var tot = f.reduce(function(a, b){ return a + b; }, 0), paths = [{I: tot, pts: [[506, 360], [xl, 360]]}];
  ys.forEach(function(y, i){ paths.push({I: f[i], pts: y === 360 ? [[xl, 360], [xr, 360]] : [[xl, 360], [xl, y], [xr, y], [xr, 360]]}); });
  paths.push({I: tot, pts: [[xr, 360], [1004, 360]]});
  return {o: pv(p, "co"), base: 100 * tot, paths: paths};
}
function u4s5flowSer(p){
  var yb = 560;
  return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
}
// ---- 4-6 分かれた電流から全体の電流の図（自作）：並列（u4s6par）。電源は下の線（y=640）の真ん中、
// 縦の線 x=600・960 の間に上の道 y=280（R1）・下の道 y=440（R2）、抵抗は x=780。形は単元2の par と同じ。
// 全体の電流 I は左の縦の線（上向き）、I1・I2 は各道の抵抗の右の線（x=905）。名前は I1 が線の上・I2 が線の下。
// 電流の通り道の比＝L.fl（[I1, I2]）。電圧は出さない（電源の電圧の名前 L.src がある時だけ、同じ電位の線の色の帯：左の端の側＝赤・右の端の側＝灰）。
// 線の id は u4s6 で始める（電流の矢印の確かめで、この図の種類を見分ける）。
function tbU4s6par(d, p, L){
  var yb = 640, xl = 600, xr = 960, xm = 780, ys = [280, 440];
  if (vOn(L, ["src"])) {
    var Zs = zSides(xl, xr, ys, xm);
    zones(d, p, L, {hi: {lines: [[[752, yb], [478, yb], [478, 360], [xl, 360]]].concat(Zs[0])},
                    lo: {lines: [[[xr, 360], [1045, 360], [1045, yb], [772, yb]]].concat(Zs[1])}}, true);
  }
  d.wire("u4s6L", [[478, 360], [478, yb], [752, yb]]);
  d.wire("u4s6R", [[772, yb], [1045, yb], [1045, 360]]);
  d.wire("u4s6a", [[478, 360], [xl, 360]]); d.wire("u4s6b", [[xr, 360], [1045, 360]]);
  d.wire("u4s6bl", [[xl, 280], [xl, 440]]); d.wire("u4s6br", [[xr, 280], [xr, 440]]);
  ys.forEach(function(y, i){
    var k = String(i + 1);
    d.wire("u4s6p" + k + "l", [[xl, y], [xm - 30, y]]); d.wire("u4s6p" + k + "r", [[xm + 30, y], [xr, y]]);
    resL4(d, "r" + k, xm, y, L, "r" + k, p);
    iWire4(d, "i" + k, 905, y, L, p, i === 1);
  });
  d.dot("u4s6j1", xl, 360); d.dot("u4s6j2", xr, 360);
  srcPart4(d, yb, L, p);
  iLeft4(d, yb, L, p, "i");
}
var KINDS = {u4s1ser: tbU4s1ser, u4s2ser: tbU4s2ser, u4s3par: tbU4s3par, u4s4par: tbU4s4par, u4s4par4: tbU4s4par4, u4s5par: tbU4s5par, u4s5par3: tbU4s5par, u4s5ser: tbU4s5ser, u4s5e: tbU4s5e, u4s6par: tbU4s6par};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u4s1ser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  u4s2ser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  u4s3par: function(p, L){
    var yb = 640, f = L.fl || [2, 1, 1], xl = 600, xr = 960;
    return {o: pv(p, "co"), base: 90 * f[0], paths: [
      {I: f[0], pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[2], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: f[0], pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  u4s4par: function(p, L){ return u4s4flow(p, L, 3); },
  u4s4par4: function(p, L){ return u4s4flow(p, L, 4); },
  u4s5par: function(p, L){ return u4s5flowPar(p, L); },
  u4s5par3: function(p, L){ return u4s5flowPar(p, L); },
  u4s5ser: function(p, L){ return u4s5flowSer(p); },
  u4s5e: function(p, L){ return pv(p, "t", 0) < 0.5 ? u4s5flowPar(p, L) : u4s5flowSer(p); },
  u4s6par: function(p, L){
    var yb = 640, f = L.fl || [1, 1], xl = 600, xr = 960, tot = f[0] + f[1];
    return {o: pv(p, "co"), base: 100 * tot, paths: [
      {I: tot, pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[0], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: tot, pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  }
};

// 単元4の練習問題の作り方の、節の間で共通の道具。共通の道具（rngOf・pick・shuffled・choices・num・qv・qf・nice・distinct・fmt など）は tb_gen.js。
// 節の練習は u04/sN_gen.js（u04.py が番号順につなぎ、GEN を1つにまとめる）。このファイルは書き換えない（足したい道具は自分の節のファイルへ）。
// 言葉・式の選択肢。list の先頭が正しい物：[t, v, why]
function rule4(r, text, fig, list, ex, form){
  var c = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
  return {form: form, text: text, fig: fig, ch: c.ch, ans: c.ans, ex: ex, chk: {form: form, p: {}}};
}
// 数字の選択肢：値が小数3けたで割り切れ・4つが重ならず・どれも 0 より大きい物だけ（呼ぶ側で決め直す）
function okNums4(ok, w){ return nice(ok) && ok > 0 && w.every(function(z){ return nice(z.x) && z.x > 0; }) && distinct([ok].concat(w.map(function(z){ return z.x; }))); }
function int4(x){ return Math.abs(x - Math.round(x)) < 1e-9; }
function r34(x){ return Math.round(x * 1000) / 1000; }        // 割り算の誤差（7.199999… など）を3けたに丸める
function gcd4(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { var t = a % b; a = b; b = t; } return a; }
// 比を簡単にした文字（[6, 2] → "3 : 1"）。整数の比だけ
function ratio4(a){ var g = a.reduce(function(x, y){ return gcd4(x, y); }); return a.map(function(x){ return fmt(x / g); }).join(" : "); }
function ohm4(k, v){ return "{R}" + k + "=" + qf(v, "O"); }     // 図の抵抗の名前と値（"{R}_1=6 Ω"）
var RS4 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 35, 36, 40, 45, 48, 50, 60, 70, 75, 80, 90, 100];
// 4-1 分圧（2つの抵抗）：直列の2つの抵抗には同じ電流が流れるので、電圧の比は抵抗の比と同じ（V1 : V2 = R1 : R2）。
// 電源の電圧 V は抵抗の比に分かれてかかる　V1 = V × R1/(R1 + R2)。図は全問に付ける（u4s1ser）。
// 形：u4s1law（分圧の式の穴埋め）／u4s1ratio（電圧の比）／u4s1big（大きい電圧がかかる抵抗）／u4s1v（V・R1・R2 から V1 か V2）／
//     u4s1from（V1・R1・R2 から V2）／u4s1r2（V・V1・R1 から R2）。
// まちがいの選択肢は、よくある取り違え（もう一方の抵抗の割合で分けた・比を逆にした・等しく分かれると考えた・電源の電圧がそのままかかると考えた など）。理由を1行付ける。
// 3つ以上の分圧（4-2）・分流（4-3〜）は出さない。
function u4s1fig(L){ return {kind: "u4s1ser", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2"}, L), P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u4s1three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r34(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 2つの抵抗（違う値・比は10倍まで）と、その最大公約数
function u4s1pair(r){
  var a, b;
  do { a = pick(r, RS4); b = pick(r, RS4); } while (a === b || Math.max(a, b) / Math.min(a, b) > 10);
  return [a, b, gcd4(a, b)];
}
// 4-2 分圧（3つ以上）：直列の抵抗が3つでも同じ電流が流れるので、電圧の比は抵抗の比と同じ（V1 : V2 : V3 = R1 : R2 : R3）。
// 電源の電圧 V は抵抗の比に分かれる。比を簡単にして、比の合計のうち自分の数の分。図は全問に付ける（u4s2ser）。
// 形：u4s2law（分圧の式の穴埋め）／u4s2ratio（電圧の比）／u4s2big（電圧が一番大きい・小さい抵抗）／u4s2v（V・R1・R2・R3 から Vk）／
//     u4s2from（1つの電圧から別の抵抗の電圧）／u4s2src（1つの電圧から電源の電圧）／u4s2r3（V・V1・V2・R1 から R3）。
// まちがいの選択肢は、よくある取り違え（等しく分かれると考えた・1つの抵抗を入れずに2つで分けた・比を逆にした・電源の電圧がそのままかかると考えた など）。理由を1行付ける。
// 分流（4-3〜）・短絡（4-5）は出さない。
function u4s2fig(L){ return {kind: "u4s2ser", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2", r3: "{R}_3"}, L), P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u4s2three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r34(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 3つの抵抗（どれも違う値・一番大きい物は一番小さい物の10倍まで・簡単にした比の合計は30まで）。返す物＝{R: [R1, R2, R3], s: 簡単にした比, T: 比の合計}
function u4s2trip(r){
  for (;;) {
    var R = [pick(r, RS4), pick(r, RS4), pick(r, RS4)];
    if (R[0] === R[1] || R[1] === R[2] || R[0] === R[2]) continue;
    if (Math.max.apply(null, R) / Math.min.apply(null, R) > 10) continue;
    var g = gcd4(gcd4(R[0], R[1]), R[2]), s = R.map(function(x){ return x / g; }), T = s[0] + s[1] + s[2];
    if (T <= 30) return {R: R, s: s, T: T};
  }
}
function u4s2rs(x){ return x.map(fmt).join(" : "); }
function u4s2rv(R){ return {r1: ohm4("_1", R[0]), r2: ohm4("_2", R[1]), r3: ohm4("_3", R[2])}; }
function u4s2rtext(R){ return "$R_1 = " + qv(R[0], "O") + "$、$R_2 = " + qv(R[1], "O") + "$、$R_3 = " + qv(R[2], "O") + "$"; }
// 抵抗の比を簡単にした行（例：15 : 25 : 50 = 3 : 5 : 10（合計 18））
function u4s2rline(t){
  return "抵抗の比を簡単にすると　$R_1 : R_2 : R_3 = " + t.R.map(fmt).join(" : ") + " = " + t.s.map(fmt).join(" : ") + "$（合計 " + fmt(t.T) + "）";
}
// 4-3 分流（2つの抵抗）：並列の2つの抵抗には同じ電圧がかかるので R1 I1 = R2 I2。電流の比は抵抗の逆比（I1 : I2 = R2 : R1）。
// 全体の電流 I は抵抗の逆比に分かれて流れる　I1 = I × R2/(R1 + R2)（反対側の抵抗の割合）。図は全問に付ける（u4s3par）。
// 形：u4s3law（分流の式の穴埋め）／u4s3ratio（電流の比）／u4s3big（大きい電流が流れる抵抗）／u4s3i（I・R1・R2 から I1 か I2）／
//     u4s3from（I1・R1・R2 から I2）／u4s3r2（I・I1・R1 から R2）。
// まちがいの選択肢は、よくある取り違え（分圧と取り違えて自分の抵抗を分子にした・逆比にしていない・等しく分かれると考えた・全体の電流がそのまま流れると考えた など）。理由を1行付ける。
// 3つ以上の分流（4-4）・短絡（4-5）・分かれた電流から全体の電流（4-6）は出さない。
function u4s3fig(L){ return {kind: "u4s3par", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2"}, L), P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u4s3three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r34(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 2つの抵抗（違う値・比は5倍まで）と、その最大公約数
function u4s3pair(r){
  var a, b;
  do { a = pick(r, RS4); b = pick(r, RS4); } while (a === b || Math.max(a, b) / Math.min(a, b) > 5);
  return [a, b, gcd4(a, b)];
}
// 4-4 分流（3つ以上）：並列の抵抗には同じ電圧がかかるので、電流は抵抗の逆比に分かれる。逆比＝逆数の比（I1 : I2 : I3 = 1/R1 : 1/R2 : 1/R3）。
// 逆数の比は分母の最小公倍数を掛けて分母の無い比にし、合計のうち自分の分を全体の電流に掛ける。図は全問に付ける（u4s4par・u4s4par4）。
// 形：u4s4law（電流の比の式）／u4s4inv（抵抗の値から電流の比）／u4s4big（いちばん大きい電流が流れる抵抗）／
//     u4s4cur（3つ・全体の電流から Ik）／u4s4cur4（4つ・全体の電流から Ik）／u4s4other（1つの道の電流から別の道の電流）。
// まちがいの選択肢は、よくある取り違え（抵抗の比のまま分けた・抵抗の比の数字を逆に並べただけ・等しく分かれると考えた など）。理由を1行付ける。
// 短絡（4-5）・分かれた電流から全体の電流（4-6）は出さない。
var U4S4CNT = ["", "", "2つ", "3つ", "4つ"];
function u4s4lcm(xs){ return xs.reduce(function(a, b){ return a / gcd4(a, b) * b; }, 1); }
// 抵抗の組 R から：抵抗の比（簡単にした物）rr・電流の比（逆数の比を整数にした物）w・その合計 S・逆数の比の分母の最小公倍数 L
function u4s4inv(R){
  var g = R.reduce(function(a, b){ return gcd4(a, b); }), rr = R.map(function(x){ return x / g; });
  var L = u4s4lcm(rr), w = rr.map(function(x){ return L / x; }), h = w.reduce(function(a, b){ return gcd4(a, b); });
  w = w.map(function(x){ return x / h; });
  return {rr: rr, w: w, L: L, S: w.reduce(function(a, b){ return a + b; }, 0)};
}
// n 個の違う抵抗の組（RS4 から・いちばん大きい物はいちばん小さい物の6倍まで・電流の比の合計が smax まで・逆に並べた比が電流の比と違う）
function u4s4sets(n, smax){
  var out = [];
  (function go(i, a){
    if (a.length === n) {
      if (a[n - 1] / a[0] > 6) return;
      var P = u4s4inv(a);
      if (P.S <= smax && P.rr.slice().reverse().join(",") !== P.w.join(",")) out.push(a.slice());
      return;
    }
    for (var j = i; j < RS4.length; j++) { a.push(RS4[j]); go(j + 1, a); a.pop(); }
  })(0, []);
  return out;
}
var U4S4SETS3 = u4s4sets(3, 24), U4S4SETS4 = u4s4sets(4, 30);
function u4s4fig(n, L){
  var b = {pm: 1}; for (var k = 1; k <= n; k++) b["r" + k] = "{R}_" + k;
  return {kind: n === 4 ? "u4s4par4" : "u4s4par", L: Object.assign(b, L), P: {}};
}
function u4s4rl(R){ var o = {}; R.forEach(function(x, i){ o["r" + (i + 1)] = ohm4("_" + (i + 1), x); }); return o; }
function u4s4rq(R){ return R.map(function(x, i){ return "$R_" + (i + 1) + " = " + qv(x, "O") + "$"; }).join("、"); }
function u4s4isym(n){ var a = []; for (var k = 1; k <= n; k++) a.push("I_" + k); return a.join(" : "); }
// 逆数の比の式（"\dfrac{1}{3} : \dfrac{1}{2} : \dfrac{1}{4}"）
function u4s4recs(rr){ return rr.map(function(x){ return "\\dfrac{1}{" + fmt(x) + "}"; }).join(" : "); }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない3つ（前から順に）。足りなければ null
function u4s4three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r34(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 4-5 短絡：2点を抵抗を挟まずに線でつなぐこと＝短絡（ショート）。電流は短絡した線（0 Ω の道）に全部流れ、並べた抵抗には流れない。
// 0 Ω の所にかかる電圧は 0 V（直列なら電源の電圧は全部もう一方の抵抗にかかる）。図は全問に付ける（u4s5par・u4s5par3・u4s5ser）。
// 形：u4s5def（短絡とは）／u4s5flow（短絡した時の電流の流れ方）／u4s5zero（並べた抵抗にかかる電圧）／
//     u4s5i（道3つの1つを短絡：各道の電流）／u4s5v（直列で R2 = 0 Ω：V1 と V2）／u4s5cur（直列で R2 = 0 Ω：流れる電流）。
// まちがいの選択肢は、よくある取り違え（抵抗のある道に流れると考えた・等しく分かれると考えた・短絡した線を見落とした など）。理由を1行付ける。
// 分かれた電流から全体の電流（4-6）は出さない。
function u4s5pfig(ps, L){ return {kind: ps.length === 3 ? "u4s5par3" : "u4s5par", L: Object.assign({ps: ps}, L), P: {}}; }
function u4s5sfig(L){ return {kind: "u4s5ser", L: Object.assign({pm: 1, r2: "{R}_2=0 Ω"}, L), P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値（0 でもよい）と重ならない 0 より大きい3つ（前から順に）。足りなければ null
function u4s5three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r34(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 4-6 分かれた電流から全体の電流：並列の2つの道の電流は抵抗の逆比（I1 : I2 = R2 : R1）。全体の I は R1 + R2 の分。
// I = I1 × (R1 + R2)/R2（I2 から出す時は I = I2 × (R1 + R2)/R1）、もう一方 I2 = I1 × R1/R2。図は全問に付ける（u4s6par）。
// 形：u4s6law（I = Ik × □）／u4s6ratio（I1 : I）／u4s6tot（R1・R2・Ik から I）／u4s6oth（R1・R2・Ik からもう一方の電流）／
//     u4s6r（I・I1・R1 から R2）。
// まちがいの選択肢は、よくある取り違え（逆比にしなかった・分流の式と取り違えた・もう一方の電流を求めた・等しく分かれると考えた など）。理由を1行付ける。
// 短絡（4-5）は出さない。
function u4s6fig(L){ return {kind: "u4s6par", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2", i: "{I}", i1: "{I}_1", i2: "{I}_2"}, L), P: {}}; }
// まちがいの候補 cands（[{x, why}]）から、正しい値と重ならない 0 より大きい3つ（前から順に）。足りなければ null
function u4s6three(ok, cands){
  var out = [];
  cands.forEach(function(z){
    z = {x: r34(z.x), why: z.why};
    if (out.length < 3 && nice(z.x) && z.x > 0 && distinct([ok].concat(out.map(function(w){ return w.x; }), [z.x]))) out.push(z);
  });
  return out.length === 3 ? out : null;
}
// 2つの抵抗（違う値・比は10倍まで）と、その最大公約数
function u4s6pair(r){
  var a, b;
  do { a = pick(r, RS4); b = pick(r, RS4); } while (a === b || Math.max(a, b) / Math.min(a, b) > 10);
  return [a, b, gcd4(a, b)];
}
var GEN = {
  // 4-1 分圧（2つの抵抗）
  1: function(r){
    var f = pick(r, ["u4s1law", "u4s1ratio", "u4s1big", "u4s1v", "u4s1v", "u4s1v", "u4s1from", "u4s1from", "u4s1r2"]);
    var P, g, m, V, V1, V2, ok, w, c, k, R1, R2;
    if (f === "u4s1law") {
      k = pick(r, [1, 2]);
      var me = "R_" + k, ot = "R_" + (3 - k);
      return rule4(r, "図のように、2つの抵抗を直列につないだ。$R_" + k + "$ にかかる電圧は $V_" + k + " = V \\times$ □ である。",
        u4s1fig(k === 1 ? {src: "{V}", v1: "{V}_1"} : {src: "{V}", v2: "{V}_2"}),
        [["$\\dfrac{" + me + "}{R_1 + R_2}$", "own"], ["$\\dfrac{" + ot + "}{R_1 + R_2}$", "other", "もう一方の抵抗 $" + ot + "$ の割合にした"],
         ["$\\dfrac{R_1 + R_2}{" + me + "}$", "inv", "分母と分子が逆"], ["$\\dfrac{" + me + "}{" + ot + "}$", "ratio", "全体の $R_1 + R_2$ でなく、もう一方の抵抗で割った"]],
        ["直列なので、電源の電圧は抵抗の比に分かれる（分圧）", "$V_" + k + "$ は $V$ のうち $" + me + "$ の割合の分　$V_" + k + " = V \\times \\dfrac{" + me + "}{R_1 + R_2}$"], "u4s1law");
    }
    if (f === "u4s1ratio") {
      return rule4(r, "図のように、2つの抵抗を直列につないだ。$R_1$・$R_2$ にかかる電圧の比 $V_1 : V_2$ は □ である。",
        u4s1fig({src: "{V}", v1: "{V}_1", v2: "{V}_2", i: "{I}"}),
        [["$R_1 : R_2$", "same"], ["$R_2 : R_1$", "rev", "比を逆にした（直列では、大きい抵抗に大きい電圧がかかる）"],
         ["$1 : 1$", "one", "直列で等しいのは電流。電圧は等しく分かれない"], ["$R_1 : (R_1 + R_2)$", "whole", "$V_1$ と電源の電圧 $V$ の比と取り違えた"]],
        ["直列なので同じ電流 $I$ が流れる。$V_1 = R_1 I$、$V_2 = R_2 I$", "同じ $I$ を掛けるので　$V_1 : V_2 = R_1 : R_2$"], "u4s1ratio");
    }
    if (f === "u4s1big") {
      P = u4s1pair(r); R1 = P[0]; R2 = P[1];
      var big = R1 > R2 ? "R1" : "R2", sm = big === "R1" ? "R2" : "R1", nb = big === "R1" ? "R_1" : "R_2", ns = big === "R1" ? "R_2" : "R_1";
      c = choices(r, [{t: "$" + nb + "$", v: big}, {t: "$" + ns + "$", v: sm, why: "比を逆にした（大きい抵抗ほど、大きい電圧がかかる）"},
                      {t: "どちらも同じ", v: "same", why: "直列で等しいのは電流。電圧は抵抗の比に分かれる"},
                      {t: "電源の電圧が分からないので決まらない", v: "none", why: "電圧の比は抵抗の比だけで決まる"}]);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列につないだ。かかる電圧が大きいのは □ である。",
              fig: u4s1fig({r1: ohm4("_1", R1), r2: ohm4("_2", R2), src: "{V}", v1: "{V}_1", v2: "{V}_2"}), ch: c.ch, ans: c.ans,
              ex: ["電圧の比は抵抗の比と同じ　$V_1 : V_2 = R_1 : R_2 = " + ratio4([R1, R2]) + "$", "大きい電圧がかかるのは、大きい抵抗の $" + nb + "$"],
              chk: {form: f, p: {R1: R1, R2: R2}}};
    }
    if (f === "u4s1v") {                // V・R1・R2 から Vk
      var Rk, Ro;
      for (;;) {
        P = u4s1pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10, 12]);
        V = m * (R1 + R2) / g; if (V < 6 || V > 240) continue;
        k = pick(r, [1, 2]); Rk = k === 1 ? R1 : R2; Ro = k === 1 ? R2 : R1;
        ok = V * Rk / (R1 + R2);
        w = u4s1three(ok, [{x: V - ok, why: "もう一方の抵抗の割合で分けた"}, {x: V / 2, why: "電圧が2つの抵抗に等しく分かれると考えた"},
                           {x: V, why: "電源の電圧が、そのままかかると考えた"}, {x: V * Rk / Ro, why: "全体の $R_1 + R_2$ でなく、もう一方の抵抗で割った"}]);
        if (w && int4(ok)) break;
      }
      c = num(r, null, "V", ok, w);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列につなぎ、電源の電圧を $V = " + qv(V, "V") + "$ とした。"
                    + "$R_" + k + "$ にかかる電圧 $V_" + k + "$ は何 V か。",
              fig: u4s1fig(Object.assign({r1: ohm4("_1", R1), r2: ohm4("_2", R2), src: "{V}=" + qf(V, "V")}, k === 1 ? {v1: "{V}_1"} : {v2: "{V}_2"})),
              ch: c.ch, ans: c.ans,
              ex: ["直列なので、電源の電圧は抵抗の比 $" + ratio4([R1, R2]) + "$ に分かれる",
                   "$V_" + k + " = V \\times \\dfrac{R_" + k + "}{R_1 + R_2} = " + fmt(V) + " \\times \\dfrac{" + fmt(Rk) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {V: V, R1: R1, R2: R2, k: k}}};
    }
    if (f === "u4s1from") {             // V1・R1・R2 から V2（比で）
      for (;;) {
        P = u4s1pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
        V1 = m * R1 / g; ok = m * R2 / g; if (V1 > 200 || ok > 200 || V1 < 2) continue;
        w = u4s1three(ok, [{x: V1 * R1 / R2, why: "比を逆にした"}, {x: V1, why: "直列なので電圧も等しいと考えた（等しいのは電流）"},
                           {x: V1 + ok, why: "電源の電圧 $V$ を求めた"}, {x: V1 * R2 / (R1 + R2), why: "$V_1$ を全体の電圧と見て分けた"}]);
        if (w) break;
      }
      c = num(r, null, "V", ok, w);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を直列につないだ。$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$ である。"
                    + "$R_2$ にかかる電圧 $V_2$ は何 V か。",
              fig: u4s1fig({r1: ohm4("_1", R1), r2: ohm4("_2", R2), src: "{V}", v1: "{V}_1=" + qf(V1, "V"), v2: "{V}_2"}), ch: c.ch, ans: c.ans,
              ex: ["電圧の比は抵抗の比と同じ　$V_1 : V_2 = R_1 : R_2$",
                   "$V_2 = V_1 \\times \\dfrac{R_2}{R_1} = " + fmt(V1) + " \\times \\dfrac{" + fmt(R2) + "}{" + fmt(R1) + "} = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {V1: V1, R1: R1, R2: R2}}};
    }
    for (;;) {                          // u4s1r2：V・V1・R1 から R2（残りの電圧 V2 と、電圧の比＝抵抗の比）
      P = u4s1pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
      V1 = m * R1 / g; V2 = m * R2 / g; V = V1 + V2; ok = R2;
      if (V > 240 || V1 < 2) continue;
      w = u4s1three(ok, [{x: R1 * V1 / V2, why: "比を逆にした"}, {x: R1 * V / V1, why: "$V_2$ でなく電源の電圧 $V$ で比を作った"},
                         {x: R1, why: "直列なので抵抗も等しいと考えた"}, {x: R1 * V2 / V, why: "$V_1$ でなく $V$ で割った"}]);
      if (w) break;
    }
    c = num(r, null, "O", ok, w);
    return {form: "u4s1r2", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2$ を直列につなぎ、電源の電圧を $V = " + qv(V, "V") + "$ とした。"
                  + "$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$ である。$R_2$ は何 Ω か。",
            fig: u4s1fig({r1: ohm4("_1", R1), src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V")}), ch: c.ch, ans: c.ans,
            ex: ["$R_2$ にかかる電圧は　$V_2 = V - V_1 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(V2, "V") + "$",
                 "電圧の比は抵抗の比と同じなので　$R_2 = R_1 \\times \\dfrac{V_2}{V_1} = " + fmt(R1) + " \\times \\dfrac{" + fmt(V2) + "}{" + fmt(V1) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "u4s1r2", p: {V: V, V1: V1, R1: R1}}};
  },
  // 4-2 分圧（3つ以上）
  2: function(r){
    var f = pick(r, ["u4s2law", "u4s2ratio", "u4s2big", "u4s2v", "u4s2v", "u4s2v", "u4s2from", "u4s2from", "u4s2src", "u4s2r3"]);
    var t, m, V, ok, w, c, k, j, o, a, b, Va;
    if (f === "u4s2law") {
      k = pick(r, [1, 2, 3]); j = k === 1 ? 2 : 1; o = 6 - k - j;
      var me = "R_" + k, ot = "R_" + j, two = k < j ? me + " + " + ot : ot + " + " + me, all = "R_1 + R_2 + R_3";
      var vl = {src: "{V}"}; vl["v" + k] = "{V}_" + k;
      return rule4(r, "図のように、3つの抵抗を直列につないだ。$R_" + k + "$ にかかる電圧は $V_" + k + " = V \\times$ □ である。",
        u4s2fig(vl),
        [["$\\dfrac{" + me + "}{" + all + "}$", "own"], ["$\\dfrac{" + me + "}{" + two + "}$", "two", "$R_" + o + "$ を入れず、2つの抵抗だけで割った"],
         ["$\\dfrac{" + all + "}{" + me + "}$", "inv", "分母と分子が逆"], ["$\\dfrac{" + ot + "}{" + all + "}$", "other", "ほかの抵抗 $" + ot + "$ の割合にした"]],
        ["直列なので、抵抗が3つでも、電源の電圧は抵抗の比に分かれる", "$V_" + k + "$ は $V$ のうち $" + me + "$ の割合の分　$V_" + k + " = V \\times \\dfrac{" + me + "}{" + all + "}$"], "u4s2law");
    }
    if (f === "u4s2ratio") {
      do { t = u4s2trip(r); } while ((t.R[0] < t.R[1] && t.R[1] < t.R[2]) || (t.R[0] > t.R[1] && t.R[1] > t.R[2]));
      var srt = t.s.slice().sort(function(x, y){ return x - y; }), rev = t.s.slice().reverse();
      c = choices(r, [{t: "$" + u4s2rs(t.s) + "$", v: u4s2rs(t.s)},
                      {t: "$" + u4s2rs(rev) + "$", v: u4s2rs(rev), why: "比を逆の順にした（大きい抵抗ほど、大きい電圧がかかる）"},
                      {t: "$" + u4s2rs(srt) + "$", v: u4s2rs(srt), why: "小さい順に並べた（比は $R_1$・$R_2$・$R_3$ の順に書く）"},
                      {t: "$1 : 1 : 1$", v: "1 : 1 : 1", why: "直列で等しいのは電流。電圧は等しく分かれない"}]);
      return {form: f, text: "図のように、" + u4s2rtext(t.R) + " を直列につないだ。電圧の比 $V_1 : V_2 : V_3$ を簡単にすると □ である。",
              fig: u4s2fig(Object.assign(u4s2rv(t.R), {src: "{V}", v1: "{V}_1", v2: "{V}_2", v3: "{V}_3"})), ch: c.ch, ans: c.ans,
              ex: ["直列なので同じ電流が流れ、電圧の比は抵抗の比と同じ", "$V_1 : V_2 : V_3 = " + t.R.map(fmt).join(" : ") + " = " + u4s2rs(t.s) + "$"],
              chk: {form: f, p: {R1: t.R[0], R2: t.R[1], R3: t.R[2]}}};
    }
    if (f === "u4s2big") {
      t = u4s2trip(r);
      var hi = pick(r, [1, 0]), idx = [0, 1, 2].sort(function(x, y){ return t.R[x] - t.R[y]; });
      var top = hi ? idx[2] : idx[0], bot = hi ? idx[0] : idx[2], midI = idx[1], word = hi ? "大きい" : "小さい";
      c = choices(r, [{t: "$R_" + (top + 1) + "$", v: "R" + (top + 1)},
                      {t: "$R_" + (bot + 1) + "$", v: "R" + (bot + 1), why: "比を逆にした（大きい抵抗ほど、大きい電圧がかかる）"},
                      {t: "$R_" + (midI + 1) + "$", v: "R" + (midI + 1), why: "抵抗が最も" + word + "のは $R_" + (top + 1) + "$（電圧の比は抵抗の比と同じ）"},
                      {t: "どれも同じ", v: "same", why: "直列で等しいのは電流。電圧は抵抗の比に分かれる"}]);
      return {form: f, text: "図のように、" + u4s2rtext(t.R) + " を直列につないだ。かかる電圧が最も" + word + "のは □ である。",
              fig: u4s2fig(Object.assign(u4s2rv(t.R), {src: "{V}", v1: "{V}_1", v2: "{V}_2", v3: "{V}_3"})), ch: c.ch, ans: c.ans,
              ex: ["電圧の比は抵抗の比と同じ　$V_1 : V_2 : V_3 = " + u4s2rs(t.s) + "$", "電圧が最も" + word + "のは、抵抗が最も" + word + " $R_" + (top + 1) + "$"],
              chk: {form: f, p: {R1: t.R[0], R2: t.R[1], R3: t.R[2], hi: hi}}};
    }
    if (f === "u4s2v") {                // V・R1・R2・R3 から Vk（比を簡単にして合計で割る）
      for (;;) {
        t = u4s2trip(r); m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10, 12]); V = m * t.T;
        if (V < 6 || V > 240) continue;
        k = pick(r, [1, 2, 3]); o = pick(r, [1, 2, 3].filter(function(x){ return x !== k; }));
        ok = m * t.s[k - 1];
        var Rk = t.R[k - 1], Rsum = t.R[0] + t.R[1] + t.R[2];
        w = u4s2three(ok, [{x: V / 3, why: "電圧が3つの抵抗に等しく分かれると考えた"},
                           {x: V * Rk / (Rsum - t.R[o - 1]), why: "$R_" + o + "$ を入れず、2つの抵抗だけで分けた"},
                           {x: V, why: "電源の電圧が、そのままかかると考えた"},
                           {x: V - ok, why: "ほかの2つの抵抗にかかる電圧を求めた"}]);
        if (w && int4(ok)) break;
      }
      c = num(r, null, "V", ok, w);
      var vl2 = Object.assign(u4s2rv(t.R), {src: "{V}=" + qf(V, "V")}); vl2["v" + k] = "{V}_" + k;
      return {form: f, text: "図のように、" + u4s2rtext(t.R) + " を直列につなぎ、電源の電圧を $V = " + qv(V, "V") + "$ とした。"
                    + "$R_" + k + "$ にかかる電圧 $V_" + k + "$ は何 V か。",
              fig: u4s2fig(vl2), ch: c.ch, ans: c.ans,
              ex: [u4s2rline(t),
                   "$V_" + k + "$ は " + fmt(t.T) + " のうち " + fmt(t.s[k - 1]) + " つ分　$V_" + k + " = " + fmt(V) + " \\times \\dfrac{" + fmt(t.s[k - 1]) + "}{" + fmt(t.T) + "} = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {V: V, R1: t.R[0], R2: t.R[1], R3: t.R[2], k: k}}};
    }
    if (f === "u4s2from") {             // Va・R1・R2・R3 から Vb（比で）
      for (;;) {
        t = u4s2trip(r); m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
        a = pick(r, [1, 2, 3]); b = pick(r, [1, 2, 3].filter(function(x){ return x !== a; }));
        Va = m * t.s[a - 1]; ok = m * t.s[b - 1];
        if (Va > 200 || ok > 200 || Va < 2) continue;
        w = u4s2three(ok, [{x: Va * t.s[a - 1] / t.s[b - 1], why: "比を逆にした"},
                           {x: Va, why: "直列なので電圧も等しいと考えた（等しいのは電流）"},
                           {x: m * t.T, why: "電源の電圧 $V$ を求めた"},
                           {x: Va * t.s[b - 1] / t.T, why: "$V_" + a + "$ を電源の電圧と見て分けた"}]);
        if (w) break;
      }
      c = num(r, null, "V", ok, w);
      var vl3 = Object.assign(u4s2rv(t.R), {src: "{V}"}); vl3["v" + a] = "{V}_" + a + "=" + qf(Va, "V"); vl3["v" + b] = "{V}_" + b;
      return {form: f, text: "図のように、" + u4s2rtext(t.R) + " を直列につないだ。$R_" + a + "$ にかかる電圧は $V_" + a + " = " + qv(Va, "V") + "$ である。"
                    + "$R_" + b + "$ にかかる電圧 $V_" + b + "$ は何 V か。",
              fig: u4s2fig(vl3), ch: c.ch, ans: c.ans,
              ex: ["電圧の比は抵抗の比と同じ　$V_1 : V_2 : V_3 = " + u4s2rs(t.s) + "$",
                   "$V_" + b + " = V_" + a + " \\times \\dfrac{" + fmt(t.s[b - 1]) + "}{" + fmt(t.s[a - 1]) + "} = " + fmt(Va) + " \\times \\dfrac{" + fmt(t.s[b - 1]) + "}{" + fmt(t.s[a - 1]) + "} = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {R1: t.R[0], R2: t.R[1], R3: t.R[2], a: a, b: b, Va: Va}}};
    }
    if (f === "u4s2src") {              // Va・R1・R2・R3 から電源の電圧 V
      for (;;) {
        t = u4s2trip(r); m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
        a = pick(r, [1, 2, 3]); o = pick(r, [1, 2, 3].filter(function(x){ return x !== a; }));
        Va = m * t.s[a - 1]; ok = m * t.T;
        if (ok > 240 || Va < 2) continue;
        w = u4s2three(ok, [{x: 3 * Va, why: "電圧が3つの抵抗に等しく分かれると考えた"},
                           {x: Va * (t.T - t.s[o - 1]) / t.s[a - 1], why: "$R_" + o + "$ を入れず、2つの抵抗の分だけ足した"},
                           {x: Va, why: "電源の電圧も $V_" + a + "$ と同じと考えた"},
                           {x: Va * t.s[a - 1] / t.T, why: "分母と分子を逆にした"}]);
        if (w) break;
      }
      c = num(r, null, "V", ok, w);
      var vl4 = Object.assign(u4s2rv(t.R), {src: "{V}"}); vl4["v" + a] = "{V}_" + a + "=" + qf(Va, "V");
      return {form: f, text: "図のように、" + u4s2rtext(t.R) + " を直列につないだ。$R_" + a + "$ にかかる電圧は $V_" + a + " = " + qv(Va, "V") + "$ である。"
                    + "電源の電圧 $V$ は何 V か。",
              fig: u4s2fig(vl4), ch: c.ch, ans: c.ans,
              ex: [u4s2rline(t),
                   "$V_" + a + "$ は " + fmt(t.T) + " のうち " + fmt(t.s[a - 1]) + " つ分　$V = V_" + a + " \\times \\dfrac{" + fmt(t.T) + "}{" + fmt(t.s[a - 1]) + "} = " + fmt(Va) + " \\times \\dfrac{" + fmt(t.T) + "}{" + fmt(t.s[a - 1]) + "} = " + qv(ok, "V") + "$"],
              chk: {form: f, p: {R1: t.R[0], R2: t.R[1], R3: t.R[2], a: a, Va: Va}}};
    }
    var V1, V2, V3;
    for (;;) {                          // u4s2r3：V・V1・V2・R1 から R3（残りの電圧 V3 と、電圧の比＝抵抗の比）
      t = u4s2trip(r); m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
      V1 = m * t.s[0]; V2 = m * t.s[1]; V3 = m * t.s[2]; V = V1 + V2 + V3; ok = t.R[2];
      if (V > 240 || V1 < 2) continue;
      w = u4s2three(ok, [{x: t.R[0] * V1 / V3, why: "比を逆にした"},
                         {x: t.R[0] * V / V1, why: "$V_3$ でなく電源の電圧 $V$ で比を作った"},
                         {x: t.R[0], why: "直列なので抵抗も等しいと考えた"},
                         {x: t.R[0] * V2 / V1, why: "$V_3$ でなく $V_2$ で比を作った"}]);
      if (w) break;
    }
    c = num(r, null, "O", ok, w);
    return {form: "u4s2r3", text: "図のように、$R_1 = " + qv(t.R[0], "O") + "$、$R_2$、$R_3$ を直列につなぎ、電源の電圧を $V = " + qv(V, "V") + "$ とした。"
                  + "$R_1$・$R_2$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$、$V_2 = " + qv(V2, "V") + "$ である。$R_3$ は何 Ω か。",
            fig: u4s2fig({r1: ohm4("_1", t.R[0]), src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), v2: "{V}_2=" + qf(V2, "V"), v3: "{V}_3"}),
            ch: c.ch, ans: c.ans,
            ex: ["$R_3$ にかかる電圧は　$V_3 = V - V_1 - V_2 = " + fmt(V) + " - " + fmt(V1) + " - " + fmt(V2) + " = " + qv(V3, "V") + "$",
                 "電圧の比は抵抗の比と同じなので　$R_3 = R_1 \\times \\dfrac{V_3}{V_1} = " + fmt(t.R[0]) + " \\times \\dfrac{" + fmt(V3) + "}{" + fmt(V1) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "u4s2r3", p: {V: V, V1: V1, V2: V2, R1: t.R[0]}}};
  },
  // 4-3 分流（2つの抵抗）
  3: function(r){
    var f = pick(r, ["u4s3law", "u4s3ratio", "u4s3big", "u4s3i", "u4s3i", "u4s3i", "u4s3from", "u4s3from", "u4s3r2"]);
    var P, g, m, I, I1, I2, ok, w, c, k, R1, R2;
    if (f === "u4s3law") {
      k = pick(r, [1, 2]);
      var me = "R_" + k, ot = "R_" + (3 - k);
      return rule4(r, "図のように、2つの抵抗を並列につないだ。$R_" + k + "$ に流れる電流は $I_" + k + " = I \\times$ □ である。",
        u4s3fig(k === 1 ? {i: "{I}", i1: "{I}_1"} : {i: "{I}", i2: "{I}_2"}),
        [["$\\dfrac{" + ot + "}{R_1 + R_2}$", "other"], ["$\\dfrac{" + me + "}{R_1 + R_2}$", "own", "分圧と取り違えて、自分の抵抗 $" + me + "$ を分子にした"],
         ["$\\dfrac{R_1 + R_2}{" + ot + "}$", "inv", "分母と分子が逆"], ["$\\dfrac{" + ot + "}{" + me + "}$", "ratio", "全体の $R_1 + R_2$ でなく、自分の抵抗で割った"]],
        ["並列なので、全体の電流は抵抗の逆比に分かれる（分流）", "$I_" + k + "$ は $I$ のうち反対側の抵抗 $" + ot + "$ の割合の分　$I_" + k + " = I \\times \\dfrac{" + ot + "}{R_1 + R_2}$"], "u4s3law");
    }
    if (f === "u4s3ratio") {
      return rule4(r, "図のように、2つの抵抗を並列につないだ。$R_1$・$R_2$ に流れる電流の比 $I_1 : I_2$ は □ である。",
        u4s3fig({i: "{I}", i1: "{I}_1", i2: "{I}_2"}),
        [["$R_2 : R_1$", "inv"], ["$R_1 : R_2$", "same", "分圧と取り違えて、抵抗の比のままにした（並列では、大きい抵抗に小さい電流が流れる）"],
         ["$1 : 1$", "one", "並列で等しいのは電圧。電流は等しく分かれない"], ["$R_2 : (R_1 + R_2)$", "whole", "$I_1$ と全体の電流 $I$ の比と取り違えた"]],
        ["並列なので同じ電圧がかかる。$R_1 I_1 = R_2 I_2$", "電流の比は抵抗の逆比　$I_1 : I_2 = R_2 : R_1$"], "u4s3ratio");
    }
    if (f === "u4s3big") {
      P = u4s3pair(r); R1 = P[0]; R2 = P[1];
      var big = R1 < R2 ? "R1" : "R2", sm = big === "R1" ? "R2" : "R1", nb = big === "R1" ? "R_1" : "R_2", ns = big === "R1" ? "R_2" : "R_1";
      c = choices(r, [{t: "$" + nb + "$", v: big}, {t: "$" + ns + "$", v: sm, why: "抵抗の比のまま考えた（小さい抵抗ほど、大きい電流が流れる）"},
                      {t: "どちらも同じ", v: "same", why: "並列で等しいのは電圧。電流は抵抗の逆比に分かれる"},
                      {t: "全体の電流が分からないので決まらない", v: "none", why: "電流の比は抵抗の比だけで決まる"}]);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列につないだ。流れる電流が大きいのは □ である。",
              fig: u4s3fig({r1: ohm4("_1", R1), r2: ohm4("_2", R2), i: "{I}", i1: "{I}_1", i2: "{I}_2"}), ch: c.ch, ans: c.ans,
              ex: ["電流の比は抵抗の逆比　$I_1 : I_2 = R_2 : R_1 = " + ratio4([R2, R1]) + "$", "大きい電流が流れるのは、小さい抵抗の $" + nb + "$"],
              chk: {form: f, p: {R1: R1, R2: R2}}};
    }
    if (f === "u4s3i") {                // I・R1・R2 から Ik
      var Rk, Ro;
      for (;;) {
        P = u4s3pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
        I = m * (R1 + R2) / g; if (I < 2 || I > 120) continue;
        k = pick(r, [1, 2]); Rk = k === 1 ? R1 : R2; Ro = k === 1 ? R2 : R1;
        ok = I * Ro / (R1 + R2);
        w = u4s3three(ok, [{x: I * Rk / (R1 + R2), why: "分圧と取り違えて、自分の抵抗を分子にした"}, {x: I / 2, why: "電流が2つの抵抗に等しく分かれると考えた"},
                           {x: I, why: "全体の電流が、そのまま流れると考えた"}, {x: I * Ro / Rk, why: "全体の $R_1 + R_2$ でなく、自分の抵抗で割った"}]);
        if (w && int4(ok)) break;
      }
      c = num(r, null, "A", ok, w);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列につなぎ、全体に $I = " + qv(I, "A") + "$ の電流が流れている。"
                    + "$R_" + k + "$ に流れる電流 $I_" + k + "$ は何 A か。",
              fig: u4s3fig(Object.assign({r1: ohm4("_1", R1), r2: ohm4("_2", R2), i: "{I}=" + qf(I, "A")}, k === 1 ? {i1: "{I}_1"} : {i2: "{I}_2"})),
              ch: c.ch, ans: c.ans,
              ex: ["並列なので、電流は抵抗の逆比 $" + ratio4([R2, R1]) + "$ に分かれる",
                   "$I_" + k + " = I \\times \\dfrac{R_" + (3 - k) + "}{R_1 + R_2} = " + fmt(I) + " \\times \\dfrac{" + fmt(Ro) + "}{" + fmt(R1) + " + " + fmt(R2) + "} = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {I: I, R1: R1, R2: R2, k: k}}};
    }
    if (f === "u4s3from") {             // I1・R1・R2 から I2（逆比で）
      for (;;) {
        P = u4s3pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
        I1 = m * R2 / g; ok = m * R1 / g; if (I1 > 100 || ok > 100 || I1 < 1) continue;
        w = u4s3three(ok, [{x: I1 * R2 / R1, why: "抵抗の比のまま掛けた（逆比にしていない）"}, {x: I1, why: "並列なので電流も等しいと考えた（等しいのは電圧）"},
                           {x: I1 + ok, why: "$R_2$ の電流でなく、全体の電流を求めた"}, {x: I1 * R1 / (R1 + R2), why: "$I_1$ を全体の電流と見て分けた"}]);
        if (w) break;
      }
      c = num(r, null, "A", ok, w);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列につないだ。$R_1$ に流れる電流は $I_1 = " + qv(I1, "A") + "$ である。"
                    + "$R_2$ に流れる電流 $I_2$ は何 A か。",
              fig: u4s3fig({r1: ohm4("_1", R1), r2: ohm4("_2", R2), i1: "{I}_1=" + qf(I1, "A"), i2: "{I}_2"}), ch: c.ch, ans: c.ans,
              ex: ["電流の比は抵抗の逆比　$I_1 : I_2 = R_2 : R_1$",
                   "$I_2 = I_1 \\times \\dfrac{R_1}{R_2} = " + fmt(I1) + " \\times \\dfrac{" + fmt(R1) + "}{" + fmt(R2) + "} = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {I1: I1, R1: R1, R2: R2}}};
    }
    for (;;) {                          // u4s3r2：I・I1・R1 から R2（残りの電流 I2 と、電流の比＝抵抗の逆比）
      P = u4s3pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
      I1 = m * R2 / g; I2 = m * R1 / g; I = I1 + I2; ok = R2;
      if (I > 120 || I1 < 1) continue;
      w = u4s3three(ok, [{x: R1 * I2 / I1, why: "抵抗の比を電流の比のままにした（逆比にしていない）"}, {x: R1 * I / I1, why: "$I_2$ でなく全体の電流 $I$ で比を作った"},
                         {x: R1, why: "並列なので抵抗も等しいと考えた"}, {x: R1 * I1 / I, why: "$I_2$ でなく全体の電流 $I$ で割った"}]);
      if (w) break;
    }
    c = num(r, null, "O", ok, w);
    return {form: "u4s3r2", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2$ を並列につなぎ、全体に $I = " + qv(I, "A") + "$ の電流が流れている。"
                  + "$R_1$ に流れる電流は $I_1 = " + qv(I1, "A") + "$ である。$R_2$ は何 Ω か。",
            fig: u4s3fig({r1: ohm4("_1", R1), i: "{I}=" + qf(I, "A"), i1: "{I}_1=" + qf(I1, "A")}), ch: c.ch, ans: c.ans,
            ex: ["$R_2$ に流れる電流は　$I_2 = I - I_1 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(I2, "A") + "$",
                 "電流の比は抵抗の逆比なので　$R_2 = R_1 \\times \\dfrac{I_1}{I_2} = " + fmt(R1) + " \\times \\dfrac{" + fmt(I1) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "u4s3r2", p: {I: I, I1: I1, R1: R1}}};
  },
  // 4-4 分流（3つ以上）
  4: function(r){
    var f = pick(r, ["u4s4law", "u4s4inv", "u4s4inv", "u4s4big", "u4s4cur", "u4s4cur", "u4s4cur", "u4s4cur4", "u4s4other", "u4s4other"]);
    var R, P, n, k, j, m, I, ok, w, c, ex1;
    if (f === "u4s4law") {
      return rule4(r, "図のように、3つの抵抗を並列につないだ。それぞれの道に流れる電流の比 $I_1 : I_2 : I_3$ は □ である。",
        u4s4fig(3, {i: "{I}", i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"}),
        [["$\\dfrac{1}{R_1} : \\dfrac{1}{R_2} : \\dfrac{1}{R_3}$", "rec"],
         ["$R_1 : R_2 : R_3$", "same", "抵抗の比のまま（並列では、抵抗が大きい道ほど電流は小さい）"],
         ["$R_3 : R_2 : R_1$", "rev", "抵抗を逆に並べただけ（逆比は逆数の比）"],
         ["$1 : 1 : 1$", "one", "並列で等しいのは電圧。電流は等しく分かれない"]],
        ["並列なので電圧が同じ　$R_1 I_1 = R_2 I_2 = R_3 I_3$",
         "電流は抵抗の逆比（逆数の比）に分かれる　$I_1 : I_2 : I_3 = \\dfrac{1}{R_1} : \\dfrac{1}{R_2} : \\dfrac{1}{R_3}$"], "u4s4law");
    }
    if (f === "u4s4inv") {              // 抵抗の値から電流の比（整数の比）
      do { R = shuffled(r, pick(r, U4S4SETS3)); P = u4s4inv(R); }
      while (P.rr.slice().reverse().join(",") === P.w.join(","));      // 逆に並べた比が電流の比と同じになる並びは使わない
      var okt = P.w.map(fmt).join(" : ");
      c = choices(r, [{t: "$" + okt + "$", v: okt},
                      {t: "$" + P.rr.map(fmt).join(" : ") + "$", v: P.rr.map(fmt).join(" : "), why: "抵抗の比のまま（並列では、抵抗が大きい道ほど電流は小さい）"},
                      {t: "$" + P.rr.slice().reverse().map(fmt).join(" : ") + "$", v: P.rr.slice().reverse().map(fmt).join(" : "),
                       why: "抵抗の比の数字を逆に並べただけ（逆比は逆数の比）"},
                      {t: "$1 : 1 : 1$", v: "1 : 1 : 1", why: "並列で等しいのは電圧。電流は等しく分かれない"}]);
      return {form: f, text: "図のように、" + u4s4rq(R) + " を並列につないだ。電流の比 $I_1 : I_2 : I_3$ を分母の無い、いちばん簡単な比で表すと □ である。",
              fig: u4s4fig(3, Object.assign(u4s4rl(R), {i: "{I}", i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"})), ch: c.ch, ans: c.ans,
              ex: ["抵抗の比は $" + P.rr.map(fmt).join(" : ") + "$。電流の比は、その逆数の比　$" + u4s4recs(P.rr) + "$",
                   "分母の最小公倍数 " + fmt(P.L) + " を掛けて　$I_1 : I_2 : I_3 = " + okt + "$"],
              chk: {form: f, p: {R1: R[0], R2: R[1], R3: R[2]}}};
    }
    if (f === "u4s4big") {              // いちばん大きい電流が流れる抵抗
      R = shuffled(r, pick(r, U4S4SETS3)); P = u4s4inv(R);
      var mn = R.indexOf(Math.min.apply(null, R)) + 1, mx = R.indexOf(Math.max.apply(null, R)) + 1;
      c = choices(r, [{t: "$R_" + mn + "$", v: "R" + mn},
                      {t: "$R_" + mx + "$", v: "R" + mx, why: "大きい抵抗に大きい電流が流れると考えた（並列では、抵抗が小さい道ほど電流は大きい）"},
                      {t: "どれも同じ", v: "same", why: "並列で等しいのは電圧。電流は抵抗の逆比に分かれる"},
                      {t: "全体の電流が分からないので決まらない", v: "none", why: "電流の比は、抵抗の値だけで決まる"}]);
      return {form: f, text: "図のように、" + u4s4rq(R) + " を並列につないだ。いちばん大きい電流が流れるのは □ である。",
              fig: u4s4fig(3, Object.assign(u4s4rl(R), {i: "{I}", i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"})), ch: c.ch, ans: c.ans,
              ex: ["電流の比は抵抗の逆比　$I_1 : I_2 : I_3 = " + u4s4recs(P.rr) + " = " + P.w.map(fmt).join(" : ") + "$",
                   "いちばん大きい電流が流れるのは、いちばん小さい抵抗の $R_" + mn + "$"],
              chk: {form: f, p: {R1: R[0], R2: R[1], R3: R[2]}}};
    }
    if (f === "u4s4cur" || f === "u4s4cur4") {     // 全体の電流 I と抵抗から Ik
      n = f === "u4s4cur" ? 3 : 4;
      for (;;) {
        R = shuffled(r, pick(r, n === 3 ? U4S4SETS3 : U4S4SETS4)); P = u4s4inv(R);
        m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]); I = m * P.S;
        if (I < 6 || I > 150) continue;
        k = 1 + Math.floor(r() * n); ok = m * P.w[k - 1];
        var sr = P.rr.reduce(function(a, b){ return a + b; }, 0), rv = P.rr.slice().reverse();
        w = u4s4three(ok, [{x: I * rv[k - 1] / sr, why: "抵抗の比の数字を逆に並べただけで分けた（逆比は逆数の比）"},
                           {x: I * P.rr[k - 1] / sr, why: "抵抗の比のまま分けた（抵抗が大きい道ほど、電流は小さい）"},
                           {x: I / n, why: "電流が" + U4S4CNT[n] + "の道に等しく分かれると考えた"},
                           {x: I, why: "全体の電流が、そのまま流れると考えた"},
                           {x: I * P.w[k - 1] / (P.S - P.w[k - 1]), why: "合計でなく、ほかの道の分の和で割った"}]);
        if (w) break;
      }
      c = num(r, null, "A", ok, w);
      var lb = {i: "{I}=" + qf(I, "A")}; lb["i" + k] = "{I}_" + k;
      return {form: f, text: "図のように、" + u4s4rq(R) + " を並列につなぎ、全体の電流を $I = " + qv(I, "A") + "$ とした。"
                    + "$R_" + k + "$ に流れる電流 $I_" + k + "$ は何 A か。",
              fig: u4s4fig(n, Object.assign(u4s4rl(R), lb)), ch: c.ch, ans: c.ans,
              ex: ["電流の比は抵抗の逆比（逆数の比）　$" + u4s4isym(n) + " = " + u4s4recs(P.rr) + " = " + P.w.map(fmt).join(" : ") + "$",
                   "合計 " + fmt(P.S) + " のうち " + fmt(P.w[k - 1]) + " の分　$I_" + k + " = " + fmt(I) + " \\times \\dfrac{" + fmt(P.w[k - 1]) + "}{" + fmt(P.S) + "} = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {I: I, R: R, k: k}}};
    }
    for (;;) {                          // u4s4other：Ij と抵抗から Ik（並列なので Rj Ij = Rk Ik）
      R = shuffled(r, pick(r, U4S4SETS3)); P = u4s4inv(R);
      m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
      j = 1 + Math.floor(r() * 3); k = 1 + (j + Math.floor(r() * 2)) % 3;
      var Ij = m * P.w[j - 1]; ok = m * P.w[k - 1];
      if (Ij < 2 || Ij > 100) continue;
      w = u4s4three(ok, [{x: Ij * R[k - 1] / R[j - 1], why: "比を逆にした（抵抗が大きい道ほど、電流は小さい）"},
                         {x: Ij, why: "電流が等しく分かれると考えた（等しいのは電圧）"},
                         {x: R[j - 1] * Ij, why: "$R_" + j + " I_" + j + "$（電圧）を答えた"},
                         {x: Ij * R[j - 1] / (R[0] + R[1] + R[2]), why: "抵抗の和で割った"}]);
      if (w) break;
    }
    c = num(r, null, "A", ok, w);
    var lo = {}; lo["i" + j] = "{I}_" + j + "=" + qf(Ij, "A"); lo["i" + k] = "{I}_" + k;
    ex1 = "並列なので電圧が同じ　$R_" + j + " I_" + j + " = R_" + k + " I_" + k + "$";
    return {form: "u4s4other", text: "図のように、" + u4s4rq(R) + " を並列につないだ。$R_" + j + "$ に流れる電流は $I_" + j + " = " + qv(Ij, "A") + "$ である。"
                  + "$R_" + k + "$ に流れる電流 $I_" + k + "$ は何 A か。",
            fig: u4s4fig(3, Object.assign(u4s4rl(R), lo)), ch: c.ch, ans: c.ans,
            ex: [ex1, "$I_" + k + " = I_" + j + " \\times \\dfrac{R_" + j + "}{R_" + k + "} = " + fmt(Ij) + " \\times \\dfrac{" + fmt(R[j - 1]) + "}{" + fmt(R[k - 1]) + "} = " + qv(ok, "A") + "$"],
            chk: {form: "u4s4other", p: {Ij: Ij, R: R, j: j, k: k}}};
  },
  // 4-5 短絡
  5: function(r){
    var f = pick(r, ["u4s5def", "u4s5flow", "u4s5zero", "u4s5i", "u4s5i", "u4s5i", "u4s5v", "u4s5cur", "u4s5cur"]);
    var V, I, R1, R2, ok, w, c, k;
    if (f === "u4s5def") {
      return rule4(r, "図のように、$R_1$ の道と並べて、2点を抵抗を挟まずに線でつないだ。このようにつなぐことを □ という。",
        u4s5pfig(["1", "s"], {i: "{I}", r1: "{R}_1"}),
        [["短絡", "short"], ["直列", "ser", "直列は、分かれ道の無い1本の道につなぐこと"],
         ["並列", "par", "並列は、抵抗の両端をそれぞれ同じ点につなぐこと。短絡は抵抗を挟まない"],
         ["分流", "div", "分流は、電流が抵抗の逆比に分かれること"]],
        ["2点を抵抗を挟まずに線でつなぐことを、短絡（ショート）という"], "u4s5def");
    }
    if (f === "u4s5flow") {
      return rule4(r, "図のように、$R_1$ の道と並べて、2点を抵抗を挟まずに線でつないだ（短絡）。点 a から流れ込む電流 $I$ の流れ方は □ である。",
        u4s5pfig(["1", "s"], {i: "{I}", r1: "{R}_1", i1: "{I}_1", i2: "{I}_2"}),
        [["全部が短絡した線に流れ、$R_1$ には流れない", "all_s"],
         ["全部が $R_1$ に流れ、短絡した線には流れない", "all_r", "逆。電流は抵抗の無い線に全部流れる"],
         ["$R_1$ と短絡した線に等しく分かれる", "half", "等しく分かれるのは、2つの道の抵抗が同じ時"],
         ["$R_1$ が大きいほど、$R_1$ に多く流れる", "more", "電流は抵抗の逆比に分かれる。抵抗が大きいほど流れにくい"]],
        ["抵抗の無い線は $0\\,\\Omega$ と考える。分流の式で　$I_1 = I \\times \\dfrac{0}{R_1 + 0} = 0$", "電流は全部が短絡した線に流れ、$R_1$ には流れない"], "u4s5flow");
    }
    if (f === "u4s5zero") {
      return rule4(r, "図のように、$R_1$ の道と並べて、2点を抵抗を挟まずに線でつないだ（短絡）。$R_1$ にかかる電圧は □ である。",
        u4s5pfig(["1", "s"], {i: "{I}", r1: "{R}_1"}),
        [["$0\\,\\mathrm{V}$", "zero"], ["$R_1 I$", "ri", "$R_1$ に電流 $I$ が全部流れると考えた"],
         ["$\\dfrac{R_1 I}{2}$", "half", "2つの道に電流が等しく分かれると考えた"],
         ["$R_1$ が大きいほど大きい", "big", "短絡した線の両端は同じ電位。並べた $R_1$ の両端も同じ電位"]],
        ["短絡した線の両端は、抵抗の無い線でつながっているので同じ電位", "$R_1$ の両端も同じ電位なので、$R_1$ にかかる電圧は $0\\,\\mathrm{V}$"], "u4s5zero");
    }
    if (f === "u4s5i") {                // 道3つ（R1・R2・短絡した線）。I から各道の電流
      for (;;) {
        do { R1 = pick(r, RS4); R2 = pick(r, RS4); } while (R1 === R2);
        I = pick(r, [6, 9, 12, 15, 18, 20, 24, 30, 36, 40, 45, 48, 60]); k = pick(r, [1, 2, 3]);
        if (k < 3) {
          ok = 0;
          w = u4s5three(ok, [{x: I * (k === 1 ? R2 : R1) / (R1 + R2), why: "短絡した線を入れずに、$R_1$ と $R_2$ で分けた"},
                             {x: I / 3, why: "3つの道に等しく分かれると考えた"},
                             {x: I, why: "抵抗のある $R_" + k + "$ の道に、全部が流れると考えた"}]);
        } else {
          ok = I;
          w = u4s5three(ok, [{x: I / 3, why: "3つの道に等しく分かれると考えた"},
                             {x: I / 2, why: "短絡した線と、抵抗のある道に半分ずつ分かれると考えた"},
                             {x: I * R1 / (R1 + R2), why: "短絡した線を入れずに、$R_1$ と $R_2$ で分けた"}]);
        }
        if (w) break;
      }
      c = num(r, null, "A", ok, w);
      return {form: f, text: "図のように、点 a から点 b へ $I = " + qv(I, "A") + "$ の電流が流れている。$R_1 = " + qv(R1, "O") + "$、$R_2 = " + qv(R2, "O") + "$ の道と並べて、"
                    + "2点を抵抗を挟まずに線でつないだ。" + (k < 3 ? "$R_" + k + "$ に流れる電流 $I_" + k + "$" : "短絡した線に流れる電流 $I_3$") + " は何 A か。",
              fig: u4s5pfig(["1", "2", "s"], {i: "{I}=" + qf(I, "A"), r1: ohm4("_1", R1), r2: ohm4("_2", R2), i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"}),
              ch: c.ch, ans: c.ans,
              ex: ["2点を抵抗を挟まずにつないでいる（短絡）ので、電流は全部が短絡した線に流れる",
                   k < 3 ? "$R_" + k + "$ には流れないので　$I_" + k + " = " + qv(0, "A") + "$" : "$I_3 = I = " + qv(I, "A") + "$"],
              chk: {form: f, p: {I: I, R1: R1, R2: R2, k: k}}};
    }
    if (f === "u4s5v") {                // 直列で R2 = 0 Ω：V1 と V2
      R1 = pick(r, RS4); V = pick(r, [6, 10, 12, 20, 24, 30, 40, 48, 50, 60, 80, 100]);
      c = choices(r, [{t: "$V_1 = " + qv(V, "V") + "$、$V_2 = " + qv(0, "V") + "$", v: "v1all"},
                      {t: "$V_1 = " + qv(0, "V") + "$、$V_2 = " + qv(V, "V") + "$", v: "v2all", why: "逆。$0\\,\\Omega$ の $R_2$ の両端は同じ電位で、電圧は $0\\,\\mathrm{V}$"},
                      {t: "$V_1 = V_2 = " + qv(V / 2, "V") + "$", v: "half", why: "2つの抵抗に等しく分かれると考えた"},
                      {t: "$V_1 = V_2 = " + qv(V, "V") + "$", v: "both", why: "どちらにも電源の電圧がそのままかかると考えた"}]);
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(0, "O") + "$ を直列につなぎ、電源の電圧を $V = " + qv(V, "V") + "$ とした。"
                    + "$R_1$・$R_2$ にかかる電圧 $V_1$・$V_2$ は □ である。",
              fig: u4s5sfig({r1: ohm4("_1", R1), src: "{V}=" + qf(V, "V"), v1: "{V}_1", v2: "{V}_2"}), ch: c.ch, ans: c.ans,
              ex: ["$0\\,\\Omega$ の $R_2$ の両端は同じ電位なので　$V_2 = " + qv(0, "V") + "$",
                   "電源の電圧は全部が $R_1$ にかかる　$V_1 = V = " + qv(V, "V") + "$"],
              chk: {form: f, p: {V: V, R1: R1}}};
    }
    for (;;) {                          // u4s5cur：直列で R2 = 0 Ω。電源の電圧は全部 R1 にかかる → I = V / R1
      R1 = pick(r, RS4); I = pick(r, [1, 2, 4, 5, 8, 10]); V = R1 * I;
      if (V > 200 || V * R1 > 2000) continue;
      ok = I;
      w = u4s5three(ok, [{x: V / (2 * R1), why: "電源の電圧が $R_1$ と $R_2$ に半分ずつかかると考えた"},
                         {x: V * R1, why: "割るところを掛けた"}, {x: R1 / V, why: "割る順が逆"}]);
      if (w) break;
    }
    c = num(r, null, "A", ok, w);
    return {form: "u4s5cur", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(0, "O") + "$ を直列につなぎ、電源の電圧を $V = " + qv(V, "V") + "$ とした。"
                  + "流れる電流 $I$ は何 A か。",
            fig: u4s5sfig({r1: ohm4("_1", R1), src: "{V}=" + qf(V, "V"), i: "{I}"}), ch: c.ch, ans: c.ans,
            ex: ["$0\\,\\Omega$ の $R_2$ の両端は同じ電位なので、電源の電圧は全部が $R_1$ にかかる",
                 "$I = \\dfrac{V}{R_1} = \\dfrac{" + fmt(V) + "}{" + fmt(R1) + "} = " + qv(ok, "A") + "$"],
            chk: {form: "u4s5cur", p: {V: V, R1: R1}}};
  },
  // 4-6 分かれた電流から全体の電流
  6: function(r){
    var f = pick(r, ["u4s6law", "u4s6ratio", "u4s6tot", "u4s6tot", "u4s6tot", "u4s6oth", "u4s6oth", "u4s6r", "u4s6r"]);
    var P, g, m, R1, R2, Rk, Ro, I, Ik, Io, I1, I2, ok, w, c, k, o;
    if (f === "u4s6law") {
      k = pick(r, [1, 2]); o = 3 - k;
      return rule4(r, "図のように、$R_1$ と $R_2$ を並列につないだ。$R_" + k + "$ に流れる電流 $I_" + k + "$ が分かっている時、全体の電流は $I = I_" + k + " \\times$ □ である。",
        u4s6fig({}),
        [["$\\dfrac{R_1 + R_2}{R_" + o + "}$", "own"],
         ["$\\dfrac{R_1 + R_2}{R_" + k + "}$", "mine", "分母を自分の抵抗 $R_" + k + "$ にした（電流は抵抗の逆比に分かれる）"],
         ["$\\dfrac{R_" + o + "}{R_1 + R_2}$", "inv", "分母と分子が逆（全体から $I_" + k + "$ を出す分流の式と取り違えた）"],
         ["$\\dfrac{R_" + k + "}{R_" + o + "}$", "oth", "もう一方の電流 $I_" + o + "$ を出す形"]],
        ["電流は抵抗の逆比に分かれる　$I_1 : I_2 = R_2 : R_1$",
         "$I$ は $R_1 + R_2$ の分なので　$I = I_" + k + " \\times \\dfrac{R_1 + R_2}{R_" + o + "}$"], "u4s6law");
    }
    if (f === "u4s6ratio") {
      return rule4(r, "図のように、$R_1$ と $R_2$ を並列につないだ。$R_1$ に流れる電流 $I_1$ と全体の電流 $I$ の比 $I_1 : I$ は □ である。",
        u4s6fig({}),
        [["$R_2 : (R_1 + R_2)$", "rt"], ["$R_1 : (R_1 + R_2)$", "same", "逆比にしなかった（電流は抵抗の逆比に分かれる）"],
         ["$R_2 : R_1$", "i12", "$I_1 : I_2$ と取り違えた"], ["$(R_1 + R_2) : R_2$", "rev", "比を逆にした（$I$ の方が大きい）"]],
        ["電流は抵抗の逆比に分かれる　$I_1 : I_2 = R_2 : R_1$", "$I = I_1 + I_2$ なので　$I_1 : I = R_2 : (R_1 + R_2)$"], "u4s6ratio");
    }
    if (f === "u4s6tot" || f === "u4s6oth") {     // R1・R2・Ik から I（tot）か、もう一方の電流（oth）
      for (;;) {
        P = u4s6pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
        k = pick(r, [1, 2]); o = 3 - k; Rk = k === 1 ? R1 : R2; Ro = k === 1 ? R2 : R1;
        Ik = m * Ro / g; Io = m * Rk / g; I = Ik + Io;
        if (I > 100 || Ik < 1) continue;
        if (f === "u4s6tot") {
          ok = I;
          w = u4s6three(ok, [{x: Ik * (R1 + R2) / Rk, why: "分母を自分の抵抗 $R_" + k + "$ にした（電流は抵抗の逆比に分かれる）"},
                             {x: Io, why: "もう一方の電流 $I_" + o + "$ を求めた"},
                             {x: 2 * Ik, why: "2つの道に等しく分かれると考えた"},
                             {x: Ik * Ro / (R1 + R2), why: "全体から $I_" + k + "$ を出す分流の式と取り違えた"}]);
        } else {
          ok = Io;
          w = u4s6three(ok, [{x: Ik * Ro / Rk, why: "比を逆にした（電流は抵抗の逆比に分かれる）"},
                             {x: I, why: "全体の電流 $I$ を求めた"},
                             {x: Ik, why: "並列なので電流も等しいと考えた"}]);
        }
        if (w) break;
      }
      c = num(r, null, "A", ok, w);
      var lab = {r1: ohm4("_1", R1), r2: ohm4("_2", R2)};
      lab["i" + k] = "{I}_" + k + "=" + qf(Ik, "A");
      var ask = f === "u4s6tot" ? "全体の電流 $I$" : "$R_" + o + "$ に流れる電流 $I_" + o + "$";
      return {form: f, text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ を並列につないだ。$R_" + k + "$ に流れる電流は $I_" + k + " = " + qv(Ik, "A") + "$ である。"
                    + ask + " は何 A か。",
              fig: u4s6fig(lab), ch: c.ch, ans: c.ans,
              ex: ["電流は抵抗の逆比に分かれる　$I_1 : I_2 = R_2 : R_1 = " + ratio4([R2, R1]) + "$",
                   f === "u4s6tot"
                     ? "$I = I_" + k + " \\times \\dfrac{R_1 + R_2}{R_" + o + "} = " + fmt(Ik) + " \\times \\dfrac{" + fmt(R1) + " + " + fmt(R2) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"
                     : "$I_" + o + " = I_" + k + " \\times \\dfrac{R_" + k + "}{R_" + o + "} = " + fmt(Ik) + " \\times \\dfrac{" + fmt(Rk) + "}{" + fmt(Ro) + "} = " + qv(ok, "A") + "$"],
              chk: {form: f, p: {R1: R1, R2: R2, Ik: Ik, k: k}}};
    }
    for (;;) {                          // u4s6r：I・I1・R1 から R2（I2 = I − I1、R2 = R1 × I1/I2）
      P = u4s6pair(r); R1 = P[0]; R2 = P[1]; g = P[2]; m = pick(r, [1, 2, 3, 4, 5, 6, 8, 10]);
      I1 = m * R2 / g; I2 = m * R1 / g; I = I1 + I2; ok = R2;
      if (I > 100 || I1 < 1) continue;
      w = u4s6three(ok, [{x: R1 * I2 / I1, why: "比を逆にした（電流は抵抗の逆比に分かれる）"},
                         {x: R1, why: "2つの抵抗が等しいと考えた"},
                         {x: R1 * I1 / I, why: "$I_2$ でなく全体の電流 $I$ で割った"},
                         {x: R1 * I / I1, why: "$I_2$ でなく全体の電流 $I$ で比を作り、逆にした"}]);
      if (w) break;
    }
    c = num(r, null, "O", ok, w);
    return {form: "u4s6r", text: "図のように、$R_1 = " + qv(R1, "O") + "$ と $R_2$ を並列につないだ。全体の電流は $I = " + qv(I, "A") + "$、"
                  + "$R_1$ に流れる電流は $I_1 = " + qv(I1, "A") + "$ である。$R_2$ は何 Ω か。",
            fig: u4s6fig({r1: ohm4("_1", R1), i: "{I}=" + qf(I, "A"), i1: "{I}_1=" + qf(I1, "A")}), ch: c.ch, ans: c.ans,
            ex: ["$R_2$ に流れる電流は　$I_2 = I - I_1 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(I2, "A") + "$",
                 "電流は抵抗の逆比に分かれる（$I_1 : I_2 = R_2 : R_1$）ので　$R_2 = R_1 \\times \\dfrac{I_1}{I_2} = " + fmt(R1) + " \\times \\dfrac{" + fmt(I1) + "}{" + fmt(I2) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "u4s6r", p: {I: I, I1: I1, R1: R1}}};
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t4s1e","scene":"t4s1e","kind":"u4s1ser","lab":{"pm":1,"src":["{V}","{V}=24 V"],"r1":["{R}_1","{R}_1=6 Ω"],"r2":["{R}_2","{R}_2=2 Ω"],"v1":["{V}_1","{V}_1=18 V"],"v2":["{V}_2","{V}_2=6 V"],"i":"{I}"},"viewbox":"464 232 595 400","band":{"want":"直列の2つの抵抗にかかる電圧","ans":"抵抗の比に分かれる　$V_1 = V \\times \\dfrac{R_1}{R_1 + R_2}$","full":"直列の2つの抵抗には同じ電流が流れるので、かかる電圧の比は抵抗の比と同じ。電源の電圧 V は抵抗の比に分かれてかかる（分圧）。"},"narr":{"start":{"co":1,"srcv":0,"r1v":0,"r2v":0,"v1d":0,"v2d":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①電流は同じ\n②抵抗の比に分かれる\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"$R_1$ と $R_2$ は直列なので、どちらにも同じ電流 $I$ が流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R1","R2"]},{"text":"それぞれの抵抗にかかる電圧は、オームの法則で表せます。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","V1","R2","V2","I"],"move":"varr","eq":[{"cont":false,"items":[["V_1 = R_1 I"],["V_2 = R_2 I"]]}],"emphPre":["R1","V1","R2","V2","I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"どちらも同じ $I$ を掛けるので、電圧の比は抵抗の比と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["V1","V2","R1","R2","I"],"eq":[{"cont":false,"items":[["V_1 : V_2 = R_1 : R_2"]]}],"emphPre":["V1","V2","R1","R2","I"]},{"text":"電源の電圧 $V$ は、抵抗の比に分かれて $R_1$ と $R_2$ にかかります。これを分圧といいます。","at":{"強調":1.0},"after":[],"emph":["src","V1","V2","R1","R2","zhi","zmid","zlo"]},{"text":"$V_1$ は、$V$ のうち $R_1$ の割合の分です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","R1","V1","R2"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{R_1}{R_1 + R_2}"]]}],"emphPre":["src","R1","V1","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V = 24\\,\\mathrm{V}$、$R_1 = 6\\,\\Omega$、$R_2 = 2\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["src","R1","R2"],"move":"vals"},{"text":"抵抗の比は $6 : 2 = 3 : 1$ なので、$24\\,\\mathrm{V}$ を $3 : 1$ に分けます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","src"]},{"text":"$V_1$ は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R1","V1"],"eq":[{"cont":false,"items":[["V_1 = 24 \\times \\dfrac{6}{6 + 2} = 18\\,\\mathrm{V}"]]}],"move":"v1val","emphPre":["src","R1","V1"]},{"text":"$V_2$ は残りの $24 - 18 = 6\\,\\mathrm{V}$ です。$18 : 6 = 3 : 1$ で、抵抗の比と同じです。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["R2","V2"],"move":"v2val","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u4s1L","u4s1w1","zbhi"],"zmid":["u4s1wm","zbmid"],"zlo":["u4s1w2","u4s1R","zblo"]},"moves":{"varr":{"to":{"v1d":1,"v2d":1},"dur":0.8},"vals":{"to":{"srcv":1,"r1v":1,"r2v":1},"dur":0.6},"v1val":{"to":{"v1v":1},"dur":0.4},"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["電流は同じ","抵抗の比に分かれる","数字で見る"]}},{"id":"t4s1x","scene":"t4s1x","kind":"u4s1ser","lab":{"pm":1,"src":"{V}=100 V","r1":"{R}_1=15 Ω","r2":"{R}_2=35 Ω","v2":["{V}_2","{V}_2=70 V"]},"viewbox":"464 232 595 400","band":{"want":"$R_2$ にかかる電圧 $V_2$","known":"$V = 100\\,\\mathrm{V},\\;\\; R_1 = 15\\,\\Omega,\\;\\; R_2 = 35\\,\\Omega$","ans":"$V_2 = 70\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_2$ にかかる電圧 $V_2$ です。","at":{"強調":1.0},"after":[],"emph":["V2","R2"]},{"text":"①抵抗の比\n②分圧の式\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V2","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$R_1$ と $R_2$ は直列なので、電源の電圧 $V$ は抵抗の比に分かれてかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R1","R2"]},{"text":"抵抗の比は $15 : 35 = 3 : 7$ です。$V_2$ は $V$ の $\\dfrac{7}{10}$ になります。","at":{"強調":1.0},"after":[],"emph":["R1","R2","V2","src"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V_2$ は、$V$ のうち $R_2$ の割合の分です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["src","R2","V2","R1"],"eq":[{"cont":false,"items":[["V_2 = V \\times \\dfrac{R_2}{R_1 + R_2}"],["V_2 = 100 \\times \\dfrac{35}{15 + 35}"],["V_2 = 70\\,\\mathrm{V}"]]}],"move":"v2val","ans":true,"emphPre":["src","R2","V2","R1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u4s1L","u4s1w1","zbhi"],"zmid":["u4s1wm","zbmid"],"zlo":["u4s1w2","u4s1R","zblo"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["抵抗の比","分圧の式"]}},{"id":"t4s2e","scene":"t4s2e","kind":"u4s2ser","lab":{"pm":1,"src":["{V}","{V}=48 V"],"r1":["{R}_1","{R}_1=4 Ω"],"r2":["{R}_2","{R}_2=16 Ω"],"r3":["{R}_3","{R}_3=12 Ω"],"v1":["{V}_1","{V}_1=6 V"],"v2":["{V}_2","{V}_2=24 V"],"v3":["{V}_3","{V}_3=18 V"],"i":"{I}"},"viewbox":"464 232 595 400","band":{"want":"直列の3つ以上の抵抗にかかる電圧","ans":"比を簡単にして、合計で割る　$V_1 = V \\times \\dfrac{R_1}{R_1 + R_2 + R_3}$","full":"抵抗が3つ以上でも、直列なら同じ電流が流れるので、電圧の比は抵抗の比と同じ。抵抗の比を簡単にして、比の合計のうち自分の数の分の電圧がかかる。"},"narr":{"start":{"co":1,"srcv":0,"r1v":0,"r2v":0,"r3v":0,"v1d":0,"v2d":0,"v3d":0,"v1v":0,"v2v":0,"v3v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①抵抗の比に分かれる\n②合計で割る\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[5,2],"sents":[{"text":"$R_1$・$R_2$・$R_3$ は直列なので、どれにも同じ電流 $I$ が流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R1","R2","R3"]},{"text":"それぞれの抵抗にかかる電圧は、どれも抵抗に同じ $I$ を掛けた物です。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","V1","R2","V2","R3","V3","I"],"move":"varr","eq":[{"cont":false,"items":[["V_1 = R_1 I","V_2 = R_2 I","V_3 = R_3 I"]]}],"emphPre":["R1","V1","R2","V2","R3","V3","I"]},{"text":"なので、抵抗が3つでも、電圧の比は抵抗の比と同じです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["V1","V2","V3","R1","R2","R3"],"eq":[{"cont":false,"items":[["V_1 : V_2 : V_3 = R_1 : R_2 : R_3"]]}],"emphPre":["V1","V2","V3","R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"電源の電圧 $V$ は、抵抗の比に分かれて3つの抵抗にかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["src","V1","V2","V3","R1","R2","R3","zhi","zmid","zmid2","zlo"]},{"text":"$V_1$ は、$V$ のうち $R_1$ の割合の分です。分母は3つの抵抗の合計です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","V1","R1","R2","R3"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{R_1}{R_1 + R_2 + R_3}"]]}],"emphPre":["src","V1","R1","R2","R3"]},{"text":"抵抗の値をそのまま入れるより、先に比を簡単にして、比の合計で割る方が計算が楽です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V = 48\\,\\mathrm{V}$、$R_1 = 4\\,\\Omega$、$R_2 = 16\\,\\Omega$、$R_3 = 12\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["src","R1","R2","R3"],"move":"vals"},{"text":"どれも4で割れるので、抵抗の比を簡単にします。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["4 : 16 : 12 = 1 : 4 : 3"]]}],"emphPre":["R1","R2","R3"]},{"text":"比の合計は $1 + 4 + 3 = 8$ です。$48\\,\\mathrm{V}$ を8つに分けて考えます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","src"]},{"text":"$V_1$ は、8つのうちの1つ分です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R1","V1"],"eq":[{"cont":false,"items":[["V_1 = 48 \\times \\dfrac{1}{8} = 6\\,\\mathrm{V}"]]}],"move":"v1val","emphPre":["src","R1","V1"]},{"text":"$V_2$ は、8つのうちの4つ分です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R2","V2"],"eq":[{"cont":false,"items":[["V_2 = 48 \\times \\dfrac{4}{8} = 24\\,\\mathrm{V}"]]}],"move":"v2val","emphPre":["src","R2","V2"]},{"text":"$V_3$ は、8つのうちの3つ分です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R3","V3"],"eq":[{"cont":false,"items":[["V_3 = 48 \\times \\dfrac{3}{8} = 18\\,\\mathrm{V}"]]}],"move":"v3val","emphPre":["src","R3","V3"]},{"text":"$6 + 24 + 18 = 48\\,\\mathrm{V}$ で、電源の電圧と同じです。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["V1","V2","V3","src"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"V3":["v3d:e","v3d:f","v3d:a","v3t0","v3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u4s2L","u4s2w0","zbhi"],"zmid":["u4s2w1","zbmid"],"zmid2":["u4s2w2","zbmid2"],"zlo":["u4s2w3","u4s2R","zblo"]},"moves":{"varr":{"to":{"v1d":1,"v2d":1,"v3d":1},"dur":0.8},"vals":{"to":{"srcv":1,"r1v":1,"r2v":1,"r3v":1},"dur":0.6},"v1val":{"to":{"v1v":1},"dur":0.4},"v2val":{"to":{"v2v":1},"dur":0.4},"v3val":{"to":{"v3v":1},"dur":0.4}},"route":["抵抗の比に分かれる","合計で割る","数字で見る"]}},{"id":"t4s2x","scene":"t4s2x","kind":"u4s2ser","lab":{"pm":1,"src":"{V}=72 V","r1":"{R}_1=15 Ω","r2":"{R}_2=25 Ω","r3":"{R}_3=50 Ω","v2":["{V}_2","{V}_2=20 V"]},"viewbox":"464 232 595 400","band":{"want":"$R_2$ にかかる電圧 $V_2$","known":"$V = 72\\,\\mathrm{V},\\;\\; R_1 = 15\\,\\Omega,\\;\\; R_2 = 25\\,\\Omega,\\;\\; R_3 = 50\\,\\Omega$","ans":"$V_2 = 20\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_2$ にかかる電圧 $V_2$ です。","at":{"強調":1.0},"after":[],"emph":["V2","R2"]},{"text":"①比を簡単にする\n②合計で割る\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V2","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"3つの抵抗は直列なので、電源の電圧 $V$ は抵抗の比に分かれてかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R1","R2","R3"]},{"text":"どれも5で割れるので、抵抗の比を簡単にします。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["15 : 25 : 50 = 3 : 5 : 10"]]}],"emphPre":["R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"比の合計は $3 + 5 + 10 = 18$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","R2","R3"]},{"text":"$V_2$ は、比の合計18のうちの5つ分です。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["src","V2","R2"],"eq":[{"cont":false,"items":[["V_2 = 72 \\times \\dfrac{5}{18}"],["V_2 = 20\\,\\mathrm{V}"]]}],"move":"v2val","ans":true,"emphPre":["src","V2","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"V3":["v3d:e","v3d:f","v3d:a","v3t0","v3t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u4s2L","u4s2w0","zbhi"],"zmid":["u4s2w1","zbmid"],"zmid2":["u4s2w2","zbmid2"],"zlo":["u4s2w3","u4s2R","zblo"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["比を簡単にする","合計で割る"]}},{"id":"t4s3e","scene":"t4s3e","kind":"u4s3par","lab":{"pm":1,"i":["{I}","{I}=30 A"],"r1":["{R}_1","{R}_1=4 Ω"],"r2":["{R}_2","{R}_2=2 Ω"],"v1":"{V}","v2":"{V}","i1":["{I}_1","{I}_1=10 A"],"i2":["{I}_2","{I}_2=20 A"],"fl":[3,1,2]},"viewbox":"464 152 595 560","band":{"want":"並列の2つの抵抗に流れる電流","ans":"抵抗の逆比に分かれる　$I_1 = I \\times \\dfrac{R_2}{R_1 + R_2}$","full":"並列の2つの抵抗には同じ電圧がかかるので、抵抗の大きい方に小さい電流が流れる。電流の比は抵抗の逆比。全体の電流 I は抵抗の逆比に分かれて流れる（分流）。"},"narr":{"start":{"co":1,"iv":0,"r1v":0,"r2v":0,"v1d":0,"v2d":0,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①電圧は同じ\n②抵抗の逆比に分かれる\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"$R_1$ と $R_2$ は並列なので、どちらにも同じ電圧 $V$ がかかります。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["R1","R2","V1","V2","zhi","zlo"],"move":"varr"},{"text":"それぞれに流れる電流 $I_1$・$I_2$ は、オームの法則で表せます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","I1","I2","V1","V2"],"eq":[{"cont":false,"items":[["V = R_1 I_1"],["V = R_2 I_2"]]}],"emphPre":["R1","R2","I1","I2","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"どちらも同じ $V$ なので、抵抗と電流を掛けた値が等しくなります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2","I1","I2","V1","V2"],"eq":[{"cont":false,"items":[["R_1 I_1 = R_2 I_2"]]}],"emphPre":["R1","R2","I1","I2","V1","V2"]},{"text":"抵抗が大きい方には、小さい電流が流れます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","I1","I2"]},{"text":"電流の比は、抵抗の比の逆比です。2つの時は、比の2つの数字を入れ替えた比になります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","I1","I2"],"eq":[{"cont":false,"items":[["I_1 : I_2 = R_2 : R_1"]]}],"emphPre":["R1","R2","I1","I2"]},{"text":"全体の電流 $I$ は、抵抗の逆比に分かれて流れます。これを分流といいます。","at":{"強調":1.0},"after":[],"emph":["I","I1","I2","R1","R2"]},{"text":"$I_1$ は、反対側の $R_2$ の割合の分です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I","I1","R1","R2"],"eq":[{"cont":false,"items":[["I_1 = I \\times \\dfrac{R_2}{R_1 + R_2}"]]}],"emphPre":["I","I1","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I = 30\\,\\mathrm{A}$、$R_1 = 4\\,\\Omega$、$R_2 = 2\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["I","R1","R2"],"move":"vals"},{"text":"抵抗の比は $4 : 2 = 2 : 1$ なので、電流の比は入れ替えた $1 : 2$ です。","at":{"強調":1.0},"after":[],"emph":["R1","R2","I1","I2"]},{"text":"$I_1$ は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I","R1","R2","I1"],"eq":[{"cont":false,"items":[["I_1 = 30 \\times \\dfrac{2}{4 + 2} = 10\\,\\mathrm{A}"]]}],"move":"i1val","emphPre":["I","R1","R2","I1"]},{"text":"$I_2$ は残りの $30 - 10 = 20\\,\\mathrm{A}$ です。$10 : 20 = 1 : 2$ で、抵抗の比 $2 : 1$ の逆です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["I","I1","I2","R1","R2"],"move":"i2val","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"zhi":["u4s3L","u4s3w1l","u4s3w2l","u4s3bl","zbhi"],"zlo":["u4s3R","u4s3w1r","u4s3w2r","u4s3br","zblo"]},"moves":{"varr":{"to":{"v1d":1,"v2d":1},"dur":0.8},"vals":{"to":{"iv":1,"r1v":1,"r2v":1},"dur":0.6},"i1val":{"to":{"i1v":1},"dur":0.4},"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["電圧は同じ","抵抗の逆比に分かれる","数字で見る"]}},{"id":"t4s3x","scene":"t4s3x","kind":"u4s3par","lab":{"pm":1,"i":"{I}=20 A","r1":"{R}_1=6 Ω","r2":"{R}_2=18 Ω","i2":["{I}_2","{I}_2=5 A"],"fl":[4,3,1]},"viewbox":"464 152 595 560","band":{"want":"$R_2$ に流れる電流 $I_2$","known":"$I = 20\\,\\mathrm{A},\\;\\; R_1 = 6\\,\\Omega,\\;\\; R_2 = 18\\,\\Omega$","ans":"$I_2 = 5\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_2$ に流れる電流 $I_2$ です。","at":{"強調":1.0},"after":[],"emph":["I2","R2"]},{"text":"①抵抗の逆比\n②分流の式\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I2","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$R_1$ と $R_2$ は並列なので、全体の電流 $I$ は抵抗の逆比に分かれて流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R1","R2"]},{"text":"抵抗の比は $6 : 18 = 1 : 3$ なので、電流の比は入れ替えた $3 : 1$ です。$I_2$ は $I$ の $\\dfrac{1}{4}$ になります。","at":{"強調":1.0},"after":[],"emph":["R1","R2","I2","I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I_2$ は、反対側の $R_1$ の割合の分です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","I2","R1","R2"],"eq":[{"cont":false,"items":[["I_2 = I \\times \\dfrac{R_1}{R_1 + R_2}"],["I_2 = 20 \\times \\dfrac{6}{6 + 18}"],["I_2 = 5\\,\\mathrm{A}"]]}],"move":"i2val","ans":true,"emphPre":["I","I2","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"zhi":["u4s3L","u4s3w1l","u4s3w2l","u4s3bl","zbhi"],"zlo":["u4s3R","u4s3w1r","u4s3w2r","u4s3br","zblo"]},"moves":{"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["抵抗の逆比","分流の式"]}},{"id":"t4s4e","scene":"t4s4e","kind":"u4s4par","lab":{"pm":1,"r1":["{R}_1","{R}_1=6 Ω"],"r2":["{R}_2","{R}_2=4 Ω"],"r3":["{R}_3","{R}_3=8 Ω"],"i":["{I}","{I}=26 A"],"i1":["{I}_1","{I}_1=8 A"],"i2":["{I}_2","{I}_2=12 A"],"i3":["{I}_3","{I}_3=6 A"],"fl":[3.25,1,1.5,0.75]},"viewbox":"464 196 595 500","band":{"want":"3つ以上の並列に分かれる電流","ans":"抵抗の逆比＝逆数の比に分かれる　$I_1 : I_2 : I_3 = \\dfrac{1}{R_1} : \\dfrac{1}{R_2} : \\dfrac{1}{R_3}$","full":"並列の抵抗には同じ電圧がかかるので、抵抗と電流を掛けた値はどれも同じ。電流は抵抗の逆比に分かれる。逆比は逆数の比で、抵抗の比の数字を逆に並べた物ではない。逆数の比は、分母の最小公倍数を掛けて、分母の無い比にする。"},"narr":{"start":{"co":1,"r1v":0,"r2v":0,"r3v":0,"iv":0,"i1v":0,"i2v":0,"i3v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①電圧は同じ\n②逆数の比\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"$R_1$・$R_2$・$R_3$ は並列なので、3つとも同じ電圧がかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3","zhi","zlo"]},{"text":"それぞれの道の電流を $I_1$・$I_2$・$I_3$ とします。オームの法則で、抵抗と電流を掛けた値が3つとも同じです。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","I1","I2","I3"],"eq":[{"cont":false,"items":[["R_1 I_1 = R_2 I_2 = R_3 I_3"]]}],"emphPre":["R1","R2","R3","I1","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"抵抗が大きい道ほど、電流は小さくなります。電流は抵抗の逆比に分かれます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","R2","R3","I1","I2","I3"]},{"text":"逆比とは、逆数の比のことです。2つの時に数字を入れ替えたのも、逆数の比です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 : I_2 : I_3 = \\dfrac{1}{R_1} : \\dfrac{1}{R_2} : \\dfrac{1}{R_3}"]]}],"emphPre":["R1","R2","R3","I1","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I = 26\\,\\mathrm{A}$、$R_1 = 6\\,\\Omega$、$R_2 = 4\\,\\Omega$、$R_3 = 8\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["I","R1","R2","R3"],"move":"vals"},{"text":"抵抗の比は $6 : 4 : 8 = 3 : 2 : 4$ です。この逆数を取ります。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 : I_2 : I_3 = \\dfrac{1}{3} : \\dfrac{1}{2} : \\dfrac{1}{4}"]]}],"emphPre":["R1","R2","R3","I1","I2","I3"]},{"text":"分母の最小公倍数 12 を掛けて、分母の無い比にします。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 : I_2 : I_3 = 4 : 6 : 3"]]}],"emphPre":["I1","I2","I3"]},{"text":"抵抗の比 $3 : 2 : 4$ を逆に並べた $4 : 2 : 3$ とは違います。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","I1","I2","I3"]},{"text":"合計 $4 + 6 + 3 = 13$ のうち、$I_1$ は 4 の分です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I","I1"],"eq":[{"cont":false,"items":[["I_1 = 26 \\times \\dfrac{4}{13} = 8\\,\\mathrm{A}"]]}],"move":"i1val","emphPre":["I","I1"]},{"text":"同じように、$I_2$ は 6 の分、$I_3$ は 3 の分です。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I","I2","I3"],"eq":[{"cont":false,"items":[["I_2 = 26 \\times \\dfrac{6}{13} = 12\\,\\mathrm{A}","I_3 = 26 \\times \\dfrac{3}{13} = 6\\,\\mathrm{A}"]]}],"move":"i23val","ans":true,"emphPre":["I","I2","I3"]},{"text":"抵抗と電流を掛けると、3つとも同じ値になります。並列の電圧が同じことと合っています。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","I1","I2","I3"],"eq":[{"cont":false,"items":[["R_1 I_1 = 6 \\times 8 = 48","R_2 I_2 = 4 \\times 12 = 48","R_3 I_3 = 8 \\times 6 = 48"]]}],"emphPre":["R1","R2","R3","I1","I2","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"zhi":["u4s4L","u4s4b3l","u4s4w1l","u4s4w2l","u4s4w3l","u4s4j1","zbhi"],"zlo":["u4s4Rw","u4s4b3r","u4s4w1r","u4s4w2r","u4s4w3r","u4s4j2","zblo"],"wire":["u4s4L","u4s4b3l","u4s4w1l","u4s4w2l","u4s4w3l","u4s4j1","u4s4Rw","u4s4b3r","u4s4w1r","u4s4w2r","u4s4w3r","u4s4j2"]},"moves":{"vals":{"to":{"r1v":1,"r2v":1,"r3v":1,"iv":1},"dur":0.6},"i1val":{"to":{"i1v":1},"dur":0.4},"i23val":{"to":{"i2v":1,"i3v":1},"dur":0.4}},"route":["電圧は同じ","逆数の比","数字で見る"]}},{"id":"t4s4x","scene":"t4s4x","kind":"u4s4par","lab":{"pm":1,"r1":"{R}_1=10 Ω","r2":"{R}_2=20 Ω","r3":"{R}_3=30 Ω","i":"{I}=66 A","i1":["{I}_1","{I}_1=36 A"],"i2":"{I}_2","i3":"{I}_3","fl":[3.08,1.68,0.84,0.56]},"viewbox":"464 196 595 500","band":{"want":"$R_1$ に流れる電流 $I_1$","known":"$I = 66\\,\\mathrm{A},\\;\\; R_1 = 10\\,\\Omega,\\;\\; R_2 = 20\\,\\Omega,\\;\\; R_3 = 30\\,\\Omega$","ans":"$I_1 = 36\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i1v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_1$ に流れる電流 $I_1$ です。","at":{"強調":1.0},"after":[],"emph":["I1","R1"]},{"text":"①抵抗の比\n②逆数の比\n③電流を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1","R1"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$R_1$・$R_2$・$R_3$ は並列なので、全体の電流 $I$ は抵抗の逆比に分かれます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R1","R2","R3"]},{"text":"抵抗の比を簡単にします。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["10 : 20 : 30 = 1 : 2 : 3"]]}],"emphPre":["R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"逆比は、逆数の比です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2","R3","I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 : I_2 : I_3 = \\dfrac{1}{1} : \\dfrac{1}{2} : \\dfrac{1}{3}"]]}],"emphPre":["R1","R2","R3","I1","I2","I3"]},{"text":"分母の最小公倍数 6 を掛けて、分母の無い比にします。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I1","I2","I3"],"eq":[{"cont":false,"items":[["I_1 : I_2 : I_3 = 6 : 3 : 2"]]}],"emphPre":["I1","I2","I3"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"合計 $6 + 3 + 2 = 11$ のうち、$I_1$ は 6 の分です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["I","I1"],"eq":[{"cont":false,"items":[["I_1 = I \\times \\dfrac{6}{11}"],["I_1 = 66 \\times \\dfrac{6}{11} = 36\\,\\mathrm{A}"]]}],"move":"i1val","ans":true,"emphPre":["I","I1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"zhi":["u4s4L","u4s4b3l","u4s4w1l","u4s4w2l","u4s4w3l","u4s4j1","zbhi"],"zlo":["u4s4Rw","u4s4b3r","u4s4w1r","u4s4w2r","u4s4w3r","u4s4j2","zblo"],"wire":["u4s4L","u4s4b3l","u4s4w1l","u4s4w2l","u4s4w3l","u4s4j1","u4s4Rw","u4s4b3r","u4s4w1r","u4s4w2r","u4s4w3r","u4s4j2"]},"moves":{"i1val":{"to":{"i1v":1},"dur":0.4}},"route":["抵抗の比","逆数の比","電流を出す"]}},{"id":"t4s5e","scene":"t4s5e","kind":"u4s5e","lab":{"ps":["1","2s"],"fl":[1,1],"i":"{I}","r1":"{R}_1","r2":"{R}_2","i1":["{I}_1","{I}_1=0 A"],"i2":["{I}_2","{I}_2={I}"],"pm":1,"src":"{V}=24 V","v1":["{V}_1","{V}_1=24 V"],"v2":["{V}_2","{V}_2=0 V"],"s":{"r1":"{R}_1=8 Ω","r2":"{R}_2=0 Ω","i":null}},"viewbox":"464 152 595 560","band":{"want":"2点を抵抗を挟まずにつないだ時の電流と電圧","ans":"電流は $0\\,\\Omega$ の道に全部流れる　$0\\,\\Omega$ の所の電圧は $0\\,\\mathrm{V}$","full":"2点を抵抗を挟まずに線でつなぐことを短絡（ショート）という。電流は抵抗の無い線に全部流れ、並べた抵抗には流れない。$0\\,\\Omega$ の所にかかる電圧は $0\\,\\mathrm{V}$。"},"narr":{"start":{"co":1,"sh":0,"t":0,"i1v":0,"i2v":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①短絡とは\n②電流の流れ方\n③$0\\,\\Omega$ の所の電圧\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"点 a から点 b へ電流 $I$ が流れ、$R_1$ と $R_2$ の2つの道に分かれます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R1","R2"]},{"text":"$R_2$ を外して、その2点を抵抗を挟まずに線でつなぎます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R2","S"],"move":"short"},{"text":"このように、2点を抵抗を挟まずに線でつなぐことを短絡（ショート）といいます。","at":{"強調":1.0},"after":[],"emph":["S"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"抵抗の無い線は、$0\\,\\Omega$ の抵抗と考えます。分流の式で $I_1$ を出すと 0 になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I1","R1","S","I"],"eq":[{"cont":false,"items":[["I_1 = I \\times \\dfrac{0}{R_1 + 0} = 0"]]}],"emphPre":["I1","R1","S","I"]},{"text":"電流 $I$ は全部が短絡した線に流れ、$R_1$ には流れません。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["I","I1","I2","R1","S"],"move":"ival"}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"短絡した線の両端は、抵抗の無い線でつながっているので同じ電位です。$0\\,\\Omega$ の所にかかる電圧は $0\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["S","Z"]},{"text":"$R_1$ の両端も同じ電位なので、$R_1$ にかかる電圧も $0\\,\\mathrm{V}$ です。だから $R_1$ には電流が流れません。","at":{"強調":1.0},"after":[],"emph":["R1","Z","I1"]},{"text":"直列でも同じです。$V = 24\\,\\mathrm{V}$、$R_1 = 8\\,\\Omega$、$R_2 = 0\\,\\Omega$ のときを考えます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["src","R1","R2"],"move":"toser"},{"text":"$R_2$ の両端は同じ電位なので、$V_2 = 0\\,\\mathrm{V}$ です。分圧の式でも 0 になります。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R2","V2","ZS","src","R1"],"eq":[{"cont":false,"items":[["V_2 = 24 \\times \\dfrac{0}{8 + 0} = 0\\,\\mathrm{V}"]]}],"move":"v2val","emphPre":["R2","V2","ZS"]},{"text":"電源の電圧は全部が $R_1$ にかかり、$V_1 = 24\\,\\mathrm{V}$ です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["src","R1","V1"],"move":"v1val","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"S":["u4s5p2l","u4s5p2m","u4s5p2r"],"Z":["zbu4s5k","zbu4s5r","zbu4s5m"],"ZS":["zbu4s5sh","zbu4s5sl"]},"moves":{"short":{"to":{"sh":1},"dur":0.8},"ival":{"to":{"i1v":1,"i2v":1},"dur":0.4},"toser":{"to":{"t":1},"dur":1.0},"v2val":{"to":{"v2v":1},"dur":0.4},"v1val":{"to":{"v1v":1},"dur":0.4}},"route":["短絡とは","電流の流れ方","$0\\,\\Omega$ の所の電圧"]}},{"id":"t4s5x","scene":"t4s5x","kind":"u4s5par","lab":{"ps":["1","s"],"i":"{I}=25 A","r1":"{R}_1=10 Ω","i1":["{I}_1","{I}_1=0 A"],"i2":["{I}_2","{I}_2=25 A"]},"viewbox":"464 152 595 560","band":{"want":"$R_1$ に流れる電流 $I_1$","known":"$I = 25\\,\\mathrm{A},\\;\\; R_1 = 10\\,\\Omega$","ans":"$I_1 = 0\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_1$ に流れる電流 $I_1$ です。","at":{"強調":1.0},"after":[],"emph":["I1","R1"]},{"text":"①短絡を見つける\n②電流の流れ方\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1","R1"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"下の道は、2点を抵抗を挟まずに線でつないでいます。短絡です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["S","Z"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I = 25\\,\\mathrm{A}$ は全部が、抵抗の無い短絡した線に流れます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["I","I2","S"],"move":"i2val"},{"text":"$R_1$ には流れないので、$I_1 = 0\\,\\mathrm{A}$ です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["I1","R1"],"move":"i1val","ans":true}]}],"groups":{"R1":["r1","r1t0","r1t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"S":["u4s5p2l","u4s5p2m","u4s5p2r"],"Z":["zbu4s5k","zbu4s5r","zbu4s5m"]},"moves":{"i2val":{"to":{"i2v":1},"dur":0.4},"i1val":{"to":{"i1v":1},"dur":0.4}},"route":["短絡を見つける","電流の流れ方"]}},{"id":"t4s6e","scene":"t4s6e","kind":"u4s6par","lab":{"pm":1,"fl":[1,2],"r1":["{R}_1","{R}_1=6 Ω"],"r2":["{R}_2","{R}_2=3 Ω"],"i":["{I}","{I}=12 A"],"i1":["{I}_1","{I}_1=4 A"],"i2":["{I}_2","{I}_2=8 A"]},"viewbox":"464 152 595 560","band":{"want":"分かれた電流 $I_1$ から全体の電流 $I$","ans":"$I = I_1 \\times \\dfrac{R_1 + R_2}{R_2}$","full":"並列の2つの道の電流は抵抗の逆比に分かれる。全体の電流は $R_1 + R_2$ の分なので、片方の電流に比を掛けて全体の電流を出せる。"},"narr":{"start":{"co":1,"r1v":0,"r2v":0,"i1v":0,"iv":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①電流の比\n②全体の電流\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"並列の $R_1$ と $R_2$ に分かれた電流は、抵抗の逆比になります（分流）。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":1,"emph":["R1","R2","I1","I2"],"eq":[{"cont":false,"items":[["I_1 : I_2 = R_2 : R_1"]]}],"emphPre":["R1","R2","I1","I2"]},{"text":"全体の電流 $I$ は $I_1 + I_2$ なので、比で表すと $R_1 + R_2$ の分です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I","I1","I2","R1","R2"],"eq":[{"cont":false,"items":[["I_1 : I = R_2 : (R_1 + R_2)"]]}],"emphPre":["I","I1","I2","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I_1$ が分かっている時、$I$ は $I_1$ の $\\dfrac{R_1 + R_2}{R_2}$ 倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["I","I1","R1","R2"],"eq":[{"cont":false,"items":[["I = I_1 \\times \\dfrac{R_1 + R_2}{R_2}"]]}],"emphPre":["I","I1","R1","R2"]},{"text":"もう一方の $I_2$ は、$I_1$ の $\\dfrac{R_1}{R_2}$ 倍です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["I2","I1","R1","R2"],"eq":[{"cont":false,"items":[["I_2 = I_1 \\times \\dfrac{R_1}{R_2}"]]}],"emphPre":["I2","I1","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$R_1 = 6\\,\\Omega$、$R_2 = 3\\,\\Omega$、$I_1 = 4\\,\\mathrm{A}$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R1","R2","I1"],"move":"vals"},{"text":"$R_2 : R_1 = 3 : 6$ なので、電流の比は $I_1 : I_2 = 1 : 2$ です。","at":{"強調":1.0},"after":[],"emph":["I1","I2","R1","R2"]},{"text":"$I$ は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["I","I1","R1","R2"],"eq":[{"cont":false,"items":[["I = 4 \\times \\dfrac{6 + 3}{3} = 12\\,\\mathrm{A}"]]}],"move":"ival","emphPre":["I","I1","R1","R2"]},{"text":"$I_2$ は残りの $12 - 4 = 8\\,\\mathrm{A}$ です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["I2","I","I1"],"move":"i2val","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"]},"moves":{"vals":{"to":{"r1v":1,"r2v":1,"i1v":1},"dur":0.6},"ival":{"to":{"iv":1},"dur":0.4},"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["電流の比","全体の電流","数字で見る"]}},{"id":"t4s6x","scene":"t4s6x","kind":"u4s6par","lab":{"pm":1,"fl":[3,2],"r1":"{R}_1=20 Ω","r2":"{R}_2=30 Ω","i1":"{I}_1=6 A","i":["{I}","{I}=10 A"],"i2":"{I}_2"},"viewbox":"464 152 595 560","band":{"want":"全体の電流 $I$","known":"$R_1 = 20\\,\\Omega,\\;\\; R_2 = 30\\,\\Omega,\\;\\; I_1 = 6\\,\\mathrm{A}$","ans":"$I = 10\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、全体の電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I"]},{"text":"①電流の比\n②全体の電流\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"電流は抵抗の逆比に分かれます。$R_2 : R_1 = 30 : 20$ なので、$I_1 : I_2 = 3 : 2$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I1","I2","R1","R2"]},{"text":"全体の $I$ は $3 + 2 = 5$ の分なので、$I_1 : I = 3 : 5$ です。","at":{"強調":1.0},"after":[],"emph":["I","I1"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$I$ は $I_1$ の $\\dfrac{R_1 + R_2}{R_2}$ 倍です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","I1","R1","R2"],"eq":[{"cont":false,"items":[["I = I_1 \\times \\dfrac{R_1 + R_2}{R_2}"],["I = 6 \\times \\dfrac{20 + 30}{30}"],["I = 10\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["I","I1","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"]},"moves":{"ival":{"to":{"iv":1},"dur":0.4}},"route":["電流の比","全体の電流"]}}],"secs":[{"ex":{"text":"図のように、$R_1 = 15\\,\\Omega$ と $R_2 = 35\\,\\Omega$ を直列につなぎ、電源の電圧を $V = 100\\,\\mathrm{V}$ とした。$R_2$ にかかる電圧 $V_2$ は何 V か。","fig":{"kind":"u4s1ser","L":{"pm":1,"src":"{V}=100 V","r1":"{R}_1=15 Ω","r2":"{R}_2=35 Ω","v2":"{V}_2"},"P":{}},"ch":[{"t":"$30\\,\\mathrm{V}$","v":30,"why":"$R_1$ の割合で分けた（$R_1$ にかかる電圧を求めた）"},{"t":"$70\\,\\mathrm{V}$","v":70,"why":""},{"t":"$100\\,\\mathrm{V}$","v":100,"why":"電源の電圧が、そのまま $R_2$ にかかると考えた"},{"t":"$50\\,\\mathrm{V}$","v":50,"why":"電圧が2つの抵抗に等しく分かれると考えた"}],"ans":1}},{"ex":{"text":"図のように、$R_1 = 15\\,\\Omega$、$R_2 = 25\\,\\Omega$、$R_3 = 50\\,\\Omega$ を直列につなぎ、電源の電圧を $V = 72\\,\\mathrm{V}$ とした。$R_2$ にかかる電圧 $V_2$ は何 V か。","fig":{"kind":"u4s2ser","L":{"pm":1,"src":"{V}=72 V","r1":"{R}_1=15 Ω","r2":"{R}_2=25 Ω","r3":"{R}_3=50 Ω","v2":"{V}_2"},"P":{}},"ch":[{"t":"$24\\,\\mathrm{V}$","v":24,"why":"電圧が3つの抵抗に等しく分かれると考えた"},{"t":"$45\\,\\mathrm{V}$","v":45,"why":"$R_3$ を入れず、$R_1$ と $R_2$ の2つだけで分けた"},{"t":"$20\\,\\mathrm{V}$","v":20,"why":""},{"t":"$72\\,\\mathrm{V}$","v":72,"why":"電源の電圧が、そのまま $R_2$ にかかると考えた"}],"ans":2}},{"ex":{"text":"図のように、$R_1 = 6\\,\\Omega$ と $R_2 = 18\\,\\Omega$ を並列につなぎ、全体に $I = 20\\,\\mathrm{A}$ の電流が流れている。$R_2$ に流れる電流 $I_2$ は何 A か。","fig":{"kind":"u4s3par","L":{"pm":1,"i":"{I}=20 A","r1":"{R}_1=6 Ω","r2":"{R}_2=18 Ω","i2":"{I}_2"},"P":{}},"ch":[{"t":"$15\\,\\mathrm{A}$","v":15,"why":"分圧と取り違えて、自分の抵抗 $R_2$ を分子にした（$R_1$ に流れる電流を求めた）"},{"t":"$10\\,\\mathrm{A}$","v":10,"why":"電流が2つの抵抗に等しく分かれると考えた"},{"t":"$5\\,\\mathrm{A}$","v":5,"why":""},{"t":"$20\\,\\mathrm{A}$","v":20,"why":"全体の電流が、そのまま $R_2$ に流れると考えた"}],"ans":2}},{"ex":{"text":"図のように、$R_1 = 10\\,\\Omega$、$R_2 = 20\\,\\Omega$、$R_3 = 30\\,\\Omega$ の3つの抵抗を並列につなぎ、全体の電流を $I = 66\\,\\mathrm{A}$ とした。$R_1$ に流れる電流 $I_1$ は何 A か。","fig":{"kind":"u4s4par","L":{"pm":1,"r1":"{R}_1=10 Ω","r2":"{R}_2=20 Ω","r3":"{R}_3=30 Ω","i":"{I}=66 A","i1":"{I}_1","i2":"{I}_2","i3":"{I}_3"},"P":{}},"ch":[{"t":"$11\\,\\mathrm{A}$","v":11,"why":"抵抗の比 $1 : 2 : 3$ のまま分けた（抵抗が大きい道ほど、電流は小さい）"},{"t":"$36\\,\\mathrm{A}$","v":36,"why":""},{"t":"$33\\,\\mathrm{A}$","v":33,"why":"抵抗の比を逆に並べた $3 : 2 : 1$ で分けた（逆比は逆数の比）"},{"t":"$22\\,\\mathrm{A}$","v":22,"why":"電流が3つの道に等しく分かれると考えた"}],"ans":1}},{"ex":{"text":"図のように、点 a から点 b へ $I = 25\\,\\mathrm{A}$ の電流が流れている。$R_1 = 10\\,\\Omega$ の道と並べて、2点を抵抗を挟まずに線でつないだ。$R_1$ に流れる電流 $I_1$ は何 A か。","fig":{"kind":"u4s5par","L":{"ps":["1","s"],"i":"{I}=25 A","r1":"{R}_1=10 Ω","i1":"{I}_1","i2":"{I}_2"},"P":{}},"ch":[{"t":"$25\\,\\mathrm{A}$","v":25,"why":"抵抗のある $R_1$ の道に、全部が流れると考えた"},{"t":"$12.5\\,\\mathrm{A}$","v":12.5,"why":"2つの道に等しく分かれると考えた"},{"t":"$0\\,\\mathrm{A}$","v":0,"why":""},{"t":"$2.5\\,\\mathrm{A}$","v":2.5,"why":"電流 $I$ を $R_1$ で割った"}],"ans":2}},{"ex":{"text":"図のように、$R_1 = 20\\,\\Omega$ と $R_2 = 30\\,\\Omega$ を並列につないだ。$R_1$ に流れる電流は $I_1 = 6\\,\\mathrm{A}$ である。全体の電流 $I$ は何 A か。","fig":{"kind":"u4s6par","L":{"pm":1,"r1":"{R}_1=20 Ω","r2":"{R}_2=30 Ω","i1":"{I}_1=6 A","i":"{I}","i2":"{I}_2"},"P":{}},"ch":[{"t":"$15\\,\\mathrm{A}$","v":15,"why":"分母を自分の抵抗 $R_1$ にした（電流は抵抗の逆比に分かれる）"},{"t":"$4\\,\\mathrm{A}$","v":4,"why":"もう一方の電流 $I_2$ を求めた"},{"t":"$10\\,\\mathrm{A}$","v":10,"why":""},{"t":"$12\\,\\mathrm{A}$","v":12,"why":"2つの道に等しく分かれると考えた"}],"ans":2}}],"past":[]}};
});
