import { Counter, IApiInteraction, pathToMatcher } from './common';
import { IOpticCliOptions } from './entry-points/optic-cli';
import {
  InteractionsToObservations,
  IObserverConfig,
  IUnrecognizedUrlObserved,
  Observation,
} from './interactions-to-observations';

class ReportBuilder {
  buildReport(options: IOpticCliOptions, samples: IApiInteraction[]) {

    const pathMatcherList = options.paths.map(pathToMatcher);
    const config: IObserverConfig = {
      pathMatcherList,
      security: options.security
    };

    const observations = InteractionsToObservations.getObservations(samples, config);
    const unrecognizedUrlObservations = observations.filter((x: Observation) => x.type === 'UnrecognizedUrlObserved');
    const unrecognizedUrls = Counter.count<Observation>(unrecognizedUrlObservations, (x: IUnrecognizedUrlObserved) => x.url);
    if (unrecognizedUrls.size > 0) {
      console.log(`I observed ${unrecognizedUrls.size} interactions with paths I did not recognize:`);
      console.log([...unrecognizedUrls.entries()].map(([url, count]) => `${url}: ${count}`).join('\n'));
    }
    console.log(JSON.stringify(observations, null, 2));

    return observations;
  }
}

export {
  ReportBuilder,
};
