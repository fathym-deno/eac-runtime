import { createElement, render } from 'https://esm.sh/preact@10.19.6';

export function renderIslands(
  data: Record<string, { Name: string; Props: Record<string, unknown> }>,
) {
  (function () {
    const islands = document.querySelectorAll('[data-eac-island-id]');

    for (const island of islands) {
      const id = island.getAttribute('data-eac-island-id')!;

      const islandData = data![id];

      render(createElement(islandData.Name, islandData.Props), island.parentElement!, island);
    }
    console.log(islands);
  })();
}
