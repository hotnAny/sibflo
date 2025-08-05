import { useState } from 'react'
import './App.css'
import Canvas from './components/Canvas'
import FloatingSliders from './components/FloatingSliders'
import LeftPanel from './components/LeftPanel'
import { trialLogger } from './services/trialLogger'

function App() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [sliders, setSliders] = useState([
    { id: 1, label: 'Opacity', value: 50, min: 0, max: 100 },
    { id: 2, label: 'Scale', value: 75, min: 0, max: 100 },
    { id: 3, label: 'Rotation', value: 0, min: 0, max: 360 }
  ])
  const [designCards, setDesignCards] = useState([])
  const [currentTrialId, setCurrentTrialId] = useState(null)

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
    // Add a unique ID to the design
    const designWithId = {
      ...design,
      id: Date.now()
    }
    setDesignCards([...designCards, designWithId])

    // Log the design to the current trial
    if (currentTrialId) {
      const designId = trialLogger.addDesignToTrial(currentTrialId, design)
      console.log('📊 Added design to trial:', currentTrialId, 'Design ID:', designId)
      
      // Debug: Log updated trial
      const trial = trialLogger.getTrial(currentTrialId)
      if (trial) {
        console.log('📊 Updated trial details:', trial)
      }
    } else {
      console.warn('⚠️ No current trial ID available for design logging')
    }
  }

  const handleRemoveDesignCard = (designId) => {
    setDesignCards(designCards.filter(card => card.id !== designId))
  }

  const handleDesignUpdate = (updatedDesign) => {
    // Update the design card with the new UI codes
    setDesignCards(prevCards => 
      prevCards.map(card => 
        card.id === updatedDesign.id ? updatedDesign : card
      )
    )
    
    // Also update the design in the trial logger
    if (currentTrialId) {
      trialLogger.updateDesignInTrial(currentTrialId, updatedDesign.id, updatedDesign)
      console.log('📊 Updated design in trial:', currentTrialId, 'Design ID:', updatedDesign.id)
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
