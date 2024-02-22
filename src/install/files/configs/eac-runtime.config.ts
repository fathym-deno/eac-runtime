import {
  EaCDFSProcessor,
  EaCKeepAliveModifierDetails,
  EaCNPMDistributedFileSystem,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  EaCTracingModifierDetails,
} from '@fathym/eac';
import { defineEaCConfig } from '@fathym/eac/runtime';

export default defineEaCConfig({
  Server: {
    port: 8000,
  },
  EaC: {
    Projects: {
      marketing: {
        Details: {
          Name: 'Main marketing website',
          Description: 'The main marketing website to use.',
          Priority: 100,
        },
        LookupConfigs: {
          dev: {
            Hostname: 'localhost',
            Port: 8000,
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
});
