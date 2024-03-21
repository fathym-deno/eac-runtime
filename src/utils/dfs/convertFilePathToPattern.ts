import { EaCDistributedFileSystem } from '../../src.deps.ts';
import { EaCRuntimeHandlerPipeline } from '../../runtime/EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlerResult } from '../../runtime/EaCRuntimeHandlerResult.ts';
import { PathMatch, pathToPatternRegexes } from './PathMatch.ts';

export async function convertFilePathToPattern<TSetup>(
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
  let parts = filePath.split('/');

  const lastPart = parts.pop();

  if (lastPart && lastPart !== dfs.DefaultFile) {
    parts.push(lastPart.replace(/\.\w+$/, ''));
  }

  let priority = parts.length * 1000000;

  if (parts.length === 1) {
    parts.push('');
  }

  parts = parts.map((part) => {
    const partCheck = pathToPatternRegexes.find(([pc]) => pc.test(part));

    if (partCheck) {
      const [partPattern, partFix, partWeight] = partCheck;

      priority -= 1000;

      priority += partWeight;

      part = part.replace(partPattern, partFix);
    }

    if (part === '.') {
      part = '';
    }

    return part;
  });

  const patternText = parts.join('/').replace('/{/:', '{/:');

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
