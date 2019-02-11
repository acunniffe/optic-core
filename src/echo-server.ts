import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response } from 'express';


const config = {
  port: 9000,
};

const server = express();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded());
server.use('/', (req: Request, res: Response) => {
  const {method, path, body, query, params, headers} = req;
  res.json({method, path, headers, params, query, body});
});
server.listen(config.port);
