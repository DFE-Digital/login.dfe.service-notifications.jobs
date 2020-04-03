const Sequelize = require('sequelize').default;
const { makeConnection } = require('./connection');

const defineUserState = (db) => {
  return db.define('user_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    last_action_sent: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'user_state',
    schema: 'service_notifications',
  });
};
const defineRoleState = (db) => {
  return db.define('role_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    role_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    last_action_sent: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'role_state',
    schema: 'service_notifications',
  });
};
const defineOrganisationState = (db) => {
  return db.define('organisation_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    last_action_sent: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'organisation_state',
    schema: 'service_notifications',
  });
};
const defineOrganisation = (db) => {
  return db.define('organisation', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    Category: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    URN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    UID: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    UKPRN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    EstablishmentNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Status: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ClosedOn: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    Address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    phaseOfEducation: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    statutoryLowAge: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    statutoryHighAge: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    telephone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    regionCode: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    legacyId: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    companyRegistrationNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'organisation'
  });
};

const getRepository = (opts) => {
  const db = makeConnection(opts);

  const userState = defineUserState(db);
  const roleState = defineRoleState(db);
  const organisationState = defineOrganisationState(db);

  return {
    db,
    userState,
    roleState,
    organisationState,
  }
};

const getOrgsDatabase = (opts) => {
  const db = makeConnection(opts);

  const organisations = defineOrganisation(db);

  return {
    db,
    organisations
  }
}

module.exports = {
  getRepository,
  getOrgsDatabase
};
