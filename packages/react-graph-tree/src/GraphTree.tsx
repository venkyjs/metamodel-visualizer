import React, { useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo, createContext } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
  useReactFlow,
  Background,
  Controls,
  type NodeMouseHandler,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import GraphNode from './components/GraphNode/GraphNode';
import ControlCenter from './components/ControlCenter/ControlCenter';
import { getLayoutedElements } from './utils/layout';
import type { 
  GraphTreeProps, 
  GraphTreeHandle, 
  InternalNodeData, 
  ViewOption,
  GraphTreeNodeData,
  NodeRendererProps,
  GraphTreeNode,
} from './types';
import './styles/index.css';

// Context for passing nodeRenderer to GraphNode without recreating nodeTypes
export const NodeRendererContext = createContext<React.ComponentType<NodeRendererProps> | undefined>(undefined);

// Animation and viewport constants for consistent behavior
const ANIMATION_DURATION = 800;
const LAYOUT_SETTLE_DELAY = 50;
const ANIMATION_COMPLETE_DELAY = 850;
const VIEWPORT_PADDING = 0.2;
const ACTIVE_PATH_PADDING = 0.3;
const DEFAULT_ZOOM = 1.2;
const CURRENT_NODE_ZOOM = 1.5;
const NODE_CENTER_OFFSET_X = 100;
const NODE_CENTER_OFFSET_Y = 50;

interface GraphTreeContentProps extends GraphTreeProps {
  innerRef: React.Ref<GraphTreeHandle>;
}

const GraphTreeContent: React.FC<GraphTreeContentProps> = ({ 
  initialNodes: initialNodesProp,
  onNodeExpand,
  onNodeClick,
  onError,
  controlCenter = { show: true },
  theme = {},
  nodeRenderer,
  showControls = true,
  showBackground = true,
  minZoom = 0.1,
  maxZoom = 4,
  innerRef,
}) => {
  const [nodes, setNodes] = useNodesState<GraphTreeNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activePath, setActivePath] = useState<string[]>([]);
  const [isAnimatingNodes, setIsAnimatingNodes] = useState(false);
  
  // Control center state
  const [isAutoFocus, setIsAutoFocus] = useState(controlCenter.defaultAutoFocus ?? true);
  const [isAnimated, setIsAnimated] = useState(controlCenter.defaultAnimated ?? false);
  const [isDarkMode, setIsDarkMode] = useState(theme.darkMode ?? false);
  const [currentView, setCurrentView] = useState<ViewOption>(controlCenter.defaultView ?? null);
  
  const lastSelectedNodeRef = useRef<GraphTreeNode | null>(null);
  const nodeOrderRef = useRef<Map<string, number>>(new Map());
  const nodesRef = useRef<GraphTreeNode[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const initialNodesRef = useRef<string>('');
  const { setCenter, fitView, fitBounds, getNodes, getEdges } = useReactFlow();

  // Keep refs in sync with state to avoid stale closures in async callbacks
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Create stable node types - renderer is passed via Context to avoid recreating component on every render
  const nodeTypes = useMemo(() => ({
    custom: GraphNode,
  }), []);

  // Track original node order and sort nodes to maintain it
  const setNodesWithOrder = useCallback((nodesOrUpdater: GraphTreeNode[] | ((nodes: GraphTreeNode[]) => GraphTreeNode[])) => {
    setNodes((currentNodes) => {
      const newNodes = typeof nodesOrUpdater === 'function' 
        ? nodesOrUpdater(currentNodes) 
        : nodesOrUpdater;
      
      // Assign order indices to new nodes that don't have one
      newNodes.forEach((node) => {
        if (!nodeOrderRef.current.has(node.id)) {
          nodeOrderRef.current.set(node.id, nodeOrderRef.current.size);
        }
      });
      
      // Sort nodes by their original order
      return [...newNodes].sort((a, b) => {
        const orderA = nodeOrderRef.current.get(a.id) ?? Infinity;
        const orderB = nodeOrderRef.current.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    });
  }, [setNodes]);

  // Custom onNodesChange that applies changes and preserves order in a single state update
  const handleNodesChange = useCallback((changes: NodeChange<GraphTreeNode>[]) => {
    setNodes((currentNodes) => {
      const updatedNodes = applyNodeChanges(changes, currentNodes);
      return [...updatedNodes].sort((a, b) => {
        const orderA = nodeOrderRef.current.get(a.id) ?? Infinity;
        const orderB = nodeOrderRef.current.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    });
  }, [setNodes]);

  // Initialize nodes from props - use JSON comparison to avoid resetting on inline array reference changes
  useEffect(() => {
    const serialized = JSON.stringify(initialNodesProp);
    
    // Skip if content hasn't actually changed
    if (serialized === initialNodesRef.current) {
      return;
    }
    initialNodesRef.current = serialized;
    
    // Validate node ID uniqueness to prevent ReactFlow issues
    const nodeIds = new Set<string>();
    for (const node of initialNodesProp) {
      if (nodeIds.has(node.id)) {
        const error = new Error(`Duplicate node ID detected: "${node.id}". All node IDs must be unique.`);
        if (onError) {
          onError(error, { nodeId: node.id, action: 'expand' });
        }
        console.warn('[react-graph-tree]', error.message);
      }
      nodeIds.add(node.id);
    }
    
    const initialFlowNodes: Node[] = initialNodesProp.map((nodeConfig, index) => ({
      id: nodeConfig.id,
      type: 'custom',
      position: { x: index * 250, y: 0 },
      data: {
        id: nodeConfig.id,
        label: nodeConfig.label,
        type: nodeConfig.type,
        level: 0,
        isExpanded: false,
        isLoading: false,
      } as InternalNodeData,
    }));
    
    // Clear order map and set initial order
    nodeOrderRef.current.clear();
    initialFlowNodes.forEach((node, index) => {
      nodeOrderRef.current.set(node.id, index);
    });
    
    setNodesWithOrder(initialFlowNodes);
    setEdges([]);
    setActivePath([]);
  }, [initialNodesProp, setNodesWithOrder, setEdges]);

  // Dark mode is applied via the className on the container element (see containerClassName)

  // Function to apply the current view setting
  const applyView = useCallback((
    viewOption: ViewOption,
    pathNodes: string[],
    lastNode: GraphTreeNode | null
  ) => {
    if (!viewOption) return;

    if (viewOption === 'everything') {
      fitView({ padding: VIEWPORT_PADDING, duration: ANIMATION_DURATION });
    } 
    else if (viewOption === 'active-path') {
      if (pathNodes.length === 0) {
        fitView({ padding: VIEWPORT_PADDING, duration: ANIMATION_DURATION });
        return;
      }
      
      // Use nodesRef for type-safe access to node data
      const allNodes = nodesRef.current;
      const activePathNodes = allNodes.filter(n => pathNodes.includes(n.id));
      
      if (activePathNodes.length === 0) {
        fitView({ padding: VIEWPORT_PADDING, duration: ANIMATION_DURATION });
        return;
      }
      
      const lastPathNodeId = pathNodes[pathNodes.length - 1];
      
      const childNodes = allNodes.filter(n => n.data.parentId === lastPathNodeId);
      
      const nodesToFit = [...activePathNodes, ...childNodes];
      
      const nodeWidth = 200;
      const nodeHeight = 80;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodesToFit.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      });
      
      fitBounds(
        { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        { padding: ACTIVE_PATH_PADDING, duration: ANIMATION_DURATION }
      );
    } 
    else if (viewOption === 'current-node') {
      if (lastNode) {
        setCenter(lastNode.position.x + NODE_CENTER_OFFSET_X, lastNode.position.y + NODE_CENTER_OFFSET_Y, { zoom: CURRENT_NODE_ZOOM, duration: ANIMATION_DURATION });
      } else {
        fitView({ padding: VIEWPORT_PADDING, duration: ANIMATION_DURATION });
      }
    }
  }, [fitView, fitBounds, setCenter, getNodes]);

  // Handle view change from control center
  const handleViewChange = useCallback((view: ViewOption) => {
    setCurrentView(view);
    if (view) {
      applyView(view, activePath, lastSelectedNodeRef.current);
    }
  }, [activePath, applyView]);

  // Build a set of edges that are on the active path
  const getActivePathEdges = useCallback((path: string[]): Set<string> => {
    const activeEdges = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      activeEdges.add(`${path[i]}-${path[i + 1]}`);
    }
    return activeEdges;
  }, []);

  // Update edge styles when activePath changes - always recompute to reset when path is cleared
  useEffect(() => {
    const activePathEdges = activePath.length > 0 ? getActivePathEdges(activePath) : new Set<string>();

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

  // Find the path from root to a given node
  const findPathToNode = useCallback((targetNodeId: string, allNodes: GraphTreeNode[]): string[] => {
    const path: string[] = [];
    let currentId: string | null = targetNodeId;
    
    while (currentId) {
      path.unshift(currentId);
      const currentNode = allNodes.find(n => n.id === currentId);
      if (currentNode) {
        currentId = currentNode.data.parentId || null;
      } else {
        break;
      }
    }
    
    return path;
  }, []);

  // Handle node click
  const handleNodeClick: NodeMouseHandler<GraphTreeNode> = useCallback(async (_event, node) => {
    lastSelectedNodeRef.current = node;

    const nodeData = node.data;
    
    // Call the onNodeClick callback if provided
    if (onNodeClick) {
      const publicNodeData: GraphTreeNodeData = {
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        description: nodeData.description,
      };
      onNodeClick(publicNodeData);
    }

    // If already expanded, just update the path and view
    if (nodeData.isExpanded) {
      const pathToNode = findPathToNode(node.id, nodesRef.current);
      setActivePath(pathToNode);
      
      if (currentView) {
        setTimeout(() => applyView(currentView, pathToNode, node), LAYOUT_SETTLE_DELAY);
      } else if (isAutoFocus) {
        setCenter(node.position.x + NODE_CENTER_OFFSET_X, node.position.y + NODE_CENTER_OFFSET_Y, { zoom: DEFAULT_ZOOM, duration: ANIMATION_DURATION });
      }
      return;
    }

    // If no expansion callback, just update path
    if (!onNodeExpand) {
      const pathToNode = findPathToNode(node.id, nodesRef.current);
      setActivePath(pathToNode);
      
      if (currentView) {
        setTimeout(() => applyView(currentView, pathToNode, node), LAYOUT_SETTLE_DELAY);
      } else if (isAutoFocus) {
        setCenter(node.position.x + NODE_CENTER_OFFSET_X, node.position.y + NODE_CENTER_OFFSET_Y, { zoom: DEFAULT_ZOOM, duration: ANIMATION_DURATION });
      }
      return;
    }

    // Set loading state
    setNodesWithOrder((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, data: { ...n.data, isLoading: true } };
        }
        return n;
      })
    );

    // Call the async expansion callback
    const publicNodeData: GraphTreeNodeData = {
      id: nodeData.id,
      label: nodeData.label,
      type: nodeData.type,
      description: nodeData.description,
    };

    try {
      const childNodes = await onNodeExpand(publicNodeData);

      // If no children returned, mark as expanded leaf
      if (!childNodes || childNodes.length === 0) {
        setNodesWithOrder((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
            }
            return n;
          })
        );
        const pathToNode = findPathToNode(node.id, nodesRef.current);
        setActivePath(pathToNode);
        
        if (currentView) {
          setTimeout(() => applyView(currentView, pathToNode, node), LAYOUT_SETTLE_DELAY);
        } else if (isAutoFocus) {
          setCenter(node.position.x + NODE_CENTER_OFFSET_X, node.position.y + NODE_CENTER_OFFSET_Y, { zoom: DEFAULT_ZOOM, duration: ANIMATION_DURATION });
        }
        return;
      }

      // Create new nodes from children
      const newNodes: Node[] = childNodes.map((child) => ({
        id: child.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          id: child.id,
          label: child.label,
          type: child.type,
          description: child.description,
          parentId: node.id,
          level: (nodeData.level || 0) + 1,
          isExpanded: false,
          isLoading: false,
          isNewNode: true,
          animateEntrance: isAnimated,
        } as InternalNodeData,
      }));

      const newEdges: Edge[] = childNodes.map((child) => ({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        style: { stroke: 'var(--graph-tree-line, #94a3b8)', strokeWidth: 3 },
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--graph-tree-line, #94a3b8)' },
      }));

      // Update parent node - use refs to get latest state after async operation
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      
      const updatedParentNodes = currentNodes.map((n) => {
        if (n.id === node.id) {
          return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
        }
        return n;
      });

      const allNodes = [...updatedParentNodes, ...newNodes];
      const allEdges = [...currentEdges, ...newEdges];

      // Assign order to new nodes
      allNodes.forEach((n) => {
        if (!nodeOrderRef.current.has(n.id)) {
          nodeOrderRef.current.set(n.id, nodeOrderRef.current.size);
        }
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        allNodes, 
        allEdges, 
        nodeOrderRef.current
      );

      // Trigger animation if enabled
      if (isAnimated && newNodes.length > 0) {
        setIsAnimatingNodes(true);
        setTimeout(() => {
          setIsAnimatingNodes(false);
          setNodes((currentNodes) =>
            currentNodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                isNewNode: false,
                animateEntrance: false,
              },
            }))
          );
        }, ANIMATION_COMPLETE_DELAY);
      }

      setNodesWithOrder(layoutedNodes);
      setEdges(layoutedEdges);
      
      const pathToNode = findPathToNode(node.id, allNodes);
      setActivePath(pathToNode);

      const updatedNode = layoutedNodes.find(n => n.id === node.id);
      if (updatedNode) {
        lastSelectedNodeRef.current = updatedNode;
      }

      if (currentView) {
        setTimeout(() => applyView(currentView, pathToNode, updatedNode || node), LAYOUT_SETTLE_DELAY);
      } else if (isAutoFocus) {
        if (updatedNode) {
          setTimeout(() => {
            setCenter(updatedNode.position.x + NODE_CENTER_OFFSET_X, updatedNode.position.y + NODE_CENTER_OFFSET_Y, { zoom: DEFAULT_ZOOM, duration: ANIMATION_DURATION });
          }, LAYOUT_SETTLE_DELAY);
        }
      }
    } catch (error) {
      // Reset loading state on error
      setNodesWithOrder((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, isLoading: false } };
          }
          return n;
        })
      );
      // Notify consumer via callback instead of console.error
      if (onError) {
        onError(
          error instanceof Error ? error : new Error(String(error)),
          { nodeId: node.id, action: 'expand' }
        );
      }
    }
  }, [
    onNodeExpand, 
    onNodeClick,
    onError,
    isAutoFocus, 
    isAnimated,
    currentView, 
    setCenter, 
    setNodesWithOrder, 
    setEdges, 
    setNodes,
    findPathToNode, 
    applyView
  ]);

  // Expose imperative handle
  useImperativeHandle(innerRef, () => ({
    fitView: () => fitView({ padding: VIEWPORT_PADDING, duration: ANIMATION_DURATION }),
    centerOnNode: (nodeId: string) => {
      const node = getNodes().find(n => n.id === nodeId);
      if (node) {
        setCenter(node.position.x + NODE_CENTER_OFFSET_X, node.position.y + NODE_CENTER_OFFSET_Y, { zoom: DEFAULT_ZOOM, duration: ANIMATION_DURATION });
      }
    },
    getNodes: () => getNodes(),
    getEdges: () => getEdges(),
    reset: () => {
      nodeOrderRef.current.clear();
      const initialFlowNodes: Node[] = initialNodesProp.map((nodeConfig, index) => ({
        id: nodeConfig.id,
        type: 'custom',
        position: { x: index * 250, y: 0 },
        data: {
          id: nodeConfig.id,
          label: nodeConfig.label,
          type: nodeConfig.type,
          level: 0,
          isExpanded: false,
          isLoading: false,
        } as InternalNodeData,
      }));
      initialFlowNodes.forEach((node, index) => {
        nodeOrderRef.current.set(node.id, index);
      });
      setNodesWithOrder(initialFlowNodes);
      setEdges([]);
      setActivePath([]);
    },
  }), [fitView, setCenter, getNodes, getEdges, initialNodesProp, setNodesWithOrder, setEdges]);

  const containerClassName = `graph-tree-container${isDarkMode ? ' graph-tree-dark' : ''}${isAnimated ? ' graph-tree-animate-enabled' : ''}${isAnimatingNodes ? ' graph-tree-animating' : ''}${theme.className ? ` ${theme.className}` : ''}`;

  return (
    <NodeRendererContext.Provider value={nodeRenderer}>
      <div className={containerClassName}>
        {controlCenter.show !== false && (
          <ControlCenter
            config={controlCenter}
            isAutoFocus={isAutoFocus}
            isAnimated={isAnimated}
            isDarkMode={isDarkMode}
            selectedView={currentView}
            onAutoFocusChange={setIsAutoFocus}
            onAnimatedChange={setIsAnimated}
            onDarkModeChange={setIsDarkMode}
            onViewChange={handleViewChange}
          />
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={minZoom}
          maxZoom={maxZoom}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
        >
          {showBackground && <Background color="var(--graph-tree-line, #94a3b8)" gap={20} />}
          {showControls && <Controls />}
        </ReactFlow>
      </div>
    </NodeRendererContext.Provider>
  );
};

GraphTreeContent.displayName = 'GraphTreeContent';

/**
 * GraphTree - A reusable tree graph visualization component
 * 
 * @example
 * ```tsx
 * <GraphTree
 *   initialNodes={[{ id: '1', label: 'Root' }]}
 *   onNodeExpand={async (node) => {
 *     const children = await fetchChildren(node.id);
 *     return children;
 *   }}
 * />
 * ```
 */
const GraphTree = forwardRef<GraphTreeHandle, GraphTreeProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <GraphTreeContent {...props} innerRef={ref} />
    </ReactFlowProvider>
  );
});

GraphTree.displayName = 'GraphTree';

export default GraphTree;

