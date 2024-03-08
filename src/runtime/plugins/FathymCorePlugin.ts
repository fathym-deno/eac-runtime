import { IoCContainer, options as preactOptions } from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import FathymEaCServicesPlugin from './FathymEaCServicesPlugin.ts';
import FathymDFSFileHandlerPlugin from './FathymDFSFileHandlerPlugin.ts';
import FathymModifierHandlerPlugin from './FathymModifierHandlerPlugin.ts';
import FathymProcessorHandlerPlugin from './FathymProcessorHandlerPlugin.ts';
import FathymEaCPlugin from './FathymEaCPlugin.ts';
import { PreactRenderHandler } from '../apps/preact/PreactRenderHandler.ts';

export default class FathymCorePlugin implements EaCRuntimePlugin {
  public Build(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
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

    pluginConfig.IoC!.Register(PreactRenderHandler, () => {
      return new PreactRenderHandler(preactOptions);
    });

    return Promise.resolve(pluginConfig);
  }
}
