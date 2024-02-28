import { AppHandlerResolver } from './AppHandlerResolver.ts';

export const EaCPreactAppProcessorAppHandlerResolver: AppHandlerResolver = {
  Resolve(_ioc, _appProcCfg) {
    // const processor = appProcCfg.Application
    // .Processor as EaCPreactAppProcessor;
    return Promise.resolve((_req, _ctx) => {
      // const page = <App />;
      const html = 'Coming Soon'; //preactToString(page);

      return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    });
  },
};
