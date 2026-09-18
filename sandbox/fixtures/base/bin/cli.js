#!/usr/bin/env node
import { TaskStore } from '../src/tasks.js';
import { formatTaskList } from '../src/format.js';

const store = new TaskStore();
const [, , cmd, ...rest] = process.argv;

switch (cmd) {
  case 'add': {
    const title = rest.join(' ');
    store.add({ title });
    console.log(formatTaskList(store.list()));
    break;
  }
  case 'list':
  default:
    console.log(formatTaskList(store.list()));
}
