import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { env } from '../config/env.ts';
import type { GradeResult, ModelOutput } from '../tasks/types.ts';

// Lazy for the same reason as runner/client.ts — importing this module must
// not require OPENROUTER_API_KEY to be set until a judge call actually runs.
let openrouterClient: ReturnType<typeof createOpenRouter> | undefined;
function getOpenrouter() {
  openrouterClient ??= createOpenRouter({ apiKey: env.openrouterApiKey });
  return openrouterClient;
}

const verdictSchema = z.object({
  winner: z.enum(['a', 'b', 'tie']),
  reason: z.string(),
});

/**
 * Pairwise LLM-as-judge: compares a candidate's output against a fixed
 * reference answer for the same prompt, rather than scoring it 1-10 in
 * isolation. Pairwise comparison is meaningfully more reliable than
 * absolute scoring for the same judge model/rubric — prefer it here.
 *
 * The judge model defaults to JUDGE_MODEL (see .env.example) and should be
 * kept off the roster you're evaluating: a judge tends to rate outputs
 * from its own model family more favorably (self-preference bias).
 */
export function gradeAgainstReference(referenceAnswer: string, rubric: string) {
  return async (output: ModelOutput): Promise<GradeResult> => {
    const judgeModel = getOpenrouter()(env.judgeModel);
    const result = await generateText({
      model: judgeModel,
      system:
        'You are a strict, impartial grader. Compare candidate answer B against ' +
        'reference answer A using only the rubric given. Do not favor length or ' +
        'confident tone. Respond with nothing but the JSON object described.',
      prompt: [
        `Rubric: ${rubric}`,
        `Answer A (reference):\n${referenceAnswer}`,
        `Answer B (candidate):\n${output.text}`,
        'Return JSON: {"winner": "a"|"b"|"tie", "reason": "<one sentence>"}',
      ].join('\n\n'),
    });

    let parsed: z.infer<typeof verdictSchema>;
    try {
      parsed = verdictSchema.parse(JSON.parse(extractJson(result.text)));
    } catch {
      return { pass: false, score: 0, reason: 'judge did not return valid verdict JSON' };
    }

    // "b" (the candidate) beating or tying the reference counts as a pass.
    const pass = parsed.winner === 'b' || parsed.winner === 'tie';
    return { pass, score: parsed.winner === 'b' ? 1 : parsed.winner === 'tie' ? 0.5 : 0, reason: parsed.reason };
  };
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? text).trim();
}
