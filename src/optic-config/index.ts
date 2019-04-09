import * as Joi from 'joi';
import { IOpticInternalConfig } from '../optic-config';
import { consumeConfig, consumeConfigPostProcessor, IApiDependencyConfig } from './consume-config';
import { documentConfig, documentConfigPostProcessor, IDocumentConfig } from './document-config';


export const OpticYamlConfigSchema = Joi.object({
  document: documentConfig.optional(),
  consume: consumeConfig.optional().default({}),
  optic: Joi.object().optional()
}).optional().default({})


export interface IOpticYamlConfig {
  document?: IDocumentConfig,
  dependencies: IApiDependencyConfig[],
  optic?: IOpticInternalConfig
}

export interface IOpticYamlConfigParseTry {
  isSuccess: boolean,
  config?: IOpticYamlConfig,
  error?: any
}

export function parseOpticYaml(input: object): IOpticYamlConfigParseTry  {

  const {error, value} = Joi.validate(input, OpticYamlConfigSchema)

  if (error) {
    return {isSuccess: false, error: error.toString()}
  }

  try {
    return {
      isSuccess: true,
      config: {
        document: documentConfigPostProcessor(value.document),
        dependencies: consumeConfigPostProcessor(value.consume),
      }
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: e.message
    }
  }


}
