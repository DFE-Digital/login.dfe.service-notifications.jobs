const union = require('lodash/union');
const users = require('./handlers/users');

const register = (config, logger) => {
  const userHandlers = users.register(config, logger);

  return union(userHandlers);
};

module.exports = {
  register,
};