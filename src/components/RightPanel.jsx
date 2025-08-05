import { useState } from 'react'
import { ChevronLeft, ChevronRight, Settings, Palette, Grid, Eye, EyeOff } from 'lucide-react'
import './RightPanel.css'

const RightPanel = ({ isOpen, onToggle }) => {
  const [settings, setSettings] = useState({
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    showGuides: true,
    theme: 'light',
    autoSave: true,
    showRulers: true
  })

  const [activeTab, setActiveTab] = useState('general')

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'grid', label: 'Grid', icon: Grid }
  ]

  return (
    <div className={`right-panel ${isOpen ? 'open' : ''}`}>
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      
      <div className="panel-content">
        <h2>Settings</h2>
        
        {/* Tabs */}
        <div className="settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Auto Save</label>
                  <span className="setting-description">Automatically save your work</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Show Rulers</label>
                  <span className="setting-description">Display rulers around the canvas</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.showRulers}
                    onChange={(e) => handleSettingChange('showRulers', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Theme</label>
                  <span className="setting-description">Choose your preferred theme</span>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="theme-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Appearance</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Show Guides</label>
                  <span className="setting-description">Display alignment guides</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.showGuides}
                    onChange={(e) => handleSettingChange('showGuides', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Canvas Background</label>
                  <span className="setting-description">Choose canvas background color</span>
                </div>
                <input
                  type="color"
                  value="#ffffff"
                  className="color-picker"
                />
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div className="settings-section">
              <h3>Grid Settings</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Show Grid</label>
                  <span className="setting-description">Display grid on canvas</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.showGrid}
                    onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Snap to Grid</label>
                  <span className="setting-description">Snap elements to grid</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.snapToGrid}
                    onChange={(e) => handleSettingChange('snapToGrid', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Grid Size</label>
                  <span className="setting-description">Size of grid cells in pixels</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={settings.gridSize}
                  onChange={(e) => handleSettingChange('gridSize', parseInt(e.target.value))}
                  className="range-slider"
                />
                <span className="range-value">{settings.gridSize}px</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RightPanel 