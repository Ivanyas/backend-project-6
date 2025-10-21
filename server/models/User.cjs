// @ts-check

const BaseModel = require('./BaseModel.cjs');
const objectionUnique = require('objection-unique');
const encrypt = require('../lib/secure.cjs');

const unique = objectionUnique({ fields: ['email'] });

module.exports = class User extends unique(BaseModel) {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'passwordDigest'],
      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', minLength: 1 },
        password: { type: 'string', minLength: 3 },
        passwordDigest: { type: 'string' },
      },
    };
  }

  $beforeValidate(jsonSchema, json, opt) {
    // If password is provided, set passwordDigest before validation
    if (json.password && !json.passwordDigest) {
      this.password = json.password;
    }
    return jsonSchema;
  }

  set password(value) {
    if (value) {
      this.passwordDigest = encrypt(value);
    }
  }

  verifyPassword(password) {
    return encrypt(password) === this.passwordDigest;
  }
}