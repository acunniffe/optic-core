// load optic.yml, check auth status, client version, etc.
/*
- setup user stuff
- document an api (using optic.yml in cwd)
-- start servers, run tests, stop servers
--
- publish a documented api
 */


import { exec, ExecOptions } from 'child_process';
import { IApiInteraction, IRequestMetadata, IResponseMetadata, passThrough } from '../common';
import { LoggingServer } from '../logging-server';
import { ProxyServer } from '../proxy-server';
import { ReportBuilder } from '../report-builder';

export interface IOpticCliOptions {
  paths: string[]
  commandToRun: string
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

  public useProxyServer() {
    const proxy = new ProxyServer();
    proxy.on('sample', this.handleSample.bind(this));

    proxy.start({
      paths: this.options.paths,
      proxyPort: 30333,
      targetHost: 'localhost',
      targetPort: 9000,
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
      timeout: 5000,
    };

    const task = new Promise<boolean>((resolve) => {
      console.log(`running $${command}`);
      exec(command, taskOptions, (err, stdout, stderr) => {
        console.log(stdout);
        if (err) {
          console.error(err);
          console.error(stderr);
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
      paths: this.options.paths,
      requestLoggingServerPort: 30334,
      responseServerLoggingPort: 30335,
    });

    return this
      .runCommand(this.options.commandToRun)
      .then(passThrough(() => {
        loggingServer.stop();
      }));
  }
}

const cliOptions = {
  paths: [
    '/users',
    '/users/:userId',
    '/users/:userId/profile',
    '/users/:userId/preferences',
  ],
  commandToRun: '"./httpie-examples.sh"',
};
const cli = new OpticCli(cliOptions);
cli
  .useProxyServer()
  .then((successful: boolean) => {
    console.log(`I observed ${cli.samples.length} API interactions!`);
    if (successful) {
      console.log('generating API spec...');

      return new ReportBuilder().buildReport(cliOptions, cli.samples);
    } else {
      console.log('tests failed :(');
    }
  });

export function groupByKey<T>(keyFn: (T) => string) {
  return (acc: Map<string, T[]>, value: T) => {
    const key = keyFn(value);
    acc.set(key, [...(acc.get(key) || []), value]);

    return acc;
  };
}

export function getKey(interaction: IApiInteraction) {
  const { method, path } = interaction.request;
  const { statusCode, headers } = interaction.response;

  return `${method}|${path}|${statusCode}|${headers['content-type']}`;
}

/*
function recordSchemas(request: IRequestMetadata, response: IResponseMetadata) {
  const key = getKey(request, response);
  keys.add(key);
  // set or merge
  const requestSchemaComponents = {
    headers: request.headers,
    body: request.body,
    pathParameters: request.pathParameters,
    queryParameters: request.queryParameters,
  };
  const responseSchemaComponents = {
    headers: response.headers,
    body: response.body,
  };

  saveSample(requestSchemas, key, generateSchema(requestSchemaComponents));
  saveSample(responseSchemas, key, generateSchema(responseSchemaComponents));
  //console.log(util.inspect(requestSchemas, options));
  //console.log(util.inspect(responseSchemas, options));
}

function addSample(sample: IApiInteraction) {
  samples.push(sample);
  //console.log(util.inspect(sample, options));
  recordSchemas(sample.request, sample.response);
}


function onComplete() {
  for (const key of keys) {
    const inferredRequestSchema = DefaultSchemaMerger.getMergedSchema(...requestSchemas.get(key));
    console.log(util.inspect(inferredRequestSchema, options));
  }
}*/
