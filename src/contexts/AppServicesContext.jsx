import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { UserBehaviorLogger } from '../services/userBehaviorLogger'
import { SessionManager } from '../services/sessionManager'
import { trialLogger } from '../services/trialLogger'

const AppServicesContext = createContext(null)

export function AppServicesProvider({ children }) {
  const [services, setServices] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const hasInitializedRef = useRef(false)
  
  useEffect(() => {
    // Initialize services when the provider mounts
    const initializeServices = async () => {
      try {
        // Check if we already have initialized services using ref to avoid stale closure issues
        if (hasInitializedRef.current) {
          console.log('🔍 Services already initialized, skipping')
          return
        }
        
        // Clean up existing services if they exist
        if (services?.userBehaviorLogger) {
          services.userBehaviorLogger.destroy()
        }
        
        const newServices = {
          userBehaviorLogger: new UserBehaviorLogger(),
          sessionManager: new SessionManager(),
          trialLogger: trialLogger // Use the existing singleton
        }
        
        // Initialize the user behavior logger
        newServices.userBehaviorLogger.init()
        hasInitializedRef.current = true
        console.log('🔍 App Services initialized via Context Provider')
        
        // Update state to trigger re-render
        setServices(newServices)
      } catch (error) {
        console.error('🔍 Failed to initialize App Services:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    
    initializeServices()
    
    // Cleanup when the provider unmounts
    return () => {
      if (services) {
        services.userBehaviorLogger.destroy()
        console.log('🔍 App Services destroyed via Context Provider')
      }
    }
  }, [])
  
  // Show loading state while services are initializing
  if (isInitializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        🔍 Initializing App Services...
      </div>
    )
  }
  
  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  )
}

// Custom hook to use all services
export function useAppServices() {
  const context = useContext(AppServicesContext)
  if (!context) {
    throw new Error('useAppServices must be used within an AppServicesProvider')
  }
  return context
}

// Individual service hooks
export function useUserBehaviorLogger() {
  const context = useContext(AppServicesContext)
  if (!context) {
    console.error('🔍 Context Error: useUserBehaviorLogger called outside AppServicesProvider')
    throw new Error('useUserBehaviorLogger must be used within an AppServicesProvider')
  }
  if (!context.userBehaviorLogger) {
    console.error('🔍 Service Error: userBehaviorLogger is not available in context')
    throw new Error('userBehaviorLogger service is not available')
  }
  return context.userBehaviorLogger
}

export function useSessionManager() {
  const context = useContext(AppServicesContext)
  if (!context) {
    console.error('🔍 Context Error: useSessionManager called outside AppServicesProvider')
    throw new Error('useSessionManager must be used within an AppServicesProvider')
  }
  if (!context.sessionManager) {
    console.error('🔍 Service Error: sessionManager is not available in context')
    throw new Error('sessionManager service is not available')
  }
  return context.sessionManager
}

export function useTrialLogger() {
  const context = useContext(AppServicesContext)
  if (!context) {
    console.error('🔍 Context Error: useTrialLogger called outside AppServicesProvider')
    throw new Error('useTrialLogger must be used within an AppServicesProvider')
  }
  if (!context.trialLogger) {
    console.error('🔍 Service Error: trialLogger is not available in context')
    throw new Error('trialLogger service is not available')
  }
  return context.trialLogger
}

// Hook for just checking if services are available
export function useAppServicesAvailable() {
  const context = useContext(AppServicesContext)
  return context !== null
}
