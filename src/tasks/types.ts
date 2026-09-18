import type { Tool } from 'ai';

export type TaskTier = 'capability' | 'agentic' | 'injection' | 'refusal';

/**
 * A single request Claude/GPT/etc. will actually see. Keep tasks small and
 * single-purpose — the orchestrator runs each one N times per model, so
 * cost scales linearly with how much you cram into one task.
 */
export interface EvalTask {
  id: string;
  tier: TaskTier;
  /** Short human label shown in reports. */
  title: string;
  system?: string;
  prompt: string;
  /** ai-sdk tool definitions, if this task exercises tool use. */
  tools?: Record<string, Tool>;
  /**
   * Marks tasks that grant a model real filesystem/shell/network access and
   * therefore must only be run inside sandbox/ (see sandbox/README.md).
   * The orchestrator refuses to run these outside an explicit --sandbox flag.
   */
  requiresSandbox?: boolean;
  /** How many independent samples to take (stochastic outputs — see README). */
  repeats: number;
  grade: Grader;
}

export interface ModelOutput {
  text: string;
  toolCalls: Array<{ toolName: string; input: unknown }>;
  finishReason: string;
}

export interface GradeResult {
  pass: boolean;
  score: number; // 0..1, lets aggregate.ts compute more than a pass rate
  reason: string;
}

export type Grader = (output: ModelOutput) => GradeResult | Promise<GradeResult>;

export interface RunRecord {
  taskId: string;
  taskTier: TaskTier;
  modelId: string;
  runIndex: number;
  timestampIso: string;
  output: ModelOutput;
  grade: GradeResult;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  /** USD, when OpenRouter's usage accounting surfaces it — see runner/client.ts. */
  costUsd: number | null;
  errored: boolean;
  errorMessage?: string;
}
