import { EaCRedirectProcessor, isEaCRedirectProcessor, redirectRequest } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCRedirectProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCRedirectProcessorHandlerResolver.',
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
