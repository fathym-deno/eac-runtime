# The Code In Review

Welcome to **The Code In Review**, a comprehensive guide that outlines the essential repositories used in the **Golden Path** configuration for building advanced, scalable agentic workflows with **Fathym Everything as Code (EaC)** and **Synaptic AI**. Each repository in this configuration plays a critical role in orchestrating components, infrastructure, and workflows that power intelligent multi-agent systems. This document provides an in-depth overview of each repository's purpose, role within the system, and practical steps for setting up your base code. Whether you are developing a secure API, designing flexible frontends, or orchestrating AI-driven agents, this guide will help you create a seamless, integrated workflow across all runtimes.

---

## Repositories Overview

### 1. Reference Architecture

- **Purpose**: The **Reference Architecture** serves as the **central foundation** for your entire agentic workflow ecosystem. This repository is where all **reusable code** for all other repositories should be developed. It provides shared libraries, utilities, common configurations, and types that will be used across the various runtime and design repositories.
- **Key Role**:
  - Provides **core infrastructure** configurations and reusable logic that other repositories can build on, avoiding code duplication and ensuring consistency.
  - Acts as a **shared codebase**, allowing other repositories to pull in common functionality such as agent task definitions, API models, and infrastructure management utilities.
  - Centralizes the definition of **common types** and **utilities**, which can be extended by specific repositories to suit individual workflows.
  - This repository defines the reusable building blocks that will be extended and refined as needed in specific contexts (e.g., core runtime, web runtime, and synaptic runtime).

**Initial Steps for Setting Up the EaC Schema:**

In this repository, you will start by setting up the initial **EaC Schema**. Follow these steps to create the necessary file structure, set up exports, and deploy the code.

#### Step 1: Update `src.deps.ts`

In Deno, using a `src.deps.ts` file follows best practices by managing dependencies centrally. This approach ensures that the library handles its own versions independently from imports in various files. By doing so, you can control version consistency across your project and maintain cleaner import paths.

To start, update the `src.deps.ts` file to import the `EverythingAsCode` type:

```typescript
export type { EverythingAsCode } from 'jsr:@fathym/eac@0';
```

#### Step 2: Create the EaC File

Next, in the `src/eac` directory, create a file called `EverythingAsCode{OrgName}.ts`:

The folder structure should look like this:

```
src/
│
└── eac/
     └── EverythingAsCode{OrgName}.ts
```

In `EverythingAsCode{OrgName}.ts`, define the simple type for your organization:

```typescript
import type { EverythingAsCode } from '../../src.deps.ts';

export type EverythingAsCode{OrgName} = EverythingAsCode;
```

> **Note**: Replace `{OrgName}` with your actual organization name.

#### Step 3: Create `.exports.ts` Files

1. In `src/eac/`, create a `.exports.ts` file to export the contents of `EverythingAsCode{OrgName}.ts`:

```typescript
export * from './EverythingAsCode{OrgName}.ts';
```

2. In `src/`, create another `.exports.ts` file to export from the `eac/` folder:

```typescript
export * from './eac/.exports.ts';
```

#### Step 4: Update `mod.ts`

Update the `mod.ts` file to export from `src/.exports.ts`:

```typescript
export * from './src/.exports.ts';
```

#### Step 5: Deploy the Schema

Once the schema is set up, run the following command to trigger a build on the **integration branch**:

```bash
deno task deploy
```

#### Step 6: Deploy to Production

To deploy the schema to production, first, check out the **main** branch and then use the **Fathym CLI** to commit the changes and sync with the **integration** branch:

```bash
git checkout main
ftm git
```

This command commits the changes and performs additional syncing with the **integration** branch to ensure a smooth production deployment.

---

### 2. Atomic Design Kit

- **Purpose**: The **atomic-design-kit** provides a pre-configured set of **UI controls** and design elements from **Fathym**. It’s built with flexibility in mind, allowing developers to easily **extend** or **replace** existing elements and create new ones to meet their specific design needs.
- **Key Role**:
  - Offers a **pre-built design system** for building UI components quickly, without needing to start from scratch.
  - Allows for easy customization by extending or replacing controls as needed.
  - Provides atomic elements that are modular and composable, making it easy to create complex UI systems using simple building blocks.

This repository will play a key role in the development of the **POC agent**, leveraging pre-built atomic controls to demonstrate how reusable UI components can be integrated into agentic workflows.

> **Note**: We will use some of the pre-built atomic controls from this kit to develop our **POC agent**.

---

### 3. API Runtime

- **Purpose**: The **API Runtime** is the layer where all **business logic** and **external system integrations** should occur. It is responsible for defining simple, easy-to-reason-about **API endpoints** that can handle more complex tasks. By doing so, the API runtime provides a clean interface for connecting to web interfaces and Synaptic circuits.
- **Key Role**:
  - Isolates web interfaces and **Synaptic circuits** from underlying business logic or external integrations.
  - Adapts easily to changes in the business logic or integrations without impacting the user experience (UX).
  - Simplifies the **UX layer** by creating a well-defined API boundary, using the **BFF (Backend for Frontend)** pattern to isolate how different interfaces interact with the backend.
  - **The simpler the APIs, the more effective they become**: Simplified APIs isolate other layers from needing to know complex backend logic, while also making them **easier to use as tools in Synaptic circuits**, where **LLMs (Large Language Models)** can more easily reason about how and when to use them.

**Steps for Setting Up Your API Runtime:**

We’ll guide the user through setting up a simple API state with middleware and a test API endpoint to showcase basic functionality.

#### Step 1: Delete the `apps/api/[slug]` Directory

Navigate to the `apps/api/` directory and delete the `[slug]` directory, along with any files underneath it. This clears the existing structure to make way for the new API setup.

#### Step 2: Define Your API State

Next, define your API state by creating a new file in the `src/state/` directory called `{OrgName}APIState.ts`. Replace `{OrgName}` with your organization name.

In this file, define a simple state as follows:

```typescript
// src/state/{OrgName}APIState.ts
export type {OrgName}APIState = {
  Random: string;
};
```

This creates a basic state structure that will be used and updated by your API handlers.

#### Step 3: Update `_middleware.ts`

Now, update the `apps/api/_middleware.ts` file to add a random GUID to the API state. This middleware will generate a unique identifier and pass it along in the API response.

```typescript
// apps/api/_middleware.ts
import { EaCRuntimeHandlers } from '@fathym/eac-runtime';
import { {OrgName}APIState } from '../../src/state/{OrgName}APIState.ts';

export default {
  GET(_req, ctx) {
    ctx.State.Random = crypto.randomUUID();

    return ctx.Next();
  },
} as EaCRuntimeHandlers<{OrgName}APIState>;
```

This middleware runs on every request, generating a new random GUID and adding it to the state before passing control to the next handler.

#### Step 4: Update `index.ts` to Return the API State

In your `apps/api/index.ts` file, update the API to return the entire state when a GET request is made. This will allow you to see the random GUID generated in the middleware.

```typescript
// apps/api/index.ts
import { EaCRuntimeHandlers } from '@fathym/eac-runtime';
import { {OrgName}APIState } from '../../src/state/{OrgName}APIState.ts';

export default {
  GET(_req, ctx) {
    return Response.json(ctx.State);
  },
} as EaCRuntimeHandlers<{OrgName}APIState>;
```

With this setup, when you send a GET request to this endpoint, the full state, including the random GUID, will be returned in the response.

#### Step 5: Configure local port:

Create a .env file at the root of the project and define the port for this runtime:

```
PORT=8102
```

---

#### Additional Notes:

- You can define API logic for each HTTP method (`GET`, `POST`, `PUT`, etc.), and you can also define arrays of functionality or general handlers that apply to all HTTP methods.
- **Middleware Flexibility**: Middleware can be customized to handle logging, authentication, or other common tasks before passing control to the API handler using `ctx.Next()`. If needed, you can pass an updated request into `ctx.Next(request)` to modify it.
- **Request Pipelines**: The `ctx.Next()` function allows you to pass the request to the next handler in a chain, creating powerful and flexible request pipelines for complex workflows.

---

### 4. Web Runtime

- **Purpose**: The **Web Runtime** is a Preact-based framework for building frontend experiences using an **Islands Architecture**. This architecture allows JavaScript components to be loaded in a way that ensures only the code needed for each page is shipped, optimizing performance and scalability. It also supports **Tailwind CSS** for styling and **Atomic Icons** for reusable icon components.

- **Key Role**:
  - Facilitates building efficient and lightweight frontend applications, delivering only the necessary JavaScript and CSS for each page.
  - Leverages the **Islands Architecture** to minimize unnecessary loading and enhance user experience.
  - Fully supports **Tailwind CSS** for a utility-first approach to styling and **Atomic Icons** to easily integrate iconography into the UI.

**Steps for Setting Up Your Web Runtime:**

We’ll walk the user through defining a simple web state, adding middleware to set the current date, and integrating an API call in the page setup.

#### Step 1: Define Your Web State

Start by defining a simple state in the `src/state/{OrgName}WebState.ts` file. Replace `{OrgName}` with your organization name.

```typescript
// src/state/{OrgName}WebState.ts
export type {OrgName}WebState = {
  CurrentDate: Date;
};
```

This state will track the current date, which will be set via middleware and displayed on the page.

#### Step 2: Create Middleware for the Home Page

Next, create a new `apps/home/_middleware.ts` file. This middleware will set the current date in the state before the request is handled.

```typescript
// apps/home/_middleware.ts
import { EaCRuntimeHandlers } from '@fathym/eac-runtime';
import { {OrgName}WebState } from '../../src/state/{OrgName}WebState.ts';

export default (_req, ctx) => {
  ctx.State.CurrentDate = new Date(Date.now());

  return ctx.Next();
} as EaCRuntimeHandlers<{OrgName}WebState>;
```

This middleware runs on every request to the home page and ensures the `CurrentDate` is set.

#### Step 3: Fetch Data and Render the Page

Now, open the `apps/home/index.tsx` file. Here, you’ll make an API call using `fetch` and update the page to display the fetched data along with the current date.

```typescript
// apps/home/index.tsx
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import Counter from '../islands/Counter.tsx';
import { {OrgName}WebState } from '../../src/state/{OrgName}WebState.ts';

type IndexPageData = {
   Name: string;
   Text: string;
}

export const handler: EaCRuntimeHandlerResult<{OrgName}WebState, IndexPageData> = {
  GET: async (_req, ctx) => {
    const resp = await fetch(`http://localhost:8100/api`);

    const { Random } = await resp.json() as { Random: string };

    return ctx.Render({
      Name: `The Random: ${Random}`,
      Text: `We met the latest Random, ${Random}, at around ${ctx.State.CurrentDate}`
    });
  },
};

export default function Index({ Data }: PageProps<IndexPageData>) {
  return (
    <div>
      <div class='py-16 px-4 bg-slate-500'>
        <div class='mx-auto block w-[350px] text-center'>
          <h1 class='text-4xl'>{Data.Name}</h1>

          <p class='text-lg'>
            {Data.Text}
          </p>

          <div class='flex flex-row py-8'>
            <Counter />
          </div>
        </div>
      </div>

      <div class='p-4'>
        <h2 class='text-2xl'>Welcome</h2>
      </div>
    </div>
  );
}
```

#### Step 4: Configure local port:

Create a .env file at the root of the project and define the port for this runtime:

```
PORT=8101
```

This example fetches data from an API, retrieves a random value (`Random`), and uses it to generate dynamic content on the page. The `CurrentDate` is also displayed as part of the rendered text.

---

### Additional Notes:

- The **Islands Architecture** enables you to load only the JavaScript needed for each page, improving performance and user experience.
- **Tailwind CSS** is used throughout for styling, providing a utility-first approach that makes it easy to build responsive and modern UIs.
- **Atomic Icons** can be used to add scalable and reusable icon components to your pages.

---

### 5. Synaptic Runtime

- **Purpose**: The **Synaptic Runtime** is where **agents** are defined through **circuits** and **neurons**. Neurons are the **reusable building blocks** for circuits, which define **reusable agents**. These agents can be used in isolation or orchestrated together for more complex workflows.

- **Key Role**:
  - **Neurons** serve as the foundational units that define specific tasks or actions.
  - **Circuits** define **reusable agents**, which can be deployed individually or combined for orchestrated workflows.
  - The **Synaptic Runtime** takes care of **hosting these circuits** for consumption, ensuring secure boundaries around which circuits are callable from external systems and which are used internally within agentic workflows.

The runtime ensures that circuits are securely managed, determining which circuits can be accessed externally while keeping others restricted to internal workflows. This flexibility allows for both safe external access and efficient internal collaboration among agents.

We will explore this in more detail soon, providing guidance on defining neurons, setting up circuits, and developing secure agentic workflows.

#### Step 1: Configure local port:

Create a .env file at the root of the project and define the port for this runtime:

```
PORT=8103
```

---

### 6. Core Runtime

- **Purpose**: The **Core Runtime** serves as the **secure entry boundary** to the entire system. It acts as the central access point, managing requests and routing them appropriately to the other three runtimes (API, Synaptic, Web). This is the only runtime that needs to be exposed on the **Internet** or **Intranet** to access the application.

- **Key Role**:
  - Manages and **proxies requests** to the other runtimes, ensuring that external access is limited to the core, while internal requests are forwarded to the relevant services.
  - Provides a **secure boundary** for the system, isolating internal services and applications from direct exposure to the external environment.
  - Configured to proxy requests to the API, Synaptic, and Web runtimes, ensuring smooth communication and access across the system.

**Steps for Setting Up Proxies to Other Runtimes:**

We will guide the user through configuring proxies to the other three services by updating the **plugin EaC definition**.

#### Step 1: Open the Plugin Configuration

Navigate to the `src/Plugins/` directory and open the `MyCoreRuntimePlugin.ts` file. In this file, you will configure the proxies for each of the other runtimes.

#### Step 2: Add Application Configurations

Within the `MyCoreRuntimePlugin.ts` file, define the application configurations for the API, Synaptic (thinkyCircuits), and Web runtimes. Here’s the code to add:

```typescript
Applications: {
  api: {
    Details: {
      Name: 'API',
      Description: 'The API proxy.',
    },
    ModifierResolvers: {},
    Processor: {
      Type: 'Proxy',
      ProxyRoot: Deno.env.get('PROCONEX_API_ROOT')!,
    } as EaCProxyProcessor,
  },
  thinkyCircuits: {
    Details: {
      Name: 'Thinky',
      Description: 'The API for accessing thinky',
    },
    ModifierResolvers: {},
    Processor: {
      Type: 'Proxy',
      ProxyRoot: Deno.env.get('PROCONEX_SYNAPTIC_ROOT')!,
    } as EaCProxyProcessor,
  },
  web: {
    Details: {
      Name: 'Dashboard',
      Description: 'The Dashboard.',
    },
    ModifierResolvers: {},
    Processor: {
      Type: 'Proxy',
      ProxyRoot: Deno.env.get('PROCONEX_WEB_ROOT')!,
    } as EaCProxyProcessor,
  },
},
```

This defines how requests are proxied to the API, Synaptic, and Web services using their respective `ProxyRoot` environment variables.

#### Step 3: Configure Application Resolvers

Next, you will configure the project with appropriate application resolvers. These resolvers define the path patterns and priority levels for routing traffic to the correct services:

```typescript
ApplicationResolvers: {
  api: {
    PathPattern: '/api*',
    Priority: 300,
  },
  thinkyCircuits: {
    PathPattern: '/api/thinky*',
    Priority: 500,
  },
  web: {
    PathPattern: '*',
    Priority: 100,
  },
},
```

This ensures that API requests (`/api*`), Synaptic requests (`/api/thinky*`), and general web requests (`*`) are routed to the appropriate services.

#### Step 4: Final Core Configuration

Here’s the final configuration for the **Core Runtime Plugin**:

```typescript
import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
} from '@fathym/eac-runtime';

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
                Priority: 300,
              },
              thinkyCircuits: {
                PathPattern: '/api/thinky*',
                Priority: 500,
              },
              web: {
                PathPattern: '*',
                Priority: 100,
              },
            },
          },
        },
        Applications: {
          api: {
            Details: {
              Name: 'API',
              Description: 'The API proxy.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: Deno.env.get('PROCONEX_API_ROOT')!,
            } as EaCProxyProcessor,
          },
          thinkyCircuits: {
            Details: {
              Name: 'Thinky',
              Description: 'The API for accessing thinky',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: Deno.env.get('PROCONEX_SYNAPTIC_ROOT')!,
            } as EaCProxyProcessor,
          },
          web: {
            Details: {
              Name: 'Dashboard',
              Description: 'The Dashboard.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: Deno.env.get('PROCONEX_WEB_ROOT')!,
            } as EaCProxyProcessor,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
```

#### Step 5: Configure local port:

Create a .env file at the root of the project and define the port for this runtime:

```
PORT=8100
```

This configuration sets up the **Core Runtime** to act as the secure entry point, proxying requests to the **API**, **Synaptic**, and **Web** runtimes based on the defined path patterns and resolvers.

---

## Conclusion

In this document, we've reviewed the core repositories in the **Golden Path** configuration for building agentic workflows with **Fathym Everything as Code (EaC)** and **Synaptic AI**. Each repository serves a distinct and vital role in enabling a scalable, secure, and flexible multi-agent system:

- **Reference Architecture** forms the foundation by centralizing reusable code and configurations used across all other runtimes.
- **Atomic Design Kit** provides a flexible UI system with pre-built components and icons that can be easily extended for your custom workflows.
- **API Runtime** is where all business logic and external integrations occur. It exposes well-defined, easy-to-use APIs that isolate other layers and simplify usage in Synaptic circuits.
- **Web Runtime** delivers efficient, Preact-based frontends using the Islands Architecture, supporting Tailwind CSS and Atomic Icons for seamless, modern web interfaces.
- **Synaptic Runtime** defines circuits and neurons, enabling the creation of reusable agentic workflows. It hosts circuits for consumption, enforcing secure boundaries around which workflows can be accessed externally.
- **Core Runtime** acts as the secure entry point, handling all incoming traffic and proxying requests to the API, Web, and Synaptic runtimes. It ensures that only this runtime is exposed, while the others remain protected behind secure proxies.

By following this setup, you create a highly secure, scalable system with clean separation between layers, allowing for flexibility, maintainability, and efficient collaboration across your enterprise's workflows. Each runtime plays a crucial part in building agentic workflows, ensuring that systems can scale, adapt, and evolve over time with minimal friction.
