import { IS_BUILDING } from '../constants.ts';
import { EaCRuntime } from '../runtime/EaCRuntime.ts';
import { EaCRuntimeConfig } from '../runtime/config/EaCRuntimeConfig.ts';

export async function startServer(
  config: EaCRuntimeConfig,
  configure?: (rt: EaCRuntime) => Promise<void>,
): Promise<void> {
  const runtime = config.Runtime(config);

  await runtime.Configure(configure);

  if (!IS_BUILDING) {
    await Deno.serve(config.Server, (req, info) => runtime.Handle(req, info))
      .finished;
  }
}
