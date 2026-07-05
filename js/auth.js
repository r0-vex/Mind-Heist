/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Authentication & Session Management
   Login, register, logout, session persistence, and user state updates.
   ──────────────────────────────────────────────────────────────── */

let currentUser = null;
let currentUserData = null;

/* ─────────────────────────────────────────────────────────────────
   AUTH VIEWS
───────────────────────────────────────────────────────────────── */
function showRegister() {
  document.getElementById('panel-login').style.display    = 'none';
  document.getElementById('panel-register').style.display = 'block';
}

function showLogin() {
  document.getElementById('panel-register').style.display = 'none';
  document.getElementById('panel-login').style.display    = 'block';
}

/* ─────────────────────────────────────────────────────────────────
   REGISTRATION
───────────────────────────────────────────────────────────────── */
async function register() {
  const user = document.getElementById('reg-user').value.trim();
  const pass = document.getElementById('reg-pass').value.trim();
  if (!user || !pass) { toast('Fill in all fields', 'error'); return; }
  if (user.length < 3) { toast('Username must be 3+ characters', 'error'); return; }

  const existing = await DB.getUser(user);
  if (existing) { toast('Callsign already taken', 'error'); return; }

  const ok = await DB.createUser(user, pass);
  if (!ok) { toast('Registration failed — try again', 'error'); return; }

  toast('Agent created! Log in now.', 'success');
  showLogin();
}

/* ─────────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────────── */
async function login() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  if (!user || !pass) { toast('Enter credentials', 'error'); return; }

  const userData = await DB.getUser(user);
  if (!userData || userData.pass !== pass) {
    toast('Access denied — invalid credentials', 'error');
    return;
  }
  localStorage.setItem("mh_user", user);
  currentUser     = user;
  currentUserData = userData;

  updateStatusBar();
  document.getElementById('status-bar').classList.add('visible');
  document.getElementById('top-nav').classList.add('visible');
  await renderLevels();
  showScreen('screen-levels');
}

/* ─────────────────────────────────────────────────────────────────
   LOGOUT
───────────────────────────────────────────────────────────────── */
function logout() {
  currentUser = null;
  localStorage.removeItem("mh_user");
  clearTimer();
  document.getElementById('status-bar').classList.remove('visible');
  document.getElementById('top-nav').classList.remove('visible');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  showScreen('screen-login');
}

/* ─────────────────────────────────────────────────────────────────
   STATUS BAR
───────────────────────────────────────────────────────────────── */
function updateStatusBar() {
  if (!currentUser || !currentUserData) return;
  const u = currentUserData;
  document.getElementById('sb-user').textContent  = currentUser.toUpperCase();
  document.getElementById('sb-score').textContent = (u.total_score || 0).toLocaleString();
  document.getElementById('sb-clan').textContent = (window._clanNameCache || 'NONE').toUpperCase();

  const now = new Date();
  document.getElementById('sb-time').textContent =
    `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
}
setInterval(updateStatusBar, 1000);

/* ─────────────────────────────────────────────────────────────────
   REFRESH CURRENT USER
───────────────────────────────────────────────────────────────── */
async function refreshCurrentUser() {
  if (!currentUser) return;
  currentUserData = await DB.getUser(currentUser);
  if (currentUserData?.clan) {
    const clan = await DB.getClan(currentUserData.clan);
    window._clanNameCache = clan ? clan.name : 'NONE';
  } else {
    window._clanNameCache = 'NONE';
  }
  updateStatusBar();
}
