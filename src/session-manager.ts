import { spawn, SpawnOptions } from 'child_process';
import * as debug from 'debug';
import { IApiInteraction, passThrough } from './common';
import { LoggingServer } from './logging-server';
import { ProxyServer } from './proxy-server';

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
  commandToRun: string
  targetHost: string
  targetPort: number
}

export interface ILoggingDocumentationConfig {
  type: 'logging'
  commandToRun: string
}

export type IDocumentationConfig = IProxyDocumentationConfig | ILoggingDocumentationConfig

export interface IApiMeta {
  paths: string[]
  security?: ISecurityConfig[]
}

export interface ISessionManagerOptions {
  strategy: IDocumentationConfig;
  api: IApiMeta
}

const logCli = debug('optic:cli');
const debugCliVerbose = debug('optic-debug:cli');

class SessionManager {
  public samples: IApiInteraction[];
  private options: ISessionManagerOptions;

  constructor(options: ISessionManagerOptions) {
    this.options = options;
    this.samples = [];
  }

  private handleSample(sample: IApiInteraction) {
    debugCliVerbose('got sample');
    this.samples.push(sample);
  }

  public useProxyServer(config: IProxyDocumentationConfig) {
    const proxy = new ProxyServer();
    proxy.on('sample', this.handleSample.bind(this));

    const { targetHost, targetPort } = config;

    return proxy
      .start({
        proxyPort: 30333,
        targetHost,
        targetPort,
      })
      .then(() => {
        return this.runCommand(config.commandToRun);
      })
      .then(passThrough(() => {
        proxy.stop();
      }));
  }

  private runCommand(command: string) {
    const taskOptions: SpawnOptions = {
      env: {
        ...process.env,
        'OPTIC_SERVER_LISTENING': 'yes',
      },
      shell: true,
      cwd: process.cwd(),
    };

    const task = new Promise<boolean>((resolve) => {
      logCli(`running $ ${command}`);
      logCli(`in ${taskOptions.cwd}`);
      const child = spawn(command, taskOptions);
      child.stdout.on('data', function(data) {
        process.stdout.write(data);
      });

      child.stderr.on('data', function(data) {
        process.stderr.write(data);
      });

      child.on('exit', function(code) {
        logCli(`Your command exited with code ${code.toString()}`);
        resolve(code === 0);
      });
    });

    return task;
  }

  public useLoggingServer(config: ILoggingDocumentationConfig) {
    const loggingServer = new LoggingServer();
    loggingServer.on('sample', this.handleSample.bind(this));

    return loggingServer
      .start({
        requestLoggingServerPort: 30334,
        responseLoggingServerPort: 30335,
      })
      .then(() => {
        return this.runCommand(config.commandToRun);
      })
      .then(passThrough(() => {
        loggingServer.stop();
      }));
  }

  public run() {
    const { strategy } = this.options;
    if (strategy.type === 'logging') {
      return this.useLoggingServer(strategy);
    } else if (strategy.type === 'proxy') {
      return this.useProxyServer(strategy);
    }

    return Promise.reject(new Error(`unknown strategy ${JSON.stringify(strategy)}`));
  }
}

export {
  SessionManager,
};
