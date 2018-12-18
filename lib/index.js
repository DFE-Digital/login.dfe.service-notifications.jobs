const union = require('lodash/union');
const users = require('./handlers/users');
const roles = require('./handlers/roles');

const register = (config, logger) => {
  const userHandlers = users.register(config, logger);
  const roleHandlers = roles.register(config, logger);

  return union(userHandlers, roleHandlers);
};

module.exports = {
  register,
};