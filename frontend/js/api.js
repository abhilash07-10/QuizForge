/* ==========================================================================
   QuizForge -- API client
   Centralizes all fetch calls, attaches the auth token, and normalizes
   error handling so every page can rely on consistent behavior.
   ========================================================================== */

const QuizForgeAPI = (() => {
  // Auto-detect: same-origin backend during local dev via a simple proxy,
  // otherwise point at the configured API base. Update API_BASE for your
  // deployed backend URL (e.g. your Render service).
  const API_BASE = window.QUIZFORGE_API_BASE || 'http://localhost:5000/api';

  const TOKEN_KEY = 'quizforge_token';
  const USER_KEY = 'quizforge_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function request(path, { method = 'GET', body, auth = false, params } = {}) {
    let url = `${API_BASE}${path}`;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      if (qs) url += `?${qs}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      throw { networkError: true, message: 'Unable to reach the server. Please check your connection and try again.' };
    }

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401 && auth) {
        clearSession();
      }
      const err = new Error((data && data.error) || 'Something went wrong. Please try again.');
      err.status = response.status;
      err.fields = data && data.fields;
      throw err;
    }

    return data;
  }

  return {
    // --- session -----------------------------------------------------
    getToken, getUser, setSession, clearSession, isLoggedIn,

    // --- auth -----------------------------------------------------
    register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
    login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
    logout: () => request('/auth/logout', { method: 'POST', auth: true }),
    me: () => request('/auth/me', { auth: true }),

    // --- catalog -----------------------------------------------------
    getCategories: () => request('/categories'),
    getQuizzes: (params) => request('/quizzes', { params }),
    getQuiz: (id) => request(`/quizzes/${id}`),
    getQuizQuestions: (id) => request(`/quizzes/${id}/questions`, { auth: true }),

    // --- attempts -----------------------------------------------------
    startAttempt: (quizId) => request('/attempts', { method: 'POST', auth: true, body: { quizId } }),
    submitAttempt: (attemptId, answers, timeTakenSeconds) =>
      request(`/attempts/${attemptId}/submit`, { method: 'POST', auth: true, body: { answers, timeTakenSeconds } }),
    getAttempt: (attemptId) => request(`/attempts/${attemptId}`, { auth: true }),
    getAttemptReview: (attemptId) => request(`/attempts/${attemptId}/review`, { auth: true }),

    // --- results / analytics -----------------------------------------------------
    getResults: (limit) => request('/results', { auth: true, params: { limit } }),
    getProgress: () => request('/progress', { auth: true }),

    // --- leaderboard / achievements / profile -----------------------------------------------------
    getLeaderboard: (period) => request('/leaderboard', { params: { period } }),
    getAchievements: () => request('/achievements', { auth: true }),
    getProfile: () => request('/profile', { auth: true }),
    updateProfile: (payload) => request('/profile', { method: 'PUT', auth: true, body: payload }),
  };
})();
