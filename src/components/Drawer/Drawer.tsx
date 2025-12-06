import React from 'react';
import { X } from 'lucide-react';
import type { NodeData } from '../../types';
import './Drawer.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: NodeData | null;
}

const formatPropertyValue = (value: string | number | boolean): string => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
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

          {nodeData.properties && Object.keys(nodeData.properties).length > 0 && (
            <section className="drawer-section">
              <h3 className="section-title">Properties</h3>
              <div className="properties-grid">
                {Object.entries(nodeData.properties).map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span className="property-key">{key}</span>
                    <span className="property-value">{formatPropertyValue(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {nodeData.metadata && (
            <section className="drawer-section">
              <h3 className="section-title">Metadata</h3>
              <div className="metadata-list">
                {nodeData.metadata.owner && (
                  <div className="metadata-item">
                    <span className="metadata-label">Owner</span>
                    <span className="metadata-value">{nodeData.metadata.owner}</span>
                  </div>
                )}
                {nodeData.metadata.createdAt && (
                  <div className="metadata-item">
                    <span className="metadata-label">Created</span>
                    <span className="metadata-value">{formatDate(nodeData.metadata.createdAt)}</span>
                  </div>
                )}
                {nodeData.metadata.updatedAt && (
                  <div className="metadata-item">
                    <span className="metadata-label">Updated</span>
                    <span className="metadata-value">{formatDate(nodeData.metadata.updatedAt)}</span>
                  </div>
                )}
                {nodeData.metadata.tags && nodeData.metadata.tags.length > 0 && (
                  <div className="metadata-item tags-item">
                    <span className="metadata-label">Tags</span>
                    <div className="tags-container">
                      {nodeData.metadata.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
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





