import {
  DefaultEaCConfig,
  defineEaCConfig,
  EaCRuntime,
  FathymDemoPlugin,
  IS_BUILDING,
} from '@fathym/eac/runtime';

export const config = defineEaCConfig({
  Plugins: [new FathymDemoPlugin(), ...(DefaultEaCConfig.Plugins || [])],
});

export function configure(_rt: EaCRuntime): Promise<void> {
  if (IS_BUILDING) {
    Deno.env.set('SUPPORTS_WORKERS', 'false');
  }

  return Promise.resolve();
}
