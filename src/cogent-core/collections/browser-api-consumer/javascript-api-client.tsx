import { apiToClient } from './index';
import { ICogentEngineProps } from '../../../cogent-engines/cogent-engine';

const JavascriptApiClient = ({ data, api, artifact }: ICogentEngineProps) => {
  return apiToClient(data.apiSnapshot, api, artifact);
};

export {
  JavascriptApiClient,
};
