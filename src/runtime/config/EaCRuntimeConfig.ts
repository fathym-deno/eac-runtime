import { EaCApplicationProcessorConfig } from '../EaCApplicationProcessorConfig.ts';
import { EverythingAsCode, EverythingAsCodeApplications } from '../../src.deps.ts';
import { EaCRuntime } from '../EaCRuntime.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export type EaCRuntimeConfig = {
  ApplicationHandlerResolver: (appProcCfg: EaCApplicationProcessorConfig) => EaCRuntimeHandler;

  EaC?: EverythingAsCode & EverythingAsCodeApplications;

  Middleware: EaCRuntimeHandler[];

  Runtime: (cfg: EaCRuntimeConfig) => EaCRuntime;

  Server: {
    StartRange?: [number, number];
  } & (Deno.ServeOptions | Deno.ServeTlsOptions);
};
