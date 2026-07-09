/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Authentication & Session Management
   Login, register, logout, session persistence, and user state updates.

   MIGRATION CHANGES:
   - Replaced custom username/password auth with Supabase Auth.
   - register() now calls supabase.auth.signUp() then DB.createProfile().
   - login() now calls supabase.auth.signInWithPassword().
   - logout() now calls supabase.auth.signOut().
   - Session restored via supabase.auth.getSession() and onAuthStateChange.
   - currentUser is now the UUID (auth user id), not username.
   - currentUserData is the profile row from the users table.
   - updateStatusBar displays username from profile, not currentUser UUID.
   - refreshCurrentUser fetches profile by UUID, not username.
   - Removed all password storage, password queries, and pass field handling.
   - localStorage no longer stores raw username; session is JWT-based.
   ──────────────────────────────────────────────────────────────── */

/* Current authenticated user's UUID (from supabase.auth) */
let currentUser = null;

/* Current user's profile row from the users table */
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
   Uses supabase.auth.signUp() + DB.createProfile().
   Does NOT store passwords in the users table.
───────────────────────────────────────────────────────────────── */
async function register() {
  const username = document.getElementById('reg-user').value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass     = document.getElementById('reg-pass').value.trim();
  if (!username || !email || !pass) { toast('Fill in all fields', 'error'); return; }
  if (username.length < 3) { toast('Username must be 3+ characters', 'error'); return; }

  /* Check username uniqueness in profiles table */
  const taken = await DB.usernameExists(username);
  if (taken) { toast('Callsign already taken', 'error'); return; }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    toast("Enter a valid email address", "error");
    return;
  }

  /* Sign up with Supabase Auth */
  const { data: authData, error: authError } = await _sb.auth.signUp({
    email,
    password: pass
  });

  if (authError) {
    toast(authError.message || 'Registration failed — try again', 'error');
    return;
  }

  if (!authData.user) {
    toast('Registration failed — no user returned', 'error');
    return;
  }

  /* Create profile row linked to auth.users(id) */
  const profileOk = await DB.createProfile(authData.user.id, username);
  if (!profileOk) {
    toast('Profile creation failed — contact support', 'error');
    return;
  }

  // Auto-fill login email
  document.getElementById("login-email").value = email;
  // Clear password field
  document.getElementById("login-pass").value = "";

  //clear registration form
  document.getElementById("reg-user").value = "";
  document.getElementById("reg-email").value = "";
  document.getElementById("reg-pass").value = "";
  
  toast('Agent created! Log in now.', 'success');
  showLogin();
}

/* ─────────────────────────────────────────────────────────────────
   LOGIN
   Uses supabase.auth.signInWithPassword().
   Does NOT query or compare passwords from the users table.
───────────────────────────────────────────────────────────────── */
async function login() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value.trim();

  if (!email || !pass) {
    toast('Enter credentials', 'error');
    return;
  }

  const { data: authData, error: authError } =
  await _sb.auth.signInWithPassword({
    email,
    password: pass
});

  if (authError || !authData.user) {
    toast('Access denied — invalid credentials', 'error');
    return;
  }

  /* Store UUID as currentUser */
  currentUser = authData.user.id;

  /* Fetch profile row */
  currentUserData = await DB.getUser(currentUser);
  if (!currentUserData) {
    toast('Profile not found — contact support', 'error');
    return;
  }

  updateStatusBar();
  document.getElementById('status-bar').classList.add('visible');
  document.getElementById('top-nav').classList.add('visible');
  await renderLevels();
  showScreen('screen-levels');
}

/* ─────────────────────────────────────────────────────────────────
   LOGOUT
   Uses supabase.auth.signOut().
   Clears all local session state.
───────────────────────────────────────────────────────────────── */
async function logout() {
  await _sb.auth.signOut();
  currentUser = null;
  currentUserData = null;
  clearTimer();
  document.getElementById('status-bar').classList.remove('visible');
  document.getElementById('top-nav').classList.remove('visible');
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  showScreen('screen-login');
}

/* ─────────────────────────────────────────────────────────────────
   STATUS BAR
   Displays username from profile (currentUserData.username),
   not the raw UUID (currentUser).
───────────────────────────────────────────────────────────────── */
function updateStatusBar() {
  if (!currentUser || !currentUserData) return;
  const u = currentUserData;
  document.getElementById('sb-user').textContent  = (u.username || 'UNKNOWN').toUpperCase();
  document.getElementById('sb-score').textContent = (u.total_score || 0).toLocaleString();
  document.getElementById('sb-clan').textContent = (window._clanNameCache || 'NONE').toUpperCase();

  const now = new Date();
  document.getElementById('sb-time').textContent =
    `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
}
setInterval(updateStatusBar, 1000);

/* ─────────────────────────────────────────────────────────────────
   REFRESH CURRENT USER
   Fetches profile by UUID (currentUser), not username.
   Updates clan name cache from profile.clan code.
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
