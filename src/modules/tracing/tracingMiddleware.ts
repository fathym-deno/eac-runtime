import { getPackageLogger } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function establishTracingMiddleware(
  traceReq: boolean,
  traceResp: boolean,
): EaCRuntimeHandler {
  return async (req, ctx) => {
    const logger = await getPackageLogger(import.meta);

    traceReq && logger.info({ req, ctx });

    const resp = await ctx.Next();

    if (resp) {
      const cloned = resp.clone();

      traceResp &&
        logger.info({
          body: await cloned.text(),
          resp,
          ctx,
        });
    }

    return resp;
  };
}
