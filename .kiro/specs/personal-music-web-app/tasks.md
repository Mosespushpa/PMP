# Implementation Plan: Personal Music Web App

## Overview

This implementation plan transforms a basic music player into a full-featured Progressive Web Application with YouTube Music-inspired UI. The app will be built using vanilla JavaScript (ES6+), HTML5, and CSS3, with client-side storage using IndexedDB and localStorage. The implementation follows a modular architecture with clear separation of concerns across presentation, business logic, media, data, and infrastructure layers.

## Tasks

- [x] 1. Set up project structure and core infrastructure
  - Create directory structure (js/, css/, assets/, tests/)
  - Set up HTML5 boilerplate with semantic structure
  - Create base CSS with CSS variables for theming
  - Initialize IndexedDB schema for media items
  - Set up localStorage structure for playlists and preferences
  - Create utility functions for UUID generation and validation
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2. Implement Storage Manager
  - [x] 2.1 Create StorageManager class with IndexedDB operations
    - Implement saveMediaItem, getMediaItem, getAllMediaItems methods
    - Implement updateMediaItem and deleteMediaItem methods
    - Create indexes for type, title, and artist fields
    - Add error handling for IndexedDB operations
    - _Requirements: 10.2, 10.4_
  
  - [x] 2.2 Write property test for Storage Round-Trip for Media References
    - **Property 21: Storage Round-Trip for Media References**
    - **Validates: Requirements 10.2, 10.4**
  
  - [x] 2.3 Add localStorage operations for playlists and preferences
    - Implement savePlaylists, getPlaylists methods
    - Implement savePreferences, getPreferences methods
    - Implement savePlaybackState, getPlaybackState methods
    - Add error handling for localStorage quota exceeded
    - _Requirements: 10.1, 10.3, 10.4_
  
  - [x] 2.4 Write property tests for localStorage round-trips
    - **Property 20: Storage Round-Trip for Playlists**
    - **Property 22: Storage Round-Trip for Preferences**
    - **Validates: Requirements 10.1, 10.3, 10.4**
  
  - [x] 2.5 Implement storage management utilities
    - Create getStorageUsage method with quota calculation
    - Implement clearAllData method
    - Add storage quota exceeded error handling with user notification
    - _Requirements: 10.5_
  
  - [x] 2.6 Write property test for Storage Quota Exceeded Handling
    - **Property 23: Storage Quota Exceeded Handling**
    - **Validates: Requirements 10.5**
  
  - [x] 2.7 Implement export/import functionality
    - Create exportLibrary method to serialize data to Blob
    - Create importLibrary method to deserialize and restore data
    - Add validation for imported data structure
    - _Requirements: 10.6, 10.7_
  
  - [x] 2.8 Write property test for Library Export-Import Round-Trip
    - **Property 24: Library Export-Import Round-Trip**
    - **Validates: Requirements 10.6, 10.7**

- [x] 3. Checkpoint - Verify storage layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Library Manager
  - [x] 4.1 Create LibraryManager class with file validation
    - Implement validateMediaFile method with format and size checks
    - Add MIME type validation for audio (MP3, M4A, WAV, OGG) and video (MP4, WEBM, OGV)
    - Implement file size validation (max 500 MB)
    - Add magic number verification for file type checking
    - _Requirements: 3.1, 14.3_
  
  - [x] 4.2 Write property tests for file validation
    - **Property 5: File Validation Rejects Invalid Media**
    - **Property 31: Unsupported Format Error Message**
    - **Validates: Requirements 3.1, 14.3**
  
  - [x] 4.3 Implement metadata extraction
    - Create extractMetadata method using HTML5 loadedmetadata event
    - Add 10-second timeout for metadata extraction
    - Implement fallback to filename and "Unknown" artist on failure
    - Extract duration, dimensions (for video), and basic metadata
    - _Requirements: 3.2, 3.3_
  
  - [x] 4.4 Write property test for Metadata Extraction Fallback
    - **Property 6: Metadata Extraction Fallback**
    - **Validates: Requirements 3.3**
  
  - [x] 4.5 Implement poster image validation and management
    - Create poster validation for formats (JPEG, PNG, WEBP)
    - Add poster size validation (max 5 MB)
    - Add poster dimension validation (max 2000x2000 pixels)
    - Implement updatePoster method
    - Create generateDefaultPoster method for items without posters
    - _Requirements: 3.4_
  
  - [x] 4.6 Write property test for Poster Validation Enforces Constraints
    - **Property 7: Poster Validation Enforces Constraints**
    - **Validates: Requirements 3.4**
  
  - [x] 4.7 Implement media item CRUD operations
    - Create addMediaFile method with validation and metadata extraction
    - Implement addMediaBatch method for batch uploads (max 50 files)
    - Create updateMediaItem method with metadata validation
    - Implement deleteMediaItem method
    - Add metadata edit validation (title ≤ 200 chars, artist ≤ 100 chars)
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 12.1, 12.2, 12.3_
  
  - [x] 4.8 Write property tests for media operations
    - **Property 8: Metadata Edit Validation**
    - **Property 9: Media Upload Round-Trip**
    - **Property 10: Batch Upload Processes All Files**
    - **Validates: Requirements 3.5, 3.6, 3.7, 3.8**
  
  - [x] 4.9 Implement media retrieval and search
    - Create getAllMedia method
    - Implement getMediaByType method for filtering by audio/video
    - Create searchMedia method with case-insensitive title/artist matching
    - _Requirements: 7.1, 7.2, 7.4, 7.5_
  
  - [x] 4.10 Write property tests for search functionality
    - **Property 16: Search Results Match Query**
    - **Property 17: Empty Search Returns All Items**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

- [x] 5. Checkpoint - Verify library management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Playlist Manager
  - [x] 6.1 Create PlaylistManager class with CRUD operations
    - Implement createPlaylist method with name validation
    - Create renamePlaylist method
    - Implement deletePlaylist method
    - Create getAllPlaylists method
    - Add validatePlaylistName method
    - _Requirements: 2.1, 2.2, 2.5, 2.6_
  
  - [x] 6.2 Write property tests for playlist creation and persistence
    - **Property 2: Playlist Creation and Persistence**
    - **Property 4: Playlist Modifications Persist**
    - **Validates: Requirements 2.1, 2.2, 2.5, 2.6, 2.7**
  
  - [x] 6.3 Implement playlist item management
    - Create addToPlaylist method
    - Implement removeFromPlaylist method
    - Create reorderPlaylist method for drag-and-drop support
    - Implement getPlaylistItems method
    - Ensure all modifications persist to localStorage
    - _Requirements: 2.3, 2.4, 2.7_
  
  - [x] 6.4 Write property test for Playlist Item Management Preserves Integrity
    - **Property 3: Playlist Item Management Preserves Integrity**
    - **Validates: Requirements 2.3, 2.4, 2.7**

- [x] 7. Implement Queue Manager
  - [x] 7.1 Create QueueManager class with queue operations
    - Implement setQueue, addToQueue, removeFromQueue methods
    - Create clearQueue and reorderQueue methods
    - Add queue navigation methods (getCurrentItem, getNextItem, getPreviousItem)
    - Implement moveToNext and moveToPrevious methods
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 7.2 Write property tests for queue operations
    - **Property 14: Queue Reordering Maintains Integrity**
    - **Property 15: Queue Item Removal**
    - **Validates: Requirements 5.2, 5.4**
  
  - [x] 7.3 Implement shuffle and repeat modes
    - Create shuffle method preserving original order for unshuffle
    - Implement unshuffle method
    - Create setRepeatMode method with OFF, ALL, ONE modes
    - Add getRepeatMode and isShuffled state methods
    - _Requirements: 5.6, 5.7_
  
  - [x] 7.4 Write property test for Queue Shuffle Preserves Items
    - **Property 13: Queue Shuffle Preserves Items**
    - **Validates: Requirements 5.6**

- [x] 8. Implement Media Player
  - [x] 8.1 Create MediaPlayer class with playback controls
    - Implement play method for both audio and video using HTML5 elements
    - Create pause, stop, seek, and setVolume methods
    - Add getCurrentTime, getDuration, getPlaybackState methods
    - Implement event handlers (onTimeUpdate, onEnded, onError, onMetadataLoaded)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_
  
  - [x] 8.2 Implement queue navigation and auto-advance
    - Create next, previous, skipTo methods
    - Implement auto-advance to next item on playback end
    - Add integration with QueueManager for queue state
    - _Requirements: 4.6, 5.3_
  
  - [x] 8.3 Write property test for Queue Auto-Advance
    - **Property 11: Queue Auto-Advance**
    - **Validates: Requirements 4.6**
  
  - [x] 8.4 Implement keyboard shortcuts
    - Create handleKeyPress method
    - Add Space for play/pause
    - Implement arrow keys for seek (left/right) and volume (up/down)
    - Add N for next track and P for previous track
    - _Requirements: 4.5_
  
  - [x] 8.5 Implement playback state persistence
    - Save playback position every 5 seconds
    - Store current item, position, queue, and playing state
    - Restore playback state on app reload
    - Clear saved position when item completes
    - _Requirements: 4.8, 13.1, 13.2, 13.4, 13.5_
  
  - [x] 8.6 Write property tests for playback state
    - **Property 12: Playback State Persistence Round-Trip**
    - **Property 29: Completed Item Position Clearing**
    - **Validates: Requirements 4.8, 13.1, 13.2, 13.4, 13.5**
  
  - [x] 8.7 Implement media error handling
    - Add error display with filename for load failures
    - Implement skip to next on error during auto-play
    - Create retry functionality for failed loads
    - _Requirements: 14.1_
  
  - [x] 8.8 Write property test for Load Error Message Display
    - **Property 30: Load Error Message Display**
    - **Validates: Requirements 14.1**

- [x] 9. Checkpoint - Verify playback functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement UI Controller - Core Structure
  - [x] 10.1 Create UIController class with navigation
    - Implement navigateTo method for view switching
    - Create showSidebar and hideSidebar methods
    - Add toggleMobileMenu for responsive navigation
    - Implement handleResize for responsive layout adjustments
    - Create sidebar with Home, Songs, Videos, Playlists sections
    - _Requirements: 6.1, 6.8, 8.2_
  
  - [x] 10.2 Implement media type filter UI
    - Create media type selector with Audio/Video/All options
    - Add filter state management and persistence
    - Implement filter application to media library display
    - Add "no items" message for empty filtered results
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 10.3 Write property test for Media Type Filter Persistence Round-Trip
    - **Property 1: Media Type Filter Persistence Round-Trip**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
  
  - [x] 10.4 Implement search UI
    - Create search bar in top navigation
    - Add handleSearchInput method with real-time filtering
    - Implement highlightSearchResults for matched text
    - Add debouncing (300ms) for search input
    - _Requirements: 6.7, 7.2, 7.3, 15.5_
  
  - [x] 10.5 Write property test for Search Input Debouncing
    - **Property 37: Search Input Debouncing**
    - **Validates: Requirements 15.5**

- [x] 11. Implement UI Controller - Media Display
  - [x] 11.1 Create media grid rendering with virtual scrolling
    - Implement renderMediaGrid method with grid layout
    - Create VirtualScroller class for libraries > 100 items
    - Add fixed item height (280px) with 5-item buffer
    - Implement scroll throttling (16ms for 60fps)
    - Reuse DOM elements via object pooling
    - _Requirements: 6.2, 15.2_
  
  - [x] 11.2 Write property test for Virtual Scrolling Activation
    - **Property 34: Virtual Scrolling Activation**
    - **Validates: Requirements 15.2**
  
  - [x] 11.3 Implement lazy loading for poster images
    - Use Intersection Observer API with 200px root margin
    - Load images in batches of 10
    - Implement progressive image loading (blur-up technique)
    - Cache loaded images in memory
    - _Requirements: 15.3_
  
  - [x] 11.4 Write property test for Lazy Loading of Poster Images
    - **Property 35: Lazy Loading of Poster Images**
    - **Validates: Requirements 15.3**
  
  - [x] 11.5 Implement next item preloading
    - Preload next queue item when current item is playing
    - Only preload when queue has at least 2 items
    - _Requirements: 15.4_
  
  - [x] 11.6 Write property test for Next Item Preloading
    - **Property 36: Next Item Preloading**
    - **Validates: Requirements 15.4**

- [x] 12. Implement UI Controller - Dialogs and Modals
  - [x] 12.1 Create upload dialog
    - Implement showUploadDialog with file input
    - Add drag-and-drop support for file upload
    - Create progress indicators for upload and metadata extraction
    - Support batch upload UI (up to 50 files)
    - _Requirements: 3.1, 3.7_
  
  - [x] 12.2 Create edit dialog
    - Implement showEditDialog for metadata editing
    - Add form validation for title (≤ 200 chars) and artist (≤ 100 chars)
    - Create poster image update UI
    - _Requirements: 3.5, 12.1, 12.2_
  
  - [x] 12.3 Implement confirmation and error dialogs
    - Create showConfirmDialog for delete confirmations
    - Implement showErrorMessage with user-friendly messages
    - Add error console logging for debugging
    - Ensure error messages have no technical jargon
    - _Requirements: 12.6, 14.2, 14.4, 14.5, 14.6_
  
  - [x] 12.4 Write property tests for error handling
    - **Property 28: Deletion Confirmation Display**
    - **Property 32: Error Console Logging**
    - **Property 33: User-Friendly Error Messages**
    - **Validates: Requirements 12.6, 14.5, 14.6**

- [x] 13. Implement UI Controller - Player Bar and Queue Display
  - [x] 13.1 Create persistent bottom player bar
    - Implement renderPlayerBar with current item display
    - Add playback controls (play/pause, next, previous, seek)
    - Create volume control slider
    - Display current time and duration
    - Show poster and metadata for current item
    - _Requirements: 6.3, 4.3, 4.4, 4.7_
  
  - [x] 13.2 Implement queue display
    - Create renderQueue method with reorderable items
    - Add drag-and-drop for queue reordering
    - Implement remove item from queue UI
    - Add shuffle and repeat mode toggles
    - _Requirements: 5.2, 5.4, 5.6, 5.7_
  
  - [x] 13.3 Implement playlist display
    - Create renderPlaylist method
    - Add playlist item list with play buttons
    - Implement three-dot menu for item actions
    - Add "Add to Playlist" functionality
    - _Requirements: 2.8, 6.8_

- [x] 14. Implement Responsive Mobile Design
  - [x] 14.1 Create responsive CSS with media queries
    - Add breakpoint at 768px for mobile devices
    - Implement collapsible sidebar as hamburger menu
    - Adjust grid layout for fewer columns on mobile
    - Optimize font sizes for mobile readability
    - _Requirements: 8.1, 8.2, 8.3, 8.6_
  
  - [x] 14.2 Implement touch-friendly UI
    - Ensure all touch targets are at least 44x44 pixels
    - Add touch gesture support for swipe navigation
    - Implement full-screen player view for mobile
    - _Requirements: 8.4, 8.5, 8.7_
  
  - [x] 14.3 Write property test for Touch Target Minimum Size
    - **Property 18: Touch Target Minimum Size**
    - **Validates: Requirements 8.4**

- [x] 15. Implement Dark Theme and Styling
  - [x] 15.1 Create dark theme CSS
    - Define CSS variables for theme colors
    - Implement dark background with accent colors
    - Add hover effects on interactive elements
    - Create smooth transitions between views
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [x] 15.2 Implement YouTube Music-inspired styling
    - Style media grid with poster images
    - Create card-based layout for media items
    - Add three-dot menu styling
    - Style player bar with modern controls
    - _Requirements: 6.2, 6.3, 6.8_

- [x] 16. Checkpoint - Verify UI functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement PWA Manager
  - [x] 17.1 Create web app manifest
    - Define manifest with name, short_name, description
    - Add start_url, display mode (standalone), theme_color, background_color
    - Include icons array with 192x192 and 512x512 sizes
    - _Requirements: 9.1, 9.8_
  
  - [x] 17.2 Implement service worker
    - Create service worker with install, activate, fetch event handlers
    - Implement cache-first strategy for static assets (HTML, CSS, JS)
    - Add stale-while-revalidate strategy for poster images
    - Use network-only for media files
    - Register service worker on app load
    - _Requirements: 9.2, 9.4, 9.5_
  
  - [x] 17.3 Write property test for Service Worker Registration Error Logging
    - **Property 19: Service Worker Registration Error Logging**
    - **Validates: Requirements 9.3**
  
  - [x] 17.4 Implement PWA installation and offline detection
    - Create PWAManager class with registerServiceWorker method
    - Implement onInstallPrompt handler for install prompt
    - Add isOnline, onOnline, onOffline methods
    - Display install prompt when criteria are met
    - Ensure standalone display mode when installed
    - _Requirements: 9.6, 9.7, 9.9_

- [x] 18. Implement Media Item Deletion with Cascade
  - [x] 18.1 Create deletion logic with cascade
    - Implement deleteMediaItem in LibraryManager
    - Remove item from all playlists when deleted
    - Remove item data from IndexedDB
    - Update UI to reflect deletion
    - _Requirements: 12.3, 12.4, 12.5_
  
  - [x] 18.2 Write property test for Media Item Deletion Cascade
    - **Property 27: Media Item Deletion Cascade**
    - **Validates: Requirements 12.3, 12.4, 12.5**

- [x] 19. Implement GitHub Pages Compatibility
  - [x] 19.1 Ensure static deployment compatibility
    - Use relative paths for all asset references
    - Create .nojekyll file to prevent Jekyll processing
    - Test subdirectory path compatibility
    - Ensure HTTPS compatibility
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6_
  
  - [x] 19.2 Write property tests for path compatibility
    - **Property 25: Relative Path Usage**
    - **Property 26: Subdirectory Path Compatibility**
    - **Validates: Requirements 11.2, 11.4**

- [x] 20. Implement Error Handler
  - [x] 20.1 Create ErrorHandler class
    - Implement displayError method with user-friendly messages
    - Create logError method for console logging
    - Add getUserFriendlyMessage method for error translation
    - Implement error recovery strategies for each error type
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 21. Implement Browser Compatibility Checker
  - [x] 21.1 Create CompatibilityChecker class
    - Implement checkCompatibility method
    - Check for IndexedDB, Service Worker, localStorage, HTML5 Audio/Video
    - Display compatibility warning for missing features
    - _Requirements: 14.4_

- [x] 22. Implement Initial Load Performance
  - [x] 22.1 Optimize initial load
    - Ensure app loads within 2 seconds on standard broadband
    - Minimize DOM manipulations by batching updates
    - Implement code splitting if needed
    - _Requirements: 15.1, 15.6_

- [x] 23. Integration and wiring
  - [x] 23.1 Wire all components together
    - Create main app.js entry point
    - Initialize all managers and controllers
    - Set up event listeners and component communication
    - Implement app initialization sequence
    - Load persisted data on startup
    - _Requirements: All requirements_
  
  - [x] 23.2 Write integration tests
    - Test end-to-end user flows (upload, play, create playlist)
    - Test PWA offline functionality
    - Test storage operations with real browser APIs
    - Test mobile responsive behavior
    - _Requirements: All requirements_

- [x] 24. Final checkpoint and deployment preparation
  - [x] 24.1 Create README with deployment instructions
    - Document GitHub Pages deployment steps
    - Add browser compatibility information
    - Include feature list and usage instructions
    - _Requirements: 11.3_
  
  - [x] 24.2 Run final verification
    - Ensure all tests pass
    - Verify PWA installation works
    - Test offline functionality
    - Check mobile responsiveness
    - Run accessibility audit
    - Verify browser compatibility
    - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- The implementation uses vanilla JavaScript (ES6+) as specified in the design
- All components follow the modular architecture defined in the design document
- Virtual scrolling and lazy loading are critical for performance with large libraries
- PWA features enable offline functionality and native-like mobile experience
- GitHub Pages deployment requires relative paths and .nojekyll file

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.3", "2.5", "2.7"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.4", "2.6", "2.8", "4.1"]
    },
    {
      "id": 3,
      "tasks": ["4.2", "4.3", "4.5", "4.7", "4.9"]
    },
    {
      "id": 4,
      "tasks": ["4.4", "4.6", "4.8", "4.10", "6.1", "7.1"]
    },
    {
      "id": 5,
      "tasks": ["6.2", "6.3", "7.2", "7.3", "8.1"]
    },
    {
      "id": 6,
      "tasks": ["6.4", "7.4", "8.2", "8.4", "8.5", "8.7"]
    },
    {
      "id": 7,
      "tasks": ["8.3", "8.6", "8.8", "10.1", "10.2", "10.4"]
    },
    {
      "id": 8,
      "tasks": ["10.3", "10.5", "11.1", "11.3", "11.5"]
    },
    {
      "id": 9,
      "tasks": ["11.2", "11.4", "11.6", "12.1", "12.2", "12.3"]
    },
    {
      "id": 10,
      "tasks": ["12.4", "13.1", "13.2", "13.3"]
    },
    {
      "id": 11,
      "tasks": ["14.1", "14.2", "15.1", "15.2"]
    },
    {
      "id": 12,
      "tasks": ["14.3", "17.1", "17.2"]
    },
    {
      "id": 13,
      "tasks": ["17.3", "17.4", "18.1"]
    },
    {
      "id": 14,
      "tasks": ["18.2", "19.1", "20.1", "21.1", "22.1"]
    },
    {
      "id": 15,
      "tasks": ["19.2", "23.1"]
    },
    {
      "id": 16,
      "tasks": ["23.2", "24.1", "24.2"]
    }
  ]
}
```
