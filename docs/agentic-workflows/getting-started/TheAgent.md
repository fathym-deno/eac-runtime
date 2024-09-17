# Building the Agent: Frontend Chat Interface and Synaptic Circuit

This guide walks through building an agent by connecting a chat interface to circuits. You’ll first integrate a **Thinky** chat interface into your frontend, and then build and enhance a **Synaptic circuit** that processes user input. Finally, we’ll upgrade the circuit to call a **Large Language Model (LLM)** for more advanced functionality.

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

### Step 1: Creating the `MyCircuitsPlugin.ts` File

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
              InputSchema: z.object({
                Input: z.string().describe('User input for the circuit'),
              }),
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

### Step 2: Integrating the Circuit with `MyCoreSynapticPlugin`

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

### Phase 2: Update the Circuit to Call an LLM

We’ll now enhance the circuit to call a **Large Language Model (LLM)**.

1. Open `MyCircuitsPlugin.ts` and update the circuit:

```typescript
import { SynapticCircuit } from '@fathym/synaptic';
import { callLLM } from '@fathym/llm-client';

export default class MyCircuitsPlugin implements SynapticPlugin {
  public Setup(): SynapticCircuit[] {
    return [
      {
        Name: 'ReturnUserInputCircuit',
        Handler: async (req, ctx) => {
          const userInput = req.Body?.input || 'No input provided';
          const llmResponse = await callLLM({
            prompt: `User input: ${userInput}`,
          });
          return ctx.Respond({ content: llmResponse });
        },
      },
    ];
  }
}
```

Now, your circuit will call an LLM and return dynamic responses based on the user’s input.

---

## Conclusion

You’ve set up both the **frontend chat interface** and the **backend circuit**. In **Phase 1**, the circuit returned the user’s input, and in **Phase 2**, you enhanced it to call an LLM for more dynamic responses.

This setup enables real-time interactions between your chat interface and an intelligent backend powered by LLMs.
