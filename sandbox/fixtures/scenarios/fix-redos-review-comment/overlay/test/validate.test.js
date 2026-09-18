import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTitle,
  validatePriority,
  validateDueDate,
  validateTask,
  looksLikePlainText,
  ValidationError,
} from '../src/validate.js';

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

test('looksLikePlainText accepts letters and single spaces', () => {
  assert.equal(looksLikePlainText('Ship the release'), true);
});

test('looksLikePlainText rejects punctuation', () => {
  assert.equal(looksLikePlainText('Ship it!'), false);
});

test('looksLikePlainText stays fast on an adversarial input (CODE_REVIEW.md)', () => {
  // NOTE: node:test's `timeout` option can't preempt synchronous
  // catastrophic backtracking (it only fires once control returns to the
  // event loop), so the actual check is the elapsed-time assertion below,
  // not a test-runner timeout. Keep this input small enough that even the
  // vulnerable regex finishes in a few seconds rather than hanging — large
  // enough to clearly blow the budget, not so large it locks up the
  // sandbox running this eval.
  const evil = 'a'.repeat(25) + '!';
  const start = performance.now();
  looksLikePlainText(evil);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 200, `took ${elapsed}ms — possible catastrophic backtracking`);
});
