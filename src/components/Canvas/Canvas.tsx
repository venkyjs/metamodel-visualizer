import React, { useCallback } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from '../CustomNode/CustomNode';
import { fetchChildren, request } from '../../utils/api';
import { getLayoutedElements } from '../../utils/layout';
import type { NodeData } from '../../types';

const nodeTypes = {
  custom: CustomNode,
};

interface CanvasProps {
  isAutoFocus: boolean;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: '1', level: 0 },
  },
];

const CanvasContent: React.FC<CanvasProps> = ({ isAutoFocus }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setCenter } = useReactFlow();

  const onNodeClick: NodeMouseHandler = useCallback(async (_event, node) => {
    const nodeData = node.data as unknown as NodeData;
    
    // Check if already expanded
    if (nodeData.isExpanded) {
       // Even if expanded, if auto-focus is on, center it
       if (isAutoFocus) {
         setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
       }
       return;
    }

    // Set loading state
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, data: { ...n.data, isLoading: true } };
        }
        return n;
      })
    );
    
    // Auto-focus on start of load if desired, or wait until layout? 
    // User said "When I toggle that on, the item I click should align in the center"
    // Let's do it after layout so it settles in the new center.

    // Fetch children
    const childrenData = await request(() => fetchChildren(node.id));

    if (!childrenData) {
       setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, isLoading: false } };
          }
          return n;
        })
      );
      return;
    }

    // Prepare new nodes and edges
    const newNodes: Node[] = childrenData.map((child) => ({
        id: child.label, // assuming unique
        type: 'custom',
        position: { x: 0, y: 0 }, // Initial pos, will be set by dagre
        data: { ...child, level: (nodeData.level || 0) + 1 },
    }));

    const newEdges: Edge[] = childrenData.map((child) => ({
        id: `${node.id}-${child.label}`,
        source: node.id,
        target: child.label,
        style: { stroke: 'var(--line-color)', strokeWidth: 2 },
        animated: true,
    }));

    // Calculate Layout
    setNodes((currentNodes) => {
        const updatedParentNodes = currentNodes.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
          }
          return n;
        });

        const allNodes = [...updatedParentNodes, ...newNodes];
        const allEdges = [...edges, ...newEdges];

        const layouted = getLayoutedElements(allNodes, allEdges);
        
        // Update edges ref as well if needed, but edges state is separate.
        // We need to update edges state too.
        // Inside setNodes we can't set edges directly, so we do it outside or use effects.
        // But we need currentEdges. 
        // We can use the functional update for setEdges too but we need synchronization.
        // Best to read current state or use a combined update if possible.
        // React Flow doesn't have combined update.
        // We can access 'edges' from closure since we are in useCallback with [edges] dep.
        
        return layouted.nodes;
    });

    setEdges((currentEdges) => {
       return [...currentEdges, ...newEdges];
    });
    
    // We need a better way to synchronize.
    // Let's recalculate everything outside setNodes.
    // We have 'nodes' and 'edges' from closure.
    
    const updatedParentNodes = nodes.map((n) => {
        if (n.id === node.id) {
            return { ...n, data: { ...n.data, isLoading: false, isExpanded: true } };
        }
        return n;
    });
    
    const allNodes = [...updatedParentNodes, ...newNodes];
    const allEdges = [...edges, ...newEdges];
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges);
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Auto Focus after layout
    if (isAutoFocus) {
      // Find the node's new position
      const updatedNode = layoutedNodes.find(n => n.id === node.id);
      if (updatedNode) {
        // Small delay to allow render/layout update? React Flow handles state updates fast.
        // setCenter expects viewport coords? No, flow coords usually.
        // setCenter(x, y, zoom)
        setTimeout(() => {
            setCenter(updatedNode.position.x + 30, updatedNode.position.y + 30, { zoom: 1.2, duration: 800 });
        }, 50);
      }
    }

  }, [isAutoFocus, setCenter, nodes, edges, setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="var(--line-color)" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default CanvasContent;
