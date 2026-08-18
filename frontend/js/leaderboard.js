/* ==========================================================================
   QuizForge -- Leaderboard page
   ========================================================================== */

(function () {
  QuizForgeNav.mount('leaderboard');

  const card = document.getElementById('leaderboard-card');
  const tabs = document.querySelectorAll('#period-tabs .tab-btn');
  const currentUser = QuizForgeAPI.getUser();

  async function load(period) {
    card.innerHTML = `<div style="padding: var(--space-6);"><div class="skeleton skeleton-line" style="width:100%;"></div><div class="skeleton skeleton-line" style="width:90%;"></div><div class="skeleton skeleton-line" style="width:95%;"></div></div>`;
    try {
      const { leaderboard } = await QuizForgeAPI.getLeaderboard(period);
      if (!leaderboard || leaderboard.length === 0) {
        card.innerHTML = `
          <div class="state-block">
            ${QFIcons.users}
            <h3>No results yet for this period</h3>
            <p style="margin:0;">Be the first to complete a quiz and claim the top spot.</p>
            <a href="quizzes.html" class="btn btn-primary btn-sm">Browse Quizzes</a>
          </div>
        `;
        return;
      }

      card.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Rank</th><th>Name</th><th>XP</th><th>Quizzes</th><th>Avg. Score</th></tr></thead>
          <tbody>
            ${leaderboard.map(row => `
              <tr class="${currentUser && row.name === currentUser.fullName ? 'is-me' : ''}">
                <td>${rankBadge(row.rank)}</td>
                <td>${QFUtils.escapeHtml(row.name)}</td>
                <td><strong>${row.xp}</strong> XP</td>
                <td>${row.quizzesCompleted}</td>
                <td>${row.averageScore}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      card.innerHTML = `
        <div class="state-block">
          ${QFIcons.wifiOff}
          <h3>Couldn't load the leaderboard</h3>
          <p style="margin:0;">${QFUtils.escapeHtml(err.message || 'Please try again.')}</p>
        </div>
      `;
    }
  }

  function rankBadge(rank) {
    if (rank === 1) return `<span class="rank-badge gold">1</span>`;
    if (rank === 2) return `<span class="rank-badge silver">2</span>`;
    if (rank === 3) return `<span class="rank-badge bronze">3</span>`;
    return `<span class="text-muted">#${rank}</span>`;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      load(tab.dataset.period);
    });
  });

  load('weekly');
})();
