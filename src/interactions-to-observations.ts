import { getMatchingPath, IApiInteraction, IPathMatcher } from './common';
import * as pathMatch from 'path-match';
import { parse } from 'cookie';
import { ISecurityConfig } from './session-manager';
/*
interface IncomingHttpHeaders {
        'accept'?: string;
        'access-control-allow-origin'?: string;
        'access-control-allow-credentials'?: string;
        'access-control-expose-headers'?: string;
        'access-control-max-age'?: string;
        'access-control-allow-methods'?: string;
        'access-control-allow-headers'?: string;
        'accept-patch'?: string;
        'accept-ranges'?: string;
        'age'?: string;
        'allow'?: string;
        'alt-svc'?: string;
        'authorization'?: string;
        'cache-control'?: string;
        'connection'?: string;
        'content-disposition'?: string;
        'content-encoding'?: string;
        'content-language'?: string;
        'content-length'?: string;
        'content-location'?: string;
        'content-range'?: string;
        'content-type'?: string;
        'cookie'?: string;
        'date'?: string;
        'expect'?: string;
        'expires'?: string;
        'forwarded'?: string;
        'from'?: string;
        'host'?: string;
        'if-match'?: string;
        'if-modified-since'?: string;
        'if-none-match'?: string;
        'if-unmodified-since'?: string;
        'last-modified'?: string;
        'location'?: string;
        'pragma'?: string;
        'proxy-authenticate'?: string;
        'proxy-authorization'?: string;
        'public-key-pins'?: string;
        'range'?: string;
        'referer'?: string;
        'retry-after'?: string;
        'set-cookie'?: string[];
        'strict-transport-security'?: string;
        'trailer'?: string;
        'transfer-encoding'?: string;
        'tk'?: string;
        'upgrade'?: string;
        'user-agent'?: string;
        'vary'?: string;
        'via'?: string;
        'warning'?: string;
        'www-authenticate'?: string;
        [header: string]: string | string[] | undefined;
    }
 */
const headerBlacklist = new Set([
  'A-IM',
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Datetime',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'Connection',
  'Content-Type',
  'Content-Length',
  'Cookie',
  'Content-MD5',
  'Date',
  'Expect',
  'Expires',
  'ETag',
  'Forwarded',
  'From',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Last-Modified',
  'Location',
  'Max-Forwards',
  'Origin',
  'P3P',
  'Pragma',
  'Set-Cookie',
  'Server',
  'Timeout-Access',
  'Retry-After',
  'Referer',
  'TE',
  'User-Agent',
  'Upgrade',
  'Via',
  'Warning',

  'X-Requested-With',
  'DNT',
  'X-Forwarded-For',
  'X-Forwarded-Host',
  'X-Forwarded-Proto',
  'Front-End-Https',
  'X-Http-Method-Override',
  'X-Powered-By',
  'X-ATT-DeviceId',
  'X-Wap-Profile',
  'Proxy-Connection',
  'X-UIDH',
  'Save-Data',
].map(x => x.toLowerCase()));

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
  value: string | object | any[]
}

interface IInteractionContext {
  method: string
  path: string
  statusCode: number
}

interface IRequestBodyObserved extends IBaseObservation, IInteractionContext {
  type: 'RequestBodyObserved'
  contentType: string
  body: any
}

interface IResponseHeaderObserved extends IBaseObservation, IInteractionContext {
  type: 'ResponseHeaderObserved',
  name: string,
  value: string
}

interface IResponseCookieObserved extends IBaseObservation, IInteractionContext {
  type: 'ResponseCookieObserved',
  name: string,
  value: string
}

interface IResponseBodyObserved extends IBaseObservation, IInteractionContext {
  type: 'ResponseBodyObserved'
  contentType: string
  body: any
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
      let foundSecurityInRequest = false;
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
          value,
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
          value,
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
          value,
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
        body: request.body,
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
          value,
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
            value: cookieValue,
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
        body: response.body,
      };

      observations.push(responseBodyObservation);
    }

    return observations;
  }
}

export {
  InteractionsToObservations,
};
