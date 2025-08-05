import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import './FloatingSliders.css'

const FloatingSliders = ({ sliders, onUpdateSlider, onRemoveSlider, onAddSlider }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [draggedSlider, setDraggedSlider] = useState(null)

  const handleSliderChange = (id, value) => {
    onUpdateSlider(id, parseInt(value))
  }

  const handleDragStart = (e, slider) => {
    setDraggedSlider(slider)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetSlider) => {
    e.preventDefault()
    if (draggedSlider && draggedSlider.id !== targetSlider.id) {
      // Reorder sliders logic would go here
      // For now, we'll just update the order in the parent component
    }
    setDraggedSlider(null)
  }

  return (
    <div className={`floating-sliders ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sliders-header">
        <h3>Sliders</h3>
        <div className="header-controls">
          <button 
            className="add-slider-btn"
            onClick={onAddSlider}
            title="Add new slider"
          >
            <Plus size={16} />
          </button>
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <Plus size={16} /> : <X size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="sliders-content">
          {sliders.length === 0 ? (
            <div className="no-sliders">
              <p>No sliders yet</p>
              <button onClick={onAddSlider} className="add-first-slider">
                <Plus size={16} />
                Add Slider
              </button>
            </div>
          ) : (
            <div className="sliders-list">
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className="slider-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, slider)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, slider)}
                >
                  <div className="slider-header">
                    <div className="drag-handle">
                      <GripVertical size={12} />
                    </div>
                    <div className="slider-info">
                      <span className="slider-label">{slider.label}</span>
                      <span className="slider-value">{slider.value}</span>
                    </div>
                    <button
                      className="remove-slider-btn"
                      onClick={() => onRemoveSlider(slider.id)}
                      title="Remove slider"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  <div className="slider-control">
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={slider.value}
                      onChange={(e) => handleSliderChange(slider.id, e.target.value)}
                      className="slider-input"
                    />
                    <div className="slider-range">
                      <span>{slider.min}</span>
                      <span>{slider.max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FloatingSliders 