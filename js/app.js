/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Main Application Entry Point
   Initializes all modules, handles auto-login, and wires up the app.

   MIGRATION CHANGES:
   - Replaced localStorage-based auto-login with Supabase Auth session.
   - Uses supabase.auth.getSession() to check for existing JWT session.
   - Uses supabase.auth.onAuthStateChange() to handle auth state changes.
   - No longer reads/writes localStorage for user credentials.
   - currentUser is now the auth user's UUID.
   ──────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════
   AUTO-LOGIN ON LOAD
   Checks Supabase Auth session and restores user state.
════════════════════════════════════════════════════════════════════ */
window.addEventListener("load", async () => {
  /* Listen for auth state changes (login, logout, token refresh) */
  _sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user.id;
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentUserData = null;
    }
  });

  /* Check for existing session on page load */
  const { data: { session } } = await _sb.auth.getSession();

  if (session && session.user) {
    currentUser = session.user.id;
    currentUserData = await DB.getUser(currentUser);

    if (currentUserData) {
      document.getElementById('status-bar').classList.add('visible');
      document.getElementById('top-nav').classList.add('visible');

      await renderLevels();
      showScreen('screen-levels');
    }
  }
});
