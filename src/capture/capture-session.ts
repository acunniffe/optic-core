import { EventEmitter } from 'events';

export interface ICaptureSessionConfig {
  tasks: ICaptureSessionTask[]
}

interface ICaptureSessionTask {
  cmd: string
  setup: string
  teardown: string
}

class CaptureSession {
  private events: EventEmitter;

  constructor() {
    this.events = new EventEmitter();
  }

  public start(config: ICaptureSessionConfig) {
    this.events.emit('started', { config });
    config.tasks.reduce((results, task) => {
      results.push(task);
      return results;
    }, []);
  }
}

const session = new CaptureSession();
const config = {
  tasks: [],
};
session.start(config);

type PromiseFactory = () => Promise<any>;

function runSequentially(promiseFactories: PromiseFactory[]) {
  return promiseFactories
    .reduce(async (chain: Promise<any[]>, nextPromiseFactory: PromiseFactory) => {
      const results = await chain;
      const result = await nextPromiseFactory();

      return Promise.resolve([...results, result]);
    }, Promise.resolve([]));
}

export {
  CaptureSession,
  runSequentially
};
