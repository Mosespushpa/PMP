# Personal Music Web Player

A full-featured Progressive Web App (PWA) for managing and playing your personal music collection. Built with vanilla JavaScript, this app provides a complete music listening experience with playlist management, favorites, and standard music player controls.

## ✨ Features

### Core Features
- **Media Management**: Upload and organize your audio/video files
- **Playlist Creation**: Create, edit, and manage custom playlists
- **Queue Management**: Add songs to play queue with drag-and-drop reordering
- **Search & Filter**: Search by title/artist and filter by media type
- **Metadata Extraction**: Automatic extraction of song metadata
- **Poster Management**: Custom poster images for your media

### Player Features
- **Full Playback Controls**: Play, pause, seek, volume control
- **Auto-advance**: Automatically plays next song when current ends
- **Shuffle & Repeat**: Multiple playback modes (off, all, one)
- **Keyboard Shortcuts**: Space (play/pause), arrows (seek/volume), N/P (next/prev)
- **Playback Persistence**: Remembers position and resumes where you left off

### Modern Web Features
- **Progressive Web App**: Install on desktop/mobile, works offline
- **Dark Theme**: YouTube Music-inspired dark interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Virtual Scrolling**: Smooth performance with large libraries
- **Lazy Loading**: Efficient image loading for better performance

### Storage & Data
- **Client-side Storage**: IndexedDB for media, localStorage for preferences
- **Export/Import**: Backup and restore your library data
- **Offline Functionality**: Service worker caching for offline use
- **Data Persistence**: All data stored locally on your device

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)
1. Fork this repository
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch" → "main" branch
4. Your app will be available at `https://yourusername.github.io/personal-music-web-app/`

### Option 2: Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/personal-music-web-app.git
   cd personal-music-web-app
   ```

2. Serve the files using any static web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   
   # Using VS Code Live Server extension
   # Right-click index.html → "Open with Live Server"
   ```

3. Open your browser to `http://localhost:8000`

### Option 3: Other Hosting Services
The app works on any static hosting service:
- **Netlify**: Drag and drop the project folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Enable in repository settings
- **Firebase Hosting**: Deploy with Firebase CLI

## 📱 Installation as PWA

1. Open the app in a modern browser (Chrome, Firefox, Safari, Edge)
2. Look for the "Install" button in the address bar or app interface
3. Click "Install" to add it to your home screen/desktop
4. Launch like a native app with offline capabilities

## 🎵 Getting Started

### Upload Your Music
1. Click the "📤 Upload" button in the top bar
2. Select audio files (MP3, M4A, WAV, OGG) or video files (MP4, WEBM, OGV)
3. The app will automatically extract metadata and create default posters
4. Files are stored locally in your browser

### Create Playlists
1. Navigate to the "Playlists" section
2. Click "➕ Create Playlist"
3. Add songs using the three-dot menu on any media card
4. Drag and drop to reorder playlist items

### Playback Controls
- **Double-click** any song to play immediately
- Use the **bottom player bar** for transport controls
- **Keyboard shortcuts**:
  - `Space`: Play/Pause
  - `←/→`: Seek backward/forward 10 seconds
  - `↑/↓`: Volume up/down
  - `N`: Next track
  - `P`: Previous track
  - `M`: Mute/unmute

## 🛠️ Technical Details

### Architecture
- **Vanilla JavaScript (ES6+)**: No frameworks or build tools required
- **Modular Design**: Separated concerns across Storage, Library, Player, UI, etc.
- **Web Standards**: Uses modern APIs (IndexedDB, Service Workers, Web Audio)

### Browser Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+
- **Required Features**: IndexedDB, Service Workers, HTML5 Audio/Video
- **Progressive Enhancement**: Graceful degradation for missing features

### File Support
- **Audio Formats**: MP3, M4A, WAV, OGG
- **Video Formats**: MP4, WEBM, OGV  
- **Image Formats**: JPEG, PNG, WEBP (for posters)
- **File Size Limits**: 500MB per media file, 5MB per poster image

### Storage Limits
- **IndexedDB**: Browser-dependent (typically 50% of available disk space)
- **localStorage**: ~5-10MB for preferences and playlists
- **Quota Management**: Built-in storage monitoring and cleanup

## 🔧 Development

### Project Structure
```
├── index.html              # Main application entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline functionality
├── .nojekyll              # GitHub Pages configuration
├── css/
│   └── main.css           # Complete application styling
├── js/
│   ├── app.js             # Application initialization
│   ├── storage.js         # IndexedDB and localStorage management
│   ├── library.js         # Media file management and validation
│   ├── playlist.js        # Playlist CRUD operations
│   ├── queue.js           # Playback queue management
│   ├── player.js          # Media playback and controls
│   ├── ui.js              # User interface and interactions
│   ├── pwa-manager.js     # PWA functionality and service worker
│   └── utils.js           # Utility functions and helpers
├── assets/                # Icons and static assets
└── tests/                 # Test files and validation scripts
```

### Adding New Features
1. **Extend existing modules**: Each component has a clear public API
2. **Add new modules**: Follow the same pattern as existing modules
3. **Update UI**: Modify `ui.js` and add corresponding CSS
4. **Test thoroughly**: Use the provided test files for validation

### Customization
- **Themes**: Modify CSS custom properties in `:root`
- **Colors**: Update the accent colors and gradients
- **Layout**: Adjust grid layouts and responsive breakpoints
- **Features**: Enable/disable features by modifying module initialization

## 🧪 Testing

The app includes comprehensive test suites:
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing  
- **Property Tests**: Universal correctness validation
- **Performance Tests**: Large library handling

Run tests by opening the HTML test files in your browser.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing code style
4. Test your changes thoroughly
5. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: All APIs are documented in the source code
- **Examples**: Check the test files for usage examples

## 🙏 Acknowledgments

- Inspired by modern music streaming interfaces
- Built with web platform standards
- Icons and design influenced by Material Design principles

---

**Note**: This app stores all data locally in your browser. Your music files and playlists are private and never uploaded to any server.
