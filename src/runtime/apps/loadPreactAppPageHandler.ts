// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystemDetails, ESBuild } from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';

export async function loadPreactAppPageHandler(
  esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<
  [EaCRuntimeHandlerResult, ComponentType<any>, boolean, string, string[]]
> {
  const loader = filePath.endsWith('.ts') ? 'ts' : 'tsx';

  const { module, contents } = (await importDFSTypescriptModule(
    esbuild,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
    loader,
  ))!;

  const component: ComponentType<any> | undefined = module.default;

  const isIsland = 'IsIsland' in module ? module.IsIsland : false;

  let handler: EaCRuntimeHandlerResult | undefined = module.handler;

  if (!component && !handler) {
    throw new Deno.errors.NotFound(
      `The page '${filePath}' does not have a component to render or handler for processing.`,
    );
  }

  if (!handler) {
    handler = (_req, ctx) => {
      return ctx.Render({});
    };
  }

  return [handler, component!, isIsland, contents, module.ParentLayouts || []];
}
