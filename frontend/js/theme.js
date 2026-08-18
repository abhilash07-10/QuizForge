/* ==========================================================================
   QuizForge -- Theme (light/dark) management
   ========================================================================== */

const QuizForgeTheme = (() => {
  const KEY = 'quizforge_theme';

  function getPreferred() {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferred();
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(getPreferred());
  }

  return { init, apply, toggle, getPreferred };
})();

// Apply theme as early as possible to avoid a flash of the wrong theme.
QuizForgeTheme.init();
