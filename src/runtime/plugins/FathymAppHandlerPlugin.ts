import { IoCContainer } from '../../src.deps.ts';
import { EaCAIChatProcessorAppHandlerResolver } from '../processors/EaCAIChatProcessorAppHandlerResolver.ts';
import { EaCDFSProcessorAppHandlerResolver } from '../processors/EaCDFSProcessorAppHandlerResolver.ts';
import { EaCOAuthProcessorAppHandlerResolver } from '../processors/EaCOAuthProcessorAppHandlerResolver.ts';
import { EaCPreactAppProcessorAppHandlerResolver } from '../processors/EaCPreactAppProcessorAppHandlerResolver.ts';
import { EaCProxyProcessorAppHandlerResolver } from '../processors/EaCProxyProcessorAppHandlerResolver.ts';
import { EaCRedirectProcessorAppHandlerResolver } from '../processors/EaCRedirectProcessorAppHandlerResolver.ts';
import { UnknownEaCProcessorAppHandlerResolver } from '../processors/UnknownEaCProcessorAppHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymAppHandlerPlugin implements EaCRuntimePlugin {
  public Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymAppHandlerPlugin',
      IoC: new IoCContainer(),
    };

    config.IoC!.Register(() => EaCAIChatProcessorAppHandlerResolver, {
      Name: 'EaCAIChatProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    config.IoC!.Register(() => EaCDFSProcessorAppHandlerResolver, {
      Name: 'EaCDFSProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    config.IoC!.Register(() => EaCOAuthProcessorAppHandlerResolver, {
      Name: 'EaCOAuthProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    config.IoC!.Register(() => EaCPreactAppProcessorAppHandlerResolver, {
      Name: 'EaCPreactAppProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    config.IoC!.Register(() => EaCProxyProcessorAppHandlerResolver, {
      Name: 'EaCProxyProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    config.IoC!.Register(() => EaCRedirectProcessorAppHandlerResolver, {
      Name: 'EaCRedirectProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    config.IoC!.Register(() => UnknownEaCProcessorAppHandlerResolver, {
      Name: 'UnknownEaCProcessor',
      Type: config.IoC!.Symbol('AppHandlerResolver'),
    });

    return Promise.resolve(config);
  }
}
