import {
  creatAzureADB2COAuthConfig,
  creatOAuthConfig,
  djwt,
  EaCOAuthProcessor,
  isEaCAzureADB2CProviderDetails,
  isEaCOAuthProcessor,
  isEaCOAuthProviderDetails,
  oAuthRequest,
} from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';

export const EaCOAuthProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(_ioc, appProcCfg) {
    if (!isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCOAuthProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCOAuthProcessor;

    return Promise.resolve((req, ctx) => {
      const provider = ctx.EaC.Providers![processor.ProviderLookup];

      if (isEaCAzureADB2CProviderDetails(provider.Details)) {
        const oAuthConfig = creatAzureADB2COAuthConfig(
          provider.Details.ClientID,
          provider.Details.ClientSecret,
          provider.Details.Domain,
          provider.Details.PolicyName,
          provider.Details.TenantID,
          provider.Details.Scopes,
        );

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
          appProcCfg.ResolverConfig.PathPattern,
        );
      } else if (isEaCOAuthProviderDetails(provider.Details)) {
        const oAuthConfig = creatOAuthConfig(
          provider.Details.ClientID,
          provider.Details.ClientSecret,
          provider.Details.AuthorizationEndpointURI,
          provider.Details.TokenURI,
          provider.Details.Scopes,
        );

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
          appProcCfg.ResolverConfig.PathPattern,
        );
      } else {
        throw new Error(
          `The provider '${processor.ProviderLookup}' type cannot be handled.`,
        );
      }
    });
  },
};
