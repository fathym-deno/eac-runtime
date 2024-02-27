import {
  aiChatRequest,
  BaseLanguageModel,
  creatAzureADB2COAuthConfig,
  creatOAuthConfig,
  djwt,
  EaCAIChatProcessor,
  EaCDFSProcessor,
  EaCOAuthProcessor,
  // EaCPreactAppProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  isEaCAIChatProcessor,
  isEaCAzureADB2CProviderDetails,
  isEaCDFSProcessor,
  isEaCOAuthProcessor,
  isEaCOAuthProviderDetails,
  // isEaCPreactAppProcessor,
  isEaCProxyProcessor,
  isEaCRedirectProcessor,
  JSX,
  mime,
  oAuthRequest,
  preactToString,
  processCacheControlHeaders,
  proxyRequest,
  redirectRequest,
  VectorStore,
} from '../../src.deps.ts';
import { EaCApplicationProcessorConfig } from './EaCApplicationProcessorConfig.ts';
import { defaultDFSFileHandlerResolver, DFSFileHandler } from './defaultDFSFileHandlerResolver.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';

export const defaultAppHandlerResolver: (
  appProcCfg: EaCApplicationProcessorConfig,
) => EaCRuntimeHandler = (appProcCfg) => {
  let handler: EaCRuntimeHandler;

  if (isEaCRedirectProcessor(appProcCfg.Application.Processor)) {
    handler = (_req, _ctx) => {
      const processor = appProcCfg.Application
        .Processor as EaCRedirectProcessor;

      return redirectRequest(
        processor.Redirect,
        processor.PreserveMethod,
        processor.Permanent,
      );
    };
    // } else if (isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
    //   handler = (req, _ctx) => {
    //     const processor = appProcCfg.Application
    //       .Processor as EaCPreactAppProcessor;

    //     const page = <App />;

    //     const html = preactToString(page);

    //     return new Response(html, {
    //       headers: { 'content-type': 'text/html; charset=utf-8' },
    //     });
    //   };
  } else if (isEaCProxyProcessor(appProcCfg.Application.Processor)) {
    handler = (req, _ctx) => {
      const processor = appProcCfg.Application.Processor as EaCProxyProcessor;

      return proxyRequest(
        req,
        processor.ProxyRoot,
        appProcCfg.LookupConfig.PathPattern,
        processor.RedirectMode,
        !EAC_RUNTIME_DEV() ? processor.CacheControl : undefined,
        processor.ForceCache,
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
          appProcCfg.LookupConfig.PathPattern,
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
          appProcCfg.LookupConfig.PathPattern,
        );
      } else {
        throw new Error(
          `The provider '${processor.ProviderLookup}' type cannot be handled.`,
        );
      }
    };
  } else if (isEaCAIChatProcessor(appProcCfg.Application.Processor)) {
    handler = async (req, ctx) => {
      const processor = appProcCfg.Application.Processor as EaCAIChatProcessor;

      const llm = await ctx.IoC.Resolve<BaseLanguageModel>(
        ctx.IoC.Symbol(BaseLanguageModel.name),
        `${processor.AILookup}|${processor.LLMLookup}`,
      );

      const vectorStore = processor.VectorStoreLookup
        ? await ctx.IoC.Resolve<VectorStore>(
          ctx.IoC.Symbol(VectorStore.name),
          `${processor.AILookup}|${processor.VectorStoreLookup}`,
        )
        : undefined;

      return aiChatRequest(
        req,
        llm,
        processor.Messages,
        processor.UseSSEFormat,
        processor.DefaultInput,
        vectorStore,
        processor.DefaultRAGInput,
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
        processor.DFS.DefaultFile,
      );

      if (
        !file.Headers ||
        !('content-type' in file.Headers) ||
        !('Content-Type' in file.Headers)
      ) {
        let mimeType = filePath.endsWith('.ts') ? 'application/typescript' : mime.getType(filePath);

        if (!mimeType) {
          mimeType = processor.DFS.DefaultFile?.endsWith('.ts')
            ? 'application/typescript'
            : mime.getType(processor.DFS.DefaultFile || '');
        }

        if (mimeType) {
          file.Headers = {
            ...(file.Headers || {}),
            'content-type': mimeType,
          };
        }
      }

      let resp = new Response(file.Contents, {
        headers: file.Headers,
      });

      if (processor.CacheControl && !EAC_RUNTIME_DEV()) {
        resp = processCacheControlHeaders(
          resp,
          processor.CacheControl,
          processor.ForceCache,
        );
      }

      return resp;
    };
  } else {
    handler = (_req, ctx) => {
      return new Response(
        'Hello, world!\n' +
          JSON.stringify(appProcCfg, null, 2) +
          '\n' +
          JSON.stringify(ctx.Info.remoteAddr, null, 2),
      );
    };
  }

  return handler;
};
