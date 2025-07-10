/**
 * Global Timer System - Simple, persistent timers that run independently of navigation
 */

// Global timer instance - exists throughout the entire app lifecycle
let globalTimerInstance = null;

export function getGlobalTimerManager() {
    if (!globalTimerInstance) {
        globalTimerInstance = new GlobalTimerManager();
    }
    return globalTimerInstance;
}

class GlobalTimerManager {
    constructor() {
        this.timers = [];
        this.intervals = new Map();
        this.nextTimerId = 1;
        this.isSetup = false;
        
        // Make globally available
        window.globalTimerManager = this;
    }
    
    setup() {
        if (this.isSetup) return;
        
        this.setupAudio();
        this.isSetup = true;
    }
    
    setupAudio() {
        this.bellSounds = {
            main: new Audio('sounds/bell-98033.mp3')
        };
        this.bellSounds.main.volume = 0.7;
        this.bellSounds.main.preload = 'auto';
        this.audioMuted = false;
    }
    
    playBell(count = 1) {
        if (this.audioMuted || !this.bellSounds?.main) return;
        
        let bellIndex = 0;
        const playOneBell = () => {
            this.bellSounds.main.currentTime = 0;
            this.bellSounds.main.play().catch(() => {});
            
            bellIndex++;
            if (bellIndex < count) {
                setTimeout(playOneBell, 600);
            }
        };
        
        playOneBell();
    }
    
    addTimer(name = 'Timer 1', minutes = 7, seconds = 15) {
        const timer = {
            id: this.nextTimerId++,
            name: name,
            initialMinutes: minutes,
            initialSeconds: seconds,
            currentMinutes: minutes,
            currentSeconds: seconds,
            isRunning: false,
            isPaused: false,
            isFinished: false,
            isStopwatch: false,
            bellEnabled: true,
            alerts: this.getDefaultAlerts(minutes, seconds),
            alertsTriggered: new Set()
        };
        
        this.timers.push(timer);
        return timer;
    }
    
    getDefaultAlerts(minutes, seconds) {
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds < 150) return [];
        
        return [
            { at: totalSeconds - 60, soundType: 'single', description: '1 minuto transcurrido' },
            { at: 60, soundType: 'single', description: 'Falta 1 minuto' },
            { at: 0, soundType: 'double', description: 'Tiempo terminado' }
        ];
    }
    
    startTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        timer.isRunning = true;
        timer.isPaused = false;
        timer.isFinished = false;
        
        // Clear existing interval
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
        }
        
        const interval = setInterval(() => {
            if (timer.isStopwatch) {
                // Count up
                if (timer.currentSeconds < 59) {
                    timer.currentSeconds++;
                } else {
                    timer.currentMinutes++;
                    timer.currentSeconds = 0;
                }
            } else {
                // Count down
                if (timer.currentSeconds > 0) {
                    timer.currentSeconds--;
                } else if (timer.currentMinutes > 0) {
                    timer.currentMinutes--;
                    timer.currentSeconds = 59;
                } else {
                    // Timer finished
                    timer.isRunning = false;
                    timer.isFinished = true;
                    clearInterval(interval);
                    this.intervals.delete(timerId);
                    
                    // Play finish sound
                    if (timer.bellEnabled) {
                        this.playBell(2);
                    }
                    
                    // Update UI if visible
                    this.updateTimerUI(timer);
                    return;
                }
            }
            
            // Check alerts
            this.checkAlerts(timer);
            
            // Update UI if visible
            this.updateTimerUI(timer);
        }, 1000);
        
        this.intervals.set(timerId, interval);
        this.updateTimerUI(timer);
    }
    
    pauseTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        timer.isRunning = false;
        timer.isPaused = true;
        
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
            this.intervals.delete(timerId);
        }
        
        this.updateTimerUI(timer);
    }
    
    resetTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        timer.isRunning = false;
        timer.isPaused = false;
        timer.isFinished = false;
        timer.alertsTriggered.clear();
        
        if (timer.isStopwatch) {
            timer.currentMinutes = 0;
            timer.currentSeconds = 0;
        } else {
            timer.currentMinutes = timer.initialMinutes;
            timer.currentSeconds = timer.initialSeconds;
        }
        
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
            this.intervals.delete(timerId);
        }
        
        this.updateTimerUI(timer);
    }
    
    toggleTimerMode(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        // Stop if running
        if (timer.isRunning) {
            this.pauseTimer(timerId);
        }
        
        // Toggle mode
        timer.isStopwatch = !timer.isStopwatch;
        
        // Reset to appropriate starting values
        if (timer.isStopwatch) {
            timer.currentMinutes = 0;
            timer.currentSeconds = 0;
        } else {
            timer.currentMinutes = timer.initialMinutes;
            timer.currentSeconds = timer.initialSeconds;
        }
        
        timer.isFinished = false;
        timer.isPaused = false;
        timer.alertsTriggered.clear();
        
        this.updateTimerUI(timer);
    }
    
    checkAlerts(timer) {
        if (!timer.bellEnabled || !timer.alerts) return;
        
        const currentTime = timer.isStopwatch 
            ? timer.currentMinutes * 60 + timer.currentSeconds
            : timer.currentMinutes * 60 + timer.currentSeconds;
        
        timer.alerts.forEach(alert => {
            const alertKey = `${alert.at}-${alert.soundType}`;
            if (currentTime === alert.at && !timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                
                const bellCount = {
                    'single': 1,
                    'double': 2,
                    'triple': 3,
                    'finish': 5
                }[alert.soundType] || 1;
                
                this.playBell(bellCount);
            }
        });
    }
    
    updateTimerUI(timer) {
        // Only update UI if we're in the timer module
        if (!document.getElementById('timer-tab')) return;
        
        const cardElement = document.querySelector(`[data-timer-id="${timer.id}"]`);
        if (!cardElement) return;
        
        // Update time display
        const minutesEl = cardElement.querySelector('.time-number.minutes');
        const secondsEl = cardElement.querySelector('.time-number.seconds');
        
        if (minutesEl && secondsEl) {
            minutesEl.textContent = timer.currentMinutes.toString().padStart(2, '0');
            secondsEl.textContent = timer.currentSeconds.toString().padStart(2, '0');
        }
        
        // Update play/pause button
        const playPauseBtn = cardElement.querySelector('.play-pause');
        if (playPauseBtn) {
            playPauseBtn.textContent = timer.isRunning ? '⏸' : '▶';
        }
        
        // Update mode button
        const modeBtn = cardElement.querySelector('.mode-toggle');
        if (modeBtn) {
            modeBtn.textContent = timer.isStopwatch ? 'ASC' : 'DSC';
        }
        
        // Update status indicator
        const statusIndicator = cardElement.querySelector('.timer-status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'timer-status-indicator';
            if (timer.isRunning) {
                statusIndicator.classList.add('running');
            } else if (timer.isPaused) {
                statusIndicator.classList.add('paused');
            } else if (timer.isFinished) {
                statusIndicator.classList.add('finished');
            }
        }
        
        // Update sound switch state
        const soundSwitchInput = cardElement.querySelector('.sound-switch-input');
        if (soundSwitchInput) {
            soundSwitchInput.checked = timer.bellEnabled;
        }
        
        // Update quick action buttons state
        this.updateQuickButtonStates();
    }
    
    updateQuickButtonStates() {
        const quickButtons = document.querySelectorAll('.quick-time-btn');
        
        if (this.timers.length === 1) {
            const timer = this.timers[0];
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
    
    renderAllTimers() {
        // Only render if we're in the timer module
        if (!document.getElementById('timer-tab')) return;
        
        const timersGrid = document.getElementById('timers-grid');
        if (!timersGrid) return;
        
        // Check if timers are already rendered
        const existingTimers = timersGrid.querySelectorAll('.timer-card-compact');
        if (existingTimers.length === this.timers.length) {
            // Timers already rendered, just update their UI
            this.timers.forEach(timer => {
                this.updateTimerUI(timer);
            });
            return;
        }
        
        // Clear existing and render fresh
        timersGrid.innerHTML = '';
        
        // Render all timers
        this.timers.forEach(timer => {
            this.renderTimer(timer);
        });
    }
    
    renderTimer(timer) {
        const timersGrid = document.getElementById('timers-grid');
        if (!timersGrid) return;
        
        const template = document.getElementById('timer-card-template');
        if (!template) return;
        
        const cardElement = template.content.cloneNode(true);
        const card = cardElement.querySelector('.timer-card-compact');
        
        card.setAttribute('data-timer-id', timer.id);
        
        // Set initial values
        card.querySelector('.timer-name-compact').textContent = timer.name;
        card.querySelector('.time-number.minutes').textContent = timer.currentMinutes.toString().padStart(2, '0');
        card.querySelector('.time-number.seconds').textContent = timer.currentSeconds.toString().padStart(2, '0');
        card.querySelector('.play-pause').textContent = timer.isRunning ? '⏸' : '▶';
        card.querySelector('.mode-toggle').textContent = timer.isStopwatch ? 'ASC' : 'DSC';
        
        // Set sound switch state
        const soundSwitchInput = card.querySelector('.sound-switch-input');
        if (soundSwitchInput) {
            soundSwitchInput.checked = timer.bellEnabled;
        }
        
        // Add event listeners
        this.setupTimerEventListeners(card, timer);
        
        timersGrid.appendChild(cardElement);
    }
    
    setupTimerEventListeners(cardElement, timer) {
        // Play/Pause button
        const playPauseBtn = cardElement.querySelector('.play-pause');
        playPauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (timer.isRunning) {
                this.pauseTimer(timer.id);
            } else {
                this.startTimer(timer.id);
            }
        });
        
        // Reset button
        const resetBtn = cardElement.querySelector('.reset');
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.resetTimer(timer.id);
        });
        
        // Mode toggle button
        const modeBtn = cardElement.querySelector('.mode-toggle');
        modeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTimerMode(timer.id);
        });
        
        // Sound test button (campana)
        const soundTestBtn = cardElement.querySelector('.sound-test');
        if (soundTestBtn) {
            soundTestBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.playBell(1);
            });
        }
        
        // Sound toggle switch
        const soundSwitchInput = cardElement.querySelector('.sound-switch-input');
        if (soundSwitchInput) {
            soundSwitchInput.checked = timer.bellEnabled;
            soundSwitchInput.addEventListener('change', (e) => {
                timer.bellEnabled = e.target.checked;
            });
        }
        
        // Config button
        const configBtn = cardElement.querySelector('.config');
        if (configBtn) {
            configBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openTimerConfig(timer.id);
            });
        }
        
        // Remove button
        const removeBtn = cardElement.querySelector('.remove-timer-compact');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.timers.length > 1) {
                this.removeTimer(timer.id);
            }
        });
    }
    
    removeTimer(timerId) {
        const timerIndex = this.timers.findIndex(t => t.id === timerId);
        if (timerIndex === -1) return;
        
        // Clear interval
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
            this.intervals.delete(timerId);
        }
        
        // Remove from array
        this.timers.splice(timerIndex, 1);
        
        // Remove from DOM
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (cardElement) {
            cardElement.remove();
        }
        
        // Update footer visibility
        if (document.getElementById('timer-tab')) {
            // Call the function from timer.init.js if available
            if (window.updateQuickTimeFooterVisibility) {
                window.updateQuickTimeFooterVisibility(this);
            }
        }
    }
    
    getTimer(timerId) {
        return this.timers.find(t => t.id === timerId);
    }
    
    getAllTimers() {
        return this.timers;
    }
    
    // Quick action presets
    applyQuickPreset(presetName) {
        // Only work when there's exactly one timer
        if (this.timers.length !== 1) return false;
        
        const timer = this.timers[0];
        
        // Only work when timer is paused or stopped (not running)
        if (timer.isRunning) return false;
        
        const presets = {
            'bpspeech': { minutes: 7, seconds: 15 },
            'preptime': { minutes: 15, seconds: 0 },
            'deliberation': { minutes: 20, seconds: 0 }
        };
        
        const preset = presets[presetName];
        if (!preset) return false;
        
        // Apply preset
        timer.initialMinutes = preset.minutes;
        timer.initialSeconds = preset.seconds;
        timer.currentMinutes = preset.minutes;
        timer.currentSeconds = preset.seconds;
        timer.isFinished = false;
        timer.isPaused = false;
        timer.alertsTriggered.clear();
        
        // Regenerate alerts for new time
        timer.alerts = this.getDefaultAlerts(preset.minutes, preset.seconds);
        
        // Update UI
        this.updateTimerUI(timer);
        
        return true;
    }
    
    setupQuickActionButtons() {
        const quickButtons = document.querySelectorAll('.quick-time-btn');
        
        quickButtons.forEach(button => {
            // Remove existing listeners to avoid duplicates
            button.replaceWith(button.cloneNode(true));
        });
        
        // Add fresh listeners
        document.querySelectorAll('.quick-time-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const preset = button.getAttribute('data-preset');
                this.applyQuickPreset(preset);
            });
        });
    }
    
    openTimerConfig(timerId) {
        const timer = this.getTimer(timerId);
        if (!timer) return;
        
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;
        
        const configOverlay = cardElement.querySelector('.timer-config-overlay');
        if (!configOverlay) return;
        
        // Setup sliders with current values
        const minutesSlider = configOverlay.querySelector('.minutes-slider');
        const secondsSlider = configOverlay.querySelector('.seconds-slider');
        const minutesValue = configOverlay.querySelector('.minutes-value');
        const secondsValue = configOverlay.querySelector('.seconds-value');
        const presetTime = configOverlay.querySelector('.preset-time');
        
        if (minutesSlider && secondsSlider) {
            minutesSlider.value = timer.initialMinutes;
            secondsSlider.value = timer.initialSeconds;
            
            if (minutesValue) minutesValue.textContent = timer.initialMinutes;
            if (secondsValue) secondsValue.textContent = timer.initialSeconds;
            if (presetTime) {
                const mins = timer.initialMinutes.toString().padStart(2, '0');
                const secs = timer.initialSeconds.toString().padStart(2, '0');
                presetTime.textContent = `${mins}:${secs}`;
            }
            
            // Setup slider listeners
            minutesSlider.addEventListener('input', () => {
                if (minutesValue) minutesValue.textContent = minutesSlider.value;
                this.updatePresetTimeDisplay(configOverlay);
            });
            
            secondsSlider.addEventListener('input', () => {
                if (secondsValue) secondsValue.textContent = secondsSlider.value;
                this.updatePresetTimeDisplay(configOverlay);
            });
        }
        
        // Setup close button
        const closeBtn = configOverlay.querySelector('.close-timer-config');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Save changes before closing
                if (minutesSlider && secondsSlider) {
                    const newMinutes = parseInt(minutesSlider.value);
                    const newSeconds = parseInt(secondsSlider.value);
                    
                    timer.initialMinutes = newMinutes;
                    timer.initialSeconds = newSeconds;
                    
                    // If timer is not running, update current time too
                    if (!timer.isRunning) {
                        if (timer.isStopwatch) {
                            timer.currentMinutes = 0;
                            timer.currentSeconds = 0;
                        } else {
                            timer.currentMinutes = newMinutes;
                            timer.currentSeconds = newSeconds;
                        }
                    }
                    
                    // Regenerate alerts
                    timer.alerts = this.getDefaultAlerts(newMinutes, newSeconds);
                    timer.alertsTriggered.clear();
                    
                    // Update UI
                    this.updateTimerUI(timer);
                }
                
                configOverlay.style.display = 'none';
            });
        }
        
        // Show overlay
        configOverlay.style.display = 'flex';
    }
    
    updatePresetTimeDisplay(configOverlay) {
        const minutesSlider = configOverlay.querySelector('.minutes-slider');
        const secondsSlider = configOverlay.querySelector('.seconds-slider');
        const presetTime = configOverlay.querySelector('.preset-time');
        
        if (minutesSlider && secondsSlider && presetTime) {
            const mins = minutesSlider.value.toString().padStart(2, '0');
            const secs = secondsSlider.value.toString().padStart(2, '0');
            presetTime.textContent = `${mins}:${secs}`;
        }
    }
} 