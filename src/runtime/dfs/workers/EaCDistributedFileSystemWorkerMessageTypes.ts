import { FathymWorkerMessageTypes } from '../../../workers/FathymWorkerMessageTypes.ts';

export const EaCDistributedFileSystemWorkerMessageTypes = {
  ...FathymWorkerMessageTypes,
  GetFileInfo: 'get-file-info',
  LoadAllPaths: 'load-all-paths',
  WriteFile: 'write-file',
};

export type EaCDistributedFileSystemWorkerMessageTypes =
  (typeof EaCDistributedFileSystemWorkerMessageTypes)[
    keyof typeof EaCDistributedFileSystemWorkerMessageTypes
  ];
