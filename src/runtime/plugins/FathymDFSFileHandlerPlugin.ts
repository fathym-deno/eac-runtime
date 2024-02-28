import { IoCContainer } from '../../src.deps.ts';
import { EaCLocalDistributedFileSystemHandlerResolver } from '../dfs/EaCLocalDistributedFileSystemHandlerResolver.ts';
import { EaCNPMDistributedFileSystemHandlerResolver } from '../dfs/EaCNPMDistributedFileSystemHandlerResolver.ts';
import { UnknownEaCDistributedFileSystemHandlerResolver } from '../dfs/UnknownEaCDistributedFileSystemHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymDFSFileHandlerPlugin implements EaCRuntimePlugin {
  public Build(): Promise<EaCRuntimePluginConfig> {
    const config: EaCRuntimePluginConfig = {
      Name: 'FathymDFSFileHandlerPlugin',
      IoC: new IoCContainer(),
    };

    config.IoC!.Register(() => EaCLocalDistributedFileSystemHandlerResolver, {
      Name: 'EaCLocalDistributedFileSystem',
      Type: config.IoC!.Symbol('DFSFileHandlerResolver'),
    });

    config.IoC!.Register(() => EaCNPMDistributedFileSystemHandlerResolver, {
      Name: 'EaCNPMDistributedFileSystem',
      Type: config.IoC!.Symbol('DFSFileHandlerResolver'),
    });

    config.IoC!.Register(() => UnknownEaCDistributedFileSystemHandlerResolver, {
      Name: 'UnknownEaCDistributedFileSystem',
      Type: config.IoC!.Symbol('DFSFileHandlerResolver'),
    });

    return Promise.resolve(config);
  }
}
