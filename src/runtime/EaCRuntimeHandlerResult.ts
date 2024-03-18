import { EaCRuntimeHandlers } from './EaCRuntimeHandlers.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export type EaCRuntimeHandlerResult<
  TState = Record<string, unknown>,
  TData = Record<string, unknown>,
> =
  | EaCRuntimeHandler<TState, TData>
  | EaCRuntimeHandlers<TState, TData>
  | (EaCRuntimeHandler<TState, TData> | EaCRuntimeHandlers<TState, TData>)[];
