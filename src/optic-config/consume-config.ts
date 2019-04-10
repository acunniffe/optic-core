import * as Joi from 'joi';
import { apiIdForKeyRegex, apiIdProcessor, cogentIdRegex, IApiId, semverOrLatestRegex, semverRegex } from './regexes';
import * as isValidPath from 'is-valid-path'

export const consumeConfig = Joi.object().pattern(apiIdForKeyRegex, Joi.object({
  version: Joi.string().required(),
  generate: Joi.object().pattern(cogentIdRegex, Joi.string()).optional().default({})
})).optional().default({})




export interface IApiDependencyConfig {
  api: IApiId
  version: string,
  cogentId: string,
  outputDirectory: string
}


interface IIntermediateDependencyInfo {
  version: string,
  generate: {[key: string]: string}
}
interface IntermediateApiDependency {
  [key: string]: IIntermediateDependencyInfo
}

export function consumeConfigPostProcessor(input: IntermediateApiDependency): IApiDependencyConfig[] {



  const dependenciesByApi: IApiDependencyConfig[][] = Object.entries(input).map( (entry) => {
    const apiId: IApiId = apiIdProcessor(entry[0])
    const generate = entry[1].generate
    const version: string = entry[1].version

    if (!semverOrLatestRegex.test(version)) {

      const idForError = `${(apiId.org ? apiId.org + '/' : '')}${apiId.id}`

      throw new Error(`Invalid version for ${idForError}: "${version}". Must be a semantic version ie '1.0.1' or 'latest'`)
    }


    return Object.entries(generate).map(target => {
      const cogentId = target[0]
      const outputDirectory: string = target[1]

      if (!isValidPath(outputDirectory)) {
        throw new Error(`Output directory '${outputDirectory}' for '${cogentId}' is not a valid file path.`)
      }

      return {
        api: apiId,
        version,
        cogentId,
        outputDirectory
      }
    })
  })

  //flatten
  return dependenciesByApi.reduce((acc, arr) => acc.concat(arr), [])
}
