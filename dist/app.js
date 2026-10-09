'use strict';

const STORAGE_KEY = 'taskflow.tasks.v1';
const FILTERS = ['all', 'active', 'completed'];
const PRIORITIES = ['normal', 'high', 'low'];
let tasks = [];
let currentFilter = 'all';
let editingId = null;
let pendingAction = null;
let sequence = 0;
let storageWarning = '';
const elements = {
  list: document.getElementById('task-list'),
  search: document.getElementById('search'),
  sort: document.getElementById('sort'),
  title: document.getElementById('new-title'),
  priority: document.getElementById('new-priority'),
  notice: document.getElementById('notice'),
  edit: document.getElementById('edit-dialog'),
  confirm: document.getElementById('confirm-dialog')
};

// Custom validation helper, not an API function. Checks stored object shape before use.
function isValidTask(task) {
  return task !== null && typeof task === 'object' && typeof task.id === 'string'
    && /^[a-z0-9-]+$/.test(task.id) && typeof task.title === 'string'
    && task.title.trim().length > 0 && task.title.length <= 160
    && PRIORITIES.includes(task.priority) && typeof task.completed === 'boolean'
    && Number.isFinite(task.createdAt) && Number.isFinite(new Date(task.createdAt).getTime());
}

// Web Storage API: reads localStorage.getItem; JSON.parse is standard JavaScript, not a browser API.
// Corrupt or inaccessible data is reported without overwriting it at startup.
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    const data = JSON.parse(saved);
    if (!Array.isArray(data)) throw new Error('Invalid task list');
    const ids = new Set();
    for (const task of data) {
      if (!isValidTask(task) || ids.has(task.id)) throw new Error('Invalid task');
      ids.add(task.id);
    }
    return data;
  } catch (error) {
    storageWarning = 'Saved data could not be loaded. You can use this tab, but changes may replace invalid data.';
    return [];
  }
}

// Web Storage API: localStorage.setItem persists this app's array; catches blocked storage or full quota.
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageWarning = '';
  } catch (error) {
    storageWarning = 'Changes are only in this tab: browser storage is unavailable or full.';
  }
}

// DOM API: updates a live status message and persistence status using safe textContent.
function announce(message) {
  elements.notice.textContent = storageWarning || message;
  document.getElementById('save-status').textContent = storageWarning ? 'Storage needs attention' : 'Saved on this device';
}

// Custom helper, not an API function. Builds a tab-local unique ID with standard JavaScript Date and a counter.
function makeId() {
  sequence += 1;
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9) + '-' + sequence;
}

// DOM API: creates an element and inserts plain text, never interpreting task titles as HTML.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Custom array predicate, not an API function. Combines the selected view and case-insensitive search.
function matchesView(task) {
  const statusMatches = currentFilter === 'all'
    || (currentFilter === 'active' && !task.completed)
    || (currentFilter === 'completed' && task.completed);
  return statusMatches && task.title.toLocaleLowerCase().includes(elements.search.value.trim().toLocaleLowerCase());
}

// Custom Array.sort comparator, not an API function. Orders tasks by time or priority with a stable tie-breaker.
function compareTasks(left, right) {
  const mode = elements.sort.value;
  if (mode === 'priority') {
    const rank = {high: 0, normal: 1, low: 2};
    const difference = rank[left.priority] - rank[right.priority];
    if (difference !== 0) return difference;
  }
  const difference = mode === 'oldest' ? left.createdAt - right.createdAt : right.createdAt - left.createdAt;
  return difference || left.id.localeCompare(right.id);
}

// DOM API: constructs one list item with a labeled checkbox, metadata and edit/delete controls.
function createTaskRow(task) {
  const row = makeElement('li', 'task-row' + (task.completed ? ' completed' : ''));
  row.dataset.id = task.id;
  const checkbox = makeElement('input', 'task-check');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', 'Mark ' + task.title + (task.completed ? ' incomplete' : ' complete'));
  const content = makeElement('div', 'task-content');
  content.append(makeElement('span', 'task-title', task.title));
  const meta = makeElement('div', 'task-meta');
  meta.append(makeElement('span', 'badge ' + task.priority, task.priority + ' priority'));
  meta.append(makeElement('span', '', new Date(task.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})));
  content.append(meta);
  const actions = makeElement('div', 'row-actions');
  for (const action of ['edit', 'delete']) {
    const button = makeElement('button', 'row-action ' + action, action === 'edit' ? 'Edit' : 'Delete');
    button.type = 'button';
    button.dataset.action = action;
    button.setAttribute('aria-label', (action === 'edit' ? 'Edit ' : 'Delete ') + task.title);
    actions.append(button);
  }
  row.append(checkbox, content, actions);
  return row;
}

// DOM API: replaceChildren, createDocumentFragment, attributes and progress properties render the list and counters.
// Array.filter and Array.sort are standard JavaScript methods.
function render() {
  const shown = tasks.filter(matchesView).sort(compareTasks);
  const fragment = document.createDocumentFragment();
  for (const task of shown) fragment.append(createTaskRow(task));
  elements.list.replaceChildren(fragment);
  let completed = 0;
  for (const task of tasks) if (task.completed) completed += 1;
  const remaining = tasks.length - completed;
  const percentage = tasks.length ? Math.round(completed / (tasks.length / 100)) : 0;
  document.getElementById('remaining').textContent = remaining;
  document.getElementById('done').textContent = completed;
  document.getElementById('count-all').textContent = tasks.length;
  document.getElementById('count-active').textContent = remaining;
  document.getElementById('count-completed').textContent = completed;
  document.getElementById('percentage').textContent = percentage + '%';
  const progress = document.getElementById('progress');
  progress.value = percentage;
  progress.textContent = percentage + '%';
  document.getElementById('progress-copy').textContent = tasks.length === 0 ? 'A fresh list. A fresh start.' : remaining === 0 ? 'All done. Enjoy a little breathing room.' : remaining + ' small steps ahead.';
  const titles = {all: 'All tasks', active: 'In progress', completed: 'Completed'};
  document.getElementById('view-title').textContent = titles[currentFilter];
  for (const button of document.querySelectorAll('[data-filter]')) {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  const empty = document.getElementById('empty');
  empty.hidden = shown.length !== 0;
  document.getElementById('empty-title').textContent = tasks.length === 0 ? 'Room for a fresh start.' : 'Nothing here right now.';
  document.getElementById('empty-copy').textContent = tasks.length === 0 ? 'Add your first task above. Keep it small and specific.' : 'Try another view or a different search.';
  document.getElementById('visible-count').textContent = shown.length + (shown.length === 1 ? ' task shown' : ' tasks shown');
  document.getElementById('clear-completed').disabled = completed === 0;
}

// DOM event handler (submit): validates input, adds a custom task object, then uses Web Storage and DOM helpers.
function handleAdd(event) {
  event.preventDefault();
  const title = elements.title.value.trim();
  if (!title) {
    elements.title.setCustomValidity('Please enter a task, not just spaces.');
    elements.title.reportValidity();
    return;
  }
  tasks.push({id: makeId(), title, priority: elements.priority.value, completed: false, createdAt: Date.now()});
  saveTasks();
  elements.title.value = '';
  render();
  announce('Task added.');
  elements.title.focus();
}

// DOM API input event handler: clears native form validation after the user changes a title.
function clearTitleError(event) {
  event.target.setCustomValidity('');
}

// DOM API delegated click handler: closest finds a task row; checkbox clicks update completion.
function handleTaskAction(event) {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const row = control.closest('[data-id]');
  if (!row) return;
  let task = null;
  for (const candidate of tasks) if (candidate.id === row.dataset.id) task = candidate;
  if (!task) return;
  if (control.dataset.action === 'toggle') {
    task.completed = control.checked;
    saveTasks();
    render();
    announce(task.completed ? 'Task completed.' : 'Task reopened.');
    const replacement = document.querySelector('[data-id="' + task.id + '"] .task-check');
    if (replacement) replacement.focus();
    else document.querySelector('[data-filter="' + currentFilter + '"]').focus();
  } else if (control.dataset.action === 'edit') {
    editingId = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-priority').value = task.priority;
    elements.edit.showModal();
  } else if (control.dataset.action === 'delete') {
    pendingAction = {type: 'delete', id: task.id};
    openConfirmation('Delete this task?', '“' + task.title + '” will be removed.');
  }
}

// HTML dialog/DOM API: opens a native modal with a plain-text description for deletion confirmation.
function openConfirmation(title, description) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-description').textContent = description;
  elements.confirm.showModal();
}

// DOM submit event and dialog API: saves changed title/priority without changing ID or completion status.
function handleEdit(event) {
  event.preventDefault();
  const input = document.getElementById('edit-title');
  const title = input.value.trim();
  if (!title) { input.setCustomValidity('Please enter a task title.'); input.reportValidity(); return; }
  for (const task of tasks) {
    if (task.id === editingId) {
      task.title = title;
      task.priority = document.getElementById('edit-priority').value;
    }
  }
  saveTasks();
  elements.edit.close();
  render();
  announce('Task updated.');
  focusTaskOrInput(editingId);
  editingId = null;
}

// DOM API: restores keyboard focus after rendering, falling back to the new-task input.
function focusTaskOrInput(id) {
  const button = document.querySelector('[data-id="' + id + '"] [data-action="edit"]');
  if (button) button.focus();
  else elements.title.focus();
}

// DOM click handler and HTML dialog API: cancels an edit without altering task data.
function cancelEdit() {
  elements.edit.close();
  editingId = null;
}

// DOM click handler and HTML dialog API: cancels bulk or individual deletion.
function cancelConfirmation() {
  pendingAction = null;
  elements.confirm.close();
}

// DOM API handler: requests confirmation before removing all completed tasks.
function requestClearCompleted() {
  pendingAction = {type: 'completed'};
  openConfirmation('Clear completed tasks?', 'Completed tasks will be deleted. Your unfinished tasks will stay.');
}

// DOM API handler: requests confirmation before resetting this application's local storage key.
function requestReset() {
  pendingAction = {type: 'reset'};
  openConfirmation('Reset your workspace?', 'All tasks will be removed from this browser. This cannot be undone.');
}

// Custom Array.filter predicate, not an API function. Keeps only unfinished tasks for bulk cleanup.
function isIncomplete(task) {
  return !task.completed;
}

// Custom Array.filter predicate, not an API function. Keeps every task except the confirmed deletion target.
function keepTask(task) {
  return task.id !== pendingAction.id;
}

// DOM submit handler and Web Storage API: performs confirmed deletion; reset uses removeItem on our key only.
function confirmDeletion(event) {
  event.preventDefault();
  if (!pendingAction) { elements.confirm.close(); return; }
  if (pendingAction.type === 'reset') {
    tasks = [];
    try { localStorage.removeItem(STORAGE_KEY); storageWarning = ''; }
    catch (error) { storageWarning = 'This tab is cleared, but stored tasks could not be removed.'; }
  } else {
    tasks = pendingAction.type === 'completed' ? tasks.filter(isIncomplete) : tasks.filter(keepTask);
    saveTasks();
  }
  pendingAction = null;
  elements.confirm.close();
  render();
  announce('Tasks removed.');
  elements.title.focus();
}

// URL/Location API: reads the filter query parameter; unrecognized values fall back to All tasks.
function readFilter() {
  const value = new URL(window.location.href).searchParams.get('view');
  return FILTERS.includes(value) ? value : 'all';
}

// DOM click handler, URL API and History API: pushState records filter changes without reloading.
function changeView(event) {
  const value = event.currentTarget.dataset.filter;
  if (value === currentFilter) return;
  currentFilter = value;
  const url = new URL(window.location.href);
  url.searchParams.set('view', value);
  try { history.pushState({view: value}, '', url); }
  catch (error) { announce('The view changed, but browser history is unavailable.'); }
  render();
}

// History API popstate event: restores the filter when Back or Forward activates a history entry.
function restoreHistory() {
  currentFilter = readFilter();
  render();
}

// Web Storage API storage event: refreshes tasks when another same-origin tab changes our storage key.
function syncTabs(event) {
  if ((event.key === STORAGE_KEY || event.key === null) && event.storageArea === localStorage) {
    tasks = loadTasks();
    if (elements.edit.open) elements.edit.close();
    if (elements.confirm.open) elements.confirm.close();
    pendingAction = null;
    editingId = null;
    render();
    announce('Tasks updated from another tab.');
  }
}

// DOM API: registers named event handlers; History API initializes the current filter entry.
function initialize() {
  tasks = loadTasks();
  currentFilter = readFilter();
  try { history.replaceState({view: currentFilter}, '', window.location.href); }
  catch (error) { // History may be blocked in restricted contexts; the list remains usable.
 }
  document.getElementById('add-form').addEventListener('submit', handleAdd);
  elements.title.addEventListener('input', clearTitleError);
  document.getElementById('edit-title').addEventListener('input', clearTitleError);
  elements.list.addEventListener('click', handleTaskAction);
  elements.search.addEventListener('input', render);
  elements.sort.addEventListener('change', render);
  document.getElementById('edit-form').addEventListener('submit', handleEdit);
  document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
  document.getElementById('confirm-form').addEventListener('submit', confirmDeletion);
  document.getElementById('cancel-confirm').addEventListener('click', cancelConfirmation);
  document.getElementById('clear-completed').addEventListener('click', requestClearCompleted);
  document.getElementById('reset').addEventListener('click', requestReset);
  for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', changeView);
  window.addEventListener('popstate', restoreHistory);
  window.addEventListener('storage', syncTabs);
  render();
  announce('');
}

initialize();
