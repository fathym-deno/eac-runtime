import { DFSFileInfo } from './DFSFileInfo.ts';

export type DFSFileHandler = {
  GetFileInfo: (
    filePath: string,
    defaultFileName?: string,
    extensions?: string[],
    useCascading?: boolean,
  ) => Promise<DFSFileInfo>;
};
