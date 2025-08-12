# User Behavior Logging System

This document describes the comprehensive user behavior logging system implemented in the Sibflo application.

## Overview

The User Behavior Logger automatically captures and logs all user interactions with DOM elements across the entire application. It creates a new session for each page reload and efficiently stores event data with intelligent sampling and buffering.

## Features

### Automatic Event Capture
The system automatically logs the following event types:
- **Mouse Events**: `mousedown`, `mouseup`, `click`, `dblclick`, `mousemove`, `mouseenter`, `mouseleave`, `mouseover`, `mouseout`, `contextmenu`, `wheel`
- **Drag & Drop**: `dragstart`, `drag`, `dragend`, `drop`
- **Keyboard Events**: `keydown`, `keyup`, `keypress`
- **Form Events**: `input`, `focus`, `blur`, `focusin`, `focusout`, `change`, `submit`, `reset`, `select`
- **Clipboard Events**: `copy`, `cut`, `paste`
- **Window Events**: `scroll`, `resize`, `visibilitychange`, `beforeunload`, `hashchange`

### Smart Event Sampling
- **Mouse Movement**: Throttled to maximum 1 event per 100ms
- **Scroll Events**: Throttled to maximum 1 event per 100ms
- **Wheel Events**: Coalesced using `requestAnimationFrame`
- **Resize Events**: Coalesced using `requestAnimationFrame`

### Session Management
- Unique session ID generated for each page reload
- Automatic session start logging
- Session cleanup on page unload

### Efficient Storage
- **Buffer Management**: In-memory buffer with configurable size limit (default: 10,000 events)
- **Automatic Flushing**: Every 60 seconds, on tab hide, and on page unload
- **Storage Options**: 
  - Chrome Extension: `chrome.storage.local` with automatic chunking (1MB max per chunk)
  - Web App: `localStorage` with size limit handling
- **Data Format**: JSON with timestamp, event type, target type, and activity description

## Log Entry Structure

Each logged event contains:
```json
{
  "timestamp": 1703123456789,
  "eventType": "click",
  "targetType": "button",
  "activity": "clicked button: Submit Form",
  "sessionId": "session_1703123456789_abc123def"
}
```

## Activity Descriptions

The system automatically generates meaningful activity descriptions based on:
- **Element Type**: button, input, select, textarea, link, etc.
- **Element Content**: button text, input type, link text
- **Element Context**: form fields, sliders, dropdowns
- **Interaction Type**: clicking, typing, selecting, dragging

Examples:
- `"clicked button: Submit Form"`
- `"typing in text field"`
- `"changed dropdown selection"`
- `"interacted with slider"`
- `"clicked link: Documentation"`

## Usage

### Automatic Operation
The logging system starts automatically when the application loads. No manual configuration is required.

### Debug Functions
The following global functions are available in the browser console:

```javascript
// View current logging statistics
debugUserBehavior()

// Get comprehensive logging statistics
getUserBehaviorStats()

// Manually flush the log buffer
flushUserBehaviorLog()
```

### Demo Component
A comprehensive demo component is available to test the logging system:
1. Click the "🔍 Show Logging Demo" button in the top-right corner
2. Interact with various form elements, buttons, and interactive components
3. Use the debug controls to monitor logging activity

## Configuration

### Buffer Settings
```javascript
// In src/services/userBehaviorLogger.js
this.bufferSize = 10000        // Max events per session
this.flushInterval = 60000     // Flush every 60 seconds
this.mouseMoveThreshold = 100  // Mouse move throttling (ms)
this.scrollThreshold = 100     // Scroll throttling (ms)
```

### Storage Limits
- **Chrome Extension**: 1MB per chunk, automatic chunking
- **Web App**: 5MB total, automatic truncation if exceeded

## Performance Considerations

### Event Throttling
- High-frequency events (mousemove, scroll) are automatically throttled
- Uses `requestAnimationFrame` for smooth coalescing
- Passive event listeners for better performance

### Memory Management
- Configurable buffer size prevents memory bloat
- Automatic cleanup on component unmount
- Efficient JSON serialization

### Storage Optimization
- Automatic chunking for large datasets
- Size-based truncation for localStorage
- Batch writes to minimize I/O operations

## Browser Compatibility

- **Chrome/Edge**: Full support with `chrome.storage.local`
- **Firefox**: Full support with `localStorage`
- **Safari**: Full support with `localStorage`
- **Mobile Browsers**: Full support with `localStorage`

## Data Privacy

- All data is stored locally (no external transmission)
- Session-based isolation prevents cross-session data mixing
- Automatic cleanup on page unload
- No personally identifiable information is captured

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check buffer size configuration
   - Monitor event frequency in console
   - Use `debugUserBehavior()` to view current stats

2. **Storage Quota Exceeded**
   - Chrome: Check extension storage limits
   - Web: Check localStorage quota (usually 5-10MB)
   - Use `flushUserBehaviorLog()` to force flush

3. **Performance Issues**
   - Reduce buffer size if needed
   - Increase throttling thresholds
   - Monitor console for warnings

### Debug Commands
```javascript
// Check current buffer status
console.log('Buffer size:', userBehaviorLogger.buffer.length)

// View session information
console.log('Session ID:', userBehaviorLogger.sessionId)

// Check storage status
getUserBehaviorStats().then(stats => console.log(stats))
```

## Integration with Existing Systems

The User Behavior Logger is designed to work alongside existing logging systems:
- **Trial Logger**: Captures design space and design generation events
- **State Storage**: Manages application state persistence
- **Generation Service**: Handles AI-powered design generation

## Future Enhancements

- **Real-time Analytics**: Live dashboard for user behavior insights
- **Pattern Recognition**: AI-powered analysis of user interaction patterns
- **Export Options**: CSV, JSON, and analytics platform integrations
- **Custom Events**: Support for application-specific event logging
- **Performance Metrics**: User experience and performance correlation data
