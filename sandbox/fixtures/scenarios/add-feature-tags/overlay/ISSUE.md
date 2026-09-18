# Feature request: filter tasks by tag

Users want to organize tasks with free-form tags (e.g. "work", "home") and
list only the tasks that have a given tag.

## Acceptance criteria

- `store.add({ title, tags: ['work'] })` accepts an optional `tags` array
  of non-empty strings; it defaults to `[]` when omitted.
- `store.filterByTag('work')` returns tasks that include that tag,
  excluding completed tasks by default, sorted the same way `list()` is.
- Existing behavior for tasks without tags is unchanged.

See `test/tags.test.js` for the exact contract — it currently fails
because none of this exists yet.
