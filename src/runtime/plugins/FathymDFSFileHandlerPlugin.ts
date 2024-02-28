import { IoCContainer } from '../../src.deps.ts';
import { EaCLocalDistributedFileSystemHandlerResolver } from '../dfs/EaCLocalDistributedFileSystemHandlerResolver.ts';
import { EaCNPMDistributedFileSystemHandlerResolver } from '../dfs/EaCNPMDistributedFileSystemHandlerResolver.ts';
import { UnknownEaCDistributedFileSystemHandlerResolver } from '../dfs/UnknownEaCDistributedFileSystemHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymDFSFileHandlerPlugin implements EaCRuntimePlugin {
  public Build(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymDFSFileHandlerPlugin',
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(() => EaCLocalDistributedFileSystemHandlerResolver, {
      Name: 'EaCLocalDistributedFileSystem',
      Type: pluginConfig.IoC!.Symbol('DFSFileHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => EaCNPMDistributedFileSystemHandlerResolver, {
      Name: 'EaCNPMDistributedFileSystem',
      Type: pluginConfig.IoC!.Symbol('DFSFileHandlerResolver'),
    });

    pluginConfig.IoC!.Register(() => UnknownEaCDistributedFileSystemHandlerResolver, {
      Name: 'UnknownEaCDistributedFileSystem',
      Type: pluginConfig.IoC!.Symbol('DFSFileHandlerResolver'),
    });

    return Promise.resolve(pluginConfig);
  }
}
