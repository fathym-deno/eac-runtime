import {
  assert,
  assertExists,
  assertFalse,
  assertStringIncludes,
  delay,
  EaCDistributedFileSystem,
  EaCESMDistributedFileSystem,
  EaCJSRDistributedFileSystem,
  EaCLocalDistributedFileSystem,
  EaCPreactAppProcessor,
  esbuild,
  ESBuild,
  IoCContainer,
  merge,
  preactOptions,
} from '../test.deps.ts';
import {
  DefaultDFSFileHandlerResolver,
  EaCRuntimeContext,
  EaCESMDistributedFileSystemHandlerResolver,
  EaCJSRDistributedFileSystemHandlerResolver,
  EaCLocalDistributedFileSystemHandlerResolver,
  EaCWorkerDistributedFileSystemHandlerResolver,
  PreactRenderHandler,
} from '../../mod.ts';
import { EaCPreactAppHandler } from '../../src/utils/EaCPreactAppHandler.ts';

async function createEaCPreactAppHandler() {
  const esbuildInstance: ESBuild = await import('npm:esbuild@0.20.1');

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

  ioc.Register(() => EaCJSRDistributedFileSystemHandlerResolver, {
    Name: 'EaCJSRDistributedFileSystem',
    Type: ioc.Symbol('DFSFileHandler'),
  });

  ioc.Register(() => EaCLocalDistributedFileSystemHandlerResolver, {
    Name: 'EaCLocalDistributedFileSystem',
    Type: ioc.Symbol('DFSFileHandler'),
  });

  ioc.Register(() => EaCWorkerDistributedFileSystemHandlerResolver, {
    Name: 'EaCWorkerDistributedFileSystem',
    Type: ioc.Symbol('DFSFileHandler'),
  });

  return new EaCPreactAppHandler(
    ioc,
    new PreactRenderHandler(preactOptions),
    `./islands/client/eacIslandsClient.ts`,
    `./islands/client/client.deps.ts`,
    {
      // preact: 'https://esm.sh/preact@10.20.1',
      // 'preact/': 'https://esm.sh/preact@10.20.1/',
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
      WorkerPath: import.meta.resolve(
        '../../src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts'
      ),
    } as EaCLocalDistributedFileSystem,
    'local:apps/simple': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/simple/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
      WorkerPath: import.meta.resolve(
        '../../src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts'
      ),
    } as EaCLocalDistributedFileSystem,
    'local:apps/single-island-atomic': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/single-island-atomic/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
      WorkerPath: import.meta.resolve(
        '../../src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts'
      ),
    } as EaCLocalDistributedFileSystem,
    'local:apps/single-island-local': {
      Type: 'Local',
      FileRoot: './tests/preact/apps/single-island-local/',
      DefaultFile: 'index.tsx',
      Extensions: ['tsx'],
      WorkerPath: import.meta.resolve(
        '../../src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts'
      ),
    } as EaCLocalDistributedFileSystem,
    'esm:fathym_atomic': {
      Type: 'ESM',
      Root: 'https://deno.land/x/fathym_atomic@v0.0.156/',
      EntryPoints: ['mod.ts'],
      IncludeDependencies: true,
      WorkerPath: import.meta.resolve(
        '../../src/runtime/dfs/workers/EaCESMDistributedFileSystemWorker.ts'
      ),
    } as EaCESMDistributedFileSystem,
    'jsr:@fathym/atomic': {
      Type: 'JSR',
      Package: '@fathym/atomic',
      Version: '',
      WorkerPath: import.meta.resolve(
        '../../src/runtime/dfs/workers/EaCJSRDistributedFileSystemWorker.ts'
      ),
    } as EaCJSRDistributedFileSystem,
  };

  await t.step('Handle Preact App - No Islands', async (t) => {
    const processor: EaCPreactAppProcessor = {
      Type: 'PreactApp',
      AppDFSLookup: 'local:apps/simple',
      ComponentDFSLookups: [],
    };

    await builder.Configure(processor, dfss, Date.now());

    await builder.Build(processor, undefined, {});

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

      assertExists(respText);
      assertStringIncludes(respText, '<!DOCTYPE html>');
      assert(respText.includes('<script type="importmap">'));
      assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
      assertFalse(respText.includes('./eacIslandsClient.js?revision='));
    });
  });

  await t.step('Handle Preact App - Local Only', async (t) => {
    const processor: EaCPreactAppProcessor = {
      Type: 'PreactApp',
      AppDFSLookup: 'local:apps/single-island-local',
      ComponentDFSLookups: [['local:apps/components', ['tsx']]],
    };

    await builder.Configure(processor, dfss, Date.now());

    await builder.Build(processor, undefined, {});

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

      assertExists(respText);
      assertStringIncludes(respText, '<!DOCTYPE html>');
      assert(respText.includes('<script type="importmap">'));
      assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
      assert(respText.includes('./eacIslandsClient.js?revision='));
      assert(respText.includes(`"Name":"Counter"`));
    });
  });

  await t.step('Handle Preact App - ESM Only', async (t) => {
    const processor: EaCPreactAppProcessor = {
      Type: 'PreactApp',
      AppDFSLookup: 'local:apps/single-island-atomic',
      ComponentDFSLookups: [['esm:fathym_atomic', ['tsx']]],
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
      assert(
        respText.includes(
          `componentMap.set("ClickOnceAction", ClickOnceAction);`
        )
      );
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
      assert(
        respText.includes(
          `componentMap.set('ClickOnceAction', ClickOnceAction);`
        )
      );
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

      assertExists(respText);
      assertStringIncludes(respText, '<!DOCTYPE html>');
      assert(respText.includes('<script type="importmap">'));
      assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
      assert(respText.includes('./eacIslandsClient.js?revision='));
      assert(respText.includes(`"Name":"ClickOnceAction"`));
    });
  });

  await t.step('Handle Preact App - JSR Only', async (t) => {
    const processor: EaCPreactAppProcessor = {
      Type: 'PreactApp',
      AppDFSLookup: 'local:apps/single-island-atomic',
      ComponentDFSLookups: [['jsr:@fathym/atomic', ['tsx']]],
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
      assert(
        respText.includes(
          `componentMap.set("ClickOnceAction", ClickOnceAction);`
        )
      );
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
      assert(
        respText.includes(
          `componentMap.set('ClickOnceAction', ClickOnceAction);`
        )
      );
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

      assertExists(respText);
      assertStringIncludes(respText, '<!DOCTYPE html>');
      assert(respText.includes('<script type="importmap">'));
      assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
      assert(respText.includes('./eacIslandsClient.js?revision='));
      assert(respText.includes(`"Name":"ClickOnceAction"`));
    });
  });

  await t.step('Handle Preact App - Local & JSR', async (t) => {
    const processor: EaCPreactAppProcessor = {
      Type: 'PreactApp',
      AppDFSLookup: 'local:apps/simple',
      ComponentDFSLookups: [
        ['local:apps/components', ['tsx']],
        ['jsr:@fathym/atomic', ['tsx']],
      ],
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
      assertStringIncludes(
        respText,
        'var componentMap = /* @__PURE__ */ new Map();'
      );
      assertStringIncludes(
        respText,
        `componentMap.set("ClickOnceAction", ClickOnceAction);`
      );
      assertStringIncludes(respText, `componentMap.set("Counter", Counter);`);
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
      assertStringIncludes(
        respText,
        'export const componentMap: Map<string, ComponentType> = new Map();'
      );
      assertStringIncludes(
        respText,
        `componentMap.set('ClickOnceAction', ClickOnceAction);`
      );
      assertStringIncludes(respText, `componentMap.set('Counter', Counter);`);
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

      assertExists(respText);
      assertStringIncludes(respText, '<!DOCTYPE html>');
      assert(respText.includes('<script type="importmap">'));
      assert(respText.includes(`<h1 class="text-4xl">Fathym EaC Runtime</h1>`));
      assert(respText.includes('./eacIslandsClient.js?revision='));
      assert(respText.includes(`"Name":"ClickOnceAction"`));
      assert(respText.includes(`"Name":"Counter"`));
    });
  });

  await esbuild.stop();

  await delay(5000);
});
