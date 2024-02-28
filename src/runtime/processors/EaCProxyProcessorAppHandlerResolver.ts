import { EaCProxyProcessor, isEaCProxyProcessor, proxyRequest } from '../../src.deps.ts';
import { AppHandlerResolver } from './AppHandlerResolver.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';

export const EaCProxyProcessorAppHandlerResolver: AppHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCProxyProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCProxyProcessorAppHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCProxyProcessor;

    return Promise.resolve((req, _ctx) => {
      return proxyRequest(
        req,
        processor.ProxyRoot,
        appProcCfg.LookupConfig.PathPattern,
        processor.RedirectMode,
        !EAC_RUNTIME_DEV() ? processor.CacheControl : undefined,
        processor.ForceCache,
        // ctx.Info.remoteAddr.hostname,
      );
    });
  },
};
