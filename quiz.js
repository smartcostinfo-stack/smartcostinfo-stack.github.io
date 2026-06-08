// ===== 診断ロジック =====
(function () {
  "use strict";

  const STORE_KEY = "gqz_progress_v2";

  const screens = {
    start: document.getElementById("screen-start"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };

  // 状態
  let current = 0; // 現在の質問インデックス
  let answers = []; // answers[i] = 選んだ選択肢インデックス

  // 要素
  const qCard = document.getElementById("q-card");
  const qNumber = document.getElementById("q-number");
  const qText = document.getElementById("q-text");
  const qCounter = document.getElementById("q-counter");
  const qPercent = document.getElementById("q-percent");
  const progressBar = document.getElementById("progress-bar");
  const optionsBox = document.getElementById("options");
  const btnBack = document.getElementById("btn-back");

  function track(name, params) {
    try {
      if (typeof gtag === "function") gtag("event", name, params || {});
    } catch (e) {}
  }

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("is-active"));
    screens[name].classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // 進捗の保存・復元（途中離脱対策）
  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ current, answers }));
    } catch (e) {}
  }
  function clearProgress() {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (e) {}
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (o && Array.isArray(o.answers) && typeof o.current === "number") return o;
    } catch (e) {}
    return null;
  }

  // 質問を描画
  function renderQuestion() {
    const total = QUESTIONS.length;
    const item = QUESTIONS[current];

    qNumber.textContent = "QUESTION " + pad(current + 1);
    qText.textContent = item.q;
    qCounter.textContent = "Q" + (current + 1) + " / " + total;

    const pct = Math.round(((current + 1) / total) * 100);
    qPercent.textContent = pct + "%";
    progressBar.style.width = pct + "%";

    qCard.classList.remove("swap");
    void qCard.offsetWidth;
    qCard.classList.add("swap");

    // MBTI風・横一列の5段階。色＋大きさ＋ラベルで識別（色覚配慮）
    optionsBox.innerHTML = "";
    const row = document.createElement("div");
    row.className = "likert";

    const left = document.createElement("span");
    left.className = "likert-end agree";
    left.textContent = "あてはまる";
    row.appendChild(left);

    SCALE.forEach((opt, i) => {
      const col = document.createElement("div");
      col.className = "likert-col";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "likert-dot d" + i;
      btn.setAttribute("aria-label", opt.t);
      btn.title = opt.t;
      if (answers[current] === i) btn.classList.add("picked");
      btn.addEventListener("click", () => choose(i));

      const lab = document.createElement("span");
      lab.className = "dot-label";
      lab.textContent = opt.short;

      col.appendChild(btn);
      col.appendChild(lab);
      row.appendChild(col);
    });

    const right = document.createElement("span");
    right.className = "likert-end disagree";
    right.textContent = "あてはまらない";
    row.appendChild(right);

    optionsBox.appendChild(row);

    btnBack.style.visibility = current === 0 ? "hidden" : "visible";
  }

  function choose(i) {
    answers[current] = i;
    saveProgress();
    if (current < QUESTIONS.length - 1) {
      current++;
      renderQuestion();
    } else {
      finish();
    }
  }

  // 4軸の集計 → tally
  function computeTally() {
    const tally = {};
    answers.forEach((ansIdx, qIdx) => {
      const v = SCALE[ansIdx].value;
      const q = QUESTIONS[qIdx];
      const ax = AXES.find((a) => a.key === q.axis);
      const opposite = q.pole === ax.plus ? ax.minus : ax.plus;
      tally[q.pole] = (tally[q.pole] || 0) + v;
      tally[opposite] = (tally[opposite] || 0) + (4 - v);
    });
    return tally;
  }

  function codeFromTally(tally) {
    let code = "";
    AXES.forEach((ax) => {
      const p = tally[ax.plus] || 0;
      const m = tally[ax.minus] || 0;
      // 完全に同点（全部「ふつう」等）の軸はランダムに決める。
      // これで「全問ふつう → 必ず同じ結果」という偏りを解消。
      if (p === m) code += Math.random() < 0.5 ? ax.plus : ax.minus;
      else code += p > m ? ax.plus : ax.minus;
    });
    return code;
  }

  function finish() {
    const tally = computeTally();
    const code = codeFromTally(tally);
    clearProgress();
    track("quiz_complete", { gambler_type: code });
    setUrl(code);
    renderResult(code, tally);
    show("result");
  }

  // 結果URLを ?type=CODE に
  function shareUrl(code) {
    return location.origin + location.pathname + "?type=" + code;
  }
  function setUrl(code) {
    try {
      history.replaceState(null, "", "?type=" + code);
    } catch (e) {}
  }

  // 軸パラメータのバーを描画
  function renderAxes(tally) {
    const box = document.getElementById("r-axes");
    box.innerHTML = "";
    if (!tally) {
      box.style.display = "none";
      return;
    }
    box.style.display = "";
    AXES.forEach((ax) => {
      const p = tally[ax.plus] || 0;
      const m = tally[ax.minus] || 0;
      const total = p + m || 1;
      const plusPct = Math.round((p / total) * 100);
      const dom = plusPct >= 50;

      const el = document.createElement("div");
      el.className = "axis";
      el.innerHTML =
        '<div class="axis-head">' +
        '<span class="' + (dom ? "on" : "") + '">' + ax.plusLabel + "</span>" +
        '<span class="axis-mid">' + ax.title + "</span>" +
        '<span class="' + (!dom ? "on" : "") + '">' + ax.minusLabel + "</span>" +
        "</div>" +
        '<div class="axis-track"><div class="axis-fill" style="width:' + plusPct + '%"></div></div>';
      box.appendChild(el);
    });
  }

  function setText(id, v) {
    document.getElementById(id).textContent = v;
  }

  // 結果を描画（tally 省略時は軸バー非表示＝他人の結果をURLで開いた場合）
  function renderResult(code, tally) {
    const t = CHARACTERS[code];
    if (!t) return;

    setText("r-code", code);
    // オリジナルSVGアバター（絵文字の代わり）
    var emojiBox = document.getElementById("r-emoji");
    if (typeof gamblerVisual === "function") emojiBox.innerHTML = gamblerVisual(code, 132);
    else if (typeof gamblerAvatar === "function") emojiBox.innerHTML = gamblerAvatar(code, 132);
    else emojiBox.textContent = t.emoji;
    setText("r-name", t.name);
    setText("r-copy", "“" + t.copy + "”");
    setText("r-quote", "「" + t.quote + "」");
    setText("r-desc", t.desc);
    setText("r-good", t.good);
    setText("r-wins", t.wins.emoji + " " + t.wins.name);
    setText("r-loses", t.loses.emoji + " " + t.loses.name);
    setText("r-strong", t.strong);
    setText("r-weak", t.weak);
    setText("r-advice", t.advice);
    setText("r-pick", t.pick);
    setText("r-game", t.game);
    setText("r-why", t.why);
    setText("r-roast", t.roast);

    renderAxes(tally);

    // シェア用テキスト＆リンク
    const url = shareUrl(code);
    const shareText =
      "私は【" + t.emoji + t.name + "（" + code + "）】でした!\n" +
      "勝てる相手は「" + t.wins.name + "」、苦手は「" + t.loses.name + "」。\n" +
      "あなたはどのギャンブラー? #ギャンブラータイプ診断";

    // QRコード（結果URLを符号化。友達がスキャンして相性チェック）
    try {
      const qbox = document.getElementById("qrcode");
      if (qbox && typeof QRCode === "function") {
        qbox.innerHTML = "";
        new QRCode(qbox, { text: url, width: 132, height: 132, colorDark: "#2b2d42", colorLight: "#ffffff" });
      }
    } catch (e) {}

    const xBtn = document.getElementById("btn-x");
    xBtn.href =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(shareText) + "&url=" + encodeURIComponent(url);

    const lineBtn = document.getElementById("btn-line");
    lineBtn.href =
      "https://line.me/R/msg/text/?" + encodeURIComponent(shareText + "\n" + url);

    // ネイティブ共有（Instagram等はモバイルの共有シートから）
    const nativeBtn = document.getElementById("btn-native");
    nativeBtn.onclick = function () {
      track("share_click", { method: "native", gambler_type: code });
      if (navigator.share) {
        navigator.share({ title: "ギャンブラータイプ診断", text: shareText, url: url }).catch(function () {});
      } else {
        copyToClipboard(url, nativeBtn, "リンクをコピーしました");
      }
    };

    // リンクコピー
    const copyBtn = document.getElementById("btn-copy");
    copyBtn.onclick = function () {
      track("share_click", { method: "copy", gambler_type: code });
      copyToClipboard(url, copyBtn, "コピー完了!");
    };

    // 画像保存（html2canvas）
    const saveBtn = document.getElementById("btn-save");
    saveBtn.onclick = function () {
      saveImage(code, saveBtn);
    };

    [xBtn, lineBtn].forEach(function (b) {
      b.addEventListener("click", function () {
        track("share_click", { method: b.id, gambler_type: code });
      });
    });

    // AdSense
    try {
      if (window.adsbygoogle) (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }

  function copyToClipboard(text, btn, msg) {
    const done = function () {
      if (!btn) return;
      const old = btn.dataset.label || btn.textContent;
      btn.dataset.label = old;
      btn.textContent = msg;
      setTimeout(function () { btn.textContent = btn.dataset.label; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }

  function saveImage(code, btn) {
    track("share_click", { method: "save_image", gambler_type: code });
    const node = document.getElementById("capture");
    if (typeof html2canvas !== "function" || !node) {
      alert("画像の保存に対応していない環境です。スクリーンショットをご利用ください。");
      return;
    }
    const label = btn.textContent;
    btn.textContent = "作成中…";
    // フォント・絵文字の描画ズレを防ぐため、フォント読み込み完了を待ってから撮影
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready
      .then(function () {
        return html2canvas(node, {
          backgroundColor: "#ffffff",
          scale: Math.min(window.devicePixelRatio || 1, 2) * 1.5,
          useCORS: true,
          logging: false,
        });
      })
      .then(function (canvas) {
        const link = document.createElement("a");
        link.download = "gambler-type-" + code + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        btn.textContent = label;
      })
      .catch(function () {
        btn.textContent = label;
        alert("画像の作成に失敗しました。お手数ですがスクリーンショットをご利用ください。");
      });
  }

  // リセット
  function reset() {
    current = 0;
    answers = [];
    clearProgress();
    track("quiz_start");
    renderQuestion();
    show("quiz");
    setUrl0();
  }
  function setUrl0() {
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }

  // イベント
  document.getElementById("btn-start").addEventListener("click", reset);
  document.getElementById("btn-retry").addEventListener("click", reset);
  btnBack.addEventListener("click", function () {
    if (current > 0) {
      current--;
      saveProgress();
      renderQuestion();
    }
  });

  // ===== 初期化 =====
  function init() {
    // 1) ?type=CODE で他人の結果を直接開いた場合
    const params = new URLSearchParams(location.search);
    const type = (params.get("type") || "").toUpperCase();
    if (CHARACTERS[type]) {
      renderResult(type, null); // 軸バーは本人診断時のみ
      show("result");
      return;
    }
    // 2) 途中まで回答していたら再開
    const saved = loadProgress();
    if (saved && saved.answers.length > 0 && saved.answers.length < QUESTIONS.length) {
      answers = saved.answers;
      current = Math.min(saved.current, QUESTIONS.length - 1);
      renderQuestion();
      show("quiz");
      return;
    }
    // 3) 通常はスタート画面
  }
  init();
})();
