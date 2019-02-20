jest.mock('./../../lib/infrastructure/applications');

const ApplicationsClient = require('./../../lib/infrastructure/applications');
const { getAllApplicationRequiringNotification } = require('./../../lib/handlers/utils');

const applicationsClient = {
  listApplications: jest.fn(),
};
const config = {
  serviceNotifications: {
    applications: {
      type: 'test'
    },
  },
};
const condition = () => true;
const correlationId = 'correlation-id';

describe('when getting applications requiring notification', () => {
  beforeEach(() => {
    applicationsClient.listApplications.mockReset().mockReturnValue({
      services: [],
      numberOfPages: 1,
    });
    ApplicationsClient.mockReset().mockImplementation(() => applicationsClient);
  });

  it('then it should create applications client with specified config', async () => {
    await getAllApplicationRequiringNotification(config, condition, correlationId);

    expect(ApplicationsClient).toHaveBeenCalledTimes(1);
    expect(ApplicationsClient).toHaveBeenCalledWith(config.serviceNotifications.applications, correlationId);
  });

  it('then it should read all pages of applications', async () => {
    applicationsClient.listApplications.mockReturnValue({
      services: [],
      numberOfPages: 2,
    });

    await getAllApplicationRequiringNotification(config, condition, correlationId);

    expect(applicationsClient.listApplications).toHaveBeenCalledTimes(2);
    expect(applicationsClient.listApplications).toHaveBeenCalledWith(1, 100);
    expect(applicationsClient.listApplications).toHaveBeenCalledWith(2, 100);
  });

  it('then it should return only applications meeting condition', async () => {
    const service1 = {
      id: 'service-1',
      parentId: undefined,
      params: {
        receiveTestUpdates: true,
      },
    };
    const service2 = {
      id: 'service-2',
      parentId: undefined,
      params: {
        receiveTestUpdates: false,
      },
    };
    applicationsClient.listApplications.mockReturnValue({
      services: [service1, service2],
      numberOfPages: 1,
    });
    const testCondition = jest.fn().mockImplementation((service) => {
      return service.params && service.params.receiveTestUpdates;
    });

    const actual = await getAllApplicationRequiringNotification(config, testCondition, correlationId);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toBe(service1);
    expect(testCondition).toHaveBeenCalledTimes(2);
    expect(testCondition).toHaveBeenCalledWith(service1);
    expect(testCondition).toHaveBeenCalledWith(service2);
  });
});
