import {
  EaCDFSProcessor,
  isEaCDFSProcessor,
  mime,
  processCacheControlHeaders,
} from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { DFSFileHandlerResolver } from '../dfs/DFSFileHandlerResolver.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EAC_RUNTIME_DEV } from '../../constants.ts';

export const EaCDFSProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(ioc, appProcCfg) {
    if (!isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCDFSProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

    const filesReady = new Promise<DFSFileHandler>((resolve, reject) => {
      ioc
        .Resolve<DFSFileHandlerResolver>(ioc.Symbol('DFSFileHandler'))
        .then((defaultDFSFileHandlerResolver: DFSFileHandlerResolver) => {
          defaultDFSFileHandlerResolver
            .Resolve(ioc, processor.DFS)
            .then((fileHandler) => {
              resolve(fileHandler);
            })
            .catch((err) => reject(err));
        });
    });

    filesReady.then();

    return Promise.resolve(async (req, _ctx) => {
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
        let mimeType = file.Path.endsWith('.ts')
          ? 'application/typescript'
          : mime.getType(file.Path);

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
    });
  },
};
