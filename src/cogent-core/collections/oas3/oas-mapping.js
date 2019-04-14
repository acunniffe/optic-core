import { ReactNode } from 'react';
import React from 'react';
import Yaml from '../yaml';
import collect from 'collect.js'
import { IApiEndpoint, IApiRequestParameter } from '../../../cogent-engines/cogent-engine';

//helpers
const distinct = (array) => Array.from(new Set(array))

export function collectPaths(endpoints) {
  return collect(endpoints).groupBy('path').all()
}

export function schemaToSwaggerYaml(jsonSchema) {
  const entires = Object.entries(jsonSchema)

  if (entires.length === 0) {
    return '{}'
  }

  return <Yaml.YObject children={entires.map(entry => {

    if (entry[0] === 'oneOf' || entry[0] === 'anyOf') {

      const types = entry[1].filter(i => i.type !== 'null')

      if (types.length === 1) {
        return schemaToSwaggerYaml(types[0])
      } else {
        return <Yaml.Entry key={entry[0]} name={entry[0]} value={
          <Yaml.YArray>
            {entry[1].map((entryValue, index) => {
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

export function toSwaggerPath(path, pathParameters) {
  const allNames = pathParameters.map(i => i.name)

  return allNames.reduce((currentPath, pathParam) => {
    return currentPath.replace(`:${pathParam}`, `{${pathParam}}`)
  }, path)
}

export function toSwaggerParameter(parameter, location) {
  return {
    'in': location,
    name: parameter.name,
    schema: parameter.schema.asJsonSchema,
    required: parameter.required || true
  }
}
