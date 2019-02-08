const { getRepository } = require('./../../infrastructure/repository');
const SecureAccessWebServiceClient = require('./../../infrastructure/webServices/SecureAccessWebServiceClient');
const uuid = require('uuid/v4');

const clientCache = [];

const getWebServiceClient = async (application, correlationId) => {
  const wsdlUrl = application.relyingParty.params.wsWsdlUrl;
  const username = application.relyingParty.params.wsUsername;
  const password = application.relyingParty.params.wsPassword;
  const requireAddressing = application.relyingParty.params.wsUseAddressingHeaders ? application.relyingParty.params.wsUseAddressingHeaders === 'true' : false;
  const provisionOrganisationFormatterType = application.relyingParty.params.wsProvisionOrganisationFormatterType;

  let applicationClient = clientCache.find(x => x.applicationId === application.id);
  if (!applicationClient) {
    const secureAccessWebServiceClient = await SecureAccessWebServiceClient.create(wsdlUrl,
      username, password, requireAddressing, correlationId);
    applicationClient = {
      applicationId: application.id,
      secureAccessWebServiceClient,
    };

    if (provisionOrganisationFormatterType) {
      secureAccessWebServiceClient.setProvisionOrganisationFormatter(provisionOrganisationFormatterType);
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

const process = async (config, logger, application, data, jobId) => {
  const correlationId = `sendwsorganisationupdated-${jobId || uuid()}`;
  const { organisation } = data;

  try {
    const repository = getRepository(config.persistentStorage);

    const previousAction = await getLastAction(repository, application.id, organisation.legacyId);
    const action = previousAction ? 'UPDATE' : 'CREATE';

    await sendUpdatedUserToApplication(action, organisation, application, correlationId);

    await storeAction(repository, application.id, organisation.legacyId, action);
  } catch (e) {
    logger.error(`Error sending organisation update for ${organisation.id} (legacyId = ${organisation.legacyId}) to ${application.id} - ${e.message}`, {
      correlationId,
      stack: e.stack
    });
    throw e;
  }
};

const getHandler = (config, logger, application) => {
  return {
    type: `sendwsorganisationupdated_v1_${application.id}`,
    processor: async (data, jobId) => {
      await process(config, logger, application, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};