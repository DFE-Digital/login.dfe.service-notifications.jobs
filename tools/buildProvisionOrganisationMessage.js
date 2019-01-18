const ProvisionOrganisationDQTFormatter = require('./../lib/infrastructure/webServices/ProvisionOrganisationDQTFormatter');

const tns = '';
const action = 'CREATE';
const data = {};
const formatter = new ProvisionOrganisationDQTFormatter();

const organisation = data.organisation;
const localAuthorityCode = organisation.localAuthority ? organisation.localAuthority.code : undefined;
const localAuthorityName = organisation.localAuthority ? organisation.localAuthority.name : undefined;
const typeId = organisation.type ? organisation.type.id : undefined;
const establishmentDfeNumber = organisation.localAuthority ? `${organisation.localAuthority.code}${organisation.establishmentNumber}` : undefined;
const regionId = organisation.region ? organisation.region.id : undefined;
const message = formatter.getProvisionOrganisationSoapMessage(
  tns,
  action,
  establishmentDfeNumber,
  organisation.urn,
  organisation.establishmentNumber,
  organisation.uid,
  localAuthorityCode,
  localAuthorityName,
  typeId,
  organisation.legacyId,
  organisation.name,
  organisation.category.id,
  organisation.status.id,
  regionId,
  organisation.telephone);
console.info(message.toXmlString());