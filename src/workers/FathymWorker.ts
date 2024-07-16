import { FathymWorkerConfig } from './FathymWorkerConfig.ts';
import { FathymWorkerMessage, FathymWorkerMessageHandler } from './FathymWorkerMessage.ts';
import { FathymWorkerMessageTypes } from './FathymWorkerMessageTypes.ts';
import { correlateResult } from './waitForCorrelation.ts';

export abstract class FathymWorker<
  TConfig extends FathymWorkerConfig,
  TMessage extends FathymWorkerMessage,
  TMessageTypes extends FathymWorkerMessageTypes,
> {
  protected config: TConfig;

  protected workerMessageHandlers: {
    [K in TMessageTypes]: FathymWorkerMessageHandler | undefined;
  };

  constructor(protected worker: Worker) {
    this.config = {} as TConfig;

    this.workerMessageHandlers = this.loadWorkerMessageHandlers();

    this.sendMessage({
      Type: FathymWorkerMessageTypes.Ping,
      CorrelationID: crypto.randomUUID(),
    } as TMessage);

    worker.addEventListener('message', (event: MessageEvent<TMessage>) => {
      this.handleWorkerMessage(event);
    });
  }

  // deno-lint-ignore no-explicit-any
  protected handleInitConfig(): Promise<any> {
    return Promise.resolve();
  }

  protected handleWorkerInit(msg: FathymWorkerMessage<TConfig>): Promise<void> {
    this.config = msg.Payload || ({} as TConfig);

    return this.handleInitConfig().then((cfgRes) => {
      correlateResult(this.worker, msg.CorrelationID, cfgRes);
    });
  }

  protected async handleWorkerMessage(
    event: MessageEvent<TMessage>,
  ): Promise<void> {
    if (event.data.Type in this.workerMessageHandlers) {
      const handler = this.workerMessageHandlers[event.data.Type as TMessageTypes];

      await handler?.(event.data);
    }
  }

  protected handleWorkerPing(msg: FathymWorkerMessage): Promise<void> {
    correlateResult(this.worker, msg.CorrelationID, msg.Payload);

    return Promise.resolve();
  }

  protected handleWorkerTerminate(msg: TMessage): Promise<void> {
    // this.worker.terminate();

    correlateResult(this.worker, msg.CorrelationID, {});

    return Promise.resolve();
  }

  protected loadWorkerMessageHandlers(): typeof this.workerMessageHandlers {
    return {
      [FathymWorkerMessageTypes.Init]: this.handleWorkerInit.bind(this),
      [FathymWorkerMessageTypes.Ping]: this.handleWorkerPing.bind(this),
      [FathymWorkerMessageTypes.Terminate]: this.handleWorkerTerminate.bind(this),
    } as typeof this.workerMessageHandlers;
  }

  protected sendMessage(msg: TMessage): void {
    if (msg) {
      this.worker.postMessage(msg);
    }
  }
}
