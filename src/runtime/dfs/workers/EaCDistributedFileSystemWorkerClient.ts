import { FathymWorkerClient } from '../../../workers/FathymWorkerClient.ts';
import {
  EaCDistributedFileSystemWorkerConfig,
  EaCDistributedFileSystemWorkerMessage,
  EaCDistributedFileSystemWorkerMessageGetFileInfoPayload,
  EaCDistributedFileSystemWorkerMessageLoadAllPathsPayload,
  EaCDistributedFileSystemWorkerMessageWriteFilePayload,
} from './EaCDistributedFileSystemWorkerMessage.ts';
import { EaCDistributedFileSystemWorkerMessageTypes } from '../workers/EaCDistributedFileSystemWorkerMessageTypes.ts';
import { DFSFileInfo } from '../DFSFileInfo.ts';

export class EaCDistributedFileSystemWorkerClient extends FathymWorkerClient<
  EaCDistributedFileSystemWorkerConfig,
  // deno-lint-ignore no-explicit-any
  EaCDistributedFileSystemWorkerMessage<any>
> {
  constructor(workerPath: string) {
    super(workerPath);
  }

  public async GetFileInfo(
    payload: EaCDistributedFileSystemWorkerMessageGetFileInfoPayload,
  ): Promise<DFSFileInfo | undefined> {
    const resp = await this.Send<
      { FileInfo: DFSFileInfo | undefined },
      EaCDistributedFileSystemWorkerMessageGetFileInfoPayload
    >({
      Type: EaCDistributedFileSystemWorkerMessageTypes.GetFileInfo,
      Payload: payload,
    });

    return resp.FileInfo;
  }

  public async LoadAllPaths(revision: number): Promise<string[]> {
    const resp = await this.Send<
      { FilePaths: string[] },
      EaCDistributedFileSystemWorkerMessageLoadAllPathsPayload
    >({
      Type: EaCDistributedFileSystemWorkerMessageTypes.LoadAllPaths,
      Payload: {
        Revision: revision,
      },
    });

    return resp.FilePaths;
  }

  public async WriteFile(
    payload: EaCDistributedFileSystemWorkerMessageWriteFilePayload,
  ): Promise<DFSFileInfo | undefined> {
    const resp = await this.Send<
      { FileInfo: DFSFileInfo | undefined },
      EaCDistributedFileSystemWorkerMessageWriteFilePayload
    >({
      Type: EaCDistributedFileSystemWorkerMessageTypes.WriteFile,
      Payload: payload,
    });

    return resp.FileInfo;
  }
}
