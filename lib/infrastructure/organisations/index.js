const ApiClient = require('./../ApiClient');

class OrganisatonsClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async listUserOrganisations(userId) {
    return this._callApi(`/organisations/associated-with-user/${userId}`);
  }
}

module.exports = OrganisatonsClient;
