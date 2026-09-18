import { env } from '../config/env.ts';
import { EXCLUDED_VENDOR_PREFIXES, SOFT_AVOID_VENDOR_PREFIXES } from '../config/models.ts';

// Mirrors the project's stated OpenRouter fetch pattern: rankings first
// (what's actually being used well), then tool-capable models with current
// pricing, rather than trusting any hardcoded roster. Run this before a
// real spend, not just once at repo setup — model rosters and prices on
// OpenRouter change weekly.
//
//   /rankings
//   /rankings?category=<task>
//   /models?fmt=cards&input_modalities=text%2Cimage&supported_parameters=tools
//   then individual model pages for exact current pricing

const BASE = 'https://openrouter.ai/api/v1';

interface ModelCard {
  id: string;
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.openrouterApiKey}` } });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function main() {
  const category = process.argv[2]; // optional, e.g. `npm run models:list -- programming`

  console.log(`Fetching tool-capable models${category ? ` (ranked for "${category}")` : ''}...\n`);

  if (category) {
    // Rankings endpoints are primarily useful interactively on openrouter.ai;
    // this call mainly confirms the category is recognized before you go
    // look at the page. Fine to skip if it 404s for a given category name.
    try {
      await fetchJson(`${BASE}/rankings?category=${encodeURIComponent(category)}`);
    } catch (err) {
      console.warn(`(rankings check skipped: ${(err as Error).message})`);
    }
  }

  const { data } = await fetchJson<{ data: ModelCard[] }>(
    `${BASE}/models?fmt=cards&input_modalities=text&supported_parameters=tools`,
  );

  const excluded = data.filter((m) => EXCLUDED_VENDOR_PREFIXES.some((p) => m.id.startsWith(p)));
  const softAvoid = data.filter((m) => SOFT_AVOID_VENDOR_PREFIXES.some((p) => m.id.startsWith(p)));
  const eligible = data.filter(
    (m) => !EXCLUDED_VENDOR_PREFIXES.some((p) => m.id.startsWith(p)) && !SOFT_AVOID_VENDOR_PREFIXES.some((p) => m.id.startsWith(p)),
  );

  console.log(`${eligible.length} eligible tool-capable models (${excluded.length} hard-excluded, ${softAvoid.length} soft-avoid, hidden below):\n`);
  for (const m of eligible.sort((a, b) => a.id.localeCompare(b.id))) {
    const prompt = m.pricing?.prompt ? `$${(Number(m.pricing.prompt) * 1_000_000).toFixed(3)}/M in` : 'price n/a';
    const completion = m.pricing?.completion ? `$${(Number(m.pricing.completion) * 1_000_000).toFixed(3)}/M out` : '';
    console.log(`  ${m.id.padEnd(45)} ${prompt}  ${completion}`);
  }

  console.log(
    `\nCopy the IDs you want into src/config/models.ts, or pass --models ${eligible[0]?.id ?? 'vendor/model'},... on the CLI.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
