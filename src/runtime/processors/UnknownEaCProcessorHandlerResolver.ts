import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const UnknownEaCProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    // TODO(mcgear): Create a better unknown app handler

    return Promise.resolve((_req, ctx) => {
      return new Response(
        'Hello, world!\n' +
          JSON.stringify(appProcCfg, null, 2) +
          '\n' +
          JSON.stringify(ctx.Runtime.Info.remoteAddr, null, 2),
      );
    });
  },
};
