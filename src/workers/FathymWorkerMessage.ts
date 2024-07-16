export type FathymWorkerMessage<
  TPayload = Record<string, unknown> | undefined,
  TType = string,
> = {
  CorrelationID?: string;

  Payload?: TPayload;

  Type: TType;
};

export type FathymWorkerMessageHandler = (
  msg: FathymWorkerMessage,
) => Promise<void>;
