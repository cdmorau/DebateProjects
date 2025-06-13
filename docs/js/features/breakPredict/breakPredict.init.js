/**
 * Break Predict Initialization
 * Initializes the break prediction functionality
 */

import { breakPredictManager } from './breakPredict.manager.js';
import { breakPredictHandlers } from './breakPredict.handlers.js';
import { breakPredictView } from './breakPredict.view.js';

let isInitialized = false;

export function initBreakPredict() {
    if (isInitialized) {
        return;
    }

    try {
        // Initialize the break predict manager
        breakPredictManager.init();
        
        // Initialize handlers
        breakPredictHandlers.init();
        
        // Initialize view
        breakPredictView.init();
        
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing Break Predict:', error);
    }
}

export function cleanupBreakPredict() {
    if (!isInitialized) {
        return;
    }

    try {
        breakPredictManager.cleanup();
        breakPredictHandlers.cleanup();
        breakPredictView.cleanup();
        
        isInitialized = false;
    } catch (error) {
        console.error('Error cleaning up Break Predict:', error);
    }
}

export { breakPredictManager, breakPredictHandlers, breakPredictView }; 