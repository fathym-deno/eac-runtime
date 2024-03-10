// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCDistributedFileSystem, respond } from '../../src.deps.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerResult } from '../EaCRuntimeHandlerResult.ts';
import { PreactRenderHandler } from './preact/PreactRenderHandler.ts';
import { loadPreactAppPageHandler } from './loadPreactAppPageHandler.ts';
// import { EaCESBuilder } from '../../utils/EaCESBuilder.ts';
// import { loadClientScript } from './islands/loadClientScript.ts';

export async function loadPreactAppHandler(
  fileHandler: DFSFileHandler,
  filePath: string,
  dfs: EaCDistributedFileSystem,
  layouts: [string, ComponentType<any>, boolean, string][],
  renderHandler: PreactRenderHandler,
): Promise<EaCRuntimeHandlerResult> {
  let [pageHandlers, component, isIsland, contents] = await loadPreactAppPageHandler(
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

  // let [clientDepsScript] = await Promise.all([
  //   loadClientScript(`./islands/client/client.deps.ts`, 'ts'),
  // ]);

  // const islands = renderHandler.LoadIslands();

  // const islandNamePaths = Object.keys(islands).map((islandPath) => [
  //   islands[islandPath][0],
  //   islandPath,
  // ]);

  // clientDepsScript += islandNamePaths
  //   .map(
  //     ([islandName, islandPath]) => `import ${islandName} from '${islandPath}';`
  //   )
  //   .join('\n');

  // const islandCompMaps = islandNamePaths.map(
  //   ([islandName]) => `componentMap.set('${islandName}', ${islandName});`
  // );

  // clientDepsScript += islandCompMaps.join('\n');

  // const islandContents = Object.keys(islands).reduce((ic, islandPath) => {
  //   ic[islandPath] = islands[islandPath][1];

  //   return ic;
  // }, {} as Record<string, string>);

  // const clientDepsScriptPath = `./client.deps.ts`;

  // const builder = new EaCESBuilder(
  //   [clientDepsScriptPath], //, ...Object.keys(islandContents)],
  //   {
  //     [clientDepsScriptPath]: clientDepsScript,
  //     ...islandContents,
  //   },
  //   {
  //     external: ['$:./client.deps.ts'],
  //   }
  // );

  // const bundle = await builder.Build({});

  const renderStack: ComponentType<any>[] = [...pageLayouts, component];

  const renderSetupHandler: EaCRuntimeHandler = (_req, ctx) => {
    // const file = bundle.outputFiles!.find(
    //   (outFile) => outFile.path === ctx.Runtime.URLMatch.Path
    // );

    // if (file) {
    //   return new Response(file.text, {
    //     headers: {
    //       'Content-Type': 'application/javascript',
    //       ETag: file.hash,
    //     },
    //   });
    // }

    ctx.Render = async (data) => {
      const html = await renderHandler.RenderPage(renderStack, data, ctx);

      return respond(html);
    };

    return ctx.Next();
  };

  if (!Array.isArray(pageHandlers)) {
    pageHandlers = [pageHandlers];
  }

  return [renderSetupHandler, ...pageHandlers];
}

export function markIslands(root: ComponentType<any>): ComponentType<any> {
  return root;
}
