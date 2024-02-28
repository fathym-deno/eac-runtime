import {
  isEaCDenoKVCacheModifierDetails,
  isEaCKeepAliveModifierDetails,
  isEaCOAuthModifierDetails,
  isEaCTracingModifierDetails,
} from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';

export const defaultModifierMiddlewareResolver: ModifierHandlerResolver = {
  async Resolve(ioc, modifier) {
    let toResolveName: string = '';

    if (isEaCDenoKVCacheModifierDetails(modifier.Details)) {
      toResolveName = 'EaCDenoKVCacheModifierDetails';
    } else if (isEaCKeepAliveModifierDetails(modifier.Details)) {
      toResolveName = 'EaCKeepAliveModifierDetails';
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
  },
};
