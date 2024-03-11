import { componentMap, createRootFragment, render } from './client.deps.ts';

function processIslandMarkers(
  data: Map<string, { Name: string; Props: Record<string, unknown> }>
) {
  const islandMarkers = document.querySelectorAll(
    'script[data-eac-id][type="application/marker-island"]'
  );

  for (const islandMarker of islandMarkers) {
    const id = islandMarker.getAttribute('data-eac-id')!;

    const islandData = data.get(id)!;

    const Comp = componentMap.get(islandData.Name)!;

    const island = islandMarker.nextElementSibling!;

    render(
      <Comp {...islandData.Props} />,
      createRootFragment(island.parentElement!, island)
    );

    islandMarker.remove();
  }
}

export function renderIslands(
  data: Map<string, { Name: string; Props: Record<string, unknown> }>
) {
  processIslandMarkers(data);
}
