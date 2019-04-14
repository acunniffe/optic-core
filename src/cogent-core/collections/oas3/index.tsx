import * as React from 'react';
import { IApiEndpoint, IApiRequestBody, IApiResponse, IApiResponseBody } from '../../../cogent-engines/cogent-engine';
import { IApiId } from '../../../optic-config/regexes';
import * as Yaml from '../yaml';
import * as collect from 'collect.js'
import {
  collectPaths,
  schemaToSwaggerYaml,
  toSwaggerParameter,
  toSwaggerPath,
} from './oas-mapping';
import * as niceTry from 'nice-try'

interface IOASRoot {
  endpoints: IApiEndpoint[],
  api: IApiId
}

function OASRoot({ endpoints, api }: IOASRoot) {

  const groupedEndpoints = collectPaths(endpoints);
  const allPaths = Object.keys(groupedEndpoints).sort();

  const metaInfo = [
    <Yaml.Entry key="openapi" name="openapi" value={'3.0.1'} />,
    <Yaml.Entry key="info" name="info" value={
      <Yaml.YObject>
        <Yaml.Entry key="title" name="title" value={api.org+'/'+api.id} />
        <Yaml.Entry key="version" name="version" value={'2.0.0'} />
      </Yaml.YObject>
    }/>,
  ]

  return (<Yaml.File name={'oas.yml'} indentString={'  '}>
    <Yaml.YObject key={"root"}>
      {metaInfo}
      <Yaml.Entry key={"paths"} name="paths" value={
        <Yaml.YObject>
          {allPaths.map((path: string) => {

            // @ts-ignore
            const allPathParameters = collect(groupedEndpoints[path].map((i: any) => (i.request) ? i.request.pathParameters : []))
                .collapse().all()

            const swaggerPath = toSwaggerPath(path, allPathParameters)

            return <Yaml.Entry key={swaggerPath} name={swaggerPath} value={
              <Yaml.YObject>
                {groupedEndpoints[path].map( (endpoint:IApiEndpoint) => <OASEndpoint endpoint={endpoint} />)}
              </Yaml.YObject>
            }/>;
          })}
        </Yaml.YObject>
      }/>
    </Yaml.YObject>
  </Yaml.File>);

}

interface IOASRootEndpoint {
  endpoint: IApiEndpoint,
}

function OASEndpoint({ endpoint }: IOASRootEndpoint) {

  let swaggerParams: any[] = []

  try {
    // @ts-ignore
    const pathParams = endpoint.request.pathParameters.map(i => toSwaggerParameter(i, 'path'))
    // @ts-ignore
    const headerParams = endpoint.request.headerParameters.map(i => toSwaggerParameter(i, 'header'))
    // @ts-ignore
    const queryPrams = endpoint.request.queryParameters.map(i => toSwaggerParameter(i, 'query'))
    // @ts-ignore
    swaggerParams = collect([headerParams, pathParams, queryPrams]).collapse().all()
  } catch (e) {
    // console.log(e)
  }

  // @ts-ignore
  const parameters = (<Yaml.YArray>{swaggerParams.map(i => {
      return <Yaml.ArrayItem children={schemaToSwaggerYaml(i)}/>
    })}
  </Yaml.YArray>)


  const bodies: IApiRequestBody[] = niceTry(() => endpoint.request.bodies) || []

  const requestBody = (<Yaml.YObject>
    <Yaml.Entry name="description" value="description"/>
    <Yaml.Entry name={'content'} value={
      <Yaml.YObject>
        {bodies.map((body: IApiRequestBody) => (
          <Yaml.Entry name={body.contentType} value={
            <Yaml.YObject>
              <Yaml.Entry name={'schema'} value={schemaToSwaggerYaml(body.schema.asJsonSchema)} />
            </Yaml.YObject>
          }/>
        ))}
      </Yaml.YObject>}/>
  </Yaml.YObject>)

  const responses = (<Yaml.YObject>
    {endpoint.responses.map( (response: IApiResponse) => {

      const bodies : IApiResponseBody[] = response.bodies

      return <Yaml.Entry name={`'${response.statusCode}'`} value={
        <Yaml.YObject>
          <Yaml.Entry name="description" value="description"/>
          <Yaml.Entry name={'content'} value={
            <Yaml.YObject>
              {bodies.map((body: IApiResponseBody) => (
                <Yaml.Entry name={body.contentType} value={
                  <Yaml.YObject>
                    <Yaml.Entry name={'schema'} value={schemaToSwaggerYaml(body.schema.asJsonSchema)} />
                  </Yaml.YObject>
                }/>
              ))}
            </Yaml.YObject>}/>
        </Yaml.YObject>
      }/>
    })}
  </Yaml.YObject>)

  return <Yaml.Entry key={endpoint.method} name={endpoint.method.toLowerCase()} value={
    <Yaml.YObject>
      {(swaggerParams.length) ? <Yaml.Entry name="parameters" value={parameters}/> : null}
      {(bodies.length) ? <Yaml.Entry name="requestBody" value={requestBody}/> : null}
      {(endpoint.responses) ? <Yaml.Entry name="responses" value={responses}/> : null}
      {/*<Yaml.Entry name="produces" value="consumes value"/>*/}
    </Yaml.YObject>
  }/>;

}

export {
  OASRoot,
};
