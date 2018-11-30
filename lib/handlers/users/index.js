const userUpdatedHandlerV1 = require('./userUpdatedHandler_v1');

const register = (config, logger) => {
  return [
    userUpdatedHandlerV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};