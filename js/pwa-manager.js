/**
 * PWA Manager
 * Handles Progressive Web App functionality including service worker registration,
 * installation prompts, and offline detection
 */

const PWAManager = (function() {
    let deferredPrompt = null;
    let isOnline = navigator.onLine;
    
    // Event handlers
    const eventHandlers = {
        onInstallPrompt: null,
        onInstalled: null,
        onOnline: null,
        onOffline: null
    };
    
    /**
     * Initialize PWA Manager
     */
    function init() {
        // Register service worker
        registerServiceWorker();
        
        // Set up install prompt handling
        setupInstallPrompt();
        
        // Set up online/offline detection
        setupNetworkDetection();
        
        // Check if app is running in standalone mode
        checkStandaloneMode();
        
        console.log('PWA Manager initialized');
    }
    
    /**
     * Register service worker with error handling
     */
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers not supported');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            console.log('Service Worker registered successfully:', registration);
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New service worker available, show update notification
                            showUpdateNotification();
                        } else {
                            // First install
                            console.log('Service Worker installed for the first time');
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            
            // Log error for debugging but don't break the app
            if (typeof UIController !== 'undefined' && UIController.showErrorMessage) {
                UIController.showErrorMessage('Failed to enable offline functionality');
            }
        }
    }
    
    /**
     * Set up install prompt handling
     */
    function setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            
            // Prevent the default browser install prompt
            e.preventDefault();
            
            // Store the event for later use
            deferredPrompt = e;
            
            // Show custom install UI if handler is set
            if (eventHandlers.onInstallPrompt) {
                eventHandlers.onInstallPrompt();
            }
        });
        
        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            
            deferredPrompt = null;
            
            if (eventHandlers.onInstalled) {
                eventHandlers.onInstalled();
            }
        });
    }
    
    /**
     * Set up network detection
     */
    function setupNetworkDetection() {
        window.addEventListener('online', () => {
            isOnline = true;
            console.log('App is online');
            
            if (eventHandlers.onOnline) {
                eventHandlers.onOnline();
            }
            
            showNetworkStatus('Online', 'success');
        });
        
        window.addEventListener('offline', () => {
            isOnline = false;
            console.log('App is offline');
            
            if (eventHandlers.onOffline) {
                eventHandlers.onOffline();
            }
            
            showNetworkStatus('Offline - Some features may be limited', 'warning');
        });
    }
    
    /**
     * Check if app is running in standalone mode
     */
    function checkStandaloneMode() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isStandalone) {
            console.log('App running in standalone mode');
            document.body.classList.add('pwa-standalone');
        }
    }
    
    /**
     * Show the install prompt
     * @returns {Promise<boolean>} True if user accepted, false otherwise
     */
    async function showInstallPrompt() {
        if (!deferredPrompt) {
            console.log('Install prompt not available');
            return false;
        }
        
        try {
            // Show the prompt
            deferredPrompt.prompt();
            
            // Wait for user response
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(`Install prompt outcome: ${outcome}`);
            
            // Clear the prompt
            deferredPrompt = null;
            
            return outcome === 'accepted';
            
        } catch (error) {
            console.error('Error showing install prompt:', error);
            return false;
        }
    }
    
    /**
     * Check if install prompt is available
     * @returns {boolean} True if prompt is available
     */
    function isInstallPromptAvailable() {
        return deferredPrompt !== null;
    }
    
    /**
     * Show update notification when new service worker is available
     */
    function showUpdateNotification() {
        if (typeof UIController !== 'undefined' && UIController.showNotification) {
            const message = 'A new version is available! Refresh to update.';
            UIController.showNotification(message, 'info');
        }
        
        // Optionally show a more prominent update dialog
        // This could be enhanced to show a modal with "Update Now" button
    }
    
    /**
     * Show network status notification
     * @param {string} message - Status message
     * @param {string} type - Notification type
     */
    function showNetworkStatus(message, type) {
        if (typeof UIController !== 'undefined' && UIController.showNotification) {
            UIController.showNotification(message, type);
        }
    }
    
    /**
     * Update service worker
     */
    function updateServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.update();
            });
        }
    }
    
    /**
     * Skip waiting for new service worker
     */
    function skipWaiting() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ action: 'SKIP_WAITING' });
                }
            });
        }
    }
    
    /**
     * Get service worker version
     * @returns {Promise<string>} Service worker version
     */
    async function getVersion() {
        if (!('serviceWorker' in navigator)) {
            return 'N/A';
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.version || 'Unknown');
                };
                
                if (registration.active) {
                    registration.active.postMessage(
                        { action: 'GET_VERSION' },
                        [messageChannel.port2]
                    );
                } else {
                    resolve('No active service worker');
                }
            });
            
        } catch (error) {
            console.error('Error getting service worker version:', error);
            return 'Error';
        }
    }
    
    /**
     * Clear service worker cache
     * @returns {Promise<boolean>} True if successful
     */
    async function clearCache() {
        if (!('serviceWorker' in navigator)) {
            return false;
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.success || false);
                };
                
                if (registration.active) {
                    registration.active.postMessage(
                        { action: 'CLEAR_CACHE' },
                        [messageChannel.port2]
                    );
                } else {
                    resolve(false);
                }
            });
            
        } catch (error) {
            console.error('Error clearing service worker cache:', error);
            return false;
        }
    }
    
    // Event handler setters
    function onInstallPrompt(handler) {
        eventHandlers.onInstallPrompt = handler;
    }
    
    function onInstalled(handler) {
        eventHandlers.onInstalled = handler;
    }
    
    function onOnline(handler) {
        eventHandlers.onOnline = handler;
    }
    
    function onOffline(handler) {
        eventHandlers.onOffline = handler;
    }
    
    // Public API
    return {
        // Initialization
        init,
        
        // Installation
        showInstallPrompt,
        isInstallPromptAvailable,
        
        // Service Worker
        updateServiceWorker,
        skipWaiting,
        getVersion,
        clearCache,
        
        // Network
        isOnline: () => isOnline,
        
        // Event handlers
        onInstallPrompt,
        onInstalled,
        onOnline,
        onOffline
    };
})();