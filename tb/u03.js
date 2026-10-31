/* 単元3「合成抵抗」（textbook/make_tb.py が作る。手で直さない） */
TB_REG(3, function(H){
var NS = H.NS, Drawer = H.Drawer, n = H.n, clamp01 = H.clamp01, lerp = H.lerp, seriesPair = H.seriesPair, parallelPair = H.parallelPair, vdim = H.vdim, pv = H.pv, swapText = H.swapText, rngOf = H.rngOf, pick = H.pick, shuffled = H.shuffled, nice = H.nice, fmt = H.fmt, UNIT = H.UNIT, qv = H.qv, qf = H.qf, choices = H.choices, num = H.num, distinct = H.distinct, UNIT_CH = H.UNIT_CH, unitQ = H.unitQ, genQ = H.genQ;
// 単元3の図（自作）。共通の部品（vdim・pv・swapText）は tb_scenes.js、描く道具（Drawer）は試作の expl_kit.py。
// 3-1：直列（pser）・直並列（psp）に、電位を見る点を足した物。形と部品の id は単元2の ser・sp と同じ（check_iarrow.py が id で図の種類を見分ける）。
//   線の部品の id は「同じ電位の線」のまとまりで強調する（u03.py の zhi・zmid・zlo）。
// 名前 L[k]：文字（そのまま）か [前, 後]（p[k + "v"] で前→後へ入れ替える）。矢印の濃さ＝p[k + "o"]（無ければ 1）、
// 電圧の矢印の伸び＝p[k + "d"]（無ければ 1）。問題の画面の図は p を渡さない＝全部出た形。
// 電流は＋極（電池の長い線・x=752）から出て、下の線を左へ → 左の線を上へ → 上の線を右へ。抵抗は左の端が高い電位。
// 3-2 以降の図はこのファイルに足す（KINDS・FLOWK に入れる）。
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
var KINDS = {pser: tbPser, psp: tbPsp};
// 電流の点の通り道（＋極から出る向き）。点の間隔＝base / I。L.fl＝[全体, 上の道, 下の道] の電流の比
var FLOWK = {
  pser: function(p, L){
    var yb = 560;
    return {o: pv(p, "co"), base: 110, paths: [{I: 1, pts: [[752, yb], [478, yb], [478, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  },
  psp: function(p, L){
    var yb = 640, f = L.fl || [2, 1, 1], xl = 680, xr = 1010;
    return {o: pv(p, "co"), base: 200, paths: [
      {I: f[0], pts: [[752, yb], [478, yb], [478, 360], [xl, 360]]},
      {I: f[1], pts: [[xl, 360], [xl, 280], [xr, 280], [xr, 360]]},
      {I: f[2], pts: [[xl, 360], [xl, 440], [xr, 440], [xr, 360]]},
      {I: f[0], pts: [[xr, 360], [1045, 360], [1045, yb], [772, yb]]}]};
  }
};

// 単元3の練習問題の作り方。共通の道具（rngOf・pick・choices・num・qv・qf・nice・distinct など）は tb_gen.js。
// 3-1 電位と電圧降下：抵抗の無い線でつながった点は同じ電位・抵抗で下がった電位の分が電圧降下。
// 形は「言葉の穴埋め」と「数字の計算（単元1のオームの法則・単元2の直列・直並列と組み合わせる）」。図は全問に付ける。
// まちがいの選択肢は、よくある取り違え（電圧降下と電位の取り違え・抵抗を通っても下がらない・上がると考えた・
// 下の線は 0 V と考えた・引く順が逆 など）。理由を1行付ける。分圧・分流（単元4）の式は使わない。
// 3-2 以降の節は GEN に 2: … と足す（節の番号＝GEN の番号）。
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
  }
};

return {kinds: KINDS, flowk: FLOWK, gen: GEN, data: {"slides":[{"id":"t3s1e","scene":"t3s1e","kind":"pser","lab":{"pm":1,"src":["{V}","{V}=30 V"],"r1":"{R}_1","r2":"{R}_2","v1":["{V}_1","{V}_1=18 V"],"v2":["{V}_2","{V}_2=12 V"],"pa":{"v":"30 V"},"pd":{"v":"30 V"},"pb":{"v":"0 V"},"pe":{"v":"0 V"},"pc":{"v":"12 V"}},"viewbox":"464 232 595 400","band":{"want":"電位と電圧降下","ans":"抵抗の無い線は同じ電位・電圧降下＝抵抗で下がった電位の分","full":"抵抗の無い線でつながった点は、どこも同じ電位（同電位）。抵抗を通ると電位が下がり、下がった分をその抵抗の電圧降下という。"},"narr":{"start":{"co":1,"srcv":0,"v1d":0,"v2d":0,"v1v":0,"v2v":0,"pao":0,"pdo":0,"pbo":0,"peo":0,"pco":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"①抵抗の無い線\n②電圧降下\n③数字で見る\nこの順に見ます。","at":{"道筋":1.0},"after":[],"route":0}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電源の電圧を $V = 30\\,\\mathrm{V}$ とし、－極の側を基準の $0\\,\\mathrm{V}$ とします。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["src"],"move":"srcv"},{"text":"＋極から $R_1$ までの線には、抵抗がありません。","at":{"強調":1.0},"after":[],"emph":["zhi","src","R1"]},{"text":"抵抗の無い線の上は、どこも同じ電位です。点 a も点 d も $30\\,\\mathrm{V}$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["zhi","pa","pd","src"],"move":"pad"},{"text":"－極の側の線も同じで、どこも $0\\,\\mathrm{V}$ です。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["zlo","pb","pe"],"move":"pbe"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"電流が $R_1$ を通ると、電位が下がります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["R1","zhi","zmid"]},{"text":"抵抗で下がった電位の分を、電圧降下といいます。","at":{"強調":1.0,"動き":1.0},"after":[],"emph":["R1","V1"],"move":"v1arrow"},{"text":"$R_1$ の電圧降下は、$R_1$ にかかる電圧 $V_1$ と同じです。","at":{"強調":1.0},"after":[],"emph":["R1","V1"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"$R_1$ の電圧降下が $V_1 = 18\\,\\mathrm{V}$ のときを考えます。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":3,"emph":["R1","V1"],"move":"v1val"},{"text":"点 c の電位は、点 a の電位から $V_1$ だけ下がった値です。","at":{"強調":1.0,"式":1.0,"動き":1.0},"after":["動き","強調"],"emph":["pa","pc","V1","src","zmid"],"eq":[{"cont":false,"items":[["V - V_1"],["30 - 18 = 12\\,\\mathrm{V}"]]}],"move":"pc","emphPre":["pa","pc","V1","src","zmid"]},{"text":"$R_2$ を通ると、さらに $12\\,\\mathrm{V}$ 下がって $0\\,\\mathrm{V}$ になります。これが $R_2$ の電圧降下 $V_2$ です。","at":{"強調":1.0,"動き":1.0,"答え":1.0},"after":[],"emph":["R2","V2","pc","pb","zlo"],"move":"v2all","ans":true}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"V2":["v2d:e","v2d:f","v2d:a","v2t0","v2t1"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"],"pd":["dd","nd","pdt0","pdt1"],"pe":["de","ne","pet0","pet1"],"zhi":["L","w1"],"zmid":["wm"],"zlo":["w2","Rw"]},"moves":{"srcv":{"to":{"srcv":1},"dur":0.5},"pad":{"to":{"pao":1,"pdo":1},"dur":0.6},"pbe":{"to":{"pbo":1,"peo":1},"dur":0.6},"v1arrow":{"to":{"v1d":1},"dur":0.8},"v1val":{"to":{"v1v":1},"dur":0.4},"pc":{"to":{"pco":1},"dur":0.5},"v2all":{"to":{"v2d":1,"v2v":1},"dur":0.8}},"route":["抵抗の無い線","電圧降下","数字で見る"]}},{"id":"t3s1x","scene":"t3s1x","kind":"psp","lab":{"pm":1,"j":1,"src":"{V}=60 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","v1":"{V}_1=36 V","pa":{"v":"60 V"},"pc":{"v":"24 V"},"fl":[2,1,1]},"viewbox":"464 152 595 560","band":{"want":"点 c の電位","known":"$V = 60\\,\\mathrm{V},\\;\\; V_1 = 36\\,\\mathrm{V}$","ans":"点 c は $24\\,\\mathrm{V}$"},"narr":{"start":{"co":1,"pavo":0,"pcvo":0},"steps":[{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"求めるのは、点 c の電位です。","at":{"強調":1.0},"after":[],"emph":["pc"]},{"text":"分かっているのは、電源の電圧 $V$ と、$R_1$ の電圧降下 $V_1$ です。","at":{"強調":1.0},"after":[],"emph":["src","V1","R1"]},{"text":"①点 a の電位\n②点 c の電位\nこの順に解きます。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":0,"emph":["pa","pc"]}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"点 a は、＋極と抵抗の無い線でつながっているので、電源の電圧と同じ $60\\,\\mathrm{V}$ です。","at":{"道筋":1.0,"強調":1.0,"動き":1.0},"after":[],"route":1,"emph":["pa","src","zhi"],"move":"pav"}]},{"cap":null,"eqp":null,"vid":[3],"sents":[{"text":"点 a から $R_1$ を通ると、電位は $V_1$ の分だけ下がります。","at":{"道筋":1.0,"強調":1.0},"after":[],"route":2,"emph":["pa","R1","V1"]},{"text":"点 c と $R_1$ の右の端の間には、抵抗がありません。なので同じ電位です。","at":{"強調":1.0},"after":[],"emph":["pc","R1","zmid"]},{"text":"点 c の電位は、次の式で求めます。","at":{"強調":1.0,"式":1.0,"動き":1.0,"答え":1.0},"after":["動き","答え","強調"],"emph":["pa","src","V1","pc","zmid"],"eq":[{"cont":false,"items":[["V - V_1"],["60 - 36 = 24\\,\\mathrm{V}"]]}],"move":"pcv","ans":true,"emphPre":["pa","src","V1","pc","zmid"]}]}],"groups":{"src":["c:L","c:S","pp","pm","e0","e1"],"R1":["r1","r1t0","r1t1"],"R2":["r2","r2t0","r2t1"],"R3":["r3","r3t0","r3t1"],"V1":["v1d:e","v1d:f","v1d:a","v1t0","v1t1"],"j":["dj1","dj2"],"pa":["da","na","pat0","pat1"],"pb":["db","nb","pbt0","pbt1"],"pc":["dc","nc","pct0","pct1"],"zhi":["L"],"zmid":["w1","bl","w2l","w3l"],"zlo":["w2r","w3r","br","Rw"]},"moves":{"pav":{"to":{"pavo":1},"dur":0.4},"pcv":{"to":{"pcvo":1},"dur":0.4}},"route":["点 a の電位","点 c の電位"]}}],"secs":[{"ex":{"text":"図の回路で、電源の電圧は $V = 60\\,\\mathrm{V}$、$R_1$ の電圧降下は $V_1 = 36\\,\\mathrm{V}$ である。－極の側を基準の $0\\,\\mathrm{V}$ とすると、点 c の電位は何 V か。","fig":{"kind":"psp","L":{"pm":1,"j":1,"src":"{V}=60 V","r1":"{R}_1","r2":"{R}_2","r3":"{R}_3","v1":"{V}_1=36 V","pa":{},"pc":{}},"P":{}},"ch":[{"t":"$36\\,\\mathrm{V}$","v":36,"why":"電圧降下 $V_1$ を、点 c の電位と取り違えた"},{"t":"$24\\,\\mathrm{V}$","v":24,"why":""},{"t":"$60\\,\\mathrm{V}$","v":60,"why":"$R_1$ を通っても電位が下がらないと考えた"},{"t":"$12\\,\\mathrm{V}$","v":12,"why":"点 c の電位が $R_2$ と $R_3$ に分かれると考えた"}],"ans":1}}],"past":[]}};
});
