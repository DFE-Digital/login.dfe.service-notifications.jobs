const soap = require('soap');
const asyncRetry = require('login.dfe.async-retry');
const rp = require('request-promise');

class SoapHttpClient {
  constructor(correlationId) {
    this.correlationId = correlationId;
  }

  request(rurl, data, callback, exheaders, exoptions) {
    let headers;
    if (exheaders) {
      headers = {};
      Object.keys(exheaders).forEach((name) => {
        let value = exheaders[name];
        if (name.toLowerCase() === 'content-type' && value === 'text/xml; charset=utf-8') {
          value = 'application/soap+xml; charset=utf-8';
        }
        headers[name] = value;
      });
    }

    const body = data ? data.replace('>__to__<', `>${rurl}<`) : undefined;

    asyncRetry(async () => {
      const response = await rp({
        method: data ? 'POST' : 'GET',
        uri: rurl,
        headers,
        body,
        resolveWithFullResponse: true,
        simple: false,
      });

      if (response.statusCode !== 200) {
        throw new Error(`${rurl} returned status ${response.statusCode} - ${response.body}`);
      }
      if (!response.headers['content-type'].startsWith('text/xml') && !response.headers['content-type'].startsWith('application/soap+xml')) {
        throw new Error(`${rurl} returned content type ${response.headers['content-type']} not text/xml`);
      }

      return response;
    }, asyncRetry.strategies.apiStrategy).then((response) => {
      callback(undefined, response, response.body);
    }).catch((e) => {
      callback(e);
    });
  }
}

class SecureAccessWebServiceClient {
  constructor(soapClient, provisionOrgAction, provisionUserAction, correlationId) {
    this._soapClient = soapClient;
    this._spec = soapClient.describe();
    this.provisionOrgAction = provisionOrgAction;
    this.provisionUserAction = provisionUserAction;
    this.correlationId = correlationId;
  }

  async provisionOrganisation(action, establishmentDfeNumber, establishmentUrn, localAuthorityCode, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode) {
    const args = {
      por: {
        action,
        establishmentDfeNumber: establishmentDfeNumber || '',
        establishmentUrn: establishmentUrn || '',
        localAuthorityCode: localAuthorityCode || '',
        orgEdubaseTypeCode: orgEdubaseTypeCode || '',
        organisationId: organisationId || '',
        organisationName: organisationName || '',
        organisationTypeCode: organisationTypeCode || '',
        wsOrganisationStatusCode: wsOrganisationStatusCode || '',
      },
    };

    try {
      this._soapClient.addSoapHeader({
        Action: this.provisionOrgAction,
        To: '__to__',
      }, undefined, undefined, 'http://www.w3.org/2005/08/addressing');
      const response = await this._soapClient.ProvisionOrganisationAsync(args);
      return response;
    } finally {
      this._soapClient.clearSoapHeaders();
    }
  }

  async provisionUser(action, saUserId, emailAddress, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const groups = groupUpdates.map(gu => ({
      SaUserGroup: gu,
    }));

    const args = {
      pur: {
        action,
        saUserID: saUserId,
        emailAddress,
        wsAccountStatusCode,
        establishmentUrn,
        localAuthorityCode,
        groups,
      }
    };
    try {
      this._soapClient.addSoapHeader({
        Action: this.provisionUserAction,
        To: '__to__',
      }, undefined, undefined, 'http://www.w3.org/2005/08/addressing');
      const response = await this._soapClient.ProvisionUserAsync(args);
      return response;
    } finally {
      this._soapClient.clearSoapHeaders();
    }
  }

  static async create(wsdlUri, provisionOrgAction, provisionUserAction, correlationId) {
    const httpClient = new SoapHttpClient(correlationId);
    const soapClient = await new Promise((resolve, reject) => {
      const options = {
        forceSoap12Headers: true,
        httpClient,
      };
      soap.createClient(wsdlUri, options, (err, client) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(client);
      });
    });
    return new SecureAccessWebServiceClient(soapClient, provisionOrgAction, provisionUserAction, correlationId);
  }
}

module.exports = SecureAccessWebServiceClient;
