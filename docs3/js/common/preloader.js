/**
 * Component Preloader
 * Preloads all component HTML files to eliminate loading lag
 */

class ComponentPreloader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.isPreloading = false;
    }

    /**
     * Preload all component HTML files
     */
    async preloadAll() {
        if (this.isPreloading) {
            return;
        }

        this.isPreloading = true;
        
        const components = [
            { name: 'timer', path: './views/timer/timer.html' },
            { name: 'callManager', path: './views/call-manager/call-manager.html' },
            { name: 'speaksFeeds', path: './views/speaks/speaks.html' },
            { name: 'breakPredict', path: './views/break-predict/break-predict.html' }
        ];

        // Start all downloads in parallel
        const loadPromises = components.map(component => 
            this.preloadComponent(component.name, component.path)
        );

        try {
            await Promise.all(loadPromises);
        } catch (error) {
            // Silently handle preload errors
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * Preload a specific component
     */
    async preloadComponent(name, path) {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        // Avoid duplicate requests
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = this.fetchComponent(name, path);
        this.loadingPromises.set(name, loadPromise);

        try {
            const html = await loadPromise;
            this.cache.set(name, html);
            this.loadingPromises.delete(name);
            return html;
        } catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }

    /**
     * Fetch component HTML
     */
    async fetchComponent(name, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${name}: ${response.status}`);
            }
            
            const html = await response.text();
            return html;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get cached component HTML
     */
    getComponent(name) {
        return this.cache.get(name);
    }

    /**
     * Check if component is cached
     */
    isComponentCached(name) {
        return this.cache.has(name);
    }

    /**
     * Get cache status
     */
    getCacheStatus() {
        const status = {};
        for (const [name] of this.cache) {
            status[name] = 'cached';
        }
        for (const [name] of this.loadingPromises) {
            status[name] = 'loading';
        }
        return status;
    }

    /**
     * Clear cache (useful for development)
     */
    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    /**
     * Preload with progress callback
     */
    async preloadWithProgress(onProgress) {
        const components = [
            { name: 'timer', path: './views/timer/timer.html' },
            { name: 'callManager', path: './views/call-manager/call-manager.html' },
            { name: 'speaksFeeds', path: './views/speaks/speaks.html' },
            { name: 'breakPredict', path: './views/break-predict/break-predict.html' }
        ];

        let completed = 0;
        const total = components.length;

        const loadPromises = components.map(async (component) => {
            try {
                await this.preloadComponent(component.name, component.path);
                completed++;
                if (onProgress) {
                    onProgress(completed, total, component.name);
                }
            } catch (error) {
                completed++;
                if (onProgress) {
                    onProgress(completed, total, component.name, error);
                }
            }
        });

        await Promise.all(loadPromises);
    }
}

// Export singleton instance
export const preloader = new ComponentPreloader();

// Export class for testing
export { ComponentPreloader }; 