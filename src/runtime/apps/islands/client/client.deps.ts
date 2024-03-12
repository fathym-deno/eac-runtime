import { ComponentType } from 'preact';

export {
  type ComponentChildren,
  type ComponentType,
  Fragment,
  h,
  render,
  type VNode,
} from 'preact';

export const componentMap: Map<string, ComponentType> = new Map();
