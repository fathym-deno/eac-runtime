import {
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVDatabaseDetails,
  EaCDFSProcessor,
  EaCKeepAliveModifierDetails,
  EaCLocalDistributedFileSystem,
  EaCMarkdownToHTMLModifierDetails,
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
            ResolverConfigs: {
              dev: {
                Hostname: 'localhost',
                Port: this.port || config.Server.port || 8000,
              },
              dev2: {
                Hostname: '127.0.0.1',
                Port: this.port || config.Server.port || 8000,
              },
            },
            ModifierResolvers: {
              keepAlive: {
                Priority: 1000,
              },
            },
            ApplicationResolvers: {
              apiProxy: {
                PathPattern: '/api-reqres*',
                Priority: 200,
              },
              fathym: {
                PathPattern: '/redirect',
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
            ModifierResolvers: {
              tracing: {
                Priority: 1500,
              },
            },
            Processor: {
              Type: 'Proxy',
              ProxyRoot: 'https://reqres.in/api',
            } as EaCProxyProcessor,
          },
          fathym: {
            Details: {
              Name: 'Fathym Redirect',
              Description: 'A redirect to Fathym',
            },
            Processor: {
              Type: 'Redirect',
              Redirect: 'http://www.fathym.com/',
            } as EaCRedirectProcessor,
          },
          home: {
            Details: {
              Name: 'Home Site',
              Description: 'The home site to be used for the marketing of the project',
            },
            ModifierResolvers: {
              denoKvCache: {
                Priority: 500,
              },
              markdown: {
                Priority: 10,
              },
            },
            Processor: {
              Type: 'DFS',
              DFS: {
                Type: 'Local',
                DefaultFile: 'README.md',
                FileRoot: './',
              } as EaCLocalDistributedFileSystem,
            } as EaCDFSProcessor,
          },
          publicWebBlog: {
            Details: {
              Name: 'Public Web Blog Site',
              Description: 'The public web blog site to be used for the marketing of the project',
            },
            ModifierResolvers: {
              denoKvCache: {
                Priority: 500,
              },
            },
            Processor: {
              Type: 'DFS',
              DFS: {
                Type: 'NPM',
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
              Type: 'KeepAlive',
              Name: 'Keep Alive',
              Description: 'Modifier to support a keep alive workflow.',
              KeepAlivePath: '/_eac/alive',
            } as EaCKeepAliveModifierDetails,
          },
          markdown: {
            Details: {
              Type: 'MarkdownToHTML',
              Name: 'Markdown to HTML',
              Description: 'A modifier to convert markdown to HTML.',
            } as EaCMarkdownToHTMLModifierDetails,
          },
          denoKvCache: {
            Details: {
              Type: 'DenoKVCache',
              Name: 'DenoKV Cache',
              Description:
                'Lightweight cache to use that stores data in a DenoKV database for static sites.',
              DenoKVDatabaseLookup: 'cache',
              CacheSeconds: 60 * 20,
            } as EaCDenoKVCacheModifierDetails,
          },
          tracing: {
            Details: {
              Type: 'Tracing',
              Name: 'Tracing',
              Description: 'Allows for tracing of requests and responses.',
              TraceRequest: true,
              TraceResponse: true,
            } as EaCTracingModifierDetails,
          },
        },
        Databases: {
          cache: {
            Details: {
              Type: 'DenoKV',
              Name: 'Local Cache',
              Description: 'The Deno KV database to use for local caching',
              DenoKVPath: Deno.env.get('LOCAL_CACHE_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDatabaseDetails,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
