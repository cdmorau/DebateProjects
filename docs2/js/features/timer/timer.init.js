import { timerManager } from './timer.manager.js';
import { timerView } from './timer.view.js';
import { timerHandlers } from './timer.handlers.js';
import { translate } from '../../common/i18n.js';

export function initTimer() {
    // Only initialize if timer tab exists
    const timerTab = document.getElementById('timer-tab');
    if (!timerTab) return;

    // Initialize timer manager
    timerManager.init();
    
    // Initialize view
    timerView.init();
    
    // Initialize handlers
    timerHandlers.init();
    
    // Add initial timer with default 7:15 time
    timerManager.addTimer(translate('timer.defaultName') || 'Timer 1', 7, 15);
    
    // Make audio test available globally
    window.testAudioDirect = () => {
        timerManager.directAudioTest();
    };
} 