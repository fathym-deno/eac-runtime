// deno-lint-ignore-file no-explicit-any
import {
  ClientIslandsData,
  ComponentChildren,
  componentMap,
  Fragment,
  h,
  isCommentNode,
  isElementNode,
  isTextNode,
  Marker,
  MarkerKind,
  render,
  ServerComponent,
  VNode,
} from './client.deps.ts';

function addChildrenFromTemplate(
  data: ClientIslandsData,
  containerId: string,
  markerStack: Marker[],
  vnodeStack: VNode[],
  islandRoots: [VNode, HTMLElement][],
  // islands: Record<string, Record<string, ComponentType>>,
  // props: any[],
  // markerStack: Marker[],
  // vnodeStack: VNode[],
  // comment: string,
  // result: RenderRequest[],
) {
  const [id, target] = containerId.split(':');

  const sel = `#eac-container-${id}-${target}`;

  const template = document.querySelector(sel) as HTMLTemplateElement | null;

  if (template !== null) {
    markerStack.push({
      kind: MarkerKind.Container,
      endNode: null,
      startNode: null,
      id: containerId,
    });

    const node = template.content.cloneNode(true);

    walkNodeTree(data, node, markerStack, vnodeStack, islandRoots);

    markerStack.pop();
  }
}

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

      if (comment.startsWith('eac|container')) {
        const [_eac, _kind, containerId] = comment.split('|');

        markerStack.push({
          startNode: sib,
          endNode: null,
          id: containerId,
          kind: MarkerKind.Container,
        });

        // @ts-ignore TS gets confused
        vnodeStack.push(h(ServerComponent, { id: comment }));
      } else if (comment.startsWith('eac|island')) {
        const [_tool, _markerKind, id, key] = comment.split('|');

        const { Name: islandTypeName, Props: islandProps } = data.get(id)!;

        markerStack.push({
          startNode: sib,
          endNode: null,
          id: id,
          kind: MarkerKind.Island,
        });

        const island = componentMap.get(islandTypeName)!;

        const vnode = h(island, islandProps) as VNode;

        if (key) vnode.key = key;

        vnodeStack.push(vnode);
      } else if (marker !== null && comment.startsWith('/eac')) {
        marker.endNode = sib;

        markerStack.pop();

        if (marker.kind === MarkerKind.Container) {
          // If we're closing a slot than it's assumed that we're
          // inside an island
          const vnode = vnodeStack.pop();

          // For now only `props.children` is supported.
          const islandParent = vnodeStack[vnodeStack.length - 1]!;

          const [_id, target] = marker.id.split(':');

          (islandParent.props as any)[target] = vnode;

          // hideMarker(marker);

          sib = marker.endNode.nextSibling;
        } else if (marker.kind === MarkerKind.Island) {
          if (markerStack.length === 0) {
            const vnode = vnodeStack[vnodeStack.length - 1];

            if (vnode.props.children == null) {
              addChildrenFromTemplate(
                data,
                `${marker.id}`,
                markerStack,
                vnodeStack,
                islandRoots,
              );
            }

            vnodeStack.pop();

            const parentNode = sib.parentNode! as HTMLElement;

            // hideMarker(marker);

            const rootFragment = createRootFragment(
              parentNode,
              marker.startNode!,
              marker.endNode,
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
      }
    } else if (isTextNode(sib)) {
      const parentVNode = vnodeStack[vnodeStack.length - 1]!;
      if (marker !== null && marker.kind === MarkerKind.Container) {
        addPropsChild(parentVNode, sib.data);
      }
    } else {
      if (isElementNode(sib)) {
        const parentVNode = vnodeStack[vnodeStack.length - 1];

        if (marker !== null && marker.kind === MarkerKind.Container) {
          // Parse the server rendered DOM into vnodes that we can
          // attach to the virtual-dom tree. In the future, once
          // Preact supports a way to skip over subtrees, this
          // can be dropped.
          const childLen = sib.childNodes.length;
          const newProps: Record<string, unknown> = {
            children: childLen <= 1 ? null : [],
          };

          for (let i = 0; i < sib.attributes.length; i++) {
            const attr = sib.attributes[i];

            // if (attr.nodeName === DATA_KEY_ATTR) {
            //   hasKey = true;
            //   newProps.key = attr.nodeValue;
            //   continue;
            // } else if (attr.nodeName === LOADING_ATTR) {
            //   const idx = attr.nodeValue;
            //   const sig = props[Number(idx)][LOADING_ATTR].value;
            //   // deno-lint-ignore no-explicit-any
            //   (sib as any)._freshIndicator = sig;
            // }

            // Boolean attributes are always `true` when present.
            // See: https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML
            newProps[attr.nodeName] = typeof (sib as any)[attr.nodeName] === 'boolean'
              ? true
              : attr.nodeValue;
          }

          // Remove internal fresh key
          // if (hasKey) sib.removeAttribute(DATA_KEY_ATTR);

          const vnode = h(sib.localName, newProps) as VNode;
          addPropsChild(parentVNode, vnode);
          vnodeStack.push(vnode);
        }
        // else {
        //   // Outside of any partial or island
        //   const idx = sib.getAttribute(LOADING_ATTR);
        //   if (idx !== null) {
        //     const sig = props[Number(idx)][LOADING_ATTR].value;
        //     // deno-lint-ignore no-explicit-any
        //     (sib as any)._freshIndicator = sig;
        //   }
        // }
      }

      if (sib.firstChild && sib.nodeName !== 'SCRIPT') {
        walkNodeTree(
          data,
          sib.firstChild,
          markerStack,
          vnodeStack,
          islandRoots,
        );
      }

      // Pop vnode if current marker is not the a top rendering
      // component
      if (marker !== null && marker.kind !== MarkerKind.Island) {
        vnodeStack.pop();
      }
    }

    if (sib !== null) {
      sib = sib.nextSibling;
    }
  }
}
