
Summarize changes and git commit them

-----

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


Adjust the slider style based on the screenshot:
- the knob should be draggable
- different options should be aligned with the slider
- the container can be wider
- hovering each option shows a tooltip that shows its description
- the create design button should be fixed, floating near the bottom

- add some bottom padding to the slider container
- each design option can fit in two lines


Do not display or initiate the floating slider widget until a design space is created or restored, especially upon refreshing the page. 

----

Required input fields


? Necessary
- add comment to each ui screen
- add design dim


~~~~~

Develop a chrome browser extension to log input events on two specific websites.

The logging only happens on the following websites:
- http://genuine-tool.vercel.app/
- https://stitch.withgoogle.com/
Match the right URLs + SPA nav. Use host_permissions for https://genuine-tool.vercel.app/* and https://stitch.withgoogle.com/*. Handle SPA route changes (popstate, history.pushState) so logging doesn’t silently stop.

On these websites, log the following javascript events and save in chrome.storage.local
mousedown
mouseup
click
dblclick
mousemove
mouseenter
mouseleave
mouseover
mouseout
contextmenu
wheel
dragstart
drag
dragend
drop
keydown
keyup
keypress
input
focus
blur
focusin
focusout
change
submit
reset
select
copy
cut
paste
scroll
resize
visibilitychange
beforeunload
hashchange

Each entry in the log only needs to contain the following:
- timestamp
- event type (e.g., mousedown)
- target element's outer html code as a string (Avoid giant outerHTML. Log a compact selector fingerprint instead: tagName, id, first 3 classes, data-* attrs, and a CSS path. If you must keep HTML, truncate (e.g., 500 chars) and strip volatile attrs)

IMPORTANT: Event sampling + coalescing. for mousemove/scroll, sample via requestAnimationFrame or getCoalescedEvents() with a hard cap (e.g., every ≥100ms) to keep volume down.

The logging automatically starts (with a unique session ID and include the page url) as a website is launched. Flush strategy: Buffer in memory, flush to chrome.storage.local every 60s, on tab hide (visibilitychange), and on pagehide (more reliable than beforeunload). Cap buffer size (e.g., 5–10k events per session) and chunk writes (e.g., 1–2 MB max per flush).


----

Upon a page reload, create a new session of user behavior log session.

Log the following events on all the html elements:

mousedown
mouseup
click
dblclick
mousemove
mouseenter
mouseleave
mouseover
mouseout
contextmenu
wheel
dragstart
drag
dragend
drop
keydown
keyup
keypress
input
focus
blur
focusin
focusout
change
submit
reset
select
copy
cut
paste
scroll
resize
visibilitychange
beforeunload
hashchange

Each entry in the log only needs to contain the following:
- timestamp
- event type (e.g., mousedown)
- target type (e.g., button)
- activity (e.g., activity="create a design space")

IMPORTANT: Event sampling + coalescing. for mousemove/scroll, sample via requestAnimationFrame or getCoalescedEvents() with a hard cap (e.g., every ≥100ms) to keep volume down.


The logging automatically starts (with a unique session ID) as the page is loaded. Flush strategy: Buffer in memory, flush to chrome.storage.local every 60s, on tab hide (visibilitychange), and on pagehide (more reliable than beforeunload). Cap buffer size (e.g., 5–10k events per session) and chunk writes (e.g., 1–2 MB max per flush).
