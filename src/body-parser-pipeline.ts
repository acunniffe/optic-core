import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { Express } from 'express';

export function addBodyParsers(app: Express) {
  const limit = '100mb';
  app.use(bodyParser.json({ limit }));
  app.use(bodyParser.urlencoded({ limit, extended: true }));
  app.use(bodyParser.text({ limit, type: '*/*' }));
  app.use(cookieParser());
}
