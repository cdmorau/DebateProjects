/**
 * Break Predict Component - Modular break prediction with dynamic HTML loading
 * Integrates with existing break prediction functionality while being self-contained
 */
import { initBreakPredict } from './breakPredict.init.js';
import { preloader } from '../../common/preloader.js';

export class BreakPredictComponent {
    constructor() {
        this.container = null;
        this.isLoaded = false;
        this.isInitialized = false;
        this.cachedHTML = null;
    }

    /**
     * Load the break predict component HTML
     */
    async loadHTML() {
        if (this.isLoaded) {
            return this.cachedHTML;
        }

        // Try to get from preloader cache first
        const cachedHTML = preloader.getComponent('breakPredict');
        if (cachedHTML) {
            this.isLoaded = true;
            this.cachedHTML = cachedHTML;
            return cachedHTML;
        }

        // Fallback to direct fetch if not preloaded
        try {
            const response = await fetch('./views/break-predict/break-predict.html');
            if (!response.ok) {
                throw new Error(`Failed to load break predict HTML: ${response.status}`);
            }
            
            const html = await response.text();
            this.isLoaded = true;
            this.cachedHTML = html;
            return html;
        } catch (error) {
            console.error('Error loading break predict HTML:', error);
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
                    <div class="break-predict-header">
                        <h2>Break Predict</h2>
                        <div class="header-actions">
                            <button id="import-teams-btn" class="btn btn-secondary">Import Data</button>
                            <button id="export-data-btn" class="btn btn-secondary">Export Data</button>
                            <button id="clear-data-btn" class="btn btn-danger">Clear All</button>
                        </div>
                    </div>

                    <div class="tabs-container">
                        <div class="tabs">
                            <button class="tab-btn active" data-tab="teams">Teams</button>
                            <button class="tab-btn" data-tab="rounds">Rounds</button>
                            <button class="tab-btn" data-tab="predictions">Predictions</button>
                        </div>

                        <div class="tab-content active" id="teams-tab">
                            <div class="add-team-section">
                                <h3>Add Team</h3>
                                <div class="form-group">
                                    <input type="text" id="team-name-input" placeholder="Team Name" class="form-input">
                                    <input type="text" id="speaker1-input" placeholder="Speaker 1" class="form-input">
                                    <input type="text" id="speaker2-input" placeholder="Speaker 2" class="form-input">
                                    <button id="add-team-btn" class="btn btn-primary">Add Team</button>
                                </div>
                            </div>
                            <div id="teams-list" class="teams-list">
                                <!-- Teams will be populated here -->
                            </div>
                        </div>

                        <div class="tab-content" id="rounds-tab">
                            <div class="rounds-header">
                                <h3>Round Results</h3>
                                <div class="rounds-controls">
                                    <button id="add-round-btn" class="btn btn-primary">Add Round</button>
                                    <select id="current-round-select" class="form-select">
                                        <option value="">Select Round</option>
                                    </select>
                                </div>
                            </div>
                            <div id="rounds-table" class="rounds-table-container">
                                <!-- Rounds table will be populated here -->
                            </div>
                        </div>

                        <div class="tab-content" id="predictions-tab">
                            <div class="predictions-header">
                                <h3>Break Predictions</h3>
                            </div>
                            <div id="predictions-table" class="predictions-table-container">
                                <!-- Predictions table will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hidden file input for import -->
            <input type="file" id="import-file-input" accept=".json" style="display: none;">
        `;
    }

    /**
     * Initialize the break predict component
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
            const teamsTab = container.querySelector('#teams-tab');
            
            if (!teamsTab) {
                throw new Error('Failed to create break predict structure after HTML injection');
            }

            // Initialize existing break predict functionality
            try {
                if (typeof initBreakPredict === 'function') {
                    initBreakPredict();
                } else {
                    // Try to re-import if not available
                    const breakPredictInit = await import('./breakPredict.init.js');
                    if (breakPredictInit.initBreakPredict) {
                        breakPredictInit.initBreakPredict();
                    }
                }
            } catch (initError) {
                console.error('Error during break predict initialization:', initError);
                // Continue anyway - the basic HTML is loaded
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing break predict component:', error);
            // Fallback: ensure we have basic structure
            if (!this.container.querySelector('#teams-tab')) {
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
            const inputs = this.container.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
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
export const breakPredictComponent = new BreakPredictComponent(); 