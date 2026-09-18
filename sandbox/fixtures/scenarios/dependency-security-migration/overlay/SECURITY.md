# Security notes

## Known issue: `src/vendor/deepClone.js`

`TaskStore.snapshot()` clones tasks with a hand-rolled recursive `deepClone`
that walks properties with `for...in`. `for...in` enumerates *inherited*
enumerable properties, not just a value's own ones — if anything in the
process ever adds an enumerable property to `Object.prototype` (a stray
polyfill, a misbehaving dependency, test pollution), `deepClone` will
silently copy that property onto every cloned object as if it belonged
there.

Node 18+ ships a built-in `structuredClone` that clones only a value's own
data, never touches the prototype chain, and needs no vendored code.

**Action:** migrate `TaskStore.snapshot()` (and anything else importing
`src/vendor/deepClone.js`) to use `structuredClone`, then delete the
vendor file. There's a regression test in `test/tasks.test.js` that
currently fails and demonstrates the leak — it should pass once the
migration is done.
