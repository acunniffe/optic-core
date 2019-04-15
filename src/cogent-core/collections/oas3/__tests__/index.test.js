import React from 'react';
import { collectPaths, schemaToSwaggerYaml, toSwaggerPath } from '../oas-mapping';
import * as fs from "fs";
import * as path from "path";
import { OASRoot } from '../index';

const equalToExampleFile = (baseDir) => (file) => fs.readFileSync(path.join(baseDir, file)).toString()
const equalToExample = equalToExampleFile(__dirname)

describe('OAS 3', function() {
  const exampleApi = require('../../../__tests__/sample-api.json');

  it('can create OAS 3', () => {

    const Component = () => {
      return (
        <OASRoot endpoints={exampleApi.snapshot.endpoints} api={{org: 'test', id: 'orgId'}}/>
      );
    };

    const { result } = global.render(<Component/>);
    const contents = result.files['oas.yml'].contents.join('');
    // fs.writeFileSync(path.join(__dirname, 'oas.yml'), contents)
  });

  describe('mappings', () => {

    it('optic paths to swagger paths', () => {
      const testPath = 'me/apis/:apiSlug/versions/:versionNumber'
      const pathPrams = [{name: 'apiSlug'}, {name: 'versionNumber'}]


      expect(toSwaggerPath(testPath, pathPrams)).toBe('me/apis/{apiSlug}/versions/{versionNumber}')

    });


    it('endpoints to paths', () => {
      const paths = collectPaths(exampleApi.snapshot.endpoints);
      expect(paths['/self/api-tokens'].items.length).toBe(2);
      expect(paths['/teams/:teamSlug/invite/accept'].items.length).toBe(1);
    });

    describe('maps json schemas to yaml nodes', () => {

      it('basic schema', () => {

        const exampleSchema = {
          type: 'object',
          properties: {
            first: { type: 'string' },
            second: { type: 'number' },
          },
        };

        const component = schemaToSwaggerYaml(exampleSchema);

        const { result } = global.render(<file name='example.yml'>{component}<source>{'\n'}</source></file>);

        const contents = result.files['example.yml'].contents.join('');
        expect(contents).toBe(equalToExample('basic-schema'))

      });

    });

  });
});
