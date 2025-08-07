import { PromptTemplate } from "@langchain/core/prompts";

// --- Prompt Templates ---
// Defines the structure and instructions for various LLM interactions.

// export const promptOverallDesign = PromptTemplate.fromTemplate(
//   `Analyze the following information and follow the specific design parameters to generate 3-5 distinct high-level design concepts for a desktop application that can support the user to accomplish their goal by performing the tasks.

//   Context: {context}
//   User: {user}
//   Goal: {goal}
//   Tasks: {tasks}
//   Examples: {examples}
//   User Comments: {userComments}
//   Design Parameters: {designParameters}

//   Requirements:
//   - Generate 3-5 distinct high-level design concepts
//   - Each design should directly address the design parameters
//   - Use the provided examples as inspiration: analyze each example's description to understand the design approach, interaction pattern, or visual style it represents, then incorporate those insights into your design concepts
//   - If user comments are provided, carefully consider and incorporate the feedback, preferences, concerns, or suggestions mentioned by users into your design concepts
//   - If design parameters are provided, incorporate the selected design preferences and constraints into your design concepts

//   Format the output as a JSON array where each design object has these fields:
//   - design_id: A unique integer identifier
//   - design_name: A highly-descriptive short sentence for the design: one should be able to understand the design from the name without reading the rest of the design concept
//   - core_concept: Describing the main design approach---importantly, how it addresses each of the design parameters
//   - references: optional, only needed if examples were provided, one sentence to describe what you see in the provided examples and how you incorporates them into this design idea
//   - user_feedback_consideration: optional, only needed if user comments were provided, one sentence to explain how this design addresses or incorporates the user feedback, preferences, or concerns mentioned. 

//   Example format (do not include this in your response):
//   [
//     {{
//       "design_id": 1,
//       "design_name": "Dashboard-Centric Approach",
//       "core_concept": "A centralized dashboard that provides quick access to all deployment tools and monitoring features. ... (describe how it addresses each of the design parameters)",
//       "references": "The dashboard layout shown in the example demonstrates effective information density and quick navigation patterns and this design incorporates a similar layout with a sidebar for navigation and a main content area for the dashboard.",
//       "user_feedback_consideration": "N/A because the user didn't write anything in the comments."
//     }}
//   ]

//   IMPORTANT: 
//   - Your response must be a valid JSON array. Do not include any text before or after the JSON.
//   - Do not mark the response as JSON using "~~~json".
//   - Do not include any backticks, code fences, or language tags. Return only the raw JSON array.
//   `
// );

export const promptOverallDesign = PromptTemplate.fromTemplate(
  `Analyze the following information and follow the specific design parameters to generate 1 distinct high-level design concept that can support the user to accomplish their goal by performing the tasks.

  Design Parameters: {designParameters}

  Requirements:
  - Generate exactly 1 distinct high-level design idea
  - The design should directly address each of the design parameters

  Format the output as a JSON array where each design object has these fields:
  - design_id: A unique integer identifier
  - design_name: A highly-descriptive short sentence for the design: one should be able to understand the design from the name without reading the rest of the design concept
  - core_concept: Describing the main design approach---importantly, how it addresses each of the design parameters

  Example format (do not include this in your response):
  [
    {{
      "design_id": 1,
      "design_name": "Dashboard-Centric Approach",
      "core_concept": "A centralized dashboard that provides quick access to all deployment tools and monitoring features. ... (describe how it addresses each of the design parameters)"
    }}
  ]

  IMPORTANT: 
  - Your response must be a valid JSON array. Do not include any text before or after the JSON.
  - Do not mark the response as JSON using "~~~json".
  - Do not include any backticks, code fences, or language tags. Return only the raw JSON array.
  `
);


export const promptDivergentIdeasGeneration = PromptTemplate.fromTemplate(
  `SYSTEM:
  You are an expert UX strategist and creative thinker. Generate wildly different UI design ideas for the given context.

  ASSISTANT:
  Brainstorm at least 15 wildly different product metaphors or paradigms that could inform the design of this application. Each idea should represent a fundamentally different approach to solving the user's problem.

  Context: {context}
  User: {user}
  Goal: {goal}
  Tasks: {tasks}
  Examples: {examples}
  User Comments: {userComments}

  Requirements:
  - Generate at least 15 different ideas
  - Ideas should be relevant to the context, user type, goal, and tasks
  - Consider the examples provided (if any) for inspiration but don't limit yourself to them
  - If user comments are provided, consider the feedback and preferences mentioned
  - Focus on high-level conceptual approaches, not implementation details

  Format the output as a JSON array where each idea object has these fields:
  - idea_id: A unique integer identifier
  - idea_name: A short, descriptive name for the metaphor/paradigm
  - description: A brief explanation of how this metaphor/paradigm would work for this application
  - inspiration: How this idea relates to the context, user, goal, or examples provided

  Example format (do not include this in your response):
  [
    {{
      "idea_id": 1,
      "idea_name": "Command Center",
      "description": "A centralized hub where users can monitor, control, and orchestrate all their activities through a unified control panel interface.",
      "inspiration": "Addresses the need for centralized management and quick access to all tools, similar to how a command center manages complex operations."
    }}
  ]

  IMPORTANT:
  - Your response must be a valid JSON array. Do not include any text before or after the JSON.
  - Do not mark the response as JSON using "~~~json".
  - Do not include any backticks, code fences, or language tags. Return only the raw JSON array.
  - Generate at least 10 ideas, but you can generate more if inspired.
  - Each idea should be conceptually distinct from the others.
  `
);

export const promptDesignSpaceFromIdeas = PromptTemplate.fromTemplate(
  `SYSTEM:
  You are an expert UX strategist. Analyze the provided divergent ideas and create a high‑level, conceptual design space using descriptive, plain language that is easy to understand for a non-designer, such as a product manager, software engineer, or UX researcher.

  ASSISTANT:
  Analyze the following divergent ideas and create a design space by following these steps:

  STEP 1 – Analyze Ideas
  - Review all the provided ideas and identify common themes, tensions, and patterns
  - Look for fundamental UX-related differences

  STEP 2 – Identify Dimensions
  - Group the ideas into 3 orthogonal design dimensions, each expressing a fundamental tension, role, or workflow shift
  - Each dimension should capture a meaningful choice that affects the user's experience
  - For every dimension, write one brief sentence explaining why it matters

  STEP 3 – Create Options
  - For each dimension, list no more than 3 options that sit at clearly different points along that spectrum
  - Each option should represent a distinct approach along the dimension--it should be clear how one option is different from the others
  - For each option, give one‑sentence description to help a non-designer understand the option

  Divergent Ideas:
  {divergentIdeas}

  Context: {context}
  User: {user}
  Goal: {goal}
  Tasks: {tasks}
  Examples: {examples}
  User Comments: {userComments}

  Requirements:
  - Create exactly 3 design dimensions
  - Each dimension should be clearly distinct and relevant to the context
  - Each dimension's description should be concise, ideally one sentence, framed as question to prompt a non-designer, such as a product manager, software engineer, or UX researcher, to consider which option is most appropriate for the application.
  - Each dimension should have 3-5 options that represent meaningful alternatives--the option names should use plain language and be easy to understand for a non-designer, such as a product manager, software engineer, or UX researcher.
  - Exclude dimensions limited to low-level design details such as information density, styling, or minor control placement
  - Use the divergent ideas as inspiration for the dimensions and options
  - Consider how the examples and user comments inform the design space

  IMPORTANT:
  - Your response must be a valid JSON array. Do not include any text before or after the JSON.
  - Do not mark the response as JSON using "~~~json".
  - Do not include any backticks, code fences, or language tags. Return only the raw JSON array.
  - Each dimension should be clearly distinct and relevant to the context.
  - Each option should be a meaningful alternative within its dimension.
  - Base your dimensions and options on the provided divergent ideas.
  `
);


export const promptScreenDescriptionsGeneration = PromptTemplate.fromTemplate(
  `Analyze the following overall design of an application and generate a detailed description of different screens based off of the main UI layout of the application. Each screen's description should capture the purpose of the screen, the elements it contains, and the functionality it offers. Use as few screens as possible.
  
    Overall Design:
    {overallDesign}
    `
);

export const promptTaskwiseScreenDescriptionsGeneration = PromptTemplate.fromTemplate(
  `Analyze the following overall design of an application. Then, for each task, generate a description of the screens that are needed to complete the task. Each screen description should consist of 2-3 sentences and include specific details about the screen's purpose, UI elements, and functionality.

  Overall Design: {overallDesign}
  Tasks: {tasks}

  For each screen description, include:
  - Purpose: What the screen is for and what users accomplish on it
  - Elements: Specific UI elements like buttons, forms, lists, navigation, etc. (can be nested objects or arrays)
  - Functionality: What actions users can perform and how the screen behaves
  - Layout: How elements are organized and positioned
  - Interactions: How users navigate to/from this screen and interact with elements

  Make each description detailed enough for a UX designer to create the screen.
  `
);

export const promptMergeScreenDescriptions = PromptTemplate.fromTemplate(
  `You are a UX design assistant helping define the core structure of an application. I will provide several user tasks, each with a sequence of screens the user navigates to complete the task. Your job is to analyze these task flows and propose a unified set of conceptual screens that support all the tasks, while minimizing redundancy and preserving key functionality. Use as few screens as possible.

    Your output should consist of high-level screen concepts, not implementation details. Focus on the main idea of each screen, including its role in the workflow, core elements, and essential interactions. Avoid overly detailed layouts or exhaustive UI specifications.

    For each screen, describe:

    - title: A short, descriptive name for the screen
    - purpose: What users achieve on this screen and why it's necessary
    - core_elements: A brief list of major components (e.g., search bar, content list, form section)—only what's essential to the screen's purpose
    - key_interactions: Main actions users can perform and navigation to/from this screen
    - data_notes: (Optional) Brief notes on what data is shown or collected, only if essential to understanding the screen

    Keep descriptions concise and focused. This is for early-stage design—sufficient for creating low-fidelity wireframes or sketching out user flows.

    Task-Specific Screen Descriptions:
    {screenDescriptions}

    Return a JSON array of screen objects that unify overlapping functionality, clarify intent, and remain general enough to guide low-fi prototyping.

    Format the output as a JSON array where each screen object has these fields:
    - title: A short, descriptive name for the screen
    - purpose: What users achieve on this screen and why it's necessary
    - core_elements: A brief list of major components (e.g., search bar, content list, form section)—only what's essential to the screen's purpose
    - key_interactions: Main actions users can perform and navigation to/from this screen
    - data_notes: (Optional) Brief notes on what data is shown or collected, only if essential to understanding the screen

    Example format (do not include this in your response):
    [
      {{
        "title": "Dashboard",
        "purpose": "Main overview screen showing key metrics and quick access to main features",
        "core_elements": ["metrics cards", "navigation menu", "quick action buttons"],
        "key_interactions": ["click navigation items", "view detailed metrics", "access quick actions"],
        "data_notes": "Displays summary statistics and recent activity"
      }}
    ]

    IMPORTANT: 
    - Your response must be a valid JSON array. Do not include any text before or after the JSON.
    - Do not mark the response as JSON using "~~~json".
    - Do not include any backticks, code fences, or language tags. Return only the raw JSON array.
    `
);

export const promptScreenDescriptionsFormatting = PromptTemplate.fromTemplate(
  `Analyze the following screen descriptions and extract all properties mentioned for each screen. For example, if a screen description mentions "purpose: ..." and "elements: ...", extract those as properties.

  Screen Descriptions:
  {screenDescriptions}

  For each screen:
  1. Identify all properties mentioned (like purpose, elements, functionality, layout, interactions, data, etc.)
  2. Extract the values for each property
  3. Format the output as a JSON array of screen objects, where each object contains all the properties found in that screen's description
  4. Make sure the output JSON has a "title" property for each screen
  5. Ensure that "elements" and "functionality" are always included, even if the original description doesn't explicitly list them
  6. If elements or functionality are not explicitly mentioned, infer them from the screen's purpose and context
  7. Preserve the original structure of elements and functionality fields (they can be objects, arrays, or nested structures)

  IMPORTANT: Your response must be a valid JSON array. Do not include any text before or after the JSON. Do not mark the response as JSON using "\`\`\`json".
  `
);

export const promptTaskScreenMapping = PromptTemplate.fromTemplate(
  `Given the following tasks and formatted screen descriptions, determine which sequence of screens is needed to complete each task. Use the screen indices (0-based) to reference the screens. 

  Tasks:
  {tasks}

  Formatted Screen Descriptions:
  {screenDescriptions}

  For each task:
  - Analyze which screens are needed to complete the task
  - Include the indices of all the necessary screens in the order they should be visited; the indices should not exceed the number of screens available; each task must have at least one screen
  - Usually a given screen does not appear more than once in a task
  - Format the output as a JSON object with a tasksWithScreens array, where each object has:
     - task: the task description
     - screens: array of screen indices in the order they should be visited--cannot be empty and cannot exceed the number of screens available
  - Each screen should be used by at least one task

  IMPORTANT: 
  - Your response must be a valid JSON object. Do not include any text before or after the JSON. Do not mark the response as JSON using "\`\`\`json". 
  - Each screen should be used by at least one task.

  Example format:
  {{
    "tasksWithScreens": [
      {{
        "task": "Task 1 description",
        "screens": [
          {{"screen_id": 0, "interaction": "describe what the user does on this screen to progress to the next screen"}},
          {{"screen_id": 1, "interaction": "describe what the user does on this screen to progress to the next screen"}},
          {{"screen_id": 3, "interaction": "describe what the user does on this screen to progress to the next screen"}},
          {{"screen_id": 4, "interaction": "describe what the user does on this screen to progress to the next screen"}}
        ]
      }},
      {{
        "task": "Task 2 description",
        "screens": [
          {{"screen_id": 0, "interaction": "describe what the user does on this screen to progress to the next screen"}},
          {{"screen_id": 2, "interaction": "describe what the user does on this screen to progress to the next screen"}},
          {{"screen_id": 5, "interaction": "describe what the user does on this screen to progress to the next screen"}}
        ]
      }}
    ]
  }}
`);


// export const promptSVGCodeGeneration = PromptTemplate.fromTemplate(
//   `Generate SVG code to render a wireframe UI mock-up of the following screen. Give only the code. No explanation or comments.
 

//   Screen Description:
//   {screenDescription}

//   Requirements:
//   - Include all necessary UI elements mentioned in the description, especially those listed in the "elements" field
//   - Implement all functionality described in the "functionality" field
//   - Follow the layout and interaction patterns specified
//   - The UI should be for a desktop application
//   - The SVG should resemble human hand-drawn wireframes
//   - Use Comic Sans MS as the font
//   - Only use gray-scale colors
//   - Use proper SVG syntax with valid attributes
//   - All attributes must have proper values (e.g., d="M 0 0 L 100 100", not d="M 0 0 y1=")
//   - Path elements should have complete and valid d attributes
//   - All quotes must be properly closed
//   - Use standard SVG elements: rect, circle, ellipse, line, polyline, polygon, path, text
//   - Include proper viewBox attribute on the root svg element
//   - Elements should have proper outlines/boundaries. 
//   - Use stroke and fill attributes for styling.
  
//   IMPORTANT: 
//   - Return only the complete SVG code. Do not include any explanations or text before or after the code. 
//   - Do not mark the response as SVG using "\`\`\`svg".
//   - Ensure all SVG attributes are properly formatted and complete.
//   - Pay special attention to the "elements" and "functionality" fields to ensure all specified UI components are included.
//   `
// );

// export const promptSVGCodeGeneration = PromptTemplate.fromTemplate(
//   `ROLE & GOAL:
// You are an expert UI wire‑framing assistant. Produce one complete, valid SVG that looks like a hand‑drawn wireframe of the screen described below.

// SCREEN DESCRIPTION:
// {screenDescription}

// MUST‑HAVE ELEMENTS & BEHAVIORS:
// - Include every UI element listed in “elements”.
// - Implement every behavior in “functionality”.
// - Desktop‑oriented layout.

// STYLE & FORMAT RULES:
// 1. Root <svg> must include a proper viewBox.
// 2. Every attribute value must be fully quoted (d, x, y, width, height, etc.).
// 3. No unclosed quotes; no stray characters before or after quotes.
// 4. Each <path> must contain a complete d="...".
// 5. Use stroke and fill attributes; avoid CSS classes.
// 6. Use Comic Sans MS font and gray‑scale colors only (#000 – #FFF) plus transparent fills.
// 7. OUTPUT ONLY THE SVG MARKUP — no prose, no code fences.

// SELF‑CHECK & REPAIR LOOP (DO NOT PRINT THIS SECTION):
// Repeat until all tests pass:
//   a) Store your draft in svg_code.
//   b) Regex‑wrap any bare attribute values:
//        svg_code = re.sub(r'([a-zA-Z_:][-a-zA-Z0-9_:.]*)=(?!["\'])([^"\'>\s]+)',
//                          lambda m: f'{{{{m.group(1)}}}}="{{{{m.group(2)}}}}"', svg_code)
//   c) Try to parse svg_code with an XML parser (e.g., xml.etree.ElementTree.fromstring).
//      • If parsing fails, read the error (line, column) and fix:
//          – Insert missing opening/closing quotes.
//          – Remove newlines inside quoted values.
//          – Escape or remove stray characters.
//      • If parsing succeeds, run this checklist:
//          1) Exactly one root <svg>.
//          2) viewBox present.
//          3) No unclosed tags or quotes.
//          4) Every <path> has a well‑formed d.
//          5) Only allowed elements appear (rect, circle, ellipse, line, polyline, polygon, path, text).
//          6) Colors limited to gray‑scale range.
//      • If any checklist item fails, repair svg_code and loop again.
//   d) When XML parse and checklist both succeed, respond with svg_code ONLY.
//   `
// );

export const promptSVGCodeGeneration = PromptTemplate.fromTemplate(
  `ROLE & GOAL:
You are an expert UI wire‑framing assistant. Produce one complete, valid SVG that looks like a hand‑drawn wireframe of the screen described below.

SCREEN DESCRIPTION:
{screenDescription}

MUST‑HAVE ELEMENTS & BEHAVIORS:
- Include every UI element listed in “elements”.
- Implement every behavior in “functionality”.

STYLE & FORMAT RULES:
1. Root <svg> must include a proper viewBox.
2. Every attribute value must be fully quoted (d, x, y, width, height, etc.).
3. No unclosed quotes; no stray characters before or after quotes.
4. Each <path> must contain a complete d="...".
5. Use stroke and fill attributes; avoid CSS classes.
6. Use Comic Sans MS font and gray‑scale colors only (#000 – #FFF) plus transparent fills.
7. OUTPUT ONLY THE SVG MARKUP — no prose, no code fences.

  `
);

export const promptTaskFlowGeneration = PromptTemplate.fromTemplate(
  `Given a task, the SVG UI codes for a sequence of screens needed to complete the task, and the screen interactions describing what the user does on each screen, identify the one interactive element (sometimes a few more) that the user needs to interact with on each screen to proceed to the next screen.

  Task: {task}
  SVG UI Codes for relevant screens:
  {uiCodes}
  Screen Interactions:
  {screenInteractions}

  Requirements:
  - For each screen, use the provided screen interaction description to determine which element(s) should be interacted with to transition to the next screen(s). The interaction description tells you what the user does on this screen.
  - Extract the complete SVG code snippet for the identified interactive element(s), including all attributes in a way that I can use it to retrieve the element from the SVG code.
  - For each screen, output an array of SVG code snippets for the identified interactive element(s), including its nested elements, if any
  - Be specific, avoid selecting too many elements or elements that contain many other elements
  - Match the interaction description to the appropriate UI elements in the SVG code

  IMPORTANT: 
  - Do not select elements that contain many other elements. Never select the entire svg.
  - Your response must be a valid JSON array. Do not include any text before or after the JSON.
  - Do not mark the response as JSON using "\`\`\`json".
  - Extract the complete SVG element code, including all attributes and nested elements
  - The output array must have exactly the same length as the input uiCodes array
  - If no clear interactive element is found, include an empty array for that screen
  - Focus on elements that match the described user interaction (e.g., if interaction says "click button", look for button elements)
  `
);

export const promptSVGCodeRevision = PromptTemplate.fromTemplate(
  `Revise the following SVG UI code based on the provided critiques. Each critique specifies a particular UI element and feedback for improvement. Make targeted improvements to address the specific feedback while preserving the existing design and structure.

  Original SVG Code:
  {originalUICode}

  Critiques to Address:
  {critiques}

  Requirements:
  - For each critique, identify the specific UI element mentioned and make targeted improvements
  - Use the ui_element information to locate and improve the correct part of the SVG
  - Apply the specific critique feedback to that element while keeping everything else unchanged
  - Preserve the existing design structure and layout
  - Keep the same visual style and approach
  - Only modify elements that are specifically mentioned in the critiques
  - Maintain all existing functionality and elements not mentioned in critiques
  - The SVG should still resemble human hand-drawn wireframes
  - Use Comic Sans MS as the font
  - Only use gray-scale colors
  - Use proper SVG syntax with valid attributes
  - All attributes must have proper values (e.g., d="M 0 0 L 100 100", not d="M 0 0 y1=")
  - Path elements should have complete and valid d attributes
  - All quotes must be properly closed
  - Use standard SVG elements: rect, circle, ellipse, line, polyline, polygon, path, text
  - Include proper viewBox attribute on the root svg element
  - Use stroke and fill attributes for styling
  
  IMPORTANT: 
  - Return only the complete revised SVG code. Do not include any explanations or text before or after the code. 
  - Do not mark the response as SVG using "\`\`\`svg".
  - Ensure all SVG attributes are properly formatted and complete.
  - Focus on making targeted improvements to the specific UI elements mentioned in the critiques.
  - This is an incremental revision, not a complete regeneration.
  - Use the ui_element information to make precise, surgical improvements.
  `
);

export const promptCritiqueToChanges = PromptTemplate.fromTemplate(
  `Analyze the provided critiques and translate them into specific, actionable changes to make to the SVG UI code. For each critique, identify the exact changes needed.

  Original SVG Code:
  {originalUICode}

  Critiques to Address:
  {critiques}

  Context:
  The target is SVG code that represents a wireframe UI mockup. This is a hand-drawn style wireframe.

  Requirements:
  - For each critique, identify the specific UI element using the ui_element information
  - Translate each critique into concrete, specific changes to make
  - Be precise about what needs to be modified (position, size, text, styling, etc.)
  - Specify exact values where possible (e.g., "move button 20px to the right", "change text from 'Submit' to 'Save'")
  - Focus on the specific element mentioned in each critique
  - Don't suggest changes to elements not mentioned in critiques
  - Consider the context of the UI element and its purpose
  - Changes should maintain the wireframe aesthetic (hand-drawn style, grayscale colors)

  Types of Changes Allowed:
  1) Add UI elements - Create new SVG elements (rect, circle, text, line, etc.) to add missing UI components
  2) Modify existing UI elements - Change position, size, text content, styling, or attributes of existing elements
  3) Remove existing UI elements - Delete SVG elements that are no longer needed or are problematic

  Output Format:
  Return a JSON array of changes, where each change object has:
  {{
    "ui_element": "element identifier from critique",
    "critique": "original critique text",
    "changes": [
      {{
        "type": "add|modify|remove",
        "description": "specific change to make",
        "target": "what to change (e.g., 'x attribute', 'text content', 'stroke width', 'add new button', 'remove redundant element')",
        "value": "new value or specific instruction",
        "svg_element": "for add: specify SVG element type (rect, circle, text, line, etc.) and attributes"
      }}
    ]
  }}

  IMPORTANT: 
  - Return only valid JSON. Do not include any explanations or text before or after.
  - Be specific and actionable in the changes.
  - Focus only on elements mentioned in critiques.
  - Each change should be implementable in SVG code.
  - Maintain wireframe aesthetic (hand-drawn style, grayscale colors, Comic Sans font).
  - For 'add' changes, specify the complete SVG element with attributes.
  - For 'modify' changes, specify exact attribute changes.
  - For 'remove' changes, identify the element to delete.
  `
);

export const promptApplyChangesToSVG = PromptTemplate.fromTemplate(
  `Apply the specified changes to the SVG UI code. Make only the exact changes requested while preserving everything else.

  Original SVG Code:
  {originalUICode}

  Changes to Apply:
  {changes}

  Requirements:
  - Apply only the specific changes listed in the changes array
  - Use the ui_element information to locate the correct SVG element
  - Make precise, surgical modifications to the identified elements
  - Preserve all other elements and their properties exactly as they are
  - Maintain the existing design structure and layout
  - Keep the same visual style and approach
  - The SVG should still resemble human hand-drawn wireframes
  - Use Comic Sans MS as the font
  - Only use gray-scale colors
  - Use proper SVG syntax with valid attributes
  - All attributes must have proper values
  - Path elements should have complete and valid d attributes
  - All quotes must be properly closed
  - Use standard SVG elements: rect, circle, ellipse, line, polyline, polygon, path, text
  - Include proper viewBox attribute on the root svg element
  - Use stroke and fill attributes for styling

  IMPORTANT: 
  - Return only the complete revised SVG code. Do not include any explanations or text before or after the code. 
  - Do not mark the response as SVG using "\`\`\`svg".
  - Ensure all SVG attributes are properly formatted and complete.
  - Make only the changes specified - do not add, remove, or modify other elements.
  - This is a surgical revision, not a complete regeneration.
  `
);