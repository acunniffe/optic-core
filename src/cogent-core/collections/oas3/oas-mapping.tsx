import * as React from 'react';
import { IApiEndpoint } from '../../../cogent-engines/cogent-engine';
import * as Yaml from '../yaml';
import * as collect from 'collect.js'

//helpers

export function collectPaths(endpoints: IApiEndpoint[]) {
  // @ts-ignore
  return collect(endpoints).groupBy('path').all()
}

export function schemaToSwaggerYaml(jsonSchema: any) {
  const entires = Object.entries(jsonSchema)

  if (entires.length === 0) {
    return '{}'
  }

  return <Yaml.YObject children={entires.map((entry:any) => {

    if (entry[0] === 'oneOf' || entry[0] === 'anyOf') {

      const types = entry[1].filter((i:any) => i.type !== 'null')

      if (types.length === 1) {
        return schemaToSwaggerYaml(types[0])
      } else {
        return <Yaml.Entry key={entry[0]} name={entry[0]} value={
          <Yaml.YArray>
            {entry[1].map((entryValue: any, index: number) => {
              return <Yaml.ArrayItem key={index}>{schemaToSwaggerYaml(entryValue)}</Yaml.ArrayItem>
            })}
          </Yaml.YArray>
        }/>
      }
    }

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

export function toSwaggerPath(path: string, pathParameters: any[]) {
  const allNames = pathParameters.map(i => i.name)

  return allNames.reduce((currentPath:string, pathParam: any) => {
    return currentPath.replace(`:${pathParam}`, `{${pathParam}}`)
  }, path)
}

export function toSwaggerParameter(parameter:any, location: string) {
  return {
    'in': location,
    name: parameter.name,
    schema: parameter.schema.asJsonSchema,
    required: parameter.required || true
  }
}
