/**
 * Utility Functions
 * Provides common helper functions used throughout the application
 */

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
function generateUUID() {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Validate a UUID v4 string
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} True if valid UUID v4, false otherwise
 */
function isValidUUID(uuid) {
    if (typeof uuid !== 'string') {
        return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return '0:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
    }
    return `${minutes}:${padZero(secs)}`;
}

/**
 * Pad a number with leading zero if less than 10
 * @param {number} num - Number to pad
 * @returns {string} Padded number string
 */
function padZero(num) {
    return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Create an object URL from a Blob
 * @param {Blob} blob - Blob to create URL from
 * @returns {string} Object URL
 */
function createObjectURL(blob) {
    if (blob instanceof Blob) {
        return URL.createObjectURL(blob);
    }
    return '';
}

/**
 * Revoke an object URL
 * @param {string} url - Object URL to revoke
 */
function revokeObjectURL(url) {
    if (url && typeof url === 'string') {
        URL.revokeObjectURL(url);
    }
}

/**
 * Sanitize a string for use in HTML
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename to extract extension from
 * @returns {string} File extension (lowercase, without dot)
 */
function getFileExtension(filename) {
    if (typeof filename !== 'string') {
        return '';
    }
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if a file is an audio file based on MIME type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if audio file
 */
function isAudioFile(mimeType) {
    return typeof mimeType === 'string' && mimeType.startsWith('audio/');
}

/**
 * Check if a file is a video file based on MIME type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if video file
 */
function isVideoFile(mimeType) {
    return typeof mimeType === 'string' && mimeType.startsWith('video/');
}

/**
 * Validate media file format
 * @param {File} file - File to validate
 * @returns {Object} Validation result with valid flag and error message
 */
function validateMediaFile(file) {
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
    
    // Check file size (500 MB max)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB in bytes
    if (file.size > MAX_FILE_SIZE) {
        result.valid = false;
        result.errors.push(`File size exceeds maximum of ${formatFileSize(MAX_FILE_SIZE)}`);
    }
    
    // Check file format
    const supportedAudioFormats = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/x-m4a'];
    const supportedVideoFormats = ['video/mp4', 'video/webm', 'video/ogg'];
    const supportedFormats = [...supportedAudioFormats, ...supportedVideoFormats];
    
    if (!supportedFormats.includes(file.type)) {
        result.valid = false;
        result.errors.push(`Unsupported file format: ${file.type}. Supported formats: MP3, M4A, WAV, OGG, MP4, WEBM, OGV`);
    }
    
    return result;
}

/**
 * Validate poster image file
 * @param {File} file - Image file to validate
 * @returns {Promise<Object>} Validation result with valid flag and error message
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
    
    // Check file size (5 MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
    if (file.size > MAX_FILE_SIZE) {
        result.valid = false;
        result.errors.push(`Image size exceeds maximum of ${formatFileSize(MAX_FILE_SIZE)}`);
    }
    
    // Check file format
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
        result.valid = false;
        result.errors.push(`Unsupported image format: ${file.type}. Supported formats: JPEG, PNG, WEBP`);
    }
    
    // Check dimensions (2000x2000 max)
    try {
        const dimensions = await getImageDimensions(file);
        const MAX_DIMENSION = 2000;
        if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
            result.valid = false;
            result.errors.push(`Image dimensions exceed maximum of ${MAX_DIMENSION}x${MAX_DIMENSION} pixels`);
        }
    } catch (error) {
        result.valid = false;
        result.errors.push('Failed to read image dimensions');
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
    
    const MAX_TITLE_LENGTH = 200;
    const MAX_ARTIST_LENGTH = 100;
    
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
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Check if browser supports required features
 * @returns {Object} Compatibility check result
 */
function checkBrowserCompatibility() {
    const missing = [];
    
    if (!('indexedDB' in window)) {
        missing.push('IndexedDB');
    }
    
    if (!('serviceWorker' in navigator)) {
        missing.push('Service Workers');
    }
    
    if (!('localStorage' in window)) {
        missing.push('localStorage');
    }
    
    return {
        compatible: missing.length === 0,
        missingFeatures: missing
    };
}
