import { ComponentChildren, componentMap, Fragment, h, render, VNode } from './client.deps.ts';

type ClientIslandsData = Map<
  string,
  { Name: string; Props: Record<string, unknown> }
>;

enum MarkerKind {
  Island = 'island',
  Container = 'container',
}

type Marker = {
  kind: MarkerKind;
  id: string;
  startNode: Text | Comment | null;
  endNode: Text | Comment | null;
};

function addPropsChild(parent: VNode, vnode: ComponentChildren) {
  const props = parent.props;
  if (props.children == null) {
    props.children = vnode;
  } else {
    if (!Array.isArray(props.children)) {
      props.children = [props.children, vnode];
    } else {
      props.children.push(vnode);
    }
  }
}

function createRootFragment(
  parent: Element,
  startMarker: Text | Comment,
  // We need an end marker for islands because multiple
  // islands can share the same parent node. Since
  // islands are root-level render calls any calls to
  // `.appendChild` would lead to a wrong result.
  endMarker: Text | Comment,
) {
  // @ts-ignore this is fine
  return (parent.__k = {
    _eacRootFrag: true,
    nodeType: 1,
    parentNode: parent,
    nextSibling: null,
    get firstChild() {
      const child = startMarker.nextSibling;
      if (child === endMarker) return null;
      return child;
    },
    get childNodes() {
      const children: ChildNode[] = [];

      let child = startMarker.nextSibling;
      while (child !== null && child !== endMarker) {
        children.push(child);
        child = child.nextSibling;
      }

      return children;
    },
    insertBefore(node: Node, child: Node | null) {
      parent.insertBefore(node, child ?? endMarker);
    },
    appendChild(child: Node) {
      // We cannot blindly call `.append()` as that would add
      // the new child to the very end of the parent node. This
      // leads to ordering issues when the multiple islands
      // share the same parent node.
      parent.insertBefore(child, endMarker);
    },
    removeChild(child: Node) {
      parent.removeChild(child);
    },
  });
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

// function isTextNode(node: Node): node is Text {
//   return node.nodeType === Node.TEXT_NODE;
// }

// function isElementNode(node: Node): node is HTMLElement {
//   return node.nodeType === Node.ELEMENT_NODE && !('_eacRootFrag' in node);
// }

function processIslandMarkers(data: ClientIslandsData): [VNode, HTMLElement][] {
  const islandRoots: [VNode, HTMLElement][] = [];

  walkNodeTree(
    data,
    document.body,
    [],
    [h(Fragment, null) as VNode],
    islandRoots,
  );

  return islandRoots;
}

export function renderIslands(data: ClientIslandsData) {
  const islandRoots = processIslandMarkers(data);

  islandRoots.forEach(([vnode, rootFragment]) => {
    const renderIsland = () => {
      render(vnode, rootFragment);
    };

    'scheduler' in window
      // @ts-ignore scheduler API is not in types yet
      ? scheduler!.postTask(renderIsland)
      : setTimeout(renderIsland, 0);
  });
}

function walkNodeTree(
  data: ClientIslandsData,
  node: Node | Comment,
  markerStack: Marker[],
  vnodeStack: VNode[],
  islandRoots: [VNode, HTMLElement][],
): void {
  let sib: Node | null = node;

  while (sib !== null) {
    const marker = markerStack.length > 0 ? markerStack[markerStack.length - 1] : null;

    if (isCommentNode(sib)) {
      let comment = sib.data;

      if (comment.startsWith('!--')) {
        comment = comment.slice(3, -2);
      }

      if (comment.startsWith('eac|island')) {
        const [_tool, markerKind, id] = comment.split('|');

        const { Name: islandTypeName, Props: islandProps } = data.get(id)!;

        markerStack.push({
          startNode: sib,
          endNode: null,
          id: id,
          kind: markerKind as MarkerKind,
        });

        const island = componentMap.get(islandTypeName)!;

        const vnode = h(island, islandProps) as VNode;

        // if (key) vnode.key = key;

        vnodeStack.push(vnode);
      } else if (marker !== null && comment.startsWith('/eac|island')) {
        marker.endNode = sib;

        markerStack.pop();

        if (markerStack.length === 0) {
          const vnode = vnodeStack[vnodeStack.length - 1];

          vnodeStack.pop();

          const parentNode = sib.parentNode! as HTMLElement;

          // hideMarker(marker);

          const rootFragment = createRootFragment(
            parentNode,
            marker.startNode!,
            marker.endNode,
            // deno-lint-ignore no-explicit-any
          ) as any as HTMLElement;

          islandRoots.push([vnode, rootFragment]);

          sib = marker.endNode.nextSibling;

          continue;
        } else {
          // Treat as a standard component
          const vnode = vnodeStack[vnodeStack.length - 1];

          vnodeStack.pop();

          marker.endNode = sib;

          // hideMarker(marker);

          const parent = vnodeStack[vnodeStack.length - 1]!;

          addPropsChild(parent, vnode);

          sib = marker.endNode.nextSibling;

          continue;
        }
      }
    } else {
      if (sib.firstChild && sib.nodeName !== 'SCRIPT') {
        walkNodeTree(
          data,
          sib.firstChild,
          markerStack,
          vnodeStack,
          islandRoots,
        );
      }
    }

    if (sib !== null) {
      sib = sib.nextSibling;
    }
  }
}
