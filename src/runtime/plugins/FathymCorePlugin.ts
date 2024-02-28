import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import FathymAppHandlerPlugin from './FathymAppHandlerPlugin.ts';
import FathymEaCPlugin from './FathymEaCPlugin.ts';

export default class FathymCorePlugin implements EaCRuntimePlugin {
  public Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymCorePlugin',
      Plugins: [new FathymAppHandlerPlugin(), new FathymEaCPlugin()],
    };

    return Promise.resolve(config);
  }
}
