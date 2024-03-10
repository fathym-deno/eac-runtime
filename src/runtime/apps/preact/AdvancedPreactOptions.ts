import { Component, type Options as PreactOptions, type VNode } from 'preact';
import { PreactHookTypes } from './PreactHookTypes.ts';

export interface AdvancedPreactOptions extends PreactOptions {
  /** Attach a hook that is invoked after a tree was mounted or was updated. */
  __c?(vnode: VNode, commitQueue: Component[]): void;
  /** Attach a hook that is invoked before a vnode has rendered. */
  __r?(vnode: VNode): void;
  errorBoundaries?: boolean;
  /** before diff hook */
  __b?(vnode: VNode): void;
  /** Attach a hook that is invoked before a hook's state is queried. */
  __h?(component: Component, index: number, type: PreactHookTypes): void;
}
