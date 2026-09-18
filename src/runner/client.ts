import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, stepCountIs } from 'ai';
import { env } from '../config/env.ts';
import type { EvalTask, ModelOutput } from '../tasks/types.ts';

// Lazy: only touches env.openrouterApiKey (which throws if unset) the first
// time a task actually runs. Importing this module — e.g. via `cli.ts
// --help`, which doesn't need a key at all — must not throw.
let openrouterClient: ReturnType<typeof createOpenRouter> | undefined;
function getOpenrouter() {
  openrouterClient ??= createOpenRouter({ apiKey: env.openrouterApiKey });
  return openrouterClient;
}

export interface RawRunResult {
  output: ModelOutput;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  costUsd: number | null;
}

/**
 * Runs one EvalTask against one model, once. Multi-turn tool loops (agentic
 * tasks) are handled by ai-sdk's built-in stopWhen loop rather than a
 * hand-rolled while loop, so retries/step limits stay consistent across
 * every task.
 *
 * COST CAPTURE — verify before trusting numbers in a real run:
 * OpenRouter's Usage Accounting is always-on server-side and includes a
 * real `cost` field (see project reference notes on OpenRouter's API).
 * @openrouter/ai-sdk-provider is documented as surfacing "detailed usage
 * accounting, including costs" via providerMetadata.openrouter. That field
 * name/shape is exactly the kind of thing that drifts between SDK minor
 * versions — the try/catch below degrades to `costUsd: null` (report.ts
 * then estimates from token counts) rather than silently reporting a wrong
 * number. If costUsd is consistently null in your results, log
 * `result.providerMetadata` once and adjust the path below.
 */
export async function runOnce(task: EvalTask, modelId: string): Promise<RawRunResult> {
  const model = getOpenrouter()(modelId);

  const result = await generateText({
    model,
    system: task.system,
    prompt: task.prompt,
    tools: task.tools,
    // Cap tool-loop length so a doom-looping model can't burn the whole
    // budget on one task. 8 steps is generous for the sample tasks in
    // src/tasks/agentic/ — raise it there per-task if you add bigger ones.
    stopWhen: task.tools ? stepCountIs(8) : undefined,
  });

  const output: ModelOutput = {
    text: result.text,
    toolCalls: (result.toolCalls ?? []).map((c) => ({ toolName: c.toolName, input: c.input })),
    finishReason: result.finishReason,
  };

  const usage = {
    promptTokens: result.usage?.inputTokens ?? 0,
    completionTokens: result.usage?.outputTokens ?? 0,
    totalTokens: result.usage?.totalTokens ?? 0,
  };

  let costUsd: number | null = null;
  try {
    // Best-effort extraction — see cost-capture note above.
    const meta = (result as { providerMetadata?: Record<string, unknown> }).providerMetadata;
    const openrouterMeta = meta?.openrouter as { usage?: { cost?: number } } | undefined;
    if (typeof openrouterMeta?.usage?.cost === 'number') {
      costUsd = openrouterMeta.usage.cost;
    }
  } catch {
    costUsd = null;
  }

  return { output, usage, costUsd };
}
