const Sequelize = require('sequelize').default;
const { makeConnection } = require('./connection');

const defineUserState = (db) => {
  return db.define('user_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    legacy_user_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    organisation_urn: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    organisation_la_code: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'user_state',
    schema: 'service_notifications',
  });
};
const defineUserRoleState = (db) => {
  return db.define('user_role_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    legacy_user_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    role_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    role_code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    timestamps: false,
    tableName: 'user_role_state',
    schema: 'service_notifications',
  });
};

const getRepository = (opts) => {
  const db = makeConnection(opts);

  const userState = defineUserState(db);
  const userRoleState = defineUserRoleState(db);

  return {
    db,
    userState,
    userRoleState,
  }
};

module.exports = {
  getRepository,
};
