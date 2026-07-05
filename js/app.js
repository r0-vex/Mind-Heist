/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Main Application Entry Point
   Initializes all modules, handles auto-login, and wires up the app.
   ──────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════
   AUTO-LOGIN ON LOAD
   Checks localStorage for saved session and restores user state.
════════════════════════════════════════════════════════════════════ */
window.addEventListener("load", async () => {
  const savedUser = localStorage.getItem("mh_user");
  if (savedUser) {
    currentUser = savedUser;
    currentUserData = await DB.getUser(savedUser);

    if (currentUserData) {
      document.getElementById('status-bar').classList.add('visible');
      document.getElementById('top-nav').classList.add('visible');

      await renderLevels();
      showScreen('screen-levels');
    }
  }
});
