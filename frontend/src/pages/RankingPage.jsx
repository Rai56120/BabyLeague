import { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { playersAPI } from "../api";

const RankingPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortField, setSortField] = useState('winrate');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            setLoading(true);

            const response = await playersAPI.getAll();

            setPlayers(response.data || []);
            setError('');
        } catch (error) {
            setError('Failed to fetch players');
            console.error('Error fetching players:', error);
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateWinLossRatio = (player) => {
        const totalMatches = player.matches.length;

        if (totalMatches === 0) {
            return { wins: 0, losses: 0, ratio: '0.00' }
        }

        let wins = 0;
        let losses = 0;

        player.matches.forEach(MatchPlayer => {
            const match = MatchPlayer.match;
            const isWhiteTeam = MatchPlayer.team;
            const whiteWon = match.whiteTeamScore > match.blackTeamScore;

            if (isWhiteTeam && whiteWon) {
                wins++;
            } else {
                losses++;
            }
        });

        const ratio = losses > 0 ? (wins / losses).toFixed(2) : wins.toFixed(2);

        return { wins, losses, ratio };
    }

    const calculateScoredConcededRatio = (player) => {
        const totalMatches = player.matches.length;

        if (totalMatches === 0) {
            return { scored: 0, conceded: 0, ratio: '0.00' }
        }

        let scored = player.goalsScoredWhite + player.goalsScoredBlack;
        let conceded = player.goalsConcededWhite + player.goalsConcededBlack;

        const ratio = conceded > 0 ? (scored / conceded).toFixed(2) : scored.toFixed(2);

        return { scored, conceded, ratio };
    }

    const sortedPlayers = useMemo(() => {
        if (!players || !Array.isArray(players)) {
            return [];
        }
        return [...players].sort((a, b) => {
            let aValue, bValue;

            // Calculate the actual values to sort by based on sortField
            switch (sortField) {
                case 'winrate':
                    const aStats = calculateWinLossRatio(a);
                    const bStats = calculateWinLossRatio(b);
                    aValue = parseFloat(aStats.ratio);
                    bValue = parseFloat(bStats.ratio);
                    break;
                case 'goalRatio':
                    const aGoals = calculateScoredConcededRatio(a);
                    const bGoals = calculateScoredConcededRatio(b);
                    aValue = parseFloat(aGoals.ratio);
                    bValue = parseFloat(bGoals.ratio);
                    break;
                case 'manOfTheMatch':
                    aValue = a.playerOfTheMatch || 0;
                    bValue = b.playerOfTheMatch || 0;
                    break;
                case 'gamelles':
                    aValue = a.gamellesScored || 0;
                    bValue = b.gamellesScored || 0;
                    break;
                case 'ownGoals':
                    aValue = a.ownGoalsScored || 0;
                    bValue = b.ownGoalsScored || 0;
                    break;
                case 'fannyScored':
                    aValue = a.fannyScored || 0;
                    bValue = b.fannyScored || 0;
                    break;
                default:
                    aValue = 0;
                    bValue = 0;
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return bValue > aValue ? 1 : -1;
            }
        });
    }, [players, sortField, sortDirection]);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Loading players...</div>
            </div>
        );
    }

    return (
        <div className="plage-container">
            <h1 className="page-title">Rankings</h1>

            {error && <div className="error">{error}</div>}

            {/* Add ranking selection */}
            <div className="ranking-container">
                <div className="grid grid-2">
                    <div className="form-group">
                        <label className="form-label">Select filter</label>
                        <select
                            className="form-select"
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                        >
                            <option value="winrate">win/loss ratio</option>
                            <option value="goalRatio">goal ratio</option>
                            <option value="manOfTheMatch">man of the match</option>
                            <option value="gamelles">gamelles</option>
                            <option value="ownGoals">own goals</option>
                            <option value="fannyScored">fanny scored</option>
                        </select>
                        <label className="form-label">Select direction</label>
                        <select
                            className="form-select"
                            value={sortDirection}
                            onChange={(e) => setSortDirection(e.target.value)}
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                </div>
                {/* Add players list */}
                <div className="card ranking">
                    {sortedPlayers.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem', padding: '2rem' }}>
                            No players found. Add your first player above!
                        </p>
                    ) : (
                        <ul className="grid grid-1">
                            {sortedPlayers.map((player, index) => {
                                const statsMatches = calculateWinLossRatio(player);
                                const statsGoals = calculateScoredConcededRatio(player);
                                const playerOfTheMatch = player.playerOfTheMatch;
                                const gamellesScored = player.gamellesScored;
                                const ownGoalsScored = player.ownGoalsScored;
                                const fannyScored = player.fannyScored;

                                return (
                                    <li key={player.id} className="ranking-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
                                            <div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', marginRight: '1rem' }}>
                                                    #{index + 1}
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>
                                                    {player.name}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                {sortField === 'winrate' && (
                                                    <span>W/L: {statsMatches.ratio}</span>
                                                )}
                                                {sortField === 'goalRatio' && (
                                                    <span>Goals: {statsGoals.ratio}</span>
                                                )}
                                                {sortField === 'manOfTheMatch' && (
                                                    <span>MOTM: {playerOfTheMatch}</span>
                                                )}
                                                {sortField === 'gamelles' && (
                                                    <span>Gamelles: {gamellesScored}</span>
                                                )}
                                                {sortField === 'ownGoals' && (
                                                    <span>Own Goals: {ownGoalsScored}</span>
                                                )}

                                                <Link
                                                    to={`/player/${player.id}`}
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div >
    );
};

export default RankingPage;