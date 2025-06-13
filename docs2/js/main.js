import { init as initI18n, translate } from './common/i18n.js';
import { initCallManager, callManager } from './features/callManager/callManager.js';
import { initSpeaksAndFeeds } from './features/speaksAndFeeds/speaksAndFeeds.init.js';
import { initTimer } from './features/timer/timer.init.js';
import { updateDefaultJudgeNames } from './common/state.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    setupLanguageSelector();
    setupNavigation();
    initCallManager();
    initSpeaksAndFeeds();
    initTimer();
    
    // Initialize mobile tabs state (hidden by default)
    const mobileTabs = document.querySelector('.mobile-tabs');
    const body = document.body;
    mobileTabs?.classList.remove('show');
    body.classList.remove('show-mobile-tabs');
});

function setupLanguageSelector() {
    const langButtons = document.querySelectorAll('.lang-button');
    langButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const lang = button.getAttribute('data-lang');
            await initI18n(lang);
            localStorage.setItem('language', lang);
            updateActiveButton(lang);
            
            // Update default judge names when language changes
            updateDefaultJudgeNames(translate);
            
            // Update visualization if we're in call manager
            if (callManager && callManager.view) {
                callManager.view.updateVisualization();
            }
        });
    });

    const savedLang = localStorage.getItem('language') || 'es';
    updateActiveButton(savedLang);
}

function updateActiveButton(activeLang) {
    const langButtons = document.querySelectorAll('.lang-button');
    langButtons.forEach(button => {
        if (button.getAttribute('data-lang') === activeLang) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function setupNavigation() {
    const tabs = {
        mainMenu: document.getElementById('main-menu'),
        callManager: document.getElementById('main-tab'),
        calificaciones: document.getElementById('calificaciones-tab'),
        timer: document.getElementById('timer-tab'),
        athenas: document.getElementById('athenas-tab'),
        wsdc: document.getElementById('wsdc-tab'),
        wsdcReply: document.getElementById('wsdc-reply-tab'),
        feedback: document.getElementById('feedback-tab'),
        panel: document.getElementById('panel-tab'),
    };

    const showTab = (tabName) => {
        Object.values(tabs).forEach(tab => tab.classList.add('hidden'));
        if (tabs[tabName]) {
            tabs[tabName].classList.remove('hidden');
            if (tabName === 'callManager') {
                callManager.init();
            }
        }
        
        // Update mobile tabs visibility
        updateMobileTabs(tabName);
    };
    
    // Show/hide mobile tabs based on current section
    const updateMobileTabs = (activeTab) => {
        const mobileTabs = document.querySelector('.mobile-tabs');
        const body = document.body;
        
        if (activeTab === 'callManager') {
            mobileTabs?.classList.add('show');
            body.classList.add('show-mobile-tabs');
        } else {
            mobileTabs?.classList.remove('show');
            body.classList.remove('show-mobile-tabs');
        }
    };

    document.getElementById('go-call-manager').addEventListener('click', () => showTab('callManager'));
    document.getElementById('go-calificaciones').addEventListener('click', () => showTab('calificaciones'));
    document.getElementById('go-timer').addEventListener('click', () => showTab('timer'));
    
    document.getElementById('back-main-menu-calif').addEventListener('click', () => showTab('mainMenu'));
    document.getElementById('back-main-menu-timer').addEventListener('click', () => showTab('mainMenu'));
    
    document.getElementById('back-main-tab').addEventListener('click', () => showTab('callManager'));
    document.getElementById('back-main-tab-wsdc').addEventListener('click', () => showTab('callManager'));
    document.getElementById('back-main-tab-wsdc-reply').addEventListener('click', () => showTab('callManager'));
    document.getElementById('back-main-tab-feedback').addEventListener('click', () => showTab('callManager'));
    document.getElementById('back-main-tab-panel').addEventListener('click', () => showTab('callManager'));

    // Mobile tab navigation
    const mobileTabButtons = document.querySelectorAll('.mobile-tab-button');
    mobileTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active button
            mobileTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide sections
            if (tabName === 'judges') {
                document.querySelector('.mobile-judges-section').style.display = 'block';
                document.querySelector('.mobile-comparison-section').style.display = 'none';
            } else if (tabName === 'discussion') {
                document.querySelector('.mobile-judges-section').style.display = 'none';
                document.querySelector('.mobile-comparison-section').style.display = 'block';
            }
        });
    });
}
