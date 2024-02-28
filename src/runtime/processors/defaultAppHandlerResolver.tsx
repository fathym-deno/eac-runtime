import {
  isEaCAIChatProcessor,
  isEaCDFSProcessor,
  isEaCOAuthProcessor,
  // isEaCPreactAppProcessor,
  isEaCProxyProcessor,
  isEaCRedirectProcessor,
  // preactToString,
} from '../../src.deps.ts';
import { defaultDFSFileHandlerResolver, DFSFileHandler } from './defaultDFSFileHandlerResolver.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';
import { AppHandlerResolver } from './AppHandlerResolver.ts';

export const defaultAppHandlerResolver: AppHandlerResolver = {
  async Resolve(ioc, appProcCfg) {
    let toResolveName: string = '';

    if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCRedirectProcessor';
      // } else if (isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      //   toResolveName = 'EaCPreactAppProcessor';
    } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCProxyProcessor';
    } else if (isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCOAuthProcessor';
    } else if (isEaCAIChatProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCAIChatProcessor';
    } else if (isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCDFSProcessor';
    } else {
      toResolveName = 'UnknownEaCProcessor';
    }

    const resolver = await ioc.Resolve<AppHandlerResolver>(
      ioc.Symbol('AppHandlerResolver'),
      toResolveName,
    );

    const handler = await resolver.Resolve(ioc, appProcCfg);

    return handler;
  },
};
