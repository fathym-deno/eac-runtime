// deno-lint-ignore-file no-explicit-any
import { RenderableProps } from '../../../src.deps.ts';

export type IslandDataStore = Record<
  string,
  {
    Name: string;

    Props: RenderableProps<any>;
  }
>;
