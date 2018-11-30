const { makeConnection } = require('./connection');

const defineUserNotifications = (db) => {
  return db.define('user_notifications', {
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
    last_state_sent: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'user_notifications',
    schema: 'service_notifications',
  });
};
const defineOrganisationNotifications = (db) => {
  return db.define('organisation_notifications', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    last_state_sent: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'organisation_notifications',
    schema: 'service_notifications',
  });
};
const defineRoleNotifications = (db) => {
  return db.define('role_notifications', {
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
    last_state_sent: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'role_notifications',
    schema: 'service_notifications',
  });
};

const getRepository = (opts) => {
  const db = makeConnection(opts);

  const userNotification = defineUserNotifications(db);
  const organisationNotification = defineOrganisationNotifications(db);
  const roleNotification = defineRoleNotifications(db);

  return {
    db,
    userNotification,
    organisationNotification,
    roleNotification,
  }
};

module.exports = {
  getRepository,
};
