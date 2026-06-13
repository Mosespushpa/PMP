# Project Structure

## Root Directory Layout

```
d:\web\play\
├── index.html          # Main entry point and UI structure
├── script.js           # JavaScript for audio playback control
├── style.css           # Styling and layout definitions
├── *.jpeg, *.jpg       # Album artwork/poster images
├── *.mp3, *.m4a        # Audio files for songs
└── .kiro/              # Kiro AI assistant configuration
    ├── specs/          # Feature specifications
    └── steering/       # Project guidance documents
```

## File Organization Conventions

### HTML Structure
- Single-page application with all content in `index.html`
- Song cards defined inline with sequential IDs (`s-1`, `s-2`, etc.)
- Video elements use matching IDs (`video-1`, `video-2`, etc.)
- Each card links to its corresponding video via `onclick` handlers

### JavaScript Patterns
- Simple function-based approach (no classes or modules)
- Global function `playVideo(videoId)` handles all playback
- Toggle play/pause logic using native video API

### CSS Organization
- Flat structure with no preprocessors
- Class naming: `.card`, `.s-{number}` for song-specific styling
- Inline gradient backgrounds defined directly in selectors

### Media Assets
- Images and audio files stored in root directory
- Naming convention: descriptive filenames with underscores
- Image formats: JPEG, JPG, WEBP
- Audio formats: MP3, M4A

## Adding New Songs

To add a new song, update three locations in `index.html`:

1. Add a card div with incremented class (e.g., `s-6`)
2. Add corresponding video element with matching ID (e.g., `video-6`)
3. Ensure image `src` and video `poster` point to the same artwork file

## Code Style Guidelines

- **HTML**: Use semantic elements, maintain consistent indentation (4 spaces)
- **CSS**: One selector per line, properties grouped logically
- **JavaScript**: Use `var` for variables, camelCase for function names
- **Comments**: Minimal - code should be self-documenting given simplicity
