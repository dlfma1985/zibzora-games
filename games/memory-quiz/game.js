/* 메모리 퀴즈 엔진.
   글은 levels.js의 MEMORY_QUIZ_LEVELS만 추가하면 됩니다. */
(function () {
  "use strict";

  var KEY = "zibzora.memory-quiz.v1";
  var TIERS = [
    { tier: 10, name: "메모리 10", blurb: "짧은 글" },
    { tier: 20, name: "메모리 20", blurb: "조금 긴 글" },
    { tier: 30, name: "메모리 30", blurb: "긴 글" }
  ];
  var MARK_MS = 1100;

  var app = document.getElementById("app");
  var backBtn = document.getElementById("btn-back");
  var topTitle = document.getElementById("top-title");
  var progressEl = document.getElementById("progress");
  var timerEl = document.getElementById("timer");
  var fsBtn = document.getElementById("btn-fullscreen");
  var pickEl = document.getElementById("level-pick");
  var memoTitle = document.getElementById("memo-title");
  var countWrap = document.getElementById("count-wrap");
  var memoCount = document.getElementById("memo-count");
  var passageEl = document.getElementById("passage");
  var passageMore = document.getElementById("passage-more");
  var feedbackEl = document.getElementById("feedback");
  var promptEl = document.getElementById("prompt");
  var choicesEl = document.getElementById("choices");
  var resultTier = document.getElementById("result-tier");
  var resultTitle = document.getElementById("result-title");
  var resultCorrect = document.getElementById("result-correct");
  var resultTime = document.getElementById("result-time");
  var resultBest = document.getElementById("result-best");
  var resultNote = document.getElementById("result-note");

  var levels = normalize(window.MEMORY_QUIZ_LEVELS);
  var save = loadSave();
  var phase = "home";
  var level = null;
  var questions = [];
  var qIndex = 0;
  var correct = 0;
  var locked = false;
  var elapsedMs = 0;
  var quizStartedAt = 0;
  var memorizeTimer = 0;
  var quizTimer = 0;
  var advanceTimer = 0;
  var fsTouchAt = 0;

  function normalize(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    raw.forEach(function (item) {
      if (!item || (item.tier !== 10 && item.tier !== 20 && item.tier !== 30)) return;
      var id = typeof item.id === "string" ? item.id.trim() : "";
      var title = typeof item.title === "string" ? item.title.trim() : "";
      var passage = typeof item.passage === "string" ? item.passage.trim() : "";
      if (!id || !title || !passage || !Array.isArray(item.questions)) return;
      var questionsOut = [];
      item.questions.forEach(function (q) {
        if (!q || typeof q.prompt !== "string" || !q.prompt.trim()) return;
        if (!Array.isArray(q.choices) || q.choices.length < 2) return;
        var choices = [];
        for (var i = 0; i < q.choices.length; i += 1) {
          if (typeof q.choices[i] !== "string" || !q.choices[i].trim()) return;
          choices.push(q.choices[i]);
        }
        var answer = -1;
        if (typeof q.answer === "number" && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < choices.length) {
          answer = q.answer;
        } else if (typeof q.answer === "string") {
          answer = choices.indexOf(q.answer);
        }
        if (answer < 0) return;
        questionsOut.push({ prompt: q.prompt.trim(), choices: choices, answer: answer });
      });
      if (!questionsOut.length) return;
      out.push({ id: id, tier: item.tier, title: title, passage: passage, questions: questionsOut });
    });
    return out;
  }

  function loadSave() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!data || typeof data !== "object" || !data.best || typeof data.best !== "object") return { best: {} };
      return { best: data.best };
    } catch (err) {
      return { best: {} };
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (err) { /* private mode */ }
  }

  function readBest(tier) {
    var best = save.best && save.best[String(tier)];
    if (!best) return null;
    if (!Number.isFinite(best.correct) || !Number.isFinite(best.total) || !Number.isFinite(best.ms)) return null;
    if (best.total <= 0 || best.correct < 0 || best.correct > best.total || best.ms < 0) return null;
    return { correct: best.correct, total: best.total, ms: best.ms };
  }

  function isBetter(next, prev) {
    if (!prev) return true;
    var diff = next.correct * prev.total - prev.correct * next.total;
    if (diff !== 0) return diff > 0;
    if (next.total !== prev.total) return next.total > prev.total;
    return next.ms < prev.ms;
  }

  function formatTime(ms) {
    var safe = Math.max(0, Math.round(ms));
    var tenths = Math.floor(safe / 100) % 10;
    var total = Math.floor(safe / 1000);
    var secs = total % 60;
    var mins = Math.floor(total / 60);
    var mm = mins < 100 ? String(mins).padStart(2, "0") : String(mins);
    return mm + ":" + String(secs).padStart(2, "0") + "." + tenths;
  }

  function tierName(tier) {
    for (var i = 0; i < TIERS.length; i += 1) {
      if (TIERS[i].tier === tier) return TIERS[i].name;
    }
    return "메모리 " + tier;
  }

  function levelsFor(tier) {
    return levels.filter(function (item) { return item.tier === tier; });
  }

  function countLabel(pool) {
    if (!pool.length) return "준비 중";
    var min = pool[0].questions.length;
    var max = min;
    pool.forEach(function (item) {
      var n = item.questions.length;
      if (n < min) min = n;
      if (n > max) max = n;
    });
    if (min === max) return "문제 " + min + "개";
    return "문제 " + min + "–" + max + "개";
  }

  function bestLine(tier) {
    var best = readBest(tier);
    if (!best) return "최고 기록 없음";
    return "최고 " + best.correct + "/" + best.total + " · " + formatTime(best.ms);
  }

  function memorizeSeconds(src) {
    var n = src.passage.replace(/\s/g, "").length;
    var raw = Math.round(n / 5);
    var bounds = { 10: [15, 25], 20: [30, 50], 30: [45, 70] };
    var pair = bounds[src.tier] || [20, 50];
    return Math.min(pair[1], Math.max(pair[0], raw));
  }

  function clearClocks() {
    clearInterval(memorizeTimer);
    clearInterval(quizTimer);
    clearTimeout(advanceTimer);
    memorizeTimer = 0;
    quizTimer = 0;
    advanceTimer = 0;
  }

  function currentFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function syncFullscreenButton() {
    if (!fsBtn) return;
    var on = Boolean(currentFullscreen());
    fsBtn.classList.toggle("is-on", on);
    fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    fsBtn.textContent = on ? "전체 화면 종료" : "전체 화면";
  }

  function toggleFullscreen() {
    if (!fsBtn) return;
    if (currentFullscreen()) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (!exit) return;
      var leaving = exit.call(document);
      if (leaving && leaving.catch) leaving.catch(function () {});
      return;
    }
    var el = document.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) {
      fsBtn.textContent = "전체 화면 불가";
      return;
    }
    var done;
    try {
      done = req.call(el, { navigationUI: "hide" });
    } catch (err) {
      try { done = req.call(el); } catch (err2) {
        fsBtn.textContent = "전체 화면 불가";
        return;
      }
    }
    if (done && done.catch) done.catch(function () { fsBtn.textContent = "전체 화면 불가"; });
  }

  function paintChrome() {
    var quiz = phase === "quiz";
    backBtn.hidden = phase === "home";
    progressEl.hidden = !quiz;
    timerEl.hidden = !quiz;
    if (phase === "home") topTitle.textContent = "시작";
    else if (phase === "memorize" && level) topTitle.textContent = tierName(level.tier);
    else if (phase === "quiz" && level) {
      topTitle.textContent = tierName(level.tier);
      progressEl.textContent = (qIndex + 1) + " / " + questions.length;
      timerEl.textContent = formatTime(elapsedMs);
    } else topTitle.textContent = "결과";
    app.dataset.screen = phase;
  }

  function showScreen(name) {
    phase = name;
    ["home", "memorize", "quiz", "result"].forEach(function (id) {
      document.getElementById("screen-" + id).hidden = name !== id;
    });
    paintChrome();
  }

  function renderHome() {
    pickEl.replaceChildren();
    TIERS.forEach(function (spec) {
      var pool = levelsFor(spec.tier);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tier-btn";
      var name = document.createElement("strong");
      name.textContent = spec.name;
      var meta = document.createElement("small");
      meta.textContent = pool.length ? spec.blurb + " · " + countLabel(pool) : "준비 중";
      var best = document.createElement("small");
      best.textContent = bestLine(spec.tier);
      btn.append(name, meta, best);
      if (!pool.length) btn.disabled = true;
      btn.addEventListener("click", function () {
        if (!pool.length) return;
        startLevel(pool[Math.floor(Math.random() * pool.length)]);
      });
      pickEl.append(btn);
    });
  }

  function prepareQuestions(src) {
    return src.questions.map(function (q) {
      var bag = q.choices.map(function (text, i) {
        return { text: text, ok: i === q.answer };
      });
      for (var i = bag.length - 1; i > 0; i -= 1) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = bag[i];
        bag[i] = bag[j];
        bag[j] = swap;
      }
      var answer = 0;
      var choices = [];
      bag.forEach(function (item, index) {
        choices.push(item.text);
        if (item.ok) answer = index;
      });
      return { prompt: q.prompt, choices: choices, answer: answer };
    });
  }

  function startMemorize(seconds) {
    clearInterval(memorizeTimer);
    memorizeTimer = 0;
    var ends = Date.now() + seconds * 1000;
    var paint = function () {
      if (phase !== "memorize") return;
      var left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      memoCount.textContent = String(left);
      countWrap.classList.toggle("is-low", left > 0 && left <= 5);
      if (left <= 0) beginQuiz();
    };
    paint();
    if (phase !== "memorize") return;
    memorizeTimer = setInterval(paint, 200);
  }

  function startLevel(src) {
    var ready = prepareQuestions(src);
    if (!ready.length) return;
    clearClocks();
    level = src;
    questions = ready;
    correct = 0;
    qIndex = 0;
    elapsedMs = 0;
    locked = false;
    memoTitle.textContent = src.title;
    passageEl.textContent = src.passage;
    showScreen("memorize");
    passageEl.scrollTop = 0;
    requestAnimationFrame(syncPassageHint);
    startMemorize(memorizeSeconds(src));
  }

  function syncPassageHint() {
    if (phase !== "memorize") {
      passageMore.hidden = true;
      passageEl.parentElement.classList.remove("has-more");
      return;
    }
    var gap = passageEl.scrollHeight - passageEl.scrollTop - passageEl.clientHeight;
    var more = gap > 12;
    passageMore.hidden = !more;
    passageEl.parentElement.classList.toggle("has-more", more);
  }

  function startTimer() {
    clearInterval(quizTimer);
    quizStartedAt = Date.now();
    elapsedMs = 0;
    timerEl.textContent = formatTime(0);
    quizTimer = setInterval(function () {
      elapsedMs = Date.now() - quizStartedAt;
      timerEl.textContent = formatTime(elapsedMs);
    }, 100);
  }

  function stopTimer() {
    if (quizTimer) {
      elapsedMs = Date.now() - quizStartedAt;
      clearInterval(quizTimer);
      quizTimer = 0;
    }
    timerEl.textContent = formatTime(elapsedMs);
  }

  function beginQuiz() {
    if (phase !== "memorize") return;
    clearClocks();
    qIndex = 0;
    correct = 0;
    locked = false;
    showScreen("quiz");
    renderQuestion();
    startTimer();
  }

  function renderQuestion() {
    var q = questions[qIndex];
    locked = false;
    promptEl.textContent = q.prompt;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    choicesEl.replaceChildren();
    q.choices.forEach(function (text, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      var label = document.createElement("span");
      label.className = "choice-text";
      label.textContent = text;
      var mark = document.createElement("span");
      mark.className = "mark";
      btn.append(label, mark);
      btn.addEventListener("click", function () { choose(i); });
      choicesEl.append(btn);
    });
    paintChrome();
    document.getElementById("screen-quiz").scrollTop = 0;
  }

  function choose(i) {
    if (phase !== "quiz" || locked) return;
    var q = questions[qIndex];
    var buttons = choicesEl.querySelectorAll(".choice");
    if (!q || !buttons[i] || !buttons[q.answer]) return;
    locked = true;
    var rightBtn = buttons[q.answer];
    rightBtn.classList.add("is-right");
    rightBtn.querySelector(".mark").textContent = "정답";
    var ok = i === q.answer;
    if (ok) {
      correct += 1;
      feedbackEl.textContent = "맞았어요";
      feedbackEl.className = "feedback is-right";
    } else {
      buttons[i].classList.add("is-wrong");
      buttons[i].querySelector(".mark").textContent = "오답";
      feedbackEl.textContent = "틀렸어요";
      feedbackEl.className = "feedback is-wrong";
    }
    Array.prototype.forEach.call(buttons, function (btn) { btn.disabled = true; });
    var last = qIndex + 1 >= questions.length;
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(function () {
      advanceTimer = 0;
      if (phase !== "quiz") return;
      if (last) showResult();
      else {
        qIndex += 1;
        renderQuestion();
      }
    }, MARK_MS);
  }

  function showResult() {
    if (phase !== "quiz") return;
    stopTimer();
    var total = questions.length;
    var record = { correct: correct, total: total, ms: Math.round(elapsedMs) };
    var prev = readBest(level.tier);
    var fresh = isBetter(record, prev);
    if (fresh) {
      save.best[String(level.tier)] = record;
      persist();
    }
    var best = readBest(level.tier);
    resultTier.textContent = tierName(level.tier);
    resultTitle.textContent = level.title;
    resultCorrect.textContent = "정답 " + correct + " / " + total;
    resultTime.textContent = formatTime(record.ms);
    resultBest.textContent = best
      ? "최고 기록 " + best.correct + "/" + best.total + " · " + formatTime(best.ms)
      : "최고 기록 없음";
    resultNote.textContent = fresh ? "최고 기록을 새로 썼어요." : "";
    showScreen("result");
  }

  function goHome() {
    clearClocks();
    showScreen("home");
    renderHome();
    document.getElementById("screen-home").scrollTop = 0;
  }

  backBtn.addEventListener("click", goHome);
  document.getElementById("btn-home").addEventListener("click", goHome);
  document.getElementById("btn-again").addEventListener("click", function () {
    if (level) startLevel(level);
  });
  document.getElementById("btn-ready").addEventListener("click", beginQuiz);
  if (fsBtn) {
    fsBtn.addEventListener("pointerup", function (e) {
      if (e.pointerType === "mouse") return;
      fsTouchAt = Date.now();
      toggleFullscreen();
    });
    fsBtn.addEventListener("click", function () {
      if (Date.now() - fsTouchAt < 800) return;
      toggleFullscreen();
    });
  }
  document.addEventListener("fullscreenchange", syncFullscreenButton);
  document.addEventListener("webkitfullscreenchange", syncFullscreenButton);
  passageEl.addEventListener("scroll", syncPassageHint, { passive: true });
  window.addEventListener("resize", syncPassageHint);

  renderHome();
  showScreen("home");
  syncFullscreenButton();
})();
