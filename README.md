# Figma-Style UI

A React-based Figma-style interface with a main canvas, floating sliders, design space exploration, and Gemini AI integration.

## Features

- **Main Canvas**: Figma-style canvas with grid background, zoom, and pan functionality
- **Floating Sliders**: Dynamic sliders that can be added/removed on the fly
- **Left Panel**: Design thinking and problem definition interface with Gemini AI integration
- **Gemini AI Integration**: Access to Gemini 1.5 Pro, Flash, and Flash Lite models
- **Modern UI**: Clean, modern design inspired by Figma

## Components

### Canvas
- Grid background with customizable size
- Zoom in/out functionality (mouse wheel or buttons)
- Pan functionality (middle mouse or Alt + left mouse)
- Sample elements (rectangle, circle, text)
- Canvas controls for zoom and reset view

### Floating Sliders
- Positioned on the left side of the canvas
- Collapsible interface
- Dynamic slider creation and removal
- Drag and drop reordering (planned)
- Real-time value updates

### Left Panel
- Auto-hide functionality with toggle button
- **Design Space Tab**: Design thinking interface with context, user, goal, tasks, examples, and comments
- **Gemini AI Tab**: API key management and AI model interaction
- Form-based input for design space exploration
- Add/remove tasks and examples functionality

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

### Floating Sliders
- **Add Slider**: Click the + button in the sliders header
- **Remove Slider**: Hover over a slider and click the X button
- **Collapse**: Click the collapse button to minimize the sliders panel

### Design Space
1. Open the left panel
2. Switch to the "Design Space" tab
3. Fill out the context, user, goal, tasks, examples, and comments
4. Use the form to define your design space
5. Add or remove tasks and examples as needed

### Gemini AI
1. Open the left panel
2. Switch to the "Gemini AI" tab
3. Enter your Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))
4. Select a model (Pro, Flash, or Flash Lite)
5. Enter your prompt and click "Generate" or "Stream"
6. View the AI response in the response section

## Technologies Used

- React 18
- Vite
- Lucide React (for icons)
- Google Generative AI SDK
- CSS3 (for styling)

## Project Structure

```
src/
├── components/
│   ├── Canvas.jsx          # Main canvas component
│   ├── Canvas.css          # Canvas styles
│   ├── FloatingSliders.jsx # Floating sliders component
│   ├── FloatingSliders.css # Sliders styles
│   ├── LeftPanel.jsx       # Left panel (design space + Gemini AI)
│   └── LeftPanel.css       # Left panel styles
├── services/
│   └── model.js           # Gemini AI model service
├── App.jsx                # Main app component
├── App.css                # App styles
├── main.jsx              # Entry point
└── index.css             # Global styles
```

## Gemini AI Models

The application supports three Gemini models:

### Model Pro (gemini-1.5-pro)
- **Description**: Most capable model for complex tasks
- **Max Tokens**: 8192
- **Use Case**: Complex reasoning, analysis, and creative tasks

### Model Flash (gemini-1.5-flash)
- **Description**: Fast and efficient model for most tasks
- **Max Tokens**: 8192
- **Use Case**: General purpose tasks, quick responses

### Model Lite (gemini-1.5-flash-lite)
- **Description**: Lightweight model for quick responses
- **Max Tokens**: 4096
- **Use Case**: Simple queries, quick interactions

## Customization

### Modifying Slider Behavior
1. Edit the `FloatingSliders.jsx` component
2. Update the slider state management in `App.jsx`
3. Modify styles in `FloatingSliders.css`

### Adding New AI Models
1. Edit the `GEMINI_MODELS` object in `src/services/model.js`
2. Add your new model configuration
3. Update the model selection in `LeftPanel.jsx`

### Changing Theme
1. Update color variables in CSS files
2. Modify the theme selection in your components
3. Add corresponding theme styles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.
