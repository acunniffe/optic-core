import * as React from 'react';
import { methodAndPathToName } from '../../common/naming-utilities';

function Class({ name, children }) {
  return (
    <source>
      <line>{`class ${name} {`}</line>
      <line>{children}</line>
      <line>{`}`}</line>
    </source>
  );
}

function createMethod(name, parameters) {
  const Declaration = () => {

  };
  const Parameters = [];
  return {
    Declaration,
    Parameters,
  };
}

function Method({ name, parameters, children }) {

  return (
    <source>
      <line>{`  ${name}(`}{parameters}{`) {`}</line>
      <line>{body}</line>
      <line>{`}`}</line>
    </source>
  );
}

const packageJson = createPackage();
const unirest = createDependency('unirest', 'latest');


const x = (
  <React.Fragment>
    <PackageJson>
      {unirest.Dependency}
    </PackageJson>
    <Module>
      <DefaultImport moduleId="unirest"/>
      <Class name="Client">
        <Method name="constructor">
          <Parameter name="apiBaseUrl"/>
          <Parameter name="getCredentials"/>
          <Body>
          <line children={`this.apiBaseUrl = apiBaseUrl;`}/>
          <line children={`this.getCredentials = getCredentials;`}/>
          </Body>
        </Method>
        {endpoints.forEach(endpoint => {
          const { path, method } = endpoint;
          const requestName = methodAndPathToName(method, path);
          const parameters = [];
          const unirestMethod = method.toLowerCase();
          const urlExpression = '`${this.baseUrl}`';

          return (
            <Method name={requestName} key={requestName}>
              <Body>
              <line children={`unirest.${unirestMethod}(${urlExpression})`}/>
              <line children={`.header('content-type', ${request.contentType})`}/>
              <line children={`.${unirestMethod}`}/>
              <line children={`.${unirestMethod}`}/>
              <line children={`.end((response) => {`}/>
              </Body>
            </Method>
          );
        })}
      </Class>
    </Module>
  </React.Fragment>
);
