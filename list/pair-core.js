// ===== 恋愛相性占い（list/5v8zmrv/）と「ふたりの相性チェック」（list/6vs5h3v/）の共通処理 =====
// 「ふたりの相性チェック」は恋愛占いのひみつモード用のページ。相手には恋愛占いだとわからない言葉で
// 質問・結果を出す（計算は恋愛占いとまったく同じ）。
// <body data-mode="love"> か <body data-mode="secret"> で切りかえる。
// audio.js・common.js・fortune.js のあとに読み込む。
(() => {
  const MODE = document.body.dataset.mode === "secret" ? "secret" : "love";
  const LOVE_URL = siteUrl("list/5v8zmrv/");
  const SECRET_URL = siteUrl("list/6vs5h3v/");
  // ひみつモードで作った招待（この端末で作ったもの）を覚えておく。結果のURLを開いたときに恋愛の結果へ切りかえるため
  const SECRET_KEY = "uranai-love-secret";

  // ===== 質問。q は [恋愛のとき, ひみつモードのとき]。m は「1人目 × 2人目」の相性（左右対称） =====
  const QUESTIONS = [
    { q: ["好きな人ができたら？", "仲良くなりたい人ができたら？"], a: ["自分からアタック！", "相手から来るのを待つ", "まず友だちに相談", "こっそり見守る"],
      m: [[70, 95, 75, 85], [95, 40, 60, 35], [75, 60, 80, 55], [85, 35, 55, 45]] },
    { q: ["デートで行きたいのは？", "いっしょにおでかけするなら？"], a: ["遊園地でおもいっきり", "カフェでおしゃべり", "映画や水族館", "おうちでまったり"],
      m: [[100, 60, 75, 40], [60, 100, 70, 75], [75, 70, 100, 65], [40, 75, 65, 100]] },
    { q: ["好きな人との連絡は？", "仲のいい人との連絡は？"], a: ["毎日たくさんしたい", "1日に数回くらい", "用事があるときだけ", "気が向いたら"],
      m: [[100, 80, 40, 30], [80, 100, 65, 50], [40, 65, 100, 85], [30, 50, 85, 100]] },
    { q: ["ケンカしちゃったら？", "ケンカしちゃったら？"], a: ["すぐに話し合う", "時間をおいて冷静に", "自分から先にあやまる", "相手があやまるまで待つ"],
      m: [[85, 60, 90, 55], [60, 80, 80, 45], [90, 80, 70, 95], [55, 45, 95, 20]] },
    { q: ["恋人にいちばん求めるのは？", "いっしょにいる人にいちばん求めるのは？"], a: ["やさしさ", "いっしょにいて楽しい", "たよりがい", "おたがいの自由"],
      m: [[95, 75, 85, 55], [75, 100, 65, 75], [85, 65, 80, 60], [55, 75, 60, 100]] },
    { q: ["記念日はどうしたい？", "誕生日や記念日はどうしたい？"], a: ["全力でお祝いしたい", "ちょっとしたプレゼント", "言葉で気持ちを伝える", "あまり気にしない"],
      m: [[100, 80, 70, 30], [80, 100, 80, 55], [70, 80, 100, 65], [30, 55, 65, 95]] },
    { q: ["休みの日の過ごし方は？", "休みの日の過ごし方は？"], a: ["アクティブにおでかけ", "家でのんびり", "新しいお店を開拓", "趣味に没頭"],
      m: [[100, 45, 85, 55], [45, 100, 60, 80], [85, 60, 100, 60], [55, 80, 60, 90]] },
    { q: ["自分の性格をひとことで言うと？", "自分の性格をひとことで言うと？"], a: ["さみしがりや", "明るい元気っ子", "しっかり者", "マイペース"],
      m: [[60, 85, 90, 45], [85, 85, 80, 75], [90, 80, 70, 80], [45, 75, 80, 85]] },
  ];

  // 結果の4項目（どの質問から計算するか）
  const CAT_QS = [[0, 5], [2, 3], [4, 7], [1, 6]];

  // ===== モードごとの言葉 =====
  const TEXT = {
    love: {
      inviteHtml: "💌 <b></b> さんから<br>恋愛相性占いがとどいたよ！",
      leadFirst: "まずはあなたが8つの質問にこたえてね。<br>できたURLを相手に送ると、<br>ふたりの相性がわかるよ！",
      leadSecond: "あなたのことを8つの質問でこたえると、<br>ふたりの相性がわかるよ。",
      inviteShare: n => `💘 ${n}さんから恋愛相性占いがとどいたよ！こたえて、ふたりの相性をチェックしてね`,
      resultShare: (a, b, t) => `💘 ${a}さんと${b}さんの恋愛相性は… ${t}%！ 結果を見てね`,
      cats: ["💓 ドキドキ度", "💬 会話の相性", "💎 価値観", "🎡 おでかけ相性"],
      advice: [
        "たまにはサプライズで、ふたりにドキドキを足してみて！",
        "思っていることは、ちゃんと言葉にして伝えるのがいちばん。",
        "ちがう考えも「そういうのもアリだね」と受け止めると、もっと仲良くなれるよ。",
        "おたがいの行きたい場所を、交代でえらんでみよう！",
      ],
      tiers: [
        [90, "💞 運命のふたり", (a, b) => `${a}さんと${b}さんは、出会うべくして出会った運命のふたり！ 言わなくても気持ちが通じ合える、最高の相性です。この出会いを大切にしてね。`],
        [78, "💖 ベストカップル", (a, b) => `${a}さんと${b}さんは、いっしょにいると自然と笑顔になれるベストな組み合わせ。おたがいの良いところを引き出し合えるふたりです。`],
        [65, "💗 いい感じのふたり", (a, b) => `${a}さんと${b}さんは、なかなかいい感じ！ ちょっとしたちがいはあるけれど、それがふたりの会話を楽しくしてくれます。`],
        [50, "🌱 これから育つ恋", (a, b) => `${a}さんと${b}さんは、これから仲良くなっていくタイプ。いっしょに過ごす時間が増えるほど、相性もどんどん良くなっていくよ。`],
        [0, "🧲 正反対で引かれ合うふたり", (a, b) => `${a}さんと${b}さんは、考え方が正反対！ だからこそ、自分にないものを持っている相手にひかれ合うふたりです。ちがいを楽しんでね。`],
      ],
    },
    secret: {
      inviteHtml: "✨ <b></b> さんから<br>相性チェックがとどいたよ！",
      leadFirst: "まずはあなたが8つの質問にこたえてね。<br>できたURLを相手に送ると、<br>ふたりの相性がわかるよ！",
      leadSecond: "あなたのことを8つの質問でこたえると、<br>ふたりの相性がわかるよ。",
      inviteShare: n => `✨ ${n}さんから「ふたりの相性チェック」がとどいたよ！こたえて、ふたりの相性を見てみてね`,
      resultShare: (a, b, t) => `✨ ${a}さんと${b}さんの相性は… ${t}%！ 結果を見てね`,
      cats: ["✨ わくわく度", "💬 会話の相性", "💎 価値観", "🎡 おでかけ相性"],
      advice: [
        "たまにはサプライズで、ふたりにわくわくを足してみて！",
        "思っていることは、ちゃんと言葉にして伝えるのがいちばん。",
        "ちがう考えも「そういうのもアリだね」と受け止めると、もっと仲良くなれるよ。",
        "おたがいの行きたい場所を、交代でえらんでみよう！",
      ],
      tiers: [
        [90, "💫 さいこうの相性", (a, b) => `${a}さんと${b}さんは、言わなくても気持ちが通じ合える、さいこうの組み合わせ！ いっしょにいるだけで楽しい時間になりそう。`],
        [78, "🌟 ばっちりの相性", (a, b) => `${a}さんと${b}さんは、いっしょにいると自然と笑顔になれるふたり。おたがいの良いところを引き出し合えるよ。`],
        [65, "😊 いい感じの相性", (a, b) => `${a}さんと${b}さんは、なかなかいい感じ！ ちょっとしたちがいが、ふたりの会話を楽しくしてくれます。`],
        [50, "🌱 これから深まる相性", (a, b) => `${a}さんと${b}さんは、これから仲良くなっていくふたり。いっしょに過ごす時間が増えるほど、相性もどんどん良くなっていくよ。`],
        [0, "🧩 正反対でおもしろいふたり", (a, b) => `${a}さんと${b}さんは、考え方が正反対！ だからこそ、自分にないものを持っている相手と、新しい発見がいっぱいです。`],
      ],
    },
  };
  const T = TEXT[MODE];
  const qIndex = MODE === "love" ? 0 : 1;

  const ANSWER_RE = new RegExp("^[0-3]{" + QUESTIONS.length + "}$");
  const validPerson = p => p && Fortune.validName(p.n) && typeof p.a === "string" && ANSWER_RE.test(p.a);
  const $ = id => document.getElementById(id);

  // ===== ひみつモードで作った招待を覚える／照らし合わせる =====
  function rememberSecret(me) {
    try {
      const list = JSON.parse(localStorage.getItem(SECRET_KEY) || "[]");
      list.push({ n: me.n, a: me.a });
      localStorage.setItem(SECRET_KEY, JSON.stringify(list.slice(-30)));
    } catch (e) { /* 保存できなくても続ける */ }
  }

  function isMySecret(p) {
    try {
      return JSON.parse(localStorage.getItem(SECRET_KEY) || "[]").some(x => x.n === p.n && x.a === p.a);
    } catch (e) {
      return false;
    }
  }

  // ===== 画面 =====
  const show = Fortune.screens(["introScreen", "nameScreen", "quizScreen", "linkScreen", "loadingScreen", "resultScreen", "errorScreen"]);
  const params = new URLSearchParams(location.search);
  let partner = null;
  let myName = "";

  const quiz = Fortune.quiz({
    questions: QUESTIONS.map(x => ({ q: x.q[qIndex], a: x.a })),
    ids: { num: "qNum", text: "qText", progressText: "progressText", fill: "progressFill", choices: "choices", back: "backBtn", panel: "questionPanel" },
    onDone: finishQuiz,
  });

  // ===== URL を見て、どこから始めるか決める =====
  if (params.has("r")) {
    try {
      const d = Fortune.decode(params.get("r"));
      if (!validPerson(d.a) || !validPerson(d.b)) throw new Error("bad");
      if (MODE === "secret" && isMySecret(d.a)) {
        // ひみつモードを作った本人がこの端末で開いた → 恋愛占いの結果へ
        location.replace(LOVE_URL + "?r=" + params.get("r") + "&s=1");
      } else {
        showResult(d.a, d.b, false);
        if (MODE === "love" && params.get("s") === "1") $("secretBanner").hidden = false;
      }
    } catch (e) {
      show("errorScreen");
    }
  } else if (params.has("d")) {
    try {
      partner = Fortune.decode(params.get("d"));
      if (!validPerson(partner)) throw new Error("bad");
      const msg = $("inviteMsg");
      msg.hidden = false;
      msg.innerHTML = T.inviteHtml;
      msg.querySelector("b").textContent = partner.n;
      $("introLead").innerHTML = T.leadSecond;
      // 2人目にはひみつモードの切りかえ・結果を見る欄は出さない
      document.querySelectorAll(".first-only").forEach(el => (el.hidden = true));
      show("introScreen");
    } catch (e) {
      show("errorScreen");
    }
  } else {
    $("introLead").innerHTML = T.leadFirst;
    show("introScreen");
  }

  // ===== ひみつモードの切りかえ（恋愛占いのページだけにある） =====
  const secretBox = $("secretMode");
  if (secretBox) {
    const label = secretBox.closest(".secret-toggle");
    secretBox.addEventListener("change", () => {
      label.classList.toggle("on", secretBox.checked);
      Sound.se("click", { volume: 0.6, rate: secretBox.checked ? 1.3 : 0.9 });
    });
  }

  // ===== ひみつモードの結果のURLを貼って見る（別の端末で見たいとき） =====
  const openBtn = $("secretOpenBtn");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      const err = $("secretOpenError");
      try {
        const u = new URL($("secretOpenInput").value.trim());
        const r = u.searchParams.get("r");
        const d = Fortune.decode(r);
        if (!validPerson(d.a) || !validPerson(d.b)) throw new Error("bad");
        location.href = LOVE_URL + "?r=" + r + "&s=1";
      } catch (e) {
        err.textContent = "結果のURLを貼ってね（?r= がついているURL）";
        Sound.se("close", { volume: 0.6 });
      }
    });
  }

  // ===== スタート → 名前 → 質問 =====
  const nameInput = $("nameInput");
  $("introBtn").addEventListener("click", () => {
    Sound.se("open", { volume: 0.8 });
    show("nameScreen");
    setTimeout(() => nameInput.focus(), 350);
  });

  function submitName() {
    const v = nameInput.value.trim();
    if (!v) {
      $("nameError").textContent = "名前を入れてね！";
      Sound.se("close", { volume: 0.6 });
      return;
    }
    $("nameError").textContent = "";
    myName = v.slice(0, 12);
    Sound.se("click", { volume: 0.7 });
    show("quizScreen");
    quiz.start();
  }
  $("nameBtn").addEventListener("click", submitName);
  nameInput.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) submitName(); });

  function finishQuiz(answers) {
    const me = { n: myName, a: answers.join("") };
    if (partner) {
      Fortune.loading(show, "loadingScreen", 1800, () => showResult(partner, me, true));
      return;
    }
    // 1人目: 相手に送るURLを作る
    const secret = MODE === "secret" || (secretBox && secretBox.checked);
    const data = Fortune.encode({ v: 1, ...me });
    let url, text;
    if (secret) {
      url = SECRET_URL + "?d=" + data;
      text = TEXT.secret.inviteShare(myName);
      // 恋愛占いのページから作ったときだけ「本人の招待」として覚える
      if (MODE === "love") rememberSecret(me);
    } else {
      url = LOVE_URL + "?d=" + data;
      text = TEXT.love.inviteShare(myName);
    }
    Fortune.share($("inviteShare"), url, text);
    const secretNote = $("secretNote");
    if (secretNote) secretNote.hidden = !(MODE === "love" && secret);
    show("linkScreen");
    Sound.se("accent", { volume: 0.8 });
  }

  // ===== 相性の計算（どちらが先でも同じ結果になる） =====
  function calc(pa, pb) {
    const A = [...pa.a].map(Number);
    const B = [...pb.a].map(Number);
    const per = QUESTIONS.map((q, i) => q.m[A[i]][B[i]]);
    const avg = per.reduce((s, v) => s + v, 0) / per.length;
    // 名前から決まる小さなおまけ（-5〜+5）。名前を並べかえてから使うので、どちらから見ても同じ
    const s = [pa.n, pb.n].sort().join("💗");
    let h = 0;
    for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    const total = Math.max(1, Math.min(100, Math.round(avg + (h % 11) - 5)));
    const cats = CAT_QS.map((qs, i) => ({
      name: T.cats[i],
      advice: T.advice[i],
      score: Math.round(qs.reduce((sum, q) => sum + per[q], 0) / qs.length),
    }));
    // おすすめスポット（おでかけの質問の答えから。順番を入れかえても同じになるようにする）
    const d1 = A[1], d2 = B[1];
    const spot = d1 === d2
      ? ["遊園地", "おしゃれなカフェ", "水族館", "おうちで映画会"][d1]
      : ["プラネタリウム", "動物園", "夜景の見える公園"][(d1 + d2 + d1 * d2) % 3];
    return { total, cats, spot };
  }

  // ===== 結果の表示 =====
  function showResult(pa, pb, iAmSecond) {
    const { total, cats, spot } = calc(pa, pb);
    const [, tier, msgFn] = T.tiers.find(([min]) => total >= min);
    $("rNameA").textContent = pa.n;
    $("rNameB").textContent = pb.n;
    $("rTier").textContent = tier;
    $("rMsg").textContent = msgFn(pa.n, pb.n);
    $("rSpot").textContent = spot;
    $("rAdvice").textContent = [...cats].sort((x, y) => x.score - y.score)[0].advice;

    const box = $("rCats");
    box.innerHTML = "";
    cats.forEach(c => {
      const name = document.createElement("span");
      name.textContent = c.name;
      const bar = document.createElement("div");
      bar.className = "cat-bar";
      bar.innerHTML = `<i data-w="${c.score}"></i>`;
      const num = document.createElement("b");
      num.textContent = c.score + "%";
      box.append(name, bar, num);
    });

    // 2人目なら、結果を1人目に送れるようにする（送るURLは、今いるページと同じ種類）
    if (iAmSecond) {
      const url = Fortune.pageUrl + "?r=" + Fortune.encode({ v: 1, a: pa, b: pb });
      $("sendBack").hidden = false;
      $("sendBackLead").textContent = `この結果を ${pa.n} さんにも送ってあげよう！`;
      Fortune.share($("resultShare"), url, T.resultShare(pa.n, pb.n, total));
      // 再読み込みしても同じ結果が出るように、アドレス欄を結果のURLにしておく
      history.replaceState(null, "", url);
    }

    show("resultScreen");
    Sound.se("accent", { volume: 0.9 });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $("meterFill").style.strokeDashoffset = 402 * (1 - total / 100);
      box.querySelectorAll("i").forEach(i => (i.style.width = i.dataset.w + "%"));
    }));
    Fortune.countUp($("rPct"), total, 1600);
  }
})();
