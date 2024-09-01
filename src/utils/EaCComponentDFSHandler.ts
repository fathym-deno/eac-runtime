import { DFSFileHandler } from '../../mod.ts';
import { EaCDistributedFileSystemDetails } from '../../tests/test.deps.ts';

export type EaCComponentDFSHandler = {
  DFS: EaCDistributedFileSystemDetails;

  DFSLookup: string;

  Handler: DFSFileHandler;

  Extensions: string[];
};
