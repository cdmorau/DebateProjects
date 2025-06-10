import { timerManager } from './timer.manager.js';
import { timerView } from './timer.view.js';

class TimerHandlers {
    constructor() {
        this.addButton = null;
    }

    init() {
        this.setupAddButton();
        this.setupAudioControls();
        
        // Setup compact design elements
        setTimeout(() => {
            this.setupTimeButtons();
            this.updateGlobalModeButton();
        }, 100);

        // Listen for timer list changes
        window.addEventListener('timerListChanged', () => {
            this.updateGlobalModeButton();
        });
    }

    setupAddButton() {
        // Original button
        this.addButton = document.querySelector('.add-timer-button');
        if (this.addButton) {
            this.addButton.addEventListener('click', () => {
                timerManager.addTimer();
            });
        }
        
        // New compact button
        this.addButtonCompact = document.querySelector('.add-timer-compact');
        if (this.addButtonCompact) {
            this.addButtonCompact.addEventListener('click', () => {
                timerManager.addTimer();
            });
        }
    }

    setupAudioControls() {
        // Original audio controls
        const audioInitBtn = document.querySelector('.audio-init');
        if (audioInitBtn) {
            audioInitBtn.addEventListener('click', async () => {
                const success = await timerManager.initializeAudio();
                if (success) {
                    console.log('Audio initialized successfully');
                } else {
                    console.error('Failed to initialize audio');
                }
            });
        }

        const audioMuteBtn = document.querySelector('.audio-mute');
        if (audioMuteBtn) {
            audioMuteBtn.addEventListener('click', () => {
                const isMuted = timerManager.toggleAudioMute();
                timerView.updateAudioButton(isMuted);
            });
        }

        const audioTestBtn = document.querySelector('.audio-test');
        if (audioTestBtn) {
            audioTestBtn.addEventListener('click', () => {
                timerManager.directAudioTest();
            });
        }

        // New compact audio controls
        const testBtnCompact = document.querySelector('.test-btn');
        if (testBtnCompact) {
            testBtnCompact.addEventListener('click', () => {
                timerManager.directAudioTest();
            });
        }

        const muteBtnCompact = document.querySelector('.mute-btn');
        if (muteBtnCompact) {
            muteBtnCompact.addEventListener('click', () => {
                const isMuted = timerManager.toggleAudioMute();
                this.updateCompactAudioButton(isMuted);
            });
        }


    }

    updateCompactAudioButton(isMuted) {
        const muteBtnCompact = document.querySelector('.mute-btn');
        if (!muteBtnCompact) return;

        if (isMuted) {
            muteBtnCompact.textContent = 'Mute';
            muteBtnCompact.title = 'Activar campanadas';
            muteBtnCompact.style.opacity = '0.6';
        } else {
            muteBtnCompact.textContent = 'Audio';
            muteBtnCompact.title = 'Silenciar campanadas';
            muteBtnCompact.style.opacity = '1';
        }
    }

    updateGlobalModeButton() {
        const globalModeBtn = document.querySelector('.global-mode-btn');
        if (!globalModeBtn) return;

        const timers = timerManager.getAllTimers();
        if (timers.length === 0) {
            globalModeBtn.textContent = 'Modo';
            globalModeBtn.title = 'Cambiar modo de todos los timers';
            globalModeBtn.classList.remove('mixed');
            return;
        }

        const stopwatchCount = timers.filter(t => t.isStopwatch).length;
        
        // Remove mixed class first
        globalModeBtn.classList.remove('mixed');
        
        if (stopwatchCount === 0) {
            globalModeBtn.textContent = 'Timer';
            globalModeBtn.title = 'Todos en modo Timer - Click para cambiar a Cronómetro';
        } else if (stopwatchCount === timers.length) {
            globalModeBtn.textContent = 'Crono';
            globalModeBtn.title = 'Todos en modo Cronómetro - Click para cambiar a Timer';
        } else {
            globalModeBtn.textContent = 'Mixto';
            globalModeBtn.title = 'Modos mixtos - Click para alternar';
            globalModeBtn.classList.add('mixed');
        }
    }

    setupTimerEventListeners(cardElement, timer) {
        // Name editing
        this.setupNameEditing(cardElement, timer);
        
        // Control buttons
        this.setupControlButtons(cardElement, timer);
        
        // Remove button
        this.setupRemoveButton(cardElement, timer);
        
        // Time inputs (legacy - hidden)
        this.setupTimeInputs(cardElement, timer);
        
        // Arrow controls for time editing
        this.setupTimeArrowControls(cardElement, timer);
        
        // Preset buttons (individual timer)
        this.setupPresetButtons(cardElement, timer);
        
        // Local mode controls
        this.setupLocalModeControls(cardElement, timer);
    }

    setupNameEditing(cardElement, timer) {
        // Original design
        const nameElement = cardElement.querySelector('.timer-name');
        if (nameElement) {
            nameElement.addEventListener('blur', (e) => {
                const newName = e.target.textContent.trim();
                if (newName) {
                    timerManager.updateTimerName(timer.id, newName);
                } else {
                    e.target.textContent = timer.name;
                }
            });

            nameElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        }

        // Compact design
        const compactNameElement = cardElement.querySelector('.timer-name-compact');
        if (compactNameElement) {
            compactNameElement.addEventListener('blur', (e) => {
                const newName = e.target.textContent.trim();
                if (newName) {
                    timerManager.updateTimerName(timer.id, newName);
                } else {
                    e.target.textContent = timer.name;
                }
            });

            compactNameElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        }
    }

    setupControlButtons(cardElement, timer) {
        // Original design buttons
        const toggleBtn = cardElement.querySelector('.timer-btn-toggle');
        const resetBtn = cardElement.querySelector('.timer-btn-reset');
        const modeBtn = cardElement.querySelector('.timer-btn-mode');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', async () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    if (currentTimer.isRunning) {
                        timerManager.pauseTimer(timer.id);
                    } else {
                        await timerManager.startTimer(timer.id);
                    }
                }
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                timerManager.resetTimer(timer.id);
            });
        }
        
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    timerManager.toggleTimerMode(timer.id);
                }
            });
        }

        // Compact design buttons
        const compactToggleBtn = cardElement.querySelector('.timer-btn-compact.play-pause');
        const compactResetBtn = cardElement.querySelector('.timer-btn-compact.reset');
        const compactModeBtn = cardElement.querySelector('.timer-btn-compact.mode');

        if (compactToggleBtn) {
            compactToggleBtn.addEventListener('click', async () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    if (currentTimer.isRunning) {
                        timerManager.pauseTimer(timer.id);
                    } else {
                        await timerManager.startTimer(timer.id);
                    }
                }
            });
        }
        
        if (compactResetBtn) {
            compactResetBtn.addEventListener('click', () => {
                timerManager.resetTimer(timer.id);
            });
        }
        
        if (compactModeBtn) {
            compactModeBtn.addEventListener('click', () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    timerManager.toggleTimerMode(timer.id);
                }
            });
        }
    }

    setupRemoveButton(cardElement, timer) {
        // Original design
        const removeBtn = cardElement.querySelector('.remove-timer');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                timerManager.removeTimer(timer.id);
            });
        }

        // Compact design
        const removeBtnCompact = cardElement.querySelector('.remove-timer-compact');
        if (removeBtnCompact) {
            removeBtnCompact.addEventListener('click', () => {
                timerManager.removeTimer(timer.id);
            });
        }
    }

    setupTimeInputs(cardElement, timer) {
        const minutesInput = cardElement.querySelector('.minutes-input');
        const secondsInput = cardElement.querySelector('.seconds-input');

        if (minutesInput) {
            minutesInput.addEventListener('change', (e) => {
                const minutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                e.target.value = minutes;
                
                const currentTimer = timerManager.getTimer(timer.id);
                const seconds = currentTimer ? currentTimer.initialSeconds : 0;
                timerManager.updateTimerSettings(timer.id, minutes, seconds);
            });
        }

        if (secondsInput) {
            secondsInput.addEventListener('change', (e) => {
                const seconds = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                e.target.value = seconds;
                
                const currentTimer = timerManager.getTimer(timer.id);
                const minutes = currentTimer ? currentTimer.initialMinutes : 0;
                timerManager.updateTimerSettings(timer.id, minutes, seconds);
            });
        }
    }

    setupTimeArrowControls(cardElement, timer) {
        // Original design arrows
        const arrows = cardElement.querySelectorAll('.time-arrow');
        
        // Compact design arrows
        const compactArrows = cardElement.querySelectorAll('.time-arrow-compact');
        
        // Combine both arrow types
        const allArrows = [...arrows, ...compactArrows];
        
        allArrows.forEach(arrow => {
            let pressTimer = null;
            let isPressed = false;
            let repeatDelay = 500; // Initial delay in ms
            let repeatInterval = null;
            
            const performAction = () => {
                const field = arrow.dataset.field; // 'minutes' or 'seconds'
                const action = arrow.dataset.action; // 'increment' or 'decrement'
                
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    let currentMinutes = currentTimer.initialMinutes;
                    let currentSeconds = currentTimer.initialSeconds;
                    
                    if (field === 'minutes') {
                        if (action === 'increment') {
                            currentMinutes = Math.min(59, currentMinutes + 1);
                        } else {
                            currentMinutes = Math.max(0, currentMinutes - 1);
                        }
                    } else if (field === 'seconds') {
                        if (action === 'increment') {
                            currentSeconds = Math.min(59, currentSeconds + 1);
                        } else {
                            currentSeconds = Math.max(0, currentSeconds - 1);
                        }
                    }
                    
                    timerManager.updateTimerSettings(timer.id, currentMinutes, currentSeconds);
                }
            };
            
            const startRepeating = () => {
                let currentDelay = repeatDelay;
                
                const repeat = () => {
                    if (!isPressed) return;
                    
                    performAction();
                    
                    // Accelerate: reduce delay progressively (minimum 50ms)
                    currentDelay = Math.max(50, currentDelay * 0.85);
                    
                    repeatInterval = setTimeout(repeat, currentDelay);
                };
                
                // Start first repeat after initial delay
                pressTimer = setTimeout(() => {
                    if (isPressed) {
                        repeat();
                    }
                }, repeatDelay);
            };
            
            const stopRepeating = () => {
                isPressed = false;
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
                if (repeatInterval) {
                    clearTimeout(repeatInterval);
                    repeatInterval = null;
                }
            };
            
            // Mouse events
            arrow.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                isPressed = true;
                
                // Perform immediate action
                performAction();
                
                // Start repeating
                startRepeating();
            });
            
            arrow.addEventListener('mouseup', stopRepeating);
            arrow.addEventListener('mouseleave', stopRepeating);
            
            // Touch events for mobile
            arrow.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                isPressed = true;
                
                // Perform immediate action
                performAction();
                
                // Start repeating
                startRepeating();
            });
            
            arrow.addEventListener('touchend', stopRepeating);
            arrow.addEventListener('touchcancel', stopRepeating);
        });
    }

    setupTimeButtons() {
        const timeButtons = document.querySelectorAll('.time-btn');
        
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                const seconds = parseInt(btn.dataset.seconds);
                
                // Create a new timer with this time
                const timerName = `Timer ${minutes}:${String(seconds).padStart(2, '0')}`;
                timerManager.addTimer(timerName, minutes, seconds);
                this.updateTimeButtons(btn);
            });
        });
    }

    updateTimeButtons(activeBtn) {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            // Remove active state after a moment
            setTimeout(() => {
                activeBtn.classList.remove('active');
            }, 1000);
        }
    }

    setupPresetButtons(cardElement, timer) {
        const presetButtons = cardElement.querySelectorAll('.preset-btn');
        
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetName = btn.dataset.preset;
                timerManager.applyPreset(timer.id, presetName);
            });
        });
    }



    setupLocalModeControls(cardElement, timer) {
        // Mode toggle button
        const modeToggleBtn = cardElement.querySelector('.mode-toggle');
        if (modeToggleBtn) {
            modeToggleBtn.addEventListener('click', () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    timerManager.toggleTimerMode(timer.id);
                    this.updateModeToggleButton(cardElement, timerManager.getTimer(timer.id));
                }
            });
        }
        
        // Bell toggle button
        const bellToggleBtn = cardElement.querySelector('.bell-toggle');
        if (bellToggleBtn) {
            bellToggleBtn.addEventListener('click', () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    currentTimer.bellEnabled = !currentTimer.bellEnabled;
                    this.updateBellToggleButton(cardElement, currentTimer);
                }
            });
        }
        
        // Initialize button states
        this.updateModeToggleButton(cardElement, timer);
        this.updateBellToggleButton(cardElement, timer);
    }





    updateModeToggleButton(cardElement, timer) {
        const modeToggleBtn = cardElement.querySelector('.mode-toggle');
        if (!modeToggleBtn) return;
        
        if (timer.isStopwatch) {
            modeToggleBtn.textContent = 'ASC';
            modeToggleBtn.setAttribute('data-mode', 'stopwatch');
        } else {
            modeToggleBtn.textContent = 'DSC';
            modeToggleBtn.setAttribute('data-mode', 'timer');
        }
    }

    updateBellToggleButton(cardElement, timer) {
        const bellToggleBtn = cardElement.querySelector('.bell-toggle');
        if (!bellToggleBtn) return;
        
        if (timer.bellEnabled) {
            bellToggleBtn.classList.add('active');
        } else {
            bellToggleBtn.classList.remove('active');
        }
    }

    // Utility method to remove all event listeners from a timer card
    removeTimerEventListeners(cardElement) {
        // Clone the element to remove all event listeners
        const newElement = cardElement.cloneNode(true);
        cardElement.parentNode.replaceChild(newElement, cardElement);
        return newElement;
    }
}

export const timerHandlers = new TimerHandlers(); 