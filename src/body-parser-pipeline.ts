import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { Express } from 'express';

export function addBodyParsers(app: Express) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.text({ type: '*/*' }));
  app.use(cookieParser());
}
