import { DFSFileInfo } from './DFSFileInfo.ts';

export type DFSFileHandler = {
  GetFileInfo: (
    filePath: string,
    defaultFileName?: string,
  ) => Promise<DFSFileInfo>;
};
