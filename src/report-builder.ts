// input is: ({Path}, AuthenticationSpec, [(Request, Response)])
// output is: [Fact] => Graph
// endpoints not in use
// endpoints not recognized

import { Counter, IApiInteraction } from './common';
import { getKey, groupByKey, IOpticCliOptions } from './entry-points/optic-cli';

class ReportBuilder {
  buildReport(options: IOpticCliOptions, samples: IApiInteraction[]) {
    const pathsSeen = Counter.count<IApiInteraction>(samples, x => x.request.path || '');
    const unrecognizedUrls = Counter.count<IApiInteraction>(samples.filter(x => !x.request.path), x => x.request.url);
    console.log('Here are how many interactions I observed for each path:');
    console.log(options.paths.map((path: string) => `${path}: ${pathsSeen.get(path) || 0}`).join('\n'));
    if (unrecognizedUrls.size > 0) {
      console.log(`I also observed ${unrecognizedUrls.size} interactions with paths I did not recognize:`);
      console.log([...unrecognizedUrls.entries()].map(([url, count]) => `${url}: ${count}`).join('\n'));
    }

    const samplesByKey = samples.reduce(groupByKey(getKey), new Map());
    console.log([...samplesByKey.keys()].join('\n'));
  }
}

export {
  ReportBuilder,
};
