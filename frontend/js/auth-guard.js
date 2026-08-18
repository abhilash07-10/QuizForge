/* ==========================================================================
   QuizForge -- Auth guard
   Include on any protected page BEFORE other page scripts run.
   Redirects to login if there's no token, and pre-fetches /auth/me to
   confirm the token is still valid (catches expired/stale tokens).
   ========================================================================== */

const QuizForgeAuthGuard = {
  async require() {
    if (!QuizForgeAPI.isLoggedIn()) {
      window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
      return null;
    }
    try {
      const { user } = await QuizForgeAPI.me();
      QuizForgeAPI.setSession(QuizForgeAPI.getToken(), user);
      return user;
    } catch (err) {
      QuizForgeAPI.clearSession();
      window.location.href = 'login.html';
      return null;
    }
  },
};
