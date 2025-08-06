import { useState, useEffect } from 'react'
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
  const [sliders, setSliders] = useState([
    { id: 1, label: 'Opacity', value: 50, min: 0, max: 100 },
    { id: 2, label: 'Scale', value: 75, min: 0, max: 100 },
    { id: 3, label: 'Rotation', value: 0, min: 0, max: 360 }
  ])
  const [designCards, setDesignCards] = useState([])
  const [currentTrialId, setCurrentTrialId] = useState(null)

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
    
    const currentState = {
      leftPanelOpen,
      sliders,
      designCards,
      currentTrialId
    }
    stateStorage.saveAppState(currentState)
  }, [isStateLoaded, leftPanelOpen, sliders, designCards, currentTrialId])

  const toggleLeftPanel = () => setLeftPanelOpen(!leftPanelOpen)

  const addSlider = () => {
    const newSlider = {
      id: Date.now(),
      label: `Slider ${sliders.length + 1}`,
      value: 50,
      min: 0,
      max: 100
    }
    setSliders([...sliders, newSlider])
  }

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
      
      <FloatingSliders 
        sliders={sliders}
        onUpdateSlider={updateSlider}
        onRemoveSlider={removeSlider}
        onAddSlider={addSlider}
        onDesignCreated={handleDesignCreated}
        currentTrialId={currentTrialId}
      />
    </div>
  )
}

export default App
