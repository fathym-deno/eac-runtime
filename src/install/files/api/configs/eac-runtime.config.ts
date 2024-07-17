import { DefaultEaCConfig, defineEaCConfig, EaCRuntime } from '@fathym/eac/runtime';
import MyCoreRuntimePlugin from '../src/plugins/MyCoreRuntimePlugin.ts';

export const config = defineEaCConfig({
  Plugins: [...(DefaultEaCConfig.Plugins || []), new MyCoreRuntimePlugin()],
});

export function configure(_rt: EaCRuntime): Promise<void> {
  return Promise.resolve();
}
