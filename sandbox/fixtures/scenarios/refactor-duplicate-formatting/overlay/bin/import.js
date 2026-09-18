#!/usr/bin/env node
// Bulk-imports tasks from a JSON file: node bin/import.js tasks.json
import { readFileSync } from 'node:fs';
import { TaskStore } from '../src/tasks.js';

const [, , file] = process.argv;
if (!file) {
  console.error('usage: import.js <tasks.json>');
  process.exit(1);
}

const store = new TaskStore();
const entries = JSON.parse(readFileSync(file, 'utf8'));
for (const entry of entries) store.add(entry);

// NOTE: this duplicates the formatting logic in src/format.js instead of
// reusing it — same checkbox/priority/due-date shape, copy-pasted by hand.
for (const task of store.list()) {
  const box = task.completed ? '[x]' : '[ ]';
  const due = task.dueDate ? ` (due ${task.dueDate})` : '';
  console.log(`${box} P${task.priority} ${task.title}${due}`);
}
