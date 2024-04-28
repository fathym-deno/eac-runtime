import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { EaCRuntimeHandlerPipeline } from '../../runtime/EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { PathMatch } from './PathMatch.ts';
import { convertFilePathToPattern } from './convertFilePathToPattern.ts';

export async function convertFilePathToMatch<TSetup>(
  filePath: string,
  dfs: EaCDistributedFileSystem,
  loadHandlers: (
    filePath: string,
    details: TSetup,
  ) => Promise<EaCRuntimeHandlerResult | undefined>,
  configurePipeline: (
    filePath: string,
    pipeline: EaCRuntimeHandlerPipeline,
    details: TSetup,
  ) => void,
  details: TSetup,
): Promise<PathMatch> {
  const { patternText, priority } = convertFilePathToPattern(filePath, dfs);

  const handler = await loadHandlers(filePath, details);

  const pipeline = new EaCRuntimeHandlerPipeline();

  if (handler) {
    pipeline.Append(...(Array.isArray(handler) ? handler : [handler]));
  }

  configurePipeline(filePath, pipeline, details);

  return {
    Handlers: pipeline,
    Path: filePath,
    Pattern: new URLPattern({
      pathname: patternText,
    }),
    PatternText: patternText,
    Priority: priority,
  };
}
