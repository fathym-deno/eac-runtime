import { FathymWorkerConfig } from './FathymWorkerConfig.ts';
import { FathymWorkerMessage } from './FathymWorkerMessage.ts';
import { FathymWorkerMessageTypes } from './FathymWorkerMessageTypes.ts';
import { waitForCorrelation, waitForPing } from './waitForCorrelation.ts';

export class FathymWorkerClient<
  TConfig extends FathymWorkerConfig,
  // deno-lint-ignore no-explicit-any
  TMessage extends FathymWorkerMessage = FathymWorkerMessage<any>,
> {
  protected worker: Worker;

  constructor(workerPath: string) {
    this.worker = new Worker(workerPath, { type: 'module' });
  }

  public FireAndForget<TPayload = undefined>(
    msg: TMessage & { Payload?: TPayload },
  ) {
    msg.CorrelationID ??= crypto.randomUUID();

    this.worker.postMessage(msg);
  }

  public async Send<
    TResult = Record<string, unknown> | undefined,
    TPayload = undefined,
  >(msg: TMessage & { Payload?: TPayload }): Promise<TResult> {
    this.FireAndForget<TPayload>(msg);

    const result = await waitForCorrelation(this.worker, msg.CorrelationID!);

    return result as TResult;
  }

  public Stream<
    TResult = Record<string, unknown> | undefined,
    TPayload = undefined,
  >(_msg: TMessage & { Payload?: TPayload }): Promise<TResult> {
    throw new Deno.errors.NotSupported('Streaming is still in development.');
  }

  public async Start(
    config: TConfig,
  ): Promise<Record<string, unknown> | undefined> {
    await waitForPing(this.worker);

    return await this.Send<
      Record<string, unknown> | undefined,
      Record<string, unknown>
    >({
      Type: FathymWorkerMessageTypes.Init,
      CorrelationID: crypto.randomUUID(),
      Payload: config,
    } as TMessage);
  }
}
