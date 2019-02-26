// urls.js
class Urls {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getSnapshotByTeamAndApi(teamId, apiId, queryP) {
    return `${this.baseUrl}/teams/${teamId}/apis/${apiId}/?`;
  }
}

module.exports = {
  Urls
}

// production/index.js
const {Urls} = require('../urls.js');
class Client {
  constructor(baseUrl, getCredentials, fetch) {
    this.fetch = fetch;
    this.urls = new Urls(baseUrl);
  }

  getSnapshotByTeamAndApi(teamId, apiId) {
    const url = this.urls.snapshotByTeamAndApi(teamId, apiId);
    const options = withAuth({
      method: 'GET',
    });
    return this.fetch(url, options).then(handleJsonResponse);
  }
}
module.exports = {
  Client
}

// README.md
// usage examples
const client = new Client('/', () => 'token', fetch);
client.getSnapshotByTeamAndApi('ttt', 'aaa')
.then((snapshot) => {})

/*

given request (path, method, responses {contentType, body}, request {contentType, body}, parameters (source, name), securityDefinitions)
 */
