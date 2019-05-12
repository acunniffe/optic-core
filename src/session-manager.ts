import { spawn, SpawnOptions } from 'child_process';
import * as debug from 'debug';
import { IApiInteraction, passThrough } from './common';
import { LoggingServer } from './logging-server';
import { ProxyServer } from './proxy-server';
import * as kill from 'tree-kill';
import * as EventEmitter from 'events';

export interface IBaseSecurity {
  type: string
  unsecuredPaths: string[]
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

class SessionManagerEmitter extends EventEmitter {
}

class SessionManager {
  public samples: IApiInteraction[];

  private options: ISessionManagerOptions;

  private events: SessionManagerEmitter = new SessionManagerEmitter();

  private stopHandler: () => void;

  constructor(options: ISessionManagerOptions) {
    this.options = options;
    this.samples = [];

    this.events.on('sample', ((sample: IApiInteraction) => {
      debugCliVerbose('got sample');
      this.samples.push(sample);
    }));
  }

  public onSample(callback: (sample: IApiInteraction) => void) {
    this.events.on('sample', callback);
  }

  public useProxyServer(config: IProxyDocumentationConfig) {
    const proxy = new ProxyServer();
    proxy.on('sample', (sample: IApiInteraction) => this.events.emit('sample', sample));

    const { targetHost, targetPort } = config;

    return proxy
      .start({
        proxyPort: 30333,
        target: `http://${targetHost}:${targetPort}`,
      })
      .then(() => {
        return this.runCommand(config.commandToRun);
      })
      .then(passThrough(() => {
        proxy.stop();
      }));
  }

  public stop() {
    if (this.stopHandler) {
      this.stopHandler();
    }
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

      let killed = false;

      this.stopHandler = () => {
        kill(child.pid);
        killed = true;
        resolve(true);
      };

      child.stdout.on('data', function(data) {
        process.stdout.write(data);
      });

      child.stderr.on('data', function(data) {
        process.stderr.write(data);
      });

      child.on('exit', function(code) {
        if (!killed) {
          logCli(`Your command exited with code ${(code).toString()}`);
          resolve(code === 0);
        }
      });
    });

    return task;
  }

  public useLoggingServer(config: ILoggingDocumentationConfig) {
    const loggingServer = new LoggingServer();
    loggingServer.on('sample', (sample: IApiInteraction) => this.events.emit('sample', sample));

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
