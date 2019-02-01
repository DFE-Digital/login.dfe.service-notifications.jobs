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

    if (application.provisionOrganisationFormatterType) {
      secureAccessWebServiceClient.setProvisionOrganisationFormatter(application.provisionOrganisationFormatterType);
    }

    clientCache.push(applicationClient);
  }
  return applicationClient.secureAccessWebServiceClient;
};

const getLastAction = async (repository, applicationId, organisationId) => {
  try {
    const entity = await repository.organisationState.find({
      where: {
        service_id: applicationId,
        organisation_id: organisationId,
      },
    });
    if (!entity) {
      return undefined;
    }

    return entity.last_action_sent;
  } catch (e) {
    throw new Error(`${e.message} thrown when getting previous state`);
  }
};
const getApplicationDetails = async (applicationsClient, applicationId) => {
  const application = await applicationsClient.getApplication(applicationId);
  if (!application) {
    throw new Error(`Cannot find application with id ${applicationId}`);
  }
  if (!application.relyingParty || !application.relyingParty.params || application.relyingParty.params.receiveOrganisationUpdates !== 'true') {
    throw new Error(`Application with id ${applicationId} is not configured to receive organisation updates`);
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
    provisionOrganisationFormatterType: application.relyingParty.params.wsProvisionOrganisationFormatterType,
  }
};
const sendUpdatedUserToApplication = async (action, organisation, application, correlationId) => {
  try {
    const secureAccessWebServiceClient = await getWebServiceClient(application, correlationId);

    const localAuthorityCode = organisation.localAuthority ? organisation.localAuthority.code : undefined;
    const localAuthorityName = organisation.localAuthority ? organisation.localAuthority.name : undefined;
    const typeId = organisation.type ? organisation.type.id : undefined;
    const establishmentDfeNumber = organisation.localAuthority ? `${organisation.localAuthority.code}${organisation.establishmentNumber}` : undefined;
    const regionId = organisation.region ? organisation.region.id : undefined;
    await secureAccessWebServiceClient.provisionOrganisation(action, establishmentDfeNumber, organisation.urn, organisation.establishmentNumber, organisation.uid, localAuthorityCode, localAuthorityName, typeId, organisation.legacyId, organisation.name, organisation.category.id, organisation.status.id, regionId, organisation.telephone);
  } catch (e) {
    throw new Error(`${e.message} thrown when sending update to application`);
  }
};
const storeAction = async (repository, applicationId, organisationId, action) => {
  try {
    await repository.organisationState.upsert({
      service_id: applicationId,
      organisation_id: organisationId,
      last_action_sent: action,
    });
  } catch (e) {
    throw new Error(`${e.message} thrown when storing state`);
  }
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `sendwsorganisationupdated-${jobId || uuid()}`;
  const { applicationId, organisation } = data;

  try {
    const repository = getRepository(config.persistentStorage);
    const applicationsClient = new ApplicationsClient(config.serviceNotifications.applications, correlationId);

    const previousAction = await getLastAction(repository, applicationId, organisation.legacyId);
    const action = previousAction ? 'UPDATE' : 'CREATE';
    const application = await getApplicationDetails(applicationsClient, applicationId);

    await sendUpdatedUserToApplication(action, organisation, application, correlationId);

    await storeAction(repository, applicationId, organisation.legacyId, action);
  } catch (e) {
    logger.error(`Error sending organisation update for ${organisation.id} (legacyId = ${organisation.legacyId}) to ${applicationId} - ${e.message}`, {
      correlationId,
      stack: e.stack
    });
    throw e;
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'sendwsorganisationupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};