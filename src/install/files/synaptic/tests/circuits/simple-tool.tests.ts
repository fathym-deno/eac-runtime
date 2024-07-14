import { assertStringIncludes } from '@fathym/eac/runtime/tests/test.deps.ts';
import { assert, EverythingAsCodeSynaptic, Runnable } from '../tests.deps.ts';
import MyCoreRuntimePlugin from '../../src/plugins/MyCoreRuntimePlugin.ts';
import { buildTestIoC } from '../test-eac-setup.ts';

Deno.test('Simple Tool Tests', async (t) => {
  const eac = {} as EverythingAsCodeSynaptic;

  const { ioc } = await buildTestIoC(eac, [new MyCoreRuntimePlugin()]);

  await t.step('Invoke', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'thinky-public:open-chat',
    );

    const response = await circuit.invoke({
      Input: 'What is the weather in Erie, CO?',
    });

    assert(response?.Result);
    assertStringIncludes('Tool Processed: ', response.Result);
    assert(response.Result.startsWith('Tool Processed: '));

    console.log(response.Result);
  });
});
