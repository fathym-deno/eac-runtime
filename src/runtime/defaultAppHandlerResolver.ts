import {
  EaCAIRAGChatProcessor,
  EaCOAuthProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  djwt,
  isEaCOAuthProcessor,
} from '../src.deps.ts';
import {
  aiRAGChatRequest,
  isEaCAIRAGChatProcessor,
  isEaCProxyProcessor,
  isEaCRedirectProcessor,
  oAuthRequest,
  proxyRequest,
  redirectRequest,
} from '../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';

export const defaultAppHandlerResolver: (
  appProcCfg: EaCApplicationProcessorConfig
) => EaCRuntimeHandler = (appProcCfg) => {
  let handler: EaCRuntimeHandler;

  if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
    handler = (_req, _ctx) => {
      const processor = appProcCfg.Application
        .Processor as EaCRedirectProcessor;

      return redirectRequest(
        processor.Redirect,
        processor.PreserveMethod,
        processor.Permanent
      );
    };
  } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
    handler = (req, ctx) => {
      const processor = appProcCfg.Application.Processor as EaCProxyProcessor;

      return proxyRequest(
        req,
        processor.ProxyRoot,
        appProcCfg.LookupConfig.PathPattern
        // ctx.Info.remoteAddr.hostname,
      );
    };
  } else if (isEaCOAuthProcessor(appProcCfg.Application.Processor)) {
    handler = (req, ctx) => {
      const processor = appProcCfg.Application.Processor as EaCOAuthProcessor;

      return oAuthRequest(
        req,
        processor.ClientID,
        processor.ClientSecret,
        processor.AuthorizationEndpointURI,
        processor.TokenURI,
        processor.Scopes,
        async (tokens, _newSessionId, _oldSessionId) => {
          const { accessToken } = tokens;

          const [_header, payload, _signature] = await djwt.decode(accessToken);

          payload?.toString();
        },
        appProcCfg.LookupConfig.PathPattern
      );
    };
  } else if (isEaCAIRAGChatProcessor(appProcCfg.Application.Processor)) {
    handler = (req, ctx) => {
      const processor = appProcCfg.Application
        .Processor as EaCAIRAGChatProcessor;

      return aiRAGChatRequest(
        req,
        processor.Endpoint,
        processor.APIKey,
        processor.DeploymentName,
        processor.ModelName,
        processor.Messages,
        processor.UseSSEFormat,
        processor.InputParams,
        processor.EmbeddingDeploymentName,
        processor.SearchEndpoint,
        processor.SearchAPIKey
      );
    };
  } else {
    handler = (req, ctx) => {
      return new Response(
        'Hello, world!\n' +
          JSON.stringify(appProcCfg, null, 2) +
          '\n' +
          JSON.stringify(ctx.Info.remoteAddr, null, 2)
      );
    };
  }

  return handler;
};
