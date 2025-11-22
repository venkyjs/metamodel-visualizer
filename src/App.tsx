import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Moon, Sun, Target } from 'lucide-react';
import CanvasContent from './components/Canvas/Canvas';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAutoFocus, setIsAutoFocus] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <div className="app-container">
      <div className="controls-overlay">
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
        
        <div className="control-item" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Theme">
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </div>

      <ReactFlowProvider>
        <CanvasContent isAutoFocus={isAutoFocus} />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
