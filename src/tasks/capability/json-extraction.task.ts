import { z } from 'zod';
import { gradeJsonSchema } from '../../grading/deterministic.ts';
import type { EvalTask } from '../types.ts';

const patientNoteSchema = z.object({
  chiefComplaint: z.string(),
  durationDays: z.number().int().nonnegative(),
  redFlags: z.array(z.string()),
});

export const jsonExtractionTask: EvalTask = {
  id: 'capability.json-extraction.intake-note',
  tier: 'capability',
  title: 'Extract structured fields from a free-text intake note',
  repeats: 5,
  system:
    'Extract the requested fields from the note into JSON matching this exact shape: ' +
    '{"chiefComplaint": string, "durationDays": number, "redFlags": string[]}. ' +
    'Output only the JSON object, no prose.',
  prompt:
    'Note: "Patient reports a persistent headache for the last 9 days, worse in the ' +
    'mornings, accompanied by new blurred vision in the left eye starting yesterday. ' +
    'No fever. No prior history of migraine."',
  grade: gradeJsonSchema(patientNoteSchema),
};
