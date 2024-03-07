import { EaCRuntimeHandlerPipeline } from '../../runtime/EaCRuntimeHandlerPipeline.ts';

export type PathMatch = {
  Handlers: EaCRuntimeHandlerPipeline;

  Path: string;

  Pattern: URLPattern;

  PatternText: string;

  Priority: number;
};

export const pathToPatternRegexes: [RegExp, string, number][] = [
  // Handle [[optional]]
  [/\[\[(.*?)\]\]/g, '{/:$1}?', 2],
  // Handle [...ident]
  [/\[\.\.\.(.*?)\]/g, ':$1*', -1000],
  // Handle [segment]
  [/\[(.*?)\]/g, ':$1', 3],
];
