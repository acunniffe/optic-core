import * as React from 'react';
import { IApiEndpoint, IApiRequestBody, IApiResponse, IApiResponseBody } from '../../../cogent-engines/cogent-engine';
import { IApiId } from '../../../optic-config/regexes';
import * as Yaml from '../yaml';
import * as collect from 'collect.js';
import {
  collectPaths,
  schemaToSwaggerYaml,
  toSwaggerParameter,
  toSwaggerPath,
} from './oas-mapping';
import * as niceTry from 'nice-try';

interface IOASRoot {
  endpoints: IApiEndpoint[],
  api: IApiId
}

function OASRoot({ endpoints, api }: IOASRoot) {

  const groupedEndpoints = collectPaths(endpoints);
  const allPaths = Object.keys(groupedEndpoints).sort();

  const metaInfo = [
    <Yaml.Entry key="openapi" name="openapi" value={'3.0.1'}/>,
    <Yaml.Entry key="info" name="info" value={
      <Yaml.YObject>
        <Yaml.Entry key="title" name="title" value={`${api.org}/${api.id}`}/>
        <Yaml.Entry key="version" name="version" value={'2.0.0'}/>
      </Yaml.YObject>
    }/>,
  ];

  return (
    <Yaml.File name={'oas.yml'} indentString={'  '}>
      <Yaml.YObject key={'root'}>
        {metaInfo}
        <Yaml.Entry key={'paths'} name="paths" value={(
          <Yaml.YObject>
            {allPaths.map((path: string, index: number) => {

              // @ts-ignore
              const allPathParameters = collect(groupedEndpoints[path]
                .map((i: any) => (i.request) ? i.request.pathParameters : []))
                .collapse().all();

              const swaggerPath = toSwaggerPath(path, allPathParameters);

              return (
                <Yaml.Entry key={index} name={swaggerPath} value={
                  <Yaml.YObject>
                    {groupedEndpoints[path]
                      .map((endpoint: IApiEndpoint, index: number) => (
                        <OASEndpoint key={index} endpoint={endpoint}/>
                      ))}
                  </Yaml.YObject>
                }/>
              );
            })}
          </Yaml.YObject>
        )}/>
      </Yaml.YObject>
    </Yaml.File>
  );

}

interface IOASRootEndpoint {
  endpoint: IApiEndpoint,
}

function OASEndpoint({ endpoint }: IOASRootEndpoint) {

  let swaggerParams: any[] = [];

  try {
    const pathParams = endpoint.request.pathParameters.map(i => toSwaggerParameter(i, 'path'));
    const headerParams = endpoint.request.headerParameters.map(i => toSwaggerParameter(i, 'header'));
    const queryPrams = endpoint.request.queryParameters.map(i => toSwaggerParameter(i, 'query'));
    // @ts-ignore
    swaggerParams = collect([headerParams, pathParams, queryPrams]).collapse().all();
  } catch (e) {
    // console.log(e)
  }

  const parameters = (
    <Yaml.YArray key={endpoint.path + endpoint.method}>{
      swaggerParams.map(i => {
        return <Yaml.ArrayItem key={endpoint.path + endpoint.method} children={schemaToSwaggerYaml(i)}/>;
      })
    }
    </Yaml.YArray>
  );


  const bodies: IApiRequestBody[] = niceTry(() => endpoint.request.bodies) || [];

  const requestBody = (
    <Yaml.YObject>
      <Yaml.Entry key={'desc'} name="description" value="description"/>
      <Yaml.Entry key={'content'} name={'content'} value={
        <Yaml.YObject>
          {bodies.map((body: IApiRequestBody) => (
            <Yaml.Entry key={body.contentType} name={body.contentType} value={
              <Yaml.YObject>
                <Yaml.Entry key={'schema'} name={'schema'} value={schemaToSwaggerYaml(body.schema.asJsonSchema)}/>
              </Yaml.YObject>
            }/>
          ))}
        </Yaml.YObject>
      }/>
    </Yaml.YObject>
  );

  const responses = (
    <Yaml.YObject>
      {endpoint.responses.map((response: IApiResponse, responseIndex: number) => {

        const bodies: IApiResponseBody[] = response.bodies;

        return <Yaml.Entry key={responseIndex} name={`'${response.statusCode}'`} value={
          <Yaml.YObject>
            <Yaml.Entry name="description" value="description"/>
            <Yaml.Entry name={'content'} value={
              <Yaml.YObject>
                {bodies.map((body: IApiResponseBody, bodyIndex: number) => (
                  <Yaml.Entry key={bodyIndex} name={body.contentType} value={
                    <Yaml.YObject>
                      <Yaml.Entry name={'schema'} value={schemaToSwaggerYaml(body.schema.asJsonSchema)}/>
                    </Yaml.YObject>
                  }/>
                ))}
              </Yaml.YObject>
            }/>
          </Yaml.YObject>
        }/>;
      })}
    </Yaml.YObject>
  );

  return (
    <Yaml.Entry name={endpoint.method.toLowerCase()} value={
      <Yaml.YObject>
        {(swaggerParams.length) ? <Yaml.Entry key="parameters" name="parameters" value={parameters}/> : null}
        {(bodies.length) ? <Yaml.Entry key="requestBody" name="requestBody" value={requestBody}/> : null}
        {(endpoint.responses) ? <Yaml.Entry key="responses" name="responses" value={responses}/> : null}
      </Yaml.YObject>
    }/>
  );

}

export {
  OASRoot,
};
