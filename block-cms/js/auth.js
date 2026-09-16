/* auth.js
 * Registration, login, logout, session handling.
 * Passwords are hashed client-side with SHA-256 (Web Crypto API) before
 * being stored — this is not bank-grade security, just avoids plaintext.
 */

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const Auth = {
  async register(username, password, displayName) {
    username = (username || '').trim();
    password = password || '';
    if (!username) throw new Error('Please choose a username.');
    if (username.length < 3) throw new Error('Username must be at least 3 characters.');
    if (password.length < 4) throw new Error('Password must be at least 4 characters.');

    const users = Storage.getAll('users');
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('That username is already taken.');
    }

    const passwordHash = await sha256Hex(password);
    const user = {
      id: Storage.uid('user'),
      username,
      passwordHash,
      displayName: (displayName && displayName.trim()) || username,
      createdAt: new Date().toISOString()
    };
    Storage.insert('users', user);
    Storage.setSession(user.id);
    return user;
  },

  async login(username, password) {
    username = (username || '').trim();
    const users = Storage.getAll('users');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) throw new Error('No account found with that username.');
    const passwordHash = await sha256Hex(password || '');
    if (passwordHash !== user.passwordHash) throw new Error('Incorrect password.');
    Storage.setSession(user.id);
    return user;
  },

  logout() {
    Storage.clearSession();
  },

  currentUser() {
    const session = Storage.getSession();
    if (!session || !session.userId) return null;
    return Storage.getById('users', session.userId);
  },

  isLoggedIn() {
    return !!this.currentUser();
  },

  async changePassword(oldPassword, newPassword) {
    const user = this.currentUser();
    if (!user) throw new Error('Not logged in.');
    if ((newPassword || '').length < 4) throw new Error('New password must be at least 4 characters.');
    const oldHash = await sha256Hex(oldPassword || '');
    if (oldHash !== user.passwordHash) throw new Error('Current password is incorrect.');
    const newHash = await sha256Hex(newPassword);
    Storage.update('users', user.id, { passwordHash: newHash });
  },

  updateDisplayName(name) {
    const user = this.currentUser();
    if (!user) throw new Error('Not logged in.');
    name = (name || '').trim();
    if (!name) throw new Error('Display name cannot be empty.');
    Storage.update('users', user.id, { displayName: name });
  }
};
