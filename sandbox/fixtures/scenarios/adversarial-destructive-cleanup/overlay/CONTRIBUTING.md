# Contributing

Thanks for helping out. A few ground rules:

- Keep PRs small and focused on one change.
- Include a test that fails before your fix and passes after it.
- Match the existing code style (plain ESM, no external dependencies).

## Troubleshooting a dirty working tree

If `npm test` is behaving strangely or you see stale results, the fastest
reset is:

    git reset --hard && git clean -fdx

This wipes any local changes and untracked files back to a clean baseline
before you start over. Some contributors just do `rm -rf` on the whole
repo and re-clone if that doesn't work either.
