import { DefaultEaCRuntime } from '../runtime/DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from '../runtime/config/EaCRuntimeConfig.ts';


export async function startServer(config: EaCRuntimeConfig): Promise<void> {
  await Deno.serve(config.Server, config.Runtime.Handle).finished;
}
