import type { RunRecord } from '../tasks/types.ts';

export interface AggregateRow {
  modelId: string;
  taskId: string;
  taskTier: string;
  runs: number;
  passRate: number;
  /** Population variance of the 0/1 pass series across repeats. */
  variance: number;
  /** Did at least one of the k repeats pass? Common frontier-eval metric. */
  passAtK: boolean;
  errorRate: number;
  totalCostUsd: number | null;
  totalTokens: number;
}

export function aggregate(records: RunRecord[]): AggregateRow[] {
  const groups = new Map<string, RunRecord[]>();
  for (const r of records) {
    const key = `${r.modelId}::${r.taskId}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(r);
    groups.set(key, bucket);
  }

  const rows: AggregateRow[] = [];
  for (const bucket of groups.values()) {
    const first = bucket[0];
    if (!first) continue;
    const passSeries: number[] = bucket.map((r) => (r.grade.pass ? 1 : 0));
    const mean = passSeries.reduce((a, b) => a + b, 0) / passSeries.length;
    const variance = passSeries.reduce((a, b) => a + (b - mean) ** 2, 0) / passSeries.length;
    const errors = bucket.filter((r) => r.errored).length;
    const costs = bucket.map((r) => r.costUsd).filter((c): c is number => c !== null);

    rows.push({
      modelId: first.modelId,
      taskId: first.taskId,
      taskTier: first.taskTier,
      runs: bucket.length,
      passRate: mean,
      variance,
      passAtK: passSeries.some((p) => p === 1),
      errorRate: errors / bucket.length,
      totalCostUsd: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) : null,
      totalTokens: bucket.reduce((a, r) => a + r.usage.totalTokens, 0),
    });
  }
  return rows.sort((a, b) => a.modelId.localeCompare(b.modelId) || a.taskId.localeCompare(b.taskId));
}
