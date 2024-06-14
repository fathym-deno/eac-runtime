import {
  EaCDenoKVDatabaseDetails,
  initializeDenoKv,
  IoCContainer,
  isEaCDenoKVDatabaseDetails,
} from '../../src.deps.ts';
import { EaCRuntimeEaC } from '../../runtime/EaCRuntimeEaC.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';

export default class FathymEaCServicesPlugin implements EaCRuntimePlugin {
  public AfterEaCResolved(
    eac: EaCRuntimeEaC,
    ioc: IoCContainer,
  ): Promise<void> {
    return Promise.resolve(this.configureEaCServices(eac, ioc));
  }

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymEaCServicesPlugin',
    };

    return Promise.resolve(pluginConfig);
  }

  protected configureEaCDatabases(eac: EaCRuntimeEaC, ioc: IoCContainer): void {
    const dbLookups = Object.keys(eac!.Databases || {});

    dbLookups.forEach((dbLookup) => {
      const db = eac!.Databases![dbLookup];

      if (isEaCDenoKVDatabaseDetails(db.Details)) {
        const dbDetails = db.Details as EaCDenoKVDatabaseDetails;

        ioc.Register(Deno.Kv, () => initializeDenoKv(dbDetails.DenoKVPath), {
          Lazy: true,
          Name: dbLookup,
        });
      }
    });
  }

  protected configureEaCServices(eac: EaCRuntimeEaC, ioc: IoCContainer): void {
    this.configureEaCDatabases(eac, ioc);
  }
}
