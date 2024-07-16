export const FathymWorkerMessageTypes = {
  Init: 'init',
  Correlate: 'correlate',
  Ping: 'ping',
  Terminate: 'terminate',
};

export type FathymWorkerMessageTypes =
  (typeof FathymWorkerMessageTypes)[keyof typeof FathymWorkerMessageTypes];
