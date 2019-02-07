const union = require('lodash/union');
const users = require('./handlers/users');
const roles = require('./handlers/roles');
const organisations = require('./handlers/organisations');
const uuid = require('uuid/v4');

const register = async (config, logger) => {
  const correlationId = `register-${uuid()}`;
  const userHandlers = await users.register(config, logger, correlationId);
  const roleHandlers = await roles.register(config, logger, correlationId);
  const organisationHandlers = await organisations.register(config, logger, correlationId);

  return union(userHandlers, roleHandlers, organisationHandlers);
};

module.exports = {
  register,
};