import { DFSFileHandlerResolver } from '../DFSFileHandlerResolver.ts';
import { EaCDistributedFileSystemWorker } from './EaCDistributedFileSystemWorker.ts';
import { EaCJSRDistributedFileSystemHandlerResolver } from '../EaCJSRDistributedFileSystemHandlerResolver.ts';

export class EaCJSRDistributedFileSystemWorker extends EaCDistributedFileSystemWorker {
  protected loadDFSHandlerResolver(): DFSFileHandlerResolver {
    return EaCJSRDistributedFileSystemHandlerResolver;
  }
}

// deno-lint-ignore no-explicit-any
new EaCJSRDistributedFileSystemWorker(self as any);
