import { IoCContainer } from '../../src.deps.ts';
import { DefaultModifierMiddlewareResolver } from '../modifiers/DefaultModifierMiddlewareResolver.ts';
import { EaCBaseHREFModifierHandlerResolver } from '../modifiers/EaCBaseHREFModifierHandlerResolver.ts';
import { EaCDenoKVCacheModifierHandlerResolver } from '../modifiers/EaCDenoKVCacheModifierHandlerResolver.ts';
import { EaCJWTValidationModifierHandlerResolver } from '../modifiers/EaCJWTValidationModifierHandlerResolver.ts';
import { EaCKeepAliveModifierHandlerResolver } from '../modifiers/EaCKeepAliveModifierHandlerResolver.ts';
import { EaCMarkdownToHTMLModifierHandlerResolver } from '../modifiers/EaCMarkdownToHTMLModifierHandlerResolver.ts';
import { EaCOAuthModifierHandlerResolver } from '../modifiers/EaCOAuthModifierHandlerResolver.ts';
import { EaCStripeModifierHandlerResolver } from '../modifiers/EaCStripeModifierHandlerResolver.ts';
import { EaCTracingModifierHandlerResolver } from '../modifiers/EaCTracingModifierHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymModifierHandlerPlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymModifierHandlerPlugin',
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultModifierMiddlewareResolver, {
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCBaseHREFModifierHandlerResolver, {
      Name: 'EaCBaseHREFModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCDenoKVCacheModifierHandlerResolver, {
      Name: 'EaCDenoKVCacheModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCJWTValidationModifierHandlerResolver, {
      Name: 'EaCJWTValidationModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCKeepAliveModifierHandlerResolver, {
      Name: 'EaCKeepAliveModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCMarkdownToHTMLModifierHandlerResolver, {
      Name: 'EaCMarkdownToHTMLModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCOAuthModifierHandlerResolver, {
      Name: 'EaCOAuthModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCStripeModifierHandlerResolver, {
      Name: 'EaCStripeModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCTracingModifierHandlerResolver, {
      Name: 'EaCTracingModifierDetails',
      Type: pluginConfig.IoC!.Symbol('ModifierHandlerResolver'),
    });

    return Promise.resolve(pluginConfig);
  }
}
