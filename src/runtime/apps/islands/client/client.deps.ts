import { ComponentChildren, ComponentType } from 'preact';

export {
  type ComponentChildren,
  type ComponentType,
  Fragment,
  h,
  render,
  type VNode,
} from 'preact';

export type ClientIslandsData = Map<
  string,
  { Name: string; Props: Record<string, unknown> }
>;

export enum MarkerKind {
  Island = 'island',
  Container = 'container',
}

export type Marker = {
  kind: MarkerKind;
  id: string;
  startNode: Text | Comment | null;
  endNode: Text | Comment | null;
};

export function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

export function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE && !('_eacRootFrag' in node);
}

export function loadTemplateVNode(
  tool: string,
  kind: MarkerKind,
  id: string,
  target: string,
) {
  const sel = `#${tool}-${kind}-${id}-${target}`;

  console.log(sel);

  const template = document.querySelector(sel) as HTMLTemplateElement | null;

  if (template !== null) {
    const node = template.content.cloneNode(true);

    return node;
  }

  return undefined;
}

function ServerComponent(props: {
  children: ComponentChildren;
  id: string;
}): ComponentChildren {
  return props.children;
}
ServerComponent.displayName = 'PreactServerComponent';

export { ServerComponent };

export const componentMap: Map<string, ComponentType> = new Map();
