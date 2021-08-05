const getDefaultConfig = () => {
  return {
    queueStorage: {
      connectionString: 'redis://test:6379',
    },
    persistentStorage: {
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
      applications: {
        service: {
          url: 'https://organisations.unit.tests',
        },
      },
    },
  };
};

const getLoggerMock = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    mockResetAll: function() {
      this.info.mockReset();
      this.warn.mockReset();
      this.error.mockReset();
    },
  };
};

const getAccessClientMock = () => {
  return {
    listUserAccess: jest.fn(),
    mockResetAll: function () {
      this.listUserAccess.mockReset();
    },
  };
};

const getOrganisationsClientMock = () => {
  return {
    listUserOrganisations: jest.fn(),
    mockResetAll: function () {
      this.listUserOrganisations.mockReset();
    },
  };
};

const getApplicationsClientMock = () => {
  return {
    listApplications: jest.fn(),
    getApplication: jest.fn(),
    mockResetAll: function () {
      this.listApplications.mockReset();
      this.getApplication.mockReset();
    },
  };
};

const getDirectoriesClientMock = () => {
  return {
    getUser: jest.fn(),
    mockResetAll: function () {
      this.getUser.mockReset();
    },
  };
};

const mockEntity = () => {
  return {
    findOne: jest.fn(),
    findAll: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    mockResetAll: function() {
      this.findOne.mockReset();
      this.findAll.mockReset();
      this.upsert.mockReset();
      this.create.mockReset();
      this.destroy.mockReset();
    }
  };
};
const getRepositoryMock = () => {
  return {
    userState: mockEntity(),
    userRoleState: mockEntity(),
    mockResetAll: function() {
      this.userState.mockResetAll();
      this.userRoleState.mockResetAll();
    }
  };
};

const mockHandler = (type) => {
  return {
    type,
    processor: jest.fn(),
  };
};

module.exports = {
  getDefaultConfig,
  getLoggerMock,
  getAccessClientMock,
  getOrganisationsClientMock,
  getApplicationsClientMock,
  getDirectoriesClientMock,
  getRepositoryMock,
  mockHandler,
};
