/* preview.js
 * Renders a page/post's blocks into a document-like view. Used by the
 * in-editor "quick preview" panel and by preview.html (the public output
 * view visitors would see), both reading from the same local storage.
 */

const Preview = {
  renderInto(el, item, opts) {
    opts = opts || {};
    const meta = [];
    if (opts.showStatus) meta.push(UI.statusBadge(item.status));
    if (opts.author) meta.push(`By ${UI.escapeHtml(opts.author)}`);
    if (opts.date) meta.push(UI.formatDate(opts.date));
    if (opts.categories && opts.categories.length) {
      meta.push(opts.categories.map(c => UI.escapeHtml(c)).join(', '));
    }

    el.innerHTML = `
      <article class="preview-doc">
        <header class="preview-header">
          <h1 class="preview-title">${UI.escapeHtml(item.title || 'Untitled')}</h1>
          ${meta.length ? `<div class="preview-meta">${meta.join('<span class="dot">·</span>')}</div>` : ''}
        </header>
        <div class="preview-body">${Blocks.renderAllHTML(item.blocks)}</div>
      </article>`;
  }
};
