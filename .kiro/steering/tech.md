# Technology Stack

## Core Technologies

- **HTML5**: Semantic markup with native video/audio elements
- **CSS3**: Styling with gradient backgrounds and responsive layouts
- **Vanilla JavaScript**: No frameworks or libraries - pure JavaScript for interactivity

## Build System

This is a static web application with no build process required. Files are served directly to the browser.

## Project Dependencies

None - the project uses only native browser APIs and standard web technologies.

## Common Commands

### Development
```bash
# Serve locally (using any static server)
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js http-server (if installed)
npx http-server

# Option 3: VS Code Live Server extension
# Right-click index.html > "Open with Live Server"
```

### Deployment
Simply copy all files to a web server or hosting service. No compilation or bundling needed.

## Browser Compatibility

Requires modern browser with HTML5 video/audio support. Tested with:
- Chrome/Edge (Chromium-based)
- Firefox
- Safari
