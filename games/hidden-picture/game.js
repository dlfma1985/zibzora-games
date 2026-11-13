/* 숨은그림찾기. Scene is 1600×900. Hit boxes are fractions in levels.js.
   A point counts when x <= fx <= x+w and y <= fy <= y+h. */
(function () {
  "use strict";

  const LEVELS = window.HIDDEN_PICTURE_LEVELS;
  const KEY = "zibzora.hiddenPicture.v1";
  const SCENE_W = 1600;
  const SCENE_H = 900;
  const FONT = "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'WenQuanYi Micro Hei', sans-serif";
  const MAX_SCALE = 4;

  if (!LEVELS || !LEVELS.length) {
    document.body.textContent = "장면 데이터를 찾지 못했습니다.";
    return;
  }

  const app = document.getElementById("app");
  const stage = document.getElementById("stage");
  const world = document.getElementById("world");
  const canvas = document.getElementById("scene");
  const photo = document.getElementById("photo");
  const marksEl = document.getElementById("marks");
  const fxEl = document.getElementById("fx");
  const listEl = document.getElementById("list");
  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");
  const timerEl = document.getElementById("timer");
  const titleEl = document.getElementById("top-title");
  const backBtn = document.getElementById("btn-back");
  const fsBtn = document.getElementById("btn-fullscreen");
  const listBtn = document.getElementById("btn-list");
  const playBody = document.getElementById("play-body");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomResetBtn = document.getElementById("zoom-reset");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let save = loadSave();
  let screen = "start";
  let level = null;
  let found = [];
  let roundToken = 0;
  let pendingWin = false;
  let winTimer = 0;
  let sceneToken = 0;
  let acc = 0;
  let tick0 = 0;
  let timing = false;
  let timerHandle = 0;
  let view = { s: 1, x: 0, y: 0 };
  const pointers = new Map();
  let pinchBase = null;
  let listOpen = true;
  let fsTouchAt = 0;

  function validItem(item) {
    if (!item || typeof item.name !== "string" || !item.name.trim()) return false;
    const nums = [item.x, item.y, item.w, item.h];
    if (!nums.every(function (n) { return typeof n === "number" && isFinite(n); })) return false;
    if (item.w <= 0 || item.h <= 0) return false;
    if (item.x < 0 || item.y < 0 || item.x > 1 || item.y > 1) return false;
    if (item.x + item.w > 1.001 || item.y + item.h > 1.001) return false;
    return true;
  }

  function readLevel(raw) {
    const items = Array.isArray(raw.items) ? raw.items.filter(validItem) : [];
    return {
      id: raw.id == null ? "" : String(raw.id),
      title: raw.title ? String(raw.title) : (raw.id == null ? "장면" : String(raw.id)),
      image: typeof raw.image === "string" ? raw.image.trim() : "",
      items: items,
    };
  }

  function loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      const best = {};
      if (data && data.best && typeof data.best === "object") {
        Object.keys(data.best).forEach(function (id) {
          const n = data.best[id];
          if (typeof n === "number" && isFinite(n) && n >= 0) best[id] = n;
        });
      }
      return { best: best };
    } catch (err) {
      return { best: {} };
    }
  }

  function writeSave() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (err) { /* private mode */ }
  }

  function fmt(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function elapsed() {
    return acc + (timing ? Date.now() - tick0 : 0);
  }

  function paintTime() {
    if (screen === "start") return;
    timerEl.textContent = fmt(screen === "play" && !pendingWin ? elapsed() : acc);
  }

  function startClock() {
    if (timing || screen !== "play" || pendingWin || document.hidden) return;
    tick0 = Date.now();
    timing = true;
    timerHandle = window.setInterval(paintTime, 200);
    paintTime();
  }

  function stopClock() {
    if (timing) acc += Date.now() - tick0;
    timing = false;
    window.clearInterval(timerHandle);
    paintTime();
  }

  function resetClock() {
    acc = 0;
    timing = false;
    window.clearInterval(timerHandle);
  }

  function clampScale(s) {
    return Math.min(MAX_SCALE, Math.max(1, s));
  }

  function clampView() {
    const r = stage.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (view.s <= 1.001) {
      view.s = 1;
      view.x = 0;
      view.y = 0;
      return;
    }
    const minX = r.width - r.width * view.s;
    const minY = r.height - r.height * view.s;
    view.x = Math.min(0, Math.max(minX, view.x));
    view.y = Math.min(0, Math.max(minY, view.y));
  }

  function applyView() {
    world.style.transform = "translate(" + view.x.toFixed(2) + "px, " + view.y.toFixed(2) + "px) scale(" + view.s.toFixed(4) + ")";
    stage.classList.toggle("is-zoomed", view.s > 1.01);
    zoomOutBtn.disabled = view.s <= 1.001;
    zoomInBtn.disabled = view.s >= MAX_SCALE - 0.001;
  }

  function resetZoom() {
    view = { s: 1, x: 0, y: 0 };
    applyView();
  }

  function zoomAt(lx, ly, next) {
    const s = clampScale(next);
    const k = s / view.s;
    view.x = lx - (lx - view.x) * k;
    view.y = ly - (ly - view.y) * k;
    view.s = s;
    clampView();
    applyView();
  }

  function zoomCenter(next) {
    const r = stage.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, next);
  }

  function say(text) {
    statusEl.textContent = text;
  }

  function currentFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function syncFullscreenButton() {
    if (!fsBtn) return;
    const on = Boolean(currentFullscreen());
    fsBtn.classList.toggle("is-on", on);
    fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    fsBtn.textContent = on ? "전체 화면 종료" : "전체 화면";
  }

  function toggleFullscreen() {
    if (!fsBtn) return;
    if (currentFullscreen()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (!exit) return;
      const done = exit.call(document);
      if (done && done.catch) done.catch(function () {});
      return;
    }
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) {
      fsBtn.textContent = "전체 화면 불가";
      return;
    }
    let done;
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

  function syncListButton() {
    if (!listBtn || !playBody) return;
    const playing = screen === "play";
    listBtn.hidden = !playing;
    listBtn.setAttribute("aria-expanded", listOpen ? "true" : "false");
    listBtn.textContent = listOpen ? "목록 접기" : "목록 열기";
    playBody.classList.toggle("is-list-collapsed", !listOpen);
  }

  function showScreen(name) {
    screen = name;
    app.dataset.screen = name;
    document.getElementById("screen-start").hidden = name !== "start";
    document.getElementById("screen-play").hidden = name !== "play";
    document.getElementById("screen-result").hidden = name !== "result";
    syncListButton();
    paintChrome();
  }

  function paintChrome() {
    const playing = screen === "play";
    backBtn.hidden = screen === "start";
    progressEl.hidden = !playing;
    timerEl.hidden = screen === "start";
    if (screen === "start") titleEl.textContent = "시작";
    else if (level) titleEl.textContent = level.title;
    else titleEl.textContent = "결과";
    if (playing && level) {
      const n = found.filter(Boolean).length;
      progressEl.textContent = n + "/" + level.items.length;
    }
    paintTime();
  }

  function paintLevels() {
    const pick = document.getElementById("level-pick");
    pick.replaceChildren();
    LEVELS.forEach(function (raw) {
      const lv = readLevel(raw);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-btn";
      btn.dataset.level = lv.id;
      const name = document.createElement("span");
      name.textContent = lv.title;
      const small = document.createElement("small");
      const best = save.best[lv.id];
      const bestText = typeof best === "number" ? "최고 " + fmt(best) : "기록 없음";
      small.textContent = "물건 " + lv.items.length + " · " + bestText;
      btn.append(name, small);
      btn.addEventListener("click", function () { startId(lv.id); });
      pick.appendChild(btn);
    });
  }

  function paintList() {
    listEl.replaceChildren();
    level.items.forEach(function (item, i) {
      const li = document.createElement("li");
      if (found[i]) li.className = "is-found";
      const name = document.createElement("span");
      name.className = "obj-name";
      name.textContent = item.name;
      const em = document.createElement("em");
      em.textContent = found[i] ? "찾음" : "";
      li.append(name, em);
      listEl.appendChild(li);
    });
  }

  function paintMarks() {
    marksEl.replaceChildren();
    level.items.forEach(function (item, i) {
      if (!found[i]) return;
      const el = document.createElement("span");
      el.className = "found-box";
      el.style.left = (item.x * 100) + "%";
      el.style.top = (item.y * 100) + "%";
      el.style.width = (item.w * 100) + "%";
      el.style.height = (item.h * 100) + "%";
      marksEl.appendChild(el);
    });
  }

  function ripple(fx, fy) {
    const dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.left = (fx * 100) + "%";
    dot.style.top = (fy * 100) + "%";
    fxEl.appendChild(dot);
    while (fxEl.children.length > 5) fxEl.removeChild(fxEl.firstChild);
    window.setTimeout(function () { dot.remove(); }, reduceMotion ? 250 : 480);
  }

  function contains(item, fx, fy) {
    return fx >= item.x && fx <= item.x + item.w && fy >= item.y && fy <= item.y + item.h;
  }

  function hitIndex(fx, fy, wantFound) {
    let best = -1;
    let bestArea = Infinity;
    level.items.forEach(function (item, i) {
      if (Boolean(found[i]) !== wantFound) return;
      if (!contains(item, fx, fy)) return;
      const area = item.w * item.h;
      if (area < bestArea) {
        best = i;
        bestArea = area;
      }
    });
    return best;
  }

  function toFraction(clientX, clientY) {
    const rect = world.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    return {
      fx: (clientX - rect.left) / rect.width,
      fy: (clientY - rect.top) / rect.height,
    };
  }

  function pick(clientX, clientY) {
    if (screen !== "play" || pendingWin || !level) return;
    const point = toFraction(clientX, clientY);
    if (!point) return;
    if (point.fx < 0 || point.fy < 0 || point.fx > 1 || point.fy > 1) return;
    const foundHit = hitIndex(point.fx, point.fy, false);
    if (foundHit >= 0) {
      onFound(foundHit);
      return;
    }
    if (hitIndex(point.fx, point.fy, true) >= 0) {
      say("이미 찾은 자리예요.");
      return;
    }
    say("여기에는 없어요.");
    ripple(point.fx, point.fy);
  }

  function onFound(index) {
    if (found[index]) return;
    found[index] = true;
    paintMarks();
    paintList();
    paintChrome();
    const item = level.items[index];
    say(item.name + " 찾았어요.");
    if (!found.every(Boolean)) return;
    stopClock();
    pendingWin = true;
    const token = roundToken;
    const ms = acc;
    window.clearTimeout(winTimer);
    winTimer = window.setTimeout(function () {
      if (token !== roundToken) return;
      showWin(ms);
    }, reduceMotion ? 0 : 420);
  }

  function recordBest(id, ms) {
    const prev = save.best[id];
    const better = typeof prev !== "number" || ms < prev;
    if (better) {
      save.best[id] = ms;
      writeSave();
    }
    return better;
  }

  function showWin(ms) {
    if (screen === "result") return;
    pendingWin = false;
    const prev = save.best[level.id];
    const hadPrev = typeof prev === "number";
    const isBest = recordBest(level.id, ms);
    const count = found.filter(Boolean).length;
    document.getElementById("result-title").textContent = level.title;
    document.getElementById("result-count").textContent = count + "개 찾음";
    document.getElementById("result-time").textContent = fmt(ms);
    const bestEl = document.getElementById("result-best");
    if (!hadPrev) {
      bestEl.textContent = "이 기기 최고 기록이에요.";
    } else if (isBest) {
      bestEl.textContent = "이전 최고 " + fmt(prev) + " · 기록을 바꿨어요.";
    } else {
      bestEl.textContent = "최고 기록 " + fmt(prev);
    }
    showScreen("result");
    const home = document.getElementById("btn-home");
    if (home) home.focus();
  }

  function showScene(lv, ready) {
    const token = ++sceneToken;
    photo.onload = null;
    photo.onerror = null;
    if (!lv.image) {
      photo.hidden = true;
      photo.removeAttribute("src");
      canvas.hidden = false;
      drawPlaceholder(canvas, lv.items);
      ready();
      return;
    }
    const img = new Image();
    img.onload = function () {
      if (token !== sceneToken) return;
      photo.src = lv.image;
      photo.alt = lv.title;
      photo.hidden = false;
      canvas.hidden = true;
      ready();
    };
    img.onerror = function () {
      if (token !== sceneToken) return;
      photo.hidden = true;
      canvas.hidden = false;
      drawPlaceholder(canvas, lv.items);
      say("그림을 불러오지 못해 연습 장면을 보여 드려요.");
      ready();
    };
    img.src = lv.image;
  }

  function begin(raw) {
    level = readLevel(raw);
    roundToken += 1;
    window.clearTimeout(winTimer);
    pendingWin = false;
    if (!level.items.length) {
      showScreen("start");
      const note = document.querySelector("#screen-start .note");
      if (note) note.textContent = "이 장면에는 찾을 물건이 없어요.";
      return;
    }
    found = level.items.map(function () { return false; });
    resetClock();
    resetZoom();
    fxEl.replaceChildren();
    paintList();
    paintMarks();
    say("그림에서 물건을 누르세요.");
    showScreen("play");
    startClock();
    showScene(level, function () {
      if (screen === "play" && !pendingWin) startClock();
    });
  }

  function startId(id) {
    const raw = LEVELS.find(function (lv) { return String(lv.id) === String(id); });
    if (!raw) return;
    begin(raw);
  }

  function showStart() {
    roundToken += 1;
    window.clearTimeout(winTimer);
    pendingWin = false;
    stopClock();
    const note = document.querySelector("#screen-start .note");
    if (note) note.textContent = "최고 기록은 이 기기에 남습니다.";
    paintLevels();
    showScreen("start");
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function boxOf(item) {
    return {
      x: item.x * SCENE_W,
      y: item.y * SCENE_H,
      w: item.w * SCENE_W,
      h: item.h * SCENE_H,
    };
  }

  function drawPlaceholder(target, items) {
    target.width = SCENE_W;
    target.height = SCENE_H;
    const ctx = target.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    drawRoom(ctx);
    items.forEach(function (item) {
      ctx.save();
      ctx.shadowColor = "rgba(42, 33, 24, 0.2)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      const draw = DRAW[item.name] || drawTag;
      draw(ctx, boxOf(item), item.name);
      ctx.restore();
    });
  }

  function drawRoom(ctx) {
    const wall = ctx.createLinearGradient(0, 0, 0, 640);
    wall.addColorStop(0, "#f7f1e6");
    wall.addColorStop(1, "#eadcc8");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    ctx.fillStyle = "rgba(150, 104, 62, 0.09)";
    for (let y = 28; y < 600; y += 34) {
      for (let x = 16; x < SCENE_W; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    roundRect(ctx, 150, 48, 340, 210, 10);
    ctx.fillStyle = "#d9ecf8";
    ctx.fill();
    ctx.fillStyle = "#b7d4ea";
    ctx.beginPath();
    ctx.moveTo(168, 240);
    ctx.lineTo(250, 150);
    ctx.lineTo(330, 210);
    ctx.lineTo(410, 120);
    ctx.lineTo(472, 240);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#8d6744";
    ctx.lineWidth = 12;
    roundRect(ctx, 150, 48, 340, 210, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(320, 54);
    ctx.lineTo(320, 252);
    ctx.moveTo(156, 152);
    ctx.lineTo(484, 152);
    ctx.stroke();
    ctx.fillStyle = "#f3e7d6";
    ctx.fillRect(132, 248, 376, 22);

    roundRect(ctx, 520, 64, 250, 150, 8);
    ctx.fillStyle = "#f7fbff";
    ctx.fill();
    ctx.strokeStyle = "#8d6744";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = "#9ec3a0";
    ctx.beginPath();
    ctx.moveTo(540, 190);
    ctx.lineTo(620, 110);
    ctx.lineTo(700, 176);
    ctx.lineTo(748, 96);
    ctx.lineTo(748, 190);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#8d6744";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(90, 58);
    ctx.lineTo(340, 58);
    ctx.stroke();
    ctx.fillStyle = "#8d6744";
    ctx.fillRect(150, 50, 8, 22);
    ctx.fillRect(250, 50, 8, 22);

    ctx.fillStyle = "#c9844a";
    ctx.fillRect(760, 368, 340, 16);
    ctx.fillStyle = "#a86b38";
    ctx.fillRect(790, 384, 14, 40);
    ctx.fillRect(1056, 384, 14, 40);

    ctx.fillStyle = "#e7d3b0";
    roundRect(ctx, 1490, 150, 90, 480, 6);
    ctx.fill();
    ctx.strokeStyle = "#8d6744";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = "#e2b657";
    ctx.beginPath();
    ctx.arc(1516, 400, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8c49a";
    ctx.fillRect(1220, 498, 250, 18);
    ctx.fillStyle = "#a86b38";
    ctx.fillRect(1236, 516, 12, 36);
    ctx.fillRect(1442, 516, 12, 36);

    const floor = ctx.createLinearGradient(0, 630, 0, SCENE_H);
    floor.addColorStop(0, "#e0c096");
    floor.addColorStop(1, "#c89a62");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 630, SCENE_W, 270);
    ctx.strokeStyle = "rgba(120, 74, 36, 0.28)";
    ctx.lineWidth = 2;
    for (let x = 0; x < SCENE_W; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, 630);
      ctx.lineTo(x, SCENE_H);
      ctx.stroke();
    }
    ctx.fillStyle = "#8d5e38";
    ctx.fillRect(0, 612, SCENE_W, 20);

    ctx.fillStyle = "#efd0b4";
    ctx.beginPath();
    ctx.ellipse(1080, 760, 210, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c46a2f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(1080, 760, 170, 52, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#d39a58";
    roundRect(ctx, 480, 544, 500, 40, 6);
    ctx.fill();
    ctx.fillStyle = "#b57b40";
    ctx.fillRect(520, 584, 16, 70);
    ctx.fillRect(930, 584, 16, 70);

    ctx.fillStyle = "#6f8f62";
    ctx.beginPath();
    ctx.ellipse(410, 500, 52, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5f7d54";
    ctx.beginPath();
    ctx.ellipse(372, 528, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9844a";
    roundRect(ctx, 368, 548, 58, 40, 6);
    ctx.fill();
  }

  function drawHat(ctx, r) {
    ctx.fillStyle = "#2f6b4f";
    ctx.strokeStyle = "#1e4634";
    ctx.lineWidth = Math.max(2, r.h * 0.06);
    roundRect(ctx, r.x + r.w * 0.28, r.y + r.h * 0.08, r.w * 0.44, r.h * 0.5, r.h * 0.16);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r.x + r.w * 0.5, r.y + r.h * 0.62, r.w * 0.46, r.h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawClock(ctx, r) {
    const cx = r.x + r.w * 0.5;
    const cy = r.y + r.h * 0.52;
    const rad = Math.min(r.w, r.h) * 0.42;
    ctx.fillStyle = "#fffaf3";
    ctx.strokeStyle = "#2a2118";
    ctx.lineWidth = Math.max(3, rad * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c46a2f";
    ctx.lineWidth = Math.max(2, rad * 0.07);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - rad * 0.55);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + rad * 0.4, cy);
    ctx.stroke();
  }

  function drawCup(ctx, r) {
    ctx.fillStyle = "#f7f4ef";
    ctx.strokeStyle = "#355f86";
    ctx.lineWidth = Math.max(2, r.w * 0.05);
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.2, r.y + r.h * 0.2);
    ctx.lineTo(r.x + r.w * 0.28, r.y + r.h * 0.86);
    ctx.quadraticCurveTo(r.x + r.w * 0.5, r.y + r.h * 0.96, r.x + r.w * 0.72, r.y + r.h * 0.86);
    ctx.lineTo(r.x + r.w * 0.8, r.y + r.h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6ea0c8";
    ctx.fillRect(r.x + r.w * 0.24, r.y + r.h * 0.48, r.w * 0.52, r.h * 0.12);
    ctx.beginPath();
    ctx.ellipse(r.x + r.w * 0.5, r.y + r.h * 0.2, r.w * 0.32, r.h * 0.09, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fffaf3";
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.8, r.y + r.h * 0.48, r.h * 0.14, -1.2, 1.2);
    ctx.stroke();
  }

  function drawBook(ctx, r) {
    ctx.fillStyle = "#3d6a9a";
    ctx.strokeStyle = "#243e5c";
    ctx.lineWidth = Math.max(2, r.h * 0.06);
    roundRect(ctx, r.x + r.w * 0.06, r.y + r.h * 0.12, r.w * 0.88, r.h * 0.74, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f4efe4";
    ctx.fillRect(r.x + r.w * 0.16, r.y + r.h * 0.12, r.w * 0.06, r.h * 0.74);
    ctx.fillStyle = "#e2b657";
    ctx.fillRect(r.x + r.w * 0.62, r.y + r.h * 0.12, r.w * 0.05, r.h * 0.4);
  }

  function drawKey(ctx, r) {
    const cy = r.y + r.h * 0.58;
    ctx.fillStyle = "#e2b657";
    ctx.strokeStyle = "#8a6a22";
    ctx.lineWidth = Math.max(2, r.h * 0.1);
    ctx.beginPath();
    ctx.arc(r.x + r.h * 0.42, cy, r.h * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6efe4";
    ctx.beginPath();
    ctx.arc(r.x + r.h * 0.42, cy, r.h * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8a6a22";
    ctx.beginPath();
    ctx.moveTo(r.x + r.h * 0.72, cy);
    ctx.lineTo(r.x + r.w * 0.92, cy);
    ctx.moveTo(r.x + r.w * 0.62, cy);
    ctx.lineTo(r.x + r.w * 0.62, cy + r.h * 0.32);
    ctx.moveTo(r.x + r.w * 0.78, cy);
    ctx.lineTo(r.x + r.w * 0.78, cy + r.h * 0.24);
    ctx.stroke();
  }

  function drawUmbrella(ctx, r) {
    const cx = r.x + r.w * 0.5;
    const canopy = r.y + r.h * 0.4;
    ctx.fillStyle = "#3d6a9a";
    ctx.strokeStyle = "#1d3550";
    ctx.lineWidth = Math.max(2, r.w * 0.03);
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.06, canopy);
    ctx.quadraticCurveTo(cx, r.y + r.h * 0.02, r.x + r.w * 0.94, canopy);
    ctx.quadraticCurveTo(cx, canopy + r.h * 0.1, r.x + r.w * 0.06, canopy);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 1; i <= 5; i++) {
      const x = r.x + r.w * (0.06 + 0.88 * (i / 6));
      ctx.moveTo(cx, r.y + r.h * 0.16);
      ctx.lineTo(x, canopy);
    }
    ctx.stroke();
    ctx.lineWidth = Math.max(3, r.w * 0.035);
    ctx.beginPath();
    ctx.moveTo(cx, canopy);
    ctx.lineTo(cx, r.y + r.h * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - r.w * 0.08, r.y + r.h * 0.8, r.w * 0.1, 0, Math.PI);
    ctx.stroke();
  }

  function drawSpoon(ctx, r) {
    ctx.shadowBlur = 0;
    const y = r.y + r.h * 0.52;
    ctx.strokeStyle = "#4d5662";
    ctx.fillStyle = "#f7f9fc";
    ctx.lineWidth = Math.max(3, r.h * 0.2);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.06, y);
    ctx.lineTo(r.x + r.w * 0.58, y);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, r.h * 0.1);
    ctx.beginPath();
    ctx.ellipse(r.x + r.w * 0.74, y, r.w * 0.18, r.h * 0.34, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawBall(ctx, r) {
    const cx = r.x + r.w * 0.5;
    const cy = r.y + r.h * 0.48;
    const rad = Math.min(r.w, r.h) * 0.42;
    ctx.fillStyle = "#d4534a";
    ctx.strokeStyle = "#8d2e28";
    ctx.lineWidth = Math.max(2, rad * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fffaf3";
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.72, 0.4, 2.2);
    ctx.stroke();
  }

  function drawTag(ctx, r, name) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 250, 243, 0.94)";
    ctx.strokeStyle = "#c46a2f";
    ctx.lineWidth = 3;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2a2118";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = Math.max(12, Math.min(r.h * 0.42, 36));
    ctx.font = "700 " + size + "px " + FONT;
    const label = name || "";
    while (size > 11 && ctx.measureText(label).width > r.w * 0.84) {
      size -= 1;
      ctx.font = "700 " + size + "px " + FONT;
    }
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  }

  const DRAW = {
    "모자": drawHat,
    "시계": drawClock,
    "컵": drawCup,
    "책": drawBook,
    "열쇠": drawKey,
    "우산": drawUmbrella,
    "숟가락": drawSpoon,
    "공": drawBall,
  };

  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY, moved: false });
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      pinchBase = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
        s: view.s,
      };
      pts.forEach(function (p) { p.moved = true; });
    }
  }

  function onMove(e) {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(e.clientX - p.ox, e.clientY - p.oy) > 10) p.moved = true;
    if (pointers.size >= 2 && pinchBase) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = stage.getBoundingClientRect();
      zoomAt((pts[0].x + pts[1].x) / 2 - rect.left, (pts[0].y + pts[1].y) / 2 - rect.top, pinchBase.s * (dist / pinchBase.dist));
      stage.classList.add("is-panning");
      return;
    }
    if (view.s > 1.01 && p.moved) {
      view.x += dx;
      view.y += dy;
      clampView();
      applyView();
      stage.classList.add("is-panning");
    }
  }

  function onUp(e) {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchBase = null;
    if (pointers.size === 0) stage.classList.remove("is-panning");
    if (!p || p.moved || pointers.size > 0) return;
    pick(e.clientX, e.clientY);
  }

  backBtn.addEventListener("click", showStart);
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
  if (listBtn) {
    listBtn.addEventListener("click", function () {
      listOpen = !listOpen;
      syncListButton();
    });
  }
  document.addEventListener("fullscreenchange", syncFullscreenButton);
  document.addEventListener("webkitfullscreenchange", syncFullscreenButton);
  document.getElementById("btn-home").addEventListener("click", showStart);
  document.getElementById("btn-retry").addEventListener("click", function () {
    if (level) startId(level.id);
  });
  document.getElementById("btn-again").addEventListener("click", function () {
    if (level) startId(level.id);
  });
  zoomInBtn.addEventListener("click", function () { zoomCenter(view.s * 1.5); });
  zoomOutBtn.addEventListener("click", function () { zoomCenter(view.s / 1.5); });
  zoomResetBtn.addEventListener("click", resetZoom);

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  stage.addEventListener("wheel", function (e) {
    if (screen !== "play") return;
    const zoomingIn = e.deltaY < 0;
    if (!zoomingIn && view.s <= 1.001) return;
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    const factor = Math.exp(-e.deltaY * 0.0012);
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, view.s * factor);
  }, { passive: false });

  window.addEventListener("keydown", function (e) {
    if (screen !== "play" || pendingWin) return;
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomCenter(view.s * 1.25);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomCenter(view.s / 1.25);
    } else if (e.key === "0") {
      e.preventDefault();
      resetZoom();
    } else if (view.s > 1.01 && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const step = 48;
      if (e.key === "ArrowLeft") view.x += step;
      if (e.key === "ArrowRight") view.x -= step;
      if (e.key === "ArrowUp") view.y += step;
      if (e.key === "ArrowDown") view.y -= step;
      clampView();
      applyView();
    }
  });

  function refitView() {
    if (screen !== "play") return;
    clampView();
    applyView();
  }

  window.addEventListener("resize", refitView);
  if (typeof ResizeObserver === "function") {
    const stageObserver = new ResizeObserver(refitView);
    stageObserver.observe(stage);
  }

  document.addEventListener("visibilitychange", function () {
    if (screen !== "play" || pendingWin) return;
    if (document.hidden) stopClock();
    else startClock();
  });

  resetZoom();
  paintLevels();
  syncFullscreenButton();
  showScreen("start");
})();
