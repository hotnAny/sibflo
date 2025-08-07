import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { genOverallDesigns, genScreenDescriptions } from '../services/generationService'
// import { stateStorage } from '../services/stateStorage'
import './FloatingSliders.css'

const FloatingSliders = ({ sliders, onUpdateSlider, onDesignCreated, currentTrialId }) => {
  const [draggedSlider, setDraggedSlider] = useState(null)
  const [isCreatingDesign, setIsCreatingDesign] = useState(false)
  const [selectedSliders, setSelectedSliders] = useState(new Set())

  // Initialize selected sliders when sliders change
  useEffect(() => {
    if (sliders.length > 0) {
      // By default, select all sliders
      const initialSelected = new Set(sliders.map(slider => slider.id))
      setSelectedSliders(initialSelected)
    }
  }, [sliders])

  const handleSliderChange = (id, value) => {
    onUpdateSlider(id, parseInt(value))
  }

  const handleSliderToggle = (id) => {
    setSelectedSliders(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return newSelected
    })
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
      return []
    }

    // Only include selected sliders in the design parameters
    const selectedSlidersList = sliders.filter(slider => selectedSliders.has(slider.id))
    
    if (selectedSlidersList.length === 0) {
      return []
    }

    return selectedSlidersList.map(slider => {
      if (slider.options && Array.isArray(slider.options) && slider.options.length > 0) {
        const optionIndex = Math.min(slider.value, slider.options.length - 1)
        const selectedOption = slider.options[optionIndex]
        return {
          dimension_description: slider.dimension?.dimension_description || slider.label,
          selected_option: selectedOption?.option_name || 'Unknown',
          option_description: selectedOption?.option_description || ''
        }
      } else {
        return {
          dimension_description: slider.label,
          selected_option: slider.value.toString(),
          option_description: `Value: ${slider.value}`
        }
      }
    })
  }

  const generateDesignParametersForLogging = () => {
    if (!sliders || sliders.length === 0) {
      return []
    }

    // Only include selected sliders in the logging
    const selectedSlidersList = sliders.filter(slider => selectedSliders.has(slider.id))

    return selectedSlidersList.map(slider => {
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

    // Check if any sliders are selected
    if (selectedSliders.size === 0) {
      alert('Please select at least one design dimension before creating a design')
      return
    }

    setIsCreatingDesign(true)
    try {
      const designParametersStructured = generateDesignParameters()
      const designParametersForLogging = generateDesignParametersForLogging()
      
      // Convert structured format to string for genOverallDesigns compatibility
      // const designParametersString = designParametersStructured.map(param => 
      //   `${param.dimension_description}: ${param.selected_option}`
      // ).join(', ')
      
      // console.log('🎨 Creating design with structured parameters:', designParametersStructured)
      // console.log('🎨 Creating design with string parameters:', designParametersString)
      
      // Log the structure for debugging
      if (designParametersStructured.length > 0) {
        console.log('📋 Structured parameters breakdown:')
        designParametersStructured.forEach((param, index) => {
          console.log(`  ${index + 1}. Dimension: "${param.dimension_description}"`)
          console.log(`     Selected Option: "${param.selected_option}"`)
          console.log(`     Option Description: "${param.option_description}"`)
        })
      }
      
      const designs = await genOverallDesigns({ designParameters: designParametersStructured })
      
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
          design_parameters_structured: designParametersStructured, // Add structured format for reference
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
    <>
      <div className="floating-sliders-wrapper">
        <div className="floating-sliders">
        <div className="sliders-header">
          <h3>Design Space</h3>
          {/* {sliders.length > 0 && (
            <span className="selection-count">
              {selectedSliders.size} of {sliders.length} selected
            </span>
          )} */}
        </div>

        
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
                          <input
                            type="checkbox"
                            id={`slider-checkbox-${slider.id}`}
                            checked={selectedSliders.has(slider.id)}
                            onChange={() => handleSliderToggle(slider.id)}
                            className="slider-checkbox-input"
                            aria-label={`Select ${slider.label} design dimension`}
                          />
                        </div>
                        <div className="slider-info">
                          <span className="slider-label">{slider.label}</span>
                        </div>
                      </div>
                      
                      <div className="slider-control">
                        <div className="slider-range">
                          {slider.options && Array.isArray(slider.options) ? (
                            <div className="slider-options">
                              {slider.options.map((option, optionIndex) => (
                                <span 
                                  key={optionIndex} 
                                  className={`option-label ${optionIndex === slider.value ? 'active' : ''}`}
                                  title={option.option_description ? `${option.option_name}: ${option.option_description}` : option.option_name}
                                  onClick={() => handleSliderChange(slider.id, optionIndex)}
                                >
                                  <span>{option.option_name}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="numeric-options">
                              {Array.from({ length: slider.max - slider.min + 1 }, (_, i) => i + slider.min).map((value) => (
                                <span
                                  key={value}
                                  className={`option-label ${value === slider.value ? 'active' : ''}`}
                                  title={`${slider.label}: ${value}`}
                                  onClick={() => handleSliderChange(slider.id, value)}
                                >
                                  <span>{value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        
        {/* Fixed Create Design Button - positioned relative to main container */}
        {sliders.length > 0 && (
          <button 
            className="floating-create-design-btn"
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
        )}
        </div>
      </div>
    </>
  )
}

export default FloatingSliders 