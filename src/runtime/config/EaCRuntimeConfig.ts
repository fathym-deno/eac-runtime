import { EaCRuntime } from '../EaCRuntime.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { EaCRuntimeSetupConfig } from './EaCRuntimeSetupConfig.ts';

export type EaCRuntimeConfig<TEaC = EaCRuntimeEaC> = {
  Runtime: (cfg: EaCRuntimeConfig<TEaC>) => EaCRuntime<TEaC>;

  Server: {
    StartRange?: [number, number];
  } & (Deno.ServeOptions | Deno.ServeTlsOptions);
} & EaCRuntimeSetupConfig<TEaC>;
