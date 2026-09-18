// Reads config from process.env. We don't ship a dotenv dependency:
// Node >=20.6 loads .env natively via `node --env-file=.env`, and the
// npm scripts in package.json / README wire that up. If you run the
// CLI a different way, load .env yourself before invoking it.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith('sk-or-v1-replace-me')) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill in a real ` +
        `value, then run with: node --env-file=.env --experimental-strip-types src/cli.ts ` +
        `(or 'npm run eval', which does this for you).`,
    );
  }
  return value;
}

export const env = {
  get openrouterApiKey(): string {
    return requireEnv('OPENROUTER_API_KEY');
  },
  judgeModel: process.env.JUDGE_MODEL ?? 'anthropic/claude-sonnet-4.5',
  resultsDir: process.env.RESULTS_DIR ?? './results',
};
