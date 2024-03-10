import { ComponentType } from 'preact';

export { render } from 'preact';
export { type ComponentType };

export function createRootFragment(
  parent: Element,
  replaceNode: Element | Element[],
) {
  const replaceNodes: Element[] = ([] as Element[]).concat(replaceNode);
  const s = replaceNodes[replaceNodes.length - 1].nextSibling;
  function insert(c: Node, r: Node | null) {
    return parent.insertBefore(c, r || s);
  }
  // deno-lint-ignore no-explicit-any
  return ((parent as any).__k = {
    nodeType: 1,
    parentNode: parent,
    firstChild: replaceNodes[0],
    childNodes: replaceNodes,
    insertBefore: insert,
    appendChild: (c: Node) => insert(c, null),
    removeChild: function (c: Node) {
      return parent.removeChild(c);
    },
  });
}

export const componentMap: Map<string, ComponentType> = new Map();
