/* ui.js
 * Shared DOM helpers used across every admin view: escaping, slugs, date
 * formatting, toast notifications, confirm modals, and the sidebar/topbar.
 */

const UI = {
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  },

  slugify(str) {
    return String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },

  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  },

  toast(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, 2600);
  },

  confirm(message, confirmLabel) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <p class="modal-message"></p>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="btn btn-danger" data-action="confirm">${UI.escapeHtml(confirmLabel || 'Delete')}</button>
          </div>
        </div>`;
      overlay.querySelector('.modal-message').textContent = message;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));

      function close(result) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 180);
        resolve(result);
      }
      overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
      overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    });
  },

  renderSidebar(active) {
    const el = document.getElementById('sidebar');
    if (!el) return;
    const user = Auth.currentUser();
    const settings = Storage.getSettings();
    const items = [
      { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
      { key: 'pages', label: 'Pages', href: 'pages.html' },
      { key: 'posts', label: 'Posts', href: 'posts.html' },
      { key: 'categories', label: 'Categories', href: 'categories.html' },
      { key: 'settings', label: 'Settings', href: 'settings.html' }
    ];
    el.innerHTML = `
      <div class="sidebar-brand">
        <span class="brand-dot"></span>
        <span class="brand-name">${UI.escapeHtml(settings.siteTitle || 'My Site')}</span>
      </div>
      <nav class="sidebar-nav">
        ${items.map(i => `<a href="${i.href}" class="sidebar-link${i.key === active ? ' active' : ''}">${i.label}</a>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">${UI.escapeHtml((user && user.displayName || '?').slice(0, 1).toUpperCase())}</div>
          <div class="user-name">${UI.escapeHtml(user ? user.displayName : '')}</div>
        </div>
        <button type="button" class="sidebar-logout" id="logout-btn">Log out</button>
      </div>
    `;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'login.html';
      });
    }
  },

  statusBadge(status) {
    const cls = status === 'published' ? 'badge-published' : 'badge-draft';
    const label = status === 'published' ? 'Published' : 'Draft';
    return `<span class="badge ${cls}">${label}</span>`;
  }
};
