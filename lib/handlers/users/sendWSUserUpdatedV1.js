const { getRepository } = require('./../../infrastructure/repository');
const SecureAccessWebServiceClient = require('./../../infrastructure/webServices/SecureAccessWebServiceClient');
const { forEachAsync } = require('./../utils');
const uuid = require('uuid/v4');

const getPreviousState = async (repository, applicationId, legacyUserId) => {
  try {
    const userEntity = await repository.userState.find({
      where: {
        service_id: applicationId,
        legacy_user_id: legacyUserId,
      },
    });
    if (!userEntity) {
      return undefined;
    }

    const previousState = {
      userId: userEntity.user_id,
      legacyUserId: userEntity.legacy_user_id,
      email: userEntity.email,
      status: userEntity.status_id,
      organisationId: userEntity.organisation_id,
      organisationUrn: userEntity.organisation_urn,
      organisationLACode: userEntity.organisation_la_code,
      roles: [],
    };

    const roleEntities = await repository.userRoleState.findAll({
      where: {
        service_id: applicationId,
        legacy_user_id: legacyUserId,
      },
    });
    if (roleEntities) {
      previousState.roles = roleEntities.map((roleEntity) => ({
        id: roleEntity.role_id,
        code: roleEntity.role_code,
      }));
    }

    return previousState;
  } catch (e) {
    throw new Error(`${e.message} thrown when getting previous state`);
  }
};
const getUpdatedUserIfChanged = (user, previousState) => {
  try {
    const updated = {
      saUserId: user.legacyUserId,
      emailAddress: user.email,
      organisationId: user.organisationId,
      wsAccountStatusCode: user.status,
      establishmentUrn: user.organisationUrn,
      localAuthorityCode: user.organisationLACode,
      groups: [],
    };

    if (previousState) {
      if (user.email !== previousState.email || user.status !== previousState.status) {
        updated.action = 'UPDATE';
      }
      user.roles.forEach((newRole) => {
        if (!previousState.roles.find(oldRole => newRole.id === oldRole.id)) {
          updated.action = 'UPDATE';
          updated.groups.push({
            action: 'ADD',
            id: newRole.id,
            code: newRole.code,
          });
        }
      });
      previousState.roles.forEach((oldRole) => {
        if (!user.roles.find(newRole => newRole.id === oldRole.id)) {
          updated.action = 'UPDATE';
          updated.groups.push({
            action: 'REMOVE',
            id: oldRole.id,
            code: oldRole.code,
          });
        }
      });
    } else {
      updated.action = 'CREATE';
      updated.groups = user.roles.map((role) => ({
        action: 'ADD',
        id: role.id,
        code: role.code,
      }));
    }

    return updated.action ? updated : undefined;
  } catch (e) {
    throw new Error(`${e.message} thrown when checking for updates`);
  }
};
const sendUpdatedUserToApplication = async (updated, application, config, correlationId) => {
  try {
    const secureAccessWebServiceClient = await SecureAccessWebServiceClient.create(application.wsdlUrl,
      undefined, application.provisionUserAction, correlationId);
    await secureAccessWebServiceClient.provisionUser(updated.action, updated.saUserId, updated.emailAddress,
      updated.wsAccountStatusCode, updated.establishmentUrn, updated.localAuthorityCode, updated.groups);
  } catch (e) {
    throw new Error(`${e.message} thrown when sending update to application`);
  }
};
const storeState = async (repository, applicationId, user) => {
  try {
    await repository.userState.upsert({
      service_id: applicationId,
      legacy_user_id: user.legacyUserId,
      user_id: user.userId,
      email: user.email,
      status_id: user.status,
      organisation_id: user.organisationId,
      organisation_urn: user.organisationUrn,
      organisation_la_code: user.organisationLACode,
    });

    await repository.userRoleState.destroy({
      where: {
        service_id: applicationId,
        legacy_user_id: user.legacyUserId,
      },
    });
    await forEachAsync(user.roles, async (role) => {
      await repository.userRoleState.create({
        service_id: applicationId,
        legacy_user_id: user.legacyUserId,
        role_id: role.id,
        role_code: role.code,
      });
    });
  } catch (e) {
    throw new Error(`${e.message} thrown when storing state`);
  }
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `senduserupdated-${jobId || uuid()}`;
  const { application, user } = data;

  try {
    const repository = getRepository(config.persistentStorage);
    const previousState = await getPreviousState(repository, application.id, user.legacyUserId);
    const updated = getUpdatedUserIfChanged(user, previousState);
    if (updated) {
      await sendUpdatedUserToApplication(updated, application, config, correlationId);
    }
    await storeState(repository, application.id, user);
  } catch (e) {
    logger.error(`Error sending user update for ${user.userId} to ${application.id} - ${e.message}`, {
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