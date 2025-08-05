import { GoogleGenerativeAI } from '@google/generative-ai'

// Model configurations
export const GEMINI_MODELS = {
  modelPro: {
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'Most capable model for complex tasks',
    maxTokens: 8192,
    temperature: 0.7
  },
  modelFlash: {
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Fast and efficient model for most tasks',
    maxTokens: 8192,
    temperature: 0.7
  },
  modelLite: {
    name: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash Lite',
    description: 'Lightweight model for quick responses',
    maxTokens: 4096,
    temperature: 0.7
  }
}

class ModelService {
  constructor() {
    this.apiKey = null
    this.genAI = null
    this.models = {}
  }

  // Initialize the service with API key
  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required to initialize ModelService')
    }
    
    this.apiKey = apiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
    
    // Initialize model instances
    Object.keys(GEMINI_MODELS).forEach(modelKey => {
      const modelConfig = GEMINI_MODELS[modelKey]
      this.models[modelKey] = this.genAI.getGenerativeModel({
        model: modelConfig.name,
        generationConfig: {
          maxOutputTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
        }
      })
    })
  }

  // Get a specific model instance
  getModel(modelKey) {
    if (!this.genAI) {
      throw new Error('ModelService not initialized. Call initialize() with your API key first.')
    }
    
    if (!this.models[modelKey]) {
      throw new Error(`Model ${modelKey} not found. Available models: ${Object.keys(this.models).join(', ')}`)
    }
    
    return this.models[modelKey]
  }

  // Generate content with a specific model
  async generateContent(modelKey, prompt, options = {}) {
    const model = this.getModel(modelKey)
    const modelConfig = GEMINI_MODELS[modelKey]
    
    const generationConfig = {
      maxOutputTokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature || modelConfig.temperature,
      ...options
    }

    try {
      const result = await model.generateContent(prompt, generationConfig)
      const response = await result.response
      return {
        text: response.text(),
        model: modelKey,
        usage: result.usageMetadata || null
      }
    } catch (error) {
      throw new Error(`Failed to generate content with ${modelKey}: ${error.message}`)
    }
  }

  // Generate content with streaming
  async generateContentStream(modelKey, prompt, onChunk, options = {}) {
    const model = this.getModel(modelKey)
    const modelConfig = GEMINI_MODELS[modelKey]
    
    const generationConfig = {
      maxOutputTokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature || modelConfig.temperature,
      ...options
    }

    try {
      const result = await model.generateContentStream(prompt, generationConfig)
      let fullText = ''
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullText += chunkText
        if (onChunk) {
          onChunk(chunkText, fullText)
        }
      }
      
      return {
        text: fullText,
        model: modelKey,
        usage: result.usageMetadata || null
      }
    } catch (error) {
      throw new Error(`Failed to generate content stream with ${modelKey}: ${error.message}`)
    }
  }

  // List available models
  getAvailableModels() {
    return Object.keys(GEMINI_MODELS).map(key => ({
      key,
      ...GEMINI_MODELS[key]
    }))
  }

  // Check if service is initialized
  isInitialized() {
    return this.genAI !== null
  }

  // Get current API key (masked for security)
  getApiKeyStatus() {
    if (!this.apiKey) {
      return { isSet: false, maskedKey: null }
    }
    
    const maskedKey = this.apiKey.length > 8 
      ? `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`
      : '****'
    
    return { isSet: true, maskedKey }
  }

  // Clear the service (remove API key and models)
  clear() {
    this.apiKey = null
    this.genAI = null
    this.models = {}
  }
}

// Create and export a singleton instance
export const modelService = new ModelService()

// Export the class for testing or custom instances
export default ModelService

// Compatibility functions for existing services

/**
 * Get Gemini models for compatibility with chains.js
 * This function is expected by chains.js and generationService.js
 */
export function getGeminiModels(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required to get Gemini models')
  }
  
  // Initialize the model service if not already initialized
  if (!modelService.isInitialized()) {
    modelService.initialize(apiKey)
  }
  
  // Return the models in the format expected by chains.js
  return {
    modelLite: modelService.getModel('modelLite'),
    modelPro: modelService.getModel('modelPro'),
    modelFlash: modelService.getModel('modelFlash')
  }
}

/**
 * Generate image using Gemini (placeholder for compatibility)
 * This function is expected by generationService.js
 */
export async function generateImage(apiKey, prompt) {
  // This is a placeholder implementation
  // In a real implementation, you would use Gemini's image generation capabilities
  console.log('🎨 Image generation requested:', { apiKey: apiKey ? '***' : 'none', prompt })
  
  // Return a placeholder SVG for now
  return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#f0f0f0"/>
    <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#666">
      Generated Image
    </text>
  </svg>`
}

/**
 * Initialize models for the entire application
 * This should be called when the app starts or when the API key changes
 */
export function initializeModels(apiKey) {
  try {
    modelService.initialize(apiKey)
    return true
  } catch (error) {
    console.error('Failed to initialize models:', error)
    return false
  }
}

/**
 * Get the current model service instance
 */
export function getModelService() {
  return modelService
} 