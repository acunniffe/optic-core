import * as express from 'express';
import { Request } from 'express';
import * as expressHttpProxy from 'express-http-proxy';
import * as http from 'http';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as debug from 'debug';
import { IApiInteraction, packageRequest } from './common';

import * as EventEmitter from 'events';

interface IProxyServerOptions {
  proxyPort: number,
  targetHost: string
  targetPort: number
}

const debugProxyServerVerbose = debug('optic-debug:server:proxy-server');
const debugProxyServer = debug('optic:server:proxy-server');

class ProxyServer extends EventEmitter {
  private httpInstance: http.Server;

  public start(options: IProxyServerOptions) {
    const target = `http://${options.targetHost}:${options.targetPort}`;

    const server = express();
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: true}));
    server.use(cookieParser());

    const proxyMiddleware = expressHttpProxy(target, {
      userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request) => {
        let responseBody = proxyResData.toString('utf8');
        try {
          responseBody = JSON.parse(responseBody);
        } catch (e) {

        }

        const request = packageRequest(userReq);

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
      debugProxyServerVerbose('got request');
      next();
    }, proxyMiddleware);

    return new Promise<void>((resolve, reject) => {
      this.httpInstance = server
        .listen(options.proxyPort, () => {
          debugProxyServer(`proxy listening on port ${options.proxyPort}`);
          debugProxyServer(`proxy forwarding requests to ${options.targetHost}:${options.targetPort}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  public stop() {
    this.httpInstance.close();
  }
}

export {
  ProxyServer,
};
