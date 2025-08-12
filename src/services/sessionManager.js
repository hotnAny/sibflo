// Session Manager Service
// Manages and provides access to logged sessions from both user behavior and trials

import { trialLogger } from './trialLogger'

class SessionManager {
  constructor() {
    this.storageKeys = {
      userBehavior: 'user_behavior_',
      trials: 'sibflo_trials'
    }
  }

  // Get all logged sessions (both user behavior and trials)
  async getAllSessions() {
    try {
      const sessions = []
      
      // Get user behavior sessions
      const behaviorSessions = await this.getUserBehaviorSessions()
      console.log('🔍 User behavior sessions found:', behaviorSessions.length)
      sessions.push(...behaviorSessions)
      
      // Get trial sessions
      const trialSessions = this.getTrialSessions()
      console.log('🔍 Trial sessions found:', trialSessions.length)
      sessions.push(...trialSessions)
      
      // Sort by timestamp (newest first)
      const sortedSessions = sessions.sort((a, b) => b.timestamp - a.timestamp)
      console.log('🔍 Total sessions after sorting:', sortedSessions.length)
      return sortedSessions
    } catch (error) {
      console.error('Failed to get all sessions:', error)
      return []
    }
  }

  // Get user behavior sessions
  async getUserBehaviorSessions() {
    try {
      // eslint-disable-next-line no-undef
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return await this.getUserBehaviorSessionsFromChrome()
      } else {
        return this.getUserBehaviorSessionsFromLocalStorage()
      }
    } catch (error) {
      console.error('Failed to get user behavior sessions:', error)
      return []
    }
  }

  // Get user behavior sessions from Chrome storage
  async getUserBehaviorSessionsFromChrome() {
    try {
      // eslint-disable-next-line no-undef
      const result = await chrome.storage.local.get(null)
      const sessions = []
      
      // Find all user behavior keys
      const userBehaviorKeys = Object.keys(result).filter(key => 
        key.startsWith(this.storageKeys.userBehavior)
      )
      
      for (const key of userBehaviorKeys) {
        try {
          const events = result[key]
          if (Array.isArray(events) && events.length > 0) {
            const sessionId = key.replace(this.storageKeys.userBehavior, '')
            const firstEvent = events[0]
            const lastEvent = events[events.length - 1]
            
            sessions.push({
              id: sessionId,
              type: 'user-behavior',
              timestamp: firstEvent.timestamp,
              endTimestamp: lastEvent.timestamp,
              eventCount: events.length,
              events: events,
              sessionId: sessionId
            })
          }
        } catch (error) {
          console.warn('Failed to parse user behavior session:', key, error)
        }
      }
      
      return sessions
    } catch (error) {
      console.error('Failed to get user behavior sessions from Chrome storage:', error)
      return []
    }
  }

  // Get user behavior sessions from localStorage
  getUserBehaviorSessionsFromLocalStorage() {
    const sessions = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storageKeys.userBehavior)) {
          try {
            const events = JSON.parse(localStorage.getItem(key))
            if (Array.isArray(events) && events.length > 0) {
              const sessionId = key.replace(this.storageKeys.userBehavior, '')
              const firstEvent = events[0]
              const lastEvent = events[events.length - 1]
              
              sessions.push({
                id: sessionId,
                type: 'user-behavior',
                timestamp: firstEvent.timestamp,
                endTimestamp: lastEvent.timestamp,
                eventCount: events.length,
                events: events,
                sessionId: sessionId
              })
            }
          } catch (error) {
            console.warn('Failed to parse user behavior session from localStorage:', key, error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to get user behavior sessions from localStorage:', error)
    }
    
    return sessions
  }

  // Get trial sessions
  getTrialSessions() {
    try {
      const trials = trialLogger.getAllTrials()
      console.log('🔍 Raw trials from trialLogger:', trials.length)
      
      const mappedTrials = trials.map(trial => ({
        id: trial.id,
        type: 'trial',
        timestamp: trial.timestamp,
        endTimestamp: trial.timestamp, // Trials don't have end timestamp
        eventCount: trial.designs ? trial.designs.length : 0,
        input: trial.input || {},
        designSpace: trial.designSpace || [],
        designs: trial.designs || [],
        sessionId: trial.id
      }))
      
      console.log('🔍 Mapped trial sessions:', mappedTrials.length)
      return mappedTrials
    } catch (error) {
      console.error('Failed to get trial sessions:', error)
      return []
    }
  }

  // Get session by ID
  async getSessionById(sessionId) {
    try {
      const sessions = await this.getAllSessions()
      return sessions.find(session => session.id === sessionId)
    } catch (error) {
      console.error('Failed to get session by ID:', error)
      return null
    }
  }

  // Get current active session
  getCurrentSession(userBehaviorLogger) {
    if (!userBehaviorLogger) {
      console.warn('No userBehaviorLogger instance provided to getCurrentSession')
      return null
    }
    
    return {
      sessionId: userBehaviorLogger.sessionId,
      isActive: userBehaviorLogger.isActive,
      bufferSize: userBehaviorLogger.buffer.length,
      lastFlush: userBehaviorLogger.lastFlush
    }
  }

  // Download all sessions as JSON
  async downloadAllSessions() {
    try {
      const sessions = await this.getAllSessions()
      const dataStr = JSON.stringify(sessions, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `sibflo-sessions-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
      return true
    } catch (error) {
      console.error('Failed to download sessions:', error)
      return false
    }
  }

  // Download specific session as JSON
  async downloadSession(sessionId) {
    try {
      const session = await this.getSessionById(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }
      
      const dataStr = JSON.stringify(session, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `sibflo-session-${sessionId}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
      return true
    } catch (error) {
      console.error('Failed to download session:', error)
      return false
    }
  }

  // Clear all sessions
  async clearAllSessions() {
    try {
      // Clear user behavior sessions
      await this.clearUserBehaviorSessions()
      
      // Clear trial sessions
      trialLogger.clearAllTrials()
      
      return true
    } catch (error) {
      console.error('Failed to clear all sessions:', error)
      return false
    }
  }

  // Clear user behavior sessions
  async clearUserBehaviorSessions() {
    try {
      // eslint-disable-next-line no-undef
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await this.clearUserBehaviorSessionsFromChrome()
      } else {
        this.clearUserBehaviorSessionsFromLocalStorage()
      }
      return true
    } catch (error) {
      console.error('Failed to clear user behavior sessions:', error)
      return false
    }
  }

  // Clear user behavior sessions from Chrome storage
  async clearUserBehaviorSessionsFromChrome() {
    try {
      // eslint-disable-next-line no-undef
      const result = await chrome.storage.local.get(null)
      const userBehaviorKeys = Object.keys(result).filter(key => 
        key.startsWith(this.storageKeys.userBehavior)
      )
      
      if (userBehaviorKeys.length > 0) {
        // eslint-disable-next-line no-undef
        await chrome.storage.local.remove(userBehaviorKeys)
      }
    } catch (error) {
      console.error('Failed to clear user behavior sessions from Chrome storage:', error)
    }
  }

  // Clear user behavior sessions from localStorage
  clearUserBehaviorSessionsFromLocalStorage() {
    try {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storageKeys.userBehavior)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Failed to clear user behavior sessions from localStorage:', error)
    }
  }

  // Get session statistics
  async getSessionStats() {
    try {
      const sessions = await this.getAllSessions()
      console.log('🔍 Getting stats for sessions:', sessions.length)
      
      const userBehaviorSessions = sessions.filter(s => s.type === 'user-behavior')
      const trialSessions = sessions.filter(s => s.type === 'trial')
      
      const totalEvents = userBehaviorSessions.reduce((sum, s) => sum + (s.eventCount || 0), 0)
      const totalDesigns = trialSessions.reduce((sum, s) => sum + (s.eventCount || 0), 0)
      
      const stats = {
        totalSessions: sessions.length,
        userBehaviorSessions: userBehaviorSessions.length,
        trialSessions: trialSessions.length,
        totalEvents: totalEvents,
        totalDesigns: totalDesigns,
        currentSession: null // Will be set by caller with logger instance
      }
      
      console.log('🔍 Session stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('Failed to get session statistics:', error)
      return {
        totalSessions: 0,
        userBehaviorSessions: 0,
        trialSessions: 0,
        totalEvents: 0,
        totalDesigns: 0,
        currentSession: null // Will be set by caller with logger instance
      }
    }
  }

  // Format timestamp for display
  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Format session duration
  formatDuration(startTimestamp, endTimestamp) {
    if (!startTimestamp || !endTimestamp) return 'Unknown'
    
    const duration = endTimestamp - startTimestamp
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }
}

// Export the class for use with React Context
export { SessionManager }

// Global debug functions for browser console
// Note: These functions now require a sessionManager instance to be passed
if (typeof window !== 'undefined') {
  window.debugSessions = async (sessionManagerInstance) => {
    if (!sessionManagerInstance) {
      console.error('🔍 Error: SessionManager instance required. Usage: debugSessions(sessionManagerInstance)')
      return
    }
    console.log('🔍 Session Manager Debug Information:')
    const stats = await sessionManagerInstance.getSessionStats()
    console.log('🔍 Session stats:', stats)
    const sessions = await sessionManagerInstance.getAllSessions()
    console.log('🔍 All sessions:', sessions)
  }
  
  window.downloadAllSessions = (sessionManagerInstance) => {
    if (!sessionManagerInstance) {
      console.error('🔍 Error: SessionManager instance required. Usage: downloadAllSessions(sessionManagerInstance)')
      return
    }
    sessionManagerInstance.downloadAllSessions()
  }
  
  window.clearAllSessions = (sessionManagerInstance) => {
    if (!sessionManagerInstance) {
      console.error('🔍 Error: SessionManager instance required. Usage: clearAllSessions(sessionManagerInstance)')
      return
    }
    sessionManagerInstance.clearAllSessions()
  }
}
