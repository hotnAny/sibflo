import { useState, useEffect, useCallback } from 'react'
import './App.css'
import Canvas from './components/Canvas'
import FloatingSliders from './components/FloatingSliders'
import LeftPanel from './components/LeftPanel'
import { trialLogger } from './services/trialLogger'
import { stateStorage } from './services/stateStorage'

function App() {
  // Flag to prevent saving state before loading initial state
  const [isStateLoaded, setIsStateLoaded] = useState(false)
  
  // Initialize states with default values, will be overridden by useEffect
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [sliders, setSliders] = useState([]) // Start with empty sliders until design space is created
  const [designCards, setDesignCards] = useState([])
  const [currentTrialId, setCurrentTrialId] = useState(null)
  const [shouldClosePanel, setShouldClosePanel] = useState(false)

  // Helper function to determine if we have a valid design space
  const hasValidDesignSpace = useCallback(() => {
    // A valid design space exists when:
    // 1. We have a current trial ID (indicating a design space was generated)
    // 2. AND we have sliders with dimension properties (not just default sliders)
    return currentTrialId && sliders.some(slider => slider.dimension)
  }, [currentTrialId, sliders])

  // Effect to close panel after design space generation
  useEffect(() => {
    if (shouldClosePanel && leftPanelOpen) {
      setLeftPanelOpen(false)
      setShouldClosePanel(false)
    }
  }, [shouldClosePanel, leftPanelOpen])

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = stateStorage.loadAppState()
    if (savedState) {
      setLeftPanelOpen(savedState.leftPanelOpen)
      setSliders(savedState.sliders)
      setDesignCards(savedState.designCards)
      setCurrentTrialId(savedState.currentTrialId)
      console.log('🔄 App state restored from localStorage')
    }
    // Mark state as loaded to enable saving
    setIsStateLoaded(true)
  }, [])

  // Save state to localStorage whenever relevant state changes (but only after initial load)
  useEffect(() => {
    if (!isStateLoaded) {
      console.log('⏳ Skipping state save - initial state not loaded yet')
      return
    }
    
    // Only save state if we have a valid design space, otherwise save minimal state
    const currentState = {
      leftPanelOpen,
      sliders: hasValidDesignSpace() ? sliders : [], // Don't save default sliders
      designCards,
      currentTrialId: hasValidDesignSpace() ? currentTrialId : null // Clear trial ID if no valid design space
    }
    stateStorage.saveAppState(currentState)
  }, [isStateLoaded, leftPanelOpen, sliders, designCards, currentTrialId, hasValidDesignSpace])

  const toggleLeftPanel = () => setLeftPanelOpen(!leftPanelOpen)



  const updateSlider = (id, value) => {
    setSliders(sliders.map(slider => 
      slider.id === id ? { ...slider, value } : slider
    ))
  }

  const removeSlider = (id) => {
    setSliders(sliders.filter(slider => slider.id !== id))
  }

  const handleDesignSpaceGenerated = (newSliders, trialId) => {
    // Replace existing sliders with the new design space sliders
    setSliders(newSliders)
    setCurrentTrialId(trialId)
    console.log('📊 Design space generated for trial:', trialId)
    
    // Debug: Log current trial
    const trial = trialLogger.getTrial(trialId)
    if (trial) {
      console.log('📊 Current trial details:', trial)
    }

    // Trigger panel close after design space generation completes
    setShouldClosePanel(true)
  }

  const handleDesignCreated = (design) => {
    // Log the design to the current trial first to get the design ID
    let designId = null
    if (currentTrialId) {
      designId = trialLogger.addDesignToTrial(currentTrialId, design)
      console.log('📊 Added design to trial:', currentTrialId, 'Design ID:', designId)
      
      // Debug: Log updated trial
      const trial = trialLogger.getTrial(currentTrialId)
      if (trial) {
        console.log('📊 Updated trial details:', trial)
      }
    } else {
      console.warn('⚠️ No current trial ID available for design logging')
    }

    // Add the design to the design cards with the ID from trial logger
    const designWithId = {
      ...design,
      id: designId || Date.now() // Use trial logger ID if available, otherwise fallback
    }
    setDesignCards([...designCards, designWithId])
  }

  const handleRemoveDesignCard = (designId) => {
    setDesignCards(designCards.filter(card => card.id !== designId))
  }

  const handleDesignUpdate = (updatedDesign) => {
    console.log('📊 handleDesignUpdate called with:', {
      designId: updatedDesign.id,
      hasScreens: !!updatedDesign.screens,
      screensCount: updatedDesign.screens?.length || 0,
      hasUICodes: updatedDesign.screens?.some(screen => screen.ui_code) || false,
      uiCodesCount: updatedDesign.screens?.filter(screen => screen.ui_code).length || 0
    })
    
    // Update the design card with the new UI codes
    setDesignCards(prevCards => 
      prevCards.map(card => 
        card.id === updatedDesign.id ? updatedDesign : card
      )
    )
    
    // Also update the design in the trial logger
    if (currentTrialId) {
      const success = trialLogger.updateDesignInTrial(currentTrialId, updatedDesign.id, updatedDesign)
      if (success) {
        console.log('📊 Successfully updated design in trial:', currentTrialId, 'Design ID:', updatedDesign.id)
      } else {
        console.error('❌ Failed to update design in trial:', currentTrialId, 'Design ID:', updatedDesign.id)
      }
    } else {
      console.warn('⚠️ No current trial ID available for design update')
    }
  }

  return (
    <div className="app">
      <Canvas 
        designCards={designCards}
        onRemoveDesignCard={handleRemoveDesignCard}
        onDesignUpdate={handleDesignUpdate}
        currentTrialId={currentTrialId}
      />
      
      <LeftPanel
        isOpen={leftPanelOpen}
        onToggle={toggleLeftPanel}
        onDesignSpaceGenerated={handleDesignSpaceGenerated}
      />
      
      {hasValidDesignSpace() && (
        <FloatingSliders 
          sliders={sliders}
          onUpdateSlider={updateSlider}
          onRemoveSlider={removeSlider}
          onDesignCreated={handleDesignCreated}
          currentTrialId={currentTrialId}
        />
      )}
    </div>
  )
}

export default App
