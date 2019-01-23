const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationCollectFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .setBody({
        ProvisionOrganisation: {
          por: {
            action,
            establishmentDfeNumber: establishmentDfeNumber || '',
            establishmentUrn: establishmentUrn || '',
            localAuthorityCode: localAuthorityCode || '',
            orgEdubaseTypeCode,
            organisationId,
            organisationName,
            organisationTypeCode,
            wsOrganisationStatusCode,
          },
        },
      });
    message.contentType = 'application/soap+xml; charset=utf-8';
    return message;
  }
}
module.exports = ProvisionOrganisationCollectFormatter;
