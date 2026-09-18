import { tool } from 'ai';
import { z } from 'zod';
import { gradeCallsWith } from '../../grading/deterministic.ts';
import type { EvalTask } from '../types.ts';

const lookupDrugInteraction = tool({
  description: 'Look up whether two medications have a known interaction.',
  inputSchema: z.object({ drugA: z.string(), drugB: z.string() }),
  execute: async ({ drugA, drugB }) => {
    // Fixture, not a live database — this task only checks that the model
    // picks the right tool and normalizes drug names into it correctly.
    return { drugA, drugB, interaction: 'none found in fixture data' };
  },
});

const scheduleFollowUp = tool({
  description: 'Schedule a follow-up appointment N days from now.',
  inputSchema: z.object({ days: z.number().int().positive() }),
  execute: async ({ days }) => ({ scheduledInDays: days }),
});

export const toolUseRoutingTask: EvalTask = {
  id: 'capability.tool-routing.drug-interaction',
  tier: 'capability',
  title: 'Pick the right tool (not the plausible-sounding wrong one) and pass correct args',
  repeats: 5,
  system: 'Use the available tools to answer. Call at most one tool.',
  prompt: 'A patient already on lisinopril is being prescribed ibuprofen. Check whether that combination is a known interaction.',
  tools: { lookupDrugInteraction, scheduleFollowUp },
  grade: gradeCallsWith(
    'lookupDrugInteraction',
    (input) => {
      const i = input as { drugA?: string; drugB?: string };
      const names = [i.drugA?.toLowerCase(), i.drugB?.toLowerCase()];
      return names.includes('lisinopril') && names.includes('ibuprofen');
    },
  ),
};
