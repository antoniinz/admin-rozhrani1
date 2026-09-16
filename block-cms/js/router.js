/* router.js
 * Very small client-side "router" for a multi-page static app: it guards
 * pages that require a logged-in session, reads query-string params for
 * views like editor.html / preview.html, and provides simple navigation.
 */

const Router = {
  requireAuth() {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  redirectIfLoggedIn(target) {
    if (Auth.isLoggedIn()) {
      window.location.href = target || 'dashboard.html';
    }
  },

  params() {
    return new URLSearchParams(window.location.search);
  },

  param(name) {
    return this.params().get(name);
  },

  goto(page, params) {
    let url = page;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) url += '?' + qs;
    }
    window.location.href = url;
  }
};
