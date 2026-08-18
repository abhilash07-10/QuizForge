/* ==========================================================================
   QuizForge -- Login page
   ========================================================================== */

(function () {
  QuizForgeNav.mount('login');

  if (QuizForgeAPI.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit-btn');

  const toggleBtn = document.getElementById('toggle-password');
  const pwInput = document.getElementById('password');
  toggleBtn.addEventListener('click', () => {
    const show = pwInput.type === 'password';
    pwInput.type = show ? 'text' : 'password';
    toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
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

    const email = document.getElementById('email').value.trim();
    const password = pwInput.value;

    if (!email || !password) {
      if (!email) showFieldError('email', 'Please enter your email.');
      if (!password) showFieldError('password', 'Please enter your password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    try {
      const { token, user } = await QuizForgeAPI.login({ email, password });
      QuizForgeAPI.setSession(token, user);
      QuizForgeToast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`, 'Logged in');

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      window.location.href = (next && next.endsWith('.html')) ? next : 'dashboard.html';
    } catch (err) {
      showFieldError('password', '');
      document.getElementById('err-password').hidden = true;
      QuizForgeToast.error(err.message || 'Invalid email or password.', 'Login failed');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
})();
