import {
  PreactRenderHandler,
  EaCRuntimeContext,
  EaCESMDistributedFileSystemHandlerResolver,
  DefaultDFSFileHandlerResolver,
  EaCLocalDistributedFileSystemHandlerResolver,
} from '../../mod.ts';
import { EaCPreactAppHandler } from '../../src/utils/EaCPreactAppHandler.ts';
import {
  assert,
  assertExists,
  assertFalse,
  EaCDistributedFileSystem,
  EaCESMDistributedFileSystem,
  EaCLocalDistributedFileSystem,
  EaCPreactAppProcessor,
  esbuild,
  ESBuild,
  IoCContainer,
  merge,
} from '../test.deps.ts';

async function createEaCPreactAppHandler() {
  const esbuildInstance: ESBuild = await import(
    'https://deno.land/x/esbuild@v0.20.1/mod.js'
  );

  const ioc = new IoCContainer();

  ioc.Register<ESBuild>(() => esbuildInstance, {
    Type: ioc.Symbol('ESBuild'),
  });

  ioc.Register(DefaultDFSFileHandlerResolver, {
    Type: ioc.Symbol('DFSFileHandler'),
  });

  ioc.Register(() => EaCESMDistributedFileSystemHandlerResolver, {
    Name: 'EaCESMDistributedFileSystem',
    Type: ioc.Symbol('DFSFileHandler'),
  });

  ioc.Register(() => EaCLocalDistributedFileSystemHandlerResolver, {
    Name: 'EaCLocalDistributedFileSystem',
    Type: ioc.Symbol('DFSFileHandler'),
  });

  return new EaCPreactAppHandler(
    ioc,
    new PreactRenderHandler({}),
    `./islands/client/eacIslandsClient.ts`,
    `./islands/client/client.deps.ts`,
    {
      preact: 'https://esm.sh/preact@10.20.1',
      'preact/': 'https://esm.sh/preact@10.20.1/',
    },
    {
      outdir: Deno.cwd(),
    }
  );
}

Deno.test('Preact App Build Tests', async (t) => {
  Deno.env.set('EAC_RUNTIME_DEV', 'true');

  const builder = await createEaCPreactAppHandler();

  const dfss: Record<string, EaCDistributedFileSystem> = {
    'local:apps/components': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/components/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
    } as EaCLocalDistributedFileSystem,
    'local:apps/simple': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/simple/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
    } as EaCLocalDistributedFileSystem,
    'local:apps/single-island-esm': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/single-island-esm/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
    } as EaCLocalDistributedFileSystem,
    'local:apps/single-island-local': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/single-island-local/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
    } as EaCLocalDistributedFileSystem,
    'esm:fathym_atomic_design_kit': {
      Type: 'ESM',
      Root: 'https://deno.land/x/fathym_atomic_design_kit@v0.0.108/',
      EntryPoints: ['mod.ts'],
      IncludeDependencies: true,
    } as EaCESMDistributedFileSystem,
  };

  // await t.step('Handle Preact App - No Islands', async (t) => {
  //   const processor: EaCPreactAppProcessor = {
  //     Type: 'PreactApp',
  //     AppDFSLookup: 'local:apps/simple',
  //     ComponentDFSLookups: [],
  //   };

  //   await builder.Configure(processor, dfss, Date.now());

  //   await builder.Build(processor, undefined, {});

  //   await t.step('Check Client Script', async () => {
  //     const resp = await builder.Execute(
  //       processor,
  //       new Request(new URL('http://localhost/eacIslandsClient.js')),
  //       {
  //         Runtime: {
  //           URLMatch: {
  //             Base: 'http://localhost',
  //             Path: '/eacIslandsClient.js',
  //           },
  //         },
  //       } as EaCRuntimeContext
  //     );

  //     const respText = await resp.text();

  //     assertExists(respText);
  //     assert(
  //       respText.includes('var componentMap = /* @__PURE__ */ new Map();')
  //     );
  //   });

  //   await t.step('Check Client Deps Script', async () => {
  //     const resp = await builder.Execute(
  //       processor,
  //       new Request(new URL('http://localhost/eacIslandsClient.js.map')),
  //       {
  //         Runtime: {
  //           URLMatch: {
  //             Base: 'http://localhost',
  //             Path: '/eacIslandsClient.js.map',
  //           },
  //         },
  //       } as EaCRuntimeContext
  //     );

  //     const respText = await resp.text();

  //     assertExists(respText);
  //     assert(
  //       respText.includes(
  //         'export const componentMap: Map<string, ComponentType> = new Map();'
  //       )
  //     );
  //   });

  //   await t.step('Check Index Render', async () => {
  //     const resp = await builder.Execute(
  //       processor,
  //       new Request(new URL('http://localhost/')),
  //       {
  //         Runtime: {
  //           URLMatch: {
  //             Base: 'http://localhost',
  //             Path: '/',
  //           },
  //         },
  //       } as EaCRuntimeContext
  //     );

  //     const respText = await resp.text();

  //     console.log(respText);

  //     console.log(respText);

  //     assertExists(respText);
  //     assert(respText.includes('<!DOCTYPE html>'));
  //     assert(respText.includes('<script type="importmap">'));
  //     assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
  //     assertFalse(respText.includes('./eacIslandsClient.js?revision='));
  //   });
  // });

  console.log();

  // await t.step('Handle Preact App - Local Only', async (t) => {
  //   const processor: EaCPreactAppProcessor = {
  //     Type: 'PreactApp',
  //     AppDFSLookup: 'local:apps/single-island-local',
  //     ComponentDFSLookups: [['local:apps/components', ['tsx']]],
  //   };

  //   await builder.Configure(processor, dfss, Date.now());

  //   await builder.Build(processor, undefined, {});

  //   await t.step('Check Client Script', async () => {
  //     const resp = await builder.Execute(
  //       processor,
  //       new Request(new URL('http://localhost/eacIslandsClient.js')),
  //       {
  //         Runtime: {
  //           URLMatch: {
  //             Base: 'http://localhost',
  //             Path: '/eacIslandsClient.js',
  //           },
  //         },
  //       } as EaCRuntimeContext
  //     );

  //     const respText = await resp.text();

  //     assertExists(respText);
  //     assert(
  //       respText.includes('var componentMap = /* @__PURE__ */ new Map();')
  //     );
  //     assert(respText.includes(`componentMap.set("Counter", Counter);`));
  //   });

  //   await t.step('Check Client Deps Script', async () => {
  //     const resp = await builder.Execute(
  //       processor,
  //       new Request(new URL('http://localhost/eacIslandsClient.js.map')),
  //       {
  //         Runtime: {
  //           URLMatch: {
  //             Base: 'http://localhost',
  //             Path: '/eacIslandsClient.js.map',
  //           },
  //         },
  //       } as EaCRuntimeContext
  //     );

  //     const respText = await resp.text();

  //     assertExists(respText);
  //     assert(
  //       respText.includes(
  //         'export const componentMap: Map<string, ComponentType> = new Map();'
  //       )
  //     );
  //     assert(respText.includes(`componentMap.set('Counter', Counter);`));
  //   });

  //   await t.step('Check Index Render', async () => {
  //     const resp = await builder.Execute(
  //       processor,
  //       new Request(new URL('http://localhost/')),
  //       {
  //         Runtime: {
  //           URLMatch: {
  //             Base: 'http://localhost',
  //             Path: '/',
  //           },
  //         },
  //       } as EaCRuntimeContext
  //     );

  //     const respText = await resp.text();

  //     console.log(respText);

  //     assertExists(respText);
  //     assert(respText.includes('<!DOCTYPE html>'));
  //     assert(respText.includes('<script type="importmap">'));
  //     assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
  //     assert(respText.includes('./eacIslandsClient.js?revision='));
  //   });
  // });

  await t.step('Handle Preact App - ESM Only', async () => {
    const processor: EaCPreactAppProcessor = {
      Type: 'PreactApp',
      AppDFSLookup: 'local:apps/single-island-esm',
      ComponentDFSLookups: [['esm:fathym_atomic_design_kit', ['tsx']]],
    };

    await builder.Configure(processor, dfss, Date.now());

    await builder.Build(processor);

    await t.step('Check Client Script', async () => {
      const resp = await builder.Execute(
        processor,
        new Request(new URL('http://localhost/eacIslandsClient.js')),
        {
          Runtime: {
            URLMatch: {
              Base: 'http://localhost',
              Path: '/eacIslandsClient.js',
            },
          },
        } as EaCRuntimeContext
      );

      const respText = await resp.text();

      assertExists(respText);
      assert(
        respText.includes('var componentMap = /* @__PURE__ */ new Map();')
      );
      assert(respText.includes(`componentMap.set("Counter", Counter);`));
    });

    await t.step('Check Client Deps Script', async () => {
      const resp = await builder.Execute(
        processor,
        new Request(new URL('http://localhost/eacIslandsClient.js.map')),
        {
          Runtime: {
            URLMatch: {
              Base: 'http://localhost',
              Path: '/eacIslandsClient.js.map',
            },
          },
        } as EaCRuntimeContext
      );

      const respText = await resp.text();

      assertExists(respText);
      assert(
        respText.includes(
          'export const componentMap: Map<string, ComponentType> = new Map();'
        )
      );
      assert(respText.includes(`componentMap.set('Counter', Counter);`));
    });

    await t.step('Check Index Render', async () => {
      const resp = await builder.Execute(
        processor,
        new Request(new URL('http://localhost/')),
        {
          Runtime: {
            URLMatch: {
              Base: 'http://localhost',
              Path: '/',
            },
          },
        } as EaCRuntimeContext
      );

      const respText = await resp.text();

      console.log(respText);

      assertExists(respText);
      assert(respText.includes('<!DOCTYPE html>'));
      assert(respText.includes('<script type="importmap">'));
      assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
      assert(respText.includes('./eacIslandsClient.js?revision='));
    });
  });

  // await t.step('Handle Preact App - Local & ESM', async () => {
  //   const processor: EaCPreactAppProcessor = {
  //     Type: 'PreactApp',
  //     AppDFSLookup: 'local:apps/simple',
  //     ComponentDFSLookups: [
  //       ['local:apps/components', ['tsx']],
  //       ['esm:fathym_atomic_design_kit', ['tsx']],
  //     ],
  //   };

  //   await builder.Configure(processor, dfss, Date.now());

  //   await builder.Build(processor);
  // });

  await esbuild.stop();
});
