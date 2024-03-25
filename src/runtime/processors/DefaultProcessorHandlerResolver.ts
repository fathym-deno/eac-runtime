import {
  IoCContainer,
  isEaCAIChatProcessor,
  isEaCAPIProcessor,
  isEaCDFSProcessor,
  isEaCOAuthProcessor,
  isEaCPreactAppProcessor,
  isEaCProxyProcessor,
  isEaCRedirectProcessor,
  isEaCResponseProcessor,
  isEaCTailwindProcessor,
} from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCRuntimeEaC } from '../EaCRuntimeEaC.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export class DefaultProcessorHandlerResolver implements ProcessorHandlerResolver {
  public async Resolve(
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EaCRuntimeEaC,
  ) {
    let toResolveName: string = '';

    if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCRedirectProcessor';
    } else if (isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCPreactAppProcessor';
    } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCProxyProcessor';
    } else if (isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCOAuthProcessor';
    } else if (isEaCAPIProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCAPIProcessor';
    } else if (isEaCAIChatProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCAIChatProcessor';
    } else if (isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCDFSProcessor';
    } else if (isEaCResponseProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCResponseProcessor';
    } else if (isEaCTailwindProcessor(appProcCfg.Application.Processor)) {
      toResolveName = 'EaCTailwindProcessor';
    } else {
      toResolveName = 'UnknownEaCProcessor';
    }

    const resolver = await ioc.Resolve<ProcessorHandlerResolver>(
      ioc.Symbol('ProcessorHandlerResolver'),
      toResolveName,
    );

    return await resolver.Resolve(ioc, appProcCfg, eac);
  }
}
