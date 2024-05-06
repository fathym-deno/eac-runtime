import {
  EaCAPIProcessor,
  EaCBaseHREFModifierDetails,
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVDatabaseDetails,
  EaCDFSProcessor,
  EaCKeepAliveModifierDetails,
  EaCLocalDistributedFileSystem,
  EaCMarkdownToHTMLModifierDetails,
  EaCNPMDistributedFileSystem,
  EaCPreactAppProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  EaCTailwindProcessor,
  EaCTracingModifierDetails,
} from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymDemoPlugin implements EaCRuntimePlugin {
  constructor(protected port?: number) {}

  public Setup(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
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
              apiLocalProxy: {
                PathPattern: '/api-local*',
                Priority: 500,
              },
              apiReqResProxy: {
                PathPattern: '/api-reqres*',
                Priority: 200,
              },
              fathym: {
                PathPattern: '/redirect',
                Priority: 200,
              },
              home: {
                PathPattern: '*',
                Priority: 100,
              },
              publicWebBlog: {
                PathPattern: '/blog*',
                Priority: 500,
              },
              tailwind: {
                PathPattern: '/tailwind*',
                Priority: 500,
              },
            },
          },
        },
        Applications: {
          apiLocalProxy: {
            Details: {
              Name: 'Simple Local API Proxy',
              Description: 'A proxy for local API development.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'API',
              DFSLookup: 'local:apps/api',
              DefaultContentType: 'application/json',
            } as EaCAPIProcessor,
          },
          apiReqResProxy: {
            Details: {
              Name: 'Simple API Proxy for ReqRes',
              Description: 'A proxy demonstrating how to connect to an API, via reqres.in',
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
            ModifierResolvers: {},
            Processor: {
              Type: 'PreactApp',
              AppDFSLookup: 'local:apps/home',
              ComponentDFSLookups: [['local:apps/components', ['tsx']]],
            } as EaCPreactAppProcessor,
          },
          publicWebBlog: {
            Details: {
              Name: 'Public Web Blog Site',
              Description: 'The public web blog site to be used for the marketing of the project',
            },
            ModifierResolvers: {
              'static-cache': {
                Priority: 500,
              },
            },
            Processor: {
              Type: 'DFS',
              DFSLookup: 'npm:@lowcodeunit/public-web-blog',
              CacheControl: {
                'text\\/html': `private, max-age=${60 * 5}`,
                'image\\/': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
                'application\\/javascript': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
                'application\\/typescript': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
                'text\\/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
              },
            } as EaCDFSProcessor,
          },
          tailwind: {
            Details: {
              Name: 'Tailwind for the Site',
              Description: 'A tailwind config for the site',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Tailwind',
              DFSLookups: [
                'local:apps/home',
                'local:apps/components',
              ],
              ConfigPath: '/apps/tailwind/tailwind.config.ts',
              StylesTemplatePath: './apps/tailwind/styles.css',
              CacheControl: {
                'text\\/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
              },
            } as EaCTailwindProcessor,
          },
        },
        DFS: {
          'local:$root': {
            Type: 'Local',
            FileRoot: './',
          } as EaCLocalDistributedFileSystem,
          'npm:@lowcodeunit/public-web-blog': {
            Type: 'NPM',
            DefaultFile: 'index.html',
            Package: '@lowcodeunit/public-web-blog',
            Version: 'latest',
          } as EaCNPMDistributedFileSystem,
          'local:apps/api': {
            Type: 'Local',
            FileRoot: './apps/api/',
            DefaultFile: 'index.ts',
            Extensions: ['ts'],
          } as EaCLocalDistributedFileSystem,
          'local:apps/home': {
            Type: 'Local',
            FileRoot: './apps/home/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
          } as EaCLocalDistributedFileSystem,
          'local:apps/components': {
            Type: 'Local',
            FileRoot: './apps/components/',
          } as EaCLocalDistributedFileSystem,
        },
        Modifiers: {
          baseHref: {
            Details: {
              Type: 'BaseHREF',
              Name: 'Base HREF',
              Description: 'Adjusts the base HREF of a response based on configureation.',
            } as EaCBaseHREFModifierDetails,
          },
          keepAlive: {
            Details: {
              Type: 'KeepAlive',
              Name: 'Keep Alive',
              Description: 'Modifier to support a keep alive workflow.',
              KeepAlivePath: '/_eac/alive',
            } as EaCKeepAliveModifierDetails,
          },
          markdownToHtml: {
            Details: {
              Type: 'MarkdownToHTML',
              Name: 'Markdown to HTML',
              Description: 'A modifier to convert markdown to HTML.',
            } as EaCMarkdownToHTMLModifierDetails,
          },
          'static-cache': {
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
