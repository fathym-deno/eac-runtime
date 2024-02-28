import {
  EaCDFSProcessor,
  EaCKeepAliveModifierDetails,
  EaCNPMDistributedFileSystem,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  EaCTracingModifierDetails,
} from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymDemoPlugin implements EaCRuntimePlugin {
  constructor(protected port?: number) {}

  public Build(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymDemoPlugin',
      EaC: {
        Projects: {
          demo: {
            Details: {
              Name: 'Demo Micro Applications',
              Description: 'The Demo Micro Applications to use.',
              Priority: 100,
            },
            LookupConfigs: {
              dev: {
                Hostname: 'localhost',
                Port: this.port || config.Server.port || 8000,
              },
            },
            ModifierLookups: ['keepAlive'],
            ApplicationLookups: {
              apiProxy: {
                PathPattern: '/api-reqres*',
                Priority: 200,
              },
              fathym: {
                PathPattern: '/fathym',
                Priority: 200,
              },
              home: {
                PathPattern: '/*',
                Priority: 100,
              },
              publicWebBlog: {
                PathPattern: '/blog*',
                Priority: 500,
              },
            },
          },
        },
        Applications: {
          apiProxy: {
            Details: {
              Name: 'Simple API Proxy',
              Description: 'A proxy',
            },
            ModifierLookups: ['tracing'],
            Processor: {
              ProxyRoot: 'https://reqres.in/api',
            } as EaCProxyProcessor,
          },
          fathym: {
            Details: {
              Name: 'Fathym Redirect',
              Description: 'A redirect to Fathym',
            },
            Processor: {
              Redirect: 'http://www.fathym.com/',
            } as EaCRedirectProcessor,
          },
          home: {
            Details: {
              Name: 'Home Site',
              Description: 'The home site to be used for the marketing of the project',
            },
            Processor: {},
          },
          publicWebBlog: {
            Details: {
              Name: 'Public Web Blog Site',
              Description: 'The public web blog site to be used for the marketing of the project',
            },
            ModifierLookups: ['denoKvCache'],
            Processor: {
              DFS: {
                DefaultFile: 'index.html',
                Package: '@lowcodeunit/public-web-blog',
                Version: 'latest',
              } as EaCNPMDistributedFileSystem,
            } as EaCDFSProcessor,
          },
        },
        Modifiers: {
          keepAlive: {
            Details: {
              Name: 'Deno KV Cache',
              Description: 'Lightweight cache to use that stores data in a DenoKV database.',
              KeepAlivePath: '/_eac/alive',
              Priority: 1000,
            } as EaCKeepAliveModifierDetails,
          },
          tracing: {
            Details: {
              Name: 'Deno KV Cache',
              Description: 'Lightweight cache to use that stores data in a DenoKV database.',
              TraceRequest: true,
              TraceResponse: true,
              Priority: 1500,
            } as EaCTracingModifierDetails,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
