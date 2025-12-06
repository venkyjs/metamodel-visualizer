import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react';
import type { MoreNodeData, ChildNode } from '../../types';
import './MoreNode.css';

type MoreNodeProps = NodeProps<Node<MoreNodeData, 'more'>>;

interface MoreNodeCallbacks {
  onSelectHiddenNode: (
    parentNodeId: string,
    selectedNode: ChildNode,
    remainingHiddenNodes: ChildNode[]
  ) => void;
}

// Context to pass callbacks without recreating nodeTypes
export const MoreNodeContext = React.createContext<MoreNodeCallbacks | null>(null);

const MoreNode: React.FC<MoreNodeProps> = ({ data, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const callbacks = React.useContext(MoreNodeContext);
  const { setCenter, getNode } = useReactFlow();

  const hiddenNodes = data.hiddenNodes || [];
  const sortedNodes = [...hiddenNodes].sort((a, b) => 
    a.label.localeCompare(b.label)
  );

  // Get the type from the first hidden node to display as badge
  const nodeType = hiddenNodes[0]?.type || 'more';

  // Calculate dropdown position based on node's screen position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px below the node
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, []);

  // Auto-center on this node when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const node = getNode(id);
      if (node) {
        // Center on the node with offset to show the dropdown below
        setCenter(
          node.position.x + 100,
          node.position.y + 150,
          { zoom: 1.2, duration: 300 }
        );
      }
      // Update position after centering animation
      setTimeout(updateDropdownPosition, 350);
    }
  }, [isOpen, id, getNode, setCenter, updateDropdownPosition]);

  // Update dropdown position on scroll/zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    // Add listener with a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(prev => !prev);
  }, [isOpen, updateDropdownPosition]);

  const handleSelectNode = useCallback((e: React.MouseEvent, node: ChildNode) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    
    if (callbacks?.onSelectHiddenNode) {
      const remainingNodes = hiddenNodes.filter(n => n.id !== node.id);
      callbacks.onSelectHiddenNode(data.originalParentId, node, remainingNodes);
    }
  }, [callbacks, hiddenNodes, data.originalParentId]);

  // Prevent ReactFlow from handling events on this node
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Render dropdown in a portal to escape ReactFlow's stacking context
  const dropdownPortal = isOpen && createPortal(
    <div 
      ref={dropdownRef}
      className="graph-tree-more-dropdown-portal"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        transform: 'translateX(-50%)',
        zIndex: 99999,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="graph-tree-more-dropdown" role="listbox">
        <div className="graph-tree-more-dropdown-header">
          Select to expand
        </div>
        <div className="graph-tree-more-dropdown-list">
          {sortedNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className="graph-tree-more-dropdown-item"
              role="option"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSelectNode(e, node);
              }}
            >
              <span className="graph-tree-more-dropdown-item-label">
                {node.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div 
      className={`graph-tree-node graph-tree-more-node ${nodeType} nodrag nowheel nopan`}
      ref={containerRef}
      data-node-type={nodeType}
      onMouseDown={handleMouseDown}
      onPointerDown={handleMouseDown}
    >
      <Handle type="target" position={Position.Top} className="graph-tree-node-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-tree-node-handle" />
      
      <div 
        className="graph-tree-node-content graph-tree-more-clickable"
        onClick={handleToggleDropdown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="graph-tree-node-header">
          <span className="graph-tree-node-type-badge">
            {nodeType}
          </span>
          <div className={`graph-tree-more-dropdown-trigger ${isOpen ? 'open' : ''}`}>
            <span className="graph-tree-more-dropdown-count">{hiddenNodes.length} more</span>
            <svg className="graph-tree-more-dropdown-chevron" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.427 6.427a.75.75 0 0 1 1.06 0L8 8.94l2.513-2.513a.75.75 0 1 1 1.06 1.06l-3.043 3.044a.75.75 0 0 1-1.06 0L4.427 7.487a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </div>
        </div>
        
        <div className="graph-tree-node-title">
          +{hiddenNodes.length} more items
        </div>
        
        <div className="graph-tree-node-description">
          Click to select
        </div>
      </div>

      {dropdownPortal}
    </div>
  );
};

export default memo(MoreNode);
