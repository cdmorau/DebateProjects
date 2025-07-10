/**
 * Timer Floating Window - True Picture-in-Picture functionality for timer cards
 * Creates floating windows that stay on top of ALL applications using Document PiP API
 */

class TimerFloating {
    constructor() {
        this.floatingWindows = new Map(); // timerId -> PiP window reference
        this.syncIntervals = new Map(); // timerId -> interval reference for syncing
        this.floatingWindowsData = new Map(); // timerId -> { timer, originalElement }
        this.pipSupported = this.checkPiPSupport();
        this.fallbackWindows = new Map(); // Fallback for unsupported browsers
        this.zIndexCounter = 1000; // For internal floating windows
    }

    /**
     * Check if Picture-in-Picture is supported
     */
    checkPiPSupport() {
        // Check for Document Picture-in-Picture API
        if ('documentPictureInPicture' in window) {
            return 'document';
        }
        // Check for regular Picture-in-Picture API (for fallback)
        if ('pictureInPictureEnabled' in document) {
            return 'video';
        }
        return false;
    }

    /**
     * Check if we're likely in a fullscreen environment (macOS specific)
     */
    isLikelyFullscreenEnvironment() {
        // Check if we're on macOS
        const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        
        if (!isMac) return false;

        // Check for fullscreen API state
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement ||
                           document.msFullscreenElement;

        // Check viewport characteristics that suggest fullscreen mode
        const isLikelyFullscreen = window.innerHeight === screen.height && 
                                  window.innerWidth === screen.width;

        return isFullscreen || isLikelyFullscreen;
    }

    /**
     * Show fullscreen limitation warning
     */
    showFullscreenWarning() {
        // Create warning notification
        const warning = document.createElement('div');
        warning.className = 'fullscreen-pip-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <div class="warning-icon">⚠️</div>
                                 <div class="warning-text">
                     <strong>Limitación de macOS</strong><br>
                     Las ventanas flotantes pueden no aparecer sobre aplicaciones en pantalla completa.
                     <br><br>
                     <strong>Sugerencias:</strong><br>
                     • Sal de pantalla completa (⌘+F o Esc)<br>
                     • Usa el modo ventana normal<br>
                     • La ventana aparecerá cuando cambies de app<br>
                     • En Mission Control, arrastra la ventana del timer a "Todos los escritorios"
                 </div>
                <button class="warning-close">×</button>
            </div>
        `;

        // Add warning styles
        if (!document.querySelector('#fullscreen-warning-styles')) {
            const styles = document.createElement('style');
            styles.id = 'fullscreen-warning-styles';
            styles.textContent = `
                .fullscreen-pip-warning {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ff6b6b, #ffa500);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    max-width: 350px;
                    animation: slideInRight 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .warning-content {
                    padding: 20px;
                    display: flex;
                    gap: 15px;
                    align-items: flex-start;
                    position: relative;
                }

                .warning-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .warning-text {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .warning-close {
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

                .warning-close:hover {
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
                    .fullscreen-pip-warning {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(warning);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => {
                    if (warning.parentNode) {
                        warning.parentNode.removeChild(warning);
                    }
                }, 300);
            }
        }, 8000);

        // Close button functionality
        const closeBtn = warning.querySelector('.warning-close');
        closeBtn.addEventListener('click', () => {
            warning.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (warning.parentNode) {
                    warning.parentNode.removeChild(warning);
                }
            }, 300);
        });
    }

    /**
     * Create Picture-in-Picture floating window for a timer
     */
    async createFloatingWindow(timerId, timerElement, timer) {
        // Check if floating window already exists
        if (this.floatingWindows.has(timerId)) {
            this.focusFloatingWindow(timerId);
            return;
        }

        // Store references first
        this.floatingWindowsData.set(timerId, { timer, originalElement: timerElement });

        // Check for fullscreen environment and warn user
        if (this.isLikelyFullscreenEnvironment()) {
            this.showFullscreenWarning();
        }

        try {
            let pipWindow;

            if (this.pipSupported === 'document') {
                // Use Document Picture-in-Picture API (Chrome 116+)
                pipWindow = await this.createDocumentPiP(timerId, timer);
            } else if (this.pipSupported === 'video') {
                // Fallback: Use video Picture-in-Picture with canvas
                pipWindow = await this.createVideoPiP(timerId, timer);
            } else {
                // Final fallback: Use window.open with special flags
                pipWindow = await this.createPopupFallback(timerId, timer);
            }

            if (!pipWindow) {
                throw new Error('Failed to create floating window');
            }

            // Store window reference
            this.floatingWindows.set(timerId, pipWindow);

            // Setup synchronization
            this.setupTimerSync(timerId, pipWindow);

            // Update main window button state
            this.updateFloatingButtonState(timerElement, true);

            return pipWindow;

        } catch (error) {
            console.error('Error creating floating window:', error);
            
            // Final fallback to internal floating window
            return this.createInternalFallback(timerId, timerElement, timer);
        }
    }

    /**
     * Create Document Picture-in-Picture window (Chrome 116+)
     */
    async createDocumentPiP(timerId, timer) {
        // Enhanced configuration for better macOS fullscreen compatibility
        const config = {
            width: 350,
            height: 250,
            disallowReturnToOpener: false,
        };

        // Add macOS-specific positioning if detected
        const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        if (isMac) {
            // Position in top-right corner for better visibility
            config.width = 320;
            config.height = 220;
        }

        const pipWindow = await window.documentPictureInPicture.requestWindow(config);

        // Setup the PiP window document
        this.setupPiPDocument(pipWindow, timerId, timer);

        // Handle window close
        pipWindow.addEventListener('pagehide', () => {
            this.closeFloatingWindow(timerId);
        });

        return pipWindow;
    }

    /**
     * Create Video Picture-in-Picture fallback
     */
    async createVideoPiP(timerId, timer) {
        // Create a canvas element for the timer display
        const canvas = document.createElement('canvas');
        canvas.width = 350;
        canvas.height = 250;
        document.body.appendChild(canvas);

        // Create video element from canvas stream
        const stream = canvas.captureStream(30); // 30 FPS
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        
        document.body.appendChild(video);
        await video.play();

        // Request Picture-in-Picture
        const pipWindow = await video.requestPictureInPicture();

        // Setup canvas drawing for timer
        this.setupCanvasTimer(canvas, timerId, timer);

        // Store canvas and video references for cleanup
        this.fallbackWindows.set(timerId, { canvas, video, pipWindow });

        // Setup responsive sizing for canvas
        this.setupCanvasResponsiveTimer(canvas, timerId);

        // Handle PiP exit
        video.addEventListener('leavepictureinpicture', () => {
            this.closeFloatingWindow(timerId);
        });

        return pipWindow;
    }

    /**
     * Create popup window fallback
     */
    async createPopupFallback(timerId, timer) {
        const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        
        // Enhanced features for better macOS compatibility
        const features = [
            'width=350',
            'height=250',
            'resizable=yes',
            'scrollbars=no',
            'status=no',
            'menubar=no',
            'toolbar=no',
            'location=no',
            'directories=no',
            'alwaysRaised=yes',
            'topmost=yes'
        ];

        // Add macOS-specific flags
        if (isMac) {
            features.push('titlebar=no');
            features.push('chrome=no');
            features.push('modal=no');
            features.push('dialog=no');
        }

        const featuresString = features.join(',');

        const popupWindow = window.open('', `timer-pip-${timerId}`, featuresString);
        
        if (!popupWindow) {
            throw new Error('Popup blocked or failed to open');
        }

        // Setup popup content
        this.setupPiPDocument(popupWindow, timerId, timer);

        // Handle window close
        popupWindow.addEventListener('beforeunload', () => {
            this.closeFloatingWindow(timerId);
        });

        return popupWindow;
    }

    /**
     * Final fallback to internal floating window
     */
    createInternalFallback(timerId, timerElement, timer) {
        console.warn('Using internal fallback for floating window');
        
        // Create internal floating window (previous implementation)
        const floatingWindow = this.createFloatingContainer(timerId, timer);
        document.body.appendChild(floatingWindow);

        this.floatingWindows.set(timerId, floatingWindow);
        this.setupFloatingWindowContent(floatingWindow, timerId, timer);
        this.setupDragAndResize(floatingWindow, timerId);
        this.positionFloatingWindow(floatingWindow, timerElement);
        
        // Setup responsive sizing for internal window
        this.setupInternalWindowResponsive(floatingWindow, timerId);
        
        setTimeout(() => {
            floatingWindow.classList.add('show');
        }, 10);

        return floatingWindow;
    }

    /**
     * Setup Picture-in-Picture document content
     */
    setupPiPDocument(pipWindow, timerId, timer) {
        const doc = pipWindow.document;
        
        // Setup document head with styles
        doc.head.innerHTML = `
            <title>Timer - ${timer.name}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    overflow: hidden;
                    user-select: none;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .pip-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 15px;
                }
                
                .pip-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .pip-title {
                    font-size: 14px;
                    font-weight: 600;
                    opacity: 0.9;
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .pip-status {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-left: 10px;
                    background-color: #ff6b6b;
                    transition: all 0.3s ease;
                }
                
                .pip-status.running {
                    background-color: #51cf66;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.2); }
                }
                
                .pip-display {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 15px;
                }
                
                .pip-time {
                    font-size: 3rem;
                    font-weight: 300;
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                    text-align: center;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    line-height: 1;
                    transition: all 0.2s ease;
                }
                
                .pip-time:hover {
                    transform: scale(1.05);
                    cursor: pointer;
                }
                
                .pip-controls {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .pip-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    min-width: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                }
                
                .pip-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .pip-btn:active {
                    transform: translateY(0);
                }
                
                .pip-btn.play-pause {
                    background: rgba(76, 175, 80, 0.3);
                    border-color: rgba(76, 175, 80, 0.5);
                }
                
                .pip-btn.play-pause:hover {
                    background: rgba(76, 175, 80, 0.5);
                }
                
                .pip-btn.reset {
                    background: rgba(244, 67, 54, 0.3);
                    border-color: rgba(244, 67, 54, 0.5);
                }
                
                .pip-btn.reset:hover {
                    background: rgba(244, 67, 54, 0.5);
                }
                
                .pip-btn.mode-toggle {
                    font-size: 11px;
                    font-weight: 600;
                    min-width: 50px;
                }
                
                .pip-btn.mode-toggle.desc {
                    background: rgba(33, 150, 243, 0.3);
                    border-color: rgba(33, 150, 243, 0.5);
                }
                
                .pip-btn.mode-toggle.desc:hover {
                    background: rgba(33, 150, 243, 0.5);
                }
                
                .pip-btn.mode-toggle.asc {
                    background: rgba(255, 152, 0, 0.3);
                    border-color: rgba(255, 152, 0, 0.5);
                }
                
                .pip-btn.mode-toggle.asc:hover {
                    background: rgba(255, 152, 0, 0.5);
                }
                
                /* Responsive adjustments */
                @media (max-width: 400px) {
                    .pip-time {
                        font-size: 2.5rem;
                    }
                    
                    .pip-controls {
                        gap: 8px;
                    }
                    
                    .pip-btn {
                        padding: 6px 10px;
                        font-size: 12px;
                        min-width: 35px;
                    }
                    
                    .pip-container {
                        padding: 10px;
                    }
                }
            </style>
        `;

        // Setup document body
        doc.body.innerHTML = `
            <div class="pip-container">
                <div class="pip-header">
                    <div class="pip-title">${timer.name}</div>
                    <div class="pip-status ${timer.isRunning ? 'running' : ''}"></div>
                </div>
                
                <div class="pip-display">
                    <div class="pip-time" id="pip-time-${timerId}">
                        ${this.formatTimeDisplay(timer.currentMinutes, timer.currentSeconds)}
                    </div>
                </div>
                
                <div class="pip-controls">
                    <button class="pip-btn mode-toggle ${timer.isStopwatch ? 'asc' : 'desc'}" 
                            id="pip-mode-${timerId}" 
                            title="${timer.isStopwatch ? 'Modo Cronómetro' : 'Modo Timer'}">
                        ${timer.isStopwatch ? 'ASC' : 'DESC'}
                    </button>
                    <button class="pip-btn play-pause" id="pip-play-${timerId}" title="${timer.isRunning ? 'Pausar' : 'Iniciar'}">
                        ${timer.isRunning ? '⏸' : '▶'}
                    </button>
                    <button class="pip-btn reset" id="pip-reset-${timerId}" title="Reiniciar">
                        ⏹
                    </button>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupPiPControls(doc, timerId);

        // Setup responsive timer sizing
        this.setupResponsiveTimer(pipWindow, doc, timerId);
    }

    /**
     * Setup Picture-in-Picture controls
     */
    setupPiPControls(doc, timerId) {
        // Play/Pause button
        const playBtn = doc.getElementById(`pip-play-${timerId}`);
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.triggerMainWindowAction(timerId, 'play-pause');
            });
        }

        // Reset button
        const resetBtn = doc.getElementById(`pip-reset-${timerId}`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.triggerMainWindowAction(timerId, 'reset');
            });
        }

        // Mode toggle button
        const modeBtn = doc.getElementById(`pip-mode-${timerId}`);
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                this.triggerMainWindowAction(timerId, 'mode-toggle');
            });
        }

        // Keyboard shortcuts
        doc.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.triggerMainWindowAction(timerId, 'play-pause');
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.triggerMainWindowAction(timerId, 'reset');
                    }
                    break;
            }
        });
    }

    /**
     * Setup canvas-based timer for video PiP
     */
    setupCanvasTimer(canvas, timerId, timer) {
        const ctx = canvas.getContext('2d');
        
        const drawTimer = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const data = this.floatingWindowsData.get(timerId);
            if (data) {
                const { timer } = data;
                
                // Timer name
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(timer.name, canvas.width / 2, 30);
                
                // Time display
                ctx.fillStyle = 'white';
                ctx.font = 'bold 48px monospace';
                ctx.textAlign = 'center';
                const timeText = this.formatTimeDisplay(timer.currentMinutes, timer.currentSeconds);
                ctx.fillText(timeText, canvas.width / 2, canvas.height / 2 + 15);
                
                // Status indicator
                const statusColor = timer.isRunning ? '#51cf66' : '#ff6b6b';
                ctx.fillStyle = statusColor;
                ctx.beginPath();
                ctx.arc(canvas.width / 2 + 60, 30, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // Mode indicator
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
                const modeText = timer.isStopwatch ? 'ASC' : 'DESC';
                ctx.fillText(modeText, canvas.width / 2, canvas.height - 20);
            }
        };
        
        // Initial draw
        drawTimer();
        
        // Store draw function for updates
        this.fallbackWindows.get(timerId).drawTimer = drawTimer;
    }

    /**
     * Setup responsive timer sizing based on window dimensions
     */
    setupResponsiveTimer(pipWindow, doc, timerId) {
        // Function to calculate optimal timer font size
        const calculateTimerSize = () => {
            const windowWidth = pipWindow.innerWidth || 350;
            const windowHeight = pipWindow.innerHeight || 250;
            
            // Calculate font size based on window dimensions
            // Use the smaller dimension to ensure it fits
            const baseFontSize = Math.min(windowWidth / 6, windowHeight / 4);
            
            // Set minimum and maximum sizes
            const minSize = 24;
            const maxSize = 120;
            const finalSize = Math.max(minSize, Math.min(maxSize, baseFontSize));
            
            return finalSize;
        };

        // Function to update timer size
        const updateTimerSize = () => {
            const newSize = calculateTimerSize();
            const timeDisplay = doc.querySelector('.pip-time');
            
            if (timeDisplay) {
                timeDisplay.style.fontSize = `${newSize}px`;
                
                // Also adjust container padding based on size
                const container = doc.querySelector('.pip-container');
                if (container) {
                    const padding = Math.max(10, Math.min(25, newSize / 4));
                    container.style.padding = `${padding}px`;
                }

                // Adjust controls size
                const controls = doc.querySelectorAll('.pip-btn');
                const controlSize = Math.max(12, Math.min(16, newSize / 6));
                controls.forEach(btn => {
                    btn.style.fontSize = `${controlSize}px`;
                    const btnPadding = Math.max(6, Math.min(12, controlSize / 2));
                    btn.style.padding = `${btnPadding}px ${btnPadding * 1.5}px`;
                });

                // Adjust header
                const header = doc.querySelector('.pip-title');
                if (header) {
                    const headerSize = Math.max(12, Math.min(18, newSize / 4));
                    header.style.fontSize = `${headerSize}px`;
                }
            }
        };

        // Initial size calculation
        updateTimerSize();

        // Setup ResizeObserver for dynamic resizing
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(entries => {
                updateTimerSize();
            });

            // Observe the window body for size changes
            resizeObserver.observe(doc.body);

            // Store observer for cleanup
            if (!this.resizeObservers) {
                this.resizeObservers = new Map();
            }
            this.resizeObservers.set(timerId, resizeObserver);
        } else {
            // Fallback: poll for size changes
            const pollInterval = setInterval(() => {
                updateTimerSize();
            }, 500);

            // Store interval for cleanup
            if (!this.pollIntervals) {
                this.pollIntervals = new Map();
            }
            this.pollIntervals.set(timerId, pollInterval);
        }

        // Also listen for window resize events
        pipWindow.addEventListener('resize', updateTimerSize);
    }

    /**
     * Setup responsive sizing for canvas-based timer
     */
    setupCanvasResponsiveTimer(canvas, timerId) {
        const updateCanvasSize = () => {
            const data = this.fallbackWindows.get(timerId);
            if (!data) return;

            // Get current video element size (PiP window size)
            const video = data.video;
            const rect = video.getBoundingClientRect();
            
            // Update canvas size to match
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = Math.max(280, rect.width);
                canvas.height = Math.max(180, rect.height);
                
                // Redraw with new size
                if (data.drawTimer) {
                    data.drawTimer();
                }
            }
        };

        // Setup ResizeObserver for video element
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(entries => {
                updateCanvasSize();
            });

            const video = this.fallbackWindows.get(timerId).video;
            if (video) {
                resizeObserver.observe(video);

                // Store observer for cleanup
                if (!this.resizeObservers) {
                    this.resizeObservers = new Map();
                }
                this.resizeObservers.set(`${timerId}-canvas`, resizeObserver);
            }
        }
    }

    /**
     * Update canvas drawing with responsive sizing
     */
    updateCanvasTimer(canvas, timerId, timer) {
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate responsive font sizes
        const baseFontSize = Math.min(canvas.width / 6, canvas.height / 4);
        const timeFontSize = Math.max(24, Math.min(72, baseFontSize));
        const nameFontSize = Math.max(12, Math.min(20, timeFontSize / 3));
        const modeFontSize = Math.max(10, Math.min(16, timeFontSize / 4));
        
        // Timer name
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${nameFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(timer.name, canvas.width / 2, nameFontSize + 10);
        
        // Time display
        ctx.fillStyle = 'white';
        ctx.font = `bold ${timeFontSize}px monospace`;
        ctx.textAlign = 'center';
        const timeText = this.formatTimeDisplay(timer.currentMinutes, timer.currentSeconds);
        ctx.fillText(timeText, canvas.width / 2, canvas.height / 2 + timeFontSize / 2);
        
        // Status indicator
        const statusColor = timer.isRunning ? '#51cf66' : '#ff6b6b';
        const indicatorSize = Math.max(4, Math.min(8, timeFontSize / 8));
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + timeFontSize, nameFontSize + 10, indicatorSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Mode indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${modeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        const modeText = timer.isStopwatch ? 'ASC' : 'DESC';
        ctx.fillText(modeText, canvas.width / 2, canvas.height - modeFontSize);
    }

    /**
     * Setup responsive sizing for internal floating windows
     */
    setupInternalWindowResponsive(floatingWindow, timerId) {
        // Function to calculate optimal timer font size
        const calculateTimerSize = () => {
            const rect = floatingWindow.getBoundingClientRect();
            const windowWidth = rect.width || 350;
            const windowHeight = rect.height || 250;
            
            // Calculate font size based on window dimensions
            const baseFontSize = Math.min(windowWidth / 6, windowHeight / 4);
            
            // Set minimum and maximum sizes
            const minSize = 24;
            const maxSize = 120;
            const finalSize = Math.max(minSize, Math.min(maxSize, baseFontSize));
            
            return finalSize;
        };

        // Function to update timer size
        const updateTimerSize = () => {
            const newSize = calculateTimerSize();
            const timeDisplay = floatingWindow.querySelector('.time-display');
            
            if (timeDisplay) {
                timeDisplay.style.fontSize = `${newSize}px`;
                
                // Also adjust container padding based on size
                const container = floatingWindow.querySelector('.floating-content');
                if (container) {
                    const padding = Math.max(15, Math.min(30, newSize / 4));
                    container.style.padding = `${padding}px`;
                }

                // Adjust controls size
                const controls = floatingWindow.querySelectorAll('.floating-btn');
                const controlSize = Math.max(12, Math.min(16, newSize / 6));
                controls.forEach(btn => {
                    btn.style.fontSize = `${controlSize}px`;
                    const btnPadding = Math.max(8, Math.min(12, controlSize / 2));
                    btn.style.padding = `${btnPadding}px ${btnPadding * 1.5}px`;
                });

                // Adjust header
                const header = floatingWindow.querySelector('.floating-header h3');
                if (header) {
                    const headerSize = Math.max(14, Math.min(20, newSize / 4));
                    header.style.fontSize = `${headerSize}px`;
                }

                // Adjust resize handles
                const resizeHandles = floatingWindow.querySelectorAll('.resize-handle');
                const handleSize = Math.max(8, Math.min(12, newSize / 8));
                resizeHandles.forEach(handle => {
                    handle.style.width = `${handleSize}px`;
                    handle.style.height = `${handleSize}px`;
                });
            }
        };

        // Initial size calculation
        updateTimerSize();

        // Setup ResizeObserver for dynamic resizing
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(entries => {
                updateTimerSize();
            });

            // Observe the floating window for size changes
            resizeObserver.observe(floatingWindow);

            // Store observer for cleanup
            if (!this.resizeObservers) {
                this.resizeObservers = new Map();
            }
            this.resizeObservers.set(`${timerId}-internal`, resizeObserver);
        } else {
            // Fallback: poll for size changes
            const pollInterval = setInterval(() => {
                updateTimerSize();
            }, 500);

            // Store interval for cleanup
            if (!this.pollIntervals) {
                this.pollIntervals = new Map();
            }
            this.pollIntervals.set(`${timerId}-internal`, pollInterval);
        }
    }

    /**
     * Create floating window container
     */
    createFloatingContainer(timerId, timer) {
        const container = document.createElement('div');
        container.className = 'timer-floating-window';
        container.id = `floating-${timerId}`;
        container.style.zIndex = ++this.zIndexCounter;
        
        return container;
    }

    /**
     * Setup content for floating window
     */
    setupFloatingWindowContent(floatingWindow, timerId, timer) {
        floatingWindow.innerHTML = `
            <div class="floating-window-header">
                <div class="floating-window-title">${timer.name}</div>
                <div class="floating-window-controls">
                    <button class="floating-minimize" title="Minimizar">−</button>
                    <button class="floating-close" title="Cerrar">×</button>
                </div>
            </div>
            
            <div class="floating-window-content">
                <div class="floating-timer-display">
                    <div class="floating-status-indicator ${timer.isRunning ? 'running' : ''}"></div>
                    <div class="floating-time" id="floating-time-${timerId}">
                        ${this.formatTimeDisplay(timer.currentMinutes, timer.currentSeconds)}
                    </div>
                </div>
                
                <div class="floating-controls">
                    <button class="floating-btn mode-toggle ${timer.isStopwatch ? 'asc' : 'desc'}" 
                            id="floating-mode-${timerId}" 
                            title="${timer.isStopwatch ? 'Modo Cronómetro' : 'Modo Timer'}">
                        ${timer.isStopwatch ? 'ASC' : 'DESC'}
                    </button>
                    <button class="floating-btn play-pause" id="floating-play-${timerId}" title="${timer.isRunning ? 'Pausar' : 'Iniciar'}">
                        ${timer.isRunning ? '⏸' : '▶'}
                    </button>
                    <button class="floating-btn reset" id="floating-reset-${timerId}" title="Reiniciar">
                        ⏹
                    </button>
                </div>
            </div>
            
            <div class="floating-resize-handle"></div>
        `;

        // Setup event listeners for floating window controls
        this.setupFloatingWindowControls(floatingWindow, timerId);
    }

    /**
     * Setup controls for floating window
     */
    setupFloatingWindowControls(floatingWindow, timerId) {
        // Close button
        const closeBtn = floatingWindow.querySelector('.floating-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeFloatingWindow(timerId);
            });
        }

        // Minimize button
        const minimizeBtn = floatingWindow.querySelector('.floating-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.toggleMinimize(floatingWindow, timerId);
            });
        }

        // Play/Pause button
        const playBtn = floatingWindow.querySelector(`#floating-play-${timerId}`);
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.triggerMainWindowAction(timerId, 'play-pause');
            });
        }

        // Reset button
        const resetBtn = floatingWindow.querySelector(`#floating-reset-${timerId}`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.triggerMainWindowAction(timerId, 'reset');
            });
        }

        // Mode toggle button
        const modeBtn = floatingWindow.querySelector(`#floating-mode-${timerId}`);
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                this.triggerMainWindowAction(timerId, 'mode-toggle');
            });
        }

        // Window keyboard shortcuts
        floatingWindow.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.triggerMainWindowAction(timerId, 'play-pause');
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.triggerMainWindowAction(timerId, 'reset');
                    }
                    break;
                case 'Escape':
                    this.closeFloatingWindow(timerId);
                    break;
            }
        });

        // Make window focusable
        floatingWindow.tabIndex = -1;
    }

    /**
     * Setup drag and resize functionality
     */
    setupDragAndResize(floatingWindow, timerId) {
        const header = floatingWindow.querySelector('.floating-window-header');
        const resizeHandle = floatingWindow.querySelector('.floating-resize-handle');

        // Dragging
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.floating-window-controls')) return;
            
            isDragging = true;
            const rect = floatingWindow.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            floatingWindow.classList.add('dragging');
            floatingWindow.style.zIndex = ++this.zIndexCounter;
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            e.preventDefault();
        });

        const handleDrag = (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            // Keep window within viewport
            const maxX = window.innerWidth - floatingWindow.offsetWidth;
            const maxY = window.innerHeight - floatingWindow.offsetHeight;
            
            floatingWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            floatingWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        };

        const stopDrag = () => {
            isDragging = false;
            floatingWindow.classList.remove('dragging');
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        // Resizing
        let isResizing = false;
        let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            const rect = floatingWindow.getBoundingClientRect();
            resizeStart.x = e.clientX;
            resizeStart.y = e.clientY;
            resizeStart.width = rect.width;
            resizeStart.height = rect.height;
            
            floatingWindow.classList.add('resizing');
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        });

        const handleResize = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;
            
            const newWidth = Math.max(280, resizeStart.width + deltaX);
            const newHeight = Math.max(180, resizeStart.height + deltaY);
            
            floatingWindow.style.width = newWidth + 'px';
            floatingWindow.style.height = newHeight + 'px';
        };

        const stopResize = () => {
            isResizing = false;
            floatingWindow.classList.remove('resizing');
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };

        // Double-click header to toggle minimize
        header.addEventListener('dblclick', (e) => {
            if (e.target.closest('.floating-window-controls')) return;
            this.toggleMinimize(floatingWindow, timerId);
        });
    }

    /**
     * Position floating window near original element
     */
    positionFloatingWindow(floatingWindow, originalElement) {
        const rect = originalElement.getBoundingClientRect();
        const windowWidth = 320;
        const windowHeight = 220;
        
        // Calculate position
        let left = rect.right + 20;
        let top = rect.top;
        
        // Keep within viewport
        if (left + windowWidth > window.innerWidth) {
            left = rect.left - windowWidth - 20;
        }
        if (left < 0) {
            left = 20;
        }
        
        if (top + windowHeight > window.innerHeight) {
            top = window.innerHeight - windowHeight - 20;
        }
        if (top < 0) {
            top = 20;
        }
        
        floatingWindow.style.left = left + 'px';
        floatingWindow.style.top = top + 'px';
        floatingWindow.style.width = windowWidth + 'px';
        floatingWindow.style.height = windowHeight + 'px';
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize(floatingWindow, timerId) {
        const isMinimized = floatingWindow.classList.contains('minimized');
        
        if (isMinimized) {
            floatingWindow.classList.remove('minimized');
            floatingWindow.querySelector('.floating-minimize').textContent = '−';
            floatingWindow.querySelector('.floating-minimize').title = 'Minimizar';
        } else {
            floatingWindow.classList.add('minimized');
            floatingWindow.querySelector('.floating-minimize').textContent = '□';
            floatingWindow.querySelector('.floating-minimize').title = 'Restaurar';
        }
    }

    /**
     * Trigger actions in main window from floating window
     */
    triggerMainWindowAction(timerId, action) {
        const data = this.floatingWindowsData.get(timerId);
        if (!data) return;

        const { originalElement } = data;
        let button = null;

        switch(action) {
            case 'play-pause':
                button = originalElement.querySelector('.play-pause');
                break;
            case 'reset':
                button = originalElement.querySelector('.reset');
                break;
            case 'mode-toggle':
                button = originalElement.querySelector('.mode-toggle');
                break;
        }

        if (button) {
            button.click();
        }
    }

    /**
     * Setup synchronization between main window and floating window
     */
    setupTimerSync(timerId, floatingWindow) {
        if (this.syncIntervals.has(timerId)) {
            clearInterval(this.syncIntervals.get(timerId));
        }

        const syncInterval = setInterval(() => {
            this.syncFloatingWindow(timerId, floatingWindow);
        }, 100); // Sync every 100ms for smooth updates

        this.syncIntervals.set(timerId, syncInterval);
    }

    /**
     * Sync floating window with main timer state
     */
    syncFloatingWindow(timerId, pipWindow) {
        const data = this.floatingWindowsData.get(timerId);
        if (!data) return;

        const { timer, originalElement } = data;

        // Check if this is a Document PiP or popup window
        if (pipWindow && pipWindow.document) {
            this.syncPiPDocument(pipWindow.document, timerId, timer, originalElement);
        }
        
        // Check if this is a video PiP (canvas-based)
        const fallbackData = this.fallbackWindows.get(timerId);
        if (fallbackData && fallbackData.drawTimer) {
            fallbackData.drawTimer();
        }
        
        // Check if this is an internal floating window
        if (pipWindow && pipWindow.querySelector) {
            this.syncInternalWindow(pipWindow, timerId, timer, originalElement);
        }
    }

    /**
     * Sync Picture-in-Picture document
     */
    syncPiPDocument(doc, timerId, timer, originalElement) {
        // Update time display
        const timeDisplay = doc.getElementById(`pip-time-${timerId}`);
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTimeDisplay(timer.currentMinutes, timer.currentSeconds);
        }

        // Update play/pause button
        const playBtn = doc.getElementById(`pip-play-${timerId}`);
        if (playBtn) {
            playBtn.textContent = timer.isRunning ? '⏸' : '▶';
            playBtn.title = timer.isRunning ? 'Pausar' : 'Iniciar';
        }

        // Update status indicator
        const statusIndicator = doc.querySelector('.pip-status');
        if (statusIndicator) {
            statusIndicator.classList.toggle('running', timer.isRunning);
        }

        // Update mode button
        const modeBtn = doc.getElementById(`pip-mode-${timerId}`);
        if (modeBtn) {
            modeBtn.textContent = timer.isStopwatch ? 'ASC' : 'DESC';
            modeBtn.title = timer.isStopwatch ? 'Modo Cronómetro' : 'Modo Timer';
            modeBtn.className = `pip-btn mode-toggle ${timer.isStopwatch ? 'asc' : 'desc'}`;
        }

        // Update window title and header
        const timerName = originalElement.querySelector('.timer-name-compact');
        if (timerName) {
            const newName = timerName.textContent.trim();
            
            // Update document title
            if (doc.title !== `Timer - ${newName}`) {
                doc.title = `Timer - ${newName}`;
            }
            
            // Update header title
            const headerTitle = doc.querySelector('.pip-title');
            if (headerTitle && headerTitle.textContent !== newName) {
                headerTitle.textContent = newName;
            }
        }
    }

    /**
     * Sync internal floating window
     */
    syncInternalWindow(floatingWindow, timerId, timer, originalElement) {
        // Update time display
        const timeDisplay = floatingWindow.querySelector(`#floating-time-${timerId}`);
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTimeDisplay(timer.currentMinutes, timer.currentSeconds);
        }

        // Update play/pause button
        const playBtn = floatingWindow.querySelector(`#floating-play-${timerId}`);
        if (playBtn) {
            playBtn.textContent = timer.isRunning ? '⏸' : '▶';
            playBtn.title = timer.isRunning ? 'Pausar' : 'Iniciar';
        }

        // Update status indicator
        const statusIndicator = floatingWindow.querySelector('.floating-status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.toggle('running', timer.isRunning);
        }

        // Update mode button
        const modeBtn = floatingWindow.querySelector(`#floating-mode-${timerId}`);
        if (modeBtn) {
            modeBtn.textContent = timer.isStopwatch ? 'ASC' : 'DESC';
            modeBtn.title = timer.isStopwatch ? 'Modo Cronómetro' : 'Modo Timer';
            modeBtn.className = `floating-btn mode-toggle ${timer.isStopwatch ? 'asc' : 'desc'}`;
        }

        // Update window title
        const timerName = originalElement.querySelector('.timer-name-compact');
        const windowTitle = floatingWindow.querySelector('.floating-window-title');
        if (timerName && windowTitle) {
            const newName = timerName.textContent.trim();
            if (windowTitle.textContent !== newName) {
                windowTitle.textContent = newName;
            }
        }
    }

    /**
     * Format time for display
     */
    formatTimeDisplay(minutes, seconds) {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Close floating window
     */
    closeFloatingWindow(timerId) {
        // Clear sync interval
        if (this.syncIntervals.has(timerId)) {
            clearInterval(this.syncIntervals.get(timerId));
            this.syncIntervals.delete(timerId);
        }

        // Clean up resize observers
        if (this.resizeObservers) {
            const observer = this.resizeObservers.get(timerId);
            if (observer) {
                observer.disconnect();
                this.resizeObservers.delete(timerId);
            }
            
            const canvasObserver = this.resizeObservers.get(`${timerId}-canvas`);
            if (canvasObserver) {
                canvasObserver.disconnect();
                this.resizeObservers.delete(`${timerId}-canvas`);
            }
            
            const internalObserver = this.resizeObservers.get(`${timerId}-internal`);
            if (internalObserver) {
                internalObserver.disconnect();
                this.resizeObservers.delete(`${timerId}-internal`);
            }
        }

        // Clean up poll intervals
        if (this.pollIntervals) {
            const interval = this.pollIntervals.get(timerId);
            if (interval) {
                clearInterval(interval);
                this.pollIntervals.delete(timerId);
            }
            
            const internalInterval = this.pollIntervals.get(`${timerId}-internal`);
            if (internalInterval) {
                clearInterval(internalInterval);
                this.pollIntervals.delete(`${timerId}-internal`);
            }
        }

        // Get the floating window
        const pipWindow = this.floatingWindows.get(timerId);
        
        if (pipWindow) {
            try {
                // Close Document PiP window
                if (pipWindow.close && typeof pipWindow.close === 'function') {
                    pipWindow.close();
                }
                
                // Handle video PiP cleanup
                const fallbackData = this.fallbackWindows.get(timerId);
                if (fallbackData) {
                    const { canvas, video } = fallbackData;
                    
                    // Exit PiP if active
                    if (document.pictureInPictureElement === video) {
                        document.exitPictureInPicture();
                    }
                    
                    // Clean up elements
                    if (canvas && canvas.parentNode) {
                        canvas.parentNode.removeChild(canvas);
                    }
                    if (video && video.parentNode) {
                        video.parentNode.removeChild(video);
                    }
                    
                    this.fallbackWindows.delete(timerId);
                }
                
                // Handle internal floating window
                if (pipWindow.classList && pipWindow.classList.contains('timer-floating-window')) {
                    pipWindow.classList.add('hide');
                    setTimeout(() => {
                        if (pipWindow.parentNode) {
                            pipWindow.parentNode.removeChild(pipWindow);
                        }
                    }, 200);
                }
                
            } catch (error) {
                console.warn('Error closing floating window:', error);
            }
        }

        // Clean up references
        this.floatingWindows.delete(timerId);
        const data = this.floatingWindowsData.get(timerId);
        if (data) {
            this.updateFloatingButtonState(data.originalElement, false);
        }
        this.floatingWindowsData.delete(timerId);
    }

    /**
     * Focus existing floating window
     */
    focusFloatingWindow(timerId) {
        const pipWindow = this.floatingWindows.get(timerId);
        if (pipWindow) {
            try {
                // Focus Document PiP or popup window
                if (pipWindow.focus && typeof pipWindow.focus === 'function') {
                    pipWindow.focus();
                }
                
                // For internal floating window
                if (pipWindow.classList && pipWindow.classList.contains('timer-floating-window')) {
                    pipWindow.style.zIndex = ++this.zIndexCounter;
                    pipWindow.focus();
                    
                    // Flash effect to indicate focus
                    pipWindow.classList.add('flash');
                    setTimeout(() => {
                        pipWindow.classList.remove('flash');
                    }, 300);
                }
                
                return true;
            } catch (error) {
                console.warn('Error focusing floating window:', error);
            }
        }
        return false;
    }

    /**
     * Update floating button state in main window
     */
    updateFloatingButtonState(timerElement, isFloating) {
        const floatingBtn = timerElement.querySelector('.floating-timer-compact');
        if (floatingBtn) {
            if (isFloating) {
                floatingBtn.classList.add('active');
                floatingBtn.title = 'Cerrar ventana flotante';
                floatingBtn.textContent = '🪟';
            } else {
                floatingBtn.classList.remove('active');
                floatingBtn.title = 'Abrir ventana flotante';
                floatingBtn.textContent = '📌';
            }
        }
    }

    /**
     * Check if timer has floating window
     */
    hasFloatingWindow(timerId) {
        return this.floatingWindows.has(timerId);
    }

    /**
     * Close all floating windows
     */
    closeAllFloatingWindows() {
        for (const timerId of this.floatingWindows.keys()) {
            this.closeFloatingWindow(timerId);
        }

        // Final cleanup of any remaining observers/intervals
        if (this.resizeObservers) {
            this.resizeObservers.forEach(observer => observer.disconnect());
            this.resizeObservers.clear();
        }
        
        if (this.pollIntervals) {
            this.pollIntervals.forEach(interval => clearInterval(interval));
            this.pollIntervals.clear();
        }
    }

    /**
     * Get floating window for timer
     */
    getFloatingWindow(timerId) {
        return this.floatingWindows.get(timerId);
    }
}

// Export singleton instance
export const timerFloating = new TimerFloating(); 