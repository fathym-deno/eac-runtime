import { delay } from '../src.deps.ts';
import { FathymWorkerMessage } from './FathymWorkerMessage.ts';
import { FathymWorkerMessageTypes } from './FathymWorkerMessageTypes.ts';

export function correlateResult(
  worker: Worker,
  correlationId?: string,
  result?: Record<string, unknown>,
): void;

export function correlateResult(
  socket: WebSocket,
  correlationId?: string,
  result?: Record<string, unknown>,
): void;

export function correlateResult(
  worker: Worker | WebSocket,
  correlationId?: string,
  result?: Record<string, unknown>,
): void {
  if (worker && correlationId) {
    const sender = (worker as Worker).postMessage
      ? (worker as Worker).postMessage
      // deno-lint-ignore no-explicit-any
      : (msg: any) => (worker as WebSocket).send(JSON.stringify(msg));

    sender({
      Type: FathymWorkerMessageTypes.Correlate,
      CorrelationID: correlationId,
      Payload: result,
    } as FathymWorkerMessage);
  }
}

export type PromisifyProperties<T> = {
  // deno-lint-ignore ban-types
  [K in keyof T]: T[K] extends Function ? T[K] : Promise<T[K]>;
};

// export type PromisifyFunction<T> = {
//   [K in keyof T]: T[K] extends Function ? Promise<T[K]> : T[K];
// }

// export type Promisify<T> = {
//   [K in keyof T]: T[K] extends Function ? Promise<T[K]> : Promise<T[K]>;
// }

export function waitForCorrelation(
  worker: Worker,
  correlationId: string,
): Promise<Record<string, unknown> | undefined> {
  return new Promise((resolve) => {
    worker.addEventListener(
      'message',
      function handleCorrelation(event: MessageEvent<FathymWorkerMessage>) {
        if (
          event.data.Type === FathymWorkerMessageTypes.Correlate &&
          event.data.CorrelationID === correlationId
        ) {
          worker.removeEventListener('message', handleCorrelation);

          resolve(event.data.Payload);
        }
      },
    );
  });
}

export function waitForCorrelationSync(
  worker: Worker,
  correlationId: string,
): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined = undefined;

  worker.addEventListener(
    'message',
    function handleCorrelation(event: MessageEvent<FathymWorkerMessage>) {
      if (
        event.data.Type === FathymWorkerMessageTypes.Correlate &&
        event.data.CorrelationID === correlationId
      ) {
        worker.removeEventListener('message', handleCorrelation);

        result = event.data.Payload;
      }
    },
  );

  // while (!result) {
  //   setTimeout(() => {
  //     console.log('corelating');
  //   }, 10);
  // }

  return result;
}

export function waitForPing(worker: Worker): Promise<void> {
  return new Promise((resolve) => {
    worker.addEventListener(
      'message',
      function waitForPing(ev: MessageEvent<FathymWorkerMessage>) {
        if (ev.data.Type === FathymWorkerMessageTypes.Ping) {
          delay(1000).then(() => {
            resolve();

            worker.removeEventListener('message', waitForPing);
          });
        }
      },
    );
  });
}
