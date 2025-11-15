import fastify from 'fastify';
import init from '../server/plugin.js';
import { prepareData } from './helpers/index.js';
import encrypt from '../server/lib/secure.cjs';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  let testUser;
  
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
    await models.label.query().delete();
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
      url: app.reverse('labels'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new - should redirect to login when not authenticated', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('new - should show form when authenticated', async () => {
    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Новая метка');
  });

  it('create - should redirect to login when not authenticated', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: {
        data: {
          name: 'Test Label',
        },
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('create - should create label when authenticated', async () => {
    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      cookies,
      payload: {
        data: {
          name: 'Test Label',
        },
      },
    });

    expect(response.statusCode).toBe(302);
    
    const labels = await models.label.query();
    expect(labels.length).toBeGreaterThan(0);
  });

  it('edit - should redirect to login when not authenticated', async () => {
    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: testLabel.id }),
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('edit - should show form when authenticated', async () => {
    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: testLabel.id }),
      cookies,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Редактирование метки');
  });

  it('update - should redirect to login when not authenticated', async () => {
    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/labels/${testLabel.id}`,
      payload: {
        data: {
          name: 'Updated Label',
        },
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('update - should update label when authenticated', async () => {
    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'PATCH',
      url: `/labels/${testLabel.id}`,
      cookies,
      payload: {
        data: {
          name: 'Updated Label',
        },
      },
    });

    expect(response.statusCode).toBe(302);
    
    const updatedLabel = await models.label.query().findById(testLabel.id);
    expect(updatedLabel.name).toBe('Updated Label');
  });

  it('delete - should redirect to login when not authenticated', async () => {
    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/labels/${testLabel.id}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('delete - should delete label when authenticated', async () => {
    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'DELETE',
      url: `/labels/${testLabel.id}`,
      cookies,
    });

    expect(response.statusCode).toBe(302);
    
    const labels = await models.label.query();
    const deletedLabel = labels.find(l => l.id === testLabel.id);
    expect(deletedLabel).toBeUndefined();
  });

  it('delete - should not delete label linked to tasks', async () => {
    const testStatus = await models.taskStatus.query().insert({
      name: 'test',
    });

    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    // Create a task linked to the label
    const testTask = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    // Link the label to the task
    await models.task.relatedQuery('labels').for(testTask.id).relate(testLabel.id);

    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'DELETE',
      url: `/labels/${testLabel.id}`,
      cookies,
    });

    expect(response.statusCode).toBe(302);
    
    // Label should still exist
    const labels = await models.label.query();
    const labelExists = labels.find(l => l.id === testLabel.id);
    expect(labelExists).toBeDefined();
  });

  it('index - should show task count', async () => {
    const testStatus = await models.taskStatus.query().insert({
      name: 'test',
    });

    const testLabel = await models.label.query().insert({
      name: 'Test Label',
    });

    // Create a task linked to the label
    const testTask = await models.task.query().insert({
      name: 'Test Task',
      statusId: testStatus.id,
      creatorId: testUser.id,
    });

    // Link the label to the task
    await models.task.relatedQuery('labels').for(testTask.id).relate(testLabel.id);

    const cookies = await authenticateUser();
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
      cookies,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('1'); // Task count
  });

  afterAll(async () => {
    await app.close();
    if (knex) {
      await knex.destroy();
    }
  });
});
