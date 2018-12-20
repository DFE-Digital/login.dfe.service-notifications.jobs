const ApiClient = require('./../ApiClient');

class DirectoriesClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async getUser(userId) {
    return this._callApi(`/users/${userId}`);
  }
}

module.exports = DirectoriesClient;
