/* 単元2「直列回路と並列回路」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(2, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元2の図（自作）：直列（ser）・並列（par）・直並列（sp）・過去問 平成25年 問5（pq25）。
// 共通の部品（vdim・pv・swapText）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 名前 L[k]：文字（そのまま）か [前, 後]（p[k + "v"] で前→後へ入れ替える）。矢印の濃さ＝p[k + "o"]（無ければ 1）、
// 電圧の矢印の伸び＝p[k + "d"]（無ければ 1）。問題の画面の図は p を渡さない＝全部出た形。
// 電流は＋極（電池の長い線・x=752）から出て、下の線を左へ → 左の線を上へ → 上の線を右へ。抵抗は左の端が高い電位。
function lab2(d, id, x, y, spec, p, k, o, opt){
  if (spec === undefined || spec === null) return;
  if (Array.isArray(spec)) swapText(d, id, x, y, spec[0], spec[1], pv(p, k + "v"), o, opt);
  else swapText(d, id, x, y, spec, null, 0, o, opt);
}
// 抵抗（横）と名前
function resL(d, id, x, y, L, k, p){
  d.res(id, x, y, "h");
  lab2(d, id + "t", x, y - 30, L[k], p, k, 1);
}
// 横の抵抗の電圧の矢印（上 or 下）。左の端が高い電位＝矢じりは左
function vArrow(d, id, x, y, L, k, p, below){
  if (L[k] === undefined) return;
  var dd = pv(p, k + "d", 1), y0 = below ? y + 10 : y - 10, y1 = below ? y + 95 : y - 85, ya = below ? y + 85 : y - 75;
  var w = vdim(d, id + "d", x - 72.5, x + 72.5, y0, y1, ya, dd, {});
  lab2(d, id + "t", x, below ? ya + 25 : ya - 25, L[k], p, k, w);
}
// 電流の矢印（右向き）。above＝線の上・無ければ線の下
function iArrow(d, id, x, y, L, k, p, above){
  if (L[k] === undefined) return;
  var o = pv(p, k + "o", 1), ya = above ? y - 34 : y + 34;
  d.arrow(id + "a", x - 32, ya, x + 32, ya, {o: o});
  lab2(d, id + "t", x, above ? y - 64 : y + 64, L[k], p, k, o);
}
// 左の縦の線の電流（上向き）。名前は右へ
function iLeft(d, yb, L, p){
  if (L.i === undefined) return;
  var o = pv(p, "io", 1);
  d.arrow("ia", 508, yb - 30, 508, yb - 96, {o: o});
  lab2(d, "it", 526, yb - 63, L.i, p, "i", o, {anchor: "start"});
}
// 電源（下の線の真ん中）・＋と－・電源の電圧の名前
function srcPart(d, yb, L, p){
  d.cell("c", 752, yb);
  if (L.pm) { d.text("pp", 722, yb - 26, "+"); d.text("pm", 802, yb - 26, "−"); }
  lab2(d, "e", 762, yb + 42, L.src, p, "src", 1);
}
// 点（点・名前・電位）
function point(d, k, x, y, L, p){
  var P = L["p" + k]; if (!P) return;
  var o = pv(p, "p" + k + "o", 1);
  d.dot("d" + k, x, y, {o: o});
  d.text("n" + k, x, y + 30, k, {o: o});
  if (P.v !== undefined) lab2(d, "p" + k + "t", x, y - 32, P.v, p, "p" + k, pv(p, "p" + k + "vo", 1));
}
// ---- 直列：上の線に R1（x=640）・R2（x=880）
function tbSer(d, p, L){
  var yb = 560;
  d.wire("L", [[478, 360], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360]]);
  d.wire("w1", [[478, 360], [610, 360]]); d.wire("wm", [[670, 360], [850, 360]]); d.wire("w2", [[910, 360], [1045, 360]]);
  srcPart(d, yb, L, p);
  resL(d, "r1", 640, 360, L, "r1", p); resL(d, "r2", 880, 360, L, "r2", p);
  vArrow(d, "v1", 640, 360, L, "v1", p); vArrow(d, "v2", 880, 360, L, "v2", p);
  iArrow(d, "i1", 640, 360, L, "i1", p); iArrow(d, "i2", 880, 360, L, "i2", p);
  iLeft(d, yb, L, p);
  point(d, "a", 520, 360, L, p); point(d, "c", 760, 360, L, p); point(d, "b", 1000, 360, L, p);
}
// ---- 並列：左右の縦の線 x=600・960、上の道 y=280（R1）・下の道 y=440（R2）
function tbPar(d, p, L){
  var yb = 640, xl = 600, xr = 960;
  d.wire("L", [[xl, 360], [478, 360], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360], [xr, 360]]);
  d.wire("bl", [[xl, 280], [xl, 440]]); d.wire("br", [[xr, 280], [xr, 440]]);
  [[280, "1"], [440, "2"]].forEach(function(q){
    d.wire("w" + q[1] + "l", [[xl, q[0]], [710, q[0]]]); d.wire("w" + q[1] + "r", [[770, q[0]], [xr, q[0]]]);
    resL(d, "r" + q[1], 740, q[0], L, "r" + q[1], p);
  });
  if (L.j) { d.dot("dj1", xl, 360); d.dot("dj2", xr, 360); }
  srcPart(d, yb, L, p);
  vArrow(d, "v1", 740, 280, L, "v1", p); vArrow(d, "v2", 740, 440, L, "v2", p, true);
  iArrow(d, "i1", 880, 280, L, "i1", p, true); iArrow(d, "i2", 880, 440, L, "i2", p);
  iLeft(d, yb, L, p);
}
// ---- 直並列：上の線に R1（x=580）、その先に並列（縦の線 x=680・1000、R2 y=280・R3 y=440）
function tbSp(d, p, L){
  var yb = 640, xl = 680, xr = 1010;
  d.wire("L", [[550, 360], [478, 360], [478, yb], [752, yb]]);
  d.wire("w1", [[610, 360], [xl, 360]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360], [xr, 360]]);
  d.wire("bl", [[xl, 280], [xl, 440]]); d.wire("br", [[xr, 280], [xr, 440]]);
  [[280, "2"], [440, "3"]].forEach(function(q){
    d.wire("w" + q[1] + "l", [[xl, q[0]], [760, q[0]]]); d.wire("w" + q[1] + "r", [[820, q[0]], [xr, q[0]]]);
    resL(d, "r" + q[1], 790, q[0], L, "r" + q[1], p);
  });
  if (L.j) { d.dot("dj1", xl, 360); d.dot("dj2", xr, 360); }
  resL(d, "r1", 580, 360, L, "r1", p);
  srcPart(d, yb, L, p);
  vArrow(d, "v1", 580, 360, L, "v1", p); vArrow(d, "v2", 790, 280, L, "v2", p); vArrow(d, "v3", 790, 440, L, "v3", p, true);
  iArrow(d, "i1", 580, 360, L, "i1", p); iArrow(d, "i2", 945, 280, L, "i2", p, true); iArrow(d, "i3", 945, 440, L, "i3", p);
}
// ---- 過去問 平成25年 問5：端子2つ（左）・R と Rx の並列（縦の抵抗）
function tbPq25(d, p, L){
  var yt = 300, yb = 560, xR = 760, xX = 960;
  d.term("ta", 520, yt, "", "l"); d.term("tb", 520, yb, "", "l");
  d.wire("wt", [[526, yt], [xX, yt], [xX, 400]]); d.wire("wb", [[526, yb], [xX, yb], [xX, 460]]);
  d.wire("wR", [[xR, yt], [xR, 400]]); d.wire("wR2", [[xR, 460], [xR, yb]]);
  d.res("r", xR, 430, "v"); d.res("rx", xX, 430, "v");
  d.dot("dj1", xR, yt); d.dot("dj2", xR, yb);
  d.text("rt0", xR + 30, 430, L.r, {anchor: "start"});
  d.text("rxt0", xX + 30, 430, L.rx, {anchor: "start"});
  // 電圧 V：下の端子から上の端子へ（上が高い）
  d.arrow("va", 520, yb - 24, 520, yt + 24);
  d.text("vt0", 496, 430, L.v, {anchor: "end"});
  // 電流 I：上の線の上・右向き
  d.arrow("ia", 590, yt - 30, 654, yt - 30);
  d.text("it0", 622, yt - 60, L.i);
  // R と Rx の電流（下向き・抵抗の左）
  [["ir", xR, L.ir], ["ix", xX, L.ix]].forEach(function(q){
    if (q[2] === undefined) return;
    var o = pv(p, q[0] + "o", 1);
    d.arrow(q[0] + "a", q[1] - 26, 322, q[1] - 26, 376, {o: o});
    d.text(q[0] + "t0", q[1] - 40, 349, q[2], {anchor: "end", o: o});
  });
}
var KINDS = {ser: tbSer, par: tbPar, sp: tbSp, pq25: tbPq25};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I。L.fl＝[全体, 上の道, 下の道] の電流の比
var FLOWK = {
  ser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  par: function(p, L){
    var yb = 640, f = L.fl || [2, 1, 1], xl = 600, xr = 960;
    return {o: pv(p, "co"), base: 200, paths: [
      {I: f[0], pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[2], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: f[0], pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  sp: function(p, L){
    var yb = 640, f = L.fl || [2, 1, 1], xl = 680, xr = 1010;
    return {o: pv(p, "co"), base: 200, paths: [
      {I: f[0], pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[2], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: f[0], pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  }
};

// 単元2の練習問題の作り方。共通の道具（rngOf・pick・choices・num・qv・qf・nice・distinct など）は tb_gen.js。
// 形は「式の穴埋め（決まりの式を選ぶ）」と「数字の計算（単元1のオームの法則と組み合わせる）」。図は全問に付ける。
// まちがいの選択肢は、よくある取り違え（直列と並列の決まりの取り違え・足す/引く/掛ける/割るの取り違え・引く順が逆・
// 電源の電圧がそのままかかると考えた・電流が等しく分かれると考えた など）。理由を1行付ける。
// 合成抵抗（単元3）・分圧と分流（単元4）の式は使わない。
function SERF(L){ return {kind: "ser", L: Object.assign({pm: 1, r1: "{R}_1", r2: "{R}_2"}, L), P: {}}; }
function PARF(L){ return {kind: "par", L: Object.assign({pm: 1, j: 1, r1: "{R}_1", r2: "{R}_2"}, L), P: {}}; }
function SPF(L){ return {kind: "sp", L: Object.assign({pm: 1, j: 1, r1: "{R}_1", r2: "{R}_2", r3: "{R}_3"}, L), P: {}}; }
// 式の選択肢（文字の式）。list の先頭が正しい物：[t, v, why]
function rule(r, text, fig, list, ex, form){
  var c = choices(r, list.map(function(x, i){ return i ? {t: x[0], v: x[1], why: x[2]} : {t: x[0], v: x[1]}; }));
  return {form: form, text: text, fig: fig, ch: c.ch, ans: c.ans, ex: ex, chk: {form: form, p: {}}};
}
// 数字の選択肢：ok と、まちがい [{x, why}]。値が小数3けたで割り切れて4つが重ならない物だけ（呼ぶ側で決め直す）
function okNums(ok, w){ return nice(ok) && w.every(function(z){ return nice(z.x); }) && distinct([ok].concat(w.map(function(z){ return z.x; }))); }
var IV = [1, 2, 3, 4, 5, 6, 8, 10];
var RV = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
var GEN = {
  // 2-1 直列回路：電流はどこも同じ（I = I1 = I2）
  1: function(r){
    var f = pick(r, ["rule", "same", "same", "ohmI", "ohmV", "ohmV"]);
    if (f === "rule") return rule(r, "2つの抵抗を直列につないだ回路で、電流の関係を表す式は □ である。",
      SERF({i: "{I}", i1: "{I}_1", i2: "{I}_2"}),
      [["$I = I_1 = I_2$", "I=I1=I2"], ["$I = I_1 + I_2$", "I=I1+I2", "並列の電流の決まりと取り違えた"],
       ["$I_1 = I_2 = \\dfrac{I}{2}$", "I/2", "電流が2つの抵抗に等しく分かれると考えた"], ["$I_1 > I_2$", "I1>I2", "抵抗を通るたびに電流が減ると考えた"]],
      ["直列は1本の道なので、電流はどこも同じ", "$I = I_1 = I_2$"], "rule1");
    if (f === "same") {
      var I = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]);
      var c = num(r, null, "A", I, [{x: I / 2, why: "電流が2つの抵抗に等しく分かれると考えた"}, {x: I * 2, why: "電流が抵抗の数だけ増えると考えた"},
                                   {x: 0, why: "抵抗で電流が止まると考えた"}]);
      return {form: "same", text: "図の直列回路で、電源から流れ出る電流は $I = " + qv(I, "A") + "$ である。$R_2$ を流れる電流 $I_2$ は何 A か。",
              fig: SERF({i: "{I}=" + qf(I, "A"), i2: "{I}_2"}), ch: c.ch, ans: c.ans,
              ex: ["直列では、電流はどこも同じ", "$I_2 = I = " + qv(I, "A") + "$"], chk: {form: "same", p: {I: I}}};
    }
    var R, X, w, ok;
    if (f === "ohmI") {             // R1 と V1 から、R2 の電流（＝R1 の電流）
      for (;;) {
        R = pick(r, RV); X = pick(r, IV); var V = R * X; ok = X;
        w = [{x: V * R, why: "割るところを掛けた"}, {x: R / V, why: "割る順が逆（$R_1$ を $V_1$ で割った）"}, {x: X / 2, why: "電流が2つの抵抗に等しく分かれると考えた"}];
        if (okNums(ok, w)) break;
      }
      var c2 = num(r, null, "A", ok, w);
      return {form: "ohmI", text: "図の直列回路で、$R_1 = " + qv(R, "O") + "$ にかかる電圧は $V_1 = " + qv(R * X, "V") + "$ である。$R_2$ を流れる電流 $I_2$ は何 A か。",
              fig: SERF({r1: "{R}_1=" + qf(R, "O"), v1: "{V}_1=" + qf(R * X, "V"), i2: "{I}_2"}), ch: c2.ch, ans: c2.ans,
              ex: ["$I_1 = \\dfrac{V_1}{R_1} = \\dfrac{" + fmt(R * X) + "}{" + fmt(R) + "} = " + qv(X, "A") + "$", "直列なので $I_2 = I_1 = " + qv(X, "A") + "$"],
              chk: {form: "ohmI", p: {R1: R, V1: R * X}}};
    }
    for (;;) {                       // I1 と R2 から、R2 の電圧
      R = pick(r, RV); X = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]); ok = R * X;
      w = [{x: R / X, why: "$R_2$ を $I_2$ で割った"}, {x: X / R, why: "$I_2$ を $R_2$ で割った"}, {x: R * X / 2, why: "電流が2つの抵抗に等しく分かれると考えた"}];
      if (okNums(ok, w)) break;
    }
    var c3 = num(r, null, "V", ok, w);
    return {form: "ohmV", text: "図の直列回路で、$R_1$ を流れる電流は $I_1 = " + qv(X, "A") + "$ である。$R_2 = " + qv(R, "O") + "$ にかかる電圧 $V_2$ は何 V か。",
            fig: SERF({i1: "{I}_1=" + qf(X, "A"), r2: "{R}_2=" + qf(R, "O"), i2: "{I}_2", v2: "{V}_2"}), ch: c3.ch, ans: c3.ans,
            ex: ["直列なので $I_2 = I_1 = " + qv(X, "A") + "$", "$V_2 = R_2 I_2 = " + fmt(R) + " \\times " + fmt(X) + " = " + qv(ok, "V") + "$"],
            chk: {form: "ohmV", p: {I1: X, R2: R}}};
  },
  // 2-2 直列の電圧：V = V1 + V2・途中の点の電位
  2: function(r){
    var f = pick(r, ["rule", "v2", "v2", "pot", "pot", "r2"]);
    if (f === "rule") return rule(r, "2つの抵抗を直列につないだ回路で、電源の電圧 $V$ と、抵抗の電圧 $V_1$・$V_2$ の関係を表す式は □ である。",
      SERF({src: "{V}", v1: "{V}_1", v2: "{V}_2"}),
      [["$V = V_1 + V_2$", "V=V1+V2"], ["$V = V_1 = V_2$", "V=V1=V2", "並列の電圧の決まりと取り違えた"],
       ["$V = V_1 - V_2$", "V=V1-V2", "足すところを引いた"], ["$V = V_1 V_2$", "V=V1V2", "足すところを掛けた"]],
      ["直列では、電源の電圧は各抵抗の電圧の和", "$V = V_1 + V_2$"], "rule2");
    var V, V1, w, ok;
    if (f === "v2" || f === "pot") {
      for (;;) {
        V = pick(r, [10, 12, 15, 20, 24, 30, 40, 50, 60, 100]); V1 = Math.floor(r() * (V - 1)) + 1; ok = V - V1;
        w = f === "v2" ? [{x: V + V1, why: "$V$ と $V_1$ を足した"}, {x: V1 - V, why: "引く順が逆（$V_1$ から $V$ を引いた）"}, {x: V, why: "電源の電圧がそのまま $R_2$ にかかると考えた"}]
                       : [{x: V1, why: "下がった分 $V_1$ を、点 c の電位と取り違えた"}, {x: V + V1, why: "$R_1$ を通ると電位が上がると考えた"}, {x: V, why: "$R_1$ を通っても電位が下がらないと考えた"}];
        if (okNums(ok, w)) break;
      }
      var c = num(r, null, "V", ok, w);
      if (f === "v2") return {form: "v2", text: "図の直列回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$ である。$R_2$ にかかる電圧 $V_2$ は何 V か。",
              fig: SERF({src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), v2: "{V}_2"}), ch: c.ch, ans: c.ans,
              ex: ["$V = V_1 + V_2$ より $V_2 = V - V_1$", "$V_2 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(ok, "V") + "$"], chk: {form: "v2", p: {V: V, V1: V1}}};
      return {form: "pot", text: "図の直列回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$ である。－極の側の点 b を基準の $0\\,\\mathrm{V}$ とすると、点 c の電位は何 V か。",
              fig: SERF({src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), pa: {v: qf(V, "V")}, pb: {v: "0 V"}, pc: {}}), ch: c.ch, ans: c.ans,
              ex: ["点 a の電位は電源の電圧と同じ $" + qv(V, "V") + "$", "$R_1$ を通ると $V_1$ だけ下がる：$" + fmt(V) + " - " + fmt(V1) + " = " + qv(ok, "V") + "$"], chk: {form: "pot", p: {V: V, V1: V1}}};
    }
    var I, V2;
    for (;;) {                       // V・V1・I から R2
      I = pick(r, IV); var R2 = pick(r, RV); V2 = R2 * I; V1 = pick(r, [2, 4, 5, 6, 8, 10, 12, 15, 20, 30]); V = V1 + V2; ok = R2;
      w = [{x: V / I, why: "電源の電圧 $V$ を $I$ で割った"}, {x: V1 / I, why: "$V_1$ を $I$ で割った（$R_1$ を求めた）"}, {x: V2 * I, why: "割るところを掛けた"}];
      if (okNums(ok, w)) break;
    }
    var c2 = num(r, null, "O", ok, w);
    return {form: "r2", text: "図の直列回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$、電流は $I = " + qv(I, "A") + "$ である。$R_2$ は何 Ω か。",
            fig: SERF({src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), v2: "{V}_2", i: "{I}=" + qf(I, "A"), r2: "{R}_2"}), ch: c2.ch, ans: c2.ans,
            ex: ["$V_2 = V - V_1 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(V2, "V") + "$", "直列なので $R_2$ の電流も $I$", "$R_2 = \\dfrac{V_2}{I} = \\dfrac{" + fmt(V2) + "}{" + fmt(I) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "r2", p: {V: V, V1: V1, I: I}}};
  },
  // 2-3 並列回路：I = I1 + I2
  3: function(r){
    var f = pick(r, ["rule", "i2", "i2", "itot", "itot"]);
    if (f === "rule") return rule(r, "2つの抵抗を並列につないだ回路で、電流の関係を表す式は □ である。",
      PARF({i: "{I}", i1: "{I}_1", i2: "{I}_2"}),
      [["$I = I_1 + I_2$", "I=I1+I2"], ["$I = I_1 = I_2$", "I=I1=I2", "直列の電流の決まりと取り違えた"],
       ["$I = I_1 - I_2$", "I=I1-I2", "足すところを引いた"], ["$I = I_1 I_2$", "I=I1I2", "足すところを掛けた"]],
      ["並列では、電流は分かれてまた合流する", "$I = I_1 + I_2$"], "rule3");
    var I, I1, I2, w, ok;
    if (f === "i2") {
      for (;;) {
        I = pick(r, [3, 4, 5, 6, 8, 10, 12, 15, 20]); I1 = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]); ok = I - I1;
        w = [{x: I + I1, why: "$I$ と $I_1$ を足した"}, {x: I1 - I, why: "引く順が逆（$I_1$ から $I$ を引いた）"}, {x: I, why: "電流は分かれないと考えた"}];
        if (I1 < I && okNums(ok, w)) break;
      }
      var c = num(r, null, "A", ok, w);
      return {form: "i2", text: "図の並列回路で、電源から流れ出る電流は $I = " + qv(I, "A") + "$、$R_1$ を流れる電流は $I_1 = " + qv(I1, "A") + "$ である。$R_2$ を流れる電流 $I_2$ は何 A か。",
              fig: PARF({i: "{I}=" + qf(I, "A"), i1: "{I}_1=" + qf(I1, "A"), i2: "{I}_2"}), ch: c.ch, ans: c.ans,
              ex: ["$I = I_1 + I_2$ より $I_2 = I - I_1$", "$I_2 = " + fmt(I) + " - " + fmt(I1) + " = " + qv(ok, "A") + "$"], chk: {form: "i2", p: {I: I, I1: I1}}};
    }
    for (;;) {
      I1 = pick(r, [0.5, 1, 1.5, 2, 3, 4, 5, 6]); I2 = pick(r, [0.5, 1, 1.5, 2, 3, 4, 5, 6]); ok = I1 + I2;
      w = [{x: Math.abs(I1 - I2), why: "足すところを引いた"}, {x: I1 * I2, why: "足すところを掛けた"}, {x: I1, why: "直列と同じく、どこも同じ電流と考えた"}];
      if (I1 !== I2 && okNums(ok, w)) break;
    }
    var c2 = num(r, null, "A", ok, w);
    return {form: "itot", text: "図の並列回路で、$R_1$ を流れる電流は $I_1 = " + qv(I1, "A") + "$、$R_2$ を流れる電流は $I_2 = " + qv(I2, "A") + "$ である。電源から流れ出る電流 $I$ は何 A か。",
            fig: PARF({i: "{I}", i1: "{I}_1=" + qf(I1, "A"), i2: "{I}_2=" + qf(I2, "A")}), ch: c2.ch, ans: c2.ans,
            ex: ["分かれた電流の和が全体の電流", "$I = I_1 + I_2 = " + fmt(I1) + " + " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "itot", p: {I1: I1, I2: I2}}};
  },
  // 2-4 並列の電圧：V = V1 = V2
  4: function(r){
    var f = pick(r, ["rule", "cur", "cur", "res", "r1sub"]);
    if (f === "rule") return rule(r, "2つの抵抗を並列につないだ回路で、電源の電圧 $V$ と、抵抗の電圧 $V_1$・$V_2$ の関係を表す式は □ である。",
      PARF({src: "{V}", v1: "{V}_1", v2: "{V}_2"}),
      [["$V = V_1 = V_2$", "V=V1=V2"], ["$V = V_1 + V_2$", "V=V1+V2", "直列の電圧の決まりと取り違えた"],
       ["$V_1 = V_2 = \\dfrac{V}{2}$", "V/2", "電圧が2つの抵抗に等しく分かれてかかると考えた"], ["$V = V_1 - V_2$", "V=V1-V2", "並列の部分の電圧はどこも同じ（引いて求める物ではない）"]],
      ["並列の部分の電圧はどこも同じ", "$V = V_1 = V_2$"], "rule4");
    var V, R, I, I2, w, ok, k = r() < 0.5 ? "1" : "2";
    if (f === "cur") {               // V と Rk から Ik
      for (;;) {
        R = pick(r, RV); I = pick(r, IV); V = R * I; ok = I;
        w = [{x: V * R, why: "割るところを掛けた"}, {x: R / V, why: "割る順が逆（$R_" + k + "$ を $V$ で割った）"}, {x: I / 2, why: "電圧が2つの抵抗に等しく分かれてかかると考えた"}];
        if (okNums(ok, w)) break;
      }
      var c = num(r, null, "A", ok, w), L = {src: "{V}=" + qf(V, "V"), v1: "{V}_1", v2: "{V}_2"};
      L["r" + k] = "{R}_" + k + "=" + qf(R, "O"); L["i" + k] = "{I}_" + k;
      return {form: "cur", text: "図の並列回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_" + k + " = " + qv(R, "O") + "$ である。$R_" + k + "$ を流れる電流 $I_" + k + "$ は何 A か。",
              fig: PARF(L), ch: c.ch, ans: c.ans,
              ex: ["並列なので $V_" + k + " = V = " + qv(V, "V") + "$", "$I_" + k + " = \\dfrac{V_" + k + "}{R_" + k + "} = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "} = " + qv(ok, "A") + "$"],
              chk: {form: "cur", p: {V: V, R: R}}};
    }
    if (f === "res") {               // V と Ik から Rk
      for (;;) {
        R = pick(r, RV); I = pick(r, IV); V = R * I; ok = R;
        w = [{x: V * I, why: "割るところを掛けた"}, {x: I / V, why: "割る順が逆（$I_" + k + "$ を $V$ で割った）"}, {x: R / 2, why: "電圧が2つの抵抗に等しく分かれてかかると考えた"}];
        if (okNums(ok, w)) break;
      }
      var c2 = num(r, null, "O", ok, w), L2 = {src: "{V}=" + qf(V, "V")};
      L2["i" + k] = "{I}_" + k + "=" + qf(I, "A"); L2["r" + k] = "{R}_" + k;
      return {form: "res", text: "図の並列回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_" + k + "$ を流れる電流は $I_" + k + " = " + qv(I, "A") + "$ である。$R_" + k + "$ は何 Ω か。",
              fig: PARF(L2), ch: c2.ch, ans: c2.ans,
              ex: ["並列なので $R_" + k + "$ の電圧も $" + qv(V, "V") + "$", "$R_" + k + " = \\dfrac{V}{I_" + k + "} = \\dfrac{" + fmt(V) + "}{" + fmt(I) + "} = " + qv(ok, "O") + "$"],
              chk: {form: "res", p: {V: V, I: I}}};
    }
    for (;;) {                       // V・I・I2 から R1（I1 = I − I2）
      R = pick(r, RV); var I1 = pick(r, IV); I2 = pick(r, IV); V = R * I1; I = I1 + I2; ok = R;
      w = [{x: V / I, why: "全体の電流 $I$ で割った"}, {x: V / I2, why: "$I_2$ で割った（$R_2$ を求めた）"}, {x: V * I1, why: "割るところを掛けた"}];
      if (okNums(ok, w)) break;
    }
    var c3 = num(r, null, "O", ok, w);
    return {form: "r1sub", text: "図の並列回路で、電源の電圧は $V = " + qv(V, "V") + "$、電源から流れ出る電流は $I = " + qv(I, "A") + "$、$R_2$ を流れる電流は $I_2 = " + qv(I2, "A") + "$ である。$R_1$ は何 Ω か。",
            fig: PARF({src: "{V}=" + qf(V, "V"), i: "{I}=" + qf(I, "A"), i2: "{I}_2=" + qf(I2, "A"), i1: "{I}_1"}), ch: c3.ch, ans: c3.ans,
            ex: ["$I_1 = I - I_2 = " + fmt(I) + " - " + fmt(I2) + " = " + qv(I - I2, "A") + "$", "並列なので $R_1$ の電圧も $" + qv(V, "V") + "$",
                 "$R_1 = \\dfrac{V}{I_1} = \\dfrac{" + fmt(V) + "}{" + fmt(I - I2) + "} = " + qv(ok, "O") + "$"],
            chk: {form: "r1sub", p: {V: V, I: I, I2: I2}}};
  },
  // 2-5 直並列：直列の部分（R1）と並列の部分（R2・R3）に分けて考える
  5: function(r){
    var f = pick(r, ["rulev", "rulei", "v2", "v2", "i3", "iohm", "iohm"]);
    var figS = {src: "{V}", v1: "{V}_1", v2: "{V}_2", i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"};
    if (f === "rulev") return rule(r, "図の回路で、電源の電圧 $V$ と、$R_1$ の電圧 $V_1$、並列の部分の電圧 $V_2$ の関係を表す式は □ である。",
      SPF({src: "{V}", v1: "{V}_1", v2: "{V}_2"}),
      [["$V = V_1 + V_2$", "V=V1+V2"], ["$V = V_2$", "V=V2", "並列なのは分かれた所だけなので、電源の電圧とは等しくない"],
       ["$V = V_1 = V_2$", "V=V1=V2", "回路全体を並列と考えた"], ["$V = V_1 - V_2$", "V=V1-V2", "足すところを引いた"]],
      ["$R_1$ と並列の部分は直列", "$V = V_1 + V_2$"], "rule5v");
    if (f === "rulei") return rule(r, "図の回路で、電流 $I_1$・$I_2$・$I_3$ の関係を表す式は □ である。",
      SPF({i1: "{I}_1", i2: "{I}_2", i3: "{I}_3"}),
      [["$I_1 = I_2 + I_3$", "I1=I2+I3"], ["$I_1 = I_2 = I_3$", "I1=I2=I3", "回路全体を直列と考えた"],
       ["$I_2 = I_1 + I_3$", "I2=I1+I3", "分かれる前の電流と、分かれた後の電流を取り違えた"], ["$I_1 = I_2 - I_3$", "I1=I2-I3", "足すところを引いた"]],
      ["$I_1$ が並列の部分で $I_2$ と $I_3$ に分かれる", "$I_1 = I_2 + I_3$"], "rule5i");
    var V, V1, V2, I1, I2, R, w, ok;
    if (f === "v2") {
      for (;;) {
        V = pick(r, [10, 12, 15, 20, 24, 30, 40, 50, 60, 100]); V1 = Math.floor(r() * (V - 1)) + 1; ok = V - V1;
        w = [{x: V, why: "並列の部分にも電源の電圧 $V$ がかかると考えた"}, {x: V + V1, why: "$V$ と $V_1$ を足した"}, {x: V1, why: "$R_1$ の電圧と同じと考えた"}];
        if (okNums(ok, w)) break;
      }
      var c = num(r, null, "V", ok, w);
      return {form: "v2", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$ である。並列の部分の電圧 $V_2$ は何 V か。",
              fig: SPF({src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), v2: "{V}_2"}), ch: c.ch, ans: c.ans,
              ex: ["$V = V_1 + V_2$ より $V_2 = V - V_1$", "$V_2 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(ok, "V") + "$"], chk: {form: "v2", p: {V: V, V1: V1}}};
    }
    if (f === "i3") {
      for (;;) {
        I1 = pick(r, [2, 3, 4, 5, 6, 8, 10, 12]); I2 = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]); ok = I1 - I2;
        w = [{x: I1, why: "直列と同じく、電流は分かれないと考えた"}, {x: I1 + I2, why: "$I_1$ と $I_2$ を足した"}, {x: I2 - I1, why: "引く順が逆（$I_2$ から $I_1$ を引いた）"}];
        if (I2 < I1 && okNums(ok, w)) break;
      }
      var c2 = num(r, null, "A", ok, w);
      return {form: "i3", text: "図の回路で、$R_1$ を流れる電流は $I_1 = " + qv(I1, "A") + "$、$R_2$ を流れる電流は $I_2 = " + qv(I2, "A") + "$ である。$R_3$ を流れる電流 $I_3$ は何 A か。",
              fig: SPF({i1: "{I}_1=" + qf(I1, "A"), i2: "{I}_2=" + qf(I2, "A"), i3: "{I}_3"}), ch: c2.ch, ans: c2.ans,
              ex: ["$I_1 = I_2 + I_3$ より $I_3 = I_1 - I_2$", "$I_3 = " + fmt(I1) + " - " + fmt(I2) + " = " + qv(ok, "A") + "$"], chk: {form: "i3", p: {I1: I1, I2: I2}}};
    }
    var k = r() < 0.5 ? "2" : "3";
    for (;;) {                       // V・V1・Rk から Ik（並列の部分の電圧 V2 = V − V1）
      R = pick(r, RV); var Ik = pick(r, IV); V2 = R * Ik; V1 = pick(r, [2, 4, 5, 6, 8, 10, 12, 15, 20, 30]); V = V1 + V2; ok = Ik;
      w = [{x: V / R, why: "並列の部分にも電源の電圧 $V$ がかかると考えた"}, {x: V1 / R, why: "$V_1$ を $R_" + k + "$ で割った"}, {x: V2 * R, why: "割るところを掛けた"}];
      if (okNums(ok, w)) break;
    }
    var c3 = num(r, null, "A", ok, w), L = {src: "{V}=" + qf(V, "V"), v1: "{V}_1=" + qf(V1, "V"), v2: "{V}_2"};
    L["r" + k] = "{R}_" + k + "=" + qf(R, "O"); L["i" + k] = "{I}_" + k;
    return {form: "iohm", text: "図の回路で、電源の電圧は $V = " + qv(V, "V") + "$、$R_1$ にかかる電圧は $V_1 = " + qv(V1, "V") + "$ である。$R_" + k + " = " + qv(R, "O") + "$ を流れる電流 $I_" + k + "$ は何 A か。",
            fig: SPF(L), ch: c3.ch, ans: c3.ans,
            ex: ["並列の部分の電圧：$V_2 = V - V_1 = " + fmt(V) + " - " + fmt(V1) + " = " + qv(V2, "V") + "$", "$R_" + k + "$ にも $V_2$ がかかる",
                 "$I_" + k + " = \\dfrac{V_2}{R_" + k + "} = \\dfrac{" + fmt(V2) + "}{" + fmt(R) + "} = " + qv(ok, "A") + "$"],
            chk: {form: "iohm", p: {V: V, V1: V1, R: R}}};
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t2s1e","scene":"t2s1e","kind":"ser","lab":{"pm":1,"r1":"{R}_1","r2":"{R}_2","i":["{I}","{I}=5 A"],"i1":["{I}_1","{I}_1=5 A"],"i2":["{I}_2","{I}_2=5 A"]},"viewbox":"464 232 595 400","band":{"want":"直列回路の電流","ans":"$I = I_1 = I_2$","full":"直列：抵抗を一直線上に1本の道でつなぐつなぎ方。電流はどこも同じ。$I = I_1 = I_2$"},"narr":{"start":{"co":0,"io":0,"i1o":0,"i2o":0,"iv":0,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"①直列とは\n②電流の決まり\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"抵抗を一直線上に並べて、1本の道でつなぐつなぎ方を直列といいます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["R1","R2"],"move":"flow"},{"text":"直列につないだ回路を、直列回路といいます。","at":{"強調":1.0},"after":[],"emph":["R1","R2","src"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"1本の道なので、電流はどこで測っても同じ大きさです。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["I","I1","I2"],"move":"arrows"},{"text":"電源から出る電流 $I$ と、$R_1$ の電流 $I_1$、$R_2$ の電流 $I_2$ は等しくなります。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["I","I1","I2","R1","R2"],"eq":[{"cont":false,"items":[["I = I_1 = I_2"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"電源から $I = 5\\,\\mathrm{A}$ が流れているときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["I"],"move":"ival"},{"text":"$R_1$ と $R_2$ にも、同じ $5\\,\\mathrm{A}$ が流れます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I","I1","I2","R1","R2"],"eq":[{"cont":false,"items":[["I_1 = I_2 = 5\\,\\mathrm{A}"]]}],"move":"i12val","ans":true,"emphPre":["I","I1","I2","R1","R2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"]},"moves":{"flow":{"to":{"co":1},"dur":1.0},"arrows":{"to":{"io":1,"i1o":1,"i2o":1},"dur":0.6},"ival":{"to":{"iv":1},"dur":0.5},"i12val":{"to":{"i1v":1,"i2v":1},"dur":0.5}},"route":["直列とは","電流の決まり","数字で見る"]}},{"id":"t2s1x","scene":"t2s1x","kind":"ser","lab":{"pm":1,"r1":"{R}_1","r2":"{R}_2=5 Ω","i1":"{I}_1=2 A","i2":["{I}_2","{I}_2=2 A"],"v2":["{V}_2","{V}_2=10 V"]},"viewbox":"464 232 595 400","band":{"want":"$V_2$","known":"$I_1 = 2\\,\\mathrm{A},\\;\\; R_2 = 5\\,\\Omega$","ans":"$V_2 = 10\\,\\mathrm{V}$"},"narr":{"start":{"co":0,"i2v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"求めるのは、$R_2$ にかかる電圧 $V_2$ です。","at":{"強調":1.0},"after":[],"emph":["V2","R2"]},{"text":"分かっているのは、$I_1 = 2\\,\\mathrm{A}$ と $R_2 = 5\\,\\Omega$ です。","at":{"強調":1.0},"after":[],"emph":["I1","R2"]},{"text":"①電流を決める\n②電圧を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I1","I2"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列なので、$R_2$ にも $R_1$ と同じ電流が流れます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["I1","I2","R1","R2"],"eq":[{"cont":false,"items":[["I_2 = I_1"],["I_2 = 2\\,\\mathrm{A}"]]}],"move":"i2val","emphPre":["I1","I2","R1","R2"]}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"オームの法則で、$R_2$ にかかる電圧を求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V2","R2","I2"],"eq":[{"cont":false,"items":[["V_2 = R_2 I_2"],["V_2 = 5 \\times 2 = 10\\,\\mathrm{V}"]]}],"move":"v2val","ans":true,"emphPre":["V2","R2","I2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"]},"moves":{"i2val":{"to":{"i2v":1,"co":1},"dur":0.6},"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["電流を決める","電圧を出す"]}},{"id":"t2s2e","scene":"t2s2e","kind":"ser","lab":{"pm":1,"src":["{V}","{V}=50 V"],"r1":"{R}_1","r2":"{R}_2","v1":["{V}_1","{V}_1=30 V"],"v2":["{V}_2","{V}_2=20 V"],"pa":{"v":"50 V"},"pb":{"v":"0 V"},"pc":{"v":"20 V"}},"viewbox":"464 232 595 400","band":{"want":"直列の電圧","ans":"$V = V_1 + V_2$","full":"直列：電源の電圧は、各抵抗の電圧の和。$V = V_1 + V_2$。途中の点の電位は、抵抗を通るごとにその電圧の分だけ下がる。"},"narr":{"start":{"co":1,"v1d":0,"v2d":0,"srcv":0,"v1v":0,"v2v":0,"pao":0,"pbo":0,"pco":0,"pavo":0,"pbvo":0,"pcvo":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"①電圧の決まり\n②数字で見る\n③途中の点の電位\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列では、電源の電圧 $V$ が、抵抗にかかる電圧 $V_1$ と $V_2$ に分かれます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["src","V1","V2"],"move":"varrows"},{"text":"電源の電圧は、各抵抗の電圧の和になります。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V = V_1 + V_2"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"電源の電圧が $V = 50\\,\\mathrm{V}$、$R_1$ の電圧が $V_1 = 30\\,\\mathrm{V}$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["src","V1","R1"],"move":"v1val"},{"text":"$V_2$ は、電源の電圧から $V_1$ を引いて求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V_2 = V - V_1"],["V_2 = 50 - 30 = 20\\,\\mathrm{V}"]]}],"move":"v2val","emphPre":["src","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"－極の側の点 b を基準の $0\\,\\mathrm{V}$ とすると、＋極の側の点 a の電位は $50\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["pa","pb","src"],"move":"pab"},{"text":"点 a から $R_1$ を通ると、電位は $V_1$ の分だけ下がります。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["pa","R1","V1","pc"],"move":"pc"},{"text":"なので、点 c の電位は $20\\,\\mathrm{V}$ で、$V_2$ と同じ値です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["pc","V2","pb"],"move":"pcv","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"]},"moves":{"varrows":{"to":{"v1d":1,"v2d":1},"dur":0.8},"v1val":{"to":{"srcv":1,"v1v":1},"dur":0.5},"v2val":{"to":{"v2v":1},"dur":0.4},"pab":{"to":{"pao":1,"pbo":1,"pavo":1,"pbvo":1},"dur":0.6},"pc":{"to":{"pco":1},"dur":0.4},"pcv":{"to":{"pcvo":1},"dur":0.4}},"route":["電圧の決まり","数字で見る","途中の点の電位"]}},{"id":"t2s2x","scene":"t2s2x","kind":"ser","lab":{"pm":1,"src":"{V}=50 V","r1":"{R}_1","r2":"{R}_2","v1":"{V}_1=30 V","v2":["{V}_2","{V}_2=20 V"]},"viewbox":"464 232 595 400","band":{"want":"$V_2$","known":"$V = 50\\,\\mathrm{V},\\;\\; V_1 = 30\\,\\mathrm{V}$","ans":"$V_2 = 20\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"求めるのは、$R_2$ にかかる電圧 $V_2$ です。","at":{"強調":1.0},"after":[],"emph":["V2","R2"]},{"text":"分かっているのは、電源の電圧 $V$ と、$R_1$ の電圧 $V_1$ です。","at":{"強調":1.0},"after":[],"emph":["src","V1","R1"]},{"text":"①電圧の決まりを使う\n②数字を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","V1","V2"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列では、電源の電圧は各抵抗の電圧の和です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V = V_1 + V_2"],["V_2 = V - V_1"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"数字を入れると、次の式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V_2 = 50 - 30 = 20\\,\\mathrm{V}"]]}],"move":"v2val","ans":true,"emphPre":["src","V1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["電圧の決まりを使う","数字を入れる"]}},{"id":"t2s3e","scene":"t2s3e","kind":"par","lab":{"pm":1,"j":1,"r1":"{R}_1","r2":"{R}_2","i":["{I}","{I}=10 A"],"i1":["{I}_1","{I}_1=4 A"],"i2":["{I}_2","{I}_2=6 A"],"fl":[2.5,1,1.5]},"viewbox":"464 152 595 560","band":{"want":"並列回路の電流","ans":"$I = I_1 + I_2$","full":"並列：抵抗の両端どうしをつなぐつなぎ方。電流は分かれてまた合流する。$I = I_1 + I_2$"},"narr":{"start":{"co":0,"io":0,"i1o":0,"i2o":0,"iv":0,"i1v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"①並列とは\n②電流の決まり\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"抵抗の両端どうしをつなぐつなぎ方を、並列といいます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","j"]},{"text":"電流は途中で2つの道に分かれ、また合流して電源へ戻ります。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","R2","j"],"move":"flow"}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"電源から出る電流 $I$ は、$R_1$ の電流 $I_1$ と、$R_2$ の電流 $I_2$ に分かれます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["I","I1","I2","R1","R2"],"move":"arrows"},{"text":"分かれた電流を合わせると、元の電流に戻ります。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["I","I1","I2"],"eq":[{"cont":false,"items":[["I = I_1 + I_2"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"$I = 10\\,\\mathrm{A}$ のうち、$I_1 = 4\\,\\mathrm{A}$ が $R_1$ を流れるときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["I","I1","R1"],"move":"vals"},{"text":"$I_2$ は、全体の電流から $I_1$ を引いて求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["I","I1","I2"],"eq":[{"cont":false,"items":[["I_2 = I - I_1"],["I_2 = 10 - 4 = 6\\,\\mathrm{A}"]]}],"move":"i2val","ans":true,"emphPre":["I","I1","I2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"j":["dj1","dj2"]},"moves":{"flow":{"to":{"co":1},"dur":1.0},"arrows":{"to":{"io":1,"i1o":1,"i2o":1},"dur":0.6},"vals":{"to":{"iv":1,"i1v":1},"dur":0.5},"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["並列とは","電流の決まり","数字で見る"]}},{"id":"t2s3x","scene":"t2s3x","kind":"par","lab":{"pm":1,"j":1,"r1":"{R}_1","r2":"{R}_2","i":"{I}=12 A","i1":"{I}_1=5 A","i2":["{I}_2","{I}_2=7 A"],"fl":[2.4,1,1.4]},"viewbox":"464 152 595 560","band":{"want":"$I_2$","known":"$I = 12\\,\\mathrm{A},\\;\\; I_1 = 5\\,\\mathrm{A}$","ans":"$I_2 = 7\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"求めるのは、$R_2$ を流れる電流 $I_2$ です。","at":{"強調":1.0},"after":[],"emph":["I2","R2"]},{"text":"分かっているのは、全体の電流 $I$ と、$R_1$ の電流 $I_1$ です。","at":{"強調":1.0},"after":[],"emph":["I","I1","R1"]},{"text":"①電流の決まりを使う\n②数字を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["I","I1","I2"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"並列では、分かれた電流の和が全体の電流です。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["I","I1","I2"],"eq":[{"cont":false,"items":[["I = I_1 + I_2"],["I_2 = I - I_1"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"数字を入れると、次の式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["I","I1","I2"],"eq":[{"cont":false,"items":[["I_2 = 12 - 5 = 7\\,\\mathrm{A}"]]}],"move":"i2val","ans":true,"emphPre":["I","I1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"j":["dj1","dj2"]},"moves":{"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["電流の決まりを使う","数字を入れる"]}},{"id":"t2s4e","scene":"t2s4e","kind":"par","lab":{"pm":1,"j":1,"src":["{V}","{V}=24 V"],"r1":["{R}_1","{R}_1=6 Ω"],"r2":"{R}_2","v1":["{V}_1","{V}_1=24 V"],"v2":["{V}_2","{V}_2=24 V"],"i1":["{I}_1","{I}_1=4 A"],"fl":[2,1,1]},"viewbox":"464 152 595 560","band":{"want":"並列の電圧","ans":"$V = V_1 = V_2$","full":"並列：並列の部分の電圧はどこも同じ。$V = V_1 = V_2$"},"narr":{"start":{"co":1,"v1d":0,"v2d":0,"srcv":0,"v1v":0,"v2v":0,"r1v":0,"i1v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"①並列の電圧\n②数字で見る\n③電流を求める\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"$R_1$ と $R_2$ は、どちらも同じ2つの点の間につながっています。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R1","R2","j"]},{"text":"なので、並列の部分の電圧はどこも同じです。","at":{"強調":1.0,"動き":1.0,"式":1.0},"after":[],"emph":["src","V1","V2"],"move":"varrows","eq":[{"cont":false,"items":[["V = V_1 = V_2"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"電源の電圧が $V = 24\\,\\mathrm{V}$ なら、$R_1$ と $R_2$ にも $24\\,\\mathrm{V}$ がかかります。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["src","V1","V2","R1","R2"],"move":"vvals"}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"$R_1 = 6\\,\\Omega$ のときの、$R_1$ を流れる電流 $I_1$ を求めます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R1","I1"],"move":"r1val"},{"text":"$R_1$ にかかる電圧は $V_1$ なので、オームの法則から次の式になります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["R1","V1","I1"],"eq":[{"cont":false,"items":[["I_1 = \\dfrac{V_1}{R_1}"],["I_1 = \\dfrac{24}{6} = 4\\,\\mathrm{A}"]]}],"move":"i1val","ans":true,"emphPre":["R1","V1","I1"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"j":["dj1","dj2"]},"moves":{"varrows":{"to":{"v1d":1,"v2d":1},"dur":0.8},"vvals":{"to":{"srcv":1,"v1v":1,"v2v":1},"dur":0.5},"r1val":{"to":{"r1v":1},"dur":0.4},"i1val":{"to":{"i1v":1},"dur":0.4}},"route":["並列の電圧","数字で見る","電流を求める"]}},{"id":"t2s4x","scene":"t2s4x","kind":"par","lab":{"pm":1,"j":1,"src":"{V}=12 V","r1":"{R}_1","r2":"{R}_2=6 Ω","v2":["{V}_2","{V}_2=12 V"],"i2":["{I}_2","{I}_2=2 A"],"fl":[2,1,1]},"viewbox":"464 152 595 560","band":{"want":"$I_2$","known":"$V = 12\\,\\mathrm{V},\\;\\; R_2 = 6\\,\\Omega$","ans":"$I_2 = 2\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"v2v":0,"i2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"求めるのは、$R_2$ を流れる電流 $I_2$ です。","at":{"強調":1.0},"after":[],"emph":["I2","R2"]},{"text":"分かっているのは、電源の電圧 $V$ と $R_2$ です。","at":{"強調":1.0},"after":[],"emph":["src","R2"]},{"text":"①電圧を決める\n②電流を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["src","V2"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"並列の部分の電圧はどこも同じなので、$R_2$ にも電源の電圧がかかります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","V2","R2"],"eq":[{"cont":false,"items":[["V_2 = V"],["V_2 = 12\\,\\mathrm{V}"]]}],"move":"v2val","emphPre":["src","V2","R2"]}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"オームの法則で、$R_2$ を流れる電流を求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V2","R2","I2"],"eq":[{"cont":false,"items":[["I_2 = \\dfrac{V_2}{R_2}"],["I_2 = \\dfrac{12}{6} = 2\\,\\mathrm{A}"]]}],"move":"i2val","ans":true,"emphPre":["V2","R2","I2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"I":["ia","ia:h","it0","it1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"j":["dj1","dj2"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4},"i2val":{"to":{"i2v":1},"dur":0.4}},"route":["電圧を決める","電流を出す"]}},{"id":"t2s5e","scene":"t2s5e","kind":"sp","lab":{"pm":1,"j":1,"src":["{V}","{V}=30 V"],"r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","i1":"{I}_1","i2":"{I}_2","i3":"{I}_3","v1":["{V}_1","{V}_1=18 V"],"v2":["{V}_2","{V}_2=12 V"],"fl":[2,1,1]},"viewbox":"464 152 595 560","band":{"want":"直並列の電流と電圧","ans":"$I_1 = I_2 + I_3$・$V = V_1 + V_2$","full":"直並列：直列の部分と並列の部分に分けて考える。直列の部分の電流が並列の部分で分かれる（$I_1 = I_2 + I_3$）。電源の電圧は直列の部分と並列の部分の電圧の和（$V = V_1 + V_2$）。並列なのは分かれた所だけなので、$V$ と $V_2$ は等しくない。"},"narr":{"start":{"co":0,"i1o":0,"i2o":0,"i3o":0,"v1d":0,"v2d":0,"srcv":0,"v1v":0,"v2v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"①直列の部分と並列の部分\n②電流の関係\n③電圧の関係\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"$R_1$ は、電源と1本の道でつながった直列の部分です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["R1"],"move":"flow"},{"text":"$R_2$ と $R_3$ は、両端どうしがつながった並列の部分です。","at":{"強調":1.0},"after":[],"emph":["R2","R3","j"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"直列の部分の電流 $I_1$ は、並列の部分で $I_2$ と $I_3$ に分かれます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0,"式":1.0},"after":[],"route":2,"emph":["I1","I2","I3"],"move":"arrows","eq":[{"cont":false,"items":[["I_1 = I_2 + I_3"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"電源の電圧 $V$ は、直列の部分の $V_1$ と、並列の部分の $V_2$ の和です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0,"式":1.0},"after":[],"route":3,"emph":["src","V1","V2"],"move":"varrows","eq":[{"cont":false,"items":[["V = V_1 + V_2"]]}]},{"text":"並列なのは分かれた所だけなので、$V$ と $V_2$ は等しくありません。","at":{"強調":1.0},"after":[],"emph":["src","V2"]},{"text":"$V = 30\\,\\mathrm{V}$、$V_1 = 18\\,\\mathrm{V}$ のときを考えます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["src","V1"],"move":"vals"},{"text":"並列の部分の電圧 $V_2$ は、$V$ から $V_1$ を引いて求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V_2 = V - V_1"],["V_2 = 30 - 18 = 12\\,\\mathrm{V}"]]}],"move":"v2val","ans":true,"emphPre":["src","V1","V2"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"V3":["v3d:e","v3d:f","v3d:a","v3t0","v3t1"],"j":["dj1","dj2"]},"moves":{"flow":{"to":{"co":1},"dur":1.0},"arrows":{"to":{"i1o":1,"i2o":1,"i3o":1},"dur":0.6},"varrows":{"to":{"v1d":1,"v2d":1},"dur":0.8},"vals":{"to":{"srcv":1,"v1v":1},"dur":0.5},"v2val":{"to":{"v2v":1},"dur":0.4}},"route":["直列の部分と並列の部分","電流の関係","電圧の関係"]}},{"id":"t2s5x","scene":"t2s5x","kind":"sp","lab":{"pm":1,"j":1,"src":"{V}=40 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3=4 Ω","v1":"{V}_1=28 V","v2":["{V}_2","{V}_2=12 V"],"i3":["{I}_3","{I}_3=3 A"],"fl":[2,1,1]},"viewbox":"464 152 595 560","band":{"want":"$I_3$","known":"$V = 40\\,\\mathrm{V},\\;\\; V_1 = 28\\,\\mathrm{V},\\;\\; R_3 = 4\\,\\Omega$","ans":"$I_3 = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":1,"v2v":0,"i3v":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"求めるのは、$R_3$ を流れる電流 $I_3$ です。","at":{"強調":1.0},"after":[],"emph":["I3","R3"]},{"text":"分かっているのは、$V$ と $V_1$、$R_3$ です。","at":{"強調":1.0},"after":[],"emph":["src","V1","R3"]},{"text":"①並列の部分の電圧\n②電流を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V2","I3"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"電源の電圧は、直列の部分と並列の部分の電圧の和です。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"route":1,"emph":["src","V1","V2"],"eq":[{"cont":false,"items":[["V = V_1 + V_2"],["V_2 = V - V_1"],["V_2 = 40 - 28 = 12\\,\\mathrm{V}"]]}],"move":"v2val","emphPre":["src","V1","V2"]},{"text":"$R_3$ は $R_2$ と並列なので、$R_3$ にも $V_2$ がかかります。","at":{"強調":1.0},"after":[],"emph":["V2","R2","R3"]}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"オームの法則で、$R_3$ を流れる電流を求めます。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V2","R3","I3"],"eq":[{"cont":false,"items":[["I_3 = \\dfrac{V_2}{R_3}"],["I_3 = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"i3val","ans":true,"emphPre":["V2","R3","I3"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"I1":["i1a","i1a:h","i1t0","i1t1"],"I2":["i2a","i2a:h","i2t0","i2t1"],"I3":["i3a","i3a:h","i3t0","i3t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"V3":["v3d:e","v3d:f","v3d:a","v3t0","v3t1"],"j":["dj1","dj2"]},"moves":{"v2val":{"to":{"v2v":1},"dur":0.4},"i3val":{"to":{"i3v":1},"dur":0.4}},"route":["並列の部分の電圧","電流を出す"]}},{"id":"t2k1x","scene":"t2k1x","kind":"pq25","lab":{"r":"{R}","rx":"{R}_x","v":"{V}","i":"{I}","ir":"{I}_R","ix":"{I}_x"},"viewbox":"452 212 618 370","band":{"want":"$R_x$ の式","known":"$V,\\;\\; I,\\;\\; R$","ans":"$R_x = VR/(IR - V)$"},"narr":{"start":{"iro":0,"ixo":0},"steps":[{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"求めるのは、抵抗 $R_x$ を表す式です。","at":{"強調":1.0},"after":[],"emph":["Rx"]},{"text":"分かっているのは、電圧 $V$、電流 $I$、抵抗 $R$ です。","at":{"強調":1.0},"after":[],"emph":["V","I","R"]},{"text":"①電圧を見る\n②電流の式を立てる\n③式を変形する\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R","Rx"]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"$R$ と $R_x$ は並列なので、どちらにも電圧 $V$ がかかります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["R","Rx","V","j"]}]},{"cap":null,"eqp":null,"vid":[1,2],"sents":[{"text":"$R$ を流れる電流を $I_R$、$R_x$ を流れる電流を $I_x$ とします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["IR","Ix","R","Rx"],"move":"ishow"},{"text":"オームの法則から、それぞれの電流は次の式です。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["IR","Ix","R","Rx","V"],"eq":[{"cont":false,"items":[["I_R = \\dfrac{V}{R}","I_x = \\dfrac{V}{R_x}"]]}]},{"text":"並列では、分かれた電流の和が全体の電流 $I$ です。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["I","IR","Ix","R","Rx","V"],"eq":[{"cont":false,"items":[["I = I_R + I_x"],["I = \\dfrac{V}{R} + \\dfrac{V}{R_x}"]]}]}]},{"cap":null,"eqp":null,"vid":[2],"sents":[{"text":"この式を、$R_x$ の式に変形します。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"答え":1.0},"after":["答え","強調"],"route":3,"emph":["Rx","I","R","V"],"eq":[{"cont":false,"items":[["\\dfrac{V}{R_x} = I - \\dfrac{V}{R}"],["\\dfrac{V}{R_x} = \\dfrac{IR - V}{R}"],["R_x = \\dfrac{VR}{IR - V}"]]}],"ans":true,"emphPre":["Rx","I","R","V"]}]}],"groups":{"R":["r","rt0"],"Rx":["rx","rxt0"],"V":["va","va:h","vt0"],"I":["ia","ia:h","it0"],"IR":["ira","ira:h","irt0"],"Ix":["ixa","ixa:h","ixt0"],"j":["dj1","dj2"]},"moves":{"ishow":{"to":{"iro":1,"ixo":1},"dur":0.6}},"route":["電圧を見る","電流の式を立てる","式を変形する"]}}],"secs":[{"ex":{"text":"図の直列回路で、$R_1$ を流れる電流は $I_1 = 2\\,\\mathrm{A}$ である。$R_2 = 5\\,\\Omega$ にかかる電圧 $V_2$ は何 V か。","fig":{"kind":"ser","L":{"pm":1,"r1":"{R}_1","r2":"{R}_2=5 Ω","i1":"{I}_1=2 A","i2":"{I}_2","v2":"{V}_2"},"P":{}},"ch":[{"t":"$2.5\\,\\mathrm{V}$","v":2.5,"why":"$R_2$ を $I_2$ で割った"},{"t":"$10\\,\\mathrm{V}$","v":10,"why":""},{"t":"$5\\,\\mathrm{V}$","v":5,"why":"電流が2つの抵抗に等しく分かれると考えた"},{"t":"$0.4\\,\\mathrm{V}$","v":0.4,"why":"$I_2$ を $R_2$ で割った"}],"ans":1}},{"ex":{"text":"図の直列回路で、電源の電圧は $V = 50\\,\\mathrm{V}$、$R_1$ にかかる電圧は $V_1 = 30\\,\\mathrm{V}$ である。$R_2$ にかかる電圧 $V_2$ は何 V か。","fig":{"kind":"ser","L":{"pm":1,"src":"{V}=50 V","r1":"{R}_1","r2":"{R}_2","v1":"{V}_1=30 V","v2":"{V}_2"},"P":{}},"ch":[{"t":"$80\\,\\mathrm{V}$","v":80,"why":"$V$ と $V_1$ を足した"},{"t":"$20\\,\\mathrm{V}$","v":20,"why":""},{"t":"$50\\,\\mathrm{V}$","v":50,"why":"電源の電圧がそのまま $R_2$ にかかると考えた"},{"t":"$-20\\,\\mathrm{V}$","v":-20,"why":"引く順が逆（$V_1$ から $V$ を引いた）"}],"ans":1}},{"ex":{"text":"図の並列回路で、電源から流れ出る電流は $I = 12\\,\\mathrm{A}$、$R_1$ を流れる電流は $I_1 = 5\\,\\mathrm{A}$ である。$R_2$ を流れる電流 $I_2$ は何 A か。","fig":{"kind":"par","L":{"pm":1,"j":1,"r1":"{R}_1","r2":"{R}_2","i":"{I}=12 A","i1":"{I}_1=5 A","i2":"{I}_2"},"P":{}},"ch":[{"t":"$17\\,\\mathrm{A}$","v":17,"why":"$I$ と $I_1$ を足した"},{"t":"$7\\,\\mathrm{A}$","v":7,"why":""},{"t":"$12\\,\\mathrm{A}$","v":12,"why":"電流は分かれないと考えた"},{"t":"$5\\,\\mathrm{A}$","v":5,"why":"直列と同じく、どこも同じ電流と考えた"}],"ans":1}},{"ex":{"text":"図の並列回路で、電源の電圧は $V = 12\\,\\mathrm{V}$、$R_2 = 6\\,\\Omega$ である。$R_2$ を流れる電流 $I_2$ は何 A か。","fig":{"kind":"par","L":{"pm":1,"j":1,"src":"{V}=12 V","r1":"{R}_1","r2":"{R}_2=6 Ω","v2":"{V}_2","i2":"{I}_2"},"P":{}},"ch":[{"t":"$72\\,\\mathrm{A}$","v":72,"why":"割るところを掛けた"},{"t":"$2\\,\\mathrm{A}$","v":2,"why":""},{"t":"$0.5\\,\\mathrm{A}$","v":0.5,"why":"割る順が逆（$R_2$ を $V_2$ で割った）"},{"t":"$1\\,\\mathrm{A}$","v":1,"why":"電圧が2つの抵抗に等しく分かれてかかると考えた"}],"ans":1}},{"ex":{"text":"図の回路で、電源の電圧は $V = 40\\,\\mathrm{V}$、$R_1$ にかかる電圧は $V_1 = 28\\,\\mathrm{V}$ である。$R_3 = 4\\,\\Omega$ を流れる電流 $I_3$ は何 A か。","fig":{"kind":"sp","L":{"pm":1,"j":1,"src":"{V}=40 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3=4 Ω","v1":"{V}_1=28 V","v2":"{V}_2","i3":"{I}_3"},"P":{}},"ch":[{"t":"$10\\,\\mathrm{A}$","v":10,"why":"並列の部分にも電源の電圧 $V$ がかかると考えた"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$7\\,\\mathrm{A}$","v":7,"why":"$V_1$ を $R_3$ で割った"},{"t":"$48\\,\\mathrm{A}$","v":48,"why":"割るところを掛けた"}],"ans":1}}],"past":[{"id":"h25q5","title":"平成25年 問5","text":"図のように，抵抗 $R$ [Ω] と抵抗 $R_x$ [Ω] を並列に接続した回路がある。この回路に直流電圧 $V$ [V] を加えたところ，電流 $I$ [A] が流れた。$R_x$ [Ω] の値を表す式として，正しいものを次の(1)～(5)のうちから一つ選べ。","fig":{"kind":"pq25","L":{"r":"{R} [Ω]","rx":"{R}_x [Ω]","v":"{V} [V]","i":"{I} [A]"},"P":{}},"ch":[{"t":"$\\dfrac{V}{I} + R$","v":"1","why":""},{"t":"$\\dfrac{V}{I} - R$","v":"2","why":""},{"t":"$\\dfrac{R}{\\dfrac{IR}{V} - V}$","v":"3","why":""},{"t":"$\\dfrac{V}{\\dfrac{I}{V - R}}$","v":"4","why":""},{"t":"$\\dfrac{VR}{IR - V}$","v":"5","why":""}],"ans":4,"slide":"t2k1x","credit":"出典：一般財団法人 電気技術者試験センター 平成25年度 第三種 理論 問5（図は描き直し）"}]}};
});
