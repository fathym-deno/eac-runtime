import {
  EaCJWTValidationModifierDetails,
  isEaCJWTValidationModifierDetails,
  loadJwtConfig,
} from '../../src.deps.ts';
import { IS_BUILDING } from '../../constants.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { establishJwtValidationMiddleware } from '../../modules/jwt/jwtValidationMiddleware.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export const EaCJWTValidationModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (IS_BUILDING) {
      return Promise.resolve(undefined);
    }

    if (!isEaCJWTValidationModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCJWTValidationModifierHandlerResolver.',
      );
    }

    const _details = modifier.Details as EaCJWTValidationModifierDetails;

    return Promise.resolve(establishJwtValidationMiddleware(loadJwtConfig()));
  },
};
