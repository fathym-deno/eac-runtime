import { EaCRuntime } from '../EaCRuntime.ts';
import { EaCRuntimeSetupConfig } from './EaCRuntimeSetupConfig.ts';

export type EaCRuntimeConfig = {
  Runtime: (cfg: EaCRuntimeConfig) => EaCRuntime;

  Server: {
    StartRange?: [number, number];
  } & (Deno.ServeOptions | Deno.ServeTlsOptions);
} & EaCRuntimeSetupConfig;
