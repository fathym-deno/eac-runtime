import { DFSFileHandler } from '../../mod.ts';
import { EaCDistributedFileSystem } from '../../tests/test.deps.ts';

export type EaCComponentDFSHandler = {
  DFS: EaCDistributedFileSystem;

  DFSLookup: string;

  Handler: DFSFileHandler;

  Extensions: string[];
};
