/* 単元1「オームの法則」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(1, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元1の図（自作）。共通の部品（vdim・pv・swapText）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 1つの抵抗と電源の回路
function tbLoop(d, p, L){
  var yb = pv(p, "yb", 490);
  d.wire("L", [[478, 360], [478, yb], [752, yb]]);
  d.wire("Rw", [[772, yb], [1045, yb], [1045, 360]]);
  d.wire("wl", [[478, 360], [730, 360]]); d.wire("wr", [[790, 360], [1045, 360]]);
  d.cell("c", 752, yb);
  if (L.pm) { d.text("pp", 722, yb - 26, "+"); d.text("pm", 802, yb - 26, "−"); }   // 電流の名前（y=424）と離す
  if (L.src) d.text("e1", 762, yb + 42, L.src);
  d.res("r", 760, 360, "h");
  // 抵抗の名前：r0 → r1（rv）→ r2（rb）
  var rv = pv(p, "rv"), rb = pv(p, "rb");
  if (L.r0) d.text("rt0", 760, 330, L.r0, {o: L.r1 ? 1 - rv : 1});
  if (L.r1) d.text("rt1", 760, 330, L.r1, {o: rv * (L.r2 ? 1 - rb : 1)});
  if (L.r2) d.text("rt2", 760, 330, L.r2, {o: rb});
  // 電流の矢印（上の線の下・右向き）
  if (L.i0 || L.i1) {
    var ia = pv(p, "ia"), ax = L.iax || 760;
    d.arrow("ia", ax - 32, 394, ax + 32, 394, {o: ia});
    swapText(d, "it", ax, 424, L.i0, L.i1, pv(p, "iv"), ia);
  }
  // 2本目の電流の矢印：L.ibx があれば上の線の下、無ければ左の線の内側（上向き）
  if (L.ib0 || L.ib1) {
    var ib = pv(p, "ib");
    if (L.ibx) {
      d.arrow("ib", L.ibx - 32, 394, L.ibx + 32, 394, {o: ib});
      swapText(d, "ibt", L.ibx, 424, L.ib0, L.ib1, pv(p, "ibv"), ib);
    } else {
      d.arrow("ib", 508, yb - 30, 508, yb - 96, {o: ib});
      swapText(d, "ibt", 526, yb - 63, L.ib0, L.ib1, pv(p, "ibv"), ib, {anchor: "start"});
    }
  }
  // 点 a・b（点・名前・電位）
  [["a", L.pa, "pa", "pva", L.va], ["b", L.pb, "pb", "pvb", L.vb]].forEach(function(q){
    var P = q[1]; if (!P) return;
    var o = pv(p, q[2], 1), x = P.x;
    d.dot("d" + q[0], x, 360, {o: o});
    d.text("n" + q[0], x, L.nameUp ? 328 : 390, q[0], {o: o});
    if (q[4]) d.text("v" + q[0], x, 328, q[4], {o: pv(p, q[3], 1)});
  });
  // 抵抗にかかる電圧の矢印（左の端が高い＝電流が入る端）
  if (L.v0 || L.v1) {
    var w = vdim(d, "vd", 687.5, 832.5, 350, 265, 275, pv(p, "vd"), {});
    swapText(d, "vt", 760, 250, L.v0, L.v1, pv(p, "vv"), w);
  }
  // 電子の動く向き（上の線の右側・左向き）
  if (L.el) {
    var e = pv(p, "el");
    d.arrow("ea", 976, 326, 904, 326, {o: e});
    d.text("eat", 940, 298, "電子", {o: e});
  }
}
// 抵抗1つと両端の点 a・b（電位と電位差）
function tbSeg(d, p, L){
  d.wire("wl", [[560, 360], [730, 360]]); d.wire("wr", [[790, 360], [960, 360]]);
  d.res("r", 760, 360, "h");
  d.dot("da", 560, 360); d.dot("db", 960, 360);
  d.text("na", 560, 392, "a"); d.text("nb", 960, 392, "b");
  if (L.va) d.text("va", 560, 328, L.va);
  if (L.vb) d.text("vb", 960, 328, L.vb);
  if (L.v0 || L.v1) {
    var hl = L.hiLeft !== false;
    var w = vdim(d, "vd", hl ? 687.5 : 832.5, hl ? 832.5 : 687.5, 350, 265, 275, pv(p, "vd", 1), {});
    swapText(d, "vt", 760, 250, L.v0, L.v1, pv(p, "vv"), w);
  }
}
// 同じ電源に、抵抗を別々につないだ回路2つ（左＝R1・右＝R2）
function tbTwo(d, p, L){
  [[0, "1"], [300, "2"]].forEach(function(q){
    var o = q[0], k = q[1];
    d.wire("L" + k, [[500 + o, 360], [500 + o, 490], [600 + o, 490]]);
    d.wire("R" + k, [[620 + o, 490], [720 + o, 490], [720 + o, 360]]);
    d.wire("tl" + k, [[500 + o, 360], [580 + o, 360]]); d.wire("tr" + k, [[640 + o, 360], [720 + o, 360]]);
    d.cell("c" + k, 600 + o, 490);
    d.res("r" + k, 610 + o, 360, "h");
    d.text("rt" + k, 610 + o, 330, L["r" + k]);
  });
}
var KINDS = {loop: tbLoop, seg: tbSeg, two: tbTwo};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I
var FLOWK = {
  loop: function(p, L){
    var yb = pv(p, "yb", 490);
    return {o: pv(p, "co"), base: 110, paths: [{I: pv(p, "fi", 1), pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  two: function(p, L){
    var P = function(o, I){ return {I: I, pts: [[600 + o, 490], [500 + o, 490], [500 + o, 360], [720 + o, 360], [720 + o, 490], [620 + o, 490]]}; };
    return {o: pv(p, "co"), base: 60, paths: [P(0, L.i1 || 1), P(300, L.i2 || 1)]};
  }
};

// 単元1の練習問題の作り方。共通の道具（rngOf・choices・num・unitQ など）は tb_gen.js。
var LOOPF = function(L, P){ return {kind: "loop", L: L, P: Object.assign({rv: 1, iv: 1, vv: 1, vd: 1, ia: 1, ib: 1, ibv: 1, el: 1}, P || {})}; };
var GEN = {
  // 1-1 電流
  1: function(r){
    var f = pick(r, ["unit", "sym", "dir", "same", "same"]);
    if (f === "unit") { var x = pick(r, [1, 2, 3, 5]); return unitQ(r, "電流", "A", LOOPF({pm: 1, i0: "{I}=" + x + " □"})); }
    if (f === "sym") {
      var c = choices(r, [{t: "$I$", v: "I"}, {t: "$V$", v: "V", why: "V は電圧の記号"}, {t: "$R$", v: "R", why: "R は抵抗の記号"}, {t: "$\\mathrm{A}$", v: "A", why: "A は電流の単位（記号ではない）"}]);
      return {form: "sym", text: "電流を表す記号は □ である。", fig: LOOPF({pm: 1, i0: "□"}), ch: c.ch, ans: c.ans, ex: ["電流の記号は $I$、単位は $\\mathrm{A}$"], chk: {form: "sym", p: {q: "電流"}}};
    }
    if (f === "dir") {
      var t = function(a, b){ return "電流 " + a + "・電子 " + b; }, PM = "$+ \\to -$", MP = "$- \\to +$";
      var c2 = choices(r, [{t: t(PM, MP), v: "pm_mp"}, {t: t(MP, PM), v: "mp_pm", why: "電流と電子の向きを入れ替えて覚えた"},
                           {t: t(PM, PM), v: "pm_pm", why: "電子も電流と同じ向きに動くと考えた"}, {t: t(MP, MP), v: "mp_mp", why: "電流は＋極から出る向き"}]);
      return {form: "dir", text: "電源の極で見た、電流の向きと電子の動く向きの組で正しいものは □ である。", fig: LOOPF({pm: 1, r0: "{R}"}),
              ch: c2.ch, ans: c2.ans, ex: ["電流は ＋極 → －極", "電子はその逆で －極 → ＋極"], chk: {form: "dir", p: {}}};
    }
    // 数字：1本の道の電流
    var I = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]), aLeft = r() < 0.5;
    var xa = aLeft ? 600 : 920, xb = aLeft ? 920 : 600;
    var w = [{x: I / 2, why: "抵抗を通ると電流が減ると考えた"}, {x: I * 2, why: "抵抗を通ると電流が増えると考えた"}, {x: 0, why: "抵抗で電流が止まると考えた"}];
    var c3 = num(r, null, "A", I, w);
    return {form: "same", text: "1本の道でつながった図の回路で、点 a を流れる電流は $" + qv(I, "A") + "$ である。点 b を流れる電流は何 A か。",
            fig: LOOPF({pm: 1, nameUp: 1, pa: {x: xa}, pb: {x: xb}, iax: xa, i0: "{I}_a=" + qf(I, "A"), ibx: xb, ib0: "{I}_b"}, {ibv: 0}),
            ch: c3.ch, ans: c3.ans, ex: ["1本の道では、電流はどこでも同じ", "$I_b = I_a = " + qv(I, "A") + "$"], chk: {form: "same", p: {I: I}}};
  },
  // 1-2 電圧
  2: function(r){
    var f = pick(r, ["unit", "arrow", "pd", "pd", "pot"]);
    if (f === "unit") { var e = pick(r, [6, 12, 20, 24]); return unitQ(r, "電圧", "V", LOOPF({pm: 1, src: e + " □"})); }
    if (f === "arrow") {
      var c = choices(r, [{t: "電位の低い方から高い方へ", v: "lh"}, {t: "電位の高い方から低い方へ", v: "hl", why: "矢印は低い方から高い方へ向ける"},
                          {t: "電源の＋極から－極へ", v: "pm", why: "矢印の向きは電位で決める"}, {t: "どちら向きでもよい", v: "any", why: "逆向きに引くと電位差の正と負が変わる"}]);
      return {form: "arrow", text: "電圧の矢印は □ 向けて引く。", fig: {kind: "seg", L: {v0: "{V}"}, P: {vd: 1}},
              ch: c.ch, ans: c.ans, ex: ["電圧の矢印は、電位の低い方から高い方へ向けて引く"], chk: {form: "arrow", p: {}}};
    }
    if (f === "pot") {
      var E = pick(r, [3, 6, 9, 12, 15, 20, 24, 30, 48, 100]);
      var c4 = num(r, null, "V", E, [{x: 0, why: "点 a も基準と同じ電位と考えた"}, {x: -E, why: "基準を＋極の側にとった"}, {x: E / 2, why: "電源の電圧を2で割った"}]);
      return {form: "pot", text: "図の回路で、電源の電圧は $" + qv(E, "V") + "$ である。－極の側の点 b を基準の $0\\,\\mathrm{V}$ とすると、点 a の電位は何 V か。",
              fig: LOOPF({pm: 1, src: qf(E, "V"), pa: {x: 600}, pb: {x: 920}, vb: "0 V"}), ch: c4.ch, ans: c4.ans,
              ex: ["点 a は＋極の側なので、電位は電源の電圧と同じ", "$" + qv(E, "V") + "$"], chk: {form: "pot", p: {E: E}}};
    }
    // 数字：電位差
    var hi = Math.floor(r() * 28) + 3, lo = Math.floor(r() * (hi - 1)) + 1, aHi = r() < 0.5;
    var va = aHi ? hi : lo, vb = aHi ? lo : hi;
    var c5 = num(r, null, "V", hi - lo, [{x: hi + lo, why: "2つの電位を足した"}, {x: lo - hi, why: "低い方から高い方を引いた（引く順が逆）"}, {x: hi, why: "高い方の電位だけを見た"}]);
    return {form: "pd", text: "図の抵抗をはさむ点 a、b の電位は、a が $" + qv(va, "V") + "$、b が $" + qv(vb, "V") + "$ である。矢印の向きの電圧 $V$ は何 V か。",
            fig: {kind: "seg", L: {va: qf(va, "V"), vb: qf(vb, "V"), hiLeft: aHi, v0: "{V}"}, P: {vd: 1}}, ch: c5.ch, ans: c5.ans,
            ex: ["電位差＝高い方 − 低い方", "$V = " + hi + " - " + lo + " = " + qv(hi - lo, "V") + "$"], chk: {form: "pd", p: {va: va, vb: vb}}};
  },
  // 1-3 抵抗
  3: function(r){
    var f = pick(r, ["unit", "sym", "big", "cmp", "cmp"]);
    if (f === "unit") { var x = pick(r, [5, 10, 20, 50]); return unitQ(r, "抵抗", "O", LOOPF({pm: 1, r0: "{R}=" + x + " □"})); }
    if (f === "sym") {
      var c = choices(r, [{t: "$R$", v: "R"}, {t: "$I$", v: "I", why: "I は電流の記号"}, {t: "$V$", v: "V", why: "V は電圧の記号"}, {t: "$\\Omega$", v: "Ω", why: "Ω は抵抗の単位（記号ではない）"}]);
      return {form: "sym", text: "抵抗を表す記号は □ である。", fig: LOOPF({pm: 1, r0: "□"}), ch: c.ch, ans: c.ans, ex: ["抵抗の記号は $R$、単位は $\\Omega$"], chk: {form: "sym", p: {q: "抵抗"}}};
    }
    if (f === "big") {
      var big = r() < 0.5;
      var c2 = choices(r, [{t: big ? "流れにくくなる" : "流れやすくなる", v: big ? "hard" : "easy"},
                           {t: big ? "流れやすくなる" : "流れにくくなる", v: big ? "easy" : "hard", why: "抵抗が大きいほど流れにくく、小さいほど流れやすい"},
                           {t: "変わらない", v: "same", why: "抵抗の大きさで電流の流れ方は変わる"}, {t: "逆向きに流れる", v: "rev", why: "抵抗の大きさで向きは変わらない"}]);
      return {form: "big", text: "抵抗が" + (big ? "大きい" : "小さい") + "ほど、電流は □ 。", fig: LOOPF({pm: 1, r0: "{R}", i0: "{I}"}), ch: c2.ch, ans: c2.ans,
              ex: ["抵抗は電流の流れにくさ", "大きいほど流れにくく、小さいほど流れやすい"], chk: {form: "big", p: {big: big}}};
    }
    // 数字：2つの回路を比べる
    var RS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50], R1 = pick(r, RS), R2;
    do { R2 = pick(r, RS); } while (R2 === R1);
    var hard = r() < 0.5, ok = (hard ? R1 > R2 : R1 < R2) ? "R1" : "R2";
    var lab = {R1: "$R_1 = " + qv(R1, "O") + "$ の回路", R2: "$R_2 = " + qv(R2, "O") + "$ の回路"};
    var other = ok === "R1" ? "R2" : "R1";
    var c3 = choices(r, [{t: lab[ok], v: ok}, {t: lab[other], v: other, why: hard ? "抵抗が大きい方が流れにくい" : "抵抗が小さい方が流れやすい"},
                         {t: "どちらも同じ", v: "same", why: "電源が同じでも、抵抗が違えば流れ方は違う"}, {t: "決められない", v: "nd", why: "抵抗の大きさを比べれば決められる"}]);
    return {form: "cmp", text: "同じ電源に、$R_1 = " + qv(R1, "O") + "$ と $R_2 = " + qv(R2, "O") + "$ の抵抗を別々につないだ。電流が" + (hard ? "流れにくい" : "流れやすい") + "のはどちらの回路か。",
            fig: {kind: "two", L: {r1: "{R}_1=" + qf(R1, "O"), r2: "{R}_2=" + qf(R2, "O")}, P: {}}, ch: c3.ch, ans: c3.ans,
            ex: ["抵抗が大きいほど流れにくく、小さいほど流れやすい", "$" + (R1 > R2 ? "R_1 > R_2" : "R_1 < R_2") + "$"], chk: {form: "cmp", p: {R1: R1, R2: R2, hard: hard}}};
  },
  // 1-4 オームの法則
  4: function(r){
    var f = pick(r, ["fill", "law", "num", "num", "num"]);
    var fig0 = LOOPF({pm: 1, r0: "{R}", i0: "{I}", v0: "{V}"});
    if (f === "fill") {
      var c = choices(r, [{t: "$RI$", v: "RI"}, {t: "$\\dfrac{R}{I}$", v: "R/I", why: "掛けるところを割った"}, {t: "$\\dfrac{I}{R}$", v: "I/R", why: "掛けるところを割った"}, {t: "$R + I$", v: "R+I", why: "掛けるところを足した"}]);
      return {form: "fill", text: "オームの法則で、$V =$ □ である。", fig: fig0, ch: c.ch, ans: c.ans, ex: ["電圧は抵抗と電流の積", "$V = RI$"], chk: {form: "fill4", p: {}}};
    }
    if (f === "law") {
      var c2 = choices(r, [{t: "$V = RI$", v: "V=RI"}, {t: "$V = \\dfrac{R}{I}$", v: "V=R/I", why: "掛けるところを割った"}, {t: "$I = RV$", v: "I=RV", why: "電流は抵抗と電圧の積ではない"}, {t: "$R = VI$", v: "R=VI", why: "抵抗は電圧と電流の積ではない"}]);
      return {form: "law", text: "電圧 $V$・抵抗 $R$・電流 $I$ の関係を表す式は □ である。", fig: fig0, ch: c2.ch, ans: c2.ans, ex: ["$V = RI$（オームの法則）"], chk: {form: "law", p: {}}};
    }
    var R, I, w;
    for (;;) {
      R = pick(r, [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]); I = pick(r, [0.2, 0.5, 1.5, 2, 2.5, 3, 4, 5]);
      w = [{x: R / I, why: "$R$ を $I$ で割った"}, {x: I / R, why: "$I$ を $R$ で割った"}, {x: R + I, why: "$R$ と $I$ を足した"}];
      if (w.every(function(z){ return nice(z.x); }) && distinct([R * I].concat(w.map(function(z){ return z.x; })))) break;
    }
    var c3 = num(r, null, "V", R * I, w);
    return {form: "num", text: "図の回路で、抵抗 $R = " + qv(R, "O") + "$ に電流 $I = " + qv(I, "A") + "$ が流れている。抵抗にかかる電圧 $V$ は何 V か。",
            fig: LOOPF({pm: 1, r0: "{R}=" + qf(R, "O"), i0: "{I}=" + qf(I, "A"), v0: "{V}"}), ch: c3.ch, ans: c3.ans,
            ex: ["$V = RI$", "$V = " + fmt(R) + " \\times " + fmt(I) + " = " + qv(R * I, "V") + "$"], chk: {form: "V", p: {R: R, I: I}}};
  },
  // 1-5 式の変形
  5: function(r){
    var f = pick(r, ["fillI", "fillR", "numI", "numI", "numR", "numR"]);
    var fig0 = LOOPF({pm: 1, r0: "{R}", i0: "{I}", v0: "{V}"});
    if (f === "fillI") {
      var c = choices(r, [{t: "$\\dfrac{V}{R}$", v: "V/R"}, {t: "$\\dfrac{R}{V}$", v: "R/V", why: "割る順が逆"}, {t: "$VR$", v: "VR", why: "割るところを掛けた"}, {t: "$V - R$", v: "V-R", why: "割るところを引いた"}]);
      return {form: "fillI", text: "$V = RI$ の両辺を $R$ で割ると、$I =$ □ である。", fig: fig0, ch: c.ch, ans: c.ans, ex: ["$V = RI$", "$I = \\dfrac{V}{R}$"], chk: {form: "fillI", p: {}}};
    }
    if (f === "fillR") {
      var c2 = choices(r, [{t: "$\\dfrac{V}{I}$", v: "V/I"}, {t: "$\\dfrac{I}{V}$", v: "I/V", why: "割る順が逆"}, {t: "$VI$", v: "VI", why: "割るところを掛けた"}, {t: "$V - I$", v: "V-I", why: "割るところを引いた"}]);
      return {form: "fillR", text: "$V = RI$ の両辺を $I$ で割ると、$R =$ □ である。", fig: fig0, ch: c2.ch, ans: c2.ans, ex: ["$V = RI$", "$R = \\dfrac{V}{I}$"], chk: {form: "fillR", p: {}}};
    }
    var R, I, V, w, ok, findI = f === "numI";
    for (;;) {
      R = pick(r, [2, 4, 5, 8, 10, 12, 15, 20, 25, 40, 50]); I = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]); V = R * I;
      if (findI) { ok = I; w = [{x: R / V, why: "割る順が逆（$R$ を $V$ で割った）"}, {x: V * R, why: "割るところを掛けた"}, {x: V + R, why: "$V$ と $R$ を足した"}]; }
      else { ok = R; w = [{x: I / V, why: "割る順が逆（$I$ を $V$ で割った）"}, {x: V * I, why: "割るところを掛けた"}, {x: V + I, why: "$V$ と $I$ を足した"}]; }
      if (nice(V) && w.every(function(z){ return nice(z.x); }) && distinct([ok].concat(w.map(function(z){ return z.x; })))) break;
    }
    if (findI) {
      var c3 = num(r, null, "A", ok, w);
      return {form: "numI", text: "図の回路で、抵抗 $R = " + qv(R, "O") + "$ に電圧 $V = " + qv(V, "V") + "$ がかかっている。流れる電流 $I$ は何 A か。",
              fig: LOOPF({pm: 1, r0: "{R}=" + qf(R, "O"), i0: "{I}", v0: "{V}=" + qf(V, "V")}), ch: c3.ch, ans: c3.ans,
              ex: ["$I = \\dfrac{V}{R}$", "$I = \\dfrac{" + fmt(V) + "}{" + fmt(R) + "} = " + qv(I, "A") + "$"], chk: {form: "I", p: {V: V, R: R}}};
    }
    var c4 = num(r, null, "O", ok, w);
    return {form: "numR", text: "図の回路で、抵抗にかかる電圧が $V = " + qv(V, "V") + "$、流れる電流が $I = " + qv(I, "A") + "$ である。抵抗 $R$ は何 Ω か。",
            fig: LOOPF({pm: 1, r0: "{R}", i0: "{I}=" + qf(I, "A"), v0: "{V}=" + qf(V, "V")}), ch: c4.ch, ans: c4.ans,
            ex: ["$R = \\dfrac{V}{I}$", "$R = \\dfrac{" + fmt(V) + "}{" + fmt(I) + "} = " + qv(R, "O") + "$"], chk: {form: "R", p: {V: V, I: I}}};
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t1s1e","scene":"t1s1e","kind":"loop","lab":{"pm":1,"r0":"","i0":"{I}","i1":"{I}=2 A","ib1":"{I}=2 A","el":1},"viewbox":"464 268 595 292","band":{"want":"電流","ans":"電子の流れ・単位 $\\mathrm{A}$","full":"電流：電子の流れ。記号 $I$、単位 $\\mathrm{A}$（アンペア）。向きは＋極から出て－極へ。電子の動く向きはその逆。"},"narr":{"start":{"yb":490,"co":0,"ia":0,"iv":0,"ib":0,"ibv":1,"el":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"①電流の正体\n②単位\n③向き\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"回路に電源をつなぐと、回路の中の電子が動きます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["src","R"],"move":"flow"},{"text":"この電子の流れを電流といい、記号 $I$ で表します。","at":{"強調":1.0},"after":[],"emph":["I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電流の大きさの単位は A（アンペア）で、$I = 2\\,\\mathrm{A}$ のように書きます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["I"],"move":"ival"},{"text":"回路が1本の道なら、どこで測っても電流は同じ大きさです。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["I","I2"],"move":"i2"}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電流は、電源の＋極から出て回路を回り、－極へ戻る向きに流れます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["src","I","I2"]},{"text":"電子が動く向きはその逆で、－極から＋極へ向かいます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["el","src"],"move":"elec"},{"text":"電流の向きと電子の動く向きは逆です。","at":{"強調":1.0,"答え":1.0},"after":[],"emph":["I","I2","el"],"ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"flow":{"to":{"co":1,"ia":1},"dur":1.0,"win":{"co":[0,0.3],"ia":[0.3,1]}},"ival":{"to":{"iv":1},"dur":0.5},"i2":{"to":{"ib":1},"dur":0.6},"elec":{"to":{"el":1},"dur":0.7}},"route":["電流の正体","単位","向き"]}},{"id":"t1s1x","scene":"t1s1x","kind":"loop","lab":{"pm":1,"nameUp":1,"pa":{"x":600},"pb":{"x":920},"iax":600,"i0":"{I}_a=3 A","ibx":920,"ib0":"{I}_b","ib1":"{I}_b=3 A"},"viewbox":"464 290 595 260","band":{"want":"点 b の電流 $I_b$","known":"$I_a = 3\\,\\mathrm{A}$","ans":"$I_b = 3\\,\\mathrm{A}$"},"narr":{"start":{"co":0,"ia":1,"ib":1,"ibv":0,"pa":1,"pb":1},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めるのは、点 b を流れる電流 $I_b$ です。","at":{"強調":1.0},"after":[],"emph":["pb","Ib"]},{"text":"分かっているのは、点 a を流れる電流 $I_a = 3\\,\\mathrm{A}$ です。","at":{"強調":1.0},"after":[],"emph":["pa","Ia"]},{"text":"①回路の形を見る\n②電流の大きさを決める\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["pa","pb"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"点 a から点 b までは、分かれ道の無い1本の道です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["pa","pb","R"],"move":"flow"},{"text":"1本の道では、どこで測っても電流は同じ大きさです。","at":{"強調":1.0},"after":[],"emph":["Ia","Ib"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"なので、点 b の電流は点 a の電流と同じです。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["Ia","Ib","pa","pb"],"eq":[{"cont":false,"items":[["I_b = I_a"],["I_b = 3\\,\\mathrm{A}"]]}],"move":"ibv","ans":true,"emphPre":["Ia","Ib","pa","pb"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"],"Ia":["ia","ia:h","it0"],"Ib":["ib","ib:h","ibt0","ibt1"]},"moves":{"flow":{"to":{"co":1},"dur":1.0},"ibv":{"to":{"ibv":1},"dur":0.5}},"route":["回路の形を見る","電流の大きさを決める"]}},{"id":"t1s2e","scene":"t1s2e","kind":"loop","lab":{"pm":1,"src":"12 V","pa":{"x":600},"pb":{"x":920},"va":"12 V","vb":"0 V","v0":"{V}","v1":"{V}=12 V"},"viewbox":"464 210 595 350","band":{"want":"電圧","ans":"電流を流そうとする力・単位 $\\mathrm{V}$","full":"電圧：電流を流そうとする力。単位 $\\mathrm{V}$（ボルト）。電位は基準（－極の側＝0 V）と比べた電圧。電位差は2点の電位の差。矢印は電位の低い方から高い方へ。"},"narr":{"start":{"co":0,"pa":1,"pb":1,"pva":0,"pvb":0,"vd":0,"vv":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"①電圧とは\n②電位\n③電位差と矢印\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電圧は、電流を流そうとする力です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["src"],"move":"flow"},{"text":"電圧の単位は V（ボルト）で、この電源の電圧は $12\\,\\mathrm{V}$ です。","at":{"強調":1.0},"after":[],"emph":["src"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電位は、基準の点と比べた電圧です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["pb"]},{"text":"基準はふつう電源の－極の側で、点 b の電位を $0\\,\\mathrm{V}$ とします。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["pb","src"],"move":"pb"},{"text":"＋極の側の点 a の電位は、電源の電圧と同じ $12\\,\\mathrm{V}$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["pa","src"],"move":"pa"}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"2つの点の電位の差を電位差といい、抵抗にかかる電圧はこの電位差です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["pa","pb","R"]},{"text":"電圧の矢印は、電位の低い b から高い a へ向けて引きます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["V","pa","pb"],"move":"varrow"},{"text":"電位差は高い方から低い方を引くので、次の式になります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["V","pa","pb"],"eq":[{"cont":false,"items":[["V = 12 - 0 = 12\\,\\mathrm{V}"]]}],"move":"vval","ans":true,"emphPre":["V","pa","pb"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"flow":{"to":{"co":1},"dur":1.0},"pb":{"to":{"pvb":1},"dur":0.5},"pa":{"to":{"pva":1},"dur":0.5},"varrow":{"to":{"vd":1},"dur":0.8},"vval":{"to":{"vv":1},"dur":0.4}},"route":["電圧とは","電位","電位差と矢印"]}},{"id":"t1s2x","scene":"t1s2x","kind":"seg","lab":{"va":"15 V","vb":"6 V","hiLeft":true,"v0":"{V}","v1":"{V}=9 V"},"viewbox":"512 222 496 196","band":{"want":"$V$","known":"a $15\\,\\mathrm{V}$・b $6\\,\\mathrm{V}$","ans":"$V = 9\\,\\mathrm{V}$"},"narr":{"start":{"vd":1,"vv":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めるのは、矢印の向きの電圧 $V$ です。","at":{"強調":1.0},"after":[],"emph":["V"]},{"text":"分かっているのは、点 a と点 b の電位です。","at":{"強調":1.0},"after":[],"emph":["pa","pb"]},{"text":"①どちらが高いか\n②電位差を出す\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["pa","pb"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"a は $15\\,\\mathrm{V}$、b は $6\\,\\mathrm{V}$ なので、a の方が電位が高い点です。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["pa","pb"]},{"text":"矢印は、電位の低い b から高い a へ向いています。","at":{"強調":1.0},"after":[],"emph":["V","pa","pb"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電位差は高い方から低い方を引くので、次の式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V","pa","pb"],"eq":[{"cont":false,"items":[["V = 15 - 6"],["V = 9\\,\\mathrm{V}"]]}],"move":"vval","ans":true,"emphPre":["V","pa","pb"]}]}],"groups":{"R":["r"],"pa":["da","na","va"],"pb":["db","nb","vb"],"V":["vd:e","vd:f","vd:a","vt0","vt1"]},"moves":{"vval":{"to":{"vv":1},"dur":0.4}},"route":["どちらが高いか","電位差を出す"]}},{"id":"t1s3e","scene":"t1s3e","kind":"loop","lab":{"pm":1,"r0":"{R}","r1":"{R}=5 Ω","r2":"{R}=20 Ω","i0":"{I}"},"viewbox":"464 284 595 250","band":{"want":"抵抗","ans":"電流の流れにくさ・単位 $\\Omega$","full":"抵抗：電流の流れにくさ。記号 $R$、単位 $\\Omega$（オーム）。大きいほど流れにくく、小さいほど流れやすい。"},"narr":{"start":{"co":0,"ia":0,"rv":0,"rb":0,"fi":1},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"①抵抗とは\n②単位\n③大きさと流れ方\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"抵抗は、電流の流れにくさを表す量です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["R"],"move":"flow"},{"text":"図の四角が抵抗で、記号は $R$ で表します。","at":{"強調":1.0},"after":[],"emph":["R"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"抵抗の単位は Ω（オーム）で、$R = 5\\,\\Omega$ のように書きます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":2,"emph":["R"],"move":"rval"}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"抵抗が大きいほど、電流は流れにくくなります。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R","I"],"move":"rbig"},{"text":"抵抗が小さいほど、電流は流れやすくなります。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["R","I"],"move":"rsmall","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"flow":{"to":{"co":1,"ia":1},"dur":1.0},"rval":{"to":{"rv":1},"dur":0.5},"rbig":{"to":{"rb":1,"fi":0.35},"dur":1.0},"rsmall":{"to":{"rb":0,"fi":1},"dur":1.0}},"route":["抵抗とは","単位","大きさと流れ方"]}},{"id":"t1s3x","scene":"t1s3x","kind":"two","lab":{"r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω","i1":1,"i2":0.33},"viewbox":"478 290 564 234","band":{"want":"流れにくい回路","known":"$R_1 = 4\\,\\Omega,\\;\\; R_2 = 12\\,\\Omega$","ans":"$R_2$ の回路"},"narr":{"start":{"co":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めるのは、電流が流れにくい方の回路です。","at":{"強調":1.0},"after":[],"emph":["R1","R2"]},{"text":"①抵抗の大きさを比べる\n②流れにくさを決める\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["R1","R2"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電源は同じなので、2つの回路で違うのは抵抗の大きさだけです。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["src1","src2"]},{"text":"$R_2 = 12\\,\\Omega$ は、$R_1 = 4\\,\\Omega$ より大きい抵抗です。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["R1","R2"],"eq":[{"cont":false,"items":[["R_2 > R_1"]]}]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"抵抗が大きいほど電流は流れにくいので、答えは $R_2$ の回路です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"route":2,"emph":["R2","src2"],"move":"flow","ans":true}]}],"groups":{"R1":["r1","rt1"],"R2":["r2","rt2"],"src1":["c1:L","c1:S"],"src2":["c2:L","c2:S"]},"moves":{"flow":{"to":{"co":1},"dur":1.0}},"route":["抵抗の大きさを比べる","流れにくさを決める"]}},{"id":"t1s4e","scene":"t1s4e","kind":"loop","lab":{"pm":1,"r0":"{R}","r1":"{R}=10 Ω","i0":"{I}","i1":"{I}=2 A","v0":"{V}","v1":"{V}=20 V"},"viewbox":"464 212 595 318","band":{"want":"$V$・$R$・$I$ の関係","ans":"$V = RI$","full":"オームの法則：電圧は抵抗と電流の積。$V = RI$"},"narr":{"start":{"co":1,"ia":1,"iv":0,"rv":0,"vd":1,"vv":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"①電圧・抵抗・電流\n②オームの法則\n③数字を入れる\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"1つの抵抗に着目すると、電圧 $V$・抵抗 $R$・電流 $I$ の3つの量があります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V","R","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"この3つには、電圧は抵抗と電流の積、という関係があります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = RI"]]}]},{"text":"この関係をオームの法則といいます。","at":{"強調":1.0},"after":[],"emph":["V","R","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"抵抗が $R = 10\\,\\Omega$、電流が $I = 2\\,\\mathrm{A}$ のときの電圧を求めます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R","I"],"move":"vals"},{"text":"オームの法則に数字を入れると、次の式になります。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = RI"],["V = 10 \\times 2 = 20\\,\\mathrm{V}"]]}],"move":"vval","ans":true,"emphPre":["V","R","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"vals":{"to":{"rv":1,"iv":1},"dur":0.6},"vval":{"to":{"vv":1},"dur":0.4}},"route":["電圧・抵抗・電流","オームの法則","数字を入れる"]}},{"id":"t1s4x","scene":"t1s4x","kind":"loop","lab":{"pm":1,"r0":"{R}=6 Ω","i0":"{I}=3 A","v0":"{V}","v1":"{V}=18 V"},"viewbox":"464 212 595 318","band":{"want":"$V$","known":"$R = 6\\,\\Omega,\\;\\; I = 3\\,\\mathrm{A}$","ans":"$V = 18\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"ia":1,"vd":1,"vv":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めるのは、抵抗にかかる電圧 $V$ です。","at":{"強調":1.0},"after":[],"emph":["V","R"]},{"text":"分かっているのは、抵抗 $R$ と電流 $I$ の2つです。","at":{"強調":1.0},"after":[],"emph":["R","I"]},{"text":"①使う式を選ぶ\n②数字を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V","R","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"電圧・抵抗・電流のうち2つが分かれば、オームの法則で残りの1つが求まります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":1,"emph":["V","R","I"]},{"text":"求めたいのは $V$ なので、$V$ が左にある式を使います。","at":{"強調":1.0,"式":1.0},"after":[],"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = RI"]]}]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"数字を入れると、次の式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = 6 \\times 3 = 18\\,\\mathrm{V}"]]}],"move":"vval","ans":true,"emphPre":["R","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"vval":{"to":{"vv":1},"dur":0.4}},"route":["使う式を選ぶ","数字を入れる"]}},{"id":"t1s5e","scene":"t1s5e","kind":"loop","lab":{"pm":1,"r0":"{R}=4 Ω","i0":"{I}","i1":"{I}=3 A","v0":"{V}=12 V"},"viewbox":"464 212 595 318","band":{"want":"$I$ の式・$R$ の式","ans":"$I = V/R$・$R = V/I$","full":"$V = RI$ の両辺を $R$ で割る → $I = \\dfrac{V}{R}$。両辺を $I$ で割る → $R = \\dfrac{V}{I}$。求めたい量が左にある式を選ぶ。"},"narr":{"start":{"co":1,"ia":1,"iv":0,"vd":1},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"①電流を求める式\n②抵抗を求める式\n③式の選び方\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"オームの法則の両辺を $R$ で割ると、電流 $I$ を求める式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = RI"],["\\dfrac{V}{R} = I"],["I = \\dfrac{V}{R}"]]}]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"両辺を $I$ で割ると、抵抗 $R$ を求める式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":2,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = RI"],["\\dfrac{V}{I} = R"],["R = \\dfrac{V}{I}"]]}]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"式は、求めたい量が左にある物を選びます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":3,"emph":["V","R","I"]},{"text":"図では電圧 $V$ と抵抗 $R$ が分かっていて、電流 $I$ を求めたいので、$I$ の式を使います。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["V","R","I"],"eq":[{"cont":false,"items":[["I = \\dfrac{V}{R}"],["I = \\dfrac{12}{4} = 3\\,\\mathrm{A}"]]}],"move":"ival","ans":true,"emphPre":["V","R","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"ival":{"to":{"iv":1},"dur":0.5}},"route":["電流を求める式","抵抗を求める式","式の選び方"]}},{"id":"t1s5x","scene":"t1s5x","kind":"loop","lab":{"pm":1,"r0":"{R}","r1":"{R}=8 Ω","i0":"{I}=3 A","v0":"{V}=24 V"},"viewbox":"464 212 595 318","band":{"want":"$R$","known":"$V = 24\\,\\mathrm{V},\\;\\; I = 3\\,\\mathrm{A}$","ans":"$R = 8\\,\\Omega$"},"narr":{"start":{"co":1,"ia":1,"vd":1,"rv":0},"steps":[{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めるのは抵抗 $R$ です。","at":{"強調":1.0},"after":[],"emph":["R"]},{"text":"分かっているのは、電圧 $V$ と電流 $I$ です。","at":{"強調":1.0},"after":[],"emph":["V","I"]},{"text":"①式を選ぶ\n②数字を入れる\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["V","R","I"]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"求めたいのは $R$ なので、オームの法則を $R$ の式に変えます。","at":{"道筋":1.0,"強調":1.0,"式":1.0},"after":[],"route":1,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["V = RI"],["R = \\dfrac{V}{I}"]]}]}]},{"cap":null,"eqp":null,"vid":[1],"sents":[{"text":"数字を入れると、次の式になります。","at":{"道筋":1.0,"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"route":2,"emph":["V","R","I"],"eq":[{"cont":false,"items":[["R = \\dfrac{24}{3} = 8\\,\\Omega"]]}],"move":"rval","ans":true,"emphPre":["V","I"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e1"],"R":["r","rt0","rt1","rt2"],"I":["ia","ia:h","it0","it1"],"I2":["ib","ib:h","ibt0","ibt1"],"V":["vd:e","vd:f","vd:a","vt0","vt1"],"pa":["da","na","va"],"pb":["db","nb","vb"],"el":["ea","ea:h","eat"]},"moves":{"rval":{"to":{"rv":1},"dur":0.5}},"route":["式を選ぶ","数字を入れる"]}}],"secs":[{"ex":{"text":"1本の道でつながった図の回路で、点 a を流れる電流は $3\\,\\mathrm{A}$ である。点 b を流れる電流は何 A か。","fig":{"kind":"loop","L":{"pm":1,"nameUp":1,"pa":{"x":600},"pb":{"x":920},"iax":600,"i0":"{I}_a=3 A","ibx":920,"ib0":"{I}_b"},"P":{"ia":1,"ib":1,"ibv":0}},"ch":[{"t":"$1.5\\,\\mathrm{A}$","v":1.5,"why":"抵抗を通ると電流が減ると考えた"},{"t":"$3\\,\\mathrm{A}$","v":3,"why":""},{"t":"$6\\,\\mathrm{A}$","v":6,"why":"抵抗を通ると電流が増えると考えた"},{"t":"$0\\,\\mathrm{A}$","v":0,"why":"抵抗で電流が止まると考えた"}],"ans":1}},{"ex":{"text":"図の抵抗をはさむ点 a、b の電位は、a が $15\\,\\mathrm{V}$、b が $6\\,\\mathrm{V}$ である。矢印の向きの電圧 $V$ は何 V か。","fig":{"kind":"seg","L":{"va":"15 V","vb":"6 V","hiLeft":true,"v0":"{V}"},"P":{"vd":1}},"ch":[{"t":"$21\\,\\mathrm{V}$","v":21,"why":"2つの電位を足した"},{"t":"$9\\,\\mathrm{V}$","v":9,"why":""},{"t":"$-9\\,\\mathrm{V}$","v":-9,"why":"低い方から高い方を引いた（引く順が逆）"},{"t":"$15\\,\\mathrm{V}$","v":15,"why":"a の電位だけを見た"}],"ans":1}},{"ex":{"text":"同じ電源に、$R_1 = 4\\,\\Omega$ と $R_2 = 12\\,\\Omega$ の抵抗を別々につないだ。電流が流れにくいのはどちらの回路か。","fig":{"kind":"two","L":{"r1":"{R}_1=4 Ω","r2":"{R}_2=12 Ω"},"P":{}},"ch":[{"t":"$R_1 = 4\\,\\Omega$ の回路","v":"R1","why":"抵抗が大きい方が流れにくい"},{"t":"$R_2 = 12\\,\\Omega$ の回路","v":"R2","why":""},{"t":"どちらも同じ","v":"same","why":"電源が同じでも、抵抗が違えば流れ方は違う"},{"t":"決められない","v":"nd","why":"抵抗の大きさを比べれば決められる"}],"ans":1}},{"ex":{"text":"図の回路で、抵抗 $R = 6\\,\\Omega$ に電流 $I = 3\\,\\mathrm{A}$ が流れている。抵抗にかかる電圧 $V$ は何 V か。","fig":{"kind":"loop","L":{"pm":1,"r0":"{R}=6 Ω","i0":"{I}=3 A","v0":"{V}"},"P":{"ia":1,"vd":1}},"ch":[{"t":"$2\\,\\mathrm{V}$","v":2,"why":"$R$ を $I$ で割った"},{"t":"$18\\,\\mathrm{V}$","v":18,"why":""},{"t":"$0.5\\,\\mathrm{V}$","v":0.5,"why":"$I$ を $R$ で割った"},{"t":"$9\\,\\mathrm{V}$","v":9,"why":"$R$ と $I$ を足した"}],"ans":1}},{"ex":{"text":"図の回路で、抵抗にかかる電圧が $V = 24\\,\\mathrm{V}$、流れる電流が $I = 3\\,\\mathrm{A}$ である。抵抗 $R$ は何 Ω か。","fig":{"kind":"loop","L":{"pm":1,"r0":"{R}","i0":"{I}=3 A","v0":"{V}=24 V"},"P":{"ia":1,"vd":1}},"ch":[{"t":"$72\\,\\Omega$","v":72,"why":"割るところを掛けた"},{"t":"$8\\,\\Omega$","v":8,"why":""},{"t":"$0.125\\,\\Omega$","v":0.125,"why":"割る順が逆（$I$ を $V$ で割った）"},{"t":"$27\\,\\Omega$","v":27,"why":"$V$ と $I$ を足した"}],"ans":1}}],"past":[]}};
});
