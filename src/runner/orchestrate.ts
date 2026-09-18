import { runOnce } from './client.ts';
import { RunLog } from './logger.ts';
import type { EvalTask, RunRecord } from '../tasks/types.ts';
import type { ModelSpec } from '../config/models.ts';

export interface OrchestrateOptions {
  runLabel: string;
  models: ModelSpec[];
  tasks: EvalTask[];
  /** Must be true for any task with requiresSandbox to actually run. */
  sandboxAvailable: boolean;
  /** Simple concurrency limit across the whole matrix, not per-model. */
  concurrency: number;
}

export async function orchestrate(opts: OrchestrateOptions): Promise<{ logPath: string }> {
  const log = await RunLog.open(opts.runLabel);

  const jobs: Array<() => Promise<void>> = [];
  for (const model of opts.models) {
    for (const task of opts.tasks) {
      if (task.requiresSandbox && !opts.sandboxAvailable) {
        console.warn(
          `[skip] ${task.id} requires the sandbox tier (sandbox/) — pass --sandbox once it's up.`,
        );
        continue;
      }
      for (let runIndex = 0; runIndex < task.repeats; runIndex++) {
        if (log.isDone(task.id, model.id, runIndex)) continue;
        jobs.push(() => runJob(log, task, model.id, runIndex));
      }
    }
  }

  console.log(`${jobs.length} job(s) to run (already-completed combos are skipped).`);
  await runWithConcurrency(jobs, opts.concurrency);

  return { logPath: log.path };
}

async function runJob(log: RunLog, task: EvalTask, modelId: string, runIndex: number): Promise<void> {
  const base = { taskId: task.id, taskTier: task.tier, modelId, runIndex, timestampIso: new Date().toISOString() };
  try {
    const { output, usage, costUsd } = await runOnce(task, modelId);
    const grade = await task.grade(output);
    const record: RunRecord = { ...base, output, usage, costUsd, grade, errored: false };
    await log.append(record);
    const cost = costUsd !== null ? `$${costUsd.toFixed(4)}` : 'cost n/a';
    console.log(`  ${grade.pass ? 'PASS' : 'FAIL'}  ${modelId} :: ${task.id} #${runIndex}  (${cost})`);
  } catch (err) {
    const record: RunRecord = {
      ...base,
      output: { text: '', toolCalls: [], finishReason: 'error' },
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costUsd: null,
      grade: { pass: false, score: 0, reason: 'errored before grading' },
      errored: true,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
    await log.append(record);
    console.error(`  ERROR ${modelId} :: ${task.id} #${runIndex} — ${record.errorMessage}`);
  }
}

async function runWithConcurrency(jobs: Array<() => Promise<void>>, limit: number): Promise<void> {
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      if (job) await job();
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, limit) }, worker));
}
