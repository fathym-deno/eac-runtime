// deno-lint-ignore-file no-explicit-any
import {
  Buffer,
  EaCAIRAGChatProcessor,
  EaCDFSProcessor,
  EaCOAuthProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  djwt,
  isEaCDFSProcessor,
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
import {
  DFSFileInfoCache,
  defaultDFSFileHandlerResolver,
} from './defaultDFSFileHandlerResolver.ts';
import { EaCRuntimeHandler } from './EaCRuntimeHandler.ts';
import { DFSFileHandler } from './_exports.ts';
import { DFSFileInfo } from './defaultDFSFileHandlerResolver.ts';

export function concatTypedArrays(a: Uint8Array, b: Uint8Array) {
  // a, b TypedArray of same type
  const c = new Uint8Array(a.length + b.length);

  c.set(a, 0);

  c.set(b, a.length);

  return c;
}

// export function concatBuffers(a: Uint8Array, b: Uint8Array) {
//   return concatTypedArrays(
//       new Uint8Array(a.buffer || a),
//       new Uint8Array(b.buffer || b)
//   ).buffer;
// }

export function denoKvCacheReadableStream(
  kv: Deno.Kv,
  cacheKey: Deno.KvKey,
  stream: ReadableStream<Uint8Array>,
  maxChunkSize = 40000
): void {
  if (stream) {
    let content = new Uint8Array();

    const contentChunks: Uint8Array[] = [];

    const fileReader = stream.getReader();

    fileReader.read().then(function processFile({ done, value }): any {
      if (done) {
        contentChunks.push(content);

        contentChunks.forEach((chunk, i) => {
          kv.set([...cacheKey, 'Chunks', i], chunk, {
            expireIn: 1000 * 60 * 5,
          }).then();
        });

        return;
      }

      content = concatTypedArrays(content, value);

      const contentBlob = new Blob([content]);

      if (contentBlob.size > maxChunkSize) {
        contentChunks.push(content);

        content = new Uint8Array();
      }

      return fileReader.read().then(processFile);
    });
  }
}

export async function denoKvReadReadableStreamCache(
  kv: Deno.Kv,
  cacheKey: Deno.KvKey
): Promise<Uint8Array> {
  const cachedFileChunks = await kv.list<Uint8Array>({
    prefix: [...cacheKey, 'Chunks'],
  });

  let content = new Uint8Array();

  for await (const cachedFileChunk of cachedFileChunks) {
    content = concatTypedArrays(content, cachedFileChunk.value!);
  }

  return content;
}

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

    handler = async (req, ctx) => {
      const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

      const fileHandler = await filesReady;

      const pattern = new URLPattern({
        pathname: appProcCfg.LookupConfig.PathPattern,
      });

      const patternResult = pattern.exec(req.url);

      const filePath = patternResult!.pathname.groups[0]!;

      const cacheDb = (await ctx.Databases['cache']) as Deno.Kv;

      let file: DFSFileInfo | undefined = undefined;

      const fileCacheKey = [
        'DFS',
        'EaC',
        ctx.EaC!.EnterpriseLookup!,
        'Project',
        ctx.ProjectProcessorConfig.ProjectLookup,
        'Applications',
        ctx.ApplicationProcessorConfig.ApplicationLookup,
        'File',
        filePath,
      ];

      if (cacheDb) {
        const content = await denoKvReadReadableStreamCache(
          cacheDb,
          fileCacheKey
        );

        if (content.length > 0) {
          const cachedHeaders = await cacheDb.get<Record<string, string>>([
            ...fileCacheKey,
            'Headers',
          ]);

          file = {
            Contents: new Blob([content]).stream(),
            Headers: cachedHeaders.value,
          } as DFSFileInfo;
        }
      }

      if (!file) {
        file = await fileHandler.GetFileInfo(
          filePath,
          processor.DFS.DefaultFile
        );

        if (file) {
          denoKvCacheReadableStream(
            cacheDb,
            fileCacheKey,
            file.ContentsForWork
          );

          if (file.Headers) {
            cacheDb
              .set([...fileCacheKey, 'Headers'], file.Headers, {
                expireIn: 1000 * 60 * 5,
              })
              .then();
          }
        }
      }

      return new Response(file.Contents, {
        headers: file.Headers,
      });
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
