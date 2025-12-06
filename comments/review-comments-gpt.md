## Summary
- Solid interactive tree experience with layout ordering and imperative APIs, but a few correctness gaps and typing/build issues could block consumers.

## Critical Issues (Must Fix)
- Active path highlight never resets when `activePath` becomes empty, so edges stay animated/styled after clearing selection or `reset()`. Recompute edge styles even for the empty-path case to avoid stale UI. See `useEffect` handling `activePath` in `GraphTree.tsx`.
- `types.ts` references `React.ComponentType` without importing `React` as a type. With `isolatedModules`/`verbatimModuleSyntax`, this will fail builds for consumers. Add `import type React from 'react';` (or switch to `ComponentType` from `react`) and re-export types accordingly.
- `package.json` `exports.require.types` points to `./dist/index.d.cts`, but the main `types` field points to `./dist/index.d.ts`. `tsup` will emit `.d.ts` by default, so the CJS types path is likely broken, causing `require()` users to lose typings. Align the export to the emitted `.d.ts` (or configure `tsup` to output `.d.cts`).

## Suggestions (Should Fix)
- Type the graph data with generics (`Node<InternalNodeData>`, `Edge<InternalNodeData>`) instead of `unknown` casts in `GraphTree` and `GraphNode`; this tightens the public API and avoids unsafe assertions.
- `handleNodeClick` recreates on every render due to `nodes`/`edges` dependencies; consider keeping `nodesRef`/`edgesRef` to reduce re-renders of `ReactFlow` internals and improve large-graph performance.
- Surface expansion errors via an optional `onError` callback instead of only `console.error`, so host apps can react (toast/log/telemetry) without patching the library.
- The dark-mode `useEffect` is currently a no-op; either remove it or implement container-level class toggling to avoid confusing readers and linters.

## Nitpicks (Optional)
- Defaulting `controlCenter.defaultAutoFocus` to `true` may surprise hosts who expect static view; consider defaulting to `false` for calmer UX.
- Small DX boost: export `ControlCenterConfig`, `ThemeConfig`, and `ViewOption` from `index.ts` alongside the existing types for a single import surface.

## Code Snippets
```215:240:packages/react-graph-tree/src/GraphTree.tsx
useEffect(() => {
  if (activePath.length === 0) return;

  const activePathEdges = getActivePathEdges(activePath);

  setEdges((currentEdges) =>
    currentEdges.map((edge) => {
      const isOnActivePath = activePathEdges.has(edge.id);
      return {
        ...edge,
        animated: isOnActivePath,
        style: {
          ...edge.style,
          stroke: isOnActivePath ? 'var(--graph-tree-active-path, #22c55e)' : 'var(--graph-tree-line, #94a3b8)',
          strokeWidth: isOnActivePath ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isOnActivePath ? 'var(--graph-tree-active-path, #22c55e)' : 'var(--graph-tree-line, #94a3b8)',
        },
        className: isOnActivePath ? 'graph-tree-active-path-edge' : '',
      };
    })
  );
}, [activePath, setEdges, getActivePathEdges]);
```

```ts
// Fix: always recompute styles so clearing activePath resets animations
useEffect(() => {
  const activePathEdges = activePath.length ? getActivePathEdges(activePath) : new Set<string>();
  setEdges((current) =>
    current.map((edge) => {
      const isOnActivePath = activePathEdges.has(edge.id);
      return {
        ...edge,
        animated: isOnActivePath,
        style: {
          ...edge.style,
          stroke: isOnActivePath ? 'var(--graph-tree-active-path, #22c55e)' : 'var(--graph-tree-line, #94a3b8)',
          strokeWidth: isOnActivePath ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isOnActivePath ? 'var(--graph-tree-active-path, #22c55e)' : 'var(--graph-tree-line, #94a3b8)',
        },
        className: isOnActivePath ? 'graph-tree-active-path-edge' : '',
      };
    })
  );
}, [activePath, setEdges, getActivePathEdges]);
```

```90:124:packages/react-graph-tree/src/types.ts
/**
 * Custom node renderer component
 */
export interface GraphTreeProps {
  /** Initial nodes to display horizontally */
  initialNodes: InitialNode[];
  /**
   * Custom node renderer component
   */
  nodeRenderer?: React.ComponentType<NodeRendererProps>;
```

```ts
// Add missing import for consumers using isolatedModules/verbatimModuleSyntax
import type React from 'react';
```


