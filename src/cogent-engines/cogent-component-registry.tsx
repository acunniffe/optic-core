import { JavascriptApiClient } from '../cogent-core/collections/browser-api-consumer/javascript-api-client';
import { OASGenerator } from '../cogent-core/collections/oas3/oas-generate';

export const cogentComponentRegistry = {
  'js-client': JavascriptApiClient,
  'oas': OASGenerator
}
