import { EaCRuntime } from '../EaCRuntime.ts';

export type EaCRuntimeConfig = {
  Runtime: EaCRuntime;
  
  Server: Deno.ServeOptions | Deno.ServeTlsOptions;
};
