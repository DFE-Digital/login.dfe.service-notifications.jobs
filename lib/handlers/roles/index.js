const roleUpdatedHandlerV1 = require('./roleUpdatedHandlerV1');
const sendWSRoleUpdatedV1 = require('./sendWSRoleUpdatedV1');

const register = (config, logger) => {
  return [
    roleUpdatedHandlerV1.getHandler(config, logger),
    sendWSRoleUpdatedV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};