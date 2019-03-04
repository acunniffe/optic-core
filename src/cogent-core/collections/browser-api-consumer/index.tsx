import { STATUS_CODES } from 'http';
import { Token } from 'path-to-regexp';
import * as pathToRegexp from 'path-to-regexp';
import * as React from 'react';
import {
  IApiEndpoint, IApiRequestBody, IApiResponse, IApiResponseBody,
  IApiSnapshot,
  ICogentArtifactIdentifier,
  IOpticApiIdentifier,
} from '../../../cogent-engines/cogent-engine';
import { methodAndPathToName } from '../../common/naming-utilities';
import { toLines } from '../common';
import { Code, Line, Link, Root, Section, UnorderedList } from '../markdown';
import { createPackageJson } from '../npm';

//@TODO use urljoin
function pathToUrlExpression(path: string, pathParameterNames: string[]) {
  const parts = pathToRegexp.parse(path);
  let pathParameterCursor = -1;
  const partsExpression = parts
    .map((part: Token) => {
      if (typeof part === 'string') {
        return part;
      } else {
        pathParameterCursor += 1;

        return `/$\{${pathParameterNames[pathParameterCursor]}\}`;
      }
    })
    .join('');

  return ['`', '${this.baseUrl}', partsExpression, '`'].join('');
}

function apiToClient(snapshot: IApiSnapshot, api: IOpticApiIdentifier, artifact: ICogentArtifactIdentifier) {
  const requestInfo = snapshot.endpoints
    .filter(x => x.request !== null)
    .map((endpoint: IApiEndpoint) => {
      return endpointToMethods(endpoint);
    });

  const requests = requestInfo
    .reduce((acc: any[], values: any[]) => [...acc, ...values], []);

  const apiIdParts = api.id.split('/');
  const apiSlug = apiIdParts[apiIdParts.length - 1];
  const packageName = `${apiSlug}-js-client`;
  const packageVersion = api.version;
  const { File, addDependency, setMain } = createPackageJson({ name: packageName, version: packageVersion });
  setMain('src/Client.js');
  addDependency({ moduleId: 'unirest', version: '^0.6.0' });

  const hasSecurityDefinitions = snapshot.securityDefinitions.length > 0;
  let securityCredentialsShape = '';
  if (hasSecurityDefinitions) {
    switch (snapshot.securityDefinitions[0].type) {
      case 'apiKey':
        securityCredentialsShape = `{apiKey: 'YOUR_API_KEY'`;
        break;
      case 'basic':
        securityCredentialsShape = `{user: 'username', pass: 'password'}`;
        break;
      case 'bearer':
        securityCredentialsShape = `{token: 'YOUR_TOKEN'}`;
        break;
      default:
        securityCredentialsShape = '???';
    }
  }
  const classConstructor = hasSecurityDefinitions
    ? `constructor(baseUrl, getCredentials) {
    this.baseUrl = baseUrl;
    this.getCredentials = getCredentials;
  }`
    : `constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }`;
  const availableMethodsByRequestName = requests
    .map(({ signature, requestName }: IApiEndpointInfo) => {
      return (
        <UnorderedList key={requestName}>
          <Link label={`\`client.${signature}\``} to={`./docs/${requestName}.md`}/>
        </UnorderedList>
      );
    });
  const availableMethodsByMethodAndPath = requests
    .map(({ method, path, requestName }: IApiEndpointInfo) => {
      return (
        <UnorderedList key={requestName}>
          <Link label={`\`${method} ${path}\``} to={`./docs/${requestName}.md`}/>
        </UnorderedList>
      );
    });
  return (
    <React.Fragment>
      <folder name="src">
        <file name="Client.js">
          <source>
            const unirest = require('unirest');
          </source>
          <source>
            {toLines`
class Client {
  ${classConstructor}`}
            {requests.map(x => x.requestCode)}
            {toLines`
}

module.exports = {
  Client
}`}
          </source>
        </file>
      </folder>
      <folder name="docs">
        {requests.map(({ requestName, documentationCode }: IApiEndpointInfo) => {
          return (
            <file key={requestName} name={`${requestName}.md`}>
              {documentationCode}
            </file>
          );
        })}
      </folder>
      <file name="README.md">
        <Root>
          <line>{packageName}@{packageVersion}</line>
          <Section title="Getting Started">
            <Section title="Installation">
              <Line>To use this code in your project, you'll need to `npm install` it using a relative path</Line>
              <Line>It uses <Link label="`unirest`" to="http://unirest.io/nodejs.html"/> as a dependency. Each call will
                return a `unirest` return value (`.end` for a callback, or `.then` and `.catch` for a Promise)</Line>
              <Code language="bash">
                <line>(from your NPM javascript project)</line>
                <line>$ npm install --save PATH_TO_THIS_FOLDER</line>
              </Code>
            </Section>
            <Section title="Usage">
              <Code language="javascript">
                <line>{`const {Client} = require('${packageName}');`}</line>
                <source>{`const baseUrl = 'YOUR API BASE URL';`}</source>
                {hasSecurityDefinitions && toLines`
// getCredentials can return a Promise or a synchronous value
const getCredentials = () => (${securityCredentialsShape});
const client = new Client(baseUrl, getCredentials);`
                }
                {!hasSecurityDefinitions && toLines`
const client = new Client(baseUrl);
                `}
                <line>// now you can call the available methods from your API using client.</line>
              </Code>
              <Section title="Available Methods">
                {availableMethodsByRequestName}
              </Section>
              <Section title="Overview">
                {availableMethodsByMethodAndPath}
              </Section>
            </Section>
          </Section>
          <Section title="Notes">
            <line>
              This project was generated with
              <Link label="Optic" to="https://useoptic.com"/>
              ({artifact.id}@{artifact.version})
            </line>
          </Section>
        </Root>
      </file>
      <File/>
    </React.Fragment>
  );
}

interface IApiEndpointInfo {
  signature: string
  path: string
  method: string
  requestName: string
  resourceName: string
  requestCode: string
  documentationCode: JSX.Element
}

//@REFACTOR
function endpointToMethods(endpoint: IApiEndpoint): IApiEndpointInfo[] {
  const { path, method, securityDefinitions, request } = endpoint;
  const { pathParameters, headerParameters, queryParameters, bodies } = request;
  const pathParameterNames = pathParameters.map(x => x.name);
  const unirestMethod = method.toLowerCase();
  const { requestName, resourceName } = methodAndPathToName(method, path);
  const urlExpression = pathToUrlExpression(path, pathParameterNames);

  const requiresCredentials = securityDefinitions.length > 0;
  const hasHeaderParameters = headerParameters.length > 0;
  const hasQueryParameters = queryParameters.length > 0;
  const hasBody = bodies.length > 0;
  const parameterList = [...pathParameterNames];

  if (hasQueryParameters) {
    parameterList.push('queryParameters');
  }
  if (hasHeaderParameters) {
    parameterList.push('headerParameters');
  }
  if (hasBody) {
    parameterList.push(resourceName);
  }

  const unirestChain = [];
  unirestChain.push(`.${unirestMethod}(${urlExpression})`);
  if (hasHeaderParameters) {
    unirestChain.push(`.headers(headerParameters)`);
  }

  if (requiresCredentials) {
    const securityDefinition = securityDefinitions[0];
    if (securityDefinition.type === 'bearer') {
      unirestChain.push('.header("Authorization", `Bearer ${_credentials.token}`)');
    } else if (securityDefinition.type === 'basic') {
      unirestChain.push(`.auth(_credentials.user, _credentials.pass, true)`);
    } else if (securityDefinition.type === 'apiKey') {
      if (securityDefinition.in === 'header') {
        unirestChain.push(`.header(${JSON.stringify(securityDefinition.name)}, _credentials.apiKey)`);
      } else if (securityDefinition.in === 'query') {
        unirestChain.push(`.query({${JSON.stringify(securityDefinition.name)}: _credentials.apiKey})`);
      }
    }
  }

  if (hasBody) {
    unirestChain.push(`.headers("content-type", ${JSON.stringify(bodies[0].contentType)})`);
    unirestChain.push(`.send(${resourceName})`);
  }

  const chain = unirestChain.length === 0 ? '' : unirestChain.join('\n        ');
  const signature = `${requestName}(${parameterList.join(', ')})`;
  let requestCode;
  let documentationCode = endpointToDocumentation(endpoint, signature);
  //@TODO handle parameter naming collisions
  if (requiresCredentials) {
    requestCode =
      toLines`
    ${signature} {
      return Promise
        .resolve(this.getCredentials())
        .then((_credentials) => {
          return unirest
            ${chain};
        })
    }
        `;
  } else {
    requestCode =
      toLines`
    ${signature} {
      return unirest
        ${chain};
    }`;
  }

  return [{
    path,
    method,
    signature,
    requestName,
    resourceName,
    requestCode,
    documentationCode,
  }];
}

function endpointToDocumentation(endpoint: IApiEndpoint, signature: string) {
  const { path, method, securityDefinitions, request } = endpoint;

  const { resourceName } = methodAndPathToName(method, path);
  const securityDescription = securityDefinitions.length === 0 ? 'unsecured' : `secured with ${securityDefinitions[0].type} auth`;
  const bodyItems = request.bodies
    .map((body: IApiRequestBody) => {
      return (
        <Section key={body.contentType} title={`Content-Type: ${body.contentType}`}>
          <Line>JSON Schema:</Line>
          <Code language="json">
            {toLines`${JSON.stringify(body.schema.asJsonSchema, null, 2)}`}
          </Code>
        </Section>
      );
    });

  return (
    <Root>
      <Section title="Request">
        <Line>`{method} {path}`</Line>
        <Line>`client.{signature}`</Line>
        <Line>Resource Name: `{resourceName}`</Line>
        <Line>Security: {securityDescription}</Line>
        {bodyItems.length > 0 ? <Section title="Body">{bodyItems}</Section> : null}
      </Section>
      <Section title="Responses">
        {endpoint.responses.map((response: IApiResponse) => {
          return (
            <Section key={response.statusCode} title={`${response.statusCode} : ${STATUS_CODES[response.statusCode]}`}>
              {response.bodies.map((body: IApiResponseBody) => {
                return (
                  <Section key={body.contentType} title={`Content-Type: ${body.contentType}`}>
                    <Line>JSON Schema:</Line>
                    <Code language="json">
                      {toLines`${JSON.stringify(body.schema.asJsonSchema, null, 2)}`}
                    </Code>
                  </Section>
                );
              })}

            </Section>
          );
        })}
      </Section>
    </Root>
  );
}

export {
  pathToUrlExpression,
  apiToClient,
  toLines,
};
