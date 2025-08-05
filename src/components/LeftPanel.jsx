import { useState } from 'react'
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import './LeftPanel.css'

const LeftPanel = ({ isOpen, onToggle }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'rectangle',
    width: 100,
    height: 100,
    color: '#3b82f6',
    description: ''
  })

  const [elements, setElements] = useState([
    { id: 1, name: 'Rectangle 1', type: 'rectangle', width: 100, height: 100, color: '#3b82f6' },
    { id: 2, name: 'Circle 1', type: 'circle', width: 80, height: 80, color: '#ef4444' }
  ])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newElement = {
      id: Date.now(),
      ...formData
    }
    setElements([...elements, newElement])
    setFormData({
      name: '',
      type: 'rectangle',
      width: 100,
      height: 100,
      color: '#3b82f6',
      description: ''
    })
  }

  const handleDeleteElement = (id) => {
    setElements(elements.filter(element => element.id !== id))
  }

  return (
    <div className={`left-panel ${isOpen ? 'open' : ''}`}>
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      <div className="panel-content">
        <h2>Elements</h2>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="element-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Element name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="text">Text</option>
              <option value="line">Line</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="width">Width</label>
              <input
                type="number"
                id="width"
                name="width"
                value={formData.width}
                onChange={handleInputChange}
                min="1"
                max="1000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description"
              rows="3"
            />
          </div>

          <button type="submit" className="add-btn">
            <Plus size={16} />
            Add Element
          </button>
        </form>

        {/* Elements list */}
        <div className="elements-list">
          <h3>Created Elements</h3>
          {elements.map(element => (
            <div key={element.id} className="element-item">
              <div className="element-info">
                <div className="element-preview" style={{ backgroundColor: element.color }}>
                  {element.type === 'circle' && <div className="circle-preview"></div>}
                </div>
                <div className="element-details">
                  <div className="element-name">{element.name}</div>
                  <div className="element-type">{element.type}</div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteElement(element.id)}
                className="delete-btn"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeftPanel 