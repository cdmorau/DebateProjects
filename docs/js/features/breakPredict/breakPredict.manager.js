/**
 * Break Predict Manager
 * Manages break prediction logic and calculations
 */

import { translate } from '../../common/i18n.js';

class BreakPredictManager {
    constructor() {
        this.teams = [];
        this.rounds = [];
        this.currentRound = 1;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) {
            return;
        }

        // Load saved data from localStorage
        this.loadData();
        this.isInitialized = true;
    }

    cleanup() {
        this.saveData();
        this.isInitialized = false;
    }

    // Team management
    addTeam(teamName, speakers = []) {
        const team = {
            id: Date.now(),
            name: teamName,
            speakers: speakers,
            rounds: [],
            totalPoints: 0,
            averagePoints: 0,
            breakProbability: 0
        };
        
        this.teams.push(team);
        this.saveData();
        return team;
    }

    removeTeam(teamId) {
        this.teams = this.teams.filter(team => team.id !== teamId);
        this.saveData();
    }

    updateTeam(teamId, updates) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            Object.assign(team, updates);
            this.calculateTeamStats(team);
            this.saveData();
        }
    }

    // Round management
    addRound(roundNumber, results = []) {
        const round = {
            number: roundNumber,
            results: results, // Array of {teamId, position, points}
            completed: false
        };
        
        this.rounds.push(round);
        this.saveData();
        return round;
    }

    updateRoundResult(roundNumber, teamId, position, points) {
        const round = this.rounds.find(r => r.number === roundNumber);
        if (!round) return;

        // Update or add result
        const existingResult = round.results.find(r => r.teamId === teamId);
        if (existingResult) {
            existingResult.position = position;
            existingResult.points = points;
        } else {
            round.results.push({ teamId, position, points });
        }

        // Update team's round data
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            const teamRound = team.rounds.find(r => r.round === roundNumber);
            if (teamRound) {
                teamRound.position = position;
                teamRound.points = points;
            } else {
                team.rounds.push({ round: roundNumber, position, points });
            }
            
            this.calculateTeamStats(team);
        }

        this.saveData();
    }

    // Statistics and predictions
    calculateTeamStats(team) {
        if (team.rounds.length === 0) {
            team.totalPoints = 0;
            team.averagePoints = 0;
            team.breakProbability = 0;
            return;
        }

        team.totalPoints = team.rounds.reduce((sum, round) => sum + round.points, 0);
        team.averagePoints = team.totalPoints / team.rounds.length;
        team.breakProbability = this.calculateBreakProbability(team);
    }

    calculateBreakProbability(team) {
        // Simple break prediction algorithm
        // This can be enhanced with more sophisticated models
        
        const completedRounds = team.rounds.length;
        if (completedRounds === 0) return 0;

        const averagePoints = team.averagePoints;
        const totalRounds = 6; // Typical tournament has 6 rounds
        const remainingRounds = totalRounds - completedRounds;
        
        // Estimate final points based on current average
        const projectedFinalPoints = averagePoints * totalRounds;
        
        // Break threshold (typically around 12-13 points for 6 rounds)
        const breakThreshold = 12;
        
        if (projectedFinalPoints >= breakThreshold + 2) {
            return 95; // Very likely to break
        } else if (projectedFinalPoints >= breakThreshold + 1) {
            return 80; // Likely to break
        } else if (projectedFinalPoints >= breakThreshold) {
            return 60; // Moderate chance
        } else if (projectedFinalPoints >= breakThreshold - 1) {
            return 30; // Low chance
        } else {
            return 5; // Very unlikely
        }
    }

    // Get rankings and predictions
    getTeamRankings() {
        return [...this.teams]
            .sort((a, b) => {
                // Sort by total points, then by average points
                if (b.totalPoints !== a.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }
                return b.averagePoints - a.averagePoints;
            })
            .map((team, index) => ({
                ...team,
                rank: index + 1
            }));
    }

    getBreakPredictions() {
        return this.getTeamRankings()
            .map(team => ({
                ...team,
                breakStatus: this.getBreakStatus(team.breakProbability)
            }));
    }

    getBreakStatus(probability) {
        if (probability >= 80) return 'safe';
        if (probability >= 60) return 'likely';
        if (probability >= 30) return 'bubble';
        return 'unlikely';
    }

    // Data persistence
    saveData() {
        const data = {
            teams: this.teams,
            rounds: this.rounds,
            currentRound: this.currentRound
        };
        localStorage.setItem('breakPredictData', JSON.stringify(data));
    }

    loadData() {
        try {
            const saved = localStorage.getItem('breakPredictData');
            if (saved) {
                const data = JSON.parse(saved);
                this.teams = data.teams || [];
                this.rounds = data.rounds || [];
                this.currentRound = data.currentRound || 1;
                
                // Recalculate stats for all teams
                this.teams.forEach(team => this.calculateTeamStats(team));
            }
        } catch (error) {
            console.error('Error loading break predict data:', error);
        }
    }

    clearData() {
        this.teams = [];
        this.rounds = [];
        this.currentRound = 1;
        localStorage.removeItem('breakPredictData');
    }

    // Export/Import functionality
    exportData() {
        return {
            teams: this.teams,
            rounds: this.rounds,
            currentRound: this.currentRound,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            this.teams = data.teams || [];
            this.rounds = data.rounds || [];
            this.currentRound = data.currentRound || 1;
            
            // Recalculate stats
            this.teams.forEach(team => this.calculateTeamStats(team));
            this.saveData();
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

export const breakPredictManager = new BreakPredictManager(); 