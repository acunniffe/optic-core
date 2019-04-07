import { ReactNode } from 'react';
import * as React from 'react';
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

export const toSwaggerParameter(parameter: IApiRequestParameter, location: string): IOASRequestParameter  =>  {
  return {
    'in': location,
    name: parameter.name,
    schema: parameter.schema.asJsonSchema,
    required: parameter.required || true
  }
}
