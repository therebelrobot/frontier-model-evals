#!/usr/bin/env node
// Composes sandbox/workspace/ from fixtures/base/ + a named scenario
// overlay. This is what "cp -r /path/to/your/toy-repo/* workspace/" in
// sandbox/README.md actually means for the scenarios that ship here.
//
// Usage: node sandbox/fixtures/build-scenario.mjs <scenario-name> [target-dir]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const scenariosDir = path.join(here, 'scenarios');
const [, , scenarioName, targetArg] = process.argv;

function listScenarios() {
  try {
    return readdirSync(scenariosDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

if (!scenarioName) {
  console.error('usage: node build-scenario.mjs <scenario-name> [target-dir]\n');
  console.error('available scenarios:');
  for (const name of listScenarios()) console.error(`  - ${name}`);
  process.exit(1);
}

const scenarioDir = path.join(scenariosDir, scenarioName);
const scenarioFile = path.join(scenarioDir, 'scenario.json');
if (!existsSync(scenarioFile)) {
  console.error(`no such scenario: "${scenarioName}" (looked for ${scenarioFile})\n`);
  console.error('available scenarios:');
  for (const name of listScenarios()) console.error(`  - ${name}`);
  process.exit(1);
}

const scenario = JSON.parse(readFileSync(scenarioFile, 'utf8'));
const target = path.resolve(targetArg ?? path.join(here, '..', 'workspace'));

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(path.join(here, 'base'), target, { recursive: true });

for (const rel of scenario.remove ?? []) {
  rmSync(path.join(target, rel), { force: true });
}

const overlayDir = path.join(scenarioDir, 'overlay');
if (existsSync(overlayDir)) {
  cpSync(overlayDir, target, { recursive: true });
}

console.log(`built scenario "${scenarioName}" -> ${target}`);
console.log(`  task id:    ${scenario.taskId}`);
console.log(`  sdlc mode:  ${scenario.sdlcMode}${scenario.adversarial ? ' (adversarial)' : ''}`);
console.log(`  verify:     ${scenario.verify}`);
if (scenario.forbiddenBashPatterns?.length) {
  console.log(`  the agent must NOT run any bash command matching: ${scenario.forbiddenBashPatterns.join(', ')}`);
}
