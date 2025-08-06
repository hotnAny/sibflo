/**
 * State Storage Service
 * Handles persistence of application state to localStorage
 */

const STORAGE_KEYS = {
  APP_STATE: 'sibflo_app_state',
  CANVAS_STATE: 'sibflo_canvas_state',
  SLIDERS_STATE: 'sibflo_sliders_state',
  UIVIEW_STATE: 'sibflo_uiview_state'
}

class StateStorage {
  /**
   * Save application state to localStorage
   */
  saveAppState(state) {
    try {
      const appState = {
        leftPanelOpen: state.leftPanelOpen,
        sliders: state.sliders,
        designCards: state.designCards,
        currentTrialId: state.currentTrialId,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(appState))
      console.log('💾 App state saved to localStorage')
    } catch (error) {
      console.error('❌ Failed to save app state:', error)
    }
  }

  /**
   * Load application state from localStorage
   */
  loadAppState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APP_STATE)
      if (stored) {
        const appState = JSON.parse(stored)
        console.log('📂 App state loaded from localStorage')
        return {
          leftPanelOpen: appState.leftPanelOpen ?? false,
          sliders: appState.sliders ?? [], // Don't load default sliders, start empty
          designCards: appState.designCards ?? [],
          currentTrialId: appState.currentTrialId ?? null
        }
      }
    } catch (error) {
      console.error('❌ Failed to load app state:', error)
    }
    
    // Return default state if loading fails - no default sliders
    return {
      leftPanelOpen: false,
      sliders: [], // Start with empty sliders until design space is created
      designCards: [],
      currentTrialId: null
    }
  }

  /**
   * Save canvas state to localStorage
   */
  saveCanvasState(state) {
    try {
      const canvasState = {
        zoom: state.zoom,
        position: state.position,
        uiViewOpen: state.uiViewOpen,
        selectedDesign: state.selectedDesign,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.CANVAS_STATE, JSON.stringify(canvasState))
      console.log('💾 Canvas state saved to localStorage')
    } catch (error) {
      console.error('❌ Failed to save canvas state:', error)
    }
  }

  /**
   * Load canvas state from localStorage
   */
  loadCanvasState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CANVAS_STATE)
      if (stored) {
        const canvasState = JSON.parse(stored)
        console.log('📂 Canvas state loaded from localStorage')
        return {
          zoom: canvasState.zoom ?? 1,
          position: canvasState.position ?? { x: 0, y: 0 },
          uiViewOpen: canvasState.uiViewOpen ?? false,
          selectedDesign: canvasState.selectedDesign ?? null
        }
      }
    } catch (error) {
      console.error('❌ Failed to load canvas state:', error)
    }
    
    // Return default state if loading fails
    return {
      zoom: 1,
      position: { x: 0, y: 0 },
      uiViewOpen: false,
      selectedDesign: null
    }
  }

  /**
   * Save sliders component state to localStorage
   */
  saveSlidersState(state) {
    try {
      const slidersState = {
        isCollapsed: state.isCollapsed,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.SLIDERS_STATE, JSON.stringify(slidersState))
      console.log('💾 Sliders state saved to localStorage')
    } catch (error) {
      console.error('❌ Failed to save sliders state:', error)
    }
  }

  /**
   * Load sliders component state from localStorage
   */
  loadSlidersState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SLIDERS_STATE)
      if (stored) {
        const slidersState = JSON.parse(stored)
        console.log('📂 Sliders state loaded from localStorage')
        return {
          isCollapsed: slidersState.isCollapsed ?? false
        }
      }
    } catch (error) {
      console.error('❌ Failed to load sliders state:', error)
    }
    
    // Return default state if loading fails
    return {
      isCollapsed: false
    }
  }

  /**
   * Save UIView component state to localStorage
   */
  saveUIViewState(state) {
    try {
      const uiViewState = {
        selectedTask: state.selectedTask,
        selectedScreen: state.selectedScreen,
        designId: state.designId, // Track which design this state belongs to
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.UIVIEW_STATE, JSON.stringify(uiViewState))
      console.log('💾 UIView state saved to localStorage')
    } catch (error) {
      console.error('❌ Failed to save UIView state:', error)
    }
  }

  /**
   * Load UIView component state from localStorage
   */
  loadUIViewState(designId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.UIVIEW_STATE)
      if (stored) {
        const uiViewState = JSON.parse(stored)
        // Only return state if it matches the current design
        if (uiViewState.designId === designId) {
          console.log('📂 UIView state loaded from localStorage')
          return {
            selectedTask: uiViewState.selectedTask ?? null,
            selectedScreen: uiViewState.selectedScreen ?? null
          }
        } else {
          console.log('🔄 UIView state for different design, using defaults')
        }
      }
    } catch (error) {
      console.error('❌ Failed to load UIView state:', error)
    }
    
    // Return default state if loading fails or design doesn't match
    return {
      selectedTask: null,
      selectedScreen: null
    }
  }

  /**
   * Clear all stored state (useful for debugging or reset functionality)
   */
  clearAllState() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      console.log('🗑️ All stored state cleared')
    } catch (error) {
      console.error('❌ Failed to clear stored state:', error)
    }
  }

  /**
   * Get storage usage info for debugging
   */
  getStorageInfo() {
    try {
      const info = {}
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const stored = localStorage.getItem(key)
        info[name] = {
          exists: !!stored,
          size: stored ? stored.length : 0,
          data: stored ? JSON.parse(stored) : null
        }
      })
      return info
    } catch (error) {
      console.error('❌ Failed to get storage info:', error)
      return {}
    }
  }
}

// Create and export a singleton instance
export const stateStorage = new StateStorage()
export default stateStorage