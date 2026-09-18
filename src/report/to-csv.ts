import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { env } from '../config/env.ts';
import { aggregate } from '../grading/aggregate.ts';
import type { RunRecord } from '../tasks/types.ts';

async function main() {
  const { values } = parseArgs({
    options: { run: { type: 'string' } },
  });
  const runLabel = values.run ?? 'latest';
  const logPath = path.join(env.resultsDir, `${runLabel}.jsonl`);

  const raw = await readFile(logPath, 'utf8');
  const records: RunRecord[] = raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  const rows = aggregate(records);
  const header = ['model', 'task', 'tier', 'runs', 'passRate', 'variance', 'passAtK', 'errorRate', 'totalCostUsd', 'totalTokens'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.modelId,
        r.taskId,
        r.taskTier,
        r.runs,
        r.passRate.toFixed(3),
        r.variance.toFixed(3),
        r.passAtK,
        r.errorRate.toFixed(3),
        r.totalCostUsd?.toFixed(4) ?? '',
        r.totalTokens,
      ].join(','),
    );
  }

  const outPath = path.join(env.resultsDir, `${runLabel}.csv`);
  await writeFile(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
