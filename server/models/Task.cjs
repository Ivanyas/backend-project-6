// @ts-check

const BaseModel = require('./BaseModel.cjs');

module.exports = class Task extends BaseModel {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: ['string', 'null'] },
        statusId: { type: 'integer' },
        creatorId: { type: 'integer' },
        executorId: { type: ['integer', 'null'] },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User.cjs');
    const TaskStatus = require('./TaskStatus.cjs');
    const Label = require('./Label.cjs');

    return {
      status: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: TaskStatus,
        join: {
          from: 'tasks.status_id',
          to: 'task_statuses.id',
        },
      },
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creator_id',
          to: 'users.id',
        },
      },
      executor: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executor_id',
          to: 'users.id',
        },
      },
      labels: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Label,
        join: {
          from: 'tasks.id',
          through: {
            from: 'task_labels.taskId',
            to: 'task_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }
};
