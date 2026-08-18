/* ==========================================================================
   QuizForge -- Custom modal / confirmation dialogs
   Never uses native alert()/confirm()/prompt().
   ========================================================================== */

const QuizForgeModal = (() => {
  let overlay = null;
  let box = null;
  let lastFocused = null;

  function ensure() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    box = document.createElement('div');
    box.className = 'modal-box';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    if (lastFocused) lastFocused.focus();
  }

  function open(html) {
    ensure();
    box.innerHTML = html;
    overlay.classList.add('open');
    lastFocused = document.activeElement;
    const firstBtn = box.querySelector('button');
    if (firstBtn) firstBtn.focus();
  }

  const ICONS = {
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  /** General-purpose confirmation dialog. Returns a Promise<boolean>. */
  function confirm({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    tone = 'warn', // warn | danger | info
    confirmClass = 'btn-primary',
  } = {}) {
    return new Promise((resolve) => {
      ensure();
      open(`
        <div class="modal-icon ${tone}">${ICONS[tone] || ICONS.info}</div>
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
          <button class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
        </div>
      `);

      const handle = (e) => {
        const action = e.target.closest('[data-action]');
        if (!action) return;
        box.removeEventListener('click', handle);
        close();
        resolve(action.dataset.action === 'confirm');
      };
      box.addEventListener('click', handle);
    });
  }

  /** Quiz-submission confirmation with an answered/unanswered/marked summary. */
  function confirmSubmit({ answered, unanswered, marked, onConfirm, onCancel }) {
    ensure();
    open(`
      <div class="modal-icon info">${ICONS.info}</div>
      <h3>Submit this quiz?</h3>
      <p>Once submitted, you won't be able to change your answers.</p>
      <div class="modal-summary">
        <div class="modal-summary-item"><div class="num">${answered}</div><div class="lbl">Answered</div></div>
        <div class="modal-summary-item"><div class="num">${unanswered}</div><div class="lbl">Unanswered</div></div>
        <div class="modal-summary-item"><div class="num">${marked}</div><div class="lbl">Marked</div></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" data-action="cancel">Keep Reviewing</button>
        <button class="btn btn-primary" data-action="confirm">Submit Quiz</button>
      </div>
    `);
    const handle = (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      box.removeEventListener('click', handle);
      close();
      if (action.dataset.action === 'confirm' && onConfirm) onConfirm();
      if (action.dataset.action === 'cancel' && onCancel) onCancel();
    };
    box.addEventListener('click', handle);
  }

  return { confirm, confirmSubmit, close };
})();
