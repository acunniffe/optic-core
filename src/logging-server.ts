import * as express from 'express';
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import { IApiInteraction, IRequestMetadata, IResponseMetadata, packageRequest, pathToMatcher } from './common';
import * as EventEmitter from 'events';

const idGeneratorFactory = function* () {
  let id = 0;
  while (true) {
    yield id;
    id = id + 1;
  }
};

export type RequestId = string;

export interface ILoggingServerOptions {
  requestLoggingServerPort: number
  responseServerLoggingPort: number
  paths: string[]
}

class LoggingServer extends EventEmitter {
  private httpInstances: http.Server[];
  private requests: Map<RequestId, IRequestMetadata> = new Map();
  private responses: Map<RequestId, IResponseMetadata> = new Map();

  public start(options: ILoggingServerOptions) {
    this.startRequestLogging(options);
    this.startResponseLogging(options);
  }

  private startRequestLogging(options: ILoggingServerOptions) {
    const idGenerator = idGeneratorFactory();
    const pathMatchers = options.paths.map(pathToMatcher);

    const requestLoggingServer = express();
    requestLoggingServer.use(bodyParser.json());
    requestLoggingServer.use(bodyParser.urlencoded());

    requestLoggingServer.all('/', (req: Request, res: Response) => {
      const id = idGenerator.next().value.toString();

      const request = packageRequest(req, pathMatchers);
      this.requests.set(id, request);

      res.send(id);
    });

    const instance = requestLoggingServer.listen(options.requestLoggingServerPort);
    this.httpInstances.push(instance);
  }

  private startResponseLogging(options: ILoggingServerOptions) {
    const responseLoggingServer = express();
    responseLoggingServer.use(bodyParser.json());
    responseLoggingServer.use(bodyParser.urlencoded());

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

    const instance = responseLoggingServer.listen(options.responseServerLoggingPort);
    this.httpInstances.push(instance);
  }

  public stop() {
    this.httpInstances.forEach((httpInstance: http.Server) => httpInstance.close());
  }
}

export {
  LoggingServer,
};
