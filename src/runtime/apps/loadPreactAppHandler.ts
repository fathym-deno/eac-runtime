// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystem, ESBuild, merge } from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';
import { EaCRuntimeHandlers } from '../EaCRuntimeHandlers.ts';
import { PreactRenderHandler } from './preact/PreactRenderHandler.ts';
import { loadPreactAppPageHandler } from './loadPreactAppPageHandler.ts';

export async function loadPreactAppHandler(
  esbuild: ESBuild,
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  layouts: [
    string,
    ComponentType<any>,
    boolean,
    string,
    EaCRuntimeHandlerResult,
  ][],
  renderHandler: PreactRenderHandler,
): Promise<EaCRuntimeHandlerResult> {
  let [pageHandlers, component, isIsland, contents] = await loadPreactAppPageHandler(
    esbuild,
    fileHandler,
    filePath,
    dfs,
  );

  if (isIsland) {
    renderHandler.AddIsland(component, filePath, contents);
  }

  const pageLayouts = layouts
    .filter(([root]) => {
      return filePath.startsWith(root);
    })
    .map(([_root, layout]) => {
      return layout;
    });

  let pageLayoutHandlers:
    | EaCRuntimeHandlerResult[]
    | (EaCRuntimeHandler | EaCRuntimeHandlers)[] = layouts
      .filter(([root]) => {
        return filePath.startsWith(root);
      })
      .map(([_root, _layout, _isIsland, _contents, layoutHandler]) => {
        return layoutHandler;
      });

  const renderStack: ComponentType<any>[] = [...pageLayouts, component];

  const renderSetupHandler: EaCRuntimeHandler = (_req, ctx) => {
    ctx.Render = async (data = {}) => {
      ctx.Data = merge(ctx.Data || {}, data ?? {});

      const html = await renderHandler.RenderPage(renderStack, ctx);

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    };

    return ctx.Next();
  };

  if (!Array.isArray(pageHandlers)) {
    pageHandlers = [pageHandlers];
  }

  const pipeline = new EaCRuntimeHandlerPipeline();

  pipeline.Append(renderSetupHandler);

  if (pageLayoutHandlers && !Array.isArray(pageLayoutHandlers)) {
    pageLayoutHandlers = [
      pageLayoutHandlers as EaCRuntimeHandler | EaCRuntimeHandlers,
    ] as (EaCRuntimeHandler | EaCRuntimeHandlers)[];
  }

  pipeline.Append(
    ...(pageLayoutHandlers as (EaCRuntimeHandler | EaCRuntimeHandlers)[]),
  );

  pipeline.Append(...pageHandlers);

  return (req, ctx) => {
    return pipeline.Execute(req, ctx);
  };
}

export function markIslands(root: ComponentType<any>): ComponentType<any> {
  return root;
}
