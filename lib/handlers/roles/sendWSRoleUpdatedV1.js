const { getRepository } = require('./../../infrastructure/repository');
const SecureAccessWebServiceClient = require('./../../infrastructure/webServices/SecureAccessWebServiceClient');
const ApplicationsClient = require('./../../infrastructure/applications');
const uuid = require('uuid/v4');

const getLastAction = async (repository, applicationId, roleId) => {
  try {
    const entity = await repository.roleState.find({
      where: {
        service_id: applicationId,
        role_id: roleId,
      },
    });
    if (!entity) {
      return undefined;
    }

    return entity.last_state_sent;
  } catch (e) {
    throw new Error(`${e.message} thrown when getting previous state`);
  }
};
const getApplicationDetails = async (applicationsClient, applicationId) => {
  const application = await applicationsClient.getApplication(applicationId);
  if (!application) {
    throw new Error(`Cannot find application with id ${applicationId}`);
  }
  if (!application.relyingParty || !application.relyingParty.params || application.relyingParty.params.receiveRoleUpdates !== 'true') {
    throw new Error(`Application with id ${applicationId} is not configured to receive role updates`);
  }
  if (!application.relyingParty.params.wsWsdlUrl) {
    throw new Error(`Application with id ${applicationId} does not have wsWsdlUrl configured`);
  }
  return {
    wsdlUrl: application.relyingParty.params.wsWsdlUrl,
    username: application.relyingParty.params.wsUsername,
    password: application.relyingParty.params.wsPassword,
    requireAddressing: false,
  }
};
const sendUpdatedUserToApplication = async (action, role, application, config, correlationId) => {
  try {
    const status = role.status.id === 1 ? 'Active' : 'Archived';
    const secureAccessWebServiceClient = await SecureAccessWebServiceClient.create(application.wsdlUrl,
      application.username, application.password, application.requireAddressing, correlationId);
    await secureAccessWebServiceClient.provisionGroup(action, role.id, role.code, role.name, status,
      role.parent ? role.parent.id : null, role.parent ? role.parent.code : null);
  } catch (e) {
    throw new Error(`${e.message} thrown when sending update to application`);
  }
};
const storeAction = async (repository, applicationId, roleId, action) => {
  try {
    await repository.roleState.upsert({
      service_id: applicationId,
      role_id: roleId,
      last_action_sent: action,
    });
  } catch (e) {
    throw new Error(`${e.message} thrown when storing state`);
  }
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `sendwsroleupdated-${jobId || uuid()}`;
  const { applicationId, role } = data;

  try {
    const repository = getRepository(config.persistentStorage);
    const applicationsClient = new ApplicationsClient(config.serviceNotifications.applications, correlationId);

    const previousAction = await getLastAction(repository, applicationId, role.id);
    const action = previousAction ? 'UPDATE' : 'CREATE';
    const application = await getApplicationDetails(applicationsClient, applicationId);

    await sendUpdatedUserToApplication(action, role, application, config, correlationId);

    await storeAction(repository, applicationId, role.id, action);
  } catch (e) {
    logger.error(`Error sending role update for ${role.id} to ${applicationId} - ${e.message}`, {
      correlationId,
      stack: e.stack
    });
    throw e;
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'sendwsroleupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};