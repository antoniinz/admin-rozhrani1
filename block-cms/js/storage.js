/* storage.js
 * Low-level read/write wrapper around localStorage.
 * Everything else in the app (auth, pages, posts, categories, settings)
 * goes through this module instead of touching localStorage directly.
 */

const DB_KEY = 'cms_db_v1';

function defaultDB() {
  return {
    users: [],
    session: { userId: null },
    pages: [],
    posts: [],
    categories: [],
    settings: { siteTitle: 'My Site', tagline: 'Built with the block editor' }
  };
}

const Storage = {
  read() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const db = defaultDB();
        this.write(db);
        return db;
      }
      const parsed = JSON.parse(raw);
      // Fill in any missing top-level keys (forward-compatible with older data).
      const merged = Object.assign(defaultDB(), parsed);
      return merged;
    } catch (e) {
      console.error('Storage read error, resetting to defaults.', e);
      const db = defaultDB();
      this.write(db);
      return db;
    }
  },

  write(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },

  uid(prefix) {
    const rand = Math.random().toString(36).slice(2, 8);
    const time = Date.now().toString(36);
    return (prefix ? prefix + '_' : '') + time + rand;
  },

  getAll(collection) {
    const db = this.read();
    return db[collection] || [];
  },

  getById(collection, id) {
    return this.getAll(collection).find(item => item.id === id) || null;
  },

  insert(collection, item) {
    const db = this.read();
    if (!item.id) item.id = this.uid(collection.replace(/s$/, ''));
    db[collection].push(item);
    this.write(db);
    return item;
  },

  update(collection, id, patch) {
    const db = this.read();
    const idx = db[collection].findIndex(i => i.id === id);
    if (idx === -1) return null;
    db[collection][idx] = Object.assign({}, db[collection][idx], patch);
    this.write(db);
    return db[collection][idx];
  },

  remove(collection, id) {
    const db = this.read();
    db[collection] = db[collection].filter(i => i.id !== id);
    this.write(db);
  },

  getSettings() {
    return this.read().settings;
  },

  updateSettings(patch) {
    const db = this.read();
    db.settings = Object.assign({}, db.settings, patch);
    this.write(db);
    return db.settings;
  },

  getSession() {
    return this.read().session;
  },

  setSession(userId) {
    const db = this.read();
    db.session = { userId };
    this.write(db);
  },

  clearSession() {
    const db = this.read();
    db.session = { userId: null };
    this.write(db);
  }
};
