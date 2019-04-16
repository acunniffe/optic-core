import * as React from 'react';
import { IApiEndpoint } from '../../../cogent-engines/cogent-engine';
import * as Yaml from '../yaml';
import * as collect from 'collect.js';

//helpers

export function collectPaths(endpoints: IApiEndpoint[]) {
  // @ts-ignore
  return collect(endpoints).groupBy('path').all();
}

export function schemaToSwaggerYaml(jsonSchema: object) {
  let entries = Object.entries(jsonSchema);


  const containsType: boolean = !!entries.find(([k]) => k === 'type');

  if (containsType) {
    entries = entries.filter(([k]) => k !== 'title');
  }

  entries = entries.filter(([_k, v]: any) => !v.type || v.type !== 'null');

  if (entries.length === 0) {
    return '{}';
  }

  return (
    <Yaml.YObject>
      {entries.map(([k, v], entryIndex: number) => {

        if (k === 'oneOf' || k === 'anyOf') {

          const types = (v as any[]).filter((i: any) => i.type !== 'null');

          if (types.length === 1) {
            return <React.Fragment key={entryIndex}>{schemaToSwaggerYaml(types[0])}</React.Fragment>;
          } else {
            return (
              <Yaml.Entry key={entryIndex} name={k} value={
                <Yaml.YArray>
                  {(v as any[]).map((entryValue: any, subSchemaIndex: number) => {
                    return <Yaml.ArrayItem key={subSchemaIndex}>{schemaToSwaggerYaml(entryValue)}</Yaml.ArrayItem>;
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

        return <Yaml.Entry key={entryIndex} name={k} value={value}/>;
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
