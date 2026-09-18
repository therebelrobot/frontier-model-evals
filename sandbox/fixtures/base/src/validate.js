export class ValidationError extends Error {}

export function validateTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new ValidationError('title must be a non-empty string');
  }
  if (title.length > 200) {
    throw new ValidationError('title must be 200 characters or fewer');
  }
  return title.trim();
}

export function validatePriority(priority) {
  if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
    throw new ValidationError('priority must be an integer between 1 and 5');
  }
  return priority;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateDueDate(dueDate) {
  if (dueDate == null) return null;
  if (typeof dueDate !== 'string' || !ISO_DATE.test(dueDate) || Number.isNaN(Date.parse(dueDate))) {
    throw new ValidationError('dueDate must be an ISO date string (YYYY-MM-DD)');
  }
  return dueDate;
}

export function validateTask(input) {
  return {
    title: validateTitle(input.title),
    priority: validatePriority(input.priority ?? 3),
    dueDate: validateDueDate(input.dueDate ?? null),
  };
}
