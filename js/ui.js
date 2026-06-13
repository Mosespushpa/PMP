/**
 * UI Controller
 * Handles user interface rendering and interactions
 */

const UIController = (function() {
    // DOM elements
    let elements = {};
    
    // State
    let currentView = 'home';
    let currentFilter = 'all';
    let isSearching = false;
    let mediaItems = [];
    let filteredItems = [];
    
    // Virtual scrolling
    let virtualScroller = null;
    
    // Search debouncing
    let searchTimeout = null;
    const SEARCH_DEBOUNCE_DELAY = 300;
    
    // Virtual scrolling configuration
    const VIRTUAL_SCROLL_THRESHOLD = 100;
    const ITEM_HEIGHT = 280;
    const BUFFER_SIZE = 5;
    
    /**
     * Initialize the UI Controller
     */
    async function init() {
        console.log('UIController initializing...');
        
        // Cache DOM elements
        cacheElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize responsive behavior
        setupResponsiveHandlers();
        
        // Load initial data
        await loadInitialData();
        
        // Setup media player event handlers
        setupMediaPlayerHandlers();
        
        // Restore user preferences
        restorePreferences();
        
        console.log('UIController initialized');
    }
    
    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements = {
            // Main containers
            app: document.getElementById('app'),
            sidebar: document.getElementById('sidebar'),
            mainContent: document.getElementById('main-content'),
            contentView: document.getElementById('content-view'),
            
            // Navigation
            sidebarToggle: document.getElementById('sidebar-toggle'),
            navLinks: document.querySelectorAll('.nav-link'),
            
            // Views
            homeView: document.getElementById('home-view'),
            songsView: document.getElementById('songs-view'),
            videosView: document.getElementById('videos-view'),
            playlistsView: document.getElementById('playlists-view'),
            
            // Media grids
            mediaGrid: document.getElementById('media-grid'),
            songsGrid: document.getElementById('songs-grid'),
            videosGrid: document.getElementById('videos-grid'),
            playlistsGrid: document.getElementById('playlists-grid'),
            mediaPlayerContainer: document.getElementById('media-player-container'),
            sidebarOpenBtn: document.getElementById('sidebar-open-btn'),
            
            // Search and filters
            searchInput: document.getElementById('search-input'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            
            // Buttons
            uploadBtn: document.getElementById('upload-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            createPlaylistBtn: document.getElementById('create-playlist-btn'),
            
            // Player bar
            playerBar: document.getElementById('player-bar'),
            playerPoster: document.getElementById('player-poster'),
            playerTitle: document.getElementById('player-title'),
            playerArtist: document.getElementById('player-artist'),
            
            // Player controls
            btnPlayPause: document.getElementById('btn-play-pause'),
            btnPrevious: document.getElementById('btn-previous'),
            btnNext: document.getElementById('btn-next'),
            playPauseIcon: document.getElementById('play-pause-icon'),
            
            // Progress and time
            progressBar: document.getElementById('progress-bar'),
            currentTime: document.getElementById('current-time'),
            duration: document.getElementById('duration'),
            
            // Volume controls
            volumeBar: document.getElementById('volume-bar'),
            btnVolume: document.getElementById('btn-volume'),
            volumeIcon: document.getElementById('volume-icon'),
            
            // Player options
            btnShuffle: document.getElementById('btn-shuffle'),
            btnRepeat: document.getElementById('btn-repeat'),
            btnQueue: document.getElementById('btn-queue'),
            repeatIcon: document.getElementById('repeat-icon'),
            
            // Other elements
            playlistsList: document.getElementById('playlists-list'),
            emptyState: document.getElementById('empty-state'),
            modalContainer: document.getElementById('modal-container')
        };
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    function setupEventListeners() {
        // Navigation
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                navigateTo(view);
            });
        });
        
        // Sidebar toggle
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
        if (elements.sidebarOpenBtn) {
            elements.sidebarOpenBtn.addEventListener('click', toggleSidebar);
        }
        
        // Media type filters
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = btn.dataset.filter;
                setMediaTypeFilter(filter);
            });
        });
        
        // Search
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
        
        // Upload button
        elements.uploadBtn.addEventListener('click', showUploadDialog);
        
        // Create playlist button
        elements.createPlaylistBtn.addEventListener('click', showCreatePlaylistDialog);
        
        // Settings button
        elements.settingsBtn.addEventListener('click', showSettingsDialog);
        
        // Player controls
        elements.btnPlayPause.addEventListener('click', () => MediaPlayer.togglePlayPause());
        elements.btnPrevious.addEventListener('click', () => MediaPlayer.previous());
        elements.btnNext.addEventListener('click', () => MediaPlayer.next());
        
        // Progress bar
        elements.progressBar.addEventListener('input', handleProgressChange);
        elements.progressBar.addEventListener('change', handleProgressChange);
        
        // Volume controls
        elements.volumeBar.addEventListener('input', handleVolumeChange);
        elements.btnVolume.addEventListener('click', () => MediaPlayer.toggleMute());
        
        // Player options
        elements.btnShuffle.addEventListener('click', toggleShuffle);
        elements.btnRepeat.addEventListener('click', toggleRepeat);
        elements.btnQueue.addEventListener('click', showQueue);
        
        // Window resize
        window.addEventListener('resize', throttle(handleResize, 16));
        
        // Click outside to close modals
        elements.modalContainer.addEventListener('click', (e) => {
            if (e.target === elements.modalContainer) {
                closeAllModals();
            }
        });
    }
    
    /**
     * Set up responsive behavior handlers
     */
    function setupResponsiveHandlers() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addEventListener('change', handleMediaQueryChange);
        handleMediaQueryChange(mediaQuery); // Initial check
    }
    
    /**
     * Handle media query changes for responsive design
     * @param {MediaQueryList} mq - Media query list object
     */
    function handleMediaQueryChange(mq) {
        if (mq.matches) {
            // Mobile view
            elements.app.classList.add('mobile');
            hideSidebar();
        } else {
            // Desktop view
            elements.app.classList.remove('mobile');
            showSidebar();
        }
    }
    
    /**
     * Handle window resize events
     */
    function handleResize() {
        // Update virtual scroller if active
        if (virtualScroller) {
            virtualScroller.updateViewport();
        }
        
        // Update grid layout
        updateGridLayout();
    }
    
    /**
     * Navigate to a specific view
     * @param {string} view - View name (home, songs, videos, playlists)
     */
    function navigateTo(view) {
        if (currentView === view) return;
        
        // Update navigation state
        elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.view === view);
        });
        
        // Hide all views
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        
        // Show selected view
        const viewElement = document.getElementById(`${view}-view`);
        if (viewElement) {
            viewElement.classList.add('active');
        }
        
        currentView = view;
        
        // Load view-specific content
        loadViewContent(view);
        
        // Update URL hash
        window.location.hash = view;
        
        console.log('Navigated to:', view);
    }
    
    /**
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        if (elements.sidebar.classList.contains('hidden')) {
            elements.sidebar.classList.remove('hidden');
        } else {
            elements.sidebar.classList.add('hidden');
        }
    }
    
    /**
     * Show sidebar
     */
    function showSidebar() {
        elements.sidebar.classList.remove('hidden');
    }
    
    /**
     * Hide sidebar
     */
    function hideSidebar() {
        elements.sidebar.classList.add('hidden');
    }
    
    /**
     * Load initial data and render UI
     */
    async function loadInitialData() {
        try {
            // Load media items
            mediaItems = await LibraryManager.getAllMedia();
            
            // Load playlists
            await renderPlaylists();
            
            // Apply current filter
            applyCurrentFilter();
            
            // Render current view
            loadViewContent(currentView);
            
            // Restore media type filter
            const savedFilter = StorageManager.getMediaTypeFilter();
            setMediaTypeFilter(savedFilter);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            showErrorMessage('Failed to load data. Please refresh the page.');
        }
    }
    
    /**
     * Load content for the current view
     * @param {string} view - View name
     */
    async function loadViewContent(view) {
        try {
            switch (view) {
                case 'home':
                    renderMediaGrid(elements.mediaGrid, filteredItems);
                    break;
                case 'songs':
                    const audioItems = filteredItems.filter(item => item.type === 'audio');
                    renderMediaGrid(elements.songsGrid, audioItems);
                    break;
                case 'videos':
                    const videoItems = filteredItems.filter(item => item.type === 'video');
                    renderMediaGrid(elements.videosGrid, videoItems);
                    break;
                case 'playlists':
                    await renderPlaylistsView();
                    break;
                default:
                    console.warn('Unknown view:', view);
            }
        } catch (error) {
            console.error('Error loading view content:', error);
            showErrorMessage('Failed to load content');
        }
    }
    
    /**
     * Set media type filter and update display
     * @param {string} filter - 'all', 'audio', or 'video'
     */
    function setMediaTypeFilter(filter) {
        if (currentFilter === filter) return;
        
        currentFilter = filter;
        
        // Update filter buttons
        elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Apply filter
        applyCurrentFilter();
        
        // Save filter preference
        StorageManager.saveMediaTypeFilter(filter);
        
        // Re-render current view
        loadViewContent(currentView);
    }
    
    /**
     * Apply current filter to media items
     */
    function applyCurrentFilter() {
        if (currentFilter === 'all') {
            filteredItems = [...mediaItems];
        } else {
            filteredItems = mediaItems.filter(item => item.type === currentFilter);
        }
        
        // Apply search filter if active
        if (isSearching) {
            const query = elements.searchInput.value.trim();
            filteredItems = filterItemsBySearch(filteredItems, query);
        }
    }
    
    /**
     * Handle search input with debouncing
     * @param {Event} event - Input event
     */
    function handleSearchInput(event) {
        const query = event.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, SEARCH_DEBOUNCE_DELAY);
    }
    
    /**
     * Perform search with the given query
     * @param {string} query - Search query
     */
    function performSearch(query) {
        if (query === '') {
            clearSearch();
            return;
        }
        
        isSearching = true;
        
        // Filter items by search query
        const searchResults = filterItemsBySearch(mediaItems, query);
        
        // Apply media type filter to search results
        if (currentFilter !== 'all') {
            filteredItems = searchResults.filter(item => item.type === currentFilter);
        } else {
            filteredItems = searchResults;
        }
        
        // Re-render current view with search results
        loadViewContent(currentView);
        
        console.log(`Search "${query}" returned ${filteredItems.length} results`);
    }
    
    /**
     * Filter items by search query
     * @param {Array} items - Items to filter
     * @param {string} query - Search query
     * @returns {Array} Filtered items
     */
    function filterItemsBySearch(items, query) {
        if (!query) return items;
        
        const lowerQuery = query.toLowerCase();
        return items.filter(item => {
            const title = (item.title || '').toLowerCase();
            const artist = (item.artist || '').toLowerCase();
            return title.includes(lowerQuery) || artist.includes(lowerQuery);
        });
    }
    
    /**
     * Clear search and show all items
     */
    function clearSearch() {
        elements.searchInput.value = '';
        isSearching = false;
        applyCurrentFilter();
        loadViewContent(currentView);
    }
    
    /**
     * Render media grid with optional virtual scrolling
     * @param {HTMLElement} container - Grid container element
     * @param {Array} items - Media items to render
     */
    function renderMediaGrid(container, items) {
        if (!container) return;
        
        // Show/hide empty state
        if (items.length === 0) {
            showEmptyState(container);
            return;
        } else {
            hideEmptyState();
        }
        
        // Use virtual scrolling for large collections
        if (items.length > VIRTUAL_SCROLL_THRESHOLD) {
            renderVirtualGrid(container, items);
        } else {
            renderStandardGrid(container, items);
        }
    }
    
    /**
     * Render standard grid without virtual scrolling
     * @param {HTMLElement} container - Grid container
     * @param {Array} items - Items to render
     */
    function renderStandardGrid(container, items) {
        // Clear existing content
        container.innerHTML = '';
        
        // Create fragment for better performance
        const fragment = document.createDocumentFragment();
        
        items.forEach(item => {
            const card = createMediaCard(item);
            fragment.appendChild(card);
        });
        
        container.appendChild(fragment);
        
        // Set up lazy loading for images
        setupLazyLoading(container);
    }
    
    /**
     * Render virtual scrolling grid for large collections
     * @param {HTMLElement} container - Grid container
     * @param {Array} items - Items to render
     */
    function renderVirtualGrid(container, items) {
        // Initialize virtual scroller if not exists
        if (!virtualScroller || virtualScroller.container !== container) {
            virtualScroller = new VirtualScroller(container, {
                itemHeight: ITEM_HEIGHT,
                bufferSize: BUFFER_SIZE,
                renderItem: createMediaCard
            });
        }
        
        // Update items
        virtualScroller.setItems(items);
    }
    
    /**
     * Create a media card element
     * @param {Object} item - Media item
     * @returns {HTMLElement} Card element
     */
    function createMediaCard(item) {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.dataset.itemId = item.id;
        
        // Create poster container with lazy loading
        const posterContainer = document.createElement('div');
        posterContainer.className = 'media-poster-container';
        
        const poster = document.createElement('img');
        poster.className = 'media-poster lazy-image';
        const posterUrl = LibraryManager.ensurePosterUrl(item) || generateDefaultPosterUrl(item);
        poster.dataset.src = posterUrl;
        poster.alt = sanitizeHTML(item.title || 'Untitled') + ' poster';
        poster.loading = 'lazy';
        
        // Add play button overlay
        const playButton = document.createElement('button');
        playButton.className = 'play-button';
        playButton.innerHTML = '<span>▶️</span>';
        playButton.setAttribute('aria-label', `Play ${item.title}`);
        
        posterContainer.appendChild(poster);
        posterContainer.appendChild(playButton);
        
        // Create metadata container
        const metadata = document.createElement('div');
        metadata.className = 'media-metadata';
        
        const title = document.createElement('h3');
        title.className = 'media-title';
        title.textContent = item.title || 'Untitled';
        title.title = item.title || 'Untitled';
        
        const artist = document.createElement('p');
        artist.className = 'media-artist';
        artist.textContent = item.artist || 'Unknown Artist';
        artist.title = item.artist || 'Unknown Artist';
        
        const duration = document.createElement('span');
        duration.className = 'media-duration';
        duration.textContent = formatTime(item.duration || 0);
        
        const type = document.createElement('span');
        type.className = `media-type media-type-${item.type}`;
        type.textContent = item.type === 'audio' ? '🎵' : '🎬';
        
        metadata.appendChild(title);
        metadata.appendChild(artist);
        metadata.appendChild(duration);
        metadata.appendChild(type);
        
        // Create actions menu
        const actionsMenu = createActionsMenu(item);
        
        card.appendChild(posterContainer);
        card.appendChild(metadata);
        card.appendChild(actionsMenu);
        
        // Add event listeners
        setupMediaCardEvents(card, item);
        
        return card;
    }
    
    /**
     * Create actions menu for media card
     * @param {Object} item - Media item
     * @returns {HTMLElement} Actions menu element
     */
    function createActionsMenu(item) {
        const menu = document.createElement('div');
        menu.className = 'media-actions';
        
        const button = document.createElement('button');
        button.className = 'actions-button';
        button.innerHTML = '⋮';
        button.setAttribute('aria-label', 'Actions');
        
        const dropdown = document.createElement('div');
        dropdown.className = 'actions-dropdown';
        
        const actions = [
            { text: 'Play', icon: '▶️', action: () => playItem(item) },
            { text: 'Add to Queue', icon: '📜', action: () => addToQueue(item) },
            { text: 'Add to Playlist', icon: '📋', action: () => showAddToPlaylistDialog(item) },
            { text: 'Edit', icon: '✏️', action: () => showEditDialog(item) },
            { text: 'Delete', icon: '🗑️', action: () => confirmDeleteItem(item) }
        ];
        
        actions.forEach(action => {
            const actionItem = document.createElement('button');
            actionItem.className = 'dropdown-item';
            actionItem.innerHTML = `<span>${action.icon}</span> ${action.text}`;
            actionItem.addEventListener('click', (e) => {
                e.stopPropagation();
                action.action();
                hideActionsDropdown(dropdown);
            });
            dropdown.appendChild(actionItem);
        });
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleActionsDropdown(dropdown);
        });
        
        menu.appendChild(button);
        menu.appendChild(dropdown);
        
        return menu;
    }
    
    /**
     * Set up event listeners for media card
     * @param {HTMLElement} card - Card element
     * @param {Object} item - Media item
     */
    function setupMediaCardEvents(card, item) {
        // Double-click to play
        card.addEventListener('dblclick', () => playItem(item));
        
        // Play button click
        const playButton = card.querySelector('.play-button');
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            playItem(item);
        });
        
        // Single click to select (future enhancement)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.media-actions')) {
                selectMediaCard(card);
            }
        });
    }
    
    /**
     * Play a media item
     * @param {Object} item - Media item to play
     */
    async function playItem(item) {
        try {
            // Set up queue with current filtered items
            QueueManager.setQueue(filteredItems);
            
            // Find the item index in the current queue
            const itemIndex = filteredItems.findIndex(i => i.id === item.id);
            if (itemIndex !== -1) {
                QueueManager.setCurrentIndex(itemIndex);
            }
            
            // Play the item
            await MediaPlayer.play(item);
            
            // Show player bar
            showPlayerBar();
            
        } catch (error) {
            console.error('Error playing item:', error);
            showErrorMessage(`Failed to play "${item.title}". ${error.message}`);
        }
    }
    
    /**
     * Add item to queue
     * @param {Object} item - Media item to add
     */
    function addToQueue(item) {
        QueueManager.addToQueue(item);
        showNotification(`Added "${item.title}" to queue`);
    }
    
    /**
     * Select a media card (visual feedback)
     * @param {HTMLElement} card - Card element to select
     */
    function selectMediaCard(card) {
        // Remove selection from other cards
        document.querySelectorAll('.media-card.selected').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Select this card
        card.classList.add('selected');
    }
    
    /**
     * Set up lazy loading for images using Intersection Observer
     * @param {HTMLElement} container - Container with lazy images
     */
    function setupLazyLoading(container) {
        const lazyImages = container.querySelectorAll('.lazy-image');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy-image');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '200px'
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without Intersection Observer
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy-image');
            });
        }
    }
    
    /**
     * Generate default poster URL for items without custom posters
     * @param {Object} item - Media item
     * @returns {string} Default poster URL
     */
    function generateDefaultPosterUrl(item) {
        // This could be enhanced to generate dynamic posters
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
     * Show empty state
     * @param {HTMLElement} container - Container to show empty state in
     */
    function showEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-icon">📁</div>
                <h3>No items found</h3>
                <p>Upload some media files to get started</p>
                <button class="btn-primary" onclick="UIController.showUploadDialog()">
                    📤 Upload Media
                </button>
            </div>
        `;
    }
    
    /**
     * Hide empty state
     */
    function hideEmptyState() {
        const emptyState = document.querySelector('.empty-state-content');
        if (emptyState) {
            emptyState.remove();
        }
    }
    
    /**
     * Show player bar
     */
    function showPlayerBar() {
        elements.playerBar.classList.remove('hidden');
        updatePlayerDisplay();
    }
    
    /**
     * Hide player bar
     */
    function hidePlayerBar() {
        elements.playerBar.classList.add('hidden');
    }
    
    /**
     * Update player display with current item information
     */
    function updatePlayerDisplay() {
        const currentItem = MediaPlayer.getCurrentItem();
        if (!currentItem) return;
        
        // Update poster
        elements.playerPoster.src = currentItem.posterUrl || generateDefaultPosterUrl(currentItem);
        elements.playerPoster.alt = `${currentItem.title} poster`;
        
        // Update metadata
        elements.playerTitle.textContent = currentItem.title || 'Untitled';
        elements.playerArtist.textContent = currentItem.artist || 'Unknown Artist';
        
        // Update duration
        const duration = MediaPlayer.getDuration();
        elements.duration.textContent = formatTime(duration);
    }
    
    /**
     * Set up media player event handlers
     */
    function setupMediaPlayerHandlers() {
        MediaPlayer.onPlaybackStateChange((isPlaying) => {
            elements.playPauseIcon.textContent = isPlaying ? '⏸️' : '▶️';
            elements.btnPlayPause.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        });
        
        MediaPlayer.onTimeUpdate((currentTime, duration) => {
            elements.currentTime.textContent = formatTime(currentTime);
            
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                elements.progressBar.value = progress;
                // Update CSS variable for filled progress bar effect
                elements.progressBar.style.setProperty('--progress-percent', progress + '%');
            }
        });
        
        MediaPlayer.onMetadataLoaded((duration) => {
            elements.duration.textContent = formatTime(duration);
            elements.progressBar.max = 100;
        });
        
        MediaPlayer.onEnded(() => {
            console.log('Track ended');
        });
        
        MediaPlayer.onError((filename, error) => {
            showErrorMessage(`Playback error in "${filename}": ${error}`);
        });
    }
    
    /**
     * Handle progress bar changes
     * @param {Event} event - Input event
     */
    function handleProgressChange(event) {
        const progress = parseFloat(event.target.value);
        const duration = MediaPlayer.getDuration();
        
        if (duration > 0) {
            const time = (progress / 100) * duration;
            MediaPlayer.seek(time);
        }
    }
    
    /**
     * Handle volume changes
     * @param {Event} event - Input event
     */
    function handleVolumeChange(event) {
        const volume = parseFloat(event.target.value) / 100;
        MediaPlayer.setVolume(volume);
        
        // Update volume bar CSS variable for filled effect
        const volumePercent = parseFloat(event.target.value);
        elements.volumeBar.style.setProperty('--progress-percent', volumePercent + '%');
        
        // Update volume icon
        updateVolumeIcon(volume);
    }
    
    /**
     * Update volume icon based on level
     * @param {number} volume - Volume level (0-1)
     */
    function updateVolumeIcon(volume) {
        let icon = '🔇';
        if (volume > 0.5) {
            icon = '🔊';
        } else if (volume > 0) {
            icon = '🔉';
        }
        elements.volumeIcon.textContent = icon;
    }
    
    /**
     * Toggle shuffle mode
     */
    function toggleShuffle() {
        if (QueueManager.isShuffled()) {
            QueueManager.unshuffle();
            elements.btnShuffle.classList.remove('active');
            elements.btnShuffle.title = 'Shuffle off';
        } else {
            QueueManager.shuffle();
            elements.btnShuffle.classList.add('active');
            elements.btnShuffle.title = 'Shuffle on';
        }
    }
    
    /**
     * Toggle repeat mode
     */
    function toggleRepeat() {
        const currentMode = QueueManager.getRepeatMode();
        let newMode, icon, title;
        
        switch (currentMode) {
            case 'off':
                newMode = 'all';
                icon = '🔁';
                title = 'Repeat all';
                elements.btnRepeat.classList.add('active');
                break;
            case 'all':
                newMode = 'one';
                icon = '🔂';
                title = 'Repeat one';
                break;
            case 'one':
                newMode = 'off';
                icon = '🔁';
                title = 'Repeat off';
                elements.btnRepeat.classList.remove('active');
                break;
        }
        
        QueueManager.setRepeatMode(newMode);
        elements.repeatIcon.textContent = icon;
        elements.btnRepeat.title = title;
    }
    
    /**
     * Show queue dialog
     */
    function showQueue() {
        const queue = QueueManager.getQueue();
        const currentIndex = QueueManager.getCurrentIndex();
        
        const modal = createModal('Queue', renderQueueContent(queue, currentIndex));
        modal.classList.add('queue-modal');
        showModal(modal);

        // Attach remove buttons after modal is displayed
        const removeButtons = modal.querySelectorAll('.queue-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const index = Number(button.dataset.index);
                if (!Number.isNaN(index)) {
                    QueueManager.removeFromQueue(index);
                    closeAllModals();
                    showQueue();
                }
            });
        });
    }
    
    /**
     * Render queue content
     * @param {Array} queue - Queue items
     * @param {number} currentIndex - Current item index
     * @returns {string} HTML content
     */
    function renderQueueContent(queue, currentIndex) {
        if (queue.length === 0) {
            return '<p class="empty-message">Queue is empty</p>';
        }
        
        let html = '<div class="queue-list">';
        
        queue.forEach((item, index) => {
            const isActive = index === currentIndex;
            const posterUrl = item.posterBlob ? LibraryManager.ensurePosterUrl(item) : generateDefaultPosterUrl(item);
            const title = sanitizeHTML(item.title || 'Untitled');
            const artist = sanitizeHTML(item.artist || 'Unknown Artist');
            html += `
                <div class="queue-item ${isActive ? 'active' : ''}" data-index="${index}">
                    <img class="queue-poster" src="${posterUrl}" alt="${title}">
                    <div class="queue-metadata">
                        <div class="queue-title">${title}</div>
                        <div class="queue-artist">${artist}</div>
                    </div>
                    <div class="queue-duration">${formatTime(item.duration || 0)}</div>
                    <button class="queue-remove" data-index="${index}" title="Remove from queue">✕</button>
                </div>
            `;
        });
        
        html += '</div>';
        
        html += `
            <div class="queue-controls">
                <button class="btn-secondary" onclick="QueueManager.clearQueue(); UIController.closeAllModals(); UIController.loadViewContent('${currentView}')">
                    Clear Queue
                </button>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Render playlists in sidebar
     */
    async function renderPlaylists() {
        try {
            const playlists = await PlaylistManager.getAllPlaylists();
            
            elements.playlistsList.innerHTML = '';
            
            playlists.forEach(playlist => {
                const item = document.createElement('li');
                item.innerHTML = `
                    <a href="#" class="playlist-link" data-playlist-id="${playlist.id}">
                        <span class="playlist-name">${sanitizeHTML(playlist.name)}</span>
                        <span class="playlist-count">${playlist.itemIds.length}</span>
                    </a>
                `;
                
                // Add click handler
                const link = item.querySelector('.playlist-link');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    showPlaylist(playlist.id);
                });
                
                elements.playlistsList.appendChild(item);
            });
            
        } catch (error) {
            console.error('Error rendering playlists:', error);
        }
    }
    
    /**
     * Render playlists view
     */
    async function renderPlaylistsView() {
        try {
            const playlists = await PlaylistManager.getAllPlaylists();
            
            if (playlists.length === 0) {
                elements.playlistsGrid.innerHTML = `
                    <div class="empty-state-content">
                        <div class="empty-icon">📋</div>
                        <h3>No playlists yet</h3>
                        <p>Create your first playlist to organize your music</p>
                        <button class="btn-primary" onclick="UIController.showCreatePlaylistDialog()">
                            ➕ Create Playlist
                        </button>
                    </div>
                `;
                return;
            }
            
            let html = '';
            playlists.forEach(playlist => {
                html += `
                    <div class="playlist-card" data-playlist-id="${playlist.id}">
                        <div class="playlist-poster">📋</div>
                        <div class="playlist-info">
                            <h3 class="playlist-title">${sanitizeHTML(playlist.name)}</h3>
                            <p class="playlist-count">${playlist.itemIds.length} items</p>
                            <p class="playlist-date">Created ${new Date(playlist.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div class="playlist-actions">
                            <button class="btn-play" onclick="UIController.playPlaylist('${playlist.id}')">▶️</button>
                            <button class="btn-edit" onclick="UIController.showEditPlaylistDialog('${playlist.id}')">✏️</button>
                            <button class="btn-delete" onclick="UIController.confirmDeletePlaylist('${playlist.id}')">🗑️</button>
                        </div>
                    </div>
                `;
            });
            
            elements.playlistsGrid.innerHTML = html;
            
        } catch (error) {
            console.error('Error rendering playlists view:', error);
            showErrorMessage('Failed to load playlists');
        }
    }
    
    /**
     * Show a specific playlist
     * @param {string} playlistId - Playlist ID
     */
    async function showPlaylist(playlistId) {
        try {
            // Remove any existing playlist detail view
            const existingDetailView = document.querySelector('.playlist-detail-view');
            if (existingDetailView) {
                existingDetailView.remove();
            }

            const items = await PlaylistManager.getPlaylistItems(playlistId);
            const playlists = await PlaylistManager.getAllPlaylists();
            const playlist = playlists.find(p => p.id === playlistId);
            
            if (!playlist) {
                showErrorMessage('Playlist not found');
                return;
            }
            
            // Create a temporary view for the playlist
            const playlistView = document.createElement('div');
            playlistView.className = 'view playlist-detail-view';
            playlistView.dataset.playlistId = playlistId;
            playlistView.innerHTML = `
                <div class="playlist-header">
                    <button class="btn-back" onclick="UIController.navigateTo('playlists')">&larr; Back to Playlists</button>
                    <h2>${sanitizeHTML(playlist.name)}</h2>
                    <p>${items.length} items</p>
                    <div class="playlist-actions">
                        <button class="btn-primary" onclick="UIController.playPlaylist('${playlistId}')">▶️ Play All</button>
                        <button class="btn-secondary" onclick="UIController.shufflePlaylist('${playlistId}')">🔀 Shuffle</button>
                    </div>
                </div>
                <div class="playlist-items-grid"></div>
            `;
            
            // Hide other views and show playlist view
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            elements.contentView.appendChild(playlistView);
            playlistView.classList.add('active');
            currentView = 'playlists';
            
            // Render playlist items
            const itemsGrid = playlistView.querySelector('.playlist-items-grid');
            renderMediaGrid(itemsGrid, items);
            
        } catch (error) {
            console.error('Error showing playlist:', error);
            showErrorMessage('Failed to load playlist');
        }
    }
    
    // =========================
    // DIALOG AND MODAL FUNCTIONS
    // =========================
    
    /**
     * Create a modal dialog
     * @param {string} title - Modal title
     * @param {string} content - Modal content HTML
     * @returns {HTMLElement} Modal element
     */
    function createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">${sanitizeHTML(title)}</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => closeModal(modal));
        
        return modal;
    }
    
    /**
     * Show a modal dialog
     * @param {HTMLElement} modal - Modal element
     */
    function showModal(modal) {
        elements.modalContainer.appendChild(modal);
        modal.classList.add('active');
        
        // Focus management
        const focusableElements = modal.querySelectorAll('button, input, textarea, select');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    /**
     * Close a specific modal
     * @param {HTMLElement} modal - Modal element
     */
    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300); // Wait for animation
    }
    
    /**
     * Close all modals
     */
    function closeAllModals() {
        const modals = elements.modalContainer.querySelectorAll('.modal');
        modals.forEach(modal => closeModal(modal));
    }
    
    /**
     * Show upload dialog
     */
    function showUploadDialog() {
        const content = `
            <div class="upload-container">
                <div class="drag-drop-area" id="drag-drop-area">
                    <div class="drag-drop-content">
                        <div class="upload-icon">📤</div>
                        <p>Drag and drop files here, or click to browse</p>
                        <input type="file" id="file-input" multiple accept="audio/*,video/*" style="display: none;">
                        <button type="button" class="btn-primary" onclick="document.getElementById('file-input').click()">
                            Choose Files
                        </button>
                    </div>
                </div>
                
                <div class="upload-progress" id="upload-progress" style="display: none;">
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="upload-progress-bar"></div>
                    </div>
                    <p id="upload-status">Processing files...</p>
                </div>
                
                <div class="upload-options">
                    <label>
                        <input type="checkbox" id="extract-metadata" checked>
                        Extract metadata automatically
                    </label>
                </div>
            </div>
        `;
        
        const modal = createModal('Upload Media Files', content);
        showModal(modal);
        
        // Set up file upload functionality
        setupFileUpload(modal);
    }
    
    /**
     * Set up file upload functionality in modal
     * @param {HTMLElement} modal - Upload modal
     */
    function setupFileUpload(modal) {
        const dragDropArea = modal.querySelector('#drag-drop-area');
        const fileInput = modal.querySelector('#file-input');
        const progressContainer = modal.querySelector('#upload-progress');
        const progressBar = modal.querySelector('#upload-progress-bar');
        const statusText = modal.querySelector('#upload-status');
        
        // Drag and drop handlers
        dragDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragDropArea.classList.add('drag-over');
        });
        
        dragDropArea.addEventListener('dragleave', () => {
            dragDropArea.classList.remove('drag-over');
        });
        
        dragDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragDropArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            processFiles(files, progressContainer, progressBar, statusText);
        });
        
        // File input handler
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            processFiles(files, progressContainer, progressBar, statusText);
        });
    }
    
    /**
     * Process uploaded files
     * @param {File[]} files - Files to process
     * @param {HTMLElement} progressContainer - Progress container
     * @param {HTMLElement} progressBar - Progress bar element
     * @param {HTMLElement} statusText - Status text element
     */
    async function processFiles(files, progressContainer, progressBar, statusText) {
        if (files.length === 0) return;
        
        // Show progress
        progressContainer.style.display = 'block';
        
        try {
            let processed = 0;
            const total = files.length;
            
            statusText.textContent = `Processing ${total} files...`;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                try {
                    statusText.textContent = `Processing "${file.name}"...`;
                    
                    // Add file to library
                    await LibraryManager.addMediaFile(file);
                    processed++;
                    
                    // Update progress
                    const progress = (processed / total) * 100;
                    progressBar.style.width = `${progress}%`;
                    
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);
                    showErrorMessage(`Failed to process "${file.name}": ${error.message}`);
                }
            }
            
            statusText.textContent = `Successfully processed ${processed} of ${total} files`;
            
            // Refresh UI
            await loadInitialData();
            loadViewContent(currentView);
            
            // Close modal after a delay
            setTimeout(() => {
                closeAllModals();
            }, 2000);
            
        } catch (error) {
            console.error('Error processing files:', error);
            statusText.textContent = 'Upload failed';
            showErrorMessage('Failed to upload files');
        }
    }
    
    /**
     * Show create playlist dialog
     */
    function showCreatePlaylistDialog() {
        const content = `
            <form id="create-playlist-form">
                <div class="form-group">
                    <label for="playlist-name">Playlist Name:</label>
                    <input type="text" id="playlist-name" name="name" required maxlength="100" placeholder="Enter playlist name">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                    <button type="submit" class="btn-primary">Create Playlist</button>
                </div>
            </form>
        `;
        
        const modal = createModal('Create New Playlist', content);
        showModal(modal);
        
        // Handle form submission
        const form = modal.querySelector('#create-playlist-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const name = formData.get('name').trim();
            
            try {
                await PlaylistManager.createPlaylist(name);
                showNotification(`Playlist "${name}" created successfully`);
                closeAllModals();
                
                // Refresh playlists
                await renderPlaylists();
                if (currentView === 'playlists') {
                    await renderPlaylistsView();
                }
                
            } catch (error) {
                console.error('Error creating playlist:', error);
                showErrorMessage(error.message);
            }
        });
        
        // Focus the input
        modal.querySelector('#playlist-name').focus();
    }
    
    /**
     * Show edit dialog for media item
     * @param {Object} item - Media item to edit
     */
    function showEditDialog(item) {
        const content = `
            <form id="edit-item-form">
                <div class="form-group">
                    <label for="edit-title">Title:</label>
                    <input type="text" id="edit-title" name="title" value="${sanitizeHTML(item.title || '')}" maxlength="200" required>
                </div>
                <div class="form-group">
                    <label for="edit-artist">Artist:</label>
                    <input type="text" id="edit-artist" name="artist" value="${sanitizeHTML(item.artist || '')}" maxlength="100">
                </div>
                <div class="form-group">
                    <label for="edit-poster">Poster Image:</label>
                    <input type="file" id="edit-poster" name="poster" accept="image/*">
                    <small>Leave empty to keep current poster</small>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        const modal = createModal('Edit Media Item', content);
        showModal(modal);
        
        // Handle form submission
        const form = modal.querySelector('#edit-item-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const updates = {
                title: formData.get('title').trim(),
                artist: formData.get('artist').trim()
            };
            
            try {
                // Update metadata
                await LibraryManager.updateMediaItem(item.id, updates);
                
                // Update poster if provided
                const posterFile = formData.get('poster');
                if (posterFile && posterFile.size > 0) {
                    await LibraryManager.updatePoster(item.id, posterFile);
                }
                
                showNotification(`"${updates.title}" updated successfully`);
                closeAllModals();
                
                // Refresh UI
                await loadInitialData();
                loadViewContent(currentView);
                
            } catch (error) {
                console.error('Error updating item:', error);
                showErrorMessage(error.message);
            }
        });
        
        // Focus the title input
        modal.querySelector('#edit-title').focus();
    }
    
    /**
     * Confirm delete item
     * @param {Object} item - Item to delete
     */
    function confirmDeleteItem(item) {
        const content = `
            <div class="confirm-dialog">
                <p>Are you sure you want to delete <strong>"${sanitizeHTML(item.title || 'Untitled')}"</strong>?</p>
                <p class="warning-text">This action cannot be undone. The item will be removed from all playlists.</p>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                    <button type="button" class="btn-danger" onclick="UIController.deleteItem('${item.id}')">Delete</button>
                </div>
            </div>
        `;
        
        const modal = createModal('Delete Media Item', content);
        showModal(modal);
    }
    
    /**
     * Delete a media item
     * @param {string} itemId - Item ID to delete
     */
    async function deleteItem(itemId) {
        try {
            // Get item for notification
            const item = await StorageManager.getMediaItem(itemId);
            
            // Delete from library (this will also remove from playlists)
            await LibraryManager.deleteMediaItem(itemId);
            
            showNotification(`"${item?.title || 'Item'}" deleted successfully`);
            closeAllModals();
            
            // Refresh UI
            await loadInitialData();
            loadViewContent(currentView);
            
        } catch (error) {
            console.error('Error deleting item:', error);
            showErrorMessage('Failed to delete item');
        }
    }

    /**
     * Show dialog to add a media item to a playlist
     * @param {Object} item - Media item
     */
    async function showAddToPlaylistDialog(item) {
        const playlists = await PlaylistManager.getAllPlaylists();
        let content = '';

        if (playlists.length === 0) {
            content = `
                <div class="empty-state-content">
                    <p>No playlists exist yet. Create a playlist first.</p>
                    <button class="btn-primary" onclick="UIController.showCreatePlaylistDialog()">Create Playlist</button>
                </div>
            `;
        } else {
            content = `
                <form id="add-to-playlist-form">
                    <div class="form-group">
                        <label for="playlist-select">Select playlist:</label>
                        <select id="playlist-select" name="playlistId">
                            ${playlists.map(p => `<option value="${p.id}">${sanitizeHTML(p.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                        <button type="submit" class="btn-primary">Add to Playlist</button>
                    </div>
                </form>
            `;
        }

        const modal = createModal('Add to Playlist', content);
        showModal(modal);

        if (playlists.length > 0) {
            const form = modal.querySelector('#add-to-playlist-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const selectedPlaylistId = modal.querySelector('#playlist-select').value;

                try {
                    await PlaylistManager.addToPlaylist(selectedPlaylistId, item.id);
                    showNotification(`Added "${item.title || 'Item'}" to playlist successfully`);
                    closeAllModals();
                    await renderPlaylists();
                    if (currentView === 'playlists') {
                        await renderPlaylistsView();
                    }
                    const activePlaylistDetail = document.querySelector('.playlist-detail-view.active');
                    if (activePlaylistDetail && activePlaylistDetail.dataset.playlistId === selectedPlaylistId) {
                        await showPlaylist(selectedPlaylistId);
                    }
                } catch (error) {
                    console.error('Error adding item to playlist:', error);
                    showErrorMessage(error.message);
                }
            });
        }
    }

    /**
     * Show dialog to rename a playlist
     * @param {string} playlistId - Playlist ID
     */
    async function showEditPlaylistDialog(playlistId) {
        try {
            const playlists = await PlaylistManager.getAllPlaylists();
            const playlist = playlists.find(p => p.id === playlistId);
            if (!playlist) {
                showErrorMessage('Playlist not found');
                return;
            }

            const content = `
                <form id="edit-playlist-form">
                    <div class="form-group">
                        <label for="playlist-name">Playlist Name:</label>
                        <input type="text" id="playlist-name" name="name" value="${sanitizeHTML(playlist.name)}" maxlength="100" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                        <button type="submit" class="btn-primary">Save</button>
                    </div>
                </form>
            `;

            const modal = createModal('Edit Playlist', content);
            showModal(modal);

            const form = modal.querySelector('#edit-playlist-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newName = form.querySelector('#playlist-name').value.trim();

                try {
                    await PlaylistManager.renamePlaylist(playlistId, newName);
                    showNotification(`Playlist renamed to "${newName}"`);
                    closeAllModals();
                    await renderPlaylists();
                    if (currentView === 'playlists') {
                        await renderPlaylistsView();
                    }
                } catch (error) {
                    console.error('Error renaming playlist:', error);
                    showErrorMessage(error.message);
                }
            });

        } catch (error) {
            console.error('Error opening playlist edit dialog:', error);
            showErrorMessage('Failed to open playlist editor');
        }
    }

    /**
     * Confirm deletion of a playlist
     * @param {string} playlistId - Playlist ID
     */
    function confirmDeletePlaylist(playlistId) {
        const content = `
            <div class="confirm-dialog">
                <p>Are you sure you want to delete this playlist?</p>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                    <button type="button" id="confirm-delete-playlist-btn" class="btn-danger">Delete</button>
                </div>
            </div>
        `;

        const modal = createModal('Delete Playlist', content);
        showModal(modal);

        const deleteButton = modal.querySelector('#confirm-delete-playlist-btn');
        deleteButton.addEventListener('click', async () => {
            try {
                await PlaylistManager.deletePlaylist(playlistId);
                showNotification('Playlist deleted successfully');
                closeAllModals();
                await renderPlaylists();
                if (currentView === 'playlists') {
                    await renderPlaylistsView();
                }
            } catch (error) {
                console.error('Error deleting playlist:', error);
                showErrorMessage('Failed to delete playlist');
            }
        });
    }
    
    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'info')
     */
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showErrorMessage(message) {
        console.error('UI Error:', message);
        showNotification(message, 'error');
    }
    
    /**
     * Show settings dialog
     */
    function showSettingsDialog() {
        const preferences = StorageManager.getPreferences();
        
        const content = `
            <form id="settings-form">
                <div class="form-group">
                    <label for="setting-theme">Theme:</label>
                    <select id="setting-theme" name="theme">
                        <option value="dark" ${preferences.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        <option value="light" ${preferences.theme === 'light' ? 'selected' : ''}>Light</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="setting-volume">Default Volume:</label>
                    <input type="range" id="setting-volume" name="volume" min="0" max="100" value="${preferences.volume * 100}">
                    <span id="volume-display">${Math.round(preferences.volume * 100)}%</span>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="persistPlaybackPosition" ${preferences.persistPlaybackPosition ? 'checked' : ''}>
                        Remember playback position
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="UIController.closeAllModals()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Settings</button>
                </div>
            </form>
        `;
        
        const modal = createModal('Settings', content);
        showModal(modal);
        
        // Handle volume slider
        const volumeSlider = modal.querySelector('#setting-volume');
        const volumeDisplay = modal.querySelector('#volume-display');
        volumeSlider.addEventListener('input', (e) => {
            volumeDisplay.textContent = `${e.target.value}%`;
        });
        
        // Handle form submission
        const form = modal.querySelector('#settings-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const newPreferences = {
                ...preferences,
                theme: formData.get('theme'),
                volume: parseFloat(formData.get('volume')) / 100,
                persistPlaybackPosition: formData.has('persistPlaybackPosition')
            };
            
            StorageManager.savePreferences(newPreferences);
            applyTheme(newPreferences.theme);
            MediaPlayer.setVolume(newPreferences.volume);
            
            showNotification('Settings saved successfully');
            closeAllModals();
        });
    }
    
    /**
     * Apply theme to the application
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    function applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
    }
    
    /**
     * Restore user preferences on app load
     */
    function restorePreferences() {
        const preferences = StorageManager.getPreferences();
        
        // Apply theme
        applyTheme(preferences.theme);
        
        // Set volume
        MediaPlayer.setVolume(preferences.volume);
        const volumePercent = preferences.volume * 100;
        elements.volumeBar.value = volumePercent;
        elements.volumeBar.style.setProperty('--progress-percent', volumePercent + '%');
        updateVolumeIcon(preferences.volume);
        
        // Restore other preferences as needed
    }
    
    /**
     * Update grid layout based on screen size
     */
    function updateGridLayout() {
        const grids = document.querySelectorAll('.media-grid');
        grids.forEach(grid => {
            const containerWidth = grid.offsetWidth;
            const cardWidth = 200; // Base card width
            const gap = 20; // Gap between cards
            const columns = Math.floor((containerWidth + gap) / (cardWidth + gap));
            
            grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, 1fr)`;
        });
    }
    
    /**
     * Toggle actions dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     */
    function toggleActionsDropdown(dropdown) {
        // Close other dropdowns
        document.querySelectorAll('.actions-dropdown.show').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('show');
            }
        });
        
        dropdown.classList.toggle('show');
        
        // Close on outside click
        if (dropdown.classList.contains('show')) {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 0);
        }
    }
    
    /**
     * Hide actions dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     */
    function hideActionsDropdown(dropdown) {
        dropdown.classList.remove('show');
    }
    
    /**
     * Play entire playlist
     * @param {string} playlistId - Playlist ID
     */
    async function playPlaylist(playlistId) {
        try {
            const items = await PlaylistManager.getPlaylistItems(playlistId);
            if (items.length === 0) {
                showErrorMessage('Playlist is empty');
                return;
            }
            
            // Set queue and play first item
            QueueManager.setQueue(items);
            const firstItem = items[0];
            await MediaPlayer.play(firstItem);
            showPlayerBar();
            
        } catch (error) {
            console.error('Error playing playlist:', error);
            showErrorMessage('Failed to play playlist');
        }
    }
    
    /**
     * Shuffle and play playlist
     * @param {string} playlistId - Playlist ID
     */
    async function shufflePlaylist(playlistId) {
        try {
            const items = await PlaylistManager.getPlaylistItems(playlistId);
            if (items.length === 0) {
                showErrorMessage('Playlist is empty');
                return;
            }
            
            // Set queue, shuffle, and play
            QueueManager.setQueue(items);
            QueueManager.shuffle();
            
            const firstItem = QueueManager.getCurrentItem();
            if (firstItem) {
                await MediaPlayer.play(firstItem);
                showPlayerBar();
            }
            
        } catch (error) {
            console.error('Error shuffling playlist:', error);
            showErrorMessage('Failed to shuffle playlist');
        }
    }
    
    // =========================
    // VIRTUAL SCROLLER CLASS
    // =========================
    
    /**
     * Virtual Scroller for handling large lists efficiently
     */
    class VirtualScroller {
        constructor(container, options) {
            this.container = container;
            this.options = {
                itemHeight: 280,
                bufferSize: 5,
                renderItem: null,
                ...options
            };
            
            this.items = [];
            this.visibleStart = 0;
            this.visibleEnd = 0;
            this.scrollElement = null;
            this.contentElement = null;
            
            this.init();
        }
        
        init() {
            // Create scroll container
            this.container.innerHTML = `
                <div class="virtual-scroll-container">
                    <div class="virtual-scroll-content"></div>
                </div>
            `;
            
            this.scrollElement = this.container.querySelector('.virtual-scroll-container');
            this.contentElement = this.container.querySelector('.virtual-scroll-content');
            
            // Add scroll listener
            this.scrollElement.addEventListener('scroll', throttle(() => {
                this.updateVisible();
            }, 16));
        }
        
        setItems(items) {
            this.items = items;
            this.updateVisible();
        }
        
        updateVisible() {
            const scrollTop = this.scrollElement.scrollTop;
            const containerHeight = this.scrollElement.offsetHeight;
            
            // Calculate visible range
            this.visibleStart = Math.max(0, Math.floor(scrollTop / this.options.itemHeight) - this.options.bufferSize);
            this.visibleEnd = Math.min(
                this.items.length,
                Math.ceil((scrollTop + containerHeight) / this.options.itemHeight) + this.options.bufferSize
            );
            
            this.render();
        }
        
        render() {
            // Set total height
            const totalHeight = this.items.length * this.options.itemHeight;
            this.contentElement.style.height = `${totalHeight}px`;
            this.contentElement.style.position = 'relative';
            
            // Clear existing items
            const existingItems = this.contentElement.querySelectorAll('.virtual-item');
            existingItems.forEach(item => item.remove());
            
            // Render visible items
            for (let i = this.visibleStart; i < this.visibleEnd; i++) {
                const item = this.items[i];
                if (!item) continue;
                
                const element = this.options.renderItem(item);
                element.classList.add('virtual-item');
                element.style.position = 'absolute';
                element.style.top = `${i * this.options.itemHeight}px`;
                element.style.width = '100%';
                element.style.height = `${this.options.itemHeight}px`;
                
                this.contentElement.appendChild(element);
            }
        }
        
        updateViewport() {
            this.updateVisible();
        }
    }
    
    // =========================
    // PUBLIC API
    // =========================
    
    return {
        // Initialization
        init,
        
        // Navigation
        navigateTo,
        
        // Media rendering
        renderMediaGrid,
        loadViewContent,
        
        // Dialogs
        showUploadDialog,
        showCreatePlaylistDialog,
        showEditDialog,
        showSettingsDialog,
        
        // Actions
        playItem,
        deleteItem,
        playPlaylist,
        shufflePlaylist,
        
        // Notifications
        showErrorMessage,
        showNotification,
        
        // Modals
        closeAllModals,
        
        // Playlist actions
        showEditPlaylistDialog,
        confirmDeletePlaylist,

        // Utilities
        updateGridLayout
    };
})();