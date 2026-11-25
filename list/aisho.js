// ===== 相性診断（名前で占う）。トップページと list/5v8zmrv/ で使う =====
// 名前はこの端末（localStorage）にだけ保存し、URL には入れない。
// だから結果のURLを送っても、相手には名前が見えない（自分の端末では名前つきで見える）。
// common.js のあとに読み込む。
const Aisho = (() => {
  const SAVE_KEY = "uranai-aisho-names"; // { 結果のキー: { a, b, at } }

  // ---------- 名前のそろえ方（全角/半角・カタカナ/ひらがな・空白のちがいで結果が変わらないように） ----------
  function normalize(name) {
    return name
      .normalize("NFKC")
      .replace(/\s+/g, "")
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }

  // ---------- 名前から決まる乱数 ----------
  function hash(str) {
    let h = 2166136261;
    for (const ch of str) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- 結果の言葉 ----------
  const CATS = ["💬 会話のテンポ", "🎈 いっしょの楽しさ", "🤝 信頼度", "🌈 価値観"];
  const ADVICE = [
    "思っていることは、ちょっとだけ言葉にして伝えてみて。会話がもっとはずむよ。",
    "いつもとちがう場所に、いっしょに行ってみよう。新しい楽しみが見つかるかも。",
    "小さな約束をきちんと守ると、信頼がぐっと深まるよ。",
    "考え方のちがいも「そういうのもアリだね」と楽しむのがコツ。",
  ];
  const TIERS = [
    [90, "💫 さいこうの相性", "言わなくても気持ちが通じ合える、さいこうの組み合わせ！ いっしょにいるだけで、自然と笑顔になれるふたりです。"],
    [78, "🌟 ばっちりの相性", "おたがいの良いところを引き出し合える、ばっちりなふたり。いっしょにいる時間が、どんどん楽しくなっていきそう。"],
    [65, "😊 いい感じの相性", "なかなかいい感じ！ ちょっとしたちがいはあるけれど、それがふたりの会話を楽しくしてくれます。"],
    [50, "🌱 これから深まる相性", "これからどんどん仲良くなれるふたり。いっしょに過ごす時間が増えるほど、相性も良くなっていくよ。"],
    [0, "🧩 正反対でおもしろいふたり", "考え方が正反対！ だからこそ、自分にないものを持っている相手と、新しい発見がいっぱいです。"],
  ];
  const LUCKY = ["遊園地", "おしゃれなカフェ", "水族館", "プラネタリウム", "動物園", "公園でピクニック", "映画館", "ゲームセンター"];
  const COLORS = ["さくらピンク", "ミントグリーン", "そらいろブルー", "ラベンダー", "レモンイエロー", "みかんオレンジ"];

  // ---------- URL にのせるデータ（JSON → base64url） ----------
  function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach(b => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(str) {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  }

  // ---------- 名前を保存／読み出し ----------
  function loadNames() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveNames(key, a, b) {
    try {
      const all = loadNames();
      all[key] = { a, b, at: Date.now() };
      // 古いものから消して、50件までにしておく
      const keys = Object.keys(all).sort((x, y) => all[x].at - all[y].at);
      while (keys.length > 50) delete all[keys.shift()];
      localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    } catch (e) { /* 保存できない環境では名前は出ない */ }
  }

  // ---------- 診断する → 結果のURLを返す ----------
  function diagnose(nameA, nameB) {
    // 名前の順番を並べかえてから使うので、どちらを先に入れても同じ結果
    const pair = [normalize(nameA), normalize(nameB)].sort().join("|");
    const r = rng(hash("uranai+aisho:" + pair));
    const total = Math.round(35 + ((r() + r() + r()) / 3) * 65); // 35〜100、真ん中あたりが出やすい
    const cats = CATS.map(() => Math.max(20, Math.min(100, Math.round(total + (r() - 0.5) * 34))));
    const lucky = Math.floor(r() * LUCKY.length);
    const color = Math.floor(r() * COLORS.length);
    // この結果を見分けるためのキー（名前とは関係のないランダムな文字）
    const key = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
    saveNames(key, nameA, nameB);
    return AISHO_URL + "?r=" + encode({ v: 2, k: key, s: total, c: cats, l: lucky, o: color });
  }

  // ---------- 結果のURLを読む ----------
  function read(param) {
    const d = decode(param);
    const ok =
      d && d.v === 2 && typeof d.k === "string" && /^[a-z0-9]{6}$/.test(d.k) &&
      Number.isInteger(d.s) && d.s >= 1 && d.s <= 100 &&
      Array.isArray(d.c) && d.c.length === CATS.length && d.c.every(n => Number.isInteger(n) && n >= 0 && n <= 100) &&
      Number.isInteger(d.l) && LUCKY[d.l] && Number.isInteger(d.o) && COLORS[d.o];
    if (!ok) throw new Error("bad");
    const names = loadNames()[d.k] || null; // この端末で診断したものなら名前がある
    const [, tier, msg] = TIERS.find(([min]) => d.s >= min);
    const low = d.c.indexOf(Math.min(...d.c));
    return {
      total: d.s,
      cats: CATS.map((name, i) => ({ name, score: d.c[i] })),
      tier,
      msg,
      advice: ADVICE[low],
      lucky: LUCKY[d.l],
      color: COLORS[d.o],
      names,
    };
  }

  // ---------- 名前入力フォームを動かす（トップと相性診断ページで共通） ----------
  // form: { a: input, b: input, btn: button, err: 要素 }
  function bindForm(form) {
    const go = () => {
      const a = form.a.value.trim();
      const b = form.b.value.trim();
      if (!a || !b) {
        form.err.textContent = !a ? "あなたの名前を入れてね！" : "相手の名前を入れてね！";
        Sound.se("close", { volume: 0.6 });
        return;
      }
      form.err.textContent = "";
      Sound.se("open", { volume: 0.8 });
      location.href = diagnose(a.slice(0, 12), b.slice(0, 12));
    };
    form.btn.addEventListener("click", go);
    [form.a, form.b].forEach(inp =>
      inp.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.isComposing) {
          if (inp === form.a && !form.b.value.trim()) form.b.focus();
          else go();
        }
      })
    );
  }

  return { diagnose, read, bindForm };
})();
