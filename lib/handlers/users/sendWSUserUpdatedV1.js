const { getRepository } = require('./../../infrastructure/repository');

const process = async (config, logger, data, jobId) => {
  const correlationId = `senduserupdated-${jobId || uuid()}`;
  // const { userNotifications } = getRepository(config.persistentStorage);
  const { application, user } = data;


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