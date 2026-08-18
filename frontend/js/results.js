/* ==========================================================================
   QuizForge -- Results & Review page
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('quizzes');
  const user = await QuizForgeAuthGuard.require();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get('attempt');
  const summaryCard = document.getElementById('results-summary-card');
  const reviewContent = document.getElementById('review-content');
  const reviewTabs = document.getElementById('review-tabs');

  if (!attemptId) {
    summaryCard.innerHTML = notFoundBlock();
    return;
  }

  try {
    const { attempt } = await QuizForgeAPI.getAttempt(attemptId);
    if (attempt.status !== 'completed') {
      window.location.href = `quiz.html?attempt=${attemptId}`;
      return;
    }
    renderSummary(attempt);
    reviewTabs.hidden = false;
    document.querySelector('[data-tab="review"]').addEventListener('click', () => loadReview(attemptId));
    // Auto-load review content lazily below the fold
    loadReview(attemptId);
  } catch (err) {
    summaryCard.innerHTML = notFoundBlock();
  }

  function performanceMessage(scorePercent) {
    if (scorePercent === 100) return "Perfect score! You've completely mastered this topic.";
    if (scorePercent >= 85) return "Excellent work! You're performing above your recent average.";
    if (scorePercent >= 70) return "Solid performance — you're well on your way to mastery.";
    if (scorePercent >= 50) return "Good effort. A bit more practice will sharpen this up.";
    return "Keep practicing — reviewing your answers below will help a lot.";
  }

  function renderSummary(attempt) {
    const circumference = 2 * Math.PI * 78;
    const offset = circumference * (1 - attempt.scorePercent / 100);

    summaryCard.innerHTML = `
      <div class="results-hero">
        <div class="emoji">${attempt.scorePercent === 100 ? '🏆' : attempt.scorePercent >= 70 ? '🎉' : '💪'}</div>
        <h1 class="page-title" style="margin-bottom: var(--space-2);">Quiz Completed</h1>
        <p class="text-muted">${QFUtils.escapeHtml(attempt.quizTitle)} &middot; ${QFUtils.escapeHtml(attempt.category)}</p>

        <div class="score-ring-wrap" style="margin: var(--space-8) 0;">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle class="score-ring-track" cx="90" cy="90" r="78" stroke-width="14"></circle>
            <circle class="score-ring-fill" id="result-ring-fill" cx="90" cy="90" r="78" stroke-width="14"
              stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"></circle>
          </svg>
          <div class="score-ring-label">
            <span class="big" style="font-size: 2.25rem;">${attempt.correctCount}/${attempt.totalQuestions}</span>
            <span class="small">${attempt.scorePercent}%</span>
          </div>
        </div>

        <div class="results-score-row">
          <div class="result-stat correct"><span class="num">${attempt.correctCount}</span><span class="lbl">Correct</span></div>
          <div class="result-stat wrong"><span class="num">${attempt.wrongCount}</span><span class="lbl">Wrong</span></div>
          <div class="result-stat skipped"><span class="num">${attempt.skippedCount}</span><span class="lbl">Skipped</span></div>
          <div class="result-stat"><span class="num">${QFUtils.formatSeconds(attempt.timeTakenSeconds || 0)}</span><span class="lbl">Time Taken</span></div>
          <div class="result-stat"><span class="num">+${attempt.xpEarned}</span><span class="lbl">XP Earned</span></div>
        </div>

        <p class="perf-message">${performanceMessage(attempt.scorePercent)}</p>

        <div id="new-achievements-slot"></div>

        <div class="result-actions">
          <a href="quiz-detail.html?id=${attempt.quizId}" class="btn btn-secondary">Try Again</a>
          <a href="dashboard.html" class="btn btn-primary">Back to Dashboard</a>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      document.getElementById('result-ring-fill').style.strokeDashoffset = String(offset);
    });

    // Newly unlocked achievements are attached to sessionStorage right after
    // submission (see quiz-engine hand-off) -- but we don't have that data
    // if the user reloads this page later, since it's not stored server-side
    // as a "new" flag. We instead re-fetch full achievements and highlight
    // any unlocked within the last few minutes for a nice touch, falling
    // back to nothing if unavailable.
    QuizForgeAPI.getAchievements().then(({ achievements }) => {
      const recentlyUnlocked = achievements.filter(a => {
        if (!a.unlocked || !a.unlockedAt) return false;
        return (Date.now() - new Date(a.unlockedAt).getTime()) < 5 * 60 * 1000;
      });
      if (recentlyUnlocked.length > 0) {
        document.getElementById('new-achievements-slot').innerHTML = `
          <div class="new-achievements">
            ${recentlyUnlocked.map(a => `
              <div class="new-achievement-chip">
                <span class="ic">${QFIcons.award}</span> ${QFUtils.escapeHtml(a.title)} unlocked!
              </div>
            `).join('')}
          </div>
        `;
        recentlyUnlocked.forEach(a => QuizForgeToast.success(a.title, 'Achievement unlocked'));
      }
    }).catch(() => {});
  }

  async function loadReview(id) {
    reviewContent.innerHTML = `<div class="skeleton skeleton-card" style="height:200px;"></div>`;
    try {
      const { questions } = await QuizForgeAPI.getAttemptReview(id);
      reviewContent.innerHTML = questions.map((q, idx) => `
        <div class="card review-question-block">
          <span class="qnum">Question ${idx + 1}</span>
          <div class="question-text" style="font-size: var(--fs-md);">${QFUtils.escapeHtml(q.text)}</div>
          <div class="option-list">
            ${['A', 'B', 'C', 'D'].map(letter => {
              let cls = '';
              if (letter === q.correctOption) cls = 'correct-answer';
              else if (letter === q.userOption) cls = 'wrong-answer';
              return `
                <div class="option-item ${cls}">
                  <span class="option-letter">${letter}</span>
                  <span class="option-text">${QFUtils.escapeHtml(q.options[letter])}</span>
                  ${letter === q.userOption ? '<span class="badge badge-neutral" style="margin-left:auto;">Your answer</span>' : ''}
                  ${letter === q.correctOption ? '<span class="badge badge-beginner" style="margin-left:auto;">Correct</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
          ${q.explanation ? `
            <div class="explanation-box">
              <strong>Explanation:</strong> ${QFUtils.escapeHtml(q.explanation)}
            </div>
          ` : ''}
        </div>
      `).join('');
    } catch (err) {
      reviewContent.innerHTML = `<p class="text-muted text-sm">Could not load the answer review.</p>`;
    }
  }

  function notFoundBlock() {
    return `
      <div class="state-block">
        ${QFIcons.alertTriangle}
        <h3>Result not found</h3>
        <p style="margin:0;">This attempt may not exist or you may not have access to it.</p>
        <a href="dashboard.html" class="btn btn-primary btn-sm">Back to Dashboard</a>
      </div>
    `;
  }
})();
