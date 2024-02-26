import { IS_BUILDING } from '../constants.ts';
import { EaCRuntimeConfig } from '../runtime/config/EaCRuntimeConfig.ts';

export async function startServer(config: EaCRuntimeConfig): Promise<void> {
  const runtime = config.Runtime(config);

  await runtime.Configure();

  if (!IS_BUILDING) {
    await Deno.serve(config.Server, (req, info) => runtime.Handle(req, info))
      .finished;
  }
}
