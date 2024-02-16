import { DefaultEaCRuntime } from './DefaultEaCRuntime.ts';
import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export const tracingMiddleware: EaCRuntimeHandler = async (req, ctx) => {
  console.log({ req, ctx });

  const resp = await ctx.next();

  if (resp) {
    const cloned = resp.clone();

    console.log({
      body: await cloned.text(),
      resp,
      ctx,
    });
  }

  return resp;
};

export class TracingEaCRuntime extends DefaultEaCRuntime {
  protected constructPipeline(ctx: EaCRuntimeContext): EaCRuntimeHandler[] {
    const pipeline = super.constructPipeline(ctx);

    pipeline.unshift(tracingMiddleware);

    return pipeline;
  }
}
