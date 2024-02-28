import { EaCRedirectProcessor, isEaCRedirectProcessor, redirectRequest } from '../../src.deps.ts';
import { AppHandlerResolver } from './AppHandlerResolver.ts';

export const EaCRedirectProcessorAppHandlerResolver: AppHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCRedirectProcessorAppHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCRedirectProcessor;

    return Promise.resolve((_req, _ctx) => {
      return redirectRequest(
        processor.Redirect,
        processor.PreserveMethod,
        processor.Permanent,
      );
    });
  },
};
