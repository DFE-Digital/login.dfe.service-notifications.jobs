jest.mock('./../../lib/infrastructure/repository');
jest.mock('./../../lib/infrastructure/webServices/SecureAccessWebServiceClient');

const { getRepository } = require('./../../lib/infrastructure/repository');
const SecureAccessWebServiceClient = require('./../../lib/infrastructure/webServices/SecureAccessWebServiceClient');
const { getDefaultConfig, getLoggerMock, getRepositoryMock } = require('./../testUtils');
const { getHandler } = require('./../../lib/handlers/users/sendWSUserUpdatedV1');

const config = getDefaultConfig();
const logger = getLoggerMock();
const data = {
  user: {
    userId: 'user1',
    legacyUserId: 987654,
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
  application: {
    id: 'service1',
    wsdlUrl: 'https://service.one/wsdl',
    provisionUserAction: 'pu-action',
  }
};
const jobId = 1;
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

    SecureAccessWebServiceClient.create.mockReset().mockImplementation(() => secureAccessWebServiceClient);
    secureAccessWebServiceClient.provisionUser.mockReset();
  });

  it('then it should get previous state for application and user', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(repository.userState.find).toHaveBeenCalledTimes(1);
    expect(repository.userState.find).toHaveBeenCalledWith({
      where: {
        service_id: 'service1',
        legacy_user_id: 987654,
      }
    });
    expect(repository.userRoleState.findAll).toHaveBeenCalledTimes(1);
    expect(repository.userRoleState.findAll).toHaveBeenCalledWith({
      where: {
        service_id: 'service1',
        legacy_user_id: 987654,
      }
    });
  });

  it('then it should send create message to application if no previous state stored', async () => {
    repository.userState.find.mockReturnValue(undefined);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith(data.application.wsdlUrl, undefined, data.application.provisionUserAction, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('CREATE', data.user.legacyUserId, data.user.email, data.user.status,
      data.user.organisationUrn, data.user.organisationLACode, [
        { action: 'ADD', id: data.user.roles[0].id, code: data.user.roles[0].code },
      ]);
  });

  it('then it should send update message to application if email has changed', async () => {
    repository.userState.find.mockReturnValue({
      user_id: data.user.userId,
      legacy_user_id: data.user.legacyUserId,
      email: 'user.one+1@unit.tests',
      status_id: data.user.status,
      organisation_id: data.user.organisationId,
      organisation_urn: data.user.organisationUrn,
      organisation_la_code: data.user.organisationLACode,
    });

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith(data.application.wsdlUrl, undefined, data.application.provisionUserAction, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('UPDATE', data.user.legacyUserId, data.user.email, data.user.status,
      data.user.organisationUrn, data.user.organisationLACode, []);
  });

  it('then it should send update message to application if status has changed', async () => {
    repository.userState.find.mockReturnValue({
      user_id: data.user.userId,
      legacy_user_id: data.user.legacyUserId,
      email: data.user.email,
      status_id: 2,
      organisation_id: data.user.organisationId,
      organisation_urn: data.user.organisationUrn,
      organisation_la_code: data.user.organisationLACode,
    });

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith(data.application.wsdlUrl, undefined, data.application.provisionUserAction, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('UPDATE', data.user.legacyUserId, data.user.email, data.user.status,
      data.user.organisationUrn, data.user.organisationLACode, []);
  });

  it('then it should send update message to application if new role added', async () => {
    repository.userRoleState.findAll.mockReturnValue([]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith(data.application.wsdlUrl, undefined, data.application.provisionUserAction, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('UPDATE', data.user.legacyUserId, data.user.email, data.user.status,
      data.user.organisationUrn, data.user.organisationLACode, [
        { action: 'ADD', id: data.user.roles[0].id, code: data.user.roles[0].code },
      ]);
  });

  it('then it should send update message to application if old role removed', async () => {
    repository.userRoleState.findAll.mockReturnValue([
      {
        role_id: data.user.roles[0].id,
        role_code: data.user.roles[0].code,
      },
      {
        role_id: 'role2',
        role_code: 'ROLE-TWO',
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith(data.application.wsdlUrl, undefined, data.application.provisionUserAction, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('UPDATE', data.user.legacyUserId, data.user.email, data.user.status,
      data.user.organisationUrn, data.user.organisationLACode, [
        { action: 'REMOVE', id: 'role2', code: 'ROLE-TWO' },
      ]);
  });

  it('then it should store the new user state', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(repository.userState.upsert).toHaveBeenCalledTimes(1);
    expect(repository.userState.upsert).toHaveBeenCalledWith({
      service_id: data.application.id,
      legacy_user_id: data.user.legacyUserId,
      user_id: data.user.userId,
      email: data.user.email,
      status_id: data.user.status,
      organisation_id: data.user.organisationId,
      organisation_urn: data.user.organisationUrn,
      organisation_la_code: data.user.organisationLACode,
    });
    expect(repository.userRoleState.destroy).toHaveBeenCalledTimes(1);
    expect(repository.userRoleState.destroy).toHaveBeenCalledWith({
      where: {
        service_id: data.application.id,
        legacy_user_id: data.user.legacyUserId,
      },
    });
    expect(repository.userRoleState.create).toHaveBeenCalledTimes(1);
    expect(repository.userRoleState.create).toHaveBeenCalledWith({
      service_id: data.application.id,
      legacy_user_id: data.user.legacyUserId,
      role_id: data.user.roles[0].id,
      role_code: data.user.roles[0].code,
    });
  });
});
