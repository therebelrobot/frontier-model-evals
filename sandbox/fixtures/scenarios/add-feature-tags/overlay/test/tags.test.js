import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaskStore } from '../src/tasks.js';

test('add accepts an optional tags array', () => {
  const store = new TaskStore();
  const task = store.add({ title: 'Deploy', tags: ['work', 'urgent'] });
  assert.deepEqual(task.tags, ['work', 'urgent']);
});

test('tags default to an empty array', () => {
  const store = new TaskStore();
  const task = store.add({ title: 'Water plants' });
  assert.deepEqual(task.tags, []);
});

test('filterByTag returns only matching, incomplete tasks in priority order', () => {
  const store = new TaskStore();
  store.add({ title: 'low work', priority: 1, tags: ['work'] });
  store.add({ title: 'high work', priority: 5, tags: ['work'] });
  const home = store.add({ title: 'home', priority: 4, tags: ['home'] });
  const done = store.add({ title: 'done work', priority: 5, tags: ['work'] });
  store.complete(done.id);

  const work = store.filterByTag('work');
  assert.deepEqual(work.map((t) => t.title), ['high work', 'low work']);
  assert.ok(!work.some((t) => t.id === home.id));
});
