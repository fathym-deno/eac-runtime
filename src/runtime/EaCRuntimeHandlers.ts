import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { KnownMethod } from './KnownMethod.ts';

export type EaCRuntimeHandlers = {
  [K in KnownMethod]?: EaCRuntimeHandler;
};
