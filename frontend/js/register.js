/* ==========================================================================
   QuizForge -- Register page
   ========================================================================== */

(function () {
  QuizForgeNav.mount('register');

  if (QuizForgeAPI.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('submit-btn');
  const pwInput = document.getElementById('password');
  const strengthBar = document.getElementById('pw-strength');

  function togglePasswordVisibility(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  }
  togglePasswordVisibility('password', 'toggle-password');
  togglePasswordVisibility('confirmPassword', 'toggle-confirm-password');

  function scorePassword(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[a-z]/.test(pw) && pw.length >= 12) score++;
    return Math.min(score, 4);
  }

  pwInput.addEventListener('input', () => {
    const score = scorePassword(pwInput.value);
    strengthBar.className = 'password-strength' + (score ? ` s${score}` : '');
  });

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => { el.hidden = true; el.textContent = ''; });
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('has-error'));
  }

  function showFieldError(field, message) {
    const errEl = document.getElementById(`err-${field}`);
    const inputEl = document.getElementById(field);
    if (errEl) { errEl.hidden = false; errEl.textContent = message; }
    if (inputEl) inputEl.classList.add('has-error');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = pwInput.value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms').checked;

    let hasError = false;
    if (fullName.length < 2) { showFieldError('fullName', 'Please enter your full name.'); hasError = true; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showFieldError('email', 'Please enter a valid email address.'); hasError = true; }
    if (password.length < 8) { showFieldError('password', 'Password must be at least 8 characters.'); hasError = true; }
    if (password !== confirmPassword) { showFieldError('confirmPassword', 'Passwords do not match.'); hasError = true; }
    if (!termsAccepted) { showFieldError('terms', 'You must accept the terms to continue.'); hasError = true; }
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const { token, user } = await QuizForgeAPI.register({ fullName, email, password, confirmPassword });
      QuizForgeAPI.setSession(token, user);
      QuizForgeToast.success(`Welcome to QuizForge, ${user.fullName.split(' ')[0]}!`, 'Account created');
      window.location.href = 'dashboard.html';
    } catch (err) {
      if (err.fields) {
        Object.entries(err.fields).forEach(([field, message]) => showFieldError(field, message));
      }
      QuizForgeToast.error(err.message || 'Something went wrong. Please try again.', 'Registration failed');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
    }
  });
})();
