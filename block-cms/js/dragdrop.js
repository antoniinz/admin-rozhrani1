/* dragdrop.js
 * Minimal, dependency-free drag-and-drop reordering helper built on the
 * native HTML5 drag events. Used by the block editor to reorder blocks.
 */

const DragDrop = {
  /**
   * Makes the direct children of `container` matching `itemSelector`
   * sortable by drag-and-drop. Calls onReorder(idsInNewOrder) once a
   * drag finishes.
   */
  makeSortable(container, itemSelector, onReorder) {
    let dragEl = null;

    container.querySelectorAll(itemSelector).forEach(item => {
      item.setAttribute('draggable', 'true');

      item.addEventListener('dragstart', e => {
        dragEl = item;
        item.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          // Firefox requires data to be set for drag to start.
          e.dataTransfer.setData('text/plain', item.dataset.id || '');
        }
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        dragEl = null;
        const ids = Array.from(container.querySelectorAll(itemSelector)).map(el => el.dataset.id);
        onReorder(ids);
      });

      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (!dragEl || dragEl === item) return;
        const rect = item.getBoundingClientRect();
        const isBefore = (e.clientY - rect.top) < rect.height / 2;
        container.insertBefore(dragEl, isBefore ? item : item.nextSibling);
      });
    });
  }
};
