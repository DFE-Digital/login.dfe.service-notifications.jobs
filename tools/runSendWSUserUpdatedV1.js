const { run } = require('./runHelper');

const data = {
  user: {
    userId: "A92D1615-F520-4D0D-A106-9A9554A8D1EF",
    legacyUserId: "3601457",
    legacyUsername: 'dis128sj',
    firstName: 'DSI User',
    lastName: 'One',
    email: "user.one@unit.tests",
    status: 1,
    organisationId: "1014619",
    organisationUrn: "136853",
    organisationLACode: "826",
    roles: [
      {
        id: "6",
        code: "access"
      }
    ]
  },
  applicationId: "4FD40032-61A6-4BEB-A6C4-6B39A3AF81C1"
};

run(`sendwsuserupdated_v1_${data.applicationId}`, data).then(() => {
  console.info('Job completed successfully');
}).catch((e) => {
  console.error(`Job failed: ${e.stack}`);
}).then(() => {
  process.exit();
});
