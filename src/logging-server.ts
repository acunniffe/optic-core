import * as express from 'express';
import * as debug from 'debug';
import { Request, Response } from 'express';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import { IApiInteraction, IRequestMetadata, IResponseMetadata, packageRequest } from './common';
import * as EventEmitter from 'events';

export const idGeneratorFactory = function* () {
  let id = 0;
  while (true) {
    yield id;
    id = id + 1;
  }
};

export type RequestId = string;

export interface ILoggingServerOptions {
  requestLoggingServerPort: number
  responseLoggingServerPort: number
}

const debugLoggingServer = debug('optic:server:logging-server');
const debugLoggingServerVerbose = debug('optic-debug:server:logging-server');

class LoggingServer extends EventEmitter {
  private httpInstances: http.Server[] = [];
  private requests: Map<RequestId, IRequestMetadata> = new Map();
  private responses: Map<RequestId, IResponseMetadata> = new Map();

  public start(options: ILoggingServerOptions) {
    debugLoggingServer('starting logging servers...');
    const promises = [
      this.startRequestLogging(options),
      this.startResponseLogging(options),
    ];

    return Promise.all(promises);
  }

  private startRequestLogging(options: ILoggingServerOptions) {
    const idGenerator = idGeneratorFactory();

    const requestLoggingServer = express();
    requestLoggingServer.use(bodyParser.json());
    requestLoggingServer.use(bodyParser.urlencoded());
    requestLoggingServer.use(cookieParser());
    requestLoggingServer.use((_req, _res, next) => {
      debugLoggingServerVerbose('receiving request');
      next();
    });
    requestLoggingServer.all('/', (req: Request, res: Response) => {
      const id = idGenerator.next().value.toString();

      const request = packageRequest(req);
      this.requests.set(id, request);

      res.contentType('text/plain').send(id);
    });

    return new Promise((resolve, reject) => {
      const instance = requestLoggingServer
        .listen(options.requestLoggingServerPort, () => {
          this.httpInstances.push(instance);
          debugLoggingServer(`listening for requests on port ${options.requestLoggingServerPort}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  private startResponseLogging(options: ILoggingServerOptions) {
    const responseLoggingServer = express();
    responseLoggingServer.use(bodyParser.json());
    responseLoggingServer.use(bodyParser.urlencoded());
    responseLoggingServer.use((_req, _res, next) => {
      debugLoggingServerVerbose('receiving response');
      next();
    });
    responseLoggingServer.post('/interactions/:interactionId/status/:statusCode', (req: Request, res: Response) => {
      const id = req.params.interactionId;
      if (!this.requests.has(id)) {
        return res.status(404).json({ message: `no request with id ${id} has been logged yet` });
      }
      if (this.responses.has(id)) {
        return res.status(400).json({ message: `already got a response for id ${id}` });
      }
      const response: IResponseMetadata = {
        body: req.body,
        headers: req.headers,
        statusCode: req.params.statusCode,
      };
      this.responses.set(id, response);

      const request = this.requests.get(id);
      const sample: IApiInteraction = {
        request,
        response,
      };

      this.emit('sample', sample);

      return res.status(204).end();
    });

    return new Promise((resolve, reject) => {
      const instance = responseLoggingServer
        .listen(options.responseLoggingServerPort, () => {
          this.httpInstances.push(instance);
          debugLoggingServer(`listening for responses on port ${options.responseLoggingServerPort}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  public stop() {
    this.httpInstances
      .forEach((httpInstance: http.Server) => httpInstance.close());
  }
}

export {
  LoggingServer,
};
