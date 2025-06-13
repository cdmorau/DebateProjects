import { timerView } from './timer.view.js';
import { translate } from '../../common/i18n.js';

class TimerManager {
    constructor() {
        this.timers = [];
        this.nextTimerId = 1;
        this.intervals = new Map();
        this.audioMuted = false;
        this.bellSounds = null;
        this.isInitialized = false;
        this.presets = {
            preptime: { 
                minutes: 15, 
                seconds: 0, 
                alerts: [
                    { at: 60, bells: 2 },  // Faltando 1 minuto
                    { at: 15, bells: 2 },  // Faltando 15 segundos
                    { at: 0, bells: 5 }    // Al terminar
                ]
            },
            bpspeech: { 
                minutes: 7, 
                seconds: 15, 
                alerts: [
                    { at: 345, bells: 1 }, // Al completar 1 minuto (quedan 6:15 = 375s)
                    { at: 60, bells: 2 },  // Faltando 1 minuto
                    { at: 15, bells: 2 },  // Faltando 15 segundos
                    { at: 0, bells: 5 }    // Al terminar
                ]
            },
            deliberation: { 
                minutes: 20, 
                seconds: 0, 
                alerts: [
                    { at: 60, bells: 2 },  // Faltando 1 minuto
                    { at: 15, bells: 2 },  // Faltando 15 segundos
                    { at: 0, bells: 5 }    // Al terminar
                ]
            },
            feedback: { 
                minutes: 15, 
                seconds: 0, 
                alerts: [
                    { at: 60, bells: 2 },  // Faltando 1 minuto
                    { at: 15, bells: 2 },  // Faltando 15 segundos
                    { at: 0, bells: 5 }    // Al terminar
                ]
            }
        };
    }

    init() {
        this.setupAudio();
        this.isInitialized = true;
    }

    setupAudio() {
        // Initialize bell audio file - using only bell-98033.mp3
        this.bellSounds = {
            main: new Audio('sounds/bell-98033.mp3')
        };
        
        // Configure audio file
        this.bellSounds.main.volume = 0.7;
        this.bellSounds.main.preload = 'auto';
        
        // Error handling for audio loading
        this.bellSounds.main.addEventListener('error', (e) => {
            this.setupFallbackAudio();
        });
    }

    setupFallbackAudio() {
        if (this.bellSounds.fallback) return;

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            this.bellSounds.fallback = {
                context: audioCtx,
                oscillator: oscillator,
                gainNode: gainNode
            };
        } catch (error) {
            // ... existing code ...
        }
    }

    playBell(count = 1) {
        if (this.audioMuted) {
            return;
        }

        // Always use the main bell sound (bell-98033.mp3)
        if (!this.bellSounds.main) {
            this.playFallbackSound();
            return;
        }

        // Play the bell sound multiple times based on count
        this.playMultipleBells(count);
    }

    playAudioFile(audioElement) {
        try {
            // Reset audio to beginning
            audioElement.currentTime = 0;
            
            // Play the sound
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    this.playFallbackSound();
                });
            }
        } catch (error) {
            this.playFallbackSound();
        }
    }

    playFallbackSound() {
        if (!this.bellSounds.fallback) {
            this.setupFallbackAudio();
        }

        try {
            const { context, oscillator, gainNode } = this.bellSounds.fallback;
            const now = context.currentTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            
        } catch (error) {
            // ... existing code ...
        }
    }

    playMultipleBells(count) {
        let bellIndex = 0;
        
        const playOneBell = () => {
            this.playAudioFile(this.bellSounds.main);
            
            bellIndex++;
            if (bellIndex < count) {
                setTimeout(playOneBell, 600); // 600ms between individual bells
            }
        };
        
        playOneBell();
    }

    toggleAudioMute() {
        this.audioMuted = !this.audioMuted;
        return this.audioMuted;
    }

    async testAudio() {
        if (this.audioMuted) {
            this.audioMuted = false;
        }
        
        // Play test sound
        this.playBell(2);
    }

    updateAudioUI() {
        const audioInitBtn = document.querySelector('.audio-init');
        const audioStatus = document.querySelector('.audio-status');
        const audioTestBtn = document.querySelector('.audio-test');
        const audioMuteBtn = document.querySelector('.audio-mute');
        
        const hasWorkingAudio = this.bellSounds && this.bellSounds.main;
        
        if (!hasWorkingAudio) {
            // Audio might not be optimal - show init button
            if (audioInitBtn) audioInitBtn.classList.remove('hidden');
            if (audioStatus) {
                audioStatus.classList.remove('hidden');
                audioStatus.textContent = translate('timer.audioOptimized');
            }
        } else {
            // Audio ready - hide init button and status
            if (audioInitBtn) audioInitBtn.classList.add('hidden');
            if (audioStatus) audioStatus.classList.add('hidden');
        }
        
        // Always keep test and mute buttons fully functional
        if (audioTestBtn) audioTestBtn.style.opacity = '1';
        if (audioMuteBtn) audioMuteBtn.style.opacity = '1';
    }

    toggleTimerBell(timerId, isEnabled) {
        const timer = this.getTimer(timerId);
        if (timer) {
            timer.bellEnabled = isEnabled;
            
            // Update timer view
            const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
            if (cardElement) {
                timerView.updateTimer(timer);
            }
            
            return isEnabled;
        }
        return false;
    }

    async initializeAudio() {
        try {
            if (!this.bellSounds.main) {
                this.setupAudio();
            }
            
            this.updateAudioUI();
            
            // Play a quick test sound to confirm audio is working
            if (this.bellSounds.main) {
                this.playBell(1);
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    getTimer(timerId) {
        return this.timers.find(timer => timer.id === timerId);
    }

    // Simple direct audio test
    directAudioTest() {
        // Create a new audio context specifically for this test
        let audioContext;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // If suspended, try to resume
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    this.playTestBeep(audioContext);
                }).catch(err => {
                    this.fallbackAudioTest();
                });
            } else {
                this.playTestBeep(audioContext);
            }
            
        } catch (error) {
            this.fallbackAudioTest();
        }
    }

    playTestBeep(audioContext) {
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Clear, audible bell sound
            oscillator.frequency.value = 1000; // High frequency for clarity
            oscillator.type = 'sine';
            
            // Envelope for bell-like sound
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.8, now + 0.01); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6); // Slow decay
            
            oscillator.start(now);
            oscillator.stop(now + 0.6);
            
            // Give feedback after the sound should have played
            setTimeout(() => {
                const heard = confirm(translate('timer.didYouHearDing'));
                if (heard) {
                    alert('¡Excelente! El audio funciona correctamente.');
                } else {
                    alert('El audio parece tener problemas. Puedes usar el sistema de audio optimizado haciendo clic en 🎵 o contactar soporte.');
                }
            }, 700);
            
        } catch (error) {
            this.fallbackAudioTest();
        }
    }

    fallbackAudioTest() {
        try {
            // Try speech synthesis as last resort
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance('Test de audio');
                utterance.rate = 0.8;
                utterance.pitch = 1.2;
                speechSynthesis.speak(utterance);
                
                setTimeout(() => {
                    alert('Audio de prueba completado. Si no escuchaste nada, por favor verifica tu configuración de audio.');
                }, 2000);
            } else {
                alert('No se pudo realizar la prueba de audio. Por favor verifica tu configuración de audio del navegador.');
            }
        } catch (speechError) {
            alert('El sistema de audio no está funcionando. Por favor verifica tu configuración de audio.');
        }
    }

    addTimer(name = null, minutes = 7, seconds = 15) {
        const timerId = this.nextTimerId++;
        const timerName = name || `Timer ${timerId}`;
        
        // New timers start in timer mode by default
        let isStopwatch = false;
        
        const timer = {
            id: timerId,
            name: timerName,
            initialMinutes: minutes,
            initialSeconds: seconds,
            currentMinutes: minutes,
            currentSeconds: seconds,
            isRunning: false,
            isPaused: false,
            isFinished: false,
            isStopwatch: isStopwatch,
            preset: null,
            alerts: this.getDefaultAlerts(minutes, seconds, false), // Default to DSC mode
            alertsTriggered: new Set(),
            bellEnabled: true
        };

        // If stopwatch mode, start from 0:00
        if (isStopwatch) {
            timer.currentMinutes = 0;
            timer.currentSeconds = 0;
        }

        this.timers.push(timer);
        timerView.renderTimer(timer);
        
        // Trigger global update event
        window.dispatchEvent(new CustomEvent('timerListChanged'));
        
        return timer;
    }

    removeTimer(timerId) {
        const timerIndex = this.timers.findIndex(t => t.id === timerId);
        if (timerIndex === -1) return;

        // Don't allow removing the last timer
        if (this.timers.length <= 1) return;

        // Clear interval if running
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
            this.intervals.delete(timerId);
        }

        // Remove from array
        this.timers.splice(timerIndex, 1);

        // Remove from DOM
        timerView.removeTimerFromDOM(timerId);
        
        // Trigger global update event
        window.dispatchEvent(new CustomEvent('timerListChanged'));
    }

    updateTimerName(timerId, newName) {
        const timer = this.timers.find(t => t.id === timerId);
        if (timer && newName.trim()) {
            timer.name = newName.trim();
        }
    }

    updateTimerSettings(timerId, minutes, seconds) {
        const timer = this.getTimer(timerId);
        if (timer) {
            timer.initialMinutes = minutes;
            timer.initialSeconds = seconds;
            
            // If timer is not running, update current values to new initial values
            if (!timer.isRunning) {
                if (timer.isStopwatch) {
                    // Stopwatch: keep current time if paused, reset to 0 if stopped
                    if (!timer.isPaused) {
                        timer.currentMinutes = 0;
                        timer.currentSeconds = 0;
                    }
                } else {
                    // Timer: update to new initial values
                    timer.currentMinutes = minutes;
                    timer.currentSeconds = seconds;
                }
            }
            
            // Always update default alerts when timer settings change
            // This ensures new default configuration is applied
            timer.alerts = this.getDefaultAlerts(minutes, seconds, timer.isStopwatch);
            timer.alertsTriggered.clear();
    
            
            // Update the display
            timerView.updateTimeDisplay(timerId, timer);
            
            // Dispatch event to notify of changes
            window.dispatchEvent(new CustomEvent('timerSettingsChanged', {
                detail: { timerId, minutes, seconds }
            }));
        }
    }

    getDefaultAlerts(minutes, seconds, isStopwatch = false) {
        const totalSeconds = minutes * 60 + seconds;
        const alerts = [];
        
        // No default alerts for timers shorter than 2:30
        if (totalSeconds < 150) { // Less than 2:30
            return alerts;
        }
        
        // Calculate correct positions based on timer mode
        if (isStopwatch) {
            // ASC Mode (Stopwatch)
            alerts.push({ 
                at: 60, // Bell at 1:00 elapsed
                soundType: 'single', 
                description: '1 minuto transcurrido'
            });
            
            alerts.push({ 
                at: totalSeconds - 60, // Bell 1 minute before target
                soundType: 'single', 
                description: 'Falta 1 minuto'
            });
            
            alerts.push({ 
                at: totalSeconds, // Bell when target reached
                soundType: 'double', 
                description: 'Tiempo terminado'
            });
        } else {
            // DSC Mode (Countdown) - DEFAULT
            // For countdown timers, 'at' represents the time remaining when the alert should trigger
            
            // First alert: when 1 minute has elapsed (should appear near START of timeline)
            // For DSC mode: high remaining time = left side of timeline
            alerts.push({ 
                at: totalSeconds - 60, // Trigger when 1 minute has elapsed (17min remaining for 18min timer)
                soundType: 'single', 
                description: '1 minuto transcurrido'
                // No visualTime needed - use 'at' value for positioning
            });
            
            // Second alert: when 1 minute remains (should appear near END of timeline)
            // For DSC mode: low remaining time = right side of timeline
            alerts.push({ 
                at: 60, // Trigger when 1 minute remains
                soundType: 'single', 
                description: 'Falta 1 minuto'
                // No visualTime needed - use 'at' value for positioning
            });
            
            // Third alert: when timer finishes (at the very END)
            // For DSC mode: 0 remaining time = far right of timeline
            alerts.push({ 
                at: 0, // Trigger when timer finishes
                soundType: 'double', 
                description: 'Tiempo terminado'
                // No visualTime needed - use 'at' value for positioning
            });
        }
        

        
        return alerts;
    }

    updateTimerAlerts(timerId, alerts) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        timer.alerts = alerts;
        timer.alertsTriggered.clear();
        

        
        // Update visual state in the UI
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (cardElement && typeof timerHandlers !== 'undefined') {
            timerHandlers.updateBellConfigButton(cardElement, timer);
        }
        
        return true;
    }

    getTimerAlerts(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        return timer ? timer.alerts : [];
    }

    addCustomAlert(timerId, minutes, seconds, soundType, description) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return false;

        const totalSeconds = minutes * 60 + seconds;
        const alert = {
            at: totalSeconds,
            soundType: soundType || 'single',
            description: description || `Alerta a ${minutes}:${seconds.toString().padStart(2, '0')}`
        };

        // Remove any existing alert at the same time
        timer.alerts = timer.alerts.filter(a => a.at !== totalSeconds);
        
        // Add new alert and sort by time (descending)
        timer.alerts.push(alert);
        timer.alerts.sort((a, b) => b.at - a.at);


        return true;
    }

    removeCustomAlert(timerId, alertTime) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return false;

        timer.alerts = timer.alerts.filter(a => a.at !== alertTime);
        

        return true;
    }

    testSoundType(soundType) {
        const soundMap = {
            'single': 1,
            'double': 2,
            'triple': 3,
            'finish': 5
        };
        
        const count = soundMap[soundType] || 1;
        this.playBell(count);
    }

    // Force regenerate default alerts for existing timers
    regenerateDefaultAlerts(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return false;

        timer.alerts = this.getDefaultAlerts(timer.initialMinutes, timer.initialSeconds, timer.isStopwatch);
        timer.alertsTriggered.clear();
        

        return true;
    }

    async startTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        timer.isRunning = true;
        timer.isPaused = false;
        timer.isFinished = false;

        timerView.updateTimerState(timerId, timer);

        // Clear any existing interval
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
        }

        const interval = setInterval(() => {
            if (timer.isStopwatch) {
                // Stopwatch mode - count up
                if (timer.currentSeconds < 59) {
                    timer.currentSeconds++;
                } else {
                    timer.currentMinutes++;
                    timer.currentSeconds = 0;
                    // Cap at 99:59 for display purposes
                    if (timer.currentMinutes >= 100) {
                        timer.currentMinutes = 99;
                        timer.currentSeconds = 59;
                    }
                }
                
                // Check for stopwatch alerts after incrementing
                const totalSecondsElapsed = timer.currentMinutes * 60 + timer.currentSeconds;
                this.checkStopwatchAlerts(timer, totalSecondsElapsed);
            } else {
                // Timer mode - count down
                // Decrement first
                if (timer.currentSeconds > 0) {
                    timer.currentSeconds--;
                } else if (timer.currentMinutes > 0) {
                    timer.currentMinutes--;
                    timer.currentSeconds = 59;
                } else {
                    // Timer finished
                    this.finishTimer(timerId);
                    return;
                }
                
                // Check for alerts after decrementing (using current remaining time)
                const totalSecondsRemaining = timer.currentMinutes * 60 + timer.currentSeconds;
        
                this.checkAlerts(timer, totalSecondsRemaining);
            }

            timerView.updateTimeDisplay(timerId, timer);
        }, 1000);

        this.intervals.set(timerId, interval);
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

        timerView.updateTimerState(timerId, timer);
    }

    resetTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        timer.isRunning = false;
        timer.isPaused = false;
        timer.isFinished = false;
        
        // Clear triggered alerts so they can sound again
        timer.alertsTriggered.clear();
        
        if (timer.isStopwatch) {
            // Stopwatch resets to 0:00
            timer.currentMinutes = 0;
            timer.currentSeconds = 0;
        } else {
            // Timer resets to initial values
            timer.currentMinutes = timer.initialMinutes;
            timer.currentSeconds = timer.initialSeconds;
        }

        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
            this.intervals.delete(timerId);
        }

        timerView.updateTimeDisplay(timerId, timer);
        timerView.updateTimerState(timerId, timer);
        
        // Update bell config button visual state
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (cardElement && typeof timerHandlers !== 'undefined') {
            timerHandlers.updateBellConfigButton(cardElement, timer);
        }
    }

    checkAlerts(timer, totalSecondsRemaining) {
        // Only play bells if enabled for this timer
        if (!timer.bellEnabled) {
            return;
        }
        
        if (!timer.alerts || timer.alerts.length === 0) {
            return;
        }
        
        timer.alerts.forEach((alert) => {
            // Use the alert.at value directly for all alerts (both default and custom)
            // This ensures that visually configured alerts work correctly
            const shouldTrigger = totalSecondsRemaining === alert.at;
            const alertKey = `alert-${alert.at}-${alert.soundType}`;
            
            if (shouldTrigger && !timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                
                const soundMap = {
                    'single': 1,
                    'double': 2,
                    'triple': 3,
                    'finish': 5
                };
                
                const bellCount = soundMap[alert.soundType] || 1;
    
                this.playBell(bellCount);
                
                // Debug log for testing
                console.log(`🔔 Alert triggered: ${alert.description} at ${Math.floor(alert.at/60)}:${(alert.at%60).toString().padStart(2, '0')} (${bellCount} bell${bellCount > 1 ? 's' : ''})`);
            }
        });
    }

    checkStopwatchAlerts(timer, totalSecondsElapsed) {
        // Only play bells if enabled for this timer
        if (!timer.bellEnabled) {
            return;
        }
        
        if (!timer.alerts || timer.alerts.length === 0) {
            return;
        }
        
        timer.alerts.forEach((alert) => {
            // Use the alert.at value directly for all alerts (both default and custom)
            // This ensures that visually configured alerts work correctly
            const shouldTrigger = totalSecondsElapsed === alert.at;
            const alertKey = `stopwatch-alert-${alert.at}-${alert.soundType}`;
            
            if (shouldTrigger && !timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                
                const soundMap = {
                    'single': 1,
                    'double': 2,
                    'triple': 3,
                    'finish': 5
                };
                
                const bellCount = soundMap[alert.soundType] || 1;
    
                this.playBell(bellCount);
                
                // Debug log for testing
                console.log(`🔔 Stopwatch Alert triggered: ${alert.description} at ${Math.floor(alert.at/60)}:${(alert.at%60).toString().padStart(2, '0')} (${bellCount} bell${bellCount > 1 ? 's' : ''})`);
            }
        });
    }

    finishTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        timer.isRunning = false;
        timer.isPaused = false;
        timer.isFinished = true;
        timer.currentMinutes = 0;
        timer.currentSeconds = 0;

        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId));
            this.intervals.delete(timerId);
        }

        timerView.updateTimeDisplay(timerId, timer);
        timerView.updateTimerState(timerId, timer);

        // The "Tiempo terminado" alert is handled in checkAlerts/checkStopwatchAlerts
        // so we don't need to play additional bells here to avoid duplicates
        
        // Flash the timer
        timerView.flashTimer(timerId);
    }

    applyPreset(timerId, presetName) {
        const timer = this.timers.find(t => t.id === timerId);
        const preset = this.presets[presetName];
        if (!timer || !preset) return;

        // Stop the timer if it's running
        if (timer.isRunning) {
            this.pauseTimer(timerId);
        }

        // Apply preset settings
        timer.initialMinutes = preset.minutes;
        timer.initialSeconds = preset.seconds;
        timer.currentMinutes = preset.minutes;
        timer.currentSeconds = preset.seconds;
        timer.preset = presetName;
        timer.alerts = [...preset.alerts];
        timer.alertsTriggered.clear();
        timer.isStopwatch = false; // Presets are always timers, not stopwatches
        timer.isFinished = false;
        timer.isPaused = false;

        // Update name if it's a default timer name
        if (timer.name.startsWith('Timer ')) {
            const presetNames = {
                preptime: 'PrepTime',
                bpspeech: 'BP Speech',
                deliberation: 'Deliberación',
                feedback: 'Feedback'
            };
            timer.name = presetNames[presetName] || timer.name;
        }

        timerView.updateTimeDisplay(timerId, timer);
        timerView.updateTimerState(timerId, timer);
        timerView.updateModeButton(timerId, timer);
        timerView.updatePresetButtons(timerId, timer);
        timerView.updateTimerInputs(timerId, timer.initialMinutes, timer.initialSeconds);
        
        // Update bell config button visual state
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (cardElement && typeof timerHandlers !== 'undefined') {
            timerHandlers.updateBellConfigButton(cardElement, timer);
        }
    }

    toggleTimerMode(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        // Stop the timer if it's running
        if (timer.isRunning) {
            this.pauseTimer(timerId);
        }

        // Toggle mode
        timer.isStopwatch = !timer.isStopwatch;

        // Convert existing alerts to their mirror positions for the new mode
        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        if (timer.alerts && timer.alerts.length > 0) {
            timer.alerts = timer.alerts.map(alert => {
                // Calculate the mirror position
                const mirrorPosition = totalSeconds - alert.at;
                
                // Create new alert with mirrored position
                return {
                    ...alert,
                    at: mirrorPosition
                };
            });
        }

        // Clear triggered alerts so they can trigger again in the new mode
        timer.alertsTriggered.clear();

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

        timerView.updateTimeDisplay(timerId, timer);
        timerView.updateTimerState(timerId, timer);
        timerView.updateModeButton(timerId, timer);
        
        // Update bell config button visual state
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (cardElement && typeof timerHandlers !== 'undefined') {
            timerHandlers.updateBellConfigButton(cardElement, timer);
        }
        

        
        // Trigger global update event
        window.dispatchEvent(new CustomEvent('timerListChanged'));
    }

    getTimer(timerId) {
        return this.timers.find(t => t.id === timerId);
    }

    getAllTimers() {
        return this.timers;
    }
}

export const timerManager = new TimerManager(); 