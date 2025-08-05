Create a react project (Figma style UI) that consists of
- a main canvas (similar to Figma) 
- a auto-hide left-aligned side panel for input a form of information
- some sliders float on the left side of the canvas, which will be generated on the fly
- a auto-hide right-aligned setting ui

create a model.js to allow access for modelPro (gemini-2.5-pro), modelFlash (gemini-2.5-flash), and modelLite (gemini-2.5-flash-lite)

(Call gen services & create ui step by step)

When clicking the create design space button, call the genDesignSpace function and use the results to update the floating sliders ui

Add a "Create Design" button at the bottom of the floating sliders panel, calling the genOverallDesigns function to create a design idea. Display the generated design idea as a design card on the canvas.

Once a design is generated, call genScreenDescriptions to generate screen specs and task screen mapping and store it appropriately as parts of the design object


Add an icon button on each design card to call genUICodesStreaming and as the ui codes are being generated, bring up a pop-up view that looks like the screen shot.

----



