import { Counter, IApiInteraction, IPathMatcher, pathToMatcher } from './common';
import { ISessionManagerOptions } from './session-manager';
import {
  InteractionsToObservations,
  IObserverConfig, IPathObserved,
  IUnrecognizedUrlObserved,
  Observation,
} from './interactions-to-observations';

export interface IOpticReport {
  messages: string[]
  observations: Observation[]
}

class ReportBuilder {
  public buildReport(options: ISessionManagerOptions, samples: IApiInteraction[]): IOpticReport {
    const messages = [];
    if (samples.length === 0) {
      messages.push('I did not observe any API interactions :(');
    } else {
      messages.push(`I observed ${samples.length} API interactions!`);
    }

    const pathMatcherList = options.paths.map(pathToMatcher);
    const config: IObserverConfig = {
      pathMatcherList,
      security: options.security[0],
    };

    const observations = InteractionsToObservations.getObservations(samples, config);

    const recognizedPathObservations = observations.filter((x: Observation) => x.type === 'PathObserved');
    const recognizedPaths = new Set(recognizedPathObservations.map((x: IPathObserved) => x.path));

    const uncoveredPaths = new Set(
      pathMatcherList
        .filter(({ path }: IPathMatcher) => !recognizedPaths.has(path))
        .map(({ path }: IPathMatcher) => path),
    );

    if (uncoveredPaths.size > 0) {
      const uncoveredPathList = [...uncoveredPaths].map((path: string) => ` - ${path}`).join('\n');
      messages.push(`I noticed that the following paths from your configuration were not interacted with:
${uncoveredPathList}`);
    }

    const unrecognizedUrlObservations = observations.filter((x: Observation) => x.type === 'UnrecognizedUrlObserved');
    const unrecognizedUrls = Counter.count<Observation>(unrecognizedUrlObservations, (x: IUnrecognizedUrlObserved) => x.url);

    if (unrecognizedUrls.size > 0) {
      const unrecognizedUrlList = [...unrecognizedUrls.entries()].map(([url, count]) => ` - ${url}: ${count}`).join('\n');
      messages.push(`I observed ${unrecognizedUrls.size} interactions with paths I did not recognize:
${unrecognizedUrlList}`);
    }


    return {
      messages,
      observations,
    };
  }
}

export {
  ReportBuilder,
};
