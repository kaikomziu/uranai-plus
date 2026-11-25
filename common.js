// ===== 全ページ共通: タスクバー・BGMプレイヤー・ウィンドウ（更新履歴・クレジット） =====
// 使い方: audio.js のあとに <script src="(サイトの一番上)/common.js"></script> を読み込む。
// サイトの一番上のフォルダは、このファイルの場所から自動で求めるので、どの階層のページでも動く。

const VERSION = "v0.09";

// サイトの一番上（index.html があるフォルダ）の URL
const SITE_ROOT = new URL(".", document.currentScript.src);
const siteUrl = path => new URL(path, SITE_ROOT).href;

// 占いの一覧（/list/ のページとトップの入口がここを見る）
// id はランダムな英数字。URL は /list/<id>/ になる
const FORTUNES = [
  // share: true は「URLを送って相手とあそぶ」占い（一覧に「ふたりで」と出る）
  { id: "50o72qn", emoji: "🧩", title: "タイプ診断", color: "#ff5fa2",
    desc: "10この質問に答えると、あなたが6タイプのどれかがわかるよ！" },
  { id: "j0bajrr", emoji: "🌞", title: "今日の運勢", color: "#ff8a3d",
    desc: "名前と誕生日で、今日の運勢をチェック！ 毎日かわるよ。" },
  { id: "p9e88lj", emoji: "🃏", title: "タロット占い", color: "#7646e0",
    desc: "22枚のカードからメッセージをひこう。1枚引きと3枚引きがえらべるよ。" },
  { id: "0ll1z1i", emoji: "⛩️", title: "おみくじ", color: "#e5484d",
    desc: "1日1回ひけるおみくじ。大吉が出るかな？" },
  { id: "5v8zmrv", emoji: "💘", title: "恋愛相性占い", color: "#ff4f8b", share: true,
    desc: "あなたがこたえてURLを送ると、相手もこたえて、ふたりの相性がわかるよ！" },
  { id: "8zn10ev", emoji: "🤝", title: "友情相性占い", color: "#1b8fd9", share: true,
    desc: "友だちにURLを送って、ふたりの友情相性をチェック！" },
  { id: "v0g2okb", emoji: "🙋", title: "わたしのこと知ってる？クイズ", color: "#e09000", share: true,
    desc: "自分のことをこたえてURLを送ると、相手があなたの答えを当てるクイズに！" },
];
const fortuneUrl = f => siteUrl("list/" + f.id + "/");

(() => {
  // ---------- 部品をページに差し込む ----------
  const html = `
  <nav class="taskbar">
    <a class="tb-logo" href="${siteUrl("")}">UraNai+</a>
    <span class="tb-sep"></span>
    <a class="tb-btn" href="${siteUrl("list/")}"><span class="ico">🔮</span><span class="long">占い一覧</span><span class="short">一覧</span></a>
    <button class="tb-btn" id="openChangelog" type="button"><span class="ico">📜</span><span class="long">更新履歴</span><span class="short">履歴</span></button>
    <!-- 作者（かるわか）のほかのゲーム一覧を新しいタブで開く -->
    <a class="tb-btn" href="https://kaikomziu.github.io/game-links/" target="_blank" rel="noopener"><span class="ico">🎮</span><span class="long">作者の別のゲームで遊ぶ</span><span class="short">ゲーム</span></a>
    <div class="tb-right">
      <span class="tb-version">${VERSION}</span>
      <span class="tb-clock" id="clock">--:--</span>
    </div>
  </nav>

  <div class="player" id="player">
    <button class="pl-btn" id="bgmToggle" type="button" aria-label="再生">▶</button>
    <div class="pl-main">
      <div class="pl-title">♪ おひるすぎ <small>/ ふぁいの音楽置き場</small></div>
      <div class="pl-seek">
        <span id="bgmCur">0:00</span>
        <input class="bar" id="bgmSeek" type="range" min="0" max="1000" value="0" aria-label="再生位置">
        <span id="bgmDur">0:00</span>
      </div>
    </div>
    <input class="bar pl-vol" id="bgmVol" type="range" min="0" max="100" value="50" aria-label="音量">
    <div class="pl-side">
      <button class="pl-icon" id="bgmMute" type="button" aria-label="ミュート">🔊</button>
      <button class="pl-credit" id="openCredits" type="button">クレジット</button>
    </div>
  </div>

  <div class="overlay" id="creditsOverlay" aria-hidden="true">
    <section class="window" role="dialog" aria-modal="true" aria-label="クレジット">
      <div class="win-head">
        <span>🎵</span><span>クレジット</span>
        <button class="win-close" type="button" aria-label="閉じる">✕</button>
      </div>
      <div class="win-body">
        <h2>BGM</h2>
        <p class="credit-item"><b>「おひるすぎ」</b><br>ふぁいの音楽置き場 / fai-musics</p>
        <h2>効果音</h2>
        <p class="credit-item"><b>OtoLogic</b>（<a href="https://otologic.jp/" target="_blank" rel="noopener">otologic.jp</a>）<br>
          <a href="https://creativecommons.org/licenses/by/4.0/deed.ja" target="_blank" rel="noopener">CC BY 4.0</a></p>
        <p class="credit-item"><b>効果音ラボ</b>（<a href="https://soundeffect-lab.info/" target="_blank" rel="noopener">soundeffect-lab.info</a>）</p>
      </div>
    </section>
  </div>

  <div class="overlay" id="changelogOverlay" aria-hidden="true">
    <section class="window" role="dialog" aria-modal="true" aria-label="更新履歴">
      <div class="win-head">
        <span>📜</span><span>更新履歴</span>
        <button class="win-close" type="button" aria-label="閉じる">✕</button>
      </div>
      <div class="win-body" id="changelogBody">読み込み中…</div>
    </section>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  // ---------- タスクバーの時計 ----------
  const clock = document.getElementById("clock");
  const tick = () => {
    const d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  tick();
  setInterval(tick, 10000);

  // ---------- CHANGELOG.md の簡易 Markdown 変換 ----------
  const escapeHtml = s =>
    s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 行内の装飾（**太字** と `コード`）
  const inline = s =>
    escapeHtml(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 見出し・箇条書き（入れ子あり）・段落だけ対応
  function markdownToHtml(md) {
    let out = "";
    const stack = []; // 開いている <ul> のインデント幅
    const closeLists = indent => {
      while (stack.length && stack[stack.length - 1] >= indent) {
        out += "</li></ul>";
        stack.pop();
      }
    };
    for (const raw of md.replace(/\r/g, "").split("\n")) {
      const li = raw.match(/^(\s*)[-*] (.*)$/);
      if (li) {
        const indent = li[1].length;
        if (stack.length && stack[stack.length - 1] === indent) {
          out += "</li>";
        } else if (stack.length && stack[stack.length - 1] > indent) {
          closeLists(indent + 1);
          out += "</li>";
        } else {
          out += "<ul>";
          stack.push(indent);
        }
        out += "<li>" + inline(li[2]);
        continue;
      }
      closeLists(0);
      const h = raw.match(/^(#{1,3}) (.*)$/);
      if (h) out += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
      else if (raw.trim()) out += "<p>" + inline(raw) + "</p>";
    }
    closeLists(0);
    return out;
  }

  const changelogBody = document.getElementById("changelogBody");
  let changelogLoaded = false;
  async function loadChangelog() {
    try {
      const res = await fetch(siteUrl("CHANGELOG.md"), { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      changelogBody.innerHTML = markdownToHtml(await res.text());
      changelogLoaded = true;
    } catch (e) {
      changelogBody.innerHTML =
        '<p class="err">更新履歴を読み込めませんでした 🙏<br>（ファイルを直接開いているときは読み込めません。サーバー経由で開いてね）</p>';
    }
  }

  // ---------- ウィンドウの開け閉め ----------
  function openWin(ov) {
    ov.classList.add("open");
    ov.setAttribute("aria-hidden", "false");
    Sound.se("open", { volume: 0.8 });
  }

  function closeWin(ov) {
    if (!ov.classList.contains("open")) return;
    ov.classList.remove("open");
    ov.setAttribute("aria-hidden", "true");
    Sound.se("close", { volume: 0.7 });
  }

  for (const ov of document.querySelectorAll(".overlay")) {
    ov.querySelector(".win-close").addEventListener("click", () => closeWin(ov));
    // 背景クリックでも閉じる
    ov.addEventListener("click", e => { if (e.target === ov) closeWin(ov); });
  }
  addEventListener("keydown", e => {
    if (e.key === "Escape") document.querySelectorAll(".overlay.open").forEach(closeWin);
  });

  document.getElementById("openChangelog").addEventListener("click", () => {
    openWin(document.getElementById("changelogOverlay"));
    if (!changelogLoaded) loadChangelog();
  });
  document.getElementById("openCredits").addEventListener("click", () =>
    openWin(document.getElementById("creditsOverlay"))
  );

  // タスクバーのボタン（リンク含む）を押したときの音
  document.querySelectorAll(".tb-btn, .tb-logo").forEach(b =>
    b.addEventListener("pointerdown", () => Sound.se("click", { volume: 0.7 }))
  );

  // ---------- BGM プレイヤー ----------
  const toggleBtn = document.getElementById("bgmToggle");
  const seekBar = document.getElementById("bgmSeek");
  const volBar = document.getElementById("bgmVol");
  const muteBtn = document.getElementById("bgmMute");
  const curEl = document.getElementById("bgmCur");
  const durEl = document.getElementById("bgmDur");
  let seeking = false; // バーをドラッグ中は自動で動かさない

  const fmt = sec => Math.floor(sec / 60) + ":" + String(Math.floor(sec % 60)).padStart(2, "0");
  const setFill = (bar, ratio) => bar.style.setProperty("--p", (ratio * 100).toFixed(1) + "%");

  function render(s) {
    toggleBtn.textContent = s.playing ? "❚❚" : "▶";
    toggleBtn.setAttribute("aria-label", s.playing ? "一時停止" : "再生");
    muteBtn.textContent = s.muted || s.volume === 0 ? "🔇" : "🔊";
    durEl.textContent = fmt(s.duration);
    volBar.value = Math.round(s.volume * 100);
    if (!seeking && s.duration) {
      seekBar.value = Math.round((s.position / s.duration) * 1000);
      curEl.textContent = fmt(s.position);
      setFill(seekBar, s.position / s.duration);
    }
    setFill(volBar, s.muted ? 0 : s.volume);
  }

  Sound.onChange(render);
  // 再生中は位置の表示を毎フレーム更新
  (function loop() {
    const s = Sound.state();
    if (s.playing) render(s);
    requestAnimationFrame(loop);
  })();

  toggleBtn.addEventListener("click", () => Sound.toggle());
  muteBtn.addEventListener("click", () => Sound.toggleMute());

  seekBar.addEventListener("input", () => {
    seeking = true;
    curEl.textContent = fmt((seekBar.value / 1000) * Sound.state().duration);
    setFill(seekBar, seekBar.value / 1000);
  });
  seekBar.addEventListener("change", () => {
    Sound.seek((seekBar.value / 1000) * Sound.state().duration);
    seeking = false;
  });

  volBar.addEventListener("input", () => Sound.setVolume(volBar.value / 100));
})();
