const process = async (config, logger, data, jobId) => {
  const correlationId = `sendwsroleupdated-${jobId || uuid()}`;
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