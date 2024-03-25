import { EaCResponseProcessor, isEaCResponseProcessor } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCResponseProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCResponseProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCResponseProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCResponseProcessor;

    return Promise.resolve((_req, _ctx) => {
      return new Response(processor.Body, {
        status: processor.Status,
        headers: processor.Headers,
      });
    });
  },
};
