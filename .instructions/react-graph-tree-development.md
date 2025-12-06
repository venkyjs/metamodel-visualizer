# React Graph Tree Library - Development Guidelines

This document captures best practices and common pitfalls to avoid when developing the `react-graph-tree` library. These guidelines are based on code review feedback and ensure **performance** and **reliability**.

---

## 1. Performance Guidelines

### 1.1 Avoid Inline Component Creation in useMemo

**❌ Bad:**
```tsx
const nodeTypes = useMemo(() => ({
  custom: (props) => <GraphNode {...props} customRenderer={nodeRenderer} />
}), [nodeRenderer]);
```

**✅ Good:**
Use React Context to pass dynamic values to node components:
```tsx
const NodeRendererContext = createContext<ComponentType | undefined>(undefined);

// In parent:
<NodeRendererContext.Provider value={nodeRenderer}>
  <ReactFlow nodeTypes={nodeTypes} />
</NodeRendererContext.Provider>

// In GraphNode - consume from context:
const customRenderer = useContext(NodeRendererContext);
```

**Why:** Creating inline arrow functions in `useMemo` still creates new function references when dependencies change, defeating `React.memo()` on child components. Context provides a stable way to pass dynamic values.

### 1.2 Use Refs for State in Async Callbacks

**❌ Bad:**
```tsx
const handleClick = useCallback(async () => {
  await someAsyncOp();
  // 'nodes' could be stale here
  const updated = nodes.map(n => ...);
}, [nodes]); // Recreates on every nodes change
```

**✅ Good:**
```tsx
const nodesRef = useRef(nodes);
useEffect(() => { nodesRef.current = nodes; }, [nodes]);

const handleClick = useCallback(async () => {
  await someAsyncOp();
  // Use ref for fresh state after async boundary
  const updated = nodesRef.current.map(n => ...);
}, []); // Stable callback
```

**Why:** Including frequently-changing state in dependency arrays causes callback recreation, which can cause performance issues with ReactFlow. Using refs avoids stale closures after async operations.

### 1.3 Single State Update Pattern

**❌ Bad:**
```tsx
const handleChange = useCallback((changes) => {
  onNodesChange(changes);  // First state update
  setNodes((current) => sortNodes(current));  // Second state update
}, []);
```

**✅ Good:**
```tsx
const handleChange = useCallback((changes) => {
  setNodes((current) => {
    const updated = applyNodeChanges(changes, current);
    return sortNodes(updated);  // Single state update
  });
}, []);
```

**Why:** Multiple state updates trigger multiple re-renders. Combine operations into a single functional update.

---

## 2. Reliability Guidelines

### 2.1 Validate Prop Stability for Arrays

**❌ Bad:**
```tsx
useEffect(() => {
  initializeNodes(initialNodes);
}, [initialNodes]); // Re-runs if consumer passes inline array
```

**✅ Good:**
```tsx
const initialNodesRef = useRef<string>('');

useEffect(() => {
  const serialized = JSON.stringify(initialNodes);
  if (serialized === initialNodesRef.current) return;
  initialNodesRef.current = serialized;
  
  initializeNodes(initialNodes);
}, [initialNodes]);
```

**Why:** Consumers often pass inline arrays (`initialNodes={[{ id: '1' }]}`), which creates new references on every render, causing infinite re-initialization.

### 2.2 Always Reset UI State When Source Data Clears

**❌ Bad:**
```tsx
useEffect(() => {
  if (activePath.length === 0) return; // Early return prevents reset
  updateEdgeStyles(activePath);
}, [activePath]);
```

**✅ Good:**
```tsx
useEffect(() => {
  const activeEdges = activePath.length > 0 
    ? getActivePathEdges(activePath) 
    : new Set<string>();
  updateEdgeStyles(activeEdges); // Always update, even when empty
}, [activePath]);
```

**Why:** Early returns can leave UI in stale state when data is cleared.

### 2.3 Surface Errors via Callbacks

**❌ Bad:**
```tsx
} catch (error) {
  console.error('Error:', error);
}
```

**✅ Good:**
```tsx
} catch (error) {
  if (onError) {
    onError(
      error instanceof Error ? error : new Error(String(error)),
      { nodeId: node.id, action: 'expand' }
    );
  }
}
```

**Why:** Consumers need to handle errors for toast notifications, logging, telemetry, etc. `console.error` is not actionable.

### 2.4 Validate Input Data

Always validate user-provided data to catch bugs early:

```tsx
// Validate node ID uniqueness
const nodeIds = new Set<string>();
for (const node of initialNodes) {
  if (nodeIds.has(node.id)) {
    console.warn(`Duplicate node ID: "${node.id}"`);
  }
  nodeIds.add(node.id);
}
```

**Why:** ReactFlow behaves unpredictably with duplicate node IDs. Early validation helps consumers identify bugs.

### 2.5 Use Iterative Algorithms for Tree Traversal

**❌ Bad (can cause stack overflow on deep trees):**
```tsx
const getDescendants = (nodeId, edges, nodeMap) => {
  const children = edges.filter(e => e.source === nodeId);
  return children.flatMap(e => [
    nodeMap.get(e.target),
    ...getDescendants(e.target, edges, nodeMap) // Recursive
  ]);
};
```

**✅ Good (iterative with stack):**
```tsx
const getDescendants = (nodeId, edges, nodeMap) => {
  const descendants = [];
  const stack = [nodeId];
  const visited = new Set();
  
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    for (const edge of edges.filter(e => e.source === currentId)) {
      const child = nodeMap.get(edge.target);
      if (child) {
        descendants.push(child);
        stack.push(edge.target);
      }
    }
  }
  return descendants;
};
```

**Why:** Recursive functions can cause stack overflow with deeply nested trees. Iterative approach also protects against cycles.

---

## 3. Type Safety Guidelines

### 3.1 Avoid Double Casting

**❌ Bad:**
```tsx
const nodeData = node.data as unknown as InternalNodeData;
```

**✅ Good:**
```tsx
// Define properly typed node
type GraphTreeNode = Node<InternalNodeData, 'custom'>;

// Use generic hooks
const [nodes, setNodes] = useNodesState<GraphTreeNode>([]);

// Node data is now properly typed
const nodeData = node.data; // Type: InternalNodeData
```

**Why:** `as unknown as T` bypasses TypeScript's safety guarantees and hides type mismatches.

### 3.2 Export All Consumer-Facing Types

```tsx
export type {
  GraphTreeProps,
  GraphTreeHandle,
  GraphTreeNodeData,
  NodeRendererProps,
  ControlCenterConfig,
  ThemeConfig,
  ViewOption,
  GraphTreeErrorContext, // Don't forget error types
} from './types';
```

**Why:** Consumers need these types to properly type their code.

---

## 4. Build & Packaging Guidelines

### 4.1 Declare Side Effects

In `package.json`:
```json
{
  "sideEffects": ["*.css"]
}
```

**Why:** Helps bundlers with tree-shaking. Only CSS files have side effects.

### 4.2 SSR Considerations

Avoid top-level CSS imports in library code if SSR is a target:

```tsx
// Let consumers handle CSS imports
// import '@xyflow/react/dist/style.css'; // Don't do this

// Document required imports in README instead
```

### 4.3 Verify CJS/ESM Exports

Ensure both import paths work:
```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  }
}
```

---

## 5. Code Organization

### 5.1 Extract Magic Numbers

**❌ Bad:**
```tsx
setCenter(x + 100, y + 50, { zoom: 1.2, duration: 800 });
setTimeout(callback, 850);
```

**✅ Good:**
```tsx
// Constants at top of file
const ANIMATION_DURATION = 800;
const ANIMATION_COMPLETE_DELAY = 850;
const NODE_CENTER_OFFSET_X = 100;
const NODE_CENTER_OFFSET_Y = 50;
const DEFAULT_ZOOM = 1.2;

// Usage
setCenter(x + NODE_CENTER_OFFSET_X, y + NODE_CENTER_OFFSET_Y, { 
  zoom: DEFAULT_ZOOM, 
  duration: ANIMATION_DURATION 
});
```

**Why:** Named constants are self-documenting and easier to maintain.

### 5.2 Add Display Names

```tsx
const MyComponent: React.FC<Props> = (props) => { ... };
MyComponent.displayName = 'MyComponent';
```

**Why:** Helps with debugging in React DevTools, especially for `forwardRef` and `memo` wrapped components.

---

## Quick Reference Checklist

Before committing changes:

- [ ] No inline component creation in `useMemo`
- [ ] Async callbacks use refs for state access
- [ ] Single state update per operation
- [ ] Array props have reference stability handling
- [ ] UI state resets properly when source data clears
- [ ] Errors surfaced via callbacks, not just console
- [ ] Input data validated (IDs, required fields)
- [ ] Tree traversal uses iterative algorithms
- [ ] No `as unknown as Type` patterns
- [ ] All consumer-facing types exported
- [ ] Magic numbers extracted to constants
- [ ] Components have displayName

