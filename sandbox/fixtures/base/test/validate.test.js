import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTitle, validatePriority, validateDueDate, validateTask, ValidationError } from '../src/validate.js';

test('validateTitle trims and accepts a normal string', () => {
  assert.equal(validateTitle('  Buy milk  '), 'Buy milk');
});

test('validateTitle rejects empty strings', () => {
  assert.throws(() => validateTitle('   '), ValidationError);
});

test('validatePriority accepts 1..5', () => {
  assert.equal(validatePriority(3), 3);
});

test('validatePriority rejects out-of-range values', () => {
  assert.throws(() => validatePriority(6), ValidationError);
});

test('validateDueDate accepts ISO dates and null', () => {
  assert.equal(validateDueDate('2026-01-01'), '2026-01-01');
  assert.equal(validateDueDate(null), null);
});

test('validateDueDate rejects malformed dates', () => {
  assert.throws(() => validateDueDate('not-a-date'), ValidationError);
});

test('validateTask applies defaults', () => {
  const t = validateTask({ title: 'Ship it' });
  assert.equal(t.priority, 3);
  assert.equal(t.dueDate, null);
});
