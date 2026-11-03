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
var KINDS = {u4s1ser: tbU4s1ser};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I（I＝その道の電流の比）
var FLOWK = {
  u4s1ser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
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
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t4s1e","scene":"t4s1e","kind":"u4s1ser","lab":{"pm":1,"src":["{V}","{V}=24 V"],"r1":["{R}_1","{R}_1=6 Ω"],"r2":["{R}_2","{R}_2=2 Ω"],"v1":["{V}_1","{V}_1=18 V"],"v2":["{V}_2","{V}_2=6 V"],"i":"{I}"},"viewbox":"464 232 595 400","band":{"want":"直列の2つの抵抗にかかる電圧","ans":"抵抗の比に分かれる　$V_1 = V \\times \\dfrac{R_1}{R_1 + R_2}$","full":"直列の2つの抵抗には同じ電流が流れるので、かかる電圧の比は抵抗の比と同じ。電源の電圧 V は抵抗の比に分かれてかかる（分圧）。"},"narr":{"start":{"co":1,"srcv":0,"r1v":0,"r2v":0,"v1d":0,"v2d":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"①電流は同じ\n②抵抗の比に分かれる\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"$R_1$ と $R_2$ は直列なので、どちらにも同じ電流 $I$ が流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["I","R1","R2"]},{"text":"それぞれの抵抗にかかる電圧は、オームの法則で表せます。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":["強調"],"emph":["R1","V1","R2","V2","I"],"move":"varr","eq":[{"cont":false,"items":[["V_1 = R_1 I"],["V_2 = R_2 I"]]}],"emphPre":["R1","V1","R2","V2","I"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"どちらも同じ $I$ を掛けるので、電圧の比は抵抗の比と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":["強調"],"route":2,"emph":["V1","V2","R1","R2","I"],"eq":[{"cont":false,"items":[["V_1 : V_2 = R_1 : R_2"]]}],"emphPre":["V1","V2","R1","R2","I"]},{"text":"電源の電圧 $V$ は、抵抗の比に分かれて $R_1$ と $R_2$ にかかります。これを分圧といいます。","at":{"強調":1.0},"after":[],"emph":["src","V1","V2","R1","R2","zhi","zmid","zlo"]},{"text":"$V_1$ は、$V$ のうち $R_1$ の割合の分です。","at":{"強調":1.0,"式":1.0},"after":["強調"],"emph":["src","R1","V1","R2"],"eq":[{"cont":false,"items":[["V_1 = V \\times \\dfrac{R_1}{R_1 + R_2}"]]}],"emphPre":["src","R1","V1","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V = 24\\,\\mathrm{V}$、$R_1 = 6\\,\\Omega$、$R_2 = 2\\,\\Omega$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["src","R1","R2"],"move":"vals"},{"text":"抵抗の比は $6 : 2 = 3 : 1$ なので、$24\\,\\mathrm{V}$ を $3 : 1$ に分けます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","src"]},{"text":"$V_1$ は次のとおりです。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","R1","V1"],"eq":[{"cont":false,"items":[["V_1 = 24 \\times \\dfrac{6}{6 + 2} = 18\\,\\mathrm{V}"]]}],"move":"v1val","emphPre":["src","R1","V1"]},{"text":"$V_2$ は残りの $24 - 18 = 6\\,\\mathrm{V}$ です。$18 : 6 = 3 : 1$ で、抵抗の比と同じです。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["R2","V2"],"move":"v2val","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u4s1L","u4s1w1","zbhi"],"zmid":["u4s1wm","zbmid"],"zlo":["u4s1w2","u4s1R","zblo"]},"moves":{"varr":{"to":{"v1d":1,"v2d":1},"dur":0.8},"vals":{"to":{"srcv":1,"r1v":1,"r2v":1},"dur":0.6},"v1val":{"to":{"v1v":1},"dur":0.4},"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["電流は同じ","抵抗の比に分かれる","数字で見る"]}},{"id":"t4s1x","scene":"t4s1x","kind":"u4s1ser","lab":{"pm":1,"src":"{V}=100 V","r1":"{R}_1=15 Ω","r2":"{R}_2=35 Ω","v2":["{V}_2","{V}_2=70 V"]},"viewbox":"464 232 595 400","band":{"want":"$R_2$ にかかる電圧 $V_2$","known":"$V = 100\\,\\mathrm{V},\\;\\; R_1 = 15\\,\\Omega,\\;\\; R_2 = 35\\,\\Omega$","ans":"$V_2 = 70\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"求めるのは、$R_2$ にかかる電圧 $V_2$ です。","at":{"強調":1.0},"after":[],"emph":["V2","R2"]},{"text":"①抵抗の比\n②分圧の式\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V2","R2"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$R_1$ と $R_2$ は直列なので、電源の電圧 $V$ は抵抗の比に分かれてかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src","R1","R2"]},{"text":"抵抗の比は $15 : 35 = 3 : 7$ です。$V_2$ は $V$ の $\\dfrac{7}{10}$ になります。","at":{"強調":1.0},"after":[],"emph":["R1","R2","V2","src"]}]},{"cap":null,"eqp":null,"vid":[5],"sents":[{"text":"$V_2$ は、$V$ のうち $R_2$ の割合の分です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["src","R2","V2","R1"],"eq":[{"cont":false,"items":[["V_2 = V \\times \\dfrac{R_2}{R_1 + R_2}"],["V_2 = 100 \\times \\dfrac{35}{15 + 35}"],["V_2 = 70\\,\\mathrm{V}"]]}],"move":"v2val","ans":true,"emphPre":["src","R2","V2","R1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"I":["ia","ia:h","it0","it1"],"zhi":["u4s1L","u4s1w1","zbhi"],"zmid":["u4s1wm","zbmid"],"zlo":["u4s1w2","u4s1R","zblo"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["抵抗の比","分圧の式"]}}],"secs":[{"ex":{"text":"図のように、$R_1 = 15\\,\\Omega$ と $R_2 = 35\\,\\Omega$ を直列につなぎ、電源の電圧を $V = 100\\,\\mathrm{V}$ とした。$R_2$ にかかる電圧 $V_2$ は何 V か。","fig":{"kind":"u4s1ser","L":{"pm":1,"src":"{V}=100 V","r1":"{R}_1=15 Ω","r2":"{R}_2=35 Ω","v2":"{V}_2"},"P":{}},"ch":[{"t":"$30\\,\\mathrm{V}$","v":30,"why":"$R_1$ の割合で分けた（$R_1$ にかかる電圧を求めた）"},{"t":"$70\\,\\mathrm{V}$","v":70,"why":""},{"t":"$100\\,\\mathrm{V}$","v":100,"why":"電源の電圧が、そのまま $R_2$ にかかると考えた"},{"t":"$50\\,\\mathrm{V}$","v":50,"why":"電圧が2つの抵抗に等しく分かれると考えた"}],"ans":1}}],"past":[]}};
});
