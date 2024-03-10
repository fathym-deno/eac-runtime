// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystem } from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';

export async function loadPreactAppPageHandler(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
): Promise<[EaCRuntimeHandlerResult, ComponentType<any>, boolean, string]> {
  const { module, contents } = await importDFSTypescriptModule(
    fileHandler,
    filePath,
    dfs,
    'tsx',
  );

  const component: ComponentType<any> | undefined = module.default;

  if (!component) {
    throw new Deno.errors.NotFound(
      'The page does not have a component to render.',
    );
  }

  const isIsland = 'IsIsland' in module ? module.IsIsland : false;

  let handler: EaCRuntimeHandlerResult | undefined = module.handler;

  if (!handler) {
    handler = (_req, ctx) => {
      return ctx.Render({});
    };
  }

  return [handler, component, isIsland, contents];
}