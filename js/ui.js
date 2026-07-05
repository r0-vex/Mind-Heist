/* ────────────────────────────────────────────────────────────────
   MIND HEIST — UI Utilities
   Screen switching, notifications, visual effects, and reusable helpers.
   ──────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────
   MATRIX RAIN ANIMATION
───────────────────────────────────────────────────────────────── */
(function initMatrix() {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01001110101ABCDEF><{}[]';
  let cols, drops;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / 16);
    drops = Array(cols).fill(1);
  }

  function draw() {
    ctx.fillStyle = 'rgba(1,13,7,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px Share Tech Mono';
    for (let i = 0; i < cols; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const x = i * 16;
      const y = drops[i] * 16;
      ctx.fillStyle = Math.random() > 0.95 ? '#fff' : '#00ff88';
      ctx.globalAlpha = Math.random() * 0.5 + 0.1;
      ctx.fillText(ch, x, y);
      ctx.globalAlpha = 1;
      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 50);
})();

/* ─────────────────────────────────────────────────────────────────
   SCREEN MANAGEMENT
───────────────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ─────────────────────────────────────────────────────────────────
   FEEDBACK OVERLAY
───────────────────────────────────────────────────────────────── */
function showFeedback(text, isCorrect) {
  const overlay = document.getElementById('feedback-overlay');
  const el = document.getElementById('feedback-text');
  el.textContent = text;
  el.className = 'feedback-text ' + (isCorrect ? 'correct' : 'wrong');
  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 700);
}

/* ─────────────────────────────────────────────────────────────────
   TOAST / NOTIFICATION
───────────────────────────────────────────────────────────────── */
let toastTimeout;
function toast(msg, type) {
  type = type || 'success';
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ─────────────────────────────────────────────────────────────────
   PASSWORD TOGGLE HELPERS
───────────────────────────────────────────────────────────────── */
function togglePassword() {
  const input = document.getElementById('login-pass');
  const btn = document.getElementById('toggle-login-pass');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function RegtogglePassword() {
  const input = document.getElementById('reg-pass');
  const btn = document.getElementById('toggle-reg-pass');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

/* ─────────────────────────────────────────────────────────────────
   EXIT CONFIRMATION
───────────────────────────────────────────────────────────────── */
function confirmExit() {
  if (confirm("Are you sure you want to exit?")) {
    logout();
  }
}
