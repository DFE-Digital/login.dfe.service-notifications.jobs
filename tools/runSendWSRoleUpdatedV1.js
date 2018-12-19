const { run } = require('./runHelper');

const data = {
  role: {
    id: 'e09a941a-e5f2-40ba-a3b1-7544bdf5309d',
    code: 'DSI_Child_One',
    name: 'DSI Child One',
    status: {
      id: 1,
    },
    numericId: 9999,
    parent: {
      id: '40811352-5bff-4047-a829-9a4a034cb330',
      code: 'DSI_Parent_One',
      name: 'DSI Parent One',
      status: {
        id: 1,
      },
      numericId: 9998,
    },
  },
  applicationId: '77D6B281-9F8D-4649-84B8-87FC42EEE71D',
};

run('sendwsroleupdated_v1', data).then(() => {
  console.info('Job completed successfully');
}).catch((e) => {
  console.error(`Job failed: ${e.stack}`);
}).then(() => {
  process.exit();
});
