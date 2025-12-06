import dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/react';

// Node size for rectangular nodes
const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const NODE_SEPARATION = 60;

// Helper to get all descendants of a node
const getDescendants = (nodeId: string, edges: Edge[], nodeMap: Map<string, Node>): Node[] => {
  const descendants: Node[] = [];
  const childEdges = edges.filter(e => e.source === nodeId);
  
  for (const edge of childEdges) {
    const childNode = nodeMap.get(edge.target);
    if (childNode) {
      descendants.push(childNode);
      descendants.push(...getDescendants(edge.target, edges, nodeMap));
    }
  }
  
  return descendants;
};

export const getLayoutedElements = (
  nodes: Node[], 
  edges: Edge[],
  nodeOrderMap?: Map<string, number>
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB',
    nodesep: NODE_SEPARATION,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // First pass: get dagre's calculated positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  // If we have an order map, reorder nodes horizontally within each rank
  if (nodeOrderMap && nodeOrderMap.size > 0) {
    // Create a map for quick node lookup
    const nodeMap = new Map<string, Node>();
    layoutedNodes.forEach(node => nodeMap.set(node.id, node));

    // Find root nodes (nodes with no incoming edges) or top-level nodes
    const targetNodeIds = new Set(edges.map(e => e.target));
    const rootNodes = layoutedNodes.filter(n => !targetNodeIds.has(n.id));

    // Group root nodes by their y position (they should all be at same level)
    const rootRankGroups = new Map<number, Node[]>();
    rootNodes.forEach((node) => {
      const y = Math.round(node.position.y);
      if (!rootRankGroups.has(y)) {
        rootRankGroups.set(y, []);
      }
      rootRankGroups.get(y)!.push(node);
    });

    // Process each rank of root nodes
    rootRankGroups.forEach((rankNodes) => {
      if (rankNodes.length <= 1) return;

      // Store original positions with node ids
      const originalPositions = rankNodes.map(n => ({
        id: n.id,
        x: n.position.x
      })).sort((a, b) => a.x - b.x);

      // Sort nodes by their original insertion order
      const sortedNodes = [...rankNodes].sort((a, b) => {
        const orderA = nodeOrderMap.get(a.id) ?? Infinity;
        const orderB = nodeOrderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });

      // Calculate and apply deltas for each node and its descendants
      sortedNodes.forEach((node, index) => {
        const targetX = originalPositions[index].x;
        const deltaX = targetX - node.position.x;
        
        if (deltaX !== 0) {
          // Move this node
          node.position.x = targetX;
          
          // Move all descendants by the same delta
          const descendants = getDescendants(node.id, edges, nodeMap);
          descendants.forEach(descendant => {
            descendant.position.x += deltaX;
          });
        }
      });
    });

    // Now handle sibling nodes at each level (nodes with the same parent)
    // Group nodes by their parent
    const childrenByParent = new Map<string, Node[]>();
    edges.forEach(edge => {
      const childNode = nodeMap.get(edge.target);
      if (childNode) {
        if (!childrenByParent.has(edge.source)) {
          childrenByParent.set(edge.source, []);
        }
        childrenByParent.get(edge.source)!.push(childNode);
      }
    });

    // For each parent, reorder its children
    childrenByParent.forEach((children) => {
      if (children.length <= 1) return;

      // Store original positions
      const originalPositions = children.map(n => ({
        id: n.id,
        x: n.position.x
      })).sort((a, b) => a.x - b.x);

      // Sort children by their original insertion order
      const sortedChildren = [...children].sort((a, b) => {
        const orderA = nodeOrderMap.get(a.id) ?? Infinity;
        const orderB = nodeOrderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });

      // Apply position swaps with subtree movement
      sortedChildren.forEach((node, index) => {
        const targetX = originalPositions[index].x;
        const deltaX = targetX - node.position.x;
        
        if (deltaX !== 0) {
          // Move this node
          node.position.x = targetX;
          
          // Move all descendants by the same delta
          const descendants = getDescendants(node.id, edges, nodeMap);
          descendants.forEach(descendant => {
            descendant.position.x += deltaX;
          });
        }
      });
    });
  }

  return { nodes: layoutedNodes, edges };
};

