// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystemDetails, ESBuild } from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';

export async function loadLayout(
  esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystemDetails,
  dfsLookup: string,
): Promise<
  [
    string,
    ComponentType<any>,
    boolean,
    string,
    EaCRuntimeHandlerResult,
    string[] | undefined,
  ]
> {
  const { module: layoutModule, contents } = (await importDFSTypescriptModule(
    esbuild,
    fileHandler,
    filePath,
    dfs,
    dfsLookup,
    'tsx',
  ))!;

  const layout: ComponentType<any> | undefined = layoutModule.default;

  const root = filePath.replace('_layout.tsx', '');

  if (!layout) {
    throw new Deno.errors.NotFound(
      `The layout does not have ${root} does not have a componenet to render.`,
    );
  }

  let handler: EaCRuntimeHandlerResult | undefined = layoutModule.handler;

  if (!handler) {
    handler = (_req, ctx) => {
      return ctx.Next();
    };
  }

  const isIsland = 'IsIsland' in layoutModule ? layoutModule.IsIsland : false;

  const parentLayouts: string[] | undefined = 'ParentLayouts' in layoutModule
    ? layoutModule.ParentLayouts
    : undefined;

  return [root, layout, isIsland, contents, handler, parentLayouts];
}
