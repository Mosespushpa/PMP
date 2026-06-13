/**
 * Media Preloader
 * Automatically loads media files from assets folders and creates default playlists
 */

const MediaPreloader = (function() {
    // Pre-defined media files structure
    const PREDEFINED_MEDIA = {
        // audio11: {
        //     folder: 'assets/Audio/11/',
        //     playlist: 'Christian Songs',
        //     items: [
        //         {
        //             filename: '[Lyric Video] Chinna Manushanukkulla - Gersson Edinbaro - Hephzibah Renjith_320kbps.mp3',
        //             poster: 'chinna_manushankulla.jpeg',
        //             title: 'Chinna Manushanukkulla',
        //             artist: 'Gersson Edinbaro & Hephzibah Renjith'
        //         },
        //         {
        //             filename: 'ENNA KODUPAEN NAAN - Christina Beryl Edward - TAMIL CHRISTIAN SONG - ROEH Vol 1 - Christmas Song_320kbps.mp3',
        //             poster: null,
        //             title: 'Enna Kodupaen Naan',
        //             artist: 'Christina Beryl Edward'
        //         },
        //         {
        //             filename: 'God_Will_Make_A_Way_-_Don_Moen_Religious_Song(128k).m4a',
        //             poster: null,
        //             title: 'God Will Make A Way',
        //             artist: 'Don Moen'
        //         },
        //         {
        //             filename: 'JESUS_LOVE_ME_🙌_WITH_EVERLASTING_LOVE_🙌_FULL_LYRICS___NEW_CHRISTIAN_ENGLISH_SONG_.(128k).m4a',
        //             poster: 'jesus_loves_me.jpeg',
        //             title: 'Jesus Love Me With Everlasting Love',
        //             artist: 'Unknown'
        //         },
        //         {
        //             filename: 'Stella_Ramola_-_It\'ll_Happen_(Official_Music_Video)(256k).mp3',
        //             poster: 'it\'ll_happen.jpeg',
        //             title: 'It\'ll Happen',
        //             artist: 'Stella Ramola'
        //         },
        //         {
        //             filename: 'Yesu_Ennai_Nesikkindraar_Sung_By_Hepzibah_Ranjith__JESUS_CHRIST_ShareTheLoveOfJesus(256k).mp3',
        //             poster: 'Yesu_Ennai_Nesikkindraar.jpg',
        //             title: 'Yesu Ennai Nesikkindraar',
        //             artist: 'Hepzibah Ranjith'
        //         },
        //         {
        //             filename: 'You_are_My_All_in_All(128k).m4a',
        //             poster: 'you_are.jpg',
        //             title: 'You Are My All in All',
        //             artist: 'Unknown'
        //         }
        //     ]
        // },
         audio22: {
            folder: 'assets/Audio/22/',
            playlist: 'Popular Music',
            items: [
                {
                    filename: 'Jolly O Gymkhana (From \'Beast\')_320kbps.mp3',
                    poster: 'Jolly O Gymkhana.jpg',
                    title: 'Jolly O Gymkhana',
                    artist: 'Beast Soundtrack'
                },
                {
                    filename: 'Marshmello ft. Bastille - Happier (Official Music Video)_320kbps.mp3',
                    poster: 'Marshmello ft. Bastille.jpg',
                    title: 'Happier',
                    artist: 'Marshmello ft. Bastille'
                },
                {
                    filename: 'PSY - GANGNAM STYLE(강남스타일) M-V_320kbps.mp3',
                    poster: 'PSY - GANGNAM STYLE.jpg',
                    title: 'Gangnam Style',
                    artist: 'PSY'
                },
                {
                    filename: 'The Chainsmokers & Coldplay - Something Just Like This (cover by COLOR MUSIC Choir)_320kbps.mp3',
                    poster: 'The Chainsmokers & Coldplay.jpg',
                    title: 'Something Just Like This',
                    artist: 'The Chainsmokers & Coldplay'
                },
                {
                    filename: 'TONES AND I - DANCE MONKEY (OFFICIAL VIDEO)_320kbps.mp3',
                    poster: 'TONES AND I - DANCE MONKEY.jpg',
                    title: 'Dance Monkey',
                    artist: 'Tones and I'
                }
            ]
        }
        // videos: {
        //     folder: 'assets/video/',
        //     playlist: 'Music Videos',
        //     items: [
        //         {
        //             filename: 'Jolly O Gymkhana (From \'Beast\').mp4',
        //             poster: null,
        //             title: 'Jolly O Gymkhana',
        //             artist: 'Beast'
        //         },
        //         {
        //             filename: 'Marshmello ft. Bastille - Happier (Official Music Video).mp4',
        //             poster: null,
        //             title: 'Happier',
        //             artist: 'Marshmello ft. Bastille'
        //         },
        //         {
        //             filename: 'PSY - GANGNAM STYLE(강남스타일) M-V.mp4',
        //             poster: null,
        //             title: 'Gangnam Style',
        //             artist: 'PSY'
        //         },
        //         {
        //             filename: 'The Chainsmokers & Coldplay - Something Just Like This (cover by COLOR MUSIC Choir).mp4',
        //             poster: null,
        //             title: 'Something Just Like This',
        //             artist: 'The Chainsmokers & Coldplay'
        //         },
        //         {
        //             filename: 'TONES AND I - DANCE MONKEY (OFFICIAL VIDEO).mp4',
        //             poster: null,
        //             title: 'Dance Monkey',
        //             artist: 'Tones and I'
        //         }
        //     ]
        // }
    };

    /**
     * Check if preloading has already been done
     * @returns {boolean} True if already preloaded
     */
    function isAlreadyPreloaded() {
        const preferences = StorageManager.getPreferences();
        return preferences.preloadComplete === true;
    }

    /**
     * Mark preloading as complete
     */
    function markPreloadComplete() {
        const preferences = StorageManager.getPreferences();
        preferences.preloadComplete = true;
        StorageManager.savePreferences(preferences);
    }

    /**
     * Create a blob from a URL (for files in assets folder)
     * @param {string} url - File URL
     * @returns {Promise<Blob>} File blob
     */
    async function createBlobFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('Error creating blob from URL:', error);
            throw error;
        }
    }

    /**
     * Get MIME type from filename
     * @param {string} filename - File name
     * @returns {string} MIME type
     */
    function getMimeTypeFromFilename(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'm4a': 'audio/mp4',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'ogv': 'video/ogg'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Encode asset path into a valid URL
     * @param {string} path - Relative asset path
     * @returns {string} Encoded absolute URL
     */
    function encodeAssetUrl(path) {
        try {
            const base = location.origin.endsWith('/') ? location.origin : `${location.origin}/`;
            return new URL(path, base).href;
        } catch (error) {
            console.warn('Could not encode asset URL:', path, error);
            return path;
        }
    }

    /**
     * Load a single media item
     * @param {Object} itemConfig - Item configuration
     * @param {string} folder - Base folder path
     * @returns {Promise<Object>} Created media item
     */
    async function loadMediaItem(itemConfig, folder) {
        try {
            const audioUrl = encodeAssetUrl(folder + itemConfig.filename);
            const audioBlob = await createBlobFromUrl(audioUrl);
            
            // Determine media type
            const mimeType = getMimeTypeFromFilename(itemConfig.filename);
            const type = mimeType.startsWith('video/') ? 'video' : 'audio';
            
            // Create media item
            const mediaItem = {
                id: generateUUID(),
                type: type,
                title: itemConfig.title,
                artist: itemConfig.artist,
                duration: 0, // Will be set when metadata loads
                fileBlob: audioBlob,
                fileSize: audioBlob.size,
                mimeType: mimeType,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            // Add poster if available
            if (itemConfig.poster) {
                try {
                    const posterUrl = encodeAssetUrl(folder + itemConfig.poster);
                    const posterBlob = await createBlobFromUrl(posterUrl);
                    mediaItem.posterBlob = posterBlob;
                    mediaItem.posterUrl = URL.createObjectURL(posterBlob);
                } catch (error) {
                    console.warn(`Could not load poster for ${itemConfig.title}:`, error);
                    // Generate default poster
                    mediaItem.posterUrl = generateDefaultPosterUrl(mediaItem);
                }
            } else {
                // Generate default poster
                mediaItem.posterUrl = generateDefaultPosterUrl(mediaItem);
            }
            
            // Save to storage
            await StorageManager.saveMediaItem(mediaItem);
            
            console.log(`Loaded media item: ${mediaItem.title}`);
            return mediaItem;
            
        } catch (error) {
            console.error(`Error loading media item ${itemConfig.title}:`, error);
            return null;
        }
    }

    /**
     * Generate default poster URL for items without custom posters
     * @param {Object} item - Media item
     * @returns {string} Default poster URL
     */
    function generateDefaultPosterUrl(item) {
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="300" height="300" fill="url(#grad)" />
                <text x="150" y="150" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle">
                    ${item.type === 'video' ? '▶' : '♪'}
                </text>
                <text x="150" y="240" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
                    ${(item.title || 'Untitled').substring(0, 20)}
                </text>
            </svg>
        `)}`;
    }

    /**
     * Create playlist from loaded items
     * @param {string} playlistName - Playlist name
     * @param {Array} itemIds - Array of media item IDs
     * @returns {Promise<void>}
     */
    async function createPlaylistFromItems(playlistName, itemIds) {
        try {
            // Check if playlist already exists
            const existingPlaylists = StorageManager.getPlaylists();
            const existingPlaylist = existingPlaylists.find(p => p.name === playlistName);
            
            if (existingPlaylist) {
                console.log(`Playlist "${playlistName}" already exists, skipping creation`);
                return;
            }
            
            // Create playlist
            await PlaylistManager.createPlaylist(playlistName);
            
            // Get the created playlist
            const playlists = StorageManager.getPlaylists();
            const playlist = playlists.find(p => p.name === playlistName);
            
            if (playlist) {
                // Add all items to playlist
                for (const itemId of itemIds) {
                    try {
                        await PlaylistManager.addToPlaylist(playlist.id, itemId);
                    } catch (error) {
                        console.warn(`Could not add item ${itemId} to playlist ${playlistName}:`, error);
                    }
                }
                
                console.log(`Created playlist "${playlistName}" with ${itemIds.length} items`);
            }
            
        } catch (error) {
            console.error(`Error creating playlist ${playlistName}:`, error);
        }
    }

    /**
     * Load all predefined media and create playlists
     * @param {Function} onProgress - Progress callback function
     * @returns {Promise<void>}
     */
    async function preloadAllMedia(onProgress) {
        // Check if already preloaded
        if (isAlreadyPreloaded()) {
            console.log('Media already preloaded, skipping...');
            if (onProgress) onProgress(100, 'Already loaded');
            return;
        }

        const allGroups = Object.keys(PREDEFINED_MEDIA);
        const totalItems = Object.values(PREDEFINED_MEDIA).reduce((sum, group) => sum + group.items.length, 0);
        let loadedItems = 0;

        console.log(`Starting preload of ${totalItems} media items...`);
        if (onProgress) onProgress(0, 'Starting preload...');

        try {
            for (const groupKey of allGroups) {
                const group = PREDEFINED_MEDIA[groupKey];
                const loadedItemIds = [];

                if (onProgress) onProgress((loadedItems / totalItems) * 100, `Loading ${group.playlist}...`);

                // Load all items in this group
                for (const itemConfig of group.items) {
                    try {
                        const mediaItem = await loadMediaItem(itemConfig, group.folder);
                        if (mediaItem) {
                            loadedItemIds.push(mediaItem.id);
                        }
                        loadedItems++;
                        
                        if (onProgress) {
                            onProgress(
                                (loadedItems / totalItems) * 100, 
                                `Loaded ${itemConfig.title}`
                            );
                        }
                    } catch (error) {
                        console.error(`Failed to load ${itemConfig.title}:`, error);
                        loadedItems++;
                    }
                }

                // Create playlist for this group
                if (loadedItemIds.length > 0) {
                    await createPlaylistFromItems(group.playlist, loadedItemIds);
                }
            }

            // Mark preloading as complete
            markPreloadComplete();

            if (onProgress) onProgress(100, 'Preload complete!');
            console.log('Media preloading completed successfully');

        } catch (error) {
            console.error('Error during media preloading:', error);
            if (onProgress) onProgress(-1, 'Preload failed');
            throw error;
        }
    }

    /**
     * Reset preload status (for testing or re-importing)
     */
    function resetPreloadStatus() {
        const preferences = StorageManager.getPreferences();
        preferences.preloadComplete = false;
        StorageManager.savePreferences(preferences);
        console.log('Preload status reset');
    }

    /**
     * Get preload statistics
     * @returns {Object} Preload statistics
     */
    function getPreloadStats() {
        const totalGroups = Object.keys(PREDEFINED_MEDIA).length;
        const totalItems = Object.values(PREDEFINED_MEDIA).reduce((sum, group) => sum + group.items.length, 0);
        
        return {
            totalGroups,
            totalItems,
            isComplete: isAlreadyPreloaded(),
            groups: Object.keys(PREDEFINED_MEDIA).map(key => ({
                key,
                name: PREDEFINED_MEDIA[key].playlist,
                itemCount: PREDEFINED_MEDIA[key].items.length
            }))
        };
    }

    // Public API
    return {
        preloadAllMedia,
        resetPreloadStatus,
        getPreloadStats,
        isAlreadyPreloaded
    };
})();