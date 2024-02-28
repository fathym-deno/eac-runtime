import { IoCContainer } from '../../src.deps.ts';
import { EaCAIChatProcessorHandlerResolver } from '../processors/EaCAIChatProcessorHandlerResolver.ts';
import { EaCDFSProcessorHandlerResolver } from '../processors/EaCDFSProcessorHandlerResolver.ts';
import { EaCOAuthProcessorHandlerResolver } from '../processors/EaCOAuthProcessorHandlerResolver.ts';
import { EaCPreactAppProcessorHandlerResolver } from '../processors/EaCPreactAppProcessorHandlerResolver.ts';
import { EaCProxyProcessorHandlerResolver } from '../processors/EaCProxyProcessorHandlerResolver.ts';
import { EaCRedirectProcessorHandlerResolver } from '../processors/EaCRedirectProcessorHandlerResolver.ts';
import { UnknownEaCProcessorHandlerResolver } from '../processors/UnknownEaCProcessorHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymProcessorHandlerPlugin implements EaCRuntimePlugin {
  public Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymProcessorHandlerPlugin',
      IoC: new IoCContainer(),
    };

    config.IoC!.Register(() => EaCAIChatProcessorHandlerResolver, {
      Name: 'EaCAIChatProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    config.IoC!.Register(() => EaCDFSProcessorHandlerResolver, {
      Name: 'EaCDFSProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    config.IoC!.Register(() => EaCOAuthProcessorHandlerResolver, {
      Name: 'EaCOAuthProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    config.IoC!.Register(() => EaCPreactAppProcessorHandlerResolver, {
      Name: 'EaCPreactAppProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    config.IoC!.Register(() => EaCProxyProcessorHandlerResolver, {
      Name: 'EaCProxyProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    config.IoC!.Register(() => EaCRedirectProcessorHandlerResolver, {
      Name: 'EaCRedirectProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    config.IoC!.Register(() => UnknownEaCProcessorHandlerResolver, {
      Name: 'UnknownEaCProcessor',
      Type: config.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    return Promise.resolve(config);
  }
}
