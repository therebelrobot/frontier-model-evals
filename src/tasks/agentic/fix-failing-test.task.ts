import type { EvalTask, GradeResult, ModelOutput } from '../types.ts';

// This task does NOT define ai-sdk `tools` — it's a spec for the sandbox
// tier, not something runOnce() executes directly. The actual bash/edit/
// read tool access lives inside the hardened opencode container in
// sandbox/, matching the "isolate the agent, not the harness" boundary:
// a frontier model gets real shell access ONLY inside network-isolated
// containment, never from this Node process directly.
//
// Wiring this up: point sandbox/docker-compose.yml's OPENCODE_MODEL at
// the model under test, mount a copy of a toy repo with one failing test
// into /workspace, and run `opencode run "fix the failing test" --format
// json` inside the container. Parse that JSON into a ModelOutput shape
// (toolCalls from the trajectory log) and grade with the function below.
// This file intentionally stays a spec + grader so the orchestrator's
// requiresSandbox gate has something concrete to point at; see
// sandbox/README.md for the exact opencode invocation.

function gradeTestsPass(output: ModelOutput): GradeResult {
  // Placeholder grader shape: real wiring should replace `output.text`
  // with the sandboxed run's final `npm test` exit status / stdout,
  // captured by the sandbox invocation script, not by asking the model
  // to self-report whether it succeeded.
  const claimsSuccess = /tests? pass|all tests pass|0 failing/i.test(output.text);
  return claimsSuccess
    ? { pass: true, score: 1, reason: 'model reported tests passing (verify against real exit code, not self-report)' }
    : { pass: false, score: 0, reason: 'no clear pass signal in output' };
}

export const fixFailingTestTask: EvalTask = {
  id: 'agentic.repo.fix-failing-test',
  tier: 'agentic',
  title: 'Given a real repo with one failing test, fix it using real read/edit/bash tools',
  repeats: 3,
  requiresSandbox: true,
  system: 'You are working in a real repository. Find and fix the failing test.',
  prompt: 'The test suite has one failing test. Find it, understand why it fails, and fix the underlying code (not the test) so the whole suite passes.',
  grade: gradeTestsPass,
};
