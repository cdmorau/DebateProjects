import { subscribe, translate } from '../../common/i18n.js';
import { speaksAndFeedsLogic } from './speaksAndFeeds.js';

function setupEventListeners() {
    const inputs = [
        // Elementos en la tabla principal (speaks & feeds)
        { id: 'athenas-score-calif', descId: 'athenas-description-calif', displayId: 'athenas-display-calif', getter: speaksAndFeedsLogic.getAthenasDescription },
        { id: 'wsdc-score-calif', descId: 'wsdc-description-calif', displayId: 'wsdc-display-calif', getter: speaksAndFeedsLogic.getWsdcDescription },
        { id: 'wsdc-reply-score-calif', descId: 'wsdc-reply-description-calif', displayId: 'wsdc-reply-display-calif', getter: speaksAndFeedsLogic.getWsdcReplyDescription },
        { id: 'demian-score-calif', descId: 'demian-description-calif', displayId: 'demian-display-calif', getter: speaksAndFeedsLogic.getDemianDescription },
        { id: 'eva-score-calif', descId: 'eva-description-calif', displayId: 'eva-display-calif', getter: speaksAndFeedsLogic.getEvaDescription },
        { id: 'eva-panelist-score-calif', descId: 'eva-panelist-description-calif', displayId: 'eva-panelist-display-calif', getter: speaksAndFeedsLogic.getEvaPanelistDescription },
        { id: 'feedback-score-calif', descId: 'feedback-description-calif', displayId: 'feedback-display-calif', getter: speaksAndFeedsLogic.getFeedbackDescription },
        { id: 'panel-score-calif', descId: 'panel-description-calif', displayId: 'panel-display-calif', getter: speaksAndFeedsLogic.getPanelDescription }
    ];

    inputs.forEach(({ id, descId, displayId, getter }) => {
        const inputElement = document.getElementById(id);
        const descElement = document.getElementById(descId);
        const displayElement = document.getElementById(displayId);
        
        if (inputElement && descElement) {
            // Initialize with default values
            const defaultScore = parseInt(inputElement.value, 10);
            descElement.innerHTML = getter(defaultScore);
            
            if (displayElement) {
                displayElement.textContent = defaultScore;
                updateScoreColor(displayElement, defaultScore);
            }
            
            inputElement.addEventListener('input', () => {
                const score = parseInt(inputElement.value, 10);
                descElement.innerHTML = getter(score);
                
                // Update score display
                if (displayElement) {
                    displayElement.textContent = score;
                    updateScoreColor(displayElement, score);
                }
            });
        }
    });
}

function updateScoreColor(element, score, scoringSystem) {
    // Remove existing classes
    element.classList.remove('low', 'medium', 'high', 'excellent');
    
    // Determine the scoring system based on the element ID
    const elementId = element.id || element.closest('[id]')?.id || '';
    
    if (elementId.includes('athenas')) {
        // Athenas scoring (50-100): 50-point range
        if (score >= 95) {
            element.classList.add('excellent');
        } else if (score >= 85) {
            element.classList.add('high');
        } else if (score >= 70) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    } else if (elementId.includes('demian')) {
        // Demian scoring (50-100): 50-point range
        if (score >= 95) {
            element.classList.add('excellent');
        } else if (score >= 85) {
            element.classList.add('high');
        } else if (score >= 70) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    } else if (elementId.includes('eva-panelist')) {
        // Eva Panelist scoring (1-10): 10-point range
        if (score >= 9) {
            element.classList.add('excellent');
        } else if (score >= 7) {
            element.classList.add('high');
        } else if (score >= 5) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    } else if (elementId.includes('eva')) {
        // Eva scoring (1-10): 10-point range
        if (score >= 9) {
            element.classList.add('excellent');
        } else if (score >= 7) {
            element.classList.add('high');
        } else if (score >= 5) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    } else if (elementId.includes('wsdc-reply')) {
        // WSDC Reply scoring (30-40): 10-point range
        if (score >= 39) {
            element.classList.add('excellent');
        } else if (score >= 37) {
            element.classList.add('high');
        } else if (score >= 33) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    } else if (elementId.includes('wsdc')) {
        // WSDC scoring (60-80): 20-point range
        if (score >= 78) {
            element.classList.add('excellent');
        } else if (score >= 74) {
            element.classList.add('high');
        } else if (score >= 68) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    } else {
        // Feedback/Panel scoring (1-10): 10-point range
        if (score >= 9) {
            element.classList.add('excellent');
        } else if (score >= 7) {
            element.classList.add('high');
        } else if (score >= 5) {
            element.classList.add('medium');
        } else {
            element.classList.add('low');
        }
    }
}

function setupTableSelector() {
    const tableSelector = document.getElementById('table-selector');
    const sections = {
        athenas: document.getElementById('athenas-section'),
        wsdc: document.getElementById('wsdc-section'),
        wsdcReply: document.getElementById('wsdcReply-section'),
        demian: document.getElementById('demian-section'),
        eva: document.getElementById('eva-section'),
        evaPanelist: document.getElementById('eva-panelist-section'),
        feedback: document.getElementById('feedback-section'),
        panel: document.getElementById('panel-section')
    };

    if (tableSelector) {
        tableSelector.addEventListener('change', function() {
            Object.values(sections).forEach(section => section.classList.add('hidden'));
            const selectedSection = sections[this.value];
            if (selectedSection) {
                selectedSection.classList.remove('hidden');
            }
        });
    }
}

function updateSpeaksAndFeedsView() {
    // Actualizar las descripciones cuando cambie el idioma
    const inputs = [
        { id: 'athenas-score-calif', descId: 'athenas-description-calif', displayId: 'athenas-display-calif', getter: speaksAndFeedsLogic.getAthenasDescription },
        { id: 'wsdc-score-calif', descId: 'wsdc-description-calif', displayId: 'wsdc-display-calif', getter: speaksAndFeedsLogic.getWsdcDescription },
        { id: 'wsdc-reply-score-calif', descId: 'wsdc-reply-description-calif', displayId: 'wsdc-reply-display-calif', getter: speaksAndFeedsLogic.getWsdcReplyDescription },
        { id: 'demian-score-calif', descId: 'demian-description-calif', displayId: 'demian-display-calif', getter: speaksAndFeedsLogic.getDemianDescription },
        { id: 'eva-score-calif', descId: 'eva-description-calif', displayId: 'eva-display-calif', getter: speaksAndFeedsLogic.getEvaDescription },
        { id: 'eva-panelist-score-calif', descId: 'eva-panelist-description-calif', displayId: 'eva-panelist-display-calif', getter: speaksAndFeedsLogic.getEvaPanelistDescription },
        { id: 'feedback-score-calif', descId: 'feedback-description-calif', displayId: 'feedback-display-calif', getter: speaksAndFeedsLogic.getFeedbackDescription },
        { id: 'panel-score-calif', descId: 'panel-description-calif', displayId: 'panel-display-calif', getter: speaksAndFeedsLogic.getPanelDescription }
    ];

    inputs.forEach(({ id, descId, displayId, getter }) => {
        const inputElement = document.getElementById(id);
        const descElement = document.getElementById(descId);
        const displayElement = document.getElementById(displayId);
        
        if (inputElement && descElement && inputElement.value) {
            const score = parseInt(inputElement.value, 10);
            if (!isNaN(score)) {
                descElement.innerHTML = getter(score);
                
                // Update score display and color
                if (displayElement) {
                    displayElement.textContent = score;
                    updateScoreColor(displayElement, score);
                }
            }
        }
    });
}

export function initSpeaksAndFeeds() {
    setupEventListeners();
    setupTableSelector();
    subscribe(updateSpeaksAndFeedsView);
}
