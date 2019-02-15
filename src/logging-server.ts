import * as express from 'express';
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

class LoggingServer extends EventEmitter {
  private httpInstances: http.Server[] = [];
  private requests: Map<RequestId, IRequestMetadata> = new Map();
  private responses: Map<RequestId, IResponseMetadata> = new Map();

  public start(options: ILoggingServerOptions) {
    console.log('starting logging servers...');
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
      console.log('request logger');
      console.log(_req);
      next();
    });
    requestLoggingServer.all('/*', (req: Request, res: Response) => {
      const id = idGenerator.next().value.toString();

      const request = packageRequest(req);
      this.requests.set(id, request);

      res.contentType('text/plain').send(id);
    });

    return new Promise((resolve, reject) => {
      const instance = requestLoggingServer
        .listen(options.requestLoggingServerPort, () => {
          this.httpInstances.push(instance);
          console.log(`listening for requests on port ${options.requestLoggingServerPort}`);
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
      console.log('response logger');
      console.log(_req);
      next();
    });
    responseLoggingServer.post('/request/:requestId/status/:statusCode', (req: Request, res: Response) => {
      const id = req.params.requestId;
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
          console.log(`listening for responses on port ${options.responseLoggingServerPort}`);
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
