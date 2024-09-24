# Building the Agent: Frontend Chat Interface and Synaptic Circuit

This guide outlines the process of building an intelligent agent by integrating a chat interface with backend circuits. The goal is to connect the frontend chat interface, powered by Thinky, to a series of Synaptic circuits that process user inputs. Initially, the circuit will return the input as-is, but we'll enhance this functionality by calling a Large Language Model (LLM) to provide dynamic, intelligent responses. By the end, you'll have a system capable of real-time interaction between the user and an LLM-driven backend.

## Part 1: Frontend Chat Interface (Web Runtime)

### Step 1: Creating the Thinky Wrapper

We’ll start by setting up a **Thinky** wrapper for your chat interface, using the **GFM renderer** to display messages in markdown format.

1. In your **web-runtime** project, navigate to `apps/islands/organisms/`.
2. Create a new file named `{OrgName}Thinky.tsx`. Replace `{OrgName}` with your organization's name.
3. Add the following content:

```typescript
import { render as gfmRender } from 'https://deno.land/x/gfm@0.6.0/mod.ts';
import { Thinky, type ThinkyProps } from '@{org-name}/atomic';

export const IsIsland = true;

export type {OrgName}ThinkyProps = ThinkyProps;

export default function {OrgName}Thinky(props: {OrgName}ThinkyProps) {
  return (
    <Thinky
      renderMessage={(msg) => gfmRender(msg.content?.toString() || '')}
      {...props}
    />
  );
}
```

This wrapper will use the **GFM renderer** to handle the markdown formatting of messages passed into Thinky.

---

### Step 2: Integrating Thinky into the Frontend

Next, we’ll integrate the Thinky chat interface into your application’s main page, allowing it to connect to circuits.

1. Open `apps/home/index.tsx`.
2. Replace the existing content with the following code:

```typescript
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import Counter from '../islands/Counter.tsx';
import {OrgName}Thinky from '../islands/organisms/{OrgName}Thinky.tsx';
import { {OrgName}WebState } from '../../src/state/{OrgName}WebState.ts';

type IndexPageData = {
  ActiveChat: string;
  Chats: Record<string, ChatSet>;
  JWT: string;
  Root: string;
  Name: string;
  Text: string;
}

export const handler: EaCRuntimeHandlerResult<{OrgName}WebState, IndexPageData> = {
  GET: async (_req, ctx) => {
    const resp = await fetch(`http://localhost:8100/api`);

    const { Random } = await resp.json() as { Random: string };

    return ctx.Render({
      Name: `The Random: ${Random}`,
      Text: `We met the latest Random, ${Random}, at around ${ctx.State.CurrentDate}`,
      ActiveChat: Random,
      Chats: {
        [Random]: {
          Name: 'UR Workflows',
          CircuitLookup: 'my-first-circuit',
        },
      },
      Root: '/api/thinky/circuits/',
    });
  },
};

export default function Index({ Data }: PageProps<IndexPageData>) {
  return (
    <{OrgName}Thinky
      activeChat={Data.ActiveChat}
      chats={Data.Chats}
      jwt={Data.JWT}
      root={Data.Root}
    >
      <div class='py-16 px-4 bg-slate-500'>
        <div class='mx-auto block w-[350px] text-center'>
          <h1 class='text-4xl'>{Data.Name}</h1>
          <p class='text-lg'>{Data.Text}</p>

          <div class='flex flex-row py-8'>
            <Counter />
          </div>
        </div>
      </div>

      <div class='p-4'>
        <h2 class='text-2xl'>Welcome</h2>
      </div>
    </{OrgName}Thinky>
  );
}
```

This connects the Thinky interface to the backend circuits, setting up the chat interface to communicate with the system.

---

## Part 2: Developing the Circuit (Synaptic Runtime)

We’ll now move to the **Synaptic Runtime** to develop a circuit that returns user input. Later, we’ll enhance this circuit by integrating an **LLM** for more dynamic responses.

### Phase 1: Build a Simple Circuit Returning User Input

We recommend organizing circuits and neurons into individual plugins. You’ll create a simple tool, wrap it in a neuron, and call it from a circuit.

---

#### Step 1: Creating the `MyCircuitsPlugin.ts` File

1. Navigate to `src/circuits/` in your **synaptic-runtime** project.
2. Create a new file named `MyCircuitsPlugin.ts`.
3. Add the following content:

```typescript
import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
} from '@fathym/eac-runtime';
import {
  EaCDynamicToolDetails,
  EaCLinearCircuitDetails,
  EaCPassthroughNeuron,
  EaCToolNeuron,
} from '@fathym/synaptic';
import { z } from 'npm:zod';

export default class MyFirstCircuitPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(_config: EaCRuntimeConfig) {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: MyFirstCircuitPlugin.name,
      Plugins: [],
      EaC: {
        AIs: {
          [MyFirstCircuitPlugin.name]: {
            Tools: {
              simpleTool: {
                Details: {
                  Type: 'Dynamic',
                  Name: 'Simple Tool',
                  Description: 'A simple tool that processes a string input.',
                  Schema: z.object({ Value: z.string() }),
                  Action: ({ Value }: { Value: string }) => {
                    return Promise.resolve(`Tool Processed: ${Value}`);
                  },
                } as EaCDynamicToolDetails,
              },
            },
          },
        },
        Circuits: {
          $neurons: {
            $pass: {
              Type: 'Passthrough',
            } as EaCPassthroughNeuron,
          },
          'my-first-circuit': {
            Details: {
              Type: 'Linear',
              Name: 'My First Circuit',
              Description: 'A simple circuit that processes user input.',
              Neurons: {
                '': {
                  Type: 'Tool',
                  ToolLookup: `${MyFirstCircuitPlugin.name}|simpleTool`,
                  BootstrapInput: ({ Input }: { Input: string }) => ({
                    Value: Input,
                  }),
                  BootstrapOutput: (output: string) => ({ Result: output }),
                } as EaCToolNeuron,
              },
            } as EaCLinearCircuitDetails,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
```

#### Step 2: Integrating the Circuit with `MyCoreSynapticPlugin`

Next, you’ll integrate this circuit into the core Synaptic plugin.

1. Open `src/plugins/MyCoreSynapticPlugin.ts`.
2. Replace the existing content with:

```typescript
import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
} from '@fathym/eac-runtime';
import { MyFirstCircuitPlugin } from '../circuits/MyFirstCircuitPlugin.ts';

export default class MyCoreSynapticPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(_config: EaCRuntimeConfig) {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: MyCoreSynapticPlugin.name,

      Plugins: [new MyFirstCircuitPlugin()],
    };

    return Promise.resolve(pluginConfig);
  }
}
```

This step ensures the `MyFirstCircuitPlugin` is included in the Synaptic runtime.

---

Here’s the fully updated **Phase 2** section, incorporating the necessary steps to configure the **LLM integration**, update the **AI as Code configuration**, and modify the circuit to use a reusable neuron for calling the LLM. Additionally, it includes instructions for updating the frontend to connect to the new circuit.

---

### Phase 2: Update the Circuit to Call an LLM

In this phase, we’ll enhance the circuit to call a **Large Language Model (LLM)**, specifically OpenAI’s GPT-4 model, for more dynamic responses. This involves updating the **AI as Code (EaC)** configuration, adding the LLM to the circuits, and configuring a second circuit to interact with the LLM.

#### Step 1: Set Up an OpenAI API Key

Before configuring the circuit, you’ll need an OpenAI API key to enable LLM calls.

1. **Sign Up or Log In to OpenAI**:
   - Go to [OpenAI](https://openai.com) and either sign up for an account or log in to your existing account.
2. **Generate an API Key**:

   - Navigate to the **API keys** section and generate a new API key.

3. **Store the API Key**:

   - Add the API key as an environment variable in your local setup by creating an `.env` file in your **synaptic-runtime** directory with the following content:

   ```bash
   OPENAI_KEY=your_openai_api_key_here
   ```

#### Step 2: Update the AI as Code (EaC) Configuration

Next, we will update the **AI as Code** configuration to define the OpenAI LLM integration.

1. Open your `MyCircuitsPlugin.ts` file.
2. Update the **AIs** definition to include the OpenAI configuration:

```typescript
EaC: {
  AIs: {
    [MyFirstCircuitPlugin.name]: {
      LLMs: {
        openai: {
          Details: {
            Type: 'OpenAI',
            Name: 'Open AI LLM',
            Description: 'A default Open AI LLM configuration.',
            APIKey: Deno.env.get('OPENAI_KEY')!,
            ModelName: 'gpt-4',
            Streaming: true,
          } as EaCOpenAILLMDetails,
        },
      },
    },
  },
},
```

- **LLM Configuration Details**:
  - **APIKey**: The OpenAI API key fetched from the `.env` file.
  - **ModelName**: The GPT-4 model (`gpt-4` or your choice of available models).
  - **Streaming**: Set to `true` to enable streaming responses.

#### Step 3: Configure the LLM Neuron in the Circuit

Now, we will configure a **Neuron** to wrap the LLM configuration and create a new circuit that calls the LLM.

1. Update your **Circuits** definition to add an LLM neuron:

```typescript
Circuits: {
  $neurons: {
    [`${SYNAPTIC_CORE}:llm`]: {
      Type: 'LLM',
      LLMLookup: `${MyFirstCircuitPlugin.name}|openai`,
    } as EaCLLMNeuron,
  },
},
```

This defines a reusable **LLM neuron** that references the OpenAI LLM configuration.

#### Step 4: Create a Second Circuit to Call the LLM

Now that the LLM is configured, we’ll create a second circuit that calls the LLM with a chat prompt.

1. Add a second circuit to your **MyCircuitsPlugin.ts** file:

```typescript
Circuits: {
  'my-second-circuit': {
    Details: {
      Type: 'Linear',
      Name: 'My Second Circuit',
      Description: 'A circuit that interacts with the LLM using a chat prompt.',
      Neurons: {
        '': {
          Type: 'ChatPrompt',
          BootstrapInput: ({ Input }: { Input: string }) => ({
            Messages: [new HumanMessage(Input || 'Hi')],
          }),
          SystemMessage: `Greet the user, and offer to assist with any questions.`,
          NewMessages: [new MessagesPlacehold('Messages')],
          Neurons: {
            '': `${MyFirstCircuitPlugin.name}:openai`,
          },
          BootstrapOutput: (msg: BaseMessage) => {
            return {
              Messages: [msg],
            } as ThinkyCompanyRagChatGraphStateSchema;
          },
        } as EaCChatPromptNeuron,
      },
    } as EaCLinearCircuitDetails,
  },
},
```

- **ChatPrompt Configuration**:
  - **SystemMessage**: The system message that prompts the LLM to interact with the user. This can be customized for your needs.
  - **Neurons**: The neuron interacts with the OpenAI LLM, passing the user’s input through the configured prompt.

#### Step 5: Update the Frontend to Use the New Circuit

Finally, update your **IndexPage** handler so that it connects the frontend chat interface to the new circuit.

1. Open the `apps/home/index.tsx` file.
2. Update the **Chats** section in the **IndexPageData** to point to the new circuit:

```typescript
export const handler: EaCRuntimeHandlerResult<{OrgName}WebState, IndexPageData> = {
  GET: async (_req, ctx) => {
    const resp = await fetch(`http://localhost:8100/api`);

    const { Random } = await resp.json() as { Random: string };

    return ctx.Render({
      Name: `The Random: ${Random}`,
      Text: `We met the latest Random, ${Random}, at around ${ctx.State.CurrentDate}`,
      ActiveChat: `${ctx.State.Username}-ur-workflows`,
      Chats: {
        [`${ctx.State.Username}-ur-workflows`]: {
          Name: 'UR Workflows',
          CircuitLookup: 'my-second-circuit',  // Updated circuit
        },
        [`${ctx.State.Username}-explore`]: {
          Name: 'Explore Proconex',
          CircuitLookup: 'proconex:rag-chat:company',
        },
      },
      Root: '/api/thinky/circuits/',
    });
  },
};
```

This change connects the chat interface to the new circuit (`my-second-circuit`), which interacts with the LLM to provide dynamic responses.

---

## Conclusion

By following this guide, you have successfully integrated both a frontend chat interface and a backend Synaptic circuit. In Phase 1, you created a basic circuit that simply returned user input. In Phase 2, you enhanced that circuit by integrating an LLM to generate intelligent, context-aware responses.

This architecture enables dynamic, real-time interactions between users and the backend via a chat interface. The agent you've built is now capable of leveraging advanced language models to provide more complex, responsive answers, making it a powerful tool for handling user queries and automating interactions. This is just the foundation—you can further extend this setup by adding more circuits, neurons, and other integrations as needed..
