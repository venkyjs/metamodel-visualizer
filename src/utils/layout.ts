import dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Node size (width/height) - should match the CSS dimensions + some padding
// CustomNode is 60px * 60px. Let's give some space.
const NODE_WIDTH = 120;
const NODE_HEIGHT = 120;

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB' }); // Top-to-Bottom

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2 + 30, // +30 to center the 60px node in the 120px space
        y: nodeWithPosition.y - NODE_HEIGHT / 2 + 30,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
