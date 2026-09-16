/* posts.js
 * CRUD logic for Posts: title, slug, block-based content, status,
 * publish date, author, assigned categories.
 */

const Posts = {
  all() {
    return Storage.getAll('posts').slice().sort((a, b) =>
      new Date(b.publishDate || b.createdAt) - new Date(a.publishDate || a.createdAt));
  },

  get(id) {
    return Storage.getById('posts', id);
  },

  getBySlug(slug) {
    return Storage.getAll('posts').find(p => p.slug === slug) || null;
  },

  create(data) {
    const now = new Date().toISOString();
    const post = Object.assign({
      title: 'Untitled Post',
      slug: '',
      blocks: [],
      status: 'draft',
      publishDate: now,
      author: '',
      categoryIds: []
    }, data, { createdAt: now, updatedAt: now });
    post.slug = Posts.ensureUniqueSlug(post.slug || UI.slugify(post.title) || Storage.uid('post'));
    return Storage.insert('posts', post);
  },

  update(id, patch) {
    patch = Object.assign({}, patch, { updatedAt: new Date().toISOString() });
    if (patch.slug !== undefined) {
      patch.slug = Posts.ensureUniqueSlug(patch.slug || 'post', id);
    }
    return Storage.update('posts', id, patch);
  },

  remove(id) {
    Storage.remove('posts', id);
  },

  ensureUniqueSlug(slug, excludeId) {
    slug = UI.slugify(slug) || Storage.uid('post');
    const base = slug;
    let n = 1;
    while (Storage.getAll('posts').some(p => p.slug === slug && p.id !== excludeId)) {
      n += 1;
      slug = base + '-' + n;
    }
    return slug;
  },

  byCategory(categoryId) {
    return Posts.all().filter(p => (p.categoryIds || []).includes(categoryId));
  },

  filterAndSort(list, { status, categoryId, sortBy } = {}) {
    let result = list.slice();
    if (status && status !== 'all') result = result.filter(p => p.status === status);
    if (categoryId && categoryId !== 'all') result = result.filter(p => (p.categoryIds || []).includes(categoryId));
    switch (sortBy) {
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.publishDate || a.createdAt) - new Date(b.publishDate || b.createdAt));
        break;
      case 'date-desc':
      default:
        result.sort((a, b) => new Date(b.publishDate || b.createdAt) - new Date(a.publishDate || a.createdAt));
        break;
    }
    return result;
  }
};
