import 'jsr:@std/dotenv@0/load';
export {
  type ComponentChildren,
  type ComponentType,
  type RenderableProps,
  type VNode,
  type Attributes,
  type Options as PreactOptions,
  options as preactOptions,
  Fragment,
  h,
  isValidElement,
  type JSX,
  Component,
} from 'npm:preact@10.23.2';
export { delay } from 'jsr:@std/async@1/delay';
export * as colors from 'jsr:@std/fmt@1/colors';
export * as base64 from 'jsr:@std/encoding@1/base64';
export * as path from 'jsr:@std/path@1';
export * as denoGraph from 'jsr:@deno/graph@^0.69.7';

export * from 'jsr:@fathym/ioc@0';

// export * from '../reference-architecture/mod.ts';
export * from 'jsr:@fathym/common@0';
export * from 'jsr:@fathym/common@0/build';
export * from 'jsr:@fathym/common@0/deno-kv';
export * from 'jsr:@fathym/common@0/oauth';
export * from 'jsr:@fathym/common@0/workers';

// export * from '../everything-as-code/src/eac/.exports.ts';
export * from 'jsr:@fathym/eac@0';
export * from 'jsr:@fathym/eac@0/applications';
export * from 'jsr:@fathym/eac@0/clouds';
export * from 'jsr:@fathym/eac@0/databases';
export * from 'jsr:@fathym/eac@0/dfs';
export * from 'jsr:@fathym/eac@0/github';
export * from 'jsr:@fathym/eac@0/identity';
export * from 'jsr:@fathym/eac@0/iot';
export * from 'jsr:@fathym/eac@0/licensing';
export * from 'jsr:@fathym/eac@0/octokit';
export * from 'jsr:@fathym/eac@0/sources';
export * from 'jsr:@fathym/eac@0/utils/azure';

// export * from '../everything-as-code-api/mod.ts';
export * from 'jsr:@fathym/eac-api@0';
export * from 'jsr:@fathym/eac-api@0/client';
export * from 'jsr:@fathym/eac-api@0/status';

import * as esbuild from 'npm:esbuild@0.23.1';
export { esbuild };
export {
  denoPlugins,
  denoLoaderPlugin,
  urlToEsbuildResolution,
} from 'jsr:@luca/esbuild-deno-loader@0.10.3';
export type ESBuild = {
  context: typeof esbuild.context;
  build: typeof esbuild.build;
  buildSync: typeof esbuild.buildSync;
  transform: typeof esbuild.transform;
  transformSync: typeof esbuild.transformSync;
  formatMessages: typeof esbuild.formatMessages;
  formatMessagesSync: typeof esbuild.formatMessagesSync;
  analyzeMetafile: typeof esbuild.analyzeMetafile;
  analyzeMetafileSync: typeof esbuild.analyzeMetafileSync;
  initialize: typeof esbuild.initialize;
  stop: typeof esbuild.stop;
  version: typeof esbuild.version;
};
