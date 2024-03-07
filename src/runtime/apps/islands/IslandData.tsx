// deno-lint-ignore-file no-explicit-any
import { ComponentType, RenderableProps } from 'preact';
import { IslandDataStore } from './IslandDataStore.ts';

type IslandDataProps = {
  clientModulePath: string;
};

export function IslandData(props: IslandDataProps) {
  return (
    <script
      type='module'
      dangerouslySetInnerHTML={{ __html: IslandData.Render(props.clientModulePath) }}
    />
  );
}

IslandData.Data = {} as IslandDataStore | undefined;

IslandData.Render = (clientModulePath: string) => {
  const data = JSON.stringify(IslandData.Data);

  IslandData.Data = undefined;

  return `import { renderIslands } from '${clientModulePath}';

renderIslands(${data});
  `;
};

IslandData.Store = (
  component: ComponentType<RenderableProps<any>>,
  props: RenderableProps<any>,
) => {
  const islandId = crypto.randomUUID();

  if (!IslandData.Data) {
    IslandData.Data = {};
  }

  IslandData.Data[islandId] = {
    Name: component.displayName || component.name,
    Props: props,
  };

  return islandId;
};
