import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { KnownMethod } from './KnownMethod.ts';

export type EaCRuntimeHandlers<
  TState = Record<string, unknown>,
  TData = Record<string, unknown>,
> = {
  [K in KnownMethod]?: EaCRuntimeHandler<TState, TData>;
};
