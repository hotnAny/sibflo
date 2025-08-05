# Trial Logging System

This document describes the trial logging system implemented in the Sibflo application.

## Overview

The trial logging system automatically tracks user interactions and design generation processes, storing them in localStorage as a series of trials. Each trial represents a complete design space creation and design generation session.

## Trial Structure

A trial consists of the following components:

### 1. Trial Metadata
- `id`: Unique identifier for the trial
- `timestamp`: When the trial was created

### 2. Input Data
- `context`: User-provided context for the design space
- `user`: Description of the target user
- `goal`: Design goal or objective
- `tasks`: Array of tasks to be accomplished
- `examples`: Array of example scenarios
- `comments`: Additional user comments

### 3. Design Space
Array of design dimensions, each containing:
- `dimension_name`: Name of the design dimension
- `dimension_description`: Description of the dimension
- `options`: Array of design parameters/options for this dimension

### 4. Designs
Array of generated designs, each containing:
- `id`: Unique identifier for the design
- `core_concept`: Core concept of the design
- `design_parameters`: Array of selected design parameters
- `screens`: Array of screen specifications and UI code
- `taskScreenMapping`: Mapping of tasks to screens

## Usage

### Automatic Logging

The system automatically logs trials when:

1. **Design Space Creation**: When a user creates a new design space using the left panel
2. **Design Generation**: When a user generates a design using the floating sliders

### Manual Debugging

You can use the following functions in the browser console:

```javascript
// View all trial information
debugTrials()

// Export trials as JSON
exportTrials()

// Clear all trials
clearAllTrials()
```

### Programmatic Access

```javascript
import { trialLogger } from './services/trialLogger'

// Get all trials
const allTrials = trialLogger.getAllTrials()

// Get a specific trial
const trial = trialLogger.getTrial(trialId)

// Get trial statistics
const stats = trialLogger.getTrialStats()

// Export trials
const json = trialLogger.exportTrials()
```

## Storage

Trials are stored in localStorage under the key `sibflo_trials`. The data persists across browser sessions and can be exported/imported as needed.

## Data Structure Example

```json
{
  "id": "trial_1234567890_abc123",
  "timestamp": 1234567890,
  "input": {
    "context": "As a parent of a toddler...",
    "user": "A busy parent...",
    "goal": "Have fun, engaging activities...",
    "tasks": ["Plan weekend activities"],
    "examples": [],
    "comments": ""
  },
  "designSpace": [
    {
      "dimension_name": "Activity Type",
      "dimension_description": "Type of activities to include",
      "options": [
        {
          "option_name": "Educational",
          "option_description": "Learning-focused activities"
        }
      ]
    }
  ],
  "designs": [
    {
      "id": "design_1234567890_def456",
      "core_concept": "Interactive learning platform",
      "design_parameters": [
        {
          "dimension_description": "Activity Type",
          "selected_parameter": "Educational",
          "parameter_description": "Learning-focused activities"
        }
      ],
      "screens": [],
      "taskScreenMapping": {}
    }
  ]
}
```

## Integration Points

1. **LeftPanel.jsx**: Creates trials when design spaces are generated
2. **FloatingSliders.jsx**: Logs designs when they are created
3. **App.jsx**: Manages trial state and coordinates logging
4. **trialLogger.js**: Core logging service with localStorage integration

## Future Enhancements

- Export/import functionality for trial data
- Trial comparison and analysis tools
- Integration with external analytics platforms
- Trial visualization and reporting 