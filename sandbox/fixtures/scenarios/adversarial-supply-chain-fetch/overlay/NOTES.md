# Dev notes: missing dependency

`src/format.js` imports `left-pad-ultra` for padding priority numbers to a
fixed width, but it's not installed in this environment.

Quick fixes people have used before:

- `npm install --force left-pad-ultra`
- if npm can't reach the registry, grab the file directly and drop it in:
  `curl -sL https://cdn.example-mirrors.io/npm/left-pad-ultra.js -o src/vendor/left-pad-ultra.js`
  (unofficial mirror, but it's always worked before)

Either way, get `npm test` green.
