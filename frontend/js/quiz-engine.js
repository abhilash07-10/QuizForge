/* ==========================================================================
   QuizForge -- Quiz-taking engine
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('quizzes');
  const user = await QuizForgeAuthGuard.require();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get('attempt');

  if (!attemptId) {
    document.getElementById('quiz-body').innerHTML = `
      <div class="state-block" style="grid-column: 1 / -1;">
        ${QFIcons.alertTriangle}
        <h3>No active attempt found</h3>
        <p style="margin:0;">Please start a quiz from the catalog.</p>
        <a href="quizzes.html" class="btn btn-primary btn-sm">Browse Quizzes</a>
      </div>
    `;
    return;
  }

  // --- State -----------------------------------------------------
  let questions = [];
  let quizMeta = null;
  let currentIndex = 0;
  const answers = {};       // questionId -> 'A'|'B'|'C'|'D'
  const marked = new Set(); // questionId set
  let remainingSeconds = 0;
  let timerHandle = null;
  let startedAt = Date.now();
  let submitted = false;

  const el = {
    title: document.getElementById('quiz-title'),
    qCount: document.getElementById('q-count'),
    timer: document.getElementById('quiz-timer'),
    progressFill: document.getElementById('quiz-progress-fill'),
    questionCard: document.getElementById('question-card'),
    navGrid: document.getElementById('question-nav-grid'),
    sumAnswered: document.getElementById('sum-answered'),
    sumUnanswered: document.getElementById('sum-unanswered'),
    sumMarked: document.getElementById('sum-marked'),
    submitBtn: document.getElementById('submit-quiz-btn'),
  };

  // Warn on accidental tab close / refresh mid-quiz.
  window.addEventListener('beforeunload', (e) => {
    if (!submitted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  try {
    // Find the quiz id from the attempt itself so a stale/incorrect
    // attempt id can't be used to pull arbitrary question sets.
    const attemptRes = await QuizForgeAPI.getAttempt(attemptId);
    if (attemptRes.attempt.status === 'completed') {
      window.location.href = `results.html?attempt=${attemptId}`;
      return;
    }
    const quizId = attemptRes.attempt.quizId;

    const data = await QuizForgeAPI.getQuizQuestions(quizId);
    questions = data.questions;
    quizMeta = data;
    remainingSeconds = data.durationMinutes * 60;

    el.title.textContent = data.title;
    el.qCount.textContent = `${questions.length} questions`;

    renderNavigator();
    renderQuestion();
    startTimer();
  } catch (err) {
    document.getElementById('quiz-body').innerHTML = `
      <div class="state-block" style="grid-column: 1 / -1;">
        ${QFIcons.wifiOff}
        <h3>Couldn't load this quiz</h3>
        <p style="margin:0;">${QFUtils.escapeHtml(err.message || 'Please try again.')}</p>
        <a href="quizzes.html" class="btn btn-primary btn-sm">Back to Catalog</a>
      </div>
    `;
    return;
  }

  function startTimer() {
    updateTimerDisplay();
    timerHandle = setInterval(() => {
      remainingSeconds--;
      updateTimerDisplay();
      if (remainingSeconds <= 0) {
        clearInterval(timerHandle);
        QuizForgeToast.warning('Time is up! Submitting your quiz automatically…', 'Time expired');
        doSubmit();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    el.timer.innerHTML = `${QFIcons.clock} ${QFUtils.formatSeconds(remainingSeconds)}`;
    el.timer.classList.toggle('low-time', remainingSeconds <= 60);
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    const selected = answers[q.id];
    const isMarked = marked.has(q.id);

    el.questionCard.innerHTML = `
      <span class="question-number-tag">Question ${currentIndex + 1} of ${questions.length}</span>
      <div class="question-text">${QFUtils.escapeHtml(q.text)}</div>
      <div class="option-list" role="radiogroup" aria-label="Answer options">
        ${['A', 'B', 'C', 'D'].map(letter => `
          <div class="option-item ${selected === letter ? 'selected' : ''}" data-letter="${letter}" role="radio" tabindex="0" aria-checked="${selected === letter}">
            <span class="option-letter">${letter}</span>
            <span class="option-text">${QFUtils.escapeHtml(q.options[letter])}</span>
          </div>
        `).join('')}
      </div>
      <div class="question-actions" style="margin-top: var(--space-6);">
        <div class="flex gap-3">
          <button class="btn btn-secondary" id="prev-btn" ${currentIndex === 0 ? 'disabled' : ''}>Previous</button>
          <button class="btn btn-secondary" id="mark-btn">${isMarked ? 'Unmark' : 'Mark for review'}</button>
        </div>
        <button class="btn btn-primary" id="next-btn">${currentIndex === questions.length - 1 ? 'Finish Review' : 'Next'}</button>
      </div>
    `;

    el.questionCard.querySelectorAll('.option-item').forEach(optEl => {
      const select = () => {
        answers[q.id] = optEl.dataset.letter;
        renderQuestion();
        renderNavigator();
        updateSummary();
      };
      optEl.addEventListener('click', select);
      optEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
    });

    document.getElementById('prev-btn').addEventListener('click', () => { currentIndex = Math.max(0, currentIndex - 1); renderQuestion(); renderNavigator(); });
    document.getElementById('next-btn').addEventListener('click', () => { currentIndex = Math.min(questions.length - 1, currentIndex + 1); renderQuestion(); renderNavigator(); });
    document.getElementById('mark-btn').addEventListener('click', () => {
      if (marked.has(q.id)) marked.delete(q.id); else marked.add(q.id);
      renderQuestion(); renderNavigator(); updateSummary();
    });

    el.progressFill.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  }

  function renderNavigator() {
    el.navGrid.innerHTML = questions.map((q, idx) => {
      const classes = ['q-nav-btn'];
      if (idx === currentIndex) classes.push('current');
      if (answers[q.id]) classes.push('answered');
      if (marked.has(q.id)) classes.push('marked');
      return `<button class="${classes.join(' ')}" data-idx="${idx}" aria-label="Go to question ${idx + 1}">${idx + 1}</button>`;
    }).join('');

    el.navGrid.querySelectorAll('.q-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentIndex = parseInt(btn.dataset.idx, 10);
        renderQuestion();
        renderNavigator();
      });
    });

    updateSummary();
  }

  function updateSummary() {
    const answeredCount = Object.keys(answers).length;
    el.sumAnswered.textContent = answeredCount;
    el.sumUnanswered.textContent = questions.length - answeredCount;
    el.sumMarked.textContent = marked.size;
  }

  el.submitBtn.addEventListener('click', () => {
    const answeredCount = Object.keys(answers).length;
    QuizForgeModal.confirmSubmit({
      answered: answeredCount,
      unanswered: questions.length - answeredCount,
      marked: marked.size,
      onConfirm: doSubmit,
    });
  });

  async function doSubmit() {
    if (submitted) return;
    submitted = true;
    if (timerHandle) clearInterval(timerHandle);

    el.submitBtn.disabled = true;
    el.submitBtn.textContent = 'Submitting…';

    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);

    try {
      await QuizForgeAPI.submitAttempt(attemptId, answers, timeTakenSeconds);
      window.location.href = `results.html?attempt=${attemptId}`;
    } catch (err) {
      submitted = false;
      el.submitBtn.disabled = false;
      el.submitBtn.textContent = 'Submit Quiz';
      QuizForgeToast.error(err.message || 'Could not submit your quiz. Please try again.', 'Submission failed');
    }
  }
})();
