import { EaCDenoKVCacheModifierDetails, isEaCDenoKVCacheModifierDetails } from '../../src.deps.ts';
import { establishDenoKvCacheMiddleware } from '../../modules/cache/denoKvCacheMiddleware.ts';
import { ModifierHandlerResolver } from './ModifierHandlerResolver.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';

export const EaCDenoKVCacheModifierHandlerResolver: ModifierHandlerResolver = {
  Resolve(_ioc, modifier): Promise<EaCRuntimeHandler | undefined> {
    if (!isEaCDenoKVCacheModifierDetails(modifier.Details)) {
      throw new Deno.errors.NotSupported(
        'The provided modifier is not supported for the EaCDenoKVCacheModifierHandlerResolver.',
      );
    }

    const details = modifier.Details as EaCDenoKVCacheModifierDetails;

    return Promise.resolve(
      establishDenoKvCacheMiddleware(
        details.DenoKVDatabaseLookup,
        details.CacheSeconds,
        details.PathFilterRegex,
      ),
    );
  },
};
