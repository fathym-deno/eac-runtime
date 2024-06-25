---
title: 'EaC Runtime - Configuration'
path: './configure'
description: 'Get started configuring the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Micro Applications']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime - Configuration

The configuration system is built on top of the <a target="_blank">EaC Model</a>, specifically centered around the <a target="_blank">EverythingAsCodeApplications</a> spec.

There are two ways to configure the EaC Runtime:

- **Local Config**: Configure a local EaC using the default `configs/eac-runtime.config.ts` file.
- **Fathym EaC Config**: Enable deployment free management of the EaC with Fathym's no code, AI assisted <a target="_blank">EaC Management Platform</a>.

## The EaC Model

The EaC (Everything as Code) model provides an interface and execution runtime for developing dynamic automations for your applications. It provides several modules out-of-the-box and allows for the easy creation of new enhancements. For the EaC Runtime, it serves as the backbone configuration for the micro applications you want to orechestrate together.

### Local Configuration

The `eac-runtime.config.ts` is where you can mange [EaC Runtime settings](../Configuration.md), like the port it starts on and the EaC used to configure your applications.

### Fathym EaC configuration

Local configuration is nice, but it requires a redeployment of the runtime with every change. When the only changes we want to make are to our EaC configuration, Fathym's <a target="_blank">EaC Management Platform</a> makes it simple. Providing UIs to easily manage all aspects of the EaC, and automatic renewal of the EaC to keep your runtime in sync with your EaC configuration changes.

### Used Together

Both configuration techniques can be used [together](./). Provide a default configuration that all deployments use via the local config and override it with the configuration for individual Fathym EaCs. This can be used to provide a reusable runtime instance that can still be customized per solution.

## Recreating the Fathym Demo

Let's get our hands dirty now, and look at re-creating the Fathym Demo solution that ships when you create a new EaC Runtime project. This will allow us to work with Plugins, Projects, Applications, Processors, and Modifiers.

### The Plugin

The EaC Runtime provides a myriad of ways to customize it, a key aspect of that are plugins. Plugins allow you to configure the EaC, default modifiers, available services, and additional plugins. Start a new plugin by creating a `MyDemoPlugin.ts` file in a new `src/plugins` directory:

```typescript ./src/plugins/MyDemoPlugin.ts
import {
  EaCRuntimeConfig,
  EaCRuntimePluginConfig,
  EaCRuntimePlugin,
} from '@fathym/eac/runtime';

export default class MyDemoPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'MyDemoPlugin',
    };

    return Promise.resolve(pluginConfig);
  }
}
```

We start by pulling in our minimum required dependencies, and then define our plugin as a class that implements the `EaCRuntimePlugin`. A couple of quick notes 1) The plugin is exported as default in order to support external loading and 2) a class is not required to implement the plugin, it is just our preferred way to do things.

There is a Build method, which takes the `EaCRuntimeConfig` for the current runtime and returns an `EaCRuntimePluginConfig`. To start, we've simply given our plugin a name, and returned a blank configuration.

Now we need to configure this plugin to be used by the runtime. To do this, open the `configs/eac-runtime.config.ts` file and update the plugins to use the new plugin, instead of the FathymDemoPlugin:

```typescript ./configs/eac-runtime.config.ts
import { DefaultEaCConfig, defineEaCConfig } from '@fathym/eac/runtime';
import MyDemoPlugin from '../src/plugins/MyDemoPlugin.ts';

export default defineEaCConfig({
  Plugins: [new MyDemoPlugin(), ...(DefaultEaCConfig.Plugins || [])],
});
```

### The Project

Next, in order to handle requests, we'll need to configure our project. A project is responsible for orchestrating the micro applications into a unified experience, and defines the resolver configuration for when the project will run.

To add a project to our plugin configuration, we'll need to update the EaC in `MyDemoPlugin.ts` with our project definition:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
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
            Port: config.Server.port || 8000,
          },
          dev2: {
            Hostname: '127.0.0.1',
            Port: config.Server.port || 8000,
          },
        },
        ModifierResolvers: {
          keepAlive: {
            Priority: 1000,
          },
        },
        ApplicationResolvers: {},
      },
    },
  },
};
```

Here we have added a new demo project with some initial details. We have also configured the project resolver configuration to support running the site on `localhost` or `127.0.0.1` for port 8000 or the port the runtime is currently running on. Lastly, we setup the project to use the development 'keepAlive' modifier to support reloading the site whenever changes are detected. More on the modifier later.

### Applications

A project on its own, won't do much. So now we need to configure some applications that we can assign to the project.

#### Redirects

Let's start with a simple application, a redirect to our favorite site:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Applications: {
      fathym: {
        Details: {
          Name: 'Fathym Redirect',
          Description: 'A redirect to Fathym',
        },
        Processor: {
          Type: 'Redirect',
          Redirect: 'https://www.fathym.com/',
        } as EaCRedirectProcessor,
      },
    },
  },
};
```

We provide some basic details for the application, and then configure the processor as a redirect processor to handle the redirect.

We're close here, but before our redirect will work, we need to assign the application to the project. This allows us to configure many aspects of the application to project relationship:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Projects: {
      demo: {
        ApplicationResolvers: {
          fathym: {
            PathPattern: '/redirect',
            Priority: 200,
          },
        },
      },
    },
  },
};
```

The application lookup must use the same key used to define the application. Then we define the `PathPattern`, which gives the project information that it needs to resolve the Request. The priority is used to order applications during request resolution, with higher piroirty applications being processed first.

If you go ahead and start the runtime, then navigate to <a href="http://localhost:8000/redirect" target="_blank">`/redirect`</a>, you should be automatically redirected to the site you configured.

#### Proxies

Next we will configure a proxy application. This allows us to configure a URL to host our backend services on and to proxy entire other applications:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Projects: {
      demo: {
        ApplicationResolvers: {
          apiProxy: {
            PathPattern: '/api-reqres*',
            Priority: 200,
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
    },
  },
};
```

Here we have setup the application and once again assigned it to the project. In PathPattern for this assignment, we use a `*` to denote matching incoming request urls to anything that starts with `/api-reqres`. The rest of the path information after that root path is forwarded as part of the proxy request. Find complete infromation on available patterns <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLPattern" target="_blank">here</a>. You'll also notice that we have added a `tracing` modifier to this application that will log each request and response to the API.

Start the runtime, then navigate to <a href="http://localhost:8000/api-reqres/users" target="_blank">`/api-reqres/users`</a>, you should see the JSON results of the mock API.

#### DFS (Distributed File System) Hosting

Now we can look at using the DFS to host a static site we have packaged in NPM. This is a React Docusaurus site, showing how we can leverage multiple frameworks together in our micro application project.

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Projects: {
      demo: {
        ApplicationResolvers: {
          publicWebBlog: {
            PathPattern: '/blog*',
            Priority: 500,
          },
        },
      },
    },
    Applications: {
      publicWebBlog: {
        Details: {
          Name: 'Public Web Blog Site',
          Description:
            'The public web blog site to be used for the marketing of the project',
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
            'application\\/javascript': `public, max-age=${
              60 * 60 * 24 * 365
            }, immutable`,
            'application\\/typescript': `public, max-age=${
              60 * 60 * 24 * 365
            }, immutable`,
            'text\\/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
          },
        } as EaCDFSProcessor,
      },
    },
    DFS: {
      'npm:@lowcodeunit/public-web-blog': {
        Type: 'NPM',
        DefaultFile: 'index.html',
        Package: '@lowcodeunit/public-web-blog',
        Version: 'latest',
      } as EaCNPMDistributedFileSystem,
    },
  },
};
```

Most of this should be starting to look familiar, we've configured the processor and added a `static-cache` modifier, then assigned it to the project. The new piece here is the introduction of a DFS (Distributed File System) configuration. This configuration tells the runtime how to retreive the files used to serve the application.

View the configured application at <a href="http://localhost:8000/blog" target="_blank">`/blog`</a>, you should see the Fathym blog, and be able to navigate between articles.

#### Local API

We already setup a proxy application to leverage other, existing APIs. Now let's configure an application to handle our own local APIs. We'll use the APIs that shipped with the install:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Projects: {
      demo: {
        ApplicationResolvers: {
          apiLocalProxy: {
            PathPattern: '/api-local*',
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
```

#### Preact App

The final application that we'll add is for rendering a home page from a a set of Preact controls. This example leverages tailwind for styling, so we'll have to set that up as well.

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Projects: {
      demo: {
        ApplicationResolvers: {
          home: {
            PathPattern: '/*',
            Priority: 100,
          },
          tailwind: {
            PathPattern: '/tailwind*',
            Priority: 500,
          },
        },
      },
    },
    Applications: {
      home: {
        Details: {
          Name: 'Home Site',
          Description:
            'The home site to be used for the marketing of the project',
        },
        ModifierResolvers: {},
        Processor: {
          Type: 'PreactApp',
          AppDFSLookup: 'local:apps/home',
          ComponentDFSLookups: ['local:apps/components'],
        } as EaCPreactAppProcessor,
      },
      tailwind: {
        Details: {
          Name: 'Tailwind for the Site',
          Description: 'A tailwind config for the site',
        },
        ModifierResolvers: {},
        Processor: {
          Type: 'Tailwind',
          DFSLookups: ['local:apps/home', 'local:apps/components'],
          ConfigPath: '/apps/tailwind/tailwind.config.ts',
          StylesTemplatePath: './apps/tailwind/styles.css',
          CacheControl: {
            'text\\/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
          },
        } as EaCTailwindProcessor,
      },
    },
    DFS: {
      'local:apps/components': {
        Type: 'Local',
        FileRoot: './apps/components/',
      } as EaCLocalDistributedFileSystem,
      'local:apps/home': {
        Type: 'Local',
        FileRoot: './apps/home/',
        DefaultFile: 'index.tsx',
        Extensions: ['tsx'],
      } as EaCLocalDistributedFileSystem,
    },
  },
};
```

Navigate to <a href="http://localhost:8000/" target="_blank">`/`</a> and you should see the application running with tailwind styles.

Throughout the application setup and configuration we leveraged several modifiers. None of these are working yet, because we haven't configured them. Next, we'll setup the modifiers to complete our plugin configuration.

#### Modifiers

Modifiers allow us to easily manipulate the requests and responses of the system. In the above applications, we have used three different modifiers, and now we need to configure them:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Modifiers: {
      keepAlive: {
        Details: {
          Type: 'KeepAlive',
          Name: 'Keep Alive',
          Description: 'Modifier to support a keep alive workflow.',
          KeepAlivePath: '/_eac/alive',
        } as EaCKeepAliveModifierDetails,
      },
      'static-cache': {
        Details: {
          Type: 'DenoKVCache',
          Name: 'Static Cache',
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
  },
};
```

These core modifiers support various aspects of your application. The keep alive runs only in dev mode and works to refresh your page anytime you make changes to the eac-runtime. The tracing modifier will log the request and response information for the system. Finally, the deno KV cache uses DenoKV to cache configured responses for the applications it is configured to. You'll notice with the cache that we have DenoKVDatabaseLookup configured to `cache`. For this to work, we need to add one more configuration for the database:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Databases: {
      cache: {
        Details: {
          Type: 'DenoKV',
          Name: 'Local Cache',
          Description: 'The Deno KV database to use for local caching',
          DenoKVPath: undefined,
        } as EaCDenoKVDatabaseDetails,
      },
    },
  },
};
```

That's it, run your site and you'll be able to connect with the blog, api, redirects and home page with ease. For complete information on configuring your eac, visit [here](../configuration/Overview.md).

Your final code will look something like this:

```typescript ./src/plugins/MyDemoPlugin.ts
import {
  EaCRuntimeConfig,
  EaCRuntimePluginConfig,
  EaCRuntimePlugin,
} from '@fathym/eac/runtime';
import {
  EaCDFSProcessor,
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVDatabaseDetails,
  EaCKeepAliveModifierDetails,
  EaCLocalDistributedFileSystem,
  EaCMarkdownToHTMLModifierDetails,
  EaCNPMDistributedFileSystem,
  EaCProxyProcessor,
  EaCRedirectProcessor,
  EaCTracingModifierDetails,
} from '@fathym/eac';

export default class MyDemoPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'MyDemoPlugin',
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
                Port: config.Server.port || 8000,
              },
              dev2: {
                Hostname: '127.0.0.1',
                Port: config.Server.port || 8000,
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
              tailwind: {
                PathPattern: '/tailwind*',
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
              Redirect: 'https://www.fathym.com/',
            } as EaCRedirectProcessor,
          },
          home: {
            Details: {
              Name: 'Home Site',
              Description:
                'The home site to be used for the marketing of the project',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'PreactApp',
              AppDFSLookup: 'local:apps/home',
              ComponentDFSLookups: ['local:apps/components'],
            } as EaCPreactAppProcessor,
          },
          publicWebBlog: {
            Details: {
              Name: 'Public Web Blog Site',
              Description:
                'The public web blog site to be used for the marketing of the project',
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
                'application\\/javascript': `public, max-age=${
                  60 * 60 * 24 * 365
                }, immutable`,
                'application\\/typescript': `public, max-age=${
                  60 * 60 * 24 * 365
                }, immutable`,
                'text\\/css': `public, max-age=${
                  60 * 60 * 24 * 365
                }, immutable`,
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
              DFSLookups: ['local:apps/home', 'local:apps/components'],
              ConfigPath: '/apps/tailwind/tailwind.config.ts',
              StylesTemplatePath: './apps/tailwind/styles.css',
              CacheControl: {
                'text\\/css': `public, max-age=${
                  60 * 60 * 24 * 365
                }, immutable`,
              },
            } as EaCTailwindProcessor,
          },
        },
        DFS: {
          'local:apps/components': {
            Type: 'Local',
            FileRoot: './apps/components/',
          } as EaCLocalDistributedFileSystem,
          'local:apps/home': {
            Type: 'Local',
            FileRoot: './apps/home/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
          } as EaCLocalDistributedFileSystem,
          'npm:@lowcodeunit/public-web-blog': {
            Type: 'NPM',
            DefaultFile: 'index.html',
            Package: '@lowcodeunit/public-web-blog',
            Version: 'latest',
          } as EaCNPMDistributedFileSystem,
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
          'static-cache': {
            Details: {
              Type: 'DenoKVCache',
              Name: 'Static Cache',
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
              DenoKVPath: undefined,
            } as EaCDenoKVDatabaseDetails,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
```
