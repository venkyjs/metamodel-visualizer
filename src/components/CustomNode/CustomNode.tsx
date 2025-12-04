import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Info, Database, Boxes, Lightbulb, FolderOpen, Table, Tag } from 'lucide-react';
import './CustomNode.css';
import type { NodeData, NodeType } from '../../types';

interface CustomNodeProps extends NodeProps<Node> {
  onDetailsClick?: (data: NodeData) => void;
}

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

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const nodeData = data as unknown as NodeData;
  const nodeType = nodeData.nodeType || 'root';
  const isRootNode = nodeType === 'root';
  const isLeafNode = LEAF_NODE_TYPES.includes(nodeType);

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch custom event for opening drawer
    const event = new CustomEvent('openNodeDetails', { detail: nodeData });
    window.dispatchEvent(event);
  };

  // Build animation classes
  const animationClasses = [];
  if (nodeData.animateEntrance && nodeData.isNewNode) {
    animationClasses.push('animate-entrance');
    if (nodeData.isRelationshipNode) {
      animationClasses.push('relationship-node');
    } else {
      animationClasses.push('child-node');
    }
  }

  return (
    <div className={`custom-node ${nodeType} ${nodeData.isLoading ? 'loading' : ''} ${nodeData.isExpanded ? 'expanded' : ''} ${isLeafNode ? 'leaf-node' : ''} ${animationClasses.join(' ')}`}>
      <Handle type="target" position={Position.Top} className="node-handle" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
      
      <div className="node-content">
        <div className="node-header">
          {!isRootNode && (
            <span className="node-type-badge">
              {getNodeIcon(nodeType)}
              <span>{getNodeTypeLabel(nodeType)}</span>
            </span>
          )}
          {isRootNode && (
            <span className="node-type-badge root-badge">
              {getNodeTypeLabel(nodeType)}
            </span>
          )}
        </div>
        
        <div className="node-title">{nodeData.label}</div>
        
        {/* Show details button only for non-root, non-leaf nodes */}
        {!isRootNode && !isLeafNode && (
          <button 
            className="node-details-btn" 
            onClick={handleDetailsClick}
            title="View Details"
          >
            <Info size={14} />
            <span>Details</span>
          </button>
        )}
        
        {/* Show hint for leaf nodes */}
        {isLeafNode && (
          <span className="leaf-node-hint">
            <Info size={12} />
            <span>Click for details</span>
          </span>
        )}
      </div>
      
      {nodeData.isLoading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
