import { useCallback, useRef, useState, useEffect } from 'react';
import { 
  GraphTree, 
  type GraphTreeHandle, 
  type GraphTreeNodeData, 
  type ChildNode,
} from 'react-graph-chart';
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
    metadata: node.metadata,
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

  // Helper function to fetch full node data including metadata
  const fetchNodeWithMetadata = useCallback(async (nodeId: string, parentId?: string): Promise<TreeNode | null> => {
    // Try to find the node in the parent's children
    if (parentId) {
      const children = await request(() => fetchNodeChildren(parentId));
      if (children) {
        const foundNode = children.find(child => child.id === nodeId);
        if (foundNode) return foundNode;
      }
    }
    
    // For datasets and attributes, try to find them in class detail folders
    // Dataset/attribute IDs typically look like "ds-001", "attr-001" etc.
    if (nodeId.startsWith('ds-') && !nodeId.startsWith('ds-0')) {
      // This is likely a dataset (not a dataspace which starts with "ds-001")
      // Try to find in all class datasets folders
      const rootClasses = await request(() => fetchNodeChildren('root-classes'));
      if (rootClasses) {
        for (const classNode of rootClasses) {
          const datasetsFolderId = `${classNode.id}-datasets`;
          const children = await request(() => fetchNodeChildren(datasetsFolderId));
          if (children) {
            const foundNode = children.find(child => child.id === nodeId);
            if (foundNode) return foundNode;
          }
        }
      }
    } else if (nodeId.startsWith('attr-')) {
      // This is an attribute, try to find in all class attributes folders
      const rootClasses = await request(() => fetchNodeChildren('root-classes'));
      if (rootClasses) {
        for (const classNode of rootClasses) {
          const attributesFolderId = `${classNode.id}-attributes`;
          const children = await request(() => fetchNodeChildren(attributesFolderId));
          if (children) {
            const foundNode = children.find(child => child.id === nodeId);
            if (foundNode) return foundNode;
          }
        }
      }
    }
    
    // Fallback: try common parent IDs based on node type
    const nodeType = nodeId.startsWith('ds-0') ? 'dataspace' :
                     nodeId.startsWith('bc-') ? 'businessConcept' :
                     nodeId.startsWith('cls-') ? 'class' : null;
    
    if (nodeType === 'dataspace') {
      const children = await request(() => fetchNodeChildren('root-dataspaces'));
      if (children) {
        const foundNode = children.find(child => child.id === nodeId);
        if (foundNode) return foundNode;
      }
    } else if (nodeType === 'businessConcept') {
      const children = await request(() => fetchNodeChildren('root-businessconcepts'));
      if (children) {
        const foundNode = children.find(child => child.id === nodeId);
        if (foundNode) return foundNode;
      }
    }
    
    return null;
  }, []);

  // Handle node expansion - fetch children from server
  const handleNodeExpand = useCallback(async (node: GraphTreeNodeData): Promise<ChildNode[] | null> => {
    const nodeType = node.type || 'root';
    
    // Leaf nodes don't have children - open drawer instead
    if (LEAF_TYPES.includes(nodeType)) {
      // Try to get metadata from node, or fetch it from API
      let metadata = node.metadata as Record<string, unknown> | undefined;
      
      // If metadata is missing, try to fetch the full node data
      if (!metadata || Object.keys(metadata).length === 0) {
        const parentId = node.parentId as string | undefined;
        const fullNode = await fetchNodeWithMetadata(node.id, parentId);
        if (fullNode?.metadata) {
          metadata = fullNode.metadata;
        }
      }
      
      setSelectedNodeData({
        id: node.id,
        label: node.label,
        nodeType: nodeType,
        description: node.description,
        metadata: metadata,
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
  }, [transformToChildNode, fetchNodeWithMetadata]);

  // Handle node click - open drawer for leaf nodes
  const handleNodeClick = useCallback(async (node: GraphTreeNodeData) => {
    if (LEAF_TYPES.includes(node.type || '')) {
      // Try to get metadata from node, or fetch it from API
      let metadata = node.metadata as Record<string, unknown> | undefined;
      
      // If metadata is missing, try to fetch the full node data
      if (!metadata || Object.keys(metadata).length === 0) {
        const nodeType = node.type || '';
        const parentId = (node.parentId as string | undefined) || 
                        (nodeType === 'dataspace' ? 'root-dataspaces' :
                         nodeType === 'businessConcept' ? 'root-businessconcepts' : undefined);
        const fullNode = await fetchNodeWithMetadata(node.id, parentId);
        if (fullNode?.metadata) {
          metadata = fullNode.metadata;
        }
      }
      
      setSelectedNodeData({
        id: node.id,
        label: node.label,
        nodeType: node.type || 'root',
        description: node.description,
        metadata: metadata,
        isExpanded: false,
        isLoading: false,
      } as NodeData);
      setDrawerOpen(true);
    }
  }, [fetchNodeWithMetadata]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Listen for custom event to open drawer (from details button click)
  useEffect(() => {
    const handleOpenDetails = async (e: CustomEvent) => {
      const nodeData = e.detail;
      
      // Try to get metadata from node, or fetch it from API
      let metadata = nodeData.metadata as Record<string, unknown> | undefined;
      
      // If metadata is missing, try to fetch the full node data
      if (!metadata || Object.keys(metadata).length === 0) {
        const nodeType = nodeData.type || '';
        const parentId = nodeData.parentId || 
                        (nodeType === 'dataspace' ? 'root-dataspaces' :
                         nodeType === 'businessConcept' ? 'root-businessconcepts' : undefined);
        const fullNode = await fetchNodeWithMetadata(nodeData.id, parentId);
        if (fullNode?.metadata) {
          metadata = fullNode.metadata;
        }
      }
      
      setSelectedNodeData({
        id: nodeData.id,
        label: nodeData.label,
        nodeType: nodeData.type || 'root',
        description: nodeData.description,
        metadata: metadata,
        isExpanded: false,
        isLoading: false,
      } as NodeData);
      setDrawerOpen(true);
    };

    window.addEventListener('openNodeDetails', handleOpenDetails as EventListener);
    return () => {
      window.removeEventListener('openNodeDetails', handleOpenDetails as EventListener);
    };
  }, [fetchNodeWithMetadata]);

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
