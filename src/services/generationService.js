import { overallDesignChain, screenDescriptionChain, taskFlowChain, uiCodeRevisionChain, designSpaceChain } from './chains.js';
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { generateImage } from './model.js';

let _screenDescriptions = [];
let _uiCodes = [];
let _taskFlows = {}; // Cache for task flow results

// Utility for robust JSON parsing (copied from chains.js)
function _parseJsonString(jsonString, context = "JSON") {
    if (typeof jsonString !== 'string') {
        throw new Error(`${context} must be a string`);
    }
    const cleanedInput = jsonString.replace(/```[\w-]*\n|```/g, '');
    try {
        return JSON.parse(cleanedInput);
    } catch {
        throw new Error(`Failed to extract valid JSON from ${context}`);
    }
}

// Generate the design space for the sliders widgets
export async function genDesignSpace({ context, user, goal, tasks, examples = [], userComments = null }) {
  const startTime = Date.now();
  const userCommentsForPrompt = userComments || "No specific user comments provided";
  const promptInput = {
    context,
    user,
    goal,
    tasks,
    examples,
    userComments: userCommentsForPrompt
  };
  // Use the passed modelLite if provided, otherwise use the one from chains.js (for compatibility, but designSpaceChain uses its own model)
  // The designSpaceChain wraps the model and prompt logic
  const result = await designSpaceChain.invoke(promptInput);
  // result is expected to be { designSpace }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  // console.log(`🎛️ Service: Generated design space in ${duration}ms`);
  
  // Log the generated design space result
  console.log('📋 DESIGN SPACE GENERATION RESULT:', {
    designSpace: result.designSpace,
    duration: duration,
    input: {
      context: context,
      user: user,
      goal: goal,
      tasks: tasks,
      examples: examples,
      userComments: userCommentsForPrompt
    }
  });
  
  return result;
}

// Generate multiple high-level overall designs
export async function genOverallDesigns({ designParameters = null }) {
  const startTime = Date.now();
  
  const input = {
    designParameters: designParameters || "No specific design parameters provided"
  };

  console.log('🔗 Service: genOverallDesigns - RAW INPUT:', input);

  const response = await overallDesignChain.invoke(input);

  try {
    const cleanedJSONString = response.replace(/```[\w-]*\n|```/g, '');
    
    const parsedResult = JSON.parse(cleanedJSONString);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    // console.log(`💡 Service: Generated overall designs in ${duration}ms`);
    console.log('🔗 Service: genOverallDesigns - RAW OUTPUT:', parsedResult);
    
    // Log the generated overall designs result
    console.log('📋 OVERALL DESIGNS GENERATION RESULT:', {
      designs: parsedResult,
      duration: duration,
      input: {
        designParameters: input.designParameters
      }
    });
    
    return parsedResult;
  } catch (parseError) {
    throw new Error(`Failed to parse design response: ${parseError.message}`);
  }
}

// Test function to generate overall designs and see raw output
// export async function testOverallDesignGeneration() {
//   const testInput = {
//     designParameters: "Navigation Style: Sidebar, Information Density: High, Interaction Paradigm: Direct Manipulation"
//   };
  
//   return await genOverallDesigns(testInput);
// }

// Generate screen descriptions for a specific design
export async function genScreenDescriptions({ overallDesign, tasks }) {
  const startTime = Date.now();
  
  const input = { overallDesign, tasks };
  console.log('🔗 Service: genScreenDescriptions - RAW INPUT:', input);

  const response = await screenDescriptionChain.invoke(input);

  // The screenDescriptionChain returns an object with screenDescriptions and taskScreenMapping
  // No need to parse JSON or clean the response
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  // console.log(`📝 Service: Generated screen descriptions in ${duration}ms`);
  console.log('🔗 Service: genScreenDescriptions - RAW OUTPUT:', response);
  
  // Log the generated screen descriptions result
  console.log('📋 SCREEN DESCRIPTIONS GENERATION RESULT:', {
    screenDescriptions: response.screenDescriptions,
    taskScreenMapping: response.taskScreenMapping,
    duration: duration,
    input: {
      overallDesign: overallDesign,
      tasks: tasks
    }
  });
  
  return response;
}

// Update the screen descriptions with the new screen descriptions edited or added by the user
export function updateScreenDescriptions(screenDescriptions) {
  if (!Array.isArray(screenDescriptions)) {
    throw new TypeError('screenDescriptions must be an array');
  }
  _screenDescriptions = [...screenDescriptions]; // Create a new array to avoid reference issues
  return _screenDescriptions;
}

// Update the UI codes if needed
// export async function genUICodes({ screenDescriptions, critiques = [] }) {
//   const startTime = Date.now();
//   if (_uiCodes.length > 0 && critiques.length === 0) {
//     return _uiCodes;
//   }
  
//   // TODO: modify the prompt to take in the critiques
//   const input = { screenDescriptions };
//   console.log('🔗 Service: genUICodes - RAW INPUT:', input);

//   const response = await uiCodeChain.invoke(input);

//   // The uiCodeChain returns an array of objects with {screenIndex, code}
//   // We need to extract just the code strings and sort them by screenIndex
//   if (Array.isArray(response)) {
//     // Sort by screenIndex to ensure correct order
//     const sortedCodes = response
//       .sort((a, b) => a.screenIndex - b.screenIndex)
//       .map(item => item.code);
//     _uiCodes = sortedCodes;
//   } else {
//     // If it's not an array, try to parse it as JSON
//     try {
//       const parsed = JSON.parse(response);
//       if (Array.isArray(parsed)) {
//         const sortedCodes = parsed
//           .sort((a, b) => a.screenIndex - b.screenIndex)
//           .map(item => item.code);
//         _uiCodes = sortedCodes;
//       } else {
//         _uiCodes = [response]; // Fallback to treating as single string
//       }
//     } catch {
//       _uiCodes = [response]; // Fallback to treating as single string
//     }
//   }

//   const endTime = Date.now();
//   const duration = endTime - startTime;
//   // console.log(`🎨 Service: Generated UI codes in ${duration}ms`);
//   console.log('🔗 Service: genUICodes - RAW OUTPUT:', _uiCodes);
  
//   // Log the generated UI codes result
//   console.log('📋 UI CODES GENERATION RESULT:', {
//     uiCodes: _uiCodes,
//     duration: duration,
//     input: {
//       screenDescriptions: screenDescriptions,
//       critiques: critiques
//     }
//   });
  
//   return _uiCodes;
// }

// New streaming version that updates UI as each screen completes
export async function genUICodesStreaming({ screenDescriptions, critiques = [], qualityMode = 'fast', onProgress = null }) {
  const startTime = Date.now();
  
  try {
    // Initialize empty array for streaming updates
    const streamingCodes = new Array(screenDescriptions.length).fill('');
    
    // Import the necessary modules for model selection
    const { createAdaptedModels } = await import('./chains.js');
    const { promptSVGCodeGeneration } = await import('./prompts.js');
    
    // Create parallel promises for UI code generation
    const uiCodePromises = screenDescriptions.map(async (screen, index) => {
      try {
        // Use the appropriate model based on quality mode
        const adaptedModels = createAdaptedModels();
        const model = qualityMode === 'high' ? adaptedModels.modelPro : adaptedModels.modelLite;
        
        console.log(`🎨 Generating UI code for screen ${index + 1} using ${qualityMode} mode (${qualityMode === 'high' ? 'modelPro' : 'modelLite'})`);
        
        // Format the prompt
        const prompt = await promptSVGCodeGeneration.format({
          screenDescription: JSON.stringify(screen, null, 2)
        });
        
        // Generate the code using the selected model
        const response = await model.invoke(prompt);
        
        let code;
        if (Array.isArray(response) && response.length > 0) {
          code = response[0].code;
        } else if (typeof response === 'string') {
          code = response;
        } else {
          throw new Error('Unexpected response format from model');
        }
        
        const cleanedCode = code.replace(/```[\w-]*\n|```/g, '');
        const resultObj = {
          screenIndex: index,
          code: cleanedCode
        };
        
        // Update the streaming array
        streamingCodes[index] = cleanedCode;
        
        // Call progress callback if provided - this will update the UI immediately
        if (onProgress) {
          onProgress([...streamingCodes], index, cleanedCode);
        }
        
        console.log(`✅ Generated UI code for screen ${index + 1}/${screenDescriptions.length} using ${qualityMode} mode`);
        return resultObj;
      } catch (error) {
        console.error(`❌ Error generating UI code for screen ${index + 1}:`, error);
        const errorCode = `Error generating UI code: ${error.message}`;
        streamingCodes[index] = errorCode;
        
        if (onProgress) {
          onProgress([...streamingCodes], index, errorCode);
        }
        
        return {
          screenIndex: index,
          code: errorCode
        };
      }
    });

    // Wait for all promises to complete
    const uiCodes = await Promise.all(uiCodePromises);
    
    // Sort by screenIndex to ensure correct order
    const sortedCodes = uiCodes
      .sort((a, b) => a.screenIndex - b.screenIndex)
      .map(item => item.code);
    
    _uiCodes = sortedCodes;

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🎨 Service: Generated UI codes in ${duration}ms using ${qualityMode} mode`);
    console.log('🔗 Service: genUICodesStreaming - RAW OUTPUT:', _uiCodes);
    
    // Log the generated UI codes result (streaming)
    console.log('📋 UI CODES GENERATION RESULT (STREAMING):', {
      uiCodes: _uiCodes,
      duration: duration,
      qualityMode: qualityMode,
      input: {
        screenDescriptions: screenDescriptions,
        critiques: critiques
      }
    });
    
    return _uiCodes;
  } catch (error) {
    console.error('❌ Error in genUICodesStreaming:', error);
    throw error;
  }
}



// Generate task flow for a single task
// - task: single task string
// - screenDescriptions: screen descriptions with task mapping
// - uiCodes: UI codes for all screens
// - critiques: TBD
export async function genTaskFlows({ task, taskScreenMapping, uiCodes }) {
  const startTime = Date.now();
  
  // Check if we already have a cached result for this task
  if (_taskFlows[task]) {
    return _taskFlows[task];
  }

  // Find the task in the task screen mapping
  const mapping = taskScreenMapping.find(mapping => mapping.task === task);
  
  if (!mapping) {
    throw new Error(`Task "${task}" not found in task screen mapping`);
  }
  
  // Extract subset of UI codes using the screen indices
  const relevantUICodes = mapping.screens.map(screen => {
    // Each screen should be an object with screen_id and interaction properties
    if (typeof screen !== 'object' || !screen.screen_id) {
      throw new Error(`Invalid screen format. Expected object with screen_id and interaction, got: ${typeof screen}`);
    }
    return uiCodes[screen.screen_id];
  });
  
  // Extract screen interactions from the screens array
  const screenInteractions = mapping.screens.map(screen => {
    // Each screen should be an object with screen_id and interaction properties
    if (typeof screen !== 'object' || !screen.interaction) {
      throw new Error(`Invalid screen format. Expected object with screen_id and interaction, got: ${typeof screen}`);
    }
    return screen.interaction;
  });
  
  const input = {
    task: task,
    uiCodes: relevantUICodes,
    screenInteractions: screenInteractions
  };
  
  console.log('🔗 Service: genTaskFlows - RAW INPUT:', input);
  
  const taskFlow = await taskFlowChain.invoke(input);
  
  // Cache the result
  _taskFlows[task] = taskFlow;
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  // console.log(`🔄 Service: Generated task flow for "${task}" in ${duration}ms`);
  console.log('🔗 Service: genTaskFlows - RAW OUTPUT:', taskFlow);
  
  // Log the generated task flow result
  console.log('📋 TASK FLOW GENERATION RESULT:', {
    task: task,
    taskFlow: taskFlow,
    duration: duration,
    input: {
      task: task,
      taskScreenMapping: mapping,
      uiCodes: relevantUICodes,
      screenInteractions: screenInteractions
    }
  });
  
  return taskFlow;
}

// Function to clear the task flow cache
export function clearTaskFlowCache() {
  _taskFlows = {};
}

// Function to restore task flows to the cache
export function restoreTaskFlowCache(taskFlows) {
  if (taskFlows && typeof taskFlows === 'object') {
    _taskFlows = { ...taskFlows };
    // console.log('🔄 Restored task flows to cache:', Object.keys(_taskFlows));
  }
}

// Function to get cached task flows
export function getCachedTaskFlows() {
  return { ..._taskFlows };
}

// Function to check if a task flow is cached
export function isTaskFlowCached(task) {
  return Object.prototype.hasOwnProperty.call(_taskFlows, task);
}

// Function to clear the UI codes cache
export function clearUICodesCache() {
  _uiCodes = [];
}

export function highlightUICode({uiCode, snippet}) {
  if (!uiCode || !snippet) {
    throw new Error('Both uiCode and snippet are required');
  }

  // Use browser's built-in DOMParser and XMLSerializer
  const parser = new window.DOMParser();
  const serializer = new window.XMLSerializer();
  const snippetDoc = parser.parseFromString(`<svg>${snippet}</svg>`, 'image/svg+xml');
  const uiDoc = parser.parseFromString(uiCode, 'image/svg+xml');

  function attributesMatch(snippetElem, uiElem) {
    // Always check tag name, x, and y
    if (snippetElem.tagName !== uiElem.tagName) return false;
    const x = snippetElem.getAttribute('x');
    const y = snippetElem.getAttribute('y');
    if (x !== null && uiElem.getAttribute('x') !== x) return false;
    if (y !== null && uiElem.getAttribute('y') !== y) return false;
    // Check any other attributes present in the snippet, except class
    const snippetAttrs = snippetElem.attributes;
    for (let i = 0; i < snippetAttrs.length; i++) {
      const { name, value } = snippetAttrs.item(i);
      if (name === 'x' || name === 'y' || name === 'class') continue;
      if (uiElem.getAttribute(name) !== value) return false;
    }
    return true;
  }

  const snippetElements = [];
  function collectElements(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1 /* ELEMENT_NODE */) {
        snippetElements.push(child);
        collectElements(child);
      }
    }
  }
  collectElements(snippetDoc.documentElement);

  snippetElements.forEach(snippetElem => {
    const tagName = snippetElem.tagName;
    if (tagName === 'svg') return;
    const uiElems = uiDoc.getElementsByTagName(tagName);
    for (let i = 0; i < uiElems.length; i++) {
      const uiElem = uiElems[i];
      if (attributesMatch(snippetElem, uiElem)) {
        // Do not highlight <text> elements
        if (uiElem.tagName === 'text') {
          break;
        }
        // Do not highlight if the element is a container and its children are <text>
        let hasTextChild = false;
        for (let j = 0; j < uiElem.childNodes.length; j++) {
          const child = uiElem.childNodes[j];
          if (child.nodeType === 1 && child.tagName === 'text') {
            hasTextChild = true;
            break;
          }
        }
        if (hasTextChild) {
          // Only highlight the parent, not the <text> children (which is default behavior)
          // So, just add the class to the parent, not to any children
          const prevClass = uiElem.getAttribute('class') || '';
          if (!prevClass.includes('svg-highlight')) {
            uiElem.setAttribute('class', (prevClass + ' svg-highlight').trim());
          }
          break;
        } else {
          // No <text> children, safe to highlight
          const prevClass = uiElem.getAttribute('class') || '';
          if (!prevClass.includes('svg-highlight')) {
            uiElem.setAttribute('class', (prevClass + ' svg-highlight').trim());
          }
          break;
        }
      }
    }
  });

  let highlightedCode = serializer.serializeToString(uiDoc);
  highlightedCode = highlightedCode.replace(/^<\?xml[^>]*>/, '').trim();
  return highlightedCode;
}

// TODO: generate critiques

// TODO: Generate a new task

// Revise UI codes based on critiques
export async function reviseUICodes(screens, critiques) {
  // console.log('🔄 reviseUICodes called with:', {
  //   screensCount: screens.length,
  //   critiquesCount: critiques.length,
  //   screens: screens.map(s => ({ title: s.title, hasUICode: !!s.ui_code })),
  //   critiques: critiques.map(c => ({ screen_title: c.screen_title, ui_element: c.ui_element, feedback: c.feedback.substring(0, 50) + '...' }))
  // });

  if (!screens || screens.length === 0) {
    // console.error('❌ No screens provided to reviseUICodes');
    return null;
  }

  if (!critiques || critiques.length === 0) {
    // console.error('❌ No critiques provided to reviseUICodes');
    return null;
  }

  try {
    // Group critiques by screen title
    const critiquesByScreen = {};
    critiques.forEach(critique => {
      if (!critiquesByScreen[critique.screen_title]) {
        critiquesByScreen[critique.screen_title] = [];
      }
      critiquesByScreen[critique.screen_title].push(critique);
    });

    // console.log('📋 Screens to revise:', {
    //   totalScreens: screens.length,
    //   screensWithCritiques: Object.keys(critiquesByScreen).length,
    //   critiquesByScreen: Object.keys(critiquesByScreen).map(screenTitle => ({
    //     screenTitle,
    //     critiqueCount: critiquesByScreen[screenTitle].length
    //   })),
    //   availableScreenTitles: screens.map(s => s.title)
    // });

    // Find screens that have critiques
    const screensToRevise = screens.filter(screen => 
      critiquesByScreen[screen.title] && critiquesByScreen[screen.title].length > 0
    );

    // console.log('🔍 Screens that match critiques:', {
    //   screensToReviseCount: screensToRevise.length,
    //   screensToRevise: screensToRevise.map(s => s.title)
    // });

    if (screensToRevise.length === 0) {
      // console.log('⚠️ No screens to revise, returning original array');
      return screens.map(screen => screen.ui_code || '');
    }

    // Create a map to store revised codes
    const revisedCodeMap = {};

    // Revise each screen that has critiques
    for (const screen of screensToRevise) {
      const screenCritiques = critiquesByScreen[screen.title];
      const originalIndex = screens.findIndex(s => s.title === screen.title);
      
      // console.log(`🔄 Revising screen ${originalIndex}:`, {
      //   title: screen.title,
      //   originalUICode: screen.ui_code ? screen.ui_code.substring(0, 100) + '...' : 'empty',
      //   critiquesCount: screenCritiques.length,
      //   critiques: screenCritiques.map(c => ({ ui_element: c.ui_element, feedback: c.feedback.substring(0, 50) + '...' }))
      // });

      try {
        const revisionInput = {
          originalUICode: screen.ui_code || '',
          critiques: screenCritiques.map(critique => ({
            ui_element: critique.ui_element,
            feedback: critique.feedback
          }))
        };

        // console.log(`📋 Calling uiCodeRevisionChain with input:`, revisionInput);
        const revisionResponse = await uiCodeRevisionChain.invoke(revisionInput);
        // console.log(`📋 uiCodeRevisionChain response:`, {
        //   responseLength: revisionResponse.length,
        //   responsePreview: revisionResponse.substring(0, 100) + '...'
        // });

        try {
          const cleanedRevisionResponse = revisionResponse.replace(/```[\w-]*\n|```/g, '');
          const revisedCode = cleanedRevisionResponse.trim();
          
          // console.log(`🔍 Comparing original vs cleaned response:`, {
          //   originalLength: screen.ui_code?.length || 0,
          //   revisedLength: revisedCode.length,
          //   originalPreview: screen.ui_code ? screen.ui_code.substring(0, 100) + '...' : 'empty',
          //   revisedPreview: revisedCode.substring(0, 100) + '...'
          // });

          revisedCodeMap[originalIndex] = revisedCode;
          // console.log(`✅ Successfully revised screen ${originalIndex}`);
        } catch {
          // console.error(`❌ Error parsing revision response for screen ${originalIndex}:`, parseError);
          // console.error('Raw revision response:', revisionResponse);
          // Keep original code if revision fails
          revisedCodeMap[originalIndex] = screen.ui_code || '';
        }
      } catch {
        // console.error(`❌ Error revising screen ${originalIndex}:`, error);
        // Keep original code if revision fails
        revisedCodeMap[originalIndex] = screen.ui_code || '';
      }
    }

    // console.log('📋 Revision results:', {
    //   totalScreens: screens.length,
    //   revisedScreens: Object.keys(revisedCodeMap).length,
    //   revisedIndices: Object.keys(revisedCodeMap).map(Number).sort((a, b) => a - b)
    // });

    // Create the final result array
    const result = screens.map((screen, index) => {
      if (Object.prototype.hasOwnProperty.call(revisedCodeMap, index)) {
        return revisedCodeMap[index];
      } else {
        return screen.ui_code || '';
      }
    });

    // console.log('🔍 About to call screens.map at line 512. screens:', screens, 'revisedCodeMap:', revisedCodeMap);
    
    // Update the cached UI codes if they exist
    if (typeof _uiCodes !== 'undefined' && _uiCodes.length > 0) {
      // console.log('📋 Final result:', {
      //   resultLength: result.length,
      //   resultPreview: result.map(code => code ? code.substring(0, 50) + '...' : 'empty'),
      //   _uiCodesLength: _uiCodes.length
      // });
      
      // console.log('🔍 About to check cached UI codes update. _uiCodes.length:', _uiCodes.length, 'result:', result, 'result type:', typeof result, 'isArray:', Array.isArray(result));
      
      if (Array.isArray(result) && result.length === _uiCodes.length) {
        // console.log('🔍 About to call result.map at line 532');
        _uiCodes.splice(0, _uiCodes.length, ...result);
        // console.log('📋 Updated cached UI codes');
      }
    }

    return result;
  } catch {
    // console.error('❌ Error in reviseUICodes:', error);
    // Return original codes if revision fails
    return screens.map(screen => screen.ui_code || '');
  }
}

// Modular function to generate SVG icons for designs
export async function generateDesignIcons(designs, apiKey) {
  if (!apiKey || !Array.isArray(designs) || designs.length === 0) {
    console.log('🎨 No API key or designs provided for icon generation');
    return designs;
  }

  try {
    console.log('🎨 Generating SVG thumbnails for design ideas...');
    const designsWithIcons = await Promise.all(
      designs.map(async (design, index) => {
        try {
          // Extract design information for thumbnail generation
          const designName = design.design_name || design.name || `Design ${index + 1}`;
          const coreConcept = design.core_concept || design.description || 'A modern UI design';
          const keyCharacteristics = design.key_characteristics ?
            (Array.isArray(design.key_characteristics) ? design.key_characteristics.join(', ') : design.key_characteristics) : '';
          const rationale = design.rationale || '';

          // Create a comprehensive prompt using the actual design data
          const iconPrompt = `${designName}: ${coreConcept}. Key characteristics: ${keyCharacteristics}. Rationale: ${rationale}. Create a unique SVG thumbnail that represents this design approach.`;

          console.log(`🎨 Generating SVG thumbnail for design ${index + 1}: ${designName}`);
          console.log(`📋 Design data used:`, {
            designName,
            coreConcept,
            keyCharacteristics,
            rationale
          });

          const iconData = await generateImage(apiKey, iconPrompt);

          return {
            ...design,
            generated_icon: iconData,
            icon_generated: true
          };
        } catch (error) {
          console.error(`❌ Failed to generate SVG thumbnail for design ${index + 1}:`, error);
          return {
            ...design,
            generated_icon: null,
            icon_generated: false,
            icon_error: error.message
          };
        }
      })
    );
    return designsWithIcons;
  } catch (error) {
    console.error('❌ Error generating design icons:', error);
    return designs; // Return original designs if icon generation fails
  }
}

// Generate four diverse design ideas by sampling different design space combinations
export async function genDiverseDesignIdeas({ designSpace }) {
  const startTime = Date.now();
  try {
    console.log('🔗 Service: genDiverseDesignIdeas - Generating 4 diverse design ideas...');
    
    // Ensure Gemini models are initialized
    const apiKey = localStorage.getItem('geminiApiKey') || '';
    if (!apiKey) {
      console.error('❌ No Gemini API key found. Please set your API key in the browser.');
      throw new Error('No Gemini API key found. Please set your API key in the browser.');
    }
    
    // Import and set up models
    const { setGeminiModels } = await import('./chains.js');
    setGeminiModels(apiKey);
    console.log('🔗 Service: genDiverseDesignIdeas - Gemini models initialized');
    
    // Generate 4 different parameter combinations to ensure diversity
    const diverseParameters = generateDiverseParameterCombinations(designSpace);
    console.log('🔗 Service: genDiverseDesignIdeas - Generated parameter combinations:', diverseParameters);
    console.log('🔗 Service: genDiverseDesignIdeas - Number of parameter combinations:', diverseParameters.length);
    
    const allDesigns = [];
    const maxRetries = 2; // Allow retries for failed generations
    
    // Generate one design for each parameter combination
    for (let i = 0; i < diverseParameters.length; i++) {
      const designParameters = diverseParameters[i];
      console.log(`🔗 Service: genDiverseDesignIdeas - Generating design ${i + 1}/4 with parameters:`, designParameters);
      
      let designGenerated = false;
      let retryCount = 0;
      
      while (!designGenerated && retryCount < maxRetries) {
        try {
          console.log(`🔗 Service: genDiverseDesignIdeas - Attempt ${retryCount + 1} for design ${i + 1}`);
          const result = await genOverallDesigns({
            designParameters: designParameters
          });
          
          console.log(`🔗 Service: genDiverseDesignIdeas - Raw result for design ${i + 1}:`, result);
          console.log(`🔗 Service: genDiverseDesignIdeas - Result type:`, typeof result);
          console.log(`🔗 Service: genDiverseDesignIdeas - Result is array:`, Array.isArray(result));
          console.log(`🔗 Service: genDiverseDesignIdeas - Result length:`, Array.isArray(result) ? result.length : 'N/A');
          
          if (result && Array.isArray(result) && result.length > 0) {
            // Ensure the design has a unique ID
            const design = {
              ...result[0],
              design_id: i + 1
            };
            allDesigns.push(design);
            designGenerated = true;
            console.log(`✅ Successfully generated design ${i + 1}/4:`, design.design_name);
          } else {
            console.warn(`⚠️ No valid result for design ${i + 1}, retrying... (result:`, result, ')');
            retryCount++;
          }
        } catch (error) {
          console.error(`❌ Error generating design ${i + 1} (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error(`❌ Failed to generate design ${i + 1} after ${maxRetries} attempts`);
            // Create a fallback design to ensure we have 4 designs
            const fallbackDesign = {
              design_id: i + 1,
              design_name: `Design ${i + 1} (Fallback)`,
              core_concept: `A design approach based on: ${designParameters}`,
              key_characteristics: ["Fallback design due to generation error"],
              rationale: "This design was created as a fallback when the AI generation failed."
            };
            allDesigns.push(fallbackDesign);
            console.log(`🔄 Added fallback design ${i + 1} to ensure 4 designs total`);
          }
        }
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`💡 Service: Generated ${allDesigns.length} diverse design ideas in ${duration}ms`);
    console.log(`💡 Service: Final designs:`, allDesigns.map(d => ({ id: d.design_id, name: d.design_name })));
    
    // Ensure we have exactly 4 designs
    if (allDesigns.length < 4) {
      console.warn(`⚠️ Only generated ${allDesigns.length} designs, adding fallback designs to reach 4`);
      while (allDesigns.length < 4) {
        const fallbackIndex = allDesigns.length + 1;
        const fallbackDesign = {
          design_id: fallbackIndex,
          design_name: `Design ${fallbackIndex} (Fallback)`,
          core_concept: "A fallback design approach when generation was incomplete",
          key_characteristics: ["Fallback design"],
          rationale: "This design was added to ensure exactly 4 designs are available."
        };
        allDesigns.push(fallbackDesign);
        console.log(`🔄 Added additional fallback design ${fallbackIndex}`);
      }
    }
    
    console.log(`💡 Service: Final count after fallbacks: ${allDesigns.length} designs`);
    return allDesigns;
  } catch (error) {
    console.error('❌ Error in genDiverseDesignIdeas:', error);
    throw error;
  }
}

// Helper function to generate diverse parameter combinations from design space
function generateDiverseParameterCombinations(designSpace) {
  if (!designSpace || designSpace.length === 0) {
    return ["No specific design parameters provided"];
  }
  
  const combinations = [];
  
  // Helper function to calculate diversity between two parameter combinations
  function calculateDiversity(combo1, combo2) {
    const params1 = combo1.split(', ').map(p => p.split(': ')[1]);
    const params2 = combo2.split(', ').map(p => p.split(': ')[1]);
    
    let differences = 0;
    for (let i = 0; i < Math.min(params1.length, params2.length); i++) {
      if (params1[i] !== params2[i]) {
        differences++;
      }
    }
    return differences;
  }
  
  // Helper function to calculate total diversity from a combination to all existing combinations
  function calculateTotalDiversity(newCombo, existingCombos) {
    if (existingCombos.length === 0) return 0;
    
    let totalDiversity = 0;
    for (const existingCombo of existingCombos) {
      totalDiversity += calculateDiversity(newCombo, existingCombo);
    }
    return totalDiversity;
  }
  
  // Helper function to generate all possible combinations
  function generateAllPossibleCombinations() {
    const allCombos = [];
    
    // Generate all possible combinations using cartesian product
    function generateCombinations(dimensions, currentCombo = [], dimensionIndex = 0) {
      if (dimensionIndex === dimensions.length) {
        // We have a complete combination
        const comboString = currentCombo.join(', ');
        allCombos.push(comboString);
        return;
      }
      
      const dimension = dimensions[dimensionIndex];
      for (const option of dimension.options) {
        const newCombo = [...currentCombo, `${dimension.dimension_name}: ${option.option_name}`];
        generateCombinations(dimensions, newCombo, dimensionIndex + 1);
      }
    }
    
    generateCombinations(designSpace);
    return allCombos;
  }
  
  // Generate all possible combinations
  const allPossibleCombinations = generateAllPossibleCombinations();
  console.log(`🔗 Generated ${allPossibleCombinations.length} possible combinations`);
  
  // Design 1: Randomly sample from all possible combinations
  const randomIndex = Math.floor(Math.random() * allPossibleCombinations.length);
  const design1 = allPossibleCombinations[randomIndex];
  combinations.push(design1);
  console.log(`🎲 Design 1 (random): ${design1}`);
  
  // Remove the chosen combination from the pool
  allPossibleCombinations.splice(randomIndex, 1);
  
  // Design 2: Choose the combination that's most different from Design 1
  let maxDiversity = -1;
  let bestComboIndex = 0;
  
  for (let i = 0; i < allPossibleCombinations.length; i++) {
    const diversity = calculateDiversity(allPossibleCombinations[i], design1);
    if (diversity > maxDiversity) {
      maxDiversity = diversity;
      bestComboIndex = i;
    }
  }
  
  const design2 = allPossibleCombinations[bestComboIndex];
  combinations.push(design2);
  console.log(`🎯 Design 2 (max diversity from Design 1): ${design2} (diversity: ${maxDiversity})`);
  allPossibleCombinations.splice(bestComboIndex, 1);
  
  // Design 3: Choose the combination that's most different from Design 1 & 2
  maxDiversity = -1;
  bestComboIndex = 0;
  
  for (let i = 0; i < allPossibleCombinations.length; i++) {
    const totalDiversity = calculateTotalDiversity(allPossibleCombinations[i], [design1, design2]);
    if (totalDiversity > maxDiversity) {
      maxDiversity = totalDiversity;
      bestComboIndex = i;
    }
  }
  
  const design3 = allPossibleCombinations[bestComboIndex];
  combinations.push(design3);
  console.log(`🎯 Design 3 (max diversity from Designs 1 & 2): ${design3} (total diversity: ${maxDiversity})`);
  allPossibleCombinations.splice(bestComboIndex, 1);
  
  // Design 4: Choose the combination that's most different from Design 1, 2 & 3
  maxDiversity = -1;
  bestComboIndex = 0;
  
  for (let i = 0; i < allPossibleCombinations.length; i++) {
    const totalDiversity = calculateTotalDiversity(allPossibleCombinations[i], [design1, design2, design3]);
    if (totalDiversity > maxDiversity) {
      maxDiversity = totalDiversity;
      bestComboIndex = i;
    }
  }
  
  const design4 = allPossibleCombinations[bestComboIndex];
  combinations.push(design4);
  console.log(`🎯 Design 4 (max diversity from Designs 1, 2 & 3): ${design4} (total diversity: ${maxDiversity})`);
  
  console.log('🔗 Final diverse parameter combinations:', combinations);
  return combinations;
}

// Test function to verify diverse parameter generation
export function testDiverseParameterGeneration() {
  const mockDesignSpace = [
    {
      dimension_name: "Navigation Style",
      dimension_description: "How users move between different parts of the application",
      options: [
        { option_name: "Sidebar", option_description: "Vertical sidebar with icons and labels" },
        { option_name: "Top Bar", option_description: "Horizontal bar at the top with tabs" },
        { option_name: "Command Palette", option_description: "Searchable overlay for power users" }
      ]
    },
    {
      dimension_name: "Information Density",
      dimension_description: "How much information is displayed at once",
      options: [
        { option_name: "Minimal", option_description: "Clean, sparse layout with essential info only" },
        { option_name: "Moderate", option_description: "Balanced information density" },
        { option_name: "Dense", option_description: "Information-rich layout with many details" }
      ]
    },
    {
      dimension_name: "Interaction Model",
      dimension_description: "How users interact with the interface",
      options: [
        { option_name: "Click-based", option_description: "Traditional point-and-click interactions" },
        { option_name: "Gesture-based", option_description: "Touch and swipe gestures" },
        { option_name: "Voice-based", option_description: "Voice commands and natural language" }
      ]
    }
  ];
  
  console.log('🧪 Testing diverse parameter generation...');
  const combinations = generateDiverseParameterCombinations(mockDesignSpace);
  
  console.log('Generated combinations:');
  combinations.forEach((combo, index) => {
    console.log(`${index + 1}. ${combo}`);
  });
  
  // Check for uniqueness
  const uniqueCombinations = new Set(combinations);
  console.log(`\nUnique combinations: ${uniqueCombinations.size}/4`);
  
  if (uniqueCombinations.size === 4) {
    console.log('✅ All combinations are unique!');
  } else {
    console.log('❌ Some combinations are duplicates');
  }
  
  return combinations;
}

