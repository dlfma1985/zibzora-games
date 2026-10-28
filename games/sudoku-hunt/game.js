/* 한집한냥. Rules follow docs/sudoku-hunt-design.md. No external assets. */
(function () {
  "use strict";

  const LEVELS = window.SUDOKU_HUNT_LEVELS;
  const KEY = "zibzora.sudokuHunt.v1";
  const COLOR = { A: "주황", B: "하늘", C: "초록", D: "노랑", E: "파랑", F: "다홍", G: "보라", H: "분홍", I: "회청" };
  const HALF = { N: "위", S: "아래", W: "왼", E: "오른" };
  const PAR = { 4: 60, 5: 90, 6: 150, 7: 210, 8: 270, 9: 360 };
  const LIMIT = { 4: 120, 5: 180, 6: 240, 7: 300, 8: 360, 9: 480 };
  const REASON = {
    locked: "잠긴 칸이에요",
    row: "이 줄에는 이미 있어요",
    col: "이 열에는 이미 있어요",
    region: "이 구역에는 이미 있어요",
    adjacent: "바로 옆에는 둘 수 없어요",
    half: "절반 단서 밖이에요",
  };

  if (!LEVELS || LEVELS.length !== 24) {
    document.body.textContent = "레벨 데이터를 찾지 못했습니다.";
    return;
  }

  const app = document.getElementById("app");
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const stuckEl = document.getElementById("stuck");
  const undoBtn = document.getElementById("btn-undo");
  const overlay = document.getElementById("overlay");
  const dialog = document.getElementById("dialog");
  const toolsEl = document.getElementById("tools");
  const hintBtn = document.getElementById("btn-hint");
  const hintLabel = document.getElementById("hint-label");
  const backBtn = document.getElementById("btn-back");
  const pauseBtn = document.getElementById("btn-pause");
  const timerBtn = document.getElementById("btn-timer");
  const heartsEl = document.getElementById("hearts");
  const goldEl = document.getElementById("gold-pill");
  const kickerEl = document.getElementById("top-kicker");
  const titleEl = document.getElementById("top-title");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let save = loadSave();
  let mode = "cat";
  let screen = "start";
  let level = null;
  let cells = [];
  let tool = "mark";
  let cursor = [0, 0];
  let hot = null;
  let markOrder = [];
  let hearts = 3;
  let mistakes = 0;
  let hintsUsed = 0;
  let touched = false;
  let timerOn = false;
  let accum = 0;
  let tickStart = 0;
  let running = false;
  let timerHandle = 0;
  let bonus = 0;
  let extended = false;
  let timeUp = false;
  let finished = false;
  let showOpen = false;
  let lastElapsed = 0;
  let transient = "";
  let fadeTimer = 0;
  let conflictTimer = 0;
  let audioCtx = null;
  let audioOn = false;
  let dialogKind = "";
  let introStep = 0;
  let inputLock = false;

  function pad(n) { return String(n).padStart(2, "0"); }
  function keyOf(r, c) { return r + "," + c; }
  function modeName() { return mode === "cat" ? "고양이 찾기" : "보물 찾기"; }
  function tutorial() { return level && Number(level.id) <= 2; }

  function inHalf(n, r, c, side) {
    const northEnd = Math.floor(n / 2) - 1;
    const southStart = Math.ceil(n / 2);
    if (side === "N") return r <= northEnd;
    if (side === "S") return r >= southStart;
    if (side === "W") return c <= northEnd;
    if (side === "E") return c >= southStart;
    return false;
  }

  function parseLevel(raw) {
    const n = raw.size;
    const grid = raw.regions.map((row) => row.split(""));
    const solution = Array(n).fill(-1);
    raw.solution.forEach(([r, c]) => { solution[r - 1] = c - 1; });
    return {
      id: raw.id,
      size: n,
      adjacent: raw.adjacent,
      regions: raw.regions,
      grid,
      solution,
      givens: raw.givens.map(([r, c]) => [r - 1, c - 1]),
      excludes: raw.excludes.map(([r, c]) => [r - 1, c - 1]),
      halves: raw.halves.map((h) => ({ region: h.region, side: h.side })),
      decoys: raw.decoys.map(([r, c]) => [r - 1, c - 1]),
      difficulty: raw.difficulty,
      source: raw.source,
    };
  }

  function halfSide(lv, letter) {
    const hit = lv.halves.find((h) => h.region === letter);
    return hit ? hit.side : null;
  }

  function marksFromCols(cols) {
    const list = [];
    cols.forEach((c, r) => { if (c >= 0) list.push([r, c]); });
    return list;
  }

  function reasonFor(lv, marks, r, c) {
    const letter = lv.grid[r][c];
    for (const [mr, mc] of marks) if (mr === r) return { code: "row", at: [mr, mc] };
    for (const [mr, mc] of marks) if (mc === c) return { code: "col", at: [mr, mc] };
    for (const [mr, mc] of marks) if (lv.grid[mr][mc] === letter) return { code: "region", at: [mr, mc] };
    if (lv.adjacent) {
      for (const [mr, mc] of marks) {
        if (Math.max(Math.abs(mr - r), Math.abs(mc - c)) <= 1) return { code: "adjacent", at: [mr, mc] };
      }
    }
    const side = halfSide(lv, letter);
    if (side && !inHalf(lv.size, r, c, side)) return { code: "half", at: null };
    return null;
  }

  function isCandidate(lv, cols, blocked, r, c) {
    if (blocked.has(keyOf(r, c))) return false;
    if (cols[r] >= 0) return false;
    return !reasonFor(lv, marksFromCols(cols), r, c);
  }

  function listCandidates(lv, cols, blocked) {
    const out = [];
    for (let r = 0; r < lv.size; r++) {
      for (let c = 0; c < lv.size; c++) {
        if (isCandidate(lv, cols, blocked, r, c)) out.push([r, c]);
      }
    }
    return out;
  }

  function marksLegal(lv, cols) {
    const marks = marksFromCols(cols);
    const colsUsed = new Set();
    const regs = new Set();
    for (const [r, c] of marks) {
      if (colsUsed.has(c) || regs.has(lv.grid[r][c])) return false;
      colsUsed.add(c);
      regs.add(lv.grid[r][c]);
      const side = halfSide(lv, lv.grid[r][c]);
      if (side && !inHalf(lv.size, r, c, side)) return false;
    }
    if (lv.adjacent) {
      for (let i = 0; i < marks.length; i++) {
        for (let j = i + 1; j < marks.length; j++) {
          const [r, c] = marks[i];
          const [rr, cc] = marks[j];
          if (Math.max(Math.abs(r - rr), Math.abs(c - cc)) <= 1) return false;
        }
      }
    }
    return true;
  }

  function eliminate(lv, seed, blocked) {
    const cols = Array(lv.size).fill(-1);
    for (const [r, c] of seed) {
      if (cols[r] >= 0 && cols[r] !== c) return { cols, solved: false, contradiction: true };
      cols[r] = c;
    }
    if (!marksLegal(lv, cols)) return { cols, solved: false, contradiction: true };
    while (true) {
      const cands = listCandidates(lv, cols, blocked);
      const force = new Map();
      const note = (group) => {
        if (group.length === 1) force.set(keyOf(group[0][0], group[0][1]), group[0]);
        return group.length === 0;
      };
      for (let r = 0; r < lv.size; r++) {
        if (cols[r] >= 0) continue;
        if (note(cands.filter(([rr]) => rr === r))) return { cols, solved: false, contradiction: true };
      }
      for (let c = 0; c < lv.size; c++) {
        if (cols.some((mc) => mc === c)) continue;
        if (note(cands.filter(([, cc]) => cc === c))) return { cols, solved: false, contradiction: true };
      }
      const letters = new Set(lv.regions.join(""));
      for (const reg of letters) {
        if (!reg) continue;
        let taken = false;
        for (let r = 0; r < lv.size; r++) if (cols[r] >= 0 && lv.grid[r][cols[r]] === reg) taken = true;
        if (taken) continue;
        if (note(cands.filter(([r, c]) => lv.grid[r][c] === reg))) return { cols, solved: false, contradiction: true };
      }
      const byRow = new Map();
      for (const [r, c] of force.values()) {
        if (byRow.has(r) && byRow.get(r) !== c) return { cols, solved: false, contradiction: true };
        byRow.set(r, c);
      }
      let progress = false;
      for (const [r, c] of byRow) {
        if (cols[r] >= 0 && cols[r] !== c) return { cols, solved: false, contradiction: true };
        if (cols[r] === c) continue;
        cols[r] = c;
        progress = true;
      }
      if (!progress) break;
      if (!marksLegal(lv, cols)) return { cols, solved: false, contradiction: true };
    }
    return { cols, solved: cols.every((c) => c >= 0), contradiction: false };
  }

  function openRegions(lv, cols, blocked) {
    const cands = listCandidates(lv, cols, blocked);
    const letters = [...new Set(lv.regions.join(""))].filter(Boolean);
    let best = null;
    for (const reg of letters) {
      let taken = false;
      for (let r = 0; r < lv.size; r++) if (cols[r] >= 0 && lv.grid[r][cols[r]] === reg) taken = true;
      if (taken) continue;
      const group = cands.filter(([r, c]) => lv.grid[r][c] === reg);
      if (group.length >= 2 && group.length <= 3 && (!best || group.length < best.cells.length)) {
        best = { reg, cells: group };
      }
    }
    return best;
  }

  function analyze(lv) {
    const blocked = new Set(lv.excludes.map(([r, c]) => keyOf(r, c)));
    const elim = eliminate(lv, lv.givens, blocked);
    if (elim.contradiction) return "bad";
    if (elim.solved) return elim.cols.every((c, r) => c === lv.solution[r]) ? "elim" : "bad";
    const br = openRegions(lv, elim.cols, blocked);
    if (!br) return "hard";
    let wins = 0;
    let dirty = false;
    for (const [r, c] of br.cells) {
      const next = eliminate(lv, lv.givens.concat([[r, c]]), blocked);
      if (next.contradiction) continue;
      if (!next.solved) dirty = true;
      else if (next.cols.every((col, rr) => col === lv.solution[rr])) wins += 1;
      else return "bad";
    }
    if (wins === 1 && !dirty) return "branch";
    return "mixed";
  }

  function freshSave() {
    return {
      gold: 40,
      sound: true,
      cat: { cleared: {} },
      treasure: { cleared: {} },
      seenIntro: { cat: false, treasure: false },
      seenAdjacent: { cat: false, treasure: false },
      seenDecoyTip: false,
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshSave();
      const data = JSON.parse(raw);
      if (!data || typeof data.gold !== "number" || !data.cat || !data.cat.cleared || !data.treasure || !data.treasure.cleared) {
        throw new Error("bad");
      }
      data.sound = data.sound !== false;
      data.seenIntro = data.seenIntro || { cat: false, treasure: false };
      data.seenAdjacent = data.seenAdjacent || { cat: false, treasure: false };
      data.seenDecoyTip = !!data.seenDecoyTip;
      return data;
    } catch (err) {
      const raw = localStorage.getItem(KEY);
      if (raw) localStorage.setItem(KEY + ".bak", raw);
      localStorage.removeItem(KEY);
      return freshSave();
    }
  }

  function writeSave() {
    localStorage.setItem(KEY, JSON.stringify(save));
  }

  function cleared(id) {
    return save[mode].cleared[id] || null;
  }

  function unlocked(id) {
    if (id === "01") return true;
    const prev = cleared(pad(Number(id) - 1));
    return !!(prev && prev.stars >= 1);
  }

  function nextOpenId() {
    for (let i = 1; i <= 24; i++) {
      const id = pad(i);
      if (unlocked(id) && !(cleared(id) && cleared(id).stars >= 1)) return id;
    }
    return "";
  }

  function starText(n) {
    return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n);
  }

  function glyph(id, cls) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "glyph" + (cls ? " " + cls : ""));
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }

  function setUse(selector, id) {
    const node = document.querySelector(selector);
    if (node) node.setAttribute("href", "#" + id);
  }

  function markGlyph() {
    if (mode === "treasure") return showOpen ? "ico-box-open" : "ico-box";
    return "ico-cat";
  }
  function crossGlyph() { return mode === "cat" ? "ico-paw" : "ico-dust"; }

  function currentCols() {
    const cols = Array(level.size).fill(-1);
    const blocked = new Set();
    const crosses = [];
    for (let r = 0; r < level.size; r++) {
      for (let c = 0; c < level.size; c++) {
        const cell = cells[r][c];
        if (cell.player === "mark") cols[r] = c;
        if (cell.player === "cross") {
          blocked.add(keyOf(r, c));
          if (!cell.lock) crosses.push([r, c]);
        }
      }
    }
    return { cols, blocked, crosses };
  }

  function liveMarks() {
    const marks = [];
    for (let r = 0; r < level.size; r++) {
      for (let c = 0; c < level.size; c++) if (cells[r][c].player === "mark") marks.push([r, c]);
    }
    return marks;
  }

  function singlesNow() {
    const { cols, blocked } = currentCols();
    const cands = listCandidates(level, cols, blocked);
    const found = [];
    const take = (group) => { if (group.length === 1) found.push(group[0]); };
    for (let r = 0; r < level.size; r++) if (cols[r] < 0) take(cands.filter(([rr]) => rr === r));
    for (let c = 0; c < level.size; c++) if (!cols.some((mc) => mc === c)) take(cands.filter(([, cc]) => cc === c));
    const letters = [...new Set(level.regions.join(""))].filter(Boolean);
    for (const reg of letters) {
      let taken = false;
      for (let r = 0; r < level.size; r++) if (cols[r] >= 0 && level.grid[r][cols[r]] === reg) taken = true;
      if (!taken) take(cands.filter(([r, c]) => level.grid[r][c] === reg));
    }
    const seen = new Set();
    return found.filter(([r, c]) => {
      const k = keyOf(r, c);
      if (seen.has(k)) return false;
      seen.add(k);
      return level.solution[r] === c;
    });
  }

  function persistentText() {
    if (!level || screen !== "play" || finished) return "";
    const { cols, blocked, crosses } = currentCols();
    if (!crosses.length) return "";
    const cands = listCandidates(level, cols, blocked);
    const crossIn = (pred) => crosses.some(([r, c]) => pred(r, c));
    for (let r = 0; r < level.size; r++) {
      if (cols[r] >= 0) continue;
      if (cands.some(([rr]) => rr === r)) continue;
      if (crossIn((rr) => rr === r)) return "이 줄은 둘 곳이 없어요. ×를 되돌려 보세요.";
    }
    for (let c = 0; c < level.size; c++) {
      if (cols.some((mc) => mc === c)) continue;
      if (cands.some(([, cc]) => cc === c)) continue;
      if (crossIn((r, cc) => cc === c)) return "이 열은 둘 곳이 없어요. ×를 되돌려 보세요.";
    }
    const letters = [...new Set(level.regions.join(""))].filter(Boolean);
    for (const reg of letters) {
      let taken = false;
      for (let r = 0; r < level.size; r++) if (cols[r] >= 0 && level.grid[r][cols[r]] === reg) taken = true;
      if (taken) continue;
      if (cands.some(([r, c]) => level.grid[r][c] === reg)) continue;
      if (crossIn((r, c) => level.grid[r][c] === reg)) return "이 구역은 둘 곳이 없어요. ×를 되돌려 보세요.";
    }
    return "";
  }

  function hasLegalEmpty() {
    const { cols, blocked } = currentCols();
    return listCandidates(level, cols, blocked).length > 0;
  }

  function crossWouldHelp() {
    const { cols, blocked, crosses } = currentCols();
    for (const [r, c] of crosses) {
      const next = new Set(blocked);
      next.delete(keyOf(r, c));
      if (isCandidate(level, cols, next, r, c)) return true;
    }
    return false;
  }

  function refreshStatus() {
    if (!transient) statusEl.textContent = persistentText();
    const dead = level && screen === "play" && !finished && !timeUp && liveMarks().length < level.size && !hasLegalEmpty() && !crossWouldHelp();
    stuckEl.hidden = !dead;
    undoBtn.hidden = markOrder.length === 0;
  }

  function say(text) {
    transient = text;
    statusEl.textContent = text;
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => {
      transient = "";
      if (screen === "play") statusEl.textContent = persistentText();
    }, 2500);
  }

  function clearSay() {
    transient = "";
    window.clearTimeout(fadeTimer);
  }

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function elapsedNow() {
    return accum + (running ? Date.now() - tickStart : 0);
  }

  function remainingNow() {
    return LIMIT[level.size] * 1000 + bonus - elapsedNow();
  }

  function shouldRunClock() {
    return screen === "play" && timerOn && !dialogKind && !finished && !timeUp && !document.hidden;
  }

  function stopClock() {
    if (running) {
      accum += Date.now() - tickStart;
      running = false;
    }
    window.clearInterval(timerHandle);
  }

  function startClock() {
    if (!shouldRunClock() || running) return;
    tickStart = Date.now();
    running = true;
    timerHandle = window.setInterval(onTick, 200);
  }

  function onTick() {
    paintTimer();
    if (mode === "treasure" && timerOn && remainingNow() <= 0) onTimeUp();
  }

  function paintTimer() {
    if (!level) return;
    timerBtn.hidden = screen !== "play" && screen !== "result";
    if (screen !== "play") return;
    const locked = tutorial() || touched;
    timerBtn.disabled = locked;
    if (!timerOn) {
      timerBtn.textContent = "끄기";
      timerBtn.setAttribute("aria-label", tutorial() ? "연습 판에는 시간이 없어요" : "타이머 꺼짐");
      return;
    }
    const label = mode === "treasure" ? fmt(remainingNow()) : fmt(elapsedNow());
    timerBtn.textContent = label;
    timerBtn.setAttribute("aria-label", "타이머 " + label);
  }

  function paintHearts() {
    heartsEl.replaceChildren();
    const shown = tutorial() ? 3 : hearts;
    for (let i = 0; i < 3; i++) heartsEl.appendChild(glyph(i < shown ? "ico-heart" : "ico-heart-empty"));
    if (tutorial()) {
      const tag = document.createElement("span");
      tag.className = "practice";
      tag.textContent = "연습";
      heartsEl.appendChild(tag);
    }
    app.dataset.hearts = String(shown);
    app.dataset.mistakes = String(mistakes);
  }

  function paintTools() {
    document.querySelectorAll(".tool[data-tool]").forEach((btn) => {
      const on = btn.dataset.tool === tool;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    setUse('.tool[data-tool="mark"] use', markGlyph());
    setUse('.tool[data-tool="cross"] use', crossGlyph());
    setUse("#hint-icon use", mode === "cat" ? "ico-tuna" : "ico-shovel");
    const left = 2 - hintsUsed;
    if (left <= 0) {
      hintLabel.textContent = "힌트 없음";
      hintBtn.disabled = true;
    } else if (mode === "treasure" && hintsUsed === 1 && save.gold < 20) {
      hintLabel.textContent = "골드가 부족해요";
      hintBtn.disabled = true;
    } else if (mode === "treasure" && hintsUsed === 1) {
      hintLabel.textContent = "힌트 20";
      hintBtn.disabled = false;
    } else {
      hintLabel.textContent = "힌트 " + left;
      hintBtn.disabled = false;
    }
  }

  function paintChrome() {
    document.body.dataset.mode = mode;
    app.dataset.mode = mode;
    app.dataset.screen = screen;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = mode === "cat" ? "#f6efe4" : "#1c2430";
    const playing = screen === "play";
    backBtn.hidden = screen === "start";
    backBtn.textContent = screen === "select" ? "처음" : "레벨";
    heartsEl.hidden = !playing;
    pauseBtn.hidden = !playing;
    goldEl.hidden = mode !== "treasure" || screen === "start";
    goldEl.textContent = "골드 " + save.gold;
    toolsEl.hidden = !playing;
    kickerEl.textContent = "한집한냥";
    if (screen === "start") titleEl.textContent = "시작";
    else if (screen === "select") titleEl.textContent = modeName();
    else if (level) titleEl.textContent = level.id + " · " + modeName();
    document.getElementById("next-cat").textContent = nextLabel("cat");
    document.getElementById("next-treasure").textContent = nextLabel("treasure");
    if (playing) {
      paintHearts();
      paintTimer();
      paintTools();
    } else {
      timerBtn.hidden = true;
    }
  }

  function nextLabel(which) {
    const prev = mode;
    mode = which;
    const id = nextOpenId();
    mode = prev;
    return id ? "다음 " + id : "24판 완료";
  }

  function cellStateName(cell, r, c) {
    if (cell.lock === "given" && cell.player === "mark") return mode === "cat" ? "처음부터 있는 고양이, 잠김" : "처음부터 있는 상자, 잠김";
    if (cell.lock === "exclude") return "처음부터 없음, 잠김";
    if (cell.lock === "hint" && cell.player === "mark") return mode === "cat" ? "힌트로 놓은 고양이, 잠김" : "힌트로 놓은 상자, 잠김";
    if (cell.lock === "hint" && cell.player === "cross") return "힌트로 없는 칸, 잠김";
    if (cell.player === "mark") return mode === "cat" ? "고양이" : "상자";
    if (cell.player === "cross") return "수색 표시";
    const { cols, blocked } = currentCols();
    if (!isCandidate(level, cols, blocked, r, c) && liveMarks().length) return "비어 있음, 규칙 표시";
    return "비어 있음";
  }

  function renderBoard() {
    const n = level.size;
    boardEl.classList.add("board");
    boardEl.style.display = "grid";
    boardEl.style.setProperty("--n", String(n));
    boardEl.style.gridTemplateColumns = "repeat(" + n + ", minmax(0, 1fr))";
    boardEl.classList.toggle("won", showOpen);
    boardEl.replaceChildren();
    const badgeAt = new Map();
    for (const h of level.halves) {
      for (let r = 0; r < n && !badgeAt.has(h.region); r++) {
        for (let c = 0; c < n; c++) if (level.grid[r][c] === h.region) { badgeAt.set(h.region, keyOf(r, c)); break; }
      }
    }
    const decoys = new Set(level.decoys.map(([r, c]) => keyOf(r, c)));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cell = cells[r][c];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell r" + level.grid[r][c];
        btn.setAttribute("role", "gridcell");
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        const reg = level.grid[r][c];
        if (c + 1 < n && level.grid[r][c + 1] !== reg) btn.classList.add("split-r");
        if (r + 1 < n && level.grid[r + 1][c] !== reg) btn.classList.add("split-b");
        if (hot && (hot[0] === r || hot[1] === c || level.grid[hot[0]][hot[1]] === reg)) btn.classList.add("hot");
        if (cursor[0] === r && cursor[1] === c) btn.classList.add("cursor");
        if (decoys.has(keyOf(r, c))) btn.classList.add("decoy");
        btn.setAttribute("aria-label", (r + 1) + "행 " + (c + 1) + "열, " + COLOR[reg] + " 구역, " + cellStateName(cell, r, c));
        if (cell.player === "mark") btn.appendChild(glyph(markGlyph()));
        else if (cell.player === "cross") btn.appendChild(glyph(crossGlyph()));
        else {
          const { cols, blocked } = currentCols();
          if (liveMarks().length && !isCandidate(level, cols, blocked, r, c)) btn.appendChild(glyph(crossGlyph(), "auto"));
        }
        if (cell.lock) btn.appendChild(glyph("ico-lock", "lock-badge"));
        const badgeKey = badgeAt.get(reg);
        if (badgeKey === keyOf(r, c)) {
          const side = halfSide(level, reg);
          const tag = document.createElement("span");
          tag.className = "half-badge";
          tag.textContent = HALF[side] || "";
          btn.appendChild(tag);
        }
        btn.addEventListener("click", () => onCell(r, c));
        btn.addEventListener("pointerenter", () => { hot = [r, c]; paintHot(); });
        boardEl.appendChild(btn);
      }
    }
    refreshStatus();
  }

  function paintHot() {
    const n = level.size;
    const buttons = boardEl.querySelectorAll(".cell");
    buttons.forEach((btn) => {
      const r = Number(btn.dataset.r);
      const c = Number(btn.dataset.c);
      const on = hot && (hot[0] === r || hot[1] === c || level.grid[hot[0]][hot[1]] === level.grid[r][c]);
      btn.classList.toggle("hot", !!on);
    });
    void n;
  }

  function shake(r, c) {
    const btn = boardEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
    if (!btn) return;
    if (reduceMotion) {
      btn.classList.add("reject");
      window.setTimeout(() => btn.classList.remove("reject"), 280);
      return;
    }
    btn.classList.remove("shake");
    void btn.offsetWidth;
    btn.classList.add("shake");
  }

  function flashConflict(at) {
    boardEl.querySelectorAll(".conflict").forEach((el) => el.classList.remove("conflict"));
    if (!at) return;
    const btn = boardEl.querySelector('[data-r="' + at[0] + '"][data-c="' + at[1] + '"]');
    if (!btn) return;
    btn.classList.add("conflict");
    window.clearTimeout(conflictTimer);
    conflictTimer = window.setTimeout(() => btn.classList.remove("conflict"), 800);
  }

  function reject(r, c, code, at) {
    say(REASON[code]);
    shake(r, c);
    flashConflict(at);
    if (code !== "locked") {
      mistakes += 1;
      if (!tutorial()) {
        hearts -= 1;
        if (hearts < 0) hearts = 0;
      }
      paintHearts();
      if (!reduceMotion) heartsEl.classList.add("shake");
      window.setTimeout(() => heartsEl.classList.remove("shake"), 240);
      blip(false);
      if (!tutorial() && hearts <= 0) {
        inputLock = true;
        window.setTimeout(openFail, 280);
        return;
      }
    }
  }

  function markTouched() {
    if (!touched) {
      touched = true;
      paintTimer();
    }
  }

  function countMarks() {
    return liveMarks().length;
  }

  function isWin() {
    if (countMarks() !== level.size) return false;
    const cols = Array(level.size).fill(-1);
    for (const [r, c] of liveMarks()) cols[r] = c;
    return cols.every((c) => c >= 0) && marksLegal(level, cols);
  }

  function onCell(r, c) {
    if (screen !== "play" || finished || timeUp || dialogKind || inputLock) return;
    cursor = [r, c];
    hot = [r, c];
    const cell = cells[r][c];
    if (tool === "erase") return doErase(r, c);
    if (tool === "cross") return doCross(r, c);
    doMark(r, c);
  }

  function doMark(r, c) {
    const cell = cells[r][c];
    if (cell.lock) return reject(r, c, "locked", null);
    if (cell.player === "cross") {
      say("×가 있어요. 지우개로 지우고 놓아 주세요.");
      shake(r, c);
      return;
    }
    if (cell.player === "mark") return;
    const reason = reasonFor(level, liveMarks(), r, c);
    if (reason) return reject(r, c, reason.code, reason.at);
    clearSay();
    cell.player = "mark";
    markOrder.push([r, c]);
    markTouched();
    blip(true);
    if (isWin()) return win();
    renderBoard();
  }

  function doCross(r, c) {
    const cell = cells[r][c];
    if (cell.lock) return reject(r, c, "locked", null);
    if (cell.player === "mark") {
      say("확정은 지우개로 지워요.");
      shake(r, c);
      return;
    }
    if (cell.player === "cross") return;
    clearSay();
    cell.player = "cross";
    markTouched();
    renderBoard();
  }

  function doErase(r, c) {
    const cell = cells[r][c];
    if (cell.lock) return reject(r, c, "locked", null);
    if (cell.player === "empty") return;
    clearSay();
    if (cell.player === "mark") markOrder = markOrder.filter(([rr, cc]) => rr !== r || cc !== c);
    cell.player = "empty";
    markTouched();
    renderBoard();
  }

  function undoLast() {
    const last = markOrder.pop();
    if (!last) return;
    const [r, c] = last;
    if (cells[r][c].player === "mark" && !cells[r][c].lock) cells[r][c].player = "empty";
    clearSay();
    renderBoard();
  }

  function onHint() {
    if (screen !== "play" || finished || timeUp || dialogKind || inputLock) return;
    if (hintsUsed >= 2) return say("힌트는 두 번까지예요.");
    if (mode === "treasure" && hintsUsed === 1 && save.gold < 20) return say("골드가 부족해요.");
    const forced = singlesNow();
    if (forced.length) {
      const [r, c] = forced[0];
      if (mode === "treasure" && hintsUsed === 1) save.gold -= 20;
      hintsUsed += 1;
      cells[r][c] = { player: "mark", lock: "hint" };
      markTouched();
      writeSave();
      blip(true);
      if (isWin()) return win();
      renderBoard();
      paintTools();
      paintChrome();
      return;
    }
    for (let i = markOrder.length - 1; i >= 0; i--) {
      const [r, c] = markOrder[i];
      if (level.solution[r] === c) continue;
      if (cells[r][c].player !== "mark" || cells[r][c].lock) continue;
      if (mode === "treasure" && hintsUsed === 1) save.gold -= 20;
      hintsUsed += 1;
      markOrder.splice(i, 1);
      cells[r][c] = { player: "cross", lock: "hint" };
      markTouched();
      writeSave();
      say("이 칸은 아니에요.");
      renderBoard();
      paintTools();
      paintChrome();
      return;
    }
    say("아직 바로 놓을 칸이 없어요. ×로 후보를 줄여 보세요.");
  }

  function starsFor(ms) {
    let stars = 1;
    if (hintsUsed <= 1 && mistakes <= 1) stars = 2;
    if (hintsUsed === 0 && mistakes === 0) stars = 3;
    if (timerOn && stars === 3 && ms > PAR[level.size] * 1000) stars = 2;
    return stars;
  }

  function recordClear(stars, ms) {
    const bucket = save[mode].cleared;
    const prev = bucket[level.id] || { stars: 0, bestMs: null };
    let gained = 0;
    if (stars > prev.stars) {
      gained = stars - prev.stars;
      prev.stars = stars;
      if (timerOn) prev.bestMs = ms;
    } else if (stars === prev.stars && timerOn && (prev.bestMs == null || ms < prev.bestMs)) {
      prev.bestMs = ms;
    }
    bucket[level.id] = prev;
    if (mode === "treasure") save.gold += gained * level.size;
    writeSave();
    return gained;
  }

  function win() {
    if (finished) return;
    finished = true;
    lastElapsed = elapsedNow();
    stopClock();
    showOpen = true;
    renderBoard();
    blipWin();
    window.setTimeout(showResult, reduceMotion ? 0 : 480);
  }

  function showResult() {
    screen = "result";
    const stars = starsFor(lastElapsed);
    const gained = recordClear(stars, lastElapsed);
    document.getElementById("result-stars").textContent = starText(stars);
    document.getElementById("result-line").textContent = mode === "cat" ? "이 줄의 주인을 찾았어요." : "상자를 찾았어요.";
    document.getElementById("result-extra").textContent = level.id === "01" ? "다음 판부터는 바로 옆에 둘 수 없어요." : "";
    const timeBit = timerOn ? " · " + fmt(lastElapsed) : "";
    document.getElementById("result-stats").textContent = "실수 " + mistakes + " · 힌트 " + hintsUsed + timeBit;
    const goldLine = document.getElementById("result-gold");
    goldLine.textContent = mode === "treasure" ? "+" + gained * level.size + " 골드" : "";
    document.getElementById("btn-next").hidden = level.id === "24";
    paintChrome();
    showScreen("result");
  }

  function showScreen(name) {
    screen = name;
    document.getElementById("screen-start").hidden = name !== "start";
    document.getElementById("screen-select").hidden = name !== "select";
    document.getElementById("screen-play").hidden = name !== "play";
    document.getElementById("screen-result").hidden = name !== "result";
    paintChrome();
  }

  function showStart() {
    closeDialog();
    stopClock();
    showScreen("start");
  }

  function showSelect() {
    closeDialog();
    stopClock();
    const note = document.getElementById("select-note");
    note.textContent = "";
    const grid = document.getElementById("level-grid");
    grid.replaceChildren();
    LEVELS.forEach((raw) => {
      const open = unlocked(raw.id);
      const rec = cleared(raw.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lv" + (open ? "" : " is-lock");
      btn.dataset.level = raw.id;
      const id = document.createElement("span");
      id.className = "lv-id";
      id.textContent = raw.id;
      const stars = document.createElement("span");
      stars.className = "lv-stars";
      stars.textContent = open ? starText(rec ? rec.stars : 0) : "잠김";
      btn.append(id, stars);
      btn.addEventListener("click", () => {
        if (!unlocked(raw.id)) {
          note.textContent = "이전 판을 깨면 열려요.";
          return;
        }
        startLevel(raw.id);
      });
      grid.appendChild(btn);
    });
    document.getElementById("select-heading").textContent = modeName();
    showScreen("select");
  }

  function beginAttempt() {
    const n = level.size;
    cells = [];
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) row.push({ player: "empty", lock: null });
      cells.push(row);
    }
    level.givens.forEach(([r, c]) => { cells[r][c] = { player: "mark", lock: "given" }; });
    level.excludes.forEach(([r, c]) => { cells[r][c] = { player: "cross", lock: "exclude" }; });
    markOrder = [];
    hearts = 3;
    mistakes = 0;
    hintsUsed = 0;
    touched = false;
    finished = false;
    showOpen = false;
    timeUp = false;
    extended = false;
    bonus = 0;
    accum = 0;
    timerOn = !tutorial() && mode === "treasure";
    tool = "mark";
    inputLock = false;
    cursor = [0, 0];
    hot = null;
    clearSay();
    statusEl.textContent = "";
    closeDialog();
    showScreen("play");
    renderBoard();
    stopClock();
    if (timerOn) startClock();
    paintTimer();
  }

  function startLevel(id) {
    level = parseLevel(LEVELS.find((raw) => raw.id === id));
    if (id === "02" && !save.seenAdjacent[mode]) return openDialog("adjacent");
    if (mode === "treasure" && id === "11" && !save.seenDecoyTip) return openDialog("decoy");
    beginAttempt();
  }

  function resetAttempt() {
    if (!level) return;
    beginAttempt();
  }

  function openFail() {
    stopClock();
    openDialog("fail");
  }

  function onTimeUp() {
    if (timeUp || finished) return;
    timeUp = true;
    stopClock();
    openDialog("time");
  }

  function openDialog(kind) {
    dialogKind = kind;
    stopClock();
    overlay.hidden = false;
    dialog.replaceChildren();
    const add = (html) => { dialog.insertAdjacentHTML("beforeend", html); };
    if (kind === "intro") {
      add("<h2>한집한냥</h2><p>" + (introStep === 0 ? "한 줄에 하나, 한 열에 하나." : "같은 색 방에 하나.") + "</p>");
      add('<div class="row"><button type="button" data-act="intro-next">' + (introStep === 0 ? "다음" : "시작") + '</button><button type="button" data-act="intro-skip">건너뛰기</button></div>');
    } else if (kind === "adjacent") {
      add("<h2>붙어 있으면 안 돼요</h2><p>다음 판부터는 대각선을 포함해 바로 옆 칸에 둘 수 없어요.</p>");
      add('<div class="row"><button type="button" data-act="adjacent-ok">알겠어요</button></div>');
    } else if (kind === "decoy") {
      add("<h2>반짝임</h2><p>반짝인다고 보물은 아니에요. 규칙은 그대로예요.</p>");
      add('<div class="row"><button type="button" data-act="decoy-ok">알겠어요</button></div>');
    } else if (kind === "pause") {
      add("<h2>일시정지</h2>");
      add('<div class="row"><button type="button" data-act="resume">계속</button><button type="button" data-act="restart">처음부터</button><button type="button" data-act="to-select">레벨 선택</button><button type="button" data-act="sound">소리 ' + (save.sound ? "켜짐" : "꺼짐") + '</button><button type="button" data-act="help">조작 설명</button>' + (tutorial() || touched ? "" : '<button type="button" data-act="timer-toggle">타이머 ' + (timerOn ? "끄기" : "켜기") + "</button>") + "</div>");
    } else if (kind === "help") {
      add("<h2>조작</h2><p>아래 도구를 고른 뒤 칸을 누르세요. 한 줄, 한 열, 같은 색 구역에 하나. 레벨 2부터는 맞닿은 칸에 둘 수 없습니다. ×는 메모라서 하트가 줄지 않습니다.</p><p>방향키로 이동, Enter 확정, X 수색, Backspace 지우개, H 힌트.</p>");
      add('<div class="row"><button type="button" data-act="help-back">돌아가기</button></div>');
    } else if (kind === "confirm") {
      add("<h2>처음부터</h2><p>이 판을 처음 상태로 돌릴까요?</p>");
      add('<div class="row"><button type="button" data-act="confirm-yes">돌릴게요</button><button type="button" data-act="confirm-no">취소</button></div>');
    } else if (kind === "fail") {
      add("<h2>하트가 없어요</h2><p>같은 퍼즐을 처음 상태로 다시 엽니다. 이번 시도의 별과 골드는 없습니다.</p>");
      add('<div class="row"><button type="button" data-act="fail-restart">처음부터</button></div>');
    } else if (kind === "time") {
      add("<h2>시간이 끝났어요</h2>");
      add('<div class="row">' + (extended ? "" : '<button type="button" data-act="extra">30초 더</button>') + '<button type="button" data-act="fail-restart">처음부터</button></div>');
    }
    const first = dialog.querySelector("button");
    if (first) first.focus();
  }

  function closeDialog() {
    dialogKind = "";
    overlay.hidden = true;
    dialog.replaceChildren();
    if (screen === "play" && !finished && !timeUp) startClock();
  }

  function onDialog(act) {
    if (act === "intro-next") {
      if (introStep === 0) {
        introStep = 1;
        openDialog("intro");
        return;
      }
      save.seenIntro[mode] = true;
      writeSave();
      closeDialog();
      showSelect();
      return;
    }
    if (act === "intro-skip") {
      save.seenIntro[mode] = true;
      writeSave();
      closeDialog();
      showSelect();
      return;
    }
    if (act === "adjacent-ok") {
      save.seenAdjacent[mode] = true;
      writeSave();
      beginAttempt();
      return;
    }
    if (act === "decoy-ok") {
      save.seenDecoyTip = true;
      writeSave();
      beginAttempt();
      return;
    }
    if (act === "resume") return closeDialog();
    if (act === "restart") return openDialog("confirm");
    if (act === "confirm-no" || act === "help-back") return openDialog("pause");
    if (act === "confirm-yes" || act === "fail-restart") return resetAttempt();
    if (act === "to-select") return showSelect();
    if (act === "sound") {
      save.sound = !save.sound;
      writeSave();
      openDialog("pause");
      return;
    }
    if (act === "help") return openDialog("help");
    if (act === "timer-toggle") {
      if (!tutorial() && !touched) {
        timerOn = !timerOn;
        accum = 0;
        bonus = 0;
        stopClock();
      }
      openDialog("pause");
      return;
    }
    if (act === "extra") {
      if (extended) return;
      extended = true;
      bonus += 30000;
      timeUp = false;
      closeDialog();
      startClock();
      paintTimer();
    }
  }

  function blip(ok) {
    if (!save.sound || !audioOn || !audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = ok ? "sine" : (mode === "cat" ? "triangle" : "square");
    o.frequency.value = ok ? 540 : (mode === "cat" ? 180 : 96);
    g.gain.value = ok ? 0.04 : 0.03;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (ok ? 0.07 : 0.12));
    o.stop(now + 0.13);
  }

  function blipWin() {
    if (!save.sound || !audioOn || !audioCtx) return;
    [523, 659, 784].forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const now = audioCtx.currentTime + i * 0.08;
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o.stop(now + 0.17);
    });
  }

  function unlockAudio() {
    if (audioOn) return;
    try {
      audioCtx = audioCtx || new AudioContext();
      if (audioCtx.state === "suspended") audioCtx.resume();
      audioOn = true;
    } catch (err) {
      audioOn = false;
    }
  }

  function onKey(e) {
    if (dialogKind) {
      if (e.key === "Escape" && dialogKind === "pause") closeDialog();
      return;
    }
    if (screen !== "play" || finished || timeUp || inputLock) return;
    const n = level.size;
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Enter" || e.key === "x" || e.key === "X" || e.key === "Backspace" || e.key === "h" || e.key === "H") {
      e.preventDefault();
    }
    if (e.key === "ArrowUp") cursor[0] = (cursor[0] + n - 1) % n;
    else if (e.key === "ArrowDown") cursor[0] = (cursor[0] + 1) % n;
    else if (e.key === "ArrowLeft") cursor[1] = (cursor[1] + n - 1) % n;
    else if (e.key === "ArrowRight") cursor[1] = (cursor[1] + 1) % n;
    else if (e.key === "Enter") return doMark(cursor[0], cursor[1]);
    else if (e.key === "x" || e.key === "X") return doCross(cursor[0], cursor[1]);
    else if (e.key === "Backspace") return doErase(cursor[0], cursor[1]);
    else if (e.key === "h" || e.key === "H") return onHint();
    else return;
    hot = cursor.slice();
    renderBoard();
    const btn = boardEl.querySelector('[data-r="' + cursor[0] + '"][data-c="' + cursor[1] + '"]');
    if (btn) btn.focus();
  }

  function chooseMode(next) {
    mode = next;
    if (!save.seenIntro[mode]) {
      introStep = 0;
      openDialog("intro");
      paintChrome();
      return;
    }
    showSelect();
  }

  document.getElementById("pick-cat").addEventListener("click", () => chooseMode("cat"));
  document.getElementById("pick-treasure").addEventListener("click", () => chooseMode("treasure"));
  backBtn.addEventListener("click", () => {
    if (screen === "select" || screen === "result") showStart();
    else if (screen === "play") showSelect();
  });
  pauseBtn.addEventListener("click", () => openDialog("pause"));
  timerBtn.addEventListener("click", () => {
    if (tutorial() || touched || screen !== "play") return;
    timerOn = !timerOn;
    accum = 0;
    bonus = 0;
    stopClock();
    if (timerOn) startClock();
    paintTimer();
  });
  undoBtn.addEventListener("click", undoLast);
  hintBtn.addEventListener("click", onHint);
  toolsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tool]");
    if (!btn) return;
    tool = btn.dataset.tool;
    paintTools();
  });
  dialog.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (btn) onDialog(btn.dataset.act);
  });
  document.getElementById("btn-next").addEventListener("click", () => {
    const next = pad(Number(level.id) + 1);
    if (LEVELS.some((raw) => raw.id === next)) startLevel(next);
  });
  document.getElementById("btn-retry").addEventListener("click", resetAttempt);
  document.getElementById("btn-levels").addEventListener("click", showSelect);
  boardEl.addEventListener("pointerleave", () => { hot = cursor.slice(); paintHot(); });
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopClock();
    else startClock();
  });

  showScreen("start");

  window.HUNT = {
    debugCheckAll() {
      const fails = [];
      LEVELS.forEach((raw) => {
        const lv = parseLevel(raw);
        const kind = analyze(lv);
        const want = lv.difficulty >= 5 ? "branch" : "elim";
        if (kind !== want) fails.push(lv.id + " " + kind + " want " + want);
        if (lv.id === "01") {
          const reason = reasonFor(lv, lv.givens, 3, 0);
          if (!reason || reason.code !== "col") fails.push("01 reason " + (reason && reason.code));
        }
        if (lv.id === "02") {
          const reason = reasonFor(lv, lv.givens, 2, 2);
          if (!reason || reason.code !== "adjacent") fails.push("02 reason " + (reason && reason.code));
        }
      });
      return fails;
    },
  };
})();
