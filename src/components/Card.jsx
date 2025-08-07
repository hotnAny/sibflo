import { useState, useRef, useEffect, useCallback } from 'react'
import { Code, Eye, Loader2, Trash2 } from 'lucide-react'
import './Card.css'

const Card = ({ 
  design, 
  index, 
  position, 
  generatingDesignId = null,
  onOpenUIView, 
  onGenerateUICode, 
  onRemoveDesignCard,
  onPositionChange 
}) => {
  const [isDraggingCard, setIsDraggingCard] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)
  const cardId = design.id || index

  const handleMouseDown = useCallback((e) => {
    // Start dragging the design card
    setIsDraggingCard(true)
    cardRef.current = e.currentTarget
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (isDraggingCard && cardRef.current) {
      e.preventDefault()
      e.stopPropagation()
      
      // Direct DOM manipulation - no re-renders
      const card = cardRef.current
      
      // Get current transform values - handle combined transforms
      const currentTransform = card.style.transform || ''
      let currentX = position.x
      let currentY = position.y
      
      // Parse the first translate transform (positioning)
      const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/)
      if (translateMatch) {
        currentX = parseFloat(translateMatch[1]) || position.x
        currentY = parseFloat(translateMatch[2]) || position.y
      }
      
      const newX = currentX + e.movementX
      const newY = currentY + e.movementY

      // Apply the new transform, preserving any additional transforms (like hover)
      const hoverTransform = isHovered ? ' translateY(-2px)' : ''
      card.style.transform = `translate(${newX}px, ${newY}px)${hoverTransform}`
    }
  }, [isDraggingCard, position.x, position.y, isHovered])

  const handleMouseUp = useCallback(() => {
    if (isDraggingCard && cardRef.current) {
      // Only update React state when dragging ends
      const card = cardRef.current
      const currentTransform = card.style.transform || ''
      let finalX = position.x
      let finalY = position.y
      
      // Parse the first translate transform (positioning)
      const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/)
      if (translateMatch) {
        finalX = parseFloat(translateMatch[1]) || position.x
        finalY = parseFloat(translateMatch[2]) || position.y
      }
      
      if (onPositionChange) {
        onPositionChange(cardId, { x: finalX, y: finalY })
      }
      
      setIsDraggingCard(false)
      cardRef.current = null
    }
  }, [isDraggingCard, position.x, position.y, onPositionChange, cardId])

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
            <Eye size={14} />
          </button>
          <button 
            className="control-btn"
            onClick={() => onGenerateUICode(design)}
            title="Generate UI Code"
            disabled={generatingDesignId === design.id}
          >
            {generatingDesignId === design.id ? (
              <Loader2 size={14} className="loading-spinner" />
            ) : (
              <Code size={14} />
            )}
          </button>
          {onRemoveDesignCard && (
            <button 
              className="control-btn"
              onClick={() => onRemoveDesignCard(design.id || index)}
              title="Remove design"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Card
