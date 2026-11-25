// ===== Web Audio API で BGM と効果音を鳴らす =====
// ブラウザは「ユーザーが一度でも操作するまで音を出さない」ので、
// 最初のクリック／タップ／キー入力で AudioContext を起こして BGM を始める。
const Sound = (() => {
  // 音源の場所はこのファイル（サイトの一番上）を基準にする。どの階層のページでも同じように読める
  const BASE = new URL(".", document.currentScript.src);
  const at = path => new URL(path, BASE).href;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();

  // 音量のつながり: 音源 → (BGM用 / 効果音用) → 全体 → スピーカー
  const master = ctx.createGain();
  master.connect(ctx.destination);
  const bgmGain = ctx.createGain();
  bgmGain.connect(master);
  const seGain = ctx.createGain();
  seGain.gain.value = 0.6;
  seGain.connect(master);

  const SE_FILES = {
    click: at("audio/se-click.mp3"),   // ボタンを押したとき
    tick: at("audio/se-tick.mp3"),     // ロゴの文字が着地したとき
    accent: at("audio/se-accent.mp3"), // 「+」が登場したとき
    open: at("audio/se-open.mp3"),     // ウィンドウを開いたとき
    close: at("audio/se-close.mp3"),   // ウィンドウを閉じたとき
    whoosh: at("audio/se-whoosh.mp3"), // タスクバーが出てきたとき
  };
  const BGM_FILE = at("audio/bgm-ohirusugi.mp3");

  const buffers = {};
  const listeners = new Set();
  let bgmBuffer = null;
  let bgmSrc = null;
  let startedAt = 0;   // 今の再生を始めた ctx.currentTime
  let offset = 0;      // 曲のどこから再生したか（秒）
  let playing = false;
  let wantPlay = true; // 一時停止を押されるまでは「流したい」状態
  let volume = 0.5;
  let muted = false;

  // ---- ページを移動しても続きから流れるように状態を覚えておく ----
  // 音量・ミュート・一時停止は localStorage（次に来たときも同じ）、再生位置は sessionStorage（このタブの間だけ）
  const SAVE_KEY = "uranai-bgm";
  const POS_KEY = "uranai-bgm-pos";
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    if (typeof saved.volume === "number") volume = saved.volume;
    if (typeof saved.muted === "boolean") muted = saved.muted;
    if (saved.paused) wantPlay = false;
    const pos = JSON.parse(sessionStorage.getItem(POS_KEY) || "null");
    if (pos) offset = pos.position + (pos.playing ? (Date.now() - pos.at) / 1000 : 0);
  } catch (e) { /* 壊れていたら初期値のまま */ }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ volume, muted, paused: !wantPlay }));
      sessionStorage.setItem(POS_KEY, JSON.stringify({ position: position(), playing, at: Date.now() }));
    } catch (e) { /* 保存できない環境では覚えない */ }
  }
  addEventListener("pagehide", save);

  async function load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + " " + res.status);
    return ctx.decodeAudioData(await res.arrayBuffer());
  }

  // ---- 効果音 ----
  for (const [name, url] of Object.entries(SE_FILES)) {
    load(url).then(b => (buffers[name] = b)).catch(e => console.warn("効果音を読み込めません", e));
  }

  function playBuffer(buffer, volumeRate, rate) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = volumeRate;
    src.connect(g).connect(seGain);
    src.start();
  }

  function se(name, { volume: v = 1, rate = 1 } = {}) {
    const b = buffers[name];
    if (!b) return;
    if (ctx.state === "running") {
      playBuffer(b, v, rate);
    } else if (navigator.userActivation && navigator.userActivation.isActive) {
      // 操作の直後なら起こしてから鳴らす（最初のクリック音を取りこぼさない）
      ctx.resume().then(() => playBuffer(b, v, rate));
    }
    // 操作前（ページを開いた直後など）は鳴らさない
  }

  // ---- BGM ----
  load(BGM_FILE)
    .then(b => {
      bgmBuffer = b;
      offset = offset % b.duration;
      if (wantPlay && ctx.state === "running") play();
      emit();
    })
    .catch(e => console.warn("BGM を読み込めません", e));

  function duration() {
    return bgmBuffer ? bgmBuffer.duration : 0;
  }

  function position() {
    if (!bgmBuffer) return 0;
    if (!playing) return offset;
    return (offset + ctx.currentTime - startedAt) % bgmBuffer.duration;
  }

  function applyVolume(fadeSec = 0.15) {
    const target = muted ? 0 : volume;
    const now = ctx.currentTime;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(target, now + fadeSec);
  }

  function startSource() {
    bgmSrc = ctx.createBufferSource();
    bgmSrc.buffer = bgmBuffer;
    bgmSrc.loop = true; // 最後まで行ったら頭に戻ってずっと流れる
    bgmSrc.connect(bgmGain);
    bgmSrc.start(0, offset);
    startedAt = ctx.currentTime;
  }

  function stopSource() {
    if (!bgmSrc) return;
    try { bgmSrc.stop(); } catch (e) { /* もう止まっている */ }
    bgmSrc.disconnect();
    bgmSrc = null;
  }

  function play() {
    wantPlay = true;
    if (!bgmBuffer || playing) return;
    if (ctx.state !== "running") {
      ctx.resume().then(() => { if (wantPlay && !playing) play(); });
      return;
    }
    bgmGain.gain.value = 0;
    startSource();
    playing = true;
    applyVolume(1.2); // ふわっとフェードイン
    emit();
  }

  function pause() {
    wantPlay = false;
    if (!playing) return;
    offset = position();
    stopSource();
    playing = false;
    emit();
  }

  function toggle() {
    playing ? pause() : play();
  }

  function seek(sec) {
    if (!bgmBuffer) return;
    offset = Math.max(0, Math.min(sec, bgmBuffer.duration - 0.05));
    if (playing) {
      stopSource();
      startSource();
    }
    emit();
  }

  function setVolume(v) {
    volume = v;
    if (v > 0) muted = false;
    applyVolume();
    emit();
  }

  function toggleMute() {
    muted = !muted;
    applyVolume();
    emit();
  }

  function state() {
    return { playing, loaded: !!bgmBuffer, position: position(), duration: duration(), volume, muted };
  }

  function onChange(fn) {
    listeners.add(fn);
    fn(state());
  }

  function emit() {
    save();
    const s = state();
    listeners.forEach(fn => fn(s));
  }

  // 最初の操作で音を出せるようにする（再生ボタン自身は toggle に任せる）
  function unlock(e) {
    const onToggle = e.target.closest && e.target.closest("#bgmToggle");
    ctx.resume().then(() => {
      if (wantPlay && !playing && !onToggle) play();
    });
    removeEventListener("pointerdown", unlock, true);
    removeEventListener("keydown", unlock, true);
  }
  addEventListener("pointerdown", unlock, true);
  addEventListener("keydown", unlock, true);

  // 自動再生が許可されている環境なら、操作しなくてもすぐ始まる
  ctx.resume().catch(() => {});

  return { se, play, pause, toggle, seek, setVolume, toggleMute, state, onChange, isRunning: () => ctx.state === "running" };
})();
