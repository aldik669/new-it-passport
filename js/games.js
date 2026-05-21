const MEMORY_LEVELS = [
  { cells: 4, showMs: 4000 },
  { cells: 5, showMs: 3500 },
  { cells: 6, showMs: 3000 }
];

const COLOR_NAMES = [
  { name: "КРАСНЫЙ", key: "red", hex: "#EF4444", label: "Красный" },
  { name: "СИНИЙ", key: "blue", hex: "#007BFF", label: "Синий" },
  { name: "ЗЕЛЕНЫЙ", key: "green", hex: "#22C55E", label: "Зеленый" },
  { name: "ЖЕЛТЫЙ", key: "yellow", hex: "#FACC15", label: "Желтый" }
];

const ROUTE_LEVELS = [
  {
    size: 4,
    grid: ["....", ".K..", ".D..", "...."],
    start: { x: 0, y: 0 },
    optimal: 5
  },
  {
    size: 5,
    grid: [".....", ".#K..", ".#.#.", "..D..", "....."],
    start: { x: 0, y: 0 },
    optimal: 9
  },
  {
    size: 6,
    grid: ["......", ".#..K.", ".##.#.", "...#..", "..D...", "......"],
    start: { x: 0, y: 0 },
    optimal: 12
  }
];

const COLOR_ROUND_MS = { "5-7": 5500, "8-12": 5000, "13+": 4500 };

function runTimeline(fillEl, ms, onEnd) {
  if (!fillEl) {
    if (onEnd) setTimeout(onEnd, ms);
    return () => {};
  }
  fillEl.style.transition = "none";
  fillEl.style.width = "100%";
  void fillEl.offsetWidth;
  fillEl.style.transition = `width ${ms}ms linear`;
  fillEl.style.width = "0%";
  const t = setTimeout(onEnd, ms);
  return () => clearTimeout(t);
}

function createMemoryGame(root, onDone) {
  const boardEl = root.querySelector("#memory-board");
  const statsEl = root.querySelector("#memory-stats");
  const msgEl = root.querySelector("#memory-message");
  const startBtn = root.querySelector("#memory-start");
  const checkBtn = root.querySelector("#memory-check");
  const tlMem = root.querySelector("#memory-timeline-mem");
  const tlMemFill = root.querySelector("#memory-timeline-mem-fill");

  const GRID = 6;
  const TOTAL = GRID * GRID;
  let levelIdx = 0;
  let pattern = [];
  let selected = new Set();
  let showing = false;
  let phase = "idle";
  let gameScore = 0;
  let gameStarted = false;
  let memorizeTimeout = null;

  const stats = {
    memoryScore: 0,
    accuracy: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalMissed: 0,
    averageResponseTime: 0,
    completedLevels: 0,
    correctionsCount: 0,
    responseTimes: []
  };

  function setIdleUI() {
    gameStarted = false;
    phase = "idle";
    startBtn.hidden = false;
    startBtn.disabled = false;
    checkBtn.hidden = true;
    boardEl.hidden = true;
    statsEl.hidden = true;
    tlMem.hidden = true;
    msgEl.textContent = "";
  }

  function setPlayingUI() {
    gameStarted = true;
    startBtn.hidden = true;
    checkBtn.hidden = false;
    boardEl.hidden = false;
    statsEl.hidden = false;
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < TOTAL; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-cell";
      btn.addEventListener("click", () => toggle(i));
      boardEl.appendChild(btn);
    }
    updateStats();
  }

  function updateStats() {
    const lvl = MEMORY_LEVELS[levelIdx];
    statsEl.innerHTML = `
      <span>Уровень: ${levelIdx + 1}/${MEMORY_LEVELS.length}</span>
      <span>Счёт: ${gameScore}</span>
      <span>Точность: ${stats.accuracy}%</span>
    `;
    checkBtn.disabled = phase !== "pick" || selected.size !== (lvl?.cells || 0);
    checkBtn.hidden = phase !== "pick";
  }

  function randomPattern(n) {
    const set = new Set();
    while (set.size < n) set.add(Math.floor(Math.random() * TOTAL));
    return [...set];
  }

  let roundStart = 0;

  function beginLevel() {
    if (memorizeTimeout) clearTimeout(memorizeTimeout);

    const cfg = MEMORY_LEVELS[levelIdx];
    pattern = randomPattern(cfg.cells);
    selected = new Set();
    showing = true;
    phase = "memorize";
    msgEl.textContent = "Смотри внимательно…";
    roundStart = Date.now();
    checkBtn.hidden = true;

    tlMem.hidden = false;
    runTimeline(tlMemFill, cfg.showMs, () => {});

    paintCells();

    memorizeTimeout = setTimeout(() => {
      memorizeTimeout = null;
      showing = false;
      phase = "pick";
      msgEl.textContent = "Повтори рисунок — время не ограничено";
      tlMem.hidden = true;
      paintCells();
      updateStats();
    }, cfg.showMs);
  }

  function paintCells(check = null) {
    boardEl.querySelectorAll(".memory-cell").forEach((btn, i) => {
      btn.className = "memory-cell";
      btn.disabled = showing || phase !== "pick";
      if (showing && pattern.includes(i)) btn.classList.add("memory-cell--show");
      else if (selected.has(i) && !check) btn.classList.add("memory-cell--picked");
      if (check) {
        if (check.correct.has(i)) btn.classList.add("memory-cell--ok");
        if (check.wrong.has(i)) btn.classList.add("memory-cell--bad");
        if (check.missed.has(i)) btn.classList.add("memory-cell--miss");
      }
    });
  }

  function toggle(i) {
    if (phase !== "pick") return;
    if (selected.has(i)) {
      selected.delete(i);
      stats.correctionsCount++;
    } else selected.add(i);
    paintCells();
    updateStats();
  }

  function advanceOrFinish() {
    if (levelIdx >= MEMORY_LEVELS.length - 1) finish();
    else {
      levelIdx++;
      beginLevel();
    }
  }

  function check() {
    const p = new Set(pattern);
    const correct = new Set();
    const wrong = new Set();
    selected.forEach((x) => (p.has(x) ? correct.add(x) : wrong.add(x)));
    const missed = new Set();
    p.forEach((x) => {
      if (!selected.has(x)) missed.add(x);
    });

    stats.totalCorrect += correct.size;
    stats.totalWrong += wrong.size;
    stats.totalMissed += missed.size;
    const total = stats.totalCorrect + stats.totalWrong + stats.totalMissed;
    stats.accuracy = total ? Math.round((stats.totalCorrect / total) * 100) : 0;
    stats.responseTimes.push(Date.now() - roundStart);

    phase = "checked";
    paintCells({ correct, wrong, missed });
    checkBtn.hidden = true;

    const ok = wrong.size === 0 && missed.size === 0;
    if (ok) {
      gameScore += (levelIdx + 1) * 20;
      stats.completedLevels++;
      msgEl.textContent = "Отлично! 🎉";
    } else {
      msgEl.textContent = "Идём дальше — следующий уровень!";
    }
    setTimeout(() => advanceOrFinish(), ok ? 700 : 900);
    updateStats();
  }

  function finish() {
    tlMem.hidden = true;
  
    const rt = stats.responseTimes;
    stats.averageResponseTime = rt.length
      ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length)
      : 0;
  
      stats.memoryScore = Math.min(
        100,
        Math.round(
          stats.accuracy * 0.8 +
          stats.completedLevels * (20 / MEMORY_LEVELS.length)
        )
      );
  
    phase = "finished";
    startBtn.hidden = true;
    checkBtn.hidden = true;
    boardEl.hidden = true;
    statsEl.hidden = true;
    msgEl.textContent = "Готово! Переходим к следующей игре...";
  
    if (typeof onDone === "function") {
      onDone(stats);
    }
  }

  startBtn.addEventListener("click", () => {
    if (memorizeTimeout) clearTimeout(memorizeTimeout);
    levelIdx = 0;
    gameScore = 0;
    Object.assign(stats, {
      memoryScore: 0,
      accuracy: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalMissed: 0,
      averageResponseTime: 0,
      completedLevels: 0,
      correctionsCount: 0,
      responseTimes: [],
      timeoutCount: 0
    });
    setPlayingUI();
    renderBoard();
    beginLevel();
  });

  checkBtn.addEventListener("click", check);
  setIdleUI();
  renderBoard();
}

var colorGameApi = null;

function createColorGame(root) {
  const introEl = root.querySelector("#color-intro");
  const playEl = root.querySelector("#color-play");
  const startBtn = root.querySelector("#color-start");
  const wordEl = root.querySelector("#color-word");
  const wordWrap = root.querySelector("#color-word-wrap");
  const optsEl = root.querySelector("#color-options");
  const statsEl = root.querySelector("#color-stats");
  const tlFill = root.querySelector("#color-timeline-fill");

  let onDoneCallback = null;
  let ageGroup = "8-12";
  let round = 0;
  let roundsTotal = 8;
  let current = null;
  let roundStart = 0;
  let playing = false;
  let cancelRoundTl = null;
  let locked = false;

  const stats = {
    colorCorrect: 0,
    colorWrong: 0,
    colorAccuracy: 0,
    averageReactionTime: 0,
    impulseErrors: 0,
    timeoutCount: 0,
    reactionTimes: []
  };

  optsEl.innerHTML = COLOR_NAMES.map(
    (c) => `<button type="button" class="color-btn" data-key="${c.key}">${c.label}</button>`
  ).join("");

  function showIntro() {
    playing = false;
    locked = false;
    introEl.hidden = false;
    playEl.hidden = true;
  }

  function showPlay() {
    introEl.hidden = true;
    playEl.hidden = false;
  }

  function updateStats() {
    const done = stats.colorCorrect + stats.colorWrong;
    stats.colorAccuracy = done ? Math.round((stats.colorCorrect / done) * 100) : 0;
    statsEl.innerHTML = `
      <span>Раунд: ${round}/${roundsTotal}</span>
      <span>Точность: ${stats.colorAccuracy}%</span>
    `;
  }

  function flashFeedback(ok) {
    wordWrap.classList.remove("color-word-wrap--ok", "color-word-wrap--bad");
    void wordWrap.offsetWidth;
    wordWrap.classList.add(ok ? "color-word-wrap--ok" : "color-word-wrap--bad");
    optsEl.classList.toggle("color-options--locked", true);
    setTimeout(() => {
      wordWrap.classList.remove("color-word-wrap--ok", "color-word-wrap--bad");
      optsEl.classList.remove("color-options--locked");
      locked = false;
      nextRound();
    }, 650);
  }

  function nextRound() {
    if (!playing) return;
    if (round >= roundsTotal) {
      const rt = stats.reactionTimes;
      stats.averageReactionTime = rt.length ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length) : 0;
      playing = false;
      onDoneCallback(stats);
      return;
    }
    round++;
    roundStart = Date.now();
    locked = false;
    const wordIdx = Math.floor(Math.random() * COLOR_NAMES.length);
    let colorIdx = Math.floor(Math.random() * COLOR_NAMES.length);
    while (colorIdx === wordIdx) colorIdx = Math.floor(Math.random() * COLOR_NAMES.length);
    current = { word: COLOR_NAMES[wordIdx], color: COLOR_NAMES[colorIdx] };
    wordEl.textContent = current.word.name;
    wordEl.style.color = current.color.hex;
    updateStats();

    const ms = COLOR_ROUND_MS[ageGroup] || 5000;
    if (cancelRoundTl) cancelRoundTl();
    cancelRoundTl = runTimeline(tlFill, ms, () => {
      if (playing && current && !locked) {
        stats.timeoutCount++;
        stats.colorWrong++;
        locked = true;
        flashFeedback(false);
      }
    });
  }

  optsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".color-btn");
    if (!btn || !current || !playing || locked) return;
    locked = true;
    if (cancelRoundTl) cancelRoundTl();

    const c = COLOR_NAMES.find((x) => x.key === btn.dataset.key);
    if (!c) {
      locked = false;
      return;
    }
    stats.reactionTimes.push(Date.now() - roundStart);
    const ok = c.key === current.color.key;
    if (ok) stats.colorCorrect++;
    else {
      stats.colorWrong++;
      if (c.key === current.word.key) stats.impulseErrors++;
    }
    current = null;
    updateStats();
    flashFeedback(ok);
  });

  startBtn.addEventListener("click", () => {
    showPlay();
    playing = true;
    round = 0;
    Object.assign(stats, {
      colorCorrect: 0,
      colorWrong: 0,
      colorAccuracy: 0,
      averageReactionTime: 0,
      impulseErrors: 0,
      timeoutCount: 0,
      reactionTimes: []
    });
    nextRound();
  });

  colorGameApi = {
    resetIntro() {
      showIntro();
    },
    begin(group, cb) {
      ageGroup = group;
      roundsTotal = group === "5-7" ? 6 : group === "8-12" ? 8 : 10;
      onDoneCallback = cb;
      showIntro();
    }
  };

  showIntro();
}

var routeGameApi = null;

function createRouteGame(root) {
  const introEl = root.querySelector("#route-intro");
  const playEl = root.querySelector("#route-play");
  const startBtn = root.querySelector("#route-start");
  const boardEl = root.querySelector("#route-board");
  const statsEl = root.querySelector("#route-stats");
  const cmdsEl = root.querySelector("#route-commands");
  const runBtn = root.querySelector("#route-run");
  const resetBtn = root.querySelector("#route-reset");
  const successEl = root.querySelector("#route-success");

  let onDoneCallback = null;
  let levelIdx = 0;
  let commands = [];
  let level = ROUTE_LEVELS[0];
  let displayHero = { ...level.start };
  let animating = false;
  let hasKey = false;
  let heroEl = null;
  let boardBuilt = false;
  const MAX_ROUTE_ATTEMPTS = 3;
  let routeAttempts = 0;

  const stats = {
    commandsCount: 0,
    optimalCommands: 0,
    extraCommands: 0,
    routeEfficiency: 0,
    wallHits: 0,
    wrongDoorAttempts: 0,
    restartsCount: 0,
    timeToStart: 0,
    levelScores: []
  };

  let startedAt = Date.now();
  let firstCmd = false;

  function showIntro() {
    introEl.hidden = false;
    playEl.hidden = true;
  }

  function showPlay() {
    introEl.hidden = true;
    playEl.hidden = false;
  }

  function cellAt(x, y) {
    return level.grid[y]?.[x] || "#";
  }

  function buildBoardCells() {
    boardEl.style.gridTemplateColumns = `repeat(${level.size}, 48px)`;
    boardEl.innerHTML = "";
    for (let y = 0; y < level.size; y++) {
      for (let x = 0; x < level.size; x++) {
        const ch = level.grid[y][x];
        const div = document.createElement("div");
        div.className = "route-cell" + (ch === "#" ? " route-cell--wall" : "");
        div.dataset.x = String(x);
        div.dataset.y = String(y);
        if (ch === "K" && !hasKey) div.textContent = "🔑";
        else if (ch === "D") div.textContent = hasKey ? "🚪✨" : "🚪";
        boardEl.appendChild(div);
      }
    }
    heroEl = document.createElement("div");
    heroEl.className = "route-hero";
    heroEl.textContent = "🐱";
    boardEl.appendChild(heroEl);
    boardBuilt = true;
    placeHero(displayHero.x, displayHero.y, 0);
  }

  function updateStaticIcons() {
    boardEl.querySelectorAll(".route-cell").forEach((cell) => {
      const x = Number(cell.dataset.x);
      const y = Number(cell.dataset.y);
      const ch = cellAt(x, y);
      if (ch === "K") cell.textContent = hasKey ? "" : "🔑";
      else if (ch === "D") cell.textContent = hasKey ? "🚪✨" : "🚪";
      else if (cell.textContent === "🐱") cell.textContent = "";
    });
  }

  function placeHero(x, y, durationMs) {
    if (!heroEl || !boardBuilt) return;
  
    const cell = boardEl.querySelector(`.route-cell[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;
  
    const heroSize = 40;
  
    const left = cell.offsetLeft + (cell.offsetWidth - heroSize) / 2;
    const top = cell.offsetTop + (cell.offsetHeight - heroSize) / 2;
  
    heroEl.style.transition =
      durationMs > 0
        ? `left ${durationMs}ms ease-in-out, top ${durationMs}ms ease-in-out`
        : "none";
  
    heroEl.style.left = `${left}px`;
    heroEl.style.top = `${top}px`;
  
    displayHero = { x, y };
    updateStaticIcons();
  }

  function renderBoard() {
    if (!boardBuilt) buildBoardCells();
    else {
      placeHero(displayHero.x, displayHero.y, 0);
      updateStaticIcons();
    }
    statsEl.innerHTML = `
  <span>Уровень: ${levelIdx + 1}/3</span>
  <span>Попытка: ${routeAttempts + 1}/${MAX_ROUTE_ATTEMPTS}</span>
  <span>Команд: ${commands.length}</span>
`;
    cmdsEl.innerHTML = commands.map((c) => `<span class="route-cmd-chip">${c}</span>`).join("");
    successEl.hidden = true;
  }

  function resetHero() {
    displayHero = { ...level.start };
    hasKey = false;
    commands = [];
    boardBuilt = false;
    renderBoard();
  }

  function loadLevel(idx) {
    level = ROUTE_LEVELS[idx];
    routeAttempts = 0;
    boardBuilt = false;
    resetHero();
    startedAt = Date.now();
    firstCmd = false;
    renderBoard();
  }

  function animatePath(path, onComplete, stepMs) {
    if (!path.length) {
      onComplete(false);
      return;
    }
    animating = true;
    hasKey = false;
    let step = 0;
    placeHero(path[0].x, path[0].y, 0);

    function nextStep() {
      step++;
      if (step >= path.length) {
        animating = false;
        const last = path[path.length - 1];
        const win = hasKey && cellAt(last.x, last.y) === "D";
        onComplete(win);
        return;
      }
      const pos = path[step];
      const ch = cellAt(pos.x, pos.y);
      if (ch === "K") hasKey = true;
      placeHero(pos.x, pos.y, stepMs);
      setTimeout(nextStep, stepMs + 40);
    }

    setTimeout(nextStep, stepMs + 40);
  }

  function simulateRun() {
    let x = level.start.x;
    let y = level.start.y;
    const path = [{ x, y }];
    let simKey = false;

    const moves = commands.map((c) => {
      if (c === "⬆️") return { dx: 0, dy: -1 };
      if (c === "⬇️") return { dx: 0, dy: 1 };
      if (c === "⬅️") return { dx: -1, dy: 0 };
      return { dx: 1, dy: 0 };
    });

    for (const m of moves) {
      const nx = x + m.dx;
      const ny = y + m.dy;
      if (nx < 0 || ny < 0 || nx >= level.size || ny >= level.size) continue;
      const ch = cellAt(nx, ny);
      if (ch === "#") {
        stats.wallHits++;
        continue;
      }
      x = nx;
      y = ny;
      path.push({ x, y });
      if (ch === "K") simKey = true;
      if (ch === "D" && !simKey) stats.wrongDoorAttempts++;
    }

    hasKey = simKey;
    return path;
  }

  function returnToStartAnimated(path, then) {
    const back = [...path].reverse();
    if (back.length <= 1) {
      placeHero(level.start.x, level.start.y, 120);
      hasKey = false;
      setTimeout(then, 200);
      return;
    }
    animatePath(back, () => {
      hasKey = false;
      placeHero(level.start.x, level.start.y, 80);
      setTimeout(then, 120);
    }, 90);
  }

  startBtn.addEventListener("click", () => {
    showPlay();
    loadLevel(0);
  });

  root.querySelectorAll(".route-cmd").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (animating || playEl.hidden) return;
      if (!firstCmd) {
        firstCmd = true;
        stats.timeToStart = Date.now() - startedAt;
      }
      const map = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };
      commands.push(map[btn.dataset.cmd]);
      renderBoard();
    });
  });

  resetBtn.addEventListener("click", () => {
    if (animating) return;
    stats.restartsCount++;
    resetHero();
  });

  runBtn.addEventListener("click", () => {
    if (animating || playEl.hidden) return;
    stats.commandsCount += commands.length;
    const path = simulateRun();

    const extra = Math.max(0, commands.length - level.optimal);
    stats.extraCommands += extra;
    const eff = Math.max(0, Math.round(100 - (extra / Math.max(level.optimal, 1)) * 100));
    stats.levelScores.push(eff);

    animatePath(path, (win) => {
      if (win) {
        successEl.hidden = false;
        setTimeout(() => {
          successEl.hidden = true;
          if (levelIdx >= ROUTE_LEVELS.length - 1) {
            stats.routeEfficiency = Math.round(
              stats.levelScores.reduce((a, b) => a + b, 0) / stats.levelScores.length
            );
            showIntro();
            onDoneCallback(stats);
          } else {
            levelIdx++;
            loadLevel(levelIdx);
          }
        }, 1400);
      } else {
        returnToStartAnimated(path, () => {
          routeAttempts++;
          stats.restartsCount++;
      
          if (routeAttempts >= MAX_ROUTE_ATTEMPTS) {
            successEl.textContent = "Ничего страшного, идём дальше!";
            successEl.hidden = false;
      
            setTimeout(() => {
              successEl.hidden = true;
      
              if (levelIdx >= ROUTE_LEVELS.length - 1) {
                stats.routeEfficiency = stats.levelScores.length
                  ? Math.round(stats.levelScores.reduce((a, b) => a + b, 0) / stats.levelScores.length)
                  : 0;
      
                showIntro();
      
                if (typeof onDoneCallback === "function") {
                  onDoneCallback(stats);
                }
              } else {
                levelIdx++;
                loadLevel(levelIdx);
              }
            }, 900);
      
            return;
          }
      
          resetHero();
        });
      }
    }, 160);
  });

  routeGameApi = {
    resetIntro() {
      showIntro();
    },
    reset(cb) {
      onDoneCallback = cb;
      levelIdx = 0;
      Object.assign(stats, {
        commandsCount: 0,
        optimalCommands: 0,
        extraCommands: 0,
        routeEfficiency: 0,
        wallHits: 0,
        wrongDoorAttempts: 0,
        restartsCount: 0,
        timeToStart: 0,
        levelScores: []
      });
      showIntro();
    }
  };

  showIntro();
}
