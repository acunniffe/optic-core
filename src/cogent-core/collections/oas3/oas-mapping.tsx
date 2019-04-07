import { ReactNode } from 'react';
import * as React from 'react';
import * as Yaml from '../yaml';
import * as collect from 'collect.js'
import { IApiEndpoint, IApiRequestParameter } from '../../../cogent-engines/cogent-engine';

//helpers
const distinct = (array: any[]) => Array.from(new Set(array))


export function collectPaths(endpoints: IApiEndpoint[]): {[key: string]: IApiEndpoint[]} {
  return collect(endpoints).groupBy('path').all()
}

export const endpointConsumes = (endpoint: IApiEndpoint) =>
  distinct(endpoint.request.bodies.map(i => i.contentType))

export const endpointProduces = (endpoint: IApiEndpoint) =>
  distinct(collect(endpoint.responses)
    .flatMap(i => i.bodies
      .map(b => b.contentType))
    .all())



export interface IOASRequestParameter {
  'in': 'query' | 'header' | 'cookie' | 'path',
  name: string,
  schema: object,
  required: boolean
}

export function schemaToSwaggerYaml(jsonSchema: object): ReactNode {
  const entires = Object.entries(jsonSchema)

  if (entires.length === 0) {
    return '{}'
  }

  return <Yaml.YObject children={entires.map(entry => {

    const value = (() => {

      const v = entry[1]

      if (typeof v === 'boolean') {
        return (v) ? 'true' : 'false'
      }

      if (typeof v === 'number') {
        return v.toString()
      }

      if (typeof v === 'object') {
        return schemaToSwaggerYaml(v)
      }

      return v

    })()

    return <Yaml.Entry key={entry[0]} name={entry[0]} value={value}/>
  })}/>
}

export function toSwaggerPath(path: string, pathParameters): string {
  const allNames = pathParameters.map(i => i.name)

  return allNames.reduce((currentPath: string, pathParam: string) => {
    return currentPath.replace(`:${pathParam}`, `{${pathParam}}`)
  }, path)
}

export function toSwaggerParameter(parameter: IApiRequestParameter, location: string): IOASRequestParameter {
  return {
    'in': location,
    name: parameter.name,
    schema: parameter.schema.asJsonSchema,
    required: parameter.required || true
  }
}
