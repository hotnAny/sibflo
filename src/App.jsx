import { useState, useRef, useEffect } from 'react'
import './App.css'
import Canvas from './components/Canvas'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import FloatingSliders from './components/FloatingSliders'
import DesignSpacePanel from './components/DesignSpacePanel'

function App() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [designSpacePanelOpen, setDesignSpacePanelOpen] = useState(false)
  const [sliders, setSliders] = useState([
    { id: 1, label: 'Opacity', value: 50, min: 0, max: 100 },
    { id: 2, label: 'Scale', value: 75, min: 0, max: 100 },
    { id: 3, label: 'Rotation', value: 0, min: 0, max: 360 }
  ])

  const toggleLeftPanel = () => setLeftPanelOpen(!leftPanelOpen)
  const toggleRightPanel = () => setRightPanelOpen(!rightPanelOpen)
  const toggleDesignSpacePanel = () => setDesignSpacePanelOpen(!designSpacePanelOpen)

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

  return (
    <div className="app">
      <Canvas />
      
      <LeftPanel 
        isOpen={leftPanelOpen} 
        onToggle={toggleLeftPanel}
      />
      
      <RightPanel 
        isOpen={rightPanelOpen} 
        onToggle={toggleRightPanel}
      />
      
      <DesignSpacePanel
        isOpen={designSpacePanelOpen}
        onToggle={toggleDesignSpacePanel}
      />
      
      <FloatingSliders 
        sliders={sliders}
        onUpdateSlider={updateSlider}
        onRemoveSlider={removeSlider}
        onAddSlider={addSlider}
      />
    </div>
  )
}

export default App
