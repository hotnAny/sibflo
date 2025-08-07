import { useState, useRef, useEffect, useCallback } from 'react'
import { Code, Eye, Loader2, Trash2 } from 'lucide-react'
import './Card.css'

const Card = ({ 
  design, 
  index, 
  position: initialPosition, 
  zoom = 1,
  onOpenUIView, 
  onRemoveDesignCard,
  onPositionChange 
}) => {
  const [isDraggingCard, setIsDraggingCard] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const cardRef = useRef(null)
  const cardId = design.id || index
  
  // Add refs to store initial positions when dragging starts
  const initialMousePos = useRef({ x: 0, y: 0 })
  const initialCardPos = useRef({ x: 0, y: 0 })
  const currentPositionRef = useRef(position)

  // Update internal position when initialPosition prop changes (only if not dragging)
  useEffect(() => {
    if (!isDraggingCard) {
      setPosition(initialPosition)
      currentPositionRef.current = initialPosition
    }
  }, [initialPosition, isDraggingCard])

  // Keep ref in sync with position state
  useEffect(() => {
    currentPositionRef.current = position
  }, [position])

  const handleMouseDown = useCallback((e) => {
    // Start dragging the design card
    setIsDraggingCard(true)
    cardRef.current = e.currentTarget
    
    // Record initial mouse position and card position
    initialMousePos.current = { x: e.clientX, y: e.clientY }
    initialCardPos.current = { x: currentPositionRef.current.x, y: currentPositionRef.current.y }
    
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (isDraggingCard) {
      e.preventDefault()
      e.stopPropagation()
      
      // Calculate the difference between current mouse position and initial mouse position
      const mouseDeltaX = e.clientX - initialMousePos.current.x
      const mouseDeltaY = e.clientY - initialMousePos.current.y
      
      // Apply the mouse delta to the initial card position, adjusted for zoom
      const newX = initialCardPos.current.x + mouseDeltaX / zoom
      const newY = initialCardPos.current.y + mouseDeltaY / zoom
      
      // Update internal position immediately for smooth dragging
      setPosition({ x: newX, y: newY })
    }
  }, [isDraggingCard, zoom])

  const handleMouseUp = useCallback(() => {
    if (isDraggingCard) {
      // Only notify parent of position change when dragging ends
      if (onPositionChange) {
        onPositionChange(cardId, currentPositionRef.current)
      }
      
      setIsDraggingCard(false)
      cardRef.current = null
    }
  }, [isDraggingCard, onPositionChange, cardId])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDraggingCard) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingCard, handleMouseMove, handleMouseUp])

  // Calculate the transform string including hover effect
  const getTransformString = () => {
    const baseTransform = `translate(${position.x}px, ${position.y}px)`
    if (isHovered && !isDraggingCard) {
      return `${baseTransform} translateY(-2px)`
    }
    return baseTransform
  }

  return (
    <div 
      ref={cardRef}
      className="design-card"
      data-card-id={cardId}
      style={{ 
        transform: getTransformString(),
        cursor: isDraggingCard ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="design-card-header">
        <h3 className="design-card-title">
          {design.design_name || design.name || `Design ${index + 1}`}
        </h3>
      </div>
      <div className="design-card-content">
        <p className="design-card-description">
          {design.core_concept || design.description || 'No description available'}
        </p>
        {design.key_characteristics && (
          <div className="design-card-characteristics">
            <h4>Key Characteristics:</h4>
            <ul>
              {Array.isArray(design.key_characteristics) 
                ? design.key_characteristics.map((char, i) => (
                    <li key={i}>{char}</li>
                  ))
                : <li>{design.key_characteristics}</li>
              }
            </ul>
          </div>
        )}
        {design.rationale && (
          <div className="design-card-rationale">
            <h4>Rationale:</h4>
            <p>{design.rationale}</p>
          </div>
        )}
      </div>
      <div className="design-card-footer">
        <div className="design-card-actions">
          <button 
            className="control-btn"
            onClick={() => onOpenUIView(design)}
            title="View UI"
          >
            <Eye size={16} />
          </button>
          {onRemoveDesignCard && (
            <button 
              className="control-btn"
              onClick={() => onRemoveDesignCard(design.id || index)}
              title="Remove design"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Card
