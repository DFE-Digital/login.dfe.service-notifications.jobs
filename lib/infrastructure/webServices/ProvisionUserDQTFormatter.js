const SoapMessage = require('./SoapMessage');

class ProvisionUserDQTFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .addNamespace('data', 'http://capgemini.com/services/dfe/sa/evolvesync/data')
      .setBody({
        ProvisionUser: {
          request: {
            'data:userId': saUserId,
            'data:userName': userName,
            'data:wsAccountStatusCode': wsAccountStatusCode,
            'data:firstName': firstName,
            'data:lastName': lastName,
            'data:emailAddress': emailAddress,
            'data:organisationId': organisationId,
            'data:action': action,
          },
        },
      });
    message.contentType = 'application/soap+xml; charset=utf-8';
    return message;
  }
}

module.exports = ProvisionUserDQTFormatter;