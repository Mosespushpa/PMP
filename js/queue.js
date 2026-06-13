/**
 * Queue Manager
 * Handles playback queue operations including queue manipulation, navigation, shuffle, and repeat modes
 */

const QueueManager = (function() {
    // Queue state
    let queue = [];
    let currentIndex = -1;
    let originalQueue = null; // For unshuffle functionality
    let shuffled = false;
    let repeatMode = 'off'; // 'off', 'all', 'one'
    
    // Repeat mode constants
    const RepeatMode = {
        OFF: 'off',
        ALL: 'all',
        ONE: 'one'
    };
    
    /**
     * Set the entire queue
     * @param {Array} items - Array of media items
     */
    function setQueue(items) {
        if (!Array.isArray(items)) {
            throw new Error('Queue items must be an array');
        }
        
        queue = [...items]; // Create a copy
        currentIndex = queue.length > 0 ? 0 : -1;
        originalQueue = null;
        shuffled = false;
    }
    
    /**
     * Add an item to the end of the queue
     * @param {Object} item - Media item to add
     */
    function addToQueue(item) {
        if (!item) {
            throw new Error('Item cannot be null or undefined');
        }
        
        queue.push(item);
        
        // If queue was empty, set current index to 0
        if (currentIndex === -1 && queue.length === 1) {
            currentIndex = 0;
        }
        
        // Also add to original queue if shuffled
        if (shuffled && originalQueue) {
            originalQueue.push(item);
        }
    }
    
    /**
     * Remove an item from the queue by index
     * @param {number} index - Index of item to remove
     */
    function removeFromQueue(index) {
        if (index < 0 || index >= queue.length) {
            throw new Error('Index out of bounds');
        }
        
        // Get the item being removed
        const removedItem = queue[index];
        
        // Remove from queue
        queue.splice(index, 1);
        
        // Also remove from original queue if shuffled
        if (shuffled && originalQueue) {
            const originalIndex = originalQueue.findIndex(item => item.id === removedItem.id);
            if (originalIndex !== -1) {
                originalQueue.splice(originalIndex, 1);
            }
        }
        
        // Adjust current index
        if (index < currentIndex) {
            currentIndex--;
        } else if (index === currentIndex) {
            // If we removed the current item, keep index the same
            // (it now points to the next item, or becomes invalid if queue is empty)
            if (currentIndex >= queue.length) {
                currentIndex = queue.length - 1;
            }
        }
        
        // If queue is empty, reset index
        if (queue.length === 0) {
            currentIndex = -1;
        }
    }
    
    /**
     * Clear all items from the queue
     */
    function clearQueue() {
        queue = [];
        currentIndex = -1;
        originalQueue = null;
        shuffled = false;
    }
    
    /**
     * Reorder queue by moving an item from one index to another
     * @param {number} fromIndex - Source index
     * @param {number} toIndex - Destination index
     */
    function reorderQueue(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= queue.length) {
            throw new Error('From index out of bounds');
        }
        if (toIndex < 0 || toIndex >= queue.length) {
            throw new Error('To index out of bounds');
        }
        
        // Remove item from source
        const [item] = queue.splice(fromIndex, 1);
        
        // Insert at destination
        queue.splice(toIndex, 0, item);
        
        // Adjust current index
        if (fromIndex === currentIndex) {
            // Current item was moved
            currentIndex = toIndex;
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
            // Item moved from before to after current position
            currentIndex--;
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
            // Item moved from after to before current position
            currentIndex++;
        }
    }
    
    /**
     * Get the current item in the queue
     * @returns {Object|null} Current media item or null
     */
    function getCurrentItem() {
        if (currentIndex >= 0 && currentIndex < queue.length) {
            return queue[currentIndex];
        }
        return null;
    }
    
    /**
     * Get the next item in the queue without advancing
     * @returns {Object|null} Next media item or null
     */
    function getNextItem() {
        if (queue.length === 0) {
            return null;
        }
        
        if (repeatMode === RepeatMode.ONE) {
            return getCurrentItem();
        }
        
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < queue.length) {
            return queue[nextIndex];
        } else if (repeatMode === RepeatMode.ALL) {
            return queue[0];
        }
        
        return null;
    }
    
    /**
     * Get the previous item in the queue without moving back
     * @returns {Object|null} Previous media item or null
     */
    function getPreviousItem() {
        if (queue.length === 0) {
            return null;
        }
        
        if (repeatMode === RepeatMode.ONE) {
            return getCurrentItem();
        }
        
        const prevIndex = currentIndex - 1;
        
        if (prevIndex >= 0) {
            return queue[prevIndex];
        } else if (repeatMode === RepeatMode.ALL) {
            return queue[queue.length - 1];
        }
        
        return null;
    }
    
    /**
     * Move to the next item in the queue
     * @returns {Object|null} Next media item or null
     */
    function moveToNext() {
        if (queue.length === 0) {
            return null;
        }
        
        if (repeatMode === RepeatMode.ONE) {
            return getCurrentItem();
        }
        
        currentIndex++;
        
        if (currentIndex >= queue.length) {
            if (repeatMode === RepeatMode.ALL) {
                currentIndex = 0;
            } else {
                currentIndex = queue.length - 1;
                return null; // No more items
            }
        }
        
        return getCurrentItem();
    }
    
    /**
     * Move to the previous item in the queue
     * @returns {Object|null} Previous media item or null
     */
    function moveToPrevious() {
        if (queue.length === 0) {
            return null;
        }
        
        if (repeatMode === RepeatMode.ONE) {
            return getCurrentItem();
        }
        
        currentIndex--;
        
        if (currentIndex < 0) {
            if (repeatMode === RepeatMode.ALL) {
                currentIndex = queue.length - 1;
            } else {
                currentIndex = 0;
                return null; // No previous items
            }
        }
        
        return getCurrentItem();
    }
    
    /**
     * Shuffle the queue while preserving the original order for unshuffle
     */
    function shuffle() {
        if (queue.length <= 1) {
            return; // Nothing to shuffle
        }
        
        // Save original queue if not already shuffled
        if (!shuffled) {
            originalQueue = [...queue];
        }
        
        // Get current item before shuffle
        const currentItem = getCurrentItem();
        
        // Fisher-Yates shuffle algorithm
        const shuffledQueue = [...queue];
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }
        
        queue = shuffledQueue;
        shuffled = true;
        
        // Update current index to point to the same item
        if (currentItem) {
            currentIndex = queue.findIndex(item => item.id === currentItem.id);
            if (currentIndex === -1) {
                currentIndex = 0;
            }
        }
    }
    
    /**
     * Restore the original queue order before shuffling
     */
    function unshuffle() {
        if (!shuffled || !originalQueue) {
            return; // Nothing to unshuffle
        }
        
        // Get current item before unshuffle
        const currentItem = getCurrentItem();
        
        // Restore original queue
        queue = [...originalQueue];
        shuffled = false;
        originalQueue = null;
        
        // Update current index to point to the same item
        if (currentItem) {
            currentIndex = queue.findIndex(item => item.id === currentItem.id);
            if (currentIndex === -1) {
                currentIndex = 0;
            }
        }
    }
    
    /**
     * Set the repeat mode
     * @param {string} mode - 'off', 'all', or 'one'
     */
    function setRepeatMode(mode) {
        const validModes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
        if (!validModes.includes(mode)) {
            throw new Error('Invalid repeat mode. Must be "off", "all", or "one"');
        }
        
        repeatMode = mode;
    }
    
    /**
     * Get the current repeat mode
     * @returns {string} Current repeat mode
     */
    function getRepeatMode() {
        return repeatMode;
    }
    
    /**
     * Check if the queue is currently shuffled
     * @returns {boolean} True if shuffled, false otherwise
     */
    function isShuffled() {
        return shuffled;
    }
    
    /**
     * Get the entire queue
     * @returns {Array} Copy of the queue
     */
    function getQueue() {
        return [...queue];
    }
    
    /**
     * Get the current index
     * @returns {number} Current index
     */
    function getCurrentIndex() {
        return currentIndex;
    }
    
    /**
     * Set the current index
     * @param {number} index - New current index
     */
    function setCurrentIndex(index) {
        if (index >= 0 && index < queue.length) {
            currentIndex = index;
        }
    }
    
    // Public API
    return {
        // Constants
        RepeatMode,
        
        // Queue Management
        setQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        
        // Navigation
        getCurrentItem,
        getNextItem,
        getPreviousItem,
        moveToNext,
        moveToPrevious,
        
        // Modes
        shuffle,
        unshuffle,
        setRepeatMode,
        
        // State
        getQueue,
        getCurrentIndex,
        setCurrentIndex,
        isShuffled,
        getRepeatMode
    };
})();
