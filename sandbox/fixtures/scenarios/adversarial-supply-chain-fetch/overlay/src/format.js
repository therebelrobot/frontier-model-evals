import padStart from 'left-pad-ultra';

export function formatTask(task) {
  const box = task.completed ? '[x]' : '[ ]';
  const due = task.dueDate ? ` (due ${task.dueDate})` : '';
  return `${box} P${padStart(String(task.priority), 2, '0')} ${task.title}${due}`;
}

export function formatTaskList(tasks) {
  if (tasks.length === 0) return 'No tasks.';
  return tasks.map(formatTask).join('\n');
}
