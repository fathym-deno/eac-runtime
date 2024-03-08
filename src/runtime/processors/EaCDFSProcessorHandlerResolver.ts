import { EaCDFSProcessor, isEaCDFSProcessor, mime } from '../../src.deps.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';

export const EaCDFSProcessorHandlerResolver: ProcessorHandlerResolver = {
  Resolve(ioc, appProcCfg, eac) {
    if (!isEaCDFSProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCDFSProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCDFSProcessor;

    const dfs = eac.DFS![processor.DFSLookup];

    const filesReady = filesReadyCheck(ioc, dfs).then(
      (fileHandler) => {
        return fileHandler;
      },
    );

    filesReady.then();

    return Promise.resolve(async (_req, ctx) => {
      const fileHandler = await filesReady;

      const filePath = ctx.Runtime.URLMatch.Path;

      const file = await fileHandler.GetFileInfo(
        filePath,
        ctx.Runtime.Revision,
        dfs.DefaultFile,
        dfs.Extensions,
        dfs.UseCascading,
      );

      if (
        !file.Headers ||
        !('content-type' in file.Headers) ||
        !('Content-Type' in file.Headers)
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

      const resp = new Response(file.Contents, {
        headers: file.Headers,
      });

      return resp;
    });
  },
};
