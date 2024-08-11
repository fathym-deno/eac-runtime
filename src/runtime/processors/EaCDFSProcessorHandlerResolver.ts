import { EaCDFSProcessor, isEaCDFSProcessor, mime, STATUS_CODE } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { loadFileHandler } from '../../utils/dfs/loadFileHandler.ts';

export const EaCDFSProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCDFSProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

    const dfs = eac.DFS![processor.DFSLookup]!;

    const fileHandler = await loadFileHandler(ioc, dfs);

    return async (_req, ctx) => {
      const filePath = ctx.Runtime.URLMatch.Path;

      const file = await fileHandler!.GetFileInfo(
        filePath,
        ctx.Runtime.Revision,
        dfs.DefaultFile,
        dfs.Extensions,
        dfs.UseCascading,
      );

      if (
        file &&
        (!file.Headers ||
          !('content-type' in file.Headers) ||
          !('Content-Type' in file.Headers))
      ) {
        const mimeType = file.Path.endsWith('.ts')
          ? 'application/typescript'
          : mime.getType(file.Path);

        // if (!mimeType) {
        //   mimeType = processor.DFS.DefaultFile?.endsWith('.ts')
        //     ? 'application/typescript'
        //     : mime.getType(processor.DFS.DefaultFile || '');
        // }

        if (mimeType) {
          file.Headers = {
            ...(file.Headers || {}),
            'Content-Type': mimeType,
          };
        }
      }

      if (file) {
        const resp = new Response(file.Contents, {
          headers: file.Headers,
        });

        return resp;
      } else {
        return new Response(null, {
          status: STATUS_CODE.NotFound,
        });
      }
    };
  },
};
