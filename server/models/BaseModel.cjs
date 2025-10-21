// @ts-check

const { Model, snakeCaseMappers } = require('objection');

module.exports = class BaseModel extends Model {
  static get modelPaths() {
    return [__dirname];
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}