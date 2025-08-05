import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, Move } from 'lucide-react'
import './Canvas.css'

const Canvas = () => {
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef(null)

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta))
    setZoom(newZoom)
  }

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom * 1.2))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoom / 1.2))
  }

  const handleResetView = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('mouseleave', handleMouseUp)

      return () => {
        canvas.removeEventListener('wheel', handleWheel)
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
        canvas.removeEventListener('mouseleave', handleMouseUp)
      }
    }
  }, [zoom, isDragging, position, dragStart])

  return (
    <div className="canvas-container">
      <div 
        ref={canvasRef}
        className="canvas"
        style={{
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
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
        
        {/* Sample content */}
        <div className="canvas-content">
          <div className="sample-rectangle" style={{ left: '100px', top: '100px' }}>
            <div className="rectangle-label">Rectangle 1</div>
          </div>
          <div className="sample-circle" style={{ left: '300px', top: '200px' }}>
            <div className="circle-label">Circle 1</div>
          </div>
          <div className="sample-text" style={{ left: '200px', top: '400px' }}>
            Sample Text Element
          </div>
        </div>
      </div>

      {/* Canvas controls */}
      <div className="canvas-controls">
        <button onClick={handleZoomIn} className="control-btn">
          <ZoomIn size={16} />
        </button>
        <button onClick={handleZoomOut} className="control-btn">
          <ZoomOut size={16} />
        </button>
        <button onClick={handleResetView} className="control-btn">
          <Move size={16} />
        </button>
        <div className="zoom-level">{Math.round(zoom * 100)}%</div>
      </div>
    </div>
  )
}

export default Canvas 