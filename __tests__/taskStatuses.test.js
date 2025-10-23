// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';
import encrypt from '../server/lib/secure.cjs';

describe('test task statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let testUser;
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
  });

  beforeEach(async () => {
    // Clean up test data
    await models.taskStatus.query().delete();
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
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new - should redirect to login when not authenticated', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('new - should show form when authenticated', async () => {
    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create - should redirect to login when not authenticated', async () => {
    const params = { name: 'новый' };
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('create - should create status when authenticated', async () => {
    const cookies = await authenticateUser();
    const params = { name: 'новый' };
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        data: params,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);
    const taskStatus = await models.taskStatus.query().findOne({ name: params.name });
    expect(taskStatus).toMatchObject(params);
  });

  it('edit - should redirect to login when not authenticated', async () => {
    const taskStatus = await models.taskStatus.query().insert({ name: 'тестовый статус' });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id: taskStatus.id }),
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('edit - should show form when authenticated', async () => {
    const cookies = await authenticateUser();
    const taskStatus = await models.taskStatus.query().insert({ name: 'тестовый статус' });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id: taskStatus.id }),
      cookies,
    });
    expect(response.statusCode).toBe(200);
  });

  it('update - should redirect to login when not authenticated', async () => {
    const taskStatus = await models.taskStatus.query().insert({ name: 'тестовый статус' });
    const params = { name: 'обновленный статус' };
    const response = await app.inject({
      method: 'PATCH',
      url: `/statuses/${taskStatus.id}`,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('update - should update status when authenticated', async () => {
    const cookies = await authenticateUser();
    const taskStatus = await models.taskStatus.query().insert({ name: 'тестовый статус' });
    const params = { name: 'обновленный статус' };
    const response = await app.inject({
      method: 'PATCH',
      url: `/statuses/${taskStatus.id}`,
      payload: {
        data: params,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);
    const updatedTaskStatus = await models.taskStatus.query().findById(taskStatus.id);
    expect(updatedTaskStatus).toMatchObject(params);
  });

  it('delete - should redirect to login when not authenticated', async () => {
    const taskStatus = await models.taskStatus.query().insert({ name: 'статус для удаления' });
    const response = await app.inject({
      method: 'DELETE',
      url: `/statuses/${taskStatus.id}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('delete - should delete status when authenticated', async () => {
    const cookies = await authenticateUser();
    const taskStatus = await models.taskStatus.query().insert({ name: 'статус для удаления' });
    const response = await app.inject({
      method: 'DELETE',
      url: `/statuses/${taskStatus.id}`,
      cookies,
    });

    expect(response.statusCode).toBe(302);
    const deletedTaskStatus = await models.taskStatus.query().findById(taskStatus.id);
    expect(deletedTaskStatus).toBeUndefined();
  });


  afterAll(async () => {
    await app.close();
  });
});
