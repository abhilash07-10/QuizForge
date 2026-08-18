/* ==========================================================================
   QuizForge -- Shared navigation + footer
   Injected into every page via a <div id="site-header-root"></div> and
   <div id="site-footer-root"></div>. Adjusts links based on auth state.
   ========================================================================== */

const QuizForgeNav = (() => {
  const LOGO_SVG = `
    <svg class="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="var(--accent-primary)"/>
      <path d="M9 21L14 11L17 17L20 11L23 21" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="14" cy="11" r="1.6" fill="var(--accent-ember)"/>
    </svg>`;

  function iconSvg(name) {
    const icons = {
      sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
      moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
      menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/></svg>',
      logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
      trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3a2 2 0 01-2 4M7 5H4a2 2 0 002 4"/></svg>',
    };
    return icons[name] || '';
  }

  function activeIf(page, current) {
    return page === current ? 'active' : '';
  }

  function renderHeader(currentPage) {
    const root = document.getElementById('site-header-root');
    if (!root) return;

    const loggedIn = QuizForgeAPI.isLoggedIn();
    const user = QuizForgeAPI.getUser();
    const initials = user && user.fullName ? user.fullName.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'QF';

    const publicLinks = `
      <a href="index.html#features" class="${activeIf('landing', currentPage)}">Features</a>
      <a href="quizzes.html" class="${activeIf('quizzes', currentPage)}">Browse Quizzes</a>
      <a href="leaderboard.html" class="${activeIf('leaderboard', currentPage)}">Leaderboard</a>
    `;

    const appLinks = `
      <a href="dashboard.html" class="${activeIf('dashboard', currentPage)}">Dashboard</a>
      <a href="quizzes.html" class="${activeIf('quizzes', currentPage)}">Browse Quizzes</a>
      <a href="analytics.html" class="${activeIf('analytics', currentPage)}">Analytics</a>
      <a href="leaderboard.html" class="${activeIf('leaderboard', currentPage)}">Leaderboard</a>
    `;

    root.innerHTML = `
      <header class="site-header">
        <nav class="nav-bar" aria-label="Main navigation">
          <a href="${loggedIn ? 'dashboard.html' : 'index.html'}" class="brand">
            ${LOGO_SVG}
            QuizForge
          </a>

          <ul class="nav-links">
            ${loggedIn ? appLinks : publicLinks}
          </ul>

          <div class="nav-actions">
            <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle dark mode">
              ${iconSvg('sun')}${iconSvg('moon')}
            </button>

            ${loggedIn ? `
              <div class="nav-user-menu">
                <button class="nav-user-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
                  <span class="nav-avatar">${initials}</span>
                  <span class="user-name-label">${user ? user.fullName.split(' ')[0] : 'Account'}</span>
                </button>
                <div class="nav-dropdown" id="user-dropdown">
                  <a href="profile.html">${iconSvg('user')} Profile</a>
                  <a href="analytics.html">${iconSvg('chart')} Analytics</a>
                  <a href="dashboard.html#achievements">${iconSvg('trophy')} Achievements</a>
                  <hr>
                  <button id="logout-btn">${iconSvg('logout')} Log out</button>
                </div>
              </div>
            ` : `
              <a href="login.html" class="btn btn-secondary btn-sm">Log in</a>
              <a href="register.html" class="btn btn-primary btn-sm">Sign up</a>
            `}

            <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-expanded="false">
              ${iconSvg('menu')}
            </button>
          </div>
        </nav>
      </header>

      <div class="mobile-nav-panel" id="mobile-nav-panel">
        <ul>
          ${loggedIn ? `
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="quizzes.html">Browse Quizzes</a></li>
            <li><a href="analytics.html">Analytics</a></li>
            <li><a href="leaderboard.html">Leaderboard</a></li>
            <li><a href="profile.html">Profile</a></li>
            <div class="divider"></div>
            <li><button id="mobile-logout-btn">Log out</button></li>
          ` : `
            <li><a href="index.html#features">Features</a></li>
            <li><a href="quizzes.html">Browse Quizzes</a></li>
            <li><a href="leaderboard.html">Leaderboard</a></li>
            <div class="divider"></div>
            <li><a href="login.html">Log in</a></li>
            <li><a href="register.html">Sign up</a></li>
          `}
        </ul>
      </div>
    `;

    wireHeaderEvents();
  }

  function wireHeaderEvents() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', () => QuizForgeTheme.toggle());

    const userBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (userBtn && dropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        userBtn.setAttribute('aria-expanded', String(isOpen));
      });
      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
        userBtn.setAttribute('aria-expanded', 'false');
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const doLogout = async () => {
      try { await QuizForgeAPI.logout(); } catch (e) { /* token may already be stale; proceed anyway */ }
      QuizForgeAPI.clearSession();
      window.location.href = 'index.html';
    };
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', doLogout);

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobilePanel = document.getElementById('mobile-nav-panel');
    if (mobileBtn && mobilePanel) {
      mobileBtn.addEventListener('click', () => {
        const isOpen = mobilePanel.classList.toggle('open');
        mobileBtn.setAttribute('aria-expanded', String(isOpen));
        mobileBtn.innerHTML = isOpen ? iconSvg('close') : iconSvg('menu');
      });
    }
  }

  function renderFooter() {
    const root = document.getElementById('site-footer-root');
    if (!root) return;
    root.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a href="index.html" class="brand">${LOGO_SVG} QuizForge</a>
              <p>Challenge your knowledge. Track your progress. A modern practice-quiz and mock-test platform for developers and learners.</p>
            </div>
            <div class="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="quizzes.html">Browse Quizzes</a></li>
                <li><a href="leaderboard.html">Leaderboard</a></li>
                <li><a href="index.html#features">Features</a></li>
                <li><a href="index.html#how-it-works">How it works</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Account</h4>
              <ul>
                <li><a href="login.html">Log in</a></li>
                <li><a href="register.html">Sign up</a></li>
                <li><a href="dashboard.html">Dashboard</a></li>
                <li><a href="profile.html">Profile</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Freelance work</h4>
              <div class="footer-cta">
                <p>Need a custom learning or assessment platform for your team?</p>
                <a class="btn btn-primary btn-sm btn-block" href="mailto:hello@example.com?subject=Custom%20learning%20platform%20inquiry">Contact Us</a>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <span>QuizForge &mdash; Built as a full-stack learning platform.</span>
            <span>&copy; ${new Date().getFullYear()} QuizForge. All rights reserved.</span>
          </div>
        </div>
      </footer>
    `;
  }

  function mount(currentPage) {
    renderHeader(currentPage);
    renderFooter();
  }

  return { mount };
})();
