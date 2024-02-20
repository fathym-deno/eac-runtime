import {
  EaCAIRAGChatProcessor,
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVDatabaseDetails,
  EaCDFSProcessor,
  EaCKeepAliveModifierDetails,
  EaCNPMDistributedFileSystem,
  EaCOAuthProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  EaCTracingModifierDetails,
} from '../src/src.deps.ts';
import { defineEaCConfig } from '../src/runtime/config/defineEaCConfig.ts';

export default defineEaCConfig({
  //   Runtime: (cfg) => new TracingEaCRuntime(cfg),
  ModifierLookups: ['_tracing'],
  Server: {
    port: 6121,
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
            Port: 6120,
          },
        },
        ModifierLookups: ['keepAlive'],
        ApplicationLookups: {
          apiProxy: {
            PathPattern: '/api*',
            Priority: 200,
          },
          docs: {
            PathPattern: '/docs/*',
            Priority: 200,
          },
          google: {
            PathPattern: '/google',
            Priority: 200,
          },
          home: {
            PathPattern: '/*',
            Priority: 100,
          },
          oauth: {
            PathPattern: '/oauth/*',
            Priority: 500,
          },
        },
      },
      dashboard: {
        Details: {
          Name: 'Dashboard website',
          Description: 'The dashboard website to use.',
          Priority: 200,
        },
        LookupConfigs: {
          dev: {
            Hostname: 'localhost',
            Port: 6121,
          },
        },
        ModifierLookups: ['keepAlive'],
        ApplicationLookups: {
          chat: {
            PathPattern: '/chat*',
            Priority: 300,
          },
          dashboard: {
            PathPattern: '/*',
            Priority: 100,
          },
          oauth: {
            PathPattern: '/oauth/*',
            Priority: 500,
          },
          publicWebBlog: {
            PathPattern: '/blog*',
            Priority: 500,
          },
          profile: {
            PathPattern: '/profile/*',
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
        Processor: {
          ProxyRoot: 'https://reqres.in/api',
        } as EaCProxyProcessor,
      },
      chat: {
        Details: {
          Name: 'Chat Site',
          Description: 'The chat used to display the main dashboard',
        },
        Processor: {
          APIKey: Deno.env.get('AZURE_OPENAI_KEY')!,
          Endpoint: Deno.env.get('AZURE_OPENAI_ENDPOINT')!,
          DeploymentName: 'gpt-4-turbo',
          EmbeddingDeploymentName: 'text-embedding-ada-002',
          ModelName: 'gpt-4',
          SearchAPIKey: Deno.env.get('AZURE_AI_SEARCH_KEY')!,
          // SearchEndpoint: Deno.env.get('AZURE_AI_SEARCH_ENDPOINT')!,
          Messages: [
            [
              'system',
              'You are an expert data engineer, data scientist, and will help the user create a KQL query. Keeping in mind the following context:\n\n{context}',
            ],
            ['human', '{input}'],
          ],
        } as EaCAIRAGChatProcessor,
      },
      dashboard: {
        Details: {
          Name: 'Dashboard Site',
          Description: 'The site used to display the main dashboard',
        },
        Processor: {
          // ProxyRoot: 'http://localhost:8000',
          // ProxyRoot: 'http://localhost:5437',
          // ProxyRoot: 'https://dashboard.openbiotech.co',
          ProxyRoot: 'https://biotech-manager-web.azurewebsites.net',
        } as EaCProxyProcessor,
      },
      docs: {
        Details: {
          Name: 'Documentation Site',
          Description: 'The documentation site for the project',
        },
        Processor: {},
      },
      google: {
        Details: {
          Name: 'Google Redirect',
          Description: 'A redirect to Google',
        },
        Processor: {
          Redirect: 'http://www.google.com/',
        } as EaCRedirectProcessor,
      },
      home: {
        Details: {
          Name: 'Home Site',
          Description:
            'The home site to be used for the marketing of the project',
        },
        Processor: {},
      },
      publicWebBlog: {
        Details: {
          Name: 'Public Web Blog Site',
          Description:
            'The public web blog site to be used for the marketing of the project',
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
      oauth: {
        Details: {
          Name: 'OAuth Site',
          Description: 'The site for use in OAuth workflows for a user',
        },
        Processor: {
          ClientID: Deno.env.get('AZURE_ADB2C_CLIENT_ID')!,
          ClientSecret: Deno.env.get('AZURE_ADB2C_CLIENT_SECRET'),
          AuthorizationEndpointURI: `https://${Deno.env.get(
            'AZURE_ADB2C_DOMAIN'
          )}/${Deno.env.get('AZURE_ADB2C_TENANT_ID')}/${Deno.env.get(
            'AZURE_ADB2C_POLICY'
          )}/oauth2/v2.0/authorize`,
          TokenURI: `https://${Deno.env.get(
            'AZURE_ADB2C_DOMAIN'
          )}/${Deno.env.get('AZURE_ADB2C_TENANT_ID')}/${Deno.env.get(
            'AZURE_ADB2C_POLICY'
          )}/oauth2/v2.0/token`,
          Scopes: ['openid', Deno.env.get('AZURE_ADB2C_CLIENT_ID')!],
        } as EaCOAuthProcessor,
      },
      profile: {
        Details: {
          Name: 'Profile Site',
          Description:
            'The site used to for user profile display and management',
        },
        Processor: {},
      },
    },
    Databases: {
      cache: {
        Details: {
          Name: 'Local Cache',
          Description: 'The Deno KV database to use for local caching',
          DenoKVPath: Deno.env.get('LOCAL_CACHE_DENO_KV_PATH') || undefined,
        } as EaCDenoKVDatabaseDetails,
      },
    },
    Modifiers: {
      denoKvCache: {
        Details: {
          Name: 'Deno KV Cache',
          Description:
            'Lightweight cache to use that stores data in a DenoKV database.',
          DenoKVDatabaseLookup: 'cache',
          CacheSeconds: 60 * 5,
          Priority: 500,
        } as EaCDenoKVCacheModifierDetails,
      },
      keepAlive: {
        Details: {
          Name: 'Deno KV Cache',
          Description:
            'Lightweight cache to use that stores data in a DenoKV database.',
          KeepAlivePath: '/_eac/alive',
          Priority: 1000,
        } as EaCKeepAliveModifierDetails,
      },
      tracing: {
        Details: {
          Name: 'Deno KV Cache',
          Description:
            'Lightweight cache to use that stores data in a DenoKV database.',
          TraceRequest: true,
          TraceResponse: true,
          Priority: 1500,
        } as EaCTracingModifierDetails,
      },
    },
  },
});
