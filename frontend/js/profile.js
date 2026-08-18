/* ==========================================================================
   QuizForge -- Profile page
   ========================================================================== */

(async function () {
  QuizForgeNav.mount('profile');
  const user = await QuizForgeAuthGuard.require();
  if (!user) return;

  try {
    const [{ profile }, { achievements }] = await Promise.all([
      QuizForgeAPI.getProfile(),
      QuizForgeAPI.getAchievements(),
    ]);
    renderHeader(profile);
    renderStats(profile);
    renderCategoryStrengths(profile.categoryStrengths);
    renderAchievements(achievements);
  } catch (err) {
    QuizForgeToast.error(err.message || 'Could not load your profile.', 'Something went wrong');
  }

  function initials(name) {
    return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  function renderHeader(profile) {
    document.getElementById('profile-header-card').innerHTML = `
      <div class="profile-avatar-lg">${initials(profile.fullName)}</div>
      <div class="profile-header-info">
        <h1 id="profile-name-display">${QFUtils.escapeHtml(profile.fullName)}</h1>
        <p class="mb-0">${QFUtils.escapeHtml(profile.email)}</p>
        <span class="joined">Joined ${QFUtils.formatDate(profile.joinedDate)}</span>
      </div>
      <button class="btn btn-secondary profile-edit-btn" id="edit-name-btn">Edit Name</button>
    `;

    document.getElementById('edit-name-btn').addEventListener('click', () => {
      openEditForm(profile.fullName);
    });
  }

  function openEditForm(currentName) {
    const headerCard = document.getElementById('profile-header-card');
    const infoBlock = headerCard.querySelector('.profile-header-info');
    infoBlock.innerHTML = `
      <form id="edit-name-form" class="flex gap-2" style="align-items: center; flex-wrap: wrap;">
        <input type="text" class="form-input" id="edit-name-input" value="${QFUtils.escapeHtml(currentName)}" style="max-width: 260px;" required minlength="2">
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
        <button type="button" class="btn btn-ghost btn-sm" id="cancel-edit-btn">Cancel</button>
      </form>
    `;
    headerCard.querySelector('.profile-edit-btn')?.remove();

    document.getElementById('cancel-edit-btn').addEventListener('click', () => location.reload());

    document.getElementById('edit-name-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newName = document.getElementById('edit-name-input').value.trim();
      if (newName.length < 2) return;
      try {
        const { user: updatedUser } = await QuizForgeAPI.updateProfile({ fullName: newName });
        QuizForgeAPI.setSession(QuizForgeAPI.getToken(), updatedUser);
        QuizForgeToast.success('Your name has been updated.', 'Profile updated');
        location.reload();
      } catch (err) {
        QuizForgeToast.error(err.message || 'Could not update your profile.', 'Update failed');
      }
    });
  }

  function renderStats(profile) {
    document.getElementById('profile-stats').innerHTML = `
      <div class="card stat-card"><span class="stat-label">Quizzes Completed</span><span class="stat-value">${profile.quizzesCompleted}</span></div>
      <div class="card stat-card"><span class="stat-label">Average Score</span><span class="stat-value">${profile.averageScore}%</span></div>
      <div class="card stat-card"><span class="stat-label">Best Score</span><span class="stat-value">${profile.bestScore}%</span></div>
    `;
  }

  function renderCategoryStrengths(strengths) {
    const card = document.getElementById('profile-category-card');
    if (!strengths || strengths.length === 0) {
      card.innerHTML = `<p class="text-muted text-sm" style="margin:0;">Complete quizzes across categories to see your strengths here.</p>`;
      return;
    }
    card.innerHTML = strengths.map(s => `
      <div style="margin-bottom: var(--space-4);">
        <div class="flex justify-between text-sm" style="margin-bottom: 6px;">
          <span>${QFUtils.escapeHtml(s.category)}</span>
          <span class="text-muted">${s.accuracyPercent}% &middot; ${s.quizzesCompleted} quiz${s.quizzesCompleted === 1 ? '' : 'zes'}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${s.accuracyPercent}%"></div></div>
      </div>
    `).join('');
  }

  function iconKeyFor(icon) {
    const map = { flag: 'flag', star: 'star', target: 'target', 'check-circle': 'checkCircle', layers: 'layers', flame: 'flame', zap: 'zap', award: 'award' };
    return map[icon] || 'award';
  }

  function renderAchievements(achievements) {
    document.getElementById('profile-achievements-grid').innerHTML = achievements.map(a => `
      <div class="card achievement-card ${a.unlocked ? '' : 'locked'}" title="${QFUtils.escapeHtml(a.description)}">
        <div class="achievement-icon">${QFIcons[iconKeyFor(a.icon)] || QFIcons.award}</div>
        <h4>${QFUtils.escapeHtml(a.title)}</h4>
        <p>${a.unlocked ? QFUtils.formatDate(a.unlockedAt) : 'Locked'}</p>
      </div>
    `).join('');
  }
})();
