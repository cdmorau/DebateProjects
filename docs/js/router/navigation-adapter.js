/**
 * Navigation Adapter - Bridges new router with existing navigation system
 * Allows gradual migration without breaking current functionality
 */
import { router } from './router.js';

export class NavigationAdapter {
    constructor() {
        this.tabs = {
            mainMenu: document.getElementById('main-menu'),
            callManager: document.getElementById('main-tab'),
            calificaciones: document.getElementById('calificaciones-tab'),
            timer: document.getElementById('timer-tab'),
            breakPredict: document.getElementById('break-predict-tab'),
        };
        
        this.routeToTab = {
            '/': 'mainMenu',
            '/home': 'mainMenu',
            '/call-manager': 'callManager',
            '/speaks': 'calificaciones',
            '/timer': 'timer',
            '/break-predict': 'breakPredict'
        };
        
        this.tabToRoute = {
            'mainMenu': '/',
            'callManager': '/call-manager',
            'calificaciones': '/speaks',
            'timer': '/timer',
            'breakPredict': '/break-predict'
        };
    }

    /**
     * Initialize the adapter
     */
    init() {
        this.setupRouterHooks();
        this.setupExistingNavigation();
    }

    /**
     * Setup router hooks to handle tab switching
     */
    setupRouterHooks() {
        router.setHooks(
            // Before route change
            async (fromRoute, toRoute) => {
        
            },
            // After route change
            async (toRoute) => {
                const tabName = this.routeToTab[toRoute];
                if (tabName) {
                    this.showTab(tabName);
                }
            }
        );
    }

    /**
     * Setup existing navigation to work with router
     */
    setupExistingNavigation() {
        // Intercept existing button clicks
        const buttons = {
            'go-call-manager': '/call-manager',
            'go-calificaciones': '/speaks',
            'go-timer': '/timer',
            'go-break-predict': '/break-predict'
        };

        Object.entries(buttons).forEach(([buttonId, route]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                // Remove existing listeners by cloning the element
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add new router-aware listener
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    router.navigate(route);
                });
            }
        });

        // Handle navbar navigation
        this.setupNavbarNavigation();
    }

    /**
     * Setup navbar navigation with router
     */
    setupNavbarNavigation() {
        // Nav bar title (home)
        const navTitle = document.querySelector('.nav-bar-title');
        if (navTitle) {
            const newNavTitle = navTitle.cloneNode(true);
            navTitle.parentNode.replaceChild(newNavTitle, navTitle);
            newNavTitle.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigate('/');
            });
        }

        // Nav dropdown items
        const navItems = {
            'nav-home': '/',
            'nav-call-manager': '/call-manager',
            'nav-speaks-feeds': '/speaks',
            'nav-timer': '/timer',
            'nav-break-predict': '/break-predict'
        };

        Object.entries(navItems).forEach(([itemId, route]) => {
            const item = document.getElementById(itemId);
            if (item) {
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
                newItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    router.navigate(route);
                    // Close nav menu
                    document.querySelector('.nav-menu').classList.remove('active');
                });
            }
        });
    }

    /**
     * Show tab (existing functionality)
     */
    showTab(tabName) {
        // Hide all tabs
        Object.values(this.tabs).forEach(tab => {
            if (tab) tab.classList.add('hidden');
        });

        // Show selected tab
        if (this.tabs[tabName]) {
            this.tabs[tabName].classList.remove('hidden');
            
            // Special handling for different tabs
            if (tabName === 'callManager') {
                // Call manager component initialization is handled by the router
                // This ensures proper lazy loading and cleanup
    
            } else if (tabName === 'timer') {
                // Timer component initialization is handled by the router
                // This ensures proper lazy loading and cleanup

            } else if (tabName === 'calificaciones') {
                // Speaks & feeds component initialization is handled by the router
                // This ensures proper lazy loading and cleanup

            }
        }

        // Update mobile tabs visibility
        this.updateMobileTabs(tabName);
    }

    /**
     * Update mobile tabs visibility (existing functionality)
     */
    updateMobileTabs(activeTab) {
        const mobileTabs = document.querySelector('.mobile-tabs');
        const body = document.body;
        
        if (activeTab === 'callManager') {
            mobileTabs?.classList.add('show');
            body.classList.add('show-mobile-tabs');
        } else {
            mobileTabs?.classList.remove('show');
            body.classList.remove('show-mobile-tabs');
        }
    }

    /**
     * Navigate to tab using router
     */
    navigateToTab(tabName) {
        const route = this.tabToRoute[tabName];
        if (route) {
            router.navigate(route);
        }
    }
}

export const navigationAdapter = new NavigationAdapter(); 