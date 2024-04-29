import { EaCRuntimeContext } from './EaCRuntimeContext.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerResult } from './EaCRuntimeHandlerResult.ts';
import { EaCRuntimeHandlers } from './EaCRuntimeHandlers.ts';
import { KnownMethod } from './KnownMethod.ts';

export class EaCRuntimeHandlerPipeline {
  public pipeline: (EaCRuntimeHandler | EaCRuntimeHandlers)[];

  constructor() {
    this.pipeline = [];
  }

  public Append(...handlers: (EaCRuntimeHandlerResult | undefined)[]): void {
    if (handlers) {
      this.pipeline.push(
        ...handlers
          .filter((h) => h)
          .flatMap((h) => {
            return Array.isArray(h) ? h! : [h!];
          }),
      );
    }
  }

  public Execute(
    request: Request,
    ctx: EaCRuntimeContext,
    index = -1,
  ): Response | Promise<Response> {
    ctx.Next = async (req) => {
      req ??= request;

      ++index;

      if (this.pipeline.length > index) {
        let handler: EaCRuntimeHandler | EaCRuntimeHandlers | undefined = this.pipeline[index];

        if (handler && typeof handler !== 'function') {
          handler = handler[req.method.toUpperCase() as KnownMethod];

          // if (!handler) {
          //   throw new Deno.errors.NotFound(
          //     `There is not handler configured for the '${req.method}' method.`
          //   );
          // }
        }

        const response = await handler?.(req, ctx);

        if (response) {
          return response;
        } else {
          return this.Execute(req, ctx, index);
        }
      } else {
        throw new Error('A Response must be returned from the pipeline.');
      }
    };

    return ctx.Next(request);
  }

  public Prepend(...handlers: (EaCRuntimeHandlerResult | undefined)[]): void {
    if (handlers) {
      this.pipeline.unshift(
        ...handlers
          .filter((h) => h)
          .flatMap((h) => {
            return Array.isArray(h) ? h! : [h!];
          }),
      );
    }
  }
}
