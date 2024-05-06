import { IoCContainer } from '../../src.deps.ts';
import { DefaultProcessorHandlerResolver } from '../processors/DefaultProcessorHandlerResolver.ts';
import { EaCAPIProcessorHandlerResolver } from '../processors/EaCAPIProcessorHandlerResolver.ts';
import { EaCAIChatProcessorHandlerResolver } from '../processors/EaCAIChatProcessorHandlerResolver.ts';
import { EaCDFSProcessorHandlerResolver } from '../processors/EaCDFSProcessorHandlerResolver.ts';
import { EaCOAuthProcessorHandlerResolver } from '../processors/EaCOAuthProcessorHandlerResolver.ts';
import { EaCPreactAppProcessorHandlerResolver } from '../processors/EaCPreactAppProcessorHandlerResolver.tsx';
import { EaCProxyProcessorHandlerResolver } from '../processors/EaCProxyProcessorHandlerResolver.ts';
import { EaCRedirectProcessorHandlerResolver } from '../processors/EaCRedirectProcessorHandlerResolver.ts';
import { EaCResponseProcessorHandlerResolver } from '../processors/EaCResponseProcessorHandlerResolver.ts';
import { EaCTailwindProcessorHandlerResolver } from '../processors/EaCTailwindProcessorHandlerResolver.ts';
import { UnknownEaCProcessorHandlerResolver } from '../processors/UnknownEaCProcessorHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymProcessorHandlerPlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymProcessorHandlerPlugin',
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultProcessorHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCAIChatProcessorHandlerResolver, {
      Name: 'EaCAIChatProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCAPIProcessorHandlerResolver, {
      Name: 'EaCAPIProcessor',
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

    pluginConfig.IoC!.Register(() => EaCResponseProcessorHandlerResolver, {
      Name: 'EaCResponseProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCTailwindProcessorHandlerResolver, {
      Name: 'EaCTailwindProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => UnknownEaCProcessorHandlerResolver, {
      Name: 'UnknownEaCProcessor',
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    return Promise.resolve(pluginConfig);
  }
}
