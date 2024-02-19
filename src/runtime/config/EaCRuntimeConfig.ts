import { EaCApplicationProcessorConfig } from '../EaCApplicationProcessorConfig.ts';
import { EaCRuntime } from '../EaCRuntime.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';

export type EaCRuntimeConfig = {
  ApplicationHandlerResolver: (
    appProcCfg: EaCApplicationProcessorConfig
  ) => EaCRuntimeHandler;

  EaC?: EaCRuntimeEaC;

  Middleware: EaCRuntimeHandler[];

  Runtime: (cfg: EaCRuntimeConfig) => EaCRuntime;

  Server: {
    StartRange?: [number, number];
  } & (Deno.ServeOptions | Deno.ServeTlsOptions);
};
