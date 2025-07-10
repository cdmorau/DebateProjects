/**
 * Break Predict Handlers
 * Handles all user interactions for break prediction
 */

import { breakPredictManager } from './breakPredict.manager.js';
import { breakPredictView } from './breakPredict.view.js';
import { translate } from '../../common/i18n.js';

class BreakPredictHandlers {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) {
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
    }

    cleanup() {
        this.removeEventListeners();
        this.isInitialized = false;
    }

    setupEventListeners() {
        // Team management
        this.bindEvent('#add-team-btn', 'click', this.handleAddTeam.bind(this));
        this.bindEvent('#import-teams-btn', 'click', this.handleImportTeams.bind(this));
        this.bindEvent('#export-data-btn', 'click', this.handleExportData.bind(this));
        this.bindEvent('#clear-data-btn', 'click', this.handleClearData.bind(this));

        // Round management
        this.bindEvent('#add-round-btn', 'click', this.handleAddRound.bind(this));
        this.bindEvent('#current-round-select', 'change', this.handleRoundChange.bind(this));

        // File input for import
        this.bindEvent('#import-file-input', 'change', this.handleFileImport.bind(this));

        // Delegation for dynamic elements
        this.setupDelegatedEvents();
    }

    setupDelegatedEvents() {
        // Use event delegation for dynamically created elements
        document.addEventListener('click', this.handleDelegatedClick.bind(this));
        document.addEventListener('change', this.handleDelegatedChange.bind(this));
        document.addEventListener('input', this.handleDelegatedInput.bind(this));
    }

    removeEventListeners() {
        document.removeEventListener('click', this.handleDelegatedClick.bind(this));
        document.removeEventListener('change', this.handleDelegatedChange.bind(this));
        document.removeEventListener('input', this.handleDelegatedInput.bind(this));
    }

    bindEvent(selector, event, handler) {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    // Delegated event handlers
    handleDelegatedClick(event) {
        const target = event.target;

        // Remove team button
        if (target.classList.contains('remove-team-btn')) {
            const teamId = parseInt(target.dataset.teamId);
            this.handleRemoveTeam(teamId);
        }

        // Edit team button
        if (target.classList.contains('edit-team-btn')) {
            const teamId = parseInt(target.dataset.teamId);
            this.handleEditTeam(teamId);
        }

        // Save team edit button
        if (target.classList.contains('save-team-btn')) {
            const teamId = parseInt(target.dataset.teamId);
            this.handleSaveTeamEdit(teamId);
        }

        // Cancel team edit button
        if (target.classList.contains('cancel-team-btn')) {
            const teamId = parseInt(target.dataset.teamId);
            this.handleCancelTeamEdit(teamId);
        }

        // Tab switching
        if (target.classList.contains('tab-btn')) {
            const tabName = target.dataset.tab;
            this.handleTabSwitch(tabName);
        }
    }

    handleDelegatedChange(event) {
        const target = event.target;

        // Round result inputs
        if (target.classList.contains('round-result-input')) {
            const teamId = parseInt(target.dataset.teamId);
            const round = parseInt(target.dataset.round);
            const type = target.dataset.type; // 'position' or 'points'
            this.handleRoundResultChange(teamId, round, type, target.value);
        }
    }

    handleDelegatedInput(event) {
        const target = event.target;

        // Team name editing
        if (target.classList.contains('team-name-input')) {
            // Real-time validation could go here
        }
    }

    // Team management handlers
    handleAddTeam() {
        const teamNameInput = document.querySelector('#team-name-input');
        const speaker1Input = document.querySelector('#speaker1-input');
        const speaker2Input = document.querySelector('#speaker2-input');

        if (!teamNameInput) return;

        const teamName = teamNameInput.value.trim();
        if (!teamName) {
            alert(translate('breakPredict.pleaseEnterTeamName'));
            return;
        }

        const speakers = [];
        if (speaker1Input && speaker1Input.value.trim()) {
            speakers.push(speaker1Input.value.trim());
        }
        if (speaker2Input && speaker2Input.value.trim()) {
            speakers.push(speaker2Input.value.trim());
        }

        breakPredictManager.addTeam(teamName, speakers);
        
        // Clear inputs
        teamNameInput.value = '';
        if (speaker1Input) speaker1Input.value = '';
        if (speaker2Input) speaker2Input.value = '';

        breakPredictView.updateTeamsList();
        breakPredictView.updatePredictionsTable();
    }

    handleRemoveTeam(teamId) {
        if (confirm(translate('breakPredict.confirmRemoveTeam'))) {
            breakPredictManager.removeTeam(teamId);
            breakPredictView.updateTeamsList();
            breakPredictView.updatePredictionsTable();
        }
    }

    handleEditTeam(teamId) {
        breakPredictView.showTeamEditMode(teamId);
    }

    handleSaveTeamEdit(teamId) {
        const teamRow = document.querySelector(`[data-team-id="${teamId}"]`);
        if (!teamRow) return;

        const nameInput = teamRow.querySelector('.team-name-input');
        const speaker1Input = teamRow.querySelector('.speaker1-input');
        const speaker2Input = teamRow.querySelector('.speaker2-input');

        const updates = {};
        if (nameInput) updates.name = nameInput.value.trim();
        
        const speakers = [];
        if (speaker1Input && speaker1Input.value.trim()) {
            speakers.push(speaker1Input.value.trim());
        }
        if (speaker2Input && speaker2Input.value.trim()) {
            speakers.push(speaker2Input.value.trim());
        }
        updates.speakers = speakers;

        breakPredictManager.updateTeam(teamId, updates);
        breakPredictView.hideTeamEditMode(teamId);
        breakPredictView.updateTeamsList();
        breakPredictView.updatePredictionsTable();
    }

    handleCancelTeamEdit(teamId) {
        breakPredictView.hideTeamEditMode(teamId);
    }

    // Round management handlers
    handleAddRound() {
        const currentRound = breakPredictManager.currentRound;
        breakPredictManager.addRound(currentRound);
        breakPredictManager.currentRound++;
        breakPredictView.updateRoundSelector();
        breakPredictView.updateRoundsTable();
    }

    handleRoundChange(event) {
        const selectedRound = parseInt(event.target.value);
        breakPredictView.showRoundResults(selectedRound);
    }

    handleRoundResultChange(teamId, round, type, value) {
        const team = breakPredictManager.teams.find(t => t.id === teamId);
        if (!team) return;

        const currentResult = team.rounds.find(r => r.round === round) || { round, position: 0, points: 0 };
        
        if (type === 'position') {
            currentResult.position = parseInt(value) || 0;
        } else if (type === 'points') {
            currentResult.points = parseInt(value) || 0;
        }

        breakPredictManager.updateRoundResult(round, teamId, currentResult.position, currentResult.points);
        breakPredictView.updatePredictionsTable();
    }

    // Data management handlers
    handleImportTeams() {
        const fileInput = document.querySelector('#import-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (breakPredictManager.importData(data)) {
                    alert(translate('breakPredict.dataImportedSuccessfully'));
                    breakPredictView.updateTeamsList();
                    breakPredictView.updatePredictionsTable();
                    breakPredictView.updateRoundSelector();
                } else {
                    alert(translate('breakPredict.errorImportingData'));
                }
            } catch (error) {
                alert(translate('breakPredict.invalidFileFormat'));
            }
        };
        reader.readAsText(file);
    }

    handleExportData() {
        const data = breakPredictManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `break-predict-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleClearData() {
        if (confirm(translate('breakPredict.confirmClearAllData'))) {
            breakPredictManager.clearData();
            breakPredictView.updateTeamsList();
            breakPredictView.updatePredictionsTable();
            breakPredictView.updateRoundSelector();
        }
    }

    // Tab switching
    handleTabSwitch(tabName) {
        breakPredictView.switchTab(tabName);
    }
}

export const breakPredictHandlers = new BreakPredictHandlers(); 