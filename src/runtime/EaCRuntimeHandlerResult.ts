import { EaCRuntimeHandlers } from './EaCRuntimeHandlers.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export type EaCRuntimeHandlerResult =
  | EaCRuntimeHandler
  | EaCRuntimeHandlers
  | (EaCRuntimeHandler | EaCRuntimeHandlers)[];
