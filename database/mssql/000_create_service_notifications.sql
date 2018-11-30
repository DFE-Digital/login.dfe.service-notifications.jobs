IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'service_notifications')
  BEGIN
    EXEC('CREATE SCHEMA service_notifications')
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_notifications' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.user_notifications (
      service_id uniqueidentifier NOT NULL,
      user_id uniqueidentifier NOT NULL,
      last_state_sent varchar(25) NOT NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_UserNotifications] PRIMARY KEY (service_id, user_id)
    )
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'organisation_notifications' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.organisation_notifications (
      service_id uniqueidentifier NOT NULL,
      organisation_id uniqueidentifier NOT NULL,
      last_state_sent varchar(25) NOT NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_OrganisationNotifications] PRIMARY KEY (service_id, organisation_id)
    )
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'role_notifications' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.role_notifications (
      service_id uniqueidentifier NOT NULL,
      role_id uniqueidentifier NOT NULL,
      last_state_sent varchar(25) NOT NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_RoleNotifications] PRIMARY KEY (service_id, role_id)
    )
  END
GO