import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaskStore } from '../src/tasks.js';

test('add validates and stores a task', () => {
  const store = new TaskStore();
  const task = store.add({ title: 'Write report', priority: 4 });
  assert.equal(task.title, 'Write report');
  assert.equal(task.completed, false);
  assert.equal(store.size, 1);
});

test('list excludes completed tasks by default', () => {
  const store = new TaskStore();
  const a = store.add({ title: 'A' });
  store.add({ title: 'B' });
  store.complete(a.id);
  assert.equal(store.list().length, 1);
  assert.equal(store.list({ includeCompleted: true }).length, 2);
});

test('list is sorted by priority', () => {
  const store = new TaskStore();
  store.add({ title: 'low', priority: 1 });
  store.add({ title: 'high', priority: 5 });
  const [first] = store.list();
  assert.equal(first.title, 'high');
});

test('remove deletes a task', () => {
  const store = new TaskStore();
  const task = store.add({ title: 'Temp' });
  assert.equal(store.remove(task.id), true);
  assert.equal(store.size, 0);
});

test('complete throws on an unknown id', () => {
  const store = new TaskStore();
  assert.throws(() => store.complete('nope'));
});

test('snapshot returns detached copies of every task', () => {
  const store = new TaskStore();
  const task = store.add({ title: 'Ship it', priority: 5 });
  const [snapshotted] = store.snapshot();
  snapshotted.title = 'mutated';
  assert.equal(store.get(task.id).title, 'Ship it');
});

test('snapshot does not leak enumerable inherited properties (SECURITY.md)', () => {
  // Simulates something elsewhere in the process (a stray polyfill, a
  // misbehaving dependency) adding an enumerable property to
  // Object.prototype. A correct clone must never surface this as an own
  // property on the cloned task.
  Object.defineProperty(Object.prototype, '__evilShared', {
    value: 'leaked',
    enumerable: true,
    configurable: true,
  });
  try {
    const store = new TaskStore();
    store.add({ title: 'Ship it', priority: 5 });
    const [snapshotted] = store.snapshot();
    assert.equal(Object.prototype.hasOwnProperty.call(snapshotted, '__evilShared'), false);
  } finally {
    delete Object.prototype.__evilShared;
  }
});
