import { EaCRuntimeConfig, EaCRuntimePlugin, EaCRuntimePluginConfig } from '@fathym/eac/runtime';
import { EaCAPIProcessor, EaCLocalDistributedFileSystem } from '@fathym/eac';

export default class MyCoreRuntimePlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(config: EaCRuntimeConfig) {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: MyCoreRuntimePlugin.name,
      Plugins: [],
      EaC: {
        Projects: {
          core: {
            Details: {
              Name: 'Core Micro Applications',
              Description: 'The Core Micro Applications to use.',
              Priority: 100,
            },
            ResolverConfigs: {
              localhost: {
                Hostname: 'localhost',
                Port: config.Server.port || 8000,
              },
              '127.0.0.1': {
                Hostname: '127.0.0.1',
                Port: config.Server.port || 8000,
              },
            },
            ModifierResolvers: {},
            ApplicationResolvers: {
              api: {
                PathPattern: '/api*',
                Priority: 100,
              },
            },
          },
        },
        Applications: {
          api: {
            Details: {
              Name: 'Local API',
              Description: 'Default local APIs.',
            },
            Processor: {
              Type: 'API',
              DFSLookup: 'local:apps/api',
            } as EaCAPIProcessor,
          },
        },
        DFS: {
          'local:apps/api': {
            Type: 'Local',
            FileRoot: './apps/api/',
            DefaultFile: 'index.ts',
            Extensions: ['ts'],
          } as EaCLocalDistributedFileSystem,
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
