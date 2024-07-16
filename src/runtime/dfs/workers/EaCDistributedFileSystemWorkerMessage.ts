import { EaCDistributedFileSystem } from '../../../src.deps.ts';
import { FathymWorkerConfig } from '../../../workers/FathymWorkerConfig.ts';
import { FathymWorkerMessage } from '../../../workers/FathymWorkerMessage.ts';

export type EaCDistributedFileSystemWorkerConfig = {
  DFS: EaCDistributedFileSystem;
} & FathymWorkerConfig;

export type EaCDistributedFileSystemWorkerMessageGetFileInfoPayload = {
  CacheDB?: Deno.Kv;

  CacheSeconds?: number;

  DefaultFileName?: string;

  Extensions?: string[];

  FilePath: string;

  Revision: number;

  UseCascading?: boolean;
};

export type EaCDistributedFileSystemWorkerMessageLoadAllPathsPayload = {
  Revision?: number;
};

export type EaCDistributedFileSystemWorkerMessageWriteFilePayload = {
  CacheDB?: Deno.Kv;

  FilePath: string;

  Headers?: Record<string, string>;

  MaxChunkSize?: number;

  Revision: number;

  Stream: ReadableStream<Uint8Array>;

  TTLSeconds?: number;
};

export type EaCDistributedFileSystemWorkerMessage<
  TPayload extends
    | undefined
    | EaCDistributedFileSystemWorkerMessageGetFileInfoPayload
    | EaCDistributedFileSystemWorkerMessageLoadAllPathsPayload
    | EaCDistributedFileSystemWorkerMessageWriteFilePayload = undefined,
> = FathymWorkerMessage<TPayload>;
