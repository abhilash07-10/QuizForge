/* ==========================================================================
   QuizForge -- Quiz catalog page
   ========================================================================== */

(function () {
  QuizForgeNav.mount('quizzes');

  const grid = document.getElementById('quiz-grid');
  const resultsCount = document.getElementById('results-count');
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  const difficultySelect = document.getElementById('difficulty-select');
  const durationSelect = document.getElementById('duration-select');
  const sortSelect = document.getElementById('sort-select');

  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) categorySelect.dataset.pending = params.get('category');
  if (params.get('search')) searchInput.value = params.get('search');

  async function loadCategories() {
    try {
      const { categories } = await QuizForgeAPI.getCategories();
      categorySelect.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(c => `<option value="${c.slug}">${QFUtils.escapeHtml(c.name)}</option>`).join('');
      if (categorySelect.dataset.pending) {
        categorySelect.value = categorySelect.dataset.pending;
      }
    } catch (err) {
      console.warn('Could not load categories', err.message);
    }
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
          <span>${QFIcons.users} ${quiz.attempts} attempts</span>
        </div>
      </a>
    `;
  }

  async function loadQuizzes() {
    grid.innerHTML = Array(6).fill('<div class="card skeleton skeleton-card"></div>').join('');
    resultsCount.textContent = '';

    try {
      const { quizzes, total } = await QuizForgeAPI.getQuizzes({
        search: searchInput.value.trim(),
        category: categorySelect.value,
        difficulty: difficultySelect.value,
        duration: durationSelect.value,
        sort: sortSelect.value,
        perPage: 24,
      });

      if (!quizzes || quizzes.length === 0) {
        grid.innerHTML = `
          <div class="state-block" style="grid-column: 1 / -1;">
            ${QFIcons.search}
            <h3>No quizzes found</h3>
            <p style="margin:0;">Try a different search term or clear your filters.</p>
          </div>
        `;
        resultsCount.textContent = '';
        return;
      }

      resultsCount.textContent = `${total} quiz${total === 1 ? '' : 'zes'} found`;
      grid.innerHTML = quizzes.map(quizCardHTML).join('');
    } catch (err) {
      grid.innerHTML = `
        <div class="state-block" style="grid-column: 1 / -1;">
          ${QFIcons.wifiOff}
          <h3>Couldn't load quizzes</h3>
          <p style="margin:0;">${QFUtils.escapeHtml(err.message || 'Please try again.')}</p>
          <button class="btn btn-primary btn-sm" id="retry-btn">Retry</button>
        </div>
      `;
      document.getElementById('retry-btn').addEventListener('click', loadQuizzes);
    }
  }

  const debouncedLoad = QFUtils.debounce(loadQuizzes, 350);
  searchInput.addEventListener('input', debouncedLoad);
  [categorySelect, difficultySelect, durationSelect, sortSelect].forEach(el =>
    el.addEventListener('change', loadQuizzes)
  );

  loadCategories().then(loadQuizzes);
})();
