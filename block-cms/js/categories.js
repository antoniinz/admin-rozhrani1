/* categories.js
 * CRUD logic for Categories, plus detaching a deleted category from any
 * posts that reference it.
 */

const Categories = {
  all() {
    return Storage.getAll('categories').slice().sort((a, b) => a.name.localeCompare(b.name));
  },

  get(id) {
    return Storage.getById('categories', id);
  },

  create(name) {
    name = (name || '').trim();
    if (!name) throw new Error('Category name is required.');
    if (Storage.getAll('categories').some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A category with that name already exists.');
    }
    const slug = Categories.ensureUniqueSlug(UI.slugify(name));
    return Storage.insert('categories', { name, slug });
  },

  update(id, patch) {
    if (patch.name) {
      patch.name = patch.name.trim();
      patch.slug = Categories.ensureUniqueSlug(UI.slugify(patch.name), id);
    }
    return Storage.update('categories', id, patch);
  },

  remove(id) {
    Storage.remove('categories', id);
    const db = Storage.read();
    db.posts.forEach(p => { p.categoryIds = (p.categoryIds || []).filter(cid => cid !== id); });
    Storage.write(db);
  },

  ensureUniqueSlug(slug, excludeId) {
    slug = slug || Storage.uid('category');
    const base = slug;
    let n = 1;
    while (Storage.getAll('categories').some(c => c.slug === slug && c.id !== excludeId)) {
      n += 1;
      slug = base + '-' + n;
    }
    return slug;
  },

  namesFor(categoryIds) {
    if (!categoryIds || !categoryIds.length) return [];
    const all = Storage.getAll('categories');
    return categoryIds.map(id => {
      const c = all.find(cat => cat.id === id);
      return c ? c.name : null;
    }).filter(Boolean);
  }
};
