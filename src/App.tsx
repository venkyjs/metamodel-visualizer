import { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Moon, Sun, Target, Eye, ChevronDown, Check, Sparkles } from 'lucide-react';
import CanvasContent from './components/Canvas/Canvas';
import './App.css';

type ViewOption = 'everything' | 'active-path' | 'current-node' | null;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAutoFocus, setIsAutoFocus] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<ViewOption>(() => {
    const saved = localStorage.getItem('selectedView');
    return saved ? (saved as ViewOption) : null;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Dispatch saved view on initial load
  useEffect(() => {
    if (selectedView) {
      window.dispatchEvent(new CustomEvent('viewChange', { detail: selectedView }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewChange = useCallback((option: ViewOption) => {
    // Toggle off if clicking the same option, otherwise set new option
    const newView = selectedView === option ? null : option;
    setSelectedView(newView);
    if (newView) {
      localStorage.setItem('selectedView', newView);
    } else {
      localStorage.removeItem('selectedView');
    }
    window.dispatchEvent(new CustomEvent('viewChange', { detail: newView }));
    setViewDropdownOpen(false);
  }, [selectedView]);

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
      if (!target.closest('.view-dropdown-container')) {
        setViewDropdownOpen(false);
      }
    };
    
    if (viewDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [viewDropdownOpen]);

  return (
    <div className="app-container">
      <div className="controls-overlay">
        <div className="control-center-title">Control Center</div>
        
        <div className="control-item" title="Toggle Auto-Focus">
          <Target size={20} />
          <span>Auto Focus</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isAutoFocus} 
              onChange={(e) => setIsAutoFocus(e.target.checked)} 
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="control-item" title="Toggle Animations">
          <Sparkles size={20} />
          <span>Animate</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isAnimated} 
              onChange={(e) => setIsAnimated(e.target.checked)} 
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="control-item" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Theme">
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </div>

        <div className="view-dropdown-container">
          <div 
            className="control-item view-dropdown-trigger" 
            onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
            title="View Options"
          >
            <Eye size={20} />
            <span>{getViewLabel(selectedView)}</span>
            <ChevronDown size={16} className={`chevron ${viewDropdownOpen ? 'open' : ''}`} />
          </div>
          
          {viewDropdownOpen && (
            <div className="view-dropdown-menu">
              <div 
                className={`view-dropdown-item ${selectedView === 'everything' ? 'selected' : ''}`}
                onClick={() => handleViewChange('everything')}
              >
                <span>Show Everything</span>
                {selectedView === 'everything' && <Check size={14} />}
              </div>
              <div 
                className={`view-dropdown-item ${selectedView === 'active-path' ? 'selected' : ''}`}
                onClick={() => handleViewChange('active-path')}
              >
                <span>Show Active Path</span>
                {selectedView === 'active-path' && <Check size={14} />}
              </div>
              <div 
                className={`view-dropdown-item ${selectedView === 'current-node' ? 'selected' : ''}`}
                onClick={() => handleViewChange('current-node')}
              >
                <span>Show Current Node</span>
                {selectedView === 'current-node' && <Check size={14} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <ReactFlowProvider>
        <CanvasContent isAutoFocus={isAutoFocus} isAnimated={isAnimated} />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
