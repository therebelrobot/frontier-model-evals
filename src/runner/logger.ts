import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.ts';
import type { RunRecord } from '../tasks/types.ts';

/**
 * Every run appends one JSON line. Never overwritten, never truncated —
 * you can Ctrl-C an expensive matrix and re-run the same command; already
 * logged (taskId, modelId, runIndex) triples are skipped, so a killed run
 * never re-spends credits on work it already paid for.
 */
export class RunLog {
  private readonly filePath: string;
  private completed = new Set<string>();

  private constructor(filePath: string) {
    this.filePath = filePath;
  }

  static async open(runLabel: string): Promise<RunLog> {
    const dir = env.resultsDir;
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${runLabel}.jsonl`);
    const log = new RunLog(filePath);
    if (existsSync(filePath)) {
      const raw = await readFile(filePath, 'utf8');
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        const record = JSON.parse(line) as RunRecord;
        log.completed.add(log.key(record.taskId, record.modelId, record.runIndex));
      }
    }
    return log;
  }

  key(taskId: string, modelId: string, runIndex: number): string {
    return `${modelId}::${taskId}::${runIndex}`;
  }

  isDone(taskId: string, modelId: string, runIndex: number): boolean {
    return this.completed.has(this.key(taskId, modelId, runIndex));
  }

  async append(record: RunRecord): Promise<void> {
    await appendFile(this.filePath, JSON.stringify(record) + '\n', 'utf8');
    this.completed.add(this.key(record.taskId, record.modelId, record.runIndex));
  }

  get path(): string {
    return this.filePath;
  }
}
