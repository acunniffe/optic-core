/*
 * - parse optic.yml
 * -- grab list of routes
 * - aggregate request and response pairs by [method, matched route, status code]
 */

import * as express from 'express';
import { Request } from 'express';
import * as expressHttpProxy from 'express-http-proxy';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import { IApiInteraction, IPathMatcher, packageRequest, pathToMatcher } from './common';

import * as EventEmitter from 'events';

interface IProxyServerOptions {
  paths: string[]
  proxyPort: number,
  targetHost: string
  targetPort: number
}

class ProxyServer extends EventEmitter {
  private httpInstance: http.Server;

  public start(options: IProxyServerOptions) {
    const pathMatchers: IPathMatcher[] = options.paths.map(pathToMatcher);
    const target = `http://${options.targetHost}:${options.targetPort}`;

    const server = express();
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded());
    const proxyMiddleware = expressHttpProxy(target, {
      userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request) => {
        const responseBody = JSON.parse(proxyResData.toString('utf8'));

        const request = packageRequest(userReq, pathMatchers);

        const sample: IApiInteraction = {
          request,
          response: {
            statusCode: proxyRes.statusCode,
            headers: proxyRes.headers,
            body: responseBody,
          },
        };
        this.emit('sample', sample);

        return proxyResData;
      },
    });
    server.use('/', (_req, _res, next) => {
      console.log('got req');
      next();
    }, proxyMiddleware);

    return new Promise<void>((resolve) => {
      this.httpInstance = server.listen(options.proxyPort, () => {
        console.log(`proxy listening on port ${options.proxyPort}`);
        resolve();
      });
    });
  }

  public stop() {
    this.httpInstance.close();
  }
}

export {
  ProxyServer,
};
