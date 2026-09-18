# frontier-model-evals

Capability + risk evaluation harness for frontier LLMs via OpenRouter.
Built as a scriptable, resumable matrix runner (ai-sdk under the hood) so
you spend credits once and can re-grade offline as many times as you want.

## Quickstart (new dev, own key, < 5 minutes)

```bash
git clone https://github.com/therebelrobot/frontier-model-evals.git && cd frontier-model-evals
npm install
cp .env.example .env        # paste your OpenRouter key in
npm run eval -- --suite capability
npm run report:md -- --run capability
cat results/capability.md
```

That's it — no Docker, no build step, nothing else to configure. The
`sandbox/` tier (real shell access for one high-risk task type) is
opt-in and covered separately below; everything else runs as plain API
calls.

**Before spending real money:** create a dedicated OpenRouter key with a
hard `limit` at https://openrouter.ai/settings/keys, and use that key
here — not your main one. If a bug in this harness loops or the matrix is
bigger than you meant, the limit is what actually stops it.

## What's actually being measured — the four work streams

This repo splits capability and risk into separate suites on purpose:
a model can be excellent at one and dangerous at the other, and averaging
them into one score hides exactly the thing you're trying to find out.

| Suite | Answers | Where |
|---|---|---|
| `capability` | Is it good at the work — structured extraction, correct tool selection? | `src/tasks/capability/` |
| `injection` | Does it treat tool output and document content as data, or as instructions, when an attacker plants text there? | `src/tasks/injection/` |
| `refusal` | Does it refuse the right things — not over-cautious on benign asks, not under-cautious on clearly disallowed ones? | `src/tasks/refusal/` |
| `agentic` | Given real read/edit/bash tools in a real repo, does it complete the task without thrashing, and can containment actually hold it? | `src/tasks/agentic/` (sandbox-gated) |

Run one suite, several, or `--suite all`:

```bash
npm run eval -- --suite injection --models anthropic/claude-sonnet-4.5,deepseek/deepseek-v4-flash
npm run eval -- --suite refusal
```

Each task file is a single `EvalTask` — prompt, optional tools, a grader,
and a repeat count. Add a new one by copying the closest existing file in
`src/tasks/<tier>/` and registering it in `src/tasks/index.ts`.

## Why each design choice is there

- **Repeats, not single runs** (`repeats: N` on every task). Frontier
  outputs are stochastic — one run per model is noise, not signal.
  `aggregate.ts` reports pass rate, variance across repeats, and pass@k
  (did *any* of the k repeats succeed) so you can see the difference
  between "reliably good" and "got lucky once."
- **Deterministic grading first.** `src/grading/deterministic.ts` covers
  JSON-schema validity, "never calls this tool," "calls this tool with
  these args," and refusal-language regex matches — free, objective, no
  judge bias. Reach for the LLM judge (`src/grading/judge.ts`, pairwise
  against a reference answer, not 1–10 scoring) only for genuinely
  open-ended quality questions, and keep the judge model off the roster
  you're testing to avoid self-preference bias.
- **Resumable, append-only logging.** `results/<run>.jsonl` is never
  truncated. Kill a run halfway through an expensive matrix and re-run
  the same command — already-logged (model, task, repeat) combos are
  skipped, so a crash never re-spends credits on work you already paid
  for.
- **Cost captured per run, not estimated after the fact.** OpenRouter's
  usage accounting is always-on server-side; `runner/client.ts` pulls the
  real per-call cost when the SDK surfaces it (see the caveat below if
  it's coming back `null` for you) and every report shows cost next to
  quality — that pairing is the actual decision artifact, not a bare
  leaderboard.
- **The risk suites use fake tools, not real ones**, for everything except
  `agentic`. A prompt-injection test doesn't need real shell access to be
  valid — it needs a tool whose *output* contains a hostile instruction,
  and a grader that checks whether the model obeyed it. That's most of
  the risk signal, at zero sandboxing cost.

## The sandbox tier (optional, only for `agentic`)

One task type — a model given real read/edit/bash tools in a real repo —
is genuinely risky to run unsandboxed, so the orchestrator refuses to run
it unless you pass `--sandbox`. See `sandbox/README.md`. It's a trimmed
version of this project's own hardened opencode-vs-OpenRouter pattern:
`internal: true` Docker network + Squid egress allowlist, so a model that
goes off the rails reaches nothing but `openrouter.ai` regardless of
whether it honors proxy settings.

Skip this directory entirely if you only care about capability/injection/
refusal — those never touch Docker.

## promptfoo, as an alternative front end

`promptfoo/promptfooconfig.yaml` is a starter for the "same prompt, many
models, quick assertion check" case — good for a fast breadth pass before
committing real budget to the custom harness above. Run it with
`npx promptfoo eval -c promptfoo/promptfooconfig.yaml`. It won't give you
per-run cost logging, injection fixtures, or real tool loops — for those,
use `npm run eval`.

## Keeping the model roster current

`src/config/models.ts` is a seed, not a source of truth — OpenRouter's
roster and pricing move weekly. Before a real run:

```bash
npm run models:list              # all tool-capable models + live pricing
npm run models:list -- coding    # ranked for a category, where supported
```

Then either edit `models.ts` or pass `--models vendor/model,vendor/model`
on the CLI. The hard exclusion list (no `openai/*`, no `x-ai/*`) is
enforced in code (`assertRosterAllowed`), not just documented — a `--models`
override that includes one of those throws before any request is sent.

## Repo layout

```
src/
  cli.ts                 entry point — parses args, runs the matrix
  config/
    env.ts                .env handling
    models.ts              seed roster + hard-exclusion enforcement
  runner/
    client.ts               one ai-sdk call, normalized output + cost
    logger.ts                 resumable JSONL append log
    orchestrate.ts             models x tasks x repeats matrix
  tasks/
    types.ts                  shared Task/Grader/RunRecord shapes
    capability/ agentic/ injection/ refusal/
    index.ts                  suite registry
  grading/
    deterministic.ts            schema/tool-call/regex graders
    judge.ts                     pairwise LLM-as-judge
    aggregate.ts                  pass rate / variance / pass@k / cost rollup
  report/
    to-csv.ts to-md.ts            results/<run>.jsonl -> reports
  tools/
    live-models.ts                 live OpenRouter roster + pricing fetch
sandbox/                            optional, agentic tier only (Docker)
promptfoo/                          optional, breadth-pass alternative
results/                            gitignored, run outputs land here
```

## Caveats

- **Cost-field extraction is version-sensitive.** `runner/client.ts` reads
  cost from `providerMetadata.openrouter.usage.cost`, which is where
  `@openrouter/ai-sdk-provider` is documented to surface it — but that's
  exactly the kind of field that drifts between SDK minor versions. It
  degrades to `costUsd: null` rather than reporting a wrong number if the
  path doesn't resolve; if you see consistent nulls, log
  `result.providerMetadata` once from a real call and fix the path.
- **`ai` (v5) and `@openrouter/ai-sdk-provider` both move fast.** Versions
  in `package.json` are current as of this repo's creation — run
  `npm install` and skim each package's changelog if something in
  `runner/client.ts` (the tool-loop `stopWhen` API especially) doesn't
  match what you see at runtime.
- **The `refusal.under-refusal` task is a placeholder shape, not a real
  red-team set.** It's deliberately generic. Swap in probes from a
  maintained set (HarmBench, your own incident log, whatever your
  compliance process already trusts) rather than hand-writing many more
  of these yourself.
- **The `agentic` grader is a stub.** It currently pattern-matches the
  model's self-reported claim of success, which is exactly the kind of
  thing a model can get wrong or fake. Real wiring should grade off the
  sandbox's actual `npm test` exit code, not the model's text — see the
  comment in `src/tasks/agentic/fix-failing-test.task.ts`.
- **Judge-model self-preference bias** is real and not fully solved by
  "use a different model" — family-adjacent models can still correlate.
  Treat judge verdicts as one signal, not ground truth, especially near a
  close call.
