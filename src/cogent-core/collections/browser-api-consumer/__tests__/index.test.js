import * as React from 'react';
import { apiToClient, pathToUrlExpression } from '../index';
import { stringify } from '../../../react/file-system-renderer';
import { FileSystemReconciler } from '../../../react/file-system-reconciler';

describe('Browser API Consumer', function() {
  describe('pathToUrlExpression', function() {
    it('should generate an expression which will evaluate to the expected url', function() {
      const urlExpression = pathToUrlExpression('/users/:userId/followers', ['userId']);
      expect(urlExpression).toEqual('`${this.baseUrl}/users/${userId}/followers`');
      const iife = (generatedCode) => `(function() {${generatedCode}})();`;
      const generatedCode = `
        class Urls {
          constructor(baseUrl) {
            this.baseUrl = baseUrl;
          }
          getUserFollowersByUserId(userId) {
            return ${urlExpression};
          }
        }
        
        const urls = new Urls('bbb');
        return urls.getUserFollowersByUserId('uuu');
      `;
      const result = eval(iife(generatedCode));
      expect(result).toBe('bbb/users/uuu/followers');
    });

  });

  describe('apiToClient', function() {
    const api = require('../../../__tests__/sample-api.json');
    const { result } = global.render(apiToClient(api.snapshot, { id: 'api-id', version: '1.2.3' }, { id: 'artifact-id', version: '3.2.1' }));
    stringify(result);
    /*const outputDirectory = require('fs').mkdtempSync('optic');
    console.log({ outputDirectory });
    new FileSystemReconciler().emit(result, { outputDirectory });*/
  });
});
