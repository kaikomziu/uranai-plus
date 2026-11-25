// ===== 占いページ共通の道具（画面切り替え・質問の進行・URL共有・乱数など） =====
// audio.js と common.js のあとに読み込む
const Fortune = (() => {
  // ---------- 画面の切り替え ----------
  // ids: ["introScreen", ...]。show(id) でその画面だけ出す
  function screens(ids) {
    return id => {
      ids.forEach(s => document.getElementById(s).classList.toggle("show", s === id));
      scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  // ---------- URL にのせるデータ（JSON → UTF-8 → base64url） ----------
  function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach(b => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(str) {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // このページの URL（? 以降なし）
  const pageUrl = location.origin + location.pathname;

  // 名前のチェック（1〜12文字）
  const validName = n => typeof n === "string" && n.trim().length > 0 && n.length <= 12;

  // ---------- 決まった結果を出すための乱数 ----------
  // 同じ文字列からは毎回同じ数が出る
  function hash(str) {
    let h = 2166136261;
    for (const ch of str) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  // シード付きの乱数（0〜1）
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

  const pickOne = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

  // 今日の日付（YYYY-MM-DD、端末の時刻で）
  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ---------- 4択の質問を進める ----------
  // opts: { questions: [{ q, a: [4つ] }], ids: { num, text, progressText, fill, choices, back, panel }, onPick?(qi, ci, btn) -> ms, onDone(answers) }
  // onPick が数字を返したら、そのミリ秒だけ待ってから次の質問へ（正解発表などの演出用）
  function quiz(opts) {
    const $ = id => document.getElementById(opts.ids[id]);
    let current = 0;
    let answers = [];
    let locked = false;

    function render() {
      const item = opts.questions[current];
      $("num").textContent = "Q" + (current + 1);
      $("text").textContent = item.q;
      $("progressText").textContent = current + 1 + "/" + opts.questions.length;
      $("fill").style.width = (current / opts.questions.length) * 100 + "%";
      $("back").disabled = current === 0 || !!opts.noBack;

      const box = $("choices");
      box.innerHTML = "";
      item.a.forEach((label, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.style.animationDelay = i * 0.06 + "s";
        b.innerHTML = `<span class="mark">${"ABCD"[i]}</span><span></span>`;
        b.lastChild.textContent = label;
        b.addEventListener("click", () => pick(i, b));
        box.appendChild(b);
      });

      const panel = $("panel");
      panel.style.animation = "none";
      panel.offsetHeight;
      panel.style.animation = "pop 0.4s cubic-bezier(.3,1.5,.5,1) both";
      locked = false;
    }

    function pick(i, btn) {
      if (locked) return;
      locked = true;
      btn.classList.add("picked");
      answers[current] = i;
      let wait = 260;
      if (opts.onPick) {
        const w = opts.onPick(current, i, btn);
        if (typeof w === "number") wait = w;
      } else {
        Sound.se("click", { volume: 0.7, rate: 1 + current * 0.05 });
      }
      setTimeout(() => {
        current++;
        if (current < opts.questions.length) render();
        else {
          $("fill").style.width = "100%";
          opts.onDone(answers.slice());
        }
      }, wait);
    }

    $("back").onclick = () => {
      if (current === 0 || locked || opts.noBack) return;
      current--;
      answers.length = current;
      Sound.se("close", { volume: 0.6 });
      render();
    };

    return {
      start() {
        current = 0;
        answers = [];
        render();
      },
    };
  }

  // ---------- 診断中の演出 ----------
  function loading(show, screenId, ms, done) {
    show(screenId);
    let n = 0;
    const timer = setInterval(() => Sound.se("tick", { volume: 0.35, rate: 1 + (n++ % 4) * 0.12 }), 220);
    setTimeout(() => {
      clearInterval(timer);
      done();
    }, ms);
  }

  // ---------- 数字をカウントアップ ----------
  function countUp(el, to, ms = 1400) {
    const start = performance.now();
    (function step(now) {
      const t = Math.min(1, (now - start) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  // ---------- URL のコピー・送るボタン ----------
  // box: .url-box と .share-row を入れる要素。中身はここで作る
  function share(box, url, text) {
    box.innerHTML = `
      <div class="url-box">
        <input class="url-input" type="text" readonly aria-label="送るURL">
        <button class="copy-btn" type="button">コピー</button>
      </div>
      <div class="share-row"></div>`;
    const input = box.querySelector(".url-input");
    const copyBtn = box.querySelector(".copy-btn");
    const row = box.querySelector(".share-row");
    input.value = url;
    input.onclick = () => input.select();

    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
      } catch (e) {
        input.select();
        document.execCommand("copy");
      }
      copyBtn.textContent = "コピーした！";
      Sound.se("click", { volume: 0.7, rate: 1.3 });
      setTimeout(() => (copyBtn.textContent = "コピー"), 1600);
    };

    const add = (cls, label, href) => {
      const a = document.createElement(href ? "a" : "button");
      a.className = "share-btn " + cls;
      a.textContent = label;
      if (href) {
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener";
      } else {
        a.type = "button";
      }
      a.addEventListener("pointerdown", () => Sound.se("click", { volume: 0.7 }));
      row.appendChild(a);
      return a;
    };
    if (navigator.share) add("native", "送る").onclick = () => navigator.share({ text, url }).catch(() => {});
    add("line", "LINEで送る", "https://line.me/R/share?text=" + encodeURIComponent(text + "\n" + url));
    add("x", "𝕏 でポスト", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url));
  }

  // ---------- 結果をシェアするだけのボタン（URL共有のない占い用） ----------
  function shareText(row, text, url = pageUrl) {
    row.innerHTML = "";
    const add = (cls, label, href) => {
      const a = document.createElement("a");
      a.className = "share-btn " + cls;
      a.textContent = label;
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.addEventListener("pointerdown", () => Sound.se("click", { volume: 0.7 }));
      row.appendChild(a);
    };
    add("x", "𝕏 で結果をポスト", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url));
    add("line", "LINEで送る", "https://line.me/R/share?text=" + encodeURIComponent(text + "\n" + url));
  }

  return { screens, encode, decode, pageUrl, validName, hash, rng, pickOne, today, quiz, loading, countUp, share, shareText };
})();
