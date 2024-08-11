import { EaCOAuthModifierDetails, isEaCOAuthModifierDetails } from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishOAuthMiddleware } from '../../modules/oauth/oauthMiddleware.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export const EaCOAuthModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCOAuthModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCOAuthModifierHandlerResolver.',
      );
    }

    const details = modifier.Details as EaCOAuthModifierDetails;

    return Promise.resolve(
      establishOAuthMiddleware(details.ProviderLookup, details.SignInPath),
    );
  },
};
