const { getRepository } = require('./../../infrastructure/repository');
const SecureAccessWebServiceClient = require('./../../infrastructure/webServices/SecureAccessWebServiceClient');
const ApplicationsClient = require('./../../infrastructure/applications');
const uuid = require('uuid/v4');

const clientCache = [];

const getWebServiceClient = async (application, correlationId) => {
  let applicationClient = clientCache.find(x => x.applicationId === application.id);
  if (!applicationClient) {
    const secureAccessWebServiceClient = await SecureAccessWebServiceClient.create(application.wsdlUrl,
      application.username, application.password, application.requireAddressing, correlationId);
    applicationClient = {
      applicationId: application.id,
      secureAccessWebServiceClient,
    };

    if (application.provisionUserFormatterType) {
      secureAccessWebServiceClient.setProvisionUserFormatter(application.provisionUserFormatterType);
    }

    clientCache.push(applicationClient);
  }
  return applicationClient.secureAccessWebServiceClient;
};

const getLastAction = async (repository, applicationId, userId, organisationId) => {
  try {
    const userEntity = await repository.userState.find({
      where: {
        service_id: applicationId,
        user_id: userId,
        organisation_id: organisationId,
      },
    });
    if (!userEntity) {
      return undefined;
    }

    return userEntity.last_action_sent;
  } catch (e) {
    throw new Error(`${e.message} thrown when getting previous state`);
  }
};
const getApplicationDetails = async (applicationsClient, applicationId) => {
  const application = await applicationsClient.getApplication(applicationId);
  if (!application) {
    throw new Error(`Cannot find application with id ${applicationId}`);
  }
  if (!application.relyingParty || !application.relyingParty.params || application.relyingParty.params.receiveUserUpdates !== 'true') {
    throw new Error(`Application with id ${applicationId} is not configured to receive user updates`);
  }
  if (!application.relyingParty.params.wsWsdlUrl) {
    throw new Error(`Application with id ${applicationId} does not have wsWsdlUrl configured`);
  }
  return {
    id: application.id,
    wsdlUrl: application.relyingParty.params.wsWsdlUrl,
    username: application.relyingParty.params.wsUsername,
    password: application.relyingParty.params.wsPassword,
    requireAddressing: application.relyingParty.params.wsUseAddressingHeaders ? application.relyingParty.params.wsUseAddressingHeaders === 'true' : false,
    provisionUserFormatterType: application.relyingParty.params.wsProvisionUserFormatterType,
  }
};
const sendUpdatedUserToApplication = async (action, user, application, correlationId) => {
  try {
    const secureAccessWebServiceClient = await getWebServiceClient(application, correlationId);
    await secureAccessWebServiceClient.provisionUser(action, user.legacyUserId, user.legacyUsername,
      user.firstName, user.lastName, user.email, user.organisationId, user.status, user.organisationUrn,
      user.organisationLACode, user.roles);
  } catch (e) {
    throw new Error(`${e.message} thrown when sending update to application`);
  }
};
const storeAction = async (repository, applicationId, userId, organisationId, action) => {
  try {
    await repository.userState.upsert({
      service_id: applicationId,
      user_id: userId,
      organisation_id: organisationId,
      last_action_sent: action,
    });
  } catch (e) {
    throw new Error(`${e.message} thrown when storing state`);
  }
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `senduserupdated-${jobId || uuid()}`;
  const { applicationId, user } = data;

  try {
    const repository = getRepository(config.persistentStorage);
    const applicationsClient = new ApplicationsClient(config.serviceNotifications.applications, correlationId);

    const previousAction = await getLastAction(repository, applicationId, user.userId, user.organisationId);
    const action = previousAction ? 'UPDATE' : 'CREATE';
    const application = await getApplicationDetails(applicationsClient, applicationId);

    await sendUpdatedUserToApplication(action, user, application, correlationId);

    await storeAction(repository, applicationId, user.userId, user.organisationId, action);
  } catch (e) {
    logger.error(`Error sending user update for ${user.userId} to ${applicationId} - ${e.message}`, {
      correlationId,
      stack: e.stack
    });
    throw e;
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'sendwsuserupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};