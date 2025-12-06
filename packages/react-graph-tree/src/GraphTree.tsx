import React, { useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
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
} from './types';
import './styles/index.css';

interface GraphTreeContentProps extends GraphTreeProps {
  innerRef: React.Ref<GraphTreeHandle>;
}

const GraphTreeContent: React.FC<GraphTreeContentProps> = ({ 
  initialNodes: initialNodesProp,
  onNodeExpand,
  onNodeClick,
  controlCenter = { show: true },
  theme = {},
  nodeRenderer,
  showControls = true,
  showBackground = true,
  minZoom = 0.1,
  maxZoom = 4,
  innerRef,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activePath, setActivePath] = useState<string[]>([]);
  const [isAnimatingNodes, setIsAnimatingNodes] = useState(false);
  
  // Control center state
  const [isAutoFocus, setIsAutoFocus] = useState(controlCenter.defaultAutoFocus ?? true);
  const [isAnimated, setIsAnimated] = useState(controlCenter.defaultAnimated ?? false);
  const [isDarkMode, setIsDarkMode] = useState(theme.darkMode ?? false);
  const [currentView, setCurrentView] = useState<ViewOption>(controlCenter.defaultView ?? null);
  
  const lastSelectedNodeRef = useRef<Node | null>(null);
  const nodeOrderRef = useRef<Map<string, number>>(new Map());
  const { setCenter, fitView, fitBounds, getNodes, getEdges } = useReactFlow();

  // Create custom node type with renderer
  const nodeTypes = useMemo(() => ({
    custom: (props: React.ComponentProps<typeof GraphNode>) => (
      <GraphNode {...props} customRenderer={nodeRenderer as React.ComponentType<NodeRendererProps>} />
    ),
  }), [nodeRenderer]);

  // Track original node order and sort nodes to maintain it
  const setNodesWithOrder = useCallback((nodesOrUpdater: Node[] | ((nodes: Node[]) => Node[])) => {
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

  // Custom onNodesChange that preserves order
  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes);
    setNodes((currentNodes) => {
      return [...currentNodes].sort((a, b) => {
        const orderA = nodeOrderRef.current.get(a.id) ?? Infinity;
        const orderB = nodeOrderRef.current.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    });
  }, [onNodesChange, setNodes]);

  // Initialize nodes from props
  useEffect(() => {
    const createInitialNodes = () => {
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
    };
    
    createInitialNodes();
  }, [initialNodesProp, setNodesWithOrder, setEdges]);

  // Apply dark mode
  useEffect(() => {
    // We don't modify the body, just use a class on our container
  }, [isDarkMode]);

  // Function to apply the current view setting
  const applyView = useCallback((
    viewOption: ViewOption,
    pathNodes: string[],
    lastNode: Node | null
  ) => {
    if (!viewOption) return;

    if (viewOption === 'everything') {
      fitView({ padding: 0.2, duration: 800 });
    } 
    else if (viewOption === 'active-path') {
      if (pathNodes.length === 0) {
        fitView({ padding: 0.2, duration: 800 });
        return;
      }
      
      const allNodes = getNodes();
      const activePathNodes = allNodes.filter(n => pathNodes.includes(n.id));
      
      if (activePathNodes.length === 0) {
        fitView({ padding: 0.2, duration: 800 });
        return;
      }
      
      const lastPathNodeId = pathNodes[pathNodes.length - 1];
      
      const childNodes = allNodes.filter(n => {
        const nodeData = n.data as InternalNodeData;
        return nodeData.parentId === lastPathNodeId;
      });
      
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
        { padding: 0.3, duration: 800 }
      );
    } 
    else if (viewOption === 'current-node') {
      if (lastNode) {
        setCenter(lastNode.position.x + 100, lastNode.position.y + 50, { zoom: 1.5, duration: 800 });
      } else {
        fitView({ padding: 0.2, duration: 800 });
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

  // Update edge styles when activePath changes
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

  // Find the path from root to a given node
  const findPathToNode = useCallback((targetNodeId: string, allNodes: Node[]): string[] => {
    const path: string[] = [];
    let currentId: string | null = targetNodeId;
    
    while (currentId) {
      path.unshift(currentId);
      const currentNode = allNodes.find(n => n.id === currentId);
      if (currentNode) {
        const nodeData = currentNode.data as unknown as InternalNodeData;
        currentId = nodeData.parentId || null;
      } else {
        break;
      }
    }
    
    return path;
  }, []);

  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback(async (_event, node) => {
    lastSelectedNodeRef.current = node;

    const nodeData = node.data as unknown as InternalNodeData;
    
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
      const pathToNode = findPathToNode(node.id, nodes);
      setActivePath(pathToNode);
      
      if (currentView) {
        setTimeout(() => applyView(currentView, pathToNode, node), 50);
      } else if (isAutoFocus) {
        setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2, duration: 800 });
      }
      return;
    }

    // If no expansion callback, just update path
    if (!onNodeExpand) {
      const pathToNode = findPathToNode(node.id, nodes);
      setActivePath(pathToNode);
      
      if (currentView) {
        setTimeout(() => applyView(currentView, pathToNode, node), 50);
      } else if (isAutoFocus) {
        setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2, duration: 800 });
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
        const pathToNode = findPathToNode(node.id, nodes);
        setActivePath(pathToNode);
        
        if (currentView) {
          setTimeout(() => applyView(currentView, pathToNode, node), 50);
        } else if (isAutoFocus) {
          setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2, duration: 800 });
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

      // Update parent node
      const updatedParentNodes = nodes.map((n) => {
        if (n.id === node.id) {
          return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
        }
        return n;
      });

      const allNodes = [...updatedParentNodes, ...newNodes];
      const allEdges = [...edges, ...newEdges];

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
        }, 850);
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
        setTimeout(() => applyView(currentView, pathToNode, updatedNode || node), 50);
      } else if (isAutoFocus) {
        if (updatedNode) {
          setTimeout(() => {
            setCenter(updatedNode.position.x + 100, updatedNode.position.y + 50, { zoom: 1.2, duration: 800 });
          }, 50);
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
      console.error('Error expanding node:', error);
    }
  }, [
    onNodeExpand, 
    onNodeClick, 
    isAutoFocus, 
    isAnimated,
    currentView, 
    setCenter, 
    nodes, 
    edges, 
    setNodesWithOrder, 
    setEdges, 
    setNodes,
    findPathToNode, 
    applyView
  ]);

  // Expose imperative handle
  useImperativeHandle(innerRef, () => ({
    fitView: () => fitView({ padding: 0.2, duration: 800 }),
    centerOnNode: (nodeId: string) => {
      const node = getNodes().find(n => n.id === nodeId);
      if (node) {
        setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2, duration: 800 });
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
  );
};

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

