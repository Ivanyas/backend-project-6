// @ts-check

import fastify from 'fastify';
import init from './server/plugin.js';
import rollbar from './server/lib/logger/logger.js';

const mode = process.env.NODE_ENV || 'development';
const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Validate required environment variables
if (!process.env.SESSION_KEY) {
  rollbar.error('ERROR: SESSION_KEY environment variable is required!');
  rollbar.error('Please set SESSION_KEY in your Render environment variables.');
  rollbar.error('You can generate a secure key with: openssl rand -base64 32');
  process.exit(1);
}

const start = async () => {
  const app = fastify({
    exposeHeadRoutes: false,
    logger: {
      level: mode === 'production' ? 'info' : 'debug',
    },
  });

  // Register the plugin
  await app.register(init);

  // Run migrations in production (after plugin is registered, we have access to knex)
  if (mode === 'production' && app.objection?.knex) {
    try {
      await app.objection.knex.migrate.latest();
      app.log.info('Database migrations completed');
    } catch (error) {
      app.log.error('Migration error:', error);
      // Don't throw - let the server start even if migrations fail
      // (migrations might have already been run)
    }
  }

  try {
    await app.listen({ port, host });
    app.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
