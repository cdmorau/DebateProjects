/**
 * Timer State Management - Handles persistence of timer state
 */
class TimerState {
    constructor() {
        this.storageKey = 'debtools-timer-state';
        this.state = {
            timers: [],
            isInitialized: false
        };
        this.loadState();
    }

    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.warn('💾 Error guardando estado:', error);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.state = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('📖 Error cargando estado:', error);
            this.state = {
                timers: [],
                isInitialized: false
            };
        }
    }

    clearState() {
        this.state = {
            timers: [],
            isInitialized: false
        };
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Failed to clear timer state:', error);
        }
    }

    setTimers(timers) {
        this.state.timers = timers.map(timer => ({
            id: timer.id,
            name: timer.name,
            initialMinutes: timer.initialMinutes,
            initialSeconds: timer.initialSeconds,
            currentMinutes: timer.currentMinutes,
            currentSeconds: timer.currentSeconds,
            isStopwatch: timer.isStopwatch,
            preset: timer.preset,
            alerts: timer.alerts,
            bellEnabled: timer.bellEnabled,
            isRunning: timer.isRunning, // PERSIST running state
            isPaused: timer.isPaused,   // PERSIST paused state
            isFinished: timer.isFinished // PERSIST finished state
        }));
        this.saveState();
    }

    getTimers() {
        return this.state.timers || [];
    }

    setInitialized(initialized) {
        this.state.isInitialized = initialized;
        this.saveState();
    }

    isInitialized() {
        return this.state.isInitialized;
    }
}

export const timerState = new TimerState(); 