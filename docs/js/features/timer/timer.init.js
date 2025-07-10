import { getGlobalTimerManager } from './timer.global.js';
import { timerFloating } from './timer.floating.js';

let isTimerInitialized = false;

export function resetTimer() {
    // Don't reset - we want true persistence
    // isTimerInitialized = false;
}

export function initTimer() {
    // Only initialize if timer tab exists
    const timerTab = document.getElementById('timer-tab');
    if (!timerTab) return;
    
    // Get the global timer manager
    const globalTimer = getGlobalTimerManager();
    
    // Make timerFloating available globally
    window.timerFloating = timerFloating;
    
    // Setup audio if not already done
    globalTimer.setup();
    
    // If no timers exist, add a default one
    if (globalTimer.timers.length === 0) {
        globalTimer.addTimer('Timer 1', 7, 0);
    }
    
    // Render all existing timers
    globalTimer.renderAllTimers();
    
    // Setup add button
    setupAddButton(globalTimer);
    
    // Setup toggle + button
    setupToggleButton();
    
    // Setup quick action buttons
    globalTimer.setupQuickActionButtons();
    
    // Setup quick time footer
    setTimeout(() => {
        updateQuickTimeFooterVisibility(globalTimer);
    }, 100);
    
    isTimerInitialized = true;
}

function setupAddButton(globalTimer) {
    const addButton = document.querySelector('.add-timer-compact');
    if (!addButton) return;
    
    addButton.addEventListener('click', () => {
        const minutesSlider = document.querySelector('.minutes-slider');
        const secondsSlider = document.querySelector('.seconds-slider');
        
        const minutes = minutesSlider ? parseInt(minutesSlider.value) : 7;
        const seconds = secondsSlider ? parseInt(secondsSlider.value) : 0;
        
        const timer = globalTimer.addTimer(`Timer ${globalTimer.timers.length + 1}`, minutes, seconds);
        globalTimer.renderTimer(timer);
        
        // Update footer visibility and button states
        updateQuickTimeFooterVisibility(globalTimer);
    });
    
    // Setup sliders
    const minutesSlider = document.querySelector('.minutes-slider');
    const secondsSlider = document.querySelector('.seconds-slider');
    
    if (minutesSlider) {
        minutesSlider.addEventListener('input', updatePresetTimeButton);
    }
    
    if (secondsSlider) {
        secondsSlider.addEventListener('input', updatePresetTimeButton);
    }
    
    updatePresetTimeButton();

}

function updatePresetTimeButton() {
    const presetTimeElement = document.querySelector('.preset-time');
    const minutesSlider = document.querySelector('.minutes-slider');
    const secondsSlider = document.querySelector('.seconds-slider');
    
    if (presetTimeElement && minutesSlider && secondsSlider) {
        const minutes = minutesSlider.value.toString().padStart(2, '0');
        const seconds = secondsSlider.value.toString().padStart(2, '0');
        presetTimeElement.textContent = `${minutes}:${seconds}`;
    }
}

function updateQuickTimeFooterVisibility(globalTimer) {
    // Make this function globally available
    window.updateQuickTimeFooterVisibility = updateQuickTimeFooterVisibility;
    const quickTimeFooter = document.getElementById('quick-time-footer');
    
    if (!quickTimeFooter) {
        return;
    }
    
    // Mostrar solo si hay exactamente un timer
    if (globalTimer.timers.length === 1) {
        quickTimeFooter.style.display = 'block';
        document.body.style.paddingBottom = '120px';
        document.body.classList.add('quick-footer-visible');
        
        // Update button states based on timer status
        updateQuickButtonStates(globalTimer);
    } else {
        quickTimeFooter.style.display = 'none';
        document.body.style.paddingBottom = '0px';
        document.body.classList.remove('quick-footer-visible');
    }
}

function updateQuickButtonStates(globalTimer) {
    const quickButtons = document.querySelectorAll('.quick-time-btn');
    
    if (globalTimer.timers.length === 1) {
        const timer = globalTimer.timers[0];
        const isEnabled = !timer.isRunning; // Enable only when timer is not running
        
        quickButtons.forEach(button => {
            if (isEnabled) {
                button.classList.remove('disabled');
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
            } else {
                button.classList.add('disabled');
                button.style.opacity = '0.5';
                button.style.pointerEvents = 'none';
            }
        });
    }
}

function setupToggleButton() {
    const toggleBtn = document.querySelector('.toggle-add-section');
    const timerFooter = document.querySelector('.timer-footer');
    
    if (!toggleBtn || !timerFooter) return;
    
    // Initialize state - footer starts hidden
    let isVisible = false;
    timerFooter.classList.add('hidden');
    
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        isVisible = !isVisible;
        toggleBtn.classList.toggle('active', isVisible);
        
        if (isVisible) {
            // Show footer - remove hidden class and add visible
            timerFooter.classList.remove('hidden');
            timerFooter.classList.add('visible');
            document.body.classList.add('footer-visible');
        } else {
            // Hide footer - add hidden class and remove visible
            timerFooter.classList.remove('visible');
            timerFooter.classList.add('hidden');
            document.body.classList.remove('footer-visible');
        }
    });
} 