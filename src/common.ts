import { Request } from 'express';
import * as pathToRegexp from 'path-to-regexp';

export interface IPathMatcherKey {
  name: string
  optional: boolean
}

export interface IPathMatcher {
  path: string
  keys: IPathMatcherKey[]
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

export function getMatchingPath(url: string, pathMatcherList: IPathMatcher[]) {
  const matchedPath = pathMatcherList.find((pathMatcher: IPathMatcher) => pathMatcher.regexp.test(url));
  return matchedPath || null;
}

export function packageRequest(req: Request) {
  const request: IRequestMetadata = {
    queryParameters: req.query,
    body: req.body,
    headers: req.headers,
    cookies: req.cookies,
    method: req.method,
    url: req.path
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
  method: string
  headers: IHeaders
  cookies: IParameterMapping
  queryParameters: IParameterMapping
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


export function groupByKey<T>(keyFn: (item: T) => string) {
  return (acc: Map<string, T[]>, value: T) => {
    const key = keyFn(value);
    acc.set(key, [...(acc.get(key) || []), value]);

    return acc;
  };
}
