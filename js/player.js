/**
 * Media Player
 * Handles media playback and controls for both audio and video files
 */

const MediaPlayer = (function() {
    // Media elements
    let currentMediaElement = null;
    let currentItem = null;
    let isPlaying = false;
    let currentVolume = 0.7;
    let isMuted = false;
    let previousVolume = 0.7;
    
    // Playback state persistence
    const SAVE_POSITION_INTERVAL = 5000; // 5 seconds
    let savePositionTimer = null;
    
    // Event handlers
    const eventHandlers = {
        onTimeUpdate: null,
        onEnded: null,
        onError: null,
        onMetadataLoaded: null,
        onPlaybackStateChange: null
    };
    
    // Keyboard shortcuts
    const keyboardShortcuts = {
        ' ': togglePlayPause,        // Space - play/pause
        'ArrowLeft': () => seekBy(-10), // Left arrow - seek back 10s
        'ArrowRight': () => seekBy(10), // Right arrow - seek forward 10s
        'ArrowUp': () => adjustVolume(0.1),   // Up arrow - volume up
        'ArrowDown': () => adjustVolume(-0.1), // Down arrow - volume down
        'KeyN': next,                // N - next track
        'KeyP': previous,            // P - previous track
        'KeyM': toggleMute           // M - toggle mute
    };
    
    /**
     * Initialize media player
     */
    function init() {
        // Set up keyboard shortcuts
        document.addEventListener('keydown', handleKeyPress);
        
        console.log('MediaPlayer initialized');
    }
    
    /**
     * Create media element for the given item
     * @param {Object} item - Media item
     * @returns {HTMLElement} Audio or Video element
     */
    function createMediaElement(item) {
        const isVideo = item.type === 'video';
        const element = isVideo ? document.createElement('video') : document.createElement('audio');
        
        // Set common attributes
        element.preload = 'metadata';
        element.volume = currentVolume;
        
        // Set up event listeners
        element.addEventListener('loadedmetadata', () => {
            if (eventHandlers.onMetadataLoaded) {
                eventHandlers.onMetadataLoaded(element.duration);
            }
        });
        
        element.addEventListener('timeupdate', () => {
            if (eventHandlers.onTimeUpdate) {
                eventHandlers.onTimeUpdate(element.currentTime, element.duration);
            }
        });
        
        element.addEventListener('ended', handleMediaEnded);
        
        element.addEventListener('error', (e) => {
            console.error('Media playback error:', e);
            if (eventHandlers.onError) {
                eventHandlers.onError(item.title || 'Unknown', e.message);
            }
        });
        
        element.addEventListener('play', () => {
            isPlaying = true;
            if (eventHandlers.onPlaybackStateChange) {
                eventHandlers.onPlaybackStateChange(true);
            }
        });
        
        element.addEventListener('pause', () => {
            isPlaying = false;
            if (eventHandlers.onPlaybackStateChange) {
                eventHandlers.onPlaybackStateChange(false);
            }
        });
        
        return element;
    }
    
    /**
     * Load and play a media item
     * @param {Object} item - Media item to play
     * @returns {Promise<void>}
     */
    async function play(item) {
        if (!item) {
            throw new Error('No media item provided');
        }
        
        try {
            // Stop current playback
            stop();
            
            // Create new media element
            currentMediaElement = createMediaElement(item);
            currentItem = item;
            
            // Create object URL from blob
            if (item.fileBlob) {
                currentMediaElement.src = URL.createObjectURL(item.fileBlob);
            } else {
                throw new Error('No file data available');
            }
            
            // Load the media
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Media load timeout'));
                }, 10000); // 10 second timeout
                
                currentMediaElement.addEventListener('loadeddata', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
                
                currentMediaElement.addEventListener('error', () => {
                    clearTimeout(timeout);
                    reject(new Error('Failed to load media'));
                }, { once: true });
                
                currentMediaElement.load();
            });
            
            // Restore playback position if available
            const savedState = StorageManager.getPlaybackState();
            if (savedState && savedState.itemId === item.id && savedState.position > 0) {
                currentMediaElement.currentTime = savedState.position;
            }
            
            // Start playback
            await currentMediaElement.play();
            
            // Start saving position periodically
            startPositionSaving();
            
            console.log('Playing:', item.title);
            
        } catch (error) {
            console.error('Error playing media:', error);
            
            // Auto-skip to next on error during auto-play
            if (QueueManager.getQueue().length > 1) {
                console.log('Skipping to next due to playback error');
                setTimeout(() => next(), 1000);
            }
            
            throw error;
        }
    }
    
    /**
     * Pause playback
     */
    function pause() {
        if (currentMediaElement && !currentMediaElement.paused) {
            currentMediaElement.pause();
            stopPositionSaving();
        }
    }
    
    /**
     * Resume playback
     */
    async function resume() {
        if (currentMediaElement && currentMediaElement.paused) {
            await currentMediaElement.play();
            startPositionSaving();
        }
    }
    
    /**
     * Toggle play/pause
     */
    async function togglePlayPause() {
        if (!currentMediaElement) {
            // Start playing first item in queue
            const currentQueueItem = QueueManager.getCurrentItem();
            if (currentQueueItem) {
                await play(currentQueueItem);
            }
            return;
        }
        
        if (currentMediaElement.paused) {
            await resume();
        } else {
            pause();
        }
    }
    
    /**
     * Stop playback completely
     */
    function stop() {
        if (currentMediaElement) {
            currentMediaElement.pause();
            currentMediaElement.currentTime = 0;
            
            // Revoke object URL to free memory
            URL.revokeObjectURL(currentMediaElement.src);
            
            currentMediaElement = null;
        }
        
        currentItem = null;
        isPlaying = false;
        stopPositionSaving();
        
        if (eventHandlers.onPlaybackStateChange) {
            eventHandlers.onPlaybackStateChange(false);
        }
    }
    
    /**
     * Seek to a specific time
     * @param {number} time - Time in seconds (absolute)
     */
    function seek(time) {
        if (!currentMediaElement || typeof time !== 'number' || Number.isNaN(time)) return;
        const duration = currentMediaElement.duration || 0;
        currentMediaElement.currentTime = Math.max(0, Math.min(time, duration));
    }

    /**
     * Seek by a relative time delta
     * @param {number} delta - Time delta in seconds
     */
    function seekBy(delta) {
        if (!currentMediaElement || typeof delta !== 'number' || Number.isNaN(delta)) return;
        const duration = currentMediaElement.duration || 0;
        const newTime = (currentMediaElement.currentTime || 0) + delta;
        currentMediaElement.currentTime = Math.max(0, Math.min(newTime, duration));
    }
    
    /**
     * Set volume level
     * @param {number} level - Volume level (0.0 to 1.0)
     */
    function setVolume(level) {
        const clampedLevel = Math.max(0, Math.min(level, 1));
        currentVolume = clampedLevel;
        
        if (currentMediaElement && !isMuted) {
            currentMediaElement.volume = clampedLevel;
        }
        
        // Save to preferences
        const preferences = StorageManager.getPreferences();
        preferences.volume = clampedLevel;
        StorageManager.savePreferences(preferences);
    }
    
    /**
     * Adjust volume by a relative amount
     * @param {number} delta - Volume change (-1.0 to 1.0)
     */
    function adjustVolume(delta) {
        setVolume(currentVolume + delta);
    }
    
    /**
     * Toggle mute
     */
    function toggleMute() {
        if (isMuted) {
            unmute();
        } else {
            mute();
        }
    }
    
    /**
     * Mute audio
     */
    function mute() {
        if (currentMediaElement && !isMuted) {
            previousVolume = currentMediaElement.volume;
            currentMediaElement.volume = 0;
            isMuted = true;
        }
    }
    
    /**
     * Unmute audio
     */
    function unmute() {
        if (currentMediaElement && isMuted) {
            currentMediaElement.volume = previousVolume;
            isMuted = false;
        }
    }
    
    /**
     * Move to next track
     */
    async function next() {
        const nextItem = QueueManager.moveToNext();
        if (nextItem) {
            await play(nextItem);
        } else {
            stop();
        }
    }
    
    /**
     * Move to previous track
     */
    async function previous() {
        // If we're more than 3 seconds into the track, restart it
        if (currentMediaElement && currentMediaElement.currentTime > 3) {
            seek(0);
            return;
        }
        
        const prevItem = QueueManager.moveToPrevious();
        if (prevItem) {
            await play(prevItem);
        }
    }
    
    /**
     * Skip to a specific item in the queue
     * @param {number} index - Queue index
     */
    async function skipTo(index) {
        const queue = QueueManager.getQueue();
        if (index >= 0 && index < queue.length) {
            // Update queue position
            QueueManager.setCurrentIndex(index);
            const item = QueueManager.getCurrentItem();
            if (item) {
                await play(item);
            }
        }
    }
    
    /**
     * Handle media playback ended
     */
    async function handleMediaEnded() {
        if (eventHandlers.onEnded) {
            eventHandlers.onEnded();
        }
        
        // Clear saved position for completed item
        const savedState = StorageManager.getPlaybackState();
        if (savedState && savedState.itemId === currentItem?.id) {
            StorageManager.clearPlaybackState();
        }
        
        // Auto-advance to next item
        const nextItem = QueueManager.moveToNext();
        if (nextItem) {
            setTimeout(() => play(nextItem), 100);
        } else {
            stop();
        }
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    function handleKeyPress(event) {
        // Don't handle shortcuts if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const shortcut = keyboardShortcuts[event.code] || keyboardShortcuts[event.key];
        if (shortcut) {
            event.preventDefault();
            shortcut();
        }
    }
    
    /**
     * Start saving playback position periodically
     */
    function startPositionSaving() {
        stopPositionSaving(); // Clear any existing timer
        
        savePositionTimer = setInterval(() => {
            savePlaybackState();
        }, SAVE_POSITION_INTERVAL);
    }
    
    /**
     * Stop saving playback position
     */
    function stopPositionSaving() {
        if (savePositionTimer) {
            clearInterval(savePositionTimer);
            savePositionTimer = null;
        }
    }
    
    /**
     * Save current playback state
     */
    function savePlaybackState() {
        if (!currentMediaElement || !currentItem) return;
        
        const state = {
            itemId: currentItem.id,
            position: currentMediaElement.currentTime,
            duration: currentMediaElement.duration,
            isPlaying: isPlaying,
            queue: QueueManager.getQueue().map(item => item.id),
            currentIndex: QueueManager.getCurrentIndex(),
            repeatMode: QueueManager.getRepeatMode(),
            shuffled: QueueManager.isShuffled()
        };
        
        StorageManager.savePlaybackState(state);
    }
    
    /**
     * Restore playback state from storage
     */
    async function restorePlaybackState() {
        const savedState = StorageManager.getPlaybackState();
        if (!savedState) return;
        
        try {
            // Restore queue if available
            if (savedState.queue && savedState.queue.length > 0) {
                const mediaItems = [];
                for (const itemId of savedState.queue) {
                    const item = await StorageManager.getMediaItem(itemId);
                    if (item) {
                        mediaItems.push(item);
                    }
                }
                
                if (mediaItems.length > 0) {
                    QueueManager.setQueue(mediaItems);
                    
                    // Restore queue position
                    if (typeof savedState.currentIndex === 'number') {
                        QueueManager.setCurrentIndex(savedState.currentIndex);
                    }
                    
                    // Restore repeat mode
                    if (savedState.repeatMode) {
                        QueueManager.setRepeatMode(savedState.repeatMode);
                    }
                    
                    // Note: shuffle state is not restored to avoid re-randomizing the queue.
                    // The saved queue already reflects the shuffled order if needed.
                }
            }
            
            // Only restore playback if user had persistent playback enabled
            const preferences = StorageManager.getPreferences();
            if (preferences.persistPlaybackPosition) {
                const currentQueueItem = QueueManager.getCurrentItem();
                if (currentQueueItem && currentQueueItem.id === savedState.itemId) {
                    // Don't auto-play, just load the item
                    currentMediaElement = createMediaElement(currentQueueItem);
                    currentItem = currentQueueItem;
                    
                    if (currentQueueItem.fileBlob) {
                        currentMediaElement.src = URL.createObjectURL(currentQueueItem.fileBlob);
                        currentMediaElement.load();
                        
                        // Set position when metadata is loaded
                        currentMediaElement.addEventListener('loadedmetadata', () => {
                            if (savedState.position && savedState.position > 0) {
                                currentMediaElement.currentTime = savedState.position;
                            }
                        }, { once: true });
                    }
                }
            }
            
        } catch (error) {
            console.error('Error restoring playback state:', error);
        }
    }
    
    // Getters for current state
    function getCurrentItem() {
        return currentItem;
    }
    
    function getCurrentTime() {
        return currentMediaElement ? currentMediaElement.currentTime : 0;
    }
    
    function getDuration() {
        return currentMediaElement ? currentMediaElement.duration : 0;
    }
    
    function getPlaybackState() {
        return {
            isPlaying: isPlaying,
            currentItem: currentItem,
            currentTime: getCurrentTime(),
            duration: getDuration(),
            volume: currentVolume,
            isMuted: isMuted
        };
    }
    
    // Event handler setters
    function onTimeUpdate(handler) {
        eventHandlers.onTimeUpdate = handler;
    }
    
    function onEnded(handler) {
        eventHandlers.onEnded = handler;
    }
    
    function onError(handler) {
        eventHandlers.onError = handler;
    }
    
    function onMetadataLoaded(handler) {
        eventHandlers.onMetadataLoaded = handler;
    }
    
    function onPlaybackStateChange(handler) {
        eventHandlers.onPlaybackStateChange = handler;
    }
    
    // Public API
    return {
        // Initialization
        init,
        
        // Playback control
        play,
        pause,
        resume,
        togglePlayPause,
        stop,
        
        // Navigation
        next,
        previous,
        skipTo,
        
        // Seek and volume
        seek,
        setVolume,
        adjustVolume,
        toggleMute,
        mute,
        unmute,
        
        // State
        getCurrentItem,
        getCurrentTime,
        getDuration,
        getPlaybackState,
        restorePlaybackState,
        
        // Event handlers
        onTimeUpdate,
        onEnded,
        onError,
        onMetadataLoaded,
        onPlaybackStateChange
    };
})();
