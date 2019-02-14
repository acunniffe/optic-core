import { exec, ExecOptions } from 'child_process';
import * as fs from 'fs';
import * as util from 'util';
import { IApiInteraction, passThrough } from '../common';
import { Observation } from '../interactions-to-observations';
import { LoggingServer } from '../logging-server';
import { ObservationsToGraph } from '../observations-to-graph';
import { ProxyServer } from '../proxy-server';
import { ReportBuilder } from '../report-builder';

export interface IBaseSecurity {
  type: string
}

export interface IBasicAuthSecurity extends IBaseSecurity {
  type: 'basic'
}

export interface IBearerTokenSecurity extends IBaseSecurity {
  type: 'bearer'
}

export interface IApiKeySecurity extends IBaseSecurity {
  type: 'apiKey';
  in: 'header' | 'cookie' | 'query';
  name: string;
}

export type ISecurityConfig = IBasicAuthSecurity | IBearerTokenSecurity | IApiKeySecurity

export interface IProxyDocumentationConfig {
  type: 'proxy'
  targetHost: string
  targetPort: number
}

export interface ILoggingDocumentationConfig {
  type: 'logging'
}

export type IDocumentationConfig = IProxyDocumentationConfig | ILoggingDocumentationConfig

export interface IOpticCliOptions {
  documentationStrategy: IDocumentationConfig;
  paths: string[]
  commandToRun: string
  security?: ISecurityConfig
}

class OpticCli {
  public samples: IApiInteraction[];
  private options: IOpticCliOptions;

  constructor(options: IOpticCliOptions) {
    this.options = options;
    this.samples = [];
  }

  private handleSample(sample: IApiInteraction) {
    console.log('got sample');
    this.samples.push(sample);
  }

  public useProxyServer(config: IProxyDocumentationConfig) {
    const proxy = new ProxyServer();
    proxy.on('sample', this.handleSample.bind(this));

    const { targetHost, targetPort } = config;
    proxy.start({
      proxyPort: 30333,
      targetHost,
      targetPort,
    });

    return this
      .runCommand(this.options.commandToRun)
      .then(passThrough(() => {
        proxy.stop();
      }));
  }

  private runCommand(command: string) {
    const taskOptions: ExecOptions = {
      env: {
        ...process.env,
        OPTIC_SERVER: 'listening',
      },
      cwd: process.cwd(),
      timeout: 60 * 1000,
    };

    const task = new Promise<boolean>((resolve) => {
      console.log(`running $${command}`);
      exec(command, taskOptions, (err, stdout, stderr) => {
        console.log({ stdout });
        if (err) {
          console.error(err);
          console.error({ stderr });
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });

    return task;
  }

  public useLoggingServer() {
    const loggingServer = new LoggingServer();
    loggingServer.on('sample', this.handleSample.bind(this));
    loggingServer.start({
      requestLoggingServerPort: 30334,
      responseServerLoggingPort: 30335,
    });

    return this
      .runCommand(this.options.commandToRun)
      .then(passThrough(() => {
        loggingServer.stop();
      }));
  }

  public run() {
    const { documentationStrategy } = this.options;
    if (documentationStrategy.type === 'logging') {
      return this.useLoggingServer();
    } else if (documentationStrategy.type === 'proxy') {
      return this.useProxyServer(documentationStrategy);
    }
    throw new Error(`unknown documentationStrategy ${documentationStrategy}`);
  }
}

const cliOptions: IOpticCliOptions = {
  paths: [
    '/users',
    '/users/:userId',
    '/users/:userId/profile',
    '/users/:userId/preferences',
    '/users/:userId/followers/:followerId',
  ],
  security: {
    type: 'apiKey',
    in: 'header',
    name: 'Token',
  },
  documentationStrategy: {
    type: 'proxy',
    targetPort: 9000,
    targetHost: 'localhost',
  },
  commandToRun: '"./httpie-examples.sh"',
};
const cli = new OpticCli(cliOptions);
cli
  .run()
  .then((successful: boolean) => {
    console.log(`I observed ${cli.samples.length} API interactions!`);
    if (successful) {
      console.log('generating API spec...');

      const observations = new ReportBuilder().buildReport(cliOptions, cli.samples);

      return observations;
    } else {
      throw new Error(`The command was not successful :(`);
    }
  })
  .then((observations: Observation[]) => {
    const observationsToGraph = new ObservationsToGraph();
    observationsToGraph.interpretObservations(observations);
    console.log(util.inspect(observationsToGraph.graph, { depth: 5, compact: false, colors: true }));
    console.log('\n visualize graphviz.txt on http://www.webgraphviz.com/');
    fs.writeFileSync('./graphviz.txt', observationsToGraph.graph.toGraphViz());
  });

