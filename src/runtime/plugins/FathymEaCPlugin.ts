import { colors, djwt, loadEaCSvc } from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymEaCPlugin implements EaCRuntimePlugin {
  public async Setup(
    _config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymEaCPlugin',
    };

    const eacApiKey = Deno.env.get('EAC_API_KEY');

    if (eacApiKey) {
      try {
        const [_header, payload] = await djwt.decode(eacApiKey);

        const { EnterpriseLookup } = payload as Record<string, string>;

        const eacSvc = await loadEaCSvc(eacApiKey);

        const eac = await eacSvc.Get(EnterpriseLookup as string);

        pluginConfig.EaC = eac;

        console.log(
          `Loaded and merged EaC configuration for: '${
            colors.blue(
              EnterpriseLookup,
            )
          }'`,
        );
      } catch (_err) {
        console.error(
          'Unable to connect to the EaC service, falling back to local config.',
        );
      }
    }

    return pluginConfig;
  }
}
