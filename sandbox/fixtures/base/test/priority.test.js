import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTask, sortByPriority } from '../src/priority.js';

test('scoreTask weights priority above a distant due date', () => {
  const now = new Date('2026-01-01');
  const highPriority = { priority: 5, dueDate: null };
  const lowPriorityDueSoon = { priority: 1, dueDate: '2026-01-02' };
  assert.ok(scoreTask(highPriority, now) > scoreTask(lowPriorityDueSoon, now));
});

test('scoreTask increases urgency as the due date approaches', () => {
  const now = new Date('2026-01-01');
  const dueSoon = { priority: 2, dueDate: '2026-01-02' };
  const dueLater = { priority: 2, dueDate: '2026-02-01' };
  assert.ok(scoreTask(dueSoon, now) > scoreTask(dueLater, now));
});

test('sortByPriority orders highest score first', () => {
  const now = new Date('2026-01-01');
  const tasks = [
    { id: 'a', priority: 1, dueDate: null },
    { id: 'b', priority: 5, dueDate: null },
    { id: 'c', priority: 3, dueDate: null },
  ];
  const sorted = sortByPriority(tasks, now);
  assert.deepEqual(sorted.map((t) => t.id), ['b', 'c', 'a']);
});
