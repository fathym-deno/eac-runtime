import { colors, djwt, getPackageLogger, loadEaCSvc, loadJwtConfig } from '../../src.deps.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymEaCPlugin implements EaCRuntimePlugin {
  public async Setup(
    _config: EaCRuntimeConfig,
  ): Promise<EaCRuntimePluginConfig> {
    const logger = await getPackageLogger(import.meta);

    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymEaCPlugin',
    };

    let eacApiKey = Deno.env.get('EAC_API_KEY');

    if (!eacApiKey) {
      const eacApiEntLookup = Deno.env.get('EAC_API_ENTERPRISE_LOOKUP');

      if (eacApiEntLookup) {
        const eacApiUsername = Deno.env.get('EAC_API_USERNAME');

        eacApiKey = await loadJwtConfig().Create(
          {
            EnterpriseLookup: eacApiEntLookup,
            Username: eacApiUsername,
          },
          60 * 60 * 1,
        );
      }
    }

    if (eacApiKey) {
      try {
        const [_header, payload] = await djwt.decode(eacApiKey);

        const { EnterpriseLookup } = payload as Record<string, string>;

        const eacSvc = await loadEaCSvc(eacApiKey);

        const eac = await eacSvc.Get(EnterpriseLookup as string);

        pluginConfig.EaC = eac;

        logger.debug(
          `Loaded and merged EaC configuration for: '${
            colors.blue(
              EnterpriseLookup,
            )
          }'`,
        );
      } catch (_err) {
        logger.error(
          'Unable to connect to the EaC service, falling back to local config.',
        );
      }
    }

    return pluginConfig;
  }
}
