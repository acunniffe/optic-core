import { parse } from 'cookie';
import * as pathMatch from 'path-match';
import { getMatchingPath, IApiInteraction, IPathMatcher } from './common';
import { ISecurityConfig } from './session-manager';
import { flattenJavascriptValueToList, IFlattenedJsValueItem } from './value-to-shape';

const headerBlacklist = new Set([
  'accept',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'access-control-max-age',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'accept-patch',
  'accept-ranges',
  'age',
  'allow',
  'alt-svc',
  'authorization',
  'cache-control',
  'connection',
  'content-disposition',
  'content-encoding',
  'content-language',
  'content-length',
  'content-location',
  'content-range',
  'content-type',
  'cookie',
  'date',
  'expect',
  'expires',
  'forwarded',
  'from',
  'host',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'if-unmodified-since',
  'last-modified',
  'location',
  'pragma',
  'proxy-authenticate',
  'proxy-authorization',
  'public-key-pins',
  'range',
  'referer',
  'retry-after',
  'set-cookie',
  'strict-transport-security',
  'trailer',
  'transfer-encoding',
  'tk',
  'upgrade',
  'user-agent',
  'vary',
  'via',
  'warning',
  'www-authenticate',
].map(x => x.toLowerCase()));

export type DataShape = IFlattenedJsValueItem[];

export interface IBaseObservation {
  type: string
}

export interface IPathObserved extends IBaseObservation {
  type: 'PathObserved'
  path: string
}

export interface IUnrecognizedUrlObserved extends IBaseObservation {
  type: 'UnrecognizedUrlObserved'
  url: string
}

export interface IMethodObserved extends IBaseObservation {
  type: 'MethodObserved'
  path: string
  method: string
}

export interface IStatusObserved extends IBaseObservation, IInteractionContext {
  type: 'StatusObserved'
}

interface ISecurityObserved extends IBaseObservation, IInteractionContext {
  type: 'SecurityObserved'
  security: ISecurityConfig
}

enum ParameterSource {
  header = 'header',
  query = 'query',
  path = 'path'
}

interface IRequestParameterObserved extends IBaseObservation, IInteractionContext {
  type: 'RequestParameterObserved'
  source: ParameterSource
  name: string
  valueShape: DataShape
}

interface IInteractionContext {
  method: string
  path: string
  statusCode: number
}

interface IRequestBodyObserved extends IBaseObservation, IInteractionContext {
  type: 'RequestBodyObserved'
  contentType: string
  bodyShape: IFlattenedJsValueItem[]
}

interface IResponseHeaderObserved extends IBaseObservation, IInteractionContext {
  type: 'ResponseHeaderObserved',
  name: string,
  valueShape: DataShape
}

interface IResponseCookieObserved extends IBaseObservation, IInteractionContext {
  type: 'ResponseCookieObserved',
  name: string,
  valueShape: DataShape
}

interface IResponseBodyObserved extends IBaseObservation, IInteractionContext {
  type: 'ResponseBodyObserved'
  contentType: string
  bodyShape: IFlattenedJsValueItem[]
}

export type Observation =
  IPathObserved
  | IUnrecognizedUrlObserved
  | IMethodObserved
  | IStatusObserved
  | ISecurityObserved
  | IRequestParameterObserved
  | IRequestBodyObserved
  | IResponseBodyObserved
  | IResponseCookieObserved
  | IResponseHeaderObserved;

export interface IObserverConfig {
  pathMatcherList: IPathMatcher[],
  security?: ISecurityConfig
}

class InteractionsToObservations {
  public static getObservations(interactions: IApiInteraction[], config: IObserverConfig): Observation[] {
    const observations = [];
    for (const interaction of interactions) {
      const observationsForSample = InteractionsToObservations.getObservationsForInteraction(interaction, config);
      observations.push(...observationsForSample);
    }

    return observations;
  }

  public static getObservationsForInteraction(interaction: IApiInteraction, config: IObserverConfig) {
    const { request, response } = interaction;
    const observations: Observation[] = [];

    const pathMatcher = getMatchingPath(request.url, config.pathMatcherList);
    if (!pathMatcher) {
      const observation: IUnrecognizedUrlObserved = {
        type: 'UnrecognizedUrlObserved',
        url: request.url,
      };
      observations.push(observation);

      return observations;
    }

    // to make this easier, we could listen for all the declared paths in express in which case req.params would be populated
    const { path } = pathMatcher;

    const { url, method, queryParameters, headers: requestHeaders, cookies } = request;
    const { statusCode, headers: responseHeaders } = response;

    const pathParser = pathMatch({ sensitive: true })(path);
    const pathParameters = pathParser(url);

    const pathObservation: IPathObserved = {
      type: 'PathObserved',
      path,
    };
    const methodObservation: IMethodObserved = {
      type: 'MethodObserved',
      path,
      method,
    };
    const responseStatusObservation: IStatusObserved = {
      type: 'StatusObserved',
      path,
      method,
      statusCode,
    };
    observations.push(pathObservation, methodObservation, responseStatusObservation);

    // security
    const additionalHeadersToIgnore = new Set<string>();
    const additionalQueryParamsToIgnore = new Set<string>();
    const { security } = config;
    if (security) {
      const unsecuredPathsSet = new Set(security.unsecuredPaths);
      let foundSecurityInRequest = !unsecuredPathsSet.has(path);
      if (security.type === 'apiKey') {
        if (security.in === 'cookie') {
          if (cookies[security.name]) {
            foundSecurityInRequest = true;
          }
        } else if (security.in === 'header') {
          const headerName = security.name.toLowerCase();
          if (requestHeaders[headerName]) {
            foundSecurityInRequest = true;
            additionalHeadersToIgnore.add(headerName);
          }
        } else if (security.in === 'query') {
          if (queryParameters[security.name]) {
            foundSecurityInRequest = true;
            additionalQueryParamsToIgnore.add(security.name);
          }
        }
      } else if (security.type === 'basic' || security.type === 'bearer') {
        const name = 'authorization';
        if (requestHeaders[name]) {
          foundSecurityInRequest = true;
          additionalHeadersToIgnore.add(name);
        }
      }

      if (foundSecurityInRequest) {
        const securityObservation: ISecurityObserved = {
          type: 'SecurityObserved',
          method,
          path,
          statusCode,
          security,
        };

        observations.push(securityObservation);
      }
    }

    // header parameters
    //@TODO make useful observations from the transport headers (caching, compression, browser security etc.)
    Object.keys(requestHeaders)
      .filter((headerName: string) => !headerBlacklist.has(headerName) && !additionalHeadersToIgnore.has(headerName))
      .forEach((headerName: string) => {
        const value = requestHeaders[headerName];
        const observation: IRequestParameterObserved = {
          type: 'RequestParameterObserved',
          method,
          path,
          statusCode,
          name: headerName,
          source: ParameterSource.header,
          valueShape: flattenJavascriptValueToList(value),
        };
        observations.push(observation);
      });

    // query parameters
    Object.keys(queryParameters)
      .filter((queryParameterName: string) => !additionalQueryParamsToIgnore.has(queryParameterName))
      .forEach((queryParameterName: string) => {
        const value = queryParameters[queryParameterName];
        const observation: IRequestParameterObserved = {
          type: 'RequestParameterObserved',
          method,
          path,
          statusCode,
          name: queryParameterName,
          source: ParameterSource.query,
          valueShape: flattenJavascriptValueToList(value),
        };
        observations.push(observation);
      });

    // path parameters
    Object.keys(pathParameters)
      .forEach((pathParameterName: string) => {
        const value = pathParameters[pathParameterName];
        const observation: IRequestParameterObserved = {
          type: 'RequestParameterObserved',
          method,
          path,
          statusCode,
          name: pathParameterName,
          source: ParameterSource.path,
          valueShape: flattenJavascriptValueToList(value),
        };
        observations.push(observation);
      });

    // request body
    const requestContentType = requestHeaders['content-type'];
    if (requestContentType) {
      const requestBodyObservation: IRequestBodyObserved = {
        type: 'RequestBodyObserved',
        method,
        path,
        statusCode,
        contentType: requestContentType.toString(),
        bodyShape: flattenJavascriptValueToList(request.body),
      };

      observations.push(requestBodyObservation);
    }

    // response headers
    Object.keys(responseHeaders)
      .filter((x: string) => !headerBlacklist.has(x))
      .forEach((responseHeaderKey: string) => {
        const value = responseHeaders[responseHeaderKey] as string;
        const responseHeaderObservation: IResponseHeaderObserved = {
          type: 'ResponseHeaderObserved',
          method,
          path,
          statusCode,
          name: responseHeaderKey,
          valueShape: flattenJavascriptValueToList(value),
        };
        observations.push(responseHeaderObservation);
      });

    // response cookies
    const responseCookie = responseHeaders['set-cookie'];
    if (responseCookie) {
      const parsedCookie = parse((responseCookie as string[]).join(';'));
      Object.keys(parsedCookie)
        .forEach((cookieKey: string) => {
          const cookieValue = parsedCookie[cookieKey];
          const responseCookieObservation: IResponseCookieObserved = {
            type: 'ResponseCookieObserved',
            method,
            path,
            statusCode,
            name: cookieKey,
            valueShape: flattenJavascriptValueToList(cookieValue),
          };
          observations.push(responseCookieObservation);
        });
    }

    // response body
    const responseContentType = responseHeaders['content-type'];
    if (responseContentType) {
      const responseBodyObservation: IResponseBodyObserved = {
        type: 'ResponseBodyObserved',
        method,
        path,
        statusCode,
        contentType: responseContentType.toString(),
        bodyShape: flattenJavascriptValueToList(response.body),
      };

      observations.push(responseBodyObservation);
    }

    return observations;
  }
}

export {
  InteractionsToObservations,
};
