import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
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
import CustomNode from '../CustomNode/CustomNode';
import Drawer from '../Drawer/Drawer';
import { fetchConfig, fetchFromEndpoint, request } from '../../utils/api';
import { getLayoutedElements } from '../../utils/layout';
import type { NodeData, GraphConfig, NodeTypeConfig } from '../../types';

const nodeTypes = {
  custom: CustomNode,
};

interface CanvasProps {
  isAutoFocus: boolean;
}

type ViewOption = 'everything' | 'active-path' | 'current-node' | null;

const CanvasContent: React.FC<CanvasProps> = ({ isAutoFocus }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activePath, setActivePath] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [graphConfig, setGraphConfig] = useState<GraphConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewOption>(null);
  const lastSelectedNodeRef = useRef<Node | null>(null);
  const nodeOrderRef = useRef<Map<string, number>>(new Map());
  const { setCenter, fitView, fitBounds, getNodes } = useReactFlow();

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
    // Re-sort after ReactFlow's internal changes
    setNodes((currentNodes) => {
      return [...currentNodes].sort((a, b) => {
        const orderA = nodeOrderRef.current.get(a.id) ?? Infinity;
        const orderB = nodeOrderRef.current.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    });
  }, [onNodesChange, setNodes]);

  // Fetch config on mount and create initial nodes
  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      const config = await request(() => fetchConfig());
      
      if (config) {
        setGraphConfig(config);
        
        // Create initial nodes from config
        const initialNodes: Node[] = config.initialNodes.map((nodeConfig, index) => ({
          id: nodeConfig.id,
          type: 'custom',
          position: { x: index * 250, y: 0 },
          data: {
            id: nodeConfig.id,
            label: nodeConfig.label,
            nodeType: nodeConfig.nodeType,
            level: 0,
            isExpanded: false,
            isLoading: false,
          },
        }));
        
        setNodesWithOrder(initialNodes);
      }
      
      setConfigLoading(false);
    };
    
    loadConfig();
  }, [setNodesWithOrder]);

  // Listen for custom event to open drawer
  useEffect(() => {
    const handleOpenDetails = (e: CustomEvent<NodeData>) => {
      setSelectedNodeData(e.detail);
      setDrawerOpen(true);
    };

    window.addEventListener('openNodeDetails', handleOpenDetails as EventListener);
    return () => {
      window.removeEventListener('openNodeDetails', handleOpenDetails as EventListener);
    };
  }, []);

  // Function to apply the current view setting
  const applyView = useCallback((
    viewOption: ViewOption,
    pathNodes: string[],
    lastNode: Node | null
  ) => {
    if (!viewOption) return;

    if (viewOption === 'everything') {
      // Zoom out to show all nodes
      fitView({ padding: 0.2, duration: 800 });
    } 
    else if (viewOption === 'active-path') {
      // Zoom to show nodes on the active path AND children of the current node
      if (pathNodes.length === 0) {
        // If no active path, show everything
        fitView({ padding: 0.2, duration: 800 });
        return;
      }
      
      const allNodes = getNodes();
      const activePathNodes = allNodes.filter(n => pathNodes.includes(n.id));
      
      if (activePathNodes.length === 0) {
        fitView({ padding: 0.2, duration: 800 });
        return;
      }
      
      // Get the last node in the path (currently selected node)
      const lastPathNodeId = pathNodes[pathNodes.length - 1];
      
      // Find children of the last node (nodes whose parentId matches the last node)
      const childNodes = allNodes.filter(n => {
        const nodeData = n.data as NodeData;
        return nodeData.parentId === lastPathNodeId;
      });
      
      // Combine active path nodes and child nodes
      const nodesToFit = [...activePathNodes, ...childNodes];
      
      // Calculate bounding box of all relevant nodes
      const nodeWidth = 200; // Approximate node width
      const nodeHeight = 80; // Approximate node height
      
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
      // Zoom in near last selected node
      if (lastNode) {
        setCenter(lastNode.position.x + 100, lastNode.position.y + 50, { zoom: 1.5, duration: 800 });
      } else {
        // If no node selected yet, show everything
        fitView({ padding: 0.2, duration: 800 });
      }
    }
  }, [fitView, fitBounds, setCenter, getNodes]);

  // Listen for view change events from Control Center
  useEffect(() => {
    const handleViewChange = (e: CustomEvent<ViewOption>) => {
      const option = e.detail;
      setCurrentView(option);
      // Apply the view immediately when selected (if not null)
      if (option) {
        applyView(option, activePath, lastSelectedNodeRef.current);
      }
    };

    window.addEventListener('viewChange', handleViewChange as EventListener);
    return () => {
      window.removeEventListener('viewChange', handleViewChange as EventListener);
    };
  }, [activePath, applyView]);

  // Build a set of edges that are on the active path for quick lookup
  const getActivePathEdges = useCallback((path: string[]): Set<string> => {
    const activeEdges = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      activeEdges.add(`${path[i]}-${path[i + 1]}`);
    }
    return activeEdges;
  }, []);

  // Update edge animations when activePath changes
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
            stroke: isOnActivePath ? 'var(--active-path-color)' : 'var(--line-color)',
            strokeWidth: isOnActivePath ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isOnActivePath ? 'var(--active-path-color)' : 'var(--line-color)',
          },
          className: isOnActivePath ? 'active-path-edge' : '',
        };
      })
    );
  }, [activePath, setEdges, getActivePathEdges]);

  // Find the path from root to a given node by following parentId chain
  const findPathToNode = useCallback((targetNodeId: string, allNodes: Node[]): string[] => {
    const path: string[] = [];
    let currentId: string | null = targetNodeId;
    
    while (currentId) {
      path.unshift(currentId);
      const currentNode = allNodes.find(n => n.id === currentId);
      if (currentNode) {
        const nodeData = currentNode.data as unknown as NodeData;
        currentId = nodeData.parentId || null;
      } else {
        break;
      }
    }
    
    return path;
  }, []);

  // Resolve endpoint placeholders like {classId}, {parentId}
  const resolveEndpoint = useCallback((endpoint: string, nodeData: NodeData, parentNode?: Node): string => {
    let resolved = endpoint;
    
    // Replace {classId} with the classId from node data or parent chain
    if (resolved.includes('{classId}')) {
      const classId = nodeData.classId || (parentNode?.data as NodeData)?.classId || nodeData.parentId;
      resolved = resolved.replace('{classId}', classId || '');
    }
    
    // Replace {parentId} with the parent node id
    if (resolved.includes('{parentId}')) {
      resolved = resolved.replace('{parentId}', nodeData.parentId || '');
    }
    
    // Replace {id} with the node's own id
    if (resolved.includes('{id}')) {
      resolved = resolved.replace('{id}', nodeData.id);
    }
    
    return resolved;
  }, []);

  // Create static children based on config
  const createStaticChildren = useCallback((
    parentNode: Node,
    parentNodeData: NodeData,
    typeConfig: NodeTypeConfig
  ): { newNodes: Node[], newEdges: Edge[] } => {
    if (!typeConfig.staticChildren) {
      return { newNodes: [], newEdges: [] };
    }

    const newNodes: Node[] = typeConfig.staticChildren.map((childConfig) => {
      const childId = `${parentNode.id}-${childConfig.idSuffix}`;
      const description = childConfig.descriptionTemplate
        ? childConfig.descriptionTemplate.replace('{parentLabel}', parentNodeData.label)
        : undefined;

      return {
        id: childId,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          id: childId,
          label: childConfig.label,
          nodeType: childConfig.nodeType,
          description,
          parentId: parentNode.id,
          classId: parentNode.id, // Pass parent id as classId for child lookups
          level: (parentNodeData.level || 0) + 1,
          isExpanded: false,
          isLoading: false,
        },
      };
    });

    const newEdges: Edge[] = newNodes.map((childNode) => ({
      id: `${parentNode.id}-${childNode.id}`,
      source: parentNode.id,
      target: childNode.id,
      style: { stroke: 'var(--line-color)', strokeWidth: 3 },
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--line-color)' },
    }));

    return { newNodes, newEdges };
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(async (_event, node) => {
    if (!graphConfig) return;

    // Track last selected node for "Show Current Node" view option
    lastSelectedNodeRef.current = node;

    const nodeData = node.data as unknown as NodeData;
    const nodeType = nodeData.nodeType;
    
    // Get config for this node type
    const typeConfig = graphConfig.nodeTypeConfig[nodeType];
    
    // Handle leaf nodes (clickBehavior: 'none') - update path and open drawer
    if (!typeConfig || typeConfig.clickBehavior === 'none') {
      const pathToNode = findPathToNode(node.id, nodes);
      setActivePath(pathToNode);
      
      // Open the drawer for leaf nodes
      setSelectedNodeData(nodeData);
      setDrawerOpen(true);
      
      // Apply selected view, or fall back to auto-focus
      if (currentView) {
        setTimeout(() => applyView(currentView, pathToNode, node), 50);
      } else if (isAutoFocus) {
        setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2, duration: 800 });
      }
      return;
    }

    // Check if already expanded
    if (nodeData.isExpanded) {
      // Update active path even for already expanded nodes
      const pathToNode = findPathToNode(node.id, nodes);
      setActivePath(pathToNode);
      
      // Apply selected view, or fall back to auto-focus
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

    let newNodes: Node[] = [];
    let newEdges: Edge[] = [];

    // Handle static children (e.g., class -> Datasets, Attributes)
    if (typeConfig.clickBehavior === 'staticChildren') {
      const result = createStaticChildren(node, nodeData, typeConfig);
      newNodes = result.newNodes;
      newEdges = result.newEdges;
    }
    // Handle fetch by label (e.g., root -> fetch /api/dataspaces)
    else if (typeConfig.clickBehavior === 'fetchByLabel' && typeConfig.labelMapping) {
      const labelConfig = typeConfig.labelMapping[nodeData.label];
      
      if (labelConfig) {
        // Find parent node for context (needed for classId resolution)
        const parentNode = nodes.find(n => n.id === nodeData.parentId);
        const resolvedEndpoint = resolveEndpoint(labelConfig.endpoint, nodeData, parentNode);
        
        const childrenData = await request(() => 
          fetchFromEndpoint(resolvedEndpoint, labelConfig.childType)
        );

        if (childrenData && childrenData.length > 0) {
          newNodes = childrenData.map((child) => ({
            id: child.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {
              ...child,
              parentId: node.id,
              classId: nodeData.classId || nodeData.parentId, // Preserve classId context
              level: (nodeData.level || 0) + 1,
            },
          }));

          newEdges = childrenData.map((child) => ({
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            style: { stroke: 'var(--line-color)', strokeWidth: 3 },
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--line-color)' },
          }));
        }
      }
    }

    // If no children, just mark as expanded and update the path
    if (newNodes.length === 0) {
      setNodesWithOrder((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
          }
          return n;
        })
      );
      // Update active path to this node
      const pathToNode = findPathToNode(node.id, nodes);
      setActivePath(pathToNode);
      return;
    }

    // Update state with new nodes and edges
    const updatedParentNodes = nodes.map((n) => {
      if (n.id === node.id) {
        return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
      }
      return n;
    });

    const allNodes = [...updatedParentNodes, ...newNodes];
    const allEdges = [...edges, ...newEdges];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges);

    setNodesWithOrder(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Update active path: find path to clicked node
    const pathToNode = findPathToNode(node.id, allNodes);
    setActivePath(pathToNode);

    // Update the last selected node ref with layouted position
    const updatedNode = layoutedNodes.find(n => n.id === node.id);
    if (updatedNode) {
      lastSelectedNodeRef.current = updatedNode;
    }

    // Apply selected view after layout, or fall back to auto-focus
    if (currentView) {
      setTimeout(() => applyView(currentView, pathToNode, updatedNode || node), 50);
    } else if (isAutoFocus) {
      if (updatedNode) {
        setTimeout(() => {
          setCenter(updatedNode.position.x + 100, updatedNode.position.y + 50, { zoom: 1.2, duration: 800 });
        }, 50);
      }
    }

  }, [graphConfig, isAutoFocus, currentView, setCenter, nodes, edges, setNodesWithOrder, setEdges, createStaticChildren, resolveEndpoint, findPathToNode, applyView]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  if (configLoading) {
    return (
      <div className="canvas-container config-loading">
        <div className="loading-message">Loading configuration...</div>
      </div>
    );
  }

  return (
    <>
      <div className="canvas-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={4}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
        >
          <Background color="var(--line-color)" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        nodeData={selectedNodeData} 
      />
    </>
  );
};

export default CanvasContent;
