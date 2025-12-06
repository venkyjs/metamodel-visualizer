import React from 'react';
import { Info, Database, Boxes, Lightbulb, FolderOpen, Table, Tag } from 'lucide-react';
import type { NodeRendererProps } from 'react-graph-chart';
import './CustomNodeRenderer.css';

type NodeType = 'root' | 'dataspace' | 'class' | 'businessConcept' | 'classDetails' | 'dataset' | 'attribute' | string;

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'dataspace':
      return <Database size={18} />;
    case 'class':
      return <Boxes size={18} />;
    case 'businessConcept':
      return <Lightbulb size={18} />;
    case 'classDetails':
      return <FolderOpen size={18} />;
    case 'dataset':
      return <Table size={18} />;
    case 'attribute':
      return <Tag size={18} />;
    default:
      return null;
  }
};

const getNodeTypeLabel = (type: NodeType): string => {
  switch (type) {
    case 'dataspace':
      return 'Dataspace';
    case 'class':
      return 'Class';
    case 'businessConcept':
      return 'Business Concept';
    case 'classDetails':
      return 'Details';
    case 'dataset':
      return 'Dataset';
    case 'attribute':
      return 'Attribute';
    case 'root':
      return 'Category';
    default:
      return type;
  }
};

// Leaf node types - clicking anywhere opens the drawer
const LEAF_NODE_TYPES: NodeType[] = ['dataspace', 'businessConcept', 'dataset', 'attribute'];

const CustomNodeRenderer: React.FC<NodeRendererProps> = ({ data }) => {
  const nodeType = (data.type || 'root') as NodeType;
  const isRootNode = nodeType === 'root';
  const isLeafNode = LEAF_NODE_TYPES.includes(nodeType);

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch custom event for opening drawer
    const event = new CustomEvent('openNodeDetails', { detail: data });
    window.dispatchEvent(event);
  };

  return (
    <>
      <div className="custom-node-header">
        {!isRootNode && (
          <span className={`custom-node-type-badge ${nodeType}`}>
            {getNodeIcon(nodeType)}
            <span>{getNodeTypeLabel(nodeType)}</span>
          </span>
        )}
        {isRootNode && (
          <span className="custom-node-type-badge root-badge">
            {getNodeTypeLabel(nodeType)}
          </span>
        )}
      </div>
      
      <div className="custom-node-title">{data.label}</div>
      
      {/* Show details button only for non-root, non-leaf nodes */}
      {!isRootNode && !isLeafNode && (
        <button 
          className="custom-node-details-btn" 
          onClick={handleDetailsClick}
          title="View Details"
        >
          <Info size={14} />
          <span>Details</span>
        </button>
      )}
      
      {/* Show hint for leaf nodes */}
      {isLeafNode && (
        <span className="custom-node-leaf-hint">
          <Info size={12} />
          <span>Click for details</span>
        </span>
      )}
    </>
  );
};

export default CustomNodeRenderer;

