import * as Joi from 'joi';
import { IApiMeta, ISessionManagerOptions } from './session-manager';

export const opticCoreVersion = '0.1.3-alpha.17';
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
    version: Joi.string().required(),
    security: securityConfigType,
    paths: Joi.array().items(Joi.string()).required(),
  });

export const opticInternalConfigType = Joi.object()
  .keys({
    version: Joi.string().default(opticCoreVersion),
    apiBaseUrl: Joi.string().default(apiBaseUrl),
    baseUrl: Joi.string().default(baseUrl),
  });

export const opticDependenciesType = Joi.array()
  .items(
    Joi.object().keys({
      id: Joi.string().required(),
      version: Joi.string().required(),
    }),
  );

export const opticConfigType = Joi.object()
  .keys({
    strategy: strategyConfigType,
    api: apiConfigType,
    optic: opticInternalConfigType
      .default({
        version: opticCoreVersion,
        apiBaseUrl,
        baseUrl,
      }),
    dependencies: opticDependenciesType.default([]),
  });

export function validate(config: object) {
  return Joi.validate(config, opticConfigType);
}

export interface IOpticApiDependency {
  id: string
  version: string
}

export interface IOpticYamlConfig extends ISessionManagerOptions {
  api: {
    id: string
    version: string
  } & IApiMeta
  optic: {
    version: string
    apiBaseUrl: string
    baseUrl: string
  }
  dependencies: IOpticApiDependency[]
}
