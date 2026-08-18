/* ==========================================================================
   QuizForge -- Analytics page
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('analytics');
  const user = await QuizForgeAuthGuard.require();
  if (!user) return;

  const CHART_COLORS = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim() || '#3454D1',
    primaryLight: getComputedStyle(document.documentElement).getPropertyValue('--color-primary-200').trim() || '#B4C1F5',
    ember: getComputedStyle(document.documentElement).getPropertyValue('--color-ember-500').trim() || '#FF8A3D',
    success: getComputedStyle(document.documentElement).getPropertyValue('--color-success-500').trim() || '#1FAA6D',
    danger: getComputedStyle(document.documentElement).getPropertyValue('--color-danger-500').trim() || '#E5484D',
    warning: getComputedStyle(document.documentElement).getPropertyValue('--color-warning-500').trim() || '#F5A623',
    grid: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#E9EBF1',
    text: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5B6478',
  };
  const chartsAvailable = typeof Chart !== 'undefined';
  if (chartsAvailable) {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = CHART_COLORS.text;
  }

  try {
    const progress = await QuizForgeAPI.getProgress();
    renderStats(progress);
    renderScoreChart(progress.scoreOverTime);
    renderActivityChart(progress.weeklyActivity);
    renderCategoryChart(progress.categoryPerformance);
    renderCorrectChart(progress.correctVsIncorrect);
  } catch (err) {
    QuizForgeToast.error(err.message || 'Could not load analytics.', 'Something went wrong');
  }

  function renderStats(p) {
    document.getElementById('analytics-stats').innerHTML = `
      <div class="card stat-card"><span class="stat-label">Total Quizzes</span><span class="stat-value">${p.totalQuizzes}</span></div>
      <div class="card stat-card"><span class="stat-label">Average Score</span><span class="stat-value">${p.averageScore}%</span></div>
      <div class="card stat-card"><span class="stat-label">Best Score</span><span class="stat-value">${p.bestScore}%</span></div>
      <div class="card stat-card"><span class="stat-label">Accuracy</span><span class="stat-value">${p.accuracy}%</span></div>
      <div class="card stat-card"><span class="stat-label">Questions Answered</span><span class="stat-value">${p.totalQuestionsAnswered}</span></div>
      <div class="card stat-card"><span class="stat-label">Current Streak</span><span class="stat-value">${p.currentStreak} days</span></div>
      <div class="card stat-card"><span class="stat-label">Longest Streak</span><span class="stat-value">${p.longestStreak} days</span></div>
    `;
    // Trim to 4 visible in the first row via CSS grid auto-flow (it wraps naturally on smaller screens)
  }

  function emptyChart(canvas, message) {
    canvas.closest('.chart-canvas-wrap').innerHTML = `
      <div class="state-block" style="padding: var(--space-8);">
        ${QFIcons.inbox}
        <p style="margin:0;">${message}</p>
      </div>
    `;
  }

  function renderScoreChart(data) {
    const canvas = document.getElementById('score-chart');
    if (!chartsAvailable) return emptyChart(canvas, 'Chart library unavailable.');
    if (!data || data.length === 0) return emptyChart(canvas, 'Complete a quiz to see your score trend.');
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(p => p.label),
        datasets: [{ label: 'Score %', data: data.map(p => p.score), borderColor: CHART_COLORS.primary, backgroundColor: CHART_COLORS.primaryLight, fill: true, tension: 0.35, pointRadius: 3 }],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, grid: { color: CHART_COLORS.grid } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } },
    });
  }

  function renderActivityChart(data) {
    const canvas = document.getElementById('activity-chart');
    if (!chartsAvailable) return emptyChart(canvas, 'Chart library unavailable.');
    new Chart(canvas, {
      type: 'bar',
      data: { labels: (data || []).map(d => d.day), datasets: [{ label: 'Quizzes', data: (data || []).map(d => d.count), backgroundColor: CHART_COLORS.ember, borderRadius: 6, maxBarThickness: 30 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: CHART_COLORS.grid } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } },
    });
  }

  function renderCategoryChart(data) {
    const canvas = document.getElementById('category-chart');
    if (!chartsAvailable) return emptyChart(canvas, 'Chart library unavailable.');
    if (!data || data.length === 0) return emptyChart(canvas, 'Complete quizzes across categories to see this chart.');
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(c => c.category),
        datasets: [{ label: 'Accuracy %', data: data.map(c => c.accuracyPercent), backgroundColor: CHART_COLORS.primary, borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        scales: { x: { min: 0, max: 100, grid: { color: CHART_COLORS.grid } }, y: { grid: { display: false } } },
        plugins: { legend: { display: false } },
      },
    });
  }

  function renderCorrectChart(data) {
    const canvas = document.getElementById('correct-chart');
    if (!chartsAvailable) return emptyChart(canvas, 'Chart library unavailable.');
    if (!data || (data.correct + data.incorrect + data.skipped) === 0) return emptyChart(canvas, 'No answered questions yet.');
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Correct', 'Incorrect', 'Skipped'],
        datasets: [{ data: [data.correct, data.incorrect, data.skipped], backgroundColor: [CHART_COLORS.success, CHART_COLORS.danger, CHART_COLORS.warning], borderWidth: 0 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });
  }
})();
