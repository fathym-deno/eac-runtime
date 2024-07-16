import { DFSFileHandlerResolver } from '../DFSFileHandlerResolver.ts';
import { EaCDistributedFileSystemWorker } from './EaCDistributedFileSystemWorker.ts';
import { EaCESMDistributedFileSystemHandlerResolver } from '../EaCESMDistributedFileSystemHandlerResolver.ts';

export class EaCESMDistributedFileSystemWorker extends EaCDistributedFileSystemWorker {
  protected loadDFSHandlerResolver(): DFSFileHandlerResolver {
    return EaCESMDistributedFileSystemHandlerResolver;
  }
}

// deno-lint-ignore no-explicit-any
new EaCESMDistributedFileSystemWorker(self as any);
