import {
  DenoKVOAuth,
  djwt,
  EaCGitHubAppProviderDetails,
  EaCOAuthProcessor,
  EaCSourceConnectionDetails,
  isEaCAzureADB2CProviderDetails,
  isEaCAzureADProviderDetails,
  isEaCGitHubAppProviderDetails,
  isEaCOAuthProcessor,
  isEaCOAuthProviderDetails,
  loadOctokit,
  oAuthRequest,
  UserOAuthConnection,
} from '../../src.deps.ts';
import { loadOAuth2ClientConfig } from '../../modules/oauth/oauthMiddleware.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCOAuthProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCOAuthProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCOAuthProcessor;

    const provider = eac.Providers![processor.ProviderLookup];

    const denoKv = await ioc.Resolve(Deno.Kv, provider.DatabaseLookup);

    const handleCompleteCallback = async (
      loadPrimaryEmail: (accessToken: string) => Promise<string>,
      tokens: DenoKVOAuth.Tokens,
      newSessionId: string,
      oldSessionId?: string,
      isPrimary?: boolean,
    ) => {
      const now = Date.now();

      const { accessToken, refreshToken, expiresIn } = tokens;

      const primaryEmail = await loadPrimaryEmail(accessToken);

      const expiresAt = now + expiresIn! * 1000;

      if (isPrimary) {
        await denoKv.set(
          ['OAuth', 'User', newSessionId, 'Current'],
          {
            Username: primaryEmail!,
            ExpiresAt: expiresAt,
            Token: accessToken,
            RefreshToken: refreshToken,
          } as UserOAuthConnection,
          {
            expireIn: expiresIn! * 1000,
          },
        );
      } else {
        const curUser = await denoKv.get([
          'OAuth',
          'User',
          oldSessionId!,
          'Current',
        ]);

        if (curUser.value) {
          await denoKv.set(
            ['OAuth', 'User', newSessionId, 'Current'],
            {
              ...curUser.value,
              ExpiresAt: expiresAt,
            } as UserOAuthConnection,
            {
              expireIn: expiresIn! * 1000,
            },
          );
        }
      }

      await denoKv.set(
        ['OAuth', 'User', newSessionId, processor.ProviderLookup],
        {
          Username: primaryEmail!,
          ExpiresAt: expiresAt,
          Token: accessToken,
          RefreshToken: refreshToken,
        } as UserOAuthConnection,
        {
          expireIn: expiresIn! * 1000,
        },
      );

      if (oldSessionId) {
        await denoKv
          .atomic()
          .delete(['OAuth', 'User', oldSessionId, 'Current'])
          .delete(['OAuth', 'User', oldSessionId, processor.ProviderLookup])
          .commit();
      }
    };

    const oAuthConfig = loadOAuth2ClientConfig(provider)!;

    return (req, ctx) => {
      if (isEaCAzureADB2CProviderDetails(provider.Details)) {
        return oAuthRequest(
          req,
          oAuthConfig,
          async (tokens, newSessionId, oldSessionId) => {
            await handleCompleteCallback(
              async (accessToken) => {
                const [_header, payload, _signature] = await djwt.decode(
                  accessToken,
                );

                return (payload as Record<string, string>).emails[0];
              },
              tokens,
              newSessionId,
              oldSessionId,
              provider.Details?.IsPrimary,
            );
          },
          ctx.Runtime.URLMatch.Base,
          ctx.Runtime.URLMatch.Path,
        );
      } else if (isEaCAzureADProviderDetails(provider.Details)) {
        if (ctx.Runtime.URLMatch.Path.endsWith('callback')) {
          const url = new URL(req.url);

          oAuthConfig.redirectUri = new URL(url.pathname, url.origin).href;
        }

        return oAuthRequest(
          req,
          oAuthConfig,
          async (tokens, newSessionId, oldSessionId) => {
            await handleCompleteCallback(
              async (accessToken) => {
                const [_header, payload, _signature] = await djwt.decode(
                  accessToken,
                );

                return (payload as Record<string, string>).upn;
              },
              tokens,
              newSessionId,
              oldSessionId,
              provider.Details?.IsPrimary,
            );
          },
          ctx.Runtime.URLMatch.Base,
          ctx.Runtime.URLMatch.Path,
        );
      } else if (isEaCGitHubAppProviderDetails(provider.Details)) {
        return oAuthRequest(
          req,
          oAuthConfig,
          async (tokens, newSessionId, oldSessionId) => {
            await handleCompleteCallback(
              async (accessToken) => {
                const octokit = await loadOctokit(
                  provider.Details as EaCGitHubAppProviderDetails,
                  {
                    Token: accessToken,
                  } as EaCSourceConnectionDetails,
                );

                const {
                  data: { login },
                } = await octokit.rest.users.getAuthenticated();

                return login;
              },
              tokens,
              newSessionId,
              oldSessionId,
              provider.Details?.IsPrimary,
            );
          },
          ctx.Runtime.URLMatch.Base,
          ctx.Runtime.URLMatch.Path,
        );
      } else if (isEaCOAuthProviderDetails(provider.Details)) {
        return oAuthRequest(
          req,
          oAuthConfig,
          async (tokens, _newSessionId, _oldSessionId) => {
            const { accessToken } = tokens;

            const [_header, payload, _signature] = await djwt.decode(
              accessToken,
            );

            payload?.toString();
          },
          ctx.Runtime.URLMatch.Base,
          ctx.Runtime.URLMatch.Path,
        );
      } else {
        throw new Error(
          `The provider '${processor.ProviderLookup}' type cannot be handled.`,
        );
      }
    };
  },
};
