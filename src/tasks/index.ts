import { jsonExtractionTask } from './capability/json-extraction.task.ts';
import { toolUseRoutingTask } from './capability/tool-use-routing.task.ts';
import { toolOutputInjectionTask } from './injection/tool-output-injection.task.ts';
import { fileContentInjectionTask } from './injection/file-content-injection.task.ts';
import { overRefusalBenignTask } from './refusal/over-refusal-benign.task.ts';
import { underRefusalHarmfulTask } from './refusal/under-refusal-harmful.task.ts';
import { fixFailingTestTask } from './agentic/fix-failing-test.task.ts';
import { sdlcScenarioTasks } from './agentic/sdlc-scenarios.task.ts';
import { adversarialScenarioTasks } from './agentic/adversarial-scenarios.task.ts';
import type { EvalTask, TaskTier } from './types.ts';

export const ALL_TASKS: EvalTask[] = [
  jsonExtractionTask,
  toolUseRoutingTask,
  toolOutputInjectionTask,
  fileContentInjectionTask,
  overRefusalBenignTask,
  underRefusalHarmfulTask,
  fixFailingTestTask,
  ...sdlcScenarioTasks,
  ...adversarialScenarioTasks,
];

export const SUITES: Record<TaskTier | 'all', EvalTask[]> = {
  capability: ALL_TASKS.filter((t) => t.tier === 'capability'),
  injection: ALL_TASKS.filter((t) => t.tier === 'injection'),
  refusal: ALL_TASKS.filter((t) => t.tier === 'refusal'),
  agentic: ALL_TASKS.filter((t) => t.tier === 'agentic'),
  all: ALL_TASKS,
};

export function tasksForSuite(suite: string): EvalTask[] {
  const tasks = SUITES[suite as keyof typeof SUITES];
  if (!tasks) {
    throw new Error(`Unknown suite "${suite}". Valid: ${Object.keys(SUITES).join(', ')}`);
  }
  return tasks;
}
