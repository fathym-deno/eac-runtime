// deno-lint-ignore-file no-explicit-any
import { ComponentType, RenderableProps } from '../../../src.deps.ts';
import { IslandDataStore } from './IslandDataStore.tsx';

export function asIsland<T extends RenderableProps<any>>(
  Component: ComponentType<T>,
  islandId: string,
): ComponentType<T> {
  const islandComponent: ComponentType<T> = (props) => {
    return (
      <>
        {/*@ts-ignore unstable features not supported in types*/}
        {/* <Fragment UNSTABLE_comment={`island => ${islandId}`} /> */}

        <span style='display: contents' data-eac-island-id={islandId}>
          <Component {...props} />
        </span>

        {/*@ts-ignore unstable features not supported in types*/}
        {/* <Fragment UNSTABLE_comment={`island /=> ${islandId}`} /> */}
      </>
    );
  };

  return islandComponent;
}
