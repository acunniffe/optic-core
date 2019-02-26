import { methodAndPathToName } from '../common/naming-utilities';

const changeCase = require('change-case');

const React = require('react');
const { renderSync, stringify } = require('../cogent-react-renderer');

describe('Cogent React Renderer', function() {
  describe('renderSync', function() {
    xit('should output instructions for the file system effects', function() {
      const NestedFolder = ({ path, children }) => {
        const splitPath = path.split('/');
        const nestedFolders = splitPath.reduceRight((acc, pathComponent) => {
          return <folder name={pathComponent}>{acc}</folder>;
        }, children);
        return nestedFolders;
      };
      const Base = ({ name }) => {
        return (
          <folder name={name}>
            <file name="index.js">
              <source>index-{name}</source>
            </file>
          </folder>
        );
      };
      const Component = ({ x }) => {
        return (
          <folder name="example">
            <file name="index.js">
              <source>{x}</source>
            </file>
            <file name="urls.js">
              <source>url1</source>
              <source>url2</source>
            </file>
            <Base name="development"/>
            <Base name="production"/>
            <NestedFolder path="docs">
              <file name="README.md">
                <source>#Getting Started</source>
              </file>
            </NestedFolder>
          </folder>
        );
      };
      const callback = jest.fn();
      renderSync(<Component x="a"/>, {}, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, {
        files: {},
        folders: {
          example: {
            files: {
              'index.js': {
                contents: [
                  'a',
                ],
                name: 'index.js',
                path: '/example/index.js',
              },
              'urls.js': {
                contents: [
                  'url1',
                  'url2',
                ],
                name: 'urls.js',
                path: '/example/urls.js',
              },
            },
            folders: {
              development: {
                files: {
                  'index.js': {
                    contents: [
                      'index-',
                      'development',
                    ],
                    name: 'index.js',
                    path: '/example/development/index.js',
                  },
                },
                folders: {},
                name: 'development',
                path: '/example/development',
              },
              docs: {
                files: {},
                folders: {
                  en: {
                    files: {
                      'README.md': {
                        contents: [
                          '#Getting Started',
                        ],
                        name: 'README.md',
                        path: '/example/docs/en/README.md',
                      },
                    },
                    folders: {},
                    name: 'en',
                    path: '/example/docs/en',
                  },
                },
                name: 'docs',
                path: '/example/docs',
              },
              production: {
                files: {
                  'index.js': {
                    contents: [
                      'index-',
                      'production',
                    ],
                    name: 'index.js',
                    path: '/example/production/index.js',
                  },
                },
                folders: {},
                name: 'production',
                path: '/example/production',
              },
            },
            name: 'example',
            path: '/example',
          },
        },
        name: '',
        path: '',
      });
    });
    it('should support context stack', function() {
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
      renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      const contents = result.folders.root.files.test.contents.join('');
      expect(contents).toBe(`\n#\n##\ndone\n#\n##\ndone`);
    });
    it('should allow js helpers', function() {
      const Curly = ({ children }) => (<source>{'{'}{children}{'}'}</source>);

      const api = {
        endpoints: [
          {
            path: '/users/:userId/profile',
            method: 'POST',
            securityDefinitions: [
              { type: 'bearer' },
            ],
            request: {
              headerParameters: [],
              queryParameters: [],
              pathParameters: [
                {
                  name: 'userId',
                  schema: {
                    asJsonSchema: {
                      type: 'string',
                    },
                  },
                },
              ],
              bodies: [
                {
                  contentType: 'application/json',
                  schema: {
                    asJsonSchema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },

                      },
                    },
                  },
                },
              ],
            },
            responses: [
              {
                statusCode: 200,
                bodies: [{
                  contentType: 'application/json',
                }],
              },
            ],
          },
          {
            path: '/users/:userId/profile',
            method: 'GET',
            securityDefinitions: [
              { type: 'bearer' },
            ],
            request: {
              headerParameters: [],
              queryParameters: [],
              pathParameters: [
                {
                  name: 'userId',
                  schema: {
                    asJsonSchema: {
                      type: 'string',
                    },
                  },
                },
              ],
              bodies: [],
            },
          },
        ],
      };

      const packageJsonContents = {
        dependencies: {},
      };

      const Npm = {
        PackageJson({ contents }) {
          return (
            <file name="package.json">
              <source>{JSON.stringify(contents, null, 2)}</source>
            </file>
          );
        },
        Dependency({ name, version, exportName }) {
          if (packageJsonContents.dependencies[name]) {
            console.warn(`overwriting package.json dependency ${name}@${version}`);
          }
          packageJsonContents.dependencies[name] = version;

          return null;
        },
      };
      //@TODO support optional and infinite parameters and default values via Js.Parameter
      const Js = {
        Module(name, path) {

          const Define = ({ children }) => (
            <file name={name}>{children}</file>
          );
          //@TODO add a prop for the consumer's path? or use React Context?
          const Require = ({ children }) => (
            <source>
              <line>const {name} = require('{path}');</line>
              {children({ name })}
            </source>
          );

          return {
            Define,
            Require,
          };
        },
        Block({ children }) {
          return (
            <Curly>{children}</Curly>
          );
        },
        BlockStart() {
          return '{';
        },
        BlockEnd() {
          return '}';
        },
        Class({ name, constructorParameters, children }) {
          return (
            <source>
              <line>class {name} <Js.BlockStart/></line>
              <line>constructor({constructorParameters.join(', ')}) <Js.BlockStart/></line>
              {constructorParameters.map(x => <line key={x}>{`this.${x} = ${x};`}</line>)}
              <line><Js.BlockEnd/></line>
              {children}
              <Js.BlockEnd/>
            </source>
          );
        },
        ClassMethod({ name, parameters, children }) {
          return (
            <line>
              <source>
                {name}({parameters.join(', ')}) <Js.Block>
                {children}
              </Js.Block>
              </source>
            </line>
          );
        },
        ParameterList({ parameterNames }) {
          return (
            parameterNames.join(', ')
          );
        },
        NamedExportFunction({ name, parameters, children }) {
          return (
            <source>
              module.exports.{name} = function(<Js.ParameterList parameterNames={parameters}/>){'{'}
              {children}
              {'}'}
            </source>
          );
        },
        FunctionCall({ name, args }) {

        },
      };

      const urls = api.endpoints
        .filter(x => x.request !== null)
        .map(endpoint => {
          const { method, path, request } = endpoint;
          const name = methodAndPathToName(method, path);
          //@TODO: if securityDefinition of type apiKey in query, add it here
          const urlParameters = [
            ...request.pathParameters.map(x => `path${changeCase.pascal(x.name)}`),
            ...request.queryParameters.map(x => `query${changeCase.pascal(x.name)}`),
          ];
          return (
            <Js.ClassMethod key={name} name={name} parameters={urlParameters}>
              {`const url = \`\${this.baseUrl}\`;`}
            </Js.ClassMethod>
          );
        });

      const DepthContext = React.createContext(1);
      const Markdown = {
        Line({ children }) {
          return (
            <source>{children}{'\n'}</source>
          );
        },
        Section({ title, children }) {
          return (
            <Markdown.Line>
              <DepthContext.Consumer>
                {(depth) => {
                  return (
                    <source>
                      <Markdown.Line>{'#'.repeat(depth)} {title}</Markdown.Line>
                      <DepthContext.Provider value={depth + 1}>
                        {children}
                      </DepthContext.Provider>
                    </source>
                  );
                }}
              </DepthContext.Consumer>
            </Markdown.Line>
          );
        },
        Root({ children }) {
          return (
            <DepthContext.Provider value={1}>
              {children}
            </DepthContext.Provider>
          );
        },
      };

      const Component = () => {
        const module1 = Js.Module('Urls', '/urls.js');
        const module2 = Js.Module('Client', '/development/index.js');
        return (
          <folder name="example2">
            <Npm.PackageJson contents={packageJsonContents}/>
            <folder name="src">
              <module1.Define>
                <Js.Class name={'Urls'} constructorParameters={['baseUrl']}>
                  {urls}
                </Js.Class>
              </module1.Define>
              <module2.Define>
                <module1.Require>
                  {({ name: module1Name }) => {
                    return (
                      <Js.ClassMethod name={'getSnapshotByApiIdAndSnapshotId'} parameters={['apiId', 'snapshotId']}>
                        const url = {module1Name}.snapshotByApiIdAndSnaphotId(apiId, snapshotId)
                        return this.fetch(url, options);
                      </Js.ClassMethod>
                    );
                  }}
                </module1.Require>
              </module2.Define>
              <file name="README.md">
                <Markdown.Root>
                  <Markdown.Section title="Getting Started">
                    <Markdown.Line>This code has been generated automatically by Optic</Markdown.Line>
                    <Markdown.Line>asdf</Markdown.Line>
                    <Markdown.Section title="Prerequisites">
                      - Node.js v8+
                    </Markdown.Section>
                    <Markdown.Section title="Installation">
                      ```bash
                      $ npm install
                      in your project
                      $ npm install $PATH_TO_THIS_FOLDER
                      ```
                    </Markdown.Section>
                    <Markdown.Section title="Usage">
                      ```javascript
                      const Client = require('client');
                      Client.someFunction(args)
                      .then(result)
                      .catch(
                      ```
                    </Markdown.Section>
                    <Markdown.Section title="Remarks">
                      Some things are left up to the developer; if you want to handle failures with retries, etc.....
                    </Markdown.Section>
                  </Markdown.Section>
                </Markdown.Root>
              </file>
            </folder>
          </folder>
        );
      };

      const callback = jest.fn();
      renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      stringify(result);
    });
  });
});
