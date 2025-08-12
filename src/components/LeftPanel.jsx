import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, X, Plus, Key, Save, Check, Palette, Loader2, Download, Trash2, Activity, FileText } from 'lucide-react'
import { modelService, GEMINI_MODELS } from '../services/model'
import { genDesignSpace } from '../services/generationService'
import { setGeminiModels } from '../services/chains'
import { trialLogger } from '../services/trialLogger'
import { useSessionManager } from '../contexts/AppServicesContext'
import './LeftPanel.css'

const LeftPanel = ({ isOpen, onToggle, onDesignSpaceGenerated, formData, onFormDataChange }) => {
  // Get session manager from context
  const sessionManager = useSessionManager()
  
  const [activeTab, setActiveTab] = useState('design-space')
  const [apiKey, setApiKey] = useState('')
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  // const [selectedModel, setSelectedModel] = useState('modelFlash')
  // const [prompt, setPrompt] = useState('')
  // const [response, setResponse] = useState('')
  // const [isLoading, setIsLoading] = useState(false)
  // const [error, setError] = useState('')
  const [isGeneratingDesignSpace, setIsGeneratingDesignSpace] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionStats, setSessionStats] = useState(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('VITE_GEMINI_API_KEY')
    if (storedApiKey) {
      setApiKey(storedApiKey)
      setIsApiKeySet(true)
      // Initialize the model service with the stored API key
      try {
        modelService.initialize(storedApiKey)
        setGeminiModels(storedApiKey)
      } catch (error) {
        console.error('Failed to initialize model service:', error)
      }
    }
  }, [])

  // Load sessions when Settings tab is active
  useEffect(() => {
    if (activeTab === 'gemini') {
      loadSessions()
    }
  }, [activeTab])

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const [allSessions, stats] = await Promise.all([
        sessionManager.getAllSessions(),
        sessionManager.getSessionStats()
      ])
      setSessions(allSessions)
      setSessionStats(stats)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleDownloadAllSessions = async () => {
    try {
      await sessionManager.downloadAllSessions()
    } catch (error) {
      console.error('Failed to download sessions:', error)
    }
  }

  const handleClearAllSessions = async () => {
    if (window.confirm('Are you sure you want to clear all logged sessions? This action cannot be undone.')) {
      try {
        await sessionManager.clearAllSessions()
        await loadSessions() // Reload sessions after clearing
      } catch (error) {
        console.error('Failed to clear sessions:', error)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    onFormDataChange({
      ...formData,
      [name]: value
    })
  }

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value)
    setApiKeySaved(false)
  }

  const handleApiKeySubmit = (e) => {
    e.preventDefault()
    if (apiKey.trim()) {
      localStorage.setItem('VITE_GEMINI_API_KEY', apiKey.trim())
      setIsApiKeySet(true)
      setApiKeySaved(true)
      // Initialize the model service with the new API key
      try {
        modelService.initialize(apiKey.trim())
        setGeminiModels(apiKey.trim())
        // Show success message and reload the page after 1 second
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (err) {
        console.error('Failed to initialize model service:', err)
      }
      // Clear the saved message after 3 seconds (but page will reload before this)
      setTimeout(() => setApiKeySaved(false), 3000)
    }
  }

  const clearApiKey = () => {
    localStorage.removeItem('VITE_GEMINI_API_KEY')
    setApiKey('')
    setIsApiKeySet(false)
    setApiKeySaved(false)
    modelService.clear()
    // setError('')
    // Reload the page after clearing the API key
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // const handleModelSubmit = async (e) => {
  //   e.preventDefault()
  //   if (!prompt.trim()) return

  //   setIsLoading(true)
  //   setError('')
  //   setResponse('')

  //   try {
  //     if (!modelService.isInitialized()) {
  //       throw new Error('Model service not initialized. Please set your API key first.')
  //     }

  //     const result = await modelService.generateContent(selectedModel, prompt.trim())
  //     setResponse(result.text)
  //   } catch (error) {
  //     setError(error.message)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // const handleStreamSubmit = async (e) => {
  //   e.preventDefault()
  //   if (!prompt.trim()) return

  //   setIsLoading(true)
  //   setError('')
  //   setResponse('')

  //   try {
  //     if (!modelService.isInitialized()) {
  //       throw new Error('Model service not initialized. Please set your API key first.')
  //     }

  //     await modelService.generateContentStream(
  //       selectedModel,
  //       prompt.trim(),
  //       (chunk, fullText) => {
  //         setResponse(fullText)
  //       }
  //     )
  //   } catch (error) {
  //     setError(error.message)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const addTask = () => {
    onFormDataChange({
      ...formData,
      tasks: [...formData.tasks, '']
    })
  }

  const updateTask = (index, value) => {
    onFormDataChange({
      ...formData,
      tasks: formData.tasks.map((task, i) => i === index ? value : task)
    })
  }

  const removeTask = (index) => {
    onFormDataChange({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index)
    })
  }

  const addExample = () => {
    onFormDataChange({
      ...formData,
      examples: [...formData.examples, '']
    })
  }

  const updateExample = (index, value) => {
    onFormDataChange({
      ...formData,
      examples: formData.examples.map((example, i) => i === index ? value : example)
    })
  }

  const removeExample = (index) => {
    onFormDataChange({
      ...formData,
      examples: formData.examples.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isApiKeySet) {
      // setError('Please set your API key first.')
      return
    }

    setIsGeneratingDesignSpace(true)
    // setError('')
    // setResponse('')

    try {
      if (!modelService.isInitialized()) {
        throw new Error('Model service not initialized. Please set your API key first.')
      }

      // Create a new trial
      const trialId = trialLogger.createTrial({
        context: formData.context,
        user: formData.user,
        goal: formData.goal,
        tasks: formData.tasks,
        examples: formData.examples,
        comments: formData.comments
      })
      console.log('📊 Created new trial:', trialId)

      const result = await genDesignSpace({
        context: formData.context,
        user: formData.user,
        goal: formData.goal,
        tasks: formData.tasks,
        examples: formData.examples,
        userComments: formData.comments
      })

      // Convert design space dimensions to sliders
      if (result && result.designSpace && Array.isArray(result.designSpace)) {
        // Update trial with design space
        trialLogger.updateTrialDesignSpace(trialId, result.designSpace)
        console.log('📊 Updated trial with design space:', trialId)

        const newSliders = result.designSpace.map((dimension, index) => {
          // Create a slider for each dimension
          const options = dimension.options || []
          const maxValue = Math.max(options.length - 1, 0)
          
          return {
            id: Date.now() + index,
            label: dimension.dimension_name || `Dimension ${index + 1}`,
            value: 0, // Start at the first option
            min: 0,
            max: maxValue,
            dimension: dimension,
            options: options
          }
        })

        // Call the parent component to update sliders
        if (onDesignSpaceGenerated) {
          onDesignSpaceGenerated(newSliders, trialId)
        }

        // setResponse(`Generated ${newSliders.length} design space dimensions:\n${JSON.stringify(result.designSpace, null, 2)}`)
      } else {
        throw new Error('Invalid design space result')
      }
    } catch (error) {
      // setError(error.message)
      console.error('Error generating design space:', error)
    } finally {
      setIsGeneratingDesignSpace(false)
    }
  }

  return (
    <>
      <button className={`panel-toggle ${isOpen ? 'open' : ''}`} onClick={onToggle} activity="toggle left panel visibility">
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      <div className={`left-panel ${isOpen ? 'open' : ''}`} activity="left panel container">
        <div className="panel-content" activity="panel content wrapper">
          <div className="tabs" activity="tab navigation container">
            <button 
              className={`tab ${activeTab === 'design-space' ? 'active' : ''}`} 
              onClick={() => setActiveTab('design-space')}
              activity="switch to design space input tab"
            >
              Input
            </button>
            <button 
              className={`tab ${activeTab === 'gemini' ? 'active' : ''}`} 
              onClick={() => setActiveTab('gemini')}
              activity="switch to gemini settings tab"
            >
              Settings
            </button>
          </div>

          {activeTab === 'design-space' && (
            <>
              {/* <h2>Design Space</h2> */}
              <form onSubmit={handleSubmit} className="design-space-form" activity="design space generation form">
                {/* Context Section */}
                <div className="form-section" activity="context input section">
                  <label className="section-label" activity="context section label">Context</label>
                  <textarea
                    name="context"
                    value={formData.context}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Provide any relevant contextual information that can help the model understand your design needs ..."
                    rows="4"
                    activity="input contextual information for design needs"
                  />
                </div>

                {/* User Section */}
                <div className="form-section" activity="user input section">
                  <label className="section-label" activity="user section label">User</label>
                  <textarea
                    name="user"
                    value={formData.user}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Describe the target user, their characteristics, needs, and pain points..."
                    rows="2"
                    activity="input target user description and characteristics"
                  />
                </div>

                {/* Goal Section */}
                <div className="form-section" activity="goal input section">
                  <label className="section-label" activity="goal section label">Goal</label>
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="What is the main objective or outcome the user wants to achieve?"
                    rows="2"
                    activity="input main objective or outcome description"
                  />
                </div>

                {/* Tasks Section */}
                <div className="form-section" activity="tasks input section">
                  <label className="section-label" activity="tasks section label">Tasks</label>
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="task-item" activity="individual task input container">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => updateTask(index, e.target.value)}
                        className="form-input"
                        placeholder="What'd users do to achieve the goal?"
                        activity="input information about task"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="remove-btn"
                        activity="remove task from list"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addTask} className="add-link" activity="add new task to list">
                    <Plus size={16} />
                    Add task
                  </button>
                </div>

                {/* Examples Section */}
                <div className="form-section" activity="examples input section">
                  <label className="section-label" activity="examples section label">Examples</label>
                  {formData.examples.map((example, index) => (
                    <div key={index} className="task-item" activity="individual example input container">
                      <input
                        type="text"
                        value={example}
                        onChange={(e) => updateExample(index, e.target.value)}
                        className="form-input"
                        placeholder="Provide a publicly accessible link"
                        activity="input publicly accessible example link"
                      />
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="remove-btn"
                        activity="remove example from list"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addExample} className="add-link" activity="add new example to list">
                    <Plus size={16} />
                    Add example
                  </button>
                </div>

                {/* Comments Section */}
                <div className="form-section" activity="comments input section">
                  <label className="section-label" activity="comments section label">Comments</label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Enter comments..."
                    rows="3"
                    activity="input additional comments or notes"
                  />
                </div>

                <button type="submit" className="create-btn" disabled={!isApiKeySet || isGeneratingDesignSpace} activity="submit form to generate design space">
                  {isGeneratingDesignSpace ? <Loader2 size={16} className="spinner" /> : <Palette size={16} />}
                  &nbsp;&nbsp;
                  {isGeneratingDesignSpace ? 'Generating...' : 'Generate Design Space'}
                </button>
              </form>
            </>
          )}

          {activeTab === 'gemini' && (
            <>
              {/* <h2>Settings</h2> */}
              <div className="gemini-settings" activity="gemini settings configuration">
                {/* API Key Section */}
                <div className="form-section" activity="api key configuration section">
                  <label className="section-label" activity="api key section label">
                    <Key size={16} />
                    API Key
                  </label>
                  <div className="api-key-section" activity="api key input and save container">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      className="form-input"
                      placeholder="Enter your Gemini API key"
                      activity="input gemini api key securely"
                    />
                    <button
                      type="button"
                      onClick={handleApiKeySubmit}
                      className="save-btn"
                      disabled={!apiKey.trim()}
                      activity="save and apply api key"
                    >
                      {apiKeySaved ? <Check size={16} /> : <Save size={16} />}
                      {apiKeySaved ? 'Saved - Reloading...' : 'Save'}
                    </button>
                  </div>
                  {isApiKeySet && (
                    <div className="api-key-status" activity="api key status display">
                      <span className="status-indicator success" activity="api key success status">✓ API Key is set</span>
                      <button
                        type="button"
                        onClick={clearApiKey}
                        className="clear-btn"
                        activity="clear stored api key"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Sessions Management Section */}
                <div className="form-section" activity="sessions management section">
                  <label className="section-label" activity="sessions section label">
                    <Activity size={16} />
                    Logged Sessions
                  </label>
                  
                  {/* Session Statistics */}
                  {/* {sessionStats && (
                    <div className="session-stats" activity="session statistics display">
                      <div className="stat-item">
                        <span className="stat-label">Total Sessions:</span>
                        <span className="stat-value">{sessionStats.totalSessions}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">User Behavior:</span>
                        <span className="stat-value">{sessionStats.userBehaviorSessions}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Trials:</span>
                        <span className="stat-value">{sessionStats.trialSessions}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Events:</span>
                        <span className="stat-value">{sessionStats.totalEvents}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Designs:</span>
                        <span className="stat-value">{sessionStats.totalDesigns}</span>
                      </div>
                    </div>
                  )} */}

                  {/* Session Actions */}
                  <div className="session-actions" activity="session management actions">
                    <button
                      type="button"
                      onClick={loadSessions}
                      className="refresh-btn"
                      activity="refresh sessions list"
                    >
                      <Loader2 size={16} />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadAllSessions}
                      className="download-btn"
                      disabled={sessions.length === 0}
                      activity="download all logged sessions"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllSessions}
                      className="clear-sessions-btn"
                      disabled={sessions.length === 0}
                      activity="clear all logged sessions"
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                  </div>

                  {/* Sessions List */}
                  <div className="sessions-list" activity="logged sessions list">
                    <div className="sessions-header">
                      <h3>Recent Sessions</h3>
                      {isLoadingSessions && <Loader2 size={16} className="spinner" />}
                    </div>
                    
                    {sessions.length === 0 ? (
                      <div className="no-sessions" activity="no sessions message">
                        {isLoadingSessions ? 'Loading sessions...' : 'No logged sessions found'}
                      </div>
                    ) : (
                      <div className="sessions-container">
                        {sessions.slice(0, 10).map((session) => (
                          <div key={session.id} className="session-item" activity="individual session display">
                            <div className="session-header">
                              <div className="session-type">
                                {session.type === 'user-behavior' ? (
                                  <Activity size={14} className="session-icon behavior" />
                                ) : (
                                  <FileText size={14} className="session-icon trial" />
                                )}
                                <span className="session-type-label">
                                  {session.type === 'user-behavior' ? 'User Behavior' : 'Trial'}
                                </span>
                              </div>
                              <span className="session-time">
                                {sessionManager.formatTimestamp(session.timestamp)}
                              </span>
                            </div>
                            <div className="session-details">
                              <span className="session-id">ID: {session.id.substring(0, 8)}...</span>
                              <span className="session-count">
                                {session.type === 'user-behavior' 
                                  ? `${session.eventCount} events`
                                  : `${session.eventCount} designs`
                                }
                              </span>
                            </div>
                            {session.type === 'user-behavior' && session.endTimestamp && (
                              <div className="session-duration">
                                Duration: {sessionManager.formatDuration(session.timestamp, session.endTimestamp)}
                              </div>
                            )}
                          </div>
                        ))}
                        {sessions.length > 10 && (
                          <div className="more-sessions" activity="more sessions indicator">
                            +{sessions.length - 10} more sessions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default LeftPanel 