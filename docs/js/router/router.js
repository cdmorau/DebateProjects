/**
 * Simple Hash-based Router for GitHub Pages compatibility
 * Works alongside existing navigation system during migration
 */
export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeRouteChange = null;
        this.afterRouteChange = null;
    }

    /**
     * Add a route to the router
     * @param {string} path - Route path (without #)
     * @param {Object} config - Route configuration
     */
    addRoute(path, config) {
        this.routes.set(path, {
            component: config.component,
            init: config.init,
            cleanup: config.cleanup,
            title: config.title || 'Debtools'
        });
    }

    /**
     * Initialize the router
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial route
        this.handleRoute();
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Handle route changes
     */
    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/'; // Remove # and default to /
        const route = this.routes.get(hash);

        if (!route) {
            console.warn(`Route not found: ${hash}`);
            this.navigate('/'); // Fallback to home
            return;
        }

        // Call before route change hook
        if (this.beforeRouteChange) {
            await this.beforeRouteChange(this.currentRoute, hash);
        }

        // Cleanup previous route
        if (this.currentRoute && this.routes.get(this.currentRoute)?.cleanup) {
            await this.routes.get(this.currentRoute).cleanup();
        }

        // Initialize new route
        if (route.init) {
            await route.init();
        }

        // Update document title
        document.title = route.title;

        // Update current route
        this.currentRoute = hash;

        // Call after route change hook
        if (this.afterRouteChange) {
            await this.afterRouteChange(hash);
        }


    }

    /**
     * Set hooks for route changes
     */
    setHooks(beforeChange, afterChange) {
        this.beforeRouteChange = beforeChange;
        this.afterRouteChange = afterChange;
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
}

// Export singleton instance
export const router = new Router(); 