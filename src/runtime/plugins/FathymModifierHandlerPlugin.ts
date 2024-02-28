import { IoCContainer } from '../../src.deps.ts';
import { EaCDenoKVCacheModifierHandlerResolver } from '../modifiers/EaCDenoKVCacheModifierHandlerResolver.ts';
import { EaCKeepAliveModifierHandlerResolver } from '../modifiers/EaCKeepAliveModifierHandlerResolver.ts';
import { EaCOAuthModifierHandlerResolver } from '../modifiers/EaCOAuthModifierHandlerResolver.ts';
import { EaCTracingModifierHandlerResolver } from '../modifiers/EaCTracingModifierHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymModifierHandlerPlugin implements EaCRuntimePlugin {
  public Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymModifierHandlerPlugin',
      IoC: new IoCContainer(),
    };

    config.IoC!.Register(() => EaCDenoKVCacheModifierHandlerResolver, {
      Name: 'EaCDenoKVCacheModifierDetails',
      Type: config.IoC!.Symbol('ModifierHandlerResolver'),
    });

    config.IoC!.Register(() => EaCKeepAliveModifierHandlerResolver, {
      Name: 'EaCKeepAliveModifierDetails',
      Type: config.IoC!.Symbol('ModifierHandlerResolver'),
    });

    config.IoC!.Register(() => EaCOAuthModifierHandlerResolver, {
      Name: 'EaCOAuthModifierDetails',
      Type: config.IoC!.Symbol('ModifierHandlerResolver'),
    });

    config.IoC!.Register(() => EaCTracingModifierHandlerResolver, {
      Name: 'EaCTracingModifierDetails',
      Type: config.IoC!.Symbol('ModifierHandlerResolver'),
    });

    return Promise.resolve(config);
  }
}
