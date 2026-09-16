/* blocks.js
 * The block system: block data model, the editable block list UI
 * (add / edit / reorder / duplicate / delete), and HTML rendering of
 * blocks for both the admin quick preview and the public output view.
 *
 * Supported block types (text + structural only — no media blocks):
 *   heading, paragraph, list, quote, columns, divider, table
 */

const BLOCK_TYPE_LABELS = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  list: 'List',
  quote: 'Quote',
  columns: 'Columns',
  divider: 'Divider',
  table: 'Table'
};

function createBlock(type) {
  const id = Storage.uid('block');
  switch (type) {
    case 'heading': return { id, type, level: 2, text: 'New heading' };
    case 'paragraph': return { id, type, text: 'Write something…' };
    case 'list': return { id, type, style: 'bullet', items: ['First item'] };
    case 'quote': return { id, type, text: 'A memorable quote.', cite: '' };
    case 'columns': return { id, type, columns: ['', ''] };
    case 'divider': return { id, type };
    case 'table': return { id, type, headerRow: true, rows: [['Column A', 'Column B'], ['', '']] };
    default: return { id, type: 'paragraph', text: '' };
  }
}

function nl2br(str) {
  return UI.escapeHtml(str).replace(/\n/g, '<br>');
}

/* ---------- Rendering (admin preview + public output) ---------- */

function renderBlockHTML(block) {
  switch (block.type) {
    case 'heading': {
      const level = [1, 2, 3].includes(block.level) ? block.level : 2;
      return `<h${level}>${UI.escapeHtml(block.text)}</h${level}>`;
    }
    case 'paragraph':
      return `<p>${nl2br(block.text)}</p>`;
    case 'list': {
      const tag = block.style === 'number' ? 'ol' : 'ul';
      const items = (block.items || [])
        .filter(i => (i || '').trim() !== '')
        .map(i => `<li>${UI.escapeHtml(i)}</li>`)
        .join('');
      return items ? `<${tag}>${items}</${tag}>` : '';
    }
    case 'quote': {
      const cite = block.cite ? `<cite>— ${UI.escapeHtml(block.cite)}</cite>` : '';
      return `<blockquote><p>${nl2br(block.text)}</p>${cite}</blockquote>`;
    }
    case 'columns': {
      const cols = (block.columns || []).map(c => `<div class="col">${nl2br(c)}</div>`).join('');
      return `<div class="block-columns cols-${(block.columns || []).length}">${cols}</div>`;
    }
    case 'divider':
      return `<hr>`;
    case 'table': {
      const rows = block.rows || [];
      if (!rows.length) return '';
      let html = '<table class="content-table"><tbody>';
      rows.forEach((row, i) => {
        const cellTag = (block.headerRow && i === 0) ? 'th' : 'td';
        html += '<tr>' + row.map(cell => `<${cellTag}>${UI.escapeHtml(cell)}</${cellTag}>`).join('') + '</tr>';
      });
      html += '</tbody></table>';
      return html;
    }
    default:
      return '';
  }
}

function renderAllHTML(blocks) {
  if (!blocks || !blocks.length) {
    return '<p class="empty-content">This content has no blocks yet.</p>';
  }
  return blocks.map(renderBlockHTML).join('\n');
}

/* ---------- Editable field UI per block type ---------- */

function renderFields(block, persist, renderList) {
  const wrap = document.createElement('div');
  wrap.className = 'block-fields';

  switch (block.type) {
    case 'heading': {
      wrap.innerHTML = `
        <div class="field-row">
          <select class="field-level" aria-label="Heading level">
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
          </select>
          <input type="text" class="field-text" placeholder="Heading text">
        </div>`;
      const sel = wrap.querySelector('.field-level');
      const txt = wrap.querySelector('.field-text');
      sel.value = block.level;
      txt.value = block.text;
      sel.addEventListener('change', () => { block.level = parseInt(sel.value, 10); persist(); });
      txt.addEventListener('input', () => { block.text = txt.value; persist(); });
      break;
    }

    case 'paragraph': {
      wrap.innerHTML = `<textarea class="field-text" rows="3" placeholder="Paragraph text"></textarea>`;
      const ta = wrap.querySelector('.field-text');
      ta.value = block.text;
      ta.addEventListener('input', () => { block.text = ta.value; persist(); });
      break;
    }

    case 'list': {
      wrap.innerHTML = `
        <div class="field-row">
          <select class="field-style" aria-label="List style">
            <option value="bullet">Bulleted</option>
            <option value="number">Numbered</option>
          </select>
        </div>
        <div class="list-items"></div>
        <button type="button" class="btn btn-small add-item">+ Add item</button>`;
      const styleSel = wrap.querySelector('.field-style');
      styleSel.value = block.style;
      styleSel.addEventListener('change', () => { block.style = styleSel.value; persist(); });

      const itemsEl = wrap.querySelector('.list-items');
      function renderItems() {
        itemsEl.innerHTML = '';
        block.items.forEach((item, i) => {
          const row = document.createElement('div');
          row.className = 'field-row';
          const input = document.createElement('input');
          input.type = 'text';
          input.value = item;
          input.placeholder = 'List item';
          input.addEventListener('input', () => { block.items[i] = input.value; persist(); });
          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'btn btn-small btn-icon';
          rm.title = 'Remove item';
          rm.textContent = '✕';
          rm.addEventListener('click', () => {
            if (block.items.length <= 1) return;
            block.items.splice(i, 1);
            persist();
            renderItems();
          });
          row.appendChild(input);
          row.appendChild(rm);
          itemsEl.appendChild(row);
        });
      }
      renderItems();
      wrap.querySelector('.add-item').addEventListener('click', () => {
        block.items.push('');
        persist();
        renderItems();
      });
      break;
    }

    case 'quote': {
      wrap.innerHTML = `
        <textarea class="field-text" rows="2" placeholder="Quote text"></textarea>
        <input type="text" class="field-cite" placeholder="Citation (optional)">`;
      const ta = wrap.querySelector('.field-text');
      const cite = wrap.querySelector('.field-cite');
      ta.value = block.text;
      cite.value = block.cite || '';
      ta.addEventListener('input', () => { block.text = ta.value; persist(); });
      cite.addEventListener('input', () => { block.cite = cite.value; persist(); });
      break;
    }

    case 'columns': {
      wrap.innerHTML = `
        <div class="field-row">
          <label class="field-label">Number of columns</label>
          <select class="field-count">
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
        <div class="columns-editor"></div>`;
      const countSel = wrap.querySelector('.field-count');
      countSel.value = block.columns.length;
      const colsEl = wrap.querySelector('.columns-editor');

      function renderCols() {
        colsEl.innerHTML = '';
        colsEl.className = 'columns-editor cols-' + block.columns.length;
        block.columns.forEach((c, i) => {
          const ta = document.createElement('textarea');
          ta.rows = 3;
          ta.placeholder = 'Column ' + (i + 1);
          ta.value = c;
          ta.addEventListener('input', () => { block.columns[i] = ta.value; persist(); });
          colsEl.appendChild(ta);
        });
      }
      renderCols();
      countSel.addEventListener('change', () => {
        const n = parseInt(countSel.value, 10);
        while (block.columns.length < n) block.columns.push('');
        while (block.columns.length > n) block.columns.pop();
        persist();
        renderCols();
      });
      break;
    }

    case 'divider': {
      wrap.innerHTML = `<p class="field-hint">A horizontal divider — no extra settings.</p>`;
      break;
    }

    case 'table': {
      wrap.innerHTML = `
        <label class="field-checkbox">
          <input type="checkbox" class="field-header"> First row is a header
        </label>
        <div class="table-editor"></div>
        <div class="table-controls">
          <button type="button" class="btn btn-small add-row">+ Row</button>
          <button type="button" class="btn btn-small add-col">+ Column</button>
        </div>`;
      const headerChk = wrap.querySelector('.field-header');
      headerChk.checked = !!block.headerRow;
      headerChk.addEventListener('change', () => { block.headerRow = headerChk.checked; persist(); });

      const tblEl = wrap.querySelector('.table-editor');
      function renderTable() {
        tblEl.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'editor-table';
        block.rows.forEach((row, r) => {
          const tr = document.createElement('tr');
          row.forEach((cell, c) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell;
            input.addEventListener('input', () => { block.rows[r][c] = input.value; persist(); });
            td.appendChild(input);
            tr.appendChild(td);
          });
          const rmTd = document.createElement('td');
          rmTd.className = 'table-row-remove';
          const rmBtn = document.createElement('button');
          rmBtn.type = 'button';
          rmBtn.className = 'btn btn-small btn-icon';
          rmBtn.title = 'Remove row';
          rmBtn.textContent = '✕';
          rmBtn.addEventListener('click', () => {
            if (block.rows.length <= 1) return;
            block.rows.splice(r, 1);
            persist();
            renderTable();
          });
          rmTd.appendChild(rmBtn);
          tr.appendChild(rmTd);
          table.appendChild(tr);
        });
        tblEl.appendChild(table);
      }
      renderTable();
      wrap.querySelector('.add-row').addEventListener('click', () => {
        const cols = block.rows[0] ? block.rows[0].length : 2;
        block.rows.push(new Array(cols).fill(''));
        persist();
        renderTable();
      });
      wrap.querySelector('.add-col').addEventListener('click', () => {
        block.rows.forEach(row => row.push(''));
        persist();
        renderTable();
      });
      break;
    }
  }

  return wrap;
}

/* ---------- Editable block list (add / reorder / duplicate / delete) ---------- */

function mountEditor(container, blocks, onChange) {
  function persist() { onChange(blocks); }

  function renderBlockItem(block, idx) {
    const item = document.createElement('div');
    item.className = 'block-item';
    item.dataset.id = block.id;

    const header = document.createElement('div');
    header.className = 'block-item-header';
    header.innerHTML = `
      <span class="block-drag-handle" title="Drag to reorder">⠿</span>
      <span class="block-type-label">${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
      <div class="block-item-actions">
        <button type="button" class="btn-icon" data-act="up" title="Move up">↑</button>
        <button type="button" class="btn-icon" data-act="down" title="Move down">↓</button>
        <button type="button" class="btn-icon" data-act="duplicate" title="Duplicate">⧉</button>
        <button type="button" class="btn-icon btn-icon-danger" data-act="delete" title="Delete">✕</button>
      </div>`;

    header.querySelector('[data-act="up"]').addEventListener('click', () => {
      if (idx > 0) {
        [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
        persist();
        renderList();
      }
    });
    header.querySelector('[data-act="down"]').addEventListener('click', () => {
      if (idx < blocks.length - 1) {
        [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
        persist();
        renderList();
      }
    });
    header.querySelector('[data-act="duplicate"]').addEventListener('click', () => {
      const copy = JSON.parse(JSON.stringify(block));
      copy.id = Storage.uid('block');
      blocks.splice(idx + 1, 0, copy);
      persist();
      renderList();
    });
    header.querySelector('[data-act="delete"]').addEventListener('click', async () => {
      const ok = await UI.confirm('Delete this block? This cannot be undone.');
      if (!ok) return;
      blocks.splice(idx, 1);
      persist();
      renderList();
    });

    const body = document.createElement('div');
    body.className = 'block-item-body';
    body.appendChild(renderFields(block, persist, renderList));

    item.appendChild(header);
    item.appendChild(body);
    return item;
  }

  function renderList() {
    container.innerHTML = '';
    if (!blocks.length) {
      const empty = document.createElement('div');
      empty.className = 'block-list-empty';
      empty.textContent = 'No blocks yet — add one below to start building this content.';
      container.appendChild(empty);
    }
    blocks.forEach((block, idx) => container.appendChild(renderBlockItem(block, idx)));
    DragDrop.makeSortable(container, '.block-item', (idsInOrder) => {
      const byId = {};
      blocks.forEach(b => { byId[b.id] = b; });
      const reordered = idsInOrder.map(id => byId[id]).filter(Boolean);
      blocks.length = 0;
      blocks.push(...reordered);
      persist();
    });
  }

  renderList();
  return { refresh: renderList };
}

const Blocks = {
  TYPES: Object.keys(BLOCK_TYPE_LABELS).map(key => ({ key, label: BLOCK_TYPE_LABELS[key] })),
  create: createBlock,
  renderBlockHTML,
  renderAllHTML,
  mountEditor
};
