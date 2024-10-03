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
} from 'npm:preact@10.20.1';
export { delay } from 'jsr:@std/async@1.0.3/delay';
export * as colors from 'jsr:@std/fmt@1.0.0/colors';
export * as base64 from 'jsr:@std/encoding@1.0.2/base64';
export * from 'jsr:@std/log@0.224.6';
export * as path from 'jsr:@std/path@1.0.2';
export * as denoGraph from 'jsr:@deno/graph@0.81.2';

export * from 'jsr:@fathym/ioc@0.0.12';

// export * from '../reference-architecture/mod.ts';
export * from 'jsr:@fathym/common@0.2.160';
export * from 'jsr:@fathym/common@0.2.160/build';
export * from 'jsr:@fathym/common@0.2.160/deno-kv';
export * from 'jsr:@fathym/common@0.2.160/log';
export * from 'jsr:@fathym/common@0.2.160/oauth';
export * from 'jsr:@fathym/common@0.2.160/workers';

export * from 'jsr:@fathym/eac@0.1.70';
export * from 'jsr:@fathym/eac@0.1.70/applications';
export * from 'jsr:@fathym/eac@0.1.70/clouds';
export * from 'jsr:@fathym/eac@0.1.70/databases';
export * from 'jsr:@fathym/eac@0.1.70/dfs';
export * from 'jsr:@fathym/eac@0.1.70/github';
export * from 'jsr:@fathym/eac@0.1.70/identity';
export * from 'jsr:@fathym/eac@0.1.70/iot';
export * from 'jsr:@fathym/eac@0.1.70/licensing';
export * from 'jsr:@fathym/eac@0.1.70/octokit';
export * from 'jsr:@fathym/eac@0.1.70/sources';
export * from 'jsr:@fathym/eac@0.1.70/utils/azure';

// export * from '../everything-as-code-api/mod.ts';
export * from 'jsr:@fathym/eac-api@0.1.22';
export * from 'jsr:@fathym/eac-api@0.1.22/client';
export * from 'jsr:@fathym/eac-api@0.1.22/status';

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
