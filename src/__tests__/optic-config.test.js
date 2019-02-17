const { opticCoreVersion } = require('../optic-config');

describe('optic config', function() {
  describe('version', function() {
    expect(opticCoreVersion).toBe(require('../../package.json').version);
  });
});
