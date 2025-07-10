/**
 * Timer Component - Modular timer with dynamic HTML loading
 * Integrates with existing timer functionality while being self-contained
 */
import { initTimer } from './timer.init.js';
import { preloader } from '../../common/preloader.js';

export class TimerComponent {
    constructor() {
        this.container = null;
        this.isLoaded = false;
        this.isInitialized = false;
        this.cachedHTML = null;
    }

    /**
     * Load the timer component HTML
     */
    async loadHTML() {
        if (this.isLoaded) {
            return this.cachedHTML;
        }

        // Try to get from preloader cache first
        const cachedHTML = preloader.getComponent('timer');
        if (cachedHTML) {
            this.isLoaded = true;
            this.cachedHTML = cachedHTML;
            return cachedHTML;
        }

        // Fallback to direct fetch if not preloaded
        try {
            const response = await fetch('./views/timer/timer.html');
            if (!response.ok) {
                throw new Error(`Failed to load timer HTML: ${response.status}`);
            }
            
            const html = await response.text();
            this.isLoaded = true;
            this.cachedHTML = html;
            return html;
        } catch (error) {
            console.error('Error loading timer HTML:', error);
            // Fallback to existing HTML structure
            const fallback = this.getFallbackHTML();
            this.cachedHTML = fallback;
            return fallback;
        }
    }

    /**
     * Fallback HTML if external file fails to load
     */
    getFallbackHTML() {
        return `
            <div class="container">
                <div class="main-content">
                    <div class="visualization">
                        <div class="timer-section-new">
                            <div class="timers-container">
                                <div class="timers-grid" id="timers-grid">
                                    <!-- Timers will be added here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button class="toggle-add-section" title="Mostrar/Ocultar sección de agregar">
                    <span class="toggle-icon">+</span>
                </button>
                
                <!-- Footer con botones de tiempo rápido - solo visible con un timer -->
                <div class="quick-time-footer" id="quick-time-footer" style="display: none;">
                    <div class="quick-time-buttons">
                        <button class="quick-time-btn" data-preset="bpspeech" title="7:00 - Discurso BP">
                            <span class="time-label">7:00</span>
                            <span class="preset-label">Discurso</span>
                        </button>
                        <button class="quick-time-btn" data-preset="preptime" title="15:00 - Tiempo de preparación">
                            <span class="time-label">15:00</span>
                            <span class="preset-label">Prep Time</span>
                        </button>
                        <button class="quick-time-btn" data-preset="deliberation" title="20:00 - Deliberación">
                            <span class="time-label">20:00</span>
                            <span class="preset-label">Deliberación</span>
                        </button>
                    </div>
                </div>
                
                <div class="timer-footer" style="display: none;">
                    <div class="slider-group" data-value="7 min">
                        <input type="range" class="preset-slider minutes-slider" min="0" max="30" step="1" value="7">
                    </div>
                    <button class="add-timer-compact round" title="Agregar Timer">
                        <span class="add-text">Add</span>
                        <span class="preset-time">07:00</span>
                    </button>
                    <div class="slider-group" data-value="0 seg">
                        <input type="range" class="preset-slider seconds-slider" min="0" max="55" step="5" value="0">
                    </div>
                </div>
            </div>
            
            <!-- Timer Card Template -->
            <template id="timer-card-template">
                <div class="timer-card-compact">
                    <div class="timer-card-header">
                        <span class="timer-name-compact" contenteditable="true">Timer 1</span>
                        <div class="timer-status-indicator"></div>
                        <button class="floating-timer-compact" title="Abrir ventana flotante">📌</button>
                        <button class="pip-timer-compact" title="Picture-in-Picture">🎭</button>
                        <button class="fullscreen-timer-compact" title="Pantalla completa">⛶</button>
                        <button class="remove-timer-compact">×</button>
                    </div>
                    
                    <div class="timer-display-compact">
                        <div class="time-display-large">
                            <div class="time-group">
                                <span class="time-number minutes">07</span>
                            </div>
                            <span class="time-separator">:</span>
                            <div class="time-group">
                                <span class="time-number seconds">15</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timer-controls-compact">
                        <button class="timer-btn-compact config" title="Configurar timer">⚙️</button>
                        <button class="timer-btn-compact mode-toggle" title="Alternar Timer/Cronómetro" data-mode="timer">DSC</button>
                        <button class="timer-btn-compact play-pause" title="Play/Pause">▶</button>
                        <button class="timer-btn-compact reset" title="Reset">⏹</button>
                        <button class="timer-btn-compact sound-test" title="Probar ding">
                            <img src="sounds/campana.png" alt="🔔" class="bell-icon">
                        </button>
                        <div class="sound-switch-container">
                            <label class="sound-switch">
                                <input type="checkbox" class="sound-switch-input" checked>
                                <span class="sound-switch-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </template>
        `;
    }

    /**
     * Initialize the timer component
     */
    async init(container) {
        if (this.isInitialized) return;

        this.container = container;
        
        try {
    
            
            // Always load HTML dynamically (since we removed it from index.html)

            const html = await this.loadHTML();
            container.innerHTML = html;
            
            // Wait for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verify the grid was created
            const timersGrid = container.querySelector('#timers-grid');

            
            if (!timersGrid) {
                throw new Error('Failed to create timers-grid after HTML injection');
            }

            // Initialize NEW global timer system
            try {
                if (typeof initTimer === 'function') {
                    initTimer();
                } else {
                    const timerInit = await import('./timer.init.js');
                    if (timerInit.initTimer) {
                        timerInit.initTimer();
                    }
                }
            } catch (initError) {
                console.error('Error during timer initialization:', initError);
            }

            this.isInitialized = true;

        } catch (error) {
            console.error('Error initializing timer component:', error);
            // Fallback: ensure we have basic structure
            if (!this.container.querySelector('#timers-grid')) {
    
                this.container.innerHTML = this.getFallbackHTML();
            }
        }
    }

    /**
     * Cleanup when component is destroyed
     */
    async cleanup() {
        if (this.container) {
            // Just clean up the DOM - timers continue running globally
            this.container.innerHTML = '';
        }
        
        // Reset initialization flag to allow re-initialization
        this.isInitialized = false;
        
        // Clean up body styles
        document.body.style.paddingBottom = '0px';
        document.body.classList.remove('quick-footer-visible');
        
        // Hide quick time footer
        const quickTimeFooter = document.getElementById('quick-time-footer');
        if (quickTimeFooter) {
            quickTimeFooter.style.display = 'none';
        }
    }

    /**
     * Check if component is ready
     */
    isReady() {
        return this.isInitialized && this.container;
    }

    /**
     * Get component container
     */
    getContainer() {
        return this.container;
    }
}

// Export singleton instance
export const timerComponent = new TimerComponent(); 