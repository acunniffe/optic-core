import { documentConfig, documentConfigPostProcessor } from '../document-config';
import Joi from 'joi';
import { consumeConfig, consumeConfigPostProcessor } from '../consume-config';

describe('consume config', () => {

  describe('shape validation', () => {
    it('passes when all fields set with valid inputs', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        'optic/optic-backend': {
          version: '1.0.0',
          generate: {
            'js-client': '/src/managed/js-client',
            'oas': '/src/managed/oas',
          },
        },
      }, consumeConfig);
      expect(error).toBeNull();
    });

    it('sets generate to empty array if not specified', () => {
      expect(1).toBe(1);
      const { error, value } = Joi.validate({
        'optic/optic-backend': {
          version: '1.0.0',

        },
      }, consumeConfig);

      expect(error).toBeNull();
      expect(Object.keys(value['optic/optic-backend'].generate).length)
        .toBe(0);
    });
  });

  describe('validation / mapping to internal format', () => {

    const validExample = {
      'optic/optic-backend': {
        version: '1.0.0',
        generate: {
          'js-client': '/src/managed/js-client',
          'oas': '/src/managed/oas',
        },
      },
      'example-api': {
        version: '1.0.1-alpha1',
        generate: {
          swift: '/src/swift',
        },
      },
    };


    it('will parse when valid', () => {

      const value = consumeConfigPostProcessor(validExample);

      // console.log(value)
      //
      expect(value).toEqual([{
          api: { org: 'optic', id: 'optic-backend' },
          version: '1.0.0',
          cogentId: 'js-client',
          outputDirectory: '/src/managed/js-client',
        },
          {
            api: { org: 'optic', id: 'optic-backend' },
            version: '1.0.0',
            cogentId: 'oas',
            outputDirectory: '/src/managed/oas',
          },
          {
            api: { id: 'example-api' },
            version: '1.0.1-alpha1',
            cogentId: 'swift',
            outputDirectory: '/src/swift',
          }],
      );
    });

    it('will fail if file path is invalid', () => {
      expect(() => consumeConfigPostProcessor({
        'example-api': {
          version: '1.0.1-alpha1',
          generate: {
            swift: 'abc/?.js',
          }
        },
      })).toThrow('Output directory \'abc/?.js\' for \'swift\' is not a valid file path.')

    })

    it('will fail if version  is invalid', () => {
      expect(() => consumeConfigPostProcessor({
        'example-api': {
          version: 'not-real',
          generate: {
            swift: 'valid/path/to/file',
          }
        },
      })).toThrow()
    })
  });

});
