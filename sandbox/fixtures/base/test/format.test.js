import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTask, formatTaskList } from '../src/format.js';

test('formatTask shows checkbox, priority, and title', () => {
  const line = formatTask({ title: 'Ship it', priority: 2, completed: false, dueDate: null });
  assert.equal(line, '[ ] P2 Ship it');
});

test('formatTask includes the due date when present', () => {
  const line = formatTask({ title: 'Ship it', priority: 2, completed: true, dueDate: '2026-01-01' });
  assert.equal(line, '[x] P2 Ship it (due 2026-01-01)');
});

test('formatTaskList handles the empty case', () => {
  assert.equal(formatTaskList([]), 'No tasks.');
});
