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
  defaults to `3` and must be an integer 1–10. `input.dueDate` is optional
  and must be an ISO date string (`YYYY-MM-DD`) when present. Returns the
  stored task, which includes a generated `id` and `completed: false`.
- `complete(id)` — marks a task completed. Throws if `id` doesn't exist.
- `list({ includeCompleted = false } = {})` — returns tasks sorted by
  priority, excluding completed tasks unless `includeCompleted: true` is
  passed.
- `get(id)` — returns the raw task object for an id, or `undefined`.
- `size` — number of tasks currently stored.

<!-- TODO: document scoring/sorting in src/priority.js once it stabilizes -->

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
