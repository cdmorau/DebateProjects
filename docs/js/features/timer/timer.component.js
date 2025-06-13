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
                <div class="timer-footer" style="display: none;">
                    <div class="slider-group" data-value="7 min">
                        <input type="range" class="preset-slider minutes-slider" min="0" max="30" step="1" value="7">
                    </div>
                    <button class="add-timer-compact round" title="Agregar Timer">
                        <span class="add-text">Add</span>
                        <span class="preset-time">07:15</span>
                    </button>
                    <div class="slider-group" data-value="0 seg">
                        <input type="range" class="preset-slider seconds-slider" min="0" max="55" step="5" value="0">
                    </div>
                </div>
            </div>
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

            // Initialize existing timer functionality
            try {
    
                if (typeof initTimer === 'function') {
                    initTimer();
                } else {
                    console.warn('initTimer function not available, trying to import...');
                    // Try to re-import if not available
                    const timerInit = await import('./timer.init.js');
                    if (timerInit.initTimer) {
                        timerInit.initTimer();
                    }
                }

                // Additional verification and re-initialization if needed
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Ensure timerManager is properly initialized
                const { timerManager } = await import('./timer.manager.js');
                if (!timerManager.isInitialized) {
                    console.log('Initializing timerManager...');
                    timerManager.init();
                }
                
                // Verify the add button has event listeners
                const addButton = container.querySelector('.add-timer-compact');
                if (addButton && !addButton.hasAttribute('data-initialized')) {
                    console.log('Re-initializing add button...');
                    
                    // Simple direct approach
                    const minutesSlider = container.querySelector('.timer-footer .minutes-slider');
                    const secondsSlider = container.querySelector('.timer-footer .seconds-slider');
                    const presetTimeDisplay = addButton.querySelector('.preset-time');
                    
                    if (minutesSlider && secondsSlider && presetTimeDisplay) {
                        // Update preset time display
                        const updatePresetTime = () => {
                            const minutes = minutesSlider.value.toString().padStart(2, '0');
                            const seconds = secondsSlider.value.toString().padStart(2, '0');
                            presetTimeDisplay.textContent = `${minutes}:${seconds}`;
                        };
                        
                        updatePresetTime();
                        minutesSlider.addEventListener('input', updatePresetTime);
                        secondsSlider.addEventListener('input', updatePresetTime);
                        
                        // Add click listener
                        addButton.addEventListener('click', async () => {
                            console.log('Add button clicked directly!', { 
                                minutes: minutesSlider.value, 
                                seconds: secondsSlider.value 
                            });
                            
                            try {
                                timerManager.addTimer(null, parseInt(minutesSlider.value), parseInt(secondsSlider.value));
                                console.log('Timer added successfully');
                            } catch (error) {
                                console.error('Error adding timer:', error);
                            }
                        });
                        
                        addButton.setAttribute('data-initialized', 'true');
                        console.log('Add button initialized directly');
                    } else {
                        console.warn('Missing elements for direct add button setup');
                        
                        // Fallback to handlers approach
                        const { timerHandlers } = await import('./timer.handlers.js');
                        timerHandlers.setupAddButton();
                        addButton.setAttribute('data-initialized', 'true');
                    }
                }

            } catch (initError) {
                console.error('Error during timer initialization:', initError);
                // Continue anyway - the basic HTML is loaded
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
    cleanup() {
        if (this.container) {
            // Stop any running timers
            const timers = this.container.querySelectorAll('.timer-card-compact');
            timers.forEach(timer => {
                const playButton = timer.querySelector('.play-pause');
                if (playButton && playButton.textContent === '⏸') {
                    playButton.click(); // Stop the timer
                }
            });

            // Clear container
            this.container.innerHTML = '';
        }
        
        this.isInitialized = false;

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