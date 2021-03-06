const { run } = require('./runHelper');

const data = {
  organisation: {
    id: '60EEAA8D-D21D-44E9-BF10-6220E841FDAB',
    name: 'Oxley Park Academy',
    category: {
      id: '001',
      name: 'Establishment'
    },
    type: {
      id: '34',
      name: 'Academy Converter'
    },
    urn: '136853',
    uid: null,
    ukprn: '10034071',
    establishmentNumber: '3388',
    status: {
      id: 1,
      name: 'Open'
    },
    closedOn: null,
    address: 'Redgrave Drive, Oxley Park, Milton Keynes, Buckinghamshire, MK4 4TA',
    telephone: '01908503870',
    region: {
      id: 'J',
      name: 'South East'
    },
    localAuthority: {
      id: '9A355831-2831-4AF8-89A1-03D45D8E7A2B',
      name: 'Test Organisation 134',
      code: '826'
    },
    phaseOfEducation: {
      id: 2,
      name: 'Primary'
    },
    statutoryLowAge: 3,
    statutoryHighAge: 11,
    legacyId: '1014619',
    companyRegistrationNumber: null
  },
  applicationId: '4FD40032-61A6-4BEB-A6C4-6B39A3AF81C1',
};

run(`sendwsorganisationupdated_v1_${data.applicationId}`, data).then(() => {
  console.info('Job completed successfully');
}).catch((e) => {
  console.error(`Job failed: ${e.stack}`);
}).then(() => {
  process.exit();
});
