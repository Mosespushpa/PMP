/**
 * Application Entry Point
 * Initializes the application and coordinates all modules
 */

(function() {
    'use strict';
    
    /**
     * Initialize the application
     */
    async function init() {
        console.log('Personal Music Web App - Initializing...');
        
        // Check browser compatibility
        const compatibility = checkBrowserCompatibility();
        if (!compatibility.compatible) {
            console.error('Browser compatibility issues:', compatibility.missingFeatures);
            alert(`Your browser doesn't support: ${compatibility.missingFeatures.join(', ')}. Some features may not work correctly.`);
        }
        
        try {
            // Initialize IndexedDB first
            await StorageManager.initDB();
            console.log('Storage initialized');
            
            // Initialize PWA Manager
            PWAManager.init();
            console.log('PWA Manager initialized');
            
            // Initialize MediaPlayer
            MediaPlayer.init();
            console.log('MediaPlayer initialized');
            
            // Check if we need to preload media
            if (!MediaPreloader.isAlreadyPreloaded()) {
                console.log('Starting media preloading...');
                showPreloadProgress();
                
                try {
                    await MediaPreloader.preloadAllMedia((progress, status) => {
                        updatePreloadProgress(progress, status);
                    });
                    hidePreloadProgress();
                } catch (error) {
                    console.error('Error during preloading:', error);
                    hidePreloadProgress();
                    // Continue with app initialization even if preloading fails
                }
            }
            
            // Initialize UI Controller
            await UIController.init();
            console.log('UI Controller initialized');
            
            // Restore playback state if enabled
            const preferences = StorageManager.getPreferences();
            if (preferences.persistPlaybackPosition) {
                await MediaPlayer.restorePlaybackState();
                console.log('Playback state restored');
            }
            
            // Handle URL hash navigation
            const hash = window.location.hash.slice(1);
            if (hash && ['home', 'songs', 'videos', 'playlists'].includes(hash)) {
                UIController.navigateTo(hash);
            } else {
                UIController.navigateTo('home');
            }
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            alert('Failed to initialize the application. Please refresh the page.');
        }
    }
    
    // Handle page visibility changes to save state
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, save current state
            const currentItem = MediaPlayer.getCurrentItem();
            if (currentItem) {
                const state = {
                    itemId: currentItem.id,
                    position: MediaPlayer.getCurrentTime(),
                    duration: MediaPlayer.getDuration(),
                    isPlaying: MediaPlayer.getPlaybackState().isPlaying,
                    queue: QueueManager.getQueue().map(item => item.id),
                    currentIndex: QueueManager.getCurrentIndex(),
                    repeatMode: QueueManager.getRepeatMode(),
                    shuffled: QueueManager.isShuffled()
                };
                StorageManager.savePlaybackState(state);
            }
        }
    });
    
    // Handle beforeunload to save state
    window.addEventListener('beforeunload', () => {
        const currentItem = MediaPlayer.getCurrentItem();
        if (currentItem) {
            const state = {
                itemId: currentItem.id,
                position: MediaPlayer.getCurrentTime(),
                duration: MediaPlayer.getDuration(),
                isPlaying: false, // Don't auto-play on reload
                queue: QueueManager.getQueue().map(item => item.id),
                currentIndex: QueueManager.getCurrentIndex(),
                repeatMode: QueueManager.getRepeatMode(),
                shuffled: QueueManager.isShuffled()
            };
            StorageManager.savePlaybackState(state);
        }
    });
    
    /**
     * Show preload progress overlay
     */
    function showPreloadProgress() {
        const overlay = document.createElement('div');
        overlay.id = 'preload-overlay';
        overlay.className = 'preload-overlay';
        overlay.innerHTML = `
            <div class="preload-content">
                <div class="preload-icon">🎵</div>
                <h2>Loading Your Music Library</h2>
                <div class="preload-progress-container">
                    <div class="preload-progress-bar" id="preload-progress-bar"></div>
                </div>
                <p id="preload-status">Preparing media files...</p>
                <small>This may take a few moments on first load</small>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    /**
     * Update preload progress
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} status - Current status message
     */
    function updatePreloadProgress(progress, status) {
        const progressBar = document.getElementById('preload-progress-bar');
        const statusElement = document.getElementById('preload-status');
        
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
        
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * Hide preload progress overlay
     */
    function hidePreloadProgress() {
        const overlay = document.getElementById('preload-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
