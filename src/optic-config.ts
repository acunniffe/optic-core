import * as Joi from 'joi';
import { IApiMeta, ISessionManagerOptions } from './session-manager';

export const opticCoreVersion = '0.1.3-alpha.8';

export const opticYamlFileName = 'optic.yml';

export const strategyConfigType = Joi.alternatives(
  Joi.object().keys({
    type: Joi.string().valid('logging').required(),
    commandToRun: Joi.string().required(),
  }),
  Joi.object().keys({
    type: Joi.string().valid('proxy'),
    commandToRun: Joi.string().required(),
    targetHost: Joi.string().required(),
    targetPort: Joi.number().required(),
  }),
);

export const securityConfigType = Joi.array()
  .items(
    Joi.object().keys({
      type: Joi.string().valid('basic', 'bearer').required(),
    }),
    Joi.object().keys({
      type: Joi.string().valid('apiKey').required(),
      in: Joi.string().valid('cookie', 'query', 'header').required(),
      name: Joi.string().required().min(1),
    }),
  );

export const opticConfigType = Joi.object()
  .keys({
    strategy: strategyConfigType,
    api: Joi.object().keys({
      id: Joi.string().required(),
      security: securityConfigType,
      paths: Joi.array().items(Joi.string()).required(),
    }).required(),
    optic: Joi.object().keys({
      version: Joi.string().default(opticCoreVersion).required(),
      apiBaseUrl: Joi.string().default('https://api.useoptic.com').required(),
      baseUrl: Joi.string().default('https://useoptic.com').required(),
    }),
  });

export function validate(config: object) {
  return Joi.validate(config, opticConfigType);
}

export interface IOpticYamlConfig extends ISessionManagerOptions {
  api: {
    id: string
  } & IApiMeta
  optic: {
    version: string
    apiBaseUrl: string
    baseUrl: string
  }
}
