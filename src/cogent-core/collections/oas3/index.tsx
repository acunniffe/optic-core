import { ReactNode } from 'react';
import * as collect from 'collect.js';
import * as React from 'react';
import { IApiEndpoint } from '../../../../build/src/cogent-engines/cogent-engine';
import * as Yaml from '../yaml';
import { collectPaths, IOASRequestParameter, toSwaggerParameter } from './oas-mapping';


interface IOASRoot {
  endpoints: IApiEndpoint[],
}

function OASRoot({ endpoints }: IOASRoot) {

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
    <Yaml.YObject>
      {metaInfo}
      <Yaml.Entry key={"path"} name="paths" value={
        <Yaml.YObject>
          {allPaths.map((path) => {
            return <Yaml.Entry key={path} name={path} value={
              <Yaml.YObject>
                {groupedEndpoints[path].map(endpoint => <OASEndpoint endpoint={endpoint} />)}
              </Yaml.YObject>
            }/>;
          }}
        </Yaml.YObject>
      }/>
    </Yaml.YObject>
  </Yaml.File>);

}

interface IOASRootEndpoint {
  endpoint: IApiEndpoint,
}

function OASEndpoint({ endpoint }: IOASRootEndpoint) {


  const parameters: IOASRequestParameter[] = (() => {
    const headerParams = endpoint.request.headerParameters.map(toSwaggerParameter)
    const pathParams = endpoint.request.pathParameters.map(toSwaggerParameter)
    const queryPrams = endpoint.request.queryParameters.map(toSwaggerParameter)
    collect(headerParams, pathParams, queryPrams).collapse().all()
  })()

  return <Yaml.Entry name={endpoint.method} value={
    <Yaml.YObject>
      <Yaml.Entry name="consumes" value="consumes value"/>
      <Yaml.Entry name="produces" value="consumes value"/>
    </Yaml.YObject>
  }/>;

}

export {
  OASRoot,
};
