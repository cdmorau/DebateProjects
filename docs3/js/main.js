import { init as initI18n, translate } from './common/i18n.js';
import { initCallManager, callManager } from './features/callManager/callManager.js';
import { initSpeaksAndFeeds } from './features/speaksAndFeeds/speaksAndFeeds.init.js';
import { initTimer } from './features/timer/timer.init.js';
import { updateDefaultJudgeNames } from './common/state.js';
// Router imports
import { router } from './router/router.js';
import { navigationAdapter } from './router/navigation-adapter.js';
import { configureRoutes } from './router/routes.js';
// Navigation module import
import { initNavigation } from './navigation.js';
// Preloader import
import { preloader } from './common/preloader.js';

let navigationManager;

document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    setupLanguageSelector();
    
    // Initialize navigation system
    navigationManager = initNavigation();
    
    // Start preloading components with progress tracking
    const preloadIndicator = document.getElementById('preload-indicator');
    const preloadBar = document.getElementById('preload-bar');
    
    // Show indicator only if preloading takes time
    const showIndicatorTimeout = setTimeout(() => {
        if (preloadIndicator) {
            preloadIndicator.style.display = 'block';
        }
    }, 100);
    
    preloader.preloadWithProgress((completed, total, componentName, error) => {
        // Update progress bar
        if (preloadBar) {
            const percentage = (completed / total) * 100;
            preloadBar.style.width = `${percentage}%`;
        }
        
        // Hide indicator when complete
        if (completed === total) {
            clearTimeout(showIndicatorTimeout);
            if (preloadIndicator) {
                setTimeout(() => {
                    preloadIndicator.style.display = 'none';
                }, 500);
            }
        }
    }).catch(error => {
        clearTimeout(showIndicatorTimeout);
        if (preloadIndicator) {
            preloadIndicator.style.display = 'none';
        }
    });
    
    // Initialize router system
    configureRoutes();
    navigationAdapter.init();
    router.init();
    
    // Keep existing initialization for backward compatibility
    setupMainMenuButtons();
    initCallManager();
    initSpeaksAndFeeds();
    initTimer();
    
    // Initialize mobile tabs state (hidden by default)
    const mobileTabs = document.querySelector('.mobile-tabs');
    const body = document.body;
    mobileTabs?.classList.remove('show');
    body.classList.remove('show-mobile-tabs');
});

function setupLanguageSelector() {
    const langButtons = document.querySelectorAll('.lang-button');
    langButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const lang = button.getAttribute('data-lang');
            await initI18n(lang);
            localStorage.setItem('language', lang);
            updateActiveButton(lang);
            
            // Update default judge names when language changes
            updateDefaultJudgeNames(translate);
            
            // Update visualization if we're in call manager
            if (callManager && callManager.view) {
                callManager.view.updateVisualization();
            }
        });
    });

    const savedLang = localStorage.getItem('language') || 'es';
    updateActiveButton(savedLang);
}

function updateActiveButton(activeLang) {
    const langButtons = document.querySelectorAll('.lang-button');
    langButtons.forEach(button => {
        if (button.getAttribute('data-lang') === activeLang) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function setupMainMenuButtons() {
    // Main menu buttons navigation
    document.getElementById('go-call-manager')?.addEventListener('click', () => {
        navigationManager.navigateToCallManager();
        // Initialize call manager when navigating to it
        if (callManager) {
            callManager.init();
        }
    });
    
    document.getElementById('go-calificaciones')?.addEventListener('click', () => {
        navigationManager.navigateToSpeaksFeeds();
    });
    
    document.getElementById('go-timer')?.addEventListener('click', () => {
        navigationManager.navigateToTimer();
    });
    
    document.getElementById('go-break-predict')?.addEventListener('click', () => {
        navigationManager.navigateToBreakPredict();
    });
}

// Utility function to check preload status (useful for debugging)
function getPreloadStatus() {
    return preloader.getCacheStatus();
}

// Export navigation manager and utilities for use by other modules
export { navigationManager, getPreloadStatus };
