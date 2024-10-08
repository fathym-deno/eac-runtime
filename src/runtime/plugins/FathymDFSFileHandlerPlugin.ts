import { IoCContainer } from '../../src.deps.ts';
import { DefaultDFSFileHandlerResolver } from '../dfs/DefaultDFSFileHandlerResolver.ts';
import { EaCDenoKVDistributedFileSystemHandlerResolver } from '../dfs/EaCDenoKVDistributedFileSystemHandlerResolver.ts';
import { EaCESMDistributedFileSystemHandlerResolver } from '../dfs/EaCESMDistributedFileSystemHandlerResolver.ts';
import { EaCJSRDistributedFileSystemHandlerResolver } from '../dfs/EaCJSRDistributedFileSystemHandlerResolver.ts';
import { EaCLocalDistributedFileSystemHandlerResolver } from '../dfs/EaCLocalDistributedFileSystemHandlerResolver.ts';
import { EaCNPMDistributedFileSystemHandlerResolver } from '../dfs/EaCNPMDistributedFileSystemHandlerResolver.ts';
import { EaCRemoteDistributedFileSystemHandlerResolver } from '../dfs/EaCRemoteDistributedFileSystemHandlerResolver.ts';
import { EaCWorkerDistributedFileSystemHandlerResolver } from '../dfs/EaCWorkerDistributedFileSystemHandlerResolver.ts';
import { UnknownEaCDistributedFileSystemHandlerResolver } from '../dfs/UnknownEaCDistributedFileSystemHandlerResolver.ts';
import { EaCRuntimePlugin } from './EaCRuntimePlugin.ts';
import { EaCRuntimeConfig } from '../config/EaCRuntimeConfig.ts';
import { EaCRuntimePluginConfig } from '../config/EaCRuntimePluginConfig.ts';

export default class FathymDFSFileHandlerPlugin implements EaCRuntimePlugin {
  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'FathymDFSFileHandlerPlugin',
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultDFSFileHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
    });

    pluginConfig.IoC!.Register(
      () => EaCDenoKVDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCDenoKVDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCESMDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCESMDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCJSRDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCJSRDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCLocalDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCLocalDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCNPMDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCNPMDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCRemoteDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCRemoteDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => EaCWorkerDistributedFileSystemHandlerResolver,
      {
        Name: 'EaCWorkerDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    pluginConfig.IoC!.Register(
      () => UnknownEaCDistributedFileSystemHandlerResolver,
      {
        Name: 'UnknownEaCDistributedFileSystem',
        Type: pluginConfig.IoC!.Symbol('DFSFileHandler'),
      },
    );

    return Promise.resolve(pluginConfig);
  }
}
