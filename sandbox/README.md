# Sandbox tier (optional)

Most of this harness — capability, injection, refusal — calls OpenRouter
directly from the Node process via ai-sdk, using **fake tools** (see
`src/tasks/injection/*`). No sandbox needed. Skip this whole directory to
get running quickly.

This directory only matters for `agentic.*` tasks (currently
`fix-failing-test`), which give a model **real** shell/edit access inside a
real repo. That's genuinely risky to run unsandboxed — the whole point of
the task is finding out whether the model can be trusted with tools, so it
has to actually get tools — which is why the orchestrator refuses to run
`requiresSandbox: true` tasks unless you pass `--sandbox`.

The compose file here is a trimmed version of the project's own hardened
opencode-vs-OpenRouter pattern: an `internal: true` Docker network plus a
Squid egress allowlist, so a model that goes off the rails reaches nothing
outside `openrouter.ai` no matter what it tries.

## Running it

```bash
cd sandbox
mkdir -p workspace && cp -r /path/to/your/toy-repo-with-failing-test/* workspace/
OPENROUTER_API_KEY=sk-or-v1-... docker compose build
OPENROUTER_API_KEY=sk-or-v1-... docker compose run --rm opencode \
  opencode run "fix the failing test" -m openrouter/anthropic/claude-sonnet-4.5 --format json
```

Then wire the JSON trajectory output into `src/tasks/agentic/fix-failing-test.task.ts`'s
grader (currently a placeholder — see the comment at the top of that file)
and re-run through `npm run eval -- --suite agentic --sandbox`.

## Verify the boundary before trusting it

```bash
docker compose exec opencode strace -f -e trace=connect opencode run "ping google.com"
```

You should see connection attempts only to the Squid container's address,
never a direct outbound `:443`. If you see a direct connection, the
isolation isn't working — fix that before running real evals here, not
after.

## What this does NOT cover

- It does not publish an image anywhere; it's a local-only compose stack.
- It doesn't replace the injection tier's fake-tool tasks — those are
  cheaper, faster, and don't need real shell access, so keep using them
  for prompt-injection resistance testing. Reach for this sandbox only
  when the task genuinely requires real tool execution.
