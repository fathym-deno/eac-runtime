import { JSX } from 'preact';
import { IslandDataStore } from './IslandDataStore.tsx';

type IslandDataProps = {
  clientModulePath: string;
};

export function buildIslandData(islandData: IslandDataStore) {
  return function IslandData(props: IslandDataProps): JSX.Element {
    const data = Array.from(islandData.GetData().entries());
    console.log(data);
    return (
      <script
        type='module'
        dangerouslySetInnerHTML={{
          __html: `import { renderIslands } from '${props.clientModulePath}';
  
(function () {
  renderIslands(new Map(${JSON.stringify(data)}));
})();
`,
        }}
      />
    );
  };
}
