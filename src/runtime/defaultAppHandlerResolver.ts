import {
creatAzureADB2COAuthConfig,
  creatOAuthConfig,
  DenoKVOAuth,
  djwt,
  EaCAIRAGChatProcessor,
  EaCDFSProcessor,
  EaCOAuthProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  isEaCDFSProcessor,
  isEaCOAuthProcessor,
  isEaCOAuthProviderDetails,
  mime,
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
import { defaultDFSFileHandlerResolver } from './defaultDFSFileHandlerResolver.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { DFSFileHandler } from './_exports.ts';
import { isEaCAzureADB2CProviderDetails } from '../src.deps.ts';

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
    handler = (req, _ctx) => {
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

      const provider = ctx.EaC.Providers![processor.ProviderLookup];

      if (isEaCAzureADB2CProviderDetails(provider.Details)) {
        const oAuthConfig = creatAzureADB2COAuthConfig(
          provider.Details.ClientID,
          provider.Details.ClientSecret,
          provider.Details.Domain,
          provider.Details.PolicyName,
          provider.Details.TenantID,
          provider.Details.Scopes
        );

        return oAuthRequest(
          req,
          oAuthConfig,
          async (tokens, _newSessionId, _oldSessionId) => {
            const { accessToken } = tokens;

            const [_header, payload, _signature] = await djwt.decode(
              accessToken
            );

            payload?.toString();
          },
          appProcCfg.LookupConfig.PathPattern
        );
      } else if (isEaCOAuthProviderDetails(provider.Details)) {
        const oAuthConfig = creatOAuthConfig(
          provider.Details.ClientID,
          provider.Details.ClientSecret,
          provider.Details.AuthorizationEndpointURI,
          provider.Details.TokenURI,
          provider.Details.Scopes
        );

        return oAuthRequest(
          req,
          oAuthConfig,
          async (tokens, _newSessionId, _oldSessionId) => {
            const { accessToken } = tokens;

            const [_header, payload, _signature] = await djwt.decode(
              accessToken
            );

            payload?.toString();
          },
          appProcCfg.LookupConfig.PathPattern
        );
      } else {
        throw new Error(
          `The provider '${processor.ProviderLookup}' type cannot be handled.`
        );
      }
    };
  } else if (isEaCAIRAGChatProcessor(appProcCfg.Application.Processor)) {
    handler = (req, _ctx) => {
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
  } else if (isEaCDFSProcessor(appProcCfg.Application.Processor)) {
    const filesReady = new Promise<DFSFileHandler>((resolve, reject) => {
      const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

      defaultDFSFileHandlerResolver(processor.DFS)
        .then((fileHandler) => {
          resolve(fileHandler);
        })
        .catch((err) => reject(err));
    });

    filesReady.then();

    handler = async (req, _ctx) => {
      const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

      const fileHandler = await filesReady;

      const pattern = new URLPattern({
        pathname: appProcCfg.LookupConfig.PathPattern,
      });

      const patternResult = pattern.exec(req.url);

      const filePath = patternResult!.pathname.groups[0]!;

      const file = await fileHandler.GetFileInfo(
        filePath,
        processor.DFS.DefaultFile
      );

      if (
        !file.Headers ||
        !('content-type' in file.Headers) ||
        !('Content-Type' in file.Headers)
      ) {
        let mimeType = mime.getType(filePath);

        if (!mimeType) {
          mimeType = mime.getType(processor.DFS.DefaultFile || '');
        }

        if (mimeType) {
          file.Headers = {
            ...(file.Headers || {}),
            'content-type': mimeType,
          };
        }
      }

      return new Response(file.Contents, {
        headers: file.Headers,
      });
    };
  } else {
    handler = (_req, ctx) => {
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
