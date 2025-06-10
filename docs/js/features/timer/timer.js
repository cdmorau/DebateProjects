// Main timer module - entry point
import { timerManager } from './timer.manager.js';
import { timerView } from './timer.view.js';
import { timerHandlers } from './timer.handlers.js';

// Re-export the init function from timer.init.js
export { initTimer } from './timer.init.js';

// Export the main components for external access
export const timer = {
    manager: timerManager,
    view: timerView,
    handlers: timerHandlers
}; 