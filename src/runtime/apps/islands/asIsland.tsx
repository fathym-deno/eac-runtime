// deno-lint-ignore-file no-explicit-any
import { ComponentType, RenderableProps } from '../../../src.deps.ts';
import { IslandData } from './IslandData.tsx';

export type IslandComponentType<T = RenderableProps<any>> = ComponentType<T> & {
  IsIsland: boolean;
};

export function asIsland<T extends RenderableProps<any>>(
  Component: ComponentType<T>,
): IslandComponentType<T> {
  const islandComponent: ComponentType<T> = (props) => {
    const islandId = IslandData.Store(Component, props);

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

  return {
    ...islandComponent,
    IsIsland: true,
  } as IslandComponentType<T>;
}
