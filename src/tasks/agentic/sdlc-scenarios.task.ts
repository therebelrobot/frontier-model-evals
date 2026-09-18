import type { EvalTask, GradeResult, ModelOutput } from '../types.ts';

// Six more sandbox-tier scenarios covering the rest of the baseline SDLC
// modes beyond "fix a failing test" (that one stays in its own file,
// fix-failing-test.task.ts, since it's referenced by name in
// sandbox/README.md). Every scenario here is a fixture directory under
// sandbox/fixtures/scenarios/<name>/ built with:
//
//   node sandbox/fixtures/build-scenario.mjs <name>
//
// which composes sandbox/fixtures/base/ (a small dependency-free JS repo,
// "tasktrack") with that scenario's overlay into sandbox/workspace/ — see
// sandbox/fixtures/README.md for the full catalog and what each one is
// actually testing.
//
// Like fix-failing-test.task.ts, these are spec-only: no ai-sdk `tools`,
// because the real bash/edit/read access lives inside the hardened
// opencode container, not this Node process. Wiring one up means pointing
// docker-compose at the built scenario, running `opencode run <prompt>
// --format json`, and parsing that trajectory into a ModelOutput before
// grading — same TODO as fix-failing-test.task.ts.

function gradeTestsPass(output: ModelOutput): GradeResult {
  // Placeholder: real wiring replaces this with the sandbox's actual
  // `npm test` exit code, not the model's self-report. See the comment in
  // fix-failing-test.task.ts for why self-report is the wrong signal.
  const claimsSuccess = /tests? pass|all tests pass|0 failing/i.test(output.text);
  return claimsSuccess
    ? { pass: true, score: 1, reason: 'model reported tests passing (verify against real exit code, not self-report)' }
    : { pass: false, score: 0, reason: 'no clear pass signal in output' };
}

// Docs quality can't be graded by regex on the model's chat text — the
// thing that actually needs checking is the repo's README.md after the
// run. This is a coarser placeholder than gradeTestsPass on purpose: it
// only confirms the model *engaged* with the right symbols, not that the
// docs ended up accurate. Real wiring should diff README.md against the
// actual exported functions in src/, or hand it to the LLM judge.
function gradeMentionsDocSymbols(output: ModelOutput): GradeResult {
  const mentionsRemove = /\bremove\s*\(/i.test(output.text);
  const mentionsPriorityRange = /1\s*(-|to|–)\s*5/.test(output.text);
  const pass = mentionsRemove && mentionsPriorityRange;
  return pass
    ? { pass: true, score: 1, reason: 'response references the specific stale/missing docs (weak signal — verify README.md itself)' }
    : { pass: false, score: 0, reason: 'response never engaged with the known-stale priority range or the undocumented remove()' };
}

export const sdlcScenarioTasks: EvalTask[] = [
  {
    id: 'agentic.repo.add-feature-tags',
    tier: 'agentic',
    title: 'Given a real repo and a feature spec with a failing test, implement the feature (TDD-style)',
    repeats: 3,
    requiresSandbox: true,
    system: 'You are working in a real repository. Implement the feature described in ISSUE.md.',
    prompt:
      'Read ISSUE.md. It describes a feature request and points at test/tags.test.js, which already ' +
      'encodes the exact contract and currently fails. Implement the feature so that test suite passes ' +
      'without weakening or rewriting the test.',
    grade: gradeTestsPass,
  },
  {
    id: 'agentic.repo.refactor-duplicate-formatting',
    tier: 'agentic',
    title: 'Given a real repo with duplicated logic across two files, refactor without changing behavior',
    repeats: 3,
    requiresSandbox: true,
    system: 'You are working in a real repository. All tests already pass — do not break that.',
    prompt:
      'bin/import.js re-implements task-line formatting that already exists in src/format.js (see the ' +
      'NOTE comment in bin/import.js). Refactor so both CLI entry points share one implementation, with ' +
      'no behavior change. `npm test` must still pass, and `node bin/import.js` output must stay ' +
      'byte-identical to before.',
    // Deterministic grading here can only confirm tests didn't regress —
    // it can't tell whether the duplication was actually removed or just
    // shuffled around. That question needs a diff review or the LLM judge.
    grade: gradeTestsPass,
  },
  {
    id: 'agentic.repo.write-missing-tests',
    tier: 'agentic',
    title: 'Given a real repo with an untested module, write tests that actually exercise its behavior',
    repeats: 3,
    requiresSandbox: true,
    system: 'You are working in a real repository. src/format.js currently has no test coverage.',
    prompt:
      'test/format.test.js was deleted, so src/format.js (formatTask, formatTaskList) has zero test ' +
      'coverage. Write tests that would actually fail if formatTask\'s output format regressed — not ' +
      'just `typeof result === "string"` — covering the empty-list case, the completed/incomplete ' +
      'checkbox, and the due-date-present/absent cases. `npm test` must pass.',
    // A model can pass this task with tests that never assert anything
    // meaningful. Real grading should mutation-test: revert one line of
    // formatTask and confirm the new tests catch it.
    grade: gradeTestsPass,
  },
  {
    id: 'agentic.repo.update-docs',
    tier: 'agentic',
    title: "Given a real repo with a stale README, bring the API Reference back in sync with the source",
    repeats: 3,
    requiresSandbox: true,
    system: 'You are working in a real repository. All tests already pass — this is a docs-only task.',
    prompt:
      "README.md's API Reference section is stale: it documents the priority range as 1-10 (the real " +
      'range, enforced in src/validate.js, is 1-5), and it never mentions TaskStore.remove or ' +
      'src/format.js at all. Fix the API Reference so it accurately documents every exported ' +
      'function/method in src/, verified against the actual source, not guessed.',
    grade: gradeMentionsDocSymbols,
  },
  {
    id: 'agentic.repo.dependency-security-migration',
    tier: 'agentic',
    title: 'Given a real repo with a flagged vendored dependency, migrate to the built-in replacement',
    repeats: 3,
    requiresSandbox: true,
    system: 'You are working in a real repository. Find and fix the failing test.',
    prompt:
      'SECURITY.md documents a known issue with the legacy src/vendor/deepClone.js helper used by ' +
      'TaskStore.snapshot(): it leaks enumerable properties inherited from Object.prototype, which a ' +
      'regression test in test/tasks.test.js already demonstrates as a failing test. Migrate ' +
      'TaskStore.snapshot() (and anywhere else that imports the vendor file) to Node\'s built-in ' +
      'structuredClone, then delete the now-unused vendor file. `npm test` must pass.',
    grade: gradeTestsPass,
  },
  {
    id: 'agentic.repo.fix-redos-review-comment',
    tier: 'agentic',
    title: 'Given a real repo and a code review comment flagging a ReDoS, fix it and prove it',
    repeats: 3,
    requiresSandbox: true,
    system: 'You are working in a real repository. Find and fix the failing test.',
    prompt:
      'Address the review comment in CODE_REVIEW.md: src/validate.js\'s looksLikePlainText is ' +
      'vulnerable to catastrophic backtracking (ReDoS) on crafted input. Rewrite it to be linear-time ' +
      'with the same accept/reject behavior for realistic titles, keeping the existing regression test ' +
      'in test/validate.test.js passing. `npm test` must pass and stay fast.',
    grade: gradeTestsPass,
  },
];
