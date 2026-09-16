/* pages.js
 * CRUD logic for Pages: title, slug, block-based content, status,
 * created/last-modified dates.
 */

const Pages = {
  all() {
    return Storage.getAll('pages').slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  get(id) {
    return Storage.getById('pages', id);
  },

  getBySlug(slug) {
    return Storage.getAll('pages').find(p => p.slug === slug) || null;
  },

  create(data) {
    const now = new Date().toISOString();
    const page = Object.assign({
      title: 'Untitled Page',
      slug: '',
      blocks: [],
      status: 'draft'
    }, data, { createdAt: now, updatedAt: now });
    page.slug = Pages.ensureUniqueSlug(page.slug || UI.slugify(page.title) || Storage.uid('page'));
    return Storage.insert('pages', page);
  },

  update(id, patch) {
    patch = Object.assign({}, patch, { updatedAt: new Date().toISOString() });
    if (patch.slug !== undefined) {
      patch.slug = Pages.ensureUniqueSlug(patch.slug || 'page', id);
    }
    return Storage.update('pages', id, patch);
  },

  remove(id) {
    Storage.remove('pages', id);
  },

  ensureUniqueSlug(slug, excludeId) {
    slug = UI.slugify(slug) || Storage.uid('page');
    const base = slug;
    let n = 1;
    while (Storage.getAll('pages').some(p => p.slug === slug && p.id !== excludeId)) {
      n += 1;
      slug = base + '-' + n;
    }
    return slug;
  }
};
