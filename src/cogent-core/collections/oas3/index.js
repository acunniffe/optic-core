import { ReactNode } from 'react';
import React from 'react';
import { IApiEndpoint } from '../../../../build/src/cogent-engines/cogent-engine';
import { YArray } from '../yaml';
import Yaml from '../yaml';
import collect from 'collect.js'
import {
  collectPaths,
  IOASRequestParameter,
  schemaToSwaggerYaml,
  toSwaggerParameter,
  toSwaggerPath,
} from './oas-mapping';
import niceTry from 'nice-try'

export function OASRoot({ endpoints }) {

  const groupedEndpoints = collectPaths(endpoints);
  const allPaths = Object.keys(groupedEndpoints).sort();

  const metaInfo = [
    <Yaml.Entry key="openapi" name="openapi" value={'3.0.1'} />,
    <Yaml.Entry key="info" name="info" value={
      <Yaml.YObject>
        <Yaml.Entry key="title" name="title" value={'title'} />
        <Yaml.Entry key="version" name="version" value={'2.0.0'} />
      </Yaml.YObject>
    }/>,
  ]

  return (<Yaml.File name={'oas.yml'}>
    <Yaml.YObject key={"root"}>
      {metaInfo}
      <Yaml.Entry key={"paths"} name="paths" value={
        <Yaml.YObject>
          {allPaths.map((path) => {
            const allPathParameters =
              collect(groupedEndpoints[path].map(i => (i.request) ? i.request.pathParameters : []))
                .collapse().all()

            const swaggerPath = toSwaggerPath(path, allPathParameters)

            return <Yaml.Entry key={swaggerPath} name={swaggerPath} value={
              <Yaml.YObject>
                {groupedEndpoints[path].map(endpoint => <OASEndpoint endpoint={endpoint} />)}
              </Yaml.YObject>
            }/>;
          })}
        </Yaml.YObject>
      }/>
    </Yaml.YObject>
  </Yaml.File>);

}

function OASEndpoint({ endpoint }) {

  let swaggerParams = []

  try {
    const pathParams = endpoint.request.pathParameters.map(i => toSwaggerParameter(i, 'path'))
    const headerParams = endpoint.request.headerParameters.map(i => toSwaggerParameter(i, 'header'))
    const queryPrams = endpoint.request.queryParameters.map(i => toSwaggerParameter(i, 'query'))
    swaggerParams = collect([headerParams, pathParams, queryPrams]).collapse().all()
  } catch (e) {
    // console.log(e)
  }


  const parameters = (<Yaml.YArray>
    {swaggerParams.map(i => {

      return <Yaml.ArrayItem children={schemaToSwaggerYaml(i)}/>
    })}
  </Yaml.YArray>)


  const bodies = niceTry(() => endpoint.request.bodies) || []

  const requestBody = (<Yaml.YObject>
    <Yaml.Entry name="description" value="description"/>
    <Yaml.Entry name={'content'} value={
      <Yaml.YObject>
        {bodies.map(body => (
          <Yaml.Entry name={body.contentType} value={
            <Yaml.YObject>
              <Yaml.Entry name={'schema'} value={schemaToSwaggerYaml(body.schema.asJsonSchema)} />
            </Yaml.YObject>
          }/>
        ))}
    </Yaml.YObject>}/>
  </Yaml.YObject>)

  const responses = (<Yaml.YObject>
    {endpoint.responses.map(response => {

      const bodies = response.bodies

      return <Yaml.Entry name={`'${response.statusCode}'`} value={
        <Yaml.YObject>
          <Yaml.Entry name="description" value="description"/>
          <Yaml.Entry name={'content'} value={
            <Yaml.YObject>
              {bodies.map(body => (
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
