import * as express from 'express';
import { Request, Response } from 'express';
import { addBodyParsers } from './body-parser-pipeline';


const config = {
  port: 9000,
};

const server = express();
addBodyParsers(server);
server.use('/', (req: Request, res: Response) => {
  const { method, path /*body, query, params, headers*/ } = req;
  res
    .status(Math.random() < 0.1 ? 400 : 200)
    .header('x-hhh-1', 'hv1')
    .header('x-hhh-2', 'hv2')
    .cookie('kkk1', 'vvv1')
    .cookie('kkk2', 'vvv2')
    .json({ method, path /*headers, params, query, body*/ });
});
server.listen(config.port);
