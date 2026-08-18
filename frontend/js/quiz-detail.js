/* ==========================================================================
   QuizForge -- Quiz detail / instructions page
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('quizzes');

  const params = new URLSearchParams(window.location.search);
  const quizId = params.get('id');
  const content = document.getElementById('detail-content');

  if (!quizId) {
    content.innerHTML = notFoundHTML();
    return;
  }

  try {
    const { quiz } = await QuizForgeAPI.getQuiz(quizId);
    render(quiz);
  } catch (err) {
    content.innerHTML = notFoundHTML();
  }

  function render(quiz) {
    content.innerHTML = `
      <div class="detail-top">
        <div class="detail-icon">${QFUtils.categoryIcon('structure')}</div>
        <div>
          <div class="quiz-cat">${QFUtils.escapeHtml(quiz.category)}</div>
          <h1 class="page-title" style="margin-bottom:4px;">${QFUtils.escapeHtml(quiz.title)}</h1>
          <span class="badge ${QFUtils.difficultyBadgeClass(quiz.difficulty)}">${quiz.difficulty}</span>
        </div>
      </div>

      <div class="card card-padded">
        <p style="margin-bottom: 0;">${QFUtils.escapeHtml(quiz.description)}</p>

        <div class="detail-meta-row">
          <div class="detail-meta-item"><span class="lbl">Questions</span><span class="val">${quiz.questionCount}</span></div>
          <div class="detail-meta-item"><span class="lbl">Duration</span><span class="val">${quiz.durationMinutes} min</span></div>
          <div class="detail-meta-item"><span class="lbl">Attempts</span><span class="val">${quiz.attempts}</span></div>
          <div class="detail-meta-item"><span class="lbl">Scoring</span><span class="val">+1 / correct</span></div>
        </div>

        <h3 style="font-size: var(--fs-md);">Rules</h3>
        <ul class="rules-list">
          ${quiz.rules.map(r => `<li>${QFIcons.checkCircle}<span>${QFUtils.escapeHtml(r)}</span></li>`).join('')}
        </ul>

        <button class="btn btn-primary btn-lg btn-block" id="start-quiz-btn" style="margin-top: var(--space-4);">
          Start Quiz
        </button>
      </div>
    `;

    document.getElementById('start-quiz-btn').addEventListener('click', async () => {
      if (!QuizForgeAPI.isLoggedIn()) {
        window.location.href = `login.html?next=${encodeURIComponent('quiz-detail.html?id=' + quiz.id)}`;
        return;
      }
      const btn = document.getElementById('start-quiz-btn');
      btn.disabled = true;
      btn.textContent = 'Starting…';
      try {
        const { attemptId } = await QuizForgeAPI.startAttempt(quiz.id);
        window.location.href = `quiz.html?attempt=${attemptId}`;
      } catch (err) {
        QuizForgeToast.error(err.message || 'Could not start the quiz.', 'Something went wrong');
        btn.disabled = false;
        btn.textContent = 'Start Quiz';
      }
    });
  }

  function notFoundHTML() {
    return `
      <div class="state-block">
        ${QFIcons.alertTriangle}
        <h3>Quiz not found</h3>
        <p style="margin:0;">This quiz may have been removed or the link is incorrect.</p>
        <a href="quizzes.html" class="btn btn-primary btn-sm">Browse Quizzes</a>
      </div>
    `;
  }
})();
