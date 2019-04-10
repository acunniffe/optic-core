import { documentConfig, documentConfigPostProcessor } from '../document-config';
import Joi from 'joi';

describe('Document config', () => {


  describe('shape validation', () => {
    it('passes when all fields set with valid inputs', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        id: 'optic/test-id',
        version: '2.0.0',
        run_tests: 'npm run test',
        paths: [
          'get /hello/world/:id',
          'post /next/one',
        ],
      }, documentConfig);

      expect(error).toBeNull();
    });

    it('accepts security type bearer', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        id: 'optic/test-id',
        version: '2.0.0',
        security: [{type: 'bearer'}],
        run_tests: 'npm run test',
        paths: [
          'get /hello/world/:id',
          'post /next/one',
        ],
      }, documentConfig);

      expect(error).toBeNull();
    });

    it('accepts security type basic', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        id: 'optic/test-id',
        version: '2.0.0',
        security: [{type: 'basic'}],
        run_tests: 'npm run test',
        paths: [
          'get /hello/world/:id',
          'post /next/one',
        ],
      }, documentConfig);

      expect(error).toBeNull();
    });

    it('accepts security type apiKey', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        id: 'optic/test-id',
        version: '2.0.0',
        security: [{type: 'apiKey', in: 'query', name: 'token'}],
        run_tests: 'npm run test',
        paths: [
          'get /hello/world/:id',
          'post /next/one',
        ],
      }, documentConfig);

      expect(error).toBeNull();
    });

    it('allows users to specify a har file', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        id: 'optic/test-id',
        version: '2.0.0',
        run_tests: 'npm run test',
        har: 'reddit.har',
        paths: [
          'get /hello/world/:id',
          'post /next/one',
        ],
      }, documentConfig);

      expect(error).toBeNull();
    });

    it('sets paths to empty array if not specified', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        id: 'optic/test-id',
        version: '2.0.0',
        run_tests: 'npm run test',
      }, documentConfig);

      expect(error).toBeNull();
      expect(value.paths.length).toBe(0);
    });

  });

  describe('validation / mapping to internal format', () => {

    const validExample = {
      id: 'team/my-project',
      run_tests: 'npm run test',
      version: '2.0.0',
      paths: [
        'get /me',
        'post /users/account/:id',
        '/users/account/:id',
        '/users',
      ],
    }

    it('will parse when valid', () => {

      const value = documentConfigPostProcessor(validExample);

      expect(value).toEqual({
          api: { org: 'team', id: 'my-project' },
          version: '2.0.0',
          run_tests: 'npm run test',
          paths: ['/me', '/users/account/:id', '/users'],
        },
      );

    });

    it('will fail if version is invalid', () => {
      expect(() => documentConfigPostProcessor({
        ...validExample,
        version: 'invalid version'
      })).toThrow("Invalid version: \"invalid version\". Must be a semantic version ie 1.0.1")

    });

    it('will fail if a path is invalid', () => {
      expect(() => documentConfigPostProcessor({
        ...validExample,
        paths: [...validExample.paths, 'custom-method /path']
      })).toThrow()
    });

    it('will fail if a id is invalid', () => {
      expect(() => documentConfigPostProcessor({
        ...validExample,
        id: '123456'
      })).toThrow()
    });

  });

});
