import { useState, useRef, useEffect } from 'react'
import UIView from './UIView'
import Card from './Card'
import { stateStorage } from '../services/stateStorage'
import './Canvas.css'

const Canvas = ({ designCards = [], onRemoveDesignCard, onDesignUpdate, currentTrialId }) => {
  // Flag to prevent saving state before loading initial state
  const [isCanvasStateLoaded, setIsCanvasStateLoaded] = useState(false)
  
  // Initialize states with default values, will be overridden by useEffect
  const [zoom, setZoom] = useState(0.1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [uiViewOpen, setUiViewOpen] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [generatingDesignId, setGeneratingDesignId] = useState(null)
  
  // State for card positions
  const [cardPositions, setCardPositions] = useState({})
  
  const canvasRef = useRef(null)

  // Load canvas state from localStorage on component mount
  useEffect(() => {
    const savedState = stateStorage.loadCanvasState()
    if (savedState) {
      setZoom(savedState.zoom)
      setPosition(savedState.position)
      setUiViewOpen(savedState.uiViewOpen)
      setSelectedDesign(savedState.selectedDesign)
      if (savedState.cardPositions) {
        setCardPositions(savedState.cardPositions)
      }
    }
    // Mark state as loaded to enable saving
    setIsCanvasStateLoaded(true)
  }, [])

  // Save canvas state to localStorage whenever relevant state changes (but only after initial load)
  useEffect(() => {
    if (!isCanvasStateLoaded) {
      // console.log('⏳ Skipping canvas state save - initial state not loaded yet')
      return
    }
    
    const currentState = {
      zoom,
      position,
      uiViewOpen,
      selectedDesign,
      cardPositions
    }
    stateStorage.saveCanvasState(currentState)
  }, [isCanvasStateLoaded, zoom, position, uiViewOpen, selectedDesign, cardPositions])

  // Clean up card positions when cards are removed
  useEffect(() => {
    if (isCanvasStateLoaded) {
      const currentCardIds = designCards.map((design, index) => design.id || index)
      setCardPositions(prev => {
        const cleanedPositions = {}
        currentCardIds.forEach(cardId => {
          if (prev[cardId]) {
            cleanedPositions[cardId] = prev[cardId]
          }
        })
        return cleanedPositions
      })
    }
  }, [designCards, isCanvasStateLoaded])

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta))
    setZoom(newZoom)
  }

  const handleMouseDown = (e) => {
    // Enable panning with left mouse button, middle mouse button, or left + Alt
    if (e.button === 0 || e.button === 1 || (e.button === 0 && e.altKey)) {
      // Only start dragging if clicking on the canvas background (not on design cards or other elements)
      if (e.target === e.currentTarget || e.target.classList.contains('canvas-grid') || e.target.classList.contains('grid-pattern')) {
        setIsDragging(true)
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y
        })
        e.preventDefault() // Prevent text selection during drag
      }
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault() // Prevent text selection during drag
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Calculate center position for design cards
  const getCenterPosition = () => {
    const cardWidth = 300 // Width of design card
    const cardHeight = 300 // Height of design card (now square)
    const centerX = Math.max(0, (canvasSize.width - cardWidth) / 2)
    const centerY = Math.max(0, (canvasSize.height - cardHeight) / 2)
    return { x: centerX, y: centerY }
  }

  // Calculate position for design cards - place each card to the right of the previous
  const getDesignCardPosition = (index) => {
    const centerPos = getCenterPosition()
    const cardWidth = 300 // Width of design card
    const cardSpacing = 50 // Spacing between cards
    
    // console.log('🎨 getDesignCardPosition called:', { index })
    
    // Simple linear progression: each card to the right of the previous
    const x = centerPos.x + (index * (cardWidth + cardSpacing))
    const y = centerPos.y // Small vertical offset to avoid perfect alignment
    
    // console.log('🎨 Positioning card', index, ':', { x, y })
    return { x, y }
  }

  const handleGenerateUICode = async (design) => {
    console.log('🎨 Starting UI code generation for design:', design)
    
    // Check if design has screens
    const screensToUse = design.screens || []
    if (!screensToUse || screensToUse.length === 0) {
      alert('No screens available for UI code generation')
      return
    }

    // Set loading state
    setGeneratingDesignId(design.id)

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
      
      const generatedUICodes = await genUICodesStreaming({
        screenDescriptions: screenDescriptions,
        critiques: [],
        onProgress: (codes, index) => {
          console.log(`📝 Progress: Screen ${index + 1} code generated`)
        }
      })

      console.log('✅ UI code generation completed:', generatedUICodes)
      
      // Update the design object with the generated UI codes
      if (generatedUICodes && generatedUICodes.length > 0) {
        const updatedDesign = {
          ...design,
          screens: screensToUse.map((screen, index) => ({
            ...screen,
            ui_code: generatedUICodes[index] || ''
          }))
        }
        
        console.log('🎨 Updated design with UI codes:', {
          designId: updatedDesign.id,
          screensCount: updatedDesign.screens?.length || 0,
          uiCodesCount: updatedDesign.screens?.filter(screen => screen.ui_code).length || 0,
          uiCodesSnippets: updatedDesign.screens?.map(screen => 
            screen.ui_code ? screen.ui_code.substring(0, 50) + '...' : 'N/A'
          ) || []
        })
        
        // Update the design in the parent component
        if (onDesignUpdate) {
          console.log('📊 Calling onDesignUpdate with updated design')
          onDesignUpdate(updatedDesign)
        }
        
        // Open the UIView with the updated design
        setSelectedDesign(updatedDesign)
        setUiViewOpen(true)
      } else {
        throw new Error('No UI codes were generated')
      }
    } catch (error) {
      console.error('❌ Error generating UI codes:', error)
      alert(`Failed to generate UI codes: ${error.message}`)
    } finally {
      // Clear loading state
      setGeneratingDesignId(null)
    }
  }

  const handleOpenUIView = (design) => {
    console.log('🎯 Opening UI view for design:', {
      id: design.id,
      name: design.design_name || design.name,
      screensCount: design.screens?.length || 0,
      hasTaskScreenMapping: !!design.taskScreenMapping
    })
    setSelectedDesign(design)
    setUiViewOpen(true)
  }

  const handleCloseUIView = () => {
    setUiViewOpen(false)
    setSelectedDesign(null)
  }

  const handleCardPositionChange = (cardId, newPosition) => {
    setCardPositions(prev => ({
      ...prev,
      [cardId]: newPosition
    }))
  }

  // Update canvas size when component mounts or window resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      // Get the viewport dimensions
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate 10x viewport size while maintaining aspect ratio
      const canvasWidth = viewportWidth * 10
      const canvasHeight = viewportHeight * 10
      
      setCanvasSize({
        width: canvasWidth,
        height: canvasHeight
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      canvas.addEventListener('mousedown', handleMouseDown)

      return () => {
        canvas.removeEventListener('wheel', handleWheel)
        canvas.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [zoom, isDragging, position, dragStart])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  return (
    <div className="canvas-container">
      <div 
        ref={canvasRef}
        className="canvas"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          transform: `translate(-50%, -50%) scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}

      >
        <div className="canvas-grid">
          {/* Grid pattern */}
          <svg className="grid-pattern" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Design Cards */}
        <div className="canvas-content">
          {designCards.map((design, index) => {
            const defaultPosition = getDesignCardPosition(index)
            const cardId = design.id || index
            const savedPosition = cardPositions[cardId]
            const position = savedPosition || defaultPosition
            
            return (
              <Card
                key={cardId}
                design={design}
                index={index}
                position={position}
                zoom={zoom}
                generatingDesignId={generatingDesignId}
                onOpenUIView={handleOpenUIView}
                onGenerateUICode={handleGenerateUICode}
                onRemoveDesignCard={onRemoveDesignCard}
                onPositionChange={handleCardPositionChange}
              />
            )
          })}
        </div>
      </div>

      {/* UIView - UI Code Generation */}
      {uiViewOpen && selectedDesign && (
        <UIView
          key={selectedDesign.id || selectedDesign.design_name || 'default'}  // ← Force re-initialization
          isOpen={uiViewOpen}
          design={selectedDesign}
          // screens={selectedDesign.screens || []}
          onClose={handleCloseUIView}
          currentTrialId={currentTrialId}
        />
      )}
    </div>
  )
}

export default Canvas 