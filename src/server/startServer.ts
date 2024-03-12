import { IS_BUILDING } from '../constants.ts';
import { EaCRuntime } from '../runtime/EaCRuntime.ts';
import { EaCRuntimeConfig } from '../runtime/config/EaCRuntimeConfig.ts';

export async function startServer(
  config: EaCRuntimeConfig,
  configure?: (rt: EaCRuntime) => Promise<void>,
): Promise<void> {
  const runtime = config.Runtime(config);

  if (!IS_BUILDING) {
    await runtime.Configure(configure);

    await Deno.serve(config.Server, (req, info) => runtime.Handle(req, info))
      .finished;
  }
}
