import { timerManager } from './timer.manager.js';
import { translate } from '../../common/i18n.js';
import { timerView } from './timer.view.js';

class TimerHandlers {
    constructor() {
        this.addButton = null;
        this.selectedTimeBtn = '7min';
    }

    init() {
        this.setupAddButton();
        this.setupAudioControls();
        this.setupToggleAddSection();
        
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
                const minutesSlider = document.querySelector('.minutes-slider');
                const secondsSlider = document.querySelector('.seconds-slider');
                timerManager.addTimer(null, parseInt(minutesSlider.value), parseInt(secondsSlider.value));
            });
        }
        
        // New compact button
        this.addButtonCompact = document.querySelector('.add-timer-compact');
        if (this.addButtonCompact && !this.addButtonCompact.hasAttribute('data-initialized')) {
            // Update preset time display when sliders change
            const minutesSlider = document.querySelector('.timer-footer .minutes-slider');
            const secondsSlider = document.querySelector('.timer-footer .seconds-slider');
            const presetTimeDisplay = this.addButtonCompact.querySelector('.preset-time');

            if (minutesSlider && secondsSlider && presetTimeDisplay) {
                const updatePresetTime = () => {
                    const minutes = minutesSlider.value.toString().padStart(2, '0');
                    const seconds = secondsSlider.value.toString().padStart(2, '0');
                    presetTimeDisplay.textContent = `${minutes}:${seconds}`;
                };

                // Initial update
                updatePresetTime();

                minutesSlider.addEventListener('input', updatePresetTime);
                secondsSlider.addEventListener('input', updatePresetTime);

                this.addButtonCompact.addEventListener('click', async () => {
                    console.log('Add button clicked!', { minutes: minutesSlider.value, seconds: secondsSlider.value });
                    
                    try {
                        // Ensure timerManager is available
                        if (typeof timerManager === 'undefined') {
                            console.log('timerManager not available, importing...');
                            const { timerManager: tm } = await import('./timer.manager.js');
                            tm.addTimer(null, parseInt(minutesSlider.value), parseInt(secondsSlider.value));
                        } else {
                            timerManager.addTimer(null, parseInt(minutesSlider.value), parseInt(secondsSlider.value));
                        }
                        console.log('Timer added successfully');
                    } catch (error) {
                        console.error('Error adding timer:', error);
                    }
                });

                // Mark as initialized
                this.addButtonCompact.setAttribute('data-initialized', 'true');
                console.log('Add button initialized successfully');
            } else {
                console.warn('Missing elements for add button setup:', { minutesSlider, secondsSlider, presetTimeDisplay });
            }
        }
    }

    setupAudioControls() {
        // Original audio controls
        const audioInitBtn = document.querySelector('.audio-init');
        if (audioInitBtn) {
            audioInitBtn.addEventListener('click', async () => {
                await timerManager.initializeAudio();
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
            muteBtnCompact.title = translate('timer.activateDings');
            muteBtnCompact.style.opacity = '0.6';
        } else {
            muteBtnCompact.textContent = 'Audio';
            muteBtnCompact.title = translate('timer.muteDings');
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
        
        // Fullscreen button
        this.setupFullscreenButton(cardElement, timer);
        
        // Time inputs (legacy - hidden)
        this.setupTimeInputs(cardElement, timer);
        
        // Config button and overlay (combines edit and bell config)
        this.setupConfigButton(cardElement, timer);
        
        // Preset buttons (individual timer)
        this.setupPresetButtons(cardElement, timer);
        
        // Local mode controls
        this.setupLocalModeControls(cardElement, timer);
        
        // Sound controls
        this.setupSoundControls(cardElement, timer);
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

    setupConfigButton(cardElement, timer) {
        const configBtn = cardElement.querySelector('.timer-btn-compact.config');
        const configOverlay = cardElement.querySelector('.timer-config-overlay');
        const closeBtn = configOverlay?.querySelector('.close-timer-config');
        
        if (configBtn && configOverlay) {
            // Setup sliders
            const minutesSlider = configOverlay.querySelector('.minutes-slider');
            const secondsSlider = configOverlay.querySelector('.seconds-slider');
            const presetTimeDisplay = configOverlay.querySelector('.preset-time');
            const minutesValue = configOverlay.querySelector('.minutes-value');
            const secondsValue = configOverlay.querySelector('.seconds-value');
            const timelineEnd = configOverlay.querySelector('.timeline-end');
            
            // Debounce timer for auto-save
            let saveTimeout;

            const updateVisualDisplay = () => {
                const minutes = parseInt(minutesSlider.value);
                const seconds = parseInt(secondsSlider.value);
                const minutesStr = minutes.toString().padStart(2, '0');
                const secondsStr = seconds.toString().padStart(2, '0');
                
                presetTimeDisplay.textContent = `${minutesStr}:${secondsStr}`;
                minutesValue.textContent = minutes;
                secondsValue.textContent = seconds;
                
                // Update timeline labels based on timer mode
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    const timelineStart = configOverlay.querySelector('.timeline-start');
                    const timelineEnd = configOverlay.querySelector('.timeline-end');
                    
                    if (timelineStart && timelineEnd) {
                        if (currentTimer.isStopwatch) {
                            // ASC: 0:00 at start, total time at end
                            timelineStart.textContent = '0:00';
                            timelineEnd.textContent = `${minutesStr}:${secondsStr}`;
                        } else {
                            // DSC: total time at start, 0:00 at end
                            timelineStart.textContent = `${minutesStr}:${secondsStr}`;
                            timelineEnd.textContent = '0:00';
                        }
                    }
                }
            };

            const saveTimeSettings = () => {
                const minutes = parseInt(minutesSlider.value);
                const seconds = parseInt(secondsSlider.value);
                
                // Save timer settings first
                timerManager.updateTimerSettings(timer.id, minutes, seconds);
                
                // Regenerate default alerts for new duration
                timerManager.regenerateDefaultAlerts(timer.id);
                
                // Update timeline when time changes
                this.updateTimelineForNewDuration(configOverlay, timer.id, minutes * 60 + seconds);
            };

            // Update visual display in real-time while dragging
            minutesSlider.addEventListener('input', updateVisualDisplay);
            secondsSlider.addEventListener('input', updateVisualDisplay);
            
            // Save settings only when slider is released (optimized)
            minutesSlider.addEventListener('change', saveTimeSettings);
            secondsSlider.addEventListener('change', saveTimeSettings);

            // Escape key support
            const handleEscape = (e) => {
                if (e.key === 'Escape' && configOverlay.style.display === 'flex') {
                    closeConfigOverlay();
                }
            };

            // Close function with escape handler cleanup
            const closeConfigOverlay = () => {
                // Auto-save bell configuration before closing
                this.autoSaveTimeline(configOverlay, timer.id);
                configOverlay.style.display = 'none';
                document.removeEventListener('keydown', handleEscape);
            };

            // Show overlay on config click
            configBtn.addEventListener('click', () => {
                const currentTimer = timerManager.getTimer(timer.id);
                if (currentTimer) {
                    configOverlay.style.display = 'flex';
                    minutesSlider.value = currentTimer.initialMinutes;
                    secondsSlider.value = currentTimer.initialSeconds;
                    updateVisualDisplay();
                    
                    // Setup bell configuration
                    this.setupModernBellConfig(cardElement, timer.id);
                    
                    // Focus on first slider for keyboard navigation
                    minutesSlider.focus();
                    
                    // Add escape listener when overlay opens
                    document.addEventListener('keydown', handleEscape);
                }
            });

            // Close button
            if (closeBtn) {
                closeBtn.addEventListener('click', closeConfigOverlay);
            }

            // Close overlay when clicking outside
            configOverlay.addEventListener('click', (e) => {
                if (e.target === configOverlay) {
                    closeConfigOverlay();
                }
            });
        }
    }

    updateTimelineForNewDuration(overlay, timerId, newDurationInSeconds) {
        // Update timeline markers and bell positions when duration changes
        const timer = timerManager.getTimer(timerId);
        if (!timer) return;
        
        // Create a temporary timer object with new duration for timeline update
        const newMinutes = Math.floor(newDurationInSeconds / 60);
        const newSeconds = newDurationInSeconds % 60;
        const tempTimer = { 
            ...timer, 
            initialMinutes: newMinutes,
            initialSeconds: newSeconds,
            totalSeconds: newDurationInSeconds 
        };
        
        // Update timeline labels
        const timelineStart = overlay.querySelector('.timeline-start');
        const timelineEnd = overlay.querySelector('.timeline-end');
        if (timelineStart && timelineEnd) {
            const displayMinutes = newMinutes.toString().padStart(2, '0');
            const displaySeconds = newSeconds.toString().padStart(2, '0');
            
            if (timer.isStopwatch) {
                // ASC: 0:00 at start, total time at end
                timelineStart.textContent = '0:00';
                timelineEnd.textContent = `${displayMinutes}:${displaySeconds}`;
            } else {
                // DSC: total time at start, 0:00 at end
                timelineStart.textContent = `${displayMinutes}:${displaySeconds}`;
                timelineEnd.textContent = '0:00';
            }
        }
        
        // Recreate timeline with new duration
        this.createTimeMarkers(overlay, tempTimer);
        
        // Clear all existing bell dots before updating positions
        const timeline = overlay.querySelector('.bell-timeline');
        if (timeline) {
            timeline.querySelectorAll('.bell-dot').forEach(dot => dot.remove());
        }
        
        // Reload bells from timer alerts (this will create clean bell dots)
        this.loadBellsToTimeline(overlay, timerId);
    }

    updateExistingBellPositions(overlay, timerId, newDurationInSeconds) {
        const timer = timerManager.getTimer(timerId);
        if (!timer) return;

        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return;

        // First, clean up any invalid bell dots
        this.cleanupInvalidBellDots(timeline);

        const existingBells = timeline.querySelectorAll('.bell-dot');
        
        existingBells.forEach(bellDot => {
            const timeAttr = bellDot.getAttribute('data-time');
            const soundAttr = bellDot.getAttribute('data-sound');
            const timeInSeconds = parseInt(timeAttr);
            
            // Skip if this bell has invalid data
            if (!timeAttr || !soundAttr || isNaN(timeInSeconds) || timeInSeconds < 0) {
                console.warn('Removing invalid bell dot during position update:', { timeAttr, soundAttr, timeInSeconds });
                bellDot.remove();
                return;
            }
            
            // Skip if this bell exceeds the new duration
            if (timeInSeconds > newDurationInSeconds) {
                bellDot.remove();
                return;
            }
            
            // Recalculate position for new duration
            let position;
            if (newDurationInSeconds === 0) {
                position = 0;
            } else if (timer.isStopwatch) {
                // ASC: 0s = left (0%), totalSeconds = right (100%)
                position = (timeInSeconds / newDurationInSeconds) * 100;
            } else {
                // DSC: 0s = right (100%), totalSeconds = left (0%)
                position = ((newDurationInSeconds - timeInSeconds) / newDurationInSeconds) * 100;
            }
            
            // Ensure position is within valid range
            position = Math.max(0, Math.min(100, position));
            
            // Update position
            bellDot.style.left = `${position}%`;
            
            // Update tooltip
            const tooltip = bellDot.querySelector('.bell-tooltip');
            if (tooltip) {
                tooltip.textContent = this.generateBellTooltip(timeInSeconds, timer, bellDot.getAttribute('data-sound'));
            }
        });
        
        // Auto-save the updated timeline
        this.autoSaveTimeline(overlay, timerId);
    }

    cleanupInvalidBellDots(overlay) {
        // Handle both timeline element and overlay element
        const timeline = overlay.querySelector ? overlay.querySelector('.bell-timeline') : overlay;
        if (!timeline) {
            console.warn('No timeline found for cleanup');
            return;
        }
        
        const allBells = timeline.querySelectorAll('.bell-dot');
        let removedCount = 0;
        
        console.log(`Starting cleanup of ${allBells.length} bell dots`);
        
        allBells.forEach((bellDot, index) => {
            const timeAttr = bellDot.getAttribute('data-time');
            const soundAttr = bellDot.getAttribute('data-sound');
            const timeValue = parseInt(timeAttr);
            
            // More comprehensive validation
            const validationChecks = {
                hasTimeAttr: !!timeAttr,
                hasSoundAttr: !!soundAttr,
                timeIsNumber: !isNaN(timeValue),
                timeIsPositive: timeValue >= 0,
                soundIsValid: ['single', 'double', 'triple', 'finish'].includes(soundAttr),
                hasPosition: !!bellDot.style.left,
                positionIsValid: bellDot.style.left !== 'NaN%' && bellDot.style.left !== '',
                hasParent: !!bellDot.parentNode,
                hasClasses: bellDot.className.includes('bell-dot')
            };
            
            const isValid = Object.values(validationChecks).every(check => check);
            
            if (!isValid) {
                console.warn(`Removing invalid bell dot ${index}:`, { 
                    timeAttr, 
                    soundAttr, 
                    timeValue,
                    position: bellDot.style.left,
                    classes: bellDot.className,
                    validationChecks
                });
                
                // Remove from DOM safely
                try {
                    if (bellDot.parentNode) {
                        bellDot.parentNode.removeChild(bellDot);
                    } else {
                        bellDot.remove();
                    }
                    removedCount++;
                } catch (error) {
                    console.error('Error removing bell dot:', error);
                }
            } else {
                console.log(`Bell dot ${index} is valid:`, {
                    timeAttr,
                    soundAttr,
                    position: bellDot.style.left
                });
            }
        });
        
        if (removedCount > 0) {
            console.log(`✅ Cleaned up ${removedCount} invalid bell dots`);
        } else {
            console.log('✅ No invalid bell dots found');
        }
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
        
        // Initialize button states
        this.updateModeToggleButton(cardElement, timer);
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

    updateBellConfigButton(cardElement, timer) {
        const bellConfigBtn = cardElement.querySelector('.bell-config');
        if (!bellConfigBtn) return;
        
        // Show indicator if there are custom alerts
        if (timer.alerts && timer.alerts.length > 0) {
            bellConfigBtn.classList.add('has-alerts');
        } else {
            bellConfigBtn.classList.remove('has-alerts');
        }
    }

    openBellConfig(cardElement, timerId) {
        const bellConfigOverlay = cardElement.querySelector('.bell-config-overlay');
        if (!bellConfigOverlay) {
            return;
        }
        
        // Setup event listeners only once if not already set
        if (!bellConfigOverlay.dataset.listenersSetup) {
            this.setupBellConfigListeners(cardElement, timerId);
            bellConfigOverlay.dataset.listenersSetup = 'true';
        }
        
        // Setup modern timeline system
        this.setupModernBellConfig(cardElement, timerId);
        
        // Show overlay
        bellConfigOverlay.style.display = 'flex';
    }

    setupBellConfigListeners(cardElement, timerId) {
        const bellConfigOverlay = cardElement.querySelector('.bell-config-overlay');
        const closeBtn = bellConfigOverlay.querySelector('.close-bell-config');
        const addAlertBtn = bellConfigOverlay.querySelector('.add-alert-btn');
        const saveBtn = bellConfigOverlay.querySelector('.save-bell-config');
        const testBtn = bellConfigOverlay.querySelector('.test-bells-btn');
        
        // Escape key support
        const handleEscape = (e) => {
            if (e.key === 'Escape' && bellConfigOverlay.style.display === 'flex') {
                closeOverlay();
            }
        };

        // Close function with escape handler cleanup
        let closeOverlay = () => {
            bellConfigOverlay.style.display = 'none';
            document.removeEventListener('keydown', handleEscape);
        };

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', closeOverlay);
        }

        // Close on overlay click (clicking outside)
        bellConfigOverlay.addEventListener('click', (e) => {
            if (e.target === bellConfigOverlay) {
                closeOverlay();
            }
        });

        // Add alert button
        if (addAlertBtn) {
            addAlertBtn.addEventListener('click', () => {
                this.addNewAlert(cardElement, timerId);
            });
        }

        // Save button
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveBellConfig(cardElement, timerId);
                closeOverlay();
            });
        }

        // Test button
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testBellSound();
            });
        }

        // Add escape listener when overlay opens
        document.addEventListener('keydown', handleEscape);
    }

    loadBellConfigAlerts(cardElement, timerId) {
        const alertsList = cardElement.querySelector('.bell-alerts-list');
        const alerts = timerManager.getTimerAlerts(timerId);
        
        alertsList.innerHTML = '';
        
        alerts.forEach((alert, index) => {
            this.addAlertToList(alertsList, alert, timerId);
        });
    }

    addAlertToList(alertsList, alert, timerId) {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        alertItem.dataset.alertTime = alert.at;
        
        const minutes = Math.floor(alert.at / 60);
        const seconds = alert.at % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const soundEmoji = {
            'single': '<img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">',
            'double': '<img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">',
            'triple': '<img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">',
            'finish': '<img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">'
        };

        alertItem.innerHTML = `
            <div class="alert-info">
                <div class="alert-time">${timeDisplay}</div>
                <div class="alert-sound">${soundEmoji[alert.soundType] || '<img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">'}</div>
                <div class="alert-description">${alert.description}</div>
            </div>
            <button class="remove-alert" title="Eliminar alerta">×</button>
        `;

        // Add proper event listener for remove button
        const removeBtn = alertItem.querySelector('.remove-alert');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            alertItem.style.opacity = '0';
            alertItem.style.transform = 'translateX(100%)';
            setTimeout(() => {
                alertItem.remove();
            }, 200);
        });

        alertsList.appendChild(alertItem);
    }

    addNewAlert(cardElement, timerId) {
        const minutesInput = cardElement.querySelector('.alert-minutes');
        const secondsInput = cardElement.querySelector('.alert-seconds');
        const soundTypeSelect = cardElement.querySelector('.alert-sound-type');
        const alertsList = cardElement.querySelector('.bell-alerts-list');

        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        const soundType = soundTypeSelect.value;
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds < 0) return;

        const description = this.generateAlertDescription(minutes, seconds, soundType);
        const alert = {
            at: totalSeconds,
            soundType: soundType,
            description: description
        };

        // Add to visual list
        this.addAlertToList(alertsList, alert, timerId);

        // Clear inputs
        minutesInput.value = 1;
        secondsInput.value = 0;
        soundTypeSelect.value = 'single';
    }

    generateAlertDescription(minutes, seconds, soundType) {
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const soundNames = {
            'single': '1 campanada',
            'double': '2 campanadas',
            'triple': '3 campanadas',
            'finish': '5 campanadas'
        };
        
        if (minutes === 0 && seconds === 0) {
            return 'Tiempo terminado';
        } else if (minutes === 1 && seconds === 0) {
            return 'Último minuto';
        } else if (minutes === 0 && seconds === 15) {
            return '15 segundos';
        } else {
            return `${soundNames[soundType]} a ${timeStr}`;
        }
    }

    saveBellConfig(cardElement, timerId) {
        const alertsList = cardElement.querySelector('.bell-alerts-list');
        const alertItems = alertsList.querySelectorAll('.alert-item');
        
        const alerts = Array.from(alertItems).map(item => {
            const alertTime = parseInt(item.dataset.alertTime);
            const alertInfo = item.querySelector('.alert-info');
            const soundText = alertInfo.querySelector('.alert-sound').textContent;
            const description = alertInfo.querySelector('.alert-description').textContent;
            
            // Determine sound type from emoji
            let soundType = 'single';
            if (soundText.includes('bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">')) soundType = 'finish';
            else if (soundText.includes('bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">')) soundType = 'triple';
            else if (soundText.includes('bell-icon-inline"><img src="sounds/campana.png" alt="🔔" class="bell-icon-inline">')) soundType = 'double';
            
            return {
                at: alertTime,
                soundType: soundType,
                description: description
            };
        });

        // Sort alerts by time
        alerts.sort((a, b) => a.at - b.at);

        // Remove duplicates based on time
        const uniqueAlerts = alerts.filter((alert, index, arr) => 
            index === arr.findIndex(a => a.at === alert.at)
        );

        // Update alerts in timer manager
        const result = timerManager.updateTimerAlerts(timerId, uniqueAlerts);
        
        // Update UI to reflect saved state
        const savedAlerts = timerManager.getTimerAlerts(timerId);
        this.loadBellConfigAlerts(cardElement, timerId);
        
        // Update bell config button indicator
        const timer = timerManager.getTimer(timerId);
        if (timer) {
            this.updateBellConfigButton(cardElement, timer);
        }
    }

    testBellSound() {
        timerManager.playBell(1);
    }

    setupToggleAddSection() {
        const toggleBtn = document.querySelector('.toggle-add-section');
        const timerFooter = document.querySelector('.timer-footer');
        
        if (toggleBtn && timerFooter) {
            // Inicializar el estado
            let isVisible = false;
            timerFooter.classList.add('hidden');

            toggleBtn.addEventListener('click', () => {
                isVisible = !isVisible;
                toggleBtn.classList.toggle('active');

                if (isVisible) {
                    // Mostrar la sección
                    timerFooter.classList.remove('hidden');
                    timerFooter.classList.add('visible');
                    document.body.classList.add('footer-visible');
                    
                    // Actualizar los sliders
                    const minutesSlider = timerFooter.querySelector('.minutes-slider');
                    const secondsSlider = timerFooter.querySelector('.seconds-slider');
                    const presetTimeDisplay = timerFooter.querySelector('.preset-time');
                    
                    if (minutesSlider && secondsSlider && presetTimeDisplay) {
                        const minutes = minutesSlider.value.toString().padStart(2, '0');
                        const seconds = secondsSlider.value.toString().padStart(2, '0');
                        presetTimeDisplay.textContent = `${minutes}:${seconds}`;
                    }
                } else {
                    // Ocultar la sección
                    timerFooter.classList.remove('visible');
                    timerFooter.classList.add('hidden');
                    document.body.classList.remove('footer-visible');
                }
            });
        }
    }

    setupFullscreenButton(cardElement, timer) {
        const fullscreenBtn = cardElement.querySelector('.fullscreen-timer-compact');
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const isFullscreen = cardElement.classList.contains('fullscreen');
                
                // Remover la clase fullscreen de todas las cards primero
                document.querySelectorAll('.timer-card-compact').forEach(card => {
                    card.classList.remove('fullscreen');
                });
                
                if (!isFullscreen) {
                    // Activar pantalla completa
                    cardElement.classList.add('fullscreen');
                    fullscreenBtn.textContent = '⛶';
                    fullscreenBtn.title = 'Salir de pantalla completa';
                    
                    // Escuchar la tecla Escape
                    const handleEscape = (e) => {
                        if (e.key === 'Escape') {
                            cardElement.classList.remove('fullscreen');
                            fullscreenBtn.textContent = '⛶';
                            fullscreenBtn.title = 'Pantalla completa';
                            document.removeEventListener('keydown', handleEscape);
                        }
                    };
                    document.addEventListener('keydown', handleEscape);
                } else {
                    // Desactivar pantalla completa
                    fullscreenBtn.textContent = '⛶';
                    fullscreenBtn.title = 'Pantalla completa';
                }
            });
        }
    }

    // Utility method to remove all event listeners from a timer card
    removeTimerEventListeners(cardElement) {
        // Clone the element to remove all event listeners
        const newElement = cardElement.cloneNode(true);
        cardElement.parentNode.replaceChild(newElement, cardElement);
        return newElement;
    }

    // New Modern Timeline System
    setupModernBellConfig(cardElement, timerId) {
        // Try new config overlay first, fallback to legacy bell-config-overlay
        let overlay = cardElement.querySelector('.timer-config-overlay');
        if (!overlay) {
            overlay = cardElement.querySelector('.bell-config-overlay');
        }
        if (!overlay) return;

        const timer = timerManager.getTimer(timerId);
        if (!timer) return;

        this.initializeTimeline(overlay, timer);
        this.setupQuickActions(overlay, timerId);
        this.setupTimelineDragAndDrop(overlay, timerId);
        this.loadBellsToTimeline(overlay, timerId);

        // Click on timeline area to deselect bells
        const timeline = overlay.querySelector('.bell-timeline');
        if (timeline) {
            timeline.addEventListener('click', (e) => {
                // Only deselect if clicking on timeline itself, not on a bell
                if (e.target === timeline || e.target.classList.contains('timeline-track') || e.target.classList.contains('timeline-progress')) {
                    this.deselectAllBells(overlay);
                }
            });
        }
    }

    initializeTimeline(overlay, timer) {
        // Update duration display
        const durationTime = overlay.querySelector('.duration-time');
        if (durationTime) {
            const minutes = timer.initialMinutes.toString().padStart(2, '0');
            const seconds = timer.initialSeconds.toString().padStart(2, '0');
            durationTime.textContent = `${minutes}:${seconds}`;
        }

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
                // DSC: total time at start, 0:00 at end
                timelineStart.textContent = `${displayMinutes}:${displaySeconds}`;
                timelineEnd.textContent = '0:00';
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
            // If already setup, just remove existing listeners without cloning
            const addBellBtns = overlay.querySelectorAll('.add-bell-btn');
            addBellBtns.forEach(btn => {
                // Remove existing listeners by replacing with a clean copy of the function
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
            // Create and store the handler function
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
                this.testBellSound();
            };
            testBtn.addEventListener('click', testBtn._testClickHandler);
        }
    }

    addBellToTimeline(overlay, timerId, soundType) {
        const timer = timerManager.getTimer(timerId);
        if (!timer) return;

        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        
        // Find a good default position (middle if empty, or spread out)
        const existingBells = overlay.querySelectorAll('.bell-dot');
        let defaultTime;
        
        if (existingBells.length === 0) {
            // First bell: place at 60% of total time
            defaultTime = Math.round(totalSeconds * 0.6 / 5) * 5; // 5-second precision
        } else {
            // Find the largest gap and place in the middle
            const times = Array.from(existingBells).map(bell => 
                parseInt(bell.getAttribute('data-time'))
            ).sort((a, b) => a - b);
            
            let maxGap = 0;
            let gapPosition = totalSeconds / 2;
            
            // Check gap at the beginning
            if (times[0] > 15) {
                maxGap = times[0];
                gapPosition = Math.min(times[0] / 2, 30);
            }
            
            // Check gaps between existing bells
            for (let i = 0; i < times.length - 1; i++) {
                const gap = times[i + 1] - times[i];
                if (gap > maxGap && gap > 15) {
                    maxGap = gap;
                    gapPosition = times[i] + gap / 2;
                }
            }
            
            // Check gap at the end
            if (totalSeconds - times[times.length - 1] > maxGap && totalSeconds - times[times.length - 1] > 15) {
                gapPosition = times[times.length - 1] + (totalSeconds - times[times.length - 1]) / 2;
            }
            
            defaultTime = Math.round(gapPosition);
        }

        // Ensure time is within bounds
        defaultTime = Math.max(0, Math.min(defaultTime, totalSeconds));

        console.log('Creating bell dot with params:', { defaultTime, soundType, timerId });
        const bellDot = this.createBellDot(overlay, timerId, defaultTime, soundType);
        if (bellDot) {
            console.log('Bell dot created successfully:', {
                dataTime: bellDot.getAttribute('data-time'),
                dataSound: bellDot.getAttribute('data-sound'),
                element: bellDot
            });
            
            // Add a small delay to ensure DOM is stable before auto-saving
            setTimeout(() => {
                this.autoSaveTimeline(overlay, timerId);
            }, 10);
        } else {
            console.error('Failed to create bell dot in addBellToTimeline');
        }
    }

    createBellDot(overlay, timerId, timeInSeconds, soundType, alert = null) {
        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return;

        const timer = timerManager.getTimer(timerId);
        if (!timer) return;
        
        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        
        // Validate input parameters
        if (typeof timeInSeconds !== 'number' || 
            timeInSeconds < 0 || 
            timeInSeconds > totalSeconds ||
            !soundType ||
            !['single', 'double', 'triple', 'finish'].includes(soundType)) {
            console.warn('Invalid bell dot parameters:', { timeInSeconds, soundType, totalSeconds });
            return;
        }
        
        // Calculate position percentage
        // For DSC (countdown): 0s should be at right (100%), totalSeconds at left (0%)
        // For ASC (stopwatch): 0s should be at left (0%), totalSeconds at right (100%)
        let position;
        if (totalSeconds === 0) {
            position = 0; // Avoid division by zero
        } else if (timer.isStopwatch) {
            // ASC: 0s = left (0%), totalSeconds = right (100%)
            position = (timeInSeconds / totalSeconds) * 100;
        } else {
            // DSC: 0s = right (100%), totalSeconds = left (0%)
            position = ((totalSeconds - timeInSeconds) / totalSeconds) * 100;
        }
        
        // Ensure position is within valid range
        position = Math.max(0, Math.min(100, position));
        
        // Check if position is valid (not NaN)
        if (isNaN(position)) {
            console.warn('Invalid position calculated:', { position, timeInSeconds, totalSeconds });
            return;
        }

        const bellDot = document.createElement('div');
        bellDot.className = `bell-dot ${soundType}-bell`;
        
        // Store the actual trigger time (from alert.at) for functionality
        // but use timeInSeconds for visual positioning
        const triggerTime = alert && alert.at !== undefined ? alert.at : timeInSeconds;
        
        // Validate triggerTime before setting attributes
        if (typeof triggerTime !== 'number' || isNaN(triggerTime) || triggerTime < 0) {
            console.error('Invalid trigger time for bell dot:', triggerTime);
            return null;
        }
        
        console.log('Setting bell dot attributes:', { triggerTime, soundType });
        bellDot.setAttribute('data-time', triggerTime.toString());
        bellDot.setAttribute('data-sound', soundType);
        bellDot.style.left = `${position}%`;
        bellDot.style.opacity = '1'; // Ensure visibility
        
        console.log('Attributes set, verifying:', {
            dataTime: bellDot.getAttribute('data-time'),
            dataSound: bellDot.getAttribute('data-sound')
        });
        
        // Verify attributes were set correctly
        if (!bellDot.getAttribute('data-time') || !bellDot.getAttribute('data-sound')) {
            console.error('Failed to set bell dot attributes:', {
                dataTime: bellDot.getAttribute('data-time'),
                dataSound: bellDot.getAttribute('data-sound'),
                triggerTime,
                soundType
            });
            return null;
        }
        
        // Add bell count display
        const bellCounts = { single: '1', double: '2', triple: '3', finish: '5' };
        bellDot.textContent = bellCounts[soundType] || '1';
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'bell-tooltip';
        // Use the alert description if available, otherwise generate tooltip from trigger time
        if (alert && alert.description) {
            const timeStr = this.formatTime(triggerTime);
            if (alert.description === '1 minuto transcurrido') {
                const elapsedTime = totalSeconds - triggerTime;
                tooltip.textContent = `1 min transcurrido (quedan ${this.formatTime(triggerTime)})`;
            } else if (alert.description === 'Falta 1 minuto') {
                tooltip.textContent = `Falta 1 minuto (${this.formatTime(triggerTime)})`;
            } else if (alert.description === 'Tiempo terminado') {
                tooltip.textContent = `Tiempo terminado (${this.formatTime(triggerTime)})`;
            } else {
                tooltip.textContent = `${alert.description} (${timeStr})`;
            }
        } else {
            tooltip.textContent = this.generateBellTooltip(triggerTime, timer, soundType);
        }
        bellDot.appendChild(tooltip);

        timeline.appendChild(bellDot);
        
        // Setup event listeners for the new bell dot
        this.setupBellDotListeners(bellDot, overlay, timerId);
        
        // Final verification that the bell dot was created correctly
        const finalVerification = {
            dataTime: bellDot.getAttribute('data-time'),
            dataSound: bellDot.getAttribute('data-sound'),
            hasParent: !!bellDot.parentNode,
            position: bellDot.style.left
        };
        
        console.log('Bell dot final verification:', finalVerification);
        
        if (!finalVerification.dataTime || !finalVerification.dataSound || !finalVerification.hasParent) {
            console.error('Bell dot creation failed final verification, removing:', finalVerification);
            if (bellDot.parentNode) {
                bellDot.parentNode.removeChild(bellDot);
            }
            return null;
        }
        
        return bellDot;
    }

    setupBellDotListeners(bellDot, overlay, timerId) {
        let isDragging = false;
        let startX = 0;
        let startLeft = 0;
        let timelineRect = null;
        let timer = null;
        let totalSeconds = 0;
        let animationFrameId = null;
        let pendingUpdate = null;

        bellDot.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startLeft = parseFloat(bellDot.style.left);
            bellDot.classList.add('dragging');
            
            // Cache expensive calculations once at start
            const timeline = overlay.querySelector('.bell-timeline');
            timelineRect = timeline.getBoundingClientRect();
            timer = timerManager.getTimer(timerId);
            totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

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
                
                // Update time and tooltip with throttled precision
                let newTime;
                if (timer.isStopwatch) {
                    // ASC: position directly maps to time
                    newTime = Math.round((newLeft / 100) * totalSeconds / 5) * 5;
                } else {
                    // DSC: position inversely maps to time (left = totalSeconds, right = 0)
                    newTime = Math.round(((100 - newLeft) / 100) * totalSeconds / 5) * 5;
                }
                newTime = Math.max(0, Math.min(totalSeconds, newTime)); // Ensure bounds
                
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
            if (isDragging) {
                isDragging = false;
                bellDot.classList.remove('dragging');
                
                // Cancel any pending animation frame
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                // Clear cache
                timelineRect = null;
                timer = null;
                totalSeconds = 0;
                pendingUpdate = null;
                
                // Only save when drag is complete
                this.autoSaveTimeline(overlay, timerId);
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        };

        // Double click to change bell type
        bellDot.addEventListener('dblclick', () => {
            this.cycleBellType(bellDot, overlay, timerId);
        });

        // Click to select bell (for delete functionality)
        bellDot.addEventListener('click', (e) => {
            if (!isDragging) {
                e.stopPropagation();
                this.selectBellDot(bellDot, overlay, timerId);
            }
        });
    }



    cycleBellType(bellDot, overlay, timerId) {
        const currentType = bellDot.getAttribute('data-sound');
        const types = ['single', 'double', 'triple', 'finish'];
        const currentIndex = types.indexOf(currentType);
        const nextType = types[(currentIndex + 1) % types.length];
        
        this.changeBellType(bellDot, nextType, overlay, timerId);
    }

    changeBellType(bellDot, newType, overlay, timerId) {
        const oldType = bellDot.getAttribute('data-sound');
        
        // Update classes
        bellDot.classList.remove(`${oldType}-bell`);
        bellDot.classList.add(`${newType}-bell`);
        
        // Update attributes
        bellDot.setAttribute('data-sound', newType);
        
        // Update display
        const bellCounts = { single: '1', double: '2', triple: '3', finish: '5' };
        bellDot.textContent = bellCounts[newType] || '1';
        
        this.autoSaveTimeline(overlay, timerId);
    }

    loadBellsToTimeline(overlay, timerId) {
        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return;

        // Clear existing bells
        const existingBells = timeline.querySelectorAll('.bell-dot');
        existingBells.forEach(bell => bell.remove());

        const timer = timerManager.getTimer(timerId);
        if (!timer || !timer.alerts) return;

        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;

        // Add each alert as a bell dot, filtering out invalid ones
        timer.alerts.forEach((alert, index) => {
            // Validate alert data
            if (alert && 
                typeof alert.at === 'number' && 
                alert.at >= 0 && 
                alert.at <= totalSeconds && 
                alert.soundType && 
                ['single', 'double', 'triple', 'finish'].includes(alert.soundType)) {
                
                // Use visualTime for positioning if available, otherwise use at
                const visualPosition = alert.visualTime !== undefined ? alert.visualTime : alert.at;
                const bellDot = this.createBellDot(overlay, timerId, visualPosition, alert.soundType, alert);
                
                if (!bellDot) {
                    console.warn('Failed to create bell dot for alert:', alert);
                }
            } else {
                console.warn('Skipping invalid alert:', alert);
            }
        });
    }

    autoSaveTimeline(overlay, timerId) {
        console.log('autoSaveTimeline called for timer:', timerId);
        
        // First, clean up any invalid bell dots
        this.cleanupInvalidBellDots(overlay);
        
        const bellDots = overlay.querySelectorAll('.bell-dot');
        console.log('Found bell dots:', bellDots.length);
        
        // Debug each bell dot before processing
        bellDots.forEach((dot, index) => {
            console.log(`Bell dot ${index}:`, {
                dataTime: dot.getAttribute('data-time'),
                dataSound: dot.getAttribute('data-sound'),
                classes: dot.className,
                element: dot
            });
        });
        
        const alerts = Array.from(bellDots)
            .map(dot => {
                const timeAttr = dot.getAttribute('data-time');
                const soundAttr = dot.getAttribute('data-sound');
                const timeValue = parseInt(timeAttr);
                
                // Validate that we have valid data
                if (!timeAttr || !soundAttr || isNaN(timeValue) || timeValue < 0) {
                    console.warn('Invalid bell dot data, removing:', { 
                        timeAttr, 
                        soundAttr, 
                        timeValue,
                        element: dot,
                        classes: dot.className 
                    });
                    // Remove invalid bell dot from DOM
                    dot.remove();
                    return null;
                }
                
                // Additional validation for sound type
                if (!['single', 'double', 'triple', 'finish'].includes(soundAttr)) {
                    console.warn('Invalid sound type, removing bell dot:', soundAttr);
                    dot.remove();
                    return null;
                }
                
                return {
                    at: timeValue,
                    soundType: soundAttr,
                    description: this.generateTimelineAlertDescription(timeValue, soundAttr)
                };
            })
            .filter(alert => alert !== null); // Remove invalid alerts

        // Sort by time (descending for countdown timers)
        alerts.sort((a, b) => b.at - a.at);

        timerManager.updateTimerAlerts(timerId, alerts);
        
        // Update visual state of bell config button
        const cardElement = document.querySelector(`[data-timer-id="${timerId}"]`);
        const timer = timerManager.getTimer(timerId);
        if (cardElement && timer) {
            this.updateBellConfigButton(cardElement, timer);
        }
    }

    generateTimelineAlertDescription(timeInSeconds, soundType) {
        // Validate input parameters
        if (typeof timeInSeconds !== 'number' || isNaN(timeInSeconds) || timeInSeconds < 0) {
            console.warn('Invalid timeInSeconds for alert description:', timeInSeconds);
            return 'Alerta inválida';
        }
        
        if (!soundType || !['single', 'double', 'triple', 'finish'].includes(soundType)) {
            console.warn('Invalid soundType for alert description:', soundType);
            return 'Alerta inválida';
        }
        
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        
        if (timeInSeconds === 0) {
            return 'Tiempo terminado';
        }
        
        const timeStr = minutes > 0 
            ? `${minutes}:${seconds.toString().padStart(2, '0')}`
            : `${seconds} segundos`;

        const soundMap = {
            'single': '1 campanada',
            'double': '2 campanadas', 
            'triple': '3 campanadas',
            'finish': '5 campanadas'
        };

        return `${soundMap[soundType]} a ${timeStr}`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    generateBellTooltip(timeInSeconds, timer, soundType) {
        const totalSeconds = timer.initialMinutes * 60 + timer.initialSeconds;
        
        // Find if this is a default alert
        const defaultAlert = timer.alerts.find(alert => alert.at === timeInSeconds);
        
        if (defaultAlert && defaultAlert.description) {
            // For default alerts, show the description and the time
            const timeStr = this.formatTime(timeInSeconds);
            
            if (timer.isStopwatch) {
                // ASC mode: show elapsed time
                return `${defaultAlert.description} (${timeStr})`;
            } else {
                // DSC mode: show remaining time but with context
                if (defaultAlert.description === '1 minuto transcurrido') {
                    const elapsedTime = totalSeconds - timeInSeconds;
                    return `1 min transcurrido (quedan ${timeStr})`;
                } else if (defaultAlert.description === 'Falta 1 minuto') {
                    return `Falta 1 minuto (${timeStr})`;
                } else if (defaultAlert.description === 'Tiempo terminado') {
                    return `Tiempo terminado (${timeStr})`;
                } else {
                    return `${defaultAlert.description} (${timeStr})`;
                }
            }
        } else {
            // For custom alerts, just show the time
            return this.formatTime(timeInSeconds);
        }
    }

    setupTimelineDragAndDrop(overlay, timerId) {
        const timeline = overlay.querySelector('.bell-timeline');
        if (!timeline) return;

        // Timeline setup without click-to-add functionality
        // Only drag and drop functionality remains active for existing bells
    }

    selectBellDot(bellDot, overlay, timerId) {
        // Remove selection from all other bells
        const allBells = overlay.querySelectorAll('.bell-dot');
        allBells.forEach(bell => {
            bell.classList.remove('selected');
        });

        // Add selection to clicked bell
        bellDot.classList.add('selected');

        // Enable delete button
        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn.classList.remove('disabled');
        }

        // Store selected bell reference
        overlay.selectedBell = bellDot;
    }

    deleteSelectedBell(overlay, timerId) {
        const selectedBell = overlay.selectedBell;
        if (!selectedBell) return;

        // Remove the selected bell
        selectedBell.remove();

        // Disable delete button
        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn.classList.add('disabled');
        }

        // Clear selection reference
        overlay.selectedBell = null;

        // Auto-save timeline (this will also update the bell config button visual state)
        this.autoSaveTimeline(overlay, timerId);
    }

    deselectAllBells(overlay) {
        // Remove selection from all bells
        const allBells = overlay.querySelectorAll('.bell-dot');
        allBells.forEach(bell => {
            bell.classList.remove('selected');
        });

        // Disable delete button
        const deleteBtn = overlay.querySelector('.delete-bell-btn');
        if (deleteBtn) {
            deleteBtn.classList.add('disabled');
        }

        // Clear selection reference
        overlay.selectedBell = null;
    }

    setupSoundControls(cardElement, timer) {
        // Sound test button
        const soundTestBtn = cardElement.querySelector('.timer-btn-compact.sound-test');
        if (soundTestBtn) {
            soundTestBtn.addEventListener('click', () => {
                timerManager.playBell(1);
            });
        }

        // Sound switch (new interruptor)
        const soundSwitchInput = cardElement.querySelector('.sound-switch-input');
        if (soundSwitchInput) {
            // Set initial state
            const isEnabled = timer.bellEnabled !== false;
            soundSwitchInput.checked = isEnabled;
            
            soundSwitchInput.addEventListener('change', () => {
                const newState = soundSwitchInput.checked;
                
                timerManager.toggleTimerBell(timer.id, newState);
                
                // Update visual feedback
                this.updateSoundToggleVisual(cardElement, newState);
            });
        }
        
        // Update initial visual state
        this.updateSoundToggleVisual(cardElement, timer.bellEnabled !== false);
    }

    updateSoundToggleVisual(cardElement, isEnabled) {
        const soundSwitchInput = cardElement.querySelector('.sound-switch-input');
        const soundTestBtn = cardElement.querySelector('.timer-btn-compact.sound-test');
        const bellConfigBtn = cardElement.querySelector('.timer-btn-compact.bell-config');
        
        // Update switch state
        if (soundSwitchInput) {
            soundSwitchInput.checked = isEnabled;
        }
        
        // Update test button
        if (soundTestBtn) {
            if (isEnabled) {
                soundTestBtn.disabled = false;
                soundTestBtn.title = 'Probar campanada';
            } else {
                soundTestBtn.disabled = true;
                soundTestBtn.title = 'Campanadas desactivadas';
            }
        }
        
        // Enable/disable bell config button
        if (bellConfigBtn) {
            if (isEnabled) {
                bellConfigBtn.classList.remove('disabled');
                bellConfigBtn.style.pointerEvents = 'auto';
                bellConfigBtn.title = 'Configurar campanadas';
            } else {
                bellConfigBtn.classList.add('disabled');
                bellConfigBtn.style.pointerEvents = 'none';
                bellConfigBtn.title = 'Configuración deshabilitada - Activa las campanadas primero';
            }
        }
    }
}

export const timerHandlers = new TimerHandlers(); 