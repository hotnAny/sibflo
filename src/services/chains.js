import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getGeminiModels } from "./model.js";
import { promptOverallDesign, promptTaskwiseScreenDescriptionsGeneration, promptMergeScreenDescriptions, promptTaskScreenMapping, promptSVGCodeGeneration, promptTaskFlowGeneration, promptCritiqueToChanges, promptApplyChangesToSVG, promptDivergentIdeasGeneration, promptDesignSpaceFromIdeas } from "./prompts.js";

// Mutable references to models
let modelLite = null;
let modelPro = null;
let modelFlash = null;

// Call this at app startup or when API key changes
export function setGeminiModels(apiKey) {
  try {
    const models = getGeminiModels(apiKey);
    if (models.modelLite) modelLite = models.modelLite;
    if (models.modelPro) modelPro = models.modelPro;
    if (models.modelFlash) modelFlash = models.modelFlash;
  } catch (error) {
    console.error('Failed to set Gemini models:', error);
  }
}

export { modelLite, modelPro, modelFlash };

// Compatibility layer for LangChain integration
class GeminiModelAdapter {
  constructor(geminiModel) {
    this.geminiModel = geminiModel;
  }

  async invoke(input) {
    if (typeof input === 'string') {
      const result = await this.geminiModel.generateContent(input);
      const response = await result.response;
      return response.text();
    } else if (typeof input === 'object' && input.prompt) {
      // Handle prompt template output
      const result = await this.geminiModel.generateContent(input.prompt);
      const response = await result.response;
      return response.text();
    } else {
      throw new Error('Unsupported input type for GeminiModelAdapter');
    }
  }
}

// Create adapted models for LangChain compatibility
export function createAdaptedModels() {
  if (!modelLite || !modelPro || !modelFlash) {
    throw new Error('Models not initialized. Call setGeminiModels() first.');
  }
  
  return {
    modelLite: new GeminiModelAdapter(modelLite),
    modelPro: new GeminiModelAdapter(modelPro),
    modelFlash: new GeminiModelAdapter(modelFlash)
  };
}

/**
 * Converts a JSON string to a JSON object, handling common issues like markdown code blocks
 * and malformed JSON. Returns the parsed object or throws an error if parsing fails.
 * 
 * @param {string} jsonString - The JSON string to parse
 * @param {string} context - Context for error messages (e.g., "screen descriptions")
 * @returns {any} The parsed JSON object
 * @throws {Error} If parsing fails
 */
const _parseJsonString = (jsonString, context = "JSON") => {
    if (typeof jsonString !== 'string') {
        throw new Error(`${context} must be a string`);
    }

    // Remove markdown code block markers
    const cleanedInput = jsonString.replace(/```[\w-]*\n|```/g, '');
    
    try {
        // Try direct parsing first
        const result = JSON.parse(cleanedInput);
        return result;
    } catch {
        // Special handling for task flow context - SVG strings often have unescaped quotes
        if (context === "task flow") {
            // Strategy 1: Try to extract array of SVG strings with better quote handling
            const svgArrayMatch = cleanedInput.match(/\[\s*"[^"]*(?:\\"[^"]*)*"\s*(?:,\s*"[^"]*(?:\\"[^"]*)*"\s*)*\]/);
            if (svgArrayMatch) {
                try {
                    // Try to fix common SVG quote issues
                    let fixedInput = svgArrayMatch[0];
                    
                    // Replace problematic quote patterns in SVG content
                    fixedInput = fixedInput.replace(/(?<!\\)"/g, '\\"'); // Escape unescaped quotes
                    fixedInput = fixedInput.replace(/\\\\"/g, '\\"'); // Fix double-escaped quotes
                    
                    const parsed = JSON.parse(fixedInput);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch {
                    // Strategy 2: Try to extract individual SVG strings and build array
                    const svgStringMatches = cleanedInput.match(/"<svg[^"]*(?:\\"[^"]*)*">/g);
                    if (svgStringMatches) {
                        const validSvgStrings = [];
                        
                        for (const match of svgStringMatches) {
                            try {
                                // Extract the SVG content and try to parse it
                                const svgContent = match.substring(1); // Remove leading quote
                                // Find the closing quote by looking for the last quote before the closing bracket
                                const closingQuoteIndex = svgContent.lastIndexOf('"');
                                if (closingQuoteIndex > 0) {
                                    const completeSvgString = svgContent.substring(0, closingQuoteIndex);
                                    validSvgStrings.push(completeSvgString);
                                }
                            } catch {
                                continue;
                            }
                        }
                        
                        if (validSvgStrings.length > 0) {
                            return validSvgStrings;
                        }
                    }
                    
                    // Strategy 3: Try to extract objects with screen_index and highlighted_ui_code
                    const objectMatches = cleanedInput.match(/\{\s*"[^"]+"\s*:\s*[^,}]+\s*,\s*"[^"]+"\s*:\s*"[^"]*(?:\\"[^"]*)*"\s*\}/g);
                    if (objectMatches) {
                        const validObjects = [];
                        
                        for (const match of objectMatches) {
                            try {
                                // Try to fix quote issues in the object
                                let fixedMatch = match;
                                // Replace problematic quotes in SVG content while preserving JSON structure
                                fixedMatch = fixedMatch.replace(/(?<!\\\\)"(?=.*highlighted_ui_code)/g, '\\"');
                                
                                const parsed = JSON.parse(fixedMatch);
                                if (parsed && typeof parsed === 'object' && parsed.highlighted_ui_code) {
                                    validObjects.push(parsed);
                                }
                            } catch {
                                continue;
                            }
                        }
                        
                        if (validObjects.length > 0) {
                            return validObjects;
                        }
                    }
                }
            }
            
            // Strategy 4: Try to find and extract the largest valid JSON array (original logic)
            const jsonArrayMatch = cleanedInput.match(/\[\s*\{[\s\S]*?\}\s*\]/g);
            if (jsonArrayMatch) {
                // Sort by length to get the largest (most complete) match
                jsonArrayMatch.sort((a, b) => b.length - a.length);
                
                for (const match of jsonArrayMatch) {
                    try {
                        const parsed = JSON.parse(match);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed;
                        }
                    } catch {
                        continue; // Try next match
                    }
                }
            }
            
            // Strategy 5: Try to extract individual objects and build array (original logic)
            const objectMatches = cleanedInput.match(/\{\s*"[^"]+"\s*:\s*"[^"]*"[\s\S]*?\}/g);
            if (objectMatches) {
                const validObjects = [];
                for (const match of objectMatches) {
                    try {
                        const parsed = JSON.parse(match);
                        if (parsed && typeof parsed === 'object') {
                            validObjects.push(parsed);
                        }
                    } catch {
                        continue;
                    }
                }
                if (validObjects.length > 0) {
                    return validObjects;
                }
            }
            
            // Strategy 6: Try to fix common truncation issues (original logic)
            const lastCompleteObject = cleanedInput.match(/.*\}(\s*,\s*)?$/);
            if (lastCompleteObject) {
                const truncatedInput = cleanedInput.substring(0, lastCompleteObject.index + 1) + ']';
                try {
                    const parsed = JSON.parse(truncatedInput);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch {
                    // Last resort: try to manually construct a minimal valid array
                    const manualMatch = cleanedInput.match(/\{\s*"[^"]+"\s*:\s*"[^"]*"[\s\S]*?\}/);
                    if (manualMatch) {
                        try {
                            const singleObject = JSON.parse(manualMatch[0]);
                            return [singleObject];
                        } catch {
                            // Give up
                        }
                    }
                }
            }
        }
        
        // console.error(`❌ Error extracting JSON from ${context}:`, parseError);
        throw new Error(`Failed to extract valid JSON from ${context}`);
    }
};

const _generateTaskScreenDescriptions = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateTaskScreenDescriptions - RAW INPUT:', {input: input});
    
    // Verify that input.tasks is an array
    if (!Array.isArray(input.tasks)) {
        throw new Error('input.tasks must be an array');
    }

    const individualTasks = input.tasks;

    // Process tasks sequentially to avoid token limit issues
    const taskScreenDescriptions = [];
    
    for (let index = 0; index < individualTasks.length; index++) {
        const task = individualTasks[index];
        
        try {
            const taskInput = {
                overallDesign: input.overallDesign,
                tasks: task
            };
            
            // Use the adapted model directly
            const adaptedModels = createAdaptedModels();
            const prompt = await promptTaskwiseScreenDescriptionsGeneration.format(taskInput);
            const screenDescription = await adaptedModels.modelLite.invoke(prompt);
            
            taskScreenDescriptions.push({
                task,
                screenDescription
            });
        } catch (error) {
            // Continue with other tasks even if one fails
            taskScreenDescriptions.push({
                task,
                screenDescription: `Error generating screen descriptions for this task: ${error.message}`
            });
        }
    }

    const result = {
        tasks: input.tasks,
        screenDescriptions: taskScreenDescriptions
    };
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`📝 Generated screen descriptions for ${individualTasks.length} tasks in ${duration}ms`);
    console.log('🔗 Chain: _generateTaskScreenDescriptions - RAW OUTPUT:', result);
    return result;
};

const _mergeScreenDescriptions = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _mergeScreenDescriptions - RAW INPUT:', {input: input});
    
    // Validate input
    if (!input || !input.screenDescriptions) {
        throw new Error('input.screenDescriptions is required');
    }
    
    // Format screen descriptions for the LLM
    const formattedScreenDescriptions = input.screenDescriptions.map((item, index) => {
        return `Task ${index + 1}: ${item.task}\nScreen Description: ${item.screenDescription}`;
    }).join('\n\n');
    
    // Use the adapted model directly
    const adaptedModels = createAdaptedModels();
    const prompt = await promptMergeScreenDescriptions.format({
        screenDescriptions: formattedScreenDescriptions
    });
    const mergedDescriptions = await adaptedModels.modelLite.invoke(prompt);
    
    // Parse the merged descriptions into a structured format
    // The LLM output should be a list of screen descriptions that we can parse
    let structuredScreenDescriptions = [];
    
    try {
        // Try to parse as JSON first (in case the LLM returns structured format)
        const parsedDescriptions = _parseJsonString(mergedDescriptions, "merged screen descriptions");
        if (Array.isArray(parsedDescriptions)) {
            structuredScreenDescriptions = parsedDescriptions;
        } else {
            throw new Error("Parsed descriptions is not an array");
        }
    } catch {
        // If JSON parsing fails, try to extract screen descriptions from natural language
        console.log('⚠️ Failed to parse merged descriptions as JSON, attempting to extract from natural language');
        
        // Split by common screen separators and extract screen information
        const screenBlocks = mergedDescriptions.split(/(?=^|\n)(?:Screen|Screen \d+|^\d+\.|^[-*]\s)/m).filter(block => block.trim());
        
        structuredScreenDescriptions = screenBlocks.map((block, index) => {
            const lines = block.trim().split('\n').filter(line => line.trim());
            
            // Extract title from first line
            let title = `Screen ${index + 1}`;
            let purpose = '';
            let coreElements = [];
            let keyInteractions = [];
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.toLowerCase().includes('title:') || trimmedLine.toLowerCase().includes('name:')) {
                    title = trimmedLine.split(/[:：]/).slice(1).join(':').trim();
                } else if (trimmedLine.toLowerCase().includes('purpose:') || trimmedLine.toLowerCase().includes('goal:')) {
                    purpose = trimmedLine.split(/[:：]/).slice(1).join(':').trim();
                } else if (trimmedLine.toLowerCase().includes('elements:') || trimmedLine.toLowerCase().includes('components:')) {
                    const elementsText = trimmedLine.split(/[:：]/).slice(1).join(':').trim();
                    coreElements = elementsText.split(/[,，;；]/).map(e => e.trim()).filter(e => e);
                } else if (trimmedLine.toLowerCase().includes('interactions:') || trimmedLine.toLowerCase().includes('actions:')) {
                    const interactionsText = trimmedLine.split(/[:：]/).slice(1).join(':').trim();
                    keyInteractions = interactionsText.split(/[,，;；]/).map(i => i.trim()).filter(i => i);
                }
            });
            
            return {
                title: title || `Screen ${index + 1}`,
                purpose: purpose || 'Screen purpose not specified',
                core_elements: coreElements.length > 0 ? coreElements : ['Core elements not specified'],
                key_interactions: keyInteractions.length > 0 ? keyInteractions : ['Key interactions not specified']
            };
        });
        
        // If we couldn't extract structured data, create a fallback
        if (structuredScreenDescriptions.length === 0) {
            console.warn('⚠️ Could not extract structured screen descriptions, creating fallback');
            structuredScreenDescriptions = [{
                title: 'Main Screen',
                purpose: 'Primary application screen',
                core_elements: ['Core functionality elements'],
                key_interactions: ['Primary user interactions']
            }];
        }
    }
    
    const result = {
        tasks: input.tasks,
        screenDescriptions: structuredScreenDescriptions
    };
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🔗 Merged screen descriptions in ${duration}ms`);
    console.log('🔗 Chain: _mergeScreenDescriptions - RAW OUTPUT:', result);
    return result;
};

// const _formatScreenDescriptions = async (input) => {
//     const startTime = Date.now();
//     console.log('🔗 Chain: _formatScreenDescriptions - RAW INPUT:', {input: input});
    
//     const formattedScreenDescriptions = await RunnableSequence.from([
//         new RunnableLambda({
//             func: async (input) => input
//         }),
//         promptScreenDescriptionsFormatting,
//         modelLite,
//         new StringOutputParser()
//     ]).invoke({
//         screenDescriptions: input.screenDescriptions
//     });
//     const cleanedFormattedScreenDescriptions = _parseJsonString(formattedScreenDescriptions, "formatted screen descriptions");
    
//     const result = {
//         tasks: input.tasks,
//         screenDescriptions: cleanedFormattedScreenDescriptions
//     };
    
//     const endTime = Date.now();
//     const duration = endTime - startTime;
//     console.log(`📋 Formatted screen descriptions in ${duration}ms`);
//     console.log('🔗 Chain: _formatScreenDescriptions - RAW OUTPUT:', result);
//     return result;
// };

const _generateUICodes = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateUICodes - RAW INPUT:', {input: input});
    
    // Verify that input.screenDescriptions is an array
    if (!Array.isArray(input.screenDescriptions)) {
        throw new Error('input.screenDescriptions must be an array');
    }
    
    const screens = input.screenDescriptions;
    const useLite = input.useLite;

    // Create parallel promises for UI code generation
    const uiCodePromises = screens.map(async (screen, index) => {
        try {
            // Use the adapted model directly
            const adaptedModels = createAdaptedModels();
            const prompt = await promptSVGCodeGeneration.format({
                screenDescription: JSON.stringify(screen, null, 2)
            });
            const model = useLite ? adaptedModels.modelLite : adaptedModels.modelPro;
            const code = await model.invoke(prompt);
            const cleanedCode = code.replace(/```[\w-]*\n|```/g, '');
            return {
                screenIndex: index,
                code: cleanedCode
            };
        } catch (error) {
            console.error(`Error generating UI code for screen ${index}:`, error);
            return {
                screenIndex: index,
                code: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="300" fill="#f0f0f0"/>
                    <text x="200" y="150" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#666">
                        Error generating UI code
                    </text>
                </svg>`
            };
        }
    });

    // Wait for all parallel UI code generations to complete
    const uiCodes = await Promise.all(uiCodePromises);

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🎨 Generated UI codes for ${screens.length} screens in ${duration}ms`);
    console.log('🔗 Chain: _generateUICodes - RAW OUTPUT:', uiCodes);
    return uiCodes;
};



const _generateUICodeRevision = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateUICodeRevision - RAW INPUT:', {input: input});
    
    // Verify that input has the required properties
    if (!input.originalUICode || !input.critiques) {
        throw new Error('input must contain originalUICode and critiques');
    }
    
    // Step 1: Translate critiques into concrete changes
    const adaptedModels = createAdaptedModels();
    const changesPrompt = await promptCritiqueToChanges.format({
        originalUICode: input.originalUICode,
        critiques: JSON.stringify(input.critiques, null, 2)
    });
    const changesResponse = await adaptedModels.modelLite.invoke(changesPrompt);

    // Parse the changes JSON
    let changes;
    try {
        // Clean the response to remove markdown code blocks
        const cleanedChangesResponse = changesResponse.replace(/```[\w-]*\n|```/g, '');
        changes = JSON.parse(cleanedChangesResponse);
    } catch (parseError) {
        throw new Error(`Failed to parse changes JSON: ${parseError.message}`);
    }

    // Step 2: Apply the changes to the SVG
    const revisionPrompt = await promptApplyChangesToSVG.format({
        originalUICode: input.originalUICode,
        changes: JSON.stringify(changes, null, 2)
    });
    const revision = await adaptedModels.modelFlash.invoke(revisionPrompt);

    const cleanedRevision = revision.replace(/```[\w-]*\n|```/g, '');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✏️ Revised UI code based on ${input.critiques.length} critiques in ${duration}ms`);
    console.log('🔗 Chain: _generateUICodeRevision - RAW OUTPUT:', cleanedRevision);
    return cleanedRevision;
};

const _mapTasksToScreens = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _mapTasksToScreens - RAW INPUT:', {input: input});
    
    // Validate input
    if (!input.tasks || !Array.isArray(input.tasks) || input.tasks.length === 0) {
        throw new Error('input.tasks must be a non-empty array');
    }
    
    if (!input.screenDescriptions || !Array.isArray(input.screenDescriptions) || input.screenDescriptions.length === 0) {
        throw new Error('input.screenDescriptions must be a non-empty array');
    }
    
    const adaptedModels = createAdaptedModels();
    const prompt = await promptTaskScreenMapping.format({
        tasks: input.tasks,
        screenDescriptions: input.screenDescriptions
    });
    const taskScreenMapping = await adaptedModels.modelLite.invoke(prompt);

    // Log the raw response for debugging
    console.log('🔗 Chain: _mapTasksToScreens - RAW LLM RESPONSE:', {taskScreenMapping: taskScreenMapping});
    console.log('🔗 Chain: _mapTasksToScreens - RAW LLM RESPONSE TYPE:', typeof taskScreenMapping);
    console.log('🔗 Chain: _mapTasksToScreens - RAW LLM RESPONSE LENGTH:', taskScreenMapping?.length);
    console.log('🔗 Chain: _mapTasksToScreens - RAW LLM RESPONSE PREVIEW:', taskScreenMapping?.substring(0, 500));

    // Check if the response is empty or just whitespace
    if (!taskScreenMapping || taskScreenMapping.trim() === '') {
        console.warn('⚠️ LLM returned empty response for task screen mapping, creating fallback mapping');
        
        // Create a fallback mapping where each task uses the first screen
        const fallbackMapping = input.tasks.map((task) => ({
            task: task,
            screens: [
                {
                    screen_id: 0,
                    interaction: `Complete task: ${task}`
                }
            ]
        }));
        
        const result = {
            screenDescriptions: input.screenDescriptions,
            taskScreenMapping: fallbackMapping
        };
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`🗺️ Created fallback mapping for ${input.tasks.length} tasks in ${duration}ms`);
        console.log('🔗 Chain: _mapTasksToScreens - FALLBACK OUTPUT:', result);
        return result;
    }

    // Parse task screen mapping using the utility function
    let cleanedTaskScreenMapping;
    try {
        console.log('🔍 Attempting to parse taskScreenMapping with _parseJsonString:', {
            taskScreenMapping,
            taskScreenMappingType: typeof taskScreenMapping,
            taskScreenMappingLength: taskScreenMapping?.length
        });
        cleanedTaskScreenMapping = _parseJsonString(taskScreenMapping, "task screen mapping");
        console.log('✅ Successfully parsed taskScreenMapping:', cleanedTaskScreenMapping);
    } catch {
        console.error('❌ Failed to parse task screen mapping JSON:');
        console.error('❌ Raw LLM response:', taskScreenMapping);
        
        // Create a fallback mapping where each task uses the first screen
        const fallbackMapping = input.tasks.map((task) => ({
            task: task,
            screens: [
                {
                    screen_id: 0,
                    interaction: `Complete task: ${task}`
                }
            ]
        }));
        
        const result = {
            screenDescriptions: input.screenDescriptions,
            taskScreenMapping: fallbackMapping
        };
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`🗺️ Created fallback mapping after JSON parse error in ${duration}ms`);
        console.log('🔗 Chain: _mapTasksToScreens - FALLBACK OUTPUT:', result);
        return result;
    }

    // Extract the tasksWithScreens array from the parsed response
    console.log('🔍 cleanedTaskScreenMapping structure:', {
        cleanedTaskScreenMapping,
        cleanedTaskScreenMappingType: typeof cleanedTaskScreenMapping,
        cleanedTaskScreenMappingKeys: cleanedTaskScreenMapping && typeof cleanedTaskScreenMapping === 'object' ? Object.keys(cleanedTaskScreenMapping) : 'not object',
        hasTasksWithScreens: cleanedTaskScreenMapping && cleanedTaskScreenMapping.tasksWithScreens ? true : false,
        tasksWithScreensValue: cleanedTaskScreenMapping?.tasksWithScreens,
        objectValues: cleanedTaskScreenMapping && typeof cleanedTaskScreenMapping === 'object' ? Object.values(cleanedTaskScreenMapping) : 'not object'
    });
    
    const taskScreenMappingArray = cleanedTaskScreenMapping.tasksWithScreens || Object.values(cleanedTaskScreenMapping)[0] || [];
    
    console.log('🔍 taskScreenMappingArray extraction result:', {
        taskScreenMappingArray,
        taskScreenMappingArrayType: typeof taskScreenMappingArray,
        taskScreenMappingArrayLength: Array.isArray(taskScreenMappingArray) ? taskScreenMappingArray.length : 'not array'
    });

    // Validate the extracted mapping
    if (!Array.isArray(taskScreenMappingArray) || taskScreenMappingArray.length === 0) {
        console.warn('⚠️ Extracted task screen mapping is not a valid array, creating fallback mapping');
        
        // Create a fallback mapping where each task uses the first screen
        const fallbackMapping = input.tasks.map((task) => ({
            task: task,
            screens: [
                {
                    screen_id: 0,
                    interaction: `Complete task: ${task}`
                }
            ]
        }));
        
        const result = {
            screenDescriptions: input.screenDescriptions,
            taskScreenMapping: fallbackMapping
        };
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`🗺️ Created fallback mapping for invalid array in ${duration}ms`);
        console.log('🔗 Chain: _mapTasksToScreens - FALLBACK OUTPUT:', result);
        return result;
    }

    const result = {
        screenDescriptions: input.screenDescriptions,
        taskScreenMapping: taskScreenMappingArray
    };
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🗺️ Mapped ${input.tasks.length} tasks to ${input.screenDescriptions.length} screens in ${duration}ms`);
    console.log('🔗 Chain: _mapTasksToScreens - RAW OUTPUT:', result);
    console.log('🔍 taskScreenMappingArray details:', {
        taskScreenMappingArray,
        taskScreenMappingArrayType: typeof taskScreenMappingArray,
        taskScreenMappingArrayLength: Array.isArray(taskScreenMappingArray) ? taskScreenMappingArray.length : 'not array',
        taskScreenMappingArrayKeys: taskScreenMappingArray && typeof taskScreenMappingArray === 'object' ? Object.keys(taskScreenMappingArray) : 'not object'
    });
    return result;
};

const _generateTaskFlow = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateTaskFlow - RAW INPUT:', {input: input});
    
    const adaptedModels = createAdaptedModels();
    const prompt = await promptTaskFlowGeneration.format({
        task: input.task,
        uiCodes: input.uiCodes,
        screenInteractions: input.screenInteractions
    });
    const taskFlow = await adaptedModels.modelFlash.invoke(prompt);

    const cleanedTaskFlow = _parseJsonString(taskFlow, "task flow");

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🔄 Generated task flow for "${input.task}" in ${duration}ms`);
    console.log('🔗 Chain: _generateTaskFlow - RAW OUTPUT:', cleanedTaskFlow);
    return cleanedTaskFlow;
};

const _generateOverallDesigns = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateOverallDesigns - RAW INPUT:', {input: input});
    
    // Ensure designParameters is included in the input passed to the prompt
    const designParametersForPrompt = input.designParameters || "No specific design parameters provided";
    
    const promptInput = {
        designParameters: designParametersForPrompt
    };
    
    const adaptedModels = createAdaptedModels();
    const prompt = await promptOverallDesign.format(promptInput);
    const overallDesign = await adaptedModels.modelLite.invoke(prompt);

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`💡 Generated overall design concepts in ${duration}ms`);
    console.log('🔗 Chain: _generateOverallDesigns - RAW OUTPUT:', {overallDesign: overallDesign});
    return overallDesign;
}

// CUG + tasks + examples -> design ideas
export const overallDesignChain = new RunnableLambda({ func: _generateOverallDesigns });

export const screenDescriptionChain = RunnableSequence.from([
    // Stage 2a: Generate Screen Descriptions in parallel for each task
    new RunnableLambda({ func: _generateTaskScreenDescriptions }),
    // Stage 2b: Merge Screen Descriptions
    new RunnableLambda({ func: _mergeScreenDescriptions }),
    // Stage 4: Map Tasks to Screens
    new RunnableLambda({ func: _mapTasksToScreens }),
]);

export const uiCodeChain = new RunnableLambda({ func: _generateUICodes });

export const uiCodeRevisionChain = new RunnableLambda({ func: _generateUICodeRevision });

export const taskFlowChain = new RunnableLambda({ func: _generateTaskFlow });

// --- Design Space Chain ---
const _generateDivergentIdeas = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateDivergentIdeas - RAW INPUT:', {input: input});

    // Ensure userComments is included in the input passed to the prompt
    const userCommentsForPrompt = input.userComments || "No specific user comments provided";

    const promptInput = {
        context: input.context,
        user: input.user,
        goal: input.goal,
        tasks: input.tasks,
        examples: input.examples,
        userComments: userCommentsForPrompt
    };

    // Check if modelLite is properly initialized
    if (!modelLite) {
        console.error('❌ modelLite is not initialized. Please set up the Gemini API key first.');
        throw new Error('Model not initialized. Please set up the Gemini API key first.');
    }
    
    // Use the adapted model approach
    const adaptedModels = createAdaptedModels();
    const prompt = await promptDivergentIdeasGeneration.format(promptInput);
    const divergentIdeasRaw = await adaptedModels.modelLite.invoke(prompt);

    // Log the raw output for debugging
    console.log('🔗 Chain: _generateDivergentIdeas - RAW OUTPUT FROM LLM:', {divergentIdeasRaw: divergentIdeasRaw});

    // Parse the output as JSON
    const divergentIdeas = _parseJsonString(divergentIdeasRaw, "divergent ideas");
    
    // Add error handling for failed parsing
    if (!divergentIdeas) {
        console.error('❌ Failed to parse divergent ideas: LLM output was not valid JSON or was empty');
        console.error('❌ Raw LLM output:', divergentIdeasRaw);
        throw new Error("Failed to parse divergent ideas: LLM output was not valid JSON or was empty. Please try again.");
    }
    
    // Validate that divergentIdeas is an array
    if (!Array.isArray(divergentIdeas)) {
        console.error('❌ Divergent ideas is not an array:', divergentIdeas);
        console.error('❌ Divergent ideas type:', typeof divergentIdeas);
        throw new Error("Divergent ideas must be an array of ideas. Please try again.");
    }

    // Validate that we have at least 10 ideas
    if (divergentIdeas.length < 10) {
        console.warn('⚠️ Warning: Only generated', divergentIdeas.length, 'ideas, expected at least 10');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🧠 Generated ${divergentIdeas.length} divergent design ideas in ${duration}ms`);
    console.log('🔗 Chain: _generateDivergentIdeas - FINAL OUTPUT:', divergentIdeas);
    return divergentIdeas;
};

const _generateDesignSpaceFromIdeas = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateDesignSpaceFromIdeas - RAW INPUT:', {input: input});

    // Ensure userComments is included in the input passed to the prompt
    const userCommentsForPrompt = input.userComments || "No specific user comments provided";

    const promptInput = {
        divergentIdeas: JSON.stringify(input.divergentIdeas, null, 2),
        context: input.context,
        user: input.user,
        goal: input.goal,
        tasks: input.tasks,
        examples: input.examples,
        userComments: userCommentsForPrompt
    };

    // Check if modelLite is properly initialized
    if (!modelLite) {
        console.error('❌ modelLite is not initialized. Please set up the Gemini API key first.');
        throw new Error('Model not initialized. Please set up the Gemini API key first.');
    }
    
    // Use the adapted model approach
    const adaptedModels = createAdaptedModels();
    const prompt = await promptDesignSpaceFromIdeas.format(promptInput);
    const designSpaceRaw = await adaptedModels.modelLite.invoke(prompt);

    // Log the raw output for debugging
    console.log('🔗 Chain: _generateDesignSpaceFromIdeas - RAW OUTPUT FROM LLM:', {designSpaceRaw: designSpaceRaw});

    // Parse the output as JSON
    const designSpace = _parseJsonString(designSpaceRaw, "design space");
    
    // Add error handling for failed parsing
    if (!designSpace) {
        console.error('❌ Failed to parse design space: LLM output was not valid JSON or was empty');
        console.error('❌ Raw LLM output:', designSpaceRaw);
        throw new Error("Failed to parse design space: LLM output was not valid JSON or was empty. Please try again.");
    }
    
    // Validate that designSpace is an array
    if (!Array.isArray(designSpace)) {
        console.error('❌ Design space is not an array:', designSpace);
        console.error('❌ Design space type:', typeof designSpace);
        throw new Error("Design space must be an array of dimensions. Please try again.");
    }

    // Return as object for sliders (array of dimensions with options)
    const result = { designSpace };
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🎛️ Generated design space with ${designSpace.length} dimensions in ${duration}ms`);
    console.log('🔗 Chain: _generateDesignSpaceFromIdeas - FINAL OUTPUT:', result);
    return result;
};

// Keep the original function for backward compatibility
const _generateDesignSpace = async (input) => {
    const startTime = Date.now();
    console.log('🔗 Chain: _generateDesignSpace - RAW INPUT:', {input: input});

    // Step 1: Generate divergent ideas
    console.log('🔗 Chain: _generateDesignSpace - STEP 1: Generating divergent ideas...');
    const divergentIdeas = await _generateDivergentIdeas(input);
    
    // Step 2: Generate design space from divergent ideas
    console.log('🔗 Chain: _generateDesignSpace - STEP 2: Generating design space from ideas...');
    const designSpaceInput = {
        ...input,
        divergentIdeas: divergentIdeas
    };
    const result = await _generateDesignSpaceFromIdeas(designSpaceInput);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🚀 Completed full design space generation in ${duration}ms`);
    console.log('🔗 Chain: _generateDesignSpace - FINAL OUTPUT:', result);
    return result;
};

export const divergentIdeasChain = new RunnableLambda({ func: _generateDivergentIdeas });
export const designSpaceFromIdeasChain = new RunnableLambda({ func: _generateDesignSpaceFromIdeas });
export const designSpaceChain = new RunnableLambda({ func: _generateDesignSpace });