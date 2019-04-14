import * as React from 'react';
import {
  Callback,
  FileSystemRenderer,
  IFileSystemRendererFolder,
} from '../cogent-core/react/file-system-renderer';
import { IApiKeySecurity, IBasicAuthSecurity, IBearerTokenSecurity } from '../session-manager';
import { cogentComponentRegistry } from './cogent-component-registry';


export interface ICogentOptions {
  outputDirectory: string
  api: IOpticApiIdentifier
  artifact: ICogentArtifactIdentifier
}

type ApiSecurityDefinition = IBearerTokenSecurity | IApiKeySecurity | IBasicAuthSecurity
type ApiPath = string
type ApiRequestMethod = string
type ApiContentType = string
type ApiStatusCode = number

export interface IApiRequestParameter {
  name: string
}

export interface IApiRequestBody {
  contentType: ApiContentType
  schema: IApiBodySchema
}

export interface IApiBodySchema {
  asJsonSchema: object
}

export interface IApiResponseBody {
  contentType: ApiContentType
  schema: IApiBodySchema
}

export interface IApiRequest {
  headerParameters: IApiRequestParameter[]
  pathParameters: IApiRequestParameter[]
  queryParameters: IApiRequestParameter[]
  bodies: IApiRequestBody[]
}

export interface IApiResponse {
  statusCode: ApiStatusCode
  contentType: ApiContentType
  bodies: IApiResponseBody[]
}

export interface IApiEndpoint {
  path: ApiPath
  method: ApiRequestMethod
  securityDefinitions: ApiSecurityDefinition[]
  request: IApiRequest | null
  responses: IApiResponse[]
}

export interface IApiSnapshot {
  securityDefinitions: ApiSecurityDefinition[]
  endpoints: IApiEndpoint[]
}

export interface ICogentEngineData {
  apiSnapshot: IApiSnapshot
}

export interface ICogentEngineConfig {
  data: ICogentEngineData
  options: ICogentOptions
  callback: Callback<IFileSystemRendererFolder>
}

export interface IOpticApiIdentifier {
  id: string
  version: string
}

export interface ICogentArtifactIdentifier {
  id: string
  version: string
}

export interface ICogentEngineProps {
  data: ICogentEngineData
  api: IOpticApiIdentifier
  artifact: ICogentArtifactIdentifier
}

class CogentEngine {
  public run(config: ICogentEngineConfig) {
    const renderer = new FileSystemRenderer();

    const TargetComponent = cogentComponentRegistry[config.options.artifact.id]
    if (!TargetComponent) {
      throw new Error(`No generator found for '${config.options.artifact.id}'. Request one here https://calendly.com/optic-onboarding/optic-request-a-new-generated`)
    }

    renderer.renderSync(
      <TargetComponent
        data={config.data}
        api={config.options.api}
        artifact={config.options.artifact}
      />,
      { callback: config.callback },
    );
  }
}

export {
  CogentEngine,
};
