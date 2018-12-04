const ApplicationsClient = require('./../../infrastructure/applications');

const getAllApplicationRequiringNotification = async (config, condition, correlationId) => {
  const { listApplications } = new ApplicationsClient(config.serviceNotifications.applications, correlationId);
  let pageNumber = 1;
  let hasMorePages = true;
  let applications = [];
  while (hasMorePages) {
    const page = await listApplications(pageNumber, 100);

    if (page.services && page.services.length > 0) {
      const requiringNotification = page.services.filter(a => condition(a));
      applications.push(...requiringNotification);
    }

    hasMorePages = pageNumber < page.numberOfPages;
    pageNumber += 1;
  }
};

const enqueue = async (queue, type, data) => {
  return new Promise((resolve, reject) => {
    const queuedJob = queue.create(type, data);
    queuedJob.save((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(queuedJob.id);
      }
    });
  });
};

const forEachAsync = async (col, iteratee) => {
  for(let i = 0; i < col.length; i += 1) {
    await iteratee(col[i], i);
  }
};

module.exports = {
  getAllApplicationRequiringNotification,
  enqueue,
  forEachAsync,
};
