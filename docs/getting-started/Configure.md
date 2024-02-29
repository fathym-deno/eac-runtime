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

The EaC (Everything as Code) model provides an interface and execution runtime for developing dynamic automations for your interface. It provides several modules out-of-the-box and allows for the easy creation of new enhancements. For the EaC Runtime, it serves as the backbone configuration for the micro applications you want to orechestrate togetether.

### Local Configuration

The `eac-runtime.config` is where you can mange [EaC Runtime settings](../Configuration.md), like the port it starts on and the EaC used to configure your applications.

### Fathym EaC configuration

Local configuration is nice, but it requires a redeployment of the runtime with every change. When the only changes we want to make are to our EaC configuration, Fathym's <a target="_blank">EaC Management Platform</a> makes it simple. Providing UIs to easily manage all aspects of the EaC, and automatic renewal of the EaC to keep your runtime in sync with your EaC configuration changes.

### Used Together

Both configuration techniques can be used [together](./). Provide a default configuration that all deployments use via the local config and override it with the configuration for individual Fathym EaCs. This can be used to provide a reusable runtime instance that can still be customized by solution.

## Recreating the Fathym Demo

Let's get our hands dirty now, and look at re-creating the Fathym Demo solution that ships when you create a new EaC Runtime solution. This will allow us to work with Plugins, Projects, Applications, Processors, and Modifiers.

### The Plugin

The EaC Runtime provides a myriad of ways to customize it, a key aspect of that are plugins. Plugins allow you to configure the EaC, default modifiers, available services (through the IoC pattern), and additional plugins. To start creating a new plugin by creating a `MyDemoPlugin.ts` file in a new `src/plugins` directory:

```typescript ./src/plugins/MyDemoPlugin.ts
import {
  EaCRuntimeConfig,
  EaCRuntimePluginConfig,
  EaCRuntimePlugin,
} from '@fathym/eac/runtime';

export default class MyDemoPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Build(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'MyDemoPlugin',
    };

    return Promise.resolve(pluginConfig);
  }
}
```

We start by pulling in our minimum required dependencies, and then define our plugin as a class that implements the `EaCRuntimePlugin`. A couple of quick notes 1) The plugin is exported as default, in order to support external loading and 2) a class is not required to implement the plugin, it is just our preferred way to do things.

There is a build method, which takes the `EaCRuntimeConfig` for the current runtime and returns an `EaCRuntimePluginConfig`. To start, we've simply given our plugin a name, and returned a blank configuration.

### The Project

Next, in order to handle requests, we'll need to configure our project. A project is responsible for orchestrating the micro applications into a unified experience, and defines the lookup configuration for when this project will run.

To add a project to our plugin configuration, we'll need to update the EaC with our project definition:

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
        LookupConfigs: {
          dev: {
            Hostname: 'localhost',
            Port: config.Server.port || 8000,
          },
          dev2: {
            Hostname: '127.0.0.1',
            Port: config.Server.port || 8000,
          },
        },
        ModifierLookups: ['keepAlive'],
      },
    },
  },
};
```

Here we have add a new demo project with some initial details. We have also configured the project lookup configuration to support running the site on localhost or 127.0.0.1 for port 8000 or the port the runtime is currently running on. Lastly, we setup the project to use the development 'keepAlive' modifier to support reloading the site whenever changes are detected. More on the modifier later.

### Applications

A project on its own, won't do much. So now we need to configure some applications that we can assign to the project.

Let's start with a simple application, a redirect to our favorite site:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {x``
    Applications: {
      fathym: {
        Details: {
          Name: 'Fathym Redirect',
          Description: 'A redirect to Fathym',
        },
        Processor: {
          Redirect: 'http://www.fathym.com/',
        } as EaCRedirectProcessor,
      },
    },
  },
};
```

Again we provide some basic details for the application, and then configure processor as a redirect processor to handle the redirect.

We're close here, but before our redirect will work, we need to assign the application to the project. This allows us to configure many aspects of the application to project relationship:

```typescript ./src/plugins/MyDemoPlugin.ts
const pluginConfig: EaCRuntimePluginConfig = {
  Name: 'MyDemoPlugin',
  EaC: {
    Projects: {
      demo: {
        ApplicationLookups: {
          fathym: {
            PathPattern: '/fathym',
            Priority: 200,
          },
        },
      },
    },
  },
};
```

The application lookup must use the same lookup used to define the application. Then we define the `PathPattern`, which gives the project information what it needs to resolve the application processor for a Request.

If you go ahead and start the runtime, then navigate to `/red9rect`, you should be automatically redirected to the site you configured.