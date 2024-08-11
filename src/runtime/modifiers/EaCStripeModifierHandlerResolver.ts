import { EaCStripeModifierDetails, isEaCStripeModifierDetails } from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishStripeMiddleware } from '../../modules/stripe/stripeMiddleware.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export const EaCStripeModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCStripeModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCStripeModifierHandlerResolver.',
      );
    }

    const details = modifier.Details as EaCStripeModifierDetails;

    return Promise.resolve(establishStripeMiddleware(details.IncludeScript));
  },
};
