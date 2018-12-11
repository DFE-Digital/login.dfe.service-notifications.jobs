const userUpdatedHandlerV1 = require('./userUpdatedHandlerV1');
const sendWSUserUpdatedV1 = require('./sendWSUserUpdatedV1');

const register = (config, logger) => {
  return [
    userUpdatedHandlerV1.getHandler(config, logger),
    sendWSUserUpdatedV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};