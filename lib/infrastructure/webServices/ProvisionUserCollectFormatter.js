const SoapMessage = require('./SoapMessage');

class ProvisionUserCollectFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .addNamespace('cap', 'http://schemas.datacontract.org/2004/07/Capgemini.DFE.ProvisioningSvcs.COLLECT.Common')
      .setBody({
        ProvisionUser: {
          pur: {
            userId: saUserId,
            userName: saUsername,
            firstName,
            lastName,
            emailAddress,
            organisationId,
            wsAccountStatusCode,
            Groups: groupUpdates.map(gu => ({
              'cap:group': {
                'cap:idField': gu.id,
                'cap:codeField': gu.code,
              },
            })),
            action,
          },
        },
      });
    return message;
  }
}

module.exports = ProvisionUserCollectFormatter;