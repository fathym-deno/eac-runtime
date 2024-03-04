import { loadJwtConfig } from '@fathym/eac';
import {
  EaCJWTValidationModifierDetails,
  isEaCJWTValidationModifierDetails,
} from '../../src.deps.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishJwtValidationMiddleware } from '../../modules/jwt/jwtValidationMiddleware.ts';

export const EaCJWTValidationModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier) {
    if (!isEaCJWTValidationModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCJWTValidationModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCJWTValidationModifierDetails;

    return Promise.resolve(establishJwtValidationMiddleware(loadJwtConfig()));
  },
};
