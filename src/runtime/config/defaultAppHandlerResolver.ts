import { djwt, isEaCOAuthProcessor } from '../../src.deps.ts';
import {
  isEaCAIRAGChatProcessor,
  isEaCRedirectProcessor,
  isEaCProxyProcessor,
  aiRAGChatRequest,
  oAuthRequest,
  proxyRequest,
  redirectRequest
} from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from '../EaCApplicationProcessorConfig.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';


export const defaultAppHandlerResolver: (appProcCfg: EaCApplicationProcessorConfig) => EaCRuntimeHandler = (appProcCfg) => {
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
        appProcCfg.Application.Processor.ModelName,
        appProcCfg.Application.Processor.Messages,
        appProcCfg.Application.Processor.UseSSEFormat,
        appProcCfg.Application.Processor.InputParams,
        appProcCfg.Application.Processor.EmbeddingDeploymentName,
        appProcCfg.Application.Processor.SearchEndpoint,
        appProcCfg.Application.Processor.SearchAPIKey
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
};
