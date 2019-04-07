import React from 'react';
import { collectPaths, endpointConsumes, endpointProduces } from '../oas-mapping';
import { OASRoot } from '../index';

describe('OAS 3', function() {
  const exampleApi = require('../../../__tests__/sample-api.json');

  it.only('can create OAS 3', () => {

    const Component = () => {
      return (
        <OASRoot endpoints={exampleApi.snapshot.endpoints} />
      );
    };

    const { result } = global.render(<Component />);
    const contents = result.files['oas.yml'].contents.join('');

    console.log(contents)
  })

  describe('mappings', () => {

    it('endpoints to paths', () => {
      const paths = collectPaths(exampleApi.snapshot.endpoints)
      expect(paths['/self/api-tokens'].items.length).toBe(2)
      expect(paths['/teams/:teamSlug/invite/accept'].items.length).toBe(1)
    })

    it('endpoint to consumes', () => {
      const testEndpoint = exampleApi.snapshot.endpoints
        .find(i => i.path === '/teams/:teamSlug/invite/accept')

      expect(endpointConsumes(testEndpoint)).toEqual([
        'application/json'
      ])

    })

    it('endpoint to produces', () => {
      const testEndpoint = exampleApi.snapshot.endpoints
        .find(i => i.path === '/teams/:teamSlug/invite/accept')

      expect(endpointProduces(testEndpoint)).toEqual([
        'text/plain; charset=UTF-8'
      ])
    })

  })
});
