import {
  creatAzureADB2COAuthConfig,
  createAzureADOAuthConfig,
  createGitHubOAuthConfig,
  createOAuthHelpers,
  creatOAuthConfig,
  DenoKVOAuth,
  EaCProviderAsCode,
  isEaCAzureADB2CProviderDetails,
  isEaCAzureADProviderDetails,
  isEaCGitHubAppProviderDetails,
  isEaCOAuthProviderDetails,
  redirectRequest,
  UserOAuthConnection,
  userOAuthConnExpired,
} from '../../src.deps.ts';
import { EaCRuntimeContext } from '../../runtime/EaCRuntimeContext.ts';
import { EaCRuntimeHandler } from '../../runtime/EaCRuntimeHandler.ts';

export function loadOAuth2ClientConfig(
  provider: EaCProviderAsCode,
): DenoKVOAuth.OAuth2ClientConfig | undefined {
  let oAuthConfig: DenoKVOAuth.OAuth2ClientConfig | undefined = undefined;

  if (isEaCAzureADB2CProviderDetails(provider.Details)) {
    oAuthConfig = creatAzureADB2COAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.Domain,
      provider.Details.PolicyName,
      provider.Details.TenantID,
      provider.Details.Scopes,
    );
  } else if (isEaCAzureADProviderDetails(provider.Details)) {
    oAuthConfig = createAzureADOAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.TenantID,
      provider.Details.Scopes,
    );
  } else if (isEaCGitHubAppProviderDetails(provider.Details)) {
    oAuthConfig = createGitHubOAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.Scopes,
    );
  } else if (isEaCOAuthProviderDetails(provider.Details)) {
    oAuthConfig = creatOAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.AuthorizationEndpointURI,
      provider.Details.TokenURI,
      provider.Details.Scopes,
    );
  }

  return oAuthConfig;
}

export function establishOAuthMiddleware(
  providerLookup: string,
  signInPath: string,
): EaCRuntimeHandler {
  return async (req, ctx: EaCRuntimeContext<{ Username?: string }>) => {
    const provider = ctx.Runtime.EaC.Providers![providerLookup];

    const denoKv = await ctx.Runtime.IoC.Resolve(
      Deno.Kv,
      provider.DatabaseLookup,
    );

    const oAuthConfig = loadOAuth2ClientConfig(provider);

    if (!oAuthConfig) {
      throw new Error(
        `The provider '${providerLookup}' type cannot be handled in the oAuthMiddleware.`,
      );
    }

    let resp: Response | Promise<Response>;

    if (!ctx.Runtime.ApplicationProcessorConfig.ResolverConfig.IsPrivate) {
      resp = ctx.Next();
    } else {
      const helpers = createOAuthHelpers(oAuthConfig);

      const sessionId = await helpers.getSessionId(req);

      const url = new URL(req.url);

      const { pathname, search } = url;

      const successUrl = encodeURI(pathname + search);

      const notSignedInRedirect = `${signInPath}?success_url=${successUrl}`;

      if (sessionId) {
        const currentUsername = await denoKv.get<UserOAuthConnection>([
          'OAuth',
          'User',
          sessionId,
          'Current',
        ]);

        if (!userOAuthConnExpired(currentUsername.value)) {
          ctx.State.Username = currentUsername.value!.Username;

          resp = ctx.Next();
        } else {
          resp = redirectRequest(notSignedInRedirect, false, false);
        }
      } else if (
        ctx.Runtime.ApplicationProcessorConfig.ResolverConfig.IsTriggerSignIn
      ) {
        resp = redirectRequest(notSignedInRedirect, false, false);
      } else {
        throw new Error('You are not authorized to access this endpoint.');
      }
    }

    return resp;
  };
}
