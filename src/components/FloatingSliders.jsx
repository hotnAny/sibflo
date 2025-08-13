import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'
import { genOverallDesigns, genScreenDescriptions } from '../services/generationService'
// import { stateStorage } from '../services/stateStorage'
import './FloatingSliders.css'

const FloatingSliders = ({ sliders, onUpdateSlider, onDesignCreated, currentTrialId }) => {
  const [draggedSlider, setDraggedSlider] = useState(null)
  const [isCreatingDesign, setIsCreatingDesign] = useState(false)
  const [selectedSliders, setSelectedSliders] = useState(new Set())
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRefs = useRef({})

  // Initialize selected sliders when sliders change
  useEffect(() => {
    if (sliders.length > 0) {
      // By default, select all sliders
      const initialSelected = new Set(sliders.map(slider => slider.id))
      setSelectedSliders(initialSelected)
    }
  }, [sliders])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        const dropdownElement = dropdownRefs.current[openDropdown]
        if (!dropdownElement.contains(event.target)) {
          setOpenDropdown(null)
        }
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const handleSliderChange = (id, value) => {
    onUpdateSlider(id, parseInt(value))
    setOpenDropdown(null) // Close dropdown after selection
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

  const toggleDropdown = useCallback((sliderId) => {
    setOpenDropdown(openDropdown === sliderId ? null : sliderId)
  }, [openDropdown])

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
      
      // Log the structure for debugging
      // if (designParametersStructured.length > 0) {
      //   console.log('📋 Structured parameters breakdown:')
      //   designParametersStructured.forEach((param, index) => {
      //     console.log(`  ${index + 1}. Dimension: "${param.dimension_description}"`)
      //     console.log(`     Selected Option: "${param.selected_option}"`)
      //     console.log(`     Option Description: "${param.option_description}"`)
      //   })
      // }
      
      const designs = await genOverallDesigns({ designParameters: designParametersStructured })
      
      if (designs && Array.isArray(designs) && designs.length > 0) {
        // Randomly pick one of the designs
        const randomIndex = Math.floor(Math.random() * designs.length)
        const design = designs[randomIndex]
        console.log(`🎲 Randomly selected design ${randomIndex + 1} of ${designs.length} available designs`)
        
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

  // Custom dropdown component
  const CustomDropdown = ({ slider, options, value, onChange }) => {
    const isOpen = openDropdown === slider.id
    const selectedOption = options ? options[value] : { option_name: value, option_description: `Value: ${value}` }
    
    return (
      <div 
        className="custom-dropdown" 
        ref={(el) => {
          dropdownRefs.current[slider.id] = el
        }}
        activity="dropdown container for design options"
      >
        <button
          className="custom-dropdown-button"
          onClick={() => toggleDropdown(slider.id)}
          type="button"
          activity="toggle dropdown menu for design options"
        >
          <div className="dropdown-selected-content" activity="display selected dropdown design option">
            <div className="dropdown-option-heading" activity="display selected design option name">{selectedOption.option_name || selectedOption}</div>
            {selectedOption.option_description && (
              <div className="dropdown-option-subtitle" activity="display selected design ption description">{selectedOption.option_description}</div>
            )}
          </div>
          <ChevronDown size={16} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="custom-dropdown-menu" activity="dropdown menu with design options">
            {options ? (
              options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  className={`custom-dropdown-option ${optionIndex === value ? 'selected' : ''}`}
                  onClick={() => onChange(slider.id, optionIndex)}
                  type="button"
                  activity="select dropdown design option"
                >
                  <div className="dropdown-option-heading" activity="display design option name">{option.option_name}</div>
                  {option.option_description && (
                    <div className="dropdown-option-subtitle" activity="display design option description">{option.option_description}</div>
                  )}
                </button>
              ))
            ) : (
              Array.from({ length: slider.max - slider.min + 1 }, (_, i) => i + slider.min).map((optionValue) => (
                <button
                  key={optionValue}
                  className={`custom-dropdown-option ${optionValue === value ? 'selected' : ''}`}
                  onClick={() => onChange(slider.id, optionValue)}
                  type="button"
                  activity="select design option"
                >
                  <div className="dropdown-option-heading" activity="display design option">{optionValue}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="floating-sliders-wrapper" activity="design space main container">
        <div className="floating-sliders" activity="design space content area">
        <div className="sliders-header" activity="design space header section">
          <h3 activity="design space title">Design Space</h3>
          {/* {sliders.length > 0 && (
            <span className="selection-count">
              {selectedSliders.size} of {sliders.length} selected
            </span>
          )} */}
        </div>

        
          <div className="sliders-content" activity="design space content container">
            {sliders.length === 0 ? (
              <div className="no-sliders" activity="no design space message display">
                <p activity="no sliders instruction">No design space dimensions yet</p>
                <p activity="create design space instruction">Create a design space using the left panel to generate sliders</p>
              </div>
            ) : (
              <>
                <div className="sliders-list" activity="list of design space dimensions">
                  {sliders.map((slider) => (
                    <div
                      key={slider.id}
                      className="slider-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, slider)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, slider)}
                      activity="individual design space dimension item container"
                    >
                      <div className="slider-header" activity="design space dimension header with checkbox and label">
                        <div className="slider-checkbox" activity="design space dimension selection checkbox container">
                          <input
                            type="checkbox"
                            id={`slider-checkbox-${slider.id}`}
                            checked={selectedSliders.has(slider.id)}
                            onChange={() => handleSliderToggle(slider.id)}
                            className="slider-checkbox-input"
                            aria-label={`Select ${slider.label} design dimension`}
                            activity="toggle design dimension selection"
                          />
                        </div>
                        <div className="slider-info" activity="design space dimension display">
                          <span className="slider-label" activity="design space dimension label">{slider.label}</span>
                        </div>
                      </div>
                      
                      <div className="slider-control" activity="design space dimension control interface">
                        <div className="slider-range" activity="design space dimension range selection">
                          <CustomDropdown
                            slider={slider}
                            options={slider.options}
                            value={slider.value}
                            onChange={handleSliderChange}
                          />
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
            activity="create design"
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