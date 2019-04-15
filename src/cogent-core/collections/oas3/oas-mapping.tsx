import * as React from 'react';
import { IApiEndpoint } from '../../../cogent-engines/cogent-engine';
import * as Yaml from '../yaml';
import * as collect from 'collect.js';

//helpers

export function collectPaths(endpoints: IApiEndpoint[]) {
  // @ts-ignore
  return collect(endpoints).groupBy('path').all();
}

export function schemaToSwaggerYaml(jsonSchema: any) {
  let entries = Object.entries(jsonSchema);

  if (entries.length === 0) {
    return '{}';
  }

  const containsType: boolean = !!entries.find((i: any) => i[0] === 'type');

  if (containsType) {
    entries = entries.filter((i: any) => i[0] !== 'title');
  }

  entries = entries.filter(([_k, v]: any) => !v.type || v.type !== 'null');

  return (
    <Yaml.YObject>
      {entries.map(([k, v]) => {

        if (k === 'oneOf' || k === 'anyOf') {

          const types = (v as any[]).filter((i: any) => i.type !== 'null');

          if (types.length === 1) {
            return schemaToSwaggerYaml(types[0]);
          } else {
            return (
              <Yaml.Entry key={k} name={k} value={
                <Yaml.YArray>
                  {(v as any[]).map((entryValue: any, index: number) => {
                    return <Yaml.ArrayItem key={index}>{schemaToSwaggerYaml(entryValue)}</Yaml.ArrayItem>;
                  })}
                </Yaml.YArray>
              }/>
            );
          }
        }

        const value = (() => {

          if (typeof v === 'boolean') {
            return (v) ? 'true' : 'false';
          }

          if (typeof v === 'number') {
            return v.toString();
          }

          if (typeof v === 'object') {
            return schemaToSwaggerYaml(v);
          }

          return v;

        })();

        return <Yaml.Entry key={k} name={k} value={value}/>;
      })}
    </Yaml.YObject>
  );
}

export function toSwaggerPath(path: string, pathParameters: any[]) {
  const allNames = pathParameters.map(i => i.name);

  return allNames.reduce((currentPath: string, pathParam: any) => {
    return currentPath.replace(`:${pathParam}`, `{${pathParam}}`);
  }, path);
}

export function toSwaggerParameter(parameter: any, location: string) {
  return {
    'in': location,
    name: parameter.name,
    schema: parameter.schema.asJsonSchema,
    required: parameter.required || true,
  };
}
