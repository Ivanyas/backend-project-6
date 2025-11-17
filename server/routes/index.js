// @ts-check

import welcome from './welcome.js';
import users from './users.js';
import session from './session.js';
import taskStatuses from './taskStatuses.js';
import tasks from './tasks.js';
import labels from './labels.js';

const controllers = [
  welcome,
  users,
  session,
  taskStatuses,
  tasks,
  labels,
];

export default (app) => controllers.forEach((f) => f(app));
