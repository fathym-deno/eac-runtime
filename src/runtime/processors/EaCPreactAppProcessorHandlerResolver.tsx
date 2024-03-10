// deno-lint-ignore-file no-explicit-any
import { ComponentType, EaCPreactAppProcessor, isEaCPreactAppProcessor } from '../../src.deps.ts';
import { EaCDistributedFileSystem } from '@fathym/eac';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';
import { loadLayout } from '../apps/loadLayout.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { filesReadyCheck } from '../../utils/dfs/filesReadyCheck.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadPreactAppHandler } from '../apps/loadPreactAppHandler.ts';
import { PreactRenderHandler } from '../apps/preact/PreactRenderHandler.ts';
import { EaCESBuilder } from '../../utils/EaCESBuilder.ts';
import { loadClientScript } from '../apps/islands/loadClientScript.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';

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

    const componentDFSs = processor.ComponentDFSLookups?.map(
      (compDFSLookup) => eac.DFS![compDFSLookup],
    );

    async function setup(fileHandler: DFSFileHandler) {
      const patterns = await loadRequestPathPatterns(
        fileHandler,
        appDFS,
        async (allPaths, filePath) => {
          const layoutLoader = async () => {
            const layoutPaths = allPaths
              .filter((p) => p.endsWith('_layout.tsx'))
              .sort((a, b) => a.split('/').length - b.split('/').length);

            const layoutCalls = layoutPaths.map((p) => {
              return loadLayout(fileHandler, p, appDFS);
            });

            return await Promise.all(layoutCalls);
          };

          const compLoader = async () => {
            if (componentDFSs) {
              const loadCompDFS = async (
                componentDFS: EaCDistributedFileSystem,
              ) => {
                const componentFileHandler = await filesReadyCheck(
                  ioc,
                  componentDFS,
                );

                const compPaths = await componentFileHandler.LoadAllPaths(
                  appProcCfg.Revision,
                );

                const loadComponent = async (
                  compPath: string,
                ): Promise<[string, ComponentType<any>, boolean, string]> => {
                  const { module: compModule, contents } = await importDFSTypescriptModule(
                    componentFileHandler,
                    compPath,
                    componentDFS,
                    'tsx',
                  );

                  const comp: ComponentType<any> | undefined = compModule.default;

                  if (comp) {
                    const isCompIsland = 'IsIsland' in compModule ? compModule.IsIsland : false;

                    return [compPath, comp, isCompIsland, contents];
                  }

                  throw new Deno.errors.NotFound(
                    `Unable to load component for '${compPath}'`,
                  );
                };

                const compCalls = compPaths.map((compPath) => loadComponent(compPath));

                return await Promise.all(compCalls);
              };

              const compDFSCalls = componentDFSs.map((cd) => loadCompDFS(cd));

              const compDFSs = await Promise.all(compDFSCalls);

              return compDFSs.flatMap((cd) => cd);
            }
          };

          const [layouts, compDFSs] = await Promise.all([
            layoutLoader(),
            compLoader(),
          ]);
          layouts.forEach(([root, layout, isIsland, contents]) => {
            if (isIsland) {
              renderHandler.AddIsland(layout, `${root}/_layout.tsx`, contents);
            }
          });

          console.log('Layouts: ');
          console.log(layouts.map((m) => m[0]));
          console.log();

          compDFSs?.forEach(([compPath, comp, isIsland, contents]) => {
            if (isIsland) {
              renderHandler.AddIsland(comp, compPath, contents);
            }
          });

          console.log('Components Loaded');
          console.log();

          const patterns = loadPreactAppHandler(
            fileHandler,
            filePath,
            appDFS,
            layouts,
            renderHandler,
          );

          return patterns;
        },
        appProcCfg.Revision,
      );

      console.log('Apps');
      console.log(patterns.map((p) => p.PatternText));
      console.log();

      // TODO(mcgear): Move client.deps.ts resolution to per request with revision cache so
      //    that only the islands used per request are shipped to the client
      let [clientScript, clientDepsScript] = await Promise.all([
        loadClientScript(`./islands/client/eacIslandsClient.tsx`, 'tsx'),
        loadClientScript(`./islands/client/client.deps.ts`, 'ts'),
      ]);

      const islands = renderHandler.LoadIslands();

      const islandNamePaths = Object.keys(islands).map((islandPath) => [
        islands[islandPath][0],
        islandPath,
      ]);

      clientDepsScript += islandNamePaths
        .map(
          ([islandName, islandPath]) => `import ${islandName} from '${islandPath}';`,
        )
        .join('\n');

      const islandCompMaps = islandNamePaths.map(
        ([islandName]) => `componentMap.set('${islandName}', ${islandName});`,
      );

      clientDepsScript += islandCompMaps.join('\n');

      const islandContents = Object.keys(islands).reduce((ic, islandPath) => {
        ic[islandPath] = islands[islandPath][1];

        return ic;
      }, {} as Record<string, string>);

      const clientScriptPath = `./eacIslandsClient.tsx`;

      const clientDepsScriptPath = `./client.deps.ts`;

      const builder = new EaCESBuilder(
        [clientScriptPath],
        {
          [clientScriptPath]: clientScript,
          [clientDepsScriptPath]: clientDepsScript,
          ...islandContents,
        },
        {
          // external: [clientDepsScriptPath],
        },
      );

      const bundle = await builder.Build({});

      // bundle
      //   .outputFiles!.filter(
      //     (outFile) => !clientScriptPath.endsWith(outFile.path)
      //   )
      //   .forEach((outFile) => renderHandler.AddClientImport(outFile.path));

      const bundleHandler: EaCRuntimeHandler = (_req, ctx) => {
        const file = bundle.outputFiles!.find(
          (outFile) => outFile.path === ctx.Runtime.URLMatch.Path,
        );

        if (file) {
          return new Response(file.text, {
            headers: {
              'Content-Type': 'application/javascript',
              ETag: file.hash,
            },
          });
        }

        return ctx.Next();
      };

      const pipeline = new EaCRuntimeHandlerPipeline();

      pipeline.Append(bundleHandler);

      pipeline.Append((req, ctx) => {
        return executePathMatch(patterns, req, ctx, 'text/html; charset=utf-8');
      });

      return pipeline;
    }

    const patternsReady = filesReadyCheck(ioc, appDFS).then((fileHandler) => {
      return setup(fileHandler);
    });

    return async (req, ctx) => {
      const pipeline = await patternsReady;

      const resp = await pipeline.Execute(req, ctx);

      return resp;
    };
  },
};
