import { DFSFileHandlerResolver } from '../DFSFileHandlerResolver.ts';
import { EaCDistributedFileSystemWorker } from './EaCDistributedFileSystemWorker.ts';
import { EaCDenoKVDistributedFileSystemHandlerResolver } from '../EaCDenoKVDistributedFileSystemHandlerResolver.ts';

export class EaCDenoKVDistributedFileSystemWorker extends EaCDistributedFileSystemWorker {
  protected loadDFSHandlerResolver(): DFSFileHandlerResolver {
    return EaCDenoKVDistributedFileSystemHandlerResolver;
  }
}

// deno-lint-ignore no-explicit-any
new EaCDenoKVDistributedFileSystemWorker(self as any);
