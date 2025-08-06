import { useState, useEffect, useMemo } from 'react'
import { X, Code, ArrowLeft, ArrowRight } from 'lucide-react'
import { trialLogger } from '../services/trialLogger'
import './UIView.css'

const UIView = ({ isOpen, onClose, design, screens = [], currentTrialId }) => {
  // const [generatedCodes, setGeneratedCodes] = useState({})
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedScreen, setSelectedScreen] = useState(null)
  const [selectedDesign, setSelectedDesign] = useState(null)

  // Create a unique key for this design to scope the generatedCodes
  // const designKey = useMemo(() => {
  //   // Use the design object's existing ID directly
  //   return design?.id || 'default'
  // }, [design?.id])

  useEffect(() => {
    if (isOpen && design) {
      // Retrieve all data from the design object and trial logger
      setSelectedDesign(design)
    }
  }, [isOpen, design, currentTrialId])

  // useEffect(() => {
  //   console.log('🎯 selectedTask changed:', selectedTask)
  // }, [selectedTask])

  // Get the current design's generated codes
  // const getCurrentDesignCodes = () => {
  //   // Get codes from local state (populated by retrieveDesignData)
  //   const localCodes = generatedCodes[designKey] || []
    
  //   console.log('📊 getCurrentDesignCodes - returning codes from local state:', {
  //     designKey,
  //     codesCount: localCodes.length,
  //     hasCodes: localCodes.some(code => code)
  //   })
    
  //   return localCodes
  // }

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
    
    // console.log('🔍 getFilteredScreens called with:', {
    //   selectedTask,
    //   hasTaskScreenMapping: !!taskScreenMapping,
    //   taskScreenMapping: taskScreenMapping,
    //   screensToUseLength: screensToUse.length
    // })
    
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

    // If taskScreens is a single object with screen_id and interaction
    // if (typeof taskScreens === 'object' && taskScreens !== null) {
    //   const screenId = taskScreens.screen_id || taskScreens.id
    //   if (screenId) {
    //     const screen = screensToUse.find(s => s.screen_id === screenId || s.id === screenId)
    //     if (screen) {
    //       const filteredScreens = [{
    //         ...screen,
    //         interaction: taskScreens.interaction
    //       }]
    //       console.log('📋 Filtered screens (single object):', filteredScreens)
    //       return filteredScreens
    //     }
    //   }
    // }

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

    // // if (targetScreenIndex) {
    //   const screensToUse = design?.screens || screens
      
    //   // Try to find the original index using multiple methods
    //   let originalIndex = screensToUse.findIndex(s => 
    //     s.screen_id === targetScreen.screen_id || s.id === targetScreen.id || s === targetScreen
    //   )
      
    //   // If not found, try using the taskScreenIndex
    //   if (originalIndex === -1 && targetScreen.taskScreenIndex !== undefined) {
    //     originalIndex = targetScreen.taskScreenIndex
    //   }
      
    //   // If still not found, use 0 as fallback
    //   if (originalIndex === -1) {
    //     originalIndex = 0
    //   }
      
      setSelectedScreen({ screen: currentTaskScreens[targetScreenIndex], index: targetScreenIndex })
    }
  // }

  const deduplicateScreens = (screens) => {
    if (!screens || screens.length === 0) return screens
    
    const uniqueScreens = []
    const seenContent = new Set()
    
    console.log('🔍 Starting deduplication for', screens.length, 'screens')
    
    screens.forEach((screen, index) => {
      // Create a content hash based on screen specification, title, and ui_code
      let contentHash = ''
      
      if (screen.screen_specification) {
        contentHash += screen.screen_specification
      } else if (screen.title) {
        contentHash += screen.title
      } else {
        contentHash += `screen-${index}`
      }
      
      // Also include ui_code in the hash if available
      if (screen.ui_code) {
        contentHash += `|ui_code:${screen.ui_code.substring(0, 100)}` // Use first 100 chars of ui_code
      }
      
      console.log(`🔍 Screen ${index} content hash:`, contentHash.substring(0, 50) + '...')
      
      // If we haven't seen this content before, add it
      if (!seenContent.has(contentHash)) {
        seenContent.add(contentHash)
        uniqueScreens.push(screen)
        console.log(`✅ Screen ${index} added to unique list`)
      } else {
        console.log(`❌ Screen ${index} is a duplicate and skipped`)
      }
    })
    
    console.log('🔍 Deduplicated screens:', uniqueScreens.length, 'from', screens.length)
    return uniqueScreens
  }

  const handleTaskClick = (taskIndex) => {
    console.log('🎯 Task clicked:', taskIndex, 'Current selectedTask:', selectedTask)
    
    // Clear the selected screen when switching tasks
    setSelectedScreen(null)
    
    // Toggle the selected task (if clicking the same task, deselect it)
    if (selectedTask === taskIndex) {
      console.log('🎯 Deselecting task:', taskIndex)
      setSelectedTask(null)
    } else {
      console.log('🎯 Selecting task:', taskIndex)
      setSelectedTask(taskIndex)
    }
    
    // Force a re-render by updating a state that triggers re-render
    console.log('🎯 State update triggered for task:', taskIndex)
  }

  const handleScreenClick = (screen, index) => {
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
    return screen?.interaction_description || "User can interact with this screen to complete the task."
  }

  const getTaskDescription = (taskIndex) => {
    // Define task descriptions based on index
    const taskDescriptions = [
      "Plan a weekend of activities for my child",
      "Find educational games and activities", 
      "Schedule outdoor activities and playtime",
      "Organize creative arts and crafts sessions",
      "Plan family bonding activities"
    ]
    
    return taskDescriptions[taskIndex] || `Task ${taskIndex + 1}`
  }

  const getTasksFromTrial = () => {
    if (!currentTrialId) {
      console.warn('⚠️ No current trial ID available')
      return []
    }

    try {
      const trials = JSON.parse(localStorage.getItem('sibflo_trials') || '[]')
      const trial = trials.find(t => t.id === currentTrialId)
      
      if (trial && trial.input && trial.input.tasks) {
        console.log('📋 Retrieved tasks from trial:', trial.input.tasks)
        return trial.input.tasks
      } else {
        console.warn('⚠️ No tasks found in trial:', currentTrialId)
        return []
      }
    } catch (error) {
      console.error('❌ Error retrieving tasks from trial:', error)
      return []
    }
  }

  if (!isOpen) return null

  // Full-screen view for individual screen
  if (selectedScreen) {
    const { screen, index } = selectedScreen
    
    // Get the UI code from the screen object first, then fall back to generatedCodes
    const screenCode = screen.ui_code || ''
    
    // Debug logging
    // console.log('🎨 Full-screen view - Screen:', {
    //   screenId: screen.screen_id || screen.id,
    //   screenTitle: screen.title || screen.screen_specification,
    //   hasUiCode: !!screen.ui_code,
    //   hasGeneratedCode: !!getCurrentDesignCodes()[index],
    //   screenCodeLength: screenCode.length
    // })
    
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
      <div className="ui-view-overlay">
        <div className="ui-view-fullscreen">
          <div className="ui-view-fullscreen-header">
            <button className="ui-view-back-btn" onClick={handleBackToGrid}>
              <ArrowLeft size={16} />
              Back to Grid
            </button>
            <h2>{screenTitle}</h2>
            <button className="ui-view-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="ui-view-fullscreen-content">
            <div className="ui-view-fullscreen-svg">
              <h3>Screen Preview</h3>
              <div className="svg-render-fullscreen">
                {renderSVG(screenCode)}
              </div>
            </div>
            
            <div className="ui-view-fullscreen-panel">
              <h3>User Interaction</h3>
              <div className="interaction-description">
                <p>{getScreenInteractionDescription(screen)}</p>
              </div>
              
              {/* Navigation buttons */}
              {showNavigation && (
                <div className="screen-navigation">
                  <div className="navigation-info">
                    <span>Screen {currentScreenIndex + 1} of {currentTaskScreens.length}</span>
                  </div>
                  <div className="navigation-buttons">
                    <button 
                      className={`nav-btn nav-btn-prev ${!previousScreen ? 'nav-btn-disabled' : ''}`}
                      onClick={() => handleNavigation('previous')}
                      disabled={!previousScreen}
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>
                    <button 
                      className={`nav-btn nav-btn-next ${!nextScreen ? 'nav-btn-disabled' : ''}`}
                      onClick={() => handleNavigation('next')}
                      disabled={!nextScreen}
                    >
                      Next
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ui-view-overlay">
      <div className="ui-view">
        <div className="ui-view-header">
          <h2>Generate UI Code</h2>
          <button className="ui-view-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="ui-view-content">
          {/* Left Sidebar - Tasks */}
          <div className="ui-view-sidebar">
            <h3>Tasks</h3>
            <div className="task-list">
              {(() => {
                // Use data from design object (populated by retrieveDesignData)
                const taskScreenMapping = design?.taskScreenMapping
                
                if (taskScreenMapping) {
                  return Object.entries(taskScreenMapping).map(([taskKey, screenMapping], index) => {
                    console.log('🎯 Rendering task:', taskKey, 'with mapping:', screenMapping)
                    
                    // Get tasks from the current trial
                    const tasksFromTrial = getTasksFromTrial()
                    
                    // Get the task description for this index
                    const taskDescription = tasksFromTrial[index] || getTaskDescription(index)
                    
                    return (
                      <div 
                        key={index} 
                        className={`task-item ${selectedTask === index ? 'task-item-selected' : ''}`}
                        onClick={() => handleTaskClick(index)}
                      >
                        {taskDescription}
                      </div>
                    )
                  })
                } else {
                  return <div className="task-item">Plan a weekend of activities for my child</div>
                }
              })()}
            </div>
          </div>

          {/* Main Content - Screen Cards */}
          <div className="ui-view-main">
            <div className="screen-grid">
              {(() => {
                const filteredScreens = getFilteredScreens()
                console.log('🎨 Rendering filtered screens:', filteredScreens.length, 'for task:', selectedTask)
                
                if (filteredScreens.length > 0) {
                  return filteredScreens.map((screen, filteredIndex) => {
                    // Use screens from design.screens if available, otherwise use the screens prop
                    const screensToUse = design?.screens || screens
                    
                    // Find the original index of this screen in the screens array
                    const originalIndex = screensToUse.findIndex(s => 
                      s.screen_id === screen.screen_id || s.id === screen.id || s === screen
                    )
                    
                    // Generate a unique key using screen_id, id, or a combination
                    const uniqueKey = screen.screen_id || screen.id || `screen-${originalIndex}-${filteredIndex}`
                    
                    // Get the screen title using the screen object directly
                    const screenTitle = screen.title || 
                                      (screen.screen_specification ? 
                                        screen.screen_specification.match(/^([^:]+)/)?.[1]?.trim() : 
                                        `Screen ${filteredIndex + 1}`) || 
                                      `Screen ${filteredIndex + 1}`
                    
                    // Get the UI code directly from the screen object
                    const screenUICode = screen.ui_code || ''
                    
                    console.log(`🎨 Rendering screen: ${screenTitle} (ID: ${screen.screen_id || screen.id}), UI Code snippet:`, screenUICode ? screenUICode.substring(0, 50) + '...' : 'N/A')
                    
                    return (
                      <div 
                        key={uniqueKey} 
                        className="screen-card"
                        onClick={() => handleScreenClick(screen, originalIndex)}
                      >
                        <div className="screen-card-header">
                          <h4>{filteredIndex + 1}. {screenTitle}</h4>
                        </div>
                        <div className="screen-card-content">
                          {screenUICode ? (
                            <div className="screen-card-content-wrapper">
                              <div className="screen-card-render-section">
                                <h5>Preview</h5>
                                <div className="screen-card-render">
                                  {renderSVG(screenUICode)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="screen-card-placeholder">
                              <Code size={32} />
                              <p>No UI code generated yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                } else {
                  return (
                    <div className="no-screens-message">
                      {selectedTask ? (
                        <div>
                          <h3>No screens found for task: {getTasksFromTrial()[selectedTask] || getTaskDescription(selectedTask)}</h3>
                          <p>This task doesn't have any associated screens in the task screen mapping.</p>
                        </div>
                      ) : (
                        <div>
                          <h3>No screens available</h3>
                          <p>Select a task from the left panel to view its associated screens.</p>
                        </div>
                      )}
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UIView