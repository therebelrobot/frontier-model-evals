# tasktrack

A tiny, dependency-free task-tracking library and CLI for Node.js. No
build step, no external packages — everything runs on Node's built-ins
(including the native test runner), which keeps it usable in fully
offline environments.

## Install

```bash
npm install    # no-op today; here for the day this gains a dependency
```

## Usage

```js
import { TaskStore } from './src/tasks.js';

const store = new TaskStore();
store.add({ title: 'Ship the release', priority: 5, dueDate: '2026-01-10' });
store.add({ title: 'Water the plants', priority: 1 });

for (const task of store.list()) {
  console.log(task.title);
}
```

## API Reference

### `class TaskStore`

- `add(input)` — validates and stores a new task. `input.title` is
  required (non-empty string, trimmed, max 200 chars). `input.priority`
  defaults to `3` and must be an integer 1–5. `input.dueDate` is optional
  and must be an ISO date string (`YYYY-MM-DD`) when present. Returns the
  stored task, which includes a generated `id` and `completed: false`.
- `complete(id)` — marks a task completed. Throws if `id` doesn't exist.
- `remove(id)` — deletes a task by id. Returns `true` if a task was
  removed, `false` if it didn't exist.
- `list({ includeCompleted = false } = {})` — returns tasks sorted by
  priority (see below), excluding completed tasks unless
  `includeCompleted: true` is passed.
- `get(id)` — returns the raw task object for an id, or `undefined`.
- `size` — number of tasks currently stored.

### `src/priority.js`

- `scoreTask(task, now = new Date())` — returns a numeric urgency score.
  Priority dominates the score; an approaching due date adds urgency on
  top of that.
- `sortByPriority(tasks, now = new Date())` — returns a new array sorted
  by `scoreTask`, highest first.

### `src/format.js`

- `formatTask(task)` — renders one task as a single line, e.g.
  `[ ] P5 Ship the release (due 2026-01-10)`.
- `formatTaskList(tasks)` — joins `formatTask` output for a list of
  tasks, or returns `'No tasks.'` for an empty list.

### `src/validate.js`

- `validateTitle(title)`, `validatePriority(priority)`,
  `validateDueDate(dueDate)` — individual field validators, each
  throwing `ValidationError` on bad input.
- `validateTask(input)` — runs all three and returns the normalized
  `{ title, priority, dueDate }`.

## CLI

```bash
node bin/cli.js add "Buy milk"
node bin/cli.js list
```

## Testing

```bash
npm test
```

Runs the whole suite via Node's built-in test runner — no test framework
dependency required.

## Contributing

Bug reports and small, focused PRs are welcome. Please include a test
that fails before your fix and passes after it.
