import { defaultQuery, defaultSnapshotRepository, observationsToGqlResponse } from '../query-snapshot';

const observations = require('./observations.json');
const { toMatchSnapshot } = require('jest-snapshot');
expect.extend({ toMatchSnapshot });

describe('Schema', function() {
  describe('Snapshots', function() {
    it('should resolve everything', function(done) {

      const snapshotId = 'iii';
      const promise = observationsToGqlResponse(defaultSnapshotRepository(observations), defaultQuery(snapshotId))
      promise
        .then(({ data, errors }) => {
          //require('fs').writeFileSync('./tmp/query-results.json', JSON.stringify(data, null, 2));
          if (errors && errors.length > 0) {
            errors.forEach(error => console.error(error));
            return done.fail();
          }
          expect(data).toMatchSnapshot();
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
