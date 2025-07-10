/**
 * Route Configuration
 * Defines all application routes and their corresponding components
 */
import { router } from './router.js';

/**
 * Configure all application routes
 */
export function configureRoutes() {
    // Home route
    router.addRoute('/', {
        title: 'Debtools - Home',
        init: async () => {
    
        }
    });

    // Call Manager route
    router.addRoute('/call-manager', {
        title: 'Debtools - Call Manager',
        init: async () => {

            
            // Load the call manager CSS first
            const callManagerCssId = 'call-manager-component-css';
            if (!document.getElementById(callManagerCssId)) {
                const link = document.createElement('link');
                link.id = callManagerCssId;
                link.rel = 'stylesheet';
                link.href = './views/call-manager/call-manager.css';
                document.head.appendChild(link);
            }
            
            // Load the call manager HTML content
            const callManagerContainer = document.getElementById('main-tab');
            if (callManagerContainer) {
                try {
                    const response = await fetch('./views/call-manager/call-manager.html');
                    const html = await response.text();
                    callManagerContainer.innerHTML = html;
                    
                    // Use the new call manager component
                    const { callManagerComponent } = await import('../features/callManager/callManager.component.js');
                    if (!callManagerComponent.isReady()) {
                        await callManagerComponent.init(callManagerContainer);
                    }
                    
                    // Show mobile tabs for call manager
                    callManagerComponent.showMobileTabs();
                    
                    // Setup mobile tabs navigation after HTML is loaded
                    if (window.setupMobileTabsAfterLoad) {
                        window.setupMobileTabsAfterLoad();
                    }
                } catch (error) {
                    console.error('Error loading call manager content:', error);
                }
            }
        },
        cleanup: async () => {
            // Cleanup call manager component when leaving route
            const { callManagerComponent } = await import('../features/callManager/callManager.component.js');
            if (callManagerComponent.isReady()) {
                callManagerComponent.cleanup();
            }
            
            // Remove call manager CSS when leaving route
            const callManagerCss = document.getElementById('call-manager-component-css');
            if (callManagerCss) {
                callManagerCss.remove();
            }
        }
    });

    // Speaks & Feeds route
    router.addRoute('/speaks', {
        title: 'Debtools - Speaks & Feeds',
        init: async () => {

            // Use the new speaks and feeds component
            const { speaksAndFeedsComponent } = await import('../features/speaksAndFeeds/speaksAndFeeds.component.js');
            const speaksContainer = document.getElementById('calificaciones-tab');
            if (speaksContainer && !speaksAndFeedsComponent.isReady()) {
                await speaksAndFeedsComponent.init(speaksContainer);
            }
        },
        cleanup: async () => {
            // Cleanup speaks and feeds component when leaving route
            const { speaksAndFeedsComponent } = await import('../features/speaksAndFeeds/speaksAndFeeds.component.js');
            if (speaksAndFeedsComponent.isReady()) {
                speaksAndFeedsComponent.cleanup();
            }
        }
    });

    // Timer route
    router.addRoute('/timer', {
        title: 'Debtools - Timer',
        init: async () => {

            
            // Load the timer CSS first
            const timerCssId = 'timer-component-css';
            if (!document.getElementById(timerCssId)) {
                const link = document.createElement('link');
                link.id = timerCssId;
                link.rel = 'stylesheet';
                link.href = './views/timer/timer.css';
                document.head.appendChild(link);
            }
            
            // Load the timer HTML content
            const timerContainer = document.getElementById('timer-tab');
            if (timerContainer) {
                try {
                    const response = await fetch('./views/timer/timer.html');
                    const html = await response.text();
                    timerContainer.innerHTML = html;
                    
                    // Use the new timer component
                    const { timerComponent } = await import('../features/timer/timer.component.js');
                    if (!timerComponent.isReady()) {
                        await timerComponent.init(timerContainer);
                    }
                } catch (error) {
                    console.error('Error loading timer content:', error);
                }
            }
        },
        cleanup: async () => {
            // Cleanup timer component when leaving route
            const { timerComponent } = await import('../features/timer/timer.component.js');
            if (timerComponent.isReady()) {
                await timerComponent.cleanup();
            }
            
            // Remove timer CSS when leaving route
            const timerCss = document.getElementById('timer-component-css');
            if (timerCss) {
                timerCss.remove();
            }
        }
    });

    // (Break Predict route eliminado)


}

/**
 * Get all configured routes (for debugging)
 */
export function getRoutes() {
    return Array.from(router.routes.keys());
} 