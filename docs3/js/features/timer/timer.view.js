import { timerHandlers } from './timer.handlers.js';
import { translate } from '../../common/i18n.js';

class TimerView {
    constructor() {
        this.timersGrid = null;
    }

    init() {
        this.timersGrid = document.getElementById('timers-grid');
        // Initialize grid layout
        this.updateGridLayout();
    }

    renderTimer(timer) {
        if (!this.timersGrid) return;

        const template = document.getElementById('timer-card-template');
        const timerCard = template.content.cloneNode(true);
        
        // Check if using compact design
        const isCompactDesign = document.querySelector('.timer-section-new') !== null;
        
        let cardElement;
        if (isCompactDesign) {
            cardElement = timerCard.querySelector('.timer-card-compact');
        } else {
            cardElement = timerCard.querySelector('.timer-card');
        }
        
        if (!cardElement) return;
        
        cardElement.dataset.timerId = timer.id;
        
        // Set timer name
        if (isCompactDesign) {
            const nameElement = timerCard.querySelector('.timer-name-compact');
            if (nameElement) nameElement.textContent = timer.name;
        } else {
            const titleElement = timerCard.querySelector('.timer-title');
            if (titleElement) titleElement.textContent = timer.name;
        }
        
        // Set time display
        this.updateTimeDisplay(cardElement, timer);
        
        // Set time inputs
        const minutesInput = timerCard.querySelector('.minutes-input');
        const secondsInput = timerCard.querySelector('.seconds-input');
        if (minutesInput) minutesInput.value = timer.initialMinutes;
        if (secondsInput) secondsInput.value = timer.initialSeconds;
        
        // Setup event listeners through handlers
        timerHandlers.setupTimerEventListeners(cardElement, timer);
        
        // Insert at the beginning instead of at the end
        this.timersGrid.appendChild(timerCard);
        
        // Update grid layout classes
        this.updateGridLayout();
    }

    updateTimeDisplay(timerIdOrElement, timer) {
        let cardElement;
        
        if (typeof timerIdOrElement === 'number') {
            cardElement = document.querySelector(`[data-timer-id="${timerIdOrElement}"]`);
        } else {
            cardElement = timerIdOrElement;
        }
        
        if (!cardElement) return;

        // Try both designs - original and compact
        let minutesSpan = cardElement.querySelector('.minutes');
        let secondsSpan = cardElement.querySelector('.seconds');
        
        // If not found, try compact design selectors
        if (!minutesSpan || !secondsSpan) {
            minutesSpan = cardElement.querySelector('.time-number.minutes');
            secondsSpan = cardElement.querySelector('.time-number.seconds');
        }
        
        if (minutesSpan && secondsSpan) {
            minutesSpan.textContent = String(timer.currentMinutes).padStart(2, '0');
            secondsSpan.textContent = String(timer.currentSeconds).padStart(2, '0');
        }
    }

    updateTimerState(timerId, timer) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;

        // Remove all state classes
        cardElement.classList.remove('running', 'paused', 'finished');
        
        // Add appropriate state class
        if (timer.isFinished) {
            cardElement.classList.add('finished');
        } else if (timer.isRunning) {
            cardElement.classList.add('running');
        } else if (timer.isPaused) {
            cardElement.classList.add('paused');
        }

        // Update toggle button appearance - original design
        const toggleBtn = cardElement.querySelector('.timer-btn-toggle');
        if (toggleBtn) {
            if (timer.isRunning) {
                toggleBtn.classList.add('paused'); // Show pause icon when running
            } else {
                toggleBtn.classList.remove('paused'); // Show play icon when stopped/paused
            }
        }

        // Update compact design button
        const compactToggleBtn = cardElement.querySelector('.timer-btn-compact.play-pause');
        if (compactToggleBtn) {
            if (timer.isRunning) {
                compactToggleBtn.textContent = '⏸';
                compactToggleBtn.classList.add('paused');
                compactToggleBtn.title = 'Pausar';
            } else {
                compactToggleBtn.textContent = '▶';
                compactToggleBtn.classList.remove('paused');
                compactToggleBtn.title = 'Reproducir';
            }
        }
    }

    flashTimer(timerId) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;

        let flashCount = 0;
        const flashInterval = setInterval(() => {
            cardElement.style.backgroundColor = flashCount % 2 === 0 ? '#ffebee' : '#f8f9fa';
            flashCount++;
            
            if (flashCount >= 6) {
                clearInterval(flashInterval);
                cardElement.style.backgroundColor = '';
            }
        }, 300);
    }

    removeTimerFromDOM(timerId) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (cardElement) {
            cardElement.remove();
            // Update grid layout classes after removal
            this.updateGridLayout();
        }
    }

    updateTimerInputs(timerId, minutes, seconds) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;

        const minutesInput = cardElement.querySelector('.minutes-input');
        const secondsInput = cardElement.querySelector('.seconds-input');
        
        if (minutesInput) minutesInput.value = minutes;
        if (secondsInput) secondsInput.value = seconds;
    }

    getTimerElement(timerId) {
        return document.querySelector(`[data-timer-id="${timerId}"]`);
    }

    updateModeButton(timerId, timer) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;

        // Update mode toggle button
        const modeToggleBtn = cardElement.querySelector('.mode-toggle');
        if (modeToggleBtn) {
            if (timer.isStopwatch) {
                modeToggleBtn.textContent = 'ASC';
                modeToggleBtn.setAttribute('data-mode', 'stopwatch');
            } else {
                modeToggleBtn.textContent = 'DSC';
                modeToggleBtn.setAttribute('data-mode', 'timer');
            }
        }

        // Update bell config button
        const bellConfigBtn = cardElement.querySelector('.bell-config');
        if (bellConfigBtn) {
            if (timer.alerts && timer.alerts.length > 0) {
                bellConfigBtn.classList.add('has-alerts');
            } else {
                bellConfigBtn.classList.remove('has-alerts');
            }
        }
    }

    updateGridLayout() {
        if (!this.timersGrid) return;
        
        const timerCards = this.timersGrid.querySelectorAll('.timer-card, .timer-card-compact');
        const timerCount = timerCards.length;
        
        // Remove existing layout classes
        this.timersGrid.classList.remove('single-timer', 'multiple-timers');
        
        // Apply appropriate layout class
        if (timerCount === 1) {
            this.timersGrid.classList.add('single-timer');
        } else if (timerCount > 1) {
            this.timersGrid.classList.add('multiple-timers');
        }
    }

    updatePresetButtons(timerId, timer) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;

        const presetButtons = cardElement.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            const presetName = btn.dataset.preset;
            if (timer.preset === presetName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateAudioButton(isMuted) {
        const audioMuteBtn = document.querySelector('.audio-mute');
        if (!audioMuteBtn) return;

        if (isMuted) {
            audioMuteBtn.textContent = '🔇';
            audioMuteBtn.classList.add('muted');
            audioMuteBtn.title = translate('timer.activateDings');
        } else {
            audioMuteBtn.textContent = '🔊';
            audioMuteBtn.classList.remove('muted');
            audioMuteBtn.title = translate('timer.muteDings');
        }
    }

    updateTimerDisplay(timer) {
        const cardElement = document.querySelector(`[data-timer-id="${timer.id}"]`);
        if (!cardElement) return;

        // Update time display to show current time (not initial time)
        const minutesSpan = cardElement.querySelector('.time-number.minutes');
        const secondsSpan = cardElement.querySelector('.time-number.seconds');
        
        if (minutesSpan && secondsSpan) {
            minutesSpan.textContent = String(timer.currentMinutes).padStart(2, '0');
            secondsSpan.textContent = String(timer.currentSeconds).padStart(2, '0');
        }

        // Update hidden inputs with initial values for editing
        const minutesInput = cardElement.querySelector('.minutes-input');
        const secondsInput = cardElement.querySelector('.seconds-input');
        
        if (minutesInput) minutesInput.value = timer.initialMinutes;
        if (secondsInput) secondsInput.value = timer.initialSeconds;
    }

    updateTimer(timer) {
        // Update all timer components
        this.updateTimerDisplay(timer);
        this.updateTimerState(timer.id, timer);
        this.updateModeButton(timer.id, timer);
        this.updateSoundControls(timer.id, timer);
    }

    updateSoundControls(timerId, timer) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;

        const soundSwitchInput = cardElement.querySelector('.sound-switch-input');
        if (soundSwitchInput) {
            soundSwitchInput.checked = timer.bellEnabled !== false;
        }

        // Update visual feedback
        timerHandlers.updateSoundToggleVisual(cardElement, timer.bellEnabled !== false);
    }
}

export const timerView = new TimerView(); 