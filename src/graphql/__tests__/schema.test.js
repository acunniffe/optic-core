import { defaultQuery } from '../query-snapshot';

const { schema } = require('../schema');
const { parse, execute } = require('graphql');
const observations = require('./observations.json');
const { toMatchSnapshot } = require('jest-snapshot');
expect.extend({ toMatchSnapshot });

describe('Schema', function() {
  describe('Snapshots', function() {
    it('should resolve everything', function(done) {

      const snapshotId = 'iii';
      const query = defaultQuery(snapshotId);
      const snapshotRepository = {
        findById: jest.fn(),
      };

      snapshotRepository.findById.mockImplementationOnce((id) => {
        expect(id).toEqual('iii');
        return Promise.resolve({ observations });
      });
      const promise = execute(schema, parse(query), {}, { snapshotRepository });
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
