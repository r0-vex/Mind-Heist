/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Game Engine
   Level management, score calculation, timer, unlock system, hints.

   MIGRATION CHANGES:
   - All DB calls now pass currentUser (UUID) instead of username string.
   - DB.getScores(userId), DB.upsertScore(userId, ...), etc.
   - DB.updateUser(userId, fields) — updates profile by UUID.
   - DB.recalcClanScore uses clan code from profile.
   - recordAttempt passes UUID.
   - No other logic changes; all game mechanics preserved.
   ──────────────────────────────────────────────────────────────── */

let currentLevel = 0;
let puzzles = [];
let puzzleIndex = 0;
let sessionScore = 0;
let timerInterval = null;
let timeLeft = 0;
let currentAttempts = 0;
let sessionStats = { correct: 0, wrong: 0, totalTime: 0, startTime: 0 };

/* ─────────────────────────────────────────────────────────────────
   LEVEL GRID RENDERING
───────────────────────────────────────────────────────────────── */
async function renderLevels() {
  const grid = document.getElementById('levels-grid');
  grid.innerHTML = '<div style="color:rgba(0,255,136,0.4);font-size:0.8rem;letter-spacing:0.1em">LOADING<span class="dots"></span></div>';

  await refreshCurrentUser();
  const user       = currentUserData;
  const userScores = await DB.getScores(currentUser);

  grid.innerHTML = '';
  LEVELS.forEach((lvl, i) => {
    const unlocked = i === 0 || (user.best_level || 0) >= i;
    const best     = userScores[lvl.id];
    const diffColors = { EASY:'#00ff88', MEDIUM:'#00e5ff', HARD:'#ffe600', EXPERT:'#ff3366', ELITE:'#ff00aa' };
    const col = diffColors[lvl.difficulty] || '#00ff88';

    const card = document.createElement('div');
    card.className = 'level-card' + (unlocked ? '' : ' locked');
    card.innerHTML = `
      <div class="level-num" style="color:${col};text-shadow:0 0 12px ${col};">${String(lvl.id).padStart(2,'0')}</div>
      <div class="level-name">${lvl.name}</div>
      <div class="level-diff">
        <span class="tag" style="border-color:${col};color:${col}">${lvl.difficulty}</span>
      </div>
      ${best ? `<div class="best-score">BEST: ${best.toLocaleString()}</div>` : ''}
      ${!unlocked ? '<div style="font-size:0.65rem;color:rgba(255,51,102,0.7);margin-top:6px">🔒 LOCKED</div>' : ''}
    `;
    if (unlocked) card.onclick = () => startLevel(lvl.id);
    grid.appendChild(card);
  });
}

/* ─────────────────────────────────────────────────────────────────
   START LEVEL
───────────────────────────────────────────────────────────────── */
function startLevel(levelId) {
  currentLevel = levelId;
  const lvlDef = LEVELS[levelId - 1];
  puzzles = PuzzleGen.generate(levelId, lvlDef.puzzleCount);
  puzzleIndex = 0;
  sessionScore = 0;
  sessionStats = { correct: 0, wrong: 0, totalTime: 0, startTime: Date.now() };
  showScreen('screen-puzzle');
  loadPuzzle();
}

/* ─────────────────────────────────────────────────────────────────
   LOAD PUZZLE
───────────────────────────────────────────────────────────────── */
function loadPuzzle() {
  const p = puzzles[puzzleIndex];
  const lvlDef = LEVELS[currentLevel - 1];
  const total = puzzles.length;

  document.getElementById('puzzle-level-label').textContent =
    `LEVEL ${currentLevel} · ${lvlDef.name} · PUZZLE ${puzzleIndex + 1}/${total}`;
  document.getElementById('puzzle-category').textContent = p.category;

  const qEl = document.getElementById('puzzle-question');
  qEl.textContent = p.question;

  const seqEl = document.getElementById('puzzle-sequence');
  if (p.display) {
    seqEl.style.display = 'flex';
    seqEl.innerHTML = '';
    p.display.forEach(v => {
      const item = document.createElement('div');
      item.className = 'seq-item' + (v === '?' ? ' unknown' : '');
      item.textContent = v;
      seqEl.appendChild(item);
    });
  } else {
    seqEl.style.display = 'none';
  }

  currentAttempts = 0;
  const maxAttempts = 3;
  const dotsEl = document.getElementById('attempts-dots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < maxAttempts; i++) {
    const dot = document.createElement('div');
    dot.className = 'attempt-dot';
    dot.id = `dot-${i}`;
    dotsEl.appendChild(dot);
  }

  const pct = ((puzzleIndex + 1) / total) * 100;
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-text').textContent = `${puzzleIndex + 1}/${total}`;

  const input = document.getElementById('answer-input');
  input.value = '';
  input.className = 'hk-input';
  input.focus();

  startTimer(lvlDef.timeLimit);
}

/* ─────────────────────────────────────────────────────────────────
   TIMER
───────────────────────────────────────────────────────────────── */
function startTimer(seconds) {
  clearTimer();
  timeLeft = seconds;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearTimer();
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  const m  = Math.floor(timeLeft / 60).toString().padStart(2,'0');
  const s  = (timeLeft % 60).toString().padStart(2,'0');
  el.textContent = `${m}:${s}`;
  el.className = 'timer-display';
  if (timeLeft <= 10) el.className += ' danger';
  else if (timeLeft <= 20) el.className += ' warning';
}

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function handleTimeout() {
  showFeedback('TIMEOUT!', false);
  recordAttempt(false, LEVELS[currentLevel-1].timeLimit);
  setTimeout(() => nextPuzzle(false), 1200);
}

/* ─────────────────────────────────────────────────────────────────
   ANSWER HANDLING
───────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('screen-puzzle').classList.contains('active')) {
    submitAnswer();
  }
});

function submitAnswer() {
  const p = puzzles[puzzleIndex];
  const raw = document.getElementById('answer-input').value.trim().toUpperCase();
  const correct = raw === p.answer.toUpperCase();
  const timeUsed = LEVELS[currentLevel-1].timeLimit - timeLeft;

  if (correct) {
    clearTimer();
    const pts = calcPoints(timeLeft, currentAttempts, currentLevel);
    sessionScore += pts;
    sessionStats.correct++;
    sessionStats.totalTime += timeUsed;
    recordAttempt(true, timeUsed);
    showFeedback('ACCESS GRANTED', true);
    document.getElementById('answer-input').classList.add('correct-flash');
    setTimeout(() => nextPuzzle(true), 1000);
  } else {
    currentAttempts++;
    sessionStats.wrong++;
    recordAttempt(false, timeUsed);
    document.getElementById('answer-input').classList.add('shake');
    const dot = document.getElementById(`dot-${currentAttempts - 1}`);
    if (dot) dot.classList.add('wrong');
    setTimeout(() => {
      document.getElementById('answer-input').classList.remove('shake');
      document.getElementById('answer-input').value = '';
    }, 400);

    if (currentAttempts >= 3) {
      clearTimer();
      showFeedback('BLOCKED', false);
      setTimeout(() => nextPuzzle(false), 1200);
    } else {
      toast(`Wrong — ${3 - currentAttempts} attempt(s) left`, 'error');
    }
  }
}

function calcPoints(timeRemaining, attempts, level) {
  const base = level * 100;
  const timeBon = timeRemaining * 5;
  const attPenalty = attempts * 30;
  return Math.max(base + timeBon - attPenalty, level * 20);
}

function nextPuzzle(wasCorrect) {
  puzzleIndex++;
  if (puzzleIndex >= puzzles.length) {
    finishLevel();
  } else {
    loadPuzzle();
  }
}

/* ─────────────────────────────────────────────────────────────────
   FINISH LEVEL
   All DB calls use currentUser (UUID).
───────────────────────────────────────────────────────────────── */
async function finishLevel() {
  clearTimer();
  const total    = puzzles.length;
  const accuracy = Math.round((sessionStats.correct / total) * 100);

  let grade, gradeColor;
  if (accuracy === 100)    { grade = 'S — ELITE BREACH';   gradeColor = '#ffe600'; }
  else if (accuracy >= 80) { grade = 'A — CLEAN HACK';     gradeColor = '#00ff88'; }
  else if (accuracy >= 60) { grade = 'B — PARTIAL BREACH'; gradeColor = '#00e5ff'; }
  else if (accuracy >= 40) { grade = 'C — COMPROMISED';    gradeColor = '#ff9900'; }
  else                     { grade = 'F — SYSTEM HELD';    gradeColor = '#ff3366'; }

  await DB.upsertScore(currentUser, currentLevel, sessionScore);
  const newTotal = await DB.getTotalScore(currentUser);

  const prevBest = currentUserData?.best_level || 0;
  const newBest  = currentLevel >= prevBest ? currentLevel : prevBest;

  await DB.updateUser(currentUser, {
    total_score: newTotal,
    best_level:  newBest
  });

  await refreshCurrentUser();
  
  const allScores = await DB.getScores(currentUser);
  const prev = allScores[currentLevel] || 0;

  document.getElementById('result-score').textContent = sessionScore.toLocaleString();
  document.getElementById('result-grade').textContent = grade;
  document.getElementById('result-grade').style.color = gradeColor;
  document.getElementById('result-stats').innerHTML = `
    <div class="stat-row"><span class="stat-label">LEVEL</span><span class="stat-value">${LEVELS[currentLevel-1].name}</span></div>
    <div class="stat-row"><span class="stat-label">PUZZLES</span><span class="stat-value">${sessionStats.correct}/${total} SOLVED</span></div>
    <div class="stat-row"><span class="stat-label">ACCURACY</span><span class="stat-value">${accuracy}%</span></div>
    <div class="stat-row"><span class="stat-label">SESSION SCORE</span><span class="stat-value">${sessionScore.toLocaleString()} PTS</span></div>
    <div class="stat-row"><span class="stat-label">TOTAL SCORE</span><span class="stat-value">${newTotal.toLocaleString()} PTS</span></div>
    <div class="stat-row"><span class="stat-label">NEW BEST?</span><span class="stat-value">${sessionScore > prev ? '✓ YES' : 'NO'}</span></div>
  `;

  updateStatusBar();
  await renderLevels();
  showScreen('screen-result');
}

function retryLevel() {
  startLevel(currentLevel);
}

/* ─────────────────────────────────────────────────────────────────
   ATTEMPTS LOG
   Passes UUID (currentUser) to DB.insertAttempt.
───────────────────────────────────────────────────────────────── */
function recordAttempt(isCorrect, timeTaken) {
  DB.insertAttempt(
    currentUser,
    currentLevel,
    puzzleIndex,
    isCorrect,
    timeTaken,
    currentAttempts + 1
  ).catch(e => console.error('[recordAttempt]', e));
}

/* ─────────────────────────────────────────────────────────────────
   HINT SYSTEM
───────────────────────────────────────────────────────────────── */
function showHint() {
  const p = puzzles[puzzleIndex];
  let hint = '';

  if (p.type === 'SEQUENCE') {
    hint = 'Look at the difference between numbers 👀';
  } else if (p.type === 'MATH') {
    hint = 'Break it step by step 🧠';
  } else if (p.type === 'LOGIC') {
    hint = 'Think in binary/encoding patterns ⚡';
  } else if (p.type === 'STRING') {
    hint = 'Focus on character transformation 🔐';
  } else {
    hint = 'Pattern is hiding in plain sight 👁';
  }

  toast(hint, 'success');
  sessionScore -= 20;
}
