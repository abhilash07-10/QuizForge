/* ==========================================================================
   QuizForge -- Dashboard
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('dashboard');
  const user = await QuizForgeAuthGuard.require();
  if (!user) return;

  const firstName = user.fullName.split(' ')[0];
  document.querySelector('#welcome-header .page-title').textContent = `Welcome back, ${firstName}`;

  const CHART_COLORS = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim() || '#3454D1',
    primaryLight: getComputedStyle(document.documentElement).getPropertyValue('--color-primary-200').trim() || '#B4C1F5',
    ember: getComputedStyle(document.documentElement).getPropertyValue('--color-ember-500').trim() || '#FF8A3D',
    grid: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#E9EBF1',
    text: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5B6478',
  };

  const chartsAvailable = typeof Chart !== 'undefined';
  if (chartsAvailable) {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = CHART_COLORS.text;
  }

  try {
    const [progress, results, quizzesRes, achievementsRes] = await Promise.all([
      QuizForgeAPI.getProgress(),
      QuizForgeAPI.getResults(5),
      QuizForgeAPI.getQuizzes({ sort: 'popular', perPage: 3 }),
      QuizForgeAPI.getAchievements(),
    ]);

    renderStatCards(progress);
    renderScoreChart(progress.scoreOverTime);
    renderActivityChart(progress.weeklyActivity);
    renderRecommended(quizzesRes.quizzes);
    renderRecentResults(results.results);
    renderCategoryPerformance(progress.categoryPerformance);
    renderAchievementsMini(achievementsRes.achievements);
  } catch (err) {
    QuizForgeToast.error(err.message || 'Could not load your dashboard.', 'Something went wrong');
  }

  function renderStatCards(progress) {
    const el = document.getElementById('stat-cards');
    el.innerHTML = `
      <div class="card stat-card">
        <span class="stat-label">Quizzes Completed</span>
        <span class="stat-value">${progress.totalQuizzes}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Average Score</span>
        <span class="stat-value">${progress.averageScore}%</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Best Score</span>
        <span class="stat-value">${progress.bestScore}%</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Current Streak</span>
        <span class="stat-value">${progress.currentStreak} ${QFIcons.flame}</span>
      </div>
    `;
  }

  function renderScoreChart(scoreOverTime) {
    const ctx = document.getElementById('score-chart');
    if (!chartsAvailable) { ctx.closest('.chart-canvas-wrap').innerHTML = emptyStateHTML('Chart library unavailable', 'Could not load the charting library.'); return; }
    if (!scoreOverTime || scoreOverTime.length === 0) {
      ctx.closest('.chart-canvas-wrap').innerHTML = emptyStateHTML('No attempts yet', 'Complete a quiz to see your score trend here.');
      return;
    }
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: scoreOverTime.map(p => p.label),
        datasets: [{
          label: 'Score %',
          data: scoreOverTime.map(p => p.score),
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primaryLight,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: CHART_COLORS.primary,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, grid: { color: CHART_COLORS.grid }, ticks: { callback: v => v + '%' } },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  function renderActivityChart(weeklyActivity) {
    const ctx = document.getElementById('activity-chart');
    if (!chartsAvailable) { ctx.closest('.chart-canvas-wrap').innerHTML = emptyStateHTML('Chart library unavailable', 'Could not load the charting library.'); return; }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: (weeklyActivity || []).map(d => d.day),
        datasets: [{
          label: 'Quizzes',
          data: (weeklyActivity || []).map(d => d.count),
          backgroundColor: CHART_COLORS.ember,
          borderRadius: 6,
          maxBarThickness: 28,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: CHART_COLORS.grid } },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  function renderRecommended(quizzes) {
    const grid = document.getElementById('recommended-grid');
    if (!quizzes || quizzes.length === 0) {
      grid.innerHTML = emptyStateHTML('No quizzes available yet', 'Check back soon.');
      return;
    }
    grid.innerHTML = quizzes.map(quizCardHTML).join('');
  }

  function renderRecentResults(results) {
    const card = document.getElementById('recent-results-card');
    if (!results || results.length === 0) {
      card.innerHTML = emptyStateHTML('No results yet', 'Your completed quiz results will show up here.', 'quizzes.html', 'Browse Quizzes');
      return;
    }
    card.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Quiz</th><th>Score</th><th>Date</th><th></th></tr></thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td>${QFUtils.escapeHtml(r.quizTitle)}<br><span class="text-muted text-sm">${QFUtils.escapeHtml(r.category)}</span></td>
              <td><span class="badge ${r.scorePercent >= 70 ? 'badge-beginner' : r.scorePercent >= 40 ? 'badge-intermediate' : 'badge-advanced'}">${r.scorePercent}%</span></td>
              <td class="text-sm text-muted">${QFUtils.formatDate(r.completedAt)}</td>
              <td><a href="results.html?attempt=${r.id}" class="btn btn-ghost btn-sm">Review</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderCategoryPerformance(categoryPerformance) {
    const card = document.getElementById('category-performance-card');
    if (!categoryPerformance || categoryPerformance.length === 0) {
      card.innerHTML = `<p class="text-muted text-sm" style="margin:0;">Complete quizzes in different categories to see your strengths here.</p>`;
      return;
    }
    card.innerHTML = categoryPerformance.map(cp => `
      <div style="margin-bottom: var(--space-4);">
        <div class="flex justify-between text-sm" style="margin-bottom: 6px;">
          <span>${QFUtils.escapeHtml(cp.category)}</span>
          <span class="text-muted">${cp.accuracyPercent}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${cp.accuracyPercent}%"></div></div>
      </div>
    `).join('');
  }

  function renderAchievementsMini(achievements) {
    const grid = document.getElementById('achievements-mini-grid');
    const unlocked = achievements.filter(a => a.unlocked).slice(0, 3);
    const toShow = unlocked.length > 0 ? unlocked : achievements.slice(0, 3);
    grid.innerHTML = toShow.map(a => `
      <div class="card achievement-card ${a.unlocked ? '' : 'locked'}" title="${QFUtils.escapeHtml(a.description)}">
        <div class="achievement-icon">${QFIcons[iconKeyFor(a.icon)] || QFIcons.award}</div>
        <h4>${QFUtils.escapeHtml(a.title)}</h4>
      </div>
    `).join('');
  }

  function iconKeyFor(icon) {
    const map = { flag: 'flag', star: 'star', target: 'target', 'check-circle': 'checkCircle', layers: 'layers', flame: 'flame', zap: 'zap', award: 'award' };
    return map[icon] || 'award';
  }

  function quizCardHTML(quiz) {
    return `
      <a href="quiz-detail.html?id=${quiz.id}" class="card card-hover quiz-card">
        <div class="quiz-card-top">
          <div class="quiz-card-icon">${QFUtils.categoryIcon('structure')}</div>
          <span class="badge ${QFUtils.difficultyBadgeClass(quiz.difficulty)}">${quiz.difficulty}</span>
        </div>
        <div class="quiz-cat">${QFUtils.escapeHtml(quiz.category)}</div>
        <h3>${QFUtils.escapeHtml(quiz.title)}</h3>
        <p class="quiz-desc">${QFUtils.escapeHtml(quiz.description || '')}</p>
        <div class="quiz-meta">
          <span>${QFIcons.helpCircle} ${quiz.questionCount} questions</span>
          <span>${QFIcons.clock} ${quiz.durationMinutes} min</span>
        </div>
      </a>
    `;
  }

  function emptyStateHTML(title, message, href, cta) {
    return `
      <div class="state-block">
        ${QFIcons.inbox}
        <h3>${title}</h3>
        <p style="margin:0;">${message}</p>
        ${href ? `<a href="${href}" class="btn btn-primary btn-sm">${cta}</a>` : ''}
      </div>
    `;
  }
})();
