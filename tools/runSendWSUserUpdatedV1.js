const { run } = require('./runHelper');

const data = {
  user: {
    userId: "A92D1615-F520-4D0D-A106-9A9554A8D1EF",
    legacyUserId: "3601457",
    email: "user.one@unit.tests",
    status: 1,
    organisationId: "1014619",
    organisationUrn: "136853",
    organisationLACode: "826",
    roles: [
      {
        id: "9999",
        code: "DSI_Child_One"
      }
    ]
  },
  applicationId: "77D6B281-9F8D-4649-84B8-87FC42EEE71D"
};

run('sendwsuserupdated_v1', data).then(() => {
  console.info('Job completed successfully');
}).catch((e) => {
  console.error(`Job failed: ${e.stack}`);
}).then(() => {
  process.exit();
});
