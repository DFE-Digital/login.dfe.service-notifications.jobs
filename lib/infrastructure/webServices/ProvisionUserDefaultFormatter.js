const SoapMessage = require('./SoapMessage');

class ProvisionUserDefaultFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    return new SoapMessage(targetNamespace).setBody({
      ProvisionUser: {
        pur: {
          saUserID: saUserId,
          emailAddress,
          organisationId,
          wsAccountStatusCode: wsAccountStatusCode === 1 ? 'Active' : 'Archived',
          establishmentUrn,
          groupUid: null,
          localAuthorityCode,
          groups: groupUpdates.map(gu => ({
            SaUserGroup: {
              id: gu.id,
              code: gu.code,
            },
          })),
          action,
        },
      },
    });
  }
}
module.exports = ProvisionUserDefaultFormatter;