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
        
        // Wake lock and visibility handling
        this.wakeLock = null;
        this.isWakeLockSupported = 'wakeLock' in navigator;
        this.visibilityChangeHandler = null;
        
        // Fallback methods for unsupported browsers
        this.videoElement = null;
        this.noSleepEnabled = false;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        // Load saved timers state
        this.loadTimersState();
        
        // Setup wake lock and visibility handling
        this.setupWakeLockAndVisibility();
        
        // Make globally available
        window.globalTimerManager = this;
        
        // Setup periodic sync for running timers
        this.setupPeriodicSync();
    }
    
    setup() {
        if (this.isSetup) return;
        
        this.setupAudio();
        this.isSetup = true;
    }

    setupWakeLockAndVisibility() {
        // Setup visibility change handler to prevent timer drift
        this.visibilityChangeHandler = () => {
            if (document.visibilityState === 'visible') {
                // Page became visible again, sync all running timers
                this.syncAllRunningTimers();
            }
        };
        
        document.addEventListener('visibilitychange', this.visibilityChangeHandler);
        
        // Setup navigation sync for module switching
        this.setupNavigationSync();
        
        // Setup page unload handler to release wake lock
        window.addEventListener('beforeunload', () => {
            this.releaseWakeLock();
        });
        
        // Setup page hide handler for mobile browsers
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Page is hidden, but don't release wake lock
                // Wake lock should persist across visibility changes
                console.log('Page hidden, maintaining wake lock');
            }
        });
    }

    setupNavigationSync() {
        // Sync timers when entering timer module
        this.navigationSyncHandler = () => {
            // Check if we're in the timer module
            const timerTab = document.getElementById('timer-tab');
            if (timerTab && timerTab.style.display !== 'none') {
                // We're in timer module, sync all running timers
                this.syncAllRunningTimers();
                
                // Update UI for all timers
                this.timers.forEach(timer => {
                    this.updateTimerUI(timer);
                });
            }
        };
        
        // Listen for navigation events (if using hash routing)
        window.addEventListener('hashchange', this.navigationSyncHandler);
        
        // Listen for custom navigation events (if using custom router)
        document.addEventListener('moduleChanged', this.navigationSyncHandler);
        
        // Setup MutationObserver to detect when timer module becomes visible
        if (typeof MutationObserver !== 'undefined') {
            this.moduleObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const timerTab = document.getElementById('timer-tab');
                        if (timerTab && timerTab.style.display !== 'none') {
                            // Timer module became visible, sync timers
                            setTimeout(() => {
                                this.syncAllRunningTimers();
                            }, 100); // Small delay to ensure DOM is ready
                        }
                    }
                });
            });
            
            // Observe the timer tab for style changes
            const timerTab = document.getElementById('timer-tab');
            if (timerTab) {
                this.moduleObserver.observe(timerTab, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            }
        }
    }

    async requestWakeLock() {
        // Try native Wake Lock API first
        if (this.isWakeLockSupported && !this.wakeLock) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock activated - screen will stay on');
                
                // Show visual indicator
                this.showWakeLockIndicator(true);
                
                // Handle wake lock release (e.g., when user switches tabs)
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake lock released');
                    this.wakeLock = null;
                    this.showWakeLockIndicator(false);
                });
                
                return; // Success, no need for fallback
            } catch (err) {
                console.warn('Native wake lock failed, trying fallback:', err);
            }
        }
        
        // Fallback for unsupported browsers (especially iOS Safari)
        if (!this.noSleepEnabled) {
            this.enableNoSleepFallback();
        }
    }

    async releaseWakeLock() {
        // Release native wake lock
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Wake lock released manually');
                this.showWakeLockIndicator(false);
            } catch (err) {
                console.warn('Could not release wake lock:', err);
            }
        }
        
        // Release fallback
        if (this.noSleepEnabled) {
            this.disableNoSleepFallback();
        }
    }

    enableNoSleepFallback() {
        console.log('Enabling NoSleep fallback for unsupported browser');
        
        try {
            // Create invisible video element (iOS Safari fallback)
            if (this.isIOS && !this.videoElement) {
                this.videoElement = document.createElement('video');
                this.videoElement.setAttribute('muted', '');
                this.videoElement.setAttribute('playsinline', '');
                this.videoElement.setAttribute('loop', '');
                this.videoElement.style.position = 'fixed';
                this.videoElement.style.top = '-1000px';
                this.videoElement.style.left = '-1000px';
                this.videoElement.style.width = '1px';
                this.videoElement.style.height = '1px';
                this.videoElement.style.opacity = '0';
                this.videoElement.style.pointerEvents = 'none';
                
                // Create a minimal video data URL
                this.videoElement.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzFhdmMxAAABKGZyZWUAAAGfbWRhdAAACoAAAKoAAACgAAAKgAAAqgAAAKAAAAqAAAABn21kYXQAAAqAAAABn21kYXQAAAqAAAABn21kYXQ=';
                
                document.body.appendChild(this.videoElement);
                
                // Play the video
                this.videoElement.play().catch(err => {
                    console.warn('Could not play fallback video:', err);
                });
            }
            
            // Alternative: Keep screen active with periodic invisible operations
            this.keepAliveInterval = setInterval(() => {
                // Trigger a minimal DOM operation to keep page active
                document.body.style.zIndex = document.body.style.zIndex === '1' ? '0' : '1';
            }, 15000); // Every 15 seconds
            
            this.noSleepEnabled = true;
            console.log('NoSleep fallback enabled');
            
            // Show indicator for fallback method
            this.showWakeLockIndicator(true);
            
        } catch (err) {
            console.warn('Could not enable NoSleep fallback:', err);
        }
    }

    disableNoSleepFallback() {
        console.log('Disabling NoSleep fallback');
        
        // Remove video element
        if (this.videoElement) {
            this.videoElement.pause();
            if (this.videoElement.parentNode) {
                this.videoElement.parentNode.removeChild(this.videoElement);
            }
            this.videoElement = null;
        }
        
        // Clear keep alive interval
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
        
        this.noSleepEnabled = false;
        console.log('NoSleep fallback disabled');
        
        this.showWakeLockIndicator(false);
    }

    checkWakeLockStatus() {
        const hasRunningTimers = this.timers.some(timer => timer.isRunning);
        
        if (hasRunningTimers && !this.wakeLock && !this.noSleepEnabled) {
            // Request wake lock when timers are running
            this.requestWakeLock();
        } else if (!hasRunningTimers && (this.wakeLock || this.noSleepEnabled)) {
            // Release wake lock when no timers are running
            this.releaseWakeLock();
        }
    }

    syncAllRunningTimers() {
        // Sync all running timers to prevent drift after visibility change
        this.timers.forEach(timer => {
            if (timer.isRunning && timer.startTime) {
                this.syncTimer(timer);
            }
        });
    }

    syncTimer(timer) {
        // Calculate how much time should have passed since start
        const now = Date.now();
        const elapsedMs = now - timer.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        if (timer.isStopwatch) {
            // For stopwatch, add elapsed time
            const totalElapsed = timer.startingCurrentSeconds + elapsedSeconds;
            timer.currentMinutes = Math.floor(totalElapsed / 60);
            timer.currentSeconds = totalElapsed % 60;
        } else {
            // For countdown, subtract elapsed time
            const totalRemaining = timer.startingCurrentSeconds - elapsedSeconds;
            if (totalRemaining <= 0) {
                // Timer finished
                timer.currentMinutes = 0;
                timer.currentSeconds = 0;
                timer.isRunning = false;
                timer.isFinished = true;
                
                // Clear interval
                if (this.intervals.has(timer.id)) {
                    clearInterval(this.intervals.get(timer.id));
                    this.intervals.delete(timer.id);
                }
                
                // Play finish sound
                if (timer.bellEnabled) {
                    this.playBell(2);
                }
            } else {
                timer.currentMinutes = Math.floor(totalRemaining / 60);
                timer.currentSeconds = totalRemaining % 60;
            }
        }
        
        // Update UI
        this.updateTimerUI(timer);
    }

    // Method to be called by the router when switching to timer module
    onModuleEnter() {
        console.log('Timer module entered - syncing timers');
        this.syncAllRunningTimers();
        
        // Update UI for all timers
        this.timers.forEach(timer => {
            this.updateTimerUI(timer);
        });
        
        // Re-render timers if needed
        if (this.timers.length > 0) {
            this.renderAllTimers();
        }
    }

    // Method to be called by the router when leaving timer module
    onModuleExit() {
        console.log('Timer module exited - timers continue running in background');
        // Timers continue running, no need to stop them
        // Wake lock remains active if timers are running
    }

    setupPeriodicSync() {
        // Sync running timers every 30 seconds to prevent drift
        this.syncInterval = setInterval(() => {
            const hasRunningTimers = this.timers.some(timer => timer.isRunning);
            if (hasRunningTimers) {
                this.syncAllRunningTimers();
            }
        }, 30000); // 30 seconds
    }

    // Method to force sync all timers (can be called externally)
    forceSyncAllTimers() {
        console.log('Force syncing all running timers');
        this.syncAllRunningTimers();
        
        // Update UI if we're in timer module
        const timerTab = document.getElementById('timer-tab');
        if (timerTab && !timerTab.classList.contains('hidden')) {
            this.timers.forEach(timer => {
                this.updateTimerUI(timer);
            });
        }
    }

    // Method to check wake lock compatibility and status
    getWakeLockStatus() {
        return {
            nativeSupported: this.isWakeLockSupported,
            nativeActive: !!this.wakeLock,
            fallbackActive: this.noSleepEnabled,
            isIOS: this.isIOS,
            isSafari: this.isSafari,
            hasRunningTimers: this.timers.some(timer => timer.isRunning),
            method: this.wakeLock ? 'Wake Lock API' : 
                   this.noSleepEnabled ? (this.isIOS ? 'iOS Keep-Alive' : 'Browser Keep-Alive') : 
                   'Inactive'
        };
    }

    showWakeLockIndicator(isActive) {
        // Remove existing indicator
        const existingIndicator = document.querySelector('.wake-lock-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (isActive) {
            // Determine which method is being used
            let method = 'Wake Lock API';
            let icon = '🔒';
            
            if (this.noSleepEnabled && !this.wakeLock) {
                if (this.isIOS) {
                    method = 'iOS Keep-Alive';
                    icon = '📱';
                } else {
                    method = 'Browser Keep-Alive';
                    icon = '💻';
                }
            }
            
            // Create and show indicator
            const indicator = document.createElement('div');
            indicator.className = 'wake-lock-indicator';
            indicator.innerHTML = `
                <div class="wake-lock-content">
                    <span class="wake-lock-icon">${icon}</span>
                    <span class="wake-lock-text">Pantalla activa (${method})</span>
                </div>
            `;
            
            // Add styles if not already present
            if (!document.querySelector('#wake-lock-styles')) {
                const styles = document.createElement('style');
                styles.id = 'wake-lock-styles';
                styles.textContent = `
                    .wake-lock-indicator {
                        position: fixed;
                        top: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 500;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        z-index: 10000;
                        animation: slideDown 0.3s ease;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    
                    .wake-lock-content {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    
                    .wake-lock-icon {
                        font-size: 14px;
                    }
                    
                    @keyframes slideDown {
                        from {
                            transform: translateX(-50%) translateY(-100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(-50%) translateY(0);
                            opacity: 1;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .wake-lock-indicator {
                            top: 5px;
                            left: 5px;
                            right: 5px;
                            transform: none;
                            text-align: center;
                        }
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(indicator);
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.style.animation = 'slideDown 0.3s ease reverse';
                    setTimeout(() => {
                        if (indicator.parentNode) {
                            indicator.remove();
                        }
                    }, 300);
                }
            }, 3000);
        }
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
        if (totalSeconds < 150) return []; // Solo para timers de más de 2.5 minutos
        
        // Las alarmas por defecto están configuradas para modo DSC (countdown)
        // En DSC, las alarmas se basan en tiempo transcurrido desde el inicio
        return [
            // 1 minuto transcurrido (cuando han pasado 60 segundos)
            { minutes: 1, seconds: 0, type: 'single' },
            // Falta 1 minuto (cuando han transcurrido totalSeconds - 60)
            { minutes: Math.floor((totalSeconds - 60) / 60), seconds: (totalSeconds - 60) % 60, type: 'single' },
            // Al terminar (cuando han transcurrido totalSeconds)
            { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60, type: 'double' }
        ];
    }
    
    startTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        timer.isRunning = true;
        timer.isPaused = false;
        timer.isFinished = false;
        
        // Record start time and current state for sync purposes
        timer.startTime = Date.now();
        timer.startingCurrentSeconds = timer.currentMinutes * 60 + timer.currentSeconds;
        
        // Clear existing interval
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
        }
        
        // Request wake lock to prevent screen sleep
        this.checkWakeLockStatus();
        
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
        
        // Check if we should release wake lock
        this.checkWakeLockStatus();
        
        this.updateTimerUI(timer);
    }
    
    resetTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        timer.isRunning = false;
        timer.isPaused = false;
        timer.isFinished = false;
        timer.alertsTriggered.clear();
        
        // Clear timing data
        timer.startTime = null;
        timer.startingCurrentSeconds = null;
        
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
        
        // Check if we should release wake lock
        this.checkWakeLockStatus();
        
        this.updateTimerUI(timer);
    }
    
    toggleTimerMode(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;
        
        // Stop if running
        if (timer.isRunning) {
            this.pauseTimer(timerId);
        }
        
        // Store current mode before changing
        const wasStopwatch = timer.isStopwatch;
        
        // Toggle mode
        timer.isStopwatch = !timer.isStopwatch;
        
        // Convert alerts to maintain the same temporal point
        this.convertAlertsForModeChange(timer, wasStopwatch);
        
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
        
        // Update any open configuration overlay
        this.updateConfigOverlayForModeChange(timerId);
    }
    
    checkAlerts(timer) {
        if (!timer.bellEnabled || !timer.alerts) return;
        
        // Calculate elapsed time in seconds
        const elapsedSeconds = timer.isStopwatch 
            ? timer.currentMinutes * 60 + timer.currentSeconds  // ASC: current time is elapsed time
            : (timer.initialMinutes * 60 + timer.initialSeconds) - (timer.currentMinutes * 60 + timer.currentSeconds); // DSC: elapsed = total - current
        
        timer.alerts.forEach(alert => {
            const alertTimeInSeconds = alert.minutes * 60 + alert.seconds;
            const alertKey = `${alertTimeInSeconds}-${alert.type}`;
            
            // Check if the alert should trigger at this elapsed time
            if (elapsedSeconds === alertTimeInSeconds && !timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                
                const bellCount = {
                    'single': 1,
                    'double': 2,
                    'triple': 3,
                    'finish': 5
                }[alert.type] || 1;
                
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
        
        // Fullscreen button
        const fullscreenBtn = cardElement.querySelector('.fullscreen-timer-compact');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isFullscreen = cardElement.classList.contains('fullscreen');
                const isBrowserFullscreen = document.fullscreenElement || 
                                          document.webkitFullscreenElement || 
                                          document.mozFullScreenElement ||
                                          document.msFullscreenElement;
                
                if (!isFullscreen && !isBrowserFullscreen) {
                    // Activar pantalla completa
                    try {
                        // Primero aplicar el estilo CSS fullscreen
                        document.querySelectorAll('.timer-card-compact').forEach(card => {
                            card.classList.remove('fullscreen');
                        });
                        cardElement.classList.add('fullscreen');
                        
                        // Luego intentar activar fullscreen del navegador
                        if (cardElement.requestFullscreen) {
                            await cardElement.requestFullscreen();
                        } else if (cardElement.webkitRequestFullscreen) {
                            await cardElement.webkitRequestFullscreen();
                        } else if (cardElement.mozRequestFullScreen) {
                            await cardElement.mozRequestFullScreen();
                        } else if (cardElement.msRequestFullscreen) {
                            await cardElement.msRequestFullscreen();
                        }
                        
                        fullscreenBtn.textContent = '⛶';
                        fullscreenBtn.title = 'Salir de pantalla completa (Esc)';
                        
                    } catch (error) {
                        console.log('Fullscreen API not available, using CSS fallback');
                        fullscreenBtn.textContent = '⛶';
                        fullscreenBtn.title = 'Salir de pantalla completa (Esc)';
                    }
                    
                    // Escuchar la tecla Escape
                    const handleEscape = (e) => {
                        if (e.key === 'Escape') {
                            this.exitFullscreen(cardElement, fullscreenBtn);
                            document.removeEventListener('keydown', handleEscape);
                        }
                    };
                    document.addEventListener('keydown', handleEscape);
                    
                    // Escuchar cambios en el estado de fullscreen del navegador
                    const handleFullscreenChange = () => {
                        const isStillFullscreen = document.fullscreenElement || 
                                                document.webkitFullscreenElement || 
                                                document.mozFullScreenElement ||
                                                document.msFullscreenElement;
                        
                        if (!isStillFullscreen) {
                            this.exitFullscreen(cardElement, fullscreenBtn);
                            document.removeEventListener('fullscreenchange', handleFullscreenChange);
                            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
                            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
                            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
                        }
                    };
                    
                    document.addEventListener('fullscreenchange', handleFullscreenChange);
                    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
                    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
                    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
                    
                } else {
                    // Desactivar pantalla completa
                    this.exitFullscreen(cardElement, fullscreenBtn);
                }
            });
        }
        
        // Floating window button
        const floatingBtn = cardElement.querySelector('.floating-timer-compact');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const timerId = timer.id;
                
                if (window.timerFloating && window.timerFloating.hasFloatingWindow(timerId)) {
                    // Close existing floating window
                    window.timerFloating.closeFloatingWindow(timerId);
                } else if (window.timerFloating) {
                    // Create new floating window
                    window.timerFloating.createFloatingWindow(timerId, cardElement, timer);
                }
            });
        }
        
        // Picture-in-Picture button
        const pipBtn = cardElement.querySelector('.pip-timer-compact');
        if (pipBtn) {
            pipBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const timerId = timer.id;
                
                // Check if Picture-in-Picture is supported
                if (!('documentPictureInPicture' in window) && !('pictureInPictureEnabled' in document)) {
                    this.showPiPNotSupportedMessage();
                    return;
                }
                
                if (window.timerFloating && window.timerFloating.hasFloatingWindow(timerId)) {
                    // Close existing PiP window
                    window.timerFloating.closeFloatingWindow(timerId);
                    pipBtn.classList.remove('active');
                } else if (window.timerFloating) {
                    // Create new Picture-in-Picture window
                    try {
                        await window.timerFloating.createFloatingWindow(timerId, cardElement, timer);
                        pipBtn.classList.add('active');
                        
                        // Update button state when PiP window closes
                        const checkPiPStatus = () => {
                            if (!window.timerFloating.hasFloatingWindow(timerId)) {
                                pipBtn.classList.remove('active');
                            } else {
                                setTimeout(checkPiPStatus, 1000);
                            }
                        };
                        setTimeout(checkPiPStatus, 1000);
                        
                    } catch (error) {
                        console.error('Failed to create Picture-in-Picture window:', error);
                        this.showPiPErrorMessage();
                    }
                }
            });
        }
        
        // Name editing
        const nameElement = cardElement.querySelector('.timer-name-compact');
        if (nameElement) {
            nameElement.addEventListener('blur', (e) => {
                const newName = e.target.textContent.trim();
                if (newName) {
                    timer.name = newName;
                    this.saveTimersState();
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
        
        // Remove button
        const removeBtn = cardElement.querySelector('.remove-timer-compact');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close floating window if it exists
            if (window.timerFloating && window.timerFloating.hasFloatingWindow(timer.id)) {
                window.timerFloating.closeFloatingWindow(timer.id);
            }
            
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
        
        // Check if we should release wake lock
        this.checkWakeLockStatus();
        
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
        
        // Reset to DSC mode (countdown) - default mode for quick presets
        timer.isStopwatch = false;
        
        // Regenerate alerts for new time (configured for DSC mode)
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
            
            // Setup slider listeners with debouncing
            let updateTimeout;
            const updateVisualDisplay = () => {
                const minutes = parseInt(minutesSlider.value);
                const seconds = parseInt(secondsSlider.value);
                const minutesStr = minutes.toString().padStart(2, '0');
                const secondsStr = seconds.toString().padStart(2, '0');
                
                if (presetTime) presetTime.textContent = `${minutesStr}:${secondsStr}`;
                if (minutesValue) minutesValue.textContent = minutes;
                if (secondsValue) secondsValue.textContent = seconds;
                
                // Update timeline labels based on timer mode
                const timelineStart = configOverlay.querySelector('.timeline-start');
                const timelineEnd = configOverlay.querySelector('.timeline-end');
                
                if (timelineStart && timelineEnd) {
                    if (timer.isStopwatch) {
                        // ASC: 0:00 at start, total time at end
                        timelineStart.textContent = '0:00';
                        timelineEnd.textContent = `${minutesStr}:${secondsStr}`;
                    } else {
                        // DSC: total time at start, 0:00 at end
                        timelineStart.textContent = `${minutesStr}:${secondsStr}`;
                        timelineEnd.textContent = '0:00';
                    }
                }
            };
            
            const saveTimeSettings = () => {
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
                    
                // Update timeline for new duration
                this.updateTimelineForNewDuration(configOverlay, timerId, newMinutes * 60 + newSeconds);
                    
                    // Update UI
                    this.updateTimerUI(timer);
                this.saveTimersState();
            };
            
            // Update visual display in real-time
            minutesSlider.addEventListener('input', updateVisualDisplay);
            secondsSlider.addEventListener('input', updateVisualDisplay);
            
            // Save settings when slider is released
            minutesSlider.addEventListener('change', saveTimeSettings);
            secondsSlider.addEventListener('change', saveTimeSettings);
        }
        
        // Initialize timeline system
        this.initializeTimeline(configOverlay, timer);
        this.setupQuickActions(configOverlay, timerId);
        this.setupTimelineDragAndDrop(configOverlay, timerId);
        this.loadBellsToTimeline(configOverlay, timerId);
        
        // Setup close button
        const closeBtn = configOverlay.querySelector('.close-timer-config');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Auto-save bell configuration before closing
                this.autoSaveTimeline(configOverlay, timerId);
                configOverlay.style.display = 'none';
            });
        }
        
        // Escape key support
        const handleEscape = (e) => {
            if (e.key === 'Escape' && configOverlay.style.display === 'flex') {
                this.autoSaveTimeline(configOverlay, timerId);
                configOverlay.style.display = 'none';
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Close overlay when clicking outside
        configOverlay.addEventListener('click', (e) => {
            if (e.target === configOverlay) {
                this.autoSaveTimeline(configOverlay, timerId);
                configOverlay.style.display = 'none';
                document.removeEventListener('keydown', handleEscape);
            }
        });
        
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

    exitFullscreen(cardElement, fullscreenBtn) {
        // Salir del fullscreen del navegador
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        // Remover clase CSS
        cardElement.classList.remove('fullscreen');
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = 'Pantalla completa';
    }

    showPiPNotSupportedMessage() {
        const message = document.createElement('div');
        message.className = 'pip-message pip-not-supported';
        message.innerHTML = `
            <div class="pip-message-content">
                <div class="pip-message-icon">❌</div>
                <div class="pip-message-text">
                    <strong>Picture-in-Picture no soportado</strong><br>
                    Tu navegador no soporta la función Picture-in-Picture.<br>
                    Usa Chrome 116+ o prueba el botón flotante 📌
                </div>
                <button class="pip-message-close">×</button>
            </div>
        `;
        
        this.showPiPMessage(message);
    }

    showPiPErrorMessage() {
        const message = document.createElement('div');
        message.className = 'pip-message pip-error';
        message.innerHTML = `
            <div class="pip-message-content">
                <div class="pip-message-icon">⚠️</div>
                <div class="pip-message-text">
                    <strong>Error al abrir Picture-in-Picture</strong><br>
                    No se pudo abrir la ventana Picture-in-Picture.<br>
                    Prueba el botón flotante 📌 como alternativa
                </div>
                <button class="pip-message-close">×</button>
            </div>
        `;
        
        this.showPiPMessage(message);
    }

    showPiPMessage(message) {
        // Add message styles if not already present
        if (!document.querySelector('#pip-message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pip-message-styles';
            styles.textContent = `
                .pip-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    max-width: 350px;
                    animation: slideInRight 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .pip-message.pip-error {
                    background: linear-gradient(135deg, #ff6b6b, #ffa500);
                }

                .pip-message.pip-not-supported {
                    background: linear-gradient(135deg, #ff6b6b, #e74c3c);
                }

                .pip-message-content {
                    padding: 20px;
                    display: flex;
                    gap: 15px;
                    align-items: flex-start;
                    position: relative;
                }

                .pip-message-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .pip-message-text {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .pip-message-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .pip-message-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @media (max-width: 480px) {
                    .pip-message {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 300);
            }
        }, 5000);

        // Close button functionality
        const closeBtn = message.querySelector('.pip-message-close');
        closeBtn.addEventListener('click', () => {
            message.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        });
    }

    // Timeline System Methods
    initializeTimeline(overlay, timer) {
        // Update timeline labels based on timer mode
        const timelineStart = overlay.querySelector('.timeline-start');
        const timelineEnd = overlay.querySelector('.timeline-end');
        if (timelineStart && timelineEnd) {
            const totalMinutes = timer.initialMinutes;
            const totalSeconds = timer.initialSeconds;
            const displayMinutes = totalMinutes.toString().padStart(2, '0');
            const displaySeconds = totalSeconds.toString().padStart(2, '0');
            
            if (timer.isStopwatch) {
                // ASC: 0:00 at start, total time at end
                timelineStart.textContent = '0:00';
                timelineEnd.textContent = `${displayMinutes}:${displaySeconds}`;
            } else {
                // DSC: show progress of countdown (start → end)
                timelineStart.textContent = '0:00';
                timelineEnd.textContent = `${displayMinutes}:${displaySeconds}`;
            }
        }

        // Create time markers
        this.createTimeMarkers(overlay, timer);
    }

    createTimeMarkers(overlay, timer) {
        const markersContainer = overlay.querySelector('.timeline-markers');
        if (!markersContainer) return;

        markersContainer.innerHTML = '';
        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        const markerCount = Math.min(10, Math.max(3, Math.floor(totalSeconds / 30)));

        for (let i = 0; i <= markerCount; i++) {
            const marker = document.createElement('div');
            marker.className = 'time-marker';
            markersContainer.appendChild(marker);
        }
    }

    setupQuickActions(overlay, timerId) {
        // Store reference to avoid multiple calls
        if (!overlay._quickActionsSetup) {
            overlay._quickActionsSetup = true;
        } else {
            // If already setup, just remove existing listeners
            const addBellBtns = overlay.querySelectorAll('.add-bell-btn');
            addBellBtns.forEach(btn => {
                btn.removeEventListener('click', btn._bellClickHandler);
            });

            const deleteBtn = overlay.querySelector('.delete-bell-btn');
            if (deleteBtn) {
                deleteBtn.removeEventListener('click', deleteBtn._deleteClickHandler);
            }

            const testBtn = overlay.querySelector('.test-bells-btn');
            if (testBtn) {
                testBtn.removeEventListener('click', testBtn._testClickHandler);
            }
        }

        // Add fresh event listeners
        const addBellBtns = overlay.querySelectorAll('.add-bell-btn');
        addBellBtns.forEach(btn => {
            btn._bellClickHandler = () => {
                const soundType = btn.getAttribute('data-sound');
                this.addBellToTimeline(overlay, timerId, soundType);
            };
            btn.addEventListener('click', btn._bellClickHandler);
        });

        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn._deleteClickHandler = () => {
                if (!deleteBtn.classList.contains('disabled')) {
                    this.deleteSelectedBell(overlay, timerId);
                }
            };
            deleteBtn.addEventListener('click', deleteBtn._deleteClickHandler);
        }

        const testBtn = overlay.querySelector('.test-bells-btn');
        if (testBtn) {
            testBtn._testClickHandler = () => {
                this.playBell(2);
            };
            testBtn.addEventListener('click', testBtn._testClickHandler);
        }
    }

    addBellToTimeline(overlay, timerId, soundType) {
        const timer = this.getTimer(timerId);
        if (!timer) return;

        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        
        // Default position: middle of timeline
        const defaultTime = Math.floor(totalSeconds / 2);
        
        // Create bell dot
        const bellDot = this.createBellDot(overlay, timerId, defaultTime, soundType);
        
        // Auto-save the timeline
        this.autoSaveTimeline(overlay, timerId);
        
        // Select the newly created bell
        this.selectBellDot(bellDot, overlay, timerId);
    }

    createBellDot(overlay, timerId, timeInSeconds, soundType, alert = null) {
        const timer = this.getTimer(timerId);
        if (!timer) return null;

        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return null;

        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        
        // Calculate position percentage
        // timeInSeconds always represents elapsed time (time transcurrido)
        let leftPercent;
        if (timer.isStopwatch) {
            // ASC: position directly maps to elapsed time (0 at left, max at right)
            // Timeline: 0:00 (left) → 07:15 (right)
            leftPercent = (timeInSeconds / totalSeconds) * 100;
        } else {
            // DSC: timeline shows countdown progress (07:15 left → 0:00 right)
            // But alarms are positioned by elapsed time
            // So we need to invert: more elapsed time = further right
            leftPercent = (timeInSeconds / totalSeconds) * 100;
        }
        
        // Create bell dot element
        const bellDot = document.createElement('div');
        bellDot.className = `bell-dot ${soundType}-bell`;
        bellDot.style.left = `${leftPercent}%`;
        bellDot.setAttribute('data-time', timeInSeconds);
        bellDot.setAttribute('data-sound', soundType);
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'bell-tooltip';
        tooltip.textContent = this.generateBellTooltip(timeInSeconds, timer, soundType);
        bellDot.appendChild(tooltip);
        
        // Add to timeline
        timeline.appendChild(bellDot);
        
        // Setup event listeners
        this.setupBellDotListeners(bellDot, overlay, timerId);
        
        return bellDot;
    }

    generateBellTooltip(timeInSeconds, timer, soundType) {
        const soundLabels = {
            'single': '1 ding',
            'double': '2 dings',
            'triple': '3 dings',
            'finish': '5 dings'
        };
        
        const soundLabel = soundLabels[soundType] || '1 ding';
        
        if (timer.isStopwatch) {
            // ASC: timeInSeconds is elapsed time - show "A los X:XX"
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            return `A los ${timeStr} - ${soundLabel}`;
        } else {
            // DSC: timeInSeconds is elapsed time - show when it triggers
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            return `A los ${timeStr} - ${soundLabel}`;
        }
    }

    setupBellDotListeners(bellDot, overlay, timerId) {
        const timer = this.getTimer(timerId);
        if (!timer) return;

        let isDragging = false;
        let startX, startLeft, timelineRect;
        let animationFrameId = null;
        let pendingUpdate = null;

        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;

        const handleMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Select this bell dot
            this.selectBellDot(bellDot, overlay, timerId);
            
            if (e.detail === 2) {
                // Double click - cycle bell type
                this.cycleBellType(bellDot, overlay, timerId);
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startLeft = parseFloat(bellDot.style.left);
            timelineRect = overlay.querySelector('.bell-timeline').getBoundingClientRect();
            
            bellDot.classList.add('dragging');
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            // Cancel previous animation frame if pending
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // Store the latest mouse position
            pendingUpdate = {
                clientX: e.clientX
            };

            // Use requestAnimationFrame for smooth updates
            animationFrameId = requestAnimationFrame(() => {
                if (!pendingUpdate || !isDragging) return;

                const deltaX = pendingUpdate.clientX - startX;
                const deltaPercent = (deltaX / timelineRect.width) * 100;
                
                let newLeft = startLeft + deltaPercent;
                newLeft = Math.max(0, Math.min(100, newLeft));
                
                bellDot.style.left = `${newLeft}%`;
                
                // Update time and tooltip
                // For both modes, position maps to elapsed time (0 at left, max at right)
                let newTime = Math.round((newLeft / 100) * totalSeconds / 5) * 5;
                newTime = Math.max(0, Math.min(totalSeconds, newTime));
                
                bellDot.setAttribute('data-time', newTime);
                const tooltip = bellDot.querySelector('.bell-tooltip');
                if (tooltip) {
                    tooltip.textContent = this.generateBellTooltip(newTime, timer, bellDot.getAttribute('data-sound'));
                }

                animationFrameId = null;
                pendingUpdate = null;
            });
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            bellDot.classList.remove('dragging');
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Auto-save after drag
            this.autoSaveTimeline(overlay, timerId);
        };

        bellDot.addEventListener('mousedown', handleMouseDown);
    }

    cycleBellType(bellDot, overlay, timerId) {
        const currentType = bellDot.getAttribute('data-sound');
        const types = ['single', 'double', 'triple', 'finish'];
        const currentIndex = types.indexOf(currentType);
        const nextIndex = (currentIndex + 1) % types.length;
        const newType = types[nextIndex];
        
        this.changeBellType(bellDot, newType, overlay, timerId);
    }

    changeBellType(bellDot, newType, overlay, timerId) {
        const timer = this.getTimer(timerId);
        if (!timer) return;

        // Update attributes and classes
        bellDot.setAttribute('data-sound', newType);
        bellDot.className = `bell-dot ${newType}-bell`;
        
        // Add selected class if it was selected
        if (bellDot.classList.contains('selected')) {
            bellDot.classList.add('selected');
        }
        
        // Update tooltip
        const tooltip = bellDot.querySelector('.bell-tooltip');
        if (tooltip) {
            const timeInSeconds = parseInt(bellDot.getAttribute('data-time'));
            tooltip.textContent = this.generateBellTooltip(timeInSeconds, timer, newType);
        }
        
        // Auto-save
        this.autoSaveTimeline(overlay, timerId);
    }

    loadBellsToTimeline(overlay, timerId) {
        const timer = this.getTimer(timerId);
        if (!timer || !timer.alerts) return;

        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return;

        // Clear existing bell dots
        timeline.querySelectorAll('.bell-dot').forEach(dot => dot.remove());

        // Create bell dots for each alert with correct positioning
        timer.alerts.forEach(alert => {
            if (alert.minutes !== undefined && alert.seconds !== undefined && alert.type) {
                const timeInSeconds = alert.minutes * 60 + alert.seconds;
                this.createBellDot(overlay, timerId, timeInSeconds, alert.type, alert);
            }
        });
    }

    autoSaveTimeline(overlay, timerId) {
        const timer = this.getTimer(timerId);
        if (!timer) return;

        const bellDots = overlay.querySelectorAll('.bell-dot');
        
        const alerts = Array.from(bellDots)
            .map(dot => {
                const timeValue = parseInt(dot.getAttribute('data-time'));
                const soundAttr = dot.getAttribute('data-sound');
                
                if (isNaN(timeValue) || !soundAttr) return null;
                
                return {
                    minutes: Math.floor(timeValue / 60),
                    seconds: timeValue % 60,
                    type: soundAttr
                };
            })
            .filter(alert => alert !== null);

        // Sort by time (descending for countdown timers)
        alerts.sort((a, b) => {
            const aTime = a.minutes * 60 + a.seconds;
            const bTime = b.minutes * 60 + b.seconds;
            return bTime - aTime;
        });

        // Update timer alerts
        timer.alerts = alerts;
        timer.alertsTriggered.clear();
        
        // Save to localStorage
        this.saveTimersState();
    }

    generateTimelineAlertDescription(timeInSeconds, soundType) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const soundLabels = {
            'single': '1 campanada',
            'double': '2 campanadas',
            'triple': '3 campanadas',
            'finish': '5 campanadas'
        };
        
        return `${soundLabels[soundType] || '1 campanada'} a los ${timeStr}`;
    }

    selectBellDot(bellDot, overlay, timerId) {
        // Deselect all other bells
        this.deselectAllBells(overlay);
        
        // Select this bell
        bellDot.classList.add('selected');
        
        // Enable delete button
        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn.classList.remove('disabled');
        }
    }

    deselectAllBells(overlay) {
        const bellDots = overlay.querySelectorAll('.bell-dot');
        bellDots.forEach(dot => dot.classList.remove('selected'));
        
        // Disable delete button
        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn.classList.add('disabled');
        }
    }

    deleteSelectedBell(overlay, timerId) {
        const selectedBell = overlay.querySelector('.bell-dot.selected');
        if (!selectedBell) return;
        
        selectedBell.remove();
        this.autoSaveTimeline(overlay, timerId);
        
        // Disable delete button
        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn.classList.add('disabled');
        }
    }

    setupTimelineDragAndDrop(overlay, timerId) {
        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return;

        // Click on timeline area to deselect bells
        timeline.addEventListener('click', (e) => {
            if (e.target === timeline || e.target.classList.contains('timeline-track') || e.target.classList.contains('timeline-progress')) {
                this.deselectAllBells(overlay);
            }
        });
    }

    updateTimelineForNewDuration(overlay, timerId, newDurationInSeconds) {
        const timer = this.getTimer(timerId);
        if (!timer) return;

        // Update timeline labels
        this.initializeTimeline(overlay, timer);
        
        // Update existing bell positions
        this.updateExistingBellPositions(overlay, timerId, newDurationInSeconds);
        
        // Clean up invalid bells
        this.cleanupInvalidBellDots(overlay);
        
        // Auto-save
        this.autoSaveTimeline(overlay, timerId);
    }

    updateExistingBellPositions(overlay, timerId, newDurationInSeconds) {
        const timer = this.getTimer(timerId);
        if (!timer) return;

        const bellDots = overlay.querySelectorAll('.bell-dot');
        
        bellDots.forEach(bellDot => {
            const timeInSeconds = parseInt(bellDot.getAttribute('data-time'));
            
            if (timeInSeconds <= newDurationInSeconds) {
                // Recalculate position for new duration
                // timeInSeconds always represents elapsed time for both modes
                const leftPercent = (timeInSeconds / newDurationInSeconds) * 100;
                bellDot.style.left = `${leftPercent}%`;
                
                // Update tooltip
                const tooltip = bellDot.querySelector('.bell-tooltip');
                if (tooltip) {
                    tooltip.textContent = this.generateBellTooltip(timeInSeconds, timer, bellDot.getAttribute('data-sound'));
                }
            }
        });
    }

    cleanupInvalidBellDots(overlay) {
        const timer = this.getTimer(this.getCurrentTimerId(overlay));
        if (!timer) return;

        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        const bellDots = overlay.querySelectorAll('.bell-dot');
        
        bellDots.forEach(bellDot => {
            const timeInSeconds = parseInt(bellDot.getAttribute('data-time'));
            if (timeInSeconds > totalSeconds) {
                bellDot.remove();
            }
        });
    }

    getCurrentTimerId(overlay) {
        const cardElement = overlay.closest('.timer-card-compact');
        return cardElement ? cardElement.getAttribute('data-timer-id') : null;
    }

    convertAlertsForModeChange(timer, wasStopwatch) {
        // Convert alerts to maintain the same temporal point when changing modes
        // Since we unified the timeline, alerts always represent elapsed time
        // No conversion needed - alerts already represent elapsed time consistently
        
        // The alerts are already in the correct format (elapsed time)
        // Just ensure they're valid for the new mode
        const totalDurationMs = (timer.initialMinutes * 60 + timer.initialSeconds) * 1000;
        
        const validAlerts = [];
        for (const alert of timer.alerts) {
            const alertTimeMs = (alert.minutes * 60 + alert.seconds) * 1000;
            
            // Ensure the alert time is within bounds
            if (alertTimeMs >= 0 && alertTimeMs <= totalDurationMs) {
                validAlerts.push({
                    minutes: alert.minutes,
                    seconds: alert.seconds,
                    type: alert.type
                });
            }
        }
        
        timer.alerts = validAlerts;
    }

    updateConfigOverlayForModeChange(timerId) {
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (!cardElement) return;
        
        const configOverlay = cardElement.querySelector('.timer-config-overlay');
        if (!configOverlay || configOverlay.style.display !== 'flex') return;
        
        const timer = this.getTimer(timerId);
        if (!timer) return;
        
        // Update timeline labels and bell positions
        this.initializeTimeline(configOverlay, timer);
        this.loadBellsToTimeline(configOverlay, timerId);
    }

    // Save timers state to localStorage
    saveTimersState() {
        try {
            const timersData = this.timers.map(timer => ({
                id: timer.id,
                name: timer.name,
                initialMinutes: timer.initialMinutes,
                initialSeconds: timer.initialSeconds,
                currentMinutes: timer.currentMinutes,
                currentSeconds: timer.currentSeconds,
                isRunning: timer.isRunning,
                isPaused: timer.isPaused,
                isFinished: timer.isFinished,
                isStopwatch: timer.isStopwatch,
                alerts: timer.alerts,
                bellEnabled: timer.bellEnabled,
                startTime: timer.startTime,
                startingCurrentSeconds: timer.startingCurrentSeconds
            }));
            
            localStorage.setItem('globalTimers', JSON.stringify(timersData));
        } catch (error) {
            console.error('Failed to save timers state:', error);
        }
    }

    // Load timers state from localStorage
    loadTimersState() {
        try {
            const saved = localStorage.getItem('globalTimers');
            if (saved) {
                const timersData = JSON.parse(saved);
                timersData.forEach(timerData => {
                    const timer = {
                        ...timerData,
                        alertsTriggered: new Set()
                    };
                    
                    // If timer was running when saved, sync it
                    if (timer.isRunning && timer.startTime) {
                        // Sync the timer to current time
                        this.syncTimer(timer);
                        
                        // If timer is still running after sync, restart its interval
                        if (timer.isRunning) {
                            this.startTimer(timer.id);
                        }
                    }
                    
                    this.timers.push(timer);
                    if (timerData.id >= this.nextTimerId) {
                        this.nextTimerId = timerData.id + 1;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load timers state:', error);
        }
    }
} 

// Create and export singleton instance
const globalTimerManager = new GlobalTimerManager();
export { globalTimerManager };

// Make it available globally for backward compatibility
window.getGlobalTimerManager = () => globalTimerManager;

// Global function to force sync timers (useful for debugging or external calls)
window.syncTimers = () => {
    if (globalTimerManager) {
        globalTimerManager.forceSyncAllTimers();
        return 'Timers synchronized';
    }
    return 'Timer manager not available';
};

// Global function to check wake lock status (useful for debugging)
window.checkWakeLockStatus = () => {
    if (globalTimerManager) {
        const status = globalTimerManager.getWakeLockStatus();
        console.table(status);
        return status;
    }
    return 'Timer manager not available';
};