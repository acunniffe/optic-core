import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import * as debug from 'debug';
import * as kill from 'tree-kill';

const logCli = debug('optic:cli');
export interface ICommandSessionConfig {
  command: string
  environmentVariables: NodeJS.ProcessEnv
}
class CommandSession {
  private child: ChildProcess;
  private isRunning: boolean = false;

  start(config: ICommandSessionConfig) {
    const taskOptions: SpawnOptions = {
      env: {
        ...process.env,
        ...config.environmentVariables,
      },
      shell: true,
      cwd: process.cwd(),
    };

    logCli(`running $ ${config.command}`);
    logCli(`in ${taskOptions.cwd}`);

    this.isRunning = true;

    this.child = spawn(config.command, taskOptions);

    this.child.on('exit', () => {
      logCli(`finished $ ${config.command}`);
      this.isRunning = false;
    });

    return this.child;
  }

  stop() {
    logCli(`stopping command`);
    if (this.isRunning) {
      kill(this.child.pid);
      this.isRunning = false;
    }
  }
}

export {
  CommandSession,
};
