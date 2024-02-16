import { djwt, isEaCOAuthProcessor } from '../../src.deps.ts';
import {
  isEaCAIRAGChatProcessor,
  isEaCRedirectProcessor,
  isEaCProxyProcessor,
  aiRAGChatRequest,
  oAuthRequest,
  proxyRequest,
  redirectRequest,
} from '../../src.deps.ts';
import { merge, colors } from '../../src.deps.ts';
import { isPromise } from '../../utils/type-guards/isPromise.ts';
import { DefaultEaCRuntime } from '../DefaultEaCRuntime.ts';
import { EaCRuntimeConfig } from './EaCRuntimeConfig.ts';

export const DefaultEaCConfig: EaCRuntimeConfig = {
  ApplicationHandlerResolver: (appProcCfg) => {
    return (req, ctx) => {
      let resp: Response | Promise<Response>;

      if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
        resp = redirectRequest(
          appProcCfg.Application.Processor.Redirect,
          appProcCfg.Application.Processor.PreserveMethod,
          appProcCfg.Application.Processor.Permanent
        );
      } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
        resp = proxyRequest(
          req,
          appProcCfg.Application.Processor.ProxyRoot,
          appProcCfg.LookupConfig.PathPattern
          // ctx.Info.remoteAddr.hostname,
        );
      } else if (isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
        resp = oAuthRequest(
          req,
          appProcCfg.Application.Processor.ClientID,
          appProcCfg.Application.Processor.ClientSecret,
          appProcCfg.Application.Processor.AuthorizationEndpointURI,
          appProcCfg.Application.Processor.TokenURI,
          appProcCfg.Application.Processor.Scopes,
          async (tokens, newSessionId, oldSessionId) => {
            const { accessToken, refreshToken, expiresIn } = tokens;

            const [header, payload, signature] = await djwt.decode(accessToken);

            payload?.toString();
          },
          appProcCfg.LookupConfig.PathPattern
        );
      } else if (isEaCAIRAGChatProcessor(appProcCfg.Application.Processor)) {
        resp = aiRAGChatRequest(
          req,
          appProcCfg.Application.Processor.Endpoint,
          appProcCfg.Application.Processor.APIKey,
          appProcCfg.Application.Processor.DeploymentName,
          appProcCfg.Application.Processor.EmbeddingDeploymentName,
          appProcCfg.Application.Processor.ModelName,
          appProcCfg.Application.Processor.SearchEndpoint,
          appProcCfg.Application.Processor.SearchAPIKey,
          appProcCfg.Application.Processor.Messages,
          appProcCfg.Application.Processor.UseSSEFormat,
          appProcCfg.Application.Processor.InputParams
        );
      } else {
        resp = new Response(
          'Hello, world!\n' +
            JSON.stringify(appProcCfg, null, 2) +
            '\n' +
            JSON.stringify(ctx.Info.remoteAddr, null, 2)
        );
      }

      return resp;
    };
  },
  Runtime: (cfg: EaCRuntimeConfig) => new DefaultEaCRuntime(cfg),
  Server: {
    onListen: (params) => {
      const address = colors.green(`http://localhost:${params.port}`);

      const fathymGreen: colors.Rgb = { r: 74, g: 145, b: 142 };

      console.log();
      console.log(colors.bgRgb24(' 🔥 EaC Runtime Ready ', fathymGreen));
      console.log(colors.rgb24(`\t${address}`, fathymGreen));
      console.log();
    },
  },
};

export async function defineEaCConfig(
  config: Partial<EaCRuntimeConfig> | Promise<Partial<EaCRuntimeConfig>>
): Promise<EaCRuntimeConfig> {
  if (isPromise(config)) {
    config = await config;
  }

  return merge(DefaultEaCConfig, config);
}
