const { getAllApplicationRequiringNotification, enqueue } = require('./../utils');
const kue = require('kue');
const uuid = require('uuid/v4');

const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveOrganisationUpdates === 'true';

const getRequiredJobs = async (config, logger, organisation, correlationId) => {
  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId);
  const jobs = applications.map((application) => ({
    organisation,
    applicationId: application.id,
  }));

  return jobs;
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `organisationupdated-${jobId || uuid()}`;

  const jobs = await getRequiredJobs(config, logger, data, correlationId);

  const queue = kue.createQueue({
    redis: config.queueStorage.connectionString,
  });
  for (let i = 0; i < jobs.length; i += 1) {
    await enqueue(queue, 'sendwsorganisationupdated_v1', jobs[i]);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'organisationupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};