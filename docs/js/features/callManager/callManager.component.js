import { initCallManager, callManager } from './callManager.js';

/**
 * Call Manager Component
 * Provides a standardized interface for the router system
 */
class CallManagerComponent {
    constructor() {
        this.initialized = false;
        this.container = null;
    }

    /**
     * Check if the component is ready/initialized
     */
    isReady() {
        return this.initialized;
    }

    /**
     * Initialize the call manager component
     */
    async init(container) {
        if (this.initialized) {
            return;
        }

        this.container = container;
        
        try {
            // Initialize the call manager
            initCallManager();
            
            // Ensure the add judge button is properly set up
            this.setupAddJudgeButton();
            
            this.initialized = true;
    
        } catch (error) {
            console.error('Error initializing Call Manager component:', error);
            throw error;
        }
    }

    /**
     * Setup the add judge button functionality
     */
    setupAddJudgeButton() {
        const addJudgeBtn = document.querySelector('.add-judge-button');
        if (addJudgeBtn) {
            // Remove any existing event listeners
            const newAddJudgeBtn = addJudgeBtn.cloneNode(true);
            addJudgeBtn.parentNode.replaceChild(newAddJudgeBtn, addJudgeBtn);
            
            // Add the click event listener
            newAddJudgeBtn.addEventListener('click', () => {
        
                callManager.addGenericJudge();
            });
            

        } else {
            console.error('Add judge button not found in DOM');
        }
    }

    /**
     * Show mobile tabs for call manager
     */
    showMobileTabs() {
        // Add mobile tabs functionality if needed
        const body = document.body;
        if (body) {
            body.classList.add('show-mobile-tabs');
        }
    }

    /**
     * Cleanup the component
     */
    cleanup() {
        if (!this.initialized) {
            return;
        }

        // Hide mobile tabs
        const body = document.body;
        if (body) {
            body.classList.remove('show-mobile-tabs');
        }

        this.initialized = false;
        this.container = null;

    }

    /**
     * Get the underlying call manager instance
     */
    getInstance() {
        return callManager;
    }
}

// Export singleton instance
export const callManagerComponent = new CallManagerComponent(); 