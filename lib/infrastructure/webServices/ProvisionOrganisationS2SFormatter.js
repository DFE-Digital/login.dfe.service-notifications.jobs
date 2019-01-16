const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationCollectFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, groupUid, localAuthorityCode, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .setBody({
        ProvisionOrganisation: {
          por: {
            action,
            establishmentDfeNumber: establishmentDfeNumber || '',
            establishmentUrn,
            localAuthorityCode: localAuthorityCode || '',
            orgEdubaseTypeCode,
            organisationId,
            organisationName,
            organisationTypeCode,
            wsOrganisationStatusCode,
          },
        },
      });
    message.contentType = 'text/xml; charset=utf-8';
    return message;
  }
}
module.exports = ProvisionOrganisationCollectFormatter;
