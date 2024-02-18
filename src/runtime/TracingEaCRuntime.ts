import { DefaultEaCRuntime } from './DefaultEaCRuntime.ts';
import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { tracingMiddleware } from './middleware/tracingMiddleware.ts';

export class TracingEaCRuntime extends DefaultEaCRuntime {
  protected constructPipeline(ctx: EaCRuntimeContext): EaCRuntimeHandler[] {
    const pipeline = super.constructPipeline(ctx);

    pipeline.unshift(tracingMiddleware);

    return pipeline;
  }
}
