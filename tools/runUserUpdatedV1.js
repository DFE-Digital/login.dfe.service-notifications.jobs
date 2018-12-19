const { run } = require('./runHelper');

const data = {
  "sub": "A92D1615-F520-4D0D-A106-9A9554A8D1EF",
  "given_name": "User",
  "family_name": "One",
  "email": "user.one@unit.tests",
  "status": {
    id: 1
  },
};

run('userupdated_v1', data).then(() => {
  console.info('Job completed successfully');
}).catch((e) => {
  console.error(`Job failed: ${e.stack}`);
}).then(() => {
  process.exit();
});
