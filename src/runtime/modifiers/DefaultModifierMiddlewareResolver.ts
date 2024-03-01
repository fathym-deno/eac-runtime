import {
  EaCModifierAsCode,
  IoCContainer,
  isEaCDenoKVCacheModifierDetails,
  isEaCKeepAliveModifierDetails,
  isEaCMarkdownToHTMLModifierDetails,
  isEaCOAuthModifierDetails,
  isEaCTracingModifierDetails,
} from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';

export class DefaultModifierMiddlewareResolver implements ModifierHandlerResolver {
  public async Resolve(ioc: IoCContainer, modifier: EaCModifierAsCode) {
    let toResolveName: string = '';

    if (isEaCDenoKVCacheModifierDetails(modifier.Details)) {
      toResolveName = 'EaCDenoKVCacheModifierDetails';
    } else if (isEaCKeepAliveModifierDetails(modifier.Details)) {
      toResolveName = 'EaCKeepAliveModifierDetails';
    } else if (isEaCMarkdownToHTMLModifierDetails(modifier.Details)) {
      toResolveName = 'EaCMarkdownToHTMLModifierDetails';
    } else if (isEaCOAuthModifierDetails(modifier.Details)) {
      toResolveName = 'EaCOAuthModifierDetails';
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
