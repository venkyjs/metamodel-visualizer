import React, { useState, useEffect, useCallback } from 'react';
import type { ControlCenterConfig, ViewOption } from '../../types';
import './ControlCenter.css';

interface ControlCenterProps {
  config: ControlCenterConfig;
  isAutoFocus: boolean;
  isAnimated: boolean;
  isDarkMode: boolean;
  selectedView: ViewOption;
  onAutoFocusChange: (value: boolean) => void;
  onAnimatedChange: (value: boolean) => void;
  onDarkModeChange: (value: boolean) => void;
  onViewChange: (view: ViewOption) => void;
}

const ControlCenter: React.FC<ControlCenterProps> = ({
  config,
  isAutoFocus,
  isAnimated,
  isDarkMode,
  selectedView,
  onAutoFocusChange,
  onAnimatedChange,
  onDarkModeChange,
  onViewChange,
}) => {
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  const handleViewChange = useCallback((option: ViewOption) => {
    const newView = selectedView === option ? null : option;
    onViewChange(newView);
    setViewDropdownOpen(false);
  }, [selectedView, onViewChange]);

  const getViewLabel = (view: ViewOption): string => {
    switch (view) {
      case 'everything': return 'View: Everything';
      case 'active-path': return 'View: Active Path';
      case 'current-node': return 'View: Current Node';
      default: return 'View';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.graph-tree-view-dropdown-container')) {
        setViewDropdownOpen(false);
      }
    };
    
    if (viewDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [viewDropdownOpen]);

  return (
    <div className="graph-tree-controls-overlay">
      <div className="graph-tree-control-center-title">
        {config.title || 'Control Center'}
      </div>
      
      <div className="graph-tree-control-item" title="Toggle Auto-Focus">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        <span>Auto Focus</span>
        <label className="graph-tree-switch">
          <input 
            type="checkbox" 
            checked={isAutoFocus} 
            onChange={(e) => onAutoFocusChange(e.target.checked)} 
          />
          <span className="graph-tree-slider"></span>
        </label>
      </div>

      <div className="graph-tree-control-item" title="Toggle Animations">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4"/>
          <path d="M19 17v4"/>
          <path d="M3 5h4"/>
          <path d="M17 19h4"/>
        </svg>
        <span>Animate</span>
        <label className="graph-tree-switch">
          <input 
            type="checkbox" 
            checked={isAnimated} 
            onChange={(e) => onAnimatedChange(e.target.checked)} 
          />
          <span className="graph-tree-slider"></span>
        </label>
      </div>
      
      <div 
        className="graph-tree-control-item" 
        onClick={() => onDarkModeChange(!isDarkMode)} 
        title="Toggle Theme"
      >
        {isDarkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2"/>
            <path d="M12 20v2"/>
            <path d="m4.93 4.93 1.41 1.41"/>
            <path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="m6.34 17.66-1.41 1.41"/>
            <path d="m19.07 4.93-1.41 1.41"/>
          </svg>
        )}
        <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
      </div>

      <div className="graph-tree-view-dropdown-container">
        <div 
          className="graph-tree-control-item graph-tree-view-dropdown-trigger" 
          onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
          title="View Options"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>{getViewLabel(selectedView)}</span>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`graph-tree-chevron ${viewDropdownOpen ? 'open' : ''}`}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
        
        {viewDropdownOpen && (
          <div className="graph-tree-view-dropdown-menu">
            <div 
              className={`graph-tree-view-dropdown-item ${selectedView === 'everything' ? 'selected' : ''}`}
              onClick={() => handleViewChange('everything')}
            >
              <span>Show Everything</span>
              {selectedView === 'everything' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <div 
              className={`graph-tree-view-dropdown-item ${selectedView === 'active-path' ? 'selected' : ''}`}
              onClick={() => handleViewChange('active-path')}
            >
              <span>Show Active Path</span>
              {selectedView === 'active-path' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <div 
              className={`graph-tree-view-dropdown-item ${selectedView === 'current-node' ? 'selected' : ''}`}
              onClick={() => handleViewChange('current-node')}
            >
              <span>Show Current Node</span>
              {selectedView === 'current-node' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlCenter;

