import { EaCRuntimeConfig } from '../runtime/config/EaCRuntimeConfig.ts';


export async function startServer(config: EaCRuntimeConfig): Promise<void> {
  const runtime = config.Runtime(config);

  await runtime.Configure();

  await Deno.serve(config.Server, (req, info) => runtime.Handle(req, info)).finished;
}
