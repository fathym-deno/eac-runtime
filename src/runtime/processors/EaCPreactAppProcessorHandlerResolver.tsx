import {
  ComponentType,
  EaCDistributedFileSystem,
  EaCPreactAppProcessor,
  ESBuild,
  isEaCPreactAppProcessor,
} from '../../src.deps.ts';
import { importDFSTypescriptModule } from '../../utils/dfs/importDFSTypescriptModule.ts';
import { loadLayout } from '../apps/loadLayout.ts';
import { ProcessorHandlerResolver } from './ProcessorHandlerResolver.ts';
import { DFSFileHandler } from '../dfs/DFSFileHandler.ts';
import { loadFileHandler } from '../../utils/dfs/loadFileHandler.ts';
import { loadMiddleware } from '../../utils/dfs/loadMiddleware.ts';
import { loadRequestPathPatterns } from '../../utils/dfs/loadRequestPathPatterns.ts';
import { loadPreactAppHandler } from '../apps/loadPreactAppHandler.ts';
import { PreactRenderHandler } from '../apps/preact/PreactRenderHandler.ts';
import { EaCESBuilder } from '../../utils/EaCESBuilder.ts';
import { loadClientScript } from '../apps/islands/loadClientScript.ts';
import { executePathMatch } from '../../utils/dfs/executePathMatch.ts';
import { EaCRuntimeHandler } from '../EaCRuntimeHandler.ts';
import { EaCRuntimeHandlerPipeline } from '../EaCRuntimeHandlerPipeline.ts';
import { EaCPreactAppHandler } from '../../utils/EaCPreactAppHandler.ts';

export const EaCPreactAppProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCPreactAppProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        'The provided processor is not supported for the EaCPreactAppProcessorHandlerResolver.',
      );
    }

    const processor = appProcCfg.Application.Processor as EaCPreactAppProcessor;

    // const renderHandler = await ioc.Resolve(PreactRenderHandler);

    // const esbuild = await ioc.Resolve<ESBuild>(ioc.Symbol('ESBuild'));

    // const appDFS = eac.DFS![processor.AppDFSLookup];

    // const componentDFSs = processor.ComponentDFSLookups?.map(
    //   ([compDFSLookup, extensions]) => {
    //     return [eac.DFS![compDFSLookup], extensions] as [
    //       EaCDistributedFileSystem,
    //       string[],
    //     ];
    //   },
    // );

    // async function setup(fileHandler: DFSFileHandler) {
    //   const components: Record<string, string> = {};

    //   const patterns = await loadRequestPathPatterns(
    //     fileHandler,
    //     appDFS,
    //     async (allPaths) => {
    //       const middlewareLoader = async () => {
    //         const middlewarePaths = allPaths
    //           .filter((p) => p.endsWith('_middleware.ts'))
    //           .sort((a, b) => a.split('/').length - b.split('/').length);

    //         const middlewareCalls = middlewarePaths.map((p) => {
    //           return loadMiddleware(esbuild, fileHandler, p, appDFS);
    //         });

    //         return (await Promise.all(middlewareCalls))
    //           .filter((m) => m)
    //           .map((m) => m!);
    //       };

    //       const layoutLoader = async () => {
    //         const layoutPaths = allPaths
    //           .filter((p) => p.endsWith('_layout.tsx'))
    //           .sort((a, b) => a.split('/').length - b.split('/').length);

    //         const layoutCalls = layoutPaths.map((p) => {
    //           return loadLayout(esbuild, fileHandler, p, appDFS);
    //         });

    //         return await Promise.all(layoutCalls);
    //       };

    //       const compLoader = async () => {
    //         if (componentDFSs) {
    //           const loadCompDFS = async (
    //             componentDFS: EaCDistributedFileSystem,
    //             extensions: string[],
    //           ) => {
    //             const componentFileHandler = await loadFileHandler(
    //               ioc,
    //               componentDFS,
    //             );

    //             const compPaths = await componentFileHandler!.LoadAllPaths(
    //               appProcCfg.Revision,
    //             );

    //             const loadComponent = async (
    //               compPath: string,
    //             ): Promise<
    //               [string, ComponentType<any>, boolean, string] | undefined
    //             > => {
    //               const compModule = await importDFSTypescriptModule(
    //                 esbuild,
    //                 componentFileHandler!,
    //                 compPath,
    //                 componentDFS,
    //                 'tsx',
    //               );

    //               if (compModule) {
    //                 const { module, contents } = compModule;

    //                 const comp: ComponentType<any> | undefined = module.default;

    //                 if (comp) {
    //                   const isCompIsland = 'IsIsland' in module ? module.IsIsland : false;

    //                   return [compPath, comp, isCompIsland, contents];
    //                 }
    //               }

    //               return undefined;
    //             };

    //             const compCalls = compPaths
    //               .filter((cp) => extensions.some((ext) => cp.endsWith(`.${ext}`)))
    //               .map((compPath) => loadComponent(compPath));

    //             return await Promise.all(compCalls);
    //           };

    //           const compDFSCalls = componentDFSs.map(([cd, extensions]) =>
    //             loadCompDFS(cd, extensions)
    //           );

    //           const compDFSs = await Promise.all(compDFSCalls);

    //           return compDFSs.flatMap((cd) => cd).filter((c) => c) as [
    //             string,
    //             ComponentType<any>,
    //             boolean,
    //             string,
    //           ][];
    //         }
    //       };

    //       const [middleware, layouts, compDFSs] = await Promise.all([
    //         middlewareLoader(),
    //         layoutLoader(),
    //         compLoader(),
    //       ]);

    //       console.log('Middleware: ');
    //       console.log(middleware.map((m) => m[0]));
    //       console.log();

    //       layouts.forEach(([root, layout, isIsland, contents]) => {
    //         if (isIsland) {
    //           renderHandler.AddIsland(layout, `${root}/_layout.tsx`, contents);
    //         }
    //       });

    //       console.log('Layouts: ');
    //       console.log(layouts.map((m) => m[0]));
    //       console.log();

    //       compDFSs?.forEach(([compPath, comp, isIsland, contents]) => {
    //         if (isIsland) {
    //           renderHandler.AddIsland(comp, compPath, contents);
    //         } else {
    //           components[compPath] = contents;
    //         }
    //       });

    //       console.log('Components Loaded');
    //       console.log();

    //       return { middleware, layouts, compDFSs };
    //     },
    //     async (filePath, { layouts }) => {
    //       return await loadPreactAppHandler(
    //         esbuild,
    //         fileHandler,
    //         filePath,
    //         appDFS,
    //         layouts,
    //         renderHandler,
    //       );
    //     },
    //     (filePath, pipeline, { middleware }) => {
    //       const reqMiddleware = middleware
    //         .filter(([root]) => {
    //           return filePath.startsWith(root);
    //         })
    //         .flatMap(([_root, handler]) => Array.isArray(handler) ? handler : [handler]);

    //       pipeline.Prepend(...reqMiddleware);
    //     },
    //     appProcCfg.Revision,
    //   );

    //   // TODO(mcgear): Move client.deps.ts resolution to per request with revision cache so
    //   //    that only the islands used per request are shipped to the client
    //   let [clientScript, clientDepsScript] = await Promise.all([
    //     loadClientScript(
    //       esbuild,
    //       `./islands/client/eacIslandsClient.tsx`,
    //       'tsx',
    //     ),
    //     loadClientScript(esbuild, `./islands/client/client.deps.ts`, 'ts'),
    //   ]);

    //   const islands = renderHandler.LoadIslands();

    //   const islandNamePaths = Object.keys(islands).map((islandPath) => [
    //     islands[islandPath][0],
    //     islandPath,
    //   ]);

    //   clientDepsScript += islandNamePaths
    //     .map(
    //       ([islandName, islandPath]) => `import ${islandName} from '${islandPath}';`,
    //     )
    //     .join('\n');

    //   console.log(islandNamePaths);

    //   const islandCompMaps = islandNamePaths.map(
    //     ([islandName]) => `componentMap.set('${islandName}', ${islandName});`,
    //   );

    //   clientDepsScript += islandCompMaps.join('\n');

    //   const islandContents = Object.keys(islands).reduce((ic, islandPath) => {
    //     ic[islandPath] = islands[islandPath][1];

    //     return ic;
    //   }, {} as Record<string, string>);

    //   console.log(islandContents);

    //   const clientScriptPath = `./eacIslandsClient.tsx`;

    //   const clientDepsScriptPath = `./client.deps.ts`;

    //   const builder = new EaCESBuilder(
    //     esbuild,
    //     fileHandler.Root,
    //     [clientScriptPath],
    //     {
    //       [clientScriptPath]: clientScript,
    //       [clientDepsScriptPath]: clientDepsScript,
    //       ...islandContents,
    //       ...components,
    //     },
    //   );

    //   const bundle = await builder.Build({});

    //   bundle.outputFiles = bundle.outputFiles!.map((outFile) => {
    //     if (outFile.path.endsWith('eacIslandsClient.js')) {
    //       outFile.path = `eacIslandsClient.js`;
    //     } else if (outFile.path.endsWith('eacIslandsClient.js.map')) {
    //       outFile.path = `eacIslandsClient.js.map`;
    //     }

    //     return outFile;
    //   });

    //   const bundleHandler: EaCRuntimeHandler = (_req, ctx) => {
    //     const file = bundle.outputFiles!.find((outFile) => {
    //       return ctx.Runtime.URLMatch.Path.endsWith(outFile.path);
    //     });

    //     if (file) {
    //       return new Response(file.text, {
    //         headers: {
    //           'Content-Type': 'application/javascript',
    //           ETag: file.hash,
    //         },
    //       });
    //     }

    //     return ctx.Next();
    //   };

    //   const pipeline = new EaCRuntimeHandlerPipeline();

    //   pipeline.Append(bundleHandler);

    //   pipeline.Append((req, ctx) => {
    //     return executePathMatch(patterns, req, ctx, 'text/html; charset=utf-8');
    //   });

    //   return pipeline;
    // }

    // const fileHandler = await loadFileHandler(ioc, appDFS);

    // const pipeline = await setup(fileHandler!);

    const handler = new EaCPreactAppHandler(
      ioc,
      `./islands/client/eacIslandsClient.ts`,
      `./islands/client/client.deps.ts`,
      undefined,
      {
        outdir: Deno.cwd(),
      },
    );

    await handler.Configure(processor, eac.DFS || {}, Date.now());

    await handler.Build(processor, undefined, {});

    return (req, ctx) => {
      // return pipeline.Execute(req, ctx);

      return handler.Execute(processor, req, ctx);
    };
  },
};
