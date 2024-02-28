import { IoCContainer } from '../../src.deps.ts';
import { EaCAIChatProcessorHandlerResolver } from '../processors/EaCAIChatProcessorHandlerResolver.ts';
import { EaCDFSProcessorHandlerResolver } from '../processors/EaCDFSProcessorHandlerResolver.ts';
import { EaCOAuthProcessorHandlerResolver } from '../processors/EaCOAuthProcessorHandlerResolver.ts';
import { EaCPreactAppProcessorHandlerResolver } from '../processors/EaCPreactAppProcessorHandlerResolver.ts';
import { EaCProxyProcessorHandlerResolver } from '../processors/EaCProxyProcessorHandlerResolver.ts';
import { EaCRedirectProcessorHandlerResolver } from '../processors/EaCRedirectProcessorHandlerResolver.ts';
import { UnknownEaCProcessorHandlerResolver } from '../processors/UnknownEaCProcessorHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymProcessorHandlerPlugin implements EaCRuntimePlugin {
  public Build(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymProcessorHandlerPlugin',
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(() => EaCAIChatProcessorHandlerResolver, {
      Name: 'EaCAIChatProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCDFSProcessorHandlerResolver, {
      Name: 'EaCDFSProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCOAuthProcessorHandlerResolver, {
      Name: 'EaCOAuthProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCPreactAppProcessorHandlerResolver, {
      Name: 'EaCPreactAppProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCProxyProcessorHandlerResolver, {
      Name: 'EaCProxyProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCRedirectProcessorHandlerResolver, {
      Name: 'EaCRedirectProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => UnknownEaCProcessorHandlerResolver, {
      Name: 'UnknownEaCProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    return Promise.resolve(pluginConfig);
  }
}
