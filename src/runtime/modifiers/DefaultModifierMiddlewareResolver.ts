import {
  EaCModifierAsCode,
  IoCContainer,
  isEaCBaseHREFModifierDetails,
  isEaCDenoKVCacheModifierDetails,
  isEaCJWTValidationModifierDetails,
  isEaCKeepAliveModifierDetails,
  isEaCMarkdownToHTMLModifierDetails,
  isEaCOAuthModifierDetails,
  isEaCStripeModifierDetails,
  isEaCTracingModifierDetails,
} from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';

export class DefaultModifierMiddlewareResolver implements ModifierHandlerResolver {
  public async Resolve(ioc: IoCContainer, modifier: EaCModifierAsCode) {
    let toResolveName: string = '';

    if (isEaCBaseHREFModifierDetails(modifier.Details)) {
      toResolveName = 'EaCBaseHREFModifierDetails';
    } else if (isEaCDenoKVCacheModifierDetails(modifier.Details)) {
      toResolveName = 'EaCDenoKVCacheModifierDetails';
    } else if (isEaCJWTValidationModifierDetails(modifier.Details)) {
      toResolveName = 'EaCJWTValidationModifierDetails';
    } else if (isEaCKeepAliveModifierDetails(modifier.Details)) {
      toResolveName = 'EaCKeepAliveModifierDetails';
    } else if (isEaCMarkdownToHTMLModifierDetails(modifier.Details)) {
      toResolveName = 'EaCMarkdownToHTMLModifierDetails';
    } else if (isEaCOAuthModifierDetails(modifier.Details)) {
      toResolveName = 'EaCOAuthModifierDetails';
    } else if (isEaCStripeModifierDetails(modifier.Details)) {
      toResolveName = 'EaCStripeModifierDetails';
    } else if (isEaCTracingModifierDetails(modifier.Details)) {
      toResolveName = 'EaCTracingModifierDetails';
    }

    const resolver = await ioc.Resolve<ModifierHandlerResolver>(
      ioc.Symbol('ModifierHandlerResolver'),
      toResolveName,
    );

    return await resolver.Resolve(ioc, modifier);
  }
}
