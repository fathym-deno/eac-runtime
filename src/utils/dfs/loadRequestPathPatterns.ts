import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from '../../runtime/dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../../runtime/EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { IS_BUILDING } from '../../constants.ts';
import { PathMatch } from './PathMatch.ts';
import { convertFilePathToPattern } from './convertFilePathToPattern.ts';

export async function loadRequestPathPatterns<TSetup>(
  fileHandler: DFSFileHandler,
  dfs: EaCDistributedFileSystem,
  setup: (allPaths: string[]) => Promise<TSetup>,
  loadHandlers: (
    filePath: string,
    details: TSetup,
  ) => Promise<EaCRuntimeHandlerResult>,
  configurePipeline: (
    filePath: string,
    pipeline: EaCRuntimeHandlerPipeline,
    details: TSetup,
  ) => void,
  revision: number,
): Promise<PathMatch[]> {
  const allPaths = await fileHandler.LoadAllPaths(revision);

  if (!IS_BUILDING) {
    const details = await setup(allPaths);

    const apiPathPatternCalls = allPaths
      .filter(
        (p) => !p.endsWith('_middleware.ts') && !p.endsWith('_layout.tsx'),
      )
      .map((p) => {
        return convertFilePathToPattern<TSetup>(
          p,
          dfs,
          loadHandlers,
          configurePipeline,
          details,
        );
      });

    const patterns = await Promise.all(apiPathPatternCalls);

    return patterns
      .sort((a, b) => b.Priority - a.Priority)
      .sort((a, b) => {
        const aCatch = a.PatternText.endsWith('*') ? -1 : 1;
        const bCatch = b.PatternText.endsWith('*') ? -1 : 1;

        return bCatch - aCatch;
      });
  } else {
    return [];
  }
}
