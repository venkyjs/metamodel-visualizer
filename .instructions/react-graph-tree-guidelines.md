# React Graph Tree Library Development Guidelines

This document captures key patterns and anti-patterns discovered during code review to ensure performance and reliability of the `react-graph-tree` library.

---

## Performance Guidelines

### 1. Avoid Stale Closures in Async Callbacks

**Problem:** When a callback contains async operations and references state variables directly in its dependency array, the state can become stale after the `await` completes.

**Bad Pattern:**
```tsx
const handleClick = useCallback(async () => {
  // nodes/edges could be stale after await
  const result = await fetchData();
  const allNodes = [...nodes, ...newNodes]; // nodes is stale!
}, [nodes, edges]); // Recreates callback on every state change
```

**Good Pattern:**
```tsx
const nodesRef = useRef(nodes);
const edgesRef = useRef(edges);

useEffect(() => { nodesRef.current = nodes; }, [nodes]);
useEffect(() => { edgesRef.current = edges; }, [edges]);

const handleClick = useCallback(async () => {
  const result = await fetchData();
  const allNodes = [...nodesRef.current, ...newNodes]; // Always fresh!
}, [/* stable deps only */]);
```

---

### 2. Avoid Inline Component Creation in useMemo

**Problem:** Creating arrow function components inside `useMemo` defeats `React.memo()` on child components because a new component reference is created on every render (when dependencies change).

**Bad Pattern:**
```tsx
const nodeTypes = useMemo(() => ({
  custom: (props) => <GraphNode {...props} customRenderer={nodeRenderer} />,
}), [nodeRenderer]); // New component reference when nodeRenderer changes
```

**Good Pattern:**
```tsx
// Use Context to pass dynamic values
const NodeRendererContext = createContext<ComponentType | undefined>(undefined);

const nodeTypes = useMemo(() => ({
  custom: GraphNode, // Stable reference
}), []);

return (
  <NodeRendererContext.Provider value={nodeRenderer}>
    <ReactFlow nodeTypes={nodeTypes} />
  </NodeRendererContext.Provider>
);
```

---

### 3. Avoid Double State Updates

**Problem:** Calling multiple state setters in sequence triggers multiple re-renders.

**Bad Pattern:**
```tsx
const handleNodesChange = useCallback((changes) => {
  onNodesChange(changes);  // Update 1
  setNodes((nodes) => sortNodes(nodes));  // Update 2
}, []);
```

**Good Pattern:**
```tsx
const handleNodesChange = useCallback((changes) => {
  setNodes((currentNodes) => {
    const updated = applyNodeChanges(changes, currentNodes);
    return sortNodes(updated);  // Single update
  });
}, [setNodes]);
```

---

### 4. Prevent Prop Instability from Causing Re-initialization

**Problem:** If consumers pass inline arrays/objects, they create new references on every render, triggering useEffect re-runs.

**Bad Pattern (consumer code that breaks library):**
```tsx
<GraphTree initialNodes={[{ id: '1', label: 'Root' }]} />
```

**Good Pattern (library protection):**
```tsx
const initialNodesRef = useRef<string>('');

useEffect(() => {
  const serialized = JSON.stringify(initialNodesProp);
  if (serialized === initialNodesRef.current) return; // Skip if unchanged
  initialNodesRef.current = serialized;
  
  // ... initialization logic
}, [initialNodesProp]);
```

---

## Reliability Guidelines

### 5. Always Reset State When Clearing

**Problem:** Early returns in effects can leave UI in stale state.

**Bad Pattern:**
```tsx
useEffect(() => {
  if (activePath.length === 0) return; // Edges stay highlighted!
  
  setEdges(edges => edges.map(e => ({
    ...e,
    animated: activePath.includes(e.id),
  })));
}, [activePath]);
```

**Good Pattern:**
```tsx
useEffect(() => {
  const activeEdges = activePath.length > 0 ? getActiveEdges(activePath) : new Set();
  
  setEdges(edges => edges.map(e => ({
    ...e,
    animated: activeEdges.has(e.id), // Properly resets when empty
  })));
}, [activePath]);
```

---

## TypeScript Guidelines

### 6. Use Proper Generics Instead of Type Assertions

**Problem:** `as unknown as Type` bypasses TypeScript's safety guarantees.

**Bad Pattern:**
```tsx
const nodeData = node.data as unknown as InternalNodeData;
```

**Good Pattern:**
```tsx
// Define properly typed node
type GraphTreeNode = Node<InternalNodeData, 'custom'>;

// Use with hooks
const [nodes, setNodes] = useNodesState<GraphTreeNode>([]);

// Now data is properly typed
const nodeData = node.data; // TypeScript knows the type
```

---

### 7. Always Import React Types for Consumers

**Problem:** Without explicit React type imports, consumers using `isolatedModules` or `verbatimModuleSyntax` will have build failures.

**Bad Pattern:**
```tsx
// types.ts
export interface Props {
  renderer?: React.ComponentType<NodeRendererProps>;
}
```

**Good Pattern:**
```tsx
// types.ts
import type React from 'react';

export interface Props {
  renderer?: React.ComponentType<NodeRendererProps>;
}
```

---

## Code Hygiene

### 8. Remove Dead Code and No-Op Effects

Empty useEffect blocks create confusion about intent and trigger linter warnings.

**Bad Pattern:**
```tsx
useEffect(() => {
  // We don't modify the body, just use a class on our container
}, [isDarkMode]);
```

**Good Pattern:**
```tsx
// Dark mode is applied via the className on the container element
// (comment only, no empty useEffect)
```

---

## Summary Checklist

Before submitting code changes to this library, verify:

- [ ] Async callbacks use refs for state that may change during execution
- [ ] Dynamic component props are passed via Context, not inline functions
- [ ] Multiple state updates are combined into single calls
- [ ] useEffect has proper reset logic (no early returns that skip state cleanup)
- [ ] Props with potential inline values use content comparison, not reference
- [ ] TypeScript generics are used instead of `as unknown as` casts
- [ ] All React types are explicitly imported in type definition files
- [ ] No empty useEffect blocks exist in the codebase

