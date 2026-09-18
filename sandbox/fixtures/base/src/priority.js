const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Higher score = more urgent. Priority dominates; an approaching due date
// adds urgency on top of that.
export function scoreTask(task, now = new Date()) {
  const base = task.priority * 100;
  if (!task.dueDate) return base;
  const daysUntilDue = (Date.parse(task.dueDate) - now.getTime()) / MS_PER_DAY;
  const urgency = Math.max(0, 30 - daysUntilDue);
  return base + urgency;
}

export function sortByPriority(tasks, now = new Date()) {
  return [...tasks].sort((a, b) => scoreTask(b, now) - scoreTask(a, now));
}
