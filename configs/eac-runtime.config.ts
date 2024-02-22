import {
  EaCAIRAGChatProcessor,
  EaCAzureADB2CProviderDetails,
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVDatabaseDetails,
  EaCDFSProcessor,
  EaCKeepAliveModifierDetails,
  EaCLocalDistributedFileSystem,
  EaCNPMDistributedFileSystem,
  EaCOAuthModifierDetails,
  EaCOAuthProcessor,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  EaCTracingModifierDetails,
} from '../src/src.deps.ts';
import { defineEaCConfig } from '../src/runtime/config/defineEaCConfig.ts';

export default defineEaCConfig({
  ModifierLookups: [],
  Server: {
    port: 6121,
  },
  EaC: {
    EnterpriseLookup: "local-eac",
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
            IsPrivate: true,
            IsTriggerSignIn: true,
          },
          docs: {
            PathPattern: '/docs/*',
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
          denoDeploy: {
            Hostname: 'eac-runtime.deno.dev',
          },
          fathym: {
            Hostname: 'eac-runtime.fathym.com',
          },
        },
        ModifierLookups: ['keepAlive', 'oauth'],
        ApplicationLookups: {
          apiProxy: {
            PathPattern: '/api-reqres*',
            Priority: 200,
            IsPrivate: true,
            IsTriggerSignIn: true,
          },
          chat: {
            PathPattern: '/chat*',
            Priority: 300,
            // IsPrivate: true,
            // IsTriggerSignIn: true,
          },
          dashboard: {
            PathPattern: '/*',
            Priority: 100,
          },
          denoInstall: {
            PathPattern: '/deno/install',
            Priority: 5001,
            UserAgentRegex: '^Deno*',
          },
          denoLocalInstall: {
            PathPattern: '/deno/*',
            Priority: 5000,
            UserAgentRegex: '^Deno*',
          },
          fathym: {
            PathPattern: '/fathym',
            Priority: 200,
          },
          fathymWhiteLogo: {
            PathPattern: '/img/Fathym-logo-white-01.png',
            Priority: 2000,
          },
          favicon: {
            PathPattern: '/img/favicon.ico',
            Priority: 2000,
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
          SearchEndpoint: Deno.env.get('AZURE_AI_SEARCH_ENDPOINT')!,
          UseSSEFormat: true,
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
      denoInstall: {
        Details: {
          Name: 'EaC Runtime Deno Install',
          Description: 'A script to use for installing the deno runtime.',
        },
        Processor: {
          // Redirect: 'http://localhost:6121/deno/install.ts',
          Redirect: 'https://deno.land/x/fathym_eac_runtime/install.ts',
        } as EaCRedirectProcessor,
      },
      denoLocalInstall: {
        Details: {
          Name: 'EaC Runtime Local Deno Install',
          Description: 'A script to use for installing the deno runtime.',
        },
        // ModifierLookups: ['denoKvCache'],
        Processor: {
          DFS: {
            FileRoot: './',
          } as EaCLocalDistributedFileSystem,
        } as EaCDFSProcessor,
      },
      docs: {
        Details: {
          Name: 'Documentation Site',
          Description: 'The documentation site for the project',
        },
        Processor: {},
      },
      fathym: {
        Details: {
          Name: 'Fathym Redirect',
          Description: 'A redirect to Fathym',
        },
        Processor: {
          Redirect: 'https://www.fathym.com/',
        } as EaCRedirectProcessor,
      },
      fathymWhiteLogo: {
        Details: {
          Name: 'Standard Fathym White Logo',
          Description: 'The standard fathym white logo.',
        },
        ModifierLookups: ['denoKvCache'],
        Processor: {
          ProxyRoot: 'https://www.fathym.com/img/Fathym-logo-white-01.png',
          RedirectMode: 'follow',
        } as EaCProxyProcessor,
      },
      favicon: {
        Details: {
          Name: 'Standard Favicon',
          Description: 'The standard favicon',
        },
        ModifierLookups: ['denoKvCache'],
        Processor: {
          ProxyRoot: 'https://www.fathym.com/img/favicon.ico',
          RedirectMode: 'follow',
        } as EaCProxyProcessor,
      },
      home: {
        Details: {
          Name: 'Home Site',
          Description:
            'The home site to be used for the marketing of the project',
        },
        Processor: {},
      },
      oauth: {
        Details: {
          Name: 'OAuth Site',
          Description: 'The site for use in OAuth workflows for a user',
        },
        Processor: {
          ProviderLookup: 'adb2c',
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
    },
    Providers: {
      adb2c: {
        Details: {
          Name: 'Azure ADB2C OAuth Provider',
          Description:
            'The provider used to connect with our azure adb2c instance',
          ClientID: Deno.env.get('AZURE_ADB2C_CLIENT_ID')!,
          ClientSecret: Deno.env.get('AZURE_ADB2C_CLIENT_SECRET')!,
          Scopes: ['openid', Deno.env.get('AZURE_ADB2C_CLIENT_ID')!],
          Domain: Deno.env.get('AZURE_ADB2C_DOMAIN')!,
          PolicyName: Deno.env.get('AZURE_ADB2C_POLICY')!,
          TenantID: Deno.env.get('AZURE_ADB2C_TENANT_ID')!,
        } as EaCAzureADB2CProviderDetails,
      },
    },
    Databases: {
      cache: {
        Details: {
          Name: 'Local Cache',
          Description: 'The Deno KV database to use for local caching',
          DenoKVPath: Deno.env.get('LOCAL_CACHE_DENO_KV_PATH') || undefined,
          Type: 'DenoKV',
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
      oauth: {
        Details: {
          Name: 'OAuth',
          Description: 'Used to restrict user access to various applications.',
          ProviderLookup: 'adb2c',
          SignInPath: '/oauth/signin',
          Priority: 1200,
        } as EaCOAuthModifierDetails,
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
