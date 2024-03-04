import { JWTConfig, respond, STATUS_CODE } from '../../src.deps.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function establishJwtValidationMiddleware(
  jwtConfig: JWTConfig,
): EaCRuntimeHandler {
  return async (req, ctx) => {
    if (req.method !== 'OPTIONS') {
      const jwtToken = jwtConfig.LoadToken(req);

      const failureRespBody = { HasError: false, Message: '' };

      if (!jwtToken) {
        failureRespBody.Message =
          `A JWT token is required, provide it in the '${jwtConfig.Header}' header in the format '${jwtConfig.Schema} {token}'.`;
      }

      try {
        if (!(await jwtConfig.Verify(jwtToken!))) {
          failureRespBody.Message = 'The provided token is invalid.';

          failureRespBody.HasError = true;
        }
      } catch (err) {
        console.error(err);

        failureRespBody.HasError = true;

        failureRespBody.Message = err.message;
      }

      if (failureRespBody.HasError) {
        return respond(failureRespBody, {
          status: STATUS_CODE.Unauthorized,
        });
      }

      const [_header, payload] = await jwtConfig.Decode<unknown>(jwtToken!);

      ctx.State = {
        ...(ctx.State || {}),
        ...(payload || {}),
        JWT: jwtToken,
      };
    }

    return ctx.Next();
  };
}
