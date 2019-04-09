import * as Joi from 'joi';
import { apiIdProcessor, IApiId, pathProcessor, semverRegex } from './regexes';

export const documentConfig = Joi.object().keys({
  id: Joi.string().required(),
  version: Joi.string().optional(),
  run_tests: Joi.string().required(),
  paths: Joi.array().items(Joi.string()).optional().default([]),
});

export interface IDocumentConfig {
  api: IApiId
  version?: string
  run_tests: string
  paths: string[]
}

export function documentConfigPostProcessor(input: any): IDocumentConfig {

  const apiId = apiIdProcessor(input.id)
  const processedPaths = input.paths.map(i => pathProcessor(i))

  if (!semverRegex.test(input.version)) {
    throw new Error(`Invalid version: "${input.version}". Must be a semantic version ie 1.0.1`)
  }

  //for now throw out the extra method info
  const tempProcessedPaths = processedPaths.map(i => i.path)

  const distinct = (array: any[]) =>
    array.filter((value, index, self) => self.indexOf(value) === index)

  return {
    api: apiId,
    version: input.version,
    run_tests: input.run_tests,
    paths: distinct(tempProcessedPaths)
  }
}
