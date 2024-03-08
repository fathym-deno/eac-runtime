// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystem, respond } from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';
import { PreactRenderHandler } from './preact/PreactRenderHandler.ts';
import { loadPreactAppPageHandler } from './loadPreactAppPageHandler.ts';
import './preact/PreactRenderHandler.ts';

export async function loadPreactAppHandler(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  layouts: [string, ComponentType<any>, boolean][],
  renderHandler: PreactRenderHandler,
): Promise<EaCRuntimeHandlerResult> {
  let [pageHandlers, component, isIsland] = await loadPreactAppPageHandler(
    fileHandler,
    filePath,
    dfs,
  );

  if (isIsland) {
    renderHandler.AddIsland(component);
  }

  const pageLayouts = layouts
    .filter(([root]) => {
      return filePath.startsWith(root);
    })
    .map(([_root, layout]) => {
      return layout;
    });

  const renderStack: ComponentType<any>[] = [...pageLayouts, component];

  const renderSetupHandler: EaCRuntimeHandler = (_req, ctx) => {
    ctx.Render = async (data) => {
      const html = await renderHandler.RenderPage(
        renderStack,
        data,
        ctx,
      );

      return respond(html);
    };

    return ctx.Next();
  };

  if (!Array.isArray(pageHandlers)) {
    console.log(pageHandlers);
    pageHandlers = [pageHandlers];
  }

  return [renderSetupHandler, ...pageHandlers];
}

export function markIslands(root: ComponentType<any>): ComponentType<any> {
  return root;
}
