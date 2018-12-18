const union = require('lodash/union');
const users = require('./handlers/users');
const roles = require('./handlers/roles');
const organisations = require('./handlers/organisations');

const register = (config, logger) => {
  const userHandlers = users.register(config, logger);
  const roleHandlers = roles.register(config, logger);
  const organisationHandlers = organisations.register(config, logger);

  return union(userHandlers, roleHandlers, organisationHandlers);
};

module.exports = {
  register,
};