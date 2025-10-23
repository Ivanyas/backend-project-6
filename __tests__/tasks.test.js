// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';
import encrypt from '../server/lib/secure.cjs';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let testUser;
  let testStatus;
  const testData = getTestData();

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

  afterAll(async () => {
    await app.close();
  });
});
