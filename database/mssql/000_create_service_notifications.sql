IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'service_notifications')
  BEGIN
    EXEC('CREATE SCHEMA service_notifications')
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_state' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.user_state (
      service_id uniqueidentifier NOT NULL,
      legacy_user_id bigint NOT NULL,
      user_id uniqueidentifier NOT NULL,
      email varchar(512) NOT NULL,
      status_id int NOT NULL,
      organisation_id int NOT NULL,
      organisation_urn varchar(50) NOT NULL,
      organisation_la_code varchar(50) NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_UserState] PRIMARY KEY (service_id, legacy_user_id)
    )
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_role_state' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.user_role_state (
      service_id uniqueidentifier NOT NULL,
      legacy_user_id bigint NOT NULL,
      role_id int NOT NULL,
      role_code varchar(50) NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_UserRoleState] PRIMARY KEY (service_id, legacy_user_id, role_id)
    )
  END
GO