import { useCallback, useRef, useState, useEffect } from 'react';
import { 
  GraphTree, 
  type GraphTreeHandle, 
  type GraphTreeNodeData, 
  type ChildNode,
} from 'react-graph-tree';
import { fetchConfig, fetchFromEndpoint, request } from './utils/api';
import type { GraphConfig, NodeTypeConfig, NodeData } from './types';
import Drawer from './components/Drawer/Drawer';
import CustomNodeRenderer from './components/CustomNodeRenderer/CustomNodeRenderer';
import './App.css';

// Cached config
let cachedConfig: GraphConfig | null = null;

function App() {
  const graphRef = useRef<GraphTreeHandle>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [config, setConfig] = useState<GraphConfig | null>(null);

  // Load config on first render
  const loadConfig = useCallback(async () => {
    if (cachedConfig) return cachedConfig;
    
    const loadedConfig = await request(() => fetchConfig());
    if (loadedConfig) {
      cachedConfig = loadedConfig;
      setConfig(loadedConfig);
    }
    return loadedConfig;
  }, []);

  // Initial nodes - will be loaded from config
  const [initialNodes] = useState(() => {
    // Start with empty array, will load from config
    loadConfig().then(conf => {
      if (conf && graphRef.current) {
        // Trigger a reset with the loaded config
        graphRef.current.reset();
      }
    });
    
    // Return placeholder nodes (will be replaced by config)
    return [
      { id: 'dataspaces-root', label: 'Dataspaces', type: 'root' },
      { id: 'classes-root', label: 'Classes', type: 'root' },
      { id: 'concepts-root', label: 'Business Concepts', type: 'root' },
    ];
  });

  // Resolve endpoint placeholders
  const resolveEndpoint = useCallback((endpoint: string, nodeData: GraphTreeNodeData & { classId?: string; parentId?: string }): string => {
    let resolved = endpoint;
    
    if (resolved.includes('{classId}')) {
      const classId = nodeData.classId || nodeData.parentId;
      resolved = resolved.replace('{classId}', classId || '');
    }
    
    if (resolved.includes('{parentId}')) {
      resolved = resolved.replace('{parentId}', nodeData.parentId || '');
    }
    
    if (resolved.includes('{id}')) {
      resolved = resolved.replace('{id}', nodeData.id);
    }
    
    return resolved;
  }, []);

  // Create static children based on config
  const createStaticChildren = useCallback((
    parentNode: GraphTreeNodeData,
    typeConfig: NodeTypeConfig
  ): ChildNode[] => {
    if (!typeConfig.staticChildren) {
      return [];
    }

    return typeConfig.staticChildren.map((childConfig) => {
      const childId = `${parentNode.id}-${childConfig.idSuffix}`;
      const description = childConfig.descriptionTemplate
        ? childConfig.descriptionTemplate.replace('{parentLabel}', parentNode.label)
        : undefined;

      return {
        id: childId,
        label: childConfig.label,
        type: childConfig.nodeType,
        description,
        parentId: parentNode.id,
        classId: parentNode.id,
      };
    });
  }, []);

  // Handle node expansion - this is the async callback that returns children
  const handleNodeExpand = useCallback(async (node: GraphTreeNodeData): Promise<ChildNode[] | null> => {
    const conf = config || await loadConfig();
    if (!conf) return null;

    const nodeType = node.type || 'root';
    const typeConfig = conf.nodeTypeConfig[nodeType];
    
    // Handle leaf nodes
    if (!typeConfig || typeConfig.clickBehavior === 'none') {
      // Open drawer for leaf nodes
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

    // Handle static children
    if (typeConfig.clickBehavior === 'staticChildren') {
      return createStaticChildren(node, typeConfig);
    }

    // Handle fetch by label
    if (typeConfig.clickBehavior === 'fetchByLabel' && typeConfig.labelMapping) {
      const labelConfig = typeConfig.labelMapping[node.label];
      
      if (labelConfig) {
        const resolvedEndpoint = resolveEndpoint(labelConfig.endpoint, node as GraphTreeNodeData & { classId?: string; parentId?: string });
        
        const childrenData = await request(() => 
          fetchFromEndpoint(resolvedEndpoint, labelConfig.childType)
        );

        if (childrenData && childrenData.length > 0) {
          return childrenData.map((child) => ({
            id: child.id,
            label: child.label,
            type: child.nodeType,
            description: child.description,
            classId: (node as GraphTreeNodeData & { classId?: string }).classId || (node as GraphTreeNodeData & { parentId?: string }).parentId,
          }));
        }
      }
    }

    return null;
  }, [config, loadConfig, createStaticChildren, resolveEndpoint]);

  // Handle node click - for opening drawer on any node
  const handleNodeClick = useCallback((node: GraphTreeNodeData) => {
    // Only open drawer if it's a leaf node type
    const leafTypes = ['dataspace', 'businessConcept', 'dataset', 'attribute'];
    if (leafTypes.includes(node.type || '')) {
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
