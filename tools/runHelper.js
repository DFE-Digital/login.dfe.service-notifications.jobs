const fs = require('fs');
const path = require('path');
const { register } = require('./../lib');

const run = async (type, data) => {
  const logger = {
    info: (message, meta) => {
      console.info(`INFO: ${message} (meta: ${JSON.stringify(meta)})`);
    },
    warn: (message, meta) => {
      console.warn(`WARN: ${message} (meta: ${JSON.stringify(meta)})`);
    },
    error: (message, meta) => {
      console.error(`ERR: ${message} (meta: ${JSON.stringify(meta)})`);
    },
  };

  let json;
  const configLocation = path.resolve(process.env.settings);
  try {
    json = fs.readFileSync(configLocation);
  } catch (e) {
    throw new Error(`Error reading config from ${configLocation}: ${e.message}`);
  }

  let config;
  try {
    config = JSON.parse(json);
  } catch (e) {
    throw new Error(`Error parsing config: ${e.message}`);
  }

  const jobs = register(config, logger);
  const job = jobs.find(j => j.type === type);
  if (!job) {
    throw new Error(`Cannot find job of type ${type}. Available types are: ${jobs.map(j => j.type).join(', ')}`);
  }

  await job.processor(data);
};

module.exports = {
  run,
};
