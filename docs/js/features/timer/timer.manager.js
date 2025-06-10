import { timerView } from './timer.view.js';

class TimerManager {
    constructor() {
        this.timers = [];
        this.nextTimerId = 1;
        this.intervals = new Map();
        this.audioContext = null;
        this.audioMuted = false;
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
        this.updateAudioUI();
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created, state:', this.audioContext.state);
        } catch (e) {
            console.log('Audio context not available:', e);
            // Fallback to simple HTML5 audio
            this.audioContext = null;
        }
    }

    createBeepSound() {
        try {
            // Generate a simple sine wave beep programmatically
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 800; // 800Hz beep
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
            
            return { success: true, context: audioCtx };
        } catch (error) {
            console.error('Failed to create beep sound:', error);
            return { success: false };
        }
    }

    playBell(count = 1) {
        if (this.audioMuted) {
            console.log('Audio muted');
            return;
        }

        // Try Web Audio API first
        if (this.audioContext && this.audioContext.state === 'running') {
            this.playWebAudioBell(count);
        } else {
            // Fallback to HTML5 Audio
            this.playHTML5Bell(count);
        }
    }

    playWebAudioBell(count = 1) {
        let bellIndex = 0;
        
        const playOneBell = () => {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Bell-like sound with higher frequency
                oscillator.frequency.value = 1000;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                
                console.log(`Playing Web Audio bell ${bellIndex + 1} of ${count}`);
                
                bellIndex++;
                if (bellIndex < count) {
                    setTimeout(playOneBell, 400); // 400ms between bells
                }
            } catch (error) {
                console.error('Error playing Web Audio bell:', error);
                // Fallback to HTML5 if Web Audio fails
                this.playHTML5Bell(count - bellIndex);
            }
        };
        
        playOneBell();
    }

    playHTML5Bell(count = 1) {
        let bellIndex = 0;
        
        const playOneBell = () => {
            try {
                console.log(`Attempting to play HTML5 bell ${bellIndex + 1} of ${count}`);
                const result = this.createBeepSound();
                
                if (result.success) {
                    console.log(`Successfully created and played bell ${bellIndex + 1}`);
                } else {
                    console.log(`Failed to create bell ${bellIndex + 1}, but continuing...`);
                }
                
                bellIndex++;
                if (bellIndex < count) {
                    setTimeout(playOneBell, 400);
                }
                
            } catch (error) {
                console.error('Error in playHTML5Bell:', error);
                bellIndex++;
                if (bellIndex < count) {
                    setTimeout(playOneBell, 400);
                }
            }
        };
        
        playOneBell();
    }

    playBeep() {
        this.playBell(1);
    }

    toggleAudioMute() {
        this.audioMuted = !this.audioMuted;
        return this.audioMuted;
    }

    async testAudio() {
        console.log('Testing audio...');
        
        // Try to initialize audio if not ready
        if (!this.audioContext) {
            this.setupAudio();
        }
        
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed for test');
            } catch (error) {
                console.warn('Failed to resume audio context:', error);
            }
        }
        
        this.updateAudioUI();
        
        // Play test sound - this will automatically fallback to HTML5 if needed
        this.playBell(2);
        console.log('Test audio initiated');
    }

    updateAudioUI() {
        const audioInitBtn = document.querySelector('.audio-init');
        const audioStatus = document.querySelector('.audio-status');
        const audioTestBtn = document.querySelector('.audio-test');
        const audioMuteBtn = document.querySelector('.audio-mute');
        
        const hasWorkingAudio = this.audioContext && this.audioContext.state === 'running';
        
        if (!hasWorkingAudio) {
            // Audio might not be optimal - show init button
            if (audioInitBtn) audioInitBtn.classList.remove('hidden');
            if (audioStatus) {
                audioStatus.classList.remove('hidden');
                audioStatus.textContent = 'Click 🎵 para audio optimizado, o usa 🔔 directamente';
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

    async initializeAudio() {
        try {
            if (!this.audioContext) {
                this.setupAudio();
            }
            
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context initialized and resumed');
            }
            
            this.updateAudioUI();
            
            // Play a quick test sound to confirm audio is working
            if (this.audioContext && this.audioContext.state === 'running') {
                this.playBell(1);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    }

    getTimer(timerId) {
        return this.timers.find(timer => timer.id === timerId);
    }

    // Simple direct audio test
    directAudioTest() {
        console.log('=== DIRECT AUDIO TEST STARTED ===');
        
        // Create a new audio context specifically for this test
        let audioContext;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created, state:', audioContext.state);
            
            // If suspended, try to resume
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                    this.playTestBeep(audioContext);
                }).catch(err => {
                    console.error('Failed to resume audio context:', err);
                    this.fallbackAudioTest();
                });
            } else {
                this.playTestBeep(audioContext);
            }
            
        } catch (error) {
            console.error('Failed to create audio context:', error);
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
            
            console.log('✅ Test beep played successfully');
            
            // Give feedback after the sound should have played
            setTimeout(() => {
                const heard = confirm('¿Escuchaste la campanada? (OK = Sí, Cancelar = No)');
                if (heard) {
                    alert('¡Excelente! El audio funciona correctamente. Las campanadas sonarán durante los debates.');
                } else {
                    alert('Verifica:\n• El volumen del dispositivo\n• Que no haya audífonos desconectados\n• Los permisos de audio del navegador');
                }
            }, 700);
            
        } catch (error) {
            console.error('Error playing test beep:', error);
            this.fallbackAudioTest();
        }
    }

    fallbackAudioTest() {
        console.log('Using fallback audio test');
        // Try with Speech API as absolute fallback
        try {
            const utterance = new SpeechSynthesisUtterance('Beep');
            utterance.rate = 3;
            utterance.pitch = 2;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
            
            setTimeout(() => {
                alert('Se usó síntesis de voz como prueba. Si no escuchaste nada, el audio puede no estar disponible en este navegador.');
            }, 1000);
            
        } catch (speechError) {
            console.error('Speech synthesis also failed:', speechError);
            alert('Audio no disponible en este navegador. Las campanadas no funcionarán.');
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
            alerts: [],
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
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        timer.initialMinutes = minutes;
        timer.initialSeconds = seconds;
        
        // Clear triggered alerts if we're editing time - this allows alerts to fire again
        if (timer.preset && timer.alerts && timer.alerts.length > 0) {
            timer.alertsTriggered.clear();
        }
        
        if (!timer.isRunning && !timer.isPaused) {
            timer.currentMinutes = minutes;
            timer.currentSeconds = seconds;
            timerView.updateTimeDisplay(timerId, timer);
        }
    }

    async startTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        // Ensure audio context is ready
        if (!this.audioContext) {
            this.setupAudio();
        }

        // Resume audio context if needed
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed for timer start');
            } catch (error) {
                console.warn('Could not resume audio context:', error);
            }
        }

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
                const totalSecondsRemaining = timer.currentMinutes * 60 + timer.currentSeconds;
                
                // Check for alerts before decrementing
                this.checkAlerts(timer, totalSecondsRemaining);
                
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
    }

    checkAlerts(timer, totalSecondsRemaining) {
        // Only play bells if enabled for this timer
        if (!timer.bellEnabled) return;
        
        // Check preset alerts first
        if (timer.alerts && timer.alerts.length > 0) {
            timer.alerts.forEach((alert, index) => {
                const alertKey = `${alert.at}-${alert.bells}`;
                if (totalSecondsRemaining === alert.at && !timer.alertsTriggered.has(alertKey)) {
                    timer.alertsTriggered.add(alertKey);
                    this.playBell(alert.bells);
                }
            });
        } else {
            // Default bell system for timers without presets
            this.checkDefaultBells(timer, totalSecondsRemaining);
        }
    }

    checkDefaultBells(timer, totalSecondsRemaining) {
        // First minute bell (when entering the last minute)
        if (totalSecondsRemaining === 60) {
            const alertKey = 'first-minute';
            if (!timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                console.log('Playing first minute bell (2 bells)');
                this.playBell(2);
            }
        }
        
        // 15 seconds remaining bell
        if (totalSecondsRemaining === 15) {
            const alertKey = 'fifteen-seconds';
            if (!timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                console.log('Playing 15 seconds bell (2 bells)');
                this.playBell(2);
            }
        }
        
        // When timer reaches exactly 0 (3 bells)
        if (totalSecondsRemaining === 1) {
            const alertKey = 'final-warning';
            if (!timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                console.log('Playing final warning bell (3 bells)');
                this.playBell(3);
            }
        }
    }

    checkStopwatchAlerts(timer, totalSecondsElapsed) {
        // Only play bells if enabled for this timer
        if (!timer.bellEnabled) return;
        
        // Bell every minute (at 60, 120, 180, 240, 300 seconds, etc.)
        if (totalSecondsElapsed > 0 && totalSecondsElapsed % 60 === 0) {
            const minutes = Math.floor(totalSecondsElapsed / 60);
            const alertKey = `minute-${minutes}`;
            if (!timer.alertsTriggered.has(alertKey)) {
                timer.alertsTriggered.add(alertKey);
                console.log(`Playing minute ${minutes} bell (1 bell)`);
                this.playBell(1);
            }
        }
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

        // Play 5 bells when timer is completely finished (after reaching 0)
        if (timer.bellEnabled) {
            this.playBell(5);
        }
        
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