import type React from 'react';
import type { Node, Edge } from '@xyflow/react';

/**
 * Base node data interface for the graph tree
 * Applications can extend this with their own properties
 */
export interface GraphTreeNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  /** Optional node type for styling purposes */
  type?: string;
  /** Optional description */
  description?: string;
  /** Custom properties that can be passed through */
  [key: string]: unknown;
}

/**
 * Internal node data used by the library
 */
export interface InternalNodeData extends GraphTreeNodeData {
  parentId?: string | null;
  level: number;
  isExpanded: boolean;
  isLoading: boolean;
  isNewNode?: boolean;
  animateEntrance?: boolean;
}

/**
 * Properly typed node for the graph tree with InternalNodeData
 */
export type GraphTreeNode = Node<InternalNodeData, 'custom'>;

/**
 * Initial node configuration
 */
export interface InitialNode {
  id: string;
  label: string;
  type?: string;
}

/**
 * Child node returned from the onNodeExpand callback
 */
export interface ChildNode {
  id: string;
  label: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * View options for the control center
 */
export type ViewOption = 'everything' | 'active-path' | 'current-node' | null;

/**
 * Control center configuration
 */
export interface ControlCenterConfig {
  /** Show the control center panel */
  show?: boolean;
  /** Default value for auto-focus */
  defaultAutoFocus?: boolean;
  /** Default value for animations */
  defaultAnimated?: boolean;
  /** Default view option */
  defaultView?: ViewOption;
  /** Title text for control center */
  title?: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Enable dark mode */
  darkMode?: boolean;
  /** Custom CSS class to add to the container */
  className?: string;
}

/**
 * Custom node renderer props
 */
export interface NodeRendererProps {
  data: InternalNodeData;
  isLoading: boolean;
  isExpanded: boolean;
}

/**
 * Error context provided to the onError callback
 */
export interface GraphTreeErrorContext {
  /** ID of the node that caused the error */
  nodeId: string;
  /** Action being performed when error occurred */
  action: 'expand';
}

/**
 * Main GraphTree component props
 */
export interface GraphTreeProps {
  /** Initial nodes to display horizontally */
  initialNodes: InitialNode[];
  
  /**
   * Async callback when a node is clicked for expansion
   * Return child nodes to expand, or empty array/null for leaf nodes
   */
  onNodeExpand?: (node: GraphTreeNodeData) => Promise<ChildNode[] | null>;
  
  /**
   * Callback when a node is clicked (for any additional handling)
   */
  onNodeClick?: (node: GraphTreeNodeData) => void;
  
  /**
   * Callback when an error occurs during async operations
   * Allows host applications to handle errors (toast, logging, telemetry)
   */
  onError?: (error: Error, context: GraphTreeErrorContext) => void;
  
  /**
   * Control center configuration
   */
  controlCenter?: ControlCenterConfig;
  
  /**
   * Theme configuration
   */
  theme?: ThemeConfig;
  
  /**
   * Custom node renderer component
   */
  nodeRenderer?: React.ComponentType<NodeRendererProps>;
  
  /**
   * Show ReactFlow controls
   */
  showControls?: boolean;
  
  /**
   * Show ReactFlow background grid
   */
  showBackground?: boolean;
  
  /**
   * Minimum zoom level
   */
  minZoom?: number;
  
  /**
   * Maximum zoom level
   */
  maxZoom?: number;
}

/**
 * Imperative handle for GraphTree component
 */
export interface GraphTreeHandle {
  /** Fit all nodes in view */
  fitView: () => void;
  /** Center on a specific node */
  centerOnNode: (nodeId: string) => void;
  /** Get all current nodes */
  getNodes: () => Node[];
  /** Get all current edges */
  getEdges: () => Edge[];
  /** Reset the graph to initial state */
  reset: () => void;
}

