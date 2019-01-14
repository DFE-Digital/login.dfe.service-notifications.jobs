const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationDQTFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, groupUid, localAuthorityCode, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .addNamespace('data', 'http://capgemini.com/services/dfe/sa/evolvesync/data')
      .setBody({
        ProvisionOrganisation: {
          request: {
            'data:organisationId': organisationId,
            'data:organisationName': organisationName,
            'data:organisationTypeCode': organisationTypeCode,
            'data:wsOrganisationStatusCode': wsOrganisationStatusCode,
            'data:establishmentDfeNumber': establishmentDfeNumber,
            'data:establishmentUrn': establishmentUrn,
            'data:localAuthorityCode': localAuthorityCode,
            'data:action': action,
            'data:orgEdubaseTypeCode': orgEdubaseTypeCode,
          },
        },
      });
    message.contentType = 'application/soap+xml; charset=utf-8';
    return message;
  }
}

module.exports = ProvisionOrganisationDQTFormatter;
