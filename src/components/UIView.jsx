import { useState, useEffect } from 'react'
import { X, Code, ArrowLeft, ArrowRight } from 'lucide-react'
import { stateStorage } from '../services/stateStorage'
import './UIView.css'

const UIView = ({ isOpen, onClose, design, screens = [], currentTrialId, onDesignUpdate }) => {
  // Flag to prevent saving state before loading initial state
  const [isUIViewStateLoaded, setIsUIViewStateLoaded] = useState(false)
  
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedScreen, setSelectedScreen] = useState(null)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qualityMode, setQualityMode] = useState('fast') // 'fast' or 'high'
  const [cardZIndices, setCardZIndices] = useState({}) // Track z-index for each card

  // Internal function to generate UI codes and update design
  const generateUICodes = async (designToUpdate, qualityModeToUse = 'fast') => {
    // console.log('🎨 Starting UI code generation for design:', designToUpdate, 'with quality mode:', qualityModeToUse)
    
    // Check if design has screens
    const screensToUse = designToUpdate.screens || []
    if (!screensToUse || screensToUse.length === 0) {
      throw new Error('No screens available for UI code generation')
    }

    try {
      // Import the generation service
      const { genUICodesStreaming } = await import('../services/generationService')
      
      // Generate UI codes
      const screenDescriptions = screensToUse.map(screen => {
        if (typeof screen === 'string') {
          return { screen_specification: screen }
        }
        return screen
      })
      
      // Create a function to update individual screens as they're generated
      const updateScreenWithCode = (screenIndex, uiCode) => {
        setSelectedDesign(prevDesign => {
          if (!prevDesign) return prevDesign
          
          const updatedScreens = [...(prevDesign.screens || [])]
          if (updatedScreens[screenIndex]) {
            updatedScreens[screenIndex] = {
              ...updatedScreens[screenIndex],
              ui_code: uiCode
            }
          }
          
          const updatedDesign = {
            ...prevDesign,
            screens: updatedScreens
          }
          
          // console.log(`🎨 Updated screen ${screenIndex + 1} with UI code:`, {
          //   screenIndex,
          //   uiCodeSnippet: uiCode ? uiCode.substring(0, 50) + '...' : 'N/A'
          // })
          
          // Save the updated design to the design object
          if (onDesignUpdate) {
            onDesignUpdate(updatedDesign)
          }
          
          return updatedDesign
        })
      }
      
      const generatedUICodes = await genUICodesStreaming({
        screenDescriptions: screenDescriptions,
        critiques: [],
        qualityMode: qualityModeToUse,
        onProgress: (codes, index, code) => {
          // console.log(`📝 Progress: Screen ${index + 1} code generated (${qualityModeToUse} mode)`)
          // Update the UI immediately when a screen's code is generated
          if (code && !code.startsWith('Error:')) {
            updateScreenWithCode(index, code)
          }
        }
      })

      // console.log('✅ UI code generation completed:', generatedUICodes, 'using', qualityModeToUse, 'mode')
      
      // Final update to ensure all codes are properly set
      if (generatedUICodes && generatedUICodes.length > 0) {
        const updatedDesign = {
          ...designToUpdate,
          screens: screensToUse.map((screen, index) => ({
            ...screen,
            ui_code: generatedUICodes[index] || ''
          }))
        }
        
        // console.log('🎨 Final design update with UI codes:', {
        //   designId: updatedDesign.id,
        //   screensCount: updatedDesign.screens?.length || 0,
        //   uiCodesCount: updatedDesign.screens?.filter(screen => screen.ui_code).length || 0,
        //   qualityMode: qualityModeToUse,
        //   uiCodesSnippets: updatedDesign.screens?.map(screen => 
        //     screen.ui_code ? screen.ui_code.substring(0, 50) + '...' : 'N/A'
        //   ) || []
        // })
        
        // Update the selectedDesign state to trigger final re-render
        setSelectedDesign(updatedDesign)
        
        // Save the final updated design to the design object
        if (onDesignUpdate) {
          onDesignUpdate(updatedDesign)
        }
        
        return updatedDesign
      } else {
        throw new Error('No UI codes were generated')
      }
    } catch (error) {
      console.error('❌ Error generating UI codes:', error)
      throw error
    }
  }

  

  // Load UIView state when component opens or design changes
  useEffect(() => {
    if (isOpen && design) {
      // Always update selectedDesign when design prop changes
      setSelectedDesign(design)
      
      // Load saved UIView state for this specific design (only on initial load)
      const designId = design.id || design.design_name || 'default'
      const savedState = stateStorage.loadUIViewState(designId)
      if (savedState && !isUIViewStateLoaded) {
        setSelectedTask(savedState.selectedTask)
        setSelectedScreen(savedState.selectedScreen)
        // console.log('🔄 UIView state restored from localStorage')
      }
      
      // Mark state as loaded to enable saving
      setIsUIViewStateLoaded(true)
      
      // console.log('🔄 UIView updated with design data:', {
      //   designId: design.id,
      //   screensCount: design.screens?.length || 0,
      //   uiCodesCount: design.screens?.filter(screen => screen.ui_code).length || 0
      // })
    } else {
      // Reset state when closing
      setIsUIViewStateLoaded(false)
      setSelectedTask(null)
      setSelectedScreen(null)
      setSelectedDesign(null)
    }
  }, [isOpen, design, currentTrialId])

  // Save UIView state to localStorage whenever relevant state changes
  useEffect(() => {
    if (!isUIViewStateLoaded || !isOpen || !design) {
      // console.log('⏳ Skipping UIView state save - not ready yet')
      return
    }
    
    const designId = design.id || design.design_name || 'default'
    const currentState = {
      selectedTask,
      selectedScreen,
      designId
    }
    stateStorage.saveUIViewState(currentState)
  }, [isUIViewStateLoaded, isOpen, design, selectedTask, selectedScreen])

  // Add your mounted code here
  useEffect(() => {
    if (isOpen && design && isUIViewStateLoaded) {
      
      // Auto-select the first task if no task is currently selected
      if (selectedTask === null) {
        setSelectedTask(0)
      }
      
      // Example: Initialize analytics, set up event listeners, etc.
      // Your mounted code goes here
    }
  }, [isOpen, design, isUIViewStateLoaded, selectedTask])

  const getScreenTitle = (index) => {
    // Use screens from design.screens if available, otherwise use the screens prop
    const screensToUse = design?.screens || screens
    
    if (screensToUse[index] && screensToUse[index].screen_specification) {
      // Extract title from screen specification or use default
      const spec = screensToUse[index].screen_specification
      const titleMatch = spec.match(/^([^:]+)/)
      return titleMatch ? titleMatch[1].trim() : `Screen ${index + 1}`
    }
    
    // If screen has a title property, use it
    if (screensToUse[index] && screensToUse[index].title) {
      return screensToUse[index].title
    }
    
    return `Screen ${index + 1}`
  }

  const renderSVG = (svgCode) => {
    if (!svgCode || svgCode.startsWith('Error:')) {
      return null
    }

    try {
      // Extract SVG content from the code
      const svgMatch = svgCode.match(/<svg[^>]*>[\s\S]*<\/svg>/i)
      if (svgMatch) {
        const svgContent = svgMatch[0]
        return (
          <div 
            className="svg-render"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            activity="render SVG content from generated UI code"
          />
        )
      }
      return null
    } catch (error) {
      console.error('Error rendering SVG:', error)
      return null
    }
  }

  const getFilteredScreens = () => {
    if (!selectedDesign) return []
    
    // Use data from design object (populated by retrieveDesignData)
    const screensToUse = selectedDesign.screens
    const taskScreenMapping = selectedDesign.taskScreenMapping
    
    // If no task is selected, return deduplicated screens
    if (selectedTask == null) {
      // console.log('📋 No task selected, showing deduplicated screens')
      return screensToUse
    }

    // Use the numeric index to access taskScreenMapping
    const taskScreens = taskScreenMapping[selectedTask]?.screens
    // console.log('🔍 Task filtering:', { selectedTask, taskScreens, taskScreenMapping: taskScreenMapping })
    
    if (!taskScreens) {
      console.log('⚠️ No screens found for task:', selectedTask)
      return []
    }

    // If taskScreens is an array of objects with screen_id and interaction properties
    if (Array.isArray(taskScreens)) {
      const filteredScreens = taskScreens.map(taskScreen => {
        // Extract screen_id from the taskScreen object
        const screenId = taskScreen.screen_id
        
        if (screenId == undefined) {
          console.log('⚠️ TaskScreen object missing screen_id:', taskScreen)
          return null
        }
        
        // Find screen by screen_id
        const screen = screensToUse[screenId] //.find(s => s.screen_id === screenId || s.id === screenId)
        if (!screen) {
          console.log('⚠️ Screen not found for screenId:', screenId)
          return null
        }
        
        // Add the interaction information to the screen object
        return {
          ...screen,
          interaction: taskScreen.interaction
        }
      }).filter(Boolean)
      
      // console.log('📋 Filtered screens (array of objects):', filteredScreens)
      return filteredScreens
    }

    console.log('⚠️ Unknown taskScreens format:', typeof taskScreens, taskScreens)
    return []
  }

  // Get the current task's screens for navigation
  const getCurrentTaskScreens = () => {
    if (selectedTask == null) {
      return []
    }
    
    // Use data from design object (populated by retrieveDesignData)
    const taskScreenMapping = selectedDesign?.taskScreenMapping
    const screensToUse = selectedDesign?.screens
    
    if (!taskScreenMapping) {
      return []
    }

    const taskScreens = taskScreenMapping[selectedTask]?.screens
    if (!taskScreens || !Array.isArray(taskScreens)) {
      return []
    }

    return taskScreens.map((taskScreen, index) => {
      const screenId = taskScreen.screen_id
      if (screenId == undefined) return null
      
      const screen = screensToUse[screenId]
      if (!screen) return null
      
      // Get the UI code from the screen object or from generatedCodes
      const uiCode = screen.ui_code || ''
      
      return {
        ...screen,
        ui_code: uiCode, // Ensure ui_code is included
        interaction: taskScreen.interaction,
        taskScreenIndex: screenId,
        taskScreenArrayIndex: index
      }
    }).filter(Boolean)
  }

  // Navigate to next or previous screen
  const handleNavigation = (direction) => {
    const currentTaskScreens = getCurrentTaskScreens()
    if (currentTaskScreens.length === 0) return

    const currentScreenIndex = selectedScreen.index

    let targetScreenIndex = currentScreenIndex
    // currentTaskScreens
    
    if (direction === 'next' && currentScreenIndex !== -1 && currentScreenIndex < currentTaskScreens.length - 1) {
      targetScreenIndex = currentScreenIndex + 1
    } else if (direction === 'previous' && currentScreenIndex > 0) {
      targetScreenIndex = currentScreenIndex - 1
    }
      
      setSelectedScreen({ screen: currentTaskScreens[targetScreenIndex], index: targetScreenIndex })
    }
  // }

  const handleTaskClick = (taskIndex) => {
    // console.log('🎯 Task clicked:', taskIndex, 'Current selectedTask:', selectedTask)
    
    // Clear the selected screen when switching tasks
    setSelectedScreen(null)
    
    // Toggle the selected task (if clicking the same task, deselect it)
    if (selectedTask === taskIndex) {
      // console.log('🎯 Deselecting task:', taskIndex)
      setSelectedTask(null)
    } else {
      // console.log('🎯 Selecting task:', taskIndex)
      setSelectedTask(taskIndex)
    }
    
    // Force a re-render by updating a state that triggers re-render
    console.log('🎯 State update triggered for task:', taskIndex)
  }

  const handleScreenClick = (screen, index) => {
    // Generate a unique card ID for z-index management
    const cardId = screen.screen_id || screen.id || `screen-${index}`
    
    setCardZIndices(prev => {
      const newZIndices = { ...prev }
      
      // If this card is already selected (has a z-index), deselect it
      if (newZIndices[cardId] !== undefined) {
        // console.log(`🎯 Deselecting card: ${cardId}`)
        delete newZIndices[cardId]
        // console.log('📊 Updated z-indices:', newZIndices)
        return newZIndices
      }
      
      // If selecting a new card
      // console.log(`🎯 Selecting card: ${cardId}`)
      // console.log('📊 Previous z-indices:', newZIndices)
      
      // 1. Reduce z-index of all other cards by 1
      Object.keys(newZIndices).forEach(id => {
        newZIndices[id] = Math.max(0, newZIndices[id] - 1)
      })
      
      // 2. Find the maximum z-index among remaining cards
      const maxZIndex = Object.values(newZIndices).length > 0 
        ? Math.max(...Object.values(newZIndices)) 
        : 0
      
      // 3. Set the selected card's z-index to max + 1
      newZIndices[cardId] = maxZIndex + 1
      
      // console.log('📊 Updated z-indices:', newZIndices)
      return newZIndices
    })
    
    setSelectedScreen({ screen, index })
  }

  const handleBackToGrid = () => {
    setSelectedScreen(null)
  }

  const getScreenInteractionDescription = (screen) => {
    // Use the interaction data from the screen object if available
    if (screen?.interaction) {
      return screen.interaction
    }
    
    // Fallback to interaction_description or default message
    return screen?.interaction_description || "Select a task to see how a user can interact with this screen"
  }

  // const getTaskDescription = (taskIndex) => {
  //   // Define task descriptions based on index
  //   const taskDescriptions = [
  //     "Plan a weekend of activities for my child",
  //     "Find educational games and activities", 
  //     "Schedule outdoor activities and playtime",
  //     "Organize creative arts and crafts sessions",
  //     "Plan family bonding activities"
  //   ]
    
  //   return taskDescriptions[taskIndex] || `Task ${taskIndex + 1}`
  // }

  // Helper function to get tasks from the current trial
  const getTasksFromTrial = () => {
    try {
      const trials = JSON.parse(localStorage.getItem('sibflo_trials') || '[]')
      const trial = trials.find(t => t.id === currentTrialId)
      return trial?.input?.tasks || ['Default task']
    } catch (error) {
      console.warn('⚠️ Failed to get tasks from trial:', error)
      return ['Default task']
    }
  }

  // Handle Generate UI button click
  const handleGenerateUI = async () => {
    if (!design) {
      alert('No design available for UI generation')
      return
    }

    setIsGenerating(true)
    
    try {
      if(selectedScreen === null) {
        // Use the internal generateUICodes function
        const updatedDesign = await generateUICodes(design, qualityMode)
        if (onDesignUpdate) {
          onDesignUpdate(updatedDesign)
        }
      } else {
        // console.log('🎯 Selected screen:', selectedScreen)
        const { generateSingleScreenUI } = await import('../services/generationService')
        const updatedUICode = await generateSingleScreenUI(selectedScreen.screen, qualityMode)
        // console.log('🎯 Updated UICode:', updatedUICode)
        
        // Update the screen's UI code in the design object
        if (updatedUICode && selectedDesign) {
          const { screen, index } = selectedScreen
          
          // Find the screen in the design and update its UI code
          const updatedDesign = {
            ...selectedDesign,
            screens: selectedDesign.screens.map((designScreen, screenIndex) => {
              // Check if this is the screen we want to update
              if (screenIndex === index) {
                return {
                  ...designScreen,
                  ui_code: updatedUICode
                }
              }
              return designScreen
            })
          }
          
          // Update the local state to trigger re-render
          setSelectedDesign(updatedDesign)
          
          // Update the selectedScreen to reflect the new UI code
          setSelectedScreen({
            ...selectedScreen,
            screen: {
              ...screen,
              ui_code: updatedUICode
            }
          })
          
          // Persist the changes to the parent component
          if (onDesignUpdate) {
            onDesignUpdate(updatedDesign)
          }
          
          // console.log('🎯 Screen UI code updated successfully')
        }
      }
    } catch (error) {
      console.error('Error generating UI:', error)
      alert(`Failed to generate UI: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  // Full-screen view for individual screen
  if (selectedScreen) {
    const { screen, index } = selectedScreen
    
    // Get the UI code from the screen object first, then fall back to generatedCodes
    const screenCode = screen.ui_code || ''
    
    // Get current task screens and calculate navigation state
    const currentTaskScreens = getCurrentTaskScreens()
    const currentScreenIndex = selectedScreen.index
    
    // Calculate next and previous screens based on current position
    const nextScreen = currentScreenIndex !== -1 && currentScreenIndex < currentTaskScreens.length - 1 
      ? currentTaskScreens[currentScreenIndex + 1] 
      : null
    const previousScreen = currentScreenIndex > 0 
      ? currentTaskScreens[currentScreenIndex - 1] 
      : null
    
    // Only show navigation if we're in a task context and have multiple screens
    const showNavigation = selectedTask !== null && currentTaskScreens.length > 1 && currentScreenIndex !== -1
    
    // Get the screen title from the screen object or use the index
    const screenTitle = screen.title || 
                       (screen.screen_specification ? 
                         screen.screen_specification.match(/^([^:]+)/)?.[1]?.trim() : 
                         getScreenTitle(index)) || 
                       getScreenTitle(index)
    
    return (
      <div className="ui-view-overlay" activity="UI view fullscreen overlay">
        <div className="ui-view-fullscreen" activity="UI view fullscreen container">
          <div className="ui-view-fullscreen-header" activity="fullscreen header with navigation buttons">
            <button className="ui-view-back-btn" onClick={handleBackToGrid} activity="return to screen grid view">
              <ArrowLeft size={20} />
            </button>
            
            <button className="ui-view-close" onClick={onClose} disabled={isGenerating} activity="close UI view">
              <X size={20} />
            </button>
          </div>
          
          <div className="ui-view-fullscreen-content" activity="fullscreen content area">
            {/* Left Sidebar - Tasks (always visible) */}
            <div className="ui-view-sidebar" activity="tasks sidebar navigation">
              <h3 activity="tasks section title">Tasks</h3>
              <div className="task-list" activity="list of available tasks">
                {(() => {
                  // Use data from design object (populated by retrieveDesignData)
                  const taskScreenMapping = design?.taskScreenMapping
                  
                  if (taskScreenMapping) {
                    return Object.entries(taskScreenMapping).map(([, ], index) => {
                      // console.log('🎯 Rendering task:', index, 'with mapping:', taskScreenMapping[index])
                      
                      // Get tasks from the current trial
                      const tasksFromTrial = getTasksFromTrial()
                      
                      // Get the task description for this index
                      const taskDescription = tasksFromTrial[index]
                      
                      return (
                        <div 
                          key={index} 
                          className={`task-item ${selectedTask === index ? 'task-item-selected' : ''}`}
                          onClick={() => handleTaskClick(index)}
                          activity="select task for screen filtering"
                        >
                          {taskDescription}
                        </div>
                      )
                    })
                  } else {
                    return <div className="task-item" activity="default task placeholder">Plan a weekend of activities for my child</div>
                  }
                })()}
              </div>
            </div>

            <div className="ui-view-fullscreen-main" activity="fullscreen main content area">
              <div className="ui-view-fullscreen-svg" activity="fullscreen SVG rendering area">
                <div className="svg-render-fullscreen" activity="fullscreen SVG content display">
                  {renderSVG(screenCode)}
                </div>
              </div>
              
              <div className="ui-view-fullscreen-panel" activity="fullscreen screen information panel">
                <h3 activity="screen title display">{screenTitle}</h3>
                <p className='' style={{color: 'black', minHeight: '150px'}} activity="screen interaction description">{getScreenInteractionDescription(screen)}</p>
                
                {/* Navigation buttons */}
                {showNavigation && (
                  <div className="screen-navigation" activity="screen navigation controls">
                    <div className="navigation-info" activity="screen navigation information">
                      <span activity="current screen position indicator">Screen {currentScreenIndex + 1} of {currentTaskScreens.length}</span>
                    </div>
                    <div className="navigation-buttons" activity="screen navigation button container">
                      <button 
                        className={`nav-btn nav-btn-prev ${!previousScreen ? 'nav-btn-disabled' : ''}`}
                        onClick={() => handleNavigation('previous')}
                        disabled={!previousScreen}
                        activity="navigate to previous screen"
                      >
                        <ArrowLeft size={16} />
                        Previous
                      </button>
                      <button 
                        className={`nav-btn nav-btn-next ${!nextScreen ? 'nav-btn-disabled' : ''}`}
                        onClick={() => handleNavigation('next')}
                        disabled={!nextScreen}
                        activity="navigate to next screen"
                      >
                        Next
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Generate UI Button and Quality Dropdown - positioned at lower left in fullscreen view */}
            <div className="ui-view-generate-controls" activity="UI generation controls in fullscreen view">
              <select
                className="ui-view-quality-dropdown"
                value={qualityMode}
                onChange={(e) => setQualityMode(e.target.value)}
                disabled={isGenerating}
                activity="select UI generation quality mode"
              >
                <option value="fast" activity="fast generation mode option">Fast</option>
                <option value="high" activity="high quality generation mode option">HQ</option>
              </select>
              
              <button 
                className="ui-view-generate-btn"
                onClick={handleGenerateUI}
                disabled={isGenerating}
                activity="generate UI code for current screen"
              >
                {isGenerating ? (
                  <>
                    <div className="spinner" activity="generation loading spinner"></div>
                    Generating ...
                  </>
                ) : (
                  <>
                    <Code size={16} style={{ color: 'white' }} />
                    Generate UI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ui-view-overlay" activity="UI view main overlay">
      <div className="ui-view" activity="UI view main container">
        <div className="ui-view-header" activity="UI view header section">
          <h3 activity="design name display">{design?.design_name}</h3>
          <button className="ui-view-close" onClick={onClose} disabled={isGenerating} activity="close UI view">
            <X size={20} />
          </button>
        </div>
        
        <div className="ui-view-content" activity="UI view main content area">
          {/* Left Sidebar - Tasks */}
          <div className="ui-view-sidebar" activity="tasks sidebar for screen filtering">
            <h3 activity="tasks section title">Tasks</h3>
            <div className="task-list" activity="list of available tasks">
              {(() => {
                // Use data from design object (populated by retrieveDesignData)
                const taskScreenMapping = design?.taskScreenMapping
                
                if (taskScreenMapping) {
                  return Object.entries(taskScreenMapping).map(([, ], index) => {
                    // console.log('🎯 Rendering task:', index, 'with mapping:', taskScreenMapping[index])
                    
                    // Get tasks from the current trial
                    const tasksFromTrial = getTasksFromTrial()
                    
                    // Get the task description for this index
                    const taskDescription = tasksFromTrial[index]
                    
                    return (
                      <div 
                        key={index} 
                        className={`task-item ${selectedTask === index ? 'task-item-selected' : ''}`}
                        onClick={() => handleTaskClick(index)}
                        activity="select task to filter screens"
                      >
                        {taskDescription}
                      </div>
                    )
                  })
                } else {
                  return <div className="task-item" activity="default task placeholder">Plan a weekend of activities for my child</div>
                }
              })()}
            </div>
          </div>

          {/* Main Content - Screen Cards */}
          <div className="ui-view-main" activity="main content area for screen cards">
            <div 
              className="screen-grid"
              onClick={(e) => {
                // If clicking on the grid container (not on a card), deselect any selected card
                if (e.target === e.currentTarget) {
                  setCardZIndices({}) // Clear all z-indices
                }
              }}
              activity="screen grid container for displaying screen cards"
            >
              {(() => {
                const filteredScreens = getFilteredScreens()
                // console.log('🎨 Rendering filtered screens:', filteredScreens.length, 'for task:', selectedTask)
                
                if (filteredScreens.length > 0) {
                  return filteredScreens.map((screen, filteredIndex) => {
                    // Use screens from selectedDesign to get the most up-to-date data including UI codes
                    const screensToUse = selectedDesign?.screens || screens
                    
                    // Find the original index of this screen in the screens array
                    const originalIndex = screensToUse.findIndex(s => 
                      // s.screen_id === screen.screen_id || s.id === screen.id || s === screen
                      s.title === screen.title
                    )
                    
                    // Generate a unique key using screen_id, id, or a combination
                    const uniqueKey = screen.screen_id || screen.id || `screen-${originalIndex}-${filteredIndex}`
                    
                    // Get the screen title using the screen object directly
                    const screenTitle = screen.title || 
                                      (screen.screen_specification ? 
                                        screen.screen_specification.match(/^([^:]+)/)?.[1]?.trim() : 
                                        `Screen ${filteredIndex + 1}`) || 
                                      `Screen ${filteredIndex + 1}`
                    
                    // Get the UI code directly from the screen object (from selectedDesign)
                    const screenUICode = screen.ui_code || ''
                    
                    // console.log(`🎨 Rendering screen: ${screenTitle} (ID: ${screen.screen_id || screen.id}), UI Code snippet:`, screenUICode ? screenUICode.substring(0, 50) + '...' : 'N/A')
                    
                    // Generate card ID for z-index management
                    const cardId = screen.screen_id || screen.id || `screen-${originalIndex}`
                    const cardZIndex = cardZIndices[cardId]
                    const isSelected = cardZIndex !== undefined // Check if z-index is set
                    
                    return (
                      <div 
                        key={uniqueKey} 
                        className={`screen-card ${isSelected ? 'screen-card-selected' : ''}`}
                        onClick={() => handleScreenClick(screen, originalIndex)}
                        style={{ zIndex: cardZIndex || 'auto' }} // Apply z-index or auto if not set
                        activity="individual screen card with selection functionality"
                      >
                        <div className="screen-card-header" activity="screen card header section">
                          <h4 activity="screen card title">
                            {filteredIndex + 1}. {screenTitle}
                          </h4>
                        </div>
                        <div className="screen-card-content" activity="screen card content area">
                          {screenUICode ? (
                            <div className="screen-card-content-wrapper" activity="screen card content wrapper">
                              <div className="screen-card-render-section" activity="screen card render section">
                                <div className="screen-card-render" activity="screen card SVG render area">
                                  {renderSVG(screenUICode)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="screen-card-placeholder" activity="screen card placeholder when no UI code">
                              <Code size={32} />
                              <p activity="no UI code message">No UI code generated yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                } else {
                  return (
                    <div className="no-screens-message" activity="no screens available message">
                      {selectedTask ? (
                        <div activity="no screens for selected task message">
                          <h3 activity="no screens title">No screens found for task: {getTasksFromTrial()[selectedTask]}</h3>
                          <p activity="no screens explanation">This task doesn't have any associated screens in the task screen mapping.</p>
                        </div>
                      ) : (
                        <div activity="no screens general message">
                          <h3 activity="no screens general title">No screens available</h3>
                          <p activity="select task instruction">Select a task from the left panel to view its associated screens.</p>
                        </div>
                      )}
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>
        
        {/* Generate UI Button and Quality Dropdown - positioned at lower left */}
        <div className="ui-view-generate-controls" activity="UI generation controls in grid view">
          <select
            className="ui-view-quality-dropdown"
            value={qualityMode}
            onChange={(e) => setQualityMode(e.target.value)}
            disabled={isGenerating}
            activity="select UI generation quality mode"
          >
            <option value="fast" activity="fast generation mode option">Fast</option>
            <option value="high" activity="high quality generation mode option">HQ</option>
          </select>
          
          <button 
            className="ui-view-generate-btn"
            onClick={handleGenerateUI}
            disabled={isGenerating}
            activity="generate UI code for all screens"
          >
            {isGenerating ? (
              <>
                <div className="spinner" activity="generation loading spinner"></div>
                Generating ...
              </>
            ) : (
              <>
                <Code size={16} style={{ color: 'white' }} />
                Generate UI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UIView