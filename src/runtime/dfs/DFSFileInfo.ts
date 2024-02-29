export type DFSFileInfo = {
  Contents: ReadableStream<Uint8Array>;

  Headers?: Record<string, string>;

  Path: string;
};
