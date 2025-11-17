// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { prepareData } from './helpers/index.js';
import encrypt from '../server/lib/secure.cjs';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let testUser;
  let testStatus;

  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    await knex.migrate.latest();
    await prepareData(app);

    // Create test user
    testUser = await models.user.query().insert({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      passwordDigest: encrypt('password123'),
    });

    // Create test status
    testStatus = await models.taskStatus.query().insert({
      name: 'новый',
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await models.task.query().delete();
  });

  const authenticateUser = async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: {
          email: testUser.email,
          password: 'password123',
        },
      },
    });

    if (response.cookies && response.cookies.length > 0) {
      const [sessionCookie] = response.cookies;
      const { name, value } = sessionCookie;
      return { [name]: value };
    }
    return {};
  };

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new - should redirect to login when not authenticated', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('new - should show form when authenticated', async () => {
    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create - should redirect to login when not authenticated', async () => {
    const params = {
      name: 'Test Task',
      description: 'Test Description',
      statusId: testStatus.id,
    };
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('create - should create task when authenticated', async () => {
    const cookies = await authenticateUser();
    const params = {
      name: 'Test Task',
      description: 'Test Description',
      statusId: testStatus.id,
    };
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      payload: {
        data: params,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);
    const task = await models.task.query().findOne({ name: params.name });
    expect(task).toMatchObject({
      name: params.name,
      description: params.description,
      statusId: params.statusId,
      creatorId: testUser.id,
    });
  });

  it('show - should display task details', async () => {
    const task = await models.task.query().insert({
      name: 'Test Task',
      description: 'Test Description',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('task', { id: task.id }),
    });

    expect(response.statusCode).toBe(200);
  });

  it('edit - should redirect to login when not authenticated', async () => {
    const task = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editTask', { id: task.id }),
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('edit - should show form when authenticated as creator', async () => {
    const cookies = await authenticateUser();
    const task = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editTask', { id: task.id }),
      cookies,
    });
    expect(response.statusCode).toBe(200);
  });

  it('update - should redirect to login when not authenticated', async () => {
    const task = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const params = { name: 'Updated Task' };
    const response = await app.inject({
      method: 'PATCH',
      url: `/tasks/${task.id}`,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('update - should update task when authenticated as creator', async () => {
    const cookies = await authenticateUser();
    const task = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const params = { name: 'Updated Task' };
    const response = await app.inject({
      method: 'PATCH',
      url: `/tasks/${task.id}`,
      payload: {
        data: params,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);
    const updatedTask = await models.task.query().findById(task.id);
    expect(updatedTask).toMatchObject(params);
  });

  it('delete - should redirect to login when not authenticated', async () => {
    const task = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/tasks/${task.id}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('delete - should delete task when authenticated as creator', async () => {
    const cookies = await authenticateUser();
    const task = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/tasks/${task.id}`,
      cookies,
    });

    expect(response.statusCode).toBe(302);
    const deletedTask = await models.task.query().findById(task.id);
    expect(deletedTask).toBeUndefined();
  });

  describe('filter', () => {
    let testStatus2;
    let testUser2;
    let testLabel;

    beforeEach(async () => {
      // Clean up test data
      await models.task.query().delete();

      // Create additional test data
      testStatus2 = await models.taskStatus.query().insert({
        name: 'в работе',
      });

      // Check if testUser2 already exists, if not create it
      testUser2 = await models.user.query().findOne({ email: 'john@example.com' });
      if (!testUser2) {
        testUser2 = await models.user.query().insert({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          passwordDigest: encrypt('password123'),
        });
      }

      testLabel = await models.label.query().insert({
        name: 'bug',
      });
    });

    it('filter by status', async () => {
      await models.task.query().insert({
        name: 'Task 1',
        statusId: testStatus.id,
        creatorId: testUser.id,
      });

      await models.task.query().insert({
        name: 'Task 2',
        statusId: testStatus2.id,
        creatorId: testUser.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/tasks?status=${testStatus.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Task 1');
      expect(response.body).not.toContain('Task 2');
    });

    it('filter by executor', async () => {
      await models.task.query().insert({
        name: 'Task 1',
        statusId: testStatus.id,
        creatorId: testUser.id,
        executorId: testUser.id,
      });

      await models.task.query().insert({
        name: 'Task 2',
        statusId: testStatus.id,
        creatorId: testUser.id,
        executorId: testUser2.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/tasks?executor=${testUser.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Task 1');
      expect(response.body).not.toContain('Task 2');
    });

    it('filter by label', async () => {
      const task1 = await models.task.query().insert({
        name: 'Task 1',
        statusId: testStatus.id,
        creatorId: testUser.id,
      });

      await models.task.query().insert({
        name: 'Task 2',
        statusId: testStatus.id,
        creatorId: testUser.id,
      });

      // Link label to task1
      await task1.$relatedQuery('labels').relate(testLabel.id);

      const response = await app.inject({
        method: 'GET',
        url: `/tasks?label=${testLabel.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Task 1');
      expect(response.body).not.toContain('Task 2');
    });

    it('filter by createdByMe', async () => {
      await models.task.query().insert({
        name: 'Task 1',
        statusId: testStatus.id,
        creatorId: testUser.id,
      });

      await models.task.query().insert({
        name: 'Task 2',
        statusId: testStatus.id,
        creatorId: testUser2.id,
      });

      const cookies = await authenticateUser();
      const response = await app.inject({
        method: 'GET',
        url: '/tasks?createdByMe=1',
        cookies,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Task 1');
      expect(response.body).not.toContain('Task 2');
    });

    it('filter by multiple criteria', async () => {
      const task1 = await models.task.query().insert({
        name: 'Task 1',
        statusId: testStatus.id,
        creatorId: testUser.id,
        executorId: testUser.id,
      });

      // Link label to task1
      await task1.$relatedQuery('labels').relate(testLabel.id);

      await models.task.query().insert({
        name: 'Task 2',
        statusId: testStatus.id,
        creatorId: testUser.id,
        executorId: testUser2.id,
      });

      await models.task.query().insert({
        name: 'Task 3',
        statusId: testStatus2.id,
        creatorId: testUser.id,
        executorId: testUser.id,
      });

      const cookies = await authenticateUser();
      const response = await app.inject({
        method: 'GET',
        url: `/tasks?status=${testStatus.id}&executor=${testUser.id}&createdByMe=1`,
        cookies,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Task 1');
      expect(response.body).not.toContain('Task 2');
      expect(response.body).not.toContain('Task 3');
    });
  });

  afterAll(async () => {
    await app.close();
    if (knex) {
      await knex.destroy();
    }
  });
});
