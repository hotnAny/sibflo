// User Behavior Logger Service
// Handles comprehensive logging of user interactions with DOM elements

import { generateElementSignature } from '../utils/elementSignature.js'

class UserBehaviorLogger {
  constructor() {
    this.sessionId = null // Will be set only on page load/reload
    this.buffer = []
    this.bufferSize = 10000 // Max events per session
    this.flushInterval = 60000 // 60 seconds
    this.lastFlush = Date.now()
    this.isActive = false
    this.rafId = null
    this.lastMouseMove = 0
    this.lastScroll = 0
    this.mouseMoveThreshold = 100 // ms between mousemove events
    this.scrollThreshold = 100 // ms between scroll events
    
    // Event types to log
    this.eventTypes = [
      'mousedown', 'mouseup', 'click', 'dblclick', 'mousemove',
      'contextmenu', 'wheel', 'dragstart', 'drag', 'dragend', 'drop',
      'keydown', 'keyup', 'keypress', 'input', 'focus', 'blur', 'focusin', 'focusout',
      'change', 'submit', 'reset', 'select', 'copy', 'cut', 'paste', 'scroll', 'resize',
      'visibilitychange', 'beforeunload', 'hashchange'
    ]
    
    // Remove auto-initialization - will be controlled by React Context
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Add method to check initialization status
  isInitialized() {
    return this.isActive && this.sessionId !== null
  }

  // Add method to check if session exists
  hasSession() {
    return this.sessionId !== null
  }

  // Method to manually create a new session (useful for testing or special cases)
  createNewSession() {
    if (this.isActive) {
      console.warn('⚠️ Cannot create new session while logger is active. Call destroy() first.')
      return false
    }
    
    this.sessionId = this.generateSessionId()
    console.log(`🔍 New session manually created: ${this.sessionId}`)
    return true
  }

  // Method to get detailed element information including signatures
  getElementInfo(element) {
    if (!element) return null
    
    try {
      return {
        tagName: element.tagName?.toLowerCase(),
        id: element.id || null,
        classes: Array.from(element.classList || []),
        textContent: element.textContent?.slice(0, 200) || null,
        hasActivity: !!element.getAttribute('activity'),
        activityValue: element.getAttribute('activity'),
        elementSignature: generateElementSignature(element),
        childrenCount: element.children?.length || 0,
        attributes: Array.from(element.attributes || []).map(attr => ({
          name: attr.name,
          value: attr.value
        }))
      }
    } catch (error) {
      console.warn('Failed to get element info:', error)
      return null
    }
  }

  init() {
    if (this.isActive) {
      console.log('🔍 User Behavior Logger already initialized')
      return
    }
    
    // Only create a new session if one doesn't exist (i.e., on page load/reload)
    if (!this.sessionId) {
      this.sessionId = this.generateSessionId()
      console.log(`🔍 New session created: ${this.sessionId}`)
    }
    
    this.isActive = true
    this.attachEventListeners()
    this.startFlushTimer()
    
    // Log session start (special case - no activity attribute needed)
    console.log(`🔍 User Behavior Logger initialized with session ID: ${this.sessionId}`)
    console.log(`🔍 Logging ${this.eventTypes.length} event types:`, this.eventTypes)
    console.log(`🔍 Only elements with 'activity' attributes will be logged`)
  }

    attachEventListeners() {
    // Attach listeners to document for event delegation with throttling for high-frequency events
    this.eventTypes.forEach(eventType => {
      if (eventType === 'mousemove') {
        // Handle mousemove with throttling using requestAnimationFrame and getCoalescedEvents
        const throttledHandler = this.createThrottledHandler(this.handleEvent.bind(this), 1000)
        document.addEventListener(eventType, throttledHandler, { passive: true })
        // Store reference for cleanup
        this._throttledHandlers = this._throttledHandlers || {}
        this._throttledHandlers.mousemove = throttledHandler
      } else {
        // Standard event handling
        document.addEventListener(eventType, this.handleEvent.bind(this), { passive: true })
      }
    })
  }

  // Create a throttled event handler with requestAnimationFrame and getCoalescedEvents
  createThrottledHandler(handler, minInterval) {
    let lastEventTime = 0
    let rafId = null
    let pendingEvent = null

    return (event) => {
      const now = Date.now()
      
      // Always respect the hard cap
      if (now - lastEventTime < minInterval) {
        // Store the most recent event for later processing
        pendingEvent = event
        return
      }

      // If we can process immediately, do so
      if (!rafId) {
        this.processThrottledEvent(event, handler, now, lastEventTime, minInterval, rafId, pendingEvent, () => {
          lastEventTime = now
        })
        return
      }

      // Otherwise, schedule for later processing
      pendingEvent = event
      this.scheduleThrottledProcessing(handler, minInterval, rafId, pendingEvent, lastEventTime, () => {
        lastEventTime = now
      })
    }
  }

  // Process a throttled event
  processThrottledEvent(event, handler, now, lastEventTime, minInterval, rafId, pendingEvent, updateLastEventTime) {
    // Update the lastEventTime in the closure scope
    updateLastEventTime()
    
    try {
      // Use coalesced events if available
      if (event.getCoalescedEvents) {
        const coalescedEvents = event.getCoalescedEvents()
        if (coalescedEvents.length > 0) {
          // Process the most recent coalesced event
          const latestEvent = coalescedEvents[coalescedEvents.length - 1]
          handler(latestEvent)
        } else {
          handler(event)
        }
      } else {
        handler(event)
      }
    } finally {
      // Check if we have a pending event to process
      if (pendingEvent) {
        const pending = pendingEvent
        pendingEvent = null
        
        // Process pending event if enough time has passed
        const currentTime = Date.now()
        if (currentTime - now >= minInterval) {
          this.processThrottledEvent(pending, handler, currentTime, now, minInterval, rafId, pendingEvent, updateLastEventTime)
        } else {
          // Schedule for later
          this.scheduleThrottledProcessing(handler, minInterval, rafId, pendingEvent, now, updateLastEventTime)
        }
      }
    }
  }

  // Schedule processing of pending events
  scheduleThrottledProcessing(handler, minInterval, rafId, pendingEvent, lastEventTime, updateLastEventTime) {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      rafId = null
      if (pendingEvent) {
        const pending = pendingEvent
        pendingEvent = null
        const now = Date.now()
        if (now - lastEventTime >= minInterval) {
          this.processThrottledEvent(pending, handler, now, lastEventTime, minInterval, rafId, pendingEvent, updateLastEventTime)
        }
      }
    })
  }

  handleEvent(event) {
    if(event.target == undefined || event.target == null) {
        return
    }

    const {target, activity} = this.getActivityDescription(event.target) || {target: event.target, activity: null}
    if (activity) {
      this.logEvent(event.type, target, activity)
    } else {
      // Log filtered events for debugging (optional)
      // console.log(`🔍 Event filtered (no activity attribute): ${event.type} on ${event.target.tagName?.toLowerCase()}`)
    }
  }

  getActivityDescription(target) {
    if(target == undefined) {
        return null
    }

    // Read the activity attribute directly from the target element
    let activity = target.getAttribute ? target.getAttribute('activity') : null
    
    if (!activity) {
        return this.getActivityDescription(target.parentElement) // No activity attribute, will be filtered out
    }
    
    return {target, activity}
  }

  logEvent(eventType, target, activity) {
    if (!this.isActive || !this.sessionId || !target || !activity) return
    
    // Only log events for elements with activity attributes
    // if (!target.hasAttribute('activity')) {
    //   return
    // }
    
    // Generate element signature for unique identification
    const elementSignature = generateElementSignature(target)
    
    const logEntry = {
      timestamp: Date.now(),
      eventType,
      targetType: target.tagName?.toLowerCase() || 'unknown',
      activity,
      elementSignature,
    //   targetId: target.id || null,
    //   targetClasses: Array.from(target.classList || []),
    //   targetText: target.textContent?.slice(0, 100) || null // Truncate long text
    }
    
    // Console log every entry for debugging
    // console.log('🔍 User Behavior Log:', logEntry)
    
    this.buffer.push(logEntry)
    
    // Check buffer size limit
    if (this.buffer.length >= this.bufferSize) {
      console.warn('⚠️ User behavior log buffer full, forcing flush')
      this.flushBuffer()
    }
  }

  startFlushTimer() {
    setInterval(() => {
      this.flushBuffer()
    }, this.flushInterval)
  }

  async flushBuffer() {
    if (this.buffer.length === 0) return
    
    try {
      const eventsToFlush = [...this.buffer]
      this.buffer = []
      
      // Store in chrome.storage.local if available, otherwise localStorage
      // eslint-disable-next-line no-undef
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await this.storeInChromeStorage(eventsToFlush)
      } else {
        this.storeInLocalStorage(eventsToFlush)
      }
      
      this.lastFlush = Date.now()
      console.log(`🔍 Flushed ${eventsToFlush.length} user behavior events to storage`)
      // eslint-disable-next-line no-undef
      console.log(`🔍 Storage method: ${typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? 'chrome.storage.local' : 'localStorage'}`)
      
    } catch (error) {
      console.error('Failed to flush user behavior log buffer:', error)
      // Restore events to buffer if flush failed
      this.buffer.unshift(...this.buffer)
    }
  }

  async storeInChromeStorage(events) {
    const key = `user_behavior_${this.sessionId}`
    
    try {
      // Get existing events for this session
      // eslint-disable-next-line no-undef
      const result = await chrome.storage.local.get(key)
      const existingEvents = result[key] || []
      
      // Combine existing and new events
      const allEvents = [...existingEvents, ...events]
      
      // Split large datasets into chunks (max 1MB per chunk)
      const maxChunkSize = 1024 * 1024 // 1MB
      const eventsJson = JSON.stringify(allEvents)
      
      if (eventsJson.length <= maxChunkSize) {
        // eslint-disable-next-line no-undef
        await chrome.storage.local.set({ [key]: allEvents })
      } else {
        // Split into chunks
        const chunks = []
        let currentChunk = []
        let currentSize = 0
        
        for (const event of allEvents) {
          const eventSize = JSON.stringify(event).length
          if (currentSize + eventSize > maxChunkSize) {
            chunks.push(currentChunk)
            currentChunk = [event]
            currentSize = eventSize
          } else {
            currentChunk.push(event)
            currentSize += eventSize
          }
        }
        
        if (currentChunk.length > 0) {
          chunks.push(currentChunk)
        }
        
        // Store chunks
        const storageData = {}
        chunks.forEach((chunk, index) => {
          storageData[`${key}_chunk_${index}`] = chunk
        })
        
        // eslint-disable-next-line no-undef
        await chrome.storage.local.set(storageData)
      }
    } catch (error) {
      console.error('Failed to store in chrome.storage:', error)
      // Fallback to storing just the new events
      // eslint-disable-next-line no-undef
      await chrome.storage.local.set({ [key]: events })
    }
  }

getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    };
  }

  storeInLocalStorage(events) {
    let eventsJson = null
    try {
      const key = `user_behavior_${this.sessionId}`
      
      // Get existing events for this session
      const existingEventsJson = localStorage.getItem(key)
      const existingEvents = existingEventsJson ? JSON.parse(existingEventsJson) : []
      
      // Combine existing and new events
      const allEvents = [...existingEvents, ...events]
      eventsJson = JSON.stringify(allEvents, this.getCircularReplacer(), 2)
    // eventsJson = JSON.stringify(allEvents)
      
      // Check localStorage size limit (usually 5-10MB)
      if (eventsJson.length > 5 * 1024 * 1024) {
        console.warn('⚠️ User behavior log too large for localStorage, truncating')
        // Keep only recent events
        const truncatedEvents = allEvents.slice(-1000)
        localStorage.setItem(key, JSON.stringify(truncatedEvents))
      } else {
        localStorage.setItem(key, JSON.stringify(allEvents))
      }
    } catch (error) {
      console.error('Failed to store user behavior log in localStorage:', error, eventsJson)
    }
  }

  getSessionStats() {
    return {
      sessionId: this.sessionId,
      bufferSize: this.buffer.length,
      isActive: this.isActive,
      lastFlush: this.lastFlush,
      totalEventsLogged: this.getTotalEventsLogged(),
      hasSession: this.sessionId !== null
    }
  }

  async getTotalEventsLogged() {
    // eslint-disable-next-line no-undef
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        // eslint-disable-next-line no-undef
        const result = await chrome.storage.local.get(null)
        const userBehaviorKeys = Object.keys(result).filter(key => 
          key.startsWith('user_behavior_') && key.includes(this.sessionId)
        )
        return userBehaviorKeys.reduce((total, key) => {
          const events = result[key]
          return total + (Array.isArray(events) ? events.length : 0)
        }, 0)
      } catch (error) {
        console.error('Failed to get total events from chrome.storage:', error)
        return 0
      }
    } else {
      // Count from localStorage
      let total = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('user_behavior_') && key.includes(this.sessionId)) {
          try {
            const events = JSON.parse(localStorage.getItem(key))
            total += Array.isArray(events) ? events.length : 0
          } catch (error) {
            console.warn('Failed to parse user behavior log from localStorage:', error)
          }
        }
      }
      return total
    }
  }

  destroy() {
    this.isActive = false
    
    // Remove event listeners and clean up throttled handlers
    this.eventTypes.forEach(eventType => {
      if (eventType === 'resize') {
        window.removeEventListener(eventType, this.handleEvent.bind(this))
      } else if (eventType === 'beforeunload' || eventType === 'hashchange') {
        window.removeEventListener(eventType, this.handleEvent.bind(this))
      } else {
        if (this._throttledHandlers && this._throttledHandlers[eventType]) {
          document.removeEventListener(eventType, this._throttledHandlers[eventType])
        } else {
          document.removeEventListener(eventType, this.handleEvent.bind(this))
        }
      }
    })
    
    // Cancel any pending animation frames
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
    
    // Clean up throttled handlers
    if (this._throttledHandlers) {
      // The throttled handlers are closures, so we just need to remove the event listeners
      // The RAF will be cancelled when the handlers are garbage collected
      this._throttledHandlers = {}
    }
    
    // Final flush
    this.flushBuffer()
    
    console.log(`🔍 User Behavior Logger destroyed for session: ${this.sessionId}`)
  }
}

// Export the class for use with React Context
export { UserBehaviorLogger }

// Global debug functions for browser console
// Note: These functions now require a logger instance to be passed
if (typeof window !== 'undefined') {
  window.debugUserBehavior = (loggerInstance) => {
    if (!loggerInstance) {
      console.error('🔍 Error: Logger instance required. Usage: debugUserBehavior(loggerInstance)')
      return
    }
    console.log('🔍 User Behavior Logger Debug Information:')
    console.log('🔍 Session stats:', loggerInstance.getSessionStats())
    console.log('🔍 Current buffer size:', loggerInstance.buffer.length)
    console.log('🔍 Session ID:', loggerInstance.sessionId)
    console.log('🔍 Has session:', loggerInstance.hasSession())
    console.log('🔍 Is initialized:', loggerInstance.isInitialized())
  }
  
  window.getUserBehaviorStats = async (loggerInstance) => {
    if (!loggerInstance) {
      console.error('🔍 Error: Logger instance required. Usage: getUserBehaviorStats(loggerInstance)')
      return null
    }
    const stats = loggerInstance.getSessionStats()
    stats.totalEventsLogged = await loggerInstance.getTotalEventsLogged()
    console.log('🔍 User Behavior Stats:', stats)
    return stats
  }
  
  window.flushUserBehaviorLog = (loggerInstance) => {
    if (!loggerInstance) {
      console.error('🔍 Error: Logger instance required. Usage: flushUserBehaviorLog(loggerInstance)')
      return
    }
    loggerInstance.flushBuffer()
    console.log('🔍 User behavior log manually flushed')
  }
}
