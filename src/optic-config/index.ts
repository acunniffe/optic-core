import * as Joi from 'joi';
import { ISessionManagerOptions } from '../session-manager';
import { consumeConfig, consumeConfigPostProcessor, IApiDependencyConfig } from './consume-config';
import { documentConfig, documentConfigPostProcessor, IDocumentConfig } from './document-config';


export const OpticYamlConfigSchema = Joi.object({
  document: documentConfig.optional(),
  consume: consumeConfig.optional().default({}),
  optic: Joi.object({
    apiBaseUrl: Joi.string(),
    baseUrl: Joi.string(),
  }).optional().default({
    apiBaseUrl: 'https://api.useoptic.com',
    baseUrl: 'https://app.useoptic.com',
  }),
}).optional().default({});


export interface IOpticInternalConfig {
  apiBaseUrl: string
  baseUrl: string
}

export interface IOpticYamlConfig {
  document?: IDocumentConfig,
  dependencies: IApiDependencyConfig[],
  optic: IOpticInternalConfig
}

export interface IOpticYamlConfigParseTry {
  isSuccess: boolean,
  config?: IOpticYamlConfig,
  error?: any
}

export function parseOpticYaml(input: object): IOpticYamlConfigParseTry {

  const { error, value } = Joi.validate(input, OpticYamlConfigSchema);

  if (error) {
    return { isSuccess: false, error: error.toString() };
  }

  const parseValue = <any>value;

  try {
    return {
      isSuccess: true,
      config: {
        document: (parseValue.document) ? documentConfigPostProcessor(parseValue.document) : undefined,
        dependencies: consumeConfigPostProcessor(parseValue.consume || {}),
        optic: parseValue.optic
      },
    };
  } catch (e) {
    return {
      isSuccess: false,
      error: e.message,
    };
  }

}

export function toSessionConfig(config: IOpticYamlConfig): ISessionManagerOptions {

  if (!config.document.run_tests && !config.document.har) {
    throw new Error('Please tell Optic how to run your tests by adding a \'run_tests\' field to \'document\' in optic.yml');
  }

  return {
    api: {
      paths: config.document.paths,
      security: config.document.security,
    },
    strategy: {
      type: 'logging',
      commandToRun: config.document.run_tests,
    },
  };
}
