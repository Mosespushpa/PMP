/**
 * Storage Manager
 * Handles all data persistence using IndexedDB and localStorage
 */

const StorageManager = (function() {
    // IndexedDB configuration
    const DB_NAME = 'MusicAppDB';
    const DB_VERSION = 1;
    const STORE_MEDIA_ITEMS = 'mediaItems';
    
    // localStorage keys
    const LS_PLAYLISTS = 'playlists';
    const LS_PREFERENCES = 'preferences';
    const LS_PLAYBACK_STATE = 'playbackState';
    const LS_MEDIA_TYPE_FILTER = 'mediaTypeFilter';
    
    let db = null;
    
    /**
     * Initialize IndexedDB
     * @returns {Promise<IDBDatabase>} Database instance
     */
    async function initDB() {
        if (db) {
            return db;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(new Error('Failed to open IndexedDB'));
            };
            
            request.onsuccess = () => {
                db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                
                // Create mediaItems object store
                if (!database.objectStoreNames.contains(STORE_MEDIA_ITEMS)) {
                    const objectStore = database.createObjectStore(STORE_MEDIA_ITEMS, { 
                        keyPath: 'id' 
                    });
                    
                    // Create indexes for efficient querying
                    objectStore.createIndex('type', 'type', { unique: false });
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('artist', 'artist', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    
                    console.log('MediaItems object store created');
                }
            };
        });
    }
    
    /**
     * Save a media item to IndexedDB
     * @param {Object} item - Media item to save
     * @returns {Promise<string>} Item ID
     */
    async function saveMediaItem(item) {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_MEDIA_ITEMS], 'readwrite');
            const objectStore = transaction.objectStore(STORE_MEDIA_ITEMS);
            
            // Ensure item has required fields
            if (!item.id) {
                item.id = generateUUID();
            }
            if (!item.createdAt) {
                item.createdAt = Date.now();
            }
            item.updatedAt = Date.now();
            
            const request = objectStore.put(item);
            
            request.onsuccess = () => {
                resolve(item.id);
            };
            
            request.onerror = () => {
                console.error('Error saving media item:', request.error);
                reject(new Error('Failed to save media item'));
            };
        });
    }
    
    /**
     * Get a media item by ID
     * @param {string} id - Item ID
     * @returns {Promise<Object|null>} Media item or null if not found
     */
    async function getMediaItem(id) {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_MEDIA_ITEMS], 'readonly');
            const objectStore = transaction.objectStore(STORE_MEDIA_ITEMS);
            const request = objectStore.get(id);
            
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                console.error('Error getting media item:', request.error);
                reject(new Error('Failed to get media item'));
            };
        });
    }
    
    /**
     * Get all media items
     * @returns {Promise<Array>} Array of media items
     */
    async function getAllMediaItems() {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_MEDIA_ITEMS], 'readonly');
            const objectStore = transaction.objectStore(STORE_MEDIA_ITEMS);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('Error getting all media items:', request.error);
                reject(new Error('Failed to get media items'));
            };
        });
    }
    
    /**
     * Update a media item
     * @param {string} id - Item ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async function updateMediaItem(id, updates) {
        const item = await getMediaItem(id);
        if (!item) {
            throw new Error('Media item not found');
        }
        
        const updatedItem = {
            ...item,
            ...updates,
            id: item.id, // Ensure ID doesn't change
            updatedAt: Date.now()
        };
        
        await saveMediaItem(updatedItem);
    }
    
    /**
     * Delete a media item
     * @param {string} id - Item ID
     * @returns {Promise<void>}
     */
    async function deleteMediaItem(id) {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_MEDIA_ITEMS], 'readwrite');
            const objectStore = transaction.objectStore(STORE_MEDIA_ITEMS);
            const request = objectStore.delete(id);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                console.error('Error deleting media item:', request.error);
                reject(new Error('Failed to delete media item'));
            };
        });
    }
    
    /**
     * Get media items by type
     * @param {string} type - 'audio' or 'video'
     * @returns {Promise<Array>} Array of media items
     */
    async function getMediaItemsByType(type) {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_MEDIA_ITEMS], 'readonly');
            const objectStore = transaction.objectStore(STORE_MEDIA_ITEMS);
            const index = objectStore.index('type');
            const request = index.getAll(type);
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('Error getting media items by type:', request.error);
                reject(new Error('Failed to get media items by type'));
            };
        });
    }
    
    // ===================================
    // localStorage Operations
    // ===================================
    
    /**
     * Handle storage quota exceeded error
     * Notifies user and provides guidance on clearing data
     */
    function handleQuotaExceededError() {
        console.error('Storage quota exceeded');
        
        // Get current storage usage
        getStorageUsage().then(usage => {
            const message = `Storage is full (${usage.percentage.toFixed(1)}% used). Please delete some items or clear cached data to free up space.`;
            
            // Display user-friendly notification
            if (typeof window !== 'undefined' && window.alert) {
                alert(message);
            }
            
            console.warn('Storage Usage:', {
                used: formatBytes(usage.usage),
                total: formatBytes(usage.quota),
                percentage: `${usage.percentage.toFixed(1)}%`
            });
        }).catch(err => {
            console.error('Failed to get storage usage:', err);
        });
    }
    
    /**
     * Format bytes to human-readable string
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * Save playlists to localStorage
     * @param {Array} playlists - Array of playlist objects
     */
    function savePlaylists(playlists) {
        try {
            localStorage.setItem(LS_PLAYLISTS, JSON.stringify(playlists));
        } catch (error) {
            console.error('Error saving playlists:', error);
            if (error.name === 'QuotaExceededError') {
                handleQuotaExceededError();
                throw new Error('Storage quota exceeded. Please delete some data.');
            }
            throw error;
        }
    }
    
    /**
     * Get playlists from localStorage
     * @returns {Array} Array of playlist objects
     */
    function getPlaylists() {
        try {
            const data = localStorage.getItem(LS_PLAYLISTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting playlists:', error);
            return [];
        }
    }
    
    /**
     * Save user preferences to localStorage
     * @param {Object} preferences - User preferences object
     */
    function savePreferences(preferences) {
        try {
            localStorage.setItem(LS_PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some data.');
            }
            throw error;
        }
    }
    
    /**
     * Get user preferences from localStorage
     * @returns {Object} User preferences object
     */
    function getPreferences() {
        try {
            const data = localStorage.getItem(LS_PREFERENCES);
            return data ? JSON.parse(data) : getDefaultPreferences();
        } catch (error) {
            console.error('Error getting preferences:', error);
            return getDefaultPreferences();
        }
    }
    
    /**
     * Get default user preferences
     * @returns {Object} Default preferences
     */
    function getDefaultPreferences() {
        return {
            theme: 'dark',
            volume: 0.7,
            repeatMode: 'off',
            shuffleEnabled: false,
            mediaTypeFilter: 'all',
            persistPlaybackPosition: true
        };
    }
    
    /**
     * Save playback state to localStorage
     * @param {Object} state - Playback state object
     */
    function savePlaybackState(state) {
        try {
            const stateWithTimestamp = {
                ...state,
                timestamp: Date.now()
            };
            localStorage.setItem(LS_PLAYBACK_STATE, JSON.stringify(stateWithTimestamp));
        } catch (error) {
            console.error('Error saving playback state:', error);
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some data.');
            }
            throw error;
        }
    }
    
    /**
     * Get playback state from localStorage
     * @returns {Object|null} Playback state or null
     */
    function getPlaybackState() {
        try {
            const data = localStorage.getItem(LS_PLAYBACK_STATE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting playback state:', error);
            return null;
        }
    }
    
    /**
     * Clear playback state from localStorage
     */
    function clearPlaybackState() {
        try {
            localStorage.removeItem(LS_PLAYBACK_STATE);
        } catch (error) {
            console.error('Error clearing playback state:', error);
        }
    }
    
    /**
     * Save media type filter to localStorage
     * @param {string} filter - 'all', 'audio', or 'video'
     */
    function saveMediaTypeFilter(filter) {
        try {
            localStorage.setItem(LS_MEDIA_TYPE_FILTER, filter);
        } catch (error) {
            console.error('Error saving media type filter:', error);
        }
    }
    
    /**
     * Get media type filter from localStorage
     * @returns {string} Media type filter
     */
    function getMediaTypeFilter() {
        try {
            return localStorage.getItem(LS_MEDIA_TYPE_FILTER) || 'all';
        } catch (error) {
            console.error('Error getting media type filter:', error);
            return 'all';
        }
    }
    
    /**
     * Get storage usage estimate
     * @returns {Promise<Object>} Storage estimate with usage and quota
     */
    async function getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0,
                    percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
                };
            } catch (error) {
                console.error('Error getting storage estimate:', error);
            }
        }
        
        return {
            usage: 0,
            quota: 0,
            percentage: 0
        };
    }
    
    /**
     * Clear all data from IndexedDB and localStorage
     * @returns {Promise<void>}
     */
    async function clearAllData() {
        // Clear IndexedDB
        const database = await initDB();
        const transaction = database.transaction([STORE_MEDIA_ITEMS], 'readwrite');
        const objectStore = transaction.objectStore(STORE_MEDIA_ITEMS);
        await new Promise((resolve, reject) => {
            const request = objectStore.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        // Clear localStorage
        localStorage.removeItem(LS_PLAYLISTS);
        localStorage.removeItem(LS_PLAYBACK_STATE);
        localStorage.removeItem(LS_MEDIA_TYPE_FILTER);
        // Keep preferences
        
        console.log('All data cleared');
    }
    
    /**
     * Export library data as JSON
     * @returns {Promise<Blob>} Blob containing library data
     */
    async function exportLibrary() {
        const mediaItems = await getAllMediaItems();
        const playlists = getPlaylists();
        const preferences = getPreferences();
        
        // Convert media items to metadata only (no blobs)
        const mediaMetadata = mediaItems.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            artist: item.artist,
            duration: item.duration,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
            width: item.width,
            height: item.height,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));
        
        const exportData = {
            version: 1,
            exportDate: new Date().toISOString(),
            mediaItems: mediaMetadata,
            playlists: playlists,
            preferences: preferences,
            note: 'Media files and posters are stored separately in IndexedDB blobs'
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }
    
    /**
     * Import library data from JSON
     * @param {Blob} blob - Blob containing library data
     * @returns {Promise<void>}
     */
    async function importLibrary(blob) {
        const text = await blob.text();
        const importData = JSON.parse(text);
        
        // Validate import data
        if (!importData.version || !importData.mediaItems || !importData.playlists) {
            throw new Error('Invalid import data format');
        }
        
        // Import media items as metadata only (files must be re-uploaded)
        // Deduplicate by ID to avoid overwrites
        const existingItems = await getAllMediaItems();
        const existingIds = new Set(existingItems.map(item => item.id));
        
        for (const item of importData.mediaItems) {
            if (!existingIds.has(item.id)) {
                // Only import metadata, no fileBlob or posterBlob
                await saveMediaItem(item);
            }
        }
        
        // Import playlists (deduplicate by name to avoid overwrites)
        const existingPlaylists = getPlaylists();
        const existingNames = new Set(existingPlaylists.map(p => p.name.toLowerCase()));
        
        const newPlaylists = importData.playlists.filter(
            p => !existingNames.has(p.name.toLowerCase())
        );
        
        if (newPlaylists.length > 0) {
            savePlaylists([...existingPlaylists, ...newPlaylists]);
        }
        
        // Import preferences (optional, merge rather than replace)
        if (importData.preferences) {
            const currentPrefs = getPreferences();
            const mergedPrefs = { ...currentPrefs, ...importData.preferences };
            savePreferences(mergedPrefs);
        }
        
        console.log(`Library imported successfully: ${importData.mediaItems.length} items, ${newPlaylists.length} playlists`);
    }
    
    // Public API
    return {
        // IndexedDB operations
        initDB,
        saveMediaItem,
        getMediaItem,
        getAllMediaItems,
        updateMediaItem,
        deleteMediaItem,
        getMediaItemsByType,
        
        // localStorage operations
        savePlaylists,
        getPlaylists,
        savePreferences,
        getPreferences,
        savePlaybackState,
        getPlaybackState,
        clearPlaybackState,
        saveMediaTypeFilter,
        getMediaTypeFilter,
        
        // Storage management
        getStorageUsage,
        clearAllData,
        exportLibrary,
        importLibrary
    };
})();
