import React from 'react';
import * as FileSystem from '../index';

describe('File System', function() {
  describe('Nested Folder', function() {
    it('should allow creating a deeply nested folder', function() {
      const Component = () => {
        return (
          <FileSystem.NestedFolder path='com/optic/core'>
            <file name="Optic.java">
              <source>test</source>
            </file>
          </FileSystem.NestedFolder>
        );
      };
      const { result } = global.render(<Component/>);
      expect(result).toEqual({
        files: {},
        folders: {
          com: {
            files: {},
            folders: {
              optic: {
                files: {},
                folders: {
                  core: {
                    files: {
                      'Optic.java': {
                        contents: ['test'],
                        name: 'Optic.java',
                        path: '/com/optic/core/Optic.java',
                      },
                    },
                    folders: {},
                    name: 'core',
                    path: '/com/optic/core',
                  },
                },
                name: 'optic',
                path: '/com/optic',
              },

            },
            name: 'com',
            path: '/com',
          },
        },
        name: '',
        path: '',
      });
    });
  });
});
