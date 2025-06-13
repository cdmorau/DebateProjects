import { timerHandlers } from './timer.handlers.js';

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

        // Update bell toggle button
        const bellToggleBtn = cardElement.querySelector('.bell-toggle');
        if (bellToggleBtn) {
            if (timer.bellEnabled) {
                bellToggleBtn.classList.add('active');
            } else {
                bellToggleBtn.classList.remove('active');
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
            audioMuteBtn.title = 'Activar campanadas';
        } else {
            audioMuteBtn.textContent = '🔊';
            audioMuteBtn.classList.remove('muted');
            audioMuteBtn.title = 'Silenciar campanadas';
        }
    }
}

export const timerView = new TimerView(); 