const { opticCoreVersion } = require('../optic-config');

describe('optic config', function() {
  describe('version', function() {
    it('should match the version being published', function() {
      expect(opticCoreVersion).toBe(require('../../package.json').version);
    });
  });
});
