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
    
    // Get initial values from sliders
    const minutesSlider = document.querySelector('.minutes-slider');
    const secondsSlider = document.querySelector('.seconds-slider');
    
    // Add initial timer with values from sliders (with fallback values)
    const defaultMinutes = minutesSlider ? parseInt(minutesSlider.value) : 7;
    const defaultSeconds = secondsSlider ? parseInt(secondsSlider.value) : 0;
    timerManager.addTimer(translate('timer.defaultName') || 'Timer 1', defaultMinutes, defaultSeconds);
    
    // Make audio test available globally
    window.testAudioDirect = () => {
        timerManager.directAudioTest();
    };

    function updatePresetTimeButton() {
        const presetTimeElement = document.querySelector('.preset-time');
        if (presetTimeElement && minutesSlider && secondsSlider) {
            const minutes = minutesSlider.value.toString().padStart(2, '0');
            const seconds = secondsSlider.value.toString().padStart(2, '0');
            presetTimeElement.textContent = `${minutes}:${seconds}`;
        }
    }

    function updateTooltips() {
        if (minutesSlider && secondsSlider) {
            const minutesGroup = minutesSlider.closest('.slider-group');
            const secondsGroup = secondsSlider.closest('.slider-group');
            
            if (minutesGroup) minutesGroup.setAttribute('data-value', `${minutesSlider.value} min`);
            if (secondsGroup) secondsGroup.setAttribute('data-value', `${secondsSlider.value} seg`);
        }
    }

    // Only add event listeners if sliders exist
    if (minutesSlider) {
        minutesSlider.addEventListener('input', (e) => {
            updatePresetTimeButton();
            updateTooltips();
        });
    }

    if (secondsSlider) {
        secondsSlider.addEventListener('input', (e) => {
            updatePresetTimeButton();
            updateTooltips();
        });
    }

    // Initialize displays
    updatePresetTimeButton();
    updateTooltips();
} 