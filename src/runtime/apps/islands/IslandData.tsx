// deno-lint-ignore-file no-explicit-any
import { isValidElement, JSX, VNode } from 'preact';
import { base64 } from '../../../src.deps.ts';
import { IslandDataStoreType } from './IslandDataStore.tsx';

type IslandDataProps = {
  clientModulePath: string;
};

export function buildIslandData(islandsData: Map<string, IslandDataStoreType>) {
  return function IslandData(props: IslandDataProps): JSX.Element {
    const data = Array.from(islandsData.entries());

    const dataStr = JSON.stringify(data, getCircularReplacer());

    return (
      <script
        type="module"
        dangerouslySetInnerHTML={{
          __html: `import { renderIslands } from '${props.clientModulePath}';
  
(function () {
  renderIslands(new Map(${dataStr}));
})();
`,
        }}
      />
    );
  };
}

// function getCircularReplacer() {
//   const seen = new WeakSet();
//   return (key: any, value: any) => {
//     if (isVNode(value)) {
//       return null;
//     }

//     if (typeof value === 'object' && value !== null) {
//       if (seen.has(value)) {
//         return;
//       }
//       seen.add(value);
//     }
//     return value;
//   };
// }
function getCircularReplacer() {
  const cache = new Set();
  return (key:  string, value: any): any => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        // Circular reference found
        try {
          // If this value does not reference a parent it can be deduped
          return JSON.parse(JSON.stringify(value));
        } catch (err) {
          // discard key if value cannot be deduped
          return;
        }
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  };
}

function isVNode(x: any): x is VNode {
  return (
    x !== null &&
    typeof x === 'object' &&
    'type' in x &&
    'ref' in x &&
    '__k' in x &&
    isValidElement(x)
  );
}
