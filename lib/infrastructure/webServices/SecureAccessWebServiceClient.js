const soap = require('soap');
const asyncRetry = require('login.dfe.async-retry');
const rp = require('request-promise');
const { parseString: parseXmlString } = require('xml2js');
const { stripPrefix } = require('xml2js/lib/processors');
const SoapMessage = require('./SoapMessage');

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

    asyncRetry(async () => {
      const response = await rp({
        method: data ? 'POST' : 'GET',
        uri: rurl,
        headers,
        body: data,
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

  async makeSoapRequest(endpoint, soapMessage, soapAction) {
    await new Promise((resolve, reject) => {
      this.request(endpoint, soapMessage.toXmlString(), (err, response, body) => {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      }, { SOAPAction: soapAction });
    });
  }
}

class SecureAccessWebServiceClient {
  constructor(httpClient, endpoint, targetNamespace, provisionUserAction, username, password, requireAddressing, correlationId) {
    this._httpClient = httpClient;
    this._endpoint = endpoint;
    this._targetNamespace = targetNamespace;
    this._provisionUserAction = provisionUserAction;
    this._username = username;
    this._password = password;
    this._requireAddressing = requireAddressing;
    this._correlationId = correlationId;
  }

  async provisionUser(action, saUserId, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const message = new SoapMessage(this._targetNamespace).setBody({
      ProvisionUser: {
        pur: {
          saUserID: saUserId,
          emailAddress,
          organisationId,
          wsAccountStatusCode,
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
    if (this._username) {
      message.setUsernamePassword(this._username, this._password).setTimestamp(60);
    }
    if (this._requireAddressing) {
      message.setAddressing(this._endpoint, this._provisionUserAction);
    }

    await this._httpClient.makeSoapRequest(this._endpoint, message, this._provisionUserAction);
  }

  static async create(wsdlUri, username, password, requireAddressing, correlationId) {
    const httpClient = new SoapHttpClient(correlationId);

    const getOperationSoapAction = (wsdl, operationName) => {
      const addressingNamespaces = ['http://www.w3.org/2006/05/addressing/wsdl'];
      const addressingPrefix = Object.keys(wsdl.definitions.$).find((key) => {
        const value = wsdl.definitions.$[key];
        return key.startsWith('xmlns:') && addressingNamespaces.find(ns => ns === value);
      }).substr(6);
      const operations = wsdl.definitions.portType[0].operation;
      const operation = operations.find(o => o.$.name === operationName);
      if (!operation) {
        return undefined;
      }
      return operation.input[0].$[`${addressingPrefix}:Action`];
    };
    const wsdl = await new Promise((resolve, reject) => {
      httpClient.request(wsdlUri, undefined, (wsdlErr, response, body) => {
        if (wsdlErr) {
          return reject(wsdlErr);
        }
        parseXmlString(body, {
          tagNameProcessors: [stripPrefix]
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });

    const tns = wsdl.definitions.$.targetNamespace;
    const provisionUserAction = getOperationSoapAction(wsdl, 'ProvisionUser');
    const endpoint = wsdl.definitions.service[0].port[0].address[0].$.location;

    return new SecureAccessWebServiceClient(httpClient, endpoint, tns, provisionUserAction, username, password, requireAddressing, correlationId);
  }
}

module.exports = SecureAccessWebServiceClient;
