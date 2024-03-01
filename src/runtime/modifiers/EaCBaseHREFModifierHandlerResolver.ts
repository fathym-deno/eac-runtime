import { EaCBaseHREFModifierDetails, isEaCBaseHREFModifierDetails } from '../../src.deps.ts';
import { establishBaseHrefMiddleware } from '../../modules/baseHref/baseHrefMiddleware.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';

export const EaCBaseHREFModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier) {
    if (!isEaCBaseHREFModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCBaseHREFModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCBaseHREFModifierDetails;

    return Promise.resolve(
      establishBaseHrefMiddleware(),
    );
  },
};
