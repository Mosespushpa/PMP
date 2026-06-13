/**
 * Library Manager
 * Handles media library operations including file validation, metadata extraction,
 * poster management, CRUD operations, and search functionality
 */

const LibraryManager = (function() {
    // Constants for validation
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
    const MAX_POSTER_SIZE = 5 * 1024 * 1024; // 5 MB
    const MAX_POSTER_DIMENSION = 2000; // 2000x2000 pixels
    const MAX_TITLE_LENGTH = 200;
    const MAX_ARTIST_LENGTH = 100;
    const METADATA_TIMEOUT = 10000; // 10 seconds
    const MAX_BATCH_SIZE = 50;
    
    // Supported formats
    const SUPPORTED_AUDIO_FORMATS = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/x-m4a'];
    const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/ogg'];
    const SUPPORTED_MEDIA_FORMATS = [...SUPPORTED_AUDIO_FORMATS, ...SUPPORTED_VIDEO_FORMATS];
    
    const SUPPORTED_POSTER_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
    
    // Magic numbers for file type verification
    const MAGIC_NUMBERS = {
        // Audio formats
        'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // MP3 (ID3 tag or frame sync)
        'audio/mp4': [[0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70]], // M4A (ftyp box)
        'audio/x-m4a': [[0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70]], // M4A alternative MIME
        'audio/wav': [[0x52, 0x49, 0x46, 0x46]], // WAV (RIFF)
        'audio/ogg': [[0x4F, 0x67, 0x67, 0x53]], // OGG
        
        // Video formats
        'video/mp4': [[0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70]], // MP4 (ftyp box)
        'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // WEBM
        'video/ogg': [[0x4F, 0x67, 0x67, 0x53]], // OGV (same as OGG)
        
        // Image formats
        'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
        'image/png': [[0x89, 0x50, 0x4E, 0x47]], // PNG
        'image/webp': [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]] // WEBP
    };
    
    /**
     * Check if file matches magic number for its MIME type
     * @param {File} file - File to check
     * @returns {Promise<boolean>} True if magic number matches
     */
    async function checkMagicNumber(file) {
        const magicPatterns = MAGIC_NUMBERS[file.type];
        if (!magicPatterns) {
            return true; // No magic number check available for this type
        }
        
        try {
            const headerSize = Math.max(...magicPatterns.map(p => p.length));
            const blob = file.slice(0, headerSize);
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            
            // Check if any pattern matches
            for (const pattern of magicPatterns) {
                let matches = true;
                for (let i = 0; i < pattern.length; i++) {
                    if (pattern[i] !== null && bytes[i] !== pattern[i]) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking magic number:', error);
            return true; // Allow file if magic number check fails
        }
    }
    
    /**
     * Validate media file format and size
     * @param {File} file - File to validate
     * @returns {Promise<Object>} Validation result with valid flag and errors array
     */
    async function validateMediaFile(file) {
        const result = {
            valid: true,
            errors: []
        };
        
        // Check if file exists
        if (!file) {
            result.valid = false;
            result.errors.push('No file provided');
            return result;
        }
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            result.valid = false;
            result.errors.push(`File size exceeds maximum of ${formatFileSize(MAX_FILE_SIZE)}`);
        }
        
        // Check MIME type
        if (!SUPPORTED_MEDIA_FORMATS.includes(file.type)) {
            result.valid = false;
            result.errors.push(`Unsupported file format: ${file.type}. Supported formats: MP3, M4A, WAV, OGG, MP4, WEBM, OGV`);
        }
        
        // Check magic number for file type verification
        if (result.valid) {
            const magicNumberValid = await checkMagicNumber(file);
            if (!magicNumberValid) {
                result.valid = false;
                result.errors.push('File type does not match its extension');
            }
        }
        
        return result;
    }
    
    /**
     * Validate poster image file
     * @param {File} file - Image file to validate
     * @returns {Promise<Object>} Validation result with valid flag and errors array
     */
    async function validatePosterFile(file) {
        const result = {
            valid: true,
            errors: []
        };
        
        // Check if file exists
        if (!file) {
            result.valid = false;
            result.errors.push('No file provided');
            return result;
        }
        
        // Check file size
        if (file.size > MAX_POSTER_SIZE) {
            result.valid = false;
            result.errors.push(`Image size exceeds maximum of ${formatFileSize(MAX_POSTER_SIZE)}`);
        }
        
        // Check MIME type
        if (!SUPPORTED_POSTER_FORMATS.includes(file.type)) {
            result.valid = false;
            result.errors.push(`Unsupported image format: ${file.type}. Supported formats: JPEG, PNG, WEBP`);
        }
        
        // Check magic number
        if (result.valid) {
            const magicNumberValid = await checkMagicNumber(file);
            if (!magicNumberValid) {
                result.valid = false;
                result.errors.push('Image type does not match its extension');
            }
        }
        
        // Check dimensions
        if (result.valid) {
            try {
                const dimensions = await getImageDimensions(file);
                if (dimensions.width > MAX_POSTER_DIMENSION || dimensions.height > MAX_POSTER_DIMENSION) {
                    result.valid = false;
                    result.errors.push(`Image dimensions exceed maximum of ${MAX_POSTER_DIMENSION}x${MAX_POSTER_DIMENSION} pixels`);
                }
            } catch (error) {
                result.valid = false;
                result.errors.push('Failed to read image dimensions');
            }
        }
        
        return result;
    }
    
    /**
     * Get image dimensions from a file
     * @param {File} file - Image file
     * @returns {Promise<Object>} Object with width and height properties
     */
    function getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }
    
    /**
     * Extract metadata from media file using HTML5 APIs
     * @param {File} file - Media file
     * @returns {Promise<Object>} Metadata object with title, artist, duration, etc.
     */
    async function extractMetadata(file) {
        return new Promise((resolve) => {
            const isVideo = file.type.startsWith('video/');
            const element = isVideo ? document.createElement('video') : document.createElement('audio');
            const url = URL.createObjectURL(file);
            
            let timeoutId;
            let resolved = false;
            
            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                URL.revokeObjectURL(url);
                element.src = '';
            };
            
            const fallbackMetadata = () => {
                if (resolved) return;
                resolved = true;
                cleanup();
                
                // Use filename as title, remove extension
                const filename = file.name;
                const title = filename.substring(0, filename.lastIndexOf('.')) || filename;
                
                resolve({
                    title: title,
                    artist: 'Unknown',
                    duration: 0,
                    width: isVideo ? 0 : undefined,
                    height: isVideo ? 0 : undefined
                });
            };
            
            // Set timeout for metadata extraction
            timeoutId = setTimeout(() => {
                console.warn('Metadata extraction timed out for:', file.name);
                fallbackMetadata();
            }, METADATA_TIMEOUT);
            
            element.onloadedmetadata = () => {
                if (resolved) return;
                resolved = true;
                cleanup();
                
                // Extract basic metadata
                const filename = file.name;
                const title = filename.substring(0, filename.lastIndexOf('.')) || filename;
                
                const metadata = {
                    title: title,
                    artist: 'Unknown',
                    duration: element.duration || 0
                };
                
                // Add video dimensions if applicable
                if (isVideo) {
                    metadata.width = element.videoWidth || 0;
                    metadata.height = element.videoHeight || 0;
                }
                
                resolve(metadata);
            };
            
            element.onerror = () => {
                console.error('Error loading metadata for:', file.name);
                fallbackMetadata();
            };
            
            element.src = url;
            element.load();
        });
    }
    
    /**
     * Validate metadata field lengths
     * @param {string} title - Title to validate
     * @param {string} artist - Artist to validate
     * @returns {Object} Validation result
     */
    function validateMetadata(title, artist) {
        const result = {
            valid: true,
            errors: []
        };
        
        if (title && title.length > MAX_TITLE_LENGTH) {
            result.valid = false;
            result.errors.push(`Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`);
        }
        
        if (artist && artist.length > MAX_ARTIST_LENGTH) {
            result.valid = false;
            result.errors.push(`Artist exceeds maximum length of ${MAX_ARTIST_LENGTH} characters`);
        }
        
        return result;
    }
    
    /**
     * Generate a default poster for media items without custom posters
     * @param {Object} item - Media item
     * @returns {string} Data URL for default poster
     */
    function generateDefaultPoster(item) {
        // Create a canvas for the default poster
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 300, 300);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);
        
        // Add icon based on media type
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = item.type === 'video' ? '▶' : '♪';
        ctx.fillText(icon, 150, 150);
        
        // Add title text
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const title = item.title || 'Untitled';
        const maxWidth = 280;
        ctx.fillText(title.length > 30 ? title.substring(0, 27) + '...' : title, 150, 240, maxWidth);
        
        return canvas.toDataURL('image/png');
    }
    
    /**
     * Add a media file to the library
     * @param {File} file - Media file to add
     * @param {File} [posterFile] - Optional poster image file
     * @returns {Promise<Object>} Created media item
     */
    async function addMediaFile(file, posterFile) {
        // Validate media file
        const validation = await validateMediaFile(file);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Validate poster if provided
        if (posterFile) {
            const posterValidation = await validatePosterFile(posterFile);
            if (!posterValidation.valid) {
                throw new Error(posterValidation.errors.join('; '));
            }
        }
        
        // Extract metadata
        const metadata = await extractMetadata(file);
        
        // Determine media type
        const type = file.type.startsWith('video/') ? 'video' : 'audio';
        
        // Create media item
        const mediaItem = {
            id: generateUUID(),
            type: type,
            title: metadata.title,
            artist: metadata.artist,
            duration: metadata.duration,
            fileBlob: file,
            fileSize: file.size,
            mimeType: file.type,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add video dimensions if applicable
        if (type === 'video') {
            mediaItem.width = metadata.width;
            mediaItem.height = metadata.height;
        }
        
        // Add poster (store blob only, generate URL on demand to maintain session validity)
        if (posterFile) {
            mediaItem.posterBlob = posterFile;
        } else {
            // Generate default poster
            const defaultPosterDataUrl = generateDefaultPoster(mediaItem);
            // Convert data URL to Blob
            const response = await fetch(defaultPosterDataUrl);
            const blob = await response.blob();
            mediaItem.posterBlob = blob;
        }
        
        // Save to storage
        await StorageManager.saveMediaItem(mediaItem);
        
        return mediaItem;
    }
    
    /**
     * Add multiple media files in batch
     * @param {File[]} files - Array of media files (max 50)
     * @returns {Promise<Object[]>} Array of created media items
     */
    async function addMediaBatch(files) {
        if (!Array.isArray(files)) {
            throw new Error('Files must be an array');
        }
        
        if (files.length > MAX_BATCH_SIZE) {
            throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} files`);
        }
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                const item = await addMediaFile(files[i]);
                results.push(item);
            } catch (error) {
                console.error(`Error adding file ${files[i].name}:`, error);
                errors.push({
                    file: files[i].name,
                    error: error.message
                });
            }
        }
        
        if (errors.length > 0) {
            console.warn('Some files failed to upload:', errors);
        }
        
        return results;
    }
    
    /**
     * Update a media item's metadata
     * @param {string} id - Media item ID
     * @param {Object} updates - Fields to update (title, artist, etc.)
     * @returns {Promise<void>}
     */
    async function updateMediaItem(id, updates) {
        // Validate metadata if title or artist are being updated
        if (updates.title || updates.artist) {
            const validation = validateMetadata(updates.title, updates.artist);
            if (!validation.valid) {
                throw new Error(validation.errors.join('; '));
            }
        }
        
        // Update in storage
        await StorageManager.updateMediaItem(id, updates);
    }
    
    /**
     * Update poster image for a media item
     * @param {string} itemId - Media item ID
     * @param {File} posterFile - New poster image file
     * @returns {Promise<void>}
     */
    async function updatePoster(itemId, posterFile) {
        // Validate poster file
        const validation = await validatePosterFile(posterFile);
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Get existing item
        const item = await StorageManager.getMediaItem(itemId);
        if (!item) {
            throw new Error('Media item not found');
        }
        
        // Revoke old poster URL if it exists
        if (item.posterUrl && item.posterUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.posterUrl);
        }
        
        // Update poster
        const updates = {
            posterBlob: posterFile,
            posterUrl: URL.createObjectURL(posterFile)
        };
        
        await StorageManager.updateMediaItem(itemId, updates);
    }
    
    /**
     * Delete a media item from the library
     * @param {string} id - Media item ID
     * @returns {Promise<void>}
     */
    async function deleteMediaItem(id) {
        // Get item to revoke poster URL
        const item = await StorageManager.getMediaItem(id);
        if (item && item.posterUrl && item.posterUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.posterUrl);
        }

        // Remove item from any playlists
        const playlists = StorageManager.getPlaylists();
        const updatedPlaylists = playlists.map(playlist => {
            const filteredItemIds = playlist.itemIds.filter(itemId => itemId !== id);
            return filteredItemIds.length === playlist.itemIds.length
                ? playlist
                : { ...playlist, itemIds: filteredItemIds, updatedAt: Date.now() };
        });

        if (JSON.stringify(updatedPlaylists) !== JSON.stringify(playlists)) {
            StorageManager.savePlaylists(updatedPlaylists);
        }
        
        // Delete from storage
        await StorageManager.deleteMediaItem(id);
    }
    
    /**
     * Get all media items from the library
     * @returns {Promise<Object[]>} Array of media items
     */
    async function getAllMedia() {
        return await StorageManager.getAllMediaItems();
    }
    
    /**
     * Get media items filtered by type
     * @param {string} type - 'audio' or 'video'
     * @returns {Promise<Object[]>} Array of media items
     */
    async function getMediaByType(type) {
        if (type !== 'audio' && type !== 'video') {
            throw new Error('Type must be "audio" or "video"');
        }
        
        return await StorageManager.getMediaItemsByType(type);
    }
    
    /**
     * Search media items by title or artist
     * @param {string} query - Search query (case-insensitive)
     * @returns {Promise<Object[]>} Array of matching media items
     */
    async function searchMedia(query) {
        const allItems = await StorageManager.getAllMediaItems();
        
        // If query is empty, return all items
        if (!query || query.trim() === '') {
            return allItems;
        }
        
        // Case-insensitive search
        const lowerQuery = query.toLowerCase().trim();
        
        return allItems.filter(item => {
            const title = (item.title || '').toLowerCase();
            const artist = (item.artist || '').toLowerCase();
            return title.includes(lowerQuery) || artist.includes(lowerQuery);
        });
    }
    
    /**
     * Generate or restore poster URL from stored blob
     * @param {Object} item - Media item with posterBlob
     * @returns {string} Valid poster URL (blob URL)
     */
    function ensurePosterUrl(item) {
        if (!item) return '';
        if (item.posterUrl) {
            return item.posterUrl;
        }
        if (item.posterBlob) {
            const url = URL.createObjectURL(item.posterBlob);
            item.posterUrl = url;
            return url;
        }
        return '';
    }

    // Public API
    return {
        // File validation
        validateMediaFile,
        validatePosterFile,
        
        // Metadata
        extractMetadata,
        validateMetadata,
        
        // Media management
        addMediaFile,
        addMediaBatch,
        updateMediaItem,
        deleteMediaItem,
        
        // Poster management
        updatePoster,
        generateDefaultPoster,
        ensurePosterUrl,
        
        // Retrieval and search
        getAllMedia,
        getMediaByType,
        searchMedia,
        
        // Constants (for testing)
        MAX_FILE_SIZE,
        MAX_POSTER_SIZE,
        MAX_POSTER_DIMENSION,
        MAX_TITLE_LENGTH,
        MAX_ARTIST_LENGTH,
        MAX_BATCH_SIZE
    };
})();
