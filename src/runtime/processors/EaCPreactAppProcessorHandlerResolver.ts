import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCPreactAppProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, _appProcCfg) {
    // if (!isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
    //   throw new Deno.errors.NotSupported(
    //     'The provided processor is not supported for the EaCPreactAppProcessorHandlerResolver.',
    //   );
    // }

    // const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    return Promise.resolve((_req, _ctx) => {
      // const page = <App />;
      const html = 'Coming Soon'; //preactToString(page);

      return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    });
  },
};
