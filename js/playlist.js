/**
 * Playlist Manager
 * Handles playlist operations (create, rename, delete, add/remove items)
 */

const PlaylistManager = (function() {
    /**
     * Validate playlist name
     * @param {string} name - Playlist name to validate
     * @returns {boolean} True if valid, false otherwise
     */
    function validatePlaylistName(name) {
        // Name must be a non-empty string
        if (typeof name !== 'string' || name.trim().length === 0) {
            return false;
        }
        
        // Name should not be too long (reasonable limit)
        if (name.length > 100) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Create a new playlist
     * @param {string} name - Playlist name
     * @returns {Promise<Object>} Created playlist object
     */
    async function createPlaylist(name) {
        // Validate name
        if (!validatePlaylistName(name)) {
            throw new Error('Invalid playlist name. Name must be a non-empty string with max 100 characters.');
        }
        
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Check for duplicate names
        const duplicate = playlists.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
        if (duplicate) {
            throw new Error('A playlist with this name already exists.');
        }
        
        // Create new playlist
        const playlist = {
            id: generateUUID(),
            name: name.trim(),
            itemIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add to playlists array
        playlists.push(playlist);
        
        // Persist to localStorage
        StorageManager.savePlaylists(playlists);
        
        return playlist;
    }
    
    /**
     * Rename an existing playlist
     * @param {string} id - Playlist ID
     * @param {string} newName - New playlist name
     * @returns {Promise<void>}
     */
    async function renamePlaylist(id, newName) {
        // Validate new name
        if (!validatePlaylistName(newName)) {
            throw new Error('Invalid playlist name. Name must be a non-empty string with max 100 characters.');
        }
        
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Find playlist
        const playlist = playlists.find(p => p.id === id);
        if (!playlist) {
            throw new Error('Playlist not found.');
        }
        
        // Check for duplicate names (excluding current playlist)
        const duplicate = playlists.find(p => 
            p.id !== id && p.name.toLowerCase() === newName.trim().toLowerCase()
        );
        if (duplicate) {
            throw new Error('A playlist with this name already exists.');
        }
        
        // Update playlist name
        playlist.name = newName.trim();
        playlist.updatedAt = Date.now();
        
        // Persist to localStorage
        StorageManager.savePlaylists(playlists);
    }
    
    /**
     * Delete a playlist
     * @param {string} id - Playlist ID
     * @returns {Promise<void>}
     */
    async function deletePlaylist(id) {
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Find playlist index
        const index = playlists.findIndex(p => p.id === id);
        if (index === -1) {
            throw new Error('Playlist not found.');
        }
        
        // Remove playlist
        playlists.splice(index, 1);
        
        // Persist to localStorage
        StorageManager.savePlaylists(playlists);
    }
    
    /**
     * Get all playlists
     * @returns {Promise<Array>} Array of playlist objects
     */
    async function getAllPlaylists() {
        return StorageManager.getPlaylists();
    }
    
    /**
     * Add a media item to a playlist
     * @param {string} playlistId - Playlist ID
     * @param {string} itemId - Media item ID
     * @returns {Promise<void>}
     */
    async function addToPlaylist(playlistId, itemId) {
        // Validate itemId
        if (!itemId || typeof itemId !== 'string') {
            throw new Error('Invalid item ID.');
        }
        
        // Verify media item exists
        const mediaItem = await StorageManager.getMediaItem(itemId);
        if (!mediaItem) {
            throw new Error('Media item not found.');
        }
        
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Find playlist
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) {
            throw new Error('Playlist not found.');
        }
        
        // Check if item already exists in playlist
        if (playlist.itemIds.includes(itemId)) {
            throw new Error('Item already exists in playlist.');
        }
        
        // Add item to playlist
        playlist.itemIds.push(itemId);
        playlist.updatedAt = Date.now();
        
        // Persist to localStorage
        StorageManager.savePlaylists(playlists);
    }
    
    /**
     * Remove a media item from a playlist
     * @param {string} playlistId - Playlist ID
     * @param {string} itemId - Media item ID
     * @returns {Promise<void>}
     */
    async function removeFromPlaylist(playlistId, itemId) {
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Find playlist
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) {
            throw new Error('Playlist not found.');
        }
        
        // Find item index
        const index = playlist.itemIds.indexOf(itemId);
        if (index === -1) {
            throw new Error('Item not found in playlist.');
        }
        
        // Remove item
        playlist.itemIds.splice(index, 1);
        playlist.updatedAt = Date.now();
        
        // Persist to localStorage
        StorageManager.savePlaylists(playlists);
    }
    
    /**
     * Reorder items in a playlist (for drag-and-drop support)
     * @param {string} playlistId - Playlist ID
     * @param {number} fromIndex - Source index
     * @param {number} toIndex - Destination index
     * @returns {Promise<void>}
     */
    async function reorderPlaylist(playlistId, fromIndex, toIndex) {
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Find playlist
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) {
            throw new Error('Playlist not found.');
        }
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= playlist.itemIds.length) {
            throw new Error('Invalid source index.');
        }
        if (toIndex < 0 || toIndex >= playlist.itemIds.length) {
            throw new Error('Invalid destination index.');
        }
        
        // Reorder items
        const [movedItem] = playlist.itemIds.splice(fromIndex, 1);
        playlist.itemIds.splice(toIndex, 0, movedItem);
        playlist.updatedAt = Date.now();
        
        // Persist to localStorage
        StorageManager.savePlaylists(playlists);
    }
    
    /**
     * Get all media items in a playlist
     * @param {string} playlistId - Playlist ID
     * @returns {Promise<Array>} Array of media items
     */
    async function getPlaylistItems(playlistId) {
        // Get existing playlists
        const playlists = StorageManager.getPlaylists();
        
        // Find playlist
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) {
            throw new Error('Playlist not found.');
        }
        
        // Get all media items
        const items = [];
        for (const itemId of playlist.itemIds) {
            const item = await StorageManager.getMediaItem(itemId);
            if (item) {
                items.push(item);
            }
        }
        
        return items;
    }
    
    // Public API
    return {
        validatePlaylistName,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        getAllPlaylists,
        addToPlaylist,
        removeFromPlaylist,
        reorderPlaylist,
        getPlaylistItems
    };
})();
