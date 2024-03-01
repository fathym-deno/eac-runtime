import { EaCProxyProcessor, isEaCProxyProcessor, proxyRequest } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';

export const EaCProxyProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCProxyProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCProxyProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCProxyProcessor;

    return Promise.resolve((req, _ctx) => {
      return proxyRequest(
        req,
        processor.ProxyRoot,
        appProcCfg.ResolverConfig.PathPattern,
        processor.RedirectMode,
        !EAC_RUNTIME_DEV() ? processor.CacheControl : undefined,
        processor.ForceCache,
        // ctx.Info.remoteAddr.hostname,
      );
    });
  },
};
