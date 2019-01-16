const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationS2SFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .setBody({
        ProvisionOrganisation: {
          por: {
            action,
            establishmentNumber: establishmentDfeNumber || '',
            localAuthorityCode: localAuthorityCode || '',
            localAuthorityName: localAuthorityName || '',
            organisationId,
            organisationName,
            organisationTypeCode,
            regionCode: regionCode || '',
            telephoneNumber: telephoneNumber || '',
            typeOfEstablishmentCode: orgEdubaseTypeCode,
            wsOrganisationStatusCode,
          },
        },
      });
    message.contentType = 'text/xml; charset=utf-8';
    return message;
  }
}
module.exports = ProvisionOrganisationS2SFormatter;
