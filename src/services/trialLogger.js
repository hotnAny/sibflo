// Trial Logger Service
// Handles logging of trials to localStorage

const TRIALS_STORAGE_KEY = 'sibflo_trials'

// Trial structure:
// {
//   id: string,
//   timestamp: number,
//   input: {
//     context: string,
//     user: string,
//     goal: string,
//     tasks: string[],
//     examples: string[],
//     comments: string
//   },
//   designSpace: [
//     {
//       dimension_name: string,
//       dimension_description: string,
//       options: [
//         {
//           option_name: string,
//           option_description: string
//         }
//       ]
//     }
//   ],
//   designs: [
//     {
//       id: string,
//       core_concept: string,
//       design_parameters: [
//         {
//           dimension_description: string,
//           selected_parameter: string,
//           parameter_description: string
//         }
//       ],
//       screens: [
//         {
//           screen_specification: string,
//           ui_code: string
//         }
//       ],
//       taskScreenMapping: object
//     }
//   ]
// }

export class TrialLogger {
  constructor() {
    this.trials = this.loadTrials()
  }

  // Load trials from localStorage
  loadTrials() {
    try {
      const stored = localStorage.getItem(TRIALS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load trials from localStorage:', error)
      return []
    }
  }

  // Save trials to localStorage
  saveTrials() {
    try {
      localStorage.setItem(TRIALS_STORAGE_KEY, JSON.stringify(this.trials))
    } catch (error) {
      console.error('Failed to save trials to localStorage:', error)
    }
  }

  // Create a new trial
  createTrial(input) {
    const trial = {
      id: `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      input: {
        context: input.context || '',
        user: input.user || '',
        goal: input.goal || '',
        tasks: Array.isArray(input.tasks) ? [...input.tasks] : [],
        examples: Array.isArray(input.examples) ? [...input.examples] : [],
        comments: input.comments || ''
      },
      designSpace: [],
      designs: []
    }

    this.trials.push(trial)
    this.saveTrials()
    return trial.id
  }

  // Update trial with design space
  updateTrialDesignSpace(trialId, designSpace) {
    const trial = this.trials.find(t => t.id === trialId)
    if (trial) {
      trial.designSpace = Array.isArray(designSpace) ? [...designSpace] : []
      this.saveTrials()
      return true
    }
    return false
  }

  // Add design to trial
  addDesignToTrial(trialId, design) {
    const trial = this.trials.find(t => t.id === trialId)
    if (trial) {
      const designWithId = {
        id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        core_concept: design.core_concept || design.design_name || '',
        design_parameters: design.design_parameters || [],
        screens: design.screens || [],
        taskScreenMapping: design.taskScreenMapping || {}
      }
      
      trial.designs.push(designWithId)
      this.saveTrials()
      console.log('📊 Added design to trial:', trialId, 'Design ID:', designWithId.id)
      console.log('📊 Design includes:', {
        core_concept: designWithId.core_concept,
        design_parameters_count: designWithId.design_parameters.length,
        screens_count: designWithId.screens.length,
        taskScreenMapping: designWithId.taskScreenMapping
      })
      return designWithId.id
    }
    return null
  }

  // Update design in trial
  updateDesignInTrial(trialId, designId, updatedDesign) {
    const trial = this.trials.find(t => t.id === trialId)
    if (trial) {
      const designIndex = trial.designs.findIndex(d => d.id === designId)
      if (designIndex !== -1) {
        trial.designs[designIndex] = {
          ...trial.designs[designIndex],
          ...updatedDesign
        }
        this.saveTrials()
        console.log('📊 Updated design in trial:', trialId, 'Design ID:', designId)
        return true
      }
    }
    return false
  }

  // Get all trials
  getAllTrials() {
    return [...this.trials]
  }

  // Get trial by ID
  getTrial(trialId) {
    return this.trials.find(t => t.id === trialId)
  }

  // Get latest trial
  getLatestTrial() {
    return this.trials.length > 0 ? this.trials[this.trials.length - 1] : null
  }

  // Delete trial
  deleteTrial(trialId) {
    const index = this.trials.findIndex(t => t.id === trialId)
    if (index !== -1) {
      this.trials.splice(index, 1)
      this.saveTrials()
      return true
    }
    return false
  }

  // Clear all trials
  clearAllTrials() {
    this.trials = []
    this.saveTrials()
  }

  // Export trials as JSON
  exportTrials() {
    return JSON.stringify(this.trials, null, 2)
  }

  // Import trials from JSON
  importTrials(jsonString) {
    try {
      const importedTrials = JSON.parse(jsonString)
      if (Array.isArray(importedTrials)) {
        this.trials = [...importedTrials]
        this.saveTrials()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import trials:', error)
      return false
    }
  }

  // Get trial statistics
  getTrialStats() {
    const totalTrials = this.trials.length
    const totalDesigns = this.trials.reduce((sum, trial) => sum + trial.designs.length, 0)
    const totalDesignSpaces = this.trials.filter(trial => trial.designSpace.length > 0).length

    return {
      totalTrials,
      totalDesigns,
      totalDesignSpaces,
      averageDesignsPerTrial: totalTrials > 0 ? (totalDesigns / totalTrials).toFixed(2) : 0
    }
  }

  // Debug method to log current trials
  debugLogTrials() {
    console.log('📊 Current trials in localStorage:', this.trials)
    console.log('📊 Trial statistics:', this.getTrialStats())
  }

  // Get trial by index (for debugging)
  getTrialByIndex(index) {
    return this.trials[index] || null
  }

  // Get all trial IDs
  getAllTrialIds() {
    return this.trials.map(trial => trial.id)
  }
}

// Create and export a singleton instance
export const trialLogger = new TrialLogger()

// Global debug function for browser console
if (typeof window !== 'undefined') {
  window.debugTrials = () => {
    console.log('📊 Trial Logger Debug Information:')
    console.log('📊 Total trials:', trialLogger.getAllTrials().length)
    console.log('📊 Trial statistics:', trialLogger.getTrialStats())
    console.log('📊 All trial IDs:', trialLogger.getAllTrialIds())
    console.log('📊 Latest trial:', trialLogger.getLatestTrial())
    console.log('📊 All trials:', trialLogger.getAllTrials())
  }
  
  window.exportTrials = () => {
    const trialsJson = trialLogger.exportTrials()
    console.log('📊 Exported trials JSON:')
    console.log(trialsJson)
    return trialsJson
  }
  
  window.clearAllTrials = () => {
    trialLogger.clearAllTrials()
    console.log('📊 All trials cleared')
  }
} 