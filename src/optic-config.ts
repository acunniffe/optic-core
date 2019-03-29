import * as Joi from 'joi';
import { IApiMeta, ISessionManagerOptions } from './session-manager';

export const opticCoreVersion = '0.1.4-alpha.1';
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

export const securityWhitelistConfigType = Joi.array()
  .items(Joi.string())
  .default([]);

export const securityConfigType = Joi.array()
  .items(
    Joi.object().keys({
      type: Joi.string().valid('basic', 'bearer').required(),
      unsecuredPaths: securityWhitelistConfigType,
    }),
    Joi.object().keys({
      type: Joi.string().valid('apiKey').required(),
      in: Joi.string().valid('cookie', 'query', 'header').required(),
      name: Joi.string().required().min(1),
      unsecuredPaths: securityWhitelistConfigType,
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
    segmentWriteKey: Joi.string().default('FAKE_SEGMENT_KEY'),
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

export interface IOpticInternalConfig {
  version: string
  apiBaseUrl: string
  baseUrl: string
  segmentWriteKey: string
}

export interface IOpticYamlConfig extends ISessionManagerOptions {
  api: {
    id: string
    version: string
  } & IApiMeta
  optic: IOpticInternalConfig
  dependencies: IOpticApiDependency[]
}
