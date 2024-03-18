import { assertEquals, base64, denoGraph } from '../../test.deps.ts';

Deno.test('ESM Module Graph', async (t) => {
  await t.step('Fathym Atomic', async () => {
    const graph = await denoGraph.createGraph(
      'https://deno.land/x/fathym_atomic_design_kit@v0.0.86/mod.ts',
      {}
    );

    const modules: { specifier: string }[] = graph.modules;
        
    console.log(modules.map(m => m.specifier));
  });
});
