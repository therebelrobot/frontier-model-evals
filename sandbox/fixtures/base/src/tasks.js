import { randomUUID } from 'node:crypto';
import { validateTask } from './validate.js';
import { sortByPriority } from './priority.js';

export class TaskStore {
  #tasks = new Map();

  add(input) {
    const validated = validateTask(input);
    const task = { id: randomUUID(), completed: false, ...validated };
    this.#tasks.set(task.id, task);
    return task;
  }

  complete(id) {
    const task = this.#tasks.get(id);
    if (!task) throw new Error(`no task with id ${id}`);
    task.completed = true;
    return task;
  }

  remove(id) {
    return this.#tasks.delete(id);
  }

  list({ includeCompleted = false } = {}) {
    const all = [...this.#tasks.values()].filter((t) => includeCompleted || !t.completed);
    return sortByPriority(all);
  }

  get(id) {
    return this.#tasks.get(id);
  }

  get size() {
    return this.#tasks.size;
  }
}
