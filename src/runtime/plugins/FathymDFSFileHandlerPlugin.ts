import { IoCContainer } from '../../src.deps.ts';
import { DefaultDFSFileHandlerResolver } from '../dfs/_DefaultDFSFileHandlerResolver.ts';
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

    pluginConfig.IoC!.Register(DefaultDFSFileHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
    });

    pluginConfig.IoC!.Register(() => EaCLocalDistributedFileSystemHandlerResolver, {
      Name: 'EaCLocalDistributedFileSystem',
      Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
    });

    pluginConfig.IoC!.Register(() => EaCNPMDistributedFileSystemHandlerResolver, {
      Name: 'EaCNPMDistributedFileSystem',
      Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
    });

    pluginConfig.IoC!.Register(() => UnknownEaCDistributedFileSystemHandlerResolver, {
      Name: 'UnknownEaCDistributedFileSystem',
      Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
    });

    return Promise.resolve(pluginConfig);
  }
}
