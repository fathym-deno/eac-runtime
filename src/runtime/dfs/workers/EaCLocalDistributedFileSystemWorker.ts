import { DFSFileHandlerResolver } from '../DFSFileHandlerResolver.ts';
import { EaCDistributedFileSystemWorker } from './EaCDistributedFileSystemWorker.ts';
import { EaCLocalDistributedFileSystemHandlerResolver } from '../EaCLocalDistributedFileSystemHandlerResolver.ts';

export class EaCLocalDistributedFileSystemWorker extends EaCDistributedFileSystemWorker {
  protected loadDFSHandlerResolver(): DFSFileHandlerResolver {
    return EaCLocalDistributedFileSystemHandlerResolver;
  }
}

// deno-lint-ignore no-explicit-any
new EaCLocalDistributedFileSystemWorker(self as any);
