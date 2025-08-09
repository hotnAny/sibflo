import { useState, useRef, useEffect } from 'react'
import UIView from './UIView'
import Card from './Card'
import { Maximize } from 'lucide-react'
import { stateStorage } from '../services/stateStorage'
import './Canvas.css'

const Canvas = ({ designCards = [], onRemoveDesignCard, onToggleFavorite, onDesignUpdate, currentTrialId }) => {
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
  
  // State for card positions
  const [cardPositions, setCardPositions] = useState({})
  
  // State for card z-indices
  const [cardZIndices, setCardZIndices] = useState({})
  const [highestZIndex, setHighestZIndex] = useState(1)
  
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
      if (savedState.cardZIndices) {
        setCardZIndices(savedState.cardZIndices)
      }
      if (savedState.highestZIndex) {
        setHighestZIndex(savedState.highestZIndex)
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
      cardPositions,
      cardZIndices,
      highestZIndex
    }
    stateStorage.saveCanvasState(currentState)
  }, [isCanvasStateLoaded, zoom, position, uiViewOpen, selectedDesign, cardPositions, cardZIndices, highestZIndex])

  // Clean up card positions and z-indices when cards are removed, and handle new cards
  useEffect(() => {
    if (isCanvasStateLoaded) {
      const currentCardIds = designCards.map((design, index) => design.id || index)
      
      // Handle positions
      setCardPositions(prev => {
        const cleanedPositions = {}
        currentCardIds.forEach(cardId => {
          if (prev[cardId]) {
            cleanedPositions[cardId] = prev[cardId]
          }
        })
        return cleanedPositions
      })
      
      // Handle z-indices and new cards
      setCardZIndices(prev => {
        const cleanedZIndices = {}
        let newHighestZIndex = highestZIndex
        
        currentCardIds.forEach(cardId => {
          if (prev[cardId]) {
            cleanedZIndices[cardId] = prev[cardId]
          } else {
            // This is a new card - assign it the highest z-index
            newHighestZIndex += 1
            cleanedZIndices[cardId] = newHighestZIndex
          }
        })
        
        // Update highest z-index if we assigned new z-indices
        if (newHighestZIndex > highestZIndex) {
          setHighestZIndex(newHighestZIndex)
        }
        
        return cleanedZIndices
      })
    }
  }, [designCards, isCanvasStateLoaded, highestZIndex])

  const handleWheel = (e) => {
    // Check if the scroll event is happening over a design card or its content
    const target = e.target
    const isOverDesignCard = target.closest('.design-card') || 
                            target.classList.contains('design-card') ||
                            target.classList.contains('design-card-content') ||
                            target.classList.contains('design-card-header') ||
                            target.classList.contains('design-card-footer')
    
    if (isOverDesignCard) {
      // Don't prevent default - let the card/shape content scroll naturally
      return
    }
    
    // Only zoom if scrolling over the canvas background
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(2, zoom * delta))
    console.log('Current zoom factor:', newZoom)
    setZoom(newZoom)
  }

  const handleMouseDown = (e) => {
    // Enable panning with left mouse button, middle mouse button, or left + Alt
    if (e.button === 0 || e.button === 1 || (e.button === 0 && e.altKey)) {
      // Only start dragging if clicking on the canvas background (not on design cards or other elements)
      const isOverDesignCard = e.target.closest('.design-card')
      
      if (e.target === e.currentTarget || 
          e.target.classList.contains('canvas-grid') || 
          e.target.classList.contains('grid-pattern')) {
        // Only start dragging if not over a card
        if (!isOverDesignCard) {
          setIsDragging(true)
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
          })
          e.preventDefault() // Prevent text selection during drag
        }
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
    const cardHeight = 300 // Height of design card (square)
    const centerX = Math.max(0, (canvasSize.width - cardWidth) / 2)
    const centerY = Math.max(0, (canvasSize.height - cardHeight) / 2)
    return { x: centerX, y: centerY }
  }

  // Calculate position for design cards - place each card in a grid layout
  const getDesignCardPosition = (index) => {
    const center = getCenterPosition()
    const cardWidth = 300
    const cardHeight = 300 // Match the actual card dimensions from CSS
    const spacing = 50
    
    // Calculate how many cards can fit in a row based on available width
    const cardsPerRow = Math.floor((canvasSize.width * 0.8) / (cardWidth + spacing))
    // const row = Math.floor(index / cardsPerRow)
    // const col = index % cardsPerRow
    
    // Center the grid horizontally and vertically
    const gridWidth = Math.min(cardsPerRow, designCards.length) * (cardWidth + spacing) - spacing
    const gridHeight = (Math.ceil(designCards.length / cardsPerRow)) * (cardHeight + spacing) - spacing
    
    const gridStartX = center.x - gridWidth / 8
    const gridStartY = center.y - gridHeight / 2

    const offsetFactor = index * 0.1
    
    return {
      x: gridStartX + (cardWidth + spacing) * offsetFactor,
      y: gridStartY + (cardHeight + spacing) * offsetFactor
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

  const handleCardClick = (cardId) => {
    const newZIndex = highestZIndex + 1
    setCardZIndices(prev => ({
      ...prev,
      [cardId]: newZIndex
    }))
    setHighestZIndex(newZIndex)
  }

  const handleResetCanvas = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }


  // Update canvas size when component mounts or window resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      // Get the viewport dimensions
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate 3x viewport size while maintaining aspect ratio
      const canvasWidth = viewportWidth * 3
      const canvasHeight = viewportHeight * 3
      
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
                zIndex={cardZIndices[cardId] || 1}
                onOpenUIView={handleOpenUIView}
                onRemoveDesignCard={onRemoveDesignCard}
                onToggleFavorite={onToggleFavorite}
                onPositionChange={handleCardPositionChange}
                onClick={() => handleCardClick(cardId)}
              />
            )
          })}
        </div>


      </div>

      {/* Reset Canvas Button */}
      <button 
        className="reset-canvas-button"
        onClick={handleResetCanvas}
        title="Reset canvas position and zoom"
      >
        <Maximize size={18} />
      </button>

      {/* UIView - UI Code Generation */}
      {uiViewOpen && selectedDesign && (
        <UIView
          key={selectedDesign.id || selectedDesign.design_name || 'default'}  // ← Force re-initialization
          isOpen={uiViewOpen}
          design={selectedDesign}
          // screens={selectedDesign.screens || []}
          onClose={handleCloseUIView}
          currentTrialId={currentTrialId}
          onDesignUpdate={onDesignUpdate}
        />
      )}
    </div>
  )
}

export default Canvas 