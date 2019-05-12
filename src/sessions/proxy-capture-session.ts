import { EventEmitter } from 'events';
import { IApiInteraction } from '../common';
import { ProxyServer } from '../proxy-server';

interface IProxyCaptureSessionConfig {
  target: string
}

class ProxyCaptureSession {
  private readonly proxy = new ProxyServer();
  private readonly samples = [];
  public events: EventEmitter = new EventEmitter();

  public start(config: IProxyCaptureSessionConfig) {

    this.proxy.on('sample', this.handleSample);

    const { target } = config;

    return this.proxy
      .start({
        proxyPort: 30333,
        target,
      });
  }

  public stop() {
    this.proxy.stop();
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
  ProxyCaptureSession,
};
