import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { InternalNodeData, NodeRendererProps } from '../../types';
import './GraphNode.css';

interface GraphNodeProps extends NodeProps<Node> {
  customRenderer?: React.ComponentType<NodeRendererProps>;
}

const DefaultNodeContent: React.FC<NodeRendererProps> = ({ data }) => {
  return (
    <>
      {data.type && (
        <div className="graph-tree-node-header">
          <span className="graph-tree-node-type-badge">
            {data.type}
          </span>
        </div>
      )}
      <div className="graph-tree-node-title">{data.label}</div>
      {data.description && (
        <div className="graph-tree-node-description">{data.description}</div>
      )}
    </>
  );
};

const GraphNode: React.FC<GraphNodeProps> = ({ data, ...props }) => {
  const nodeData = data as unknown as InternalNodeData;
  const CustomRenderer = (props as unknown as { customRenderer?: React.ComponentType<NodeRendererProps> }).customRenderer;

  // Build animation classes
  const animationClasses = [];
  if (nodeData.animateEntrance && nodeData.isNewNode) {
    animationClasses.push('animate-entrance');
  }

  const nodeType = nodeData.type || 'default';

  const rendererProps: NodeRendererProps = {
    data: nodeData,
    isLoading: nodeData.isLoading,
    isExpanded: nodeData.isExpanded,
  };

  return (
    <div 
      className={`graph-tree-node ${nodeType} ${nodeData.isLoading ? 'loading' : ''} ${nodeData.isExpanded ? 'expanded' : ''} ${animationClasses.join(' ')}`}
      data-node-type={nodeType}
    >
      <Handle type="target" position={Position.Top} className="graph-tree-node-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-tree-node-handle" />
      
      <div className="graph-tree-node-content">
        {CustomRenderer ? (
          <CustomRenderer {...rendererProps} />
        ) : (
          <DefaultNodeContent {...rendererProps} />
        )}
      </div>
      
      {nodeData.isLoading && (
        <div className="graph-tree-loading-indicator">
          <div className="graph-tree-loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default memo(GraphNode);

