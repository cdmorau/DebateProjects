import { state } from '../../common/state.js';
import { athenasRanges, feedbackRanges, panelRanges } from '../../common/constants.js';

export const callManagerLogic = {
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    calculateComparisons() {
        const comparisons = {
            'AG vs AO': { votes: 0, details: [] },
            'AG vs BG': { votes: 0, details: [] },
            'AG vs BO': { votes: 0, details: [] },
            'AO vs BG': { votes: 0, details: [] },
            'AO vs BO': { votes: 0, details: [] },
            'BG vs BO': { votes: 0, details: [] }
        };

        state.judges.forEach(judge => {
            if (!Object.values(judge.activePositions).every(v => v)) return;
            const pos = judge.positions;
            const act = judge.activePositions;
            
            if (act.ag && act.ao) {
                if (pos.ag < pos.ao) {
                    comparisons['AG vs AO'].votes++;
                    comparisons['AG vs AO'].details.push({ name: judge.name, role: judge.role, winner: 'AG' });
                } else {
                    comparisons['AG vs AO'].details.push({ name: judge.name, role: judge.role, winner: 'AO' });
                }
            }
            if (act.ag && act.bg) {
                if (pos.ag < pos.bg) {
                    comparisons['AG vs BG'].votes++;
                    comparisons['AG vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'AG' });
                } else {
                    comparisons['AG vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'BG' });
                }
            }
            if (act.ag && act.bo) {
                if (pos.ag < pos.bo) {
                    comparisons['AG vs BO'].votes++;
                    comparisons['AG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'AG' });
                } else {
                    comparisons['AG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BO' });
                }
            }
            if (act.ao && act.bg) {
                if (pos.ao < pos.bg) {
                    comparisons['AO vs BG'].votes++;
                    comparisons['AO vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'AO' });
                } else {
                    comparisons['AO vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'BG' });
                }
            }
            if (act.ao && act.bo) {
                if (pos.ao < pos.bo) {
                    comparisons['AO vs BO'].votes++;
                    comparisons['AO vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'AO' });
                } else {
                    comparisons['AO vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BO' });
                }
            }
            if (act.bg && act.bo) {
                if (pos.bg < pos.bo) {
                    comparisons['BG vs BO'].votes++;
                    comparisons['BG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BG' });
                } else {
                    comparisons['BG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BO' });
                }
            }
        });
        return comparisons;
    },

    getAgreementStatus(comparison) {
        const totalJudges = comparison.details.length;
        const [team1, team2] = Object.keys(comparison.details[0] ? { [comparison.details[0].winner]: true } : { AG: true, AO: true });
        const votesForTeam1 = comparison.details.filter(d => d.winner === team1).length;
        const votesForTeam2 = comparison.details.filter(d => d.winner === team2).length;
        if (votesForTeam1 === totalJudges || votesForTeam2 === totalJudges) {
            return 'agreement';
        } else if (votesForTeam1 === votesForTeam2) {
            return 'mixed';
        } else {
            return 'disagreement';
        }
    },

    isPositionResolved(team) {
        const comparisons = this.calculateComparisons();
        const teamComparisons = Object.entries(comparisons).filter(([comparison]) => 
            comparison.includes(team)
        );
        return teamComparisons.every(([comparison, data]) => {
            const [team1, team2] = comparison.split(' vs ');
            const votesForTeam1 = data.details.filter(d => d.winner === team1).length;
            const votesForTeam2 = data.details.filter(d => d.winner === team2).length;
            const totalJudges = data.details.length;
            return votesForTeam1 === totalJudges || votesForTeam2 === totalJudges;
        });
    },

    analyzeComparisonImpact() {
        const comparisons = this.calculateComparisons();
        const impactScores = {};
        Object.entries(comparisons).forEach(([comparison, data]) => {
            const [team1, team2] = comparison.split(' vs ');
            let maxDiffTeam1 = 0;
            let maxDiffTeam2 = 0;
            const activeJudges = state.judges.filter(j => Object.values(j.activePositions).every(v => v));
            activeJudges.forEach(judge => {
                const pos1 = judge.positions[team1.toLowerCase()];
                const pos2 = judge.positions[team2.toLowerCase()];
                const diff = Math.abs(pos1 - pos2);
                if (pos1 < pos2) {
                    maxDiffTeam1 = Math.max(maxDiffTeam1, diff);
                } else {
                    maxDiffTeam2 = Math.max(maxDiffTeam2, diff);
                }
            });
            const score = maxDiffTeam1 + maxDiffTeam2;
            const votesForTeam1 = data.details.filter(d => d.winner === team1).length;
            const votesForTeam2 = data.details.filter(d => d.winner === team2).length;
            const totalJudges = data.details.length;
            if (votesForTeam1 === totalJudges || votesForTeam2 === totalJudges) {
                impactScores[comparison] = { score: 0, maxDiffTeam1, maxDiffTeam2, votesForTeam1, votesForTeam2, voteDiff: Math.abs(votesForTeam1 - votesForTeam2) };
            } else {
                impactScores[comparison] = { score: score, maxDiffTeam1, maxDiffTeam2, votesForTeam1, votesForTeam2, voteDiff: Math.abs(votesForTeam1 - votesForTeam2) };
            }
        });
        const ordered = Object.entries(impactScores)
            .filter(([, d]) => d.score > 0)
            .sort(([, a], [, b]) => b.score - a.score || a.voteDiff - b.voteDiff)
            .map(([k]) => k);
        Object.keys(comparisons).forEach(key => {
            if (!ordered.includes(key)) ordered.push(key);
        });
        const orderedImpactScores = {};
        ordered.forEach(key => { orderedImpactScores[key] = impactScores[key]; });
        return orderedImpactScores;
    },

    calculatePreliminaryAnalysis() {
        // Construir resultados para cada equipo
        const teamResults = [];
        const teams = ['AG', 'AO', 'BG', 'BO'];
        
        for (const team of teams) {
            const winsAgainst = [];
            const lossesAgainst = [];
            
            // Revisar todas las comparativas para este equipo
            const comparisons = this.calculateComparisons();
            Object.entries(comparisons).forEach(([key, comparison]) => {
                const [team1, team2] = key.split(' vs ');
                
                if (team1 === team) {
                    const votesForTeam1 = comparison.details.filter(d => d.winner === team1).length;
                    const votesForTeam2 = comparison.details.filter(d => d.winner === team2).length;
                    
                    if (votesForTeam1 > votesForTeam2) {
                        winsAgainst.push(team2);
                    } else if (votesForTeam1 < votesForTeam2) {
                        lossesAgainst.push(team2);
                    } else {
                        // En caso de empate, se resuelve con voto del principal
                        const principalVote = comparison.details.find(d => d.role === 'principal');
                        if (principalVote) {
                            if (principalVote.winner === team) {
                                winsAgainst.push(team2);
                            } else {
                                lossesAgainst.push(team2);
                            }
                        }
                    }
                } else if (team2 === team) {
                    const votesForTeam1 = comparison.details.filter(d => d.winner === team1).length;
                    const votesForTeam2 = comparison.details.filter(d => d.winner === team2).length;
                    
                    if (votesForTeam2 > votesForTeam1) {
                        winsAgainst.push(team1);
                    } else if (votesForTeam2 < votesForTeam1) {
                        lossesAgainst.push(team1);
                    } else {
                        // En caso de empate, se resuelve con voto del principal
                        const principalVote = comparison.details.find(d => d.role === 'principal');
                        if (principalVote) {
                            if (principalVote.winner === team) {
                                winsAgainst.push(team1);
                            } else {
                                lossesAgainst.push(team1);
                            }
                        }
                    }
                }
            });
            
            teamResults.push({
                team: team,
                winsAgainst: winsAgainst,
                lossesAgainst: lossesAgainst,
                totalWins: winsAgainst.length,
                totalLosses: lossesAgainst.length,
                position: 0
            });
        }
        
        // Detectar contradicciones locales
        const localContradictions = [];
        for (let i = 0; i < teamResults.length; i++) {
            for (let j = 0; j < teamResults.length; j++) {
                if (i !== j) {
                    const team1 = teamResults[i];
                    const team2 = teamResults[j];
                    
                    // Si team1 tiene menos victorias que team2, pero team1 le ganó a team2
                    if (team1.totalWins < team2.totalWins && team1.winsAgainst.includes(team2.team)) {
                        localContradictions.push({
                            teamWithFewerWins: team1.team,
                            teamWithMoreWins: team2.team,
                            message: `${team1.team} ganó menos comparativas que ${team2.team} pero ${team1.team} ganó a ${team2.team}`
                        });
                    }
                }
            }
        }
        
        // Detectar ciclos
        const cycles = this.detectCycles(teamResults);
        
        // Ordenar equipos por número de victorias
        const sortedTeamResults = teamResults.sort((a, b) => b.totalWins - a.totalWins);
        
        // Asignar posiciones solo si no hay incoherencias
        const hasIncoherences = localContradictions.length > 0 || cycles.length > 0;
        if (!hasIncoherences) {
            sortedTeamResults.forEach((team, index) => {
                team.position = index + 1;
            });
        }
        
        return {
            teamResults: sortedTeamResults,
            localContradictions: localContradictions,
            cycles: cycles,
            hasIncoherences: hasIncoherences
        };
    },

    detectCycles(teamResults) {
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        
        const dfs = (team, path) => {
            if (recursionStack.has(team)) {
                // Encontramos un ciclo
                const startIndex = path.indexOf(team);
                if (startIndex !== -1) {
                    return path.slice(startIndex);
                }
            }
            
            if (visited.has(team)) {
                return null;
            }
            
            visited.add(team);
            recursionStack.add(team);
            
            const teamResult = teamResults.find(tr => tr.team === team);
            if (teamResult) {
                for (const defeatedTeam of teamResult.winsAgainst) {
                    const cycle = dfs(defeatedTeam, [...path, team]);
                    if (cycle) {
                        return cycle;
                    }
                }
            }
            
            recursionStack.delete(team);
            return null;
        };
        
        for (const team of ['AG', 'AO', 'BG', 'BO']) {
            if (!visited.has(team)) {
                const cycle = dfs(team, []);
                if (cycle) {
                    const cycleString = cycle.map((team, index) => {
                        const nextTeam = cycle[(index + 1) % cycle.length];
                        return `${team} ganó a ${nextTeam}`;
                    }).join(', ');
                    
                    cycles.push({
                        cycle: cycle,
                        message: `Ciclo de incoherencia: ${cycleString}`
                    });
                }
            }
        }
        
        return cycles;
    }
};
