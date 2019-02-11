const { DefaultSchemaMerger } = require('../default-schema-merger');
const { generateSchema } = require('../generate-schema.js');

describe('Default Schema Inferer', function() {
  describe('single data point', function() {
    it('should work for an object', function() {
      const schema = generateSchema({
        key1: 'stringValue',
        key2: 3,
      });

      const mergedSchema = DefaultSchemaMerger.getMergedSchema(schema);
      expect(mergedSchema).toEqual({
        $schema: 'http://json-schema.org/draft-04/schema#',
        properties: {
          key1: { 'type': 'string' },
          key2: { 'type': 'number' },
        },
        type: 'object',
      });
    });

    it('should work for a number', function() {
      const schema = generateSchema(3);

      const mergedSchema = DefaultSchemaMerger.getMergedSchema(schema);
      expect(mergedSchema).toEqual({
        $schema: 'http://json-schema.org/draft-04/schema#',
        'type': 'number',
      });
    });

    it('should work for a string', function() {
      const schema = generateSchema('three');

      const mergedSchema = DefaultSchemaMerger.getMergedSchema(schema);
      expect(mergedSchema).toEqual({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'string',
      });
    });
  });

  describe('multiple samples', function() {
    describe('all the same type', function() {
      it('should yield a fixed type for booleans', function() {
        const schemas = [true, false].map(generateSchema);
        const mergedSchema = DefaultSchemaMerger.getMergedSchema(...schemas);
        expect(mergedSchema).toEqual({
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'boolean',
        });
      });
      it('should yield a fixed type for strings', function() {
        const schemas = ['', 'b'].map(generateSchema);
        const mergedSchema = DefaultSchemaMerger.getMergedSchema(...schemas);
        expect(mergedSchema).toEqual({
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'string',
        });
      });
      it('should yield a fixed type for numbers', function() {
        const schemas = [Number.MIN_VALUE, Number.MIN_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER, Number.MAX_VALUE].map(generateSchema);
        const mergedSchema = DefaultSchemaMerger.getMergedSchema(...schemas);
        expect(mergedSchema).toEqual({
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'number',
        });
      });
    });
    describe('different types', function() {
      it('should yield oneOf', function() {

        const schemas = [1, 'one', 2, { key: 'value' }].map(generateSchema);
        const mergedSchema = DefaultSchemaMerger.getMergedSchema(...schemas);
        expect(mergedSchema).toEqual({
          $schema: 'http://json-schema.org/draft-04/schema#',
          oneOf: [
            { type: 'number' },
            { type: 'string' },
            { type: 'number' },
            {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                },
              },
            },
          ],
        });
      });
    });
  });
});
