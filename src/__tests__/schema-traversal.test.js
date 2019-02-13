const traverseJsonSchema = require('json-schema-traverse');
const { generateSchema, stringType } = require('../generate-schema.js');
const lodash = require('lodash');
const deepdash = require('deepdash');
const _ = deepdash(lodash);

function flattenNestedSchemaToList(schema) {
  const list = [];
  const cb = function(currentSchema, jsonPointer, rootSchema, parentJsonPointer, parentKeyword, indexOrPropertyName) {
    list.push({ currentSchema, jsonPointer, rootSchema, parentJsonPointer, parentKeyword, indexOrPropertyName });
  };

  traverseJsonSchema(schema, { cb });

  return list;
}

describe('Schema Traversal', function() {
  describe('array of objects with string and numeric keys', function() {
    it('should traverse all of the schema items', function() {
      const example = [
        {
          key1: 1,
          key2: 'two',
        },
        'a',
      ];

      const schema = generateSchema(example);
      expect(schema).toEqual({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'array',
        items: {
          oneOf: [
            {
              type: 'object',
              properties: {
                key1: {
                  type: 'number',
                },
                key2: {
                  type: 'string',
                },
              },
            },
            {
              type: 'string',
            },
          ],
        },
      });

      const schemaAsList = flattenNestedSchemaToList(schema);
      expect(schemaAsList).toEqual([{
        'currentSchema': schema,
        'indexOrPropertyName': undefined,
        'jsonPointer': '',
        'parentJsonPointer': undefined,
        'parentKeyword': undefined,
        'rootSchema': schema,
      }, {
        'currentSchema': { 'oneOf': [{ 'properties': { 'key1': { 'type': 'number' }, 'key2': { 'type': 'string' } }, 'type': 'object' }, { 'type': 'string' }] },
        'indexOrPropertyName': schema,
        'jsonPointer': '/items',
        'parentJsonPointer': '',
        'parentKeyword': 'items',
        'rootSchema': schema,
      }, {
        'currentSchema': { 'properties': { 'key1': { 'type': 'number' }, 'key2': { 'type': 'string' } }, 'type': 'object' },
        'indexOrPropertyName': { 'oneOf': [{ 'properties': { 'key1': { 'type': 'number' }, 'key2': { 'type': 'string' } }, 'type': 'object' }, { 'type': 'string' }] },
        'jsonPointer': '/items/oneOf/0',
        'parentJsonPointer': '/items',
        'parentKeyword': 'oneOf',
        'rootSchema': schema,
      }, {
        'currentSchema': { 'type': 'number' },
        'indexOrPropertyName': { 'properties': { 'key1': { 'type': 'number' }, 'key2': { 'type': 'string' } }, 'type': 'object' },
        'jsonPointer': '/items/oneOf/0/properties/key1',
        'parentJsonPointer': '/items/oneOf/0',
        'parentKeyword': 'properties',
        'rootSchema': schema,
      }, {
        'currentSchema': { 'type': 'string' },
        'indexOrPropertyName': { 'properties': { 'key1': { 'type': 'number' }, 'key2': { 'type': 'string' } }, 'type': 'object' },
        'jsonPointer': '/items/oneOf/0/properties/key2',
        'parentJsonPointer': '/items/oneOf/0',
        'parentKeyword': 'properties',
        'rootSchema': schema,
      }, {
        'currentSchema': { 'type': 'string' },
        'indexOrPropertyName': { 'oneOf': [{ 'properties': { 'key1': { 'type': 'number' }, 'key2': { 'type': 'string' } }, 'type': 'object' }, { 'type': 'string' }] },
        'jsonPointer': '/items/oneOf/1',
        'parentJsonPointer': '/items',
        'parentKeyword': 'oneOf',
        'rootSchema': schema,
      }]);


      const exampleAsList = flattenJavascriptObjectToList(example);
      expect(stringType(example).toLowerCase()).toEqual('array');
      expect(exampleAsList).toEqual([
        {
          key: '',
          depth: 0,
          parentPath: null,
          path: '',
          type: 'array',
        },
        {
          depth: 1,
          key: '0',
          parentPath: '',
          path: '[0]',
          type: 'object',
        },
        {
          depth: 2,
          key: 'key1',
          parentPath: '[0]',
          path: '[0].key1',
          type: 'number',
        },
        {
          depth: 2,
          key: 'key2',
          parentPath: '[0]',
          path: '[0].key2',
          type: 'string',
        },
        {
          depth: 1,
          key: '1',
          parentPath: '',
          path: '[1]',
          type: 'string',
        },
      ]);

      const root = toNestedObject(example);
      expect(root).toEqual({});
    });
  });
});

function jsonSchemaTypeString(x) {
  return stringType(x).toLowerCase();
}

function toNestedObject(x) {
  const list = flattenJavascriptObjectToList(x);
  const map = new Map();
  for (let item of list) {
    const node = { node: item, children: [] };
    map.set(item.path, node);
    if (item.parentPath !== null) {
      map.get(item.parentPath).children.push(node);
    }
  }
  return map.get('');
}


function toNodes(x) {
  const list = flattenJavascriptObjectToList(x);
  for (let item of list) {
    const node = { node: item, children: [] };
    graph.addNode(node);
    if (item.parentPath !== null) {
      const parent = map.get(item.parentPath)
      graph.addEdge(node.id, parent.id);
    }
  }
  return map.get('');
}
