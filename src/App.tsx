import { useCallback, useRef, useState, useEffect } from 'react';
import { 
  GraphTree, 
  type GraphTreeHandle, 
  type GraphTreeNodeData, 
  type ChildNode,
} from 'react-graph-tree';
import { fetchRootNodes, fetchNodeChildren, request, type TreeNode } from './utils/api';
import type { NodeData } from './types';
import Drawer from './components/Drawer/Drawer';
import CustomNodeRenderer from './components/CustomNodeRenderer/CustomNodeRenderer';
import './App.css';

// Leaf node types that don't have children
const LEAF_TYPES = ['dataspace', 'businessConcept', 'dataset', 'attribute'];

function App() {
  const graphRef = useRef<GraphTreeHandle>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [initialNodes, setInitialNodes] = useState<ChildNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transform server TreeNode to GraphTree ChildNode format
  const transformToChildNode = useCallback((node: TreeNode): ChildNode => ({
    id: node.id,
    label: node.label,
    type: node.type,
    description: node.description,
  }), []);

  // Load initial nodes from server on mount
  useEffect(() => {
    const loadInitialNodes = async () => {
      setIsLoading(true);
      const nodes = await request(() => fetchRootNodes());
      if (nodes) {
        setInitialNodes(nodes.map(transformToChildNode));
      }
      setIsLoading(false);
    };
    
    loadInitialNodes();
  }, [transformToChildNode]);

  // Handle node expansion - fetch children from server
  const handleNodeExpand = useCallback(async (node: GraphTreeNodeData): Promise<ChildNode[] | null> => {
    const nodeType = node.type || 'root';
    
    // Leaf nodes don't have children - open drawer instead
    if (LEAF_TYPES.includes(nodeType)) {
      setSelectedNodeData({
        id: node.id,
        label: node.label,
        nodeType: nodeType,
        description: node.description,
        isExpanded: false,
        isLoading: false,
      } as NodeData);
      setDrawerOpen(true);
      return null;
    }

    // Fetch children from server
    const children = await request(() => fetchNodeChildren(node.id));
    
    if (children && children.length > 0) {
      return children.map(transformToChildNode);
    }

    return null;
  }, [transformToChildNode]);

  // Handle node click - open drawer for leaf nodes
  const handleNodeClick = useCallback((node: GraphTreeNodeData) => {
    if (LEAF_TYPES.includes(node.type || '')) {
      setSelectedNodeData({
        id: node.id,
        label: node.label,
        nodeType: node.type || 'root',
        description: node.description,
        isExpanded: false,
        isLoading: false,
      } as NodeData);
      setDrawerOpen(true);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Listen for custom event to open drawer (from details button click)
  useEffect(() => {
    const handleOpenDetails = (e: CustomEvent) => {
      const nodeData = e.detail;
      setSelectedNodeData({
        id: nodeData.id,
        label: nodeData.label,
        nodeType: nodeData.type || 'root',
        description: nodeData.description,
        isExpanded: false,
        isLoading: false,
      } as NodeData);
      setDrawerOpen(true);
    };

    window.addEventListener('openNodeDetails', handleOpenDetails as EventListener);
    return () => {
      window.removeEventListener('openNodeDetails', handleOpenDetails as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="app-container app-loading">
        <div className="loading-spinner" />
        <p>Loading graph...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <GraphTree
        ref={graphRef}
        initialNodes={initialNodes}
        onNodeExpand={handleNodeExpand}
        onNodeClick={handleNodeClick}
        controlCenter={{
          show: true,
          defaultAutoFocus: true,
          defaultAnimated: false,
          title: 'Control Center',
        }}
        theme={{
          darkMode: false,
          className: 'custom-graph-theme',
        }}
        nodeRenderer={CustomNodeRenderer}
        showControls={true}
        showBackground={true}
      />
      
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        nodeData={selectedNodeData} 
      />
    </div>
  );
}

export default App;
