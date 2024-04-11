// deno-lint-ignore-file no-explicit-any
import {
  ClientIslandsData,
  componentMap,
  Fragment,
  h,
  isCommentNode,
  // isTextNode,
  loadTemplateVNode,
  Marker,
  MarkerKind,
  render,
  ServerComponent,
  VNode,
} from './client.deps.ts';

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

      const [tool, markerKind, markerId, markerKey] = comment
        .split('|')
        .map((v, i) => {
          return i === 1 ? (v as MarkerKind) : v;
        }) as [string, MarkerKind, string, string];

      console.log(tool);
      console.log(markerKind);
      console.log(markerId);
      console.log(markerKey);

      if (comment.startsWith('eac|container')) {
        markerStack.push({
          startNode: sib,
          endNode: null,
          id: markerId,
          kind: markerKind,
        });

        const [id, target] = markerId.split(':');

        const template = loadTemplateVNode(tool, markerKind, id, target);

        vnodeStack.push(
          // @ts-ignore TS gets confused
          h(ServerComponent, {
            id: comment,
            key: markerKey,
            children: template,
          }),
        );
      } else if (comment.startsWith('eac|island')) {
        const { Name: islandTypeName, Props: islandProps } = data.get(markerId)!;

        markerStack.push({
          startNode: sib,
          endNode: null,
          id: markerId,
          kind: markerKind,
        });

        const island = componentMap.get(islandTypeName)!;

        const vnode = h(island, islandProps) as VNode;

        if (markerKey) {
          vnode.key = markerKey;
        }

        vnodeStack.push(vnode);
      } else if (marker !== null && comment.startsWith('/eac')) {
        marker.endNode = sib;

        if (marker.kind === MarkerKind.Container) {
          const containerVNode = vnodeStack.pop();

          // For now only `props.children` is supported.
          const islandParent = vnodeStack[vnodeStack.length - 1]!;

          const [_id, target] = marker.id.split(':');

          (islandParent.props as any)[target] = containerVNode;

          // hideMarker(marker);

          sib = marker.endNode.nextSibling;
          // } else if (marker.kind === MarkerKind.Island) {
        }
      }
      // } else if (isTextNode(sib)) {
    } else {
      if (sib.nodeName !== 'SCRIPT' && sib.firstChild) {
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
