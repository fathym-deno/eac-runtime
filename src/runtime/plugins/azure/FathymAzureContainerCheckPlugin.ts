import { EaCResponseProcessor, IoCContainer } from '../../../src.deps.ts';
import { EaCRuntimeConfig } from '../../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from '../EaCRuntimePlugin.ts';

/**
 * Used to configure a handler for the azure container start processes.
 */
export default class FathymAzureContainerCheckPlugin implements EaCRuntimePlugin {
  public Build(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymAzureContainerCheckPlugin',
      IoC: new IoCContainer(),
      Plugins: [],
      EaC: {
        Projects: {
          azureContainerCheck: {
            Details: {
              Name: 'Everything as Code Azure Container Check',
              Description: 'A check used by azure to determine if the container is running.',
              Priority: 200,
            },
            ResolverConfigs: {
              azureHook: {
                Hostname: '*',
                Path: '/robots933456.txt',
                Port: config.Server.port,
              },
            },
            ApplicationResolvers: {
              azureContainerCheck: {
                PathPattern: '*',
                Priority: 100,
              },
            },
          },
        },
        Applications: {
          azureContainerCheck: {
            Details: {
              Name: 'Azure Container Check',
              Description: 'A response for the azure container check.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Response',
              Body: '',
              Status: 200,
            } as EaCResponseProcessor,
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
