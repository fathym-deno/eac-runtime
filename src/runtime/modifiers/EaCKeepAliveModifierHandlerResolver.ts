import { EaCKeepAliveModifierDetails, isEaCKeepAliveModifierDetails } from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishKeepAliveMiddleware } from '../../modules/keepAlive/keepAliveMiddleware.ts';

export const EaCKeepAliveModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier) {
    if (!isEaCKeepAliveModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCKeepAliveModifierHandlerResolver.',
      );
    }

    const details = modifier.Details as EaCKeepAliveModifierDetails;

    return Promise.resolve(establishKeepAliveMiddleware(details.KeepAlivePath));
  },
};
