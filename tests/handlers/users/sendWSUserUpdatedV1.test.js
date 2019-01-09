jest.mock('./../../../lib/infrastructure/repository');
jest.mock('./../../../lib/infrastructure/applications');
jest.mock('./../../../lib/infrastructure/webServices/SecureAccessWebServiceClient');

const { getRepository } = require('./../../../lib/infrastructure/repository');
const ApplicationsClient = require('./../../../lib/infrastructure/applications');
const SecureAccessWebServiceClient = require('./../../../lib/infrastructure/webServices/SecureAccessWebServiceClient');
const { getDefaultConfig, getLoggerMock, getRepositoryMock, getApplicationsClientMock } = require('./../../testUtils');
const { getHandler } = require('./../../../lib/handlers/users/sendWSUserUpdatedV1');

const config = getDefaultConfig();
const logger = getLoggerMock();
const data = {
  user: {
    userId: 'user1',
    legacyUserId: 987654,
    legacyUsername: 987654,
    firstName: 'User',
    lastName: 'One',
    email: 'user.one@unit.tests',
    status: 1,
    organisationId: 123,
    organisationUrn: '987654',
    organisationLACode: '999',
    roles: [
      {
        id: 'role1',
        code: 'ROLE-ONE',
      },
    ],
  },
  applicationId: 'service1',
};
const jobId = 1;
const applicationsClient = getApplicationsClientMock();
const repository = getRepositoryMock();
const secureAccessWebServiceClient = {
  provisionUser: jest.fn(),
};


describe('when handling sendwsuserupdated_v1 job', () => {
  beforeEach(() => {
    getRepository.mockReset().mockReturnValue(repository);
    repository.mockResetAll();
    repository.userState.find.mockReturnValue({
      user_id: data.user.userId,
      legacy_user_id: data.user.legacyUserId,
      email: data.user.email,
      status_id: data.user.status,
      organisation_id: data.user.organisationId,
      organisation_urn: data.user.organisationUrn,
      organisation_la_code: data.user.organisationLACode,
    });
    repository.userRoleState.findAll.mockReturnValue([
      {
        role_id: data.user.roles[0].id,
        role_code: data.user.roles[0].code,
      },
    ]);

    applicationsClient.mockResetAll();
    applicationsClient.getApplication.mockReturnValue({
      relyingParty: {
        params: {
          receiveUserUpdates: 'true',
          wsWsdlUrl: 'https://service.one.test/ws/wsdl',
          wsUsername: 'userone',
          wsPassword: 'the-password',
        },
      },
    });
    ApplicationsClient.mockImplementation(() => applicationsClient);

    SecureAccessWebServiceClient.create.mockReset().mockImplementation(() => secureAccessWebServiceClient);
    secureAccessWebServiceClient.provisionUser.mockReset();
  });

  it('then it should get previous state for application and user', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(repository.userState.find).toHaveBeenCalledTimes(1);
    expect(repository.userState.find).toHaveBeenCalledWith({
      where: {
        service_id: data.applicationId,
        user_id: data.user.userId,
        organisation_id: data.user.organisationId,
      },
    });
  });

  it('then it should send create message to application if no previous state stored', async () => {
    repository.userState.find.mockReturnValue(undefined);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith('https://service.one.test/ws/wsdl', 'userone', 'the-password', false, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('CREATE', data.user.legacyUserId, data.user.legacyUsername, data.user.firstName, data.user.lastName,
      data.user.email, data.user.organisationId, 1, data.user.organisationUrn, data.user.organisationLACode, data.user.roles);
  });

  it('then it should send update message to application if previous state stored', async () => {
    repository.userState.find.mockReturnValue({ last_state_sent: 'UPDATE' });

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith('https://service.one.test/ws/wsdl', 'userone', 'the-password', false, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('UPDATE', data.user.legacyUserId, data.user.legacyUsername, data.user.firstName, data.user.lastName,
      data.user.email, data.user.organisationId, 1, data.user.organisationUrn, data.user.organisationLACode, data.user.roles);
  });

  it('then it should store the new user state', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(repository.userState.upsert).toHaveBeenCalledTimes(1);
    expect(repository.userState.upsert).toHaveBeenCalledWith({
      service_id: data.applicationId,
      user_id: data.user.userId,
      organisation_id: data.user.organisationId,
      last_action_sent: 'CREATE',
    });
  });
});
