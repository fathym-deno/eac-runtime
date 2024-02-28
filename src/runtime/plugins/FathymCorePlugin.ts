import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import FathymModifierHandlerPlugin from './FathymModifierHandlerPlugin.ts';
import FathymProcessorHandlerPlugin from './FathymProcessorHandlerPlugin.ts';
import FathymEaCPlugin from './FathymEaCPlugin.ts';

export default class FathymCorePlugin implements EaCRuntimePlugin {
  public Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymCorePlugin',
      Plugins: [
        new FathymProcessorHandlerPlugin(),
        new FathymModifierHandlerPlugin(),
        new FathymEaCPlugin(),
      ],
    };

    return Promise.resolve(config);
  }
}
