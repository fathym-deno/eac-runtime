import { EaCApplicationProcessorConfig } from '../processors/EaCApplicationProcessorConfig.ts';
import { EaCRuntime } from '../EaCRuntime.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeSetupConfig } from './EaCRuntimeSetupConfig.ts';

export type EaCRuntimeConfig = {
  ApplicationHandlerResolver: (
    appProcCfg: EaCApplicationProcessorConfig,
  ) => EaCRuntimeHandler;

  Runtime: (cfg: EaCRuntimeConfig) => EaCRuntime;

  Server: {
    StartRange?: [number, number];
  } & (Deno.ServeOptions | Deno.ServeTlsOptions);
} & EaCRuntimeSetupConfig;
