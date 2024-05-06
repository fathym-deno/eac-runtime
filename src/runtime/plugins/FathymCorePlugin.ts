import { IoCContainer } from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import FathymEaCServicesPlugin from './FathymEaCServicesPlugin.ts';
import FathymDFSFileHandlerPlugin from './FathymDFSFileHandlerPlugin.ts';
import FathymModifierHandlerPlugin from './FathymModifierHandlerPlugin.ts';
import FathymProcessorHandlerPlugin from './FathymProcessorHandlerPlugin.ts';
import FathymEaCPlugin from './FathymEaCPlugin.ts';

export default class FathymCorePlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymCorePlugin',
      IoC: new IoCContainer(),
      Plugins: [
        new FathymProcessorHandlerPlugin(),
        new FathymModifierHandlerPlugin(),
        new FathymDFSFileHandlerPlugin(),
        new FathymEaCPlugin(),
        new FathymEaCServicesPlugin(),
      ],
    };

    return Promise.resolve(pluginConfig);
  }
}
