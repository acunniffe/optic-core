import React from 'react';
import { FileSystemRenderer } from '../file-system-renderer';

//@TODO make some of these snapshot tests as applicable
describe('File System Renderer', function() {
  describe('Folders', function() {
    it('should support rendering a single folder', function() {
      const Component = () => <folder name="f"/>;
      const callback = jest.fn();
      const renderer = new FileSystemRenderer();
      renderer.renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      if (err) {
        console.error(err);
      }
      expect(err).toBeNull();
      expect(result).toEqual({
        files: {},
        folders: {
          f: {
            files: {},
            folders: {},
            name: 'f',
            path: '/f',
          },
        },
        name: '',
        path: '',
      });
    });
    it('should support rendering multiple nested folders', function() {
      const Component = () => {
        return (
          <folder name="f1">
            <folder name="f2a">
              <folder name="f3"/>
            </folder>
            <folder name="f2b">
              <folder name="f3"/>
            </folder>
          </folder>
        );
      };
      const callback = jest.fn();
      const renderer = new FileSystemRenderer();
      renderer.renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      if (err) {
        console.error(err);
      }
      expect(err).toBeNull();
      expect(result).toEqual({
        files: {},
        folders: {
          f1: {
            files: {},
            folders: {
              f2a: {
                files: {},
                folders: {
                  f3: {
                    files: {},
                    folders: {},
                    name: 'f3',
                    path: '/f1/f2a/f3',
                  },
                },
                name: 'f2a',
                path: '/f1/f2a',
              },
              f2b: {
                files: {},
                folders: {
                  f3: {
                    files: {},
                    folders: {},
                    name: 'f3',
                    path: '/f1/f2b/f3',
                  },
                },
                name: 'f2b',
                path: '/f1/f2b',
              },
            },
            name: 'f1',
            path: '/f1',
          },
        },
        name: '',
        path: '',
      });
    });
  });
  describe('Files', function() {
    it('should should support rendering a single file', function() {
      const Component = () => (
        <file name="f.txt">
          <source>abc</source>
          <source>123</source>
        </file>
      );
      const callback = jest.fn();
      const renderer = new FileSystemRenderer();
      renderer.renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      if (err) {
        console.error(err);
      }
      expect(err).toBeNull();
      expect(result).toEqual({
        files: {
          'f.txt': {
            contents: ['abc', '123'],
            name: 'f.txt',
            path: '/f.txt',
          },
        },
        folders: {},
        name: '',
        path: '',
      });
    });
  });
  describe('Context', function() {
    it('should support rendering context', function() {
      const DepthContext = React.createContext(0);
      const Nested = () => {
        return (
          <DepthContext.Consumer>
            {(depth) => {
              if (depth < 3) {
                return (
                  <DepthContext.Provider value={depth + 1}>
                    <line>{'#'.repeat(depth)}</line>
                    <Nested/>
                  </DepthContext.Provider>
                );
              }
              return <line>done</line>;
            }}
          </DepthContext.Consumer>
        );
      };
      const Component = () => {
        return (
          <folder name="root">
            <file name="test">
              <source>
                <DepthContext.Provider value={0}>
                  <Nested/>
                  <Nested/>
                </DepthContext.Provider>
              </source>
            </file>
          </folder>
        );
      };

      const callback = jest.fn();
      const renderer = new FileSystemRenderer();
      renderer.renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      if (err) {
        console.error(err);
      }
      expect(err).toBeNull();
      const contents = result.folders.root.files.test.contents.join('');
      expect(contents).toBe(`\n#\n##\ndone\n\n#\n##\ndone\n`);
    });
  });
  describe('Fragment', function() {
    it('should support rendering fragments', function() {
      const Component = () => {
        return (
          <React.Fragment>
            <folder name="f1">
            </folder>
            <React.Fragment>
              <folder name="f2">
              </folder>
              <folder name="f3">
              </folder>
            </React.Fragment>
          </React.Fragment>
        );
      };

      const callback = jest.fn();
      const renderer = new FileSystemRenderer();
      renderer.renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      if (err) {
        console.error(err);
      }
      expect(err).toBeNull();
      expect(Object.keys(result.folders)).toEqual(['f1', 'f2', 'f3']);
    });
  });
});
