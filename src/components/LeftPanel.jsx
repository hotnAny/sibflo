import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, X, Plus, Key, Save, Check, Palette, Loader2 } from 'lucide-react'
import { modelService, GEMINI_MODELS } from '../services/model'
import { genDesignSpace } from '../services/generationService'
import { setGeminiModels } from '../services/chains'
import { trialLogger } from '../services/trialLogger'
import './LeftPanel.css'

const LeftPanel = ({ isOpen, onToggle, onDesignSpaceGenerated, formData, onFormDataChange }) => {
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
      <button className={`panel-toggle ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      <div className={`left-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-content">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'design-space' ? 'active' : ''}`} 
              onClick={() => setActiveTab('design-space')}
            >
              Input
            </button>
            <button 
              className={`tab ${activeTab === 'gemini' ? 'active' : ''}`} 
              onClick={() => setActiveTab('gemini')}
            >
              Settings
            </button>
          </div>

          {activeTab === 'design-space' && (
            <>
              {/* <h2>Design Space</h2> */}
              <form onSubmit={handleSubmit} className="design-space-form">
                {/* Context Section */}
                <div className="form-section">
                  <label className="section-label">Context</label>
                  <textarea
                    name="context"
                    value={formData.context}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Provide any relevant contextual information that can help the model understand your design needs ..."
                    rows="4"
                  />
                </div>

                {/* User Section */}
                <div className="form-section">
                  <label className="section-label">User</label>
                  <textarea
                    name="user"
                    value={formData.user}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Describe the target user, their characteristics, needs, and pain points..."
                    rows="2"
                  />
                </div>

                {/* Goal Section */}
                <div className="form-section">
                  <label className="section-label">Goal</label>
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="What is the main objective or outcome the user wants to achieve?"
                    rows="2"
                  />
                </div>

                {/* Tasks Section */}
                <div className="form-section">
                  <label className="section-label">Tasks</label>
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="task-item">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => updateTask(index, e.target.value)}
                        className="form-input"
                        placeholder="What'd users do to achieve the goal?"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="remove-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addTask} className="add-link">
                    <Plus size={16} />
                    Add task
                  </button>
                </div>

                {/* Examples Section */}
                <div className="form-section">
                  <label className="section-label">Examples</label>
                  {formData.examples.map((example, index) => (
                    <div key={index} className="task-item">
                      <input
                        type="text"
                        value={example}
                        onChange={(e) => updateExample(index, e.target.value)}
                        className="form-input"
                        placeholder="Provide a publicly accessible link"
                      />
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="remove-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addExample} className="add-link">
                    <Plus size={16} />
                    Add example
                  </button>
                </div>

                {/* Comments Section */}
                <div className="form-section">
                  <label className="section-label">Comments</label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Enter comments..."
                    rows="3"
                  />
                </div>

                <button type="submit" className="create-btn" disabled={!isApiKeySet || isGeneratingDesignSpace}>
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
              <div className="gemini-settings">
                {/* API Key Section */}
                <div className="form-section">
                  <label className="section-label">
                    <Key size={16} />
                    API Key
                  </label>
                  <div className="api-key-section">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      className="form-input"
                      placeholder="Enter your Gemini API key"
                    />
                    <button
                      type="button"
                      onClick={handleApiKeySubmit}
                      className="save-btn"
                      disabled={!apiKey.trim()}
                    >
                      {apiKeySaved ? <Check size={16} /> : <Save size={16} />}
                      {apiKeySaved ? 'Saved - Reloading...' : 'Save'}
                    </button>
                  </div>
                  {isApiKeySet && (
                    <div className="api-key-status">
                      <span className="status-indicator success">✓ API Key is set</span>
                      <button
                        type="button"
                        onClick={clearApiKey}
                        className="clear-btn"
                      >
                        Clear
                      </button>
                    </div>
                  )}
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