import { apiToClient } from '../cogent-core/collections/browser-api-consumer';
import { ICogentEngineProps } from './cogent-engine';

const JavascriptApiClient = ({ data, api, artifact }: ICogentEngineProps) => {
  return apiToClient(data.apiSnapshot, api, artifact);
};

export {
  JavascriptApiClient,
};
