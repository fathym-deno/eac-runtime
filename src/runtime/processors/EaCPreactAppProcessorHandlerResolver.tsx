// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCPreactAppProcessor, isEaCPreactAppProcessor } from '../../src.deps.ts';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';
import { loadLayout } from '../apps/loadLayout.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadPreactAppHandler } from '../apps/loadPreactAppHandler.ts';
import { PreactRenderHandler } from '../apps/preact/PreactRenderHandler.ts';
import { loadIslandClientScript } from '../apps/islands/loadIslandClientScript.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';

export const EaCPreactAppProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCPreactAppProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    const renderHandler = await ioc.Resolve(PreactRenderHandler);

    const appDFS = eac.DFS![processor.AppDFSLookup];

    const componentDFSs = processor.ComponentDFSLookups?.map((compDFSLookup) =>
      eac.DFS![compDFSLookup]
    );

    const patternsReady = filesReadyCheck(ioc, appDFS).then(
      (fileHandler) => {
        return loadRequestPathPatterns(
          fileHandler,
          appDFS,
          async (allPaths, filePath) => {
            const layoutPaths = allPaths
              .filter((p) => p.endsWith('_layout.tsx'))
              .sort((a, b) => a.split('/').length - b.split('/').length);

            const layoutCalls = layoutPaths.map((p) => {
              return loadLayout(fileHandler, p, appDFS);
            });

            const layouts = await Promise.all(layoutCalls);

            layouts.forEach(([root, layout, isIsland]) => {
              if (isIsland) {
                renderHandler.AddIsland(layout);
              }
            });

            console.log('Layouts: ');
            console.log(layouts.map((m) => m[0]));
            console.log();

            if (componentDFSs) {
              for (const componentDFS of componentDFSs) {
                const componentFileHandler = await filesReadyCheck(
                  ioc,
                  componentDFS,
                );

                const compPaths = await componentFileHandler.LoadAllPaths(
                  appProcCfg.Revision,
                );

                for (const compPath of compPaths) {
                  const compModule = await importDFSTypescriptModule(
                    componentFileHandler,
                    compPath,
                    componentDFS,
                    'tsx',
                  );

                  const comp: ComponentType<any> | undefined = compModule.default;

                  if (comp) {
                    const isCompIsland = 'IsIsland' in compModule ? compModule.IsIsland : false;

                    if (isCompIsland) {
                      renderHandler.AddIsland(comp);
                    }
                  }
                }
              }
            }

            return loadPreactAppHandler(
              fileHandler,
              filePath,
              appDFS,
              layouts,
              renderHandler,
            );
          },
          appProcCfg.Revision,
        ).then((patterns) => {
          console.log(patterns); //.map((p) => p.PatternText));

          return { patterns };
        });
      },
    );

    return async (req, ctx) => {
      const { patterns } = await patternsReady;

      const islandsClientPath = `/eacIslandsClient.ts`;

      if (ctx.Runtime.URLMatch.Path.endsWith(islandsClientPath)) {
        const code = await loadIslandClientScript(islandsClientPath);

        return new Response(code, {
          headers: {
            'cache-control': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
            'Content-Type': 'text/javascript',
          },
        });
      }

      const resp = await executePathMatch(
        patterns,
        req,
        ctx,
        'text/html; charset=utf-8',
      );

      const contType = resp.headers.get('Content-type');

      // TODO(mcgear): call helper methods, or just do this from VNode on body render
      if (
        renderHandler.islandsData.HasData() &&
        contType?.includes('text/html')
      ) {
        // const htmlStr = await resp.clone().text();

        // const doc = new DOMParser().parseFromString(htmlStr, 'text/html');

        // if (doc) {
        //   const base = ctx.Runtime.URLMatch.Base.endsWith('/')
        //     ? ctx.Runtime.URLMatch.Base
        //     : `${ctx.Runtime.URLMatch.Base}/`;

        //   let path = ctx.Runtime.URLMatch.Path.startsWith('/')
        //     ? `.${ctx.Runtime.URLMatch.Path}`
        //     : ctx.Runtime.URLMatch.Path;

        //   path = path.endsWith('/') ? path : `${path}/`;

        //   const clientUrl = new URL(
        //     `.${islandsClientPath}?revision=${appProcCfg.Revision}`,
        //     new URL(path, base)
        //   );

        //   const IslandData = buildIslandData(renderHandler.islandsData);

        //   const islandDataHtml = PreactRenderToString.renderToString(
        //     <IslandData clientModulePath={`${clientUrl.href}`} />
        //   );

        //   const template = doc.createElement('template') as any;
        //   template.innerHTML = islandDataHtml;

        //   doc.body.appendChild(template.content.firstChild);

        //   const docHtml = doc.childNodes[1] as Element;

        //   const fullDoc = `<!DOCTYPE html>\n${docHtml.outerHTML}`;

        //   resp = new Response(fullDoc, resp);
        // }

        // renderHandler.ClearRendering();
      }

      return resp;
    };
  },
};
