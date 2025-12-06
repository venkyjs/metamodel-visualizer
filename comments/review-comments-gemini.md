# Code Review: `react-graph-tree` Library

## Summary
The `react-graph-tree` library provides a solid foundation for visualizing hierarchical data using React Flow and Dagre. The architecture successfully separates layout logic from rendering, and the component structure is generally logical.

However, there are **critical issues regarding prop stability** that will likely cause infinite re-renders for consumers. Additionally, Type safety is compromised in several places by "double casting" (`as unknown as Type`), and the main component (`GraphTree`) is becoming a "God component" that mixes UI, data, and layout concerns.

## Critical Issues (Must Fix)

### 1. `initialNodes` Prop Instability (Infinite Re-initialization)
**Location:** `packages/react-graph-tree/src/GraphTree.tsx` (Line 104)

**Issue:** The `useEffect` dependency on `initialNodesProp` is dangerous. If a consumer passes the array inline (common pattern), it creates a new reference on every render, causing the graph to reset continuously.

```tsx
// Consumer code that breaks the library:
<GraphTree initialNodes={[{ id: '1', label: 'Root' }]} ... />
```

**Fix:** Use a reference check or deep comparison to avoid resetting unless the *content* actually changes.

```tsx
// Suggestion:
const initialNodesRef = useRef(initialNodesProp);
const hasInitialNodesChanged = JSON.stringify(initialNodesRef.current) !== JSON.stringify(initialNodesProp);

useEffect(() => {
  if (hasInitialNodesChanged) {
     initialNodesRef.current = initialNodesProp;
     // ... logic to reset nodes
  }
}, [initialNodesProp, hasInitialNodesChanged, ...]);
```

### 2. Unsafe Type Casting
**Location:** `packages/react-graph-tree/src/GraphTree.tsx` (Lines 251, 265) & `GraphNode.tsx` (Line 29)

**Issue:** Extensive use of `as unknown as InternalNodeData` bypasses TypeScript's safety guarantees. This hides potential shape mismatches between the React Flow internal data and your application data.

**Fix:** defining a proper generic type for your Node that extends React Flow's `Node`.

```tsx
// in types.ts
import { Node as ReactFlowNode } from '@xyflow/react';

export type AppNode = ReactFlowNode<InternalNodeData>;

// in GraphTree.tsx
const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);

// Now usage is safe without casting:
const nodeData = node.data; // Typed as InternalNodeData automatically
```

## Suggestions (Should Fix)

### 1. Refactor `handleNodeClick` into a Custom Hook
**Location:** `packages/react-graph-tree/src/GraphTree.tsx` (Lines 262-462)

**Issue:** The `handleNodeClick` function is massive (~200 lines). It handles selection, API calls, data transformation, layouting, and animation orchestration. This makes `GraphTree` hard to maintain and test.

**Fix:** Extract the expansion logic into a `useNodeExpansion` hook.

```tsx
// src/hooks/useNodeExpansion.ts
export const useNodeExpansion = (
  nodes: Node[], 
  setNodes: Dispatch<SetStateAction<Node[]>>,
  // ... dependencies
) => {
  const expandNode = async (node: Node, onExpand: (n: NodeData) => Promise<ChildNode[]>) => {
     // ... existing logic ...
  };
  return { expandNode };
};
```

### 2. Remove `setTimeout` Magic Numbers
**Location:** `packages/react-graph-tree/src/GraphTree.tsx` (Lines 284, 428, 431)

**Issue:** Using `setTimeout(..., 50)` relies on race conditions with the event loop to wait for React Flow to update. This is flaky on slower devices or under load.

**Fix:** use `requestAnimationFrame` or `useEffect` to react to state changes (like `nodes` changing) rather than imperatively waiting.

### 3. API Design: `CustomRenderer` Prop Passing
**Location:** `packages/react-graph-tree/src/components/GraphNode/GraphNode.tsx`

**Issue:** Casting `props` to access `customRenderer` is messy.
`const CustomRenderer = (props as unknown as { customRenderer?: ... }).customRenderer;`

**Fix:** Explicitly define the props intersection.

```tsx
// GraphNode.tsx
type GraphNodeProps = NodeProps<AppNode> & {
  customRenderer?: React.ComponentType<NodeRendererProps>;
};

// The component will now accept this prop naturally if passed correctly from nodeTypes
```

### 4. Layout Logic Recursive Safety
**Location:** `packages/react-graph-tree/src/utils/layout.ts`

**Issue:** `getDescendants` is recursive. While unlikely to hit limits with UI trees, it's safer and more performant to use an iterative approach (stack-based) if the graph can be deep.

## Nitpicks (Optional)

*   **Console Logging:** Line 39 in `tsup.config.ts` logs to console. Ensure `console.log` is removed or conditional in production builds if it appears in runtime code (it's in build config here so it's fine, but check `GraphTree.tsx` line 446 `console.error`).
*   **CSS Bundling:** The manual CSS concatenation in `tsup.config.ts` is valid but slightly non-standard. Ensure that `dist/styles.css` is documented as a required import for the consumer.
*   **Node IDs:** `initialNodes` requires IDs. If users provide non-unique IDs, React Flow will crash/warn. Validating uniqueness in `createInitialNodes` would be a nice DX improvement.

## Browser & Compatibility
*   **Bundle Size:** `dagre` is a heavy dependency (~50KB). If bundle size becomes a concern, consider lazily loading it or looking for lighter alternatives like `elkjs` (though Elk is also large) or a custom simple tree layout since you are doing a lot of post-processing anyway.
