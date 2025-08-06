import { useState, useEffect } from 'react'
import { Plus, X, Check, Sparkles } from 'lucide-react'
import { genOverallDesigns, genScreenDescriptions } from '../services/generationService'
import { stateStorage } from '../services/stateStorage'
import './FloatingSliders.css'

const FloatingSliders = ({ sliders, onUpdateSlider, onRemoveSlider, onAddSlider, onDesignCreated, currentTrialId }) => {
  // Flag to prevent saving state before loading initial state
  const [isSlidersStateLoaded, setIsSlidersStateLoaded] = useState(false)
  
  // Initialize state with default value, will be overridden by useEffect
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [draggedSlider, setDraggedSlider] = useState(null)
  const [isCreatingDesign, setIsCreatingDesign] = useState(false)

  // Load sliders state from localStorage on component mount
  useEffect(() => {
    const savedState = stateStorage.loadSlidersState()
    if (savedState) {
      setIsCollapsed(savedState.isCollapsed)
      console.log('🔄 Sliders state restored from localStorage')
    }
    // Mark state as loaded to enable saving
    setIsSlidersStateLoaded(true)
  }, [])

  // Save sliders state to localStorage whenever isCollapsed changes (but only after initial load)
  useEffect(() => {
    if (!isSlidersStateLoaded) {
      console.log('⏳ Skipping sliders state save - initial state not loaded yet')
      return
    }
    
    const currentState = {
      isCollapsed
    }
    stateStorage.saveSlidersState(currentState)
  }, [isSlidersStateLoaded, isCollapsed])

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

  const generateDesignParameters = () => {
    if (!sliders || sliders.length === 0) {
      return "No design parameters available"
    }

    const parameters = sliders.map(slider => {
      if (slider.options && Array.isArray(slider.options) && slider.options.length > 0) {
        const optionIndex = Math.min(slider.value, slider.options.length - 1)
        const selectedOption = slider.options[optionIndex]
        return `${slider.label}: ${selectedOption?.option_name || 'Unknown'}`
      } else {
        return `${slider.label}: ${slider.value}`
      }
    })

    return parameters.join(', ')
  }

  const generateDesignParametersForLogging = () => {
    if (!sliders || sliders.length === 0) {
      return []
    }

    return sliders.map(slider => {
      if (slider.options && Array.isArray(slider.options) && slider.options.length > 0) {
        const optionIndex = Math.min(slider.value, slider.options.length - 1)
        const selectedOption = slider.options[optionIndex]
        return {
          dimension_description: slider.dimension?.dimension_description || slider.label,
          selected_parameter: selectedOption?.option_name || 'Unknown',
          parameter_description: selectedOption?.option_description || ''
        }
      } else {
        return {
          dimension_description: slider.label,
          selected_parameter: slider.value.toString(),
          parameter_description: `Value: ${slider.value}`
        }
      }
    })
  }

  const handleCreateDesign = async () => {
    if (sliders.length === 0) {
      alert('Please create a design space first')
      return
    }

    setIsCreatingDesign(true)
    try {
      const designParameters = generateDesignParameters()
      const designParametersForLogging = generateDesignParametersForLogging()
      console.log('🎨 Creating design with parameters:', designParameters)
      
      const designs = await genOverallDesigns({ designParameters })
      
      if (designs && Array.isArray(designs) && designs.length > 0) {
        const design = designs[0] // Take the first design
        
        // Generate screen descriptions and task screen mapping
        let screenDescriptions = []
        let taskScreenMapping = {}
        
        try {
          console.log('📝 Generating screen descriptions for design:', design)
          const screenResult = await genScreenDescriptions({
            overallDesign: design,
            tasks: currentTrialId ? getTasksFromTrial(currentTrialId) : ['Default task']
          })
          
          if (screenResult && screenResult.screenDescriptions) {
            screenDescriptions = screenResult.screenDescriptions
            taskScreenMapping = screenResult.taskScreenMapping || {}
            console.log('📝 Generated screen descriptions:', screenDescriptions)
            console.log('📝 Generated task screen mapping:', taskScreenMapping)
          }
        } catch (screenError) {
          console.warn('⚠️ Failed to generate screen descriptions:', screenError)
          // Continue with design creation even if screen descriptions fail
        }
        
        // Enhance the design object with additional information for logging
        const enhancedDesign = {
          ...design,
          design_parameters: designParametersForLogging,
          screens: screenDescriptions,
          taskScreenMapping: taskScreenMapping
        }
        
        console.log('🎨 Generated enhanced design:', enhancedDesign)
        
        if (onDesignCreated) {
          onDesignCreated(enhancedDesign)
        }
      } else {
        throw new Error('No designs were generated')
      }
    } catch (error) {
      console.error('❌ Error creating design:', error)
      alert(`Failed to create design: ${error.message}`)
    } finally {
      setIsCreatingDesign(false)
    }
  }

  // Helper function to get tasks from the current trial
  const getTasksFromTrial = (trialId) => {
    try {
      const trials = JSON.parse(localStorage.getItem('sibflo_trials') || '[]')
      const trial = trials.find(t => t.id === trialId)
      return trial?.input?.tasks || ['Default task']
    } catch (error) {
      console.warn('⚠️ Failed to get tasks from trial:', error)
      return ['Default task']
    }
  }

  return (
    <div className={`floating-sliders ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sliders-header">
        <h3>Design Space</h3>
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
              <p>No design space dimensions yet</p>
              <p>Create a design space using the left panel to generate sliders</p>
            </div>
          ) : (
            <>
              <div className="sliders-list">
                {sliders.map((slider) => (
                  <div
                    key={slider.id}
                    className="slider-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, slider)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slider)}
                  >
                    <div className="slider-header">
                      <div className="slider-checkbox">
                        <Check size={14} />
                      </div>
                      <div className="slider-info">
                        <span className="slider-label">{slider.label}</span>
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
                        {slider.options && Array.isArray(slider.options) ? (
                          <div className="slider-options">
                            {slider.options.map((option, optionIndex) => (
                              <span 
                                key={optionIndex} 
                                className={`option-label ${optionIndex === slider.value ? 'active' : ''}`}
                                title={option.option_description || option.option_name}
                              >
                                {option.option_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <>
                            <span>{slider.min}</span>
                            <span>{slider.max}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="create-design-section">
                <button 
                  className="create-design-btn"
                  onClick={handleCreateDesign}
                  disabled={isCreatingDesign || sliders.length === 0}
                >
                  {isCreatingDesign ? (
                    <>
                      <div className="spinner"></div>
                      Creating Design...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Create Design
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FloatingSliders 