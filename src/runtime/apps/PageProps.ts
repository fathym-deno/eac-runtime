// deno-lint-ignore-file no-explicit-any
import { ComponentType } from '../../src.deps.ts';

export type PageProps<TData = any> = {
  Component: ComponentType<unknown>;

  Data: TData;

  Params: Record<string, string | undefined>;

  Revision: number;
};
