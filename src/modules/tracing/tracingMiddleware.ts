import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function establishTracingMiddleware(
  traceReq: boolean,
  traceResp: boolean,
): EaCRuntimeHandler {
  return async (req, ctx) => {
    traceReq && console.log({ req, ctx });

    const resp = await ctx.next();

    if (resp) {
      const cloned = resp.clone();

      traceResp &&
        console.log({
          body: await cloned.text(),
          resp,
          ctx,
        });
    }

    return resp;
  };
}
