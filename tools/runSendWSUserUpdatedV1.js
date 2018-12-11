const { run } = require('./runHelper');

const data = {
  user: {
    userId: 'A92D1615-F520-4D0D-A106-9A9554A8D1EF',
    legacyUserId: 987654,
    email: 'user.one@unit.tests',
    status: 1,
    organisationId: 123,
    organisationUrn: '987654',
    organisationLACode: '999',
    roles: [
      {
        id: 1,
        code: 'ROLE-ONE',
      },
    ],
  },
  applicationId: '057429C0-0700-4FCC-BDA5-32B5B7CE223F',
};

run('sendwsuserupdated_v1', data).then(() => {
  console.info('Job completed successfully');
}).catch((e) => {
  console.error(`Job failed: ${e.stack}`);
}).then(() => {
  process.exit();
});
