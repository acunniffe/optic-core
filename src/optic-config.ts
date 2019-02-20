import * as Joi from 'joi';
import { IApiMeta, ISessionManagerOptions } from './session-manager';

export const opticCoreVersion = '0.1.3-alpha.13';
const baseUrl = 'https://app.useoptic.com';
const apiBaseUrl = 'https://api.useoptic.com';


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

export const apiConfigType = Joi.object()
  .keys({
    id: Joi.string().required(),
    security: securityConfigType,
    paths: Joi.array().items(Joi.string()).required(),
  });

export const opticInternalConfigType = Joi.object()
  .keys({
    version: Joi.string().default(opticCoreVersion),
    apiBaseUrl: Joi.string().default(apiBaseUrl),
    baseUrl: Joi.string().default(baseUrl),
  });

export const opticConfigType = Joi.object()
  .keys({
    strategy: strategyConfigType.required(),
    api: apiConfigType.required(),
    optic: opticInternalConfigType
      .default({
        version: opticCoreVersion,
        apiBaseUrl,
        baseUrl,
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
