/* ==========================================================================
   QuizForge -- Landing page
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('landing');

  // --- Populate hero stats + score ring from real seeded data --------
  try {
    const [categoriesRes, quizzesRes] = await Promise.all([
      QuizForgeAPI.getCategories(),
      QuizForgeAPI.getQuizzes({ perPage: 50 }),
    ]);

    const categories = categoriesRes.categories || [];
    const totalQuestions = (quizzesRes.quizzes || []).reduce((sum, q) => sum + q.questionCount, 0);
    // total may be paginated; use the reported total quiz count with a second call if needed
    const totalQuizzes = quizzesRes.total ?? (quizzesRes.quizzes || []).length;

    const statEls = document.querySelectorAll('#hero-stats .hero-stat .num');
    if (statEls[0]) statEls[0].textContent = `${totalQuizzes}+`;
    if (statEls[1]) statEls[1].textContent = `${totalQuestions}+`;
    if (statEls[2]) statEls[2].textContent = `${categories.length}`;

    // Category grid
    const grid = document.getElementById('category-grid');
    if (grid) {
      grid.innerHTML = categories.slice(0, 10).map(cat => `
        <a href="quizzes.html?category=${encodeURIComponent(cat.slug)}" class="card card-hover category-chip">
          <div class="cat-icon">${QFUtils.categoryIcon(cat.icon)}</div>
          <h4>${QFUtils.escapeHtml(cat.name)}</h4>
          <span>${cat.quizCount} quiz${cat.quizCount === 1 ? '' : 'zes'}</span>
        </a>
      `).join('');
    }

    // Animate the hero score ring to a representative "average mastery" figure
    const circumference = 2 * Math.PI * 78;
    const targetPercent = 84; // representative of demo seeded performance data shown in the panel chips
    const fill = document.getElementById('hero-ring-fill');
    const label = document.getElementById('hero-ring-value');
    if (fill && label) {
      requestAnimationFrame(() => {
        fill.style.strokeDasharray = `${circumference}`;
        fill.style.strokeDashoffset = `${circumference * (1 - targetPercent / 100)}`;
      });
      let current = 0;
      const step = () => {
        current += 2;
        if (current > targetPercent) current = targetPercent;
        label.textContent = `${current}%`;
        if (current < targetPercent) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  } catch (err) {
    // Landing page should still be fully usable even if the API is unreachable.
    console.warn('Could not load live stats:', err.message);
  }
})();
