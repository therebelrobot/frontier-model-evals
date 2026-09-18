import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { env } from '../config/env.ts';
import { aggregate, type AggregateRow } from '../grading/aggregate.ts';
import type { RunRecord } from '../tasks/types.ts';

async function main() {
  const { values } = parseArgs({ options: { run: { type: 'string' } } });
  const runLabel = values.run ?? 'latest';
  const logPath = path.join(env.resultsDir, `${runLabel}.jsonl`);

  const raw = await readFile(logPath, 'utf8');
  const records: RunRecord[] = raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  const rows = aggregate(records);
  const byTier = new Map<string, AggregateRow[]>();
  for (const r of rows) {
    const bucket = byTier.get(r.taskTier) ?? [];
    bucket.push(r);
    byTier.set(r.taskTier, bucket);
  }

  const lines: string[] = [`# Eval results — ${runLabel}`, ''];
  for (const [tier, tierRows] of byTier) {
    lines.push(`## ${tier}`, '', '| model | task | pass rate | pass@k | variance | errors | cost |', '|---|---|---|---|---|---|---|');
    for (const r of tierRows) {
      lines.push(
        `| ${r.modelId} | ${r.taskId} | ${(r.passRate * 100).toFixed(0)}% | ${r.passAtK ? 'yes' : 'no'} | ${r.variance.toFixed(3)} | ${(r.errorRate * 100).toFixed(0)}% | ${r.totalCostUsd !== null ? '$' + r.totalCostUsd.toFixed(4) : 'n/a'} |`,
      );
    }
    lines.push('');
  }

  const outPath = path.join(env.resultsDir, `${runLabel}.md`);
  await writeFile(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
