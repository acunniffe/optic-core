import { EventEmitter} from 'events';
import { IApiInteraction } from '../common';
import { LoggingServer } from '../logging-server';


class LoggingCaptureSession {
  private readonly loggingServer = new LoggingServer();
  private readonly samples = [];
  public events: EventEmitter = new EventEmitter();

  public start() {
    this.loggingServer.on('sample', this.handleSample);

    return this.loggingServer
      .start({
        requestLoggingServerPort: 30334,
        responseLoggingServerPort: 30335,
      });
  }

  public stop() {
    this.loggingServer.stop();
  }

  public getSamples() {
    return this.samples;
  }

  private handleSample = (sample: IApiInteraction) => {
    this.events.emit('sample', sample);
    this.samples.push(sample);
  };
}

export {
  LoggingCaptureSession,
};
