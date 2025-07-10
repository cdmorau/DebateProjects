/**
 * Navigation Module
 * Handles all navigation logic for the main application
 */

import { callManagerView } from './features/callManager/callManager.view.js';

export class NavigationManager {
    constructor() {
        this.currentTab = 'main-menu';
        this.init();
    }

    init() {
        this.setupMenuToggle();
        this.setupNavigationListeners();
        this.setupMobileTabNavigation();
    }

    setupMenuToggle() {
        // Menu toggle functionality
        const menuButton = document.querySelector('.nav-menu-button');
        const menu = document.querySelector('.nav-menu');

        menuButton?.addEventListener('click', (event) => {
            event.stopPropagation();
            menu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!menu.contains(event.target)) {
                menu.classList.remove('active');
            }
        });
    }

    setupNavigationListeners() {
        // Debtools title navigation
        document.querySelector('.nav-bar-title')?.addEventListener('click', () => {
            this.navigateToHome();
        });

        // Nav menu items
        document.getElementById('nav-home')?.addEventListener('click', () => {
            this.navigateToHome();
        });

        document.getElementById('nav-call-manager')?.addEventListener('click', () => {
            this.navigateToCallManager();
        });

        document.getElementById('nav-speaks-feeds')?.addEventListener('click', () => {
            this.navigateToSpeaksFeeds();
        });

        document.getElementById('nav-timer')?.addEventListener('click', () => {
            this.navigateToTimer();
        });
    }

    setupMobileTabNavigation() {
        console.log('🔧 Setting up mobile tab navigation...');
        
        // Mobile Tab Navigation - Use event delegation since elements might not exist yet
        document.addEventListener('click', (event) => {
            const button = event.target.closest('.mobile-tab-button');
            if (button) {
                console.log(`🔥 CLICK EVENT on button with data-tab="${button.getAttribute('data-tab')}"`);
                event.preventDefault();
                event.stopPropagation();
                const tabName = button.getAttribute('data-tab');
                this.switchMobileTab(tabName);
            }
        });
        
        console.log('📱 Mobile tab navigation setup complete (using event delegation)');
    }
    
    initializeMobileTabState() {
        console.log('🚀 Initializing mobile tab state...');
        
        // Ensure judges section is visible by default and discussion is hidden
        const judgesSection = document.querySelector('.mobile-judges-section');
        const comparisonSection = document.querySelector('.mobile-comparison-section');
        
        console.log('📍 Initial elements check:');
        console.log('  - judgesSection:', judgesSection);
        console.log('  - comparisonSection:', comparisonSection);
        
        if (judgesSection && comparisonSection) {
            judgesSection.classList.remove('hidden');
            comparisonSection.classList.remove('active');
            
            console.log('  ✅ Set initial visibility states');
            
            // Ensure the judges tab button is active by default
            const judgesButton = document.querySelector('[data-tab="judges"]');
            const discussionButton = document.querySelector('[data-tab="discussion"]');
            
            console.log('📍 Button elements check:');
            console.log('  - judgesButton:', judgesButton);
            console.log('  - discussionButton:', discussionButton);
            
            if (judgesButton) {
                judgesButton.classList.add('active');
                console.log('  ✅ Set judges button as active');
            }
            if (discussionButton) {
                discussionButton.classList.remove('active');
                console.log('  ✅ Removed active from discussion button');
            }
            
            console.log('🔍 Final initialization state:');
            console.log('  - judgesSection classes:', judgesSection.className);
            console.log('  - comparisonSection classes:', comparisonSection.className);
        } else {
            console.log('❌ Could not find required sections for mobile tab initialization');
        }
    }

    navigateToHome() {
        this.hideAllTabs();
        document.getElementById('main-menu')?.classList.remove('hidden');
        this.hideMobileTabs();
        this.updateActiveNavItem('nav-home');
        this.closeNavMenu();
        this.currentTab = 'main-menu';
    }

    navigateToCallManager() {
        console.log('🏛️ Navigating to Call Manager...');
        
        this.hideAllTabs();
        document.getElementById('main-tab')?.classList.remove('hidden');
        this.showMobileTabs();
        this.updateActiveNavItem('nav-call-manager');
        this.closeNavMenu();
        this.currentTab = 'call-manager';
        
        // Mobile tab initialization is now handled by the router after HTML loads
    }

    navigateToSpeaksFeeds() {
        this.hideAllTabs();
        document.getElementById('calificaciones-tab')?.classList.remove('hidden');
        this.hideMobileTabs();
        this.updateActiveNavItem('nav-speaks-feeds');
        this.closeNavMenu();
        this.currentTab = 'speaks-feeds';
    }

    navigateToTimer() {
        this.hideAllTabs();
        document.getElementById('timer-tab')?.classList.remove('hidden');
        this.hideMobileTabs();
        this.updateActiveNavItem('nav-timer');
        this.closeNavMenu();
        this.currentTab = 'timer';
    }

    hideAllTabs() {
        const tabs = [
            'main-menu',
            'main-tab',
            'calificaciones-tab',
            'timer-tab'
        ];

        tabs.forEach(tabId => {
            document.getElementById(tabId)?.classList.add('hidden');
        });
    }

    showMobileTabs() {
        const mobileTabs = document.querySelector('.mobile-tabs');
        const body = document.body;
        mobileTabs?.classList.add('show');
        body.classList.add('show-mobile-tabs');
    }

    hideMobileTabs() {
        const mobileTabs = document.querySelector('.mobile-tabs');
        const body = document.body;
        mobileTabs?.classList.remove('show');
        body.classList.remove('show-mobile-tabs');
    }

    updateActiveNavItem(activeId) {
        document.querySelectorAll('.nav-dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(activeId)?.classList.add('active');
    }

    closeNavMenu() {
        document.querySelector('.nav-menu')?.classList.remove('active');
    }

    switchMobileTab(tabName) {
        console.log(`🔄 switchMobileTab called with tabName: "${tabName}"`);
        
        // Ocultar todas las secciones móviles y remover 'active'
        document.querySelector('.mobile-judges-section')?.classList.add('hidden');
        document.querySelector('.mobile-judges-section')?.classList.remove('active');
        document.querySelector('.mobile-comparison-section')?.classList.add('hidden');
        document.querySelector('.mobile-comparison-section')?.classList.remove('active');
        document.querySelector('.mobile-voting-section')?.classList.add('hidden');
        document.querySelector('.mobile-voting-section')?.classList.remove('active');
        // Quitar clase activa de todos los botones
        document.querySelectorAll('.mobile-tab-button').forEach(btn => btn.classList.remove('active'));
        // Mostrar la sección correspondiente
        if (tabName === 'judges') {
            document.querySelector('.mobile-judges-section')?.classList.remove('hidden');
            document.querySelector('.mobile-judges-section')?.classList.add('active');
        } else if (tabName === 'discussion') {
            document.querySelector('.mobile-comparison-section')?.classList.remove('hidden');
            document.querySelector('.mobile-comparison-section')?.classList.add('active');
            // Actualizar las comparaciones cuando se cambia a la pestaña de discusión
            console.log('🔍 Attempting to update comparisons...');
            console.log('  - callManagerView available:', !!callManagerView);
            console.log('  - updateComparisons method available:', !!(callManagerView && callManagerView.updateComparisons));
            
            if (callManagerView && callManagerView.updateComparisons) {
                console.log('  ✅ Calling updateComparisons()');
                callManagerView.updateComparisons();
                console.log('  ✅ updateComparisons() called successfully');
                
                // Verificar si el elemento comparison-grid existe y tiene contenido
                const comparisonGrid = document.getElementById('comparison-grid');
                console.log('  - comparison-grid element:', comparisonGrid);
                console.log('  - comparison-grid innerHTML length:', comparisonGrid ? comparisonGrid.innerHTML.length : 'N/A');
                console.log('  - comparison-grid children count:', comparisonGrid ? comparisonGrid.children.length : 'N/A');
            } else {
                console.log('  ❌ callManagerView or updateComparisons not available');
            }
        } else if (tabName === 'voting') {
            document.querySelector('.mobile-voting-section')?.classList.remove('hidden');
            document.querySelector('.mobile-voting-section')?.classList.add('active');
        }
        // Activar el botón correspondiente
        document.querySelector(`.mobile-tab-button[data-tab="${tabName}"]`)?.classList.add('active');
    }

    // Public method to get current tab
    getCurrentTab() {
        return this.currentTab;
    }
    
    // Public method to setup mobile tabs after HTML is loaded
    setupMobileTabsAfterLoad() {
        console.log('🔄 Setting up mobile tabs after HTML load...');
        this.debugMobileTabsDOM();
        this.initializeMobileTabState();
    }
    
    // Debug function to check DOM state
    debugMobileTabsDOM() {
        console.log('🔍 DEBUG: Checking mobile tabs DOM state...');
        
        const mobileTabs = document.querySelector('.mobile-tabs');
        const mobileTabButtons = document.querySelectorAll('.mobile-tab-button');
        const judgesSection = document.querySelector('.mobile-judges-section');
        const comparisonSection = document.querySelector('.mobile-comparison-section');
        
        console.log('📱 Mobile tabs container:', mobileTabs);
        console.log('📱 Mobile tab buttons:', mobileTabButtons.length);
        mobileTabButtons.forEach((btn, i) => {
            console.log(`  Button ${i}: data-tab="${btn.getAttribute('data-tab')}", classes="${btn.className}"`);
        });
        
        console.log('📍 Sections:');
        console.log('  - judgesSection:', judgesSection, judgesSection?.className);
        console.log('  - comparisonSection:', comparisonSection, comparisonSection?.className);
        
        console.log('🎯 Body classes:', document.body.className);
        console.log('🎯 Mobile tabs classes:', mobileTabs?.className);
    }
}

// Initialize navigation when DOM is loaded
export function initNavigation() {
    const navManager = new NavigationManager();
    
    // Make debug function available globally for testing
    window.debugMobileTabs = () => navManager.debugMobileTabsDOM();
    window.testMobileTab = (tabName) => navManager.switchMobileTab(tabName);
    window.setupMobileTabsAfterLoad = () => navManager.setupMobileTabsAfterLoad();
    
    return navManager;
} 