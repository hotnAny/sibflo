# Figma-Style UI

A React-based Figma-style interface with a main canvas, auto-hide side panels, and floating sliders.

## Features

- **Main Canvas**: Figma-style canvas with grid background, zoom, and pan functionality
- **Auto-hide Left Panel**: Form for creating and managing elements
- **Auto-hide Right Panel**: Settings UI with multiple tabs
- **Floating Sliders**: Dynamic sliders that can be added/removed on the fly
- **Modern UI**: Clean, modern design inspired by Figma

## Components

### Canvas
- Grid background with customizable size
- Zoom in/out functionality (mouse wheel or buttons)
- Pan functionality (middle mouse or Alt + left mouse)
- Sample elements (rectangle, circle, text)
- Canvas controls for zoom and reset view

### Left Panel
- Auto-hide functionality with toggle button
- Form for creating new elements
- Element type selection (rectangle, circle, text, line)
- Color picker and dimension inputs
- List of created elements with delete functionality

### Right Panel
- Auto-hide functionality with toggle button
- Tabbed interface (General, Appearance, Grid)
- Toggle switches for various settings
- Range sliders for grid size
- Theme selection

### Floating Sliders
- Positioned on the left side of the canvas
- Collapsible interface
- Dynamic slider creation and removal
- Drag and drop reordering (planned)
- Real-time value updates

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the local development URL (usually `http://localhost:5173`)

## Usage

### Canvas Navigation
- **Zoom**: Use mouse wheel or click the zoom buttons in the bottom-right corner
- **Pan**: Hold Alt + left mouse button or middle mouse button and drag
- **Reset View**: Click the move button in the canvas controls

### Side Panels
- **Left Panel**: Click the chevron button on the left edge to open/close
- **Right Panel**: Click the chevron button on the right edge to open/close

### Floating Sliders
- **Add Slider**: Click the + button in the sliders header
- **Remove Slider**: Hover over a slider and click the X button
- **Collapse**: Click the collapse button to minimize the sliders panel

### Creating Elements
1. Open the left panel
2. Fill out the form with element details
3. Click "Add Element" to create the element
4. Elements will appear in the list below the form

### Settings
1. Open the right panel
2. Navigate between tabs (General, Appearance, Grid)
3. Adjust settings using toggles, sliders, and dropdowns

## Technologies Used

- React 18
- Vite
- Lucide React (for icons)
- CSS3 (for styling)

## Project Structure

```
src/
├── components/
│   ├── Canvas.jsx          # Main canvas component
│   ├── Canvas.css          # Canvas styles
│   ├── LeftPanel.jsx       # Left side panel
│   ├── LeftPanel.css       # Left panel styles
│   ├── RightPanel.jsx      # Right side panel
│   ├── RightPanel.css      # Right panel styles
│   ├── FloatingSliders.jsx # Floating sliders component
│   └── FloatingSliders.css # Sliders styles
├── App.jsx                 # Main app component
├── App.css                 # App styles
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## Customization

### Adding New Element Types
1. Update the `type` options in `LeftPanel.jsx`
2. Add corresponding styles in `Canvas.css`
3. Update the canvas content rendering logic

### Modifying Slider Behavior
1. Edit the `FloatingSliders.jsx` component
2. Update the slider state management in `App.jsx`
3. Modify styles in `FloatingSliders.css`

### Changing Theme
1. Update color variables in CSS files
2. Modify the theme selection in `RightPanel.jsx`
3. Add corresponding theme styles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.
