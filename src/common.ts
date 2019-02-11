import { Request } from 'express';
import * as pathToRegexp from 'path-to-regexp';

export interface IPathMatcher {
  path: string,
  regexp: RegExp
}

export function pathToMatcher(path: string) {
  const keys = [];
  const regexp = pathToRegexp(path, keys, { sensitive: true });

  return {
    path,
    keys,
    regexp,
  };
}

export class Counter {
  public static count<T>(items: T[], p: (item: T) => string) {
    return items
      .map(x => p(x))
      .reduce((acc, key) => {
        acc.set(key, (acc.get(key) || 0) + 1);

        return acc;
      }, new Map());
  }
}

export function append<K, V>(map: Map<K, V[]>, key: K, value: V) {
  if (!map.has(key)) {
    map.set(key, [value]);
  } else {
    const existingValues = map.get(key);
    map.set(key, [...existingValues, value]);
  }
}

export function passThrough<T>(callback: Function) {
  return function(result: T) {
    callback();

    return result;
  };
}

export function packageRequest(req: Request, pathMatcherList: IPathMatcher[]) {
  const url = req.path;
  const matchedPath = pathMatcherList.find((pathMatcher: IPathMatcher) => pathMatcher.regexp.test(url));
  const path = matchedPath ? matchedPath.path : null;
  if (!matchedPath) {
    console.warn(`did not find a path matching ${url}. please add it to your optic.yml`);
  }

  const request: IRequestMetadata = {
    pathParameters: req.params,
    queryParameters: req.query,
    body: req.body,
    headers: req.headers,
    method: req.method,
    url,
    path,
  };

  return request;
}

export interface IHeaders {
  [key: string]: string | string[]
}

export interface IParameterMapping {
  [key: string]: string
}

export interface IRequestMetadata {
  url: string,
  path: string,
  method: string
  headers: IHeaders
  queryParameters: IParameterMapping
  pathParameters: IParameterMapping
  body?: object
}

export interface IResponseMetadata {
  statusCode: number
  headers: IHeaders
  body?: object

}

export interface IApiInteraction {
  request: IRequestMetadata
  response: IResponseMetadata
}
