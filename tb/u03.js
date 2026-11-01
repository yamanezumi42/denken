/* 単元3「合成抵抗」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(3, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元3の図（自作）の、節の間で共通の部品。共通の部品（vdim・pv・swapText）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 節の図は u03/sN_scenes.js（u03.py が番号順につなぎ、KINDS・FLOWK を1つにまとめる）。このファイルは書き換えない（足したい部品は自分の節のファイルへ）。
// 名前 L[k]：文字（そのまま）か [前, 後]（p[k + "v"] で前→後へ入れ替える）。矢印の濃さ＝p[k + "o"]（無ければ 1）、
// 電圧の矢印の伸び＝p[k + "d"]（無ければ 1）。問題の画面の図は p を渡さない＝全部出た形。
// 電流は＋極（電池の長い線・x=752）から出て、下の線を左へ → 左の線を上へ → 上の線を右へ。抵抗は左の端が高い電位。
function lab3(d, id, x, y, spec, p, k, o, opt){
  if (spec === undefined || spec === null) return;
  if (Array.isArray(spec)) swapText(d, id, x, y, spec[0], spec[1], pv(p, k + "v"), o, opt);
  else swapText(d, id, x, y, spec, null, 0, o, opt);
}
// 抵抗（横）と名前
function resL3(d, id, x, y, L, k, p){
  d.res(id, x, y, "h");
  lab3(d, id + "t", x, y - 30, L[k], p, k, 1);
}
// 横の抵抗の電圧の矢印（上 or 下）。左の端が高い電位＝矢じりは左
function vArrow3(d, id, x, y, L, k, p, below){
  if (L[k] === undefined) return;
  var dd = pv(p, k + "d", 1), y0 = below ? y + 10 : y - 10, y1 = below ? y + 95 : y - 85, ya = below ? y + 85 : y - 75;
  var w = vdim(d, id + "d", x - 72.5, x + 72.5, y0, y1, ya, dd, {});
  lab3(d, id + "t", x, below ? ya + 25 : ya - 25, L[k], p, k, w);
}
// 左の縦の線（x=478）の電流（上向き）。名前は線の右
function iLeft3(d, yb, L, p, k){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), ym = yb - 80;
  d.arrow(k + "a", 478, ym + 20, 478, ym - 20, {o: o});
  lab3(d, k + "t", 494, ym, L[k], p, k, o, {anchor: "start"});
}
// 電源（下の線の真ん中）・＋と－・電源の電圧の名前
function srcPart3(d, yb, L, p){
  d.cell("c", 752, yb);
  if (L.pm) { d.text("pp", 722, yb - 26, "+"); d.text("pm", 802, yb - 26, "−"); }
  lab3(d, "e", 762, yb + 42, L.src, p, "src", 1);
}
// 電位を見る点：L["p" + k] = {v: 電位}（v が無ければ点と名前だけ）。点の濃さ＝p["p" + k + "o"]、電位の濃さ＝p["p" + k + "vo"]
// side "v"＝縦の線の上（名前は線の左・電位は線の右）、無し＝横の線の上（名前は線の下・電位は線の上）
function pt3(d, k, x, y, L, p, side){
  var P = L["p" + k]; if (!P) return;
  var o = pv(p, "p" + k + "o", 1), vo = o * pv(p, "p" + k + "vo", 1);
  d.dot("d" + k, x, y, {o: o});
  if (side === "v") {
    d.text("n" + k, x - 18, y, k, {o: o, anchor: "end"});
    if (P.v !== undefined) lab3(d, "p" + k + "t", x + 18, y, P.v, p, "p" + k, vo, {anchor: "start"});
  } else {
    d.text("n" + k, x, y + 30, k, {o: o});
    if (P.v !== undefined) lab3(d, "p" + k + "t", x, y - 32, P.v, p, "p" + k, vo);
  }
}
// ---- 3-1 の図：直列（pser）・直並列（psp）に、電位を見る点を足した物。形は単元2の ser・sp と同じ。
//   線の部品の id は「同じ電位の線」のまとまりで強調する（s1.py の zhi・zmid・zlo）。
// ---- 3-1 直列と電位：上の線に R1（x=640）・R2（x=880）。
// 点：a（上の線・R1 の前）・d（下の線・＋極の側）＝＋極と同じ電位／c（R1 と R2 の間）／b（上の線・R2 の後）・e（下の線・－極の側）＝－極と同じ電位
// 線のまとまり：＋極の側＝L・w1、R1 と R2 の間＝wm、－極の側＝w2・Rw
function tbPser(d, p, L){
  var yb = 560;
  d.wire("L", [[478, 360], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360]]);
  d.wire("w1", [[478, 360], [610, 360]]); d.wire("wm", [[670, 360], [850, 360]]); d.wire("w2", [[910, 360], [1045, 360]]);
  srcPart3(d, yb, L, p);
  resL3(d, "r1", 640, 360, L, "r1", p); resL3(d, "r2", 880, 360, L, "r2", p);
  vArrow3(d, "v1", 640, 360, L, "v1", p); vArrow3(d, "v2", 880, 360, L, "v2", p);
  iLeft3(d, yb, L, p, "i");
  pt3(d, "a", 520, 360, L, p); pt3(d, "c", 760, 360, L, p); pt3(d, "b", 1000, 360, L, p);
  pt3(d, "d", 620, yb, L, p); pt3(d, "e", 930, yb, L, p);
}
// ---- 3-1 直並列と電位：上の線に R1（x=580）、その先に並列（縦の線 x=680・1010、R2 y=280・R3 y=440）。
// 点：a（下の線・＋極の側）＝＋極と同じ電位／c（R3 の左の線）＝R1 の後ろと同じ電位／b（下の線・－極の側）
// 線のまとまり：＋極の側＝L、R1 の後ろ＝w1・bl・w2l・w3l、－極の側＝w2r・w3r・br・Rw
function tbPsp(d, p, L){
  var yb = 640, xl = 680, xr = 1010;
  d.wire("L", [[550, 360], [478, 360], [478, yb], [752, yb]]);
  d.wire("w1", [[610, 360], [xl, 360]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360], [xr, 360]]);
  d.wire("bl", [[xl, 280], [xl, 440]]); d.wire("br", [[xr, 280], [xr, 440]]);
  [[280, "2"], [440, "3"]].forEach(function(q){
    d.wire("w" + q[1] + "l", [[xl, q[0]], [760, q[0]]]); d.wire("w" + q[1] + "r", [[820, q[0]], [xr, q[0]]]);
    resL3(d, "r" + q[1], 790, q[0], L, "r" + q[1], p);
  });
  if (L.j) { d.dot("dj1", xl, 360); d.dot("dj2", xr, 360); }
  resL3(d, "r1", 580, 360, L, "r1", p);
  srcPart3(d, yb, L, p);
  vArrow3(d, "v1", 580, 360, L, "v1", p);
  pt3(d, "a", 600, yb, L, p); pt3(d, "c", 725, 440, L, p); pt3(d, "b", 930, yb, L, p);
}
// ---- 3-2 直列の合成抵抗（s2ser）：上の線に抵抗を2つか3つ直列に並べ、その下に「端から端まで＝合成抵抗 R」の寸法線。
// 抵抗の置き場所：3つ（L.r3 がある）＝x=600・760・920／2つ＝x=640・880。名前は抵抗の上（y=330）。
// 寸法線：R1 の左の端から最後の抵抗の右の端まで（y=430）、名前 L.R は寸法線の下（y=462）。伸び＝p.Rd（無ければ 1）、名前の入れ替え＝p.Rv。
// 説明のスライドで R3 を後から出す：p.r3o（0＝R3 の所はただの線・1＝R3）、寸法線の右の端＝p.Rx（0＝R2 の右の端・1＝R3 の右の端）。
// L.Rx があれば、寸法線が伸びるのに合わせて名前を L.R から L.Rx へ入れ替える（R3 をつないだ後の値）。
// 線の部品の id：s2w0（左の角〜R1）・s2w1（R1〜R2）・s2w2（R2〜R3 または R2〜右の角）・s2w3（R3〜右の角）・s2wx（R3 が無い時の R3 の所の線）、
// 左と下の線＝L・Rw（電池は下の線の真ん中）。電流は＋極から出て、下の線を左へ → 左の線を上へ → 上の線を右へ。
function tbS2ser(d, p, L){
  var yb = 560, y = 360, three = L.r3 !== undefined, xs = three ? [600, 760, 920] : [640, 880];
  var r3o = three ? pv(p, "r3o", 1) : 0;
  d.wire("L", [[478, y], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, y]]);
  d.wire("s2w0", [[478, y], [xs[0] - 30, y]]);
  d.wire("s2w1", [[xs[0] + 30, y], [xs[1] - 30, y]]);
  if (three) {
    d.wire("s2w2", [[xs[1] + 30, y], [xs[2] - 30, y]]);
    d.wire("s2w3", [[xs[2] + 30, y], [1045, y]]);
    if (r3o < 1) d.wire("s2wx", [[xs[2] - 30, y], [xs[2] + 30, y]], {o: 1 - r3o});
    d.res("r3", xs[2], y, "h", {o: r3o});
    lab3(d, "r3t", xs[2], y - 30, L.r3, p, "r3", r3o);
  } else d.wire("s2w2", [[xs[1] + 30, y], [1045, y]]);
  srcPart3(d, yb, L, p);
  resL3(d, "r1", xs[0], y, L, "r1", p); resL3(d, "r2", xs[1], y, L, "r2", p);
  if (L.R !== undefined) {
    var xl = xs[0] - 30, xr2 = xs[1] + 30, xr = three ? xr2 + (xs[2] + 30 - xr2) * pv(p, "Rx", 1) : xr2;
    var w = d.dim("Rd", xl, xr, 384, 440, 430, pv(p, "Rd", 1), {}), rx = three && L.Rx !== undefined ? pv(p, "Rx", 1) : 0;
    lab3(d, "Rt", (xl + xr) / 2, 464, L.R, p, "R", w * (1 - rx));
    if (rx > 0) d.text("Rut", (xl + xr) / 2, 464, L.Rx, {o: w * rx});     // R3 をつないだ後の合成抵抗の名前（L.Rx）
  }
}
// ---- 3-3 並列の合成抵抗（2つ）（s3par）：上の線から道が2本に分かれ（縦の線 x=600・960）、上の道に R1（y=280）・下の道に R2（y=440）、
// その下に「分かれる所から戻る所まで＝合成抵抗 R」の寸法線（y=502）と名前 L.R（y=536）。伸び＝p.Rd（無ければ 1）、名前の入れ替え＝p.Rv。
// 線の部品の id：s3bl・s3br（左右の縦の線）・s3w1l・s3w1r（上の道）・s3w2l・s3w2r（下の道）・s3j1・s3j2（分かれる点・戻る点）、
// 左と下の線＝L・Rw（電池は下の線の真ん中）。電流は＋極から出て、下の線を左へ → 左の線を上へ → 上の線を右へ → 2本に分かれる。
function tbS3par(d, p, L){
  var yb = 640, xl = 600, xr = 960, xc = 780;
  d.wire("L", [[xl, 360], [478, 360], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360], [xr, 360]]);
  d.wire("s3bl", [[xl, 280], [xl, 440]]); d.wire("s3br", [[xr, 280], [xr, 440]]);
  [[280, "1"], [440, "2"]].forEach(function(q){
    d.wire("s3w" + q[1] + "l", [[xl, q[0]], [xc - 30, q[0]]]); d.wire("s3w" + q[1] + "r", [[xc + 30, q[0]], [xr, q[0]]]);
    resL3(d, "r" + q[1], xc, q[0], L, "r" + q[1], p);
  });
  d.dot("s3j1", xl, 360); d.dot("s3j2", xr, 360);
  srcPart3(d, yb, L, p);
  if (L.R !== undefined) {
    var w = d.dim("Rd", xl, xr, 456, 512, 502, pv(p, "Rd", 1), {});
    lab3(d, "Rt", xc, 536, L.R, p, "R", w);
  }
}
// ---- 3-4 並列の合成抵抗（3つ以上）（s4par）：左右の縦の線（x=600・960）の間に、抵抗を2〜4本の道に1つずつ並べる（抵抗は x=780）。
// 道の数：L.r4 がある＝4本（y=230・330・430・530）／L.r3 がある＝3本（y=260・380・500）／無い＝2本（y=320・440）。
// 電源から来る線は y=380 で左の縦の線につながる（3本のときは真ん中の道とまっすぐつながる）。分かれる点・合流する点に点を打つ。
// その下に「左の縦の線から右の縦の線まで＝まとめて1つと見た合成抵抗 R」の寸法線（いちばん下の道の 22〜66 下・名前は 88 下）と名前 L.R。伸び＝p.s4d（無ければ 1）。
// 名前は2〜4通りに入れ替えられる（[前, 後, …]・入れ替え＝p[k + "v"]・p[k + "w"]・p[k + "x"] の順）。R の名前の濃さ＝p.Ro（無ければ 1）。
// 線の部品の id：L（電源の左〜左の縦の線）・Rw（電源の右〜右の縦の線）・s4bl・s4br（左右の縦の線）・s4wKl・s4wKr（K 本目の道の抵抗の左・右）・
//   点＝dj1・dj2（電源から来る線とのつなぎ目）・s4dKl・s4dKr（途中の道と縦の線のつなぎ目）。電流は＋極から出て、下の線を左へ → 左の線を上へ → 分かれて右へ。
function s4Ys(L){ return L.r4 !== undefined ? [230, 330, 430, 530] : L.r3 !== undefined ? [260, 380, 500] : [320, 440]; }
function s4Lab(d, id, x, y, spec, p, k, o){
  if (spec === undefined || spec === null) return;
  if (!Array.isArray(spec)) { d.text(id + "0", x, y, spec, {o: o}); return; }
  var ks = ["v", "w", "x"], t = spec.map(function(_, i){ return i ? pv(p, k + ks[i - 1]) : 0; });
  spec.forEach(function(s, i){
    var wgt = (i ? t[i] : 1) * (i + 1 < spec.length ? 1 - t[i + 1] : 1);
    d.text(id + i, x, y, s, {o: o * wgt});
  });
}
function tbS4par(d, p, L){
  var ys = s4Ys(L), xl = 600, xr = 960, cx = 780, ym = 380, yt = ys[0], ybt = ys[ys.length - 1], yb = ybt + 165;
  d.wire("L", [[xl, ym], [478, ym], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, ym], [xr, ym]]);
  d.wire("s4bl", [[xl, yt], [xl, ybt]]); d.wire("s4br", [[xr, yt], [xr, ybt]]);
  ys.forEach(function(y, i){
    var k = String(i + 1);
    d.wire("s4w" + k + "l", [[xl, y], [cx - 30, y]]); d.wire("s4w" + k + "r", [[cx + 30, y], [xr, y]]);
    d.res("r" + k, cx, y, "h");
    s4Lab(d, "r" + k + "t", cx, y - 30, L["r" + k], p, "r" + k, 1);
    if (i > 0 && i < ys.length - 1 && y !== ym) { d.dot("s4d" + k + "l", xl, y); d.dot("s4d" + k + "r", xr, y); }
  });
  d.dot("dj1", xl, ym); d.dot("dj2", xr, ym);
  srcPart3(d, yb, L, p);
  if (L.R !== undefined) {
    var w = d.dim("s4Rd", xl, xr, ybt + 22, ybt + 66, ybt + 58, pv(p, "s4d", 1), {});
    s4Lab(d, "s4Rt", cx, ybt + 88, L.R, p, "R", w * pv(p, "Ro", 1));
  }
}
// ---- 3-5 直並列の合成抵抗の図（自作）。上の線 y=360・下の線 y=650（電池は下の線の真ん中）・左の線 x=478・右の線 x=1045。
// 形 A（s5a）＝R1（x=580）のあとに R2（y=280）と R3（y=440）の並列（縦の線 x=680・1010、抵抗 x=845）。
//   p.am（0〜1）で並列の部分が1つの抵抗 R23（y=360・x=845）にまとまる（R2・R3 の道が消えて R23 が出る）。
// 形 B（s5b）＝R1（y=280・x=780）の道と、R2（x=700）・R3（x=860）を直列にした道（y=440）の並列（縦の線 x=600・960）。
//   p.bm（0〜1）で下の道の R2・R3 が1つの抵抗 R23（y=440・x=780）にまとまる。
// 説明（s5e）＝形 A と形 B を p.t（0＝A・1＝B）で入れ替える。
// 全体の合成抵抗 R の寸法線（y=550、名前は y=576）：A＝R1 の左の端 x=550 から右の縦の線 x=1010 まで／B＝縦の線 x=600 から 960 まで。
//   伸び＝p.aRd・p.bRd（無ければ 1）、名前の入れ替え＝p.aRv・p.bRv。名前 L.aR・L.bR が無ければ寸法線も描かない。
// 名前の鍵（L）：A＝a1・a2・a3・a23・aR、B＝b1・b2・b3・b23・bR。抵抗の id＝ra1 など（_r("a1")）、名前の id＝ra1t0・ra1t1。
// 見えない物も濃さ 0 で描く（描かないと、前の画面の部品が強調の枠の計算に残るため。確かめは濃さ 0.05 以下を見ない）。
var S5YB = 650, S5Y = 360;
function s5w(d, id, pts, o){ d.wire(id, pts, {o: o}); }
function s5res(d, k, x, y, L, p, o){            // 抵抗と名前（名前は抵抗の上 30）
  d.res("r" + k, x, y, "h", {o: o});
  lab3(d, "r" + k + "t", x, y - 30, L[k], p, k, o);
}
// 寸法線（横）。左の補助線は y1 から、右の補助線は y2 から、yt まで下へ伸びる。矢印は ya
function s5dim(d, id, x1, y1, x2, y2, yt, ya, v, o){
  var e1 = Math.min(1, v * 2), w = Math.max(0, v * 2 - 1), c = (x1 + x2) / 2, oo = e1 > 0 ? o : 0;
  s5w(d, id + ":e", [[x1, y1], [x1, y1 + (yt - y1) * e1]], oo);
  s5w(d, id + ":f", [[x2, y2], [x2, y2 + (yt - y2) * e1]], oo);
  var Lx = c - (c - x1) * w, Rx = c + (x2 - c) * w, h = 9, dd = "";
  if (w > 0.02) dd = "M" + n(Lx) + " " + ya + " H" + n(Rx) + " M" + n(Lx + h) + " " + (ya - 5) + " L" + n(Lx) + " " + ya + " L" + n(Lx + h) + " " + (ya + 5) +
      " M" + n(Rx - h) + " " + (ya - 5) + " L" + n(Rx) + " " + ya + " L" + n(Rx - h) + " " + (ya + 5);
  var a = d.el(id + ":a", "path", "ink"); a.setAttribute("d", dd); d.style(a, {o: o});
  return w;
}
function s5R(d, k, x1, y1, x2, y2, L, p, o){     // 全体の合成抵抗 R の寸法線と名前
  if (L[k] === undefined) return;
  var w = s5dim(d, k + "d", x1, y1, x2, y2, 560, 550, pv(p, k + "d", 1), o);
  lab3(d, k + "t", (x1 + x2) / 2, 576, L[k], p, k, o * w);
}
// 外の線（左の線・下の線・右の線）と電源。id の頭 q で図の種類を見分ける（check_iarrow の need）
function s5frame(d, q, L, p){
  d.wire(q + "L", [[478, S5Y], [478, S5YB], [752, S5YB]]);
  d.wire(q + "Rw", [[772, S5YB], [1045, S5YB], [1045, S5Y]]);
  srcPart3(d, S5YB, L, p);
}
// 形 A：R1 のあとに R2・R3 の並列
function s5drawA(d, p, L, O){
  var m = pv(p, "am", 0), xl = 680, xr = 1010, cx = 845, on = O * (1 - m), om = L.a23 !== undefined ? O * m : 0;
  s5w(d, "s5aw0", [[478, S5Y], [550, S5Y]], O);
  s5w(d, "s5aw1", [[610, S5Y], [xl, S5Y]], O);
  s5w(d, "s5aw4", [[xr, S5Y], [1045, S5Y]], O);
  s5res(d, "a1", 580, S5Y, L, p, O);
  s5w(d, "s5abl", [[xl, 280], [xl, 440]], on); s5w(d, "s5abr", [[xr, 280], [xr, 440]], on);
  [[280, "2"], [440, "3"]].forEach(function(q){
    s5w(d, "s5aw" + q[1] + "l", [[xl, q[0]], [cx - 30, q[0]]], on); s5w(d, "s5aw" + q[1] + "r", [[cx + 30, q[0]], [xr, q[0]]], on);
    s5res(d, "a" + q[1], cx, q[0], L, p, on);
  });
  d.dot("s5aj1", xl, S5Y, {o: on}); d.dot("s5aj2", xr, S5Y, {o: on});
  s5w(d, "s5awml", [[xl, S5Y], [cx - 30, S5Y]], om); s5w(d, "s5awmr", [[cx + 30, S5Y], [xr, S5Y]], om);
  s5res(d, "a23", cx, S5Y, L, p, om);
  var yr = 452 - (452 - 368) * (L.a23 !== undefined ? m : 0);
  s5R(d, "aR", 550, 380, xr, yr, L, p, O);
}
// 形 B：R1 の道と、R2・R3 を直列にした道の並列
function s5drawB(d, p, L, O){
  var m = pv(p, "bm", 0), xl = 600, xr = 960, on = O * (1 - m), om = L.b23 !== undefined ? O * m : 0;
  s5w(d, "s5bw0", [[478, S5Y], [xl, S5Y]], O);
  s5w(d, "s5bw4", [[xr, S5Y], [1045, S5Y]], O);
  s5w(d, "s5bbl", [[xl, 280], [xl, 440]], O); s5w(d, "s5bbr", [[xr, 280], [xr, 440]], O);
  d.dot("s5bj1", xl, S5Y, {o: O}); d.dot("s5bj2", xr, S5Y, {o: O});
  s5w(d, "s5bw1l", [[xl, 280], [750, 280]], O); s5w(d, "s5bw1r", [[810, 280], [xr, 280]], O);
  s5res(d, "b1", 780, 280, L, p, O);
  s5w(d, "s5bw2l", [[xl, 440], [670, 440]], on); s5w(d, "s5bwm", [[730, 440], [830, 440]], on); s5w(d, "s5bw3r", [[890, 440], [xr, 440]], on);
  s5res(d, "b2", 700, 440, L, p, on); s5res(d, "b3", 860, 440, L, p, on);
  s5w(d, "s5bwml", [[xl, 440], [750, 440]], om); s5w(d, "s5bwmr", [[810, 440], [xr, 440]], om);
  s5res(d, "b23", 780, 440, L, p, om);
  s5R(d, "bR", xl, 450, xr, 450, L, p, O);
}
function tbS5a(d, p, L){ s5frame(d, "s5a", L, p); s5drawA(d, p, L, 1); }
function tbS5b(d, p, L){ s5frame(d, "s5b", L, p); s5drawB(d, p, L, 1); }
function tbS5e(d, p, L){ var t = pv(p, "t", 0); s5frame(d, "s5e", L, p); s5drawA(d, p, L, 1 - t); s5drawB(d, p, L, t); }
// 電流の点の通り道：形 A（まとめる前＝2本の道・まとめた後＝1本の道）／形 B（上の道と下の道）
function s5flowA(p, L){
  var yb = S5YB, xl = 680, xr = 1010, f = L.fl || [2, 1, 1], head = [[752, yb], [478, yb], [478, S5Y], [xl, S5Y]], tail = [[xr, S5Y], [1045, S5Y], [1045, yb], [772, yb]];
  if (L.a23 !== undefined && pv(p, "am", 0) >= 0.5) return [{I: f[0], pts: head.concat(tail)}];
  return [{I: f[0], pts: head}, {I: f[1], pts: [[xl, S5Y], [xl, 280], [xr, 280], [xr, S5Y]]},
          {I: f[2], pts: [[xl, S5Y], [xl, 440], [xr, 440], [xr, S5Y]]}, {I: f[0], pts: tail}];
}
function s5flowB(p, L){
  var yb = S5YB, xl = 600, xr = 960, f = L.flb || [2, 1, 1];
  return [{I: f[0], pts: [[752, yb], [478, yb], [478, S5Y], [xl, S5Y]]}, {I: f[1], pts: [[xl, S5Y], [xl, 280], [xr, 280], [xr, S5Y]]},
          {I: f[2], pts: [[xl, S5Y], [xl, 440], [xr, 440], [xr, S5Y]]}, {I: f[0], pts: [[xr, S5Y], [1045, S5Y], [1045, yb], [772, yb]]}];
}
// ---- 3-6 合成抵抗から全体の電流：回路を合成抵抗 R 1つにまとめ、電源の電圧 V と R でオームの法則 I = V/R。
// 形は4つ：s6ser（直列2つ）／s6par（並列2つ）／s6par3（並列3つ）／s6sp（R1 のあとに R2・R3 の並列）。
// まとめる動き＝p.mg（0＝もとの回路・1＝上の線の真ん中 x=760 に合成抵抗 R が1つ）。もとの回路の抵抗と線は 1−mg で消え、R は mg で出る
//   （mg が 0 の時は R を描かない・1 の時はもとの回路を描かない）。R の名前 L.R は抵抗の上（y=330）、入れ替え＝p.Rv。
// 全体の電流 I は左の縦の線（x=478）の上・上向き（電源から出る電流。まとめる前も後も同じ線）。名前は線の右。
// 左と下の線の id は形ごとに変える（s6L＋形・s6R＋形＝電流の矢印の確かめで形を見分ける）。電池は下の線の真ん中。
// 電流は＋極（x=752）から出て、下の線を左へ → 左の線を上へ → 上の線を右へ → 右の線を下へ。
function s6frame(d, p, L, sh, yb){
  var mg = pv(p, "mg", 0);
  d.wire("s6L" + sh, [[478, 360], [478, yb], [752, yb]]);
  d.wire("s6R" + sh, [[772, yb], [1045, yb], [1045, 360]]);
  srcPart3(d, yb, L, p);
  iLeft3(d, yb, L, p, "i");
  if (mg > 0) {
    d.wire("s6m0", [[478, 360], [730, 360]], {o: mg}); d.wire("s6m1", [[790, 360], [1045, 360]], {o: mg});
    d.res("s6r", 760, 360, "h", {o: mg});
    lab3(d, "s6rt", 760, 330, L.R, p, "R", mg);
  }
  return 1 - mg;
}
// 抵抗（横）と名前を、濃さ o で
function s6res(d, id, x, y, L, k, p, o){
  d.res(id, x, y, "h", {o: o});
  lab3(d, id + "t", x, y - 30, L[k], p, k, o);
}
// 並列の部分：左右の縦の線 xl・xr、枝の y（ys）、枝の抵抗の x（xm）、抵抗の名前 ks。分かれる点・合流する点（y=360）
function s6pars(d, p, L, xl, xr, ys, xm, ks, o){
  d.wire("s6bl", [[xl, ys[0]], [xl, ys[ys.length - 1]]], {o: o}); d.wire("s6br", [[xr, ys[0]], [xr, ys[ys.length - 1]]], {o: o});
  ys.forEach(function(y, i){
    var k = ks[i];
    d.wire("s6w" + k + "l", [[xl, y], [xm - 30, y]], {o: o}); d.wire("s6w" + k + "r", [[xm + 30, y], [xr, y]], {o: o});
    s6res(d, "r" + k, xm, y, L, "r" + k, p, o);
  });
  d.dot("s6j1", xl, 360, {o: o}); d.dot("s6j2", xr, 360, {o: o});
}
// ---- 直列：上の線に R1（x=640）・R2（x=880）
function tbS6ser(d, p, L){
  var o = s6frame(d, p, L, "ser", 560);
  if (o <= 0) return;
  d.wire("s6a0", [[478, 360], [610, 360]], {o: o}); d.wire("s6a1", [[670, 360], [850, 360]], {o: o}); d.wire("s6a2", [[910, 360], [1045, 360]], {o: o});
  s6res(d, "r1", 640, 360, L, "r1", p, o); s6res(d, "r2", 880, 360, L, "r2", p, o);
}
// ---- 並列（2つ）：縦の線 x=600・960、上の道 y=280（R1）・下の道 y=440（R2）、抵抗 x=780
function tbS6par(d, p, L){
  var o = s6frame(d, p, L, "par", 640);
  if (o <= 0) return;
  d.wire("s6a0", [[478, 360], [600, 360]], {o: o}); d.wire("s6a2", [[960, 360], [1045, 360]], {o: o});
  s6pars(d, p, L, 600, 960, [280, 440], 780, ["1", "2"], o);
}
// ---- 並列（3つ）：縦の線 x=600・960、道 y=260（R1）・360（R2）・460（R3）、抵抗 x=780
function tbS6par3(d, p, L){
  var o = s6frame(d, p, L, "par3", 640);
  if (o <= 0) return;
  d.wire("s6a0", [[478, 360], [600, 360]], {o: o}); d.wire("s6a2", [[960, 360], [1045, 360]], {o: o});
  s6pars(d, p, L, 600, 960, [260, 360, 460], 780, ["1", "2", "3"], o);
}
// ---- 直並列：上の線に R1（x=580）、その先に R2（y=280）・R3（y=440）の並列（縦の線 x=680・1010、抵抗 x=845）
function tbS6sp(d, p, L){
  var o = s6frame(d, p, L, "sp", 640);
  if (o <= 0) return;
  d.wire("s6a0", [[478, 360], [550, 360]], {o: o}); d.wire("s6a1", [[610, 360], [680, 360]], {o: o}); d.wire("s6a2", [[1010, 360], [1045, 360]], {o: o});
  s6res(d, "r1", 580, 360, L, "r1", p, o);
  s6pars(d, p, L, 680, 1010, [280, 440], 845, ["2", "3"], o);
}
// 電流の点の通り道：まとめた後（mg が 0.5 以上）は1本の道。L.fl＝枝の電流の比（並列の道の順）
function s6flow(p, L, yb, xl, xr, ys){
  var o = pv(p, "co");
  if (pv(p, "mg", 0) >= 0.5 || !ys) return {o: o, base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  var f = L.fl || ys.map(function(){ return 1; }), tot = f.reduce(function(a, b){ return a + b; }, 0), paths = [];
  paths.push({I: tot, pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]});
  ys.forEach(function(y, i){ paths.push({I: f[i], pts: y === 360 ? [[xl, 360], [xr, 360]] : [[xl, 360], [xl, y], [xr, y], [xr, 360]]}); });
  paths.push({I: tot, pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]});
  return {o: o, base: 100 * tot, paths: paths};
}
// ---- 単元3の終わりの過去問1：平成21年 問6（k1h21・図は試験センターの図を描き直した物）。上＝図1（R1・R2 の直列）・下＝図2（R1・R2 の並列）。
// どちらも電源の電圧は 30 V。電池は下の線の真ん中（長い線＝＋極 x=752）、電流の矢印は左の縦の線（x=478）の上・上向き（iLeft3）。
// 図1：上の線 y=220（R1 x=640・R2 x=880）・下の線 y=340。図2：分かれる所 y=520（縦の線 x=600・960）・上の道 y=470（R1）・下の道 y=570（R2）・下の線 y=650。
// 2つの回路の部品の id は k1・k2 で始める（電源の部品も別）。名前 L：r1・r2（両方の図で同じ）・src（両方の図で同じ）・k1i・k2i（電流）。
function k1Cell(d, id, yb, L, p){
  d.cell(id + "c", 752, yb);
  if (L.pm) { d.text(id + "pp", 722, yb - 26, "+"); d.text(id + "pm", 802, yb - 26, "−"); }
  lab3(d, id + "e", 762, yb + 42, L.src, p, "src", 1);
}
function tbK1h21(d, p, L){
  var t1 = 220, b1 = 340, jm = 520, b2 = 650;
  // 図1：直列
  d.text("k1n", 478, 185, "図1", {anchor: "start"});
  d.wire("k1L", [[752, b1], [478, b1], [478, t1], [610, t1]]);
  d.wire("k1T", [[670, t1], [850, t1]]);
  d.wire("k1R", [[910, t1], [1045, t1], [1045, b1], [772, b1]]);
  resL3(d, "k1r1", 640, t1, L, "r1", p); resL3(d, "k1r2", 880, t1, L, "r2", p);
  k1Cell(d, "k1", b1, L, p);
  iLeft3(d, b1, L, p, "k1i");
  // 図2：並列
  d.text("k2n", 478, 485, "図2", {anchor: "start"});
  d.wire("k2L", [[752, b2], [478, b2], [478, jm], [600, jm]]);
  d.wire("k2R", [[960, jm], [1045, jm], [1045, b2], [772, b2]]);
  d.wire("k2bl", [[600, 470], [600, 570]]); d.wire("k2br", [[960, 470], [960, 570]]);
  [[470, "1"], [570, "2"]].forEach(function(q){
    d.wire("k2w" + q[1] + "l", [[600, q[0]], [750, q[0]]]); d.wire("k2w" + q[1] + "r", [[810, q[0]], [960, q[0]]]);
    resL3(d, "k2r" + q[1], 780, q[0], L, "r" + q[1], p);
  });
  d.dot("k2j1", 600, jm); d.dot("k2j2", 960, jm);
  k1Cell(d, "k2", b2, L, p);
  iLeft3(d, b2, L, p, "k2i");
}
var KINDS = {pser: tbPser, psp: tbPsp, s2ser: tbS2ser, s3par: tbS3par, s4par: tbS4par, s5a: tbS5a, s5b: tbS5b, s5e: tbS5e, s6ser: tbS6ser, s6par: tbS6par, s6par3: tbS6par3, s6sp: tbS6sp, k1h21: tbK1h21};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  pser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  psp: function(p, L){              // L.fl＝[全体, 上の道, 下の道] の電流の比
    var yb = 640, f = L.fl || [2, 1, 1], xl = 680, xr = 1010;
    return {o: pv(p, "co"), base: 200, paths: [
      {I: f[0], pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[2], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: f[0], pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  s2ser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  s3par: function(p, L){            // L.fl＝[全体, 上の道, 下の道] の電流の比
    var yb = 640, f = L.fl || [2, 1, 1], xl = 600, xr = 960;
    return {o: pv(p, "co"), base: 200, paths: [
      {I: f[0], pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[2], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: f[0], pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  s4par: function(p, L){            // L.fl＝[全体, 1本目, 2本目, …] の電流の比（無ければ同じ）。L.fl2＝名前を3つ目に入れ替えた後（p.r1w）の比
    var ys = s4Ys(L), xl = 600, xr = 960, ym = 380, yb = ys[ys.length - 1] + 165;
    var f = (L.fl2 && pv(p, "r1w") > 0.5 ? L.fl2 : L.fl) || [ys.length].concat(ys.map(function(){ return 1; }));
    var paths = [{I: f[0], pts: [[752, yb], [478, yb], [478, ym], [xl, ym]]}];
    ys.forEach(function(y, i){
      paths.push({I: f[i + 1], pts: y === ym ? [[xl, ym], [xr, ym]] : [[xl, ym], [xl, y], [xr, y], [xr, ym]]});
    });
    paths.push({I: f[0], pts: [[xr, ym], [1045, ym], [1045, yb], [772, yb]]});
    return {o: pv(p, "co"), base: 200, paths: paths};
  },
  s5a: function(p, L){ return {o: pv(p, "co"), base: 200, paths: s5flowA(p, L)}; },
  s5b: function(p, L){ return {o: pv(p, "co"), base: 200, paths: s5flowB(p, L)}; },
  s5e: function(p, L){ return {o: pv(p, "co"), base: 200, paths: pv(p, "t", 0) < 0.5 ? s5flowA(p, L) : s5flowB(p, L)}; },
  s6ser: function(p, L){ return s6flow(p, L, 560); },
  s6par: function(p, L){ return s6flow(p, L, 640, 600, 960, [280, 440]); },
  s6par3: function(p, L){ return s6flow(p, L, 640, 600, 960, [260, 360, 460]); },
  s6sp: function(p, L){ return s6flow(p, L, 640, 680, 1010, [280, 440]); },
  k1h21: function(p, L){            // 図1は1本の道。図2は全体＝2・それぞれの道＝1（どちらが大きいかは問題では分からないので同じ間隔）
    var t1 = 220, b1 = 340, jm = 520, b2 = 650;
    return {o: pv(p, "co"), base: 200, paths: [
      {I: 1, pts: [[752, b1], [478, b1], [478, t1], [1045, t1], [1045, b1], [772, b1]]},
      {I: 2, pts: [[752, b2], [478, b2], [478, jm], [600, jm]]},
      {I: 1, pts: [[600, jm], [600, 470], [960, 470], [960, jm]]},
      {I: 1, pts: [[600, jm], [600, 570], [960, 570], [960, jm]]},
      {I: 2, pts: [[960, jm], [1045, jm], [1045, b2], [772, b2]]}]};
  }
};

// 単元3の練習問題の作り方の、節の間で共通の道具。共通の道具（rngOf・pick・choices・num・qv・qf・nice・distinct など）は tb_gen.js。
// 節の練習は u03/sN_gen.js（u03.py が番号順につなぎ、GEN を1つにまとめる）。このファイルは書き換えない（足したい道具は自分の節のファイルへ）。
function PSER(L){ return {kind: "pser", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2"}, L), P: {}}; }
function PSP(L){ return {kind: "psp", L: Object.assign({pm: 1, j: 1, r1: "{R}_1", r2: "{R}_2", r3: "{R}_3"}, L), P: {}}; }
// 言葉の選択肢。list の先頭が正しい物：[t, v, why]
function rule3(r, text, fig, list, ex, form){
  var c = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
  return {form: form, text: text, fig: fig, ch: c.ch, ans: c.ans, ex: ex, chk: {form: form, p: {}}};
}
// 数字の選択肢：値が小数3けたで割り切れて4つが重ならない物だけ（呼ぶ側で決め直す）
function okNums3(ok, w){ return nice(ok) && w.every(function(z){ return nice(z.x); }) && distinct([ok].concat(w.map(function(z){ return z.x; }))); }
var VS3 = [10, 12, 15, 20, 24, 30, 36, 40, 48, 50, 60, 80, 90, 100];
var PARTS3 = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 64, 70, 72, 75, 80, 90];
function part3(r, V){ return pick(r, PARTS3.filter(function(x){ return x < V; })); }   // V より小さい、きりのよい値（下がった分・途中の電位）
var BASE3 = "－極の側を基準の $0\\,\\mathrm{V}$ とすると、";
// 3-1 電位と電圧降下：抵抗の無い線でつながった点は同じ電位・抵抗で下がった電位の分が電圧降下。
// 形は「言葉の穴埋め」と「数字の計算（単元1のオームの法則・単元2の直列・直並列と組み合わせる）」。図は全問に付ける。
// まちがいの選択肢は、よくある取り違え（電圧降下と電位の取り違え・抵抗を通っても下がらない・上がると考えた・
// 下の線は 0 V と考えた・引く順が逆 など）。理由を1行付ける。分圧・分流（単元4）の式は使わない。
// 3-2 直列の合成抵抗：合成抵抗＝2つ以上の抵抗を1つに置き換えた抵抗・直列は全部足す（3つ以上でも）。図は全問に付ける（s2ser）。
// 形：def（合成抵抗とは）／law（直列の合成抵抗の式・2つか3つ）／sum2・sum3（足して合成抵抗）／rest・rest3（合成抵抗から残りの抵抗）。
// まちがいの選択肢は、よくある取り違え（掛けた・引いた・足し忘れた・片方だけ答えた・直列の電流の決まりと取り違えた など）。理由を1行付ける。
function S2SER(L){ return {kind: "s2ser", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2"}, L), P: {}}; }
var RS2 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 40, 45, 50, 60, 80];
function ohm2(x){ return "{R}" + x.k + "=" + qf(x.v, "O"); }
// 3-3 並列の合成抵抗（2つ）：抵抗が2つの並列の合成抵抗＝和分の積 R = R1R2 / (R1 + R2)（2つの時だけ使う）。図は全問に付ける（s3par）。
// 形：s3law（並列の合成抵抗の式）／s3part（和分の積の分母・分子）／s3two（この式が使える時）／s3calc（R1・R2 から R）。
// まちがいの選択肢は、よくある取り違え（直列と同じく足した・分母と分子が逆・積を和で割り忘れた・分母を差にした など）。理由を1行付ける。
// 3つ以上の並列の式（3-4）・直並列（3-5）・全体の電流（3-6）・分圧と分流（単元4）は使わない。
function S3PAR(L){ return {kind: "s3par", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2", R: "{R}"}, L), P: {}}; }
var S3RS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 48, 50, 60, 70, 72, 75, 80, 90, 100, 120, 150, 180, 200, 300];
// 和分の積が整数になる組だけ（答えがきれいに割り切れる物）
var S3PAIRS = (function(){
  var out = [];
  S3RS.forEach(function(a){ S3RS.forEach(function(b){ if ((a * b) % (a + b) === 0) out.push([a, b]); }); });
  return out;
})();
function s3ohm(k, v){ return "{R}" + k + "=" + qf(v, "O"); }
// 3-4 並列の合成抵抗（3つ以上）：それぞれの抵抗の逆数を足すと合成抵抗の逆数（1/R = 1/R1 + 1/R2 + 1/R3 …）・同じ値なら1つの値をつないだ数で割る・
// 並列の合成抵抗はつないだどの抵抗よりも小さい。図は全問に付ける（s4par）。
// 形：s4law（式）／s4small（どの抵抗よりも小さい）／s4calc3・s4calc4（3つ・4つから合成抵抗）／s4same（同じ値の並列）／
//     s4samex（同じ値の並列の合成抵抗から1つの値）／s4rest（合成抵抗と2つから残りの1つ）。
// 数字は、合成抵抗が整数になる組だけ（S4SETS3・S4SETS4 を先に全部数えておく）。まちがいの選択肢は、よくある取り違えから作り理由を1行付ける。
var RS4 = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120];
var S4CNT = ["", "", "2つ", "3つ", "4つ"];
function s4gcd(a, b){ while (b) { var t = a % b; a = b; b = t; } return a; }
function s4lcm(xs){ return xs.reduce(function(a, b){ return a / s4gcd(a, b) * b; }, 1); }
// 並列の合成抵抗（分数のまま計算）：{L: 分母をそろえた数, S: 分子の和, R: 合成抵抗}
function s4comb(xs){ var L = s4lcm(xs), S = xs.reduce(function(a, x){ return a + L / x; }, 0); return {L: L, S: S, R: L / S}; }
function s4sets(n){
  var out = [];
  (function go(i, a){
    if (a.length === n) { var P = s4comb(a); if (Number.isInteger(P.R)) out.push(a.slice()); return; }
    for (var j = i; j < RS4.length; j++) { if (a.indexOf(RS4[j]) < 0) { a.push(RS4[j]); go(j + 1, a); a.pop(); } }
  })(0, []);
  return out;
}
var S4SETS3 = s4sets(3), S4SETS4 = s4sets(4);
function S4PAR(n, L){
  var b = {pm: 1}; for (var k = 1; k <= n; k++) b["r" + k] = "{R}_" + k;
  return {kind: "s4par", L: Object.assign(b, L), P: {}};
}
function s4o(k, v){ return "{R}_" + k + "=" + qf(v, "O"); }
function s4q(k, v){ return "$R_" + k + " = " + qv(v, "O") + "$"; }
// まちがいの候補 [{x, why}] から、値が割り切れて正解と重ならない物を、並べた順に3つ取る（足りなければ null）
function s4pick3(ok, cands){
  var w = [];
  cands.forEach(function(c){
    if (w.length < 3 && c.x > 0 && nice(c.x) && distinct([ok].concat(w.map(function(z){ return z.x; }), [c.x]))) w.push(c);
  });
  return w.length === 3 ? w : null;
}
// 逆数を足す式（数字）：1/R = 1/a + 1/b + … = S/L
function s4sum(xs, P){
  return "$\\dfrac{1}{R} = " + xs.map(function(x){ return "\\dfrac{1}{" + fmt(x) + "}"; }).join(" + ") + " = \\dfrac{" + P.S + "}{" + P.L + "}$";
}
// 3-5 直並列の合成抵抗：並列の部分を先にまとめてから直列を足す／並列の道の中の直列は先に足してから和分の積（掛け算の側はカッコ）。
// 図は全問に付ける（形 A＝s5a：R1 のあとに R2・R3 の並列／形 B＝s5b：R1 の道と R2・R3 を直列にした道の並列）。
// 形：s5ord（まとめる順）／s5law（形 A の式）／s5law2（形 B の式）／s5sp（形 A の値）／s5ps（形 B の値）／s5rest（形 A で R と R2・R3 から R1）。
// 答えは割り切れる値だけ（正解は整数）。まちがいの選択肢は、ありがちな誤り（全部足した・並列を先にまとめなかった・足し忘れた・カッコを忘れた など）。
function S5A(L){ return {kind: "s5a", L: Object.assign({pm: 1, a1: "{R}_1", a2: "{R}_2", a3: "{R}_3"}, L), P: {}}; }
function S5B(L){ return {kind: "s5b", L: Object.assign({pm: 1, b1: "{R}_1", b2: "{R}_2", b3: "{R}_3"}, L), P: {}}; }
var RS5 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 30, 36, 40, 45, 48, 60];
function s5par(a, b){ return a * b / (a + b); }                 // 2つの並列（和分の積）
function s5int(x){ return Math.abs(x - Math.round(x)) < 1e-9; }
// まちがいの候補から、割り切れて正解やほかの候補と重ならない物を前から3つ（3つ取れなければ null＝数字を選び直す）
function s5wrong(ok, cands){
  var out = [];
  cands.forEach(function(c){
    if (out.length < 3 && c.x > 0 && nice(c.x) && distinct([ok].concat(out.map(function(z){ return z.x; }), [c.x]))) out.push(c);
  });
  return out.length === 3 ? out : null;
}
function s5o(k, v){ return "{R}_" + k + "=" + qf(v, "O"); }
function s5t(k, v){ return "$R_" + k + " = " + qv(v, "O") + "$"; }
// 3-6 合成抵抗から全体の電流：回路を合成抵抗 R 1つにまとめ、回路の全体でオームの法則 I = V/R（電源から出る電流）。
// 逆に、全体の電流から電源の電圧 V = RI・合成抵抗 R = V/I も。各抵抗の電流・電圧（分圧と分流＝単元4）は出さない。図は全問に付ける（s6ser・s6par・s6par3・s6sp）。
// 形：s6law（全体の電流の式）／s6ser・s6par・s6par3・s6sp（それぞれの回路の全体の電流）／s6v（全体の電流から電源の電圧）／
//     s6r（電源の電圧と全体の電流から合成抵抗）／s6r2（直列で、合成抵抗から残りの抵抗）。
// 答えはきりのよい値：合成抵抗が整数になる抵抗の組（S6P2・S6P3・S6SP）と、きりのよい電流（IS6）から電圧を作る。
// まちがいの選択肢は、よくある取り違え（直列と並列のまとめ方の取り違え・1つの抵抗だけで割った・足し忘れた・掛けた・割る順が逆 など）。理由を1行付ける。
var RS6 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 48, 60];
var IS6 = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
function s6par2(a, b){ return a * b / (a + b); }
function s6pos(w){ return w.every(function(z){ return z.x > 0; }); }
function s6r3(x){ return Math.round(x * 1000) / 1000; }            // 割り算の誤差（7.199999… など）を3けたに丸める
function s6int(x){ return Math.abs(x - Math.round(x)) < 1e-9; }
// 並列にすると合成抵抗が整数になる組（2つは違う値・3つは同じ値も入れる）
var S6P2 = [], S6P3 = [], S6SP = [];
RS6.forEach(function(a){ RS6.forEach(function(b){
  if (a !== b && s6int(s6par2(a, b))) S6P2.push([a, b]);
  RS6.forEach(function(c){ var R = a * b * c / (a * b + b * c + c * a); if (a >= b && b >= c && s6int(R)) S6P3.push([a, b, c]); });
}); });
S6P2.forEach(function(q){ RS6.forEach(function(a){ if (a <= 30) S6SP.push([a, q[0], q[1]]); }); });
function s6ohm(k, v){ return "{R}" + k + "=" + qf(v, "O"); }
// 回路の形ごとの図・合成抵抗・式（n＝ser/par/par3/sp、v＝抵抗の値 [R1, R2(, R3)]、show＝図に値を書くか）
function s6net(n, v, show){
  var L = {pm: 1, r1: show ? s6ohm("_1", v[0]) : "{R}_1", r2: show ? s6ohm("_2", v[1]) : "{R}_2"};
  if (v.length > 2) L.r3 = show ? s6ohm("_3", v[2]) : "{R}_3";
  var R, tex, sub;
  if (n === "ser") { R = v[0] + v[1]; tex = "R = R_1 + R_2"; sub = fmt(v[0]) + " + " + fmt(v[1]); }
  else if (n === "par") { R = s6par2(v[0], v[1]); tex = "R = \\dfrac{R_1 R_2}{R_1 + R_2}"; sub = "\\dfrac{" + fmt(v[0]) + " \\times " + fmt(v[1]) + "}{" + fmt(v[0]) + " + " + fmt(v[1]) + "}"; }
  else if (n === "par3") { R = v[0] * v[1] * v[2] / (v[0] * v[1] + v[1] * v[2] + v[2] * v[0]);
    tex = "\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}"; sub = null; }
  else { R = v[0] + s6par2(v[1], v[2]); tex = "R = R_1 + \\dfrac{R_2 R_3}{R_2 + R_3}"; sub = fmt(v[0]) + " + \\dfrac{" + fmt(v[1]) + " \\times " + fmt(v[2]) + "}{" + fmt(v[1]) + " + " + fmt(v[2]) + "}"; }
  var how = {ser: "直列なので足す", par: "並列なので和分の積", par3: "並列なので逆数の和", sp: "並列の部分を先にまとめて $R_1$ を足す"}[n];
  R = s6r3(R);
  var line = n === "par3" ? "$\\dfrac{1}{R} = \\dfrac{1}{" + fmt(v[0]) + "} + \\dfrac{1}{" + fmt(v[1]) + "} + \\dfrac{1}{" + fmt(v[2]) + "}$、$R = " + qv(R, "O") + "$"
    : "$" + tex + " = " + sub + " = " + qv(R, "O") + "$";
  return {kind: "s6" + n, L: L, R: s6r3(R), how: how, line: line};
}
function s6vals(r, n){
  return n === "ser" ? [pick(r, RS6), pick(r, RS6)] : n === "par" ? pick(r, S6P2).slice() : n === "par3" ? shuffled(r, pick(r, S6P3)) : pick(r, S6SP).slice();
}
function s6names(v){ return "$R_1 = " + qv(v[0], "O") + "$、$R_2 = " + qv(v[1], "O") + "$" + (v.length > 2 ? "、$R_3 = " + qv(v[2], "O") + "$" : ""); }
var S6WHAT = {ser: "直列につないだ", par: "並列につないだ", par3: "並列につないだ", sp: "つないだ"};
function s6fig(N, L){ return {kind: N.kind, L: Object.assign({}, N.L, L), P: {}}; }
var GEN = {
  // 3-1 電位と電圧降下
  1: function(r){
    var f = pick(r, ["same", "drop", "zone", "zone", "zone", "dv", "dv", "ohm", "sp", "sp"]);
    if (f === "same") return rule3(r, "図の回路で、点 a と点 d の間には抵抗が無い。点 a と点 d の電位の関係は □ である。",
      PSER({pa: {}, pd: {}}),
      [["2つの電位は等しい", "eq"], ["点 a の方が高い", "a", "抵抗が無ければ、電位は下がらない"],
       ["点 d の方が高い", "d", "抵抗の無い線の上では、電位は変わらない"], ["点 d は $0\\,\\mathrm{V}$", "0", "$0\\,\\mathrm{V}$ なのは－極の側の線（点 d は＋極の側）"]],
      ["抵抗の無い線でつながった点は、同じ電位", "点 a と点 d の電位は等しい"], "same");
    if (f === "drop") return rule3(r, "図の回路で、抵抗 $R_1$ の電圧降下とは □ である。",
      PSER({v1: "{V}_1", pa: {}, pc: {}}),
      [["$R_1$ を通って下がった電位の分", "drop"], ["$R_1$ を流れる電流", "cur", "電圧降下は電圧（単位 V）で、電流ではない"],
       ["点 c の電位", "pot", "下がった後の電位ではなく、下がった分"], ["電源の電圧", "src", "電源の電圧は、$R_1$ と $R_2$ の電圧降下の和"]],
      ["抵抗を通って下がった電位の分が、その抵抗の電圧降下", "$R_1$ の電圧降下は $V_1$"], "drop");
    var V, V1, w, ok, c, k, L;
    if (f === "zone") {               // V と V1 から、点 d（＋極の側）・c（R1 と R2 の間）・e（－極の側）の電位
      k = pick(r, ["d", "c", "e"]);
      for (;;) {
        V = pick(r, VS3); V1 = part3(r, V);
        ok = k === "d" ? V : k === "c" ? V - V1 : 0;
        w = k === "d" ? [{x: V - V1, why: "$R_1$ を通っていないのに、$V_1$ だけ下げた"}, {x: 0, why: "下の線なので $0\\,\\mathrm{V}$ と考えた（点 d は＋極の側の線）"},
                         {x: V1, why: "電圧降下 $V_1$ を電位と取り違えた"}]
          : k === "c" ? [{x: V1, why: "電圧降下 $V_1$ を、点 c の電位と取り違えた"}, {x: V, why: "$R_1$ を通っても電位が下がらないと考えた"},
                         {x: V + V1, why: "$R_1$ を通ると電位が上がると考えた"}]
          : [{x: V - V1, why: "$R_2$ を通っても電位が下がらないと考えた"}, {x: V, why: "下の線なので＋極と同じと考えた（点 e は－極の側の線）"},
             {x: V1, why: "電圧降下 $V_1$ を電位と取り違えた"}];
        if (okNums3(ok, w)) break;
      }
      c = num(r, null, "V", ok, w); L = {src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V")}; L["p" + k] = {};
      return {form: "zone", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ の電圧降下は $V_1 = " + qv(V1, "V") + "$ である。" + BASE3 + "点 " + k + " の電位は何 V か。",
              fig: PSER(L), ch: c.ch, ans: c.ans,
              ex: k === "d" ? ["点 d は、＋極と抵抗の無い線でつながっている", "点 d の電位は電源の電圧と同じ $" + qv(V, "V") + "$"]
                : k === "c" ? ["点 c は、$R_1$ を通って $V_1$ だけ下がった所", "$V - V_1 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(ok, "V") + "$"]
                : ["点 e は、－極と抵抗の無い線でつながっている", "点 e の電位は基準と同じ $" + qv(0, "V") + "$"],
              chk: {form: "zone", p: {V: V, V1: V1, pt: k}}};
    }
    if (f === "dv") {                 // 2つの点の電位から、抵抗の電圧降下
      k = r() < 0.5 ? 1 : 2;
      var Vc;
      for (;;) {
        V = pick(r, VS3); Vc = part3(r, V);
        ok = k === 1 ? V - Vc : Vc;
        w = k === 1 ? [{x: Vc, why: "点 c の電位を、下がった分と取り違えた"}, {x: V + Vc, why: "2つの電位を足した"}, {x: Vc - V, why: "引く順が逆（点 c から点 a を引いた）"}]
                    : [{x: V - Vc, why: "$R_1$ の電圧降下を答えた"}, {x: V, why: "電源の電圧と取り違えた"}, {x: -Vc, why: "引く順が逆（点 b から点 c を引いた）"}];
        if (okNums3(ok, w)) break;
      }
      c = num(r, null, "V", ok, w); L = {src: "{V}=" + qf(V, "V"), pa: {v: qf(V, "V")}, pc: {v: qf(Vc, "V")}, pb: {v: "0 V"}}; L["v" + k] = "{V}_" + k;
      return {form: "dv", text: "図の回路で、点 a の電位は $" + qv(V, "V") + "$、点 c の電位は $" + qv(Vc, "V") + "$、点 b の電位は $0\\,\\mathrm{V}$ である。$R_" + k + "$ の電圧降下 $V_" + k + "$ は何 V か。",
              fig: PSER(L), ch: c.ch, ans: c.ans,
              ex: k === 1 ? ["$V_1$ は、点 a から点 c までに下がった電位", "$V_1 = " + fmt(V) + " - " + fmt(Vc) + " = " + qv(ok, "V") + "$"]
                          : ["$V_2$ は、点 c から点 b までに下がった電位", "$V_2 = " + fmt(Vc) + " - 0 = " + qv(ok, "V") + "$"],
              chk: {form: "dv", p: {Va: V, Vc: Vc, k: k}}};
    }
    if (f === "ohm") {                // R1 と電流から電圧降下（オームの法則）→ 点 c の電位
      var R, I, D;
      for (;;) {
        R = pick(r, [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]); I = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]); D = R * I; V = pick(r, VS3); ok = V - D;
        w = [{x: D, why: "$R_1$ の電圧降下を、点 c の電位と取り違えた"}, {x: V + D, why: "$R_1$ を通ると電位が上がると考えた"}, {x: V - R / I, why: "掛けるところを割った"}];
        if (ok > 0 && V - R / I > 0 && okNums3(ok, w)) break;
      }
      c = num(r, null, "V", ok, w);
      return {form: "ohm", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1 = " + qv(R, "O") + "$、電流は $I = " + qv(I, "A") + "$ である。" + BASE3 + "点 c の電位は何 V か。",
              fig: PSER({src: "{V}=" + qf(V, "V"), r1: "{R}_1=" + qf(R, "O"), i: "{I}=" + qf(I, "A"), pc: {}}), ch: c.ch, ans: c.ans,
              ex: ["$R_1$ の電圧降下は $R_1 I = " + fmt(R) + " \\times " + fmt(I) + " = " + qv(D, "V") + "$", "点 c の電位は $" + fmt(V) + " - " + fmt(D) + " = " + qv(ok, "V") + "$"],
              chk: {form: "ohm", p: {V: V, R1: R, I: I}}};
    }
    for (;;) {                        // 直並列：並列の部分の左の線の点 c の電位
      V = pick(r, VS3); V1 = part3(r, V); ok = V - V1;
      w = [{x: V1, why: "電圧降下 $V_1$ を、点 c の電位と取り違えた"}, {x: V, why: "$R_1$ を通っても電位が下がらないと考えた"},
           {x: (V - V1) / 2, why: "点 c の電位が $R_2$ と $R_3$ に分かれると考えた"}];
      if (okNums3(ok, w)) break;
    }
    c = num(r, null, "V", ok, w);
    return {form: "sp", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ の電圧降下は $V_1 = " + qv(V1, "V") + "$ である。" + BASE3 + "点 c の電位は何 V か。",
            fig: PSP({src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), pa: {}, pc: {}}), ch: c.ch, ans: c.ans,
            ex: ["点 c は、$R_1$ の右の端と抵抗の無い線でつながっている", "点 c の電位は $V - V_1 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(ok, "V") + "$"],
            chk: {form: "sp", p: {V: V, V1: V1}}};
  },
  // 3-2 直列の合成抵抗
  2: function(r){
    var f = pick(r, ["def", "law", "law", "sum2", "sum2", "sum3", "sum3", "rest", "rest3"]);
    if (f === "def") return rule3(r, "合成抵抗とは □ である。", S2SER({R: "{R}"}),
      [["2つ以上の抵抗を、1つに置き換えた抵抗", "one"], ["つないだ中で、いちばん大きい抵抗", "max", "1つの抵抗の値ではなく、まとめて1つと見た値"],
       ["抵抗を流れる電流", "cur", "合成抵抗は抵抗（単位 Ω）で、電流ではない"], ["抵抗にかかる電圧", "volt", "合成抵抗は抵抗（単位 Ω）で、電圧ではない"]],
      ["2つ以上の抵抗を1つの抵抗に置き換えた物が、合成抵抗", "図の $R_1$ と $R_2$ をまとめた $R$"], "def");
    if (f === "law") {
      if (r() < 0.5) return Object.assign(rule3(r, "図のように、$R_1$ と $R_2$ を直列につないだ。合成抵抗 $R$ は □ である。", S2SER({R: "{R}"}),
        [["$R = R_1 + R_2$", "add"], ["$R = R_1 \\times R_2$", "mul", "足すところを掛けた"], ["$R = R_1 - R_2$", "sub", "足すところを引いた"],
         ["$R = R_1 = R_2$", "eq", "直列の電流の決まり $I = I_1 = I_2$ と取り違えた"]],
        ["直列の合成抵抗は、抵抗を足した値", "$R = R_1 + R_2$"], "law"), {chk: {form: "law", p: {n: 2}}});
      return Object.assign(rule3(r, "図のように、$R_1$・$R_2$・$R_3$ を直列につないだ。合成抵抗 $R$ は □ である。", S2SER({r3: "{R}_3", R: "{R}"}),
        [["$R = R_1 + R_2 + R_3$", "add3"], ["$R = R_1 + R_2$", "add2", "$R_3$ を足し忘れた（3つ以上でも全部足す）"],
         ["$R = R_1 \\times R_2 \\times R_3$", "mul3", "足すところを掛けた"], ["$R = R_3$", "last", "いちばん後ろの抵抗だけと考えた"]],
        ["直列の合成抵抗は、3つ以上でも全部足す", "$R = R_1 + R_2 + R_3$"], "law"), {chk: {form: "law", p: {n: 3}}});
    }
    var a, b, c, R, ok, w, ch;
    if (f === "sum2") {               // R1・R2 から R
      for (;;) {
        a = pick(r, RS2); b = pick(r, RS2); ok = a + b;
        w = [{x: a * b, why: "足すところを掛けた"}, {x: Math.abs(a - b), why: "足すところを引いた"}, {x: Math.max(a, b), why: "大きい方の抵抗だけを答えた"}];
        if (a !== b && okNums3(ok, w)) break;
      }
      ch = num(r, null, "O", ok, w);
      return {form: "sum2", text: "図のように、$R_1 = " + qv(a, "O") + "$ と $R_2 = " + qv(b, "O") + "$ を直列につないだ。合成抵抗 $R$ は何 Ω か。",
              fig: S2SER({r1: ohm2({k: "_1", v: a}), r2: ohm2({k: "_2", v: b}), R: "{R}"}), ch: ch.ch, ans: ch.ans,
              ex: ["直列の合成抵抗は、抵抗を足した値", "$R = R_1 + R_2 = " + fmt(a) + " + " + fmt(b) + " = " + qv(ok, "O") + "$"],
              chk: {form: "sum2", p: {R1: a, R2: b}}};
    }
    if (f === "sum3") {               // R1・R2・R3 から R
      for (;;) {
        a = pick(r, RS2); b = pick(r, RS2); c = pick(r, RS2); ok = a + b + c;
        w = [{x: a + b, why: "$R_3$ を足し忘れた（3つ以上でも全部足す）"}, {x: a * b * c, why: "足すところを掛けた"},
             {x: Math.max(a, b, c), why: "いちばん大きい抵抗だけを答えた"}];
        if (okNums3(ok, w)) break;
      }
      ch = num(r, null, "O", ok, w);
      return {form: "sum3", text: "図のように、$R_1 = " + qv(a, "O") + "$、$R_2 = " + qv(b, "O") + "$、$R_3 = " + qv(c, "O") + "$ を直列につないだ。合成抵抗 $R$ は何 Ω か。",
              fig: S2SER({r1: ohm2({k: "_1", v: a}), r2: ohm2({k: "_2", v: b}), r3: ohm2({k: "_3", v: c}), R: "{R}"}), ch: ch.ch, ans: ch.ans,
              ex: ["直列の合成抵抗は、3つ以上でも全部足す", "$R = " + fmt(a) + " + " + fmt(b) + " + " + fmt(c) + " = " + qv(ok, "O") + "$"],
              chk: {form: "sum3", p: {R1: a, R2: b, R3: c}}};
    }
    if (f === "rest") {               // R と R1 から R2（R = R1 + R2 なので R2 = R − R1）
      for (;;) {
        a = pick(r, RS2); b = pick(r, RS2); R = a + b; ok = b;
        w = [{x: R + a, why: "合成抵抗に $R_1$ をさらに足した"}, {x: a, why: "$R_1$ の値と取り違えた"}, {x: R / 2, why: "2つの抵抗が同じ値と考えた"}];
        if (okNums3(ok, w)) break;
      }
      ch = num(r, null, "O", ok, w);
      return {form: "rest", text: "図のように、$R_1 = " + qv(a, "O") + "$ と $R_2$ を直列につないだ。合成抵抗は $R = " + qv(R, "O") + "$ である。$R_2$ は何 Ω か。",
              fig: S2SER({r1: ohm2({k: "_1", v: a}), R: "{R}=" + qf(R, "O")}), ch: ch.ch, ans: ch.ans,
              ex: ["直列なので $R = R_1 + R_2$。$R_2$ は $R$ から $R_1$ を引いた値", "$R_2 = " + fmt(R) + " - " + fmt(a) + " = " + qv(ok, "O") + "$"],
              chk: {form: "rest", p: {R: R, R1: a}}};
    }
    for (;;) {                        // R・R1・R2 から R3
      a = pick(r, RS2); b = pick(r, RS2); c = pick(r, RS2); R = a + b + c; ok = c;
      w = [{x: R - a, why: "$R_2$ を引き忘れた"}, {x: R + a + b, why: "合成抵抗に $R_1$ と $R_2$ をさらに足した"}, {x: a + b, why: "$R_1 + R_2$ を答えた"}];
      if (okNums3(ok, w)) break;
    }
    ch = num(r, null, "O", ok, w);
    return {form: "rest3", text: "図のように、$R_1 = " + qv(a, "O") + "$、$R_2 = " + qv(b, "O") + "$、$R_3$ を直列につないだ。合成抵抗は $R = " + qv(R, "O") + "$ である。$R_3$ は何 Ω か。",
            fig: S2SER({r1: ohm2({k: "_1", v: a}), r2: ohm2({k: "_2", v: b}), r3: "{R}_3", R: "{R}=" + qf(R, "O")}), ch: ch.ch, ans: ch.ans,
            ex: ["直列なので $R = R_1 + R_2 + R_3$。$R_3$ は $R$ から $R_1$ と $R_2$ を引いた値", "$R_3 = " + fmt(R) + " - " + fmt(a) + " - " + fmt(b) + " = " + qv(ok, "O") + "$"],
            chk: {form: "rest3", p: {R: R, R1: a, R2: b}}};
  },
  // 3-3 並列の合成抵抗（2つ）
  3: function(r){
    var f = pick(r, ["s3law", "s3law", "s3part", "s3part", "s3two", "s3calc", "s3calc", "s3calc", "s3calc", "s3calc"]);
    if (f === "s3law") return rule3(r, "図のように、$R_1$ と $R_2$ を並列につないだ。合成抵抗 $R$ は □ である。", S3PAR({}),
      [["$R = \\dfrac{R_1 R_2}{R_1 + R_2}$", "wa"], ["$R = R_1 + R_2$", "add", "直列の合成抵抗の式と取り違えた（図は並列）"],
       ["$R = \\dfrac{R_1 + R_2}{R_1 R_2}$", "inv", "積と和が逆（積を和で割る）"], ["$R = R_1 R_2$", "mul", "積を和で割るのを忘れた"]],
      ["抵抗が2つの並列の合成抵抗は、和分の積", "$R = \\dfrac{R_1 R_2}{R_1 + R_2}$"], "s3law");
    if (f === "s3part") {
      if (r() < 0.5) return Object.assign(rule3(r, "抵抗 $R_1$ と $R_2$ の並列の合成抵抗を和分の積で求めるとき、式の分母は □ である。", S3PAR({}),
        [["$R_1$ と $R_2$ の和", "sum"], ["$R_1$ と $R_2$ の積", "prod", "積は和で割られる側（分母は和）"],
         ["$R_1$ と $R_2$ の差", "diff", "分母は差ではなく和"], ["$R_1$ だけ", "r1", "分母は $R_1$ と $R_2$ を足した値"]],
        ["和分の積＝積を和で割る。分母は和", "$R = \\dfrac{R_1 R_2}{R_1 + R_2}$ の分母は $R_1 + R_2$"], "s3part"), {chk: {form: "s3part", p: {q: "den"}}});
      return Object.assign(rule3(r, "抵抗 $R_1$ と $R_2$ の並列の合成抵抗を和分の積で求めるとき、□ を $R_1$ と $R_2$ の和で割る。", S3PAR({}),
        [["$R_1$ と $R_2$ の積", "prod"], ["$R_1$ と $R_2$ の和", "sum", "和で割るのは積（和は分母）"],
         ["$R_1$ と $R_2$ の差", "diff", "和で割るのは差ではなく積"], ["$R_1$ だけ", "r1", "和で割るのは $R_1$ と $R_2$ を掛けた値"]],
        ["和分の積＝積を和で割る", "$R = \\dfrac{R_1 R_2}{R_1 + R_2}$"], "s3part"), {chk: {form: "s3part", p: {q: "num"}}});
    }
    if (f === "s3two") return rule3(r, "合成抵抗の式 $R = \\dfrac{R_1 R_2}{R_1 + R_2}$（和分の積）が使えるのは □ である。", S3PAR({}),
      [["抵抗が2つの並列", "two"], ["抵抗が3つ以上の並列", "many", "和分の積が使えるのは、抵抗が2つの時だけ"],
       ["抵抗が2つの直列", "ser", "直列の合成抵抗は、抵抗を足した値"], ["どんなつなぎ方でも", "any", "和分の積が使えるのは、2つの並列だけ"]],
      ["和分の積は、抵抗が2つの並列の合成抵抗の式", "2つの時だけ使える"], "s3two");
    // s3calc：R1・R2 から R（和分の積）
    var a, b, ok, pool, w, ch, pr;
    for (;;) {
      pr = pick(r, S3PAIRS); a = pr[0]; b = pr[1]; ok = a * b / (a + b);
      pool = [{x: a + b, why: "並列なのに、直列と同じく足した"}, {x: a * b, why: "積を和で割るのを忘れた"},
              {x: Math.max(a, b), why: "大きい方の抵抗だけを答えた"}];
      if (a !== b) pool.push({x: a * b / Math.abs(a - b), why: "分母を和でなく差にした"});
      w = shuffled(r, pool).slice(0, 3);
      if (ok >= 2 && okNums3(ok, w)) break;
    }
    ch = num(r, null, "O", ok, w);
    return {form: "s3calc", text: "図のように、$R_1 = " + qv(a, "O") + "$ と $R_2 = " + qv(b, "O") + "$ を並列につないだ。合成抵抗 $R$ は何 Ω か。",
            fig: S3PAR({r1: s3ohm("_1", a), r2: s3ohm("_2", b)}), ch: ch.ch, ans: ch.ans,
            ex: ["抵抗が2つの並列なので、和分の積", "$R = \\dfrac{" + fmt(a) + " \\times " + fmt(b) + "}{" + fmt(a) + " + " + fmt(b) + "} = \\dfrac{" + fmt(a * b) + "}{" + fmt(a + b) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "s3calc", p: {R1: a, R2: b}}};
  },
  // 3-4 並列の合成抵抗（3つ以上）
  4: function(r){
    var f = pick(r, ["s4law", "s4small", "s4calc3", "s4calc3", "s4calc3", "s4calc4", "s4same", "s4same", "s4samex", "s4rest"]);
    if (f === "s4law") return rule3(r, "図のように、$R_1$・$R_2$・$R_3$ を並列につないだ。合成抵抗 $R$ を求める式は □ である。", S4PAR(3, {R: "{R}"}),
      [["$\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}$", "rec"],
       ["$R = R_1 + R_2 + R_3$", "add", "直列の合成抵抗（全部足す）と取り違えた"],
       ["$R = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}$", "norec", "逆数の和は $R$ ではなく、$R$ の逆数 $\\dfrac{1}{R}$"],
       ["$R = \\dfrac{R_1 \\times R_2 \\times R_3}{R_1 + R_2 + R_3}$", "wabun", "和分の積は抵抗が2つのときの式。3つでは使えない形"]],
      ["並列の合成抵抗は、それぞれの抵抗の逆数を足すと $R$ の逆数", "$\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}$"], "s4law");
    if (f === "s4small") return rule3(r, "図のように、$R_1$・$R_2$・$R_3$ を並列につないだ。合成抵抗 $R$ は □。", S4PAR(3, {R: "{R}"}),
      [["つないだどの抵抗よりも小さい", "small"], ["つないだどの抵抗よりも大きい", "big", "直列の合成抵抗（全部足すので大きくなる）と取り違えた"],
       ["いちばん小さい抵抗と同じ値", "min", "並列は道が増えて流れやすくなるので、いちばん小さい抵抗よりもさらに小さくなる"],
       ["いちばん大きい抵抗と同じ値", "max", "並列は道が増えて流れやすくなるので、大きくはならない"]],
      ["並列にすると電流の通る道が増えて、流れやすくなる", "なので並列の合成抵抗は、つないだどの抵抗よりも小さい"], "s4small");
    var xs, P, ok, w, ch, n, v, R, k;
    if (f === "s4calc3" || f === "s4calc4") {      // 3つ・4つから合成抵抗
      n = f === "s4calc3" ? 3 : 4;
      for (;;) {
        xs = shuffled(r, pick(r, n === 3 ? S4SETS3 : S4SETS4)); P = s4comb(xs); ok = P.R;
        var sum = xs.reduce(function(a, x){ return a + x; }, 0), mn = Math.min.apply(null, xs), prod = xs.reduce(function(a, x){ return a * x; }, 1);
        w = s4pick3(ok, shuffled(r, [{x: sum, why: "全部足した（直列の合成抵抗と取り違えた）"},
                                    {x: mn, why: "いちばん小さい抵抗を答えた（並列の合成抵抗は、どの抵抗よりも小さい）"},
                                    {x: P.S / P.L, why: "足して出た $\\dfrac{1}{R}$ のまま答えた（最後に逆数にもどし忘れた）"},
                                    {x: prod / sum, why: "和分の積を3つ以上で使った（和分の積は2つのときの式）"},
                                    {x: sum / n, why: "抵抗の値を足して、つないだ数で割った"}]));
        if (w) break;
      }
      ch = num(r, null, "O", ok, w);
      var L = {R: "{R}"}, pp = {}, names = xs.map(function(x, i){ L["r" + (i + 1)] = s4o(i + 1, x); pp["R" + (i + 1)] = x; return s4q(i + 1, x); });
      return {form: f, text: "図のように、" + names.join("、") + " を並列につないだ。合成抵抗 $R$ は何 Ω か。",
              fig: S4PAR(n, L), ch: ch.ch, ans: ch.ans,
              ex: ["並列の合成抵抗は、それぞれの抵抗の逆数を足して、最後に逆数にもどす", s4sum(xs, P),
                   "$R = \\dfrac{" + P.L + "}{" + P.S + "} = " + qv(ok, "O") + "$"],
              chk: {form: f, p: pp}};
    }
    if (f === "s4same") {             // 同じ値 v を n つ並列 → v / n
      for (;;) {
        n = pick(r, [2, 3, 3, 4]); v = pick(r, RS4.filter(function(x){ return x % n === 0; })); ok = v / n;
        w = s4pick3(ok, [{x: v * n, why: "全部足した（直列の合成抵抗と取り違えた）"},
                         {x: n === 2 ? n / v : v / 2, why: n === 2 ? "$\\dfrac{1}{R}$ のまま答えた（最後に逆数にもどし忘れた）" : "半分にした（半分は2つのとき。" + S4CNT[n] + "なら " + n + " で割る）"},
                         {x: v, why: "1つの抵抗の値のまま答えた（並列の合成抵抗は、どの抵抗よりも小さい）"},
                         {x: n / v, why: "$\\dfrac{1}{R}$ のまま答えた（最後に逆数にもどし忘れた）"}]);
        if (w) break;
      }
      ch = num(r, null, "O", ok, w);
      var Ls = {R: "{R}"}; for (k = 1; k <= n; k++) Ls["r" + k] = s4o(k, v);
      return {form: "s4same", text: "図のように、" + "$" + qv(v, "O") + "$ の抵抗を" + S4CNT[n] + "並列につないだ。合成抵抗 $R$ は何 Ω か。",
              fig: S4PAR(n, Ls), ch: ch.ch, ans: ch.ans,
              ex: ["同じ値の並列の合成抵抗は、1つの値をつないだ数で割った値", "$R = \\dfrac{" + fmt(v) + "}{" + n + "} = " + qv(ok, "O") + "$"],
              chk: {form: "s4same", p: {v: v, n: n}}};
    }
    if (f === "s4samex") {            // 同じ値 n つの並列の合成抵抗 R → 1つの値 R × n
      for (;;) {
        n = pick(r, [2, 3, 3, 4]); R = pick(r, RS4.filter(function(x){ return x * n <= 120; })); ok = R * n;
        w = s4pick3(ok, [{x: R / n, why: "つないだ数で割った（割るのは、1つの値から合成抵抗を出すとき）"},
                         {x: R, why: "合成抵抗と同じ値と考えた（並列の合成抵抗は、どの抵抗よりも小さい）"},
                         {x: n === 2 ? R * n * n : R * 2, why: n === 2 ? "2 を掛けたあと、さらに 2 を掛けた（掛けるのは1つだけ）" : "2倍にした（2倍は2つのとき。" + S4CNT[n] + "なら " + n + " を掛ける）"},
                         {x: R + n, why: "つないだ数を足した"}]);
        if (w) break;
      }
      ch = num(r, null, "O", ok, w);
      var Lx = {R: "{R}=" + qf(R, "O")}, nm = [];
      for (k = 1; k <= n; k++) nm.push("$R_" + k + "$");
      return {form: "s4samex", text: "図のように、同じ値の抵抗 " + nm.join("・") + " を並列につないだら、合成抵抗は $R = " + qv(R, "O") + "$ になった。$R_1$ は何 Ω か。",
              fig: S4PAR(n, Lx), ch: ch.ch, ans: ch.ans,
              ex: ["同じ値の並列の合成抵抗は、1つの値をつないだ数で割った値。なので1つの値は、合成抵抗に、つないだ数を掛けた値",
                   "$R_1 = " + fmt(R) + " \\times " + n + " = " + qv(ok, "O") + "$"],
              chk: {form: "s4samex", p: {R: R, n: n}}};
    }
    for (;;) {                        // 合成抵抗 R と R1・R2 から R3：1/R3 = 1/R − 1/R1 − 1/R2
      xs = shuffled(r, pick(r, S4SETS3)); P = s4comb(xs); R = P.R; ok = xs[2];
      var a = xs[0], b = xs[1], L3 = s4lcm([R, a, b]), S3 = L3 / R - L3 / a - L3 / b;
      w = s4pick3(ok, shuffled(r, [{x: R * 3, why: "3つが同じ値と考えて、合成抵抗を3倍した"},
                                  {x: S3 / L3, why: "引いて出た $\\dfrac{1}{R_3}$ のまま答えた（最後に逆数にもどし忘れた）"},
                                  {x: a * b / (a + b), why: "$R_1$ と $R_2$ の和分の積を答えた"},
                                  {x: R + a + b, why: "全部足した（直列の合成抵抗と取り違えた）"}]));
      if (w) break;
    }
    ch = num(r, null, "O", ok, w);
    return {form: "s4rest", text: "図のように、" + s4q(1, a) + "、" + s4q(2, b) + "、$R_3$ を並列につないだら、合成抵抗は $R = " + qv(R, "O") + "$ になった。$R_3$ は何 Ω か。",
            fig: S4PAR(3, {r1: s4o(1, a), r2: s4o(2, b), R: "{R}=" + qf(R, "O")}), ch: ch.ch, ans: ch.ans,
            ex: ["$\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}$ なので、$\\dfrac{1}{R_3}$ は $\\dfrac{1}{R}$ から $\\dfrac{1}{R_1}$ と $\\dfrac{1}{R_2}$ を引いた値",
                 "$\\dfrac{1}{R_3} = \\dfrac{1}{" + fmt(R) + "} - \\dfrac{1}{" + fmt(a) + "} - \\dfrac{1}{" + fmt(b) + "} = \\dfrac{" + S3 + "}{" + L3 + "}$",
                 "$R_3 = \\dfrac{" + L3 + "}{" + S3 + "} = " + qv(ok, "O") + "$"],
            chk: {form: "s4rest", p: {R: R, R1: a, R2: b}}};
  },
  // 3-5 直並列の合成抵抗
  5: function(r){
    var f = pick(r, ["s5ord", "s5law", "s5law2", "s5sp", "s5sp", "s5ps", "s5ps", "s5rest"]);
    if (f === "s5ord") return rule3(r, "図のような直並列の回路の合成抵抗を求めるときは、□。", S5A({aR: "{R}"}),
      [["並列の部分を先に1つにまとめてから、直列を足す", "first"],
       ["全部の抵抗を足す", "all", "並列の部分は足さない。並列は和分の積でまとめる"],
       ["$R_1$ と $R_2$ を先に足してから、$R_3$ と和分の積にする", "left", "$R_1$ と $R_2$ は直列ではない。並列の部分を先にまとめる"],
       ["全部の抵抗を和分の積でまとめる", "prod", "和分の積は並列の2つだけ。直列の部分は足す"]],
      ["直並列の合成抵抗は、並列の部分を先に1つにまとめてから直列を足す", "$R = R_1 + \\dfrac{R_2 R_3}{R_2 + R_3}$"], "s5ord");
    if (f === "s5law") return rule3(r, "図の回路の合成抵抗 $R$ を表す式は □ である。", S5A({aR: "{R}"}),
      [["$R = R_1 + \\dfrac{R_2 R_3}{R_2 + R_3}$", "sp"],
       ["$R = R_1 + R_2 + R_3$", "all", "全部の抵抗を足した（並列の部分は和分の積）"],
       ["$R = \\dfrac{(R_1 + R_2) R_3}{R_1 + R_2 + R_3}$", "left", "並列の部分を先にまとめずに、$R_1$ と $R_2$ を先に足した"],
       ["$R = \\dfrac{R_2 R_3}{R_2 + R_3}$", "noR1", "並列の部分だけをまとめて、直列の $R_1$ を足し忘れた"]],
      ["並列の $R_2$ と $R_3$ を和分の積で先にまとめ、直列の $R_1$ を足す", "$R = R_1 + \\dfrac{R_2 R_3}{R_2 + R_3}$"], "s5law");
    if (f === "s5law2") return rule3(r, "図の回路の合成抵抗 $R$ を表す式は □ である。", S5B({bR: "{R}"}),
      [["$R = \\dfrac{R_1 \\times (R_2 + R_3)}{R_1 + R_2 + R_3}$", "ps"],
       ["$R = \\dfrac{R_1 \\times R_2 + R_3}{R_1 + R_2 + R_3}$", "nopar", "掛け算の側のカッコを付け忘れた（$R_1 \\times (R_2 + R_3)$）"],
       ["$R = R_1 + R_2 + R_3$", "all", "全部の抵抗を足した（$R_1$ と下の道は並列）"],
       ["$R = \\dfrac{R_1 R_2}{R_1 + R_2} + R_3$", "r1r2", "下の道の直列を先に足さずに、$R_1$ と $R_2$ を和分の積にした"]],
      ["下の道の $R_2$ と $R_3$ は直列なので先に足し、$R_1$ と和分の積", "$R = \\dfrac{R_1 \\times (R_2 + R_3)}{R_1 + R_2 + R_3}$"], "s5law2");
    var a, b, c, p, R, ok, w, ch;
    if (f === "s5sp") {               // 形 A：R1 + R2∥R3
      for (;;) {
        a = pick(r, RS5); b = pick(r, RS5); c = pick(r, RS5); p = s5par(b, c); ok = a + p;
        w = s5wrong(ok, [{x: a + b + c, why: "全部の抵抗を足した（並列の部分は和分の積）"},
                         {x: p, why: "並列の部分だけをまとめて、直列の $R_1$ を足し忘れた"},
                         {x: s5par(a + b, c), why: "並列の部分を先にまとめずに、$R_1$ と $R_2$ を足してから $R_3$ と和分の積にした"},
                         {x: a + b * c, why: "和分の積で、和で割り忘れた"}]);
        if (b !== c && s5int(p) && w) break;
      }
      ch = num(r, null, "O", ok, w);
      return {form: "s5sp", text: "図の回路で、" + s5t(1, a) + "、" + s5t(2, b) + "、" + s5t(3, c) + " である。全体の合成抵抗 $R$ は何 Ω か。",
              fig: S5A({a1: s5o(1, a), a2: s5o(2, b), a3: s5o(3, c), aR: "{R}"}), ch: ch.ch, ans: ch.ans,
              ex: ["並列の部分を先にまとめる　$R_{23} = \\dfrac{" + fmt(b) + " \\times " + fmt(c) + "}{" + fmt(b) + " + " + fmt(c) + "} = " + qv(p, "O") + "$",
                   "直列なので足す　$R = " + fmt(a) + " + " + fmt(p) + " = " + qv(ok, "O") + "$"],
              chk: {form: "s5sp", p: {R1: a, R2: b, R3: c}}};
    }
    if (f === "s5ps") {               // 形 B：R1∥(R2 + R3)
      for (;;) {
        a = pick(r, RS5); b = pick(r, RS5); c = pick(r, RS5); ok = s5par(a, b + c);
        w = s5wrong(ok, [{x: a + b + c, why: "全部の抵抗を足した（$R_1$ と下の道は並列）"},
                         {x: s5par(a, b) + c, why: "下の道の直列を先に足さずに、$R_1$ と $R_2$ を和分の積にした"},
                         {x: b + c, why: "下の道だけを足して、並列の $R_1$ を忘れた"},
                         {x: (a * b + c) / (a + b + c), why: "掛け算の側のカッコを付け忘れた（$R_1 \\times (R_2 + R_3)$）"}]);
        if (b !== c && s5int(ok) && w) break;
      }
      ch = num(r, null, "O", ok, w);
      return {form: "s5ps", text: "図の回路で、" + s5t(1, a) + "、" + s5t(2, b) + "、" + s5t(3, c) + " である。全体の合成抵抗 $R$ は何 Ω か。",
              fig: S5B({b1: s5o(1, a), b2: s5o(2, b), b3: s5o(3, c), bR: "{R}"}), ch: ch.ch, ans: ch.ans,
              ex: ["下の道の直列を先に足す　$R_{23} = " + fmt(b) + " + " + fmt(c) + " = " + qv(b + c, "O") + "$",
                   "$R_1$ と和分の積　$R = \\dfrac{" + fmt(a) + " \\times " + fmt(b + c) + "}{" + fmt(a) + " + " + fmt(b + c) + "} = " + qv(ok, "O") + "$"],
              chk: {form: "s5ps", p: {R1: a, R2: b, R3: c}}};
    }
    for (;;) {                        // 形 A：R と R2・R3 から R1（R = R1 + R23 なので R1 = R − R23）
      a = pick(r, RS5); b = pick(r, RS5); c = pick(r, RS5); p = s5par(b, c); R = a + p; ok = a;
      w = s5wrong(ok, [{x: R - b - c, why: "並列の部分を和分の積でまとめずに、$R_2$ と $R_3$ を引いた"},
                       {x: R + p, why: "引くところを足した"},
                       {x: p, why: "並列の部分 $R_{23}$ の値を答えた"},
                       {x: R - b, why: "並列の部分を $R_2$ だけと考えた"}]);
      if (b !== c && s5int(p) && w) break;
    }
    ch = num(r, null, "O", ok, w);
    return {form: "s5rest", text: "図の回路で、" + s5t(2, b) + "、" + s5t(3, c) + "、全体の合成抵抗は $R = " + qv(R, "O") + "$ である。$R_1$ は何 Ω か。",
            fig: S5A({a1: "{R}_1", a2: s5o(2, b), a3: s5o(3, c), aR: "{R}=" + qf(R, "O")}), ch: ch.ch, ans: ch.ans,
            ex: ["並列の部分をまとめる　$R_{23} = \\dfrac{" + fmt(b) + " \\times " + fmt(c) + "}{" + fmt(b) + " + " + fmt(c) + "} = " + qv(p, "O") + "$",
                 "$R = R_1 + R_{23}$ なので　$R_1 = " + fmt(R) + " - " + fmt(p) + " = " + qv(ok, "O") + "$"],
            chk: {form: "s5rest", p: {R: R, R2: b, R3: c}}};
  },
  // 3-6 合成抵抗から全体の電流
  6: function(r){
    var f = pick(r, ["s6law", "s6ser", "s6par", "s6par", "s6par3", "s6sp", "s6sp", "s6v", "s6v", "s6r", "s6r2"]);
    if (f === "s6law") {
      var n0 = pick(r, ["ser", "par", "sp"]), N0 = s6net(n0, n0 === "sp" ? [1, 1, 1] : [1, 1], false);
      return rule3(r, "図の回路の合成抵抗を $R$、電源の電圧を $V$ とする。電源から出る電流 $I$ は □ である。",
        s6fig(N0, {src: "{V}", i: "{I}"}),
        [["$I = \\dfrac{V}{R}$", "vr"], ["$I = VR$", "mul", "割るところを掛けた"], ["$I = \\dfrac{R}{V}$", "rv", "割る順が逆"],
         ["$I = \\dfrac{V}{R_1}$", "r1", "1つの抵抗だけで割った（回路の全体の抵抗は合成抵抗 $R$）"]],
        ["回路を合成抵抗 $R$ 1つにまとめ、回路の全体でオームの法則", "$I = \\dfrac{V}{R}$"], "s6law");
    }
    var n, v, N, I, V, ok, w, c, R;
    if (f === "s6ser" || f === "s6par" || f === "s6par3" || f === "s6sp") {    // 抵抗と電源の電圧から全体の電流
      n = f.slice(2);
      for (;;) {
        v = s6vals(r, n); N = s6net(n, v, true); R = N.R; I = pick(r, IS6); V = R * I;
        if (!s6int(V) || V > 240) continue;
        var sum = v.reduce(function(a, b){ return a + b; }, 0);
        w = n === "ser" ? [{x: V / s6par2(v[0], v[1]), why: "直列なのに、並列として和分の積でまとめた"}, {x: V / v[0], why: "$R_1$ だけで割った（$R_2$ を足し忘れた）"},
                           {x: V * R, why: "割るところを掛けた"}]
          : n === "par" ? [{x: V / sum, why: "並列なのに、直列として足した"}, {x: V / v[0], why: "$R_1$ だけで割った"}, {x: V * R, why: "割るところを掛けた"}]
          : n === "par3" ? [{x: V / sum, why: "並列なのに、直列として全部足した"}, {x: V * R, why: "$\\dfrac{1}{R}$ の値を、そのまま $R$ と取り違えた"},
                            {x: V / v[0], why: "$R_1$ だけで割った"}]
          : [{x: V / sum, why: "並列の部分も、直列として全部足した"}, {x: V / s6par2(v[1], v[2]), why: "$R_1$ を足し忘れた（並列の部分だけで割った）"},
             {x: V / v[0], why: "$R_1$ だけで割った"}];
        if (okNums3(I, w) && s6pos(w)) break;
      }
      w.forEach(function(z){ z.x = s6r3(z.x); });
      c = num(r, null, "A", I, w);
      return {form: f, text: "図のように、" + s6names(v) + " の抵抗を" + S6WHAT[n] + "。電源の電圧は $V = " + qv(V, "V") + "$ である。電源から出る電流 $I$ は何 A か。",
              fig: s6fig(N, {src: "{V}=" + qf(V, "V"), i: "{I}"}), ch: c.ch, ans: c.ans,
              ex: ["合成抵抗 $R$ を先に求める（" + N.how + "）", N.line, "回路の全体でオームの法則　$I = \\dfrac{V}{R} = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "} = " + qv(I, "A") + "$"],
              chk: {form: f, p: {n: n, v: v, V: V}}};
    }
    if (f === "s6v") {                // 抵抗と全体の電流から電源の電圧（V = RI）
      n = pick(r, ["ser", "par", "sp"]);
      for (;;) {
        v = s6vals(r, n); N = s6net(n, v, true); R = N.R; I = pick(r, IS6); ok = R * I;
        if (!s6int(ok) || ok > 240) continue;
        w = [{x: R / I, why: "掛けるところを割った"}, {x: v[0] * I, why: "$R_1$ だけに電流を掛けた"},
             n === "ser" ? {x: s6par2(v[0], v[1]) * I, why: "直列なのに、並列として和分の積でまとめた"}
                         : {x: v.reduce(function(a, b){ return a + b; }, 0) * I, why: n === "par" ? "並列なのに、直列として足した" : "並列の部分も、直列として全部足した"}];
        if (okNums3(ok, w) && s6pos(w)) break;
      }
      w.forEach(function(z){ z.x = s6r3(z.x); });
      c = num(r, null, "V", ok, w);
      return {form: "s6v", text: "図のように、" + s6names(v) + " の抵抗を" + S6WHAT[n] + "。電源から出る電流は $I = " + qv(I, "A") + "$ である。電源の電圧 $V$ は何 V か。",
              fig: s6fig(N, {src: "{V}", i: "{I}=" + qf(I, "A")}), ch: c.ch, ans: c.ans,
              ex: ["合成抵抗 $R$ を先に求める（" + N.how + "）", N.line, "回路の全体でオームの法則　$V = RI = " + fmt(R) + " \\times " + fmt(I) + " = " + qv(ok, "V") + "$"],
              chk: {form: "s6v", p: {n: n, v: v, I: I}}};
    }
    if (f === "s6r") {                // 電源の電圧と全体の電流から合成抵抗（R = V/I）。直並列の図・R1 の値も書く
      for (;;) {
        v = pick(r, S6SP).slice(); N = s6net("sp", v, false); R = N.R; I = pick(r, IS6); V = R * I;
        if (!s6int(V) || V > 240) continue;
        w = [{x: V * I, why: "割るところを掛けた"}, {x: I / V, why: "割る順が逆"}, {x: R - v[0], why: "$R_1$ を引いた（合成抵抗は $R_1$ も入れて回路の全体を1つにした物）"}];
        if (okNums3(R, w) && s6pos(w)) break;
      }
      w.forEach(function(z){ z.x = s6r3(z.x); });
      c = num(r, null, "O", R, w);
      return {form: "s6r", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、電源から出る電流は $I = " + qv(I, "A") + "$、$R_1 = " + qv(v[0], "O") + "$ である。"
                    + "回路の全体の合成抵抗 $R$ は何 Ω か。",
              fig: s6fig(N, {src: "{V}=" + qf(V, "V"), i: "{I}=" + qf(I, "A"), r1: s6ohm("_1", v[0])}), ch: c.ch, ans: c.ans,
              ex: ["回路の全体でオームの法則を、$R$ について解く", "$R = \\dfrac{V}{I} = \\dfrac{" + fmt(V) + "}{" + fmt(I) + "} = " + qv(R, "O") + "$"],
              chk: {form: "s6r", p: {V: V, I: I}}};
    }
    for (;;) {                        // 直列：電源の電圧と全体の電流から合成抵抗 → 残りの抵抗 R2（R2 = V/I − R1）
      v = [pick(r, RS6), pick(r, RS6)]; R = v[0] + v[1]; I = pick(r, IS6); V = R * I; ok = v[1];
      if (!s6int(V) || V > 240) continue;
      w = [{x: R, why: "合成抵抗 $R$ を答えた（$R_1$ を引いていない）"}, {x: R + v[0], why: "引くところを足した"}, {x: V * I - v[0], why: "割るところを掛けた"}];
      if (okNums3(ok, w) && s6pos(w)) break;
    }
    w.forEach(function(z){ z.x = s6r3(z.x); });
    c = num(r, null, "O", ok, w);
    return {form: "s6r2", text: "図のように、$R_1 = " + qv(v[0], "O") + "$ と $R_2$ を直列につないだ。電源の電圧は $V = " + qv(V, "V") + "$、電源から出る電流は $I = " + qv(I, "A") + "$ である。"
                  + "$R_2$ は何 Ω か。",
            fig: {kind: "s6ser", L: {pm: 1, r1: s6ohm("_1", v[0]), r2: "{R}_2", src: "{V}=" + qf(V, "V"), i: "{I}=" + qf(I, "A")}, P: {}}, ch: c.ch, ans: c.ans,
            ex: ["回路の全体でオームの法則から、合成抵抗　$R = \\dfrac{V}{I} = \\dfrac{" + fmt(V) + "}{" + fmt(I) + "} = " + qv(R, "O") + "$",
                 "直列なので $R = R_1 + R_2$。$R_2 = " + fmt(R) + " - " + fmt(v[0]) + " = " + qv(ok, "O") + "$"],
            chk: {form: "s6r2", p: {V: V, I: I, R1: v[0]}}};
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t3s1e","scene":"t3s1e","kind":"pser","lab":{"pm":1,"src":["{V}","{V}=30 V"],"r1":"{R}_1","r2":"{R}_2","v1":["{V}_1","{V}_1=18 V"],"v2":["{V}_2","{V}_2=12 V"],"pa":{"v":"30 V"},"pd":{"v":"30 V"},"pb":{"v":"0 V"},"pe":{"v":"0 V"},"pc":{"v":"12 V"}},"viewbox":"464 232 595 400","band":{"want":"電位と電圧降下","ans":"抵抗の無い線は同じ電位・電圧降下＝抵抗で下がった電位の分","full":"抵抗の無い線でつながった点は、どこも同じ電位（同電位）。抵抗を通ると電位が下がり、下がった分をその抵抗の電圧降下という。"},"narr":{"start":{"co":1,"srcv":0,"v1d":0,"v2d":0,"v1v":0,"v2v":0,"pao":0,"pdo":0,"pbo":0,"peo":0,"pco":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①抵抗の無い線\n②電圧降下\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電源の電圧を $V = 30\\,\\mathrm{V}$ とし、－極の側を基準の $0\\,\\mathrm{V}$ とします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["src"],"move":"srcv"},{"text":"＋極から $R_1$ までの線には、抵抗がありません。","at":{"強調":1.0},"after":[],"emph":["zhi","src","R1"]},{"text":"抵抗の無い線の上は、どこも同じ電位です。点 a も点 d も $30\\,\\mathrm{V}$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["zhi","pa","pd","src"],"move":"pad"},{"text":"－極の側の線も同じで、どこも $0\\,\\mathrm{V}$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["zlo","pb","pe"],"move":"pbe"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電流が $R_1$ を通ると、電位が下がります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","zhi","zmid"]},{"text":"抵抗で下がった電位の分を、電圧降下といいます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","V1"],"move":"v1arrow"},{"text":"$R_1$ の電圧降下は、$R_1$ にかかる電圧 $V_1$ と同じです。","at":{"強調":1.0},"after":[],"emph":["R1","V1"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ の電圧降下が $V_1 = 18\\,\\mathrm{V}$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R1","V1"],"move":"v1val"},{"text":"点 c の電位は、点 a の電位から $V_1$ だけ下がった値です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["pa","pc","V1","src","zmid"],"eq":[{"cont":false,"items":[["V - V_1"],["30 - 18 = 12\\,\\mathrm{V}"]]}],"move":"pc","emphPre":["pa","pc","V1","src","zmid"]},{"text":"$R_2$ を通ると、さらに $12\\,\\mathrm{V}$ 下がって $0\\,\\mathrm{V}$ になります。これが $R_2$ の電圧降下 $V_2$ です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["R2","V2","pc","pb","zlo"],"move":"v2all","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"],"pd":["dd","nd","pdt0","pdt1"],"pe":["de","ne","pet0","pet1"],"zhi":["L","w1"],"zmid":["wm"],"zlo":["w2","Rw"]},"moves":{"srcv":{"to":{"srcv":1},"dur":0.5},"pad":{"to":{"pao":1,"pdo":1},"dur":0.6},"pbe":{"to":{"pbo":1,"peo":1},"dur":0.6},"v1arrow":{"to":{"v1d":1},"dur":0.8},"v1val":{"to":{"v1v":1},"dur":0.4},"pc":{"to":{"pco":1},"dur":0.5},"v2all":{"to":{"v2d":1,"v2v":1},"dur":0.8}},"route":["抵抗の無い線","電圧降下","数字で見る"]}},{"id":"t3s1x","scene":"t3s1x","kind":"psp","lab":{"pm":1,"j":1,"src":"{V}=60 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","v1":"{V}_1=36 V","pa":{"v":"60 V"},"pc":{"v":"24 V"},"fl":[2,1,1]},"viewbox":"464 152 595 560","band":{"want":"点 c の電位","known":"$V = 60\\,\\mathrm{V},\\;\\; V_1 = 36\\,\\mathrm{V}$","ans":"点 c は $24\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pavo":0,"pcvo":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、点 c の電位です。","at":{"強調":1.0},"after":[],"emph":["pc"]},{"text":"分かっているのは、電源の電圧 $V$ と、$R_1$ の電圧降下 $V_1$ です。","at":{"強調":1.0},"after":[],"emph":["src","V1","R1"]},{"text":"①点 a の電位\n②点 c の電位\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["pa","pc"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"点 a は、＋極と抵抗の無い線でつながっているので、電源の電圧と同じ $60\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["pa","src","zhi"],"move":"pav"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"点 a から $R_1$ を通ると、電位は $V_1$ の分だけ下がります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["pa","R1","V1"]},{"text":"点 c と $R_1$ の右の端の間には、抵抗がありません。なので同じ電位です。","at":{"強調":1.0},"after":[],"emph":["pc","R1","zmid"]},{"text":"点 c の電位は、次の式で求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["pa","src","V1","pc","zmid"],"eq":[{"cont":false,"items":[["V - V_1"],["60 - 36 = 24\\,\\mathrm{V}"]]}],"move":"pcv","ans":true,"emphPre":["pa","src","V1","pc","zmid"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"j":["dj1","dj2"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"],"zhi":["L"],"zmid":["w1","bl","w2l","w3l"],"zlo":["w2r","w3r","br","Rw"]},"moves":{"pav":{"to":{"pavo":1},"dur":0.4},"pcv":{"to":{"pcvo":1},"dur":0.4}},"route":["点 a の電位","点 c の電位"]}},{"id":"t3s2e","scene":"t3s2e","kind":"s2ser","lab":{"pm":1,"r1":["{R}_1","{R}_1=4 Ω"],"r2":["{R}_2","{R}_2=6 Ω"],"r3":"{R}_3=5 Ω","R":["{R}","{R}=10 Ω"],"Rx":"{R}=15 Ω"},"viewbox":"464 232 595 400","band":{"want":"直列の合成抵抗","ans":"直列の合成抵抗は全部足す　$R = R_1 + R_2$","full":"2つ以上の抵抗を1つの抵抗に置き換えた物が合成抵抗。直列の合成抵抗は、抵抗を全部足した値（3つ以上でも全部足す）。"},"narr":{"start":{"co":1,"r3o":0,"Rx":0,"Rd":0,"Rv":0,"r1v":0,"r2v":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①合成抵抗とは\n②直列の合成抵抗\n③3つ以上のとき\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"2つ以上の抵抗を、1つの抵抗に置き換えた物を、合成抵抗といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2"]},{"text":"$R_1$ の左の端から $R_2$ の右の端までを、1つの抵抗と見ます。これが合成抵抗 $R$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R"],"move":"rd"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と $R_2$ は、分かれ道の無い1本の道に並んでいるので、直列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","R2","wire"]},{"text":"直列の合成抵抗は、抵抗を足した値です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R"],"eq":[{"cont":false,"items":[["R = R_1 + R_2"]]}],"emphPre":["R1","R2","R"]},{"text":"$R_1 = 4\\,\\Omega$、$R_2 = 6\\,\\Omega$ のときを考えます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2"],"move":"vals"},{"text":"合成抵抗は、次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R2","R"],"eq":[{"cont":false,"items":[["R = 4 + 6 = 10\\,\\Omega"]]}],"move":"rval","emphPre":["R1","R2","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"抵抗が3つ以上でも、直列なら全部足します。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R1","R2","R3"],"move":"r3in"},{"text":"$R_3 = 5\\,\\Omega$ もつなぐと、合成抵抗 $R$ は次のとおりです。","at":{"強調":1.0,"動き":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"emph":["R1","R2","R3","R"],"move":"rext","eq":[{"cont":false,"items":[["R = R_1 + R_2 + R_3"],["R = 4 + 6 + 5 = 15\\,\\Omega"]]}],"ans":true,"emphPre":["R1","R2","R3","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R":["Rd:e","Rd:f","Rd:a","Rt0","Rt1","Rut"],"wire":["L","Rw","s2w0","s2w1","s2w2","s2w3","s2wx"]},"moves":{"rd":{"to":{"Rd":1},"dur":0.8},"vals":{"to":{"r1v":1,"r2v":1},"dur":0.5},"rval":{"to":{"Rv":1},"dur":0.4},"r3in":{"to":{"r3o":1},"dur":0.6},"rext":{"to":{"Rx":1},"dur":0.6}},"route":["合成抵抗とは","直列の合成抵抗","3つ以上のとき"]}},{"id":"t3s2x","scene":"t3s2x","kind":"s2ser","lab":{"pm":1,"r1":"{R}_1=12 Ω","r2":"{R}_2=8 Ω","r3":"{R}_3=15 Ω","R":["{R}","{R}=35 Ω"]},"viewbox":"464 232 595 400","band":{"want":"合成抵抗 $R$","known":"$R_1 = 12\\,\\Omega,\\;\\; R_2 = 8\\,\\Omega,\\;\\; R_3 = 15\\,\\Omega$","ans":"$R = 35\\,\\Omega$"},"narr":{"start":{"co":1,"Rd":0,"Rv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、3つの抵抗をまとめた合成抵抗 $R$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R3","R"],"move":"rd"},{"text":"①直列か見る\n②全部足す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","R3","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$・$R_2$・$R_3$ は、分かれ道の無い1本の道に並んでいます。なので直列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3","wire"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"直列の合成抵抗は、全部の抵抗を足した値です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["R = R_1 + R_2 + R_3"],["R = 12 + 8 + 15 = 35\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["R1","R2","R3","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R":["Rd:e","Rd:f","Rd:a","Rt0","Rt1","Rut"],"wire":["L","Rw","s2w0","s2w1","s2w2","s2w3","s2wx"]},"moves":{"rd":{"to":{"Rd":1},"dur":0.8},"rval":{"to":{"Rv":1},"dur":0.4}},"route":["直列か見る","全部足す"]}},{"id":"t3s3e","scene":"t3s3e","kind":"s3par","lab":{"pm":1,"r1":["{R}_1","{R}_1=30 Ω"],"r2":["{R}_2","{R}_2=60 Ω"],"R":["{R}","{R}=20 Ω"],"fl":[3,2,1]},"viewbox":"464 152 595 560","band":{"want":"並列の合成抵抗（2つ）","ans":"2つの並列は和分の積　$R = R_1 R_2 / (R_1 + R_2)$","full":"抵抗が2つの並列の合成抵抗は、2つの積を2つの和で割った値（和分の積）。この式が使えるのは、抵抗が2つの時だけ。"},"narr":{"start":{"co":1,"Rd":0,"Rv":0,"r1v":0,"r2v":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①並列のつなぎ方\n②和分の積\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と $R_2$ は、道が2本に分かれて、また1本に戻る所に1つずつあります。これが並列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","par"]},{"text":"この2つを、1つの抵抗に置き換えた物が、並列の合成抵抗 $R$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R"],"move":"rd"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"抵抗が2つの並列では、合成抵抗は、2つの積を2つの和で割った値です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2","R"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"]]}],"emphPre":["R1","R2","R"]},{"text":"分母が和、その上が積なので、和分の積と覚えます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R"]},{"text":"この式が使えるのは、抵抗が2つの時だけです。","at":{"強調":1.0},"after":[],"emph":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1 = 30\\,\\Omega$、$R_2 = 60\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R1","R2"],"move":"vals"},{"text":"和分の積に数字を入れると、合成抵抗は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R1","R2","R"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"],["R = \\dfrac{30 \\times 60}{30 + 60}"],["R = \\dfrac{1800}{90} = 20\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["R1","R2","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R":["Rd:e","Rd:f","Rd:a","Rt0","Rt1"],"par":["s3bl","s3br","s3w1l","s3w1r","s3w2l","s3w2r","s3j1","s3j2"]},"moves":{"rd":{"to":{"Rd":1},"dur":0.8},"vals":{"to":{"r1v":1,"r2v":1},"dur":0.5},"rval":{"to":{"Rv":1},"dur":0.4}},"route":["並列のつなぎ方","和分の積","数字で見る"]}},{"id":"t3s3x","scene":"t3s3x","kind":"s3par","lab":{"pm":1,"r1":"{R}_1=15 Ω","r2":"{R}_2=10 Ω","R":["{R}","{R}=6 Ω"],"fl":[5,2,3]},"viewbox":"464 152 595 560","band":{"want":"合成抵抗 $R$","known":"$R_1 = 15\\,\\Omega,\\;\\; R_2 = 10\\,\\Omega$","ans":"$R = 6\\,\\Omega$"},"narr":{"start":{"co":1,"Rd":0,"Rv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、2つの抵抗をまとめた合成抵抗 $R$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R"],"move":"rd"},{"text":"①並列か見る\n②和分の積\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"道が2本に分かれて、$R_1$ と $R_2$ が1つずつあります。なので並列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","par"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"抵抗が2つの並列なので、和分の積で求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R1","R2","R"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"],["R = \\dfrac{15 \\times 10}{15 + 10}"],["R = \\dfrac{150}{25} = 6\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["R1","R2","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R":["Rd:e","Rd:f","Rd:a","Rt0","Rt1"],"par":["s3bl","s3br","s3w1l","s3w1r","s3w2l","s3w2r","s3j1","s3j2"]},"moves":{"rd":{"to":{"Rd":1},"dur":0.8},"rval":{"to":{"Rv":1},"dur":0.4}},"route":["並列か見る","和分の積"]}},{"id":"t3s4e","scene":"t3s4e","kind":"s4par","lab":{"pm":1,"r1":["{R}_1","{R}_1=12 Ω","{R}_1=9 Ω"],"r2":["{R}_2","{R}_2=6 Ω","{R}_2=9 Ω"],"r3":["{R}_3","{R}_3=4 Ω","{R}_3=9 Ω"],"R":["{R}","{R}=2 Ω","{R}","{R}=3 Ω"],"fl":[6,1,2,3],"fl2":[3,1,1,1]},"viewbox":"464 196 595 520","band":{"want":"3つ以上の並列の合成抵抗","ans":"逆数を足して最後に逆数にもどす・同じ値なら数で割る・どの抵抗よりも小さい","full":"並列の合成抵抗は、それぞれの抵抗の逆数を足した値が、合成抵抗の逆数になる（3つ以上でも同じ）。同じ値の抵抗の並列なら、1つの値をつないだ数で割った値。並列の合成抵抗は、つないだどの抵抗よりも小さい。"},"narr":{"start":{"co":1,"s4d":0,"r1v":0,"r2v":0,"r3v":0,"r1w":0,"r2w":0,"r3w":0,"Rv":0,"Rw":0,"Rx":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①3つ以上の並列\n②どの抵抗よりも小さい\n③同じ値のとき\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$・$R_2$・$R_3$ は、分かれた3本の道に1つずつあるので、並列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3","wire"]},{"text":"3つをまとめた合成抵抗を $R$ とすると、それぞれの抵抗の逆数を足した値が、$R$ の逆数になります。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R"],"move":"rd","eq":[{"cont":false,"items":[["\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}"]]}],"emphPre":["R1","R2","R3","R"]},{"text":"$R_1 = 12\\,\\Omega$、$R_2 = 6\\,\\Omega$、$R_3 = 4\\,\\Omega$ のときを考えます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R3"],"move":"vals"},{"text":"数字を入れて、分母を12にそろえます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R} = \\dfrac{1}{12} + \\dfrac{1}{6} + \\dfrac{1}{4}"],["\\dfrac{1}{R} = \\dfrac{1}{12} + \\dfrac{2}{12} + \\dfrac{3}{12}"]]}],"emphPre":["R1","R2","R3","R"]},{"text":"足すと $R$ の逆数が出ます。最後に逆数にもどして、$R$ を出します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R} = \\dfrac{6}{12}","R = \\dfrac{12}{6} = 2\\,\\Omega"]]}],"move":"rval","emphPre":["R1","R2","R3","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"合成抵抗 $R = 2\\,\\Omega$ は、いちばん小さい $R_3 = 4\\,\\Omega$ よりも、さらに小さくなりました。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R","R3"]},{"text":"並列にすると、電流の通る道が増えて流れやすくなります。並列の合成抵抗が、つないだどの抵抗よりも小さくなるのは、このためです。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R","wire"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"同じ値の抵抗を並列にしたときの合成抵抗は、1つの値を、つないだ数で割った値です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R1","R2","R3","R"]},{"text":"2つなら半分、3つなら3分の1になります。","at":{"強調":1.0},"after":[],"emph":["R1","R2","R3","R"]},{"text":"$R_1$・$R_2$・$R_3$ を、どれも $9\\,\\Omega$ にしてみます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R3"],"move":"same"},{"text":"3つとも同じ値なので、9 を 3 で割ります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["R = \\dfrac{9}{3} = 3\\,\\Omega"]]}],"move":"rsame","ans":true,"emphPre":["R1","R2","R3","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1","r1t2"],"R2":["r2","r2t0","r2t1","r2t2"],"R3":["r3","r3t0","r3t1","r3t2"],"R":["s4Rd:e","s4Rd:f","s4Rd:a","s4Rt0","s4Rt1","s4Rt2","s4Rt3"],"wire":["L","Rw","s4bl","s4br","s4w1l","s4w1r","s4w2l","s4w2r","s4w3l","s4w3r","dj1","dj2"]},"moves":{"rd":{"to":{"s4d":1},"dur":0.8},"vals":{"to":{"r1v":1,"r2v":1,"r3v":1},"dur":0.5},"rval":{"to":{"Rv":1},"dur":0.4},"same":{"to":{"r1w":1,"r2w":1,"r3w":1,"Rw":1},"dur":0.6},"rsame":{"to":{"Rx":1},"dur":0.4}},"route":["3つ以上の並列","どの抵抗よりも小さい","同じ値のとき"]}},{"id":"t3s4x","scene":"t3s4x","kind":"s4par","lab":{"pm":1,"r1":"{R}_1=10 Ω","r2":"{R}_2=15 Ω","r3":"{R}_3=30 Ω","R":["{R}","{R}=5 Ω"],"fl":[6,3,2,1]},"viewbox":"464 196 595 520","band":{"want":"合成抵抗 $R$","known":"$R_1 = 10\\,\\Omega,\\;\\; R_2 = 15\\,\\Omega,\\;\\; R_3 = 30\\,\\Omega$","ans":"$R = 5\\,\\Omega$"},"narr":{"start":{"co":1,"s4d":0,"Rv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、3つの抵抗をまとめた合成抵抗 $R$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R3","R"],"move":"rd"},{"text":"①並列か見る\n②逆数を足す\n③逆数にもどす\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2","R3","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$・$R_2$・$R_3$ は、分かれた3本の道に1つずつあるので、並列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3","wire"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"3つの並列なので、それぞれの抵抗の逆数を足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}"]]}],"emphPre":["R1","R2","R3","R"]},{"text":"数字を入れて、分母を30にそろえます。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R} = \\dfrac{1}{10} + \\dfrac{1}{15} + \\dfrac{1}{30}"],["\\dfrac{1}{R} = \\dfrac{3}{30} + \\dfrac{2}{30} + \\dfrac{1}{30}"]]}],"emphPre":["R1","R2","R3","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"足すと $R$ の逆数が出ます。逆数にもどして、$R$ を出します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":3,"emph":["R1","R2","R3","R"],"eq":[{"cont":false,"items":[["\\dfrac{1}{R} = \\dfrac{6}{30}","R = \\dfrac{30}{6} = 5\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["R1","R2","R3","R"]},{"text":"$R = 5\\,\\Omega$ は、いちばん小さい $R_1 = 10\\,\\Omega$ よりも小さいので、並列の合成抵抗として合っています。","at":{"強調":1.0},"after":[],"emph":["R","R1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1","r1t2"],"R2":["r2","r2t0","r2t1","r2t2"],"R3":["r3","r3t0","r3t1","r3t2"],"R":["s4Rd:e","s4Rd:f","s4Rd:a","s4Rt0","s4Rt1","s4Rt2","s4Rt3"],"wire":["L","Rw","s4bl","s4br","s4w1l","s4w1r","s4w2l","s4w2r","s4w3l","s4w3r","dj1","dj2"]},"moves":{"rd":{"to":{"s4d":1},"dur":0.8},"rval":{"to":{"Rv":1},"dur":0.4}},"route":["並列か見る","逆数を足す","逆数にもどす"]}},{"id":"t3s5e","scene":"t3s5e","kind":"s5e","lab":{"pm":1,"a1":"{R}_1=5 Ω","a2":"{R}_2=12 Ω","a3":"{R}_3=6 Ω","a23":"{R}_23=4 Ω","aR":["{R}","{R}=9 Ω"],"b1":"{R}_1=6 Ω","b2":"{R}_2=4 Ω","b3":"{R}_3=8 Ω","b23":"{R}_23=12 Ω","bR":["{R}","{R}=4 Ω"]},"viewbox":"464 196 595 500","band":{"want":"直並列の合成抵抗","ans":"並列の部分を先にまとめてから足す","full":"直列と並列が混ざった回路の合成抵抗は、まとめられる所から1つずつまとめる。並列の部分は和分の積で先に1つにまとめ、そのあと直列を足す。並列の道の中に直列があるときは、その直列を先に足してから和分の積（掛け算の側はカッコを付ける）。"},"narr":{"start":{"co":1,"t":0,"am":0,"bm":0,"aRd":0,"aRv":0,"bRv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①並列の部分を先にまとめる\n②直列を足す\n③道の中に直列があるとき\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ のあとに、$R_2$ と $R_3$ の並列がつながっています。直列と並列が混ざった、直並列の回路です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3"]},{"text":"直並列の合成抵抗は、並列の部分を先に1つにまとめます。","at":{"強調":1.0},"after":[],"emph":["R2","R3","par"]},{"text":"$R_2$ と $R_3$ の並列は、和分の積でまとめます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R2","R3","R23"],"eq":[{"cont":false,"items":[["R_{23} = \\dfrac{R_2 R_3}{R_2 + R_3}"],["R_{23} = \\dfrac{12 \\times 6}{12 + 6} = 4\\,\\Omega"]]}],"move":"amerge","emphPre":["R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"まとめた $R_{23}$ と $R_1$ は、分かれ道の無い1本の道に並ぶので直列です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","R23"]},{"text":"全体の合成抵抗を $R$ とします。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R23","R"],"move":"ard"},{"text":"直列なので、$R_1$ と $R_{23}$ を足します。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["R1","R23","R"],"eq":[{"cont":false,"items":[["R = R_1 + R_{23}"],["R = 5 + 4 = 9\\,\\Omega"]]}],"move":"arv","emphPre":["R1","R23","R"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"次は、並列の道の中に直列がある回路です。","at":{"道筋":1.0,"動き":1.0,"強調":1.0},"after":[],"route":3,"move":"topo","emph":["B1","B2","B3"]},{"text":"下の道の $R_2$ と $R_3$ は直列なので、先に足して1つにまとめます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["B2","B3","B23"],"eq":[{"cont":false,"items":[["R_{23} = R_2 + R_3"],["R_{23} = 4 + 8 = 12\\,\\Omega"]]}],"move":"bmerge","emphPre":["B2","B3","low"]},{"text":"$R_1$ と $R_{23}$ の並列は、和分の積です。掛け算の側は、カッコを付けて $R_1 \\times (R_2 + R_3)$ と書きます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["B1","B23","BR"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 \\times (R_2 + R_3)}{R_1 + R_2 + R_3}"],["R = \\dfrac{6 \\times 12}{6 + 12} = 4\\,\\Omega"]]}],"move":"brv","ans":true,"emphPre":["B1","B23","BR"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["ra1","ra1t0","ra1t1"],"R2":["ra2","ra2t0","ra2t1"],"R3":["ra3","ra3t0","ra3t1"],"R23":["ra23","ra23t0","ra23t1"],"R":["aRd:e","aRd:f","aRd:a","aRt0","aRt1"],"par":["s5abl","s5abr","s5aw2l","s5aw2r","s5aw3l","s5aw3r","s5aj1","s5aj2"],"B1":["rb1","rb1t0","rb1t1"],"B2":["rb2","rb2t0","rb2t1"],"B3":["rb3","rb3t0","rb3t1"],"B23":["rb23","rb23t0","rb23t1"],"BR":["bRd:e","bRd:f","bRd:a","bRt0","bRt1"],"low":["s5bw2l","s5bwm","s5bw3r"]},"moves":{"amerge":{"to":{"am":1},"dur":0.8},"ard":{"to":{"aRd":1},"dur":0.8},"arv":{"to":{"aRv":1},"dur":0.4},"topo":{"to":{"t":1},"dur":0.8},"bmerge":{"to":{"bm":1},"dur":0.8},"brv":{"to":{"bRv":1},"dur":0.4}},"route":["並列を先にまとめる","直列を足す","道の中の直列"]}},{"id":"t3s5x","scene":"t3s5x","kind":"s5a","lab":{"pm":1,"a1":"{R}_1=18 Ω","a2":"{R}_2=6 Ω","a3":"{R}_3=12 Ω","a23":"{R}_23=4 Ω","aR":["{R}","{R}=22 Ω"]},"viewbox":"464 196 595 500","band":{"want":"合成抵抗 $R$","known":"$R_1 = 18\\,\\Omega,\\;\\; R_2 = 6\\,\\Omega,\\;\\; R_3 = 12\\,\\Omega$","ans":"$R = 22\\,\\Omega$"},"narr":{"start":{"co":1,"am":0,"aRv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、全体の合成抵抗 $R$ です。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"①並列の部分をまとめる\n②直列を足す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R","R1","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_2$ と $R_3$ は並列なので、先に和分の積でまとめます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["R2","R3","R23"],"eq":[{"cont":false,"items":[["R_{23} = \\dfrac{R_2 R_3}{R_2 + R_3}"],["R_{23} = \\dfrac{6 \\times 12}{6 + 12} = 4\\,\\Omega"]]}],"move":"amerge","emphPre":["R2","R3","par"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と $R_{23}$ は直列なので、足します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["R1","R23","R"],"eq":[{"cont":false,"items":[["R = R_1 + R_{23}"],["R = 18 + 4 = 22\\,\\Omega"]]}],"move":"arv","ans":true,"emphPre":["R1","R23","R"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["ra1","ra1t0","ra1t1"],"R2":["ra2","ra2t0","ra2t1"],"R3":["ra3","ra3t0","ra3t1"],"R23":["ra23","ra23t0","ra23t1"],"R":["aRd:e","aRd:f","aRd:a","aRt0","aRt1"],"par":["s5abl","s5abr","s5aw2l","s5aw2r","s5aw3l","s5aw3r","s5aj1","s5aj2"]},"moves":{"amerge":{"to":{"am":1},"dur":0.8},"arv":{"to":{"aRv":1},"dur":0.4}},"route":["並列の部分をまとめる","直列を足す"]}},{"id":"t3s6e","scene":"t3s6e","kind":"s6par","lab":{"pm":1,"src":["{V}","{V}=12 V"],"r1":["{R}_1","{R}_1=12 Ω"],"r2":["{R}_2","{R}_2=4 Ω"],"R":["{R}","{R}=3 Ω"],"i":["{I}","{I}=4 A"],"fl":[1,3]},"viewbox":"464 152 595 560","band":{"want":"合成抵抗から全体の電流","ans":"合成抵抗 $R$ 1つにまとめて　$I = \\dfrac{V}{R}$","full":"回路の抵抗を合成抵抗 R 1つにまとめると、電源と R だけの回路になる。電源から出る電流は、回路の全体でオームの法則 I = V/R で求める。"},"narr":{"start":{"co":1,"mg":0,"srcv":0,"r1v":0,"r2v":0,"Rv":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①合成抵抗にまとめる\n②オームの法則\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電源から出る電流 $I$ を求めます。$I$ は、回路の全体を流れる電流です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","src"]},{"text":"回路の全体を流れる電流なので、回路の全体の抵抗を考えます。","at":{"強調":1.0},"after":[],"emph":["I","R1","R2"]},{"text":"$R_1$ と $R_2$ を、合成抵抗 $R$ 1つに置き換えます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","R"],"move":"merge"},{"text":"置き換えた後は、電源と $R$ だけの回路です。電源から出る電流 $I$ は変わりません。","at":{"強調":1.0},"after":[],"emph":["R","src","I"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"電源と1つの抵抗だけなので、回路の全体でオームの法則を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["src","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R}"]]}],"emphPre":["src","R","I"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"もとの回路で、$V = 12\\,\\mathrm{V}$、$R_1 = 12\\,\\Omega$、$R_2 = 4\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["src","R1","R2"],"move":"back"},{"text":"電流を出すには $R$ が要るので、先に合成抵抗を求めます。並列なので和分の積です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2"],"eq":[{"cont":false,"items":[["R = \\dfrac{R_1 R_2}{R_1 + R_2}"],["R = \\dfrac{12 \\times 4}{12 + 4} = 3\\,\\Omega"]]}],"emphPre":["R1","R2"]},{"text":"1つにまとめると、$R = 3\\,\\Omega$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R","src"],"move":"merge2"},{"text":"電流 $I$ は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["src","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R}"],["I = \\dfrac{12}{3} = 4\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["src","R","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R":["s6r","s6rt0","s6rt1"],"I":["ia","ia:h","it0","it1"]},"moves":{"merge":{"to":{"mg":1},"dur":0.9},"back":{"to":{"mg":0,"srcv":1,"r1v":1,"r2v":1},"dur":0.9},"merge2":{"to":{"mg":1,"Rv":1},"dur":0.9},"ival":{"to":{"iv":1},"dur":0.4}},"route":["合成抵抗にまとめる","オームの法則","数字で見る"]}},{"id":"t3s6x","scene":"t3s6x","kind":"s6sp","lab":{"pm":1,"src":"{V}=36 V","r1":"{R}_1=2 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","R":["{R}","{R}=6 Ω"],"i":["{I}","{I}=6 A"],"fl":[1,2]},"viewbox":"464 152 595 560","band":{"want":"電源から出る電流 $I$","known":"$V = 36\\,\\mathrm{V},\\;\\; R_1 = 2\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega,\\;\\; R_3 = 6\\,\\Omega$","ans":"$I = 6\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"mg":0,"Rv":0,"iv":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、電源から出る電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["I","src"]},{"text":"①合成抵抗を求める\n②オームの法則\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","src"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電流を出すには回路の全体の抵抗が要るので、先に合成抵抗 $R$ を求めます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","R3"]},{"text":"$R_2$ と $R_3$ の並列を先にまとめ、直列の $R_1$ を足します。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","R3"],"eq":[{"cont":false,"items":[["R = R_1 + \\dfrac{R_2 R_3}{R_2 + R_3}"],["R = 2 + \\dfrac{12 \\times 6}{12 + 6} = 6\\,\\Omega"]]}],"emphPre":["R1","R2","R3"]},{"text":"まとめると、電源と $R = 6\\,\\Omega$ だけの回路になります。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R","src"],"move":"merge"}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"回路の全体でオームの法則を使います。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["src","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R}"],["I = \\dfrac{36}{6} = 6\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["src","R","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"R":["s6r","s6rt0","s6rt1"],"I":["ia","ia:h","it0","it1"]},"moves":{"merge":{"to":{"mg":1,"Rv":1},"dur":0.9},"ival":{"to":{"iv":1},"dur":0.4}},"route":["合成抵抗を求める","オームの法則"]}},{"id":"t3k1x","scene":"t3k1x","kind":"k1h21","lab":{"pm":1,"r1":"{R}_1","r2":"{R}_2","src":"30 V","k1i":"6 A","k2i":"25 A"},"viewbox":"464 160 595 560","band":{"want":"小さい方の抵抗の値","known":"$30\\,\\mathrm{V}$ で直列は $6\\,\\mathrm{A}$・並列は $25\\,\\mathrm{A}$","ans":"$2\\,\\Omega$"},"narr":{"start":{"co":1},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、$R_1$ と $R_2$ のうち、小さい方の値です。","at":{"強調":1.0},"after":[],"emph":["R1","R2"]},{"text":"①図1の合成抵抗\n②図2の合成抵抗\n③2つの値を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"図1は、$R_1$ と $R_2$ の直列です。合成抵抗は $R_1 + R_2$ です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["F1","R1","R2"]},{"text":"回路の全体でオームの法則を使うと、合成抵抗は、電圧 $30\\,\\mathrm{V}$ を電流 $6\\,\\mathrm{A}$ で割った値です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","src","I1"],"eq":[{"cont":false,"items":[["R_1 + R_2 = \\dfrac{30}{6} = 5\\,\\Omega"]]}],"emphPre":["R1","R2","src","I1"]}]},{"cap":null,"eqp":null,"vid":[1,3],"sents":[{"text":"図2は、$R_1$ と $R_2$ の並列です。2つの並列の合成抵抗は、和分の積です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["F2","R1","R2"]},{"text":"回路の全体でオームの法則を使うと、合成抵抗は、$30\\,\\mathrm{V}$ を $25\\,\\mathrm{A}$ で割った値です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2","src","I2"],"eq":[{"cont":false,"items":[["\\dfrac{R_1 R_2}{R_1 + R_2} = \\dfrac{30}{25} = 1.2\\,\\Omega"]]}],"emphPre":["R1","R2","src","I2"]},{"text":"分母の $R_1 + R_2$ は、図1で出した $5\\,\\Omega$ です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["R1","R2"],"eq":[{"cont":false,"items":[["\\dfrac{R_1 R_2}{5} = 1.2"],["R_1 R_2 = 1.2 \\times 5 = 6"]]}],"emphPre":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ と $R_2$ は、足すと $5$、掛けると $6$ になる2つの値です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["R1","R2"]},{"text":"足して5になる組のうち、掛けて6になるのは、2と3です。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["R1","R2"],"eq":[{"cont":false,"items":[["2 + 3 = 5","2 \\times 3 = 6"]]}]},{"text":"なので、小さい方の抵抗は $2\\,\\Omega$ です。","at":{"答え":1.0,"強調":1.0},"after":[],"ans":true,"emph":["R1","R2"]}]}],"groups":{"R1":["k1r1","k1r1t0","k1r1t1","k2r1","k2r1t0","k2r1t1"],"R2":["k1r2","k1r2t0","k1r2t1","k2r2","k2r2t0","k2r2t1"],"src":["k1c:L","k1c:S","k1pp","k1pm","k1e0","k1e1","k2c:L","k2c:S","k2pp","k2pm","k2e0","k2e1"],"I1":["k1ia","k1ia:h","k1it0","k1it1"],"I2":["k2ia","k2ia:h","k2it0","k2it1"],"F1":["k1n","k1L","k1T","k1R"],"F2":["k2n","k2L","k2R","k2bl","k2br","k2w1l","k2w1r","k2w2l","k2w2r","k2j1","k2j2"]},"moves":{},"route":["図1の合成抵抗","図2の合成抵抗","2つの値を出す"]}}],"secs":[{"ex":{"text":"図の回路で、電源の電圧は $V = 60\\,\\mathrm{V}$、$R_1$ の電圧降下は $V_1 = 36\\,\\mathrm{V}$ である。－極の側を基準の $0\\,\\mathrm{V}$ とすると、点 c の電位は何 V か。","fig":{"kind":"psp","L":{"pm":1,"j":1,"src":"{V}=60 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","v1":"{V}_1=36 V","pa":{},"pc":{}},"P":{}},"ch":[{"t":"$36\\,\\mathrm{V}$","v":36,"why":"電圧降下 $V_1$ を、点 c の電位と取り違えた"},{"t":"$24\\,\\mathrm{V}$","v":24,"why":""},{"t":"$60\\,\\mathrm{V}$","v":60,"why":"$R_1$ を通っても電位が下がらないと考えた"},{"t":"$12\\,\\mathrm{V}$","v":12,"why":"点 c の電位が $R_2$ と $R_3$ に分かれると考えた"}],"ans":1}},{"ex":{"text":"図のように、$R_1 = 12\\,\\Omega$、$R_2 = 8\\,\\Omega$、$R_3 = 15\\,\\Omega$ の3つの抵抗を直列につないだ。合成抵抗 $R$ は何 Ω か。","fig":{"kind":"s2ser","L":{"pm":1,"r1":"{R}_1=12 Ω","r2":"{R}_2=8 Ω","r3":"{R}_3=15 Ω","R":"{R}"},"P":{}},"ch":[{"t":"$20\\,\\Omega$","v":20,"why":"$R_3$ を足し忘れた（3つ以上でも全部足す）"},{"t":"$35\\,\\Omega$","v":35,"why":""},{"t":"$1440\\,\\Omega$","v":1440,"why":"足すところを掛けた"},{"t":"$15\\,\\Omega$","v":15,"why":"いちばん大きい抵抗だけを答えた"}],"ans":1}},{"ex":{"text":"図のように、$R_1 = 15\\,\\Omega$ と $R_2 = 10\\,\\Omega$ を並列につないだ。合成抵抗 $R$ は何 Ω か。","fig":{"kind":"s3par","L":{"pm":1,"r1":"{R}_1=15 Ω","r2":"{R}_2=10 Ω","R":"{R}"},"P":{}},"ch":[{"t":"$25\\,\\Omega$","v":25,"why":"並列なのに、直列と同じく足した"},{"t":"$6\\,\\Omega$","v":6,"why":""},{"t":"$150\\,\\Omega$","v":150,"why":"積を和で割るのを忘れた"},{"t":"$30\\,\\Omega$","v":30,"why":"分母を和でなく差（$15 - 10$）にした"}],"ans":1}},{"ex":{"text":"図のように、$R_1 = 10\\,\\Omega$、$R_2 = 15\\,\\Omega$、$R_3 = 30\\,\\Omega$ の3つの抵抗を並列につないだ。合成抵抗 $R$ は何 Ω か。","fig":{"kind":"s4par","L":{"pm":1,"r1":"{R}_1=10 Ω","r2":"{R}_2=15 Ω","r3":"{R}_3=30 Ω","R":"{R}"},"P":{}},"ch":[{"t":"$55\\,\\Omega$","v":55,"why":"全部足した（直列の合成抵抗と取り違えた）"},{"t":"$5\\,\\Omega$","v":5,"why":""},{"t":"$0.2\\,\\Omega$","v":0.2,"why":"足して出た $\\dfrac{1}{R}$ のまま答えた（最後に逆数にもどし忘れた）"},{"t":"$10\\,\\Omega$","v":10,"why":"いちばん小さい抵抗を答えた（並列の合成抵抗は、どの抵抗よりも小さい）"}],"ans":1}},{"ex":{"text":"図の回路で、$R_1 = 18\\,\\Omega$、$R_2 = 6\\,\\Omega$、$R_3 = 12\\,\\Omega$ である。全体の合成抵抗 $R$ は何 Ω か。","fig":{"kind":"s5a","L":{"pm":1,"a1":"{R}_1=18 Ω","a2":"{R}_2=6 Ω","a3":"{R}_3=12 Ω","aR":"{R}"},"P":{}},"ch":[{"t":"$36\\,\\Omega$","v":36,"why":"全部の抵抗を足した（並列の部分は足さずに和分の積）"},{"t":"$22\\,\\Omega$","v":22,"why":""},{"t":"$4\\,\\Omega$","v":4,"why":"並列の部分だけをまとめて、直列の $R_1$ を足し忘れた"},{"t":"$8\\,\\Omega$","v":8,"why":"並列の部分を先にまとめずに、$R_1$ と $R_2$ を足してから $R_3$ と和分の積にした"}],"ans":1}},{"ex":{"text":"図の回路で、電源の電圧は $V = 36\\,\\mathrm{V}$、$R_1 = 2\\,\\Omega$、$R_2 = 12\\,\\Omega$、$R_3 = 6\\,\\Omega$ である。電源から出る電流 $I$ は何 A か。","fig":{"kind":"s6sp","L":{"pm":1,"src":"{V}=36 V","r1":"{R}_1=2 Ω","r2":"{R}_2=12 Ω","r3":"{R}_3=6 Ω","i":"{I}"},"P":{}},"ch":[{"t":"$1.8\\,\\mathrm{A}$","v":1.8,"why":"並列の部分も直列として、全部足した（$R = 20\\,\\Omega$ とした）"},{"t":"$6\\,\\mathrm{A}$","v":6,"why":""},{"t":"$9\\,\\mathrm{A}$","v":9,"why":"$R_1$ を足し忘れた（並列の部分の $4\\,\\Omega$ だけで割った）"},{"t":"$216\\,\\mathrm{A}$","v":216,"why":"割るところを掛けた"}],"ans":1}}],"past":[{"id":"h21q6","title":"平成21年 問6","text":"抵抗値が異なる抵抗 $R_1$ [Ω] と $R_2$ [Ω] を図1のように直列に接続し，30 [V] の直流電圧を加えたところ，回路に流れる電流は 6 [A] であった。次に，この抵抗 $R_1$ [Ω] と $R_2$ [Ω] を図2のように並列に接続し，30 [V] の直流電圧を加えたところ，回路に流れる電流は 25 [A] であった。このとき，抵抗 $R_1$ [Ω]，$R_2$ [Ω] のうち小さい方の抵抗 [Ω] の値として，正しいのは次のうちどれか。","fig":{"kind":"k1h21","L":{"r1":"{R}_1 [Ω]","r2":"{R}_2 [Ω]","src":"30 V","k1i":"6 A","k2i":"25 A"},"P":{}},"ch":[{"t":"$1$","v":"1","why":""},{"t":"$1.2$","v":"2","why":""},{"t":"$1.5$","v":"3","why":""},{"t":"$2$","v":"4","why":""},{"t":"$3$","v":"5","why":""}],"ans":3,"slide":"t3k1x","credit":"出典：一般財団法人 電気技術者試験センター 平成21年度 第三種 理論 問6（図は描き直し）"}]}};
});
