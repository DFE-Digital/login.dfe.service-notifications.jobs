const organisationUpdatedHandlerV1 = require('./organisationUpdatedHandlerV1');
const sendWSOrganisationUpdatedV1 = require('./sendWSOrganisationUpdatedV1');

const register = (config, logger) => {
  return [
    organisationUpdatedHandlerV1.getHandler(config, logger),
    sendWSOrganisationUpdatedV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};