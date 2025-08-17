import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playersAPI } from '../api';

const PlayerStatsPage = () => {
    const { id } = useParams();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPlayer();
    }, [id]);

    const fetchPlayer = async () => {
        try {
            setLoading(true);
            const response = await playersAPI.getById(id);
            setPlayer(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch player details');
            console.error('Error fetching player:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        if (!player || !player.matches) return null;

        let wins = 0;
        let losses = 0;
        let draws = 0;
        const recentMatches = [];

        player.matches.forEach(matchPlayer => {
            const match = matchPlayer.match;
            const isWhiteTeam = matchPlayer.team;

            recentMatches.push({
                ...match,
                playerTeam: isWhiteTeam ? 'white' : 'black',
                playerStats: matchPlayer
            });

            if (match.whiteTeamScore === match.blackTeamScore) {
                draws++;
            } else {
                const whiteWon = match.whiteTeamScore > match.blackTeamScore;
                if ((isWhiteTeam && whiteWon) || (!isWhiteTeam && !whiteWon)) {
                    wins++;
                } else {
                    losses++;
                }
            }
        });

        const totalMatches = wins + losses + draws;
        const winLossRatio = losses > 0 ? (wins / losses).toFixed(2) : wins.toFixed(2);
        const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

        const totalGoalsScored = player.goalsScoredWhite + player.goalsScoredBlack;
        const totalGoalsConceded = player.goalsConcededWhite + player.goalsConcededBlack;
        const goalRatio = totalGoalsConceded > 0 ? (totalGoalsScored / totalGoalsConceded).toFixed(2) : totalGoalsScored.toFixed(2);

        // Sort matches by date (most recent first)
        recentMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
            totalMatches,
            wins,
            losses,
            draws,
            winLossRatio,
            winPercentage,
            totalGoalsScored,
            totalGoalsConceded,
            goalRatio,
            recentMatches
        };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getMatchResult = (match, playerTeam) => {
        if (match.whiteTeamScore === match.blackTeamScore) return 'DRAW';

        const whiteWon = match.whiteTeamScore > match.blackTeamScore;
        const playerWon = (playerTeam === 'white' && whiteWon) || (playerTeam === 'black' && !whiteWon);

        return playerWon ? 'WIN' : 'LOSS';
    };

    const getResultColor = (result) => {
        switch (result) {
            case 'WIN': return '#28a745';
            case 'LOSS': return '#dc3545';
            case 'DRAW': return '#6c757d';
            default: return '#333';
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Loading player statistics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="error">{error}</div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/players" className="btn btn-primary">
                        Back to Players
                    </Link>
                </div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="page-container">
                <div className="error">Player not found</div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/players" className="btn btn-primary">
                        Back to Players
                    </Link>
                </div>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>{player.name}</h1>
                <Link to="/players" className="btn btn-secondary">
                    Back to Players
                </Link>
            </div>

            {/* Overall Statistics */}
            <div className="card">
                <h2 style={{ marginBottom: '2rem', color: '#333', textAlign: 'center' }}>Overall Statistics</h2>

                <div className="grid grid-3">
                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                            {stats.totalMatches}
                        </div>
                        <div style={{ color: '#666', fontSize: '1.1rem' }}>Matches Played</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#d4edda', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                            {stats.wins}
                        </div>
                        <div style={{ color: '#155724', fontSize: '1.1rem' }}>Wins</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8d7da', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>
                            {stats.losses}
                        </div>
                        <div style={{ color: '#721c24', fontSize: '1.1rem' }}>Losses</div>
                    </div>
                </div>

                <div className="grid grid-2" style={{ marginTop: '2rem' }}>
                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#fff3cd', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404', marginBottom: '0.5rem' }}>
                            {stats.winPercentage}%
                        </div>
                        <div style={{ color: '#856404', fontSize: '1.1rem' }}>Win Percentage</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#e2e3e5', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.5rem' }}>
                            {stats.winLossRatio}
                        </div>
                        <div style={{ color: '#6c757d', fontSize: '1.1rem' }}>Win/Loss Ratio</div>
                    </div>
                </div>
            </div>

            {/* Goals Statistics */}
            <div className="card">
                <h2 style={{ marginBottom: '2rem', color: '#333', textAlign: 'center' }}>Goals Statistics</h2>

                <div className="grid grid-3">
                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#d1ecf1', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c5460', marginBottom: '0.5rem' }}>
                            {stats.totalGoalsScored}
                        </div>
                        <div style={{ color: '#0c5460', fontSize: '1.1rem' }}>Goals Scored</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8d7da', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#721c24', marginBottom: '0.5rem' }}>
                            {stats.totalGoalsConceded}
                        </div>
                        <div style={{ color: '#721c24', fontSize: '1.1rem' }}>Goals Conceded</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#e2e3e5', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.5rem' }}>
                            {stats.goalRatio}
                        </div>
                        <div style={{ color: '#6c757d', fontSize: '1.1rem' }}>Goals Ratio</div>
                    </div>
                </div>

                {/* Detailed Goals Breakdown */}
                <div className="grid grid-2" style={{ marginTop: '2rem' }}>
                    <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
                        <h4 style={{ color: '#333', marginBottom: '1rem', textAlign: 'center' }}>Goals by Team</h4>
                        <div className="stat-item">
                            <span className="stat-label">As White Team:</span>
                            <span className="stat-value">{player.goalsScoredWhite}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">As Black Team:</span>
                            <span className="stat-value">{player.goalsScoredBlack}</span>
                        </div>
                    </div>

                    <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
                        <h4 style={{ color: '#333', marginBottom: '1rem', textAlign: 'center' }}>Goals Conceded by Team</h4>
                        <div className="stat-item">
                            <span className="stat-label">As White Team:</span>
                            <span className="stat-value">{player.goalsConcededWhite}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">As Black Team:</span>
                            <span className="stat-value">{player.goalsConcededBlack}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Special Achievements */}
            <div className="card">
                <h2 style={{ marginBottom: '2rem', color: '#333', textAlign: 'center' }}>Special Achievements</h2>

                <div className="grid grid-2">
                    <div className="grid grid-2">
                        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '10px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#856404' }}>{player.playerOfTheMatch}</div>
                            <div style={{ color: '#856404' }}>Player of the Match</div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#d4edda', borderRadius: '10px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚽</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#155724' }}>{player.gamellesScored}</div>
                            <div style={{ color: '#155724' }}>Gamelles Scored</div>
                        </div>
                    </div>

                    <div className="grid grid-2">
                        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '10px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤦</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#721c24' }}>{player.ownGoalsScored}</div>
                            <div style={{ color: '#721c24' }}>Own Goals</div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#e2e3e5', borderRadius: '10px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c757d' }}>{stats.draws}</div>
                            <div style={{ color: '#6c757d' }}>Draws</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Matches */}
            <div className="card">
                <h2 style={{ marginBottom: '2rem', color: '#333', textAlign: 'center' }}>Recent Matches</h2>

                {stats.recentMatches.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem', padding: '2rem' }}>
                        No matches played yet.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats.recentMatches.slice(0, 10).map(match => {
                            const result = getMatchResult(match, match.playerTeam);
                            const resultColor = getResultColor(result);

                            return (
                                <div key={match.id} className="card" style={{ margin: 0, border: '2px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                                {formatDate(match.date)}
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                <span className={match.playerTeam === 'white' ? 'team-white' : 'team-black'}
                                                    style={{ padding: '0.25rem 0.5rem', borderRadius: '5px', marginRight: '0.5rem', fontSize: '0.9rem' }}>
                                                    {match.playerTeam.toUpperCase()}
                                                </span>
                                                {match.whiteTeamScore} - {match.blackTeamScore}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                color: resultColor,
                                                marginBottom: '0.5rem'
                                            }}>
                                                {result}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                                G: {match.playerStats.gamellesScored} | OG: {match.playerStats.ownGoalsScored}
                                                {match.playerStats.isPlayerOfTheMatch && <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>⭐</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <Link
                                                to={`/match/${match.id}`}
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                            >
                                                View Match
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {stats.recentMatches.length > 10 && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <p style={{ color: '#666' }}>
                            Showing 10 most recent matches out of {stats.recentMatches.length} total matches.
                        </p>
                    </div>
                )}
            </div>

            {/* Player Profile Info */}
            <div className="card">
                <h2 style={{ marginBottom: '2rem', color: '#333', textAlign: 'center' }}>Player Profile</h2>

                <div className="stat-item">
                    <span className="stat-label">Player Name:</span>
                    <span className="stat-value">{player.name}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Member Since:</span>
                    <span className="stat-value">{formatDate(player.createdAt)}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Total Matches:</span>
                    <span className="stat-value">{stats.totalMatches}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Average Goals per Match:</span>
                    <span className="stat-value">
                        {stats.totalMatches > 0 ? (stats.totalGoalsScored / stats.totalMatches).toFixed(1) : '0.0'}
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Average Goals Conceded per Match:</span>
                    <span className="stat-value">
                        {stats.totalMatches > 0 ? (stats.totalGoalsConceded / stats.totalMatches).toFixed(1) : '0.0'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsPage;