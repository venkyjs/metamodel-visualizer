import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import './CustomNode.css';
import type { NodeData } from '../../types';

// We extend Node to ensure our data structure matches, but for the component props, NodeProps is used.
// React Flow 12 changed some types, checking compatibility is good. 
// NodeProps<T> where T is the data type.

const CustomNode: React.FC<NodeProps<Node>> = ({ data }) => {
  // Cast data to NodeData safely
  const nodeData = data as unknown as NodeData;

  return (
    <div className={`custom-node ${nodeData.isLoading ? 'loading' : ''}`}>
      {/* Handles are invisible but needed for edge connection logic if we use standard edges */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, top: '50%', left: '50%' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, top: '50%', left: '50%' }} />
      
      <span className="custom-node-label">{nodeData.label}</span>
    </div>
  );
};

export default memo(CustomNode);

