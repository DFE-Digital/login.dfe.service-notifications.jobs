const { getAllApplicationRequiringNotification, enqueue } = require('./../utils');
const AccessClient = require('./../../infrastructure/access');
const OrganisatonsClient = require('./../../infrastructure/organisations');
const kue = require('kue');
const uuid = require('uuid/v4');

const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveUserUpdates === 'true';

const getRequiredJobs = async (config, logger, user, correlationId) => {
  const accessClient = new AccessClient(config.serviceNotifications.access, correlationId);
  const organisationsClient = new OrganisatonsClient(config.serviceNotifications.organisations, correlationId);

  const jobs = [];
  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId);
  const userOrganisations = await organisationsClient.listUserOrganisations(user.sub);
  const userAccess = await accessClient.listUserAccess(user.sub);

  applications.forEach((application) => {
    const userAccessToApplication = userAccess.filter(x => x.serviceId.toLowerCase() === application.id.toLowerCase());
    userAccessToApplication.forEach((applicationAccess) => {
      const organisationAccess = userOrganisations.find(o => o.organisation.id.toLowerCase() === applicationAccess.organisationId.toLowerCase());
      if (!organisationAccess) {
        logger.warn(`User ${user.sub} appears to have access to ${applicationAccess.serviceId} for organisation ${applicationAccess.organisationId}; however could not find access to org`, { correlationId });
        return;
      }

      jobs.push({
        user: {
          userId: user.sub,
          legacyUserId: organisationAccess.numericIdentifier,
          email: user.email,
          status: user.status.id,
          organisationId: organisationAccess.organisation.legacyId,
          organisationUrn: organisationAccess.organisation.urn,
          organisationLACode: organisationAccess.organisation.localAuthority ? organisationAccess.organisation.localAuthority.code : '',
          roles: applicationAccess.roles.map((role) => ({
            id: role.numericId,
            code: role.code,
          })),
        },
        applicationId: application.id,
      });
    })
  });

  return jobs;
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `userupdated-${jobId || uuid()}`;

  const jobs = await getRequiredJobs(config, logger, data, correlationId);

  const queue = kue.createQueue({
    redis: config.queueStorage.connectionString,
  });
  for (let i = 0; i < jobs.length; i += 1) {
    await enqueue(queue, 'sendwsuserupdated_v1', jobs[i]);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'userupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};