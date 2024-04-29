import { convertFilePathToPattern } from '../../src/utils/dfs/convertFilePathToPattern.ts';
import { assert, assertEquals, base64 } from '../test.deps.ts';

Deno.test('API Imports', async (t) => {
  await t.step('URL Pattern', async () => {
    const paths = [
      // '/path/to/[[optional]]/index.tsx',
      '/path/to/[[optional]]/[[optional2]]/index.tsx',
      '/path/to/[[optional]]/[[optional2]]/settings.tsx',
    ];

    const patterns = paths
      .flatMap((path) => convertFilePathToPattern(path, 'index.tsx'))
      .sort(({ priority: aPriority }, { priority: bPriority }) => {
        return bPriority - aPriority;
      });

    console.log(patterns);

    const checks = [
      'https://notused.com/path/to',
      'https://notused.com/path/to/thing',
      'https://notused.com/path/to/thing/settings',
    ];

    checks.forEach((check) => {
      const pattern = patterns.find(({ patternText }) => {
        const pattern = new URLPattern({ pathname: patternText });

        return pattern.test(check);
      });

      assert(pattern, check);
    });
  });

  await t.step('Dynamic API Module Loading', async () => {
    const fileStr = await Deno.readFile('./tests/api/TestAPIImport.ts');

    const enc = base64.encodeBase64(fileStr);

    const dynUrl = `data:application/typescript;base64,${enc}`;

    const testApiCls = await import(dynUrl);

    const testApi = new testApiCls.default();

    const actual = testApi.Hello();

    assertEquals(actual, 'World');
  });
});
