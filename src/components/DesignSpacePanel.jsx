import { useState } from 'react'
import { ChevronRight, ChevronLeft, X, Plus } from 'lucide-react'
import './DesignSpacePanel.css'

const DesignSpacePanel = ({ isOpen, onToggle }) => {
  const [formData, setFormData] = useState({
    context: 'As a parent of a toddler, I often struggle to think of what to do over the weekend with my child. I don\'t',
    user: 'A busy parent who is often too busy during the week to plan weekend activities for their child',
    goal: 'Have fun, engaging, and educational activities with my child over the weekend.',
    tasks: ['Plan a weekend of activities for my child'],
    examples: [],
    comments: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, '']
    }))
  }

  const updateTask = (index, value) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => i === index ? value : task)
    }))
  }

  const removeTask = (index) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, '']
    }))
  }

  const updateExample = (index, value) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((example, i) => i === index ? value : example)
    }))
  }

  const removeExample = (index) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Design Space Data:', formData)
    // Handle the form submission here
  }

  return (
    <>
      <button className={`panel-toggle ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      <div className={`design-space-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-content">
          <h2>Design Space</h2>
          
          <form onSubmit={handleSubmit} className="design-space-form">
            {/* Context Section */}
            <div className="form-section">
              <label className="section-label">Context</label>
              <textarea
                name="context"
                value={formData.context}
                onChange={handleInputChange}
                className="form-textarea"
                rows="4"
              />
            </div>

            {/* User Section */}
            <div className="form-section">
              <label className="section-label">User</label>
              <textarea
                name="user"
                value={formData.user}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
              />
            </div>

            {/* Goal Section */}
            <div className="form-section">
              <label className="section-label">Goal</label>
              <textarea
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
              />
            </div>

            {/* Tasks Section */}
            <div className="form-section">
              <label className="section-label">Tasks</label>
              {formData.tasks.map((task, index) => (
                <div key={index} className="task-item">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => updateTask(index, e.target.value)}
                    className="form-input"
                    placeholder="Enter task..."
                  />
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="remove-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTask}
                className="add-link"
              >
                Add task
              </button>
            </div>

            {/* Examples Section */}
            <div className="form-section">
              <label className="section-label">Examples</label>
              {formData.examples.map((example, index) => (
                <div key={index} className="example-item">
                  <input
                    type="text"
                    value={example}
                    onChange={(e) => updateExample(index, e.target.value)}
                    className="form-input"
                    placeholder="Enter example..."
                  />
                  <button
                    type="button"
                    onClick={() => removeExample(index)}
                    className="remove-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addExample}
                className="add-link"
              >
                Add example
              </button>
            </div>

            {/* Comments Section */}
            <div className="form-section">
              <label className="section-label">Comments</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Enter comments..."
                rows="3"
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="create-btn">
              Create Design Space
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default DesignSpacePanel 