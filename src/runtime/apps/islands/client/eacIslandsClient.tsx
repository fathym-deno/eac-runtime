import { componentMap, createRootFragment, render } from './client.deps.ts';

export function renderIslands(
  data: Map<string, { Name: string; Props: Record<string, unknown> }>,
) {
  const islands = document.querySelectorAll('[data-eac-island-id]');

  console.log(componentMap);

  for (const island of islands) {
    const id = island.getAttribute('data-eac-island-id')!;

    const islandData = data.get(id)!;

    console.log(islandData);

    const Comp = componentMap.get(islandData.Name)!;

    console.log(Comp);

    console.log(island);

    console.log(island.firstElementChild);

    const islandElements = Array.from(island.children);

    render(
      <Comp {...islandData.Props} />,
      createRootFragment(island, islandElements),
    );
  }
}
