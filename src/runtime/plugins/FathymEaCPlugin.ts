import { djwt, loadEaCSvc } from '../../src.deps.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymEaCPlugin implements EaCRuntimePlugin {
  public async Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymEaCPlugin',
    };

    const eacApiKey = Deno.env.get('EAC_API_KEY');

    if (eacApiKey) {
      try {
        const [_header, payload] = await djwt.decode(eacApiKey);

        const { EnterpriseLookup } = payload as Record<string, unknown>;

        const eacSvc = await loadEaCSvc(eacApiKey);

        const eac = await eacSvc.Get(EnterpriseLookup as string);

        config.EaC = eac;
      } catch (err) {
        console.error(
          'Unable to connect to the EaC service, falling back to local config.',
        );
        console.error(err);
      }
    }

    return config;
  }
}
