/**
 * Break Predict View
 * Handles all UI rendering for break prediction
 */

import { breakPredictManager } from './breakPredict.manager.js';
import { translate } from '../../common/i18n.js';

class BreakPredictView {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'teams';
    }

    init() {
        if (this.isInitialized) {
            return;
        }

        this.render();
        this.isInitialized = true;
    }

    cleanup() {
        this.isInitialized = false;
    }

    render() {
        this.updateTeamsList();
        this.updatePredictionsTable();
        this.updateRoundSelector();
        this.updateRoundsTable();
    }

    // Tab management
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelector(`#${tabName}-tab`)?.classList.add('active');
    }

    // Teams list management
    updateTeamsList() {
        const container = document.querySelector('#teams-list');
        if (!container) return;

        const teams = breakPredictManager.teams;
        
        if (teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${translate('breakPredict.noTeamsAdded')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = teams.map(team => `
            <div class="team-item" data-team-id="${team.id}">
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-speakers">
                        ${team.speakers.length > 0 ? team.speakers.join(', ') : translate('breakPredict.noSpeakers')}
                    </div>
                    <div class="team-stats">
                        ${translate('breakPredict.rounds')}: ${team.rounds.length} | 
                        ${translate('breakPredict.totalPoints')}: ${team.totalPoints} | 
                        ${translate('breakPredict.average')}: ${team.averagePoints.toFixed(1)}
                    </div>
                </div>
                <div class="team-actions">
                    <button class="edit-team-btn" data-team-id="${team.id}" title="${translate('common.edit')}">✏️</button>
                    <button class="remove-team-btn" data-team-id="${team.id}" title="${translate('common.remove')}">🗑️</button>
                </div>
                <div class="team-edit-form" style="display: none;">
                    <input type="text" class="team-name-input" value="${team.name}" placeholder="${translate('breakPredict.teamName')}">
                    <input type="text" class="speaker1-input" value="${team.speakers[0] || ''}" placeholder="${translate('breakPredict.speaker1')}">
                    <input type="text" class="speaker2-input" value="${team.speakers[1] || ''}" placeholder="${translate('breakPredict.speaker2')}">
                    <div class="edit-actions">
                        <button class="save-team-btn" data-team-id="${team.id}">${translate('common.save')}</button>
                        <button class="cancel-team-btn" data-team-id="${team.id}">${translate('common.cancel')}</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Predictions table
    updatePredictionsTable() {
        const container = document.querySelector('#predictions-table');
        if (!container) return;

        const predictions = breakPredictManager.getBreakPredictions();
        
        if (predictions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${translate('breakPredict.noPredictionsAvailable')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="predictions-table">
                <thead>
                    <tr>
                        <th>${translate('breakPredict.rank')}</th>
                        <th>${translate('breakPredict.team')}</th>
                        <th>${translate('breakPredict.rounds')}</th>
                        <th>${translate('breakPredict.totalPoints')}</th>
                        <th>${translate('breakPredict.average')}</th>
                        <th>${translate('breakPredict.breakProbability')}</th>
                        <th>${translate('breakPredict.status')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${predictions.map(team => `
                        <tr class="prediction-row ${team.breakStatus}">
                            <td class="rank">${team.rank}</td>
                            <td class="team-name">
                                <div class="team-info">
                                    <div class="name">${team.name}</div>
                                    <div class="speakers">${team.speakers.join(', ')}</div>
                                </div>
                            </td>
                            <td class="rounds">${team.rounds.length}</td>
                            <td class="total-points">${team.totalPoints}</td>
                            <td class="average">${team.averagePoints.toFixed(1)}</td>
                            <td class="probability">
                                <div class="probability-bar">
                                    <div class="probability-fill ${team.breakStatus}" style="width: ${team.breakProbability}%"></div>
                                    <span class="probability-text">${team.breakProbability}%</span>
                                </div>
                            </td>
                            <td class="status">
                                <span class="status-badge ${team.breakStatus}">
                                    ${translate(`breakPredict.status.${team.breakStatus}`)}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Round selector
    updateRoundSelector() {
        const selector = document.querySelector('#current-round-select');
        if (!selector) return;

        const rounds = breakPredictManager.rounds;
        const currentRound = breakPredictManager.currentRound;

        selector.innerHTML = `
            <option value="">${translate('breakPredict.selectRound')}</option>
            ${rounds.map(round => `
                <option value="${round.number}">
                    ${translate('breakPredict.round')} ${round.number}
                </option>
            `).join('')}
        `;
    }

    // Rounds table for data entry
    updateRoundsTable() {
        const container = document.querySelector('#rounds-table');
        if (!container) return;

        const teams = breakPredictManager.teams;
        const rounds = breakPredictManager.rounds;

        if (teams.length === 0 || rounds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${translate('breakPredict.addTeamsAndRounds')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="rounds-table">
                <thead>
                    <tr>
                        <th>${translate('breakPredict.team')}</th>
                        ${rounds.map(round => `
                            <th colspan="2">${translate('breakPredict.round')} ${round.number}</th>
                        `).join('')}
                    </tr>
                    <tr>
                        <th></th>
                        ${rounds.map(() => `
                            <th class="sub-header">${translate('breakPredict.position')}</th>
                            <th class="sub-header">${translate('breakPredict.points')}</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${teams.map(team => `
                        <tr data-team-id="${team.id}">
                            <td class="team-name">${team.name}</td>
                            ${rounds.map(round => {
                                const teamRound = team.rounds.find(r => r.round === round.number);
                                const position = teamRound ? teamRound.position : '';
                                const points = teamRound ? teamRound.points : '';
                                
                                return `
                                    <td>
                                        <select class="round-result-input" 
                                                data-team-id="${team.id}" 
                                                data-round="${round.number}" 
                                                data-type="position">
                                            <option value="">-</option>
                                            <option value="1" ${position === 1 ? 'selected' : ''}>1st</option>
                                            <option value="2" ${position === 2 ? 'selected' : ''}>2nd</option>
                                            <option value="3" ${position === 3 ? 'selected' : ''}>3rd</option>
                                            <option value="4" ${position === 4 ? 'selected' : ''}>4th</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="number" 
                                               class="round-result-input points-input" 
                                               data-team-id="${team.id}" 
                                               data-round="${round.number}" 
                                               data-type="points"
                                               value="${points}" 
                                               min="0" 
                                               max="3" 
                                               placeholder="0">
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Show specific round results
    showRoundResults(roundNumber) {
        const round = breakPredictManager.rounds.find(r => r.number === roundNumber);
        if (!round) return;

        // Highlight the selected round in the table
        document.querySelectorAll('.rounds-table th').forEach(th => {
            th.classList.remove('selected-round');
        });

        // Add highlighting logic here if needed
    }

    // Team editing
    showTeamEditMode(teamId) {
        const teamItem = document.querySelector(`[data-team-id="${teamId}"]`);
        if (!teamItem) return;

        const teamInfo = teamItem.querySelector('.team-info');
        const teamActions = teamItem.querySelector('.team-actions');
        const editForm = teamItem.querySelector('.team-edit-form');

        teamInfo.style.display = 'none';
        teamActions.style.display = 'none';
        editForm.style.display = 'block';
    }

    hideTeamEditMode(teamId) {
        const teamItem = document.querySelector(`[data-team-id="${teamId}"]`);
        if (!teamItem) return;

        const teamInfo = teamItem.querySelector('.team-info');
        const teamActions = teamItem.querySelector('.team-actions');
        const editForm = teamItem.querySelector('.team-edit-form');

        teamInfo.style.display = 'block';
        teamActions.style.display = 'flex';
        editForm.style.display = 'none';
    }

    // Utility methods
    showMessage(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Check if view is ready
    isReady() {
        return this.isInitialized && 
               document.querySelector('#teams-list') && 
               document.querySelector('#predictions-table');
    }
}

export const breakPredictView = new BreakPredictView(); 