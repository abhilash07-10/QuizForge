/* ==========================================================================
   QuizForge -- Toast notifications
   ========================================================================== */

const QuizForgeToast = (() => {
  let container = null;

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  function show(message, { type = 'info', title = '', duration = 4200 } = {}) {
    const root = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div>${message}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    `;
    root.appendChild(toast);

    const remove = () => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 180);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    if (duration) setTimeout(remove, duration);

    return remove;
  }

  return {
    show,
    success: (msg, title) => show(msg, { type: 'success', title }),
    error: (msg, title) => show(msg, { type: 'error', title }),
    warning: (msg, title) => show(msg, { type: 'warning', title }),
    info: (msg, title) => show(msg, { type: 'info', title }),
  };
})();
