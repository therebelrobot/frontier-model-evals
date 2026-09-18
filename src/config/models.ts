// Starting roster for the eval matrix. Treat this file as a seed, not a
// source of truth — model IDs and pricing on OpenRouter churn constantly.
// Before a real run: `npm run models:list` to pull live rankings/pricing
// (see src/tools/live-models.ts), then edit this file or pass
// `--models vendor/model,vendor/model` on the CLI to override.
//
// Hard exclusions (never add these, see project preferences):
//   - any OpenAI model (openai/*)
//   - any xAI / Grok model (x-ai/*)
// Soft exclusion — avoid unless the alternatives in a given tier are poor:
//   - Meta / Llama models (meta-llama/*)

export type ModelTier = 'budget' | 'balanced' | 'premium';

export interface ModelSpec {
  /** OpenRouter model slug, e.g. "anthropic/claude-sonnet-4.5" */
  id: string;
  tier: ModelTier;
  /** Free-text note — why it's in the roster, known quirks, etc. */
  note?: string;
}

export const EXCLUDED_VENDOR_PREFIXES = ['openai/', 'x-ai/'];
export const SOFT_AVOID_VENDOR_PREFIXES = ['meta-llama/'];

export const DEFAULT_ROSTER: ModelSpec[] = [
  // Budget tier — cheap, for pipeline debugging and free/near-free smoke tests.
  { id: 'deepseek/deepseek-v4-flash', tier: 'budget', note: 'cheap paid workhorse, verify current price' },
  { id: 'qwen/qwen3-coder', tier: 'budget', note: 'strong at code-shaped capability tasks for the price' },

  // Balanced tier — the default comparison set for most eval runs.
  { id: 'anthropic/claude-sonnet-4.5', tier: 'balanced' },
  { id: 'google/gemini-2.5-pro', tier: 'balanced' },
  { id: 'mistralai/mistral-large-2411', tier: 'balanced', note: 'verify slug is current before running' },

  // Premium tier — spend these credits deliberately (see budget notes in README).
  { id: 'anthropic/claude-opus-4.5', tier: 'premium', note: 'verify slug is current before running' },
];

export function assertRosterAllowed(roster: ModelSpec[]): void {
  for (const m of roster) {
    if (EXCLUDED_VENDOR_PREFIXES.some((p) => m.id.startsWith(p))) {
      throw new Error(
        `Model "${m.id}" is on the hard-excluded vendor list (openai/*, x-ai/*). ` +
          `Remove it from the roster — this is a standing project rule, not a per-run toggle.`,
      );
    }
  }
}

export function parseRosterArg(arg: string): ModelSpec[] {
  return arg.split(',').map((id) => ({ id: id.trim(), tier: 'balanced' as ModelTier }));
}
