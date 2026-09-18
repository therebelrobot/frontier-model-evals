import { parseArgs } from 'node:util';
import { DEFAULT_ROSTER, assertRosterAllowed, parseRosterArg } from './config/models.ts';
import { tasksForSuite, SUITES } from './tasks/index.ts';
import { orchestrate } from './runner/orchestrate.ts';

function printHelp() {
  console.log(`
frontier-model-evals

Usage:
  npm run eval -- --suite <name> [options]

Suites: ${Object.keys(SUITES).join(', ')}

Options:
  --suite <name>       Which task suite to run (default: capability)
  --models a,b,c        Comma-separated OpenRouter model IDs (default: seed roster in src/config/models.ts)
  --run <label>         Run label, used as results/<label>.jsonl (default: suite name)
  --sandbox              Allow tasks that require the sandbox/ tier (real tool access, network-isolated)
  --concurrency <n>      Parallel jobs across the whole matrix (default: 3)
  --help

Examples:
  npm run eval -- --suite capability
  npm run eval -- --suite injection --models anthropic/claude-sonnet-4.5,deepseek/deepseek-v4-flash
  npm run eval -- --suite all --sandbox --concurrency 2
`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      suite: { type: 'string', default: 'capability' },
      models: { type: 'string' },
      run: { type: 'string' },
      sandbox: { type: 'boolean', default: false },
      concurrency: { type: 'string', default: '3' },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    printHelp();
    return;
  }

  const tasks = tasksForSuite(values.suite ?? 'capability');
  const models = values.models ? parseRosterArg(values.models) : DEFAULT_ROSTER;
  assertRosterAllowed(models);

  const runLabel = values.run ?? values.suite ?? 'capability';

  console.log(`Suite: ${values.suite}  |  Models: ${models.map((m) => m.id).join(', ')}  |  Tasks: ${tasks.length}`);
  if (!values.sandbox && tasks.some((t) => t.requiresSandbox)) {
    console.log('Sandbox-gated tasks in this suite will be skipped (pass --sandbox once sandbox/ is running).');
  }

  const { logPath } = await orchestrate({
    runLabel,
    models,
    tasks,
    sandboxAvailable: values.sandbox ?? false,
    concurrency: Number(values.concurrency ?? '3'),
  });

  console.log(`\nDone. Raw results: ${logPath}`);
  console.log(`Reports: npm run report:csv -- --run ${runLabel}   npm run report:md -- --run ${runLabel}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
