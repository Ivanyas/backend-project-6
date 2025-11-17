// @ts-check

export const up = (knex) => (
  knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.integer('status_id').unsigned().notNullable();
    table.integer('creator_id').unsigned().notNullable();
    table.integer('executor_id').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign('status_id').references('id').inTable('task_statuses').onDelete('CASCADE');
    table.foreign('creator_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('executor_id').references('id').inTable('users').onDelete('SET NULL');
  })
);

export const down = (knex) => knex.schema.dropTable('tasks');
