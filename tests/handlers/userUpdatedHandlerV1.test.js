jest.mock('kue');
jest.mock('./../../lib/infrastructure/access');
jest.mock('./../../lib/infrastructure/organisations');
jest.mock('./../../lib/handlers/utils');

const kue = require('kue');
const AccessClient = require('./../../lib/infrastructure/access');
const OrganisatonsClient = require('./../../lib/infrastructure/organisations');
const { getAllApplicationRequiringNotification, enqueue } = require('./../../lib/handlers/utils');
const { getHandler } = require('./../../lib/handlers/users/userUpdatedHandlerV1');

const config = {
  queueStorage: {
    connectionString: 'redis://test:6379',
  },
  serviceNotifications: {
    access: {
      service: {
        url: 'https://access.unit.tests',
      },
    },
    organisations: {
      service: {
        url: 'https://organisations.unit.tests',
      },
    },
  },
};
const logger = {};
const data = {
  sub: 'user1',
  email: 'user.one@unit.tests',
  status: {
    id: 1,
  },
};
const jobId = 1;
const queue = {};
const accessClient = {
  listUserAccess: jest.fn(),
  mockResetAll: function () {
    this.listUserAccess.mockReset();
  },
};
const organisatonsClient = {
  listUserOrganisations: jest.fn(),
  mockResetAll: function () {
    this.listUserOrganisations.mockReset();
  },
};

describe('when handling userupdated_v1 job', () => {
  beforeEach(() => {
    accessClient.mockResetAll();
    accessClient.listUserAccess.mockReturnValue([
      {
        serviceId: 'service1',
        organisationId: 'organisation1',
        roles: [
          { id: 'role1', code: 'ROLE-ONE' },
        ],
      },
      {
        serviceId: 'service2',
        organisationId: 'organisation1',
        roles: [
          { id: 'role2', code: 'ROLE-TWO' },
        ],
      },
    ]);
    AccessClient.mockImplementation(() => accessClient);

    organisatonsClient.mockResetAll();
    organisatonsClient.listUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: 'organisation1',
          legacyId: 123,
          urn: '985632',
          localAuthority: {
            code: '999',
          },
        },
        numericIdentifier: 'sauser1',
      },
    ]);
    OrganisatonsClient.mockImplementation(() => organisatonsClient);

    kue.createQueue.mockReset().mockReturnValue(queue);

    getAllApplicationRequiringNotification.mockReset().mockReturnValue([]);

    enqueue.mockReset();
  });

  it('then it should return handler with correct type', () => {
    const handler = getHandler(config, logger);

    expect(handler.type).toBe('userupdated_v1');
  });

  it('then it should create queue with correct connectionString', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(kue.createQueue).toHaveBeenCalledTimes(1);
    expect(kue.createQueue).toHaveBeenCalledWith({
      redis: config.queueStorage.connectionString,
    });
  });

  it('then it should get applications that require user updates', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(getAllApplicationRequiringNotification).toHaveBeenCalledTimes(1);
    expect(getAllApplicationRequiringNotification.mock.calls[0][0]).toBe(config);
    expect(getAllApplicationRequiringNotification.mock.calls[0][2]).toBe('userupdated-1');
    expect(getAllApplicationRequiringNotification.mock.calls[0][1]({})).toBeUndefined();
    expect(getAllApplicationRequiringNotification.mock.calls[0][1]({ relyingParty: {} })).toBeUndefined();
    expect(getAllApplicationRequiringNotification.mock.calls[0][1]({ relyingParty: { params: {} } })).toBe(false);
    expect(getAllApplicationRequiringNotification.mock.calls[0][1]({ relyingParty: { params: { receiveUserUpdates: 'false' } } })).toBe(false);
    expect(getAllApplicationRequiringNotification.mock.calls[0][1]({ relyingParty: { params: { receiveUserUpdates: 'true' } } })).toBe(true);
  });

  it('then it should queue a senduserupdated_v1 job for each application', async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: 'service1',
        relyingParty: {
          params: {
            wsWsdlUrl: 'https://service.one/wsdl',
            wsProvisionUserAction: 'pu-action',
          },
        },
      },
      {
        id: 'service2',
        relyingParty: {
          params: {
            wsWsdlUrl: 'https://service.two/wsdl',
            wsProvisionUserAction: 'pu-action-1',
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenCalledWith(queue, 'sendwsuserupdated_v1', {
      application: {
        id: 'service1',
        wsdlUrl: 'https://service.one/wsdl',
        provisionUserAction: 'pu-action',
      },
      user: {
        userId: 'user1',
        legacyUserId: 'sauser1',
        email: 'user.one@unit.tests',
        status: 1,
        organisationId: 123,
        organisationUrn: '985632',
        organisationLACode: '999',
        roles: [
          {
            id: 'role1',
            code: 'ROLE-ONE',
          },
        ],
      },
    });
    expect(enqueue).toHaveBeenCalledWith(queue, 'sendwsuserupdated_v1', {
      application: {
        id: 'service2',
        wsdlUrl: 'https://service.two/wsdl',
        provisionUserAction: 'pu-action-1',
      },
      user: {
        userId: 'user1',
        legacyUserId: 'sauser1',
        email: 'user.one@unit.tests',
        status: 1,
        organisationId: 123,
        organisationUrn: '985632',
        organisationLACode: '999',
        roles: [
          {
            id: 'role2',
            code: 'ROLE-TWO',
          },
        ],
      },
    });
  });
});
