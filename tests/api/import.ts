import { assertEquals, base64 } from '../test.deps.ts';

Deno.test('Dynamic Module Loading', async () => {
  const fileStr = await Deno.readFile('./tests/api/TestAPIImport.ts');

  const enc = base64.encodeBase64(fileStr);

  const dynUrl = `data:application/typescript;base64,${enc}`;

  const testApiCls = await import(dynUrl);

  const testApi = new testApiCls.default();

  const actual = testApi.Hello();

  assertEquals(actual, 'World');
});
