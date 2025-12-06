import React from 'react';
import { X } from 'lucide-react';
import type { NodeData } from '../../types';
import './Drawer.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: NodeData | null;
}

const formatPropertyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return value;
  return String(value);
};

const isDateField = (key: string): boolean => {
  const dateKeys = ['createdat', 'updatedat', 'date', 'timestamp', 'created', 'updated', 'modifiedat', 'deletedat'];
  return dateKeys.includes(key.toLowerCase());
};

const formatMetadataKey = (key: string): string => {
  // Convert camelCase or snake_case to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getNodeTypeLabel = (type: string): string => {
  switch (type) {
    case 'dataspace':
      return 'Dataspace';
    case 'class':
      return 'Class';
    case 'businessConcept':
      return 'Business Concept';
    default:
      return type;
  }
};

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, nodeData }) => {
  if (!nodeData) return null;

  return (
    <>
      <div 
        className={`drawer-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onClose}
      />
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title-section">
            <span className={`drawer-type-badge ${nodeData.nodeType}`}>
              {getNodeTypeLabel(nodeData.nodeType)}
            </span>
            <h2 className="drawer-title">{nodeData.label}</h2>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="drawer-content">
          {nodeData.description && (
            <section className="drawer-section">
              <h3 className="section-title">Description</h3>
              <p className="section-description">{nodeData.description}</p>
            </section>
          )}

          {nodeData.properties && 
           typeof nodeData.properties === 'object' && 
           nodeData.properties !== null &&
           Object.keys(nodeData.properties).length > 0 ? (
            <section className="drawer-section">
              <h3 className="section-title">Properties</h3>
              <div className="properties-grid">
                {Object.entries(nodeData.properties as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span className="property-key">{key}</span>
                    <span className="property-value">{formatPropertyValue(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {nodeData.metadata && Object.keys(nodeData.metadata).length > 0 && (
            <section className="drawer-section">
              <h3 className="section-title">Metadata</h3>
              <div className="metadata-list">
                {Object.entries(nodeData.metadata).map(([key, value]) => {
                  // Handle arrays (like tags)
                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="metadata-item tags-item">
                        <span className="metadata-label">{formatMetadataKey(key)}</span>
                        <div className="tags-container">
                          {value.map((item, index) => (
                            <span key={`${key}-${index}`} className="tag">{String(item)}</span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle date fields
                  if (isDateField(key) && typeof value === 'string') {
                    return (
                      <div key={key} className="metadata-item">
                        <span className="metadata-label">{formatMetadataKey(key)}</span>
                        <span className="metadata-value">{formatDate(value)}</span>
                      </div>
                    );
                  }
                  
                  // Handle boolean values with special styling
                  if (typeof value === 'boolean') {
                    return (
                      <div key={key} className="metadata-item">
                        <span className="metadata-label">{formatMetadataKey(key)}</span>
                        <span className={`metadata-value metadata-boolean ${value ? 'true' : 'false'}`}>
                          {value ? 'Yes' : 'No'}
                        </span>
                      </div>
                    );
                  }
                  
                  // Handle regular values
                  return (
                    <div key={key} className="metadata-item">
                      <span className="metadata-label">{formatMetadataKey(key)}</span>
                      <span className="metadata-value">{formatPropertyValue(value)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="drawer-section">
            <h3 className="section-title">Node Info</h3>
            <div className="metadata-list">
              <div className="metadata-item">
                <span className="metadata-label">Node ID</span>
                <span className="metadata-value mono">{nodeData.id}</span>
              </div>
              {nodeData.parentId && (
                <div className="metadata-item">
                  <span className="metadata-label">Parent ID</span>
                  <span className="metadata-value mono">{nodeData.parentId}</span>
                </div>
              )}
              {nodeData.level !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">Level</span>
                  <span className="metadata-value">{nodeData.level}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Drawer;





