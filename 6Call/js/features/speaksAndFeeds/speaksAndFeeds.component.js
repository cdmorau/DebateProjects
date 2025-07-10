/**
 * Speaks & Feeds Component - Modular evaluation tables with dynamic HTML loading
 * Integrates with existing speaksAndFeeds functionality while being self-contained
 */
import { initSpeaksAndFeeds } from './speaksAndFeeds.init.js';
import { preloader } from '../../common/preloader.js';

export class SpeaksAndFeedsComponent {
    constructor() {
        this.container = null;
        this.isLoaded = false;
        this.isInitialized = false;
        this.cachedHTML = null;
    }

    /**
     * Load the speaks and feeds component HTML
     */
    async loadHTML() {
        if (this.isLoaded) {
            return this.cachedHTML;
        }

        // Try to get from preloader cache first
        const cachedHTML = preloader.getComponent('speaksFeeds');
        if (cachedHTML) {
            this.isLoaded = true;
            this.cachedHTML = cachedHTML;
            return cachedHTML;
        }

        // Fallback to direct fetch if not preloaded
        try {
            const response = await fetch('./views/speaks/speaks.html');
            if (!response.ok) {
                throw new Error(`Failed to load speaks HTML: ${response.status}`);
            }
            
            const html = await response.text();
            this.isLoaded = true;
            this.cachedHTML = html;
            return html;
        } catch (error) {
            console.error('Error loading speaks HTML:', error);
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
            <div class="content-wrapper max-width-900">
                <div class="form-section">
                    <select id="table-selector" class="styled-select">
                        <option value="athenas">Puntos de Orador</option>
                        <option value="feedback">Feedback jueza principal</option>
                        <option value="panel">Feedback panelista/trainee</option>
                        <option value="demian">Tabla Demian</option>
                        <option value="eva">Tabla Eva</option>
                        <option value="evaPanelist">Tabla Eva Panelistas</option>
                        <option value="wsdc">Puntos de Orador (WSDC)</option>
                        <option value="wsdcReply">Discursos de Réplica (WSDC)</option>
                    </select>
                </div>
                
                <div id="athenas-section" class="table-section">
                    <div class="score-slider-container">
                        <div class="score-display">
                            <span id="athenas-display-calif" class="score-number">75</span>
                        </div>
                        <input type="range" id="athenas-score-calif" min="50" max="100" step="1" value="75" class="score-slider athenas-slider">
                        <div class="slider-labels">
                            <span class="slider-label-start">50</span>
                            <span class="slider-label-mid">75</span>
                            <span class="slider-label-end">100</span>
                        </div>
                    </div>
                    <div id="athenas-description-calif" class="description-box min-height-120"></div>
                </div>
                
                <!-- Other sections would be here in a real fallback -->
            </div>
        `;
    }

    /**
     * Initialize the speaks and feeds component
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
            
            // Verify essential elements exist
            const tableSelector = container.querySelector('#table-selector');

            
            if (!tableSelector) {
                throw new Error('Failed to create table-selector after HTML injection');
            }

            // Initialize existing speaks and feeds functionality
            try {
    
                if (typeof initSpeaksAndFeeds === 'function') {
                    initSpeaksAndFeeds();
                } else {
                    console.warn('initSpeaksAndFeeds function not available, trying to import...');
                    // Try to re-import if not available
                    const speaksInit = await import('./speaksAndFeeds.init.js');
                    if (speaksInit.initSpeaksAndFeeds) {
                        speaksInit.initSpeaksAndFeeds();
                    }
                }

            } catch (initError) {
                console.error('Error during speaks & feeds initialization:', initError);
                // Continue anyway - the basic HTML is loaded
            }

            this.isInitialized = true;

        } catch (error) {
            console.error('Error initializing speaks & feeds component:', error);
            // Fallback: ensure we have basic structure
            if (!this.container.querySelector('#table-selector')) {
    
                this.container.innerHTML = this.getFallbackHTML();
            }
        }
    }

    /**
     * Cleanup when component is destroyed
     */
    cleanup() {
        if (this.container) {
            // Clear any active timers or intervals if they exist
            // Reset any form states
            const sliders = this.container.querySelectorAll('input[type="range"]');
            sliders.forEach(slider => {
                // Reset to default values
                slider.value = slider.getAttribute('value') || slider.min;
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
export const speaksAndFeedsComponent = new SpeaksAndFeedsComponent(); 