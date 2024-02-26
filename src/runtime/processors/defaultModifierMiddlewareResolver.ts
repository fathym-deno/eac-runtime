import {
  EaCModifierAsCode,
  isEaCDenoKVCacheModifierDetails,
  isEaCKeepAliveModifierDetails,
  isEaCOAuthModifierDetails,
  isEaCTracingModifierDetails,
} from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { establishDenoKvCacheMiddleware } from '../../modules/cache/denoKvCacheMiddleware.ts';
import { establishKeepAliveMiddleware } from '../../modules/keepAlive/keepAliveMiddleware.ts';
import { establishOAuthMiddleware } from '../../modules/oauth/oauthMiddleware.ts';
import { establishTracingMiddleware } from '../../modules/tracing/tracingMiddleware.ts';

export const defaultModifierMiddlewareResolver: (
  modifier: EaCModifierAsCode,
) => EaCRuntimeHandler | undefined = (modifier) => {
  let handler: EaCRuntimeHandler | undefined;

  if (isEaCDenoKVCacheModifierDetails(modifier.Details)) {
    handler = establishDenoKvCacheMiddleware(
      modifier.Details.DenoKVDatabaseLookup,
      modifier.Details.CacheSeconds,
      modifier.Details.PathFilterRegex,
    );
  } else if (isEaCKeepAliveModifierDetails(modifier.Details)) {
    handler = establishKeepAliveMiddleware(modifier.Details.KeepAlivePath);
  } else if (isEaCOAuthModifierDetails(modifier.Details)) {
    handler = establishOAuthMiddleware(
      modifier.Details.ProviderLookup,
      modifier.Details.SignInPath,
    );
  } else if (isEaCTracingModifierDetails(modifier.Details)) {
    handler = establishTracingMiddleware(
      modifier.Details.TraceRequest,
      modifier.Details.TraceResponse,
    );
  }

  return handler;
};